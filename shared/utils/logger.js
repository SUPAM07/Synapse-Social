import { createLogger, format, transports } from 'winston';

const { combine, timestamp, printf, colorize, errors } = format;

const logFormat = printf(({ level, message, timestamp: ts, stack }) => {
  return `${ts} [${level}]: ${stack || message}`;
});

export const createServiceLogger = (serviceName) =>
  createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
      colorize(),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      errors({ stack: true }),
      logFormat
    ),
    defaultMeta: { service: serviceName },
    transports: [new transports.Console()],
  });

export default createServiceLogger;
