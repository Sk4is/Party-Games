export type CriptaCharacterId =
  | 'caballero'
  | 'mago'
  | 'picaro'
  | 'cazador'
  | 'clerigo'
  | 'alquimista';

export type CriptaSpriteAnimationState =
  | 'idle'
  | 'enter'
  | 'hover'
  | 'hit'
  | 'heal'
  | 'attack'
  | 'cast'
  | 'defend'
  | 'buff'
  | 'debuff'
  | 'revive';

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
  | 'ELITE'
  | 'TREASURE'
  | 'LOOT'
  | 'EVENT'
  | 'DECISION'
  | 'SHOP'
  | 'REST'
  | 'SHRINE'
  | 'TRAP'
  | 'PUZZLE'
  | 'SECRET'
  | 'BOSS'
  | 'ENCOUNTER'
  | 'SANCTUARY';

export type CriptaCanonicalRoomType =
  | 'COMBAT'
  | 'ELITE'
  | 'TREASURE'
  | 'LOOT'
  | 'EVENT'
  | 'DECISION'
  | 'SHOP'
  | 'REST'
  | 'SHRINE'
  | 'TRAP'
  | 'PUZZLE'
  | 'SECRET'
  | 'BOSS';

export type CriptaDungeonLengthTier = 'CORTA' | 'MEDIA' | 'LARGA' | 'PROFUNDA';

export type CriptaRoomState =
  | 'LOCKED'
  | 'AVAILABLE'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'SKIPPED';

export type CriptaStatusEffectType =
  | 'POISON'
  | 'BURN'
  | 'BLEED'
  | 'CONFUSION'
  | 'FROST'
  | 'CURSE'
  | 'FEAR'
  | 'WEAKENED'
  | 'MARKED'
  | 'BLESSED'
  | 'SHIELDED'
  | 'REGENERATION'
  | 'TORCH_LIGHT';

export type CriptaStatusCategory =
  | 'DAMAGE_OVER_TIME'
  | 'CONTROL'
  | 'DEBUFF'
  | 'BUFF';

export interface CriptaStatusEffectDefinition {
  id: CriptaStatusEffectType;
  name: string;
  code: string;
  category: CriptaStatusCategory;
  type: 'buff' | 'debuff' | 'relic';
  description: string;
  icon:
    | 'poison'
    | 'burn'
    | 'bleed'
    | 'confusion'
    | 'frost'
    | 'curse'
    | 'fear'
    | 'weakened'
    | 'marked'
    | 'blessed'
    | 'shielded'
    | 'regeneration'
    | 'torch';
  stackRule: 'REFRESH' | 'STACK_INTENSITY' | 'EXTEND_DURATION';
  maxStacks: number;
  defaultTurns: number;
  defaultPotency: number;
  durationRule: 'TURN_END' | 'ACTION_TRIGGER' | 'EXPEDITION';
  visualTreatment: {
    color: string;
    borderColor: string;
    bgTint: string;
  };
}

export interface CriptaPlayerStatusEffect {
  id: string;
  effectType: CriptaStatusEffectType;
  name: string;
  code: string;
  type: 'buff' | 'debuff' | 'relic';
  sourceId?: string;
  targetPlayerId?: string;
  remainingTurns: number;
  stacks: number;
  potency: number;
  appliedAtTurn: number;
}

export type CriptaRoomEnemy = {
  id: string;
  slug: string;
  name: string;
  title: string;
  isElite: boolean;
  isBoss: boolean;
  isFinalBoss?: boolean;
  bossPhase?: 1 | 2;
  hp: number;
  maxHp: number;
  attack: number;
  armor: number;
  intent: 'ATAQUE' | 'GUARDIA' | 'MALDICIÓN' | 'FURIA' | 'AFLICCIÓN' | 'CATACLISMO' | 'INVOCACIÓN';
  intentValue: number;
  accentColor: string;
  statusThreat?: CriptaStatusEffectType;
  statusSecondaryThreat?: CriptaStatusEffectType;
  abilityName?: string;
  poisonStacks?: number;
  vulnerableTurns?: number;
  spriteArchetype:
    | 'skeleton_warrior'
    | 'plague_bloom'
    | 'iron_golem'
    | 'deep_serpent'
    | 'mine_stalker'
    | 'executioner'
    | 'wisp_phantom'
    | 'sewer_abomination'
    | 'arcane_archivist'
    | 'astral_weaver'
    | 'chitin_drone'
    | 'crystal_sentinel'
    | 'chained_wraith'
    | 'blood_acolyte'
    | 'sand_mummy'
    | 'mirror_doppel'
    | 'frost_wolf'
    | 'goblin_raider'
    | 'bone_colossus'
    | 'void_herald'
    | 'final_boss_phase1'
    | 'final_boss_phase2';
};

