'use strict';

const express = require('express');
const { z } = require('zod');
const { prisma } = require('../models');
const { authenticate, requireRole } = require('../middleware/auth');
const xtreamService = require('../services/xtreamService');
const dnsHealthService = require('../services/dnsHealthService');
const cache = require('../services/cacheService');

const router = express.Router();
router.use(authenticate);
router.use(requireRole('SUPER_ADMIN', 'ADMIN'));

// ─── Validation ────────────────────────────────────────────────────────────

const createDnsSchema = z.object({
  name: z.string().min(1).max(100),
  url: z.string().url('Must be a valid URL'),
  username: z.string().min(1),
  password: z.string().min(1),
  nickname: z.string().max(100).optional(),
  priority: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

const updateDnsSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  url: z.string().url().optional(),
  username: z.string().min(1).optional(),
  password: z.string().min(1).optional(),
  nickname: z.string().max(100).optional().nullable(),
  priority: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// ─── Routes ────────────────────────────────────────────────────────────────

/**
 * GET /api/dns
 * List all DNS providers (passwords redacted)
 */
router.get('/', async (req, res, next) => {
  try {
    const providers = await prisma.dnsProvider.findMany({
      orderBy: [{ priority: 'asc' }, { created_at: 'asc' }],
      select: {
        id: true,
        name: true,
        url: true,
        username: true,
        // password intentionally excluded
        nickname: true,
        status: true,
        priority: true,
        is_active: true,
        last_check: true,
        last_error: true,
        response_time: true,
        streams_count: true,
        server_info: true,
        created_at: true,
        updated_at: true,
      },
    });

    res.json({ success: true, data: providers });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/dns
 * Add a new DNS provider
 */
router.post('/', async (req, res, next) => {
  try {
    const body = createDnsSchema.parse(req.body);

    // Normalize URL (remove trailing slash)
    const url = body.url.replace(/\/$/, '');

    const provider = await prisma.dnsProvider.create({
      data: {
        name: body.name,
        url,
        username: body.username,
        password: body.password,
        nickname: body.nickname || null,
        priority: body.priority,
        is_active: body.isActive,
        status: 'UNKNOWN',
      },
    });

    // Trigger immediate health check
    dnsHealthService.checkProvider(provider.id).catch(console.error);

    const { password, ...safeProvider } = provider;
    res.status(201).json({ success: true, data: safeProvider });
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/dns/:id
 * Update a DNS provider
 */
router.put('/:id', async (req, res, next) => {
  try {
    const body = updateDnsSchema.parse(req.body);

    const existing = await prisma.dnsProvider.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'DNS provider not found', code: 'NOT_FOUND' });
    }

    const updateData = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.url !== undefined) updateData.url = body.url.replace(/\/$/, '');
    if (body.username !== undefined) updateData.username = body.username;
    if (body.password !== undefined) updateData.password = body.password;
    if (body.nickname !== undefined) updateData.nickname = body.nickname;
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.isActive !== undefined) updateData.is_active = body.isActive;

    const provider = await prisma.dnsProvider.update({
      where: { id: req.params.id },
      data: updateData,
    });

    // Invalidate cache for this provider
    await xtreamService.invalidateCache(provider.id);
    await cache.del(`dns_status:${provider.id}`);

    // Re-check if credentials changed
    if (body.url || body.username || body.password) {
      dnsHealthService.checkProvider(provider.id).catch(console.error);
    }

    const { password, ...safeProvider } = provider;
    res.json({ success: true, data: safeProvider });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/dns/:id
 * Remove a DNS provider
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const existing = await prisma.dnsProvider.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ success: false, error: 'DNS provider not found', code: 'NOT_FOUND' });
    }

    await prisma.dnsProvider.delete({ where: { id: req.params.id } });

    // Cleanup caches
    await xtreamService.invalidateCache(req.params.id);
    await cache.del(`dns_status:${req.params.id}`);

    res.json({ success: true, message: 'DNS provider removed' });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/dns/:id/test
 * Test connection to a DNS provider
 */
router.post('/:id/test', async (req, res, next) => {
  try {
    const provider = await prisma.dnsProvider.findUnique({ where: { id: req.params.id } });
    if (!provider) {
      return res.status(404).json({ success: false, error: 'DNS provider not found', code: 'NOT_FOUND' });
    }

    const result = await xtreamService.testConnection(provider);

    // Update status in DB
    await prisma.dnsProvider.update({
      where: { id: provider.id },
      data: {
        status: result.success ? 'ONLINE' : 'OFFLINE',
        last_check: new Date(),
        response_time: result.responseTime,
        last_error: result.success ? null : result.error,
        server_info: result.serverInfo || undefined,
      },
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/dns/:id/sync
 * Sync streams and categories from a DNS provider
 */
router.post('/:id/sync', async (req, res, next) => {
  try {
    const provider = await prisma.dnsProvider.findUnique({ where: { id: req.params.id } });
    if (!provider) {
      return res.status(404).json({ success: false, error: 'DNS provider not found', code: 'NOT_FOUND' });
    }

    if (!provider.is_active) {
      return res.status(400).json({ success: false, error: 'Provider is disabled', code: 'PROVIDER_DISABLED' });
    }

    // Fetch all data from provider
    const data = await xtreamService.fetchAll(provider);

    let categoriesCreated = 0;
    let streamsCreated = 0;

    // ── Sync categories ──────────────────────────────────────
    const categoryTypes = [
      { list: data.liveCategories, type: 'LIVE' },
      { list: data.vodCategories, type: 'MOVIE' },
      { list: data.seriesCategories, type: 'SERIES' },
    ];

    for (const { list, type } of categoryTypes) {
      for (const cat of list) {
        await prisma.category.upsert({
          where: {
            dns_provider_id_category_id_type: {
              dns_provider_id: provider.id,
              category_id: String(cat.category_id),
              type,
            },
          },
          create: {
            dns_provider_id: provider.id,
            category_id: String(cat.category_id),
            name: cat.category_name || 'Unknown',
            type,
          },
          update: {
            name: cat.category_name || 'Unknown',
          },
        });
        categoriesCreated++;
      }
    }

    // ── Build category ID → UUID map ─────────────────────────
    const allCategories = await prisma.category.findMany({
      where: { dns_provider_id: provider.id },
      select: { id: true, category_id: true, type: true },
    });

    const catMap = {};
    allCategories.forEach((c) => {
      catMap[`${c.type}:${c.category_id}`] = c.id;
    });

    // ── Sync streams ─────────────────────────────────────────
    const streamTypes = [
      { list: data.liveStreams, type: 'LIVE' },
      { list: data.vodStreams, type: 'MOVIE' },
      { list: data.series, type: 'SERIES' },
    ];

    for (const { list, type } of streamTypes) {
      for (const stream of list) {
        const streamId = String(stream.stream_id || stream.series_id);
        const categoryUuid = catMap[`${type}:${stream.category_id}`] || null;

        await prisma.stream.upsert({
          where: {
            dns_provider_id_stream_id_type: {
              dns_provider_id: provider.id,
              stream_id: streamId,
              type,
            },
          },
          create: {
            dns_provider_id: provider.id,
            stream_id: streamId,
            name: stream.name || stream.title || 'Unknown',
            type,
            category_id: categoryUuid,
            logo: stream.stream_icon || stream.cover || null,
            epg_channel_id: stream.epg_channel_id || null,
            num: stream.num ? parseInt(stream.num) : null,
            rating: stream.rating ? parseFloat(stream.rating) : null,
            rating_5based: stream.rating_5based ? parseFloat(stream.rating_5based) : null,
            container_extension: stream.container_extension || null,
            last_synced: new Date(),
          },
          update: {
            name: stream.name || stream.title || 'Unknown',
            category_id: categoryUuid,
            logo: stream.stream_icon || stream.cover || null,
            epg_channel_id: stream.epg_channel_id || null,
            container_extension: stream.container_extension || null,
            last_synced: new Date(),
            is_active: true,
          },
        });
        streamsCreated++;
      }
    }

    // Update streams count
    await prisma.dnsProvider.update({
      where: { id: provider.id },
      data: { streams_count: streamsCreated },
    });

    // Invalidate caches
    await xtreamService.invalidateCache(provider.id);
    await cache.delPattern(`streams:${provider.id}:*`);
    await cache.delPattern(`categories:${provider.id}:*`);

    res.json({
      success: true,
      data: {
        categoriesSync: categoriesCreated,
        streamsSync: streamsCreated,
      },
      message: `Sync complete: ${categoriesCreated} categories, ${streamsCreated} streams`,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/dns/:id/status
 * Get health status for a DNS provider
 */
router.get('/:id/status', async (req, res, next) => {
  try {
    const provider = await prisma.dnsProvider.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        nickname: true,
        status: true,
        last_check: true,
        response_time: true,
        last_error: true,
        streams_count: true,
      },
    });

    if (!provider) {
      return res.status(404).json({ success: false, error: 'DNS provider not found', code: 'NOT_FOUND' });
    }

    // Augment with cached status if available
    const cachedStatus = await cache.getDnsStatus(provider.id);

    res.json({
      success: true,
      data: { ...provider, cached: cachedStatus },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/dns/health
 * Get health summary for all providers
 */
router.get('/health/summary', async (req, res, next) => {
  try {
    const summary = await dnsHealthService.getHealthSummary();
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
