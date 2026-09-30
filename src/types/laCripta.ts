export type CriptaCharacterId =
  | 'caballero'
  | 'mago'
  | 'picaro'
  | 'cazador'
  | 'clerigo'
  | 'alquimista';

export type CriptaSpriteAnimationState = 'idle' | 'enter' | 'hover' | 'hit' | 'heal';

/**
 * Every character has 4 primary stats on a 1..10 scale for segmented pixel bars:
 * VIDA (health), ATAQUE (attack), DEFENSA (defense), MAGIA (magic)
 */
export interface CriptaCharacterStats {
  health: number; // VIDA (1..10)
  attack: number; // ATAQUE (1..10)
  defense: number; // DEFENSA (1..10)
  magic: number; // MAGIA (1..10)
}

export interface CriptaAbilityPlaceholder {
  id: string;
  name: string;
  type: 'ACTIVA' | 'PASIVA' | 'COOPERATIVA';
  description: string;
  cooldownTurns?: number;
}

export interface CriptaCharacterDefinition {
  id: CriptaCharacterId;
  name: string;
  className: string;
  role: string;
  title: string;
  description: string;
  lore: string;
  stats: CriptaCharacterStats;
  maxHp: number;
  baseArmor: number;
  portraitAsset: string;
  hudAsset: string;
  accentColor: string;
  rimColor: string;
  abilities: CriptaAbilityPlaceholder[];
}

export type CriptaDungeonId =
  | 'catacumbas_del_rey'
  | 'jardin_podrido'
  | 'forja_infernal'
  | 'templo_sumergido'
  | 'minas_abandonadas'
  | 'castillo_del_verdugo'
  | 'bosque_de_los_susurros'
  | 'alcantarillas_imperiales'
  | 'biblioteca_prohibida'
  | 'torre_del_astrologo'
  | 'la_colmena'
  | 'cripta_de_cristal'
  | 'prision_maldita'
  | 'santuario_de_sangre'
  | 'ciudad_sepultada'
  | 'palacio_de_los_espejos'
  | 'cavernas_heladas'
  | 'fortaleza_goblin'
  | 'cementerio_de_gigantes'
  | 'el_abismo';

export type CriptaDoorArchStyle =
  | 'gothic_crypt'
  | 'overgrown_roots'
  | 'iron_furnace'
  | 'sunken_temple'
  | 'timber_mine'
  | 'executioner_gate'
  | 'whispering_wood'
  | 'imperial_grate'
  | 'forbidden_tome'
  | 'astral_observatory'
  | 'chitin_hive'
  | 'prismatic_crystal'
  | 'cursed_chains'
  | 'blood_sanctum'
  | 'buried_obelisk'
  | 'mirror_arch'
  | 'glacial_maw'
  | 'goblin_palisade'
  | 'titan_ribs'
  | 'abyssal_rift';

export type CriptaDoorAmbientEffect =
  | 'candles'
  | 'spores'
  | 'embers'
  | 'water_drips'
  | 'dust_motes'
  | 'chains_sway'
  | 'wisps'
  | 'miasma'
  | 'arcane_runes'
  | 'starlight'
  | 'swarm_motes'
  | 'crystal_gleam'
  | 'soul_flames'
  | 'blood_mist'
  | 'falling_sand'
  | 'mirror_shimmer'
  | 'frost_mist'
  | 'torch_sparks'
  | 'ash_snow'
  | 'void_tendrils';

export interface CriptaDungeonPalette {
  stone: string;
  stoneDark: string;
  highlight: string;
  glow: string;
  fog: string;
  secondary: string;
}

export interface CriptaDungeonDefinition {
  id: CriptaDungeonId;
  index: number;
  name: string;
  subtitle: string;
  description: string;
  palette: CriptaDungeonPalette;
  dangerProfile: {
    tier: 'MODERADO' | 'ALTO' | 'SEVERO' | 'EXTREMO';
    primaryThreat: string;
    trapDensity: 'BAJA' | 'MEDIA' | 'ALTA';
  };
  enemyPool: string[];
  elitePool: string[];
  roomPool: string[];
  eventPool: string[];
  shopPool: string[];
  treasurePool: string[];
  bossPool: string[];
  environmentModifiers: string[];
  musicKey: string;
  artTheme: {
    archStyle: CriptaDoorArchStyle;
    ambientEffect: CriptaDoorAmbientEffect;
    reliefMotif: string;
    doorMaterial: string;
    hoverPrompt: string;
  };
}

