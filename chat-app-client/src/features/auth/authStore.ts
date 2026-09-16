import { create } from 'zustand';
import type { AuthState, AuthenticatedUser } from './auth.types';


export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  status: 'idle',
  
  setSession: (accessToken: string, user: AuthenticatedUser) => {
    set({
      accessToken,
      user,
      status: 'authenticated',
    });
  },
  
  updateUser: (updatedFields: Partial<AuthenticatedUser>) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...updatedFields } : null,
    }));
  },
  
  clearSession: () => {
    set({
      accessToken: null,
      user: null,
      status: 'unauthenticated',
    });
  },
  
  setStatus: (status) => {
    set({ status });
  },
}));

