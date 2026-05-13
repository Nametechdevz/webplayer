'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Users,
  Radio,
  Film,
  Tv2,
  BookOpen,
  Wifi,
  Activity,
  TrendingUp,
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import type { AdminStats, StreamInfo } from '@/types';
import StatsWidget from '@/components/admin/StatsWidget';
import Badge from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatNumber, formatRelativeTime } from '@/lib/utils';

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data } = await adminApi.stats();
      return data as AdminStats;
    },
    refetchInterval: 30000,
  });

  const { data: streams, isLoading: streamsLoading } = useQuery({
    queryKey: ['admin-streams-live'],
    queryFn: async () => {
      const { data } = await adminApi.streams();
      return data as StreamInfo[];
    },
    refetchInterval: 10000,
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-white font-bold text-2xl">Dashboard</h1>
        <p className="text-[#a0a0b0] text-sm mt-1">Platform overview & live metrics</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))
        ) : stats ? (
          <>
            <StatsWidget
              title="Total Users"
              value={formatNumber(stats.totalUsers)}
              icon={Users}
              color="#6c63ff"
              change="+12%"
              changeType="up"
            />
            <StatsWidget
              title="Active Now"
              value={formatNumber(stats.activeUsers)}
              icon={Activity}
              color="#4ade80"
              gradient="from-[#4ade80] to-[#22c55e]"
            />
            <StatsWidget
              title="Live Streams"
              value={stats.activeStreams}
              icon={Radio}
              color="#ff6b6b"
              gradient="from-[#ff6b6b] to-[#ff5252]"
            />
            <StatsWidget
              title="Bandwidth"
              value={`${stats.bandwidth} Mbps`}
              icon={TrendingUp}
              color="#38bdf8"
              gradient="from-[#38bdf8] to-[#0ea5e9]"
            />
            <StatsWidget
              title="Channels"
              value={formatNumber(stats.totalChannels)}
              icon={Tv2}
              color="#a78bfa"
              gradient="from-[#a78bfa] to-[#7c3aed]"
            />
            <StatsWidget
              title="Movies"
              value={formatNumber(stats.totalMovies)}
              icon={Film}
              color="#fb923c"
              gradient="from-[#fb923c] to-[#f97316]"
            />
            <StatsWidget
              title="Series"
              value={formatNumber(stats.totalSeries)}
              icon={BookOpen}
              color="#f472b6"
              gradient="from-[#f472b6] to-[#ec4899]"
            />
            <StatsWidget
              title="Uptime"
              value={`${stats.uptime}%`}
              icon={Wifi}
              color={stats.uptime > 99 ? '#4ade80' : stats.uptime > 95 ? '#facc15' : '#ff6b6b'}
              gradient={stats.uptime > 99 ? 'from-[#4ade80] to-[#22c55e]' : 'from-[#facc15] to-[#eab308]'}
            />
          </>
        ) : null}
      </div>

      {/* DNS Status */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#16161e] border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              stats.dnsStatus === 'healthy' ? 'bg-[#4ade80] shadow-[0_0_8px_rgba(74,222,128,0.6)]' :
              stats.dnsStatus === 'degraded' ? 'bg-[#facc15]' : 'bg-[#ff6b6b]'
            } animate-pulse`} />
            <div>
              <p className="text-white font-medium text-sm">DNS Health</p>
              <p className="text-[#a0a0b0] text-xs mt-0.5">All routing providers</p>
            </div>
          </div>
          <Badge
            variant={stats.dnsStatus === 'healthy' ? 'success' : stats.dnsStatus === 'degraded' ? 'warning' : 'danger'}
            size="md"
          >
            {stats.dnsStatus}
          </Badge>
        </motion.div>
      )}

      {/* Live streams */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">Active Streams</h2>
          <span className="text-[#a0a0b0] text-sm">{streams?.length ?? 0} live</span>
        </div>

        <div className="bg-[#16161e] rounded-2xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
          {streamsLoading ? (
            <div className="p-4 flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : streams?.length ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  <th className="text-left px-4 py-3 text-[#a0a0b0] text-xs font-medium uppercase">User</th>
                  <th className="text-left px-4 py-3 text-[#a0a0b0] text-xs font-medium uppercase hidden md:table-cell">Content</th>
                  <th className="text-left px-4 py-3 text-[#a0a0b0] text-xs font-medium uppercase hidden lg:table-cell">Started</th>
                  <th className="text-left px-4 py-3 text-[#a0a0b0] text-xs font-medium uppercase hidden lg:table-cell">Location</th>
                  <th className="text-right px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {streams.map((s) => (
                  <tr key={s.id} className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)]">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6c63ff] to-[#ff6b6b] flex items-center justify-center text-white text-xs font-bold">
                          {s.username[0].toUpperCase()}
                        </div>
                        <span className="text-white text-sm">{s.username}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <Badge variant={s.contentType === 'live' ? 'danger' : s.contentType === 'movie' ? 'purple' : 'info'}>
                          {s.contentType}
                        </Badge>
                        <span className="text-[#a0a0b0] text-sm truncate max-w-[160px]">{s.contentTitle}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-[#a0a0b0] text-sm">{formatRelativeTime(s.startedAt)}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-[#a0a0b0] text-sm">{s.location || '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-[#ff6b6b] hover:text-white text-xs border border-[rgba(255,107,107,0.3)] hover:bg-[rgba(255,107,107,0.1)] px-2 py-1 rounded-lg transition-all">
                        Kill
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 text-center">
              <p className="text-[#a0a0b0] text-sm">No active streams</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
