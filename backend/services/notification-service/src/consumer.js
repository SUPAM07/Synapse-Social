import { Kafka, logLevel } from 'kafkajs';
import { env } from './config.js';
import { sendEmail } from './email.js';
import {
  bookingConfirmedTemplate,
  bookingCancelledTemplate,
  eventApprovedTemplate,
} from './templates/index.js';

const TOPICS = ['ticket-booked', 'ticket-cancelled', 'event-approved'];

export async function startKafkaConsumer() {
  try {
    const kafka = new Kafka({
      clientId: 'notification-service',
      brokers: env.kafkaBrokers,
      logLevel: logLevel.WARN,
    });

    const consumer = kafka.consumer({ groupId: 'notification-group' });
    await consumer.connect();

    for (const topic of TOPICS) {
      await consumer.subscribe({ topic, fromBeginning: false });
    }

    await consumer.run({
      eachMessage: async ({ topic, message }) => {
        try {
          const payload = JSON.parse(message.value.toString());
          await handleMessage(topic, payload);
        } catch (err) {
          console.error(`Notification: error processing ${topic}:`, err.message);
        }
      },
    });

    console.log('Notification service: Kafka consumer started');
  } catch (err) {
    console.warn('Notification service: Kafka unavailable –', err.message);
  }
}

async function handleMessage(topic, payload) {
  const { data, userId } = payload;

  switch (topic) {
    case 'ticket-booked': {
      const { subject, html } = bookingConfirmedTemplate(data);
      if (data.userEmail) {
        await sendEmail({ to: data.userEmail, subject, html });
      }
      break;
    }
    case 'ticket-cancelled': {
      const { subject, html } = bookingCancelledTemplate(data);
      if (data.userEmail) {
        await sendEmail({ to: data.userEmail, subject, html });
      }
      break;
    }
    case 'event-approved': {
      const { subject, html } = eventApprovedTemplate(data);
      if (data.organizerEmail) {
        await sendEmail({ to: data.organizerEmail, subject, html });
      }
      break;
    }
    default:
      console.log(`Notification: unhandled topic ${topic} for user ${userId}`);
  }
}
