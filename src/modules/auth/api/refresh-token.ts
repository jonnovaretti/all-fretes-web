import { apiClient } from '@/lib/api-client';
import { queryClient } from '@/app/providers';

const TOKEN_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const syncTokenCookies = (accessToken?: string, refreshToken?: string) => {
  if (accessToken) {
    document.cookie = `access_token=${encodeURIComponent(accessToken)}; path=/; max-age=${TOKEN_COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
  }

  if (refreshToken) {
    document.cookie = `refresh_token=${encodeURIComponent(refreshToken)}; path=/; max-age=${TOKEN_COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
  }
};

export async function refreshToken() {
  try {
    console.log('Attempting refresh token...');
    const response = await apiClient.post(
      '/auth/refresh',
      {},
      {
        withCredentials: true,
      },
    );
    console.log('Refresh response:', response.data);
    if (!response.data?.success) {
      throw new Error('Refresh failed');
    }

    syncTokenCookies(response.data?.accessToken, response.data?.refreshToken);
    return response.data;
  } catch (error) {
    console.error('Refresh error:', error);
    queryClient.setQueryData(['user'], null);
    throw error;
  }
}
