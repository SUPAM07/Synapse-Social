import dotenv from 'dotenv';
dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3003),
  postgresUri: process.env.POSTGRES_URI || 'postgresql://postgres:postgres@localhost:5432/ems_bookings',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_change_me',
  kafkaBrokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  eventServiceUrl: process.env.EVENT_SERVICE_URL || 'http://localhost:3002',
};

export default env;
