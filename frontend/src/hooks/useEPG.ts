'use client';

import { useQuery } from '@tanstack/react-query';
import { channelsApi } from '@/lib/api';
import type { EPGProgram } from '@/types';

export function useEPG(channelId: string, date?: string) {
  return useQuery({
    queryKey: ['epg', channelId, date],
    queryFn: async () => {
      const { data } = await channelsApi.epg(channelId, date);
      return data as EPGProgram[];
    },
    enabled: !!channelId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useAllEPG() {
  return useQuery({
    queryKey: ['epg', 'all'],
    queryFn: async () => {
      const { data } = await channelsApi.allEpg();
      return data as Record<string, EPGProgram[]>;
    },
    staleTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 60 * 5,
  });
}
