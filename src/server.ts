import 'dotenv/config';

import app from './app';
import { connectSQL } from './config/sql-db';
import { startGrpcServer } from './grpc/server';
import { isEnvDefined } from './utils/envChecker';
// import { connectDB } from '@pick2me/shared/mongo';
import { UserEventConsumer } from './events/consumer';

const startServer = async () => {
  try {
    isEnvDefined();

    // connectDB(process.env.MONGO_URL!);
    await connectSQL();

    await UserEventConsumer.init();

    startGrpcServer();

    const port = Number(process.env.PORT) || 3000;
    await app.listen({ port, host: '0.0.0.0' });
    app.log.info(`payment service running on port ${port}`);
  } catch (err: unknown) {
    app.log.error(err);
    process.exit(1);
  }
};

startServer();

const shutdown = async () => {
  try {
    app.log.info('Shutting down...');
    await app.close();
    // await consumer.stop?.();
    // await stopGrpcServer?.();
    process.exit(0);
  } catch (e) {
    app.log.error(e);
    process.exit(1);
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
