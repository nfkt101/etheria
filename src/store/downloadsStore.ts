import { create } from 'zustand';

type DownloadStatus = 'queued' | 'completed' | number;

interface DownloadsState {
  downloads: Record<string, DownloadStatus>;
  triggerDownload: (itemId: string) => void;
  removeDownload: (itemId: string) => void;
}

const load = (): Record<string, DownloadStatus> => {
  try {
    return JSON.parse(localStorage.getItem('etheria_downloads') || '{}');
  } catch {
    return {};
  }
};

const save = (downloads: Record<string, DownloadStatus>) => {
  localStorage.setItem('etheria_downloads', JSON.stringify(downloads));
};

export const useDownloadsStore = create<DownloadsState>((set, get) => ({
  downloads: load(),

  triggerDownload: (itemId) => {
    if (get().downloads[itemId] !== undefined) return;
    const update = (patch: Record<string, DownloadStatus>) => {
      set((s) => {
        const next = { ...s.downloads, ...patch };
        save(next);
        return { downloads: next };
      });
    };
    update({ [itemId]: 'queued' });
    let pct = 0;
    const interval = setInterval(() => {
      pct += 10;
      if (pct >= 100) {
        clearInterval(interval);
        update({ [itemId]: 'completed' });
      } else {
        update({ [itemId]: pct });
      }
    }, 800);
  },

  removeDownload: (itemId) => {
    set((s) => {
      const next = { ...s.downloads };
      delete next[itemId];
      save(next);
      return { downloads: next };
    });
  },
}));
