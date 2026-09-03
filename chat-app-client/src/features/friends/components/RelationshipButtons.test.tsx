import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FriendRequestButton } from './FriendRequestButton';
import { BlockUserButton } from '@/features/blocks/components/BlockUserButton';
import {
  useCancelFriendRequest,
  useFriends,
  useReceivedFriendRequests,
  useSendFriendRequest,
} from '../hooks/useFriendships';
import { useBlockedUsers, useBlockUser, useUnblockUser } from '@/features/blocks/hooks/useUserBlocks';

vi.mock('../hooks/useFriendships', () => ({
  useSendFriendRequest: vi.fn(),
  useCancelFriendRequest: vi.fn(),
  useFriends: vi.fn(),
  useReceivedFriendRequests: vi.fn(),
}));

vi.mock('@/features/blocks/hooks/useUserBlocks', () => ({
  useBlockedUsers: vi.fn(),
  useBlockUser: vi.fn(),
  useUnblockUser: vi.fn(),
}));

describe('relationship action buttons', () => {
  const sendRequest = vi.fn();
  const cancelRequest = vi.fn();
  const resetRequest = vi.fn();
  const block = vi.fn();
  const unblock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useSendFriendRequest).mockReturnValue({
      mutate: sendRequest,
      reset: resetRequest,
      isPending: false,
      isError: false,
      isSuccess: false,
    } as never);
    vi.mocked(useCancelFriendRequest).mockReturnValue({
      mutate: cancelRequest,
      isPending: false,
      isError: false,
    } as never);
    vi.mocked(useFriends).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as never);
    vi.mocked(useReceivedFriendRequests).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as never);
    vi.mocked(useBlockedUsers).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as never);
    vi.mocked(useBlockUser).mockReturnValue({
      mutate: block,
      isPending: false,
      isError: false,
    } as never);
    vi.mocked(useUnblockUser).mockReturnValue({
      mutate: unblock,
      isPending: false,
      isError: false,
    } as never);
  });

  it('sends a friend request for the selected user', async () => {
    const user = userEvent.setup();
    render(<FriendRequestButton userId={9} />);

    await user.click(screen.getByRole('button', { name: 'Add friend' }));
    expect(sendRequest).toHaveBeenCalledWith(9);
  });

  it('allows a newly sent friend request to be cancelled', async () => {
    vi.mocked(useSendFriendRequest).mockReturnValue({
      mutate: sendRequest,
      reset: resetRequest,
      isPending: false,
      isError: false,
      isSuccess: true,
    } as never);
    const user = userEvent.setup();
    render(<FriendRequestButton userId={9} />);

    await user.click(screen.getByRole('button', { name: 'Cancel request' }));
    expect(cancelRequest).toHaveBeenCalledWith(9, expect.objectContaining({ onSuccess: expect.any(Function) }));
  });

  it('blocks an unblocked user and unblocks a blocked user', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<BlockUserButton userId={9} />);

    await user.click(screen.getByRole('button', { name: 'Block' }));
    expect(block).toHaveBeenCalledWith(9);

    vi.mocked(useBlockedUsers).mockReturnValue({
      data: [{ id: 9, displayName: 'Alice', avatarUrl: null }],
      isLoading: false,
    } as never);
    rerender(<BlockUserButton userId={9} />);

    await user.click(screen.getByRole('button', { name: 'Unblock' }));
    expect(unblock).toHaveBeenCalledWith(9);
  });
});
