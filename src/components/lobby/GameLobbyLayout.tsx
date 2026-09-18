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
      : 'text-[#FFB000]';

  const usersIconColor =
    gameType === 'la-peor-respuesta'
      ? 'text-[#FF3B4F]'
      : gameType === 'pinturillo'
      ? 'text-[#00BCEB]'
      : 'text-[#FFB000]';

  return (
    <div className="min-h-screen bg-[#070b14] text-stone-100 flex flex-col p-4 sm:p-6 md:p-8 font-sans select-none relative overflow-x-hidden">
      {/* Top Header Bar */}
      <header className="w-full max-w-3xl mx-auto flex items-center justify-between gap-3 pb-5 mb-2 border-b border-stone-800/60">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-stone-900/90 text-stone-300 hover:text-white hover:bg-stone-800 border border-stone-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{backLabel}</span>
        </button>

        <div className="flex items-center gap-2">
          {roomCode ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-900/90 border border-stone-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-stone-400">
                Sala <strong className={`font-mono font-bold ${roomCodeColor}`}>{roomCode}</strong>
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Multijugador online</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full max-w-3xl mx-auto flex-1 flex flex-col py-4 sm:py-6">
        {/* Game Title & Meta Card/Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center text-4xl sm:text-5xl mb-2.5 drop-shadow-sm">
            {icon}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-[42px] font-black tracking-tight text-white uppercase leading-none mb-2">
            {title}
          </h1>

          {description && (
            <p className="max-w-xl mx-auto text-xs sm:text-sm text-stone-400 leading-relaxed font-medium mb-3">
              {description}
            </p>
          )}

          <div className="inline-flex items-center justify-center gap-3 text-xs text-stone-400 font-medium">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-900/60 border border-stone-800/80">
              <Users className={`w-3.5 h-3.5 ${usersIconColor}`} />
              <span>{minPlayers}–{maxPlayers} jugadores</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-900/60 border border-stone-800/80">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span>Partida en tiempo real</span>
            </span>
          </div>
        </div>

        {/* Global Error Notice if present */}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-3.5 rounded-2xl bg-red-950/70 border border-red-800/80 text-red-200 text-xs text-center font-medium flex items-center justify-center gap-2 shadow-lg"
          >
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </motion.div>
        )}

        {/* Child Panels */}
        <div className="space-y-6 sm:space-y-8 flex-1 flex flex-col justify-start">
          {children}
        </div>
      </main>
    </div>
  );
};
