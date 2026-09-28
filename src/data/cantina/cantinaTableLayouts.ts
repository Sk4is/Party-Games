// CANTINA TABLE VISUAL TUNING
// Centralized configuration for player positions, perspectives, table pile geometry, and card animations.
// We will tune these values later.

import { CantinaMapId, getRelativeSeat } from './cantinaAssets';

export type OpponentSeatRole = 'left' | 'far' | 'right';

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
    bottomPx: 28,
    idleFanSpacing: 38,
    hoverFanSpacing: 78,
    neighborHoverPushPx: 15,
    idleFanRotation: 4.2,
    hoverFanRotation: 5.2,
    arcDropPx: 5.0,
    cardHoverLiftPx: 30,
    cardSelectedLiftPx: 22,
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

/**
 * Maps a relative physical seat offset (1 = left, 2 = opposite/far, 3 = right)
 * to its fixed visual layout around the 4-seat Cantina table.
 * NEVER depends on player count, filtered array indices, or join order.
 */
export function getVisualPositionForRelativeSeat(
  relativeSeat: number,
  layout: CantinaLayoutConfig
): { seatLayout: SeatVisualLayout; seatRole: OpponentSeatRole } {
  switch (((relativeSeat % 4) + 4) % 4) {
    case 1:
      return { seatLayout: layout.leftOpponent, seatRole: 'left' };
    case 2:
      return { seatLayout: layout.farOpponent, seatRole: 'far' };
    case 3:
      return { seatLayout: layout.rightOpponent, seatRole: 'right' };
    default:
      return { seatLayout: layout.farOpponent, seatRole: 'far' };
  }
}

/**
 * Single source of truth for resolving an opponent's visual table seat
 * strictly from the viewer's authoritative seatIndex and the opponent's authoritative seatIndex.
 */
export function getOpponentSeatVisualForPlayer(
  viewerSeatIndex: number,
  opponentSeatIndex: number,
  layout: CantinaLayoutConfig
): {
  relativeSeat: 0 | 1 | 2 | 3;
  seatLayout: SeatVisualLayout;
  seatRole: OpponentSeatRole;
} {
  const relativeSeat = getRelativeSeat(viewerSeatIndex, opponentSeatIndex);
  const { seatLayout, seatRole } = getVisualPositionForRelativeSeat(
    relativeSeat,
    layout
  );
  return { relativeSeat, seatLayout, seatRole };
}
