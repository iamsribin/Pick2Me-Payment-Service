import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import jwt from 'jsonwebtoken';
import { IRole, StatusCode } from '@Pick2Me/shared/interfaces';
import { AccessPayload } from '@Pick2Me/shared/auth';

export interface VerifyOpts {
  strict?: boolean;
  secret: string;
  options?: { role?: IRole | IRole[] };
}

const verifyGatewayJwtPlugin: FastifyPluginAsync = async (fastify, opts) => {
  function makePreHandler(
    strict = true,
    GATEWAY_SECRET = '',
    options?: { role?: IRole | IRole[] }
  ) {
    return async (request: any, reply: any) => {
      const raw = (request.headers['x-gateway-jwt'] as string | undefined) ?? null;
      console.log('raw', raw);

      if (!GATEWAY_SECRET) {
        fastify.log.warn('GATEWAY_SHARED_SECRET is not set. Gateway JWT verification may fail.');
      }

      if (!raw) {
        if (strict) {
          reply.status(StatusCode.Unauthorized).json({ message: 'Missing gateway token' });
          return;
        }
        request.gatewayUser = null;
        return;
      }

      try {
        const decoded = jwt.verify(raw, GATEWAY_SECRET as string, {
          issuer: 'api-gateway',
        }) as AccessPayload;

        if (!decoded || typeof decoded !== 'object' || !decoded.id || !decoded.role) {
          if (strict) {
            reply
              .status(StatusCode.Unauthorized)
              .json({ message: 'Invalid gateway token (claims missing)' });
            return;
          }
          request.gatewayUser = null;
          return;
        }

        const gatewayUser: AccessPayload = {
          id: String(decoded.id),
          role: String(decoded.role) as IRole,
        };

        if (options?.role) {
          const required = Array.isArray(options.role) ? options.role : [options.role];
          if (!required.includes(gatewayUser.role)) {
            if (strict) {
              reply.status(StatusCode.Forbidden).json({ message: 'Forbidden: role mismatch' });
              return;
            }
            request.gatewayUser = null;
            return;
          }
        }

        request.gatewayUser = gatewayUser;
      } catch (err: any) {
        const message = err?.message || 'Invalid gateway token';
        if (strict) {
          reply
            .status(StatusCode.Unauthorized)
            .json({ message: `Invalid gateway token: ${message}` });
          return;
        }
        request.gatewayUser = null;
      }
    };
  }

  fastify.decorate('verifyGatewayJwt', makePreHandler);
};

export default fp(verifyGatewayJwtPlugin, {
  name: 'verifyGatewayJwtPlugin',
});
