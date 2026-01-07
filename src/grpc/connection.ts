import { bookingProto, driverProto } from '@pick2me/shared/protos';
import * as grpc from '@grpc/grpc-js';

const driverClient = new (driverProto as any).DriverService(
  process.env.DRIVER_GRPC_URL,
  grpc.credentials.createInsecure()
);

const bookingClient = new (bookingProto as any).BookingService(
  process.env.BOOKING_GRPC_URL,
  grpc.credentials.createInsecure()
);

export { driverClient, bookingClient };
