'use strict';

const { getRedisClient } = require('../config/redis');

/**
 * Redis cache helper with graceful degradation when Redis is unavailable.
 */
class CacheService {
  constructor() {
    this._client = null;
  }

  get client() {
    if (!this._client) {
      this._client = getRedisClient();
    }
    return this._client;
  }

  /**
   * Get a cached value. Returns null on miss or error.
   */
  async get(key) {
    try {
      const value = await this.client.get(key);
      if (value === null) return null;
      return JSON.parse(value);
    } catch (err) {
      console.warn(`[Cache] GET error for key "${key}":`, err.message);
      return null;
    }
  }

  /**
   * Set a value with optional TTL in seconds.
   */
  async set(key, value, ttlSeconds = null) {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      return true;
    } catch (err) {
      console.warn(`[Cache] SET error for key "${key}":`, err.message);
      return false;
    }
  }

  /**
   * Delete one or more keys.
   */
  async del(...keys) {
    try {
      if (keys.length === 0) return 0;
      return await this.client.del(...keys);
    } catch (err) {
      console.warn('[Cache] DEL error:', err.message);
      return 0;
    }
  }

  /**
   * Delete all keys matching a pattern.
   */
  async delPattern(pattern) {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) return 0;
      return await this.client.del(...keys);
    } catch (err) {
      console.warn(`[Cache] DEL pattern error for "${pattern}":`, err.message);
      return 0;
    }
  }

  /**
   * Get or compute a value. Calls factory() on cache miss.
   */
  async getOrSet(key, factory, ttlSeconds = null) {
    const cached = await this.get(key);
    if (cached !== null) return cached;

    const value = await factory();
    if (value !== null && value !== undefined) {
      await this.set(key, value, ttlSeconds);
    }
    return value;
  }

  /**
   * Increment a counter key.
   */
  async incr(key, ttlSeconds = null) {
    try {
      const val = await this.client.incr(key);
      if (ttlSeconds && val === 1) {
        await this.client.expire(key, ttlSeconds);
      }
      return val;
    } catch (err) {
      console.warn(`[Cache] INCR error for key "${key}":`, err.message);
      return null;
    }
  }

  /**
   * Check if a key exists.
   */
  async exists(key) {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (err) {
      console.warn(`[Cache] EXISTS error for key "${key}":`, err.message);
      return false;
    }
  }

  /**
   * Set key expiry.
   */
  async expire(key, ttlSeconds) {
    try {
      return await this.client.expire(key, ttlSeconds);
    } catch (err) {
      console.warn(`[Cache] EXPIRE error for key "${key}":`, err.message);
      return 0;
    }
  }

  /**
   * Store session data.
   */
  async setSession(sessionId, data, ttlSeconds) {
    return this.set(`session:${sessionId}`, data, ttlSeconds);
  }

  async getSession(sessionId) {
    return this.get(`session:${sessionId}`);
  }

  async delSession(sessionId) {
    return this.del(`session:${sessionId}`);
  }

  /**
   * Store stream token.
   */
  async setStreamToken(token, data, ttlSeconds) {
    return this.set(`stream_token:${token}`, data, ttlSeconds);
  }

  async getStreamToken(token) {
    return this.get(`stream_token:${token}`);
  }

  async delStreamToken(token) {
    return this.del(`stream_token:${token}`);
  }

  /**
   * Store DNS health status.
   */
  async setDnsStatus(dnsId, status, ttlSeconds) {
    return this.set(`dns_status:${dnsId}`, status, ttlSeconds);
  }

  async getDnsStatus(dnsId) {
    return this.get(`dns_status:${dnsId}`);
  }
}

module.exports = new CacheService();
