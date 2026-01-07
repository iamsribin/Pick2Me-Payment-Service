import { IDriverWalletService } from '@/services/interface/i-driver-wallet-service';
import { IStripeService } from '@/services/interface/i-stripe-service';
import { TYPES } from '@/types/inversify-types';
import { HttpError, InternalError } from '@pick2me/shared/errors';
import { inject, injectable } from 'inversify';

@injectable()
export class DriverController {
  constructor(@inject(TYPES.DriverWalletService) private _driverService: IDriverWalletService) {}

  async getOnboardView(request, reply) {
    try {
      const driver = request.gatewayUser;
      const response = await this._driverService.stripeOnboardingView(driver.id);

      return reply.status(200).send(response);
    } catch (error) {
      console.log(error);
      if (error instanceof HttpError) throw error;
      throw InternalError('something went wrong');
    }
  }

  async getWalletDetails(request, reply) {
    try {
      const driver = request.gatewayUser;
      const walletData = await this._driverService.getDriverWalletDetails(driver.id);
      console.log('walletData', walletData);

      return reply.status(200).send(walletData);
    } catch (error) {
      console.log(error);
      if (error instanceof HttpError) throw error;
      throw InternalError('something went wrong');
    }
  }

  async refreshOnboardingLink(request, reply) {
    try {
      const driver = request.gatewayUser;
      const response = await this._driverService.refreshOnboardingLink(driver.id);
      console.log('response', response);

      return reply.status(200).send(response);
    } catch (error) {
      console.log(error);
      if (error instanceof HttpError) throw error;
      throw InternalError('something went wrong');
    }
  }
}

//   const response = await this._driverService.createDriverConnectAccount(
//     'amalm2495@gmail.com',
//     driver.id
//   );
