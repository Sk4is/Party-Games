import React, { useEffect, useMemo, useState } from 'react';
import {
  CriptaCreatureVisualBlueprint,
  CriptaUniqueCreatureModelId,
} from '../../../data/la-cripta/criptaBiomeBestiary';

export type EnemyVisualScaleClass =
  | 'TINY'
  | 'SMALL'
  | 'MEDIUM'
  | 'LARGE'
  | 'HUGE'
  | 'COLOSSAL';

export type EnemyIdleAnimationType =
  | 'MUSHROOM_SQUASH'
  | 'SKELETON_SWAY'
  | 'HEAVY_KNIGHT_SHIFT'
  | 'WOLF_PROWL'
  | 'MIRROR_GLITCH'
  | 'RAT_SNIFF'
  | 'SLIME_PULSE'
  | 'BAT_FLAP'
  | 'INSECT_SCUTTLE'
  | 'SERPENT_COIL'
  | 'SHAMAN_RITUAL'
  | 'GHOST_DRIFT'
  | 'CONSTRUCT_PISTON'
  | 'GOBLIN_CROUCH'
  | 'COLOSSUS_BREATH'
  | 'JESTER_SWAY'
  | 'BOOK_FLUTTER'
  | 'MINER_HEAVE'
  | 'FLAME_SPIRIT';

export type EnemyParticleEffectType =
  | 'SPORES'
  | 'MIST'
  | 'SOUL_FLAME'
  | 'MIRROR_SHARDS'
  | 'SONIC_RINGS'
  | 'EMBERS'
  | 'BUBBLES'
  | 'VOID_MOTES'
  | 'SAND_DUST'
  | 'FROST_CRYSTALS'
  | 'BLOOD_DROPS'
  | 'LIGHTNING_SPARKS'
  | 'COLOSSUS_DUST'
  | 'STEAM_EMBERS'
  | 'FROST_BREATH'
  | 'NONE';

export interface AuthoredEnemyVisualDefinition {
  id: CriptaUniqueCreatureModelId;
  /**
   * Cohesive, connected pixel-art sprite matrix.
   * Each character maps to the creature's palette:
   *  '.' or ' ' = transparent
   *  '#' = dark pixel outline / deep recess
   *  '1' = primary creature color (mid-tone)
   *  '2' = secondary / deep shadow color (dark torso / under-armor)
   *  '3' = highlight / rim edge accent color
   *  '4' = metal / chitin / wood / structural color
   *  '5' = eye glow / magical core color
   *  '6' = bone / ivory / fang / reflection white (#F1F5F9)
   *  '7' = crimson / blood / magma accent (#E11D48)
   *  '8' = toxic / spore / emerald accent (#22C55E)
   *  '9' = royal gold / brass / amber accent (#F59E0B)
   */
  rows: string[];
  idleType: EnemyIdleAnimationType;
  effectType: EnemyParticleEffectType;
  /**
   * Legacy / base scale multiplier
   */
  scaleMultiplier: number;
  /**
   * Width of ground shadow beneath feet/paws/body in logical pixel units
   */
  groundShadowWidth: number;
  /**
   * Explicit visual size class (TINY, SMALL, MEDIUM, LARGE, HUGE, COLOSSAL)
   */
  visualScaleClass?: EnemyVisualScaleClass;
  /**
   * Hierarchical visual scale relative to MEDIUM (1.00):
   * TINY: 0.72-0.78 | SMALL: 0.80-0.90 | MEDIUM: 1.00 | LARGE: 1.15-1.32 | HUGE: 1.42-1.64 | COLOSSAL: 1.80-2.10
   */
  visualScale?: number;
  /**
   * Vertical offset from the ground line in canvas pixel units (negative floats higher)
   */
  groundOffset?: number;
  /**
   * Proportional shadow width multiplier relative to MEDIUM humanoid
   */
  shadowWidth?: number;
  /**
   * Optional vertical presence bias for wide quadrupeds or towering skeletons
   */
  visualHeightBias?: number;
  /**
   * True ONLY for supernatural entities whose concept is intentional fragmentation/levitation
   */
  allowsSupernaturalFloat?: boolean;
}

export interface ResolvedEnemyVisualMetadata {
  id: CriptaUniqueCreatureModelId;
  visualScaleClass: EnemyVisualScaleClass;
  visualScale: number;
  groundOffset: number;
  shadowWidth: number;
  spriteAspectRatio: number;
  visualHeightBias: number;
  canvasWidthPx: number;
  canvasHeightPx: number;
  croppedWidthPx: number;
  croppedHeightPx: number;
}

/**
 * Explicit size class & scale overrides for specific creatures so size hierarchy
 * comes from creature design rather than HP alone (Requirements 3, 4, 5, 27).
 */
const EXPLICIT_CREATURE_SCALE_OVERRIDES: Partial<
  Record<
    CriptaUniqueCreatureModelId,
    {
      visualScaleClass: EnemyVisualScaleClass;
      visualScale: number;
      shadowWidth: number;
      groundOffset?: number;
      visualHeightBias?: number;
    }
  >
