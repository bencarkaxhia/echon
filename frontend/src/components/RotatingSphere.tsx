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

interface RotatingSphereProps {
  familyName: string;
  emblemUrl?: string;
  onEmblemUpdate?: (url: string) => void;
}

export default function RotatingSphere({ familyName, emblemUrl, onEmblemUpdate }: RotatingSphereProps) {
  const [uploading, setUploading] = useState(false);
  const [currentEmblem, setCurrentEmblem] = useState(emblemUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    <div className="relative" style={{ perspective: '1000px' }}>
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
        animate={{ scale: 1, rotateY: 360 }}
        transition={{ 
          scale: { duration: 1, delay: 0.5 },
          rotateY: { duration: 60, repeat: Infinity, ease: 'linear' }
        }}
        className="relative"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Glow effect */}
        <div className="absolute inset-0 bg-echon-root-light opacity-30 rounded-full blur-3xl animate-pulse" 
             style={{ animationDuration: '4s' }} 
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
                src={`http://localhost:8000${currentEmblem}`}
                alt={`${familyName} emblem`}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="text-center p-4">
              <p className="text-echon-gold text-4xl md:text-6xl font-bold mb-2 drop-shadow-lg">
                {familyName.charAt(0)}
              </p>
              <p className="text-echon-cream text-sm md:text-base font-serif drop-shadow-md">
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
    </div>
  );
}