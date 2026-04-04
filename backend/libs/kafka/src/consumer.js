require('dotenv').config();
const { Kafka } = require('kafkajs');

function getKafkaClient() {
  return new Kafka({
    clientId: process.env.KAFKA_CLIENT_ID || 'ai-event-organiser',
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9093').split(','),
  });
}

async function createConsumer(groupId, topics, eachMessageHandler) {
  const kafka = getKafkaClient();
  const consumer = kafka.consumer({ groupId });

  await consumer.connect();

  for (const topic of topics) {
    await consumer.subscribe({ topic, fromBeginning: false });
  }

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      try {
        const value = JSON.parse(message.value.toString());
        await eachMessageHandler({ topic, partition, message, value });
      } catch (err) {
        console.error(`Error processing message on topic ${topic}:`, err);
      }
    },
  });

  return consumer;
}

module.exports = { createConsumer };
