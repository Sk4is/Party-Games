import React, { useState } from 'react';
import { Wind } from 'lucide-react';

interface DisipadorTermicoModuleProps {
  operatorState: {
    windFlow: 'NORTE' | 'SUR' | 'ESTE' | 'OESTE';
    alertLevel: string;
    baffles: boolean[];
  };
  solved: boolean;
  onAction: (action: { baffles: boolean[] }) => void;
}

const DIRECTIONS = ['NORTE', 'SUR', 'ESTE', 'OESTE'] as const;

export const DisipadorTermicoModule: React.FC<DisipadorTermicoModuleProps> = ({
  operatorState,
  solved,
  onAction,
}) => {
  const { windFlow, alertLevel } = operatorState;
  const [baffles, setBaffles] = useState<boolean[]>([false, false, false, false]); // N, S, E, O

  const toggleBaffle = (idx: number) => {
    if (solved) return;
    setBaffles((prev) => {
      const copy = [...prev];
      copy[idx] = !copy[idx];
      return copy;
    });
  };

  const handleFixBaffles = () => {
    if (solved) return;
    onAction({ baffles });
  };

  const alertColor =
    alertLevel === 'ALERTA-AMARILLA'
      ? 'bg-amber-950 border-amber-500/40 text-amber-400'
      : alertLevel === 'ALERTA-NARANJA'
      ? 'bg-orange-950 border-orange-500/40 text-orange-400'
      : 'bg-red-950 border-red-500/40 text-red-400 animate-pulse';

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-6 bg-slate-900/90 rounded-2xl border border-slate-700 select-none">
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Wind className="w-4 h-4 text-orange-400" />
          <span className="text-xs uppercase font-mono tracking-widest text-slate-400">
            Disipador Térmico
          </span>
        </div>
        <span className={`px-2.5 py-0.5 border rounded font-mono text-xs font-bold ${alertColor}`}>
          {alertLevel}
        </span>
      </div>

      {/* Compass Vane with 4 Baffles */}
      <div className="relative w-48 h-48 sm:w-56 sm:h-56 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center my-3 p-2">
        {/* Center Wind Flow Vane */}
        <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-700 flex flex-col items-center justify-center font-mono">
          <span className="text-[9px] text-slate-400">FLUJO</span>
          <span className="text-xs font-bold text-orange-400">{windFlow}</span>
        </div>

        {/* 4 Directional Baffle Buttons */}
        {/* NORTE (top) */}
        <button
          type="button"
          disabled={solved}
          onClick={() => toggleBaffle(0)}
          className={`absolute top-2 w-28 py-1.5 rounded-lg border-2 font-mono text-xs font-bold transition-all cursor-pointer ${
            baffles[0]
              ? 'bg-orange-500/20 border-orange-400 text-orange-300'
              : 'bg-slate-900 border-slate-700 text-slate-500'
          }`}
        >
          N: {baffles[0] ? 'ABIERTA' : 'CERRADA'}
        </button>

        {/* SUR (bottom) */}
        <button
          type="button"
          disabled={solved}
          onClick={() => toggleBaffle(1)}
          className={`absolute bottom-2 w-28 py-1.5 rounded-lg border-2 font-mono text-xs font-bold transition-all cursor-pointer ${
            baffles[1]
              ? 'bg-orange-500/20 border-orange-400 text-orange-300'
              : 'bg-slate-900 border-slate-700 text-slate-500'
          }`}
        >
          S: {baffles[1] ? 'ABIERTA' : 'CERRADA'}
        </button>

        {/* OESTE (left) */}
        <button
          type="button"
          disabled={solved}
          onClick={() => toggleBaffle(3)}
          className={`absolute left-1 w-16 py-3 rounded-lg border-2 font-mono text-[10px] font-bold transition-all cursor-pointer flex flex-col items-center ${
            baffles[3]
              ? 'bg-orange-500/20 border-orange-400 text-orange-300'
              : 'bg-slate-900 border-slate-700 text-slate-500'
          }`}
        >
          <span>OESTE</span>
          <span className="text-[8px]">{baffles[3] ? 'ABIERTA' : 'CERRADA'}</span>
        </button>

        {/* ESTE (right) */}
        <button
          type="button"
          disabled={solved}
          onClick={() => toggleBaffle(2)}
          className={`absolute right-1 w-16 py-3 rounded-lg border-2 font-mono text-[10px] font-bold transition-all cursor-pointer flex flex-col items-center ${
            baffles[2]
              ? 'bg-orange-500/20 border-orange-400 text-orange-300'
              : 'bg-slate-900 border-slate-700 text-slate-500'
          }`}
        >
          <span>ESTE</span>
          <span className="text-[8px]">{baffles[2] ? 'ABIERTA' : 'CERRADA'}</span>
        </button>
      </div>

      <div className="w-full flex flex-col items-center gap-2">
        <button
          type="button"
          disabled={solved}
          onClick={handleFixBaffles}
          className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 active:scale-95 rounded-xl text-slate-950 font-black tracking-wider uppercase transition-all shadow-lg shadow-orange-600/30 cursor-pointer disabled:opacity-50"
        >
          {solved ? 'ALETAS FIJADAS ✓' : 'FIJAR ALETAS'}
        </button>
        <span className="text-xs text-slate-400 font-mono text-center">
          Abre y cierra las aletas correspondientes según el viento y nivel de alerta
        </span>
      </div>
    </div>
  );
};
