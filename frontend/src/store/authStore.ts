import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Role, AuthUser } from '@/types/auth';

interface AuthState {
  token: string | null;
  userId: number | null;
  role: Role | null;
  fullName: string | null;
  email: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AuthUser) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      userId: null,
      role: null,
      fullName: null,
      email: null,
      isAuthenticated: false,

      setAuth: (user: AuthUser) =>
        set({
          token: user.token,
          userId: user.userId,
          role: user.role,
          fullName: user.fullName,
          email: user.email,
          isAuthenticated: true,
        }),

      clearAuth: () =>
        set({
          token: null,
          userId: null,
          role: null,
          fullName: null,
          email: null,
          isAuthenticated: false,
        }),
    }),
    { name: 'auth-storage' }
  )
);