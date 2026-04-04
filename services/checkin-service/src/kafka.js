import { Kafka, logLevel } from 'kafkajs';
import { env } from './config.js';

let producer = null;

export async function initKafkaProducer() {
  try {
    const kafka = new Kafka({ clientId: 'checkin-service', brokers: env.kafkaBrokers, logLevel: logLevel.WARN });
    producer = kafka.producer();
    await producer.connect();
    console.log('Check-in service: Kafka producer connected');
  } catch (err) {
    console.warn('Check-in service: Kafka unavailable –', err.message);
  }
}

export async function publishEvent(topic, message) {
  if (!producer) return;
  try {
    await producer.send({ topic, messages: [{ value: JSON.stringify({ ...message, timestamp: new Date().toISOString() }) }] });
  } catch (err) {
    console.error(`Failed to publish to ${topic}:`, err.message);
  }
}
