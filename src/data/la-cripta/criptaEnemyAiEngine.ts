import type {
  CriptaDungeonRoom,
  CriptaEnemyAbilityDefinition,
  CriptaEnemyActionKind,
  CriptaEnemyAiPersonality,
  CriptaEnemyAiProfile,
  CriptaEnemyMemory,
  CriptaEnemyProfession,
  CriptaPlayer,
  CriptaRoomEnemy,
  CriptaStatusEffectType,
} from '../../types/laCripta';
import { CRIPTA_CHARACTERS_CATALOG } from './criptaCatalog';
import { playerHasStatus } from './criptaStatusEffects';
import { resolveEnemyVisualBlueprint } from './criptaBiomeBestiary';

/**
 * Deterministic seeded PRNG for authoritative Enemy AI decisions.
 * Refreshing or reconnecting never rerolls a resolved enemy decision.
 */
export function createEnemyAiRng(seed: number, round: number, step: number): () => number {
  let state = ((seed ^ (round * 0x9e3779b9) ^ (step * 0x85ebca6b)) >>> 0) || 0x1337beef;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createInitialEnemyMemory(): CriptaEnemyMemory {
  return {
    lastTargetId: null,
    timesTargetedPlayer: {},
    consecutiveTargetCount: 0,
    lastAbilityId: null,
    recentDamageByPlayer: {},
    protectedAllyId: null,
    abilityCooldowns: {},
    abilityChargesUsed: {},
    preparedAbilityId: null,
    preparedTargetIds: [],
  };
}

/**
 * Assigns a data-driven AI personality, roleTag, and ability kit to an enemy
 * based on its archetype, slug, and whether it is an Elite, Dungeon Boss, or Final Boss.
 */
export function buildEnemyAiProfileForArchetype(
  enemy: Pick<
    CriptaRoomEnemy,
    | 'slug'
    | 'name'
    | 'isElite'
    | 'isBoss'
    | 'isFinalBoss'
    | 'bossPhase'
    | 'spriteArchetype'
    | 'statusThreat'
    | 'statusSecondaryThreat'
    | 'abilityName'
    | 'profession'
  >,
  roomIndex = 0
): {
  roleTag: NonNullable<CriptaRoomEnemy['roleTag']>;
  profession: CriptaEnemyProfession;
  aiProfile: CriptaEnemyAiProfile;
} {
  const slugLower = (enemy.slug || '').toLowerCase();
  const arch = enemy.spriteArchetype;
  const primaryStatus: CriptaStatusEffectType = enemy.statusThreat || 'POISON';
  const secondaryStatus: CriptaStatusEffectType = enemy.statusSecondaryThreat || 'BLEED';
  const resolvedBp = resolveEnemyVisualBlueprint(enemy);
  const profession: CriptaEnemyProfession =
    enemy.isFinalBoss || enemy.isBoss
      ? 'JEFE'
      : enemy.profession || resolvedBp.profession || 'GUERRERO';

  // 1. FINAL BOSS (2-Phase Hybrid Scripted + Tactical AI)
  if (enemy.isFinalBoss) {
    const isPhase2 = enemy.bossPhase === 2;
    const bossAbilities: CriptaEnemyAbilityDefinition[] = isPhase2
      ? [
          {
            id: 'boss_p2_void_strike',
            name: 'Golpe del Vacío',
            actionKind: 'SPECIAL_ATTACK',
            targetScope: 'ONE_PLAYER',
            basePriority: 64,
            damageMultiplier: 1.25,
            comboAfterStatus: 'MARKED',
            comboBonusMultiplier: 1.35,
          },
          {
            id: 'boss_p2_mark_void',
            name: 'Marca del Vacío',
            actionKind: 'APPLY_STATUS',
            targetScope: 'ONE_PLAYER',
            basePriority: 68,
            cooldownRounds: 2,
            damageMultiplier: 0.75,
            statusToApply: 'MARKED',
            statusTurns: 2,
          },
          {
            id: 'boss_p2_eclipse_cataclysm',
            name: 'Cataclismo del Eclipse',
            actionKind: 'SPECIAL_BOSS_ACTION',
            targetScope: 'ALL_PLAYERS',
            basePriority: 78,
            cooldownRounds: 3,
            damageMultiplier: 0.9,
            statusToApply: 'BURN',
            statusTurns: 2,
            requiresTelegraph: true,
            telegraphLabel: 'EL CORAZÓN DEL ABISMO ESTÁ CARGANDO...',
          },
          {
            id: 'boss_p2_protect_shard',
            name: 'Égida del Eclipse',
            actionKind: 'PROTECT_ALLY',
            targetScope: 'ALLY_ENEMY',
            basePriority: 66,
            cooldownRounds: 2,
            armorBonus: 3,
          },
          {
            id: 'boss_p2_summon_shard',
            name: 'Invocar Esquirla del Corazón',
            actionKind: 'SUMMON',
            targetScope: 'SELF',
            basePriority: 74,
            cooldownRounds: 4,
            maxCharges: 1,
          },
          {
            id: 'boss_p2_carapace',
            name: 'Caparazón Abisal',
            actionKind: 'DEFEND_SELF',
            targetScope: 'SELF',
            basePriority: 52,
            cooldownRounds: 3,
            armorBonus: 4,
            maxSelfHpRatio: 0.65,
          },
        ]
      : [
          {
            id: 'boss_p1_chained_cleave',
            name: 'Tajo de Cadenas Rúnicas',
            actionKind: 'ATTACK',
            targetScope: 'ONE_PLAYER',
            basePriority: 58,
            damageMultiplier: 1.0,
          },
          {
            id: 'boss_p1_void_mark',
            name: 'Marca del Vacío',
            actionKind: 'APPLY_STATUS',
            targetScope: 'ONE_PLAYER',
            basePriority: 65,
            cooldownRounds: 2,
            damageMultiplier: 0.75,
            statusToApply: 'MARKED',
            statusTurns: 2,
          },
          {
            id: 'boss_p1_void_strike',
            name: 'Golpe del Vacío',
            actionKind: 'SPECIAL_ATTACK',
            targetScope: 'ONE_PLAYER',
            basePriority: 62,
            cooldownRounds: 2,
            damageMultiplier: 1.25,
            comboAfterStatus: 'MARKED',
            comboBonusMultiplier: 1.35,
          },
          {
            id: 'boss_p1_seal_curse',
            name: enemy.abilityName || 'Cadenas de los Tres Sellos',
            actionKind: 'DEBUFF_PLAYER',
            targetScope: 'RANDOM_N_PLAYERS',
            randomTargetsCount: 2,
            basePriority: 64,
            cooldownRounds: 3,
            damageMultiplier: 0.8,
            statusToApply: primaryStatus,
            statusTurns: 2,
            requiresTelegraph: true,
            telegraphLabel: 'PREPARANDO: CADENAS DE LOS TRES SELLOS',
          },
          {
            id: 'boss_p1_carapace',
            name: 'Caparazón de Obsidiana',
            actionKind: 'DEFEND_SELF',
            targetScope: 'SELF',
            basePriority: 54,
            cooldownRounds: 3,
            armorBonus: 3,
            maxSelfHpRatio: 0.75,
          },
        ];

    return {
      roleTag: 'BOSS',
      profession: 'JEFE',
      aiProfile: {
        personality: 'BOSS',
        aggression: isPhase2 ? 0.86 : 0.68,
        selfPreservation: isPhase2 ? 0.45 : 0.55,
        allyProtection: isPhase2 ? 0.72 : 0.4,
        statusPreference: isPhase2 ? 0.75 : 0.65,
        coordination: isPhase2 ? 0.85 : 0.6,
        randomness: isPhase2 ? 0.14 : 0.18,
        targetWeights: {
          lowHp: isPhase2 ? 0.72 : 0.48,
          lowDefense: 0.42,
          highThreat: isPhase2 ? 0.78 : 0.62,
          highMagic: 0.5,
          vulnerableOrDebuffed: 0.75,
        },
        abilities: bossAbilities,
      },
    };
  }

  // 2. DUNGEON BOSS (Biome Lord)
  if (enemy.isBoss) {
    return {
      roleTag: 'BOSS',
      profession: 'JEFE',
      aiProfile: {
        personality: 'BOSS',
        aggression: 0.72,
        selfPreservation: 0.52,
        allyProtection: 0.55,
        statusPreference: 0.68,
        coordination: 0.7,
        randomness: 0.18,
        targetWeights: {
          lowHp: 0.58,
          lowDefense: 0.45,
          highThreat: 0.68,
          highMagic: 0.42,
          vulnerableOrDebuffed: 0.65,
        },
        abilities: [
          {
            id: 'dungeon_boss_strike',
            name: 'Golpe Soberano',
            actionKind: 'ATTACK',
            targetScope: 'ONE_PLAYER',
            basePriority: 56,
            damageMultiplier: 1.0,
          },
          {
            id: 'dungeon_boss_mark',
            name: 'Marca de Ejecución',
            actionKind: 'APPLY_STATUS',
            targetScope: 'ONE_PLAYER',
            basePriority: 64,
            cooldownRounds: 2,
            damageMultiplier: 0.75,
            statusToApply: 'MARKED',
            statusTurns: 2,
          },
          {
            id: 'dungeon_boss_combo_finisher',
            name: enemy.abilityName || 'Castigo del Señor',
            actionKind: 'SPECIAL_ATTACK',
            targetScope: 'ONE_PLAYER',
            basePriority: 62,
            cooldownRounds: 2,
            damageMultiplier: 1.3,
            statusToApply: primaryStatus,
            statusTurns: 2,
            comboAfterStatus: 'MARKED',
            comboBonusMultiplier: 1.3,
          },
          {
            id: 'dungeon_boss_tempest',
            name: `Tempestad: ${enemy.abilityName || 'Furia del Bioma'}`,
            actionKind: 'SPECIAL_BOSS_ACTION',
            targetScope: 'RANDOM_N_PLAYERS',
            randomTargetsCount: 2,
            basePriority: 72,
            cooldownRounds: 3,
            damageMultiplier: 0.88,
            statusToApply: secondaryStatus,
            statusTurns: 2,
            requiresTelegraph: true,
            telegraphLabel: `PREPARANDO: ${(enemy.abilityName || 'FURIA DEL BIOMA').toUpperCase()}`,
          },
          {
            id: 'dungeon_boss_guard',
            name: 'Baluarte del Trono',
            actionKind: 'DEFEND_SELF',
            targetScope: 'SELF',
            basePriority: 52,
            cooldownRounds: 3,
            armorBonus: 3,
            maxSelfHpRatio: 0.65,
          },
        ],
      },
    };
  }

  // 3. CHAMÁN (Section 8: Curación Oscura CD 3T when ally < 60% HP, Bendición Profana, Maldición, Descarga Mística)
  if (
    profession === 'CHAMÁN' ||
    slugLower.includes('chaman') ||
    slugLower.includes('esfera_armilar') ||
    slugLower.includes('acolito_de_hueso')
  ) {
    const healBase = Math.max(14, Math.round(15 + roomIndex * 2));
    return {
      roleTag: 'HEALER',
      profession: 'CHAMÁN',
      aiProfile: {
        personality: 'SUPPORT',
        aggression: 0.42,
        selfPreservation: 0.72,
        allyProtection: 0.85,
        statusPreference: 0.65,
        coordination: 0.78,
        randomness: 0.18,
        targetWeights: {
          lowHp: 0.35,
          lowDefense: 0.3,
          highThreat: 0.55,
          highMagic: 0.5,
          vulnerableOrDebuffed: 0.45,
        },
        abilities: [
          {
            id: 'shaman_dark_heal',
            name: 'Curación Oscura',
            actionKind: 'HEAL_ALLY',
            targetScope: 'ALLY_ENEMY',
            basePriority: 84,
            cooldownRounds: 3,
            maxCharges: 2,
            healAmount: healBase,
            minAllyMissingHpRatio: 0.4, // Only when ally is below 60% HP!
          },
          {
            id: 'shaman_profane_blessing',
            name: 'Bendición Profana',
            actionKind: 'BUFF_ALLY',
            targetScope: 'ALLY_ENEMY',
            basePriority: 68,
            cooldownRounds: 3,
            attackBonus: 2,
            armorBonus: 2,
          },
          {
            id: 'shaman_curse',
            name: enemy.abilityName || 'Maldición Ritual',
            actionKind: 'APPLY_STATUS',
            targetScope: 'ONE_PLAYER',
            basePriority: 62,
            cooldownRounds: 2,
            damageMultiplier: 0.8,
            statusToApply: primaryStatus || 'CURSE',
            statusTurns: 2,
          },
          {
            id: 'shaman_mystic_bolt',
            name: 'Descarga Mística',
            actionKind: 'ATTACK',
            targetScope: 'ONE_PLAYER',
            basePriority: 52,
            damageMultiplier: 0.95,
          },
        ],
      },
    };
  }

  // 4. CURANDERO (Section 10: Stronger healing, cleansing/barrier, limited offense, long CDs)
  if (profession === 'CURANDERO') {
    const healBase = Math.max(16, Math.round(18 + roomIndex * 2));
    return {
      roleTag: 'HEALER',
      profession: 'CURANDERO',
      aiProfile: {
        personality: 'SUPPORT',
        aggression: 0.3,
        selfPreservation: 0.82,
        allyProtection: 0.9,
        statusPreference: 0.48,
        coordination: 0.8,
        randomness: 0.16,
        targetWeights: {
          lowHp: 0.3,
          lowDefense: 0.3,
          highThreat: 0.6,
        },
        abilities: [
          {
            id: 'healer_restoration',
            name: enemy.abilityName || 'Luz Restauradora',
            actionKind: 'HEAL_ALLY',
            targetScope: 'ALLY_ENEMY',
            basePriority: 88,
            cooldownRounds: 3,
            maxCharges: 2,
            healAmount: healBase,
            minAllyMissingHpRatio: 0.38,
          },
          {
            id: 'healer_barrier',
            name: 'Barrera Purificadora',
            actionKind: 'PROTECT_ALLY',
            targetScope: 'ALLY_ENEMY',
            basePriority: 72,
            cooldownRounds: 3,
            armorBonus: 3,
          },
          {
            id: 'healer_light_touch',
            name: 'Destello Sacro',
            actionKind: 'ATTACK',
            targetScope: 'ONE_PLAYER',
            basePriority: 46,
            damageMultiplier: 0.85,
          },
        ],
      },
    };
  }

  // 5. TANQUE / GUARDIÁN (Section 7: Golpe de Escudo, Proteger Aliado, Fortificarse, Provocar)
  if (profession === 'TANQUE' || profession === 'GUARDIÁN') {
    return {
      roleTag: 'TANK',
      profession,
      aiProfile: {
        personality: 'PROTECTOR',
        aggression: 0.48,
        selfPreservation: 0.7,
        allyProtection: 0.92,
        statusPreference: 0.35,
        coordination: 0.8,
        randomness: 0.16,
        targetWeights: {
          lowHp: 0.35,
          lowDefense: 0.4,
          highThreat: 0.75,
          highAttack: 0.65,
        },
        abilities: [
          {
            id: 'tank_protect_ally',
            name: 'Proteger Aliado',
            actionKind: 'PROTECT_ALLY',
            targetScope: 'ALLY_ENEMY',
            basePriority: 82,
            cooldownRounds: 2,
            armorBonus: 3,
          },
          {
            id: 'tank_fortify_self',
            name: 'Fortificarse',
            actionKind: 'DEFEND_SELF',
            targetScope: 'SELF',
            basePriority: 66,
            cooldownRounds: 2,
            armorBonus: 3,
            maxSelfHpRatio: 0.65,
          },
          {
            id: 'tank_shield_bash',
            name: enemy.abilityName || 'Golpe de Escudo',
            actionKind: 'SPECIAL_ATTACK',
            targetScope: 'ONE_PLAYER',
            basePriority: 60,
            cooldownRounds: 2,
            damageMultiplier: 1.12,
            statusToApply: 'WEAKENED',
            statusTurns: 2,
          },
          {
            id: 'tank_basic_strike',
            name: 'Golpe Contundente',
            actionKind: 'ATTACK',
            targetScope: 'ONE_PLAYER',
            basePriority: 52,
            damageMultiplier: 1.0,
          },
        ],
      },
    };
  }

  // 6. ALQUIMISTA (Section 16: Poison, acid, explosions, buff allies, debuff players)
  if (profession === 'ALQUIMISTA') {
    return {
      roleTag: 'CASTER',
      profession: 'ALQUIMISTA',
      aiProfile: {
        personality: 'CONTROLLER',
        aggression: 0.58,
        selfPreservation: 0.5,
        allyProtection: 0.55,
        statusPreference: 0.88,
        coordination: 0.72,
        randomness: 0.2,
        targetWeights: {
          lowHp: 0.45,
          lowDefense: 0.5,
          highThreat: 0.55,
        },
        abilities: [
          {
            id: 'alch_acid_flask',
            name: enemy.abilityName || 'Matraz Corrosivo',
            actionKind: 'APPLY_STATUS',
            targetScope: 'ONE_PLAYER',
            basePriority: 74,
            cooldownRounds: 2,
            damageMultiplier: 0.86,
            statusToApply: 'POISON',
            statusTurns: 2,
          },
          {
            id: 'alch_explosive_vial',
            name: 'Mezcla Explosiva',
            actionKind: 'DEBUFF_PLAYER',
            targetScope: 'RANDOM_N_PLAYERS',
            randomTargetsCount: 2,
            basePriority: 68,
            cooldownRounds: 3,
            damageMultiplier: 0.78,
            statusToApply: 'BURN',
            statusTurns: 2,
          },
          {
            id: 'alch_mutagen_buff',
            name: 'Vapor Estimulante',
            actionKind: 'BUFF_ALLY',
            targetScope: 'ALLY_ENEMY',
            basePriority: 62,
            cooldownRounds: 3,
            attackBonus: 2,
            armorBonus: 2,
          },
          {
            id: 'alch_throw_bottle',
            name: 'Frasco Volátil',
            actionKind: 'ATTACK',
            targetScope: 'ONE_PLAYER',
            basePriority: 52,
            damageMultiplier: 0.96,
          },
        ],
      },
    };
  }

  // 7. CONTROLADOR (Section 13: Apply negative status, reduce DEF/ATK, confusion, slow/frost, mark target)
  if (profession === 'CONTROLADOR') {
    return {
      roleTag: 'CASTER',
      profession: 'CONTROLADOR',
      aiProfile: {
        personality: 'CONTROLLER',
        aggression: 0.5,
        selfPreservation: 0.52,
        allyProtection: 0.4,
        statusPreference: 0.92,
        coordination: 0.78,
        randomness: 0.18,
        targetWeights: {
          lowHp: 0.4,
          lowDefense: 0.45,
          highThreat: 0.68,
          highMagic: 0.65,
        },
        abilities: [
          {
            id: 'ctrl_mark_target',
            name: enemy.abilityName || 'Cadenas de Sometimiento',
            actionKind: 'APPLY_STATUS',
            targetScope: 'ONE_PLAYER',
            basePriority: 76,
            cooldownRounds: 2,
            damageMultiplier: 0.82,
            statusToApply: primaryStatus || 'MARKED',
            statusTurns: 2,
          },
          {
            id: 'ctrl_mind_hex',
            name: 'Pulso Entorpecedor',
            actionKind: 'DEBUFF_PLAYER',
            targetScope: 'RANDOM_N_PLAYERS',
            randomTargetsCount: 2,
            basePriority: 68,
            cooldownRounds: 3,
            damageMultiplier: 0.72,
            statusToApply: secondaryStatus || 'CONFUSION',
            statusTurns: 2,
          },
          {
            id: 'ctrl_basic_lash',
            name: 'Azote de Control',
            actionKind: 'ATTACK',
            targetScope: 'ONE_PLAYER',
            basePriority: 52,
            damageMultiplier: 0.94,
          },
        ],
      },
    };
  }

  // 8. INVOCADOR (Section 14: Invocar Esbirro CD 4T, max 1 active summoned creature)
  if (profession === 'INVOCADOR') {
    return {
      roleTag: 'SWARM',
      profession: 'INVOCADOR',
      aiProfile: {
        personality: 'COMMANDER',
        aggression: 0.56,
        selfPreservation: 0.6,
        allyProtection: 0.5,
        statusPreference: 0.6,
        coordination: 0.75,
        randomness: 0.2,
        targetWeights: {
          lowHp: 0.45,
          lowDefense: 0.45,
          highThreat: 0.5,
        },
        abilities: [
          {
            id: 'summoner_call_minion',
            name: 'Invocar Esbirro',
            actionKind: 'SUMMON',
            targetScope: 'SELF',
            basePriority: 82,
            cooldownRounds: 4,
            maxCharges: 1,
          },
          {
            id: 'summoner_hex',
            name: enemy.abilityName || 'Maldición del Nido',
            actionKind: 'APPLY_STATUS',
            targetScope: 'ONE_PLAYER',
            basePriority: 64,
            cooldownRounds: 2,
            damageMultiplier: 0.85,
            statusToApply: primaryStatus,
            statusTurns: 2,
          },
          {
            id: 'summoner_strike',
            name: 'Embiste de Progenie',
            actionKind: 'ATTACK',
            targetScope: 'ONE_PLAYER',
            basePriority: 54,
            damageMultiplier: 0.98,
          },
        ],
      },
    };
  }

  // 9. MAGO & SOPORTE (Section 9)
  if (profession === 'MAGO' || profession === 'SOPORTE') {
    const isSupport = profession === 'SOPORTE';
    return {
      roleTag: isSupport ? 'SUPPORT' : 'CASTER',
      profession,
      aiProfile: {
        personality: isSupport ? 'SUPPORT' : 'TACTICAL',
        aggression: isSupport ? 0.48 : 0.68,
        selfPreservation: 0.52,
        allyProtection: isSupport ? 0.78 : 0.35,
        statusPreference: 0.78,
        coordination: 0.7,
        randomness: 0.18,
        targetWeights: {
          lowHp: 0.5,
          lowDefense: 0.45,
          highThreat: 0.6,
          highMagic: 0.6,
        },
        abilities: isSupport
          ? [
              {
                id: 'support_war_chant',
                name: enemy.abilityName || 'Cántico de Batalla',
                actionKind: 'BUFF_ALLY',
                targetScope: 'ALLY_ENEMY',
                basePriority: 74,
                cooldownRounds: 3,
                attackBonus: 2,
                armorBonus: 2,
              },
              {
                id: 'support_hex_bell',
                name: 'Tañido Debilitador',
                actionKind: 'APPLY_STATUS',
                targetScope: 'ONE_PLAYER',
                basePriority: 64,
                cooldownRounds: 2,
                damageMultiplier: 0.84,
                statusToApply: primaryStatus,
                statusTurns: 2,
              },
              {
                id: 'support_strike',
                name: 'Golpe Ritual',
                actionKind: 'ATTACK',
                targetScope: 'ONE_PLAYER',
                basePriority: 52,
                damageMultiplier: 0.95,
              },
            ]
          : [
              {
                id: 'mage_elemental_storm',
                name: enemy.abilityName || 'Descarga Arcana Mayor',
                actionKind: 'DEBUFF_PLAYER',
                targetScope: 'RANDOM_N_PLAYERS',
                randomTargetsCount: 2,
                basePriority: 72,
                cooldownRounds: 3,
                damageMultiplier: 0.86,
                statusToApply: primaryStatus,
                statusTurns: 2,
              },
              {
                id: 'mage_status_bolt',
                name: 'Proyectil Rúnico',
                actionKind: 'APPLY_STATUS',
                targetScope: 'ONE_PLAYER',
                basePriority: 64,
                cooldownRounds: 2,
                damageMultiplier: 0.92,
                statusToApply: secondaryStatus,
                statusTurns: 2,
              },
              {
                id: 'mage_arcane_ward',
                name: 'Velo Arcano',
                actionKind: 'DEFEND_SELF',
                targetScope: 'SELF',
                basePriority: 52,
                cooldownRounds: 3,
                armorBonus: 2,
                maxSelfHpRatio: 0.5,
              },
              {
                id: 'mage_basic_blast',
                name: 'Saeta Mágica',
                actionKind: 'ATTACK',
                targetScope: 'ONE_PLAYER',
                basePriority: 56,
                damageMultiplier: 1.04,
              },
            ],
      },
    };
  }

  // 10. TIRADOR (Section 12: Ranged attack, multi-target projectile, status arrow, charged shot)
  if (profession === 'TIRADOR') {
    return {
      roleTag: 'ASSASSIN',
      profession: 'TIRADOR',
      aiProfile: {
        personality: 'TACTICAL',
        aggression: 0.76,
        selfPreservation: 0.45,
        allyProtection: 0.25,
        statusPreference: 0.62,
        coordination: 0.65,
        randomness: 0.2,
        targetWeights: {
          lowHp: 0.65,
          lowDefense: 0.65,
          highThreat: 0.55,
          highMagic: 0.6,
        },
        abilities: [
          {
            id: 'ranged_status_shot',
            name: enemy.abilityName || 'Proyectil Afilado',
            actionKind: 'APPLY_STATUS',
            targetScope: 'ONE_PLAYER',
            basePriority: 68,
            cooldownRounds: 2,
            damageMultiplier: 0.95,
            statusToApply: primaryStatus || 'MARKED',
            statusTurns: 2,
          },
          {
            id: 'ranged_multi_volley',
            name: 'Salva Cruzada',
            actionKind: 'DEBUFF_PLAYER',
            targetScope: 'RANDOM_N_PLAYERS',
            randomTargetsCount: 2,
            basePriority: 66,
            cooldownRounds: 3,
            damageMultiplier: 0.82,
            statusToApply: secondaryStatus,
            statusTurns: 2,
          },
          {
            id: 'ranged_aimed_shot',
            name: 'Disparo Certero',
            actionKind: 'ATTACK',
            targetScope: 'ONE_PLAYER',
            basePriority: 58,
            damageMultiplier: 1.05,
          },
        ],
      },
    };
  }

  // 11. ASESINO (Section 11: Precision attack, critical strike, poison, 70/30 opportunistic targeting)
  if (profession === 'ASESINO') {
    return {
      roleTag: 'ASSASSIN',
      profession: 'ASESINO',
      aiProfile: {
        personality: 'OPPORTUNIST',
        aggression: 0.84,
        selfPreservation: 0.35,
        allyProtection: 0.15,
        statusPreference: 0.58,
        coordination: 0.65,
        randomness: 0.2,
        targetWeights: {
          lowHp: 0.82,
          lowDefense: 0.68,
          highThreat: 0.45,
          vulnerableOrDebuffed: 0.75,
        },
        abilities: [
          {
            id: 'assassin_crit_strike',
            name: enemy.abilityName || 'Golpe Crítico Furtivo',
            actionKind: 'SPECIAL_ATTACK',
            targetScope: 'ONE_PLAYER',
            basePriority: 70,
            cooldownRounds: 2,
            damageMultiplier: 1.24,
            statusToApply: primaryStatus || 'BLEED',
            statusTurns: 2,
            comboAfterStatus: 'BLEED',
            comboBonusMultiplier: 1.25,
          },
          {
            id: 'assassin_poison_blade',
            name: 'Filo Envenenado',
            actionKind: 'APPLY_STATUS',
            targetScope: 'ONE_PLAYER',
            basePriority: 64,
            cooldownRounds: 2,
            damageMultiplier: 0.9,
            statusToApply: 'POISON',
            statusTurns: 2,
          },
          {
            id: 'assassin_precision_cut',
            name: 'Ataque de Precisión',
            actionKind: 'ATTACK',
            targetScope: 'ONE_PLAYER',
            basePriority: 58,
            damageMultiplier: 1.04,
          },
        ],
      },
    };
  }

  // 12. BERSERKER (Section 15: FURIA below 35% HP: +25% damage, -15% defense)
  if (profession === 'BERSERKER') {
    return {
      roleTag: 'BRUTE',
      profession: 'BERSERKER',
      aiProfile: {
        personality: 'BERSERKER',
        aggression: 0.9,
        selfPreservation: 0.2,
        allyProtection: 0.15,
        statusPreference: 0.5,
        coordination: 0.5,
        randomness: 0.22,
        targetWeights: {
          lowHp: 0.7,
          lowDefense: 0.6,
          highThreat: 0.6,
        },
        abilities: [
          {
            id: 'berserker_frenzy_cleave',
            name: enemy.abilityName || 'Embate Frenético',
            actionKind: 'SPECIAL_ATTACK',
            targetScope: 'ONE_PLAYER',
            basePriority: 70,
            cooldownRounds: 2,
            damageMultiplier: 1.25,
            statusToApply: 'BLEED',
            statusTurns: 2,
          },
          {
            id: 'berserker_wild_slash',
            name: 'Tajo Desenfrenado',
            actionKind: 'ATTACK',
            targetScope: 'ONE_PLAYER',
            basePriority: 62,
            damageMultiplier: 1.05,
          },
        ],
      },
    };
  }

  // 13. GUERRERO & BRUTO (Section 6: Golpe Contundente, Embestida, Golpe Pesado CD 2T)
  return {
    roleTag: profession === 'BRUTO' ? 'BRUTE' : 'ASSASSIN',
    profession,
    aiProfile: {
      personality: 'AGGRESSIVE',
      aggression: 0.78,
      selfPreservation: 0.4,
      allyProtection: 0.3,
      statusPreference: 0.48,
      coordination: 0.6,
      randomness: 0.2,
      targetWeights: {
        lowHp: 0.55,
        lowDefense: 0.55,
        highThreat: 0.6,
        vulnerableOrDebuffed: 0.6,
      },
      abilities: [
        {
          id: 'warrior_heavy_blow',
          name: enemy.abilityName || 'Golpe Pesado',
          actionKind: 'SPECIAL_ATTACK',
          targetScope: 'ONE_PLAYER',
          basePriority: 68,
          cooldownRounds: 2,
          damageMultiplier: 1.26,
        },
        {
          id: 'warrior_charge_bash',
          name: 'Embestida',
          actionKind: 'APPLY_STATUS',
          targetScope: 'ONE_PLAYER',
          basePriority: 60,
          cooldownRounds: 2,
          damageMultiplier: 0.92,
          statusToApply: primaryStatus || 'WEAKENED',
          statusTurns: 2,
        },
        {
          id: 'warrior_blunt_strike',
          name: 'Golpe Contundente',
          actionKind: 'ATTACK',
          targetScope: 'ONE_PLAYER',
          basePriority: 58,
          damageMultiplier: 1.0,
        },
      ],
    },
  };
}

export interface EvaluatedEnemyDecision {
  enemyId: string;
  ability: CriptaEnemyAbilityDefinition;
  actionKind: CriptaEnemyActionKind;
  targetPlayers: CriptaPlayer[];
  targetAllyEnemy: CriptaRoomEnemy | null;
  score: number;
  diagnostics: {
    enemyName: string;
    personality: CriptaEnemyAiPersonality;
    chosenAbilityId: string;
    chosenTargetNames: string[];
    topCandidates: Array<{ label: string; score: number; probability: number }>;
  };
}

/**
 * Evaluates a player target for a specific enemy and ability.
 * Accounts for HP%, absolute HP, defense/armor, attack/magic, buffs/debuffs,
 * player threat, recent damage/healing, class, defending/shielded, protection,
 * taunt/provoke, and anti-frustration focus-fire dampening.
 */
function scorePlayerTargetForEnemy(
  enemy: CriptaRoomEnemy,
  ability: CriptaEnemyAbilityDefinition,
  player: CriptaPlayer,
  allLivingPlayers: CriptaPlayer[],
  alreadyTargetedThisRoundCounts: Record<string, number>,
  rng: () => number
): number {
  const profile = enemy.aiProfile || buildEnemyAiProfileForArchetype(enemy).aiProfile;
  const memory = enemy.memory || createInitialEnemyMemory();
  const weights = profile.targetWeights;

  // CHAOTIC personality: mostly random target selection
  if (profile.personality === 'CHAOTIC' && rng() < 0.72) {
    return 45 + rng() * 40;
  }

  let score = 40;

  const hpRatio = Math.max(0, Math.min(1, player.hp / Math.max(1, player.maxHp)));
  const missingHpRatio = 1 - hpRatio;

  // 1. Low HP / Vulnerability scoring
  score += missingHpRatio * 42 * (weights.lowHp ?? 0.5);
  if (player.hp <= 16) {
    score += 12 * (weights.lowHp ?? 0.5);
  }

  // 2. Low Defense / Armor scoring
  const effectiveArmor = Math.max(0, player.armor + (player.bonusDefense || 0));
  const lowDefenseFactor = Math.max(0, (12 - effectiveArmor) / 12);
  score += lowDefenseFactor * 26 * (weights.lowDefense ?? 0.35);

  // 3. Player Threat & Recent Combat Contribution
  const threat = (player.threatScore || 0) + (memory.recentDamageByPlayer[player.id] || 0) * 0.6;
  const normalizedThreat = Math.min(1.5, threat / 35);
  score += normalizedThreat * 30 * (weights.highThreat ?? 0.45);

  // 4. Class & Stat awareness (Mage hunters / Bosses noticing Clérigo healers or high-magic Mago)
  const charDef = player.characterId ? CRIPTA_CHARACTERS_CATALOG[player.characterId] : null;
  const totalMagic = (charDef?.stats.magic || 4) + (player.bonusMagic || 0);
  const totalAttack = (charDef?.stats.attack || 4) + (player.bonusAttack || 0);

  if (weights.highMagic) {
    score += (totalMagic / 10) * 20 * weights.highMagic;
  }
  if (weights.highAttack) {
    score += (totalAttack / 10) * 18 * weights.highAttack;
  }
  if (
    (profile.personality === 'BOSS' || profile.personality === 'TACTICAL') &&
    (player.characterId === 'clerigo' || (player.recentHealingDone || 0) >= 15)
  ) {
    score += 14;
  }

  // 5. Status / Combo awareness
  const isMarked = Boolean(playerHasStatus(player, 'MARKED'));
  const isPoisoned = Boolean(playerHasStatus(player, 'POISON'));
  const isBleeding = Boolean(playerHasStatus(player, 'BLEED'));
  const isVulnerableOrDebuffed =
    isMarked ||
    isPoisoned ||
    isBleeding ||
    Boolean(playerHasStatus(player, 'FROST')) ||
    Boolean(playerHasStatus(player, 'CURSE')) ||
    Boolean(playerHasStatus(player, 'WEAKENED'));

  if (isVulnerableOrDebuffed) {
    score += 18 * (weights.vulnerableOrDebuffed ?? 0.45);
  }
  if (isMarked) {
    score += 22;
  }
  if (ability.comboAfterStatus && playerHasStatus(player, ability.comboAfterStatus)) {
    score += 28;
  }

  // Avoid wasteful duplicate status application if another player lacks that status
  if (
    (ability.actionKind === 'APPLY_STATUS' || ability.actionKind === 'DEBUFF_PLAYER') &&
    ability.statusToApply
  ) {
    const existing = playerHasStatus(player, ability.statusToApply);
    if (existing && existing.remainingTurns >= 2) {
      score -= 34;
    } else if (!existing) {
      score += 16;
    }
  }

  // 6. Defending / Shielded / Protected awareness
  // Opportunists and Predators recognize when a low-HP target is heavily defended/shielded
  // and may switch to a more efficient target! (Requirement 51)
  const isShielded = Boolean(playerHasStatus(player, 'SHIELDED'));
  const isDefending = Boolean(player.isDefendingThisRound);
  const isProtected = Boolean(player.protectedByPlayerId);

  if (isDefending || isShielded || isProtected) {
    const defensePenalty =
      (isDefending ? 14 : 0) + (isShielded ? 10 : 0) + (isProtected ? 14 : 0);
    if (
      profile.personality === 'OPPORTUNIST' ||
      profile.personality === 'PREDATOR' ||
      profile.personality === 'TACTICAL' ||
      profile.personality === 'BOSS'
    ) {
      score -= defensePenalty;
    } else {
      score -= defensePenalty * 0.5;
    }
  }

  // 7. Taunt / Provoke support (Requirement 22)
  if ((player.tauntTurnsRemaining || 0) > 0) {
    score += 42;
  }

  // 8. Anti-frustration / Anti-dogpile logic (Requirement 24)
  if (allLivingPlayers.length > 1) {
    const timesHitThisRound = alreadyTargetedThisRoundCounts[player.id] || 0;
    if (timesHitThisRound >= 1) {
      score -= timesHitThisRound * 18;
    }
    if (memory.lastTargetId === player.id) {
      const consec = memory.consecutiveTargetCount || 1;
      if (consec >= 2) {
        score -= consec * 12;
      }
    }
  }

  return Math.max(5, score);
}

/**
 * Selects an item from scored candidates using softmax/boltzmann-like weighted probabilities
 * so the AI prefers strong options without being 100% deterministic/robotic.
 */
function pickWeightedCandidate<T>(
  candidates: Array<{ item: T; score: number; label: string }>,
  randomness: number,
  rng: () => number
): {
  chosen: { item: T; score: number; label: string };
  probabilities: Array<{ label: string; score: number; probability: number }>;
} {
  if (candidates.length === 1) {
    return {
      chosen: candidates[0],
      probabilities: [
        { label: candidates[0].label, score: Math.round(candidates[0].score), probability: 100 },
      ],
    };
  }

  const sorted = [...candidates].sort((a, b) => b.score - a.score);
  // Consider top 4 reasonable options
  const topSlice = sorted.slice(0, Math.min(4, sorted.length));
  const maxScore = topSlice[0].score;
  const temperature = Math.max(6, 12 + randomness * 28);

  const weights = topSlice.map((c) => Math.exp((c.score - maxScore) / temperature));
  const totalWeight = weights.reduce((acc, w) => acc + w, 0) || 1;

  const probabilities = topSlice.map((c, idx) => ({
    label: c.label,
    score: Math.round(c.score),
    probability: Math.round((weights[idx] / totalWeight) * 100),
  }));

  let roll = rng() * totalWeight;
  for (let i = 0; i < topSlice.length; i++) {
    roll -= weights[i];
    if (roll <= 0) {
      return { chosen: topSlice[i], probabilities };
    }
  }

  return { chosen: topSlice[0], probabilities };
}

export type EnemyTacticalDecision = EvaluatedEnemyDecision;

/**
 * Evaluates the live battle state during ENEMY PHASE and decides what action and target(s)
 * a specific surviving enemy will execute right now.
 */
export function chooseEnemyTacticalAction(
  enemy: CriptaRoomEnemy,
  room: CriptaDungeonRoom,
  players: CriptaPlayer[],
  alreadyTargetedThisRoundCounts: Record<string, number> = {},
  seed = 1337,
  roundOverride?: number,
  stepIndex = 0
): EvaluatedEnemyDecision | null {
  if (!enemy || enemy.hp <= 0 || !room || !Array.isArray(players)) return null;

  const livingPlayers = players.filter((p) => p && p.isConnected && !p.isDead && p.hp > 0);
  if (livingPlayers.length === 0) return null;

  const roomEnemies = Array.isArray(room.enemies) ? room.enemies : [enemy];
  const livingEnemies = roomEnemies.filter((e) => e && e.hp > 0);
  const allyEnemies = livingEnemies.filter((e) => e.id !== enemy.id);

  if (!enemy.aiProfile) {
    const built = buildEnemyAiProfileForArchetype(enemy, room.index || 0);
    enemy.roleTag = built.roleTag;
    enemy.aiProfile = built.aiProfile;
  }
  if (!enemy.memory) {
    enemy.memory = createInitialEnemyMemory();
  }

  const profile = enemy.aiProfile;
  const memory = enemy.memory;
  const roundNum =
    typeof roundOverride === 'number' && roundOverride > 0
      ? roundOverride
      : room.combatTurn || 1;
  const rng = createEnemyAiRng(seed || 1337, roundNum, stepIndex + enemy.hp);

  const allAbilities =
    profile.abilities && profile.abilities.length > 0
      ? profile.abilities
      : buildEnemyAiProfileForArchetype(enemy, room.index || 0).aiProfile.abilities || [];

  // 1. If this enemy prepared/telegraphed an attack on the previous round, execute it now!
  if (memory.preparedAbilityId) {
    const preparedAb = allAbilities.find((a) => a.id === memory.preparedAbilityId);
    memory.preparedAbilityId = null;
    enemy.preparedTelegraphLabel = null;

    if (preparedAb) {
      let targets: CriptaPlayer[] = [];
      if (preparedAb.targetScope === 'ALL_PLAYERS') {
        targets = [...livingPlayers];
      } else if (preparedAb.targetScope === 'RANDOM_N_PLAYERS') {
        const count = Math.min(livingPlayers.length, preparedAb.randomTargetsCount || 2);
        const shuffled = [...livingPlayers].sort(() => rng() - 0.5);
        targets = shuffled.slice(0, count);
      } else {
        const remembered = (memory.preparedTargetIds || [])
          .map((id) => livingPlayers.find((p) => p.id === id))
          .filter((p): p is CriptaPlayer => Boolean(p));
        targets = remembered.length > 0 ? [remembered[0]] : [livingPlayers[0]];
      }
      memory.preparedTargetIds = [];

      if (preparedAb.cooldownRounds) {
        memory.abilityCooldowns[preparedAb.id] = preparedAb.cooldownRounds;
      }

      return {
        enemyId: enemy.id,
        ability: preparedAb,
        actionKind: preparedAb.actionKind,
        targetPlayers: targets,
        targetAllyEnemy: null,
        score: 100,
        diagnostics: {
          enemyName: enemy.name,
          personality: profile.personality,
          chosenAbilityId: preparedAb.id,
          chosenTargetNames: targets.map((t) => t.name),
          topCandidates: [{ label: `${preparedAb.name} (CARGADO)`, score: 100, probability: 100 }],
        },
      };
    }
  }

  // 2. Filter abilities by cooldowns, charge limits, and tactical conditions
  const selfHpRatio = enemy.hp / Math.max(1, enemy.maxHp);
  const maxAllowedHealsForEnemy =
    enemy.isBoss || enemy.isFinalBoss || enemy.isMiniboss || enemy.isElite ? 2 : 1;
  const totalHealsUsedSoFar = memory.abilityChargesUsed['__total_heals__'] || 0;

  const validAbilities = allAbilities.filter((ab) => {
    const cd = memory.abilityCooldowns[ab.id] || 0;
    if (cd > 0) return false;

    if (typeof ab.maxCharges === 'number') {
      const used = memory.abilityChargesUsed[ab.id] || 0;
      if (used >= ab.maxCharges) return false;
    }

    if (typeof ab.maxSelfHpRatio === 'number' && selfHpRatio > ab.maxSelfHpRatio) {
      return false;
    }

    if (ab.actionKind === 'HEAL_SELF' || ab.actionKind === 'HEAL_ALLY') {
      // Anti-stalemate & strict healing cap: no healing after Round 5, max 1-2 heals total, min 3-round cooldown
      if (roundNum >= 6) return false;
      if (totalHealsUsedSoFar >= maxAllowedHealsForEnemy) return false;
      if (typeof enemy.healUsesRemaining === 'number' && enemy.healUsesRemaining <= 0) {
        return false;
      }
      if ((enemy.healCooldownRounds || 0) > 0) return false;
      if ((enemy.totalHealedThisCombat || 0) >= Math.round(enemy.maxHp * 0.26)) {
        return false;
      }
    }

    if (ab.actionKind === 'HEAL_ALLY') {
      const woundedAllies = livingEnemies.filter(
        (e) =>
          (e.maxHp - e.hp) / Math.max(1, e.maxHp) >= (ab.minAllyMissingHpRatio ?? 0.32) &&
          (e.totalHealedThisCombat || 0) < Math.round(e.maxHp * 0.26)
      );
      if (woundedAllies.length === 0) return false;
    }

    if (ab.actionKind === 'PROTECT_ALLY') {
      const protectableAllies = allyEnemies.filter((e) => !e.protectedByEnemyId);
      if (protectableAllies.length === 0) return false;
    }

    if (ab.actionKind === 'SUMMON') {
      const hasActiveSummon = livingEnemies.some((e) => e.id.startsWith('summon_'));
      if (hasActiveSummon || livingEnemies.length >= 3) return false;
    }

    return true;
  });

  const usableAbilities =
    validAbilities.length > 0
      ? validAbilities
      : [
          {
            id: 'fallback_basic_attack',
            name: 'Ataque',
            actionKind: 'ATTACK' as const,
            targetScope: 'ONE_PLAYER' as const,
            basePriority: 50,
            damageMultiplier: 1.0,
          },
        ];

  // 3. Build scored (ability + target) candidate pairs
  interface CandidateOption {
    ability: CriptaEnemyAbilityDefinition;
    actionKind: CriptaEnemyActionKind;
    targetPlayers: CriptaPlayer[];
    targetAllyEnemy: CriptaRoomEnemy | null;
  }

  const scoredCandidates: Array<{
    item: CandidateOption;
    score: number;
    label: string;
  }> = [];

  for (const ab of usableAbilities) {
    let baseScore = ab.basePriority;

    // Berserker low-HP aggression boost
    if (profile.personality === 'BERSERKER' && selfHpRatio <= 0.45) {
      if (ab.actionKind === 'ATTACK' || ab.actionKind === 'SPECIAL_ATTACK') {
        baseScore += 22;
      }
    }

    // Penalize repeating the exact same non-basic ability twice in a row
    if (memory.lastAbilityId === ab.id && ab.actionKind !== 'ATTACK') {
      baseScore -= 12;
    }

    // CASE A: HEAL_SELF
    if (ab.actionKind === 'HEAL_SELF') {
      const missingRatio = 1 - selfHpRatio;
      const score =
        baseScore +
        missingRatio * 55 * (profile.selfPreservation || 0.6) +
        (selfHpRatio <= 0.28 ? 20 : 0) +
        (rng() - 0.5) * 8;
      scoredCandidates.push({
        item: {
          ability: ab,
          actionKind: 'HEAL_SELF',
          targetPlayers: [],
          targetAllyEnemy: enemy,
        },
        score,
        label: `${ab.name} -> ${enemy.name}`,
      });
      continue;
    }

    // CASE B: HEAL_ALLY (can also heal self if Shaman is critically wounded, Requirement 49)
    if (ab.actionKind === 'HEAL_ALLY') {
      for (const ally of livingEnemies) {
        const allyHpRatio = ally.hp / Math.max(1, ally.maxHp);
        const missingRatio = 1 - allyHpRatio;
        if (missingRatio < (ab.minAllyMissingHpRatio ?? 0.22)) continue;

        let allyPriority = baseScore + missingRatio * 52 * (profile.allyProtection || 0.75);
        if (allyHpRatio <= 0.3) allyPriority += 22;
        if (ally.isBoss || ally.isElite) allyPriority += 14;
        if (ally.id === enemy.id && allyHpRatio <= 0.26) allyPriority += 16;

        scoredCandidates.push({
          item: {
            ability: ab,
            actionKind: ally.id === enemy.id ? 'HEAL_SELF' : 'HEAL_ALLY',
            targetPlayers: [],
            targetAllyEnemy: ally,
          },
          score: allyPriority + (rng() - 0.5) * 8,
          label: `${ab.name} -> ${ally.name}`,
        });
      }
      continue;
    }

    // CASE C: PROTECT_ALLY (Requirement 18, 19, 50)
    if (ab.actionKind === 'PROTECT_ALLY') {
      for (const ally of allyEnemies) {
        if (ally.protectedByEnemyId) continue;
        const allyHpRatio = ally.hp / Math.max(1, ally.maxHp);
        let protectScore = baseScore + (1 - allyHpRatio) * 45 * (profile.allyProtection || 0.8);

        if (ally.roleTag === 'HEALER' || ally.roleTag === 'SUPPORT') {
          protectScore += 24;
        } else if (ally.roleTag === 'CASTER' || ally.preparedTelegraphLabel) {
          protectScore += 18;
        } else if (ally.isBoss || ally.isElite) {
          protectScore += 16;
        }
        if (allyHpRatio <= 0.35) {
          protectScore += 20;
        }
        if (allyHpRatio >= 0.88 && ally.roleTag !== 'HEALER' && !ally.preparedTelegraphLabel) {
          protectScore -= 22;
        }

        scoredCandidates.push({
          item: {
            ability: ab,
            actionKind: 'PROTECT_ALLY',
            targetPlayers: [],
            targetAllyEnemy: ally,
          },
          score: protectScore + (rng() - 0.5) * 8,
          label: `${ab.name} -> ${ally.name}`,
        },
        );
      }
      continue;
    }

    // CASE D: DEFEND_SELF (Requirement 17, 42)
    if (ab.actionKind === 'DEFEND_SELF') {
      const missingRatio = 1 - selfHpRatio;
      const defendScore =
        baseScore +
        missingRatio * 36 * (profile.selfPreservation || 0.5) +
        (enemy.poisonStacks ? 8 : 0) +
        (rng() - 0.5) * 8;
      scoredCandidates.push({
        item: {
          ability: ab,
          actionKind: 'DEFEND_SELF',
          targetPlayers: [],
          targetAllyEnemy: enemy,
        },
        score: defendScore,
        label: `${ab.name} (DEFENDERSE)`,
      });
      continue;
    }

    // CASE E: SUMMON (Requirement 43)
    if (ab.actionKind === 'SUMMON') {
      const summonScore =
        baseScore + (livingEnemies.length === 1 ? 24 : 8) + (rng() - 0.5) * 8;
      scoredCandidates.push({
        item: {
          ability: ab,
          actionKind: 'SUMMON',
          targetPlayers: [],
          targetAllyEnemy: null,
        },
        score: summonScore,
        label: `${ab.name} (INVOCACIÓN)`,
      });
      continue;
    }

    // CASE F: TELEGRAPHED PREPARATION (Requirement 41)
    if (ab.requiresTelegraph && !memory.preparedAbilityId) {
      const prepTargets =
        ab.targetScope === 'ALL_PLAYERS'
          ? [...livingPlayers]
          : ab.targetScope === 'RANDOM_N_PLAYERS'
          ? [...livingPlayers].slice(0, Math.min(livingPlayers.length, ab.randomTargetsCount || 2))
          : [livingPlayers[0]];

      scoredCandidates.push({
        item: {
          ability: ab,
          actionKind: 'PREPARE_ATTACK',
          targetPlayers: prepTargets,
          targetAllyEnemy: null,
        },
        score: baseScore + 10 + (rng() - 0.5) * 8,
        label: `PREPARAR ${ab.name}`,
      });
      continue;
    }

    // CASE G: MULTI-PLAYER OR ALL-PLAYER OFFENSIVE/STATUS ABILITY (Requirement 31)
    if (ab.targetScope === 'ALL_PLAYERS' || ab.targetScope === 'RANDOM_N_PLAYERS') {
      const chosenTargets =
        ab.targetScope === 'ALL_PLAYERS'
          ? [...livingPlayers]
          : [...livingPlayers]
              .sort(
                (a, b) =>
                  scorePlayerTargetForEnemy(
                    enemy,
                    ab,
                    b,
                    livingPlayers,
                    alreadyTargetedThisRoundCounts,
                    rng
                  ) -
                  scorePlayerTargetForEnemy(
                    enemy,
                    ab,
                    a,
                    livingPlayers,
                    alreadyTargetedThisRoundCounts,
                    rng
                  )
              )
              .slice(0, Math.min(livingPlayers.length, ab.randomTargetsCount || 2));

      const avgPlayerScore =
        chosenTargets.reduce(
          (sum, p) =>
            sum +
            scorePlayerTargetForEnemy(
              enemy,
              ab,
              p,
              livingPlayers,
              alreadyTargetedThisRoundCounts,
              rng
            ),
          0
        ) / Math.max(1, chosenTargets.length);

      scoredCandidates.push({
        item: {
          ability: ab,
          actionKind: ab.actionKind,
          targetPlayers: chosenTargets,
          targetAllyEnemy: null,
        },
        score: baseScore * 0.65 + avgPlayerScore * 0.55 + (rng() - 0.5) * 8,
        label: `${ab.name} -> ${chosenTargets.map((t) => t.name).join(', ')}`,
      });
      continue;
    }

    // CASE H: SINGLE-PLAYER OFFENSIVE / STATUS ABILITY
    // Section 11: ASSASSIN uses simple server-authoritative rule:
    // 70% random living player, 30% random player below 50% HP (if any exists)
    if (enemy.profession === 'ASESINO' || profile.personality === 'OPPORTUNIST') {
      const belowHalfPlayers = livingPlayers.filter(
        (p) => p.hp / Math.max(1, p.maxHp) < 0.5
      );
      const pickedTarget =
        belowHalfPlayers.length > 0 && rng() < 0.3
          ? belowHalfPlayers[Math.floor(rng() * belowHalfPlayers.length)]
          : livingPlayers[Math.floor(rng() * livingPlayers.length)];

      scoredCandidates.push({
        item: {
          ability: ab,
          actionKind: ab.actionKind,
          targetPlayers: [pickedTarget],
          targetAllyEnemy: null,
        },
        score: baseScore + (rng() - 0.5) * 8,
        label: `${ab.name} -> ${pickedTarget.name}`,
      });
      continue;
    }

    for (const p of livingPlayers) {
      const targetScore = scorePlayerTargetForEnemy(
        enemy,
        ab,
        p,
        livingPlayers,
        alreadyTargetedThisRoundCounts,
        rng
      );
      const combinedScore =
        baseScore * 0.6 +
        targetScore * 0.55 +
        (ab.actionKind === 'APPLY_STATUS' ? (profile.statusPreference || 0.4) * 14 : 0) +
        (rng() - 0.5) * 10;

      scoredCandidates.push({
        item: {
          ability: ab,
          actionKind: ab.actionKind,
          targetPlayers: [p],
          targetAllyEnemy: null,
        },
        score: combinedScore,
        label: `${ab.name} -> ${p.name}`,
      });
    }
  }

  // Edge-case guard: if no candidate was added due to restrictive ally/target conditions,
  // provide a safe fallback basic attack against a living player so combat never crashes.
  if (scoredCandidates.length === 0) {
    const fallbackAbility: CriptaEnemyAbilityDefinition = {
      id: 'fallback_basic_attack',
      name: 'Ataque',
      actionKind: 'ATTACK',
      targetScope: 'ONE_PLAYER',
      basePriority: 50,
      damageMultiplier: 1.0,
    };
    for (const p of livingPlayers) {
      const targetScore = scorePlayerTargetForEnemy(
        enemy,
        fallbackAbility,
        p,
        livingPlayers,
        alreadyTargetedThisRoundCounts,
        rng
      );
      scoredCandidates.push({
        item: {
          ability: fallbackAbility,
          actionKind: 'ATTACK',
          targetPlayers: [p],
          targetAllyEnemy: null,
        },
        score: 30 + targetScore * 0.55,
        label: `Ataque -> ${p.name}`,
      });
    }
  }

  // Pick from top candidates using controlled randomness
  const { chosen, probabilities } = pickWeightedCandidate(
    scoredCandidates,
    profile.randomness ?? 0.2,
    rng
  );

  const selected = chosen.item;

  // Update enemy combat-local memory
  memory.lastAbilityId = selected.ability.id;
  if (selected.ability.cooldownRounds && selected.actionKind !== 'PREPARE_ATTACK') {
    memory.abilityCooldowns[selected.ability.id] = selected.ability.cooldownRounds;
  }
  if (typeof selected.ability.maxCharges === 'number' && selected.actionKind !== 'PREPARE_ATTACK') {
    memory.abilityChargesUsed[selected.ability.id] =
      (memory.abilityChargesUsed[selected.ability.id] || 0) + 1;
  }

  if (selected.targetPlayers.length === 1) {
    const tId = selected.targetPlayers[0].id;
    memory.timesTargetedPlayer[tId] = (memory.timesTargetedPlayer[tId] || 0) + 1;
    if (memory.lastTargetId === tId) {
      memory.consecutiveTargetCount = (memory.consecutiveTargetCount || 1) + 1;
    } else {
      memory.lastTargetId = tId;
      memory.consecutiveTargetCount = 1;
    }
  }

  // Development-only diagnostic log (Requirement 52)
  if (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production') {
    console.debug('[EnemyAI]', {
      enemy: `${enemy.name} (${enemy.slug})`,
      personality: profile.personality,
      action: selected.ability.name,
      actionKind: selected.actionKind,
      targets:
        selected.targetPlayers.length > 0
          ? selected.targetPlayers.map((t) => t.name)
          : selected.targetAllyEnemy
          ? [selected.targetAllyEnemy.name]
          : ['SELF'],
      topCandidates: probabilities,
    });
  }

  return {
    enemyId: enemy.id,
    ability: selected.ability,
    actionKind: selected.actionKind,
    targetPlayers: selected.targetPlayers,
    targetAllyEnemy: selected.targetAllyEnemy,
    score: chosen.score,
    diagnostics: {
      enemyName: enemy.name,
      personality: profile.personality,
      chosenAbilityId: selected.ability.id,
      chosenTargetNames:
        selected.targetPlayers.length > 0
          ? selected.targetPlayers.map((p) => p.name)
          : selected.targetAllyEnemy
          ? [selected.targetAllyEnemy.name]
          : [enemy.name],
      topCandidates: probabilities,
    },
  };
}

/**
 * Computes and updates an enemy's visible next-round intent badge so players
 * have readable counterplay during PLAYER_PHASE (Requirement 28 & 41).
 */
export function refreshEnemyIntentPreview(
  enemy: CriptaRoomEnemy,
  room: CriptaDungeonRoom,
  players: CriptaPlayer[],
  seed: number
): void {
  if (enemy.hp <= 0) return;

  if (!enemy.aiProfile) {
    const built = buildEnemyAiProfileForArchetype(enemy, room.index);
    enemy.roleTag = built.roleTag;
    enemy.aiProfile = built.aiProfile;
  }
  if (!enemy.memory) {
    enemy.memory = createInitialEnemyMemory();
  }

  // If currently charging a telegraphed attack, show the explicit telegraph!
  if (enemy.memory.preparedAbilityId && enemy.preparedTelegraphLabel) {
    enemy.intent = 'CATACLISMO';
    enemy.intentCategory = 'TELEGRAPH';
    enemy.intentValue = Math.round(enemy.attack * 1.25);
    return;
  }

  const hpRatio = enemy.hp / Math.max(1, enemy.maxHp);
  const livingEnemies = room.enemies.filter((e) => e.hp > 0);
  const woundedAlly = livingEnemies.find((e) => e.hp / Math.max(1, e.maxHp) <= 0.42);

  if (
    enemy.roleTag === 'HEALER' &&
    woundedAlly &&
    (enemy.memory.abilityCooldowns['support_heal_ally'] || 0) === 0
  ) {
    enemy.intent = 'CURACIÓN';
    enemy.intentCategory = 'HEAL';
    enemy.intentValue = Math.max(14, Math.round(enemy.attack * 1.4));
    return;
  }

  if (
    enemy.roleTag === 'TANK' &&
    woundedAlly &&
    woundedAlly.id !== enemy.id &&
    (enemy.memory.abilityCooldowns['tank_protect_ally'] || 0) === 0
  ) {
    enemy.intent = 'PROTECCIÓN';
    enemy.intentCategory = 'DEFEND';
    enemy.intentValue = enemy.attack;
    return;
  }

  if (hpRatio <= 0.38 && (enemy.aiProfile.selfPreservation || 0) >= 0.6) {
    enemy.intent = 'DEFENSA';
    enemy.intentCategory = 'DEFEND';
    enemy.intentValue = enemy.attack;
    return;
  }

  const turn = (room.combatTurn || 1) + 1;
  if ((enemy.roleTag === 'CASTER' || enemy.isBoss) && turn % 2 === 0) {
    enemy.intent = enemy.isFinalBoss ? 'MALDICIÓN' : 'AFLICCIÓN';
    enemy.intentCategory = 'MAGIC';
    enemy.intentValue = Math.round(enemy.attack * 0.95);
    return;
  }

  enemy.intent = enemy.isElite || enemy.isBoss ? 'FURIA' : 'ATAQUE';
  enemy.intentCategory = 'ATTACK';
  enemy.intentValue = enemy.attack;
}

/**
 * Decrements enemy ability cooldowns and clears single-round defense/protection stances
 * at the start of a new enemy turn or round.
 */
export function tickEnemyCooldownsForNewRound(enemy: CriptaRoomEnemy): void {
  if (!enemy.memory) return;
  for (const key of Object.keys(enemy.memory.abilityCooldowns)) {
    const rem = enemy.memory.abilityCooldowns[key];
    if (rem > 0) {
      enemy.memory.abilityCooldowns[key] = Math.max(0, rem - 1);
    }
  }
}
