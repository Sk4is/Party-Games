import React, { useEffect } from 'react';
import { LPRPlayer } from '../types';
import { Trophy, Crown, RotateCcw, Home, Sparkles, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audio } from '../utils/audio';

interface FinalResultsViewProps {
  players: LPRPlayer[];
  totalRoundsPlayed: number;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
}

export const FinalResultsView: React.FC<FinalResultsViewProps> = ({
  players,
  totalRoundsPlayed,
  onPlayAgain,
  onBackToMenu,
}) => {
  // Sort players by score descending
  const sorted = [...players].sort((a, b) => b.score - a.score);
  const highestScore = sorted[0]?.score || 0;
  const winners = sorted.filter((p) => p.score === highestScore);
  const isTie = winners.length > 1;

  useEffect(() => {
    audio.playVictory();
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
      });
      setTimeout(() => {
        confetti({
          particleCount: 75,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 75,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 400);
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300 pb-16">
      {/* Celebration Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-black uppercase tracking-widest">
          <Sparkles className="w-4 h-4" />
          <span>Partida completada &bull; {totalRoundsPlayed} rondas</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black font-display tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 drop-shadow-md">
          🏆 RESULTADO FINAL
        </h1>

        <p className="text-stone-300 text-base sm:text-xl font-medium max-w-xl mx-auto">
          {isTie
            ? `¡Increíble empate en la cima con ${highestScore} puntos cada uno!`
            : `¡${winners[0].name} se corona como la mente más perversa y divertida!`}
        </p>
      </div>

      {/* Winners Spotlight Card */}
      <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-b from-stone-900 via-neutral-950 to-black border-2 border-amber-500/80 shadow-2xl shadow-amber-500/15 text-center space-y-6">
        <div className="flex flex-wrap items-center justify-center gap-6">
          {winners.map((winner) => (
            <div key={winner.id} className="flex flex-col items-center">
              <div className="relative mb-3">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-stone-800 border-2 border-amber-400 flex items-center justify-center text-5xl sm:text-6xl shadow-xl">
                  {winner.avatar}
                </div>
                <div className="absolute -top-3 -right-2 w-8 h-8 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-md">
                  <Crown className="w-5 h-5 fill-current" />
                </div>
              </div>

              <h3 className="text-2xl sm:text-3xl font-black font-display text-white">
                {winner.name.toUpperCase()}
              </h3>
              <div className="mt-1 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-sm font-black">
                {winner.score} {winner.score === 1 ? 'PUNTO' : 'PUNTOS'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Full Leaderboard Table */}
      <div className="p-6 sm:p-8 rounded-3xl bg-stone-900/80 border border-stone-800 shadow-xl space-y-4">
        <h3 className="text-base font-black font-display uppercase tracking-wider text-stone-300 flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" />
          Clasificación final de todos los jugadores
        </h3>

        <div className="space-y-2.5">
          {sorted.map((player, idx) => {
            const isWinner = winners.some((w) => w.id === player.id);
            return (
              <div
                key={player.id}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  isWinner
                    ? 'bg-amber-500/15 border-amber-500/50 text-white shadow-md'
                    : 'bg-stone-950/60 border-stone-800 text-stone-300'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`w-6 text-center font-mono font-bold text-sm ${
                      idx === 0 ? 'text-amber-400' : 'text-stone-500'
                    }`}
                  >
                    #{idx + 1}
                  </span>
                  <span className="text-3xl">{player.avatar}</span>
                  <div>
                    <span className="font-bold text-base sm:text-lg block">
                      {player.name}
                    </span>
                    {isWinner && (
                      <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                        <Crown className="w-3 h-3" /> Ganador
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-2xl font-black font-display text-amber-400">
                    {player.score}
                  </span>
                  <span className="text-xs font-bold text-stone-500 block">
                    {player.score === 1 ? 'punto' : 'puntos'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
        <button
          type="button"
          onClick={() => {
            audio.playTurnChange();
            onPlayAgain();
          }}
          className="py-4 px-8 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black font-display text-base sm:text-lg tracking-wide uppercase transition-all shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Jugar otra vez</span>
        </button>

        <button
          type="button"
          onClick={() => {
            audio.playTurnChange();
            onBackToMenu();
          }}
          className="py-4 px-8 rounded-2xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 font-bold text-base tracking-wide uppercase transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95"
        >
          <Home className="w-5 h-5" />
          <span>Volver al menú</span>
        </button>
      </div>
    </div>
  );
};
