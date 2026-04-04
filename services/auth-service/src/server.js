import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import Redis from 'ioredis';

import { env } from './config.js';
import authRoutes from './routes/auth.js';

const app = express();
let redisClient = null;

export function getRedis() {
  return redisClient;
}

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(compression());

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ success: true, service: 'auth-service' }));
app.use('/', authRoutes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, message: 'Not found' }));

// ── Error Handler ─────────────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('Auth service error:', err);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
});

async function start() {
  // Connect MongoDB
  await mongoose.connect(env.mongoUri);
  console.log('Auth service: MongoDB connected');

  // Connect Redis (optional)
  try {
    redisClient = new Redis(env.redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1 });
    await redisClient.connect();
    console.log('Auth service: Redis connected');
  } catch (err) {
    console.warn('Auth service: Redis unavailable –', err.message);
    redisClient = null;
  }

  app.listen(env.port, () => {
    console.log(`Auth service running on port ${env.port}`);
  });
}

start();

export default app;
