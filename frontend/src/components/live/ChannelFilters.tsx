'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ChannelFiltersProps {
  categories: { id: string; name: string; count: number }[];
  selected: string;
  onChange: (id: string) => void;
}

export default function ChannelFilters({
  categories,
  selected,
  onChange,
}: ChannelFiltersProps) {
  const all = [{ id: 'all', name: 'All', count: 0 }, ...categories];

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 md:px-8 pb-2">
      {all.map(({ id, name, count }) => {
        const active = selected === id;
        return (
          <motion.button
            key={id}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChange(id)}
            className={cn(
              'flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
              active
                ? 'bg-gradient-to-r from-[#6c63ff] to-[#ff6b6b] text-white shadow-[0_0_15px_rgba(108,99,255,0.3)]'
                : 'bg-[rgba(255,255,255,0.05)] text-[#a0a0b0] hover:text-white border border-[rgba(255,255,255,0.08)] hover:border-[rgba(108,99,255,0.3)]'
            )}
          >
            {name}
            {id !== 'all' && count > 0 && (
              <span className={cn('ml-1.5 text-xs', active ? 'text-white/70' : 'text-[rgba(255,255,255,0.3)]')}>
                {count}
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
