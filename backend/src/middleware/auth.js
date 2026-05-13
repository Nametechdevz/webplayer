'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config');
const { getDatabaseClient } = require('../config/database');

/**
 * Verify JWT access token and attach decoded user to req.user
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    const token = authHeader.slice(7);

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token expired',
          code: 'TOKEN_EXPIRED',
        });
      }
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        code: 'TOKEN_INVALID',
      });
    }

    const prisma = getDatabaseClient();
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true,
        expires_at: true,
        max_connections: true,
        is_trial: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    if (user.status === 'BANNED' || user.status === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        error: 'Account suspended',
        code: 'ACCOUNT_SUSPENDED',
      });
    }

    if (user.expires_at && new Date(user.expires_at) < new Date()) {
      return res.status(403).json({
        success: false,
        error: 'Account expired',
        code: 'ACCOUNT_EXPIRED',
      });
    }

    req.user = user;
    req.tokenPayload = decoded;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Require one or more roles
 * Usage: requireRole('ADMIN') or requireRole(['ADMIN', 'SUPER_ADMIN'])
 */
function requireRole(...roles) {
  const allowed = roles.flat();
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    }

    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        code: 'FORBIDDEN',
        required: allowed,
        current: req.user.role,
      });
    }

    next();
  };
}

/**
 * Optional auth – attaches user if token present, continues without error if not
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  try {
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, config.jwt.secret);
    const prisma = getDatabaseClient();
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        status: true,
      },
    });
    if (user && user.status === 'ACTIVE') {
      req.user = user;
    }
  } catch {
    // Ignore errors for optional auth
  }
  next();
}

module.exports = { authenticate, requireRole, optionalAuth };
