import React, { useState } from 'react';
import { Activity, Minus, Plus } from 'lucide-react';

interface ModuladorFrecuenciaModuleProps {
  operatorState: {
    waveform: 'SENOIDAL' | 'CUADRADA' | 'TRIANGULAR' | 'DIENTE_SIERRA';
    channel: 'CANAL-ALPHA' | 'CANAL-BETA' | 'CANAL-GAMMA';
    currentFreq: number;
    baseFreq: number;
  };
  solved: boolean;
  onAction: (action: { tunedFreq: number }) => void;
}

export const ModuladorFrecuenciaModule: React.FC<ModuladorFrecuenciaModuleProps> = ({
  operatorState,
  solved,
  onAction,
}) => {
  const { waveform, channel, baseFreq } = operatorState;
  const [freq, setFreq] = useState<number>(baseFreq);

  const handleAdjust = (delta: number) => {
    if (solved) return;
    setFreq((prev) => Math.max(50, Math.min(300, prev + delta)));
  };

  const handleCalibrate = () => {
    if (solved) return;
    onAction({ tunedFreq: freq });
  };

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-6 bg-slate-900/90 rounded-2xl border border-slate-700 select-none">
      {/* Header info */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-xs uppercase font-mono tracking-widest text-slate-400">
            Osciloscopio Armónico
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="px-2.5 py-0.5 bg-emerald-950 border border-emerald-500/40 rounded text-emerald-400 font-mono text-xs font-bold">
            {channel}
          </span>
        </div>
      </div>

      {/* Phosphor CRT Display */}
      <div className="relative w-full max-w-md h-36 sm:h-44 bg-slate-950 rounded-xl border-2 border-emerald-900/80 p-3 overflow-hidden shadow-[inset_0_0_20px_rgba(16,185,129,0.2)] my-3 flex flex-col justify-between">
        {/* CRT Scanline effect */}
        <div className="absolute inset-0 bg-radial from-transparent to-black/60 pointer-events-none" />

        <div className="relative z-10 flex justify-between items-center text-xs font-mono text-emerald-500/80">
          <span>BASE: {baseFreq}.0 kHz</span>
          <span className="font-bold">ONDA: {waveform}</span>
        </div>

        {/* Waveform graphic visualization */}
        <div className="relative z-10 flex-1 flex items-center justify-center">
          <svg className="w-full h-20" viewBox="0 0 300 80">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(16,185,129,0.15)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="300" height="80" fill="url(#grid)" />
            {waveform === 'SENOIDAL' && (
              <path
                d="M 0 40 Q 25 0 50 40 T 100 40 T 150 40 T 200 40 T 250 40 T 300 40"
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                className="drop-shadow-[0_0_6px_#10b981]"
              />
            )}
            {waveform === 'CUADRADA' && (
              <path
                d="M 0 60 L 40 60 L 40 20 L 80 20 L 80 60 L 120 60 L 120 20 L 160 20 L 160 60 L 200 60 L 200 20 L 240 20 L 240 60 L 280 60 L 280 20 L 300 20"
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                className="drop-shadow-[0_0_6px_#10b981]"
              />
            )}
            {waveform === 'TRIANGULAR' && (
              <path
                d="M 0 40 L 30 15 L 60 65 L 90 15 L 120 65 L 150 15 L 180 65 L 210 15 L 240 65 L 270 15 L 300 65"
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                className="drop-shadow-[0_0_6px_#10b981]"
              />
            )}
            {waveform === 'DIENTE_SIERRA' && (
              <path
                d="M 0 65 L 50 15 L 50 65 L 100 15 L 100 65 L 150 15 L 150 65 L 200 15 L 200 65 L 250 15 L 250 65 L 300 15"
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                className="drop-shadow-[0_0_6px_#10b981]"
              />
            )}
          </svg>
        </div>

        <div className="relative z-10 text-right font-mono text-emerald-400 font-bold text-sm">
          SINTONÍA: {freq}.0 kHz
        </div>
      </div>

      {/* Controls */}
      <div className="w-full flex items-center justify-center gap-4">
        <button
          type="button"
          disabled={solved}
          onClick={() => handleAdjust(-5)}
          className="p-3 bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-xl border border-slate-700 text-slate-200 transition-all cursor-pointer flex items-center gap-1 font-mono text-xs font-bold"
        >
          <Minus className="w-4 h-4" /> 5 kHz
        </button>

        <button
          type="button"
          disabled={solved}
          onClick={handleCalibrate}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 rounded-xl text-slate-950 font-black tracking-wider uppercase transition-all shadow-lg shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
        >
          {solved ? 'CALIBRADO ✓' : 'CALIBRAR'}
        </button>

        <button
          type="button"
          disabled={solved}
          onClick={() => handleAdjust(5)}
          className="p-3 bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-xl border border-slate-700 text-slate-200 transition-all cursor-pointer flex items-center gap-1 font-mono text-xs font-bold"
        >
          <Plus className="w-4 h-4" /> 5 kHz
        </button>
      </div>

      <div className="text-xs text-slate-400 font-mono text-center pt-2">
        Ajusta la frecuencia según la tabla armónica del manual
      </div>
    </div>
  );
};
