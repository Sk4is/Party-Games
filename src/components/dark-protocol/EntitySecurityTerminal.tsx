/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Skull,
  Video,
  ZapOff,
  Lock,
  VolumeX,
  Eye,
  AlertTriangle,
  Play,
  Flame,
  Radio,
  Map as MapIcon,
  ShieldAlert,
} from 'lucide-react';
import { DarkProtocolGameState, CameraDefinition } from '../../types/darkProtocol';
import { FACILITY_ROOMS } from '../../data/darkProtocol/facilityMap';
import { darkProtocolAudio } from '../../utils/darkProtocolAudio';
import { CctvLiveView } from './CctvLiveView';
import { BunkerMapSchematic } from './BunkerMapSchematic';

interface EntitySecurityTerminalProps {
  state: DarkProtocolGameState;
  onUpdateState: (updater: (prev: DarkProtocolGameState) => DarkProtocolGameState) => void;
  onTriggerManifestation: () => void;
}

export const EntitySecurityTerminal: React.FC<EntitySecurityTerminalProps> = ({
  state,
  onUpdateState,
  onTriggerManifestation,
}) => {
  const [activeView, setActiveView] = useState<'cctv' | 'map'>('cctv');
  const [selectedCamId, setSelectedCamId] = useState<string>(
    state.entity.selectedCctvCameraId || 'cam_control'
  );

  const selectedCam = state.cameras[selectedCamId];
  const isSelectedCamPowered =
    selectedCam &&
    state.circuits[selectedCam.circuitId]?.powered &&
    selectedCam.state === 'ONLINE';

  const manifestationMeter = state.entity.manifestationMeter;
  const canManifest = manifestationMeter >= 100;

  // Sabotage: Cut circuit power
  const sabotageCutCircuit = (sectorKey: 'sector_a' | 'sector_b' | 'sector_c') => {
    darkProtocolAudio.playSabotageSound();
    onUpdateState((prev) => ({
      ...prev,
      circuits: {
        ...prev.circuits,
        [sectorKey]: {
          ...prev.circuits[sectorKey],
          powered: false,
        },
      },
      entity: {
        ...prev.entity,
        manifestationMeter: Math.min(100, prev.entity.manifestationMeter + 10),
      },
      alerts: [
        {
          id: 'sabotage_power_' + Date.now(),
          text: `[SABOTAJE DEL ENTE] Interrupción intencionada en ${prev.circuits[sectorKey].name}`,
          room: 'security',
          time: Date.now(),
          type: 'sabotage',
        },
        ...prev.alerts.slice(0, 8),
      ],
    }));
  };

  // Sabotage: Lock door
  const sabotageLockDoor = (doorId: string) => {
    darkProtocolAudio.playSabotageSound();
    onUpdateState((prev) => {
      const door = prev.doors[doorId];
      if (!door) return prev;
      const isLocked = !door.lockedByEntity;
      return {
        ...prev,
        doors: {
          ...prev.doors,
          [doorId]: {
            ...door,
            lockedByEntity: isLocked,
            state: isLocked ? 'LOCKED' : 'CLOSED',
          },
        },
        entity: {
          ...prev.entity,
          manifestationMeter: Math.min(100, prev.entity.manifestationMeter + 8),
        },
        alerts: [
          {
            id: 'sabotage_door_' + Date.now(),
            text: `[SABOTAJE DEL ENTE] Compuerta ${door.name} ${isLocked ? 'BLOQUEADA' : 'DESBLOQUEADA'}`,
            room: door.fromRoom,
            time: Date.now(),
            type: 'sabotage',
          },
          ...prev.alerts.slice(0, 8),
        ],
      };
    });
  };

  // Sabotage: Camera interference
  const sabotageCamera = (camId: string) => {
    darkProtocolAudio.playSabotageSound();
    onUpdateState((prev) => {
      const cam = prev.cameras[camId];
      if (!cam) return prev;
      return {
        ...prev,
        cameras: {
          ...prev.cameras,
          [camId]: {
            ...cam,
            state: 'INTERFERENCE',
          },
        },
        entity: {
          ...prev.entity,
          manifestationMeter: Math.min(100, prev.entity.manifestationMeter + 5),
        },
        alerts: [
          {
            id: 'sabotage_cam_' + Date.now(),
            text: `[SABOTAJE DEL ENTE] Señal de ${cam.name} corrompida por interferencia electromagnética`,
            room: cam.room,
            time: Date.now(),
            type: 'sabotage',
          },
          ...prev.alerts.slice(0, 8),
        ],
      };
    });
  };

  // Sabotage: False noise in room
  const triggerFalseNoise = (roomId: string) => {
    darkProtocolAudio.playAlarmBeep();
    onUpdateState((prev) => ({
      ...prev,
      alerts: [
        {
          id: 'fake_noise_' + Date.now(),
          text: `[ECO DEL ENTE] Sonido anómalo y golpes metálicos en ${FACILITY_ROOMS[roomId]?.name}`,
          room: roomId,
          time: Date.now(),
          type: 'sabotage',
        },
        ...prev.alerts.slice(0, 8),
      ],
      entity: {
        ...prev.entity,
        manifestationMeter: Math.min(100, prev.entity.manifestationMeter + 5),
      },
    }));
  };

  return (
    <div className="relative w-full min-h-screen bg-[#06020c] text-purple-100 font-mono p-4 sm:p-6 flex flex-col justify-between overflow-x-hidden select-none">
      {/* Background CRT scanlines & dark red vignette */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(147,51,234,0.03)_50%,rgba(0,0,0,0.5)_50%)] bg-[length:100%_4px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(88,28,135,0.18),rgba(3,1,7,0.96)_80%)] pointer-events-none" />

      {/* Top Bar: Corrupted Network Header & Manifestation Reservoir */}
      <div className="relative z-10 max-w-6xl mx-auto w-full mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#0a0314] border-2 border-purple-500/40 shadow-[0_0_50px_rgba(168,85,247,0.18)]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-950 border-2 border-purple-500/60 flex items-center justify-center text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.35)]">
              <Skull className="w-7 h-7 animate-pulse text-rose-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className="text-sm font-black text-white tracking-widest uppercase"
                  style={{ fontFamily: "'Silkscreen', monospace" }}
                >
                  RED CORROMPIDA DE SEGURIDAD // ENTE
                </span>
                <span className="text-[9px] px-1.5 py-0.5 bg-purple-950 text-rose-300 border border-purple-500/40 uppercase font-bold">
                  CONTROL ASIMÉTRICO
                </span>
              </div>
              <p className="text-xs text-purple-300/80">
                Intercepta comunicaciones, corta suministros, genera psicofonías y prepárate para la cacería
              </p>
            </div>
          </div>

          {/* Manifestation Bar & Trigger */}
          <div className="flex items-center gap-3">
            <div className="w-48 sm:w-64 bg-black/80 border-2 border-purple-500/40 p-2">
              <div className="flex justify-between text-[11px] font-bold mb-1">
                <span className="text-purple-300 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" /> CONDENSACIÓN ECTOPLÁSMICA
                </span>
                <span className={canManifest ? 'text-rose-400 animate-pulse font-black' : 'text-purple-300'}>
                  {manifestationMeter}%
                </span>
              </div>
              <div className="w-full h-3 bg-purple-950/80 overflow-hidden border border-purple-500/30">
                <div
                  className={`h-full transition-all duration-300 ${
                    canManifest
                      ? 'bg-gradient-to-r from-purple-500 via-rose-500 to-amber-400 shadow-[0_0_15px_#f43f5e]'
                      : 'bg-purple-600'
                  }`}
                  style={{ width: `${manifestationMeter}%` }}
                />
              </div>
            </div>

            <button
              type="button"
              disabled={!canManifest}
              onClick={onTriggerManifestation}
              className={`px-4 py-2.5 font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer border-b-4 ${
                canManifest
                  ? 'bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white border-rose-950 shadow-[0_0_30px_rgba(244,63,94,0.7)] animate-bounce active:scale-95'
                  : 'bg-purple-950/30 border-purple-900/40 text-purple-600 cursor-not-allowed'
              }`}
            >
              <Skull className="w-4 h-4" />
              <span>{canManifest ? 'MANIFESTARSE [CAZA]' : 'CONDENSANDO'}</span>
            </button>
          </div>
        </div>

        {/* View Switcher: CCTV vs Tactical Bunker Map */}
        <div className="flex gap-2 mt-3">
          <button
            type="button"
            onClick={() => {
              darkProtocolAudio.playSwitchClick();
              setActiveView('cctv');
            }}
            className={`px-4 py-2 text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
              activeView === 'cctv'
                ? 'bg-purple-950 text-purple-200 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                : 'bg-[#0a0314] text-purple-400 hover:text-white border-purple-500/20'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>VÍDEO CCTV INTERCEPTADO</span>
          </button>

          <button
            type="button"
            onClick={() => {
              darkProtocolAudio.playSwitchClick();
              setActiveView('map');
            }}
            className={`px-4 py-2 text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
              activeView === 'map'
                ? 'bg-purple-950 text-purple-200 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                : 'bg-[#0a0314] text-purple-400 hover:text-white border-purple-500/20'
            }`}
          >
            <MapIcon className="w-4 h-4" />
            <span>RADAR TOPOLÓGICO (SNAPSHOTS 15s)</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Surveillance / Radar + Sabotage Deck */}
      <div className="relative z-10 max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-5 flex-1 mb-5">
        {/* Left Column: CCTV Monitor OR Tactical Map */}
        <div className="lg:col-span-2 space-y-3">
          {activeView === 'cctv' ? (
            <>
              {/* Main Feed Screen: Real Live Intercepted CCTV */}
              <div className="relative aspect-video bg-[#030106] border-2 border-purple-500/50 overflow-hidden shadow-2xl">
                <CctvLiveView
                  state={state}
                  camId={selectedCamId}
                  className="w-full h-full"
                />
              </div>

              {/* Camera Buttons Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                      className={`p-2.5 border text-xs font-bold text-left transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-purple-900/60 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                          : 'bg-[#0a0314] border-purple-500/20 text-purple-300 hover:bg-purple-900/30'
                      }`}
                    >
                      <span className="truncate">{cam.name.split(':')[0]}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 border font-black ${
                          isOnline
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                            : 'bg-rose-950 text-rose-300 border-rose-500/40'
                        }`}
                      >
                        {isOnline ? 'OK' : 'OFF'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="w-full">
              <BunkerMapSchematic
                state={state}
                mode="ENTITY"
                onSelectRoom={(roomId) => triggerFalseNoise(roomId)}
                className="w-full"
              />
            </div>
          )}
        </div>

        {/* Right Column: Sabotage Deck & Interventions */}
        <div className="space-y-4">
          {/* Sabotage Panel: Power Cut */}
          <div className="p-4 bg-[#0a0314] border-2 border-purple-500/30 space-y-3">
            <div className="flex items-center gap-2 text-rose-400 text-xs font-bold border-b border-purple-500/20 pb-2">
              <ZapOff className="w-4 h-4" />
              <span>SABOTAJE DEL SUMINISTRO ELÉCTRICO</span>
            </div>

            <p className="text-[11px] text-purple-300/80 leading-snug">
              Corta el suministro eléctrico de un sector para apagar sus luces, cámaras y mecanismos:
            </p>

            <div className="space-y-2">
              {(['sector_a', 'sector_b', 'sector_c'] as const).map((sectorKey) => {
                const sec = state.circuits[sectorKey];
                const isPowered = sec.powered;

                return (
                  <button
                    key={sectorKey}
                    type="button"
                    disabled={!isPowered}
                    onClick={() => sabotageCutCircuit(sectorKey)}
                    className={`w-full p-2.5 border text-xs font-bold text-left flex items-center justify-between transition-all ${
                      isPowered
                        ? 'bg-purple-900/40 hover:bg-rose-950/80 border-purple-500/40 hover:border-rose-500 text-purple-200 hover:text-rose-200 cursor-pointer active:scale-98'
                        : 'bg-black/40 border-white/5 text-purple-700 cursor-not-allowed'
                    }`}
                  >
                    <span>CORTAR {sec.name.split(':')[0]}</span>
                    <span className="text-[10px] text-purple-400 font-normal">
                      {isPowered ? '⚡ ENERGIZADO' : '⚡ APAGADO'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Door Jamming & Sound Distractions */}
          <div className="p-4 bg-[#0a0314] border-2 border-purple-500/30 space-y-3">
            <div className="flex items-center gap-2 text-purple-300 text-xs font-bold border-b border-purple-500/20 pb-2">
              <Lock className="w-4 h-4" />
              <span>BLOQUEO DE PUERTAS Y DISTRACCIONES</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => sabotageLockDoor('door_control_security')}
                className="p-2 bg-purple-900/30 hover:bg-purple-800/40 border border-purple-500/30 text-xs text-purple-200 font-bold text-center transition-colors cursor-pointer"
              >
                BLOQUEAR ACCESO A SEGURIDAD
              </button>
              <button
                type="button"
                onClick={() => sabotageLockDoor('door_lab_generators')}
                className="p-2 bg-purple-900/30 hover:bg-purple-800/40 border border-purple-500/30 text-xs text-purple-200 font-bold text-center transition-colors cursor-pointer"
              >
                BLOQUEAR COMPUERTA GENERADORES
              </button>
              <button
                type="button"
                onClick={() => triggerFalseNoise('laboratory')}
                className="p-2 bg-purple-900/30 hover:bg-purple-800/40 border border-purple-500/30 text-xs text-purple-200 font-bold text-center transition-colors cursor-pointer"
              >
                ECO ANÓMALO: LABORATORIO
              </button>
              <button
                type="button"
                onClick={() => triggerFalseNoise('maintenance')}
                className="p-2 bg-purple-900/30 hover:bg-purple-800/40 border border-purple-500/30 text-xs text-purple-200 font-bold text-center transition-colors cursor-pointer"
              >
                ECO ANÓMALO: MANTENIMIENTO
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Alert Log */}
      <div className="relative z-10 max-w-6xl mx-auto w-full p-3 bg-[#0a0314] border-2 border-purple-500/20 text-xs text-purple-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <span className="font-bold flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          <span>ÚLTIMA ACTIVIDAD: {state.alerts[0]?.text || 'Instalación en calma.'}</span>
        </span>
        <span className="text-[10px] text-purple-400">
          Usa F1 / F2 para alternar entre Explorador y Operador en este test
        </span>
      </div>
    </div>
  );
};
