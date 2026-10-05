/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Lock, CheckCircle2, AlertTriangle, KeySquare } from 'lucide-react';
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
        setErrorMsg('CÓDIGO DE AUTORIZACIÓN INCORRECTO');
        darkProtocolAudio.playMinigameFail();
        setTimeout(() => {
          setEnteredCode('');
          setErrorMsg(null);
        }, 1200);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-[#0b0e14] border border-orange-500/30 shadow-[0_0_50px_rgba(249,115,22,0.18)] p-6 text-slate-100 font-mono">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-orange-950 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <KeySquare className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wider">
                PANEL DE AUTORIZACIÓN // CAMPO
              </h3>
              <p className="text-xs text-orange-400/80">
                Introduce el código de 4 dígitos proporcionado por el Operador
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

        {/* Display Screen */}
        <div className="bg-[#04060a] border border-white/10 rounded-xl p-4 text-center mb-5">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">
            SECUENCIA DE SEGURIDAD
          </div>
          <div className="flex justify-center gap-3 my-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-12 h-14 rounded-lg bg-slate-900 border border-orange-500/30 flex items-center justify-center text-2xl font-black text-orange-400 shadow-inner"
              >
                {enteredCode[i] || '_'}
              </div>
            ))}
          </div>

          {errorMsg && (
            <div className="text-xs text-rose-400 font-bold mt-2 flex items-center justify-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {solved && (
            <div className="text-xs text-emerald-400 font-bold mt-2 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>¡CÓDIGO ACEPTADO! PROTOCOLO DE EVACUACIÓN DESBLOQUEADO</span>
            </div>
          )}
        </div>

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[280px] mx-auto mb-5">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '#'].map((k) => (
            <button
              key={k}
              type="button"
              disabled={solved || (k === '#' && true)}
              onClick={() => {
                if (k === 'C') handleClear();
                else if (k !== '#') handleDigit(k);
              }}
              className="h-12 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 border border-white/10 hover:border-orange-500/50 text-white font-black text-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {k}
            </button>
          ))}
        </div>

        {/* Cooperative info notice */}
        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-white/5 text-[10px] text-slate-400 text-center mb-4">
          💡 En este modo de prueba, pulsa <span className="text-amber-300 font-bold">F2</span> para cambiar al rol de <span className="text-amber-300 font-bold">Operador</span>, acércate a la Terminal de Comunicaciones en la Sala de Control para leer la clave, y pulsa <span className="text-amber-300 font-bold">F1</span> para volver a introducirla.
        </div>

        {/* Footer */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
          >
            VOLVER AL GENERADOR [ESC]
          </button>
        </div>
      </div>
    </div>
  );
};
