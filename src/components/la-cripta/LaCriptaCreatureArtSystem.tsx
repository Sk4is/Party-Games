import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CriptaCanonicalRoomType,
  CriptaDungeonDefinition,
  CriptaDungeonId,
  CriptaDungeonRoom,
  CriptaRoomEnemy,
} from '../../types/laCripta';
import { resolveEnemyVisualBlueprint } from '../../data/la-cripta/criptaBiomeBestiary';
import { LaCriptaUniqueBiomeSpriteSvg } from './LaCriptaUniqueBiomeSpriteRenderer';

const PRIMARY_AUTHORED_RIG_OWNER_SLUGS = new Set<string>([
  'guardian_de_la_cripta',
  'acolito_de_hueso',
  'hongo_errante',
  'trepadora_espinosa',
  'herrero_de_ceniza',
  'automata_de_escoria',
  'acolito_abisal',
  'guardian_de_coral',
  'minero_descascarado',
  'aranuelo_de_filon',
  'carcelero_real',
  'sabueso_de_cadenas',
  'penitente_de_hierro',
  'el_gran_verdugo',
  'ciervo_de_osamenta',
  'anciano_de_corteza',
  'rata_de_peste',
  'contrabandista_mutado',
  'limo_de_cloaca',
  'escriba_sin_rostro',
  'grimorio_animado',
  'obrera_de_quitina',
  'centinela_de_geoda',
  'alma_enjaulada',
  'acolito_carmesi',
  'guardia_momificado',
  'duelista_del_reflejo',
  'lobo_de_escarcha',
  'guerrero_congelado',
  'lancero_chatarra',
  'piromano_de_barril',
  'esqueleto_colosal',
  'heraldo_del_vacio',
  'soberano_del_umbral',
  'soberano_del_umbral_p2',
]);

// ============================================================================
// 1. CANONICAL CREATURE ANIMATION STATE MACHINE
// ============================================================================

export type CriptaCreatureAnimationState =
  | 'ENTER'
  | 'IDLE'
  | 'IDLE_VARIANT_A'
  | 'IDLE_VARIANT_B'
  | 'HOVER_REACTION'
  | 'TARGETED'
  | 'ANTICIPATION'
  | 'ATTACK'
  | 'SPECIAL_ATTACK'
  | 'DEFEND'
  | 'CAST'
  | 'HEAL'
  | 'BUFF'
  | 'DEBUFF'
  | 'HIT'
  | 'CRITICAL_HIT'
  | 'STATUS_APPLIED'
  | 'LOW_HP'
  | 'DEATH';

export type CriptaCreatureVisualFamily =
  | 'CASTLE_HOODED_JAILER'
  | 'CASTLE_IRON_HOUND'
  | 'CASTLE_CHAINED_PENITENT'
  | 'CASTLE_EXECUTIONER_JUDGE'
  | 'CATACOMBS_ROYAL_SKELETON'
  | 'CATACOMBS_SEPULCHER_ARCHER'
  | 'CATACOMBS_ASH_ACOLYTE'
  | 'GARDEN_MYCELIUM_HOST'
  | 'GARDEN_SPORE_FLOAT'
  | 'GARDEN_THORN_BEAST'
  | 'FORGE_BLIND_SMITH'
  | 'FORGE_SLAG_CONSTRUCT'
  | 'FORGE_EMBER_HOUND'
  | 'TEMPLE_BRINE_PRIEST'
  | 'TEMPLE_CORAL_CRUSTACEAN'
  | 'MINES_LANTERN_MINER'
  | 'MINES_CRYSTAL_BEETLE'
  | 'WOODS_ANTLER_STAG'
  | 'WOODS_HOLLOW_WOODSMAN'
  | 'SEWER_ALCHEMY_RAT'
  | 'SEWER_CONTRABANDIST'
  | 'SEWER_TOXIC_SLIME'
  | 'LIBRARY_FACELESS_SCRIBE'
  | 'LIBRARY_VORACIOUS_TOME'
  | 'TOWER_ARMILLARY_CONSTRUCT'
  | 'HIVE_CHITIN_WARRIOR'
  | 'CRYSTAL_PRISM_GOLEM'
  | 'PRISON_SHACKLED_WRAITH'
  | 'BLOOD_MASKED_PRIEST'
  | 'BURIED_SAND_MUMMY'
  | 'MIRROR_SILVER_DUELIST'
  | 'ICE_FROST_WOLF'
  | 'ICE_FROZEN_WARRIOR'
  | 'GOBLIN_SCRAP_RAIDER'
  | 'GOBLIN_BOMBARDIER'
  | 'GIANT_OSSUARY_COLOSSUS'
  | 'ABYSS_VOID_ENTITY'
  | 'FINAL_BOSS_PHASE_1'
  | 'FINAL_BOSS_PHASE_2';

export interface CreatureAnimationTiming {
  breathDurationMs: number;
  variantMinIntervalMs: number;
  variantMaxIntervalMs: number;
  variantDurationMs: number;
}

export interface CreatureVisualDefinition {
  creatureId: string;
  family: CriptaCreatureVisualFamily;
  subVariant?: 'GUARDIAN' | 'SHAMAN_CASTER' | 'STALKER_BEAST';
  biomeId: CriptaDungeonId;
  baseScale: number;
  anchor: 'ground' | 'floating';
  rimLightColor: string;
  shadowWidth: number;
  timing: CreatureAnimationTiming;
  palette: {
    primary: string;
    primaryDark: string;
    primaryLight: string;
    secondary: string;
    secondaryDark: string;
    metal: string;
    metalLight: string;
    metalDark: string;
    skinOrBone: string;
    skinShadow: string;
    eyeGlow: string;
    accent: string;
  };
}

// ============================================================================
// 2. RESOLVE SPECIFIC CREATURE FAMILY BY SLUG + ARCHETYPE (NO GENERIC REUSE)
// ============================================================================

export function resolveCreatureVisualDefinition(
  enemy: CriptaRoomEnemy,
  dungeonId?: CriptaDungeonId | null,
  enemyIndex = 0
): CreatureVisualDefinition {
  const slug = (enemy.slug || '').toLowerCase();
  const nameLower = (enemy.name || '').toLowerCase();
  const arch = enemy.spriteArchetype;

  const isShamanOrCaster =
    slug.includes('chaman') ||
    slug.includes('acolito') ||
    slug.includes('acólito') ||
    slug.includes('sacerdote') ||
    slug.includes('oraculo') ||
    slug.includes('escriba') ||
    enemy.roleTag === 'HEALER' ||
    enemy.roleTag === 'SUPPORT' ||
    (enemyIndex === 1 && !slug.includes('guardian'));

  const isStalkerOrBeast =
    slug.includes('zarza') ||
    slug.includes('arana') ||
    slug.includes('rata') ||
    slug.includes('escarabajo') ||
    slug.includes('mastin') ||
    slug.includes('sabueso') ||
    slug.includes('lobo') ||
    slug.includes('acechador') ||
    slug.includes('arquero') ||
    slug.includes('artificiero') ||
    slug.includes('tomo') ||
    enemy.roleTag === 'ASSASSIN' ||
    enemy.roleTag === 'SWARM' ||
    enemyIndex === 2;

  const subVariant: 'GUARDIAN' | 'SHAMAN_CASTER' | 'STALKER_BEAST' = isShamanOrCaster
    ? 'SHAMAN_CASTER'
    : isStalkerOrBeast
    ? 'STALKER_BEAST'
    : 'GUARDIAN';

  const tierScaleBoost = enemy.isFinalBoss
    ? 1.32
    : enemy.isBoss
    ? 1.26
    : enemy.isMiniboss
    ? 1.22
    : enemy.isElite
    ? 1.12
    : 1.0;

  // 1. FINAL BOSS PHASES
  if (arch === 'final_boss_phase2' || (enemy.isFinalBoss && enemy.bossPhase === 2)) {
    return {
      creatureId: enemy.slug || 'final_boss_phase2',
      family: 'FINAL_BOSS_PHASE_2',
      biomeId: 'el_abismo',
      baseScale: 1.34,
      anchor: 'floating',
      rimLightColor: '#FF4D6D',
      shadowWidth: 46,
      timing: {
        breathDurationMs: 2200,
        variantMinIntervalMs: 3600,
        variantMaxIntervalMs: 6500,
        variantDurationMs: 1100,
      },
      palette: {
        primary: '#2A0D1E',
        primaryDark: '#12050D',
        primaryLight: '#541836',
        secondary: '#C93B5B',
        secondaryDark: '#7A1930',
        metal: '#E7A54A',
        metalLight: '#FFD166',
        metalDark: '#8C5820',
        skinOrBone: '#F4EBD9',
        skinShadow: '#B8AC93',
        eyeGlow: '#FFD166',
        accent: '#FF4D6D',
      },
    };
  }

  if (arch === 'final_boss_phase1' || enemy.isFinalBoss) {
    return {
      creatureId: enemy.slug || 'final_boss_phase1',
      family: 'FINAL_BOSS_PHASE_1',
      biomeId: 'el_abismo',
      baseScale: 1.28,
      anchor: 'ground',
      rimLightColor: '#E7A54A',
      shadowWidth: 44,
      timing: {
        breathDurationMs: 2600,
        variantMinIntervalMs: 4000,
        variantMaxIntervalMs: 7200,
        variantDurationMs: 1100,
      },
      palette: {
        primary: '#241536',
        primaryDark: '#11091C',
        primaryLight: '#3F265C',
        secondary: '#8F263D',
        secondaryDark: '#4F1220',
        metal: '#D8C6A0',
        metalLight: '#FFF3C4',
        metalDark: '#7D6B4A',
        skinOrBone: '#D9D0BC',
        skinShadow: '#9E9482',
        eyeGlow: '#FF4D6D',
        accent: '#FFD166',
      },
    };
  }

  // 2. CASTILLO DEL VERDUGO (Prison / Execution / Iron Hound / Hooded Jailer)
  if (
    slug.includes('mastin') ||
    nameLower.includes('mastín') ||
    nameLower.includes('sabueso') ||
    slug.includes('huargo')
  ) {
    const isForgeHound = slug.includes('brasa') || dungeonId === 'forja_infernal';
    const isBloodHound = slug.includes('altar') || dungeonId === 'santuario_de_sangre';
    return {
      creatureId: enemy.slug,
      family: isForgeHound ? 'FORGE_EMBER_HOUND' : 'CASTLE_IRON_HOUND',
      biomeId: dungeonId || 'castillo_del_verdugo',
      baseScale: 0.96 * tierScaleBoost,
      anchor: 'ground',
      rimLightColor: isForgeHound ? '#FF7A33' : isBloodHound ? '#C93B5B' : '#E7A54A',
      shadowWidth: 42,
      timing: {
        breathDurationMs: 1750,
        variantMinIntervalMs: 3200,
        variantMaxIntervalMs: 6200,
        variantDurationMs: 950,
      },
      palette: {
        primary: isForgeHound ? '#2E1A18' : '#261F29',
        primaryDark: '#120E14',
        primaryLight: isForgeHound ? '#4D2B26' : '#3D3242',
        secondary: isForgeHound ? '#D95326' : '#7A2332',
        secondaryDark: '#47121B',
        metal: '#6E7380',
        metalLight: '#A8B0C2',
        metalDark: '#393C45',
        skinOrBone: '#D9D0BC',
        skinShadow: '#8C8270',
        eyeGlow: isForgeHound ? '#FFD166' : '#FF4D6D',
        accent: isForgeHound ? '#FF7A33' : '#E7A54A',
      },
    };
  }

  if (
    slug.includes('carcelero') ||
    nameLower.includes('carcelero') ||
    slug.includes('verdugo') ||
    slug.includes('inquisidor') ||
    slug.includes('juez') ||
    arch === 'executioner'
  ) {
    const isPenitent = slug.includes('penitente');
    const isJudgeOrBoss =
      slug.includes('juez') ||
      slug.includes('gran_verdugo') ||
      slug.includes('inquisidor') ||
      enemy.isElite ||
      enemy.isMiniboss ||
      enemy.isBoss;

    return {
      creatureId: enemy.slug,
      family: isPenitent
        ? 'CASTLE_CHAINED_PENITENT'
        : isJudgeOrBoss
        ? 'CASTLE_EXECUTIONER_JUDGE'
        : 'CASTLE_HOODED_JAILER',
      biomeId: 'castillo_del_verdugo',
      baseScale: (isJudgeOrBoss ? 1.08 : 1.02) * tierScaleBoost,
      anchor: 'ground',
      rimLightColor: '#E7A54A',
      shadowWidth: 38,
      timing: {
        breathDurationMs: 2650,
        variantMinIntervalMs: 3500,
        variantMaxIntervalMs: 7200,
        variantDurationMs: 1150,
      },
      palette: {
        primary: '#2B222C',
        primaryDark: '#140F16',
        primaryLight: '#433545',
        secondary: '#6E2230',
        secondaryDark: '#3D1019',
        metal: '#787E8C',
        metalLight: '#B4BCCF',
        metalDark: '#3E424D',
        skinOrBone: '#C9B99F',
        skinShadow: '#7D6E59',
        eyeGlow: '#FFD166',
        accent: '#E7A54A',
      },
    };
  }

  // 3. ALCANTARILLAS IMPERIALES (Rats / Contrabandists / Slimes)
  if (slug.includes('rata') || nameLower.includes('rata')) {
    return {
      creatureId: enemy.slug,
      family: 'SEWER_ALCHEMY_RAT',
      biomeId: 'alcantarillas_imperiales',
      baseScale: 0.84 * tierScaleBoost,
      anchor: 'ground',
      rimLightColor: '#8EE6AE',
      shadowWidth: 34,
      timing: {
        breathDurationMs: 1450,
        variantMinIntervalMs: 2600,
        variantMaxIntervalMs: 5200,
        variantDurationMs: 800,
      },
      palette: {
        primary: '#3B3532',
        primaryDark: '#1F1B19',
        primaryLight: '#59504B',
        secondary: '#5EA87A',
        secondaryDark: '#2E6142',
        metal: '#7A8279',
        metalLight: '#A8B5A6',
        metalDark: '#3E453D',
        skinOrBone: '#D1A799',
        skinShadow: '#8A665B',
        eyeGlow: '#A8F0C2',
        accent: '#8EE6AE',
      },
    };
  }

  if (slug.includes('limo') || slug.includes('amalgama') || slug.includes('abominacion')) {
    return {
      creatureId: enemy.slug,
      family: 'SEWER_TOXIC_SLIME',
      biomeId: 'alcantarillas_imperiales',
      baseScale: 1.04 * tierScaleBoost,
      anchor: 'ground',
      rimLightColor: '#8EE6AE',
      shadowWidth: 44,
      timing: {
        breathDurationMs: 2100,
        variantMinIntervalMs: 3200,
        variantMaxIntervalMs: 6000,
        variantDurationMs: 1050,
      },
      palette: {
        primary: '#2F5E46',
        primaryDark: '#173325',
        primaryLight: '#529972',
        secondary: '#8EE6AE',
        secondaryDark: '#3B7A54',
        metal: '#6E6854',
        metalLight: '#9E967B',
        metalDark: '#3B372B',
        skinOrBone: '#D9D0BC',
        skinShadow: '#8C8470',
        eyeGlow: '#FFD166',
        accent: '#A8F0C2',
      },
    };
  }

  if (arch === 'sewer_abomination' || slug.includes('contrabandista') || slug.includes('compuertas')) {
    return {
      creatureId: enemy.slug,
      family: 'SEWER_CONTRABANDIST',
      biomeId: 'alcantarillas_imperiales',
      baseScale: 0.98 * tierScaleBoost,
      anchor: 'ground',
      rimLightColor: '#69A8A5',
      shadowWidth: 36,
      timing: {
        breathDurationMs: 2100,
        variantMinIntervalMs: 3100,
        variantMaxIntervalMs: 6200,
        variantDurationMs: 950,
      },
      palette: {
        primary: '#29332D',
        primaryDark: '#131A16',
        primaryLight: '#415248',
        secondary: '#6B4E35',
        secondaryDark: '#3D2B1C',
        metal: '#7A8782',
        metalLight: '#B0C2BC',
        metalDark: '#404A46',
        skinOrBone: '#C4B69E',
        skinShadow: '#786D5B',
        eyeGlow: '#8EE6AE',
        accent: '#69A8A5',
      },
    };
  }

  // 4. JARDÍN PODRIDO (Fungal Guardian Brute / Mycelial Shaman / Briar Stalker Beast)
  if (arch === 'plague_bloom' || dungeonId === 'jardin_podrido') {
    const isShaman =
      slug.includes('chaman') ||
      slug.includes('espora_errante') ||
      (slug.includes('espora') && !slug.includes('guardian') && !slug.includes('brote')) ||
      enemy.roleTag === 'HEALER' ||
      (enemyIndex === 1 && !slug.includes('guardian'));
    const isThorn =
      slug.includes('zarza') ||
      slug.includes('arana') ||
      enemy.roleTag === 'ASSASSIN' ||
      (enemyIndex === 2 && !isShaman);
    return {
      creatureId: enemy.slug,
      family: isShaman
        ? 'GARDEN_SPORE_FLOAT'
        : isThorn
        ? 'GARDEN_THORN_BEAST'
        : 'GARDEN_MYCELIUM_HOST',
      subVariant,
      biomeId: 'jardin_podrido',
      baseScale: (isShaman ? 0.98 : isThorn ? 0.96 : 1.05) * tierScaleBoost,
      anchor: 'ground',
      rimLightColor: isShaman ? '#7BDFF2' : '#A3C995',
      shadowWidth: isThorn ? 44 : isShaman ? 34 : 40,
      timing: {
        breathDurationMs: isShaman ? 2100 : 2400,
        variantMinIntervalMs: 3000,
        variantMaxIntervalMs: 6000,
        variantDurationMs: 1100,
      },
      palette: {
        primary: '#2A3B2C',
        primaryDark: '#121C14',
        primaryLight: '#49694D',
        secondary: isShaman ? '#328276' : '#8E5EA8',
        secondaryDark: isShaman ? '#1B4A43' : '#4E2F61',
        metal: '#6B533B',
        metalLight: '#9E7D5B',
        metalDark: '#3D2E1F',
        skinOrBone: '#DFD2B4',
        skinShadow: '#8A7D60',
        eyeGlow: isShaman ? '#7BDFF2' : '#D4FF80',
        accent: '#8EE6AE',
      },
    };
  }

  // 5. FORJA INFERNAL (Molten / Furnace / Smith / Ember Hound)
  if (arch === 'iron_golem' || dungeonId === 'forja_infernal') {
    if (slug.includes('sabueso') || enemyIndex === 2) {
      return {
        creatureId: enemy.slug,
        family: 'FORGE_EMBER_HOUND',
        subVariant: 'STALKER_BEAST',
        biomeId: 'forja_infernal',
        baseScale: 0.96 * tierScaleBoost,
        anchor: 'ground',
        rimLightColor: '#FF7A33',
        shadowWidth: 42,
        timing: {
          breathDurationMs: 1750,
          variantMinIntervalMs: 3000,
          variantMaxIntervalMs: 5800,
          variantDurationMs: 950,
        },
        palette: {
          primary: '#2E1A18',
          primaryDark: '#140A09',
          primaryLight: '#4D2B26',
          secondary: '#E65C26',
          secondaryDark: '#8C2B0E',
          metal: '#6E7380',
          metalLight: '#A8B0C2',
          metalDark: '#393C45',
          skinOrBone: '#FFD166',
          skinShadow: '#C96A2B',
          eyeGlow: '#FFD166',
          accent: '#FF7A33',
        },
      };
    }
    const isConstruct =
      slug.includes('golem') ||
      slug.includes('coloso') ||
      (enemyIndex === 0 && !slug.includes('herrador'));
    return {
      creatureId: enemy.slug,
      family: isConstruct ? 'FORGE_SLAG_CONSTRUCT' : 'FORGE_BLIND_SMITH',
      subVariant,
      biomeId: 'forja_infernal',
      baseScale: (isConstruct ? 1.12 : 1.0) * tierScaleBoost,
      anchor: 'ground',
      rimLightColor: '#FF7A33',
      shadowWidth: 42,
      timing: {
        breathDurationMs: 2500,
        variantMinIntervalMs: 3400,
        variantMaxIntervalMs: 6600,
        variantDurationMs: 1100,
      },
      palette: {
        primary: '#2B2224',
        primaryDark: '#140E10',
        primaryLight: '#47393C',
        secondary: '#E65C26',
        secondaryDark: '#8C2B0E',
        metal: '#575359',
        metalLight: '#8E8891',
        metalDark: '#2B282C',
        skinOrBone: '#FFD166',
        skinShadow: '#C96A2B',
        eyeGlow: '#FFF3C4',
        accent: '#FF7A33',
      },
    };
  }

  // 6. TEMPLO SUMERGIDO (Aquatic / Barnacles / Coral / Drowned Priest)
  if (arch === 'deep_serpent' || dungeonId === 'templo_sumergido') {
    const isCoralBeast =
      slug.includes('acechador') ||
      slug.includes('coral') ||
      slug.includes('leviat') ||
      (enemyIndex % 2 === 1 && !slug.includes('sacerdote'));
    return {
      creatureId: enemy.slug,
      family: isCoralBeast ? 'TEMPLE_CORAL_CRUSTACEAN' : 'TEMPLE_BRINE_PRIEST',
      subVariant,
      biomeId: 'templo_sumergido',
      baseScale: 1.02 * tierScaleBoost,
      anchor: 'ground',
      rimLightColor: '#69A8A5',
      shadowWidth: 38,
      timing: {
        breathDurationMs: 2600,
        variantMinIntervalMs: 3400,
        variantMaxIntervalMs: 6800,
        variantDurationMs: 1100,
      },
      palette: {
        primary: '#1C363E',
        primaryDark: '#0D1C21',
        primaryLight: '#2E5866',
        secondary: '#D96B78',
        secondaryDark: '#7D323C',
        metal: '#5C8582',
        metalLight: '#9ED2CE',
        metalDark: '#2E4745',
        skinOrBone: '#A8CCC9',
        skinShadow: '#5D807D',
        eyeGlow: '#7BDFF2',
        accent: '#69A8A5',
      },
    };
  }

  // 7. MINAS ABANDONADAS (Lantern Miner / Crystal Vein Beetle)
  if (arch === 'mine_stalker' || dungeonId === 'minas_abandonadas') {
    const isBeetle =
      slug.includes('escarabajo') ||
      slug.includes('devorador') ||
      (enemyIndex % 2 === 1 && !slug.includes('minero'));
    return {
      creatureId: enemy.slug,
      family: isBeetle ? 'MINES_CRYSTAL_BEETLE' : 'MINES_LANTERN_MINER',
      subVariant,
      biomeId: 'minas_abandonadas',
      baseScale: (isBeetle ? 0.94 : 1.0) * tierScaleBoost,
      anchor: 'ground',
      rimLightColor: '#FFD166',
      shadowWidth: 38,
      timing: {
        breathDurationMs: 2200,
        variantMinIntervalMs: 3200,
        variantMaxIntervalMs: 6400,
        variantDurationMs: 1000,
      },
      palette: {
        primary: '#3B2F26',
        primaryDark: '#1C1611',
        primaryLight: '#5C4A3C',
        secondary: '#69A8A5',
        secondaryDark: '#365E5C',
        metal: '#7A736B',
        metalLight: '#B0A79C',
        metalDark: '#423D38',
        skinOrBone: '#C9BA9E',
        skinShadow: '#7A6E58',
        eyeGlow: '#FFD166',
        accent: '#E7A54A',
      },
    };
  }

  // 8. BOSQUE DE LOS SUSURROS (Antler Stag / Hollow Woodsman)
  if (arch === 'wisp_phantom' || dungeonId === 'bosque_de_los_susurros') {
    const isWoodsman =
      slug.includes('leñador') ||
      slug.includes('guardian') ||
      (enemyIndex % 2 === 1 && !slug.includes('ciervo'));
    return {
      creatureId: enemy.slug,
      family: isWoodsman ? 'WOODS_HOLLOW_WOODSMAN' : 'WOODS_ANTLER_STAG',
      subVariant,
      biomeId: 'bosque_de_los_susurros',
      baseScale: 1.04 * tierScaleBoost,
      anchor: 'ground',
      rimLightColor: '#7BDFF2',
      shadowWidth: 38,
      timing: {
        breathDurationMs: 2500,
        variantMinIntervalMs: 3500,
        variantMaxIntervalMs: 6800,
        variantDurationMs: 1100,
      },
      palette: {
        primary: '#262B38',
        primaryDark: '#12151E',
        primaryLight: '#3E4659',
        secondary: '#4E7A61',
        secondaryDark: '#274233',
        metal: '#8A8479',
        metalLight: '#C2B9AA',
        metalDark: '#4A463F',
        skinOrBone: '#E5DEC9',
        skinShadow: '#9E9680',
        eyeGlow: '#7BDFF2',
        accent: '#69A8A5',
      },
    };
  }

  // 9. BIBLIOTECA PROHIBIDA (Faceless Ink Scribe / Voracious Chained Tome)
  if (arch === 'arcane_archivist' || dungeonId === 'biblioteca_prohibida') {
    const isTome =
      slug.includes('tomo') ||
      (enemyIndex % 2 === 1 && !slug.includes('archivista'));
    return {
      creatureId: enemy.slug,
      family: isTome ? 'LIBRARY_VORACIOUS_TOME' : 'LIBRARY_FACELESS_SCRIBE',
      subVariant,
      biomeId: 'biblioteca_prohibida',
      baseScale: (isTome ? 0.94 : 1.02) * tierScaleBoost,
      anchor: isTome ? 'floating' : 'ground',
      rimLightColor: '#9B72CF',
      shadowWidth: 34,
      timing: {
        breathDurationMs: 2400,
        variantMinIntervalMs: 3000,
        variantMaxIntervalMs: 6000,
        variantDurationMs: 1050,
      },
      palette: {
        primary: '#2D1E3E',
        primaryDark: '#160D21',
        primaryLight: '#4A3266',
        secondary: '#9B72CF',
        secondaryDark: '#573A80',
        metal: '#C99E52',
        metalLight: '#FFD166',
        metalDark: '#735624',
        skinOrBone: '#EBE1CE',
        skinShadow: '#A69A83',
        eyeGlow: '#E0AAFF',
        accent: '#9B72CF',
      },
    };
  }

  // 10. TORRE DEL ASTRÓLOGO
  if (arch === 'astral_weaver' || dungeonId === 'torre_del_astrologo') {
    return {
      creatureId: enemy.slug,
      family: 'TOWER_ARMILLARY_CONSTRUCT',
      subVariant,
      biomeId: 'torre_del_astrologo',
      baseScale: 1.04 * tierScaleBoost,
      anchor: 'floating',
      rimLightColor: '#FFD166',
      shadowWidth: 36,
      timing: {
        breathDurationMs: 2600,
        variantMinIntervalMs: 3400,
        variantMaxIntervalMs: 6500,
        variantDurationMs: 1100,
      },
      palette: {
        primary: '#1E1B38',
        primaryDark: '#0D0B1C',
        primaryLight: '#342F5E',
        secondary: '#7656A8',
        secondaryDark: '#412C63',
        metal: '#D49B4B',
        metalLight: '#FFD166',
        metalDark: '#7A5420',
        skinOrBone: '#E8DFCE',
        skinShadow: '#998F7C',
        eyeGlow: '#7BDFF2',
        accent: '#FFD166',
      },
    };
  }

  // 11. LA COLMENA
  if (arch === 'chitin_drone' || dungeonId === 'la_colmena') {
    return {
      creatureId: enemy.slug,
      family: 'HIVE_CHITIN_WARRIOR',
      subVariant,
      biomeId: 'la_colmena',
      baseScale: 1.04 * tierScaleBoost,
      anchor: 'ground',
      rimLightColor: '#E7A54A',
      shadowWidth: 40,
      timing: {
        breathDurationMs: 1650,
        variantMinIntervalMs: 2700,
        variantMaxIntervalMs: 5400,
        variantDurationMs: 850,
      },
      palette: {
        primary: '#3B2818',
        primaryDark: '#1C120A',
        primaryLight: '#5E4127',
        secondary: '#E7A54A',
        secondaryDark: '#99641E',
        metal: '#6E4F35',
        metalLight: '#A67B56',
        metalDark: '#3B291A',
        skinOrBone: '#FFD166',
        skinShadow: '#B88228',
        eyeGlow: '#FF4D6D',
        accent: '#FFD166',
      },
    };
  }

  // 12. CRIPTA DE CRISTAL
  if (arch === 'crystal_sentinel' || dungeonId === 'cripta_de_cristal') {
    return {
      creatureId: enemy.slug,
      family: 'CRYSTAL_PRISM_GOLEM',
      subVariant,
      biomeId: 'cripta_de_cristal',
      baseScale: 1.06 * tierScaleBoost,
      anchor: 'ground',
      rimLightColor: '#7BDFF2',
      shadowWidth: 40,
      timing: {
        breathDurationMs: 2700,
        variantMinIntervalMs: 3600,
        variantMaxIntervalMs: 6800,
        variantDurationMs: 1100,
      },
      palette: {
        primary: '#1E3442',
        primaryDark: '#0E1A22',
        primaryLight: '#32566E',
        secondary: '#9B72CF',
        secondaryDark: '#55387D',
        metal: '#69A8A5',
        metalLight: '#B8F2FF',
        metalDark: '#335E5C',
        skinOrBone: '#E0F7FA',
        skinShadow: '#82B9C2',
        eyeGlow: '#FFF3C4',
        accent: '#7BDFF2',
      },
    };
  }

  // 13. PRISIÓN MALDITA
  if (arch === 'chained_wraith' || dungeonId === 'prision_maldita') {
    return {
      creatureId: enemy.slug,
      family: 'PRISON_SHACKLED_WRAITH',
      subVariant,
      biomeId: 'prision_maldita',
      baseScale: 1.04 * tierScaleBoost,
      anchor: subVariant === 'SHAMAN_CASTER' ? 'floating' : 'ground',
      rimLightColor: '#9B72CF',
      shadowWidth: 36,
      timing: {
        breathDurationMs: 2300,
        variantMinIntervalMs: 3200,
        variantMaxIntervalMs: 6200,
        variantDurationMs: 1050,
      },
      palette: {
        primary: '#252033',
        primaryDark: '#110E1A',
        primaryLight: '#3E3654',
        secondary: '#69A8A5',
        secondaryDark: '#365E5C',
        metal: '#737885',
        metalLight: '#A8B0C2',
        metalDark: '#3B3E47',
        skinOrBone: '#C2D6D4',
        skinShadow: '#6E8583',
        eyeGlow: '#7BDFF2',
        accent: '#9B72CF',
      },
    };
  }

  // 14. SANTUARIO DE SANGRE
  if (arch === 'blood_acolyte' || dungeonId === 'santuario_de_sangre') {
    return {
      creatureId: enemy.slug,
      family: 'BLOOD_MASKED_PRIEST',
      subVariant,
      biomeId: 'santuario_de_sangre',
      baseScale: 1.02 * tierScaleBoost,
      anchor: 'ground',
      rimLightColor: '#C93B5B',
      shadowWidth: 36,
      timing: {
        breathDurationMs: 2400,
        variantMinIntervalMs: 3300,
        variantMaxIntervalMs: 6500,
        variantDurationMs: 1050,
      },
      palette: {
        primary: '#3B121E',
        primaryDark: '#1C070D',
        primaryLight: '#631E32',
        secondary: '#C93B5B',
        secondaryDark: '#781B30',
        metal: '#D4A359',
        metalLight: '#FFD166',
        metalDark: '#7D5B26',
        skinOrBone: '#E8DFCE',
        skinShadow: '#9E927D',
        eyeGlow: '#FF4D6D',
        accent: '#C93B5B',
      },
    };
  }

  // 15. CIUDAD SEPULTADA
  if (arch === 'sand_mummy' || dungeonId === 'ciudad_sepultada') {
    return {
      creatureId: enemy.slug,
      family: 'BURIED_SAND_MUMMY',
      subVariant,
      biomeId: 'ciudad_sepultada',
      baseScale: 1.02 * tierScaleBoost,
      anchor: 'ground',
      rimLightColor: '#E7A54A',
      shadowWidth: 38,
      timing: {
        breathDurationMs: 2600,
        variantMinIntervalMs: 3500,
        variantMaxIntervalMs: 6800,
        variantDurationMs: 1100,
      },
      palette: {
        primary: '#3D3122',
        primaryDark: '#1F1810',
        primaryLight: '#614E37',
        secondary: '#3E828C',
        secondaryDark: '#1F494F',
        metal: '#D99E46',
        metalLight: '#FFD166',
        metalDark: '#82591D',
        skinOrBone: '#D8C6A0',
        skinShadow: '#8F7E5E',
        eyeGlow: '#7BDFF2',
        accent: '#E7A54A',
      },
    };
  }

  // 16. PALACIO DE LOS ESPEJOS
  if (arch === 'mirror_doppel' || dungeonId === 'palacio_de_los_espejos') {
    return {
      creatureId: enemy.slug,
      family: 'MIRROR_SILVER_DUELIST',
      subVariant,
      biomeId: 'palacio_de_los_espejos',
      baseScale: 1.02 * tierScaleBoost,
      anchor: 'ground',
      rimLightColor: '#E0AAFF',
      shadowWidth: 36,
      timing: {
        breathDurationMs: 2300,
        variantMinIntervalMs: 3100,
        variantMaxIntervalMs: 6000,
        variantDurationMs: 1000,
      },
      palette: {
        primary: '#282438',
        primaryDark: '#13101C',
        primaryLight: '#433D5E',
        secondary: '#7656A8',
        secondaryDark: '#422D63',
        metal: '#B8C2CC',
        metalLight: '#F0F7FF',
        metalDark: '#68717A',
        skinOrBone: '#F2ECE1',
        skinShadow: '#A69F94',
        eyeGlow: '#7BDFF2',
        accent: '#E0AAFF',
      },
    };
  }

  // 17. CAVERNAS HELADAS
  if (arch === 'frost_wolf' || dungeonId === 'cavernas_heladas') {
    const isWolf =
      slug.includes('lobo') ||
      slug.includes('wyrm') ||
      (enemyIndex % 2 === 1 && !slug.includes('guerrero'));
    return {
      creatureId: enemy.slug,
      family: isWolf ? 'ICE_FROST_WOLF' : 'ICE_FROZEN_WARRIOR',
      subVariant,
      biomeId: 'cavernas_heladas',
      baseScale: (isWolf ? 0.96 : 1.04) * tierScaleBoost,
      anchor: 'ground',
      rimLightColor: '#7BDFF2',
      shadowWidth: 40,
      timing: {
        breathDurationMs: 2100,
        variantMinIntervalMs: 3200,
        variantMaxIntervalMs: 6200,
        variantDurationMs: 1000,
      },
      palette: {
        primary: '#243542',
        primaryDark: '#101A21',
        primaryLight: '#3B576B',
        secondary: '#69A8A5',
        secondaryDark: '#365E5C',
        metal: '#89B0C2',
        metalLight: '#D4F5FF',
        metalDark: '#476473',
        skinOrBone: '#DCE8ED',
        skinShadow: '#8BA1AB',
        eyeGlow: '#7BDFF2',
        accent: '#7BDFF2',
      },
    };
  }

  // 18. FORTALEZA GOBLIN
  if (arch === 'goblin_raider' || dungeonId === 'fortaleza_goblin') {
    const isBombardier =
      slug.includes('artificiero') ||
      slug.includes('polvora') ||
      slug.includes('chaman') ||
      enemyIndex % 2 === 1;
    return {
      creatureId: enemy.slug,
      family: isBombardier ? 'GOBLIN_BOMBARDIER' : 'GOBLIN_SCRAP_RAIDER',
      subVariant,
      biomeId: 'fortaleza_goblin',
      baseScale: 0.92 * tierScaleBoost,
      anchor: 'ground',
      rimLightColor: '#E7A54A',
      shadowWidth: 34,
      timing: {
        breathDurationMs: 1550,
        variantMinIntervalMs: 2400,
        variantMaxIntervalMs: 4800,
        variantDurationMs: 850,
      },
      palette: {
        primary: '#3B2D22',
        primaryDark: '#1C150F',
        primaryLight: '#5C4635',
        secondary: '#B83B2B',
        secondaryDark: '#6E1E14',
        metal: '#736E65',
        metalLight: '#A8A196',
        metalDark: '#3D3A35',
        skinOrBone: '#6B8E4E',
        skinShadow: '#425C2E',
        eyeGlow: '#FFD166',
        accent: '#E7A54A',
      },
    };
  }

  // 19. CEMENTERIO DE GIGANTES
  if (arch === 'bone_colossus' || dungeonId === 'cementerio_de_gigantes') {
    return {
      creatureId: enemy.slug,
      family: 'GIANT_OSSUARY_COLOSSUS',
      subVariant,
      biomeId: 'cementerio_de_gigantes',
      baseScale: 1.14 * tierScaleBoost,
      anchor: 'ground',
      rimLightColor: '#D8C6A0',
      shadowWidth: 44,
      timing: {
        breathDurationMs: 2900,
        variantMinIntervalMs: 3800,
        variantMaxIntervalMs: 7400,
        variantDurationMs: 1200,
      },
      palette: {
        primary: '#2E2B26',
        primaryDark: '#171512',
        primaryLight: '#4A453D',
        secondary: '#8F263D',
        secondaryDark: '#4D111E',
        metal: '#7D7568',
        metalLight: '#B5AA98',
        metalDark: '#423D36',
        skinOrBone: '#E5DEC9',
        skinShadow: '#9E9580',
        eyeGlow: '#FFD166',
        accent: '#D8C6A0',
      },
    };
  }

  // 20. EL ABISMO (Impossible Anatomy / Void / Displaced Eyes)
  if (arch === 'void_herald' || dungeonId === 'el_abismo') {
    return {
      creatureId: enemy.slug,
      family: 'ABYSS_VOID_ENTITY',
      subVariant,
      biomeId: 'el_abismo',
      baseScale: 1.06 * tierScaleBoost,
      anchor: 'floating',
      rimLightColor: '#9B72CF',
      shadowWidth: 38,
      timing: {
        breathDurationMs: 2050,
        variantMinIntervalMs: 2800,
        variantMaxIntervalMs: 5400,
        variantDurationMs: 950,
      },
      palette: {
        primary: '#181024',
        primaryDark: '#09050F',
        primaryLight: '#2E1E45',
        secondary: '#9B72CF',
        secondaryDark: '#4F2F7A',
        metal: '#C93B5B',
        metalLight: '#FF8FA3',
        metalDark: '#6B182B',
        skinOrBone: '#D9D0BC',
        skinShadow: '#7A7285',
        eyeGlow: '#FFD166',
        accent: '#E0AAFF',
      },
    };
  }

  // DEFAULT / CATACUMBAS DEL REY (Royal Skeleton Soldier / Archer / Ash Acolyte)
  const isArcher = slug.includes('arquero') || enemyIndex === 2;
  const isAcolyte =
    slug.includes('acolito') ||
    slug.includes('acólito') ||
    slug.includes('chaman') ||
    enemy.roleTag === 'HEALER' ||
    (enemyIndex === 1 && !isArcher);
  return {
    creatureId: enemy.slug,
    family: isArcher
      ? 'CATACOMBS_SEPULCHER_ARCHER'
      : isAcolyte
      ? 'CATACOMBS_ASH_ACOLYTE'
      : 'CATACOMBS_ROYAL_SKELETON',
    subVariant,
    biomeId: 'catacumbas_del_rey',
    baseScale: 1.0 * tierScaleBoost,
    anchor: 'ground',
    rimLightColor: '#E7A54A',
    shadowWidth: 38,
    timing: {
      breathDurationMs: 2400,
      variantMinIntervalMs: 3400,
      variantMaxIntervalMs: 6600,
      variantDurationMs: 1050,
    },
    palette: {
      primary: '#2B2333',
      primaryDark: '#14101A',
      primaryLight: '#453852',
      secondary: '#8F263D',
      secondaryDark: '#4F1220',
      metal: '#C99E52',
      metalLight: '#FFD166',
      metalDark: '#6E5220',
      skinOrBone: '#E5DEC9',
      skinShadow: '#9E9580',
      eyeGlow: '#E7A54A',
      accent: '#FFD166',
    },
  };
}

