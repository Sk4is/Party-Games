/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  RoomZone,
  DoorDefinition,
  CameraDefinition,
  InteractableObject,
  HidingSpot,
  LightSource,
  FacilityConnection,
} from '../../types/darkProtocol';

export const FACILITY_ROOMS: Record<string, RoomZone> = {
  control_room: {
    id: 'control_room',
    name: 'SALA DE CONTROL',
    sector: 'sector_a',
    width: 1300,
    height: 600,
    floorY: 480,
    ambientColor: 'rgba(12, 18, 30, 0.88)',
    emergencyColor: 'rgba(45, 10, 15, 0.90)',
    description: 'Puesto de mando principal con consolas de monitorización y terminales de seguridad.',
  },
  security: {
    id: 'security',
    name: 'SEGURIDAD',
    sector: 'sector_a',
    width: 1150,
    height: 600,
    floorY: 480,
    ambientColor: 'rgba(10, 16, 26, 0.90)',
    emergencyColor: 'rgba(45, 8, 12, 0.92)',
    description: 'Armero, servidores de circuito cerrado de televisión y control de accesos.',
  },
  laboratory: {
    id: 'laboratory',
    name: 'LABORATORIO',
    sector: 'sector_b',
    width: 1350,
    height: 600,
    floorY: 480,
    ambientColor: 'rgba(8, 22, 26, 0.88)',
    emergencyColor: 'rgba(42, 10, 14, 0.90)',
    description: 'Zona de investigación biológica y química con viales criogénicos y sistemas de presión.',
  },
  generators: {
    id: 'generators',
    name: 'GENERADORES',
    sector: 'sector_c',
    width: 1350,
    height: 600,
    floorY: 480,
    ambientColor: 'rgba(18, 14, 10, 0.90)',
    emergencyColor: 'rgba(48, 8, 10, 0.92)',
    description: 'Turbina de combustión masiva y compuerta estanca de evacuación exterior.',
  },
  maintenance: {
    id: 'maintenance',
    name: 'MANTENIMIENTO',
    sector: 'sector_c',
    width: 1150,
    height: 600,
    floorY: 480,
    ambientColor: 'rgba(14, 14, 18, 0.90)',
    emergencyColor: 'rgba(45, 10, 12, 0.92)',
    description: 'Conductos de ventilación, tuberías industriales y estación de radioenlace.',
  },
  electrical_room: {
    id: 'electrical_room',
    name: 'SALA ELÉCTRICA',
    sector: 'sector_c',
    width: 1250,
    height: 600,
    floorY: 480,
    ambientColor: 'rgba(12, 12, 24, 0.90)',
    emergencyColor: 'rgba(46, 8, 10, 0.92)',
    description: 'Transformadores de alta tensión y cuadro de distribución primaria de los sectores.',
  },
};

/**
 * SINGLE SOURCE OF TRUTH FOR FACILITY TOPOLOGY.
 * All connections are strictly bidirectional.
 * Every transition spawns player at `spawnX`, safely outside the return trigger zone!
 */
export const FACILITY_CONNECTIONS: FacilityConnection[] = [
  {
    id: 'conn_control_security',
    name: 'Pasillo Mando - Seguridad',
    roomA: 'control_room',
    doorAX: 1220,
    doorASpawnX: 1120,
    doorAFacing: 'left',
    roomB: 'security',
    doorBX: 80,
    doorBSpawnX: 180,
    doorBFacing: 'right',
    circuitA: 'sector_a',
    circuitB: 'sector_a',
    requiresPower: false, // Manual release handle ensures no one-way traps
  },
  {
    id: 'conn_security_lab',
    name: 'Mampara Seguridad - Laboratorio',
    roomA: 'security',
    doorAX: 1070,
    doorASpawnX: 970,
    doorAFacing: 'left',
    roomB: 'laboratory',
    doorBX: 80,
    doorBSpawnX: 180,
    doorBFacing: 'right',
    circuitA: 'sector_a',
    circuitB: 'sector_b',
    requiresPower: false,
  },
  {
    id: 'conn_lab_generators',
    name: 'Acceso Criogenia - Generadores',
    roomA: 'laboratory',
    doorAX: 1270,
    doorASpawnX: 1170,
    doorAFacing: 'left',
    roomB: 'generators',
    doorBX: 80,
    doorBSpawnX: 180,
    doorBFacing: 'right',
    circuitA: 'sector_b',
    circuitB: 'sector_c',
    requiresPower: false,
  },
  {
    id: 'conn_generators_maintenance',
    name: 'Conducto Turbinas - Mantenimiento',
    roomA: 'generators',
    doorAX: 1270,
    doorASpawnX: 1170,
    doorAFacing: 'left',
    roomB: 'maintenance',
    doorBX: 80,
    doorBSpawnX: 180,
    doorBFacing: 'right',
    circuitA: 'sector_c',
    circuitB: 'sector_c',
    requiresPower: false,
  },
  {
    id: 'conn_maintenance_electric',
    name: 'Galería Mantenimiento - Subestación',
    roomA: 'maintenance',
    doorAX: 1070,
    doorASpawnX: 970,
    doorAFacing: 'left',
    roomB: 'electrical_room',
    doorBX: 80,
    doorBSpawnX: 180,
    doorBFacing: 'right',
    circuitA: 'sector_c',
    circuitB: 'sector_c',
    requiresPower: false,
  },
  {
    id: 'conn_electric_control',
    name: 'Compuerta Alta Tensión - Sala de Control',
    roomA: 'electrical_room',
    doorAX: 1170,
    doorASpawnX: 1070,
    doorAFacing: 'left',
    roomB: 'control_room',
    doorBX: 80,
    doorBSpawnX: 180,
    doorBFacing: 'right',
    circuitA: 'sector_c',
    circuitB: 'sector_a',
    requiresPower: false,
  },
];

