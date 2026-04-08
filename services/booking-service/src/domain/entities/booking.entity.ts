export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'FAILED';

export interface BookingEntity {
  id: string;
  userId: string;
  eventId: string;
  quantity: number;
  totalPrice: number;
  status: BookingStatus;
  promoCode?: string | null;
  paymentId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
