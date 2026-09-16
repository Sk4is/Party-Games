import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Player } from '../types';
import { Skull, Zap } from 'lucide-react';

interface MobilePlayerGridProps {
  players: Player[];
  activePlayerIndex: number;
  currentTypingWord?: string;
}

export const MobilePlayerGrid: React.FC<MobilePlayerGridProps> = ({
  players,
  activePlayerIndex,
  currentTypingWord,
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

              {/* Dedicated Prominent Word Area */}
              <div
                className={`mt-2 px-2 py-1.5 rounded-xl flex items-center justify-center text-center transition-all duration-200 min-h-[38px] ${
                  isActive && !player.isEliminated
                    ? 'bg-slate-950 border-2 border-amber-400/90 shadow-[inset_0_0_10px_rgba(245,158,11,0.3)]'
                    : 'bg-slate-950/90 border border-slate-800 shadow-inner'
                }`}
              >
                {isActive && !player.isEliminated && currentTypingWord && currentTypingWord.trim().length > 0 ? (
                  <div className="flex items-center justify-center gap-0.5 text-amber-300 font-display font-black text-xs sm:text-sm tracking-wider drop-shadow-[0_0_6px_rgba(245,158,11,0.5)] truncate max-w-full">
                    <span className="truncate">{currentTypingWord.toUpperCase()}</span>
                    <span className="inline-block w-0.5 h-3.5 bg-amber-400 shrink-0 animate-pulse ml-0.5" />
                  </div>
                ) : (
                  <div className="flex items-center justify-center truncate max-w-full">
                    <span
                      className={`font-display font-black text-xs sm:text-sm tracking-wider truncate ${
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
                      <span className="inline-block w-0.5 h-3.5 bg-amber-400/80 shrink-0 animate-pulse ml-0.5" />
                    )}
                  </div>
                )}
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
