/**
 * Member Card Component
 * Display family member in grid
 * 
 * PATH: echon/frontend/src/components/MemberCard.tsx
 */

import { motion } from 'framer-motion';
import { MemberProfile } from '../lib/api';
import { useNavigate } from 'react-router-dom';

interface MemberCardProps {
  member: MemberProfile;
}

export default function MemberCard({ member }: MemberCardProps) {
  const navigate = useNavigate();

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'founder':
        return 'bg-echon-candle text-echon-black';
      case 'elder':
        return 'bg-echon-gold text-echon-black';
      default:
        return 'bg-echon-wood text-echon-cream';
    }
  };

  const getGenerationIcon = (generation?: string) => {
    switch (generation) {
      case 'elder':
        return '👴';
      case 'younger':
        return '👶';
      default:
        return '👤';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      className="echon-card cursor-pointer"
      onClick={() => navigate(`/space/family/${member.id}`)}
    >
      {/* Profile Photo */}
      <div className="flex justify-center mb-4">
        <div className="w-24 h-24 rounded-full bg-echon-shadow border-2 border-echon-gold flex items-center justify-center overflow-hidden">
          {member.profile_photo_url ? (
            <img
              src={`http://localhost:8000${member.profile_photo_url}`}
              alt={member.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-4xl text-echon-cream">
              {member.name.charAt(0)}
            </span>
          )}
        </div>
      </div>

      {/* Name */}
      <h3 className="text-xl font-serif text-echon-cream text-center mb-2">
        {member.name}
      </h3>

      {/* Role Badge */}
      <div className="flex justify-center mb-3">
        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getRoleBadgeColor(member.role)}`}>
          {member.role}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-2 text-sm text-echon-cream-dark text-center">
        {member.birth_year && (
          <p className="flex items-center justify-center gap-2">
            <span>{getGenerationIcon(member.generation)}</span>
            <span>Born {member.birth_year}</span>
          </p>
        )}
        
        {member.birth_location && (
          <p className="flex items-center justify-center gap-2">
            <span>📍</span>
            <span className="truncate">{member.birth_location}</span>
          </p>
        )}

        {member.relationship_to_founder && (
          <p className="flex items-center justify-center gap-2">
            <span>👨‍👩‍👧‍👦</span>
            <span>{member.relationship_to_founder}</span>
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="mt-4 pt-4 border-t border-echon-wood flex justify-around text-center">
        <div>
          <p className="text-echon-gold font-semibold">{member.post_count}</p>
          <p className="text-xs text-echon-cream-dark">Memories</p>
        </div>
        <div>
          <p className="text-echon-gold font-semibold">{member.comment_count}</p>
          <p className="text-xs text-echon-cream-dark">Comments</p>
        </div>
      </div>
    </motion.div>
  );
}