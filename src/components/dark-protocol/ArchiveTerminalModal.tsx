/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { X, FolderOpen, KeySquare, ShieldCheck, Database, FileText } from 'lucide-react';
import { DarkProtocolGameState } from '../../types/darkProtocol';
import { darkProtocolAudio } from '../../utils/darkProtocolAudio';

interface ArchiveTerminalModalProps {
  state: DarkProtocolGameState;
  onUpdateState: (updater: (prev: DarkProtocolGameState) => DarkProtocolGameState) => void;
  onClose: () => void;
}

export const ArchiveTerminalModal: React.FC<ArchiveTerminalModalProps> = ({
  state,
  onUpdateState,
  onClose,
}) => {
  useEffect(() => {
    darkProtocolAudio.playSwitchClick();

    // Mark Objective 4 as completed when accessing the records!
    onUpdateState((prev) => ({
      ...prev,
      objectives: prev.objectives.map((obj) => {
        if (obj.id === 'obj_archive_records') {
          return { ...obj, completed: true, status: 'COMPLETADO' };
        }
        if (obj.id === 'obj_escape_protocol') {
          return { ...obj, status: 'ACTIVO' };
        }
        return obj;
      }),
      alerts: [
        {
          id: 'archive_read_' + Date.now(),
          text: `[ARCHIVO] Código de evacuación recuperado con éxito: ${prev.coopCode}`,
          room: 'archive',
          time: Date.now(),
          type: 'repair',
        },
        ...prev.alerts.slice(0, 8),
      ],
    }));

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 font-mono select-none">
      {/* Heavy Steel Technical Terminal Chassis */}
      <div className="relative w-full max-w-2xl bg-[#070b14] border-4 border-[#334155] p-5 text-slate-100 flex flex-col justify-between shadow-[0_0_80px_rgba(6,182,212,0.18)] dp-terminal-open">
        {/* Metal Corner Screws */}
        <div className="absolute top-2 left-2 w-2.5 h-2.5 bg-[#475569] border border-[#1e293b] flex items-center justify-center text-[7px] text-[#0f172a] font-black">+</div>
        <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#475569] border border-[#1e293b] flex items-center justify-center text-[7px] text-[#0f172a] font-black">+</div>
        <div className="absolute bottom-2 left-2 w-2.5 h-2.5 bg-[#475569] border border-[#1e293b] flex items-center justify-center text-[7px] text-[#0f172a] font-black">+</div>
        <div className="absolute bottom-2 right-2 w-2.5 h-2.5 bg-[#475569] border border-[#1e293b] flex items-center justify-center text-[7px] text-[#0f172a] font-black">+</div>

        {/* Header Bar */}
        <div className="border-b-2 border-[#1e293b] pb-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-950 border border-amber-500/50 text-amber-400">
              <Database className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div
                className="text-[11px] font-bold text-amber-400 tracking-widest uppercase flex items-center gap-2"
                style={{ fontFamily: "'Silkscreen', monospace" }}
              >
                <span>ARCHIVO DE REGISTROS // PROTOCOLO DE INCIDENCIAS</span>
                <span className="text-[9px] px-1 bg-amber-950 text-amber-300 border border-amber-500/40 font-bold">
                  AUTORIZADO
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                Servidor central de contingencia e historial de accesos clasificados
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

        {/* CRT Amber phosphor screen */}
        <div className="relative bg-[#04060c] border-2 border-amber-500/30 p-5 overflow-hidden my-2">
          {/* Subtle phosphor scanlines */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.03)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] pointer-events-none" />

          <div className="text-xs text-amber-400 font-bold tracking-wider mb-2 flex items-center justify-between border-b border-amber-500/20 pb-1">
            <span>EXPEDIENTE DE EVACUACIÓN EXTERIOR</span>
            <span>SEGURIDAD NIVEL 4</span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed my-3">
            A continuación se muestra el código de desbloqueo neumático de 4 dígitos generado por la matriz de contingencia del búnker.
            Para completar la evacuación exterior, acuda a la sala de <strong>Acceso / Evacuación</strong> e introduzca esta clave en el teclado blindado.
          </p>

          <div className="bg-[#090e17] border-2 border-amber-500/50 p-4 text-center my-4">
            <div className="text-[10px] text-amber-500/80 uppercase tracking-widest font-bold mb-1">
              CLAVE DE AUTORIZACIÓN DE EVACUACIÓN:
            </div>
            <div
              className="text-5xl font-black text-amber-400 tracking-[0.4em] drop-shadow-[0_0_20px_rgba(245,158,11,0.5)] my-2"
              style={{ fontFamily: "'Silkscreen', monospace" }}
            >
              {state.coopCode}
            </div>
            <div className="text-[10px] text-emerald-400 flex items-center justify-center gap-1.5 font-bold mt-1">
              <ShieldCheck className="w-3.5 h-3.5" /> SECUENCIA VÁLIDA // OBJETIVO 4 ACTUALIZADO
            </div>
          </div>

          <div className="text-[11px] text-slate-400 border-t border-amber-500/20 pt-2 flex items-center justify-between">
            <span>SALA DESTINO: <strong className="text-white">ACCESO / EVACUACIÓN</strong></span>
            <span>OBJETIVO 5 DESBLOQUEADO</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-3 pt-3 border-t-2 border-[#1e293b] flex items-center justify-between text-[11px] text-slate-400">
          <span>Pulse ESC o el botón para volver a la instalación</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            ENTENDIDO [ESC]
          </button>
        </div>
      </div>
    </div>
  );
};
