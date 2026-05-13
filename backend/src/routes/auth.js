'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { z } = require('zod');
const { prisma } = require('../models');
const config = require('../config');
const cache = require('../services/cacheService');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

const router = express.Router();

// ─── Validation Schemas ────────────────────────────────────────────────────

const loginSchema = z.object({
  username: z.string().min(1, 'Username required'),
  password: z.string().min(1, 'Password required'),
  deviceId: z.string().optional(),
  deviceName: z.string().optional(),
});

const loginCodeSchema = z.object({
  code: z.string().min(4, 'Code required'),
  deviceId: z.string().optional(),
  deviceName: z.string().optional(),
});

const registerSchema = z.object({
  username: z.string().min(3).max(50).regex(/^[a-zA-Z0-9_.-]+$/, 'Invalid username'),
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().max(100).optional(),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token required'),
});

// ─── Helpers ───────────────────────────────────────────────────────────────

function generateAccessToken(user) {
  return jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

function generateRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}

async function createSession(userId, refreshToken, req) {
  const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const session = await prisma.session.create({
    data: {
      user_id: userId,
      device_id: req.headers['x-device-id'] || null,
      device_name: req.headers['x-device-name'] || null,
      ip_address: req.headers['x-forwarded-for']?.split(',')[0].trim() || req.ip,
      user_agent: req.headers['user-agent'] || null,
      token: hashedToken,
      expires_at: expiresAt,
    },
  });

  return session;
}

// ─── Routes ────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/login
 * Username + password authentication
 */
