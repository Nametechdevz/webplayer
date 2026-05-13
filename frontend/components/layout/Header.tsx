'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Bell, ChevronDown, User, Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function Header() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <header className="fixed top-0 right-0 left-0 z-20 h-16 bg-[rgba(10,10,15,0.8)] backdrop-blur-[20px] border-b border-[rgba(255,255,255,0.06)]">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center gap-2 text-[#a0a0b0] text-sm">
          {/* Breadcrumb or title can go here */}
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <AnimatePresence>
            {searchOpen ? (
              <motion.form
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 300, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                onSubmit={handleSearch}
                className="overflow-hidden"
              >
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={() => {
                    if (!searchQuery) setSearchOpen(false);
                  }}
                  placeholder="Search movies, series, channels..."
                  className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-2 text-white text-sm placeholder-[#a0a0b0] focus:outline-none focus:border-[#6c63ff] transition-all"
                />
              </motion.form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="w-9 h-9 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] flex items-center justify-center text-[#a0a0b0] hover:text-white hover:border-[rgba(108,99,255,0.4)] transition-all"
              >
                <Search size={18} />
              </button>
            )}
          </AnimatePresence>

          {/* Notifications */}
          <button className="w-9 h-9 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] flex items-center justify-center text-[#a0a0b0] hover:text-white hover:border-[rgba(108,99,255,0.4)] transition-all relative">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ff6b6b] rounded-full" />
          </button>

          {/* Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-[rgba(255,255,255,0.05)] transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6c63ff] to-[#ff6b6b] flex items-center justify-center text-white text-sm font-bold">
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="text-white text-sm font-medium hidden md:block">
                {user?.username || 'User'}
              </span>
              <ChevronDown size={14} className={`text-[#a0a0b0] transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-52 bg-[#16161e] border border-[rgba(255,255,255,0.1)] rounded-xl shadow-2xl overflow-hidden z-50"
                  onMouseLeave={() => setProfileOpen(false)}
                >
                  <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.06)]">
                    <p className="text-white font-medium text-sm">{user?.username}</p>
                    <p className="text-[#a0a0b0] text-xs mt-0.5">{user?.email || user?.role}</p>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-4 py-2.5 text-[#a0a0b0] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors text-sm"
                      onClick={() => setProfileOpen(false)}
                    >
                      <User size={16} /> Profile
                    </Link>
                    {user?.role === 'admin' && (
                      <Link
                        href="/admin"
                        className="flex items-center gap-3 px-4 py-2.5 text-[#a0a0b0] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-colors text-sm"
                        onClick={() => setProfileOpen(false)}
                      >
                        <Settings size={16} /> Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={() => { setProfileOpen(false); logout(); }}
                      className="flex items-center gap-3 px-4 py-2.5 text-[#ff6b6b] hover:bg-[rgba(255,107,107,0.05)] transition-colors w-full text-left text-sm"
                    >
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}
