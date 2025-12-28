import { container } from '@/config/inversify.config';
import { PaymentController } from '@/controllers/payment-controller';
import { TYPES } from '@/types/inversify-types';
import { FastifyPluginAsync } from 'fastify';

const walletController = container.get<PaymentController>(TYPES.PaymentController);

const walletRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.verifyGatewayJwt(true, process.env.GATEWAY_SHARED_SECRET!));

  fastify.post('/wallet/payment', walletController.walletPayment);

  fastify.post('/wallet/topup', async (request, reply) => {
    return { ok: true };
  });
};

export default walletRoutes;
