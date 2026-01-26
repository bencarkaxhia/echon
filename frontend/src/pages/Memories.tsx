/**
 * Memories Page
 * Timeline of family photos and memories
 * 
 * PATH: echon/frontend/src/pages/Memories.tsx
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { postsApi, Post } from '../lib/api';
import { getCurrentSpace } from '../lib/auth';
import MemoryCard from '../components/MemoryCard';
import UploadMemory from '../components/UploadMemory';
import { useNavigate } from 'react-router-dom';

export default function Memories() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const loadPosts = async (pageNum: number = 1) => {
    try {
      const spaceId = getCurrentSpace();
      if (!spaceId) {
        navigate('/create-space');
        return;
      }

      const data = await postsApi.getSpacePosts(spaceId, pageNum, 20);
      
      if (pageNum === 1) {
        setPosts(data.posts);
      } else {
        setPosts(prev => [...prev, ...data.posts]);
      }
      
      setHasMore(data.has_more);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts(1);
  }, []);

  const handleUploadSuccess = () => {
    setShowUpload(false);
    loadPosts(1); // Reload first page
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-echon-black flex items-center justify-center">
        <div className="text-echon-cream text-xl">Loading memories...</div>
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
            📸 Memories
          </h1>
          <button
            onClick={() => setShowUpload(true)}
            className="echon-btn-secondary"
          >
            + Add Memory
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {posts.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="text-8xl mb-6">📸</div>
            <h2 className="text-2xl font-serif text-echon-cream mb-4">
              No memories yet
            </h2>
            <p className="text-echon-cream-dark mb-8">
              Start preserving your family's precious moments
            </p>
            <button
              onClick={() => setShowUpload(true)}
              className="echon-btn"
            >
              Share Your First Memory
            </button>
          </motion.div>
        ) : (
          /* Memory Cards */
          <div className="space-y-6">
            {posts.map((post) => (
              <MemoryCard
                key={post.id}
                post={post}
                onImageClick={setLightboxImage}
              />
            ))}

            {/* Load More */}
            {hasMore && (
              <div className="text-center pt-8">
                <button
                  onClick={() => loadPosts(page + 1)}
                  className="echon-btn-secondary"
                >
                  Load More Memories
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <UploadMemory
            onSuccess={handleUploadSuccess}
            onCancel={() => setShowUpload(false)}
          />
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4"
            onClick={() => setLightboxImage(null)}
          >
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              src={lightboxImage}
              alt="Memory"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 text-white text-4xl hover:text-echon-candle transition-colors"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}