import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginApi, registerApi } from '@/api/authApi';
import { useAuthStore } from '@/store/authStore';

// Tipurile sunt re-exportate din hook — paginile nu importa din types/ sau api/
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
}

export const useAuth = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [loginError, setLoginError]     = useState<string | null>(null);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const login = async (data: LoginFormData): Promise<void> => {
    setIsSubmitting(true);
    setLoginError(null);
    try {
      const response = await loginApi(data);
      setAuth({
        token:    response.token,
        userId:   response.userId,
        role:     response.role,
        fullName: response.fullName,
        email:    data.email,
      });
      navigate('/dashboard');
    } catch {
      setLoginError('Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const register = async (data: RegisterFormData): Promise<void> => {
    setIsSubmitting(true);
    setRegisterError(null);
    try {
      await registerApi({
        fullName: data.fullName,
        email:    data.email,
        password: data.password,
        role:     data.role,
      });
      navigate('/login');
    } catch (err) {
      setRegisterError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    login,
    register,
    loginError,
    registerError,
    isSubmitting,
  };
};