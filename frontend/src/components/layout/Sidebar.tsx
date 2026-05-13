'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Tv2,
  Film,
  BookOpen,
  Search,
  Heart,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Radio,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';

const navItems = [
  { label: 'Home', href: '/home', icon: Home },
  { label: 'Live TV', href: '/live', icon: Tv2 },
  { label: 'Movies', href: '/movies', icon: Film },
  { label: 'Series', href: '/series', icon: BookOpen },
  { label: 'Search', href: '/search', icon: Search },
  { label: 'Favorites', href: '/profile', icon: Heart },
  { label: 'Profile', href: '/profile', icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { user, logout } = useAuthStore();

  const isActive = (href: string) =>
    pathname === href || (href !== '/home' && pathname.startsWith(href));

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 72 : 240 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed left-0 top-0 h-full z-30 flex flex-col bg-[#111118] border-r border-[rgba(255,255,255,0.06)] overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[rgba(255,255,255,0.06)]">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-[#6c63ff] to-[#ff6b6b] flex items-center justify-center">
          <Radio size={16} className="text-white" />
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="text-white font-bold text-lg whitespace-nowrap"
            >
              Stream<span className="gradient-text">Vault</span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto no-scrollbar">
        <ul className="flex flex-col gap-1 px-2">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <li key={href + label}>
                <Link href={href}>
                  <motion.div
                    whileHover={{ x: 2 }}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer',
                      active
                        ? 'bg-gradient-to-r from-[rgba(108,99,255,0.2)] to-[rgba(255,107,107,0.1)] text-white border border-[rgba(108,99,255,0.3)]'
                        : 'text-[#a0a0b0] hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
                    )}
                  >
                    <div className="flex-shrink-0 relative">
                      <Icon
                        size={20}
                        className={active ? 'text-[#6c63ff]' : ''}
                      />
                      {active && (
                        <motion.div
                          layoutId="activeNav"
                          className="absolute -right-1 -top-1 w-2 h-2 bg-[#6c63ff] rounded-full"
                        />
                      )}
                    </div>
                    <AnimatePresence>
                      {!sidebarCollapsed && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-sm font-medium whitespace-nowrap"
                        >
                          {label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User & Actions */}
      <div className="border-t border-[rgba(255,255,255,0.06)] px-2 py-3 flex flex-col gap-1">
        {['SUPER_ADMIN', 'ADMIN', 'admin', 'super_admin'].includes(user?.role || '') && (
          <Link href="/admin">
            <div className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer text-[#a0a0b0] hover:text-white hover:bg-[rgba(255,255,255,0.05)]'
            )}>
              <Settings size={20} />
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm font-medium whitespace-nowrap"
                  >
                    Admin
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </Link>
        )}

        <button
          onClick={() => logout()}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-[#a0a0b0] hover:text-[#ff6b6b] hover:bg-[rgba(255,107,107,0.05)] w-full text-left"
        >
          <LogOut size={20} />
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm font-medium whitespace-nowrap"
              >
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className="flex items-center justify-center w-full h-8 rounded-xl text-[#a0a0b0] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-all duration-200 mt-1"
        >
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
    </motion.aside>
  );
}
