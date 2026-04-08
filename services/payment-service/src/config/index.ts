export const config = {
  port: parseInt(process.env.PORT || '3005', 10),
  kafka: { brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(',') },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },
};
