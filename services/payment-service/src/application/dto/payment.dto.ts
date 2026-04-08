export interface CreatePaymentDto {
  bookingId: string;
  userId: string;
  amount: number;
  currency?: string;
}

export interface ConfirmPaymentDto {
  paymentIntentId: string;
}