// ============================================================================
// 3. DETERMINISTIC HASH & ARTICULATED ANIMATION STATE HOOK
// ============================================================================

function hashStringSeed(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

interface ArticulatedPose {
  state: CriptaCreatureAnimationState;
  breathPhase: 0 | 1 | 2;
  secondaryPhase: 0 | 1 | 2 | 3;
  torsoX: number;
  torsoY: number;
  headX: number;
  headY: number;
  jawOpen: number;
  weaponX: number;
  weaponY: number;
  propX: number;
  propY: number;
  eyeShiftX: number;
  eyeBlink: boolean;
  showSlashArc: boolean;
  hitFlash: boolean;
  isDeadCollapsed: boolean;
}

export interface LaCriptaArticulatedCreatureProps {
  enemy: CriptaRoomEnemy;
  dungeonId?: CriptaDungeonId | null;
  isTargeted?: boolean;
  animState?: 'idle' | 'hit' | 'lunge' | 'death';
  totalVisibleEnemies?: number;
  enemyIndex?: number;
  customSizePx?: number;
}

export const LaCriptaArticulatedCreatureSprite: React.FC<
  LaCriptaArticulatedCreatureProps
> = ({
  enemy,
  dungeonId,
  isTargeted = false,
  animState = 'idle',
  totalVisibleEnemies = 1,
  enemyIndex = 0,
  customSizePx,
}) => {
  const def = useMemo(
    () => resolveCreatureVisualDefinition(enemy, dungeonId, enemyIndex),
    [enemy, dungeonId, enemyIndex]
  );

  const uniqueBlueprint = useMemo(
    () => resolveEnemyVisualBlueprint(enemy, dungeonId),
    [enemy, dungeonId]
  );
  const useUniqueBiomeRig = !PRIMARY_AUTHORED_RIG_OWNER_SLUGS.has(
    uniqueBlueprint.slug
  );

  const seed = useMemo(() => hashStringSeed(enemy.id || enemy.slug || 'e'), [
    enemy.id,
    enemy.slug,
  ]);

  const [isHovered, setIsHovered] = useState(false);
  const [cursorLookX, setCursorLookX] = useState<number>(0);
  const [isEntering, setIsEntering] = useState<boolean>(true);
  const [statusAppliedFlash, setStatusAppliedFlash] = useState<boolean>(false);
  const [idleVariant, setIdleVariant] = useState<
    'NONE' | 'IDLE_VARIANT_A' | 'IDLE_VARIANT_B'
  >('NONE');
  const [combatSubStage, setCombatSubStage] = useState<
    | 'NONE'
    | 'ANTICIPATION'
    | 'STRIKE'
    | 'SPECIAL_STRIKE'
    | 'CASTING'
    | 'RECOVERY'
    | 'HIT_RECOIL'
    | 'CRITICAL_RECOIL'
  >('NONE');
  const [frameTick, setFrameTick] = useState<number>(() => seed % 12);

  const isLowHp =
    enemy.hp > 0 && enemy.maxHp > 0 && enemy.hp / enemy.maxHp <= 0.32;
  const isDead = enemy.hp <= 0 || animState === 'death';

  // Entry animation when creature first spawns in the encounter stage
  useEffect(() => {
    setIsEntering(true);
    const t = window.setTimeout(() => setIsEntering(false), 360);
    return () => window.clearTimeout(t);
  }, [enemy.id]);

  // Detect newly applied status effects on this creature
  const prevStatusCountRef = useRef<number>(
    (enemy.poisonStacks || 0) +
      (enemy.vulnerableTurns || 0) +
      (enemy.isDefending ? 1 : 0)
  );
  useEffect(() => {
    const currentStatusCount =
      (enemy.poisonStacks || 0) +
      (enemy.vulnerableTurns || 0) +
      (enemy.isDefending ? 1 : 0);
    if (currentStatusCount > prevStatusCountRef.current && !isDead) {
      setStatusAppliedFlash(true);
      const t = window.setTimeout(() => setStatusAppliedFlash(false), 420);
      prevStatusCountRef.current = currentStatusCount;
      return () => window.clearTimeout(t);
    }
    prevStatusCountRef.current = currentStatusCount;
  }, [enemy.poisonStacks, enemy.vulnerableTurns, enemy.isDefending, isDead]);

  // Trigger multi-stage anticipation -> strike/cast/special -> recovery when animState changes
  const prevAnimRef = useRef<string>(animState);
  const prevHpRef = useRef<number>(enemy.hp);
  useEffect(() => {
    const hpDrop = prevHpRef.current - enemy.hp;
    prevHpRef.current = enemy.hp;

    if (animState === prevAnimRef.current) return;
    prevAnimRef.current = animState;

    if (animState === 'lunge') {
      const intentKind = enemy.nextIntentActionKind || 'DIRECT_ATTACK';
      const isCastOrRitual =
        intentKind === 'APPLY_STATUS' ||
        intentKind === 'HEAL_ALLY' ||
        intentKind === 'SUMMON_REINFORCEMENT' ||
        intentKind === 'BUFF_ENEMIES';
      const isSpecialOrAoe =
        intentKind === 'AOE_ATTACK' ||
        intentKind === 'CHARGE_TELEGRAPH' ||
        Boolean(enemy.isBoss || enemy.isFinalBoss || enemy.isMiniboss);

      setCombatSubStage('ANTICIPATION');
      const t1 = window.setTimeout(
        () =>
          setCombatSubStage(
            isCastOrRitual
              ? 'CASTING'
              : isSpecialOrAoe
              ? 'SPECIAL_STRIKE'
              : 'STRIKE'
          ),
        165
      );
      const t2 = window.setTimeout(() => setCombatSubStage('RECOVERY'), 440);
      const t3 = window.setTimeout(() => setCombatSubStage('NONE'), 680);
      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
        window.clearTimeout(t3);
      };
    }

    if (animState === 'hit') {
      const isCrit = hpDrop >= Math.max(12, Math.round(enemy.maxHp * 0.25));
      setCombatSubStage(isCrit ? 'CRITICAL_RECOIL' : 'HIT_RECOIL');
      const t1 = window.setTimeout(() => setCombatSubStage('NONE'), 340);
      return () => window.clearTimeout(t1);
    }
  }, [
    animState,
    enemy.hp,
    enemy.maxHp,
    enemy.nextIntentActionKind,
    enemy.isBoss,
    enemy.isFinalBoss,
    enemy.isMiniboss,
  ]);

  // Independent per-creature articulated frame ticker (avoids synchronized loops)
  useEffect(() => {
    if (isDead) return;
    const stepMs = Math.max(260, Math.round(def.timing.breathDurationMs / 6));
    const offsetDelay = (seed % 5) * 73;
    let intervalId: number | null = null;
    const startTimer = window.setTimeout(() => {
      intervalId = window.setInterval(() => {
        setFrameTick((t) => (t + 1) % 24);
      }, stepMs);
    }, offsetDelay);

    return () => {
      window.clearTimeout(startTimer);
      if (intervalId !== null) window.clearInterval(intervalId);
    };
  }, [def.timing.breathDurationMs, isDead, seed]);

  // Randomized personality idle variants (3.2s – 7.5s, desynchronized per creature)
  useEffect(() => {
    if (isDead) return;
    let timeoutId: number;
    let revertId: number;

    const scheduleNext = () => {
      const span =
        def.timing.variantMaxIntervalMs - def.timing.variantMinIntervalMs;
      const randDelay =
        def.timing.variantMinIntervalMs +
        ((seed % 997) / 997) * 900 +
        Math.random() * span;

      timeoutId = window.setTimeout(() => {
        const pick = Math.random() < 0.55 ? 'IDLE_VARIANT_A' : 'IDLE_VARIANT_B';
        setIdleVariant(pick);
        revertId = window.setTimeout(() => {
          setIdleVariant('NONE');
          scheduleNext();
        }, def.timing.variantDurationMs);
      }, randDelay);
    };

    scheduleNext();
    return () => {
      window.clearTimeout(timeoutId);
      window.clearTimeout(revertId);
    };
  }, [
    def.timing.variantDurationMs,
    def.timing.variantMaxIntervalMs,
    def.timing.variantMinIntervalMs,
    isDead,
    seed,
  ]);

  // Compute articulated anatomical pose from current state machine
  const pose: ArticulatedPose = useMemo(() => {
    const breathCycle = [0, 0, 1, 1, 2, 1][frameTick % 6] as 0 | 1 | 2;
    const secCycle = ((frameTick + (seed % 4)) % 4) as 0 | 1 | 2 | 3;

    let state: CriptaCreatureAnimationState = 'IDLE';
    if (isDead) state = 'DEATH';
    else if (isEntering) state = 'ENTER';
    else if (combatSubStage === 'CRITICAL_RECOIL') state = 'CRITICAL_HIT';
    else if (combatSubStage === 'HIT_RECOIL') state = 'HIT';
    else if (statusAppliedFlash) state = 'STATUS_APPLIED';
    else if (combatSubStage === 'ANTICIPATION') state = 'ANTICIPATION';
    else if (combatSubStage === 'SPECIAL_STRIKE') state = 'SPECIAL_ATTACK';
    else if (combatSubStage === 'CASTING') {
      const ik = enemy.nextIntentActionKind;
      state =
        ik === 'HEAL_ALLY'
          ? 'HEAL'
          : ik === 'BUFF_ENEMIES'
          ? 'BUFF'
          : ik === 'APPLY_STATUS'
          ? 'DEBUFF'
          : 'CAST';
    } else if (combatSubStage === 'STRIKE') state = 'ATTACK';
    else if (enemy.isDefending) state = 'DEFEND';
    else if (isTargeted) state = 'TARGETED';
    else if (isHovered) state = 'HOVER_REACTION';
    else if (isLowHp) state = 'LOW_HP';
    else if (idleVariant !== 'NONE') state = idleVariant;

    let torsoX = 0;
    let torsoY = breathCycle === 1 ? -1 : breathCycle === 2 ? -1 : 0;
    let headX = 0;
    let headY = breathCycle === 2 ? -1 : 0;
    let jawOpen = breathCycle === 2 ? 1 : 0;
    let weaponX = 0;
    let weaponY = secCycle === 1 ? -1 : secCycle === 3 ? 1 : 0;
    let propX = secCycle === 1 ? 1 : secCycle === 3 ? -1 : 0;
    let propY = breathCycle === 1 ? 1 : 0;
    let eyeShiftX = cursorLookX;

    if (isLowHp && !isDead) {
      torsoY += 2;
      headY += 2;
      weaponY += 2;
    }

    if (state === 'ENTER') {
      torsoX = -3;
      torsoY = 2;
      headX = -2;
      weaponY = -2;
    } else if (state === 'IDLE_VARIANT_A') {
      // Checks corridor / looks sideways / sniffs ground
      headX = -2;
      headY += 1;
      eyeShiftX = -1;
      jawOpen = 1;
    } else if (state === 'IDLE_VARIANT_B') {
      // Lifts key ring / adjusts weapon / twitches antennae
      propY = -2;
      propX = 1;
      weaponY = -1;
    } else if (state === 'HOVER_REACTION') {
      headX = cursorLookX;
      weaponY = -2;
      jawOpen = 1;
    } else if (state === 'TARGETED') {
      // Alert combat guard posture
      torsoY -= 1;
      weaponX = -1;
      weaponY = -2;
      jawOpen = 1;
    } else if (state === 'DEFEND') {
      // Braced defensive guard stance
      torsoX = 1;
      torsoY = 1;
      propX = -3;
      propY = -2;
      weaponX = -2;
      weaponY = -2;
    } else if (state === 'ANTICIPATION') {
      // Pulls weapon & body back before striking
      torsoX = 3;
      torsoY = -1;
      headX = 2;
      weaponX = 5;
      weaponY = -4;
      jawOpen = 2;
    } else if (state === 'ATTACK' || state === 'SPECIAL_ATTACK') {
      // Explosive forward strike / heavy lunge
      const boost = state === 'SPECIAL_ATTACK' ? 2 : 0;
      torsoX = -5 - boost;
      torsoY = 1;
      headX = -6 - boost;
      weaponX = -8 - boost;
      weaponY = 3;
      jawOpen = 2;
      propX = -3;
    } else if (
      state === 'CAST' ||
      state === 'HEAL' ||
      state === 'BUFF' ||
      state === 'DEBUFF'
    ) {
      // Lifts staff/lantern/hands skyward for arcane/ritual invocation
      torsoY = -2;
      headY = -2;
      jawOpen = 2;
      weaponY = -5;
      propY = -5;
    } else if (combatSubStage === 'RECOVERY') {
      torsoX = -2;
      weaponX = -3;
      weaponY = 1;
    } else if (state === 'HIT' || state === 'STATUS_APPLIED') {
      torsoX = 4;
      torsoY = 1;
      headX = 5;
      headY = -1;
      weaponX = 4;
      propX = 3;
      propY = -2;
    } else if (state === 'CRITICAL_HIT') {
      torsoX = 7;
      torsoY = 2;
      headX = 8;
      headY = -2;
      weaponX = 6;
      jawOpen = 2;
      propX = 5;
      propY = -3;
    } else if (state === 'DEATH') {
      torsoX = 2;
      torsoY = 11;
      headX = 4;
      headY = 14;
      weaponX = -5;
      weaponY = 13;
      propX = 3;
      propY = 12;
    }

    return {
      state,
      breathPhase: breathCycle,
      secondaryPhase: secCycle,
      torsoX,
      torsoY,
      headX,
      headY,
      jawOpen,
      weaponX,
      weaponY,
      propX,
      propY,
      eyeShiftX,
      eyeBlink: frameTick === 11,
      showSlashArc:
        state === 'ATTACK' ||
        state === 'SPECIAL_ATTACK' ||
        state === 'CAST' ||
        state === 'DEBUFF',
      hitFlash:
        state === 'HIT' ||
        state === 'CRITICAL_HIT' ||
        state === 'STATUS_APPLIED',
      isDeadCollapsed: state === 'DEATH',
    };
  }, [
    combatSubStage,
    cursorLookX,
    enemy.isDefending,
    enemy.nextIntentActionKind,
    frameTick,
    idleVariant,
    isDead,
    isEntering,
    isHovered,
    isLowHp,
    isTargeted,
    seed,
    statusAppliedFlash,
  ]);

  // Compute responsive display size with multi-enemy depth & relative creature scale
  const baseStagePx = enemy.isFinalBoss
    ? 276
    : enemy.isMiniboss || enemy.isBoss
    ? 252
    : enemy.isElite
    ? 226
    : 208;
  const crowdFactor =
    totalVisibleEnemies >= 3 ? 0.72 : totalVisibleEnemies === 2 ? 0.86 : 1.0;
  const depthScale =
    totalVisibleEnemies > 1 && enemyIndex % 2 === 1 ? 0.93 : 1.0;
  const computedSizePx = Math.round(
    (customSizePx || baseStagePx * crowdFactor) * def.baseScale * depthScale
  );

  const pal = def.palette;
  const hasPoison = Boolean(enemy.poisonStacks && enemy.poisonStacks > 0);
  const hasVulnerable = Boolean(
    enemy.vulnerableTurns && enemy.vulnerableTurns > 0
  );
  const hasShield = Boolean(enemy.isDefending);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setCursorLookX(0);
      }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const relX = (e.clientX - rect.left) / Math.max(1, rect.width) - 0.5;
        setCursorLookX(relX < -0.12 ? -1 : relX > 0.12 ? 1 : 0);
      }}
      className="relative inline-flex items-center justify-center select-none"
      style={{
        width: `${computedSizePx}px`,
        height: `${computedSizePx}px`,
      }}
    >
      <svg
        width={computedSizePx}
        height={computedSizePx}
        viewBox="0 0 64 64"
        shapeRendering="crispEdges"
        className={`block select-none overflow-visible drop-shadow-[0_14px_24px_rgba(0,0,0,0.95)] ${
          pose.hitFlash ? 'brightness-150 contrast-125' : ''
        } ${
          totalVisibleEnemies > 1 && enemyIndex % 2 === 1 ? 'brightness-90' : ''
        }`}
      >
        {/* ===================================================================
            LAYER 1: GROUND ANCHOR SHADOW, BIOME RIM UNDERLIGHT & TARGET RING
            =================================================================== */}
        <g>
          <rect
            x={32 - Math.round(def.shadowWidth / 2)}
            y="57"
            width={def.shadowWidth}
            height="3"
            fill="#040307"
            opacity="0.9"
          />
          <rect
            x={32 - Math.round(def.shadowWidth / 2) + 3}
            y="56"
            width={def.shadowWidth - 6}
            height="5"
            fill="#07050C"
            opacity="0.7"
          />
          {/* Subtle Biome Rim Underlight */}
          <rect
            x={32 - Math.round(def.shadowWidth / 2) + 4}
            y="58"
            width={def.shadowWidth - 8}
            height="1"
            fill={def.rimLightColor}
            opacity={isTargeted ? '0.85' : '0.4'}
          />
          {/* Target Reticle Floor Brackets when Targeted */}
          {isTargeted && !pose.isDeadCollapsed && (
            <g fill="#FFD166">
              <rect x="8" y="55" width="6" height="1" />
              <rect x="8" y="55" width="1" height="4" />
              <rect x="50" y="55" width="6" height="1" />
              <rect x="55" y="55" width="1" height="4" />
              <rect x="24" y="60" width="16" height="1" fill="#FF4D6D" />
            </g>
          )}
          {/* Enrage Aura Floor Ring */}
          {enemy.enrageTriggered && !pose.isDeadCollapsed && (
            <g fill="#FF4D6D" opacity="0.85">
              <rect x="10" y="56" width="44" height="1" />
              <rect x="14" y="54" width="3" height="2" fill="#FFD166" />
              <rect x="47" y="54" width="3" height="2" fill="#FFD166" />
            </g>
          )}
        </g>

        {/* ===================================================================
            LAYER 2: AUTHORED 64x64 ARTICULATED CREATURE RIG BY UNIQUE SLUG
            =================================================================== */}
        {useUniqueBiomeRig ? (
          <g transform={`translate(${pose.torsoX}, 0)`}>
            <LaCriptaUniqueBiomeSpriteSvg
              blueprint={uniqueBlueprint}
              torsoY={pose.torsoY}
              headY={pose.headY}
              armL={pose.propY}
              armR={pose.weaponY}
              wingSpread={pose.breathPhase}
              pulse={pose.secondaryPhase % 2 === 0}
            />
          </g>
        ) : (
          renderArticulatedCreatureFamily(def, enemy, pose)
        )}

        {/* ===================================================================
            LAYER 3: ELITE / MINIBOSS / BOSS INSIGNIA & MANTLE ACCENTS
            =================================================================== */}
        {!pose.isDeadCollapsed && (enemy.isMiniboss || enemy.isBoss) && (
          <g transform={`translate(${pose.headX}, ${pose.headY})`}>
            {/* High-detail Miniboss / Boss Iron-Gold Crest above helm */}
            <rect x="25" y="3" width="14" height="2" fill="#8F263D" />
            <rect x="24" y="2" width="2" height="3" fill="#FFD166" />
            <rect x="31" y="0" width="2" height="5" fill="#FFD166" />
            <rect x="38" y="2" width="2" height="3" fill="#FFD166" />
            <rect x="31" y="2" width="2" height="2" fill="#FFF3C4" />
          </g>
        )}

        {/* ===================================================================
            LAYER 4: ATTACK SLASH SPARKS & IMPACT PARTICLES
            =================================================================== */}
        {pose.showSlashArc && (
          <g>
            <rect x="4" y="18" width="3" height="8" fill="#FFF3C4" />
            <rect x="6" y="26" width="3" height="10" fill="#FFD166" />
            <rect x="9" y="36" width="4" height="8" fill={pal.accent} />
            <rect x="13" y="44" width="6" height="3" fill="#FF4D6D" />
            <rect x="2" y="24" width="2" height="2" fill="#FFFFFF" />
            <rect x="5" y="38" width="2" height="2" fill="#FFD166" />
          </g>
        )}

        {pose.hitFlash && (
          <g fill="#FFF3C4">
            <rect x="16" y="16" width="3" height="3" />
            <rect x="44" y="14" width="3" height="3" />
            <rect x="48" y="28" width="2" height="2" fill="#FF4D6D" />
            <rect x="14" y="30" width="2" height="2" fill="#FFD166" />
          </g>
        )}

        {/* ===================================================================
            LAYER 5: STATUS-SPECIFIC VISUAL PARTICLES ON CREATURE
            =================================================================== */}
        {!pose.isDeadCollapsed && hasPoison && (
          <g>
            {/* Bubbling Venom Spores rising along torso */}
            <rect
              x="19"
              y={36 - pose.secondaryPhase * 2}
              width="2"
              height="2"
              fill="#5EA87A"
            />
            <rect
              x="42"
              y={32 - pose.breathPhase * 2}
              width="3"
              height="3"
              fill="#8EE6AE"
            />
            <rect
              x="43"
              y={32 - pose.breathPhase * 2}
              width="1"
              height="1"
              fill="#FFFFFF"
            />
            <rect
              x="26"
              y={24 - pose.secondaryPhase}
              width="2"
              height="2"
              fill="#5EA87A"
            />
          </g>
        )}

        {!pose.isDeadCollapsed && hasVulnerable && (
          <g fill="#FF4D6D">
            {/* Hunter / Vulnerable Crosshair Glints on vital point */}
            <rect x="29" y="26" width="6" height="1" />
            <rect x="31" y="24" width="2" height="5" />
            <rect x="31" y="26" width="2" height="1" fill="#FFF3C4" />
          </g>
        )}

        {!pose.isDeadCollapsed && hasShield && (
          <g fill="#7BDFF2" opacity="0.85">
            {/* Fortified Aegis Ward Pixels */}
            <rect x="13" y="20" width="1" height="22" />
            <rect x="50" y="20" width="1" height="22" />
            <rect x="14" y="19" width="6" height="1" />
            <rect x="44" y="19" width="6" height="1" />
          </g>
        )}
      </svg>
    </div>
  );
};

// ============================================================================
// 4. AUTHORED 64x64 PIXEL-ART ANATOMICAL RIGS FOR EVERY CREATURE FAMILY
// ============================================================================

