'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Plus, Star, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import type { FeaturedContent } from '@/types';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { truncate } from '@/lib/utils';

interface HeroBannerProps {
  items: FeaturedContent[];
}

export default function HeroBanner({ items }: HeroBannerProps) {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const goTo = useCallback(
    (index: number) => {
      setCurrent((index + items.length) % items.length);
    },
    [items.length]
  );

  useEffect(() => {
    if (isPaused || items.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % items.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [isPaused, items.length]);

  if (!items.length) return null;

  const item = items[current];

  const handleWatch = () => {
    const type = item.type;
    if (type === 'movie') router.push(`/movies/${item.id}`);
    else if (type === 'series') router.push(`/series/${item.id}`);
    else router.push(`/live/${item.id}`);
  };

  return (
    <div
      className="relative w-full h-[90vh] overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background */}
      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          {item.backdrop ? (
            <Image
              src={item.backdrop}
              alt={item.title}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] to-[#0a0a0f]" />
          )}
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f] via-[rgba(10,10,15,0.5)] to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-[rgba(10,10,15,0.3)]" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end pb-32 px-8 md:px-16 max-w-3xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={item.id + 'content'}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col gap-4"
          >
            {/* Type badge */}
            <div className="flex items-center gap-2">
              <Badge variant="purple">
                {item.type === 'live' ? 'LIVE' : item.type.toUpperCase()}
              </Badge>
              {item.tags?.map((tag) => (
                <Badge key={tag} variant="default">{tag}</Badge>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight tracking-tight">
              {item.title}
            </h1>

            {/* Meta */}
            <div className="flex items-center gap-4 text-sm text-[#a0a0b0]">
              {item.rating !== undefined && (
                <span className="flex items-center gap-1 text-[#facc15]">
                  <Star size={14} fill="currentColor" />
                  {item.rating.toFixed(1)}
                </span>
              )}
              {item.year && <span>{item.year}</span>}
              {item.genres?.slice(0, 3).map((g) => (
                <span
                  key={g}
                  className="px-2 py-0.5 rounded-full bg-[rgba(255,255,255,0.08)] text-xs"
                >
                  {g}
                </span>
              ))}
            </div>

            {/* Description */}
            <p className="text-[#a0a0b0] text-base leading-relaxed max-w-xl hidden md:block">
              {truncate(item.description || '', 200)}
            </p>

            {/* Buttons */}
            <div className="flex items-center gap-3 mt-2">
              <Button
                size="lg"
                onClick={handleWatch}
                leftIcon={<Play size={18} fill="white" />}
                className="shadow-[0_0_30px_rgba(108,99,255,0.4)]"
              >
                Watch Now
              </Button>
              <Button
                variant="glass"
                size="lg"
                leftIcon={<Plus size={18} />}
              >
                My List
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="hidden md:flex"
                leftIcon={<Info size={18} />}
              >
                More Info
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation arrows */}
      {items.length > 1 && (
        <>
          <button
            onClick={() => goTo(current - 1)}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full glass flex items-center justify-center text-white hover:bg-[rgba(255,255,255,0.1)] transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => goTo(current + 1)}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full glass flex items-center justify-center text-white hover:bg-[rgba(255,255,255,0.1)] transition-all"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Progress dots */}
      {items.length > 1 && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="transition-all duration-300"
            >
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === current
                    ? 'w-8 bg-gradient-to-r from-[#6c63ff] to-[#ff6b6b]'
                    : 'w-1.5 bg-[rgba(255,255,255,0.3)]'
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
