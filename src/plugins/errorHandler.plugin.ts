import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import { HttpError } from '@pick2me/shared/errors';

const errorHandlerPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.setErrorHandler((err, request, reply) => {
    if (err instanceof HttpError) {
      const payload = {
        message: err.message || 'Error',
        code: err.code || undefined,
      };
      reply.status(err.status).send(payload);
      return;
    }

    fastify.log.error(err);
    reply.status(500).send({ message: 'Internal server error' });
  });
};

export default fp(errorHandlerPlugin, { name: 'errorHandlerPlugin' });
