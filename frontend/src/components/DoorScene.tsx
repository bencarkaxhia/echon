/**
 * Echon Door Scene
 * Interactive 4 doors around a central family emblem
 * Users click doors to enter different sections
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

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

  const handleDoorClick = (route: string) => {
    // Could add a door opening animation here before navigating
    navigate(route);
  };

  return (
    <div className="fixed inset-0 bg-echon-black overflow-hidden">
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
          <div className="relative w-32 h-32 md:w-48 md:h-48 rounded-full border-2 border-echon-gold flex items-center justify-center bg-echon-shadow">
            {emblemUrl ? (
              <img
                src={emblemUrl}
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
          </div>
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