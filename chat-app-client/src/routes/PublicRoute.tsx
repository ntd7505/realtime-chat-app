import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../features/auth/authStore';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function PublicRoute() {
  const status = useAuthStore(state => state.status);

  if (status === 'restoring') {
    return <LoadingSpinner fullCenter />;
  }

  if (status === 'authenticated') {
    return <Navigate to="/chat" replace />;
  }

  return <Outlet />;
}
