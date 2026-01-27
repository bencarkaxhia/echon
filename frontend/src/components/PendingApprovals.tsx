/**
 * Pending Approvals Component
 * View and approve/reject pending membership requests
 * 
 * PATH: echon/frontend/src/components/PendingApprovals.tsx
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { invitationsApi } from '../lib/api';
import { getCurrentSpace } from '../lib/auth';

interface PendingMember {
  membership_id: string;
  user_id: string;
  user_name: string;
  user_email?: string;
  user_phone?: string;
  relationship?: string;
  joined_at: string;
}

interface PendingApprovalsProps {
  onClose: () => void;
  onApproved: () => void;
}

export default function PendingApprovals({ onClose, onApproved }: PendingApprovalsProps) {
  const [pending, setPending] = useState<PendingMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadPending();
  }, []);

  const loadPending = async () => {
    try {
      const spaceId = getCurrentSpace();
      if (!spaceId) return;

      const data = await invitationsApi.getPendingApprovals(spaceId);
      setPending(data.pending_approvals);
    } catch (error) {
      console.error('Failed to load pending approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (membershipId: string, userName: string) => {
    setProcessing(membershipId);
    try {
      const spaceId = getCurrentSpace();
      if (!spaceId) return;

      await invitationsApi.approveMembership(membershipId, spaceId, true);
      
      // Remove from list
      setPending(prev => prev.filter(m => m.membership_id !== membershipId));
      
      alert(`${userName} has been approved!`);
      onApproved(); // Refresh member list
    } catch (error: any) {
      console.error('Failed to approve:', error);
      alert(error.response?.data?.detail || 'Failed to approve member');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (membershipId: string, userName: string) => {
    if (!confirm(`Reject ${userName}'s request to join?`)) return;

    setProcessing(membershipId);
    try {
      const spaceId = getCurrentSpace();
      if (!spaceId) return;

      await invitationsApi.approveMembership(membershipId, spaceId, false);
      
      // Remove from list
      setPending(prev => prev.filter(m => m.membership_id !== membershipId));
      
      alert(`${userName}'s request has been rejected`);
    } catch (error: any) {
      console.error('Failed to reject:', error);
      alert(error.response?.data?.detail || 'Failed to reject member');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        className="echon-card max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <h2 className="text-2xl font-serif text-echon-cream mb-2">
          ⏳ Pending Approvals
        </h2>
        <p className="text-echon-cream-dark mb-6">
          Review and approve members waiting to join your family space
        </p>

        {loading ? (
          <div className="text-center py-8">
            <div className="text-echon-cream">Loading...</div>
          </div>
        ) : pending.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">✅</div>
            <p className="text-echon-cream-dark">No pending approvals</p>
            <button onClick={onClose} className="echon-btn mt-6">
              Close
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map((member) => (
              <div
                key={member.membership_id}
                className="bg-echon-shadow border border-echon-wood rounded-lg p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-echon-cream font-semibold mb-1">
                      {member.user_name}
                    </h3>
                    <div className="text-echon-cream-dark text-sm space-y-1">
                      {member.user_email && <p>📧 {member.user_email}</p>}
                      {member.user_phone && <p>📱 {member.user_phone}</p>}
                      {member.relationship && (
                        <p className="text-echon-gold">
                          👨‍👩‍👧‍👦 {member.relationship}
                        </p>
                      )}
                      <p className="text-xs">
                        Requested: {new Date(member.joined_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(member.membership_id, member.user_name)}
                      disabled={processing === member.membership_id}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleReject(member.membership_id, member.user_name)}
                      disabled={processing === member.membership_id}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <button onClick={onClose} className="echon-btn-secondary w-full mt-4">
              Close
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}