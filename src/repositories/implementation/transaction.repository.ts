// import { ITransaction } from '@/models/transaction.modal';
// import { TransactionModel } from '@/models/transaction.modal';
// import { ITransactionRepository } from '../interfaces/repository';

// export default class TransactionRepositoryImpl implements ITransactionRepository {
//   async create(transaction: Partial<ITransaction>): Promise<ITransaction> {
//     return await TransactionModel.create(transaction);
//   }

//   async findByTransactionId(transactionId: string): Promise<ITransaction | null> {
//     return await TransactionModel.findOne({ transactionId });
//   }

//   async findByIdempotencyKey(idempotencyKey: string): Promise<ITransaction | null> {
//     return await TransactionModel.findOne({ idempotencyKey });
//   }

//   async update(transactionId: string, update: Partial<ITransaction>): Promise<ITransaction | null> {
//     return await TransactionModel.findOneAndUpdate({ transactionId }, update, {
//       new: true,
//     });
//   }

//   // --- New method 1 ---
//   async updateStatus(
//     transactionId: string,
//     status: 'pending' | 'completed' | 'failed'
//   ): Promise<ITransaction | null> {
//     return await TransactionModel.findOneAndUpdate(
//       { transactionId },
//       { status, updatedAt: new Date() },
//       { new: true }
//     );
//   }

//   // --- New method 2 ---
//   async updateStatusByKey(
//     idempotencyKey: string,
//     status: 'pending' | 'completed' | 'failed'
//   ): Promise<ITransaction | null> {
//     return await TransactionModel.findOneAndUpdate(
//       { idempotencyKey },
//       { status, updatedAt: new Date() },
//       { new: true }
//     );
//   }
// }
