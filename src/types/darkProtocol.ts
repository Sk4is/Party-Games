/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DarkProtocolRole = 'EXPLORADOR' | 'OPERADOR' | 'ENTE';

export type HealthState = 'SANO' | 'HERIDO' | 'AGONIZANDO' | 'MUERTO';

export type DoorState =
  | 'CLOSED'
  | 'OPENING'
  | 'OPEN'
  | 'CLOSING'
  | 'LOCKED'
  | 'UNPOWERED'
  | 'JAMMED';

export type CameraState =
  | 'ONLINE'
  | 'OFFLINE'
  | 'DISABLED'
  | 'BROKEN'
  | 'INTERFERENCE';

export type CircuitId = 'sector_a' | 'sector_b' | 'sector_c';

export type HidingSpotType = 'TAQUILLA' | 'BAJO_MESA' | 'COMPARTIMENTO_TECNICO';

export type ObjectiveStatus =
  | 'DESCONOCIDO'
  | 'LOCALIZADO'
  | 'ACTIVO'
  | 'COMPLETADO'
  | 'FALLIDO';

export type MinigameStatus = 'NOT_STARTED' | 'ACTIVE' | 'SUCCESS' | 'FAILURE';

export interface SurvivorCharacter {
  id: string;
  name: string;
  title: string;
  quote: string;
  role: string;
  portraitIcon: string;
  primaryColor: string;
  secondaryColor: string;
  passiveTitle: string;
  passiveDesc: string;
  strengthTitle: string;
  strengthDesc: string;
  weaknessTitle: string;
  weaknessDesc: string;
  stats: {
    speed: number;
    repairSpeed: number;
    stealth: number;
    stamina: number;
  };
}

export interface HidingSpot {
  id: string;
  type: HidingSpotType;
  room: string;
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
}

export type LightType =
  | 'overhead'
  | 'monitor'
  | 'emergency'
  | 'flashlight'
  | 'spark'
  | 'ambient';

export interface LightSource {
  id: string;
  room: string;
  x: number;
  y: number;
  color: string;
  intensity: number;
  radius: number;
  circuitId?: CircuitId | 'emergency' | 'permanent';
  flicker?: boolean;
  type: LightType;
}

export interface RoomZone {
  id: string;
  name: string;
  sector: CircuitId;
  width: number;
  height: number;
  floorY: number;
  ambientColor: string;
  emergencyColor: string;
  description: string;
}

export interface FacilityConnection {
  id: string;
  name: string;
  roomA: string;
  doorAX: number;
  doorASpawnX: number;
  doorAFacing: 'left' | 'right';
  roomB: string;
  doorBX: number;
  doorBSpawnX: number;
  doorBFacing: 'left' | 'right';
  circuitA: CircuitId;
  circuitB: CircuitId;
  requiresPower: boolean;
}

export interface DoorDefinition {
  id: string;
  name: string;
  fromRoom: string;
  toRoom: string;
  fromX: number;
  toX: number;
  spawnX: number;
  spawnFacing: 'left' | 'right';
  destinationDoorId: string;
  state: DoorState;
  circuitId?: CircuitId;
  requiresPower: boolean;
  lockedByEntity?: boolean;
}

export interface CameraDefinition {
  id: string;
  room: string;
  name: string;
  x: number;
  y: number;
  facing: 'left' | 'right' | 'down';
  fovAngle: number; // degrees
  range: number; // pixels
  circuitId: CircuitId;
  state: CameraState;
}

export type CharacterAnimState =
  | 'IDLE'
  | 'IDLE_FLASHLIGHT'
  | 'WALK'
  | 'WALK_FLASHLIGHT'
  | 'RUN'
  | 'RUN_FLASHLIGHT'
  | 'INTERACT'
  | 'WORKING'
  | 'HIDE_ENTER'
  | 'HIDE_IDLE'
  | 'HIDE_EXIT'
  | 'HURT'
  | 'DOWNED';

export type EntityAnimState =
  | 'MANIFEST'
  | 'IDLE'
  | 'MOVE'
  | 'HUNT'
  | 'SEARCH'
  | 'ATTACK'
  | 'DEMATERIALIZE';

export type ActiveMinigameType =
  | 'electrical_circuit'
  | 'frequency_tuning'
  | 'pressure_valves'
  | 'coop_field'
  | 'archive_records'
  | 'infirmary_treatment'
  | null;

