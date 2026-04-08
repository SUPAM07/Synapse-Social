import {
  createKafkaClient, createConsumer, KafkaTopic,
  UserRegisteredEvent, BookingConfirmedEvent, BookingCancelledEvent,
  PaymentProcessedEvent, PaymentFailedEvent,
} from '@uevent/kafka';
import { createLogger } from '@uevent/utils';
import { notificationService } from '../../application/services/notification.service';

const logger = createLogger('notification-service:consumer');

// In production, these would be fetched from user-service
const getUserEmail = async (userId: string): Promise<string> => {
  return `user-${userId}@example.com`;
};

export const startNotificationConsumer = async (): Promise<void> => {
  const kafka = createKafkaClient('notification-service-consumer');
  const consumer = await createConsumer(kafka, 'notification-service-group');

  await consumer.subscribe({
    topics: [
      KafkaTopic.USER_REGISTERED,
      KafkaTopic.BOOKING_CONFIRMED,
      KafkaTopic.BOOKING_CANCELLED,
      KafkaTopic.PAYMENT_PROCESSED,
      KafkaTopic.PAYMENT_FAILED,
      KafkaTopic.EVENT_CREATED,
    ],
    fromBeginning: false,
  });

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      if (!message.value) return;
      const payload = JSON.parse(message.value.toString());

      try {
        switch (topic) {
          case KafkaTopic.USER_REGISTERED: {
            const event = payload as UserRegisteredEvent;
            await notificationService.handleUserRegistered(event.userId, event.email, event.fullName);
            break;
          }
          case KafkaTopic.BOOKING_CONFIRMED: {
            const event = payload as BookingConfirmedEvent;
            const email = await getUserEmail(event.userId);
            await notificationService.handleBookingConfirmed(event.bookingId, event.userId, event.eventId, email);
            break;
          }
          case KafkaTopic.BOOKING_CANCELLED: {
            const event = payload as BookingCancelledEvent;
            const email = await getUserEmail(event.userId);
            await notificationService.handleBookingCancelled(event.bookingId, event.userId, event.reason, email);
            break;
          }
          case KafkaTopic.PAYMENT_PROCESSED: {
            const event = payload as PaymentProcessedEvent;
            const email = await getUserEmail(event.userId);
            await notificationService.handlePaymentProcessed(event.paymentId, event.userId, event.amount, event.currency, email);
            break;
          }
          case KafkaTopic.PAYMENT_FAILED: {
            const event = payload as PaymentFailedEvent;
            const email = await getUserEmail(event.userId);
            await notificationService.handlePaymentFailed(event.userId, event.reason, email);
            break;
          }
          case KafkaTopic.EVENT_CREATED:
            logger.info('New event created, could notify subscribers');
            break;
          default:
            logger.warn(`Unknown topic: ${topic}`);
        }
      } catch (err) {
        logger.error(`Failed to handle notification for topic ${topic}`, { err });
      }
    },
  });

  logger.info('Notification consumer started');
};
