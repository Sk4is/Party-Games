import React, { useState } from 'react';
import { FlaskConical } from 'lucide-react';

interface RefrigeranteQuimicoModuleProps {
  operatorState: {
    stripColor: 'PÚRPURA' | 'CIAN' | 'NARANJA' | 'LIMA';
    levels: { blue: number; green: number; red: number };
  };
  solved: boolean;
  onAction: (action: { blue: number; green: number; red: number }) => void;
}

const STRIP_STYLES: Record<string, { bg: string; border: string }> = {
  PÚRPURA: { bg: 'bg-purple-600', border: 'border-purple-400' },
  CIAN: { bg: 'bg-cyan-500', border: 'border-cyan-300' },
  NARANJA: { bg: 'bg-orange-500', border: 'border-orange-300' },
  LIMA: { bg: 'bg-lime-500', border: 'border-lime-300' },
};

export const RefrigeranteQuimicoModule: React.FC<RefrigeranteQuimicoModuleProps> = ({
  operatorState,
  solved,
  onAction,
}) => {
  const { stripColor } = operatorState;
  const [levels, setLevels] = useState({ blue: 0, green: 0, red: 0 });

  const setLevel = (flask: 'blue' | 'green' | 'red', val: number) => {
    if (solved) return;
    setLevels((prev) => ({ ...prev, [flask]: val }));
  };

  const handleInject = () => {
    if (solved) return;
    onAction(levels);
  };

  const strip = STRIP_STYLES[stripColor] || STRIP_STYLES.PÚRPURA;

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-6 bg-slate-900/90 rounded-2xl border border-slate-700 select-none">
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-emerald-400" />
          <span className="text-xs uppercase font-mono tracking-widest text-slate-400">
            Mezclador de Refrigerante
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded-full ${strip.bg} border ${strip.border}`} />
          <span className="text-xs font-mono font-bold text-slate-300">TIRA {stripColor}</span>
        </div>
      </div>

      {/* 3 Flasks with level sliders */}
      <div className="grid grid-cols-3 gap-3 sm:gap-6 my-4 w-full max-w-sm">
        {[
          { key: 'blue' as const, label: 'Criolita', color: 'text-blue-400', bar: 'bg-blue-500' },
          { key: 'green' as const, label: 'Xenón', color: 'text-emerald-400', bar: 'bg-emerald-500' },
          { key: 'red' as const, label: 'Pirógeno', color: 'text-red-400', bar: 'bg-red-500' },
        ].map((item) => (
          <div
            key={item.key}
            className="flex flex-col items-center bg-slate-950 p-3 rounded-xl border border-slate-800"
          >
            <span className={`text-[10px] font-mono font-bold ${item.color}`}>
              {item.label}
            </span>

            {/* Visual fluid tube */}
            <div className="w-8 h-28 bg-slate-900 rounded-full border border-slate-700 p-1 flex flex-col justify-end my-2 overflow-hidden shadow-inner">
              <div
                className={`w-full rounded-full transition-all duration-200 ${item.bar}`}
                style={{ height: `${(levels[item.key] / 5) * 100}%` }}
              />
            </div>

            {/* Level selector buttons */}
            <div className="flex items-center gap-1.5 font-mono text-xs">
              <button
                type="button"
                disabled={solved || levels[item.key] <= 0}
                onClick={() => setLevel(item.key, levels[item.key] - 1)}
                className="w-5 h-5 bg-slate-800 rounded flex items-center justify-center text-slate-300 cursor-pointer disabled:opacity-30"
              >
                -
              </button>
              <span className="font-bold text-white w-4 text-center">
                {levels[item.key]}
              </span>
              <button
                type="button"
                disabled={solved || levels[item.key] >= 5}
                onClick={() => setLevel(item.key, levels[item.key] + 1)}
                className="w-5 h-5 bg-slate-800 rounded flex items-center justify-center text-slate-300 cursor-pointer disabled:opacity-30"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="w-full flex flex-col items-center gap-2">
        <button
          type="button"
          disabled={solved}
          onClick={handleInject}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 rounded-xl text-slate-950 font-black tracking-wider uppercase transition-all shadow-lg shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
        >
          {solved ? 'MEZCLA INYECTADA ✓' : 'INYECTAR MEZCLA'}
        </button>
        <span className="text-xs text-slate-400 font-mono text-center">
          Gradúa cada reactivo del 0 al 5 según la tabla de reactivos
        </span>
      </div>
    </div>
  );
};
