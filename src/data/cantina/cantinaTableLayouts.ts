// CANTINA TABLE VISUAL TUNING
// Centralized configuration for player positions, perspectives, table pile geometry, and card animations.
// We will tune these values later.

import { CantinaMapId } from './cantinaAssets';

export interface SeatVisualLayout {
  topPercent: number; // percentage from top (0-100)
  leftPercent: number; // percentage from left (0-100)
  scale: number;
  rotationZ: number; // degrees
  perspectiveTiltX: number; // rotateX degrees
  fanSpacing: number; // px per card
  fanRotationStep: number; // degrees per card
  cardLiftOnHover: number; // px
}

export interface PileVisualLayout {
  centerTopPercent: number; // percentage from top of table scene
  centerLeftPercent: number;
  perspectivePx: number; // perspective container
  rotateX: number; // table surface tilt in degrees (e.g. 52deg)
  scaleY: number; // subtle foreshortening on the wooden surface
  scale: number;
  maxScatterX: number; // px
  maxScatterY: number; // px
  maxScatterRotZ: number; // degrees
}

export interface CantinaLayoutConfig {
  localHand: {
    bottomPx: number;
    idleFanSpacing: number;
    hoverFanSpacing: number;
    neighborHoverPushPx: number;
    idleFanRotation: number;
    hoverFanRotation: number;
    arcDropPx: number;
    cardHoverLiftPx: number;
    cardSelectedLiftPx: number;
    cardSelectedHoverBonusPx: number;
    scale: number;
  };
  farOpponent: SeatVisualLayout;
  leftOpponent: SeatVisualLayout;
  rightOpponent: SeatVisualLayout;
  tablePile: PileVisualLayout;
  throwAnimation: {
    durationMs: number; // ~470ms flight
    staggerDelayMs: number; // ~52ms stagger
    settlingMs: number; // ~75ms micro-settle on wood
  };
}

export const MAX_VISIBLE_PILE_CARDS = 15;

// Base layouts for standard Cantina table scene
const BASE_LAYOUT: CantinaLayoutConfig = {
  localHand: {
    bottomPx: 8,
    idleFanSpacing: 34,
    hoverFanSpacing: 68,
    neighborHoverPushPx: 12,
    idleFanRotation: 4.2,
    hoverFanRotation: 5.2,
    arcDropPx: 5.5,
    cardHoverLiftPx: 28,
    cardSelectedLiftPx: 20,
    cardSelectedHoverBonusPx: 8,
    scale: 1.0,
  },

  // Far opponent seated in chair directly across table (moved DOWN to sit in chair, not floating near ceiling)
  farOpponent: {
    topPercent: 32.5,
    leftPercent: 50,
    scale: 0.9,
    rotationZ: 0,
    perspectiveTiltX: 18,
    fanSpacing: 19,
    fanRotationStep: 3.8,
    cardLiftOnHover: 10,
  },

  // 3-4 player game: Left opponent seat
  leftOpponent: {
    topPercent: 41.5,
    leftPercent: 13.5,
    scale: 0.94,
    rotationZ: 16,
    perspectiveTiltX: 20,
    fanSpacing: 19,
    fanRotationStep: 4.2,
    cardLiftOnHover: 10,
  },

  // 3-4 player game: Right opponent seat
  rightOpponent: {
    topPercent: 41.5,
    leftPercent: 86.5,
    scale: 0.94,
    rotationZ: -16,
    perspectiveTiltX: 20,
    fanSpacing: 19,
    fanRotationStep: 4.2,
    cardLiftOnHover: 10,
  },

  // Tabletop pile viewed lying flat on the wooden table surface in 3D perspective
  tablePile: {
    centerTopPercent: 54.5,
    centerLeftPercent: 50,
    perspectivePx: 760,
    rotateX: 52, // Flat angle matching seated table perspective
    scaleY: 0.88,
    scale: 0.92,
    maxScatterX: 22, // deterministic scatter offsets
    maxScatterY: 13,
    maxScatterRotZ: 12,
  },

  throwAnimation: {
    durationMs: 470,
    staggerDelayMs: 52,
    settlingMs: 75,
  },
};

// Map-specific layout overrides if needed
export const CANTINA_TABLE_LAYOUTS: Record<CantinaMapId, CantinaLayoutConfig> = {
  mapa1: {
    ...BASE_LAYOUT,
    farOpponent: { ...BASE_LAYOUT.farOpponent, topPercent: 33 },
    tablePile: { ...BASE_LAYOUT.tablePile, centerTopPercent: 55 },
  },
  mapa2: {
    ...BASE_LAYOUT,
    farOpponent: { ...BASE_LAYOUT.farOpponent, topPercent: 32.5 },
    tablePile: { ...BASE_LAYOUT.tablePile, centerTopPercent: 54.5 },
  },
  mapa3: {
    ...BASE_LAYOUT,
    farOpponent: { ...BASE_LAYOUT.farOpponent, topPercent: 32.5 },
    tablePile: { ...BASE_LAYOUT.tablePile, centerTopPercent: 54.5 },
  },
};

/**
 * Deterministic pseudo-random scatter for table pile cards.
 * Never calls Math.random() inside render. Cards remain completely stable across rerenders.
 */
export function getStableCardScatter(seedKey: string, cardIndex: number) {
  let hash = 2166136261;
  const combined = `${seedKey}#${cardIndex}`;
  for (let i = 0; i < combined.length; i++) {
    hash ^= combined.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const f1 = ((hash & 0xffff) / 0xffff) * 2 - 1; // -1 to +1
  const f2 = (((hash >>> 8) & 0xffff) / 0xffff) * 2 - 1; // -1 to +1
  const f3 = (((hash >>> 16) & 0xffff) / 0xffff) * 2 - 1; // -1 to +1
  const f4 = (((hash >>> 4) & 0xffff) / 0xffff) * 2 - 1; // -1 to +1

  const rotZ = Number((f1 * 12).toFixed(2)); // -12 to +12 deg
  const x = Number((f2 * 22).toFixed(2)); // -22 to +22 px
  const y = Number((f3 * 13).toFixed(2)); // -13 to +13 px
  const rotXDelta = Number((f4 * 2).toFixed(2)); // -2 to +2 deg subtle perspective variation
  return { rotZ, x, y, rotXDelta };
}
