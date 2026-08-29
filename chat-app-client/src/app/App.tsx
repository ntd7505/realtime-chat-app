import { RouterProvider } from 'react-router-dom';
import { AppProviders } from './providers';
import { router } from './router';
import { useEffect } from 'react';
import { useAuthStore } from '../features/auth/authStore';
import { refreshToken } from '../lib/http/refreshToken';
import { authApi } from '@/features/auth/api/authApi';

export function App() {
  const setStatus = useAuthStore(state => state.setStatus);

  useEffect(() => {
    const restoreSession = async () => {
      setStatus('restoring');

      try {
        await authApi.csrf();

        const token = await refreshToken();

        if (!token) {
          setStatus('unauthenticated');
        }
      } catch {
        setStatus('unauthenticated');
      }
    };

    void restoreSession();
  }, [setStatus]);

  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
