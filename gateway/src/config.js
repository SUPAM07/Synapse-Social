import dotenv from 'dotenv';
dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 3000),
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_change_me',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',

  // Downstream services
  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  eventServiceUrl: process.env.EVENT_SERVICE_URL || 'http://localhost:3002',
  bookingServiceUrl: process.env.BOOKING_SERVICE_URL || 'http://localhost:3003',
  reviewServiceUrl: process.env.REVIEW_SERVICE_URL || 'http://localhost:3004',
  checkinServiceUrl: process.env.CHECKIN_SERVICE_URL || 'http://localhost:3005',
  notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006',
  analyticsServiceUrl: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3007',
};

export default env;
