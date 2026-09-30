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
  | 'MINIBOSS'
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
  | 'MINIBOSS'
  | 'BOSS';

export type CriptaRoomLifecyclePhase =
  | 'ENTERING'
  | 'ACTIVE'
  | 'RESOLVING'
  | 'REWARDING'
  | 'SETTLING'
  | 'READY_TO_LEAVE'
  | 'TRANSITIONING_OUT';

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

export type CriptaEnemyAiPersonality =
  | 'CHAOTIC'
  | 'AGGRESSIVE'
  | 'OPPORTUNIST'
  | 'TACTICAL'
  | 'PROTECTOR'
  | 'SUPPORT'
  | 'CONTROLLER'
  | 'PREDATOR'
  | 'BERSERKER'
  | 'COWARD'
  | 'COMMANDER'
  | 'BOSS';

export type CriptaEnemyActionKind =
  | 'ATTACK'
  | 'SPECIAL_ATTACK'
  | 'APPLY_STATUS'
  | 'HEAL_SELF'
  | 'HEAL_ALLY'
  | 'DEFEND_SELF'
  | 'DEFEND_ALLY'
  | 'BUFF_ALLY'
  | 'DEBUFF_PLAYER'
  | 'PROTECT_ALLY'
  | 'PREPARE_ATTACK'
  | 'SUMMON'
  | 'SPECIAL_BOSS_ACTION';

export type CriptaEnemyTargetScope =
  | 'ONE_PLAYER'
  | 'MULTIPLE_PLAYERS'
  | 'ALL_PLAYERS'
  | 'RANDOM_N_PLAYERS'
  | 'SELF'
  | 'ALLY_ENEMY';

export interface CriptaEnemyAbilityDefinition {
  id: string;
  name: string;
  actionKind: CriptaEnemyActionKind;
  targetScope: CriptaEnemyTargetScope;
  randomTargetsCount?: number;
  basePriority: number;
  cooldownRounds?: number;
  maxCharges?: number;
  damageMultiplier?: number;
  healAmount?: number;
  healPercentOfMax?: number;
  armorBonus?: number;
  attackBonus?: number;
  statusToApply?: CriptaStatusEffectType;
  statusTurns?: number;
  requiresTelegraph?: boolean;
  telegraphLabel?: string;
  comboAfterStatus?: CriptaStatusEffectType;
  comboBonusMultiplier?: number;
  minAllyMissingHpRatio?: number;
  maxSelfHpRatio?: number;
}

export interface CriptaEnemyAiProfile {
  personality: CriptaEnemyAiPersonality;
  aggression: number;
  selfPreservation: number;
  allyProtection: number;
  statusPreference: number;
  coordination?: number;
  randomness: number;
  targetWeights: {
    lowHp: number;
    lowDefense: number;
    highThreat: number;
    highMagic?: number;
    highAttack?: number;
    vulnerableOrDebuffed?: number;
  };
  abilities?: CriptaEnemyAbilityDefinition[];
  phase2Profile?: Partial<CriptaEnemyAiProfile>;
}

export interface CriptaEnemyMemory {
  lastTargetId?: string | null;
  timesTargetedPlayer: Record<string, number>;
  consecutiveTargetCount?: number;
  lastAbilityId?: string | null;
  recentDamageByPlayer: Record<string, number>;
  protectedAllyId?: string | null;
  abilityCooldowns: Record<string, number>;
  abilityChargesUsed: Record<string, number>;
  preparedAbilityId?: string | null;
  preparedTargetIds?: string[];
}

export type CriptaPlayerRoundActionType =
  | 'ATTACK'
  | 'WEAPON_SPECIAL'
  | 'ABILITY'
  | 'ITEM'
  | 'DEFEND'
  | 'PASS';

export type CriptaWeaponId =
  | 'espada_oxidada'
  | 'baston_ceniza'
  | 'dagas_melladas'
  | 'arco_cazador'
  | 'maza_consagrada'
  | 'lanzador_alquimico'
  | 'espada_del_sepulcro'
  | 'espadon_del_rey_hundido'
  | 'hacha_forja_infernal'
  | 'vara_de_cristal_astral'
  | 'grimorio_prohibido_arma'
  | 'hojas_colmillo_venenoso'
  | 'arco_de_espinas'
  | 'ballesta_de_asedio'
  | 'simbolo_del_alba'
  | 'catalizador_esporas'
  | 'pico_de_minero_runico';

