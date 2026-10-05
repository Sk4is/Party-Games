/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, Heart, Shield, Activity, CheckCircle2, Sparkles } from 'lucide-react';
import { DarkProtocolGameState } from '../../types/darkProtocol';
import { darkProtocolAudio } from '../../utils/darkProtocolAudio';

interface InfirmaryStationModalProps {
  state: DarkProtocolGameState;
  onUpdateState: (updater: (prev: DarkProtocolGameState) => DarkProtocolGameState) => void;
  onClose: () => void;
}

export const InfirmaryStationModal: React.FC<InfirmaryStationModalProps> = ({
  state,
  onUpdateState,
  onClose,
}) => {
  const [treated, setTreated] = useState<boolean>(false);
  const health = state.explorer.health;
  const isInjured = health === 'HERIDO' || health === 'AGONIZANDO';

  useEffect(() => {
    darkProtocolAudio.playSwitchClick();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleApplyTreatment = () => {
    darkProtocolAudio.playMinigameSuccess();
    setTreated(true);
    onUpdateState((prev) => ({
      ...prev,
      explorer: {
        ...prev.explorer,
        health: 'SANO',
        animState: 'IDLE',
      },
      alerts: [
        {
          id: 'med_heal_' + Date.now(),
          text: '[ENFERMERÍA] Inyección coagulante aplicada. Estado físico restablecido a SANO.',
          room: 'infirmary',
          time: Date.now(),
          type: 'repair',
        },
        ...prev.alerts.slice(0, 8),
      ],
    }));

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 font-mono select-none">
      {/* Heavy Steel Medical Console */}
      <div className="relative w-full max-w-xl bg-[#070e12] border-4 border-[#334155] p-5 text-slate-100 flex flex-col justify-between shadow-[0_0_80px_rgba(16,185,129,0.18)] dp-machine-open">
        {/* Metal Corner Screws */}
        <div className="absolute top-2 left-2 w-2.5 h-2.5 bg-[#475569] border border-[#1e293b] flex items-center justify-center text-[7px] text-[#0f172a] font-black">+</div>
        <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#475569] border border-[#1e293b] flex items-center justify-center text-[7px] text-[#0f172a] font-black">+</div>
        <div className="absolute bottom-2 left-2 w-2.5 h-2.5 bg-[#475569] border border-[#1e293b] flex items-center justify-center text-[7px] text-[#0f172a] font-black">+</div>
        <div className="absolute bottom-2 right-2 w-2.5 h-2.5 bg-[#475569] border border-[#1e293b] flex items-center justify-center text-[7px] text-[#0f172a] font-black">+</div>

        {/* Header Bar */}
        <div className="border-b-2 border-[#1e293b] pb-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-950 border border-emerald-500/50 text-emerald-400">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div
                className="text-[11px] font-bold text-emerald-400 tracking-widest uppercase flex items-center gap-2"
                style={{ fontFamily: "'Silkscreen', monospace" }}
              >
                <span>ESTACIÓN DE TRIAJE // ENFERMERÍA FAM-09</span>
                <span className="text-[9px] px-1 bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">
                  BIOMÉTRICO
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                Dispensador automático de anticoagulantes y sutura sintética
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 bg-[#1e293b] hover:bg-[#334155] text-slate-300 hover:text-white border border-[#475569] transition-colors cursor-pointer"
            title="Cerrar terminal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Biometric Status Screen */}
        <div className="bg-[#03080b] border-2 border-[#1e293b] p-4 text-center my-2">
          <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-2">
            ESTADO FÍSICO ACTUAL DEL SUPERVIVIENTE:
          </div>

          <div className="flex items-center justify-center gap-3 my-3">
            <Heart
              className={`w-8 h-8 ${
                health === 'SANO' || treated
                  ? 'text-emerald-400'
                  : health === 'HERIDO'
                  ? 'text-amber-400 animate-pulse'
                  : 'text-rose-500 animate-ping'
              }`}
            />
            <div
              className={`text-2xl font-black tracking-widest uppercase ${
                health === 'SANO' || treated
                  ? 'text-emerald-400'
                  : health === 'HERIDO'
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
              style={{ fontFamily: "'Silkscreen', monospace" }}
            >
              {treated ? 'SANO' : health}
            </div>
          </div>

          <div className="text-xs text-slate-300 max-w-sm mx-auto my-2">
            {treated ? (
              <span className="text-emerald-400 flex items-center justify-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4" /> TRATAMIENTO COMPLETADO // TEJIDO ESTABILIZADO
              </span>
            ) : isInjured ? (
              'El superviviente presenta contusiones o desgarros físicos. Pulse el inyector para estabilizar los signos vitales.'
            ) : (
              'Signos vitales estables. No se requieren tratamientos de emergencia en este momento.'
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4 pt-3 border-t-2 border-[#1e293b] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#1e293b] hover:bg-[#334155] border border-[#475569] text-slate-300 text-xs font-bold uppercase transition-colors cursor-pointer"
          >
            VOLVER [ESC]
          </button>

          {isInjured && !treated && (
            <button
              type="button"
              onClick={handleApplyTreatment}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 border-b-4 border-emerald-800 text-slate-950 font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>APLICAR INYECTOR MÉDICO</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
