export interface PromoCodeEntity {
  id: string;
  promoCode: string;
  discount: number;
  eventId: string;
  createdAt: Date;
  updatedAt: Date;
}

export function validateDiscount(discount: number): boolean {
  return Number.isInteger(discount) && discount >= 0 && discount <= 100;
}
