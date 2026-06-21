import { Movie } from '../types';

export const getServerUrl = () => {
  return localStorage.getItem('jellyfin_server_url') || 'http://localhost:8096';
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem('jellyfin_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'X-Emby-Token': token } : {}),
  };
};

export const authenticateUser = async (username: string, password?: string, serverUrl?: string) => {
  const url = serverUrl || getServerUrl();
  const response = await fetch(`${url}/Users/AuthenticateByName`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Emby-Authorization': `MediaBrowser Client="Etheria", Device="Web", DeviceId="etheria-web", Version="1.0.0"`,
    },
    body: JSON.stringify({
      Username: username,
      Pw: password || '',
    }),
  });

  if (!response.ok) {
    throw new Error('Authentication failed');
  }

  const data = await response.json();
  if (serverUrl) {
    localStorage.setItem('jellyfin_server_url', serverUrl);
  }
  localStorage.setItem('jellyfin_token', data.AccessToken);
  localStorage.setItem('jellyfin_user_id', data.User.Id);
  return data;
};

export const getItems = async (userId: string): Promise<Movie[]> => {
  const response = await fetch(
    `${getServerUrl()}/Users/${userId}/Items?IncludeItemTypes=Movie,Series&Recursive=true&Fields=Overview,Tags,Genres,RunTimeTicks,PrimaryImageAspectRatio,ProductionYear`,
    {
      headers: getAuthHeaders(),
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch items');
  }

  const data = await response.json();
  
  return data.Items.map((item: any): Movie => {
    const isTv = item.Type === 'Series';
    return {
      id: item.Id,
      title: item.Name,
      tagline: '',
      description: item.Overview || 'No description available.',
      type: isTv ? 'tv' : 'movie',
      image: `${getServerUrl()}/Items/${item.Id}/Images/Primary?fillHeight=800&fillWidth=600&quality=90`,
      rating: item.CommunityRating || 0,
      tags: item.Tags || [],
      category: 'recent', 
      releaseYear: item.ProductionYear?.toString() || '',
      duration: item.RunTimeTicks ? Math.floor(item.RunTimeTicks / 10000 / 60 / 60) + 'h ' + Math.floor((item.RunTimeTicks / 10000 / 60) % 60) + 'm' : '',
      genres: item.Genres || [],
      director: '',
      cast: [],
      progress: item.UserData?.PlayedPercentage || 0,
    };
  });
};

export const getPlaybackInfo = async (itemId: string, userId: string) => {
  const response = await fetch(`${getServerUrl()}/Items/${itemId}/PlaybackInfo?UserId=${userId}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      DeviceProfile: {
        MaxStreamingBitrate: 140000000,
      }
    })
  });
  
  if (!response.ok) {
      throw new Error('Failed to fetch playback info');
  }
  
  const data = await response.json();
  return data;
};

export const buildDirectStreamUrl = (itemId: string, mediaSourceId: string) => {
  return `${getServerUrl()}/Videos/${itemId}/stream?static=true&MediaSourceId=${mediaSourceId}&api_key=${localStorage.getItem('jellyfin_token')}`;
};
