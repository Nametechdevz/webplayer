'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  Minimize,
  PictureInPicture2,
  Settings,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import { formatTime } from '@/lib/utils';
import { usePlayerStore } from '@/store/playerStore';

interface PlayerControlsProps {
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onSeekRelative: (delta: number) => void;
  onVolumeChange: (v: number) => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onTogglePiP: () => void;
  onQualityChange: (level: number) => void;
  qualities: { id: number; label: string }[];
  title?: string;
}

export default function PlayerControls({
  onTogglePlay,
  onSeek,
  onSeekRelative,
  onVolumeChange,
  onToggleMute,
  onToggleFullscreen,
  onTogglePiP,
  onQualityChange,
  qualities,
  title,
}: PlayerControlsProps) {
  const {
    isPlaying,
    isMuted,
    volume,
    currentTime,
    duration,
    isFullscreen,
    isBuffering,
    quality,
  } = usePlayerStore();

  const [showSettings, setShowSettings] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState(0);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    onSeek(ratio * duration);
  };

  const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    setHoverTime(ratio * duration);
    setHoverX(e.clientX - rect.left);
  };

  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10">
      {/* Gradient overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />

      <div className="relative px-4 pb-4 pt-12 flex flex-col gap-2">
        {/* Title */}
        {title && (
          <p className="text-white font-semibold text-sm mb-1 truncate">{title}</p>
        )}

        {/* Progress bar */}
        <div
          className="relative h-1 group/progress cursor-pointer rounded-full bg-[rgba(255,255,255,0.2)] hover:h-1.5 transition-all"
          onClick={handleProgressClick}
          onMouseMove={handleProgressHover}
          onMouseLeave={() => setHoverTime(null)}
        >
          <div
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#6c63ff] to-[#ff6b6b] rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
          {/* Scrubber */}
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity"
            style={{ left: `${progress}%`, transform: `translateX(-50%) translateY(-50%)` }}
          />
          {/* Hover time tooltip */}
          <AnimatePresence>
            {hoverTime !== null && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-full mb-2 bg-[rgba(0,0,0,0.9)] text-white text-xs px-2 py-1 rounded"
                style={{ left: hoverX, transform: 'translateX(-50%)' }}
              >
                {formatTime(hoverTime)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <button
              onClick={onTogglePlay}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white hover:bg-[rgba(255,255,255,0.1)] transition-colors"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isBuffering ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause size={22} fill="white" />
              ) : (
                <Play size={22} fill="white" />
              )}
            </button>

            {/* Skip */}
            {duration > 0 && (
              <>
                <button
                  onClick={() => onSeekRelative(-10)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-[rgba(255,255,255,0.1)] transition-colors"
                >
                  <SkipBack size={18} />
                </button>
                <button
                  onClick={() => onSeekRelative(10)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-[rgba(255,255,255,0.1)] transition-colors"
                >
                  <SkipForward size={18} />
                </button>
              </>
            )}

            {/* Volume */}
            <div className="flex items-center gap-2 group/vol">
              <button
                onClick={onToggleMute}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-[rgba(255,255,255,0.1)] transition-colors"
              >
                <VolumeIcon size={18} />
              </button>
              <div className="w-0 overflow-hidden group-hover/vol:w-20 transition-all duration-200">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                  className="w-20 h-1 accent-[#6c63ff] cursor-pointer"
                />
              </div>
            </div>

            {/* Time */}
            {duration > 0 && (
              <span className="text-white text-xs font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            )}
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2">
            {/* Quality */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-1 text-white text-xs px-2 py-1 rounded hover:bg-[rgba(255,255,255,0.1)] transition-colors"
              >
                <Settings size={16} />
                <span className="hidden sm:inline">{quality}</span>
              </button>
              <AnimatePresence>
                {showSettings && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full right-0 mb-2 bg-[rgba(17,17,24,0.95)] border border-[rgba(255,255,255,0.1)] rounded-xl p-2 min-w-[120px] shadow-xl"
                  >
                    <p className="text-[#a0a0b0] text-xs px-2 pb-1 font-medium">Quality</p>
                    <button
                      onClick={() => { onQualityChange(-1); setShowSettings(false); }}
                      className="w-full text-left px-2 py-1.5 text-white text-xs rounded hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                    >
                      Auto
                    </button>
                    {qualities.map((q) => (
                      <button
                        key={q.id}
                        onClick={() => { onQualityChange(q.id); setShowSettings(false); }}
                        className="w-full text-left px-2 py-1.5 text-white text-xs rounded hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                      >
                        {q.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* PiP */}
            <button
              onClick={onTogglePiP}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-[rgba(255,255,255,0.1)] transition-colors"
              title="Picture in Picture"
            >
              <PictureInPicture2 size={18} />
            </button>

            {/* Fullscreen */}
            <button
              onClick={onToggleFullscreen}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-[rgba(255,255,255,0.1)] transition-colors"
            >
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
