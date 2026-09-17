import React, { useMemo, useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [arenaSize, setArenaSize] = useState({ width: 900, height: 450 });

  // Responsive arena measurement
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          setArenaSize({ width: rect.width, height: rect.height });
        }
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Card dimensions based on player count
  const isCompact = totalPlayers >= 7;
  const cardHalfW = isCompact ? 78 : 96;
  const cardHalfH = isCompact ? 46 : 54;

  // Exact angles specification:
  // 2 players: 180° (Left) and 0° (Right) - perfectly opposite
  // 3 players: -90° (Top), 30° (Bottom-Right), 150° (Bottom-Left) - balanced triangle
  // 4 players: -90° (Top), 0° (Right), 90° (Bottom), 180° (Left) - balanced diamond
  // 5+ players: evenly distributed starting at -90° (Top)
  const playerAngles = useMemo(() => {
    if (totalPlayers === 2) {
      return [180, 0];
    }
    if (totalPlayers === 3) {
      return [-90, 30, 150];
    }
    if (totalPlayers === 4) {
      return [-90, 0, 90, 180];
    }
    const startAngle = -90;
    const step = 360 / totalPlayers;
    return players.map((_, idx) => startAngle + idx * step);
  }, [totalPlayers, players]);

  // Dynamic elliptical orbital radii based on container size and player count
  const { radiusX, radiusY } = useMemo(() => {
    const maxRadiusX = Math.max(200, arenaSize.width / 2 - cardHalfW - 14);
    const maxRadiusY = Math.max(120, arenaSize.height / 2 - cardHalfH - 12);

    if (totalPlayers === 2) {
      // 2 players only need horizontal distance, vertical offset is 0
      const rX = Math.min(maxRadiusX, Math.max(240, arenaSize.width * 0.33));
      return { radiusX: rX, radiusY: 0 };
    }

    let baseTargetX = totalPlayers <= 4 ? 280 : totalPlayers <= 6 ? 320 : 360;
    let baseTargetY = totalPlayers <= 4 ? 145 : totalPlayers <= 6 ? 160 : 175;

    const rX = Math.min(maxRadiusX, Math.max(220, Math.min(baseTargetX, arenaSize.width * 0.35)));
    const rY = Math.min(maxRadiusY, Math.max(130, Math.min(baseTargetY, arenaSize.height * 0.36)));

    return { radiusX: rX, radiusY: rY };
  }, [totalPlayers, arenaSize, cardHalfW, cardHalfH]);

  // Active player center position
  const safeActiveIndex = activePlayerIndex >= 0 && activePlayerIndex < totalPlayers ? activePlayerIndex : 0;
  const activeAngleDeg = playerAngles[safeActiveIndex] ?? 0;
  const activeAngleRad = (activeAngleDeg * Math.PI) / 180;

  const activeCardX = Math.round(Math.cos(activeAngleRad) * radiusX);
  const activeCardY = Math.round(Math.sin(activeAngleRad) * radiusY);

  // Direction and distance from arena center (0, 0) to active player card
  const distToPlayer = Math.hypot(activeCardX, activeCardY) || 1;
  const angleToPlayerRad = Math.atan2(activeCardY, activeCardX);
  const angleToPlayerDeg = (angleToPlayerRad * 180) / Math.PI;

  // Card rectangular boundary calculation to prevent arrow from entering card:
  const cosA = Math.abs(Math.cos(angleToPlayerRad)) || 0.001;
  const sinA = Math.abs(Math.sin(angleToPlayerRad)) || 0.001;
  const cardBorderOffset = Math.min(cardHalfW / cosA, cardHalfH / sinA);
  const playerCardEdgeDist = distToPlayer - cardBorderOffset;

  // Bomb visual boundary radius (~52px)
  const bombOuterEdgeDist = 52;

  // Arrow size: 48px long, 24px tall
  const arrowHalfLength = 24;
  const arrowTipReach = arrowHalfLength + 4; // animation motion travel
  const safetyGapBeforeCard = 14; // 14px breathing room before card border

  const maxArrowCenterDist = playerCardEdgeDist - safetyGapBeforeCard - arrowTipReach;
  const minArrowCenterDist = bombOuterEdgeDist + 12 + arrowHalfLength;

  // Position arrow cleanly in the space between bomb and player card
  const idealGapCenter = bombOuterEdgeDist + (playerCardEdgeDist - bombOuterEdgeDist) * 0.5;
  const finalArrowDist = Math.max(minArrowCenterDist, Math.min(maxArrowCenterDist, idealGapCenter));

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
              i < lives ? 'text-rose-500 scale-100' : 'text-slate-600 scale-90 grayscale'
            }`}
          >
            {i < lives ? '❤️' : '🖤'}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      id="player-orbital-ring"
      className="absolute inset-0 w-full h-full pointer-events-none flex items-center justify-center overflow-visible"
    >
      {/* ==================================================================== */}
      {/* TURN ARROW (BETWEEN BOMB AND ACTIVE PLAYER)                          */}
      {/* ==================================================================== */}
      <div
        id="turn-indicator-arrow"
        className="absolute z-20 pointer-events-none transition-all duration-300 ease-out"
        style={{
          top: `calc(50% + ${arrowY}px)`,
          left: `calc(50% + ${arrowX}px)`,
          transform: `translate(-50%, -50%) rotate(${smoothAngleDeg}deg)`,
        }}
        aria-hidden="true"
      >
        <motion.div
          className="flex items-center justify-center"
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg
            width="48"
            height="24"
            viewBox="0 0 48 24"
            fill="none"
            className="overflow-visible filter drop-shadow-[0_0_12px_rgba(245,158,11,0.85)] drop-shadow-[0_0_20px_rgba(234,88,12,0.6)]"
          >
            <defs>
              <linearGradient id="bombaArrowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ea580c" />
                <stop offset="35%" stopColor="#f59e0b" />
                <stop offset="85%" stopColor="#fde047" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>
              <linearGradient id="bombaArrowBorder" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7c2d12" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>
            </defs>

            {/* Glowing Arrow Path */}
            <path
              d="M 4,8 L 24,8 L 24,3 L 45,12 L 24,21 L 24,16 L 4,16 L 8,12 Z"
              fill="url(#bombaArrowGrad)"
              stroke="url(#bombaArrowBorder)"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {/* Top Shine */}
            <path
              d="M 8,9 L 24,9 L 24,6 L 40,12 L 24,14 L 24,12 L 8,12 Z"
              fill="#ffffff"
              opacity="0.65"
            />
          </svg>
        </motion.div>
      </div>

      {/* ==================================================================== */}
      {/* RADIAL PLAYER CARDS AROUND BOMB                                     */}
      {/* ==================================================================== */}
      <div className="absolute inset-0">
        {players.map((player, index) => {
          const angleDeg = playerAngles[index] ?? 0;
          const angleRad = (angleDeg * Math.PI) / 180;

          const x = Math.round(Math.cos(angleRad) * radiusX);
          const y = Math.round(Math.sin(angleRad) * radiusY);
          const isActive = index === activePlayerIndex;

          return (
            <div
              key={player.id}
              id={`player-card-${player.id}`}
              className="absolute z-25 pointer-events-auto transition-all duration-300"
              style={{
                top: `calc(50% + ${y}px)`,
                left: `calc(50% + ${x}px)`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div
                className={`relative rounded-2xl transition-all duration-300 select-none ${
                  isCompact ? 'w-42 lg:w-46 p-2.5' : 'w-48 lg:w-52 p-3.5'
                } ${
                  player.isEliminated
                    ? 'burnt-effect border-2 border-amber-950/60 shadow-lg opacity-60'
                    : isActive
                    ? 'bg-slate-900/95 border-2 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.55)] ring-2 ring-amber-400/50 scale-105'
                    : 'bg-slate-900/85 border border-slate-700/80 shadow-md opacity-90 hover:opacity-100'
                }`}
              >
                {/* Active Player Halo */}
                {isActive && !player.isEliminated && (
                  <div className="absolute -inset-1 rounded-2xl border-2 border-amber-400/50 animate-pulse pointer-events-none" />
                )}

                {/* Chamuscado / Eliminated badge */}
                {player.isEliminated && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-stone-900 border border-amber-800/80 text-orange-400 text-[9px] font-black tracking-wider uppercase flex items-center gap-1 shadow-md whitespace-nowrap">
                    <Skull className="w-3 h-3 text-orange-500" />
                    CHAMUSCADO
                  </div>
                )}

                {/* Player Header */}
                <div className="flex items-center gap-2">
                  <div
                    className={`${
                      isCompact ? 'w-8 h-8 text-base' : 'w-9 h-9 text-lg'
                    } rounded-xl flex items-center justify-center shadow-inner shrink-0 ${
                      player.isEliminated ? 'grayscale brightness-50' : ''
                    }`}
                    style={{ backgroundColor: player.color }}
                  >
                    {player.avatar}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`font-black truncate ${
                          isCompact ? 'text-xs' : 'text-sm'
                        } ${
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

                    {/* Lives & Mistakes */}
                    <div className="mt-0.5 flex items-center justify-between">
                      {renderLives(player.lives, player.isEliminated)}
                      <span className="text-[10px] font-bold text-slate-400">
                        {player.isEliminated
                          ? 'RIP'
                          : `Fallos: ${player.roundMistakes ?? 0}/${allowedMistakesPerRound}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Prominent Word Area / Live Typing */}
                <div
                  className={`mt-2 px-2.5 py-1.5 rounded-xl flex items-center justify-center text-center transition-all duration-200 min-h-[40px] ${
                    isActive && !player.isEliminated
                      ? 'bg-slate-950 border-2 border-amber-400/90 shadow-[inset_0_0_12px_rgba(245,158,11,0.3)]'
                      : 'bg-slate-950/90 border border-slate-700/80 shadow-inner'
                  }`}
                >
                  {isActive && !player.isEliminated && currentTypingWord && currentTypingWord.trim().length > 0 ? (
                    <div className="flex items-center justify-center gap-0.5 text-amber-300 font-display font-black text-xs sm:text-sm lg:text-base tracking-wider drop-shadow-[0_0_8px_rgba(245,158,11,0.6)] truncate max-w-full">
                      <span className="truncate">{currentTypingWord.toUpperCase()}</span>
                      <span className="inline-block w-0.5 h-3.5 bg-amber-400 shrink-0 animate-pulse ml-0.5" />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center truncate max-w-full leading-tight">
                      {player.lastValidWord ? (
                        <>
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                            ÚLTIMA
                          </span>
                          <span
                            className={`font-display font-black text-xs sm:text-sm tracking-wider truncate ${
                              isActive ? 'text-amber-200' : 'text-slate-200'
                            }`}
                          >
                            {player.lastValidWord.toUpperCase()}
                          </span>
                        </>
                      ) : (
                        <div className="flex items-center">
                          <span className="text-slate-600 font-bold text-xs">—</span>
                          {isActive && !player.isEliminated && (
                            <span className="inline-block w-0.5 h-3.5 bg-amber-400/80 shrink-0 animate-pulse ml-1" />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Speed Multiplier Penalty */}
                {!player.isEliminated && player.multiplier > 1.0 && (
                  <div className="mt-1 pt-0.5 border-t border-slate-800/80 flex items-center justify-between text-[9px] font-black text-amber-400">
                    <span className="flex items-center gap-0.5">
                      <Zap className="w-2.5 h-2.5 text-amber-400 fill-current" />
                      Velocidad
                    </span>
                    <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
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
