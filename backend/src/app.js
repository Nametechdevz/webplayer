'use strict';

require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');

const config = require('./config');
const { connectDatabase } = require('./config/database');
const { connectRedis } = require('./config/redis');
const corsMiddleware = require('./middleware/cors');
const { apiLimiter } = require('./middleware/rateLimit');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const dnsHealthService = require('./services/dnsHealthService');

// ─── Route Imports ─────────────────────────────────────────────────────────
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const profilesRoutes = require('./routes/profiles');
const dnsRoutes = require('./routes/dns');
const streamsRoutes = require('./routes/streams');
const categoriesRoutes = require('./routes/categories');
const epgRoutes = require('./routes/epg');
const favoritesRoutes = require('./routes/favorites');
const watchHistoryRoutes = require('./routes/watchHistory');
const searchRoutes = require('./routes/search');
const adminRoutes = require('./routes/admin');
const proxyRoutes = require('./routes/proxy');

// ─── App Initialization ────────────────────────────────────────────────────
const app = express();

// ─── Security Middleware ───────────────────────────────────────────────────
app.use(
  helmet({
    // Allow streaming content through the proxy
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
  })
);

// ─── CORS ──────────────────────────────────────────────────────────────────
app.use(corsMiddleware);
app.options('*', corsMiddleware); // Pre-flight for all routes

// ─── Request Logging ───────────────────────────────────────────────────────
if (config.env !== 'test') {
  app.use(
    morgan(config.env === 'development' ? 'dev' : 'combined', {
      // Skip health check logs
      skip: (req) => req.path === '/health' || req.path === '/api/health',
    })
  );
}

// ─── Body Parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─── Trust Proxy (for rate limiting behind load balancer / nginx) ───────────
app.set('trust proxy', 1);

// ─── Health Check ──────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    env: config.env,
    version: process.env.npm_package_version || '1.0.0',
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

// ─── Global Rate Limiter ───────────────────────────────────────────────────
app.use('/api/', apiLimiter);

// ─── API Routes ────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/profiles', profilesRoutes);
app.use('/api/dns', dnsRoutes);
app.use('/api/streams', streamsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/epg', epgRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/watch-history', watchHistoryRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/proxy', proxyRoutes);

// ─── 404 & Error Handlers ──────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Server Startup ────────────────────────────────────────────────────────
async function start() {
  try {
    // Connect to PostgreSQL
    await connectDatabase();

    // Connect to Redis (non-fatal if unavailable)
    await connectRedis().catch((err) => {
      console.warn('[App] Redis connection failed, continuing without cache:', err.message);
    });

    // Start DNS health monitoring
    dnsHealthService.start();

    // Register DNS health event listeners
    dnsHealthService.on('provider:offline', ({ provider }) => {
      console.warn(`[App] DNS Provider "${provider.nickname || provider.name}" went OFFLINE`);
    });

    dnsHealthService.on('provider:online', ({ provider }) => {
      console.log(`[App] DNS Provider "${provider.nickname || provider.name}" is back ONLINE`);
    });

    dnsHealthService.on('provider:nofallback', ({ offlineId }) => {
      console.error(`[App] CRITICAL: No available DNS providers! (offline: ${offlineId})`);
    });

    // Start listening
    const server = app.listen(config.port, () => {
      console.log(`[App] IPTV backend running on port ${config.port} [${config.env}]`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\n[App] ${signal} received, shutting down gracefully...`);
      dnsHealthService.stop();
      server.close(async () => {
        const { disconnectDatabase } = require('./config/database');
        await disconnectDatabase();
        console.log('[App] Server closed');
        process.exit(0);
      });

      // Force exit after 15 seconds
      setTimeout(() => {
        console.error('[App] Forced exit after timeout');
        process.exit(1);
      }, 15000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Unhandled rejection/exception logging
    process.on('unhandledRejection', (reason, promise) => {
      console.error('[App] Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (err) => {
      console.error('[App] Uncaught Exception:', err);
      process.exit(1);
    });

    return server;
  } catch (err) {
    console.error('[App] Failed to start:', err);
    process.exit(1);
  }
}

// Only start if this file is run directly (not required as a module)
if (require.main === module) {
  start();
}

module.exports = { app, start };
