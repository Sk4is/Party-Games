/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Radio,
  CheckCircle2,
  Volume2,
  HelpCircle,
  Activity,
  Sliders,
} from 'lucide-react';
import { darkProtocolAudio } from '../../../utils/darkProtocolAudio';

interface FrequencyTuningMinigameProps {
  initialFreq?: number;
  targetFreq?: number;
  onSuccess: () => void;
  onClose: () => void;
}

export const FrequencyTuningMinigame: React.FC<FrequencyTuningMinigameProps> = ({
  initialFreq = 118.4,
  targetFreq = 148.6,
  onSuccess,
  onClose,
}) => {
  // Radio receiver physical controls:
  // 1. Coarse Dial: 100.0 to 180.0 MHz
  const [coarseFreq, setCoarseFreq] = useState<number>(initialFreq);
  // 2. Fine Vernier Dial: -2.0 to +2.0 MHz
  const [fineTune, setFineTune] = useState<number>(0.0);
  // 3. Phase Angle Dial: 0 to 360 deg (target: 180 deg)
  const [phase, setPhase] = useState<number>(35);
  const targetPhase = 180;

  const currentFreq = parseFloat((coarseFreq + fineTune).toFixed(2));
  const freqDiff = Math.abs(currentFreq - targetFreq);
  const phaseDiff = Math.abs(phase - targetPhase);

  const isClose = freqDiff < 1.2 && phaseDiff < 20;
  const signalQuality = Math.max(
    0,
    Math.min(100, Math.round(100 - (freqDiff * 20 + phaseDiff * 1.2)))
  );

  const [lockProgress, setLockProgress] = useState<number>(0);
  const [solved, setSolved] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Synchronization locking timer
  useEffect(() => {
    if (solved) return;
    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (isClose && !solved) {
        setLockProgress((prev) => {
          const next = prev + dt * 50; // ~2 seconds to lock
          if (next >= 100) {
            setSolved(true);
            darkProtocolAudio.playMinigameSuccess();
            setTimeout(() => {
              onSuccess();
            }, 1200);
            return 100;
          }
          return next;
        });
      } else if (!isClose) {
        setLockProgress((prev) => Math.max(0, prev - dt * 60));
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isClose, solved, onSuccess]);

  // Dual-trace CRT Oscilloscope animation
  useEffect(() => {
    let animId: number;
    let t = 0;

    const renderWave = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      t += 0.06;

      ctx.fillStyle = '#020612';
      ctx.fillRect(0, 0, w, h);

      // CRT phosphor grid lines
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Center reference zero-line
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      // 1. Ghost Target Beacon Wave (Amber SOS Beacon)
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.55)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x < w; x += 2) {
        const y = h / 2 + Math.sin(x * 0.05 + t * 2) * 32;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 2. Incoming Player Receiver Wave (Cyan with dynamic static noise)
      const noiseAmp = Math.min(28, freqDiff * 6);
      ctx.strokeStyle = isClose ? '#10b981' : '#06b6d4';
      ctx.lineWidth = isClose ? 2.5 : 1.5;
      ctx.shadowColor = isClose ? '#10b981' : '#06b6d4';
      ctx.shadowBlur = isClose ? 10 : 2;

      ctx.beginPath();
      for (let x = 0; x < w; x += 2) {
        const noise = (Math.random() - 0.5) * noiseAmp;
        const waveFreq = 0.02 + (currentFreq / 150) * 0.03;
        const phaseRad = (phase * Math.PI) / 180;
        const y = h / 2 + Math.sin(x * waveFreq + phaseRad + t * 2) * 32 + noise;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // CRT scanlines overlay
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      for (let y = 0; y < h; y += 3) {
        ctx.fillRect(0, y, w, 1);
      }

      animId = requestAnimationFrame(renderWave);
    };

    animId = requestAnimationFrame(renderWave);
    return () => cancelAnimationFrame(animId);
  }, [currentFreq, phase, freqDiff, isClose]);

  // Analog RF S-meter needle angle: 0 to 100 mapped to -60deg to +60deg
  const smeterAngle = -60 + (signalQuality / 100) * 120;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 font-mono select-none">
      {/* Heavy Steel Radio Receiver Chassis */}
      <div className="relative w-full max-w-2xl bg-[#080d14] border-4 border-[#334155] p-5 text-slate-100 flex flex-col justify-between shadow-[0_0_90px_rgba(6,182,212,0.18)]">
        {/* Top Header */}
        <div className="border-b-2 border-[#1e293b] pb-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-950 border border-emerald-500/50 text-emerald-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-xs font-black tracking-wider text-white font-['Silkscreen',monospace]">
                RECEPTOR DE RADIOENLACE // FRECUENCIA DE SOCORRO
              </div>
              <div className="text-[10px] text-emerald-400">
                MANTENIMIENTO SECTOR C &bull; ANTENA DE LARGO ALCANCE
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 text-xs font-bold transition-colors cursor-pointer"
              title="Instrucciones tácticas"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 text-xs font-bold transition-colors cursor-pointer"
              title="Volver a mantenimiento [ESC]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Short Instruction Banner */}
        <div className="mb-3 px-3 py-1.5 bg-[#040810] border border-cyan-500/30 flex items-center justify-between text-[11px]">
          <span className="text-cyan-300 font-bold font-['Silkscreen',monospace]">
            SINCRONIZA LA SEÑAL CON LA ONDA PORTADORA EXTERIOR.
          </span>
          <span className="text-slate-400 text-[10px]">
            OBJETIVO SOS: {targetFreq.toFixed(2)} MHz
          </span>
        </div>

        {showHelp && (
          <div className="mb-3 p-3 bg-slate-950 border border-emerald-500/40 text-xs text-slate-300 space-y-1 animate-in fade-in">
            <div className="font-bold text-emerald-400 uppercase">
              PROCEDIMIENTO DE SINTONIZACIÓN:
            </div>
            <p>1. Gira el Dial Coaxial hasta aproximarte a {targetFreq} MHz.</p>
            <p>2. Ajusta el Vernier fino (&plusmn;2.0 MHz) para centrar la onda.</p>
            <p>3. Modifica la Fase (desfase hacia 180°) hasta que la onda verde se acople a la dorada.</p>
            <p>4. Mantén la alineación hasta que el bloqueo de señal alcance el 100%.</p>
          </div>
        )}

        {/* Upper Station Area: CRT Oscilloscope + Analog S-Meter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 bg-[#03060a] p-3 border-2 border-[#1e293b]">
          {/* CRT Oscilloscope Screen */}
          <div className="sm:col-span-2 relative bg-[#02050f] border-2 border-slate-700 p-2 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[10px] font-bold text-cyan-400 mb-1 z-10">
              <span>CANAL A: SOS EXTERIOR (AMBER)</span>
              <span>CANAL B: RECEPTOR (CYAN)</span>
            </div>

            <canvas
              ref={canvasRef}
              width={340}
              height={140}
              className="w-full h-36 block rounded-sm bg-black"
            />
          </div>

          {/* Analog Signal/Noise S-Meter & Digital Readout */}
          <div className="flex flex-col justify-between p-2 bg-[#050912] border-2 border-slate-700 text-center">
            <div>
              <span className="text-[10px] font-black text-slate-300 font-['Silkscreen',monospace]">
                SEÑAL S-METER
              </span>

              {/* Curved Analog S-Meter Dial */}
              <div className="relative w-28 h-16 mx-auto mt-2 bg-[#0a0f18] border-2 border-slate-600 rounded-t-full flex items-end justify-center overflow-hidden shadow-inner p-1">
                {/* Dial Arc Scale */}
                <div className="absolute inset-x-2 bottom-0 top-1 border-t-2 border-dashed border-emerald-500/40 rounded-t-full pointer-events-none" />

                {/* S-Meter Needle */}
                <div
                  className="w-0.5 h-14 bg-rose-500 origin-bottom rounded-t-sm shadow-[0_0_6px_#f43f5e] transition-transform duration-100"
                  style={{ transform: `rotate(${smeterAngle}deg)` }}
                />
              </div>

              <div className="text-[10px] font-bold text-cyan-400 mt-1">
                CALIDAD: {signalQuality}%
              </div>
            </div>

            {/* Digital Frequency LED Readout */}
            <div className="p-2 bg-black border border-emerald-500/40 rounded-sm">
              <div className="text-[8px] text-slate-500 font-black uppercase">
                FRECUENCIA SINTONIZADA
              </div>
              <div className="text-xl font-black text-emerald-400 font-['Silkscreen',monospace] tracking-wider">
                {currentFreq.toFixed(2)} <span className="text-xs">MHz</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tactile Dials Section */}
        <div className="space-y-3 bg-[#03060a] p-3 border-2 border-[#1e293b] mb-4">
          <div className="text-[10px] font-black text-slate-400 uppercase font-['Silkscreen',monospace]">
            MANDOS DE SINTONIZACIÓN ANALÓGICA:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Dial 1: Coarse Tuning */}
            <div className="p-2 bg-slate-900/60 border border-slate-700 flex flex-col justify-between">
              <div className="flex justify-between text-xs font-bold text-slate-200 mb-1">
                <span>DIAL COAXIAL</span>
                <span className="text-cyan-400">{coarseFreq.toFixed(1)} MHz</span>
              </div>
              <input
                type="range"
                min="100.0"
                max="180.0"
                step="0.5"
                value={coarseFreq}
                onChange={(e) => {
                  darkProtocolAudio.playSwitchClick();
                  setCoarseFreq(parseFloat(e.target.value));
                }}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Dial 2: Fine Vernier */}
            <div className="p-2 bg-slate-900/60 border border-slate-700 flex flex-col justify-between">
              <div className="flex justify-between text-xs font-bold text-slate-200 mb-1">
                <span>VERNIER FINO</span>
                <span className="text-amber-400">
                  {fineTune > 0 ? `+${fineTune.toFixed(2)}` : fineTune.toFixed(2)} MHz
                </span>
              </div>
              <input
                type="range"
                min="-2.0"
                max="2.0"
                step="0.05"
                value={fineTune}
                onChange={(e) => {
                  darkProtocolAudio.playSwitchClick();
                  setFineTune(parseFloat(e.target.value));
                }}
                className="w-full accent-amber-400 cursor-pointer"
              />
            </div>

            {/* Dial 3: Phase Alignment */}
            <div className="p-2 bg-slate-900/60 border border-slate-700 flex flex-col justify-between">
              <div className="flex justify-between text-xs font-bold text-slate-200 mb-1">
                <span>FASE PORTADORA</span>
                <span className="text-emerald-400">{phase}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                step="5"
                value={phase}
                onChange={(e) => {
                  darkProtocolAudio.playSwitchClick();
                  setPhase(parseInt(e.target.value));
                }}
                className="w-full accent-emerald-400 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Lock Progress Bar */}
        <div className="p-3 bg-[#03060a] border-2 border-[#1e293b] mb-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="flex items-center gap-1.5 font-['Silkscreen',monospace]">
              {isClose ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
              )}
              <span>{isClose ? 'SEÑAL EN FASE RECEPTORA' : 'RUIDO ESTÁTICO DE FONDO'}</span>
            </span>
            <span className="text-emerald-400 font-black">
              BLOQUEO DE ONDA: {Math.round(lockProgress)}%
            </span>
          </div>

          <div className="w-full h-3 bg-slate-900 border border-slate-700 overflow-hidden p-0.5">
            <div
              className={`h-full transition-all duration-100 ${
                isClose
                  ? 'bg-emerald-400 shadow-[0_0_12px_#34d399]'
                  : 'bg-slate-700'
              }`}
              style={{ width: `${lockProgress}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-[#1e293b] pt-3 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer border border-slate-600"
          >
            VOLVER A MANTENIMIENTO [ESC]
          </button>

          {solved && (
            <div className="px-4 py-2 bg-emerald-950 border border-emerald-500 text-emerald-300 font-black text-xs uppercase flex items-center gap-2 animate-bounce">
              <CheckCircle2 className="w-4 h-4" />
              <span>¡FRECUENCIA SOS ALINEADA! OBJETIVO COMPLETADO</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
