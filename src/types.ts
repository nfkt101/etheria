export interface Episode {
  id: string;
  title: string;
  duration: string;
  image: string;
  description: string;
}

export interface MediaItem {
  id: string;
  title: string;
  description: string;
  type: 'movie' | 'tv';
  image: string;
  rating: number;
  tags: string[];
  progress: number;
  lastPlayedDate?: string;
  releaseYear: string;
  duration: string;
  genres: string[];
  tagline: string;
  director?: string;
  cast?: string[];
  episodes?: Episode[];
  seasonEpisode?: string;
}
