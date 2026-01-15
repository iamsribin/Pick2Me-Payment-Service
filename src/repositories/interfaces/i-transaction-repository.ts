import { Transaction } from '@/entity/transaction.entity';
import { ISqlBaseRepository } from '@pick2me/shared/sql';

export type ITransaction = ISqlBaseRepository<Transaction>;
