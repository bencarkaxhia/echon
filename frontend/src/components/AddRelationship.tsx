/**
 * Add Relationship Modal
 * Searchable relationship picker + person dropdowns
 *
 * PATH: echon/frontend/src/components/AddRelationship.tsx
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { relationshipsApi, familyApi, MemberProfile } from '../lib/api';
import { getCurrentSpace } from '../lib/auth';

interface AddRelationshipProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedPersonA?: string;
}

// ─── Relationship catalogue ───────────────────────────────────────────────────

const RELATIONSHIP_TYPES = [
  { value: 'father',       label: 'Father',          emoji: '👨',  inverse: 'child',     category: 'Nuclear' },
  { value: 'mother',       label: 'Mother',          emoji: '👩',  inverse: 'child',     category: 'Nuclear' },
  { value: 'son',          label: 'Son',             emoji: '👦',  inverse: 'parent',    category: 'Nuclear' },
  { value: 'daughter',     label: 'Daughter',        emoji: '👧',  inverse: 'parent',    category: 'Nuclear' },
  { value: 'brother',      label: 'Brother',         emoji: '🧑',  inverse: 'sibling',   category: 'Nuclear' },
  { value: 'sister',       label: 'Sister',          emoji: '👩',  inverse: 'sibling',   category: 'Nuclear' },
  { value: 'husband',      label: 'Husband',         emoji: '🤵',  inverse: 'wife',      category: 'Spouse'  },
  { value: 'wife',         label: 'Wife',            emoji: '👰',  inverse: 'husband',   category: 'Spouse'  },
  { value: 'grandfather',  label: 'Grandfather',     emoji: '👴',  inverse: 'grandchild',category: 'Extended'},
  { value: 'grandmother',  label: 'Grandmother',     emoji: '👵',  inverse: 'grandchild',category: 'Extended'},
  { value: 'grandson',     label: 'Grandson',        emoji: '👦',  inverse: 'grandparent',category:'Extended'},
  { value: 'granddaughter',label: 'Granddaughter',   emoji: '👧',  inverse: 'grandparent',category:'Extended'},
  { value: 'uncle',        label: 'Uncle',           emoji: '👨',  inverse: 'nephew',    category: 'Extended'},
  { value: 'aunt',         label: 'Aunt',            emoji: '👩',  inverse: 'niece',     category: 'Extended'},
  { value: 'nephew',       label: 'Nephew',          emoji: '👦',  inverse: 'uncle',     category: 'Extended'},
  { value: 'niece',        label: 'Niece',           emoji: '👧',  inverse: 'aunt',      category: 'Extended'},
  { value: 'cousin',       label: 'Cousin',          emoji: '🧑',  inverse: 'cousin',    category: 'Extended'},
  { value: 'step_father',  label: 'Step Father',     emoji: '👨',  inverse: 'step_son',  category: 'Step'    },
  { value: 'step_mother',  label: 'Step Mother',     emoji: '👩',  inverse: 'step_daughter',category:'Step'  },
  { value: 'step_son',     label: 'Step Son',        emoji: '👦',  inverse: 'step_father',category: 'Step'   },
  { value: 'step_daughter',label: 'Step Daughter',   emoji: '👧',  inverse: 'step_mother',category: 'Step'   },
  { value: 'step_brother', label: 'Step Brother',    emoji: '🧑',  inverse: 'step_sibling',category:'Step'   },
  { value: 'step_sister',  label: 'Step Sister',     emoji: '👩',  inverse: 'step_sibling',category:'Step'   },
  { value: 'half_sibling', label: 'Half Sibling',    emoji: '🧑',  inverse: 'half_sibling',category:'Step'  },
  { value: 'adopted_parent',label:'Adopted Parent',  emoji: '👤',  inverse: 'adopted_child',category:'Other'},
  { value: 'adopted_child',label: 'Adopted Child',   emoji: '👶',  inverse: 'adopted_parent',category:'Other'},
  { value: 'in_law',       label: 'In-Law',          emoji: '🤝',  inverse: 'in_law',    category: 'Other'   },
  { value: 'parent',       label: 'Parent (generic)',emoji: '👤',  inverse: 'child',     category: 'Generic' },
  { value: 'child',        label: 'Child (generic)', emoji: '👶',  inverse: 'parent',    category: 'Generic' },
  { value: 'sibling',      label: 'Sibling (generic)',emoji:'👥',  inverse: 'sibling',   category: 'Generic' },
  { value: 'spouse',       label: 'Spouse (generic)',emoji: '💑',  inverse: 'spouse',    category: 'Generic' },
  { value: 'grandparent',  label: 'Grandparent (gen)',emoji:'👴',  inverse: 'grandchild',category: 'Generic' },
  { value: 'grandchild',   label: 'Grandchild (gen)',emoji: '👶',  inverse: 'grandparent',category:'Generic' },
];

const QUICK_TYPES = ['father','mother','son','daughter','brother','sister','husband','wife'];

// ─── Relationship Combobox ────────────────────────────────────────────────────

function RelationshipCombobox({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [query, setQuery]   = useState('');
  const [open, setOpen]     = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const selected = RELATIONSHIP_TYPES.find(t => t.value === value);

  const filtered = query.trim()
    ? RELATIONSHIP_TYPES.filter(t =>
        t.label.toLowerCase().includes(query.toLowerCase()) ||
        t.value.includes(query.toLowerCase())
      )
    : RELATIONSHIP_TYPES;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (v: string) => {
    onChange(v);
    setQuery('');
    setOpen(false);
  };

  // Group visible items by category
  const grouped = filtered.reduce<Record<string, typeof RELATIONSHIP_TYPES>>((acc, t) => {
    (acc[t.category] ??= []).push(t);
    return acc;
  }, {});

  return (
    <div ref={wrapRef} className="relative">
      {/* Input */}
      <div
        className="w-full flex items-center gap-2 bg-echon-wood border border-echon-gold/50 rounded-lg px-3 py-2.5 cursor-text"
        onClick={() => setOpen(true)}
      >
        {selected && !open && (
          <span className="text-base">{selected.emoji}</span>
        )}
        <input
          type="text"
          value={open ? query : (selected ? selected.label : '')}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Type to search (e.g. dau…)"
          className="flex-1 bg-transparent text-echon-cream placeholder:text-echon-cream/30 outline-none text-sm"
        />
        <span className="text-echon-cream/40 text-xs select-none">▾</span>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.12 }}
            className="absolute z-50 top-full mt-1 w-full bg-echon-shadow border border-echon-wood rounded-xl shadow-2xl max-h-72 overflow-y-auto"
          >
            {filtered.length === 0 ? (
              <p className="text-echon-cream-dark text-sm text-center py-4">No match found</p>
            ) : (
              Object.entries(grouped).map(([cat, items]) => (
                <div key={cat}>
                  <p className="text-echon-cream/40 text-[10px] font-bold uppercase tracking-widest px-3 pt-2 pb-1">
                    {cat}
                  </p>
                  {items.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onMouseDown={() => select(t.value)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-echon-wood/60 transition-colors
                        ${value === t.value ? 'bg-echon-gold/20 text-echon-gold' : 'text-echon-cream'}`}
                    >
                      <span className="text-base w-6">{t.emoji}</span>
                      <span className="flex-1 text-left">{t.label}</span>
                      {value === t.value && <span className="text-echon-gold text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AddRelationship({
  isOpen,
  onClose,
  onSuccess,
  preselectedPersonA,
}: AddRelationshipProps) {
  const [members,          setMembers]          = useState<MemberProfile[]>([]);
  const [loading,          setLoading]          = useState(false);
  const [submitting,       setSubmitting]        = useState(false);
  const [personAId,        setPersonAId]         = useState(preselectedPersonA || '');
  const [personBId,        setPersonBId]         = useState('');
  const [relationshipType, setRelationshipType]  = useState('');
  const [error,            setError]             = useState('');

  useEffect(() => {
    if (isOpen) {
      loadMembers();
      setPersonAId(preselectedPersonA || '');
      setPersonBId('');
      setRelationshipType('');
      setError('');
    }
  }, [isOpen, preselectedPersonA]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const spaceId = getCurrentSpace();
      if (!spaceId) return;
      const data = await familyApi.getSpaceMembers(spaceId);
      setMembers(data.members);
    } catch {
      setError('Failed to load family members');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!personAId || !personBId || !relationshipType) {
      setError('Please fill all fields');
      return;
    }
    if (personAId === personBId) {
      setError('Cannot create a relationship with the same person');
      return;
    }

    try {
      setSubmitting(true);
      const spaceId = getCurrentSpace();
      if (!spaceId) return;

      // Forward relationship
      await relationshipsApi.create({
        space_id: spaceId,
        person_a_id: personAId,
        person_b_id: personBId,
        relationship_type: relationshipType,
        confidence_level: 'confirmed',
      });

      // Inverse relationship
      const selectedType = RELATIONSHIP_TYPES.find(t => t.value === relationshipType);
      if (selectedType?.inverse) {
        await relationshipsApi.create({
          space_id: spaceId,
          person_a_id: personBId,
          person_b_id: personAId,
          relationship_type: selectedType.inverse,
          confidence_level: 'confirmed',
        }).catch(() => {/* inverse failure is non-critical */});
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create relationship');
    } finally {
      setSubmitting(false);
    }
  };

  const nameOf = (id: string) => members.find(m => m.id === id)?.name ?? '…';
  const selected = RELATIONSHIP_TYPES.find(t => t.value === relationshipType);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.92 }}
          className="bg-echon-shadow rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-serif font-bold text-echon-gold">Add Relationship</h2>
            <button onClick={onClose} className="text-echon-cream-dark hover:text-echon-cream text-2xl leading-none">×</button>
          </div>

          {loading ? (
            <p className="text-center py-8 text-echon-cream-dark">Loading members…</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Person A */}
              <div>
                <label className="block text-echon-cream text-xs font-bold uppercase tracking-widest mb-2">
                  First Person
                </label>
                <select
                  value={personAId}
                  onChange={e => setPersonAId(e.target.value)}
                  className="w-full bg-echon-wood border border-echon-gold/50 rounded-lg px-3 py-2.5 text-echon-cream text-sm focus:outline-none focus:ring-2 focus:ring-echon-gold/40"
                  required
                >
                  <option value="">Select person…</option>
                  {members.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* Relationship — quick buttons + combobox */}
              <div>
                <label className="block text-echon-cream text-xs font-bold uppercase tracking-widest mb-2">
                  Relationship
                </label>

                {/* Quick-pick for the 8 most common */}
                <div className="grid grid-cols-4 gap-1.5 mb-3">
                  {QUICK_TYPES.map(v => {
                    const t = RELATIONSHIP_TYPES.find(x => x.value === v)!;
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setRelationshipType(v)}
                        className={`flex flex-col items-center py-2 rounded-lg border transition-all text-xs
                          ${relationshipType === v
                            ? 'border-echon-gold bg-echon-gold/20 text-echon-gold'
                            : 'border-echon-wood/50 hover:border-echon-gold/40 text-echon-cream'}`}
                      >
                        <span className="text-lg">{t.emoji}</span>
                        <span className="mt-0.5 font-semibold">{t.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Searchable combobox for all types */}
                <RelationshipCombobox
                  value={relationshipType}
                  onChange={setRelationshipType}
                />
              </div>

              {/* Person B */}
              <div>
                <label className="block text-echon-cream text-xs font-bold uppercase tracking-widest mb-2">
                  Second Person
                </label>
                <select
                  value={personBId}
                  onChange={e => setPersonBId(e.target.value)}
                  className="w-full bg-echon-wood border border-echon-gold/50 rounded-lg px-3 py-2.5 text-echon-cream text-sm focus:outline-none focus:ring-2 focus:ring-echon-gold/40"
                  required
                >
                  <option value="">Select person…</option>
                  {members.filter(m => m.id !== personAId).map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              {/* Preview */}
              {personAId && personBId && selected && (
                <div className="bg-echon-wood/50 border border-echon-gold/30 rounded-xl p-4 text-center">
                  <p className="text-echon-cream text-sm">
                    <span className="font-bold text-echon-gold">{nameOf(personAId)}</span>
                    {' is '}
                    <span className="font-bold text-echon-candle">{selected.emoji} {selected.label}</span>
                    {' of '}
                    <span className="font-bold text-echon-gold">{nameOf(personBId)}</span>
                  </p>
                  <p className="text-echon-cream/40 text-xs mt-1">
                    Inverse saved automatically: {selected.inverse?.replace(/_/g,' ')}
                  </p>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3 text-red-300 text-sm">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose}
                  className="flex-1 bg-echon-wood hover:bg-echon-wood/70 text-echon-cream px-4 py-3 rounded-xl font-semibold text-sm transition-colors">
                  Cancel
                </button>
                <button type="submit"
                  disabled={submitting || !personAId || !personBId || !relationshipType}
                  className="flex-1 bg-echon-gold hover:bg-echon-candle text-echon-shadow px-4 py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  {submitting ? 'Saving…' : 'Add Relationship'}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
