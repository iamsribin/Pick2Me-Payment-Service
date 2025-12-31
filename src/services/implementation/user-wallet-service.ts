import { IUserWalletService } from '../interface/i-user-waller-service';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/types/inversify-types';
import { IWalletRepository } from '@/repositories/interfaces/i-wallet-repository';
import { BadRequestError, InternalError, NotFoundError } from '@Pick2Me/shared/errors';
import { WalletTransaction } from '@/entity/wallet-transaction.entity';
import { Wallet } from '@/entity/wallet.entity';
import { stripe } from '@/config/stripe';
import { IDriverStripeRepository } from '@/repositories/interfaces/i-driver-strip-repository';
import { convertCurrency, getAvailableBalanceForCurrency } from '@/utils/currency';
import { AddEarningsRequest, EventProducer } from '@/events/publisher';
import { PaymentReq } from '@/types/request';

@injectable()
export class UserWalletService implements IUserWalletService {
  constructor(
    @inject(TYPES.WalletRepository) private _walletRepository: IWalletRepository,
    @inject(TYPES.DriverStripeRepository) private _driverStripRepo: IDriverStripeRepository
  ) {}

  createWalletForUser = async (data: {
    userId: string;
    email: string;
    createdAt: string;
  }): Promise<void> => {
    await this._walletRepository.createIfNotExists(data.userId);
    console.log('wallet created successfully');
  };

  getUserWalletBalanceAndTransactions = async (
    userId: string
  ): Promise<{ balance: string; transactions: number }> => {
    const response = await this._walletRepository.getUserWalletBalanceAndTransactions(
      userId,
      'INR'
    );
    return { balance: response.balance.toString(), transactions: response.transactions };
  };

  addRewardAmountToUserWallet = async (userId: string): Promise<void> => {
    console.log('user id', userId);

    await this._walletRepository.addRewardAmountToUserWallet(userId, 100);
    return Promise.resolve();
  };

