/**
 * Echon Registration Page
 * New user signup form
 * 
 * PATH: echon/frontend/src/pages/Register.tsx
 */

import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authApi, invitationsApi } from '../lib/api';
import { setAuthToken, setCurrentUser, setCurrentSpace } from '../lib/auth';

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isJoinFlow = searchParams.get('join') === '1';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingMessage, setPendingMessage] = useState('');

  const [formData, setFormData] = useState({
    invitationCode: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPendingMessage('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (isJoinFlow && !formData.invitationCode.trim()) {
      setError('Please enter your invitation code');
      return;
    }

    setLoading(true);

    try {
      if (isJoinFlow) {
        const response = await invitationsApi.registerAndJoin({
          invitation_code: formData.invitationCode.trim(),
          name: formData.name,
          email: formData.email || undefined,
          password: formData.password,
        });

        setAuthToken(response.access_token);
        setCurrentUser(response.user);
        setCurrentSpace(response.space_id);

        if (response.status === 'pending_approval') {
          setPendingMessage(response.message || 'Your request is pending approval from the space founder.');
        } else {
          navigate('/space');
        }
      } else {
        const response = await authApi.register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });

        setAuthToken(response.access_token);
        setCurrentUser(response.user);
        navigate('/select-space');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (pendingMessage) {
    return (
      <div className="min-h-screen bg-echon-black flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <div className="echon-card space-y-6">
            <div className="text-6xl">🕯️</div>
            <h2 className="text-2xl font-serif text-echon-cream">You're almost in</h2>
            <p className="text-echon-cream-dark">{pendingMessage}</p>
            <p className="text-echon-cream-dark text-sm">
              You'll receive a notification once a family founder approves your membership.
            </p>
            <button onClick={() => navigate('/')} className="echon-btn-secondary w-full">
              Back to home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-echon-black flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="echon-card">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-serif text-echon-cream mb-2">
              {isJoinFlow ? 'Join Your Family' : 'Create Your Account'}
            </h1>
            <p className="text-echon-cream-dark text-sm">
              {isJoinFlow
                ? 'Enter the invitation code you received'
                : "Start preserving your family's memories"}
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Invitation code — join flow only */}
            {isJoinFlow && (
              <div>
                <label className="block text-echon-cream text-sm mb-2">
                  Invitation Code *
                </label>
                <input
                  type="text"
                  required
                  value={formData.invitationCode}
                  onChange={(e) => setFormData({ ...formData, invitationCode: e.target.value })}
                  className="echon-input font-mono tracking-wider"
                  placeholder="inv_2026_xxxxxxxxxx"
                  autoFocus
                />
              </div>
            )}

            <div>
              <label className="block text-echon-cream text-sm mb-2">Your Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="echon-input"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="block text-echon-cream text-sm mb-2">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="echon-input"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-echon-cream text-sm mb-2">Password *</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="echon-input"
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label className="block text-echon-cream text-sm mb-2">Confirm Password *</label>
              <input
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="echon-input"
                placeholder="Re-enter password"
              />
            </div>

            <button type="submit" disabled={loading} className="echon-btn w-full mt-6">
              {loading
                ? isJoinFlow ? 'Joining…' : 'Creating Account…'
                : isJoinFlow ? 'Join Family' : 'Create Account'}
            </button>
          </form>

          {/* Login link */}
          <p className="text-center text-echon-cream-dark text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-echon-gold hover:text-echon-candle transition-colors">
              Sign in
            </Link>
          </p>

          {/* Toggle flows */}
          {isJoinFlow ? (
            <p className="text-center text-echon-cream-dark text-xs mt-3">
              Starting a new family space?{' '}
              <Link to="/register" className="text-echon-gold/70 hover:text-echon-gold transition-colors">
                Create one
              </Link>
            </p>
          ) : (
            <p className="text-center text-echon-cream-dark text-xs mt-3">
              Have an invitation code?{' '}
              <Link to="/register?join=1" className="text-echon-gold/70 hover:text-echon-gold transition-colors">
                Join a family
              </Link>
            </p>
          )}
        </div>

        {/* Back to home */}
        <Link
          to="/"
          className="block text-center text-echon-cream-dark text-sm mt-4 hover:text-echon-cream transition-colors"
        >
          ← Back to home
        </Link>
      </motion.div>
    </div>
  );
}