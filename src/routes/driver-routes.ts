import { container } from '@/config/inversify.config';
import { DriverController } from '@/controllers/driver-controller';
import { PaymentController } from '@/controllers/payment-controller';
import { TYPES } from '@/types/inversify-types';
import { FastifyPluginAsync } from 'fastify';

const driverController = container.get<DriverController>(TYPES.DriverController);

const driverRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', fastify.verifyGatewayJwt(true, process.env.GATEWAY_SHARED_SECRET!));

  fastify.get('/me/wallet', driverController.getWalletDetails.bind(driverController));
  fastify.get(
    '/me/wallet/refresh-onboarding',
    driverController.refreshOnboardingLink.bind(driverController)
  );
};

export default driverRoutes;
