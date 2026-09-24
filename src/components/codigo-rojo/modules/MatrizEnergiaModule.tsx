import React, { useState } from 'react';
import { Zap } from 'lucide-react';

interface MatrizEnergiaModuleProps {
  operatorState: {
    coreState: 'ESTABLE' | 'CRÍTICO' | 'PURGA_REQUERIDA';
    activeCells: string[];
  };
  solved: boolean;
  onAction: (action: { activeCells: string[] }) => void;
}

const ALL_COORDS = [
  ['A1', 'A2', 'A3'],
  ['B1', 'B2', 'B3'],
  ['C1', 'C2', 'C3'],
];

export const MatrizEnergiaModule: React.FC<MatrizEnergiaModuleProps> = ({
  operatorState,
  solved,
  onAction,
}) => {
  const { coreState } = operatorState;
  const [selectedCells, setSelectedCells] = useState<string[]>(operatorState.activeCells || []);

  const toggleCell = (coord: string) => {
    if (solved) return;
    setSelectedCells((prev) =>
      prev.includes(coord) ? prev.filter((c) => c !== coord) : [...prev, coord]
    );
  };

  const handleDischarge = () => {
    if (solved) return;
    onAction({ activeCells: selectedCells });
  };

  const badgeColor =
    coreState === 'ESTABLE'
      ? 'bg-blue-950 border-blue-500/40 text-blue-400'
      : coreState === 'CRÍTICO'
      ? 'bg-red-950 border-red-500/40 text-red-400 animate-pulse'
      : 'bg-amber-950 border-amber-500/40 text-amber-400';

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-6 bg-slate-900/90 rounded-2xl border border-slate-700 select-none">
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span className="text-xs uppercase font-mono tracking-widest text-slate-400">
            Matriz de Celdas de Energía
          </span>
        </div>
        <span className={`px-2.5 py-0.5 border rounded font-mono text-xs font-bold ${badgeColor}`}>
          {coreState}
        </span>
      </div>

      {/* 3x3 Grid */}
      <div className="flex flex-col gap-2.5 sm:gap-3 my-4">
        {ALL_COORDS.map((row, rIdx) => (
          <div key={rIdx} className="flex gap-2.5 sm:gap-3">
            {row.map((coord) => {
              const isActive = selectedCells.includes(coord);
              return (
                <button
                  key={coord}
                  type="button"
                  disabled={solved}
                  onClick={() => toggleCell(coord)}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 font-mono font-bold text-sm sm:text-base flex flex-col items-center justify-center transition-all cursor-pointer ${
                    solved
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-400'
                      : isActive
                      ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                      : 'bg-slate-950 border-slate-700 text-slate-500 hover:border-slate-500'
                  }`}
                >
                  <span>{coord}</span>
                  <span
                    className={`w-2 h-2 rounded-full mt-1 ${
                      isActive ? 'bg-cyan-400 animate-ping' : 'bg-slate-700'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Action button */}
      <div className="w-full flex flex-col items-center gap-2">
        <button
          type="button"
          disabled={solved}
          onClick={handleDischarge}
          className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 active:scale-95 rounded-xl text-slate-950 font-black tracking-wider uppercase transition-all shadow-lg shadow-cyan-600/30 cursor-pointer disabled:opacity-50"
        >
          {solved ? 'DESCARGADA ✓' : 'DESCARGAR MATRIZ'}
        </button>
        <span className="text-xs text-slate-400 font-mono text-center">
          Activa las celdas de seguridad correspondientes y pulsa descargar
        </span>
      </div>
    </div>
  );
};
