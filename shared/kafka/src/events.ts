export interface BaseEvent {
  /** Unique identifier for this Kafka message (not a domain event ID) */
  messageId: string;
  timestamp: string;
  version: number;
}

export interface UserRegisteredEvent extends BaseEvent {
  userId: string;
  login: string;
  email: string;
  fullName: string;
}

export interface UserUpdatedEvent extends BaseEvent {
  userId: string;
  login?: string;
  email?: string;
  fullName?: string;
  picturePath?: string;
}

export interface UserDeletedEvent extends BaseEvent {
  userId: string;
}

export interface EventCreatedEvent extends BaseEvent {
  eventId: string;
  title: string;
  organizerId: string;
  startDate: string;
  endDate: string;
  location: string;
  price: number;
  capacity: number;
}

export interface EventUpdatedEvent extends BaseEvent {
  eventId: string;
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  price?: number;
  capacity?: number;
}

export interface EventDeletedEvent extends BaseEvent {
  eventId: string;
}

export interface BookingInitiatedEvent extends BaseEvent {
  bookingId: string;
  userId: string;
  eventId: string;
  quantity: number;
  totalPrice: number;
  promoCode?: string;
}

export interface BookingConfirmedEvent extends BaseEvent {
  bookingId: string;
  userId: string;
  eventId: string;
  paymentId: string;
}

export interface BookingCancelledEvent extends BaseEvent {
  bookingId: string;
  userId: string;
  eventId: string;
  reason: string;
}

export interface PaymentProcessedEvent extends BaseEvent {
  paymentId: string;
  bookingId: string;
  userId: string;
  amount: number;
  currency: string;
  stripePaymentIntentId: string;
}

export interface PaymentFailedEvent extends BaseEvent {
  paymentId: string;
  bookingId: string;
  userId: string;
  reason: string;
}

export interface NotificationSentEvent extends BaseEvent {
  notificationId: string;
  userId: string;
  type: string;
  channel: string;
  subject: string;
}