/**
 * Builds the bidirectional DoorDefinition dictionary from the connection graph.
 * Guarantees zero orphaned doors and reciprocal navigation.
 */
export function buildDoorsFromConnections(
  connections: FacilityConnection[]
): Record<string, DoorDefinition> {
  const doors: Record<string, DoorDefinition> = {};

  for (const conn of connections) {
    const doorIdA = `door_${conn.roomA}_to_${conn.roomB}`;
    const doorIdB = `door_${conn.roomB}_to_${conn.roomA}`;

    const roomAName = FACILITY_ROOMS[conn.roomA]?.name || conn.roomA;
    const roomBName = FACILITY_ROOMS[conn.roomB]?.name || conn.roomB;

    doors[doorIdA] = {
      id: doorIdA,
      name: `Acceso a ${roomBName}`,
      fromRoom: conn.roomA,
      toRoom: conn.roomB,
      fromX: conn.doorAX,
      toX: conn.doorBX,
      spawnX: conn.doorBSpawnX,
      spawnFacing: conn.doorBFacing,
      destinationDoorId: doorIdB,
      state: 'CLOSED',
      circuitId: conn.circuitA,
      requiresPower: conn.requiresPower,
      lockedByEntity: false,
    };

    doors[doorIdB] = {
      id: doorIdB,
      name: `Acceso a ${roomAName}`,
      fromRoom: conn.roomB,
      toRoom: conn.roomA,
      fromX: conn.doorBX,
      toX: conn.doorAX,
      spawnX: conn.doorASpawnX,
      spawnFacing: conn.doorAFacing,
      destinationDoorId: doorIdA,
      state: 'CLOSED',
      circuitId: conn.circuitB,
      requiresPower: conn.requiresPower,
      lockedByEntity: false,
    };
  }

  return doors;
}

export const INITIAL_DOORS = buildDoorsFromConnections(FACILITY_CONNECTIONS);

/**
 * Diagnostic tool: validates that all connections are reciprocally traversable.
 */
