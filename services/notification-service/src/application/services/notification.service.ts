import { emailClient } from '../../infrastructure/external/email.client';
import { createLogger } from '@uevent/utils';

const logger = createLogger('notification-service');

export class NotificationService {
  async handleUserRegistered(userId: string, email: string, fullName: string): Promise<void> {
    logger.info(`Sending welcome email to user ${userId}`);
    await emailClient.sendWelcomeEmail(email, fullName);
  }

  async handleBookingConfirmed(bookingId: string, userId: string, eventId: string, userEmail: string): Promise<void> {
    logger.info(`Sending booking confirmation for booking ${bookingId}`);
    await emailClient.sendBookingConfirmedEmail(userEmail, bookingId, eventId);
  }

  async handleBookingCancelled(bookingId: string, userId: string, reason: string, userEmail: string): Promise<void> {
    logger.info(`Sending booking cancellation for booking ${bookingId}`);
    await emailClient.sendBookingCancelledEmail(userEmail, bookingId, reason);
  }

  async handlePaymentProcessed(paymentId: string, userId: string, amount: number, currency: string, userEmail: string): Promise<void> {
    logger.info(`Sending payment success email for payment ${paymentId}`);
    await emailClient.sendPaymentSuccessEmail(userEmail, paymentId, amount, currency);
  }

  async handlePaymentFailed(userId: string, reason: string, userEmail: string): Promise<void> {
    logger.info(`Sending payment failure email for user ${userId}`);
    await emailClient.sendPaymentFailedEmail(userEmail, reason);
  }
}

export const notificationService = new NotificationService();