  transferAmountToDriverStripe = async (userId: string, paymentData: PaymentReq): Promise<void> => {
    const { amount: rawAmount, bookingId, driverId } = paymentData ?? {};
    if (!rawAmount || rawAmount <= 0) throw BadRequestError('Invalid payment amount');
    if (!bookingId) throw BadRequestError('Booking reference missing');
    if (!driverId) throw BadRequestError('Driver reference missing');

    const amount = BigInt(Math.round(rawAmount));
    const idempotencyKey = String(bookingId);

    const transferCurrency = 'gbp';

    let pendingTxId: string | undefined;
    let walletId: string | undefined;

    const reserveRunner = this._walletRepository.createQueryRunner();
    await reserveRunner.connect();
    await reserveRunner.startTransaction();
    try {
      const wallet = await this._walletRepository.getForUpdate(reserveRunner, userId, 'INR');
      if (!wallet) throw BadRequestError('WALLET_NOT_FOUND');

      const available = (wallet.balance as bigint) - (wallet.reserved as bigint);
      console.log({ available, amount });

      if (available < amount) throw new Error('INSUFFICIENT_FUNDS');

      const pending = reserveRunner.manager.create(WalletTransaction, {
        walletId: wallet.id,
        userId,
        direction: 'debit',
        amount: amount.toString(),
        status: 'pending',
        idempotencyKey,
        reason: 'Ride payment (pending)',
        metadata: { driverId, bookingId },
        currency: wallet.currency,
        balanceBefore: wallet.balance,
        reservedBefore: wallet.reserved,
      } as any);

      const savedPending = await reserveRunner.manager.save(pending);

      await reserveRunner.manager.update(Wallet, { id: wallet.id } as any, {
        reserved: (wallet.reserved as bigint) + amount,
      });

      pendingTxId = savedPending.id;
      walletId = wallet.id;

      await reserveRunner.commitTransaction();
    } catch (err) {
      await reserveRunner.rollbackTransaction();
      if ((err as Error).message === 'INSUFFICIENT_FUNDS') {
        throw BadRequestError('Insufficient wallet balance');
      }
      throw err;
    } finally {
      await reserveRunner.release();
    }

    let transferAmountInMinor: bigint;
    try {
      transferAmountInMinor = await convertCurrency(amount, 'INR', transferCurrency);
    } catch (err) {
      await this._walletRepository.applyTransaction({
        userId,
        amount,
        direction: 'credit',
        reason: 'Conversion failure compensation',
        idempotencyKey: `compensate:${idempotencyKey}:${userId}`,
      });
      throw InternalError('Currency conversion failed');
    }

    // platform fee 20%
    const platformFee = (transferAmountInMinor * 20n) / 100n;
    const driverShare = transferAmountInMinor - platformFee;

    const availableInTransferCurrency = await getAvailableBalanceForCurrency(transferCurrency);

    if (availableInTransferCurrency < driverShare) {
      const compensateRunner = this._walletRepository.createQueryRunner();
      await compensateRunner.connect();
      await compensateRunner.startTransaction();
      try {
        if (pendingTxId) {
          await compensateRunner.manager.update(WalletTransaction, { id: pendingTxId } as any, {
            status: 'failed',
            metadata: {
              originalBookingId: bookingId,
              error: 'Insufficient platform funds in transfer currency',
            },
          });
        }
        if (walletId) {
          const wallet = await compensateRunner.manager.findOne(Wallet, {
            where: { id: walletId } as any,
          });
          if (wallet) {
            await compensateRunner.manager.update(Wallet, { id: wallet.id } as any, {
              reserved: (wallet.reserved as bigint) - amount,
            });
          }
        }
        await compensateRunner.commitTransaction();
      } catch (compErr) {
        await compensateRunner.rollbackTransaction();
        console.error('compensation failed', compErr);
        throw InternalError('Platform has insufficient funds and compensation failed');
      } finally {
        await compensateRunner.release();
      }

      throw BadRequestError(`Platform has insufficient ${transferCurrency.toUpperCase()} funds`);
    }

    let stripeTransferId: string | undefined;
    try {
      const driverStripe = await this._driverStripRepo.findOne({ driverId });
      if (!driverStripe) throw NotFoundError('Driver Stripe account not found');

      if (driverShare > BigInt(Number.MAX_SAFE_INTEGER)) {
        throw InternalError('Transfer amount too large for JS number conversion');
      }

      const transfer = await stripe.transfers.create(
        {
          amount: Number(driverShare),
          currency: transferCurrency,
          destination: driverStripe.account_id,
          description: `Ride ${bookingId} payout to driver ${driverId}`,
        },
        { idempotencyKey: `transfer:${idempotencyKey}:${userId}` }
      );

      stripeTransferId = transfer.id;
    } catch (err) {
      const compensateRunner = this._walletRepository.createQueryRunner();
      await compensateRunner.connect();
      await compensateRunner.startTransaction();
      try {
        if (pendingTxId) {
          await compensateRunner.manager.update(WalletTransaction, { id: pendingTxId } as any, {
            status: 'failed',
            metadata: { originalBookingId: bookingId, error: (err as any)?.message || String(err) },
          });
        }
        if (walletId) {
          const wallet = await compensateRunner.manager.findOne(Wallet, {
            where: { id: walletId } as any,
          });
          if (wallet) {
            await compensateRunner.manager.update(Wallet, { id: wallet.id } as any, {
              reserved: (wallet.reserved as bigint) - amount,
            });
          }
        }
        await compensateRunner.commitTransaction();
      } catch (compErr) {
        await compensateRunner.rollbackTransaction();
        console.error('compensation failed after stripe error', { compErr, originalErr: err });
        throw InternalError(
          'Payment failed and compensation could not be completed. Contact support.'
        );
      } finally {
        await compensateRunner.release();
      }
      throw BadRequestError(
        'Failed to transfer amount to driver. Please choose another payment method'
      );
    }

    const settleRunner = this._walletRepository.createQueryRunner();
    await settleRunner.connect();
    await settleRunner.startTransaction();
    try {
      const pending = await settleRunner.manager.findOne(WalletTransaction, {
        where: { idempotencyKey, userId } as any,
      });
      if (!pending) throw new Error('TX_NOT_FOUND');

      const wallet = await settleRunner.manager.findOne(Wallet, {
        where: { id: pending.walletId } as any,
      });
      if (!wallet) throw new Error('WALLET_NOT_FOUND_ON_SETTLE');

      const newReserved = (wallet.reserved as bigint) - amount;
      const newBalance = (wallet.balance as bigint) - amount;

      await settleRunner.manager.update(Wallet, { id: wallet.id } as any, {
        reserved: newReserved,
        balance: newBalance,
      });

      await settleRunner.manager.update(WalletTransaction, { id: pending.id } as any, {
        status: 'settled',
        metadata: { ...(pending.metadata || {}), stripeTransferId },
        balanceAfter: newBalance,
        reservedAfter: newReserved,
      });

      await settleRunner.commitTransaction();
      const eventPayload: AddEarningsRequest = {
        driverId,
        userId,
        driverShare,
        platformFee,
        bookingId,
        isAddCommission: false,
        paymentStatus: 'Completed',
        paymentMode: 'Wallet',
      };
      EventProducer.MarkPaymentCompleted(eventPayload);

      return;
    } catch (err) {
      await settleRunner.rollbackTransaction();
      console.error('settle failed after successful stripe transfer', {
        err,
        bookingId,
        userId,
        stripeTransferId,
      });
      throw InternalError(
        'Payment completed but finalization failed. Support will reconcile this payment.'
      );
    } finally {
      await settleRunner.release();
    }
  };
}
