/**
 * Echon Entrance Sequence
 * The emotional 4-panel journey users see when entering their family space
 * Based on "The First Emotion" design
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EntranceSequenceProps {
  onComplete: () => void;
}

const panels = [
  {
    id: 1,
    title: 'Welcome',
    content: [
      'You are entering a family space.',
      'Nothing here is complete.',
      'Everything here matters.',
    ],
    duration: 3000,
    image: '/images/entrance-welcome.jpg', // Add your images to public/images/
  },
  {
    id: 2,
    title: 'Memory',
    content: [
      'I remember that in our family,',
      'things were built, fixed,',
      'and carried forward—quietly.',
    ],
    duration: 4000,
    image: '/images/entrance-candle.jpg',
  },
  {
    id: 3,
    title: 'Reflect',
    content: [
      'Take a moment to feel the connection.',
      'Breathe.',
      'You are here with those',
      'who came before and after you.',
    ],
    duration: 4000,
    image: '/images/entrance-roots.jpg',
  },
];

export default function EntranceSequence({ onComplete }: EntranceSequenceProps) {
  const [currentPanel, setCurrentPanel] = useState(0);

  useEffect(() => {
    if (currentPanel < panels.length) {
      const timer = setTimeout(() => {
        setCurrentPanel(prev => prev + 1);
      }, panels[currentPanel].duration);

      return () => clearTimeout(timer);
    } else {
      // Sequence complete, show doors
      onComplete();
    }
  }, [currentPanel, onComplete]);

  if (currentPanel >= panels.length) {
    return null; // Transition to doors
  }

  const panel = panels[currentPanel];

  return (
    <div className="fixed inset-0 z-50 bg-echon-black">
      <AnimatePresence mode="wait">
        <motion.div
          key={panel.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="w-full h-full flex flex-col items-center justify-center px-8"
        >
          {/* Panel Content */}
          <div className="max-w-2xl text-center space-y-8">
            {/* Title (small, above content) */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-echon-gold text-sm tracking-widest uppercase"
            >
              {panel.id}. {panel.title}
            </motion.p>

            {/* Main Content */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="space-y-4"
            >
              {panel.content.map((line, index) => (
                <motion.p
                  key={index}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 + index * 0.3 }}
                  className="text-echon-cream text-2xl md:text-3xl leading-relaxed"
                >
                  {line}
                </motion.p>
              ))}
            </motion.div>

            {/* Optional: Decorative element (candle, roots, etc.) */}
            {panel.id === 2 && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="mt-12"
              >
                <div className="w-2 h-24 bg-echon-candle mx-auto rounded-full candlelight animate-flicker" />
              </motion.div>
            )}

            {panel.id === 3 && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="mt-12"
              >
                {/* SVG tree roots (simplified) */}
                <svg
                  width="100"
                  height="100"
                  viewBox="0 0 100 100"
                  className="mx-auto rootlight"
                >
                  <path
                    d="M50 10 L50 50 M50 50 L30 70 M50 50 L70 70 M50 50 L40 80 M50 50 L60 80"
                    stroke="#FFD700"
                    strokeWidth="2"
                    fill="none"
                    className="animate-glow"
                  />
                </svg>
              </motion.div>
            )}
          </div>

          {/* Progress indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2"
          >
            {panels.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors duration-500 ${
                  index === currentPanel ? 'bg-echon-candle' : 'bg-echon-wood'
                }`}
              />
            ))}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}