import type {
  CriptaCharacterId,
  CriptaCanonicalUppercaseId,
} from '../data/la-cripta/criptaCharacterContract';

export type {
  CriptaCharacterId,
  CriptaCanonicalUppercaseId,
};

export {
  ALL_CRIPTA_CHARACTER_IDS,
  ALL_CRIPTA_UPPERCASE_IDS,
  LA_CRIPTA_SCHEMA_VERSION,
} from '../data/la-cripta/criptaCharacterContract';



export type CriptaClassResourceKind =
  | 'GUARDIA'
  | 'CARGA_ARCANA'
  | 'COMBO'
  | 'ACECHO'
  | 'FERVOR'
  | 'REACTIVOS'
  | 'FURIA'
  | 'COMPAS'
  | 'ESENCIA'
  | 'NONE';

export interface CriptaClassResourceDefinition {
  kind: CriptaClassResourceKind;
  label: string;
  shortLabel?: string;
  minValue: number;
  maxValue: number;
  initialValue: number;
  accentColor: string;
  description: string;
}

export interface CriptaClassMechanicDefinition {
  mechanicId: string;
  classId: CriptaCharacterId;
  name: string;
  shortTag: string;
  shortDescription: string;
  gameplayLoopSummary: string;
  resource: CriptaClassResourceDefinition;
  uiRepresentation: {
    style: 'BLOCKS' | 'DIAMONDS' | 'PIPS' | 'CROSSHAIRS' | 'STARS' | 'VIALS' | 'BAR' | 'BEATS' | 'ORBS';
    maxPips: number;
    filledSymbol: string;
    emptySymbol: string;
  };
  combatHooks: {
    onBasicAttack: string;
    onDefend: string;
    onWeaponSpecial: string;
    onSkill1: string;
    onSkill2: string;
    onReceiveDamageOrBlock?: string;
    onEnemyKill?: string;
  };
  soloScaling: string;
  multiplayerSynergy: string;
  howToGain?: string;
  howToSpendOrTrigger?: string;
}

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
 * Every character has 7 primary stats on a 1..10 scale for segmented pixel bars:
 * VIDA (health), ATAQUE (attack), DEFENSA (defense), MAGIA (magic),
 * AGILIDAD (agility), PRECISIÓN (precision), VOLUNTAD (willpower)
 */
export interface CriptaCharacterStats {
  health: number; // VIDA (1..10)
  attack: number; // ATAQUE (1..10)
  defense: number; // DEFENSA (1..10)
  magic: number; // MAGIA (1..10)
  agility: number; // AGILIDAD (1..10) — Turn order, evasion, multi-action tempo
  precision: number; // PRECISIÓN (1..10) — Crit chance, crit multiplier, armor pierce
  willpower: number; // VOLUNTAD (1..10) — Status resistance, healing/shield/curse potency
}

