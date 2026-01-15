import { stripe } from '../../config/stripe';
import { randomUUID } from 'crypto';
import { StripeCheckoutSessionRes } from '../../types/response';
import { PaymentReq } from '../../types/request';
import { IncomingHttpHeaders } from 'http';
import Stripe from 'stripe';
import { IStripeService } from '../interface/i-stripe-service';
import {
  addDriverEarnings,
  markBookingAsPaid,
  PaymentData,
} from '../../grpc/clients/booking-client';
import { commonRes, StatusCode } from '@pick2me/shared/interfaces';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/types/inversify-types';
import { ITransaction } from '@/repositories/interfaces/i-transaction-repository';
import { getRedisService } from '@pick2me/shared/redis';
import { BadRequestError, ConflictError, InternalError } from '@pick2me/shared/errors';
import { PaymentMethod, TransactionStatus } from '@/entity/transaction.entity';
import { IDriverStripeRepository } from '@/repositories/interfaces/i-driver-strip-repository';

@injectable()
export class StripeService implements IStripeService {
  constructor(
    @inject(TYPES.TransactionRepository,) private _transactionRepository: ITransaction,
    @inject(TYPES.DriverStripeRepository) private _driverStripeRepository: IDriverStripeRepository
  ) { }

  async createCheckoutSession(data: PaymentReq): Promise<StripeCheckoutSessionRes> {
    try {
      // basic validation
      if (
        !data ||
        !data.bookingId ||
        !data.userId ||
        !data.driverId ||
        !Number.isFinite(data.amount) ||
        data.amount <= 0
      ) {
        throw BadRequestError('Invalid payment request');
      }

      const idempotencyKey = `booking_${data.bookingId}`;

      // convert to smallest currency unit
      const cents = Math.round(data.amount * 100);
      const platformFeeCents = Math.round(cents * 0.2);
      const driverShareCents = cents - platformFeeCents;

      //Redis cache
      const redisRepo = getRedisService();
      let driverDetails = (await redisRepo.getOnlineDriverDetails(data.driverId)) as any;

      console.log('driverDetails redis', driverDetails);

      if (!driverDetails) {
        // fallback: call driver service via gRPC
        try {
          driverDetails = await this._driverStripeRepository.findOne({ driverId: data.driverId });
        } catch (err: any) {
          console.warn('Failed to fetch driver from driver service', {
            driverId: data.driverId,
            err: err?.message ?? err,
          });
        }
      }

      if (!driverDetails?.account_id) {
        throw BadRequestError('Driver not onboarded for Stripe payouts');
      }

      // verify connected account is ready on Stripe
      try {
        const acct = await stripe.accounts.retrieve(driverDetails.account_id);

        if (!acct || !acct.charges_enabled) {
          console.warn('Driver stripe account not ready', {
            driverId: data.driverId,
            account_id: driverDetails.account_id,
          });
          throw BadRequestError('Driver Stripe account not ready');
        }
      } catch (err: any) {
        console.error('Failed to validate driver stripe account', {
          account_id: driverDetails.account_id,
          err: err?.message ?? err,
        });
        throw InternalError('Failed to validate driver Stripe account');
      }

      let transaction = await this._transactionRepository.findOne({ idempotencyKey: idempotencyKey });

      if (transaction) {
        switch (transaction.status) {
          case 'completed':
            throw ConflictError('Payment already processed');
          case 'pending':
            if (transaction.stripeSessionId)
              throw ConflictError('Payment already in progress');
            throw ConflictError('Payment already in progress');
          case 'failed':
            await this._transactionRepository.update(transaction.id, {
              status: TransactionStatus.FAILED,
              amount: BigInt(data.amount),
              adminShare: BigInt(platformFeeCents),
              driverShare: BigInt(driverShareCents),
            });
            break;
          default:
            throw InternalError('Invalid transaction state');
        }
      } else {
        transaction = await this._transactionRepository.create({
          bookingId: data.bookingId,
          userId: data.userId,
          driverId: data.driverId,
          transactionId: randomUUID(),
          amount: BigInt(data.amount),
          paymentMethod: PaymentMethod.STRIPE,
          status: TransactionStatus.PENDING,
          adminShare: BigInt(platformFeeCents),
          driverShare: BigInt(driverShareCents),
          idempotencyKey,
        });
      }

      if (!transaction) {
        throw BadRequestError('Failed to create transaction record');
      }

      // create Checkout Session with destination + application_fee_amount
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: { name: 'Ride Payment' },
              unit_amount: cents,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        payment_intent_data: {
          application_fee_amount: platformFeeCents,
          transfer_data: { destination: driverDetails.account_id },
        },
        success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
        metadata: {
          bookingId: data.bookingId,
          userId: data.userId,
          driverId: data.driverId,
          localTransactionId: transaction.id,
          adminShare: platformFeeCents,
          driverShare: driverShareCents,
        },
      });

      await this._transactionRepository.update(transaction.transactionId, {
        stripeSessionId: session.id,
      });

      return {
        status: StatusCode.OK,
        message: 'Checkout session created',
        sessionId: session.id,
      };
    } catch (err: any) {
      console.log(err);

      try {
        if (data?.bookingId) {
          await this._transactionRepository.update(
            data.bookingId,
            { status: TransactionStatus.FAILED }
          );
        }
      } catch (upErr) {
        console.error('Failed to update transaction status after stripe error', {
          error: upErr,
        });
      }
      return {
        status: StatusCode.InternalServerError,
        message: err?.message ?? 'Failed to create checkout session',
      };
    }
  }

  async handleStripeWebhook(
    rawBody: Buffer,
    headers: IncomingHttpHeaders
  ): Promise<commonRes> {
    const sig = headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
      throw new Error('Missing stripe signature or webhook secret');
    }

    const event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);

    if (event.type !== 'checkout.session.completed') {
      return {
        status: StatusCode.OK,
        message: `Ignored event ${event.type}`,
      };
    }

    const session = event.data.object as Stripe.Checkout.Session;

    if (!session.payment_intent) {
      throw new Error('payment_intent missing from session');
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(
      session.payment_intent as string
    );

    if (paymentIntent.status !== 'succeeded') {
      throw new Error('Payment not successful');
    }

    const {
      bookingId,
      userId,
      driverId,
      localTransactionId,
      adminShare,
      driverShare,
    } = session.metadata || {};

    await this._transactionRepository.update(localTransactionId, {
      status: TransactionStatus.COMPLETED,
      updatedAt: new Date(),
    });

    const paymentData: PaymentData = {
      bookingId,
      driverId,
      driverShare: parseInt(driverShare),
      platformFee: parseInt(adminShare),
      isAddCommission: false,
      paymentMode: 'Stripe',
      paymentStatus: 'Completed',
      userId
    };

    await markBookingAsPaid(paymentData);
    await addDriverEarnings(paymentData);

    return {
      status: StatusCode.OK,
      message: 'Payment confirmed',
    };
  }

}
