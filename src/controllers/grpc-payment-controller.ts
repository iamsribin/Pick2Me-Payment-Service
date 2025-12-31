import { sendUnaryData, ServerUnaryCall } from '@grpc/grpc-js';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/types/inversify-types';
import { IDriverWalletService } from '@/services/interface/i-driver-wallet-service';
import { IUserWalletService } from '@/services/interface/i-user-waller-service';

@injectable()
export class GrpcPaymentController {
  constructor(
    @inject(TYPES.DriverWalletService) private _driverWalletService: IDriverWalletService,
    @inject(TYPES.UserWalletService) private _userWalletService: IUserWalletService
  ) {}

  createDriverConnectAccount = async (
    call: ServerUnaryCall<
      { email: string; driverId: string },
      { accountId: string; accountLinkUrl: string }
    >,
    callback: sendUnaryData<{ accountId: string; accountLinkUrl: string }>
  ): Promise<void> => {
    try {
      const { driverId, email } = call.request;

      const accountData = await this._driverWalletService.createDriverConnectAccount(
        email,
        driverId
      );

      callback(null, accountData);
    } catch (err) {
      console.log(err);
      throw new Error('Stripe account creation failed');
    }
  };

  getUserWalletBalanceAndTransactions = async (
    call: ServerUnaryCall<{ userId: string }, { balance: bigint; transactions: number }>,
    callback: sendUnaryData<{ balance: string; transactions: number }>
  ): Promise<void> => {
    try {
      const response = await this._userWalletService.getUserWalletBalanceAndTransactions(
        call.request.userId
      );

      callback(null, response);
    } catch (error) {
      console.log(error);

      callback(error as Error, null);
    }
  };

  checkDriverOnboardingStatus = async (
    call: ServerUnaryCall<{ driverId: string }, { onboardingStatus: boolean }>,
    callback: sendUnaryData<{ onboardingStatus: boolean }>
  ): Promise<void> => {
    try {
      const response = await this._driverWalletService.checkDriverOnboardingStatus(
        call.request.driverId
      );

      callback(null, response);
    } catch (error) {
      console.log(error);
      callback(error as Error, null);
    }
  };
}
