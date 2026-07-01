import React, { useRef } from 'react';
import { MediaItem } from '../types';
import { Play, Plus, Check, Star, ChevronRight, Tv, Sparkles, Flame } from 'lucide-react';
import { useLibraryStore } from '../store/libraryStore';
import { usePlayerStore } from '../store/playerStore';
import { useUiStore } from '../store/uiStore';
import { useUserData } from '../hooks/useUserData';

interface Props {
  filter?: 'all' | 'movie' | 'tv';
}

export default function MainBrowse({ filter = 'all' }: Props) {
  const allItems = useLibraryStore((s) => s.items);
  const loading = useLibraryStore((s) => s.loading);
  const libraryStore = useLibraryStore();
  const openPlayer = usePlayerStore((s) => s.open);
  const openModal = useUiStore((s) => s.openModal);
  const { isFavorite, toggleFavorite } = useUserData();

  const items = filter === 'all' ? allItems : allItems.filter((m) => m.type === filter);

  const continueWatching = items.filter((m) => m.progress > 0 && m.progress < 95);
  const recentlyAdded = filter === 'all' ? libraryStore.recentlyAdded() : items;
  const topRated = filter === 'all'
    ? libraryStore.topRated()
    : [...items].filter((m) => m.rating > 0).sort((a, b) => b.rating - a.rating).slice(0, 8);
  const hero = filter === 'all'
    ? libraryStore.heroItem()
    : (topRated[0] || items[0] || null);

  const continueRef = useRef<HTMLDivElement>(null);
  const recentRef = useRef<HTMLDivElement>(null);

  const handleWheel = (ref: React.RefObject<HTMLDivElement | null>, e: React.WheelEvent) => {
    if (ref.current && e.deltaY !== 0) ref.current.scrollLeft += e.deltaY * 1.5;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-primary font-bold animate-pulse">
        Loading Library...
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-on-surface-variant text-center space-y-4 animate-entrance-hero">
        <Tv className="w-16 h-16 opacity-50" />
        <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Library Empty</h2>
        <p className="max-w-md">
          No media items found. Ensure your Jellyfin server has content and your account has access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-12">
      {/* Hero */}
      {hero && (
        <section className="relative w-full h-[520px] md:h-[650px] overflow-hidden rounded-2xl md:rounded-3xl border border-white/10 group select-none shadow-2xl animate-entrance-hero">
          <div className="absolute inset-0">
            <img
              src={hero.image}
              alt={hero.title}
              className="w-full h-full object-cover transform scale-102 group-hover:scale-105 transition-transform duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f11] via-[#0f0f11]/60 to-transparent" />
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />
          </div>

          <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 z-10 space-y-4">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 px-3 py-1 bg-primary/20 border border-primary/40 backdrop-blur-md rounded-full text-primary font-bold text-[10px] md:text-xs">
                <Flame className="w-3.5 h-3.5 fill-current text-primary" />
                TOP RATED
              </span>
              <div className="text-yellow-400 flex items-center gap-1 text-xs font-bold bg-black/40 backdrop-blur-md px-2 py-0.5 rounded border border-white/5">
                <Star className="w-3.5 h-3.5 fill-current" />
                {hero.rating}
              </div>
            </div>
            <h2 className="text-3xl md:text-6xl font-black text-white leading-tight tracking-tight select-text">
              {hero.title}
            </h2>
            <p className="text-sm md:text-lg text-on-surface-variant max-w-2xl line-clamp-2 leading-relaxed select-text font-body-md">
              {hero.description}
            </p>
            <div className="flex flex-wrap gap-3 pt-3">
              <button
                onClick={() => openPlayer(hero)}
                className="flex items-center gap-2 bg-primary text-on-primary px-6 md:px-8 py-3.5 rounded-xl font-bold text-sm md:text-base hover:scale-105 active:scale-95 transition-all shadow-[0_4px_25px_rgba(205,189,255,0.4)] pulse-btn cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                Play
              </button>
              <button
                onClick={() => toggleFavorite(hero.id)}
                className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white px-5 md:px-7 py-3.5 rounded-xl font-bold text-sm md:text-base hover:bg-white/20 transition-all active:scale-95 cursor-pointer"
              >
                {isFavorite(hero.id) ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Plus className="w-4 h-4 text-white" />
                )}
                My List
              </button>
              <button
                onClick={() => openModal(hero)}
                className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md border border-white/10 text-on-surface-variant px-4 py-3.5 rounded-xl text-xs md:text-sm font-semibold hover:text-white transition-all cursor-pointer"
              >
                Learn More
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Continue Watching */}
      {continueWatching.length > 0 && (
        <section className="space-y-4 animate-entrance-row-1">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-lg md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2 font-headline-md">
              <Sparkles className="w-5 h-5 text-secondary" />
              Continue Watching
            </h3>
            <span className="text-[10px] md:text-xs text-primary font-bold flex items-center gap-1 cursor-pointer hover:underline">
              SEE ALL <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
          <div
            ref={continueRef}
            onWheel={(e) => handleWheel(continueRef, e)}
            className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth snap-x"
          >
            {continueWatching.map((item) => (
              <div key={item.id} className="flex-none w-[260px] md:w-[320px] group cursor-pointer snap-start">
                <div
                  onClick={() => openModal(item)}
                  className="relative glass-card rounded-xl border border-white/10 overflow-hidden aspect-video mb-3 shadow-lg"
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                  />
                  <div
                    onClick={(e) => { e.stopPropagation(); openPlayer(item); }}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <div className="p-3 bg-primary rounded-full text-on-primary shadow-xl scale-90 group-hover:scale-100 transition-transform">
                      <Play className="w-5 h-5 fill-current" />
                    </div>
                  </div>
                  {item.progress > 0 && (
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-white/15">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-secondary"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-start gap-2 px-1">
                  <div>
                    <h4
                      onClick={() => openModal(item)}
                      className="font-extrabold text-white text-sm md:text-base truncate group-hover:text-primary transition-colors"
                    >
                      {item.title}
                    </h4>
                    <p className="text-xs text-on-surface-variant font-medium mt-0.5 font-caption">
                      {item.seasonEpisode || `${Math.round(item.progress)}% watched`}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleFavorite(item.id)}
                    className="p-1 px-2 border border-white/10 hover:border-white/20 rounded text-[10px] text-on-surface-variant hover:text-white"
                  >
                    {isFavorite(item.id) ? 'Saved' : '+ List'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recently Added */}
      <section className="space-y-4 animate-entrance-row-2">
        <div className="px-2">
          <h3 className="text-lg md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2 font-headline-md">
            <Tv className="w-5 h-5 text-primary" />
            Recently Added
          </h3>
        </div>
        <div
          ref={recentRef}
          onWheel={(e) => handleWheel(recentRef, e)}
          className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth snap-x"
        >
          {recentlyAdded.map((item) => (
            <div
              key={item.id}
              className="flex-none w-[150px] md:w-[190px] group cursor-pointer snap-start"
            >
              <div
                onClick={() => openModal(item)}
                className="relative glass-card rounded-xl border border-white/10 overflow-hidden aspect-[2/3] mb-3 shadow-lg"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent" />
              </div>
              <div className="px-1 space-y-0.5">
                <h4
                  onClick={() => openModal(item)}
                  className="font-extrabold text-white text-xs md:text-sm truncate group-hover:text-primary transition-colors"
                >
                  {item.title}
                </h4>
                <div className="flex justify-between items-center text-[10px] text-on-surface-variant font-mono">
                  <span>{item.duration}</span>
                  <span>★ {item.rating}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Top Rated Bento Grid */}
      {topRated.length > 0 && (
        <section className="space-y-6 pt-4 animate-entrance-row-3">
          <div className="px-2">
            <h3 className="text-lg md:text-2xl font-extrabold text-white tracking-tight font-headline-md">
              Top Rated Masterpieces
            </h3>
            <p className="text-xs text-on-surface-variant font-medium">
              Highest community ratings in your library
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
            {topRated[0] && (
              <div
                onClick={() => openModal(topRated[0])}
                className="relative glass-card rounded-2xl border border-white/10 overflow-hidden col-span-2 row-span-2 h-[280px] md:h-auto group cursor-pointer shadow-xl"
              >
                <img
                  src={topRated[0].image}
                  alt={topRated[0].title}
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                <div className="absolute bottom-0 left-0 w-full p-4 md:p-6 space-y-1 z-10 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex items-center gap-1 px-2.5 py-0.5 bg-yellow-400 text-neutral-950 font-black rounded text-[10px] md:text-xs">
                      <Star className="w-3 h-3 fill-current" />
                      {topRated[0].rating} Rating
                    </div>
                  </div>
                  <h4 className="text-xl md:text-3xl font-black text-white group-hover:text-primary transition-colors select-text">
                    {topRated[0].title}
                  </h4>
                  <p className="text-xs text-on-surface-variant select-text max-w-sm line-clamp-2 md:block hidden font-medium">
                    {topRated[0].description}
                  </p>
                  <span className="text-[10px] text-primary font-bold uppercase tracking-wider block pt-1">
                    {topRated[0].genres.join(' • ')}
                  </span>
                </div>
              </div>
            )}
            {topRated.slice(1).map((item) => (
              <div
                key={item.id}
                onClick={() => openModal(item)}
                className="relative glass-card rounded-2xl border border-white/10 overflow-hidden h-[140px] md:h-[190px] group cursor-pointer shadow-lg"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 w-full p-3 text-left">
                  <span className="text-[9px] font-bold text-yellow-400 flex items-center gap-0.5">
                    ★ {item.rating}
                  </span>
                  <h5 className="font-extrabold text-white text-xs md:text-sm truncate group-hover:text-primary transition-colors">
                    {item.title}
                  </h5>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
