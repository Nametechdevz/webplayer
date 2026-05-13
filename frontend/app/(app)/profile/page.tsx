'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Shield, Calendar, Clock, Edit3, Save, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFavorites, useWatchHistory } from '@/hooks/useStreams';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import ContentCard from '@/components/home/ContentCard';
import { CardSkeleton } from '@/components/ui/Skeleton';
import Input from '@/components/ui/Input';
import type { Movie, Series, Channel, WatchHistoryItem } from '@/types';

export default function ProfilePage() {
  const { user } = useAuth();
  const { data: favorites, isLoading: loadingFavs } = useFavorites();
  const { data: history, isLoading: loadingHistory } = useWatchHistory();
  const [activeTab, setActiveTab] = useState<'favorites' | 'history' | 'settings'>('favorites');
  const [editing, setEditing] = useState(false);

  if (!user) return null;

  const tabs = [
    { id: 'favorites', label: 'Favorites' },
    { id: 'history', label: 'Watch History' },
    { id: 'settings', label: 'Settings' },
  ] as const;

  return (
    <div className="flex flex-col gap-8 py-6 px-4 md:px-8">
      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-[#16161e] rounded-2xl border border-[rgba(255,255,255,0.06)] overflow-hidden"
      >
        {/* Banner */}
        <div className="h-24 bg-gradient-to-r from-[#6c63ff] to-[#ff6b6b] opacity-30" />
        <div className="px-6 pb-6 -mt-10">
          <div className="flex items-end justify-between flex-wrap gap-3">
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#6c63ff] to-[#ff6b6b] flex items-center justify-center text-white text-2xl font-bold border-4 border-[#16161e] shadow-xl">
                {user.username[0].toUpperCase()}
              </div>
              <div className="pb-2">
                <h1 className="text-white font-bold text-xl">{user.username}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={user.role === 'admin' ? 'purple' : 'info'}>{user.role}</Badge>
                  <Badge variant={user.status === 'active' ? 'success' : 'danger'}>{user.status}</Badge>
                </div>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={editing ? <X size={14} /> : <Edit3 size={14} />}
              onClick={() => setEditing(!editing)}
            >
              {editing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {user.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail size={14} className="text-[#6c63ff]" />
                <span className="text-[#a0a0b0]">{user.email}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Shield size={14} className="text-[#6c63ff]" />
              <span className="text-[#a0a0b0]">Max {user.maxConnections} connections</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar size={14} className="text-[#6c63ff]" />
              <span className="text-[#a0a0b0]">Joined {new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
            {user.expiresAt && (
              <div className="flex items-center gap-2 text-sm">
                <Clock size={14} className="text-[#6c63ff]" />
                <span className="text-[#a0a0b0]">Expires {new Date(user.expiresAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[rgba(255,255,255,0.06)] pb-0">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
              activeTab === id
                ? 'text-white border-[#6c63ff]'
                : 'text-[#a0a0b0] border-transparent hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'favorites' && (
          <div className="flex flex-col gap-6">
            {loadingFavs ? (
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-4">
                {Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : favorites ? (
              <>
                {favorites.movies.length > 0 && (
                  <section>
                    <h3 className="text-white font-medium mb-3">Movies ({favorites.movies.length})</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-4">
                      {favorites.movies.map((m) => <ContentCard key={m.id} item={m} size="sm" />)}
                    </div>
                  </section>
                )}
                {favorites.series.length > 0 && (
                  <section>
                    <h3 className="text-white font-medium mb-3">Series ({favorites.series.length})</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-4">
                      {favorites.series.map((s) => <ContentCard key={s.id} item={s} size="sm" />)}
                    </div>
                  </section>
                )}
                {!favorites.movies.length && !favorites.series.length && (
                  <div className="text-center py-12">
                    <span className="text-4xl">❤️</span>
                    <p className="text-white font-medium mt-3">No favorites yet</p>
                    <p className="text-[#a0a0b0] text-sm mt-1">Add content to your list</p>
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="flex flex-col gap-4">
            {loadingHistory ? (
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-4">
                {Array.from({ length: 12 }).map((_, i) => <CardSkeleton key={i} />)}
              </div>
            ) : (history as { items?: WatchHistoryItem[] })?.items?.length ? (
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-4">
                {(history as { items: WatchHistoryItem[] }).items.map((item: WatchHistoryItem) => (
                  <div key={item.contentId} className="relative">
                    <div className="absolute bottom-10 left-0 right-0 h-0.5 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden z-10">
                      <div
                        className="h-full bg-[#6c63ff]"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <span className="text-4xl">📺</span>
                <p className="text-white font-medium mt-3">No watch history</p>
                <p className="text-[#a0a0b0] text-sm mt-1">Start watching something!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="flex flex-col gap-6 max-w-lg">
            <div className="flex flex-col gap-4">
              <Input label="Display Name" defaultValue={user.username} disabled={!editing} />
              <Input label="Email" type="email" defaultValue={user.email || ''} disabled={!editing} />
            </div>
            {editing && (
              <Button leftIcon={<Save size={16} />} className="w-fit">
                Save Changes
              </Button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
