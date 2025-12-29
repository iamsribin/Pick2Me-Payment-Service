import { sendUnaryData, ServerUnaryCall } from '@grpc/grpc-js';
import { ConformCashPaymentDto } from '../dto/paymentRes.dto';
import { IPaymentService } from '../services/interface/i-payment-service';
import { PaymentReq } from '../types/request';
import { IncomingHttpHeaders } from 'http';
import { IStripeService } from '../services/interface/i-stripe-service';
import { HttpError, InternalError } from '@Pick2Me/shared/errors';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/types/inversify-types';
import { IResponse } from '@Pick2Me/shared/interfaces';
import { IUserWalletService } from '@/services/interface/i-user-waller-service';

@injectable()
export class PaymentController {
  constructor(
    @inject(TYPES.PaymentService) private _paymentService: IPaymentService,
    @inject(TYPES.StripeService) private _stripeService: IStripeService,
    @inject(TYPES.UserWalletService) private _walletService: IUserWalletService,
  ) { }

  async CreateCheckoutSession(
    call: ServerUnaryCall<PaymentReq, any>,
    callback: (error: Error | null, response: any) => void
  ) {
    try {
      const result = await this._stripeService.createCheckoutSession(call.request);
      callback(null, result);
    } catch (error) {
      InternalError(error, callback);
    }
  }

  async handleStripeWebhook(rawBody: Buffer, headers: IncomingHttpHeaders): Promise<void> {
    if (!rawBody || !headers) {
      throw new Error('Missing webhook payload or headers');
    }

    try {
      await this._stripeService.handleStripeWebhook(rawBody, headers);
    } catch (err: any) {
      console.error('PaymentController.handleStripeWebhook error', {
        error: err?.message ?? err,
      });
      throw err;
    }
  }

  async ConformCashPayment(
    call: ServerUnaryCall<
      {
        bookingId: string;
        userId: string;
        driverId: string;
        amount: number;
        idempotencyKey: string;
      },
      any
    >,
    callback: sendUnaryData<IResponse<ConformCashPaymentDto>>
  ) {
    try {
      const result = await this._paymentService.ConfirmCashPayment(call.request);

      callback(null, result);
    } catch (error) {
      InternalError(error, callback);
    }
  }

  walletPayment = async (request, reply) => {
    try {
      const user = request.gatewayUser;
      const paymentData = request.body;
      const response = await this._walletService.transferAmountToDriverStripe(user.id, paymentData);
      return reply.status(200).send(response);
    } catch (error) {
      console.log(error);
      if (error instanceof HttpError) throw error;
      throw InternalError('something went wrong');
    }
  };
}
