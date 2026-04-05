import Redis from 'ioredis';
import { sharedConfig } from '../config/index.js';
import { createServiceLogger } from '../utils/logger.js';

const logger = createServiceLogger('redis');

let redisClient = null;

export function createRedisClient(url = sharedConfig.redisUrl) {
  const client = new Redis(url, {
    lazyConnect: true,
    retryStrategy: (times) => Math.min(times * 100, 3000),
    maxRetriesPerRequest: 3,
  });

  client.on('connect', () => logger.info('Redis connected'));
  client.on('error', (err) => logger.error('Redis error', err));

  return client;
}

export async function connectRedis(url = sharedConfig.redisUrl) {
  redisClient = createRedisClient(url);
  await redisClient.connect();
  return redisClient;
}

export function getRedisClient() {
  return redisClient;
}

export async function disconnectRedis() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

// Cache helpers

export async function cacheGet(key) {
  if (!redisClient) return null;
  const val = await redisClient.get(key);
  return val ? JSON.parse(val) : null;
}

export async function cacheSet(key, value, ttlSeconds = 3600) {
  if (!redisClient) return;
  await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
}

export async function cacheDel(key) {
  if (!redisClient) return;
  await redisClient.del(key);
}

export async function cacheDelPattern(pattern) {
  if (!redisClient) return;
  const keys = await redisClient.keys(pattern);
  if (keys.length > 0) await redisClient.del(...keys);
}
