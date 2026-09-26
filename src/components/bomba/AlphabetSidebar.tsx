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

  // Sidebar content markup (isMobile preserves exact mobile drawer sizes; !isMobile scales up for desktop HUD)
  const renderSidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full select-none">
      {/* Top Header */}
      <div
        className={`${
          isMobile ? 'px-4 py-3' : 'px-4 lg:px-4.5 py-3 lg:py-3.5'
        } border-b border-white/[0.08] flex items-center justify-between shrink-0`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`${
              isMobile ? 'w-7 h-7 rounded-lg' : 'w-8 h-8 lg:w-9 lg:h-9 rounded-xl'
            } bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0`}
          >
            <Trophy className={isMobile ? 'w-4 h-4' : 'w-4 h-4 lg:w-4.5 lg:h-4.5'} />
          </div>
          <div className="min-w-0">
            <h3
              className={`${
                isMobile ? 'text-xs' : 'text-xs lg:text-[13px] xl:text-sm'
              } font-black uppercase tracking-wider text-amber-400 font-display truncate`}
            >
              {isViewingSelf ? 'Tu Reto del Abecedario' : `Reto: ${viewingPlayer?.name}`}
            </h3>
            <p
              className={`${
                isMobile ? 'text-[10px] text-slate-400' : 'text-[11px] lg:text-xs text-slate-300'
              } font-medium`}
            >
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
            <ChevronLeft className="w-4 h-4 lg:w-4.5 lg:h-4.5" />
          </button>
        )}
      </div>

      {/* Secondary Tabs for Other Players */}
      {players.length > 1 && (
        <div
          className={`${
            isMobile ? 'px-3 py-2 gap-1.5' : 'px-3.5 lg:px-4 py-2.5 gap-1.5'
          } border-b border-white/[0.06] flex items-center overflow-x-auto scrollbar-none shrink-0`}
        >
          <button
            type="button"
            onClick={() => setSelectedPlayerId(currentUserId)}
            className={`${
              isMobile ? 'px-2 py-1 rounded-md text-[11px]' : 'px-2.5 py-1.5 rounded-lg text-xs'
            } font-bold transition-all shrink-0 cursor-pointer ${
              isViewingSelf
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
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
                  className={`flex items-center gap-1 ${
                    isMobile ? 'px-2 py-1 rounded-md text-[11px]' : 'px-2.5 py-1.5 rounded-lg text-xs'
                  } font-bold transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800 text-white border border-slate-600'
                      : 'bg-slate-900/70 text-slate-300 hover:bg-slate-800/70 border border-slate-800/80'
                  }`}
                >
                  <span>{p.avatar}</span>
                  <span className={isMobile ? 'max-w-[50px] truncate' : 'max-w-[68px] truncate'}>
                    {p.name}
                  </span>
                  {!isMobile && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      {pCount}/27
                    </span>
                  )}
                </button>
              );
            })}
        </div>
      )}

      {/* Progress Summary */}
      <div className={isMobile ? 'px-4 py-2.5 shrink-0' : 'px-4 lg:px-4.5 py-3 shrink-0'}>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex flex-col">
            <span
              className={
                isMobile
                  ? 'text-[11px] text-slate-400 font-medium'
                  : 'text-xs lg:text-[13px] text-slate-200 font-bold'
              }
            >
              {completedCount === 27
                ? '¡Completado!'
                : `Progreso (${completedCount}/27)`}
            </span>
            {!isMobile && (
              <span className="text-[11px] text-slate-400 font-medium">
                {remainingCount === 0
                  ? '¡Todas las letras usadas!'
                  : `Faltan ${remainingCount} ${remainingCount === 1 ? 'letra' : 'letras'}`}
              </span>
            )}
          </div>
          <span
            className={
              isMobile
                ? 'text-xs font-black text-amber-400 font-mono'
                : 'text-xs lg:text-sm font-black text-amber-400 font-mono'
            }
          >
            {percentage}%
          </span>
        </div>
        <div
          className={`w-full ${
            isMobile ? 'h-1.5' : 'h-2 lg:h-2.5'
          } rounded-full bg-slate-800/90 overflow-hidden`}
        >
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
      <div className={isMobile ? 'flex-1 px-3 py-1 overflow-y-auto' : 'flex-1 px-3.5 lg:px-4 py-1.5 overflow-y-auto'}>
        <div
          className={isMobile ? 'grid grid-cols-5 gap-1.5' : 'grid grid-cols-5 gap-1.5 lg:gap-2'}
          role="grid"
          aria-label="Letras del abecedario"
        >
          {SPANISH_ALPHABET.map((letter) => {
            const isDone = progressSet.has(letter);

            return (
              <div
                key={letter}
                className={`relative flex items-center justify-center font-display transition-all select-none ${
                  isMobile
                    ? 'rounded-lg text-xs font-bold h-8'
                    : 'rounded-xl text-xs lg:text-sm xl:text-[15px] font-black h-9 lg:h-10 xl:h-[42px]'
                } ${
                  isDone
                    ? 'bg-emerald-950/75 border border-emerald-500/60 text-emerald-300 shadow-xs'
                    : isMobile
                    ? 'bg-slate-900/70 border border-slate-800/80 text-slate-400'
                    : 'bg-slate-900/85 border border-slate-800 text-slate-200'
                }`}
                title={isDone ? `Letra ${letter} completada` : `Letra ${letter} pendiente`}
              >
                <span className={isDone ? 'line-through opacity-80' : ''}>
                  {letter}
                </span>
                {isDone && (
                  <Check
                    className={`${
                      isMobile ? 'w-2.5 h-2.5' : 'w-3 h-3'
                    } text-emerald-400 absolute bottom-0.5 right-0.5`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Info */}
      <div
        className={`${
          isMobile ? 'px-4 py-2.5 text-[11px]' : 'px-4 lg:px-4.5 py-3 text-xs'
        } border-t border-white/[0.08] flex items-center justify-between text-slate-300 shrink-0`}
      >
        <span className="flex items-center gap-1.5 text-rose-400 font-bold">
          <Heart className={isMobile ? 'w-3 h-3 fill-rose-500 text-rose-500' : 'w-3.5 h-3.5 fill-rose-500 text-rose-500'} />
          <span>+1 vida</span>
        </span>
        <span className="text-slate-300 font-semibold">
          {remainingCount === 0 ? '¡Listo!' : `Faltan ${remainingCount}`}
        </span>
      </div>
    </div>
  );

  return (
    <>
      {/* DESKTOP INDEPENDENT LEFT HUD SIDEBAR (Anchored 16-24px from left edge; NEVER pushes 50vw center) */}
      <aside
        id="desktop-alphabet-sidebar"
        className={`hidden md:flex flex-col fixed left-4 lg:left-5 xl:left-6 top-[66px] lg:top-[72px] z-30 bg-slate-950/92 border border-slate-800/90 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.65)] backdrop-blur-md transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded
            ? 'w-[256px] lg:w-[272px] xl:w-[288px] 2xl:w-[300px] max-h-[calc(100vh-84px)]'
            : 'w-[58px] py-3.5'
        }`}
      >
        {isExpanded ? (
          renderSidebarContent(false)
        ) : (
          /* Collapsed Strip View */
          <div
            onClick={onToggleExpand}
            className="flex flex-col items-center justify-between gap-4 py-1 cursor-pointer hover:bg-slate-900/40 transition-colors"
            title="Expandir reto del abecedario"
          >
            {/* Top Icon */}
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Trophy className="w-4.5 h-4.5" />
            </div>

            {/* Vertical Progress */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-mono font-black text-amber-400">
                {myCompletedCount}
              </span>
              <div className="w-5 h-[1px] bg-slate-700" />
              <span className="text-[11px] font-mono text-slate-400 font-bold">
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
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-300 transition-colors"
              title="Expandir Abecedario"
            >
              <ChevronRight className="w-4.5 h-4.5" />
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
