// frontend/hooks/useSocket.ts
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

export default function useSocket(url?: string) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const u = url || process.env.NEXT_PUBLIC_SIGNALING_URL || 'http://localhost:3001';
    socketRef.current = io(u, { transports: ['websocket'] });
    const s = socketRef.current;
    s.on('connect', () => console.log('socket connected', s.id));
    return () => { s.disconnect(); };
  }, [url]);

  return socketRef;
}
