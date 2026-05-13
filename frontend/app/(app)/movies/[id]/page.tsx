'use client';

import { use, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, Plus, Star, Clock, Globe, User } from 'lucide-react';
import { useMovie } from '@/hooks/useStreams';
import VideoPlayer from '@/components/player/VideoPlayer';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDuration } from '@/lib/utils';

export default function MoviePlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: movie, isLoading } = useMovie(id);
  const [playing, setPlaying] = useState(false);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 md:p-8">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-6">
          <Skeleton className="w-48 aspect-[2/3] rounded-xl flex-shrink-0" />
          <div className="flex flex-col gap-4 flex-1">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-white font-semibold text-xl">Movie not found</p>
        <Link href="/movies" className="text-[#6c63ff] hover:underline">← Back to Movies</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8">
      {/* Back */}
      <Link href="/movies">
        <motion.div
          whileHover={{ x: -2 }}
          className="flex items-center gap-2 text-[#a0a0b0] hover:text-white transition-colors w-fit"
        >
          <ArrowLeft size={18} />
          <span className="text-sm font-medium">Back to Movies</span>
        </motion.div>
      </Link>

      {/* Hero backdrop */}
      {movie.backdrop && !playing && (
        <div className="relative h-64 md:h-96 rounded-2xl overflow-hidden -mx-4 md:mx-0">
          <Image src={movie.backdrop} alt={movie.title} fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[rgba(10,10,15,0.4)] to-transparent" />
          <div className="absolute bottom-6 left-6">
            <Button
              size="lg"
              leftIcon={<Play size={18} fill="white" />}
              onClick={() => setPlaying(true)}
              className="shadow-[0_0_30px_rgba(108,99,255,0.4)]"
            >
              Play Movie
            </Button>
          </div>
        </div>
      )}

      {/* Player */}
      {playing && movie.streamUrl && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <VideoPlayer
            streamUrl={movie.streamUrl}
            title={movie.title}
            poster={movie.poster}
            autoPlay
          />
        </motion.div>
      )}

      {/* Details */}
      <div className="flex gap-6 flex-col md:flex-row">
        {/* Poster */}
        {movie.poster && (
          <div className="w-36 md:w-48 flex-shrink-0">
            <div className="relative aspect-[2/3] rounded-xl overflow-hidden">
              <Image src={movie.poster} alt={movie.title} fill className="object-cover" />
            </div>
          </div>
        )}

        {/* Info */}
        <div className="flex flex-col gap-4 flex-1">
          <div>
            <h1 className="text-white font-bold text-3xl">{movie.title}</h1>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              {movie.year && <span className="text-[#a0a0b0]">{movie.year}</span>}
              {movie.duration && (
                <span className="flex items-center gap-1 text-[#a0a0b0]">
                  <Clock size={14} />
                  {formatDuration(movie.duration)}
                </span>
              )}
              {movie.rating !== undefined && (
                <span className="flex items-center gap-1 text-[#facc15]">
                  <Star size={14} fill="currentColor" />
                  {movie.rating.toFixed(1)}
                </span>
              )}
              {movie.quality && <Badge variant="purple">{movie.quality}</Badge>}
              {movie.language && (
                <span className="flex items-center gap-1 text-[#a0a0b0]">
                  <Globe size={14} />
                  {movie.language}
                </span>
              )}
            </div>
          </div>

          {/* Genres */}
          {movie.genres && (
            <div className="flex flex-wrap gap-2">
              {movie.genres.map((g) => (
                <Badge key={g} variant="default">{g}</Badge>
              ))}
            </div>
          )}

          {/* Description */}
          {movie.description && (
            <p className="text-[#a0a0b0] leading-relaxed">{movie.description}</p>
          )}

          {/* Cast/Director */}
          {movie.director && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[#a0a0b0]">Director:</span>
              <span className="text-white font-medium">{movie.director}</span>
            </div>
          )}
          {movie.cast && movie.cast.length > 0 && (
            <div className="flex items-start gap-2 text-sm">
              <User size={14} className="text-[#a0a0b0] mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-[#a0a0b0]">Cast: </span>
                <span className="text-white">{movie.cast.join(', ')}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-2">
            {!playing && movie.streamUrl && (
              <Button
                leftIcon={<Play size={16} fill="white" />}
                onClick={() => setPlaying(true)}
              >
                Play
              </Button>
            )}
            <Button variant="secondary" leftIcon={<Plus size={16} />}>
              My List
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
