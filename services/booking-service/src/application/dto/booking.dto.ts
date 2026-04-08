export interface CreateBookingDto {
  eventId: string;
  quantity: number;
  promoCode?: string;
}

export interface BookingQueryDto {
  userId?: string;
  eventId?: string;
  status?: string;
  page?: number;
  limit?: number;
}
