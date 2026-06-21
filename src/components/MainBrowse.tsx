import React, { useRef } from 'react';
import { Movie } from '../types';
import { Play, Plus, Check, Star, ChevronRight, Tv, Sparkles, Flame } from 'lucide-react';

interface MainBrowseProps {
  movies: Movie[];
  favorites: string[];
  onToggleMyList: (id: string) => void;
  onSelectMovie: (movie: Movie) => void;
  onPlayMovie: (movie: Movie) => void;
}

export default function MainBrowse({
  movies,
  favorites,
  onToggleMyList,
  onSelectMovie,
  onPlayMovie,
}: MainBrowseProps) {
  
  // Categorized movie filter lists
  const trendingHero = movies.find((m) => m.category === 'trending') || movies[0];
  const continueWatching = movies.filter((m) => m.category === 'continue');
  const recentlyAdded = movies.filter((m) => m.category === 'recent');
  const topRated = movies.filter((m) => m.category === 'top_rated');

  const continueRef = useRef<HTMLDivElement>(null);
  const recentRef = useRef<HTMLDivElement>(null);

  // Horizontal scroll supporting standard mouse wheel
  const handleWheelScroll = (ref: React.RefObject<HTMLDivElement | null>, e: React.WheelEvent) => {
    if (ref.current && e.deltaY !== 0) {
      ref.current.scrollLeft += e.deltaY * 1.5;
    }
  };

  const isFav = (id: string) => favorites.includes(id);

  return (
    <div className="space-y-12 pb-12">
      {/* Massive Hero Section */}
      <section className="relative w-full h-[520px] md:h-[650px] overflow-hidden rounded-2xl md:rounded-3xl border border-white/10 group select-none shadow-2xl animate-entrance-hero">
        <div className="absolute inset-0">
          <img 
            src={trendingHero.image} 
            alt={trendingHero.title} 
            className="w-full h-full object-cover transform scale-102 group-hover:scale-105 transition-transform duration-1000" 
          />
          {/* Cinema dark wash bottom shadow */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f11] via-[#0f0f11]/60 to-transparent" />
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />
        </div>

        {/* Content floating details */}
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 z-10 space-y-4">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 px-3 py-1 bg-primary/20 border border-primary/40 backdrop-blur-md rounded-full text-primary font-bold text-[10px] md:text-xs">
              <Flame className="w-3.5 h-3.5 fill-current text-primary" />
              TRENDING NOW
            </span>
            <div className="text-yellow-400 flex items-center gap-1 text-xs font-bold bg-black/40 backdrop-blur-md px-2 py-0.5 rounded border border-white/5">
              <Star className="w-3.5 h-3.5 fill-current" />
              {trendingHero.rating}
            </div>
          </div>

          <h2 className="text-3xl md:text-6xl font-black text-white leading-tight tracking-tight select-text">
            {trendingHero.title}
          </h2>
          <p className="text-sm md:text-lg text-on-surface-variant max-w-2xl line-clamp-2 leading-relaxed select-text font-body-md">
            {trendingHero.description}
          </p>

          <div className="flex flex-wrap gap-3 pt-3">
            <button 
              onClick={() => onPlayMovie(trendingHero)}
              className="flex items-center gap-2 bg-primary text-on-primary px-6 md:px-8 py-3.5 rounded-xl font-bold text-sm md:text-base hover:scale-105 active:scale-95 transition-all shadow-[0_4px_25px_rgba(205,189,255,0.4)] pulse-btn cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              Play
            </button>
            <button 
              onClick={() => onToggleMyList(trendingHero.id)}
              className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white px-5 md:px-7 py-3.5 rounded-xl font-bold text-sm md:text-base hover:bg-white/20 transition-all active:scale-95 cursor-pointer"
            >
              {isFav(trendingHero.id) ? <Check className="w-4 h-4 text-emerald-400" /> : <Plus className="w-4 h-4 text-white" />}
              My List
            </button>
            <button 
              onClick={() => onSelectMovie(trendingHero)}
              className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md border border-white/10 text-on-surface-variant px-4 py-3.5 rounded-xl text-xs md:text-sm font-semibold hover:text-white transition-all cursor-pointer"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Continue Watching Row */}
      <section className="space-y-4 animate-entrance-row-1">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-lg md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2 font-headline-md">
            <Sparkles className="w-5 h-5 text-secondary" />
            Continue Watching
          </h3>
          <span className="text-[10px] md:text-xs text-primary font-bold flex items-center gap-1 cursor-pointer hover:underline">
            SEE ALL
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div 
          ref={continueRef}
          onWheel={(e) => handleWheelScroll(continueRef, e)}
          className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth snap-x"
        >
          {continueWatching.map((movie) => (
            <div 
              key={movie.id}
              className="flex-none w-[260px] md:w-[320px] group cursor-pointer snap-start"
            >
              <div 
                onClick={() => onSelectMovie(movie)}
                className="relative glass-card rounded-xl border border-white/10 overflow-hidden aspect-video mb-3 shadow-lg"
              >
                <img 
                  src={movie.image} 
                  alt={movie.title} 
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500" 
                />
                
                {/* Simulated playback hover play icon overlay */}
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlayMovie(movie);
                  }}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <div className="p-3 bg-primary rounded-full text-on-primary shadow-xl scale-90 group-hover:scale-100 transition-transform">
                    <Play className="w-5 h-5 fill-current" />
                  </div>
                </div>

                {/* Progress bars bottom layer */}
                {movie.progress && (
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-white/15">
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-secondary" 
                      style={{ width: `${movie.progress}%` }}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-between items-start gap-2 px-1">
                <div>
                  <h4 onClick={() => onSelectMovie(movie)} className="font-extrabold text-white text-sm md:text-base truncate group-hover:text-primary transition-colors">
                    {movie.title}
                  </h4>
                  <p className="text-xs text-on-surface-variant font-medium mt-0.5 font-caption">
                    {movie.seasonEpisode}
                  </p>
                </div>
                <button 
                  onClick={() => onToggleMyList(movie.id)}
                  className="p-1 px-2 border border-white/10 hover:border-white/20 rounded text-[10px] text-on-surface-variant hover:text-white"
                >
                  {isFav(movie.id) ? 'Saved' : '+ List'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recently Added Row */}
      <section className="space-y-4 animate-entrance-row-2">
        <div className="px-2">
          <h3 className="text-lg md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2 font-headline-md">
            <Tv className="w-5 h-5 text-primary" />
            Recently Added
          </h3>
        </div>

        <div 
          ref={recentRef}
          onWheel={(e) => handleWheelScroll(recentRef, e)}
          className="flex gap-4 overflow-x-auto hide-scrollbar pb-4 -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth snap-x"
        >
          {recentlyAdded.map((movie) => (
            <div 
              key={movie.id}
              className="flex-none w-[150px] md:w-[190px] group cursor-pointer snap-start"
            >
              <div 
                onClick={() => onSelectMovie(movie)}
                className="relative glass-card rounded-xl border border-white/10 overflow-hidden aspect-[2/3] mb-3 shadow-lg"
              >
                <img 
                  src={movie.image} 
                  alt={movie.title} 
                  className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500" 
                />
                
                {/* Shimmer sweep effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent" />
                
                {/* Tech specifications top absolute badges if any */}
                {movie.id === 'night-crawler' && (
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 border border-white/10 text-[9px] font-bold text-primary backdrop-blur-md">
                    4K HDR
                  </div>
                )}
                {movie.id === 'star-weaver' && (
                  <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 border border-white/10 text-[9px] font-bold text-primary backdrop-blur-md">
                    HD
                  </div>
                )}
              </div>

              <div className="px-1 space-y-0.5">
                <h4 onClick={() => onSelectMovie(movie)} className="font-extrabold text-white text-xs md:text-sm truncate group-hover:text-primary transition-colors">
                  {movie.title}
                </h4>
                <div className="flex justify-between items-center text-[10px] text-on-surface-variant font-mono">
                  <span>{movie.duration}</span>
                  <span>★ {movie.rating}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Top Rated Movies Bento Grid Section */}
      <section className="space-y-6 pt-4 animate-entrance-row-3">
        <div className="px-2">
          <h3 className="text-lg md:text-2xl font-extrabold text-white tracking-tight font-headline-md">
            Top Rated Masterpieces
          </h3>
          <p className="text-xs text-on-surface-variant font-medium">Critical acclaim blockbusters exclusively curated on ETHERIA</p>
        </div>

        {/* Bento Grid layout */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
          {/* Big Bento Double Block */}
          {topRated.length > 0 && (
            <div 
              onClick={() => onSelectMovie(topRated[0])}
              className="relative glass-card rounded-2xl border border-white/10 overflow-hidden col-span-2 row-span-2 h-[280px] md:h-auto group cursor-pointer shadow-xl"
            >
              <img 
                src={topRated[0].image} 
                alt={topRated[0].title} 
                className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-700" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4 md:p-6 flex flex-col justify-end" />
              
              <div className="absolute bottom-0 left-0 w-full p-4 md:p-6 space-y-1 z-10 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex items-center gap-1 px-2.5 py-0.5 bg-yellow-400 text-neutral-950 font-black rounded text-[10px] md:text-xs">
                    <Star className="w-3 h-3 fill-current" />
                    {topRated[0].rating} Rating
                  </div>
                  <span className="text-[10px] md:text-xs text-on-surface-variant font-bold font-mono">Masterpiece</span>
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

          {/* Sibling cards of top rated */}
          {topRated.slice(1).map((movie) => (
            <div 
              key={movie.id}
              onClick={() => onSelectMovie(movie)}
              className="relative glass-card rounded-2xl border border-white/10 overflow-hidden h-[140px] md:h-[190px] group cursor-pointer shadow-lg"
            >
              <img 
                src={movie.image} 
                alt={movie.title} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              
              {/* Floating tags */}
              <div className="absolute bottom-0 left-0 w-full p-3 text-left">
                <span className="text-[9px] font-bold text-yellow-400 flex items-center gap-0.5">
                  ★ {movie.rating}
                </span>
                <h5 className="font-extrabold text-white text-xs md:text-sm truncate group-hover:text-primary transition-colors">
                  {movie.title}
                </h5>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
