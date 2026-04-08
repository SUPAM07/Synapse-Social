import Stripe from 'stripe';
import { createLogger } from '@uevent/utils';

const logger = createLogger('payment-service:stripe');

export class StripeClient {
  private stripe: Stripe;

  constructor(secretKey: string) {
    this.stripe = new Stripe(secretKey, { apiVersion: '2023-10-16' });
  }

  async createPaymentIntent(amount: number, currency: string, metadata: Record<string, string>): Promise<{
    paymentIntentId: string;
    clientSecret: string;
  }> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata,
      automatic_payment_methods: { enabled: true },
    });

    logger.info(`Created payment intent ${paymentIntent.id}`);

    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret!,
    };
  }

  async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    return this.stripe.paymentIntents.retrieve(paymentIntentId);
  }

  async constructWebhookEvent(payload: Buffer, signature: string, secret: string): Promise<Stripe.Event> {
    return this.stripe.webhooks.constructEvent(payload, signature, secret);
  }
}
