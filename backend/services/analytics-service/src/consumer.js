import { Kafka, logLevel } from 'kafkajs';
import { env } from './config.js';
import {
  recordBooking,
  recordCancellation,
  recordCheckin,
  recordReview,
  recordEventCreated,
} from './metricsStore.js';

const TOPICS = ['ticket-booked', 'ticket-cancelled', 'event-created', 'checkin-success', 'review-posted'];

export async function startKafkaConsumer() {
  try {
    const kafka = new Kafka({
      clientId: 'analytics-service',
      brokers: env.kafkaBrokers,
      logLevel: logLevel.WARN,
    });

    const consumer = kafka.consumer({ groupId: 'analytics-group' });
    await consumer.connect();

    for (const topic of TOPICS) {
      await consumer.subscribe({ topic, fromBeginning: false });
    }

    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        try {
          const payload = JSON.parse(message.value.toString());
          handleMessage(topic, payload);
        } catch (err) {
          console.error(`Analytics: error processing ${topic}:`, err.message);
        }
      },
    });

    console.log('Analytics service: Kafka consumer started');
  } catch (err) {
    console.warn('Analytics service: Kafka unavailable –', err.message);
  }
}

function handleMessage(topic, payload) {
  const { eventId, data } = payload;
  switch (topic) {
    case 'ticket-booked':
      recordBooking(eventId);
      break;
    case 'ticket-cancelled':
      recordCancellation(eventId);
      break;
    case 'checkin-success':
      recordCheckin(eventId);
      break;
    case 'review-posted':
      recordReview(eventId, data?.rating);
      break;
    case 'event-created':
      recordEventCreated(eventId);
      break;
    default:
      break;
  }
}
