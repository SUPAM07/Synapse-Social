require('dotenv').config();
const nodemailer = require('nodemailer');
const { createConsumer, TOPICS } = require('@ai-event-organiser/kafka');

const GROUP_ID = process.env.KAFKA_GROUP_ID || 'notifications-service';

const transporter = nodemailer.createTransport({
  host: process.env.MAILHOG_HOST || 'localhost',
  port: parseInt(process.env.MAILHOG_PORT || '1025'),
  ignoreTLS: true,
});

async function sendEmail({ to, subject, html }) {
  try {
    await transporter.sendMail({
      from: process.env.FROM_EMAIL || 'noreply@ai-event-organiser.com',
      to,
      subject,
      html,
    });
    console.log(`Email sent to ${to}: ${subject}`);
  } catch (err) {
    console.error(`Failed to send email to ${to}:`, err.message);
  }
}

async function handleMessage({ topic, value }) {
  console.log(`Received message on topic ${topic}:`, value);

  switch (topic) {
    case TOPICS.USER_REGISTERED:
      await sendEmail({
        to: value.email,
        subject: 'Welcome to AI Event Organiser!',
        html: `
          <h1>Welcome, ${value.name}!</h1>
          <p>Thank you for registering with AI Event Organiser.</p>
          <p>Start exploring events or create your own!</p>
        `,
      });
      break;

    case TOPICS.TICKET_PURCHASED:
      await sendEmail({
        to: value.attendeeEmail,
        subject: `Your ticket for ${value.eventTitle}`,
        html: `
          <h1>Ticket Confirmation</h1>
          <p>Hi ${value.attendeeName},</p>
          <p>Your ticket for <strong>${value.eventTitle}</strong> has been confirmed.</p>
          <p>Your QR code: <code>${value.qrCode}</code></p>
          <p>Please show this at the event entrance.</p>
        `,
      });
      break;

    default:
      console.log(`Unhandled topic: ${topic}`);
  }
}

async function start() {
  console.log('Starting Notifications Service...');

  const topics = [TOPICS.USER_REGISTERED, TOPICS.TICKET_PURCHASED];

  try {
    await createConsumer(GROUP_ID, topics, handleMessage);
    console.log(`Notifications Service listening on topics: ${topics.join(', ')}`);
  } catch (err) {
    console.error('Failed to start Notifications Service:', err);
    process.exit(1);
  }
}

start();
