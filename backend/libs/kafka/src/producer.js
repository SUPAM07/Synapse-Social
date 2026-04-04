require('dotenv').config();
const { Kafka } = require('kafkajs');

let producer;

function getKafkaClient() {
  return new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID || 'ai-event-organiser',
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9093').split(','),
  });
}

async function getProducer() {
  if (!producer) {
    const kafka = getKafkaClient();
    producer = kafka.producer();
    await producer.connect();
  }
  return producer;
}

async function publishEvent(topic, key, value) {
  const prod = await getProducer();
  await prod.send({
    topic,
    messages: [
      {
        key: key ? String(key) : null,
        value: JSON.stringify(value),
        timestamp: Date.now(),
      },
    ],
  });
}

async function disconnectProducer() {
  if (producer) {
    await producer.disconnect();
    producer = null;
  }
}

module.exports = { getProducer, publishEvent, disconnectProducer };
