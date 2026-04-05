/**
 * Family Chat Page
 * Real-time messaging via WebSocket (REST fallback for history)
 *
 * PATH: echon/frontend/src/pages/Chat.tsx
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { chatApi } from '../lib/api';
import { getCurrentSpace, getCurrentUser, getAuthToken } from '../lib/auth';
import { getMediaUrl } from '../lib/api';

interface ChatMessage {
  id: string;
  space_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_name: string;
  user_photo?: string;
}

interface OnlineUser {
  user_id: string;
  user_name: string;
  user_photo?: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const WS_BASE = API_BASE.replace(/^http/, 'ws');

export default function Chat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [online, setOnline] = useState<OnlineUser[]>([]);
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const pingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentUser = getCurrentUser();

  const spaceId = getCurrentSpace();
  const reconnectAttemptsRef = useRef(0);
  const shouldReconnectRef = useRef(true);

  // ── Scroll to latest ──────────────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // ── Load history ──────────────────────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    if (!spaceId) { navigate('/select-space'); return; }
    try {
      const data = await chatApi.getMessages(spaceId, 1, 100);
      setMessages(data.messages);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  }, [spaceId, navigate]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // ── WebSocket with auto-reconnect ─────────────────────────────────────────
  const connectWs = useCallback(() => {
    if (!spaceId || !shouldReconnectRef.current) return;

    const token = getAuthToken();
    if (!token) { navigate('/login'); return; }

    const url = `${WS_BASE}/api/chat/ws/${spaceId}?token=${token}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;
    setWsStatus('connecting');

    ws.onopen = () => {
      setWsStatus('connected');
      reconnectAttemptsRef.current = 0;
      // Keep-alive ping every 25 s
      pingRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send('ping');
      }, 25000);
    };

    ws.onmessage = (event) => {
      if (event.data === 'pong') return;
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'message') {
          setMessages((prev) => {
            // Replace optimistic placeholder if content + user match, otherwise dedup by real id
            const optimisticIdx = prev.findIndex(
              (m) => m.id.startsWith('opt-') && m.user_id === data.user_id && m.content === data.content
            );
            if (optimisticIdx !== -1) {
              const next = [...prev];
              next[optimisticIdx] = {
                id: data.id,
                space_id: data.space_id,
                user_id: data.user_id,
                content: data.content,
                created_at: data.created_at,
                user_name: data.user_name,
                user_photo: data.user_photo,
              };
              return next;
            }
            if (prev.some((m) => m.id === data.id)) return prev;
            return [...prev, {
              id: data.id,
              space_id: data.space_id,
              user_id: data.user_id,
              content: data.content,
              created_at: data.created_at,
              user_name: data.user_name,
              user_photo: data.user_photo,
            }];
          });
        }

        if (data.type === 'presence') {
          setOnline(data.online ?? []);
        }
      } catch {
        // ignore malformed frames
      }
    };

    ws.onclose = () => {
      setWsStatus('disconnected');
      if (pingRef.current) clearInterval(pingRef.current);
      if (!shouldReconnectRef.current) return;
      // Exponential backoff: 1s, 2s, 4s, 8s … max 30s
      const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
      reconnectAttemptsRef.current += 1;
      setTimeout(connectWs, delay);
    };

    ws.onerror = () => ws.close(); // onclose handles reconnect
  }, [spaceId, navigate]);

  useEffect(() => {
    shouldReconnectRef.current = true;
    connectWs();
    return () => {
      shouldReconnectRef.current = false;
      wsRef.current?.close();
      if (pingRef.current) clearInterval(pingRef.current);
    };
  }, [connectWs]);

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !spaceId) return;

    setSending(true);
    const optimisticId = `opt-${Date.now()}`;
    const optimistic: ChatMessage = {
      id: optimisticId,
      space_id: spaceId,
      user_id: currentUser?.id ?? '',
      content: newMessage,
      created_at: new Date().toISOString(),
      user_name: currentUser?.name ?? '',
      user_photo: currentUser?.profile_photo_url,
    };
    setMessages((prev) => [...prev, optimistic]);
    const sent = newMessage;
    setNewMessage('');

    try {
      // The server will broadcast the saved message via WebSocket,
      // which will replace the optimistic entry. We only need to
      // handle the failure case here.
      await chatApi.sendMessage(spaceId, sent);
    } catch (err) {
      console.error('Send failed:', err);
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setNewMessage(sent);
      alert('Failed to send message — please try again');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!confirm('Delete this message?') || !spaceId) return;
    try {
      await chatApi.deleteMessage(messageId, spaceId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch {
      alert('Failed to delete message');
    }
  };

  const formatTime = (ds: string) =>
    new Date(ds).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return (
      <div className="min-h-screen bg-echon-black flex items-center justify-center">
        <div className="text-echon-cream text-xl">Loading chat...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-echon-black flex flex-col">

      {/* ── Header ── */}
      <div className="bg-echon-shadow border-b border-echon-wood sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <button
            onClick={() => navigate('/space')}
            className="text-echon-cream-dark hover:text-echon-cream transition-colors text-sm flex-shrink-0"
          >
            ← Back
          </button>

          <h1 className="text-xl font-serif text-echon-cream">💬 Family Chat</h1>

          {/* Connection status + online users */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span
              className={`w-2 h-2 rounded-full ${
                wsStatus === 'connected' ? 'bg-green-400' :
                wsStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
                'bg-red-400'
              }`}
              title={wsStatus}
            />
            {online.length > 0 && (
              <span className="text-echon-cream-dark text-xs">
                {online.length} online
              </span>
            )}
          </div>
        </div>

        {/* Online avatars */}
        {online.length > 0 && (
          <div className="max-w-4xl mx-auto px-4 pb-2 flex items-center gap-2">
            <span className="text-echon-cream-dark text-xs">Now here:</span>
            <div className="flex -space-x-1">
              {online.slice(0, 8).map((u) => (
                <div
                  key={u.user_id}
                  title={u.user_name}
                  className="w-6 h-6 rounded-full border border-echon-gold bg-echon-shadow flex items-center justify-center overflow-hidden"
                >
                  {u.user_photo ? (
                    <img src={getMediaUrl(u.user_photo)} alt={u.user_name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-echon-gold text-[9px]">{u.user_name.charAt(0)}</span>
                  )}
                </div>
              ))}
              {online.length > 8 && (
                <div className="w-6 h-6 rounded-full border border-echon-gold bg-echon-shadow flex items-center justify-center">
                  <span className="text-echon-gold text-[9px]">+{online.length - 8}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-4xl mx-auto w-full">
        {messages.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-echon-cream font-serif text-xl mb-2">Start the conversation</p>
            <p className="text-echon-cream-dark text-sm">
              Your family is here. Say something.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {messages.map((msg) => {
                const isOwn = msg.user_id === currentUser?.id;
                const isOptimistic = msg.id.startsWith('opt-');
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: isOptimistic ? 0.7 : 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* Avatar */}
                    <div className="w-8 h-8 rounded-full bg-echon-shadow border border-echon-gold flex items-center justify-center flex-shrink-0 overflow-hidden self-end">
                      {msg.user_photo ? (
                        <img src={getMediaUrl(msg.user_photo)} alt={msg.user_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-echon-gold text-xs">{msg.user_name.charAt(0)}</span>
                      )}
                    </div>

                    {/* Bubble */}
                    <div className={`flex flex-col max-w-xs md:max-w-md ${isOwn ? 'items-end' : 'items-start'}`}>
                      <span className="text-echon-cream-dark text-xs mb-1 px-1">{msg.user_name}</span>
                      <div
                        className={`rounded-2xl px-4 py-2 text-sm ${
                          isOwn
                            ? 'bg-echon-gold text-echon-black rounded-br-sm'
                            : 'bg-echon-shadow text-echon-cream border border-echon-wood rounded-bl-sm'
                        }`}
                      >
                        {msg.content}
                      </div>
                      <div className={`flex items-center gap-1 mt-1 px-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                        <span className="text-echon-cream-dark text-[10px]">{formatTime(msg.created_at)}</span>
                        {isOwn && !isOptimistic && (
                          <button
                            onClick={() => handleDelete(msg.id)}
                            className="text-[10px] text-echon-cream-dark hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                            title="Delete"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ── Input ── */}
      <div className="bg-echon-shadow border-t border-echon-wood sticky bottom-0">
        <div className="max-w-4xl mx-auto px-4 py-3">
          {wsStatus === 'disconnected' && (
            <p className="text-red-400 text-xs mb-2 text-center">
              Connection lost — messages may not appear in real time
            </p>
          )}
          <form onSubmit={handleSend} className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Write to your family..."
              className="echon-input flex-1"
              disabled={sending}
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="echon-btn px-5"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
