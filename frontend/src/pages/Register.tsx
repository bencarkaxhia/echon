/**
 * Echon Registration Page
 * New user signup form
 * 
 * PATH: echon/frontend/src/pages/Register.tsx
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authApi } from '../lib/api';
import { setAuthToken, setCurrentUser } from '../lib/auth';

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await authApi.register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      // Save token and user
      setAuthToken(response.access_token);
      setCurrentUser(response.user);

      // Redirect to create family space
      navigate('/create-space');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
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
              Create Your Account
            </h1>
            <p className="text-echon-cream-dark text-sm">
              Start preserving your family's memories
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
                Your Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="echon-input"
                placeholder="Beni Çarkaxhia"
              />
            </div>

            <div>
              <label className="block text-echon-cream text-sm mb-2">
                Email *
              </label>
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
              <label className="block text-echon-cream text-sm mb-2">
                Password *
              </label>
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
              <label className="block text-echon-cream text-sm mb-2">
                Confirm Password *
              </label>
              <input
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="echon-input"
                placeholder="Re-enter password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="echon-btn w-full mt-6"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Login link */}
          <p className="text-center text-echon-cream-dark text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-echon-gold hover:text-echon-candle transition-colors">
              Sign in
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