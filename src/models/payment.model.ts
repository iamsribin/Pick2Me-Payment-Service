// import mongoose, { Schema, Document } from 'mongoose';

// export interface PaymentDoc extends Document {
//   bookingId: string;
//   userId: string;
//   driverId: string;
//   amount: number;
//   paymentMode: 'stripe' | 'wallet' | 'cash';
//   paymentStatus: 'pending' | 'completed' | 'failed';
//   stripePaymentIntentId?: string;
//   createdAt: Date;
// }

// const PaymentSchema = new Schema<PaymentDoc>(
//   {
//     bookingId: { type: String, required: true },
//     userId: { type: String, required: true },
//     driverId: { type: String, required: true },
//     amount: { type: Number, required: true },
//     paymentMode: {
//       type: String,
//       enum: ['stripe', 'wallet', 'cash'],
//       required: true,
//     },
//     paymentStatus: {
//       type: String,
//       enum: ['pending', 'completed', 'failed'],
//       default: 'pending',
//     },
//     stripePaymentIntentId: String,
//   },
//   { timestamps: true }
// );

// export const Payment = mongoose.model<PaymentDoc>('Payment', PaymentSchema);
