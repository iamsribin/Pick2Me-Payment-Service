import { stripe } from '@/config/stripe';
import { IDriverWalletService } from '../interface/i-driver-wallet-service';
import { inject, injectable } from 'inversify';
import { BadRequestError, HttpError, InternalError, NotFoundError } from '@pick2me/shared/errors';
import { TYPES } from '@/types/inversify-types';
import { IDriverStripeRepository } from '@/repositories/interfaces/i-driver-strip-repository';

@injectable()
export default class DriverWalletService implements IDriverWalletService {
  constructor(
    @inject(TYPES.DriverStripeRepository) private _driverStripRepo: IDriverStripeRepository
  ) {}

  async createDriverConnectAccount(
    email: string,
    driverId: string
  ): Promise<{ accountId: string; accountLinkUrl: string }> {
    try {
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US',
        email: email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'individual',
        metadata: {
          driver_id: driverId,
        },
      });

      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${process.env.FRONTEND_URL}/driver/wallet`,
        return_url: `${process.env.FRONTEND_URL}/driver/wallet`,
        type: 'account_onboarding',
      });

      await this._driverStripRepo.create({
        account_id: account.id,
        accountLink: accountLink.url,
        driverId,
        email,
      });

      return { accountId: account.id, accountLinkUrl: accountLink.url };
    } catch (error) {
      console.log(error);
      throw new Error('Stripe account creation failed');
    }
  }

  async getDriverWalletDetails(driverId: string) {
    try {
      const driverStripe = await this._driverStripRepo.findOne({ driverId });

      if (!driverStripe) {
        return {
          hasAccount: false,
          message: 'No Stripe account found. Please contact admin.',
        };
      }

      const account = await stripe.accounts.retrieve(driverStripe.account_id);

      if (!account.details_submitted) {
        return {
          hasAccount: true,
          onboardingComplete: false,
          accountLinkUrl: driverStripe.accountLink,
          accountId: account.id,
        };
      }

      const balance = await stripe.balance.retrieve({
        stripeAccount: driverStripe.account_id,
      });

      const payouts = await stripe.payouts.list(
        { limit: 10 },
        { stripeAccount: driverStripe.account_id }
      );

      const transfers = await stripe.transfers.list({ limit: 10 });

      const driverTransfers = transfers.data.filter(
        (transfer) => transfer.destination === driverStripe.account_id
      );

      return {
        hasAccount: true,
        onboardingComplete: true,
        accountId: account.id,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        balance: {
          available: balance.available,
          pending: balance.pending,
        },
        transactions: {
          payouts: payouts.data,
          transfers: driverTransfers,
        },
        email: account.email,
      };
    } catch (error) {
      console.log(error);
      if (error instanceof HttpError) throw error;
      throw InternalError('something went wrong');
    }
  }

  async refreshOnboardingLink(driverId: string) {
    try {
      const driverStripe = await this._driverStripRepo.findOne({ driverId });
      if (!driverStripe) throw NotFoundError('Driver Stripe account not found');

      const accountLink = await stripe.accountLinks.create({
        account: driverStripe.account_id,
        refresh_url: `${process.env.FRONTEND_URL}/driver/wallet`,
        return_url: `${process.env.FRONTEND_URL}/driver/wallet`,
        type: 'account_onboarding',
      });

      await this._driverStripRepo.update(driverId, { accountLink: accountLink.url });

      return {
        accountLinkUrl: accountLink.url,
      };
    } catch (error) {
      console.log(error);
      if (error instanceof HttpError) throw error;
      throw InternalError('something went wrong');
    }
  }

  async checkDriverOnboardingStatus(driverId: string): Promise<{ onboardingStatus: boolean }> {
    try {
      const driverStripe = await this._driverStripRepo.findOne({ driverId });

      if (!driverStripe) {
        return {
          onboardingStatus: false,
        };
      }

      const account = await stripe.accounts.retrieve(driverStripe.account_id);

      if (!account.details_submitted) {
        return {
          onboardingStatus: false,
        };
      }

      return { onboardingStatus: true };
    } catch (error) {
      if (error instanceof HttpError) throw error;
      throw InternalError('something went wrong');
    }
  }

  async stripeOnboardingView(driverId: string) {
    try {
      const driverStripe = await this._driverStripRepo.findOne({ driverId });
      if (!driverStripe) throw NotFoundError('Driver Stripe account not found');

      const account = await stripe.accounts.retrieve(driverStripe.account_id);

      return {
        accountId: account.id,
        onboardingComplete: account.details_submitted,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
        requirements: account.requirements,
        accountLinkUrl: driverStripe.accountLink,
      };
    } catch (error) {
      console.log(error);
      if (error instanceof HttpError) throw error;
      throw InternalError('something went wrong');
    }
  }

  async getPlatformAvailableBalance(currency = 'usd') {
    const balance = await stripe.balance.retrieve();
    const available = balance.available || [];
    const entry = available.find((e: any) => e.currency === currency);
    return entry ? entry.amount : 0;
  }

  async addFundsToDriverAccount(
    driverId: string,
    amount: number,
    opts?: { currency?: string; description?: string }
  ): Promise<{ success: boolean; transferId?: string; raw?: any }> {
    const currency = opts?.currency ?? 'usd';
    const description = opts?.description ?? `Manual transfer to driver ${driverId}`;

    try {
      if (!amount || amount <= 0) throw BadRequestError('Invalid amount');

      const driverStripe = await this._driverStripRepo.findOne({ driverId });
      if (!driverStripe) throw NotFoundError('Driver Stripe account not found');

      const account = await stripe.accounts.retrieve(driverStripe.account_id);
      const transfersStatus = account.capabilities?.transfers;

      if (transfersStatus !== 'active') {
        throw BadRequestError(
          `Driver cannot receive payouts yet. Transfer status: ${transfersStatus}. choose another payment option`
        );
      }

      const amountCents = Math.round(amount);

      const platformFee = Math.round(amountCents * 0.2);
      const driverShare = amountCents - platformFee;

      console.log({ platformFee, driverShare });

      const available = await this.getPlatformAvailableBalance(currency);
      if (available < driverShare) {
        console.warn('Insufficient platform balance', {
          required: driverShare,
          available,
          currency,
          request_log_hint: 'See Stripe logs for request details',
        });
        throw BadRequestError(
          'Platform does not have enough funds to pay the driver. Please select another payment method'
        );
      }

      const transfer = await stripe.transfers.create({
        amount: driverShare,
        currency,
        destination: driverStripe.account_id,
        description,
      });

      return { success: true, transferId: transfer.id, raw: transfer };
    } catch (err: any) {
      console.log('addFundsToDriverAccount error', {
        message: err?.message,
        code: (err as any)?.raw?.code || (err as any).code,
        stripeRequestLog: (err as any)?.raw?.request_log_url,
      });

      if (err instanceof HttpError) throw err;

      if ((err as any).raw && (err as any).raw.code === 'balance_insufficient') {
        throw BadRequestError(
          'Platform has insufficient funds to complete payout. Please choose another payment method.'
        );
      }

      throw InternalError('Failed to add funds to driver account');
    }
  }
}
