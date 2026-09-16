import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/authApi';
import { useAuthStore } from '../authStore';
import type { LoginRequest, RegisterRequest } from '../auth.types';
import { invalidatePendingRefresh } from '@/lib/http/refreshToken';


export const useAuth = () => {
  const queryClient = useQueryClient();
  const { user, accessToken, status, clearSession, setSession } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: (request: LoginRequest) => authApi.login(request),
    onSuccess: (data) => {
      setSession(data.accessToken, data.user);
    },
  });

  const registerMutation = useMutation({
    mutationFn: (request: RegisterRequest) => authApi.register(request),
  });

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onMutate: () => {
      invalidatePendingRefresh();
    },
    onSuccess: () => {
      clearSession();
      queryClient.clear();
    },
  });

  return {
    user,
    accessToken,
    status,
    isAuthenticated: status === 'authenticated',
    isRestoring: status === 'restoring',
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
  };
};
