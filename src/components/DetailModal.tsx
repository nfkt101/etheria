import React, { useState } from 'react';
import { Movie } from '../types';
import { Play, Plus, Check, Star, X, Download, Film, Users, Calendar, Award } from 'lucide-react';

interface DetailModalProps {
  movie: Movie;
  onClose: () => void;
  onPlay: (movie: Movie) => void;
  isInMyList: boolean;
  onToggleMyList: () => void;
  downloadStatus: 'queued' | 'downloading' | 'completed' | number | undefined;
  onTriggerDownload: () => void;
}

export default function DetailModal({
  movie,
  onClose,
  onPlay,
  isInMyList,
  onToggleMyList,
  downloadStatus,
  onTriggerDownload
}: DetailModalProps) {
  const [activeEpisodeTab, setActiveEpisodeTab] = useState(movie.episodes?.[0]?.id || '');

  // Render a progress percentage if downloading
  const getDownloadButtonLabel = () => {
    if (!downloadStatus) return 'Download Offline';
    if (downloadStatus === 'queued') return 'Queued...';
    if (downloadStatus === 'completed') return 'Downloaded (Offline)';
    if (typeof downloadStatus === 'number') return `Downloading (${downloadStatus}%)`;
    return 'Download Offline';
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-entrance-hero overflow-y-auto">
      {/* Outer shell close hook */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

      {/* Main glass panel */}
      <div className="relative w-full max-w-4xl bg-[#141416]/90 border border-white/10 rounded-2xl md:rounded-3xl shadow-[0_0_50px_rgba(205,189,255,0.15)] overflow-hidden z-10 max-h-[90vh] overflow-y-auto hide-scrollbar">
        
        {/* Banner with layout fade */}
        <div className="relative w-full h-[320px] md:h-[420px] overflow-hidden">
          <img 
            src={movie.image} 
            alt={movie.title} 
            className="w-full h-full object-cover transform scale-102 transition-transform duration-700" 
          />
          {/* Dense bottom & top shadows for readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#141416] via-[#141416]/50 to-transparent" />
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

          {/* Close button floating hook */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/60 backdrop-blur-md border border-white/20 rounded-full text-white hover:scale-105 hover:bg-neutral-900 transition-all cursor-pointer z-20"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Title and Tagline header on banner bottom */}
          <div className="absolute bottom-6 left-0 w-full px-6 md:px-8">
            <div className="flex flex-wrap gap-2 items-center mb-2">
              <span className="px-2.5 py-0.5 bg-primary/20 border border-primary/40 rounded text-primary text-[10px] md:text-xs font-bold uppercase tracking-wider">
                {movie.type === 'movie' ? 'Cinematic Film' : 'Exclusive TV Series'}
              </span>
              <div className="flex items-center gap-1 text-yellow-400">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span className="text-xs font-bold">{movie.rating}</span>
              </div>
            </div>

            <h2 className="text-2xl md:text-4xl lg:text-5xl font-extrabold tracking-tight text-white select-text">
              {movie.title}
            </h2>
            {movie.tagline && (
              <p className="text-sm md:text-base text-on-surface-variant font-medium mt-1 italic tracking-wide">
                "{movie.tagline}"
              </p>
            )}
          </div>
        </div>

        {/* Content body split columns */}
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-on-background select-text">
          {/* Main Info Columns */}
          <div className="md:col-span-2 space-y-6">
            {/* Action buttons row */}
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => onPlay(movie)}
                className="flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-xl font-bold text-sm md:text-base hover:scale-103 active:scale-97 transition-all shadow-lg shadow-violet-500/25 pulse-btn cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                Play Feature
              </button>

              <button 
                onClick={onToggleMyList}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm md:text-base font-bold border transition-all cursor-pointer ${
                  isInMyList 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                }`}
              >
                {isInMyList ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                My List
              </button>

              <button 
                onClick={onTriggerDownload}
                disabled={downloadStatus === 'completed' || typeof downloadStatus === 'number'}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs md:text-sm font-bold border transition-all cursor-pointer ${
                  downloadStatus === 'completed' 
                    ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' 
                    : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                }`}
              >
                <Download className={`w-4 h-4 ${typeof downloadStatus === 'number' ? 'animate-bounce' : ''}`} />
                {getDownloadButtonLabel()}
              </button>
            </div>

            {/* Synopsis overview */}
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 font-headline-md">
                <Film className="w-4 h-4 text-primary" />
                Synopsis
              </h3>
              <p className="text-sm md:text-base text-on-surface-variant leading-relaxed font-body-md">
                {movie.description}
              </p>
            </div>

            {/* TV Show Episodes section */}
            {movie.episodes && movie.episodes.length > 0 && (
              <div className="space-y-4 pt-2 border-t border-white/5">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 font-headline-md">
                  <Film className="w-4 h-4 text-primary" />
                  Episodes & Chapters
                </h3>
                
                <div className="space-y-3">
                  {movie.episodes.map((ep) => (
                    <div 
                      key={ep.id}
                      onClick={() => onPlay({
                        ...movie,
                        title: `${movie.title}: ${ep.title}`,
                        tagline: ep.description,
                      })}
                      className="group flex flex-col md:flex-row gap-4 p-3 bg-white/5 border border-white/5 hover:border-white/15 rounded-xl cursor-pointer hover:bg-white/10 transition-all duration-300"
                    >
                      <div className="relative flex-shrink-0 w-full md:w-36 aspect-video rounded-lg overflow-hidden bg-zinc-900 border border-white/10">
                        <img src={ep.image} alt={ep.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-6 h-6 text-white fill-current" />
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <h4 className="font-bold text-white text-sm group-hover:text-primary transition-colors">{ep.title}</h4>
                          <span className="font-mono text-[11px] text-[#4cd6ff] bg-[#004e60]/20 px-2 py-0.5 rounded border border-[#004e60]/10">{ep.duration}</span>
                        </div>
                        <p className="text-xs text-on-surface-variant line-clamp-2">{ep.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Attributes details columns */}
          <div className="space-y-6 pt-6 md:pt-0 md:pl-6 border-t md:border-t-0 md:border-l border-white/5 text-sm">
            {/* Tech Tags capsules */}
            <div className="space-y-3">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#cdbdff]">Technical specifications</span>
              <div className="flex flex-wrap gap-2">
                {movie.tags.map((tag) => (
                  <span 
                    key={tag} 
                    className="px-2.5 py-1 text-xs font-semibold rounded bg-neutral-900 border border-white/15 text-[#cac3d8]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Release details */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-[#cdbdff]" />
                <div>
                  <div className="text-[10px] text-on-surface-variant uppercase font-semibold">Release Year</div>
                  <div className="text-white font-medium">{movie.releaseYear}</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Award className="w-4 h-4 text-[#cdbdff]" />
                <div>
                  <div className="text-[10px] text-on-surface-variant uppercase font-semibold">Duration</div>
                  <div className="text-white font-medium">{movie.duration}</div>
                </div>
              </div>

              {movie.director && (
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-[#cdbdff]" />
                  <div>
                    <div className="text-[10px] text-on-surface-variant uppercase font-semibold">Director</div>
                    <div className="text-white font-medium">{movie.director}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Genre list */}
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#cdbdff]">Genres</span>
              <div className="flex flex-wrap gap-1.5">
                {movie.genres.map((genre) => (
                  <span 
                    key={genre}
                    className="px-2.5 py-0.5 rounded-full text-xs bg-white/5 border border-white/10 text-on-surface-variant"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>

            {/* Cast Listing */}
            {movie.cast && (
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#cdbdff]">Principal Cast</span>
                <div className="space-y-1.5 text-[#e5e2e1]">
                  {movie.cast.map((actor) => (
                    <div key={actor} className="text-xs flex items-center gap-1.5 leading-tight">
                      <span className="w-1.5 h-1.5 bg-[#cdbdff] rounded-full inline-block" />
                      {actor}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
