import { DataSource } from 'typeorm';
import { Wallet } from '@/entity/wallet.entity';
import { WalletTransaction } from '@/entity/wallet-transaction.entity';
import { Client } from 'pg';
import { DriverStripe } from '@/entity/driver-sripe.entity';
import { Transaction } from '@/entity/transaction.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.SQL_HOST,
  port: Number(process.env.SQL_PORT),
  username: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_WALLET_DB,
  synchronize: true,
  logging: false,
  entities: [Wallet, WalletTransaction],
});

export const AppStripeDataSource = new DataSource({
  type: 'postgres',
  host: process.env.SQL_HOST,
  port: Number(process.env.SQL_PORT),
  username: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_STRIPE_DB,
  synchronize: true,
  logging: false,
  entities: [DriverStripe],
});

export const AppTransactionDataSource = new DataSource({
  type: 'postgres',
  host: process.env.SQL_HOST,
  port: Number(process.env.SQL_PORT),
  username: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_TRANSACTION_DB,
  synchronize: true,
  logging: false,
  entities: [Transaction],
});

export const connectSQL = async (): Promise<void> => {
  try {
    const client = new Client({
      host: process.env.SQL_HOST,
      port: Number(process.env.SQL_PORT),
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: 'postgres',
    });

    await client.connect();

    const walletDb = process.env.SQL_WALLET_DB!;
    const stripeDb = process.env.SQL_STRIPE_DB!;
    const transactionDb = process.env.SQL_TRANSACTION_DB!;

    const resWallet = await client.query(`SELECT 1 FROM pg_database WHERE datname='${walletDb}'`);
    if (resWallet.rowCount === 0) {
      await client.query(`CREATE DATABASE "${walletDb}"`);
      console.log(`🆕 Database '${walletDb}' created`);
    } else {
      console.log(`📘 Database '${walletDb}' already exists`);
    }

    const resStripe = await client.query(`SELECT 1 FROM pg_database WHERE datname='${stripeDb}'`);
    if (resStripe.rowCount === 0) {
      await client.query(`CREATE DATABASE "${stripeDb}"`);
      console.log(`🆕 Database '${stripeDb}' created`);
    } else {
      console.log(`📘 Database '${stripeDb}' already exists`);
    }

  const resTransaction = await client.query(`SELECT 1 FROM pg_database WHERE datname='${transactionDb}'`);
    if (resTransaction.rowCount === 0) {
      await client.query(`CREATE DATABASE "${transactionDb}"`);
      console.log(`🆕 Database '${transactionDb}' created`);
    } else {
      console.log(`📘 Database '${transactionDb}' already exists`);
    }

    await client.end();

    await AppDataSource.initialize();
    console.log('✅ Wallet SQL Database connected');

    await AppStripeDataSource.initialize();
    console.log('✅ Stripe SQL Database connected');

    await AppTransactionDataSource.initialize();
    console.log('✅ Transaction SQL Database connected');
  } catch (error) {

    console.error('❌ Error connecting to SQL DB:', error);
    throw error;
  }
};
