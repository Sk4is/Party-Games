import React, { useState } from 'react';
import { ToggleLeft, ToggleRight, Cpu } from 'lucide-react';

interface RelesHexadecimalesModuleProps {
  operatorState: {
    relays: string[];
    switches: number[];
  };
  solved: boolean;
  onAction: (action: { switches: number[] }) => void;
}

export const RelesHexadecimalesModule: React.FC<RelesHexadecimalesModuleProps> = ({
  operatorState,
  solved,
  onAction,
}) => {
  const { relays } = operatorState;
  const [switches, setSwitches] = useState<number[]>([0, 0, 0, 0]);

  const toggleSwitch = (idx: number) => {
    if (solved) return;
    setSwitches((prev) => {
      const copy = [...prev];
      copy[idx] = copy[idx] === 1 ? 0 : 1;
      return copy;
    });
  };

  const handleConfirm = () => {
    if (solved) return;
    onAction({ switches });
  };

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-6 bg-slate-900/90 rounded-2xl border border-slate-700 select-none">
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-purple-400" />
          <span className="text-xs uppercase font-mono tracking-widest text-slate-400">
            Relés Hexadecimales
          </span>
        </div>
        <span className="text-xs font-mono text-purple-400 font-bold">BUS LÓGICO</span>
      </div>

      {/* 4 Relays */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4 my-4 w-full max-w-md">
        {relays.map((hex, idx) => {
          const isUp = switches[idx] === 1;
          return (
            <div
              key={idx}
              className="flex flex-col items-center bg-slate-950 p-2 sm:p-3 rounded-xl border border-slate-800"
            >
              <span className="text-[10px] font-mono text-slate-500 mb-1">R{idx + 1}</span>
              <div className="w-full py-2 bg-purple-950/60 border border-purple-500/40 rounded text-center text-purple-300 font-mono text-base sm:text-lg font-black tracking-wider shadow-inner">
                {hex}
              </div>

              {/* Toggle switch */}
              <button
                type="button"
                disabled={solved}
                onClick={() => toggleSwitch(idx)}
                className={`w-10 h-16 rounded-full my-3 p-1 flex flex-col justify-between items-center transition-all cursor-pointer border-2 ${
                  isUp
                    ? 'bg-purple-600/40 border-purple-500 justify-start'
                    : 'bg-slate-900 border-slate-700 justify-end'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full shadow-md transition-all ${
                    isUp ? 'bg-purple-400 shadow-purple-500/50' : 'bg-slate-600'
                  }`}
                />
              </button>

              <span className="text-[10px] font-mono font-bold text-slate-400">
                {isUp ? 'ARRIBA' : 'ABAJO'}
              </span>
            </div>
          );
        })}
      </div>

      <div className="w-full flex flex-col items-center gap-2">
        <button
          type="button"
          disabled={solved}
          onClick={handleConfirm}
          className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 active:scale-95 rounded-xl text-white font-black tracking-wider uppercase transition-all shadow-lg shadow-purple-600/30 cursor-pointer disabled:opacity-50"
        >
          {solved ? 'ENCLAVADOS ✓' : 'ENCLAVAR RELÉS'}
        </button>
        <span className="text-xs text-slate-400 font-mono text-center">
          Posiciona cada conmutador en ARRIBA o ABAJO según el manual
        </span>
      </div>
    </div>
  );
};
