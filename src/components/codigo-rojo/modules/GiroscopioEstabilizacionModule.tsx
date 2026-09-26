import React, { useState } from 'react';
import { Compass, RotateCw, Check } from 'lucide-react';
import { audio } from '../../../utils/audio';

interface GiroscopioEstabilizacionModuleProps {
  operatorState: {
    driftLed: boolean;
    angles?: { x: number; y: number; z: number };
  };
  solved: boolean;
  onAction: (action: { x: number; y: number; z: number }) => void;
}

const ORIENTATIONS = [0, 90, 180, 270];

export const GiroscopioEstabilizacionModule: React.FC<GiroscopioEstabilizacionModuleProps> = ({
  operatorState,
  solved,
  onAction,
}) => {
  const { driftLed = false } = operatorState || {};

  const [angleX, setAngleX] = useState(0);
  const [angleY, setAngleY] = useState(0);
  const [angleZ, setAngleZ] = useState(0);

  const handleStepAxis = (axis: 'x' | 'y' | 'z') => {
    if (solved) return;
    audio.playMechanicalDetent();
    if (axis === 'x') setAngleX((v) => (v + 90) % 360);
    if (axis === 'y') setAngleY((v) => (v + 90) % 360);
    if (axis === 'z') setAngleZ((v) => (v + 90) % 360);
  };

  const handleSubmit = () => {
    if (solved) return;
    audio.playMetalLever();
    onAction({ x: angleX, y: angleY, z: angleZ });
  };

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-4 sm:p-6 bg-slate-900/90 rounded-2xl border border-slate-700 select-none">
      {/* Header */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-cyan-400" />
          <span className="text-xs uppercase font-mono font-bold tracking-widest text-cyan-300">
            NAVEGACIÓN
          </span>
          <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
            // GIROSCOPIO DE ESTABILIZACIÓN TRIAXIAL
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-700 text-xs font-mono">
            <span
              className={`w-2 h-2 rounded-full ${
                driftLed
                  ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]'
                  : 'bg-slate-600'
              }`}
            />
            <span className="text-slate-400">LED DERIVA:</span>
            <strong className={driftLed ? 'text-amber-300' : 'text-slate-400'}>
              {driftLed ? 'ACTIVO' : 'APAGADO'}
            </strong>
          </div>
        </div>
      </div>

      {/* 3-Axis Gimbal Rings Canvas Visualizer */}
      <div className="w-full max-w-md my-4 relative h-44 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center p-3 shadow-inner">
        <svg viewBox="0 0 200 200" className="w-40 h-40">
          {/* Ring X (Outer / Red) */}
          <g transform={`rotate(${angleX} 100 100)`}>
            <circle cx="100" cy="100" r="75" stroke="#ef4444" strokeWidth="4" fill="none" strokeDasharray="14 4" />
            <circle cx="100" cy="25" r="4" fill="#fca5a5" />
          </g>

          {/* Ring Y (Middle / Green) */}
          <g transform={`rotate(${angleY} 100 100)`}>
            <circle cx="100" cy="100" r="54" stroke="#22c55e" strokeWidth="4" fill="none" strokeDasharray="12 4" />
            <circle cx="100" cy="46" r="3.5" fill="#86efac" />
          </g>

          {/* Ring Z (Inner / Blue) */}
          <g transform={`rotate(${angleZ} 100 100)`}>
            <circle cx="100" cy="100" r="34" stroke="#3b82f6" strokeWidth="4" fill="none" strokeDasharray="10 3" />
            <circle cx="100" cy="66" r="3" fill="#93c5fd" />
          </g>

          {/* Center Brass Inertia Rotor */}
          <circle cx="100" cy="100" r="14" fill="#eab308" stroke="#ca8a04" strokeWidth="1.5" />
          <line x1="86" y1="100" x2="114" y2="100" stroke="#ffffff" strokeWidth="2" />
        </svg>

        {/* Readout floating badges */}
        <div className="absolute bottom-2 left-3 text-[10px] font-mono text-slate-400">
          TRIAXIAL INERCIAL
        </div>
      </div>

      {/* 3 Axis Control Rows */}
      <div className="w-full max-w-md grid grid-cols-3 gap-2">
        {/* Axis X */}
        <div className="p-2.5 rounded-xl bg-slate-950 border border-red-900/60 flex flex-col items-center gap-1.5 shadow">
          <span className="text-[10px] font-mono font-bold text-red-400">EJE X (ROLL)</span>
          <button
            type="button"
            onClick={() => handleStepAxis('x')}
            disabled={solved}
            className="w-full py-2 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-500/60 text-white font-mono font-black text-sm flex items-center justify-center gap-1 cursor-pointer transition active:scale-95"
          >
            <span>{angleX}°</span>
            <RotateCw className="w-3 h-3 opacity-70" />
          </button>
        </div>

        {/* Axis Y */}
        <div className="p-2.5 rounded-xl bg-slate-950 border border-emerald-900/60 flex flex-col items-center gap-1.5 shadow">
          <span className="text-[10px] font-mono font-bold text-emerald-400">EJE Y (PITCH)</span>
          <button
            type="button"
            onClick={() => handleStepAxis('y')}
            disabled={solved}
            className="w-full py-2 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/60 text-white font-mono font-black text-sm flex items-center justify-center gap-1 cursor-pointer transition active:scale-95"
          >
            <span>{angleY}°</span>
            <RotateCw className="w-3 h-3 opacity-70" />
          </button>
        </div>

        {/* Axis Z */}
        <div className="p-2.5 rounded-xl bg-slate-950 border border-blue-900/60 flex flex-col items-center gap-1.5 shadow">
          <span className="text-[10px] font-mono font-bold text-blue-400">EJE Z (YAW)</span>
          <button
            type="button"
            onClick={() => handleStepAxis('z')}
            disabled={solved}
            className="w-full py-2 rounded-lg bg-blue-950/80 hover:bg-blue-900 border border-blue-500/60 text-white font-mono font-black text-sm flex items-center justify-center gap-1 cursor-pointer transition active:scale-95"
          >
            <span>{angleZ}°</span>
            <RotateCw className="w-3 h-3 opacity-70" />
          </button>
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
              : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/30 active:scale-95'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>{solved ? 'GIROSCOPIO BLOQUEADO' : 'ESTABILIZAR'}</span>
        </button>
      </div>
    </div>
  );
};
