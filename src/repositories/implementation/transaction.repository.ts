import { AppTransactionDataSource } from '@/config/sql-db';
import { Transaction } from '@/entity/transaction.entity';
import { TYPES } from '@/types/inversify-types';
import { SqlBaseRepository } from '@pick2me/shared/sql';
import { inject, injectable } from 'inversify';
import { Repository } from 'typeorm';

@injectable()
export class TransactionRepository extends SqlBaseRepository<Transaction> {
  constructor(@inject(TYPES.TransactionRepositoryToken) repo: Repository<Transaction>) {
    super(Transaction, AppTransactionDataSource);
  }
}