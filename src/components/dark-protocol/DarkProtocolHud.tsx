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
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Skull,
  Eye,
  LogOut,
  Radio,
  Flame,
  UserCheck,
  FolderOpen,
  Info,
} from 'lucide-react';
import {
  DarkProtocolGameState,
  DarkProtocolRole,
  Objective,
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
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<string | null>(null);
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
    <div className="pointer-events-none absolute inset-0 z-40 flex flex-col justify-between p-3 sm:p-4 font-mono select-none overflow-hidden">
      {/* =====================================================================
          TOP BAR: TECHNICAL TACTICAL OSD + CONTROLS
          ===================================================================== */}
      <div className="pointer-events-auto flex items-center justify-between gap-2.5 flex-wrap">
        {/* Left: Role & Room & Character Dossier Badge */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Active Role Industrial Badge */}
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-950/95 border-2 border-slate-700 shadow-md text-xs font-bold">
            <span
              className={`w-2.5 h-2.5 ${
                state.activeRole === 'EXPLORADOR'
                  ? 'bg-amber-400'
                  : state.activeRole === 'OPERADOR'
                  ? 'bg-cyan-400'
                  : 'bg-purple-500'
              } animate-pulse`}
            />
            <span
              className="text-white tracking-widest uppercase font-black dp-font-display"
            >
              [{state.activeRole}]
            </span>
          </div>

          {/* Current Room & Sector Power Status */}
          <div className="px-3 py-1 bg-slate-950/95 border-2 border-slate-700 shadow-md flex items-center gap-2 text-xs">
            <span className="font-bold text-white tracking-wide uppercase dp-font-ui">
              {room.name}
            </span>
            <span className="text-[10px] text-slate-400 dp-font-data">
              // {state.circuits[room.sector]?.name.split(':')[0]}
            </span>
            <span
              className={`text-[9px] px-1.5 py-0.5 border font-black uppercase dp-font-display ${
                isPowered
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                  : 'bg-rose-950 text-rose-300 border-rose-500/50 animate-pulse'
              }`}
            >
              {isPowered ? '⚡ ENERGÍA' : '⚡ CORTE'}
            </span>
          </div>

          {/* Character Dossier Badge & Switcher */}
          {state.activeRole === 'EXPLORADOR' && onOpenCharacterSelect && (
            <button
              type="button"
              onClick={onOpenCharacterSelect}
              className="px-3 py-1 bg-slate-900/95 hover:bg-slate-800 border-2 border-cyan-500/40 hover:border-cyan-400 shadow-md flex items-center gap-2 text-xs transition-colors cursor-pointer"
              title="Cambiar expediente de superviviente"
            >
              <span className="text-sm">{character.portraitIcon}</span>
              <span className="font-bold text-slate-200">{character.name}</span>
              <span className="text-[10px] text-cyan-400 hidden sm:inline font-mono">
                [{character.role}]
              </span>
            </button>
          )}
        </div>

        {/* Right: Quick Role Switchers + Objectives Toggle Button + Sound + Exit */}
        <div className="flex items-center gap-2">
          {/* Quick Role Switchers (F1/F2/F3) */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-950/95 p-1 border-2 border-slate-700">
            <button
              type="button"
              onClick={() => onRoleSwitch('EXPLORADOR')}
              className={`px-2 py-0.5 text-[10px] font-black tracking-wider transition-colors cursor-pointer ${
                state.activeRole === 'EXPLORADOR'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              F1 EXPLORADOR
            </button>
            <button
              type="button"
              onClick={() => onRoleSwitch('OPERADOR')}
              className={`px-2 py-0.5 text-[10px] font-black tracking-wider transition-colors cursor-pointer ${
                state.activeRole === 'OPERADOR'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              F2 OPERADOR
            </button>
            <button
              type="button"
              onClick={() => onRoleSwitch('ENTE')}
              className={`px-2 py-0.5 text-[10px] font-black tracking-wider transition-colors cursor-pointer ${
                state.activeRole === 'ENTE'
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              F3 ENTE
            </button>
          </div>

          {/* Compact Objectives Slide Trigger (Movement ALWAYS works while open!) */}
          <button
            type="button"
            onClick={() => {
              darkProtocolAudio.playSwitchClick();
              setShowObjectives(!showObjectives);
            }}
            className={`px-3 py-1 text-xs font-bold flex items-center gap-2 border-2 transition-all cursor-pointer ${
              showObjectives
                ? 'bg-cyan-950 text-cyan-300 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                : 'bg-slate-950/95 text-slate-300 border-slate-700 hover:border-cyan-500'
            }`}
          >
            <ListTodo className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline font-bold">PROTOCOLO</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-cyan-950 text-cyan-300 border border-cyan-500/40">
              {completedCount}/{state.objectives.length}
            </span>
            {showObjectives ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>

          {/* Sound Toggle */}
          <button
            type="button"
            onClick={toggleSound}
            className="p-1.5 bg-slate-950/95 hover:bg-slate-900 text-slate-300 border-2 border-slate-700 transition-colors cursor-pointer"
            title={isMuted ? 'Activar sonido' : 'Silenciar'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Back to FAM2PLAY Menu */}
          <button
            type="button"
            onClick={onBackToMenu}
            className="p-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border-2 border-rose-600/50 transition-colors cursor-pointer"
            title="Salir al menú principal de FAM2PLAY"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* =====================================================================
          SLIDING MISSION LOG ON THE RIGHT (MOVEMENT ALLOWED WHILE OPEN!)
          Non-blocking compact side drawer with technical rows
          ===================================================================== */}
      {showObjectives && (
        <div className="pointer-events-auto absolute right-3 top-16 w-80 sm:w-96 bg-[#040810]/95 border-2 border-cyan-500/50 p-3.5 text-xs shadow-[0_0_40px_rgba(0,0,0,0.85)] z-30 dp-panel-slide-in">
          <div className="flex items-center justify-between border-b-2 border-cyan-500/30 pb-2 mb-2.5">
            <span
              className="font-bold text-white tracking-wider flex items-center gap-1.5 uppercase dp-font-display"
            >
              <ListTodo className="w-4 h-4 text-cyan-400" /> PROTOCOLO DE INCIDENCIAS
            </span>
            <span className="text-[10px] font-black text-cyan-400 dp-font-data">
              {completedCount} / {state.objectives.length} HECHO
            </span>
          </div>

          <div className="space-y-1.5 max-h-[62vh] overflow-y-auto pr-1">
            {state.objectives.map((obj) => {
              const isSelected = selectedObjectiveId === obj.id;
              const roomDef = FACILITY_ROOMS[obj.room];

              return (
                <div
                  key={obj.id}
                  onClick={() => {
                    darkProtocolAudio.playSwitchClick();
                    setSelectedObjectiveId(isSelected ? null : obj.id);
                  }}
                  className={`p-2 border-2 transition-all cursor-pointer ${
                    obj.completed
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                      : obj.status === 'ACTIVO'
                      ? 'bg-cyan-950/40 border-cyan-400 text-cyan-100 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                      : obj.status === 'BLOQUEADO'
                      ? 'bg-[#0a0508] border-rose-950 text-slate-500'
                      : 'bg-[#080d16] border-[#1e293b] text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-[11px] mb-0.5">
                    <span className="flex items-center gap-1.5 truncate dp-font-ui">
                      <span className="text-cyan-400 dp-font-data font-black">0{obj.number}.</span>
                      <span className="truncate">{obj.title}</span>
                    </span>

                    {obj.completed ? (
                      <span className="text-[8px] px-1 py-0.2 bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-black dp-font-display">
                        [X] RESUELTO
                      </span>
                    ) : obj.status === 'ACTIVO' ? (
                      <span className="text-[8px] px-1 py-0.2 bg-amber-950 text-amber-300 border border-amber-500/40 font-bold animate-pulse dp-font-display">
                        ● ACTIVO
                      </span>
                    ) : obj.status === 'BLOQUEADO' ? (
                      <span className="text-[8px] px-1 py-0.2 bg-rose-950 text-rose-400 border border-rose-900 dp-font-display">
                        ✕ BLOQUEADO
                      </span>
                    ) : (
                      <span className="text-[8px] px-1 py-0.2 bg-slate-900 text-slate-400 border border-slate-700 dp-font-display">
                        ○ {obj.status}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[9px] text-slate-400 dp-font-data">
                    <span>SALA: <strong className="text-white">{roomDef?.name || obj.room}</strong></span>
                    <span className="text-cyan-400/80">{isSelected ? 'OCULTAR GUÍA' : 'VER GUÍA'}</span>
                  </div>

                  {/* Concise Hint Drawer on click (NEVER launches navigation!) */}
                  {isSelected && (
                    <div className="mt-2 pt-1.5 border-t border-white/10 text-[10px] text-slate-300 leading-snug dp-font-data">
                      <p>{obj.description}</p>
                      <div className="mt-1 text-[9px] text-amber-400 italic">
                        &bull; Desplázate físicamente hasta la sala e interactúa con la consola correspondiente usando [E].
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between text-[9px] text-slate-500 dp-font-data">
            <span>Puedes moverte (A/D) mientras este registro está abierto</span>
          </div>
        </div>
      )}

      {/* =====================================================================
          DIEGETIC CONTEXTUAL INTERACTION PROMPT
          Retro phosphor computer brackets positioned in world/screen space
          ===================================================================== */}
      {!state.explorer.isHiding && interactPrompt && (
        <div
          className="pointer-events-none absolute z-30 transform -translate-x-1/2 -translate-y-full transition-all duration-150 flex flex-col items-center select-none"
          style={{
            left: `${Math.round(interactPrompt.screenX)}px`,
            top: `${Math.round(interactPrompt.screenY - 12)}px`,
          }}
        >
          <div className="pointer-events-auto px-3 py-1 bg-slate-950 border-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.5)] flex items-center gap-2 text-xs">
            <span className="w-5 h-5 bg-cyan-400 text-slate-950 font-black text-[11px] flex items-center justify-center">
              E
            </span>
            <span
              className="font-bold text-white tracking-wider uppercase text-[11px]"
              style={{ fontFamily: "'Silkscreen', monospace" }}
            >
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
          <div className="pointer-events-auto px-6 py-2.5 bg-slate-950 border-2 border-amber-500 shadow-[0_0_35px_rgba(245,158,11,0.35)] flex items-center gap-3 animate-pulse">
            <Eye className="w-5 h-5 text-amber-400" />
            <div className="text-center">
              <div
                className="text-xs font-black text-amber-300 tracking-wider uppercase"
                style={{ fontFamily: "'Silkscreen', monospace" }}
              >
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
          <div className="pointer-events-auto px-6 py-2.5 bg-purple-950 border-2 border-rose-500 shadow-[0_0_35px_rgba(244,63,94,0.5)] flex items-center gap-3 animate-pulse">
            <Flame className="w-5 h-5 text-rose-400" />
            <div className="text-center">
              <div
                className="text-xs font-black text-rose-300 tracking-wider uppercase"
                style={{ fontFamily: "'Silkscreen', monospace" }}
              >
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
          BOTTOM BAR: HEALTH GAUGES + FLASHLIGHT + CONTROLS HELPER
          ===================================================================== */}
      <div className="pointer-events-auto flex items-end justify-between gap-3 flex-wrap">
        {/* Left: Survivor Physical Health & Flashlight (if Explorer) */}
        {state.activeRole === 'EXPLORADOR' ? (
          <div className="flex items-center gap-2">
            {/* Segmented Industrial Health Gauge */}
            <div className="px-3 py-1.5 bg-slate-950/95 border-2 border-slate-700 shadow-md flex items-center gap-2.5">
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
                <div className="text-[8px] text-slate-400 uppercase tracking-widest font-bold">
                  ESTADO BIOMÉTRICO
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div
                    className={`w-3 h-3 border ${
                      state.explorer.health === 'SANO' || state.explorer.health === 'HERIDO'
                        ? 'bg-emerald-500 border-emerald-400'
                        : 'bg-rose-600 border-rose-500 animate-pulse'
                    }`}
                  />
                  <div
                    className={`w-3 h-3 border ${
                      state.explorer.health === 'SANO'
                        ? 'bg-emerald-500 border-emerald-400'
                        : state.explorer.health === 'HERIDO'
                        ? 'bg-amber-500 border-amber-400'
                        : 'bg-slate-800 border-slate-700'
                    }`}
                  />
                  <div
                    className={`w-3 h-3 border ${
                      state.explorer.health === 'SANO'
                        ? 'bg-emerald-500 border-emerald-400'
                        : 'bg-slate-800 border-slate-700'
                    }`}
                  />
                  <span
                    className={`text-[10px] font-black uppercase ml-1 ${
                      state.explorer.health === 'SANO'
                        ? 'text-emerald-400'
                        : state.explorer.health === 'HERIDO'
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {state.explorer.health}
                  </span>
                </div>
              </div>
            </div>

            {/* Flashlight Industrial Switch */}
            <button
              type="button"
              onClick={onToggleFlashlight}
              className={`px-3 py-1.5 border-2 shadow-md flex items-center gap-2 transition-all cursor-pointer ${
                state.explorer.flashlightOn
                  ? 'bg-amber-950/90 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                  : 'bg-slate-950/90 border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              <Flashlight className="w-4 h-4" />
              <div className="text-left">
                <div className="text-[8px] uppercase tracking-widest font-bold">
                  LINTERNA [F]
                </div>
                <div className="text-[10px] font-bold">
                  {state.explorer.flashlightOn ? 'ENCENDIDA' : 'APAGADA'}
                </div>
              </div>
            </button>
          </div>
        ) : (
          <div className="text-xs text-slate-300 px-3 py-1.5 bg-slate-950/95 border-2 border-slate-700 flex items-center gap-2">
            <span className="w-2 h-2 bg-cyan-400" />
            <span>Rol Activo: <strong className="text-white">{state.activeRole}</strong></span>
          </div>
        )}

        {/* Right: Keybinds Helper */}
        <div className="hidden sm:flex items-center gap-2 text-[10px] text-slate-400 bg-slate-950/95 px-3 py-1.5 border-2 border-slate-700 shadow-md">
          <span><kbd className="px-1 py-0.2 bg-slate-800 border border-slate-600 text-slate-200 font-bold">A</kbd>/<kbd className="px-1 py-0.2 bg-slate-800 border border-slate-600 text-slate-200 font-bold">D</kbd> Mover</span>
          <span>&bull;</span>
          <span><kbd className="px-1 py-0.2 bg-slate-800 border border-slate-600 text-slate-200 font-bold">SHIFT</kbd> Correr</span>
          <span>&bull;</span>
          <span><kbd className="px-1 py-0.2 bg-slate-800 border border-slate-600 text-slate-200 font-bold">E</kbd> Interactuar</span>
          <span>&bull;</span>
          <span><kbd className="px-1 py-0.2 bg-slate-800 border border-slate-600 text-slate-200 font-bold">F</kbd> Linterna</span>
        </div>
      </div>
    </div>
  );
};
