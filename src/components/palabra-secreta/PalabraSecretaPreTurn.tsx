import React from 'react';
import { Play, Volume2, Eye, Mic, Clock, Sparkles, KeyRound, Smile } from 'lucide-react';
import { PalabraSecretaRoomState } from '../../types/palabraSecreta';

interface PalabraSecretaPreTurnProps {
  roomState: PalabraSecretaRoomState;
  localPlayerId: string;
  onStartNow: () => void;
}

export const PalabraSecretaPreTurn: React.FC<PalabraSecretaPreTurnProps> = ({
  roomState,
  localPlayerId,
  onStartNow,
}) => {
  const activeTeam = roomState.teams[roomState.activeTeamId];
  const descriptor = roomState.players.find((p) => p.id === roomState.activeDescriptorId);

  const isDescriptor = roomState.activeDescriptorId === localPlayerId;
  const isTeammate =
    roomState.players.find((p) => p.id === localPlayerId)?.teamId === roomState.activeTeamId &&
    !isDescriptor;
  const isRival =
    roomState.players.find((p) => p.id === localPlayerId)?.teamId !== roomState.activeTeamId;

  const isHost = roomState.hostId === localPlayerId;
  const mode = roomState.config.gameMode || 'CLASSIC';

  const modeName =
    mode === 'PASSWORD' ? '🔑 Contraseña' : mode === 'EMOJI' ? '😀 Emoji Misterioso' : '🗣️ Clásico';

  return (
    <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-8 flex flex-col items-center text-center space-y-4 sm:space-y-6 animate-fade-in min-w-0">
      {/* Round & Match progress */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 xs:gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] sm:text-xs font-bold text-slate-300">
        <span className="text-[#10B981] font-black">{modeName}</span>
        <span>&bull;</span>
        <span>Ronda {roomState.currentRound} de {roomState.totalRounds}</span>
        <span>&bull;</span>
        <span>Turno {roomState.currentTurnNumber} de {roomState.totalTurnsInMatch}</span>
      </div>

      {/* Team Turn Announcement */}
      <div className="space-y-1.5 min-w-0 max-w-full px-2">
        <span
          className="text-[10px] sm:text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border inline-block"
          style={{
            borderColor: `${activeTeam.color}60`,
            backgroundColor: `${activeTeam.color}20`,
            color: activeTeam.color,
          }}
        >
          Próximo Turno
        </span>
        <h2
          className="text-2xl xs:text-3xl sm:text-5xl font-black font-display tracking-tight break-words"
          style={{ color: activeTeam.color }}
        >
          {activeTeam.name}
        </h2>
      </div>

      {/* Active Descriptor Card */}
      <div className="w-full p-4 sm:p-8 rounded-3xl bg-slate-900/90 border-2 border-slate-800 shadow-2xl relative overflow-hidden min-w-0">
        <div
          className="absolute top-0 left-0 right-0 h-1.5"
          style={{ backgroundColor: activeTeam.color }}
        />

        <div className="flex flex-col items-center space-y-2.5 sm:space-y-3 min-w-0">
          <div className="text-4xl sm:text-6xl animate-bounce">
            {descriptor?.avatar || '🗣️'}
          </div>

          <div className="min-w-0 max-w-full px-2">
            <div className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-400">
              {mode === 'EMOJI' ? 'Creador de Emojis' : 'Descriptor del Turno'}
            </div>
            <div className="text-xl sm:text-3xl font-black text-white truncate">
              {descriptor?.name || 'Jugador'}
            </div>
          </div>

          {/* Role specific message */}
          <div className="w-full pt-3 sm:pt-4 mt-1 sm:mt-2 border-t border-slate-800 text-xs sm:text-sm">
            {/* CLASSIC MESSAGES */}
            {mode === 'CLASSIC' && (
              <>
                {isDescriptor && (
                  <div className="p-3 sm:p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold flex items-center justify-center gap-2">
                    <Mic className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="leading-snug">¡Te toca describir! Verás la palabra secreta. Descríbela sin decir las palabras prohibidas.</span>
                  </div>
                )}
                {isTeammate && (
                  <div className="p-3 sm:p-4 rounded-2xl bg-teal-500/15 border border-teal-500/40 text-teal-300 font-bold flex items-center justify-center gap-2">
                    <Volume2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span className="leading-snug">¡Tu equipo adivina! Escucha a {descriptor?.name} y grita tus respuestas en voz alta.</span>
                  </div>
                )}
                {isRival && (
                  <div className="p-3 sm:p-4 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 font-bold flex items-center justify-center gap-2">
                    <Eye className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="leading-snug">¡Equipo rival! Verás la palabra para vigilar que {descriptor?.name} no diga palabras prohibidas.</span>
                  </div>
                )}
              </>
            )}

            {/* PASSWORD MESSAGES */}
            {mode === 'PASSWORD' && (
              <>
                {isDescriptor && (
                  <div className="p-3 sm:p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold flex items-center justify-center gap-2">
                    <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="leading-snug">¡Te toca dar pistas! Tienes 10 palabras y 15 pistas verbales. ¡Usa los botones + y - para registrar cada pista!</span>
                  </div>
                )}
                {isTeammate && (
                  <div className="p-3 sm:p-4 rounded-2xl bg-teal-500/15 border border-teal-500/40 text-teal-300 font-bold flex items-center justify-center gap-2">
                    <Volume2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span className="leading-snug">¡Tu equipo adivina! {descriptor?.name} tiene 10 palabras secretas y 15 pistas. ¡Adivinad en voz alta rápido!</span>
                  </div>
                )}
                {isRival && (
                  <div className="p-3 sm:p-4 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 font-bold flex items-center justify-center gap-2">
                    <Eye className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="leading-snug">¡Equipo rival! Observa el contador de pistas de {descriptor?.name}. Verás si se mantiene dentro del presupuesto.</span>
                  </div>
                )}
              </>
            )}

            {/* EMOJI MESSAGES */}
            {mode === 'EMOJI' && (
              <>
                {isDescriptor && (
                  <div className="p-3 sm:p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold flex items-center justify-center gap-2">
                    <Smile className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="leading-snug">¡Te toca dar pistas en emojis! Elegirás 1 de 3 opciones y escribirás hasta 5 emojis para que tu equipo adivine.</span>
                  </div>
                )}
                {isTeammate && (
                  <div className="p-3 sm:p-4 rounded-2xl bg-teal-500/15 border border-teal-500/40 text-teal-300 font-bold flex items-center justify-center gap-2">
                    <Volume2 className="w-4 h-4 text-teal-400 shrink-0" />
                    <span className="leading-snug">¡Tu equipo adivina! {descriptor?.name} enviará emojis en directo a la pantalla. ¡Decid títulos en voz alta!</span>
                  </div>
                )}
                {isRival && (
                  <div className="p-3 sm:p-4 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 font-bold flex items-center justify-center gap-2">
                    <Eye className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="leading-snug">¡Equipo rival! Observa los emojis en directo que compone {descriptor?.name}.</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Countdown display */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
          <Clock className="w-4 h-4 text-[#10B981]" />
          <span>El turno comienza en</span>
        </div>
        <div className="text-6xl sm:text-7xl font-black font-mono text-white animate-pulse">
          {roomState.preTurnCountdown !== undefined ? roomState.preTurnCountdown : 3}
        </div>
      </div>

      {/* Start turn now button (descriptor or host can bypass countdown) */}
      {(isDescriptor || isHost) && (
        <button
          type="button"
          onClick={onStartNow}
          className="px-6 py-3 rounded-2xl bg-[#10B981] hover:bg-[#059669] text-slate-950 font-black text-sm uppercase tracking-wider transition-all shadow-xl shadow-[#10B981]/25 active:scale-95 flex items-center gap-2 cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Empezar ya</span>
        </button>
      )}
    </div>
  );
};
