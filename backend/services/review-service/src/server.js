import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import mongoose from 'mongoose';

import { env } from './config.js';
import reviewRoutes from './routes/reviews.js';
import { initKafkaProducer } from './kafka.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(compression());

app.get('/health', (_req, res) => res.json({ success: true, service: 'review-service' }));
app.use('/', reviewRoutes);

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('Review service error:', err);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
});

async function start() {
  await mongoose.connect(env.mongoUri);
  console.log('Review service: MongoDB connected');
  await initKafkaProducer();
  app.listen(env.port, () => console.log(`Review service running on port ${env.port}`));
}

start();

export default app;
