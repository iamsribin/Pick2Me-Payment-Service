import { bookingClient, driverClient } from '../connection';

export async function markBookingAsPaid(bookingId: string, paymentId: string) {
  return new Promise<any>((resolve, reject) => {
    bookingClient.MarkAsPaid({ bookingId, paymentId }, (err: Error | null, response: any) => {
      if (err) return reject(err);
      if (response.status !== 'success') return reject(new Error('Failed to update booking'));
      resolve(response);
    });
  });
}

export async function rollbackBooking(bookingId: string) {
  return new Promise<void>((resolve, reject) => {
    bookingClient.RollbackPayment({ bookingId }, (err: Error | null) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

export async function addDriverEarnings(
  driverId: string,
  adminShare: number,
  driverShare: number,
  transactionId: string,
  bookingId: string
) {
  return new Promise<any>( (resolve, reject) => {
    driverClient.AddEarnings(
      { driverId, adminShare, driverShare, transactionId },
      async (err: Error | null, response: any) => {
        if (err) return reject(err);
        if (response.status !== 'success') {
          await rollbackBooking(bookingId);
          return reject(new Error('Failed to update driver'));
        }
        resolve(response);
      }
    );
  });
}

export async function getDriverStripeFromDriverService(driverId: string) {
  return new Promise<any>( (resolve, reject) => {
    driverClient.getDriverStripe({ driverId }, async (err: Error | null, response: any) => {
      if (err) return reject(err);
      if (response.status !== 'success') {
        return reject(new Error('Failed to update driver'));
      }
      resolve(response);
    });
  });
}
