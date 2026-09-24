import React from 'react';
import {
  Trophy,
  RotateCcw,
  Home,
  Crown,
  Medal,
  Sparkles,
} from 'lucide-react';
import { PalabraSecretaRoomState } from '../../types/palabraSecreta';

interface PalabraSecretaPodiumProps {
  roomState: PalabraSecretaRoomState;
  isHost: boolean;
  onPlayAgain: () => void;
  onExit: () => void;
}

export const PalabraSecretaPodium: React.FC<PalabraSecretaPodiumProps> = ({
  roomState,
  isHost,
  onPlayAgain,
  onExit,
}) => {
  const team1 = roomState.teams['team-1'];
  const team2 = roomState.teams['team-2'];

  const isTie = team1.score === team2.score;
  const winningTeam = team1.score > team2.score ? team1 : team2;
  const losingTeam = team1.score > team2.score ? team2 : team1;

  const winningPlayers = roomState.players.filter((p) =>
    winningTeam.playerIds.includes(p.id)
  );
  const losingPlayers = roomState.players.filter((p) =>
    losingTeam.playerIds.includes(p.id)
  );

  return (
    <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 py-5 sm:py-8 space-y-4 sm:space-y-6 text-center animate-fade-in min-w-0">
      {/* Trophy & Winner banner */}
      <div className="space-y-2 sm:space-y-3 min-w-0 px-1">
        <div className="relative inline-flex items-center justify-center">
          <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center animate-bounce">
            <Trophy className="w-10 h-10 sm:w-16 sm:h-16 text-amber-400" />
          </div>
        </div>

        {isTie ? (
          <div className="space-y-1">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-400">
              Resultado Final
            </span>
            <h1 className="text-3xl xs:text-4xl sm:text-5xl font-black font-display text-white break-words">
              ¡EMPATE TÉCNICO!
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm">
              Ambos equipos han demostrado una sincronización asombrosa con {team1.score} puntos.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-amber-400 flex items-center justify-center gap-1">
              <Crown className="w-4 h-4 text-amber-400" /> ¡Equipo Campeón!
            </span>
            <h1
              className="text-3xl xs:text-4xl sm:text-5xl font-black font-display tracking-tight break-words px-1"
              style={{ color: winningTeam.color }}
            >
              {winningTeam.name}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm">
              ¡Victoria indiscutible con una puntuación final de {winningTeam.score} puntos!
            </p>
          </div>
        )}
      </div>

      {/* Podium Cards comparison */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 min-w-0">
        {/* 1st Place Card */}
        <div
          className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border-2 shadow-2xl relative overflow-hidden text-left min-w-0"
          style={{ borderColor: `${winningTeam.color}60` }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-1.5"
            style={{ backgroundColor: winningTeam.color }}
          />

          <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-slate-800 gap-2 min-w-0">
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <Medal className="w-3.5 h-3.5 shrink-0" /> 1er Lugar
              </span>
              <h3 className="text-lg sm:text-xl font-black text-white font-display truncate">
                {winningTeam.name}
              </h3>
            </div>
            <div className="font-mono text-2xl sm:text-3xl font-black shrink-0" style={{ color: winningTeam.color }}>
              {winningTeam.score} pts
            </div>
          </div>

          <div className="py-2.5 sm:py-3 space-y-1.5 min-w-0">
            <span className="text-[11px] sm:text-xs font-bold text-slate-400">Integrantes:</span>
            <div className="flex flex-wrap gap-1.5">
              {winningPlayers.map((p) => (
                <span
                  key={p.id}
                  className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-xl bg-slate-800 border border-slate-700 text-[11px] sm:text-xs font-bold text-slate-200 flex items-center gap-1 max-w-full"
                >
                  <span className="shrink-0">{p.avatar}</span>
                  <span className="truncate">{p.name}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 2nd Place Card */}
        <div
          className="p-4 sm:p-5 rounded-3xl bg-slate-900/70 border border-slate-800 text-left relative overflow-hidden opacity-90 min-w-0"
        >
          <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-slate-800 gap-2 min-w-0">
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-slate-400">
                2º Lugar
              </span>
              <h3 className="text-lg sm:text-xl font-black text-slate-200 font-display truncate">
                {losingTeam.name}
              </h3>
            </div>
            <div className="font-mono text-xl sm:text-2xl font-black text-slate-400 shrink-0">
              {losingTeam.score} pts
            </div>
          </div>

          <div className="py-2.5 sm:py-3 space-y-1.5 min-w-0">
            <span className="text-[11px] sm:text-xs font-bold text-slate-400">Integrantes:</span>
            <div className="flex flex-wrap gap-1.5">
              {losingPlayers.map((p) => (
                <span
                  key={p.id}
                  className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-xl bg-slate-800/80 border border-slate-700/60 text-[11px] sm:text-xs font-bold text-slate-300 flex items-center gap-1 max-w-full"
                >
                  <span className="shrink-0">{p.avatar}</span>
                  <span className="truncate">{p.name}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 sm:pt-4 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3">
        {isHost ? (
          <button
            id="btn-play-again-palabra-secreta"
            type="button"
            onClick={onPlayAgain}
            className="w-full sm:w-auto px-5 sm:px-8 py-3.5 sm:py-4 rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 active:scale-98 text-slate-950 font-black text-xs xs:text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/30 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
            <span>Revancha (Jugar de nuevo)</span>
          </button>
        ) : (
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 font-semibold">
            Esperando a que el anfitrión pulse revancha...
          </div>
        )}

        <button
          id="btn-exit-to-menu-palabra-secreta"
          type="button"
          onClick={onExit}
          className="w-full sm:w-auto px-4 sm:px-6 py-3.5 sm:py-4 rounded-3xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs xs:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-700"
        >
          <Home className="w-4 h-4 shrink-0" />
          <span>Volver al menú principal</span>
        </button>
      </div>
    </div>
  );
};
