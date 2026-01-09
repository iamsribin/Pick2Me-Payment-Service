import { StatusCode } from '@pick2me/shared/interfaces';

export interface StripeCheckoutSessionRes {
  status: StatusCode;
  sessionId?: string;
  message: string;
}
