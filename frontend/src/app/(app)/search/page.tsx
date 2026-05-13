'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { searchApi } from '@/lib/api';
import type { SearchResult } from '@/types';
import SearchBar from '@/components/search/SearchBar';
import ContentCard from '@/components/home/ContentCard';
import { CardSkeleton } from '@/components/ui/Skeleton';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQ);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      const { data } = await searchApi.search(query);
      return data as SearchResult;
    },
    enabled: query.length >= 2,
    staleTime: 1000 * 30,
  });

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setQuery(q);
  }, [searchParams]);

  const hasResults = data && (data.movies.length + data.series.length + data.channels.length) > 0;
  const loading = isLoading || isFetching;

  return (
    <div className="flex flex-col gap-8 py-6 px-4 md:px-8">
      {/* Search bar */}
      <div className="flex flex-col gap-2">
        <h1 className="text-white font-bold text-2xl">Search</h1>
        <SearchBar initialQuery={query} onSearch={setQuery} />
      </div>

      {/* Results */}
      {query.length >= 2 && (
        <>
          {loading && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
              {Array.from({ length: 16 }).map((_, i) => <CardSkeleton key={i} />)}
            </div>
          )}

          {!loading && !hasResults && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-20 gap-3 text-center"
            >
              <span className="text-5xl">🔍</span>
              <p className="text-white font-semibold text-xl">No results for "{query}"</p>
              <p className="text-[#a0a0b0]">Try different keywords or browse categories</p>
            </motion.div>
          )}

          {!loading && hasResults && (
            <div className="flex flex-col gap-8">
              {data.movies.length > 0 && (
                <section>
                  <h2 className="text-white font-semibold text-lg mb-4">
                    Movies <span className="text-[#a0a0b0] text-sm font-normal">({data.movies.length})</span>
                  </h2>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                    {data.movies.map((m, i) => (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                      >
                        <ContentCard item={m} />
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}

              {data.series.length > 0 && (
                <section>
                  <h2 className="text-white font-semibold text-lg mb-4">
                    Series <span className="text-[#a0a0b0] text-sm font-normal">({data.series.length})</span>
                  </h2>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                    {data.series.map((s, i) => (
                      <motion.div
                        key={s.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                      >
                        <ContentCard item={s} />
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}

              {data.channels.length > 0 && (
                <section>
                  <h2 className="text-white font-semibold text-lg mb-4">
                    Channels <span className="text-[#a0a0b0] text-sm font-normal">({data.channels.length})</span>
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {data.channels.map((c, i) => (
                      <motion.div
                        key={c.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                      >
                        <ContentCard item={c} />
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </>
      )}

      {/* Initial state */}
      {query.length < 2 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 gap-3 text-center"
        >
          <span className="text-6xl">🎬</span>
          <p className="text-white font-semibold text-xl">Search Everything</p>
          <p className="text-[#a0a0b0]">Find movies, series, and live channels</p>
        </motion.div>
      )}
    </div>
  );
}
