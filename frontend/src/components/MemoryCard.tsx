/**
 * Memory Card Component
 * Display a single family memory in the timeline.
 *
 * PATH: echon/frontend/src/components/MemoryCard.tsx
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Post, Comment, postsApi } from '../lib/api';
import { getMediaUrl } from '../lib/api';
import { getCurrentUser, getCurrentSpace } from '../lib/auth';

interface MemoryCardProps {
  post: Post;
  onImageClick: (url: string) => void;
  onEdit?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onPinToggle?: (postId: string, pinned: boolean) => void;
  canEdit?: boolean;
  canPin?: boolean;
}

const REACTIONS = [
  { type: 'heart', emoji: '❤️', label: 'Love' },
  { type: 'candle', emoji: '🕯️', label: 'Remember' },
  { type: 'pray', emoji: '🙏', label: 'Grateful' },
] as const;

function formatEventDate(raw?: string): string | null {
  if (!raw) return null;
  // Year-only
  if (/^\d{4}$/.test(raw)) return raw;
  try {
    return new Date(raw).toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch {
    return raw;
  }
}

function groupReactions(reactions: Post['reactions']): Record<string, { count: number; names: string[] }> {
  const groups: Record<string, { count: number; names: string[] }> = {};
  for (const r of reactions ?? []) {
    if (!groups[r.reaction_type]) groups[r.reaction_type] = { count: 0, names: [] };
    groups[r.reaction_type].count++;
    if (r.user?.name) groups[r.reaction_type].names.push(r.user.name);
  }
  return groups;
}

export default function MemoryCard({
  post, onImageClick, onEdit, onDelete, onPinToggle, canEdit, canPin,
}: MemoryCardProps) {
  const currentUser = getCurrentUser();
  const spaceId = getCurrentSpace();

  // Reactions
  const [reactions, setReactions] = useState(post.reactions ?? []);
  const [showReactionPicker, setShowReactionPicker] = useState(false);

  const myReaction = reactions.find(r => r.user_id === currentUser?.id);
  const grouped = groupReactions(reactions);

  // Comments
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comment_count);

  // Pinned
  const [isPinned, setIsPinned] = useState(post.is_pinned);
  const [pinning, setPinning] = useState(false);

  // Menu
  const [showMenu, setShowMenu] = useState(false);

  // ── Reactions ──
  const handleReaction = async (type: string) => {
    setShowReactionPicker(false);
    try {
      const result = await postsApi.toggleReaction(post.id, type);
      if (result.action === 'removed') {
        setReactions(prev => prev.filter(r => r.user_id !== currentUser?.id));
      } else if (result.action === 'added' && result.reaction) {
        setReactions(prev => [...prev, result.reaction!]);
      } else if (result.action === 'changed' && result.reaction) {
        setReactions(prev =>
          prev.map(r => r.user_id === currentUser?.id ? result.reaction! : r)
        );
      }
    } catch (err) {
      console.error('Reaction failed:', err);
    }
  };

  // ── Comments ──
  const handleToggleComments = async () => {
    if (!commentsLoaded) {
      try {
        const loaded = await postsApi.getPostComments(post.id);
        setComments(loaded);
        setCommentsLoaded(true);
      } catch (err) {
        console.error('Failed to load comments:', err);
      }
    }
    setShowComments(v => !v);
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setCommenting(true);
    try {
      const created = await postsApi.addComment(post.id, newComment);
      setComments(prev => [...prev, created]);
      setCommentCount(n => n + 1);
      setNewComment('');
    } catch (err) {
      console.error('Comment failed:', err);
    } finally {
      setCommenting(false);
    }
  };

  // ── Pin ──
  const handlePin = async () => {
    if (!spaceId || pinning) return;
    setPinning(true);
    setShowMenu(false);
    try {
      const result = await postsApi.togglePin(post.id, spaceId);
      setIsPinned(result.is_pinned);
      onPinToggle?.(post.id, result.is_pinned);
    } catch (err) {
      console.error('Pin failed:', err);
    } finally {
      setPinning(false);
    }
  };

  const dateLabel = formatEventDate(post.event_date);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`echon-card relative ${isPinned ? 'border-echon-gold/60' : ''}`}
    >
      {/* Pinned badge */}
      {isPinned && (
        <div className="absolute top-3 right-3 text-xs text-echon-gold flex items-center gap-1 pointer-events-none">
          <span>📌</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-echon-shadow border border-echon-gold flex items-center justify-center flex-shrink-0">
          {post.user?.profile_photo_url ? (
            <img src={post.user.profile_photo_url} alt={post.user.name}
              className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className="text-echon-cream font-semibold">
              {post.user?.name?.charAt(0) ?? '?'}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-echon-cream font-semibold truncate">{post.user?.name ?? 'Unknown'}</p>
          {dateLabel ? (
            <p className="text-echon-gold text-sm font-medium">{dateLabel}</p>
          ) : (
            <p className="text-echon-cream-dark/60 text-xs">
              {new Date(post.created_at).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric',
              })}
            </p>
          )}
        </div>

        {/* Menu */}
        {(canEdit || canPin) && (
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)}
              className="text-echon-cream-dark hover:text-echon-cream transition-colors p-2">
              ⋮
            </button>
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  className="absolute right-0 mt-1 w-44 bg-echon-shadow border border-echon-wood rounded-lg shadow-lg z-20"
                  onMouseLeave={() => setShowMenu(false)}
                >
                  {canPin && (
                    <button
                      onClick={handlePin}
                      disabled={pinning}
                      className="w-full px-4 py-2 text-left text-echon-cream hover:bg-echon-wood transition-colors text-sm"
                    >
                      {isPinned ? '📌 Unpin' : '📌 Pin to top'}
                    </button>
                  )}
                  {canEdit && (
                    <>
                      <button
                        onClick={() => { setShowMenu(false); onEdit?.(post.id); }}
                        className="w-full px-4 py-2 text-left text-echon-cream hover:bg-echon-wood transition-colors text-sm"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => {
                          setShowMenu(false);
                          if (confirm('Delete this memory?')) onDelete?.(post.id);
                        }}
                        className="w-full px-4 py-2 text-left text-echon-candle hover:bg-echon-wood transition-colors text-sm"
                      >
                        🗑️ Delete
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Media */}
      {post.media_urls && post.media_urls.length > 0 && (
        <div className={`grid gap-2 mb-4 ${
          post.media_urls.length === 1 ? 'grid-cols-1' :
          post.media_urls.length === 2 ? 'grid-cols-2' :
          'grid-cols-2'
        }`}>
          {post.media_urls.slice(0, 4).map((url, idx) => {
            const fullUrl = getMediaUrl(url);
            const isVideo = url.includes('/videos/') || post.media_type === 'video';
            const isPdf = url.includes('.pdf') || post.media_type === 'pdf';
            return (
              <div key={idx}
                className="relative aspect-square rounded-lg overflow-hidden bg-echon-shadow border border-echon-wood">
                {isPdf ? (
                  <a href={fullUrl} target="_blank" rel="noopener noreferrer"
                    className="w-full h-full flex flex-col items-center justify-center hover:bg-echon-wood transition-colors">
                    <div className="text-5xl mb-2">📄</div>
                    <p className="text-echon-cream-dark text-xs">Click to open</p>
                  </a>
                ) : isVideo ? (
                  <video src={fullUrl} controls className="w-full h-full object-cover" preload="metadata" />
                ) : (
                  <img src={fullUrl} alt={`Memory ${idx + 1}`}
                    className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => onImageClick(fullUrl)} />
                )}
                {idx === 3 && post.media_urls!.length > 4 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center pointer-events-none">
                    <span className="text-white text-2xl font-bold">+{post.media_urls!.length - 4}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Content */}
      {post.content && (
        <p className="text-echon-cream mb-4 whitespace-pre-wrap leading-relaxed">{post.content}</p>
      )}

      {/* Location */}
      {post.location && (
        <p className="text-echon-gold text-sm mb-3 flex items-center gap-1">
          <span>📍</span>{post.location}
        </p>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((tag, idx) => (
            <span key={idx}
              className="text-xs px-3 py-1 rounded-full bg-echon-shadow border border-echon-wood text-echon-cream-dark">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* ── Actions bar ── */}
      <div className="flex items-center gap-4 pt-4 border-t border-echon-wood">

        {/* Reactions */}
        <div className="relative flex items-center gap-2">
          {/* Reaction summary */}
          {Object.entries(grouped).length > 0 && (
            <div className="flex items-center gap-1 text-sm text-echon-cream-dark">
              {Object.entries(grouped).map(([type, { count }]) => {
                const r = REACTIONS.find(x => x.type === type);
                return r ? (
                  <span key={type} className="flex items-center gap-0.5">
                    {r.emoji} {count}
                  </span>
                ) : null;
              })}
            </div>
          )}

          {/* Add/change reaction button */}
          <button
            onClick={() => setShowReactionPicker(v => !v)}
            className={`flex items-center gap-1 text-sm transition-colors ${
              myReaction ? 'text-echon-candle' : 'text-echon-cream-dark hover:text-echon-cream'
            }`}
          >
            {myReaction
              ? REACTIONS.find(r => r.type === myReaction.reaction_type)?.emoji ?? '❤️'
              : '🤍'
            }
          </button>

          {/* Reaction picker */}
          <AnimatePresence>
            {showReactionPicker && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 8 }}
                className="absolute bottom-8 left-0 flex gap-1 bg-echon-shadow border border-echon-wood rounded-full px-3 py-2 shadow-xl z-20"
                onMouseLeave={() => setShowReactionPicker(false)}
              >
                {REACTIONS.map(r => (
                  <button
                    key={r.type}
                    onClick={() => handleReaction(r.type)}
                    title={r.label}
                    className={`text-2xl transition-transform hover:scale-125 ${
                      myReaction?.reaction_type === r.type ? 'scale-125' : ''
                    }`}
                  >
                    {r.emoji}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Comments */}
        <button
          onClick={handleToggleComments}
          className="flex items-center gap-1.5 text-echon-cream-dark hover:text-echon-cream transition-colors text-sm"
        >
          <span className="text-lg">💬</span>
          <span>{commentCount}</span>
        </button>
      </div>

      {/* ── Comments section ── */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-echon-wood space-y-3 overflow-hidden"
          >
            {comments.map(c => (
              <div key={c.id} className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-echon-shadow border border-echon-wood flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-echon-cream text-xs">
                    {c.user?.name?.charAt(0) ?? '?'}
                  </span>
                </div>
                <div className="flex-1 bg-echon-shadow/50 rounded-lg px-3 py-2">
                  <p className="text-echon-cream text-xs font-semibold mb-0.5">{c.user?.name ?? 'Unknown'}</p>
                  <p className="text-echon-cream-dark text-sm">{c.content}</p>
                </div>
              </div>
            ))}

            <form onSubmit={handleAddComment} className="flex gap-2 pt-1">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment…"
                className="echon-input flex-1 text-sm"
                disabled={commenting}
              />
              <button
                type="submit"
                disabled={commenting || !newComment.trim()}
                className="echon-btn-secondary text-sm px-3"
              >
                {commenting ? '…' : 'Post'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
