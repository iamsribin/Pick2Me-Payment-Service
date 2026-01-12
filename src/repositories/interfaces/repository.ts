// import { WalletTransaction } from '@/entity/wallet-transaction.entity';

// export interface ITransactionRepository {
//   create(transaction: Partial<WalletTransaction>): Promise<WalletTransaction>;
//   findByTransactionId(transactionId: string): Promise<WalletTransaction | null>;
//   findByIdempotencyKey(idempotencyKey: string): Promise<WalletTransaction | null>;
//   update(
//     transactionId: string,
//     update: Partial<WalletTransaction>
//   ): Promise<WalletTransaction | null>;
//   updateStatusByKey(
//     idempotencyKey: string,
//     status: 'pending' | 'completed' | 'failed'
//   ): Promise<WalletTransaction | null>;
//   updateStatus(
//     transactionId: string,
//     status: 'pending' | 'completed' | 'failed'
//   ): Promise<WalletTransaction | null>;
// }
