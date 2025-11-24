import { FastifyPluginAsync } from 'fastify';

const walletRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.verifyGatewayJwt(true, process.env.GATEWAY_SHARED_SECRET!));

  fastify.post('/wallet/topup', async (request, reply) => {
    return { ok: true };
  });
};

export default walletRoutes;
