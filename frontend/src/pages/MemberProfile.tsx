/**
 * Member Profile Page
 * Detailed view of a family member
 * 
 * PATH: echon/frontend/src/pages/MemberProfile.tsx
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { familyApi, MemberProfile as MemberProfileType } from '../lib/api';
import { getCurrentSpace, getCurrentUser } from '../lib/auth';

export default function MemberProfile() {
  const { memberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();
  const [member, setMember] = useState<MemberProfileType | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const currentUser = getCurrentUser();

  const [formData, setFormData] = useState({
    name: '',
    birth_year: '',
    birth_location: '',
    generation: '',
    lineage: '',
    relationship_to_founder: '',
  });

  useEffect(() => {
    loadMember();
  }, [memberId]);

  const loadMember = async () => {
    try {
      const spaceId = getCurrentSpace();
      if (!spaceId || !memberId) {
        navigate('/space/family');
        return;
      }

      const data = await familyApi.getMemberProfile(memberId, spaceId);
      setMember(data);
      
      // Initialize form
      setFormData({
        name: data.name,
        birth_year: data.birth_year?.toString() || '',
        birth_location: data.birth_location || '',
        generation: data.generation || '',
        lineage: data.lineage || '',
        relationship_to_founder: data.relationship_to_founder || '',
      });
    } catch (error) {
      console.error('Failed to load member:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const spaceId = getCurrentSpace();
      if (!spaceId || !memberId) return;

      await familyApi.updateMemberProfile(memberId, spaceId, {
        name: formData.name,
        birth_year: formData.birth_year ? parseInt(formData.birth_year) : undefined,
        birth_location: formData.birth_location || undefined,
        generation: formData.generation || undefined,
        lineage: formData.lineage || undefined,
        relationship_to_founder: formData.relationship_to_founder || undefined,
      });

      setEditing(false);
      loadMember(); // Reload to show updated data
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      alert(error.response?.data?.detail || 'Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-echon-black flex items-center justify-center">
        <div className="text-echon-cream text-xl">Loading profile...</div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-echon-black flex items-center justify-center">
        <div className="text-echon-cream">Member not found</div>
      </div>
    );
  }

  const canEdit = currentUser?.id === member.id || member.role === 'founder';

  return (
    <div className="min-h-screen bg-echon-black">
      {/* Header */}
      <div className="bg-echon-shadow border-b border-echon-wood">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate('/space/family')}
            className="text-echon-cream-dark hover:text-echon-cream transition-colors"
          >
            ← Back to Family
          </button>
          {canEdit && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="echon-btn-secondary"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="echon-card"
        >
          {/* Profile Photo */}
          <div className="flex justify-center mb-6">
            <div className="w-32 h-32 rounded-full bg-echon-shadow border-4 border-echon-gold flex items-center justify-center overflow-hidden">
              {member.profile_photo_url ? (
                <img
                  src={member.profile_photo_url}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-6xl text-echon-cream">
                  {member.name.charAt(0)}
                </span>
              )}
            </div>
          </div>

          {editing ? (
            /* Edit Form */
            <div className="space-y-4">
              <div>
                <label className="block text-echon-cream text-sm mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="echon-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-echon-cream text-sm mb-2">Birth Year</label>
                  <input
                    type="number"
                    value={formData.birth_year}
                    onChange={(e) => setFormData({ ...formData, birth_year: e.target.value })}
                    className="echon-input"
                    placeholder="1985"
                  />
                </div>

                <div>
                  <label className="block text-echon-cream text-sm mb-2">Generation</label>
                  <select
                    value={formData.generation}
                    onChange={(e) => setFormData({ ...formData, generation: e.target.value })}
                    className="echon-input"
                  >
                    <option value="">Select...</option>
                    <option value="elder">Elder</option>
                    <option value="middle">Middle</option>
                    <option value="younger">Younger</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-echon-cream text-sm mb-2">Birth Location</label>
                <input
                  type="text"
                  value={formData.birth_location}
                  onChange={(e) => setFormData({ ...formData, birth_location: e.target.value })}
                  className="echon-input"
                  placeholder="Shkodra, Albania"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-echon-cream text-sm mb-2">Lineage</label>
                  <select
                    value={formData.lineage}
                    onChange={(e) => setFormData({ ...formData, lineage: e.target.value })}
                    className="echon-input"
                  >
                    <option value="">Select...</option>
                    <option value="paternal">Paternal</option>
                    <option value="maternal">Maternal</option>
                    <option value="both">Both</option>
                  </select>
                </div>

                <div>
                  <label className="block text-echon-cream text-sm mb-2">Relationship</label>
                  <input
                    type="text"
                    value={formData.relationship_to_founder}
                    onChange={(e) => setFormData({ ...formData, relationship_to_founder: e.target.value })}
                    className="echon-input"
                    placeholder="Father, Mother, Son..."
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => setEditing(false)}
                  className="echon-btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="echon-btn flex-1"
                >
                  Save Changes
                </button>
              </div>
            </div>
          ) : (
            /* View Mode */
            <div className="space-y-6">
              {/* Name & Role */}
              <div className="text-center">
                <h1 className="text-3xl font-serif text-echon-cream mb-2">
                  {member.name}
                </h1>
                <span className={`inline-block text-sm px-4 py-1 rounded-full ${
                  member.role === 'founder' ? 'bg-echon-candle text-echon-black' :
                  member.role === 'elder' ? 'bg-echon-gold text-echon-black' :
                  'bg-echon-wood text-echon-cream'
                }`}>
                  {member.role}
                </span>
              </div>

              {/* Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {member.birth_year && (
                  <div className="echon-card bg-echon-shadow">
                    <p className="text-echon-cream-dark text-sm mb-1">Birth Year</p>
                    <p className="text-echon-cream text-lg">{member.birth_year}</p>
                  </div>
                )}

                {member.birth_location && (
                  <div className="echon-card bg-echon-shadow">
                    <p className="text-echon-cream-dark text-sm mb-1">Birth Location</p>
                    <p className="text-echon-cream text-lg">{member.birth_location}</p>
                  </div>
                )}

                {member.generation && (
                  <div className="echon-card bg-echon-shadow">
                    <p className="text-echon-cream-dark text-sm mb-1">Generation</p>
                    <p className="text-echon-cream text-lg capitalize">{member.generation}</p>
                  </div>
                )}

                {member.lineage && (
                  <div className="echon-card bg-echon-shadow">
                    <p className="text-echon-cream-dark text-sm mb-1">Lineage</p>
                    <p className="text-echon-cream text-lg capitalize">{member.lineage}</p>
                  </div>
                )}

                {member.relationship_to_founder && (
                  <div className="echon-card bg-echon-shadow md:col-span-2">
                    <p className="text-echon-cream-dark text-sm mb-1">Relationship to Founder</p>
                    <p className="text-echon-cream text-lg">{member.relationship_to_founder}</p>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-echon-wood">
                <div className="text-center">
                  <p className="text-3xl font-bold text-echon-gold">{member.post_count}</p>
                  <p className="text-echon-cream-dark">Memories Shared</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-echon-gold">{member.comment_count}</p>
                  <p className="text-echon-cream-dark">Comments</p>
                </div>
              </div>

              {/* Joined Date */}
              <div className="text-center text-echon-cream-dark text-sm pt-4 border-t border-echon-wood">
                Joined {new Date(member.joined_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}