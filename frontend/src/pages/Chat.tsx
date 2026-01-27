/**
 * Family Chat Page
 * Real-time messaging for family members
 * 
 * PATH: echon/frontend/src/pages/Chat.tsx
 */

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { chatApi } from '../lib/api';
import { getCurrentSpace, getCurrentUser } from '../lib/auth';

interface ChatMessage {
  id: string;
  space_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_name: string;
  user_photo?: string;
}

export default function Chat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = getCurrentUser();

  useEffect(() => {
    loadMessages();
    // Poll for new messages every 5 seconds
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      const spaceId = getCurrentSpace();
      if (!spaceId) {
        navigate('/select-space');
        return;
      }

      const data = await chatApi.getMessages(spaceId, 1, 100);
      setMessages(data.messages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const spaceId = getCurrentSpace();
      if (!spaceId) return;

      const message = await chatApi.sendMessage(spaceId, newMessage);
      setMessages(prev => [...prev, message]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!confirm('Delete this message?')) return;

    try {
      const spaceId = getCurrentSpace();
      if (!spaceId) return;

      await chatApi.deleteMessage(messageId, spaceId);
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (error) {
      console.error('Failed to delete:', error);
      alert('Failed to delete message');
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-echon-black flex items-center justify-center">
        <div className="text-echon-cream text-xl">Loading chat...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-echon-black flex flex-col">
      {/* Header */}
      <div className="bg-echon-shadow border-b border-echon-wood">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/space')}
            className="text-echon-cream-dark hover:text-echon-cream transition-colors"
          >
            ← Back to Space
          </button>
          <h1 className="text-2xl font-serif text-echon-cream">
            💬 Family Chat
          </h1>
          <div className="w-20"></div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-4xl mx-auto w-full">
        {messages.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-echon-cream-dark">No messages yet</p>
            <p className="text-echon-cream-dark text-sm mt-2">
              Start the conversation!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isOwn = msg.user_id === currentUser?.id;
              
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-echon-shadow border border-echon-gold flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {msg.user_photo ? (
                      <img
                        src={`http://localhost:8000${msg.user_photo}`}
                        alt={msg.user_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-echon-gold text-xs">
                        {msg.user_name.charAt(0)}
                      </span>
                    )}
                  </div>

                  {/* Message */}
                  <div className={`flex-1 max-w-md ${isOwn ? 'text-right' : 'text-left'}`}>
                    <div className={`inline-block ${isOwn ? 'bg-echon-gold text-echon-black' : 'bg-echon-shadow text-echon-cream'} rounded-lg px-4 py-2`}>
                      <p className="text-xs font-semibold mb-1 opacity-70">
                        {msg.user_name}
                      </p>
                      <p className="text-sm">{msg.content}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs opacity-50">
                          {formatTime(msg.created_at)}
                        </p>
                        {isOwn && (
                          <button
                            onClick={() => handleDelete(msg.id)}
                            className="text-xs opacity-50 hover:opacity-100 transition-opacity"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="bg-echon-shadow border-t border-echon-wood sticky bottom-0">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <form onSubmit={handleSend} className="flex gap-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="echon-input flex-1"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="echon-btn"
            >
              {sending ? '...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}