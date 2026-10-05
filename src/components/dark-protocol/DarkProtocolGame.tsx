/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  DarkProtocolGameState,
  DarkProtocolRole,
  InteractableObject,
  DoorDefinition,
  HidingSpot,
  ActiveMinigameType,
} from '../../types/darkProtocol';
import {
  createInitialGameState,
  loadTestSession,
  saveTestSession,
  clearTestSession,
} from '../../data/darkProtocol/initialState';
import { FACILITY_ROOMS } from '../../data/darkProtocol/facilityMap';
import { DarkProtocolEntry } from './DarkProtocolEntry';
import { DarkProtocolCanvas } from './DarkProtocolCanvas';
import { DarkProtocolHud } from './DarkProtocolHud';
import { DarkProtocolDebugPanel } from './DarkProtocolDebugPanel';
import { EntitySecurityTerminal } from './EntitySecurityTerminal';
import { OperatorTerminalModal } from './OperatorTerminalModal';
import { CharacterSelectModal } from './CharacterSelectModal';
import { ElectricalCircuitMinigame } from './minigames/ElectricalCircuitMinigame';
import { FrequencyTuningMinigame } from './minigames/FrequencyTuningMinigame';
import { PressureValvesMinigame } from './minigames/PressureValvesMinigame';
import { CooperativeKeypadMinigame } from './minigames/CooperativeKeypadMinigame';
import { ArchiveTerminalModal } from './ArchiveTerminalModal';
import { InfirmaryStationModal } from './InfirmaryStationModal';
import {
  RendererDebugOptions,
  DarkProtocolCanvasEngine,
  InteractionPromptTarget,
} from './renderer/engine';
import { darkProtocolAudio } from '../../utils/darkProtocolAudio';
import { Trophy, ArrowLeft, RotateCcw } from 'lucide-react';

interface DarkProtocolGameProps {
  onBackToMenu: () => void;
}

