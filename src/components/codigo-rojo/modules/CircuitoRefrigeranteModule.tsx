import React, { useState } from 'react';
import { Thermometer, Snowflake, Plus, Minus } from 'lucide-react';
import { audio } from '../../../utils/audio';

interface CircuitoRefrigeranteModuleProps {
  operatorState: {
    coreTemp: number;
    maxUnits?: number;
    levels?: { frio: number; templado: number; caliente: number };
  };
  solved: boolean;
  onAction: (action: { frio: number; templado: number; caliente: number }) => void;
}

export const CircuitoRefrigeranteModule: React.FC<CircuitoRefrigeranteModuleProps> = ({
  operatorState,
  solved,
  onAction,
}) => {
  const { coreTemp = 285 } = operatorState || {};

  const [frio, setFrio] = useState(0);
  const [templado, setTemplado] = useState(0);
  const [caliente, setCaliente] = useState(0);

  const totalUnits = frio + templado + caliente;
  const maxUnits = 5;

  const handleAdjust = (type: 'frio' | 'templado' | 'caliente', delta: number) => {
    if (solved) return;
    audio.playClick();
    if (delta > 0 && totalUnits >= maxUnits) return;

    if (type === 'frio') setFrio((v) => Math.max(0, Math.min(4, v + delta)));
    if (type === 'templado') setTemplado((v) => Math.max(0, Math.min(4, v + delta)));
    if (type === 'caliente') setCaliente((v) => Math.max(0, Math.min(4, v + delta)));
  };

  const handleSubmit = () => {
    if (solved) return;
    audio.playMetalLever();
    onAction({ frio, templado, caliente });
  };

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-4 sm:p-6 bg-slate-900/90 rounded-2xl border border-slate-700 select-none">
      {/* Header with Core Temp */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Snowflake className="w-4 h-4 text-orange-400" />
          <span className="text-xs uppercase font-mono font-bold tracking-widest text-orange-300">
            TÉRMICO
          </span>
          <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
            // CIRCUITO DE REFRIGERANTE
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-950/80 border border-orange-500/50">
            <Thermometer className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-[11px] font-mono text-orange-200">
              NÚCLEO: <strong className="text-white text-xs">{coreTemp} °C</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Reservoir & Chamber Display */}
      <div className="w-full max-w-lg my-3 grid grid-cols-3 gap-3">
        {/* FRÍO Tank */}
        <div className="flex flex-col items-center p-3 rounded-xl bg-slate-950 border border-cyan-800/60 shadow">
          <span className="text-[10px] font-mono font-black text-cyan-400 uppercase tracking-wider mb-2">
            FRÍO (5°C)
          </span>
          <div className="w-12 h-24 bg-slate-900 rounded-lg border border-cyan-700/80 relative flex items-end overflow-hidden p-1">
            <div
              className="w-full bg-cyan-500 transition-all duration-300 rounded-b"
              style={{ height: `${(frio / 4) * 100}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-white mt-1">{frio} ud.</span>
          <div className="flex items-center gap-1 mt-2">
            <button
              type="button"
              onClick={() => handleAdjust('frio', -1)}
              disabled={solved || frio <= 0}
              className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold cursor-pointer disabled:opacity-30"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleAdjust('frio', 1)}
              disabled={solved || totalUnits >= maxUnits || frio >= 4}
              className="w-7 h-7 rounded bg-cyan-700 hover:bg-cyan-600 text-white flex items-center justify-center font-bold cursor-pointer disabled:opacity-30"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* TEMPLADO Tank */}
        <div className="flex flex-col items-center p-3 rounded-xl bg-slate-950 border border-amber-800/60 shadow">
          <span className="text-[10px] font-mono font-black text-amber-400 uppercase tracking-wider mb-2">
            TEMPLADO
          </span>
          <div className="w-12 h-24 bg-slate-900 rounded-lg border border-amber-700/80 relative flex items-end overflow-hidden p-1">
            <div
              className="w-full bg-amber-500 transition-all duration-300 rounded-b"
              style={{ height: `${(templado / 4) * 100}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-white mt-1">{templado} ud.</span>
          <div className="flex items-center gap-1 mt-2">
            <button
              type="button"
              onClick={() => handleAdjust('templado', -1)}
              disabled={solved || templado <= 0}
              className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold cursor-pointer disabled:opacity-30"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleAdjust('templado', 1)}
              disabled={solved || totalUnits >= maxUnits || templado >= 4}
              className="w-7 h-7 rounded bg-amber-700 hover:bg-amber-600 text-white flex items-center justify-center font-bold cursor-pointer disabled:opacity-30"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* CALIENTE Tank */}
        <div className="flex flex-col items-center p-3 rounded-xl bg-slate-950 border border-red-800/60 shadow">
          <span className="text-[10px] font-mono font-black text-red-400 uppercase tracking-wider mb-2">
            CALIENTE
          </span>
          <div className="w-12 h-24 bg-slate-900 rounded-lg border border-red-700/80 relative flex items-end overflow-hidden p-1">
            <div
              className="w-full bg-red-500 transition-all duration-300 rounded-b"
              style={{ height: `${(caliente / 4) * 100}%` }}
            />
          </div>
          <span className="text-xs font-mono font-bold text-white mt-1">{caliente} ud.</span>
          <div className="flex items-center gap-1 mt-2">
            <button
              type="button"
              onClick={() => handleAdjust('caliente', -1)}
              disabled={solved || caliente <= 0}
              className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold cursor-pointer disabled:opacity-30"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleAdjust('caliente', 1)}
              disabled={solved || totalUnits >= maxUnits || caliente >= 4}
              className="w-7 h-7 rounded bg-red-700 hover:bg-red-600 text-white flex items-center justify-center font-bold cursor-pointer disabled:opacity-30"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Chamber Total Capacity Bar */}
      <div className="w-full max-w-md flex items-center justify-between px-2 text-xs font-mono text-slate-400">
        <span>VOLUMEN TOTAL MEZCLADO:</span>
        <span className={totalUnits > 0 ? 'text-amber-300 font-bold' : 'text-slate-500'}>
          {totalUnits} / {maxUnits} unidades
        </span>
      </div>

      {/* Submit Action */}
      <div className="w-full pt-4 border-t border-slate-800 flex justify-center">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={solved || totalUnits === 0}
          className={`w-full max-w-sm py-3 rounded-xl font-mono text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
            solved
              ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/50 cursor-default'
              : totalUnits > 0
              ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-600/30 active:scale-95'
              : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
          }`}
        >
          <Snowflake className="w-4 h-4" />
          <span>{solved ? 'CIRCUITO ESTABILIZADO' : 'INICIAR REFRIGERACIÓN'}</span>
        </button>
      </div>
    </div>
  );
};
