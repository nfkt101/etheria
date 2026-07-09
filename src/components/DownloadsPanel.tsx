import React from 'react';
import { Play, Trash2, Monitor, Folder, CloudOff } from 'lucide-react';
import { useLibraryStore } from '../store/libraryStore';
import { usePlayerStore } from '../store/playerStore';
import { useDownloadsStore } from '../store/downloadsStore';

export default function DownloadsPanel() {
  const items = useLibraryStore((s) => s.items);
  const openPlayer = usePlayerStore((s) => s.open);
  const { downloads, removeDownload } = useDownloadsStore();

  const downloadedItems = items.filter((m) => downloads[m.id] !== undefined);

  const fakeSize = (duration: string) => {
    const hrs = parseFloat(duration) || 2;
    return duration.includes('h') ? `${(hrs * 1.6).toFixed(1)} GB` : '1.8 GB';
  };

  const totalGB = downloadedItems
    .reduce((sum, m) => {
      const status = downloads[m.id];
      const hrs = m.duration.includes('h') ? parseFloat(m.duration) : 1.8 / 1.6;
      if (status === 'completed') return sum + hrs * 1.6;
      if (typeof status === 'number') return sum + (status / 100) * hrs * 1.6;
      return sum;
    }, 0)
    .toFixed(1);

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-entrance-row-1 select-text">
      <div className="glass-card bg-[#141417]/95 border border-white/10 rounded-2xl p-5 md:p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1.5 flex-1">
          <div className="text-[10px] text-[#cdbdff] uppercase tracking-widest font-bold">
            Local Storage Diagnostic
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Folder className="w-5 h-5 text-primary" />
            Offline Video Vault
          </h2>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            Movies downloaded here can be played when disconnected from the Jellyfin server.
          </p>
          <div className="pt-2">
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-primary to-secondary h-full rounded-full transition-all duration-1000"
                style={{ width: `${Math.max(5, (parseFloat(totalGB) / 128) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-on-surface-variant font-mono pt-1">
              <span>{totalGB} GB Downloaded</span>
              <span>128 GB Max Cache</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs uppercase font-bold tracking-widest text-[#cdbdff]">
          Downloaded Catalog ({downloadedItems.length})
        </h3>

        {downloadedItems.length > 0 ? (
          <div className="space-y-3">
            {downloadedItems.map((item) => {
              const status = downloads[item.id];
              const isCompleted = status === 'completed';
              const pct = typeof status === 'number' ? status : 0;

              return (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row gap-4 p-4 bg-white/5 border border-white/5 rounded-xl justify-between items-start sm:items-center hover:bg-white/8 transition-all"
                >
                  <div className="flex gap-3.5 items-center w-full sm:w-auto">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-16 md:w-20 aspect-video object-cover rounded-lg border border-white/5"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-extrabold text-white text-sm md:text-base truncate leading-snug">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-[#cdbdff] font-medium leading-relaxed capitalize">
                        {item.type === 'movie' ? 'Film' : 'TV Series'} • {fakeSize(item.duration)}
                      </p>
                      {!isCompleted && (
                        <div className="mt-1 flex items-center gap-2 max-w-sm">
                          <div className="flex-1 bg-white/10 h-1 rounded-full overflow-hidden">
                            <div
                              className="bg-[#14d1ff] h-full rounded-full transition-all"
                              style={{ width: `${status === 'queued' ? 5 : pct}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-mono font-bold text-[#14d1ff]">
                            {status === 'queued' ? 'Queued' : `${pct}%`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => openPlayer(item)}
                      disabled={!isCompleted}
                      className="flex items-center gap-1.5 px-4 py-2 bg-primary text-on-primary font-bold rounded-lg text-xs hover:scale-103 active:scale-97 cursor-pointer disabled:opacity-30 transition-all select-none"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Play Offline
                    </button>
                    <button
                      onClick={() => removeDownload(item.id)}
                      className="p-2 border border-white/10 hover:border-red-500/30 text-on-surface-variant hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-colors cursor-pointer"
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
                Saved files appear here for offline playback without network access.
              </p>
            </div>
            <div className="text-xs text-[#cdbdff] bg-[#370096]/20 border border-[#cdbdff]/10 rounded-lg p-2 flex items-center gap-1.5 px-3">
              <Monitor className="w-3.5 h-3.5 text-primary" />
              <span>
                Tap <strong>Download Offline</strong> in any movie's Detail Panel.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
