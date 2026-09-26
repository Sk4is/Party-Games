import React, { useState } from 'react';
import { Compass, Shield, RotateCcw } from 'lucide-react';
import { audio } from '../../../utils/audio';

interface MasasMagneticasModuleProps {
  operatorState: {
    grid?: Record<string, 'N' | 'S' | null>;
    availableTokens?: ('N' | 'S')[];
  };
  solved: boolean;
  onAction: (action: { grid: Record<string, 'N' | 'S' | null> }) => void;
}

export const MasasMagneticasModule: React.FC<MasasMagneticasModuleProps> = ({
  operatorState,
  solved,
  onAction,
}) => {
  const [grid, setGrid] = useState<Record<string, 'N' | 'S' | null>>({
    '0-0': null, '0-1': null, '0-2': null,
    '1-0': null, '1-1': null, '1-2': null,
    '2-0': null, '2-1': null, '2-2': null,
  });

  const [selectedPole, setSelectedPole] = useState<'N' | 'S' | null>(null);

  // Count placed
  const placedN = Object.values(grid).filter((v) => v === 'N').length;
  const placedS = Object.values(grid).filter((v) => v === 'S').length;
  const availableN = Math.max(0, 2 - placedN);
  const availableS = Math.max(0, 2 - placedS);

  const handleCellClick = (r: number, c: number) => {
    if (solved) return;
    const key = `${r}-${c}`;
    if (r === 1 && c === 1) return; // Core cell cannot be covered

    if (grid[key]) {
      // Pick up existing token
      audio.playClick();
      setGrid((prev) => ({ ...prev, [key]: null }));
    } else if (selectedPole) {
      // Drop selected token
      if (selectedPole === 'N' && availableN <= 0) return;
      if (selectedPole === 'S' && availableS <= 0) return;
      audio.playMagneticSnap();
      setGrid((prev) => ({ ...prev, [key]: selectedPole }));
    }
  };

  const handleReset = () => {
    if (solved) return;
    audio.playClick();
    setGrid({
      '0-0': null, '0-1': null, '0-2': null,
      '1-0': null, '1-1': null, '1-2': null,
      '2-0': null, '2-1': null, '2-2': null,
    });
    setSelectedPole(null);
  };

  const handleSubmit = () => {
    if (solved) return;
    audio.playMetalLever();
    onAction({ grid });
  };

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-4 sm:p-6 bg-slate-900/90 rounded-2xl border border-slate-700 select-none">
      {/* Header */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-violet-400" />
          <span className="text-xs uppercase font-mono font-bold tracking-widest text-violet-300">
            CAMPO
          </span>
          <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
            // MATRIZ DE MASAS MAGNÉTICAS
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={solved}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            title="Retirar todas las fichas"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3x3 Magnetic Grid Plate */}
      <div className="my-3 p-3 bg-slate-950 rounded-2xl border-2 border-slate-800 shadow-2xl flex flex-col items-center gap-2">
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((r) =>
            [0, 1, 2].map((c) => {
              const isCenter = r === 1 && c === 1;
              const key = `${r}-${c}`;
              const val = grid[key];

              if (isCenter) {
                return (
                  <div
                    key={key}
                    className="w-16 h-16 rounded-xl bg-violet-950/80 border-2 border-violet-500/80 flex flex-col items-center justify-center text-violet-200 shadow-inner"
                  >
                    <span className="text-lg">⚡</span>
                    <span className="text-[8px] font-mono font-bold uppercase">NÚCLEO</span>
                  </div>
                );
              }

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleCellClick(r, c)}
                  disabled={solved}
                  className={`w-16 h-16 rounded-xl border-2 font-mono text-base font-black transition-all flex flex-col items-center justify-center cursor-pointer shadow-md ${
                    val === 'N'
                      ? 'bg-red-600 border-red-300 text-white shadow-red-600/40'
                      : val === 'S'
                      ? 'bg-blue-600 border-blue-300 text-white shadow-blue-600/40'
                      : selectedPole
                      ? 'bg-slate-900 border-dashed border-violet-400/80 hover:bg-slate-800'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  {val ? (
                    <>
                      <span>{val}</span>
                      <span className="text-[8px] opacity-80">{val === 'N' ? 'NORTE' : 'SUR'}</span>
                    </>
                  ) : (
                    <span className="text-[9px] text-slate-600 font-mono font-normal">
                      ({r},{c})
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Available Dipole Tokens Palette */}
      <div className="w-full flex flex-col items-center gap-2">
        <span className="text-[11px] font-mono text-slate-400 uppercase font-bold tracking-wider">
          SELECCIONA POLO PARA COLOCAR:
        </span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSelectedPole(selectedPole === 'N' ? null : 'N')}
            disabled={solved || availableN <= 0}
            className={`px-4 py-2 rounded-xl font-mono text-xs font-bold border-2 transition-all cursor-pointer flex items-center gap-2 ${
              selectedPole === 'N'
                ? 'bg-red-600 border-red-300 text-white shadow-lg shadow-red-600/40 scale-105'
                : 'bg-slate-800 border-slate-700 text-red-400 hover:border-red-400'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <span>POLO NORTE [N]</span>
            <span className="px-1.5 py-0.5 rounded bg-black/40 text-[10px] text-white">
              {availableN} disp.
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedPole(selectedPole === 'S' ? null : 'S')}
            disabled={solved || availableS <= 0}
            className={`px-4 py-2 rounded-xl font-mono text-xs font-bold border-2 transition-all cursor-pointer flex items-center gap-2 ${
              selectedPole === 'S'
                ? 'bg-blue-600 border-blue-300 text-white shadow-lg shadow-blue-600/40 scale-105'
                : 'bg-slate-800 border-slate-700 text-blue-400 hover:border-blue-400'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <span>POLO SUR [S]</span>
            <span className="px-1.5 py-0.5 rounded bg-black/40 text-[10px] text-white">
              {availableS} disp.
            </span>
          </button>
        </div>
      </div>

      {/* Submit Action */}
      <div className="w-full pt-4 border-t border-slate-800 flex justify-center">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={solved || placedN + placedS < 4}
          className={`w-full max-w-sm py-3 rounded-xl font-mono text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
            solved
              ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/50 cursor-default'
              : placedN + placedS === 4
              ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-600/30 active:scale-95'
              : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>{solved ? 'CAMPO ESTABILIZADO' : 'ESTABILIZAR CAMPO'}</span>
        </button>
      </div>
    </div>
  );
};
