import React, { useState } from 'react';
import { Compass, RotateCw } from 'lucide-react';
import { audio } from '../../../utils/audio';

interface CalibradorGiroscopioModuleProps {
  operatorState: {
    axis: 'Eje X' | 'Eje Y' | 'Eje Z';
    pitch: 'Subiendo (+)' | 'Bajando (-)' | 'Estable (=)';
    led: 'Ámbar' | 'Verde' | 'Apagado';
    currentBearing: number;
    selectedHeading?: number;
  };
  solved: boolean;
  onAction: (action: { lockedHeading: number }) => void;
}

export const CalibradorGiroscopioModule: React.FC<CalibradorGiroscopioModuleProps> = ({
  operatorState,
  solved,
  onAction,
}) => {
  const { axis, pitch, led, currentBearing } = operatorState;
  const [heading, setHeading] = useState(operatorState.selectedHeading ?? currentBearing);
  const [visualRotation, setVisualRotation] = useState(operatorState.selectedHeading ?? currentBearing);

  const adjustHeading = (delta: number) => {
    if (solved) return;
    audio.playClick();
    setHeading((prev) => {
      let next = (prev + delta) % 360;
      if (next < 0) next += 360;
      return next;
    });
    setVisualRotation((prev) => prev + delta);
  };

  const handleLock = () => {
    if (solved) return;
    audio.playTerminalBeep();
    onAction({ lockedHeading: heading });
  };

  const pitchAngle = pitch === 'Subiendo (+)' ? -18 : pitch === 'Bajando (-)' ? 18 : 0;

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-4 sm:p-6 bg-slate-900/90 rounded-2xl border border-slate-700 select-none">
      {/* Header */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-cyan-400" />
          <span className="text-xs uppercase font-mono font-bold tracking-widest text-cyan-300">
            NAVEGACIÓN
          </span>
          <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
            // UNIDAD INERCIAL
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* LED indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 rounded border border-slate-800 text-[11px] font-mono">
            <span className="text-slate-400">LED:</span>
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                led === 'Ámbar'
                  ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b] animate-pulse'
                  : led === 'Verde'
                  ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]'
                  : 'bg-slate-700'
              }`}
            />
            <span className="font-bold text-slate-300">{led}</span>
          </div>

          <div className="px-3 py-1 bg-cyan-950/70 border border-cyan-500/50 rounded text-cyan-300 font-mono text-xs font-black">
            {axis}
          </div>
        </div>
      </div>

      {/* Main Horizon Instrument Display */}
      <div className="w-full flex flex-col sm:flex-row items-center justify-around gap-6 my-4">
        {/* Artificial Horizon Sphere / Kaleidoscope */}
        <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-full border-4 border-slate-700 bg-slate-950 overflow-hidden shadow-2xl flex items-center justify-center">
          {/* Rotating Kaleidoscope / Gyro disc */}
          <div
            className="absolute inset-0 transition-transform duration-300 ease-out"
            style={{
              transform: `rotate(${-visualRotation}deg)`,
            }}
          >
            {/* Horizon Background Sky / Ground */}
            <div
              className="absolute inset-0 transition-transform duration-500 ease-out"
              style={{
                transform: `translateY(${pitchAngle}px) rotate(${-pitchAngle / 2}deg)`,
              }}
            >
              {/* Sky (Blue/Cyan top) */}
              <div className="w-full h-1/2 bg-gradient-to-b from-sky-900 to-sky-700 border-b-2 border-white/80" />
              {/* Ground (Brown/Dark bottom) */}
              <div className="w-full h-1/2 bg-gradient-to-t from-stone-900 to-amber-950/80" />
            </div>

            {/* Pitch Ladder Lines */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center gap-2 opacity-70">
              <div className="w-12 h-0.5 bg-white/70" />
              <div className="w-16 h-0.5 bg-white/90" />
              <div className="w-24 h-1 bg-amber-400" />
              <div className="w-16 h-0.5 bg-white/90" />
              <div className="w-12 h-0.5 bg-white/70" />
            </div>

            {/* Azimuth / Compass Rose radial markings (kaleidoscope perimeter dial) */}
            <div className="absolute inset-0 pointer-events-none">
              {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                <div
                  key={deg}
                  className="absolute inset-0 flex justify-center items-start"
                  style={{ transform: `rotate(${deg}deg)` }}
                >
                  <div
                    className={`w-0.5 ${
                      deg % 90 === 0 ? 'h-3.5 bg-amber-400' : 'h-2 bg-white/60'
                    }`}
                  />
                  {deg % 90 === 0 && (
                    <span
                      className="absolute top-4 text-[9px] font-mono font-black text-amber-300 select-none"
                      style={{ transform: `rotate(-${deg}deg)` }}
                    >
                      {deg === 0 ? 'N' : deg === 90 ? 'E' : deg === 180 ? 'S' : 'O'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Center Airplane Reticle (Fixed) */}
          <div className="relative z-10 w-10 h-10 border-2 border-amber-400 rounded-full flex items-center justify-center pointer-events-none">
            <div className="w-3 h-3 bg-amber-400 rounded-full" />
            <div className="absolute w-16 h-0.5 bg-amber-400" />
          </div>

          {/* Top Lubber line / Index marker at 12 o'clock */}
          <div className="absolute top-1 z-20 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-amber-400 drop-shadow pointer-events-none" />

          {/* Bezel angle ring */}
          <div className="absolute inset-0 rounded-full border border-slate-600/50 pointer-events-none shadow-[inset_0_0_12px_rgba(0,0,0,0.6)]" />
        </div>

        {/* Gyro Data & Heading Dial */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-800 text-xs font-mono">
            <span className="text-slate-400">CABECEO:</span>
            <span
              className={`font-black ${
                pitch === 'Subiendo (+)'
                  ? 'text-sky-400'
                  : pitch === 'Bajando (-)'
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {pitch}
            </span>
          </div>

          {/* Heading Digital Gauge */}
          <div className="flex flex-col items-center p-3 bg-slate-950 rounded-2xl border-2 border-cyan-500/40 shadow-inner">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400 mb-1">
              Rumbo Seleccionado
            </span>
            <div className="text-3xl sm:text-4xl font-mono font-black text-cyan-300 tracking-wider">
              {heading.toString().padStart(3, '0')}°
            </div>
            <span className="text-[10px] font-mono text-slate-500 mt-1">
              (Azimut base: {currentBearing}°)
            </span>
          </div>

          {/* Heading Stepper Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={solved}
              onClick={() => adjustHeading(-10)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-mono text-xs font-bold border border-slate-700 cursor-pointer"
            >
              -10°
            </button>
            <button
              type="button"
              disabled={solved}
              onClick={() => adjustHeading(-1)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-mono text-xs font-bold border border-slate-700 cursor-pointer"
            >
              -1°
            </button>
            <button
              type="button"
              disabled={solved}
              onClick={() => adjustHeading(1)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-mono text-xs font-bold border border-slate-700 cursor-pointer"
            >
              +1°
            </button>
            <button
              type="button"
              disabled={solved}
              onClick={() => adjustHeading(10)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-mono text-xs font-bold border border-slate-700 cursor-pointer"
            >
              +10°
            </button>
          </div>
        </div>
      </div>

      {/* Lock Heading Action Button */}
      <div className="w-full flex flex-col items-center gap-2 pt-2 border-t border-slate-800">
        <button
          type="button"
          disabled={solved}
          onClick={handleLock}
          className={`w-full max-w-xs py-3 rounded-xl font-mono text-sm font-black uppercase tracking-wider transition-all transform active:scale-95 cursor-pointer shadow-lg ${
            solved
              ? 'bg-emerald-600 text-white cursor-default shadow-emerald-600/30'
              : 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 hover:text-white shadow-cyan-600/30 hover:shadow-cyan-500/50'
          }`}
        >
          {solved ? '✓ RUMBO BLOQUEADO' : 'FIJAR RUMBO'}
        </button>

        <span className="text-[11px] text-slate-400 font-mono text-center">
          {solved
            ? '✓ Calibración inercial establecida con éxito'
            : 'Ajusta el rumbo al grado exacto calculado según el manual y pulsa «FIJAR RUMBO»'}
        </span>
      </div>
    </div>
  );
};
