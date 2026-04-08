export const config = {
  port: parseInt(process.env.PORT || '3002', 10),
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  },
};