export function validateAllDoorConnections(doors: Record<string, DoorDefinition>): {
  valid: boolean;
  totalDoors: number;
  totalConnections: number;
  errors: string[];
} {
  const errors: string[] = [];
  const doorList = Object.values(doors);

  for (const door of doorList) {
    const returnDoor = doors[door.destinationDoorId];
    if (!returnDoor) {
      errors.push(`Puerta huérfana detectada: ${door.id} -> ${door.destinationDoorId} no existe`);
    } else {
      if (returnDoor.toRoom !== door.fromRoom) {
        errors.push(`Reciprocidad rota en ${door.id}: regresa a ${returnDoor.toRoom} en lugar de ${door.fromRoom}`);
      }
      if (Math.abs(door.spawnX - returnDoor.fromX) < 35) {
        errors.push(`Spawn demasiado cerca del trigger en ${door.id}: spawnX=${door.spawnX}, returnFromX=${returnDoor.fromX}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    totalDoors: doorList.length,
    totalConnections: FACILITY_CONNECTIONS.length,
    errors,
  };
}

export const INITIAL_CAMERAS: Record<string, CameraDefinition> = {
  cam_control: {
    id: 'cam_control',
    room: 'control_room',
    name: 'CAM-01: Sala de Control',
    x: 180,
    y: 110,
    facing: 'right',
    fovAngle: 65,
    range: 650,
    circuitId: 'sector_a',
    state: 'ONLINE',
  },
  cam_security: {
    id: 'cam_security',
    room: 'security',
    name: 'CAM-02: Armero y Acceso',
    x: 1020,
    y: 110,
    facing: 'left',
    fovAngle: 65,
    range: 650,
    circuitId: 'sector_a',
    state: 'ONLINE',
  },
  cam_lab: {
    id: 'cam_lab',
    room: 'laboratory',
    name: 'CAM-03: Módulo Biológico',
    x: 200,
    y: 110,
    facing: 'right',
    fovAngle: 70,
    range: 680,
    circuitId: 'sector_b',
    state: 'ONLINE',
  },
  cam_generators: {
    id: 'cam_generators',
    room: 'generators',
    name: 'CAM-04: Turbina Principal',
    x: 1150,
    y: 110,
    facing: 'left',
    fovAngle: 70,
    range: 700,
    circuitId: 'sector_c',
    state: 'ONLINE',
  },
  cam_maintenance: {
    id: 'cam_maintenance',
    room: 'maintenance',
    name: 'CAM-05: Sector Técnico',
    x: 150,
    y: 110,
    facing: 'right',
    fovAngle: 60,
    range: 600,
    circuitId: 'sector_c',
    state: 'ONLINE',
  },
  cam_electrical: {
    id: 'cam_electrical',
    room: 'electrical_room',
    name: 'CAM-06: Subestación Eléctrica',
    x: 1080,
    y: 110,
    facing: 'left',
    fovAngle: 65,
    range: 640,
    circuitId: 'sector_c',
    state: 'ONLINE',
  },
};

export const HIDING_SPOTS: HidingSpot[] = [
  {
    id: 'hide_control_desk',
    type: 'BAJO_MESA',
    room: 'control_room',
    x: 640,
    y: 430,
    width: 90,
    height: 60,
    name: 'Mesa de mando',
  },
  {
    id: 'hide_security_locker',
    type: 'TAQUILLA',
    room: 'security',
    x: 480,
    y: 380,
    width: 60,
    height: 110,
    name: 'Taquilla blindada',
  },
  {
    id: 'hide_lab_vent',
    type: 'COMPARTIMENTO_TECNICO',
    room: 'laboratory',
    x: 740,
    y: 420,
    width: 80,
    height: 70,
    name: 'Conducto de ventilación',
  },
  {
    id: 'hide_gen_catwalk',
    type: 'BAJO_MESA',
    room: 'generators',
    x: 520,
    y: 430,
    width: 100,
    height: 60,
    name: 'Hueco de turbina',
  },
  {
    id: 'hide_maint_locker',
    type: 'TAQUILLA',
    room: 'maintenance',
    x: 820,
    y: 380,
    width: 60,
    height: 110,
    name: 'Armario de herramientas',
  },
  {
    id: 'hide_elec_housing',
    type: 'COMPARTIMENTO_TECNICO',
    room: 'electrical_room',
    x: 420,
    y: 410,
    width: 80,
    height: 80,
    name: 'Caja de cableado',
  },
];

export const FACILITY_LIGHTS: LightSource[] = [
  // SALA DE CONTROL
  {
    id: 'light_control_overhead_1',
    room: 'control_room',
    x: 400,
    y: 120,
    color: '#d4f0ff',
    intensity: 0.9,
    radius: 380,
    circuitId: 'sector_a',
    flicker: false,
    type: 'overhead',
  },
  {
    id: 'light_control_overhead_2',
    room: 'control_room',
    x: 900,
    y: 120,
    color: '#d4f0ff',
    intensity: 0.9,
    radius: 380,
    circuitId: 'sector_a',
    flicker: false,
    type: 'overhead',
  },
  {
    id: 'light_control_cctv_monitor',
    room: 'control_room',
    x: 280,
    y: 350,
    color: '#00e5ff',
    intensity: 0.75,
    radius: 180,
    circuitId: 'sector_a',
    type: 'monitor',
  },
  {
    id: 'light_control_map_screen',
    room: 'control_room',
    x: 740,
    y: 340,
    color: '#38bdf8',
    intensity: 0.7,
    radius: 200,
    circuitId: 'sector_a',
    type: 'monitor',
  },
  {
    id: 'light_control_emergency',
    room: 'control_room',
    x: 650,
    y: 90,
    color: '#ef4444',
    intensity: 0.85,
    radius: 260,
    circuitId: 'emergency',
    flicker: true,
    type: 'emergency',
  },

  // SEGURIDAD
  {
    id: 'light_sec_overhead',
    room: 'security',
    x: 600,
    y: 120,
    color: '#e2e8f0',
    intensity: 0.85,
    radius: 400,
    circuitId: 'sector_a',
    type: 'overhead',
  },
  {
    id: 'light_sec_rack',
    room: 'security',
    x: 920,
    y: 320,
    color: '#3b82f6',
    intensity: 0.65,
    radius: 170,
    circuitId: 'sector_a',
    type: 'monitor',
  },
  {
    id: 'light_sec_emergency',
    room: 'security',
    x: 280,
    y: 90,
    color: '#ef4444',
    intensity: 0.85,
    radius: 260,
    circuitId: 'emergency',
    flicker: true,
    type: 'emergency',
  },

  // LABORATORIO
  {
    id: 'light_lab_overhead_1',
    room: 'laboratory',
    x: 450,
    y: 120,
    color: '#e0f2fe',
    intensity: 0.95,
    radius: 390,
    circuitId: 'sector_b',
    type: 'overhead',
  },
  {
    id: 'light_lab_overhead_2',
    room: 'laboratory',
    x: 950,
    y: 120,
    color: '#e0f2fe',
    intensity: 0.95,
    radius: 390,
    circuitId: 'sector_b',
    type: 'overhead',
  },
  {
    id: 'light_lab_cryo_tank',
    room: 'laboratory',
    x: 320,
    y: 360,
    color: '#10b981',
    intensity: 0.8,
    radius: 220,
    circuitId: 'sector_b',
    flicker: true,
    type: 'monitor',
  },
  {
    id: 'light_lab_valves_dial',
    room: 'laboratory',
    x: 1050,
    y: 350,
    color: '#06b6d4',
    intensity: 0.7,
    radius: 190,
    circuitId: 'sector_b',
    type: 'monitor',
  },
  {
    id: 'light_lab_emergency',
    room: 'laboratory',
    x: 700,
    y: 90,
    color: '#ef4444',
    intensity: 0.85,
    radius: 280,
    circuitId: 'emergency',
    flicker: true,
    type: 'emergency',
  },

  // GENERADORES
  {
    id: 'light_gen_overhead_1',
    room: 'generators',
    x: 400,
    y: 120,
    color: '#fef08a',
    intensity: 0.8,
    radius: 380,
    circuitId: 'sector_c',
    type: 'overhead',
  },
  {
    id: 'light_gen_overhead_2',
    room: 'generators',
    x: 980,
    y: 120,
    color: '#fde047',
    intensity: 0.8,
    radius: 380,
    circuitId: 'sector_c',
    type: 'overhead',
  },
  {
    id: 'light_gen_escape_hatch',
    room: 'generators',
    x: 1180,
    y: 320,
    color: '#f97316',
    intensity: 0.75,
    radius: 210,
    circuitId: 'sector_c',
    type: 'monitor',
  },
  {
    id: 'light_gen_emergency',
    room: 'generators',
    x: 680,
    y: 90,
    color: '#ef4444',
    intensity: 0.85,
    radius: 280,
    circuitId: 'emergency',
    flicker: true,
    type: 'emergency',
  },

  // MANTENIMIENTO
  {
    id: 'light_maint_overhead',
    room: 'maintenance',
    x: 550,
    y: 120,
    color: '#fed7aa',
    intensity: 0.75,
    radius: 360,
    circuitId: 'sector_c',
    flicker: true,
    type: 'overhead',
  },
  {
    id: 'light_maint_radio',
    room: 'maintenance',
    x: 460,
    y: 350,
    color: '#22c55e',
    intensity: 0.7,
    radius: 170,
    circuitId: 'sector_c',
    type: 'monitor',
  },
  {
    id: 'light_maint_emergency',
    room: 'maintenance',
    x: 750,
    y: 90,
    color: '#ef4444',
    intensity: 0.85,
    radius: 260,
    circuitId: 'emergency',
    flicker: true,
    type: 'emergency',
  },

  // SALA ELÉCTRICA
  {
    id: 'light_elec_overhead',
    room: 'electrical_room',
    x: 700,
    y: 120,
    color: '#bfdbfe',
    intensity: 0.85,
    radius: 380,
    circuitId: 'sector_c',
    type: 'overhead',
  },
  {
    id: 'light_elec_panel',
    room: 'electrical_room',
    x: 880,
    y: 340,
    color: '#38bdf8',
    intensity: 0.8,
    radius: 200,
    circuitId: 'sector_c',
    type: 'monitor',
  },
  {
    id: 'light_elec_spark',
    room: 'electrical_room',
    x: 250,
    y: 280,
    color: '#93c5fd',
    intensity: 0.9,
    radius: 160,
    circuitId: 'sector_c',
    flicker: true,
    type: 'spark',
  },
  {
    id: 'light_elec_emergency',
    room: 'electrical_room',
    x: 500,
    y: 90,
    color: '#ef4444',
    intensity: 0.85,
    radius: 260,
    circuitId: 'emergency',
    flicker: true,
    type: 'emergency',
  },
];

export const FACILITY_INTERACTABLES: InteractableObject[] = [
  // SALA DE CONTROL (Operator physical stations & Explorer interactables)
  {
    id: 'terminal_cctv_station',
    type: 'terminal_cctv',
    room: 'control_room',
    x: 280,
    y: 430,
    radius: 65,
    name: 'Consola CCTV Central',
    promptText: 'Acceder a red de cámaras CCTV',
    circuitId: 'sector_a',
    requiresPower: true,
  },
  {
    id: 'terminal_electric_station',
    type: 'terminal_electric',
    room: 'control_room',
    x: 500,
    y: 430,
    radius: 65,
    name: 'Consola de Distribución Eléctrica',
    promptText: 'Abrir esquema eléctrico de sectores',
    circuitId: 'sector_a',
    requiresPower: true,
  },
  {
    id: 'terminal_map_station',
    type: 'terminal_map',
    room: 'control_room',
    x: 740,
    y: 430,
    radius: 65,
    name: 'Plano Táctico de Instalaciones',
    promptText: 'Consultar plano y estado de accesos',
    circuitId: 'sector_a',
    requiresPower: true,
  },
  {
    id: 'terminal_comms_station',
    type: 'terminal_comms',
    room: 'control_room',
    x: 960,
    y: 430,
    radius: 65,
    name: 'Terminal de Comunicaciones y Cifrado',
    promptText: 'Consultar matriz de descifrado cooperativo',
    circuitId: 'sector_a',
    requiresPower: true,
  },

  // LABORATORIO
  {
    id: 'lab_pressure_valves',
    type: 'pressure_valve',
    room: 'laboratory',
    x: 1050,
    y: 430,
    radius: 75,
    name: 'Válvulas Criogénicas (OBJ 2)',
    promptText: 'Calibrar y estabilizar presión del sistema',
    circuitId: 'sector_b',
    requiresPower: true,
  },

  // MANTENIMIENTO
  {
    id: 'maint_radio_station',
    type: 'frequency_radio',
    room: 'maintenance',
    x: 460,
    y: 430,
    radius: 75,
    name: 'Transmisor de Radiofrecuencia (OBJ 3)',
    promptText: 'Sintonizar señal de emergencia de onda corta',
    circuitId: 'sector_c',
    requiresPower: true,
  },

  // SALA ELÉCTRICA
  {
    id: 'electrical_main_panel',
    type: 'electrical_panel',
    room: 'electrical_room',
    x: 880,
    y: 430,
    radius: 75,
    name: 'Cuadro Eléctrico de Sector (OBJ 1)',
    promptText: 'Reconectar relés y fusibles de potencia',
    circuitId: 'sector_c',
    requiresPower: false,
  },

  // GENERADORES
  {
    id: 'gen_coop_keypad',
    type: 'coop_device',
    room: 'generators',
    x: 320,
    y: 430,
    radius: 75,
    name: 'Consola de Cifrado de Turbina (OBJ 4)',
    promptText: 'Introducir código de descifrado del Operador',
    circuitId: 'sector_c',
    requiresPower: true,
  },
  {
    id: 'gen_escape_console',
    type: 'escape_console',
    room: 'generators',
    x: 1180,
    y: 430,
    radius: 80,
    name: 'Compuerta Principal de Evacuación',
    promptText: 'Accionar protocolo final de escape exterior',
    circuitId: 'sector_c',
    requiresPower: true,
  },
];
