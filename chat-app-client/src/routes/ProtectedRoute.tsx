import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../features/auth/authStore';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

export function ProtectedRoute() {
  const status = useAuthStore(state => state.status);

  if (status === 'restoring') {
    return <LoadingSpinner fullCenter />;
  }

  if (status === 'unauthenticated' || status === 'idle') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
