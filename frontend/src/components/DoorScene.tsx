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
import { getMediaUrl } from '../lib/api';
import NotificationBell from './NotificationBell';


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
    // pulled more towards center on mobile
    position: 'top-[22%] left-[15%] md:left-[15%]',
  },
  {
    id: 'stories',
    title: 'Stories',
    emoji: '🗣️',
    description: 'Voice recordings and oral histories',
    route: '/space/stories',
    position: 'top-[22%] right-[15%] md:right-[15%]',
  },
  {
    id: 'family',
    title: 'Family',
    emoji: '👥',
    description: 'People, connections, and lineages',
    route: '/space/family',
    position: 'bottom-[21%] left-[15%] md:left-[15%]',
  },
  {
    id: 'now',
    title: 'Now',
    emoji: '💬',
    description: 'Recent activity and conversations',
    route: '/space/now',
    position: 'bottom-[21%] right-[15%] md:right-[15%]',
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
    <div className="fixed inset-0 overflow-hidden bg-gradient-radial from-echon-black via-echon-black to-black">
      {/* Vignette / subtle atmosphere */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.15),transparent_55%),radial-gradient(circle_at_bottom,rgba(0,0,0,0.8),transparent_60%)]" />

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
                src={getMediaUrl(currentUser.profile_photo_url)}
                alt={currentUser.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-echon-gold text-sm">
                {currentUser.name.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <p className="text-echon-cream text-sm font-semibold">
              {currentUser.name}
            </p>
            <p className="text-echon-cream-dark text-xs">Logged in</p>
          </div>
        </motion.div>
      )}

      {/* Top Right - Notifications & Logout */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="absolute top-4 right-4 z-50 flex items-center gap-2"
      >
        <div className="bg-echon-shadow border border-echon-wood rounded-lg px-2 py-2">
          <NotificationBell />
        </div>
        <button onClick={handleLogout}
        className="px-4 py-2 bg-echon-shadow border border-echon-wood rounded-lg text-echon-cream hover:bg-echon-wood hover:border-echon-gold transition-colors"
        >
        Sign out
        </button>

        {/* Orignal butto with symbol commented out, instead just 'Sign out' text */}
        {/* <button
          onClick={handleLogout}
          className="px-4 py-2 bg-echon-shadow border border-echon-wood rounded-lg text-echon-cream hover:bg-echon-wood hover:border-echon-gold transition-colors"
        >
          🚪 Logout
        </button> */}

      </motion.div>

      {/* Central Emblem / Family Symbol - 3D Rotating Sphere */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <RotatingSphere
          familyName={familyName}
          emblemUrl={currentEmblem}
          onEmblemUpdate={(url: string) => setCurrentEmblem(url)}
        />
      </div>

      {/* The 4 Arched Wooden Doors - Cathedral Style */}
      {doors.map((door, index) => (
        <motion.div
          key={door.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.8, 
            delay: 1 + index * 0.15,
            type: "spring"
          }}
          className={`absolute ${door.position}`}
        >
          <button
            onClick={() => handleDoorClick(door.route)}
            onMouseEnter={() => setHoveredDoor(door.id)}
            onMouseLeave={() => setHoveredDoor(null)}
            className="group relative focus:outline-none"
          >
            {/* Glow from door */}
            <motion.div
              animate={{
                opacity: hoveredDoor === door.id ? 0.8 : 0.3,
                scale: hoveredDoor === door.id ? 1.5 : 1.2
              }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 bg-gradient-radial from-amber-500/40 to-transparent rounded-t-full blur-2xl -z-10"
              style={{ transform: 'translateY(50%)' }}
            />

            {/* Arched Door Frame */}
            <div className="relative w-28 h-36 md:w-28 md:h-36">
              {/* Door shape with arch */}
              <motion.div
                animate={{
                  scale: hoveredDoor === door.id ? 1.05 : 1,
                  boxShadow: hoveredDoor === door.id 
                    ? '0 10px 40px rgba(0, 0, 0, 0.8), inset 0 -10px 30px rgba(0, 0, 0, 0.7)'
                    : '0 5px 20px rgba(0, 0, 0, 0.6), inset 0 -5px 15px rgba(0, 0, 0, 0.5)'
                }}
                transition={{ duration: 0.3 }}
                className="relative w-full h-full overflow-hidden"
                style={{
                  borderRadius: '50% 50% 0 0',  // Arch at top!
                  background: 'linear-gradient(180deg, #92400e 0%, #78350f 40%, #451a03 100%)'
                }}
              >
                {/* Wood grain texture - vertical */}
                <div 
                  className="absolute inset-0 opacity-40"
                  style={{
                    backgroundImage: `repeating-linear-gradient(
                      0deg,
                      transparent,
                      transparent 3px,
                      rgba(0, 0, 0, 0.15) 3px,
                      rgba(0, 0, 0, 0.15) 6px
                    )`
                  }}
                />

                {/* Wood panels - horizontal divisions */}
                <div className="absolute top-[30%] left-[10%] right-[10%] h-[1px] bg-black/40" />
                <div className="absolute top-[60%] left-[10%] right-[10%] h-[1px] bg-black/40" />

                {/* Door frame border */}
                <div className="absolute inset-0 border-4 border-amber-950/80" 
                     style={{ borderRadius: '50% 50% 0 0' }} 
                />
                
                {/* Inner highlight */}
                <div className="absolute inset-[6px] border-[1px] border-amber-600/30" 
                     style={{ borderRadius: '50% 50% 0 0' }} 
                />

                {/* Glow from inside door (when hovered) */}
                {hoveredDoor === door.id && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.6, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-gradient-to-b from-amber-400/20 to-transparent"
                    style={{ borderRadius: '50% 50% 0 0' }}
                  />
                )}

                {/* Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pb-2">
                  {/* Emoji Icon */}
                  <motion.span 
                    animate={{
                      scale: hoveredDoor === door.id ? 1.2 : 1,
                      y: hoveredDoor === door.id ? -4 : 0
                    }}
                    transition={{ duration: 0.3 }}
                    className="text-4xl md:text-5xl lg:text-6xl mb-1 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                  >
                    {door.emoji}
                  </motion.span>

                  {/* Door Title */}
                  <motion.p 
                    animate={{
                      opacity: hoveredDoor === door.id ? 1 : 0.9
                    }}
                    className="text-echon-cream text-sm md:text-base lg:text-lg font-serif italic drop-shadow-lg"
                  >
                    {door.title}
                  </motion.p>
                </div>

                {/* Door handle/ring */}
                <div className="absolute bottom-[15%] left-1/2 transform -translate-x-1/2">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-gradient-to-br from-yellow-700 to-yellow-900 shadow-inner" />
                </div>
              </motion.div>

              {/* Floating sparkles on hover */}
              {hoveredDoor === door.id && (
                <>
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ 
                        x: Math.random() * 40 - 20,
                        y: Math.random() * 40 - 20,
                        opacity: 0 
                      }}
                      animate={{ 
                        y: [0, -30, -60],
                        opacity: [0, 1, 0],
                        scale: [0, 1, 0]
                      }}
                      transition={{ 
                        duration: 2,
                        delay: i * 0.2,
                        repeat: Infinity
                      }}
                      className="absolute w-0.5 h-0.5 bg-amber-400 rounded-full blur-[0.5px]"
                      style={{
                        left: `${30 + i * 20}%`,
                        top: '20%'
                      }}
                    />
                  ))}
                </>
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
        <p className="text-echon-cream-dark text-xs md:text-sm">
          Tap a door to enter your space
        </p>
      </motion.div>
    </div>
  );
}
