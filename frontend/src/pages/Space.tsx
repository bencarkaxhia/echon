/**
 * Echon Space Page
 * Shows entrance sequence, then doors
 * 
 * PATH: echon/frontend/src/pages/Space.tsx
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EntranceSequence from '../components/EntranceSequence';
import DoorScene from '../components/DoorScene';
import ProfileCompletionModal from '../components/ProfileCompletionModal';
import { getCurrentSpace, getCurrentUser } from '../lib/auth';
import { spaceApi } from '../lib/api';

export default function Space() {
  const navigate = useNavigate();
  const spaceId = getCurrentSpace();
  
  // Check if user has seen entrance before
  const hasSeenEntrance = localStorage.getItem(`echon_seen_entrance_${spaceId}`);
  
  const [showEntrance, setShowEntrance] = useState(!hasSeenEntrance);
  const [spaceData, setSpaceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Profile completion — show if key fields are missing and user hasn't dismissed
  const user = getCurrentUser();
  const profileDismissed = !!localStorage.getItem('echon_profile_done');
  const profileIncomplete = !!user && !profileDismissed &&
    !user.profile_photo_url && !user.birth_year && !user.birth_location;
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    loadSpaceData();
  }, [spaceId]);

  // If entrance already seen, still show modal when profile is incomplete
  useEffect(() => {
    if (!loading && !showEntrance && profileIncomplete) {
      const t = setTimeout(() => setShowProfileModal(true), 600);
      return () => clearTimeout(t);
    }
  }, [loading, showEntrance, profileIncomplete]);

  const loadSpaceData = async () => {
    try {
      if (!spaceId) {
        navigate('/select-space');
        return;
      }

      const data = await spaceApi.getSpace(spaceId);
      setSpaceData(data);
    } catch (error) {
      console.error('Failed to load space:', error);
      navigate('/select-space');
    } finally {
      setLoading(false);
    }
  };

  const handleEntranceComplete = () => {
    if (spaceId) {
      localStorage.setItem(`echon_seen_entrance_${spaceId}`, 'true');
    }
    setShowEntrance(false);
    // Trigger profile modal after entrance (slight delay so doors render first)
    if (profileIncomplete) {
      setTimeout(() => setShowProfileModal(true), 800);
    }
  };

  const handleProfileDone = () => {
    localStorage.setItem('echon_profile_done', 'true');
    setShowProfileModal(false);
  };

  if (loading || !spaceData) {
    return (
      <div className="min-h-screen bg-echon-black flex items-center justify-center">
        <div className="text-echon-cream text-xl">Loading your family space...</div>
      </div>
    );
  }

  return (
    <div>
      {showEntrance && <EntranceSequence onComplete={handleEntranceComplete} />}
      {!showEntrance && (
        <>
          <DoorScene
            familyName={spaceData.name}
            emblemUrl={spaceData.emblem_url}
            spaceData={spaceData}
            onSpaceUpdated={(updated) => setSpaceData(updated)}
          />
          {showProfileModal && (
            <ProfileCompletionModal onDone={handleProfileDone} />
          )}
        </>
      )}
    </div>
  );
}