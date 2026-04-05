/**
 * ResetPassword page — /reset-password/:token
 * User sets a new password after clicking the reset link.
 *
 * PATH: echon/frontend/src/pages/ResetPassword.tsx
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { authApi } from '../lib/api';
import PasswordInput from '../components/PasswordInput';

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(token!, password);
      setDone(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid or expired link. Please request a new one.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-echon-black via-echon-root to-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔒</div>
          <h1 className="text-3xl font-serif text-echon-gold mb-1">New Password</h1>
          <p className="text-echon-cream-dark text-sm">Choose a strong password for your account.</p>
        </div>

        <div className="echon-card">
          {!done ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-echon-cream text-sm mb-1">New Password *</label>
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  required
                  autoFocus
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label className="block text-echon-cream text-sm mb-1">Confirm Password *</label>
                <PasswordInput
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  autoComplete="new-password"
                />
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-red-400 text-sm bg-red-900/20 border border-red-800/40 rounded-lg px-3 py-2"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              <button type="submit" disabled={loading} className="echon-btn w-full">
                {loading ? 'Saving…' : 'Set New Password'}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="text-5xl">✅</div>
              <p className="text-echon-cream font-serif text-xl">Password updated!</p>
              <p className="text-echon-cream-dark text-sm">
                You can now sign in with your new password.
              </p>
              <button onClick={() => navigate('/login')} className="echon-btn w-full">
                Sign In
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
