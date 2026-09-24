import React, { useState } from 'react';
import { Crosshair } from 'lucide-react';

interface RadarVectorialModuleProps {
  operatorState: {
    sweepDir: 'HORARIO' | 'ANTIHORARIO';
    blips: { name: string; sector: string; ring: number }[];
  };
  solved: boolean;
  onAction: (action: { blipName: string }) => void;
}

export const RadarVectorialModule: React.FC<RadarVectorialModuleProps> = ({
  operatorState,
  solved,
  onAction,
}) => {
  const { sweepDir, blips } = operatorState;
  const [selectedBlip, setSelectedBlip] = useState<string | null>(null);

  const handleLockVector = () => {
    if (solved || !selectedBlip) return;
    onAction({ blipName: selectedBlip });
  };

  // Convert sector and ring to SVG coordinates
  // Rings: 1 (r=30), 2 (r=55), 3 (r=80)
  // Sectors: NO (NW), NE, SE, SO (SW)
  const getCoordinates = (sector: string, ring: number) => {
    const radius = ring === 1 ? 30 : ring === 2 ? 55 : 80;
    const angleMap: Record<string, number> = {
      NO: -135,
      NE: -45,
      SE: 45,
      SO: 135,
    };
    const angle = ((angleMap[sector] || 0) * Math.PI) / 180;
    return {
      x: 100 + radius * Math.cos(angle),
      y: 100 + radius * Math.sin(angle),
    };
  };

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-6 bg-slate-900/90 rounded-2xl border border-slate-700 select-none">
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-emerald-400" />
          <span className="text-xs uppercase font-mono tracking-widest text-slate-400">
            Radar Táctico CRT
          </span>
        </div>
        <span className="px-2.5 py-0.5 bg-emerald-950 border border-emerald-500/40 rounded text-emerald-400 font-mono text-xs font-bold">
          BARRIDO {sweepDir}
        </span>
      </div>

      {/* Radar CRT Display */}
      <div className="relative w-48 h-48 sm:w-56 sm:h-56 bg-slate-950 rounded-full border-2 border-emerald-500/60 p-2 my-2 shadow-[0_0_20px_rgba(16,185,129,0.25)] flex items-center justify-center overflow-hidden">
        {/* Sweep rotation animation */}
        <div
          className={`absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0_300deg,rgba(16,185,129,0.3)_360deg)] pointer-events-none rounded-full ${
            sweepDir === 'HORARIO' ? 'animate-spin' : 'animate-spin [animation-direction:reverse]'
          }`}
          style={{ animationDuration: '4s' }}
        />

        <svg className="w-full h-full" viewBox="0 0 200 200">
          {/* Concentric rings */}
          <circle cx="100" cy="100" r="30" fill="none" stroke="rgba(16,185,129,0.3)" strokeWidth="1" />
          <circle cx="100" cy="100" r="55" fill="none" stroke="rgba(16,185,129,0.3)" strokeWidth="1" />
          <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(16,185,129,0.3)" strokeWidth="1" />

          {/* Crosshairs */}
          <line x1="100" y1="10" x2="100" y2="190" stroke="rgba(16,185,129,0.2)" strokeWidth="1" />
          <line x1="10" y1="100" x2="190" y2="100" stroke="rgba(16,185,129,0.2)" strokeWidth="1" />

          {/* Interactive Blips */}
          {blips.map((blip) => {
            const coords = getCoordinates(blip.sector, blip.ring);
            const isSelected = selectedBlip === blip.name;
            return (
              <g
                key={blip.name}
                onClick={() => !solved && setSelectedBlip(blip.name)}
                className="cursor-pointer"
              >
                <circle
                  cx={coords.x}
                  cy={coords.y}
                  r={isSelected ? 9 : 6}
                  fill={isSelected ? '#38bdf8' : '#10b981'}
                  className="transition-all animate-pulse"
                />
                <text
                  x={coords.x}
                  y={coords.y - 10}
                  fill={isSelected ? '#38bdf8' : '#a7f3d0'}
                  fontSize="8"
                  fontFamily="monospace"
                  textAnchor="middle"
                  fontWeight="bold"
                >
                  {blip.name} (A{blip.ring})
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="w-full flex flex-col items-center gap-2">
        <button
          type="button"
          disabled={solved || !selectedBlip}
          onClick={handleLockVector}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 rounded-xl text-slate-950 font-black tracking-wider uppercase transition-all shadow-lg shadow-emerald-600/30 cursor-pointer disabled:opacity-40"
        >
          {solved ? 'VECTOR FIJADO ✓' : selectedBlip ? `BLOQUEAR ${selectedBlip}` : 'SELECCIONA BALIZA'}
        </button>
        <span className="text-xs text-slate-400 font-mono text-center">
          Toca el contacto auténtico en la pantalla y pulsa bloquear
        </span>
      </div>
    </div>
  );
};
