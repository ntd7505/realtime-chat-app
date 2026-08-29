import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../routes/ProtectedRoute';
import { PublicRoute } from '../routes/PublicRoute';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { ProfilePage } from '../features/users/pages/ProfilePage';
import { UserSearchPage } from '../features/users/pages/UserSearchPage';
import { UserDetailPage } from '../features/users/pages/UserDetailPage';
import { ChatPage } from '../features/chat/pages/ChatPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        path: '/',
        element: <Navigate to="/chat" replace />,
      },
      {
        path: '/users',
        element: <UserSearchPage />,
      },
      {
        path: '/users/:userId',
        element: <UserDetailPage />,
      },
      {
        path: '/profile',
        element: <ProfilePage />,
      },
      {
        path: '/chat',
        element: <ChatPage />,
      }
    ],
  },
  {
    element: <PublicRoute />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/register',
        element: <RegisterPage />,
      }
    ]
  },
]);
