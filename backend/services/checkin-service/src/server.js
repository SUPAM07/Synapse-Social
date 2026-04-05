import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';

import { env } from './config.js';
import checkinRoutes from './routes/checkin.js';
import { initKafkaProducer } from './kafka.js';

const app = express();
const server = http.createServer(app);

let redisClient = null;
let io = null;

export function getRedis() { return redisClient; }
export function getIo() { return io; }

app.use(helmet());
app.use(cors({ origin: env.clientUrl, credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(compression());

app.get('/health', (_req, res) => res.json({ success: true, service: 'checkin-service' }));
app.use('/', checkinRoutes);

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('Check-in service error:', err);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
});

async function start() {
  // Connect Redis
  try {
    redisClient = new Redis(env.redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1 });
    await redisClient.connect();
    console.log('Check-in service: Redis connected');

    // Socket.IO with Redis adapter for horizontal scaling
    const pubClient = redisClient;
    const subClient = redisClient.duplicate();
    io = new Server(server, {
      cors: { origin: env.clientUrl, credentials: true },
      adapter: createAdapter(pubClient, subClient),
    });
  } catch (err) {
    console.warn('Check-in service: Redis unavailable –', err.message);
    io = new Server(server, { cors: { origin: env.clientUrl, credentials: true } });
  }

  io.on('connection', (socket) => {
    socket.on('join-event', (eventId) => {
      socket.join(`event:${eventId}`);
      console.log(`Socket ${socket.id} joined event:${eventId}`);
    });
    socket.on('leave-event', (eventId) => {
      socket.leave(`event:${eventId}`);
    });
  });

  await initKafkaProducer();

  server.listen(env.port, () => {
    console.log(`Check-in service running on port ${env.port}`);
  });
}

start();

export default app;
