import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';

import { env } from './config.js';
import logger from './middleware/logger.js';
import { optionalAuth } from './middleware/auth.js';
import { defaultLimiter, authLimiter } from './middleware/rateLimiter.js';
import {
  authProxy,
  eventProxy,
  bookingProxy,
  reviewProxy,
  checkinProxy,
  notificationProxy,
  analyticsProxy,
} from './routes/proxy.js';

const app = express();

// ── Security & Utility Middleware ─────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(compression());
app.use(express.json({ limit: '2mb' }));

// ── Rate Limiting ─────────────────────────────────────────────────────────────
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api', defaultLimiter);

// ── Optional JWT parsing (forwards user identity to downstream services) ──────
app.use(optionalAuth);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API Gateway is running',
    timestamp: new Date().toISOString(),
    services: {
      auth: env.authServiceUrl,
      events: env.eventServiceUrl,
      bookings: env.bookingServiceUrl,
      reviews: env.reviewServiceUrl,
      checkin: env.checkinServiceUrl,
      notifications: env.notificationServiceUrl,
      analytics: env.analyticsServiceUrl,
    },
  });
});

// ── Service Routing ───────────────────────────────────────────────────────────
app.use('/api/auth', authProxy);
app.use('/api/events', eventProxy);
app.use('/api/bookings', bookingProxy);
app.use('/api/reviews', reviewProxy);
app.use('/api/checkin', checkinProxy);
app.use('/api/notifications', notificationProxy);
app.use('/api/analytics', analyticsProxy);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  logger.error('Unhandled error:', err);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
});

app.listen(env.port, () => {
  logger.info(`API Gateway running on port ${env.port}`);
});

export default app;
