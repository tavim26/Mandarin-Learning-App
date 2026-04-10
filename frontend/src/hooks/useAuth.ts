import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/api/authApi';
import { useAuthStore } from '@/store/authStore';
import type { AuthRequestDto, RegisterRequestDto } from '@/types';

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setAuth, clearAuth, isAuthenticated, role, userId, fullName } =
    useAuthStore();
  const navigate = useNavigate();

  const login = async (data: AuthRequestDto) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await authApi.login(data);
      setAuth({ ...res });
      // Redirectioneaza pe baza rolului
      if (res.role === 'ADMIN') navigate('/admin/dashboard');
      else if (res.role === 'TEACHER') navigate('/teacher/dashboard');
      else navigate('/dashboard');
    } catch (err: unknown) {
      setError(extractErrorMessage(err, 'Email sau parola incorecte.'));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterRequestDto) => {
    setIsLoading(true);
    setError(null);
    try {
      await authApi.register(data);
      navigate('/login');
    } catch (err: unknown) {
      setError(extractErrorMessage(err, 'Inregistrarea a esuat.'));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearAuth();
    navigate('/login');
  };

  return {
    isLoading,
    error,
    isAuthenticated,
    role,
    userId,
    fullName,
    login,
    register,
    logout,
  };
};

// Helper intern — nu se exporta
const extractErrorMessage = (err: unknown, fallback: string): string => {
  if (
    typeof err === 'object' &&
    err !== null &&
    'response' in err &&
    typeof (err as { response?: { data?: { message?: string } } }).response
      ?.data?.message === 'string'
  ) {
    return (err as { response: { data: { message: string } } }).response.data
      .message;
  }
  return fallback;
};