'use strict';

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const cache = require('./cacheService');

/**
 * Generates and validates secure, time-limited stream tokens.
 * Tokens are opaque UUIDs stored in Redis – credentials never appear in URLs.
 */
class TokenService {
  /**
   * Generate a stream access token.
   * @param {object} payload - { streamId, type, dnsProviderId, userId, profileId }
   * @param {number} ttlSeconds - Token lifetime in seconds (default: 4h)
   * @returns {string} opaque token
   */
  async generateStreamToken(payload, ttlSeconds = config.stream.tokenTtl) {
    const token = uuidv4().replace(/-/g, '');
    const tokenData = {
      ...payload,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttlSeconds * 1000,
    };

    await cache.setStreamToken(token, tokenData, ttlSeconds);
    return token;
  }

  /**
   * Validate a stream token and return its payload, or null if invalid/expired.
   * @param {string} token
   * @returns {object|null}
   */
  async validateStreamToken(token) {
    if (!token || typeof token !== 'string' || token.length < 32) {
      return null;
    }

    const data = await cache.getStreamToken(token);
    if (!data) return null;

    if (data.expiresAt && data.expiresAt < Date.now()) {
      await cache.delStreamToken(token);
      return null;
    }

    return data;
  }

  /**
   * Revoke a stream token.
   */
  async revokeStreamToken(token) {
    return cache.delStreamToken(token);
  }

  /**
   * Create a signed HMAC for internal use (e.g., HLS segment verification).
   */
  signPayload(payload) {
    const str = typeof payload === 'string' ? payload : JSON.stringify(payload);
    return crypto
      .createHmac('sha256', config.stream.tokenSecret)
      .update(str)
      .digest('hex');
  }

  verifySignature(payload, signature) {
    const expected = this.signPayload(payload);
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(signature, 'hex')
    );
  }
}

module.exports = new TokenService();
