import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createLogger, ClientError } from '@uevent/utils';
import { kafkaPublisher } from './infrastructure/messaging/kafka.publisher';
import { startBookingConsumer } from './infrastructure/messaging/kafka.consumer';
import { config } from './config';
import router from './api/routes';

const logger = createLogger('booking-service');
const app = express();
app.use(helmet()); app.use(cors()); app.use(express.json());
app.use('/', router);
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ClientError) { res.status(err.status).json({ error: err.name, message: err.message }); return; }
  logger.error('Unhandled error', { err });
  res.status(500).json({ error: 'InternalServerError', message: 'Something went wrong' });
});

const start = async (): Promise<void> => {
  try {
    await kafkaPublisher.connect();
    await startBookingConsumer();
  } catch (err) { logger.warn('Kafka connection failed', { err }); }
  app.listen(config.port, () => logger.info(`Booking service running on port ${config.port}`));
};
start().catch((err) => { logger.error('Failed to start', { err }); process.exit(1); });
process.on('SIGTERM', async () => { await kafkaPublisher.disconnect(); process.exit(0); });
