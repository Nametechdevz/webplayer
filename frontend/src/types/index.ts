// ─── Auth ────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  username: string;
  email?: string;
  role: 'admin' | 'user' | 'guest';
  status: 'active' | 'banned' | 'expired';
  expiresAt?: string;
  maxConnections: number;
  createdAt: string;
  avatar?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface ActivationCredentials {
  code: string;
}

// ─── Content ─────────────────────────────────────────────────────────────────
export type ContentType = 'movie' | 'series' | 'live';

export interface BaseContent {
  id: string;
  title: string;
  poster?: string;
  backdrop?: string;
  rating?: number;
  year?: number;
  genres?: string[];
  description?: string;
  addedAt?: string;
}

export interface Movie extends BaseContent {
  type: 'movie';
  duration?: number;
  streamUrl?: string;
  trailerUrl?: string;
  director?: string;
  cast?: string[];
  language?: string;
  quality?: '4K' | '1080p' | '720p' | '480p';
}

export interface Series extends BaseContent {
  type: 'series';
  seasons?: Season[];
  totalSeasons?: number;
  totalEpisodes?: number;
  status?: 'ongoing' | 'completed' | 'cancelled';
}

export interface Season {
  id: string;
  number: number;
  title?: string;
  episodes: Episode[];
}

export interface Episode {
  id: string;
  seriesId: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  description?: string;
  duration?: number;
  thumbnail?: string;
  streamUrl?: string;
  airDate?: string;
}

// ─── Live TV ─────────────────────────────────────────────────────────────────
export interface Channel {
  id: string;
  name: string;
  logo?: string;
  streamUrl: string;
  category?: string;
  number?: number;
  currentProgram?: EPGProgram;
  nextProgram?: EPGProgram;
  isFavorite?: boolean;
  isHD?: boolean;
}

export interface EPGProgram {
  id: string;
  channelId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  category?: string;
  thumbnail?: string;
  rating?: string;
}

export interface ChannelCategory {
  id: string;
  name: string;
  count: number;
}

// ─── Player ──────────────────────────────────────────────────────────────────
export interface PlayerState {
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  currentTime: number;
  duration: number;
  isFullscreen: boolean;
  isPiP: boolean;
  quality: VideoQuality;
  availableQualities: VideoQuality[];
  selectedAudioTrack: number;
  selectedSubtitleTrack: number;
  isBuffering: boolean;
  error?: string;
}

export interface VideoQuality {
  id: number;
  label: string;
  height?: number;
  bitrate?: number;
}

export interface AudioTrack {
  id: number;
  name: string;
  lang?: string;
}

export interface SubtitleTrack {
  id: number;
  name: string;
  lang?: string;
}

// ─── Admin ───────────────────────────────────────────────────────────────────
export interface DnsProvider {
  id: string;
  name: string;
  url: string;
  type: 'primary' | 'backup' | 'cdn';
  status: 'online' | 'offline' | 'degraded';
  latency?: number;
  lastChecked?: string;
  isActive: boolean;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  activeStreams: number;
  totalChannels: number;
  totalMovies: number;
  totalSeries: number;
  bandwidth: number;
  uptime: number;
  dnsStatus: 'healthy' | 'degraded' | 'down';
}

export interface StreamInfo {
  id: string;
  userId: string;
  username: string;
  contentId: string;
  contentTitle: string;
  contentType: ContentType;
  startedAt: string;
  bitrate?: number;
  ip?: string;
  location?: string;
}

// ─── API Responses ───────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
}

// ─── Search ──────────────────────────────────────────────────────────────────
export interface SearchResult {
  movies: Movie[];
  series: Series[];
  channels: Channel[];
  total: number;
}

// ─── UI ──────────────────────────────────────────────────────────────────────
export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

export interface FeaturedContent extends BaseContent {
  type: ContentType;
  streamUrl?: string;
  trailerUrl?: string;
  tags?: string[];
}

export interface WatchHistoryItem {
  contentId: string;
  contentType: ContentType;
  title: string;
  poster?: string;
  progress: number;
  duration?: number;
  lastWatched: string;
  episodeInfo?: {
    season: number;
    episode: number;
    title: string;
  };
}