export type CriptaArmorId =
  | 'jubon_desgastado'
  | 'cota_de_malla_cripta'
  | 'coraza_del_sepulturero'
  | 'tunica_del_astrologo'
  | 'armadura_escamas_fungicas';

export type CriptaAccessoryId =
  | 'anillo_del_boticario'
  | 'colgante_de_cristal'
  | 'sello_del_cazador'
  | 'espejo_roto_accesorio';

export type CriptaWeaponFamily =
  | 'SWORD'
  | 'AXE'
  | 'BOW'
  | 'CROSSBOW'
  | 'DAGGER'
  | 'STAFF'
  | 'MACE'
  | 'ALCHEMICAL'
  | 'PICKAXE';

export interface CriptaWeaponSpecialAttack {
  id: string;
  name: string;
  description: string;
  targetRule: 'SINGLE' | 'CLEAVE_2' | 'CHAIN_2' | 'ALL_ENEMIES';
  cooldownRounds: number;
  damageMultiplier: number;
  secondaryMultiplier?: number;
  appliesStatus?: CriptaStatusEffectType;
  partyHealBase?: number;
  armorPierce?: number;
}

export interface CriptaWeaponDefinition {
  id: CriptaWeaponId;
  name: string;
  family: CriptaWeaponFamily;
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY';
  preferredClasses: CriptaCharacterId[];
  scalingStat: 'ATAQUE' | 'MAGIA';
  baseMinDamage: number;
  baseMaxDamage: number;
  bonusAttack?: number;
  bonusDefense?: number;
  bonusMagic?: number;
  critBonusPct?: number;
  undeadBonusPct?: number;
  healBoostPct?: number;
  potionBoostPct?: number;
  onHitStatus?: CriptaStatusEffectType;
  onCritStatus?: CriptaStatusEffectType;
  specialEffectText: string;
  specialAttack: CriptaWeaponSpecialAttack;
  basePriceGold: number;
  accentColor: string;
}

export interface CriptaArmorDefinition {
  id: CriptaArmorId;
  name: string;
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE';
  bonusDefense: number;
  bonusMaxHp: number;
  bonusMagic?: number;
  statusResistance?: CriptaStatusEffectType;
  specialEffectText: string;
  basePriceGold: number;
}

export interface CriptaAccessoryDefinition {
  id: CriptaAccessoryId;
  name: string;
  rarity: 'UNCOMMON' | 'RARE';
  bonusAttack?: number;
  bonusDefense?: number;
  bonusMagic?: number;
  critBonusPct?: number;
  potionBoostPct?: number;
  specialEffectText: string;
  basePriceGold: number;
}

export interface CriptaCombatRoundPhaseMap {
  phase: CriptaCombatRoundPhase;
}

export type CriptaCombatRoundPhase =
  | 'PLAYER_PHASE'
  | 'RESOLVING_PLAYERS'
  | 'ENEMY_PHASE_WARNING'
  | 'ENEMY_PHASE'
  | 'RESOLVING_ENEMIES'
  | 'END_OF_ROUND'
  | 'ROUND_END';

export interface CriptaQueuedPlayerAction {
  playerId: string;
  actionType: CriptaPlayerRoundActionType | 'USE_ITEM';
  abilityId?: string;
  targetId?: string;
  targetEnemyId?: string;
  targetPlayerId?: string;
  itemSlotIndex?: number;
  itemId?: CriptaItemId;
  locked?: boolean;
  lockedAt?: number;
  submittedAt?: number;
}

