/**
 * useSpacePresence
 * Connects to the space presence WebSocket and returns the list of
 * family members currently on the door / home scene.
 *
 * PATH: echon/frontend/src/hooks/useSpacePresence.ts
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { getAuthToken, getCurrentSpace } from '../lib/auth';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const WS_BASE = API_BASE.replace(/^http/, 'ws');

export interface PresenceUser {
  user_id: string;
  user_name: string;
  user_photo?: string;
}

export function useSpacePresence(): PresenceUser[] {
  const [online, setOnline] = useState<PresenceUser[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const shouldConnectRef = useRef(true);
  const spaceId = getCurrentSpace();

  const connect = useCallback(() => {
    if (!spaceId || !shouldConnectRef.current) return;
    const token = getAuthToken();
    if (!token) return;

    const ws = new WebSocket(`${WS_BASE}/api/presence/ws/${spaceId}?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      reconnectAttemptsRef.current = 0;
      pingRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send('ping');
      }, 25000);
    };

    ws.onmessage = (event) => {
      if (event.data === 'pong') return;
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'presence') {
          setOnline(data.online ?? []);
        }
      } catch { /* ignore malformed frames */ }
    };

    ws.onclose = () => {
      if (pingRef.current) clearInterval(pingRef.current);
      if (!shouldConnectRef.current) return;
      const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
      reconnectAttemptsRef.current += 1;
      setTimeout(connect, delay);
    };

    ws.onerror = () => ws.close();
  }, [spaceId]);

  useEffect(() => {
    shouldConnectRef.current = true;
    connect();
    return () => {
      shouldConnectRef.current = false;
      wsRef.current?.close();
      if (pingRef.current) clearInterval(pingRef.current);
    };
  }, [connect]);

  return online;
}
