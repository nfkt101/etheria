import { MediaItem } from '../types';
import { getServerUrl, getAuthHeaders } from './client';

const mapItem = (item: any, serverUrl: string): MediaItem => ({
  id: item.Id,
  title: item.Name,
  tagline: item.Tagline || '',
  description: item.Overview || 'No description available.',
  type: item.Type === 'Series' ? 'tv' : 'movie',
  image: `${serverUrl}/Items/${item.Id}/Images/Primary?fillHeight=800&fillWidth=600&quality=90`,
  rating: item.CommunityRating || 0,
  tags: item.Tags || [],
  releaseYear: item.ProductionYear?.toString() || '',
  duration: item.RunTimeTicks
    ? `${Math.floor(item.RunTimeTicks / 10000 / 60 / 60)}h ${Math.floor((item.RunTimeTicks / 10000 / 60) % 60)}m`
    : '',
  genres: item.Genres || [],
  director: '',
  cast: [],
  progress: item.UserData?.PlayedPercentage || 0,
  lastPlayedDate: item.UserData?.LastPlayedDate,
});

export const getItems = async (userId: string): Promise<MediaItem[]> => {
  const serverUrl = getServerUrl();
  const fields = 'Overview,Tags,Genres,RunTimeTicks,ProductionYear,Tagline,UserData';
  const response = await fetch(
    `${serverUrl}/Users/${userId}/Items?IncludeItemTypes=Movie,Series&Recursive=true&Fields=${fields}&SortBy=DateCreated&SortOrder=Descending`,
    { headers: getAuthHeaders() }
  );
  if (!response.ok) throw new Error('Failed to fetch items');
  const data = await response.json();
  return data.Items.map((item: any) => mapItem(item, serverUrl));
};

export const searchItems = async (userId: string, query: string): Promise<MediaItem[]> => {
  const serverUrl = getServerUrl();
  const fields = 'Overview,Tags,Genres,RunTimeTicks,ProductionYear,Tagline,UserData';
  const response = await fetch(
    `${serverUrl}/Users/${userId}/Items?SearchTerm=${encodeURIComponent(query)}&IncludeItemTypes=Movie,Series&Recursive=true&Fields=${fields}`,
    { headers: getAuthHeaders() }
  );
  if (!response.ok) throw new Error('Search failed');
  const data = await response.json();
  return data.Items.map((item: any) => mapItem(item, serverUrl));
};
