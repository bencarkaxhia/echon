/**
 * Edit Relationship Modal
 * UI to edit existing family relationships
 * 
 * PATH: echon/frontend/src/components/EditRelationship.tsx
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { relationshipsApi, Relationship } from '../lib/api';
import { getCurrentSpace } from '../lib/auth';

interface EditRelationshipProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  relationship: Relationship | null;
  personAName: string;
  personBName: string;
}

const RELATIONSHIP_TYPES = [
  // Nuclear Family - Specific
  { value: 'father', label: 'Father', emoji: '👨' },
  { value: 'mother', label: 'Mother', emoji: '👩' },
  { value: 'son', label: 'Son', emoji: '👦' },
  { value: 'daughter', label: 'Daughter', emoji: '👧' },
  { value: 'brother', label: 'Brother', emoji: '👦' },
  { value: 'sister', label: 'Sister', emoji: '👧' },
  
  // Extended Family
  { value: 'grandfather', label: 'Grandfather', emoji: '👴' },
  { value: 'grandmother', label: 'Grandmother', emoji: '👵' },
  { value: 'grandson', label: 'Grandson', emoji: '👦' },
  { value: 'granddaughter', label: 'Granddaughter', emoji: '👧' },
  
  // Step Family & Spouse
  { value: 'step_father', label: 'Step Father', emoji: '👨' },
  { value: 'step_mother', label: 'Step Mother', emoji: '👩' },
  { value: 'step_brother', label: 'Step Brother', emoji: '👦' },
  { value: 'step_sister', label: 'Step Sister', emoji: '👧' },
  { value: 'husband', label: 'Husband', emoji: '🤵' },
  { value: 'wife', label: 'Wife', emoji: '👰' },
  
  // Generic
  { value: 'parent', label: 'Parent', emoji: '👤' },
  { value: 'child', label: 'Child', emoji: '👶' },
  { value: 'sibling', label: 'Sibling', emoji: '👥' },
  { value: 'spouse', label: 'Spouse', emoji: '💑' },
];

export default function EditRelationship({
  isOpen,
  onClose,
  onSuccess,
  relationship,
  personAName,
  personBName,
}: EditRelationshipProps) {
  const [newType, setNewType] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (relationship) {
      setNewType(relationship.relationship_type);
    }
  }, [relationship]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!relationship || !newType) {
      setError('Please select a relationship type');
      return;
    }

    try {
      setSubmitting(true);
      const spaceId = getCurrentSpace();
      if (!spaceId) return;

      // Delete old relationship
      await relationshipsApi.delete(relationship.id, spaceId);

      // Create new relationship with updated type
      await relationshipsApi.create({
        space_id: spaceId,
        person_a_id: relationship.person_a_id,
        person_b_id: relationship.person_b_id,
        relationship_type: newType,
        confidence_level: 'confirmed',
      });

      // Success!
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Failed to update relationship:', error);
      setError(error.response?.data?.detail || 'Failed to update relationship');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !relationship) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-echon-shadow rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-echon-gold">Edit Relationship</h2>
            <button
              onClick={onClose}
              className="text-echon-cream-dark hover:text-echon-cream text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current relationship */}
            <div className="bg-echon-wood/20 rounded-lg p-4 mb-4">
              <p className="text-echon-cream-dark text-sm mb-1">Current:</p>
              <p className="text-echon-cream">
                <span className="font-semibold">{personAName}</span>
                {' is '}
                <span className="font-semibold text-echon-gold">{relationship.relationship_type.replace(/_/g, ' ')}</span>
                {' of '}
                <span className="font-semibold">{personBName}</span>
              </p>
            </div>

            {/* New relationship type */}
            <div>
              <label className="block text-echon-cream text-sm font-semibold mb-2">
                Change To:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {RELATIONSHIP_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setNewType(type.value)}
                    className={`p-2 rounded-lg border-2 transition-all ${
                      newType === type.value
                        ? 'border-echon-gold bg-echon-gold/20 text-echon-gold'
                        : 'border-echon-wood hover:border-echon-gold text-echon-cream'
                    }`}
                  >
                    <div className="text-xl mb-1">{type.emoji}</div>
                    <div className="text-xs font-semibold">{type.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Preview */}
            {newType && newType !== relationship.relationship_type && (
              <div className="bg-echon-wood rounded-lg p-4 border border-echon-gold">
                <p className="text-echon-cream-dark text-sm mb-1">New:</p>
                <p className="text-echon-cream text-center">
                  <span className="font-semibold text-echon-gold">{personAName}</span>
                  {' is '}
                  <span className="font-semibold text-echon-candle">{newType.replace(/_/g, ' ')}</span>
                  {' of '}
                  <span className="font-semibold text-echon-gold">{personBName}</span>
                </p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-900/20 border border-red-500 rounded-lg p-3 text-red-300 text-sm">
                {error}
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-echon-wood hover:bg-echon-wood/80 text-echon-cream px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !newType || newType === relationship.relationship_type}
                className="flex-1 bg-echon-gold hover:bg-echon-candle text-echon-shadow px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Updating...' : 'Update'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}