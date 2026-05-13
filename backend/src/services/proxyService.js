'use strict';

const http = require('http');
const https = require('https');
const { URL } = require('url');

/**
 * Stream proxy service.
 * Pipes upstream streams to the client WITHOUT loading content into memory.
 * Credentials are NEVER exposed to the frontend.
 */
class ProxyService {
  /**
   * Proxy a stream URL to the HTTP response.
   * Handles live streams, VOD, and HLS manifests.
   *
   * @param {string} upstreamUrl - The real upstream URL (with credentials)
   * @param {object} req - Express request
   * @param {object} res - Express response
   * @param {object} options
   * @param {object} options.headers - Extra headers to forward upstream
   */
  async proxyStream(upstreamUrl, req, res, options = {}) {
    let parsedUrl;
    try {
      parsedUrl = new URL(upstreamUrl);
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid upstream URL' });
    }

    const isHttps = parsedUrl.protocol === 'https:';
    const transport = isHttps ? https : http;

    // Build forwarded headers – strip sensitive client headers
    const forwardHeaders = {
      'User-Agent': req.headers['user-agent'] || 'IPTV-Player/1.0',
      Accept: req.headers['accept'] || '*/*',
      'Accept-Language': req.headers['accept-language'] || 'en-US,en;q=0.9',
      Connection: 'keep-alive',
    };

    // Forward Range header for VOD seeking
    if (req.headers['range']) {
      forwardHeaders['Range'] = req.headers['range'];
    }

    // Merge caller-supplied headers
    Object.assign(forwardHeaders, options.headers || {});

    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: forwardHeaders,
      timeout: 20000,
    };

    return new Promise((resolve) => {
      const upstreamReq = transport.request(requestOptions, (upstreamRes) => {
        // Pass through relevant response headers
        const passThroughHeaders = [
          'content-type',
          'content-length',
          'content-range',
          'accept-ranges',
          'cache-control',
          'last-modified',
          'etag',
          'transfer-encoding',
        ];

        passThroughHeaders.forEach((h) => {
          if (upstreamRes.headers[h]) {
            res.setHeader(h, upstreamRes.headers[h]);
          }
        });

        // Security: remove credentials from any Location redirects
        if (upstreamRes.headers['location']) {
          // We handle redirects ourselves below
        }

        // Map status codes
        const statusCode = upstreamRes.statusCode;
        if (statusCode === 301 || statusCode === 302 || statusCode === 307 || statusCode === 308) {
          // Follow the redirect internally to keep credentials hidden
          upstreamReq.destroy();
          const redirectUrl = upstreamRes.headers['location'];
          if (redirectUrl) {
            resolve(this.proxyStream(redirectUrl, req, res, options));
          } else {
            res.status(502).json({ success: false, error: 'Bad redirect from upstream' });
            resolve();
          }
          return;
        }

        res.status(statusCode);
        // Pipe directly – no buffering
        upstreamRes.pipe(res, { end: true });

        upstreamRes.on('end', () => resolve());
        upstreamRes.on('error', (err) => {
          console.error('[Proxy] Upstream stream error:', err.message);
          if (!res.headersSent) {
            res.status(502).json({ success: false, error: 'Upstream stream error' });
          } else {
            res.end();
          }
          resolve();
        });
      });

      upstreamReq.on('error', (err) => {
        console.error('[Proxy] Request error:', err.message);
        if (!res.headersSent) {
          res.status(502).json({ success: false, error: 'Could not connect to upstream' });
        } else {
          res.end();
        }
        resolve();
      });

      upstreamReq.on('timeout', () => {
        upstreamReq.destroy();
        if (!res.headersSent) {
          res.status(504).json({ success: false, error: 'Upstream timeout' });
        } else {
          res.end();
        }
        resolve();
      });

      // Handle client disconnect – abort upstream request
      req.on('close', () => {
        upstreamReq.destroy();
      });

      upstreamReq.end();
    });
  }

  /**
   * Proxy an HLS .m3u8 manifest, rewriting segment URLs to go through our proxy.
   * This ensures HLS segment requests also never expose credentials.
   *
   * @param {string} upstreamUrl - The real .m3u8 URL
   * @param {string} proxyBase   - Our proxy base URL e.g. https://api.example.com/api/proxy/hls/{token}
   * @param {string} token       - Stream token to embed in rewritten URLs
   * @param {object} req
   * @param {object} res
   */
  async proxyM3u8(upstreamUrl, proxyBase, token, req, res) {
    let parsedUrl;
    try {
      parsedUrl = new URL(upstreamUrl);
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid upstream URL' });
    }

    const isHttps = parsedUrl.protocol === 'https:';
    const transport = isHttps ? https : http;

    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: { 'User-Agent': 'IPTV-Player/1.0' },
      timeout: 15000,
    };

    return new Promise((resolve) => {
      const upstreamReq = transport.request(requestOptions, (upstreamRes) => {
        const chunks = [];
        upstreamRes.on('data', (chunk) => chunks.push(chunk));
        upstreamRes.on('end', () => {
          const manifest = Buffer.concat(chunks).toString('utf8');
          const rewritten = this._rewriteM3u8(manifest, proxyBase, token, upstreamUrl);
          res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
          res.setHeader('Cache-Control', 'no-cache');
          res.status(200).send(rewritten);
          resolve();
        });
        upstreamRes.on('error', (err) => {
          if (!res.headersSent) {
            res.status(502).json({ success: false, error: 'Failed to fetch manifest' });
          }
          resolve();
        });
      });

      upstreamReq.on('error', (err) => {
        if (!res.headersSent) {
          res.status(502).json({ success: false, error: 'Could not connect to upstream' });
        }
        resolve();
      });

      upstreamReq.on('timeout', () => {
        upstreamReq.destroy();
        if (!res.headersSent) {
          res.status(504).json({ success: false, error: 'Manifest fetch timeout' });
        }
        resolve();
      });

      req.on('close', () => upstreamReq.destroy());
      upstreamReq.end();
    });
  }

  /**
   * Rewrite .m3u8 manifest segment/playlist lines to go through our proxy.
   */
  _rewriteM3u8(manifest, proxyBase, token, baseUrl) {
    const baseUrlObj = new URL(baseUrl);
    const baseDir = baseUrlObj.pathname.substring(0, baseUrlObj.pathname.lastIndexOf('/') + 1);

    return manifest
      .split('\n')
      .map((line) => {
        const trimmed = line.trim();

        // Skip comments and directives
        if (trimmed.startsWith('#') || trimmed === '') return line;

        // Absolute URL
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
          const encoded = Buffer.from(trimmed).toString('base64url');
          return `${proxyBase}/${token}/seg?u=${encoded}`;
        }

        // Relative URL – resolve against base
        const absoluteUrl = `${baseUrlObj.protocol}//${baseUrlObj.host}${baseDir}${trimmed}`;
        const encoded = Buffer.from(absoluteUrl).toString('base64url');
        return `${proxyBase}/${token}/seg?u=${encoded}`;
      })
      .join('\n');
  }
}

module.exports = new ProxyService();
