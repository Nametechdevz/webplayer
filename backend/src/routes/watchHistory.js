'use strict';

const express = require('express');
const { z } = require('zod');
const { prisma } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// ─── Validation ────────────────────────────────────────────────────────────

const upsertHistorySchema = z.object({
  streamId: z.string().uuid(),
  profileId: z.string().uuid().optional(),
  progress: z.number().min(0).default(0),
  duration: z.number().min(0).optional(),
  isFinished: z.boolean().default(false),
});

// ─── Helper ────────────────────────────────────────────────────────────────

async function resolveProfile(userId, profileId) {
  if (profileId) {
    return prisma.profile.findFirst({ where: { id: profileId, user_id: userId } });
  }
  return prisma.profile.findFirst({ where: { user_id: userId, is_default: true } });
}

// ─── Routes ────────────────────────────────────────────────────────────────

/**
 * GET /api/watch-history
 * Get watch history for a profile
 */
router.get('/', async (req, res, next) => {
  try {
    const profile = await resolveProfile(req.user.id, req.query.profileId);
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found', code: 'NOT_FOUND' });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const where = { profile_id: profile.id };
    if (req.query.type) where.stream = { type: req.query.type.toUpperCase() };
    if (req.query.finished === 'true') where.is_finished = true;
    if (req.query.finished === 'false') where.is_finished = false;

    const [history, total] = await Promise.all([
      prisma.watchHistory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { watched_at: 'desc' },
        include: {
          stream: {
            select: {
              id: true,
              stream_id: true,
              name: true,
              type: true,
              logo: true,
              rating: true,
              container_extension: true,
              category: { select: { id: true, name: true } },
            },
          },
        },
      }),
      prisma.watchHistory.count({ where }),
    ]);

    res.json({
      success: true,
      data: history,
      profile: { id: profile.id, name: profile.name },
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/watch-history
 * Record or update watch progress
 */
router.post('/', async (req, res, next) => {
  try {
    const body = upsertHistorySchema.parse(req.body);

    const profile = await resolveProfile(req.user.id, body.profileId);
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found', code: 'NOT_FOUND' });
    }

    const stream = await prisma.stream.findUnique({ where: { id: body.streamId } });
    if (!stream) {
      return res.status(404).json({ success: false, error: 'Stream not found', code: 'NOT_FOUND' });
    }

    const entry = await prisma.watchHistory.upsert({
      where: {
        profile_id_stream_id: {
          profile_id: profile.id,
          stream_id: body.streamId,
        },
      },
      create: {
        profile_id: profile.id,
        stream_id: body.streamId,
        progress: body.progress,
        duration: body.duration || null,
        is_finished: body.isFinished,
      },
      update: {
        progress: body.progress,
        duration: body.duration !== undefined ? body.duration : undefined,
        is_finished: body.isFinished,
        watched_at: new Date(),
      },
    });

    res.json({ success: true, data: entry });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/watch-history/:streamId
 * Get progress for a specific stream
 */
router.get('/:streamId', async (req, res, next) => {
  try {
    const profile = await resolveProfile(req.user.id, req.query.profileId);
    if (!profile) {
      return res.json({ success: true, data: null });
    }

    const entry = await prisma.watchHistory.findUnique({
      where: {
        profile_id_stream_id: {
          profile_id: profile.id,
          stream_id: req.params.streamId,
        },
      },
    });

    res.json({ success: true, data: entry });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/watch-history/:streamId
 * Remove a specific entry from history
 */
router.delete('/:streamId', async (req, res, next) => {
  try {
    const profile = await resolveProfile(req.user.id, req.query.profileId);
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found', code: 'NOT_FOUND' });
    }

    await prisma.watchHistory.deleteMany({
      where: { profile_id: profile.id, stream_id: req.params.streamId },
    });

    res.json({ success: true, message: 'Removed from history' });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/watch-history
 * Clear all watch history for a profile
 */
router.delete('/', async (req, res, next) => {
  try {
    const profile = await resolveProfile(req.user.id, req.query.profileId);
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found', code: 'NOT_FOUND' });
    }

    const result = await prisma.watchHistory.deleteMany({
      where: { profile_id: profile.id },
    });

    res.json({ success: true, data: { deleted: result.count }, message: 'Watch history cleared' });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/watch-history/continue-watching
 * Get in-progress items (not finished, have progress > 0)
 */
router.get('/continue/watching', async (req, res, next) => {
  try {
    const profile = await resolveProfile(req.user.id, req.query.profileId);
    if (!profile) {
      return res.json({ success: true, data: [] });
    }

    const items = await prisma.watchHistory.findMany({
      where: {
        profile_id: profile.id,
        is_finished: false,
        progress: { gt: 0 },
      },
      orderBy: { watched_at: 'desc' },
      take: 20,
      include: {
        stream: {
          select: {
            id: true,
            stream_id: true,
            name: true,
            type: true,
            logo: true,
            rating: true,
            container_extension: true,
          },
        },
      },
    });

    res.json({ success: true, data: items });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
