'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Tv2 } from 'lucide-react';
import { useChannels, useChannelCategories } from '@/hooks/useStreams';
import { useAllEPG } from '@/hooks/useEPG';
import ChannelGrid from '@/components/live/ChannelGrid';
import ChannelFilters from '@/components/live/ChannelFilters';
import EPGGuide from '@/components/live/EPGGuide';
import type { EPGProgram } from '@/types';

export default function LivePage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showEPG, setShowEPG] = useState(false);

  const { data: categories, isLoading: loadingCats } = useChannelCategories();
  const { data: channels, isLoading: loadingChannels } = useChannels(
    selectedCategory !== 'all' ? { category: selectedCategory } : undefined
  );
  const { data: epgData } = useAllEPG();

  return (
    <div className="flex flex-col gap-6 py-6">
      {/* Header */}
      <div className="px-4 md:px-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[rgba(108,99,255,0.1)] flex items-center justify-center">
            <Tv2 size={20} className="text-[#6c63ff]" />
          </div>
          <div>
            <h1 className="text-white font-bold text-2xl">Live TV</h1>
            <p className="text-[#a0a0b0] text-sm">
              {channels?.length ?? 0} channels
            </p>
          </div>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowEPG(!showEPG)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            showEPG
              ? 'bg-gradient-to-r from-[#6c63ff] to-[#ff6b6b] text-white'
              : 'bg-[rgba(255,255,255,0.05)] text-[#a0a0b0] hover:text-white border border-[rgba(255,255,255,0.08)]'
          }`}
        >
          TV Guide
        </motion.button>
      </div>

      {/* EPG Guide */}
      {showEPG && channels && epgData && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="px-4 md:px-8"
        >
          <EPGGuide
            channels={channels.slice(0, 20)}
            epgData={epgData as Record<string, EPGProgram[]>}
          />
        </motion.div>
      )}

      {/* Filters */}
      {!loadingCats && categories && (
        <ChannelFilters
          categories={categories}
          selected={selectedCategory}
          onChange={setSelectedCategory}
        />
      )}

      {/* Grid */}
      <ChannelGrid channels={channels || []} isLoading={loadingChannels} />
    </div>
  );
}
