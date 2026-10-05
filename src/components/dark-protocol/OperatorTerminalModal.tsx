/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Video,
  Map as MapIcon,
  Activity,
  Terminal,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { DarkProtocolGameState, CameraDefinition } from '../../types/darkProtocol';
import { FACILITY_ROOMS } from '../../data/darkProtocol/facilityMap';
import { darkProtocolAudio } from '../../utils/darkProtocolAudio';
import { CctvLiveView } from './CctvLiveView';
import { BunkerMapSchematic } from './BunkerMapSchematic';

interface OperatorTerminalModalProps {
  station: 'cctv' | 'map' | 'status';
  state: DarkProtocolGameState;
  onUpdateState: (updater: (prev: DarkProtocolGameState) => DarkProtocolGameState) => void;
  onClose: () => void;
}

export const OperatorTerminalModal: React.FC<OperatorTerminalModalProps> = ({
  station: initialStation,
  state,
  onUpdateState,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'cctv' | 'map' | 'status'>(initialStation || 'cctv');
  const [selectedCamId, setSelectedCamId] = useState<string>(
    Object.keys(state.cameras)[0] || 'cam_control'
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleTabChange = (tab: 'cctv' | 'map' | 'status') => {
    darkProtocolAudio.playSwitchClick();
    setActiveTab(tab);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-3 sm:p-4 font-mono select-none">
      {/* Heavy Steel Technical Workstation Chassis */}
      <div className="relative w-full max-w-5xl bg-[#060a12] border-4 border-[#334155] p-4 sm:p-5 text-slate-100 flex flex-col justify-between shadow-[0_0_90px_rgba(6,182,212,0.18)] max-h-[94vh] overflow-hidden dp-terminal-open">
        {/* Metal Corner Screws */}
        <div className="absolute top-2 left-2 w-2.5 h-2.5 bg-[#475569] border border-[#1e293b] flex items-center justify-center text-[7px] text-[#0f172a] font-black">+</div>
        <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#475569] border border-[#1e293b] flex items-center justify-center text-[7px] text-[#0f172a] font-black">+</div>
        <div className="absolute bottom-2 left-2 w-2.5 h-2.5 bg-[#475569] border border-[#1e293b] flex items-center justify-center text-[7px] text-[#0f172a] font-black">+</div>
        <div className="absolute bottom-2 right-2 w-2.5 h-2.5 bg-[#475569] border border-[#1e293b] flex items-center justify-center text-[7px] text-[#0f172a] font-black">+</div>

        {/* Top Header & Operational Tabs */}
        <div className="border-b-2 border-[#1e293b] pb-3 mb-3">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-950 border border-cyan-500/50 text-cyan-400">
                <Terminal className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div
                  className="text-[11px] font-bold text-cyan-400 tracking-widest uppercase flex items-center gap-2"
                  style={{ fontFamily: "'Silkscreen', monospace" }}
                >
                  <span>CONSOLA PRINCIPAL DE SALA DE CONTROL // FAM-09</span>
                  <span className="text-[9px] px-1 bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                    PUESTO OPERADOR
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Vigilancia de circuito cerrado, telemetría del plano táctico y diagnóstico de incidentes
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

          {/* Console Switcher Tabs (Only legitimate control room functions!) */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-[#04060a] border border-[#1e293b]">
            <button
              type="button"
              onClick={() => handleTabChange('cctv')}
              className={`p-2 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'cctv'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                  : 'bg-[#0a0f18] text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>MATRIZ CCTV (10 CÁMARAS)</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('map')}
              className={`p-2 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'map'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                  : 'bg-[#0a0f18] text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <MapIcon className="w-4 h-4" />
              <span>PLANO TÁCTICO DEL BÚNKER</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('status')}
              className={`p-2 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'status'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                  : 'bg-[#0a0f18] text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>ESTADO DE RED E INCIDENCIAS</span>
            </button>
          </div>
        </div>

        {/* Console Main Content Area */}
        <div className="flex-1 overflow-y-auto min-h-[360px] max-h-[62vh] pr-1">
          {/* TAB 1: CCTV ARRAY (All 10 Cameras) */}
          {activeTab === 'cctv' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Camera List */}
              <div className="space-y-1.5 bg-[#03060a] p-2.5 border-2 border-[#1e293b] max-h-[460px] overflow-y-auto">
                <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider mb-2 flex items-center justify-between border-b border-[#1e293b] pb-1">
                  <span>CANALES DE VÍDEO</span>
                  <span className="text-[9px] text-slate-500 font-mono">10 NODOS</span>
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
                      className={`w-full text-left p-2 border transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                          : 'bg-[#090d16] border-[#1e293b] text-slate-400 hover:text-slate-200 hover:bg-[#101726]'
                      }`}
                    >
                      <div className="truncate">
                        <div className="text-xs font-bold">{cam.name.split(':')[0]}</div>
                        <div className="text-[9px] text-slate-500 font-mono">
                          {FACILITY_ROOMS[cam.room]?.name || cam.room}
                        </div>
                      </div>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 border font-black uppercase ${
                          isOnline
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                            : 'bg-rose-950 text-rose-300 border-rose-500/40 animate-pulse'
                        }`}
                      >
                        {isOnline ? 'VIVO' : 'CORTE'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Monitor Feed View: Real Live CCTV Feed */}
              <div className="md:col-span-2 bg-[#020408] border-2 border-cyan-500/40 overflow-hidden flex flex-col min-h-[380px] shadow-2xl relative">
                <CctvLiveView
                  state={state}
                  camId={selectedCamId}
                  className="w-full h-full min-h-[380px]"
                />
              </div>
            </div>
          )}

          {/* TAB 2: BUNKER MAP SCHEMATIC WITH LIVE TELEMETRY */}
          {activeTab === 'map' && (
            <div className="w-full">
              <BunkerMapSchematic state={state} mode="OPERATOR" className="w-full" />
            </div>
          )}

          {/* TAB 3: HIGH-LEVEL STATUS AND INCIDENTS */}
          {activeTab === 'status' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#03060a] border border-[#1e293b] text-xs text-slate-400">
                Puesto de monitorización pasiva. Diagnóstico de potencia de los tres sectores de la instalación y registro cronológico de incidencias.
              </div>

              {/* Sector status cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {(['sector_a', 'sector_b', 'sector_c'] as const).map((sectorKey) => {
                  const sec = state.circuits[sectorKey];
                  const isPowered = sec.powered;

                  return (
                    <div
                      key={sectorKey}
                      className={`p-4 border-2 ${
                        isPowered
                          ? 'bg-[#09121a] border-cyan-500/40'
                          : 'bg-[#150a0f] border-rose-500/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-black text-slate-200">{sec.name}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 border font-black uppercase ${
                            isPowered
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                              : 'bg-rose-950 text-rose-300 border-rose-500/40 animate-pulse'
                          }`}
                        >
                          {isPowered ? 'OK' : 'CORTE'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        ESTADO:{' '}
                        <strong className={isPowered ? 'text-emerald-400' : 'text-rose-400'}>
                          {isPowered ? 'SUMINISTRO NORMAL' : 'FALLO DE RED // ACUDA A SALA ELÉCTRICA'}
                        </strong>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Alert Log */}
              <div className="bg-[#03060a] border-2 border-[#1e293b] p-3">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-2 flex items-center gap-2 border-b border-[#1e293b] pb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>REGISTRO DE INCIDENCIAS DEL BÚNKER</span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {state.alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="text-xs p-1.5 bg-[#090d16] border border-[#1e293b] flex items-center justify-between"
                    >
                      <span className="text-slate-300 font-mono">{alert.text}</span>
                      <span className="text-[9px] text-slate-500 font-mono uppercase ml-2">
                        {FACILITY_ROOMS[alert.room]?.name || alert.room}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Bar */}
        <div className="mt-3 pt-3 border-t-2 border-[#1e293b] flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>SISTEMA DE MANDO FAM-OS // SALA DE CONTROL</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1e293b] hover:bg-[#334155] border border-[#475569] text-slate-200 font-bold uppercase transition-colors cursor-pointer"
          >
            VOLVER A LA SALA [ESC]
          </button>
        </div>
      </div>
    </div>
  );
};
