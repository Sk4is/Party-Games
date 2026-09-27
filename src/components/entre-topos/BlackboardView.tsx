import React, { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { audio } from '../../utils/audio';

interface BlackboardViewProps {
  clue?: string;
  isEditable?: boolean;
  onSubmitClue?: (clue: string) => void;
  isSubmitted?: boolean;
  playerName?: string;
  isCompact?: boolean;
  className?: string;
}

export const BlackboardView: React.FC<BlackboardViewProps> = ({
  clue = '',
  isEditable = false,
  onSubmitClue,
  isSubmitted = false,
  playerName,
  isCompact = false,
  className = '',
}) => {
  const [inputVal, setInputVal] = useState(clue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSubmitClue || isSubmitted) return;

    const trimmed = inputVal.trim();
    if (!trimmed) return;

    audio.playAnswerAccepted();
    onSubmitClue(trimmed.slice(0, 20));
  };

  const displayText = clue || (isEditable ? inputVal : 'SIN RESPUESTA');

  return (
    <div
      className={`relative inline-flex flex-col items-center select-none ${
        isCompact ? 'w-36 sm:w-44' : 'w-full max-w-md'
      } ${className}`}
    >
      {/* =========================================================================
          WOODEN FRAME AROUND CHALKBOARD SLATE
          ========================================================================= */}
      <div
        className={`relative w-full bg-[#3e2723] rounded-2xl border-4 border-[#271815] shadow-[0_10px_25px_rgba(0,0,0,0.65)] ${
          isCompact ? 'p-2' : 'p-3.5 sm:p-4'
        }`}
      >
        {/* Corner wood joints / rivets */}
        <div className="absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-[#1b100e]" />
        <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#1b100e]" />
        <div className="absolute bottom-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-[#1b100e]" />
        <div className="absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#1b100e]" />

        {/* CHALKBOARD SLATE SURFACE */}
        <div
          className={`relative w-full rounded-xl bg-[#1e293b] border border-black/40 overflow-hidden flex flex-col justify-center items-center shadow-inner ${
            isCompact ? 'min-h-[58px] p-1.5' : 'min-h-[96px] p-3'
          }`}
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.05) 0%, transparent 80%)',
          }}
        >
          {/* Faint chalk dust smudges */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.08),transparent_50%)] pointer-events-none" />

          {/* Player name tag if in compact grid */}
          {playerName && (
            <span className="text-[10px] font-mono uppercase font-black text-amber-300/80 tracking-wider mb-0.5 truncate max-w-[90%]">
              {playerName}
            </span>
          )}

          {/* CLUE DISPLAY IN BLAZE CHALK FONT */}
          {!isEditable ? (
            <p
              className={`font-blackboard text-center tracking-wide leading-tight break-words uppercase ${
                isCompact ? 'text-sm sm:text-base' : 'text-xl sm:text-2xl md:text-3xl'
              } ${
                displayText === 'SIN RESPUESTA'
                  ? 'text-rose-400/80 italic font-mono text-xs sm:text-sm'
                  : 'text-white'
              }`}
              style={{
                textShadow: '0 0 2px rgba(255,255,255,0.7), 0 0 10px rgba(255,255,255,0.25)',
              }}
            >
              {displayText}
            </p>
          ) : isSubmitted ? (
            <div className="flex flex-col items-center justify-center gap-1">
              <p
                className="font-blackboard text-center text-xl sm:text-2xl text-emerald-300 font-bold uppercase tracking-wider"
                style={{
                  textShadow: '0 0 3px rgba(110,231,183,0.8)',
                }}
              >
                {clue || inputVal}
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" /> PISTA ENVIADA Y BLOQUEADA
              </span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="w-full flex flex-col items-center gap-2">
              <div className="w-full relative">
                <input
                  type="text"
                  maxLength={20}
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value.slice(0, 20))}
                  placeholder="Tu pista (máx. 20 car.)..."
                  className="font-blackboard w-full text-center bg-transparent border-b-2 border-dashed border-white/40 focus:border-amber-400 text-white placeholder-slate-400 focus:outline-none text-xl sm:text-2xl uppercase tracking-wider px-2 py-1"
                  style={{
                    textShadow: '0 0 3px rgba(255,255,255,0.7)',
                  }}
                  autoFocus
                />
                <span className="absolute right-0 -bottom-4 text-[10px] font-mono text-slate-400">
                  {inputVal.trim().length}/20
                </span>
              </div>

              <button
                type="submit"
                disabled={!inputVal.trim()}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Confirmar pista</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
