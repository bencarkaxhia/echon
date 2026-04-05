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
    duration: 3500,
    bg: 'radial-gradient(ellipse at center, #1a0f05 0%, #0A0A0A 70%)',
    accent: '#D4A574',
  },
  {
    id: 2,
    title: 'Memory',
    content: [
      'In our family,',
      'things were built, fixed,',
      'and carried forward — quietly.',
    ],
    duration: 4000,
    bg: 'radial-gradient(ellipse at 50% 60%, #2a1505 0%, #0A0A0A 65%)',
    accent: '#F4A460',
  },
  {
    id: 3,
    title: 'Roots',
    content: [
      'Take a moment to feel the connection.',
      'You are here with those',
      'who came before and after you.',
    ],
    duration: 4000,
    bg: 'radial-gradient(ellipse at 50% 70%, #1a1205 0%, #0A0A0A 65%)',
    accent: '#FFD700',
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
    return null;
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
          transition={{ duration: 1.2 }}
          className="w-full h-full flex flex-col items-center justify-center px-8"
          style={{ background: panel.bg }}
        >
          {/* Ambient glow */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${panel.accent}18 0%, transparent 60%)`,
            }}
          />

          {/* Panel content */}
          <div className="relative z-10 max-w-2xl text-center space-y-10">
            {/* Panel number + title */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-sm tracking-[0.3em] uppercase"
              style={{ color: panel.accent }}
            >
              {panel.id} &nbsp;·&nbsp; {panel.title}
            </motion.p>

            {/* Main lines */}
            <div className="space-y-5">
              {panel.content.map((line, index) => (
                <motion.p
                  key={index}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.4, duration: 0.9 }}
                  className="text-echon-cream font-serif text-2xl md:text-3xl lg:text-4xl leading-relaxed"
                >
                  {line}
                </motion.p>
              ))}
            </div>

            {/* Panel 1 — soft orb */}
            {panel.id === 1 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.6, duration: 1.2 }}
                className="mt-8 flex justify-center"
              >
                <div
                  className="w-16 h-16 rounded-full animate-glow"
                  style={{
                    background: `radial-gradient(circle, ${panel.accent}80 0%, ${panel.accent}20 60%, transparent 100%)`,
                    boxShadow: `0 0 40px ${panel.accent}40`,
                  }}
                />
              </motion.div>
            )}

            {/* Panel 2 — candle flame */}
            {panel.id === 2 && (
              <motion.div
                initial={{ opacity: 0, scaleY: 0.4 }}
                animate={{ opacity: 1, scaleY: 1 }}
                transition={{ delay: 1.6, duration: 1 }}
                className="mt-8 flex flex-col items-center gap-1"
              >
                {/* Flame */}
                <div
                  className="w-3 h-8 rounded-full animate-flicker"
                  style={{
                    background: `linear-gradient(to top, #F4A460, #FFD700, #fff8e0)`,
                    boxShadow: '0 0 18px #F4A46099, 0 0 40px #F4A46044',
                  }}
                />
                {/* Wick + body */}
                <div className="w-[3px] h-2 bg-echon-gold/60" />
                <div
                  className="w-4 h-16 rounded-sm"
                  style={{ background: 'linear-gradient(180deg, #d4a574 0%, #8b6043 100%)' }}
                />
              </motion.div>
            )}

            {/* Panel 3 — roots SVG */}
            {panel.id === 3 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.6, duration: 1.2 }}
                className="mt-8 flex justify-center"
              >
                <svg width="120" height="90" viewBox="0 0 120 90" fill="none">
                  {/* Trunk */}
                  <motion.line
                    x1="60" y1="0" x2="60" y2="45"
                    stroke="#FFD700" strokeWidth="2.5" strokeLinecap="round"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    transition={{ delay: 2, duration: 0.8 }}
                  />
                  {/* Left roots */}
                  <motion.path
                    d="M60 45 Q40 55 20 70"
                    stroke="#FFD700" strokeWidth="2" strokeLinecap="round" fill="none"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    transition={{ delay: 2.4, duration: 0.7 }}
                  />
                  <motion.path
                    d="M60 45 Q45 60 35 85"
                    stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round" fill="none"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    transition={{ delay: 2.6, duration: 0.7 }}
                  />
                  {/* Right roots */}
                  <motion.path
                    d="M60 45 Q80 55 100 70"
                    stroke="#FFD700" strokeWidth="2" strokeLinecap="round" fill="none"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    transition={{ delay: 2.4, duration: 0.7 }}
                  />
                  <motion.path
                    d="M60 45 Q75 60 85 85"
                    stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round" fill="none"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    transition={{ delay: 2.6, duration: 0.7 }}
                  />
                  {/* Center root */}
                  <motion.line
                    x1="60" y1="45" x2="60" y2="88"
                    stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round"
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                    transition={{ delay: 2.8, duration: 0.6 }}
                  />
                </svg>
              </motion.div>
            )}
          </div>

          {/* Progress dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 items-center"
          >
            {panels.map((_, index) => (
              <div
                key={index}
                className="rounded-full transition-all duration-700"
                style={{
                  width: index === currentPanel ? '24px' : '6px',
                  height: '6px',
                  background: index === currentPanel ? panel.accent : '#3E2723',
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}