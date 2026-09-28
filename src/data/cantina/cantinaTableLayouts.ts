// CANTINA TABLE VISUAL TUNING
// Centralized configuration for player positions, perspectives, table pile geometry, and card animations.
// We will tune these values later.

import { CantinaMapId } from './maps';

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
  rotateX: number; // table surface tilt in degrees (e.g. 46deg)
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
    idleFanRotation: number;
    hoverFanRotation: number;
    cardHoverLiftPx: number;
    cardSelectedLiftPx: number;
    scale: number;
  };
  farOpponent: SeatVisualLayout;
  leftOpponent: SeatVisualLayout;
  rightOpponent: SeatVisualLayout;
  tablePile: PileVisualLayout;
  throwAnimation: {
    durationMs: number; // ~550ms
    staggerDelayMs: number; // ~60ms
    settlingMs: number; // ~120ms
  };
}

// Base layouts for standard Cantina table scene
const BASE_LAYOUT: CantinaLayoutConfig = {
  localHand: {
    bottomPx: 12,
    idleFanSpacing: 28,
    hoverFanSpacing: 50,
    idleFanRotation: 3.5,
    hoverFanRotation: 4.8,
    cardHoverLiftPx: 26,
    cardSelectedLiftPx: 42,
    scale: 1.0,
  },

  // Far opponent seated in chair directly across table (moved DOWN to sit in chair, not floating near ceiling)
  farOpponent: {
    topPercent: 24, // Was previously 12% (way too high). 24% sits directly in chair above table edge.
    leftPercent: 50,
    scale: 0.65,
    rotationZ: 0,
    perspectiveTiltX: 18,
    fanSpacing: 18,
    fanRotationStep: 3.5,
    cardLiftOnHover: 10,
  },

  // 3-4 player game: Left opponent seat
  leftOpponent: {
    topPercent: 36,
    leftPercent: 12,
    scale: 0.68,
    rotationZ: 14,
    perspectiveTiltX: 20,
    fanSpacing: 16,
    fanRotationStep: 4.0,
    cardLiftOnHover: 10,
  },

  // 3-4 player game: Right opponent seat
  rightOpponent: {
    topPercent: 36,
    leftPercent: 88,
    scale: 0.68,
    rotationZ: -14,
    perspectiveTiltX: 20,
    fanSpacing: 16,
    fanRotationStep: 4.0,
    cardLiftOnHover: 10,
  },

  // Tabletop pile viewed lying flat on the wooden table surface in 3D perspective
  tablePile: {
    centerTopPercent: 48,
    centerLeftPercent: 50,
    perspectivePx: 900,
    rotateX: 44, // Flat angle matching table perspective
    scale: 0.82,
    maxScatterX: 18, // deterministic scatter offsets
    maxScatterY: 14,
    maxScatterRotZ: 16,
  },

  throwAnimation: {
    durationMs: 560,
    staggerDelayMs: 65,
    settlingMs: 140,
  },
};

// Map-specific layout overrides if needed
export const CANTINA_TABLE_LAYOUTS: Record<CantinaMapId, CantinaLayoutConfig> = {
  mapa1: {
    ...BASE_LAYOUT,
    farOpponent: { ...BASE_LAYOUT.farOpponent, topPercent: 25 },
    tablePile: { ...BASE_LAYOUT.tablePile, centerTopPercent: 49 },
  },
  mapa2: {
    ...BASE_LAYOUT,
    farOpponent: { ...BASE_LAYOUT.farOpponent, topPercent: 24 },
    tablePile: { ...BASE_LAYOUT.tablePile, centerTopPercent: 48 },
  },
  mapa3: {
    ...BASE_LAYOUT,
    farOpponent: { ...BASE_LAYOUT.farOpponent, topPercent: 24 },
    tablePile: { ...BASE_LAYOUT.tablePile, centerTopPercent: 48 },
  },
};

/**
 * Deterministic pseudo-random scatter for table pile cards.
 * Never calls Math.random() inside render. Cards remain completely stable across rerenders.
 */
export function getStableCardScatter(seedKey: string, cardIndex: number) {
  let hash = 0;
  for (let i = 0; i < seedKey.length; i++) {
    hash = (hash << 5) - hash + seedKey.charCodeAt(i);
    hash |= 0;
  }
  const factor = hash + cardIndex * 937;
  const rotZ = Math.sin(factor) * 14; // -14 to +14 deg
  const x = Math.cos(factor * 1.3) * 16; // -16 to +16 px
  const y = Math.sin(factor * 1.7) * 12; // -12 to +12 px
  return { rotZ, x, y };
}
