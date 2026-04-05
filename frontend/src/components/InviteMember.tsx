/**
 * Invite Member Component
 * Generate invitation codes for new family members
 * 
 * PATH: echon/frontend/src/components/InviteMember.tsx
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { invitationsApi } from '../lib/api';
import { getCurrentSpace } from '../lib/auth';

interface InviteMemberProps {
  onClose: () => void;
}

export default function InviteMember({ onClose }: InviteMemberProps) {
  const [step, setStep] = useState<'form' | 'code'>('form');
  const [generating, setGenerating] = useState(false);
  const [invitationCode, setInvitationCode] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [msgCopied, setMsgCopied] = useState(false);
  const [inviteeInfo, setInviteeInfo] = useState({
    name: '',
    contact: '',
    relationship: '',
    message: '',
  });

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteeInfo.name || !inviteeInfo.contact) return;

    setGenerating(true);
    try {
      const spaceId = getCurrentSpace();
      if (!spaceId) throw new Error('No space selected');

      const result = await invitationsApi.createInvitationCode(
        spaceId,
        inviteeInfo.name,
        inviteeInfo.contact,
        inviteeInfo.relationship || undefined,
        inviteeInfo.message || undefined
      );

      setInvitationCode(result.invitation_code);
      setStep('code');
    } catch (error: any) {
      console.error('Failed to generate code:', error);
      alert(error.response?.data?.detail || 'Failed to generate invitation code');
    } finally {
      setGenerating(false);
    }
  };

  const joinLink = `${window.location.origin}/join/${invitationCode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(joinLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  };

  const handleCopyMessage = () => {
    const message = `${inviteeInfo.name}, you're invited to join our family space on Echon!

Tap the link below — it opens the registration form directly:
${joinLink}

Just fill in your name, email, and password. That's it.

Looking forward to having you with us!`;

    navigator.clipboard.writeText(message);
    setMsgCopied(true);
    setTimeout(() => setMsgCopied(false), 2500);
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
        {step === 'form' ? (
          /* STEP 1: Enter Invitee Info */
          <>
            <h2 className="text-2xl font-serif text-echon-cream mb-2">
              🔑 Invite Family Member
            </h2>
            <p className="text-echon-cream-dark mb-6">
              Generate a secure invitation code to invite someone to your family space
            </p>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-echon-cream text-sm mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={inviteeInfo.name}
                  onChange={(e) => setInviteeInfo({ ...inviteeInfo, name: e.target.value })}
                  className="echon-input"
                  placeholder="Mom, Dad, Sister..."
                  required
                />
              </div>

              <div>
                <label className="block text-echon-cream text-sm mb-2">
                  Email or Phone *
                </label>
                <input
                  type="text"
                  value={inviteeInfo.contact}
                  onChange={(e) => setInviteeInfo({ ...inviteeInfo, contact: e.target.value })}
                  className="echon-input"
                  placeholder="email@example.com or +1234567890"
                  required
                />
              </div>

              <div>
                <label className="block text-echon-cream text-sm mb-2">
                  Relationship (Optional)
                </label>
                <input
                  type="text"
                  value={inviteeInfo.relationship}
                  onChange={(e) => setInviteeInfo({ ...inviteeInfo, relationship: e.target.value })}
                  className="echon-input"
                  placeholder="Mother, Father, Sister, Brother..."
                />
              </div>

              <div>
                <label className="block text-echon-cream text-sm mb-2">
                  Personal Message (Optional)
                </label>
                <textarea
                  value={inviteeInfo.message}
                  onChange={(e) => setInviteeInfo({ ...inviteeInfo, message: e.target.value })}
                  className="echon-input min-h-[80px]"
                  placeholder="Add a personal message..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="echon-btn-secondary flex-1"
                  disabled={generating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="echon-btn flex-1"
                  disabled={generating}
                >
                  {generating ? 'Generating...' : 'Generate Code'}
                </button>
              </div>
            </form>
          </>
        ) : (
          /* STEP 2: Show Magic Link */
          <>
            <div className="text-center mb-6">
              <div className="text-6xl mb-3">🔗</div>
              <h2 className="text-2xl font-serif text-echon-cream mb-1">
                Invitation Ready
              </h2>
              <p className="text-echon-cream-dark text-sm">
                Share the link below with {inviteeInfo.name} — one tap and they're in.
              </p>
            </div>

            {/* Magic link — primary CTA */}
            <div className="bg-echon-shadow border-2 border-echon-gold rounded-xl p-4 mb-4">
              <p className="text-echon-cream-dark text-xs mb-2 uppercase tracking-widest">Invitation Link</p>
              <p className="text-echon-gold text-sm font-mono break-all mb-3 select-all leading-relaxed">
                {joinLink}
              </p>
              <button
                onClick={handleCopyLink}
                className="echon-btn w-full text-sm"
              >
                {linkCopied ? '✓ Link Copied!' : '📋 Copy Link'}
              </button>
            </div>

            <p className="text-echon-cream-dark text-xs text-center mb-4">
              They tap the link → form opens → fills name & password → done. No code typing needed.
            </p>

            {/* Full message for WhatsApp/Telegram/Email */}
            <button
              onClick={handleCopyMessage}
              className="echon-btn-secondary w-full mb-3 text-sm"
            >
              {msgCopied ? '✓ Message Copied!' : '💬 Copy Ready-to-Send Message'}
            </button>

            <button
              onClick={onClose}
              className="w-full py-2 text-echon-cream-dark text-sm hover:text-echon-cream transition-colors"
            >
              Done
            </button>

            <p className="text-echon-cream-dark/50 text-xs text-center mt-4">
              Expires in 30 days · {invitationCode}
            </p>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}