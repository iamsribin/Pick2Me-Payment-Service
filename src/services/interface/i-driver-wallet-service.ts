export interface IDriverWalletService {
  createDriverConnectAccount(
    email: string,
    driverId: string
  ): Promise<{ accountId: string; accountLinkUrl: string }>;
  checkDriverOnboardingStatus(driverId: string): Promise<{ onboardingStatus: boolean }>;

  stripeOnboardingView(driverId: string);
  getDriverWalletDetails(driverId: string);
  refreshOnboardingLink(driverId: string);
}
