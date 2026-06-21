export interface Episode {
  id: string;
  title: string;
  duration: string;
  image: string;
  description: string;
}

export interface Movie {
  id: string;
  title: string;
  description: string;
  type: 'movie' | 'tv';
  image: string;
  rating: number;
  tags: string[];
  category: 'trending' | 'continue' | 'recent' | 'top_rated';
  progress?: number; // percentage completed, e.g. 65
  seasonEpisode?: string; // e.g. "S2 • E5: The Crossing" or "2h 15m remaining"
  releaseYear: string;
  duration: string;
  genres: string[];
  tagline: string;
  director?: string;
  cast?: string[];
  episodes?: Episode[];
}

export type ActiveTab = 'home' | 'movies' | 'tv-shows' | 'search' | 'downloads' | 'server' | 'profile';

export type DeviceMode = 'desktop' | 'mobile';

export interface UserState {
  favorites: string[]; // movie IDs
  downloads: { [movieId: string]: 'queued' | 'downloading' | 'completed' | number }; // Status or progress %
  watchHistory: { movieId: string; timestamp: number; progress: number }[];
}
