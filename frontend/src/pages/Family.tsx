/**
 * Family Page
 * Grid of all family members
 * 
 * PATH: echon/frontend/src/pages/Family.tsx
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { familyApi, MemberProfile, invitationsApi } from '../lib/api';
import { getCurrentSpace, getCurrentUser } from '../lib/auth';
import MemberCard from '../components/MemberCard';
import InviteMember from '../components/InviteMember';
import PendingApprovals from '../components/PendingApprovals';

export default function Family() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, founders: 0, elders: 0, regular_members: 0 });
  const [showInvite, setShowInvite] = useState(false);
  const [showPending, setShowPending] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const currentUser = getCurrentUser();
  
  // Check if current user is a founder
  const isFounder = members.find(m => m.id === currentUser?.id)?.role === 'founder';

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const spaceId = getCurrentSpace();
      if (!spaceId) {
        navigate('/create-space');
        return;
      }

      const data = await familyApi.getSpaceMembers(spaceId);
      setMembers(data.members);
      setStats({
        total: data.total,
        founders: data.founders,
        elders: data.elders,
        regular_members: data.regular_members,
      });
      
      // Load pending count for founders
      const userMember = data.members.find((m: MemberProfile) => m.id === currentUser?.id);
      if (userMember?.role === 'founder') {
        try {
          const [pendingData, sentData] = await Promise.all([
            invitationsApi.getPendingApprovals(spaceId),
            invitationsApi.getSentInvitations(spaceId),
          ]);
          setPendingCount(pendingData.total + sentData.total);
        } catch (err) {
          console.error('Failed to load pending approvals:', err);
        }
      }
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-echon-black flex items-center justify-center">
        <div className="text-echon-cream text-xl">Loading family members...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-echon-black">
      {/* Header */}
      <div className="bg-echon-shadow border-b border-echon-wood sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/space')}
            className="text-echon-cream-dark hover:text-echon-cream transition-colors"
          >
            ← Back to Space
          </button>
          <h1 className="text-2xl font-serif text-echon-cream">
            👥 Family
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/space/family/tree')}
              className="echon-btn-secondary flex items-center gap-2"
            >
              🌳 Tree
            </button>
            <button
              onClick={() => setShowInvite(true)}
              className="echon-btn-secondary"
            >
              + Invite
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-echon-shadow/50 border-b border-echon-wood">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex gap-8 justify-center items-center text-center">
            <div>
              <p className="text-2xl font-bold text-echon-cream">{stats.total}</p>
              <p className="text-sm text-echon-cream-dark">Total Members</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-echon-candle">{stats.founders}</p>
              <p className="text-sm text-echon-cream-dark">Founders</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-echon-gold">{stats.elders}</p>
              <p className="text-sm text-echon-cream-dark">Elders</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-echon-cream">{stats.regular_members}</p>
              <p className="text-sm text-echon-cream-dark">Members</p>
            </div>
            
            {/* Pending Approvals Button (Founders Only) */}
            {isFounder && pendingCount > 0 && (
              <div>
                <button
                  onClick={() => setShowPending(true)}
                  className="relative px-4 py-2 bg-echon-candle text-echon-black font-semibold rounded-lg hover:bg-echon-gold transition-colors"
                >
                  ⏳ {pendingCount} Pending
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Member Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {members.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="text-8xl mb-6">👥</div>
            <h2 className="text-2xl font-serif text-echon-cream mb-4">
              Your family awaits
            </h2>
            <p className="text-echon-cream-dark mb-8">
              Invite family members to join this space
            </p>
            <button className="echon-btn">
              Invite Family Members
            </button>
          </motion.div>
        ) : (
          /* Member Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {members.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInvite && (
          <InviteMember onClose={() => setShowInvite(false)} />
        )}
      </AnimatePresence>

      {/* Pending Approvals Modal */}
      <AnimatePresence>
        {showPending && (
          <PendingApprovals
            onClose={() => setShowPending(false)}
            onApproved={() => {
              loadMembers(); // Refresh member list
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}