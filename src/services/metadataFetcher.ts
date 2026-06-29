import { getServerUrl, getAuthHeaders, getToken } from '../api/client';
import { MediaItem } from '../types';

/**
 * Cleans a filename by removing common media tags, years, and formats.
 * Example: "Avatar.The.Way.of.Water.2022.1080p.BluRay.x264.mkv" -> "Avatar The Way of Water"
 */
export function cleanFilename(filename: string): { title: string; year: string } {
  // Remove file extension
  let name = filename.replace(/\.[^/.]+$/, "");

  // Replace dots, underscores, hyphens with spaces
  name = name.replace(/[._\-]/g, " ");

  // Extract year if present (e.g. 1999 or 2022)
  const yearMatch = name.match(/\b(19\d{2}|20\d{2})\b/);
  const year = yearMatch ? yearMatch[1] : "";

  // Remove common video metadata tags
  const tags = [
    /\b\d{3,4}p\b/gi, // 720p, 1080p, etc.
    /\b\d{1}k\b/gi,   // 4k, 8k, etc.
    /\buhd\b/gi,
    /\bbluray\b/gi,
    /\bweb-?dl\b/gi,
    /\bhdrip\b/gi,
    /\bdvdrip\b/gi,
    /\bx264\b/gi,
    /\bh264\b/gi,
    /\bx265\b/gi,
    /\bhevc\b/gi,
    /\bh265\b/gi,
    /\bdts\b/gi,
    /\b(aac|ac3|dd5\.1)\b/gi,
    /\b(multi|dual|eng|fre|rus)\b/gi,
    /\b(yts|yify|rarbg|ettv|fgt)\b/gi, // Release groups
    /\bseason\s*\d+\b/gi,
    /\bs\d{2}e\d{2}\b/gi,
  ];

  tags.forEach(tag => {
    name = name.replace(tag, "");
  });

  // Remove the extracted year from title if it was found
  if (year) {
    name = name.replace(new RegExp(`\\b${year}\\b`, 'g'), "");
  }

  // Clean extra whitespace
  name = name.replace(/\s+/g, " ").trim();

  return { title: name || filename, year };
}

export interface SearchMatch {
  id: string;
  title: string;
  description: string;
  type: 'movie' | 'tv';
  image: string;
  backdrop: string;
  rating: number;
  releaseYear: string;
  genres: string[];
  duration: string;
}

/**
 * Searches Jellyfin server for matching metadata based on the title.
 */
export async function searchCloudMetadata(query: string): Promise<SearchMatch[]> {
  const token = getToken();
  if (!token) return [];

  try {
    const url = `${getServerUrl()}/Search/Hints?SearchTerm=${encodeURIComponent(query)}&Limit=8`;
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      console.error('Metadata search failed');
      return [];
    }

    const data = await response.json();
    const items = data.SearchHints || [];

    return items
      .filter((item: any) => item.Type === 'Movie' || item.Type === 'Series')
      .map((item: any) => {
        const itemId = item.Id || item.ItemId;
        const type = item.Type === 'Movie' ? 'movie' : 'tv';

        // Construct authenticated image URLs
        const image = `${getServerUrl()}/Items/${itemId}/Images/Primary?quality=90&api_key=${token}`;
        const backdrop = `${getServerUrl()}/Items/${itemId}/Images/Backdrop?quality=80&api_key=${token}`;

        // Format duration (ticks to readable duration like "2h 10m" or "45m")
        let duration = '2h';
        if (item.RunTimeTicks) {
          const totalMinutes = Math.floor(item.RunTimeTicks / 600000000);
          const hrs = Math.floor(totalMinutes / 60);
          const mins = totalMinutes % 60;
          duration = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
        }

        return {
          id: itemId,
          title: item.Name,
          description: item.Overview || 'No description available.',
          type,
          image,
          backdrop,
          rating: item.CommunityRating ? Math.round(item.CommunityRating * 10) / 10 : 7.5,
          releaseYear: item.ProductionYear ? String(item.ProductionYear) : 'Unknown',
          genres: item.Genres || [],
          duration,
        };
      });
  } catch (error) {
    console.error('Error fetching metadata from Jellyfin:', error);
    return [];
  }
}
