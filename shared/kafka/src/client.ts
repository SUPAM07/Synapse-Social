import { Kafka, KafkaConfig, Producer, Consumer } from 'kafkajs';

export const createKafkaClient = (clientId: string, brokers?: string[]): Kafka => {
  const config: KafkaConfig = {
    clientId,
    brokers: brokers || (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    retry: { initialRetryTime: 100, retries: 8 },
  };
  return new Kafka(config);
};

export const createProducer = async (kafka: Kafka): Promise<Producer> => {
  const producer = kafka.producer();
  await producer.connect();
  return producer;
};

export const createConsumer = async (kafka: Kafka, groupId: string): Promise<Consumer> => {
  const consumer = kafka.consumer({ groupId });
  await consumer.connect();
  return consumer;
};
