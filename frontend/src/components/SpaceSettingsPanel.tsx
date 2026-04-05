/**
 * SpaceSettingsPanel
 * Slide-in panel for founders to manage their family space.
 * Sections: Space identity · Members · Invitations · Pending approvals
 *
 * PATH: echon/frontend/src/components/SpaceSettingsPanel.tsx
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { spaceApi, familyApi, getMediaUrl, FamilySpace, MemberProfile } from '../lib/api';
import { getCurrentSpace, getCurrentUser } from '../lib/auth';
import InviteMember from './InviteMember';
import PendingApprovals from './PendingApprovals';

interface SpaceSettingsPanelProps {
  space: FamilySpace;
  onClose: () => void;
  onSpaceUpdated: (updated: FamilySpace) => void;
}

type Tab = 'identity' | 'members' | 'invite' | 'approvals';

export default function SpaceSettingsPanel({ space, onClose, onSpaceUpdated }: SpaceSettingsPanelProps) {
  const spaceId = getCurrentSpace()!;
  const currentUser = getCurrentUser();

  const [tab, setTab] = useState<Tab>('identity');
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);

  // Identity fields
  const [name, setName] = useState(space.name);
  const [secondaryName, setSecondaryName] = useState(space.secondary_name ?? '');
  const [originLocation, setOriginLocation] = useState(space.origin_location ?? '');
  const [originCities, setOriginCities] = useState(space.origin_cities ?? '');
  const [savingIdentity, setSavingIdentity] = useState(false);

  useEffect(() => {
    if (tab === 'members') loadMembers();
  }, [tab]);

  const loadMembers = async () => {
    setLoadingMembers(true);
    setMemberError(null);
    try {
      const data = await familyApi.getSpaceMembers(spaceId);
      setMembers(data.members);
    } catch {
      setMemberError('Could not load members — please try again.');
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleSaveIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingIdentity(true);
    try {
      const updated = await spaceApi.updateSpace(spaceId, {
        name: name.trim() || undefined,
        secondary_name: secondaryName.trim() || undefined,
        origin_location: originLocation.trim() || undefined,
        origin_cities: originCities.trim() || undefined,
      });
      onSpaceUpdated(updated);
      alert('Space settings saved');
    } catch {
      alert('Could not save — please try again');
    } finally {
      setSavingIdentity(false);
    }
  };

  const handleRemoveMember = async (member: MemberProfile) => {
    if (!confirm(`Remove ${member.name} from this space?`)) return;
    try {
      await spaceApi.removeMember(spaceId, member.id);
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
    } catch {
      alert('Could not remove member');
    }
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'identity', label: 'Space' },
    { id: 'members', label: 'Members' },
    { id: 'invite', label: 'Invite' },
    { id: 'approvals', label: 'Pending' },
  ];

  const isFounder = (m: MemberProfile) => m.role === 'founder';
  const isCurrentUser = (m: MemberProfile) => m.id === currentUser?.id;

  return (
    <div className="fixed inset-0 z-[70] flex justify-end">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative z-10 w-full max-w-md h-full bg-echon-shadow border-l border-echon-wood flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-echon-wood/50">
          <div>
            <p className="text-echon-gold text-[10px] tracking-widest uppercase">Space Settings</p>
            <h2 className="text-echon-cream font-serif text-lg">{space.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full border border-echon-wood hover:border-echon-gold text-echon-cream-dark hover:text-echon-cream transition-colors"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-echon-wood/50">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                tab === t.id
                  ? 'text-echon-gold border-b-2 border-echon-gold'
                  : 'text-echon-cream-dark hover:text-echon-cream'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-5">
          <AnimatePresence mode="wait">
            {tab === 'identity' && (
              <motion.form
                key="identity"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSaveIdentity}
                className="space-y-4"
              >
                <div>
                  <label className="text-echon-cream-dark text-xs block mb-1">Family name</label>
                  <input
                    className="echon-input w-full"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-echon-cream-dark text-xs block mb-1">
                    Secondary name <span className="opacity-50">(maternal line)</span>
                  </label>
                  <input
                    className="echon-input w-full"
                    value={secondaryName}
                    onChange={(e) => setSecondaryName(e.target.value)}
                    placeholder="e.g. Çulaj"
                  />
                </div>
                <div>
                  <label className="text-echon-cream-dark text-xs block mb-1">Origin country / region</label>
                  <input
                    className="echon-input w-full"
                    value={originLocation}
                    onChange={(e) => setOriginLocation(e.target.value)}
                    placeholder="e.g. Albania, Kosovo"
                  />
                </div>
                <div>
                  <label className="text-echon-cream-dark text-xs block mb-1">Origin cities</label>
                  <input
                    className="echon-input w-full"
                    value={originCities}
                    onChange={(e) => setOriginCities(e.target.value)}
                    placeholder="e.g. Shkodra, Gjakova"
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingIdentity}
                  className="echon-btn w-full mt-2"
                >
                  {savingIdentity ? 'Saving…' : 'Save changes'}
                </button>
              </motion.form>
            )}

            {tab === 'members' && (
              <motion.div
                key="members"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {loadingMembers ? (
                  <p className="text-echon-cream-dark text-sm text-center py-8">Loading…</p>
                ) : memberError ? (
                  <div className="text-center py-8">
                    <p className="text-red-400 text-sm mb-3">{memberError}</p>
                    <button onClick={loadMembers} className="echon-btn-secondary text-xs px-4 py-1.5">
                      Retry
                    </button>
                  </div>
                ) : members.length === 0 ? (
                  <p className="text-echon-cream-dark text-sm text-center py-8">No members found</p>
                ) : (
                  members.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-echon-wood/50 bg-echon-black/30"
                    >
                      <div className="w-9 h-9 rounded-full border border-echon-gold bg-echon-shadow flex items-center justify-center overflow-hidden flex-shrink-0">
                        {m.profile_photo_url ? (
                          <img src={getMediaUrl(m.profile_photo_url)} alt={m.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-echon-gold text-sm">{m.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-echon-cream text-sm truncate">{m.name}</p>
                        <p className="text-echon-cream-dark text-xs capitalize">{m.role}</p>
                      </div>
                      {!isFounder(m) && !isCurrentUser(m) && (
                        <button
                          onClick={() => handleRemoveMember(m)}
                          className="text-xs text-echon-cream-dark hover:text-red-400 transition-colors px-2 py-1 rounded border border-transparent hover:border-red-400/30"
                          title="Remove from space"
                        >
                          Remove
                        </button>
                      )}
                      {isFounder(m) && (
                        <span className="text-[10px] text-echon-gold px-2">Founder</span>
                      )}
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {tab === 'invite' && (
              <motion.div
                key="invite"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <InviteMember onClose={() => setTab('members')} />
              </motion.div>
            )}

            {tab === 'approvals' && (
              <motion.div
                key="approvals"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                <PendingApprovals onClose={() => setTab('members')} onApproved={() => setTab('members')} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
