/**
 * Change Password Component
 * Allow users to update their password
 * 
 * PATH: echon/frontend/src/components/ChangePassword.tsx
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { authApi } from '../lib/api';

interface ChangePasswordProps {
  onClose: () => void;
}

export default function ChangePassword({ onClose }: ChangePasswordProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await authApi.updatePassword(currentPassword, newPassword);
      alert('✅ Password updated successfully!');
      onClose();
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to update password');
    } finally {
      setLoading(false);
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
        className="echon-card max-w-md w-full"
      >
        <h2 className="text-2xl font-serif text-echon-cream mb-2">
          🔐 Change Password
        </h2>
        <p className="text-echon-cream-dark mb-6">
          Update your account password
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-echon-cream text-sm mb-2">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="echon-input"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-echon-cream text-sm mb-2">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="echon-input"
              placeholder="At least 6 characters"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-echon-cream text-sm mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="echon-input"
              required
              disabled={loading}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="echon-btn-secondary flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="echon-btn flex-1"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}