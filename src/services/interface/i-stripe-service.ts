import { IncomingHttpHeaders } from 'http';
import { PaymentReq } from '../../types/request';
import { StripeCheckoutSessionRes } from '../../types/response';
import { ConfirmCashPaymentDto } from '../../dto/paymentRes.dto';

export interface IStripeService {
  createCheckoutSession(data: PaymentReq): Promise<StripeCheckoutSessionRes>;
  handleStripeWebhook(
    rawBody: Buffer,
    headers: IncomingHttpHeaders
  ): Promise<ConfirmCashPaymentDto>;
}
