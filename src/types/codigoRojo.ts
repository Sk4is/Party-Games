export type CodigoRojoPhase =
  | 'LOBBY'
  | 'BRIEFING'
  | 'ACTIVE_MISSION'
  | 'MISSION_SUCCESS'
  | 'MISSION_FAILED'
  | 'PODIUM'
  | 'MATCH_ABORTED';

export type CodigoRojoRole = 'OPERADOR' | 'GUIA';

export type CodigoRojoDifficulty = 'NORMAL' | 'DIFICIL' | 'EXTREMO';

export type CodigoRojoTimeMode = 'AUTO' | 'CUSTOM';

export type CodigoRojoModuleType =
  | 'FILAMENTOS'
  | 'MODULADOR_FRECUENCIA'
  | 'GLIFOS_CRIPTOGRAFICOS'
  | 'MATRIZ_ENERGIA'
  | 'VALVULAS_PRESION'
  | 'RELES_HEXADECIMALES'
  | 'RADAR_VECTORIAL'
  | 'SEÑAL_OPTICA'
  | 'TECLADO_MAESTRO'
  | 'PALANCA_SOBRECARGA'
  | 'COMPUERTAS_LOGICAS'
  | 'REFRIGERANTE_QUIMICO'
  | 'PUERTOS_CONEXION'
  | 'DISIPADOR_TERMICO'
  | 'SINCRONIZADOR_FASES'
  | 'CALIBRADOR_GIROSCOPIO'
  | 'REACTOR_PLASMA'
  | 'FRECUENCIA_RESONANCIA'
  | 'SECUENCIA_CINETICA'
  | 'DIVISOR_VOLTAJE';

export interface CodigoRojoPlayer {
  id: string;
  name: string;
  avatar: string;
  color: string;
  role: CodigoRojoRole;
  isConnected: boolean;
  isHost: boolean;
  missionsOperatedCount: number;
  missionsGuidedCount: number;
}

export interface CodigoRojoConfig {
  difficulty: CodigoRojoDifficulty;
  timeMode: CodigoRojoTimeMode;
  customTimeMinutes: number; // e.g. 5
  maxStrikes: number; // default 3
  modulesCount: number; // calculated or customized (2-6)
}

export type CodigoRojoCategory =
  | 'ELECTRICIDAD'
  | 'CONTROL'
  | 'SEÑAL'
  | 'NAVEGACIÓN'
  | 'ENERGÍA'
  | 'SISTEMAS'
  | 'COMUNICACIONES';

export interface CodigoRojoManualRule {
  condition: string;
  action: string;
}

export interface CodigoRojoManualSection {
  moduleType: CodigoRojoModuleType;
  category?: CodigoRojoCategory;
  title: string;
  subtitle: string;
  classificationCode: string;
  division?: string;
  visualIdentification?: string;
  identificationChecklist?: string[];
  description: string;
  diagramSvgKey?: string;
  rules: CodigoRojoManualRule[];
  tableHeaders?: string[];
  tableRows?: string[][];
  notes?: string[];
  protocolSteps?: string[];
  extraContent?: any;
}

export interface CodigoRojoModuleState {
  id: string;
  moduleType: CodigoRojoModuleType;
  title: string;
  solved: boolean;
  strikes: number;
  estimatedSolveSeconds: number;
  operatorState: any; // Public state shown to the Operator
  manualSection: CodigoRojoManualSection; // Manual page shown to Guides
  // internalSolution is omitted on client broadcasts
}

export interface CodigoRojoRoomState {
  code: string;
  gameType: 'codigo-rojo';
  hostId: string;
  phase: CodigoRojoPhase;
  config: CodigoRojoConfig;
  players: CodigoRojoPlayer[];
  missionNumber: number;
  totalMissions: number;
  operatorId: string;
  operatorHistory: string[];
  strikes: number;
  maxStrikes: number;
  timeRemainingSeconds: number;
  totalTimeSeconds: number;
  missionStartedAt?: number;
  missionEndsAt?: number;
  machineSerial?: string;
  modules: CodigoRojoModuleState[];
  activeModuleIndex: number;
  lastEvent?: {
    type: 'STRIKE' | 'MODULE_SOLVED' | 'MISSION_COMPLETE' | 'CRITICAL_MELTDOWN';
    moduleTitle?: string;
    message?: string;
    timestamp: number;
  };
  stats: {
    totalSolvedModules: number;
    totalStrikes: number;
    missionDurationSeconds: number;
    timeRemainingAtEndSeconds: number;
  };
  abortReason?: string;
  endMessage?: string;
}

// Client to Server Messages
export type CodigoRojoClientMessage =
  | {
      type: 'JOIN_ROOM';
      code: string;
      player: { id: string; name: string; avatar: string; color: string };
    }
  | {
      type: 'RECONNECT';
      code: string;
      playerId: string;
    }
  | {
      type: 'UPDATE_CONFIG';
      config: Partial<CodigoRojoConfig>;
    }
  | {
      type: 'START_MISSION';
    }
  | {
      type: 'MODULE_ACTION';
      moduleId: string;
      action: any;
    }
  | {
      type: 'NEXT_MISSION';
    }
  | {
      type: 'RESTART_MATCH';
    }
  | {
      type: 'LEAVE_ROOM';
    }
  | {
      type: 'KICK_PLAYER';
      targetPlayerId: string;
    }
  | {
      type: 'UPDATE_PROFILE';
      name?: string;
      avatar?: string;
      color?: string;
    }
  | {
      type: 'PING';
    };

// Server to Client Messages
export type CodigoRojoServerMessage =
  | {
      type: 'ROOM_STATE';
      room: CodigoRojoRoomState;
    }
  | {
      type: 'TICK';
      timeRemainingSeconds: number;
    }
  | {
      type: 'ACTION_RESULT';
      success: boolean;
      solved: boolean;
      strike: boolean;
      moduleId: string;
      strikesCount: number;
      message?: string;
    }
  | {
      type: 'ERROR';
      message: string;
    }
  | {
      type: 'PONG';
    };
