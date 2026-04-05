import rateLimit from 'express-rate-limit';
import Redis from 'ioredis';
import { RedisStore } from 'rate-limit-redis';
import { env } from '../config.js';

let redisClient = null;

function getRedisClient() {
  if (!redisClient && env.redisUrl) {
    try {
      redisClient = new Redis(env.redisUrl, { lazyConnect: false, maxRetriesPerRequest: 1 });
    } catch {
      // Redis unavailable – fall back to memory store
    }
  }
  return redisClient;
}

export function createRateLimiter(options = {}) {
  const {
    windowMs = 60 * 1000,
    max = 120,
    message = 'Too many requests, please try again later.',
  } = options;

  const limiterOptions = {
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message },
  };

  const redis = getRedisClient();
  if (redis) {
    limiterOptions.store = new RedisStore({
      sendCommand: (...args) => redis.call(...args),
    });
  }

  return rateLimit(limiterOptions);
}

export const defaultLimiter = createRateLimiter({ windowMs: 60 * 1000, max: 120 });
export const authLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 30, message: 'Too many auth attempts, please try again later.' });
