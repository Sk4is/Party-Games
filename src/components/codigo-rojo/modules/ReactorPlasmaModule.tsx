import React, { useState } from 'react';
import { Flame, Zap } from 'lucide-react';
import { audio } from '../../../utils/audio';

interface ReactorPlasmaModuleProps {
  operatorState: {
    isotope: 'Azul Neón' | 'Púrpura Iónico' | 'Verde Tóxico' | 'Ámbar Solar';
    temperatureK: number;
    initialAlpha?: number;
    initialBeta?: number;
    initialGamma?: number;
  };
  solved: boolean;
  onAction: (action: { alpha: number; beta: number; gamma: number }) => void;
}

const ISOTOPE_THEMES: Record<
  string,
  { coreBg: string; glow: string; text: string; badgeBorder: string }
> = {
  'Azul Neón': {
    coreBg: 'radial-gradient(circle, #38bdf8 0%, #0284c7 50%, #082f49 100%)',
    glow: 'rgba(56, 189, 248, 0.7)',
    text: 'text-sky-300',
    badgeBorder: 'border-sky-500/60',
  },
  'Púrpura Iónico': {
    coreBg: 'radial-gradient(circle, #c084fc 0%, #7e22ce 50%, #3b0764 100%)',
    glow: 'rgba(192, 132, 252, 0.7)',
    text: 'text-purple-300',
    badgeBorder: 'border-purple-500/60',
  },
  'Verde Tóxico': {
    coreBg: 'radial-gradient(circle, #4ade80 0%, #15803d 50%, #052e16 100%)',
    glow: 'rgba(74, 222, 128, 0.7)',
    text: 'text-emerald-300',
    badgeBorder: 'border-emerald-500/60',
  },
  'Ámbar Solar': {
    coreBg: 'radial-gradient(circle, #fbbf24 0%, #b45309 50%, #451a03 100%)',
    glow: 'rgba(251, 191, 36, 0.7)',
    text: 'text-amber-300',
    badgeBorder: 'border-amber-500/60',
  },
};

export const ReactorPlasmaModule: React.FC<ReactorPlasmaModuleProps> = ({
  operatorState,
  solved,
  onAction,
}) => {
  const { isotope, temperatureK } = operatorState;
  const [alpha, setAlpha] = useState<number>(operatorState.initialAlpha || 1);
  const [beta, setBeta] = useState<number>(operatorState.initialBeta || 1);
  const [gamma, setGamma] = useState<number>(operatorState.initialGamma || 1);

  const theme = ISOTOPE_THEMES[isotope] || ISOTOPE_THEMES['Azul Neón'];

  const handleStabilize = () => {
    if (solved) return;
    audio.playTerminalBeep();
    onAction({ alpha, beta, gamma });
  };

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-4 sm:p-6 bg-slate-900/90 rounded-2xl border border-slate-700 select-none">
      {/* Header bar */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-red-400" />
          <span className="text-xs uppercase font-mono font-bold tracking-widest text-red-300">
            ENERGÍA
          </span>
          <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
            // CÁMARA MAGNÉTICA
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-slate-950 rounded border border-slate-800 font-mono text-xs font-bold text-amber-400">
            {temperatureK} K
          </div>
          <div
            className={`px-3 py-1 rounded bg-slate-950/80 border ${theme.badgeBorder} ${theme.text} font-mono text-xs font-black`}
          >
            {isotope}
          </div>
        </div>
      </div>

      {/* Main Reactor Body */}
      <div className="w-full flex flex-col md:flex-row items-center justify-around gap-6 my-4">
        {/* Plasma Core Chamber */}
        <div className="relative w-40 h-40 sm:w-48 sm:h-48 rounded-full border-4 border-slate-700 bg-slate-950 flex items-center justify-center shadow-2xl overflow-hidden">
          {/* Animated Core Glow */}
          <div
            className="w-28 h-28 sm:w-32 sm:h-32 rounded-full animate-pulse transition-all duration-700"
            style={{
              background: theme.coreBg,
              boxShadow: `0 0 35px ${theme.glow}`,
            }}
          />

          {/* Magnetic containment lines */}
          <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/20 animate-spin [animation-duration:12s] pointer-events-none" />
          <div className="absolute inset-4 rounded-full border-2 border-dashed border-white/25 animate-spin [animation-duration:8s] [animation-direction:reverse] pointer-events-none" />

          {/* Plasma core label */}
          <div className="absolute bottom-2 px-2 py-0.5 rounded bg-slate-950/80 text-[10px] font-mono text-slate-300 border border-slate-700">
            {solved ? 'ESTABLE' : 'CONFINAMIENTO'}
          </div>
        </div>

        {/* 3 Magnetic Coil Sliders */}
        <div className="flex flex-col gap-4 w-full max-w-xs bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
          <span className="text-[10px] uppercase font-mono font-bold text-slate-400 text-center">
            Bobinas de Confinamiento Magnético
          </span>

          {/* Slider Alpha */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span className="text-slate-300">Bobina Alfa (α):</span>
              <span className="text-purple-400 text-sm font-black">{alpha}</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={alpha}
              disabled={solved}
              onChange={(e) => {
                audio.playClick();
                setAlpha(parseInt(e.target.value, 10));
              }}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex justify-between text-[9px] font-mono text-slate-500 px-1">
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
            </div>
          </div>

          {/* Slider Beta */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span className="text-slate-300">Bobina Beta (β):</span>
              <span className="text-sky-400 text-sm font-black">{beta}</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={beta}
              disabled={solved}
              onChange={(e) => {
                audio.playClick();
                setBeta(parseInt(e.target.value, 10));
              }}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
            />
            <div className="flex justify-between text-[9px] font-mono text-slate-500 px-1">
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
            </div>
          </div>

          {/* Slider Gamma */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span className="text-slate-300">Bobina Gamma (γ):</span>
              <span className="text-emerald-400 text-sm font-black">{gamma}</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={gamma}
              disabled={solved}
              onChange={(e) => {
                audio.playClick();
                setGamma(parseInt(e.target.value, 10));
              }}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[9px] font-mono text-slate-500 px-1">
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="w-full flex flex-col items-center gap-2 pt-2 border-t border-slate-800">
        <button
          type="button"
          disabled={solved}
          onClick={handleStabilize}
          className={`w-full max-w-xs py-3 rounded-xl font-mono text-sm font-black uppercase tracking-wider transition-all transform active:scale-95 cursor-pointer shadow-lg flex items-center justify-center gap-2 ${
            solved
              ? 'bg-emerald-600 text-white cursor-default shadow-emerald-600/30'
              : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30 hover:shadow-purple-500/50'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>{solved ? '✓ FLUJO ESTABILIZADO' : 'ESTABILIZAR FLUJO'}</span>
        </button>

        <span className="text-[11px] text-slate-400 font-mono text-center">
          {solved
            ? '✓ Campo magnético de plasma estabilizado'
            : 'Configura las tres bobinas (Alfa, Beta y Gamma) y pulsa «ESTABILIZAR FLUJO»'}
        </span>
      </div>
    </div>
  );
};
