import React, { useState } from 'react';
import { BlackCard, LPRPlayer, AnswerCard } from '../types';
import { BlackCardVisual } from './BlackCardVisual';
import { WhiteCardVisual } from './WhiteCardVisual';
import { EyeOff, CheckCircle2, ArrowRight, Vote, ShieldAlert } from 'lucide-react';
import { audio } from '../utils/audio';

interface VotingPhaseViewProps {
  blackCard: BlackCard;
  players: LPRPlayer[];
  answers: AnswerCard[];
  onCompleteAllVotes: (votesMap: Record<string, string>) => void; // voterId -> answerId
}

type VotingStep = 'HANDOVER' | 'VOTING' | 'SUBMITTED';

export const VotingPhaseView: React.FC<VotingPhaseViewProps> = ({
  blackCard,
  players,
  answers,
  onCompleteAllVotes,
}) => {
  const [currentVoterIdx, setCurrentVoterIdx] = useState(0);
  const [step, setStep] = useState<VotingStep>('HANDOVER');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [votesMap, setVotesMap] = useState<Record<string, string>>({}); // voterId -> answerId

  const activeVoter = players[currentVoterIdx];

  const handleStartVoting = () => {
    audio.playCardFlip();
    setSelectedCardId(null);
    setStep('VOTING');
  };

  const handleSelectCard = (answer: AnswerCard) => {
    // Strict logic enforcement: cannot vote for your own answer!
    if (answer.authorId === activeVoter.id) {
      audio.playAnswerRejected();
      return;
    }

    audio.playVoteSelected();
    setSelectedCardId(answer.id);
  };

  const handleConfirmVote = () => {
    if (!selectedCardId) return;

    // Double check self-voting prevention in code
    const targetCard = answers.find((a) => a.id === selectedCardId);
    if (!targetCard || targetCard.authorId === activeVoter.id) {
      audio.playAnswerRejected();
      return;
    }

    const updated = {
      ...votesMap,
      [activeVoter.id]: selectedCardId,
    };
    setVotesMap(updated);

    audio.playAnswerSubmitted();
    setStep('SUBMITTED');
  };

  const handleNextVoter = () => {
    if (currentVoterIdx + 1 < players.length) {
      setCurrentVoterIdx((prev) => prev + 1);
      setSelectedCardId(null);
      setStep('HANDOVER');
      audio.playTurnChange();
    } else {
      // All players have voted!
      audio.playRoundWinner();
      onCompleteAllVotes(votesMap);
    }
  };

  const nextVoter =
    currentVoterIdx + 1 < players.length ? players[currentVoterIdx + 1] : null;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Upper Status Progress Indicator */}
      <div className="p-3 sm:p-4 rounded-2xl bg-stone-900/80 border border-stone-800 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
            Votos emitidos en secreto:
          </span>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-black">
            {Object.keys(votesMap).length} / {players.length}
          </span>
        </div>

        {/* Player vote status tags */}
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {players.map((p, idx) => {
            const hasVoted = !!votesMap[p.id];
            const isCurrent = idx === currentVoterIdx;
            return (
              <div
                key={p.id}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                  hasVoted
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : isCurrent
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400 ring-2 ring-amber-400/30'
                    : 'bg-stone-950 text-stone-500 border border-stone-800'
                }`}
              >
                <span>{p.avatar}</span>
                <span className="max-w-[70px] truncate">{p.name}</span>
                {hasVoted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 1: HANDOVER PRIVACY SCREEN */}
      {step === 'HANDOVER' && (
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-stone-900 via-neutral-950 to-black border-2 border-stone-800 text-center shadow-2xl space-y-6 max-w-xl mx-auto">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-stone-800 border-2 border-stone-700 flex items-center justify-center text-4xl sm:text-5xl mx-auto shadow-inner">
            {activeVoter.avatar}
          </div>

          <div>
            <span className="text-xs sm:text-sm font-bold tracking-widest text-amber-400 uppercase">
              VOTACIÓN SECRETA &bull; PASA EL DISPOSITIVO
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-display text-white mt-1">
              TURNO DE VOTAR: {activeVoter.name.toUpperCase()}
            </h2>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-stone-900/90 border border-stone-800 text-stone-300 text-sm flex items-center justify-center gap-3">
            <EyeOff className="w-5 h-5 text-amber-400 shrink-0" />
            <span>
              Que nadie mire la pantalla. Elige la peor respuesta (¡no puedes votarte a ti mismo!).
            </span>
          </div>

          <button
            type="button"
            onClick={handleStartVoting}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black font-display text-lg tracking-wide uppercase transition-all shadow-xl shadow-amber-500/25 cursor-pointer active:scale-95 block"
          >
            Empezar a votar
          </button>
        </div>
      )}

      {/* STEP 2: PRIVATE VOTING GRID */}
      {step === 'VOTING' && (
        <div className="space-y-6">
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-stone-900 border border-stone-800 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <span>{activeVoter.avatar}</span>
              <span>{activeVoter.name}, elige la peor respuesta</span>
            </div>
            <p className="text-xs text-stone-400">
              Toca la carta que te parezca más divertida o disparatada. Tu propia respuesta está desactivada.
            </p>
          </div>

          {/* Centered Black Card */}
          <div className="flex justify-center px-2">
            <BlackCardVisual card={blackCard} size="compact" />
          </div>

          {/* Cards to choose from */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {answers.map((answer) => {
              const isOwnCard = answer.authorId === activeVoter.id;
              const isSelected = selectedCardId === answer.id;

              return (
                <div key={answer.id} className="relative">
                  <WhiteCardVisual
                    text={answer.text}
                    isRevealed={true}
                    isSelectable={!isOwnCard}
                    isSelected={isSelected}
                    isDisabled={isOwnCard}
                    disabledReason="Tu respuesta"
                    onSelect={() => handleSelectCard(answer)}
                    showAuthor={false}
                  />

                  {isOwnCard && (
                    <div className="absolute top-2 right-2 z-20 pointer-events-none">
                      <span className="px-2 py-1 rounded-lg bg-stone-900/90 border border-stone-700 text-stone-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow">
                        <ShieldAlert className="w-3 h-3 text-amber-400" />
                        No puedes votarte
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Confirmation Bar */}
          <div className="fixed bottom-6 inset-x-4 max-w-md mx-auto z-40">
            <div className="p-3 rounded-2xl bg-stone-900/95 backdrop-blur-md border-2 border-stone-700 shadow-2xl flex items-center justify-between gap-3">
              <span className="text-xs sm:text-sm font-bold text-stone-300 pl-2">
                {selectedCardId
                  ? 'Carta seleccionada ✓'
                  : 'Selecciona una carta arriba'}
              </span>

              <button
                type="button"
                disabled={!selectedCardId}
                onClick={handleConfirmVote}
                className="py-3 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black font-display text-sm uppercase tracking-wider transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Vote className="w-4 h-4" />
                <span>Confirmar mi voto</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: VOTE CONFIRMED / HANDOVER SCREEN */}
      {step === 'SUBMITTED' && (
        <div className="p-8 sm:p-12 rounded-3xl bg-stone-900/95 border-2 border-stone-800 text-center shadow-2xl space-y-6 max-w-xl mx-auto animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto text-3xl">
            ✓
          </div>

          <div>
            <h2 className="text-3xl sm:text-4xl font-black font-display text-white">
              VOTO GUARDADO
            </h2>
            <p className="text-stone-400 text-sm sm:text-base mt-2">
              Tu voto se ha registrado de forma anónima y secreta.
            </p>
          </div>

          {nextVoter ? (
            <div className="p-6 rounded-2xl bg-stone-950 border border-stone-800 max-w-md mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                Siguiente votante
              </span>
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl">{nextVoter.avatar}</span>
                <span className="text-2xl font-black text-white font-display">
                  {nextVoter.name.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Pasad el dispositivo a {nextVoter.name} y pulsad el botón cuando esté listo.
              </p>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-stone-950 border border-stone-800 max-w-md mx-auto space-y-2">
              <Vote className="w-6 h-6 text-amber-400 mx-auto" />
              <h3 className="text-xl font-black font-display text-white">
                ¡TODOS HAN VOTADO!
              </h3>
              <p className="text-xs text-stone-400">
                Llega el momento de descubrir quién escribió cada respuesta y proclamar al ganador de la ronda.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={handleNextVoter}
            className="w-full max-w-md py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black font-display text-lg tracking-wide uppercase transition-all shadow-xl shadow-amber-500/25 cursor-pointer active:scale-95 mx-auto flex items-center justify-center gap-2"
          >
            <span>{nextVoter ? `Listo, soy ${nextVoter.name}` : 'Ver resultados'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
