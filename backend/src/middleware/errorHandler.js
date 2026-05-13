'use strict';

const { ZodError } = require('zod');

/**
 * 404 handler – call after all routes
 */
function notFound(req, res) {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    code: 'NOT_FOUND',
    path: req.originalUrl,
  });
}

/**
 * Global error handler – must be registered last with 4 params
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const isDev = process.env.NODE_ENV === 'development';

  // Log error details
  console.error('[Error]', {
    message: err.message,
    code: err.code,
    path: req.originalUrl,
    method: req.method,
    ...(isDev && { stack: err.stack }),
  });

  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
  }

  // Prisma errors
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'field';
    return res.status(409).json({
      success: false,
      error: `${field} already exists`,
      code: 'DUPLICATE_ENTRY',
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: 'Record not found',
      code: 'NOT_FOUND',
    });
  }

  if (err.code === 'P2003') {
    return res.status(400).json({
      success: false,
      error: 'Related record not found',
      code: 'FOREIGN_KEY_ERROR',
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      code: 'TOKEN_INVALID',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired',
      code: 'TOKEN_EXPIRED',
    });
  }

  // CORS errors
  if (err.message && err.message.startsWith('CORS:')) {
    return res.status(403).json({
      success: false,
      error: err.message,
      code: 'CORS_ERROR',
    });
  }

  // Axios/upstream errors
  if (err.isAxiosError) {
    return res.status(502).json({
      success: false,
      error: 'Upstream provider error',
      code: 'UPSTREAM_ERROR',
      ...(isDev && { details: err.message }),
    });
  }

  // Default 500
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    success: false,
    error: isDev ? err.message : 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
    ...(isDev && { stack: err.stack }),
  });
}

module.exports = { notFound, errorHandler };
