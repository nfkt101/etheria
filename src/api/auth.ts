import { getServerUrl, DEVICE_AUTH_HEADER } from './client';

export const authenticateUser = async (
  username: string,
  password: string,
  serverUrl?: string
) => {
  const url = serverUrl || getServerUrl();
  const response = await fetch(`${url}/Users/AuthenticateByName`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Emby-Authorization': DEVICE_AUTH_HEADER,
    },
    body: JSON.stringify({ Username: username, Pw: password }),
  });

  if (!response.ok) throw new Error('Authentication failed');

  const data = await response.json();
  if (serverUrl) localStorage.setItem('jellyfin_server_url', serverUrl);
  localStorage.setItem('jellyfin_token', data.AccessToken);
  localStorage.setItem('jellyfin_user_id', data.User.Id);
  localStorage.setItem('jellyfin_username', data.User.Name);
  return data;
};

export const logout = () => {
  localStorage.removeItem('jellyfin_token');
  localStorage.removeItem('jellyfin_user_id');
  localStorage.removeItem('jellyfin_username');
};
