import React, { useState } from 'react';
import { Activity, Radio } from 'lucide-react';
import { audio } from '../../../utils/audio';

interface FrecuenciaResonanciaModuleProps {
  operatorState: {
    peakFreq: '60 Hz' | '250 Hz' | '1 kHz' | '4 kHz' | '8 kHz' | '16 kHz';
    chamber: 'ALTA PRESIÓN' | 'VACÍO PARCIAL';
    activeFilters?: number[];
  };
  solved: boolean;
  onAction: (action: { activeFilters: number[] }) => void;
}

const FREQ_BANDS = [
  { label: '60 Hz', heightPct: 40 },
  { label: '250 Hz', heightPct: 55 },
  { label: '1 kHz', heightPct: 70 },
  { label: '4 kHz', heightPct: 60 },
  { label: '8 kHz', heightPct: 45 },
  { label: '16 kHz', heightPct: 35 },
];

const FILTERS = [
  { id: 1, name: 'F1', label: 'Pasabajos' },
  { id: 2, name: 'F2', label: 'Notch' },
  { id: 3, name: 'F3', label: 'Pasoaltos' },
  { id: 4, name: 'F4', label: 'Inversor' },
];

export const FrecuenciaResonanciaModule: React.FC<FrecuenciaResonanciaModuleProps> = ({
  operatorState,
  solved,
  onAction,
}) => {
  const { peakFreq, chamber } = operatorState;
  const [activeFilters, setActiveFilters] = useState<number[]>(
    operatorState.activeFilters || []
  );

  const toggleFilter = (id: number) => {
    if (solved) return;
    audio.playClick();
    setActiveFilters((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const handleApply = () => {
    if (solved) return;
    audio.playTerminalBeep();
    onAction({ activeFilters });
  };

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-4 sm:p-6 bg-slate-900/90 rounded-2xl border border-slate-700 select-none">
      {/* Header bar */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-xs uppercase font-mono font-bold tracking-widest text-emerald-300">
            SEÑAL
          </span>
          <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
            // ESPECTRO ARMÓNICO
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={`px-3 py-1 rounded font-mono text-xs font-bold border ${
              chamber === 'ALTA PRESIÓN'
                ? 'bg-amber-950/70 border-amber-500/60 text-amber-300'
                : 'bg-cyan-950/70 border-cyan-500/60 text-cyan-300'
            }`}
          >
            {chamber}
          </div>
          <div className="px-3 py-1 bg-red-950/80 border border-red-500/60 rounded text-red-400 font-mono text-xs font-black animate-pulse">
            PICO: {peakFreq}
          </div>
        </div>
      </div>

      {/* Main Spectrum Analyzer Display */}
      <div className="w-full flex flex-col items-center gap-4 my-4">
        {/* Equalizer Spectrum Box */}
        <div className="w-full max-w-lg h-36 sm:h-44 bg-slate-950 rounded-2xl border-2 border-slate-800 p-4 flex items-end justify-between gap-3 shadow-inner">
          {FREQ_BANDS.map((band) => {
            const isPeak = band.label === peakFreq;
            const barHeight = isPeak ? 95 : band.heightPct;
            return (
              <div key={band.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                {/* Bar */}
                <div className="w-full bg-slate-900 rounded-t-lg h-full flex flex-col justify-end p-0.5 overflow-hidden">
                  <div
                    className={`w-full rounded-t transition-all duration-500 ${
                      isPeak
                        ? 'bg-gradient-to-t from-red-600 to-rose-400 shadow-[0_0_12px_#f43f5e] animate-pulse'
                        : 'bg-gradient-to-t from-emerald-700 to-emerald-400 opacity-60'
                    }`}
                    style={{ height: `${barHeight}%` }}
                  />
                </div>
                <span
                  className={`text-[10px] sm:text-xs font-mono font-bold ${
                    isPeak ? 'text-red-400 animate-pulse font-black' : 'text-slate-400'
                  }`}
                >
                  {band.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* 4 Filter Toggle Switches */}
        <div className="w-full max-w-lg grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {FILTERS.map((filt) => {
            const isEngaged = activeFilters.includes(filt.id);
            return (
              <button
                key={filt.id}
                type="button"
                disabled={solved}
                onClick={() => toggleFilter(filt.id)}
                className={`p-3 rounded-xl border-2 font-mono transition-all transform active:scale-95 cursor-pointer flex flex-col items-center gap-1 shadow ${
                  isEngaged
                    ? 'bg-rose-950/70 border-rose-500 text-rose-300 shadow-[0_0_14px_rgba(244,63,94,0.3)]'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isEngaged ? 'bg-rose-400 animate-pulse shadow-[0_0_6px_#f43f5e]' : 'bg-slate-700'
                    }`}
                  />
                  <span className="text-sm font-black text-white">{filt.name}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-sans">{filt.label}</span>
                <span className="text-[9px] font-mono font-bold mt-0.5 text-slate-500">
                  {isEngaged ? 'ACTIVADO' : 'INACTIVO'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Footer */}
      <div className="w-full flex flex-col items-center gap-2 pt-2 border-t border-slate-800">
        <button
          type="button"
          disabled={solved}
          onClick={handleApply}
          className={`w-full max-w-xs py-3 rounded-xl font-mono text-sm font-black uppercase tracking-wider transition-all transform active:scale-95 cursor-pointer shadow-lg flex items-center justify-center gap-2 ${
            solved
              ? 'bg-emerald-600 text-white cursor-default shadow-emerald-600/30'
              : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 hover:shadow-rose-500/50'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>{solved ? '✓ RESONANCIA NEUTRALIZADA' : 'APLICAR ATENUACIÓN'}</span>
        </button>

        <span className="text-[11px] text-slate-400 font-mono text-center">
          {solved
            ? '✓ Ondas armónicas atenuadas con éxito'
            : 'Activa los filtros correspondientes a la frecuencia pico y pulsa «APLICAR ATENUACIÓN»'}
        </span>
      </div>
    </div>
  );
};
