import { create } from 'zustand';

interface AuthState {
  token: string | null;
  userId: string | null;
  username: string | null;
  isAuthenticated: boolean;
  hydrate: () => void;
  setAuth: (token: string, userId: string, username: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  userId: null,
  username: null,
  isAuthenticated: false,

  hydrate: () => {
    const token = localStorage.getItem('jellyfin_token');
    const userId = localStorage.getItem('jellyfin_user_id');
    const username = localStorage.getItem('jellyfin_username');
    set({ token, userId, username, isAuthenticated: !!token });
  },

  setAuth: (token, userId, username) => {
    set({ token, userId, username, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('jellyfin_token');
    localStorage.removeItem('jellyfin_user_id');
    localStorage.removeItem('jellyfin_username');
    set({ token: null, userId: null, username: null, isAuthenticated: false });
  },
}));
