import { getServerUrl, getAuthHeaders } from './client';

export const getFavoriteIds = async (userId: string): Promise<string[]> => {
  const response = await fetch(
    `${getServerUrl()}/Users/${userId}/Items?Filters=IsFavorite&Recursive=true&IncludeItemTypes=Movie,Series&Fields=Id`,
    { headers: getAuthHeaders() }
  );
  if (!response.ok) return [];
  const data = await response.json();
  return (data.Items || []).map((i: any) => i.Id as string);
};

export const markFavorite = async (userId: string, itemId: string): Promise<void> => {
  await fetch(`${getServerUrl()}/Users/${userId}/FavoriteItems/${itemId}`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });
};

export const unmarkFavorite = async (userId: string, itemId: string): Promise<void> => {
  await fetch(`${getServerUrl()}/Users/${userId}/FavoriteItems/${itemId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
};
