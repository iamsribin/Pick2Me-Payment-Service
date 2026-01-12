import { ITransaction } from '../../models/transaction.modal';
import { stripe } from '../../config/stripe';
import { randomUUID } from 'crypto';
import { StripeCheckoutSessionRes } from '../../types/response';
import { PaymentReq } from '../../types/request';
import { IncomingHttpHeaders } from 'http';
import Stripe from 'stripe';
import { IStripeService } from '../interface/i-stripe-service';
import {
  addDriverEarnings,
  getDriverStripeFromDriverService,
  markBookingAsPaid,
} from '../../grpc/clients/booking-client';
import { ConfirmCashPaymentDto } from '../../dto/paymentRes.dto';
import { StatusCode } from '@pick2me/shared/interfaces';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/types/inversify-types';
// import { ITransactionRepository } from '@/repositories/interfaces/repository';
import { getRedisService } from '@pick2me/shared/redis';

@injectable()
export class StripeService implements IStripeService {
  // constructor(
  //   @inject(TYPES.TransactionRepository)
  //   private _transactionRepository: ITransactionRepository
  // ) { }
  async createCheckoutSession(data: PaymentReq): Promise<StripeCheckoutSessionRes> {
    const kjs: StripeCheckoutSessionRes = {
      message: 'klkj',
      status: 200,
      sessionId: 'akjdsal',
    };
    return Promise.resolve(kjs);
  }

  async handleStripeWebhook(
    rawBody: Buffer,
    headers: IncomingHttpHeaders
  ): Promise<ConfirmCashPaymentDto> {
    const kjs: ConfirmCashPaymentDto = {
      message: 'klkj',
      status: 200,
    };
    return Promise.resolve(kjs);
  }

  // async createCheckoutSession(data: PaymentReq): Promise<StripeCheckoutSessionRes> {
  //   try {
  //     // basic validation
  //     if (
  //       !data ||
  //       !data.bookingId ||
  //       !data.userId ||
  //       !data.driverId ||
  //       !Number.isFinite(data.amount) ||
  //       data.amount <= 0
  //     ) {
  //       return {
  //         status: StatusCode.BadRequest,
  //         message: 'Invalid payment request',
  //       };
  //     }

  //     const idempotencyKey = `booking_${data.bookingId}`;

  //     // convert to smallest currency unit
  //     const cents = Math.round(data.amount * 100);
  //     const platformFeeCents = Math.round(cents * 0.2);
  //     const driverShareCents = cents - platformFeeCents;

  //     //Redis cache
  //     const redisRepo = getRedisService();
  //     let driverDetails = (await redisRepo.getOnlineDriverDetails(data.driverId)) as any;

  //     console.log('driverDetails redis', driverDetails);

  //     if (!driverDetails) {
  //       // fallback: call driver service via gRPC
  //       try {
  //         driverDetails = await getDriverStripeFromDriverService(data.driverId);
  //       } catch (err: any) {
  //         console.warn('Failed to fetch driver from driver service', {
  //           driverId: data.driverId,
  //           err: err?.message ?? err,
  //         });
  //       }
  //     }

  //     if (!driverDetails?.stripeId) {
  //       return {
  //         status: StatusCode.BadRequest,
  //         message: 'Driver not onboarded for Stripe payouts',
  //       };
  //     }

  //     // verify connected account is ready on Stripe
  //     try {
  //       const acct = await stripe.accounts.retrieve(driverDetails.stripeId);

  //       if (!acct || !acct.charges_enabled) {
  //         console.warn('Driver stripe account not ready', {
  //           driverId: data.driverId,
  //           stripeId: driverDetails.stripeId,
  //         });
  //         return {
  //           status: StatusCode.BadRequest,
  //           message: 'Driver Stripe account not ready',
  //         };
  //       }
  //     } catch (err: any) {
  //       console.error('Failed to validate driver stripe account', {
  //         stripeId: driverDetails.stripeId,
  //         err: err?.message ?? err,
  //       });
  //       return {
  //         status: StatusCode.InternalServerError,
  //         message: 'Failed to validate driver Stripe account',
  //       };
  //     }

  //     // transaction creation / idempotency
  //     let transaction = (await this._transactionRepository.findByIdempotencyKey(
  //       idempotencyKey
  //     )) as ITransaction | null;

