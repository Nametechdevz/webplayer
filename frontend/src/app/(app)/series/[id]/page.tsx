'use client';

import { use, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Play, Plus, Star, ChevronDown } from 'lucide-react';
import { useSeriesById } from '@/hooks/useStreams';
import { useQuery } from '@tanstack/react-query';
import { seriesApi } from '@/lib/api';
import VideoPlayer from '@/components/player/VideoPlayer';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import type { Episode, Season } from '@/types';

export default function SeriesPlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: series, isLoading } = useSeriesById(id);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [playingEpisode, setPlayingEpisode] = useState<Episode | null>(null);
  const [seasonOpen, setSeasonOpen] = useState(false);

  const { data: episodes } = useQuery({
    queryKey: ['episodes', id, selectedSeason],
    queryFn: async () => {
      const { data } = await seriesApi.getEpisodes(id, selectedSeason);
      return data as Episode[];
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="w-full aspect-video rounded-2xl" />
      </div>
    );
  }

  if (!series) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-white font-semibold text-xl">Series not found</p>
        <Link href="/series" className="text-[#6c63ff] hover:underline">← Back to Series</Link>
      </div>
    );
  }

  const totalSeasons = series.totalSeasons || 1;

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      <Link href="/series">
        <motion.div
          whileHover={{ x: -2 }}
          className="flex items-center gap-2 text-[#a0a0b0] hover:text-white transition-colors w-fit"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">Back to Series</span>
        </motion.div>
      </Link>

      {/* Player */}
      {playingEpisode?.streamUrl && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <VideoPlayer
            streamUrl={playingEpisode.streamUrl}
            title={`${series.title} - S${playingEpisode.seasonNumber}E${playingEpisode.episodeNumber} ${playingEpisode.title}`}
            poster={playingEpisode.thumbnail || series.poster}
            autoPlay
          />
        </motion.div>
      )}

      {/* Hero if not playing */}
      {!playingEpisode && series.backdrop && (
        <div className="relative h-48 md:h-72 rounded-2xl overflow-hidden">
          <Image src={series.backdrop} alt={series.title} fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />
        </div>
      )}

      {/* Series info */}
      <div className="flex gap-4 flex-col sm:flex-row">
        {series.poster && (
          <div className="w-28 sm:w-36 flex-shrink-0">
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden">
              <Image src={series.poster} alt={series.title} fill className="object-cover" />
            </div>
          </div>
        )}
        <div className="flex flex-col gap-3">
          <h1 className="text-white font-bold text-2xl md:text-3xl">{series.title}</h1>
          <div className="flex items-center gap-3 flex-wrap">
            {series.year && <span className="text-[#a0a0b0]">{series.year}</span>}
            {series.rating !== undefined && (
              <span className="flex items-center gap-1 text-[#facc15]">
                <Star size={14} fill="currentColor" />
                {series.rating.toFixed(1)}
              </span>
            )}
            {series.status && (
              <Badge variant={series.status === 'ongoing' ? 'success' : 'default'}>
                {series.status}
              </Badge>
            )}
            {totalSeasons > 0 && (
              <span className="text-[#a0a0b0] text-sm">{totalSeasons} Season{totalSeasons > 1 ? 's' : ''}</span>
            )}
          </div>
          {series.genres && (
            <div className="flex flex-wrap gap-2">
              {series.genres.map((g) => <Badge key={g} variant="default">{g}</Badge>)}
            </div>
          )}
          {series.description && (
            <p className="text-[#a0a0b0] leading-relaxed text-sm">{series.description}</p>
          )}
          <div className="flex gap-2">
            {episodes?.[0]?.streamUrl && (
              <Button
                leftIcon={<Play size={16} fill="white" />}
                onClick={() => setPlayingEpisode(episodes[0])}
              >
                Play S1E1
              </Button>
            )}
            <Button variant="secondary" leftIcon={<Plus size={16} />}>My List</Button>
          </div>
        </div>
      </div>

      {/* Season selector */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">Episodes</h2>
          <div className="relative">
            <button
              onClick={() => setSeasonOpen(!seasonOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] text-white text-sm hover:border-[rgba(108,99,255,0.4)] transition-all"
            >
              Season {selectedSeason}
              <ChevronDown size={14} className={seasonOpen ? 'rotate-180' : ''} />
            </button>
            <AnimatePresence>
              {seasonOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="absolute right-0 top-full mt-1 bg-[#16161e] border border-[rgba(255,255,255,0.1)] rounded-xl overflow-hidden z-10 shadow-xl min-w-[120px]"
                >
                  {Array.from({ length: totalSeasons }, (_, i) => i + 1).map((s) => (
                    <button
                      key={s}
                      onClick={() => { setSelectedSeason(s); setSeasonOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                        s === selectedSeason
                          ? 'text-[#6c63ff] bg-[rgba(108,99,255,0.1)]'
                          : 'text-white hover:bg-[rgba(255,255,255,0.04)]'
                      }`}
                    >
                      Season {s}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Episodes list */}
        <div className="flex flex-col gap-2">
          {episodes?.map((ep) => (
            <motion.div
              key={ep.id}
              whileHover={{ x: 2 }}
              onClick={() => ep.streamUrl && setPlayingEpisode(ep)}
              className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all border ${
                playingEpisode?.id === ep.id
                  ? 'bg-gradient-to-r from-[rgba(108,99,255,0.15)] to-[rgba(255,107,107,0.1)] border-[rgba(108,99,255,0.3)]'
                  : 'bg-[#16161e] border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)]'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-[rgba(255,255,255,0.04)] flex items-center justify-center flex-shrink-0">
                {playingEpisode?.id === ep.id ? (
                  <div className="w-3 h-3 rounded-sm bg-[#6c63ff]" />
                ) : (
                  <span className="text-[#a0a0b0] text-xs font-mono">{ep.episodeNumber}</span>
                )}
              </div>
              {ep.thumbnail && (
                <div className="w-20 aspect-video rounded-lg overflow-hidden flex-shrink-0 hidden sm:block">
                  <Image src={ep.thumbnail} alt={ep.title} width={80} height={45} className="object-cover w-full h-full" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{ep.title}</p>
                {ep.description && (
                  <p className="text-[#a0a0b0] text-xs mt-0.5 line-clamp-1">{ep.description}</p>
                )}
              </div>
              {ep.streamUrl && (
                <button className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white flex-shrink-0 transition-colors">
                  <Play size={14} fill="white" />
                </button>
              )}
            </motion.div>
          ))}
          {!episodes?.length && (
            <p className="text-[#a0a0b0] text-sm text-center py-8">No episodes available</p>
          )}
        </div>
      </div>
    </div>
  );
}
