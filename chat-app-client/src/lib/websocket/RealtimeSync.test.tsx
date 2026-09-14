import { act, cleanup, render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { IMessage } from '@stomp/stompjs';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { useAuthStore } from '@/features/auth/authStore';
import { useStomp, type StompConnection } from './stompContext';
import { RealtimeSync } from './RealtimeSync';

vi.mock('./stompContext', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./stompContext')>();
  return { ...actual, useStomp: vi.fn() };
});

describe('RealtimeSync', () => {
  let client: QueryClient;
  let receive: (frame: IMessage) => void;
  let status: 'disconnected' | 'connected';
  let publish: Mock<StompConnection['publish']>;

  beforeEach(() => {
    client = new QueryClient();
    status = 'disconnected';
    publish = vi.fn<StompConnection['publish']>();
    useAuthStore.getState().setSession('token', {
      id: 1,
      email: 'user@example.test',
      displayName: 'User',
      avatarUrl: null,
      createdAt: '2026-09-01T00:00:00Z',
    });
    vi.mocked(useStomp).mockImplementation(() => ({
      status,
      publish,
      subscribe: (_destination, handler) => {
        receive = handler;
        return vi.fn();
      },
    }));
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
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

  it('keeps presence alive only while realtime is connected', () => {
    vi.useFakeTimers();
    status = 'connected';
    const view = renderSync();

    expect(publish).toHaveBeenCalledOnce();
    expect(publish).toHaveBeenLastCalledWith('/app/presence/heartbeat', '');

    act(() => vi.advanceTimersByTime(30_000));
    expect(publish).toHaveBeenCalledTimes(2);

    status = 'disconnected';
    view.rerender(
      <QueryClientProvider client={client}>
        <RealtimeSync />
      </QueryClientProvider>
    );
    act(() => vi.advanceTimersByTime(60_000));

    expect(publish).toHaveBeenCalledTimes(2);

    status = 'connected';
    view.rerender(
      <QueryClientProvider client={client}>
        <RealtimeSync />
      </QueryClientProvider>
    );
    expect(publish).toHaveBeenCalledTimes(3);
    expect(publish).toHaveBeenLastCalledWith('/app/presence/heartbeat', '');
  });

  it('does not keep presence alive while realtime is disconnected', () => {
    vi.useFakeTimers();
    renderSync();

    act(() => vi.advanceTimersByTime(60_000));

    expect(publish).not.toHaveBeenCalled();
  });

  it('stops keeping presence alive after logout', () => {
    vi.useFakeTimers();
    status = 'connected';
    renderSync();
    expect(publish).toHaveBeenCalledOnce();

    act(() => useAuthStore.getState().clearSession());
    act(() => vi.advanceTimersByTime(60_000));

    expect(publish).toHaveBeenCalledOnce();
  });

  it('stops keeping presence alive after unmount', () => {
    vi.useFakeTimers();
    status = 'connected';
    const view = renderSync();
    expect(publish).toHaveBeenCalledOnce();

    view.unmount();
    act(() => vi.advanceTimersByTime(60_000));

    expect(publish).toHaveBeenCalledOnce();
  });

  it('tolerates a heartbeat racing with a socket close', () => {
    vi.useFakeTimers();
    status = 'connected';
    publish.mockImplementationOnce(() => {
      throw new Error('Realtime connection is not ready');
    });

    expect(() => renderSync()).not.toThrow();
    act(() => vi.advanceTimersByTime(30_000));

    expect(publish).toHaveBeenCalledTimes(2);
  });
});
