import apiClient from './client';
import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from '@/types';

export const loginApi = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/api/auth/login', data);
  return response.data;
};

export const registerApi = async (data: RegisterRequest): Promise<RegisterResponse> => {
  const response = await apiClient.post<RegisterResponse>('/api/auth/register', data);
  return response.data;
};