/**
 * Add Relationship Modal
 * UI to create family relationships
 * 
 * PATH: echon/frontend/src/components/AddRelationship.tsx
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { relationshipsApi, familyApi, MemberProfile } from '../lib/api';
import { getCurrentSpace } from '../lib/auth';

interface AddRelationshipProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedPersonA?: string;  // Optional: pre-select person A
}

const RELATIONSHIP_TYPES = [
  // Nuclear Family - Specific
  { value: 'father', label: 'Father', emoji: '👨', inverse: 'son_or_daughter', category: 'parent' },
  { value: 'mother', label: 'Mother', emoji: '👩', inverse: 'son_or_daughter', category: 'parent' },
  { value: 'son', label: 'Son', emoji: '👦', inverse: 'parent', category: 'child' },
  { value: 'daughter', label: 'Daughter', emoji: '👧', inverse: 'parent', category: 'child' },
  { value: 'brother', label: 'Brother', emoji: '👦', inverse: 'sibling', category: 'sibling' },
  { value: 'sister', label: 'Sister', emoji: '👧', inverse: 'sibling', category: 'sibling' },
  
  // Extended Family - Specific
  { value: 'grandfather', label: 'Grandfather', emoji: '👴', inverse: 'grandchild', category: 'grandparent' },
  { value: 'grandmother', label: 'Grandmother', emoji: '👵', inverse: 'grandchild', category: 'grandparent' },
  { value: 'grandson', label: 'Grandson', emoji: '👦', inverse: 'grandparent', category: 'grandchild' },
  { value: 'granddaughter', label: 'Granddaughter', emoji: '👧', inverse: 'grandparent', category: 'grandchild' },
  
  // Step Family
  { value: 'step_father', label: 'Step Father', emoji: '👨', inverse: 'step_child', category: 'step_parent' },
  { value: 'step_mother', label: 'Step Mother', emoji: '👩', inverse: 'step_child', category: 'step_parent' },
  { value: 'step_son', label: 'Step Son', emoji: '👦', inverse: 'step_parent', category: 'step_child' },
  { value: 'step_daughter', label: 'Step Daughter', emoji: '👧', inverse: 'step_parent', category: 'step_child' },
  { value: 'step_brother', label: 'Step Brother', emoji: '👦', inverse: 'step_sibling', category: 'step_sibling' },
  { value: 'step_sister', label: 'Step Sister', emoji: '👧', inverse: 'step_sibling', category: 'step_sibling' },
  
  // Generic (for flexible situations)
  { value: 'parent', label: 'Parent (Generic)', emoji: '👤', inverse: 'child', category: 'parent' },
  { value: 'child', label: 'Child (Generic)', emoji: '👶', inverse: 'parent', category: 'child' },
  { value: 'sibling', label: 'Sibling (Generic)', emoji: '👥', inverse: 'sibling', category: 'sibling' },
  
  // Spouse
  { value: 'husband', label: 'Husband', emoji: '🤵', inverse: 'wife', category: 'spouse' },
  { value: 'wife', label: 'Wife', emoji: '👰', inverse: 'husband', category: 'spouse' },
  { value: 'spouse', label: 'Spouse (Generic)', emoji: '💑', inverse: 'spouse', category: 'spouse' },
];

export default function AddRelationship({ 
  isOpen, 
  onClose, 
  onSuccess,
  preselectedPersonA 
}: AddRelationshipProps) {
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [personAId, setPersonAId] = useState(preselectedPersonA || '');
  const [personBId, setPersonBId] = useState('');
  const [relationshipType, setRelationshipType] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadMembers();
      setPersonAId(preselectedPersonA || '');
    }
  }, [isOpen, preselectedPersonA]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const spaceId = getCurrentSpace();
      if (!spaceId) return;

      const data = await familyApi.getSpaceMembers(spaceId);
      setMembers(data.members);
    } catch (error) {
      console.error('Failed to load members:', error);
      setError('Failed to load family members');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!personAId || !personBId || !relationshipType) {
      setError('Please fill all fields');
      return;
    }

    if (personAId === personBId) {
      setError('Cannot create relationship with the same person');
      return;
    }

    try {
      setSubmitting(true);
      const spaceId = getCurrentSpace();
      if (!spaceId) return;

      // Create the main relationship (A → B)
      await relationshipsApi.create({
        space_id: spaceId,
        person_a_id: personAId,
        person_b_id: personBId,
        relationship_type: relationshipType,
        confidence_level: 'confirmed',
      });

      // Create the inverse relationship (B → A)
      const selectedType = RELATIONSHIP_TYPES.find(t => t.value === relationshipType);
      if (selectedType?.inverse) {
        let inverseType = selectedType.inverse;
        
        // Handle special case: son_or_daughter needs to check actual relationship
        if (inverseType === 'son_or_daughter') {
          // If we know the gender from the type (son/daughter), use it
          // Otherwise use generic 'child'
          inverseType = 'child';
        }
        
        // Handle special case: parent needs to check actual relationship
        if (inverseType === 'parent' && (relationshipType === 'son' || relationshipType === 'daughter')) {
          // Keep as 'parent' - we don't know if it's mother or father
          inverseType = 'parent';
        }
        
        try {
          await relationshipsApi.create({
            space_id: spaceId,
            person_a_id: personBId,
            person_b_id: personAId,
            relationship_type: inverseType,
            confidence_level: 'confirmed',
          });
        } catch (err) {
          console.error('Failed to create inverse relationship:', err);
          // Don't fail the whole operation if inverse fails
        }
      }

      // Success!
      onSuccess();
      resetForm();
      onClose();
    } catch (error: any) {
      console.error('Failed to create relationship:', error);
      setError(error.response?.data?.detail || 'Failed to create relationship');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setPersonAId(preselectedPersonA || '');
    setPersonBId('');
    setRelationshipType('');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const getPersonAName = () => {
    const person = members.find(m => m.id === personAId);
    return person?.name || 'Person A';
  };

  const getPersonBName = () => {
    const person = members.find(m => m.id === personBId);
    return person?.name || 'Person B';
  };

  if (!isOpen) return null;

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
            <h2 className="text-2xl font-bold text-echon-gold">Add Relationship</h2>
            <button
              onClick={handleClose}
              className="text-echon-cream-dark hover:text-echon-cream text-2xl"
            >
              ×
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-echon-cream-dark">
              Loading family members...
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Person A */}
              <div>
                <label className="block text-echon-cream text-sm font-semibold mb-2">
                  First Person
                </label>
                <select
                  value={personAId}
                  onChange={(e) => setPersonAId(e.target.value)}
                  className="w-full bg-echon-wood border border-echon-gold rounded-lg px-4 py-2 text-echon-cream focus:outline-none focus:ring-2 focus:ring-echon-candle"
                  required
                >
                  <option value="">Select person...</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Relationship Type */}
              <div>
                <label className="block text-echon-cream text-sm font-semibold mb-2">
                  Relationship Type
                </label>
                
                {/* Nuclear Family */}
                <div className="mb-4">
                  <p className="text-echon-cream-dark text-xs mb-2">Nuclear Family</p>
                  <div className="grid grid-cols-3 gap-2">
                    {RELATIONSHIP_TYPES.filter(t => 
                      ['father', 'mother', 'son', 'daughter', 'brother', 'sister'].includes(t.value)
                    ).map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setRelationshipType(type.value)}
                        className={`p-2 rounded-lg border-2 transition-all ${
                          relationshipType === type.value
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

                {/* Extended Family */}
                <div className="mb-4">
                  <p className="text-echon-cream-dark text-xs mb-2">Extended Family</p>
                  <div className="grid grid-cols-3 gap-2">
                    {RELATIONSHIP_TYPES.filter(t => 
                      ['grandfather', 'grandmother', 'grandson', 'granddaughter'].includes(t.value)
                    ).map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setRelationshipType(type.value)}
                        className={`p-2 rounded-lg border-2 transition-all ${
                          relationshipType === type.value
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

                {/* Step Family & Spouse */}
                <div className="mb-4">
                  <p className="text-echon-cream-dark text-xs mb-2">Step Family & Spouse</p>
                  <div className="grid grid-cols-3 gap-2">
                    {RELATIONSHIP_TYPES.filter(t => 
                      ['step_father', 'step_mother', 'step_brother', 'step_sister', 'husband', 'wife'].includes(t.value)
                    ).map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setRelationshipType(type.value)}
                        className={`p-2 rounded-lg border-2 transition-all ${
                          relationshipType === type.value
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

                {/* Generic Options */}
                <div>
                  <p className="text-echon-cream-dark text-xs mb-2">Generic (Flexible)</p>
                  <div className="grid grid-cols-3 gap-2">
                    {RELATIONSHIP_TYPES.filter(t => 
                      ['parent', 'child', 'sibling', 'spouse'].includes(t.value)
                    ).map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setRelationshipType(type.value)}
                        className={`p-2 rounded-lg border-2 transition-all ${
                          relationshipType === type.value
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
              </div>

              {/* Person B */}
              <div>
                <label className="block text-echon-cream text-sm font-semibold mb-2">
                  Second Person
                </label>
                <select
                  value={personBId}
                  onChange={(e) => setPersonBId(e.target.value)}
                  className="w-full bg-echon-wood border border-echon-gold rounded-lg px-4 py-2 text-echon-cream focus:outline-none focus:ring-2 focus:ring-echon-candle"
                  required
                >
                  <option value="">Select person...</option>
                  {members
                    .filter((m) => m.id !== personAId)
                    .map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Preview */}
              {personAId && personBId && relationshipType && (
                <div className="bg-echon-wood rounded-lg p-4 border border-echon-gold">
                  <p className="text-echon-cream text-center">
                    <span className="font-semibold text-echon-gold">{getPersonAName()}</span>
                    {' is '}
                    <span className="font-semibold text-echon-candle">{relationshipType}</span>
                    {' of '}
                    <span className="font-semibold text-echon-gold">{getPersonBName()}</span>
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
                  onClick={handleClose}
                  className="flex-1 bg-echon-wood hover:bg-echon-wood/80 text-echon-cream px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !personAId || !personBId || !relationshipType}
                  className="flex-1 bg-echon-gold hover:bg-echon-candle text-echon-shadow px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Adding...' : 'Add Relationship'}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}