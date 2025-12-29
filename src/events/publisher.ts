import { EXCHANGES, RabbitMQ, ROUTING_KEYS } from '@Pick2Me/shared/messaging';
const url = process.env.RABBIT_URL!;

export class EventProducer {
    static async init() {
        await RabbitMQ.connect({ url, serviceName: 'realtime-service' });
        await RabbitMQ.setupExchange(EXCHANGES.NOTIFICATION, 'topic');
    }

    static async BookingMarkPayment(data: { driverId: string; status: string }) {
        this.init();
        const updateDriverRideStatusCountPayload = {
            data,
            type: ROUTING_KEYS.UPDATE_DRIVER_RIDE_COUNT,
        };
        await RabbitMQ.publish(
            EXCHANGES.NOTIFICATION,
            ROUTING_KEYS.UPDATE_DRIVER_RIDE_COUNT,
            updateDriverRideStatusCountPayload
        );
        console.log('publish INCREASE_DRIVER_RIDE_COUNT');
    }

    static async updateDriverEarnings(data: { driverId: string; status: string }) {
        this.init();
        const updateDriverRideStatusCountPayload = {
            data,
            type: ROUTING_KEYS.UPDATE_DRIVER_RIDE_COUNT,
        };
        await RabbitMQ.publish(
            EXCHANGES.NOTIFICATION,
            ROUTING_KEYS.UPDATE_DRIVER_RIDE_COUNT,
            updateDriverRideStatusCountPayload
        );
        console.log('publish INCREASE_DRIVER_RIDE_COUNT');
    }
}
