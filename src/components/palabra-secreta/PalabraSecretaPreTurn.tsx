import React from 'react';
import { Play, Volume2, Eye, Mic, Clock, Sparkles } from 'lucide-react';
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

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 flex flex-col items-center text-center space-y-6 animate-fade-in">
      {/* Round & Match progress */}
      <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300">
        <span>Ronda {roomState.currentRound} de {roomState.totalRounds}</span>
        <span>&bull;</span>
        <span>Turno {roomState.currentTurnNumber} de {roomState.totalTurnsInMatch}</span>
      </div>

      {/* Team Turn Announcement */}
      <div className="space-y-2">
        <span
          className="text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border"
          style={{
            borderColor: `${activeTeam.color}60`,
            backgroundColor: `${activeTeam.color}20`,
            color: activeTeam.color,
          }}
        >
          Próximo Turno
        </span>
        <h2
          className="text-4xl sm:text-5xl font-black font-display tracking-tight"
          style={{ color: activeTeam.color }}
        >
          {activeTeam.name}
        </h2>
      </div>

      {/* Active Descriptor Card */}
      <div className="w-full p-6 sm:p-8 rounded-3xl bg-slate-900/90 border-2 border-slate-800 shadow-2xl relative overflow-hidden">
        <div
          className="absolute top-0 left-0 right-0 h-1.5"
          style={{ backgroundColor: activeTeam.color }}
        />

        <div className="flex flex-col items-center space-y-3">
          <div className="text-5xl sm:text-6xl animate-bounce">
            {descriptor?.avatar || '🗣️'}
          </div>

          <div>
            <div className="text-xs font-black uppercase tracking-wider text-slate-400">
              Descriptor del Turno
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {descriptor?.name || 'Jugador'}
            </div>
          </div>

          {/* Role specific message */}
          <div className="w-full pt-4 mt-2 border-t border-slate-800 text-sm sm:text-base">
            {isDescriptor && (
              <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold flex items-center justify-center gap-2.5">
                <Mic className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>¡Te toca describir! Verás la palabra secreta. Descríbela sin decir las palabras prohibidas.</span>
              </div>
            )}

            {isTeammate && (
              <div className="p-4 rounded-2xl bg-teal-500/15 border border-teal-500/40 text-teal-300 font-bold flex items-center justify-center gap-2.5">
                <Volume2 className="w-5 h-5 text-teal-400 shrink-0" />
                <span>¡Tu equipo adivina! Escucha a {descriptor?.name} y grita tus respuestas en voz alta.</span>
              </div>
            )}

            {isRival && (
              <div className="p-4 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 font-bold flex items-center justify-center gap-2.5">
                <Eye className="w-5 h-5 text-amber-400 shrink-0" />
                <span>¡Equipo rival! Verás la palabra para vigilar que {descriptor?.name} no diga ninguna palabra prohibida.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Countdown Clock or Start Button */}
      <div className="space-y-3 pt-2 w-full max-w-xs">
        <div className="flex items-center justify-center gap-3">
          <div className="w-16 h-16 rounded-full bg-slate-900 border-2 border-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <span className="text-2xl font-black text-emerald-400 font-mono animate-pulse">
              {roomState.preTurnCountdown ?? 4}
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-400 font-medium">
          El turno comienza automáticamente en unos segundos...
        </p>

        {(isDescriptor || isHost) && (
          <button
            id="btn-pre-turn-start-now"
            type="button"
            onClick={onStartNow}
            className="w-full py-3 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-500/25"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>¡Empezar Turno Ya!</span>
          </button>
        )}
      </div>
    </div>
  );
};
