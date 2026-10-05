/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Heart,
  Flashlight,
  Zap,
  ListTodo,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Skull,
  Eye,
  LogOut,
  Radio,
  Flame,
  UserCheck,
  FolderOpen,
} from 'lucide-react';
import {
  DarkProtocolGameState,
  DarkProtocolRole,
} from '../../types/darkProtocol';
import { InteractionPromptTarget } from './renderer/engine';
import { FACILITY_ROOMS } from '../../data/darkProtocol/facilityMap';
import { getCharacterById } from '../../data/darkProtocol/characters';
import { darkProtocolAudio } from '../../utils/darkProtocolAudio';

interface DarkProtocolHudProps {
  state: DarkProtocolGameState;
  interactPrompt: InteractionPromptTarget | null;
  onRoleSwitch: (role: DarkProtocolRole) => void;
  onBackToMenu: () => void;
  onToggleFlashlight: () => void;
  onOpenCharacterSelect?: () => void;
}

export const DarkProtocolHud: React.FC<DarkProtocolHudProps> = ({
  state,
  interactPrompt,
  onRoleSwitch,
  onBackToMenu,
  onToggleFlashlight,
  onOpenCharacterSelect,
}) => {
  const [showObjectives, setShowObjectives] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const room = FACILITY_ROOMS[state.activeRoom] || FACILITY_ROOMS.control_room;
  const isPowered = Boolean(state.circuits[room.sector]?.powered);
  const character = getCharacterById(state.selectedCharacterId);

  const toggleSound = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    darkProtocolAudio.setMuted(nextMuted);
  };

  const completedCount = state.objectives.filter((o) => o.completed).length;

  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex flex-col justify-between p-4 font-mono select-none">
      {/* =====================================================================
          TOP BAR: ROLE BADGE + ROOM + CHARACTER DOSSIER + OBJECTIVES + CONTROLS
          ===================================================================== */}
      <div className="pointer-events-auto flex items-center justify-between gap-3 flex-wrap">
        {/* Left: Role & Room & Character */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Role Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/90 border border-white/10 backdrop-blur-md shadow-lg text-xs font-bold">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                state.activeRole === 'EXPLORADOR'
                  ? 'bg-amber-400'
                  : state.activeRole === 'OPERADOR'
                  ? 'bg-cyan-400'
                  : 'bg-purple-500'
              } animate-pulse`}
            />
            <span className="text-white tracking-wider">
              {state.activeRole}
            </span>
          </div>

          {/* Current Room & Sector Power Status */}
          <div className="px-3.5 py-1.5 rounded-xl bg-slate-950/90 border border-white/10 backdrop-blur-md shadow-lg flex items-center gap-2 text-xs">
            <span className="font-bold text-white tracking-wide">
              {room.name}
            </span>
            <span className="text-[10px] text-slate-400">
              // {state.circuits[room.sector]?.name.split(':')[0]}
            </span>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded font-black ${
                isPowered
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-950 text-rose-300 border border-rose-500/30 animate-pulse'
              }`}
            >
              {isPowered ? '⚡ ENERGIZADO' : '⚡ CORTE'}
            </span>
          </div>

          {/* Character Dossier Badge & Change Button */}
          {state.activeRole === 'EXPLORADOR' && onOpenCharacterSelect && (
            <button
              type="button"
              onClick={onOpenCharacterSelect}
              className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-white/10 hover:border-cyan-500/50 backdrop-blur-md shadow-lg flex items-center gap-2 text-xs transition-colors cursor-pointer"
              title="Cambiar expediente de superviviente"
            >
              <span className="text-sm">{character.portraitIcon}</span>
              <span className="font-bold text-slate-200">{character.name}</span>
              <span className="text-[10px] text-cyan-400 hidden sm:inline">
                [{character.role}]
              </span>
            </button>
          )}
        </div>

        {/* Right: Role Quick Switchers (F1/F2/F3) + Objectives Toggle + Sound + Exit */}
        <div className="flex items-center gap-2">
          {/* Quick Role Switcher Buttons */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-950/90 p-1 rounded-xl border border-white/10 backdrop-blur-md">
            <button
              type="button"
              onClick={() => onRoleSwitch('EXPLORADOR')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider transition-colors cursor-pointer ${
                state.activeRole === 'EXPLORADOR'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              F1 EXPLORADOR
            </button>
            <button
              type="button"
              onClick={() => onRoleSwitch('OPERADOR')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider transition-colors cursor-pointer ${
                state.activeRole === 'OPERADOR'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              F2 OPERADOR
            </button>
            <button
              type="button"
              onClick={() => onRoleSwitch('ENTE')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider transition-colors cursor-pointer ${
                state.activeRole === 'ENTE'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              F3 ENTE
            </button>
          </div>

          {/* Objectives Drawer Toggle */}
          <button
            type="button"
            onClick={() => setShowObjectives(!showObjectives)}
            className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-xs font-bold flex items-center gap-2 border border-white/10 transition-colors cursor-pointer"
          >
            <ListTodo className="w-4 h-4 text-cyan-400" />
            <span className="hidden md:inline">Objetivos</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              {completedCount}/{state.objectives.length}
            </span>
            {showObjectives ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            className="p-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-white/10 transition-colors cursor-pointer"
            title={isMuted ? 'Activar sonido' : 'Silenciar'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Back to FAM2PLAY Menu */}
          <button
            type="button"
            onClick={onBackToMenu}
            className="p-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
            title="Salir al menú principal de FAM2PLAY"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Objectives Popover Panel (Clean Redesign) */}
      {showObjectives && (
        <div className="pointer-events-auto mt-2 self-end w-full max-w-sm rounded-2xl bg-[#090b14]/95 border border-cyan-500/30 p-4 text-xs shadow-2xl backdrop-blur-md z-50 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
            <span className="font-bold text-white tracking-wider flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-cyan-400" /> PROTOCOLO DE INCIDENCIAS
            </span>
            <span className="text-[10px] font-black text-cyan-400">
              {completedCount} / {state.objectives.length} HECHO
            </span>
          </div>

          <div className="space-y-2.5 max-h-[60vh] overflow-y-auto">
            {state.objectives.map((obj) => (
              <div
                key={obj.id}
                className={`p-3 rounded-xl border transition-all ${
                  obj.completed
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                    : 'bg-slate-900/80 border-white/10 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between font-bold mb-1">
                  <span className="flex items-center gap-1.5">
                    <span className="text-cyan-400 font-mono">0{obj.number}.</span>
                    <span>{obj.title}</span>
                  </span>
                  {obj.completed ? (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 font-black">
                      ✓ RESUELTO
                    </span>
                  ) : (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30 font-bold">
                      ACTIVO
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 leading-snug mb-1">
                  {obj.description}
                </div>
                <div className="text-[9px] text-slate-500 font-mono">
                  SALA: <span className="text-slate-300 font-bold">{FACILITY_ROOMS[obj.room]?.name || obj.room}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          DIEGETIC CONTEXTUAL INTERACTION PROMPT
          Directly positioned in world/screen space at (screenX, screenY)
          ===================================================================== */}
      {!state.explorer.isHiding && interactPrompt && (
        <div
          className="pointer-events-none absolute z-30 transform -translate-x-1/2 -translate-y-full transition-all duration-150 flex flex-col items-center select-none"
          style={{
            left: `${Math.round(interactPrompt.screenX)}px`,
            top: `${Math.round(interactPrompt.screenY - 10)}px`,
          }}
        >
          <div className="pointer-events-auto px-3 py-1.5 rounded-xl bg-slate-950/95 border border-cyan-400/60 shadow-[0_0_25px_rgba(6,182,212,0.45)] backdrop-blur-md flex items-center gap-2.5 text-xs">
            <span className="w-5 h-5 rounded-md bg-cyan-400 text-slate-950 font-black text-[11px] flex items-center justify-center shadow-md">
              E
            </span>
            <span className="font-bold text-white tracking-wider uppercase text-[11px]">
              {interactPrompt.actionText}
            </span>
          </div>
          <div className="text-[9px] font-mono font-bold text-cyan-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] mt-1 tracking-tight">
            {interactPrompt.name}
          </div>
        </div>
      )}

      {/* =====================================================================
          CENTER: HIDING BANNER OR PHYSICAL MANIFESTATION
          ===================================================================== */}
      <div className="self-center">
        {/* If Hiding in locker / desk / duct */}
        {state.explorer.isHiding && (
          <div className="pointer-events-auto px-6 py-3 rounded-2xl bg-slate-950/95 border border-amber-500/70 shadow-[0_0_35px_rgba(245,158,11,0.35)] backdrop-blur-md flex items-center gap-3 animate-pulse">
            <Eye className="w-5 h-5 text-amber-400" />
            <div className="text-center">
              <div className="text-xs font-black text-amber-300 tracking-wider">
                ESCONDITE ACTIVO
              </div>
              <div className="text-[11px] text-slate-300">
                Límite de contención: <span className="font-bold text-white">{Math.ceil(state.explorer.hideTimeRemaining)}s</span> &bull; Pulsa <span className="text-amber-400 font-bold">[E]</span> para salir
              </div>
            </div>
          </div>
        )}

        {/* If Manifested Entity */}
        {state.activeRole === 'ENTE' && state.entity.isManifested && (
          <div className="pointer-events-auto px-6 py-3 rounded-2xl bg-purple-950/95 border border-purple-500/70 shadow-[0_0_35px_rgba(168,85,247,0.45)] backdrop-blur-md flex items-center gap-3 animate-pulse">
            <Flame className="w-5 h-5 text-rose-400" />
            <div className="text-center">
              <div className="text-xs font-black text-rose-300 tracking-wider">
                MANIFESTACIÓN FÍSICA // {Math.ceil(state.entity.manifestationTimeRemaining)}s
              </div>
              <div className="text-[11px] text-purple-200">
                Cargas de búsqueda en escondites: <span className="font-bold text-white">{state.entity.searchCharges}</span> &bull; Clic cerca del superviviente para atacar
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================================
          BOTTOM BAR: HEALTH + FLASHLIGHT + CONTROLS HELPER
          ===================================================================== */}
      <div className="pointer-events-auto flex items-end justify-between gap-4 flex-wrap">
        {/* Left: Survivor Health & Flashlight (if Explorer) */}
        {state.activeRole === 'EXPLORADOR' ? (
          <div className="flex items-center gap-3">
            {/* Health Meter */}
            <div className="px-3.5 py-2 rounded-2xl bg-slate-950/90 border border-white/10 backdrop-blur-md shadow-lg flex items-center gap-2.5">
              <Heart
                className={`w-4 h-4 ${
                  state.explorer.health === 'SANO'
                    ? 'text-emerald-400'
                    : state.explorer.health === 'HERIDO'
                    ? 'text-amber-400 animate-pulse'
                    : 'text-rose-500 animate-ping'
                }`}
              />
              <div>
                <div className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">
                  ESTADO FÍSICO
                </div>
                <div
                  className={`text-xs font-black tracking-wider ${
                    state.explorer.health === 'SANO'
                      ? 'text-emerald-400'
                      : state.explorer.health === 'HERIDO'
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {state.explorer.health}
                </div>
              </div>
            </div>

            {/* Flashlight toggle */}
            <button
              type="button"
              onClick={onToggleFlashlight}
              className={`px-3.5 py-2 rounded-2xl border backdrop-blur-md shadow-lg flex items-center gap-2 transition-all cursor-pointer ${
                state.explorer.flashlightOn
                  ? 'bg-amber-950/80 border-amber-400/50 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                  : 'bg-slate-950/80 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <Flashlight className="w-4 h-4" />
              <div className="text-left">
                <div className="text-[9px] uppercase tracking-widest font-bold">
                  LINTERNA [F]
                </div>
                <div className="text-xs font-bold">
                  {state.explorer.flashlightOn ? 'ENCENDIDA' : 'APAGADA'}
                </div>
              </div>
            </button>
          </div>
        ) : (
          <div className="text-xs text-slate-300 px-3.5 py-2 rounded-2xl bg-slate-950/90 border border-white/10 backdrop-blur-md flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Rol Activo: <strong className="text-white">{state.activeRole}</strong></span>
          </div>
        )}

        {/* Right: Keybinds Helper */}
        <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-400 bg-slate-950/90 px-3.5 py-2 rounded-2xl border border-white/10 backdrop-blur-md shadow-lg">
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200 font-bold">A</kbd>/<kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200 font-bold">D</kbd> Mover</span>
          <span>&bull;</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200 font-bold">SHIFT</kbd> Correr</span>
          <span>&bull;</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200 font-bold">E</kbd> Interactuar</span>
          <span>&bull;</span>
          <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-200 font-bold">F</kbd> Linterna</span>
        </div>
      </div>
    </div>
  );
};
