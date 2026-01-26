/**
 * Now Page (Activity Feed)
 * What's happening in the family
 * 
 * PATH: echon/frontend/src/pages/Now.tsx
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { activityApi, ActivityItem, SpaceStats } from '../lib/api';
import { getCurrentSpace } from '../lib/auth';
import ActivityCard from '../components/ActivityCard';

export default function Now() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState<SpaceStats | null>(null);
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

      // Load activity feed and stats in parallel
      const [activityData, statsData] = await Promise.all([
        activityApi.getActivityFeed(spaceId, 1, 50),
        activityApi.getSpaceStats(spaceId),
      ]);

      setActivities(activityData.activities);
      setHasMore(activityData.has_more);
      setPage(1);
      setStats(statsData);
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
            💬 Now
          </h1>
          <div className="w-20"></div>
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
              <div className="text-8xl mb-6">💬</div>
              <h3 className="text-2xl font-serif text-echon-cream mb-4">
                No activity yet
              </h3>
              <p className="text-echon-cream-dark mb-8">
                Start sharing memories, stories, and connecting with family
              </p>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => navigate('/space/memories')}
                  className="echon-btn"
                >
                  📸 Share a Memory
                </button>
                <button
                  onClick={() => navigate('/space/stories')}
                  className="echon-btn-secondary"
                >
                  🎙️ Record a Story
                </button>
              </div>
            </motion.div>
          ) : (
            <>
              {activities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))}

              {hasMore && (
                <div className="text-center pt-8">
                  <button
                    onClick={loadMore}
                    className="echon-btn-secondary"
                  >
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