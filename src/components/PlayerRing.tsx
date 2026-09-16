import React, { useMemo } from 'react';
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
  // 3+ players: start at -90° (top: 12 o'clock) proceeding clockwise
  const playerAngles = useMemo(() => {
    const startAngle = totalPlayers === 2 ? 0 : -90;
    const step = 360 / totalPlayers;
    return players.map((_, idx) => startAngle + idx * step);
  }, [totalPlayers, players]);

  // Active player angle for the central directional arrow
  const activeAngle = playerAngles[activePlayerIndex] ?? -90;

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
      {/* CENTRAL ROTATING ARROW POINTING TO ACTIVE PLAYER (Desktop & Tablet) */}
      <div
        className="absolute z-20 pointer-events-none transition-transform duration-300 ease-out hidden md:block"
        style={{
          transform: `rotate(${activeAngle}deg)`,
        }}
      >
        <div className="flex items-center" style={{ width: '135px' }}>
          {/* Starts outside the small bomb and points towards active player card */}
          <div className="flex-1" />
          <div className="relative flex items-center translate-x-2">
            <div className="animate-pulse flex items-center">
              <svg
                width="32"
                height="24"
                viewBox="0 0 32 24"
                fill="none"
                className="drop-shadow-[0_0_12px_rgba(245,158,11,0.9)]"
              >
                <path
                  d="M0 12 H18 M14 4 L26 12 L14 20"
                  stroke="#fbbf24"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polygon points="28,12 16,5 16,19" fill="#f59e0b" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* RADIAL DESKTOP & TABLET LAYOUT (md and up) - Spacious, Elliptical distribution */}
      <div className="hidden md:block absolute inset-0">
        {players.map((player, index) => {
          const angleDeg = playerAngles[index];
          const angleRad = (angleDeg * Math.PI) / 180;

          // Wide elliptical radius so cards are moved FAR away from the bomb
          // Horizontal spread uses full desktop width while vertical spread maintains clearance
          const radiusX = totalPlayers <= 4 ? 320 : totalPlayers <= 6 ? 360 : 410;
          const radiusY = totalPlayers <= 4 ? 165 : totalPlayers <= 6 ? 180 : 200;

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
                    ? 'bg-slate-900/95 border-2 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.5)] ring-2 ring-amber-400/40 scale-105'
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

      {/* MOBILE ADAPTIVE RESPONSIVE LAYOUT (<md screens) - Clean, spacious grid */}
      <div className="block md:hidden w-full px-2 z-25 mt-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-w-lg mx-auto">
          {players.map((player, index) => {
            const isActive = index === activePlayerIndex;

            return (
              <div
                key={player.id}
                id={`mobile-player-card-${player.id}`}
                className={`p-2.5 rounded-xl transition-all duration-200 select-none ${
                  player.isEliminated
                    ? 'burnt-effect border border-amber-950/60 opacity-60'
                    : isActive
                    ? 'bg-slate-900 border-2 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)] ring-2 ring-amber-400/50 scale-[1.02]'
                    : 'bg-slate-900/85 border border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-base shrink-0 ${
                      player.isEliminated ? 'grayscale brightness-50' : ''
                    }`}
                    style={{ backgroundColor: player.color }}
                  >
                    {player.avatar}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold truncate ${
                          player.isEliminated
                            ? 'text-stone-500 line-through'
                            : isActive
                            ? 'text-amber-300'
                            : 'text-slate-200'
                        }`}
                      >
                        {player.name}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs mt-0.5">
                      {renderLives(player.lives, player.isEliminated)}
                      <span className="text-[10px] text-slate-400 font-semibold">
                        {player.isEliminated ? 'RIP' : `F:${player.mistakes}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Last word on mobile */}
                <div className="mt-1.5 pt-1 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Última:</span>
                  <div className="relative overflow-hidden h-4 flex items-center justify-end">
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span
                        key={player.lastValidWord || 'none'}
                        initial={{ y: 6, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -6, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className={`font-black truncate max-w-[85px] ${
                          player.lastValidWord ? 'text-amber-300' : 'text-slate-500'
                        }`}
                        title={player.lastValidWord || undefined}
                      >
                        {player.lastValidWord ? player.lastValidWord : '—'}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                </div>

                {!player.isEliminated && player.multiplier > 1.0 && (
                  <div className="mt-1 pt-0.5 border-t border-slate-800/40 flex items-center justify-between text-[9px] font-black text-amber-400">
                    <span>⚡ Velocidad</span>
                    <span>×{player.multiplier.toFixed(2).replace('.', ',')}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
