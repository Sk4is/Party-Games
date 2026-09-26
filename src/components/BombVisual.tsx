import React, { useMemo } from 'react';
import { BombDangerLevel } from '../types';

interface BombVisualProps {
  progress: number; // 0 (start, full fuse) to 1.0 (empty fuse, explosion imminent)
  dangerLevel: BombDangerLevel;
  speedMultiplier: number;
}

/**
 * Single, unified cartoon fuse curve geometry:
 * 
 *          🔥  ← Single burning point at (sparkX, sparkY)
 *         ╭
 *        ╯
 *       ╱
 *      ●   ← Metallic fuse socket at top of bomb (100, 73)
 *     💣   ← Bomb sphere body centered at (100, 135)
 * 
 * Base Cubic Bezier:
 * P0 = (100, 74)  - anchored directly inside the metallic socket hole
 * P1 = (120, 56)  - curves naturally up and to the right (╱)
 * P2 = (84, 34)   - curves back to the left (╯)
 * P3 = (96, 14)   - top tip rounding up with the flame (╭)
 * 
 * As progress goes from 0 to 1, de Casteljau's algorithm calculates the exact remaining
 * sub-curve from P0 to (sparkX, sparkY). The remaining fuse stroke and the burning flame
 * are guaranteed to share the exact same endpoint at every single frame.
 */
const P0 = { x: 100, y: 74 };
const P1 = { x: 120, y: 56 };
const P2 = { x: 84, y: 34 };
const P3 = { x: 96, y: 14 };

