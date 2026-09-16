import type { UserSummary } from '@/features/users/user.types';

export type FriendshipStatus = 'PENDING' | 'ACCEPTED';

export interface Friendship {
  id: number;
  requesterId: number;
  recipientId: number;
  status: FriendshipStatus;
  user: UserSummary;
  createdAt: string;
  updatedAt: string;
}
