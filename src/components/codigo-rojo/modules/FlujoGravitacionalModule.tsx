import React, { useState } from 'react';
import { GitFork, RotateCw, Play } from 'lucide-react';
import { audio } from '../../../utils/audio';

interface FlujoGravitacionalModuleProps {
  operatorState: {
    targetDestinations: { red: string; blue: string };
    valves?: { v1: string; v2: string; v3: string };
  };
  solved: boolean;
  onAction: (action: { valves: { v1: string; v2: string; v3: string } }) => void;
}

const VALVE_STATES = ['IZQ', 'REC', 'DER'] as const;

export const FlujoGravitacionalModule: React.FC<FlujoGravitacionalModuleProps> = ({
  operatorState,
  solved,
  onAction,
}) => {
  const { targetDestinations = { red: 'A', blue: 'B' } } = operatorState || {};

  const [v1, setV1] = useState<'IZQ' | 'REC' | 'DER'>('IZQ');
  const [v2, setV2] = useState<'IZQ' | 'REC' | 'DER'>('REC');
  const [v3, setV3] = useState<'IZQ' | 'REC' | 'DER'>('REC');

  const [isReleasing, setIsReleasing] = useState(false);

  const handleCycleValve = (valveKey: 'v1' | 'v2' | 'v3') => {
    if (solved || isReleasing) return;
    audio.playClick();
    if (valveKey === 'v1') {
      const idx = VALVE_STATES.indexOf(v1);
      setV1(VALVE_STATES[(idx + 1) % VALVE_STATES.length]);
    } else if (valveKey === 'v2') {
      const idx = VALVE_STATES.indexOf(v2);
      setV2(VALVE_STATES[(idx + 1) % VALVE_STATES.length]);
    } else {
      const idx = VALVE_STATES.indexOf(v3);
      setV3(VALVE_STATES[(idx + 1) % VALVE_STATES.length]);
    }
  };

  const handleSubmit = () => {
    if (solved || isReleasing) return;
    setIsReleasing(true);
    audio.playMetalLever();
    setTimeout(() => {
      setIsReleasing(false);
      onAction({ valves: { v1, v2, v3 } });
    }, 700);
  };

  const getValveLabel = (val: 'IZQ' | 'REC' | 'DER') => {
    if (val === 'IZQ') return '◄ IZQUIERDA';
    if (val === 'REC') return '▼ RECTO';
    return 'DERECHA ►';
  };

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-4 sm:p-6 bg-slate-900/90 rounded-2xl border border-slate-700 select-none">
      {/* Header */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <GitFork className="w-4 h-4 text-indigo-400" />
          <span className="text-xs uppercase font-mono font-bold tracking-widest text-indigo-300">
            FLUIDOS
          </span>
          <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
            // REGULADOR DE FLUJO GRAVITACIONAL
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-[10px] font-mono">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <strong className="text-white">ROJA → DEP. {targetDestinations.red}</strong>
            </span>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <strong className="text-white">AZUL → DEP. {targetDestinations.blue}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Gravity Maze Interactive Canvas */}
      <div className="w-full max-w-md my-3 bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-col items-center gap-3 relative shadow-inner">
        {/* Top Bead Chute */}
        <div className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900 border border-slate-700">
          <div className="w-3.5 h-3.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
          <span className="text-[10px] font-mono text-slate-400">ESFERAS EN TOLVA</span>
          <div className="w-3.5 h-3.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
        </div>

        {/* Valve 1 (Top Center) */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[9px] font-mono text-indigo-300 font-bold">VÁLVULA 1 (PRIMARIA)</span>
          <button
            type="button"
            onClick={() => handleCycleValve('v1')}
            disabled={solved || isReleasing}
            className="px-4 py-1.5 rounded-xl bg-indigo-950 border border-indigo-500/80 hover:bg-indigo-900 text-white font-mono text-xs font-bold flex items-center gap-2 cursor-pointer shadow transition active:scale-95"
          >
            <span>{getValveLabel(v1)}</span>
            <RotateCw className="w-3 h-3 text-indigo-400" />
          </button>
        </div>

        {/* Valves 2 & 3 (Left and Right Secondary) */}
        <div className="w-full flex items-center justify-around">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[9px] font-mono text-indigo-300 font-bold">VÁLVULA 2 (IZQ)</span>
            <button
              type="button"
              onClick={() => handleCycleValve('v2')}
              disabled={solved || isReleasing}
              className="px-3 py-1.5 rounded-xl bg-indigo-950 border border-indigo-500/80 hover:bg-indigo-900 text-white font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow transition active:scale-95"
            >
              <span>{getValveLabel(v2)}</span>
              <RotateCw className="w-3 h-3 text-indigo-400" />
            </button>
          </div>

          <div className="flex flex-col items-center gap-1">
            <span className="text-[9px] font-mono text-indigo-300 font-bold">VÁLVULA 3 (DER)</span>
            <button
              type="button"
              onClick={() => handleCycleValve('v3')}
              disabled={solved || isReleasing}
              className="px-3 py-1.5 rounded-xl bg-indigo-950 border border-indigo-500/80 hover:bg-indigo-900 text-white font-mono text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow transition active:scale-95"
            >
              <span>{getValveLabel(v3)}</span>
              <RotateCw className="w-3 h-3 text-indigo-400" />
            </button>
          </div>
        </div>

        {/* Bottom Reservoirs A, B, C */}
        <div className="w-full grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
          {['A', 'B', 'C'].map((dep) => (
            <div
              key={dep}
              className="flex flex-col items-center p-2 rounded-lg bg-slate-900/80 border border-slate-700"
            >
              <span className="text-[9px] font-mono text-slate-400">DEPÓSITO</span>
              <span className="text-sm font-mono font-black text-indigo-300">{dep}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Action */}
      <div className="w-full pt-4 border-t border-slate-800 flex justify-center">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={solved || isReleasing}
          className={`w-full max-w-sm py-3 rounded-xl font-mono text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
            solved
              ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/50 cursor-default'
              : isReleasing
              ? 'bg-indigo-800 text-indigo-200 animate-pulse'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30 active:scale-95'
          }`}
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{solved ? 'FLUJO ENCLAVADO' : isReleasing ? 'DESCENDIENDO...' : 'LIBERAR ESFERAS'}</span>
        </button>
      </div>
    </div>
  );
};
