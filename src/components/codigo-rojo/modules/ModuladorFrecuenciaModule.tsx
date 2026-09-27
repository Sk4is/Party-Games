import React, { useState, useEffect, useRef } from 'react';
import { Activity, Minus, Plus } from 'lucide-react';
import { audio } from '../../../utils/audio';

type WaveformType = 'SENOIDAL' | 'CUADRADA' | 'TRIANGULAR' | 'DIENTE_SIERRA';

interface ModuladorFrecuenciaModuleProps {
  operatorState: {
    waveform: WaveformType;
    channel: 'CANAL-ALPHA' | 'CANAL-BETA' | 'CANAL-GAMMA' | 'CANAL-DELTA';
    currentFreq: number;
    baseFreq: number;
  };
  solved: boolean;
  onAction: (action: { tunedFreq: number }) => void;
}

// Waveform mathematical evaluator: returns normalized amplitude in [-1, 1]
// u = (x / wavelength) - phase
function evalWaveform(type: WaveformType, u: number): number {
  const f = u - Math.floor(u); // fractional cycle in [0, 1)

  if (type === 'SENOIDAL') {
    return Math.sin(2 * Math.PI * f);
  }

  if (type === 'TRIANGULAR') {
    if (f < 0.25) return 4 * f;
    if (f < 0.75) return 2 - 4 * f;
    return 4 * f - 4;
  }

  if (type === 'CUADRADA') {
    const eps = 0.025; // 2.5% slew transition for authentic oscilloscope trace
    if (f < eps) return -1 + 2 * (f / eps);
    if (f < 0.5 - eps) return 1;
    if (f < 0.5 + eps) return 1 - (f - (0.5 - eps)) / eps;
    if (f < 1.0 - eps) return -1;
    return -1 + (f - (1.0 - eps)) / eps;
  }

  if (type === 'DIENTE_SIERRA') {
    const tr = 0.94; // 94% linear ramp, 6% sharp flyback drop
    if (f < tr) return -1 + 2 * (f / tr);
    return 1 - 2 * ((f - tr) / (1 - tr));
  }

  return 0;
}

// Generate SVG path d string for 300px width
function generateWavePath(
  type: WaveformType,
  wavelength: number,
  phase: number,
  width = 300,
  y0 = 40,
  amp = 24,
  step = 2.5
): string {
  let d = '';
  for (let x = 0; x <= width; x += step) {
    const u = x / wavelength - phase;
    const v = evalWaveform(type, u);
    const y = y0 - amp * v;
    d += (x === 0 ? 'M ' : ' L ') + x.toFixed(1) + ' ' + y.toFixed(1);
  }
  return d;
}

