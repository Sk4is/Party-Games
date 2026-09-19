import React, { useMemo, useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Player } from '../types';
import { Skull, Zap } from 'lucide-react';

interface PlayerRingProps {
  players: Player[];
  activePlayerIndex: number;
  activePlayerId?: string;
  currentTypingWord?: string;
  typingPlayerId?: string;
  maxLives?: number;
  allowedMistakesPerRound?: number;
}

export const PlayerRing: React.FC<PlayerRingProps> = ({
  players,
  activePlayerIndex,
  activePlayerId,
  currentTypingWord,
  typingPlayerId,
  maxLives = 3,
  allowedMistakesPerRound = 3,
}) => {
  const totalPlayers = players.length;
  const containerRef = useRef<HTMLDivElement>(null);
  const [arenaSize, setArenaSize] = useState({ width: 960, height: 500 });

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

  // Adaptive Card Sizing Tiers:
  // Tier 1 (2-4 players): Regular cards (width ~188px, height ~88px)
  // Tier 2 (5-7 players): Medium cards (width ~158px, height ~80px)
  // Tier 3 (8-10 players or constrained arena): Compact cards (width ~138px, height ~72px)
  const cardTier = useMemo<'regular' | 'medium' | 'compact'>(() => {
    if (totalPlayers >= 8 || arenaSize.height < 460 || arenaSize.width < 780) {
      return 'compact';
    }
    if (totalPlayers >= 5 || arenaSize.height < 520 || arenaSize.width < 900) {
      return 'medium';
    }
    return 'regular';
  }, [totalPlayers, arenaSize.height, arenaSize.width]);

  const cardHalfW = cardTier === 'regular' ? 94 : cardTier === 'medium' ? 79 : 69;
  const cardHalfH = cardTier === 'regular' ? 44 : cardTier === 'medium' ? 40 : 36;

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
    if (totalPlayers === 5) {
      return [-90, -18, 54, 126, 198];
    }
    if (totalPlayers === 6) {
      return [-90, -30, 30, 90, 150, 210];
    }
    const startAngle = -90;
    const step = 360 / totalPlayers;
    return players.map((_, idx) => startAngle + idx * step);
  }, [totalPlayers, players]);

  // Dynamic elliptical orbital radii calculation with strict BOMB SAFE ZONE protection:
  // Bomb body has outer radius ~52px; upward fuse + spark reaches y = -78px.
  // Minimum safe gap required: 45-70px free corridor between bomb outer edge and card edge.
  const { radiusX, radiusY } = useMemo(() => {
    const maxRadiusX = Math.max(180, arenaSize.width / 2 - cardHalfW - 14);
    const maxRadiusY = Math.max(140, arenaSize.height / 2 - cardHalfH - 12);

    if (totalPlayers === 2) {
      const rX = Math.min(maxRadiusX, Math.max(220, arenaSize.width * 0.32));
      return { radiusX: rX, radiusY: 0 };
    }

    // Minimum required radiusY to guarantee top player card never crowds bomb fuse:
    // Fuse top is at y = -78px. We want at least 50px of clear air + cardHalfH.
    const minSafeRadiusY = 78 + 50 + cardHalfH; // ~172px for compact, ~178px for regular

    let targetRadiusY = Math.max(minSafeRadiusY, arenaSize.height * 0.37);
    targetRadiusY = Math.min(maxRadiusY, targetRadiusY);

    let targetRadiusX = Math.max(250, arenaSize.width * 0.35);
    targetRadiusX = Math.min(maxRadiusX, targetRadiusX);

    return { radiusX: Math.round(targetRadiusX), radiusY: Math.round(targetRadiusY) };
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

  // Exact Card rectangular boundary intersection along ray:
  const cosA = Math.abs(Math.cos(angleToPlayerRad)) || 0.001;
  const sinA = Math.abs(Math.sin(angleToPlayerRad)) || 0.001;
  const cardBorderOffset = Math.min(cardHalfW / cosA, cardHalfH / sinA);
  const playerCardEdgeDist = distToPlayer - cardBorderOffset;

  // Bomb visual boundary:
  // If ray points upward towards the top player (sinA < 0 and angle near -90°), fuse extends to 78px.
  // Otherwise bomb sphere edge is 54px.
  const bombOuterEdgeDist = Math.sin(angleToPlayerRad) < -0.2 ? 78 : 54;

  // Available free corridor between bomb edge and card edge
  const availableCorridor = Math.max(16, playerCardEdgeDist - bombOuterEdgeDist);

  // Arrow geometry: adaptively sized to fit corridor without entering card or bomb
  // Guaranteed gap before card: 12px
  // Guaranteed gap after bomb: 10px
  const arrowLength = Math.max(18, Math.min(34, availableCorridor - 22));
  const arrowTipDist = playerCardEdgeDist - 12; // ALWAYS stops 12px before card border
  const arrowCenterDist = arrowTipDist - arrowLength / 2;

  const arrowX = Math.round(Math.cos(angleToPlayerRad) * arrowCenterDist);
  const arrowY = Math.round(Math.sin(angleToPlayerRad) * arrowCenterDist);

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
            className={`transition-all duration-300 text-xs ${
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
      {/* TURN ARROW (POSITIONED IN SAFE CORRIDOR BETWEEN BOMB AND ACTIVE CARD) */}
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
          animate={{ x: [0, 3, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg
            width={arrowLength + 4}
            height="18"
            viewBox="0 0 38 18"
            fill="none"
            className="overflow-visible filter drop-shadow-[0_0_10px_rgba(245,158,11,0.85)] drop-shadow-[0_0_16px_rgba(234,88,12,0.6)]"
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

            {/* Controlled Arrow Shape */}
            <path
              d="M 3,6 L 19,6 L 19,2 L 35,9 L 19,16 L 19,12 L 3,12 Z"
              fill="url(#bombaArrowGrad)"
              stroke="url(#bombaArrowBorder)"
              strokeWidth="1.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {/* Specular Highlight */}
            <path
              d="M 6,7 L 19,7 L 19,4.5 L 31,9 L 19,10.5 L 19,9 L 6,9 Z"
              fill="#ffffff"
              opacity="0.6"
            />
          </svg>
        </motion.div>
      </div>

      {/* ==================================================================== */}
      {/* RADIAL PLAYER CARDS AROUND BOMB                                      */}
      {/* ==================================================================== */}
      <div className="absolute inset-0">
        {players.map((player, index) => {
          const angleDeg = playerAngles[index] ?? 0;
          const angleRad = (angleDeg * Math.PI) / 180;

          const x = Math.round(Math.cos(angleRad) * radiusX);
          const y = Math.round(Math.sin(angleRad) * radiusY);
          const isActive = activePlayerId ? player.id === activePlayerId : index === activePlayerIndex;
          const typingWord =
            isActive && !player.isEliminated
              ? (typingPlayerId && typingPlayerId === player.id
                  ? currentTypingWord
                  : player.currentTypingWord) || ''
              : '';
          const hasTyping = typingWord.trim().length > 0;

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
                  cardTier === 'compact'
                    ? 'w-[138px] p-2'
                    : cardTier === 'medium'
                    ? 'w-[158px] p-2.5'
                    : 'w-[188px] p-3'
                } ${
                  player.isEliminated
                    ? 'burnt-effect border-2 border-amber-950/60 shadow-lg opacity-60'
                    : isActive
                    ? 'bg-slate-900/95 border-2 border-amber-400 shadow-[0_0_24px_rgba(245,158,11,0.55)] ring-2 ring-amber-400/50 scale-105'
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
                      cardTier === 'compact' ? 'w-7 h-7 text-sm' : 'w-8 h-8 text-base'
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
                        className={`font-display font-bold truncate ${
                          cardTier === 'compact' ? 'text-xs' : 'text-sm'
                        } ${
                          isActive && !player.isEliminated ? 'text-amber-300' : 'text-slate-100'
                        }`}
                        title={player.name}
                      >
                        {player.name}
                      </span>
                    </div>

                    {/* Lives and Mistakes */}
                    <div className="flex items-center justify-between gap-1 mt-0.5">
                      {renderLives(player.lives, player.isEliminated)}

                      {/* Mistakes / Fallos */}
                      {!player.isEliminated && (
                        <div className="flex items-center gap-0.5 text-[10px] font-bold text-slate-400">
                          <span className="text-[9px] uppercase tracking-wider text-slate-400">F:</span>
                          <span
                            className={`${
                              player.mistakesThisRound > 0
                                ? 'text-rose-400 font-extrabold'
                                : 'text-slate-400'
                            }`}
                          >
                            {player.mistakesThisRound}/{allowedMistakesPerRound}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dynamic Word Display Area */}
                <div className="mt-1.5 pt-1 border-t border-slate-800/80 min-h-[22px] flex items-center justify-center">
                  {hasTyping ? (
                    <div className="flex items-center justify-center gap-1 w-full bg-slate-950/60 rounded px-1.5 py-0.5 border border-amber-500/30">
                      <span className="font-mono font-bold text-xs text-amber-300 tracking-wider truncate">
                        {typingWord.toUpperCase()}
                      </span>
                      <span className="inline-block w-1.5 h-3 bg-amber-400 shrink-0 animate-pulse" />
                    </div>
                  ) : (
                    <div className="w-full flex items-center justify-center text-[10px] text-slate-400 font-mono truncate">
                      {player.lastValidWord ? (
                        <>
                          <span className="text-[9px] text-slate-400 mr-1">Últ:</span>
                          <span
                            className={`font-semibold truncate ${
                              player.isEliminated ? 'text-slate-400' : 'text-emerald-400'
                            }`}
                          >
                            {player.lastValidWord.toUpperCase()}
                          </span>
                        </>
                      ) : (
                        <div className="flex items-center">
                          <span className="text-slate-600 font-bold text-xs">—</span>
                          {isActive && !player.isEliminated && (
                            <span className="inline-block w-0.5 h-3 bg-amber-400/80 shrink-0 animate-pulse ml-1" />
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
