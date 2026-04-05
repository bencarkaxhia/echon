/**
 * ProfileCompletionModal
 * Shown once after registration (or when profile is missing key fields).
 * Lets the user add a photo, birth year, and birth location.
 *
 * PATH: echon/frontend/src/components/ProfileCompletionModal.tsx
 */

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { authApi, getMediaUrl } from '../lib/api';
import { getCurrentUser, setCurrentUser } from '../lib/auth';

interface ProfileCompletionModalProps {
  onDone: () => void;
}

export default function ProfileCompletionModal({ onDone }: ProfileCompletionModalProps) {
  const user = getCurrentUser();
  const [step, setStep] = useState<'photo' | 'details'>('photo');
  const [photoUrl, setPhotoUrl] = useState(user?.profile_photo_url ?? '');
  const [birthYear, setBirthYear] = useState(user?.birth_year?.toString() ?? '');
  const [birthLocation, setBirthLocation] = useState(user?.birth_location ?? '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await authApi.uploadProfilePhoto(formData);
      setPhotoUrl(result.profile_photo_url);
      if (user) {
        const updated = { ...user, profile_photo_url: result.profile_photo_url };
        setCurrentUser(updated);
      }
    } catch {
      alert('Photo upload failed — please try again');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveDetails = async () => {
    setSaving(true);
    try {
      const payload: { birth_year?: number; birth_location?: string } = {};
      const yr = parseInt(birthYear, 10);
      if (!isNaN(yr) && yr > 1900 && yr <= new Date().getFullYear()) {
        payload.birth_year = yr;
      }
      if (birthLocation.trim()) {
        payload.birth_location = birthLocation.trim();
      }
      if (Object.keys(payload).length > 0) {
        const updated = await authApi.updateProfile(payload);
        if (user) setCurrentUser({ ...user, ...updated });
      }
      onDone();
    } catch {
      alert('Could not save — please try again');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, type: 'spring', stiffness: 200, damping: 22 }}
        className="bg-echon-shadow border border-echon-wood rounded-2xl max-w-sm w-full overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-echon-wood/50 text-center">
          <p className="text-echon-gold text-xs tracking-widest uppercase mb-1">Welcome</p>
          <h2 className="text-echon-cream font-serif text-xl">
            Tell your family who you are
          </h2>
          <p className="text-echon-cream-dark text-xs mt-1">
            This takes 30 seconds and makes you real to everyone in the space.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex justify-center gap-2 py-3">
          {(['photo', 'details'] as const).map((s) => (
            <div
              key={s}
              className="h-1 rounded-full transition-all duration-500"
              style={{
                width: step === s ? '32px' : '8px',
                background: step === s ? '#D4A574' : '#3E2723',
              }}
            />
          ))}
        </div>

        {/* Steps */}
        <div className="px-6 pb-6">
          <AnimatePresence mode="wait">
            {step === 'photo' ? (
              <motion.div
                key="photo"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col items-center gap-5"
              >
                {/* Avatar preview */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="relative w-28 h-28 rounded-full border-2 border-echon-gold bg-echon-black flex items-center justify-center overflow-hidden group focus:outline-none"
                >
                  {photoUrl ? (
                    <img
                      src={getMediaUrl(photoUrl)}
                      alt="Your photo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-echon-gold text-4xl font-semibold">
                      {user?.name.charAt(0) ?? '?'}
                    </span>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs">
                      {uploading ? 'Uploading…' : '📷 Add photo'}
                    </span>
                  </div>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <p className="text-echon-cream-dark text-sm text-center">
                  A photo helps your family recognise you in memories and chat.
                </p>

                <div className="flex gap-3 w-full">
                  <button
                    type="button"
                    onClick={onDone}
                    className="flex-1 py-2 text-echon-cream-dark text-sm border border-echon-wood rounded-lg hover:border-echon-gold/50 transition-colors"
                  >
                    Skip for now
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('details')}
                    className="flex-1 echon-btn py-2 text-sm"
                  >
                    Next →
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-4"
              >
                <div>
                  <label className="text-echon-cream-dark text-xs block mb-1">
                    Year of birth
                  </label>
                  <input
                    type="number"
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value)}
                    placeholder="e.g. 1982"
                    min="1900"
                    max={new Date().getFullYear()}
                    className="echon-input w-full"
                  />
                </div>
                <div>
                  <label className="text-echon-cream-dark text-xs block mb-1">
                    Where were you born?
                  </label>
                  <input
                    type="text"
                    value={birthLocation}
                    onChange={(e) => setBirthLocation(e.target.value)}
                    placeholder="e.g. Prishtina, Kosovo"
                    className="echon-input w-full"
                  />
                </div>
                <p className="text-echon-cream-dark text-xs">
                  These help place you in the family tree across generations.
                </p>

                <div className="flex gap-3 mt-1">
                  <button
                    type="button"
                    onClick={() => setStep('photo')}
                    className="flex-1 py-2 text-echon-cream-dark text-sm border border-echon-wood rounded-lg hover:border-echon-gold/50 transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDetails}
                    disabled={saving}
                    className="flex-1 echon-btn py-2 text-sm"
                  >
                    {saving ? 'Saving…' : 'Done'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
