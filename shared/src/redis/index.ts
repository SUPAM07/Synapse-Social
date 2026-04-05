import { Redis } from 'ioredis';
import { sharedConfig } from '../config/index.js';
import { createServiceLogger } from '../utils/logger.js';

const logger = createServiceLogger('redis');

export type RedisTTL = number; // seconds

let redisClient: Redis | null = null;

export function createRedisClient(url: string = sharedConfig.redisUrl): Redis {
  const client = new Redis(url, {
    lazyConnect: true,
    retryStrategy: (times: number) => Math.min(times * 100, 3000),
    maxRetriesPerRequest: 3,
  });

  client.on('connect', () => logger.info('Redis connected'));
  client.on('error', (err: Error) => logger.error('Redis error', err));

  return client;
}

export async function connectRedis(url: string = sharedConfig.redisUrl): Promise<Redis> {
  redisClient = createRedisClient(url);
  await redisClient.connect();
  return redisClient;
}

export function getRedisClient(): Redis | null {
  return redisClient;
}

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

// Cache helpers

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redisClient) return null;
  const val = await redisClient.get(key);
  return val ? (JSON.parse(val) as T) : null;
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: RedisTTL = 3600
): Promise<void> {
  if (!redisClient) return;
  await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
}

export async function cacheDel(key: string): Promise<void> {
  if (!redisClient) return;
  await redisClient.del(key);
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  if (!redisClient) return;
  const keys = await redisClient.keys(pattern);
  if (keys.length > 0) await redisClient.del(...keys);
}
