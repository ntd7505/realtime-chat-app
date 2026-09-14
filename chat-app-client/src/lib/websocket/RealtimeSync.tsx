import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth/authStore';
import { chatKeys } from '@/features/chat/chat.keys';
import type { RealtimeEvent } from '@/features/chat/chat.types';
import { useStomp, type ConnectionStatus } from './stompContext';

const MAX_SEEN_EVENTS = 200;
const PRESENCE_HEARTBEAT_DESTINATION = '/app/presence/heartbeat';
const PRESENCE_HEARTBEAT_INTERVAL_MS = 30_000;

export function RealtimeSync() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id ?? 0);
  const { publish, status, subscribe } = useStomp();
  const previousStatus = useRef<ConnectionStatus>('disconnected');
  const previousUserId = useRef(userId);
  const hasConnected = useRef(false);
  const seenEventIds = useRef<string[]>([]);

  useEffect(() => {
    if (!userId) return;

    return subscribe('/user/queue/events', (frame) => {
      let event: RealtimeEvent;
      try {
        event = JSON.parse(frame.body) as RealtimeEvent;
      } catch {
        return;
      }

      if (
        !event.eventId ||
        typeof event.type !== 'string' ||
        seenEventIds.current.includes(event.eventId)
      ) return;
      seenEventIds.current = [...seenEventIds.current.slice(-(MAX_SEEN_EVENTS - 1)), event.eventId];

      if (event.type.startsWith('friendship.')) {
        void queryClient.invalidateQueries({ queryKey: ['friendships', userId] });
        return;
      }

      void queryClient.invalidateQueries({ queryKey: chatKeys.lists(userId) });
      if (event.chatId) {
        void Promise.all([
          queryClient.invalidateQueries({
            queryKey: chatKeys.detail(userId, event.chatId),
            exact: true,
          }),
          queryClient.invalidateQueries({ queryKey: chatKeys.messages(userId, event.chatId) }),
        ]);
      }
    });
  }, [queryClient, subscribe, userId]);

  useEffect(() => {
    if (!userId || status !== 'connected') return;

    const sendHeartbeat = () => {
      try {
        publish(PRESENCE_HEARTBEAT_DESTINATION, '');
      } catch {
        // Connection state can lag briefly behind a socket close. Reconnect will retry immediately.
      }
    };
    sendHeartbeat();

    const intervalId = window.setInterval(sendHeartbeat, PRESENCE_HEARTBEAT_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [publish, status, userId]);

  useEffect(() => {
    if (previousUserId.current !== userId) {
      previousUserId.current = userId;
      hasConnected.current = false;
    }

    const wasDisconnected =
      previousStatus.current === 'disconnected' || previousStatus.current === 'reconnecting';
    if (status === 'connected' && userId) {
      if (wasDisconnected && hasConnected.current) {
        void Promise.all([
          queryClient.invalidateQueries({ queryKey: chatKeys.all(userId) }),
          queryClient.invalidateQueries({ queryKey: ['friendships', userId] }),
        ]);
      }
      hasConnected.current = true;
    }
    previousStatus.current = status;
  }, [queryClient, status, userId]);

  return null;
}
