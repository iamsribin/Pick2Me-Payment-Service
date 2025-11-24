import Fastify from 'fastify';
import cookie from 'fastify-cookie';
import errorHandlerPlugin from '@/plugins/errorHandler.plugin';
import userRoutes from '@/routes/user-routes';
import driverRoutes from '@/routes/driver-routes';
import verifyGatewayJwtPlugin from '@/plugins/verifyGatewayJwt.plugin';

const app = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        singleLine: true,
        // ignore: 'pid,hostname,reqId',
      },
    },
  },
  pluginTimeout: 10000,
});

app.register(cookie);

app.register(verifyGatewayJwtPlugin);

app.register(userRoutes, { prefix: '/' });
app.register(driverRoutes, { prefix: '/drivers' });

app.register(errorHandlerPlugin);

export default app;
