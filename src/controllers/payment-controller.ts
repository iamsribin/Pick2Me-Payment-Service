import { IPaymentService } from '../services/interface/i-payment-service';
import { PaymentReq } from '../types/request';
import { IncomingHttpHeaders } from 'http';
import { IStripeService } from '../services/interface/i-stripe-service';
import { HttpError, InternalError } from '@pick2me/shared/errors';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/types/inversify-types';
import { StatusCode } from '@pick2me/shared/interfaces';
import { IUserWalletService } from '@/services/interface/i-user-waller-service';
import { FastifyReply, FastifyRequest } from 'fastify';

@injectable()
export class PaymentController {
  constructor(
    @inject(TYPES.PaymentService) private _paymentService: IPaymentService,
    @inject(TYPES.StripeService) private _stripeService: IStripeService,
    @inject(TYPES.UserWalletService) private _walletService: IUserWalletService
  ) { }

  handleStripeWebhook = async (
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> => {
    const rawBody = request.body as Buffer;
    const headers = request.headers;

    if (!rawBody || !Buffer.isBuffer(rawBody)) {
      throw new Error('Missing raw body');
    }

    await this._stripeService.handleStripeWebhook(rawBody, headers);

    reply.code(200).send({ received: true });
  };

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

  createCheckoutSession = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const paymentData = request.body as PaymentReq;
      const result = await this._stripeService.createCheckoutSession(paymentData);
      return reply.status(StatusCode.OK).send(result);
    } catch (error: any) {
      console.log("error", error);

      if (error instanceof HttpError) throw error;
      throw InternalError('something went wrong');
    }
  };

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
