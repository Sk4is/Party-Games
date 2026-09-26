import React, { useState } from 'react';
import { Scale, Lock, RotateCcw } from 'lucide-react';
import { audio } from '../../../utils/audio';

interface WeightItem {
  id: 'A' | 'B' | 'C';
  name: string;
  mass: number;
}

interface CamaraContrapesosModuleProps {
  operatorState: {
    weights: WeightItem[];
  };
  solved: boolean;
  onAction: (action: { slots: { A: number; B: number; C: number } }) => void;
}

export const CamaraContrapesosModule: React.FC<CamaraContrapesosModuleProps> = ({
  operatorState,
  solved,
  onAction,
}) => {
  // Slots: -3, -2, -1, 1, 2, 3 (0 is fulcrum)
  const [slots, setSlots] = useState<{ A: number | null; B: number | null; C: number | null }>({
    A: null,
    B: null,
    C: null,
  });

  const [selectedWeight, setSelectedWeight] = useState<'A' | 'B' | 'C' | null>(null);

  const weights = operatorState?.weights || [
    { id: 'A', name: 'Pesa A', mass: 2 },
    { id: 'B', name: 'Pesa B', mass: 4 },
    { id: 'C', name: 'Pesa C', mass: 6 },
  ];

  // Calculate torque = sum(mass * slot)
  const torque =
    (slots.A !== null ? 2 * slots.A : 0) +
    (slots.B !== null ? 4 * slots.B : 0) +
    (slots.C !== null ? 6 * slots.C : 0);

  // Tilt angle between -12 and 12 deg
  const tiltDeg = Math.max(-14, Math.min(14, torque * 1.5));

  const handlePlaceInSlot = (slotIndex: number) => {
    if (solved || !selectedWeight) return;
    audio.playClick();
    setSlots((prev) => ({
      ...prev,
      [selectedWeight]: slotIndex,
    }));
    setSelectedWeight(null);
  };

  const handleRemoveWeight = (id: 'A' | 'B' | 'C') => {
    if (solved) return;
    audio.playClick();
    setSlots((prev) => ({
      ...prev,
      [id]: null,
    }));
  };

  const handleReset = () => {
    if (solved) return;
    audio.playClick();
    setSlots({ A: null, B: null, C: null });
    setSelectedWeight(null);
  };

  const handleSubmit = () => {
    if (solved) return;
    if (slots.A === null || slots.B === null || slots.C === null) {
      audio.playStrike();
      return;
    }
    audio.playMetalLever();
    onAction({
      slots: {
        A: slots.A,
        B: slots.B,
        C: slots.C,
      },
    });
  };

  const availableSlots = [-3, -2, -1, 1, 2, 3];

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-4 sm:p-6 bg-slate-900/90 rounded-2xl border border-slate-700 select-none">
      {/* Header */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-yellow-400" />
          <span className="text-xs uppercase font-mono font-bold tracking-widest text-yellow-300">
            MECÁNICA
          </span>
          <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
            // CÁMARA DE CONTRAPESOS
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400">
            INCLINACIÓN: <strong className={Math.abs(torque) === 0 ? 'text-emerald-400' : 'text-amber-400'}>{tiltDeg.toFixed(1)}°</strong>
          </span>
          <button
            type="button"
            onClick={handleReset}
            disabled={solved}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            title="Descolgar todas las pesas"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Balance Beam Visualizer */}
      <div className="w-full max-w-lg my-4 flex flex-col items-center justify-center relative min-h-[140px]">
        {/* Tilting Beam */}
        <div
          className="w-full max-w-md relative flex items-center justify-center transition-transform duration-300 ease-out origin-center"
          style={{ transform: `rotate(${solved ? 0 : tiltDeg}deg)` }}
        >
          {/* Main Horizontal Steel Bar */}
          <div className="w-full h-3.5 bg-gradient-to-r from-slate-600 via-slate-400 to-slate-600 rounded-full border border-slate-400 shadow-md relative flex items-center justify-between px-2">
            {/* Slot Marks */}
            {availableSlots.map((slotNum) => {
              const weightInSlot = (['A', 'B', 'C'] as const).find((w) => slots[w] === slotNum);
              return (
                <button
                  key={slotNum}
                  type="button"
                  onClick={() => handlePlaceInSlot(slotNum)}
                  className={`w-9 h-9 -my-3 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer ${
                    weightInSlot
                      ? 'bg-amber-600 border-2 border-yellow-300 shadow-lg text-white font-black scale-105'
                      : selectedWeight
                      ? 'bg-amber-950/70 border-2 border-dashed border-amber-400/90 text-amber-200 animate-pulse hover:bg-amber-800'
                      : 'bg-slate-800/80 border border-slate-600 text-slate-300 hover:border-slate-400'
                  }`}
                  title={`Ranura ${slotNum > 0 ? `+${slotNum}` : slotNum}`}
                >
                  {weightInSlot ? (
                    <span className="text-[10px] font-mono leading-none">
                      {weightInSlot}
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono opacity-60">
                      {Math.abs(slotNum)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Central Pivot Solenoid Indicator */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-900 border-2 border-yellow-400 shadow-inner z-10" />
        </div>

        {/* Pivot Fulcrum Stand */}
        <div className="w-0 h-0 border-l-[18px] border-l-transparent border-r-[18px] border-r-transparent border-b-[36px] border-b-slate-700 shadow-lg mt-0.5" />
        <div className="w-24 h-2 bg-slate-800 rounded-sm" />

        {/* Side Identifiers: IZQUIERDA / DERECHA */}
        <div className="w-full flex items-center justify-between px-6 mt-1 text-[10px] font-mono font-bold text-slate-500">
          <span>◄ LADO IZQUIERDO</span>
          <span>LADO DERECHO ►</span>
        </div>
      </div>

      {/* Bottom Rack: Weights to select or drag */}
      <div className="w-full flex flex-col items-center gap-3">
        <span className="text-[11px] font-mono text-slate-400 uppercase font-bold tracking-wider">
          BANCO DE PESAS DISPONIBLES:
        </span>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {weights.map((w) => {
            const isPlaced = slots[w.id] !== null;
            const isSelected = selectedWeight === w.id;
            return (
              <div key={w.id} className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    if (isPlaced) {
                      handleRemoveWeight(w.id);
                    } else {
                      setSelectedWeight(isSelected ? null : w.id);
                    }
                  }}
                  disabled={solved}
                  className={`px-4 py-2.5 rounded-xl border-2 font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    isPlaced
                      ? 'bg-slate-800/80 border-slate-600 text-slate-400 line-through opacity-70'
                      : isSelected
                      ? 'bg-amber-600 text-white border-yellow-300 shadow-lg shadow-amber-600/40 scale-105'
                      : 'bg-slate-800 border-slate-700 text-slate-200 hover:border-amber-400'
                  }`}
                >
                  <span>{w.name} ({w.mass} kg)</span>
                  {isPlaced && <span className="text-[10px] text-amber-300 font-sans not-italic">Slot {slots[w.id]}</span>}
                </button>
                {isPlaced && !solved && (
                  <button
                    type="button"
                    onClick={() => handleRemoveWeight(w.id)}
                    className="text-[10px] text-red-400 hover:text-red-300 underline font-mono cursor-pointer"
                  >
                    Descolgar
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Submit Action */}
      <div className="w-full pt-4 border-t border-slate-800 flex justify-center">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={solved || slots.A === null || slots.B === null || slots.C === null}
          className={`w-full max-w-sm py-3 rounded-xl font-mono text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
            solved
              ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/50 cursor-default'
              : slots.A !== null && slots.B !== null && slots.C !== null
              ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
              : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>{solved ? 'EQUILIBRIO BLOQUEADO' : 'BLOQUEAR EQUILIBRIO'}</span>
        </button>
      </div>
    </div>
  );
};
