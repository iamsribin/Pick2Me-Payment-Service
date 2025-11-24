import { FastifyPluginAsync } from 'fastify';

const driverRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.verifyGatewayJwt(true, process.env.GATEWAY_SHARED_SECRET!));

  fastify.get('/me/stripe-onboard-view', async (request, reply) => {
    return { ok: true };
  });
};

export default driverRoutes;
