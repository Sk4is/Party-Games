/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Gauge,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Flame,
  Snowflake,
} from 'lucide-react';
import { darkProtocolAudio } from '../../../utils/darkProtocolAudio';

interface PressureValvesMinigameProps {
  onSuccess: () => void;
  onClose: () => void;
}

export const PressureValvesMinigame: React.FC<PressureValvesMinigameProps> = ({
  onSuccess,
  onClose,
}) => {
  // 3 Rotary physical valves: V1 (Compressor), V2 (Bypass), V3 (Purge)
  const [v1, setV1] = useState<number>(35);
  const [v2, setV2] = useState<number>(80);
  const [v3, setV3] = useState<number>(20);

  // Dynamic physics equations:
  // Sweet spot roughly around V1: ~65, V2: ~65, V3: ~75
  const pressure = Math.round(v1 * 0.6 + v2 * 0.3 - v3 * 0.4 + 20);
  const flow = Math.round(v3 * 0.7 + v2 * 0.4 - v1 * 0.2);
  const temp = Math.round(v1 * 0.4 + v3 * 0.5 - v2 * 0.3 + 15);

  const isSafe = pressure >= 45 && pressure <= 55 && flow >= 65 && temp <= 65;
  const isCritical = pressure > 75 || temp > 80;

  const [stabilizationProgress, setStabilizationProgress] = useState<number>(0);
  const [solved, setSolved] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);

  // Smooth stabilization loop
  useEffect(() => {
    if (solved) return;
    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (isSafe && !solved) {
        setStabilizationProgress((prev) => {
          const next = prev + dt * 45; // ~2.2s stabilization lock
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
      } else if (!isSafe) {
        setStabilizationProgress((prev) => Math.max(0, prev - dt * 50));
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isSafe, solved, onSuccess]);

  // Needle angle calculations: 0 to 100 maps to -120deg to +120deg
  const pressureAngle = -120 + (Math.min(100, Math.max(0, pressure)) / 100) * 240;
  const flowAngle = -120 + (Math.min(100, Math.max(0, flow)) / 100) * 240;
  const tempAngle = -120 + (Math.min(100, Math.max(0, temp)) / 100) * 240;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 font-mono select-none">
      {/* Industrial Cryogenic Console Chassis */}
      <div
        className={`relative w-full max-w-2xl bg-[#080d14] border-4 border-[#334155] p-5 text-slate-100 flex flex-col justify-between shadow-[0_0_90px_rgba(6,182,212,0.15)] dp-machine-open ${
          isCritical ? 'animate-pulse' : ''
        }`}
      >
        {/* Frost / Condensation subtle corner styling */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.12),transparent_70%)] pointer-events-none" />

        {/* Top Header */}
        <div className="border-b-2 border-[#1e293b] pb-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-950 border border-cyan-500/50 text-cyan-400">
              <Snowflake className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <div className="text-xs font-black tracking-wider text-white font-['Silkscreen',monospace]">
                CONSOLA DE PRESIÓN CRIOGÉNICA // VÁLVULAS MAESTRAS
              </div>
              <div className="text-[10px] text-cyan-400">
                LABORATORIO SECTOR B &bull; LÍNEA DE NITRÓGENO LÍQUIDO
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
              title="Volver al laboratorio [ESC]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Short Instruction Banner */}
        <div className="mb-3 px-3 py-1.5 bg-[#040810] border border-cyan-500/30 flex items-center justify-between text-[11px]">
          <span className="text-cyan-300 font-bold font-['Silkscreen',monospace]">
            ESTABILIZA LOS TRES CIRCUITOS EN LA FRANJA VERDE DE SEGURIDAD.
          </span>
          <span
            className={`font-black text-[10px] ${
              isCritical
                ? 'text-rose-400 animate-bounce'
                : isSafe
                ? 'text-emerald-400'
                : 'text-amber-400'
            }`}
          >
            {isCritical
              ? '¡¡PRESIÓN CRÍTICA!!'
              : isSafe
              ? 'ESTABILIZANDO...'
              : 'DESEQUILIBRIO'}
          </span>
        </div>

        {showHelp && (
          <div className="mb-3 p-3 bg-slate-950 border border-cyan-500/40 text-xs text-slate-300 space-y-1 animate-in fade-in">
            <div className="font-bold text-cyan-400 uppercase">
              RANGOS NOMINALES REQUERIDOS:
            </div>
            <p>&bull; Presión: entre 45 y 55 PSI (Zona central calibrada).</p>
            <p>&bull; Caudal: mínimo 65 L/min (Flujo suficiente para el reactor).</p>
            <p>&bull; Temperatura: por debajo de 65°C (Prevención de ebullición).</p>
            <p className="text-slate-400 italic">
              Ajusta gradualmente las tres válvulas hasta que los 3 diales marquen en verde de forma simultánea.
            </p>
          </div>
        )}

        {/* 3 ANALOG DIAL GAUGES (Round physical meters with needles) */}
        <div className="grid grid-cols-3 gap-3 mb-4 bg-[#03060a] p-3 border-2 border-[#1e293b]">
          {/* GAUGE 1: PRESIÓN */}
          <div className="flex flex-col items-center p-2 bg-[#050912] border border-slate-700 text-center">
            <span className="text-[10px] font-black text-slate-300 mb-1 font-['Silkscreen',monospace]">
              PRESIÓN
            </span>

            {/* Circular Gauge Dial */}
            <div className="relative w-24 h-24 rounded-full bg-[#0a0f18] border-2 border-slate-600 flex items-center justify-center overflow-hidden shadow-inner">
              {/* Green Arc Indicator */}
              <div className="absolute inset-1 rounded-full border-4 border-transparent border-t-emerald-500/40 rotate-[15deg] pointer-events-none" />

              {/* Physical Needle */}
              <div
                className="absolute w-1 h-10 bg-rose-500 origin-bottom rounded-t-sm shadow-[0_0_6px_#f43f5e] transition-transform duration-150"
                style={{
                  transform: `translateY(-50%) rotate(${pressureAngle}deg)`,
                }}
              />
              <div className="w-3 h-3 rounded-full bg-slate-200 border-2 border-slate-900 z-10" />
            </div>

            <div className="mt-2 text-xs font-black">
              <span
                className={
                  pressure >= 45 && pressure <= 55
                    ? 'text-emerald-400 font-bold'
                    : 'text-rose-400'
                }
              >
                {pressure} PSI
              </span>
            </div>
            <span className="text-[8px] text-slate-500">RANGO: 45 - 55</span>
          </div>

          {/* GAUGE 2: CAUDAL */}
          <div className="flex flex-col items-center p-2 bg-[#050912] border border-slate-700 text-center">
            <span className="text-[10px] font-black text-slate-300 mb-1 font-['Silkscreen',monospace]">
              CAUDAL
            </span>

            {/* Circular Gauge Dial */}
            <div className="relative w-24 h-24 rounded-full bg-[#0a0f18] border-2 border-slate-600 flex items-center justify-center overflow-hidden shadow-inner">
              {/* Green Arc Indicator */}
              <div className="absolute inset-1 rounded-full border-4 border-transparent border-r-emerald-500/40 pointer-events-none" />

              {/* Physical Needle */}
              <div
                className="absolute w-1 h-10 bg-cyan-400 origin-bottom rounded-t-sm shadow-[0_0_6px_#22d3ee] transition-transform duration-150"
                style={{
                  transform: `translateY(-50%) rotate(${flowAngle}deg)`,
                }}
              />
              <div className="w-3 h-3 rounded-full bg-slate-200 border-2 border-slate-900 z-10" />
            </div>

            <div className="mt-2 text-xs font-black">
              <span className={flow >= 65 ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
                {flow} L/min
              </span>
            </div>
            <span className="text-[8px] text-slate-500">MÍNIMO: 65</span>
          </div>

          {/* GAUGE 3: TEMPERATURA */}
          <div className="flex flex-col items-center p-2 bg-[#050912] border border-slate-700 text-center">
            <span className="text-[10px] font-black text-slate-300 mb-1 font-['Silkscreen',monospace]">
              TEMPERATURA
            </span>

            {/* Circular Gauge Dial */}
            <div className="relative w-24 h-24 rounded-full bg-[#0a0f18] border-2 border-slate-600 flex items-center justify-center overflow-hidden shadow-inner">
              {/* Red Danger Arc Indicator */}
              <div className="absolute inset-1 rounded-full border-4 border-transparent border-t-rose-500/40 rotate-[60deg] pointer-events-none" />

              {/* Physical Needle */}
              <div
                className="absolute w-1 h-10 bg-amber-400 origin-bottom rounded-t-sm shadow-[0_0_6px_#fbbf24] transition-transform duration-150"
                style={{
                  transform: `translateY(-50%) rotate(${tempAngle}deg)`,
                }}
              />
              <div className="w-3 h-3 rounded-full bg-slate-200 border-2 border-slate-900 z-10" />
            </div>

            <div className="mt-2 text-xs font-black">
              <span className={temp <= 65 ? 'text-emerald-400 font-bold' : 'text-rose-400'}>
                {temp}°C
              </span>
            </div>
            <span className="text-[8px] text-slate-500">MÁXIMO: 65°C</span>
          </div>
        </div>

        {/* 3 PHYSICAL ROTARY VALVE WHEELS */}
        <div className="space-y-3 bg-[#03060a] p-3 border-2 border-[#1e293b] mb-4">
          <div className="text-[10px] font-black text-slate-400 uppercase font-['Silkscreen',monospace]">
            MANDOS ROTATIVOS MANUALES:
          </div>

          {/* Valve 1 */}
          <div className="flex items-center gap-4 bg-slate-900/60 p-2 border border-slate-700">
            <div
              className="w-10 h-10 rounded-full bg-slate-800 border-2 border-cyan-400 flex items-center justify-center text-[10px] font-black text-cyan-300 shadow-md shrink-0 transition-transform"
              style={{ transform: `rotate(${v1 * 3.6}deg)` }}
            >
              ✛
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-xs font-bold text-slate-200 mb-1">
                <span>V-01: COMPRESOR PRINCIPAL</span>
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
          </div>

          {/* Valve 2 */}
          <div className="flex items-center gap-4 bg-slate-900/60 p-2 border border-slate-700">
            <div
              className="w-10 h-10 rounded-full bg-slate-800 border-2 border-amber-400 flex items-center justify-center text-[10px] font-black text-amber-300 shadow-md shrink-0 transition-transform"
              style={{ transform: `rotate(${v2 * 3.6}deg)` }}
            >
              ✛
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-xs font-bold text-slate-200 mb-1">
                <span>V-02: BYPASS CRIOGÉNICO</span>
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
          </div>

          {/* Valve 3 */}
          <div className="flex items-center gap-4 bg-slate-900/60 p-2 border border-slate-700">
            <div
              className="w-10 h-10 rounded-full bg-slate-800 border-2 border-emerald-400 flex items-center justify-center text-[10px] font-black text-emerald-300 shadow-md shrink-0 transition-transform"
              style={{ transform: `rotate(${v3 * 3.6}deg)` }}
            >
              ✛
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-xs font-bold text-slate-200 mb-1">
                <span>V-03: PURGA DE ALIVIO</span>
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
        </div>

        {/* Stabilization Progress Bar & Lock Mechanism */}
        <div className="p-3 bg-[#03060a] border-2 border-[#1e293b] mb-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="flex items-center gap-1.5 font-['Silkscreen',monospace]">
              {isSafe ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              )}
              <span>{isSafe ? 'PARÁMETROS EQUILIBRADOS' : 'BUSCANDO PRESIÓN ESTABLE'}</span>
            </span>
            <span className="text-cyan-400 font-black">
              BLOQUEO HIDRÁULICO: {Math.round(stabilizationProgress)}%
            </span>
          </div>

          <div className="w-full h-3 bg-slate-900 border border-slate-700 overflow-hidden p-0.5">
            <div
              className={`h-full transition-all duration-100 ${
                isSafe
                  ? 'bg-emerald-400 shadow-[0_0_12px_#34d399]'
                  : 'bg-slate-700'
              }`}
              style={{ width: `${stabilizationProgress}%` }}
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
            VOLVER AL LABORATORIO [ESC]
          </button>

          {solved && (
            <div className="px-4 py-2 bg-emerald-950 border border-emerald-500 text-emerald-300 font-black text-xs uppercase flex items-center gap-2 animate-bounce">
              <CheckCircle2 className="w-4 h-4" />
              <span>¡PRESIÓN ESTABILIZADA! OBJETIVO COMPLETADO</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
