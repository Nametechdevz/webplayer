'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Clock, TrendingUp } from 'lucide-react';
import { debounce } from '@/lib/utils';

const TRENDING = ['Breaking Bad', 'Inception', 'The Boys', 'Oppenheimer', 'CNN', 'BBC News'];

interface SearchBarProps {
  initialQuery?: string;
  onSearch?: (query: string) => void;
}

export default function SearchBar({ initialQuery = '', onSearch }: SearchBarProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const [focused, setFocused] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('searchHistory');
    if (stored) setHistory(JSON.parse(stored));
  }, []);

  const addToHistory = (q: string) => {
    const updated = [q, ...history.filter((h) => h !== q)].slice(0, 8);
    setHistory(updated);
    localStorage.setItem('searchHistory', JSON.stringify(updated));
  };

  const handleSubmit = (q: string) => {
    if (!q.trim()) return;
    addToHistory(q.trim());
    if (onSearch) {
      onSearch(q.trim());
    } else {
      router.push(`/search?q=${encodeURIComponent(q.trim())}`);
    }
    setFocused(false);
    inputRef.current?.blur();
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('searchHistory');
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-200 ${
        focused
          ? 'bg-[rgba(255,255,255,0.07)] border-[#6c63ff] shadow-[0_0_0_2px_rgba(108,99,255,0.15)]'
          : 'bg-[rgba(255,255,255,0.04)] border-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)]'
      }`}>
        <Search size={20} className={focused ? 'text-[#6c63ff]' : 'text-[#a0a0b0]'} />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit(query)}
          placeholder="Search movies, series, channels..."
          className="flex-1 bg-transparent text-white placeholder-[#a0a0b0] text-base focus:outline-none"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="text-[#a0a0b0] hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {focused && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-[#16161e] border border-[rgba(255,255,255,0.1)] rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Recent searches */}
            {history.length > 0 && !query && (
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#a0a0b0] text-xs font-medium flex items-center gap-1.5">
                    <Clock size={12} /> Recent
                  </span>
                  <button
                    onClick={clearHistory}
                    className="text-[#a0a0b0] hover:text-white text-xs transition-colors"
                  >
                    Clear
                  </button>
                </div>
                {history.map((h) => (
                  <button
                    key={h}
                    onClick={() => { setQuery(h); handleSubmit(h); }}
                    className="flex items-center gap-2 w-full px-2 py-2 rounded-lg hover:bg-[rgba(255,255,255,0.04)] text-white text-sm transition-colors"
                  >
                    <Clock size={14} className="text-[#a0a0b0]" />
                    {h}
                  </button>
                ))}
              </div>
            )}

            {/* Trending */}
            {!query && (
              <div className="p-3 border-t border-[rgba(255,255,255,0.06)]">
                <span className="text-[#a0a0b0] text-xs font-medium flex items-center gap-1.5 mb-2">
                  <TrendingUp size={12} /> Trending
                </span>
                <div className="flex flex-wrap gap-2">
                  {TRENDING.map((t) => (
                    <button
                      key={t}
                      onClick={() => { setQuery(t); handleSubmit(t); }}
                      className="px-3 py-1 rounded-full bg-[rgba(108,99,255,0.1)] border border-[rgba(108,99,255,0.2)] text-[#6c63ff] text-xs hover:bg-[rgba(108,99,255,0.2)] transition-colors"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
