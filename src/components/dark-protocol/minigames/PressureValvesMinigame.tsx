/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Gauge, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { darkProtocolAudio } from '../../../utils/darkProtocolAudio';

interface PressureValvesMinigameProps {
  onSuccess: () => void;
  onClose: () => void;
}

export const PressureValvesMinigame: React.FC<PressureValvesMinigameProps> = ({
  onSuccess,
  onClose,
}) => {
  // 3 inter-connected valves: V1, V2, V3
  const [v1, setV1] = useState<number>(85); // 0 - 100
  const [v2, setV2] = useState<number>(30); // 0 - 100
  const [v3, setV3] = useState<number>(90); // 0 - 100

  // System gauges influenced by valve interaction
  // Target: Pressure between 45 and 55 PSI, Temperature < 60°C, Flow > 65 L/min
  const pressure = Math.round(v1 * 0.6 + v2 * 0.3 - v3 * 0.4 + 20);
  const flow = Math.round(v3 * 0.7 + v2 * 0.4 - v1 * 0.2);
  const temp = Math.round(v1 * 0.4 + v3 * 0.5 - v2 * 0.3 + 15);

  const isSafe = pressure >= 45 && pressure <= 55 && flow >= 65 && temp <= 65;
  const [stabilizationProgress, setStabilizationProgress] = useState<number>(0);
  const [solved, setSolved] = useState<boolean>(false);

  useEffect(() => {
    if (solved) return;
    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (isSafe && !solved) {
        setStabilizationProgress((prev) => {
          const next = prev + dt * 50; // Reaches 100% in 2 seconds
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
      } else if (!isSafe) {
        setStabilizationProgress((prev) => Math.max(0, prev - dt * 60));
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isSafe, solved, onSuccess]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-xl rounded-2xl bg-[#0b0e14] border border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.18)] p-6 text-slate-100 font-mono">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-950 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Gauge className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wider">
                SISTEMA CRIOGÉNICO // VÁLVULAS DE PRESIÓN
              </h3>
              <p className="text-xs text-amber-400/80">
                Regula las 3 válvulas maestras para estabilizar la presión en la franja verde
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

        {/* Telemetry Gauges */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {/* Pressure Gauge */}
          <div className="bg-[#05070c] border border-white/10 rounded-xl p-3 text-center">
            <div className="text-[10px] text-slate-400 font-bold mb-1">
              PRESIÓN (PSI)
            </div>
            <div
              className={`text-2xl font-black ${
                pressure >= 45 && pressure <= 55 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {pressure}
            </div>
            <div className="text-[9px] text-slate-500">ZONA SEGURA: 45 - 55</div>
          </div>

          {/* Flow Gauge */}
          <div className="bg-[#05070c] border border-white/10 rounded-xl p-3 text-center">
            <div className="text-[10px] text-slate-400 font-bold mb-1">
              CAUDAL (L/min)
            </div>
            <div
              className={`text-2xl font-black ${
                flow >= 65 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {flow}
            </div>
            <div className="text-[9px] text-slate-500">MÍNIMO: 65 L/min</div>
          </div>

          {/* Temp Gauge */}
          <div className="bg-[#05070c] border border-white/10 rounded-xl p-3 text-center">
            <div className="text-[10px] text-slate-400 font-bold mb-1">
              TEMPERATURA (°C)
            </div>
            <div
              className={`text-2xl font-black ${
                temp <= 65 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {temp}°
            </div>
            <div className="text-[9px] text-slate-500">MÁXIMO: 65°C</div>
          </div>
        </div>

        {/* Interactive Valves */}
        <div className="space-y-4 mb-5 bg-[#05070c] p-4 rounded-xl border border-white/5">
          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1 font-bold">
              <span>VÁLVULA 01 (Compresor Primario)</span>
              <span className="text-cyan-400">{v1}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={v1}
              onChange={(e) => {
                darkProtocolAudio.playSwitchClick();
                setV1(parseInt(e.target.value));
              }}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1 font-bold">
              <span>VÁLVULA 02 (Bypass de Derivación)</span>
              <span className="text-amber-400">{v2}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={v2}
              onChange={(e) => {
                darkProtocolAudio.playSwitchClick();
                setV2(parseInt(e.target.value));
              }}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs text-slate-300 mb-1 font-bold">
              <span>VÁLVULA 03 (Descarga Criogénica)</span>
              <span className="text-emerald-400">{v3}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={v3}
              onChange={(e) => {
                darkProtocolAudio.playSwitchClick();
                setV3(parseInt(e.target.value));
              }}
              className="w-full accent-emerald-400 cursor-pointer"
            />
          </div>
        </div>

        {/* Stabilization Progress */}
        <div className="mb-5 p-3 rounded-lg bg-slate-900 border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isSafe ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertOctagon className="w-4 h-4 text-rose-400" />
              )}
              <span className="text-xs font-bold text-slate-200">
                {isSafe ? 'PARÁMETROS EN RANGO SEGURO' : 'FUERA DE RANGO SEGURO'}
              </span>
            </div>
            <div className="text-xs font-bold text-cyan-400">
              ESTABILIZACIÓN: {Math.round(stabilizationProgress)}%
            </div>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
            <div
              className={`h-full transition-all duration-100 ${
                isSafe ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' : 'bg-slate-700'
              }`}
              style={{ width: `${stabilizationProgress}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
          >
            VOLVER AL LABORATORIO [ESC]
          </button>
          {solved && (
            <span className="text-emerald-400 text-xs font-bold">
              ¡SISTEMA CRIOGÉNICO ESTABILIZADO!
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