export type CriptaRoomEnemy = {
  id: string;
  slug: string;
  name: string;
  title: string;
  isElite: boolean;
  isMiniboss?: boolean;
  isBoss: boolean;
  isFinalBoss?: boolean;
  bossPhase?: 1 | 2;
  signatureMoveName?: string;
  enrageTriggered?: boolean;
  hp: number;
  maxHp: number;
  attack: number;
  armor: number;
  intent:
    | 'ATAQUE'
    | 'GUARDIA'
    | 'MALDICIÓN'
    | 'FURIA'
    | 'AFLICCIÓN'
    | 'CATACLISMO'
    | 'INVOCACIÓN'
    | 'CURACIÓN'
    | 'DEFENSA'
    | 'PROTECCIÓN'
    | 'PREPARANDO';
  intentValue: number;
  intentCategory?: 'ATTACK' | 'DEFEND' | 'MAGIC' | 'HEAL' | 'SPECIAL' | 'TELEGRAPH';
  accentColor: string;
  statusThreat?: CriptaStatusEffectType;
  statusSecondaryThreat?: CriptaStatusEffectType;
  abilityName?: string;
  poisonStacks?: number;
  vulnerableTurns?: number;
  roleTag?: 'TANK' | 'HEALER' | 'CASTER' | 'ASSASSIN' | 'BRUTE' | 'SWARM' | 'SUPPORT' | 'BOSS';
  aiProfile?: CriptaEnemyAiProfile;
  memory?: CriptaEnemyMemory;
  isDefending?: boolean;
  defendingRoundsRemaining?: number;
  armorBuffBonus?: number;
  armorBuffRounds?: number;
  attackBuffBonus?: number;
  attackBuffRounds?: number;
  protectingEnemyId?: string | null;
  protectedByEnemyId?: string | null;
  protectedByEnemyName?: string | null;
  preparedTelegraphLabel?: string | null;
  lastTargetedPlayerIds?: string[];
  approxMinDamage?: number;
  approxMaxDamage?: number;
  magicResistance?: number;
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
  kind: 'ITEM' | 'RELIC' | 'WEAPON' | 'ARMOR' | 'ACCESSORY' | 'FORGE_UPGRADE';
  itemId?: CriptaItemId;
  relicId?: CriptaRelicId;
  weaponId?: CriptaWeaponId;
  armorId?: CriptaArmorId;
  accessoryId?: CriptaAccessoryId;
  priceGold: number;
  soldOut: boolean;
  buyerName?: string;
}

export interface CriptaRoomInteractiveObject {
  id: string;
  label: string;
  hint: string;
  objectKind: 'SKULL' | 'WALL_CRACK' | 'MUSHROOM' | 'CHALICE' | 'SKELETON' | 'RUNE_TABLET';
  xPercent: number;
  yPercent: number;
  discovered: boolean;
  discoveredByPlayerName?: string;
  outcomeSummary?: string;
}

export type CriptaEncounterSubjectArchetype =
  | 'MERCHANT'
  | 'SPECTRAL_KNIGHT'
  | 'CURSED_WELL'
  | 'BLACKSMITH_FORGE'
  | 'ABYSSAL_MIRROR'
  | 'ANCIENT_SEAL'
  | 'INJURED_HOUND'
  | 'CAMPFIRE_SANCTUARY'
  | 'SACRED_SHRINE'
  | 'TREASURE_CHEST'
  | 'MECHANICAL_TRAP'
  | 'RUNIC_OBELISK';

