import React, { useState, useEffect } from 'react';
import { Trophy, Check, Heart, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Player } from '../../types';
import { SPANISH_ALPHABET, TOTAL_ALPHABET_LETTERS } from '../../utils/alphabet';

interface AlphabetSidebarProps {
  players: Player[];
  currentUserId: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isMobileDrawerOpen?: boolean;
  onCloseMobileDrawer?: () => void;
}

export const AlphabetSidebar: React.FC<AlphabetSidebarProps> = ({
  players,
  currentUserId,
  isExpanded,
  onToggleExpand,
  isMobileDrawerOpen = false,
  onCloseMobileDrawer,
}) => {
  // Always default selected player to currentUserId (the local player)
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(currentUserId);

  // If players list updates, ensure selected player exists, otherwise fallback to local player
  useEffect(() => {
    if (!players.some((p) => p.id === selectedPlayerId)) {
      setSelectedPlayerId(currentUserId);
    }
  }, [players, selectedPlayerId, currentUserId]);

  const viewingPlayer =
    players.find((p) => p.id === selectedPlayerId) ||
    players.find((p) => p.id === currentUserId) ||
    players[0];

  const isViewingSelf = viewingPlayer?.id === currentUserId;
  const progressList = viewingPlayer?.alphabetProgress || [];
  const progressSet = new Set(progressList);
  const completedCount = progressList.length;
  const remainingCount = TOTAL_ALPHABET_LETTERS - completedCount;
  const percentage = Math.round((completedCount / TOTAL_ALPHABET_LETTERS) * 100);

  // Local player's own stats for the collapsed view
  const myPlayer = players.find((p) => p.id === currentUserId) || players[0];
  const myCompletedCount = myPlayer?.alphabetProgress?.length || 0;

  // Sidebar content markup
  const renderSidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full select-none">
      {/* Top Header */}
      <div className="px-4 py-3 border-b border-white/[0.08] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Trophy className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 font-display truncate">
              {isViewingSelf ? 'Tu Reto del Abecedario' : `Reto: ${viewingPlayer?.name}`}
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">
              27 letras · +1 vida al completar
            </p>
          </div>
        </div>

        {/* Toggle Button */}
        {isMobile ? (
          <button
            type="button"
            onClick={onCloseMobileDrawer}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Cerrar abecedario"
            aria-label="Cerrar abecedario"
          >
            <X className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onToggleExpand}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-300 transition-colors cursor-pointer"
            title="Colapsar barra lateral"
            aria-label="Colapsar barra lateral del abecedario"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Secondary Tabs for Other Players (Compact) */}
      {players.length > 1 && (
        <div className="px-3 py-2 border-b border-white/[0.06] flex items-center gap-1.5 overflow-x-auto scrollbar-none shrink-0">
          <button
            type="button"
            onClick={() => setSelectedPlayerId(currentUserId)}
            className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
              isViewingSelf
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Tú ({myCompletedCount}/27)
          </button>

          {players
            .filter((p) => p.id !== currentUserId)
            .map((p) => {
              const isSelected = p.id === viewingPlayer?.id;
              const pCount = (p.alphabetProgress || []).length;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPlayerId(p.id)}
                  title={`${p.name} (${pCount}/27)`}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 text-white border border-slate-600'
                      : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800/60 border border-slate-800/60'
                  }`}
                >
                  <span>{p.avatar}</span>
                  <span className="max-w-[50px] truncate">{p.name}</span>
                </button>
              );
            })}
        </div>
      )}

      {/* Progress Summary */}
      <div className="px-4 py-2.5 shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-slate-400 font-medium">
            {completedCount === 27
              ? '¡Completado!'
              : `Progreso (${completedCount}/27)`}
          </span>
          <span className="text-xs font-black text-amber-400 font-mono">
            {percentage}%
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${percentage}%`,
              backgroundColor: viewingPlayer?.color || '#f59e0b',
            }}
          />
        </div>
      </div>

      {/* Spanish Alphabet Grid (27 letters) */}
      <div className="flex-1 px-3 py-1 overflow-y-auto">
        <div
          className="grid grid-cols-5 gap-1.5"
          role="grid"
          aria-label="Letras del abecedario"
        >
          {SPANISH_ALPHABET.map((letter) => {
            const isDone = progressSet.has(letter);

            return (
              <div
                key={letter}
                className={`relative flex items-center justify-center rounded-lg font-display text-xs font-bold transition-all h-8 select-none ${
                  isDone
                    ? 'bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 shadow-xs'
                    : 'bg-slate-900/70 border border-slate-800/80 text-slate-400'
                }`}
                title={isDone ? `Letra ${letter} completada` : `Letra ${letter} pendiente`}
              >
                <span className={isDone ? 'line-through opacity-80' : ''}>
                  {letter}
                </span>
                {isDone && (
                  <Check className="w-2.5 h-2.5 text-emerald-400 absolute bottom-0.5 right-0.5" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2.5 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-slate-400 shrink-0">
        <span className="flex items-center gap-1 text-rose-400 font-semibold">
          <Heart className="w-3 h-3 fill-rose-500 text-rose-500" />
          <span>+1 vida</span>
        </span>
        <span className="text-slate-400 font-medium">
          {remainingCount === 0 ? '¡Listo!' : `Faltan ${remainingCount}`}
        </span>
      </div>
    </div>
  );

  return (
    <>
      {/* DESKTOP FIXED LEFT SIDEBAR (Attached to the far left edge of the page) */}
      <aside
        id="desktop-alphabet-sidebar"
        className={`hidden md:flex flex-col h-full bg-slate-950/90 border-r border-white/[0.08] transition-[width] duration-300 ease-in-out shrink-0 overflow-hidden ${
          isExpanded ? 'w-[236px] xl:w-[250px]' : 'w-[54px]'
        }`}
      >
        {isExpanded ? (
          renderSidebarContent(false)
        ) : (
          /* Collapsed Strip View */
          <div
            onClick={onToggleExpand}
            className="flex flex-col items-center justify-between h-full py-3 cursor-pointer hover:bg-slate-900/40 transition-colors"
            title="Expandir reto del abecedario"
          >
            {/* Top Icon */}
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Trophy className="w-4 h-4" />
            </div>

            {/* Vertical Progress */}
            <div className="flex flex-col items-center gap-1 my-auto">
              <span className="text-[11px] font-mono font-black text-amber-400">
                {myCompletedCount}
              </span>
              <div className="w-4 h-[1px] bg-slate-700" />
              <span className="text-[10px] font-mono text-slate-500 font-bold">
                27
              </span>
            </div>

            {/* Expand Chevron */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-300 transition-colors"
              title="Expandir Abecedario"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </aside>

      {/* MOBILE DRAWER (Slide in from left) */}
      {isMobileDrawerOpen && (
        <div
          id="mobile-alphabet-drawer"
          className="md:hidden fixed inset-0 z-50 flex bg-black/75 backdrop-blur-sm animate-fadeIn"
          onClick={onCloseMobileDrawer}
        >
          <div
            className="w-[85vw] max-w-sm h-full bg-slate-950 border-r border-slate-800 shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {renderSidebarContent(true)}
          </div>
        </div>
      )}
    </>
  );
};
