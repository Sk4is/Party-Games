import React, { useState } from 'react';
import { Gauge, Sliders } from 'lucide-react';
import { audio } from '../../../utils/audio';

interface DivisorVoltajeModuleProps {
  operatorState: {
    deflectionMV: number;
    scale: 'R1 (x1)' | 'R2 (x2)' | 'R3 (x3)';
    dialValue?: number;
  };
  solved: boolean;
  onAction: (action: { dialValue: number }) => void;
}

export const DivisorVoltajeModule: React.FC<DivisorVoltajeModuleProps> = ({
  operatorState,
  solved,
  onAction,
}) => {
  const { deflectionMV, scale } = operatorState;
  const [dialValue, setDialValue] = useState<number>(operatorState.dialValue || 50);

  const adjustDial = (delta: number) => {
    if (solved) return;
    audio.playClick();
    setDialValue((prev) => {
      let next = (prev + delta) % 100;
      if (next < 0) next += 100;
      return next;
    });
  };

  const handleBalance = () => {
    if (solved) return;
    audio.playTerminalBeep();
    onAction({ dialValue });
  };

  // Needle angle for Galvanometer (-50mV to +50mV maps to -45deg to +45deg)
  const needleAngle = solved ? 0 : Math.max(-50, Math.min(50, deflectionMV)) * 0.9;

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-4 sm:p-6 bg-slate-900/90 rounded-2xl border border-slate-700 select-none">
      {/* Header */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-blue-400" />
          <span className="text-xs uppercase font-mono font-bold tracking-widest text-blue-300">
            ELECTRICIDAD
          </span>
          <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
            // PUENTE GALVÁNICO
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-slate-950 rounded border border-slate-800 text-xs font-mono font-bold text-amber-400">
            ESCALA: {scale}
          </div>
          <div
            className={`px-3 py-1 rounded text-xs font-mono font-black border ${
              deflectionMV >= 0
                ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300'
                : 'bg-rose-950/70 border-rose-500/60 text-rose-300'
            }`}
          >
            {deflectionMV >= 0 ? `+${deflectionMV} mV` : `${deflectionMV} mV`}
          </div>
        </div>
      </div>

      {/* Main Analog Galvanometer & Dial Panel */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-around gap-6 my-4">
        {/* Analog Galvanometer Arc */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative w-48 h-28 sm:w-56 sm:h-32 bg-slate-950 rounded-t-full border-4 border-b-0 border-slate-700 flex flex-col items-center justify-end p-2 shadow-2xl overflow-hidden">
            {/* Scale Markings */}
            <div className="absolute top-3 inset-x-4 flex justify-between text-[9px] font-mono text-slate-500">
              <span>-50</span>
              <span>-25</span>
              <span className="font-bold text-emerald-400">0</span>
              <span>+25</span>
              <span>+50</span>
            </div>

            {/* Scale Arc Line */}
            <div className="w-40 sm:w-48 h-20 border-t-2 border-slate-600 rounded-t-full absolute top-8" />

            {/* Needle Pivot & Moving Needle */}
            <div
              className="absolute bottom-0 w-1 h-24 sm:h-28 bg-red-500 origin-bottom transition-transform duration-500 ease-out shadow-[0_0_8px_#ef4444]"
              style={{ transform: `rotate(${needleAngle}deg)` }}
            />

            {/* Pivot Cap */}
            <div className="w-6 h-6 rounded-full bg-slate-700 border-2 border-slate-500 relative z-10 shadow" />
          </div>

          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
            Galvanómetro de Cero Central
          </span>
        </div>

        {/* Potentiometer Dial Controls */}
        <div className="flex flex-col items-center gap-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
          <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
            Ajuste del Potenciómetro
          </span>

          {/* Large Digital Readout */}
          <div className="text-4xl sm:text-5xl font-mono font-black text-emerald-400 bg-slate-950 px-6 py-2 rounded-xl border border-emerald-500/40 shadow-inner">
            {dialValue.toString().padStart(2, '0')}
          </div>

          {/* Buttons +/- 10 and +/- 1 */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={solved}
              onClick={() => adjustDial(-10)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-mono text-xs font-bold border border-slate-700 cursor-pointer"
            >
              -10
            </button>
            <button
              type="button"
              disabled={solved}
              onClick={() => adjustDial(-1)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-mono text-xs font-bold border border-slate-700 cursor-pointer"
            >
              -1
            </button>
            <button
              type="button"
              disabled={solved}
              onClick={() => adjustDial(1)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-mono text-xs font-bold border border-slate-700 cursor-pointer"
            >
              +1
            </button>
            <button
              type="button"
              disabled={solved}
              onClick={() => adjustDial(10)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-mono text-xs font-bold border border-slate-700 cursor-pointer"
            >
              +10
            </button>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="w-full flex flex-col items-center gap-2 pt-2 border-t border-slate-800">
        <button
          type="button"
          disabled={solved}
          onClick={handleBalance}
          className={`w-full max-w-xs py-3 rounded-xl font-mono text-sm font-black uppercase tracking-wider transition-all transform active:scale-95 cursor-pointer shadow-lg flex items-center justify-center gap-2 ${
            solved
              ? 'bg-emerald-600 text-white cursor-default shadow-emerald-600/30'
              : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 hover:text-white shadow-emerald-600/30 hover:shadow-emerald-500/50'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>{solved ? '✓ PUENTE EN EQUILIBRIO' : 'EQUILIBRAR PUENTE'}</span>
        </button>

        <span className="text-[11px] text-slate-400 font-mono text-center">
          {solved
            ? '✓ Tensión galvánica anulada en 0 mV'
            : 'Sintoniza el dial al valor objetivo deducido del manual y acciona la palanca'}
        </span>
      </div>
    </div>
  );
};
