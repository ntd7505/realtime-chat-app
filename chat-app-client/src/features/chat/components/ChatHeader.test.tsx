import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, expect, it, vi } from 'vitest';
import { useUserPresence } from '@/features/users/hooks/useUserPresence';
import { useChat } from '../hooks/useChats';
import { ChatHeader } from './ChatHeader';

vi.mock('../hooks/useChats', () => ({ useChat: vi.fn() }));
vi.mock('@/features/users/hooks/useUserPresence', () => ({ useUserPresence: vi.fn() }));

beforeEach(() => {
  vi.mocked(useChat).mockReturnValue({
    data: {
      id: 10,
      otherUser: { id: 2, displayName: 'Alice', avatarUrl: null },
    },
  } as never);
});

it('shows an accessible online state', () => {
  vi.mocked(useUserPresence).mockReturnValue({
    data: [{ userId: 2, online: true }],
    isPending: false,
    isError: false,
  } as never);

  render(<MemoryRouter><ChatHeader chatId={10} /></MemoryRouter>);

  expect(screen.getByText('Online')).toBeInTheDocument();
  expect(screen.getByLabelText('Online')).toBeInTheDocument();
});

it('does not mislabel an unavailable status as offline', () => {
  vi.mocked(useUserPresence).mockReturnValue({
    isPending: false,
    isError: true,
  } as never);

  render(<MemoryRouter><ChatHeader chatId={10} /></MemoryRouter>);

  expect(screen.getByText('Status unavailable')).toBeInTheDocument();
  expect(screen.queryByText('Offline')).not.toBeInTheDocument();
});

it('does not show stale presence from the previously selected chat', () => {
  vi.mocked(useUserPresence).mockReturnValue({
    data: [{ userId: 1, online: true }],
    isPending: false,
    isError: false,
  } as never);

  render(<MemoryRouter><ChatHeader chatId={10} /></MemoryRouter>);

  expect(screen.getByText('Checking status…')).toBeInTheDocument();
  expect(screen.queryByText('Online')).not.toBeInTheDocument();
});