export const DarkProtocolGame: React.FC<DarkProtocolGameProps> = ({ onBackToMenu }) => {
  const [inGame, setInGame] = useState<boolean>(false);
  const [showCharacterSelect, setShowCharacterSelect] = useState<boolean>(false);
  const [state, setState] = useState<DarkProtocolGameState>(createInitialGameState);

  const [interactPrompt, setInteractPrompt] = useState<InteractionPromptTarget | null>(null);

  // Active minigames or operator station modals
  const [activeMinigame, setActiveMinigame] = useState<ActiveMinigameType>(null);
  const [activeOperatorStation, setActiveOperatorStation] = useState<
    'cctv' | 'map' | 'status' | null
  >(null);

  const openPhysicalModal = (type: ActiveMinigameType) => {
    setActiveMinigame(type);
    setState((prev) => ({
      ...prev,
      inputContext: 'PHYSICAL_MODAL',
      explorer: { ...prev.explorer, animState: 'WORKING' },
    }));
  };

  const closePhysicalModal = () => {
    setActiveMinigame(null);
    setState((prev) => ({
      ...prev,
      inputContext: 'WORLD',
      explorer: { ...prev.explorer, animState: 'IDLE' },
    }));
  };

  const openOperatorStation = (station: 'cctv' | 'map' | 'status') => {
    setActiveOperatorStation(station);
    setState((prev) => ({
      ...prev,
      inputContext: 'PHYSICAL_MODAL',
    }));
  };

  const closeOperatorStation = () => {
    setActiveOperatorStation(null);
    setState((prev) => ({
      ...prev,
      inputContext: 'WORLD',
    }));
  };

  // Debug options
  const [debugOptions, setDebugOptions] = useState<RendererDebugOptions>({
    showInteractionZones: false,
    showCameraFOV: false,
    showLightBounds: false,
    showCollisionBounds: false,
  });

  const engineRef = useRef<DarkProtocolCanvasEngine | null>(null);

  // Global F1, F2, F3 hotkey listener for instantaneous role switching
  useEffect(() => {
    const handleRoleKey = (e: KeyboardEvent) => {
      if (!inGame) return;
      if (e.key === 'F1') {
        e.preventDefault();
        handleRoleSwitch('EXPLORADOR');
      } else if (e.key === 'F2') {
        e.preventDefault();
        handleRoleSwitch('OPERADOR');
      } else if (e.key === 'F3') {
        e.preventDefault();
        handleRoleSwitch('ENTE');
      }
    };

    window.addEventListener('keydown', handleRoleKey);
    return () => window.removeEventListener('keydown', handleRoleKey);
  }, [inGame, state.explorer.room, state.entity.room]);

  // Audio room ambience updates
  useEffect(() => {
    if (!inGame) return;
    const room = FACILITY_ROOMS[state.activeRoom] || FACILITY_ROOMS.control_room;
    const isPowered = Boolean(state.circuits[room.sector]?.powered);
    const isEmergency = state.entity.isManifested;
    darkProtocolAudio.updateRoomAmbience(isPowered, isEmergency);
  }, [inGame, state.activeRoom, state.circuits, state.entity.isManifested]);

  // Periodic session saving
  useEffect(() => {
    if (!inGame) return;
    saveTestSession(state);
  }, [state, inGame]);

  const handleStartFresh = () => {
    setShowCharacterSelect(true);
  };

  const handleSelectCharacter = (charId: string) => {
    const fresh = createInitialGameState();
    fresh.selectedCharacterId = charId;
    setState(fresh);
    setShowCharacterSelect(false);
    setInGame(true);
  };

  const handleResume = () => {
    const saved = loadTestSession();
    if (saved) {
      setState(saved);
    }
    setInGame(true);
  };

  const handleRoleSwitch = (newRole: DarkProtocolRole) => {
    darkProtocolAudio.playSwitchClick();
    setState((prev) => {
      // Determine activeRoom based on role's physical location
      let targetRoom = prev.activeRoom;
      if (newRole === 'EXPLORADOR') {
        targetRoom = prev.explorer.room;
      } else if (newRole === 'OPERADOR') {
        targetRoom = 'control_room';
      } else if (newRole === 'ENTE') {
        targetRoom = prev.entity.isManifested ? prev.entity.room : prev.activeRoom;
      }

      return {
        ...prev,
        activeRole: newRole,
        activeRoom: targetRoom,
      };
    });
  };

  const handleRoomChange = (
    newRoom: string,
    targetX: number,
    facing: 'left' | 'right' = 'right'
  ) => {
    setState((prev) => {
      if (prev.activeRole === 'EXPLORADOR') {
        return {
          ...prev,
          activeRoom: newRoom,
          explorer: {
            ...prev.explorer,
            room: newRoom,
            x: targetX,
            facing,
          },
        };
      } else if (prev.activeRole === 'OPERADOR') {
        return {
          ...prev,
          activeRoom: newRoom,
          operator: {
            ...prev.operator,
            room: newRoom,
            x: targetX,
            facing,
          },
        };
      } else if (prev.activeRole === 'ENTE') {
        return {
          ...prev,
          activeRoom: newRoom,
          entity: {
            ...prev.entity,
            room: newRoom,
            x: targetX,
            facing,
          },
        };
      }
      return { ...prev, activeRoom: newRoom };
    });
  };

  const handleToggleFlashlight = () => {
    darkProtocolAudio.playFlashlightClick();
    setState((prev) => ({
      ...prev,
      explorer: {
        ...prev.explorer,
        flashlightOn: !prev.explorer.flashlightOn,
      },
    }));
  };

  const handleTriggerManifestation = () => {
    darkProtocolAudio.playEntityManifestation();
    setState((prev) => ({
      ...prev,
      activeRoom: prev.entity.room,
      entity: {
        ...prev.entity,
        isManifested: true,
        manifestationTimeRemaining: 50,
        searchCharges: 2,
        manifestationMeter: 100,
      },
      alerts: [
        {
          id: 'manifest_' + Date.now(),
          text: '¡ALERTA MÁXIMA! El Ente se ha manifestado físicamente en la instalación.',
          room: prev.entity.room,
          time: Date.now(),
          type: 'alarm',
        },
        ...prev.alerts.slice(0, 8),
      ],
    }));
  };

  // Global Escape key listener to close physical modals and unlock movement
  useEffect(() => {
    const handleGlobalEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeMinigame) {
          closePhysicalModal();
        } else if (activeOperatorStation) {
          closeOperatorStation();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalEsc);
    return () => window.removeEventListener('keydown', handleGlobalEsc);
  }, [activeMinigame, activeOperatorStation]);

  const handleOpenMinigame = (objId: string) => {
    // Strictly physical room routing
    if (objId === 'electrical_main_panel') {
      openPhysicalModal('electrical_circuit');
    } else if (objId === 'lab_pressure_valves') {
      openPhysicalModal('pressure_valves');
    } else if (objId === 'comms_frequency_radio') {
      openPhysicalModal('frequency_tuning');
    } else if (objId === 'archive_records_terminal') {
      openPhysicalModal('archive_records');
    } else if (objId === 'infirmary_med_station') {
      openPhysicalModal('infirmary_treatment');
    } else if (objId === 'evacuation_keypad') {
      openPhysicalModal('coop_field');
    } else if (objId === 'evacuation_blast_gate') {
      if (state.escapeUnlocked) {
        darkProtocolAudio.playMinigameSuccess();
        setState((prev) => ({
          ...prev,
          escapeCompleted: true,
          objectives: prev.objectives.map((o) =>
            o.id === 'obj_escape_protocol' ? { ...o, completed: true, status: 'COMPLETADO' } : o
          ),
          alerts: [
            {
              id: 'escape_success_' + Date.now(),
              text: '¡SUPERVIVIENTES EVACUADOS CON ÉXITO! La compuerta exterior se ha cerrado tras ellos.',
              room: 'evacuation',
              time: Date.now(),
              type: 'repair',
            },
            ...prev.alerts.slice(0, 8),
          ],
        }));
      } else {
        darkProtocolAudio.playMinigameFail();
        setState((prev) => ({
          ...prev,
          alerts: [
            {
              id: 'escape_locked_' + Date.now(),
              text: 'ERROR: La compuerta exterior permanece bloqueada. Se requiere autorización previa en el teclado blindado.',
              room: 'evacuation',
              time: Date.now(),
              type: 'alarm',
            },
            ...prev.alerts.slice(0, 8),
          ],
        }));
      }
    } else if (objId === 'terminal_cctv_station') {
      openOperatorStation('cctv');
    } else if (objId === 'terminal_map_station') {
      openOperatorStation('map');
    } else if (objId === 'control_status_board') {
      openOperatorStation('status');
    } else if (objId === 'security_network_router') {
      darkProtocolAudio.playSwitchClick();
      setState((prev) => ({
        ...prev,
        alerts: [
          {
            id: 'router_ping_' + Date.now(),
            text: '[SEGURIDAD] Matriz de enrutamiento CCTV operativa. Todas las cámaras transmiten señal.',
            room: 'security',
            time: Date.now(),
            type: 'repair',
          },
          ...prev.alerts.slice(0, 8),
        ],
      }));
    } else if (objId === 'security_door_override') {
      darkProtocolAudio.playSwitchClick();
      setState((prev) => ({
        ...prev,
        alerts: [
          {
            id: 'door_override_' + Date.now(),
            text: '[SEGURIDAD] Cerrojos neumáticos de esclusas desbloqueados manualmente.',
            room: 'security',
            time: Date.now(),
            type: 'repair',
          },
          ...prev.alerts.slice(0, 8),
        ],
      }));
    } else if (objId === 'maint_steam_purge') {
      darkProtocolAudio.playSwitchClick();
      setState((prev) => ({
        ...prev,
        alerts: [
          {
            id: 'steam_purge_' + Date.now(),
            text: '[MANTENIMIENTO] Purga de vapor ejecutada. Presión de la galería normalizada.',
            room: 'maintenance',
            time: Date.now(),
            type: 'repair',
          },
          ...prev.alerts.slice(0, 8),
        ],
      }));
    } else if (objId === 'gen_turbine_console') {
      darkProtocolAudio.playSwitchClick();
      setState((prev) => ({
        ...prev,
        alerts: [
          {
            id: 'turbine_ping_' + Date.now(),
            text: '[GENERADORES] Turbina principal en modo de reserva acústica activa.',
            room: 'generators',
            time: Date.now(),
            type: 'repair',
          },
          ...prev.alerts.slice(0, 8),
        ],
      }));
    }
  };

  // Minigame 1 Success
  const handleCircuitSuccess = () => {
    setActiveMinigame(null);
    setState((prev) => ({
      ...prev,
      electricalPuzzleSolved: true,
      circuits: {
        ...prev.circuits,
        sector_c: {
          ...prev.circuits.sector_c,
          powered: true,
        },
      },
      objectives: prev.objectives.map((o) =>
        o.id === 'obj_restore_power' ? { ...o, completed: true } : o
      ),
      entity: {
        ...prev.entity,
        manifestationMeter: Math.min(100, prev.entity.manifestationMeter + 15),
      },
      alerts: [
        {
          id: 'obj1_done_' + Date.now(),
          text: 'OBJETIVO 1 COMPLETADO: Suministro eléctrico de Sector C restablecido.',
          room: 'electrical_room',
          time: Date.now(),
          type: 'repair',
        },
        ...prev.alerts.slice(0, 8),
      ],
    }));
  };

  // Minigame 2 Success
  const handleValvesSuccess = () => {
    setActiveMinigame(null);
    setState((prev) => ({
      ...prev,
      valvesState: {
        ...prev.valvesState,
        stabilized: true,
      },
      objectives: prev.objectives.map((o) =>
        o.id === 'obj_stabilize_valves' ? { ...o, completed: true } : o
      ),
      entity: {
        ...prev.entity,
        manifestationMeter: Math.min(100, prev.entity.manifestationMeter + 15),
      },
      alerts: [
        {
          id: 'obj2_done_' + Date.now(),
          text: 'OBJETIVO 2 COMPLETADO: Sistema de presión criogénica estabilizado.',
          room: 'laboratory',
          time: Date.now(),
          type: 'repair',
        },
        ...prev.alerts.slice(0, 8),
      ],
    }));
  };

  // Minigame 3 Success
  const handleFrequencySuccess = () => {
    setActiveMinigame(null);
    setState((prev) => ({
      ...prev,
      frequencyState: {
        ...prev.frequencyState,
        aligned: true,
      },
      objectives: prev.objectives.map((o) =>
        o.id === 'obj_align_frequency' ? { ...o, completed: true } : o
      ),
      entity: {
        ...prev.entity,
        manifestationMeter: Math.min(100, prev.entity.manifestationMeter + 15),
      },
      alerts: [
        {
          id: 'obj3_done_' + Date.now(),
          text: 'OBJETIVO 3 COMPLETADO: Frecuencia de socorro exterior alineada.',
          room: 'maintenance',
          time: Date.now(),
          type: 'repair',
        },
        ...prev.alerts.slice(0, 8),
      ],
    }));
  };

  // Minigame 4 (Coop Keypad) Success
  const handleCoopSuccess = () => {
    setActiveMinigame(null);
    setState((prev) => ({
      ...prev,
      coopSolved: true,
      escapeUnlocked: true,
      objectives: prev.objectives.map((o) =>
        o.id === 'obj_escape_protocol' ? { ...o, completed: true } : o
      ),
      alerts: [
        {
          id: 'obj4_done_' + Date.now(),
          text: '¡CÓDIGO DE SEGURIDAD VALIDADO! Compuerta principal de escape exterior desbloqueada.',
          room: 'generators',
          time: Date.now(),
          type: 'repair',
        },
        ...prev.alerts.slice(0, 8),
      ],
    }));
  };

  // Teleport handler from debug panel
  const handleTeleport = (roomId: string) => {
    const targetRoom = FACILITY_ROOMS[roomId];
    if (!targetRoom) return;
    handleRoomChange(roomId, targetRoom.width / 2);
  };

  const handleResetObjectives = () => {
    setState((prev) => ({
      ...prev,
      escapeUnlocked: false,
      escapeCompleted: false,
      coopSolved: false,
      electricalPuzzleSolved: false,
      objectives: prev.objectives.map((o) => ({ ...o, completed: false })),
    }));
  };

  // If on entry screen
  if (!inGame) {
    return (
      <>
        <DarkProtocolEntry
          onStartFresh={handleStartFresh}
          onResume={handleResume}
          onBackToMenu={onBackToMenu}
        />
        {showCharacterSelect && (
          <CharacterSelectModal
            initialCharacterId={state.selectedCharacterId}
            onSelectCharacter={handleSelectCharacter}
            onCancel={() => setShowCharacterSelect(false)}
          />
        )}
      </>
    );
  }

  // If Entity role and NOT physically manifested -> Show security interface
  if (state.activeRole === 'ENTE' && !state.entity.isManifested) {
    return (
      <div className="relative w-full min-h-screen">
        <EntitySecurityTerminal
          state={state}
          onUpdateState={setState}
          onTriggerManifestation={handleTriggerManifestation}
        />
        {/* Debug Panel available */}
        <DarkProtocolDebugPanel
          state={state}
          onUpdateState={setState}
          onRoleSwitch={handleRoleSwitch}
          onTeleport={handleTeleport}
          debugOptions={debugOptions}
          onUpdateDebugOptions={setDebugOptions}
          onResetObjectives={handleResetObjectives}
        />
      </div>
    );
  }

  // Otherwise: 2D Playable Canvas World (Explorer, Operator, or Manifested Entity)
  return (
    <div className="relative w-full h-screen overflow-hidden bg-black select-none">
      {/* 2D Canvas Engine */}
      <DarkProtocolCanvas
        state={state}
        onUpdateState={setState}
        onInteractPrompt={setInteractPrompt}
        onRoomChange={handleRoomChange}
        onOpenMinigame={handleOpenMinigame}
        debugOptions={debugOptions}
        engineRef={engineRef}
      />

      {/* Restrained In-Game HUD */}
      <DarkProtocolHud
        state={state}
        interactPrompt={interactPrompt}
        onRoleSwitch={handleRoleSwitch}
        onBackToMenu={onBackToMenu}
        onToggleFlashlight={handleToggleFlashlight}
        onOpenCharacterSelect={() => setShowCharacterSelect(true)}
      />

      {/* Character Dossier Switcher Modal */}
      {showCharacterSelect && (
        <CharacterSelectModal
          initialCharacterId={state.selectedCharacterId}
          onSelectCharacter={(charId) => {
            setState((prev) => ({ ...prev, selectedCharacterId: charId }));
            setShowCharacterSelect(false);
          }}
          onCancel={() => setShowCharacterSelect(false)}
        />
      )}

      {/* Collapsible Test / Debug Panel */}
      <DarkProtocolDebugPanel
        state={state}
        onUpdateState={setState}
        onRoleSwitch={handleRoleSwitch}
        onTeleport={handleTeleport}
        debugOptions={debugOptions}
        onUpdateDebugOptions={setDebugOptions}
        onResetObjectives={handleResetObjectives}
      />

      {/* Operator Terminal Modals */}
      {activeOperatorStation && (
        <OperatorTerminalModal
          station={activeOperatorStation}
          state={state}
          onUpdateState={setState}
          onClose={closeOperatorStation}
        />
      )}

      {/* Minigame 1: Electrical Circuit */}
      {activeMinigame === 'electrical_circuit' && (
        <ElectricalCircuitMinigame
          onSuccess={handleCircuitSuccess}
          onFail={() => {
            setState((prev) => ({
              ...prev,
              entity: {
                ...prev.entity,
                manifestationMeter: Math.min(100, prev.entity.manifestationMeter + 8),
              },
            }));
          }}
          onClose={closePhysicalModal}
        />
      )}

      {/* Minigame 2: Pressure Valves */}
      {activeMinigame === 'pressure_valves' && (
        <PressureValvesMinigame
          onSuccess={handleValvesSuccess}
          onClose={closePhysicalModal}
        />
      )}

      {/* Minigame 3: Frequency Tuning */}
      {activeMinigame === 'frequency_tuning' && (
        <FrequencyTuningMinigame
          onSuccess={handleFrequencySuccess}
          onClose={closePhysicalModal}
        />
      )}

      {/* Minigame 4: Cooperative Keypad (Field Side) */}
      {activeMinigame === 'coop_field' && (
        <CooperativeKeypadMinigame
          correctCode={state.coopCode}
          onSuccess={handleCoopSuccess}
          onClose={closePhysicalModal}
        />
      )}

      {/* Physical Terminal: Archive Records */}
      {activeMinigame === 'archive_records' && (
        <ArchiveTerminalModal
          state={state}
          onUpdateState={setState}
          onClose={closePhysicalModal}
        />
      )}

      {/* Physical Terminal: Infirmary Treatment */}
      {activeMinigame === 'infirmary_treatment' && (
        <InfirmaryStationModal
          state={state}
          onUpdateState={setState}
          onClose={closePhysicalModal}
        />
      )}

      {/* ESCAPE VICTORY MODAL */}
      {state.escapeCompleted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-lg p-6 font-mono text-center">
          <div className="max-w-lg w-full p-8 rounded-3xl bg-slate-950 border border-emerald-500/40 shadow-[0_0_80px_rgba(16,185,129,0.3)] space-y-5 animate-bounce">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-emerald-950 border border-emerald-400/40 flex items-center justify-center text-4xl shadow-xl">
              🏆
            </div>
            <h2 className="text-3xl font-black text-white tracking-widest uppercase">
              ¡PROTOCOLO DE ESCAPE COMPLETADO!
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed font-sans">
              Los supervivientes han logrado descifrar la compuerta de evacuación exterior y escapar de la instalación subterránea antes de ser consumidos por el Ente.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={handleStartFresh}
                className="py-3 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>JUGAR DE NUEVO</span>
              </button>
              <button
                type="button"
                onClick={onBackToMenu}
                className="py-3 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/10 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>VOLVER AL MENÚ</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
