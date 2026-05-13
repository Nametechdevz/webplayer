'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Wifi,
  Edit3,
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import type { DnsProvider } from '@/types';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { TableRowSkeleton } from '@/components/ui/Skeleton';

export default function DnsManager() {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: '', url: '', type: 'primary' as DnsProvider['type'] });

  const { data: providers, isLoading } = useQuery({
    queryKey: ['admin-dns'],
    queryFn: async () => {
      const { data } = await adminApi.dns();
      return data as DnsProvider[];
    },
  });

  const testMutation = useMutation({
    mutationFn: (id: string) => adminApi.testDns(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-dns'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteDns(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-dns'] }),
  });

  const syncMutation = useMutation({
    mutationFn: () => adminApi.syncDns(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-dns'] }),
  });

  const addMutation = useMutation({
    mutationFn: (data: typeof form) => adminApi.addDns(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-dns'] });
      setAddOpen(false);
      setForm({ name: '', url: '', type: 'primary' });
    },
  });

  const statusIcon = (status: DnsProvider['status']) => {
    if (status === 'online') return <CheckCircle size={16} className="text-[#4ade80]" />;
    if (status === 'offline') return <XCircle size={16} className="text-[#ff6b6b]" />;
    return <AlertCircle size={16} className="text-[#facc15]" />;
  };

  const statusBadge = (status: DnsProvider['status']) => {
    const v = status === 'online' ? 'success' : status === 'offline' ? 'danger' : 'warning';
    return <Badge variant={v}>{status}</Badge>;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-xl">DNS Providers</h2>
          <p className="text-[#a0a0b0] text-sm mt-1">Manage your DNS routing providers</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<RefreshCw size={14} className={syncMutation.isPending ? 'animate-spin' : ''} />}
            onClick={() => syncMutation.mutate()}
            isLoading={syncMutation.isPending}
          >
            Sync All
          </Button>
          <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setAddOpen(true)}>
            Add Provider
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#16161e] rounded-2xl border border-[rgba(255,255,255,0.06)] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.06)]">
              <th className="text-left px-4 py-3 text-[#a0a0b0] text-xs font-medium uppercase tracking-wider">Name</th>
              <th className="text-left px-4 py-3 text-[#a0a0b0] text-xs font-medium uppercase tracking-wider hidden md:table-cell">URL</th>
              <th className="text-left px-4 py-3 text-[#a0a0b0] text-xs font-medium uppercase tracking-wider">Type</th>
              <th className="text-left px-4 py-3 text-[#a0a0b0] text-xs font-medium uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-[#a0a0b0] text-xs font-medium uppercase tracking-wider hidden sm:table-cell">Latency</th>
              <th className="text-right px-4 py-3 text-[#a0a0b0] text-xs font-medium uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)
              : providers?.map((p) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[rgba(108,99,255,0.1)] flex items-center justify-center">
                          <Wifi size={14} className="text-[#6c63ff]" />
                        </div>
                        <span className="text-white text-sm font-medium">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-[#a0a0b0] text-xs font-mono truncate max-w-[200px] block">{p.url}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={p.type === 'primary' ? 'purple' : p.type === 'cdn' ? 'info' : 'default'}
                      >
                        {p.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {statusIcon(p.status)}
                        {statusBadge(p.status)}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-[#a0a0b0] text-sm">
                        {p.latency !== undefined ? `${p.latency}ms` : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => testMutation.mutate(p.id)}
                          className="p-1.5 rounded-lg text-[#a0a0b0] hover:text-[#6c63ff] hover:bg-[rgba(108,99,255,0.1)] transition-colors"
                          title="Test"
                        >
                          <RefreshCw size={14} className={testMutation.isPending ? 'animate-spin' : ''} />
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(p.id)}
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

      {/* Add modal */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add DNS Provider">
        <div className="flex flex-col gap-4">
          <Input
            label="Name"
            placeholder="My DNS Provider"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="URL"
            placeholder="https://dns.example.com"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#a0a0b0]">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as DnsProvider['type'] })}
              className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-[#6c63ff]"
            >
              <option value="primary">Primary</option>
              <option value="backup">Backup</option>
              <option value="cdn">CDN</option>
            </select>
          </div>
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              isLoading={addMutation.isPending}
              onClick={() => addMutation.mutate(form)}
            >
              Add Provider
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
