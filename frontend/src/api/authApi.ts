import apiClient from './client';
import type {
  AuthRequestDto,
  RegisterRequestDto,
  AuthResponseDto,
  RegisterResponseDto,
} from '@/types';

export const authApi = {
  login: async (data: AuthRequestDto): Promise<AuthResponseDto> => {
    const res = await apiClient.post<AuthResponseDto>('/api/auth/login', data);
    return res.data;
  },

  register: async (data: RegisterRequestDto): Promise<RegisterResponseDto> => {
    const res = await apiClient.post<RegisterResponseDto>('/api/auth/register', data);
    return res.data;
  },
};