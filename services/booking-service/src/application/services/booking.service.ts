import { BookingRepository } from '../../infrastructure/repositories/booking.repository';
import { kafkaPublisher } from '../../infrastructure/messaging/kafka.publisher';
import { NotFoundError, ForbiddenError } from '@uevent/utils';
import { createLogger } from '@uevent/utils';
import { CreateBookingDto, BookingQueryDto } from '../dto/booking.dto';

const logger = createLogger('booking-service');
const bookingRepo = new BookingRepository();

const EVENT_TICKET_PRICE = 10; // Would normally call event-service

export class BookingService {
  async getBookings(query: BookingQueryDto) {
    return bookingRepo.findMany(query);
  }

  async getBooking(id: string, userId: string, userRole: string) {
    const booking = await bookingRepo.findById(id);
    if (!booking) throw new NotFoundError('Booking');
    if (booking.userId !== userId && userRole !== 'admin') throw new ForbiddenError();
    return booking;
  }

  async createBooking(userId: string, dto: CreateBookingDto) {
    // In production, would call event-service to get price
    const totalPrice = EVENT_TICKET_PRICE * dto.quantity;

    const booking = await bookingRepo.create({
      userId,
      eventId: dto.eventId,
      quantity: dto.quantity,
      totalPrice,
      status: 'PENDING',
      promoCode: dto.promoCode ?? null,
      paymentId: null,
    });

    try {
      await kafkaPublisher.publishBookingInitiated({
        messageId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        version: 1,
        bookingId: booking.id,
        userId: booking.userId,
        eventId: booking.eventId,
        quantity: booking.quantity,
        totalPrice: booking.totalPrice,
        promoCode: booking.promoCode ?? undefined,
      });
    } catch (err) {
      logger.warn('Failed to publish BookingInitiated', { err });
    }

    return booking;
  }

  async cancelBooking(id: string, userId: string, userRole: string) {
    const booking = await bookingRepo.findById(id);
    if (!booking) throw new NotFoundError('Booking');
    if (booking.userId !== userId && userRole !== 'admin') throw new ForbiddenError();

    const updated = await bookingRepo.updateStatus(id, 'CANCELLED');

    try {
      await kafkaPublisher.publishBookingCancelled({
        messageId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        version: 1,
        bookingId: id,
        userId: booking.userId,
        eventId: booking.eventId,
        reason: 'User cancelled',
      });
    } catch (err) {
      logger.warn('Failed to publish BookingCancelled', { err });
    }

    return updated;
  }
}

export const bookingService = new BookingService();
