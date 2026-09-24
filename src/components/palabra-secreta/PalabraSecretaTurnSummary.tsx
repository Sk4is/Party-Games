import React from 'react';
import {
  CheckCircle2,
  XCircle,
  SkipForward,
  ArrowRight,
  Trophy,
  Sparkles,
  KeyRound,
  Smile,
  Zap,
  AlertTriangle,
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

  const mode = roomState.config.gameMode || 'CLASSIC';
  const summary = roomState.lastTurnSummary;

  const pointsGained = summary?.pointsGained ?? roomState.turnPoints;

  // Classic stats
  const guessedCount = roomState.turnWordsHistory.filter((w) => w.status === 'GUESSED').length;
  const skippedCount = roomState.turnWordsHistory.filter((w) => w.status === 'SKIPPED').length;
  const tabooCount = roomState.turnWordsHistory.filter((w) => w.status === 'TABOO').length;

  // Password stats
  const pwd = summary?.passwordSummary;

  // Emoji stats
  const emj = summary?.emojiSummary;

  return (
    <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6 text-center animate-fade-in min-w-0">
      {/* Header */}
      <div className="space-y-1 min-w-0 px-1">
        <span
          className="text-[10px] sm:text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border inline-block"
          style={{
            borderColor: `${activeTeam.color}60`,
            backgroundColor: `${activeTeam.color}20`,
            color: activeTeam.color,
          }}
        >
          Fin del Turno &bull; {mode === 'PASSWORD' ? '🔑 Contraseña' : mode === 'EMOJI' ? '😀 Emoji Misterioso' : '🗣️ Clásico'}
        </span>
        <h2 className="text-2xl xs:text-3xl sm:text-4xl font-black font-display text-white break-words">
          Turno completado para {activeTeam.name}
        </h2>
        <p className="text-slate-400 text-xs sm:text-sm truncate">
          {mode === 'EMOJI' ? 'Pistas emoji creadas por' : 'Descriptor'}: <strong className="text-slate-200">{descriptor?.name}</strong>
        </p>
      </div>

      {/* Main Points Card */}
      <div className="p-4 sm:p-6 rounded-3xl bg-slate-900/90 border-2 border-emerald-500/40 shadow-xl space-y-3 sm:space-y-4 min-w-0">
        <div className="flex flex-col items-center">
          <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">
            Puntos obtenidos este turno
          </span>
          <span
            className={`font-mono text-4xl sm:text-6xl font-black ${
              pointsGained < 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {pointsGained > 0 ? `+${pointsGained}` : pointsGained}
          </span>
        </div>

        {/* MODE 1: CLÁSICO BREAKDOWN */}
        {mode === 'CLASSIC' && (
          <div className="grid grid-cols-3 gap-1.5 xs:gap-2 pt-2 border-t border-slate-800 text-[11px] sm:text-xs font-bold">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-300 flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Acertadas</span>
              </div>
              <span className="font-mono text-base font-black">{guessedCount}</span>
            </div>

            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-300 flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-1">
                <SkipForward className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">Saltadas</span>
              </div>
              <span className="font-mono text-base font-black">{skippedCount}</span>
            </div>

            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-300 flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">Faltas</span>
              </div>
              <span className="font-mono text-base font-black">{tabooCount}</span>
            </div>
          </div>
        )}

        {/* MODE 2: CONTRASEÑA BREAKDOWN */}
        {mode === 'PASSWORD' && (
          <div className="space-y-3 pt-2 border-t border-slate-800 text-xs">
            <div className="grid grid-cols-2 gap-2 font-bold">
              <div className="p-2.5 sm:p-3 rounded-2xl bg-emerald-500/10 text-emerald-300 flex flex-col items-center gap-0.5">
                <span className="text-[10px] sm:text-[11px] text-slate-400">Palabras Adivinadas</span>
                <span className="font-mono text-lg sm:text-xl font-black">
                  {pwd ? `${pwd.correctCount} / ${pwd.totalTargets}` : `${roomState.passwordCorrectCount || 0} / 10`}
                </span>
              </div>

              <div className="p-2.5 sm:p-3 rounded-2xl bg-amber-500/10 text-amber-300 flex flex-col items-center gap-0.5">
                <span className="text-[10px] sm:text-[11px] text-slate-400">Pistas Usadas</span>
                <span className="font-mono text-lg sm:text-xl font-black">
                  {pwd ? `${pwd.clueWordCount} / ${pwd.budget}` : `${roomState.passwordClueWordCount || 0} / 15`}
                </span>
              </div>
            </div>

            {/* Efficiency multiplier or penalty notice */}
            {pwd && (
              <div
                className={`p-3 rounded-2xl border text-center font-bold flex items-center justify-center gap-2 text-xs ${
                  pwd.multiplier && pwd.multiplier > 1.0
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : pwd.overBudgetWords && pwd.overBudgetWords > 0
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                    : 'bg-slate-800/80 border-slate-700 text-slate-300'
                }`}
              >
                {pwd.multiplier && pwd.multiplier > 1.0 && (
                  <>
                    <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>¡Gran eficiencia! Bonificación: x{pwd.multiplier.toFixed(1)}</span>
                  </>
                )}
                {pwd.overBudgetWords && pwd.overBudgetWords > 0 && (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Presupuesto superado por {pwd.overBudgetWords} palabras (-{pwd.penalty} pts)</span>
                  </>
                )}
                {(!pwd.multiplier || pwd.multiplier === 1.0) && (!pwd.overBudgetWords || pwd.overBudgetWords === 0) && (
                  <span>Exactamente 15 pistas utilizadas.</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* MODE 3: EMOJI BREAKDOWN */}
        {mode === 'EMOJI' && (
          <div className="space-y-3 pt-2 border-t border-slate-800 text-xs">
            <div className="grid grid-cols-2 gap-2 font-bold">
              <div className="p-2.5 sm:p-3 rounded-2xl bg-emerald-500/10 text-emerald-300 flex flex-col items-center gap-0.5">
                <span className="text-[10px] sm:text-[11px] text-slate-400">Títulos Acertados</span>
                <span className="font-mono text-lg sm:text-xl font-black">
                  {emj ? emj.correctCount : roomState.emojiCorrectCount || 0}
                </span>
              </div>

              <div className="p-2.5 sm:p-3 rounded-2xl bg-rose-500/10 text-rose-300 flex flex-col items-center gap-0.5">
                <span className="text-[10px] sm:text-[11px] text-slate-400">Pasados (-1 c/u)</span>
                <span className="font-mono text-lg sm:text-xl font-black">
                  {emj ? emj.skipCount : roomState.emojiSkipCount || 0}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-center text-slate-300 font-semibold text-[11px] sm:text-xs">
              Puntuación final del turno = Aciertos ({emj?.correctCount || 0}) − Pasadas ({emj?.skipCount || 0})
            </div>
          </div>
        )}
      </div>

      {/* Match Scoreboard comparison */}
      <div className="p-3.5 sm:p-4 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-2.5 sm:space-y-3 min-w-0">
        <div className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-slate-400 flex items-center justify-center gap-1.5">
          <Trophy className="w-3.5 h-3.5 text-amber-400" /> Marcador General
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div
            className={`p-2.5 sm:p-3 rounded-2xl border min-w-0 ${
              team1.score > team2.score
                ? 'bg-emerald-500/15 border-emerald-500/50'
                : 'bg-slate-800/60 border-slate-700'
            }`}
          >
            <div className="text-[11px] sm:text-xs font-bold text-slate-300 truncate">{team1.name}</div>
            <div className="font-mono text-xl sm:text-2xl font-black text-emerald-400">{team1.score} pts</div>
          </div>

          <div
            className={`p-2.5 sm:p-3 rounded-2xl border min-w-0 ${
              team2.score > team1.score
                ? 'bg-cyan-500/15 border-cyan-500/50'
                : 'bg-slate-800/60 border-slate-700'
            }`}
          >
            <div className="text-[11px] sm:text-xs font-bold text-slate-300 truncate">{team2.name}</div>
            <div className="font-mono text-xl sm:text-2xl font-black text-cyan-400">{team2.score} pts</div>
          </div>
        </div>
      </div>

      {/* Classic Words history list */}
      {mode === 'CLASSIC' && roomState.turnWordsHistory.length > 0 && (
        <div className="p-3 sm:p-4 rounded-3xl bg-slate-900/60 border border-slate-800/80 text-left space-y-2 min-w-0">
          <div className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Detalle de palabras jugadas:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 max-h-48 overflow-y-auto pr-1">
            {roomState.turnWordsHistory.map((w, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 text-xs font-bold min-w-0 gap-2"
              >
                <span className="text-slate-200 uppercase truncate">{w.word}</span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-black shrink-0 ${
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
      <button
        id="btn-next-turn"
        type="button"
        onClick={onNextTurn}
        className="w-full py-3.5 sm:py-4 px-4 sm:px-6 rounded-2xl bg-[#10B981] hover:bg-[#059669] text-slate-950 font-black text-xs xs:text-sm uppercase tracking-wider transition-all shadow-xl shadow-[#10B981]/25 active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
      >
        <span>Siguiente Turno</span>
        <ArrowRight className="w-4 h-4 shrink-0" />
      </button>
    </div>
  );
};
