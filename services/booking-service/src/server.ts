import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import type { Request, Response, NextFunction } from 'express';

import { env } from './config.js';
import bookingRoutes from './routes/bookings.js';
import { initDB } from './db.js';
import { initKafkaProducer } from './kafka.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(compression());

app.get('/health', (_req: Request, res: Response) =>
  res.json({ success: true, service: 'booking-service' })
);
app.use('/', bookingRoutes);

// Global error handler
app.use((err: Error & { status?: number }, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Booking service error:', err);
  res.status(err.status ?? 500).json({
    success: false,
    message: err.message ?? 'Internal server error',
  });
});

async function start(): Promise<void> {
  await initDB();
  await initKafkaProducer();

  app.listen(env.port, () => {
    console.log(`Booking service running on port ${env.port}`);
  });
}

start();

export default app;
