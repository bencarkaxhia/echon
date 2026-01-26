/**
 * Echon Landing Page
 * First page users see when visiting echon.app
 * 
 PATH: echon/frontend/src/pages/Landing.tsx
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { isAuthenticated } from '../lib/auth';
import { useEffect } from 'react';

export default function Landing() {
  const navigate = useNavigate();

  // If already logged in, go to space selection
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/create-space');
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-echon-black flex flex-col items-center justify-center px-4">
      {/* Glowing background effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-echon-candle opacity-10 rounded-full blur-3xl animate-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-echon-root-light opacity-10 rounded-full blur-3xl animate-glow" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-12">
        {/* Logo / Title */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h1 className="text-6xl md:text-8xl font-serif text-echon-cream mb-4 text-glow">
            Echon
          </h1>
          <p className="text-xl md:text-2xl text-echon-gold">
            Your Family's Private Space
          </p>
        </motion.div>

        {/* Main message */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          className="space-y-6"
        >
          <p className="text-lg md:text-xl text-echon-cream leading-relaxed max-w-2xl mx-auto">
            A sacred place where your family shares memories, 
            preserves stories, and stays connected across 
            generations and distance.
          </p>

          <p className="text-echon-cream-dark text-sm md:text-base">
            No strangers. No ads. No algorithms.
            <br />
            Just your people.
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <button
            onClick={() => navigate('/register')}
            className="echon-btn text-lg px-8 py-4 w-full sm:w-auto"
          >
            Create Your Family Space
          </button>

          <button
            onClick={() => navigate('/login')}
            className="echon-btn-secondary text-lg px-8 py-4 w-full sm:w-auto"
          >
            Already Have a Space? Sign In
          </button>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 pt-16 border-t border-echon-wood"
        >
          <div className="space-y-3">
            <div className="text-4xl">📸</div>
            <h3 className="text-echon-gold font-semibold">Preserve Memories</h3>
            <p className="text-echon-cream-dark text-sm">
              Photos, documents, and moments organized by time and place
            </p>
          </div>

          <div className="space-y-3">
            <div className="text-4xl">🗣️</div>
            <h3 className="text-echon-gold font-semibold">Share Stories</h3>
            <p className="text-echon-cream-dark text-sm">
              Voice recordings and oral histories from your elders
            </p>
          </div>

          <div className="space-y-3">
            <div className="text-4xl">👥</div>
            <h3 className="text-echon-gold font-semibold">Stay Connected</h3>
            <p className="text-echon-cream-dark text-sm">
              Bring family together across continents and generations
            </p>
          </div>
        </motion.div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.3 }}
          className="text-echon-cream-dark text-xs mt-12"
        >
          Private. Secure. Forever yours.
        </motion.p>
      </div>
    </div>
  );
}