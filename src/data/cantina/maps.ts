import { MapDefinition, CantinaMapId } from '../../types/cantina';

export const CANTINA_MAPS: Record<CantinaMapId, MapDefinition> = {
  mapa1: {
    id: 'mapa1',
    name: 'CANTINA NEÓN',
    description: 'Una cantina japonesa bajo la lluvia, entre faroles cálidos y el resplandor de la ciudad.',
    thumbnail: '/assets/mapas/mapa1/map1pov1.png',
    povImages: [
      '/assets/mapas/mapa1/map1pov1.png',
      '/assets/mapas/mapa1/map1pov2.png',
      '/assets/mapas/mapa1/map1pov3.png',
      '/assets/mapas/mapa1/map1pov4.png',
    ],
    backCard: '/assets/mapas/mapa1/map1backcard.png',
  },
  mapa2: {
    id: 'mapa2',
    name: 'ESTACIÓN ESTELAR',
    description: 'Una cantina steampunk perdida en el espacio, entre cobre, vapor y estrellas.',
    thumbnail: '/assets/mapas/mapa2/map2pov1.png',
    povImages: [
      '/assets/mapas/mapa2/map2pov1.png',
      '/assets/mapas/mapa2/map2pov2.png',
      '/assets/mapas/mapa2/map2pov3.png',
      '/assets/mapas/mapa2/map2pov4.png',
    ],
    backCard: '/assets/mapas/mapa2/map2backcard.png',
  },
  mapa3: {
    id: 'mapa3',
    name: 'PUERTO MALDITO',
    description: 'Un refugio pirata entre bruma verdosa, viejos navíos y secretos del mar.',
    thumbnail: '/assets/mapas/mapa3/map3pov1.png',
    povImages: [
      '/assets/mapas/mapa3/map3pov1.png',
      '/assets/mapas/mapa3/map3pov2.png',
      '/assets/mapas/mapa3/map3pov3.png',
      '/assets/mapas/mapa3/map3pov4.png',
    ],
    backCard: '/assets/mapas/mapa3/map3backcard.png',
  },
};

export const DEFAULT_MAP_ID: CantinaMapId = 'mapa3';

/**
 * Maps player seat index to perspective image number according to rules:
 * PLAYER 1 / HOST -> POV1
 * PLAYER 2        -> POV3
 * PLAYER 3        -> POV2
 * PLAYER 4        -> POV4
 */
export function getSeatPovNumber(seatIndex: number): number {
  switch (seatIndex % 4) {
    case 0:
      return 1;
    case 1:
      return 3;
    case 2:
      return 2;
    case 3:
      return 4;
    default:
      return 1;
  }
}
