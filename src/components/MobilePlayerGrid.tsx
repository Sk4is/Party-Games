import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Player } from '../types';
import { Skull, Zap } from 'lucide-react';

interface MobilePlayerGridProps {
  players: Player[];
  activePlayerIndex: number;
}

export const MobilePlayerGrid: React.FC<MobilePlayerGridProps> = ({
  players,
  activePlayerIndex,
}) => {
  const renderLives = (lives: number, isEliminated: boolean) => {
    if (isEliminated) {
      return (
        <span className="text-[11px] text-slate-600 tracking-tighter">
          🖤🖤🖤
        </span>
      );
    }
    const hearts = [];
    for (let i = 0; i < 3; i++) {
      hearts.push(
        <span
          key={i}
          className={`text-xs transition-all duration-200 ${
            i < lives ? 'text-rose-500' : 'text-slate-600 grayscale'
          }`}
        >
          {i < lives ? '❤️' : '🖤'}
        </span>
      );
    }
    return <span className="flex gap-0.5">{hearts}</span>;
  };

  return (
    <div className="w-full px-2">
      {/* 2-Column Responsive Grid in Normal Document Flow */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-md mx-auto">
        {players.map((player, index) => {
          const isActive = index === activePlayerIndex;

          return (
            <div
              key={player.id}
              id={`mobile-player-card-${player.id}`}
              className={`relative rounded-2xl p-3 flex flex-col justify-between transition-all duration-200 select-none ${
                player.isEliminated
                  ? 'burnt-effect border border-amber-950/70 bg-stone-950/80 opacity-60'
                  : isActive
                  ? 'bg-slate-900/98 border-2 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.5)] ring-2 ring-amber-400/40 scale-[1.03] z-10'
                  : 'bg-slate-900/85 border border-slate-800 shadow-md opacity-90'
              }`}
            >
              {/* Active Player "TU TURNO" Badge */}
              {isActive && !player.isEliminated && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-md flex items-center gap-1 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-ping" />
                  <span>TU TURNO</span>
                </div>
              )}

              {/* Eliminated "CHAMUSCADO" Badge */}
              {player.isEliminated && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-stone-900 border border-amber-900/80 text-orange-400 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md whitespace-nowrap">
                  <Skull className="w-2.5 h-2.5 text-orange-500" />
                  <span>CHAMUSCADO</span>
                </div>
              )}

              {/* Top Row: Avatar & Name */}
              <div className="flex items-center gap-2 mb-1.5">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-base shadow-inner shrink-0 ${
                    player.isEliminated ? 'grayscale brightness-50' : ''
                  }`}
                  style={{ backgroundColor: player.color }}
                >
                  {player.avatar}
                </div>

                <div className="min-w-0 flex-1">
                  <span
                    className={`text-xs font-black truncate block ${
                      player.isEliminated
                        ? 'text-stone-500 line-through'
                        : isActive
                        ? 'text-amber-300 font-display'
                        : 'text-slate-200'
                    }`}
                    title={player.name}
                  >
                    {player.name}
                  </span>
                </div>
              </div>

              {/* Middle Row: Lives & Fallos */}
              <div className="flex items-center justify-between py-1 border-t border-slate-800/80 text-xs">
                {renderLives(player.lives, player.isEliminated)}
                <span className="text-[10px] font-extrabold text-slate-400">
                  {player.isEliminated ? 'RIP' : `F: ${player.mistakes}`}
                </span>
              </div>

              {/* Bottom Row: Last Valid Word */}
              <div className="pt-1 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 font-medium shrink-0">Última:</span>
                <div className="relative overflow-hidden h-4 flex items-center justify-end flex-1 pl-1">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={player.lastValidWord || 'none'}
                      initial={{ y: 6, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -6, opacity: 0 }}
                      transition={{ duration: 0.18, ease: 'easeOut' }}
                      className={`font-black truncate block max-w-[85px] text-right ${
                        player.lastValidWord ? 'text-amber-300' : 'text-slate-600'
                      }`}
                      title={player.lastValidWord || undefined}
                    >
                      {player.lastValidWord ? player.lastValidWord : '—'}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>

              {/* Speed Multiplier Penalty */}
              {!player.isEliminated && player.multiplier > 1.0 && (
                <div className="mt-1 pt-0.5 border-t border-slate-800/40 flex items-center justify-between text-[9px] font-black text-amber-400">
                  <span className="flex items-center gap-0.5">
                    <Zap className="w-2.5 h-2.5 fill-current" />
                    Velocidad
                  </span>
                  <span className="px-1 rounded bg-amber-500/20 text-amber-300">
                    ×{player.multiplier.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
