import { container } from '@/config/inversify.config';
import { PaymentController } from '@/controllers/payment-controller';
import { TYPES } from '@/types/inversify-types';
import Fastify, {
  FastifyInstance,
  FastifyRequest,
  FastifyReply,
  FastifyPluginAsync,
} from 'fastify';

const paymentController = container.get<PaymentController>(TYPES.PaymentController);

const userRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/create-checkout-session', paymentController.createCheckoutSession);
};

export default userRoutes;
