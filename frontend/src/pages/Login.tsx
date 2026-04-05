/**
 * Echon Login Page
 * Existing user sign in
 * 
 * PATH: echon/frontend/src/pages/Login.tsx
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authApi } from '../lib/api';
import { setAuthToken, setCurrentUser } from '../lib/auth';
import PasswordInput from '../components/PasswordInput';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    email_or_phone: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.login({
        email_or_phone: formData.email_or_phone,
        password: formData.password,
      });

      // Save token and user
      setAuthToken(response.access_token);
      setCurrentUser(response.user);

      // Go to space selector to choose/create/join space
      navigate('/select-space');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

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
              Welcome Back
            </h1>
            <p className="text-echon-cream-dark text-sm">
              Sign in to your family space
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
            <div>
              <label className="block text-echon-cream text-sm mb-2">
                Email or Phone
              </label>
              <input
                type="text"
                required
                value={formData.email_or_phone}
                onChange={(e) => setFormData({ ...formData, email_or_phone: e.target.value })}
                className="echon-input"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-echon-cream text-sm mb-2">
                Password
              </label>
              <PasswordInput
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="echon-btn w-full mt-6"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          {/* Register link */}
          <p className="text-center text-echon-cream-dark text-sm mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-echon-gold hover:text-echon-candle transition-colors">
              Create one
            </Link>
          </p>
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