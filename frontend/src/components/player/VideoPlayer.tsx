'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';
import { usePlayer } from '@/hooks/usePlayer';
import PlayerControls from './PlayerControls';
import Button from '@/components/ui/Button';

interface VideoPlayerProps {
  streamUrl: string;
  title?: string;
  poster?: string;
  autoPlay?: boolean;
  className?: string;
  onEnded?: () => void;
}

export default function VideoPlayer({
  streamUrl,
  title,
  poster,
  autoPlay = true,
  className = '',
  onEnded,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showControls, setShowControls] = useState(true);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { isPlaying, isBuffering, error, setActiveContent } = usePlayerStore();

  const {
    togglePlay,
    toggleMute,
    changeVolume,
    seek,
    seekRelative,
    toggleFullscreen,
    togglePiP,
    changeQuality,
    getQualities,
  } = usePlayer(videoRef);

  useEffect(() => {
    if (streamUrl) {
      setActiveContent({
        id: 'current',
        type: 'live',
        title: title || 'Stream',
        streamUrl,
      });
    }
  }, [streamUrl, title, setActiveContent]);

  const resetInactivityTimer = useCallback(() => {
    setShowControls(true);
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-video bg-black overflow-hidden rounded-xl ${className}`}
      onMouseMove={resetInactivityTimer}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      onTouchStart={resetInactivityTimer}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        poster={poster}
        autoPlay={autoPlay}
        playsInline
        onEnded={onEnded}
      />

      {/* Buffering indicator */}
      <AnimatePresence>
        {isBuffering && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="w-16 h-16 rounded-full bg-[rgba(0,0,0,0.6)] flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error state */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.8)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center gap-4 text-center p-6">
              <AlertCircle size={48} className="text-[#ff6b6b]" />
              <div>
                <p className="text-white font-semibold text-lg">Stream Error</p>
                <p className="text-[#a0a0b0] text-sm mt-1">{error}</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<RefreshCw size={14} />}
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
            onClick={(e) => e.stopPropagation()}
          >
            <PlayerControls
              onTogglePlay={togglePlay}
              onSeek={seek}
              onSeekRelative={seekRelative}
              onVolumeChange={changeVolume}
              onToggleMute={toggleMute}
              onToggleFullscreen={toggleFullscreen}
              onTogglePiP={togglePiP}
              onQualityChange={changeQuality}
              qualities={getQualities()}
              title={title}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
