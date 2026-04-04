import morgan from 'morgan';
import { config } from '../config/env.js';

export const loggerMiddleware = morgan(config.NODE_ENV === 'production' ? 'combined' : 'dev');
