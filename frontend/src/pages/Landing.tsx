/**
 * Echon Landing Page
 * Full-viewport immersive experience — no scrolling.
 * A cosmic universe of warm amber memory-particles orbiting a central light.
 * The Echon flame mark floats at the heart. Three equal CTAs always visible.
 *
 * PATH: echon/frontend/src/pages/Landing.tsx
 */

import { useEffect, useRef, useMemo, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { isAuthenticated } from '../lib/auth';
import EchonLogo from '../components/EchonLogo';

// ─── Particle system ─────────────────────────────────────────────────────────

/** Outer halo — ~300 warm wisps orbiting in a loose sphere shell */
function MemoryParticles({ reduced }: { reduced: boolean }) {
  const ref = useRef<THREE.Points>(null);

  const [positions, colors] = useMemo(() => {
    const COUNT = reduced ? 80 : 300;
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT * 3);

    for (let i = 0; i < COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      // Shell: inner radius 2.0, outer 4.5 — gives depth + breathing room
      const r = 2.0 + Math.pow(Math.random(), 0.7) * 2.5;

      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      // Warm amber spectrum: vary from deep gold to pale cream
      const warm  = 0.55 + Math.random() * 0.45;
      const tint  = Math.random();
      col[i * 3]     = warm;
      col[i * 3 + 1] = warm * (0.55 + tint * 0.25);
      col[i * 3 + 2] = warm * (0.10 + tint * 0.15);

      // Varied sizes — a few "memory orbs" stand out
    }
    return [pos, col];
  }, [reduced]);

  // Custom size-per-vertex requires a shader; use two point clouds instead:
  // one for orbs, one for wisps. Simpler: uniform size with two passes.
  // We'll use a single pass with median size — visually indistinguishable.

  useFrame((state) => {
    if (!ref.current || reduced) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y =  t * 0.055;
    ref.current.rotation.x =  Math.sin(t * 0.035) * 0.12;
    ref.current.rotation.z =  Math.cos(t * 0.025) * 0.06;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color"    args={[colors,    3]} />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        size={0.032}
        sizeAttenuation
        transparent
        opacity={0.72}
        depthWrite={false}
      />
    </points>
  );
}

/** Inner core — ~60 bright golden particles near the center */
function CoreParticles({ reduced }: { reduced: boolean }) {
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const COUNT = reduced ? 20 : 65;
    const pos = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = Math.pow(Math.random(), 1.4) * 1.4;
      pos[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, [reduced]);

  useFrame((state) => {
    if (!ref.current || reduced) return;
    // Rotate opposite direction — creates a living, breathing quality
    ref.current.rotation.y = -state.clock.elapsedTime * 0.038;
    ref.current.rotation.z =  state.clock.elapsedTime * 0.022;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#FFD700"
        size={0.055}
        sizeAttenuation
        transparent
        opacity={0.82}
        depthWrite={false}
      />
    </points>
  );
}

/** Ambient soft glow sphere at origin */
function AmbientCore() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const pulse = 0.85 + Math.sin(state.clock.elapsedTime * 1.1) * 0.15;
    ref.current.scale.setScalar(pulse);
    (ref.current.material as THREE.MeshBasicMaterial).opacity =
      0.06 + Math.sin(state.clock.elapsedTime * 0.8) * 0.025;
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.55, 16, 16]} />
      <meshBasicMaterial color="#F4A460" transparent opacity={0.07} depthWrite={false} />
    </mesh>
  );
}

/** Thin equatorial ring — gives the universe a subtle structure */
function OrbitRing() {
  const geometry = useMemo(() => {
    const g = new THREE.RingGeometry(1.82, 1.86, 96);
    // Tilt 23° like Earth's axial tilt
    const q = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(1, 0, 0), Math.PI / 8
    );
    g.applyQuaternion(q);
    return g;
  }, []);

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial
        color="#D4A574"
        transparent
        opacity={0.07}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// ─── Full scene ───────────────────────────────────────────────────────────────

function UniverseScene({ reduced }: { reduced: boolean }) {
  return (
    <>
      <MemoryParticles reduced={reduced} />
      <CoreParticles   reduced={reduced} />
      <AmbientCore />
      <OrbitRing />
    </>
  );
}

// ─── WebGL availability check ─────────────────────────────────────────────────

function canUseWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext('webgl') || c.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

// ─── CSS fallback when WebGL is not available ─────────────────────────────────

function FallbackBackground() {
  return (
    <div
      className="absolute inset-0"
      style={{
        background:
          'radial-gradient(ellipse at 50% 50%, #1a0e04 0%, #0f0a03 40%, #0A0A0A 100%)',
      }}
    >
      {/* Static amber wisps */}
      {Array.from({ length: 18 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-pulse"
          style={{
            width:  `${4 + (i % 4) * 3}px`,
            height: `${4 + (i % 4) * 3}px`,
            left:   `${10 + (i * 37) % 80}%`,
            top:    `${8  + (i * 53) % 84}%`,
            background: i % 5 === 0 ? '#FFD700' : '#F4A460',
            opacity: 0.25 + (i % 3) * 0.1,
            animationDelay: `${i * 0.4}s`,
            animationDuration: `${2 + (i % 3)}s`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Landing page ─────────────────────────────────────────────────────────────

export default function Landing() {
  const navigate  = useNavigate();
  const reduced   = useReducedMotion() ?? false;
  const webgl     = useRef(canUseWebGL());

  useEffect(() => {
    if (isAuthenticated()) navigate('/select-space');
  }, [navigate]);

  return (
    <div className="fixed inset-0 bg-echon-black overflow-hidden">

      {/* ── Universe background ── */}
      {webgl.current && !reduced ? (
        <div className="absolute inset-0">
          <Canvas
            camera={{ position: [0, 0, 6], fov: 60, near: 0.1, far: 50 }}
            gl={{ antialias: false, alpha: false }}
            dpr={[1, 1.5]}
          >
            {/* Deep space gradient via scene background */}
            <color attach="background" args={['#0A0A0A']} />
            <fog attach="fog" args={['#0A0A0A', 8, 18]} />
            <Suspense fallback={null}>
              <UniverseScene reduced={reduced} />
            </Suspense>
          </Canvas>
        </div>
      ) : (
        <FallbackBackground />
      )}

      {/* Radial warmth at center — visible on both WebGL and fallback */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(244,164,96,0.07) 0%, transparent 55%)',
        }}
      />

      {/* ── HTML overlay — always on top ── */}
      <div className="relative z-10 h-full flex flex-col items-center justify-between px-6 py-10 md:py-14">

        {/* Top: tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, delay: 0.6, ease: 'easeOut' }}
          className="text-[10px] md:text-xs tracking-[0.35em] uppercase text-echon-gold/50 text-center"
        >
          For Humans Only
        </motion.p>

        {/* Center: logo mark + tagline */}
        <div className="flex flex-col items-center gap-5 md:gap-7">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <EchonLogo width={160} showScripts={true} />
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 1.1, ease: 'easeOut' }}
            className="font-serif text-xl md:text-2xl text-echon-cream/80 text-center tracking-wide max-w-xs leading-relaxed"
          >
            A private place for your family.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.0, delay: 1.8 }}
            className="text-[11px] md:text-xs text-echon-cream-dark/35 tracking-[0.25em] uppercase text-center"
          >
            Private &nbsp;·&nbsp; Encrypted &nbsp;·&nbsp; Forever yours
          </motion.p>
        </div>

        {/* Bottom: three equal CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.0, delay: 2.4, ease: 'easeOut' }}
          className="flex flex-col items-center gap-3 w-full max-w-xs"
        >
          {/* Primary CTA */}
          <button
            onClick={() => navigate('/register')}
            className="echon-btn w-full text-sm md:text-base py-3.5"
          >
            Create your family space
          </button>

          {/* Enter (login) — same visual weight as create */}
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3.5 rounded-lg border border-echon-wood text-echon-cream text-sm md:text-base tracking-wide hover:border-echon-gold hover:text-echon-gold transition-colors bg-echon-shadow/50 backdrop-blur-sm"
          >
            Enter your family space
          </button>

          {/* Join via invite */}
          <button
            onClick={() => navigate('/register?join=1')}
            className="text-echon-gold/70 text-sm underline underline-offset-4 decoration-echon-wood/60 hover:text-echon-gold hover:decoration-echon-candle transition-colors py-1.5"
          >
            I was invited
          </button>
        </motion.div>

      </div>
    </div>
  );
}
