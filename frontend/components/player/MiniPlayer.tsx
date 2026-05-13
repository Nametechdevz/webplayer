'use client';

import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, Maximize2 } from 'lucide-react';
import Link from 'next/link';
import { usePlayerStore } from '@/store/playerStore';

export default function MiniPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { activeContent, isMiniPlayer, isPlaying, setIsMiniPlayer, resetPlayer } =
    usePlayerStore();

  if (!activeContent || !isMiniPlayer) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        drag
        dragMomentum={false}
        className="fixed bottom-20 md:bottom-6 right-6 z-50 w-72 rounded-2xl overflow-hidden bg-[#111118] border border-[rgba(255,255,255,0.1)] shadow-2xl cursor-move"
      >
        {/* Video preview */}
        <div className="relative aspect-video bg-black">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] to-black flex items-center justify-center">
            <Play size={32} className="text-[rgba(255,255,255,0.3)]" />
          </div>
          {/* Controls overlay */}
          <div className="absolute inset-0 flex items-center justify-center gap-3">
            <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex flex-col min-w-0">
            <p className="text-white text-xs font-medium truncate">{activeContent.title}</p>
            {activeContent.episodeInfo && (
              <p className="text-[#a0a0b0] text-[10px]">
                S{activeContent.episodeInfo.season} E{activeContent.episodeInfo.episode}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Link
              href={
                activeContent.type === 'live'
                  ? `/live/${activeContent.id}`
                  : activeContent.type === 'movie'
                  ? `/movies/${activeContent.id}`
                  : `/series/${activeContent.id}`
              }
              onClick={() => setIsMiniPlayer(false)}
            >
              <button className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-[#a0a0b0] hover:text-white transition-colors">
                <Maximize2 size={14} />
              </button>
            </Link>
            <button
              onClick={resetPlayer}
              className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-[#a0a0b0] hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
