'use server';

import { getAccessToken } from '@/modules/auth/api/get-access-token';

interface FetchWithAuthConfig extends RequestInit {
  revalidatePaths?: string[];
}

export async function fetchWithAuth(
  url: string,
  config: FetchWithAuthConfig = {},
) {
  const { headers, ...rest } = config;
  delete (rest as FetchWithAuthConfig).revalidatePaths;
  const accessToken = await getAccessToken();
  const requestHeaders = new Headers(headers);

  if (accessToken) {
    requestHeaders.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
    ...rest,
    headers: requestHeaders,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Request failed');
  }

  return response;
}
