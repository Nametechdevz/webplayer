'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { moviesApi, seriesApi, channelsApi, userApi } from '@/lib/api';
import type { Movie, Series, Channel } from '@/types';

export function useMovies(params?: { page?: number; genre?: string; search?: string }) {
  return useQuery({
    queryKey: ['movies', params],
    queryFn: async () => {
      const { data } = await moviesApi.list(params);
      return data as { data: Movie[]; total: number };
    },
  });
}

export function useMovie(id: string) {
  return useQuery({
    queryKey: ['movie', id],
    queryFn: async () => {
      const { data } = await moviesApi.getById(id);
      return data as Movie;
    },
    enabled: !!id,
  });
}

export function useTrendingMovies() {
  return useQuery({
    queryKey: ['movies', 'trending'],
    queryFn: async () => {
      const { data } = await moviesApi.trending();
      return data as Movie[];
    },
  });
}

export function useRecommendedMovies() {
  return useQuery({
    queryKey: ['movies', 'recommended'],
    queryFn: async () => {
      const { data } = await moviesApi.recommended();
      return data as Movie[];
    },
  });
}

export function useSeries(params?: { page?: number; genre?: string; search?: string }) {
  return useQuery({
    queryKey: ['series', params],
    queryFn: async () => {
      const { data } = await seriesApi.list(params);
      return data as { data: Series[]; total: number };
    },
  });
}

export function useSeriesById(id: string) {
  return useQuery({
    queryKey: ['series', id],
    queryFn: async () => {
      const { data } = await seriesApi.getById(id);
      return data as Series;
    },
    enabled: !!id,
  });
}

export function useTrendingSeries() {
  return useQuery({
    queryKey: ['series', 'trending'],
    queryFn: async () => {
      const { data } = await seriesApi.trending();
      return data as Series[];
    },
  });
}

export function useChannels(params?: { category?: string; search?: string }) {
  return useQuery({
    queryKey: ['channels', params],
    queryFn: async () => {
      const { data } = await channelsApi.list(params);
      return data as Channel[];
    },
  });
}

export function useChannel(id: string) {
  return useQuery({
    queryKey: ['channel', id],
    queryFn: async () => {
      const { data } = await channelsApi.getById(id);
      return data as Channel;
    },
    enabled: !!id,
  });
}

export function useChannelCategories() {
  return useQuery({
    queryKey: ['channel-categories'],
    queryFn: async () => {
      const { data } = await channelsApi.categories();
      return data as { id: string; name: string; count: number }[];
    },
  });
}

export function useFavorites() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const { data } = await userApi.getFavorites();
      return data as { movies: Movie[]; series: Series[]; channels: Channel[] };
    },
  });

  const addMutation = useMutation({
    mutationFn: ({ contentId, type }: { contentId: string; type: string }) =>
      userApi.addFavorite(contentId, type),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });

  const removeMutation = useMutation({
    mutationFn: (contentId: string) => userApi.removeFavorite(contentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  });

  return {
    ...query,
    addFavorite: addMutation.mutate,
    removeFavorite: removeMutation.mutate,
    isAdding: addMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}

export function useWatchHistory() {
  return useQuery({
    queryKey: ['watch-history'],
    queryFn: async () => {
      const { data } = await userApi.getWatchHistory();
      return data;
    },
  });
}
