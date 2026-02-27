import { apiClient } from '@/lib/api-client';
import type {
  AuthResponseDto,
  CreateUserDto,
  LoginDto,
  UserResponseDto,
} from '@/types/api';

export const authApi = {
  login: async (credentials: LoginDto) => {
    const response = await apiClient.post<AuthResponseDto>(
      '/auth/login',
      credentials,
    );
    return response.data;
  },

  register: async (data: CreateUserDto) => {
    const response = await apiClient.post<AuthResponseDto>('/auth/register', data);
    return response.data;
  },

  getProfile: async () => {
    const response = await apiClient.get<UserResponseDto>('/auth/profile');
    return response.data;
  },

  logout: async () => {
    await apiClient.post('/auth/logout');
  },
};
