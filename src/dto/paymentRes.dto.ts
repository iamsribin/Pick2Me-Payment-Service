import { StatusCode } from '@pick2me/shared/interfaces';

export interface ConfirmCashPaymentDto {
  status: StatusCode;
  message: string;
}
