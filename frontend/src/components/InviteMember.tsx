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

  const handleCopyCode = () => {
    navigator.clipboard.writeText(invitationCode);
    alert('Invitation code copied to clipboard!');
  };

  const handleCopyMessage = () => {
    const message = `You're invited to join our family space on Echon!

Your invitation code: ${invitationCode}

Steps to join:
1. Go to app.echon.com
2. Create an account
3. Click "Join with Code"
4. Enter the code above
5. Wait for approval

Looking forward to having you in our family space!`;

    navigator.clipboard.writeText(message);
    alert('Invitation message copied! You can now paste it in WhatsApp, email, or SMS.');
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
          /* STEP 2: Show Generated Code */
          <>
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-serif text-echon-cream mb-2">
                Invitation Code Generated!
              </h2>
              <p className="text-echon-cream-dark">
                Share this code with {inviteeInfo.name}
              </p>
            </div>

            {/* Code Display */}
            <div className="bg-echon-shadow border-2 border-echon-gold rounded-lg p-6 mb-6 text-center">
              <p className="text-echon-cream-dark text-sm mb-2">Invitation Code:</p>
              <p className="text-echon-gold text-2xl font-mono font-bold mb-4 select-all">
                {invitationCode}
              </p>
              <button
                onClick={handleCopyCode}
                className="echon-btn-secondary w-full"
              >
                📋 Copy Code
              </button>
            </div>

            {/* Instructions */}
            <div className="bg-echon-shadow/50 border border-echon-wood rounded-lg p-4 mb-6">
              <p className="text-echon-cream font-semibold mb-2">How to share:</p>
              <ol className="text-echon-cream-dark text-sm space-y-2 list-decimal list-inside">
                <li>Copy the code above</li>
                <li>Send it via WhatsApp, email, or SMS</li>
                <li>Tell them to register on Echon</li>
                <li>They click "Join with Code" and enter it</li>
                <li>You'll get a notification to approve them</li>
              </ol>
            </div>

            {/* Quick Share */}
            <div className="space-y-3">
              <button
                onClick={handleCopyMessage}
                className="echon-btn w-full"
              >
                💬 Copy Full Invitation Message
              </button>

              <button
                onClick={onClose}
                className="echon-btn-secondary w-full"
              >
                Done
              </button>
            </div>

            <p className="text-echon-cream-dark text-xs text-center mt-4">
              This code expires in 30 days
            </p>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}