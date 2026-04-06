/**
 * Now Page (Activity Feed)
 * What's happening in the family
 * 
 * PATH: echon/frontend/src/pages/Now.tsx
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { activityApi, familyApi, ActivityItem, SpaceStats, UpcomingBirthday } from '../lib/api';
import { getCurrentSpace } from '../lib/auth';
import ActivityCard from '../components/ActivityCard';
import { getMediaUrl } from '../lib/api';

function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return 'This Week';
  if (diffDays < 30) return 'This Month';
  return 'Earlier';
}

function groupActivitiesByDate(items: ActivityItem[]): Array<{ label: string; items: ActivityItem[] }> {
  const groups: Map<string, ActivityItem[]> = new Map();
  const order = ['Today', 'Yesterday', 'This Week', 'This Month', 'Earlier'];

  for (const item of items) {
    const label = getDateLabel(item.created_at);
    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(item);
  }

  return order
    .filter((label) => groups.has(label))
    .map((label) => ({ label, items: groups.get(label)! }));
}

export default function Now() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState<SpaceStats | null>(null);
  const [birthdays, setBirthdays] = useState<UpcomingBirthday[]>([]);
  const [loading, setLoading] = useState(true);
  const [quickUpdate, setQuickUpdate] = useState('');
  const [posting, setPosting] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const spaceId = getCurrentSpace();
      if (!spaceId) {
        navigate('/create-space');
        return;
      }

      const [activityData, statsData, birthdayData] = await Promise.all([
        activityApi.getActivityFeed(spaceId, 1, 50),
        activityApi.getSpaceStats(spaceId),
        familyApi.getUpcomingBirthdays(spaceId, 30),
      ]);

      setActivities(activityData.activities);
      setHasMore(activityData.has_more);
      setPage(1);
      setStats(statsData);
      setBirthdays(birthdayData.birthdays);
    } catch (error) {
      console.error('Failed to load activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    try {
      const spaceId = getCurrentSpace();
      if (!spaceId) return;

      const nextPage = page + 1;
      const data = await activityApi.getActivityFeed(spaceId, nextPage, 50);
      
      setActivities(prev => [...prev, ...data.activities]);
      setHasMore(data.has_more);
      setPage(nextPage);
    } catch (error) {
      console.error('Failed to load more:', error);
    }
  };

  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUpdate.trim()) return;

    setPosting(true);
    try {
      const spaceId = getCurrentSpace();
      if (!spaceId) return;

      await activityApi.createQuickUpdate(spaceId, quickUpdate);
      setQuickUpdate('');
      loadData(); // Reload feed
    } catch (error) {
      console.error('Failed to post update:', error);
      alert('Failed to post update');
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-echon-black flex items-center justify-center">
        <div className="text-echon-cream text-xl">Loading activity...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-echon-black">
      {/* Header */}
      <div className="bg-echon-shadow border-b border-echon-wood sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/space')}
            className="text-echon-cream-dark hover:text-echon-cream transition-colors"
          >
            ← Back to Space
          </button>
          <h1 className="text-2xl font-serif text-echon-cream">
            🔔 Now
          </h1>
          <button
            onClick={() => navigate('/space/chat')}
            className="echon-btn-secondary"
          >
            💬 Chat
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Stats Dashboard */}
        {stats && (
          <div className="echon-card mb-8">
            <h2 className="text-xl font-serif text-echon-cream mb-4">
              Family Overview
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-echon-gold">{stats.total_members}</p>
                <p className="text-sm text-echon-cream-dark">Members</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-echon-gold">{stats.total_memories}</p>
                <p className="text-sm text-echon-cream-dark">Memories</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-echon-gold">{stats.total_stories}</p>
                <p className="text-sm text-echon-cream-dark">Stories</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-echon-gold">{stats.total_comments}</p>
                <p className="text-sm text-echon-cream-dark">Comments</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-echon-candle">{stats.recent_activity_count}</p>
                <p className="text-sm text-echon-cream-dark">Last 7 Days</p>
              </div>
            </div>
          </div>
        )}

        {/* Upcoming Birthdays */}
        {birthdays.length > 0 && (
          <div className="echon-card mb-8 border-echon-gold/30">
            <h2 className="text-lg font-serif text-echon-cream mb-4 flex items-center gap-2">
              🎂 <span>Upcoming Birthdays</span>
            </h2>
            <div className="space-y-3">
              {birthdays.map((b) => (
                <motion.div
                  key={b.user_id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => navigate(`/space/family/${b.user_id}`)}
                  className="flex items-center gap-3 cursor-pointer group"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full border-2 border-echon-gold bg-echon-shadow flex items-center justify-center overflow-hidden flex-shrink-0">
                    {b.profile_photo_url ? (
                      <img src={getMediaUrl(b.profile_photo_url)} alt={b.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-echon-gold font-semibold">{b.name.charAt(0)}</span>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-echon-cream font-semibold group-hover:text-echon-gold transition-colors truncate">{b.name}</p>
                    <p className="text-echon-cream-dark text-xs">
                      {b.is_today
                        ? `🎉 Today! Turning ${b.age}`
                        : b.days_until === 1
                        ? `Tomorrow — turning ${b.age}`
                        : `In ${b.days_until} days — turning ${b.age}`}
                    </p>
                  </div>
                  {/* Badge */}
                  {b.is_today ? (
                    <span className="text-xs px-2 py-1 bg-echon-gold text-echon-black rounded-full font-bold flex-shrink-0">
                      Today! 🎂
                    </span>
                  ) : (
                    <span className="text-xs text-echon-cream-dark flex-shrink-0">
                      {new Date(b.birth_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Update */}
        <div className="echon-card mb-8">
          <form onSubmit={handlePostUpdate} className="flex gap-3">
            <input
              type="text"
              value={quickUpdate}
              onChange={(e) => setQuickUpdate(e.target.value)}
              placeholder="What's happening in the family?"
              className="echon-input flex-1"
              disabled={posting}
            />
            <button
              type="submit"
              disabled={!quickUpdate.trim() || posting}
              className="echon-btn"
            >
              {posting ? '...' : 'Post'}
            </button>
          </form>
        </div>

        {/* Activity Feed */}
        <div className="space-y-4">
          <h2 className="text-xl font-serif text-echon-cream mb-4">
            Recent Activity
          </h2>

          {activities.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="text-8xl mb-6">🕯️</div>
              <h3 className="text-2xl font-serif text-echon-cream mb-4">
                Nothing yet
              </h3>
              <p className="text-echon-cream-dark mb-8">
                Start sharing memories, stories, and connecting with family
              </p>
              <div className="flex gap-4 justify-center">
                <button onClick={() => navigate('/space/memories')} className="echon-btn">
                  📸 Share a Memory
                </button>
                <button onClick={() => navigate('/space/stories')} className="echon-btn-secondary">
                  🎙️ Record a Story
                </button>
              </div>
            </motion.div>
          ) : (
            <>
              {groupActivitiesByDate(activities).map((group) => (
                <div key={group.label}>
                  <p className="text-echon-cream-dark font-serif text-xs uppercase tracking-widest mb-3 mt-6 first:mt-0">
                    {group.label}
                  </p>
                  {group.items.map((activity) => (
                    <div key={activity.id} className="mb-3">
                      <ActivityCard activity={activity} />
                    </div>
                  ))}
                </div>
              ))}

              {hasMore && (
                <div className="text-center pt-8">
                  <button onClick={loadMore} className="echon-btn-secondary">
                    Load More
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}