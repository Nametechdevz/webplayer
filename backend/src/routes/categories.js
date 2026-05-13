'use strict';

const express = require('express');
const { z } = require('zod');
const { prisma } = require('../models');
const { authenticate, requireRole } = require('../middleware/auth');
const cache = require('../services/cacheService');
const config = require('../config');

const router = express.Router();
router.use(authenticate);

/**
 * GET /api/categories
 * List categories, optionally filtered by type
 */
router.get('/', async (req, res, next) => {
  try {
    const type = req.query.type?.toUpperCase();
    const dnsProviderId = req.query.dnsProviderId;

    const cacheKey = `categories:${type || 'all'}:${dnsProviderId || 'all'}`;
    const cached = await cache.get(cacheKey);
    if (cached) return res.json(cached);

    const where = {};
    if (type) where.type = type;
    if (dnsProviderId) where.dns_provider_id = dnsProviderId;

    const categories = await prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        category_id: true,
        name: true,
        type: true,
        dns_provider_id: true,
        _count: { select: { streams: true } },
      },
    });

    const response = { success: true, data: categories };
    await cache.set(cacheKey, response, config.cache.categoriesTtl);
    res.json(response);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/categories/:id
 * Get a single category and its streams
 */
router.get('/:id', async (req, res, next) => {
  try {
    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
      include: {
        _count: { select: { streams: true } },
      },
    });

    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found', code: 'NOT_FOUND' });
    }

    res.json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/categories/:id/streams
 * Get streams within a category
 */
router.get('/:id/streams', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const category = await prisma.category.findUnique({
      where: { id: req.params.id },
    });

    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found', code: 'NOT_FOUND' });
    }

    const [streams, total] = await Promise.all([
      prisma.stream.findMany({
        where: { category_id: req.params.id, is_active: true },
        skip,
        take: limit,
        orderBy: category.type === 'LIVE' ? { num: 'asc' } : { name: 'asc' },
        select: {
          id: true,
          stream_id: true,
          name: true,
          type: true,
          logo: true,
          epg_channel_id: true,
          num: true,
          rating: true,
          container_extension: true,
        },
      }),
      prisma.stream.count({ where: { category_id: req.params.id, is_active: true } }),
    ]);

    res.json({
      success: true,
      data: streams,
      category,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/categories/:id (Admin only)
 * Remove a category
 */
router.delete('/:id', requireRole('SUPER_ADMIN', 'ADMIN'), async (req, res, next) => {
  try {
    const category = await prisma.category.findUnique({ where: { id: req.params.id } });
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found', code: 'NOT_FOUND' });
    }

    await prisma.category.delete({ where: { id: req.params.id } });

    // Invalidate category caches
    await cache.delPattern('categories:*');

    res.json({ success: true, message: 'Category removed' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
