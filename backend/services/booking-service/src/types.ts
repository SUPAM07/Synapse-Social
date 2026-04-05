/**
 * Shared DTO types for the Booking Service.
 */

/** Roles that a user can have in the system */
export type UserRole = 'customer' | 'organizer' | 'admin';

/** JWT payload decoded from a request token */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

/** Booking status values */
export type BookingStatus = 'confirmed' | 'cancelled' | 'attended';

/** A booking row as stored in PostgreSQL */
export interface BookingRow {
  id: number;
  user_id: string;
  event_id: string;
  status: BookingStatus;
  qr_code: string | null;
  booked_at: Date;
  cancelled_at: Date | null;
}

/** Event data returned from the Event Service */
export interface EventData {
  _id: string;
  title: string;
  status: 'pending' | 'approved' | 'rejected';
  availableSeats?: number;
  date: string;
  venue: string;
  category: string;
}

/** Payload for ticket-booked Kafka message */
export interface TicketBookedPayload {
  eventId: string;
  userId: string;
  data: {
    bookingId: number;
    userEmail: string;
    eventTitle: string;
  };
}

/** Payload for ticket-cancelled Kafka message */
export interface TicketCancelledPayload {
  eventId: string;
  userId: string;
  data: {
    bookingId: number;
  };
}

/** Request body for creating a booking */
export interface CreateBookingBody {
  eventId: string;
}

/** Response body for a successful booking */
export interface BookingResponse {
  success: boolean;
  message: string;
  data?: {
    booking: BookingRow;
  };
}
