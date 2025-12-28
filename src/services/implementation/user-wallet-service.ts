import { IUserWalletService } from '../interface/i-user-waller-service';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/types/inversify-types';
import { IWalletRepository } from '@/repositories/interfaces/i-wallet-repository';
import { BadRequestError, InternalError } from '@Pick2Me/shared/errors';

@injectable()
export class UserWalletService implements IUserWalletService {
  constructor(@inject(TYPES.WalletRepository) private _walletRepository: IWalletRepository) { }

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

  doPayment = async (userId: string, paymentData: any): Promise<void> => {
    if (!paymentData?.amount || paymentData.amount <= 0) {
      throw BadRequestError('Invalid payment amount');
    }

    if (!paymentData?.bookingId) {
      throw BadRequestError('Booking reference missing');
    }

    const queryRunner = this._walletRepository.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const amount = BigInt(paymentData.amount);
      const idempotencyKey = paymentData.bookingId;

      const wallet = await this._walletRepository.findOne({ userId });
      const balance = wallet?.balance || 0;
      if (balance < amount) BadRequestError('insufficient balance ');

      const result = await this._walletRepository.applyTransactionTransactional({
        queryRunner,
        userId,
        amount,
        direction: 'debit',
        reason: 'Ride payment',
        referenceType: 'booking',
        referenceId: paymentData.bookingId,
        idempotencyKey,
        metadata: {
          driverId: paymentData.driverId,
        },
      });

      if (result.alreadyApplied) {
        await queryRunner.commitTransaction();
        return;
      }
        
      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();

      if (err instanceof Error) {
        if (err.message === 'INSUFFICIENT_FUNDS') {
          throw BadRequestError('Insufficient wallet balance');
        }
        throw err;
      }

      throw InternalError('Payment processing failed');
    } finally {
      await queryRunner.release();
    }
  };


}
