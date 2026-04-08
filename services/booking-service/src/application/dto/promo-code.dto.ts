export interface CreatePromoCodeDto {
  promoCode: string;
  discount: number;
  eventId: string;
}

export interface UpdatePromoCodeDto {
  promoCode?: string;
  discount?: number;
}

export interface ValidatePromoCodeDto {
  promoCode: string;
  eventId: string;
}
