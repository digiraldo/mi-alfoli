import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import api, { saveTokens, clearTokens } from '@/lib/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  updateProfile: (data: { fullName?: string; email?: string; avatarUrl?: string; currencyCode?: string; appWebUrl?: string; billingCycleDay?: number }) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const data = await api.post<{ user: User; accessToken: string; refreshToken: string }>(
            '/api/auth/login',
            { email, password, timezone }
          );
          saveTokens(data.accessToken, data.refreshToken);
          set({ user: data.user, isAuthenticated: true, isLoading: false });
        } catch (err: any) {
          set({ error: err.message || 'Error al iniciar sesión', isLoading: false });
        }
      },

      loginWithGoogle: async (credential) => {
        set({ isLoading: true, error: null });
        try {
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const data = await api.post<{ user: User; accessToken: string; refreshToken: string }>(
            '/api/auth/google',
            { token: credential, timezone }
          );
          saveTokens(data.accessToken, data.refreshToken);
          set({ user: data.user, isAuthenticated: true, isLoading: false });
        } catch (err: any) {
          set({ error: err.message || 'Error al autenticar con Google', isLoading: false });
        }
      },

      register: async (email, password, fullName) => {
        set({ isLoading: true, error: null });
        try {
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const data = await api.post<{ user: User; accessToken: string; refreshToken: string }>(
            '/api/auth/register',
            { email, password, fullName, timezone }
          );
          saveTokens(data.accessToken, data.refreshToken);
          set({ user: data.user, isAuthenticated: true, isLoading: false });
        } catch (err: any) {
          set({ error: err.message || 'Error al registrarse', isLoading: false });
        }
      },

      updateProfile: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const res = await api.put<{ user: User; message: string }>('/api/auth/profile', data);
          set({ user: res.user, isLoading: false });
        } catch (err: any) {
          set({ error: err.message || 'Error al actualizar perfil', isLoading: false });
          throw err;
        }
      },

      changePassword: async (currentPassword, newPassword) => {
        set({ isLoading: true, error: null });
        try {
          await api.put('/api/auth/profile/password', { currentPassword, newPassword });
          set({ isLoading: false });
        } catch (err: any) {
          set({ error: err.message || 'Error al cambiar contraseña', isLoading: false });
          throw err;
        }
      },

      logout: () => {
        clearTokens();
        set({ user: null, isAuthenticated: false });
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'mi-alfoli-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
