import React, { useState } from 'react';
import { Search, Star, Filter, Play, Film } from 'lucide-react';
import { useLibraryStore } from '../store/libraryStore';
import { useUiStore } from '../store/uiStore';

export default function SearchPanel() {
  const items = useLibraryStore((s) => s.items);
  const openModal = useUiStore((s) => s.openModal);
  const [query, setQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [minRating, setMinRating] = useState(0);

  const ALL_GENRES = Array.from(new Set(items.flatMap((m) => m.genres))).sort();
  const QUICK_TAGS = ['4K', 'HDR', 'DOLBY', 'ATMOS', 'R', 'PG-13'];

  const filtered = items.filter((item) => {
    const q = query.toLowerCase();
    const matchesSearch =
      !q ||
      item.title.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.tagline.toLowerCase().includes(q);
    const matchesGenre = !selectedGenre || item.genres.includes(selectedGenre);
    const matchesTag =
      !selectedTag || item.tags.some((t) => t.toUpperCase().includes(selectedTag.toUpperCase()));
    const matchesRating = item.rating >= minRating;
    return matchesSearch && matchesGenre && matchesTag && matchesRating;
  });

  const clearFilters = () => {
    setQuery('');
    setSelectedGenre('');
    setSelectedTag('');
    setMinRating(0);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-entrance-row-1">
      <div className="glass-card bg-[#151518]/95 border border-white/10 rounded-2xl p-4 md:p-6 shadow-xl space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant pointer-events-none" />
          <input
            type="text"
            placeholder="Search titles, descriptions, genres..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-[#0e0e10] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm md:text-base outline-none focus:border-primary/80 transition-all text-white placeholder-on-surface-variant/60"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs uppercase font-bold text-primary hover:underline hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs pt-2">
          <div className="flex items-center gap-1.5 bg-black/40 border border-white/5 rounded-lg px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-primary" />
            <span className="text-on-surface-variant font-medium">Genre:</span>
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="bg-transparent border-none text-white outline-none cursor-pointer font-bold px-1"
            >
              <option value="">All Genres</option>
              {ALL_GENRES.map((g) => (
                <option key={g} value={g} className="bg-[#151518] text-white">
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5 bg-black/40 border border-white/5 rounded-lg px-2.5 py-1.5">
            <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />
            <span className="text-on-surface-variant font-medium">Rating:</span>
            <select
              value={minRating}
              onChange={(e) => setMinRating(Number(e.target.value))}
              className="bg-transparent border-none text-white outline-none cursor-pointer font-bold px-1"
            >
              <option value="0">Any Rating</option>
              <option value="9" className="bg-[#151518]">★ 9.0+ Excellent</option>
              <option value="8.5" className="bg-[#151518]">★ 8.5+ Acclaimed</option>
              <option value="8" className="bg-[#151518]">★ 8.0+ High Quality</option>
            </select>
          </div>
          {(query || selectedGenre || selectedTag || minRating > 0) && (
            <button
              onClick={clearFilters}
              className="text-primary hover:text-white underline font-semibold transition-colors cursor-pointer ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono select-none">
          <span className="text-on-surface-variant font-semibold mr-1.5">Quick specs:</span>
          {QUICK_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
              className={`px-2 py-0.5 rounded border transition-all cursor-pointer ${
                selectedTag === tag
                  ? 'bg-primary text-on-primary border-primary font-bold shadow-md shadow-violet-500/25'
                  : 'bg-white/5 border-white/5 hover:bg-white/10 text-on-surface-variant'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center text-xs px-1">
          <span className="font-bold text-on-surface-variant uppercase tracking-wider">
            Results ({filtered.length})
          </span>
          {filtered.length === 0 && (
            <span className="text-red-400">No matching titles found</span>
          )}
        </div>

        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => openModal(item)}
                className="group flex flex-col justify-between bg-white/5 border border-white/5 hover:border-white/15 rounded-xl overflow-hidden p-3 cursor-pointer hover:bg-white/10 transition-all duration-300 shadow-md transform hover:-translate-y-1"
              >
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-neutral-900 mb-2.5">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/50 border border-white/10 text-[9px] font-bold rounded flex items-center gap-0.5 text-yellow-400">
                    ★ {item.rating}
                  </div>
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-white text-xs md:text-sm truncate leading-snug group-hover:text-primary transition-colors">
                    {item.title}
                  </h4>
                  <div className="flex justify-between items-center text-[10px] text-on-surface-variant font-mono">
                    <span className="capitalize">{item.type === 'movie' ? 'Film' : 'Series'}</span>
                    <span>{item.duration}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center bg-white/3 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center space-y-3">
            <Film className="w-10 h-10 text-on-surface-variant/30 animate-pulse" />
            <div className="space-y-1">
              <p className="font-bold text-white text-sm">No results match your parameters</p>
              <p className="text-xs text-on-surface-variant px-6">
                Try broadening your search or clicking "Reset Filters"
              </p>
            </div>
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-white/10 border border-white/15 hover:bg-white/15 rounded-xl text-xs font-semibold"
            >
              Reset Search Parameters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
