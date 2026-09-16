import React, { useMemo } from 'react';
import { BombDangerLevel } from '../types';

interface BombVisualProps {
  progress: number; // 0 (start, full fuse) to 1.0 (empty fuse, explosion imminent)
  dangerLevel: BombDangerLevel;
  speedMultiplier: number;
}

export const BombVisual: React.FC<BombVisualProps> = ({
  progress,
  dangerLevel,
  speedMultiplier,
}) => {
  // Fuse length calculations along a curved path
  // Total SVG fuse path length is ~130 units
  const totalFuseLength = 130;
  const burnedLength = Math.min(progress, 0.98) * totalFuseLength;
  const remainingFuse = Math.max(0, totalFuseLength - burnedLength);

  // Spark tip coordinates along the path approximating fuse progression
  // The path starts at (130, 25), curves to (105, 55), down into the bomb top at (85, 80)
  const sparkPosition = useMemo(() => {
    const t = 1 - Math.min(progress, 0.96); // 1 = at start tip (130, 25), 0 = into the bomb cap (85, 80)
    // Quadratic bezier curve interpolation
    // P0 = (85, 80), P1 = (95, 20), P2 = (135, 25)
    const p0 = { x: 85, y: 78 };
    const p1 = { x: 95, y: 15 };
    const p2 = { x: 135, y: 25 };

    const x = (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x;
    const y = (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y;

    return { x, y };
  }, [progress]);

  // Determine shake class based on danger level
  const shakeClass = useMemo(() => {
    switch (dangerLevel) {
      case 'CRITICAL':
        return 'animate-critical-shake';
      case 'DANGER':
        return 'animate-danger-wobble';
      case 'MIDDLE':
        return 'animate-gentle-float';
      case 'EARLY':
      default:
        return 'animate-gentle-float';
    }
  }, [dangerLevel]);

  // Eye and face expressions
  const isWinkOrSweat = dangerLevel === 'MIDDLE' || dangerLevel === 'DANGER' || dangerLevel === 'CRITICAL';
  const isPanic = dangerLevel === 'DANGER' || dangerLevel === 'CRITICAL';
  const isExtremePanic = dangerLevel === 'CRITICAL';

  return (
    <div className="relative flex flex-col items-center justify-center select-none pointer-events-none">
      {/* Outer pulsating danger aura */}
      {dangerLevel === 'CRITICAL' && (
        <div className="absolute inset-0 -m-8 rounded-full bg-rose-600/30 blur-2xl animate-ping" />
      )}
      {dangerLevel === 'DANGER' && (
        <div className="absolute inset-0 -m-6 rounded-full bg-amber-500/20 blur-xl animate-pulse" />
      )}

      {/* Main Bomb Wrapper with Shake Animation - reduced size (25-35% smaller) for airy, spacious layout */}
      <div className={`relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 transition-transform duration-75 ${shakeClass}`}>
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full drop-shadow-2xl overflow-visible"
        >
          {/* Defs for gradients */}
          <defs>
            <radialGradient id="bombBodyGradient" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="35%" stopColor="#1e293b" />
              <stop offset="85%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>

            <radialGradient id="fuseGlowGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="40%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>

            <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Bomb Fuse (rope) */}
          {/* Full path guide (behind) */}
          <path
            d="M 85 80 Q 95 15 135 25"
            fill="none"
            stroke="#473c35"
            strokeWidth="5"
            strokeLinecap="round"
            opacity="0.25"
          />

          {/* Remaining burning fuse rope */}
          <path
            d="M 85 80 Q 95 15 135 25"
            fill="none"
            stroke="#d4a373"
            strokeWidth="5"
            strokeDasharray={totalFuseLength}
            strokeDashoffset={burnedLength}
            strokeLinecap="round"
            className="transition-all duration-100 ease-linear"
          />

          {/* Bomb Metallic Collar / Cap */}
          <rect
            x="76"
            y="70"
            width="28"
            height="14"
            rx="3"
            fill="#64748b"
            stroke="#334155"
            strokeWidth="2"
          />

          {/* Main Bomb Sphere */}
          <circle
            cx="100"
            cy="125"
            r="65"
            fill="url(#bombBodyGradient)"
            stroke={dangerLevel === 'CRITICAL' ? '#ef4444' : dangerLevel === 'DANGER' ? '#f59e0b' : '#334155'}
            strokeWidth={dangerLevel === 'CRITICAL' ? '4' : '3'}
            className="transition-colors duration-200"
          />

          {/* Glossy highlight on bomb shoulder */}
          <ellipse
            cx="75"
            cy="95"
            rx="22"
            ry="11"
            fill="#ffffff"
            opacity="0.18"
            transform="rotate(-28 75 95)"
          />

          {/* Cartoon Character Face */}
          <g transform="translate(0, 0)">
            {/* EYES */}
            {/* Left Eye */}
            <ellipse
              cx="82"
              cy="118"
              rx={isExtremePanic ? '11' : isPanic ? '9' : '8'}
              ry={isExtremePanic ? '14' : isPanic ? '11' : '10'}
              fill="#ffffff"
            />
            {/* Left Pupil */}
            <circle
              cx={isExtremePanic ? '82' : isPanic ? '81' : '83'}
              cy={isExtremePanic ? '115' : isPanic ? '116' : '119'}
              r={isExtremePanic ? '4' : isPanic ? '4.5' : '4'}
              fill="#0f172a"
            />
            {/* Left Eye Shine */}
            <circle cx="80" cy="115" r="2" fill="#ffffff" />

            {/* Right Eye */}
            <ellipse
              cx="118"
              cy="118"
              rx={isExtremePanic ? '11' : isPanic ? '9' : '8'}
              ry={isExtremePanic ? '14' : isPanic ? '11' : '10'}
              fill="#ffffff"
            />
            {/* Right Pupil */}
            <circle
              cx={isExtremePanic ? '118' : isPanic ? '117' : '119'}
              cy={isExtremePanic ? '115' : isPanic ? '116' : '119'}
              r={isExtremePanic ? '4' : isPanic ? '4.5' : '4'}
              fill="#0f172a"
            />
            {/* Right Eye Shine */}
            <circle cx="116" cy="115" r="2" fill="#ffffff" />

            {/* Eyebrows */}
            {isExtremePanic ? (
              <>
                <path d="M 74 102 Q 82 108 90 105" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
                <path d="M 110 105 Q 118 108 126 102" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
              </>
            ) : isPanic ? (
              <>
                <path d="M 74 104 Q 82 109 90 106" fill="none" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 110 106 Q 118 109 126 104" fill="none" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
              </>
            ) : (
              <>
                <path d="M 75 106 Q 82 102 89 106" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
                <path d="M 111 106 Q 118 102 125 106" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
              </>
            )}

            {/* MOUTH */}
            {isExtremePanic ? (
              /* Wide open screaming mouth with teeth */
              <path
                d="M 85 140 Q 100 162 115 140 Z"
                fill="#e11d48"
                stroke="#ffffff"
                strokeWidth="2"
              />
            ) : isPanic ? (
              /* Wobbly nervous wavy mouth */
              <path
                d="M 86 142 Q 93 148 100 142 Q 107 136 114 142"
                fill="none"
                stroke="#ffffff"
                strokeWidth="3"
                strokeLinecap="round"
              />
            ) : (
              /* Calm cute mouth */
              <path
                d="M 92 138 Q 100 146 108 138"
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            )}

            {/* SWEAT DROPS when in danger */}
            {isWinkOrSweat && (
              <path
                d="M 132 105 C 130 108, 128 114, 131 117 C 134 120, 138 118, 138 114 C 138 111, 135 106, 132 105 Z"
                fill="#38bdf8"
                opacity="0.9"
                className="animate-bounce"
              />
            )}
            {isExtremePanic && (
              <path
                d="M 64 108 C 62 111, 60 117, 63 120 C 66 123, 70 121, 70 117 C 70 114, 67 109, 64 108 Z"
                fill="#38bdf8"
                opacity="0.9"
                className="animate-bounce"
              />
            )}
          </g>

          {/* BURNING FUSE SPARK AND FLAME */}
          <g transform={`translate(${sparkPosition.x}, ${sparkPosition.y})`} filter="url(#glowEffect)">
            {/* Outer flame glow */}
            <circle cx="0" cy="0" r={isExtremePanic ? '18' : isPanic ? '14' : '10'} fill="url(#fuseGlowGradient)" />

            {/* Core bright flame */}
            <circle
              cx="0"
              cy="0"
              r={isExtremePanic ? '8' : '6'}
              fill="#fbbf24"
              className="animate-ping"
            />
            <circle cx="0" cy="0" r="4" fill="#ffffff" />

            {/* Radiating Spark Lines */}
            <line x1="-6" y1="-8" x2="-14" y2="-16" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
            <line x1="6" y1="-8" x2="14" y2="-16" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" />
            <line x1="-10" y1="2" x2="-18" y2="4" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="10" y1="2" x2="18" y2="4" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="0" y1="-10" x2="0" y2="-20" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />

            {/* Extra sparks for Danger / Critical */}
            {(isPanic || isExtremePanic) && (
              <>
                <line x1="-8" y1="-14" x2="-16" y2="-24" stroke="#fbbf24" strokeWidth="1.5" />
                <line x1="8" y1="-14" x2="16" y2="-24" stroke="#f59e0b" strokeWidth="1.5" />
                <circle cx="-12" cy="-10" r="1.5" fill="#fef08a" />
                <circle cx="12" cy="-12" r="1.5" fill="#fef08a" />
                <circle cx="0" cy="-15" r="2" fill="#ffffff" />
              </>
            )}
          </g>

          {/* SMOKE PUFFS */}
          <g transform={`translate(${sparkPosition.x}, ${sparkPosition.y - 12})`}>
            <circle cx="-4" cy="-10" r={isPanic ? '8' : '5'} fill="#94a3b8" opacity="0.35" />
            <circle cx="6" cy="-16" r={isExtremePanic ? '11' : '6'} fill="#64748b" opacity="0.25" />
            {isExtremePanic && (
              <circle cx="-2" cy="-24" r="14" fill="#475569" opacity="0.3" />
            )}
          </g>
        </svg>

        {/* Speed Multiplier Badge */}
        {speedMultiplier > 1.0 && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg flex items-center gap-1 border-2 border-amber-300 animate-pulse whitespace-nowrap">
            <span>⚡ Mecha x{speedMultiplier.toFixed(2).replace('.', ',')}</span>
          </div>
        )}
      </div>

      {/* Danger Level Text Pill (Visual hint without numbers) */}
      <div className="mt-3 flex items-center gap-2">
        <span
          className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider transition-colors duration-300 shadow-md ${
            dangerLevel === 'CRITICAL'
              ? 'bg-rose-600/90 text-white animate-pulse'
              : dangerLevel === 'DANGER'
              ? 'bg-orange-500/90 text-slate-950'
              : dangerLevel === 'MIDDLE'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'bg-slate-800/80 text-slate-300 border border-slate-700'
          }`}
        >
          {dangerLevel === 'CRITICAL'
            ? '🔥 ¡PELIGRO INMINENTE!'
            : dangerLevel === 'DANGER'
            ? '⚠️ ¡Mecha corta!'
            : dangerLevel === 'MIDDLE'
            ? '⏳ Quemando mecha'
            : '💣 Mecha activa'}
        </span>
      </div>
    </div>
  );
};
