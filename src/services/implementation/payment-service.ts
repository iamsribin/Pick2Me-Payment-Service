import { ConfirmCashPaymentDto } from '@/dto/paymentRes.dto.js';
import { randomUUID } from 'crypto';
import { IPaymentService } from '../interface/i-payment-service';
import { addDriverEarnings, markBookingAsPaid, PaymentData } from '@/grpc/clients/booking-client';
import { StatusCode } from '@pick2me/shared/interfaces';
import { injectable } from 'inversify';
import { RedisService } from '@pick2me/shared/redis';
import { InternalError } from '@pick2me/shared/errors';
import { EventProducer } from '@/events/publisher';

@injectable()
export class PaymentService implements IPaymentService {

  ConfirmCashPayment = async (data: {
    bookingId: string;
    userId: string;
    driverId: string;
    amount: number;
  }): Promise<ConfirmCashPaymentDto> => {

    const RESULT_TTL_MS = 1 * 24 * 60 * 60 * 1000;
    const FAILED_RESULT_TTL_MS = 60 * 1000;
    const LOCK_TTL_MS = 30 * 1000;
    const POLL_INTERVAL_MS = 200;
    const POLL_ATTEMPTS = 5;

    function sleep(ms: number) {
      return new Promise((res) => setTimeout(res, ms));
    }

    const redis = RedisService.getInstance().raw();
    const bookingId = data.bookingId;
    const resultKey = `idemp:booking:${bookingId}:result`;
    const lockKey = `idemp:booking:${bookingId}:lock`;
    const token = randomUUID();

    try {
      const existing = await redis.get(resultKey);
      if (existing) {
        try {
          return JSON.parse(existing) as ConfirmCashPaymentDto;
        } catch {
          // If parse fails, continue and overwrite with fresh value.
        }
      }
    } catch (err) {
      // Redis read failed — proceed (we'll attempt to acquire lock).
    }

    // Use SET lockKey token NX PX LOCK_TTL_MS
    const lockAcquired = await redis.set(lockKey, token, 'NX', 'PX', LOCK_TTL_MS);

    if (!lockAcquired) {
      // Poll for result for a short time, then return conflict if nothing appears.
      for (let i = 0; i < POLL_ATTEMPTS; i++) {
        await sleep(POLL_INTERVAL_MS);
        try {
          const r = await redis.get(resultKey);
          if (r) {
            return JSON.parse(r) as ConfirmCashPaymentDto;
          }
        } catch {
          // ignore and continue polling
        }
      }
      return {
        status: StatusCode.Conflict,
        message: 'Payment is already being processed for this booking. Please retry shortly.',
      };
    }

    try {
      const paymentData: PaymentData = {
        isAddCommission: true,
        bookingId: data.bookingId,
        userId: data.userId,
        driverId: data.driverId,
        paymentStatus: 'Completed',
        paymentMode: 'Cash',
        platformFee: Math.round(data.amount * 0.2),
        driverShare: Math.round(data.amount * 0.8),
      };

      await markBookingAsPaid(paymentData);
      await addDriverEarnings(paymentData);
      EventProducer.NotifyPaymentCompleted(paymentData.userId);
      const successResp = {
        status: StatusCode.OK,
        message: 'Cash payment confirmed successfully',
      };

      try {
        await redis.set(resultKey, JSON.stringify(successResp), 'PX', RESULT_TTL_MS);
      } catch (error) {
        console.log(error);
      }

      return successResp;
    } catch (error: any) {
      console.log('error==',error);

      const errResp: ConfirmCashPaymentDto = {
        status: StatusCode.InternalServerError,
        message: error?.message,
      };

      try {
        // await redis.set(resultKey, JSON.stringify(errResp), 'PX', FAILED_RESULT_TTL_MS);
      } catch {
        // ignore
      }

      throw InternalError('Something went wrong during cash confirmation');
    } finally {
      const releaseScript = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
      try {
        await redis.eval(releaseScript, 1, lockKey, token);
      } catch {
        // log failure to release lock (lock will expire by TTL)
      }
    }
  };
}
