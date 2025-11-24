import { container } from '@/config/inversify.config';
import { IUserWalletService } from '@/services/interface/i-user-waller-service';
import { TYPES } from '@/types/inversify-types';
import { EXCHANGES, QUEUES, RabbitMQ, ROUTING_KEYS } from '@Pick2Me/shared/messaging';

const userWalletService = container.get<IUserWalletService>(TYPES.UserWalletService);

export class UserEventConsumer {
  static async init() {
    await RabbitMQ.connect({ url: process.env.RABBIT_URL!, serviceName: 'payment-service' });

    await RabbitMQ.setupExchange(EXCHANGES.USER, 'topic');

    await RabbitMQ.bindQueueToExchanges(QUEUES.PAYMENT_QUEUE, [
      {
        exchange: EXCHANGES.USER,
        routingKeys: ['user-payment.#'],
      },
    ]);

    await RabbitMQ.consume(QUEUES.PAYMENT_QUEUE, async (msg) => {
      switch (msg.type) {
        case ROUTING_KEYS.USER_WALLET_CREATE:
          await userWalletService.createWalletForUser(msg.data);
          break;
        case ROUTING_KEYS.USER_ADDED_REWARD_AMOUNT:
          await userWalletService.addRewardAmountToUserWallet(msg.data);
          break;
        default:
          console.warn('Unknown payment message:', msg.type);
      }
    });
  }
}
