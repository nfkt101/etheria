import { create } from 'zustand';
import { MediaItem } from '../types';

interface UiState {
  selectedItem: MediaItem | null;
  openModal: (item: MediaItem) => void;
  closeModal: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  selectedItem: null,
  openModal: (item) => set({ selectedItem: item }),
  closeModal: () => set({ selectedItem: null }),
}));
