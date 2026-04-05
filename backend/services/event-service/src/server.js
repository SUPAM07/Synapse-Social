import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import path from 'path';
import { fileURLToPath } from 'url';

import { env } from './config.js';
import eventRoutes from './routes/events.js';
import { initKafkaProducer } from './kafka.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
let redisClient = null;

export function getRedis() {
  return redisClient;
}

app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));
app.use(compression());
app.use('/uploads', express.static(path.join(__dirname, '..', env.uploadsDir)));

app.get('/health', (_req, res) => res.json({ success: true, service: 'event-service' }));
app.use('/', eventRoutes);

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('Event service error:', err);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
});

async function start() {
  await mongoose.connect(env.mongoUri);
  console.log('Event service: MongoDB connected');

  try {
    redisClient = new Redis(env.redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1 });
    await redisClient.connect();
    console.log('Event service: Redis connected');
  } catch (err) {
    console.warn('Event service: Redis unavailable –', err.message);
    redisClient = null;
  }

  await initKafkaProducer();

  app.listen(env.port, () => {
    console.log(`Event service running on port ${env.port}`);
  });
}

start();

export default app;
