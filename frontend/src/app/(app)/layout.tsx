'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import MobileNav from '@/components/layout/MobileNav';
import MiniPlayer from '@/components/player/MiniPlayer';
import { FullscreenSpinner } from '@/components/ui/Spinner';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();
  const { sidebarCollapsed } = useUIStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) return <FullscreenSpinner />;
  if (!isAuthenticated) return null;

  return (
    <div className="flex min-h-screen bg-[#0a0a0f]">
      {/* Sidebar - desktop only */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main content */}
      <motion.main
        animate={{
          marginLeft: sidebarCollapsed ? 72 : 240,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="flex-1 flex flex-col min-h-screen md:ml-0"
        style={{ minWidth: 0 }}
      >
        {/* Top header */}
        <div className="hidden md:block">
          <Header />
        </div>

        {/* Page content */}
        <div className="flex-1 pt-0 md:pt-16 pb-20 md:pb-0">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.main>

      {/* Mobile bottom nav */}
      <MobileNav />

      {/* Mini player (PiP fallback) */}
      <MiniPlayer />
    </div>
  );
}
