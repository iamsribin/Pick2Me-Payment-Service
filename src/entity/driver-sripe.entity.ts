import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'driver_stripe' })
export class DriverStripe {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  driverId!: string;

  @Column({ type: 'text' })
  email!: string;

  @Column({ type: 'text' })
  account_id: string;

  @Column({ type: 'text' })
  accountLink: string;

  @Column({ type: 'text', default: 'onboard' })
  status: 'active' | 'onboard';

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
