import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { BigIntTransformer } from '../utils/bigint.transformer';

export enum PaymentMethod {
  STRIPE = 'stripe',
  WALLET = 'wallet',
  CASH = 'cash',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity({ name: 'transactions' })
@Index(['bookingId'])
@Index(['driverId'])
@Index(['stripeSessionId'])
@Index(['idempotencyKey'], { unique: true })
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  transactionId!: string;

  @Column({ type: 'text' })
  bookingId!: string;

  @Column({ type: 'text' })
  userId!: string;

  @Column({ type: 'text' })
  driverId!: string;

  // store amount in smallest currency unit (cents / paise)
  @Column({ type: 'bigint', transformer: BigIntTransformer })
  amount!: bigint;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
  })
  paymentMethod!: PaymentMethod;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
  })
  status!: TransactionStatus;

  @Column({ type: 'bigint', transformer: BigIntTransformer })
  adminShare!: bigint;

  @Column({ type: 'bigint', transformer: BigIntTransformer })
  driverShare!: bigint;

  @Column({ type: 'text', nullable: true })
  stripeSessionId?: string;

  @Column({ type: 'text', nullable: true })
  failureReason?: string;

  @Column({ type: 'text' })
  idempotencyKey!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
