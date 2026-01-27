/**
 * Space Selector Page
 * Choose existing space, create new, or join with code
 * 
 * PATH: echon/frontend/src/pages/SpaceSelector.tsx
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { invitationsApi } from '../lib/api';
import { setCurrentSpace, logout } from '../lib/auth';

interface UserSpace {
  space_id: string;
  space_name: string;
  role: string;
  joined_at: string;
  emblem_url?: string;
}

export default function SpaceSelector() {
  const navigate = useNavigate();
  const [spaces, setSpaces] = useState<UserSpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJoin, setShowJoin] = useState(false);
  const [invitationCode, setInvitationCode] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    loadSpaces();
  }, []);

  const loadSpaces = async () => {
    try {
      const data = await invitationsApi.getMySpaces();
      setSpaces(data.spaces);
      
      // If user has exactly 1 space, auto-select it
      if (data.spaces.length === 1) {
        handleSelectSpace(data.spaces[0].space_id);
      } else if (data.spaces.length === 0) {
        // No approved spaces - might have pending
        // Show info message
        const hasPendingCheck = localStorage.getItem('echon_pending_join');
        if (hasPendingCheck) {
          alert('⏳ Your request to join a family space is still pending approval.\n\nPlease wait for the space admin to approve your request. You can also create your own space or join a different one with another code.');
          localStorage.removeItem('echon_pending_join');
        }
      }
    } catch (error) {
      console.error('Failed to load spaces:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSpace = (spaceId: string) => {
    setCurrentSpace(spaceId);
    navigate('/space');
  };

  const handleJoinWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitationCode.trim()) return;

    setJoining(true);
    try {
      const result = await invitationsApi.joinWithCode(invitationCode.trim());
      
      if (result.status === 'pending_approval') {
        // Show success message
        alert(`✅ Success! Your request to join "${result.space_name}" has been submitted.

The space admin will review your request. You'll be able to enter once approved.

You'll now be logged out. Please login again later to check if you've been approved.`);
        
        // Set flag so we can show message on next login
        localStorage.setItem('echon_pending_join', 'true');
        
        // Auto logout to clear state
        logout(); // This will redirect to landing page
      }
    } catch (error: any) {
      console.error('Failed to join:', error);
      alert(error.response?.data?.detail || 'Invalid invitation code');
      setJoining(false); // Only reset if error
    }
    // Don't reset joining state on success - logout will handle navigation
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-echon-black flex items-center justify-center">
        <div className="text-echon-cream text-xl">Loading your spaces...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-echon-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full"
      >
        <h1 className="text-4xl font-serif text-echon-cream text-center mb-2">
          Your Family Spaces
        </h1>
        <p className="text-echon-cream-dark text-center mb-12">
          Choose a space to enter, or create/join a new one
        </p>

        {/* Existing Spaces */}
        {spaces.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {spaces.map((space) => (
              <motion.div
                key={space.space_id}
                whileHover={{ scale: 1.02 }}
                onClick={() => handleSelectSpace(space.space_id)}
                className="echon-card cursor-pointer hover:border-echon-gold transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-echon-shadow border-2 border-echon-gold flex items-center justify-center">
                    {space.emblem_url ? (
                      <img src={space.emblem_url} alt={space.space_name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-2xl text-echon-gold">{space.space_name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-serif text-echon-cream">{space.space_name}</h3>
                    <p className="text-echon-cream-dark text-sm capitalize">{space.role}</p>
                  </div>
                  <span className="text-echon-gold text-2xl">→</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <button
            onClick={() => navigate('/create-space')}
            className="echon-btn text-center py-6"
          >
            <div className="text-3xl mb-2">🏛️</div>
            <div className="text-lg">Create New Space</div>
            <div className="text-sm text-echon-cream-dark mt-1">Start your family heritage</div>
          </button>

          <button
            onClick={() => setShowJoin(true)}
            className="echon-btn-secondary text-center py-6"
          >
            <div className="text-3xl mb-2">🔑</div>
            <div className="text-lg">Join with Code</div>
            <div className="text-sm text-echon-cream-dark mt-1">Enter invitation code</div>
          </button>
        </div>

        {/* Logout Button (when no spaces - user might be waiting for approval) */}
        {spaces.length === 0 && (
          <div className="text-center mt-8">
            <button
              onClick={() => logout()}
              className="px-6 py-3 bg-echon-shadow border border-echon-wood rounded-lg text-echon-cream hover:bg-echon-wood hover:border-echon-gold transition-colors"
            >
              🚪 Logout
            </button>
            <p className="text-echon-cream-dark text-xs mt-2">
              Waiting for approval? Come back later
            </p>
          </div>
        )}

        {/* Join Modal */}
        {showJoin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setShowJoin(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              onClick={(e) => e.stopPropagation()}
              className="echon-card max-w-md w-full"
            >
              <h2 className="text-2xl font-serif text-echon-cream mb-4">
                Join a Family Space
              </h2>
              <p className="text-echon-cream-dark mb-6">
                Enter the invitation code you received from a family member
              </p>

              <form onSubmit={handleJoinWithCode} className="space-y-4">
                <div>
                  <label className="block text-echon-cream text-sm mb-2">
                    Invitation Code
                  </label>
                  <input
                    type="text"
                    value={invitationCode}
                    onChange={(e) => setInvitationCode(e.target.value)}
                    placeholder="inv_2026_xKj9mP4nQ8"
                    className="echon-input font-mono"
                    required
                    disabled={joining}
                  />
                  <p className="text-echon-cream-dark text-xs mt-2">
                    Example: inv_2026_xKj9mP4nQ8
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowJoin(false)}
                    className="echon-btn-secondary flex-1"
                    disabled={joining}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="echon-btn flex-1"
                    disabled={joining}
                  >
                    {joining ? 'Joining...' : 'Join Space'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}