/**
 * Pending Approvals Component
 * Two tabs: sent invitations (code issued, not yet used) + pending approvals (used code, awaiting approval)
 *
 * PATH: echon/frontend/src/components/PendingApprovals.tsx
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { invitationsApi } from '../lib/api';
import { getCurrentSpace } from '../lib/auth';
import { relationshipLabel } from '../lib/relationshipTypes';

interface SentInvitation {
  id: string;
  invitee_name: string;
  invitee_contact: string;
  relationship?: string;
  token: string;
  created_at: string;
  expires_at: string;
}

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
  const [tab, setTab] = useState<'sent' | 'approvals'>('sent');
  const [sent, setSent] = useState<SentInvitation[]>([]);
  const [pending, setPending] = useState<PendingMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const spaceId = getCurrentSpace();
    if (!spaceId) { setLoading(false); return; }
    try {
      const [sentData, approvalData] = await Promise.all([
        invitationsApi.getSentInvitations(spaceId),
        invitationsApi.getPendingApprovals(spaceId),
      ]);
      setSent(sentData.sent_invitations);
      setPending(approvalData.pending_approvals);
      // Auto-switch to approvals tab if there are people waiting
      if (approvalData.total > 0) setTab('approvals');
    } catch (err) {
      console.error('Failed to load invitations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (invitationId: string, name: string) => {
    if (!confirm(`Delete invitation for ${name}?`)) return;
    try {
      await invitationsApi.deleteInvitation(invitationId);
      setSent(prev => prev.filter(i => i.id !== invitationId));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete invitation');
    }
  };

  const handleCopyCode = (token: string, name: string) => {
    const link = `${window.location.origin}/join/${token}`;
    const msg = `${name}, you're invited to join our family space on Echon!\n\nTap the link to register:\n${link}`;
    navigator.clipboard.writeText(msg);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleApprove = async (membershipId: string) => {
    setProcessing(membershipId);
    try {
      const spaceId = getCurrentSpace();
      if (!spaceId) return;
      await invitationsApi.approveMembership(membershipId, spaceId, true);
      setPending(prev => prev.filter(m => m.membership_id !== membershipId));
      onApproved();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to approve member');
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
      setPending(prev => prev.filter(m => m.membership_id !== membershipId));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to reject');
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
        <h2 className="text-2xl font-serif text-echon-cream mb-1">Invitations</h2>
        <p className="text-echon-cream-dark text-sm mb-5">
          Manage your sent invitations and approve members
        </p>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setTab('sent')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'sent'
                ? 'bg-echon-gold/20 text-echon-gold border border-echon-gold/40'
                : 'text-echon-cream-dark hover:text-echon-cream border border-echon-wood/30'
            }`}
          >
            📨 Invited
            {sent.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-echon-gold/30 text-echon-gold text-xs rounded-full">
                {sent.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('approvals')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'approvals'
                ? 'bg-echon-gold/20 text-echon-gold border border-echon-gold/40'
                : 'text-echon-cream-dark hover:text-echon-cream border border-echon-wood/30'
            }`}
          >
            ⏳ Awaiting Approval
            {pending.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-amber-600/40 text-amber-300 text-xs rounded-full">
                {pending.length}
              </span>
            )}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-echon-cream-dark">Loading…</div>
        ) : tab === 'sent' ? (
          /* ── Sent invitations ── */
          sent.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">📨</div>
              <p className="text-echon-cream-dark">No pending invitations</p>
              <p className="text-echon-cream-dark/60 text-sm mt-1">
                Codes are shown here until the invitee registers
              </p>
              <button onClick={onClose} className="echon-btn mt-6">Close</button>
            </div>
          ) : (
            <div className="space-y-3">
              {sent.map((inv) => (
                <div
                  key={inv.id}
                  className="bg-echon-shadow border border-echon-wood/40 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-echon-cream font-semibold">{inv.invitee_name}</p>
                      <p className="text-echon-cream-dark text-sm truncate">{inv.invitee_contact}</p>
                      {inv.relationship && (
                        <p className="text-echon-gold text-xs mt-0.5">{relationshipLabel(inv.relationship)}</p>
                      )}
                      <p className="text-echon-cream-dark/50 text-xs mt-1 font-mono">{inv.token}</p>
                    </div>
                    <div className="flex flex-col gap-1.5 shrink-0">
                      <button
                        onClick={() => handleCopyCode(inv.token, inv.invitee_name)}
                        className="px-3 py-1.5 text-xs bg-echon-gold/15 border border-echon-gold/30 text-echon-gold rounded-lg hover:bg-echon-gold/25 transition-colors"
                      >
                        {copied === inv.token ? '✓ Copied' : '📋 Copy'}
                      </button>
                      <button
                        onClick={() => handleDelete(inv.id, inv.invitee_name)}
                        className="px-3 py-1.5 text-xs bg-red-900/20 border border-red-700/30 text-red-400 rounded-lg hover:bg-red-900/40 transition-colors"
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-echon-cream-dark/40 text-xs mt-2">
                    Sent {new Date(inv.created_at).toLocaleDateString()} ·
                    Expires {new Date(inv.expires_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
              <button onClick={onClose} className="echon-btn-secondary w-full mt-2">Close</button>
            </div>
          )
        ) : (
          /* ── Pending approvals ── */
          pending.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">✅</div>
              <p className="text-echon-cream-dark">No pending approvals</p>
              <button onClick={onClose} className="echon-btn mt-6">Close</button>
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
                      <h3 className="text-echon-cream font-semibold mb-1">{member.user_name}</h3>
                      <div className="text-echon-cream-dark text-sm space-y-0.5">
                        {member.user_email && <p>📧 {member.user_email}</p>}
                        {member.user_phone && <p>📱 {member.user_phone}</p>}
                        {member.relationship && (
                          <p className="text-echon-gold">👨‍👩‍👧‍👦 {relationshipLabel(member.relationship)}</p>
                        )}
                        <p className="text-xs text-echon-cream-dark/60">
                          Requested: {new Date(member.joined_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleApprove(member.membership_id)}
                        disabled={processing === member.membership_id}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleReject(member.membership_id, member.user_name)}
                        disabled={processing === member.membership_id}
                        className="px-4 py-2 bg-red-600/80 hover:bg-red-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                      >
                        ✗ Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={onClose} className="echon-btn-secondary w-full mt-2">Close</button>
            </div>
          )
        )}
      </motion.div>
    </motion.div>
  );
}
