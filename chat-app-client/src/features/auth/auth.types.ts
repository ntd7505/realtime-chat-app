export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  avatarUrl?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthenticatedUser {
  id: number;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: AuthenticatedUser;
}

export interface AuthState {
  accessToken: string | null;
  user: AuthenticatedUser | null;
  status: 'idle' | 'restoring' | 'authenticated' | 'unauthenticated';
  setSession: (accessToken: string, user: AuthenticatedUser) => void;
  updateUser: (user: Partial<AuthenticatedUser>) => void;
  clearSession: () => void;
  setStatus: (status: AuthState['status']) => void;
}

