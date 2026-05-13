'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import type { Movie, Series, Channel } from '@/types';
import ContentCard from './ContentCard';
import { RowSkeleton } from '@/components/ui/Skeleton';

type RowItem = Movie | Series | Channel;

interface ContentRowProps {
  title: string;
  items?: RowItem[];
  isLoading?: boolean;
  seeAllHref?: string;
  cardSize?: 'sm' | 'md' | 'lg';
}

export default function ContentRow({
  title,
  items,
  isLoading,
  seeAllHref,
  cardSize = 'md',
}: ContentRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = 400;
    scrollRef.current.scrollBy({
      left: dir === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  if (isLoading) return <RowSkeleton />;
  if (!items?.length) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-4 group"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-8">
        <div className="relative">
          <h2 className="text-white font-bold text-lg md:text-xl">{title}</h2>
          <div className="absolute -bottom-1 left-0 h-0.5 w-8 bg-gradient-to-r from-[#6c63ff] to-[#ff6b6b] rounded-full" />
        </div>
        {seeAllHref && (
          <Link
            href={seeAllHref}
            className="flex items-center gap-1 text-[#6c63ff] hover:text-white text-sm font-medium transition-colors group"
          >
            See All
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </div>

      {/* Scroll area */}
      <div className="relative">
        {/* Left arrow */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-12 rounded-lg bg-[rgba(17,17,24,0.9)] border border-[rgba(255,255,255,0.1)] flex items-center justify-center text-white opacity-0 group-hover:opacity-100 hover:bg-[rgba(108,99,255,0.3)] transition-all shadow-xl"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Right arrow */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-12 rounded-lg bg-[rgba(17,17,24,0.9)] border border-[rgba(255,255,255,0.1)] flex items-center justify-center text-white opacity-0 group-hover:opacity-100 hover:bg-[rgba(108,99,255,0.3)] transition-all shadow-xl"
        >
          <ChevronRight size={18} />
        </button>

        {/* Row */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto no-scrollbar px-4 md:px-8 pb-2"
        >
          {items.map((item) => (
            <ContentCard
              key={item.id}
              item={item}
              size={cardSize}
            />
          ))}
        </div>
      </div>
    </motion.section>
  );
}
