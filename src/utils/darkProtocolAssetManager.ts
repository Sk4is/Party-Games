/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const DARK_PROTOCOL_ASSETS = {
  // 10 Room Backgrounds
  sala1: '/assets/dark-protocol/sala1.png',
  sala2: '/assets/dark-protocol/sala2.png',
  sala3: '/assets/dark-protocol/sala3.png',
  sala4: '/assets/dark-protocol/sala4.png',
  sala5: '/assets/dark-protocol/sala5.png',
  sala6: '/assets/dark-protocol/sala6.png',
  sala7: '/assets/dark-protocol/sala7.png',
  sala8: '/assets/dark-protocol/sala8.png',
  sala9: '/assets/dark-protocol/sala9.png',
  sala10: '/assets/dark-protocol/sala10.png',

  // Interactive Props
  camara: '/assets/dark-protocol/camara.png',
  mesa: '/assets/dark-protocol/mesa.png',
  taquilla: '/assets/dark-protocol/taquilla.png',
  trampilla: '/assets/dark-protocol/trampilla.png',
  valvula: '/assets/dark-protocol/valvula.png',

  // Standard Door States
  puerta_cerrada: '/assets/dark-protocol/puerta_cerrada.png',
  puerta_entreabierta: '/assets/dark-protocol/puerta_entreabierta.png',
  puerta_abierta: '/assets/dark-protocol/puerta_abierta.png',

  // Final Evacuation Gate
  salida_evacuacion: '/assets/dark-protocol/salida_evacuacion.png',
} as const;

export type DarkProtocolAssetKey = keyof typeof DARK_PROTOCOL_ASSETS;

class DarkProtocolAssetManager {
  private images: Map<string, HTMLImageElement> = new Map();
  private loaded: Set<string> = new Set();
  private failed: Set<string> = new Set();
  private loadingPromises: Map<string, Promise<HTMLImageElement | null>> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      this.preloadAll();
    }
  }

  public preload(src: string): Promise<HTMLImageElement | null> {
    if (this.loaded.has(src)) {
      return Promise.resolve(this.images.get(src) || null);
    }
    if (this.failed.has(src)) {
      return Promise.resolve(null);
    }
    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src)!;
    }

    const promise = new Promise<HTMLImageElement | null>((resolve) => {
      const img = new Image();
      img.src = src;

      img.onload = () => {
        this.images.set(src, img);
        this.loaded.add(src);
        resolve(img);
      };

      img.onerror = () => {
        this.failed.add(src);
        console.warn(`[DarkProtocol] Asset failed to load: ${src}`);
        resolve(null);
      };
    });

    this.loadingPromises.set(src, promise);
    return promise;
  }

  public preloadAll(): void {
    Object.values(DARK_PROTOCOL_ASSETS).forEach((path) => {
      this.preload(path);
    });
  }

  public isLoaded(src: string): boolean {
    return this.loaded.has(src);
  }

  public hasFailed(src: string): boolean {
    return this.failed.has(src);
  }

  public getImage(src: string): HTMLImageElement | null {
    if (this.loaded.has(src)) {
      return this.images.get(src) || null;
    }
    if (!this.failed.has(src) && !this.loadingPromises.has(src)) {
      this.preload(src);
    }
    return null;
  }
}

export const darkProtocolAssets = new DarkProtocolAssetManager();
