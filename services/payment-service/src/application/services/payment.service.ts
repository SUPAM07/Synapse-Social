import { PaymentRepository } from '../../infrastructure/repositories/payment.repository';
import { kafkaPublisher } from '../../infrastructure/messaging/kafka.publisher';
import { StripeClient } from '../../infrastructure/external/stripe.client';
import { NotFoundError } from '@uevent/utils';
import { createLogger } from '@uevent/utils';
import { BookingInitiatedEvent } from '@uevent/kafka';
import { config } from '../../config';

const logger = createLogger('payment-service');
const paymentRepo = new PaymentRepository();
const stripeClient = new StripeClient(config.stripe.secretKey);

export class PaymentService {
  async processPaymentForBooking(event: BookingInitiatedEvent): Promise<void> {
    const existing = await paymentRepo.findByBookingId(event.bookingId);
    if (existing) {
      logger.warn(`Payment already exists for booking ${event.bookingId}`);
      return;
    }

    const payment = await paymentRepo.create({
      bookingId: event.bookingId,
      userId: event.userId,
      amount: event.totalPrice,
      currency: 'usd',
      status: 'PENDING',
      stripePaymentIntentId: null,
      stripeClientSecret: null,
      failureReason: null,
    });

    try {
      const { paymentIntentId, clientSecret } = await stripeClient.createPaymentIntent(
        event.totalPrice,
        'usd',
        { bookingId: event.bookingId, userId: event.userId },
      );

      await paymentRepo.update(payment.id, {
        stripePaymentIntentId: paymentIntentId,
        stripeClientSecret: clientSecret,
        status: 'SUCCEEDED',
      });

      await kafkaPublisher.publishPaymentProcessed({
        messageId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        version: 1,
        paymentId: payment.id,
        bookingId: event.bookingId,
        userId: event.userId,
        amount: event.totalPrice,
        currency: 'usd',
        stripePaymentIntentId: paymentIntentId,
      });
    } catch (err) {
      logger.error('Stripe payment failed', { err });
      const reason = err instanceof Error ? err.message : 'Payment processing failed';

      await paymentRepo.update(payment.id, { status: 'FAILED', failureReason: reason });

      await kafkaPublisher.publishPaymentFailed({
        messageId: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        version: 1,
        paymentId: payment.id,
        bookingId: event.bookingId,
        userId: event.userId,
        reason,
      });
    }
  }

  async getPayment(id: string) {
    const payment = await paymentRepo.findById(id);
    if (!payment) throw new NotFoundError('Payment');
    return payment;
  }

  async getPaymentByBookingId(bookingId: string) {
    const payment = await paymentRepo.findByBookingId(bookingId);
    if (!payment) throw new NotFoundError('Payment');
    return payment;
  }
}

export const paymentService = new PaymentService();
