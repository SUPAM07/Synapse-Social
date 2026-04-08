import 'dotenv/config';
import app from './app';
import { config } from './config';
import { createLogger } from '@uevent/utils';

const logger = createLogger('api-gateway');

app.listen(config.port, () => {
  logger.info(`API Gateway running on port ${config.port}`);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason });
  process.exit(1);
});
