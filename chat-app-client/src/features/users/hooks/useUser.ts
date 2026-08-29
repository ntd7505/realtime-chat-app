import { useQuery } from '@tanstack/react-query';
import { userApi } from '../api/userApi';
import { useAuthStore } from '../../auth/authStore';

export const useUser = (userId: number) => {
  const status = useAuthStore(state => state.status);
  
  return useQuery({
    queryKey: ['users', userId],
    queryFn: () => userApi.getUserById(userId),
    enabled: status === 'authenticated' && !!userId && !isNaN(userId),
    retry: 1,
  });
};
