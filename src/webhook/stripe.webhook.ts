import { FastifyInstance } from 'fastify';
import rawbody from '../plugins/rawbody';
import { container } from '@/config/inversify.config';
import { PaymentController } from '@/controllers/payment-controller';
import { TYPES } from '@/types/inversify-types';

const paymentController = container.get<PaymentController>(TYPES.PaymentController);

export function StripeWebhook(fastify: FastifyInstance) {
  fastify.register(rawbody);

  fastify.post('/webhook', paymentController.handleStripeWebhook);
}
