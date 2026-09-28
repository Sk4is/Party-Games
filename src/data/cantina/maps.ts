// Re-exports from the canonical Cantina asset registry (cantinaAssets.ts)
export {
  CANTINA_MAP_ASSETS,
  CANTINA_MAPS,
  getSeatPovKey,
  resolveCantinaSeatBackground,
  logCantinaMapAssetError,
} from './cantinaAssets';

export type {
  CantinaMapId,
  CantinaPovKey,
  CantinaMapDefinition,
} from './cantinaAssets';
