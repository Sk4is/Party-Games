import React from 'react';
import { KeyRound } from 'lucide-react';
import { audio } from '../../../utils/audio';

interface GlifosCriptograficosModuleProps {
  operatorState: {
    buttons: { id: string; symbol: string; pressed: boolean }[];
    correctPressCount: number;
  };
  solved: boolean;
  onAction: (action: { symbol: string }) => void;
}

export const GlifosCriptograficosModule: React.FC<GlifosCriptograficosModuleProps> = ({
  operatorState,
  solved,
  onAction,
}) => {
  const { buttons } = operatorState;

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-6 bg-slate-900/90 rounded-2xl border border-slate-700 select-none">
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-purple-400" />
          <span className="text-xs uppercase font-mono font-bold tracking-widest text-purple-300">
            SISTEMAS
          </span>
          <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
            // TERMINAL AUX
          </span>
        </div>
        <span className="text-xs font-mono text-slate-400 font-bold">
          BLOQUE ACTIVO
        </span>
      </div>

      {/* 2x2 Keypad */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6 my-6 w-full max-w-xs">
        {buttons.map((btn) => (
          <button
            key={btn.id}
            type="button"
            disabled={solved}
            onClick={() => {
              audio.playTerminalBeep();
              onAction({ symbol: btn.symbol });
            }}
            className={`h-24 sm:h-28 rounded-2xl border-2 flex items-center justify-center text-4xl sm:text-5xl font-mono transition-all transform active:scale-95 cursor-pointer shadow-lg ${
              solved
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400 shadow-emerald-500/20'
                : 'bg-slate-850 hover:bg-slate-800 border-amber-500/60 hover:border-amber-400 text-amber-300 shadow-amber-500/10 hover:shadow-amber-500/30'
            }`}
          >
            {btn.symbol}
          </button>
        ))}
      </div>

      <div className="text-xs text-slate-400 font-mono text-center">
        {solved ? (
          <span className="text-emerald-400 font-bold uppercase tracking-wider">
            ✓ Secuencia Rúnica Desbloqueada
          </span>
        ) : (
          <span>Pulsa los glifos en el orden de arriba abajo indicado por el manual</span>
        )}
      </div>
    </div>
  );
};
