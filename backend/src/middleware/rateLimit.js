'use strict';

const rateLimit = require('express-rate-limit');
const config = require('../config');

/**
 * Standard API rate limiter: 100 req / 15 min per IP
 */
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
    code: 'RATE_LIMITED',
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  },
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip;
  },
});

/**
 * Strict limiter for auth endpoints: 200 req / 15 min per IP
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.',
    code: 'AUTH_RATE_LIMITED',
  },
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip;
  },
});

/**
 * Stream proxy limiter: 500 req / 15 min per IP (streams have frequent segment requests)
 */
const streamLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Stream rate limit exceeded.',
    code: 'STREAM_RATE_LIMITED',
  },
  keyGenerator: (req) => {
    return req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip;
  },
});

/**
 * Admin limiter: 200 req / 15 min per IP
 */
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many admin requests, please slow down.',
    code: 'ADMIN_RATE_LIMITED',
  },
});

module.exports = { apiLimiter, authLimiter, streamLimiter, adminLimiter };
