'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, Ban, CheckCircle, Trash2, UserPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import { adminApi } from '@/lib/api';
import type { User } from '@/types';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { formatRelativeTime } from '@/lib/utils';

export default function UserManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, search],
    queryFn: async () => {
      const { data } = await adminApi.users({ page, search: search || undefined });
      return data as { data: User[]; total: number };
    },
  });

  const banMutation = useMutation({
    mutationFn: (id: string) => adminApi.banUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const unbanMutation = useMutation({
    mutationFn: (id: string) => adminApi.unbanUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const totalPages = data ? Math.ceil(data.total / pageSize) : 1;

  const roleBadge = (role: User['role']) => {
    const v = role === 'admin' ? 'purple' : role === 'user' ? 'info' : 'default';
    return <Badge variant={v}>{role}</Badge>;
  };

  const statusBadge = (status: User['status']) => {
    const v = status === 'active' ? 'success' : status === 'banned' ? 'danger' : 'warning';
    return <Badge variant={v}>{status}</Badge>;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-white font-bold text-xl">Users</h2>
          <p className="text-[#a0a0b0] text-sm mt-1">
            {data?.total ?? 0} total users
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-64">
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              leftIcon={<Search size={16} />}
            />
          </div>
          <Button size="sm" leftIcon={<UserPlus size={14} />}>
            Add User
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#16161e] rounded-2xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.06)]">
                <th className="text-left px-4 py-3 text-[#a0a0b0] text-xs font-medium uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 text-[#a0a0b0] text-xs font-medium uppercase tracking-wider">Role</th>
                <th className="text-left px-4 py-3 text-[#a0a0b0] text-xs font-medium uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-[#a0a0b0] text-xs font-medium uppercase tracking-wider hidden md:table-cell">Joined</th>
                <th className="text-left px-4 py-3 text-[#a0a0b0] text-xs font-medium uppercase tracking-wider hidden lg:table-cell">Expires</th>
                <th className="text-right px-4 py-3 text-[#a0a0b0] text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: pageSize }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)
                : data?.data.map((user) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6c63ff] to-[#ff6b6b] flex items-center justify-center text-white text-xs font-bold">
                            {user.username[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-white text-sm font-medium">{user.username}</p>
                            {user.email && (
                              <p className="text-[#a0a0b0] text-xs">{user.email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{roleBadge(user.role)}</td>
                      <td className="px-4 py-3">{statusBadge(user.status)}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-[#a0a0b0] text-sm">{formatRelativeTime(user.createdAt)}</span>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-[#a0a0b0] text-sm">
                          {user.expiresAt ? formatRelativeTime(user.expiresAt) : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {user.status === 'banned' ? (
                            <button
                              onClick={() => unbanMutation.mutate(user.id)}
                              className="p-1.5 rounded-lg text-[#a0a0b0] hover:text-[#4ade80] hover:bg-[rgba(34,197,94,0.1)] transition-colors"
                              title="Unban"
                            >
                              <CheckCircle size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={() => banMutation.mutate(user.id)}
                              className="p-1.5 rounded-lg text-[#a0a0b0] hover:text-[#facc15] hover:bg-[rgba(234,179,8,0.1)] transition-colors"
                              title="Ban"
                            >
                              <Ban size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => deleteMutation.mutate(user.id)}
                            className="p-1.5 rounded-lg text-[#a0a0b0] hover:text-[#ff6b6b] hover:bg-[rgba(255,107,107,0.1)] transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[rgba(255,255,255,0.06)]">
            <span className="text-[#a0a0b0] text-sm">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                leftIcon={<ChevronLeft size={14} />}
              >
                Prev
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                rightIcon={<ChevronRight size={14} />}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
