import dotenv from 'dotenv';
dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3005),
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_change_me',
  kafkaBrokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  bookingServiceUrl: process.env.BOOKING_SERVICE_URL || 'http://localhost:3003',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};

export default env;
