import { Kafka, logLevel } from 'kafkajs';
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
};

let kafka = null;
let producer = null;

export function getKafkaInstance(clientId = sharedConfig.kafkaClientId) {
  if (!kafka) {
    kafka = new Kafka({
      clientId,
      brokers: sharedConfig.kafkaBrokers,
      logLevel: logLevel.WARN,
    });
  }
  return kafka;
}

export async function createProducer(clientId = sharedConfig.kafkaClientId) {
  const k = getKafkaInstance(clientId);
  producer = k.producer();
  await producer.connect();
  logger.info('Kafka producer connected');
  return producer;
}

export function getProducer() {
  return producer;
}

export async function publishEvent(topic, message) {
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
    logger.error(`Failed to publish to ${topic}: ${err.message}`);
  }
}

export async function createConsumer(groupId, clientId = sharedConfig.kafkaClientId) {
  const k = getKafkaInstance(clientId);
  const consumer = k.consumer({ groupId });
  await consumer.connect();
  logger.info(`Kafka consumer connected (group: ${groupId})`);
  return consumer;
}

export async function subscribeAndRun(consumer, topics, handler) {
  for (const topic of topics) {
    await consumer.subscribe({ topic, fromBeginning: false });
  }
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const payload = JSON.parse(message.value.toString());
        await handler(topic, payload);
      } catch (err) {
        logger.error(`Error processing message from ${topic}: ${err.message}`);
      }
    },
  });
}

export async function disconnectProducer() {
  if (producer) {
    await producer.disconnect();
    producer = null;
  }
}
