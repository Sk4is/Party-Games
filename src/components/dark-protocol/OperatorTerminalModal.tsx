/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Video,
  Zap,
  Map as MapIcon,
  Radio,
  Power,
  ShieldAlert,
  AlertTriangle,
  Lock,
  Unlock,
} from 'lucide-react';
import { DarkProtocolGameState, CameraDefinition } from '../../types/darkProtocol';
import { FACILITY_ROOMS } from '../../data/darkProtocol/facilityMap';
import { darkProtocolAudio } from '../../utils/darkProtocolAudio';
import { CctvLiveView } from './CctvLiveView';

interface OperatorTerminalModalProps {
  station: 'cctv' | 'electric' | 'map' | 'comms';
  state: DarkProtocolGameState;
  onUpdateState: (updater: (prev: DarkProtocolGameState) => DarkProtocolGameState) => void;
  onClose: () => void;
}

export const OperatorTerminalModal: React.FC<OperatorTerminalModalProps> = ({
  station,
  state,
  onUpdateState,
  onClose,
}) => {
  const [selectedCamId, setSelectedCamId] = useState<string>(
    Object.keys(state.cameras)[0] || 'cam_control'
  );

  const selectedCam = state.cameras[selectedCamId];
  const isSelectedCamPowered =
    selectedCam &&
    state.circuits[selectedCam.circuitId]?.powered &&
    selectedCam.state === 'ONLINE';

  const toggleSectorPower = (sectorKey: 'sector_a' | 'sector_b' | 'sector_c') => {
    darkProtocolAudio.playSwitchClick();
    onUpdateState((prev) => {
      const nowPowered = !prev.circuits[sectorKey].powered;
      return {
        ...prev,
        circuits: {
          ...prev.circuits,
          [sectorKey]: {
            ...prev.circuits[sectorKey],
            powered: nowPowered,
          },
        },
        alerts: [
          {
            id: 'breaker_' + Date.now(),
            text: `Operador conmutó el interruptor de ${prev.circuits[sectorKey].name}: ${
              nowPowered ? 'ENERGIZADO' : 'CORTE DE ENERGÍA'
            }`,
            room: 'control_room',
            time: Date.now(),
            type: 'repair',
          },
          ...prev.alerts.slice(0, 8),
        ],
      };
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
      <div className="relative w-full max-w-3xl rounded-2xl bg-[#090d16] border border-cyan-500/30 shadow-[0_0_60px_rgba(6,182,212,0.18)] p-6 text-slate-100 font-mono">
        {/* Terminal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              {station === 'cctv' && <Video className="w-5 h-5" />}
              {station === 'electric' && <Zap className="w-5 h-5" />}
              {station === 'map' && <MapIcon className="w-5 h-5" />}
              {station === 'comms' && <Radio className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wider">
                SALA DE CONTROL //{' '}
                {station === 'cctv'
                  ? 'MATRIZ DE CÁMARAS CCTV'
                  : station === 'electric'
                  ? 'TABLERO DE DISTRIBUCIÓN ELÉCTRICA'
                  : station === 'map'
                  ? 'PLANO TÁCTICO DE INSTALACIONES'
                  : 'SISTEMA DE COMUNICACIONES Y CIFRADO'}
              </h3>
              <p className="text-xs text-cyan-400/80">Terminal física interactiva del Operador</p>
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

        {/* STATION 1: CCTV ARRAY */}
        {station === 'cctv' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Camera list */}
            <div className="space-y-2 bg-[#04060a] p-3 rounded-xl border border-white/5">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                CANALES DE VÍDEO
              </div>
              {(Object.values(state.cameras) as CameraDefinition[]).map((cam) => {
                const isOnline =
                  cam.state === 'ONLINE' && Boolean(state.circuits[cam.circuitId]?.powered);
                const isSelected = cam.id === selectedCamId;

                return (
                  <button
                    key={cam.id}
                    type="button"
                    onClick={() => {
                      darkProtocolAudio.playSwitchClick();
                      setSelectedCamId(cam.id);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg text-xs font-bold flex items-center justify-between border transition-all ${
                      isSelected
                        ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300'
                        : 'bg-slate-900/60 border-white/5 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{cam.name}</span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-black ${
                        isOnline
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-950 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {isOnline ? 'VIVO' : 'CORTE'}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Monitor Feed View: Real Live CCTV Feed */}
            <div className="md:col-span-2 bg-[#04060a] border border-cyan-500/30 rounded-xl overflow-hidden flex flex-col min-h-[340px] shadow-2xl">
              <CctvLiveView
                state={state}
                camId={selectedCamId}
                className="w-full h-full min-h-[340px]"
              />
            </div>
          </div>
        )}

        {/* STATION 2: ELECTRIC DISTRIBUTION */}
        {station === 'electric' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400 mb-2">
              Panel maestro de conmutación de disyuntores. Permite al Operador reconectar o aislar sectores de la instalación.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(['sector_a', 'sector_b', 'sector_c'] as const).map((sectorKey) => {
                const sec = state.circuits[sectorKey];
                const isPowered = sec.powered;

                return (
                  <div
                    key={sectorKey}
                    className={`p-4 rounded-xl border transition-all ${
                      isPowered
                        ? 'bg-slate-900/80 border-cyan-500/40'
                        : 'bg-rose-950/20 border-rose-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-200">{sec.name}</span>
                      <Power
                        className={`w-4 h-4 ${
                          isPowered ? 'text-emerald-400' : 'text-rose-500'
                        }`}
                      />
                    </div>

                    <div className="text-xs mb-3 text-slate-400">
                      ESTADO:{' '}
                      <span
                        className={`font-black ${
                          isPowered ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {isPowered ? 'ENERGIZADO' : 'DESCONECTADO'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleSectorPower(sectorKey)}
                      className={`w-full py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-colors ${
                        isPowered
                          ? 'bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-slate-950 shadow-md'
                      }`}
                    >
                      {isPowered ? 'CORTAR SUMINISTRO' : 'RESTAURAR SUMINISTRO'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STATION 3: FACILITY MAP */}
        {station === 'map' && (
          <div className="bg-[#04060a] border border-white/10 rounded-xl p-5">
            <div className="text-xs text-slate-400 mb-4 font-bold flex items-center justify-between">
              <span>ESQUEMA DE TOPOLOGÍA // ANILLO DE 6 SECTORES</span>
              <span className="text-cyan-400">TODOS LOS SECTORES COMUNICADOS</span>
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto py-2">
              {Object.values(FACILITY_ROOMS).map((room) => {
                const isPowered = state.circuits[room.sector]?.powered;
                const isExplorerHere = state.explorer.room === room.id;

                return (
                  <div
                    key={room.id}
                    className={`p-3 rounded-xl border text-center relative ${
                      isPowered
                        ? 'bg-slate-900 border-cyan-500/30'
                        : 'bg-slate-950 border-rose-500/30'
                    }`}
                  >
                    <div className="text-[11px] font-bold text-white mb-1">
                      {room.name}
                    </div>
                    <div className="text-[9px] text-slate-400 uppercase">
                      {state.circuits[room.sector]?.name.split(':')[0]}
                    </div>
                    <div
                      className={`text-[9px] font-bold mt-1.5 ${
                        isPowered ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isPowered ? '● ENERGÍA OK' : '○ CORTE'}
                    </div>

                    {isExplorerHere && (
                      <div className="mt-2 text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 animate-pulse">
                        👤 EXPLORADOR
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STATION 4: COMMS & COOP DECODING MATRIX */}
        {station === 'comms' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/30">
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold mb-2">
                <Radio className="w-4 h-4" />
                <span>MATRIZ DE DESCIFRADO COOPERATIVO (OBJ 4)</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Este terminal contiene la clave de evacuación autorizada para la compuerta exterior. El Explorador debe introducirla en la consola de Generadores.
              </p>
            </div>

            <div className="bg-[#04060a] border border-white/10 rounded-xl p-5 text-center">
              <div className="text-xs text-slate-400 uppercase tracking-widest mb-2 font-bold">
                SECUENCIA DE AUTORIZACIÓN PARA EL EXPLORADOR:
              </div>
              <div className="text-4xl font-black text-amber-400 tracking-[0.4em] my-3 drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                {state.coopCode}
              </div>
              <div className="text-xs text-slate-500">
                (Transmite esta secuencia de 4 dígitos al Explorador o cámbiate a él en modo de prueba [F1] para teclearla)
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
          >
            VOLVER A LA SALA DE CONTROL [ESC]
          </button>
        </div>
      </div>
    </div>
  );
};