export type CriptaItemId =
  | 'venda'
  | 'pocion_curacion'
  | 'pocion_mayor'
  | 'antidoto'
  | 'tonico_claridad'
  | 'unguento_igneo'
  | 'sal_purificadora'
  | 'elixir_fuerza'
  | 'elixir_hierro'
  | 'elixir_arcano'
  | 'bomba_humo'
  | 'frasco_volatil';

export type CriptaItemCategory =
  | 'HEALING'
  | 'CLEANSE'
  | 'BUFF'
  | 'OFFENSIVE'
  | 'UTILITY';

export type CriptaItemRarity = 'COMMON' | 'UNCOMMON' | 'RARE';

export interface CriptaItemDefinition {
  id: CriptaItemId;
  name: string;
  description: string;
  category: CriptaItemCategory;
  rarity: CriptaItemRarity;
  targetType: 'SELF_OR_ALLY' | 'ENEMY' | 'PARTY';
  combatUsable: boolean;
  roomUsable: boolean;
  basePrice: number;
  healAmount?: number;
  cleanseTypes?: CriptaStatusEffectType[];
  cleanseAllDebuffs?: boolean;
  grantStatus?: CriptaStatusEffectType;
  grantStatusTurns?: number;
  tempAttack?: number;
  tempDefense?: number;
  tempMagic?: number;
  enemyDamage?: number;
  enemyStatus?: CriptaStatusEffectType;
}

export type CriptaRelicId =
  | 'corazon_de_hierro'
  | 'diente_del_rey'
  | 'ojo_del_oraculo'
  | 'frasco_sin_fondo'
  | 'sello_del_vacio'
  | 'moneda_del_muerto'
  | 'espina_viva'
  | 'toxina_real'
  | 'guantes_del_boticario'
  | 'libro_prohibido'
  | 'corona_de_cristal'
  | 'escudo_del_sepulturero';

export type CriptaRelicTrigger =
  | 'ON_ATTACK'
  | 'ON_CRITICAL'
  | 'ON_HEAL'
  | 'ON_POISON'
  | 'ON_ROOM_ENTER'
  | 'ON_COMBAT_START'
  | 'ON_LOW_HP'
  | 'ON_ITEM_USE'
  | 'ON_ENEMY_DEATH';

export type CriptaRelicBuildTag = 'POISON' | 'MAGIC' | 'DEFENSE' | 'CRIT' | 'UTILITY';

export interface CriptaRelicDefinition {
  id: CriptaRelicId;
  name: string;
  description: string;
  rarity: 'RARE' | 'LEGENDARY';
  ownershipType: 'PERSONAL' | 'PARTY';
  triggers: CriptaRelicTrigger[];
  buildTag: CriptaRelicBuildTag;
  basePrice: number;
}

export interface CriptaAcquiredRelic {
  relicId: CriptaRelicId;
  ownerPlayerId: string | null; // null if PARTY relic
  ownerPlayerName: string;
  obtainedInDungeonId?: CriptaDungeonId | null;
  obtainedInDungeonName: string;
  obtainedAtRoomNumber?: number;
  obtainedAtTimestamp: number;
  consumedOncePerRun?: boolean;
}

export interface CriptaRoomGroundDrop {
  id: string;
  kind: 'ITEM' | 'RELIC';
  itemId?: CriptaItemId;
  relicId?: CriptaRelicId;
  droppedByEnemyName: string;
  xPercent: number;
  claimedByPlayerId?: string | null;
  claimedByPlayerName?: string;
}

export interface CriptaShopSlot {
  id: string;
  kind: 'ITEM' | 'RELIC';
  itemId?: CriptaItemId;
  relicId?: CriptaRelicId;
  priceGold: number;
  soldOut: boolean;
  buyerName?: string;
}

export interface CriptaPendingInventoryReplacement {
  playerId?: string;
  newItemId: CriptaItemId;
  sourceType: 'DROP' | 'SHOP' | 'REWARD' | 'CHEST';
  sourceRefId?: string;
  sourceDropId?: string;
  sourceShopSlotId?: string;
  priceGold?: number;
  costGold?: number;
}

