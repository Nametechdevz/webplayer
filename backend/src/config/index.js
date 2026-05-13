'use strict';

require('dotenv').config();

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3001,

  database: {
    url: process.env.DATABASE_URL,
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'change-this-secret-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'change-this-refresh-secret-in-production',
    expiresIn: '1h',
    refreshExpiresIn: '30d',
  },

  stream: {
    tokenSecret: process.env.STREAM_TOKEN_SECRET || 'change-this-stream-token-secret',
    tokenTtl: parseInt(process.env.STREAM_TOKEN_TTL, 10) || 14400, // 4 hours in seconds
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 min
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  },

  cors: {
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  },

  tmdb: {
    apiKey: process.env.TMDB_API_KEY || '',
    baseUrl: 'https://api.themoviedb.org/3',
  },

  dns: {
    healthCron: process.env.DNS_HEALTH_CRON || '*/2 * * * *',
  },

  cache: {
    streamListTtl: 5 * 60,      // 5 minutes
    epgTtl: 30 * 60,            // 30 minutes
    dnsStatusTtl: 2 * 60,       // 2 minutes
    sessionTtl: 60 * 60,        // 1 hour
    categoriesTtl: 10 * 60,     // 10 minutes
  },
};

// Validate required config
function validateConfig() {
  const required = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0 && config.env === 'production') {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (missing.length > 0) {
    console.warn(`[Config] Missing env vars (using defaults): ${missing.join(', ')}`);
  }
}

validateConfig();

module.exports = config;
