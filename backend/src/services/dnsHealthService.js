'use strict';

const cron = require('node-cron');
const { EventEmitter } = require('events');
const { getDatabaseClient } = require('../config/database');
const cache = require('./cacheService');
const xtreamService = require('./xtreamService');
const config = require('../config');

/**
 * DNS Health Monitoring Service.
 * Runs periodic health checks on all DNS providers and handles failover.
 * Emits events: 'provider:offline', 'provider:online', 'provider:degraded'
 */
class DnsHealthService extends EventEmitter {
  constructor() {
    super();
    this._task = null;
    this._checking = false;
  }

  /**
   * Start the scheduled health check cron job.
   */
  start() {
    if (this._task) {
      console.warn('[DnsHealth] Already running');
      return;
    }

    const schedule = config.dns.healthCron;
    console.log(`[DnsHealth] Starting health checks with schedule: ${schedule}`);

    this._task = cron.schedule(schedule, async () => {
      await this.runChecks();
    });

    // Run an initial check at startup
    setImmediate(() => this.runChecks());
  }

  /**
   * Stop the scheduled health checks.
   */
  stop() {
    if (this._task) {
      this._task.destroy();
      this._task = null;
      console.log('[DnsHealth] Stopped');
    }
  }

  /**
   * Run health checks on all active DNS providers.
   */
  async runChecks() {
    if (this._checking) {
      console.log('[DnsHealth] Check already in progress, skipping');
      return;
    }

    this._checking = true;
    const prisma = getDatabaseClient();

    try {
      const providers = await prisma.dnsProvider.findMany({
        where: { is_active: true },
        orderBy: { priority: 'asc' },
      });

      if (providers.length === 0) {
        return;
      }

      console.log(`[DnsHealth] Checking ${providers.length} DNS provider(s)`);

      const results = await Promise.allSettled(
        providers.map((p) => this._checkProvider(p))
      );

      results.forEach((result, idx) => {
        if (result.status === 'rejected') {
          console.error(`[DnsHealth] Check failed for provider ${providers[idx].id}:`, result.reason);
        }
      });
    } catch (err) {
      console.error('[DnsHealth] runChecks error:', err.message);
    } finally {
      this._checking = false;
    }
  }

  /**
   * Check a single DNS provider and update its status in the DB + cache.
   */
  async _checkProvider(provider) {
    const prisma = getDatabaseClient();
    const previousStatus = provider.status;

    // Mark as CHECKING
    await prisma.dnsProvider.update({
      where: { id: provider.id },
      data: { status: 'CHECKING' },
    });

    const result = await xtreamService.testConnection(provider);

    const newStatus = result.success ? 'ONLINE' : 'OFFLINE';
    const updateData = {
      status: newStatus,
      last_check: new Date(),
      response_time: result.responseTime,
      last_error: result.success ? null : result.error,
    };

    if (result.success && result.serverInfo) {
      updateData.server_info = result.serverInfo;
    }

    await prisma.dnsProvider.update({
      where: { id: provider.id },
      data: updateData,
    });

    // Cache DNS status
    await cache.setDnsStatus(
      provider.id,
      { status: newStatus, responseTime: result.responseTime, checkedAt: Date.now() },
      config.cache.dnsStatusTtl
    );

    // Emit events on status change
    if (previousStatus !== newStatus) {
      if (newStatus === 'OFFLINE') {
        console.warn(`[DnsHealth] Provider ${provider.nickname || provider.name} went OFFLINE`);
        this.emit('provider:offline', { provider, error: result.error });
        await this._handleFailover(provider.id);
      } else if (newStatus === 'ONLINE' && previousStatus === 'OFFLINE') {
        console.log(`[DnsHealth] Provider ${provider.nickname || provider.name} is back ONLINE`);
        this.emit('provider:online', { provider });
      }
    }

    return { providerId: provider.id, status: newStatus, responseTime: result.responseTime };
  }

  /**
   * Handle automatic failover when a DNS provider goes offline.
   * Finds the next available provider and can be used to reassign streams.
   */
  async _handleFailover(offlineProviderId) {
    const prisma = getDatabaseClient();

    try {
      const nextProvider = await prisma.dnsProvider.findFirst({
        where: {
          is_active: true,
          status: 'ONLINE',
          id: { not: offlineProviderId },
        },
        orderBy: { priority: 'asc' },
      });

      if (nextProvider) {
        console.log(`[DnsHealth] Failover: next available provider is ${nextProvider.nickname || nextProvider.name}`);
        this.emit('provider:failover', {
          offlineId: offlineProviderId,
          fallbackProvider: nextProvider,
        });
      } else {
        console.error('[DnsHealth] No available DNS providers for failover!');
        this.emit('provider:nofallback', { offlineId: offlineProviderId });
      }
    } catch (err) {
      console.error('[DnsHealth] Failover handling error:', err.message);
    }
  }

  /**
   * Get the best available (highest priority, ONLINE) provider.
   * Falls back to CHECKING providers if no ONLINE ones exist.
   */
  async getBestProvider() {
    const prisma = getDatabaseClient();

    const provider = await prisma.dnsProvider.findFirst({
      where: { is_active: true, status: 'ONLINE' },
      orderBy: { priority: 'asc' },
    });

    if (provider) return provider;

    // Fall back to any active provider
    return prisma.dnsProvider.findFirst({
      where: { is_active: true },
      orderBy: { priority: 'asc' },
    });
  }

  /**
   * Manually trigger a check for a specific provider.
   */
  async checkProvider(providerId) {
    const prisma = getDatabaseClient();
    const provider = await prisma.dnsProvider.findUnique({ where: { id: providerId } });
    if (!provider) throw new Error('Provider not found');
    return this._checkProvider(provider);
  }

  /**
   * Get current health summary for all providers.
   */
  async getHealthSummary() {
    const prisma = getDatabaseClient();
    const providers = await prisma.dnsProvider.findMany({
      where: { is_active: true },
      select: {
        id: true,
        name: true,
        nickname: true,
        status: true,
        last_check: true,
        response_time: true,
        last_error: true,
        priority: true,
      },
      orderBy: { priority: 'asc' },
    });

    const summary = {
      total: providers.length,
      online: providers.filter((p) => p.status === 'ONLINE').length,
      offline: providers.filter((p) => p.status === 'OFFLINE').length,
      checking: providers.filter((p) => p.status === 'CHECKING').length,
      unknown: providers.filter((p) => p.status === 'UNKNOWN').length,
      providers,
    };

    return summary;
  }
}

module.exports = new DnsHealthService();
