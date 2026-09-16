import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { IMessage } from '@stomp/stompjs';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useSendMessage, useMessages } from './useChats';
import { chatKeys } from '../chat.keys';
import { chatApi } from '../api/chatApi';
import { useAuthStore } from '@/features/auth/authStore';
import { useStomp } from '@/lib/websocket/stompContext';
import { useDraftStore, draftKey } from '../draftStore';
import type { MessageHistory } from '../messageCache';
import type { Message } from '../chat.types';

vi.mock('@/lib/websocket/stompContext', () => ({ useStomp: vi.fn() }));
let client: QueryClient;
let receive: (frame: IMessage) => void;
const publish = vi.fn();
const unsubscribe = vi.fn();
const sender = { id: 1, displayName: 'Alice', avatarUrl: null };
const oldMessage: Message = { id: 1, clientMessageId: 'old', content: 'Before', sender, createdAt: '2026-09-01T00:00:00Z' };
const variables = { chatId: 10, clientMessageId: '11111111-1111-4111-8111-111111111111', content: 'Hello' };
const confirmed: Message = { ...variables, id: 2, sender, createdAt: '2026-09-07T00:00:00Z' };
const key = chatKeys.messageHistory(1, 10, 30);
const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
const items = () => client.getQueryData<MessageHistory>(key)!.pages.flatMap((page) => page.items);

beforeEach(() => {
  vi.clearAllMocks();
  publish.mockReset();
  client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  useAuthStore.getState().setSession('test', { ...sender, email: 'test@example.test', createdAt: oldMessage.createdAt });
  useDraftStore.setState({ drafts: {} });
  client.setQueryData<MessageHistory>(key, { pages: [{ items: [oldMessage], hasNext: true, nextCursor: 'older' }], pageParams: [null] });
  vi.mocked(useStomp).mockReturnValue({ status: 'connected', publish, subscribe: (_topic, handler) => {
    receive = handler;
    return unsubscribe;
  } });
});
afterEach(() => { client.clear(); vi.restoreAllMocks(); });

it('inserts into real history cache and reconciles ACK without duplicate bubbles', async () => {
  const { result } = renderHook(() => useSendMessage(), { wrapper });
  act(() => result.current.mutate(variables));
  await waitFor(() => expect(publish).toHaveBeenCalled());
  expect(items().filter((m) => m.clientMessageId === variables.clientMessageId)).toHaveLength(1);
  expect(items().find((m) => m.clientMessageId === variables.clientMessageId)?.status).toBe('sending');
  // Model a refetch that sees the persisted message before the ACK reaches the sender.
  client.setQueryData<MessageHistory>(key, { pages: [{ items: [confirmed, oldMessage], hasNext: true, nextCursor: 'older' }], pageParams: [null] });
  act(() => receive({ body: JSON.stringify({
    type: 'message.ack',
    chatId: 10,
    clientMessageId: confirmed.clientMessageId,
    message: confirmed,
    duplicate: false,
  }) } as IMessage));
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(items()).toHaveLength(2);
  expect(items()[0]).toMatchObject({ id: 2, status: 'sent' });
  expect(client.getQueryData<MessageHistory>(key)?.pageParams).toEqual([null]);
  expect(unsubscribe).toHaveBeenCalled();
});

it('retains failed messages through refetch, then retries with the same client ID', async () => {
  publish.mockImplementationOnce(() => { throw new Error('Connection lost'); });
  const { result } = renderHook(() => useSendMessage(), { wrapper });
  act(() => result.current.mutate(variables));
  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(items()[0].status).toBe('failed');
  vi.spyOn(chatApi, 'getMessages').mockResolvedValue({ items: [oldMessage], hasNext: true, nextCursor: 'older' });
  const history = renderHook(() => useMessages(10), { wrapper });
  await waitFor(() => expect(history.result.current.isFetching).toBe(false));
  expect(items().some((m) => m.status === 'failed')).toBe(true);
  act(() => result.current.mutate(variables));
  await waitFor(() => expect(publish).toHaveBeenCalledTimes(2));
  act(() => receive({ body: JSON.stringify({
    type: 'message.ack',
    chatId: 10,
    clientMessageId: confirmed.clientMessageId,
    message: confirmed,
    duplicate: true,
  }) } as IMessage));
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(items().filter((m) => m.clientMessageId === variables.clientMessageId)).toHaveLength(1);
});

it('does not erase a newly edited draft when the previous send completes', async () => {
  const draft = draftKey(1, 10);
  useDraftStore.getState().edit(draft, 'Hello');
  const id = useDraftStore.getState().prepare(draft);
  const { result } = renderHook(() => useSendMessage(), { wrapper });
  act(() => result.current.mutate({ ...variables, clientMessageId: id }));
  await waitFor(() => expect(publish).toHaveBeenCalled());
  useDraftStore.getState().edit(draft, 'Next message');
  act(() => receive({ body: JSON.stringify({
    type: 'message.ack',
    chatId: 10,
    clientMessageId: id,
    message: { ...confirmed, clientMessageId: id },
    duplicate: false,
  }) } as IMessage));
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(useDraftStore.getState().drafts[draft].content).toBe('Next message');
  useAuthStore.getState().clearSession();
  expect(useDraftStore.getState().drafts).toEqual({});
});

it('clears the submitted draft even after its composer unmounts', async () => {
  const draft = draftKey(1, 10);
  useDraftStore.getState().edit(draft, 'Hello');
  const id = useDraftStore.getState().prepare(draft);
  const { result, unmount } = renderHook(() => useSendMessage(), { wrapper });
  act(() => result.current.mutate({ ...variables, clientMessageId: id }));
  await waitFor(() => expect(publish).toHaveBeenCalled());
  unmount();
  act(() => receive({ body: JSON.stringify({
    type: 'message.ack',
    chatId: 10,
    clientMessageId: id,
    message: { ...confirmed, clientMessageId: id },
    duplicate: false,
  }) } as IMessage));
  await waitFor(() => expect(useDraftStore.getState().drafts[draft]).toBeUndefined());
});

it('marks the optimistic message as failed when the server rejects it', async () => {
  const { result } = renderHook(() => useSendMessage(), { wrapper });
  act(() => result.current.mutate(variables));
  await waitFor(() => expect(publish).toHaveBeenCalled());

  act(() => receive({ body: JSON.stringify({
    type: 'message.rejected',
    chatId: 10,
    clientMessageId: variables.clientMessageId,
    duplicate: false,
    code: 2001,
    error: 'Message rejected',
  }) } as IMessage));

  await waitFor(() => expect(result.current.isError).toBe(true));
  expect(items().find((message) => message.clientMessageId === variables.clientMessageId)?.status)
    .toBe('failed');
});
