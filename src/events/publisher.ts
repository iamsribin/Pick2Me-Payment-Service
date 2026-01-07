import { EXCHANGES, RabbitMQ, ROUTING_KEYS } from '@pick2me/shared/messaging';
const url = process.env.RABBIT_URL!;

export interface AddEarningsRequest {
  driverId: string;
  platformFee: bigint;
  driverShare: bigint;
  userId: string;
  bookingId: string;
  isAddCommission: boolean;
  paymentStatus: 'Pending' | 'Failed' | 'Completed' | 'idle';
  paymentMode: 'Cash' | 'Wallet' | 'Stripe';
}
export class EventProducer {
  static async init() {
    await RabbitMQ.connect({ url, serviceName: 'payment-service' });
    await RabbitMQ.setupExchange(EXCHANGES.PAYMENT, 'topic');
  }

  static async MarkBookingService(data: AddEarningsRequest) {
    const markPaymentCompleted = {
      data,
      type: ROUTING_KEYS.MARK_PAYMENT_COMPLETED,
    };

    await RabbitMQ.publish(
      EXCHANGES.DRIVER,
      ROUTING_KEYS.MARK_PAYMENT_COMPLETED,
      markPaymentCompleted
    );
  }

  static async MarkPaymentCompleted(data: AddEarningsRequest) {
    this.init();

    this.MarkBookingService(data);

    const updateDriverEarnings = {
      data,
      type: ROUTING_KEYS.UPDATE_DRIVER_EARNINGS,
    };

    await RabbitMQ.publish(
      EXCHANGES.PAYMENT,
      ROUTING_KEYS.UPDATE_DRIVER_EARNINGS,
      updateDriverEarnings
    );

  }
}
