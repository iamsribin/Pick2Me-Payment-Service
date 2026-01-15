import { container } from '@/config/inversify.config';
import { PaymentController } from '@/controllers/payment-controller';
import { TYPES } from '@/types/inversify-types';
import { FastifyPluginAsync } from 'fastify';

const paymentController = container.get<PaymentController>(TYPES.PaymentController);

const userRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.verifyGatewayJwt(true, process.env.GATEWAY_SHARED_SECRET!));

  fastify.post('/wallet/payment', paymentController.walletPayment);
  fastify.post('/cash-in-hand/payment', paymentController.cashInHandPayment);

  fastify.post('/wallet/topup', async (request, reply) => {
    return { ok: true };
  });
};

export default userRoutes;
