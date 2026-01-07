import { Wallet } from '@/entity/wallet.entity';
import { ISqlBaseRepository } from '@pick2me/shared/sql';
import { QueryRunner } from 'typeorm';

export interface IWalletRepository extends ISqlBaseRepository<Wallet> {
  createIfNotExists(userId: string, currency?: string);
  getUserWalletBalanceAndTransactions(
    userId: string,
    currency: string
  ): Promise<{ balance: bigint; transactions: number }>;

  getForUpdate(queryRunner: QueryRunner, userId: string, currency: string): Promise<Wallet | null>;
  applyTransactionTransactional(params: {
    queryRunner: QueryRunner;
    userId: string;
    currency?: string;
    amount: bigint;
    direction: 'credit' | 'debit';
    reason?: string;
    referenceType?: string;
    referenceId?: string;
    idempotencyKey?: string;
    traceId?: string;
    metadata?: any;
  });

  applyTransaction(params: {
    userId: string;
    currency?: string;
    amount: bigint;
    direction: 'credit' | 'debit';
    reason?: string;
    referenceType?: string;
    referenceId?: string;
    idempotencyKey?: string;
    traceId?: string;
    metadata?: any;
  });
  addRewardAmountToUserWallet(userId: string, amount: number);
  createQueryRunner();
}
