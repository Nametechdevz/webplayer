'use strict';

const axios = require('axios');
const cache = require('./cacheService');
const config = require('../config');

/**
 * Xtream Codes API integration service.
 * Handles all communication with Xtream-compatible IPTV providers.
 */
class XtreamService {
  /**
   * Build the base API URL for a DNS provider.
   */
  _apiUrl(provider) {
    const base = provider.url.replace(/\/$/, '');
    return `${base}/player_api.php`;
  }

  /**
   * Build stream URL for live streams.
   * Format: http://DNS/USERNAME/PASSWORD/STREAM_ID
   */
  buildLiveUrl(provider, streamId, extension = 'ts') {
    const base = provider.url.replace(/\/$/, '');
    return `${base}/${provider.username}/${provider.password}/${streamId}.${extension}`;
  }

  /**
   * Build stream URL for VOD streams.
   * Format: http://DNS/movie/USERNAME/PASSWORD/STREAM_ID.EXT
   */
  buildMovieUrl(provider, streamId, extension = 'mp4') {
    const base = provider.url.replace(/\/$/, '');
    return `${base}/movie/${provider.username}/${provider.password}/${streamId}.${extension}`;
  }

  /**
   * Build stream URL for series episodes.
   */
  buildSeriesUrl(provider, streamId, extension = 'mp4') {
    const base = provider.url.replace(/\/$/, '');
    return `${base}/series/${provider.username}/${provider.password}/${streamId}.${extension}`;
  }

  /**
   * Execute an authenticated Xtream API call.
   */
  async _call(provider, action, extra = {}) {
    const params = {
      username: provider.username,
      password: provider.password,
      action,
      ...extra,
    };

    const response = await axios.get(this._apiUrl(provider), {
      params,
      timeout: 15000,
      headers: { 'User-Agent': 'IPTV-Player/1.0' },
    });

    return response.data;
  }

  /**
   * Fetch server info / account details.
   */
  async getServerInfo(provider) {
    const data = await this._call(provider, 'get_account_info');
    return data;
  }

  /**
   * Test provider connectivity and return basic info.
   */
  async testConnection(provider) {
    const start = Date.now();
    try {
      const data = await this._call(provider, 'get_account_info');
      const responseTime = Date.now() - start;
      return {
        success: true,
        responseTime,
        serverInfo: data?.server_info || null,
        userInfo: data?.user_info || null,
      };
    } catch (err) {
      return {
        success: false,
        responseTime: Date.now() - start,
        error: err.message,
      };
    }
  }

  // ─── Categories ────────────────────────────────────────────────────────────

  async getLiveCategories(provider) {
    const cacheKey = `xtream:${provider.id}:live_categories`;
    return cache.getOrSet(
      cacheKey,
      () => this._call(provider, 'get_live_categories'),
      config.cache.categoriesTtl
    );
  }

  async getVodCategories(provider) {
    const cacheKey = `xtream:${provider.id}:vod_categories`;
    return cache.getOrSet(
      cacheKey,
      () => this._call(provider, 'get_vod_categories'),
      config.cache.categoriesTtl
    );
  }

  async getSeriesCategories(provider) {
    const cacheKey = `xtream:${provider.id}:series_categories`;
    return cache.getOrSet(
      cacheKey,
      () => this._call(provider, 'get_series_categories'),
      config.cache.categoriesTtl
    );
  }

  // ─── Streams ───────────────────────────────────────────────────────────────

  async getLiveStreams(provider, categoryId = null) {
    const cacheKey = `xtream:${provider.id}:live_streams:${categoryId || 'all'}`;
    const extra = categoryId ? { category_id: categoryId } : {};
    return cache.getOrSet(
      cacheKey,
      () => this._call(provider, 'get_live_streams', extra),
      config.cache.streamListTtl
    );
  }

  async getVodStreams(provider, categoryId = null) {
    const cacheKey = `xtream:${provider.id}:vod_streams:${categoryId || 'all'}`;
    const extra = categoryId ? { category_id: categoryId } : {};
    return cache.getOrSet(
      cacheKey,
      () => this._call(provider, 'get_vod_streams', extra),
      config.cache.streamListTtl
    );
  }

  async getSeries(provider, categoryId = null) {
    const cacheKey = `xtream:${provider.id}:series:${categoryId || 'all'}`;
    const extra = categoryId ? { category_id: categoryId } : {};
    return cache.getOrSet(
      cacheKey,
      () => this._call(provider, 'get_series', extra),
      config.cache.streamListTtl
    );
  }

  async getSeriesInfo(provider, seriesId) {
    const cacheKey = `xtream:${provider.id}:series_info:${seriesId}`;
    return cache.getOrSet(
      cacheKey,
      () => this._call(provider, 'get_series_info', { series_id: seriesId }),
      config.cache.streamListTtl
    );
  }

  async getVodInfo(provider, vodId) {
    const cacheKey = `xtream:${provider.id}:vod_info:${vodId}`;
    return cache.getOrSet(
      cacheKey,
      () => this._call(provider, 'get_vod_info', { vod_id: vodId }),
      config.cache.streamListTtl
    );
  }

  // ─── EPG ───────────────────────────────────────────────────────────────────

  async getEpg(provider, streamId, limit = null) {
    const cacheKey = `xtream:${provider.id}:epg:${streamId}:${limit || 'all'}`;
    const extra = { stream_id: streamId };
    if (limit) extra.limit = limit;
    return cache.getOrSet(
      cacheKey,
      () => this._call(provider, 'get_epg', extra),
      config.cache.epgTtl
    );
  }

  async getShortEpg(provider, streamId, limit = 4) {
    const cacheKey = `xtream:${provider.id}:short_epg:${streamId}:${limit}`;
    return cache.getOrSet(
      cacheKey,
      () => this._call(provider, 'get_short_epg', { stream_id: streamId, limit }),
      config.cache.epgTtl
    );
  }

  async getXmltvEpg(provider) {
    const url = `${provider.url.replace(/\/$/, '')}/xmltv.php?username=${provider.username}&password=${provider.password}`;
    const response = await axios.get(url, {
      timeout: 30000,
      responseType: 'stream',
      headers: { 'User-Agent': 'IPTV-Player/1.0' },
    });
    return response.data; // returns stream
  }

  // ─── Sync helpers ──────────────────────────────────────────────────────────

  /**
   * Fetch all categories + streams for a provider, suitable for DB sync.
   * Returns { liveCategories, vodCategories, seriesCategories, liveStreams, vodStreams, series }
   */
  async fetchAll(provider) {
    const [
      liveCategories,
      vodCategories,
      seriesCategories,
      liveStreams,
      vodStreams,
      series,
    ] = await Promise.allSettled([
      this._call(provider, 'get_live_categories'),
      this._call(provider, 'get_vod_categories'),
      this._call(provider, 'get_series_categories'),
      this._call(provider, 'get_live_streams'),
      this._call(provider, 'get_vod_streams'),
      this._call(provider, 'get_series'),
    ]);

    const getValue = (result) => (result.status === 'fulfilled' ? result.value : []);

    return {
      liveCategories: getValue(liveCategories) || [],
      vodCategories: getValue(vodCategories) || [],
      seriesCategories: getValue(seriesCategories) || [],
      liveStreams: getValue(liveStreams) || [],
      vodStreams: getValue(vodStreams) || [],
      series: getValue(series) || [],
    };
  }

  /**
   * Invalidate all cached data for a provider.
   */
  async invalidateCache(providerId) {
    await cache.delPattern(`xtream:${providerId}:*`);
  }
}

module.exports = new XtreamService();
