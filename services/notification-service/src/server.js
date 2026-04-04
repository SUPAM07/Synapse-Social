import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './config.js';
import { startKafkaConsumer } from './consumer.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ success: true, service: 'notification-service' }));

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('Notification service error:', err);
  res.status(500).json({ success: false, message: err.message || 'Internal server error' });
});

async function start() {
  await startKafkaConsumer();
  app.listen(env.port, () => console.log(`Notification service running on port ${env.port}`));
}

start();

export default app;
