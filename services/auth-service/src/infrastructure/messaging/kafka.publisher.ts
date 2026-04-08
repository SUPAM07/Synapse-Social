import { Producer } from 'kafkajs';
import { createKafkaClient, createProducer, KafkaTopic, UserRegisteredEvent, UserUpdatedEvent } from '@uevent/kafka';
import { createLogger } from '@uevent/utils';

const logger = createLogger('auth-service:kafka');

export class KafkaPublisher {
  private producer: Producer | null = null;

  async connect(): Promise<void> {
    const kafka = createKafkaClient('auth-service');
    this.producer = await createProducer(kafka);
    logger.info('Kafka producer connected');
  }

  async disconnect(): Promise<void> {
    await this.producer?.disconnect();
  }

  async publishUserRegistered(event: UserRegisteredEvent): Promise<void> {
    if (!this.producer) throw new Error('Kafka producer not connected');
    await this.producer.send({
      topic: KafkaTopic.USER_REGISTERED,
      messages: [{ key: event.userId, value: JSON.stringify(event) }],
    });
    logger.info(`Published ${KafkaTopic.USER_REGISTERED} for user ${event.userId}`);
  }

  async publishUserUpdated(event: UserUpdatedEvent): Promise<void> {
    if (!this.producer) throw new Error('Kafka producer not connected');
    await this.producer.send({
      topic: KafkaTopic.USER_UPDATED,
      messages: [{ key: event.userId, value: JSON.stringify(event) }],
    });
    logger.info(`Published ${KafkaTopic.USER_UPDATED} for user ${event.userId}`);
  }
}

export const kafkaPublisher = new KafkaPublisher();
