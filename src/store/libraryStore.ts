import { create } from 'zustand';
import { MediaItem } from '../types';
import { getItems } from '../api/library';

interface LibraryState {
  items: MediaItem[];
  loading: boolean;
  error: string | null;
  fetchItems: (userId: string) => Promise<void>;
  updateItemProgress: (itemId: string, progress: number) => void;

  // Derived selectors (call as functions)
  continueWatching: () => MediaItem[];
  recentlyAdded: () => MediaItem[];
  topRated: () => MediaItem[];
  heroItem: () => MediaItem | null;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  fetchItems: async (userId) => {
    set({ loading: true, error: null });
    try {
      const items = await getItems(userId);
      set({ items, loading: false });
    } catch (err: any) {
      set({ error: err.message || 'Failed to load library', loading: false });
    }
  },

  updateItemProgress: (itemId, progress) => {
    set((state) => ({
      items: state.items.map((m) =>
        m.id === itemId ? { ...m, progress, lastPlayedDate: new Date().toISOString() } : m
      ),
    }));
  },

  continueWatching: () =>
    get()
      .items.filter((m) => m.progress > 0 && m.progress < 95)
      .sort((a, b) => {
        const aDate = a.lastPlayedDate ? new Date(a.lastPlayedDate).getTime() : 0;
        const bDate = b.lastPlayedDate ? new Date(b.lastPlayedDate).getTime() : 0;
        return bDate - aDate;
      }),

  recentlyAdded: () => get().items.slice(0, 20),

  topRated: () =>
    [...get().items]
      .filter((m) => m.rating > 0)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 8),

  heroItem: () => {
    const items = get().items;
    if (!items.length) return null;
    return [...items].sort((a, b) => b.rating - a.rating)[0];
  },
}));
