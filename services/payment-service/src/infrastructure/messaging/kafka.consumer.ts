import { createKafkaClient, createConsumer, KafkaTopic, BookingInitiatedEvent } from '@uevent/kafka';
import { createLogger } from '@uevent/utils';
import { paymentService } from '../../application/services/payment.service';

const logger = createLogger('payment-service:consumer');

export const startPaymentConsumer = async (): Promise<void> => {
  const kafka = createKafkaClient('payment-service-consumer');
  const consumer = await createConsumer(kafka, 'payment-service-group');

  await consumer.subscribe({ topics: [KafkaTopic.BOOKING_INITIATED], fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      const event = JSON.parse(message.value.toString()) as BookingInitiatedEvent;
      logger.info(`Processing payment for booking ${event.bookingId}`);
      try {
        await paymentService.processPaymentForBooking(event);
      } catch (err) {
        logger.error('Failed to process payment', { err, bookingId: event.bookingId });
      }
    },
  });

  logger.info('Payment consumer started');
};
