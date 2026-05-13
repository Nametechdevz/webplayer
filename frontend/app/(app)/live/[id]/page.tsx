'use client';

import { use } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Wifi, Star } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useChannel } from '@/hooks/useStreams';
import { useEPG } from '@/hooks/useEPG';
import VideoPlayer from '@/components/player/VideoPlayer';
import Badge from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatEPGTime, getProgressPercent } from '@/lib/utils';

export default function ChannelPlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: channel, isLoading } = useChannel(id);
  const { data: programs } = useEPG(id);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="w-full aspect-video rounded-2xl" />
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-white font-semibold text-xl">Channel not found</p>
        <Link href="/live" className="text-[#6c63ff] hover:underline">
          ← Back to Live TV
        </Link>
      </div>
    );
  }

  const currentProg = channel.currentProgram;
  const progress = currentProg
    ? getProgressPercent(currentProg.startTime, currentProg.endTime)
    : 0;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      {/* Back */}
      <Link href="/live">
        <motion.div
          whileHover={{ x: -2 }}
          className="flex items-center gap-2 text-[#a0a0b0] hover:text-white transition-colors w-fit"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">Back to Live TV</span>
        </motion.div>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Player */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <VideoPlayer
            streamUrl={channel.streamUrl}
            title={channel.name}
            autoPlay
          />

          {/* Channel info */}
          <div className="flex items-center gap-4 p-4 bg-[#16161e] rounded-xl border border-[rgba(255,255,255,0.06)]">
            <div className="w-14 h-14 rounded-xl bg-[rgba(255,255,255,0.04)] flex items-center justify-center overflow-hidden">
              {channel.logo ? (
                <Image src={channel.logo} alt={channel.name} width={48} height={48} className="object-contain" />
              ) : (
                <Wifi size={24} className="text-[#6c63ff]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-white font-bold text-lg">{channel.name}</h1>
                {channel.isHD && <Badge variant="info">HD</Badge>}
                {channel.category && <Badge variant="default">{channel.category}</Badge>}
              </div>
              {currentProg && (
                <div className="mt-1">
                  <p className="text-[#a0a0b0] text-sm">
                    <span className="text-white font-medium">{currentProg.title}</span>
                    {' · '}
                    {formatEPGTime(currentProg.startTime)} – {formatEPGTime(currentProg.endTime)}
                  </p>
                  <div className="mt-2 h-1 rounded-full bg-[rgba(255,255,255,0.1)] overflow-hidden w-48">
                    <div
                      className="h-full bg-gradient-to-r from-[#6c63ff] to-[#ff6b6b] rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* EPG sidebar */}
        <div className="flex flex-col gap-3">
          <h2 className="text-white font-semibold text-lg">Schedule</h2>
          <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto no-scrollbar">
            {programs?.map((prog) => {
              const isNow =
                new Date(prog.startTime) <= new Date() && new Date(prog.endTime) >= new Date();
              return (
                <motion.div
                  key={prog.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`p-3 rounded-xl border transition-all ${
                    isNow
                      ? 'bg-gradient-to-r from-[rgba(108,99,255,0.15)] to-[rgba(255,107,107,0.1)] border-[rgba(108,99,255,0.3)]'
                      : 'bg-[#16161e] border-[rgba(255,255,255,0.06)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium line-clamp-2 ${isNow ? 'text-white' : 'text-[#a0a0b0]'}`}>
                      {prog.title}
                    </p>
                    {isNow && (
                      <span className="flex-shrink-0 flex items-center gap-1 text-[#ff6b6b] text-xs font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#ff6b6b] animate-pulse" />
                        LIVE
                      </span>
                    )}
                  </div>
                  <p className="text-[#a0a0b0] text-xs mt-1">
                    {formatEPGTime(prog.startTime)} – {formatEPGTime(prog.endTime)}
                  </p>
                </motion.div>
              );
            })}
            {!programs?.length && (
              <p className="text-[#a0a0b0] text-sm text-center py-8">No EPG data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
