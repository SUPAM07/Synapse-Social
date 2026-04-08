import { Producer } from 'kafkajs';
import { createKafkaClient, createProducer, KafkaTopic, UserUpdatedEvent, UserDeletedEvent } from '@uevent/kafka';
import { createLogger } from '@uevent/utils';

const logger = createLogger('user-service:kafka');

export class KafkaPublisher {
  private producer: Producer | null = null;

  async connect(): Promise<void> {
    const kafka = createKafkaClient('user-service');
    this.producer = await createProducer(kafka);
    logger.info('Kafka producer connected');
  }

  async disconnect(): Promise<void> {
    await this.producer?.disconnect();
  }

  async publishUserUpdated(event: UserUpdatedEvent): Promise<void> {
    if (!this.producer) throw new Error('Kafka producer not connected');
    await this.producer.send({
      topic: KafkaTopic.USER_UPDATED,
      messages: [{ key: event.userId, value: JSON.stringify(event) }],
    });
  }

  async publishUserDeleted(event: UserDeletedEvent): Promise<void> {
    if (!this.producer) throw new Error('Kafka producer not connected');
    await this.producer.send({
      topic: KafkaTopic.USER_DELETED,
      messages: [{ key: event.userId, value: JSON.stringify(event) }],
    });
  }
}

export const kafkaPublisher = new KafkaPublisher();
