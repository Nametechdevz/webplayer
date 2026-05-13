'use client';

import { useTrendingMovies, useRecommendedMovies, useChannels, useTrendingSeries, useWatchHistory } from '@/hooks/useStreams';
import HeroBanner from '@/components/home/HeroBanner';
import ContentRow from '@/components/home/ContentRow';
import CategorySection from '@/components/home/CategorySection';
import type { FeaturedContent } from '@/types';
import { HeroSkeleton } from '@/components/ui/Skeleton';

export default function HomePage() {
  const { data: trendingMovies, isLoading: loadingMovies } = useTrendingMovies();
  const { data: trendingSeries, isLoading: loadingSeries } = useTrendingSeries();
  const { data: recommended, isLoading: loadingRec } = useRecommendedMovies();
  const { data: channels, isLoading: loadingChannels } = useChannels();
  const { data: history } = useWatchHistory();

  // Build featured content for hero from trending
  const featured: FeaturedContent[] = [
    ...(trendingMovies?.slice(0, 3).map((m) => ({
      ...m,
      type: 'movie' as const,
    })) || []),
    ...(trendingSeries?.slice(0, 2).map((s) => ({
      ...s,
      type: 'series' as const,
    })) || []),
  ];

  return (
    <div className="flex flex-col gap-12 pb-12">
      {/* Hero */}
      {loadingMovies ? (
        <HeroSkeleton />
      ) : featured.length > 0 ? (
        <HeroBanner items={featured} />
      ) : (
        <div className="h-[90vh] bg-gradient-to-br from-[#1a1a2e] to-[#0a0a0f] flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold gradient-text">StreamVault</h1>
            <p className="text-[#a0a0b0] mt-2">Your premium IPTV platform</p>
          </div>
        </div>
      )}

      {/* Content rows */}
      <div className="flex flex-col gap-10 -mt-8 relative z-10">
        {/* Continue Watching */}
        {history && (history as { items?: unknown[] }).items?.length ? (
          <ContentRow
            title="Continue Watching"
            items={(history as { items: ReturnType<typeof useTrendingMovies>['data'] }).items?.slice(0, 10) as Parameters<typeof ContentRow>[0]['items']}
            seeAllHref="/profile"
          />
        ) : null}

        {/* Live TV */}
        <ContentRow
          title="Live Now"
          items={channels?.slice(0, 12)}
          isLoading={loadingChannels}
          seeAllHref="/live"
          cardSize="md"
        />

        {/* Trending Movies */}
        <ContentRow
          title="Trending Movies"
          items={trendingMovies?.slice(0, 15)}
          isLoading={loadingMovies}
          seeAllHref="/movies"
        />

        {/* Popular Series */}
        <ContentRow
          title="Popular Series"
          items={trendingSeries?.slice(0, 15)}
          isLoading={loadingSeries}
          seeAllHref="/series"
        />

        {/* Recommended */}
        <ContentRow
          title="Recommended for You"
          items={recommended?.slice(0, 15)}
          isLoading={loadingRec}
          seeAllHref="/movies"
        />

        {/* Categories */}
        <CategorySection />
      </div>
    </div>
  );
}
