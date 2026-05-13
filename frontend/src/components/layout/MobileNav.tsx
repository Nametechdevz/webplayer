'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Tv2, Film, Search, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const items = [
  { label: 'Home', href: '/home', icon: Home },
  { label: 'Live', href: '/live', icon: Tv2 },
  { label: 'Movies', href: '/movies', icon: Film },
  { label: 'Search', href: '/search', icon: Search },
  { label: 'Profile', href: '/profile', icon: User },
];

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-[rgba(17,17,24,0.95)] backdrop-blur-[20px] border-t border-[rgba(255,255,255,0.06)]">
      <div className="flex items-center justify-around px-2 py-2">
        {items.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || (href !== '/home' && pathname.startsWith(href));
          return (
            <Link key={href} href={href}>
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center gap-1 px-3 py-1"
              >
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200',
                  active
                    ? 'bg-gradient-to-r from-[rgba(108,99,255,0.2)] to-[rgba(255,107,107,0.1)] text-[#6c63ff]'
                    : 'text-[#a0a0b0]'
                )}>
                  <Icon size={22} />
                </div>
                <span className={cn(
                  'text-[10px] font-medium transition-colors',
                  active ? 'text-[#6c63ff]' : 'text-[#a0a0b0]'
                )}>
                  {label}
                </span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
