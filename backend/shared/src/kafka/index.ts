import { Kafka, Producer, Consumer, logLevel } from 'kafkajs';
import { sharedConfig } from '../config/index.js';
import { createServiceLogger } from '../utils/logger.js';

const logger = createServiceLogger('kafka');

// Kafka topic constants
export const KAFKA_TOPICS = {
  TICKET_BOOKED: 'ticket-booked',
  TICKET_CANCELLED: 'ticket-cancelled',
  EVENT_CREATED: 'event-created',
  EVENT_APPROVED: 'event-approved',
  CHECKIN_SUCCESS: 'checkin-success',
  REVIEW_POSTED: 'review-posted',
} as const;

export type KafkaTopic = (typeof KAFKA_TOPICS)[keyof typeof KAFKA_TOPICS];

export interface KafkaMessage {
  eventId: string;
  userId?: string;
  data: Record<string, unknown>;
  timestamp?: string;
}

let kafka: Kafka | null = null;
let producer: Producer | null = null;

export function getKafkaInstance(clientId: string = sharedConfig.kafkaClientId): Kafka {
  if (!kafka) {
    kafka = new Kafka({
      clientId,
      brokers: sharedConfig.kafkaBrokers,
      logLevel: logLevel.WARN,
    });
  }
  return kafka;
}

export async function createProducer(
  clientId: string = sharedConfig.kafkaClientId
): Promise<Producer> {
  const k = getKafkaInstance(clientId);
  producer = k.producer();
  await producer.connect();
  logger.info('Kafka producer connected');
  return producer;
}

export function getProducer(): Producer | null {
  return producer;
}

export async function publishEvent(topic: string, message: KafkaMessage): Promise<void> {
  if (!producer) {
    logger.warn(`Kafka producer not initialized, skipping publish to ${topic}`);
    return;
  }
  try {
    await producer.send({
      topic,
      messages: [
        {
          value: JSON.stringify({
            ...message,
            timestamp: new Date().toISOString(),
          }),
        },
      ],
    });
    logger.info(`Published to ${topic}`);
  } catch (err) {
    logger.error(`Failed to publish to ${topic}: ${(err as Error).message}`);
  }
}

export async function createConsumer(
  groupId: string,
  clientId: string = sharedConfig.kafkaClientId
): Promise<Consumer> {
  const k = getKafkaInstance(clientId);
  const consumer = k.consumer({ groupId });
  await consumer.connect();
  logger.info(`Kafka consumer connected (group: ${groupId})`);
  return consumer;
}

export type MessageHandler = (topic: string, payload: KafkaMessage) => Promise<void>;

export async function subscribeAndRun(
  consumer: Consumer,
  topics: string[],
  handler: MessageHandler
): Promise<void> {
  for (const topic of topics) {
    await consumer.subscribe({ topic, fromBeginning: false });
  }
  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      try {
        const payload = JSON.parse(message.value?.toString() ?? '{}') as KafkaMessage;
        await handler(topic, payload);
      } catch (err) {
        logger.error(`Error processing message from ${topic}: ${(err as Error).message}`);
      }
    },
  });
}

export async function disconnectProducer(): Promise<void> {
  if (producer) {
    await producer.disconnect();
    producer = null;
  }
}
