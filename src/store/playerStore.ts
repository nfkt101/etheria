import { create } from 'zustand';
import { MediaItem } from '../types';
import { useLibraryStore } from './libraryStore';

interface PlayerState {
  activeItem: MediaItem | null;
  open: (item: MediaItem) => void;
  close: () => void;
  updateProgress: (progress: number) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  activeItem: null,

  open: (item) => set({ activeItem: item }),

  close: () => set({ activeItem: null }),

  updateProgress: (progress) => {
    const { activeItem } = get();
    if (!activeItem) return;
    set({ activeItem: { ...activeItem, progress } });
    useLibraryStore.getState().updateItemProgress(activeItem.id, progress);
  },
}));
