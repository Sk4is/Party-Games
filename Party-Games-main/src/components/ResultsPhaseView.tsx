import React, { useEffect } from 'react';
import { BlackCard, LPRPlayer, AnswerCard } from '../types';
import { BlackCardVisual } from './BlackCardVisual';
import { WhiteCardVisual } from './WhiteCardVisual';
import { Trophy, ArrowRight, Award, Crown, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';
import { audio } from '../utils/audio';

interface ResultsPhaseViewProps {
  round: number;
  totalRounds: number;
  blackCard: BlackCard;
  players: LPRPlayer[];
  answers: AnswerCard[];
  onNextRound: () => void;
  isLastRound: boolean;
}

export const ResultsPhaseView: React.FC<ResultsPhaseViewProps> = ({
  round,
  totalRounds,
  blackCard,
  players,
  answers,
  onNextRound,
  isLastRound,
}) => {
  // Determine highest vote count
  const maxVotes = Math.max(...answers.map((a) => a.votes.length), 0);

  // Winning answer(s)
  const winningAnswers = answers.filter(
    (a) => a.votes.length === maxVotes && maxVotes > 0
  );

  const isTie = winningAnswers.length > 1;

  // Trigger celebration on mount
  useEffect(() => {
    audio.playVictory();
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
  }, []);

  // Sort players for scoreboard
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300 pb-16">
      {/* Round Results Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-stone-900 border border-stone-800 text-xs font-bold uppercase tracking-wider text-amber-400">
          <Trophy className="w-3.5 h-3.5" />
          <span>
            Resultados de la ronda {round} {totalRounds !== -1 ? `de ${totalRounds}` : ''}
          </span>
        </div>

        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-display text-white">
          {isTie ? '¡EMPATE EN LA RONDA!' : '🏆 ¡MEJOR PEOR RESPUESTA!'}
        </h2>

        <p className="text-stone-300 text-sm sm:text-base max-w-xl mx-auto">
          {isTie
            ? `Hay un empate con ${maxVotes} votos. ¡Todos los empatados reciben +1 punto!`
            : winningAnswers.length === 1
            ? `¡${winningAnswers[0].authorName} se lleva la ronda con ${maxVotes} votos y suma +1 punto!`
            : 'No hubo votos suficientes para determinar ganador.'}
        </p>
      </div>

      {/* Prominently centered Black Card */}
      <div className="flex justify-center px-2">
        <BlackCardVisual card={blackCard} size="normal" />
      </div>

      {/* Winner Spotlight Banner */}
      {winningAnswers.length > 0 && (
        <div className="max-w-2xl mx-auto p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/20 to-amber-500/15 border-2 border-amber-500/60 shadow-xl shadow-amber-500/10 text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            {winningAnswers.map((w) => (
              <div
                key={w.id}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-stone-950/80 border border-amber-400/80 shadow-md"
              >
                <Crown className="w-5 h-5 text-amber-400" />
                <span className="text-2xl">{w.authorAvatar}</span>
                <span className="text-base sm:text-lg font-black text-white font-display">
                  {w.authorName.toUpperCase()}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-xs font-black">
                  +1 PTO
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Answers Grid with revealed Authors and Votes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
            Todas las respuestas y sus autores ({answers.length})
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {answers.map((answer) => {
            const isWinner = winningAnswers.some((w) => w.id === answer.id);

            return (
              <WhiteCardVisual
                key={answer.id}
                text={answer.text}
                isRevealed={true}
                showAuthor={true}
                authorName={answer.authorName}
                authorAvatar={answer.authorAvatar}
                authorColor={answer.authorColor}
                votesCount={answer.votes.length}
                isWinner={isWinner}
              />
            );
          })}
        </div>
      </div>

      {/* Secondary Scoreboard: Clasificación General */}
      <div className="max-w-3xl mx-auto p-6 rounded-3xl bg-stone-900/90 border border-stone-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <h3 className="text-base font-black font-display uppercase tracking-wider text-stone-200 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            Clasificación general
          </h3>
          <span className="text-xs text-stone-400 font-bold">
            Ronda {round} {totalRounds !== -1 ? `/ ${totalRounds}` : ''}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {sortedPlayers.map((player, idx) => {
            const isLeader = idx === 0 && player.score > 0;
            return (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                  isLeader
                    ? 'bg-amber-500/10 border-amber-500/40 text-stone-100'
                    : 'bg-stone-950/60 border-stone-800 text-stone-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold font-mono text-stone-500 w-4">
                    #{idx + 1}
                  </span>
                  <span className="text-2xl">{player.avatar}</span>
                  <span className="font-bold text-sm tracking-wide">{player.name}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-black font-display text-amber-400">
                    {player.score}
                  </span>
                  <span className="text-[11px] font-bold text-stone-400">
                    {player.score === 1 ? 'pto' : 'ptos'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Next Round Button Floating CTA */}
      <div className="flex justify-center pt-4">
        <button
          type="button"
          onClick={() => {
            audio.playTurnChange();
            onNextRound();
          }}
          className="py-4 px-8 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black font-display text-lg tracking-wide uppercase transition-all shadow-xl shadow-amber-500/25 cursor-pointer active:scale-95 flex items-center gap-2"
        >
          <span>{isLastRound ? 'Ver resultado final' : 'Siguiente ronda'}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
