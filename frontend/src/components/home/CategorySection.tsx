'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Film, BookOpen, Tv2, Zap, Music, Globe, Sword, Heart, Laugh } from 'lucide-react';

const categories = [
  { name: 'Action', icon: Sword, color: '#ff6b6b', href: '/movies?genre=action' },
  { name: 'Drama', icon: Heart, color: '#6c63ff', href: '/movies?genre=drama' },
  { name: 'Comedy', icon: Laugh, color: '#facc15', href: '/movies?genre=comedy' },
  { name: 'Sci-Fi', icon: Zap, color: '#38bdf8', href: '/movies?genre=sci-fi' },
  { name: 'Music', icon: Music, color: '#a78bfa', href: '/movies?genre=music' },
  { name: 'Documentary', icon: Globe, color: '#34d399', href: '/movies?genre=documentary' },
  { name: 'Movies', icon: Film, color: '#fb923c', href: '/movies' },
  { name: 'Series', icon: BookOpen, color: '#f472b6', href: '/series' },
  { name: 'Live TV', icon: Tv2, color: '#6c63ff', href: '/live' },
];

export default function CategorySection() {
  return (
    <section className="px-4 md:px-8 flex flex-col gap-4">
      <div className="relative">
        <h2 className="text-white font-bold text-lg md:text-xl">Browse by Category</h2>
        <div className="absolute -bottom-1 left-0 h-0.5 w-8 bg-gradient-to-r from-[#6c63ff] to-[#ff6b6b] rounded-full" />
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-9 gap-3">
        {categories.map(({ name, icon: Icon, color, href }, i) => (
          <Link key={name} href={href}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.97 }}
              className="flex flex-col items-center gap-2 p-3 rounded-xl bg-[#16161e] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.15)] cursor-pointer transition-all duration-200 hover:shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${color}10, rgba(22,22,30,0.9))`,
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${color}20`, color }}
              >
                <Icon size={20} />
              </div>
              <span className="text-white text-xs font-medium text-center leading-tight">
                {name}
              </span>
            </motion.div>
          </Link>
        ))}
      </div>
    </section>
  );
}