export interface CriptaRoomInteractiveOption {
  id: string;
  label: string;
  subtitle: string;
  effectText: string;
  costGold?: number;
  costHp?: number;
  isReviveOption?: boolean;
  isWeaponUpgradeOption?: boolean;
  grantsWeaponId?: CriptaWeaponId;
  grantsArmorId?: CriptaArmorId;
  grantsAccessoryId?: CriptaAccessoryId;
  recommendedClass?: CriptaCharacterId;
  recommendedStat?: 'ATAQUE' | 'DEFENSA' | 'MAGIA' | 'VIDA';
  recommendedStatLevel?: number;
  riskLabel?: 'PARECE SEGURO' | 'ARRIESGADO' | 'MUY ARRIESGADO';
  ownershipScope?: 'PERSONAL' | 'GRUPO' | 'EXPEDICIÓN';
  requiresWeaponId?: CriptaWeaponId;
  requiresAccessoryId?: CriptaAccessoryId;
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
  encounterSubject?: {
    archetype: CriptaEncounterSubjectArchetype;
    name: string;
    roleSubtitle: string;
    dialogueQuote?: string;
    focusedPlayerId?: string | null;
  };
  interactiveObjects?: CriptaRoomInteractiveObject[];
  combatTurn?: number;
  combatRoundPhase?: CriptaCombatRoundPhase;
  combatBannerText?: string | null;
  queuedPlayerActions?: Record<string, CriptaQueuedPlayerAction>;
  activeCombatActorId?: string | null;
  activeEnemyActorId?: string | null;
  activeTargetedPlayerIds?: string[];
  activeTurnPlayerId?: string | null;
  actedPlayerIdsThisRound?: string[];
  enemies: CriptaRoomEnemy[];
  options: CriptaRoomInteractiveOption[];
  groundDrops?: CriptaRoomGroundDrop[];
  shopInventory?: CriptaShopSlot[];
  shopPurchaseHistory?: Array<{
    id: string;
    buyerName: string;
    itemName: string;
    priceGold: number;
    timestamp: number;
  }>;
  lifecyclePhase?: CriptaRoomLifecyclePhase;
  resolvedAtTimestamp?: number | null;
  isMinibossRoom?: boolean;
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
  | 'HEAL_ENEMY'
  | 'DEFEND_ENEMY'
  | 'BUFF_ENEMY'
  | 'SHIELD_ENEMY'
  | 'PROTECT_ENEMY'
  | 'TELEGRAPH_ENEMY'
  | 'MINIBOSS_ENRAGE'
  | 'MINIBOSS_DEFEATED'
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
  | 'ITEM_ACQUIRED'
  | 'ITEM_CONSUMED'
  | 'SHOP_PURCHASE'
  | 'WEAPON_EQUIPPED'
  | 'WEAPON_UPGRADED'
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
  sourceEnemyId?: string;
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
  actorEnemyId?: string;
  targetedPlayerIds?: string[];
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
  minibossDefeatedName?: string;
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
  minibossesDefeated?: number;
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

export interface CriptaRunEventFlags {
  freedSpectralKnight?: boolean;
  helpedGraveRobber?: boolean;
  fedCryptHound?: boolean;
  stoleSacredRelic?: boolean;
  shopDiscountPct?: number;
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
  /** Equipped Weapon, Upgrade Level (1..3), and Special Attack Cooldown */
  equippedWeaponId?: CriptaWeaponId | null;
  weaponUpgradeLevel?: 1 | 2 | 3;
  weaponSpecialCooldown?: number;
  /** Equipped Armor & Accessory slots */
  equippedArmorId?: CriptaArmorId | null;
  equippedAccessoryId?: CriptaAccessoryId | null;
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
  /** Internal combat threat & protection/taunt tracking */
  threatScore?: number;
  recentDamageDealt?: number;
  recentHealingDone?: number;
  isDefendingThisRound?: boolean;
  passedLastRound?: boolean;
  tauntTurnsRemaining?: number;
  protectedByPlayerId?: string | null;
  votedFinalBossDoor?: boolean;
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
  discoveredEnemyAbilityIds?: string[];
  eventFlags?: CriptaRunEventFlags;
  dungeonCompletionSummary?: CriptaDungeonCompletionSummary | null;
  runStats?: CriptaRunStats;
  finalBossState?: CriptaFinalBossState | null;
  runVictory?: boolean;
  dungeonSeed?: number;
  dungeonLengthTier?: CriptaDungeonLengthTier;
  partyGold?: number;
  currentRoomIndex?: number;
  transitioningToRoomIndex?: number | null;
  roomDoorTransition?: {
    active: boolean;
    fromRoomIndex: number;
    toRoomIndex: number;
    fromDungeonId: CriptaDungeonId;
    targetRoomType: CriptaCanonicalRoomType;
    targetRoomTitle: string;
    isEnteringMiniboss: boolean;
    isReturningToDoors: boolean;
    startedAt: number;
  } | null;
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
      type: 'LOCK_ROUND_ACTION';
      actionType: CriptaPlayerRoundActionType;
      abilityId?: string;
      targetEnemyId?: string;
      targetPlayerId?: string;
      itemSlotIndex?: number;
    }
  | {
      type: 'UNLOCK_ROUND_ACTION';
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
      type: 'INTERACT_ROOM_OBJECT';
      objectId: string;
    }
  | {
      type: 'UPGRADE_WEAPON';
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
