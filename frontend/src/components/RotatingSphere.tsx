/**
 * 3D Rotating Sphere Component
 * The central family emblem with rotation and glow
 * 
 * PATH: echon/frontend/src/components/RotatingSphere.tsx
 */

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { getCurrentSpace } from '../lib/auth';
import { spaceApi } from '../lib/api';
import { getMediaUrl } from '../lib/api';

interface RotatingSphereProps {
  familyName: string;
  emblemUrl?: string;
  onEmblemUpdate?: (url: string) => void;
  hoveredDoor?: string | null;  // Which door is being hovered
}

export default function RotatingSphere({ familyName, emblemUrl, onEmblemUpdate, hoveredDoor }: RotatingSphereProps) {
  const [uploading, setUploading] = useState(false);
  const [currentEmblem, setCurrentEmblem] = useState(emblemUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tilt angles based on door positions
  const getTiltAngles = () => {
    switch(hoveredDoor) {
      case 'memories':  // Top-left
        return { rotateX: -8, rotateY: -8 };
      case 'stories':   // Top-right
        return { rotateX: -8, rotateY: 8 };
      case 'family':    // Bottom-left
        return { rotateX: 8, rotateY: -8 };
      case 'now':       // Bottom-right
        return { rotateX: 8, rotateY: 8 };
      default:
        return { rotateX: 0, rotateY: 0 };
    }
  };

  const tiltAngles = getTiltAngles();

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
      onEmblemUpdate?.(response.emblem_url);
      alert('✅ Family emblem updated!');
    } catch (error: any) {
      console.error('Failed to upload emblem:', error);
      alert(error.response?.data?.detail || 'Failed to upload emblem');
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div 
      className="relative" 
      style={{ perspective: '1000px' }}
      animate={{
        rotateX: tiltAngles.rotateX,
        rotateY: tiltAngles.rotateY
      }}
      transition={{
        duration: 0.6,
        type: 'spring',
        stiffness: 150,
        damping: 20
      }}
    >
      {/* Rotating glow rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          className="absolute w-64 h-64 md:w-80 md:h-80 rounded-full border border-echon-gold/20"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          className="absolute w-72 h-72 md:w-96 md:h-96 rounded-full border border-echon-candle/10"
        />
      </div>

      {/* Main sphere */}
      <motion.div
        initial={{ scale: 0, rotateY: 0 }}
        animate={{ 
          scale: [1, 1.05, 1],  // Breathing effect
          rotateY: 360,
          opacity: [0.95, 1, 0.95]  // Subtle pulse
        }}
        transition={{ 
          scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' },  // 4s breathing
          opacity: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
          rotateY: { duration: 60, repeat: Infinity, ease: 'linear' }  // Slow rotation
        }}
        className="relative"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Glow effect - Breathes with sphere */}
        <motion.div 
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="absolute inset-0 bg-echon-root-light rounded-full blur-3xl" 
        />
        
        {/* Clickable sphere */}
        <div 
          className="relative w-40 h-40 md:w-56 md:h-56 rounded-full border-4 border-echon-gold flex items-center justify-center bg-gradient-to-br from-echon-shadow via-echon-wood to-echon-shadow cursor-pointer hover:border-echon-candle transition-all duration-500 group shadow-2xl"
          onClick={() => fileInputRef.current?.click()}
          title="Click to upload family emblem (founders only)"
          style={{ 
            transformStyle: 'preserve-3d',
            boxShadow: '0 0 60px rgba(212, 175, 55, 0.3), inset 0 0 40px rgba(0, 0, 0, 0.5)'
          }}
        >
          {currentEmblem ? (
            <div className="w-full h-full rounded-full overflow-hidden border-4 border-echon-gold/50">
              <img
                src={getMediaUrl(currentEmblem)}
                alt={`${familyName} emblem`}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="text-center p-4 flex flex-col items-center justify-center h-full">
              {/* Family Tree SVG */}
              <svg 
                viewBox="0 0 100 100" 
                className="w-20 h-20 md:w-28 md:h-28 mb-2"
                fill="none"
              >
                {/* Tree trunk */}
                <rect x="45" y="60" width="10" height="30" fill="#78350f" rx="2"/>
                
                {/* Tree foliage - 3 circles for full tree */}
                <circle cx="50" cy="35" r="18" fill="#166534" opacity="0.9"/>
                <circle cx="38" cy="45" r="15" fill="#15803d" opacity="0.9"/>
                <circle cx="62" cy="45" r="15" fill="#15803d" opacity="0.9"/>
                
                {/* Roots */}
                <path 
                  d="M 45 90 Q 35 85 30 90" 
                  stroke="#78350f" 
                  strokeWidth="2" 
                  fill="none"
                />
                <path 
                  d="M 55 90 Q 65 85 70 90" 
                  stroke="#78350f" 
                  strokeWidth="2" 
                  fill="none"
                />
                
                {/* Small leaves/details */}
                <circle cx="45" cy="30" r="3" fill="#22c55e" opacity="0.8"/>
                <circle cx="55" cy="32" r="3" fill="#22c55e" opacity="0.8"/>
                <circle cx="50" cy="40" r="3" fill="#22c55e" opacity="0.8"/>
              </svg>
              
              {/* Family name below tree */}
              <p className="text-echon-gold text-2xl md:text-4xl font-bold mb-1">
                {familyName.charAt(0)}
              </p>
              <p className="text-echon-cream text-xs md:text-sm font-serif">
                {familyName}
              </p>
            </div>
          )}
          
          {/* Upload hint overlay */}
          <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center backdrop-blur-sm">
            <span className="text-white text-sm md:text-base font-semibold">
              {uploading ? '⏳ Uploading...' : '📷 Upload Emblem'}
            </span>
          </div>
        </div>

        {/* Sparkle effects */}
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3]
          }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute -top-4 -right-4 w-8 h-8 bg-echon-candle rounded-full blur-md"
        />
        <motion.div
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.5, 0.2]
          }}
          transition={{ duration: 4, repeat: Infinity, delay: 1 }}
          className="absolute -bottom-6 -left-6 w-6 h-6 bg-echon-gold rounded-full blur-md"
        />
      </motion.div>
      
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
  );
}