export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'access-secret-change-me',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh-secret-change-me',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'noreply@uevent.com',
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  kafka: {
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
  },
};
