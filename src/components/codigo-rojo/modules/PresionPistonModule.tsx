import React, { useState } from 'react';
import { Gauge, Lock, ArrowDown, ArrowUp } from 'lucide-react';
import { audio } from '../../../utils/audio';

interface PresionPistonModuleProps {
  operatorState: {
    cylinderType: string;
    temperature: number;
    currentNotch?: number;
  };
  solved: boolean;
  onAction: (action: { notch: number }) => void;
}

const NOTCHES = [
  { id: 1, name: 'MUESCA 1 (SUPERIOR)', psi: 20, desc: 'Expansión / 20 PSI' },
  { id: 2, name: 'MUESCA 2 (MEDIA)', psi: 50, desc: 'Media / 50 PSI' },
  { id: 3, name: 'MUESCA 3 (INFERIOR)', psi: 85, desc: 'Compresión Máx / 85 PSI' },
];

export const PresionPistonModule: React.FC<PresionPistonModuleProps> = ({
  operatorState,
  solved,
  onAction,
}) => {
  const { cylinderType = 'CILINDRO ALFA', temperature = 35 } = operatorState || {};

  const [notch, setNotch] = useState<number>(1);

  const activeNotchObj = NOTCHES.find((n) => n.id === notch) || NOTCHES[0];

  const handleSelectNotch = (newNotch: number) => {
    if (solved) return;
    audio.playPistonCompression();
    setNotch(newNotch);
  };

  const handleSubmit = () => {
    if (solved) return;
    audio.playMetalLever();
    onAction({ notch });
  };

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-4 sm:p-6 bg-slate-900/90 rounded-2xl border border-slate-700 select-none">
      {/* Header */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-sky-400" />
          <span className="text-xs uppercase font-mono font-bold tracking-widest text-sky-300">
            NEUMÁTICA
          </span>
          <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
            // CÁMARA DE PRESIÓN POR PISTÓN
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-sky-950 border border-sky-500/50 text-xs font-mono font-bold text-sky-200">
            {cylinderType}
          </span>
          <span className="text-xs font-mono text-slate-300">
            {temperature} °C
          </span>
        </div>
      </div>

      {/* Main Cylinder Visualizer */}
      <div className="w-full max-w-md my-4 flex items-center justify-around bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-inner">
        {/* Physical Vertical Transparent Cylinder */}
        <div className="relative w-20 h-48 bg-slate-900/90 rounded-xl border-2 border-sky-500/60 overflow-hidden flex flex-col justify-between p-1 shadow-2xl">
          {/* Top Cylinder Flange */}
          <div className="w-full h-2 bg-slate-700 rounded-t" />

          {/* Piston Rod & Plunger Head */}
          <div
            className="w-full transition-all duration-300 ease-out flex flex-col items-center"
            style={{
              transform: `translateY(${notch === 1 ? '10px' : notch === 2 ? '65px' : '115px'})`,
            }}
          >
            {/* T-Handle */}
            <div className="w-14 h-3 bg-gradient-to-r from-slate-400 via-white to-slate-400 rounded-full shadow" />
            {/* Chrome Rod */}
            <div className="w-3 h-10 bg-gradient-to-r from-slate-400 to-slate-200" />
            {/* Plunger Disc */}
            <div className="w-16 h-5 bg-sky-600 rounded-md border border-sky-300 shadow-md flex items-center justify-center">
              <span className="text-[8px] font-mono font-bold text-white"># {notch}</span>
            </div>
          </div>

          {/* Bottom Chamber Air Glow */}
          <div
            className="w-full bg-sky-500/20 transition-all duration-300 rounded-b"
            style={{ height: `${(notch / 3) * 40}%` }}
          />
        </div>

        {/* Pressure Dial & Notch Selector */}
        <div className="flex flex-col gap-3">
          {/* Pressure Gauge Widget */}
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-700 flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-950 border-2 border-sky-400 flex items-center justify-center relative shadow-inner">
              <div
                className="w-1 h-5 bg-red-500 rounded-full origin-bottom transition-transform duration-300"
                style={{
                  transform: `rotate(${notch === 1 ? '-45deg' : notch === 2 ? '0deg' : '55deg'})`,
                }}
              />
              <div className="absolute w-2 h-2 rounded-full bg-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-mono text-slate-400">PRESIÓN CÁMARA</span>
              <span className="text-base font-mono font-black text-sky-300">
                {activeNotchObj.psi} PSI
              </span>
            </div>
          </div>

          {/* Notch Step Buttons */}
          <div className="flex flex-col gap-1.5">
            {NOTCHES.map((n) => {
              const isSelected = notch === n.id;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => handleSelectNotch(n.id)}
                  disabled={solved}
                  className={`px-3 py-2 rounded-xl font-mono text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer border ${
                    isSelected
                      ? 'bg-sky-600 text-white border-sky-300 shadow-md scale-102'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <span>Muesca {n.id}</span>
                  <span className="text-[10px] opacity-80">{n.psi} PSI</span>
                </button>
              );
            })}
          </div>
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
              : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/30 active:scale-95'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>{solved ? 'PISTÓN ENCLAVADO' : 'BLOQUEAR PISTÓN'}</span>
        </button>
      </div>
    </div>
  );
};
