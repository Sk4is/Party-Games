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
  isSidebarExpanded?: boolean;
}

export const PlayerRing: React.FC<PlayerRingProps> = ({
  players,
  activePlayerIndex,
  activePlayerId,
  currentTypingWord,
  typingPlayerId,
  maxLives = 3,
  allowedMistakesPerRound = 3,
  isSidebarExpanded = true,
}) => {
  const totalPlayers = players.length;
  const containerRef = useRef<HTMLDivElement>(null);
  const [arenaSize, setArenaSize] = useState({ width: 1120, height: 420 });
  const [viewportWidth, setViewportWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1440
  );

  // Responsive arena and viewport measurement
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (typeof window !== 'undefined') {
        setViewportWidth(window.innerWidth);
      }
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
    window.addEventListener('resize', updateSize);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, []);

  // Calculate available symmetric horizontal half-span from 50vw so the left player card
  // never overlaps the independent left alphabet HUD sidebar while keeping the stage centered at 50vw.
  const safeHalfSpan = useMemo(() => {
    const sidebarRightEdge = isSidebarExpanded
      ? viewportWidth >= 1536
        ? 324
        : viewportWidth >= 1280
        ? 312
        : viewportWidth >= 1024
        ? 292
        : 272
      : 82;
    const safeFromSidebar = Math.max(210, viewportWidth / 2 - sidebarRightEdge - 20);
    const safeFromArena = Math.max(210, arenaSize.width / 2 - 16);
    return Math.min(safeFromArena, safeFromSidebar);
  }, [viewportWidth, arenaSize.width, isSidebarExpanded]);

  // Adaptive Desktop Card Sizing Tiers:
  // 'large' (2-4 players on spacious desktop): width 224px
  // 'regular' (standard desktop or up to 6 players): width 196px
  // 'medium' (constrained width or 5-7 players): width 166px
  // 'compact' (8+ players or tight space): width 142px
  const cardTier = useMemo<'large' | 'regular' | 'medium' | 'compact'>(() => {
    if (totalPlayers >= 8 || safeHalfSpan < 265 || (totalPlayers > 2 && arenaSize.height < 380)) {
      return 'compact';
    }
    if (totalPlayers >= 6 || safeHalfSpan < 325 || (totalPlayers > 2 && arenaSize.height < 430)) {
      return 'medium';
    }
    if (totalPlayers <= 4 && safeHalfSpan >= 385 && (totalPlayers === 2 || arenaSize.height >= 450)) {
      return 'large';
    }
    return 'regular';
  }, [totalPlayers, safeHalfSpan, arenaSize.height]);

  const cardHalfW =
    cardTier === 'large' ? 112 : cardTier === 'regular' ? 98 : cardTier === 'medium' ? 83 : 71;
  const cardHalfH =
    cardTier === 'large' ? 54 : cardTier === 'regular' ? 48 : cardTier === 'medium' ? 42 : 36;

  // Bomb visual scale on desktop (matching BombVisual md:w-44 lg:w-52 xl:w-60 2xl:w-64)
  const { bombHorizontalRadius, bombUpwardRadius, bombDownwardRadius } = useMemo(() => {
    const bombDiameterPx =
      viewportWidth >= 1536
        ? 256
        : viewportWidth >= 1280
        ? 240
        : viewportWidth >= 1024
        ? 208
        : 176;
    const bombScale = bombDiameterPx / 144;
    return {
      bombHorizontalRadius: Math.round(56 * bombScale),
      bombUpwardRadius: Math.round(80 * bombScale),
      bombDownwardRadius: Math.round(76 * bombScale),
    };
  }, [viewportWidth]);

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

  // Dynamic elliptical orbital radii calculation with scaled BOMB SAFE ZONE protection
  // and maximum distance caps so cards never float to extreme ultrawide edges.
  const { radiusX, radiusY } = useMemo(() => {
    const maxRadiusX = Math.max(185, safeHalfSpan - cardHalfW);
    const maxRadiusY = Math.max(145, arenaSize.height / 2 - cardHalfH - 10);
    const minComfortRadiusX = bombHorizontalRadius + 96 + cardHalfW;

    if (totalPlayers === 2) {
      const desiredRadiusX = Math.max(minComfortRadiusX, arenaSize.width * 0.34);
      const rX = Math.min(maxRadiusX, Math.min(390, desiredRadiusX));
      return { radiusX: Math.round(rX), radiusY: 0 };
    }

    // Minimum required radiusY to guarantee top/bottom player cards never crowd bomb fuse or pill:
    const minSafeRadiusY = bombUpwardRadius + 34 + cardHalfH;

    let targetRadiusY = Math.max(minSafeRadiusY, arenaSize.height * 0.38);
    targetRadiusY = Math.min(maxRadiusY, targetRadiusY);

    let targetRadiusX = Math.max(minComfortRadiusX + 12, arenaSize.width * 0.36);
    targetRadiusX = Math.min(maxRadiusX, Math.min(430, targetRadiusX));

    return { radiusX: Math.round(targetRadiusX), radiusY: Math.round(targetRadiusY) };
  }, [
    totalPlayers,
    safeHalfSpan,
    arenaSize,
    cardHalfW,
    cardHalfH,
    bombHorizontalRadius,
    bombUpwardRadius,
  ]);

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

  // Bomb visual boundary along ray (upward fuse, downward pill, or horizontal sphere):
  const bombOuterEdgeDist =
    Math.sin(angleToPlayerRad) < -0.25
      ? bombUpwardRadius
      : Math.sin(angleToPlayerRad) > 0.25
      ? bombDownwardRadius
      : bombHorizontalRadius;

  // Available free corridor between bomb edge and card edge
  const availableCorridor = Math.max(18, playerCardEdgeDist - bombOuterEdgeDist);

  // Arrow geometry: centered cleanly inside the free corridor between the bomb and the active player card
  const arrowLength = Math.max(22, Math.min(42, Math.round(availableCorridor * 0.42)));
  const arrowCenterDist = bombOuterEdgeDist + availableCorridor * 0.52;

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
    const heartTextClass =
      cardTier === 'large' ? 'text-sm' : cardTier === 'regular' ? 'text-xs sm:text-sm' : 'text-xs';
    if (isEliminated) {
      return (
        <div className={`flex gap-0.5 text-slate-600 ${heartTextClass}`}>
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
            className={`transition-all duration-300 ${heartTextClass} ${
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
          animate={{ x: [0, 4, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg
            width={arrowLength + 8}
            height="22"
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
          const mistakesCount = player.roundMistakes ?? player.mistakesThisRound ?? player.mistakes ?? 0;

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
                    ? 'w-[142px] p-2'
                    : cardTier === 'medium'
                    ? 'w-[166px] p-2.5'
                    : cardTier === 'regular'
                    ? 'w-[196px] p-3'
                    : 'w-[224px] p-3.5'
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
                <div className="flex items-center gap-2.5">
                  <div
                    className={`${
                      cardTier === 'compact'
                        ? 'w-7 h-7 text-sm'
                        : cardTier === 'medium'
                        ? 'w-8 h-8 text-base'
                        : cardTier === 'regular'
                        ? 'w-9 h-9 text-base'
                        : 'w-10 h-10 text-lg'
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
                          cardTier === 'compact'
                            ? 'text-xs'
                            : cardTier === 'large'
                            ? 'text-base'
                            : 'text-sm'
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
                        <div
                          className={`flex items-center gap-0.5 font-bold text-slate-300 ${
                            cardTier === 'large' ? 'text-xs' : 'text-[11px]'
                          }`}
                        >
                          <span className="text-[10px] uppercase tracking-wider text-slate-400">F:</span>
                          <span
                            className={`${
                              mistakesCount > 0
                                ? 'text-rose-400 font-extrabold'
                                : 'text-slate-300'
                            }`}
                          >
                            {mistakesCount}/{allowedMistakesPerRound}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dynamic Word Display Area */}
                <div
                  className={`${
                    cardTier === 'large' ? 'mt-2 pt-1.5 min-h-[28px]' : 'mt-1.5 pt-1 min-h-[24px]'
                  } border-t border-slate-800/80 flex items-center justify-center`}
                >
                  {hasTyping ? (
                    <div className="flex items-center justify-center gap-1.5 w-full bg-slate-950/70 rounded-lg px-2 py-0.5 border border-amber-500/30">
                      <span
                        className={`font-mono font-bold ${
                          cardTier === 'large' ? 'text-xs xl:text-sm' : 'text-xs'
                        } text-amber-300 tracking-wider truncate`}
                      >
                        {typingWord.toUpperCase()}
                      </span>
                      <span className="inline-block w-1.5 h-3.5 bg-amber-400 shrink-0 animate-pulse" />
                    </div>
                  ) : (
                    <div
                      className={`w-full flex items-center justify-center ${
                        cardTier === 'large' ? 'text-xs' : 'text-[11px]'
                      } text-slate-300 font-mono truncate`}
                    >
                      {player.lastValidWord ? (
                        <>
                          <span className="text-[10px] text-slate-400 mr-1">Últ:</span>
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
                  <div className="mt-1 pt-0.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-black text-amber-400">
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
