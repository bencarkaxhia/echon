/**
 * Echon Door Scene
 * Interactive 4 doors around a central family emblem
 * Users click doors to enter different sections
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { logout, getCurrentUser } from '../lib/auth';
import RotatingSphere from './RotatingSphere';

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
    position: 'top-[25%] left-[20%] md:left-[15%]',
  },
  {
    id: 'stories',
    title: 'Stories',
    emoji: '🗣️',
    description: 'Voice recordings and oral histories',
    route: '/space/stories',
    position: 'top-[25%] right-[20%] md:right-[15%]',
  },
  {
    id: 'family',
    title: 'Family',
    emoji: '👥',
    description: 'People, connections, and lineages',
    route: '/space/family',
    position: 'bottom-[25%] left-[20%] md:left-[15%]',
  },
  {
    id: 'now',
    title: 'Now',
    emoji: '💬',
    description: 'Recent activity and conversations',
    route: '/space/now',
    position: 'bottom-[25%] right-[20%] md:right-[15%]',
  },
];

interface DoorSceneProps {
  familyName: string;
  emblemUrl?: string;
}

export default function DoorScene({ familyName, emblemUrl }: DoorSceneProps) {
  const navigate = useNavigate();
  const [hoveredDoor, setHoveredDoor] = useState<string | null>(null);
  const [currentEmblem, setCurrentEmblem] = useState(emblemUrl);
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
        className="absolute top-4 right-4 z-50 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm bg-echon-shadow border border-echon-wood rounded-lg text-echon-cream/90 hover:bg-echon-wood hover:border-echon-gold transition-colors"
      >
        Sign out
      </motion.button>

      {/* Central Emblem / Family Symbol - 3D Rotating Sphere */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <RotatingSphere
          familyName={familyName}
          emblemUrl={currentEmblem}
          onEmblemUpdate={(url: string) => setCurrentEmblem(url)}
        />
      </div>

{/* The 4 Doors - Ancient & Beautiful */}
      {doors.map((door, index) => (
        <motion.div
          key={door.id}
          initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ 
            duration: 1.2, 
            delay: 1 + index * 0.2,
            type: "spring",
            stiffness: 100
          }}
          className={`absolute ${door.position}`}
          style={{ perspective: '1000px' }}
        >
          <button
            onClick={() => handleDoorClick(door.route)}
            onMouseEnter={() => setHoveredDoor(door.id)}
            onMouseLeave={() => setHoveredDoor(null)}
            className="group relative"
          >
            {/* Glow behind door */}
            <motion.div
              animate={{
                opacity: hoveredDoor === door.id ? 0.4 : 0,
                scale: hoveredDoor === door.id ? 1.2 : 1
              }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 bg-echon-candle rounded-lg blur-2xl -z-10"
            />

            {/* Door Frame - Ancient Wood */}
            <motion.div
              animate={{
                scale: hoveredDoor === door.id ? 1.05 : 1,
                rotateY: hoveredDoor === door.id ? -15 : 0,
                // Mobile-friendly: Gentle breathing glow (alternating doors)
                boxShadow: hoveredDoor === door.id 
                  ? '0 20px 60px rgba(212, 175, 55, 0.6)' // Hover: strong glow
                  : (index % 2 === 0) // Alternating pattern
                    ? [
                        '0 10px 30px rgba(0, 0, 0, 0.5)', 
                        '0 10px 40px rgba(212, 175, 55, 0.3)', 
                        '0 10px 30px rgba(0, 0, 0, 0.5)'
                      ]
                    : '0 10px 30px rgba(0, 0, 0, 0.5)'
              }}
              transition={{ 
                scale: { duration: 0.6, type: "spring", stiffness: 200 },
                rotateY: { duration: 0.6, type: "spring", stiffness: 200 },
                boxShadow: { 
                  duration: 3, // 3 second breathing cycle
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: index * 0.8 // Stagger each door
                }
              }}
            >
              {/* Wood grain texture overlay */}
              <div className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage: `repeating-linear-gradient(
                    90deg,
                    transparent,
                    transparent 3px,
                    rgba(0,0,0,0.1) 3px,
                    rgba(0,0,0,0.1) 6px
                  )`
                }}
              />

              {/* Door border - carved wood */}
              <div className="absolute inset-0 border-8 border-amber-950/80 rounded-lg" />
              <div className="absolute inset-2 border-2 border-amber-700/40 rounded-md" />

              {/* Candle light holder */}
              <div className="absolute top-6 left-1/2 transform -translate-x-1/2 w-8 h-12 flex flex-col items-center">
                {/* Candle holder */}
                <div className="w-6 h-2 bg-gradient-to-b from-yellow-800 to-yellow-900 rounded-sm mb-1" />
                
                {/* Candle flame */}
                <motion.div
                  animate={{
                    scale: hoveredDoor === door.id ? [1, 1.2, 1] : [1, 1.1, 1],
                    opacity: hoveredDoor === door.id ? 1 : 0.7
                  }}
                  transition={{
                    duration: hoveredDoor === door.id ? 0.3 : 2,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                  className="relative w-3 h-6"
                >
                  {/* Flame core */}
                  <div className="absolute inset-0 bg-gradient-to-t from-yellow-500 via-orange-400 to-red-500 rounded-full blur-sm" />
                  {/* Flame glow */}
                  <div className="absolute inset-0 bg-gradient-to-t from-yellow-300 to-orange-300 rounded-full scale-150 blur-md opacity-50" />
                </motion.div>

                {/* Light rays */}
                {hoveredDoor === door.id && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.6, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute top-8 w-20 h-20 bg-gradient-radial from-yellow-300/30 to-transparent rounded-full blur-xl"
                  />
                )}
              </div>

              {/* Door Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-10">
                {/* Emoji Icon */}
                <motion.span 
                  animate={{
                    scale: hoveredDoor === door.id ? 1.2 : 1,
                    y: hoveredDoor === door.id ? -5 : 0
                  }}
                  transition={{ duration: 0.3 }}
                  className="text-4xl md:text-6xl mb-4 filter drop-shadow-lg"
                >
                  {door.emoji}
                </motion.span>

                {/* Door Title */}
                <h3 className="text-echon-cream text-lg md:text-xl font-semibold mb-2 text-center drop-shadow-lg font-serif">
                  {door.title}
                </h3>

                {/* Door Description */}
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{
                    opacity: hoveredDoor === door.id ? 1 : 0,
                    height: hoveredDoor === door.id ? 'auto' : 0,
                  }}
                  transition={{ duration: 0.3 }}
                  className="text-echon-cream-dark text-xs md:text-sm text-center px-2 drop-shadow overflow-hidden"
                >
                  {door.description}
                </motion.p>

                {/* Hover indicator */}
                {hoveredDoor === door.id && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 text-echon-candle text-xs font-semibold"
                  >
                    → Enter →
                  </motion.div>
                )}
              </div>

              {/* Magical particles on hover */}
              {hoveredDoor === door.id && (
                <>
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ 
                        x: Math.random() * 100 - 50,
                        y: Math.random() * 100 - 50,
                        opacity: 0 
                      }}
                      animate={{ 
                        y: [0, -50, -100],
                        opacity: [0, 1, 0],
                        scale: [0, 1, 0]
                      }}
                      transition={{ 
                        duration: 2,
                        delay: i * 0.2,
                        repeat: Infinity
                      }}
                      className="absolute w-1 h-1 bg-echon-candle rounded-full"
                      style={{
                        left: `${20 + i * 15}%`,
                        bottom: '20%'
                      }}
                    />
                  ))}
                </>
              )}
            </motion.div>
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