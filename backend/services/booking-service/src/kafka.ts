import { Kafka, Producer, logLevel } from 'kafkajs';
import { env } from './config.js';

let producer: Producer | null = null;

export async function initKafkaProducer(): Promise<void> {
  try {
    const kafka = new Kafka({
      clientId: 'booking-service',
      brokers: env.kafkaBrokers,
      logLevel: logLevel.WARN,
    });
    producer = kafka.producer();
    await producer.connect();
    console.log('Booking service: Kafka producer connected');
  } catch (err) {
    console.warn('Booking service: Kafka unavailable –', (err as Error).message);
  }
}

export async function publishEvent(
  topic: string,
  message: Record<string, unknown>
): Promise<void> {
  if (!producer) return;
  try {
    await producer.send({
      topic,
      messages: [{ value: JSON.stringify({ ...message, timestamp: new Date().toISOString() }) }],
    });
  } catch (err) {
    console.error(`Failed to publish to ${topic}:`, (err as Error).message);
  }
}

export async function disconnectKafka(): Promise<void> {
  if (producer) {
    await producer.disconnect();
    producer = null;
  }
}
