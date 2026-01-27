/**
 * Story Card Component
 * Display a voice story with audio player
 * 
 * PATH: echon/frontend/src/components/StoryCard.tsx
 */

import { motion } from 'framer-motion';
import { Story } from '../lib/api';
import { getMediaUrl } from '../lib/api';

interface StoryCardProps {
  story: Story;
  onDelete?: (id: string) => void;
  canDelete?: boolean;
}

export default function StoryCard({ story, onDelete, canDelete }: StoryCardProps) {
  // Removed unused showDetails state

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="echon-card"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-echon-shadow border border-echon-gold flex items-center justify-center flex-shrink-0">
          <span className="text-2xl">🎙️</span>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-serif text-echon-cream">
            {story.title}
          </h3>
          {story.author && (
            <p className="text-sm text-echon-cream-dark">
              by {story.author.name}
            </p>
          )}
        </div>
        {canDelete && onDelete && (
          <button
            onClick={() => {
              if (confirm('Delete this story?')) {
                onDelete(story.id);
              }
            }}
            className="text-echon-cream-dark hover:text-echon-candle transition-colors"
          >
            🗑️
          </button>
        )}
      </div>

      {/* Audio Player */}
      <audio
        src={getMediaUrl(story.audio_url)}
        controls
        className="w-full mb-4"
      />

      {/* Description */}
      {story.description && (
        <p className="text-echon-cream-dark mb-4">
          {story.description}
        </p>
      )}

      {/* Metadata */}
      <div className="flex flex-wrap gap-4 text-sm text-echon-cream-dark">
        {story.story_date && (
          <div className="flex items-center gap-2">
            <span>📅</span>
            <span>{formatDate(story.story_date)}</span>
          </div>
        )}
        {story.location && (
          <div className="flex items-center gap-2">
            <span>📍</span>
            <span>{story.location}</span>
          </div>
        )}
        {story.duration && (
          <div className="flex items-center gap-2">
            <span>⏱️</span>
            <span>{formatDuration(story.duration)}</span>
          </div>
        )}
      </div>

      {/* Tags */}
      {story.tags && story.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-echon-wood">
          {story.tags.map((tag, idx) => (
            <span
              key={idx}
              className="text-xs px-3 py-1 rounded-full bg-echon-shadow border border-echon-wood text-echon-cream-dark"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Recorded date */}
      <div className="mt-4 pt-4 border-t border-echon-wood text-xs text-echon-cream-dark">
        Recorded {new Date(story.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}
      </div>
    </motion.div>
  );
}