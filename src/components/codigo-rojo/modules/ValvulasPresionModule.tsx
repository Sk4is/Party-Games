import React, { useState } from 'react';
import { Gauge, RotateCw } from 'lucide-react';

interface ValvulasPresionModuleProps {
  operatorState: {
    psiA: number;
    psiB: number;
    psiC: number;
    ledColor: 'VERDE' | 'AMBAR' | 'AZUL';
    valves: { a: number; b: number; c: number };
  };
  solved: boolean;
  onAction: (action: { a: number; b: number; c: number }) => void;
}

export const ValvulasPresionModule: React.FC<ValvulasPresionModuleProps> = ({
  operatorState,
  solved,
  onAction,
}) => {
  const { psiA, psiB, psiC, ledColor } = operatorState;
  const [valves, setValves] = useState({ a: 0, b: 0, c: 0 });

  const rotateValve = (valveKey: 'a' | 'b' | 'c') => {
    if (solved) return;
    setValves((prev) => {
      const nextAngle = (prev[valveKey] + 45) % 135; // 0, 45, 90
      return { ...prev, [valveKey]: nextAngle };
    });
  };

  const handlePurge = () => {
    if (solved) return;
    onAction(valves);
  };

  const ledColorClass =
    ledColor === 'VERDE'
      ? 'bg-emerald-500 shadow-[0_0_12px_#10b981]'
      : ledColor === 'AMBAR'
      ? 'bg-amber-500 shadow-[0_0_12px_#f59e0b]'
      : 'bg-blue-500 shadow-[0_0_12px_#3b82f6]';

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-6 bg-slate-900/90 rounded-2xl border border-slate-700 select-none">
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-amber-400" />
          <span className="text-xs uppercase font-mono tracking-widest text-slate-400">
            Válvulas Neumáticas
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-3 h-3 rounded-full ${ledColorClass}`} />
          <span className="text-xs font-mono text-slate-300 font-bold">MODO {ledColor}</span>
        </div>
      </div>

      {/* 3 Gauges & Valves */}
      <div className="grid grid-cols-3 gap-3 sm:gap-6 my-4 w-full max-w-md">
        {[
          { label: 'VÁLVULA A', psi: psiA, angle: valves.a, key: 'a' as const },
          { label: 'VÁLVULA B', psi: psiB, angle: valves.b, key: 'b' as const },
          { label: 'VÁLVULA C', psi: psiC, angle: valves.c, key: 'c' as const },
        ].map((item) => (
          <div
            key={item.key}
            className="flex flex-col items-center bg-slate-950 p-3 sm:p-4 rounded-xl border border-slate-800"
          >
            <span className="text-[10px] font-mono text-slate-400 font-bold mb-1">
              {item.label}
            </span>
            <div className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-amber-400 font-mono text-xs font-black">
              {item.psi} PSI
            </div>

            {/* Rotatable Valve handle */}
            <button
              type="button"
              disabled={solved}
              onClick={() => rotateValve(item.key)}
              className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-850 hover:bg-slate-800 border-2 border-slate-600 flex items-center justify-center cursor-pointer my-3 transition-transform active:scale-95 shadow-md"
            >
              <div
                className="w-10 h-2 bg-amber-500 rounded-full shadow-sm transition-transform duration-200"
                style={{ transform: `rotate(${item.angle}deg)` }}
              />
              <div className="absolute w-3 h-3 rounded-full bg-slate-950 border border-slate-600" />
            </button>

            <span className="text-[11px] font-mono text-slate-400">
              {item.angle}°
            </span>
          </div>
        ))}
      </div>

      <div className="w-full flex flex-col items-center gap-2">
        <button
          type="button"
          disabled={solved}
          onClick={handlePurge}
          className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 active:scale-95 rounded-xl text-slate-950 font-black tracking-wider uppercase transition-all shadow-lg shadow-amber-600/30 cursor-pointer disabled:opacity-50"
        >
          {solved ? 'PRESURIZADO ✓' : 'PURGAR PRESIÓN'}
        </button>
        <span className="text-xs text-slate-400 font-mono text-center">
          Gira cada válvula a su ángulo (0°, 45° o 90°) y pulsa purgar
        </span>
      </div>
    </div>
  );
};
