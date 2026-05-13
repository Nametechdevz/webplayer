'use strict';

const express = require('express');
const { z } = require('zod');
const { prisma } = require('../models');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

const addFavoriteSchema = z.object({
  streamId: z.string().uuid(),
  profileId: z.string().uuid().optional(),
});

/**
 * Resolve the profile to use: either the provided profileId (if it belongs to user)
 * or the user's default profile.
 */
async function resolveProfile(userId, profileId) {
  if (profileId) {
    return prisma.profile.findFirst({
      where: { id: profileId, user_id: userId },
    });
  }
  return prisma.profile.findFirst({
    where: { user_id: userId, is_default: true },
  });
}

/**
 * GET /api/favorites
 * Get all favorites for a profile
 */
router.get('/', async (req, res, next) => {
  try {
    const profile = await resolveProfile(req.user.id, req.query.profileId);

    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found', code: 'NOT_FOUND' });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit) || 100));
    const skip = (page - 1) * limit;

    const where = { profile_id: profile.id };
    if (req.query.type) {
      where.stream = { type: req.query.type.toUpperCase() };
    }

    const [favorites, total] = await Promise.all([
      prisma.favorite.findMany({
        where,
        skip,
        take: limit,
        orderBy: { added_at: 'desc' },
        include: {
          stream: {
            select: {
              id: true,
              stream_id: true,
              name: true,
              type: true,
              logo: true,
              epg_channel_id: true,
              num: true,
              rating: true,
              category: { select: { id: true, name: true } },
            },
          },
        },
      }),
      prisma.favorite.count({ where }),
    ]);

    res.json({
      success: true,
      data: favorites,
      profile: { id: profile.id, name: profile.name },
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/favorites
 * Add a stream to favorites
 */
router.post('/', async (req, res, next) => {
  try {
    const body = addFavoriteSchema.parse(req.body);

    const profile = await resolveProfile(req.user.id, body.profileId);
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found', code: 'NOT_FOUND' });
    }

    const stream = await prisma.stream.findUnique({ where: { id: body.streamId } });
    if (!stream) {
      return res.status(404).json({ success: false, error: 'Stream not found', code: 'NOT_FOUND' });
    }

    const favorite = await prisma.favorite.upsert({
      where: {
        profile_id_stream_id: {
          profile_id: profile.id,
          stream_id: body.streamId,
        },
      },
      create: {
        profile_id: profile.id,
        stream_id: body.streamId,
      },
      update: {}, // Already exists, no update needed
    });

    res.status(201).json({ success: true, data: favorite });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/favorites/:streamId
 * Remove a stream from favorites
 */
router.delete('/:streamId', async (req, res, next) => {
  try {
    const profile = await resolveProfile(req.user.id, req.query.profileId);
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found', code: 'NOT_FOUND' });
    }

    const existing = await prisma.favorite.findUnique({
      where: {
        profile_id_stream_id: {
          profile_id: profile.id,
          stream_id: req.params.streamId,
        },
      },
    });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Favorite not found', code: 'NOT_FOUND' });
    }

    await prisma.favorite.delete({
      where: {
        profile_id_stream_id: {
          profile_id: profile.id,
          stream_id: req.params.streamId,
        },
      },
    });

    res.json({ success: true, message: 'Removed from favorites' });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/favorites/check/:streamId
 * Check if a stream is favorited
 */
router.get('/check/:streamId', async (req, res, next) => {
  try {
    const profile = await resolveProfile(req.user.id, req.query.profileId);
    if (!profile) {
      return res.json({ success: true, isFavorited: false });
    }

    const fav = await prisma.favorite.findUnique({
      where: {
        profile_id_stream_id: {
          profile_id: profile.id,
          stream_id: req.params.streamId,
        },
      },
    });

    res.json({ success: true, isFavorited: !!fav });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
