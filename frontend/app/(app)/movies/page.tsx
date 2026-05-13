'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Film } from 'lucide-react';
import { useMovies } from '@/hooks/useStreams';
import ContentCard from '@/components/home/ContentCard';
import { CardSkeleton } from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';

const GENRES = ['All', 'Action', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 'Thriller', 'Romance', 'Documentary', 'Animation'];

export default function MoviesPage() {
  const searchParams = useSearchParams();
  const [genre, setGenre] = useState(searchParams.get('genre') || 'All');
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useMovies({
    page,
    genre: genre !== 'All' ? genre.toLowerCase() : undefined,
  });

  useEffect(() => {
    setPage(1);
  }, [genre]);

  return (
    <div className="flex flex-col gap-6 py-6">
      {/* Header */}
      <div className="px-4 md:px-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[rgba(108,99,255,0.1)] flex items-center justify-center">
          <Film size={20} className="text-[#6c63ff]" />
        </div>
        <div>
          <h1 className="text-white font-bold text-2xl">Movies</h1>
          <p className="text-[#a0a0b0] text-sm">{data?.total ?? 0} titles</p>
        </div>
      </div>

      {/* Genre filters */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 md:px-8">
        {GENRES.map((g) => (
          <motion.button
            key={g}
            whileTap={{ scale: 0.95 }}
            onClick={() => setGenre(g)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
              genre === g
                ? 'bg-gradient-to-r from-[#6c63ff] to-[#ff6b6b] text-white shadow-[0_0_15px_rgba(108,99,255,0.3)]'
                : 'bg-[rgba(255,255,255,0.05)] text-[#a0a0b0] hover:text-white border border-[rgba(255,255,255,0.08)]'
            }`}
          >
            {g}
          </motion.button>
        ))}
      </div>

      {/* Grid */}
      <div className="px-4 md:px-8">
        {isLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4">
            {Array.from({ length: 24 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-4"
          >
            {data?.data.map((movie, i) => (
              <motion.div
                key={movie.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <ContentCard item={movie} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Pagination */}
        {data && data.total > 24 && (
          <div className="flex items-center justify-center gap-4 mt-8">
            <Button
              variant="secondary"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1 || isFetching}
            >
              Previous
            </Button>
            <span className="text-[#a0a0b0] text-sm">Page {page}</span>
            <Button
              variant="secondary"
              onClick={() => setPage(page + 1)}
              disabled={!data?.data.length || isFetching}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
