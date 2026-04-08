export const config = {
  port: parseInt(process.env.PORT || '3006', 10),
  kafka: { brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(',') },
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'noreply@uevent.com',
  },
};
