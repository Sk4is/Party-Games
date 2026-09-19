import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Player, BombDangerLevel } from '../types';
import { BombVisual } from './BombVisual';
import { Skull, Zap, ChevronDown, ChevronUp, History } from 'lucide-react';

interface MobilePlayerGridProps {
  players: Player[];
  activePlayerIndex: number;
  activePlayerId?: string;
  currentTypingWord?: string;
  typingPlayerId?: string;
  maxLives?: number;
  allowedMistakesPerRound?: number;
  progress: number;
  dangerLevel: BombDangerLevel;
  speedMultiplier: number;
  usedWords?: string[];
}

export const MobilePlayerGrid: React.FC<MobilePlayerGridProps> = ({
  players,
  activePlayerIndex,
  activePlayerId,
  currentTypingWord,
  typingPlayerId,
  maxLives = 3,
  allowedMistakesPerRound = 3,
  progress,
  dangerLevel,
  speedMultiplier,
  usedWords = [],
}) => {
  const [isUsedWordsOpen, setIsUsedWordsOpen] = useState(false);

  // Active player identification
  const activeIndex =
    activePlayerId !== undefined
      ? players.findIndex((p) => p.id === activePlayerId)
      : activePlayerIndex >= 0 && activePlayerIndex < players.length
      ? activePlayerIndex
      : 0;
  const activePlayer = players[activeIndex] || players[0];

  // Other players list
  const otherPlayers = players.filter((p) => p.id !== activePlayer?.id);

  const typingWord =
    activePlayer && !activePlayer.isEliminated
      ? (typingPlayerId && typingPlayerId === activePlayer.id
          ? currentTypingWord
          : activePlayer.currentTypingWord) || ''
      : '';
  const hasTyping = typingWord.trim().length > 0;

  const renderLives = (lives: number, isEliminated: boolean) => {
    if (isEliminated) {
      return (
        <span className="text-[10px] text-slate-600 flex gap-0.5">
          {Array.from({ length: maxLives }).map((_, i) => (
            <span key={i}>🖤</span>
          ))}
        </span>
      );
    }
    return (
      <span className="flex gap-0.5">
        {Array.from({ length: maxLives }).map((_, i) => (
          <span
            key={i}
            className={`text-xs transition-all duration-200 ${
              i < lives ? 'text-rose-500' : 'text-slate-600 grayscale'
            }`}
          >
            {i < lives ? '❤️' : '🖤'}
          </span>
        ))}
      </span>
    );
  };

  return (
    <div id="mobile-game-composition" className="w-full flex flex-col items-center gap-1.5 px-2 select-none">
      {/* 1. COMPACT CENTRAL BOMB VISUAL */}
      <div className="relative flex items-center justify-center scale-90 sm:scale-95 my-0.5 pointer-events-none">
        <BombVisual
          progress={progress}
          dangerLevel={dangerLevel}
          speedMultiplier={speedMultiplier}
        />
      </div>

      {/* 2. DIRECTIONAL ARROW (BOMB -> ACTIVE PLAYER) */}
      <div className="flex flex-col items-center justify-center my-0 pointer-events-none">
        <motion.div
          animate={{ y: [0, 3, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
          className="flex items-center justify-center"
        >
          <svg
            width="22"
            height="26"
            viewBox="0 0 22 26"
            fill="none"
            className="filter drop-shadow-[0_0_8px_rgba(245,158,11,0.85)] drop-shadow-[0_0_14px_rgba(234,88,12,0.6)]"
          >
            <defs>
              <linearGradient id="mobileArrowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ea580c" />
                <stop offset="40%" stopColor="#f59e0b" />
                <stop offset="85%" stopColor="#fde047" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>
            </defs>
            {/* Downward glowing arrow */}
            <path
              d="M 6,3 L 16,3 L 16,14 L 21,14 L 11,24 L 1,14 L 6,14 Z"
              fill="url(#mobileArrowGrad)"
              stroke="#7c2d12"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
      </div>

      {/* 3. PROMINENT ACTIVE PLAYER CARD */}
      {activePlayer && (
        <div className="w-full max-w-sm">
          <div
            id={`mobile-active-player-card-${activePlayer.id}`}
            className="relative rounded-2xl bg-slate-900/95 border-2 border-amber-400 p-2.5 shadow-[0_0_20px_rgba(245,158,11,0.45)] ring-2 ring-amber-400/40 transition-all duration-300"
          >
            {/* Active Turn Pulsing Halo */}
            <div className="absolute -inset-0.5 rounded-2xl border border-amber-400/60 animate-pulse pointer-events-none" />

            {/* Top row: Avatar, Name, and Turn Badge */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shadow-inner shrink-0"
                  style={{ backgroundColor: activePlayer.color }}
                >
                  {activePlayer.avatar}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-display font-extrabold text-amber-300 text-sm truncate">
                      {activePlayer.name}
                    </span>
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-400 text-[9px] font-black uppercase tracking-wider border border-amber-500/40 shrink-0">
                      TURNO
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {renderLives(activePlayer.lives, activePlayer.isEliminated)}
                    <span className="text-[10px] font-bold text-slate-400">
                      F: <span className={activePlayer.mistakesThisRound > 0 ? 'text-rose-400 font-black' : 'text-slate-400'}>
                        {activePlayer.mistakesThisRound}/{allowedMistakesPerRound}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Speed Multiplier badge if any */}
              {activePlayer.multiplier > 1.0 && (
                <div className="shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black font-mono">
                  <Zap className="w-2.5 h-2.5 text-amber-400 fill-current" />
                  ×{activePlayer.multiplier.toFixed(2).replace('.', ',')}
                </div>
              )}
            </div>

            {/* Live Typing Word or Last Valid Word */}
            <div className="mt-2 pt-1.5 border-t border-slate-800 flex items-center justify-center min-h-[26px]">
              {hasTyping ? (
                <div className="flex items-center justify-center gap-1.5 w-full bg-slate-950/70 rounded-lg px-2 py-0.5 border border-amber-500/30">
                  <span className="font-mono font-bold text-sm text-amber-300 tracking-wider truncate">
                    {typingWord.toUpperCase()}
                  </span>
                  <span className="inline-block w-1.5 h-4 bg-amber-400 shrink-0 animate-pulse" />
                </div>
              ) : (
                <div className="w-full flex items-center justify-center text-xs text-slate-400 font-mono truncate">
                  {activePlayer.lastValidWord ? (
                    <>
                      <span className="text-[10px] text-slate-400 mr-1.5">Última:</span>
                      <span className="text-emerald-400 font-bold truncate">
                        {activePlayer.lastValidWord.toUpperCase()}
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-600 text-xs italic">Escribiendo palabra...</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. OTHER PLAYERS (COMPACT HORIZONTAL SCROLL STRIP) */}
      {otherPlayers.length > 0 && (
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 px-0.5 no-scrollbar">
            {otherPlayers.map((player) => (
              <div
                key={player.id}
                className={`shrink-0 flex items-center gap-2 px-2 py-1 rounded-xl border transition-all ${
                  player.isEliminated
                    ? 'bg-stone-950/70 border-amber-950/60 opacity-60'
                    : 'bg-slate-900/80 border-slate-800/80'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                    player.isEliminated ? 'grayscale brightness-50' : ''
                  }`}
                  style={{ backgroundColor: player.color }}
                >
                  {player.avatar}
                </div>

                <div className="min-w-0 pr-1">
                  <span
                    className={`text-xs font-bold truncate block max-w-[80px] ${
                      player.isEliminated ? 'text-slate-400 line-through' : 'text-slate-200'
                    }`}
                  >
                    {player.name}
                  </span>
                  <div className="flex items-center gap-1">
                    {renderLives(player.lives, player.isEliminated)}
                    {player.isEliminated ? (
                      <span className="text-[8px] font-black text-orange-400 uppercase">CHAMUSCADO</span>
                    ) : (
                      <span className="text-[9px] text-slate-400">
                        {player.mistakesThisRound}/{allowedMistakesPerRound}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. COLLAPSIBLE PALABRAS USADAS DRAWER */}
      {usedWords.length > 0 && (
        <div className="w-full max-w-sm">
          <button
            type="button"
            onClick={() => setIsUsedWordsOpen((prev) => !prev)}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-[11px] font-semibold text-slate-400 hover:text-slate-200 transition-colors min-h-[38px]"
          >
            <span className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-amber-400" />
              <span>Palabras usadas en esta ronda ({usedWords.length})</span>
            </span>
            {isUsedWordsOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <AnimatePresence>
            {isUsedWordsOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-1 p-2 rounded-xl bg-slate-950/80 border border-slate-800/80 max-h-28 overflow-y-auto"
              >
                <div className="flex flex-wrap gap-1">
                  {usedWords.map((word, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 rounded bg-slate-800/70 text-slate-300 text-[10px] font-mono"
                    >
                      {word.toUpperCase()}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
