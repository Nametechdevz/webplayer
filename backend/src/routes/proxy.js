'use strict';

const express = require('express');
const { prisma } = require('../models');
const { authenticate } = require('../middleware/auth');
const { streamLimiter } = require('../middleware/rateLimit');
const tokenService = require('../services/tokenService');
const proxyService = require('../services/proxyService');
const xtreamService = require('../services/xtreamService');
const dnsHealthService = require('../services/dnsHealthService');

const router = express.Router();

// ─── Token Generation (requires auth) ─────────────────────────────────────

/**
 * GET /api/proxy/token/:streamId
 * Generate a secure, time-limited stream token.
 * The token maps to real DNS credentials – never exposed to the client.
 */
router.get('/token/:streamId', authenticate, async (req, res, next) => {
  try {
    const stream = await prisma.stream.findUnique({
      where: { id: req.params.streamId },
      include: {
        dns_provider: {
          select: { id: true, status: true, is_active: true, priority: true },
        },
      },
    });

    if (!stream) {
      return res.status(404).json({ success: false, error: 'Stream not found', code: 'NOT_FOUND' });
    }

    if (!stream.is_active) {
      return res.status(410).json({ success: false, error: 'Stream is not available', code: 'STREAM_INACTIVE' });
    }

    // Check if the DNS provider is online; if not, try to find a fallback with the same stream
    let providerId = stream.dns_provider_id;
    if (stream.dns_provider.status === 'OFFLINE' || !stream.dns_provider.is_active) {
      // Look for the same stream on another provider
      const alternate = await prisma.stream.findFirst({
        where: {
          stream_id: stream.stream_id,
          type: stream.type,
          is_active: true,
          id: { not: stream.id },
          dns_provider: { status: 'ONLINE', is_active: true },
        },
        include: {
          dns_provider: { select: { id: true } },
        },
      });

      if (alternate) {
        providerId = alternate.dns_provider_id;
      }
      // else continue with original (might recover)
    }

    // Get the user's default profile
    const defaultProfile = await prisma.profile.findFirst({
      where: { user_id: req.user.id, is_default: true },
      select: { id: true },
    });

    const token = await tokenService.generateStreamToken({
      streamId: stream.id,
      internalStreamId: stream.stream_id,
      type: stream.type,
      dnsProviderId: providerId,
      containerExtension: stream.container_extension,
      userId: req.user.id,
      profileId: defaultProfile?.id || null,
    });

    const ttl = 4 * 60 * 60; // 4 hours

    res.json({
      success: true,
      data: {
        token,
        expiresIn: ttl,
        expiresAt: new Date(Date.now() + ttl * 1000).toISOString(),
        type: stream.type,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── Stream Proxy Endpoints (token-based, no auth middleware) ──────────────

/**
 * GET /api/proxy/live/:token
 * Proxy a live stream. Credentials are resolved server-side from the token.
 */
router.get('/live/:token', streamLimiter, async (req, res, next) => {
  try {
    const tokenData = await tokenService.validateStreamToken(req.params.token);

    if (!tokenData) {
      return res.status(401).json({ success: false, error: 'Invalid or expired stream token', code: 'INVALID_TOKEN' });
    }

    if (tokenData.type !== 'LIVE') {
      return res.status(400).json({ success: false, error: 'Token is not for a live stream', code: 'WRONG_STREAM_TYPE' });
    }

    const provider = await prisma.dnsProvider.findUnique({
      where: { id: tokenData.dnsProviderId },
    });

    if (!provider || !provider.is_active) {
      return res.status(503).json({ success: false, error: 'Stream provider unavailable', code: 'PROVIDER_UNAVAILABLE' });
    }

    const ext = req.query.ext || 'ts';
    const upstreamUrl = xtreamService.buildLiveUrl(provider, tokenData.internalStreamId, ext);

    // Check if this is an HLS stream request
    if (ext === 'm3u8') {
      const proxyBase = `${req.protocol}://${req.get('host')}/api/proxy/hls`;
      return proxyService.proxyM3u8(upstreamUrl, proxyBase, req.params.token, req, res);
    }

    await proxyService.proxyStream(upstreamUrl, req, res);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/proxy/movie/:token
 * Proxy a VOD movie stream.
 */
router.get('/movie/:token', streamLimiter, async (req, res, next) => {
  try {
    const tokenData = await tokenService.validateStreamToken(req.params.token);

    if (!tokenData) {
      return res.status(401).json({ success: false, error: 'Invalid or expired stream token', code: 'INVALID_TOKEN' });
    }

    if (tokenData.type !== 'MOVIE') {
      return res.status(400).json({ success: false, error: 'Token is not for a movie', code: 'WRONG_STREAM_TYPE' });
    }

    const provider = await prisma.dnsProvider.findUnique({
      where: { id: tokenData.dnsProviderId },
    });

    if (!provider || !provider.is_active) {
      return res.status(503).json({ success: false, error: 'Stream provider unavailable', code: 'PROVIDER_UNAVAILABLE' });
    }

    const ext = tokenData.containerExtension || req.query.ext || 'mp4';
    const upstreamUrl = xtreamService.buildMovieUrl(provider, tokenData.internalStreamId, ext);

    await proxyService.proxyStream(upstreamUrl, req, res);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/proxy/series/:token
 * Proxy a series episode stream.
 */
router.get('/series/:token', streamLimiter, async (req, res, next) => {
  try {
    const tokenData = await tokenService.validateStreamToken(req.params.token);

    if (!tokenData) {
      return res.status(401).json({ success: false, error: 'Invalid or expired stream token', code: 'INVALID_TOKEN' });
    }

    if (tokenData.type !== 'SERIES') {
      return res.status(400).json({ success: false, error: 'Token is not for a series', code: 'WRONG_STREAM_TYPE' });
    }

    const provider = await prisma.dnsProvider.findUnique({
      where: { id: tokenData.dnsProviderId },
    });

    if (!provider || !provider.is_active) {
      return res.status(503).json({ success: false, error: 'Stream provider unavailable', code: 'PROVIDER_UNAVAILABLE' });
    }

    const ext = tokenData.containerExtension || req.query.ext || 'mp4';
    const upstreamUrl = xtreamService.buildSeriesUrl(provider, tokenData.internalStreamId, ext);

    await proxyService.proxyStream(upstreamUrl, req, res);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/proxy/hls/:token/:segment
 * Proxy individual HLS segments.
 * The segment URL is base64url-encoded in the `u` query param to prevent credential exposure.
 */
router.get('/hls/:token/:segment', streamLimiter, async (req, res, next) => {
  try {
    const tokenData = await tokenService.validateStreamToken(req.params.token);

    if (!tokenData) {
      return res.status(401).json({ success: false, error: 'Invalid or expired stream token', code: 'INVALID_TOKEN' });
    }

    // If segment is 'seg' and has 'u' param, decode and proxy the encoded URL
    if (req.params.segment === 'seg' && req.query.u) {
      let upstreamUrl;
      try {
        upstreamUrl = Buffer.from(req.query.u, 'base64url').toString('utf8');
      } catch {
        return res.status(400).json({ success: false, error: 'Invalid segment URL', code: 'INVALID_SEGMENT' });
      }

      // Security: validate the decoded URL is a proper http/https URL
      if (!upstreamUrl.startsWith('http://') && !upstreamUrl.startsWith('https://')) {
        return res.status(400).json({ success: false, error: 'Invalid segment URL scheme', code: 'INVALID_SEGMENT' });
      }

      return proxyService.proxyStream(upstreamUrl, req, res);
    }

    // Otherwise build the URL from the token's provider data
    const provider = await prisma.dnsProvider.findUnique({
      where: { id: tokenData.dnsProviderId },
    });

    if (!provider) {
      return res.status(503).json({ success: false, error: 'Provider not found', code: 'PROVIDER_UNAVAILABLE' });
    }

    const segmentUrl = `${provider.url.replace(/\/$/, '')}/${provider.username}/${provider.password}/${req.params.segment}`;
    await proxyService.proxyStream(segmentUrl, req, res);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/proxy/hls/:token
 * Proxy HLS manifest and rewrite segment URLs.
 */
router.get('/hls/:token', streamLimiter, async (req, res, next) => {
  try {
    const tokenData = await tokenService.validateStreamToken(req.params.token);

    if (!tokenData) {
      return res.status(401).json({ success: false, error: 'Invalid or expired stream token', code: 'INVALID_TOKEN' });
    }

    const provider = await prisma.dnsProvider.findUnique({
      where: { id: tokenData.dnsProviderId },
    });

    if (!provider || !provider.is_active) {
      return res.status(503).json({ success: false, error: 'Provider unavailable', code: 'PROVIDER_UNAVAILABLE' });
    }

    const upstreamUrl = xtreamService.buildLiveUrl(provider, tokenData.internalStreamId, 'm3u8');
    const proxyBase = `${req.protocol}://${req.get('host')}/api/proxy/hls`;

    await proxyService.proxyM3u8(upstreamUrl, proxyBase, req.params.token, req, res);
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/proxy/token/:token
 * Revoke a stream token early (e.g., on player close)
 */
router.delete('/token/:token', authenticate, async (req, res, next) => {
  try {
    await tokenService.revokeStreamToken(req.params.token);
    res.json({ success: true, message: 'Token revoked' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