  //     if (transaction) {
  //       switch (transaction.status) {
  //         case 'completed':
  //           return {
  //             status: StatusCode.Conflict,
  //             message: 'Payment already processed',
  //           };
  //         case 'pending':
  //           if (transaction.stripeSessionId)
  //             return {
  //               status: StatusCode.Conflict,
  //               message: 'Payment already in progress',
  //               sessionId: transaction.stripeSessionId,
  //             };
  //           return {
  //             status: StatusCode.Conflict,
  //             message: 'Payment already in progress',
  //           };
  //         case 'failed':
  //           await this._transactionRepository.update(transaction.transactionId, {
  //             status: 'pending',
  //             amount: data.amount,
  //             adminShare: platformFeeCents,
  //             driverShare: driverShareCents,
  //           });
  //           break;
  //         default:
  //           return {
  //             status: StatusCode.InternalServerError,
  //             message: 'Invalid transaction state',
  //           };
  //       }
  //     } else {
  //       transaction = (await this._transactionRepository.create({
  //         bookingId: data.bookingId,
  //         userId: data.userId,
  //         driverId: data.driverId,
  //         transactionId: randomUUID(),
  //         amount: data.amount,
  //         paymentMethod: 'stripe',
  //         status: 'pending',
  //         adminShare: platformFeeCents,
  //         driverShare: driverShareCents,
  //         idempotencyKey,
  //       })) as ITransaction;
  //     }

  //     // create Checkout Session with destination + application_fee_amount
  //     const session = await stripe.checkout.sessions.create({
  //       payment_method_types: ['card'],
  //       line_items: [
  //         {
  //           price_data: {
  //             currency: 'usd',
  //             product_data: { name: 'Ride Payment' },
  //             unit_amount: cents,
  //           },
  //           quantity: 1,
  //         },
  //       ],
  //       mode: 'payment',
  //       payment_intent_data: {
  //         application_fee_amount: platformFeeCents,
  //         transfer_data: { destination: driverDetails.stripeId },
  //       },
  //       success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
  //       cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
  //       metadata: {
  //         bookingId: data.bookingId,
  //         userId: data.userId,
  //         driverId: data.driverId,
  //         localTransactionId: transaction.transactionId,
  //         adminShare: platformFeeCents,
  //         driverShare: driverShareCents,
  //       },
  //     });

  //     await this._transactionRepository.update(transaction.transactionId, {
  //       stripeSessionId: session.id,
  //     });

  //     return {
  //       status: StatusCode.OK,
  //       message: 'Checkout session created',
  //       sessionId: session.id,
  //     };
  //   } catch (err: any) {
  //     console.log(err);

  //     try {
  //       if (data?.bookingId) {
  //         await this._transactionRepository.updateStatusByKey(
  //           `booking_${data.bookingId}`,
  //           'failed'
  //         );
  //       }
  //     } catch (upErr) {
  //       console.error('Failed to update transaction status after stripe error', {
  //         error: upErr,
  //       });
  //     }
  //     return {
  //       status: StatusCode.InternalServerError,
  //       message: err?.message ?? 'Failed to create checkout session',
  //     };
  //   }
  // }

  // async handleStripeWebhook(
  //   rawBody: Buffer,
  //   headers: IncomingHttpHeaders
  // ): Promise<ConformCashPaymentDto> {
  //   const sig = (headers['stripe-signature'] as string) || '';
  //   const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  //   if (!sig || !webhookSecret) {
  //     throw new Error('Missing stripe signature or webhook secret');
  //   }

  //   let event: Stripe.Event;
  //   try {
  //     event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  //   } catch (err: any) {
  //     const e = new Error(`Invalid stripe signature: ${err?.message ?? 'unknown'}`);
  //     throw e;
  //   }

  //   const session = event.data.object as Stripe.Checkout.Session;
  //   const paymentIntentId = session.payment_intent;
  //   const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId as string);

  //   const { bookingId, userId, driverId, localTransactionId, adminShare, driverShare } =
  //     session.metadata || {};

  //   if (paymentIntent.status === 'succeeded') {
  //     await this._transactionRepository.update(localTransactionId, {
  //       status: 'completed',
  //       updatedAt: new Date(),
  //     });

  //     await markBookingAsPaid(bookingId, localTransactionId);
  //     await addDriverEarnings(
  //       driverId,
  //       Number(adminShare),
  //       Number(driverShare),
  //       localTransactionId,
  //       bookingId
  //     );

  //     const data = {
  //       bookingId,
  //       userId,
  //       driverId,
  //       amount: Number(adminShare) + Number(driverShare),
  //     };

  //     // RabbitMQPublisher.publish('payment.completed', data);

  //     return {
  //       status: StatusCode.OK,
  //       message: 'Cash payment confirmed successfully',
  //     };
  //   } else {
  //     await this._transactionRepository.update(localTransactionId, {
  //       status: 'failed',
  //       updatedAt: new Date(),
  //     });
  //     throw new Error('Something went wrong');
  //   }
  // }
}
