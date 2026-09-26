import React, { useState } from 'react';
import { Eye, Check, Target } from 'lucide-react';
import { audio } from '../../../utils/audio';

interface PrismaRefraccionModuleProps {
  operatorState: {
    beamColor: string;
    prismType: string;
    angle?: number;
    selectedSensor?: string;
  };
  solved: boolean;
  onAction: (action: { sensor: string; angle: number }) => void;
}

const SENSORS = [
  { id: 'S-1', angle: 30, y: 15 },
  { id: 'S-2', angle: 60, y: 32 },
  { id: 'S-3', angle: 90, y: 50 },
  { id: 'S-4', angle: 120, y: 68 },
  { id: 'S-5', angle: 150, y: 85 },
];

export const PrismaRefraccionModule: React.FC<PrismaRefraccionModuleProps> = ({
  operatorState,
  solved,
  onAction,
}) => {
  const { beamColor = 'Verde', prismType = 'Prisma Flint (F)' } = operatorState || {};

  const [selectedSensorId, setSelectedSensorId] = useState<string>('S-1');

  const currentSensor = SENSORS.find((s) => s.id === selectedSensorId) || SENSORS[0];
  const currentAngle = currentSensor.angle;

  const colorStyles: Record<string, { stroke: string; glow: string; text: string }> = {
    Rojo: { stroke: '#ef4444', glow: 'rgba(239, 68, 68, 0.7)', text: 'text-red-400' },
    Verde: { stroke: '#10b981', glow: 'rgba(16, 185, 129, 0.7)', text: 'text-emerald-400' },
    Azul: { stroke: '#3b82f6', glow: 'rgba(59, 130, 246, 0.7)', text: 'text-blue-400' },
    Ámbar: { stroke: '#f59e0b', glow: 'rgba(245, 158, 11, 0.7)', text: 'text-amber-400' },
  };

  const currentStyle = colorStyles[beamColor] || colorStyles.Verde;

  const handleSelectSensor = (sensorId: string) => {
    if (solved) return;
    audio.playClick();
    setSelectedSensorId(sensorId);
  };

  const handleSubmit = () => {
    if (solved) return;
    audio.playMetalLever();
    onAction({
      sensor: selectedSensorId,
      angle: currentAngle,
    });
  };

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-4 sm:p-6 bg-slate-900/90 rounded-2xl border border-slate-700 select-none">
      {/* Header */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-teal-400" />
          <span className="text-xs uppercase font-mono font-bold tracking-widest text-teal-300">
            ÓPTICA
          </span>
          <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
            // PRISMA DE REFRACCIÓN
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-teal-200">
            {prismType}
          </span>
        </div>
      </div>

      {/* Optical Bench Canvas */}
      <div className="w-full max-w-lg my-3 relative h-48 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-inner flex items-center justify-center p-2">
        {/* Optical Bench SVG */}
        <svg viewBox="0 0 340 160" className="w-full h-full">
          {/* Subtle Grid */}
          <line x1="30" y1="80" x2="310" y2="80" stroke="#334155" strokeWidth="0.8" strokeDasharray="3 3" />
          <line x1="160" y1="20" x2="160" y2="140" stroke="#334155" strokeWidth="0.8" strokeDasharray="3 3" />

          {/* Left Laser Emitter Housing */}
          <rect x="15" y="70" width="35" height="20" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="1.2" />
          <circle cx="50" cy="80" r="4" fill={currentStyle.stroke} />
          <text x="18" y="65" fill="#94a3b8" fontSize="7" fontFamily="monospace">LÁSER</text>

          {/* Incident Beam (Horizontal) */}
          <line x1="50" y1="80" x2="145" y2="80" stroke={currentStyle.stroke} strokeWidth="2.5" strokeLinecap="round" />

          {/* Rotating Prism Turntable */}
          <g transform={`translate(160, 80) rotate(${(currentAngle - 90) * 0.4})`}>
            {/* Turntable plate */}
            <circle cx="0" cy="0" r="32" fill="#0f172a" stroke="#475569" strokeWidth="1" strokeDasharray="4 2" />
            {/* Triangular Glass Prism */}
            <polygon
              points="0,-24 -20,18 20,18"
              fill="#134e4a"
              stroke="#2dd4bf"
              strokeWidth="2"
              opacity="0.8"
            />
            {/* Glass facets highlight */}
            <line x1="0" y1="-24" x2="0" y2="18" stroke="#5eead4" strokeWidth="1" opacity="0.6" />
          </g>

          {/* Refracted Beam (Points toward currentSensor) */}
          {(() => {
            const targetY = (currentSensor.y / 100) * 140 + 10;
            return (
              <line
                x1="165"
                y1="80"
                x2="280"
                y2={targetY}
                stroke={currentStyle.stroke}
                strokeWidth="2.5"
                strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 6px ${currentStyle.glow})` }}
              />
            );
          })()}

          {/* Right Sensors Arc: S-1 to S-5 */}
          {SENSORS.map((s) => {
            const y = (s.y / 100) * 140 + 10;
            const isHit = s.id === selectedSensorId;
            return (
              <g key={s.id} onClick={() => handleSelectSensor(s.id)} className="cursor-pointer">
                {/* Target Sensor Diode */}
                <rect
                  x="280"
                  y={y - 8}
                  width="36"
                  height="16"
                  rx="3"
                  fill={isHit ? '#042f2e' : '#1e293b'}
                  stroke={isHit ? currentStyle.stroke : '#475569'}
                  strokeWidth={isHit ? 2 : 1}
                />
                <circle cx="288" cy={y} r="3" fill={isHit ? currentStyle.stroke : '#64748b'} />
                <text
                  x="296"
                  y={y + 3.5}
                  fill={isHit ? '#ffffff' : '#94a3b8'}
                  fontSize="8"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {s.id}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Color Badge Indicator */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900/90 border border-slate-800 text-[10px] font-mono">
          <span className="text-slate-400">HAZ:</span>
          <strong className={currentStyle.text}>{beamColor}</strong>
        </div>
      </div>

      {/* Sensor Angle Stepper / Selector Buttons */}
      <div className="w-full flex flex-col items-center gap-2">
        <span className="text-[11px] font-mono text-slate-400 uppercase font-bold tracking-wider">
          ORIENTAR HAZ SOBRE SENSOR OBJETIVO:
        </span>
        <div className="grid grid-cols-5 gap-2 w-full max-w-md">
          {SENSORS.map((s) => {
            const isSelected = selectedSensorId === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSelectSensor(s.id)}
                disabled={solved}
                className={`py-2 px-1 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center ${
                  isSelected
                    ? 'bg-teal-600 text-white border-2 border-teal-300 shadow-lg shadow-teal-600/30 scale-105'
                    : 'bg-slate-800 border border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                <span>{s.id}</span>
                <span className="text-[9px] opacity-70">{s.angle}°</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit Action */}
      <div className="w-full pt-4 border-t border-slate-800 flex justify-center">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={solved}
          className={`w-full max-w-sm py-3 rounded-xl font-mono text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
            solved
              ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/50 cursor-default'
              : 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-600/30 active:scale-95'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>{solved ? 'PRISMA ENCLAVADO' : 'FIJAR PRISMA'}</span>
        </button>
      </div>
    </div>
  );
};
