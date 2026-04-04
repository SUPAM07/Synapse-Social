import dotenv from 'dotenv';
dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3007),
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_change_me',
  kafkaBrokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
};

export default env;
