'use strict';

const { getDatabaseClient } = require('../config/database');
const cache = require('./cacheService');
const config = require('../config');

/**
 * EPG (Electronic Program Guide) service.
 * Handles storing and querying TV program guide data.
 */
class EpgService {
  /**
   * Parse raw EPG data from Xtream API and upsert into the database.
   * @param {string} channelId - EPG channel ID
   * @param {string|null} streamId - Our internal stream UUID
   * @param {Array} programs - Array of program objects from Xtream API
   */
  async upsertPrograms(channelId, streamId, programs) {
    if (!Array.isArray(programs) || programs.length === 0) return 0;

    const prisma = getDatabaseClient();

    const records = programs
      .filter((p) => p.start && p.end)
      .map((p) => ({
        channel_id: channelId,
        stream_id: streamId || null,
        title: p.title || 'Unknown',
        description: p.description || p.desc || null,
        start_time: new Date(parseInt(p.start) * 1000),
        end_time: new Date(parseInt(p.end) * 1000),
        category: p.category || null,
        lang: p.lang || 'en',
        icon: p.img || null,
      }))
      .filter((r) => !isNaN(r.start_time.getTime()) && !isNaN(r.end_time.getTime()));

    if (records.length === 0) return 0;

    // Batch upsert using createMany (skipDuplicates)
    const result = await prisma.epgProgram.createMany({
      data: records,
      skipDuplicates: true,
    });

    // Invalidate cache for this channel
    await cache.del(`epg:${channelId}`);

    return result.count;
  }

  /**
   * Get current + upcoming programs for a channel.
   * @param {string} channelId
   * @param {number} hours - How many hours ahead to fetch (default 4)
   */
  async getNowAndNext(channelId, hours = 4) {
    const cacheKey = `epg:${channelId}:now_next`;
    return cache.getOrSet(
      cacheKey,
      async () => {
        const prisma = getDatabaseClient();
        const now = new Date();
        const future = new Date(now.getTime() + hours * 3600 * 1000);

        const programs = await prisma.epgProgram.findMany({
          where: {
            channel_id: channelId,
            end_time: { gte: now },
            start_time: { lte: future },
          },
          orderBy: { start_time: 'asc' },
          take: 10,
        });

        const current = programs.find((p) => p.start_time <= now && p.end_time >= now) || null;
        const next = programs.find((p) => p.start_time > now) || null;
        const upcoming = programs.filter((p) => p.start_time > now);

        return { current, next, upcoming };
      },
      5 * 60 // 5-minute cache for now/next
    );
  }

  /**
   * Get the full program guide for a channel over a date range.
   */
  async getGuide(channelId, from, to) {
    const prisma = getDatabaseClient();

    const fromDate = from ? new Date(from) : new Date();
    const toDate = to ? new Date(to) : new Date(fromDate.getTime() + 24 * 3600 * 1000);

    return prisma.epgProgram.findMany({
      where: {
        channel_id: channelId,
        start_time: { gte: fromDate },
        end_time: { lte: toDate },
      },
      orderBy: { start_time: 'asc' },
    });
  }

  /**
   * Get EPG for multiple channels at once (bulk).
   */
  async getBulkNowNext(channelIds) {
    if (!channelIds || channelIds.length === 0) return {};

    const prisma = getDatabaseClient();
    const now = new Date();
    const future = new Date(now.getTime() + 4 * 3600 * 1000);

    const programs = await prisma.epgProgram.findMany({
      where: {
        channel_id: { in: channelIds },
        end_time: { gte: now },
        start_time: { lte: future },
      },
      orderBy: { start_time: 'asc' },
    });

    // Group by channel
    const result = {};
    channelIds.forEach((id) => {
      const channelPrograms = programs.filter((p) => p.channel_id === id);
      const current = channelPrograms.find((p) => p.start_time <= now && p.end_time >= now) || null;
      const next = channelPrograms.find((p) => p.start_time > now) || null;
      result[id] = { current, next };
    });

    return result;
  }

  /**
   * Cleanup old EPG programs to keep the DB clean.
   * @param {number} daysOld - Delete programs older than this many days (default 7)
   */
  async cleanup(daysOld = 7) {
    const prisma = getDatabaseClient();
    const cutoff = new Date(Date.now() - daysOld * 24 * 3600 * 1000);

    const result = await prisma.epgProgram.deleteMany({
      where: { end_time: { lt: cutoff } },
    });

    console.log(`[EPG] Cleaned up ${result.count} old programs`);
    return result.count;
  }

  /**
   * Get progress percentage for a currently airing program.
   */
  getProgramProgress(program) {
    if (!program) return 0;
    const now = Date.now();
    const start = new Date(program.start_time).getTime();
    const end = new Date(program.end_time).getTime();
    if (now < start) return 0;
    if (now > end) return 100;
    return Math.round(((now - start) / (end - start)) * 100);
  }
}

module.exports = new EpgService();