export interface CriptaDungeonCompletionSummary {
  dungeonId: CriptaDungeonId;
  dungeonName: string;
  doorNumberCompleted: number; // 1, 2, or 3
  goldEarned: number;
  itemsFound: number;
  relicsFound: number;
  enemiesDefeated: number;
}

export interface CriptaRunStats {
  dungeonsCompleted: number;
  roomsVisited: number;
  enemiesDefeated: number;
  elitesDefeated: number;
  goldEarned: number;
  goldSpent: number;
  itemsUsed: number;
  relicsObtained: number;
  damageDealt: number;
  damageReceived: number;
  healingDone: number;
  playersRevived: number;
  finalBossDefeated: boolean;
}

export interface CriptaFinalBossState {
  active: boolean;
  phase: 'PHASE_1' | 'TRANSITIONING' | 'PHASE_2' | 'DEFEATED';
  phaseTransitionStartedAt: number | null;
  coreExposedTurns: number;
  cataclysmCharge: number;
}

export interface CriptaRoomInteractiveOption {
  id: string;
  label: string;
  subtitle: string;
  effectText: string;
  costGold?: number;
  costHp?: number;
  isReviveOption?: boolean;
  iconKey: 'sword' | 'shield' | 'heart' | 'gold' | 'key' | 'rune' | 'flame' | 'eye' | 'chalice' | 'potion';
  usedByPlayerIds: string[];
  resolved: boolean;
}

export interface CriptaDungeonRoom {
  id: string;
  index: number; // 0-indexed position in sequence
  roomNumber: number; // 1-indexed display number
  dungeonId: CriptaDungeonId;
  type: CriptaCanonicalRoomType;
  state: CriptaRoomState;
  revealed: boolean;
  visited: boolean;
  resolved: boolean;
  title: string;
  subtitle: string;
  narrative: string;
  outcomeLog: string | null;
  biomeVariant: number;
  combatTurn?: number;
  activeTurnPlayerId?: string | null;
  actedPlayerIdsThisRound?: string[];
  enemies: CriptaRoomEnemy[];
  options: CriptaRoomInteractiveOption[];
  groundDrops?: CriptaRoomGroundDrop[];
  shopInventory?: CriptaShopSlot[];
  isFinalBossRoom?: boolean;
  puzzleRunes?: {
    sequence: number[];
    currentInput: number[];
    solved: boolean;
  };
  secretHook?: {
    discovered: boolean;
    hint: string;
  };
  readyToAdvancePlayerIds: string[];
  optionVotes: Record<string, string>; // playerId -> optionId for group decisions
}

export type CriptaVisualEventKind =
  | 'DAMAGE_ENEMY'
  | 'CRIT_ENEMY'
  | 'ENEMY_DEATH'
  | 'ENEMY_ATTACK'
  | 'DAMAGE_PLAYER'
  | 'HEAL_PLAYER'
  | 'SHIELD_PLAYER'
  | 'GAIN_GOLD'
  | 'LOSE_GOLD'
  | 'GAIN_ATTACK'
  | 'GAIN_DEFENSE'
  | 'GAIN_MAGIC'
  | 'STATUS_APPLIED'
  | 'STATUS_REMOVED'
  | 'LOOT_ITEM'
  | 'RELIC_OBTAINED'
  | 'RELIC_ACQUIRED'
  | 'ITEM_USED'
  | 'REVIVE_PLAYER'
  | 'ROOM_REWARD'
  | 'DOOR_COMPLETED'
  | 'BOSS_PHASE_TRANSITION';

export interface CriptaVisualEvent {
  id: string;
  kind: CriptaVisualEventKind;
  targetType: 'ENEMY' | 'PLAYER' | 'PARTY' | 'ROOM';
  targetId?: string;
  sourcePlayerId?: string;
  value?: number;
  label: string;
  sublabel?: string;
  color: string;
  statusType?: CriptaStatusEffectType;
  itemId?: CriptaItemId;
  relicId?: CriptaRelicId;
  relicOwnerName?: string;
  relicIsParty?: boolean;
  vfxStyle?:
    | 'slash'
    | 'cleave'
    | 'arcane'
    | 'holy'
    | 'alchemy'
    | 'arrow'
    | 'shield'
    | 'claw'
    | 'explosion'
    | 'gold'
    | 'revive'
    | 'heal';
  isCrit?: boolean;
}

