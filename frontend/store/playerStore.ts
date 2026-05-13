'use client';

import { create } from 'zustand';
import type { ContentType } from '@/types';

interface ActiveContent {
  id: string;
  type: ContentType;
  title: string;
  poster?: string;
  streamUrl: string;
  episodeInfo?: {
    season: number;
    episode: number;
    episodeTitle: string;
  };
}

interface PlayerStoreState {
  activeContent: ActiveContent | null;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  isFullscreen: boolean;
  isPiP: boolean;
  isMiniPlayer: boolean;
  isBuffering: boolean;
  quality: string;
  error: string | null;
  showControls: boolean;

  setActiveContent: (content: ActiveContent | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsMuted: (muted: boolean) => void;
  setVolume: (volume: number) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setIsFullscreen: (fullscreen: boolean) => void;
  setIsPiP: (pip: boolean) => void;
  setIsMiniPlayer: (mini: boolean) => void;
  setIsBuffering: (buffering: boolean) => void;
  setQuality: (quality: string) => void;
  setError: (error: string | null) => void;
  setShowControls: (show: boolean) => void;
  resetPlayer: () => void;
}

export const usePlayerStore = create<PlayerStoreState>()((set) => ({
  activeContent: null,
  isPlaying: false,
  isMuted: false,
  volume: 1,
  currentTime: 0,
  duration: 0,
  isFullscreen: false,
  isPiP: false,
  isMiniPlayer: false,
  isBuffering: false,
  quality: 'auto',
  error: null,
  showControls: true,

  setActiveContent: (content) => set({ activeContent: content, error: null, currentTime: 0 }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setIsMuted: (isMuted) => set({ isMuted }),
  setVolume: (volume) => set({ volume }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setIsFullscreen: (isFullscreen) => set({ isFullscreen }),
  setIsPiP: (isPiP) => set({ isPiP }),
  setIsMiniPlayer: (isMiniPlayer) => set({ isMiniPlayer }),
  setIsBuffering: (isBuffering) => set({ isBuffering }),
  setQuality: (quality) => set({ quality }),
  setError: (error) => set({ error }),
  setShowControls: (showControls) => set({ showControls }),
  resetPlayer: () =>
    set({
      activeContent: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      isBuffering: false,
      error: null,
      isFullscreen: false,
      isPiP: false,
    }),
}));
