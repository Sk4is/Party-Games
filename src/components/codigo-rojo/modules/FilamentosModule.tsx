import React, { useState } from 'react';
import { Scissors, Zap } from 'lucide-react';
import { audio } from '../../../utils/audio';

interface WireItem {
  id: number;
  color: string;
  hasStripe?: boolean;
  stripeColor?: string;
  isCut: boolean;
  gauge?: 'estandar' | 'grueso';
}

interface FilamentosModuleProps {
  operatorState: {
    sector: string;
    indicatorLed?: 'Ámbar' | 'Verde' | 'Rojo' | 'Apagado';
    wires: WireItem[];
  };
  solved: boolean;
  onAction: (action: { wireIndex: number }) => void;
}

const COLOR_MAP: Record<string, { bg: string; border: string; glow: string }> = {
  Rojo: { bg: '#ef4444', border: '#b91c1c', glow: 'rgba(239, 68, 68, 0.6)' },
  Azul: { bg: '#3b82f6', border: '#1d4ed8', glow: 'rgba(59, 130, 246, 0.6)' },
  Amarillo: { bg: '#eab308', border: '#a16207', glow: 'rgba(234, 179, 8, 0.6)' },
  Verde: { bg: '#22c55e', border: '#15803d', glow: 'rgba(34, 197, 94, 0.6)' },
  Blanco: { bg: '#f8fafc', border: '#94a3b8', glow: 'rgba(248, 250, 252, 0.6)' },
  Negro: { bg: '#1e293b', border: '#0f172a', glow: 'rgba(30, 41, 59, 0.6)' },
};

export const FilamentosModule: React.FC<FilamentosModuleProps> = ({
  operatorState,
  solved,
  onAction,
}) => {
  const { sector, indicatorLed = 'Ámbar', wires } = operatorState;
  const [cutIdx, setCutIdx] = useState<number | null>(null);

  const handleCut = (idx: number) => {
    if (solved || wires[idx]?.isCut) return;
    setCutIdx(idx);
    audio.playWireCut();
    onAction({ wireIndex: idx });
  };

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-4 sm:p-6 bg-slate-900/90 rounded-2xl border border-slate-700 select-none">
      {/* Header bar with Sector & LED indicator */}
      <div className="w-full flex items-center justify-between pb-3 sm:pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs uppercase font-mono font-bold tracking-widest text-blue-300">
            ELECTRICIDAD
          </span>
          <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
            // SECTOR {sector || 'EL-04'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* LED Lamp */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 rounded border border-slate-800 text-[11px] font-mono">
            <span className="text-slate-400">LED:</span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                indicatorLed === 'Ámbar'
                  ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b] animate-pulse'
                  : indicatorLed === 'Verde'
                  ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]'
                  : indicatorLed === 'Rojo'
                  ? 'bg-red-500 shadow-[0_0_8px_#ef4444] animate-ping'
                  : 'bg-slate-700'
              }`}
            />
            <span className="font-bold text-slate-300">{indicatorLed}</span>
          </div>

          {/* Sector Badge */}
          <div className="px-3 py-1 bg-red-950/70 border border-red-500/50 rounded text-red-400 font-mono text-xs font-black tracking-wider">
            {sector}
          </div>
        </div>
      </div>

      {/* Wires Rack */}
      <div className="flex-1 w-full flex items-center justify-around py-6 px-2 sm:px-4 gap-2 sm:gap-4 bg-slate-950/80 rounded-2xl border border-slate-800 my-4 shadow-inner">
        {wires.map((wire, idx) => {
          const colorMeta = COLOR_MAP[wire.color] || COLOR_MAP.Blanco;
          const isCut = wire.isCut || (solved && cutIdx === idx);
          const isThick = wire.gauge === 'grueso';

          // CSS background pattern for striped vs solid wires
          const backgroundStyle = isCut
            ? '#334155'
            : wire.hasStripe
            ? `repeating-linear-gradient(45deg, ${colorMeta.bg}, ${colorMeta.bg} 10px, ${
                wire.stripeColor === 'Negro' ? '#0f172a' : '#ffffff'
              } 10px, ${wire.stripeColor === 'Negro' ? '#0f172a' : '#ffffff'} 20px)`
            : colorMeta.bg;

          return (
            <div key={wire.id} className="flex flex-col items-center gap-2.5 sm:gap-3">
              <span className="text-[10px] font-mono text-slate-500 font-bold">
                T-{idx + 1}
              </span>

              {/* Wire terminal top bracket */}
              <div className="w-5 sm:w-6 h-4 bg-gradient-to-b from-slate-600 to-slate-800 rounded-t-sm border border-slate-500 shadow" />

              {/* Interactive Wire button with cut physics */}
              <button
                type="button"
                disabled={solved || wire.isCut}
                onClick={() => handleCut(idx)}
                className={`group relative ${
                  isThick ? 'w-8 sm:w-10' : 'w-6 sm:w-8'
                } h-36 sm:h-48 rounded-full transition-all flex flex-col items-center justify-center cursor-pointer ${
                  isCut ? 'pointer-events-none' : 'hover:scale-105 active:scale-95'
                }`}
                style={{
                  background: backgroundStyle,
                  borderColor: colorMeta.border,
                  borderWidth: isThick ? '3px' : '2px',
                  boxShadow: isCut ? 'none' : `0 0 16px ${colorMeta.glow}`,
                }}
                title={`Cortar cable ${idx + 1} (${wire.color}${wire.hasStripe ? ' con franja' : ''})`}
              >
                {!isCut && (
                  <Scissors className="w-4 h-4 text-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity rotate-90" />
                )}

                {/* Severed gap if cut */}
                {isCut && (
                  <div className="w-full flex flex-col items-center justify-center">
                    <div className="w-full h-3 bg-slate-950 border-y border-slate-800" />
                    <Zap className="w-3 h-3 text-amber-400 -mt-1.5 animate-ping opacity-60" />
                  </div>
                )}
              </button>

              {/* Wire terminal bottom bracket */}
              <div className="w-5 sm:w-6 h-4 bg-gradient-to-t from-slate-600 to-slate-800 rounded-b-sm border border-slate-500 shadow" />

              {/* Wire Label description */}
              <div className="flex flex-col items-center">
                <span className="text-[11px] font-bold text-slate-200 font-mono">
                  {wire.color}
                </span>
                {wire.hasStripe && (
                  <span className="text-[9px] font-mono text-amber-300 bg-amber-950/60 px-1 rounded border border-amber-500/40">
                    FRANJA
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-xs text-slate-400 font-mono text-center">
        {solved ? (
          <span className="text-emerald-400 font-bold uppercase tracking-wider">
            ✓ Circuito Desactivado con Éxito
          </span>
        ) : (
          <span>Haz clic sobre el filamento a cortar según las instrucciones del manual</span>
        )}
      </div>
    </div>
  );
};
