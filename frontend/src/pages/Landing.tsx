/**
 * Echon Landing Page
 * Mobile-first emotional narrative — six scroll sections.
 * Dark luxury, warm amber, intimate. Not a SaaS pitch.
 *
 * PATH: echon/frontend/src/pages/Landing.tsx
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { isAuthenticated } from '../lib/auth';

// ── Shared helpers ────────────────────────────────────────────────────────────

function CandleFlame({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const sm = size === 'sm';
  return (
    <div className="flex flex-col items-center">
      <div
        className={`${sm ? 'w-2 h-5' : 'w-3 h-8'} rounded-full animate-flicker`}
        style={{
          background: 'linear-gradient(to top, #F4A460, #FFD700, #fff8e0)',
          boxShadow: '0 0 18px #F4A46099, 0 0 40px #F4A46044',
        }}
      />
      <div className={`${sm ? 'w-px h-1.5' : 'w-[3px] h-2'} bg-echon-gold/60`} />
      <div
        className={`${sm ? 'w-3 h-8' : 'w-4 h-16'} rounded-sm`}
        style={{ background: 'linear-gradient(180deg, #d4a574 0%, #8b6043 100%)' }}
      />
    </div>
  );
}

function Wrap({
  children,
  className = '',
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <section
      className={`min-h-screen flex flex-col items-center justify-center px-6 md:px-12 relative overflow-hidden ${className}`}
      style={style}
    >
      {children}
    </section>
  );
}

// Framer Motion helpers — respects reduced-motion preference
function onMount(reduced: boolean, delay = 0) {
  return {
    initial: { opacity: 0, y: reduced ? 0 : 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduced ? 0.01 : 0.9, delay, ease: 'easeOut' },
  } as const;
}

function onScroll(reduced: boolean, delay = 0) {
  return {
    initial: { opacity: 0, y: reduced ? 0 : 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.3 as const },
    transition: { duration: reduced ? 0.01 : 0.9, delay, ease: 'easeOut' },
  } as const;
}

// ── Landing page ──────────────────────────────────────────────────────────────

export default function Landing() {
  const navigate = useNavigate();
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    if (isAuthenticated()) navigate('/select-space');
  }, [navigate]);

  return (
    <div className="bg-echon-black">

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 0 — Hero
          First thing you see. One candle in the dark.
      ════════════════════════════════════════════════════════════════ */}
      <Wrap>
        {/* Ambient warmth behind flame */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(circle at 50% 54%, #F4A46012 0%, transparent 55%)' }}
        />

        <div className="relative z-10 flex flex-col items-center gap-8 text-center">
          <motion.h1
            {...onMount(reduced, 0.3)}
            className="text-6xl md:text-8xl font-serif text-echon-cream text-glow tracking-wide"
          >
            Echon
          </motion.h1>

          <motion.div {...onMount(reduced, 0.9)}>
            <CandleFlame />
          </motion.div>

          <motion.p
            {...onMount(reduced, 1.8)}
            className="text-echon-gold text-sm md:text-base tracking-[0.25em]"
          >
            A private place for your family.
          </motion.p>
        </div>

        {/* Scroll nudge */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.2, duration: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.span
            animate={reduced ? {} : { y: [0, 7, 0] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
            className="block text-echon-cream-dark/30 text-base select-none"
          >
            ↓
          </motion.span>
        </motion.div>
      </Wrap>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1 — The Problem
          Where family stories actually live today.
      ════════════════════════════════════════════════════════════════ */}
      <Wrap>
        <div className="max-w-2xl text-center space-y-8 md:space-y-12">
          {(
            [
              "Your family's stories live in group chats that scroll away.",
              'In photo albums no one opens.',
              null, // last line rendered separately for the pulsing word
            ] as (string | null)[]
          ).map((line, i) =>
            line !== null ? (
              <motion.p
                key={i}
                {...onScroll(reduced, i * 0.25)}
                className="font-serif text-2xl md:text-4xl text-echon-cream leading-relaxed"
              >
                {line}
              </motion.p>
            ) : null
          )}

          {/* Third line — "forever" pulses */}
          <motion.p
            {...onScroll(reduced, 0.5)}
            className="font-serif text-2xl md:text-4xl text-echon-cream leading-relaxed"
          >
            In the memories of people who won&apos;t be here{' '}
            <motion.span
              animate={reduced ? {} : { opacity: [0.65, 1, 0.65] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="text-echon-candle"
            >
              forever.
            </motion.span>
          </motion.p>
        </div>
      </Wrap>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2 — The Contrast
          What Echon is not. Then what it is.
      ════════════════════════════════════════════════════════════════ */}
      <Wrap>
        <div className="max-w-lg w-full text-center space-y-6 md:space-y-8">
          <motion.p
            {...onScroll(reduced, 0)}
            className="text-[11px] md:text-xs tracking-[0.35em] uppercase text-echon-cream-dark"
          >
            No algorithms. No ads. No strangers.
          </motion.p>

          {/* Divider draws itself */}
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: reduced ? 0.01 : 0.9, delay: 0.35, ease: 'easeOut' }}
            className="h-px bg-echon-wood origin-center mx-auto w-16"
          />

          <motion.p
            {...onScroll(reduced, 0.65)}
            className="font-serif text-3xl md:text-5xl text-echon-cream text-glow leading-tight"
          >
            Just a door to your family&apos;s space.
          </motion.p>

          {/* Door outline drawing itself */}
          <motion.div {...onScroll(reduced, 1.0)} className="flex justify-center pt-2">
            <svg width="56" height="84" viewBox="0 0 56 84" fill="none">
              <motion.path
                d="M 8 82 L 8 28 A 20 20 0 0 1 48 28 L 48 82"
                stroke="#D4A574"
                strokeWidth="1.5"
                strokeLinecap="round"
                fill="none"
                opacity="0.35"
                initial={{ pathLength: 0 }}
                whileInView={{ pathLength: 1 }}
                viewport={{ once: true }}
                transition={{ duration: reduced ? 0.01 : 1.6, delay: 1.3, ease: 'easeOut' }}
              />
              <motion.circle
                cx="38"
                cy="56"
                r="2"
                fill="#D4A574"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 0.35 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: reduced ? 0 : 2.9 }}
              />
            </svg>
          </motion.div>
        </div>
      </Wrap>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 3 — Emotional Core
          The same words that greet you when you enter.
      ════════════════════════════════════════════════════════════════ */}
      <Wrap
        style={{ background: 'radial-gradient(ellipse at center, #1a0f05 0%, #0A0A0A 65%)' }}
      >
        <div className="max-w-xl text-center space-y-6 md:space-y-10 px-2">
          {[
            'You are entering a family space.',
            'Nothing here is complete.',
            'Everything here matters.',
          ].map((line, i) => (
            <motion.p
              key={i}
              {...onScroll(reduced, i * 0.35)}
              className="font-serif text-2xl md:text-4xl text-echon-cream leading-relaxed"
            >
              {line}
            </motion.p>
          ))}

          {/* Amber orb */}
          <motion.div {...onScroll(reduced, 1.1)} className="flex justify-center pt-4">
            <div
              className="w-12 h-12 md:w-14 md:h-14 rounded-full animate-glow"
              style={{
                background: 'radial-gradient(circle, #D4A57480 0%, #D4A57420 60%, transparent 100%)',
                boxShadow: '0 0 40px #D4A57440',
              }}
            />
          </motion.div>
        </div>
      </Wrap>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 4 — Trust
          Why this was built.
      ════════════════════════════════════════════════════════════════ */}
      <Wrap>
        <div className="max-w-lg text-center space-y-5">
          <motion.p
            {...onScroll(reduced, 0)}
            className="font-serif italic text-xl md:text-2xl text-echon-cream/90 leading-relaxed"
          >
            &ldquo;We built this because our grandmother&apos;s voice
            deserves more than a cloud backup.&rdquo;
          </motion.p>

          <motion.p
            {...onScroll(reduced, 0.4)}
            className="text-xs text-echon-cream-dark tracking-[0.25em] uppercase"
          >
            — The family behind Echon
          </motion.p>

          <motion.p
            {...onScroll(reduced, 1.0)}
            className="text-sm tracking-wide text-echon-gold/60 pt-3"
          >
            Invite only. No waitlist. Your family starts it.
          </motion.p>
        </div>
      </Wrap>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 5 — Invitation / CTA
          The moment of decision.
      ════════════════════════════════════════════════════════════════ */}
      <Wrap>
        {/* Warm glow behind CTA */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(circle at 50% 50%, #F4A46009 0%, transparent 60%)' }}
        />

        <div className="relative z-10 flex flex-col items-center gap-8 md:gap-10 text-center w-full max-w-sm md:max-w-md">
          <motion.h2
            {...onScroll(reduced, 0)}
            className="font-serif text-3xl md:text-5xl text-echon-cream text-glow leading-tight"
          >
            Light your family&apos;s first candle.
          </motion.h2>

          <motion.div {...onScroll(reduced, 0.35)}>
            <CandleFlame size="sm" />
          </motion.div>

          {/* CTAs — stacked on mobile, side by side on md+ */}
          <motion.div
            {...onScroll(reduced, 0.65)}
            className="flex flex-col md:flex-row items-center gap-4 w-full"
          >
            <button
              onClick={() => navigate('/register')}
              className="echon-btn text-base px-8 py-4 w-full md:w-auto"
            >
              Create your family space
            </button>
            <button
              onClick={() => navigate('/register?join=1')}
              className="text-echon-gold text-sm md:text-base underline underline-offset-4 decoration-echon-wood hover:decoration-echon-candle transition-colors py-2"
            >
              I was invited
            </button>
          </motion.div>

          <motion.p
            {...onScroll(reduced, 1.05)}
            className="text-[10px] tracking-[0.3em] uppercase text-echon-cream-dark/40"
          >
            Private &nbsp;·&nbsp; Encrypted &nbsp;·&nbsp; Forever yours
          </motion.p>
        </div>
      </Wrap>

    </div>
  );
}
