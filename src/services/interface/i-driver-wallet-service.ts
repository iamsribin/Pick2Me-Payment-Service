export interface IDriverWalletService {
  createDriverConnectAccount(
    email: string,
    driverId: string
  ): Promise<{ accountId: string; accountLinkUrl: string }>;
  checkDriverOnboardingStatus(driverId: string): Promise<{ onboardingStatus: boolean }>;
  stripeOnboardingView(driverId: string);
  getDriverWalletDetails(driverId: string);
  refreshOnboardingLink(driverId: string);
  addFundsToDriverAccount(
    driverId: string,
    amount: number,
    opts?: { currency?: string; description?: string }
  ): Promise<{ success: boolean; transferId?: string; raw?: any }>;
}
