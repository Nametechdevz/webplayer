'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Radio, XCircle, RefreshCw } from 'lucide-react';
import { adminApi } from '@/lib/api';
import type { StreamInfo } from '@/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { formatRelativeTime } from '@/lib/utils';

export default function AdminStreamsPage() {
  const queryClient = useQueryClient();

  const { data: streams, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-streams'],
    queryFn: async () => {
      const { data } = await adminApi.streams();
      return data as StreamInfo[];
    },
    refetchInterval: 10000,
  });

  const killMutation = useMutation({
    mutationFn: (id: string) => adminApi.killStream(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-streams'] }),
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-2xl">Active Streams</h1>
          <p className="text-[#a0a0b0] text-sm mt-1">
            {streams?.length ?? 0} concurrent streams
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />}
          onClick={() => refetch()}
        >
          Refresh
        </Button>
      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[rgba(255,107,107,0.05)] border border-[rgba(255,107,107,0.2)] rounded-xl w-fit">
        <span className="w-2 h-2 rounded-full bg-[#ff6b6b] animate-pulse" />
        <span className="text-[#ff6b6b] text-sm font-medium">Live — auto-refreshing every 10s</span>
      </div>

      <div className="bg-[#16161e] rounded-2xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.06)]">
                <th className="text-left px-4 py-3 text-[#a0a0b0] text-xs font-medium uppercase">User</th>
                <th className="text-left px-4 py-3 text-[#a0a0b0] text-xs font-medium uppercase">Content</th>
                <th className="text-left px-4 py-3 text-[#a0a0b0] text-xs font-medium uppercase hidden md:table-cell">Type</th>
                <th className="text-left px-4 py-3 text-[#a0a0b0] text-xs font-medium uppercase hidden lg:table-cell">IP</th>
                <th className="text-left px-4 py-3 text-[#a0a0b0] text-xs font-medium uppercase hidden lg:table-cell">Started</th>
                <th className="text-left px-4 py-3 text-[#a0a0b0] text-xs font-medium uppercase hidden xl:table-cell">Bitrate</th>
                <th className="text-right px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} cols={7} />)
                : streams?.map((s, i) => (
                    <motion.tr
                      key={s.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)]"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6c63ff] to-[#ff6b6b] flex items-center justify-center text-white text-xs font-bold">
                            {s.username[0].toUpperCase()}
                          </div>
                          <span className="text-white text-sm font-medium">{s.username}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[#a0a0b0] text-sm truncate max-w-[200px] block">{s.contentTitle}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <Badge
                          variant={s.contentType === 'live' ? 'danger' : s.contentType === 'movie' ? 'purple' : 'info'}
                        >
                          {s.contentType}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-[#a0a0b0] text-xs font-mono">{s.ip || '—'}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-[#a0a0b0] text-sm">{formatRelativeTime(s.startedAt)}</span>
                      </td>
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <span className="text-[#a0a0b0] text-sm">
                          {s.bitrate ? `${s.bitrate} kbps` : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => killMutation.mutate(s.id)}
                          className="flex items-center gap-1 text-[#ff6b6b] hover:text-white text-xs border border-[rgba(255,107,107,0.3)] hover:bg-[rgba(255,107,107,0.1)] px-2 py-1 rounded-lg transition-all ml-auto"
                        >
                          <XCircle size={12} />
                          Kill
                        </button>
                      </td>
                    </motion.tr>
                  ))}
            </tbody>
          </table>

          {!isLoading && !streams?.length && (
            <div className="py-16 text-center">
              <Radio size={32} className="text-[rgba(255,255,255,0.1)] mx-auto mb-3" />
              <p className="text-[#a0a0b0] text-sm">No active streams</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
