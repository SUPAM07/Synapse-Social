import winston from 'winston';

const { combine, timestamp, colorize, printf, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp: ts, stack }) => {
  return `${ts} [${level}]: ${stack || message}`;
});

export const createLogger = (serviceName: string): winston.Logger => {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      errors({ stack: true }),
      colorize({ all: true }),
      logFormat,
    ),
    defaultMeta: { service: serviceName },
    transports: [
      new winston.transports.Console(),
    ],
  });
};

export const logger = createLogger('uevent');
