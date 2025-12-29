import { PaymentReq } from '@/types/request';

export interface IUserWalletService {
  createWalletForUser(userData: {
    userId: string;
    email: string;
    createdAt: string;
  }): Promise<void>;

  getUserWalletBalanceAndTransactions(
    userId: string
  ): Promise<{ balance: string; transactions: number }>;

  addRewardAmountToUserWallet(userId: string): Promise<void>;
 transferAmountToDriverStripe(userId: string, paymentData: PaymentReq): Promise<void>;
}
