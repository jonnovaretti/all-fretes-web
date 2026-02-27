'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { useRouter } from 'next/navigation';
import { authApi } from '../api/auth-api';
import { toast } from '@/hooks/use-toast';

const TOKEN_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const setAuthCookies = (accessToken?: string, refreshToken?: string) => {
  if (accessToken) {
    document.cookie = `access_token=${encodeURIComponent(accessToken)}; path=/; max-age=${TOKEN_COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
  }

  if (refreshToken) {
    document.cookie = `refresh_token=${encodeURIComponent(refreshToken)}; path=/; max-age=${TOKEN_COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
  }
};

const clearAuthCookies = () => {
  document.cookie = 'access_token=; path=/; max-age=0; samesite=lax';
  document.cookie = 'refresh_token=; path=/; max-age=0; samesite=lax';
};

const getErrorMessage = (error: unknown, fallback: string) => {
  const axiosError = error as AxiosError<{ message?: string }>;
  return axiosError.response?.data?.message || fallback;
};

export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: data => {
      setAuthCookies(data.accessToken, data.refreshToken);
      queryClient.setQueryData(['user'], data.user);
      router.push('/');
      toast({
        title: 'Welcome back!',
        description: `Signed in as ${data.user.email}`,
      });
    },
    onError: (error: unknown) => {
      toast({
        variant: 'destructive',
        title: 'Oops!',
        description: getErrorMessage(error, 'Login failed'),
      });
    },
  });
}

export function useRegister() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: data => {
      setAuthCookies(data.accessToken, data.refreshToken);
      queryClient.setQueryData(['user'], data.user);
      router.push('/');
      toast({
        title: 'Welcome!',
        description: `Account created successfully`,
      });
    },
    onError: (error: unknown) => {
      toast({
        variant: 'destructive',
        title: 'Oops!',
        description: getErrorMessage(error, 'Registration failed'),
      });
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      clearAuthCookies();
      queryClient.setQueryData(['user'], null);
      toast({
        title: 'Signed out',
        description: 'You have been signed out',
      });
    },
    onError: (error: unknown) => {
      clearAuthCookies();
      toast({
        variant: 'destructive',
        title: 'Oops!',
        description: getErrorMessage(error, 'Logout failed'),
      });
    },
  });
}
