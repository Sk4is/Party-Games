import React, { useState } from 'react';
import { Shield, Lock, Sliders } from 'lucide-react';
import { audio } from '../../../utils/audio';

interface PlacasSuperpuestasModuleProps {
  operatorState: {
    securityLevel: string;
    positions?: { p1: number; p2: number; p3: number };
  };
  solved: boolean;
  onAction: (action: { p1: number; p2: number; p3: number }) => void;
}

export const PlacasSuperpuestasModule: React.FC<PlacasSuperpuestasModuleProps> = ({
  operatorState,
  solved,
  onAction,
}) => {
  const { securityLevel = 'NIVEL I (Verde)' } = operatorState || {};

  const [p1, setP1] = useState<number>(1);
  const [p2, setP2] = useState<number>(1);
  const [p3, setP3] = useState<number>(1);

  const handleSetPosition = (plate: 1 | 2 | 3, pos: number) => {
    if (solved) return;
    audio.playMetalLever();
    if (plate === 1) setP1(pos);
    if (plate === 2) setP2(pos);
    if (plate === 3) setP3(pos);
  };

  const handleSubmit = () => {
    if (solved) return;
    audio.playMetalLever();
    onAction({ p1, p2, p3 });
  };

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-4 sm:p-6 bg-slate-900/90 rounded-2xl border border-slate-700 select-none">
      {/* Header */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-lime-400" />
          <span className="text-xs uppercase font-mono font-bold tracking-widest text-lime-300">
            SEGURIDAD
          </span>
          <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
            // CERRADURA DE PLACAS SUPERPUESTAS
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-700 text-xs font-mono font-bold text-lime-200">
            {securityLevel}
          </span>
        </div>
      </div>

      {/* Main Optical Silhouette & Plate Aperture Visualizer */}
      <div className="w-full max-w-md my-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-inner flex flex-col items-center gap-3">
        {/* Backlit Silhouette Viewport */}
        <div className="w-44 h-24 bg-slate-900 rounded-xl border-2 border-lime-500/60 shadow-inner relative flex items-center justify-center overflow-hidden">
          {/* Simulated 3 overlapping aperture layers */}
          <div
            className="absolute w-28 h-16 border border-lime-400/40 rounded transition-transform duration-300 pointer-events-none"
            style={{ transform: `translateX(${(p1 - 2) * 20}px)` }}
          >
            <div className="w-8 h-full bg-lime-400/20" />
          </div>
          <div
            className="absolute w-28 h-16 border border-lime-400/50 rounded transition-transform duration-300 pointer-events-none"
            style={{ transform: `translateX(${(p2 - 2) * -18}px)` }}
          >
            <div className="w-6 h-full mx-auto bg-lime-400/30" />
          </div>
          <div
            className="absolute w-28 h-16 border border-lime-400/60 rounded transition-transform duration-300 pointer-events-none"
            style={{ transform: `translateX(${(p3 - 2) * 24}px)` }}
          >
            <div className="w-8 h-full ml-auto bg-lime-400/25" />
          </div>

          <span className="text-[9px] font-mono font-bold text-lime-300/80 z-10">
            SILUETA ÓPTICA
          </span>
        </div>

        {/* 3 Slider Tracks */}
        <div className="w-full flex flex-col gap-2">
          {[
            { id: 1 as const, name: 'PLACA 1 (FRONTAL)', val: p1 },
            { id: 2 as const, name: 'PLACA 2 (INTERMEDIA)', val: p2 },
            { id: 3 as const, name: 'PLACA 3 (TRASERA)', val: p3 },
          ].map((plate) => (
            <div
              key={plate.id}
              className="flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-slate-700"
            >
              <span className="text-[10px] font-mono font-bold text-slate-300">
                {plate.name}
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3].map((pos) => {
                  const isPosActive = plate.val === pos;
                  return (
                    <button
                      key={pos}
                      type="button"
                      onClick={() => handleSetPosition(plate.id, pos)}
                      disabled={solved}
                      className={`w-8 h-8 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                        isPosActive
                          ? 'bg-lime-600 text-white border-2 border-lime-300 shadow-md scale-105'
                          : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                      }`}
                    >
                      {pos}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
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
              : 'bg-lime-600 hover:bg-lime-500 text-white shadow-lime-600/30 active:scale-95'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>{solved ? 'PLACAS ENCLAVADAS' : 'ENCLAVAR PLACAS'}</span>
        </button>
      </div>
    </div>
  );
};
