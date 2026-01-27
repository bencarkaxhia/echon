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
import { getCurrentSpace } from '../lib/auth';
import { spaceApi } from '../lib/api';

export default function Space() {
  const navigate = useNavigate();
  const spaceId = getCurrentSpace();
  
  // Check if user has seen entrance before
  const hasSeenEntrance = localStorage.getItem(`echon_seen_entrance_${spaceId}`);
  
  const [showEntrance, setShowEntrance] = useState(!hasSeenEntrance);
  const [spaceData, setSpaceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSpaceData();
  }, [spaceId]);

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
    // Mark entrance as seen for this space
    if (spaceId) {
      localStorage.setItem(`echon_seen_entrance_${spaceId}`, 'true');
    }
    setShowEntrance(false);
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
        <DoorScene 
          familyName={spaceData.name} 
          emblemUrl={spaceData.emblem_url}
        />
      )}
    </div>
  );
}