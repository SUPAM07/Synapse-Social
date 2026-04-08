export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  services: {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    user: process.env.USER_SERVICE_URL || 'http://localhost:3002',
    event: process.env.EVENT_SERVICE_URL || 'http://localhost:3003',
    booking: process.env.BOOKING_SERVICE_URL || 'http://localhost:3004',
    payment: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3005',
    notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006',
  },
  cors: {
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
    adminUrl: process.env.ADMIN_URL || 'http://localhost:5174',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },
};
