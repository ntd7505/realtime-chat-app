export interface User {
  id: number;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  createdAt: string;
}

export type UserSummary = Pick<User, 'id' | 'displayName' | 'avatarUrl'>;

export interface UserPresence {
  userId: number;
  online: boolean;
}
