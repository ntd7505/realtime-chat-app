import { act, render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { IMessage } from '@stomp/stompjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/features/auth/authStore';
import { useStomp } from './stompContext';
import { RealtimeSync } from './RealtimeSync';

vi.mock('./stompContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./stompContext')>();
  return { ...actual, useStomp: vi.fn() };
});

describe('RealtimeSync', () => {
  let client: QueryClient;
  let receive: (frame: IMessage) => void;
  let status: 'disconnected' | 'connected';

  beforeEach(() => {
    client = new QueryClient();
    status = 'disconnected';
    useAuthStore.getState().setSession('token', {
      id: 1,
      email: 'user@example.test',
      displayName: 'User',
      avatarUrl: null,
      createdAt: '2026-09-01T00:00:00Z',
    });
    vi.mocked(useStomp).mockImplementation(() => ({
      status,
      publish: vi.fn(),
      subscribe: (_destination, handler) => {
        receive = handler;
        return vi.fn();
      },
    }));
  });

  afterEach(() => {
    client.clear();
    useAuthStore.getState().clearSession();
  });

  const renderSync = () =>
    render(
      <QueryClientProvider client={client}>
        <RealtimeSync />
      </QueryClientProvider>
    );

  it('invalidates chat state for a user event and ignores duplicate event IDs', () => {
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    renderSync();
    const event = {
      eventId: 'event-1',
      type: 'chat.updated',
      chatId: 10,
      payload: {},
      occurredAt: '2026-09-09T00:00:00Z',
    };

    act(() => receive({ body: JSON.stringify(event) } as IMessage));
    const callCount = invalidate.mock.calls.length;
    act(() => receive({ body: JSON.stringify(event) } as IMessage));

    expect(callCount).toBe(3);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['chats', 1, 'list'] });
    expect(invalidate.mock.calls).toHaveLength(callCount);
  });

  it('refetches user-scoped chat and friendship data after reconnect', () => {
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    const view = renderSync();

    status = 'connected';
    view.rerender(
      <QueryClientProvider client={client}>
        <RealtimeSync />
      </QueryClientProvider>
    );
    expect(invalidate).not.toHaveBeenCalled();

    status = 'disconnected';
    view.rerender(
      <QueryClientProvider client={client}>
        <RealtimeSync />
      </QueryClientProvider>
    );
    status = 'connected';
    view.rerender(
      <QueryClientProvider client={client}>
        <RealtimeSync />
      </QueryClientProvider>
    );

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['chats', 1] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['friendships', 1] });
  });
});
