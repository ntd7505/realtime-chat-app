import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { expect, it, vi } from 'vitest';
import { ConversationList } from './ConversationList';
import { useChats } from '../hooks/useChats';

vi.mock('../hooks/useChats', () => ({ useChats: vi.fn() }));

it('allows loading more when no loaded conversations match the filter', async () => {
  const fetchNextPage = vi.fn();
  vi.mocked(useChats).mockReturnValue({
    data: { pages: [{ items: [{ id: 1, otherUser: { id: 2, displayName: 'Alice', avatarUrl: null }, lastMessage: null }] }] },
    hasNextPage: true, fetchNextPage,
  } as never);
  const user = userEvent.setup();
  render(<MemoryRouter><ConversationList activeChatId={null} /></MemoryRouter>);
  await user.type(screen.getByRole('searchbox'), 'Bob');
  expect(screen.getByText(/No loaded conversations match/)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Load more conversations' }));
  expect(fetchNextPage).toHaveBeenCalledTimes(1);
});
