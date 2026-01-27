/**
 * Echon Door Scene
 * Interactive 4 doors around a central family emblem
 * Users click doors to enter different sections
 */

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { logout, getCurrentUser, getCurrentSpace } from '../lib/auth';
import { spaceApi } from '../lib/api';

interface Door {
  id: string;
  title: string;
  emoji: string;
  description: string;
  route: string;
  position: string; // Tailwind position classes
}

const doors: Door[] = [
  {
    id: 'memories',
    title: 'Memories',
    emoji: '📸',
    description: 'Photos, documents, and moments preserved',
    route: '/space/memories',
    position: 'top-[15%] left-[10%] md:left-[15%]',
  },
  {
    id: 'stories',
    title: 'Stories',
    emoji: '🗣️',
    description: 'Voice recordings and oral histories',
    route: '/space/stories',
    position: 'top-[15%] right-[10%] md:right-[15%]',
  },
  {
    id: 'family',
    title: 'Family',
    emoji: '👥',
    description: 'People, connections, and lineages',
    route: '/space/family',
    position: 'bottom-[15%] left-[10%] md:left-[15%]',
  },
  {
    id: 'now',
    title: 'Now',
    emoji: '💬',
    description: 'Recent activity and conversations',
    route: '/space/now',
    position: 'bottom-[15%] right-[10%] md:right-[15%]',
  },
];

interface DoorSceneProps {
  familyName: string;
  emblemUrl?: string;
}

export default function DoorScene({ familyName, emblemUrl }: DoorSceneProps) {
  const navigate = useNavigate();
  const [hoveredDoor, setHoveredDoor] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [currentEmblem, setCurrentEmblem] = useState(emblemUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUser = getCurrentUser();

  const handleDoorClick = (route: string) => {
    // Could add a door opening animation here before navigating
    navigate(route);
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
      navigate('/');
    }
  };

  const handleEmblemUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    setUploading(true);
    try {
      const spaceId = getCurrentSpace();
      if (!spaceId) return;

      const formData = new FormData();
      formData.append('file', file);

      const response = await spaceApi.uploadEmblem(spaceId, formData);
      setCurrentEmblem(response.emblem_url);
      alert('✅ Family emblem updated!');
    } catch (error: any) {
      console.error('Failed to upload emblem:', error);
      alert(error.response?.data?.detail || 'Failed to upload emblem');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-echon-black overflow-hidden">
      {/* User Info - Top Left */}
      {currentUser && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1 }}
          className="absolute top-4 left-4 z-50 flex items-center gap-3 px-4 py-2 bg-echon-shadow/80 backdrop-blur-sm border border-echon-wood rounded-lg"
        >
          <div className="w-8 h-8 rounded-full bg-echon-shadow border border-echon-gold flex items-center justify-center overflow-hidden">
            {currentUser.profile_photo_url ? (
              <img
                src={`http://localhost:8000${currentUser.profile_photo_url}`}
                alt={currentUser.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-echon-gold text-sm">{currentUser.name.charAt(0)}</span>
            )}
          </div>
          <div>
            <p className="text-echon-cream text-sm font-semibold">{currentUser.name}</p>
            <p className="text-echon-cream-dark text-xs">Logged in</p>
          </div>
        </motion.div>
      )}

      {/* Logout Button - Top Right */}
      <motion.button
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        onClick={handleLogout}
        className="absolute top-4 right-4 z-50 px-4 py-2 bg-echon-shadow border border-echon-wood rounded-lg text-echon-cream hover:bg-echon-wood hover:border-echon-gold transition-colors"
      >
        🚪 Logout
      </motion.button>

      {/* Central Emblem / Family Symbol */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="relative"
        >
          {/* Glowing circle behind emblem */}
          <div className="absolute inset-0 bg-echon-root-light opacity-20 rounded-full blur-3xl animate-glow" />
          
          {/* Emblem */}
          <div 
            className="relative w-32 h-32 md:w-48 md:h-48 rounded-full border-2 border-echon-gold flex items-center justify-center bg-echon-shadow cursor-pointer hover:border-echon-candle transition-colors group"
            onClick={() => fileInputRef.current?.click()}
            title="Click to upload family emblem (founders only)"
          >
            {currentEmblem ? (
              <img
                src={`http://localhost:8000${currentEmblem}`}
                alt={`${familyName} emblem`}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className="text-center">
                <p className="text-echon-gold text-3xl md:text-5xl font-bold">
                  {familyName.charAt(0)}
                </p>
                <p className="text-echon-cream text-xs md:text-sm mt-2">
                  {familyName}
                </p>
              </div>
            )}
            
            {/* Upload hint overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
              <span className="text-white text-xs md:text-sm">
                {uploading ? 'Uploading...' : '📷 Upload Emblem'}
              </span>
            </div>
          </div>
          
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleEmblemUpload}
            className="hidden"
            disabled={uploading}
          />
        </motion.div>
      </div>

      {/* The 4 Doors */}
      {doors.map((door, index) => (
        <motion.div
          key={door.id}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 1 + index * 0.2 }}
          className={`absolute ${door.position}`}
        >
          <button
            onClick={() => handleDoorClick(door.route)}
            onMouseEnter={() => setHoveredDoor(door.id)}
            onMouseLeave={() => setHoveredDoor(null)}
            className="group relative"
          >
            {/* Door Frame */}
            <div
              className={`
                w-32 h-48 md:w-48 md:h-72 rounded-lg border-4 border-echon-wood 
                bg-gradient-to-b from-echon-wood to-echon-shadow
                transition-all duration-500 transform
                ${hoveredDoor === door.id ? 'scale-110 border-echon-candle shadow-2xl shadow-echon-candle/50' : 'scale-100'}
              `}
            >
              {/* Candle light on door */}
              <div className={`
                absolute top-4 left-1/2 transform -translate-x-1/2
                w-1 h-6 bg-echon-candle rounded-full candlelight
                transition-opacity duration-500
                ${hoveredDoor === door.id ? 'opacity-100 animate-flicker' : 'opacity-60'}
              `} />

              {/* Door Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                <span className="text-4xl md:text-6xl mb-4">{door.emoji}</span>
                <h3 className="text-echon-cream text-lg md:text-xl font-semibold mb-2">
                  {door.title}
                </h3>
                
                {/* Description (appears on hover) */}
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{
                    opacity: hoveredDoor === door.id ? 1 : 0,
                    height: hoveredDoor === door.id ? 'auto' : 0,
                  }}
                  transition={{ duration: 0.3 }}
                  className="text-echon-cream-dark text-xs md:text-sm text-center overflow-hidden"
                >
                  {door.description}
                </motion.p>
              </div>

              {/* Glow effect on hover */}
              {hoveredDoor === door.id && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-echon-candle opacity-10 rounded-lg"
                />
              )}
            </div>
          </button>
        </motion.div>
      ))}

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center"
      >
        <p className="text-echon-cream-dark text-sm">
          Choose a door to enter
        </p>
      </motion.div>
    </div>
  );
}