/**
 * ForgotPassword page — /forgot-password
 *
 * PATH: echon/frontend/src/pages/ForgotPassword.tsx
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { authApi } from '../lib/api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setDone(true);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.');
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
          <div className="text-5xl mb-3">🔑</div>
          <h1 className="text-3xl font-serif text-echon-gold mb-1">Forgot Password</h1>
          <p className="text-echon-cream-dark text-sm">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <div className="echon-card">
          {!done ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-echon-cream text-sm mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="echon-input"
                  placeholder="you@example.com"
                  required
                  autoFocus
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
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>

              <p className="text-center text-echon-cream-dark text-sm">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-echon-gold underline"
                >
                  Back to Sign In
                </button>
              </p>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="text-5xl">📬</div>
              <p className="text-echon-cream font-serif text-lg">Check your inbox</p>
              <p className="text-echon-cream-dark text-sm">
                If <span className="text-echon-cream">{email}</span> is registered,
                a reset link has been sent. The link expires in 1 hour.
              </p>
              <p className="text-echon-cream-dark/60 text-xs">
                Don't see it? Check your spam folder.
              </p>
              <button onClick={() => navigate('/login')} className="echon-btn w-full">
                Back to Sign In
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
