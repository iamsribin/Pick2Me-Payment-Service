import { StatusCode } from '@pick2me/shared';

export interface StripeCheckoutSessionRes {
  status: StatusCode;
  sessionId?: string;
  message: string;
}
