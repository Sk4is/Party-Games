// Re-exports from the canonical Cantina asset registry (cantinaAssets.ts)
export {
  CANTINA_MAP_ASSETS,
  CANTINA_MAPS,
  CANTINA_SEAT_CONFIG,
  SEAT_TO_POV,
  SEAT_TO_PHYSICAL_CHAIR,
  getSeatPovKey,
  getMapPovForSeat,
  getPhysicalChairForSeat,
  getRelativeSeat,
  resolveCantinaSeatBackground,
  logCantinaMapAssetError,
} from './cantinaAssets';

export type {
  CantinaMapId,
  CantinaPovKey,
  CantinaPhysicalSeat,
  CantinaSeatConfigEntry,
  CantinaMapDefinition,
} from './cantinaAssets';
