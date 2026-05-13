'use strict';

const express = require('express');
const { z } = require('zod');
const { prisma } = require('../models');
const { authenticate } = require('../middleware/auth');
const xtreamService = require('../services/xtreamService');
const epgService = require('../services/epgService');
const cache = require('../services/cacheService');
const config = require('../config');

const router = express.Router();
router.use(authenticate);

/**
 * GET /api/epg/:channelId
 * Get current + upcoming programs for a channel
 */
router.get('/:channelId', async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const hours = Math.min(24, Math.max(1, parseInt(req.query.hours) || 4));

    const data = await epgService.getNowAndNext(channelId, hours);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/epg/:channelId/guide
 * Get full program guide for a date range
 */
router.get('/:channelId/guide', async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const { from, to } = req.query;

    const programs = await epgService.getGuide(channelId, from, to);
    res.json({ success: true, data: programs });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/epg/bulk
 * Get now/next for multiple channels at once
 */
router.post('/bulk', async (req, res, next) => {
  try {
    const { channelIds } = req.body;

    if (!Array.isArray(channelIds) || channelIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'channelIds must be a non-empty array',
        code: 'VALIDATION_ERROR',
      });
    }

    if (channelIds.length > 200) {
      return res.status(400).json({
        success: false,
        error: 'Maximum 200 channels per bulk request',
        code: 'LIMIT_EXCEEDED',
      });
    }

    const data = await epgService.getBulkNowNext(channelIds);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/epg/fetch/:streamId
 * Fetch and store EPG for a stream from the provider
 */
router.post('/fetch/:streamId', async (req, res, next) => {
  try {
    const stream = await prisma.stream.findUnique({
      where: { id: req.params.streamId },
      include: { dns_provider: true },
    });

    if (!stream) {
      return res.status(404).json({ success: false, error: 'Stream not found', code: 'NOT_FOUND' });
    }

    if (!stream.epg_channel_id) {
      return res.status(400).json({
        success: false,
        error: 'Stream has no EPG channel ID',
        code: 'NO_EPG_CHANNEL',
      });
    }

    const provider = stream.dns_provider;
    const epgData = await xtreamService.getEpg(provider, stream.stream_id);

    let count = 0;
    if (epgData?.epg_listings && Array.isArray(epgData.epg_listings)) {
      count = await epgService.upsertPrograms(
        stream.epg_channel_id,
        stream.id,
        epgData.epg_listings
      );
    }

    res.json({
      success: true,
      data: { programsStored: count },
      message: `Stored ${count} EPG programs`,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/epg/cleanup
 * Clean up old EPG data (Admin only)
 */
router.delete('/cleanup', async (req, res, next) => {
  try {
    const daysOld = Math.max(1, parseInt(req.query.days) || 7);
    const count = await epgService.cleanup(daysOld);
    res.json({ success: true, data: { deleted: count } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
