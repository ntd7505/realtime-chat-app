import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import type { Client, StompSubscription } from '@stomp/stompjs';
import { useAuthStore } from '@/features/auth/authStore';
import { createStompClient } from './stompClient';
import { refreshToken } from '@/lib/http/refreshToken';
import {
  StompContext,
  type StompConnection,
  type StompMessageHandler,
} from './stompContext';

interface StompProviderProps {
  children: ReactNode;
}

export function StompProvider({ children }: StompProviderProps) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const status = useAuthStore((state) => state.status);
  const clientRef = useRef<Client | null>(null);
  const handlersRef = useRef(new Map<string, Set<StompMessageHandler>>());
  const subscriptionsRef = useRef(new Map<string, StompSubscription>());

  const ensureSubscription = useCallback((destination: string) => {
    const client = clientRef.current;
    const handlers = handlersRef.current.get(destination);

    if (!client?.connected || !handlers?.size || subscriptionsRef.current.has(destination)) {
      return;
    }

    const subscription = client.subscribe(destination, (message) => {
      handlersRef.current.get(destination)?.forEach((handler) => handler(message));
    });
    subscriptionsRef.current.set(destination, subscription);
  }, []);

  const subscribe = useCallback(
    (destination: string, handler: StompMessageHandler) => {
      const handlers = handlersRef.current.get(destination) ?? new Set<StompMessageHandler>();
      handlers.add(handler);
      handlersRef.current.set(destination, handlers);
      ensureSubscription(destination);

      return () => {
        const currentHandlers = handlersRef.current.get(destination);
        currentHandlers?.delete(handler);

        if (currentHandlers?.size) {
          return;
        }

        handlersRef.current.delete(destination);
        subscriptionsRef.current.get(destination)?.unsubscribe();
        subscriptionsRef.current.delete(destination);
      };
    },
    [ensureSubscription]
  );

  const publish = useCallback((destination: string, body: string) => {
    const client = clientRef.current;

    if (!client?.connected) {
      throw new Error('Realtime connection is not ready');
    }

    client.publish({ destination, body });
  }, []);

  useEffect(() => {
    if (status !== 'authenticated' || !accessToken) {
      return;
    }

    const client = createStompClient(accessToken);
    const subscriptions = subscriptionsRef.current;
    let attemptedAuthRefresh = false;
    clientRef.current = client;

    client.onConnect = () => {
      if (clientRef.current !== client) return;

      subscriptions.clear();
      handlersRef.current.forEach((_handlers, destination) => ensureSubscription(destination));
    };

    client.onWebSocketClose = () => {
      if (clientRef.current !== client) return;

      subscriptions.clear();
    };

    client.onStompError = (frame) => {
      if (clientRef.current !== client) return;

      const errorDetails = `${frame.headers.message ?? ''} ${frame.body}`.toLowerCase();
      const isAuthenticationError =
        errorDetails.includes('authorization') ||
        errorDetails.includes('jwt') ||
        errorDetails.includes('authenticated');

      if (!isAuthenticationError || attemptedAuthRefresh) return;

      attemptedAuthRefresh = true;
      client.reconnectDelay = 0;
      void refreshToken();
    };

    client.activate();

    return () => {
      if (clientRef.current === client) {
        clientRef.current = null;
        subscriptions.clear();
      }
      void client.deactivate();
    };
  }, [accessToken, ensureSubscription, status]);

  const value = useMemo<StompConnection>(
    () => ({ publish, subscribe }),
    [publish, subscribe]
  );

  return <StompContext.Provider value={value}>{children}</StompContext.Provider>;
}