export type CriptaRoomNodeType =
  | 'ENTRANCE'
  | 'COMBAT'
  | 'ENCOUNTER'
  | 'ELITE'
  | 'EVENT'
  | 'TREASURE'
  | 'TRAP'
  | 'SHOP'
  | 'SANCTUARY'
  | 'BOSS';

export interface CriptaRoomNode {
  id: string;
  type: CriptaRoomNodeType;
  floor: number;
  depth: number;
  title: string;
  connections: string[];
  contentId: string;
  revealed: boolean;
  visited: boolean;
  resolved: boolean;
}

export interface CriptaPlayerStatusEffect {
  id: string;
  name: string;
  code: string;
  type: 'buff' | 'debuff' | 'relic';
  stacks?: number;
}

export interface CriptaPlayer {
  id: string;
  name: string;
  color: string;
  seatIndex: number;
  isHost: boolean;
  isConnected: boolean;
  characterId: CriptaCharacterId | null;
  selectedCharacterId: CriptaCharacterId | null;
  hp: number;
  maxHp: number;
  armor: number;
  statuses: CriptaPlayerStatusEffect[];
}

export type CriptaPhase =
  | 'LOBBY'
  | 'THREE_DOORS'
  | 'ENTERING_DUNGEON'
  | 'DUNGEON'
  | 'DOOR_OPENING'
  | 'DUNGEON_ARRIVAL';

export type CriptaSceneId =
  | 'ENTRY'
  | 'LOBBY'
  | 'THREE_DOORS'
  | 'ENTERING_DUNGEON'
  | 'DUNGEON'
  | 'DUNGEON_ARRIVAL';

export interface CriptaExpeditionState {
  roomId: string;
  code: string;
  roomCode: string;
  expeditionId: string;
  seed: number;
  stateVersion: number;
  gameType: 'la-cripta';
  minPlayers: 1;
  maxPlayers: 4;
  hostId: string;
  phase: CriptaPhase;
  players: CriptaPlayer[];
  selectedCharacters: Record<string, CriptaCharacterId | null>;
  offeredDungeons: CriptaDungeonId[];
  doorVotes: Record<string, CriptaDungeonId>;
  decisionResolved: boolean;
  voteTieWarning: boolean;
  initializationError: string | null;
  selectedDungeonId: CriptaDungeonId | null;
  doorOpeningStartedAt: number | null;
  floor: number;
  currentNodeId: string | null;
  generatedNodes: CriptaRoomNode[];
}

export interface CriptaRemoteCursor {
  playerId: string;
  name: string;
  color: string;
  xNormalized: number;
  yNormalized: number;
  sceneId: CriptaSceneId;
  updatedAt: number;
}

export type CriptaClientMessage =
  | {
      type: 'JOIN_ROOM';
      roomCode: string;
      player: {
        id: string;
        name: string;
        color: string;
      };
    }
  | {
      type: 'SELECT_CHARACTER';
      characterId: CriptaCharacterId | null;
    }
  | {
      type: 'SET_CURSOR_COLOR';
      color: string;
    }
  | {
      type: 'CURSOR_MOVE';
      xNormalized: number;
      yNormalized: number;
      sceneId: CriptaSceneId;
    }
  | {
      type: 'START_EXPEDITION';
    }
  | {
      type: 'VOTE_DOOR';
      dungeonId: CriptaDungeonId;
    }
  | {
      type: 'RETRY_DUNGEON_INIT';
    }
  | {
      type: 'RETURN_TO_LOBBY';
    }
  | {
      type: 'LEAVE_ROOM';
    }
  | {
      type: 'PING';
    };

export type CriptaServerMessage =
  | {
      type: 'EXPEDITION_STATE';
      state: CriptaExpeditionState;
    }
  | {
      type: 'DOOR_LOCKED';
      expeditionId: string;
      selectedDungeonId: CriptaDungeonId;
      doorOpeningStartedAt: number;
      state: CriptaExpeditionState;
    }
  | {
      type: 'CURSOR_UPDATE';
      playerId: string;
      name: string;
      color: string;
      xNormalized: number;
      yNormalized: number;
      sceneId: CriptaSceneId;
    }
  | {
      type: 'NOTIFICATION';
      text: string;
      variant?: 'info' | 'warning' | 'danger' | 'success';
    }
  | {
      type: 'ERROR';
      message: string;
    }
  | {
      type: 'PONG';
    };
