// Canonical public asset registry for La Cantina del Farol
// Physical directory: public/assets/cantina/
// Browser URL base: /assets/cantina/

import { CantinaMapId, CardRank } from '../../types/cantina';

export type { CantinaMapId, CardRank };
export type CantinaPovKey = 'pov1' | 'pov2' | 'pov3' | 'pov4';

export const CANTINA_ASSET_BASE = '/assets/cantina';

export const CANTINA_CARD_ASSETS: Record<string | number, string> = {
  1: `${CANTINA_ASSET_BASE}/carta1.png`,
  2: `${CANTINA_ASSET_BASE}/carta2.png`,
  3: `${CANTINA_ASSET_BASE}/carta3.png`,
  4: `${CANTINA_ASSET_BASE}/carta4.png`,
  5: `${CANTINA_ASSET_BASE}/carta5.png`,
  6: `${CANTINA_ASSET_BASE}/carta6.png`,
  7: `${CANTINA_ASSET_BASE}/carta7.png`,
  8: `${CANTINA_ASSET_BASE}/carta8.png`,
  9: `${CANTINA_ASSET_BASE}/carta9.png`,
  10: `${CANTINA_ASSET_BASE}/carta10.png`,

  J: `${CANTINA_ASSET_BASE}/cartaj.png`,
  Q: `${CANTINA_ASSET_BASE}/cartaq.png`,
  K: `${CANTINA_ASSET_BASE}/cartak.png`,

  JOKER: `${CANTINA_ASSET_BASE}/joker.png`,
  BOMBA: `${CANTINA_ASSET_BASE}/bomba.png`,
  ESPEJO: `${CANTINA_ASSET_BASE}/espejo.png`,
  REVOLVER: `${CANTINA_ASSET_BASE}/revolver.png`,
  DEVIL: `${CANTINA_ASSET_BASE}/diablo.png`,
  DIABLO: `${CANTINA_ASSET_BASE}/diablo.png`,
};

export interface CantinaMapDefinition {
  id: CantinaMapId;
  name: string;
  description: string;
  thumbnail: string;
  pov1: string;
  pov2: string;
  pov3: string;
  pov4: string;
  back: string;
}

export const CANTINA_MAP_ASSETS: Record<CantinaMapId, CantinaMapDefinition> = {
  mapa1: {
    id: 'mapa1',
    name: 'CANTINA NEÓN',
    description:
      'Una cantina japonesa bajo la lluvia, entre faroles cálidos y el resplandor de la ciudad.',
    thumbnail: `${CANTINA_ASSET_BASE}/map1pov1.png`,
    pov1: `${CANTINA_ASSET_BASE}/map1pov1.png`,
    pov2: `${CANTINA_ASSET_BASE}/map1pov2.png`,
    pov3: `${CANTINA_ASSET_BASE}/map1pov3.png`,
    pov4: `${CANTINA_ASSET_BASE}/map1pov4.png`,
    back: `${CANTINA_ASSET_BASE}/map1backcard.png`,
  },

  mapa2: {
    id: 'mapa2',
    name: 'ESTACIÓN ESTELAR',
    description:
      'Una cantina steampunk perdida en el espacio, entre cobre, vapor y estrellas.',
    thumbnail: `${CANTINA_ASSET_BASE}/map2pov1.png`,
    pov1: `${CANTINA_ASSET_BASE}/map2pov1.png`,
    pov2: `${CANTINA_ASSET_BASE}/map2pov2.png`,
    pov3: `${CANTINA_ASSET_BASE}/map2pov3.png`,
    pov4: `${CANTINA_ASSET_BASE}/map2pov4.png`,
    back: `${CANTINA_ASSET_BASE}/map2backcard.png`,
  },

  mapa3: {
    id: 'mapa3',
    name: 'PUERTO MALDITO',
    description:
      'Un refugio pirata entre bruma verdosa, viejos navíos y secretos del mar.',
    thumbnail: `${CANTINA_ASSET_BASE}/map3pov1.png`,
    pov1: `${CANTINA_ASSET_BASE}/map3pov1.png`,
    pov2: `${CANTINA_ASSET_BASE}/map3pov2.png`,
    pov3: `${CANTINA_ASSET_BASE}/map3pov3.png`,
    pov4: `${CANTINA_ASSET_BASE}/map3pov4.png`,
    back: `${CANTINA_ASSET_BASE}/map3backcard.png`,
  },
};

export const CANTINA_MAPS = CANTINA_MAP_ASSETS;

export type CantinaPhysicalSeat = 'south' | 'north' | 'west' | 'east';

export interface CantinaSeatConfigEntry {
  seatIndex: 0 | 1 | 2 | 3;
  playerNumber: 1 | 2 | 3 | 4;
  pov: 1 | 2 | 3 | 4;
  povKey: CantinaPovKey;
  physicalSeat: CantinaPhysicalSeat;
  /** Clockwise physical chair index around the 4-seat table: 0=south, 1=west, 2=north, 3=east */
  clockwiseChairIndex: 0 | 1 | 2 | 3;
}

