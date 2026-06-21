import React from 'react';
import { Movie } from '../types';
import { Play, Trash2, ShieldAlert, Monitor, Sparkles, Folder, CloudOff } from 'lucide-react';

interface DownloadsPanelProps {
  movies: Movie[];
  downloads: { [movieId: string]: 'queued' | 'downloading' | 'completed' | number };
  onPlay: (movie: Movie) => void;
  onRemoveDownload: (id: string) => void;
}

export default function DownloadsPanel({ 
  movies, 
  downloads, 
  onPlay, 
  onRemoveDownload 
}: DownloadsPanelProps) {
  
  // Find movies that are currently added to downloads
  const downloadedMovies = movies.filter((m) => downloads[m.id] !== undefined);

  // Compute total simulated space used (e.g. 1.8 GB per hour duration roughly)
  const computeFakeSize = (duration: string) => {
    if (duration.includes('h')) {
      const hrs = parseFloat(duration) || 2;
      return `${(hrs * 1.6).toFixed(1)} GB`;
    }
    return '1.8 GB';
  };

  const computeTotalSpaceUsed = () => {
    let sizeSum = 0;
    downloadedMovies.forEach((m) => {
      const status = downloads[m.id];
      if (status === 'completed') {
        sizeSum += m.duration.includes('h') ? parseFloat(m.duration) * 1.6 : 1.8;
      } else if (typeof status === 'number') {
        sizeSum += (status / 100) * (m.duration.includes('h') ? parseFloat(m.duration) * 1.6 : 1.8);
      }
    });
    return sizeSum.toFixed(1);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-entrance-row-1 select-text">
      
      {/* Storage capacity banner card */}
      <div className="glass-card bg-[#141417]/95 border border-white/10 rounded-2xl p-5 md:p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1.5 flex-1">
          <div className="text-[10px] text-[#cdbdff] uppercase tracking-widest font-bold font-label-md">Local Storage Diagnostic</div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Folder className="w-5.5 h-5.5 text-primary" />
            Offline Video Vault
          </h2>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Movies downloaded here can be played in full high-fidelity when disconnected from ETHERIA Origin nodes (for planes, subways, or remote exploration).
          </p>

          {/* Progress gauge bar */}
          <div className="pt-2">
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-primary to-secondary h-full rounded-full transition-all duration-1000"
                style={{ width: `${Math.max(5, (parseFloat(computeTotalSpaceUsed()) / 128) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-on-surface-variant font-mono pt-1">
              <span>{computeTotalSpaceUsed()} GB Downloaded</span>
              <span>128 GB Max Secure Cache</span>
            </div>
          </div>
        </div>
      </div>

      {/* Downloads list section */}
      <div className="space-y-4">
        <h3 className="text-xs uppercase font-bold tracking-widest text-[#cdbdff]">Downloaded Catalog ({downloadedMovies.length})</h3>

        {downloadedMovies.length > 0 ? (
          <div className="space-y-3">
            {downloadedMovies.map((movie) => {
              const status = downloads[movie.id];
              const isCompleted = status === 'completed';
              const progressPct = typeof status === 'number' ? status : 0;

              return (
                <div 
                  key={movie.id}
                  className="flex flex-col sm:flex-row gap-4 p-4 bg-white/5 border border-white/5 rounded-xl justify-between items-start sm:items-center hover:bg-white/8 transition-all"
                >
                  {/* Info details core */}
                  <div className="flex gap-3.5 items-center w-full sm:w-auto">
                    <img 
                      src={movie.image} 
                      alt={movie.title} 
                      className="w-16 md:w-20 aspect-video object-cover rounded-lg border border-white/5" 
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-extrabold text-white text-sm md:text-base truncate leading-snug">
                        {movie.title}
                      </h4>
                      <p className="text-[11px] text-[#cdbdff] font-medium leading-relaxed font-caption capitalize">
                        {movie.type === 'movie' ? 'Film' : 'TV Series'} • {computeFakeSize(movie.duration)}
                      </p>
                      
                      {/* Active downloader status display */}
                      {!isCompleted && (
                        <div className="mt-1 flex items-center gap-2 max-w-sm">
                          <div className="flex-1 bg-white/10 h-1 rounded-full overflow-hidden">
                            <div 
                              className="bg-[#14d1ff] h-full rounded-full transition-all"
                              style={{ width: `${status === 'queued' ? 5 : progressPct}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-mono font-bold text-[#14d1ff]">
                            {status === 'queued' ? 'Queued' : `${progressPct}%`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => onPlay(movie)}
                      disabled={!isCompleted}
                      className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary font-bold rounded-lg text-xs hover:scale-103 active:scale-97 cursor-pointer disabled:opacity-30 transition-all select-none"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Play Offline
                    </button>

                    <button
                      onClick={() => onRemoveDownload(movie.id)}
                      className="p-2 border border-white/10 hover:border-red-500/30 text-on-surface-variant hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-colors cursor-pointer"
                      title="Purge Download Cache"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 bg-white/3 border border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center space-y-4 text-center">
            <CloudOff className="w-10 h-10 text-on-surface-variant/30 animate-pulse" />
            <div className="space-y-1">
              <p className="font-bold text-white text-sm">No offline downloads saved</p>
              <p className="text-xs text-on-surface-variant px-6 max-w-sm">
                Saved files will appear here so you can browse, listen, and watch offline catalogs without network access points.
              </p>
            </div>
            
            {/* Direct hook */}
            <div className="text-xs text-[#cdbdff] bg-[#370096]/20 border border-[#cdbdff]/10 rounded-lg p-2 flex items-center gap-1.5 px-3">
              <Monitor className="w-3.5 h-3.5 text-primary" />
              <span>Tap <strong>Learn More</strong> or <strong>Download Offline</strong> in any movie's Detail Panel to add offline caches.</span>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
