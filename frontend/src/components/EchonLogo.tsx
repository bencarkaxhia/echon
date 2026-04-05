/**
 * Echon Logo Mark
 * Flame glyph + wordmark + world-scripts ring.
 * The ring shows "memory / family / remembrance" across ancient and modern
 * writing systems — Illyrian·Greek·Hebrew·Arabic·Sanskrit·Chinese·Runes·Armenian·Georgian·Tamil·Ge'ez·Japanese
 *
 * PATH: echon/frontend/src/components/EchonLogo.tsx
 */

interface EchonLogoProps {
  /** Total width of the mark (height scales proportionally) */
  width?: number;
  /** Show the ring of world scripts below the wordmark */
  showScripts?: boolean;
  className?: string;
}

// Ancient and world scripts — phonetic "Echon" or the concept of
// memory / family in each writing system.
const SCRIPTS = [
  { label: 'ΕΧΩΝ',      title: 'Ancient Greek — "the one who holds"'   },
  { label: '·' },
  { label: 'זִכָּרוֹן', title: 'Hebrew — zikharon, remembrance'         },
  { label: '·' },
  { label: 'ذِكرَى',    title: 'Arabic — dhikrā, memory'               },
  { label: '·' },
  { label: 'स्मृति',    title: 'Sanskrit — smṛti, memory'              },
  { label: '·' },
  { label: '回憶',       title: 'Chinese — huíyì, reminiscence'         },
  { label: '·' },
  { label: 'ᛖᚲᛟᚾ',     title: 'Elder Futhark — runic EKON'            },
  { label: '·' },
  { label: 'ᛖᚳᚩᚾ',     title: 'Old English Futhorc — ECON'            },
  { label: '·' },
  { label: 'Եखोन',      title: 'Armenian — phonetic'                   },
  { label: '·' },
  { label: 'ეხონ',      title: 'Georgian — phonetic'                   },
  { label: '·' },
  { label: 'ኤኮን',       title: 'Ge\'ez / Ethiopic — phonetic'          },
  { label: '·' },
  { label: 'ஏகோன்',     title: 'Tamil — phonetic'                      },
  { label: '·' },
  { label: 'エコン',     title: 'Japanese Katakana — phonetic'          },
];

export default function EchonLogo({ width = 120, showScripts = true, className = '' }: EchonLogoProps) {
  const flameW = width * 0.22;
  const flameH = flameW * 1.85;
  const id = `logo-${Math.random().toString(36).slice(2, 7)}`;

  return (
    <div className={`flex flex-col items-center select-none ${className}`} style={{ width }}>
      {/* ── Flame glyph ── */}
      <svg
        width={flameW}
        height={flameH}
        viewBox="0 0 24 44"
        fill="none"
        aria-hidden="true"
        className="drop-shadow-[0_0_12px_rgba(244,164,96,0.6)]"
      >
        <defs>
          <radialGradient id={`${id}-outer`} cx="50%" cy="65%" r="55%">
            <stop offset="0%"   stopColor="#fff8e0" stopOpacity="0.95" />
            <stop offset="45%"  stopColor="#FFD700" />
            <stop offset="80%"  stopColor="#F4A460" />
            <stop offset="100%" stopColor="#D4A574" stopOpacity="0.5" />
          </radialGradient>
          <radialGradient id={`${id}-inner`} cx="50%" cy="55%" r="50%">
            <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="60%"  stopColor="#fff3a0" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#FFD700"  stopOpacity="0"   />
          </radialGradient>
        </defs>

        {/* Outer flame — organic teardrop with slight tilt */}
        <path
          d="M 12 1
             C 11 1, 5 9, 4 17
             C 3 23, 5.5 30, 8 35
             C 9.5 38, 10.5 42, 12 43
             C 13.5 42, 14.5 38, 16 35
             C 18.5 30, 21 23, 20 17
             C 19 9, 13 1, 12 1 Z"
          fill={`url(#${id}-outer)`}
        />

        {/* Wisp at top — the living tip of the flame */}
        <path
          d="M 12 1
             C 12.5 1, 16 5, 15 10
             C 14.2 7, 13 4, 12 1 Z"
          fill="#fff8e0"
          opacity="0.6"
        />

        {/* Inner bright core */}
        <path
          d="M 12 14
             C 10 18, 9 24, 10 30
             C 10.5 33, 11.2 36, 12 38
             C 12.8 36, 13.5 33, 14 30
             C 15 24, 14 18, 12 14 Z"
          fill={`url(#${id}-inner)`}
        />
      </svg>

      {/* ── Wordmark ── */}
      <svg
        width={width}
        height={width * 0.28}
        viewBox="0 0 120 34"
        aria-label="Echon"
      >
        <defs>
          <linearGradient id={`${id}-text`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#D4A574" />
            <stop offset="40%"  stopColor="#F5F5DC" />
            <stop offset="100%" stopColor="#D4A574" />
          </linearGradient>
        </defs>
        <text
          x="60"
          y="26"
          textAnchor="middle"
          fontFamily="'Crimson Text', Georgia, serif"
          fontSize="28"
          fontWeight="600"
          letterSpacing="6"
          fill={`url(#${id}-text)`}
        >
          ECHON
        </text>
      </svg>

      {/* ── World scripts ring ── */}
      {showScripts && (
        <p
          className="text-center leading-relaxed"
          style={{
            fontSize: width * 0.072,
            color: 'rgba(212, 165, 116, 0.38)',
            letterSpacing: '0.08em',
            fontFamily: "'Noto Sans', 'Arial Unicode MS', sans-serif",
            maxWidth: width * 1.1,
          }}
          title="Memory and family in ancient and modern scripts from every corner of humanity"
        >
          {SCRIPTS.map((s, i) =>
            s.label === '·' ? (
              <span key={i} style={{ opacity: 0.3 }}> · </span>
            ) : (
              <span key={i} title={s.title}>{s.label}</span>
            )
          )}
        </p>
      )}
    </div>
  );
}