router.post('/login', authLimiter, async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: body.username },
          { email: body.username }, // allow login with email too
        ],
      },
      include: {
        subscription: true,
        profiles: { where: { is_default: true }, take: 1 },
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
      });
    }

    const passwordMatch = await bcrypt.compare(body.password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
      });
    }

    if (user.status === 'BANNED') {
      return res.status(403).json({ success: false, error: 'Account banned', code: 'BANNED' });
    }

    if (user.status === 'SUSPENDED') {
      return res.status(403).json({ success: false, error: 'Account suspended', code: 'SUSPENDED' });
    }

    if (user.expires_at && new Date(user.expires_at) < new Date()) {
      return res.status(403).json({ success: false, error: 'Account expired', code: 'ACCOUNT_EXPIRED' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();
    const session = await createSession(user.id, refreshToken, req);

    // Cache session data
    await cache.setSession(session.id, { userId: user.id, role: user.role }, config.cache.sessionTtl);

    const { password_hash, ...safeUser } = user;

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        expiresIn: 3600,
        tokenType: 'Bearer',
        user: safeUser,
        defaultProfile: user.profiles[0] || null,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/login/code
 * Activation code login
 */
router.post('/login/code', authLimiter, async (req, res, next) => {
  try {
    const body = loginCodeSchema.parse(req.body);

    const accessCode = await prisma.accessCode.findUnique({
      where: { code: body.code },
      include: { user: true },
    });

    if (!accessCode) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired code',
        code: 'INVALID_CODE',
      });
    }

    if (!accessCode.is_active) {
      return res.status(401).json({ success: false, error: 'Code is no longer active', code: 'CODE_INACTIVE' });
    }

    if (new Date(accessCode.expires_at) < new Date()) {
      return res.status(401).json({ success: false, error: 'Code has expired', code: 'CODE_EXPIRED' });
    }

    if (accessCode.uses_count >= accessCode.max_uses) {
      return res.status(401).json({ success: false, error: 'Code usage limit reached', code: 'CODE_EXHAUSTED' });
    }

    // Increment usage
    await prisma.accessCode.update({
      where: { id: accessCode.id },
      data: {
        uses_count: { increment: 1 },
        is_active: accessCode.uses_count + 1 < accessCode.max_uses,
      },
    });

    let user = accessCode.user;

    // If no user linked, create a guest user
    if (!user) {
      user = await prisma.user.create({
        data: {
          username: `guest_${body.code.toLowerCase()}`,
          password_hash: await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 10),
          role: 'GUEST',
          status: 'ACTIVE',
          expires_at: accessCode.expires_at,
        },
      });

      // Link code to new user
      await prisma.accessCode.update({
        where: { id: accessCode.id },
        data: { user_id: user.id },
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();
    const session = await createSession(user.id, refreshToken, req);

    await cache.setSession(session.id, { userId: user.id, role: user.role }, config.cache.sessionTtl);

    const { password_hash, ...safeUser } = user;

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        expiresIn: 3600,
        tokenType: 'Bearer',
        user: safeUser,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using a refresh token
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const body = refreshSchema.parse(req.body);

    const hashedToken = crypto.createHash('sha256').update(body.refreshToken).digest('hex');

    const session = await prisma.session.findUnique({
      where: { token: hashedToken },
      include: { user: true },
    });

    if (!session || session.is_revoked) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
        code: 'INVALID_REFRESH_TOKEN',
      });
    }

    if (new Date(session.expires_at) < new Date()) {
      await prisma.session.update({ where: { id: session.id }, data: { is_revoked: true } });
      return res.status(401).json({
        success: false,
        error: 'Refresh token expired',
        code: 'REFRESH_TOKEN_EXPIRED',
      });
    }

    const user = session.user;

    if (user.status === 'BANNED' || user.status === 'SUSPENDED') {
      return res.status(403).json({ success: false, error: 'Account suspended', code: 'ACCOUNT_SUSPENDED' });
    }

    // Rotate refresh token
    const newRefreshToken = generateRefreshToken();
    const newHashedToken = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
    const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.session.update({
      where: { id: session.id },
      data: {
        token: newHashedToken,
        expires_at: newExpiry,
        last_used: new Date(),
      },
    });

    const accessToken = generateAccessToken(user);

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: 3600,
        tokenType: 'Bearer',
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/logout
 * Revoke the current session
 */
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.slice(7);

    // Revoke all sessions for this user from this device, or just the current token
    const deviceId = req.headers['x-device-id'];
    const where = { user_id: req.user.id, is_revoked: false };
    if (deviceId) where.device_id = deviceId;

    await prisma.session.updateMany({ where, data: { is_revoked: true } });

    // Clear session cache
    await cache.delPattern(`session:*`);

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        display_name: true,
        avatar_url: true,
        role: true,
        status: true,
        max_connections: true,
        is_trial: true,
        trial_expires_at: true,
        expires_at: true,
        created_at: true,
        subscription: {
          select: {
            plan: true,
            status: true,
            expires_at: true,
            max_streams: true,
          },
        },
        profiles: {
          select: {
            id: true,
            name: true,
            avatar: true,
            is_default: true,
            is_adult_locked: true,
            language: true,
          },
          orderBy: { is_default: 'desc' },
        },
        _count: {
          select: { sessions: true },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found', code: 'USER_NOT_FOUND' });
    }

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/register
 * Create a new account
 */
router.post('/register', authLimiter, async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);

    // Check if registration is open (can be gated by env var)
    if (process.env.REGISTRATION_DISABLED === 'true') {
      return res.status(403).json({
        success: false,
        error: 'Registration is currently disabled',
        code: 'REGISTRATION_DISABLED',
      });
    }

    const passwordHash = await bcrypt.hash(body.password, 12);

    const user = await prisma.user.create({
      data: {
        username: body.username,
        email: body.email || null,
        password_hash: passwordHash,
        display_name: body.displayName || body.username,
        role: 'USER',
        status: 'ACTIVE',
        profiles: {
          create: {
            name: body.displayName || body.username,
            is_default: true,
          },
        },
        subscription: {
          create: {
            plan: 'FREE',
            status: 'ACTIVE',
            max_streams: 1,
          },
        },
      },
      select: {
        id: true,
        email: true,
        username: true,
        display_name: true,
        role: true,
        status: true,
        created_at: true,
      },
    });

    res.status(201).json({ success: true, data: user, message: 'Account created successfully' });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/sessions
 * List active sessions for the current user
 */
router.get('/sessions', authenticate, async (req, res, next) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { user_id: req.user.id, is_revoked: false, expires_at: { gte: new Date() } },
      select: {
        id: true,
        device_id: true,
        device_name: true,
        ip_address: true,
        user_agent: true,
        created_at: true,
        last_used: true,
        expires_at: true,
      },
      orderBy: { last_used: 'desc' },
    });

    res.json({ success: true, data: sessions });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/auth/sessions/:id
 * Revoke a specific session
 */
router.delete('/sessions/:id', authenticate, async (req, res, next) => {
  try {
    const session = await prisma.session.findFirst({
      where: { id: req.params.id, user_id: req.user.id },
    });

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found', code: 'NOT_FOUND' });
    }

    await prisma.session.update({
      where: { id: session.id },
      data: { is_revoked: true },
    });

    res.json({ success: true, message: 'Session revoked' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
