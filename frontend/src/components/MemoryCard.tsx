/**
 * Memory Card Component
 * Display a single memory in the timeline
 * 
 * PATH: echon/frontend/src/components/MemoryCard.tsx
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Post } from '../lib/api';
import { postsApi } from '../lib/api';
import { getMediaUrl } from '../lib/api';

interface MemoryCardProps {
  post: Post;
  onImageClick: (url: string) => void;
  onEdit?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  canEdit?: boolean;
}

export default function MemoryCard({ post, onImageClick, onEdit, onDelete, canEdit }: MemoryCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commenting, setCommenting] = useState(false);
  const [localCommentCount, setLocalCommentCount] = useState(post.comment_count);
  const [localReactionCount, setLocalReactionCount] = useState(post.reaction_count);
  const [hasReacted, setHasReacted] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setCommenting(true);
    try {
      await postsApi.addComment(post.id, newComment);
      setNewComment('');
      setLocalCommentCount(prev => prev + 1);
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setCommenting(false);
    }
  };

  const handleReaction = async () => {
    try {
      await postsApi.addReaction(post.id, 'heart');
      if (!hasReacted) {
        setLocalReactionCount(prev => prev + 1);
        setHasReacted(true);
      }
    } catch (error) {
      console.error('Failed to add reaction:', error);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="echon-card"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-echon-shadow border border-echon-gold flex items-center justify-center">
          <span className="text-echon-cream font-semibold">
            {post.user?.name?.charAt(0) || '?'}
          </span>
        </div>
        <div className="flex-1">
          <p className="text-echon-cream font-semibold">
            {post.user?.name || 'Unknown'}
          </p>
          {post.event_date && (
            <p className="text-echon-cream-dark text-sm">
              {formatDate(post.event_date)}
            </p>
          )}
        </div>
        
        {/* Edit/Delete Menu */}
        {canEdit && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="text-echon-cream-dark hover:text-echon-cream transition-colors p-2"
            >
              ⋮
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-echon-shadow border border-echon-wood rounded-lg shadow-lg z-10">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEdit?.(post.id);
                  }}
                  className="w-full px-4 py-2 text-left text-echon-cream hover:bg-echon-wood transition-colors"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    if (confirm('Delete this memory?')) {
                      onDelete?.(post.id);
                    }
                  }}
                  className="w-full px-4 py-2 text-left text-echon-candle hover:bg-echon-wood transition-colors"
                >
                  🗑️ Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Media */}
      {post.media_urls && post.media_urls.length > 0 && (
        <div className={`grid gap-2 mb-4 ${
          post.media_urls.length === 1 ? 'grid-cols-1' :
          post.media_urls.length === 2 ? 'grid-cols-2' :
          post.media_urls.length === 3 ? 'grid-cols-3' :
          'grid-cols-2'
        }`}>
          {post.media_urls.slice(0, 4).map((url, idx) => {
            const fullUrl = getMediaUrl(url);
            const isVideo = url.includes('/videos/') || post.media_type === 'video';
            const isPdf = url.includes('.pdf') || post.media_type === 'pdf';
            
            return (
              <div
                key={idx}
                className="relative aspect-square rounded-lg overflow-hidden bg-echon-shadow border border-echon-wood"
              >
                {isPdf ? (
                  // PDF Display
                  <a
                    href={fullUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-full flex flex-col items-center justify-center hover:bg-echon-wood transition-colors"
                  >
                    <div className="text-6xl mb-2">📄</div>
                    <p className="text-echon-cream text-sm px-2 text-center">PDF Document</p>
                    <p className="text-echon-cream-dark text-xs mt-1">Click to open</p>
                  </a>
                ) : isVideo ? (
                  // Video Player
                  <video
                    src={fullUrl}
                    controls
                    className="w-full h-full object-cover"
                    preload="metadata"
                  >
                    Your browser does not support video playback.
                  </video>
                ) : (
                  // Image
                  <img
                    src={fullUrl}
                    alt={`Memory ${idx + 1}`}
                    className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => onImageClick(fullUrl)}
                  />
                )}
                {idx === 3 && post.media_urls!.length > 4 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center pointer-events-none">
                    <span className="text-white text-2xl font-bold">
                      +{post.media_urls!.length - 4}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Content */}
      {post.content && (
        <p className="text-echon-cream mb-4 whitespace-pre-wrap">
          {post.content}
        </p>
      )}

      {/* Location */}
      {post.location && (
        <p className="text-echon-gold text-sm mb-4 flex items-center gap-2">
          <span>📍</span>
          {post.location}
        </p>
      )}

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((tag, idx) => (
            <span
              key={idx}
              className="text-xs px-3 py-1 rounded-full bg-echon-shadow border border-echon-wood text-echon-cream-dark"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-6 pt-4 border-t border-echon-wood">
        <button
          onClick={handleReaction}
          className={`flex items-center gap-2 transition-colors ${
            hasReacted ? 'text-echon-candle' : 'text-echon-cream-dark hover:text-echon-cream'
          }`}
        >
          <span className="text-xl">{hasReacted ? '❤️' : '🤍'}</span>
          <span className="text-sm">{localReactionCount}</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-2 text-echon-cream-dark hover:text-echon-cream transition-colors"
        >
          <span className="text-xl">💬</span>
          <span className="text-sm">{localCommentCount}</span>
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-echon-wood space-y-4">
          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="echon-input flex-1"
              disabled={commenting}
            />
            <button
              type="submit"
              disabled={commenting || !newComment.trim()}
              className="echon-btn-secondary"
            >
              {commenting ? '...' : 'Post'}
            </button>
          </form>

          {/* Existing Comments (placeholder) */}
          {post.comments && post.comments.length > 0 && (
            <div className="space-y-3">
              {post.comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-echon-shadow border border-echon-wood flex items-center justify-center flex-shrink-0">
                    <span className="text-echon-cream text-xs">
                      {comment.user?.name?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-echon-cream text-sm font-semibold">
                      {comment.user?.name || 'Unknown'}
                    </p>
                    <p className="text-echon-cream-dark text-sm">
                      {comment.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}