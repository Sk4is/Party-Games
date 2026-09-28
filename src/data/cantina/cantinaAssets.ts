// Canonical public asset registry for La Cantina del Farol
// Physical directory: public/assets/cantina/
// Browser URL base: /assets/cantina/

import { CantinaMapId, CardRank } from '../../types/cantina';

export type { CantinaMapId, CardRank };
export type CantinaPovKey = 'pov1' | 'pov2' | 'pov3' | 'pov4';

export const CANTINA_ASSET_BASE = '/assets/cantina';

export const CANTINA_CARD_ASSETS = {
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
  DEVIL: `${CANTINA_ASSET_BASE}/diablo.png`,
  DIABLO: `${CANTINA_ASSET_BASE}/diablo.png`,
} as const;

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

/**
 * Deliberate seat-to-POV mapping:
 * PLAYER / SEAT 1 (seatIndex 0) -> POV1 ('pov1')
 * PLAYER / SEAT 2 (seatIndex 1) -> POV3 ('pov3')
 * PLAYER / SEAT 3 (seatIndex 2) -> POV2 ('pov2')
 * PLAYER / SEAT 4 (seatIndex 3) -> POV4 ('pov4')
 */
export function getSeatPovKey(seatIndex: number): CantinaPovKey {
  switch (seatIndex % 4) {
    case 0:
      return 'pov1';
    case 1:
      return 'pov3';
    case 2:
      return 'pov2';
    case 3:
      return 'pov4';
    default:
      return 'pov1';
  }
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
