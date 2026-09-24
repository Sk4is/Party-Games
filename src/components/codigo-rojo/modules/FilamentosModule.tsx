import React from 'react';
import { Scissors } from 'lucide-react';

interface FilamentosModuleProps {
  operatorState: {
    sector: string;
    wires: { id: number; color: string; isCut: boolean }[];
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
  const { sector, wires } = operatorState;

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-6 bg-slate-900/90 rounded-2xl border border-slate-700 select-none">
      {/* Header bar with Sector tag */}
      <div className="w-full flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs uppercase font-mono tracking-widest text-slate-400">
            Filamentos de Alta Tensión
          </span>
        </div>
        <div className="px-3 py-1 bg-red-950/70 border border-red-500/50 rounded text-red-400 font-mono text-xs font-black tracking-wider">
          {sector}
        </div>
      </div>

      {/* Wires Rack */}
      <div className="flex-1 w-full flex items-center justify-around py-8 px-4 gap-3 sm:gap-6 bg-slate-950/70 rounded-xl border border-slate-800 my-4 shadow-inner">
        {wires.map((wire, idx) => {
          const colorMeta = COLOR_MAP[wire.color] || COLOR_MAP.Blanco;
          return (
            <div key={wire.id} className="flex flex-col items-center gap-3">
              <span className="text-[10px] font-mono text-slate-500">T-{idx + 1}</span>

              {/* Wire terminal top */}
              <div className="w-5 h-4 bg-slate-700 rounded-t-sm border border-slate-600 shadow" />

              {/* Interactive Wire button */}
              <button
                type="button"
                disabled={solved || wire.isCut}
                onClick={() => onAction({ wireIndex: idx })}
                className={`group relative w-6 sm:w-8 h-36 sm:h-44 rounded-full transition-all flex items-center justify-center cursor-pointer ${
                  wire.isCut ? 'opacity-30 pointer-events-none' : 'hover:scale-105 active:scale-95'
                }`}
                style={{
                  backgroundColor: wire.isCut ? '#334155' : colorMeta.bg,
                  borderColor: colorMeta.border,
                  borderWidth: '2px',
                  boxShadow: wire.isCut ? 'none' : `0 0 14px ${colorMeta.glow}`,
                }}
                title={`Cortar filamento ${idx + 1} (${wire.color})`}
              >
                {!wire.isCut && (
                  <Scissors className="w-4 h-4 text-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity rotate-90" />
                )}
                {wire.isCut && (
                  <div className="w-full h-1 bg-slate-900 absolute top-1/2 -translate-y-1/2" />
                )}
              </button>

              {/* Wire terminal bottom */}
              <div className="w-5 h-4 bg-slate-700 rounded-b-sm border border-slate-600 shadow" />

              <span className="text-xs font-bold text-slate-300 font-mono">
                {wire.color}
              </span>
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
