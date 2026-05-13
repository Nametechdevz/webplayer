'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Play, Wifi } from 'lucide-react';
import type { Channel } from '@/types';
import { getProgressPercent, truncate } from '@/lib/utils';
import Badge from '@/components/ui/Badge';

interface ChannelCardProps {
  channel: Channel;
}

export default function ChannelCard({ channel }: ChannelCardProps) {
  const prog = channel.currentProgram;
  const progress = prog
    ? getProgressPercent(prog.startTime, prog.endTime)
    : 0;

  return (
    <Link href={`/live/${channel.id}`}>
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="bg-[#16161e] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(108,99,255,0.3)] rounded-xl p-4 flex flex-col gap-3 cursor-pointer transition-all duration-200 hover:shadow-[0_4px_20px_rgba(108,99,255,0.1)] group"
      >
        {/* Header: logo + name + live */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center overflow-hidden flex-shrink-0">
            {channel.logo ? (
              <Image
                src={channel.logo}
                alt={channel.name}
                width={40}
                height={40}
                className="object-contain"
              />
            ) : (
              <Wifi size={20} className="text-[#6c63ff]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm truncate">{channel.name}</p>
            {channel.number && (
              <p className="text-[#a0a0b0] text-xs">CH {channel.number}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            {channel.isHD && <Badge variant="info" size="sm">HD</Badge>}
          </div>
        </div>

        {/* Current program */}
        {prog ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#ff6b6b] animate-pulse" />
              <span className="text-[#a0a0b0] text-xs">NOW PLAYING</span>
            </div>
            <p className="text-white text-xs font-medium truncate">{prog.title}</p>
            {/* Progress bar */}
            <div className="h-1 rounded-full bg-[rgba(255,255,255,0.1)] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
                className="h-full bg-gradient-to-r from-[#6c63ff] to-[#ff6b6b] rounded-full"
              />
            </div>
          </div>
        ) : (
          <p className="text-[#a0a0b0] text-xs">No EPG available</p>
        )}

        {/* Play hover overlay */}
        <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-2 text-[#6c63ff] text-xs font-medium">
            <Play size={14} fill="currentColor" />
            Watch Live
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
