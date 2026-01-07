import { StatusCode } from '@pick2me/shared/interfaces';

export interface ConformCashPaymentDto {
  status: StatusCode;
  message: string;
}
