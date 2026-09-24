import React, { useState } from 'react';
import { Cpu } from 'lucide-react';

interface CompuertasLogicasModuleProps {
  operatorState: {
    inputA: number;
    inputB: number;
    gate: 'AND' | 'OR' | 'XOR' | 'NAND';
    pins: boolean[];
  };
  solved: boolean;
  onAction: (action: { pins: boolean[] }) => void;
}

export const CompuertasLogicasModule: React.FC<CompuertasLogicasModuleProps> = ({
  operatorState,
  solved,
  onAction,
}) => {
  const { inputA, inputB, gate } = operatorState;
  const [pins, setPins] = useState<boolean[]>([false, false, false]);

  const togglePin = (index: number) => {
    if (solved) return;
    setPins((prev) => {
      const copy = [...prev];
      copy[index] = !copy[index];
      return copy;
    });
  };

  const handleEnergize = () => {
    if (solved) return;
    onAction({ pins });
  };

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-6 bg-slate-900/90 rounded-2xl border border-slate-700 select-none">
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-blue-400" />
          <span className="text-xs uppercase font-mono tracking-widest text-slate-400">
            Compuerta Lógica Integrada
          </span>
        </div>
        <span className="px-2.5 py-0.5 bg-blue-950 border border-blue-500/40 rounded text-blue-400 font-mono text-xs font-bold">
          CHIP-{gate}
        </span>
      </div>

      {/* Logic schematic visual */}
      <div className="flex items-center justify-center gap-4 my-4 w-full max-w-sm">
        {/* Inputs */}
        <div className="flex flex-col gap-3 font-mono text-xs">
          <div className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-300">
            ENTRADA A: <span className="font-bold text-blue-400">{inputA}</span>
          </div>
          <div className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-slate-300">
            ENTRADA B: <span className="font-bold text-blue-400">{inputB}</span>
          </div>
        </div>

        {/* Central Gate Badge */}
        <div className="w-20 h-20 bg-slate-950 rounded-2xl border-2 border-blue-500 flex flex-col items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.3)]">
          <span className="text-[10px] font-mono text-slate-400">LÓGICA</span>
          <span className="text-base font-black text-blue-400">{gate}</span>
        </div>
      </div>

      {/* 3 Output Shunt Pins */}
      <div className="flex justify-center gap-4 my-2">
        {[0, 1, 2].map((idx) => {
          const isOn = pins[idx];
          return (
            <button
              key={idx}
              type="button"
              disabled={solved}
              onClick={() => togglePin(idx)}
              className={`w-16 h-20 rounded-xl border-2 flex flex-col items-center justify-between p-2 transition-all cursor-pointer ${
                solved
                  ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400'
                  : isOn
                  ? 'bg-blue-500/20 border-blue-400 text-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.4)]'
                  : 'bg-slate-950 border-slate-700 text-slate-500 hover:border-slate-500'
              }`}
            >
              <span className="text-[10px] font-mono font-bold">PIN {idx + 1}</span>
              <div
                className={`w-4 h-4 rounded-full ${
                  isOn ? 'bg-blue-400 animate-pulse' : 'bg-slate-800'
                }`}
              />
              <span className="text-[10px] font-mono">{isOn ? 'ON' : 'OFF'}</span>
            </button>
          );
        })}
      </div>

      <div className="w-full flex flex-col items-center gap-2">
        <button
          type="button"
          disabled={solved}
          onClick={handleEnergize}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 rounded-xl text-white font-black tracking-wider uppercase transition-all shadow-lg shadow-blue-600/30 cursor-pointer disabled:opacity-50"
        >
          {solved ? 'CIRCUITO ENERGIZADO ✓' : 'ENERGIZAR'}
        </button>
        <span className="text-xs text-slate-400 font-mono text-center">
          Activa los pines según el resultado de la compuerta lógica (1 o 0)
        </span>
      </div>
    </div>
  );
};
