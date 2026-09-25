import React, { useState } from 'react';
import { Gauge } from 'lucide-react';
import { audio } from '../../../utils/audio';

interface ValvulasPresionModuleProps {
  operatorState: {
    systemPressurePSI?: number;
    indicatorZone?: 'ROJA' | 'AMBAR' | 'VERDE';
    // Backwards compatibility with previous props if any
    psiA?: number;
    ledColor?: string;
    valves?: { a: number; b: number; c: number };
  };
  solved: boolean;
  onAction: (action: { a: number; b: number; c: number }) => void;
}

export const ValvulasPresionModule: React.FC<ValvulasPresionModuleProps> = ({
  operatorState,
  solved,
  onAction,
}) => {
  const pressure = operatorState.systemPressurePSI ?? operatorState.psiA ?? 65;
  const zone =
    operatorState.indicatorZone ??
    (pressure > 80 ? 'ROJA' : pressure >= 40 ? 'AMBAR' : 'VERDE');

  const [valves, setValves] = useState<{ a: 0 | 45 | 90; b: 0 | 45 | 90; c: 0 | 45 | 90 }>({
    a: 0,
    b: 0,
    c: 0,
  });

  const rotateValve = (valveKey: 'a' | 'b' | 'c') => {
    if (solved) return;
    audio.playValveTurn();
    setValves((prev) => {
      const nextAngle = prev[valveKey] === 0 ? 45 : prev[valveKey] === 45 ? 90 : 0;
      return { ...prev, [valveKey]: nextAngle };
    });
  };

  const handlePurge = () => {
    if (solved) return;
    audio.playMechanicalSwitch();
    onAction({ a: valves.a, b: valves.b, c: valves.c });
  };

  const zoneBadgeStyle =
    zone === 'ROJA'
      ? 'bg-red-950/80 border-red-500/80 text-red-400 shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-pulse'
      : zone === 'AMBAR'
      ? 'bg-amber-950/80 border-amber-500/80 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
      : 'bg-emerald-950/80 border-emerald-500/80 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]';

  const zoneLabel =
    zone === 'ROJA'
      ? 'ZONA ROJA (> 80 PSI)'
      : zone === 'AMBAR'
      ? 'ZONA ÁMBAR (40–80 PSI)'
      : 'ZONA VERDE (< 40 PSI)';

  // Calculate gauge needle rotation: 0 PSI = -90deg, 100 PSI = +90deg
  const clampedPressure = Math.min(100, Math.max(0, pressure));
  const needleAngle = -90 + (clampedPressure / 100) * 180;

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-4 sm:p-6 bg-slate-900/90 rounded-2xl border border-slate-700 select-none">
      {/* Header bar */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-amber-400" />
          <span className="text-xs uppercase font-mono font-bold tracking-widest text-amber-300">
            ENERGÍA
          </span>
          <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
            // LÍNEA NEUMÁTICA DE FLUIDOS
          </span>
        </div>
        <div className={`px-2.5 py-1 rounded-full border text-xs font-mono font-black ${zoneBadgeStyle}`}>
          {zoneLabel}
        </div>
      </div>

      {/* Central System Pressure Gauge (ONE GAUGE) */}
      <div className="my-2 sm:my-3 flex flex-col items-center">
        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-1">
          PRESIÓN DEL SISTEMA
        </span>
        <div className="relative w-36 h-24 sm:w-44 sm:h-28 bg-slate-950 rounded-t-full border-2 border-slate-700 flex flex-col items-center justify-end overflow-hidden p-2 shadow-inner">
          {/* Gauge Arc Graphic */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 160 100">
            {/* Green arc (0 to 40 PSI) */}
            <path
              d="M 20 90 A 60 60 0 0 1 58 38"
              fill="none"
              stroke="#10b981"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* Amber arc (40 to 80 PSI) */}
            <path
              d="M 64 33 A 60 60 0 0 1 122 47"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="6"
            />
            {/* Red arc (80 to 100 PSI) */}
            <path
              d="M 127 52 A 60 60 0 0 1 140 90"
              fill="none"
              stroke="#ef4444"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* Dial center pin */}
            <circle cx="80" cy="90" r="5" fill="#f8fafc" />
            {/* Needle */}
            <line
              x1="80"
              y1="90"
              x2="80"
              y2="34"
              stroke="#f8fafc"
              strokeWidth="2.5"
              strokeLinecap="round"
              transform={`rotate(${needleAngle} 80 90)`}
              className="transition-transform duration-500 ease-out"
            />
          </svg>
          <div className="relative z-10 px-3 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-center font-mono font-black text-amber-300 text-sm sm:text-base tracking-widest shadow">
            {pressure} PSI
          </div>
        </div>
      </div>

      {/* Three Valves: VÁLVULA A, VÁLVULA B, VÁLVULA C (ONLY 0°, 45°, 90°) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full max-w-md my-2">
        {[
          { label: 'VÁLVULA A', angle: valves.a, key: 'a' as const },
          { label: 'VÁLVULA B', angle: valves.b, key: 'b' as const },
          { label: 'VÁLVULA C', angle: valves.c, key: 'c' as const },
        ].map((item) => (
          <div
            key={item.key}
            className="flex flex-col items-center bg-slate-950 p-2.5 sm:p-3 rounded-2xl border border-slate-800 shadow-sm"
          >
            <span className="text-[11px] font-mono text-slate-300 font-black mb-1 tracking-wider">
              {item.label}
            </span>

            {/* Rotatable Valve handle: Only 0°, 45°, 90° */}
            <button
              type="button"
              disabled={solved}
              onClick={() => rotateValve(item.key)}
              className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-900 hover:bg-slate-850 active:scale-95 border-2 border-slate-700 hover:border-amber-500/60 flex items-center justify-center cursor-pointer my-2 transition-all shadow-md group disabled:opacity-50 disabled:cursor-not-allowed"
              title="Haz clic para rotar (0° → 45° → 90°)"
            >
              {/* Outer tick marks at 0° (horizontal), 45° (diagonal), 90° (vertical) */}
              <div className="absolute inset-1 rounded-full border border-dashed border-slate-700/60 pointer-events-none" />

              {/* Valve handle bar */}
              <div
                className="w-10 sm:w-11 h-2 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 rounded-full shadow-md transition-transform duration-200"
                style={{ transform: `rotate(${item.angle}deg)` }}
              />
              <div className="absolute w-3.5 h-3.5 rounded-full bg-slate-950 border-2 border-amber-400" />
            </button>

            {/* Angle Indicator (Degrees only: 0°, 45°, 90°) */}
            <div className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-amber-400 font-mono text-xs font-bold">
              {item.angle}°
            </div>
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <div className="w-full flex flex-col items-center gap-1.5 pt-2 border-t border-slate-800/80">
        <button
          type="button"
          disabled={solved}
          onClick={handlePurge}
          className="w-full max-w-sm px-6 py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-95 rounded-xl text-slate-950 font-black tracking-wider uppercase transition-all shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {solved ? 'PURGA EXITOSA ✓' : 'PURGAR PRESIÓN'}
        </button>
        <span className="text-[11px] text-slate-400 font-mono text-center">
          Gira cada válvula a su ángulo exacto (0°, 45° o 90°) según la presión
        </span>
      </div>
    </div>
  );
};
