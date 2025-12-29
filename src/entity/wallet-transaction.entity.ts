import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BigIntTransformer } from '../utils/bigint.transformer';
import { Wallet } from './wallet.entity';

@Entity({ name: 'wallet_transactions' })
@Index(['walletId', 'createdAt'])
@Index(['userId', 'createdAt'])
export class WalletTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  walletId!: string;

  @ManyToOne(() => Wallet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'walletId' })
  wallet?: Wallet;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'text' })
  direction!: 'credit' | 'debit';

  @Column({ type: 'bigint', transformer: BigIntTransformer })
  amount!: bigint;

  @Column({ type: 'text' })
  currency!: string;

  @Column({ type: 'text', default: 'settled' })
  status!: string;

  @Column({ type: 'text', nullable: true })
  reason?: string;

  @Column({ type: 'text', nullable: true })
  referenceType?: string;

  @Column({ type: 'text', nullable: true })
  referenceId?: string;

  @Column({ type: 'text', nullable: true })
  provider?: string;

  @Column({ type: 'text', nullable: true })
  idempotencyKey?: string;

  @Column({ type: 'text', nullable: true })
  traceId?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any;

  @Column({ type: 'bigint', transformer: BigIntTransformer, nullable: true })
  balanceBefore?: bigint;

  @Column({ type: 'bigint', transformer: BigIntTransformer, nullable: true })
  balanceAfter?: bigint;

  @Column({ type: 'bigint', transformer: BigIntTransformer, nullable: true })
  reservedBefore?: bigint;

  @Column({ type: 'bigint', transformer: BigIntTransformer, nullable: true })
  reservedAfter?: bigint;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
