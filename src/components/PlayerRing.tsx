import React, { useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Player } from '../types';
import { Skull, Zap } from 'lucide-react';

interface PlayerRingProps {
  players: Player[];
  activePlayerIndex: number;
}

export const PlayerRing: React.FC<PlayerRingProps> = ({
  players,
  activePlayerIndex,
}) => {
  const totalPlayers = players.length;

  // Calculate angle for each player in radial layout
  // 2 players: 180° (left) and 0° (right)
  // 4 players: 45°, 135°, 225°, 315° (corners) so top (letters) and bottom (input) remain clear
  // 3+ players: start at -90° (top: 12 o'clock) proceeding clockwise
  const playerAngles = useMemo(() => {
    const startAngle = totalPlayers === 2 ? 0 : totalPlayers === 4 ? 45 : -90;
    const step = 360 / totalPlayers;
    return players.map((_, idx) => startAngle + idx * step);
  }, [totalPlayers, players]);

  // Elliptical radii for player card positions around the central bomb
  const radiusX = totalPlayers <= 4 ? 300 : totalPlayers <= 6 ? 340 : 380;
  const radiusY = totalPlayers <= 4 ? 175 : totalPlayers <= 6 ? 185 : 195;

  // Active player card center position
  const activeAngleDeg = playerAngles[activePlayerIndex] ?? 0;
  const activeAngleRad = (activeAngleDeg * Math.PI) / 180;

  const activeCardX = Math.round(Math.cos(activeAngleRad) * radiusX);
  const activeCardY = Math.round(Math.sin(activeAngleRad) * radiusY);

  // Direction and distance from bomb center (0, 0) to active player card (activeCardX, activeCardY)
  const distToPlayer = Math.hypot(activeCardX, activeCardY);
  const angleToPlayerRad = Math.atan2(activeCardY, activeCardX);
  const angleToPlayerDeg = (angleToPlayerRad * 180) / Math.PI;

  // Active player card inner border offset towards the bomb
  // Card dimensions: ~184px width, ~92px height (half-width: 92px, half-height: 46px)
  const cosA = Math.abs(Math.cos(angleToPlayerRad)) || 0.001;
  const sinA = Math.abs(Math.sin(angleToPlayerRad)) || 0.001;
  const cardBorderOffset = Math.min(92 / cosA, 46 / sinA);
  const playerInnerEdgeDist = distToPlayer - cardBorderOffset;

  // Bomb visual boundary radius (bomb body ~45px + fuse/spark margin = ~56px)
  const bombOuterEdgeDist = 56;
  const clearGap = Math.max(0, playerInnerEdgeDist - bombOuterEdgeDist);

  // Arrow size: 72px long (half-length = 36px), 36px tall
  // Position arrow ~58% of the distance into the clear gap towards the active player card
  const arrowTargetDist = bombOuterEdgeDist + clearGap * 0.58;

  // Enforce visible space: BOMB -> GAP -> ARROW -> GAP -> PLAYER CARD
  const minSafeDist = bombOuterEdgeDist + 36 + 18; // At least 18px clear from bomb
  const maxSafeDist = playerInnerEdgeDist - 36 - 18; // At least 18px clear from player card

  const finalArrowDist = maxSafeDist >= minSafeDist
    ? Math.max(minSafeDist, Math.min(maxSafeDist, arrowTargetDist))
    : (bombOuterEdgeDist + playerInnerEdgeDist) / 2;

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

  // Render lives as hearts
  const renderLives = (lives: number, isEliminated: boolean) => {
    if (isEliminated) {
      return (
        <div className="flex gap-1 text-slate-600 text-xs">
          <span>🖤</span>
          <span>🖤</span>
          <span>🖤</span>
        </div>
      );
    }
    const hearts = [];
    for (let i = 0; i < 3; i++) {
      hearts.push(
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
      );
    }
    return <div className="flex gap-1">{hearts}</div>;
  };

  return (
    <div className="relative w-full h-full min-h-[380px] sm:min-h-[440px] md:min-h-[480px] lg:min-h-[500px] flex items-center justify-center">
      {/* ==================================================================== */}
      {/* CENTRAL ROTATING ARROW POINTING TO ACTIVE PLAYER (Desktop & Tablet)  */}
      {/* 2.5x larger, arcade-style, glowing, positioned BETWEEN bomb & card   */}
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
            x: [0, 8, 0],
          }}
          transition={{
            duration: 0.85,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <svg
            width="72"
            height="36"
            viewBox="0 0 72 36"
            fill="none"
            className="overflow-visible filter drop-shadow-[0_0_16px_rgba(245,158,11,0.95)] drop-shadow-[0_0_24px_rgba(234,88,12,0.65)]"
          >
            <defs>
              <linearGradient id="arcadeArrowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ea580c" />
                <stop offset="40%" stopColor="#f59e0b" />
                <stop offset="85%" stopColor="#fde047" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>
              <linearGradient id="arcadeArrowBorder" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#9a3412" />
                <stop offset="50%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>
            </defs>

            {/* Pulsing Outer Glow Aura */}
            <path
              d="M 6,12 L 36,12 L 36,4 L 68,18 L 36,32 L 36,24 L 6,24 L 13,18 Z"
              fill="url(#arcadeArrowGrad)"
              opacity="0.4"
              className="animate-pulse"
            />

            {/* Main Chunky Arcade Arrow Body */}
            <path
              d="M 6,12 L 36,12 L 36,4 L 68,18 L 36,32 L 36,24 L 6,24 L 13,18 Z"
              fill="url(#arcadeArrowGrad)"
              stroke="url(#arcadeArrowBorder)"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Top Specular Highlight */}
            <path
              d="M 14,14 L 36,14 L 36,8 L 60,18 L 36,20 L 36,18 L 14,18 Z"
              fill="#ffffff"
              opacity="0.6"
            />

            {/* Inner Motion Energy Chevrons */}
            <path
              d="M 22,14 L 28,18 L 22,22"
              stroke="#7c2d12"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.75"
            />
            <path
              d="M 30,14 L 36,18 L 30,22"
              stroke="#7c2d12"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.75"
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
                className={`relative w-44 lg:w-48 p-3 rounded-2xl transition-all duration-300 select-none ${
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

                    {/* Lives & mistakes */}
                    <div className="mt-0.5 flex items-center justify-between">
                      {renderLives(player.lives, player.isEliminated)}

                      <span className="text-[10px] font-bold text-slate-400">
                        {player.isEliminated ? 'RIP' : `Fallos: ${player.mistakes}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Last Valid Word display with smooth replacement transition */}
                <div className="mt-2 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Última:</span>
                  <div className="relative overflow-hidden h-5 flex items-center justify-end">
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span
                        key={player.lastValidWord || 'none'}
                        initial={{ y: 8, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -8, opacity: 0 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        className={`font-black truncate max-w-[110px] ${
                          player.lastValidWord ? 'text-amber-300' : 'text-slate-600'
                        }`}
                        title={player.lastValidWord || undefined}
                      >
                        {player.lastValidWord ? player.lastValidWord : '—'}
                      </motion.span>
                    </AnimatePresence>
                  </div>
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
