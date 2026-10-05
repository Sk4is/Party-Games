/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Centralized Asset Manifest for Dark Protocol.
 *
 * When final art assets (background PNGs, character spritesheets, item sprites)
 * are provided, simply configure their URLs here.
 * The rendering system automatically falls back to procedural pixel-art vector/canvas
 * placeholders if any asset URL is null, empty or fails to load.
 */

export interface AssetEntry {
  url?: string | null;
  width?: number;
  height?: number;
  frameWidth?: number;
  frameHeight?: number;
  totalFrames?: number;
}

export const darkProtocolAssets = {
  rooms: {
    control_room: {
      url: null, // Will use procedural industrial control room placeholder
      ambientMusic: 'ambient_control',
    },
    laboratory: {
      url: null,
      ambientMusic: 'ambient_lab',
    },
    electrical_room: {
      url: null,
      ambientMusic: 'ambient_electric',
    },
    maintenance: {
      url: null,
      ambientMusic: 'ambient_maintenance',
    },
    security: {
      url: null,
      ambientMusic: 'ambient_security',
    },
    generators: {
      url: null,
      ambientMusic: 'ambient_generators',
    },
  },

  characters: {
    explorer: {
      url: null, // Procedural pixel-art hazmat explorer with lantern & animations
      width: 32,
      height: 64,
    },
    operator: {
      url: null, // Procedural technician in labcoat/headset
      width: 32,
      height: 64,
    },
  },

  entity: {
    manifestation: {
      url: null, // Procedural void entity with pulsing darkness and glowing red eyes
      width: 44,
      height: 72,
    },
    glitchOverlay: {
      url: null,
    },
  },

  doors: {
    sliding_door: {
      url: null,
      width: 60,
      height: 120,
    },
    heavy_bulkhead: {
      url: null,
      width: 80,
      height: 130,
    },
  },

  cameras: {
    cctv_dome: {
      url: null,
    },
    cctv_wall: {
      url: null,
    },
  },

  hidingSpots: {
    taquilla: {
      url: null,
      name: 'Taquilla metálica',
    },
    bajo_mesa: {
      url: null,
      name: 'Debajo del escritorio',
    },
    compartimento_tecnico: {
      url: null,
      name: 'Conducto de ventilación / registro',
    },
  },

  machines: {
    electrical_panel: {
      url: null,
    },
    frequency_terminal: {
      url: null,
    },
    pressure_valves: {
      url: null,
    },
    generator_unit: {
      url: null,
    },
    escape_hatch: {
      url: null,
    },
  },

  lights: {
    fluorescent_tube: {
      url: null,
    },
    emergency_siren: {
      url: null,
    },
  },
};

/**
 * Cache for loaded images with automatic fallback to null on error
 */
const loadedImageCache = new Map<string, HTMLImageElement | null>();

export function getLoadedAssetImage(url?: string | null): HTMLImageElement | null {
  if (!url || typeof window === 'undefined') return null;
  if (loadedImageCache.has(url)) {
    return loadedImageCache.get(url) || null;
  }

  const img = new Image();
  img.src = url;
  img.onload = () => {
    loadedImageCache.set(url, img);
  };
  img.onerror = () => {
    console.warn(`[DarkProtocol] Asset not found at ${url}, using procedural placeholder.`);
    loadedImageCache.set(url, null);
  };
  return null;
}
