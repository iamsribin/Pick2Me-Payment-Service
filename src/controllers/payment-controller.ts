import { sendUnaryData, ServerUnaryCall } from '@grpc/grpc-js';
import { ConfirmCashPaymentDto } from '../dto/paymentRes.dto';
import { IPaymentService } from '../services/interface/i-payment-service';
import { PaymentReq } from '../types/request';
import { IncomingHttpHeaders } from 'http';
import { IStripeService } from '../services/interface/i-stripe-service';
import { HttpError, InternalError } from '@pick2me/shared/errors';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/types/inversify-types';
import { IResponse } from '@pick2me/shared/interfaces';
import { IUserWalletService } from '@/services/interface/i-user-waller-service';
import { FastifyReply, FastifyRequest } from 'fastify';

@injectable()
export class PaymentController {
  constructor(
    @inject(TYPES.PaymentService) private _paymentService: IPaymentService,
    @inject(TYPES.StripeService) private _stripeService: IStripeService,
    @inject(TYPES.UserWalletService) private _walletService: IUserWalletService
  ) { }

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

  cashInHandPayment = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const paymentData = request.body as PaymentReq;
      const response = await this._paymentService.ConfirmCashPayment(paymentData);
      return reply.status(200).send(response);
    } catch (error) {
      console.log('errorop=', error);
      if (error instanceof HttpError) throw error;
      throw InternalError('something went wrong');
    }
  };

  //   async CreateCheckoutSession(
  //   call: ServerUnaryCall<PaymentReq, any>,
  //   callback: (error: Error | null, response: any) => void
  // ) {
  //   try {
  //     const result = await this._stripeService.createCheckoutSession(call.request);
  //     callback(null, result);
  //   } catch (error: any) {
  //     InternalError(error);
  //   }
  // }

  // async ConformCashPayment(
  //   call: ServerUnaryCall<
  //     {
  //       bookingId: string;
  //       userId: string;
  //       driverId: string;
  //       amount: number;
  //       idempotencyKey: string;
  //     },
  //     any
  //   >,
  //   callback: sendUnaryData<IResponse<ConformCashPaymentDto>>
  // ) {
  //   try {
  //     const result = await this._paymentService.ConfirmCashPayment(call.request);

  //     callback(null, result);
  //   } catch (error: any) {
  //     InternalError(error, callback);
  //   }
  // }

  walletPayment = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = request.gatewayUser;
      const paymentData = request.body as PaymentReq;
      const response = await this._walletService.transferAmountToDriverStripe(user.id, paymentData);
      return reply.status(200).send(response);
    } catch (error: any) {
      console.log(error);
      if (error instanceof HttpError) throw error;
      throw InternalError('something went wrong');
    }
  };
}
