/**
 * Redis Configuration
 * 
 * Configures Redis client using ioredis with connection pooling
 * and automatic reconnection.
 */

import type { FastifyInstance } from 'fastify';
import { Redis } from 'ioredis';
import fp from 'fastify-plugin';

async function redisConnector(fastify: FastifyInstance): Promise<void> {
  const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
  const REDIS_KEY_PREFIX = process.env.REDIS_KEY_PREFIX || 'manager:';
  
  const redis = new Redis(REDIS_URL, {
    keyPrefix: REDIS_KEY_PREFIX,
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    enableOfflineQueue: true,
  });
  
  redis.on('error', (error) => {
    fastify.log.error({ error }, 'Redis connection error');
  });
  
  redis.on('connect', () => {
    fastify.log.info('✅ Redis connected');
  });
  
  redis.on('reconnecting', () => {
    fastify.log.warn('Redis reconnecting...');
  });
  
  // Decorate fastify with redis client
  fastify.decorate('redis', redis);
  
  // Close Redis on server shutdown
  fastify.addHook('onClose', async () => {
    await redis.quit();
    fastify.log.info('Redis connection closed');
  });
}

export const configureRedis = fp(redisConnector, {
  name: 'redis',
});

// Augment FastifyInstance type
declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
  }
}
