import React, { useState, useEffect } from 'react';
import { BlackCard, AnswerCard } from '../types';
import { BlackCardVisual } from './BlackCardVisual';
import { WhiteCardVisual } from './WhiteCardVisual';
import { Sparkles, ArrowRight, Check } from 'lucide-react';
import { audio } from '../utils/audio';

interface RevealPhaseViewProps {
  blackCard: BlackCard;
  shuffledAnswers: AnswerCard[];
  onCardFlipped: (cardId: string) => void;
  onProceedToVoting: () => void;
}

export const RevealPhaseView: React.FC<RevealPhaseViewProps> = ({
  blackCard,
  shuffledAnswers,
  onCardFlipped,
  onProceedToVoting,
}) => {
  const [revealedIds, setRevealedIds] = useState<Set<string>>(
    () => new Set(shuffledAnswers.filter((a) => a.revealed).map((a) => a.id))
  );

  const allRevealed =
    shuffledAnswers.length > 0 && revealedIds.size === shuffledAnswers.length;

  const handleFlipCard = (cardId: string) => {
    if (revealedIds.has(cardId)) return;

    audio.playCardFlip();
    const updated = new Set(revealedIds);
    updated.add(cardId);
    setRevealedIds(updated);
    onCardFlipped(cardId);
  };

  const handleRevealAllAtOnce = () => {
    audio.playCardFlip();
    const allIds = new Set(shuffledAnswers.map((a) => a.id));
    setRevealedIds(allIds);
    shuffledAnswers.forEach((a) => onCardFlipped(a.id));
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300 pb-12">
      {/* Top Header & Instruction */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-stone-900 border border-stone-800 text-stone-300 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Fase de revelación</span>
          <span className="text-stone-500">&bull;</span>
          <span className="text-amber-400">
            {revealedIds.size} de {shuffledAnswers.length} reveladas
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black font-display text-white">
          TOCA CADA CARTA PARA DESCUBRIRLA
        </h2>
        <p className="text-stone-400 text-sm max-w-xl mx-auto">
          Las cartas se han barajado de forma aleatoria y anónima. Pulsa sobre cada una para ver
          qué disparates han escrito.
        </p>
      </div>

      {/* Prominently centered Black Card */}
      <div className="flex justify-center px-2">
        <BlackCardVisual card={blackCard} size="large" />
      </div>

      {/* Grid of Shuffled White Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
            Cartas sobre la mesa ({shuffledAnswers.length})
          </span>

          {!allRevealed && (
            <button
              type="button"
              onClick={handleRevealAllAtOnce}
              className="text-xs font-bold text-stone-400 hover:text-amber-400 transition-colors cursor-pointer"
            >
              Revelar todas a la vez
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {shuffledAnswers.map((answer) => {
            const isFlipped = revealedIds.has(answer.id);
            return (
              <WhiteCardVisual
                key={answer.id}
                text={answer.text}
                isRevealed={isFlipped}
                onFlip={() => handleFlipCard(answer.id)}
                showAuthor={false} // Never show author during reveal!
              />
            );
          })}
        </div>
      </div>

      {/* Bottom Floating Bar / Action to Proceed to Voting */}
      {allRevealed && (
        <div className="fixed bottom-6 inset-x-4 max-w-md mx-auto z-40 animate-in slide-in-from-bottom-6 duration-300">
          <div className="p-3 rounded-2xl bg-stone-900/95 backdrop-blur-md border-2 border-amber-500/80 shadow-2xl shadow-black/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 pl-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-xs sm:text-sm font-bold text-stone-200">
                ¡Todas las cartas descubiertas!
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                audio.playTurnChange();
                onProceedToVoting();
              }}
              className="py-3 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black font-display text-sm uppercase tracking-wider transition-all shadow-lg shadow-amber-500/30 flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span>Votar ahora</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
