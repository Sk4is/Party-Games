import React, { useEffect, useState } from 'react';
import {
  CriptaCreatureVisualBlueprint,
  CriptaUniqueCreatureModelId,
} from '../../../data/la-cripta/criptaBiomeBestiary';

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
  | 'COLOSSUS_BREATH';

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
  | 'NONE';

export interface AuthoredEnemyVisualDefinition {
  id: CriptaUniqueCreatureModelId;
  /**
   * Cohesive, connected pixel-art sprite matrix.
   * Each character maps to the creature's palette:
   *  '.' or ' ' = transparent
   *  '#' = dark pixel outline / deep recess
   *  '1' = primary creature color
   *  '2' = secondary / shadow color
   *  '3' = highlight / accent color
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
   * Visual size multiplier relative to standard arena slot (e.g. 0.90 for rat, 1.25 for normal, 1.45 for large, 1.75 for miniboss, 2.20 for final boss)
   */
  scaleMultiplier: number;
  /**
   * Width of ground shadow beneath feet/paws/body in 64x60 canvas units
   */
  groundShadowWidth: number;
  /**
   * True ONLY for supernatural entities whose concept is intentional fragmentation/levitation
   * (e.g. Doble Fragmentado, Filo Cristalino, Fuego Fatuo, Esfera Armilar).
   */
  allowsSupernaturalFloat?: boolean;
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

    // Normalize rows to check for duplicate pixel art across any two enemy IDs
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

