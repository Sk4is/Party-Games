// Central map asset registry for La Cantina del Farol
// Maps and POVs are strictly separate dimensions.
// Every environment provides 4 distinct POVs and 1 card back.

import { CantinaMapId } from '../../types/cantina';

export type { CantinaMapId };
export type CantinaPovKey = 'pov1' | 'pov2' | 'pov3' | 'pov4';

const importMeta = import.meta as unknown as {
  glob: (pattern: string, options?: Record<string, unknown>) => Record<string, string>;
};

const bundledMapGlob: Record<string, string> =
  typeof importMeta.glob === 'function'
    ? importMeta.glob('/assets/mapas/**/*.png', {
        eager: true,
        query: '?url',
        import: 'default',
      })
    : {};

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
  // File paths for diagnostic messages
  expectedFiles: {
    thumbnail: string;
    pov1: string;
    pov2: string;
    pov3: string;
    pov4: string;
    back: string;
  };
}

export const CANTINA_MAPS: Record<CantinaMapId, CantinaMapDefinition> = {
  mapa1: {
    id: 'mapa1',
    name: 'CANTINA NEÓN',
    description:
      'Una cantina japonesa bajo la lluvia, entre faroles cálidos y el resplandor de la ciudad.',
    thumbnail:
      bundledMapGlob['/assets/mapas/mapa1/map1pov1.png'] || '/assets/mapas/mapa1/map1pov1.png',
    pov1:
      bundledMapGlob['/assets/mapas/mapa1/map1pov1.png'] || '/assets/mapas/mapa1/map1pov1.png',
    pov2:
      bundledMapGlob['/assets/mapas/mapa1/map1pov2.png'] || '/assets/mapas/mapa1/map1pov2.png',
    pov3:
      bundledMapGlob['/assets/mapas/mapa1/map1pov3.png'] || '/assets/mapas/mapa1/map1pov3.png',
    pov4:
      bundledMapGlob['/assets/mapas/mapa1/map1pov4.png'] || '/assets/mapas/mapa1/map1pov4.png',
    back:
      bundledMapGlob['/assets/mapas/mapa1/map1backcard.png'] ||
      '/assets/mapas/mapa1/map1backcard.png',
    expectedFiles: {
      thumbnail: 'assets/mapas/mapa1/map1pov1.png',
      pov1: 'assets/mapas/mapa1/map1pov1.png',
      pov2: 'assets/mapas/mapa1/map1pov2.png',
      pov3: 'assets/mapas/mapa1/map1pov3.png',
      pov4: 'assets/mapas/mapa1/map1pov4.png',
      back: 'assets/mapas/mapa1/map1backcard.png',
    },
  },

  mapa2: {
    id: 'mapa2',
    name: 'ESTACIÓN ESTELAR',
    description:
      'Una cantina steampunk perdida en el espacio, entre cobre, vapor y estrellas.',
    thumbnail:
      bundledMapGlob['/assets/mapas/mapa2/map2pov1.png'] || '/assets/mapas/mapa2/map2pov1.png',
    pov1:
      bundledMapGlob['/assets/mapas/mapa2/map2pov1.png'] || '/assets/mapas/mapa2/map2pov1.png',
    pov2:
      bundledMapGlob['/assets/mapas/mapa2/map2pov2.png'] || '/assets/mapas/mapa2/map2pov2.png',
    pov3:
      bundledMapGlob['/assets/mapas/mapa2/map2pov3.png'] || '/assets/mapas/mapa2/map2pov3.png',
    pov4:
      bundledMapGlob['/assets/mapas/mapa2/map2pov4.png'] || '/assets/mapas/mapa2/map2pov4.png',
    back:
      bundledMapGlob['/assets/mapas/mapa2/map2backcard.png'] ||
      '/assets/mapas/mapa2/map2backcard.png',
    expectedFiles: {
      thumbnail: 'assets/mapas/mapa2/map2pov1.png',
      pov1: 'assets/mapas/mapa2/map2pov1.png',
      pov2: 'assets/mapas/mapa2/map2pov2.png',
      pov3: 'assets/mapas/mapa2/map2pov3.png',
      pov4: 'assets/mapas/mapa2/map2pov4.png',
      back: 'assets/mapas/mapa2/map2backcard.png',
    },
  },

  mapa3: {
    id: 'mapa3',
    name: 'PUERTO MALDITO',
    description:
      'Un refugio pirata entre bruma verdosa, viejos navíos y secretos del mar.',
    thumbnail:
      bundledMapGlob['/assets/mapas/mapa3/map3pov1.png'] || '/assets/mapas/mapa3/map3pov1.png',
    pov1:
      bundledMapGlob['/assets/mapas/mapa3/map3pov1.png'] || '/assets/mapas/mapa3/map3pov1.png',
    pov2:
      bundledMapGlob['/assets/mapas/mapa3/map3pov2.png'] || '/assets/mapas/mapa3/map3pov2.png',
    pov3:
      bundledMapGlob['/assets/mapas/mapa3/map3pov3.png'] || '/assets/mapas/mapa3/map3pov3.png',
    pov4:
      bundledMapGlob['/assets/mapas/mapa3/map3pov4.png'] || '/assets/mapas/mapa3/map3pov4.png',
    back:
      bundledMapGlob['/assets/mapas/mapa3/map3backcard.png'] ||
      '/assets/mapas/mapa3/map3backcard.png',
    expectedFiles: {
      thumbnail: 'assets/mapas/mapa3/map3pov1.png',
      pov1: 'assets/mapas/mapa3/map3pov1.png',
      pov2: 'assets/mapas/mapa3/map3pov2.png',
      pov3: 'assets/mapas/mapa3/map3pov3.png',
      pov4: 'assets/mapas/mapa3/map3pov4.png',
      back: 'assets/mapas/mapa3/map3backcard.png',
    },
  },
};

/**
 * Maps player seat index to explicit POV key according to strict game specification:
 * PLAYER 1 / HOST -> POV1
 * PLAYER 2        -> POV3
 * PLAYER 3        -> POV2
 * PLAYER 4        -> POV4
 *
 * DO NOT use seatIndex + 1!
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

/**
 * Diagnostic logger for map asset errors.
 * Never silently substitutes another map.
 */
export function logCantinaMapAssetError(
  mapId: CantinaMapId,
  povKey: CantinaPovKey | 'back' | 'thumbnail',
  resolvedSrc: string
) {
  const mapDef = CANTINA_MAPS[mapId];
  const expectedFile = mapDef?.expectedFiles[povKey] || `assets/mapas/${mapId}/${povKey}.png`;
  console.error(
    `[CANTINA ASSET ERROR]\ntype: map\nmap: ${mapId}\npov: ${povKey}\nresolvedSrc: ${resolvedSrc}\nexpectedFile: ${expectedFile}`
  );
}
