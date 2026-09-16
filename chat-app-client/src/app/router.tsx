import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../routes/ProtectedRoute';
import { PublicRoute } from '../routes/PublicRoute';
import { RootLayout } from '../components/layout/RootLayout';
import { AppLayout } from '../components/layout/AppLayout';
import { ErrorState } from '../components/ui/ErrorState';

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: (
      <div className="flex items-center justify-center min-h-screen bg-[#d8eee2] p-4">
        <ErrorState title="Oops!" message="An unexpected error occurred." />
      </div>
    ),
    children: [
      {
        path: '/',
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppLayout />,
            children: [
              {
                path: '/',
                element: <Navigate to="/chat" replace />,
              },
              {
                path: '/users',
                lazy: async () => {
                  const { UserSearchPage } = await import('../features/users/pages/UserSearchPage');
                  return { Component: UserSearchPage };
                },
              },
              {
                path: '/users/:userId',
                lazy: async () => {
                  const { UserDetailPage } = await import('../features/users/pages/UserDetailPage');
                  return { Component: UserDetailPage };
                },
              },
              {
                path: '/profile',
                lazy: async () => {
                  const { ProfilePage } = await import('../features/users/pages/ProfilePage');
                  return { Component: ProfilePage };
                },
              },
              {
                path: '/chat',
                lazy: async () => {
                  const { ChatPage } = await import('../features/chat/pages/ChatPage');
                  return { Component: ChatPage };
                },
              },
              {
                path: '/connections',
                lazy: async () => {
                  const { ConnectionsPage } = await import('../features/friends/pages/ConnectionsPage');
                  return { Component: ConnectionsPage };
                },
              },
            ],
          },
        ],
      },
      {
        element: <PublicRoute />,
        children: [
          {
            path: '/login',
            lazy: async () => {
              const { LoginPage } = await import('../features/auth/pages/LoginPage');
              return { Component: LoginPage };
            },
          },
          {
            path: '/register',
            lazy: async () => {
              const { RegisterPage } = await import('../features/auth/pages/RegisterPage');
              return { Component: RegisterPage };
            },
          },
        ],
      },
      {
        path: '*',
        element: (
          <div className="flex items-center justify-center min-h-[100dvh] bg-[#d8eee2] p-4 text-center">
            <ErrorState title="404 Not Found" message="The page you are looking for doesn't exist." />
          </div>
        ),
      },
    ],
  },
]);