> = {
  // TINY (0.72 - 0.78)
  ALCANTARILLAS_RATA_PESTE: {
    visualScaleClass: 'TINY',
    visualScale: 0.74,
    shadowWidth: 0.72,
  },
  JARDIN_MOSCA_CARRONERA: {
    visualScaleClass: 'TINY',
    visualScale: 0.75,
    shadowWidth: 0.65,
    groundOffset: -4,
  },
  COLMENA_ESCARABAJO_ACIDO: {
    visualScaleClass: 'TINY',
    visualScale: 0.78,
    shadowWidth: 0.76,
  },
  ABISMO_LARVA_ESTELAR: {
    visualScaleClass: 'TINY',
    visualScale: 0.78,
    shadowWidth: 0.78,
  },

  // SMALL (0.80 - 0.90)
  MINAS_ARANUELO_FILON: {
    visualScaleClass: 'SMALL',
    visualScale: 0.82,
    shadowWidth: 0.85,
  },
  BOSQUE_FUEGO_FATUO: {
    visualScaleClass: 'SMALL',
    visualScale: 0.82,
    shadowWidth: 0.68,
    groundOffset: -5,
  },
  BIBLIOTECA_GRIMORIO_ANIMADO: {
    visualScaleClass: 'SMALL',
    visualScale: 0.86,
    shadowWidth: 0.74,
    groundOffset: -4,
  },
  'CATACUMBAS_ ENJAMBRE_SEPULCRAL': {
    visualScaleClass: 'SMALL',
    visualScale: 0.84,
    shadowWidth: 0.92,
  },
  MINAS_MURCIELAGO_SONICO: {
    visualScaleClass: 'SMALL',
    visualScale: 0.88,
    shadowWidth: 0.78,
    groundOffset: -4,
  },
  CRISTAL_FRAGMENTO_RESONANTE: {
    visualScaleClass: 'SMALL',
    visualScale: 0.86,
    shadowWidth: 0.72,
    groundOffset: -4,
  },
  HELADAS_TREPADOR_CARAMBANO: {
    visualScaleClass: 'SMALL',
    visualScale: 0.86,
    shadowWidth: 0.88,
  },
  CIUDAD_ESCARABAJO_LAPISLAZULI: {
    visualScaleClass: 'SMALL',
    visualScale: 0.86,
    shadowWidth: 0.88,
  },
  GIGANTES_MANO_DESENTERRADA: {
    visualScaleClass: 'SMALL',
    visualScale: 0.90,
    shadowWidth: 0.95,
  },

  // MEDIUM (1.00 - 1.08)
  MINAS_MINERO_DESCASCARADO: {
    visualScaleClass: 'MEDIUM',
    visualScale: 1.02,
    shadowWidth: 1.0,
  },
  BIBLIOTECA_ESCRIBA_SIN_ROSTRO: {
    visualScaleClass: 'MEDIUM',
    visualScale: 1.02,
    shadowWidth: 0.96,
  },
  ESPEJOS_BUfON_ILUSION: {
    visualScaleClass: 'MEDIUM',
    visualScale: 1.02,
    shadowWidth: 0.98,
  },
  HELADAS_ESPECTRO_VENTISCA: {
    visualScaleClass: 'MEDIUM',
    visualScale: 1.04,
    shadowWidth: 0.95,
    groundOffset: -3,
  },
  SANGRE_FLAGELANTE_CALIZ: {
    visualScaleClass: 'MEDIUM',
    visualScale: 1.02,
    shadowWidth: 1.0,
  },
  'SANGRE_ SIERVO_DESANGRADO': {
    visualScaleClass: 'MEDIUM',
    visualScale: 1.0,
    shadowWidth: 0.96,
  },
  CATACUMBAS_ACOLITO_HUESO: {
    visualScaleClass: 'MEDIUM',
    visualScale: 1.0,
    shadowWidth: 0.95,
  },
  JARDIN_HONGO_ERRANTE: {
    visualScaleClass: 'MEDIUM',
    visualScale: 1.0,
    shadowWidth: 0.98,
  },
  ESPEJOS_DOBLE_FRAGMENTADO: {
    visualScaleClass: 'MEDIUM',
    visualScale: 1.04,
    shadowWidth: 0.96,
  },

  // LARGE (1.15 - 1.32)
  FORJA_HERRERO_CENIZA: {
    visualScaleClass: 'LARGE',
    visualScale: 1.16,
    shadowWidth: 1.15,
  },
  BOSQUE_LOBO_NIEBLA: {
    visualScaleClass: 'LARGE',
    visualScale: 1.22,
    shadowWidth: 1.38,
    visualHeightBias: 1.04,
  },
  HELADAS_LOBO_ESCARCHA: {
    visualScaleClass: 'LARGE',
    visualScale: 1.28,
    shadowWidth: 1.44,
    visualHeightBias: 1.06,
  },
  FORJA_AUTOMA_ESCORIA: {
    visualScaleClass: 'LARGE',
    visualScale: 1.30,
    shadowWidth: 1.32,
    visualHeightBias: 1.05,
  },
  CATACUMBAS_GUARDIAN_CRIPTAS: {
    visualScaleClass: 'LARGE',
    visualScale: 1.18,
    shadowWidth: 1.18,
  },
  TEMPLO_GUARDIAN_CORAL: {
    visualScaleClass: 'LARGE',
    visualScale: 1.24,
    shadowWidth: 1.24,
  },
  BOSQUE_CIERVO_OSAMENTA: {
    visualScaleClass: 'LARGE',
    visualScale: 1.22,
    shadowWidth: 1.34,
  },
  VERDUGO_SABUESO_CADENAS: {
    visualScaleClass: 'LARGE',
    visualScale: 1.20,
    shadowWidth: 1.35,
  },

  // HUGE (1.42 - 1.64)
  JARDIN_COLOSO_MICELIO: {
    visualScaleClass: 'HUGE',
    visualScale: 1.44,
    shadowWidth: 1.38,
  },
  BOSQUE_ANCIANO_CORTEZA: {
    visualScaleClass: 'HUGE',
    visualScale: 1.44,
    shadowWidth: 1.38,
  },
  ALCANTARILLAS_ABOMINACION_FANGO: {
    visualScaleClass: 'HUGE',
    visualScale: 1.42,
    shadowWidth: 1.40,
  },
  HELADAS_TROLL_GLACIAR: {
    visualScaleClass: 'HUGE',
    visualScale: 1.45,
    shadowWidth: 1.40,
  },
  GIGANTES_TITAN_DECAPITADO: {
    visualScaleClass: 'HUGE',
    visualScale: 1.54,
    shadowWidth: 1.46,
  },
  GIGANTES_GUARDIAN_FOSA: {
    visualScaleClass: 'HUGE',
    visualScale: 1.46,
    shadowWidth: 1.38,
  },

  // COLOSSAL (1.75 - 2.10) — Requirement 5: ESQUELETO COLOSAL MUST ACTUALLY BE COLOSSAL!
  GIGANTES_ESQUELETO_COLOSAL: {
    visualScaleClass: 'COLOSSAL',
    visualScale: 1.92,
    shadowWidth: 1.68,
    visualHeightBias: 1.08,
  },
  GIGANTES_COLOSO_FEMURES: {
    visualScaleClass: 'COLOSSAL',
    visualScale: 1.85,
    shadowWidth: 1.65,
  },
  GIGANTES_REY_OSARIO: {
    visualScaleClass: 'COLOSSAL',
    visualScale: 1.90,
    shadowWidth: 1.68,
  },
  FORJA_TITAN_CRISOL: {
    visualScaleClass: 'COLOSSAL',
    visualScale: 1.82,
    shadowWidth: 1.62,
  },
  TEMPLO_LEVIATAN_ALTAR: {
    visualScaleClass: 'COLOSSAL',
    visualScale: 1.84,
    shadowWidth: 1.65,
  },
  CRISTAL_COLOSO_PRISMATICO: {
    visualScaleClass: 'COLOSSAL',
    visualScale: 1.82,
    shadowWidth: 1.60,
  },
  HELADAS_BEHEMOTH_PERMAFROST: {
    visualScaleClass: 'COLOSSAL',
    visualScale: 1.85,
    shadowWidth: 1.68,
  },
  HELADAS_SENOR_ALUD: {
    visualScaleClass: 'COLOSSAL',
    visualScale: 1.84,
    shadowWidth: 1.64,
  },
  ABISMO_CORAZON_CRIPTAS: {
    visualScaleClass: 'COLOSSAL',
    visualScale: 1.88,
    shadowWidth: 1.66,
  },
  FINAL_BOSS_SOBERANO_P1: {
    visualScaleClass: 'COLOSSAL',
    visualScale: 1.94,
    shadowWidth: 1.72,
  },
  FINAL_BOSS_SOBERANO_P2: {
    visualScaleClass: 'COLOSSAL',
    visualScale: 2.08,
    shadowWidth: 1.85,
  },
  FINAL_BOSS_OSSUARY_KING_P1: {
    visualScaleClass: 'COLOSSAL',
    visualScale: 1.96,
    shadowWidth: 1.74,
  },
  FINAL_BOSS_OSSUARY_KING_P2: {
    visualScaleClass: 'COLOSSAL',
    visualScale: 2.10,
    shadowWidth: 1.88,
  },
  FINAL_BOSS_ASTRAL_LEVIATHAN_P1: {
    visualScaleClass: 'COLOSSAL',
    visualScale: 1.94,
    shadowWidth: 1.72,
  },
  FINAL_BOSS_ASTRAL_LEVIATHAN_P2: {
    visualScaleClass: 'COLOSSAL',
    visualScale: 2.08,
    shadowWidth: 1.86,
  },
};

