import { Repository, QueryRunner } from 'typeorm';
import { Wallet } from '@/entity/wallet.entity';
import { WalletTransaction } from '@/entity/wallet-transaction.entity';
import { SqlBaseRepository } from '@pick2me/shared/sql';
import { AppDataSource } from '@/config/sql-db';
import { IWalletRepository } from '../interfaces/i-wallet-repository';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/types/inversify-types';

@injectable()
export class WalletRepository extends SqlBaseRepository<Wallet> implements IWalletRepository {
  private txRepo: Repository<WalletTransaction>;

  constructor(@inject(TYPES.WalletRepositoryToken) walletRepo: Repository<Wallet>) {
    super(Wallet, AppDataSource);
    this.txRepo = walletRepo.manager.getRepository(WalletTransaction);
  }

  // create wallet if not exists
  async createIfNotExists(userId: string, currency = 'INR') {
    const existing = await this.findOne({
      userId: userId,
      currency: currency,
    });
    if (existing) return existing;
    return await this.create({ userId, currency });
  }

  async getUserWalletBalanceAndTransactions(
    userId: string,
    currency = 'INR'
  ): Promise<{ balance: bigint; transactions: number }> {
    const wallet = await this.findOne({ userId, currency });
    if (!wallet) throw new Error('WALLET_NOT_FOUND');
    const transactionsCount = await this.txRepo.count({
      where: { walletId: wallet.id },
    });
    return { balance: wallet.balance, transactions: transactionsCount };
  }

  addRewardAmountToUserWallet(userId: string, amount: number) {
    this.applyTransaction({
      userId,
      amount: BigInt(amount),
      direction: 'credit',
      reason: 'Reward amount',
    });
  }

  // helper to get a query runner
  createQueryRunner() {
    return AppDataSource.createQueryRunner();
  }

  // get wallet and lock it for update in the provided queryRunner
  async getForUpdate(
    queryRunner: QueryRunner,
    userId: string,
    currency = 'INR'
  ): Promise<Wallet | null> {
    const wallet = await queryRunner.manager
      .createQueryBuilder(Wallet, 'w')
      .useTransaction(true)
      .setLock('pessimistic_write')
      .where('w.userId = :userId AND w.currency = :currency', {
        userId,
        currency,
      })
      .getOne();
    return wallet ?? null;
  }

  // transactional hot-path: apply transaction (credit/debit), with idempotency check
  async applyTransactionTransactional(params: {
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
  }) {
    const {
      queryRunner,
      userId,
      currency = 'INR',
      amount,
      direction,
      reason,
      referenceType,
      referenceId,
      idempotencyKey,
      traceId,
      metadata,
    } = params;

    // lock the wallet
    let wallet = await this.getForUpdate(queryRunner, userId, currency);
    if (!wallet) {
      // create within transaction if missing
      wallet = queryRunner.manager.create(Wallet, { userId, currency } as any);
      await queryRunner.manager.save(wallet);
      // re-load with lock
      wallet = (await this.getForUpdate(queryRunner, userId, currency))!;
    }

    // idempotency check
    if (idempotencyKey) {
      const existing = await queryRunner.manager.findOne(WalletTransaction, {
        where: { idempotencyKey, userId } as any,
      });
      if (existing) {
        return { alreadyApplied: true, txId: existing.id };
      }
    }

    const currentBalance = wallet.balance as bigint;
    const currentReserved = wallet.reserved as bigint;
    const amt = BigInt(amount);

    let newBalance = currentBalance;
    const newReserved = currentReserved;

    if (direction === 'credit') {
      newBalance = currentBalance + amt;
    } else {
      // debit: check available (balance - reserved)
      const available = currentBalance - currentReserved;
      if (available < amt) {
        throw new Error('INSUFFICIENT_FUNDS');
      }
      newBalance = currentBalance - amt;
    }

    // update wallet
    await queryRunner.manager.update(Wallet, { id: wallet.id } as any, {
      balance: newBalance,
    });

    // insert ledger row
    const txEntity = queryRunner.manager.create(WalletTransaction, {
      walletId: wallet.id,
      userId,
      direction,
      amount: amt.toString(),
      balanceBefore: currentBalance.toString(),
      balanceAfter: newBalance.toString(),
      reservedBefore: currentReserved.toString(),
      reservedAfter: newReserved.toString(),
      currency,
      status: 'settled',
      reason: reason ?? null,
      referenceType: referenceType ?? null,
      referenceId: referenceId ?? null,
      idempotencyKey: idempotencyKey ?? null,
      traceId: traceId ?? null,
      metadata: metadata ?? null,
    } as any);

    const savedTx = await queryRunner.manager.save(txEntity);

    return { alreadyApplied: false, txId: savedTx.id };
  }

  // convenience wrapper to run a transactional applyTransaction
  async applyTransaction(params: {
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
  }) {
    const queryRunner = this.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const res = await this.applyTransactionTransactional({
        ...params,
        queryRunner,
      });
      await queryRunner.commitTransaction();
      return res;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
