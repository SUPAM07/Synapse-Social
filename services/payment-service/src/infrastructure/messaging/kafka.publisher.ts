import { Producer } from 'kafkajs';
import { createKafkaClient, createProducer, KafkaTopic, PaymentProcessedEvent, PaymentFailedEvent } from '@uevent/kafka';
import { createLogger } from '@uevent/utils';

const logger = createLogger('payment-service:kafka');

export class KafkaPublisher {
  private producer: Producer | null = null;

  async connect(): Promise<void> {
    const kafka = createKafkaClient('payment-service');
    this.producer = await createProducer(kafka);
    logger.info('Kafka producer connected');
  }

  async disconnect(): Promise<void> { await this.producer?.disconnect(); }

  async publishPaymentProcessed(event: PaymentProcessedEvent): Promise<void> {
    if (!this.producer) throw new Error('Kafka producer not connected');
    await this.producer.send({ topic: KafkaTopic.PAYMENT_PROCESSED, messages: [{ key: event.paymentId, value: JSON.stringify(event) }] });
    logger.info(`Published PaymentProcessed for booking ${event.bookingId}`);
  }

  async publishPaymentFailed(event: PaymentFailedEvent): Promise<void> {
    if (!this.producer) throw new Error('Kafka producer not connected');
    await this.producer.send({ topic: KafkaTopic.PAYMENT_FAILED, messages: [{ key: event.paymentId, value: JSON.stringify(event) }] });
    logger.info(`Published PaymentFailed for booking ${event.bookingId}`);
  }
}

export const kafkaPublisher = new KafkaPublisher();
