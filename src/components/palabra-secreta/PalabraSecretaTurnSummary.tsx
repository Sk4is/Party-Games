import React from 'react';
import {
  CheckCircle2,
  XCircle,
  SkipForward,
  ArrowRight,
  Trophy,
  Sparkles,
} from 'lucide-react';
import { PalabraSecretaRoomState } from '../../types/palabraSecreta';

interface PalabraSecretaTurnSummaryProps {
  roomState: PalabraSecretaRoomState;
  isHost: boolean;
  onNextTurn: () => void;
}

export const PalabraSecretaTurnSummary: React.FC<PalabraSecretaTurnSummaryProps> = ({
  roomState,
  isHost,
  onNextTurn,
}) => {
  const activeTeam = roomState.teams[roomState.activeTeamId];
  const descriptor = roomState.players.find((p) => p.id === roomState.activeDescriptorId);

  const team1 = roomState.teams['team-1'];
  const team2 = roomState.teams['team-2'];

  const guessedCount = roomState.turnWordsHistory.filter((w) => w.status === 'GUESSED').length;
  const skippedCount = roomState.turnWordsHistory.filter((w) => w.status === 'SKIPPED').length;
  const tabooCount = roomState.turnWordsHistory.filter((w) => w.status === 'TABOO').length;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-6 space-y-6 text-center animate-fade-in">
      {/* Header */}
      <div className="space-y-1">
        <span
          className="text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border"
          style={{
            borderColor: `${activeTeam.color}60`,
            backgroundColor: `${activeTeam.color}20`,
            color: activeTeam.color,
          }}
        >
          Fin del Turno
        </span>
        <h2 className="text-3xl sm:text-4xl font-black font-display text-white">
          ¡Tiempo agotado para {activeTeam.name}!
        </h2>
        <p className="text-slate-400 text-sm">
          Descriptor: <strong className="text-slate-200">{descriptor?.name}</strong>
        </p>
      </div>

      {/* Points Card */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border-2 border-emerald-500/40 shadow-xl space-y-4">
        <div className="flex flex-col items-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Puntos obtenidos este turno
          </span>
          <span className="font-mono text-5xl sm:text-6xl font-black text-emerald-400">
            {roomState.turnPoints > 0 ? `+${roomState.turnPoints}` : roomState.turnPoints}
          </span>
        </div>

        {/* Breakdown chips */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-xs font-bold">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-300 flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Acertadas</span>
            </div>
            <span className="font-mono text-base font-black">{guessedCount}</span>
          </div>

          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-300 flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1">
              <SkipForward className="w-3.5 h-3.5 text-amber-400" />
              <span>Saltadas (-1)</span>
            </div>
            <span className="font-mono text-base font-black">{skippedCount}</span>
          </div>

          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-300 flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" />
              <span>Faltas</span>
            </div>
            <span className="font-mono text-base font-black">{tabooCount}</span>
          </div>
        </div>
      </div>

      {/* Match Scoreboard comparison */}
      <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center justify-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-amber-400" /> Marcador General
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div
            className={`p-3 rounded-2xl border ${
              team1.score > team2.score
                ? 'bg-emerald-500/15 border-emerald-500/50'
                : 'bg-slate-800/60 border-slate-700'
            }`}
          >
            <div className="text-xs font-bold text-slate-300 truncate">{team1.name}</div>
            <div className="font-mono text-2xl font-black text-emerald-400">{team1.score} pts</div>
          </div>

          <div
            className={`p-3 rounded-2xl border ${
              team2.score > team1.score
                ? 'bg-cyan-500/15 border-cyan-500/50'
                : 'bg-slate-800/60 border-slate-700'
            }`}
          >
            <div className="text-xs font-bold text-slate-300 truncate">{team2.name}</div>
            <div className="font-mono text-2xl font-black text-cyan-400">{team2.score} pts</div>
          </div>
        </div>
      </div>

      {/* Words history list */}
      {roomState.turnWordsHistory.length > 0 && (
        <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800/80 text-left space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Detalle de palabras jugadas:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
            {roomState.turnWordsHistory.map((w, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 text-xs font-bold"
              >
                <span className="text-slate-200 uppercase">{w.word}</span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[11px] font-black ${
                    w.status === 'GUESSED'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : w.status === 'SKIPPED'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {w.status === 'GUESSED' ? '+1 Acertada' : w.status === 'SKIPPED' ? '-1 Saltada' : '-1 Falta'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next turn button */}
      <div className="pt-2">
        {isHost ? (
          <button
            id="btn-next-turn"
            type="button"
            onClick={onNextTurn}
            className="w-full py-4 rounded-3xl bg-emerald-500 hover:bg-emerald-400 active:scale-98 text-slate-950 font-black text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/30 transition-all cursor-pointer"
          >
            <span>Siguiente Turno</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 font-semibold flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Esperando a que el anfitrión inicie el siguiente turno...</span>
          </div>
        )}
      </div>
    </div>
  );
};
