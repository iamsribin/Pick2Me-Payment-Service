export const TYPES = {
  PaymentController: Symbol.for('PaymentController'),
  GrpcPaymentController: Symbol.for('GrpcPaymentController'),
  DriverController: Symbol.for('DriverController'),
  
  PaymentService: Symbol.for('PaymentService'),
  DriverWalletService: Symbol.for('DriverWalletService'),
  StripeService: Symbol.for('StripeService'),
  UserWalletService: Symbol.for('UserWalletService'),

  WalletRepository: Symbol.for('WalletRepository'),
  DriverStripeRepository: Symbol.for('DriverStripeRepository'),
  TransactionRepository: Symbol.for('TransactionRepository'),
  WalletRepositoryToken: Symbol.for('WalletRepositoryToken'),
  DriverStripeRepositoryToken: Symbol.for('DriverStripeRepositoryToken'),
};
