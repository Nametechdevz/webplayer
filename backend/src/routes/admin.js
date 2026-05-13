'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const { prisma } = require('../models');
const { authenticate, requireRole } = require('../middleware/auth');
const { adminLimiter } = require('../middleware/rateLimit');
const cache = require('../services/cacheService');
const dnsHealthService = require('../services/dnsHealthService');
const epgService = require('../services/epgService');
const xtreamService = require('../services/xtreamService');

const router = express.Router();
router.use(authenticate);
router.use(requireRole('SUPER_ADMIN', 'ADMIN'));
router.use(adminLimiter);

// ─── Dashboard Stats ────────────────────────────────────────────────────────

/**
 * GET /api/admin/stats
 * Dashboard overview statistics
 */
router.get('/stats', async (req, res, next) => {
  try {
    const cacheKey = 'admin:stats';
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(cached);

    const [
      totalUsers,
      activeUsers,
      totalStreams,
      liveStreams,
      movieStreams,
      seriesStreams,
      totalCategories,
      totalDnsProviders,
      onlineDns,
      activeSessions,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.stream.count({ where: { is_active: true } }),
      prisma.stream.count({ where: { is_active: true, type: 'LIVE' } }),
      prisma.stream.count({ where: { is_active: true, type: 'MOVIE' } }),
      prisma.stream.count({ where: { is_active: true, type: 'SERIES' } }),
      prisma.category.count(),
      prisma.dnsProvider.count(),
      prisma.dnsProvider.count({ where: { status: 'ONLINE', is_active: true } }),
      prisma.session.count({ where: { is_revoked: false, expires_at: { gte: new Date() } } }),
    ]);

    const response = {
      success: true,
      data: {
        users: { total: totalUsers, active: activeUsers },
        streams: { total: totalStreams, live: liveStreams, movies: movieStreams, series: seriesStreams },
        categories: totalCategories,
        dns: { total: totalDnsProviders, online: onlineDns },
        sessions: { active: activeSessions },
        generatedAt: new Date().toISOString(),
      },
    };

    await cache.set(cacheKey, response, 60); // 1-minute cache
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// ─── Access Codes ───────────────────────────────────────────────────────────

const createCodeSchema = z.object({
  code: z.string().min(4).max(50).optional(),
  label: z.string().max(100).optional(),
  userId: z.string().uuid().optional(),
  expiresAt: z.string().datetime(),
  maxUses: z.number().int().min(1).default(1),
});

/**
 * GET /api/admin/codes
 * List access codes
 */
router.get('/codes', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const where = {};
    if (req.query.active !== undefined) where.is_active = req.query.active === 'true';

    const [codes, total] = await Promise.all([
      prisma.accessCode.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          user: { select: { id: true, username: true, status: true } },
        },
      }),
      prisma.accessCode.count({ where }),
    ]);

    res.json({
      success: true,
      data: codes,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/admin/codes
 * Create an access code
 */
router.post('/codes', async (req, res, next) => {
  try {
    const body = createCodeSchema.parse(req.body);

    // Auto-generate code if not provided
    const code = body.code || generateCode();

    const accessCode = await prisma.accessCode.create({
      data: {
        code,
        label: body.label || null,
        user_id: body.userId || null,
        expires_at: new Date(body.expiresAt),
        max_uses: body.maxUses,
        is_active: true,
        created_by: req.user.id,
      },
    });

    res.status(201).json({ success: true, data: accessCode });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/admin/codes/:id
 * Deactivate an access code
 */
router.delete('/codes/:id', async (req, res, next) => {
  try {
    const code = await prisma.accessCode.findUnique({ where: { id: req.params.id } });
    if (!code) {
      return res.status(404).json({ success: false, error: 'Code not found', code: 'NOT_FOUND' });
    }

    await prisma.accessCode.update({
      where: { id: req.params.id },
      data: { is_active: false },
    });

    res.json({ success: true, message: 'Access code deactivated' });
  } catch (err) {
    next(err);
  }
});

// ─── Cache Management ───────────────────────────────────────────────────────

/**
 * DELETE /api/admin/cache
 * Flush specific cache namespaces
 */
router.delete('/cache', async (req, res, next) => {
  try {
    const { namespace } = req.query;

    const patterns = {
      streams: 'streams:*',
      categories: 'categories:*',
      epg: 'epg:*',
      dns: 'dns_status:*',
      search: 'search:*',
      xtream: 'xtream:*',
      admin: 'admin:*',
      all: '*',
    };

    const pattern = patterns[namespace] || patterns.all;
    const deleted = await cache.delPattern(pattern);

    res.json({ success: true, data: { deleted, namespace: namespace || 'all' } });
  } catch (err) {
    next(err);
  }
});

// ─── DNS Health ─────────────────────────────────────────────────────────────

/**
 * POST /api/admin/dns/health-check
 * Trigger an immediate health check on all DNS providers
 */
router.post('/dns/health-check', async (req, res, next) => {
  try {
    // Run async, don't await
    dnsHealthService.runChecks().catch(console.error);
    res.json({ success: true, message: 'Health check triggered' });
  } catch (err) {
    next(err);
  }
});

// ─── EPG Maintenance ─────────────────────────────────────────────────────────

/**
 * DELETE /api/admin/epg/cleanup
 * Clean up old EPG entries
 */
router.delete('/epg/cleanup', async (req, res, next) => {
  try {
    const daysOld = Math.max(1, parseInt(req.query.days) || 7);
    const count = await epgService.cleanup(daysOld);
    res.json({ success: true, data: { deleted: count } });
  } catch (err) {
    next(err);
  }
});

// ─── Session Management ─────────────────────────────────────────────────────

/**
 * GET /api/admin/sessions
 * View all active sessions
 */
router.get('/sessions', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where: { is_revoked: false, expires_at: { gte: new Date() } },
        skip,
        take: limit,
        orderBy: { last_used: 'desc' },
        include: {
          user: { select: { id: true, username: true, role: true } },
        },
      }),
      prisma.session.count({
        where: { is_revoked: false, expires_at: { gte: new Date() } },
      }),
    ]);

    res.json({
      success: true,
      data: sessions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/admin/sessions/:userId
 * Revoke all sessions for a user
 */
router.delete('/sessions/:userId', async (req, res, next) => {
  try {
    await prisma.session.updateMany({
      where: { user_id: req.params.userId, is_revoked: false },
      data: { is_revoked: true },
    });

    res.json({ success: true, message: 'All sessions revoked for user' });
  } catch (err) {
    next(err);
  }
});

// ─── Subscriptions ──────────────────────────────────────────────────────────

/**
 * GET /api/admin/subscriptions
 * List subscriptions
 */
router.get('/subscriptions', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const where = {};
    if (req.query.status) where.status = req.query.status;

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          user: { select: { id: true, username: true, email: true } },
        },
      }),
      prisma.subscription.count({ where }),
    ]);

    res.json({
      success: true,
      data: subscriptions,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateCode(length = 12) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

module.exports = router;
