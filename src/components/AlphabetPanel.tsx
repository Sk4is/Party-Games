import React, { useState, useEffect } from 'react';
import { Sparkles, Trophy, Check, Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { Player } from '../types';
import { SPANISH_ALPHABET, TOTAL_ALPHABET_LETTERS } from '../utils/alphabet';

interface AlphabetPanelProps {
  players: Player[];
  activePlayerIndex: number;
  recentlyUnlockedLetters?: string[];
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
}

export const AlphabetPanel: React.FC<AlphabetPanelProps> = ({
  players,
  activePlayerIndex,
  recentlyUnlockedLetters = [],
  isMobileDrawer = false,
  onCloseMobileDrawer,
}) => {
  const activePlayer = players[activePlayerIndex] || players[0];
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(activePlayer?.id || '');

  // Auto-sync selected player to active player whenever the turn changes
  useEffect(() => {
    if (activePlayer?.id) {
      setSelectedPlayerId(activePlayer.id);
    }
  }, [activePlayer?.id]);

  const viewingPlayer = players.find((p) => p.id === selectedPlayerId) || activePlayer;
  const progressList = viewingPlayer?.alphabetProgress || [];
  const progressSet = new Set(progressList);
  const completedCount = progressList.length;
  const remainingCount = TOTAL_ALPHABET_LETTERS - completedCount;
  const percentage = Math.round((completedCount / TOTAL_ALPHABET_LETTERS) * 100);

  return (
    <div
      id="alphabet-challenge-panel"
      className={`flex flex-col bg-slate-900/90 border border-slate-800/90 rounded-2xl p-3.5 sm:p-4 shadow-xl backdrop-blur-md select-none ${
        isMobileDrawer ? 'w-full' : 'w-64 xl:w-72'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 font-display">
              Reto del Abecedario
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">
              27 letras · +1 vida al completar
            </p>
          </div>
        </div>

        {isMobileDrawer && onCloseMobileDrawer && (
          <button
            type="button"
            onClick={onCloseMobileDrawer}
            className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 cursor-pointer"
          >
            Cerrar
          </button>
        )}
      </div>

      {/* Player Selector Tabs */}
      {players.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto py-2 scrollbar-none">
          {players.map((p, idx) => {
            const isSelected = p.id === viewingPlayer?.id;
            const isTurn = idx === activePlayerIndex;
            const pCount = (p.alphabetProgress || []).length;

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPlayerId(p.id)}
                title={`${p.name} (${pCount}/27)`}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800 text-white border border-slate-600 shadow-sm'
                    : 'bg-slate-950/60 text-slate-400 hover:bg-slate-800/60 border border-slate-800/60'
                }`}
              >
                <span>{p.avatar}</span>
                <span className="max-w-[60px] truncate">{p.name}</span>
                {isTurn && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Active Player Summary Card */}
      <div className="my-2 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base">{viewingPlayer?.avatar}</span>
            <div className="truncate">
              <span className="text-xs font-bold text-slate-200 block truncate">
                {viewingPlayer?.name}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {completedCount === 27
                  ? '¡Abecedario completo!'
                  : `Faltan ${remainingCount} ${remainingCount === 1 ? 'letra' : 'letras'}`}
              </span>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-xs font-black text-amber-400 font-display">
              {completedCount}
            </span>
            <span className="text-[10px] text-slate-500 font-bold"> / 27</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${percentage}%`,
              backgroundColor: viewingPlayer?.color || '#f59e0b',
            }}
          />
        </div>
      </div>

      {/* 27 Alphabet Letters Grid */}
      <div
        className="grid grid-cols-6 sm:grid-cols-7 gap-1 sm:gap-1.5 my-1"
        role="grid"
        aria-label="Letras del abecedario"
      >
        {SPANISH_ALPHABET.map((letter) => {
          const isDone = progressSet.has(letter);
          const isRecentlyUnlocked = recentlyUnlockedLetters.includes(letter);

          return (
            <div
              key={letter}
              className={`relative flex items-center justify-center rounded-lg font-display text-xs font-black transition-all aspect-square select-none ${
                isDone
                  ? 'bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 shadow-xs'
                  : 'bg-slate-950/70 border border-slate-800 text-slate-400'
              } ${isRecentlyUnlocked ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-slate-900 animate-pulse' : ''}`}
              title={
                isDone
                  ? `Letra ${letter} completada`
                  : `Letra ${letter} pendiente de usar`
              }
            >
              <span className={isDone ? 'line-through opacity-85' : ''}>
                {letter}
              </span>
              {isDone && (
                <Check className="w-2.5 h-2.5 text-emerald-400 absolute bottom-0.5 right-0.5" />
              )}
            </div>
          );
        })}
      </div>

      {/* Reward Info Footer */}
      <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-medium">
        <span className="flex items-center gap-1 text-rose-400 font-semibold">
          <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
          Recompensa: +1 vida
        </span>
        <span className="text-slate-400">
          Vidas actuales: {viewingPlayer?.lives || 0}/3
        </span>
      </div>
    </div>
  );
};
