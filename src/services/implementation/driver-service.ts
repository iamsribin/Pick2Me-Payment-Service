import { stripe } from '@/config/stripe';
import { IDriverWalletService } from '../interface/i-driver-wallet-service';
import { inject, injectable } from 'inversify';
import { HttpError, InternalError, NotFoundError } from '@Pick2Me/shared/errors';
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
      const account = stripe.accounts.create({
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

      const account_id = (await account).id;

      const accountLink = await stripe.accountLinks.create({
        account: account_id,
        refresh_url: `${process.env.FRONTEND_URL}/onboard/refresh`,
        return_url: `${process.env.FRONTEND_URL}/onboard/complete`,
        type: 'account_onboarding',
      });

      return { accountId: account_id, accountLinkUrl: accountLink.url };
    } catch (error) {
      throw new Error('Stripe account creation failed');
    }
  }

  async stripeOnboardingView(driverId: string) {
    try {
      const driverStripe = await this._driverStripRepo.findOne({ driverId });
      if (!driverStripe) throw NotFoundError('driver not found');

      const account = await stripe.accounts.retrieve(driverStripe.account_id);

      const req = account.requirements;
      const requirements_due =
        (req?.past_due?.length ?? 0) > 0 ||
        (req?.eventually_due?.length ?? 0) > 0 ||
        (req?.currently_due?.length ?? 0) > 0;

      return {
        status: 'onboarded',
        details_submitted: account.details_submitted,
        payouts_enabled: account.payouts_enabled,
        charges_enabled: account.charges_enabled,
        requirements_due,
        detail: 'Stripe account linked.',
      };
    } catch (error) {
      if (error instanceof HttpError) throw error;
      throw InternalError('something went wrong');
    }
  }
}
