import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from '../types/inversify-types';
import { GrpcPaymentController } from '../controllers/grpc-payment-controller';
import { IDriverWalletService } from '@/services/interface/i-driver-wallet-service';
import DriverWalletService from '@/services/implementation/driver-service';
import { IPaymentService } from '@/services/interface/i-payment-service';
import { PaymentService } from '@/services/implementation/payment-service';
import { IStripeService } from '@/services/interface/i-stripe-service';
import { StripeService } from '@/services/implementation/stripe-service';
import { PaymentController } from '@/controllers/payment-controller';
import { IUserWalletService } from '@/services/interface/i-user-waller-service';
import { UserWalletService } from '@/services/implementation/user-wallet-service';
import { IWalletRepository } from '@/repositories/interfaces/i-wallet-repository';
import { WalletRepository } from '@/repositories/implementation/wallet.repository';
import { ITransactionRepository } from '@/repositories/interfaces/repository';
import TransactionRepositoryImpl from '@/repositories/implementation/transaction.repository';
import { AppDataSource, AppStripeDataSource } from './sql-db';
import { Wallet } from '@/entity/wallet.entity';
import { Repository } from 'typeorm';
import { DriverStripeRepository } from '@/repositories/implementation/driver-stripe.repository';
import { IDriverStripeRepository } from '@/repositories/interfaces/i-driver-strip-repository';
import { DriverStripe } from '@/entity/driver-sripe.entity';

const container = new Container();

container.bind<GrpcPaymentController>(TYPES.GrpcPaymentController).to(GrpcPaymentController);
container.bind<PaymentController>(TYPES.PaymentController).to(PaymentController);

container.bind<IDriverWalletService>(TYPES.DriverWalletService).to(DriverWalletService);
container.bind<IPaymentService>(TYPES.PaymentService).to(PaymentService);
container.bind<IStripeService>(TYPES.StripeService).to(StripeService);
container.bind<IUserWalletService>(TYPES.UserWalletService).to(UserWalletService);

container.bind<ITransactionRepository>(TYPES.TransactionRepository).to(TransactionRepositoryImpl);
container.bind<IWalletRepository>(TYPES.WalletRepository).to(WalletRepository);
container
  .bind<Repository<Wallet>>(TYPES.WalletRepositoryToken)
  .toConstantValue(AppDataSource.getRepository(Wallet));

container
  .bind<Repository<DriverStripe>>(TYPES.DriverStripeRepositoryToken)
  .toConstantValue(AppStripeDataSource.getRepository(DriverStripe));

// bind implementation once
container
  .bind<IDriverStripeRepository>(TYPES.DriverStripeRepository)
  .to(DriverStripeRepository)
  .inSingletonScope();

export { container };
