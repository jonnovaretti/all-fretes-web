import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: false,
});

const getAccessTokenFromCookie = () => {
  if (typeof document === 'undefined') {
    return undefined;
  }

  const accessCookie = document.cookie
    .split('; ')
    .find(cookie => cookie.startsWith('access_token='));

  if (!accessCookie) {
    return undefined;
  }

  return decodeURIComponent(accessCookie.split('=')[1] || '');
};

apiClient.interceptors.request.use(config => {
  const accessToken = getAccessTokenFromCookie();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});
