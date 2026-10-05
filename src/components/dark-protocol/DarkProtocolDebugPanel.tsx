/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Wrench,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Zap,
  ZapOff,
  Flame,
  Heart,
  Eye,
  MapPin,
  Camera,
} from 'lucide-react';
import {
  DarkProtocolGameState,
  DarkProtocolRole,
  HealthState,
} from '../../types/darkProtocol';
import { FACILITY_ROOMS } from '../../data/darkProtocol/facilityMap';
import { RendererDebugOptions } from './renderer/engine';
import { darkProtocolAudio } from '../../utils/darkProtocolAudio';

interface DarkProtocolDebugPanelProps {
  state: DarkProtocolGameState;
  onUpdateState: (updater: (prev: DarkProtocolGameState) => DarkProtocolGameState) => void;
  onRoleSwitch: (role: DarkProtocolRole) => void;
  onTeleport: (roomId: string) => void;
  debugOptions: RendererDebugOptions;
  onUpdateDebugOptions: (updater: (prev: RendererDebugOptions) => RendererDebugOptions) => void;
  onResetObjectives: () => void;
}

export const DarkProtocolDebugPanel: React.FC<DarkProtocolDebugPanelProps> = ({
  state,
  onUpdateState,
  onRoleSwitch,
  onTeleport,
  debugOptions,
  onUpdateDebugOptions,
  onResetObjectives,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSector = (sectorKey: 'sector_a' | 'sector_b' | 'sector_c') => {
    darkProtocolAudio.playSwitchClick();
    onUpdateState((prev) => ({
      ...prev,
      circuits: {
        ...prev.circuits,
        [sectorKey]: {
          ...prev.circuits[sectorKey],
          powered: !prev.circuits[sectorKey].powered,
        },
      },
    }));
  };

  const setHealth = (h: HealthState) => {
    darkProtocolAudio.playSwitchClick();
    onUpdateState((prev) => ({
      ...prev,
      explorer: {
        ...prev.explorer,
        health: h,
      },
    }));
  };

  const adjustManifestation = (val: number) => {
    darkProtocolAudio.playSwitchClick();
    onUpdateState((prev) => ({
      ...prev,
      entity: {
        ...prev.entity,
        manifestationMeter: Math.max(0, Math.min(100, val)),
      },
    }));
  };

  const triggerManifestationNow = () => {
    darkProtocolAudio.playEntityManifestation();
    onUpdateState((prev) => ({
      ...prev,
      entity: {
        ...prev.entity,
        isManifested: true,
        manifestationTimeRemaining: 50,
        searchCharges: 2,
        manifestationMeter: 100,
        room: prev.activeRoom,
      },
      alerts: [
        {
          id: 'debug_manifest_' + Date.now(),
          text: 'MANIFESTACIÓN FORZADA DESDE PANEL DE DEBUG',
          room: prev.activeRoom,
          time: Date.now(),
          type: 'alarm',
        },
        ...prev.alerts.slice(0, 8),
      ],
    }));
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 font-mono text-xs select-none">
      {/* Discreet toggle button */}
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-amber-400 border border-amber-500/30 shadow-lg backdrop-blur-md flex items-center gap-2 cursor-pointer transition-all active:scale-95"
        >
          <Wrench className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-bold">MODO PRUEBA // DEBUG</span>
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      ) : (
        <div className="w-80 rounded-2xl bg-[#090d16]/95 border border-amber-500/40 p-4 shadow-2xl backdrop-blur-md text-slate-200 space-y-3.5 max-h-[85vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <Wrench className="w-4 h-4" /> PANEL DE PRUEBA / DEV
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* 1. Role Switcher */}
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase mb-1.5">
              CAMBIO DE ROL (1 ESTADO COMPARTIDO)
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {(['EXPLORADOR', 'OPERADOR', 'ENTE'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => onRoleSwitch(r)}
                  className={`py-1.5 rounded-lg text-[10px] font-black border transition-all ${
                    state.activeRole === r
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-900 border-white/10 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Teleport to Room */}
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase mb-1.5 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-cyan-400" /> TELETRANSPORTE A SALA
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.values(FACILITY_ROOMS).map((rm) => (
                <button
                  key={rm.id}
                  type="button"
                  onClick={() => onTeleport(rm.id)}
                  className={`py-1 px-1.5 rounded text-[10px] font-bold text-left truncate border transition-all ${
                    state.activeRoom === rm.id
                      ? 'bg-cyan-950 border-cyan-400 text-cyan-300'
                      : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white'
                  }`}
                >
                  {rm.name}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Electrical Sector Breakers */}
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase mb-1.5 flex items-center gap-1">
              <Zap className="w-3 h-3 text-yellow-400" /> CORRIENTE POR SECTOR
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {(['sector_a', 'sector_b', 'sector_c'] as const).map((secKey) => {
                const isP = state.circuits[secKey].powered;
                return (
                  <button
                    key={secKey}
                    type="button"
                    onClick={() => toggleSector(secKey)}
                    className={`py-1 rounded text-[10px] font-bold border transition-colors ${
                      isP
                        ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-950/80 border-rose-500/40 text-rose-300'
                    }`}
                  >
                    {secKey.split('_')[1].toUpperCase()}: {isP ? 'ON' : 'OFF'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Manifestation Controls */}
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase mb-1.5 flex items-center gap-1">
              <Flame className="w-3 h-3 text-rose-400" /> MEDIDOR DE MANIFESTACIÓN
            </div>
            <div className="flex items-center gap-1.5 mb-1.5">
              <button
                type="button"
                onClick={() => adjustManifestation(0)}
                className="flex-1 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-white/10 text-[10px]"
              >
                0%
              </button>
              <button
                type="button"
                onClick={() => adjustManifestation(50)}
                className="flex-1 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-white/10 text-[10px]"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => adjustManifestation(100)}
                className="flex-1 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-white/10 text-[10px] text-amber-300 font-bold"
              >
                100%
              </button>
            </div>
            <button
              type="button"
              onClick={triggerManifestationNow}
              className="w-full py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-black text-[10px] uppercase tracking-wider transition-colors shadow-sm"
            >
              FORZAR MANIFESTACIÓN FÍSICA INMEDIATA
            </button>
          </div>

          {/* 5. Health Control */}
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase mb-1.5 flex items-center gap-1">
              <Heart className="w-3 h-3 text-rose-400" /> SALUD DEL EXPLORADOR
            </div>
            <div className="grid grid-cols-4 gap-1">
              {(['SANO', 'HERIDO', 'AGONIZANDO', 'MUERTO'] as const).map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHealth(h)}
                  className={`py-1 rounded text-[9px] font-bold border transition-colors ${
                    state.explorer.health === h
                      ? 'bg-rose-950 border-rose-400 text-white'
                      : 'bg-slate-900 border-white/10 text-slate-400'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>

          {/* 6. Visual Debug Overlays */}
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase mb-1.5 flex items-center gap-1">
              <Eye className="w-3 h-3 text-cyan-400" /> CAPAS DE DEPURACIÓN VISUAL
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <label className="flex items-center gap-1.5 text-[10px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={debugOptions.showInteractionZones}
                  onChange={(e) =>
                    onUpdateDebugOptions((prev) => ({
                      ...prev,
                      showInteractionZones: e.target.checked,
                    }))
                  }
                  className="rounded"
                />
                <span>Zonas Interacción</span>
              </label>
              <label className="flex items-center gap-1.5 text-[10px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={debugOptions.showCameraFOV}
                  onChange={(e) =>
                    onUpdateDebugOptions((prev) => ({
                      ...prev,
                      showCameraFOV: e.target.checked,
                    }))
                  }
                  className="rounded"
                />
                <span>Conos CCTV</span>
              </label>
              <label className="flex items-center gap-1.5 text-[10px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={debugOptions.showLightBounds}
                  onChange={(e) =>
                    onUpdateDebugOptions((prev) => ({
                      ...prev,
                      showLightBounds: e.target.checked,
                    }))
                  }
                  className="rounded"
                />
                <span>Radios de Luz</span>
              </label>
            </div>
          </div>

          {/* 7. Reset Objectives */}
          <div className="pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onResetObjectives}
              className="w-full py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-white/10 text-slate-300 text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> REINICIAR OBJETIVOS DE PRUEBA
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
