import React, { useState } from 'react';
import { KeyRound, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { audio } from '../../../utils/audio';

interface AnillosCifradoModuleProps {
  operatorState: {
    symbolsList?: string[];
    lettersList?: string[];
    numbersList?: number[];
    currentSymbol?: string;
    currentLetter?: string;
    currentNumber?: number;
  };
  solved: boolean;
  onAction: (action: { symbol: string; letter: string; number: number }) => void;
}

const DEFAULT_SYMBOLS = ['⍾', '⌬', '⌖', '⎊', '⏣', '⍲'];
const DEFAULT_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const DEFAULT_NUMBERS = [1, 2, 3, 4, 5, 6];

export const AnillosCifradoModule: React.FC<AnillosCifradoModuleProps> = ({
  operatorState,
  solved,
  onAction,
}) => {
  const symbols = operatorState?.symbolsList || DEFAULT_SYMBOLS;
  const letters = operatorState?.lettersList || DEFAULT_LETTERS;
  const numbers = operatorState?.numbersList || DEFAULT_NUMBERS;

  const [symbolIdx, setSymbolIdx] = useState(0);
  const [letterIdx, setLetterIdx] = useState(0);
  const [numberIdx, setNumberIdx] = useState(0);

  const handleStep = (ring: 'symbol' | 'letter' | 'number', direction: 1 | -1) => {
    if (solved) return;
    audio.playMechanicalDetent();
    if (ring === 'symbol') {
      setSymbolIdx((prev) => (prev + direction + symbols.length) % symbols.length);
    } else if (ring === 'letter') {
      setLetterIdx((prev) => (prev + direction + letters.length) % letters.length);
    } else {
      setNumberIdx((prev) => (prev + direction + numbers.length) % numbers.length);
    }
  };

  const handleSubmit = () => {
    if (solved) return;
    audio.playMetalLever();
    onAction({
      symbol: symbols[symbolIdx],
      letter: letters[letterIdx],
      number: numbers[numberIdx],
    });
  };

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-4 sm:p-6 bg-slate-900/90 rounded-2xl border border-slate-700 select-none">
      {/* Header */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-fuchsia-400" />
          <span className="text-xs uppercase font-mono font-bold tracking-widest text-fuchsia-300">
            CRIPTOGRAFÍA
          </span>
          <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
            // ANILLOS DE CIFRADO MECÁNICO
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-fuchsia-950/70 border border-fuchsia-800 text-[10px] font-mono text-fuchsia-300">
          <span>CURSOR SUPERIOR ACTIVO</span>
        </div>
      </div>

      {/* 3 Physical Rotating Ring Rows */}
      <div className="w-full max-w-md my-4 flex flex-col gap-3">
        {/* Ring 1: Exterior / Symbols */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-fuchsia-900/60 shadow">
          <span className="text-[10px] font-mono font-bold text-fuchsia-400 uppercase w-20">
            ANILLO 1 (GLIFO)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleStep('symbol', -1)}
              disabled={solved}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="w-16 h-12 rounded-lg bg-fuchsia-950/80 border-2 border-fuchsia-500/80 flex items-center justify-center text-2xl text-fuchsia-200 shadow-inner font-sans">
              {symbols[symbolIdx]}
            </div>
            <button
              type="button"
              onClick={() => handleStep('symbol', 1)}
              disabled={solved}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Ring 2: Middle / Letters */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-purple-900/60 shadow">
          <span className="text-[10px] font-mono font-bold text-purple-400 uppercase w-20">
            ANILLO 2 (LETRA)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleStep('letter', -1)}
              disabled={solved}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="w-16 h-12 rounded-lg bg-purple-950/80 border-2 border-purple-500/80 flex items-center justify-center text-xl text-purple-200 font-mono font-black shadow-inner">
              {letters[letterIdx]}
            </div>
            <button
              type="button"
              onClick={() => handleStep('letter', 1)}
              disabled={solved}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Ring 3: Inner / Numbers */}
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-pink-900/60 shadow">
          <span className="text-[10px] font-mono font-bold text-pink-400 uppercase w-20">
            ANILLO 3 (CIFRA)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleStep('number', -1)}
              disabled={solved}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="w-16 h-12 rounded-lg bg-pink-950/80 border-2 border-pink-500/80 flex items-center justify-center text-xl text-pink-200 font-mono font-black shadow-inner">
              {numbers[numberIdx]}
            </div>
            <button
              type="button"
              onClick={() => handleStep('number', 1)}
              disabled={solved}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Alignment Cursor Visualizer Bar */}
      <div className="w-full max-w-sm flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono">
        <span className="text-slate-400">ALINEACIÓN ACTIVA:</span>
        <span className="text-fuchsia-300 font-bold">
          [ {symbols[symbolIdx]} — {letters[letterIdx]} — {numbers[numberIdx]} ]
        </span>
      </div>

      {/* Submit Action */}
      <div className="w-full pt-4 border-t border-slate-800 flex justify-center">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={solved}
          className={`w-full max-w-sm py-3 rounded-xl font-mono text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
            solved
              ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/50 cursor-default'
              : 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow-fuchsia-600/30 active:scale-95'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>{solved ? 'ANILLOS BLOQUEADOS' : 'BLOQUEAR ANILLOS'}</span>
        </button>
      </div>
    </div>
  );
};
