/**
 * Activity Card Component
 * Display a single activity item
 * 
 * PATH: echon/frontend/src/components/ActivityCard.tsx
 */

import { motion } from 'framer-motion';
import { ActivityItem } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { getMediaUrl } from '../lib/api';

interface ActivityCardProps {
  activity: ActivityItem;
}

export default function ActivityCard({ activity }: ActivityCardProps) {
  const navigate = useNavigate();

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'memory': return '📸';
      case 'story': return '🎙️';
      case 'comment': return '💬';
      case 'chat': return '💬';
      case 'reaction': return '❤️';
      case 'member_joined': return '👋';
      default: return '📝';
    }
  };

  const getActivityText = () => {
    switch (activity.type) {
      case 'memory': return 'shared a memory';
      case 'story': return 'recorded a story';
      case 'comment': return 'commented';
      case 'chat': return 'said in chat';
      case 'reaction': return `reacted with ${activity.content}`;
      case 'member_joined': return 'joined the family';
      default: return 'posted an update';
    }
  };

  const handleClick = () => {
    if (activity.type === 'memory') {
      navigate('/space/memories');
    } else if (activity.type === 'story') {
      navigate('/space/stories');
    } else if (activity.type === 'chat') {
      navigate('/space/chat');
    } else if (activity.type === 'member_joined' && activity.related_id) {
      navigate(`/space/family/${activity.related_id}`);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="echon-card hover:border-echon-gold transition-colors cursor-pointer"
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        {/* User Avatar */}
        <div className="w-10 h-10 rounded-full bg-echon-shadow border border-echon-wood flex items-center justify-center flex-shrink-0">
          {activity.user_photo ? (
            <img
              src={getMediaUrl(activity.user_photo)}
              alt={activity.user_name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-echon-cream text-sm">
              {activity.user_name.charAt(0)}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{getActivityIcon(activity.type)}</span>
            <p className="text-echon-cream">
              <span className="font-semibold">{activity.user_name}</span>
              {' '}
              <span className="text-echon-cream-dark">{getActivityText()}</span>
            </p>
          </div>

          {/* Preview */}
          {activity.preview_text && (
            <p className="text-echon-cream-dark text-sm mt-2 line-clamp-2">
              {activity.preview_text}
            </p>
          )}

          {/* Preview Image/Audio */}
          {activity.preview_url && (
            <div className="mt-2">
              {activity.type === 'memory' ? (
                <img
                  src={getMediaUrl(activity.preview_url)}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded"
                />
              ) : activity.type === 'story' ? (
                <audio
                  src={getMediaUrl(activity.preview_url)}
                  controls
                  className="w-full h-10"
                />
              ) : null}
            </div>
          )}

          {/* Time */}
          <p className="text-echon-cream-dark text-xs mt-2">
            {formatTime(activity.created_at)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}