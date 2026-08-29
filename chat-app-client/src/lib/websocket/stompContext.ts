import { createContext, useContext } from 'react';
import type { IMessage } from '@stomp/stompjs';

export type StompMessageHandler = (message: IMessage) => void;

export interface StompConnection {
  publish: (destination: string, body: string) => void;
  subscribe: (destination: string, handler: StompMessageHandler) => () => void;
}

export const StompContext = createContext<StompConnection | null>(null);

export const useStomp = () => {
  const connection = useContext(StompContext);

  if (!connection) {
    throw new Error('useStomp must be used inside StompProvider');
  }

  return connection;
};
