'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Globe,
  Users,
  Radio,
  ArrowLeft,
  Shield,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'DNS Manager', href: '/admin/dns', icon: Globe },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Streams', href: '/admin/streams', icon: Radio },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();

  const isAdmin = ['SUPER_ADMIN', 'ADMIN', 'admin', 'super_admin'].includes(user?.role || '');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    } else if (user && !isAdmin) {
      router.push('/home');
    }
  }, [isAuthenticated, user, isAdmin, router]);

  if (!isAuthenticated || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      {/* Admin sidebar */}
      <aside className="w-60 flex-shrink-0 bg-[#111118] border-r border-[rgba(255,255,255,0.06)] flex flex-col">
        <div className="p-4 border-b border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6c63ff] to-[#ff6b6b] flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Admin Panel</p>
              <p className="text-[#a0a0b0] text-xs">StreamVault</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-2">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}>
                <motion.div
                  whileHover={{ x: 2 }}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-all',
                    active
                      ? 'bg-gradient-to-r from-[rgba(108,99,255,0.2)] to-[rgba(255,107,107,0.1)] text-white border border-[rgba(108,99,255,0.3)]'
                      : 'text-[#a0a0b0] hover:text-white hover:bg-[rgba(255,255,255,0.04)]'
                  )}
                >
                  <Icon size={18} className={active ? 'text-[#6c63ff]' : ''} />
                  <span className="text-sm font-medium">{label}</span>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        <div className="p-2 border-t border-[rgba(255,255,255,0.06)]">
          <Link href="/home">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#a0a0b0] hover:text-white hover:bg-[rgba(255,255,255,0.04)] transition-all">
              <ArrowLeft size={18} />
              <span className="text-sm font-medium">Back to App</span>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 md:p-8">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
