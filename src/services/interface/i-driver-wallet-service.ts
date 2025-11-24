export interface IDriverWalletService {
  createDriverConnectAccount(
    email: string,
    driverId: string
  ): Promise<{ accountId: string; accountLinkUrl: string }>;

  stripeOnboardingView(driverId: string);
  getDriverWalletDetails(driverId: string);
  refreshOnboardingLink(driverId: string) 
}
