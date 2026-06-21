import React, { useState } from 'react';
import { Movie } from '../types';
import { PROFILE_AVATAR } from '../data';
import { Shield, Sparkles, LogOut, Trash2, Award, Clock, Smartphone, User, Play, Heart } from 'lucide-react';

interface ProfilePanelProps {
  movies: Movie[];
  favorites: string[];
  watchHistory: { movieId: string; timestamp: number; progress: number }[];
  userName: string;
  onSelectMovie: (movie: Movie) => void;
  onClearHistory: () => void;
}

export default function ProfilePanel({
  movies,
  favorites,
  watchHistory,
  userName,
  onSelectMovie,
  onClearHistory
}: ProfilePanelProps) {
  const [subTier, setSubTier] = useState<'ultra' | 'standard'>('ultra');
  const favoriteMovies = movies.filter((m) => favorites.includes(m.id));

  // Simulated metrics
  const totalStreamTime = watchHistory.length > 0 ? watchHistory.length * 42 : 124; // minutes
  const activeStreak = 6; // days

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-entrance-row-1 text-on-background select-text">
      
      {/* Account Profile Header card */}
      <div className="glass-card bg-[#141416]/95 border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center gap-6">
        <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/50 flex-shrink-0 shadow-lg relative group">
          <img src={PROFILE_AVATAR} alt="User avatar" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
          <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <div className="flex-1 space-y-1.5 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">{userName}</h2>
            <span className="px-2 py-0.5 bg-[#cdbdff]/20 border border-[#cdbdff]/30 text-[#e8deff] text-[9px] font-mono font-bold rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-primary animate-pulse" />
              {subTier === 'ultra' ? 'Premium Cinephile Ultra' : 'Standard Member'}
            </span>
          </div>
          <p className="text-xs text-on-surface-variant font-medium">Subscriber since October 2024 • ID: #e53e890e</p>
          <p className="text-xs text-[#cac3d8] flex items-center justify-center md:justify-start gap-1 font-mono">
            <Smartphone className="w-3.5 h-3.5 text-[#14d1ff]" />
            Active Platform: Desktop & Mobile Simulator Sync
          </p>
        </div>

        {/* Plan Selectors */}
        <div className="flex md:flex-col gap-2 w-full sm:w-auto self-stretch justify-center items-center">
          <button 
            onClick={() => setSubTier('ultra')}
            className={`w-full px-4 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subTier === 'ultra' 
                ? 'bg-[#cdbdff]/20 border-[#cdbdff]/40 text-[#fcf6ff] shadow-md shadow-violet-500/10' 
                : 'bg-white/3 border-white/5 text-on-surface-variant hover:bg-white/10'
            }`}
          >
            Upgrade to Ultra (10-bit HDR)
          </button>
          <button 
            onClick={() => setSubTier('standard')}
            className={`w-full px-4 py-2 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subTier === 'standard' 
                ? 'bg-[#cdbdff]/20 border-[#cdbdff]/40 text-[#fcf6ff]' 
                : 'bg-white/3 border-white/5 text-on-surface-variant hover:bg-white/10'
            }`}
          >
            Standard Plan (HD Stereo)
          </button>
        </div>
      </div>

      {/* Grid of streaming diagnostics stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-1">
          <div className="flex justify-between text-on-surface-variant">
            <span className="text-xs font-semibold">Playout Accumulation</span>
            <Clock className="w-4 h-4 text-[#14d1ff]" />
          </div>
          <div className="text-2xl font-black text-white">{totalStreamTime} min</div>
          <p className="text-[10px] text-[#4cd6ff]">Total screening activity</p>
        </div>

        <div className="p-4 bg-white/5 border border-white/5 rounded-xl space-y-1">
          <div className="flex justify-between text-on-surface-variant">
            <span className="text-xs font-semibold">Consecutive Days</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{activeStreak} / 7 days</div>
          <p className="text-[10px] text-amber-400">Stream Streak Level 2</p>
        </div>
      </div>

      {/* Bookmarks list in My List */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs uppercase font-bold tracking-widest text-[#cdbdff] flex items-center gap-1.5">
          <Heart className="w-3.5 h-3.5 text-primary fill-current" />
          Saved in My List ({favoriteMovies.length})
        </h3>

        {favoriteMovies.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {favoriteMovies.map((movie) => (
              <div 
                key={movie.id}
                onClick={() => onSelectMovie(movie)}
                className="group p-3 bg-white/5 border border-white/5 hover:border-white/15 rounded-xl flex items-center justify-between cursor-pointer hover:bg-white/10 transition-all"
              >
                <div className="flex gap-3 items-center min-w-0">
                  <img src={movie.image} alt={movie.title} className="w-12 aspect-video object-cover rounded border border-white/10" />
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-white text-xs truncate group-hover:text-primary transition-colors">{movie.title}</h4>
                    <p className="text-[10px] text-on-surface-variant font-mono">{movie.duration} • ★ {movie.rating}</p>
                  </div>
                </div>
                <Play className="w-3.5 h-3.5 text-on-surface-variant group-hover:text-primary transition-colors group-hover:scale-110" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-on-surface-variant bg-white/3 p-4 rounded-xl border border-dashed border-white/10 text-center">
            No items bookmarked! Tap the <strong>My List</strong> button inside any film's detail screen to save bookmarks here.
          </p>
        )}
      </div>

      {/* Watching history session log */}
      <div className="space-y-3 pt-2">
        <div className="flex justify-between items-center">
          <h3 className="text-xs uppercase font-bold tracking-widest text-[#cdbdff]">Watching Log Sessions</h3>
          {watchHistory.length > 0 && (
            <button 
              onClick={onClearHistory}
              className="text-[10px] text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              Purge Log
            </button>
          )}
        </div>

        {watchHistory.length > 0 ? (
          <div className="space-y-2 max-h-48 overflow-y-auto hide-scrollbar border border-white/10 rounded-xl p-3 bg-black/30">
            {watchHistory.map((history, i) => {
              const matched = movies.find((m) => m.id === history.movieId);
              if (!matched) return null;

              return (
                <div key={i} className="flex justify-between items-center text-xs border-b border-white/5 pb-2 last:border-none last:pb-0">
                  <div className="space-y-0.5">
                    <div 
                      onClick={() => onSelectMovie(matched)}
                      className="font-bold text-white hover:text-primary transition-colors cursor-pointer"
                    >
                      {matched.title}
                    </div>
                    <div className="text-[10px] text-on-surface-variant font-mono">{formatTimestamp(history.timestamp)}</div>
                  </div>
                  <div className="text-right font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/10">
                    Saved progress: {history.progress}%
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-on-surface-variant bg-white/3 p-4 rounded-xl border border-dashed border-white/10 text-center">
            No play records stored. Pick any film and press <strong>Play</strong> to populate logs.
          </p>
        )}
      </div>

    </div>
  );
}
