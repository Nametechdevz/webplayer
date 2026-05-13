'use strict';

const express = require('express');
const { z } = require('zod');
const { prisma } = require('../models');
const { authenticate } = require('../middleware/auth');
const cache = require('../services/cacheService');
const config = require('../config');

const router = express.Router();
router.use(authenticate);

// ─── Routes ────────────────────────────────────────────────────────────────

/**
 * GET /api/streams
 * List streams with filtering and pagination
 */
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const where = { is_active: true };

    if (req.query.type) where.type = req.query.type.toUpperCase();
    if (req.query.categoryId) where.category_id = req.query.categoryId;
    if (req.query.dnsProviderId) where.dns_provider_id = req.query.dnsProviderId;
    if (req.query.search) {
      where.name = { contains: req.query.search, mode: 'insensitive' };
    }

    const cacheKey = `streams:list:${JSON.stringify(where)}:${page}:${limit}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const [streams, total] = await Promise.all([
      prisma.stream.findMany({
        where,
        skip,
        take: limit,
        orderBy: req.query.sort === 'name' ? { name: 'asc' } : { num: 'asc' },
        select: {
          id: true,
          stream_id: true,
          name: true,
          type: true,
          logo: true,
          epg_channel_id: true,
          num: true,
          rating: true,
          rating_5based: true,
          container_extension: true,
          category: { select: { id: true, name: true } },
          dns_provider_id: true,
        },
      }),
      prisma.stream.count({ where }),
    ]);

    const response = {
      success: true,
      data: streams,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };

    await cache.set(cacheKey, response, config.cache.streamListTtl);
    res.json(response);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/streams/:id
 * Get a single stream by internal UUID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const stream = await prisma.stream.findUnique({
      where: { id: req.params.id },
      include: {
        category: { select: { id: true, name: true, type: true } },
        dns_provider: {
          select: {
            id: true,
            name: true,
            nickname: true,
            status: true,
            // NEVER include username/password
          },
        },
        _count: { select: { favorites: true } },
      },
    });

    if (!stream) {
      return res.status(404).json({ success: false, error: 'Stream not found', code: 'NOT_FOUND' });
    }

    // Check if favorited by the requesting user's default profile
    let isFavorited = false;
    try {
      const defaultProfile = await prisma.profile.findFirst({
        where: { user_id: req.user.id, is_default: true },
        select: { id: true },
      });

      if (defaultProfile) {
        const fav = await prisma.favorite.findUnique({
          where: {
            profile_id_stream_id: {
              profile_id: defaultProfile.id,
              stream_id: stream.id,
            },
          },
        });
        isFavorited = !!fav;
      }
    } catch {
      // Non-fatal
    }

    // Get current EPG program if it's a live stream
    let currentProgram = null;
    if (stream.type === 'LIVE' && stream.epg_channel_id) {
      const now = new Date();
      currentProgram = await prisma.epgProgram.findFirst({
        where: {
          channel_id: stream.epg_channel_id,
          start_time: { lte: now },
          end_time: { gte: now },
        },
        orderBy: { start_time: 'desc' },
      });
    }

    res.json({
      success: true,
      data: {
        ...stream,
        isFavorited,
        currentProgram,
      },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/streams/live
 * Shortcut: list only LIVE streams
 */
router.get('/type/live', async (req, res, next) => {
  req.query.type = 'LIVE';
  // Delegate to main handler logic
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(500, Math.max(1, parseInt(req.query.limit) || 100));
  const skip = (page - 1) * limit;

  try {
    const where = { is_active: true, type: 'LIVE' };
    if (req.query.categoryId) where.category_id = req.query.categoryId;
    if (req.query.search) where.name = { contains: req.query.search, mode: 'insensitive' };

    const cacheKey = `streams:live:${req.query.categoryId || 'all'}:${req.query.search || ''}:${page}:${limit}`;
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(cached);

    const [streams, total] = await Promise.all([
      prisma.stream.findMany({
        where,
        skip,
        take: limit,
        orderBy: { num: 'asc' },
        select: {
          id: true,
          stream_id: true,
          name: true,
          type: true,
          logo: true,
          epg_channel_id: true,
          num: true,
          category: { select: { id: true, name: true } },
        },
      }),
      prisma.stream.count({ where }),
    ]);

    const response = {
      success: true,
      data: streams,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };

    await cache.set(cacheKey, response, config.cache.streamListTtl);
    res.json(response);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/streams/type/vod
 * List VOD streams
 */
router.get('/type/vod', async (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
  const skip = (page - 1) * limit;

  try {
    const where = { is_active: true, type: 'MOVIE' };
    if (req.query.categoryId) where.category_id = req.query.categoryId;
    if (req.query.search) where.name = { contains: req.query.search, mode: 'insensitive' };

    const [streams, total] = await Promise.all([
      prisma.stream.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          stream_id: true,
          name: true,
          type: true,
          logo: true,
          rating: true,
          rating_5based: true,
          container_extension: true,
          category: { select: { id: true, name: true } },
        },
      }),
      prisma.stream.count({ where }),
    ]);

    res.json({
      success: true,
      data: streams,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/streams/type/series
 * List series
 */
router.get('/type/series', async (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
  const skip = (page - 1) * limit;

  try {
    const where = { is_active: true, type: 'SERIES' };
    if (req.query.categoryId) where.category_id = req.query.categoryId;
    if (req.query.search) where.name = { contains: req.query.search, mode: 'insensitive' };

    const [streams, total] = await Promise.all([
      prisma.stream.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          stream_id: true,
          name: true,
          type: true,
          logo: true,
          rating: true,
          rating_5based: true,
          category: { select: { id: true, name: true } },
        },
      }),
      prisma.stream.count({ where }),
    ]);

    res.json({
      success: true,
      data: streams,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
