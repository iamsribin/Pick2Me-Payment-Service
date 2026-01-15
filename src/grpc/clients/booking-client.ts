import { StatusCode } from '@pick2me/shared/interfaces';
import { bookingClient, driverClient } from '../connection';

export interface PaymentData {
  driverId: string;
  platformFee: number;
  driverShare: number;
  userId: string;
  bookingId: string;
  isAddCommission: boolean;
  paymentStatus: 'Pending' | 'Failed' | 'Completed' | 'idle';
  paymentMode: 'Cash' | 'Wallet' | 'Stripe';
}

export async function markBookingAsPaid(paymentData: PaymentData) {
  console.log('called booking service',paymentData);

  return new Promise<any>((resolve, reject) => {
    bookingClient.UpdatePaymentStatus(paymentData, (err: Error | null, response: any) => {
      console.log('response',response);
      
      if (err) return reject(err);
      if (response.status !== StatusCode.OK) return reject(new Error('Failed to update booking'));
      resolve(response);
    });
  });
}

export async function rollbackBooking(paymentData: PaymentData) {
  console.log('called rollbackBooking');

  return new Promise<void>((resolve, reject) => {
    bookingClient.UpdatePaymentStatus(paymentData, (err: Error | null) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

export async function addDriverEarnings(paymentData: PaymentData) {
  console.log('called addDriverEarnings',paymentData);
  return new Promise<any>((resolve, reject) => {
    driverClient.AddEarnings(
      paymentData,
      async (err: Error | null, response: any) => {
        console.log('res',response);
        
        if (err) return reject(err);
        if (response.status !== StatusCode.OK) {
          paymentData.paymentStatus = 'Failed';
          await rollbackBooking(paymentData);
          return reject(new Error('Failed to update driver'));
        }
        resolve(response);
      }
    );
  });
}

// export async function getDriverStripeFromDriverService(driverId: string) {
//   return new Promise<any>((resolve, reject) => {
//     driverClient.getDriverStripe({ driverId }, async (err: Error | null, response: any) => {
//       if (err) return reject(err);
//       if (response.status !== 'success') {
//         return reject(new Error('Failed to update driver'));
//       }
//       resolve(response);
//     });
//   });
// }
