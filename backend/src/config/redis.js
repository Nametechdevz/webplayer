'use strict';

const Redis = require('ioredis');

let redisClient;

function getRedisClient() {
  if (!redisClient) {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';

    redisClient = new Redis(url, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 10) {
          console.error('[Redis] Max retries reached, giving up');
          return null;
        }
        const delay = Math.min(times * 100, 3000);
        console.warn(`[Redis] Retrying connection in ${delay}ms (attempt ${times})`);
        return delay;
      },
      reconnectOnError(err) {
        const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
        return targetErrors.some((e) => err.message.includes(e));
      },
      enableOfflineQueue: true,
      lazyConnect: false,
    });

    redisClient.on('connect', () => {
      console.log('[Redis] Connected successfully');
    });

    redisClient.on('ready', () => {
      console.log('[Redis] Client ready');
    });

    redisClient.on('error', (err) => {
      console.error('[Redis] Error:', err.message);
    });

    redisClient.on('close', () => {
      console.warn('[Redis] Connection closed');
    });

    redisClient.on('reconnecting', () => {
      console.log('[Redis] Reconnecting...');
    });

    process.on('beforeExit', async () => {
      if (redisClient) {
        await redisClient.quit();
      }
    });
  }

  return redisClient;
}

async function connectRedis() {
  const client = getRedisClient();
  try {
    await client.ping();
    console.log('[Redis] Ping successful');
    return client;
  } catch (err) {
    console.error('[Redis] Ping failed:', err.message);
    // Non-fatal – app can run without Redis cache
    return null;
  }
}

module.exports = { getRedisClient, connectRedis };
