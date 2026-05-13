'use client';

import { motion } from 'framer-motion';
import type { Channel } from '@/types';
import ChannelCard from './ChannelCard';
import { ChannelCardSkeleton } from '@/components/ui/Skeleton';

interface ChannelGridProps {
  channels: Channel[];
  isLoading?: boolean;
}

export default function ChannelGrid({ channels, isLoading }: ChannelGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4 md:px-8">
        {Array.from({ length: 12 }).map((_, i) => (
          <ChannelCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!channels.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-[rgba(255,255,255,0.04)] flex items-center justify-center mb-4">
          <span className="text-3xl">📺</span>
        </div>
        <p className="text-white font-semibold">No channels found</p>
        <p className="text-[#a0a0b0] text-sm mt-1">Try a different category</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4 md:px-8">
      {channels.map((channel, i) => (
        <motion.div
          key={channel.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04, duration: 0.3 }}
        >
          <ChannelCard channel={channel} />
        </motion.div>
      ))}
    </div>
  );
}