export interface CriptaVisualEventBatch {
  batchId: number;
  createdAt: number;
  actorPlayerId?: string;
  actorAction?: string;
  events: CriptaVisualEvent[];
}

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
  bonusAttack?: number;
  bonusDefense?: number;
  bonusMagic?: number;
  /** 6-slot normal consumable inventory */
  normalInventory?: CriptaItemId[];
  /** Personal run-defining relics owned by this adventurer */
  personalRelics?: CriptaAcquiredRelic[];
  /** Pending inventory full replacement prompt if normalInventory has 6 items */
  pendingInventoryReplacement?: CriptaPendingInventoryReplacement | null;
  inventoryItems?: string[];
  isDead?: boolean;
  deathsCount?: number;
  statuses: CriptaPlayerStatusEffect[];
}

export type CriptaPhase =
  | 'LOBBY'
  | 'THREE_DOORS'
  | 'ENTERING_DUNGEON'
  | 'RETURNING_TO_DOORS'
  | 'DUNGEON'
  | 'DOOR_OPENING'
  | 'DUNGEON_ARRIVAL'
  | 'FINAL_BOSS_DOOR_READY'
  | 'FINAL_BOSS_ENTRANCE'
  | 'FINAL_BOSS_COMBAT'
  | 'RUN_VICTORY';

export type CriptaSceneId =
  | 'ENTRY'
  | 'LOBBY'
  | 'THREE_DOORS'
  | 'ENTERING_DUNGEON'
  | 'RETURNING_TO_DOORS'
  | 'DUNGEON'
  | 'DUNGEON_ARRIVAL'
  | 'FINAL_BOSS_ENTRANCE'
  | 'FINAL_BOSS_COMBAT'
  | 'RUN_VICTORY';

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
  finalBossDoorVotes?: Record<string, boolean>;
  decisionResolved: boolean;
  voteTieWarning: boolean;
  initializationError: string | null;
  selectedDungeonId: CriptaDungeonId | null;
  doorOpeningStartedAt: number | null;
  returningToDoorsStartedAt?: number | null;
  exitingDungeonId?: CriptaDungeonId | null;
  floor: number;
  currentNodeId: string | null;
  generatedNodes: CriptaRoomNode[];
  /** Phase 2, 3 & 4 Authoritative Procedural Dungeon, 3-Door Run, Inventory, Relics & Final Boss State */
  completedDoorCount?: number; // 0, 1, 2, or 3
  completedDungeonIds?: CriptaDungeonId[];
  partyRelics?: CriptaAcquiredRelic[];
  dungeonCompletionSummary?: CriptaDungeonCompletionSummary | null;
  runStats?: CriptaRunStats;
  finalBossState?: CriptaFinalBossState | null;
  runVictory?: boolean;
  dungeonSeed?: number;
  dungeonLengthTier?: CriptaDungeonLengthTier;
  partyGold?: number;
  currentRoomIndex?: number;
  transitioningToRoomIndex?: number | null;
  roomSequence?: CriptaDungeonRoom[];
  discoveredSecretRoom?: CriptaDungeonRoom | null;
  inSecretRoom?: boolean;
  dungeonCompleted?: boolean;
  expeditionDefeated?: boolean;
  lastEventBatch?: CriptaVisualEventBatch | null;
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
      type: 'VOTE_FINAL_BOSS_DOOR';
    }
  | {
      type: 'RETRY_DUNGEON_INIT';
    }
  | {
      type: 'ROOM_COMBAT_ACTION';
      action: 'ATTACK' | 'ABILITY' | 'DEFEND';
      targetEnemyId?: string;
    }
  | {
      type: 'USE_INVENTORY_ITEM';
      slotIndex: number;
      targetPlayerId?: string;
      targetEnemyId?: string;
    }
  | {
      type: 'CLAIM_GROUND_DROP';
      dropId: string;
    }
  | {
      type: 'BUY_SHOP_SLOT';
      slotId: string;
    }
  | {
      type: 'RESOLVE_INVENTORY_FULL';
      replaceSlotIndex: number | null; // null = leave new item
    }
  | {
      type: 'ROOM_REVIVE_ALLY';
      targetPlayerId: string;
      method: 'GOLD' | 'BLOOD' | 'SHRINE';
    }
  | {
      type: 'ROOM_INTERACT_OPTION';
      optionId: string;
    }
  | {
      type: 'ROOM_PUZZLE_INPUT';
      runeIndex: number;
    }
  | {
      type: 'ROOM_DISCOVER_SECRET';
    }
  | {
      type: 'ROOM_ADVANCE';
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
