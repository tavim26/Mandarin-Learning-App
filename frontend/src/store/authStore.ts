import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Role, AuthUser } from '@/types/auth';

// Forma datelor si actiunilor din store
interface AuthState {
  token: string | null;
  userId: number | null;
  role: Role | null;
  fullName: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AuthUser) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  // persist salveaza automat store-ul in localStorage
  persist(
    (set) => ({
      // Valorile initiale — utilizator neautentificat
      token: null,
      userId: null,
      role: null,
      fullName: null,
      isAuthenticated: false,

      // Apelata dupa login reusit — populeaza store-ul
      setAuth: (user: AuthUser) =>
        set({
          token: user.token,
          userId: user.userId,
          role: user.role,
          fullName: user.fullName,
          isAuthenticated: true,
        }),

      // Apelata la logout — reseteaza store-ul
      clearAuth: () =>
        set({
          token: null,
          userId: null,
          role: null,
          fullName: null,
          isAuthenticated: false,
        }),
    }),
    {
      // Numele cheii sub care se salveaza in localStorage
      name: 'auth-storage',
    }
  )
);