/**
 * ONLY canonical player-to-POV and physical seat mapping for La Cantina del Farol:
 * - PLAYER 1 (seatIndex 0) -> POV 1 ('pov1'), physicalSeat: 'south' (Chair 0)
 * - PLAYER 2 (seatIndex 1) -> POV 3 ('pov3'), physicalSeat: 'north' (Chair 2, directly opposite P1)
 * - PLAYER 3 (seatIndex 2) -> POV 4 ('pov4'), physicalSeat: 'west'  (Chair 1, left of P1)
 * - PLAYER 4 (seatIndex 3) -> POV 2 ('pov2'), physicalSeat: 'east'  (Chair 3, right of P1, directly opposite P3)
 */
export const CANTINA_SEAT_CONFIG: Record<0 | 1 | 2 | 3, CantinaSeatConfigEntry> = {
  0: {
    seatIndex: 0,
    playerNumber: 1,
    pov: 1,
    povKey: 'pov1',
    physicalSeat: 'south',
    clockwiseChairIndex: 0,
  },
  1: {
    seatIndex: 1,
    playerNumber: 2,
    pov: 3,
    povKey: 'pov3',
    physicalSeat: 'north',
    clockwiseChairIndex: 2,
  },
  2: {
    seatIndex: 2,
    playerNumber: 3,
    pov: 4,
    povKey: 'pov4',
    physicalSeat: 'west',
    clockwiseChairIndex: 1,
  },
  3: {
    seatIndex: 3,
    playerNumber: 4,
    pov: 2,
    povKey: 'pov2',
    physicalSeat: 'east',
    clockwiseChairIndex: 3,
  },
};

export const SEAT_TO_POV: Record<number, CantinaPovKey> = {
  0: 'pov1',
  1: 'pov3',
  2: 'pov4',
  3: 'pov2',
};

/**
 * Physical clockwise chair index (0..3) around the 4-seat Cantina table for each seatIndex:
 * - Chair 0 (South / POV1): seatIndex 0 (Player 1)
 * - Chair 1 (West  / POV4): seatIndex 2 (Player 3, left of P1)
 * - Chair 2 (North / POV3): seatIndex 1 (Player 2, directly opposite P1)
 * - Chair 3 (East  / POV2): seatIndex 3 (Player 4, right of P1, directly opposite P3)
 */
export const SEAT_TO_PHYSICAL_CHAIR: Record<number, number> = {
  0: 0,
  1: 2,
  2: 1,
  3: 3,
};

export function getSeatPovKey(seatIndex: number): CantinaPovKey {
  const normalized = (((seatIndex % 4) + 4) % 4) as 0 | 1 | 2 | 3;
  return CANTINA_SEAT_CONFIG[normalized]?.povKey ?? 'pov1';
}

export const getMapPovForSeat = getSeatPovKey;

export function getPhysicalChairForSeat(seatIndex: number): number {
  const normalized = (((seatIndex % 4) + 4) % 4) as 0 | 1 | 2 | 3;
  return CANTINA_SEAT_CONFIG[normalized]?.clockwiseChairIndex ?? 0;
}

/**
 * Computes the clockwise relative physical seat offset (0..3) from viewerSeatIndex to targetSeatIndex:
 * - 0: viewer's own bottom seat
 * - 1: physical seat to the viewer's LEFT
 * - 2: physical seat DIRECTLY OPPOSITE (across the table from) the viewer
 * - 3: physical seat to the viewer's RIGHT
 */
export function getRelativeSeat(
  viewerSeatIndex: number,
  targetSeatIndex: number
): 0 | 1 | 2 | 3 {
  const viewerChair = getPhysicalChairForSeat(viewerSeatIndex);
  const targetChair = getPhysicalChairForSeat(targetSeatIndex);
  return (((targetChair - viewerChair + 4) % 4) as 0 | 1 | 2 | 3);
}

export function resolveCantinaSeatBackground(
  selectedMap: CantinaMapId,
  seatIndex: number
): string {
  const povKey = getSeatPovKey(seatIndex);
  return CANTINA_MAP_ASSETS[selectedMap][povKey];
}

export function logCantinaCardAssetError(cardRank: string, resolvedSrc: string) {
  console.error(
    `[CANTINA ASSET ERROR]\ntype: card\ncard: ${cardRank}\nresolvedSrc: ${resolvedSrc}`
  );
}

export function logCantinaMapAssetError(
  mapId: CantinaMapId | string,
  povKey: CantinaPovKey | 'back' | 'thumbnail',
  resolvedSrc: string
) {
  console.error(
    `[CANTINA ASSET ERROR]\ntype: map\nmap: ${mapId}\npov: ${povKey}\nresolvedSrc: ${resolvedSrc}`
  );
}
