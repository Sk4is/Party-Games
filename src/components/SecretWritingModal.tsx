import React, { useState } from 'react';
import { BlackCard, LPRPlayer, AnswerCard } from '../types';
import { BlackCardVisual } from './BlackCardVisual';
import { EyeOff, CheckCircle2, ArrowRight, Sparkles, Send } from 'lucide-react';
import { audio } from '../utils/audio';

interface SecretWritingModalProps {
  blackCard: BlackCard;
  players: LPRPlayer[];
  onCompleteAllSubmissions: (submissions: AnswerCard[]) => void;
}

type WritingStep = 'HANDOVER' | 'WRITING' | 'SUBMITTED';

export const SecretWritingModal: React.FC<SecretWritingModalProps> = ({
  blackCard,
  players,
  onCompleteAllSubmissions,
}) => {
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [step, setStep] = useState<WritingStep>('HANDOVER');

  // Input states
  const [answerPart1, setAnswerPart1] = useState('');
  const [answerPart2, setAnswerPart2] = useState('');
  const [answersList, setAnswersList] = useState<AnswerCard[]>([]);

  const activePlayer = players[currentPlayerIdx];
  const isTwoBlanks = blackCard.blanks === 2;

  // Handles unlocking private writing mode for current player
  const handleStartWriting = () => {
    audio.playCardFlip();
    setStep('WRITING');
  };

  // Check if answer is valid (1-60 characters)
  const isAnswerValid = !isTwoBlanks
    ? answerPart1.trim().length >= 1 && answerPart1.trim().length <= 60
    : answerPart1.trim().length >= 1 &&
      answerPart2.trim().length >= 1 &&
      `${answerPart1.trim()} ... ${answerPart2.trim()}`.length <= 60;

  // Handles submission of current player's answer
  const handleSubmitAnswer = (e: React.FormEvent) => {
    e.preventDefault();

    const clean1 = answerPart1.trim();
    const clean2 = answerPart2.trim();

    if (!clean1 || (isTwoBlanks && !clean2)) {
      audio.playAnswerRejected();
      return;
    }

    const fullAnswerText = isTwoBlanks ? `${clean1} ... ${clean2}` : clean1;
    if (fullAnswerText.length === 0 || fullAnswerText.length > 60) {
      audio.playAnswerRejected();
      return;
    }

    const newSubmission: AnswerCard = {
      id: `ans-${activePlayer.id}-${Date.now()}`,
      authorId: activePlayer.id,
      authorName: activePlayer.name,
      authorAvatar: activePlayer.avatar,
      authorColor: activePlayer.color,
      text: fullAnswerText,
      revealed: false,
      votes: [],
    };

    const updated = [...answersList, newSubmission];
    setAnswersList(updated);

    // Reset inputs
    setAnswerPart1('');
    setAnswerPart2('');

    audio.playAnswerSubmitted();
    setStep('SUBMITTED');
  };

  // Move to next player handover, or complete if done
  const handleNextPlayer = () => {
    if (currentPlayerIdx + 1 < players.length) {
      setCurrentPlayerIdx((prev) => prev + 1);
      setStep('HANDOVER');
      audio.playTurnChange();
    } else {
      // All submissions complete!
      audio.playCardDealt();
      onCompleteAllSubmissions(answersList);
    }
  };

  const nextPlayer =
    currentPlayerIdx + 1 < players.length ? players[currentPlayerIdx + 1] : null;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Upper Status Progress Indicator */}
      <div className="p-3 sm:p-4 rounded-2xl bg-stone-900/80 border border-stone-800 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
            Respuestas enviadas:
          </span>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-black">
            {answersList.length} / {players.length}
          </span>
        </div>

        {/* Player bubbles with status */}
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {players.map((p, idx) => {
            const hasSubmitted = answersList.some((a) => a.authorId === p.id);
            const isCurrent = idx === currentPlayerIdx;
            return (
              <div
                key={p.id}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
                  hasSubmitted
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : isCurrent
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-400 ring-2 ring-amber-400/30'
                    : 'bg-stone-950 text-stone-500 border border-stone-800'
                }`}
              >
                <span>{p.avatar}</span>
                <span className="max-w-[70px] truncate">{p.name}</span>
                {hasSubmitted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 1: HANDOVER PRIVACY SCREEN */}
      {step === 'HANDOVER' && (
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-stone-900 via-neutral-950 to-black border-2 border-stone-800 text-center shadow-2xl space-y-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-stone-800 border-2 border-stone-700 flex items-center justify-center text-4xl sm:text-5xl mx-auto shadow-inner">
            {activePlayer.avatar}
          </div>

          <div>
            <span className="text-xs sm:text-sm font-bold tracking-widest text-amber-400 uppercase">
              FASE SECRETA &bull; PASA EL DISPOSITIVO
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-display text-white mt-1">
              TURNO DE {activePlayer.name.toUpperCase()}
            </h2>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-stone-900/90 border border-stone-800 max-w-md mx-auto text-stone-300 text-sm flex items-center justify-center gap-3">
            <EyeOff className="w-5 h-5 text-amber-400 shrink-0" />
            <span>Que nadie mire la pantalla. Tu respuesta debe permanecer en secreto.</span>
          </div>

          <button
            type="button"
            onClick={handleStartWriting}
            className="w-full max-w-md py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black font-display text-lg tracking-wide uppercase transition-all shadow-xl shadow-amber-500/25 cursor-pointer active:scale-95 mx-auto block"
          >
            Escribir mi respuesta
          </button>
        </div>
      )}

      {/* STEP 2: PRIVATE WRITING FORM */}
      {step === 'WRITING' && (
        <div className="space-y-6">
          {/* Active Black Card */}
          <div className="flex justify-center">
            <BlackCardVisual card={blackCard} size="large" />
          </div>

          {/* White Card Input Form */}
          <div className="p-6 sm:p-8 rounded-3xl bg-stone-100 text-slate-900 border-2 border-stone-300 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-stone-300 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{activePlayer.avatar}</span>
                <span className="font-bold text-sm sm:text-base uppercase tracking-wider text-slate-800">
                  {activePlayer.name}, escribe tu peor respuesta
                </span>
              </div>
              <span className="text-xs font-bold text-stone-500 uppercase tracking-widest">
                CARTA BLANCA
              </span>
            </div>

            <form id="lpr-secret-form" onSubmit={handleSubmitAnswer} className="space-y-4">
              {!isTwoBlanks ? (
                <div>
                  <label htmlFor="lpr-secret-answer-1" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Tu respuesta (máximo 60 caracteres)
                  </label>
                  <div className="relative">
                    <textarea
                      id="lpr-secret-answer-1"
                      autoFocus
                      rows={3}
                      maxLength={60}
                      value={answerPart1}
                      onChange={(e) => setAnswerPart1(e.target.value.slice(0, 60))}
                      placeholder="Escribe tu respuesta..."
                      className="w-full p-4 pb-8 rounded-2xl bg-white border-2 border-stone-300 focus:border-amber-500 text-slate-950 font-bold text-base sm:text-lg outline-none resize-none shadow-inner"
                    />
                    <div className="absolute right-3.5 bottom-2.5 pointer-events-none select-none">
                      <span
                        id="lpr-secret-counter-1"
                        className={`text-xs font-mono font-medium transition-colors ${
                          answerPart1.length === 60
                            ? 'text-amber-600 font-bold'
                            : answerPart1.length >= 50
                            ? 'text-amber-600/80 font-semibold'
                            : 'text-stone-400'
                        }`}
                      >
                        {answerPart1.length} / 60
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label htmlFor="lpr-secret-blank-1" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Primera parte del hueco (máx. 28 caracteres)
                    </label>
                    <div className="relative">
                      <input
                        id="lpr-secret-blank-1"
                        autoFocus
                        type="text"
                        maxLength={28}
                        value={answerPart1}
                        onChange={(e) => setAnswerPart1(e.target.value.slice(0, 28))}
                        placeholder="Primera respuesta..."
                        className="w-full p-3.5 pr-16 rounded-xl bg-white border-2 border-stone-300 focus:border-amber-500 text-slate-950 font-bold text-base outline-none shadow-inner"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none select-none">
                        <span className="text-xs font-mono text-stone-400">
                          {answerPart1.length} / 28
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="lpr-secret-blank-2" className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Segunda parte del hueco (máx. 28 caracteres)
                    </label>
                    <div className="relative">
                      <input
                        id="lpr-secret-blank-2"
                        type="text"
                        maxLength={28}
                        value={answerPart2}
                        onChange={(e) => setAnswerPart2(e.target.value.slice(0, 28))}
                        placeholder="Segunda respuesta..."
                        className="w-full p-3.5 pr-16 rounded-xl bg-white border-2 border-stone-300 focus:border-amber-500 text-slate-950 font-bold text-base outline-none shadow-inner"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none select-none">
                        <span className="text-xs font-mono text-stone-400">
                          {answerPart2.length} / 28
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <button
                id="lpr-secret-submit-btn"
                type="submit"
                disabled={!isAnswerValid}
                className="w-full py-4 rounded-2xl bg-slate-950 hover:bg-stone-900 text-white font-black font-display text-base sm:text-lg tracking-wide uppercase transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Send className="w-5 h-5" />
                <span>¡Listo! Enviar respuesta</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* STEP 3: ANSWER SUBMITTED / HANDOVER SCREEN */}
      {step === 'SUBMITTED' && (
        <div className="p-8 sm:p-12 rounded-3xl bg-stone-900/95 border-2 border-stone-800 text-center shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto text-3xl">
            ✓
          </div>

          <div>
            <h2 className="text-3xl sm:text-4xl font-black font-display text-white">
              RESPUESTA GUARDADA
            </h2>
            <p className="text-stone-400 text-sm sm:text-base mt-2">
              Tu respuesta ha quedado registrada en secreto.
            </p>
          </div>

          {nextPlayer ? (
            <div className="p-6 rounded-2xl bg-stone-950 border border-stone-800 max-w-md mx-auto space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                Siguiente turno
              </span>
              <div className="flex items-center justify-center gap-3">
                <span className="text-3xl">{nextPlayer.avatar}</span>
                <span className="text-2xl font-black text-white font-display">
                  {nextPlayer.name.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Pasad el dispositivo a {nextPlayer.name} y pulsad el botón cuando esté listo.
              </p>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-stone-950 border border-stone-800 max-w-md mx-auto space-y-2">
              <Sparkles className="w-6 h-6 text-amber-400 mx-auto" />
              <h3 className="text-xl font-black font-display text-white">
                ¡TODOS HAN RESPONDIDO!
              </h3>
              <p className="text-xs text-stone-400">
                Las cartas están listas para ser barajadas y reveladas sobre la mesa.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={handleNextPlayer}
            className="w-full max-w-md py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black font-display text-lg tracking-wide uppercase transition-all shadow-xl shadow-amber-500/25 cursor-pointer active:scale-95 mx-auto flex items-center justify-center gap-2"
          >
            <span>{nextPlayer ? `Listo, soy ${nextPlayer.name}` : 'Descubrir las cartas'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
