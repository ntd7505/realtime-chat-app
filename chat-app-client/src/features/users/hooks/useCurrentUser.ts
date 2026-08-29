import { useQuery } from '@tanstack/react-query';
import { userApi } from '../api/userApi';
import { useAuthStore } from '../../auth/authStore';

export const useCurrentUser = () => {
  const status = useAuthStore(state => state.status);
  
  return useQuery({
    queryKey: ['users', 'me'],
    queryFn: () => userApi.getCurrentUser(),
    enabled: status === 'authenticated',
    retry: 1,
  });
};
