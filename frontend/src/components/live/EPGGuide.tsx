'use client';

import { useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import type { Channel, EPGProgram } from '@/types';
import { formatEPGTime, getProgressPercent } from '@/lib/utils';
import { Wifi } from 'lucide-react';

interface EPGGuideProps {
  channels: Channel[];
  epgData: Record<string, EPGProgram[]>;
}

const SLOT_WIDTH = 200; // px per hour
const CHANNEL_COL_WIDTH = 180;
const ROW_HEIGHT = 72;
const HOURS_SHOWN = 6;

export default function EPGGuide({ channels, epgData }: EPGGuideProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const now = new Date();
  const startHour = now.getHours() - 1;

  // Time slots: show from startHour for HOURS_SHOWN hours
  const timeSlots: Date[] = [];
  for (let i = 0; i < HOURS_SHOWN * 2; i++) {
    const d = new Date(now);
    d.setHours(startHour + Math.floor(i / 2), (i % 2) * 30, 0, 0);
    timeSlots.push(d);
  }

  const totalWidth = HOURS_SHOWN * SLOT_WIDTH;

  // Compute position + width for a program
  const getProgramStyle = (prog: EPGProgram) => {
    const guideStart = new Date(now);
    guideStart.setHours(startHour, 0, 0, 0);
    const guideStartMs = guideStart.getTime();

    const start = new Date(prog.startTime).getTime();
    const end = new Date(prog.endTime).getTime();
    const guideEnd = guideStartMs + HOURS_SHOWN * 60 * 60 * 1000;

    const clampedStart = Math.max(start, guideStartMs);
    const clampedEnd = Math.min(end, guideEnd);

    if (clampedEnd <= clampedStart) return null;

    const left = ((clampedStart - guideStartMs) / (HOURS_SHOWN * 3600000)) * totalWidth;
    const width = ((clampedEnd - clampedStart) / (HOURS_SHOWN * 3600000)) * totalWidth;

    return { left, width };
  };

  // Current time indicator position
  const guideStart = new Date(now);
  guideStart.setHours(startHour, 0, 0, 0);
  const nowOffset = ((now.getTime() - guideStart.getTime()) / (HOURS_SHOWN * 3600000)) * totalWidth;

  // Auto-scroll to now
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = nowOffset - 100;
    }
  }, [nowOffset]);

  return (
    <div className="relative overflow-hidden rounded-xl bg-[#111118] border border-[rgba(255,255,255,0.06)]">
      <div className="flex">
        {/* Channel column */}
        <div
          className="flex-shrink-0 bg-[#111118] z-10 border-r border-[rgba(255,255,255,0.08)]"
          style={{ width: CHANNEL_COL_WIDTH }}
        >
          <div
            className="h-10 border-b border-[rgba(255,255,255,0.06)] flex items-center px-3"
            style={{ height: 40 }}
          >
            <span className="text-[#a0a0b0] text-xs font-medium">Channel</span>
          </div>
          {channels.map((ch) => (
            <div
              key={ch.id}
              className="flex items-center gap-2 px-3 border-b border-[rgba(255,255,255,0.04)]"
              style={{ height: ROW_HEIGHT }}
            >
              <div className="w-8 h-8 rounded-lg bg-[rgba(255,255,255,0.04)] flex items-center justify-center overflow-hidden flex-shrink-0">
                {ch.logo ? (
                  <Image src={ch.logo} alt={ch.name} width={28} height={28} className="object-contain" />
                ) : (
                  <Wifi size={14} className="text-[#6c63ff]" />
                )}
              </div>
              <span className="text-white text-xs font-medium truncate">{ch.name}</span>
            </div>
          ))}
        </div>

        {/* EPG scrollable area */}
        <div ref={containerRef} className="overflow-x-auto no-scrollbar flex-1 relative">
          {/* Time header */}
          <div
            className="sticky top-0 z-10 bg-[#111118] border-b border-[rgba(255,255,255,0.06)] flex"
            style={{ height: 40, width: totalWidth }}
          >
            {timeSlots.map((slot, i) => (
              <div
                key={i}
                className="flex-shrink-0 border-r border-[rgba(255,255,255,0.04)] px-2 flex items-center"
                style={{ width: SLOT_WIDTH / 2 }}
              >
                <span className="text-[#a0a0b0] text-xs">
                  {slot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
              </div>
            ))}
          </div>

          {/* Now line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-[#ff6b6b] z-20 pointer-events-none"
            style={{ left: nowOffset }}
          >
            <div className="w-2 h-2 rounded-full bg-[#ff6b6b] -translate-x-[3px] mt-8" />
          </div>

          {/* Programs */}
          <div style={{ width: totalWidth }}>
            {channels.map((ch) => {
              const programs = epgData[ch.id] || [];
              return (
                <div
                  key={ch.id}
                  className="relative border-b border-[rgba(255,255,255,0.04)]"
                  style={{ height: ROW_HEIGHT, width: totalWidth }}
                >
                  {programs.map((prog) => {
                    const style = getProgramStyle(prog);
                    if (!style) return null;
                    const isNow =
                      new Date(prog.startTime) <= now && new Date(prog.endTime) >= now;
                    const progress = isNow
                      ? getProgressPercent(prog.startTime, prog.endTime)
                      : 0;

                    return (
                      <motion.div
                        key={prog.id}
                        whileHover={{ brightness: 1.2 }}
                        className={`absolute top-1 bottom-1 rounded-lg overflow-hidden cursor-pointer border transition-all
                          ${isNow
                            ? 'bg-gradient-to-r from-[rgba(108,99,255,0.2)] to-[rgba(255,107,107,0.15)] border-[rgba(108,99,255,0.4)]'
                            : 'bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.06)]'
                          }`}
                        style={{ left: style.left + 2, width: style.width - 4 }}
                      >
                        <div className="px-2 py-1 h-full flex flex-col justify-center">
                          <p className="text-white text-xs font-medium truncate leading-tight">
                            {prog.title}
                          </p>
                          <p className="text-[#a0a0b0] text-[10px] truncate">
                            {formatEPGTime(prog.startTime)} – {formatEPGTime(prog.endTime)}
                          </p>
                          {isNow && (
                            <div className="mt-1 h-0.5 rounded-full bg-[rgba(255,255,255,0.1)] overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#6c63ff] to-[#ff6b6b]"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
