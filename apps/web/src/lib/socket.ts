import { io, type Socket } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

let socket: Socket | null = null;

/**
 * Conexão única de WebSocket, reaproveitada por todos os hooks que precisam
 * de tempo real (Kanban nesta fase; Dashboard e Notificações podem migrar
 * para o mesmo socket depois em vez de fazer polling).
 */
export function getRealtimeSocket(accessToken: string): Socket {
  if (socket && socket.connected) {
    return socket;
  }

  socket = io(`${API_URL}/realtime`, {
    auth: { token: accessToken },
    transports: ['websocket'],
    reconnection: true,
  });

  return socket;
}

export function disconnectRealtimeSocket() {
  socket?.disconnect();
  socket = null;
}
