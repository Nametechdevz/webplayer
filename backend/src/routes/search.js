'use strict';

const express = require('express');
const { z } = require('zod');
const { prisma } = require('../models');
const { authenticate } = require('../middleware/auth');
const cache = require('../services/cacheService');

const router = express.Router();
router.use(authenticate);

/**
 * GET /api/search
 * Universal search across streams, categories
 */
router.get('/', async (req, res, next) => {
  try {
    const query = req.query.q?.trim();

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters',
        code: 'QUERY_TOO_SHORT',
      });
    }

    if (query.length > 200) {
      return res.status(400).json({
        success: false,
        error: 'Search query too long',
        code: 'QUERY_TOO_LONG',
      });
    }

    const type = req.query.type?.toUpperCase(); // LIVE, MOVIE, SERIES
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));

    // Cache for 2 minutes
    const cacheKey = `search:${query.toLowerCase()}:${type || 'all'}:${limit}`;
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(cached);

    const streamWhere = {
      is_active: true,
      name: { contains: query, mode: 'insensitive' },
    };
    if (type) streamWhere.type = type;

    const [streams, categories] = await Promise.all([
      prisma.stream.findMany({
        where: streamWhere,
        take: limit,
        orderBy: [{ name: 'asc' }],
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
      }),
      type
        ? []
        : prisma.category.findMany({
            where: { name: { contains: query, mode: 'insensitive' } },
            take: 10,
            select: {
              id: true,
              name: true,
              type: true,
              _count: { select: { streams: true } },
            },
          }),
    ]);

    // Group streams by type
    const grouped = {
      live: streams.filter((s) => s.type === 'LIVE'),
      movies: streams.filter((s) => s.type === 'MOVIE'),
      series: streams.filter((s) => s.type === 'SERIES'),
    };

    const response = {
      success: true,
      data: {
        query,
        total: streams.length + categories.length,
        streams,
        grouped,
        categories,
      },
    };

    await cache.set(cacheKey, response, 120);
    res.json(response);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/search/suggestions
 * Auto-complete / quick suggestions (top 10)
 */
router.get('/suggestions', async (req, res, next) => {
  try {
    const query = req.query.q?.trim();

    if (!query || query.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const cacheKey = `search:suggest:${query.toLowerCase()}`;
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(cached);

    const streams = await prisma.stream.findMany({
      where: {
        is_active: true,
        name: { startsWith: query, mode: 'insensitive' },
      },
      take: 10,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        type: true,
        logo: true,
      },
    });

    const response = { success: true, data: streams };
    await cache.set(cacheKey, response, 60);
    res.json(response);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