export interface CriptaAbilityPlaceholder {
  id: string;
  name: string;
  artKey?: string;
  type: 'ACTIVA' | 'PASIVA' | 'COOPERATIVA';
  kind?: 'DAMAGE' | 'DEFEND' | 'HEAL' | 'DEBUFF' | 'BUFF' | 'UTILITY';
  category?: CriptaActionCategory;
  targetRule?: CriptaActionTargetRule;
  apCost?: number;
  dealsDamage?: boolean;
  healsParty?: boolean;
  healsSelfOrParty?: boolean;
  healAmount?: number;
  power?: number;
  shieldBonus?: number;
  shieldGrant?: number;
  purifyCount?: number;
  armorBreak?: number;
  statusToApply?: CriptaStatusEffectType;
  statusStacks?: number;
  statusTurns?: number;
  cleansesNegativeStatus?: boolean;
  description: string;
  cooldownTurns?: number;
  resourceGain?: number;
  resourceCost?: number;
  minResourceRequired?: number;
  consumesAllResource?: boolean;
  hpSacrificeCost?: number;
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
  resourceKind?: CriptaClassResourceKind;
  resourceName?: string;
  resourceMax?: number;
  resourceDescription?: string;
  classResource?: CriptaClassResourceDefinition;
  synergyHint?: string;
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
  biomeTag?: string;
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
  | 'MINIGAME'
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
  | 'MINIGAME'
  | 'SECRET'
  | 'MINIBOSS'
  | 'BOSS';

export type CriptaRoomLifecyclePhase =
  | 'ENTERING'
  | 'ACTIVE'
  | 'RESOLVING'
  | 'REWARD_PENDING'
  | 'REWARD_ANIMATING'
  | 'REWARDING'
  | 'SETTLING'
  | 'READY_TO_LEAVE'
  | 'EXITING'
  | 'TRANSITIONING_OUT'
  | 'COMPLETE';

export type CriptaRunPhase =
  | 'LOBBY'
  | 'DOOR_SELECTION'
  | 'ENTERING_DUNGEON'
  | 'DUNGEON_1'
  | 'DUNGEON_2'
  | 'DUNGEON_3'
  | 'DUNGEON_COMPLETE'
  | 'MAJOR_BOSS'
  | 'RUN_END';

export type CriptaDungeonLengthTier = 'CORTA' | 'MEDIA' | 'LARGA' | 'PROFUNDA';

export type CriptaRoomState =
  | 'LOCKED'
  | 'AVAILABLE'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'SKIPPED';

export type CriptaStatusEffectType =
  // Negative / DoT / Debuff / Control (15)
  | 'POISON'
  | 'BURN'
  | 'BLEED'
  | 'CONFUSION'
  | 'FEAR'
  | 'VULNERABLE'
  | 'MARKED'
  | 'BLINDED'
  | 'SILENCED'
  | 'STUNNED'
  | 'FROST'
  | 'CURSE'
  | 'CORROSION'
  | 'WEAKENED'
  | 'SLOW'
  // Positive / Buff / Defensive / Utility (16)
  | 'SHIELDED'
  | 'ARMORED'
  | 'REGENERATION'
  | 'BLESSED'
  | 'STRENGTHENED'
  | 'HASTE'
  | 'PRECISION'
  | 'CRIT_BOOST'
  | 'RESISTANCE'
  | 'COUNTER'
  | 'TAUNT'
  | 'IMMUNITY'
  | 'INSPIRATION'
  | 'MAGIC_BARRIER'
  | 'STEALTH'
  | 'TORCH_LIGHT'
  // Special / Boss Mystery Effect
  | 'ECLIPSE_DOOM';

export type CriptaStatusCategory =
  | 'DAMAGE_OVER_TIME'
  | 'CONTROL'
  | 'DEBUFF'
  | 'BUFF'
  | 'NEGATIVE_STATUS'
  | 'POSITIVE_STATUS'
  | 'DEFENSIVE_EFFECT'
  | 'CONTROL_EFFECT'
  | 'SPECIAL_BOSS_EFFECT';

export interface CriptaStatusCatalogEntry {
  id: CriptaStatusEffectType;
  category:
    | 'NEGATIVE_STATUS'
    | 'POSITIVE_STATUS'
    | 'BUFF'
    | 'DEBUFF'
    | 'DEFENSIVE_EFFECT'
    | 'CONTROL_EFFECT'
    | 'SPECIAL_BOSS_EFFECT';
  codexTab: 'POSITIVOS' | 'NEGATIVOS' | 'CONTROL' | 'ESPECIALES';
  displayName: string;
  code: string;
  shortDescription: string;
  fullDescription: string;
  iconDefinition: string;
  positiveOrNegative: 'POSITIVE' | 'NEGATIVE' | 'SPECIAL';
  stackable: boolean;
  maxStacks: number;
  defaultDurationType: 'TURN_END' | 'ACTION_TRIGGER' | 'EXPEDITION';
  defaultTurns: number;
  visualAccent: {
    color: string;
    borderColor: string;
    bgTint: string;
  };
  combatBehaviorReference: string;
  stackingRuleText: string;
  removalRuleText: string;
  isBossMysteryUntilSeen?: boolean;
}

export interface CriptaStatusEffectDefinition {
  id: CriptaStatusEffectType;
  name: string;
  code: string;
  category: CriptaStatusCategory;
  type: 'buff' | 'debuff' | 'relic';
  description: string;
  shortDescription?: string;
  icon: string;
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
  sourceName?: string;
  targetPlayerId?: string;
  remainingTurns: number;
  stacks: number;
  potency: number;
  appliedAtTurn: number;
}

export type CriptaEnemyProfession =
  | 'GUERRERO'
  | 'TANQUE'
  | 'BRUTO'
  | 'ASESINO'
  | 'TIRADOR'
  | 'CHAMÁN'
  | 'MAGO'
  | 'CURANDERO'
  | 'CONTROLADOR'
  | 'INVOCADOR'
  | 'SOPORTE'
  | 'ALQUIMISTA'
  | 'BERSERKER'
  | 'GUARDIÁN'
  | 'JEFE';

export interface CriptaEnemyVisualProfile {
  species: string;
  archetype: CriptaEnemyProfession;
  biome: CriptaDungeonId;
  bodyVariant: string;
  headVariant: string;
  armorVariant: string;
  weaponVariant: string;
  accessoryVariants: string[];
  accentPalette: {
    primary: string;
    secondary: string;
    trim: string;
    glow: string;
    eye: string;
  };
  idleAnimation:
    | 'HEAVY_BREATH'
    | 'FLOAT_BOB'
    | 'RITUAL_SWAY'
    | 'AGILE_CROUCH'
    | 'MECHANICAL_PULSE'
    | 'BERSERK_TREMOR';
  secondaryAnimations: string[];
  ambientEffect:
    | 'ORBIT_STARS'
    | 'ORBIT_VERTEBRAE'
    | 'SPORE_DRIFT'
    | 'SMOKE_CHARMS'
    | 'ABYSSAL_BUBBLES'
    | 'VOID_FRAGMENTS'
    | 'RUNE_PULSE'
    | 'ALCHEMICAL_VAPOR'
    | 'EMBER_SPARKS'
    | 'FROST_MIST'
    | 'BLOOD_DROPLETS'
    | 'ECLIPSE_CORONA'
    | 'NONE';
  combatEffects: string[];
  silhouetteModifier:
    | 'COMPACT'
    | 'TALL_LEAN'
    | 'WIDE_PLANTED'
    | 'COLOSSAL'
    | 'RECTANGULAR_FRAME'
    | 'CELESTIAL_TOTEM'
    | 'ASYMMETRIC_HULK'
    | 'STANDARD';
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

export type CriptaActionCategory =
  | 'ATTACK'
  | 'DEFEND'
  | 'HEAL'
  | 'BUFF'
  | 'DEBUFF'
  | 'UTILITY'
  | 'SUMMON_OR_SPECIAL';

export type CriptaActionTargetRule =
  | 'ENEMY_SINGLE'
  | 'ENEMY_MULTI'
  | 'CLEAVE_2'
  | 'CHAIN_2'
  | 'ALL_ENEMIES'
  | 'SELF'
  | 'ALLY_SINGLE'
  | 'ALL_ALLIES';

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
  | 'pico_de_minero_runico'
  | 'alabarda_del_juramento'
  | 'cetro_del_eclipse'
  | 'estoque_carmesi'
  | 'guadana_del_verdugo'
  | 'relicario_serafin'
  | 'martillo_del_juicio'
  | 'canon_de_azufre'
  | 'guantelete_mutageno'
  | 'gran_hacha_barbara'
  | 'mazo_colosal_rompecraneos'
  | 'laud_resonancia_arcana'
  | 'viola_del_eclipse'
  | 'guadana_de_hueso'
  | 'grimorio_sepulcral'
  | 'espada_bastarda_real'
  | 'dagas_sombra_nocturna';

export type CriptaArmorId =
  | 'jubon_desgastado'
  | 'cota_de_malla_cripta'
  | 'coraza_del_sepulturero'
  | 'tunica_del_astrologo'
  | 'armadura_escamas_fungicas'
  | 'manto_de_sombra_real'
  | 'placas_del_juramento';

export type CriptaAccessoryId =
  | 'anillo_del_boticario'
  | 'colgante_de_cristal'
  | 'sello_del_cazador'
  | 'espejo_roto_accesorio'
  | 'amuleto_rompeescudos'
  | 'reloj_de_arena_astral';

export type CriptaWeaponFamily =
  | 'SWORD'
  | 'AXE'
  | 'BOW'
  | 'CROSSBOW'
  | 'DAGGER'
  | 'STAFF'
  | 'MACE'
  | 'ALCHEMICAL'
  | 'PICKAXE'
  | 'HALBERD'
  | 'RELIC_TOME'
  | 'INSTRUMENT'
  | 'SCYTHE';

export type CriptaDamageType =
  | 'FISICO'
  | 'CONTUNDENTE'
  | 'PERFORANTE'
  | 'SAGRADO'
  | 'MAGICO'
  | 'FUEGO'
  | 'HIELO'
  | 'ALQUIMICO'
  | 'VENENO'
  | 'SOMBRA'
  | 'ASTRAL';

export type CriptaWeaponRuneId =
  | 'runa_brasa_infernal'
  | 'runa_escarcha_permafrost'
  | 'runa_luz_consagrada'
  | 'runa_plomo_contundente'
  | 'runa_toxina_abisal'
  | 'runa_vacio_umbrio'
  | 'runa_aguja_perforante'
  | 'runa_resonancia_astral';

export interface CriptaWeaponRuneDefinition {
  id: CriptaWeaponRuneId;
  name: string;
  subtitle: string;
  rarity: 'UNCOMMON' | 'RARE' | 'LEGENDARY';
  infusedDamageType: CriptaDamageType;
  secondaryDamageType?: CriptaDamageType;
  benefitText: string;
  tradeoffText: string;
  iconKind?:
    | 'rune_fire'
    | 'rune_ice'
    | 'rune_poison'
    | 'rune_holy'
    | 'rune_blunt'
    | 'rune_pierce'
    | 'rune_blood'
    | 'rune_shadow'
    | 'rune_astral';
  damageMultiplierDelta?: number;
  critBonusDeltaPct?: number;
  armorPierceBonus?: number;
  bonusAttackDelta?: number;
  bonusDefenseDelta?: number;
  bonusMagicDelta?: number;
  maxHpPenalty?: number;
  specialCooldownDelta?: number;
  specialHpCost?: number;
  specialHealParty?: number;
  executeBonusPctVsHalfHp?: number;
  extraPoisonStacksOnHit?: number;
  selfRecoilHpOnAttack?: number;
  onHitDrainHp?: number;
  onHitStatus?: CriptaStatusEffectType;
  onCritStatus?: CriptaStatusEffectType;
  disablesBleedAndPoison?: boolean;
  heavyArmorNonCritPenaltyPct?: number;
  magicScalingBonusPct?: number;
  basePriceGold: number;
  accentColor: string;
}

export interface CriptaWeaponSpecialAttack {
  id: string;
  name: string;
  description: string;
  category?: CriptaActionCategory;
  apCost?: number;
  dealsDamage?: boolean;
  targetRule: 'SINGLE' | 'CLEAVE_2' | 'CHAIN_2' | 'ALL_ENEMIES' | 'SELF' | 'ALL_ALLIES';
  cooldownRounds: number;
  damageMultiplier: number;
  secondaryMultiplier?: number;
  appliesStatus?: CriptaStatusEffectType;
  statusStacks?: number;
  poisonStacks?: number;
  vulnerableTurns?: number;
  partyHealBase?: number;
  partyShieldBase?: number;
  shieldGrant?: number;
  purifyCount?: number;
  armorPierce?: number;
  armorBreak?: number;
  lifestealFraction?: number;
  bonusVsDebuffedPct?: number;
}

export interface CriptaWeaponDefinition {
  id: CriptaWeaponId;
  name: string;
  family: CriptaWeaponFamily;
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY';
  preferredClasses: CriptaCharacterId[];
  scalingStat: 'ATAQUE' | 'MAGIA' | 'AGILIDAD' | 'PRECISION' | 'VOLUNTAD';
  secondaryScalingStat?: 'ATAQUE' | 'MAGIA' | 'AGILIDAD' | 'PRECISION' | 'VOLUNTAD';
  baseDamageType?: CriptaDamageType;
  secondaryDamageType?: CriptaDamageType;
  weaponArchetypeLabel?: string;
  baseMinDamage: number;
  baseMaxDamage: number;
  bonusAttack?: number;
  bonusDefense?: number;
  bonusMagic?: number;
  bonusAgility?: number;
  bonusPrecision?: number;
  bonusWillpower?: number;
  armorPierceBonus?: number;
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
  bonusAttack?: number;
  bonusMagic?: number;
  bonusAgility?: number;
  bonusPrecision?: number;
  bonusWillpower?: number;
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
  bonusAgility?: number;
  bonusPrecision?: number;
  bonusWillpower?: number;
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
  defense?: number;
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
  bleedStacks?: number;
  burnStacks?: number;
  frostTurns?: number;
  vulnerableTurns?: number;
  markedTurns?: number;
  curseTurns?: number;
  corrosionTurns?: number;
  stunTurns?: number;
  roleTag?: 'TANK' | 'HEALER' | 'CASTER' | 'ASSASSIN' | 'BRUTE' | 'SWARM' | 'SUPPORT' | 'BOSS';
  profession?: CriptaEnemyProfession;
  visualProfile?: CriptaEnemyVisualProfile;
  furiaActive?: boolean;
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
  healUsesRemaining?: number;
  healCooldownRounds?: number;
  totalHealedThisCombat?: number;
  totalHealsUsedThisCombat?: number;
  totalHpHealedThisCombat?: number;
  counterStanceActive?: boolean;
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
  dropId?: string;
  kind: 'ITEM' | 'RELIC' | 'WEAPON' | 'ARMOR' | 'ACCESSORY' | 'WEAPON_RUNE' | 'GOLD';
  type?: 'ITEM' | 'RELIC_PEDESTAL' | 'GOLD_POUCH' | 'WEAPON' | 'ARMOR' | 'ACCESSORY' | 'WEAPON_RUNE';
  label?: string;
  itemId?: CriptaItemId;
  relicId?: CriptaRelicId;
  weaponId?: CriptaWeaponId;
  armorId?: CriptaArmorId;
  accessoryId?: CriptaAccessoryId;
  weaponRuneId?: CriptaWeaponRuneId;
  goldAmount?: number;
  ownershipScope?: 'SHARED_PARTY' | 'FIRST_CLAIM' | 'PERSONAL_CHOICE';
  droppedByEnemyName: string;
  xPercent: number;
  claimed?: boolean;
  claimedByPlayerId?: string | null;
  claimedByPlayerName?: string;
}

export interface CriptaShopSlot {
  id: string;
  slotId?: string;
  kind: 'ITEM' | 'RELIC' | 'WEAPON' | 'ARMOR' | 'ACCESSORY' | 'FORGE_UPGRADE' | 'WEAPON_RUNE';
  name?: string;
  category?: string;
  rarity?: string;
  description?: string;
  itemId?: CriptaItemId;
  relicId?: CriptaRelicId;
  weaponId?: CriptaWeaponId;
  armorId?: CriptaArmorId;
  accessoryId?: CriptaAccessoryId;
  weaponRuneId?: CriptaWeaponRuneId;
  priceGold: number;
  soldOut: boolean;
  sold?: boolean;
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
  grantsWeaponRuneId?: CriptaWeaponRuneId;
  grantsRelicId?: CriptaRelicId;
  grantsItemId?: CriptaItemId;
  recommendedClass?: CriptaCharacterId;
  recommendedStat?: 'ATAQUE' | 'DEFENSA' | 'MAGIA' | 'VIDA';
  recommendedStatLevel?: number;
  riskLabel?: 'PARECE SEGURO' | 'ARRIESGADO' | 'MUY ARRIESGADO';
  ownershipScope?: 'PERSONAL' | 'GRUPO' | 'EXPEDICIÓN';
  requiresWeaponId?: CriptaWeaponId;
  requiresAccessoryId?: CriptaAccessoryId;
  visualDefinitionId?: string;
  eventId?: string;
  decisionId?: string;
  iconKey: 'sword' | 'shield' | 'heart' | 'gold' | 'key' | 'rune' | 'flame' | 'eye' | 'chalice' | 'potion';
  usedByPlayerIds: string[];
  resolved: boolean;
}

export type CriptaWeaponVisualFamily =
  | 'ESPADA'
  | 'ESPADÓN'
  | 'HACHA'
  | 'MARTILLO'
  | 'MAZA'
  | 'DAGA'
  | 'ARCO'
  | 'BALLESTA'
  | 'LANZA'
  | 'BÁCULO'
  | 'VARITA'
  | 'TOMO'
  | 'CETRO'
  | 'ESCUDO'
  | 'ARTEFACTO'
  | 'ALQUÍMICO';

export type CriptaWeaponEraStyle =
  | 'HIERRO_OXIDADO'
  | 'SEPULCRAL_ANTIGUO'
  | 'SOBERANO_HUNDIDO'
  | 'FORJA_INFERNAL'
  | 'ENANO_RUNICO'
  | 'BASTION_JURAMENTO'
  | 'CENIZA_ARCANA'
  | 'CRISTAL_ASTRAL'
  | 'VACIO_PROHIBIDO'
  | 'ECLIPSE_ABISAL'
  | 'FILO_CALLEJERO'
  | 'COLMILLO_MICOTICO'
  | 'IMPERIAL_CARMESI'
  | 'VERDUGO_SOMBRIO'
  | 'CAZADOR_BOSQUE'
  | 'RAIZ_ESPINOSA'
  | 'ASEDIO_PESADO'
  | 'AZUFRE_RUNICO'
  | 'LITURGIA_ALBA'
  | 'SERAFIN_SOLAR'
  | 'BOTICARIO_VOLATIL';

export interface WeaponVisualDefinition {
  weaponId: CriptaWeaponId | string;
  weaponFamily: CriptaWeaponVisualFamily;
  eraStyle: CriptaWeaponEraStyle;
  material: string;
  biomeOrigin?: CriptaDungeonId;
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY';
  spriteDefinition: {
    silhouetteId: string;
    primaryBladeOrHead: string;
    secondaryShade: string;
    deepShadow: string;
    specularHighlight: string;
    hiltOrShaft: string;
    accentGemOrRune: string;
  };
  idleEffect?: 'SHIMMER' | 'EMBER_GLOW' | 'ASTRAL_PULSE' | 'VENOM_DRIP' | 'HOLY_HALO' | 'SHADOW_MIST' | 'NONE';
  elementalEffect?: CriptaDamageType;
  attackEffect?: 'SLASH' | 'CLEAVE' | 'PIERCE' | 'ARCANE_BEAM' | 'HOLY_WAVE' | 'ALCHEMICAL_BLAST';
}

export type CriptaDecisionSceneType =
  | 'SUBMERGE_WEAPON_IN_WELL'
  | 'EXTRACT_WELL_ESSENCE'
  | 'SEAL_WELL_COVER'
  | 'DECIPHER_SPECTRAL_RUNES'
  | 'SHATTER_IRON_CHAINS'
  | 'BYPASS_PEDESTAL_SILENTLY'
  | 'STUDY_BLACKSMITH_PLANS'
  | 'STOKE_FORGE_CLAIM_STEEL'
  | 'TAKE_REMAINING_EMBERS'
  | 'CONTEMPLATE_ASTRAL_MIRROR'
  | 'SHATTER_MIRROR_WITH_STEEL'
  | 'COVER_MIRROR_WITH_CLOAK'
  | 'HEAL_INJURED_HOUND'
  | 'CLAIM_EXPLORER_STASH'
  | 'OFFER_RATIONS_AND_PASS'
  | 'FORGE_ALLIANCE'
  | 'PURIFY_BIOME_ALTAR_OR_FOUNTAIN'
  | 'BREAK_MAGICAL_SEAL'
  | 'SEARCH_FALLEN_CORPSE'
  | 'DRINK_FROM_FOUNTAIN'
  | 'IGNITE_BRAZIER_OR_CAMPFIRE'
  | 'REPAIR_OR_EQUIP_ARMOR'
  | 'FORGE_UPGRADE_EQUIPPED_WEAPON'
  | 'TACTICAL_COMBAT_TRAINING'
  | 'BLOOD_PACT_DARK_FORGE'
  | 'OPEN_TREASURE_CHEST'
  | 'DISARM_TRAP_GEARS'
  | 'SHIELD_AGAINST_TRAP'
  | 'BREACH_ARSENAL_GATE'
  | 'DISCOVER_RUNIC_WALL_CRACK'
  | 'BUY_PURIFYING_ELIXIR'
  | 'CROSS_DUNGEON_DOOR';

export type CriptaDecisionAnimationType =
  | 'WATER_RIPPLES'
  | 'WEAPON_SHIMMER'
  | 'POTION_BUBBLES'
  | 'FLAME_FLICKER'
  | 'DOOR_TORCH_AND_PANELS'
  | 'TREASURE_SPARKLE'
  | 'RELIC_PULSE'
  | 'SCROLL_FLUTTER'
  | 'CRYSTAL_REFRACTION'
  | 'SPARKS_ANVIL'
  | 'CLEANSING_RAYS'
  | 'SEAL_CRACKING';

export interface DecisionVisualDefinition {
  id: string;
  biomeId: CriptaDungeonId;
  eventId: string;
  decisionId: string;
  sceneType: CriptaDecisionSceneType;
  subject: string;
  secondarySubject?: string;
  environmentElement?: string;
  animationType: CriptaDecisionAnimationType;
  palette: {
    bgTop: string;
    bgBottom: string;
    stonePrimary: string;
    stoneHighlight: string;
    liquidOrGlow: string;
    liquidSecondary: string;
    accent: string;
    particle: string;
  };
  visualLayers: {
    background: string;
    middle: string;
    foreground: string;
    effects: string[];
  };
  rarityTreatment?: 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY';
}

export type CriptaMinigameKind =
  | 'RUNE_MEMORY'
  | 'LOCKPICK_TUMBLER'
  | 'TRAP_STEPPING_STONES'
  | 'SOUL_WHEEL'
  | 'GUARDIAN_SIGILS'
  | 'ARCANE_LOCK'
  | 'PRESSURE_PLATES'
  | 'ALCHEMICAL_MIXTURE'
  | 'ALCHEMICAL_MIX'
  | 'TREASURE_MEMORY'
  | 'CURSE_DODGE'
  | 'SHARED_BEAM'
  | 'CHEST_OF_GREED'
  | 'PULSE_SEALS'
  | 'FORBIDDEN_CHESTS'
  | 'CURSED_ROULETTE'
  | 'WHEEL_OF_FORTUNE';

export type CriptaMinigameResultTier =
  | 'PENDING'
  | 'PERFECT_SUCCESS'
  | 'SUCCESS'
  | 'PARTIAL_SUCCESS'
  | 'FAILURE';

export type CriptaMinigameVisualSkin =
  | 'CRYPT_STONE'
  | 'ROTTEN_SPORES'
  | 'INFERNAL_FORGE'
  | 'SUNKEN_TEMPLE'
  | 'ASTRAL_BRASS'
  | 'MIRROR_SILVER'
  | 'CURSED_CHAINS'
  | 'GLACIAL_ICE'
  | 'ABYSS_VOID';

export interface CriptaRouletteSpinRecord {
  spinId: string;
  playerId: string;
  playerName: string;
  segmentIndex: number;
  segmentId: string;
  segmentLabel: string;
  segmentCategory: 'GOLD' | 'HEAL' | 'BUFF' | 'ITEM' | 'RELIC' | 'WEAPON_UPGRADE' | 'NOTHING' | 'CURSE' | 'DAMAGE' | 'DEBUFF' | 'DOUBLE_PRIZE' | 'EXTRA_SPIN';
  summaryText: string;
  targetAngleDeg: number;
  startedAt: number;
  durationMs: number;
}

export type CriptaMinigameFamilyId =
  | 'RUNIC_MEMORY'
  | 'CURSED_ROULETTE'
  | 'PRESSURE_SIGILS'
  | 'CRYPT_LOCK'
  | 'ALCHEMICAL_BALANCE'
  | 'SOUL_CHAINS'
  | 'SHADOW_MIRRORS'
  | 'COOP_GAMBLE_CHEST'
  | 'ECLIPSE_PULSE'
  | 'FORBIDDEN_COFFERS';

export interface CriptaMinigameRouletteSector {
  id: string;
  label: string;
  shortLabel: string;
  outcomeType: string;
  isPositive: boolean;
  color: string;
  iconKind: string;
  goldDelta?: number;
  hpDelta?: number;
  statusType?: CriptaStatusEffectType;
  statusTurns?: number;
  itemId?: CriptaItemId;
  relicId?: CriptaRelicId;
  weaponId?: CriptaWeaponId;
  description: string;
}

export interface CriptaRoomMinigameState {
  minigameInstanceId?: string;
  family?: CriptaMinigameFamilyId;
  kind: CriptaMinigameKind;
  minigameType?:
    | 'RUNE_SEQUENCE'
    | 'LOCKPICK_TIMING'
    | 'TRAP_STEPPING'
    | 'ALCHEMICAL_BALANCE'
    | 'WHEEL_OF_FORTUNE'
    | 'ARCANE_DECIPHER'
    | 'TIMING_ALTAR'
    | 'PRESSURE_PLATES';
  visualSkin?: CriptaMinigameVisualSkin;
  biomeSubtitle?: string;
  biomeTheme?: CriptaDungeonId;
  title: string;
  subtitle?: string;
  instructions: string;
  shortRules?: string[];
  difficultyTier?: 'NORMAL' | 'DIFICIL' | 'MAESTRO';
  phase?: 'INTRO' | 'MEMORIZE' | 'ACTIVE' | 'SPINNING' | 'RESULT';
  completed: boolean;
  failed: boolean;
  succeeded?: boolean;
  resultTier?: CriptaMinigameResultTier;
  step: number;
  currentStep?: number;
  maxSteps: number;
  attemptsLeft: number;
  attemptsRemaining?: number;
  maxAttempts?: number;
  mistakes?: number;
  maxMistakes?: number;
  alchemicalMeter?: number;
  wheelOutcomeIndex?: number | null;
  wheelOutcomeLabel?: string | null;
  targetPattern: number[];
  targetSequence?: number[];
  currentProgress: number[];
  playerInputs?: number[];
  lastOutcomeText?: string;
  rewardSummary?: string;
  rewardGold?: number;
  rewardRelicId?: CriptaRelicId;
  rewardItemId?: CriptaItemId;
  rewardWeaponId?: CriptaWeaponId;
  rewardStatusId?: CriptaStatusEffectType;
  rewardBlessingStatus?: CriptaStatusEffectType;
  failureStatusId?: CriptaStatusEffectType;
  failurePenaltyHp?: number;
  failureStatus?: CriptaStatusEffectType;
  startedAtMs?: number;
  runePlayerAssignments?: Record<string, number[]>;
  rouletteSectors?: CriptaMinigameRouletteSector[];
  rouletteSpinCount?: number;
  rouletteRerollCostGold?: number;
  rouletteCanReroll?: boolean;
  rouletteLandedSectorIndex?: number;
  rouletteLandingAngleDeg?: number;
  rouletteSpinStartedAt?: number;
  sigilClueSymbols?: string[];
  sigilActivePlates?: Record<string, number>;
  sigilLockedPlates?: number[];
  lockRingAngles?: number[];
  lockTargetAngles?: number[];
  lockRingLocked?: boolean[];
  alchemyPressure?: number;
  alchemyOptimalMin?: number;
  alchemyOptimalMax?: number;
  alchemyStepsRemaining?: number;
  alchemyHistory?: string[];
  chainsIntegrity?: number[];
  chainsBroken?: boolean[];
  chainsWeakIndices?: number[];
  chainsTrapIndex?: number;
  mirrorBeamPath?: number[];
  mirrorTargetLit?: boolean;
  gambleChestTier?: number;
  gambleMaxTier?: number;
  gambleAccumulatedGold?: number;
  gambleCurseChancePct?: number;
  gamblePlayerVotes?: Record<string, string>;
  sweetSpotStart?: number;
  sweetSpotEnd?: number;
  pulseHitQualities?: string[];
  cofferClues?: string[];
  cofferTrueIndex?: number;
  cofferMimicIndex?: number;
  cofferOpenedIndices?: number[];
  cofferPlayerMarks?: Record<string, number>;
  /** Cooperative & specialized family state */
  playerClues?: Record<string, string[]>;
  assignedPlayerRoles?: Record<string, string>;
  /** Roulette state */
  rouletteTurnOrder?: string[];
  rouletteCurrentPlayerId?: string | null;
  rouletteSpinsCompleted?: Record<string, CriptaRouletteSpinRecord>;
  rouletteActiveSpin?: CriptaRouletteSpinRecord | null;
  /** Simultaneous / sequential Sigils state */
  sigilsActivatedByPlayer?: Record<string, number>;
  sigilsHoldTimestamp?: Record<string, number>;
  /** Arcane Lock rotating rings state (angles 0..7 in 45° increments) */
  ringCurrentSteps?: number[];
  ringTargetSteps?: number[];
  ringConnections?: number[][];
  /** Pressure Plates state */
  plateValues?: Array<{ id: number; symbol: string; label: string; weight: number }>;
  plateTargetSum?: number;
  selectedPlateIndices?: number[];
  /** Alchemical Mixture state */
  alchemyIngredients?: Array<{
    id: string;
    name: string;
    heat: number;
    stability: number;
    toxicity: number;
    color: string;
  }>;
  alchemySelectedIds?: string[];
  alchemyTarget?: {
    minHeat: number;
    maxHeat: number;
    minStability: number;
    maxToxicity: number;
  };
  /** Treasure Memory state */
  memoryCards?: Array<{
    index: number;
    symbolId: string;
    symbolLabel: string;
    matched: boolean;
    revealed: boolean;
  }>;
  memoryFlippedIndices?: number[];
  /** Curse Dodge state */
  dodgeWave?: number;
  dodgeMaxWaves?: number;
  dodgeSafeZone?: { x: number; y: number; radius: number; label: string };
  dodgePlayerHits?: Record<string, number>;
  dodgePlayerSafeReady?: Record<string, boolean>;
  /** Shared Beam mirror puzzle state */
  mirrorOrientations?: number[];
  mirrorSolution?: number[];
  /** Chest of Greed state */
  greedRound?: number;
  greedPotGold?: number;
  greedRiskPct?: number;
  greedVotes?: Record<string, 'CONTINUE' | 'BANK'>;
  /** Forbidden Chests observation puzzle */
  forbiddenChests?: Array<{
    index: number;
    title: string;
    visualTrait: string;
    particleTrait: string;
    isSafe: boolean;
    isBest: boolean;
    opened: boolean;
  }>;
  forbiddenClues?: string[];
  lastPenaltyDetail?: {
    penaltyType: 'HP_DRAIN' | 'CURSE_DEBUFF' | 'GOLD_DRAIN' | 'MECHANISM_SEALED';
    title: string;
    description: string;
    hpLost?: number;
    goldLost?: number;
    statusApplied?: string;
    targetPlayerName?: string;
    mistakeNumber: number;
    maxMistakes: number;
    timestamp: number;
  } | null;
}

export type CriptaChoicePolicy =
  | 'REQUIRED_PER_PLAYER'
  | 'OPTIONAL_PER_PLAYER'
  | 'REQUIRED_GROUP'
  | 'OPTIONAL_GROUP'
  | 'FREE_LOOT';

export interface CriptaDungeonRoom {
  id: string;
  index: number; // 0-indexed position in sequence
  roomNumber: number; // 1-indexed display number
  dungeonId: CriptaDungeonId;
  type: CriptaCanonicalRoomType;
  choicePolicy?: CriptaChoicePolicy;
  state: CriptaRoomState;
  revealed: boolean;
  visited: boolean;
  resolved: boolean;
  title: string;
  subtitle: string;
  narrative: string;
  outcomeLog: string | null;
  biomeVariant: number;
  minigame?: CriptaRoomMinigameState;
  shopRerollCount?: number;
  shopSlots?: CriptaShopSlot[];
  roundNumber?: number;
  hasSecretEntrance?: boolean;
  secretDiscovered?: boolean;
  secretClueText?: string;
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
  turnId?: string | null;
  turnSequenceNumber?: number;
  turnActionConsumed?: boolean;
  lastActionNonce?: string | null;
  currentTurnAp?: number;
  maxTurnAp?: number;
  consumableUsedThisTurn?: boolean;
  lastPlayedCardTitle?: string | null;
  lastPlayedByPlayerName?: string | null;
  actedPlayerIdsThisRound?: string[];
  rewardSummary?: {
    goldGranted: number;
    healGranted: number;
    itemDropsCount: number;
    relicDropsCount: number;
  } | null;
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
  playerShopChoices?: Record<string, { choice: string; timestamp: number }>;
  playerOpportunityChoices?: Record<string, string>;
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
  decisionVoteTieWarning?: boolean;
  canonicalType?: string;
  actionConsumedThisTurn?: boolean;
  turnActionLocked?: boolean;
}

export type CriptaVisualEventKind =
  | 'DAMAGE_ENEMY'
  | 'CRIT_ENEMY'
  | 'ENEMY_DEATH'
  | 'ENEMY_ATTACK'
  | 'PLAYER_DEATH'
  | 'EXPEDITION_DEFEATED'
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
    | 'blunt'
    | 'pierce'
    | 'arcane'
    | 'holy'
    | 'alchemy'
    | 'arrow'
    | 'shield'
    | 'claw'
    | 'explosion'
    | 'gold'
    | 'revive'
    | 'heal'
    | 'lifesteal';
  isCrit?: boolean;
  damageType?: CriptaDamageType;
}

export type CombatPresentationEventType =
  | 'ACTION_START'
  | 'ANTICIPATION'
  | 'ATTACK_ANIMATION'
  | 'PROJECTILE'
  | 'IMPACT'
  | 'DAMAGE'
  | 'HEAL'
  | 'BLOCK'
  | 'SHIELD_GAIN'
  | 'ARMOR_GAIN'
  | 'BUFF'
  | 'DEBUFF'
  | 'STATUS_APPLY'
  | 'STATUS_REMOVE'
  | 'CRITICAL'
  | 'MISS'
  | 'DODGE'
  | 'COUNTER'
  | 'LIFESTEAL'
  | 'ENEMY_DEATH'
  | 'PLAYER_DOWN'
  | 'LOOT_REVEAL'
  | 'DECISION_LOCK'
  | 'ACTION_END';

export interface CombatPresentationEvent {
  id: string;
  actionId: string;
  type: CombatPresentationEventType;
  actorId?: string;
  targetIds: string[];
  payload?: {
    value?: number;
    label?: string;
    sublabel?: string;
    color?: string;
    statusType?: CriptaStatusEffectType;
    damageType?: CriptaDamageType | string;
    vfxStyle?: CriptaVisualEvent['vfxStyle'];
    isCrit?: boolean;
    isEnemyActor?: boolean;
    visualEvent?: CriptaVisualEvent;
  };
  priority: number;
  duration: number;
  blocking: boolean;
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
  supportActionsUsed?: number;
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
  agility?: number;
  precision?: number;
  willpower?: number;
  bonusAttack?: number;
  bonusDefense?: number;
  bonusMagic?: number;
  bonusAgility?: number;
  bonusPrecision?: number;
  bonusWillpower?: number;
  classResource?: number;
  maxClassResource?: number;
  classResourceKind?: CriptaClassResourceKind;
  /** Equipped Weapon, Upgrade Level (1..3), Special Attack Cooldown & Elemental Infusion Rune */
  equippedWeaponId?: CriptaWeaponId | null;
  weaponUpgradeLevel?: 1 | 2 | 3;
  weaponSpecialCooldown?: number;
  equippedWeaponRuneId?: CriptaWeaponRuneId | null;
  ownedWeaponRuneIds?: CriptaWeaponRuneId[];
  ownedWeaponRunes?: CriptaWeaponRuneId[];
  abilityCooldown?: number;
  abilityCooldowns?: Record<string, number>;
  basicAttackUsedThisTurn?: boolean;
  learnedTechniqueIds?: string[];
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
  runPhase?: CriptaRunPhase;
  completedDoorCount?: number; // 0, 1, 2, or 3
  completedDungeonCount?: number; // 0, 1, 2, or 3 (synchronized alias)
  completedDungeonIds?: CriptaDungeonId[];
  completedBiomes?: CriptaDungeonId[];
  currentDungeonId?: CriptaDungeonId | null;
  currentDungeonInstanceId?: string | null;
  currentRoomId?: string | null;
  currentRoomPhase?: CriptaRoomLifecyclePhase;
  completedRoomIds?: string[];
  currentRewardState?: {
    roomId: string;
    hasUnclaimedDrops: boolean;
    unclaimedDropCount: number;
    goldEarned: number;
    healGranted: number;
  } | null;
  currentTransitionState?: {
    active: boolean;
    kind: 'ENTERING_DUNGEON' | 'ROOM_TO_ROOM' | 'RETURNING_TO_DOORS' | 'FINAL_BOSS_ENTRANCE';
    startedAt: number;
  } | null;
  majorBossUnlocked?: boolean;
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
  defeatReason?: string | null;
  defeatedByEnemyName?: string | null;
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
      turnId?: string;
      actionNonce?: string;
    }
  | {
      type: 'LOCK_ROUND_ACTION';
      actionType: CriptaPlayerRoundActionType;
      abilityId?: string;
      targetEnemyId?: string;
      targetPlayerId?: string;
      itemSlotIndex?: number;
      turnId?: string;
      actionNonce?: string;
      cardId?: string;
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
      type: 'ROOM_MINIGAME_ACTION';
      actionIndex: number;
      precisionScore?: number;
      subAction?: string;
      payloadValue?: number | string;
    }
  | {
      type: 'ROOM_MINIGAME_INPUT';
      stepValue: number;
    }
  | {
      type: 'SHOP_REROLL';
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
      type: 'EQUIP_WEAPON_RUNE';
      runeId: CriptaWeaponRuneId | null;
    }
  | {
      type: 'PASS_SHOP_CHOICE';
    }
  | {
      type: 'TRADE_ITEM';
      targetPlayerId: string;
      slotIndex: number;
    }
  | {
      type: 'TRADE_GOLD';
      targetPlayerId: string;
      amount: number;
    }
  | {
      type: 'UPGRADE_ATTRIBUTE';
      attribute: 'attack' | 'defense' | 'magic' | 'agility' | 'precision' | 'willpower' | 'health';
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
      code?: string;
      characterId?: string;
      [key: string]: unknown;
    }
  | {
      type: 'PONG';
    };
