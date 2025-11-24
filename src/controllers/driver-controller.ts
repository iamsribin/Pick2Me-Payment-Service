import { IDriverWalletService } from '@/services/interface/i-driver-wallet-service';
import { IStripeService } from '@/services/interface/i-stripe-service';
import { TYPES } from '@/types/inversify-types';
import { inject, injectable } from 'inversify';

@injectable()
export class PaymentController {
  constructor(@inject(TYPES.DriverWalletService) private _driverService: IDriverWalletService) {}
}
