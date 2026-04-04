import dotenv from 'dotenv';
dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3004),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/ems_reviews',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_change_me',
  kafkaBrokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
};

export default env;
