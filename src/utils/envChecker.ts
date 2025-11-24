import { envChecker } from '@Pick2Me/shared/utils';

export const isEnvDefined = () => {
  envChecker(process.env.MONGO_URL, 'MONGO_URL');
  envChecker(process.env.PORT, 'PORT');
  envChecker(process.env.FRONTEND_URL, 'FRONTEND_URL');
  envChecker(process.env.STRIPE_SECRET_KEY, 'STRIPE_SECRET_KEY');
  envChecker(process.env.STRIPE_PUBLISHABLE_KEY, 'STRIPE_PUBLISHABLE_KEY');
  envChecker(process.env.RABBIT_URL, 'RABBIT_URL');
  envChecker(process.env.PAYMENT_GRPC_URL, 'PAYMENT_GRPC_URL');
};
