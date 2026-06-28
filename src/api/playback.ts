import { getServerUrl, getAuthHeaders, getToken } from './client';

export const getPlaybackInfo = async (itemId: string, userId: string) => {
  const response = await fetch(`${getServerUrl()}/Items/${itemId}/PlaybackInfo?UserId=${userId}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ DeviceProfile: { MaxStreamingBitrate: 140000000 } }),
  });
  if (!response.ok) throw new Error('Failed to fetch playback info');
  return response.json();
};

export const buildDirectStreamUrl = (
  itemId: string,
  mediaSourceId: string,
  audioStreamIndex?: number
): string => {
  let url = `${getServerUrl()}/Videos/${itemId}/stream?static=true&MediaSourceId=${mediaSourceId}&api_key=${getToken()}`;
  if (audioStreamIndex !== undefined) url += `&AudioStreamIndex=${audioStreamIndex}`;
  return url;
};

export const buildSubtitleUrl = (
  itemId: string,
  mediaSourceId: string,
  subtitleIndex: number
): string =>
  `${getServerUrl()}/Videos/${itemId}/${mediaSourceId}/Subtitles/${subtitleIndex}/0/Stream.vtt?api_key=${getToken()}`;

export const reportPlaybackProgress = async (
  itemId: string,
  userId: string,
  positionTicks: number,
  isPaused = false
) => {
  try {
    await fetch(`${getServerUrl()}/Sessions/Playing/Progress`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        ItemId: itemId,
        UserId: userId,
        PositionTicks: positionTicks,
        IsPaused: isPaused,
      }),
    });
  } catch {
    // Non-critical — don't throw
  }
};

export const reportPlaybackStopped = async (
  itemId: string,
  userId: string,
  positionTicks: number
) => {
  try {
    await fetch(`${getServerUrl()}/Sessions/Playing/Stopped`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ ItemId: itemId, UserId: userId, PositionTicks: positionTicks }),
    });
  } catch {
    // Non-critical
  }
};
