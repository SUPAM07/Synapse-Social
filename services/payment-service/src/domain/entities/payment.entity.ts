export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';

export interface PaymentEntity {
  id: string;
  bookingId: string;
  userId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  stripePaymentIntentId?: string | null;
  stripeClientSecret?: string | null;
  failureReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
