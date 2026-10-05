/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Zap,
  Power,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ShieldAlert,
} from 'lucide-react';
import { darkProtocolAudio } from '../../../utils/darkProtocolAudio';

interface ElectricalCircuitMinigameProps {
  onSuccess: () => void;
  onFail: () => void;
  onClose: () => void;
}

export const ElectricalCircuitMinigame: React.FC<ElectricalCircuitMinigameProps> = ({
  onSuccess,
  onFail,
  onClose,
}) => {
  // Physical panel stage states:
  // 1. Main Feed Cutout Lever (true = closed / engaged)
  const [mainLever, setMainLever] = useState<boolean>(false);

  // 2. Ceramic Cartridge Fuses (3 fuses: F101, F102, F103)
  const [fuses, setFuses] = useState<[boolean, boolean, boolean]>([true, false, true]);

  // 3. Distribution Relay Bus Switches (Relay 1: Bus A/B, Relay 2: Bus A/B, Relay 3: Bus A/B)
  // Target correct path: Relay 1 -> Bus A (true), Relay 2 -> Bus B (false), Relay 3 -> Bus A (true)
  const [relays, setRelays] = useState<[boolean, boolean, boolean]>([false, true, false]);

  // 4. Heavy Output Breaker Arm (engaged when ready to push power to Sector C)
  const [outputBreaker, setOutputBreaker] = useState<boolean>(false);

  // 5. Overload trip state
  const [overloadTripped, setOverloadTripped] = useState<boolean>(false);
  const [status, setStatus] = useState<'IDLE' | 'SOLVED' | 'TRIPPED'>('IDLE');
  const [showHelp, setShowHelp] = useState<boolean>(false);

  // Power flow calculations:
  // Stage 1: Main input powered if lever engaged and not tripped
  const isInputPowered = mainLever && !overloadTripped;

  // Stage 2: Fuse bank powered if input powered and all 3 fuses seated
  const areFusesComplete = fuses[0] && fuses[1] && fuses[2];
  const isFuseBankPowered = isInputPowered && areFusesComplete;

  // Stage 3: Relay bus alignment:
  // Relay 1 must be Bus A (true), Relay 2 must be Bus B (false), Relay 3 must be Bus A (true)
  const areRelaysAligned = relays[0] === true && relays[1] === false && relays[2] === true;
  const isDistributionPowered = isFuseBankPowered && areRelaysAligned;

  // Stage 4: Voltage calculation
  const voltage = isDistributionPowered ? 384 : isFuseBankPowered ? 240 : isInputPowered ? 120 : 0;

  // Stage 5: Output ready
  const isOutputLive = isDistributionPowered && outputBreaker;

  // Actions
  const handleToggleMainLever = () => {
    if (status === 'SOLVED') return;
    darkProtocolAudio.playSwitchClick();
    setMainLever((prev) => !prev);
  };

  const handleToggleFuse = (index: number) => {
    if (status === 'SOLVED') return;
    darkProtocolAudio.playSwitchClick();
    setFuses((prev) => {
      const copy = [...prev] as [boolean, boolean, boolean];
      copy[index] = !copy[index];
      return copy;
    });
  };

  const handleToggleRelay = (index: number) => {
    if (status === 'SOLVED') return;
    darkProtocolAudio.playSwitchClick();
    setRelays((prev) => {
      const copy = [...prev] as [boolean, boolean, boolean];
      copy[index] = !copy[index];
      return copy;
    });
  };

  const handleEngageOutputBreaker = () => {
    if (status === 'SOLVED') return;
    darkProtocolAudio.playSwitchClick();

    if (!isDistributionPowered) {
      // Overload trip!
      darkProtocolAudio.playMinigameFail();
      darkProtocolAudio.playElectricSpark();
      setOverloadTripped(true);
      setOutputBreaker(false);
      setStatus('TRIPPED');
      onFail();
      return;
    }

    // Success! Full circuit closed!
    setOutputBreaker(true);
    setStatus('SOLVED');
    darkProtocolAudio.playMinigameSuccess();

    setTimeout(() => {
      onSuccess();
    }, 1400);
  };

  const handleResetOverload = () => {
    darkProtocolAudio.playSwitchClick();
    setOverloadTripped(false);
    setOutputBreaker(false);
    setStatus('IDLE');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 font-mono select-none">
      {/* Industrial Substation Metal Housing */}
      <div className="relative w-full max-w-2xl bg-[#090d14] border-4 border-[#334155] rounded-none shadow-[0_0_80px_rgba(0,0,0,0.9)] p-5 text-slate-100 flex flex-col justify-between overflow-hidden dp-machine-open">
        {/* Corner Hex Screws */}
        <div className="absolute top-2 left-2 w-3 h-3 bg-[#475569] border border-[#1e293b] rounded-full flex items-center justify-center text-[7px] text-[#0f172a] font-black">
          +
        </div>
        <div className="absolute top-2 right-2 w-3 h-3 bg-[#475569] border border-[#1e293b] rounded-full flex items-center justify-center text-[7px] text-[#0f172a] font-black">
          +
        </div>
        <div className="absolute bottom-2 left-2 w-3 h-3 bg-[#475569] border border-[#1e293b] rounded-full flex items-center justify-center text-[7px] text-[#0f172a] font-black">
          +
        </div>
        <div className="absolute bottom-2 right-2 w-3 h-3 bg-[#475569] border border-[#1e293b] rounded-full flex items-center justify-center text-[7px] text-[#0f172a] font-black">
          +
        </div>

        {/* Top Header: Hazard Warning & Model Stencil */}
        <div className="border-b-2 border-[#1e293b] pb-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="px-2.5 py-1 bg-amber-500 text-slate-950 font-black text-[10px] tracking-widest font-['Silkscreen',monospace] uppercase">
              /// 380V ALTA TENSIÓN ///
            </div>
            <div>
              <div className="text-xs font-black tracking-wider text-white font-['Silkscreen',monospace]">
                SUBESTACIÓN ELÉCTRICA // CUADRO PRIMARIO DE LÍNEA
              </div>
              <div className="text-[10px] text-slate-400">
                PUESTO DE MANIOBRA SECTOR C &bull; SUB-NIVEL 4
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
              title="Cerrar cuadro [ESC]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Short Instruction Banner */}
        <div className="mb-3 px-3 py-1.5 bg-[#04060c] border border-cyan-500/30 flex items-center justify-between text-[11px]">
          <span className="text-cyan-300 font-bold font-['Silkscreen',monospace]">
            RESTABLECE EL FLUJO ELÉCTRICO HASTA LA SALIDA DEL SECTOR C.
          </span>
          <span className="text-slate-400 text-[10px]">
            LÍNEA: {isOutputLive ? 'ENERGIZADA (380V)' : 'ABIERTA / CORTE'}
          </span>
        </div>

        {showHelp && (
          <div className="mb-3 p-3 bg-slate-950 border border-amber-500/40 text-xs text-slate-300 space-y-1 animate-in fade-in">
            <div className="font-bold text-amber-400 uppercase">
              SECUENCIA TÁCTICA DE RECONEXIÓN:
            </div>
            <p>1. Cierra la palanca de acometida general (380V ENTRADA).</p>
            <p>2. Pulsa sobre el fusible desconectado (F-102) para reponer la continuidad cerámica.</p>
            <p>3. Conmuta los 3 relés de distribución a la combinación equilibrada: BUS A, BUS B, BUS A.</p>
            <p>4. Acciona el disyuntor de carga final hacia el Sector C.</p>
          </div>
        )}

        {/* Overload Alert Warning */}
        {overloadTripped && (
          <div className="mb-3 p-2.5 bg-rose-950/80 border-2 border-rose-500 text-rose-200 text-xs font-bold flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>SOBRECARGA DETECTADA: DISYUNTOR DISPARADO POR CIRCUITO DESEQUILIBRADO</span>
            </div>
            <button
              type="button"
              onClick={handleResetOverload}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-slate-950 text-[10px] font-black uppercase tracking-wider cursor-pointer"
            >
              REARMAR
            </button>
          </div>
        )}

        {/* MAIN PHYSICAL CIRCUIT BOARD (Metal chassis with active copper conduits) */}
        <div className="bg-[#03060a] border-2 border-[#1e293b] p-4 my-2 relative overflow-hidden">
          {/* Background Technical Blueprint Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

          {/* Copper Bus Conduits Layout */}
          <div className="grid grid-cols-4 gap-4 relative z-10 items-stretch">
            {/* STAGE 1: 380V INPUT FEED & MAIN LEVER */}
            <div
              className={`p-3 border-2 flex flex-col justify-between text-center transition-all ${
                isInputPowered
                  ? 'bg-amber-950/30 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                  : 'bg-slate-900/50 border-slate-700'
              }`}
            >
              <div className="text-[10px] font-bold text-slate-400 font-['Silkscreen',monospace]">
                1. ENTRADA (380V)
              </div>

              {/* Physical Lever */}
              <div className="my-3 flex flex-col items-center">
                <button
                  type="button"
                  onClick={handleToggleMainLever}
                  className={`w-14 h-24 border-2 p-1 flex flex-col justify-between items-center transition-all cursor-pointer ${
                    mainLever
                      ? 'bg-emerald-950 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                      : 'bg-rose-950 border-rose-500'
                  }`}
                >
                  <span className="text-[8px] font-black uppercase text-slate-300">
                    {mainLever ? 'CERRADO' : 'ABIERTO'}
                  </span>
                  <div
                    className={`w-10 h-8 rounded-sm transition-transform duration-200 border flex items-center justify-center font-black text-[9px] ${
                      mainLever
                        ? 'translate-y-4 bg-emerald-500 text-slate-950 border-emerald-300'
                        : '-translate-y-4 bg-rose-600 text-white border-rose-300'
                    }`}
                  >
                    PALANCA
                  </div>
                  <span className="text-[8px] text-slate-400">ACOMETIDA</span>
                </button>
              </div>

              <div
                className={`text-[9px] font-black uppercase px-1 py-0.5 border ${
                  mainLever
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-950 text-slate-400 border-slate-700'
                }`}
              >
                {mainLever ? 'ALIMENTADO' : 'CORTE GENERAL'}
              </div>
            </div>

            {/* STAGE 2: CERAMIC FUSE BANK */}
            <div
              className={`p-3 border-2 flex flex-col justify-between text-center transition-all ${
                isFuseBankPowered
                  ? 'bg-cyan-950/30 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                  : 'bg-slate-900/50 border-slate-700'
              }`}
            >
              <div className="text-[10px] font-bold text-slate-400 font-['Silkscreen',monospace]">
                2. FUSIBLES (3X)
              </div>

              {/* 3 Cartridge Fuses */}
              <div className="my-2 space-y-2">
                {([0, 1, 2] as const).map((idx) => {
                  const isSeated = fuses[idx];
                  const fuseName = `F-10${idx + 1}`;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleToggleFuse(idx)}
                      className={`w-full py-1.5 px-2 border flex items-center justify-between text-left transition-all cursor-pointer ${
                        isSeated
                          ? 'bg-slate-900 border-cyan-400/60 text-cyan-200'
                          : 'bg-rose-950/60 border-rose-500 text-rose-300 animate-pulse'
                      }`}
                    >
                      <span className="text-[9px] font-black">{fuseName}</span>
                      <span className="text-[8px] px-1 py-0.2 rounded font-bold uppercase bg-black/60">
                        {isSeated ? 'CONTINUO' : 'QUEMADO'}
                      </span>
                      <div
                        className={`w-2.5 h-2.5 rounded-full border ${
                          isSeated ? 'bg-cyan-400 border-cyan-200' : 'bg-rose-600 border-rose-400'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>

              <div
                className={`text-[9px] font-black uppercase px-1 py-0.5 border ${
                  areFusesComplete
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                    : 'bg-rose-950 text-rose-300 border-rose-500/40'
                }`}
              >
                {areFusesComplete ? 'BANCO 3/3 OK' : 'FUSIBLE FUNDIDO'}
              </div>
            </div>

            {/* STAGE 3: RELAY BUS SELECTION */}
            <div
              className={`p-3 border-2 flex flex-col justify-between text-center transition-all ${
                isDistributionPowered
                  ? 'bg-amber-950/30 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                  : 'bg-slate-900/50 border-slate-700'
              }`}
            >
              <div className="text-[10px] font-bold text-slate-400 font-['Silkscreen',monospace]">
                3. BUS DE RELÉS
              </div>

              {/* 3 Relay selector toggle switches */}
              <div className="my-2 space-y-2">
                {([0, 1, 2] as const).map((idx) => {
                  const isBusA = relays[idx];
                  const relayName = `R-0${idx + 1}`;

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleToggleRelay(idx)}
                      className={`w-full py-1.5 px-2 border flex items-center justify-between text-left transition-all cursor-pointer ${
                        isBusA
                          ? 'bg-slate-900 border-amber-400/60 text-amber-200'
                          : 'bg-slate-900 border-cyan-400/60 text-cyan-200'
                      }`}
                    >
                      <span className="text-[9px] font-black">{relayName}</span>
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.2 bg-black/60 rounded">
                        {isBusA ? 'BUS A' : 'BUS B'}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div
                className={`text-[9px] font-black uppercase px-1 py-0.5 border ${
                  areRelaysAligned
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-950 text-slate-400 border-slate-700'
                }`}
              >
                {areRelaysAligned ? 'FASE BALANCEADA' : 'DESFASE RELÉS'}
              </div>
            </div>

            {/* STAGE 4: OUTPUT BREAKER & SECTOR C FEED */}
            <div
              className={`p-3 border-2 flex flex-col justify-between text-center transition-all ${
                isOutputLive
                  ? 'bg-emerald-950/40 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                  : 'bg-slate-900/50 border-slate-700'
              }`}
            >
              <div className="text-[10px] font-bold text-slate-400 font-['Silkscreen',monospace]">
                4. SALIDA SECTOR C
              </div>

              {/* Heavy output breaker actuator button */}
              <div className="my-3 flex flex-col items-center">
                <button
                  type="button"
                  onClick={handleEngageOutputBreaker}
                  disabled={status === 'SOLVED'}
                  className={`w-16 h-20 border-2 flex flex-col items-center justify-center p-2 transition-all cursor-pointer active:scale-95 ${
                    isOutputLive
                      ? 'bg-emerald-500 border-emerald-200 text-slate-950 shadow-[0_0_25px_#10b981]'
                      : isDistributionPowered
                      ? 'bg-cyan-500 hover:bg-cyan-400 border-cyan-200 text-slate-950 shadow-lg animate-bounce'
                      : 'bg-slate-900 border-slate-600 text-slate-400 hover:text-white'
                  }`}
                >
                  <Power className="w-6 h-6 mb-1 fill-current" />
                  <span className="text-[8px] font-black tracking-widest uppercase">
                    {isOutputLive ? 'ENERGIZADO' : 'DISYUNTOR'}
                  </span>
                </button>
              </div>

              <div
                className={`text-[9px] font-black uppercase px-1 py-0.5 border ${
                  isOutputLive
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-400'
                    : 'bg-slate-950 text-slate-400 border-slate-700'
                }`}
              >
                {isOutputLive ? '● SECTOR C OK' : '○ EN ESPERA'}
              </div>
            </div>
          </div>

          {/* Sequential Live LED Bus Indicator Bar */}
          <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-bold">LÍNEA:</span>
              <div className="flex gap-1.5">
                {[isInputPowered, isFuseBankPowered, isDistributionPowered, isOutputLive].map(
                  (lit, idx) => (
                    <div
                      key={idx}
                      className={`w-4 h-2 rounded-sm border transition-all ${
                        lit
                          ? 'bg-cyan-400 border-cyan-200 shadow-[0_0_8px_#22d3ee]'
                          : 'bg-slate-800 border-slate-700'
                      }`}
                    />
                  )
                )}
              </div>
            </div>

            <div className="text-[11px] font-black">
              VOLTÍMETRO:{' '}
              <span
                className={`font-['Silkscreen',monospace] ${
                  voltage >= 380 ? 'text-emerald-400 font-bold' : 'text-slate-400'
                }`}
              >
                {voltage} V AC
              </span>
            </div>
          </div>
        </div>

        {/* Footer: Confirm message or Close */}
        <div className="border-t-2 border-[#1e293b] pt-3 mt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer border border-slate-600"
          >
            VOLVER A LA SALA ELÉCTRICA [ESC]
          </button>

          {status === 'SOLVED' && (
            <div className="px-4 py-2 bg-emerald-950 border border-emerald-500 text-emerald-300 font-black text-xs uppercase flex items-center gap-2 animate-bounce">
              <CheckCircle2 className="w-4 h-4" />
              <span>¡SUBESTACIÓN RESTABLECIDA! SECTOR C ENERGIZADO</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
