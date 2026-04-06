/**
 * Memories Page
 * Timeline of family photos and memories, browsable by decade.
 *
 * PATH: echon/frontend/src/pages/Memories.tsx
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { postsApi, Post } from '../lib/api';
import { getCurrentSpace, getCurrentUser } from '../lib/auth';
import MemoryCard from '../components/MemoryCard';
import UploadMemory from '../components/UploadMemory';
import { useNavigate } from 'react-router-dom';

interface DecadeTab {
  decade: string;
  count: number;
}

export default function Memories() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  // Decade filter
  const [decades, setDecades] = useState<DecadeTab[]>([]);
  const [activeDecade, setActiveDecade] = useState<string | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Post[] | null>(null);
  const [searching, setSearching] = useState(false);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const spaceId = getCurrentSpace();

  // ── Load decades ──
  useEffect(() => {
    if (!spaceId) return;
    postsApi.getDecades(spaceId).then(d => setDecades(d.decades)).catch(() => {});
  }, [spaceId]);

  // ── Load posts ──
  const loadPosts = useCallback(async (pageNum = 1, decade: string | null = activeDecade) => {
    if (!spaceId) { navigate('/create-space'); return; }
    try {
      const data = decade
        ? await postsApi.getSpacePostsByDecade(spaceId, decade, pageNum)
        : await postsApi.getSpacePosts(spaceId, pageNum, 20);

      if (pageNum === 1) {
        setPosts(data.posts);
      } else {
        setPosts(prev => [...prev, ...data.posts]);
      }
      setHasMore(data.has_more);
      setPage(pageNum);
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setLoading(false);
    }
  }, [spaceId, activeDecade, navigate]);

  useEffect(() => {
    setLoading(true);
    loadPosts(1, activeDecade);
  }, [activeDecade]);

  // ── Search (debounced, backend) ──
  useEffect(() => {
    if (searchDebounce.current) clearTimeout(searchDebounce.current);
    if (!searchQuery.trim()) { setSearchResults(null); return; }
    searchDebounce.current = setTimeout(async () => {
      if (!spaceId) return;
      setSearching(true);
      try {
        const data = await postsApi.searchPosts(spaceId, searchQuery.trim());
        // Map search results to Post shape
        const mapped: Post[] = data.results.map(r => ({
          id: r.id,
          space_id: spaceId,
          user_id: '',
          content: r.content,
          media_urls: r.media_urls.length > 0 ? r.media_urls : undefined,
          event_date: r.event_date,
          location: r.location,
          privacy_level: 'space',
          is_pinned: r.is_pinned,
          created_at: r.created_at,
          updated_at: r.created_at,
          user: { id: '', name: r.author_name, profile_photo_url: r.author_photo },
          tags: r.tags,
          comment_count: 0,
          reaction_count: 0,
        }));
        setSearchResults(mapped);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setSearching(false);
      }
    }, 350);
  }, [searchQuery, spaceId]);

  const handleUploadSuccess = () => {
    setShowUpload(false);
    // Refresh decades in case a new decade was created
    if (spaceId) postsApi.getDecades(spaceId).then(d => setDecades(d.decades)).catch(() => {});
    loadPosts(1, activeDecade);
  };

  const handleEdit = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post) setEditingPost(post);
  };

  const handleDelete = async (postId: string) => {
    if (!spaceId) return;
    try {
      await postsApi.deletePost(postId, spaceId);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch {
      alert('Failed to delete memory');
    }
  };

  const handlePinToggle = (postId: string, pinned: boolean) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, is_pinned: pinned } : p));
  };

  const handleUpdatePost = async (updates: {
    caption?: string; location?: string; event_date?: string; tags?: string;
  }) => {
    if (!editingPost || !spaceId) return;
    try {
      await postsApi.updatePost(editingPost.id, spaceId, updates);
      setEditingPost(null);
      loadPosts(1, activeDecade);
    } catch {
      alert('Failed to update memory');
    }
  };

  // What to show
  const displayPosts = searchResults ?? posts;
  const pinnedPosts = searchResults ? [] : displayPosts.filter(p => p.is_pinned);
  const unpinnedPosts = searchResults ? displayPosts : displayPosts.filter(p => !p.is_pinned);

  if (loading) {
    return (
      <div className="min-h-screen bg-echon-black flex items-center justify-center">
        <div className="text-echon-cream text-xl">Loading memories…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-echon-black">

      {/* ── Header ── */}
      <div className="bg-echon-shadow border-b border-echon-wood sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/space')}
            className="text-echon-cream-dark hover:text-echon-cream transition-colors">
            ← Back
          </button>
          <h1 className="text-2xl font-serif text-echon-cream">📸 Memories</h1>
          <button onClick={() => setShowUpload(true)} className="echon-btn-secondary">
            + Add Memory
          </button>
        </div>

        {/* ── Search ── */}
        <div className="max-w-4xl mx-auto px-4 pb-3">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🔍 Search memories…"
              className="echon-input w-full pr-8"
            />
            {searching && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-echon-cream-dark text-xs">
                …
              </span>
            )}
            {searchQuery && !searching && (
              <button
                onClick={() => { setSearchQuery(''); setSearchResults(null); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-echon-cream-dark hover:text-echon-cream text-sm"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* ── Decade tabs ── */}
        {!searchQuery && decades.length > 0 && (
          <div className="max-w-4xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveDecade(null)}
              className={`flex-shrink-0 px-4 py-1 rounded-full text-sm transition-colors ${
                activeDecade === null
                  ? 'bg-echon-gold text-echon-black font-semibold'
                  : 'bg-echon-shadow border border-echon-wood text-echon-cream-dark hover:border-echon-gold'
              }`}
            >
              All
            </button>
            {decades.map(({ decade, count }) => (
              <button
                key={decade}
                onClick={() => setActiveDecade(decade)}
                className={`flex-shrink-0 px-4 py-1 rounded-full text-sm transition-colors ${
                  activeDecade === decade
                    ? 'bg-echon-gold text-echon-black font-semibold'
                    : 'bg-echon-shadow border border-echon-wood text-echon-cream-dark hover:border-echon-gold'
                }`}
              >
                {decade}
                <span className="ml-1 text-xs opacity-70">({count})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Timeline ── */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Search result count */}
        {searchResults !== null && (
          <p className="text-echon-cream-dark text-sm">
            {searchResults.length === 0
              ? `No results for "${searchQuery}"`
              : `${searchResults.length} result${searchResults.length > 1 ? 's' : ''} for "${searchQuery}"`
            }
          </p>
        )}

        {displayPosts.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-center py-20">
            <div className="text-8xl mb-6">
              {activeDecade ? '🕰️' : '📸'}
            </div>
            <h2 className="text-2xl font-serif text-echon-cream mb-4">
              {activeDecade ? `No memories from the ${activeDecade}` : 'No memories yet'}
            </h2>
            {!activeDecade && (
              <>
                <p className="text-echon-cream-dark mb-8">Start preserving your family's precious moments</p>
                <button onClick={() => setShowUpload(true)} className="echon-btn">
                  Share Your First Memory
                </button>
              </>
            )}
          </motion.div>
        ) : (
          <>
            {/* Pinned section */}
            {pinnedPosts.length > 0 && (
              <div>
                <p className="text-echon-gold text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span>📌</span> Pinned
                </p>
                <div className="space-y-4">
                  {pinnedPosts.map(post => (
                    <MemoryCard
                      key={post.id}
                      post={post}
                      onImageClick={setLightboxImage}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onPinToggle={handlePinToggle}
                      canEdit={currentUser?.id === post.user_id}
                      canPin
                    />
                  ))}
                </div>
                {unpinnedPosts.length > 0 && (
                  <div className="border-t border-echon-wood/40 my-6" />
                )}
              </div>
            )}

            {/* Regular posts */}
            {unpinnedPosts.map(post => (
              <MemoryCard
                key={post.id}
                post={post}
                onImageClick={setLightboxImage}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onPinToggle={handlePinToggle}
                canEdit={currentUser?.id === post.user_id}
                canPin
              />
            ))}

            {/* Load more */}
            {!searchResults && hasMore && (
              <div className="text-center pt-4">
                <button onClick={() => loadPosts(page + 1)} className="echon-btn-secondary">
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Upload modal ── */}
      <AnimatePresence>
        {showUpload && (
          <UploadMemory onSuccess={handleUploadSuccess} onCancel={() => setShowUpload(false)} />
        )}
      </AnimatePresence>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4"
            onClick={() => setLightboxImage(null)}
          >
            <motion.img
              initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}
              src={lightboxImage} alt="Memory"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 text-white text-4xl hover:text-echon-candle transition-colors">
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Edit modal ── */}
      <AnimatePresence>
        {editingPost && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setEditingPost(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="echon-card max-w-2xl w-full"
            >
              <h2 className="text-2xl font-serif text-echon-cream mb-6">Edit Memory</h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  handleUpdatePost({
                    caption: fd.get('caption') as string,
                    location: fd.get('location') as string,
                    event_date: fd.get('event_date') as string,
                    tags: fd.get('tags') as string,
                  });
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-echon-cream text-sm mb-1">Caption</label>
                  <textarea name="caption" defaultValue={editingPost.content || ''}
                    className="echon-input min-h-[100px]" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-echon-cream text-sm mb-1">Date</label>
                    <input type="date" name="event_date"
                      defaultValue={editingPost.event_date?.length === 4
                        ? `${editingPost.event_date}-01-01`
                        : editingPost.event_date || ''}
                      className="echon-input" />
                  </div>
                  <div>
                    <label className="block text-echon-cream text-sm mb-1">Location</label>
                    <input type="text" name="location"
                      defaultValue={editingPost.location || ''} className="echon-input" />
                  </div>
                </div>
                <div>
                  <label className="block text-echon-cream text-sm mb-1">Tags (comma-separated)</label>
                  <input type="text" name="tags"
                    defaultValue={editingPost.tags?.join(', ') || ''} className="echon-input" />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setEditingPost(null)}
                    className="echon-btn-secondary flex-1">Cancel</button>
                  <button type="submit" className="echon-btn flex-1">Save Changes</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
