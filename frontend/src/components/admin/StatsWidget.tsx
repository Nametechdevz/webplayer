'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsWidgetProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  color?: string;
  gradient?: string;
  className?: string;
}

export default function StatsWidget({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  color = '#6c63ff',
  gradient = 'from-[#6c63ff] to-[#ff6b6b]',
  className,
}: StatsWidgetProps) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn(
        'bg-[#16161e] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.1)] rounded-2xl p-5 flex flex-col gap-4 transition-all duration-200',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: `${color}15`, color }}
        >
          <Icon size={22} />
        </div>
        {change && (
          <span
            className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full',
              changeType === 'up' && 'bg-[rgba(34,197,94,0.1)] text-[#4ade80]',
              changeType === 'down' && 'bg-[rgba(255,107,107,0.1)] text-[#ff6b6b]',
              changeType === 'neutral' && 'bg-[rgba(255,255,255,0.05)] text-[#a0a0b0]'
            )}
          >
            {changeType === 'up' ? '↑' : changeType === 'down' ? '↓' : ''} {change}
          </span>
        )}
      </div>
      <div>
        <p className="text-[#a0a0b0] text-sm mb-1">{title}</p>
        <p className={`text-3xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>
          {value}
        </p>
      </div>
    </motion.div>
  );
}
