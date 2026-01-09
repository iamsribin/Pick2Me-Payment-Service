import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  // _id: string;
  transactionId: string;
  bookingId: string;
  userId: string;
  driverId: string;
  amount: number;
  paymentMethod: 'stripe' | 'wallet' | 'cash';
  status: 'pending' | 'completed' | 'failed';
  adminShare: number;
  driverShare: number;
  stripeSessionId?: string;
  failureReason?: string;
  idempotencyKey: string;
  createdAt: Date;
  updatedAt?: Date;
}

// const transactionSchema = new Schema<ITransaction>(
//   {
//     transactionId: { type: String, required: true, unique: true },
//     bookingId: { type: String, required: true },
//     userId: { type: String, required: true },
//     driverId: { type: String, required: true },
//     amount: { type: Number, required: true },
//     paymentMethod: {
//       type: String,
//       enum: ['stripe', 'wallet', 'cash'],
//       required: true,
//     },
//     status: {
//       type: String,
//       enum: ['pending', 'completed', 'failed'],
//       required: true,
//     },
//     adminShare: { type: Number, required: true },
//     driverShare: { type: Number, required: true },
//     stripeSessionId: { type: String },
//     failureReason: { type: String },
//     idempotencyKey: { type: String, required: true, unique: true },
//     createdAt: { type: Date, default: Date.now },
//     updatedAt: { type: Date },
//   },
//   { timestamps: true }
// );

// export const TransactionModel = mongoose.model<ITransaction>('Transaction', transactionSchema);
