const Redis = require('ioredis');
const { REDIS_URL, isRedisConfigured } = require('./env');

/** @type {import('ioredis').Redis | null} */
let client = null;

/**
 * Lazy singleton ioredis client. Returns null when REDIS_URL is unset.
 * Feature 076 — Upstash (rediss://) free-tier friendly.
 */
function getRedis() {
  if (!isRedisConfigured) return null;
  if (client) return client;

  client = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 2,
    enableReadyCheck: true,
    lazyConnect: false,
  });

  client.on('error', (error) => {
    console.error('[redis]', error.message || error);
  });

  return client;
}

function assertRedis() {
  const redis = getRedis();
  if (!redis) {
    const error = new Error(
      'Redis no está configurado. Define REDIS_URL en backend/.env.',
    );
    error.code = 503;
    throw error;
  }
  return redis;
}

module.exports = {
  getRedis,
  assertRedis,
};