function renderArticulatedCreatureFamily(
  def: CreatureVisualDefinition,
  enemy: CriptaRoomEnemy,
  pose: ArticulatedPose
): React.ReactNode {
  const { family, palette: pal } = def;

  switch (family) {
    // ========================================================================
    // CASTILLO DEL VERDUGO 1: CARCELERO ENCAPUCHADO & JUEZ DEL CADALSO
    // Heavy medieval dungeon jailer with stitched executioner hood, layered
    // leather/iron armor, blood-dark tabard, boots, halberd/cleaver & dangling
    // iron key-ring & shackles chain.
    // ========================================================================
    case 'CASTLE_HOODED_JAILER':
    case 'CASTLE_EXECUTIONER_JUDGE':
    case 'CASTLE_CHAINED_PENITENT': {
      const isJudge = family === 'CASTLE_EXECUTIONER_JUDGE';
      const isPenitent = family === 'CASTLE_CHAINED_PENITENT';
      return (
        <g>
          {/* Back Cape / Tattered Executioner Mantle */}
          <g transform={`translate(${pose.torsoX}, ${pose.torsoY})`}>
            <rect x="18" y="18" width="26" height="30" fill={pal.primaryDark} />
            <rect x="16" y="22" width="4" height="24" fill={pal.secondaryDark} />
            <rect x="42" y="22" width="4" height="26" fill={pal.primaryDark} />
          </g>

          {/* Heavy Boots & Greaves (Anchored to Stone Floor) */}
          <g transform={`translate(0, ${pose.isDeadCollapsed ? 6 : 0})`}>
            {/* Left Boot */}
            <rect x="21" y="46" width="7" height="11" fill={pal.primaryDark} />
            <rect x="22" y="47" width="5" height="8" fill={pal.metalDark} />
            <rect x="23" y="48" width="2" height="5" fill={pal.metal} />
            <rect x="19" y="54" width="9" height="3" fill="#1A141D" />
            <rect x="20" y="54" width="3" height="1" fill={pal.metalLight} />
            {/* Right Boot */}
            <rect x="34" y="46" width="7" height="11" fill={pal.primaryDark} />
            <rect x="35" y="47" width="5" height="8" fill={pal.metalDark} />
            <rect x="36" y="48" width="2" height="5" fill={pal.metal} />
            <rect x="34" y="54" width="9" height="3" fill="#1A141D" />
            <rect x="39" y="54" width="3" height="1" fill={pal.metalLight} />
          </g>

          {/* Broad Hunched Torso, Layered Leather Apron, Straps & Castle Buckle */}
          <g transform={`translate(${pose.torsoX}, ${pose.torsoY})`}>
            {/* Broad Shoulders & Brigandine Coat */}
            <rect x="17" y="19" width="28" height="27" fill={pal.primary} />
            <rect x="19" y="20" width="24" height="24" fill={pal.primaryLight} />
            {/* Blood-dark Executioner Tabard / Stained Leather Apron */}
            <rect x="23" y="22" width="16" height="25" fill={pal.secondaryDark} />
            <rect x="25" y="23" width="12" height="23" fill={pal.secondary} />
            {/* Castle Portcullis Insignia on Chest */}
            <rect x="28" y="25" width="6" height="6" fill={pal.metalDark} />
            <rect x="29" y="26" width="1" height="4" fill={pal.accent} />
            <rect x="31" y="26" width="1" height="4" fill={pal.accent} />
            <rect x="33" y="26" width="1" height="4" fill={pal.accent} />
            <rect x="28" y="28" width="6" height="1" fill={pal.accent} />
            {/* Crossed Leather Straps & Riveted Iron Shoulder Pauldrons */}
            <rect x="15" y="18" width="9" height="7" fill={pal.metalDark} />
            <rect x="16" y="19" width="7" height="5" fill={pal.metal} />
            <rect x="17" y="20" width="2" height="2" fill={pal.metalLight} />
            <rect x="38" y="18" width="9" height="7" fill={pal.metalDark} />
            <rect x="39" y="19" width="7" height="5" fill={pal.metal} />
            <rect x="43" y="20" width="2" height="2" fill={pal.metalLight} />
            {/* Heavy Belt & Brass Buckle */}
            <rect x="18" y="36" width="26" height="4" fill="#1C1317" />
            <rect x="28" y="35" width="6" height="6" fill={pal.accent} />
            <rect x="30" y="37" width="2" height="2" fill="#1C1317" />
          </g>

          {/* Left Arm + Dangling Iron Key Ring & Shackles (Independent Secondary Motion!) */}
          <g
            transform={`translate(${pose.torsoX + pose.propX}, ${
              pose.torsoY + pose.propY
            })`}
          >
            {/* Left Gauntlet & Forearm */}
            <rect x="39" y="25" width="7" height="11" fill={pal.primaryDark} />
            <rect x="40" y="31" width="6" height="6" fill={pal.metalDark} />
            <rect x="41" y="32" width="4" height="4" fill={pal.metal} />
            {/* Large Iron Key Ring & Dungeon Keys */}
            <rect x="42" y="37" width="6" height="6" fill={pal.accent} />
            <rect x="43" y="38" width="4" height="4" fill="#0B0910" />
            {/* 3 Dangling Warder Keys & Shackle Chain */}
            <rect x="42" y="43" width="1" height="7" fill={pal.metalLight} />
            <rect x="41" y="48" width="2" height="2" fill={pal.metalLight} />
            <rect x="45" y="43" width="1" height="9" fill={pal.accent} />
            <rect x="45" y="50" width="3" height="2" fill={pal.accent} />
            <rect x="48" y="43" width="1" height="6" fill={pal.metal} />
            <rect x="48" y="47" width="2" height="2" fill={pal.metal} />
          </g>

          {/* Articulated Stitched Executioner Hood & Shadowed Face */}
          <g transform={`translate(${pose.torsoX + pose.headX}, ${pose.torsoY + pose.headY})`}>
            {/* Hood Tail / Delayed Cloth Peak */}
            <rect
              x={31 + (pose.secondaryPhase % 2)}
              y="5"
              width="6"
              height="4"
              fill={pal.primaryDark}
            />
            <rect
              x={34 + (pose.secondaryPhase % 2)}
              y="4"
              width="4"
              height="3"
              fill={pal.primary}
            />
            {/* Main Heavy Hood Cowl */}
            <rect x="22" y="7" width="18" height="14" fill={pal.primaryDark} />
            <rect x="23" y="8" width="16" height="12" fill={pal.primary} />
            <rect x="24" y="9" width="14" height="4" fill={pal.primaryLight} />
            {/* Stitched Seam Marks on Hood */}
            <rect x="25" y="8" width="1" height="3" fill={pal.skinShadow} />
            <rect x="27" y="9" width="1" height="2" fill={pal.skinShadow} />
            {/* Deep Hood Shadow & Iron Mask / Glinting Eyes */}
            <rect x="25" y="12" width="12" height="7" fill="#08060C" />
            {isJudge ? (
              /* Iron Inquisitor Faceplate for Elite/Boss Judge */
              <g>
                <rect x="26" y="13" width="10" height="6" fill={pal.metal} />
                <rect x="27" y="16" width="8" height="2" fill={pal.metalDark} />
              </g>
            ) : (
              /* Grim Lower Jaw / Stitched Mask under Hood */
              <rect x="27" y="16" width="8" height="3" fill="#29202B" />
            )}
            {/* Sinister Eyes under Hood (track cursor & blink) */}
            {!pose.eyeBlink && (
              <g>
                <rect
                  x={27 + pose.eyeShiftX}
                  y="14"
                  width="2"
                  height="2"
                  fill={pal.eyeGlow}
                />
                <rect
                  x={33 + pose.eyeShiftX}
                  y="14"
                  width="2"
                  height="2"
                  fill={pal.eyeGlow}
                />
                <rect
                  x={27 + pose.eyeShiftX}
                  y="14"
                  width="1"
                  height="1"
                  fill="#FFF3C4"
                />
              </g>
            )}
          </g>

          {/* Right Arm + Heavy Executioner Halberd / Cleaver / Spiked Flail */}
          <g
            transform={`translate(${pose.torsoX + pose.weaponX}, ${
              pose.torsoY + pose.weaponY
            })`}
          >
            {/* Right Armored Arm & Gauntlet */}
            <rect x="14" y="24" width="6" height="12" fill={pal.primaryDark} />
            <rect x="13" y="31" width="6" height="6" fill={pal.metalDark} />
            <rect x="14" y="32" width="4" height="4" fill={pal.metal} />

            {isPenitent ? (
              /* Heavy Iron Chain & Spiked Wrecking Ball for Chained Penitent */
              <g>
                <rect x="10" y="34" width="3" height="12" fill={pal.metal} />
                <rect x="6" y="44" width="10" height="10" fill={pal.metalDark} />
                <rect x="8" y="46" width="6" height="6" fill={pal.metal} />
                <rect x="9" y="47" width="2" height="2" fill={pal.metalLight} />
                <rect x="4" y="48" width="2" height="2" fill={pal.secondary} />
                <rect x="16" y="48" width="2" height="2" fill={pal.secondary} />
              </g>
            ) : (
              /* Tall Notched Executioner Halberd / Guillotine Cleaver */
              <g>
                {/* Long Ashwood & Iron-shod Polearm Shaft */}
                <rect x="11" y="6" width="3" height="49" fill="#4A3222" />
                <rect x="12" y="6" width="1" height="49" fill="#6E4B33" />
                <rect x="10" y="32" width="5" height="3" fill={pal.accent} />
                {/* Massive Executioner Cleaver / Axe Blade */}
                <rect x="3" y="9" width="9" height="16" fill={pal.metalDark} />
                <rect x="4" y="10" width="7" height="14" fill={pal.metal} />
                <rect x="3" y="10" width="2" height="14" fill={pal.metalLight} />
                {/* Blade Notches & Dried Crimson Wear */}
                <rect x="3" y="15" width="2" height="2" fill="#09070D" />
                <rect x="5" y="11" width="2" height="5" fill={pal.secondary} />
                {/* Top Spear Spike */}
                <rect x="11" y="2" width="3" height="5" fill={pal.metalLight} />
              </g>
            )}
          </g>
        </g>
      );
    }

    // ========================================================================
    // CASTILLO DEL VERDUGO 2: MASTÍN DE HIERRO & SABUESO DE BRASA
    // Ferocious quadruped Iron Prison Hound! Muscular four-legged beast with
    // riveted iron muzzle, hinged steel fangs, chain harness & broken collar chain.
    // ========================================================================
    case 'CASTLE_IRON_HOUND':
    case 'FORGE_EMBER_HOUND': {
      const isEmber = family === 'FORGE_EMBER_HOUND';
      return (
        <g>
          {/* Rear Hind Legs & Whipping Chain/Tail */}
          <g transform={`translate(${pose.torsoX}, ${pose.torsoY})`}>
            {/* Torn Iron Chain / Tail whipping behind */}
            <rect
              x={49 + pose.propX}
              y={27 + pose.propY}
              width="8"
              height="3"
              fill={pal.metal}
            />
            <rect
              x={55 + pose.propX}
              y={25 + pose.propY}
              width="4"
              height="3"
              fill={pal.metalLight}
            />
            {/* Far Rear Leg */}
            <rect x="40" y="38" width="6" height="18" fill={pal.primaryDark} />
            <rect x="38" y="54" width="7" height="3" fill={pal.metalDark} />
            {/* Near Muscular Hind Leg */}
            <rect x="44" y="34" width="8" height="14" fill={pal.primary} />
            <rect x="46" y="45" width="6" height="11" fill={pal.primaryLight} />
            <rect x="43" y="54" width="8" height="3" fill={pal.metalLight} />
          </g>

          {/* Quadruped Ribcage, Iron Harness Plates & Shoulder Armor */}
          <g transform={`translate(${pose.torsoX}, ${pose.torsoY})`}>
            {/* Deep Chest & Belly */}
            <rect x="20" y="26" width="28" height="16" fill={pal.primaryDark} />
            <rect x="22" y="27" width="25" height="13" fill={pal.primary} />
            <rect x="23" y="28" width="18" height="8" fill={pal.primaryLight} />
            {/* Exposed Ribs / Molten Cracks */}
            <rect x="31" y="31" width="2" height="7" fill={pal.secondary} />
            <rect x="35" y="31" width="2" height="7" fill={pal.secondary} />
            <rect x="39" y="32" width="2" height="6" fill={pal.secondary} />
            {/* Heavy Riveted Iron Shoulder Plate & Spikes */}
            <rect x="20" y="23" width="13" height="11" fill={pal.metalDark} />
            <rect x="21" y="24" width="11" height="9" fill={pal.metal} />
            <rect x="23" y="25" width="3" height="2" fill={pal.metalLight} />
            <rect x="24" y="20" width="3" height="4" fill={pal.metalLight} />
            <rect x="30" y="21" width="3" height="3" fill={pal.metalLight} />
            {/* Leather & Chain Straps */}
            <rect x="33" y="26" width="3" height="15" fill="#1F1518" />
            <rect x="34" y="32" width="2" height="2" fill={pal.accent} />
          </g>

          {/* Front Forelegs & Iron Claws */}
          <g transform={`translate(${pose.weaponX * 0.4}, ${pose.isDeadCollapsed ? 7 : 0})`}>
            {/* Far Front Leg */}
            <rect x="19" y="39" width="5" height="17" fill={pal.primaryDark} />
            <rect x="16" y="54" width="7" height="3" fill={pal.metal} />
            {/* Near Front Leg (shifts paw weight) */}
            <rect
              x="25"
              y={38 + (pose.secondaryPhase === 2 ? -1 : 0)}
              width="6"
              height="18"
              fill={pal.primary}
            />
            <rect x="26" y="40" width="4" height="12" fill={pal.metalDark} />
            <rect x="22" y="54" width="8" height="3" fill={pal.metalLight} />
          </g>

          {/* Articulated Armored Hound Head, Iron Muzzle, Fangs & Dragging Collar Chain */}
          <g
            transform={`translate(${pose.torsoX + pose.headX}, ${
              pose.torsoY + pose.headY
            })`}
          >
            {/* Spiked Iron Collar & Dragging Broken Chain */}
            <rect x="18" y="24" width="6" height="10" fill={pal.accent} />
            <rect
              x={17 + pose.propX}
              y="34"
              width="3"
              height="14"
              fill={pal.metalLight}
            />
            <rect
              x={16 + pose.propX}
              y="46"
              width="4"
              height="5"
              fill={pal.metal}
            />

            {/* Pinned Ears */}
            <rect
              x="17"
              y={16 - (pose.secondaryPhase % 2)}
              width="5"
              height="5"
              fill={pal.primary}
            />
            <rect x="19" y="17" width="2" height="3" fill={pal.secondary} />

            {/* Upper Armored Skull & Iron Snout Mask */}
            <rect x="7" y="19" width="15" height="9" fill={pal.metalDark} />
            <rect x="8" y="20" width="13" height="7" fill={pal.metal} />
            <rect x="9" y="20" width="8" height="2" fill={pal.metalLight} />
            {/* Glowing Eye inside Iron Visor */}
            {!pose.eyeBlink && (
              <g>
                <rect
                  x={13 + pose.eyeShiftX}
                  y="22"
                  width="3"
                  height="2"
                  fill={pal.eyeGlow}
                />
                <rect
                  x={13 + pose.eyeShiftX}
                  y="22"
                  width="1"
                  height="1"
                  fill="#FFFFFF"
                />
              </g>
            )}
            {/* Upper Steel Fangs */}
            <rect x="8" y="28" width="2" height="3" fill={pal.skinOrBone} />
            <rect x="12" y="28" width="2" height="2" fill={pal.skinOrBone} />

            {/* Articulated Hinged Lower Jaw (opens during breathing, growl & bite!) */}
            <g transform={`translate(0, ${pose.jawOpen})`}>
              <rect x="9" y="29" width="12" height="4" fill={pal.primaryDark} />
              <rect x="10" y="30" width="10" height="2" fill={pal.metalDark} />
              <rect x="9" y="28" width="2" height="2" fill={pal.skinOrBone} />
              <rect x="13" y="29" width="2" height="2" fill={pal.skinOrBone} />
              {isEmber && (
                <rect x="10" y="28" width="5" height="2" fill="#FF7A33" />
              )}
            </g>
          </g>
        </g>
      );
    }

    // ========================================================================
    // CATACUMBAS DEL REY: 3 DISTINCT SILHOUETTES (ROYAL SENTINEL / ARCHER / ASH PRIEST)
    // ========================================================================
    case 'CATACOMBS_ROYAL_SKELETON':
    case 'CATACOMBS_SEPULCHER_ARCHER':
    case 'CATACOMBS_ASH_ACOLYTE': {
      const isArcher = family === 'CATACOMBS_SEPULCHER_ARCHER';
      const isAcolyte = family === 'CATACOMBS_ASH_ACOLYTE';

      if (isAcolyte) {
        // SILHOUETTE B: TALL MITRED NECROMANCER / ASH ACOLYTE (Flowing robes, bone stole, skull staff & swinging wax-candle censer)
        return (
          <g>
            {/* Floating Funeral Wax Candles Orbiting Shoulders */}
            <g transform={`translate(${pose.torsoX}, ${pose.torsoY - pose.breathPhase})`}>
              <rect x="13" y="10" width="2" height="5" fill="#F4EBD9" />
              <rect x="13" y="7" width="2" height="3" fill="#FFD166" />
              <rect x="14" y="8" width="1" height="1" fill="#FFFFFF" />
              <rect x="47" y="11" width="2" height="5" fill="#F4EBD9" />
              <rect x="47" y="8" width="2" height="3" fill="#FFD166" />
              <rect x="48" y="9" width="1" height="1" fill="#FFFFFF" />
            </g>

            {/* Long Flowing Ash-Velvet Liturgical Robes (5-tone cloth shading) */}
            <g transform={`translate(${pose.torsoX}, ${pose.torsoY})`}>
              <rect x="18" y="21" width="26" height="35" fill="#120D17" />
              <rect x="19" y="22" width="24" height="33" fill={pal.primaryDark} />
              <rect x="21" y="23" width="20" height="31" fill={pal.primary} />
              <rect x="23" y="24" width="16" height="29" fill={pal.secondaryDark} />
              {/* Vertical Crimson & Gold Embroidered Stole */}
              <rect x="25" y="22" width="3" height="32" fill={pal.metal} />
              <rect x="34" y="22" width="3" height="32" fill={pal.metal} />
              <rect x="26" y="23" width="1" height="30" fill={pal.metalLight} />
              <rect x="35" y="23" width="1" height="30" fill={pal.metalLight} />
              {/* Exposed Skeletal Rib-Collar & Scroll Belt */}
              <rect x="23" y="22" width="16" height="2" fill={pal.skinOrBone} />
              <rect x="24" y="25" width="14" height="2" fill={pal.skinShadow} />
              <rect x="20" y="37" width="22" height="3" fill="#1C1424" />
              <rect x="29" y="36" width="4" height="5" fill={pal.metalLight} />
              {/* Hanging Parchment Prayer Strips */}
              <rect x="24" y="40" width="3" height="8" fill={pal.skinOrBone} />
              <rect x="35" y="40" width="3" height="9" fill={pal.skinShadow} />
            </g>

            {/* Left Arm + Swinging Chain Thurible Censer */}
            <g transform={`translate(${pose.torsoX + pose.propX}, ${pose.torsoY + pose.propY})`}>
              <rect x="41" y="25" width="6" height="5" fill={pal.primary} />
              <rect x="44" y="28" width="4" height="3" fill={pal.skinOrBone} />
              <rect x="45" y="31" width="1" height="7" fill={pal.metalLight} />
              <rect x="47" y="31" width="1" height="7" fill={pal.metal} />
              <rect x="42" y="38" width="8" height="7" fill={pal.metalDark} />
              <rect x="43" y="39" width="6" height="5" fill={pal.metalLight} />
              <rect x="44" y="36" width="4" height="3" fill="#FFD166" />
              <rect x="45" y={33 - (pose.secondaryPhase % 2)} width="2" height="3" fill="#FFF3C4" />
            </g>

            {/* Tall Ceremonial Bishop Mitre & Whispering Skull Visage */}
            <g transform={`translate(${pose.torsoX + pose.headX}, ${pose.torsoY + pose.headY})`}>
              <rect x="25" y="2" width="12" height="4" fill={pal.secondaryDark} />
              <rect x="23" y="5" width="16" height="7" fill={pal.secondary} />
              <rect x="30" y="2" width="2" height="9" fill={pal.metalLight} />
              <rect x="26" y="6" width="10" height="2" fill={pal.metalLight} />
              <rect x="24" y="11" width="14" height="8" fill={pal.skinShadow} />
              <rect x="25" y="11" width="12" height="7" fill={pal.skinOrBone} />
              <rect x="26" y="12" width="10" height="4" fill="#FFF8EC" />
              <rect x="26" y="13" width="3" height="3" fill="#09070D" />
              <rect x="33" y="13" width="3" height="3" fill="#09070D" />
              {!pose.eyeBlink && (
                <g fill="#FFD166">
                  <rect x={27 + pose.eyeShiftX} y="14" width="2" height="2" />
                  <rect x={34 + pose.eyeShiftX} y="14" width="2" height="2" />
                </g>
              )}
              <g transform={`translate(0, ${pose.jawOpen})`}>
                <rect x="26" y="19" width="10" height="3" fill={pal.skinShadow} />
                <rect x="27" y="19" width="2" height="2" fill="#FFF8EC" />
                <rect x="30" y="19" width="2" height="2" fill="#FFF8EC" />
                <rect x="33" y="19" width="2" height="2" fill="#FFF8EC" />
              </g>
            </g>

            {/* Right Arm + Tall Horned Skull-Crowned Necromancer Staff */}
            <g transform={`translate(${pose.torsoX + pose.weaponX}, ${pose.torsoY + pose.weaponY})`}>
              <rect x="12" y="10" width="3" height="45" fill="#4A3525" />
              <rect x="13" y="10" width="1" height="44" fill="#7D5B42" />
              <rect x="9" y="6" width="9" height="6" fill={pal.skinOrBone} />
              <rect x="10" y="8" width="2" height="2" fill="#09070D" />
              <rect x="15" y="8" width="2" height="2" fill="#09070D" />
              <rect x="11" y="3" width="5" height="3" fill="#FFD166" />
              <rect x="12" y="1" width="3" height="2" fill="#FFF3C4" />
            </g>
          </g>
        );
      }

      if (isArcher) {
        // SILHOUETTE C: CROUCHED SEPULCHER GREATBOW MARKSMAN (Bristling quiver, hooded sniper cloak, drawn bone greatbow)
        return (
          <g>
            {/* Back Bone-Quiver Bristling with Fletched Arrows */}
            <g transform={`translate(${pose.torsoX}, ${pose.torsoY})`}>
              <rect x="37" y="14" width="8" height="20" fill="#4A2E20" />
              <rect x="38" y="15" width="6" height="18" fill="#6E4632" />
              <rect x="38" y="9" width="2" height="6" fill={pal.skinOrBone} />
              <rect x="37" y="8" width="4" height="2" fill="#C93B5B" />
              <rect x="42" y="10" width="2" height="5" fill={pal.skinOrBone} />
              <rect x="41" y="9" width="4" height="2" fill="#FFD166" />
              <rect x="45" y="11" width="2" height="5" fill={pal.skinOrBone} />
            </g>

            {/* Wide Crouched Marksman Legs & Knee-Guards */}
            <g transform={`translate(0, ${pose.isDeadCollapsed ? 8 : 0})`}>
              <rect x="19" y="43" width="5" height="13" fill={pal.primaryDark} />
              <rect x="20" y="44" width="3" height="11" fill={pal.skinShadow} />
              <rect x="17" y="53" width="8" height="4" fill={pal.metalDark} />
              <rect x="36" y="43" width="5" height="13" fill={pal.primaryDark} />
              <rect x="37" y="44" width="3" height="11" fill={pal.skinShadow} />
              <rect x="35" y="53" width="8" height="4" fill={pal.metalDark} />
            </g>

            {/* Crouched Leather Brigandine, Bandolier & Tattered Ranger Scarf */}
            <g transform={`translate(${pose.torsoX}, ${pose.torsoY})`}>
              <rect x="20" y="23" width="22" height="21" fill={pal.primaryDark} />
              <rect x="22" y="24" width="18" height="19" fill={pal.primary} />
              <rect x="24" y="27" width="14" height="2" fill={pal.skinOrBone} />
              <rect x="25" y="31" width="12" height="2" fill={pal.skinShadow} />
              <rect x="22" y="24" width="16" height="3" fill={pal.metal} />
              <rect x="21" y="37" width="20" height="3" fill="#1C1424" />
              <rect x="29" y="36" width="4" height="5" fill={pal.metalLight} />
            </g>

            {/* Deep Ranger Hood & One-Eyed Sniper Skull */}
            <g transform={`translate(${pose.torsoX + pose.headX}, ${pose.torsoY + pose.headY})`}>
              <rect x="21" y="9" width="19" height="14" fill={pal.secondaryDark} />
              <rect x="22" y="10" width="17" height="11" fill={pal.secondary} />
              <rect x="24" y="12" width="13" height="9" fill="#09070D" />
              <rect x="25" y="13" width="11" height="7" fill={pal.skinOrBone} />
              <rect x="26" y="15" width="4" height="3" fill="#09070D" />
              {!pose.eyeBlink && (
                <g>
                  <rect x={27 + pose.eyeShiftX} y="15" width="2" height="2" fill="#FFD166" />
                  <rect x={27 + pose.eyeShiftX} y="15" width="1" height="1" fill="#FFFFFF" />
                </g>
              )}
              <rect x="32" y="14" width="4" height="4" fill={pal.metalDark} />
            </g>

            {/* Massive Curved Bone-and-Bronze Sepulcher Greatbow + Nocked Spectral Arrow */}
            <g transform={`translate(${pose.torsoX + pose.weaponX}, ${pose.torsoY + pose.weaponY})`}>
              <rect x="11" y="7" width="3" height="10" fill={pal.skinOrBone} />
              <rect x="9" y="15" width="3" height="18" fill={pal.metalLight} />
              <rect x="11" y="31" width="3" height="11" fill={pal.skinOrBone} />
              <rect x="13" y="5" width="3" height="3" fill={pal.metal} />
              <rect x="13" y="41" width="3" height="3" fill={pal.metal} />
              <rect x="15" y="7" width="1" height="35" fill="#D8C6A0" />
              <rect x="4" y="23" width="16" height="2" fill="#FFD166" />
              <rect x="2" y="22" width="4" height="4" fill="#FFF3C4" />
            </g>
          </g>
        );
      }

      // SILHOUETTE A: ROYAL CRYPT SENTINEL (Heavy Crowned Skeleton Warrior with Cape, Broadsword & Kite Shield)
      return (
        <g>
          {/* Rotted Royal Burgundy Velvet Cloak (5-tone shading) */}
          <g transform={`translate(${pose.torsoX}, ${pose.torsoY})`}>
            <rect x={16 + (pose.secondaryPhase % 2)} y="18" width="30" height="34" fill="#1A0910" />
            <rect x={18 + (pose.secondaryPhase % 2)} y="19" width="26" height="32" fill={pal.secondaryDark} />
            <rect x={20 + (pose.secondaryPhase % 2)} y="21" width="22" height="28" fill={pal.secondary} />
            <rect x="21" y="49" width="3" height="3" fill={pal.secondaryDark} />
            <rect x="28" y="49" width="4" height="4" fill={pal.secondaryDark} />
            <rect x="36" y="49" width="3" height="3" fill={pal.secondaryDark} />
          </g>

          {/* Heavy Armored Greaves & Skeletal Knees */}
          <g transform={`translate(0, ${pose.isDeadCollapsed ? 8 : 0})`}>
            <rect x="22" y="42" width="6" height="14" fill="#120E17" />
            <rect x="23" y="42" width="4" height="12" fill={pal.skinShadow} />
            <rect x="24" y="43" width="2" height="10" fill={pal.skinOrBone} />
            <rect x="20" y="52" width="8" height="5" fill={pal.metalDark} />
            <rect x="21" y="53" width="6" height="3" fill={pal.metalLight} />

            <rect x="34" y="42" width="6" height="14" fill="#120E17" />
            <rect x="35" y="42" width="4" height="12" fill={pal.skinShadow} />
            <rect x="36" y="43" width="2" height="10" fill={pal.skinOrBone} />
            <rect x="33" y="52" width="8" height="5" fill={pal.metalDark} />
            <rect x="34" y="53" width="6" height="3" fill={pal.metalLight} />
          </g>

          {/* Articulated Ribcage, Oxidized Plate Cuirass, Pauldrons & Royal Medallion */}
          <g transform={`translate(${pose.torsoX}, ${pose.torsoY})`}>
            <rect x="20" y="20" width="22" height="22" fill="#120E17" />
            <rect x="22" y="21" width="18" height="20" fill={pal.primaryDark} />
            <rect x="30" y="21" width="2" height="19" fill={pal.skinShadow} />
            <rect x="23" y="23" width="16" height="2" fill={pal.skinOrBone} />
            <rect x="24" y="23" width="5" height="1" fill="#FFF8EC" />
            <rect x="24" y="27" width="14" height="2" fill={pal.skinOrBone} />
            <rect x="25" y="31" width="12" height="2" fill={pal.skinShadow} />
            <rect x="26" y="35" width="10" height="2" fill={pal.skinShadow} />
            <rect x="15" y="18" width="9" height="8" fill="#120E17" />
            <rect x="16" y="19" width="7" height="6" fill={pal.metalDark} />
            <rect x="17" y="20" width="5" height="4" fill={pal.metal} />
            <rect x="18" y="20" width="3" height="2" fill={pal.metalLight} />
            <rect x="38" y="18" width="9" height="8" fill="#120E17" />
            <rect x="39" y="19" width="7" height="6" fill={pal.metalDark} />
            <rect x="40" y="20" width="5" height="4" fill={pal.metal} />
            <rect x="41" y="20" width="3" height="2" fill={pal.metalLight} />
            <rect x="28" y="21" width="6" height="5" fill={pal.metalLight} />
            <rect x="30" y="22" width="2" height="3" fill={pal.secondary} />
            <rect x="21" y="38" width="20" height="3" fill={pal.metalDark} />
            <rect x="29" y="37" width="4" height="5" fill={pal.metalLight} />
          </g>

          {/* Left Arm + Royal Heraldic Kite Shield */}
          <g transform={`translate(${pose.torsoX + pose.propX}, ${pose.torsoY + pose.propY})`}>
            <rect x="38" y="20" width="15" height="24" fill="#120E17" />
            <rect x="39" y="21" width="13" height="22" fill={pal.metalDark} />
            <rect x="40" y="22" width="11" height="20" fill={pal.secondaryDark} />
            <rect x="41" y="23" width="9" height="18" fill={pal.secondary} />
            <rect x="39" y="21" width="13" height="2" fill={pal.metalLight} />
            <rect x="44" y="24" width="3" height="15" fill={pal.metalLight} />
            <rect x="41" y="29" width="9" height="3" fill={pal.metalLight} />
            <rect x="45" y="29" width="1" height="3" fill="#FFF8EC" />
          </g>

          {/* Articulated Skull, Cracked Royal Crown & Moving Jaw */}
          <g transform={`translate(${pose.torsoX + pose.headX}, ${pose.torsoY + pose.headY})`}>
            <rect x="22" y="5" width="18" height="5" fill={pal.metalDark} />
            <rect x="23" y="6" width="16" height="3" fill={pal.metal} />
            <rect x="23" y="3" width="2" height="5" fill={pal.metalLight} />
            <rect x="27" y="2" width="2" height="6" fill={pal.metalLight} />
            <rect x="30" y="1" width="2" height="7" fill="#FFF8EC" />
            <rect x="34" y="2" width="2" height="6" fill={pal.metalLight} />
            <rect x="37" y="4" width="2" height="4" fill={pal.metal} />
            <rect x="30" y="6" width="2" height="2" fill={pal.secondary} />
            <rect x="23" y="9" width="16" height="9" fill="#120E17" />
            <rect x="24" y="9" width="14" height="8" fill={pal.skinShadow} />
            <rect x="25" y="10" width="12" height="6" fill={pal.skinOrBone} />
            <rect x="26" y="10" width="10" height="3" fill="#FFF8EC" />
            <rect x="25" y="12" width="4" height="3" fill="#09070D" />
            <rect x="33" y="12" width="4" height="3" fill="#09070D" />
            {!pose.eyeBlink && (
              <g>
                <rect x={26 + pose.eyeShiftX} y="13" width="2" height="2" fill={pal.eyeGlow} />
                <rect x={26 + pose.eyeShiftX} y="13" width="1" height="1" fill="#FFF8EC" />
                <rect x={34 + pose.eyeShiftX} y="13" width="2" height="2" fill={pal.eyeGlow} />
                <rect x={34 + pose.eyeShiftX} y="13" width="1" height="1" fill="#FFF8EC" />
              </g>
            )}
            <rect x="30" y="14" width="2" height="2" fill="#09070D" />
            <g transform={`translate(0, ${pose.jawOpen})`}>
              <rect x="25" y="17" width="12" height="4" fill="#120E17" />
              <rect x="26" y="17" width="10" height="3" fill={pal.skinShadow} />
              <rect x="27" y="17" width="1" height="2" fill="#FFF8EC" />
              <rect x="29" y="17" width="1" height="2" fill="#FFF8EC" />
              <rect x="31" y="17" width="1" height="2" fill="#FFF8EC" />
              <rect x="33" y="17" width="1" height="2" fill="#FFF8EC" />
              <rect x="35" y="17" width="1" height="2" fill="#FFF8EC" />
            </g>
          </g>

          {/* Right Arm + Notched Royal Sepulcher Broadsword */}
          <g transform={`translate(${pose.torsoX + pose.weaponX}, ${pose.torsoY + pose.weaponY})`}>
            <rect x="11" y="4" width="6" height="28" fill="#120E17" />
            <rect x="12" y="5" width="4" height="26" fill="#7D7A8A" />
            <rect x="13" y="5" width="2" height="25" fill="#D9D0BC" />
            <rect x="13" y="6" width="1" height="22" fill="#FFFFFF" />
            <rect x="14" y="12" width="1" height="14" fill={pal.secondary} />
            <rect x="8" y="30" width="12" height="3" fill={pal.metalDark} />
            <rect x="9" y="30" width="10" height="2" fill={pal.metalLight} />
            <rect x="13" y="33" width="2" height="5" fill={pal.secondaryDark} />
            <rect x="12" y="38" width="4" height="3" fill={pal.metalLight} />
          </g>
        </g>
      );
    }

    // ========================================================================
    // ALCANTARILLAS IMPERIALES: RATA DE ALQUIMIA (Low-slung Mutated Sewer Rat)
    // ========================================================================
    case 'SEWER_ALCHEMY_RAT': {
      return (
        <g>
          {/* Long Segmented Rat Tail (whips independently) */}
          <g
            transform={`translate(${pose.torsoX + pose.propX}, ${
              pose.torsoY + pose.propY
            })`}
          >
            <rect x="44" y="46" width="12" height="3" fill={pal.skinShadow} />
            <rect x="52" y="43" width="6" height="3" fill={pal.skinOrBone} />
          </g>

          {/* Low Hunched Rodent Body + Mutated Alchemical Vial on Back */}
          <g transform={`translate(${pose.torsoX}, ${pose.torsoY})`}>
            <rect x="20" y="34" width="25" height="15" fill={pal.primaryDark} />
            <rect x="22" y="35" width="22" height="13" fill={pal.primary} />
            <rect x="24" y="36" width="16" height="8" fill={pal.primaryLight} />
            {/* Glowing Green Alchemical Tank / Pustules on Back */}
            <rect x="28" y="27" width="12" height="8" fill={pal.metalDark} />
            <rect x="30" y="28" width="8" height="6" fill={pal.secondary} />
            <rect
              x="31"
              y={29 + (pose.breathPhase % 2)}
              width="5"
              height="3"
              fill={pal.eyeGlow}
            />
            {/* Hind & Front Claws */}
            <rect x="38" y="48" width="6" height="8" fill={pal.skinShadow} />
            <rect x="21" y="48" width="5" height="8" fill={pal.skinOrBone} />
          </g>

          {/* Twitching Rat Snout, Whiskers, Incisors & Ears */}
          <g
            transform={`translate(${pose.torsoX + pose.headX + pose.weaponX * 0.5}, ${
              pose.torsoY + pose.headY
            })`}
          >
            {/* Round Rat Ears */}
            <rect x="19" y="29" width="5" height="5" fill={pal.skinShadow} />
            <rect x="20" y="30" width="3" height="3" fill={pal.skinOrBone} />
            {/* Pointed Snout */}
            <rect x="9" y="34" width="14" height="9" fill={pal.primary} />
            <rect x="7" y="37" width="4" height="4" fill={pal.skinOrBone} />
            {/* Glowing Toxic Eye */}
            {!pose.eyeBlink && (
              <rect x="14" y="36" width="3" height="2" fill={pal.eyeGlow} />
            )}
            {/* Sharp Yellow Incisors */}
            <g transform={`translate(0, ${pose.jawOpen})`}>
              <rect x="9" y="43" width="2" height="4" fill="#FFD166" />
              <rect x="12" y="43" width="2" height="3" fill="#F4EBD9" />
            </g>
          </g>
        </g>
      );
    }

    // ========================================================================
    // JARDÍN PODRIDO 1: BROTE ESPORA GUARDIÁN / HUÉSPED DEL MICELIO (Hulking Fungal Brute)
    // Wide armored bark-and-mushroom frontline juggernaut with stacked polypore
    // shoulder plates, living root tower shield, and toxic spore-maul.
    // ========================================================================
    case 'GARDEN_MYCELIUM_HOST': {
      return (
        <g>
          {/* Thick Gnarled Root-Greaves & Mossy Talons */}
          <g transform={`translate(0, ${pose.isDeadCollapsed ? 7 : 0})`}>
            <rect x="18" y="42" width="9" height="14" fill="#0F1711" />
            <rect x="19" y="43" width="7" height="12" fill={pal.metalDark} />
            <rect x="20" y="44" width="5" height="10" fill={pal.metal} />
            <rect x="21" y="45" width="2" height="7" fill={pal.primaryLight} />
            <rect x="16" y="54" width="11" height="3" fill="#18261B" />
            <rect x="16" y="55" width="2" height="2" fill={pal.skinOrBone} />
            <rect x="20" y="55" width="2" height="2" fill={pal.skinOrBone} />

            <rect x="35" y="42" width="9" height="14" fill="#0F1711" />
            <rect x="36" y="43" width="7" height="12" fill={pal.metalDark} />
            <rect x="37" y="44" width="5" height="10" fill={pal.metal} />
            <rect x="38" y="45" width="2" height="7" fill={pal.primaryLight} />
            <rect x="34" y="54" width="11" height="3" fill="#18261B" />
            <rect x="39" y="55" width="2" height="2" fill={pal.skinOrBone} />
            <rect x="43" y="55" width="2" height="2" fill={pal.skinOrBone} />
          </g>

          {/* Broad Bark-Carapace Torso, Polypore Shelf Pauldrons & Pulsing Spore Heart */}
          <g transform={`translate(${pose.torsoX}, ${pose.torsoY})`}>
            <rect x="15" y="19" width="32" height="25" fill="#0F1711" />
            <rect x="16" y="20" width="30" height="23" fill={pal.primaryDark} />
            <rect x="18" y="21" width="26" height="21" fill={pal.primary} />
            <rect x="20" y="22" width="22" height="16" fill={pal.primaryLight} />
            {/* Stacked Bracket-Mushroom Pauldrons on Shoulders */}
            <rect x="11" y="16" width="10" height="6" fill="#4E2F61" />
            <rect x="12" y="15" width="8" height="4" fill="#8E5EA8" />
            <rect x="13" y="15" width="5" height="2" fill="#C997E6" />
            <rect x="41" y="15" width="11" height="7" fill="#4E2F61" />
            <rect x="42" y="14" width="9" height="5" fill="#8E5EA8" />
            <rect x="44" y="14" width="5" height="2" fill="#C997E6" />
            {/* Exposed Wooden Rib-Slats & Inflating Bioluminescent Spore Sac */}
            <rect x="22" y="24" width="18" height="12" fill="#121C14" />
            <rect
              x="24"
              y="25"
              width={8 + pose.breathPhase}
              height={8 + pose.breathPhase}
              fill="#683B7D"
            />
            <rect
              x="25"
              y="26"
              width={6 + pose.breathPhase}
              height={6 + pose.breathPhase}
              fill="#9159AD"
            />
            <rect x="27" y="28" width="3" height="3" fill={pal.eyeGlow} />
            <rect x="34" y="27" width="5" height="6" fill={pal.accent} />
            <rect x="35" y="28" width="2" height="3" fill="#FFFFFF" />
            {/* Heavy Root-Vine Belt & Bone Trophy Buckle */}
            <rect x="17" y="38" width="28" height="4" fill="#291D12" />
            <rect x="28" y="37" width="6" height="5" fill={pal.skinOrBone} />
            <rect x="30" y="39" width="2" height="2" fill="#0F1711" />
          </g>

          {/* Left Arm + Living Root & Mushroom Tower Pavise Shield */}
          <g transform={`translate(${pose.torsoX + pose.propX}, ${pose.torsoY + pose.propY})`}>
            <rect x="40" y="20" width="15" height="24" fill="#0F1711" />
            <rect x="41" y="21" width="13" height="22" fill={pal.metalDark} />
            <rect x="42" y="22" width="11" height="20" fill={pal.metal} />
            <rect x="43" y="23" width="9" height="18" fill={pal.primary} />
            <rect x="44" y="25" width="7" height="4" fill="#8E5EA8" />
            <rect x="45" y="25" width="4" height="2" fill="#D4FF80" />
            <rect x="46" y="29" width="3" height="5" fill={pal.skinOrBone} />
            <rect x="43" y="35" width="8" height="3" fill={pal.primaryLight} />
          </g>

          {/* Wide Armored Toadstool Canopy Head, Gills & 3 Glowing Fungal Eyes */}
          <g transform={`translate(${pose.torsoX + pose.headX}, ${pose.torsoY + pose.headY})`}>
            <rect x="11" y="8" width="40" height="7" fill="#1E1029" />
            <rect x="12" y="7" width="38" height="6" fill="#4E2F61" />
            <rect x="15" y="4" width="32" height="7" fill="#6E3F8A" />
            <rect x="19" y="2" width="24" height="6" fill="#9159AD" />
            <rect x="23" y="2" width="14" height="3" fill="#C997E6" />
            <rect x="16" y="7" width="4" height="3" fill={pal.skinOrBone} />
            <rect x="17" y="7" width="2" height="2" fill="#FFF8EC" />
            <rect x="28" y="4" width="5" height="4" fill={pal.skinOrBone} />
            <rect x="29" y="4" width="3" height="2" fill="#FFF8EC" />
            <rect x="39" y="6" width="4" height="3" fill={pal.skinOrBone} />
            <rect x="14" y="12" width="34" height="3" fill="#2D1A3B" />
            <rect x="17" y="12" width="2" height="3" fill={pal.skinShadow} />
            <rect x="23" y="12" width="2" height="3" fill={pal.skinShadow} />
            <rect x="37" y="12" width="2" height="3" fill={pal.skinShadow} />
            <rect x="43" y="12" width="2" height="3" fill={pal.skinShadow} />
            <rect x="21" y="14" width="20" height="8" fill="#0F1711" />
            <rect x="22" y="15" width="18" height="6" fill={pal.primaryDark} />
            {!pose.eyeBlink && (
              <g>
                <rect x={24 + pose.eyeShiftX} y="16" width="3" height="3" fill={pal.eyeGlow} />
                <rect x={25 + pose.eyeShiftX} y="16" width="1" height="1" fill="#FFFFFF" />
                <rect x={30 + pose.eyeShiftX} y="15" width="2" height="2" fill="#FFD166" />
                <rect x={34 + pose.eyeShiftX} y="16" width="3" height="3" fill={pal.eyeGlow} />
                <rect x={35 + pose.eyeShiftX} y="16" width="1" height="1" fill="#FFFFFF" />
              </g>
            )}
            <g transform={`translate(0, ${pose.jawOpen})`}>
              <rect x="24" y="21" width="14" height="3" fill={pal.metalDark} />
              <rect x="25" y="20" width="2" height="2" fill={pal.skinOrBone} />
              <rect x="29" y="20" width="2" height="2" fill={pal.skinOrBone} />
              <rect x="33" y="20" width="2" height="2" fill={pal.skinOrBone} />
            </g>
          </g>

          {/* Right Arm + Heavy Spore-Crusher Root Maul */}
          <g transform={`translate(${pose.torsoX + pose.weaponX}, ${pose.torsoY + pose.weaponY})`}>
            <rect x="9" y="14" width="4" height="36" fill="#291D12" />
            <rect x="10" y="14" width="2" height="35" fill={pal.metal} />
            <rect x="3" y="8" width="16" height="12" fill="#1E1029" />
            <rect x="4" y="9" width="14" height="10" fill="#6E3F8A" />
            <rect x="6" y="10" width="10" height="6" fill="#9159AD" />
            <rect x="5" y="12" width="3" height="3" fill={pal.eyeGlow} />
            <rect x="13" y="11" width="3" height="3" fill={pal.eyeGlow} />
          </g>
        </g>
      );
    }

    // ========================================================================
    // JARDÍN PODRIDO 2: CHAMÁN FÚNGICO / ESPORA ERRANTE (Tall Crooked Mycelial Mystic)
    // Towering curled witch-mushroom cap, veiled wooden ritual mask, tattered
    // herbalist robes with potion bandolier, and tall gnarled staff with
    // swinging bioluminescent spore-censer lantern!
    // ========================================================================
    case 'GARDEN_SPORE_FLOAT': {
      return (
        <g>
          {/* Orbiting Bioluminescent Spore Motes */}
          <g transform={`translate(${pose.torsoX}, ${pose.torsoY - pose.breathPhase})`}>
            <rect x="10" y="12" width="3" height="3" fill="#7BDFF2" />
            <rect x="11" y="12" width="1" height="1" fill="#FFFFFF" />
            <rect x="49" y="16" width="3" height="3" fill="#D4FF80" />
            <rect x="50" y="16" width="1" height="1" fill="#FFFFFF" />
          </g>

          {/* Slender Root-Wrapped Legs & Herbalist Sandals */}
          <g transform={`translate(0, ${pose.isDeadCollapsed ? 7 : 0})`}>
            <rect x="24" y="45" width="4" height="12" fill={pal.primaryDark} />
            <rect x="25" y="45" width="2" height="11" fill={pal.metal} />
            <rect x="34" y="45" width="4" height="12" fill={pal.primaryDark} />
            <rect x="35" y="45" width="2" height="11" fill={pal.metal} />
          </g>

          {/* Tall Layered Spore-Priest Vestments, Alchemical Vial Bandolier & Herb Pouches */}
          <g transform={`translate(${pose.torsoX}, ${pose.torsoY})`}>
            <rect x="19" y="21" width="24" height="30" fill="#0E1A16" />
            <rect x="20" y="22" width="22" height="27" fill={pal.primaryDark} />
            <rect x="22" y="23" width="18" height="24" fill={pal.primary} />
            <rect x="24" y="24" width="14" height="21" fill={pal.secondaryDark} />
            <rect x="28" y="23" width="6" height="25" fill={pal.secondary} />
            <rect x="30" y="25" width="2" height="21" fill="#7BDFF2" />
            <rect x="21" y="26" width="20" height="3" fill={pal.metalDark} />
            <rect x="23" y="25" width="3" height="5" fill="#FF4D6D" />
            <rect x="24" y="26" width="1" height="2" fill="#FFF3C4" />
            <rect x="29" y="26" width="3" height="5" fill="#7BDFF2" />
            <rect x="30" y="27" width="1" height="2" fill="#FFFFFF" />
            <rect x="35" y="27" width="3" height="5" fill="#D4FF80" />
            <rect x="21" y="36" width="20" height="3" fill="#291D12" />
            <rect x="22" y="38" width="5" height="5" fill={pal.metal} />
            <rect x="35" y="38" width="5" height="5" fill={pal.metal} />
            <rect x="29" y="36" width="4" height="4" fill="#FFD166" />
          </g>

          {/* Left Arm: Casting Gnarled Claw + Swirling Spore Hex */}
          <g transform={`translate(${pose.torsoX + pose.propX}, ${pose.torsoY + pose.propY})`}>
            <rect x="40" y="24" width="7" height="5" fill={pal.primary} />
            <rect x="45" y="23" width="5" height="4" fill={pal.skinOrBone} />
            <rect x="44" y={16 - (pose.secondaryPhase % 2)} width="8" height="6" fill="#7BDFF2" opacity="0.85" />
            <rect x="46" y={17 - (pose.secondaryPhase % 2)} width="4" height="4" fill="#D4FF80" />
            <rect x="47" y={18 - (pose.secondaryPhase % 2)} width="2" height="2" fill="#FFFFFF" />
          </g>

          {/* Towering Curled Witch-Mushroom Hat & Carved Wooden Ritual Mask */}
          <g transform={`translate(${pose.torsoX + pose.headX}, ${pose.torsoY + pose.headY})`}>
            <rect x="30" y="0" width="7" height="3" fill="#1B4A43" />
            <rect x="35" y="2" width="5" height="4" fill="#328276" />
            <rect x="25" y="2" width="10" height="4" fill="#1B4A43" />
            <rect x="26" y="3" width="8" height="4" fill="#328276" />
            <rect x="21" y="6" width="18" height="5" fill="#328276" />
            <rect x="23" y="6" width="14" height="4" fill="#55AD8E" />
            <rect x="13" y="10" width="34" height="4" fill="#122E2A" />
            <rect x="15" y="9" width="30" height="3" fill="#328276" />
            <rect x="18" y="9" width="24" height="2" fill="#7BDFF2" />
            <rect x="15" y="14" width="2" height="3" fill="#7BDFF2" />
            <rect x="43" y="14" width="2" height="3" fill="#7BDFF2" />
            <rect x="24" y="13" width="13" height="9" fill="#291D12" />
            <rect x="25" y="14" width="11" height="7" fill={pal.skinOrBone} />
            <rect x="26" y="14" width="9" height="2" fill={pal.skinShadow} />
            {!pose.eyeBlink && (
              <g>
                <rect x={26 + pose.eyeShiftX} y="16" width="3" height="2" fill="#09070D" />
                <rect x={27 + pose.eyeShiftX} y="16" width="2" height="2" fill="#7BDFF2" />
                <rect x={32 + pose.eyeShiftX} y="16" width="3" height="2" fill="#09070D" />
                <rect x={33 + pose.eyeShiftX} y="16" width="2" height="2" fill="#7BDFF2" />
              </g>
            )}
            <rect x="26" y="21" width="9" height="4" fill={pal.primaryLight} />
            <rect x="28" y="25" width="5" height="3" fill={pal.accent} />
          </g>

          {/* Right Arm + Tall Gnarled Elder-Root Staff with Swinging Spore-Lantern Censer */}
          <g transform={`translate(${pose.torsoX + pose.weaponX}, ${pose.torsoY + pose.weaponY})`}>
            <rect x="11" y="5" width="3" height="50" fill="#291D12" />
            <rect x="12" y="6" width="1" height="48" fill={pal.metalLight} />
            <rect x="5" y="3" width="10" height="3" fill="#291D12" />
            <rect x="6" y="4" width="8" height="2" fill={pal.metalLight} />
            <g transform={`translate(${pose.propX}, 0)`}>
              <rect x="6" y="6" width="1" height="5" fill="#D8C6A0" />
              <rect x="3" y="11" width="7" height="9" fill="#1B4A43" />
              <rect x="4" y="12" width="5" height="7" fill="#7BDFF2" />
              <rect x="5" y="13" width="3" height="5" fill="#D4FF80" />
              <rect x="6" y="14" width="1" height="3" fill="#FFFFFF" />
            </g>
          </g>
        </g>
      );
    }

    // ========================================================================
    // JARDÍN PODRIDO 3: ZARZA ESTRANGULADORA / ARAÑA DE MICELIO (Low-Slung Briar-Arachnid)
    // Wide, low-slung 6-legged predatory crawler with bulbous spore-sac abdomen,
    // 6 glowing arachnid eyes & raptorial thorn claws!
    // ========================================================================
    case 'GARDEN_THORN_BEAST': {
      return (
        <g>
          {/* 6 Articulated Thorny Spider-Root Legs (Wide Low Stance) */}
          <g transform={`translate(0, ${pose.isDeadCollapsed ? 6 : 0})`}>
            <rect x="8" y="36" width="8" height="3" fill="#0F1711" />
            <rect x="6" y="38" width="4" height="18" fill={pal.metalDark} />
            <rect x="7" y="39" width="2" height="16" fill={pal.primaryLight} />

            <rect x="14" y="40" width="6" height="3" fill="#0F1711" />
            <rect x="13" y="42" width="4" height="15" fill={pal.metalDark} />
            <rect x="14" y="43" width="2" height="13" fill={pal.metal} />

            <rect x="21" y="43" width="4" height="14" fill={pal.metalDark} />
            <rect x="39" y="43" width="4" height="14" fill={pal.metalDark} />
            <rect x="45" y="42" width="4" height="15" fill={pal.metalDark} />
            <rect x="46" y="43" width="2" height="13" fill={pal.metal} />
            <rect x="52" y="38" width="4" height="18" fill={pal.metalDark} />
            <rect x="53" y="39" width="2" height="16" fill={pal.primaryLight} />
          </g>

          {/* Bulbous Parasitic Spore-Abdomen & Sprouting Back Mushrooms */}
          <g transform={`translate(${pose.torsoX}, ${pose.torsoY})`}>
            <rect x="24" y="22" width="26" height="22" fill="#141F16" />
            <rect x="26" y="23" width="22" height="19" fill={pal.primary} />
            <rect x="28" y="24" width="18" height="15" fill={pal.primaryLight} />
            <rect
              x="31"
              y="26"
              width={12 + pose.breathPhase}
              height={9 + pose.breathPhase}
              fill="#6E3F8A"
            />
            <rect x="33" y="28" width="4" height="4" fill="#D4FF80" />
            <rect x="34" y="29" width="2" height="2" fill="#FFFFFF" />
            <rect x="40" y="29" width="3" height="3" fill="#8EE6AE" />
            <rect x="33" y="17" width="2" height="5" fill={pal.skinOrBone} />
            <rect x="30" y="14" width="8" height="4" fill="#8E5EA8" />
            <rect x="32" y="14" width="4" height="2" fill="#C997E6" />
            <rect x="43" y="18" width="2" height="4" fill={pal.skinOrBone} />
            <rect x="41" y="16" width="6" height="3" fill="#8E5EA8" />
          </g>

          {/* Low Crouched Cephalothorax, 6 Arachnid Eyes & Snapping Briar Mandibles */}
          <g transform={`translate(${pose.torsoX + pose.headX}, ${pose.torsoY + pose.headY})`}>
            <rect x="13" y="27" width="16" height="14" fill="#0F1711" />
            <rect x="14" y="28" width="14" height="12" fill={pal.primaryDark} />
            {!pose.eyeBlink && (
              <g fill="#D4FF80">
                <rect x={15 + pose.eyeShiftX} y="30" width="2" height="2" />
                <rect x={18 + pose.eyeShiftX} y="29" width="3" height="3" />
                <rect x={19 + pose.eyeShiftX} y="29" width="1" height="1" fill="#FFFFFF" />
                <rect x={22 + pose.eyeShiftX} y="30" width="2" height="2" />
                <rect x={16 + pose.eyeShiftX} y="33" width="2" height="2" fill="#7BDFF2" />
                <rect x={21 + pose.eyeShiftX} y="33" width="2" height="2" fill="#7BDFF2" />
              </g>
            )}
            <g transform={`translate(0, ${pose.jawOpen})`}>
              <rect x="9" y="36" width="6" height="4" fill={pal.skinOrBone} />
              <rect x="7" y="38" width="3" height="3" fill="#D4FF80" />
            </g>
          </g>

          {/* Raptorial Serrated Thorn-Scythe Foreclaws */}
          <g transform={`translate(${pose.torsoX + pose.weaponX}, ${pose.torsoY + pose.weaponY})`}>
            <rect x="4" y="25" width="11" height="4" fill={pal.primaryLight} />
            <rect x="2" y="28" width="5" height="11" fill="#8EE6AE" />
            <rect x="3" y="29" width="2" height="8" fill="#FFF8EC" />
          </g>
        </g>
      );
    }

    // ========================================================================
    // FORJA INFERNAL: HERRADOR CIEGO / GOLEM DE ESCORIA
    // Expanding molten furnace chest, black iron plates, anvil hammer & sparks.
    // ========================================================================
    case 'FORGE_BLIND_SMITH':
    case 'FORGE_SLAG_CONSTRUCT': {
      return (
        <g>
          {/* Heavy Iron Pillar Legs */}
          <g transform={`translate(0, ${pose.isDeadCollapsed ? 7 : 0})`}>
            <rect x="20" y="43" width="8" height="13" fill={pal.metalDark} />
            <rect x="21" y="44" width="6" height="11" fill={pal.metal} />
            <rect x="35" y="43" width="8" height="13" fill={pal.metalDark} />
            <rect x="36" y="44" width="6" height="11" fill={pal.metal} />
          </g>

          {/* Furnace Chest with Expanding Molten Grate */}
          <g transform={`translate(${pose.torsoX}, ${pose.torsoY})`}>
            <rect x="16" y="18" width="31" height="26" fill={pal.metalDark} />
            <rect x="18" y="20" width="27" height="22" fill={pal.primary} />
            {/* Glowing Molten Core behind Iron Grate */}
            <rect
              x="23"
              y="24"
              width="17"
              height={11 + pose.breathPhase}
              fill={pal.secondary}
            />
            <rect
              x="25"
              y="26"
              width="13"
              height={7 + pose.breathPhase}
              fill={pal.skinOrBone}
            />
            {/* Iron Grate Bars */}
            <rect x="27" y="24" width="2" height="12" fill={pal.metalDark} />
            <rect x="33" y="24" width="2" height="12" fill={pal.metalDark} />
          </g>

          {/* Riveted Furnace Helm & Smoke Vents */}
          <g
            transform={`translate(${pose.torsoX + pose.headX}, ${
              pose.torsoY + pose.headY
            })`}
          >
            <rect x="23" y="8" width="17" height="11" fill={pal.metalDark} />
            <rect x="24" y="9" width="15" height="9" fill={pal.metal} />
            <rect x="26" y="13" width="11" height="2" fill={pal.eyeGlow} />
            {/* Rising Forge Embers */}
            <rect
              x="25"
              y={4 - pose.secondaryPhase}
              width="2"
              height="2"
              fill={pal.accent}
            />
            <rect
              x="36"
              y={3 - pose.breathPhase}
              width="2"
              height="2"
              fill={pal.skinOrBone}
            />
          </g>

          {/* Massive Red-Hot Forge Hammer */}
          <g
            transform={`translate(${pose.torsoX + pose.weaponX}, ${
              pose.torsoY + pose.weaponY
            })`}
          >
            <rect x="10" y="12" width="3" height="32" fill="#4A2E1B" />
            <rect x="3" y="8" width="16" height="10" fill={pal.metalDark} />
            <rect x="4" y="9" width="14" height="8" fill={pal.metal} />
            <rect x="3" y="10" width="3" height="6" fill={pal.secondary} />
            <rect x="3" y="11" width="2" height="4" fill={pal.eyeGlow} />
          </g>
        </g>
      );
    }

    // ========================================================================
    // FORTALEZA GOBLIN: LANCERO SAQUEADOR / ARTIFICIERO CON MECHA
    // Pointed ears that twitch, asymmetrical scrap armor, sputtering bomb fuse.
    // ========================================================================
    case 'GOBLIN_SCRAP_RAIDER':
    case 'GOBLIN_BOMBARDIER': {
      const isBomb = family === 'GOBLIN_BOMBARDIER';
      return (
        <g>
          {/* Powder Keg Backpack with Sputtering Fuse */}
          <g
            transform={`translate(${pose.torsoX + pose.propX}, ${
              pose.torsoY + pose.propY
            })`}
          >
            <rect x="38" y="22" width="11" height="16" fill="#5E3A22" />
            <rect x="38" y="25" width="11" height="2" fill={pal.metal} />
            <rect x="38" y="33" width="11" height="2" fill={pal.metal} />
            {/* Sputtering Fuse Spark */}
            <rect x="43" y="17" width="2" height="5" fill="#D9D0BC" />
            <rect
              x={42 + (pose.secondaryPhase % 2)}
              y="14"
              width="4"
              height="4"
              fill="#FFD166"
            />
            <rect x="43" y="15" width="2" height="2" fill="#FF4D6D" />
          </g>

          {/* Hunched Goblin Legs */}
          <g transform={`translate(0, ${pose.isDeadCollapsed ? 7 : 0})`}>
            <rect x="22" y="44" width="5" height="12" fill={pal.skinShadow} />
            <rect x="33" y="44" width="5" height="12" fill={pal.skinShadow} />
            <rect x="20" y="53" width="7" height="4" fill={pal.primaryDark} />
            <rect x="32" y="53" width="7" height="4" fill={pal.primaryDark} />
          </g>

          {/* Scrap-Metal Patched Torso */}
          <g transform={`translate(${pose.torsoX}, ${pose.torsoY})`}>
            <rect x="20" y="26" width="20" height="19" fill={pal.primary} />
            <rect x="22" y="28" width="16" height="15" fill={pal.metalDark} />
            <rect x="24" y="30" width="6" height="6" fill={pal.secondary} />
            <rect x="31" y="29" width="5" height="8" fill={pal.metal} />
          </g>

          {/* Long Twitching Goblin Ears, Pointed Nose & Grinning Teeth */}
          <g
            transform={`translate(${pose.torsoX + pose.headX}, ${
              pose.torsoY + pose.headY
            })`}
          >
            {/* Long Pointed Ears */}
            <rect
              x="12"
              y={16 + (pose.secondaryPhase % 2)}
              width="8"
              height="4"
              fill={pal.skinShadow}
            />
            <rect
              x="38"
              y={15 - (pose.secondaryPhase % 2)}
              width="8"
              height="4"
              fill={pal.skinOrBone}
            />
            {/* Goblin Head & Scrap Pot-Helm */}
            <rect x="21" y="14" width="17" height="13" fill={pal.skinOrBone} />
            <rect x="20" y="11" width="19" height="6" fill={pal.metal} />
            <rect x="17" y="19" width="5" height="4" fill={pal.skinShadow} />
            {!pose.eyeBlink && (
              <g>
                <rect x="23" y="18" width="3" height="3" fill={pal.eyeGlow} />
                <rect x="31" y="18" width="3" height="3" fill={pal.eyeGlow} />
              </g>
            )}
            <rect x="24" y="23" width="8" height="2" fill="#FFF3C4" />
          </g>

          {/* Weapon: Lit Black-Powder Bomb or Jagged Scrap Spear */}
          <g
            transform={`translate(${pose.torsoX + pose.weaponX}, ${
              pose.torsoY + pose.weaponY
            })`}
          >
            {isBomb ? (
              <g>
                <rect x="8" y="24" width="10" height="10" fill="#1C1924" />
                <rect x="10" y="26" width="3" height="3" fill={pal.metalLight} />
                <rect x="12" y="20" width="2" height="4" fill="#D8C6A0" />
                <rect x="11" y="17" width="4" height="3" fill="#FFD166" />
              </g>
            ) : (
              <g>
                <rect x="11" y="8" width="2" height="44" fill="#6E472B" />
                <rect x="9" y="4" width="6" height="8" fill={pal.metalLight} />
                <rect x="8" y="12" width="4" height="3" fill={pal.secondary} />
              </g>
            )}
          </g>
        </g>
      );
    }

    // ========================================================================
    // EL ABISMO & FINAL BOSSES: UNCANNY VOID GEOMETRY / FLOATING LIMBS / EYES
    // ========================================================================
    case 'ABYSS_VOID_ENTITY':
    case 'FINAL_BOSS_PHASE_1':
    case 'FINAL_BOSS_PHASE_2': {
      const isPhase2 = family === 'FINAL_BOSS_PHASE_2';
      return (
        <g>
          {/* Desynchronized Shadow / Abyssal Wings */}
          <g
            transform={`translate(${pose.torsoX - pose.propX}, ${
              pose.torsoY - pose.propY
            })`}
          >
            <rect x="8" y="10" width="11" height="34" fill={pal.primaryDark} />
            <rect x="45" y="10" width="11" height="34" fill={pal.primaryDark} />
            {isPhase2 && (
              <g fill={pal.secondary}>
                <rect x="4" y="8" width="8" height="28" />
                <rect x="52" y="8" width="8" height="28" />
              </g>
            )}
          </g>

          {/* Torso with Intentional Negative-Space Void Hole in Center */}
          <g transform={`translate(${pose.torsoX}, ${pose.torsoY})`}>
            <rect x="18" y="18" width="28" height="30" fill={pal.primary} />
            <rect x="20" y="20" width="24" height="26" fill={pal.primaryLight} />
            {/* Negative-Space Void Aperture */}
            <rect x="25" y="25" width="14" height="14" fill="#040208" />
            <rect
              x={28 + pose.eyeShiftX}
              y={28 + (pose.breathPhase % 2)}
              width="8"
              height="8"
              fill={pal.secondary}
            />
            <rect
              x={30 + pose.eyeShiftX}
              y={30 + (pose.breathPhase % 2)}
              width="4"
              height="4"
              fill={pal.eyeGlow}
            />
          </g>

          {/* Crowned / Displaced Multi-Eye Head */}
          <g
            transform={`translate(${pose.torsoX + pose.headX}, ${
              pose.torsoY + pose.headY
            })`}
          >
            <rect x="22" y="6" width="20" height="12" fill={pal.primaryDark} />
            <rect x="20" y="3" width="3" height="6" fill={pal.metalLight} />
            <rect x="31" y="1" width="2" height="8" fill={pal.metalLight} />
            <rect x="41" y="3" width="3" height="6" fill={pal.metalLight} />
            {!pose.eyeBlink && (
              <g fill={pal.eyeGlow}>
                <rect x={25 + pose.eyeShiftX} y="10" width="3" height="2" />
                <rect x={36 + pose.eyeShiftX} y="11" width="3" height="2" />
                <rect x="31" y="8" width="2" height="3" fill="#FFFFFF" />
              </g>
            )}
          </g>

          {/* Detached Floating Void Blades / Runic Shackles */}
          <g
            transform={`translate(${pose.torsoX + pose.weaponX}, ${
              pose.torsoY + pose.weaponY
            })`}
          >
            <rect x="7" y="14" width="4" height="28" fill={pal.metalLight} />
            <rect x="6" y="18" width="2" height="20" fill={pal.secondary} />
            <rect x="53" y="14" width="4" height="28" fill={pal.metalLight} />
          </g>
        </g>
      );
    }

    // ========================================================================
    // ALCANTARILLAS IMPERIALES 2: LIMO DE ALQUIMIA & AMALGAMA DE DESAGÜE
    // Translucent bubbling ooze monster with suspended skull, broken vials & acid drips!
    // ========================================================================
    case 'SEWER_TOXIC_SLIME': {
      const swell = pose.breathPhase;
      return (
        <g>
          {/* Undulating Gelatinous Base & Acid Puddle */}
          <g transform={`translate(${pose.torsoX}, ${pose.isDeadCollapsed ? 8 : 0})`}>
            <rect
              x={11 - swell}
              y="46"
              width={42 + swell * 2}
              height="11"
              fill={pal.primaryDark}
            />
            <rect
              x={13 - swell}
              y="34"
              width={38 + swell * 2}
              height="21"
              fill={pal.primary}
            />
            <rect
              x="16"
              y={22 - swell}
              width="32"
              height={31 + swell}
              fill={pal.primaryLight}
              opacity="0.92"
            />
            {/* Translucent Slime Specular Highlights */}
            <rect x="19" y={25 - swell} width="8" height="3" fill={pal.secondary} />
            <rect x="18" y={28 - swell} width="3" height="10" fill={pal.secondary} />
          </g>

          {/* Suspended Dissolving Skull & Broken Alchemical Flask Inside Ooze */}
          <g
            transform={`translate(${pose.torsoX + pose.headX}, ${
              pose.torsoY + pose.headY
            })`}
          >
            {/* Floating Skull Core */}
            <rect x="25" y="26" width="12" height="10" fill={pal.skinOrBone} />
            <rect x="27" y="29" width="3" height="3" fill="#09070D" />
            <rect x="32" y="29" width="3" height="3" fill="#09070D" />
            {!pose.eyeBlink && (
              <g fill={pal.eyeGlow}>
                <rect x={28 + pose.eyeShiftX} y="30" width="2" height="2" />
                <rect x={33 + pose.eyeShiftX} y="30" width="2" height="2" />
              </g>
            )}
            {/* Floating Ribs & Broken Glass Vial */}
            <rect
              x={19 + pose.propX}
              y="38"
              width="7"
              height="5"
              fill={pal.skinShadow}
            />
            <rect
              x={38 - pose.propX}
              y="35"
              width="6"
              height="8"
              fill="#7BDFF2"
            />
          </g>

          {/* Whipping Acid Pseudopod Tendril */}
          <g
            transform={`translate(${pose.torsoX + pose.weaponX}, ${
              pose.torsoY + pose.weaponY
            })`}
          >
            <rect x="7" y="26" width="10" height="5" fill={pal.primaryLight} />
            <rect x="5" y="22" width="5" height="8" fill={pal.secondary} />
            <rect
              x="5"
              y={32 + (pose.secondaryPhase % 3)}
              width="3"
              height="4"
              fill={pal.eyeGlow}
            />
          </g>
        </g>
      );
    }

    // ========================================================================
    // ALCANTARILLAS IMPERIALES 3: CONTRABANDISTA DE CLOACA
    // Hunched sewer smuggler with brass gas-mask filter snout, oilskin trenchcoat,
    // bandolier of green poison vials, and sewer harpoon!
    // ========================================================================
    case 'SEWER_CONTRABANDIST': {
      return (
        <g>
          {/* Mud-stained Boots */}
          <g transform={`translate(0, ${pose.isDeadCollapsed ? 7 : 0})`}>
            <rect x="21" y="45" width="6" height="12" fill={pal.primaryDark} />
            <rect x="35" y="45" width="6" height="12" fill={pal.primaryDark} />
            <rect x="19" y="54" width="8" height="3" fill={pal.secondaryDark} />
            <rect x="34" y="54" width="8" height="3" fill={pal.secondaryDark} />
          </g>

          {/* Oilskin Trenchcoat & Alchemical Bandolier */}
          <g transform={`translate(${pose.torsoX}, ${pose.torsoY})`}>
            <rect x="18" y="21" width="26" height="25" fill={pal.primary} />
            <rect x="20" y="22" width="22" height="22" fill={pal.primaryLight} />
            {/* Diagonal Leather Bandolier with Glowing Green Vials */}
            <rect x="21" y="24" width="18" height="4" fill={pal.secondary} />
            <rect x="23" y="23" width="3" height="5" fill={pal.eyeGlow} />
            <rect x="29" y="24" width="3" height="5" fill={pal.eyeGlow} />
            <rect x="35" y="25" width="3" height="5" fill={pal.eyeGlow} />
          </g>

          {/* Left Hand Swinging Smuggler's Green Sewer Lantern */}
          <g
            transform={`translate(${pose.torsoX + pose.propX}, ${
              pose.torsoY + pose.propY
            })`}
          >
            <rect x="42" y="27" width="6" height="4" fill={pal.secondary} />
            <rect x="43" y="31" width="7" height="11" fill={pal.metalDark} />
            <rect x="45" y="33" width="3" height="7" fill={pal.eyeGlow} />
          </g>

          {/* Brass Alchemical Gas-Mask Snout & Trorne Hat */}
          <g
            transform={`translate(${pose.torsoX + pose.headX}, ${
              pose.torsoY + pose.headY
            })`}
          >
            <rect x="19" y="9" width="23" height="4" fill={pal.primaryDark} />
            <rect x="23" y="5" width="15" height="5" fill={pal.primary} />
            <rect x="22" y="13" width="16" height="9" fill={pal.metalDark} />
            {/* Gas Mask Filter Canister Snout */}
            <rect x="15" y="16" width="8" height="6" fill={pal.metal} />
            <rect x="13" y="17" width="3" height="4" fill={pal.secondary} />
            {/* Glowing Green Goggle Lenses */}
            {!pose.eyeBlink && (
              <g fill={pal.eyeGlow}>
                <rect x={24 + pose.eyeShiftX} y="14" width="4" height="3" />
                <rect x={32 + pose.eyeShiftX} y="14" width="4" height="3" />
              </g>
            )}
          </g>

          {/* Right Arm + Barbed Sewer Harpoon */}
          <g
            transform={`translate(${pose.torsoX + pose.weaponX}, ${
              pose.torsoY + pose.weaponY
            })`}
          >
            <rect x="11" y="8" width="3" height="44" fill={pal.secondaryDark} />
            <rect x="9" y="4" width="7" height="8" fill={pal.metalLight} />
            <rect x="6" y="8" width="4" height="3" fill={pal.metal} />
          </g>
        </g>
      );
    }

    // ========================================================================
    // TEMPLO SUMERGIDO: CORAL CRUSTACEAN & SACERDOTE DE LA SALMUERA
    // ========================================================================
    case 'TEMPLE_CORAL_CRUSTACEAN':
    case 'TEMPLE_BRINE_PRIEST': {
      const isCrab = family === 'TEMPLE_CORAL_CRUSTACEAN';
      return (
        <g>
          {/* Legs: Multi-segmented Crustacean Legs or Kelp-draped Vestments */}
          <g transform={`translate(0, ${pose.isDeadCollapsed ? 7 : 0})`}>
            {isCrab ? (
              <g fill={pal.primaryDark}>
                <rect x="14" y="44" width="5" height="12" />
                <rect x="22" y="46" width="5" height="11" />
                <rect x="36" y="46" width="5" height="11" />
                <rect x="44" y="44" width="5" height="12" />
              </g>
            ) : (
              <g>
                <rect x="20" y="41" width="22" height="15" fill={pal.primaryDark} />
                <rect x="23" y="42" width="4" height="14" fill={pal.metal} />
                <rect x="33" y="42" width="4" height="14" fill={pal.metal} />
              </g>
            )}
          </g>

          {/* Barnacle & Pink Coral Encrusted Carapace / Torso */}
          <g transform={`translate(${pose.torsoX}, ${pose.torsoY})`}>
            <rect x="16" y="22" width="32" height="23" fill={pal.primary} />
            <rect x="19" y="24" width="26" height="19" fill={pal.primaryLight} />
            {/* Branching Pink/Crimson Reef Coral Growths on Shoulders */}
            <rect x="14" y="14" width="4" height="10" fill={pal.secondary} />
            <rect x="11" y="16" width="4" height="4" fill={pal.secondary} />
            <rect x="44" y="13" width="4" height="11" fill={pal.secondary} />
            <rect x="47" y="15" width="4" height="4" fill={pal.secondary} />
            {/* Calcified Barnacle Clusters */}
            <rect x="25" y="28" width="4" height="4" fill={pal.skinOrBone} />
            <rect x="33" y="32" width="5" height="4" fill={pal.skinOrBone} />
          </g>

          {/* Head: Stalked Crustacean Eyes or Drowned Mitre Crown */}
          <g
            transform={`translate(${pose.torsoX + pose.headX}, ${
              pose.torsoY + pose.headY
            })`}
          >
            {!isCrab && (
              <rect x="24" y="5" width="14" height="9" fill={pal.metal} />
            )}
            <rect x="22" y="12" width="18" height="11" fill={pal.primaryDark} />
            {!pose.eyeBlink && (
              <g fill={pal.eyeGlow}>
                <rect x={25 + pose.eyeShiftX} y="15" width="3" height="3" />
                <rect x={34 + pose.eyeShiftX} y="15" width="3" height="3" />
              </g>
            )}
          </g>

          {/* Weapon: Massive Crushing Pincer Claw or Abyssal Coral Trident */}
          <g
            transform={`translate(${pose.torsoX + pose.weaponX}, ${
              pose.torsoY + pose.weaponY
            })`}
          >
            {isCrab ? (
              <g>
                <rect x="4" y="20" width="14" height="10" fill={pal.secondary} />
                <rect
                  x="4"
                  y={30 + pose.jawOpen}
                  width="12"
                  height="5"
                  fill={pal.secondaryDark}
                />
                <rect x="6" y="22" width="8" height="3" fill={pal.metalLight} />
              </g>
            ) : (
              <g>
                <rect x="11" y="8" width="2" height="46" fill={pal.metal} />
                <rect x="7" y="6" width="10" height="3" fill={pal.metalLight} />
                <rect x="7" y="2" width="2" height="6" fill={pal.eyeGlow} />
                <rect x="11" y="1" width="2" height="7" fill={pal.eyeGlow} />
                <rect x="15" y="2" width="2" height="6" fill={pal.eyeGlow} />
              </g>
            )}
          </g>
        </g>
      );
    }

    // ========================================================================
    // MINAS ABANDONADAS: ESCARABAJO DE VETA & MINERO DEL FAROL
    // ========================================================================
    case 'MINES_CRYSTAL_BEETLE':
    case 'MINES_LANTERN_MINER': {
      const isBeetle = family === 'MINES_CRYSTAL_BEETLE';
      if (isBeetle) {
        return (
          <g>
            {/* 6 Chitinous Excavating Legs */}
            <g
              transform={`translate(0, ${pose.isDeadCollapsed ? 6 : 0})`}
              fill={pal.primaryDark}
            >
              <rect x="14" y="45" width="4" height="11" />
              <rect x="24" y="46" width="4" height="11" />
              <rect x="35" y="46" width="4" height="11" />
              <rect x="45" y="45" width="4" height="11" />
            </g>
            {/* Armored Beetle Shell with Erupting Raw Quartz Crystals */}
            <g transform={`translate(${pose.torsoX}, ${pose.torsoY})`}>
              <rect x="15" y="26" width="34" height="21" fill={pal.primary} />
              <rect x="18" y="28" width="28" height="17" fill={pal.primaryLight} />
              {/* Glowing Turquoise Crystal Spires on Back */}
              <rect x="22" y="16" width="6" height="12" fill={pal.secondary} />
              <rect x="24" y="18" width="2" height="8" fill="#B8F2FF" />
              <rect x="31" y="13" width="7" height="15" fill={pal.secondary} />
              <rect x="33" y="15" width="3" height="10" fill="#B8F2FF" />
              <rect x="40" y="19" width="5" height="9" fill={pal.secondaryDark} />
            </g>
            {/* Clacking Mandibles & Rhinoceros Horn */}
            <g
              transform={`translate(${pose.torsoX + pose.headX + pose.weaponX * 0.5}, ${
                pose.torsoY + pose.headY
              })`}
            >
              <rect x="7" y="26" width="10" height="14" fill={pal.metalDark} />
              <rect x="4" y="22" width="6" height="5" fill={pal.metalLight} />
              <rect
                x="3"
                y={36 + pose.jawOpen}
                width="7"
                height="4"
                fill={pal.metalLight}
              />
              {!pose.eyeBlink && (
                <rect x="11" y="30" width="3" height="3" fill={pal.eyeGlow} />
              )}
            </g>
          </g>
        );
      }
      return (
        <g>
          {/* Heavy Miner Boots */}
          <g transform={`translate(0, ${pose.isDeadCollapsed ? 7 : 0})`}>
            <rect x="21" y="44" width="7" height="13" fill={pal.primaryDark} />
            <rect x="35" y="44" width="7" height="13" fill={pal.primaryDark} />
          </g>
          {/* Timber Support Brace & Ore Sack on Back */}
          <g transform={`translate(${pose.torsoX}, ${pose.torsoY})`}>
            <rect x="36" y="16" width="12" height="24" fill={pal.primaryDark} />
            <rect x="40" y="12" width="5" height="6" fill={pal.secondary} />
            <rect x="18" y="21" width="24" height="24" fill={pal.primary} />
            <rect x="21" y="23" width="18" height="20" fill={pal.primaryLight} />
          </g>
          {/* Left Hand Swinging Brass Mine Lantern */}
          <g
            transform={`translate(${pose.torsoX + pose.propX}, ${
              pose.torsoY + pose.propY
            })`}
          >
            <rect x="42" y="30" width="7" height="11" fill={pal.accent} />
            <rect x="44" y="32" width="3" height="7" fill="#FFF3C4" />
          </g>
          {/* Miner Helmet with Flickering Carbide Lamp */}
          <g
            transform={`translate(${pose.torsoX + pose.headX}, ${
              pose.torsoY + pose.headY
            })`}
          >
            <rect x="21" y="8" width="18" height="7" fill={pal.metal} />
            <rect x="28" y="5" width="5" height="5" fill={pal.eyeGlow} />
            <rect x="29" y="6" width="3" height="3" fill="#FFFFFF" />
            <rect x="23" y="14" width="14" height="8" fill="#120E0B" />
            {!pose.eyeBlink && (
              <g fill={pal.eyeGlow}>
                <rect x={25 + pose.eyeShiftX} y="16" width="2" height="2" />
                <rect x={32 + pose.eyeShiftX} y="16" width="2" height="2" />
              </g>
            )}
          </g>
          {/* Heavy Double-Headed Iron Pickaxe */}
          <g
            transform={`translate(${pose.torsoX + pose.weaponX}, ${
              pose.torsoY + pose.weaponY
            })`}
          >
            <rect x="11" y="9" width="3" height="44" fill="#6E4B33" />
            <rect x="3" y="10" width="18" height="4" fill={pal.metalLight} />
            <rect x="2" y="12" width="4" height="4" fill={pal.metal} />
            <rect x="18" y="12" width="4" height="4" fill={pal.metal} />
          </g>
        </g>
      );
    }

    // ========================================================================
    // BOSQUE DE LOS SUSURROS: VENADO DE HUESO & LEÑADOR HUECO
    // ========================================================================
    case 'WOODS_ANTLER_STAG':
    case 'WOODS_HOLLOW_WOODSMAN': {
      const isWoodsman =
        family === 'WOODS_HOLLOW_WOODSMAN' || def.subVariant === 'GUARDIAN';
      const isDryadShaman = def.subVariant === 'SHAMAN_CASTER';

      if (isDryadShaman) {
        return (
          <g>
            {/* Root-Vine Skirt & Bark Legs */}
            <g transform={`translate(0, ${pose.isDeadCollapsed ? 7 : 0})`}>
              <rect x="20" y="41" width="6" height="15" fill="#12151E" />
              <rect x="21" y="42" width="4" height="13" fill={pal.primaryDark} />
              <rect x="35" y="41" width="6" height="15" fill="#12151E" />
              <rect x="36" y="42" width="4" height="13" fill={pal.primaryDark} />
              <rect x="26" y="42" width="3" height="11" fill={pal.secondaryDark} />
              <rect x="32" y="42" width="2" height="12" fill={pal.secondary} />
            </g>
            {/* Briar Mantle & Hollow Bark Torso with Wisp Heart */}
            <g transform={`translate(${pose.torsoX}, ${pose.torsoY})`}>
              <rect x="18" y="20" width="26" height="23" fill="#12151E" />
              <rect x="19" y="21" width="24" height="21" fill={pal.primaryDark} />
              <rect x="21" y="22" width="20" height="19" fill={pal.primary} />
              <rect x="24" y="24" width="14" height="14" fill="#080B12" />
              <rect
                x="28"
                y={26 - pose.breathPhase}
                width="6"
                height="8"
                fill={pal.eyeGlow}
              />
              <rect x="29" y={27 - pose.breathPhase} width="3" height="5" fill="#FFFFFF" />
              {/* Mossy Shoulder Boughs */}
              <rect x="14" y="18" width="7" height="6" fill={pal.secondaryDark} />
              <rect x="15" y="17" width="5" height="4" fill={pal.secondary} />
              <rect x="41" y="18" width="7" height="6" fill={pal.secondaryDark} />
              <rect x="42" y="17" width="5" height="4" fill={pal.secondary} />
            </g>
            {/* Left Hand Holding Hanging Soul-Lantern */}
            <g transform={`translate(${pose.torsoX + pose.propX}, ${pose.torsoY + pose.propY})`}>
              <rect x="43" y="26" width="5" height="3" fill={pal.primaryLight} />
              <rect x="45" y="29" width="1" height="6" fill={pal.metalLight} />
              <rect x="42" y="35" width="7" height="9" fill={pal.metalDark} />
              <rect x="43" y="36" width="5" height="7" fill={pal.eyeGlow} />
              <rect x="44" y="38" width="3" height="3" fill="#FFFFFF" />
            </g>
            {/* Crowned Bark Visage & Antler Branches */}
            <g transform={`translate(${pose.torsoX + pose.headX}, ${pose.torsoY + pose.headY})`}>
              <rect x="14" y="3" width="3" height="10" fill={pal.skinShadow} />
              <rect x="17" y="6" width="5" height="2" fill={pal.skinOrBone} />
              <rect x="45" y="3" width="3" height="10" fill={pal.skinShadow} />
              <rect x="40" y="6" width="5" height="2" fill={pal.skinOrBone} />
              <rect x="22" y="8" width="18" height="12" fill="#12151E" />
              <rect x="23" y="9" width="16" height="10" fill={pal.skinShadow} />
              <rect x="24" y="10" width="14" height="8" fill={pal.skinOrBone} />
              {!pose.eyeBlink && (
                <g>
                  <rect x={26 + pose.eyeShiftX} y="13" width="3" height="3" fill={pal.eyeGlow} />
                  <rect x={33 + pose.eyeShiftX} y="13" width="3" height="3" fill={pal.eyeGlow} />
                  <rect x={27 + pose.eyeShiftX} y="13" width="1" height="1" fill="#FFFFFF" />
                </g>
              )}
            </g>
            {/* Gnarled Briar Staff */}
            <g transform={`translate(${pose.torsoX + pose.weaponX}, ${pose.torsoY + pose.weaponY})`}>
              <rect x="11" y="7" width="3" height="46" fill="#3D2B1F" />
              <rect x="12" y="7" width="1" height="45" fill="#6E4F3A" />
              <rect x="8" y="4" width="9" height="7" fill={pal.secondaryDark} />
              <rect x="10" y="5" width="5" height="5" fill={pal.eyeGlow} />
            </g>
          </g>
        );
      }

      if (isWoodsman) {
        return (
          <g>
            {/* Heavy Woodsman Boots & Bark Greaves */}
            <g transform={`translate(0, ${pose.isDeadCollapsed ? 7 : 0})`}>
              <rect x="20" y="42" width="7" height="14" fill="#12151E" />
              <rect x="21" y="43" width="5" height="12" fill={pal.primaryDark} />
              <rect x="18" y="53" width="9" height="4" fill={pal.metalDark} />
              <rect x="35" y="42" width="7" height="14" fill="#12151E" />
              <rect x="36" y="43" width="5" height="12" fill={pal.primaryDark} />
              <rect x="34" y="53" width="9" height="4" fill={pal.metalDark} />
            </g>
            {/* Broad Hollow Woodsman Coat, Moss Pauldrons & Ribcage */}
            <g transform={`translate(${pose.torsoX}, ${pose.torsoY})`}>
              <rect x="16" y="19" width="30" height="25" fill="#12151E" />
              <rect x="18" y="20" width="26" height="23" fill={pal.primary} />
              <rect x="22" y="23" width="18" height="16" fill="#080B12" />
              <rect x="23" y="25" width="16" height="2" fill={pal.skinShadow} />
              <rect x="24" y="29" width="14" height="2" fill={pal.skinShadow} />
              <rect x="25" y="33" width="12" height="2" fill={pal.skinShadow} />
              <rect
                x="28"
                y={26 - pose.breathPhase}
                width="6"
                height="8"
                fill={pal.eyeGlow}
              />
              <rect x="14" y="17" width="8" height="7" fill={pal.secondaryDark} />
              <rect x="15" y="18" width="6" height="4" fill={pal.secondary} />
              <rect x="40" y="17" width="8" height="7" fill={pal.secondaryDark} />
              <rect x="41" y="18" width="6" height="4" fill={pal.secondary} />
            </g>
            {/* Hooded Woodsman Skull with Moss Beard */}
            <g transform={`translate(${pose.torsoX + pose.headX}, ${pose.torsoY + pose.headY})`}>
              <rect x="21" y="6" width="20" height="14" fill={pal.primaryDark} />
              <rect x="23" y="8" width="16" height="11" fill="#080B12" />
              <rect x="24" y="9" width="14" height="7" fill={pal.skinOrBone} />
              {!pose.eyeBlink && (
                <g fill={pal.eyeGlow}>
                  <rect x={26 + pose.eyeShiftX} y="11" width="3" height="3" />
                  <rect x={33 + pose.eyeShiftX} y="11" width="3" height="3" />
                </g>
              )}
              <rect x="25" y="16" width="12" height="5" fill={pal.secondaryDark} />
              <rect x="27" y="17" width="8" height="4" fill={pal.secondary} />
            </g>
            {/* Heavy Notched Lumberjack Felling Axe */}
            <g transform={`translate(${pose.torsoX + pose.weaponX}, ${pose.torsoY + pose.weaponY})`}>
              <rect x="11" y="7" width="3" height="46" fill="#4E3828" />
              <rect x="12" y="7" width="1" height="45" fill="#7D5B42" />
              <rect x="2" y="9" width="11" height="14" fill="#12151E" />
              <rect x="3" y="10" width="9" height="12" fill={pal.metal} />
              <rect x="3" y="10" width="3" height="12" fill={pal.metalLight} />
              <rect x="3" y="15" width="2" height="2" fill="#12151E" />
            </g>
          </g>
        );
      }

      // SILHOUETTE C: WENDIGO / ANTLER STAG SKULL BEAST
      return (
        <g>
          {/* Digitigrade Hooved Hind Legs */}
          <g transform={`translate(0, ${pose.isDeadCollapsed ? 7 : 0})`}>
            <rect x="21" y="41" width="6" height="15" fill="#12151E" />
            <rect x="22" y="42" width="4" height="13" fill={pal.primaryDark} />
            <rect x="20" y="54" width="6" height="3" fill={pal.skinShadow} />
            <rect x="35" y="41" width="6" height="15" fill="#12151E" />
            <rect x="36" y="42" width="4" height="13" fill={pal.primaryDark} />
            <rect x="35" y="54" width="6" height="3" fill={pal.skinShadow} />
          </g>
          {/* Exposed Ribcage & Whispering Soul Flame */}
          <g transform={`translate(${pose.torsoX}, ${pose.torsoY})`}>
            <rect x="18" y="19" width="26" height="24" fill="#12151E" />
            <rect x="19" y="20" width="24" height="22" fill={pal.primary} />
            <rect x="22" y="22" width="18" height="18" fill="#080B12" />
            <rect
              x="28"
              y={25 - pose.breathPhase}
              width="6"
              height="10"
              fill={pal.eyeGlow}
            />
            <rect x="29" y={27 - pose.breathPhase} width="4" height="6" fill="#FFFFFF" />
            <rect x="22" y="24" width="18" height="2" fill={pal.skinOrBone} />
            <rect x="23" y="28" width="16" height="2" fill={pal.skinShadow} />
            <rect x="24" y="32" width="14" height="2" fill={pal.skinShadow} />
          </g>
          {/* Cervine Stag Skull & Towering Multi-Tine Bone Antlers */}
          <g transform={`translate(${pose.torsoX + pose.headX}, ${pose.torsoY + pose.headY})`}>
            {/* Left Branching Antler */}
            <rect x="10" y="1" width="3" height="12" fill={pal.skinOrBone} />
            <rect x="13" y="5" width="8" height="2" fill={pal.skinOrBone} />
            <rect x="14" y="1" width="2" height="5" fill={pal.skinShadow} />
            <rect x="18" y="2" width="2" height="4" fill={pal.skinShadow} />
            {/* Right Branching Antler */}
            <rect x="48" y="1" width="3" height="12" fill={pal.skinOrBone} />
            <rect x="40" y="5" width="8" height="2" fill={pal.skinOrBone} />
            <rect x="45" y="1" width="2" height="5" fill={pal.skinShadow} />
            <rect x="41" y="2" width="2" height="4" fill={pal.skinShadow} />
            {/* Hanging Wisp Lantern on Left Antler */}
            <rect x={10 + pose.propX} y="13" width="4" height="6" fill={pal.eyeGlow} />
            <rect x={11 + pose.propX} y="14" width="2" height="3" fill="#FFFFFF" />
            {/* Sculpted Cervine Skull & Snout */}
            <rect x="20" y="8" width="21" height="12" fill="#12151E" />
            <rect x="21" y="9" width="19" height="10" fill={pal.skinOrBone} />
            <rect x="22" y="9" width="15" height="3" fill="#FFF8EC" />
            <rect x="14" y="12" width="8" height="7" fill={pal.skinShadow} />
            <rect x="15" y="13" width="6" height="4" fill={pal.skinOrBone} />
            <rect x="15" y="15" width="2" height="2" fill="#12151E" />
            {!pose.eyeBlink && (
              <g>
                <rect x={25 + pose.eyeShiftX} y="12" width="3" height="3" fill="#12151E" />
                <rect x={26 + pose.eyeShiftX} y="12" width="2" height="2" fill={pal.eyeGlow} />
                <rect x={34 + pose.eyeShiftX} y="12" width="3" height="3" fill="#12151E" />
                <rect x={35 + pose.eyeShiftX} y="12" width="2" height="2" fill={pal.eyeGlow} />
              </g>
            )}
            <g transform={`translate(0, ${pose.jawOpen})`}>
              <rect x="16" y="18" width="16" height="3" fill={pal.skinShadow} />
              <rect x="18" y="17" width="2" height="2" fill="#FFF8EC" />
              <rect x="22" y="17" width="2" height="2" fill="#FFF8EC" />
              <rect x="26" y="17" width="2" height="2" fill="#FFF8EC" />
            </g>
          </g>
          {/* Briar-Clawed Forelimbs */}
          <g transform={`translate(${pose.torsoX + pose.weaponX}, ${pose.torsoY + pose.weaponY})`}>
            <rect x="9" y="22" width="6" height="16" fill={pal.primaryDark} />
            <rect x="7" y="36" width="2" height="6" fill={pal.skinOrBone} />
            <rect x="10" y="37" width="2" height="6" fill={pal.skinOrBone} />
            <rect x="13" y="36" width="2" height="6" fill={pal.skinOrBone} />
          </g>
        </g>
      );
    }

    // ========================================================================
    // BIBLIOTECA PROHIBIDA: TOMO VORAZ & COPISTA SIN ROSTRO
    // ========================================================================
    case 'LIBRARY_VORACIOUS_TOME':
    case 'LIBRARY_FACELESS_SCRIBE': {
      const isTome =
        family === 'LIBRARY_VORACIOUS_TOME' || def.subVariant === 'STALKER_BEAST';
      if (isTome) {
        return (
          <g transform={`translate(${pose.torsoX}, ${pose.torsoY - pose.breathPhase})`}>
            {/* Heavy Brass Binding Chains & Padlock */}
            <rect x="26" y="41" width="3" height="13" fill="#160D21" />
            <rect x="27" y="42" width="2" height="11" fill={pal.metal} />
            <rect x="34" y="43" width="3" height="11" fill="#160D21" />
            <rect x="35" y="44" width="2" height="9" fill={pal.metalDark} />
            {/* Open Leather Grimoire Covers & Gold Corner Bosses */}
            <rect x="7" y="14" width="50" height="28" fill="#160D21" />
            <rect x="8" y="15" width="48" height="26" fill={pal.primaryDark} />
            <rect x="8" y="15" width="5" height="5" fill={pal.metalLight} />
            <rect x="51" y="15" width="5" height="5" fill={pal.metalLight} />
            <rect x="8" y="36" width="5" height="5" fill={pal.metalLight} />
            <rect x="51" y="36" width="5" height="5" fill={pal.metalLight} />
            {/* Layered Parchment Pages */}
            <rect x="11" y="17" width="42" height="22" fill={pal.skinShadow} />
            <rect x="12" y="18" width="40" height="20" fill={pal.skinOrBone} />
            <rect x="13" y="19" width="18" height="3" fill="#FFF8EC" />
            {/* Abyssal Maw, Sharp Teeth & Writhing Arcane Tongue */}
            <rect x="15" y="23" width="34" height="12" fill="#12081C" />
            {[17, 21, 25, 35, 39, 43].map((tx) => (
              <rect key={tx} x={tx} y="23" width="2" height="3" fill="#FFF8EC" />
            ))}
            {[19, 23, 37, 41].map((bx) => (
              <rect key={bx} x={bx} y="32" width="2" height="3" fill={pal.skinOrBone} />
            ))}
            <rect
              x={25 + pose.weaponX}
              y={28 + pose.jawOpen}
              width="14"
              height="9"
              fill={pal.secondaryDark}
            />
            <rect
              x={26 + pose.weaponX}
              y={29 + pose.jawOpen}
              width="11"
              height="6"
              fill={pal.secondary}
            />
            <rect
              x={28 + pose.weaponX}
              y={30 + pose.jawOpen}
              width="6"
              height="2"
              fill={pal.eyeGlow}
            />
            {/* Multiple Eldritch Eyes on Cover */}
            {!pose.eyeBlink && (
              <g>
                <rect x={20 + pose.eyeShiftX} y="18" width="4" height="3" fill="#12081C" />
                <rect x={21 + pose.eyeShiftX} y="18" width="2" height="2" fill={pal.eyeGlow} />
                <rect x={39 + pose.eyeShiftX} y="18" width="4" height="3" fill="#12081C" />
                <rect x={40 + pose.eyeShiftX} y="18" width="2" height="2" fill={pal.eyeGlow} />
              </g>
            )}
          </g>
        );
      }
      return (
        <g>
          {/* Floating Runic Scroll Halo Behind Scribe */}
          <g transform={`translate(${pose.torsoX - pose.propX}, ${pose.torsoY})`}>
            <rect x="12" y="7" width="7" height="20" fill="#160D21" />
            <rect x="13" y="8" width="5" height="18" fill={pal.skinOrBone} />
            <rect x="14" y="11" width="3" height="1" fill={pal.secondary} />
            <rect x="14" y="15" width="3" height="1" fill={pal.secondary} />
            <rect x="44" y="7" width="7" height="20" fill="#160D21" />
            <rect x="45" y="8" width="5" height="18" fill={pal.skinOrBone} />
            <rect x="46" y="11" width="3" height="1" fill={pal.secondary} />
            <rect x="46" y="15" width="3" height="1" fill={pal.secondary} />
          </g>
          {/* Layered Archivist Vestments & Gold Trim */}
          <g transform={`translate(${pose.torsoX}, ${pose.torsoY})`}>
            <rect x="18" y="18" width="27" height="38" fill="#160D21" />
            <rect x="19" y="19" width="25" height="36" fill={pal.primaryDark} />
            <rect x="21" y="20" width="21" height="34" fill={pal.primary} />
            <rect x="24" y="21" width="15" height="32" fill={pal.primaryLight} />
            <rect x="28" y="21" width="7" height="32" fill={pal.secondaryDark} />
            <rect x="29" y="21" width="5" height="32" fill={pal.secondary} />
            <rect x="20" y="36" width="23" height="3" fill={pal.metalDark} />
            <rect x="29" y="35" width="5" height="5" fill={pal.metalLight} />
          </g>
          {/* Porcelain Mask with Shifting Violet Rune-Script */}
          <g transform={`translate(${pose.torsoX + pose.headX}, ${pose.torsoY + pose.headY})`}>
            <rect x="22" y="5" width="19" height="15" fill={pal.primaryDark} />
            <rect x="24" y="7" width="15" height="12" fill={pal.skinShadow} />
            <rect x="25" y="7" width="13" height="11" fill={pal.skinOrBone} />
            <rect x="26" y="8" width="10" height="3" fill="#FFF8EC" />
            <rect
              x={29 + pose.eyeShiftX}
              y="10"
              width="5"
              height="7"
              fill={pal.secondaryDark}
            />
            <rect
              x={30 + pose.eyeShiftX}
              y="11"
              width="3"
              height="5"
              fill={pal.eyeGlow}
            />
          </g>
          {/* Giant Dripping Obsidian Fountain-Quill Lance */}
          <g transform={`translate(${pose.torsoX + pose.weaponX}, ${pose.torsoY + pose.weaponY})`}>
            <rect x="9" y="5" width="5" height="38" fill="#160D21" />
            <rect x="10" y="6" width="3" height="36" fill={pal.secondary} />
            <rect x="11" y="7" width="1" height="30" fill={pal.eyeGlow} />
            <rect x="8" y="41" width="7" height="8" fill={pal.metalDark} />
            <rect x="9" y="42" width="5" height="6" fill={pal.metalLight} />
            <rect x="10" y="49" width="3" height="6" fill="#12081C" />
          </g>
        </g>
      );
    }

    // ========================================================================
    // TORRE DEL ASTRÓLOGO: ESFERA ARMILAR CHAMÁN (Shamanic Armillary Construct)
    // ========================================================================
    case 'TOWER_ARMILLARY_CONSTRUCT': {
      return (
        <g transform={`translate(${pose.torsoX}, ${pose.torsoY - pose.breathPhase})`}>
          {/* Hanging Shamanic Talismans & Celestial Scroll Banners Beneath Rings */}
          <rect x="20" y="48" width="4" height="9" fill="#1A1208" />
          <rect x="21" y="49" width="2" height="7" fill="#F8F4E6" />
          <rect x="21" y="51" width="2" height="2" fill="#34D399" />
          <rect x="40" y="48" width="4" height="9" fill="#1A1208" />
          <rect x="41" y="49" width="2" height="7" fill="#F8F4E6" />
          <rect x="41" y="51" width="2" height="2" fill="#34D399" />
          <rect x="29" y="50" width="6" height="6" fill="#B45309" />
          <rect x="30" y="51" width="4" height="4" fill="#34D399" />

          {/* Outer Engraved Brass Armillary Ring */}
          <rect x="11" y="10" width="42" height="4" fill="#1A1208" />
          <rect x="12" y="11" width="40" height="2" fill="#FCD34D" />
          <rect x="11" y="46" width="42" height="4" fill="#1A1208" />
          <rect x="12" y="47" width="40" height="2" fill="#FCD34D" />
          <rect x="11" y="14" width="4" height="32" fill="#1A1208" />
          <rect x="12" y="14" width="2" height="32" fill="#D97706" />
          <rect x="49" y="14" width="4" height="32" fill="#1A1208" />
          <rect x="50" y="14" width="2" height="32" fill="#D97706" />
          {/* Tilted Inner Equatorial Ring */}
          <rect
            x="15"
            y={26 + (pose.secondaryPhase % 2)}
            width="34"
            height="5"
            fill="#78350F"
          />
          <rect
            x="16"
            y={27 + (pose.secondaryPhase % 2)}
            width="32"
            height="3"
            fill="#F59E0B"
          />
          {/* Shamanic Emerald-Cyan Astral Core */}
          <rect x="21" y="19" width="22" height="22" fill="#06281E" />
          <rect x="23" y="21" width="18" height="18" fill="#047857" />
          <rect x="25" y="23" width="14" height="14" fill="#10B981" />
          {!pose.eyeBlink && (
            <g>
              <rect x={27 + pose.eyeShiftX} y="25" width="10" height="10" fill="#34D399" />
              <rect x={29 + pose.eyeShiftX} y="27" width="6" height="6" fill="#A7F3D0" />
              <rect x={30 + pose.eyeShiftX} y="28" width="4" height="4" fill="#FFFFFF" />
            </g>
          )}
          {/* Orbiting Shamanic Healing Totem Satellites */}
          <g transform={`translate(${pose.weaponX}, ${pose.weaponY})`}>
            <rect x="4" y="18" width="6" height="14" fill="#1A1208" />
            <rect x="5" y="19" width="4" height="12" fill="#F59E0B" />
            <rect x="5" y="22" width="4" height="6" fill="#34D399" />
            <rect x="54" y="18" width="6" height="14" fill="#1A1208" />
            <rect x="55" y="19" width="4" height="12" fill="#F59E0B" />
            <rect x="55" y="22" width="4" height="6" fill="#38BDF8" />
          </g>
        </g>
      );
    }

    // ========================================================================
    // LA COLMENA: 3 DISTINCT INSECTOID SILHOUETTES (SCARAB GUARD / AMBER BROOD-SHAMAN / WASP-MANTIS ASSASSIN)
    // ========================================================================
    case 'HIVE_CHITIN_WARRIOR': {
      const isBroodShaman = def.subVariant === 'SHAMAN_CASTER';
      const isScarabGuard = def.subVariant === 'GUARDIAN';

      if (isScarabGuard) {
        // SILHOUETTE A: HEAVY HORNED SCARAB CARAPACE GUARD (6 insect legs, ridged chitin shell, horn, mandibles & chitin cleaver)
        return (
          <g>
            {/* 6 Segmented Chitinous Insect Legs with Tarsal Claws */}
            <g transform={`translate(0, ${pose.isDeadCollapsed ? 6 : 0})`}>
              <rect x="13" y="42" width="4" height="13" fill="#120B05" />
              <rect x="14" y="43" width="2" height="11" fill={pal.primaryDark} />
              <rect x="11" y="54" width="5" height="2" fill={pal.metalLight} />

              <rect x="21" y="44" width="5" height="13" fill="#120B05" />
              <rect x="22" y="45" width="3" height="11" fill={pal.primary} />
              <rect x="19" y="55" width="6" height="2" fill={pal.metalLight} />

              <rect x="35" y="44" width="5" height="13" fill="#120B05" />
              <rect x="36" y="45" width="3" height="11" fill={pal.primary} />
              <rect x="35" y="55" width="6" height="2" fill={pal.metalLight} />

              <rect x="44" y="42" width="4" height="13" fill="#120B05" />
              <rect x="45" y="43" width="2" height="11" fill={pal.primaryDark} />
              <rect x="44" y="54" width="5" height="2" fill={pal.metalLight} />
            </g>

            {/* Heavy Domed Scarab Abdomen & Ridged Thorax Plates (5-tone chitin shading) */}
            <g transform={`translate(${pose.torsoX}, ${pose.torsoY})`}>
              {/* Rear Rounded Beetle Elytra Shell */}
              <rect x="28" y="21" width="22" height="24" fill="#120B05" />
              <rect x="29" y="22" width="20" height="22" fill={pal.primaryDark} />
              <rect x="30" y="23" width="17" height="19" fill={pal.primary} />
              <rect x="32" y="24" width="12" height="14" fill={pal.primaryLight} />
              <rect x="34" y="25" width="6" height="4" fill={pal.metalLight} />
              {/* Horizontal Chitin Segment Ridges */}
              <rect x="30" y="29" width="18" height="2" fill="#120B05" />
              <rect x="30" y="35" width="18" height="2" fill="#120B05" />

              {/* Armored Front Thorax & Amber Core */}
              <rect x="17" y="19" width="24" height="25" fill="#120B05" />
              <rect x="18" y="20" width="22" height="23" fill={pal.primary} />
              <rect x="20" y="21" width="18" height="19" fill={pal.primaryLight} />
              <rect x="24" y="25" width="10" height="10" fill={pal.secondaryDark} />
              <rect x="25" y="26" width="8" height="8" fill={pal.secondary} />
              <rect x="26" y="27" width="4" height="3" fill="#FFF3C4" />
              {/* Spiked Chitin Shoulder Pauldrons */}
              <rect x="14" y="16" width="9" height="7" fill="#120B05" />
              <rect x="15" y="17" width="7" height="5" fill={pal.metalLight} />
              <rect x="37" y="16" width="9" height="7" fill="#120B05" />
              <rect x="38" y="17" width="7" height="5" fill={pal.metalLight} />
            </g>

            {/* Left Forelimb + Hexagonal Honeycomb Chitin Shield */}
            <g transform={`translate(${pose.torsoX + pose.propX}, ${pose.torsoY + pose.propY})`}>
              <rect x="40" y="22" width="14" height="21" fill="#120B05" />
              <rect x="41" y="23" width="12" height="19" fill={pal.primaryDark} />
              <rect x="42" y="24" width="10" height="17" fill={pal.secondaryDark} />
              <rect x="43" y="25" width="8" height="15" fill={pal.secondary} />
              <rect x="44" y="27" width="6" height="4" fill="#FFF3C4" />
              <rect x="44" y="33" width="6" height="4" fill={pal.primaryDark} />
            </g>

            {/* Insectoid Head, Curved Rhinoceros Horn, Antennae, Faceted Compound Eyes & Pincer Mandibles */}
            <g transform={`translate(${pose.torsoX + pose.headX}, ${pose.torsoY + pose.headY})`}>
              {/* Segmented Antennae */}
              <rect x="19" y="3" width="2" height="6" fill={pal.secondary} />
              <rect x="17" y="2" width="3" height="2" fill={pal.skinOrBone} />
              <rect x="37" y="3" width="2" height="6" fill={pal.secondary} />
              <rect x="38" y="2" width="3" height="2" fill={pal.skinOrBone} />
              {/* Curved Scarab Horn */}
              <rect x="26" y="1" width="5" height="8" fill="#120B05" />
              <rect x="27" y="2" width="3" height="7" fill={pal.metalLight} />
              <rect x="25" y="1" width="3" height="3" fill="#FFF3C4" />
              {/* Chitin Head Capsule */}
              <rect x="19" y="8" width="20" height="12" fill="#120B05" />
              <rect x="20" y="9" width="18" height="10" fill={pal.primaryDark} />
              <rect x="22" y="10" width="14" height="6" fill={pal.primary} />
              {/* Faceted Compound Eyes */}
              {!pose.eyeBlink && (
                <g>
                  <rect x={21 + pose.eyeShiftX} y="11" width="5" height="5" fill={pal.eyeGlow} />
                  <rect x={22 + pose.eyeShiftX} y="11" width="2" height="2" fill="#FFF3C4" />
                  <rect x={32 + pose.eyeShiftX} y="11" width="5" height="5" fill={pal.eyeGlow} />
                  <rect x={33 + pose.eyeShiftX} y="11" width="2" height="2" fill="#FFF3C4" />
                </g>
              )}
              {/* Clacking Serrated Pincer Mandibles */}
              <g transform={`translate(0, ${pose.jawOpen})`}>
                <rect x="18" y="18" width="6" height="5" fill="#120B05" />
                <rect x="19" y="19" width="4" height="3" fill={pal.metalLight} />
                <rect x="23" y="20" width="2" height="2" fill="#FFF3C4" />
                <rect x="34" y="18" width="6" height="5" fill="#120B05" />
                <rect x="35" y="19" width="4" height="3" fill={pal.metalLight} />
                <rect x="33" y="20" width="2" height="2" fill="#FFF3C4" />
              </g>
            </g>

            {/* Right Forelimb + Heavy Serrated Chitin Great-Cleaver */}
            <g transform={`translate(${pose.torsoX + pose.weaponX}, ${pose.torsoY + pose.weaponY})`}>
              <rect x="4" y="10" width="11" height="28" fill="#120B05" />
              <rect x="5" y="11" width="9" height="26" fill={pal.primaryLight} />
              <rect x="5" y="11" width="3" height="25" fill={pal.secondary} />
              <rect x="5" y="12" width="1" height="22" fill="#FFF3C4" />
              {/* Serrated Saw-Teeth on Blade Edge */}
              <rect x="3" y="14" width="2" height="3" fill="#FFF3C4" />
              <rect x="3" y="20" width="2" height="3" fill="#FFF3C4" />
              <rect x="3" y="26" width="2" height="3" fill="#FFF3C4" />
            </g>
          </g>
        );
      }

      if (isBroodShaman) {
        // SILHOUETTE B: ROYAL AMBER BROOD-WEAVER / HIVE SHAMAN (Swollen glowing amber abdomen sac, royal crown antennae, resin staff)
        return (
          <g>
            {/* Translucent Royal Gossamer Wings */}
            <g
              transform={`translate(${pose.torsoX}, ${
                pose.torsoY - (pose.secondaryPhase % 2)
              })`}
            >
              <rect x="9" y="10" width="13" height="22" fill={pal.skinOrBone} opacity="0.45" />
              <rect x="11" y="12" width="9" height="16" fill="#FFF3C4" opacity="0.35" />
              <rect x="41" y="10" width="13" height="22" fill={pal.skinOrBone} opacity="0.45" />
              <rect x="43" y="12" width="9" height="16" fill="#FFF3C4" opacity="0.35" />
            </g>

            {/* Swollen Bioluminescent Amber Brood-Abdomen Sac */}
            <g transform={`translate(${pose.torsoX + pose.propX}, ${pose.torsoY})`}>
              <rect x="31" y="30" width="22" height="22" fill="#120B05" />
              <rect x="32" y="31" width="20" height="20" fill={pal.secondaryDark} />
              <rect x="34" y="32" width="16" height="17" fill={pal.secondary} />
              <rect
                x="36"
                y="34"
                width={10 + (pose.breathPhase % 2)}
                height={10 + (pose.breathPhase % 2)}
                fill={pal.skinOrBone}
              />
              <rect x="38" y="36" width="5" height="4" fill="#FFFFFF" />
              {/* Segmented Chitin Bands Over Abdomen */}
              <rect x="32" y="36" width="20" height="2" fill="#120B05" />
              <rect x="32" y="42" width="20" height="2" fill="#120B05" />
              <rect x="32" y="47" width="18" height="2" fill="#120B05" />
            </g>

            {/* 4 Slender Insect Legs & Royal Thorax */}
            <g transform={`translate(${pose.torsoX}, ${pose.torsoY})`}>
              <rect x="18" y="42" width="4" height="14" fill="#120B05" />
              <rect x="19" y="43" width="2" height="12" fill={pal.primaryLight} />
              <rect x="28" y="42" width="4" height="14" fill="#120B05" />
              <rect x="29" y="43" width="2" height="12" fill={pal.primaryLight} />

              <rect x="18" y="20" width="20" height="23" fill="#120B05" />
              <rect x="19" y="21" width="18" height="21" fill={pal.primary} />
              <rect x="21" y="22" width="14" height="18" fill={pal.primaryLight} />
              {/* Royal Honeycomb Collar */}
              <rect x="16" y="19" width="24" height="5" fill={pal.secondary} />
              <rect x="18" y="20" width="20" height="2" fill="#FFF3C4" />
            </g>

            {/* Royal Crowned Insect Head, Plumed Antennae & Compound Eyes */}
            <g transform={`translate(${pose.torsoX + pose.headX}, ${pose.torsoY + pose.headY})`}>
              <rect x="16" y="1" width="3" height="9" fill={pal.skinOrBone} />
              <rect x="14" y="1" width="3" height="3" fill="#FFF3C4" />
              <rect x="37" y="1" width="3" height="9" fill={pal.skinOrBone} />
              <rect x="39" y="1" width="3" height="3" fill="#FFF3C4" />
              <rect x="23" y="4" width="10" height="5" fill={pal.secondary} />
              <rect x="26" y="2" width="4" height="3" fill="#FFF3C4" />
              <rect x="19" y="8" width="18" height="11" fill="#120B05" />
              <rect x="20" y="9" width="16" height="9" fill={pal.primaryDark} />
              {!pose.eyeBlink && (
                <g>
                  <rect x={21 + pose.eyeShiftX} y="11" width="5" height="5" fill={pal.eyeGlow} />
                  <rect x={22 + pose.eyeShiftX} y="11" width="2" height="2" fill="#FFFFFF" />
                  <rect x={30 + pose.eyeShiftX} y="11" width="5" height="5" fill={pal.eyeGlow} />
                  <rect x={31 + pose.eyeShiftX} y="11" width="2" height="2" fill="#FFFFFF" />
                </g>
              )}
              <rect x="24" y={17 + pose.jawOpen} width="8" height="3" fill={pal.secondary} />
            </g>

            {/* Royal Amber Honeycomb Staff + Dripping Nectar Cenote */}
            <g transform={`translate(${pose.torsoX + pose.weaponX}, ${pose.torsoY + pose.weaponY})`}>
              <rect x="10" y="8" width="3" height="46" fill="#120B05" />
              <rect x="11" y="9" width="1" height="44" fill={pal.metalLight} />
              <rect x="6" y="4" width="11" height="10" fill="#120B05" />
              <rect x="7" y="5" width="9" height="8" fill={pal.secondary} />
              <rect x="9" y="6" width="5" height="5" fill="#FFF3C4" />
            </g>
          </g>
        );
      }

      // SILHOUETTE C: WINGED MANTIS / WASP ASSASSIN (Vibrating veined wings, curled venom stinger abdomen, 4 mantis legs & dual scythe forelimbs)
      return (
        <g>
          {/* Vibrating Veined Translucent Amber Insect Wings */}
          <g
            transform={`translate(${pose.torsoX}, ${
              pose.torsoY - (pose.secondaryPhase % 2)
            })`}
          >
            <rect x="7" y="9" width="15" height="24" fill="#120B05" opacity="0.5" />
            <rect x="8" y="10" width="13" height="22" fill={pal.skinOrBone} opacity="0.65" />
            <rect x="10" y="12" width="2" height="16" fill={pal.secondaryDark} opacity="0.7" />
            <rect x="14" y="11" width="6" height="4" fill="#FFFFFF" opacity="0.45" />

            <rect x="41" y="9" width="15" height="24" fill="#120B05" opacity="0.5" />
            <rect x="42" y="10" width="13" height="22" fill={pal.skinOrBone} opacity="0.65" />
            <rect x="50" y="12" width="2" height="16" fill={pal.secondaryDark} opacity="0.7" />
            <rect x="43" y="11" width="6" height="4" fill="#FFFFFF" opacity="0.45" />
          </g>

          {/* Segmented Wasp Abdomen & Dripping Venom Stinger */}
          <g transform={`translate(${pose.torsoX + pose.propX}, ${pose.torsoY})`}>
            <rect x="33" y="31" width="19" height="16" fill="#120B05" />
            <rect x="34" y="32" width="17" height="14" fill={pal.primary} />
            <rect x="35" y="34" width="15" height="3" fill={pal.secondary} />
            <rect x="36" y="34" width="8" height="1" fill="#FFF3C4" />
            <rect x="35" y="39" width="15" height="3" fill={pal.secondary} />
            <rect x="35" y="44" width="13" height="2" fill={pal.secondaryDark} />
            {/* Needle Stinger & Venom Droplet */}
            <rect x="49" y="44" width="6" height="4" fill="#120B05" />
            <rect x="50" y="45" width="4" height="2" fill={pal.eyeGlow} />
            <rect x="53" y={47 + (pose.breathPhase % 2)} width="2" height="2" fill="#86EFAC" />
          </g>

          {/* Segmented Chitin Thorax & 4 Articulated Insect Legs */}
          <g transform={`translate(${pose.torsoX}, ${pose.torsoY})`}>
            <rect x="16" y="41" width="5" height="15" fill="#120B05" />
            <rect x="17" y="42" width="3" height="13" fill={pal.primaryDark} />
            <rect x="14" y="54" width="6" height="2" fill={pal.secondary} />

            <rect x="24" y="42" width="4" height="14" fill="#120B05" />
            <rect x="25" y="43" width="2" height="12" fill={pal.primary} />

            <rect x="33" y="42" width="5" height="14" fill="#120B05" />
            <rect x="34" y="43" width="3" height="12" fill={pal.primaryDark} />
            <rect x="33" y="54" width="6" height="2" fill={pal.secondary} />

            <rect x="20" y="20" width="20" height="22" fill="#120B05" />
            <rect x="21" y="21" width="18" height="20" fill={pal.primary} />
            <rect x="23" y="22" width="14" height="16" fill={pal.primaryLight} />
            <rect x="22" y="26" width="16" height="2" fill={pal.secondary} />
            <rect x="23" y="31" width="14" height="2" fill={pal.secondary} />
          </g>

          {/* Triangular Mantis Head, Bulging Compound Eyes, Antennae & Mandibles */}
          <g
            transform={`translate(${pose.torsoX + pose.headX}, ${
              pose.torsoY + pose.headY
            })`}
          >
            <rect x="18" y="2" width="2" height="9" fill={pal.secondary} />
            <rect x="16" y="1" width="3" height="2" fill="#FFF3C4" />
            <rect x="38" y="2" width="2" height="9" fill={pal.secondary} />
            <rect x="39" y="1" width="3" height="2" fill="#FFF3C4" />

            <rect x="19" y="9" width="20" height="12" fill="#120B05" />
            <rect x="20" y="10" width="18" height="10" fill={pal.primaryDark} />
            <rect x="23" y="11" width="12" height="7" fill={pal.primaryLight} />
            {!pose.eyeBlink && (
              <g>
                <rect x={20 + pose.eyeShiftX} y="11" width="6" height="6" fill={pal.eyeGlow} />
                <rect x={21 + pose.eyeShiftX} y="12" width="2" height="2" fill="#FFF3C4" />
                <rect x={32 + pose.eyeShiftX} y="11" width="6" height="6" fill={pal.eyeGlow} />
                <rect x={33 + pose.eyeShiftX} y="12" width="2" height="2" fill="#FFF3C4" />
              </g>
            )}
            <g transform={`translate(0, ${pose.jawOpen})`}>
              <rect x="22" y="18" width="4" height="5" fill={pal.secondary} />
              <rect x="32" y="18" width="4" height="5" fill={pal.secondary} />
              <rect x="25" y="20" width="2" height="2" fill="#FFF3C4" />
              <rect x="31" y="20" width="2" height="2" fill="#FFF3C4" />
            </g>
          </g>

          {/* Dual Serrated Mantis Scythe Forelimbs */}
          <g
            transform={`translate(${pose.torsoX + pose.weaponX}, ${
              pose.torsoY + pose.weaponY
            })`}
          >
            <rect x="6" y="16" width="16" height="5" fill="#120B05" />
            <rect x="7" y="17" width="14" height="3" fill={pal.metalLight} />
            <rect x="4" y="20" width="6" height="18" fill="#120B05" />
            <rect x="5" y="21" width="4" height="16" fill={pal.secondary} />
            <rect x="8" y="23" width="2" height="12" fill="#FFF3C4" />
            <rect x="10" y="25" width="2" height="2" fill="#FFFFFF" />
            <rect x="10" y="30" width="2" height="2" fill="#FFFFFF" />
          </g>
        </g>
      );
    }

    // ========================================================================
    // CRIPTA DE CRISTAL: CENTINELA DE PRISMA (Faceted Refractive Golem)
    // ========================================================================
    case 'CRYSTAL_PRISM_GOLEM': {
      return (
        <g>
          {/* Faceted Crystal Pillar Legs */}
          <g transform={`translate(0, ${pose.isDeadCollapsed ? 7 : 0})`}>
            <rect x="19" y="42" width="8" height="14" fill="#0A1218" />
            <rect x="20" y="43" width="6" height="12" fill={pal.primaryDark} />
            <rect x="21" y="44" width="3" height="10" fill={pal.metal} />
            <rect x="35" y="42" width="8" height="14" fill="#0A1218" />
            <rect x="36" y="43" width="6" height="12" fill={pal.primaryDark} />
            <rect x="37" y="44" width="3" height="10" fill={pal.metal} />
          </g>
          {/* Faceted Geode Torso & Blinding Diamond Core */}
          <g transform={`translate(${pose.torsoX}, ${pose.torsoY})`}>
            <rect x="15" y="17" width="34" height="27" fill="#0A1218" />
            <rect x="16" y="18" width="32" height="25" fill={pal.primary} />
            <rect x="19" y="20" width="26" height="21" fill={pal.metal} />
            <rect x="21" y="21" width="10" height="6" fill={pal.metalLight} />
            <rect x="24" y="23" width="16" height="15" fill={pal.secondaryDark} />
            <rect x="26" y="25" width="12" height="11" fill={pal.secondary} />
            <rect x="28" y="27" width="8" height="7" fill={pal.eyeGlow} />
            <rect x="30" y="29" width="4" height="3" fill="#FFFFFF" />
            {/* Sharp Crystal Shoulder Spires */}
            <rect x="10" y="8" width="8" height="16" fill="#0A1218" />
            <rect x="11" y="9" width="6" height="14" fill={pal.metalLight} />
            <rect x="12" y="10" width="2" height="10" fill="#FFFFFF" />
            <rect x="46" y="8" width="8" height="16" fill="#0A1218" />
            <rect x="47" y="9" width="6" height="14" fill={pal.metalLight} />
            <rect x="48" y="10" width="2" height="10" fill="#FFFFFF" />
          </g>
          {/* Angular Monolith Crystal Head */}
          <g
            transform={`translate(${pose.torsoX + pose.headX}, ${
              pose.torsoY + pose.headY
            })`}
          >
            <rect x="23" y="5" width="18" height="14" fill="#0A1218" />
            <rect x="24" y="6" width="16" height="12" fill={pal.metalLight} />
            <rect x="26" y="8" width="12" height="8" fill={pal.primaryDark} />
            <rect
              x={28 + pose.eyeShiftX}
              y="10"
              width="8"
              height="4"
              fill={pal.eyeGlow}
            />
            <rect
              x={30 + pose.eyeShiftX}
              y="11"
              width="4"
              height="2"
              fill="#FFFFFF"
            />
          </g>
          {/* Floating Orbiting Prism Greatblade */}
          <g
            transform={`translate(${pose.torsoX + pose.weaponX}, ${
              pose.torsoY + pose.weaponY
            })`}
          >
            <rect x="5" y="11" width="7" height="32" fill="#0A1218" />
            <rect x="6" y="12" width="5" height="30" fill={pal.metalLight} />
            <rect x="7" y="14" width="3" height="26" fill={pal.secondary} />
            <rect x="7" y="15" width="1" height="20" fill="#FFFFFF" />
          </g>
        </g>
      );
    }

    // ========================================================================
    // PRISIÓN MALDITA: ESPECTRO ENCADENADO (Iron-Caged Floating Wraith)
    // ========================================================================
    case 'PRISON_SHACKLED_WRAITH': {
      const isPrisonBrute = def.subVariant === 'GUARDIAN';
      const isPrisonStalker = def.subVariant === 'STALKER_BEAST';

      if (isPrisonBrute) {
        // SILHOUETTE A: SHACKLED PRISON BRUTE (Ragged striped convict tunic, iron collar, wrist manacles, ankle iron ball & spiked flail)
        return (
          <g>
            {/* Bare Scarred Feet & Heavy Iron Ankle Ball-and-Chain */}
            <g transform={`translate(0, ${pose.isDeadCollapsed ? 7 : 0})`}>
              <rect x="20" y="42" width="7" height="14" fill="#110E1A" />
              <rect x="21" y="43" width="5" height="10" fill={pal.primaryDark} />
              <rect x="20" y="53" width="7" height="3" fill={pal.skinShadow} />
              <rect x="34" y="42" width="7" height="14" fill="#110E1A" />
              <rect x="35" y="43" width="5" height="10" fill={pal.primaryDark} />
              <rect x="34" y="53" width="7" height="3" fill={pal.skinShadow} />
              {/* Ankle Shackle & Heavy Iron Ball on Floor */}
              <rect x="34" y="50" width="7" height="3" fill={pal.metalLight} />
              <rect x="41" y="52" width="5" height="2" fill={pal.metal} />
              <rect x="45" y="48" width="9" height="9" fill="#110E1A" />
              <rect x="46" y="49" width="7" height="7" fill={pal.metalDark} />
              <rect x="47" y="50" width="4" height="4" fill={pal.metal} />
              <rect x="48" y="50" width="2" height="2" fill={pal.metalLight} />
            </g>

            {/* Muscular Hunched Torso in Torn Striped Convict Tunic & Heavy Iron Chains */}
            <g transform={`translate(${pose.torsoX}, ${pose.torsoY})`}>
              <rect x="17" y="19" width="28" height="25" fill="#110E1A" />
              <rect x="18" y="20" width="26" height="23" fill={pal.primary} />
              {/* Torn Convict Stripes & Exposed Scarred Chest */}
              <rect x="19" y="22" width="24" height="3" fill={pal.skinShadow} />
              <rect x="19" y="28" width="24" height="3" fill={pal.skinShadow} />
              <rect x="19" y="34" width="24" height="3" fill={pal.skinShadow} />
              <rect x="24" y="21" width="12" height="13" fill={pal.skinOrBone} />
              <rect x="26" y="24" width="7" height="2" fill={pal.secondaryDark} />
              {/* Heavy Riveted Iron Neck Collar & Padlocked Chest Chains */}
              <rect x="20" y="18" width="22" height="4" fill={pal.metalDark} />
              <rect x="22" y="19" width="18" height="2" fill={pal.metalLight} />
              <rect x="16" y="25" width="30" height="3" fill={pal.metal} />
              <rect x="28" y="26" width="6" height="7" fill={pal.accent} />
              <rect x="30" y="28" width="2" height="3" fill="#110E1A" />
            </g>

            {/* Left Arm with Iron Wrist Manacle & Trailing Broken Chain */}
            <g transform={`translate(${pose.torsoX + pose.propX}, ${pose.torsoY + pose.propY})`}>
              <rect x="41" y="22" width="6" height="13" fill={pal.skinShadow} />
              <rect x="40" y="31" width="8" height="4" fill={pal.metalLight} />
              <rect x="43" y="35" width="2" height="11" fill={pal.metal} />
              <rect x="42" y="44" width="4" height="4" fill={pal.metalLight} />
            </g>

            {/* Scarred Convict Head with Torn Iron Half-Mask & Glowing Eyes */}
            <g transform={`translate(${pose.torsoX + pose.headX}, ${pose.torsoY + pose.headY})`}>
              <rect x="22" y="6" width="18" height="13" fill="#110E1A" />
              <rect x="23" y="7" width="16" height="11" fill={pal.skinShadow} />
              <rect x="24" y="8" width="14" height="9" fill={pal.skinOrBone} />
              {/* Riveted Iron Jaw-Muzzle */}
              <rect x="23" y="13" width="16" height="5" fill={pal.metalDark} />
              <rect x="25" y="14" width="2" height="3" fill={pal.metalLight} />
              <rect x="30" y="14" width="2" height="3" fill={pal.metalLight} />
              <rect x="35" y="14" width="2" height="3" fill={pal.metalLight} />
              {!pose.eyeBlink && (
                <g>
                  <rect x={26 + pose.eyeShiftX} y="10" width="3" height="2" fill="#110E1A" />
                  <rect x={27 + pose.eyeShiftX} y="10" width="2" height="2" fill={pal.eyeGlow} />
                  <rect x={33 + pose.eyeShiftX} y="10" width="3" height="2" fill="#110E1A" />
                  <rect x={34 + pose.eyeShiftX} y="10" width="2" height="2" fill={pal.eyeGlow} />
                </g>
              )}
            </g>

            {/* Right Arm + Jagged Uprooted Cell Bar Club */}
            <g transform={`translate(${pose.torsoX + pose.weaponX}, ${pose.torsoY + pose.weaponY})`}>
              <rect x="13" y="22" width="6" height="12" fill={pal.skinShadow} />
              <rect x="12" y="30" width="8" height="4" fill={pal.metalLight} />
              <rect x="8" y="8" width="5" height="38" fill="#110E1A" />
              <rect x="9" y="9" width="3" height="36" fill={pal.metal} />
              <rect x="9" y="9" width="1" height="34" fill={pal.metalLight} />
              {/* Concrete/Stone Block Still Attached to Top of Cell Bar */}
              <rect x="4" y="7" width="13" height="9" fill={pal.primaryDark} />
              <rect x="5" y="8" width="11" height="7" fill={pal.metalDark} />
              <rect x="6" y="9" width="5" height="3" fill={pal.metalLight} />
            </g>
          </g>
        );
      }

      if (isPrisonStalker) {
        // SILHOUETTE C: FERAL CELL STALKER (Low crouched inmate, bandages, trailing wrist chains & dual shivs)
        return (
          <g>
            <g transform={`translate(0, ${pose.isDeadCollapsed ? 7 : 0})`}>
              <rect x="18" y="43" width="6" height="13" fill="#110E1A" />
              <rect x="19" y="44" width="4" height="11" fill={pal.skinShadow} />
              <rect x="37" y="43" width="6" height="13" fill="#110E1A" />
              <rect x="38" y="44" width="4" height="11" fill={pal.skinShadow} />
            </g>
            <g transform={`translate(${pose.torsoX}, ${pose.torsoY})`}>
              <rect x="19" y="23" width="24" height="21" fill="#110E1A" />
              <rect x="20" y="24" width="22" height="19" fill={pal.primary} />
              <rect x="22" y="25" width="18" height="14" fill={pal.skinShadow} />
              <rect x="21" y="27" width="20" height="3" fill={pal.skinOrBone} />
              <rect x="21" y="32" width="20" height="3" fill={pal.skinOrBone} />
              <rect x="22" y="22" width="18" height="3" fill={pal.metalLight} />
            </g>
            <g transform={`translate(${pose.torsoX + pose.headX}, ${pose.torsoY + pose.headY})`}>
              <rect x="21" y="9" width="19" height="13" fill={pal.primaryDark} />
              <rect x="23" y="11" width="15" height="10" fill={pal.skinShadow} />
              <rect x="23" y="12" width="15" height="3" fill={pal.skinOrBone} />
              {!pose.eyeBlink && (
                <g fill={pal.eyeGlow}>
                  <rect x={25 + pose.eyeShiftX} y="15" width="3" height="2" />
                  <rect x={33 + pose.eyeShiftX} y="15" width="3" height="2" />
                </g>
              )}
            </g>
            <g transform={`translate(${pose.torsoX + pose.weaponX}, ${pose.torsoY + pose.weaponY})`}>
              <rect x="7" y="20" width="3" height="15" fill={pal.metalLight} />
              <rect x="8" y="21" width="1" height="12" fill="#FFFFFF" />
              <rect x="6" y="33" width="5" height="4" fill={pal.primaryDark} />
              <rect x="11" y="35" width="2" height="10" fill={pal.metal} />
            </g>
          </g>
        );
      }

      // SILHOUETTE B: FLOATING SHACKLED WRAITH / SOUL TORTURER (Hooded spectral torso, glowing rune-chains, skull visage & swinging soul-cage lantern)
      return (
        <g transform={`translate(${pose.torsoX}, ${pose.torsoY - pose.breathPhase})`}>
          {/* Trailing Spectral Ectoplasm Tail */}
          <rect x="23" y="39" width="16" height="10" fill={pal.primaryDark} />
          <rect x="25" y="40" width="12" height="8" fill={pal.primary} />
          <rect
            x={26 + (pose.secondaryPhase % 2)}
            y="48"
            width="9"
            height="7"
            fill={pal.secondaryDark}
          />
          <rect
            x={28 + (pose.secondaryPhase % 2)}
            y="53"
            width="5"
            height="4"
            fill={pal.secondary}
          />
          {/* Tattered Hooded Shroud & Heavy Padlocked Rune-Chains */}
          <rect x="17" y="19" width="28" height="22" fill="#110E1A" />
          <rect x="18" y="20" width="26" height="20" fill={pal.primaryLight} />
          <rect x="21" y="22" width="20" height="16" fill={pal.primary} />
          <rect x="15" y="24" width="32" height="3" fill={pal.metalLight} />
          <rect x="17" y="30" width="28" height="2" fill={pal.metal} />
          <rect x="28" y="25" width="6" height="8" fill={pal.accent} />
          <rect x="30" y="27" width="2" height="4" fill={pal.eyeGlow} />

          {/* Left Hand Holding Swinging Soul-Cage Lantern */}
          <g transform={`translate(${pose.propX}, ${pose.propY})`}>
            <rect x="44" y="24" width="4" height="3" fill={pal.skinOrBone} />
            <rect x="45" y="27" width="2" height="8" fill={pal.metalLight} />
            <rect x="41" y="35" width="10" height="12" fill="#110E1A" />
            <rect x="42" y="36" width="8" height="10" fill={pal.metalDark} />
            <rect x="44" y="38" width="4" height="6" fill={pal.eyeGlow} />
            <rect x="45" y="39" width="2" height="4" fill="#FFFFFF" />
          </g>

          {/* Hooded Spectral Skull Visage with Iron Crown-Collar */}
          <g transform={`translate(${pose.headX}, ${pose.headY})`}>
            <rect x="20" y="5" width="22" height="15" fill="#110E1A" />
            <rect x="21" y="6" width="20" height="13" fill={pal.primaryDark} />
            <rect x="24" y="8" width="14" height="10" fill={pal.skinShadow} />
            <rect x="25" y="9" width="12" height="7" fill={pal.skinOrBone} />
            <rect x="22" y="7" width="18" height="3" fill={pal.metalLight} />
            {!pose.eyeBlink && (
              <g>
                <rect x={26 + pose.eyeShiftX} y="11" width="3" height="3" fill="#110E1A" />
                <rect x={27 + pose.eyeShiftX} y="11" width="2" height="2" fill={pal.eyeGlow} />
                <rect x={33 + pose.eyeShiftX} y="11" width="3" height="3" fill="#110E1A" />
                <rect x={34 + pose.eyeShiftX} y="11" width="2" height="2" fill={pal.eyeGlow} />
              </g>
            )}
            <rect x="27" y="15" width="8" height="2" fill="#110E1A" />
          </g>

          {/* Right Hand Swinging Spiked Iron Ball-and-Chain */}
          <g transform={`translate(${pose.weaponX}, ${pose.weaponY})`}>
            <rect x="9" y="20" width="3" height="18" fill={pal.metalLight} />
            <rect x="4" y="37" width="13" height="13" fill="#110E1A" />
            <rect x="5" y="38" width="11" height="11" fill={pal.metalDark} />
            <rect x="7" y="40" width="7" height="7" fill={pal.metal} />
            <rect x="8" y="41" width="3" height="3" fill={pal.metalLight} />
          </g>
        </g>
      );
    }

    // ========================================================================
    // SANTUARIO DE SANGRE: SACERDOTE CARMESÍ (Weeping Gold Mask & Blood Chalice)
    // ========================================================================
    case 'BLOOD_MASKED_PRIEST': {
      return (
        <g>
          {/* Crimson Liturgical Vestments */}
          <g transform={`translate(${pose.torsoX}, ${pose.torsoY})`}>
            <rect x="17" y="18" width="28" height="38" fill="#140408" />
            <rect x="18" y="19" width="26" height="37" fill={pal.primary} />
            <rect x="21" y="21" width="20" height="34" fill={pal.secondaryDark} />
            <rect x="23" y="22" width="16" height="32" fill={pal.secondary} />
            <rect x="28" y="21" width="6" height="34" fill={pal.metal} />
            <rect x="29" y="21" width="2" height="34" fill={pal.metalLight} />
            <rect x="15" y="18" width="8" height="6" fill={pal.metalLight} />
            <rect x="39" y="18" width="8" height="6" fill={pal.metalLight} />
          </g>
          {/* Left Hand Holding Overflowing Crimson Chalice */}
          <g
            transform={`translate(${pose.torsoX + pose.propX}, ${
              pose.torsoY + pose.propY
            })`}
          >
            <rect x="41" y="23" width="10" height="7" fill="#140408" />
            <rect x="42" y="24" width="8" height="5" fill={pal.metalLight} />
            <rect x="45" y="29" width="2" height="7" fill={pal.metal} />
            <rect x="43" y="35" width="6" height="2" fill={pal.metalLight} />
            <rect x="43" y="22" width="6" height="3" fill={pal.secondary} />
            <rect
              x="44"
              y={18 - (pose.breathPhase % 2)}
              width="3"
              height="3"
              fill={pal.eyeGlow}
            />
          </g>
          {/* Ornate Weeping Golden Mask & Pointed Mitre */}
          <g
            transform={`translate(${pose.torsoX + pose.headX}, ${
              pose.torsoY + pose.headY
            })`}
          >
            <rect x="23" y="2" width="16" height="8" fill="#140408" />
            <rect x="24" y="3" width="14" height="7" fill={pal.secondary} />
            <rect x="30" y="3" width="2" height="6" fill={pal.metalLight} />
            <rect x="22" y="9" width="18" height="12" fill="#140408" />
            <rect x="23" y="9" width="16" height="11" fill={pal.metalLight} />
            <rect x="24" y="10" width="10" height="3" fill="#FFF8EC" />
            <rect x="26" y="12" width="3" height="2" fill="#14060A" />
            <rect x="33" y="12" width="3" height="2" fill="#14060A" />
            <rect x="27" y="14" width="2" height="5" fill={pal.secondary} />
            <rect x="34" y="14" width="2" height="5" fill={pal.secondary} />
          </g>
          {/* Serrated Ritual Flamberge */}
          <g
            transform={`translate(${pose.torsoX + pose.weaponX}, ${
              pose.torsoY + pose.weaponY
            })`}
          >
            <rect x="9" y="6" width="6" height="28" fill="#140408" />
            <rect x="10" y="7" width="4" height="26" fill={pal.secondary} />
            <rect x="11" y="7" width="2" height="24" fill={pal.metalLight} />
            <rect x="6" y="32" width="12" height="3" fill={pal.metalLight} />
            <rect x="11" y="35" width="2" height="6" fill={pal.primaryDark} />
          </g>
        </g>
      );
    }

    // ========================================================================
    // CIUDAD SEPULTADA: GUARDIÁN DE LAS ARENAS (Pharaoh Mummy & Khopesh)
    // ========================================================================
    case 'BURIED_SAND_MUMMY': {
      return (
        <g>
          {/* Bandaged Legs */}
          <g transform={`translate(0, ${pose.isDeadCollapsed ? 7 : 0})`}>
            <rect x="21" y="42" width="8" height="14" fill="#171108" />
            <rect x="22" y="43" width="6" height="12" fill={pal.skinShadow} />
            <rect x="22" y="46" width="6" height="2" fill={pal.skinOrBone} />
            <rect x="33" y="42" width="8" height="14" fill="#171108" />
            <rect x="34" y="43" width="6" height="12" fill={pal.skinShadow} />
            <rect x="34" y="46" width="6" height="2" fill={pal.skinOrBone} />
          </g>
          {/* Linen-Wrapped Torso & Turquoise-Gold Scarab Collar */}
          <g transform={`translate(${pose.torsoX}, ${pose.torsoY})`}>
            <rect x="18" y="19" width="26" height="26" fill="#171108" />
            <rect x="19" y="20" width="24" height="24" fill={pal.skinOrBone} />
            <rect x="19" y="25" width="24" height="2" fill={pal.skinShadow} />
            <rect x="19" y="30" width="24" height="2" fill={pal.skinShadow} />
            <rect x="19" y="35" width="24" height="2" fill={pal.skinShadow} />
            <rect x="16" y="18" width="30" height="7" fill={pal.metalLight} />
            <rect x="19" y="19" width="24" height="5" fill={pal.secondary} />
            <rect x="28" y="20" width="6" height="4" fill={pal.metalLight} />
          </g>
          {/* Golden Nemes Headdress & Jackal Mask */}
          <g
            transform={`translate(${pose.torsoX + pose.headX}, ${
              pose.torsoY + pose.headY
            })`}
          >
            <rect x="19" y="5" width="24" height="16" fill="#171108" />
            <rect x="20" y="6" width="22" height="14" fill={pal.metalLight} />
            <rect x="20" y="9" width="22" height="2" fill={pal.secondary} />
            <rect x="20" y="13" width="22" height="2" fill={pal.secondary} />
            <rect x="23" y="8" width="16" height="11" fill={pal.primaryDark} />
            {!pose.eyeBlink && (
              <g fill={pal.eyeGlow}>
                <rect x={25 + pose.eyeShiftX} y="12" width="3" height="2" />
                <rect x={34 + pose.eyeShiftX} y="12" width="3" height="2" />
              </g>
            )}
          </g>
          {/* Bronze Curved Khopesh Sickle-Sword */}
          <g
            transform={`translate(${pose.torsoX + pose.weaponX}, ${
              pose.torsoY + pose.weaponY
            })`}
          >
            <rect x="10" y="20" width="4" height="18" fill={pal.metal} />
            <rect x="5" y="9" width="10" height="13" fill="#171108" />
            <rect x="6" y="10" width="8" height="11" fill={pal.metalLight} />
            <rect x="9" y="13" width="5" height="6" fill="#09070D" />
          </g>
        </g>
      );
    }

    // ========================================================================
    // PALACIO DE LOS ESPEJOS: DUELISTA DE AZOGUE (Silver Mirror Fencer)
    // ========================================================================
    case 'MIRROR_SILVER_DUELIST': {
      return (
        <g>
          {/* Out-of-Sync Silver Mirror Phantom Behind Duelist */}
          <g
            transform={`translate(${pose.torsoX + 6 - pose.secondaryPhase}, ${
              pose.torsoY - 2
            })`}
            opacity="0.38"
          >
            <rect x="20" y="10" width="20" height="42" fill={pal.metalLight} />
          </g>
          {/* Aristocratic Fencer Coat & Boots */}
          <g transform={`translate(${pose.torsoX}, ${pose.torsoY})`}>
            <rect x="19" y="19" width="24" height="37" fill="#0D101C" />
            <rect x="20" y="20" width="22" height="35" fill={pal.primary} />
            <rect x="23" y="22" width="16" height="22" fill={pal.metal} />
            <rect x="28" y="22" width="6" height="22" fill={pal.secondary} />
            <rect x="29" y="22" width="2" height="22" fill={pal.metalLight} />
          </g>
          {/* Smooth Silver Mirror Mask */}
          <g
            transform={`translate(${pose.torsoX + pose.headX}, ${
              pose.torsoY + pose.headY
            })`}
          >
            <rect x="23" y="6" width="16" height="15" fill="#0D101C" />
            <rect x="24" y="7" width="14" height="13" fill={pal.metalLight} />
            <rect x="25" y="8" width="5" height="10" fill="#FFFFFF" />
            <rect x="29" y="8" width="2" height="11" fill={pal.secondary} />
            <rect
              x={26 + pose.eyeShiftX}
              y="12"
              width="10"
              height="2"
              fill={pal.eyeGlow}
            />
          </g>
          {/* Needle-Thin Silver Mercury Rapier */}
          <g
            transform={`translate(${pose.torsoX + pose.weaponX}, ${
              pose.torsoY + pose.weaponY
            })`}
          >
            <rect x="9" y="3" width="2" height="31" fill={pal.metalLight} />
            <rect x="9" y="4" width="1" height="26" fill="#FFFFFF" />
            <rect x="5" y="32" width="10" height="4" fill={pal.accent} />
            <rect x="9" y="36" width="2" height="6" fill={pal.primaryDark} />
          </g>
        </g>
      );
    }

    // ========================================================================
    // CAVERNAS HELADAS: LOBO DE ESCARCHA (TRUE PREDATORY DIRE-WOLF) & GUERRERO CONGELADO
    // ========================================================================
    case 'ICE_FROST_WOLF':
    case 'ICE_FROZEN_WARRIOR': {
      const isWolf =
        family === 'ICE_FROST_WOLF' || def.subVariant === 'STALKER_BEAST';
      if (isWolf) {
        return (
          <g>
            {/* Bushy Wolf Tail & Muscular Hind Legs with Claws */}
            <g transform={`translate(${pose.torsoX}, ${pose.torsoY})`}>
              {/* Thick Bushy Frost-Tipped Wolf Tail */}
              <rect
                x={46 + pose.propX}
                y={24 + pose.propY}
                width="12"
                height="7"
                fill="#0D1821"
              />
              <rect
                x={47 + pose.propX}
                y={25 + pose.propY}
                width="10"
                height="5"
                fill={pal.primaryLight}
              />
              <rect
                x={52 + pose.propX}
                y={25 + pose.propY}
                width="5"
                height="3"
                fill={pal.skinOrBone}
              />
              {/* Far Hind Leg */}
              <rect x="38" y="39" width="6" height="17" fill="#0D1821" />
              <rect x="39" y="40" width="4" height="14" fill={pal.primaryDark} />
              <rect x="36" y="54" width="6" height="3" fill={pal.skinShadow} />
              {/* Near Muscular Hind Leg */}
              <rect x="43" y="35" width="8" height="14" fill="#0D1821" />
              <rect x="44" y="36" width="6" height="12" fill={pal.primary} />
              <rect x="45" y="46" width="5" height="10" fill={pal.primaryLight} />
              <rect x="42" y="54" width="7" height="3" fill={pal.skinOrBone} />
            </g>

            {/* Muscular Dire-Wolf Chest, Layered Fur Ruff & Ice-Crystal Spine */}
            <g transform={`translate(${pose.torsoX}, ${pose.torsoY})`}>
              <rect x="17" y="25" width="31" height="17" fill="#0D1821" />
              <rect x="18" y="26" width="29" height="15" fill={pal.primaryDark} />
              <rect x="19" y="27" width="26" height="12" fill={pal.primary} />
              <rect x="20" y="27" width="16" height="9" fill={pal.primaryLight} />
              {/* Thick White/Silver Chest Fur Mane */}
              <rect x="15" y="24" width="12" height="14" fill={pal.skinShadow} />
              <rect x="16" y="25" width="10" height="11" fill={pal.skinOrBone} />
              <rect x="17" y="26" width="6" height="6" fill="#FFFFFF" />
              {/* Jagged Glacial Ice Spires Along Spine */}
              <rect x="25" y="19" width="4" height="7" fill={pal.metal} />
              <rect x="26" y="20" width="2" height="5" fill="#FFFFFF" />
              <rect x="32" y="17" width="5" height="9" fill={pal.metalLight} />
              <rect x="33" y="18" width="2" height="7" fill="#FFFFFF" />
              <rect x="39" y="20" width="4" height="6" fill={pal.metal} />
            </g>

            {/* Front Lupine Forelegs & Ice-Clawed Paws */}
            <g transform={`translate(${pose.weaponX * 0.4}, ${pose.isDeadCollapsed ? 7 : 0})`}>
              <rect x="18" y="39" width="6" height="17" fill="#0D1821" />
              <rect x="19" y="40" width="4" height="14" fill={pal.primaryDark} />
              <rect x="16" y="54" width="6" height="3" fill={pal.skinShadow} />

              <rect x="24" y="38" width="7" height="18" fill="#0D1821" />
              <rect x="25" y="39" width="5" height="15" fill={pal.primary} />
              <rect x="26" y="40" width="3" height="12" fill={pal.skinOrBone} />
              <rect x="22" y="54" width="8" height="3" fill={pal.skinOrBone} />
              <rect x="21" y="55" width="2" height="2" fill="#FFFFFF" />
            </g>

            {/* Predatory Lupine Head, Pointed Wolf Ears, Snarling Muzzle & White Fangs */}
            <g
              transform={`translate(${pose.torsoX + pose.headX}, ${
                pose.torsoY + pose.headY
              })`}
            >
              {/* Pointed Lupine Ears */}
              <rect x="15" y="13" width="5" height="7" fill="#0D1821" />
              <rect x="16" y="14" width="3" height="5" fill={pal.primaryLight} />
              <rect x="20" y="14" width="4" height="6" fill="#0D1821" />
              <rect x="21" y="15" width="2" height="4" fill={pal.skinOrBone} />
              {/* Wolf Cranium & Tapered Lupine Snout */}
              <rect x="6" y="19" width="18" height="9" fill="#0D1821" />
              <rect x="7" y="20" width="16" height="7" fill={pal.primary} />
              <rect x="11" y="20" width="11" height="4" fill={pal.primaryLight} />
              <rect x="7" y="21" width="10" height="3" fill={pal.skinOrBone} />
              {/* Black Lupine Nose Tip */}
              <rect x="6" y="20" width="3" height="3" fill="#090C10" />
              {/* Glowing Ice-Blue Predator Eye */}
              {!pose.eyeBlink && (
                <g>
                  <rect x={13 + pose.eyeShiftX} y="21" width="4" height="2" fill="#090C10" />
                  <rect x={14 + pose.eyeShiftX} y="21" width="2" height="2" fill={pal.eyeGlow} />
                  <rect x={14 + pose.eyeShiftX} y="21" width="1" height="1" fill="#FFFFFF" />
                </g>
              )}
              {/* Sharp White Upper Canine Fangs */}
              <rect x="7" y="27" width="2" height="3" fill="#FFFFFF" />
              <rect x="10" y="27" width="1" height="2" fill="#FFFFFF" />
              <rect x="12" y="27" width="2" height="2" fill="#FFFFFF" />
              {/* Articulated Lower Wolf Jaw & Frost Breath */}
              <g transform={`translate(0, ${pose.jawOpen})`}>
                <rect x="8" y="29" width="13" height="4" fill="#0D1821" />
                <rect x="9" y="29" width="11" height="3" fill={pal.primaryDark} />
                <rect x="8" y="28" width="2" height="2" fill="#FFFFFF" />
                <rect x="11" y="28" width="2" height="2" fill="#FFFFFF" />
                <rect
                  x={2 - (pose.breathPhase % 2)}
                  y="27"
                  width="4"
                  height="3"
                  fill={pal.metalLight}
                  opacity="0.85"
                />
              </g>
            </g>
          </g>
        );
      }

      // FROZEN DRAUGR WARRIOR
      return (
        <g>
          <g transform={`translate(0, ${pose.isDeadCollapsed ? 7 : 0})`}>
            <rect x="19" y="42" width="8" height="14" fill="#0D1821" />
            <rect x="20" y="43" width="6" height="12" fill={pal.primaryDark} />
            <rect x="35" y="42" width="8" height="14" fill="#0D1821" />
            <rect x="36" y="43" width="6" height="12" fill={pal.primaryDark} />
          </g>
          <g transform={`translate(${pose.torsoX}, ${pose.torsoY})`}>
            <rect x="16" y="18" width="30" height="26" fill="#0D1821" />
            <rect x="17" y="19" width="28" height="24" fill={pal.primary} />
            <rect x="20" y="21" width="22" height="20" fill={pal.metal} />
            <rect x="23" y="23" width="16" height="14" fill={pal.primaryLight} />
            <rect x="13" y="15" width="9" height="9" fill={pal.skinShadow} />
            <rect x="14" y="16" width="7" height="6" fill={pal.skinOrBone} />
            <rect x="40" y="15" width="9" height="9" fill={pal.skinShadow} />
            <rect x="41" y="16" width="7" height="6" fill={pal.skinOrBone} />
          </g>
          <g
            transform={`translate(${pose.torsoX + pose.headX}, ${
              pose.torsoY + pose.headY
            })`}
          >
            <rect x="19" y="1" width="4" height="9" fill={pal.metalLight} />
            <rect x="39" y="1" width="4" height="9" fill={pal.metalLight} />
            <rect x="21" y="6" width="20" height="14" fill="#0D1821" />
            <rect x="22" y="7" width="18" height="12" fill={pal.metalDark} />
            <rect x="24" y="8" width="14" height="5" fill={pal.metal} />
            <rect x="25" y="12" width="12" height="3" fill="#090C10" />
            <rect x={26 + pose.eyeShiftX} y="12" width="3" height="2" fill={pal.eyeGlow} />
            <rect x={33 + pose.eyeShiftX} y="12" width="3" height="2" fill={pal.eyeGlow} />
          </g>
          <g
            transform={`translate(${pose.torsoX + pose.weaponX}, ${
              pose.torsoY + pose.weaponY
            })`}
          >
            <rect x="10" y="6" width="3" height="46" fill={pal.primaryDark} />
            <rect x="1" y="8" width="15" height="15" fill="#0D1821" />
            <rect x="2" y="9" width="13" height="13" fill={pal.metalLight} />
            <rect x="3" y="10" width="4" height="11" fill="#FFFFFF" />
          </g>
        </g>
      );
    }

    // ========================================================================
    // CEMENTERIO DE GIGANTES: ESQUELETO GIGANTE / COLOSO DEL OSARIO
    // Anatomically detailed giant skeleton with sculpted skull, eye sockets,
    // nasal cavity, articulated jaw & teeth, vertebrae, individual rib cage bars,
    // pelvis, femur/tibia leg bones, finger bones & colossal ossuary weapons.
    // ========================================================================
    default: {
      const isBoneShaman = def.subVariant === 'SHAMAN_CASTER';
      const isBoneStalker = def.subVariant === 'STALKER_BEAST';

      return (
        <g>
          {/* Colossal Articulated Femur, Knee-Joint & Tibia Leg Bones */}
          <g transform={`translate(0, ${pose.isDeadCollapsed ? 7 : 0})`}>
            {/* Left Giant Leg Bone */}
            <rect x="18" y="40" width="9" height="16" fill="#12100E" />
            <rect x="19" y="41" width="7" height="6" fill={pal.skinShadow} />
            <rect x="20" y="41" width="4" height="5" fill={pal.skinOrBone} />
            {/* Knee Joint Condyle */}
            <rect x="18" y="46" width="9" height="3" fill={pal.skinOrBone} />
            <rect x="20" y="47" width="5" height="1" fill="#FFF8EC" />
            {/* Tibia & Fibula */}
            <rect x="19" y="49" width="7" height="6" fill={pal.skinShadow} />
            <rect x="20" y="49" width="3" height="5" fill={pal.skinOrBone} />
            <rect x="16" y="54" width="11" height="3" fill={pal.skinOrBone} />

            {/* Right Giant Leg Bone */}
            <rect x="37" y="40" width="9" height="16" fill="#12100E" />
            <rect x="38" y="41" width="7" height="6" fill={pal.skinShadow} />
            <rect x="39" y="41" width="4" height="5" fill={pal.skinOrBone} />
            {/* Knee Joint Condyle */}
            <rect x="37" y="46" width="9" height="3" fill={pal.skinOrBone} />
            <rect x="39" y="47" width="5" height="1" fill="#FFF8EC" />
            {/* Tibia & Fibula */}
            <rect x="38" y="49" width="7" height="6" fill={pal.skinShadow} />
            <rect x="39" y="49" width="3" height="5" fill={pal.skinOrBone} />
            <rect x="37" y="54" width="11" height="3" fill={pal.skinOrBone} />
          </g>

          {/* Anatomically Sculpted Giant Ribcage, Spine, Pelvis & Gravestone Pauldrons */}
          <g transform={`translate(${pose.torsoX}, ${pose.torsoY})`}>
            {/* Deep Ribcage Cavity */}
            <rect x="16" y="18" width="32" height="23" fill="#12100E" />
            <rect x="19" y="20" width="26" height="18" fill="#080706" />
            {/* Central Vertebral Spine Column & Sternum */}
            <rect x="30" y="18" width="4" height="22" fill={pal.skinShadow} />
            <rect x="31" y="19" width="2" height="20" fill={pal.skinOrBone} />
            {/* Individual Curved Rib Bars (4 pairs with dark intercostal gaps) */}
            {[20, 24, 28, 32].map((ry, idx) => (
              <g key={ry}>
                <rect
                  x={18 + idx}
                  y={ry}
                  width={28 - idx * 2}
                  height="2"
                  fill={pal.skinShadow}
                />
                <rect
                  x={19 + idx}
                  y={ry}
                  width={26 - idx * 2}
                  height="1"
                  fill={idx < 2 ? '#FFF8EC' : pal.skinOrBone}
                />
              </g>
            ))}
            {/* Sculpted Pelvic Ilium Bone */}
            <rect x="20" y="36" width="24" height="5" fill="#12100E" />
            <rect x="21" y="37" width="22" height="3" fill={pal.skinOrBone} />
            <rect x="24" y="38" width="4" height="2" fill="#12100E" />
            <rect x="36" y="38" width="4" height="2" fill="#12100E" />

            {/* Chained Gravestone / Ossuary Shoulder Pauldrons */}
            <rect x="10" y="14" width="10" height="13" fill="#12100E" />
            <rect x="11" y="15" width="8" height="11" fill={pal.metalDark} />
            <rect x="12" y="16" width="6" height="9" fill={pal.metal} />
            <rect x="13" y="17" width="4" height="2" fill={pal.metalLight} />

            <rect x="44" y="14" width="10" height="13" fill="#12100E" />
            <rect x="45" y="15" width="8" height="11" fill={pal.metalDark} />
            <rect x="46" y="16" width="6" height="9" fill={pal.metal} />
            <rect x="47" y="17" width="4" height="2" fill={pal.metalLight} />
          </g>

          {/* Left Skeletal Humerus, Radius/Ulna & Bony Fingers / Off-Hand */}
          <g transform={`translate(${pose.torsoX + pose.propX}, ${pose.torsoY + pose.propY})`}>
            <rect x="45" y="25" width="4" height="11" fill={pal.skinShadow} />
            <rect x="46" y="26" width="2" height="9" fill={pal.skinOrBone} />
            {/* Articulated Finger Bones */}
            <rect x="44" y="36" width="6" height="4" fill={pal.skinOrBone} />
            <rect x="44" y="39" width="1" height="3" fill="#FFF8EC" />
            <rect x="46" y="39" width="1" height="3" fill="#FFF8EC" />
            <rect x="48" y="39" width="1" height="3" fill="#FFF8EC" />
          </g>

          {/* Colossal Sculpted Humanoid Skull, Cheekbones, Nasal Cavity, Teeth & Jaw */}
          <g
            transform={`translate(${pose.torsoX + pose.headX}, ${
              pose.torsoY + pose.headY
            })`}
          >
            {isBoneStalker && (
              <g>
                <rect x="15" y="2" width="5" height="8" fill={pal.skinShadow} />
                <rect x="44" y="2" width="5" height="8" fill={pal.skinShadow} />
              </g>
            )}
            {/* Cranium Dome & Temple Cracks */}
            <rect x="20" y="2" width="24" height="14" fill="#12100E" />
            <rect x="21" y="3" width="22" height="12" fill={pal.skinShadow} />
            <rect x="22" y="4" width="20" height="10" fill={pal.skinOrBone} />
            <rect x="24" y="4" width="14" height="4" fill="#FFF8EC" />
            {/* Cranial Fracture Line */}
            <rect x="35" y="4" width="1" height="4" fill="#12100E" />
            <rect x="36" y="7" width="2" height="1" fill="#12100E" />
            {/* Deep Recessed Eye Sockets */}
            <rect x="23" y="8" width="6" height="5" fill="#090807" />
            <rect x="35" y="8" width="6" height="5" fill="#090807" />
            {!pose.eyeBlink && (
              <g>
                <rect x={25 + pose.eyeShiftX} y="9" width="3" height="3" fill={pal.eyeGlow} />
                <rect x={26 + pose.eyeShiftX} y="9" width="1" height="1" fill="#FFFFFF" />
                <rect x={36 + pose.eyeShiftX} y="9" width="3" height="3" fill={pal.eyeGlow} />
                <rect x={37 + pose.eyeShiftX} y="9" width="1" height="1" fill="#FFFFFF" />
              </g>
            )}
            {/* Triangular Nasal Cavity & Zygomatic Cheekbones */}
            <rect x="31" y="11" width="2" height="3" fill="#090807" />
            <rect x="21" y="12" width="3" height="3" fill={pal.skinShadow} />
            <rect x="40" y="12" width="3" height="3" fill={pal.skinShadow} />
            {/* Upper Maxilla Teeth Row */}
            <rect x="25" y="15" width="2" height="2" fill="#FFF8EC" />
            <rect x="28" y="15" width="2" height="2" fill="#FFF8EC" />
            <rect x="31" y="15" width="2" height="2" fill="#FFF8EC" />
            <rect x="34" y="15" width="2" height="2" fill="#FFF8EC" />
            <rect x="37" y="15" width="2" height="2" fill="#FFF8EC" />
            {/* Articulated Lower Mandible Jaw & Teeth */}
            <g transform={`translate(0, ${pose.jawOpen})`}>
              <rect x="23" y="17" width="18" height="4" fill="#12100E" />
              <rect x="24" y="17" width="16" height="3" fill={pal.skinShadow} />
              <rect x="26" y="17" width="2" height="2" fill={pal.skinOrBone} />
              <rect x="29" y="17" width="2" height="2" fill={pal.skinOrBone} />
              <rect x="33" y="17" width="2" height="2" fill={pal.skinOrBone} />
              <rect x="36" y="17" width="2" height="2" fill={pal.skinOrBone} />
            </g>
          </g>

          {/* Right Skeletal Arm + Role-Distinct Colossal Weapon */}
          <g
            transform={`translate(${pose.torsoX + pose.weaponX}, ${
              pose.torsoY + pose.weaponY
            })`}
          >
            <rect x="13" y="24" width="5" height="12" fill={pal.skinShadow} />
            <rect x="14" y="25" width="3" height="10" fill={pal.skinOrBone} />
            {isBoneShaman ? (
              /* Ossuary Skull-Totem Staff */
              <g>
                <rect x="8" y="8" width="4" height="45" fill={pal.skinShadow} />
                <rect x="9" y="9" width="2" height="43" fill={pal.skinOrBone} />
                <rect x="5" y="4" width="10" height="8" fill={pal.skinOrBone} />
                <rect x="6" y="6" width="2" height="2" fill="#090807" />
                <rect x="11" y="6" width="2" height="2" fill="#090807" />
                <rect x="7" y="1" width="6" height="4" fill={pal.eyeGlow} />
              </g>
            ) : isBoneStalker ? (
              /* Serrated Giant Femur Great-Cleaver */
              <g>
                <rect x="4" y="7" width="10" height="36" fill="#12100E" />
                <rect x="5" y="8" width="8" height="34" fill={pal.skinShadow} />
                <rect x="5" y="8" width="4" height="32" fill={pal.skinOrBone} />
                <rect x="5" y="9" width="2" height="28" fill="#FFF8EC" />
                <rect x="3" y="12" width="2" height="3" fill="#FFF8EC" />
                <rect x="3" y="19" width="2" height="3" fill="#FFF8EC" />
                <rect x="3" y="26" width="2" height="3" fill="#FFF8EC" />
              </g>
            ) : (
              /* Monolithic Rune-Carved Stone Pillar Club Bound in Iron Chains */
              <g>
                <rect x="3" y="6" width="13" height="46" fill="#12100E" />
                <rect x="4" y="7" width="11" height="44" fill={pal.metalDark} />
                <rect x="5" y="8" width="8" height="42" fill={pal.metal} />
                <rect x="6" y="9" width="4" height="38" fill={pal.metalLight} />
                {/* Iron Chains Wrapping the Stone Pillar */}
                <rect x="3" y="15" width="13" height="3" fill={pal.skinShadow} />
                <rect x="3" y="27" width="13" height="3" fill={pal.skinShadow} />
                <rect x="8" y="19" width="3" height="6" fill={pal.eyeGlow} />
              </g>
            )}
          </g>
        </g>
      );
    }
  }
}

