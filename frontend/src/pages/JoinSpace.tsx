/**
 * JoinSpace — Magic-link invitation page
 * Accessed via: echon.app/join/:token
 *
 * The token is read from the URL. The page shows the invitee their name + space name
 * pre-fetched from the public preview endpoint, then lets them fill in name/password
 * and submit — all in one screen, no manual code copying.
 *
 * PATH: echon/frontend/src/pages/JoinSpace.tsx
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { invitationsApi } from '../lib/api';
import { setAuthToken, setCurrentUser } from '../lib/auth';
import { groupedRelationshipTypes, relationshipLabel } from '../lib/relationshipTypes';

type Preview = {
  valid: boolean;
  invitee_name: string;
  space_name: string;
  personal_message: string | null;
  expires_at: string;
  already_used: boolean;
  relationship: string | null;
};

export default function JoinSpace() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [preview, setPreview] = useState<Preview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [previewError, setPreviewError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [relationship, setRelationship] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState('');
  const [joined, setJoined] = useState(false);
  const [spaceName, setSpaceName] = useState('');

  // Load invite preview on mount
  useEffect(() => {
    if (!token) {
      setPreviewError('Invalid invitation link.');
      setLoadingPreview(false);
      return;
    }
    invitationsApi.previewInvitation(token)
      .then((data) => {
        setPreview(data);
        // Pre-fill name from invite if provided
        if (data.invitee_name) setName(data.invitee_name);
        if (data.relationship) setRelationship(data.relationship);
      })
      .catch(() => setPreviewError('This invitation link is invalid or has expired.'))
      .finally(() => setLoadingPreview(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError('');

    if (password !== confirmPassword) {
      setFieldError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setFieldError('Password must be at least 8 characters.');
      return;
    }
    if (!email) {
      setFieldError('Please enter your email address.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await invitationsApi.registerAndJoin({
        invitation_code: token!,
        name,
        email,
        password,
        relationship_override: relationship || undefined,
      });

      setAuthToken(result.access_token);
      setCurrentUser(result.user);
      setSpaceName(result.space_name);
      setJoined(true);
    } catch (err: any) {
      setFieldError(err.response?.data?.detail || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loadingPreview) {
    return (
      <div className="min-h-screen bg-echon-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-echon-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Invalid link ──────────────────────────────────────────────────────────
  if (previewError || !preview) {
    return (
      <div className="min-h-screen bg-echon-black flex items-center justify-center p-6">
        <div className="echon-card max-w-sm w-full text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-xl font-serif text-echon-cream mb-2">Invalid Invitation</h1>
          <p className="text-echon-cream-dark text-sm mb-6">
            {previewError || 'This invitation link is no longer valid.'}
          </p>
          <button onClick={() => navigate('/')} className="echon-btn w-full">
            Go to Echon
          </button>
        </div>
      </div>
    );
  }

  // ── Already used ──────────────────────────────────────────────────────────
  if (preview.already_used) {
    return (
      <div className="min-h-screen bg-echon-black flex items-center justify-center p-6">
        <div className="echon-card max-w-sm w-full text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-xl font-serif text-echon-cream mb-2">Already Used</h1>
          <p className="text-echon-cream-dark text-sm mb-6">
            This invitation has already been accepted. If you have an account, sign in below.
          </p>
          <button onClick={() => navigate('/login')} className="echon-btn w-full">
            Sign In
          </button>
        </div>
      </div>
    );
  }

  // ── Expired ───────────────────────────────────────────────────────────────
  if (!preview.valid) {
    return (
      <div className="min-h-screen bg-echon-black flex items-center justify-center p-6">
        <div className="echon-card max-w-sm w-full text-center">
          <div className="text-5xl mb-4">⏳</div>
          <h1 className="text-xl font-serif text-echon-cream mb-2">Invitation Expired</h1>
          <p className="text-echon-cream-dark text-sm mb-6">
            Ask the space admin to send you a new invitation.
          </p>
          <button onClick={() => navigate('/')} className="echon-btn w-full">
            Go to Echon
          </button>
        </div>
      </div>
    );
  }

  // ── Success screen ────────────────────────────────────────────────────────
  if (joined) {
    return (
      <div className="min-h-screen bg-echon-black flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="echon-card max-w-sm w-full text-center"
        >
          <div className="text-6xl mb-4">🕯️</div>
          <h1 className="text-2xl font-serif text-echon-gold mb-2">You're In</h1>
          <p className="text-echon-cream mb-1">
            Welcome to <span className="font-semibold text-echon-cream">{spaceName}</span>.
          </p>
          <p className="text-echon-cream-dark text-sm mb-6">
            Your request is pending approval from the space admin. You'll be able to access the space once approved.
          </p>
          <button onClick={() => navigate('/login')} className="echon-btn w-full">
            Sign In to Echon
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Registration form ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-echon-black via-echon-root to-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🕯️</div>
          <h1 className="text-3xl font-serif text-echon-gold mb-1">You're Invited</h1>
          <p className="text-echon-cream text-lg">
            to <span className="font-semibold">{preview.space_name}</span>
          </p>
          {preview.personal_message && (
            <p className="text-echon-cream-dark text-sm mt-3 italic px-4">
              "{preview.personal_message}"
            </p>
          )}
        </div>

        {/* Form card */}
        <div className="echon-card">
          <h2 className="text-xl font-serif text-echon-cream mb-1">Create your account</h2>
          <p className="text-echon-cream-dark text-sm mb-6">
            Your name is pre-filled from the invitation — update it if needed.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-echon-cream text-sm mb-1">Your Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="echon-input"
                placeholder="Your full name"
                required
              />
            </div>

            {/* Relationship confirmation */}
            <div>
              <label className="block text-echon-cream text-sm mb-1">
                Your relationship to the inviter
              </label>
              {preview.relationship && relationship === preview.relationship ? (
                <div className="flex items-center gap-2">
                  <div className="echon-input flex-1 text-echon-gold">
                    {relationshipLabel(relationship)}
                  </div>
                  <button
                    type="button"
                    onClick={() => setRelationship('')}
                    className="text-xs text-echon-cream-dark underline shrink-0"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="echon-input"
                >
                  <option value="">— Confirm or select relationship —</option>
                  {Object.entries(groupedRelationshipTypes()).map(([category, types]) => (
                    <optgroup key={category} label={category}>
                      {types.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.emoji} {t.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              )}
              <p className="text-echon-cream-dark/60 text-xs mt-1">
                This is how you appear in the family tree.
              </p>
            </div>

            <div>
              <label className="block text-echon-cream text-sm mb-1">Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="echon-input"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-echon-cream text-sm mb-1">Password *</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="echon-input"
                placeholder="At least 8 characters"
                required
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="block text-echon-cream text-sm mb-1">Confirm Password *</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="echon-input"
                placeholder="Re-enter password"
                required
                autoComplete="new-password"
              />
            </div>

            <AnimatePresence>
              {fieldError && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-red-400 text-sm bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2"
                >
                  {fieldError}
                </motion.p>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={submitting}
              className="echon-btn w-full mt-2"
            >
              {submitting ? 'Joining...' : 'Join the Family Space'}
            </button>
          </form>

          <p className="text-echon-cream-dark text-xs text-center mt-4">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="text-echon-gold underline"
            >
              Sign in
            </button>
          </p>
        </div>

        {/* Small print */}
        <p className="text-echon-cream-dark/40 text-xs text-center mt-4">
          Invitation expires {new Date(preview.expires_at).toLocaleDateString()}
        </p>
      </motion.div>
    </div>
  );
}
