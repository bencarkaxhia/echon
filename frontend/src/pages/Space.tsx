/**
 * Echon Space Page
 * Shows entrance sequence, then doors
 * 
 * PATH: echon/frontend/src/pages/Space.tsx
 */

import { useState } from 'react';
import EntranceSequence from '../components/EntranceSequence';
import DoorScene from '../components/DoorScene';

export default function Space() {
  const [showEntrance, setShowEntrance] = useState(true);

  // For now, use hard-coded family name
  // Later we'll fetch actual space data from API
  const familyName = "Çarkaxhia"; // TODO: Get from API

  const handleEntranceComplete = () => {
    setShowEntrance(false);
  };

  return (
    <div>
      {showEntrance && <EntranceSequence onComplete={handleEntranceComplete} />}
      {!showEntrance && <DoorScene familyName={familyName} />}
    </div>
  );
}