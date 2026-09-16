import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const websocketUrl = import.meta.env.VITE_WS_URL || '/api/ws';

export const createStompClient = (accessToken: string) =>
  new Client({
    webSocketFactory: () => new SockJS(websocketUrl),

    connectHeaders: {
      Authorization: `Bearer ${accessToken}`,
    },

    reconnectDelay: 5_000,
    heartbeatIncoming: 10_000,
    heartbeatOutgoing: 10_000,
  });
