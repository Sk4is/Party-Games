// Central card asset registry for La Cantina del Farol
// Strictly uses the user's PNG artwork without any text/suit overlays

// Vite dynamic glob matching all cartas in assets/cartas
const importMeta = import.meta as unknown as {
  glob: (pattern: string, options?: Record<string, unknown>) => Record<string, string>;
};

const bundledCardGlob: Record<string, string> =
  typeof importMeta.glob === 'function'
    ? importMeta.glob('/assets/cartas/*.png', {
        eager: true,
        query: '?url',
        import: 'default',
      })
    : {};

export const CANTINA_CARD_FILES: Record<string, string> = {
  J: 'assets/cartas/cartaj.png',
  Q: 'assets/cartas/cartoq.png',
  K: 'assets/cartas/cartak.png',
  JOKER: 'assets/cartas/joker.png',
  DIABLO: 'assets/cartas/diablo.png',
};

// Single Source of Truth for card fronts
export const CANTINA_CARD_ASSETS: Record<string, string> = {
  J: bundledCardGlob['/assets/cartas/cartaj.png'] || '/assets/cartas/cartaj.png',
  Q:
    bundledCardGlob['/assets/cartas/cartoq.png'] ||
    bundledCardGlob['/assets/cartas/cartaq.png'] ||
    '/assets/cartas/cartoq.png',
  K: bundledCardGlob['/assets/cartas/cartak.png'] || '/assets/cartas/cartak.png',
  JOKER: bundledCardGlob['/assets/cartas/joker.png'] || '/assets/cartas/joker.png',
  DIABLO: bundledCardGlob['/assets/cartas/diablo.png'] || '/assets/cartas/diablo.png',
};

// Alternative candidate sources for Q (handling both cartoq.png and cartaq.png)
export const CANTINA_CARD_CANDIDATES: Record<string, string[]> = {
  J: [CANTINA_CARD_ASSETS.J],
  Q: [
    CANTINA_CARD_ASSETS.Q,
    bundledCardGlob['/assets/cartas/cartaq.png'] || '/assets/cartas/cartaq.png',
  ],
  K: [CANTINA_CARD_ASSETS.K],
  JOKER: [CANTINA_CARD_ASSETS.JOKER],
  DIABLO: [CANTINA_CARD_ASSETS.DIABLO],
};

export function logCantinaCardAssetError(cardRank: string, resolvedSrc: string) {
  const expectedFile =
    CANTINA_CARD_FILES[cardRank] || `assets/cartas/${cardRank.toLowerCase()}.png`;
  console.error(
    `[CANTINA ASSET ERROR]\ntype: card\ncard: ${cardRank}\nresolvedSrc: ${resolvedSrc}\nexpectedFile: ${expectedFile}`
  );
}
