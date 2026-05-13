'use strict';

const cors = require('cors');
const config = require('../config');

// Build allowed origins list
const allowedOrigins = [
  config.cors.frontendUrl,
  'http://localhost:3000',
  'http://localhost:5173', // Vite dev server
  'http://localhost:4173', // Vite preview
];

// Add production origins if configured
if (process.env.ADDITIONAL_ORIGINS) {
  const extra = process.env.ADDITIONAL_ORIGINS.split(',').map((o) => o.trim());
  allowedOrigins.push(...extra);
}

const corsOptions = {
  origin(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // In development, be permissive
    if (config.env === 'development') {
      return callback(null, true);
    }

    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Device-Id',
    'X-Device-Name',
    'Range',
  ],
  exposedHeaders: [
    'Content-Range',
    'Accept-Ranges',
    'Content-Length',
    'X-Stream-Token',
  ],
  credentials: true,
  maxAge: 86400, // 24h preflight cache
};

module.exports = cors(corsOptions);
