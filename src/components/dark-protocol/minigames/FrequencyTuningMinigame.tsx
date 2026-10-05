/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { X, Radio, CheckCircle, Volume2 } from 'lucide-react';
import { darkProtocolAudio } from '../../../utils/darkProtocolAudio';

interface FrequencyTuningMinigameProps {
  initialFreq?: number;
  targetFreq?: number;
  onSuccess: () => void;
  onClose: () => void;
}

export const FrequencyTuningMinigame: React.FC<FrequencyTuningMinigameProps> = ({
  initialFreq = 114.2,
  targetFreq = 148.6,
  onSuccess,
  onClose,
}) => {
  const [freq, setFreq] = useState<number>(initialFreq);
  const [phase, setPhase] = useState<number>(30);
  const targetPhase = 180;

  const [lockProgress, setLockProgress] = useState<number>(0);
  const [solved, setSolved] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Waveform alignment calculation
  const freqDiff = Math.abs(freq - targetFreq);
  const phaseDiff = Math.abs(phase - targetPhase);
  const isClose = freqDiff < 1.2 && phaseDiff < 18;
  const signalQuality = Math.max(
    0,
    100 - (freqDiff * 18 + phaseDiff * 1.5)
  );

  useEffect(() => {
    let interval: number;
    if (isClose && !solved) {
      interval = window.setInterval(() => {
        setLockProgress((prev) => {
          const next = prev + 15;
          if (next >= 100) {
            setSolved(true);
            darkProtocolAudio.playMinigameSuccess();
            setTimeout(() => {
              onSuccess();
            }, 1000);
            return 100;
          }
          return next;
        });
      }, 100);
    } else if (!isClose && lockProgress > 0 && !solved) {
      setLockProgress(0);
    }
    return () => clearInterval(interval);
  }, [isClose, solved, lockProgress, onSuccess]);

  // Oscilloscope canvas animation
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
      t += 0.08;

      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, w, h);

      // Grid lines
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.15)';
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

      // Center line
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.stroke();

      // Target reference ghost wave (in gold/amber)
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x < w; x += 2) {
        const y = h / 2 + Math.sin(x * 0.05 + t * 2) * 35;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Current player signal wave (green/cyan) with noise based on diff
      const noiseAmp = Math.min(30, freqDiff * 5);
      ctx.strokeStyle = isClose ? '#10b981' : '#06b6d4';
      ctx.lineWidth = isClose ? 2.5 : 1.5;
      ctx.shadowColor = isClose ? '#10b981' : '#06b6d4';
      ctx.shadowBlur = isClose ? 10 : 2;

      ctx.beginPath();
      for (let x = 0; x < w; x += 2) {
        const noise = (Math.random() - 0.5) * noiseAmp;
        const waveFreq = 0.02 + (freq / 150) * 0.03;
        const phaseRad = (phase * Math.PI) / 180;
        const y = h / 2 + Math.sin(x * waveFreq + phaseRad + t * 2) * 35 + noise;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(renderWave);
    };

    animId = requestAnimationFrame(renderWave);
    return () => cancelAnimationFrame(animId);
  }, [freq, phase, freqDiff, isClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-xl rounded-2xl bg-[#080d16] border border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.18)] p-6 text-slate-100 font-mono">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wider">
                RADIOENLACE DE EMERGENCIA // SINTONIZADOR
              </h3>
              <p className="text-xs text-emerald-400/80">
                Alinea la onda portadora con la frecuencia objetivo (148.6 MHz, Fase 180°)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Oscilloscope Screen */}
        <div className="relative rounded-xl border border-emerald-500/40 bg-slate-950 overflow-hidden mb-5">
          <canvas
            ref={canvasRef}
            width={520}
            height={160}
            className="w-full h-[160px] block"
          />

          {/* OSD telemetry */}
          <div className="absolute top-2 left-3 text-[10px] text-emerald-400/90 font-mono flex items-center gap-3">
            <span>FREC: {freq.toFixed(1)} MHz</span>
            <span>FASE: {phase}°</span>
            <span>CALIDAD SEÑAL: {Math.round(signalQuality)}%</span>
          </div>

          {/* Alignment Lock Meter */}
          <div className="absolute bottom-2 inset-x-3 bg-slate-900/90 border border-white/10 rounded-md p-1.5 flex items-center gap-2">
            <span className="text-[10px] text-slate-300 font-bold">
              SINCRONIZACIÓN:
            </span>
            <div className="flex-1 h-3 rounded bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-100 ${
                  solved ? 'bg-emerald-400 shadow-[0_0_10px_#10b981]' : 'bg-cyan-500'
                }`}
                style={{ width: `${lockProgress}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-emerald-400">
              {lockProgress}%
            </span>
          </div>
        </div>

        {/* Rotary Controls & Sliders */}
        <div className="grid grid-cols-2 gap-4 mb-5 bg-[#04060a] p-4 rounded-xl border border-white/5">
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-2 font-bold">
              <span>FRECUENCIA (MHz)</span>
              <span className="text-cyan-400">{freq.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="90"
              max="170"
              step="0.2"
              value={freq}
              onChange={(e) => {
                darkProtocolAudio.playSwitchClick();
                setFreq(parseFloat(e.target.value));
              }}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>90 MHz</span>
              <span className="text-amber-400 font-bold">OBJ: {targetFreq}</span>
              <span>170 MHz</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-2 font-bold">
              <span>DESFASE DE ONDA (°)</span>
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
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>0°</span>
              <span className="text-amber-400 font-bold">OBJ: 180°</span>
              <span>360°</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
          >
            CERRAR CONSOLA [ESC]
          </button>
          {solved && (
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold">
              <CheckCircle className="w-4 h-4" />
              <span>FRECUENCIA SINCRONIZADA CON ÉXITO</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