export const ModuladorFrecuenciaModule: React.FC<ModuladorFrecuenciaModuleProps> = ({
  operatorState,
  solved,
  onAction,
}) => {
  const { waveform, channel, baseFreq } = operatorState;
  const [freq, setFreq] = useState<number>(baseFreq);

  const pathRef = useRef<SVGPathElement>(null);
  const scanLineRef = useRef<SVGLineElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const phaseRef = useRef<number>(0);
  const scanXRef = useRef<number>(0);
  const visualFreqRef = useRef<number>(baseFreq);
  const targetFreqRef = useRef<number>(baseFreq);
  const pulseRef = useRef<number>(0);

  // Sync state if baseFreq changes from room updates/reconnect
  useEffect(() => {
    setFreq(baseFreq);
    targetFreqRef.current = baseFreq;
  }, [baseFreq]);

  const handleAdjust = (delta: number) => {
    if (solved) return;
    audio.playDialClick();
    setFreq((prev) => {
      const next = Math.max(50, Math.min(300, prev + delta));
      targetFreqRef.current = next;
      pulseRef.current = 1.0;
      return next;
    });
  };

  const handleCalibrate = () => {
    if (solved) return;
    audio.playMechanicalSwitch();
    onAction({ tunedFreq: freq });
  };

  // High-performance continuous animation loop updating SVG path and scanline directly without React re-renders
  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      // Exponential smoothing toward target frequency (~220ms convergence)
      const target = targetFreqRef.current;
      visualFreqRef.current += (target - visualFreqRef.current) * (1 - Math.exp(-dt / 0.08));

      // Instrument button pulse decay
      if (pulseRef.current > 0) {
        pulseRef.current = Math.max(0, pulseRef.current - dt * 4.0);
      }

      // Continuous propagation: subtle speed scaling with frequency
      if (!prefersReducedMotion && !solved) {
        const currentSpeed = 0.95 + (visualFreqRef.current - 50) * 0.0018;
        phaseRef.current = (phaseRef.current + dt * currentSpeed) % 1;
      }

      // CRT scanline sweep
      if (!prefersReducedMotion) {
        scanXRef.current = (scanXRef.current + dt * 110) % 300;
        if (scanLineRef.current) {
          scanLineRef.current.setAttribute('x1', scanXRef.current.toFixed(1));
          scanLineRef.current.setAttribute('x2', scanXRef.current.toFixed(1));
        }
      }

      // Compute normalized wave density: higher kHz -> more cycles; lower kHz -> fewer cycles
      const cycles = Math.max(2.0, Math.min(10.0, 4.5 + (visualFreqRef.current - 110) * 0.032));
      const wavelength = 300 / cycles;

      // Generate wave path
      const pathD = generateWavePath(waveform, wavelength, phaseRef.current, 300, 40, 24, 2.5);

      if (pathRef.current) {
        pathRef.current.setAttribute('d', pathD);
        const glow = 5 + 5 * pulseRef.current;
        const strokeWidth = (2.8 + 0.5 * pulseRef.current).toFixed(1);
        pathRef.current.setAttribute('stroke-width', strokeWidth);
        pathRef.current.style.filter = `drop-shadow(0 0 ${glow}px rgba(16, 185, 129, ${0.75 + 0.25 * pulseRef.current}))`;
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [waveform, solved]);

  // Initial fallback path for immediate paint
  const initialCycles = Math.max(2.0, Math.min(10.0, 4.5 + (baseFreq - 110) * 0.032));
  const initialPath = generateWavePath(waveform, 300 / initialCycles, 0, 300, 40, 24, 2.5);

  return (
    <div className="flex flex-col items-center justify-between w-full h-full p-6 bg-slate-900/90 rounded-2xl border border-slate-700 select-none">
      {/* Header info */}
      <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-xs uppercase font-mono font-bold tracking-widest text-emerald-300">
            SEÑAL
          </span>
          <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
            // MONITOR AUX
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="px-2.5 py-0.5 bg-emerald-950 border border-emerald-500/40 rounded text-emerald-400 font-mono text-xs font-bold">
            {channel}
          </span>
        </div>
      </div>

      {/* Phosphor CRT Display */}
      <div className="relative w-full max-w-md h-36 sm:h-44 bg-slate-950 rounded-xl border-2 border-emerald-900/80 p-3 overflow-hidden shadow-[inset_0_0_20px_rgba(16,185,129,0.2)] my-3 flex flex-col justify-between">
        {/* CRT Scanline effect */}
        <div className="absolute inset-0 bg-radial from-transparent to-black/60 pointer-events-none" />

        <div className="relative z-10 flex justify-between items-center text-xs font-mono text-emerald-500/80">
          <span>BASE: {baseFreq}.0 kHz</span>
          <span className="font-bold">ONDA: {waveform}</span>
        </div>

        {/* Waveform graphic visualization */}
        <div className="relative z-10 flex-1 flex items-center justify-center">
          <svg className="w-full h-20" viewBox="0 0 300 80">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(16,185,129,0.15)" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="300" height="80" fill="url(#grid)" />

            {/* Oscilloscope Centerline Axes */}
            <line x1="0" y1="40" x2="300" y2="40" stroke="rgba(16, 185, 129, 0.22)" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="150" y1="0" x2="150" y2="80" stroke="rgba(16, 185, 129, 0.22)" strokeWidth="1" strokeDasharray="4 4" />

            {/* Faint CRT Sweep Line */}
            <line
              ref={scanLineRef}
              x1="0"
              y1="0"
              x2="0"
              y2="80"
              stroke="rgba(52, 211, 153, 0.25)"
              strokeWidth="1.2"
            />

            {/* Continuous Live Waveform Path */}
            <path
              ref={pathRef}
              d={initialPath}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ filter: 'drop-shadow(0 0 5px rgba(16, 185, 129, 0.75))' }}
            />
          </svg>
        </div>

        <div className="relative z-10 text-right font-mono text-emerald-400 font-bold text-sm">
          SINTONÍA: {freq}.0 kHz
        </div>
      </div>

      {/* Controls */}
      <div className="w-full flex items-center justify-center gap-4">
        <button
          type="button"
          disabled={solved}
          onClick={() => handleAdjust(-5)}
          className="p-3 bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-xl border border-slate-700 text-slate-200 transition-all cursor-pointer flex items-center gap-1 font-mono text-xs font-bold"
        >
          <Minus className="w-4 h-4" /> 5 kHz
        </button>

        <button
          type="button"
          disabled={solved}
          onClick={handleCalibrate}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 rounded-xl text-slate-950 font-black tracking-wider uppercase transition-all shadow-lg shadow-emerald-600/30 cursor-pointer disabled:opacity-50"
        >
          {solved ? 'CALIBRADO ✓' : 'CALIBRAR'}
        </button>

        <button
          type="button"
          disabled={solved}
          onClick={() => handleAdjust(5)}
          className="p-3 bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-xl border border-slate-700 text-slate-200 transition-all cursor-pointer flex items-center gap-1 font-mono text-xs font-bold"
        >
          <Plus className="w-4 h-4" /> 5 kHz
        </button>
      </div>

      <div className="text-xs text-slate-400 font-mono text-center pt-2">
        Ajusta la frecuencia según la tabla armónica del manual
      </div>
    </div>
  );
};
