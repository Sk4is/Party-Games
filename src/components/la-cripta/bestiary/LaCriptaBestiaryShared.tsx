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

  // If the sprite has <= 26 rows, it was authored in 2:1 character rows.
  // Expand vertically into two 1:1 square scanlines with EPX diagonal beveling,
  // multi-tone material highlights, eye glints, and cloth fold separations (+15-20% internal detail).
  let finalRows: string[];
  if (normalizedRaw.length <= 26) {
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
          // Primary body / armor / robes:
          // Top edge under outline catches directional rim highlight '3'
          if ((U === '#' || U === '.') && D === '1') {
            topPx = '3';
          }
          // Underside catches occlusion shadow '2'
          if ((D === '#' || D === '.') && U === '1') {
            botPx = '2';
          }
        } else if (C === '4') {
          // Metal / Chitin / Structural wood:
          // Top edge catches highlight '3'
          if (U === '#' || U === '.') {
            topPx = '3';
          }
          // Bottom edge catches deep shadow '2'
          if (D === '#' || D === '.') {
            botPx = '2';
          }
          // Upper-left corner catches specular sparkle '6'
          if ((U === '#' || U === '.') && (L === '#' || L === '.') && R === '4') {
            topPx = '6';
          }
        } else if (C === '6') {
          // Bone / Ivory / Fangs:
          // Upper edge catches brilliant specular '6'
          // Lower edge or deep socket/rib crevice catches aged bone shadow '1'
          if (D === '#' && (U === '6' || U === '1')) {
            botPx = '1';
          }
        } else if (C === '5') {
          // Eye glow / magical core:
          // Center / upper pixel gets white pupil catchlight '6' for a piercing living gaze
          if ((L === '5' || R === '5' || U === '5' || D === '5') && (U === '#' || UL === '#')) {
            topPx = '6';
          }
        } else if (C === '9') {
          // Gold / Brass / Celestial runes:
          // Top catches bright gold sheen '3'
          if (U === '#' || U === '.') {
            topPx = '3';
          }
          // Bottom catches deep bronze '2'
          if (D === '#' || D === '.') {
            botPx = '2';
          }
        } else if (C === '2') {
          // Dark undergarment / deep shadow:
          // Alternating cloth folds in wide drapery
          if (L === '2' && R === '2' && U === '2' && x % 2 === 0) {
            topPx = '1';
          }
        } else if (C === '8') {
          // Toxic / spore: top luminescence '5', bottom shadow '2'
          if (U === '#' || U === '.') topPx = '5';
          if (D === '#' || D === '.') botPx = '2';
        } else if (C === '7') {
          // Crimson / blood: top catches '3', bottom catches '2'
          if (U === '#' || U === '.') topPx = '3';
          if (D === '#' || D === '.') botPx = '2';
        }

        rowA += topPx;
        rowB += botPx;
      }
      expanded.push(rowA);
      expanded.push(rowB);
    }
    finalRows = expanded;
  } else {
    // Dense 1:1 scanlines (e.g. Esqueleto Colosal, Autómata de Escoria):
    // Apply the same high-detail shading pass directly across their native 1:1 pixels
    const H = normalizedRaw.length;
    const W = maxCol;
    const at = (y: number, x: number): string => {
      if (y < 0 || y >= H || x < 0 || x >= W) return '.';
      return normalizedRaw[y][x] || '.';
    };

    const shaded: string[] = [];
    for (let y = 0; y < H; y++) {
      let row = '';
      for (let x = 0; x < W; x++) {
        const C = at(y, x);
        const U = at(y - 1, x);
        const D = at(y + 1, x);
        const L = at(y, x - 1);
        const R = at(y, x + 1);

        let px = C;
        if (C === '1') {
          if (U === '#' && D === '1') px = '3';
          else if (D === '#' && U === '1') px = '2';
        } else if (C === '4') {
          if (U === '#' && D === '4') px = '3';
          else if (D === '#' && U === '4') px = '2';
          if (U === '#' && L === '#' && R === '4' && D === '4') px = '6';
        } else if (C === '6') {
          if (D === '#' && U === '6') px = '1';
        } else if (C === '9') {
          if (U === '#' && D === '9') px = '3';
          else if (D === '#' && U === '9') px = '2';
        }
        row += px;
      }
      shaded.push(row);
    }
    finalRows = shaded;
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
  headY?: number;
  armL?: number;
  armR?: number;
  wingSpread: number;
  pulse: boolean;
  silhouetteBlackMode?: boolean;
}> = ({
  blueprint,
  visualDef,
  torsoY,
  headY = 0,
  armL = 0,
  armR = 0,
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
  const isFinalBoss = blueprint.tier === 'FINAL_BOSS';
  const isMiniboss = blueprint.tier === 'MINIBOSS';

  const palMap: Record<string, string> = useMemo(() => {
    if (silhouetteBlackMode) {
      return {
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
      };
    }
    return {
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
  }, [eyeGlow, highlight, metal, primary, pulse, secondary, silhouetteBlackMode]);

  const { rows, minX, minY, croppedWidth, croppedHeight } = compiled;
  const { canvasWidthPx, canvasHeightPx, groundOffset } = meta;

  // Ground anchor is near the bottom of the tight canvas
  const groundY = canvasHeightPx - 3;
  const baseOffsetX = Math.round((canvasWidthPx - croppedWidth) / 2);
  const baseOffsetY = Math.round(groundY - croppedHeight + groundOffset * 0.5);

  // =========================================================================
  // 60 FPS SUBPIXEL CONTINUOUS MOTION CALCULATIONS (Requirement 19 & 60 FPS Polish)
  // =========================================================================
  let smoothTorsoY = 0;
  let smoothTorsoScaleX = 1;
  let smoothTorsoScaleY = 1;
  let smoothHeadX = 0;
  let smoothHeadY = 0;
  let smoothHeadTilt = 0;
  let smoothWeaponX = 0;
  let smoothWeaponY = 0;
  let smoothWeaponAngle = 0;
  let smoothPropX = 0;
  let smoothPropY = 0;
  let smoothPropAngle = 0;
  let smoothFloatY = 0;
  let smoothFloatX = 0;

  switch (visualDef.idleType) {
    case 'COLOSSUS_BREATH': {
      // Monumental slow mass cadence (~0.75 rad/s: very deep ancient settle)
      const slowCycle = Math.sin(particlePhase * 0.75);
      smoothTorsoY = slowCycle * 0.75;
      smoothTorsoScaleY = 1 + slowCycle * 0.015;
      smoothTorsoScaleX = 1 - slowCycle * 0.01;
      smoothHeadX = Math.sin(particlePhase * 0.38) * 0.5;
      smoothHeadY = Math.cos(particlePhase * 0.75) * 0.4;
      smoothHeadTilt = Math.sin(particlePhase * 0.38) * 0.6;
      smoothWeaponY = Math.sin(particlePhase * 0.75 - 0.4) * 0.9;
      smoothWeaponAngle = Math.sin(particlePhase * 0.38) * 0.4;
      break;
    }
    case 'CONSTRUCT_PISTON': {
      // Heavy mechanical piston cadence + furnace core tremor
      const pistonCycle = Math.sin(particlePhase * 3.2);
      smoothTorsoY = pistonCycle > 0.1 ? 0.8 : -0.3;
      smoothTorsoScaleY = pistonCycle > 0.1 ? 0.98 : 1.02;
      smoothWeaponY = pistonCycle < -0.1 ? 0.9 : -0.4;
      smoothFloatX = Math.sin(particlePhase * 16) * 0.25; // chassis vibration
      break;
    }
    case 'JESTER_SWAY': {
      // Sinister pendulum sway + independent bells & hat tips
      const sway = Math.sin(particlePhase * 2.4);
      smoothTorsoY = Math.cos(particlePhase * 2.4) * 0.6;
      smoothHeadX = sway * 1.2;
      smoothHeadTilt = sway * 2.5;
      smoothWeaponX = -sway * 0.8;
      smoothWeaponAngle = -sway * 3.0;
      smoothPropX = sway * 0.6;
      break;
    }
    case 'BOOK_FLUTTER': {
      // Weightless magical levitation drift + page undulating
      smoothFloatY = Math.sin(particlePhase * 3.2) * 1.6;
      smoothFloatX = Math.cos(particlePhase * 1.8) * 0.8;
      smoothPropY = Math.sin(particlePhase * 5.0) * 0.8;
      smoothWeaponY = Math.cos(particlePhase * 4.2) * 0.7;
      break;
    }
    case 'FLAME_SPIRIT': {
      // Supernatural flame flicker + hovering drift
      smoothFloatY = Math.sin(particlePhase * 4.2) * 2.0;
      smoothFloatX = Math.cos(particlePhase * 2.8) * 1.1;
      smoothHeadTilt = Math.sin(particlePhase * 6.5) * 2.0;
      smoothTorsoScaleY = 1 + Math.sin(particlePhase * 7.0) * 0.04;
      break;
    }
    case 'MINER_HEAVE': {
      // Possessed exhausted miner heavy heave + pickaxe gravity
      const heave = Math.sin(particlePhase * 2.0);
      smoothTorsoY = heave * 1.0;
      smoothTorsoScaleY = 1 + heave * 0.025;
      smoothWeaponY = Math.sin(particlePhase * 2.0 - 0.5) * 1.2;
      smoothHeadY = heave * 0.8;
      break;
    }
    case 'MUSHROOM_SQUASH': {
      // Spongy fungal cap squash & stretch
      const capSquash = Math.sin(particlePhase * 2.6);
      smoothTorsoY = capSquash * 0.7;
      smoothTorsoScaleY = 1 + capSquash * 0.035;
      smoothTorsoScaleX = 1 - capSquash * 0.025;
      break;
    }
    case 'WOLF_PROWL': {
      // Low stalking chest respiration + subtle forward prowl
      const prowl = Math.sin(particlePhase * 2.2);
      smoothTorsoY = prowl * 0.7;
      smoothFloatX = prowl * 0.6;
      smoothHeadY = prowl * 0.8;
      smoothHeadTilt = Math.sin(particlePhase * 1.8) * 1.2;
      break;
    }
    case 'RAT_SNIFF': {
      // Rapid twitching snout sniff + whisker micro-movement
      const sniff = Math.sin(particlePhase * 7.5);
      smoothHeadX = sniff > 0.3 ? 0.7 : -0.3;
      smoothHeadY = Math.cos(particlePhase * 7.5) * 0.5;
      smoothPropX = Math.sin(particlePhase * 3.0) * 0.6;
      break;
    }
    case 'SLIME_PULSE': {
      // Viscous gelatinous breathing pulse
      const pulseCycle = Math.sin(particlePhase * 2.8);
      smoothTorsoScaleY = 1 + pulseCycle * 0.05;
      smoothTorsoScaleX = 1 - pulseCycle * 0.04;
      smoothTorsoY = -pulseCycle * 0.6;
      break;
    }
    case 'BAT_FLAP': {
      smoothFloatY = Math.sin(particlePhase * 5.2) * 1.8;
      smoothTorsoScaleX = 1 + Math.sin(particlePhase * 5.2) * 0.06;
      break;
    }
    case 'GHOST_DRIFT': {
      // Ethereal floating on asynchronous Lissajous curves
      smoothFloatY = Math.sin(particlePhase * 2.8) * 1.8;
      smoothFloatX = Math.cos(particlePhase * 1.9) * 1.1;
      smoothHeadTilt = Math.sin(particlePhase * 1.5) * 1.8;
      break;
    }
    case 'MIRROR_GLITCH': {
      smoothFloatX = wingSpread === 2 && pulse ? 1.2 : 0;
      smoothTorsoY = Math.sin(particlePhase * 2.4) * 0.6;
      break;
    }
    case 'INSECT_SCUTTLE': {
      // Rapid micro-scuttle + twitching antennae
      const scuttle = Math.sin(particlePhase * 6.0);
      smoothFloatX = scuttle * 0.6;
      smoothHeadTilt = Math.sin(particlePhase * 8.0) * 1.4;
      break;
    }
    case 'SERPENT_COIL': {
      smoothFloatX = Math.sin(particlePhase * 2.2) * 1.2;
      smoothTorsoY = Math.cos(particlePhase * 2.2) * 0.6;
      break;
    }
    case 'HEAVY_KNIGHT_SHIFT':
    case 'SKELETON_SWAY':
    case 'SHAMAN_RITUAL':
    case 'GOBLIN_CROUCH':
    default: {
      const breath = Math.sin(particlePhase * 2.2);
      smoothTorsoY = breath * 0.65;
      smoothTorsoScaleY = 1 + breath * 0.015;
      smoothHeadY = breath * 0.45;
      smoothWeaponY = Math.sin(particlePhase * 2.2 - 0.3) * 0.7;
      smoothWeaponAngle = Math.sin(particlePhase * 1.5) * 0.8;
      smoothPropY = breath * 0.5;
      break;
    }
  }

  // Combat stage procedural offsets (from articulated pose props)
  const combinedTorsoY = smoothTorsoY + torsoY * 0.35 + smoothFloatY;
  const combinedTorsoX = smoothFloatX;
  const combinedHeadX = smoothHeadX;
  const combinedHeadY = smoothHeadY + headY * 0.4;
  const combinedWeaponX = smoothWeaponX;
  const combinedWeaponY = smoothWeaponY + armR * 0.5;
  const combinedPropX = smoothPropX;
  const combinedPropY = smoothPropY + armL * 0.5;

  // =========================================================================
  // SEMANTIC ANATOMICAL GROUP PARTITIONING (Stable Memoized Nodes)
  // =========================================================================
  const { lowerRects, torsoRects, headRects, weaponRects, propRects } = useMemo(() => {
    const headSplitRow = Math.floor(croppedHeight * 0.28);
    const torsoSplitRow = Math.floor(croppedHeight * 0.70);
    const weaponSplitCol = Math.floor(croppedWidth * 0.72);
    const propSplitCol = Math.floor(croppedWidth * 0.28);

    const lower: React.ReactNode[] = [];
    const torso: React.ReactNode[] = [];
    const head: React.ReactNode[] = [];
    const weapon: React.ReactNode[] = [];
    const prop: React.ReactNode[] = [];

    for (let cy = 0; cy < croppedHeight; cy++) {
      const srcY = minY + cy;
      const row = rows[srcY] || '';

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

        const rectNode = (
          <rect
            key={`${cy}_${cx}`}
            x={cx}
            y={cy}
            width={Number((run + 0.06).toFixed(2))}
            height={1.06}
            fill={fill}
          />
        );

        if (cx >= weaponSplitCol && cy < torsoSplitRow) {
          weapon.push(rectNode);
        } else if (cx < propSplitCol && cy < torsoSplitRow) {
          prop.push(rectNode);
        } else if (cy < headSplitRow) {
          head.push(rectNode);
        } else if (cy < torsoSplitRow) {
          torso.push(rectNode);
        } else {
          lower.push(rectNode);
        }

        cx += run;
      }
    }

    return {
      lowerRects: lower,
      torsoRects: torso,
      headRects: head,
      weaponRects: weapon,
      propRects: prop,
    };
  }, [croppedHeight, croppedWidth, minX, minY, palMap, rows]);

  // Floor shadow tailored to creature dimensions (Requirement 20)
  const shadowSpan = Math.min(
    canvasWidthPx - 2,
    Math.max(10, Math.round(croppedWidth * 0.86 * Math.min(1.18, meta.shadowWidth)))
  );
  const shadowX = Number(((canvasWidthPx - shadowSpan) / 2).toFixed(2));
  const shadowH =
    meta.visualScaleClass === 'COLOSSAL' ? 2.4 : meta.visualScaleClass === 'HUGE' ? 2.0 : 1.5;

  const cx = canvasWidthPx / 2;

  return (
    <svg
      viewBox={`0 0 ${canvasWidthPx} ${canvasHeightPx}`}
      preserveAspectRatio="xMidYMax meet"
      className="w-full h-full overflow-visible block select-none"
      style={{ imageRendering: 'pixelated' }}
      shapeRendering="crispEdges"
    >
      {/* ===================================================================
          LAYER 1: ADAPTIVE GROUND SHADOW & BOSS RESONANCE RITUAL SEAL
          =================================================================== */}
      {!silhouetteBlackMode && (
        <g>
          {/* Main Occlusion Shadow */}
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

          {/* MINIBOSS & BOSS Ground Aura Halo */}
          {(isMiniboss || isFinalBoss) && (
            <g>
              <rect
                x={shadowX - 2}
                y={groundY + 0.3}
                width={shadowSpan + 4}
                height="0.9"
                fill={highlight}
                opacity={pulse ? 0.8 : 0.4}
              />
              <rect
                x={shadowX + 4}
                y={groundY + 0.6}
                width={Math.max(4, shadowSpan - 8)}
                height="0.6"
                fill={isFinalBoss ? '#F59E0B' : eyeGlow}
                opacity={0.65}
              />
            </g>
          )}

          {/* FINAL BOSS Resonant Runic Seal Array */}
          {isFinalBoss && (
            <g opacity={0.75 + Math.sin(particlePhase * 3.0) * 0.2}>
              {/* Outer Runic Floor Brackets */}
              <rect x={cx - shadowSpan * 0.58} y={groundY - 1.2} width="2" height="3" fill="#F59E0B" />
              <rect x={cx + shadowSpan * 0.58 - 2} y={groundY - 1.2} width="2" height="3" fill="#F59E0B" />
              <rect x={cx - 3} y={groundY + 1.2} width="6" height="0.8" fill="#EF4444" />
              {/* Rotating Rune Sparks */}
              {[0, 1, 2, 3].map((idx) => {
                const angle = particlePhase * 1.5 + idx * (Math.PI / 2);
                const rx = cx + Math.cos(angle) * (shadowSpan * 0.52);
                const ry = groundY + Math.sin(angle) * 1.6;
                return (
                  <rect
                    key={idx}
                    x={rx - 0.6}
                    y={ry - 0.6}
                    width="1.2"
                    height="1.2"
                    fill={idx % 2 === 0 ? '#FDE047' : '#EF4444'}
                    opacity="0.85"
                  />
                );
              })}
            </g>
          )}
        </g>
      )}

      {/* ===================================================================
          LAYER 2: 60 FPS SMOOTH ENVIRONMENTAL / BIOME PARTICLE EFFECTS
          =================================================================== */}
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

      {/* ===================================================================
          LAYER 3: ARTICULATED 60 FPS CREATURE PIXEL MATRIX
          =================================================================== */}
      <g transform={`translate(${baseOffsetX}, ${baseOffsetY})`}>
        {/* 1. Base / Lower Legs / Roots / Pedestal (Firmly Anchored to Ground) */}
        <g>{lowerRects}</g>

        {/* 2. Mid Torso / Carapace / Chest / Wings (Smooth 60 FPS Respiration) */}
        <g
          transform={`translate(${combinedTorsoX.toFixed(2)}, ${combinedTorsoY.toFixed(
            2
          )}) scale(${smoothTorsoScaleX.toFixed(3)}, ${smoothTorsoScaleY.toFixed(3)})`}
        >
          {torsoRects}

          {/* 3. Head / Cranium / Crown / Horns (Smooth Secondary Motion & Gaze Tilt) */}
          <g
            transform={`translate(${combinedHeadX.toFixed(2)}, ${combinedHeadY.toFixed(
              2
            )}) rotate(${smoothHeadTilt.toFixed(2)})`}
          >
            {headRects}
          </g>

          {/* 4. Left Prop / Shield / Lantern / Key Ring */}
          <g
            transform={`translate(${combinedPropX.toFixed(2)}, ${combinedPropY.toFixed(
              2
            )}) rotate(${smoothPropAngle.toFixed(2)})`}
          >
            {propRects}
          </g>
        </g>

        {/* 5. Right Weapon / Halberd / Mace / Scepter (Inertial Weight Settle) */}
        <g
          transform={`translate(${combinedWeaponX.toFixed(2)}, ${combinedWeaponY.toFixed(
            2
          )}) rotate(${smoothWeaponAngle.toFixed(2)})`}
        >
          {weaponRects}
        </g>
      </g>
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
    // Slow falling bone/stone dust + floor dust puff when massive frame settles (Requirement 10)
    const floorPuffPhase = (phase * 0.25) % 1; // triggers every ~4s
    const showFloorPuff = floorPuffPhase < 0.28;
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
        {showFloorPuff && (
          <g opacity={(1 - floorPuffPhase / 0.28) * 0.65}>
            <rect x={cx - 14} y={groundY - 1} width="3" height="0.8" fill="#D8C6A0" />
            <rect x={cx - 16} y={groundY - 1.8} width="2" height="0.8" fill="#94A3B8" />
            <rect x={cx + 12} y={groundY - 1} width="3" height="0.8" fill="#D8C6A0" />
            <rect x={cx + 14} y={groundY - 1.8} width="2" height="0.8" fill="#94A3B8" />
          </g>
        )}
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
    // Visible frozen breath cloud & frost crystals around jaws & shoulders
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
    // Toxic fungal spores drifting in buoyant upward spirals
    return (
      <g>
        {[0, 1, 2, 3, 4].map((i) => {
          const p = (phase * 0.7 + i * 0.2) % 1;
          const x = cx - 10 + i * 5 + Math.sin(phase * 2.2 + i * 1.2) * 2.2;
          const y = groundY - 4 - p * (canvasH * 0.65);
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
    // Whispering forest fog drifting horizontally across floor & shoulders
    return (
      <g>
        {[0, 1, 2, 3].map((i) => {
          const drift = Math.sin(phase * 1.8 + i * 1.4) * 3.6;
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

  if (effectType === 'SOUL_FLAME') {
    // Ghostly spectral wisps rising with luminous cyan and white core
    return (
      <g>
        {[0, 1, 2, 3].map((i) => {
          const p = (phase * 0.9 + i * 0.25) % 1;
          const x = cx - 8 + i * 5 + Math.sin(phase * 3.2 + i * 2) * 1.8;
          const y = groundY - 4 - p * (canvasH * 0.58);
          return (
            <g key={i} opacity={Math.sin(p * Math.PI) * 0.9}>
              <rect x={x - 0.4} y={y - 0.4} width="1.8" height="2.2" fill={eyeGlow} />
              <rect x={x} y={y} width="1.0" height="1.4" fill="#FFFFFF" />
            </g>
          );
        })}
      </g>
    );
  }

  if (effectType === 'EMBERS') {
    // Glowing forge embers leaping upward on hot convective air currents
    return (
      <g>
        {[0, 1, 2, 3, 4].map((i) => {
          const p = (phase * 1.1 + i * 0.2) % 1;
          const x = cx - 9 + i * 4.5 + Math.sin(phase * 4 + i) * 1.6;
          const y = groundY - 3 - p * (canvasH * 0.7);
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={i === 0 ? 1.6 : 1.1}
              height={i === 0 ? 1.6 : 1.1}
              fill={i % 2 === 0 ? '#FB923C' : '#E11D48'}
              opacity={Math.sin(p * Math.PI) * 0.88}
            />
          );
        })}
      </g>
    );
  }

  if (effectType === 'BUBBLES') {
    // Rising sewer slime toxic bubbles popping at their apex
    return (
      <g>
        {[0, 1, 2, 3].map((i) => {
          const p = (phase * 0.8 + i * 0.25) % 1;
          const x = cx - 8 + i * 5 + Math.cos(phase * 2 + i) * 1.2;
          const y = groundY - 2 - p * (canvasH * 0.48);
          return (
            <g key={i} opacity={p < 0.9 ? 0.85 : (1 - p) * 8.5}>
              <rect x={x - 0.5} y={y - 0.5} width="2.0" height="2.0" fill="#22C55E" opacity="0.6" />
              <rect x={x} y={y} width="1.0" height="1.0" fill="#BEF264" />
            </g>
          );
        })}
      </g>
    );
  }

  if (effectType === 'VOID_MOTES') {
    // Orbiting celestial dark-matter motes for Eclipse Astrologers & Abyssal entities
    return (
      <g>
        {[0, 1, 2, 3].map((i) => {
          const angle = phase * 1.8 + i * (Math.PI / 2);
          const ox = cx + Math.cos(angle) * (canvasW * 0.38);
          const oy = cy + Math.sin(angle * 1.4) * (canvasH * 0.25);
          return (
            <g key={i}>
              <rect x={ox - 0.5} y={oy - 0.5} width="2.2" height="2.2" fill="#1E1B4B" opacity="0.9" />
              <rect x={ox} y={oy} width="1.2" height="1.2" fill={i % 2 === 0 ? '#F59E0B' : '#38BDF8'} />
            </g>
          );
        })}
      </g>
    );
  }

  if (effectType === 'SAND_DUST') {
    // Ancient desert tomb dust blowing in horizontal gusts
    return (
      <g>
        {[0, 1, 2, 3].map((i) => {
          const p = (phase * 0.9 + i * 0.25) % 1;
          const x = canvasW * 0.15 + p * (canvasW * 0.7);
          const y = groundY - 2 - Math.sin(p * Math.PI) * 5 + (i % 2) * 1.5;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={i % 2 === 0 ? 2.4 : 1.4}
              height="1.0"
              fill="#D97706"
              opacity={Math.sin(p * Math.PI) * 0.75}
            />
          );
        })}
      </g>
    );
  }

  if (effectType === 'FROST_CRYSTALS') {
    // Glinting hexagonal snow crystals drifting downward
    return (
      <g>
        {[0, 1, 2, 3].map((i) => {
          const p = (phase * 0.6 + i * 0.25) % 1;
          const x = cx - 10 + i * 6 + Math.sin(phase * 2.0 + i) * 1.8;
          const y = 6 + p * (groundY - 8);
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width="1.4"
              height="1.4"
              fill={i % 2 === 0 ? '#FFFFFF' : '#7DD3FC'}
              opacity={Math.sin(p * Math.PI) * 0.85}
            />
          );
        })}
      </g>
    );
  }

  if (effectType === 'BLOOD_DROPS') {
    // Crimson blood droplets dripping from weapons / spikes to the floor
    return (
      <g>
        {[0, 1, 2].map((i) => {
          const p = (phase * 1.2 + i * 0.33) % 1;
          const x = cx + 8 - i * 5;
          const y = cy + p * (groundY - cy);
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width="1.2"
              height={p > 0.8 ? '0.8' : '1.8'}
              fill="#E11D48"
              opacity={p > 0.92 ? (1 - p) * 12.5 : 0.9}
            />
          );
        })}
      </g>
    );
  }

  if (effectType === 'LIGHTNING_SPARKS') {
    // Crackling jagged electrical arcs between conductors
    const sparkVisible = Math.sin(phase * 14) > 0.35;
    if (!sparkVisible) return null;
    return (
      <g fill="#FDE047" opacity="0.9">
        <rect x={cx - 7} y={cy - 6} width="1.6" height="1.6" />
        <rect x={cx - 5} y={cy - 8} width="1.4" height="2.0" />
        <rect x={cx + 6} y={cy - 5} width="1.8" height="1.4" />
        <rect x={cx + 8} y={cy - 7} width="1.2" height="2.2" />
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