/**
 * Compiles a sprite's row matrix into a true 1:1 square-pixel matrix.
 * For compact 11-20 row matrices that were authored with 2-character horizontal pairs,
 * applies a pixel-art 2x vertical pass with diagonal corner beveling and directional
 * material shading so sprites never appear vertically compressed ("squashed") and
 * every rendered pixel is strictly 1:1 square.
 */
export function compileSquarePixelMatrix(visualDef: AuthoredEnemyVisualDefinition): {
  rows: string[];
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  croppedWidth: number;
  croppedHeight: number;
} {
  const rawRows = visualDef.rows || [];
  if (rawRows.length === 0) {
    return {
      rows: ['.'],
      minX: 0,
      maxX: 0,
      minY: 0,
      maxY: 0,
      croppedWidth: 1,
      croppedHeight: 1,
    };
  }

  const maxCol = Math.max(...rawRows.map((r) => r.length), 1);
  const normalizedRaw = rawRows.map((r) => r.padEnd(maxCol, '.').replace(/ /g, '.'));

  // If the sprite has < 22 rows, it was authored in 2:1 horizontal character pairs.
  // Expand vertically with EPX / pixel-art diagonal beveling & top-down shading so
  // its 1:1 square pixel aspect ratio has true anatomical height and +20% internal detail.
  let finalRows: string[];
  if (normalizedRaw.length < 22) {
    const H = normalizedRaw.length;
    const W = maxCol;
    const at = (y: number, x: number): string => {
      if (y < 0 || y >= H || x < 0 || x >= W) return '.';
      return normalizedRaw[y][x] || '.';
    };

    const expanded: string[] = [];
    for (let y = 0; y < H; y++) {
      let rowA = '';
      let rowB = '';
      for (let x = 0; x < W; x++) {
        const C = at(y, x);
        const U = at(y - 1, x);
        const D = at(y + 1, x);
        const L = at(y, x - 1);
        const R = at(y, x + 1);
        const UL = at(y - 1, x - 1);
        const UR = at(y - 1, x + 1);
        const DL = at(y + 1, x - 1);
        const DR = at(y + 1, x + 1);

        let topPx = C;
        let botPx = C;

        if (C === '.') {
          // Smooth 45-degree outer outline diagonals (eliminates 2-wide staircase blocks)
          if (U === '#' && ((L === '#' && UL === '.') || (R === '#' && UR === '.'))) {
            topPx = '#';
          }
          if (D === '#' && ((L === '#' && DL === '.') || (R === '#' && DR === '.'))) {
            botPx = '#';
          }
        } else if (C === '1') {
          // Natural material separation (Requirement 8 & 9):
          // Top edge under outline catches subtle highlight; bottom edge above outline deepens into shadow
          if (U === '#' && D === '1' && L !== '.' && R !== '.') {
            topPx = '3';
          } else if (D === '#' && U !== '#') {
            botPx = '2';
          }
        } else if (C === '4') {
          // Metallic / chitin edge specular & lower shadow
          if (D === '#' && U === '4') {
            botPx = '2';
          }
        }

        rowA += topPx;
        rowB += botPx;
      }
      expanded.push(rowA);
      expanded.push(rowB);
    }
    finalRows = expanded;
  } else {
    finalRows = normalizedRaw;
  }

  let minX = maxCol;
  let maxX = 0;
  let minY = finalRows.length;
  let maxY = 0;
  let foundAny = false;

  for (let y = 0; y < finalRows.length; y++) {
    const r = finalRows[y];
    for (let x = 0; x < r.length; x++) {
      const ch = r[x];
      if (ch !== '.' && ch !== ' ') {
        foundAny = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (!foundAny) {
    return {
      rows: finalRows,
      minX: 0,
      maxX: maxCol - 1,
      minY: 0,
      maxY: finalRows.length - 1,
      croppedWidth: maxCol,
      croppedHeight: finalRows.length,
    };
  }

  return {
    rows: finalRows,
    minX,
    maxX,
    minY,
    maxY,
    croppedWidth: Math.max(1, maxX - minX + 1),
    croppedHeight: Math.max(1, maxY - minY + 1),
  };
}

/**
 * Resolves the complete visual scale metadata for any enemy in the bestiary.
 */
export function getResolvedEnemyVisualMeta(
  id: CriptaUniqueCreatureModelId,
  blueprint?: CriptaCreatureVisualBlueprint,
  visualDef?: AuthoredEnemyVisualDefinition
): ResolvedEnemyVisualMetadata {
  const explicit = EXPLICIT_CREATURE_SCALE_OVERRIDES[id];
  const compiled = visualDef
    ? compileSquarePixelMatrix(visualDef)
    : {
        croppedWidth: 28,
        croppedHeight: 28,
      };

  // Determine size class & scale when not in explicit override table
  let visualScaleClass: EnemyVisualScaleClass =
    explicit?.visualScaleClass || visualDef?.visualScaleClass || 'MEDIUM';
  let visualScale: number = explicit?.visualScale || visualDef?.visualScale || 1.0;

  if (!explicit && !visualDef?.visualScaleClass) {
    const mult = visualDef?.scaleMultiplier ?? blueprint?.scaleFactor ?? 1.24;
    if (blueprint?.tier === 'FINAL_BOSS' || mult >= 1.82) {
      visualScaleClass = 'COLOSSAL';
      visualScale = 1.90;
    } else if (blueprint?.tier === 'MINIBOSS' || mult >= 1.65) {
      visualScaleClass = 'HUGE';
      visualScale = 1.54;
    } else if (mult >= 1.38) {
      visualScaleClass = 'LARGE';
      visualScale = 1.24;
    } else if (mult <= 1.12) {
      visualScaleClass = 'TINY';
      visualScale = 0.76;
    } else if (mult <= 1.21) {
      visualScaleClass = 'SMALL';
      visualScale = 0.86;
    } else {
      visualScaleClass = 'MEDIUM';
      visualScale = 1.02;
    }
  }

  const isQuadrupedOrWide =
    visualDef?.idleType === 'WOLF_PROWL' ||
    visualDef?.idleType === 'SERPENT_COIL' ||
    compiled.croppedWidth > compiled.croppedHeight * 1.22;

  const shadowWidth =
    explicit?.shadowWidth ??
    visualDef?.shadowWidth ??
    (visualScaleClass === 'COLOSSAL'
      ? 1.65
      : visualScaleClass === 'HUGE'
      ? 1.42
      : isQuadrupedOrWide
      ? 1.34
      : visualScaleClass === 'LARGE'
      ? 1.20
      : visualScaleClass === 'SMALL'
      ? 0.82
      : visualScaleClass === 'TINY'
      ? 0.70
      : 1.0);

  const groundOffset =
    explicit?.groundOffset ??
    visualDef?.groundOffset ??
    (visualDef?.idleType === 'GHOST_DRIFT' ||
    visualDef?.idleType === 'BAT_FLAP' ||
    visualDef?.idleType === 'BOOK_FLUTTER' ||
    visualDef?.idleType === 'FLAME_SPIRIT'
      ? -3
      : 0);

  const visualHeightBias =
    explicit?.visualHeightBias ??
    visualDef?.visualHeightBias ??
    (isQuadrupedOrWide ? 1.04 : 1.0);

  // Compute tight 1:1 pixel canvas dimensions around the cropped creature
  const padX = 4;
  const padTop = 4;
  const padBottom = 4;
  const canvasWidthPx = Math.max(compiled.croppedWidth + padX * 2, 24);
  const canvasHeightPx = Math.max(compiled.croppedHeight + padTop + padBottom, 24);
  const spriteAspectRatio = Number((canvasWidthPx / canvasHeightPx).toFixed(4));

  return {
    id,
    visualScaleClass,
    visualScale,
    groundOffset,
    shadowWidth,
    spriteAspectRatio,
    visualHeightBias,
    canvasWidthPx,
    canvasHeightPx,
    croppedWidthPx: compiled.croppedWidth,
    croppedHeightPx: compiled.croppedHeight,
  };
}

/**
 * Validates a creature's pixel matrix for broken/disconnected rows and audits the
 * entire 166-enemy registry for duplicate sprites in development mode.
 */
export function auditEnemyVisualRegistry(
  registry: Partial<Record<CriptaUniqueCreatureModelId, AuthoredEnemyVisualDefinition>>,
  allExpectedIds: CriptaUniqueCreatureModelId[]
): {
  missingIds: CriptaUniqueCreatureModelId[];
  duplicatePairs: Array<[CriptaUniqueCreatureModelId, CriptaUniqueCreatureModelId]>;
  disconnectedIds: CriptaUniqueCreatureModelId[];
} {
  const missingIds: CriptaUniqueCreatureModelId[] = [];
  const duplicatePairs: Array<[CriptaUniqueCreatureModelId, CriptaUniqueCreatureModelId]> = [];
  const disconnectedIds: CriptaUniqueCreatureModelId[] = [];
  const signatureMap = new Map<string, CriptaUniqueCreatureModelId>();

  for (const id of allExpectedIds) {
    const def = registry[id];
    if (!def || !def.rows || def.rows.length === 0) {
      missingIds.push(id);
      if (import.meta.env.DEV) {
        console.warn(`[MISSING ENEMY VISUAL] ${id}`);
      }
      continue;
    }

    const normalizedSig = def.rows.map((r) => r.trim()).join('\n');
    const existingOwner = signatureMap.get(normalizedSig);
    if (existingOwner && existingOwner !== id) {
      duplicatePairs.push([existingOwner, id]);
      if (import.meta.env.DEV) {
        console.warn(
          `[ENEMY VISUAL DUPLICATION] ${existingOwner} and ${id} are referencing the same visual asset.`
        );
      }
    } else {
      signatureMap.set(normalizedSig, id);
    }

    if (!def.allowsSupernaturalFloat) {
      let seenTop = false;
      let seenGapAfterTop = false;
      for (const row of def.rows) {
        const hasPixels = /[^.\s]/.test(row);
        if (hasPixels && !seenTop) {
          seenTop = true;
        } else if (!hasPixels && seenTop) {
          seenGapAfterTop = true;
        } else if (hasPixels && seenGapAfterTop) {
          disconnectedIds.push(id);
          if (import.meta.env.DEV) {
            console.warn(
              `[BROKEN ANATOMY WARNING] ${id} has disconnected empty rows between body parts without allowsSupernaturalFloat.`
            );
          }
          break;
        }
      }
    }
  }

  return { missingIds, duplicatePairs, disconnectedIds };
}

/**
 * Renders a cohesive, grounded pixel-art sprite from `AuthoredEnemyVisualDefinition`.
 * Uses a tight 1:1 square-pixel coordinate space (`canvasWidthPx` x `canvasHeightPx`)
 * so that source aspect ratio === rendered aspect ratio with zero vertical squashing.
 */
export const AuthoredEnemySpriteSvg: React.FC<{
  blueprint: CriptaCreatureVisualBlueprint;
  visualDef?: AuthoredEnemyVisualDefinition;
  torsoY: number;
  headY: number;
  armL: number;
  armR: number;
  wingSpread: number;
  pulse: boolean;
  silhouetteBlackMode?: boolean;
}> = ({
  blueprint,
  visualDef,
  torsoY,
  wingSpread,
  pulse,
  silhouetteBlackMode = false,
}) => {
  const [particlePhase, setParticlePhase] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      setParticlePhase((now - start) / 1000);
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, []);

  const compiled = useMemo(
    () => (visualDef ? compileSquarePixelMatrix(visualDef) : null),
    [visualDef]
  );

  const meta = useMemo(
    () => getResolvedEnemyVisualMeta(blueprint.id, blueprint, visualDef),
    [blueprint, visualDef]
  );

  if (!visualDef || !compiled) {
    return (
      <svg viewBox="0 0 64 60" className="w-full h-full overflow-visible">
        <rect x="4" y="10" width="56" height="40" fill="#450A0A" stroke="#EF4444" strokeWidth="2" />
        <text x="32" y="28" textAnchor="middle" fill="#FCA5A5" fontSize="5" fontFamily="monospace">
          [MISSING ENEMY VISUAL]
        </text>
        <text x="32" y="38" textAnchor="middle" fill="#FFFFFF" fontSize="4.5" fontFamily="monospace">
          {blueprint.id}
        </text>
      </svg>
    );
  }

  const { primary, secondary, highlight, eyeGlow, metal } = blueprint.palette;
  const palMap: Record<string, string> = silhouetteBlackMode
    ? {
        '#': '#000000',
        '1': '#000000',
        '2': '#000000',
        '3': '#000000',
        '4': '#000000',
        '5': '#000000',
        '6': '#000000',
        '7': '#000000',
        '8': '#000000',
        '9': '#000000',
      }
    : {
        '#': '#06050A',
        '1': primary,
        '2': secondary,
        '3': highlight,
        '4': metal,
        '5': pulse ? '#FFFFFF' : eyeGlow,
        '6': '#F1F5F9',
        '7': '#E11D48',
        '8': '#22C55E',
        '9': '#F59E0B',
      };

  const { rows, minX, minY, croppedWidth, croppedHeight } = compiled;
  const { canvasWidthPx, canvasHeightPx, groundOffset } = meta;

  // Ground anchor is near the bottom of the tight canvas
  const groundY = canvasHeightPx - 3;
  const baseOffsetX = Math.round((canvasWidthPx - croppedWidth) / 2);
  const baseOffsetY = Math.round(groundY - croppedHeight + groundOffset * 0.5);

  // Creature-scale-aware idle animation (Requirement 19: small = light/fast, heavy = slow/weighted, colossal = very slow mass)
  let animOffsetX = 0;
  let animOffsetY = 0;
  let topHalfSquashY = 0;
  let hatTipShiftX = 0;
  let rightWeaponShiftY = 0;

  switch (visualDef.idleType) {
    case 'COLOSSUS_BREATH': {
      // Very slow, heavy mass breathing for Esqueleto Colosal & colossal titans (never bounces!)
      const slowCycle = Math.sin(particlePhase * 1.35);
      topHalfSquashY = slowCycle > 0.45 ? 1 : 0;
      rightWeaponShiftY = slowCycle > 0.25 ? 1 : 0;
      break;
    }
    case 'CONSTRUCT_PISTON': {
      // Heavy mechanical piston cycle + furnace breath + subtle chassis vibration
      const pistonCycle = Math.sin(particlePhase * 3.0);
      topHalfSquashY = pistonCycle > 0.2 ? 1 : 0;
      rightWeaponShiftY = pistonCycle < -0.2 ? 1 : 0;
      animOffsetX = Math.round(Math.sin(particlePhase * 14) * 0.35);
      break;
    }
    case 'JESTER_SWAY': {
      // Dark fantasy jester: subtle shoulder movement, independent hat tips & bells, slight head tilt
      const sway = Math.sin(particlePhase * 2.4);
      hatTipShiftX = sway > 0.35 ? 1 : sway < -0.35 ? -1 : 0;
      topHalfSquashY = Math.cos(particlePhase * 2.4) > 0.5 ? 1 : 0;
      rightWeaponShiftY = sway > 0 ? -1 : 0;
      break;
    }
    case 'BOOK_FLUTTER': {
      // Levitating spellbook: gently hovers while pages/covers open & close by 1px
      animOffsetY = Math.round(Math.sin(particlePhase * 3.4) * 1.5);
      topHalfSquashY = pulse ? -1 : 0;
      rightWeaponShiftY = wingSpread === 1 ? 1 : 0;
      break;
    }
    case 'FLAME_SPIRIT': {
      // Supernatural floating flame spirit: natural upward flame flicker & hover
      animOffsetY = Math.round(Math.sin(particlePhase * 4.2) * 1.8);
      animOffsetX = Math.round(Math.cos(particlePhase * 2.8) * 0.8);
      hatTipShiftX = Math.sin(particlePhase * 6.5) > 0 ? 1 : -1;
      break;
    }
    case 'MINER_HEAVE': {
      // Exhausted possessed miner: heavy chest breath + pickaxe weight shift
      topHalfSquashY = wingSpread === 2 ? 1 : 0;
      rightWeaponShiftY = wingSpread === 2 ? 1 : 0;
      break;
    }
    case 'MUSHROOM_SQUASH':
      topHalfSquashY = wingSpread === 2 ? 1 : 0;
      break;
    case 'WOLF_PROWL':
      // Predatory quadruped: low stalking chest breath + subtle forward prowl
      animOffsetX = wingSpread === 1 ? -0.5 : 0;
      topHalfSquashY = wingSpread === 2 ? 1 : 0;
      break;
    case 'RAT_SNIFF':
      animOffsetX = pulse ? -1 : 0;
      break;
    case 'SLIME_PULSE':
      topHalfSquashY = wingSpread === 1 ? 1 : wingSpread === 2 ? -0.5 : 0;
      break;
    case 'BAT_FLAP':
      animOffsetY = (wingSpread - 1) * 1.2;
      break;
    case 'GHOST_DRIFT':
      animOffsetY = Math.round(Math.sin(particlePhase * 3.0) * 1.6);
      animOffsetX = Math.round(Math.cos(particlePhase * 2.0) * 0.8);
      break;
    case 'MIRROR_GLITCH':
      animOffsetX = wingSpread === 2 && pulse ? 1 : 0;
      topHalfSquashY = wingSpread === 1 ? -0.5 : 0;
      break;
    case 'INSECT_SCUTTLE':
      animOffsetX = pulse ? 0.6 : -0.6;
      break;
    case 'SERPENT_COIL':
      animOffsetX = (wingSpread - 1) * 0.7;
      break;
    case 'HEAVY_KNIGHT_SHIFT':
    case 'SKELETON_SWAY':
    case 'SHAMAN_RITUAL':
    case 'GOBLIN_CROUCH':
    default:
      topHalfSquashY = wingSpread === 2 ? 1 : 0;
      break;
  }

  const totalOffsetX = baseOffsetX + animOffsetX;
  const totalOffsetY = baseOffsetY + animOffsetY + torsoY * 0.35;

  const rects: React.ReactNode[] = [];
  const capSplitRow = Math.floor(croppedHeight * 0.48);
  const hatSplitRow = Math.floor(croppedHeight * 0.22);
  const rightWeaponSplitCol = Math.floor(croppedWidth * 0.74);

  for (let cy = 0; cy < croppedHeight; cy++) {
    const srcY = minY + cy;
    const row = rows[srcY] || '';
    const rowShiftY = cy < capSplitRow ? topHalfSquashY : 0;
    const rowShiftX = cy < hatSplitRow ? hatTipShiftX : 0;

    let cx = 0;
    while (cx < croppedWidth) {
      const srcX = minX + cx;
      const ch = row[srcX];
      if (!ch || ch === '.' || ch === ' ') {
        cx++;
        continue;
      }
      const fill = palMap[ch];
      if (!fill) {
        cx++;
        continue;
      }
      let run = 1;
      while (cx + run < croppedWidth && row[minX + cx + run] === ch) {
        run++;
      }
      const colWeaponShiftY = cx >= rightWeaponSplitCol ? rightWeaponShiftY : 0;
      rects.push(
        <rect
          key={`${cy}_${cx}`}
          x={Number((totalOffsetX + cx + rowShiftX).toFixed(2))}
          y={Number((totalOffsetY + cy + rowShiftY + colWeaponShiftY).toFixed(2))}
          width={Number((run + 0.06).toFixed(2))}
          height={1.06}
          fill={fill}
        />
      );
      cx += run;
    }
  }

  // Floor shadow tailored to creature dimensions (Requirement 20)
  const shadowSpan = Math.min(
    canvasWidthPx - 2,
    Math.max(10, Math.round(croppedWidth * 0.86 * Math.min(1.18, meta.shadowWidth)))
  );
  const shadowX = Number(((canvasWidthPx - shadowSpan) / 2).toFixed(2));
  const shadowH = meta.visualScaleClass === 'COLOSSAL' ? 2.4 : meta.visualScaleClass === 'HUGE' ? 2.0 : 1.5;

  return (
    <svg
      viewBox={`0 0 ${canvasWidthPx} ${canvasHeightPx}`}
      preserveAspectRatio="xMidYMax meet"
      className="w-full h-full overflow-visible block select-none"
      style={{ imageRendering: 'pixelated' }}
      shapeRendering="crispEdges"
    >
      {/* Adaptive Grounding Shadow Plane (Requirement 20) */}
      {!silhouetteBlackMode && (
        <g>
          <rect
            x={shadowX}
            y={groundY}
            width={shadowSpan}
            height={shadowH}
            fill="#040307"
            opacity={meta.visualScaleClass === 'COLOSSAL' ? 0.92 : 0.82}
          />
          <rect
            x={shadowX + 2}
            y={groundY - 0.8}
            width={Math.max(4, shadowSpan - 4)}
            height={shadowH}
            fill="#07050C"
            opacity="0.65"
          />
          {(meta.visualScaleClass === 'COLOSSAL' ||
            blueprint.tier === 'MINIBOSS' ||
            blueprint.tier === 'FINAL_BOSS') && (
            <rect
              x={shadowX + 2}
              y={groundY + 0.3}
              width={Math.max(4, shadowSpan - 4)}
              height="0.9"
              fill={highlight}
              opacity={pulse ? 0.75 : 0.38}
            />
          )}
        </g>
      )}

      {/* Occasional Jester / Mirror Illusion Afterimage (Requirement 12) */}
      {!silhouetteBlackMode &&
        (visualDef.idleType === 'JESTER_SWAY' || visualDef.idleType === 'MIRROR_GLITCH') &&
        Math.sin(particlePhase * 2.4) > 0.55 && (
          <g transform="translate(-2.2, -0.5)" opacity="0.24">
            {rects}
          </g>
        )}

      {/* 60 FPS Smooth Environmental / Anatomy Particle Effects */}
      {!silhouetteBlackMode && (
        <EnemySmoothEffectsLayer
          effectType={visualDef.effectType}
          phase={particlePhase}
          canvasW={canvasWidthPx}
          canvasH={canvasHeightPx}
          groundY={groundY}
          primary={primary}
          highlight={highlight}
          eyeGlow={eyeGlow}
        />
      )}

      {/* Crisp 1:1 Square Pixel-Art Creature Body */}
      <g>{rects}</g>
    </svg>
  );
};

const EnemySmoothEffectsLayer: React.FC<{
  effectType: EnemyParticleEffectType;
  phase: number;
  canvasW: number;
  canvasH: number;
  groundY: number;
  primary: string;
  highlight: string;
  eyeGlow: string;
}> = ({ effectType, phase, canvasW, canvasH, groundY, highlight, eyeGlow }) => {
  if (effectType === 'NONE') return null;
  const cx = canvasW / 2;
  const cy = canvasH / 2;

  if (effectType === 'COLOSSUS_DUST') {
    // Slow falling bone/stone dust when colossal skeleton shifts its massive weight (Requirement 19)
    return (
      <g>
        {[0, 1, 2, 3, 4].map((i) => {
          const p = (phase * 0.45 + i * 0.2) % 1;
          const x = cx - 12 + i * 6 + Math.sin(phase * 1.2 + i) * 1.2;
          const y = cy - 4 + p * (groundY - cy + 3);
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width="1.2"
              height="1.2"
              fill={i % 2 === 0 ? '#D8C6A0' : '#94A3B8'}
              opacity={(1 - p) * 0.75}
            />
          );
        })}
      </g>
    );
  }

  if (effectType === 'STEAM_EMBERS') {
    // Rising boiler steam puffs & forge embers from Autómata de Escoria's smokestacks (Requirement 14)
    return (
      <g>
        {[0, 1, 2, 3].map((i) => {
          const p = (phase * 0.95 + i * 0.25) % 1;
          const stackX = i % 2 === 0 ? cx - 9 : cx + 7;
          const x = stackX + Math.sin(phase * 3 + i) * 1.4;
          const y = 8 - p * 6;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={i % 2 === 0 ? 1.8 : 1.2}
              height={i % 2 === 0 ? 1.4 : 1.2}
              fill={i % 2 === 0 ? '#CBD5E1' : '#FB923C'}
              opacity={Math.sin(p * Math.PI) * 0.82}
            />
          );
        })}
      </g>
    );
  }

  if (effectType === 'FROST_BREATH') {
    // Visible frozen breath cloud & frost crystals around Lobo de Escarcha's jaws & shoulders (Requirement 10)
    return (
      <g>
        {[0, 1, 2, 3].map((i) => {
          const p = (phase * 0.85 + i * 0.25) % 1;
          const x = canvasW * 0.72 + p * 6 + (i % 2) * 1.5;
          const y = canvasH * 0.38 + Math.sin(phase * 2.5 + i) * 1.5 - p * 2;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={i === 0 ? 2.2 : 1.3}
              height="1.2"
              fill={i % 2 === 0 ? '#E0F2FE' : '#38BDF8'}
              opacity={(1 - p) * 0.8}
            />
          );
        })}
      </g>
    );
  }

  if (effectType === 'SPORES') {
    return (
      <g>
        {[0, 1, 2, 3].map((i) => {
          const p = (phase * 0.7 + i * 0.25) % 1;
          const x = cx - 9 + i * 6 + Math.sin(phase * 2 + i) * 1.8;
          const y = groundY - 6 - p * (canvasH * 0.55);
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width="1.3"
              height="1.3"
              fill={i % 2 === 0 ? '#BEF264' : highlight}
              opacity={Math.sin(p * Math.PI) * 0.85}
            />
          );
        })}
      </g>
    );
  }

  if (effectType === 'MIST') {
    return (
      <g>
        {[0, 1, 2, 3].map((i) => {
          const drift = Math.sin(phase * 2.0 + i * 1.4) * 3.2;
          const yBase = i < 2 ? groundY - 2 + i : cy + (i - 2) * 3;
          const xBase = cx - 11 + i * 5 + drift;
          return (
            <rect
              key={i}
              x={xBase}
              y={yBase}
              width={6 - (i % 2) * 2}
              height="1.2"
              fill={i % 2 === 0 ? '#67E8F9' : highlight}
              opacity={0.38 + Math.sin(phase * 3 + i) * 0.15}
            />
          );
        })}
      </g>
    );
  }

  if (effectType === 'MIRROR_SHARDS') {
    return (
      <g>
        {[0, 1, 2].map((i) => {
          const angle = phase * 1.6 + i * ((Math.PI * 2) / 3);
          const ox = cx + Math.cos(angle) * (canvasW * 0.36);
          const oy = cy + Math.sin(angle * 1.3) * (canvasH * 0.22);
          return (
            <g key={i}>
              <rect x={ox} y={oy} width="1.6" height="2.2" fill="#F1F5F9" opacity="0.88" />
              <rect x={ox + 0.4} y={oy + 0.4} width="0.9" height="1.2" fill={eyeGlow} />
            </g>
          );
        })}
      </g>
    );
  }

  if (effectType === 'SONIC_RINGS') {
    const p1 = (phase * 1.4) % 1;
    const p2 = (phase * 1.4 + 0.5) % 1;
    return (
      <g>
        {[p1, p2].map((p, idx) => (
          <rect
            key={idx}
            x={cx - p * 9}
            y={cy + p * 8}
            width={p * 18}
            height="1"
            fill={eyeGlow}
            opacity={(1 - p) * 0.8}
          />
        ))}
      </g>
    );
  }

  return (
    <g>
      {[0, 1, 2].map((i) => {
        const p = (phase * 0.85 + i * 0.33) % 1;
        const x = cx - 7 + i * 7 + Math.cos(phase * 2.4 + i) * 1.5;
        const y = groundY - 5 - p * (canvasH * 0.55);
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width="1.3"
            height="1.3"
            fill={i % 2 === 0 ? eyeGlow : highlight}
            opacity={Math.sin(p * Math.PI) * 0.78}
          />
        );
      })}
    </g>
  );
};