// ============================================================================
// 5. BIOME-SPECIFIC MERCHANT & EVENT NPC ANIMATED PORTRAIT SYSTEM
// ============================================================================

export const LaCriptaAnimatedStageNpc: React.FC<{
  room: CriptaDungeonRoom;
  dungeon: CriptaDungeonDefinition;
}> = ({ room, dungeon }) => {
  const [tick, setTick] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [lookX, setLookX] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTick((t) => (t + 1) % 16);
    }, 360);
    return () => window.clearInterval(id);
  }, []);

  const breathY = tick % 4 === 1 || tick % 4 === 2 ? -1 : 0;
  const handY = tick % 3 === 0 ? -1 : 0;
  const lanternSwingX = tick % 4 === 0 ? -1 : tick % 4 === 2 ? 1 : 0;
  const rType: CriptaCanonicalRoomType = room.type;

  // Biome-specific merchant identity palette & accessories
  const biomeId = dungeon.id;
  const isForge = biomeId === 'forja_infernal' || biomeId === 'minas_de_azufre';
  const isGarden =
    biomeId === 'jardin_podrido' ||
    biomeId === 'bosque_marchito' ||
    biomeId === 'pantano_de_las_brujas';
  const isSewer =
    biomeId === 'alcantarillas_imperiales' || biomeId === 'laboratorio_alquimico';
  const isCastle =
    biomeId === 'castillo_del_verdugo' ||
    biomeId === 'prision_maldita' ||
    biomeId === 'santuario_de_sangre';
  const isIce = biomeId === 'cavernas_heladas';
  const isGoblin = biomeId === 'fortaleza_goblin' || biomeId === 'la_colmena';
  const isAbyss = biomeId === 'el_abismo' || biomeId === 'templo_del_eclipse';

  const cloakShadow = isForge
    ? '#290E0C'
    : isGarden
    ? '#132417'
    : isSewer
    ? '#14211D'
    : isCastle
    ? '#1A101C'
    : isIce
    ? '#12222E'
    : isGoblin
    ? '#2B1E11'
    : isAbyss
    ? '#10081C'
    : '#191126';

  const cloakColor = isForge
    ? '#4A1E1B'
    : isGarden
    ? '#233D29'
    : isSewer
    ? '#263630'
    : isCastle
    ? '#2E1E2E'
    : isIce
    ? '#233B4D'
    : isGoblin
    ? '#4A3520'
    : isAbyss
    ? '#1F1233'
    : '#2E2040';

  const cloakLight = isForge
    ? '#6E2E29'
    : isGarden
    ? '#365C3F'
    : isSewer
    ? '#3B544B'
    : isCastle
    ? '#473047'
    : isIce
    ? '#385B75'
    : isGoblin
    ? '#6B4E30'
    : isAbyss
    ? '#331F52'
    : '#463261';

  const trimColor = dungeon.palette.highlight || '#E7A54A';
  const glowColor = dungeon.palette.glow || '#FFD166';

  // Never render a post-combat NPC when a combat / elite / miniboss / boss room is cleared!
  if (
    rType === 'COMBAT' ||
    rType === 'ELITE' ||
    rType === 'MINIBOSS' ||
    rType === 'BOSS'
  ) {
    return null;
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setLookX(0);
      }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const rel = (e.clientX - rect.left) / Math.max(1, rect.width) - 0.5;
        setLookX(rel < -0.1 ? -1 : rel > 0.1 ? 1 : 0);
      }}
      className="relative flex flex-col items-center justify-center select-none"
    >
      <svg
        width={256}
        height={240}
        viewBox="0 0 64 60"
        shapeRendering="crispEdges"
        className="drop-shadow-[0_16px_28px_rgba(0,0,0,0.95)] overflow-visible"
      >
        {/* Multi-Tiered Stone Plinth with Chiselled Bevels & Biome Moss/Trim */}
        <rect x="4" y="54" width="56" height="5" fill="#09070D" />
        <rect x="6" y="53" width="52" height="4" fill={dungeon.palette.stoneDark} />
        <rect x="8" y="50" width="48" height="4" fill={dungeon.palette.stone} />
        <rect x="10" y="50" width="44" height="1" fill={trimColor} opacity="0.7" />
        <rect x="14" y="53" width="6" height="2" fill={cloakShadow} />
        <rect x="42" y="53" width="8" height="2" fill={cloakShadow} />

        {rType === 'SHOP' ? (
          /* ===================================================================
             HIGH-DENSITY BIOME MERCHANT (Hunched Relic Peddler + Huge Wares Pack)
             =================================================================== */
          <g>
            {/* Colossal Multi-Compartment Wares Backpack, Rolled Rug, Potions & Relics */}
            <g transform={`translate(0, ${breathY})`}>
              {/* Top Bedroll / Merchant Canopy Roll */}
              <rect x="28" y="8" width="22" height="6" fill="#140D08" />
              <rect x="29" y="9" width="20" height="4" fill="#5E3A24" />
              <rect x="30" y="9" width="18" height="2" fill="#8C583A" />
              <rect x="33" y="8" width="2" height="6" fill="#E7A54A" />
              <rect x="43" y="8" width="2" height="6" fill="#E7A54A" />

              {/* Main Timber & Stitched Leather Pack Frame */}
              <rect x="31" y="13" width="22" height="32" fill="#120B07" />
              <rect x="32" y="14" width="20" height="30" fill="#3D2415" />
              <rect x="33" y="15" width="17" height="28" fill="#5E3A24" />
              <rect x="34" y="16" width="14" height="24" fill="#784B30" />
              {/* Horizontal Brass Straps & Buckles */}
              <rect x="32" y="22" width="20" height="2" fill="#2A180E" />
              <rect x="32" y="23" width="20" height="1" fill="#E7A54A" />
              <rect x="40" y="21" width="4" height="4" fill="#FFD166" />
              <rect x="41" y="22" width="2" height="2" fill="#120B07" />
              <rect x="32" y="33" width="20" height="2" fill="#2A180E" />
              <rect x="32" y="34" width="20" height="1" fill="#E7A54A" />

              {/* Hanging Glass Potion Vials & Sword Hilt Protruding from Pack */}
              <rect x="51" y="18" width="5" height="7" fill="#121A24" />
              <rect x="52" y="19" width="3" height="5" fill="#C93B5B" />
              <rect x="52" y="19" width="1" height="3" fill="#FF8FA3" />
              <rect x="52" y="16" width="3" height="2" fill="#D8C6A0" />

              <rect x="51" y="27" width="5" height="7" fill="#121A24" />
              <rect x="52" y="28" width="3" height="5" fill="#3B9E66" />
              <rect x="52" y="28" width="1" height="3" fill="#8EE6AE" />
              <rect x="52" y="25" width="3" height="2" fill="#D8C6A0" />

              {/* Biome-Specific Merchant Pack Trophies */}
              {isGarden && (
                <g>
                  <rect x="42" y="4" width="10" height="5" fill="#63327A" />
                  <rect x="43" y="5" width="8" height="3" fill="#9B59B6" />
                  <rect x="44" y="5" width="2" height="2" fill="#D4FF80" />
                  <rect x="48" y="6" width="2" height="1" fill="#D4FF80" />
                </g>
              )}
              {isForge && (
                <g>
                  <rect x="45" y="4" width="7" height="7" fill="#494E59" />
                  <rect x="46" y="5" width="5" height="5" fill="#8E96A4" />
                  <rect x="47" y="6" width="3" height="2" fill="#FF6B35" />
                </g>
              )}
              {!isGarden && !isForge && (
                /* Ornate Relic Scroll Case & Pommel */
                <g>
                  <rect x="46" y="4" width="4" height="9" fill="#9E6B24" />
                  <rect x="47" y="5" width="2" height="7" fill="#FFD166" />
                </g>
              )}
            </g>

            {/* Merchant Boots & Hem of Layered Travel Coat */}
            <rect x="19" y="46" width="7" height="5" fill="#120C09" />
            <rect x="20" y="46" width="5" height="4" fill="#3D261A" />
            <rect x="29" y="46" width="7" height="5" fill="#120C09" />
            <rect x="30" y="46" width="5" height="4" fill="#3D261A" />

            {/* Layered Merchant Robes, Velvet Lapels, Coin Belt & Pouches */}
            <g transform={`translate(0, ${breathY})`}>
              <rect x="16" y="20" width="24" height="27" fill="#0B0811" />
              <rect x="17" y="21" width="22" height="25" fill={cloakShadow} />
              <rect x="18" y="21" width="19" height="23" fill={cloakColor} />
              <rect x="19" y="22" width="14" height="20" fill={cloakLight} />
              {/* Inner Brocade Vest & Gold Trim Lapels */}
              <rect x="23" y="22" width="10" height="24" fill="#161021" />
              <rect x="22" y="21" width="2" height="25" fill={trimColor} />
              <rect x="32" y="21" width="2" height="25" fill={trimColor} />
              {/* Merchant Heavy Leather Belt & Bulging Gold Pouches */}
              <rect x="17" y="34" width="22" height="4" fill="#26170E" />
              <rect x="18" y="35" width="20" height="2" fill="#5E3A24" />
              <rect x="26" y="34" width="4" height="4" fill="#FFD166" />
              <rect x="27" y="35" width="2" height="2" fill="#26170E" />
              <rect x="19" y="36" width="5" height="6" fill="#8C583A" />
              <rect x="20" y="37" width="3" height="4" fill="#E7A54A" />
            </g>

            {/* Merchant Head, Wide-Brimmed Hood/Hat, Mask/Scarf & Expressive Eyes */}
            <g transform={`translate(${lookX}, ${breathY})`}>
              {/* Hood / Peddler Hat Brim */}
              <rect x="16" y="7" width="22" height="14" fill="#0B0811" />
              <rect x="17" y="8" width="20" height="12" fill={cloakShadow} />
              <rect x="18" y="8" width="18" height="10" fill={cloakColor} />
              <rect x="20" y="7" width="14" height="4" fill={cloakLight} />
              <rect x="16" y="11" width="22" height="2" fill={trimColor} />

              {/* Shadowed Face Cavity &Wrapped Lower Scarf */}
              <rect x="20" y="12" width="14" height="8" fill="#09070F" />
              <rect x="20" y="17" width="14" height="4" fill="#3D2638" />
              <rect x="21" y="18" width="12" height="2" fill="#593852" />

              {isGoblin && (
                /* Notched Long Goblin Merchant Ears & Gold Earring */
                <g>
                  <rect x="11" y="12" width="6" height="4" fill="#3C5928" />
                  <rect x="12" y="12" width="5" height="2" fill="#6B8E4E" />
                  <rect x="37" y="12" width="6" height="4" fill="#3C5928" />
                  <rect x="37" y="12" width="5" height="2" fill="#6B8E4E" />
                  <rect x="13" y="15" width="2" height="2" fill="#FFD166" />
                </g>
              )}

              {/* Blinking & Cursor-Tracking Luminous Merchant Eyes + Spectacles Rim */}
              {tick !== 7 && (
                <g>
                  <rect x={21 + lookX} y="13" width="5" height="4" fill="#8C583A" />
                  <rect x={28 + lookX} y="13" width="5" height="4" fill="#8C583A" />
                  <rect x={22 + lookX} y="14" width="3" height="2" fill={hovered ? '#FFF3C4' : glowColor} />
                  <rect x={29 + lookX} y="14" width="3" height="2" fill={hovered ? '#FFF3C4' : glowColor} />
                  <rect x={23 + lookX} y="14" width="1" height="1" fill="#FFFFFF" />
                  <rect x={30 + lookX} y="14" width="1" height="1" fill="#FFFFFF" />
                </g>
              )}
            </g>

            {/* Left Arm Holding Swaying Wrought-Iron Lantern */}
            <g transform={`translate(${lanternSwingX}, ${handY})`}>
              <rect x="9" y="21" width="9" height="5" fill="#0B0811" />
              <rect x="10" y="22" width="8" height="3" fill={cloakColor} />
              {/* Gloved Hand & Lantern Chain */}
              <rect x="8" y="22" width="3" height="3" fill="#8C583A" />
              <rect x="9" y="25" width="2" height="3" fill="#8E96A4" />
              {/* Ornate Wrought-Iron Lantern */}
              <rect x="6" y="28" width="8" height="2" fill="#2A2E38" />
              <rect x="5" y="30" width="10" height="10" fill="#1A1D24" />
              <rect x="7" y="30" width="6" height="9" fill="#E7A54A" />
              <rect x="8" y="31" width="4" height="7" fill="#FFD166" />
              <rect x="9" y="32" width="2" height="4" fill="#FFF8EC" />
              <rect x="6" y="39" width="8" height="2" fill="#2A2E38" />
            </g>

            {/* Right Hand Weighing & Tossing Gleaming Gold Coin */}
            <g transform={`translate(0, ${handY})`}>
              <rect x="35" y="27" width="8" height="5" fill="#0B0811" />
              <rect x="36" y="28" width="6" height="3" fill="#D8C6A0" />
              {/* Spinning Gold Coin in Air */}
              <rect
                x="38"
                y={21 - (tick % 3)}
                width="4"
                height="4"
                fill="#E7A54A"
              />
              <rect
                x="39"
                y={22 - (tick % 3)}
                width="2"
                height="2"
                fill="#FFF3C4"
              />
            </g>

            {/* Curious Backpack Familiar / Crypt Rat Peeking at Base */}
            <g transform={`translate(${tick % 5 === 0 ? 1 : 0}, 0)`}>
              <rect x="10" y="46" width="8" height="4" fill="#292220" />
              <rect x="11" y="47" width="6" height="3" fill="#59504B" />
              <rect x="10" y="47" width="2" height="2" fill="#7A6E67" />
              <rect x="9" y="48" width="1" height="1" fill="#8EE6AE" />
              <rect x="17" y="48" width="3" height="1" fill="#A88B83" />
            </g>
          </g>
        ) : rType === 'REST' ? (
          /* ===================================================================
             HIGH-DENSITY SANCTUARY CAMPFIRE, SWORD IN EMBERS & FIELD ANVIL
             =================================================================== */
          <g>
            {/* Stone Firepit Ring & Charred Firewood Logs */}
            <rect x="8" y="44" width="28" height="6" fill="#120B08" />
            <rect x="10" y="43" width="24" height="5" fill="#4A2C1B" />
            <rect x="12" y="44" width="20" height="3" fill="#6E4228" />
            <rect x="9" y="46" width="6" height="4" fill="#494E59" />
            <rect x="19" y="47" width="6" height="4" fill="#666D7A" />
            <rect x="29" y="46" width="6" height="4" fill="#494E59" />
            {/* Glowing Coal Bed */}
            <rect x="13" y="44" width="18" height="3" fill="#C93B5B" />
            <rect x="15" y="45" width="14" height="2" fill="#FF6B35" />

            {/* Coiled Knight's Sword Resting in the Bonfire (Dark Fantasy Sanctuary Motif) */}
            <rect x="20" y="13" width="3" height="31" fill="#2A2E38" />
            <rect x="21" y="14" width="2" height="29" fill="#8E96A4" />
            <rect x="16" y="21" width="11" height="3" fill="#E7A54A" />
            <rect x="17" y="21" width="9" height="1" fill="#FFD166" />
            <rect x="20" y="8" width="3" height="6" fill="#5E3A24" />
            <rect x="19" y="6" width="5" height="3" fill="#FFD166" />

            {/* Multi-Layered Animated Pixel Flames */}
            <g transform={`translate(0, ${breathY})`}>
              {/* Outer Crimson Flame Tongue */}
              <rect x="12" y="26" width="20" height="18" fill="#9E223B" />
              <rect x="14" y="22" width="16" height="21" fill="#C93B5B" />
              {/* Mid Amber Flame Tongue */}
              <rect x="15" y="24" width="14" height="18" fill="#E76F24" />
              <rect x="17" y="19" width="10" height="22" fill="#E7A54A" />
              {/* Inner Bright Gold & White Core */}
              <rect x="18" y="25" width="8" height="16" fill="#FFD166" />
              <rect x="20" y="29" width="4" height="11" fill="#FFF8EC" />
            </g>

            {/* Heavy Blacksmith Field Anvil & Forging Hammer on Timber Block */}
            <rect x="37" y="40" width="17" height="10" fill="#29180E" />
            <rect x="38" y="41" width="15" height="8" fill="#52321E" />
            <rect x="39" y="41" width="13" height="2" fill="#73472C" />
            {/* Iron Anvil Base, Waist & Horn */}
            <rect x="38" y="37" width="15" height="4" fill="#232730" />
            <rect x="40" y="34" width="11" height="4" fill="#3A404D" />
            <rect x="34" y="30" width="22" height="5" fill="#494E59" />
            <rect x="36" y="30" width="18" height="3" fill="#8E96A4" />
            <rect x="38" y="30" width="14" height="1" fill="#D4DCE8" />
            {/* Smithing Hammer Resting / Bobbing Above Anvil */}
            <g transform={`translate(0, ${handY})`}>
              <rect x="44" y="21" width="3" height="10" fill="#5E3A24" />
              <rect x="45" y="22" width="1" height="8" fill="#8C583A" />
              <rect x="40" y="18" width="11" height="5" fill="#2A2E38" />
              <rect x="41" y="19" width="9" height="3" fill="#A8B0C2" />
              <rect x="42" y="19" width="7" height="1" fill="#FFFFFF" />
            </g>

            {/* Rising Embers & Sparks */}
            <rect x="16" y={13 - (tick % 5)} width="2" height="3" fill="#FF6B35" />
            <rect x="22" y={9 - ((tick + 2) % 5)} width="2" height="2" fill="#FFD166" />
            <rect x="27" y={15 - ((tick + 4) % 5)} width="2" height="2" fill="#FFF3C4" />
          </g>
        ) : rType === 'TREASURE' || rType === 'LOOT' ? (
          /* ===================================================================
             HIGH-DENSITY ROYAL RELIQUARY COFFER OVERFLOWING WITH GOLD & GEMS
             =================================================================== */
          <g transform={`translate(0, ${hovered ? -1 : 0})`}>
            {/* Spilled Gold Coins & Ruby Around Chest Base */}
            <rect x="9" y="48" width="4" height="2" fill="#E7A54A" />
            <rect x="10" y="48" width="2" height="1" fill="#FFF3C4" />
            <rect x="50" y="48" width="5" height="2" fill="#E7A54A" />
            <rect x="51" y="47" width="3" height="2" fill="#FFD166" />

            {/* Lower Iron-Bound Oak Chest Body */}
            <rect x="12" y="26" width="40" height="24" fill="#140B06" />
            <rect x="13" y="27" width="38" height="22" fill="#3D2212" />
            <rect x="15" y="28" width="34" height="19" fill="#5E361E" />
            <rect x="17" y="30" width="30" height="14" fill="#78472A" />
            {/* Horizontal Wood Plank Seams */}
            <rect x="15" y="35" width="34" height="1" fill="#29160B" />
            <rect x="15" y="41" width="34" height="1" fill="#29160B" />
            {/* Vertical Forged Iron & Brass Straps */}
            <rect x="14" y="27" width="4" height="22" fill="#2A2E38" />
            <rect x="15" y="28" width="2" height="20" fill="#666D7A" />
            <rect x="46" y="27" width="4" height="22" fill="#2A2E38" />
            <rect x="47" y="28" width="2" height="20" fill="#666D7A" />
            <rect x="20" y="27" width="4" height="22" fill="#9E6B24" />
            <rect x="21" y="28" width="2" height="20" fill="#FFD166" />
            <rect x="40" y="27" width="4" height="22" fill="#9E6B24" />
            <rect x="41" y="28" width="2" height="20" fill="#FFD166" />

            {/* Overflowing Treasure Seam Inside Open Lid (Gold, Rubies, Emeralds) */}
            <rect x="15" y="23" width="34" height="5" fill="#E7A54A" />
            <rect x="17" y="24" width="30" height="3" fill="#FFD166" />
            <rect x="20" y="24" width="10" height="2" fill="#FFF8EC" />
            <rect x="24" y="23" width="4" height="3" fill="#E63946" />
            <rect x="36" y="23" width="4" height="3" fill="#2EC4B6" />

            {/* Articulated Vaulted Lid (Lifts on breath/hover to reveal treasure glow) */}
            <g transform={`translate(0, ${hovered ? -3 : breathY - 1})`}>
              <rect x="11" y="15" width="42" height="10" fill="#140B06" />
              <rect x="12" y="16" width="40" height="8" fill="#4A2916" />
              <rect x="14" y="17" width="36" height="6" fill="#6E3F23" />
              <rect x="16" y="17" width="32" height="2" fill="#8C5432" />
              {/* Gold Trim & Lid Straps */}
              <rect x="12" y="15" width="40" height="2" fill="#E7A54A" />
              <rect x="20" y="15" width="4" height="9" fill="#FFD166" />
              <rect x="40" y="15" width="4" height="9" fill="#FFD166" />
            </g>

            {/* Ornate Lion/Skull Escutcheon Lock Plate */}
            <rect x="27" y="24" width="10" height="12" fill="#1A1209" />
            <rect x="28" y="25" width="8" height="10" fill="#E7A54A" />
            <rect x="29" y="26" width="6" height="8" fill="#FFD166" />
            <rect x="31" y="28" width="2" height="4" fill="#09070D" />

            {/* Floating Golden Sparkles */}
            <rect x="18" y={10 + breathY} width="3" height="3" fill="#FFD166" />
            <rect x="31" y={6 - breathY} width="3" height="3" fill="#FFF8EC" />
            <rect x="44" y={10 + breathY} width="3" height="3" fill="#FFD166" />
          </g>
        ) : rType === 'SHRINE' ? (
          /* ===================================================================
             HIGH-DENSITY WINGED SERAPH RELIQUARY STATUE & LEVITATING CHALICE
             =================================================================== */
          <g>
            {/* Carved Stone Winged Seraph Wings (4-Tone Chiselled Stone) */}
            <rect x="8" y="11" width="12" height="32" fill="#09070D" />
            <rect x="9" y="12" width="10" height="30" fill={dungeon.palette.stoneDark} />
            <rect x="10" y="13" width="8" height="26" fill={dungeon.palette.stone} />
            <rect x="11" y="14" width="5" height="18" fill="#8E96A4" opacity="0.45" />

            <rect x="44" y="11" width="12" height="32" fill="#09070D" />
            <rect x="45" y="12" width="10" height="30" fill={dungeon.palette.stoneDark} />
            <rect x="46" y="13" width="8" height="26" fill={dungeon.palette.stone} />
            <rect x="48" y="14" width="5" height="18" fill="#8E96A4" opacity="0.45" />

            {/* Statue Robed Torso, Pillar Drapery & Hooded Seraph Head */}
            <rect x="19" y="13" width="26" height="37" fill="#09070D" />
            <rect x="20" y="14" width="24" height="36" fill={dungeon.palette.stoneDark} />
            <rect x="22" y="15" width="20" height="34" fill={dungeon.palette.stone} />
            <rect x="25" y="17" width="14" height="31" fill="#181224" />
            {/* Carved Hooded Seraph Head & Halo */}
            <rect x="23" y="2" width="18" height="2" fill={trimColor} />
            <rect x="21" y="4" width="2" height="6" fill={trimColor} />
            <rect x="41" y="4" width="2" height="6" fill={trimColor} />
            <rect x="25" y="5" width="14" height="11" fill={dungeon.palette.stone} />
            <rect x="27" y="8" width="10" height="7" fill="#120E1A" />
            <rect x="28" y="10" width="3" height="2" fill={glowColor} />
            <rect x="33" y="10" width="3" height="2" fill={glowColor} />

            {/* Levitating Sacred Golden Chalice & Radiant Essence */}
            <g transform={`translate(0, ${breathY - 1})`}>
              <rect x="25" y="23" width="14" height="7" fill="#9E6B24" />
              <rect x="26" y="23" width="12" height="6" fill="#FFD166" />
              <rect x="28" y="24" width="8" height="3" fill="#FFF8EC" />
              <rect x="30" y="29" width="4" height="6" fill="#E7A54A" />
              <rect x="27" y="35" width="10" height="2" fill="#FFD166" />
              {/* Sacred Flame / Essence Rising from Chalice */}
              <rect x="28" y="18" width="8" height="5" fill={glowColor} />
              <rect x="30" y="15" width="4" height="5" fill="#FFF8EC" />
            </g>
          </g>
        ) : room.encounterSubject?.archetype === 'SPECTRAL_KNIGHT' ? (
          /* ===================================================================
             SPECTRAL KNIGHT BOUND IN CHAINS (Caballero Espectral Encadenado)
             =================================================================== */
          <g>
            {/* Hanging Wrought-Iron Dungeon Chains Binding Wrists & Pauldrons */}
            <rect x="8" y="4" width="2" height="24" fill="#494E59" />
            <rect x="9" y="6" width="1" height="20" fill="#A8B0C2" />
            <rect x="54" y="4" width="2" height="24" fill="#494E59" />
            <rect x="54" y="6" width="1" height="20" fill="#A8B0C2" />
            <rect x="10" y="24" width="8" height="3" fill="#666D7A" />
            <rect x="46" y="24" width="8" height="3" fill="#666D7A" />

            {/* Spectral Aura & Kneeling / Hovering Plate Armor Torso */}
            <g transform={`translate(0, ${breathY})`}>
              <rect x="16" y="16" width="32" height="30" fill="#0B1320" />
              <rect x="14" y="18" width="8" height="10" fill="#1E3A5F" />
              <rect x="42" y="18" width="8" height="10" fill="#1E3A5F" />
              <rect x="15" y="19" width="6" height="6" fill="#38BDF8" opacity="0.75" />
              <rect x="43" y="19" width="6" height="6" fill="#38BDF8" opacity="0.75" />
              <rect x="20" y="18" width="24" height="24" fill="#1E293B" />
              <rect x="22" y="20" width="20" height="18" fill="#334155" />
              {/* Spectral Rib-Plate & Soul Core */}
              <rect x="25" y="22" width="14" height="3" fill="#7DD3FC" />
              <rect x="26" y="27" width="12" height="3" fill="#38BDF8" />
              <rect x="28" y="32" width="8" height="3" fill="#0284C7" />
            </g>

            {/* Visored Greathelm with Blazing Cyan Soul Eyes */}
            <g transform={`translate(${lookX}, ${breathY})`}>
              <rect x="23" y="5" width="18" height="14" fill="#0F172A" />
              <rect x="24" y="6" width="16" height="12" fill="#334155" />
              <rect x="26" y="4" width="12" height="3" fill="#7DD3FC" />
              <rect x="25" y="11" width="14" height="4" fill="#09070F" />
              <rect x={27 + lookX} y="12" width="3" height="2" fill="#38BDF8" />
              <rect x={34 + lookX} y="12" width="3" height="2" fill="#38BDF8" />
              <rect x={28 + lookX} y="12" width="1" height="1" fill="#FFFFFF" />
              <rect x={35 + lookX} y="12" width="1" height="1" fill="#FFFFFF" />
            </g>

            {/* Planted Ancestral Greatsword in Stone Plinth */}
            <rect x="30" y="20" width="4" height="31" fill="#94A3B8" />
            <rect x="31" y="21" width="2" height="28" fill="#E2E8F0" />
            <rect x="24" y="20" width="16" height="3" fill="#E7A54A" />
            <rect x="30" y="15" width="4" height="5" fill="#FFD166" />
          </g>
        ) : room.encounterSubject?.archetype === 'CURSED_WELL' ? (
          /* ===================================================================
             ABYSSAL WELL OF WHISPERS (Pozo de las Aguas Abisales)
             =================================================================== */
          <g>
            {/* Timber Roof Beams & Iron Pulley Wheel */}
            <rect x="14" y="8" width="4" height="30" fill="#3D2415" />
            <rect x="46" y="8" width="4" height="30" fill="#3D2415" />
            <rect x="10" y="4" width="44" height="6" fill="#2A180E" />
            <rect x="12" y="5" width="40" height="4" fill="#5E3A24" />
            <rect x="29" y="10" width="6" height="6" fill="#494E59" />
            <rect x="31" y="16" width="2" height="14" fill="#8E96A4" />

            {/* Rising Bioluminescent Mist & Eldritch Tendrils from Well Mouth */}
            <g transform={`translate(0, ${breathY})`}>
              <rect x="20" y="22" width="24" height="14" fill={glowColor} opacity="0.35" />
              <rect x="23" y="18" width="4" height="16" fill="#2DD4BF" />
              <rect x="37" y="19" width="4" height="15" fill="#A855F7" />
              <rect x="29" y="20" width="6" height="10" fill="#5EEAD4" />
            </g>

            {/* Circular Chiselled Stone Well Parapet */}
            <rect x="12" y="34" width="40" height="16" fill="#111622" />
            <rect x="14" y="35" width="36" height="14" fill="#1E293B" />
            <rect x="16" y="32" width="32" height="5" fill="#475569" />
            <rect x="18" y="33" width="28" height="2" fill="#2DD4BF" />
            {/* Brick Courses */}
            <rect x="16" y="39" width="10" height="4" fill="#334155" />
            <rect x="28" y="39" width="10" height="4" fill="#334155" />
            <rect x="40" y="39" width="8" height="4" fill="#334155" />
            <rect x="20" y="45" width="12" height="4" fill="#334155" />
            <rect x="34" y="45" width="12" height="4" fill="#334155" />
          </g>
        ) : room.encounterSubject?.archetype === 'ABYSSAL_MIRROR' ? (
          /* ===================================================================
             MIRROR OF FRACTURED REFLECTIONS (Espejo de los Reflejos Rotos)
             =================================================================== */
          <g transform={`translate(0, ${breathY})`}>
            {/* Ornate Gilded Gothic Mirror Frame */}
            <rect x="14" y="6" width="36" height="44" fill="#2A1C0E" />
            <rect x="16" y="8" width="32" height="40" fill="#E7A54A" />
            <rect x="18" y="10" width="28" height="36" fill="#090D16" />
            <rect x="26" y="3" width="12" height="5" fill="#FFD166" />
            <rect x="30" y="4" width="4" height="3" fill="#C084FC" />

            {/* Fractured Quicksilver Glass & Glowing Doppelganger Silhouette Inside */}
            <rect x="20" y="12" width="8" height="16" fill="#1E293B" />
            <rect x="30" y="24" width="14" height="20" fill="#1E1B4B" />
            <rect x="25" y="16" width="14" height="26" fill="#312E81" />
            <rect x="28" y="18" width="8" height="8" fill="#4C1D95" />
            <rect x={29 + lookX} y="21" width="2" height="2" fill="#F43F5E" />
            <rect x={33 + lookX} y="21" width="2" height="2" fill="#38BDF8" />
            {/* Diagonal Mirror Crack Lines */}
            <rect x="20" y="14" width="6" height="1" fill="#E2E8F0" />
            <rect x="26" y="15" width="6" height="1" fill="#E2E8F0" />
            <rect x="32" y="16" width="8" height="1" fill="#E2E8F0" />
            <rect x="24" y="32" width="14" height="1" fill="#A5F3FC" />
          </g>
        ) : room.encounterSubject?.archetype === 'BLIND_ORACLE' ? (
          /* ===================================================================
             BLIND ORACLE OF THE ASHES (Oráculo Ciego de las Cenizas)
             =================================================================== */
          <g>
            {/* Orbiting Celestial Divination Spheres */}
            <g transform={`translate(0, ${handY})`}>
              <rect x="10" y="14" width="6" height="6" fill="#E7A54A" />
              <rect x="11" y="15" width="4" height="4" fill="#FFF3C4" />
              <rect x="48" y="14" width="6" height="6" fill="#9B72CF" />
              <rect x="49" y="15" width="4" height="4" fill="#E0AAFF" />
            </g>

            {/* Layered Oracle Robes & Gold Astrological Stole */}
            <g transform={`translate(0, ${breathY})`}>
              <rect x="18" y="20" width="28" height="30" fill="#140E21" />
              <rect x="20" y="21" width="24" height="28" fill="#2A1B42" />
              <rect x="24" y="21" width="16" height="28" fill="#3B2559" />
              <rect x="29" y="22" width="6" height="26" fill="#E7A54A" />
              <rect x="30" y="24" width="4" height="22" fill="#FFD166" />
            </g>

            {/* Hooded Head, Linen Blindfold & Blazing Third Eye on Forehead */}
            <g transform={`translate(${lookX}, ${breathY})`}>
              <rect x="22" y="6" width="20" height="15" fill="#140E21" />
              <rect x="24" y="7" width="16" height="13" fill="#2A1B42" />
              {/* Linen Blindfold Across Eyes */}
              <rect x="24" y="13" width="16" height="4" fill="#E8DFCE" />
              <rect x="25" y="14" width="14" height="2" fill="#FFF8EC" />
              {/* Open Blazing Third Eye */}
              <rect x="30" y="9" width="4" height="3" fill="#FFD166" />
              <rect x="31" y="10" width="2" height="2" fill="#F43F5E" />
            </g>
          </g>
        ) : room.encounterSubject?.archetype === 'TALKING_SKULL_TOTEM' ? (
          /* ===================================================================
             TOTEM OF CHATTERING SKULLS (Tótem de Cráneos Parlantes)
             =================================================================== */
          <g>
            {/* Impaled Ceremonial Sword at Top of Totem */}
            <rect x="30" y="2" width="4" height="14" fill="#94A3B8" />
            <rect x="31" y="3" width="2" height="12" fill="#F8FAFC" />
            <rect x="25" y="8" width="14" height="2" fill="#E7A54A" />

            {/* Three Stacked Bronze & Bone Skulls with Glowing Eyes */}
            {[12, 24, 36].map((sy, idx) => (
              <g
                key={sy}
                transform={`translate(${idx % 2 === 0 ? lookX : -lookX}, ${
                  idx === 0 ? breathY : 0
                })`}
              >
                <rect x="22" y={sy} width="20" height="11" fill="#1C1917" />
                <rect x="24" y={sy + 1} width="16" height="8" fill="#E7E5E4" />
                <rect x="26" y={sy + 3} width="4" height="3" fill="#09070F" />
                <rect x="34" y={sy + 3} width="4" height="3" fill="#09070F" />
                <rect
                  x="27"
                  y={sy + 4}
                  width="2"
                  height="2"
                  fill={idx === 0 ? '#38BDF8' : idx === 1 ? '#4ADE80' : '#F43F5E'}
                />
                <rect
                  x="35"
                  y={sy + 4}
                  width="2"
                  height="2"
                  fill={idx === 0 ? '#38BDF8' : idx === 1 ? '#4ADE80' : '#F43F5E'}
                />
                <rect x="26" y={sy + 9} width="12" height="2" fill="#A8A29E" />
              </g>
            ))}
          </g>
        ) : room.encounterSubject?.archetype === 'CRYSTAL_SARCOPHAGUS' ? (
          /* ===================================================================
             SEALED QUARTZ SARCOPHAGUS (Sarcófago de Cuarzo Sellado)
             =================================================================== */
          <g transform={`translate(0, ${breathY})`}>
            {/* Outer Prismatic Quartz Coffin */}
            <rect x="18" y="6" width="28" height="44" fill="#082F49" />
            <rect x="20" y="8" width="24" height="40" fill="#0284C7" />
            <rect x="22" y="10" width="20" height="36" fill="#38BDF8" opacity="0.65" />
            {/* Crowned Monarch Silhouette Visible Inside the Crystal */}
            <rect x="27" y="13" width="10" height="3" fill="#FFD166" />
            <rect x="27" y="16" width="10" height="8" fill="#E2E8F0" />
            <rect x="29" y="19" width="2" height="2" fill="#67E8F9" />
            <rect x="33" y="19" width="2" height="2" fill="#67E8F9" />
            <rect x="25" y="25" width="14" height="18" fill="#1E293B" />
            <rect x="31" y="22" width="2" height="20" fill="#FFD166" />
            {/* Specular Crystal Facet Highlights */}
            <rect x="22" y="12" width="3" height="30" fill="#E0F2FE" opacity="0.55" />
          </g>
        ) : room.encounterSubject?.archetype === 'ALCHEMICAL_CAULDRON' ? (
          /* ===================================================================
             BUBBLING ALCHEMICAL CAULDRON (Caldero Alquímico Burbujeante)
             =================================================================== */
          <g>
            {/* Emerald Soul-Fire Under Tripod */}
            <rect x="20" y="44" width="24" height="6" fill="#15803D" />
            <rect x="24" y="45" width="16" height="4" fill="#4ADE80" />
            <rect x="28" y="46" width="8" height="2" fill="#FEF08A" />

            {/* Heavy Cast-Iron Cauldron */}
            <rect x="14" y="22" width="36" height="22" fill="#0F172A" />
            <rect x="16" y="24" width="32" height="18" fill="#1E293B" />
            <rect x="12" y="20" width="40" height="4" fill="#334155" />
            {/* Bubbling Mutagenic Brew */}
            <rect x="16" y="19" width="32" height="3" fill="#22C55E" />
            <rect x="20" y="18" width="24" height="2" fill="#86EFAC" />
            {/* Rising Alchemical Bubbles & Floating Vials */}
            <g transform={`translate(0, ${breathY - (tick % 3)})`}>
              <rect x="22" y="12" width="4" height="4" fill="#4ADE80" />
              <rect x="31" y="8" width="5" height="5" fill="#A3E635" />
              <rect x="39" y="13" width="3" height="3" fill="#67E8F9" />
            </g>
          </g>
        ) : room.encounterSubject?.archetype === 'IMPALED_COLOSSUS_SWORD' ? (
          /* ===================================================================
             GREATSWORD OF THE FALLEN COLOSSUS (Espadón del Coloso Caído)
             =================================================================== */
          <g>
            {/* Petrified Giant Skull Half-Buried in Plinth */}
            <rect x="12" y="30" width="40" height="20" fill="#1E293B" />
            <rect x="15" y="32" width="34" height="16" fill="#475569" />
            <rect x="19" y="36" width="8" height="7" fill="#09070F" />
            <rect x="37" y="36" width="8" height="7" fill="#09070F" />
            <rect x="21" y="38" width="4" height="3" fill="#38BDF8" opacity="0.8" />
            <rect x="39" y="38" width="4" height="3" fill="#38BDF8" opacity="0.8" />

            {/* Monumental Runic Greatsword Impaled Vertically into the Skull */}
            <g transform={`translate(0, ${hovered ? -1 : 0})`}>
              <rect x="28" y="10" width="8" height="26" fill="#64748B" />
              <rect x="30" y="11" width="4" height="24" fill="#E2E8F0" />
              <rect x="31" y="14" width="2" height="16" fill="#FFD166" />
              {/* Sweeping Gold Crossguard & Pommel */}
              <rect x="18" y="8" width="28" height="4" fill="#E7A54A" />
              <rect x="20" y="9" width="24" height="2" fill="#FFD166" />
              <rect x="30" y="2" width="4" height="6" fill="#78350F" />
              <rect x="29" y="0" width="6" height="3" fill="#FFD166" />
            </g>
          </g>
        ) : room.encounterSubject?.archetype === 'CAGED_ABYSSAL_RAVEN' ? (
          /* ===================================================================
             THREE-EYED ABYSSAL RAVEN IN IRON CAGE (Cuervo Abisal de Tres Ojos)
             =================================================================== */
          <g transform={`translate(${lanternSwingX}, 0)`}>
            {/* Hanging Chain & Wrought-Iron Cage */}
            <rect x="31" y="0" width="2" height="10" fill="#94A3B8" />
            <rect x="16" y="10" width="32" height="36" fill="#0F172A" opacity="0.55" />
            <rect x="16" y="10" width="32" height="3" fill="#475569" />
            <rect x="16" y="43" width="32" height="3" fill="#475569" />
            {[16, 23, 31, 39, 46].map((bx) => (
              <rect key={bx} x={bx} y="12" width="2" height="32" fill="#64748B" />
            ))}
            {/* Giant Three-Eyed Raven Inside Cage */}
            <g transform={`translate(${lookX}, ${breathY})`}>
              <rect x="24" y="20" width="14" height="16" fill="#09070F" />
              <rect x="26" y="16" width="10" height="8" fill="#1E1B4B" />
              <rect x="35" y="18" width="7" height="4" fill="#E7A54A" />
              {/* Three Glowing Crimson/Gold Eyes */}
              <rect x="28" y="17" width="2" height="2" fill="#F43F5E" />
              <rect x="32" y="17" width="2" height="2" fill="#F43F5E" />
              <rect x="30" y="15" width="2" height="2" fill="#FFD166" />
            </g>
          </g>
        ) : room.encounterSubject?.archetype === 'WEEPING_BLOOD_STATUE' ? (
          /* ===================================================================
             EFFIGY OF THE RUBY MARTYR (Efigie de la Mártir de Rubí)
             =================================================================== */
          <g>
            {/* Carved Gothic Stone Statue */}
            <rect x="20" y="8" width="24" height="42" fill="#1E293B" />
            <rect x="22" y="10" width="20" height="38" fill="#475569" />
            <rect x="26" y="11" width="12" height="10" fill="#94A3B8" />
            {/* Crimson Ruby Tears Flowing Down Into Golden Chalice */}
            <rect x="28" y="15" width="2" height="10" fill="#E11D48" />
            <rect x="34" y="15" width="2" height="10" fill="#E11D48" />
            <rect x="26" y="26" width="12" height="6" fill="#FFD166" />
            <rect x="28" y="25" width="8" height="3" fill="#E11D48" />
            <rect x="30" y="32" width="4" height="6" fill="#E7A54A" />
          </g>
        ) : room.encounterSubject?.archetype === 'FUNGAL_HERMIT' ? (
          /* ===================================================================
             HERMIT OF THE ANCIENT MYCELIUM (Ermitaño del Micelio Ancestral)
             =================================================================== */
          <g transform={`translate(0, ${breathY})`}>
            {/* Spotted Bioluminescent Mushroom Cap Hat */}
            <rect x="12" y="6" width="40" height="10" fill="#4A2559" />
            <rect x="16" y="3" width="32" height="5" fill="#7A3E8F" />
            <rect x="18" y="7" width="4" height="3" fill="#BEF264" />
            <rect x="30" y="5" width="5" height="3" fill="#4ADE80" />
            <rect x="42" y="7" width="4" height="3" fill="#BEF264" />
            {/* Mossy Cloak, Friendly Glowing Eyes & Amber Staff */}
            <rect x="18" y="16" width="28" height="34" fill="#142918" />
            <rect x="21" y="18" width="22" height="30" fill="#1E3F24" />
            <rect x={26 + lookX} y="18" width="3" height="2" fill="#FEF08A" />
            <rect x={35 + lookX} y="18" width="3" height="2" fill="#FEF08A" />
            <rect x="48" y="10" width="3" height="40" fill="#78350F" />
            <rect x="46" y="6" width="7" height="6" fill="#F59E0B" />
          </g>
        ) : room.encounterSubject?.archetype === 'ASTRAL_ORRERY_PEDESTAL' ? (
          /* ===================================================================
             CELESTIAL BRASS ORRERY (Planetario de Bronce Celeste)
             =================================================================== */
          <g transform={`translate(0, ${breathY})`}>
            <rect x="22" y="36" width="20" height="14" fill="#1E293B" />
            <rect x="25" y="38" width="14" height="12" fill="#334155" />
            {/* Concentric Brass Rings & Orbiting Moons */}
            <rect x="14" y="10" width="36" height="3" fill="#E7A54A" />
            <rect x="14" y="31" width="36" height="3" fill="#E7A54A" />
            <rect x="14" y="10" width="3" height="24" fill="#FFD166" />
            <rect x="47" y="10" width="3" height="24" fill="#FFD166" />
            <rect x="28" y="18" width="8" height="8" fill="#38BDF8" />
            <rect x="30" y="20" width="4" height="4" fill="#FFFFFF" />
          </g>
        ) : room.encounterSubject?.archetype === 'BLACKSMITH_FORGE' ? (
          /* ===================================================================
             ANVIL OF THE BLIND SMITH (Yunque del Herrero Ciego)
             =================================================================== */
          <g>
            {/* Blazing Coal Furnace & Heavy Iron Anvil */}
            <rect x="10" y="28" width="18" height="22" fill="#1F120E" />
            <rect x="12" y="32" width="14" height="10" fill="#EA580C" />
            <rect x="14" y="34" width="10" height="6" fill="#FDE047" />
            {/* Master Blacksmith & Raised Forging Hammer */}
            <g transform={`translate(0, ${breathY})`}>
              <rect x="28" y="12" width="20" height="38" fill="#1E293B" />
              <rect x="30" y="14" width="16" height="34" fill="#7C2D12" />
              <rect x="32" y="6" width="12" height="10" fill="#475569" />
              <rect x="33" y="9" width="10" height="3" fill="#E2E8F0" />
            </g>
            <rect x="24" y="36" width="26" height="8" fill="#475569" />
            <rect x="26" y="35" width="22" height="2" fill="#F97316" />
          </g>
        ) : room.encounterSubject?.archetype === 'MECHANICAL_TRAP' || rType === 'TRAP' ? (
          /* ===================================================================
             BLADE & GEAR AUTOMATON TRAP (Autómata de Cuchillas y Cadenas)
             =================================================================== */
          <g>
            <rect x="16" y="26" width="32" height="24" fill="#1E293B" />
            <rect x="20" y="28" width="24" height="20" fill="#334155" />
            {/* Swinging Pendulum Scythe Blades */}
            <g transform={`translate(${lanternSwingX * 2}, 0)`}>
              <rect x="30" y="4" width="4" height="24" fill="#64748B" />
              <rect x="14" y="22" width="36" height="6" fill="#CBD5E1" />
              <rect x="12" y="26" width="40" height="2" fill="#E11D48" />
            </g>
          </g>
        ) : room.encounterSubject?.archetype === 'ANCIENT_SEAL' || rType === 'PUZZLE' ? (
          /* ===================================================================
             TRIAD OF RUNIC OBELISKS (Tríada de Obeliscos Rúnicos)
             =================================================================== */
          <g transform={`translate(0, ${breathY})`}>
            {[12, 26, 40].map((ox, idx) => (
              <g key={ox}>
                <rect x={ox} y={idx === 1 ? 8 : 14} width="12" height={idx === 1 ? 42 : 36} fill="#1E1B4B" />
                <rect x={ox + 2} y={idx === 1 ? 10 : 16} width="8" height={idx === 1 ? 38 : 32} fill="#312E81" />
                <rect
                  x={ox + 4}
                  y={idx === 1 ? 16 : 22}
                  width="4"
                  height="14"
                  fill={idx === 0 ? '#FFD166' : idx === 1 ? '#C084FC' : '#38BDF8'}
                />
              </g>
            ))}
          </g>
        ) : room.encounterSubject?.archetype === 'INJURED_HOUND' ? (
          /* ===================================================================
             HIGH-DENSITY LOYAL INJURED CRYPT HOUND (4-Tone Fur, Collar & Bandage)
             =================================================================== */
          <g>
            {/* Wagging Tufted Tail */}
            <g transform={`translate(${tick % 2}, ${breathY})`}>
              <rect x="9" y="25" width="8" height="5" fill="#1C140F" />
              <rect x="10" y="26" width="7" height="3" fill="#594233" />
              <rect x="11" y="26" width="4" height="2" fill="#7D5E4A" />
            </g>

            {/* Muscular Hound Ribcage, Haunches & Studded Brass Collar */}
            <g transform={`translate(0, ${breathY})`}>
              <rect x="15" y="26" width="28" height="15" fill="#1C140F" />
              <rect x="16" y="27" width="26" height="13" fill="#423024" />
              <rect x="18" y="28" width="22" height="10" fill="#634A39" />
              <rect x="20" y="28" width="16" height="5" fill="#82634D" />
              {/* Studded Brass Hound Collar */}
              <rect x="36" y="24" width="6" height="12" fill="#8C583A" />
              <rect x="37" y="25" width="4" height="10" fill="#E7A54A" />
              <rect x="38" y="27" width="2" height="2" fill="#FFF3C4" />
              <rect x="38" y="31" width="2" height="2" fill="#FFF3C4" />
            </g>

            {/* Hind Legs & Paws + Bandaged Injured Foreleg */}
            <rect x="17" y="39" width="6" height="11" fill="#2B1F17" />
            <rect x="18" y="40" width="4" height="9" fill="#4A3628" />
            <rect x="17" y="48" width="7" height="2" fill="#634A39" />

            <rect x="31" y="39" width="6" height="11" fill="#2B1F17" />
            <rect x="32" y="40" width="4" height="9" fill="#4A3628" />
            <rect x="31" y="48" width="7" height="2" fill="#634A39" />

            {/* Linen Bandage Wrapped Around Injured Right Foreleg */}
            <rect x="38" y="38" width="6" height="11" fill="#1C140F" />
            <rect x="39" y="39" width="5" height="9" fill="#E8DFCE" />
            <rect x="40" y="40" width="3" height="7" fill="#FFF8EC" />
            <rect x="40" y="42" width="3" height="2" fill="#C93B5B" />

            {/* Articulated Wolfhound Head, Pointed Ears, Snout & Panting Tongue */}
            <g transform={`translate(${lookX}, ${breathY})`}>
              {/* Pointed Ears */}
              <rect x="36" y="12" width="5" height="6" fill="#1C140F" />
              <rect x="37" y="13" width="3" height="5" fill="#594233" />
              <rect x="41" y="13" width="4" height="5" fill="#1C140F" />
              <rect x="42" y="14" width="2" height="4" fill="#594233" />
              {/* Cranium & Long Snout */}
              <rect x="37" y="17" width="17" height="10" fill="#1C140F" />
              <rect x="38" y="18" width="15" height="8" fill="#594233" />
              <rect x="39" y="18" width="12" height="5" fill="#7D5E4A" />
              <rect x="51" y="18" width="3" height="3" fill="#120D0A" />
              {/* Warm Loyal Amber Eye */}
              <rect x="43" y="19" width="4" height="3" fill="#120D0A" />
              <rect x="44" y="19" width="3" height="2" fill="#FFD166" />
              <rect x="45" y="19" width="1" height="1" fill="#FFFFFF" />
              {/* Panting Lower Jaw & Pink Tongue */}
              <rect
                x="40"
                y={26 + (tick % 2)}
                width="11"
                height="4"
                fill="#2B1F17"
              />
              <rect
                x="47"
                y={27 + (tick % 2)}
                width="4"
                height="4"
                fill="#FF758F"
              />
            </g>
          </g>
        ) : (
          /* ===================================================================
             HIGH-DENSITY MYSTERIOUS EVENT SEER / RUNIC PILGRIM KEEPER
             =================================================================== */
          <g>
            {/* Tall Runic Astrolabe Staff & Swaying Soul-Incense Censer */}
            <g transform={`translate(0, ${handY})`}>
              <rect x="46" y="7" width="4" height="44" fill="#1F120B" />
              <rect x="47" y="8" width="2" height="42" fill="#8C583A" />
              {/* Ornate Finial Ring & Floating Crystal */}
              <rect x="43" y="3" width="10" height="8" fill="#2A1C0E" />
              <rect x="44" y="4" width="8" height="6" fill={trimColor} />
              <rect x="46" y="5" width="4" height="4" fill="#FFF8EC" />
              {/* Left Hand Chain & Glowing Censer */}
              <rect x="13" y="21" width="2" height="5" fill="#8E96A4" />
              <rect x="10" y="25" width="8" height="9" fill="#1F160D" />
              <rect x="11" y="26" width="6" height="7" fill={trimColor} />
              <rect x="12" y="27" width="4" height="4" fill={glowColor} />
              <rect x="13" y="28" width="2" height="2" fill="#FFF8EC" />
            </g>

            {/* Layered Pilgrim Vestments, Embroidered Stole & Rune Cloak */}
            <g transform={`translate(0, ${breathY})`}>
              <rect x="17" y="18" width="28" height="33" fill="#09070F" />
              <rect x="18" y="19" width="26" height="31" fill={cloakShadow} />
              <rect x="19" y="19" width="24" height="29" fill={cloakColor} />
              <rect x="21" y="20" width="20" height="27" fill={cloakLight} />
              <rect x="23" y="21" width="16" height="28" fill="#120D1C" />
              {/* Twin Golden Ritual Stoles with Rune Marks */}
              <rect x="23" y="20" width="3" height="29" fill={trimColor} />
              <rect x="36" y="20" width="3" height="29" fill={trimColor} />
              <rect x="28" y="24" width="6" height="14" fill={glowColor} opacity="0.85" />
              <rect x="29" y="26" width="4" height="10" fill="#FFF8EC" opacity="0.65" />
            </g>

            {/* Deep Cowl, Runic Brow Crown & Cursor-Tracking Oracle Eyes */}
            <g transform={`translate(${lookX}, ${breathY})`}>
              <rect x="20" y="5" width="22" height="14" fill="#09070F" />
              <rect x="21" y="6" width="20" height="13" fill={cloakShadow} />
              <rect x="22" y="6" width="18" height="11" fill={cloakColor} />
              <rect x="24" y="8" width="14" height="3" fill={trimColor} />
              <rect x="24" y="11" width="14" height="7" fill="#07050C" />
              {tick !== 9 && (
                <g>
                  <rect x={26 + lookX} y="13" width="3" height="2" fill={glowColor} />
                  <rect x={33 + lookX} y="13" width="3" height="2" fill={glowColor} />
                  <rect x={27 + lookX} y="13" width="1" height="1" fill="#FFFFFF" />
                  <rect x={34 + lookX} y="13" width="1" height="1" fill="#FFFFFF" />
                </g>
              )}
            </g>
          </g>
        )}
      </svg>
    </div>
  );
};

