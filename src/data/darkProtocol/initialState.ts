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
      'Ve a la Sala Eléctrica y reconfigura los fusibles quemados en el cuadro principal para devolver la energía a la subestación.',
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
    status: 'DESCONOCIDO',
    completed: false,
  },
  {
    id: 'obj_align_frequency',
    number: 3,
    title: 'Sintonizar Frecuencia de Emergencia',
    description:
      'En la estación de radio de Mantenimiento, sincroniza la onda portadora con la frecuencia de socorro exterior.',
    room: 'maintenance',
    status: 'DESCONOCIDO',
    completed: false,
  },
  {
    id: 'obj_escape_protocol',
    number: 4,
    title: 'Desbloquear Protocolo de Evacuación',
    description:
      'Coordínate con el Operador para descifrar la clave de 4 dígitos en Generadores y activa la compuerta de escape exterior.',
    room: 'generators',
    status: 'DESCONOCIDO',
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
  return {
    activeRole: 'EXPLORADOR',
    activeRoom: 'control_room',
    selectedCharacterId: characterId,

    explorer: {
      room: 'control_room',
      x: 350,
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
      x: 620,
      facing: 'right',
      activeStation: null,
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

    circuits: {
      sector_a: { powered: true, name: 'Sector A: Mando y Seguridad' },
      sector_b: { powered: true, name: 'Sector B: Laboratorio' },
      sector_c: { powered: false, name: 'Sector C: Generación y Mantenimiento' },
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
