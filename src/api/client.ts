export const getServerUrl = (): string =>
  localStorage.getItem('jellyfin_server_url') || 'http://localhost:8096';

export const getToken = (): string | null =>
  localStorage.getItem('jellyfin_token');

export const getAuthHeaders = (): Record<string, string> => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'X-Emby-Token': token } : {}),
  };
};

export const DEVICE_AUTH_HEADER =
  'MediaBrowser Client="Etheria", Device="Web", DeviceId="etheria-web", Version="1.0.0"';
