/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DarkProtocolGameState,
  Objective,
} from '../../types/darkProtocol';
import {
  INITIAL_DOORS,
  INITIAL_CAMERAS,
} from './facilityMap';

export const INITIAL_OBJECTIVES: Objective[] = [
  {
    id: 'obj_restore_power',
    number: 1,
    title: 'Restablecer Sector Eléctrico (Sector C)',
    description:
      'Ve físicamente a la Sala Eléctrica y reconfigura los fusibles quemados en el cuadro principal para devolver la energía a la subestación.',
    room: 'electrical_room',
    status: 'ACTIVO',
    completed: false,
  },
  {
    id: 'obj_stabilize_valves',
    number: 2,
    title: 'Estabilizar Presión Criogénica',
    description:
      'Dirígete al Laboratorio y calibra las tres válvulas maestras para llevar los niveles de presión a la zona verde de seguridad.',
    room: 'laboratory',
    status: 'PENDIENTE',
    completed: false,
  },
  {
    id: 'obj_align_frequency',
    number: 3,
    title: 'Sintonizar Frecuencia de Emergencia',
    description:
      'En la sala de Comunicaciones, calibra el osciloscopio de onda corta y sincroniza la frecuencia con la señal exterior.',
    room: 'communications',
    status: 'PENDIENTE',
    completed: false,
  },
  {
    id: 'obj_archive_records',
    number: 4,
    title: 'Obtener Clave de Evacuación en Archivo',
    description:
      'Accede a la terminal de Archivo para consultar el registro clasificado y recuperar el código de 4 dígitos de la compuerta exterior.',
    room: 'archive',
    status: 'PENDIENTE',
    completed: false,
  },
  {
    id: 'obj_escape_protocol',
    number: 5,
    title: 'Desbloquear Acceso de Evacuación',
    description:
      'Avanza a la sala de Acceso / Evacuación, teclea el código en el panel blindado y acciona la compuerta estanca exterior.',
    room: 'evacuation',
    status: 'BLOQUEADO',
    completed: false,
  },
];

export function generateRandomCode(): string {
  const digits = [
    Math.floor(1 + Math.random() * 9),
    Math.floor(1 + Math.random() * 9),
    Math.floor(1 + Math.random() * 9),
    Math.floor(1 + Math.random() * 9),
  ];
  return digits.join('');
}

export function createInitialGameState(characterId: string = 'mara_velasco'): DarkProtocolGameState {
  const now = Date.now();
  return {
    activeRole: 'EXPLORADOR',
    activeRoom: 'control_room',
    selectedCharacterId: characterId,
    inputContext: 'WORLD',
    currentInteractionTarget: null,

    explorer: {
      room: 'control_room',
      x: 500,
      facing: 'right',
      health: 'SANO',
      flashlightOn: true,
      flashlightAngle: 0,
      isHiding: false,
      hidingSpotId: null,
      hideTimeRemaining: 15,
      reentryCooldowns: {},
      animState: 'IDLE',
      transitionCooldown: 0,
    },

    operator: {
      room: 'control_room',
      x: 800,
      facing: 'right',
      activeStation: null,
      animState: 'IDLE',
    },

    entity: {
      manifestationMeter: 35, // starting value for testing
      isManifested: false,
      manifestationTimeRemaining: 50,
      searchCharges: 2,
      room: 'maintenance',
      x: 300,
      facing: 'left',
      selectedCctvCameraId: 'cam_control',
      sabotageCooldowns: {},
      animState: 'IDLE',
    },

    // Player Tracking Data (Explorer & Operator in facility)
    players: {
      player_explorer: {
        playerId: 'player_explorer',
        displayName: 'Jugador 1',
        characterName: 'Mara Velasco',
        role: 'EXPLORADOR',
        roomId: 'control_room',
        normalizedRoomPosition: 350 / 1300,
        trackingTimestamp: now,
        trackingAccuracy: 'HIGH',
      },
      player_operator: {
        playerId: 'player_operator',
        displayName: 'Operador Enlace',
        characterName: 'Técnico de Control',
        role: 'OPERADOR',
        roomId: 'control_room',
        normalizedRoomPosition: 620 / 1300,
        trackingTimestamp: now,
        trackingAccuracy: 'HIGH',
      },
    },

    // Entity Intelligence 15-second snapshot tracking (no continuous wallhack)
    entityTracking: {
      lastSnapshotTimestamp: now,
      refreshIntervalMs: 15000,
      snapshots: {
        player_explorer: {
          playerId: 'player_explorer',
          displayName: 'Jugador 1',
          characterName: 'Mara Velasco',
          role: 'EXPLORADOR',
          approximateRoomId: 'control_room',
          approximateNormalizedX: 0.28,
          snapshotTimestamp: now,
          status: 'CURRENT',
        },
      },
    },

    circuits: {
      sector_a: { powered: true, name: 'Sector A: Mando, Seguridad y Archivo' },
      sector_b: { powered: true, name: 'Sector B: Laboratorio, Enfermería y Comunicaciones' },
      sector_c: { powered: false, name: 'Sector C: Eléctrica, Mantenimiento y Evacuación' },
    },

    doors: JSON.parse(JSON.stringify(INITIAL_DOORS)),
    cameras: JSON.parse(JSON.stringify(INITIAL_CAMERAS)),
    objectives: JSON.parse(JSON.stringify(INITIAL_OBJECTIVES)),

    escapeUnlocked: false,
    escapeCompleted: false,

    coopCode: generateRandomCode(),
    coopSolved: false,

    valvesState: {
      v1: 30,
      v2: 70,
      v3: 20,
      pressure: 82,
      flow: 45,
      temp: 78,
      stabilized: false,
    },

    frequencyState: {
      currentFreq: 112.4,
      targetFreq: 148.6,
      currentGain: 40,
      targetGain: 75,
      fineTune: 0,
      lockProgress: 0,
      aligned: false,
    },

    electricalPuzzleSolved: false,

    alerts: [
      {
        id: 'alert_initial',
        text: 'Aviso del sistema: Sector C sin alimentación eléctrica.',
        room: 'electrical_room',
        time: Date.now(),
        type: 'alarm',
      },
    ],
  };
}

const STORAGE_KEY = 'dark_protocol_test_session_v2';

export function saveTestSession(state: DarkProtocolGameState): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('[DarkProtocol] Could not save test session to localStorage:', err);
  }
}

export function loadTestSession(): DarkProtocolGameState | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.explorer && parsed.circuits && parsed.doors) {
      if (!parsed.selectedCharacterId) parsed.selectedCharacterId = 'mara_velasco';
      return parsed;
    }
  } catch (err) {
    console.warn('[DarkProtocol] Failed to parse saved session, will use fresh state:', err);
  }
  return null;
}

export function clearTestSession(): void {
  try {
    if (typeof window === 'undefined') return null;
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('[DarkProtocol] Failed to remove saved session:', err);
  }
}
