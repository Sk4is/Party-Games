import React from 'react';
import { EntreToposRoomState } from '../../types/entreTopos';
import { MolePortrait } from './MolePortrait';
import { NotebookPanel } from './NotebookPanel';
import { Trophy, ArrowRight, Sparkles, Check, X, Crown } from 'lucide-react';
import { audio } from '../../utils/audio';

interface EntreToposRoundResultsViewProps {
  roomState: EntreToposRoomState;
  localPlayerId: string;
  onNextRound: () => void;
  onPlayAgain: () => void;
}

export const EntreToposRoundResultsView: React.FC<EntreToposRoundResultsViewProps> = ({
  roomState,
  localPlayerId,
  onNextRound,
  onPlayAgain,
}) => {
  const localPlayer = roomState.players.find((p) => p.id === localPlayerId);
  const isHost = localPlayer?.isHost ?? false;
  const isFinalRound = roomState.currentRound >= roomState.config.totalRounds;
  const summary = roomState.roundSummary;

  const topoPlayer = roomState.players.find((p) => p.id === summary?.topoPlayerId);
  const topoSucceeded = summary?.topoSucceeded ?? false;
  const topoGuessedSecretWord = summary?.topoGuessedSecretWord ?? false;

  // Sorted leaderboard by score
  const sortedPlayers = [...roomState.players].sort((a, b) => b.score - a.score);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 select-none animate-fade-in text-center items-center">
      {/* =========================================================================
          ROUND VICTORY BANNER
          ========================================================================= */}
      <div
        className={`w-full p-6 sm:p-8 rounded-3xl border-4 shadow-2xl flex flex-col items-center justify-center ${
          topoSucceeded
            ? 'bg-amber-950/85 border-amber-500 text-amber-100'
            : 'bg-emerald-950/85 border-emerald-500 text-emerald-100'
        }`}
      >
        <span className="text-4xl sm:text-5xl mb-2">
          {topoSucceeded ? '🕵️‍♂️' : '🎉'}
        </span>

        <h2 className="text-2xl sm:text-4xl font-black font-display tracking-wide uppercase mb-1">
          {topoSucceeded
            ? topoGuessedSecretWord
              ? '¡EL TOPO ROBÓ LA VICTORIA!'
              : '¡VICTORIA DEL TOPO!'
            : '¡VICTORIA DE LOS INOCENTES!'}
        </h2>

        <p className="text-sm sm:text-base font-bold max-w-xl text-slate-200">
          {topoSucceeded
            ? topoGuessedSecretWord
              ? `El Topo (${topoPlayer?.name}) fue descubierto, ¡pero adivinó la palabra secreta «${summary?.secretWord}» en su último intento y robó la partida!`
              : `Nadie descubrió al Topo (${topoPlayer?.name}). ¡Se infiltró y pasó completamente desapercibido!`
            : `¡Los inocentes desenmascararon a ${topoPlayer?.name} y el Topo no logró adivinar la palabra secreta!`}
        </p>

        {/* SECRET WORD BADGE */}
        <div className="mt-4 px-4 py-2 rounded-2xl bg-black/40 border border-white/20 flex items-center gap-2 text-xs sm:text-sm font-black uppercase text-amber-300">
          <span>PALABRA SECRETA:</span>
          <span className="text-white text-base sm:text-lg underline underline-offset-4 decoration-rose-500 font-display">
            «{summary?.secretWord}»
          </span>
        </div>
      </div>

      {/* TWO COLUMNS: THE NOTEBOOK WITH REVEALED SECRET WORD + LEADERBOARD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start text-left">
        {/* LEFT: 16-WORD NOTEBOOK WITH REVEALED WORD */}
        <div className="lg:col-span-7">
          {roomState.board && (
            <NotebookPanel
              board={roomState.board}
              role="INOCENTE"
              revealedSecretWord={summary?.secretWord}
              isCompact={false}
            />
          )}
        </div>

        {/* RIGHT: ROUND SCORES & CLASSIFICATION */}
        <div className="lg:col-span-5 p-5 rounded-3xl bg-[#1e1b18]/90 border-2 border-[#3d3229] shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-black text-amber-200 uppercase tracking-wide font-display">
                CLASIFICACIÓN &bull; RONDA {roomState.currentRound} DE {roomState.config.totalRounds}
              </h3>
            </div>

            {/* Players ranking list */}
            <div className="flex flex-col gap-2.5 max-h-[300px] overflow-y-auto pr-1">
              {sortedPlayers.map((p, idx) => {
                const pointsGained = summary?.pointsAwarded[p.id] || 0;
                const wasTopo = p.id === summary?.topoPlayerId;

                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-3 rounded-2xl border ${
                      idx === 0
                        ? 'bg-amber-500/15 border-amber-400/60 shadow-md'
                        : 'bg-black/30 border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center font-mono font-black text-xs text-amber-400">
                        {idx + 1}º
                      </div>
                      <div className="w-9 h-9 rounded-xl overflow-hidden bg-black/40 flex items-center justify-center">
                        <MolePortrait customization={p.moleCustomization} size="xs" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-xs sm:text-sm text-white uppercase truncate max-w-[110px]">
                            {p.name}
                          </span>
                          {wasTopo && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono text-[9px] font-bold">
                              TOPO
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          +{pointsGained} pts en la ronda
                        </span>
                      </div>
                    </div>

                    <span className="font-mono font-black text-base sm:text-lg text-amber-300">
                      {p.score} pts
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* NEXT ROUND / FINAL PODIUM BUTTON */}
          <div className="mt-5 pt-4 border-t border-white/10">
            {isHost ? (
              <button
                type="button"
                onClick={() => {
                  audio.playTurnChange();
                  onNextRound();
                }}
                className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer font-display"
              >
                <span>{isFinalRound ? 'Ver podio final' : 'Siguiente ronda'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="text-center text-xs font-bold text-slate-400 py-2">
                Esperando a que el anfitrión avance...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
