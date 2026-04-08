import { Producer } from 'kafkajs';
import {
  createKafkaClient, createProducer, KafkaTopic,
  BookingInitiatedEvent, BookingConfirmedEvent, BookingCancelledEvent,
} from '@uevent/kafka';
import { createLogger } from '@uevent/utils';

const logger = createLogger('booking-service:kafka');

export class KafkaPublisher {
  private producer: Producer | null = null;

  async connect(): Promise<void> {
    const kafka = createKafkaClient('booking-service');
    this.producer = await createProducer(kafka);
    logger.info('Kafka producer connected');
  }

  async disconnect(): Promise<void> { await this.producer?.disconnect(); }

  async publishBookingInitiated(event: BookingInitiatedEvent): Promise<void> {
    if (!this.producer) throw new Error('Kafka producer not connected');
    await this.producer.send({ topic: KafkaTopic.BOOKING_INITIATED, messages: [{ key: event.bookingId, value: JSON.stringify(event) }] });
  }

  async publishBookingConfirmed(event: BookingConfirmedEvent): Promise<void> {
    if (!this.producer) throw new Error('Kafka producer not connected');
    await this.producer.send({ topic: KafkaTopic.BOOKING_CONFIRMED, messages: [{ key: event.bookingId, value: JSON.stringify(event) }] });
  }

  async publishBookingCancelled(event: BookingCancelledEvent): Promise<void> {
    if (!this.producer) throw new Error('Kafka producer not connected');
    await this.producer.send({ topic: KafkaTopic.BOOKING_CANCELLED, messages: [{ key: event.bookingId, value: JSON.stringify(event) }] });
  }
}

export const kafkaPublisher = new KafkaPublisher();
