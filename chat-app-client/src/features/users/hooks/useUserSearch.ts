import { useQuery } from '@tanstack/react-query';
import { userApi } from '../api/userApi';
import { useAuthStore } from '../../auth/authStore';

export const useUserSearch = (keyword: string) => {
  const status = useAuthStore(state => state.status);
  const trimmedKeyword = keyword.trim();
  
  return useQuery({
    queryKey: ['users', 'search', trimmedKeyword],
    queryFn: () => userApi.searchUsers(trimmedKeyword),
    enabled: status === 'authenticated' && trimmedKeyword.length > 0,
    retry: 1,
  });
};