export interface InteractableObject {
  id: string;
  type:
    | 'electrical_panel'
    | 'frequency_radio'
    | 'pressure_valve'
    | 'coop_device'
    | 'hiding_spot'
    | 'terminal_cctv'
    | 'terminal_electric'
    | 'terminal_map'
    | 'terminal_comms'
    | 'generator_switch'
    | 'escape_console'
    | 'door_switch'
    | 'archive_terminal'
    | 'infirmary_station'
    | 'security_router'
    | 'turbine_switch';
  room: string;
  x: number;
  y: number;
  radius: number;
  name: string;
  promptText: string;
  circuitId?: CircuitId;
  requiresPower?: boolean;
  state?: string;
}

export interface Objective {
  id: string;
  number: number;
  title: string;
  description: string;
  room: string;
  status: ObjectiveStatus;
  completed: boolean;
}

export type InputContext =
  | 'WORLD'
  | 'INFORMATIONAL'
  | 'PHYSICAL_MODAL'
  | 'TERMINAL'
  | 'MINIGAME'
  | 'ENTITY_NETWORK'
  | 'DEBUG';

export type TrackingAccuracy = 'HIGH' | 'APPROXIMATE' | 'STALE' | 'LOST';

export interface PlayerTrackingData {
  playerId: string;
  displayName: string;
  characterName: string;
  role: DarkProtocolRole;
  roomId: string;
  normalizedRoomPosition: number; // 0.0 to 1.0 within room width
  trackingTimestamp: number;
  trackingAccuracy: TrackingAccuracy;
}

export interface SurvivorTrackingSnapshot {
  playerId: string;
  displayName: string;
  characterName: string;
  role: DarkProtocolRole;
  approximateRoomId: string;
  approximateNormalizedX: number; // 0.0 to 1.0 (perturbed / quantized)
  snapshotTimestamp: number;
  status: 'CURRENT' | 'STALE' | 'LOST' | 'INTERFERENCE';
}

export interface DarkProtocolGameState {
  activeRole: DarkProtocolRole;
  activeRoom: string;
  selectedCharacterId: string;
  inputContext: InputContext;
  currentInteractionTarget: string | null;

  explorer: {
    room: string;
    x: number;
    facing: 'left' | 'right';
    health: HealthState;
    flashlightOn: boolean;
    flashlightAngle: number;
    isHiding: boolean;
    hidingSpotId: string | null;
    hideTimeRemaining: number;
    reentryCooldowns: Record<string, number>;
    animState: CharacterAnimState;
    transitionCooldown: number; // seconds after passing a door
  };

  operator: {
    room: string;
    x: number;
    facing: 'left' | 'right';
    activeStation: 'cctv' | 'electric' | 'map' | 'comms' | null;
  };

  entity: {
    manifestationMeter: number; // 0 to 100
    isManifested: boolean;
    manifestationTimeRemaining: number;
    searchCharges: number;
    room: string;
    x: number;
    facing: 'left' | 'right';
    selectedCctvCameraId: string | null;
    sabotageCooldowns: Record<string, number>;
    animState: EntityAnimState;
  };

  // Player Tracking Architecture (supports Operator tactical map & future multiplayer)
  players: Record<string, PlayerTrackingData>;

  // Entity Intelligence 15-second snapshot tracking (no continuous wallhack)
  entityTracking: {
    lastSnapshotTimestamp: number;
    refreshIntervalMs: number; // 15000 ms
    snapshots: Record<string, SurvivorTrackingSnapshot>;
  };

  circuits: {
    sector_a: { powered: boolean; name: string };
    sector_b: { powered: boolean; name: string };
    sector_c: { powered: boolean; name: string };
  };

  doors: Record<string, DoorDefinition>;
  cameras: Record<string, CameraDefinition>;
  objectives: Objective[];

  escapeUnlocked: boolean;
  escapeCompleted: boolean;

  // Minigame states
  coopCode: string;
  coopSolved: boolean;
  valvesState: {
    v1: number;
    v2: number;
    v3: number;
    pressure: number;
    flow: number;
    temp: number;
    stabilized: boolean;
  };
  frequencyState: {
    currentFreq: number;
    targetFreq: number;
    currentGain: number;
    targetGain: number;
    fineTune: number;
    lockProgress: number;
    aligned: boolean;
  };
  electricalPuzzleSolved: boolean;

  alerts: Array<{
    id: string;
    text: string;
    room: string;
    time: number;
    type: 'alarm' | 'sabotage' | 'detection' | 'repair';
  }>;
}

export type ActiveMinigameType =
  | 'electrical_circuit'
  | 'frequency_tuning'
  | 'pressure_valves'
  | 'coop_field'
  | null;
