import { Producer } from 'kafkajs';
import { createKafkaClient, createProducer, KafkaTopic, EventCreatedEvent, EventUpdatedEvent, EventDeletedEvent } from '@uevent/kafka';
import { createLogger } from '@uevent/utils';

const logger = createLogger('event-service:kafka');

export class KafkaPublisher {
  private producer: Producer | null = null;

  async connect(): Promise<void> {
    const kafka = createKafkaClient('event-service');
    this.producer = await createProducer(kafka);
    logger.info('Kafka producer connected');
  }

  async disconnect(): Promise<void> { await this.producer?.disconnect(); }

  async publishEventCreated(event: EventCreatedEvent): Promise<void> {
    if (!this.producer) throw new Error('Kafka producer not connected');
    await this.producer.send({ topic: KafkaTopic.EVENT_CREATED, messages: [{ key: event.eventId, value: JSON.stringify(event) }] });
  }

  async publishEventUpdated(event: EventUpdatedEvent): Promise<void> {
    if (!this.producer) throw new Error('Kafka producer not connected');
    await this.producer.send({ topic: KafkaTopic.EVENT_UPDATED, messages: [{ key: event.eventId, value: JSON.stringify(event) }] });
  }

  async publishEventDeleted(event: EventDeletedEvent): Promise<void> {
    if (!this.producer) throw new Error('Kafka producer not connected');
    await this.producer.send({ topic: KafkaTopic.EVENT_DELETED, messages: [{ key: event.eventId, value: JSON.stringify(event) }] });
  }
}

export const kafkaPublisher = new KafkaPublisher();
