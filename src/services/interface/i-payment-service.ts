import { IncomingHttpHeaders } from 'http';
import { ConfirmCashPaymentDto } from '../../dto/paymentRes.dto';
import { PaymentReq } from '../../types/request';
import { StripeCheckoutSessionRes } from '../../types/response';

export interface IPaymentService {
  ConfirmCashPayment(data: {
    bookingId: string;
    userId: string;
    driverId: string;
    amount: number;
  }): Promise<ConfirmCashPaymentDto>;
}