    // Check for accidental blank horizontal gap rows inside non-supernatural creatures
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
 * Automatically scales pixel size so deliberate 32-bit pixel clusters are crisp and readable,
 * and applies anatomy-specific keyframe motion without detaching body parts.
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
  headY,
  armL,
  armR,
  wingSpread,
  pulse,
  silhouetteBlackMode = false,
}) => {
  // Smooth 60 FPS timer solely for environmental particles (mist, spores, flames, mirror glints)
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

  if (!visualDef) {
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
        '#': '#07060B',
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

  const rows = visualDef.rows;
  const rowCount = rows.length;
  const colCount = Math.max(...rows.map((r) => r.length), 1);

  // Deliberate pixel cluster sizing: ~1.35x to 1.65x per logical pixel so sprites fill the 64x60 canvas with crisp 32-bit presence
  const pxSize = colCount <= 28 && rowCount <= 28 ? 1.65 : colCount <= 34 && rowCount <= 34 ? 1.45 : 1.25;
  const renderedWidth = colCount * pxSize;
  const renderedHeight = rowCount * pxSize;

  // Ground the bottom of the sprite directly on the floor plane (y = 55)
  const groundY = 55;
  const baseOffsetX = (64 - renderedWidth) / 2;
  const baseOffsetY = groundY - renderedHeight;

  // Stepped pixel-art idle animation per creature anatomy (Requirement 8 & 20)
  let animOffsetX = 0;
  let animOffsetY = 0;
  let topHalfSquashY = 0;

  switch (visualDef.idleType) {
    case 'MUSHROOM_SQUASH':
      // Cap gently compresses downward on breath step, body stays grounded
      topHalfSquashY = wingSpread === 2 ? pxSize : 0;
      break;
    case 'WOLF_PROWL':
      // Low stalking chest breath + subtle forward prowl shift
      animOffsetX = wingSpread === 1 ? -pxSize * 0.5 : 0;
      topHalfSquashY = wingSpread === 2 ? pxSize * 0.6 : 0;
      break;
    case 'RAT_SNIFF':
      // Quick rodent nose/head twitch forward
      animOffsetX = pulse ? -pxSize * 0.75 : 0;
      break;
    case 'SLIME_PULSE':
      // Soft gelatinous squash & stretch anchored to floor
      topHalfSquashY = wingSpread === 1 ? pxSize : wingSpread === 2 ? -pxSize * 0.5 : 0;
      break;
    case 'BAT_FLAP':
      // Flying mammal hovers and flaps wings
      animOffsetY = (wingSpread - 1) * pxSize * 1.2 - 4;
      break;
    case 'GHOST_DRIFT':
      // Continuous ethereal drift above ground
      animOffsetY = Math.round(Math.sin(particlePhase * 3.2) * 2.5) - 3;
      animOffsetX = Math.round(Math.cos(particlePhase * 2.1) * 1.2);
      break;
    case 'MIRROR_GLITCH':
      // Occasional 1-pixel reflective displacement (Requirement 10)
      animOffsetX = wingSpread === 2 && pulse ? pxSize : 0;
      topHalfSquashY = wingSpread === 1 ? -pxSize * 0.5 : 0;
      break;
    case 'INSECT_SCUTTLE':
      // Chitin scuttle shift left/right
      animOffsetX = pulse ? pxSize * 0.6 : -pxSize * 0.6;
      break;
    case 'SERPENT_COIL':
      // S-curve lateral sway
      animOffsetX = (wingSpread - 1) * pxSize * 0.7;
      break;
    case 'HEAVY_KNIGHT_SHIFT':
    case 'COLOSSUS_BREATH':
      // Slow armored weight shift
      topHalfSquashY = wingSpread === 2 ? pxSize * 0.6 : 0;
      break;
    case 'SKELETON_SWAY':
    case 'SHAMAN_RITUAL':
    case 'GOBLIN_CROUCH':
    case 'CONSTRUCT_PISTON':
    default:
      topHalfSquashY = wingSpread === 2 ? pxSize * 0.6 : 0;
      break;
  }

  // Add combat action lunge / hit recoil offsets from parent pose
  const totalOffsetX = baseOffsetX + animOffsetX;
  const totalOffsetY = baseOffsetY + animOffsetY + torsoY * 0.6;

  // Build run-length encoded crisp pixel rects
  const rects: React.ReactNode[] = [];
  const capSplitRow = Math.floor(rowCount * 0.48);

  for (let y = 0; y < rowCount; y++) {
    const row = rows[y];
    const rowShiftY = y < capSplitRow ? topHalfSquashY : 0;
    // Subtle weapon/arm shift on outer columns during idle/attack while staying connected!
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') {
        x++;
        continue;
      }
      const fill = palMap[ch];
      if (!fill) {
        x++;
        continue;
      }
      let run = 1;
      while (x + run < row.length && row[x + run] === ch) {
        run++;
      }
      rects.push(
        <rect
          key={`${y}_${x}`}
          x={Number((totalOffsetX + x * pxSize).toFixed(2))}
          y={Number((totalOffsetY + y * pxSize + rowShiftY).toFixed(2))}
          width={Number((run * pxSize + 0.08).toFixed(2))}
          height={Number((pxSize + 0.08).toFixed(2))}
          fill={fill}
        />
      );
      x += run;
    }
  }

  const shadowW = visualDef.groundShadowWidth || 40;
  const shadowX = 32 - shadowW / 2;

  return (
    <svg
      viewBox="0 0 64 60"
      className="w-full h-full overflow-visible drop-shadow-[0_12px_20px_rgba(0,0,0,0.92)]"
      style={{ imageRendering: 'pixelated' }}
      shapeRendering="crispEdges"
    >
      {/* Grounding Shadow Plane (Requirement 19) */}
      {!silhouetteBlackMode && (
        <g>
          <rect x={shadowX} y="55" width={shadowW} height="3" fill="#040307" opacity="0.82" />
          <rect x={shadowX + 4} y="54" width={shadowW - 8} height="2" fill="#040307" opacity="0.55" />
          {(blueprint.tier === 'MINIBOSS' || blueprint.tier === 'FINAL_BOSS') && (
            <rect
              x={shadowX + 2}
              y="55"
              width={shadowW - 4}
              height="1.5"
              fill={highlight}
              opacity={pulse ? 0.85 : 0.45}
            />
          )}
        </g>
      )}

      {/* 60 FPS Smooth Environmental / Anatomy Particle Effects Behind & Around Sprite (Requirement 7 & 21) */}
      {!silhouetteBlackMode && (
        <EnemySmoothEffectsLayer
          effectType={visualDef.effectType}
          phase={particlePhase}
          primary={primary}
          highlight={highlight}
          eyeGlow={eyeGlow}
        />
      )}

      {/* Crisp Pixel-Art Creature Body */}
      <g>{rects}</g>
    </svg>
  );
};

