import * as grpc from '@grpc/grpc-js';
import { paymentServiceDescriptor } from '@pick2me/shared/protos';
import { createPaymentHandlers } from './handlers/handler';
import { container } from '../config/inversify.config';
import { TYPES } from '../types/inversify-types';
import { GrpcPaymentController } from '../controllers/grpc-payment-controller';

if (!paymentServiceDescriptor) {
  console.error('paymentServiceDescriptor is missing. Inspect loaded proto package.');
  process.exit(1);
}

const grpcPaymentController = container.get<GrpcPaymentController>(TYPES.GrpcPaymentController);

const handlers = createPaymentHandlers({
  grpcPaymentController,
});

export const startGrpcServer = () => {
  try {
    const server = new grpc.Server();

    // Register payment service gRPC functions
    server.addService(paymentServiceDescriptor, handlers);

    // Bind server
    server.bindAsync(
      process.env.PAYMENT_GRPC_URL as string,
      grpc.ServerCredentials.createInsecure(),
      () => {
        console.log(`GRPC server for user service running on port ${process.env.PAYMENT_GRPC_URL}`);
      }
    );
  } catch (err) {
    console.log(err);
  }
};
