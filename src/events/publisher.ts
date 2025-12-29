import { PaymentReq } from '@/types/request';
import { EXCHANGES, RabbitMQ, ROUTING_KEYS } from '@Pick2Me/shared/messaging';
import { AnyARecord } from 'node:dns';
const url = process.env.RABBIT_URL!;

export class EventProducer {
    static async init() {
        await RabbitMQ.connect({ url, serviceName: 'payment-service' });
        await RabbitMQ.setupExchange(EXCHANGES.PAYMENT, 'topic');
    }

    static async MarkPaymentCompleted(data: PaymentReq) {
        this.init();

        const updateDriverEarnings = {
            data,
            type: ROUTING_KEYS.UPDATE_DRIVER_EARNINGS,
        };

        await RabbitMQ.publish(
            EXCHANGES.DRIVER,
            ROUTING_KEYS.UPDATE_DRIVER_EARNINGS,
            updateDriverEarnings
        );

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
}
