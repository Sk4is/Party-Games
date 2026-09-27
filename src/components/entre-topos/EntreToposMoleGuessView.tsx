import React, { useState } from 'react';
import { EntreToposRoomState } from '../../types/entreTopos';
import { NotebookPanel } from './NotebookPanel';
import { MolePortrait } from './MolePortrait';
import { Clock, HelpCircle, Target, Sparkles } from 'lucide-react';
import { audio } from '../../utils/audio';

interface EntreToposMoleGuessViewProps {
  roomState: EntreToposRoomState;
  localPlayerId: string;
  onMoleGuessWord: (word: string) => void;
}

export const EntreToposMoleGuessView: React.FC<EntreToposMoleGuessViewProps> = ({
  roomState,
  localPlayerId,
  onMoleGuessWord,
}) => {
  const [selectedWord, setSelectedWord] = useState<string>('');
  const [hasConfirmed, setHasConfirmed] = useState(false);

  const localPlayer = roomState.players.find((p) => p.id === localPlayerId);
  const myRole = roomState.myRole || localPlayer?.role;
  const isTopo = myRole === 'TOPO';
  const secondsLeft = roomState.timerSecondsRemaining ?? 25;

  const handleConfirmGuess = () => {
    if (!selectedWord || hasConfirmed || !isTopo) return;
    audio.playTurnChange();
    setHasConfirmed(true);
    onMoleGuessWord(selectedWord);
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6 select-none animate-fade-in text-center items-center">
      {/* HEADER BANNER */}
      <div
        className={`w-full p-5 sm:p-7 rounded-3xl border-4 shadow-2xl flex flex-col items-center justify-center ${
          isTopo
            ? 'bg-amber-950/80 border-amber-500 text-amber-100'
            : 'bg-indigo-950/80 border-indigo-500 text-indigo-100'
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-6 h-6 text-amber-400 animate-spin" />
          <span className="text-xs font-mono font-black uppercase tracking-widest text-amber-300">
            EL INTENTO FINAL DEL TOPO
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black font-display tracking-wide uppercase mb-1">
          {isTopo
            ? '¡ÚLTIMA OPORTUNIDAD PARA ROBAR LA VICTORIA!'
            : 'EL TOPO ESTÁ INTENTANDO ADIVINAR LA PALABRA SECRETA'}
        </h2>

        <p className="text-xs sm:text-sm font-semibold max-w-xl text-slate-300">
          {isTopo
            ? 'Has sido descubierto, pero si seleccionas la palabra secreta correcta entre las 16, ¡robarás la victoria!'
            : 'Si el Topo no adivina la palabra, ganan los inocentes. ¡Mucha tensión!'}
        </p>

        {/* TIMER */}
        <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/40 border border-white/20 font-mono font-black text-amber-300 text-sm">
          <Clock className="w-4 h-4" />
          <span>{secondsLeft}s restantes</span>
        </div>
      </div>

      {/* 16-WORD BOARD */}
      {roomState.board && (
        <div className="w-full">
          <NotebookPanel
            board={roomState.board}
            role={myRole}
            interactiveSelectWord={isTopo && !hasConfirmed}
            onSelectWord={(word) => {
              if (isTopo && !hasConfirmed) {
                audio.playTurnChange();
                setSelectedWord(word);
              }
            }}
            selectedGuessWord={selectedWord}
          />
        </div>
      )}

      {/* CONFIRM BUTTON (TOPO ONLY) */}
      {isTopo && (
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            disabled={!selectedWord || hasConfirmed}
            onClick={handleConfirmGuess}
            className="px-8 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black text-sm sm:text-base uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-xl flex items-center gap-2"
          >
            <Target className="w-5 h-5" />
            <span>
              {hasConfirmed
                ? '¡PALABRA ENVIADA!'
                : selectedWord
                ? `ELEGIR «${selectedWord.toUpperCase()}»`
                : 'SELECCIONA UNA PALABRA'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
};
