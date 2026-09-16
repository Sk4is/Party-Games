import React, { useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Player } from '../types';
import { Skull, Zap } from 'lucide-react';

interface PlayerRingProps {
  players: Player[];
  activePlayerIndex: number;
  currentTypingWord?: string;
  maxLives?: number;
  allowedMistakesPerRound?: number;
}

export const PlayerRing: React.FC<PlayerRingProps> = ({
  players,
  activePlayerIndex,
  currentTypingWord,
  maxLives = 3,
  allowedMistakesPerRound = 3,
}) => {
  const totalPlayers = players.length;

  // Calculate angle for each player in radial layout
  // 2 players: 180° (left) and 0° (right)
  // 4 players: 45°, 135°, 225°, 315° (diagonal corners) so top & bottom remain clear
  // 3+ players: start at -90° (top: 12 o'clock) proceeding clockwise
  const playerAngles = useMemo(() => {
    const startAngle = totalPlayers === 2 ? 0 : totalPlayers === 4 ? 45 : -90;
    const step = 360 / totalPlayers;
    return players.map((_, idx) => startAngle + idx * step);
  }, [totalPlayers, players]);

  // Elliptical radii for player card positions around the central bomb
  // Generous spacing to guarantee visible gaps: BOMB -> GAP -> ARROW -> GAP -> CARD
  const radiusX = totalPlayers <= 4 ? 325 : totalPlayers <= 6 ? 355 : 390;
  const radiusY = totalPlayers <= 4 ? 200 : totalPlayers <= 6 ? 210 : 220;

  // Active player card center position
  const activeAngleDeg = playerAngles[activePlayerIndex] ?? 0;
  const activeAngleRad = (activeAngleDeg * Math.PI) / 180;

  const activeCardX = Math.round(Math.cos(activeAngleRad) * radiusX);
  const activeCardY = Math.round(Math.sin(activeAngleRad) * radiusY);

  // Direction and distance from arena center (0, 0) to active player card
  const distToPlayer = Math.hypot(activeCardX, activeCardY);
  const angleToPlayerRad = Math.atan2(activeCardY, activeCardX);
  const angleToPlayerDeg = (angleToPlayerRad * 180) / Math.PI;

  // Card rectangular boundary calculation:
  // Card dimensions: ~196px width, ~116px height (half-width: 98px, half-height: 58px)
  const cosA = Math.abs(Math.cos(angleToPlayerRad)) || 0.001;
  const sinA = Math.abs(Math.sin(angleToPlayerRad)) || 0.001;
  const cardBorderOffset = Math.min(98 / cosA, 58 / sinA);
  const playerCardEdgeDist = distToPlayer - cardBorderOffset;

  // Bomb visual boundary radius (bomb body ~52px + rim = ~55px)
  const bombOuterEdgeDist = 55;

  // Arrow size: 56px long (25% smaller than original 76px), 28px tall
  // Half-length = 28px. Arrow tip is at front (+28px), animation travel is +5px max.
  // Maximum tip reach from arrow center = 28 + 5 = 33px.
  // We strictly enforce at least a 22px visible gap between arrow tip and card border!
  const safetyGapBeforeCard = 22;
  const maxArrowDist = playerCardEdgeDist - safetyGapBeforeCard - 33;
  const minArrowDist = bombOuterEdgeDist + 28 + 14; // At least 14px clear from bomb

  // Position arrow cleanly in the clear space between bomb and player card
  const naturalGapCenter = bombOuterEdgeDist + (playerCardEdgeDist - bombOuterEdgeDist) * 0.52;
  const finalArrowDist = Math.max(
    minArrowDist,
    Math.min(maxArrowDist, naturalGapCenter)
  );

  // Arrow center coordinates relative to arena center (50%, 50%)
  const arrowX = Math.round(Math.cos(angleToPlayerRad) * finalArrowDist);
  const arrowY = Math.round(Math.sin(angleToPlayerRad) * finalArrowDist);

  // Smooth shortest-arc rotation angle to prevent awkward 360 spins
  const lastAngleRef = useRef<number>(angleToPlayerDeg);
  const smoothAngleDeg = useMemo(() => {
    const prev = lastAngleRef.current;
    let diff = (angleToPlayerDeg - prev) % 360;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    const next = prev + diff;
    lastAngleRef.current = next;
    return next;
  }, [angleToPlayerDeg]);

  // Render lives according to configured maxLives
  const renderLives = (lives: number, isEliminated: boolean) => {
    if (isEliminated) {
      return (
        <div className="flex gap-0.5 text-slate-600 text-xs">
          {Array.from({ length: maxLives }).map((_, i) => (
            <span key={i}>🖤</span>
          ))}
        </div>
      );
    }
    return (
      <div className="flex gap-0.5">
        {Array.from({ length: maxLives }).map((_, i) => (
          <span
            key={i}
            className={`transition-all duration-300 text-xs sm:text-sm ${
              i < lives
                ? 'text-rose-500 scale-100'
                : 'text-slate-600 scale-90 grayscale'
            }`}
          >
            {i < lives ? '❤️' : '🖤'}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="relative w-full h-full min-h-[380px] sm:min-h-[440px] md:min-h-[480px] lg:min-h-[500px] flex items-center justify-center">
      {/* ==================================================================== */}
      {/* CENTRAL ROTATING ARROW POINTING TO ACTIVE PLAYER (Desktop & Tablet)  */}
      {/* Sits strictly in the empty space between the bomb and active player */}
      {/* ==================================================================== */}
      <div
        className="absolute z-20 pointer-events-none hidden md:block transition-all duration-300 ease-out"
        style={{
          top: `calc(50% + ${arrowY}px)`,
          left: `calc(50% + ${arrowX}px)`,
          transform: `translate(-50%, -50%) rotate(${smoothAngleDeg}deg)`,
        }}
        aria-hidden="true"
      >
        <motion.div
          className="flex items-center justify-center"
          animate={{
            x: [0, 5, 0],
          }}
          transition={{
            duration: 0.85,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <svg
            width="56"
            height="28"
            viewBox="0 0 56 28"
            fill="none"
            className="overflow-visible filter drop-shadow-[0_0_14px_rgba(245,158,11,0.9)] drop-shadow-[0_0_24px_rgba(234,88,12,0.65)]"
          >
            <defs>
              <linearGradient id="arcadeArrowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ea580c" />
                <stop offset="35%" stopColor="#f59e0b" />
                <stop offset="85%" stopColor="#fde047" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>
              <linearGradient id="arcadeArrowBorder" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7c2d12" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>
            </defs>

            {/* Outer Glow Halo */}
            <path
              d="M 4,10 L 28,10 L 28,4 L 53,14 L 28,24 L 28,18 L 4,18 L 9,14 Z"
              fill="url(#arcadeArrowGrad)"
              opacity="0.4"
              className="animate-pulse"
            />

            {/* Main Chunky Arcade Arrow Body */}
            <path
              d="M 4,10 L 28,10 L 28,4 L 53,14 L 28,24 L 28,18 L 4,18 L 9,14 Z"
              fill="url(#arcadeArrowGrad)"
              stroke="url(#arcadeArrowBorder)"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Top Specular Highlight */}
            <path
              d="M 10,11 L 28,11 L 28,7 L 47,14 L 28,16 L 28,14 L 10,14 Z"
              fill="#ffffff"
              opacity="0.65"
            />

            {/* Inner Energy Chevrons */}
            <path
              d="M 17,11 L 22,14 L 17,17"
              stroke="#7c2d12"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.85"
            />
            <path
              d="M 24,11 L 29,14 L 24,17"
              stroke="#7c2d12"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.85"
            />
          </svg>
        </motion.div>
      </div>

      {/* RADIAL DESKTOP & TABLET LAYOUT (md and up) - Spacious, Elliptical distribution */}
      <div className="hidden md:block absolute inset-0">
        {players.map((player, index) => {
          const angleDeg = playerAngles[index];
          const angleRad = (angleDeg * Math.PI) / 180;

          const x = Math.round(Math.cos(angleRad) * radiusX);
          const y = Math.round(Math.sin(angleRad) * radiusY);

          const isActive = index === activePlayerIndex;

          return (
            <div
              key={player.id}
              id={`player-card-${player.id}`}
              className="absolute z-25 transition-all duration-300"
              style={{
                top: `calc(50% + ${y}px)`,
                left: `calc(50% + ${x}px)`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div
                className={`relative w-48 lg:w-52 p-3.5 rounded-2xl transition-all duration-300 select-none ${
                  player.isEliminated
                    ? 'burnt-effect border-2 border-amber-950/60 shadow-lg opacity-60'
                    : isActive
                    ? 'bg-slate-900/95 border-2 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.6)] ring-2 ring-amber-400/50 scale-105'
                    : 'bg-slate-900/85 border border-slate-700/80 shadow-md opacity-90 hover:opacity-100'
                }`}
              >
                {/* Active Player Glow indicator */}
                {isActive && !player.isEliminated && (
                  <div className="absolute -inset-1 rounded-2xl border-2 border-amber-400/60 animate-pulse pointer-events-none" />
                )}

                {/* Chamuscado / Eliminated badge */}
                {player.isEliminated && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-stone-900 border border-amber-800/80 text-orange-400 text-[10px] font-black tracking-wider uppercase flex items-center gap-1 shadow-md whitespace-nowrap">
                    <Skull className="w-3 h-3 text-orange-500" />
                    CHAMUSCADO
                  </div>
                )}

                {/* Player Header */}
                <div className="flex items-center gap-2">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-inner shrink-0 ${
                      player.isEliminated ? 'grayscale brightness-50' : ''
                    }`}
                    style={{ backgroundColor: player.color }}
                  >
                    {player.avatar}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`font-black truncate text-sm ${
                          player.isEliminated
                            ? 'text-stone-500 line-through'
                            : isActive
                            ? 'text-amber-300 font-display'
                            : 'text-slate-100 font-bold'
                        }`}
                      >
                        {player.name}
                      </span>
                    </div>

                    {/* Lives & Round mistakes */}
                    <div className="mt-0.5 flex items-center justify-between">
                      {renderLives(player.lives, player.isEliminated)}

                      <span className="text-[10px] font-bold text-slate-400">
                        {player.isEliminated ? 'RIP' : `Fallos: ${player.roundMistakes ?? 0}/${allowedMistakesPerRound}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dedicated Prominent Word Area */}
                <div
                  className={`mt-2.5 px-3 py-2 rounded-xl flex items-center justify-center text-center transition-all duration-200 min-h-[44px] ${
                    isActive && !player.isEliminated
                      ? 'bg-slate-950 border-2 border-amber-400/90 shadow-[inset_0_0_12px_rgba(245,158,11,0.3)]'
                      : 'bg-slate-950/90 border border-slate-700/80 shadow-inner'
                  }`}
                >
                  {isActive && !player.isEliminated && currentTypingWord && currentTypingWord.trim().length > 0 ? (
                    <div className="flex items-center justify-center gap-0.5 text-amber-300 font-display font-black text-sm lg:text-base tracking-wider drop-shadow-[0_0_8px_rgba(245,158,11,0.6)] truncate max-w-full">
                      <span className="truncate">{currentTypingWord.toUpperCase()}</span>
                      <span className="inline-block w-0.5 h-4 bg-amber-400 shrink-0 animate-pulse ml-0.5" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center truncate max-w-full">
                      <span
                        className={`font-display font-black text-sm lg:text-base tracking-wider truncate ${
                          player.lastValidWord
                            ? isActive
                              ? 'text-amber-200'
                              : 'text-slate-100'
                            : 'text-slate-600 font-normal'
                        }`}
                      >
                        {player.lastValidWord ? player.lastValidWord.toUpperCase() : '—'}
                      </span>
                      {isActive && !player.isEliminated && (!currentTypingWord || currentTypingWord.trim().length === 0) && (
                        <span className="inline-block w-0.5 h-4 bg-amber-400/80 shrink-0 animate-pulse ml-1" />
                      )}
                    </div>
                  )}
                </div>

                {/* Penalty Speed Multiplier Badge */}
                {!player.isEliminated && player.multiplier > 1.0 && (
                  <div className="mt-1.5 pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-black text-amber-400">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-amber-400 fill-current" />
                      Velocidad
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      ×{player.multiplier.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