export const BombVisual: React.FC<BombVisualProps> = ({
  progress,
  dangerLevel,
  speedMultiplier,
}) => {
  // Clamp progress strictly between 0.0 and 1.0
  const clampedProgress = Math.max(0, Math.min(1.0, progress));

  // t: 1 = start (full fuse, flame at tip P3), 0 = expired (flame reaches socket P0)
  const t = 1 - clampedProgress;
  const mt = 1 - t;

  // Exact endpoint of the remaining fuse via cubic bezier formula:
  const sparkX = mt * mt * mt * P0.x + 3 * mt * mt * t * P1.x + 3 * mt * t * t * P2.x + t * t * t * P3.x;
  const sparkY = mt * mt * mt * P0.y + 3 * mt * mt * t * P1.y + 3 * mt * t * t * P2.y + t * t * t * P3.y;

  // De Casteljau sub-curve control points for the remaining fuse from P0 to (sparkX, sparkY):
  const q1 = {
    x: mt * P0.x + t * P1.x,
    y: mt * P0.y + t * P1.y,
  };
  const q2 = {
    x: mt * mt * P0.x + 2 * mt * t * P1.x + t * t * P2.x,
    y: mt * mt * P0.y + 2 * mt * t * P1.y + t * t * P2.y,
  };

  // Remaining fuse path string:
  const remainingFuseD = `M ${P0.x} ${P0.y} C ${q1.x.toFixed(2)} ${q1.y.toFixed(2)}, ${q2.x.toFixed(2)} ${q2.y.toFixed(2)}, ${sparkX.toFixed(2)} ${sparkY.toFixed(2)}`;
  const fullGuidePathD = `M ${P0.x} ${P0.y} C ${P1.x} ${P1.y}, ${P2.x} ${P2.y}, ${P3.x} ${P3.y}`;

  // Shake animation class on the parent unit:
  const shakeClass = useMemo(() => {
    switch (dangerLevel) {
      case 'CRITICAL':
        return 'animate-critical-shake';
      case 'DANGER':
        return 'animate-danger-wobble';
      case 'MIDDLE':
      case 'EARLY':
      default:
        return 'animate-gentle-float';
    }
  }, [dangerLevel]);

  // Facial state helpers:
  const isWinkOrSweat = dangerLevel === 'MIDDLE' || dangerLevel === 'DANGER' || dangerLevel === 'CRITICAL';
  const isPanic = dangerLevel === 'DANGER' || dangerLevel === 'CRITICAL';
  const isExtremePanic = dangerLevel === 'CRITICAL';

  // Dynamic animation styling that speeds up with player mistake multiplier
  const shakeStyle = useMemo(() => {
    if (speedMultiplier > 1.0) {
      const baseDuration = dangerLevel === 'CRITICAL' ? 0.12 : dangerLevel === 'DANGER' ? 0.25 : 0.45;
      return {
        animationDuration: `${(baseDuration / Math.sqrt(speedMultiplier)).toFixed(3)}s`,
      };
    }
    return undefined;
  }, [dangerLevel, speedMultiplier]);

  return (
    <div className="relative flex flex-col items-center justify-center select-none pointer-events-none">
      {/* Outer pulsating danger aura */}
      {dangerLevel === 'CRITICAL' && (
        <div className="absolute inset-0 -m-8 md:-m-12 xl:-m-14 rounded-full bg-rose-600/30 blur-2xl animate-ping pointer-events-none" />
      )}
      {dangerLevel === 'DANGER' && (
        <div className="absolute inset-0 -m-6 md:-m-10 xl:-m-12 rounded-full bg-amber-500/20 blur-xl animate-pulse pointer-events-none" />
      )}

      {/* 
        MAIN BOMB CONTAINER:
        The Bomb, the Socket, the Fuse, and the Flame are all inside this SAME container.
        When this container shakes or wobbles, everything moves together as ONE connected object.
        Mobile (< 768px): w-28 h-28 sm:w-32 sm:h-32 (unchanged).
        Desktop (>= 768px): scales substantially (1.4x - 1.78x) across breakpoints.
      */}
      <div
        id="bomb-interactive-unit"
        className={`relative w-28 h-28 sm:w-32 sm:h-32 md:w-44 md:h-44 lg:w-52 lg:h-52 xl:w-60 xl:h-60 2xl:w-64 2xl:h-64 transition-transform duration-75 ${shakeClass}`}
        style={shakeStyle}
      >
        <svg
          viewBox="0 0 200 200"
          className="w-full h-full drop-shadow-2xl overflow-visible"
        >
          <defs>
            {/* Bomb 3D Sphere Body Gradient */}
            <radialGradient id="bombBodyGradient" cx="35%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="35%" stopColor="#1e293b" />
              <stop offset="85%" stopColor="#0f172a" />
              <stop offset="100%" stopColor="#020617" />
            </radialGradient>

            {/* Metallic Socket Collar Gradient */}
            <linearGradient id="metallicCollarGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#475569" />
              <stop offset="35%" stopColor="#94a3b8" />
              <stop offset="70%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#334155" />
            </linearGradient>

            {/* Fuse Burning Glow Gradient */}
            <radialGradient id="fuseGlowGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fef08a" stopOpacity="1" />
              <stop offset="40%" stopColor="#f97316" stopOpacity="0.85" />
              <stop offset="80%" stopColor="#ef4444" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>

            {/* Flame Teardrop Gradient */}
            <linearGradient id="flameTeardropGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#ea580c" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="90%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>
          </defs>

          {/* ================================================================= */}
          {/* 1. FAINT ASH / CHARRED TRAIL (Where the fuse has burned)          */}
          {/* ================================================================= */}
          <path
            d={fullGuidePathD}
            fill="none"
            stroke="#261c16"
            strokeWidth="4"
            strokeDasharray="2 3"
            opacity="0.25"
            strokeLinecap="round"
          />

          {/* ================================================================= */}
          {/* 2. REMAINING ACTIVE FUSE ROPE                                     */}
          {/* Emerges from socket P0(100, 74) and ends at (sparkX, sparkY)       */}
          {/* ================================================================= */}
          {t > 0.01 && (
            <>
              {/* Outer rope body */}
              <path
                d={remainingFuseD}
                fill="none"
                stroke="#92400e"
                strokeWidth="5.5"
                strokeLinecap="round"
              />

              {/* Inner warm braided rope texture */}
              <path
                d={remainingFuseD}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="3.2"
                strokeLinecap="round"
              />

              {/* Center golden thread */}
              <path
                d={remainingFuseD}
                fill="none"
                stroke="#fde68a"
                strokeWidth="1.2"
                strokeLinecap="round"
                opacity="0.9"
              />
            </>
          )}

          {/* ================================================================= */}
          {/* 3. BOMB METALLIC COLLAR & SOCKET [●]                              */}
          {/* Inserted into top of bomb; fuse physically emerges from this hole  */}
          {/* ================================================================= */}
          {/* Metallic Collar Base */}
          <rect
            x="88"
            y="72"
            width="24"
            height="15"
            rx="4"
            fill="url(#metallicCollarGrad)"
            stroke="#1e293b"
            strokeWidth="2"
          />

          {/* Collar Rim Highlight */}
          <line
            x1="90"
            y1="74"
            x2="110"
            y2="74"
            stroke="#ffffff"
            strokeWidth="1"
            opacity="0.75"
            strokeLinecap="round"
          />

          {/* Dark Socket Hole [●] where the fuse physically enters */}
          <ellipse
            cx="100"
            cy="73"
            rx="6.5"
            ry="2.8"
            fill="#090d16"
            stroke="#334155"
            strokeWidth="1.2"
          />

          {/* ================================================================= */}
          {/* 4. MAIN BOMB BODY SPHERE 💣                                       */}
          {/* ================================================================= */}
          <circle
            cx="100"
            cy="135"
            r="52"
            fill="url(#bombBodyGradient)"
            stroke={
              dangerLevel === 'CRITICAL'
                ? '#ef4444'
                : dangerLevel === 'DANGER'
                ? '#f59e0b'
                : '#334155'
            }
            strokeWidth={dangerLevel === 'CRITICAL' ? '4' : '3'}
            className="transition-colors duration-200"
          />

          {/* Glossy highlight on bomb shoulder */}
          <ellipse
            cx="78"
            cy="107"
            rx="16"
            ry="8"
            fill="#ffffff"
            opacity="0.18"
            transform="rotate(-28 78 107)"
          />

          {/* ================================================================= */}
          {/* 5. CARTOON CHARACTER FACE & EXPRESSIONS                           */}
          {/* ================================================================= */}
          <g transform="translate(0, 10)">
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
                <path
                  d="M 74 102 Q 82 108 90 105"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <path
                  d="M 110 105 Q 118 108 126 102"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </>
            ) : isPanic ? (
              <>
                <path
                  d="M 74 104 Q 82 109 90 106"
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M 110 106 Q 118 109 126 104"
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </>
            ) : (
              <>
                <path
                  d="M 75 106 Q 82 102 89 106"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M 111 106 Q 118 102 125 106"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </>
            )}

            {/* MOUTH */}
            {isExtremePanic ? (
              <path
                d="M 85 138 Q 100 160 115 138 Z"
                fill="#e11d48"
                stroke="#ffffff"
                strokeWidth="2"
              />
            ) : isPanic ? (
              <path
                d="M 86 140 Q 93 146 100 140 Q 107 134 114 140"
                fill="none"
                stroke="#ffffff"
                strokeWidth="3"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M 92 136 Q 100 144 108 136"
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            )}

            {/* Sweat Drops when in danger */}
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

          {/* ================================================================= */}
          {/* 6. THE SINGLE MAIN BURNING POINT (FLAME & EMBER) 🔥                */}
          {/* Positioned AT (sparkX, sparkY) - the literal endpoint of the fuse! */}
          {/* ================================================================= */}
          <g transform={`translate(${sparkX.toFixed(2)}, ${sparkY.toFixed(2)})`}>
            {/* Heat aura */}
            <circle
              cx="0"
              cy="0"
              r={isExtremePanic ? 14 : isPanic ? 11 : 8}
              fill="url(#fuseGlowGradient)"
              opacity="0.8"
            />

            {/* Glowing Teardrop Flame pointing straight upward */}
            <path
              d="M 0 1 C -3.5 -1, -4.5 -6, 0 -13 C 4.5 -6, 3.5 -1, 0 1 Z"
              fill="url(#flameTeardropGrad)"
              opacity="0.95"
            />

            {/* Hot Burnt Ember attached directly to rope end */}
            <circle cx="0" cy="0" r="4" fill="#f97316" />
            <circle cx="0" cy="0" r="2.4" fill="#fef08a" />
            <circle cx="0" cy="0" r="1.2" fill="#ffffff" />

            {/* Tiny spark crackles radiating strictly around the burning point */}
            <line x1="-2" y1="-2" x2="-5" y2="-5" stroke="#fbbf24" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="2" y1="-2" x2="5" y2="-5" stroke="#f59e0b" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="-3" y1="1" x2="-5" y2="2" stroke="#ef4444" strokeWidth="1" strokeLinecap="round" />
            <line x1="3" y1="1" x2="5" y2="2" stroke="#ef4444" strokeWidth="1" strokeLinecap="round" />
          </g>
        </svg>

        {/* Speed Multiplier Badge */}
        {speedMultiplier > 1.0 && (
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 md:px-4 md:py-1.5 rounded-full bg-amber-500 text-slate-950 font-black text-xs sm:text-sm md:text-sm xl:text-base shadow-lg flex items-center gap-1 border-2 border-amber-300 animate-pulse whitespace-nowrap z-20">
            <span>⚡ Velocidad ×{Math.round(speedMultiplier)}</span>
          </div>
        )}
      </div>

      {/* Danger Level Text Pill (Visual hint without numbers) */}
      <div className="mt-3 md:mt-4 xl:mt-5 flex items-center gap-2">
        <span
          className={`px-3 py-1 md:px-4 md:py-1.5 xl:px-5 xl:py-2 rounded-full text-xs md:text-xs lg:text-sm xl:text-[15px] font-black uppercase tracking-wider transition-colors duration-300 shadow-md ${
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
