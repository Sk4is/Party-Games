import React, { useEffect } from 'react';
import {
  Check,
  SkipForward,
  AlertTriangle,
  Clock,
  Volume2,
  Eye,
  Shield,
  Sparkles,
} from 'lucide-react';
import { PalabraSecretaRoomState } from '../../types/palabraSecreta';

interface PalabraSecretaActiveTurnProps {
  roomState: PalabraSecretaRoomState;
  localPlayerId: string;
  onMarkGuessed: () => void;
  onSkipWord: () => void;
  onMarkTaboo: () => void;
}

export const PalabraSecretaActiveTurn: React.FC<PalabraSecretaActiveTurnProps> = ({
  roomState,
  localPlayerId,
  onMarkGuessed,
  onSkipWord,
  onMarkTaboo,
}) => {
  const activeTeam = roomState.teams[roomState.activeTeamId];
  const descriptor = roomState.players.find((p) => p.id === roomState.activeDescriptorId);

  const isDescriptor = roomState.activeDescriptorId === localPlayerId;
  const isTeammate =
    roomState.players.find((p) => p.id === localPlayerId)?.teamId === roomState.activeTeamId &&
    !isDescriptor;
  const isRival =
    roomState.players.find((p) => p.id === localPlayerId)?.teamId !== roomState.activeTeamId;

  const currentWord = roomState.currentWord;
  const remainingTime = roomState.turnRemainingSeconds;
  const totalTime = roomState.config.timePerTurn;
  const progressPercent = Math.max(0, Math.min(100, (remainingTime / totalTime) * 100));

  const isLowTime = remainingTime <= 10;
  const isCriticalTime = remainingTime <= 5;

  const skipsLeft =
    roomState.config.maxSkipsPerTurn === -1
      ? '∞'
      : Math.max(0, roomState.config.maxSkipsPerTurn - roomState.turnSkipsUsed);

  const canSkip =
    roomState.config.maxSkipsPerTurn === -1 ||
    (typeof skipsLeft === 'number' && skipsLeft > 0);

  // Keyboard shortcut for descriptor (Spacebar or Enter for Acertada, S/P/Right for Saltar)
  useEffect(() => {
    if (!isDescriptor) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        onMarkGuessed();
      } else if (e.code === 'KeyS' || e.code === 'KeyP' || e.code === 'ArrowRight') {
        e.preventDefault();
        if (canSkip) onSkipWord();
      } else if (e.code === 'KeyT') {
        e.preventDefault();
        onMarkTaboo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDescriptor, onMarkGuessed, onSkipWord, onMarkTaboo, canSkip]);

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-4 space-y-4">
      {/* Top Bar: Team Scores & Active Turn Indicator */}
      <div className="flex items-center justify-between gap-2 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs sm:text-sm">
        {/* Team 1 Score */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-400" />
          <span className="font-bold text-slate-300 truncate max-w-[120px] sm:max-w-[160px]">
            {roomState.teams['team-1'].name}
          </span>
          <span className="px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-black font-mono">
            {roomState.teams['team-1'].score} pts
          </span>
        </div>

        {/* Turn points so far */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold">
          <span>Este turno:</span>
          <span
            className={`font-black font-mono text-sm ${
              roomState.turnPoints < 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {roomState.turnPoints > 0 ? `+${roomState.turnPoints}` : roomState.turnPoints}
          </span>
        </div>

        {/* Team 2 Score */}
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 font-black font-mono">
            {roomState.teams['team-2'].score} pts
          </span>
          <span className="font-bold text-slate-300 truncate max-w-[120px] sm:max-w-[160px]">
            {roomState.teams['team-2'].name}
          </span>
          <div className="w-3 h-3 rounded-full bg-cyan-400" />
        </div>
      </div>

      {/* Timer Bar & Countdown */}
      <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full"
              style={{
                backgroundColor: `${activeTeam.color}20`,
                color: activeTeam.color,
              }}
            >
              Turno de {activeTeam.name}
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              Descriptor: <strong className="text-white">{descriptor?.name}</strong>
            </span>
          </div>

          {/* Big Digital Clock */}
          <div
            className={`flex items-center gap-1.5 font-mono text-2xl sm:text-3xl font-black ${
              isCriticalTime
                ? 'text-rose-500 animate-ping'
                : isLowTime
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>{remainingTime}s</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden relative">
          <div
            className={`h-full transition-all duration-1000 ease-linear rounded-full ${
              isCriticalTime
                ? 'bg-rose-500'
                : isLowTime
                ? 'bg-amber-400'
                : 'bg-emerald-400'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* VIEW 1: ACTIVE DESCRIPTOR */}
      {isDescriptor && (
        <div className="space-y-4">
          {/* Secret Word Display Card */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-emerald-500/60 shadow-2xl shadow-emerald-500/10 text-center space-y-4 relative overflow-hidden">
            {/* Top Category Tag */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Categoría: {currentWord?.category || 'General'}
            </div>

            {/* Huge Secret Word */}
            <div className="py-3">
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-black font-display tracking-tight text-white drop-shadow-md break-words uppercase">
                {currentWord?.word || 'Cargando...'}
              </h1>
            </div>

            {/* Forbidden / Taboo Words */}
            {currentWord?.forbidden && currentWord.forbidden.length > 0 && (
              <div className="pt-3 border-t border-slate-800/80 space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center justify-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" /> Palabras Prohibidas (No puedes decirlas ni derivarlas)
                </span>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  {currentWord.forbidden.map((fWord, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 font-bold text-sm sm:text-base line-through decoration-rose-500/60"
                    >
                      {fWord}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons for Descriptor */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. ¡ACERTADA! */}
            <button
              id="btn-mark-guessed"
              type="button"
              onClick={onMarkGuessed}
              className="sm:col-span-2 py-5 px-6 rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 active:scale-98 text-slate-950 font-black text-xl tracking-wide flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/30 transition-all cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-slate-950 text-emerald-400 flex items-center justify-center">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <div className="text-left leading-tight">
                <div>¡ACERTADA!</div>
                <div className="text-xs font-bold opacity-80">(+1 punto &bull; Espacio / Enter)</div>
              </div>
            </button>

            {/* 2. SALTAR */}
            <button
              id="btn-skip-word"
              type="button"
              disabled={!canSkip}
              onClick={onSkipWord}
              className={`py-5 px-4 rounded-3xl font-black text-base flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg ${
                canSkip
                  ? 'bg-amber-500/15 hover:bg-amber-500/25 active:scale-98 text-amber-200 border-2 border-amber-500/40 hover:border-amber-500/60'
                  : 'bg-slate-850 text-slate-600 border border-slate-800 cursor-not-allowed'
              }`}
            >
              <SkipForward className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="text-left leading-tight">
                <div className="text-lg">SALTAR</div>
                <div className="text-xs text-amber-300/80 font-bold">
                  -1 punto {skipsLeft !== '∞' ? `(${skipsLeft} restantes)` : ''}
                </div>
              </div>
            </button>
          </div>

          {/* Taboo Violation Button (smaller fallback button) */}
          <div className="flex justify-center pt-1">
            <button
              id="btn-mark-taboo"
              type="button"
              onClick={onMarkTaboo}
              className="px-4 py-2 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>He dicho una palabra prohibida (Falta / Tabú)</span>
            </button>
          </div>
        </div>
      )}

      {/* VIEW 2: TEAMMATES (GUESSERS) */}
      {isTeammate && (
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/90 border-2 border-teal-500/40 shadow-2xl text-center space-y-6">
          <div className="relative inline-flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-teal-500/20 border-2 border-teal-500/50 flex items-center justify-center animate-pulse">
              <Volume2 className="w-12 h-12 text-teal-300" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-4 w-4 bg-teal-500" />
            </span>
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black font-display text-white">
              ¡Escucha a {descriptor?.name}!
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Está describiendo la palabra secreta. Grita tus respuestas en voz alta sin parar. Cuando digas la respuesta exacta, {descriptor?.name} marcará <strong>¡Acertada!</strong>
            </p>
          </div>

          {/* Words Guessed This Turn Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-800/80 border border-slate-700">
            <span className="text-xs font-bold text-slate-400">Puntos en este turno:</span>
            <span
              className={`font-mono text-xl font-black ${
                roomState.turnPoints < 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {roomState.turnPoints > 0 ? `+${roomState.turnPoints}` : roomState.turnPoints}
            </span>
          </div>
        </div>
      )}

      {/* VIEW 3: RIVALS (SPECTATORS / REFEREES) */}
      {isRival && (
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border-2 border-amber-500/40 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Shield className="w-4 h-4" />
              <span>Modo Árbitro Rival</span>
            </div>
            <span className="text-xs text-slate-400">
              Vigila que no digan palabras prohibidas
            </span>
          </div>

          <div className="text-center space-y-3 py-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Palabra que está describiendo {descriptor?.name}:
            </span>
            <div className="text-3xl sm:text-5xl font-black font-display text-white tracking-wide uppercase">
              {currentWord?.word}
            </div>

            {currentWord?.forbidden && currentWord.forbidden.length > 0 && (
              <div className="pt-2">
                <div className="text-xs font-bold text-rose-400 mb-1.5">
                  Palabras prohibidas para {descriptor?.name}:
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {currentWord.forbidden.map((f, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Words played this turn ticker */}
      {roomState.turnWordsHistory.length > 0 && (
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-500 font-bold shrink-0">Palabras jugadas:</span>
          {roomState.turnWordsHistory.map((item, idx) => (
            <span
              key={idx}
              className={`shrink-0 px-2 py-0.5 rounded-md font-bold flex items-center gap-1 ${
                item.status === 'GUESSED'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : item.status === 'SKIPPED'
                  ? 'bg-slate-800 text-slate-400'
                  : 'bg-rose-500/20 text-rose-300'
              }`}
            >
              {item.status === 'GUESSED' ? '✓' : item.status === 'SKIPPED' ? '↷' : '✕'} {item.word}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
