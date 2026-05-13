'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Plus, Star, Clock } from 'lucide-react';
import type { Movie, Series, Channel } from '@/types';
import Badge from '@/components/ui/Badge';
import { formatDuration } from '@/lib/utils';

type CardItem = Movie | Series | Channel;

interface ContentCardProps {
  item: CardItem;
  size?: 'sm' | 'md' | 'lg';
}

function getHref(item: CardItem): string {
  if ('streamUrl' in item && 'logo' in item) return `/live/${item.id}`;
  if ('type' in item && item.type === 'movie') return `/movies/${item.id}`;
  if ('type' in item && item.type === 'series') return `/series/${item.id}`;
  return `/movies/${item.id}`;
}

function getPoster(item: CardItem): string | undefined {
  if ('poster' in item) return item.poster;
  if ('logo' in item) return (item as Channel).logo;
  return undefined;
}

export default function ContentCard({ item, size = 'md' }: ContentCardProps) {
  const [hovered, setHovered] = useState(false);
  const href = getHref(item);
  const poster = getPoster(item);

  const isChannel = 'streamUrl' in item && 'logo' in item;
  const movie = !isChannel && 'type' in item && (item as Movie).type === 'movie' ? item as Movie : null;
  const series = !isChannel && 'type' in item && (item as Series).type === 'series' ? item as Series : null;

  const sizeClasses = {
    sm: 'w-32',
    md: 'w-44',
    lg: 'w-56',
  };

  return (
    <Link href={href}>
      <motion.div
        className={`relative flex-shrink-0 ${sizeClasses[size]} cursor-pointer`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        whileHover={{ scale: 1.05, zIndex: 10 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        {/* Poster */}
        <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-[#16161e] ring-1 ring-[rgba(255,255,255,0.06)]">
          {poster ? (
            <Image
              src={poster}
              alt={item.name || item.title || ''}
              fill
              className="object-cover transition-transform duration-500"
              sizes="(max-width: 768px) 128px, 176px"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] to-[#16161e] flex items-center justify-center">
              <Play size={32} className="text-[rgba(255,255,255,0.2)]" />
            </div>
          )}

          {/* Hover overlay */}
          <AnimatePresence>
            {hovered && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.9)] via-[rgba(0,0,0,0.4)] to-transparent flex flex-col justify-between p-3"
              >
                {/* Play button */}
                <div className="flex justify-end">
                  <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-8 h-8 rounded-full bg-[rgba(255,255,255,0.1)] border border-[rgba(255,255,255,0.2)] flex items-center justify-center text-white hover:bg-[rgba(108,99,255,0.5)] transition-colors"
                    onClick={(e) => e.preventDefault()}
                  >
                    <Plus size={14} />
                  </motion.button>
                </div>

                {/* Bottom info */}
                <div className="flex flex-col gap-1">
                  <motion.button
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.05 }}
                    className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black hover:bg-[#6c63ff] hover:text-white transition-colors mb-1"
                    onClick={(e) => e.preventDefault()}
                  >
                    <Play size={14} fill="currentColor" />
                  </motion.button>

                  {'rating' in item && item.rating !== undefined && (
                    <div className="flex items-center gap-1 text-[#facc15] text-xs">
                      <Star size={10} fill="currentColor" />
                      <span>{(item as Movie).rating!.toFixed(1)}</span>
                    </div>
                  )}

                  {movie?.duration && (
                    <div className="flex items-center gap-1 text-[#a0a0b0] text-xs">
                      <Clock size={10} />
                      <span>{formatDuration(movie.duration)}</span>
                    </div>
                  )}

                  {series?.totalSeasons && (
                    <span className="text-[#a0a0b0] text-xs">
                      {series.totalSeasons} Season{series.totalSeasons > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quality badge */}
          {movie?.quality && (
            <div className="absolute top-2 left-2">
              <Badge variant="purple" size="sm">{movie.quality}</Badge>
            </div>
          )}

          {/* HD badge for channels */}
          {isChannel && (item as Channel).isHD && (
            <div className="absolute top-2 left-2">
              <Badge variant="info" size="sm">HD</Badge>
            </div>
          )}
        </div>

        {/* Title */}
        <div className="mt-2 px-0.5">
          <p className="text-white text-xs font-medium line-clamp-2 leading-tight">
            {(item as { title?: string; name?: string }).title || (item as { name?: string }).name}
          </p>
          {'year' in item && item.year && (
            <p className="text-[#a0a0b0] text-xs mt-0.5">{item.year}</p>
          )}
        </div>
      </motion.div>
    </Link>
  );
}
