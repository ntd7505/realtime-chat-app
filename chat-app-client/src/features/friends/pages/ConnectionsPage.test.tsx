import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConnectionsPage } from './ConnectionsPage';
import {
  useAcceptFriendRequest,
  useCancelFriendRequest,
  useFriends,
  useReceivedFriendRequests,
  useSentFriendRequests,
  useUnfriend,
} from '../hooks/useFriendships';
import { useBlockedUsers, useUnblockUser } from '@/features/blocks/hooks/useUserBlocks';
import { useStartDirectChat } from '@/features/chat/hooks/useStartDirectChat';

vi.mock('../hooks/useFriendships', () => ({
  useFriends: vi.fn(),
  useReceivedFriendRequests: vi.fn(),
  useSentFriendRequests: vi.fn(),
  useAcceptFriendRequest: vi.fn(),
  useCancelFriendRequest: vi.fn(),
  useUnfriend: vi.fn(),
}));

vi.mock('@/features/blocks/hooks/useUserBlocks', () => ({
  useBlockedUsers: vi.fn(),
  useUnblockUser: vi.fn(),
}));

vi.mock('@/features/chat/hooks/useStartDirectChat', () => ({
  useStartDirectChat: vi.fn(),
}));

const alice = { id: 2, displayName: 'Alice Nguyen', avatarUrl: null };
const bob = { id: 3, displayName: 'Bob Tran', avatarUrl: null };
const charlie = { id: 4, displayName: 'Charlie Le', avatarUrl: null };
const dana = { id: 5, displayName: 'Dana Pham', avatarUrl: null };

describe('ConnectionsPage', () => {
  const accept = vi.fn();
  const decline = vi.fn();
  const unfriend = vi.fn();
  const unblock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(useFriends).mockReturnValue({
      data: [alice],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    vi.mocked(useReceivedFriendRequests).mockReturnValue({
      data: [bob],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    vi.mocked(useSentFriendRequests).mockReturnValue({
      data: [dana],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    vi.mocked(useBlockedUsers).mockReturnValue({
      data: [charlie],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);

    vi.mocked(useAcceptFriendRequest).mockReturnValue({
      mutate: accept,
      isPending: false,
      isError: false,
      variables: undefined,
    } as never);
    vi.mocked(useCancelFriendRequest).mockReturnValue({
      mutate: decline,
      isPending: false,
      isError: false,
      variables: undefined,
    } as never);
    vi.mocked(useUnfriend).mockReturnValue({
      mutate: unfriend,
      isPending: false,
      isError: false,
      variables: undefined,
    } as never);
    vi.mocked(useUnblockUser).mockReturnValue({
      mutate: unblock,
      isPending: false,
      isError: false,
      variables: undefined,
    } as never);
    vi.mocked(useStartDirectChat).mockReturnValue({
      startDirectChat: vi.fn(),
      isPending: false,
      isError: false,
    } as never);
  });

  const renderPage = () =>
    render(
      <MemoryRouter>
        <ConnectionsPage />
      </MemoryRouter>
    );

  it('renders friends, requests, and blocked users in their tabs', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(screen.getByText('Alice Nguyen')).toBeTruthy();

    await user.click(screen.getByRole('tab', { name: /requests/i }));
    expect(screen.getByText('Bob Tran')).toBeTruthy();

    await user.click(screen.getByRole('tab', { name: /sent/i }));
    expect(screen.getByText('Dana Pham')).toBeTruthy();

    await user.click(screen.getByRole('tab', { name: /blocked/i }));
    expect(screen.getByText('Charlie Le')).toBeTruthy();
  });

  it('moves selection and focus with arrows, Home and End', async () => {
    const user = userEvent.setup();
    renderPage();
    screen.getByRole('tab', { name: /friends/i }).focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: /requests/i })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: /sent/i })).toHaveFocus();
    await user.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: /friends/i })).toHaveFocus();
    await user.keyboard('{End}');
    const tab = screen.getByRole('tab', { name: /blocked/i });
    expect(tab).toHaveFocus();
    expect(tab).toHaveAttribute('aria-controls', screen.getByRole('tabpanel').id);
  });

  it('calls the matching mutation for every connection action', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: /unfriend alice nguyen/i }));
    expect(unfriend).toHaveBeenCalledWith(alice.id);

    await user.click(screen.getByRole('tab', { name: /requests/i }));
    await user.click(screen.getByRole('button', { name: /accept bob tran/i }));
    await user.click(screen.getByRole('button', { name: /decline bob tran/i }));
    expect(accept).toHaveBeenCalledWith(bob.id);
    expect(decline).toHaveBeenCalledWith(bob.id);

    await user.click(screen.getByRole('tab', { name: /sent/i }));
    await user.click(screen.getByRole('button', { name: /cancel request to dana pham/i }));
    expect(decline).toHaveBeenCalledWith(dana.id);

    await user.click(screen.getByRole('tab', { name: /blocked/i }));
    await user.click(screen.getByRole('button', { name: /unblock charlie le/i }));
    expect(unblock).toHaveBeenCalledWith(charlie.id);
  });
});
