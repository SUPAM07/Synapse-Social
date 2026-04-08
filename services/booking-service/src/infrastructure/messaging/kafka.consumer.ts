import { createKafkaClient, createConsumer, KafkaTopic, PaymentProcessedEvent, PaymentFailedEvent } from '@uevent/kafka';
import { createLogger } from '@uevent/utils';
import { BookingRepository } from '../repositories/booking.repository';
import { kafkaPublisher } from './kafka.publisher';

const logger = createLogger('booking-service:consumer');
const bookingRepo = new BookingRepository();

export const startBookingConsumer = async (): Promise<void> => {
  const kafka = createKafkaClient('booking-service-consumer');
  const consumer = await createConsumer(kafka, 'booking-service-group');

  await consumer.subscribe({
    topics: [KafkaTopic.PAYMENT_PROCESSED, KafkaTopic.PAYMENT_FAILED],
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      if (!message.value) return;
      const payload = JSON.parse(message.value.toString());

      if (topic === KafkaTopic.PAYMENT_PROCESSED) {
        const event = payload as PaymentProcessedEvent;
        logger.info(`Payment processed for booking ${event.bookingId}`);
        try {
          const booking = await bookingRepo.updateStatus(event.bookingId, 'CONFIRMED', event.paymentId);
          await kafkaPublisher.publishBookingConfirmed({
            messageId: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            version: 1,
            bookingId: booking.id,
            userId: booking.userId,
            eventId: booking.eventId,
            paymentId: event.paymentId,
          });
        } catch (err) {
          logger.error('Failed to confirm booking', { err, bookingId: event.bookingId });
        }
      } else if (topic === KafkaTopic.PAYMENT_FAILED) {
        const event = payload as PaymentFailedEvent;
        logger.info(`Payment failed for booking ${event.bookingId}`);
        try {
          const booking = await bookingRepo.updateStatus(event.bookingId, 'FAILED');
          await kafkaPublisher.publishBookingCancelled({
            messageId: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            version: 1,
            bookingId: booking.id,
            userId: booking.userId,
            eventId: booking.eventId,
            reason: event.reason,
          });
        } catch (err) {
          logger.error('Failed to cancel booking', { err, bookingId: event.bookingId });
        }
      }
    },
  });

  logger.info('Booking consumer started');
};
