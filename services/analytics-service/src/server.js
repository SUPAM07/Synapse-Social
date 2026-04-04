import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';

import { env } from './config.js';
import analyticsRoutes from './routes/analytics.js';
import { startKafkaConsumer } from './consumer.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(morgan('dev'));
app.use(express.json());
app.use(compression());

app.get('/health', (_req, res) => res.json({ success: true, service: 'analytics-service' }));
app.use('/', analyticsRoutes);

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('Analytics service error:', err);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

async function start() {
  await startKafkaConsumer();
  app.listen(env.port, () => console.log(`Analytics service running on port ${env.port}`));
}

start();

export default app;
