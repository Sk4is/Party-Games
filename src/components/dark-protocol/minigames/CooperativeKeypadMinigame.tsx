/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Lock, CheckCircle2, AlertTriangle, KeySquare, ShieldAlert } from 'lucide-react';
import { darkProtocolAudio } from '../../../utils/darkProtocolAudio';

interface CooperativeKeypadMinigameProps {
  correctCode: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const CooperativeKeypadMinigame: React.FC<CooperativeKeypadMinigameProps> = ({
  correctCode,
  onSuccess,
  onClose,
}) => {
  const [enteredCode, setEnteredCode] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [solved, setSolved] = useState<boolean>(false);

  const handleDigit = (digit: string) => {
    if (solved || enteredCode.length >= 4) return;
    darkProtocolAudio.playSwitchClick();
    setErrorMsg(null);
    const newCode = enteredCode + digit;
    setEnteredCode(newCode);

    if (newCode.length === 4) {
      if (newCode === correctCode) {
        setSolved(true);
        darkProtocolAudio.playMinigameSuccess();
        setTimeout(() => {
          onSuccess();
        }, 1200);
      } else {
        setErrorMsg('ERROR: SECUENCIA INVÁLIDA');
        darkProtocolAudio.playMinigameFail();
        setTimeout(() => {
          setEnteredCode('');
          setErrorMsg(null);
        }, 1300);
      }
    }
  };

  const handleClear = () => {
    if (solved) return;
    darkProtocolAudio.playSwitchClick();
    setEnteredCode('');
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 font-mono select-none">
      {/* Industrial Keypad Chassis */}
      <div className="relative w-full max-w-md bg-[#0c1017] border-4 border-[#334155] p-5 text-slate-100 flex flex-col justify-between shadow-[0_0_80px_rgba(0,0,0,0.9)]">
        {/* Metal Corner Screws */}
        <div className="absolute top-2 left-2 w-2.5 h-2.5 bg-[#475569] border border-[#1e293b] flex items-center justify-center text-[7px] text-[#0f172a] font-black">+</div>
        <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#475569] border border-[#1e293b] flex items-center justify-center text-[7px] text-[#0f172a] font-black">+</div>
        <div className="absolute bottom-2 left-2 w-2.5 h-2.5 bg-[#475569] border border-[#1e293b] flex items-center justify-center text-[7px] text-[#0f172a] font-black">+</div>
        <div className="absolute bottom-2 right-2 w-2.5 h-2.5 bg-[#475569] border border-[#1e293b] flex items-center justify-center text-[7px] text-[#0f172a] font-black">+</div>

        {/* Hazard Caution Tape Header Strip */}
        <div className="w-full h-3 mb-3 border-y border-amber-600/60 bg-[repeating-linear-gradient(45deg,#b45309,#b45309_10px,#1e293b_10px,#1e293b_20px)]" />

        {/* Header Bar */}
        <div className="border-b-2 border-[#1e293b] pb-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-950 border border-amber-500/50 text-amber-400">
              <KeySquare className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-amber-400 tracking-widest uppercase flex items-center gap-2">
                <span>TERMINAL DE AUTORIZACIÓN DE ESCAPE</span>
                <span className="text-[9px] px-1 bg-amber-950 text-amber-300 border border-amber-500/40">
                  MOD-44
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                Introduce el código de 4 dígitos proporcionado por el Operador
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 bg-[#1e293b] hover:bg-[#334155] text-slate-300 hover:text-white border border-[#475569] transition-colors cursor-pointer"
            title="Cerrar panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* VFD Amber Digital Screen */}
        <div className="relative bg-[#05070a] border-2 border-[#1e293b] p-4 text-center mb-5 overflow-hidden">
          {/* Subtle phosphor raster lines */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.03)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] pointer-events-none" />

          <div className="flex items-center justify-between text-[10px] text-amber-500/70 uppercase tracking-widest mb-2 border-b border-amber-500/20 pb-1 font-bold">
            <span>SECUENCIA COMPUERTA EXTERIOR</span>
            <span>{solved ? 'ESTADO: CONCEDIDO' : 'ESTADO: BLOQUEO'}</span>
          </div>

          {/* 4-Digit Display */}
          <div className="flex justify-center gap-3 my-2">
            {[0, 1, 2, 3].map((i) => {
              const char = enteredCode[i];
              return (
                <div
                  key={i}
                  className={`w-14 h-16 bg-[#090d14] border-2 flex items-center justify-center text-3xl font-black transition-all ${
                    solved
                      ? 'border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                      : errorMsg
                      ? 'border-rose-500 text-rose-400 animate-pulse'
                      : char
                      ? 'border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                      : 'border-[#1e293b] text-slate-700'
                  }`}
                  style={{ fontFamily: "'Silkscreen', monospace" }}
                >
                  {char || '_'}
                </div>
              );
            })}
          </div>

          {/* Status Message */}
          <div className="min-h-[22px] flex items-center justify-center mt-2 text-xs font-bold">
            {solved ? (
              <span className="text-emerald-400 flex items-center gap-1.5 animate-pulse">
                <CheckCircle2 className="w-4 h-4" /> CÓDIGO CORRECTO // PROTOCOLO DE DESBLOQUEO ACTIVO
              </span>
            ) : errorMsg ? (
              <span className="text-rose-400 flex items-center gap-1.5 animate-shake">
                <AlertTriangle className="w-4 h-4" /> {errorMsg}
              </span>
            ) : (
              <span className="text-slate-500 text-[10px] tracking-wide">
                ESPERANDO TRANSMISIÓN DEL OPERADOR (SALA DE CONTROL)
              </span>
            )}
          </div>
        </div>

        {/* Industrial Mechanical Keypad Grid */}
        <div className="grid grid-cols-3 gap-2.5 p-3 bg-[#080c14] border-2 border-[#1e293b]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              disabled={solved || enteredCode.length >= 4}
              onClick={() => handleDigit(digit)}
              className="h-13 bg-[#1e293b] hover:bg-[#334155] active:bg-[#0f172a] active:translate-y-0.5 border-b-4 border-[#0f172a] hover:border-[#1e293b] text-slate-200 hover:text-amber-300 text-xl font-black transition-all flex items-center justify-center shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: "'Silkscreen', monospace" }}
            >
              {digit}
            </button>
          ))}

          {/* Bottom row: Clear, 0, Key */}
          <button
            type="button"
            disabled={solved || enteredCode.length === 0}
            onClick={handleClear}
            className="h-13 bg-rose-950/70 hover:bg-rose-900 border-b-4 border-rose-950 text-rose-300 hover:text-white text-xs font-bold tracking-wider transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            BORRAR
          </button>

          <button
            type="button"
            disabled={solved || enteredCode.length >= 4}
            onClick={() => handleDigit('0')}
            className="h-13 bg-[#1e293b] hover:bg-[#334155] active:bg-[#0f172a] active:translate-y-0.5 border-b-4 border-[#0f172a] hover:border-[#1e293b] text-slate-200 hover:text-amber-300 text-xl font-black transition-all flex items-center justify-center shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontFamily: "'Silkscreen', monospace" }}
          >
            0
          </button>

          <button
            type="button"
            disabled={true}
            className="h-13 bg-[#0f172a] border-b-4 border-[#020617] text-slate-600 text-xs font-mono flex items-center justify-center cursor-not-allowed"
          >
            <Lock className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        {/* Hazard Caution Tape Footer Strip */}
        <div className="w-full h-3 mt-3 border-y border-amber-600/60 bg-[repeating-linear-gradient(-45deg,#b45309,#b45309_10px,#1e293b_10px,#1e293b_20px)]" />

        {/* Bottom Status / Tip */}
        <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
          <span>COMPUERTA DE EVACUACIÓN: TURBINA 03</span>
          <button
            type="button"
            onClick={onClose}
            className="text-amber-400 hover:underline uppercase font-bold cursor-pointer"
          >
            Cerrar terminal [ESC]
          </button>
        </div>
      </div>
    </div>
  );
};
