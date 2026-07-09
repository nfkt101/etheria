import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { getFavoriteIds, markFavorite, unmarkFavorite } from '../api/userdata';

export function useUserData() {
  const userId = useAuthStore((s) => s.userId);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('etheria_favorites') || '[]');
    } catch {
      return [];
    }
  });

  // Sync favorites from Jellyfin on mount
  useEffect(() => {
    if (!userId) return;
    getFavoriteIds(userId).then((ids) => {
      if (ids.length > 0) {
        setFavorites(ids);
        localStorage.setItem('etheria_favorites', JSON.stringify(ids));
      }
    });
  }, [userId]);

  const toggleFavorite = useCallback(
    async (itemId: string) => {
      if (!userId) return;
      const isFav = favorites.includes(itemId);
      const next = isFav ? favorites.filter((id) => id !== itemId) : [...favorites, itemId];
      setFavorites(next);
      localStorage.setItem('etheria_favorites', JSON.stringify(next));
      try {
        if (isFav) await unmarkFavorite(userId, itemId);
        else await markFavorite(userId, itemId);
      } catch {
        // Revert on failure
        setFavorites(favorites);
        localStorage.setItem('etheria_favorites', JSON.stringify(favorites));
      }
    },
    [userId, favorites]
  );

  const isFavorite = useCallback(
    (itemId: string) => favorites.includes(itemId),
    [favorites]
  );

  return { favorites, toggleFavorite, isFavorite };
}
