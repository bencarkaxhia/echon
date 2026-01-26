/**
 * Stories Page
 * Timeline of family voice stories
 * 
 * PATH: echon/frontend/src/pages/Stories.tsx
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { storiesApi, Story } from '../lib/api';
import { getCurrentSpace, getCurrentUser } from '../lib/auth';
import StoryCard from '../components/StoryCard';
import VoiceRecorder from '../components/VoiceRecorder';

export default function Stories() {
  const navigate = useNavigate();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRecorder, setShowRecorder] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const currentUser = getCurrentUser();

  useEffect(() => {
    loadStories(1);
  }, []);

  const loadStories = async (pageNum: number = 1) => {
    try {
      const spaceId = getCurrentSpace();
      if (!spaceId) {
        navigate('/create-space');
        return;
      }

      const data = await storiesApi.getSpaceStories(spaceId, pageNum, 20);
      
      if (pageNum === 1) {
        setStories(data.stories);
      } else {
        setStories(prev => [...prev, ...data.stories]);
      }
      
      setHasMore(data.has_more);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to load stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordSuccess = () => {
    setShowRecorder(false);
    loadStories(1);
  };

  const handleDelete = async (storyId: string) => {
    try {
      const spaceId = getCurrentSpace();
      if (!spaceId) return;

      await storiesApi.deleteStory(storyId, spaceId);
      setStories(prev => prev.filter(s => s.id !== storyId));
    } catch (error) {
      console.error('Failed to delete story:', error);
      alert('Failed to delete story');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-echon-black flex items-center justify-center">
        <div className="text-echon-cream text-xl">Loading stories...</div>
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
            🎙️ Stories
          </h1>
          <button
            onClick={() => setShowRecorder(true)}
            className="echon-btn-secondary"
          >
            + Record
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {stories.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="text-8xl mb-6">🎙️</div>
            <h2 className="text-2xl font-serif text-echon-cream mb-4">
              No stories yet
            </h2>
            <p className="text-echon-cream-dark mb-8">
              Preserve your family's voice for generations
            </p>
            <button
              onClick={() => setShowRecorder(true)}
              className="echon-btn"
            >
              Record Your First Story
            </button>
          </motion.div>
        ) : (
          /* Story Cards */
          <div className="space-y-6">
            {stories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                onDelete={handleDelete}
                canDelete={currentUser?.id === story.author_id}
              />
            ))}

            {/* Load More */}
            {hasMore && (
              <div className="text-center pt-8">
                <button
                  onClick={() => loadStories(page + 1)}
                  className="echon-btn-secondary"
                >
                  Load More Stories
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Voice Recorder Modal */}
      <AnimatePresence>
        {showRecorder && (
          <VoiceRecorder
            onSuccess={handleRecordSuccess}
            onCancel={() => setShowRecorder(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}