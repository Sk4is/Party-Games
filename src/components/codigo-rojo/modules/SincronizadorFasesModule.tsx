import React, { useState } from 'react';
import { Disc, RotateCw } from 'lucide-react';

interface SincronizadorFasesModuleProps {
  operatorState: {
    innerAngle: number;
    phaseMode: 'MODO-RESONANTE' | 'MODO-INVERSO';
    currentOuterAngle: number;
  };
  solved: boolean;
  onAction: (action: { outerAngle: number }) => void;
}

export const SincronizadorFasesModule: React.FC<SincronizadorFasesModuleProps> = ({
  operatorState,
  solved,
  onAction,
}) => {
  const { innerAngle, phaseMode } = operatorState;
  const [outerAngle, setOuterAngle] = useState(0);

  const rotateOuter = (delta: number) => {
    if (solved) return;
    setOuterAngle((prev) => (prev + delta + 360) % 360);
  };

  const handleSync = () => {
    if (solved) return;
    onAction({ outerAngle });
  };

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-6 bg-slate-900/90 rounded-2xl border border-slate-700 select-none">
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Disc className="w-4 h-4 text-cyan-400" />
          <span className="text-xs uppercase font-mono tracking-widest text-slate-400">
            Sincronizador Cuántico
          </span>
        </div>
        <span className="px-2.5 py-0.5 bg-cyan-950 border border-cyan-500/40 rounded text-cyan-400 font-mono text-xs font-bold">
          {phaseMode}
        </span>
      </div>

      {/* Two Concentric Rings */}
      <div className="relative w-48 h-48 sm:w-56 sm:h-56 bg-slate-950 rounded-full border-2 border-slate-800 flex items-center justify-center my-3 p-2 shadow-inner">
        {/* Outer Ring */}
        <div
          className="absolute inset-2 rounded-full border-4 border-dashed border-cyan-500/80 transition-transform duration-300 flex items-start justify-center pt-1"
          style={{ transform: `rotate(${outerAngle}deg)` }}
        >
          <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]" />
        </div>

        {/* Inner Ring (fixed angle) */}
        <div
          className="w-24 h-24 rounded-full border-4 border-dashed border-amber-500/80 flex items-start justify-center pt-1"
          style={{ transform: `rotate(${innerAngle}deg)` }}
        >
          <div className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
        </div>

        {/* Center Angle readout */}
        <div className="absolute text-center font-mono pointer-events-none">
          <div className="text-[10px] text-amber-400 font-bold">INT: {innerAngle}°</div>
          <div className="text-xs text-cyan-400 font-black">EXT: {outerAngle}°</div>
        </div>
      </div>

      {/* Controls */}
      <div className="w-full flex items-center justify-center gap-4">
        <button
          type="button"
          disabled={solved}
          onClick={() => rotateOuter(-60)}
          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-xl border border-slate-700 text-slate-300 font-mono text-xs font-bold transition-all cursor-pointer"
        >
          -60°
        </button>

        <button
          type="button"
          disabled={solved}
          onClick={handleSync}
          className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 active:scale-95 rounded-xl text-slate-950 font-black tracking-wider uppercase transition-all shadow-lg shadow-cyan-600/30 cursor-pointer disabled:opacity-50"
        >
          {solved ? 'SINCRONIZADO ✓' : 'SINCRONIZAR'}
        </button>

        <button
          type="button"
          disabled={solved}
          onClick={() => rotateOuter(60)}
          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-xl border border-slate-700 text-slate-300 font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
        >
          <RotateCw className="w-3.5 h-3.5" /> +60°
        </button>
      </div>

      <div className="text-xs text-slate-400 font-mono text-center pt-2">
        Alinea el anillo exterior según la fórmula del modo cuántico y sincroniza
      </div>
    </div>
  );
};