const EnemySmoothEffectsLayer: React.FC<{
  effectType: EnemyParticleEffectType;
  phase: number;
  primary: string;
  highlight: string;
  eyeGlow: string;
}> = ({ effectType, phase, primary, highlight, eyeGlow }) => {
  if (effectType === 'NONE') return null;

  if (effectType === 'SPORES') {
    // Gently rising toxic fungal spores around Hongo Errante & fungal creatures
    return (
      <g>
        {[0, 1, 2, 3].map((i) => {
          const p = (phase * 0.7 + i * 0.25) % 1;
          const x = 16 + i * 10 + Math.sin(phase * 2 + i) * 3;
          const y = 36 - p * 24;
          const op = Math.sin(p * Math.PI) * 0.85;
          return (
            <rect
              key={i}
              x={x}
              y={y}
              width="2"
              height="2"
              fill={i % 2 === 0 ? '#BEF264' : highlight}
              opacity={op}
            />
          );
        })}
      </g>
    );
  }

  if (effectType === 'MIST') {
    // Continuous 60 FPS flowing mist trails around paws, back, and tail for Lobo de Niebla
    return (
      <g>
        {[0, 1, 2, 3].map((i) => {
          const drift = Math.sin(phase * 2.2 + i * 1.4) * 5;
          const yBase = i < 2 ? 51 + i * 2 : 34 + (i - 2) * 5;
          const xBase = 12 + i * 8 + drift;
          return (
            <rect
              key={i}
              x={xBase}
              y={yBase}
              width={10 - (i % 2) * 3}
              height="2"
              fill={i % 2 === 0 ? '#67E8F9' : highlight}
              opacity={0.38 + Math.sin(phase * 3 + i) * 0.15}
            />
          );
        })}
      </g>
    );
  }

  if (effectType === 'MIRROR_SHARDS') {
    // Slowly rotating / orbiting mirror fragments with reflective shimmer for Doble Fragmentado
    return (
      <g>
        {[0, 1, 2].map((i) => {
          const angle = phase * 1.8 + i * ((Math.PI * 2) / 3);
          const ox = 32 + Math.cos(angle) * 19;
          const oy = 26 + Math.sin(angle * 1.3) * 10;
          return (
            <g key={i}>
              {/* Visible reflective light tether connecting fragment to mirror body */}
              <line
                x1={32}
                y1={26}
                x2={ox + 1.5}
                y2={oy + 1.5}
                stroke={highlight}
                strokeWidth="0.6"
                opacity="0.45"
              />
              <rect x={ox} y={oy} width="3" height="4" fill="#F1F5F9" opacity="0.9" />
              <rect x={ox + 1} y={oy + 1} width="1.5" height="2" fill={eyeGlow} />
            </g>
          );
        })}
      </g>
    );
  }

  if (effectType === 'SONIC_RINGS') {
    // Expanding sonic echolocation waves for Murciélago Sónico
    const p1 = (phase * 1.4) % 1;
    const p2 = (phase * 1.4 + 0.5) % 1;
    return (
      <g>
        {[p1, p2].map((p, idx) => (
          <rect
            key={idx}
            x={32 - p * 14}
            y={28 + p * 16}
            width={p * 28}
            height="1.5"
            fill={eyeGlow}
            opacity={(1 - p) * 0.8}
          />
        ))}
      </g>
    );
  }

  // Generic subtle 60 FPS ambient motes (SOUL_FLAME, EMBERS, BUBBLES, FROST_CRYSTALS, VOID_MOTES, etc.)
  return (
    <g>
      {[0, 1, 2].map((i) => {
        const p = (phase * 0.85 + i * 0.33) % 1;
        const x = 18 + i * 13 + Math.cos(phase * 2.4 + i) * 2.5;
        const y = 44 - p * 28;
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width="2"
            height="2"
            fill={i % 2 === 0 ? eyeGlow : highlight}
            opacity={Math.sin(p * Math.PI) * 0.75}
          />
        );
      })}
    </g>
  );
};
