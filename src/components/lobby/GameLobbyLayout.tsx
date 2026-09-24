import React from 'react';
import { ArrowLeft, Users, Wifi } from 'lucide-react';
import { motion } from 'motion/react';
import { GameSlug } from '../../styles/gameThemes';

export interface GameLobbyLayoutProps {
  title: string;
  icon: React.ReactNode;
  description?: string;
  minPlayers: number;
  maxPlayers: number;
  accentColor?: 'amber' | 'orange' | 'rose' | 'indigo';
  gameType?: GameSlug;
  onBack: () => void;
  backLabel?: string;
  roomCode?: string;
  isOnlineLobby?: boolean;
  errorMessage?: string | null;
  children: React.ReactNode;
}

export const GameLobbyLayout: React.FC<GameLobbyLayoutProps> = ({
  title,
  icon,
  description,
  minPlayers,
  maxPlayers,
  gameType = 'la-bomba',
  onBack,
  backLabel = 'Volver al menú',
  roomCode,
  isOnlineLobby = false,
  errorMessage,
  children,
}) => {
  const roomCodeColor =
    gameType === 'la-peor-respuesta'
      ? 'text-[#FF3B4F]'
      : gameType === 'pinturillo'
      ? 'text-[#00BCEB]'
      : gameType === 'palabra-secreta'
      ? 'text-[#10B981]'
      : 'text-[#FFB000]';

  const usersIconColor =
    gameType === 'la-peor-respuesta'
      ? 'text-[#FF3B4F]'
      : gameType === 'pinturillo'
      ? 'text-[#00BCEB]'
      : gameType === 'palabra-secreta'
      ? 'text-[#10B981]'
      : 'text-[#FFB000]';

  return (
    <div className="min-h-screen bg-[#070b14] text-stone-100 flex flex-col px-2.5 xs:px-3 sm:px-6 md:px-8 py-3 sm:py-6 font-sans select-none relative w-full max-w-full min-w-0 box-border">
      {/* Top Header Bar */}
      <header className="w-full max-w-3xl mx-auto flex items-center justify-between gap-2 pb-3 sm:pb-4 mb-2 border-b border-stone-800/60 min-w-0">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-2.5 xs:px-3 py-1.5 xs:py-2 rounded-xl text-xs font-semibold bg-stone-900/90 text-stone-300 hover:text-white hover:bg-stone-800 border border-stone-800 transition-colors cursor-pointer shrink-0"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span className="hidden xs:inline">{backLabel}</span>
          <span className="xs:hidden">Volver</span>
        </button>

        <div className="flex items-center gap-2 shrink-0">
          {roomCode ? (
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-stone-900/90 border border-stone-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-stone-400">
                Sala <strong className={`font-mono font-bold ${roomCodeColor}`}>{roomCode}</strong>
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 xs:px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] xs:text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="hidden xs:inline">Multijugador online</span>
              <span className="xs:hidden">Online</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-3xl mx-auto flex-1 flex flex-col py-3 sm:py-6 min-w-0">
        {/* Game Title & Meta Card/Header */}
        <div className="text-center mb-5 sm:mb-8 min-w-0 px-1">
          <div className="inline-flex items-center justify-center text-3xl xs:text-4xl sm:text-5xl mb-2 drop-shadow-sm">
            {icon}
          </div>
          <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-[42px] font-black tracking-tight text-white uppercase leading-tight mb-2 break-words">
            {title}
          </h1>

          {description && (
            <p className="max-w-xl mx-auto text-xs sm:text-sm text-stone-400 leading-relaxed font-medium mb-3 break-words">
              {description}
            </p>
          )}

          <div className="inline-flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs text-stone-400 font-medium">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-900/60 border border-stone-800/80">
              <Users className={`w-3.5 h-3.5 ${usersIconColor} shrink-0`} />
              <span className="truncate">{minPlayers}–{maxPlayers} jugadores</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-900/60 border border-stone-800/80">
              <Wifi className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">Partida en tiempo real</span>
            </span>
          </div>
        </div>

        {/* Global Error Notice if present */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 sm:mb-6 p-3 sm:p-3.5 rounded-2xl bg-red-950/70 border border-red-800/80 text-red-200 text-xs text-center font-medium flex items-center justify-center gap-2 shadow-lg min-w-0"
          >
            <span className="shrink-0">⚠️</span>
            <span className="break-words">{errorMessage}</span>
          </motion.div>
        )}

        {/* Child Panels */}
        <div className="space-y-4 sm:space-y-6 flex-1 flex flex-col justify-start w-full min-w-0 max-w-full">
          {children}
        </div>
      </main>
    </div>
  );
};
