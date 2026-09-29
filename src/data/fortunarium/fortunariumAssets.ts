import {
  FortunariumSymbolId,
  NormalSymbolId,
  SpecialSymbolId,
  FortunariumUpgradeId,
  FortunariumUpgradeRarity,
  FortunariumBetMode,
  FortunariumPatternType,
  FortunariumCellCoord,
  FortunariumModifierId,
  FortunariumActiveModifier,
} from '../../types/fortunarium';

export const FORTUNARIUM_MACHINE_ASSET = '/assets/fortunarium/tragaperras.png';

export const FORTUNARIUM_SYMBOL_ASSETS: Record<FortunariumSymbolId, string> = {
  cereza: '/assets/fortunarium/cereza.png',
  limon: '/assets/fortunarium/limon.png',
  naranja: '/assets/fortunarium/naranja.png',
  ciruela: '/assets/fortunarium/ciruela.png',
  uvas: '/assets/fortunarium/uvas.png',
  trebol: '/assets/fortunarium/trebol.png',
  campana: '/assets/fortunarium/campana.png',
  herradura: '/assets/fortunarium/herradura.png',
  estrella: '/assets/fortunarium/estrella.png',
  diamante: '/assets/fortunarium/diamante.png',
  corona: '/assets/fortunarium/corona.png',
  siete: '/assets/fortunarium/siete.png',
  bomba: '/assets/fortunarium/bomba.png',
  llave: '/assets/fortunarium/llave.png',
  rayo: '/assets/fortunarium/rayo.png',
  calavera: '/assets/fortunarium/calavera.png',
  comodin: '/assets/fortunarium/comodin.png',
  moneda: '/assets/fortunarium/moneda.png',
  interrogacion: '/assets/fortunarium/interrogacion.png',
};

export const FORTUNARIUM_CURSOR_COLORS: {
  id: string;
  label: string;
  hex: string;
}[] = [
  { id: 'red', label: 'Rojo', hex: '#ef4444' },
  { id: 'orange', label: 'Naranja', hex: '#f97316' },
  { id: 'yellow', label: 'Amarillo', hex: '#eab308' },
  { id: 'lime', label: 'Lima', hex: '#84cc16' },
  { id: 'cyan', label: 'Cian', hex: '#06b6d4' },
  { id: 'blue', label: 'Azul', hex: '#3b82f6' },
  { id: 'purple', label: 'Morado', hex: '#a855f7' },
  { id: 'pink', label: 'Rosa', hex: '#ec4899' },
];

export interface FortunariumSymbolMeta {
  id: FortunariumSymbolId;
  name: string;
  category: 'normal' | 'special';
  tier: 1 | 2 | 3 | 4 | 5;
  asset: string;
  basePayout3: number;
  basePayout4: number;
  basePayout5: number;
  weight: number;
  shortDesc: string;
  specialProperty?: string;
  activationRule?: string;
  badgeColor: string;
}

// ============================================================================
// SINGLE AUTHORITATIVE SYMBOL & WEIGHT TABLE (SECTION 8)
// Normal weights: 220, 190, 165, 140, 115, 90, 68, 50, 34, 20, 9, 3 (Sum = 1104)
// Special weights: 1.20, 0.85, 0.55, 0.35, 0.28, 0.20, 0.12 (Sum = 3.55)
// ============================================================================
export const FORTUNARIUM_SYMBOLS: Record<FortunariumSymbolId, FortunariumSymbolMeta> = {
  cereza: {
    id: 'cereza',
    name: 'Cereza',
    category: 'normal',
    tier: 1,
    asset: FORTUNARIUM_SYMBOL_ASSETS.cereza,
    basePayout3: 11,
    basePayout4: 32,
    basePayout5: 85,
    weight: 220,
    shortDesc: 'Fruta básica muy frecuente. Permite recuperar el coste de la tirada.',
    specialProperty: 'Sinergia con «Cosecha Roja» (+35% pago por nivel)',
    badgeColor: '#fb7185',
  },
  limon: {
    id: 'limon',
    name: 'Limón',
    category: 'normal',
    tier: 1,
    asset: FORTUNARIUM_SYMBOL_ASSETS.limon,
    basePayout3: 13,
    basePayout4: 38,
    basePayout5: 100,
    weight: 190,
    shortDesc: 'Cítrico frecuente que aporta pequeños beneficios iniciales.',
    specialProperty: 'Sinergia con «Huerto Cítrico» (+18% frecuencia, +25% pago)',
    badgeColor: '#fde047',
  },
  naranja: {
    id: 'naranja',
    name: 'Naranja',
    category: 'normal',
    tier: 1,
    asset: FORTUNARIUM_SYMBOL_ASSETS.naranja,
    basePayout3: 17,
    basePayout4: 48,
    basePayout5: 125,
    weight: 165,
    shortDesc: 'Fruta jugosa con retorno sólido en líneas de 3, 4 o 5.',
    specialProperty: 'Sinergia con «Huerto Cítrico» (+18% frecuencia, +25% pago)',
    badgeColor: '#fb923c',
  },
  ciruela: {
    id: 'ciruela',
    name: 'Ciruela',
    category: 'normal',
    tier: 1,
    asset: FORTUNARIUM_SYMBOL_ASSETS.ciruela,
    basePayout3: 20,
    basePayout4: 58,
    basePayout5: 150,
    weight: 140,
    shortDesc: 'Fruta clásica de buen rendimiento cuando forma diagonales o columnas.',
    specialProperty: 'Sinergia con «Cosecha Roja» (+35% pago por nivel)',
    badgeColor: '#c084fc',
  },
  uvas: {
    id: 'uvas',
    name: 'Uvas',
    category: 'normal',
    tier: 2,
    asset: FORTUNARIUM_SYMBOL_ASSETS.uvas,
    basePayout3: 27,
    basePayout4: 76,
    basePayout5: 195,
    weight: 115,
    shortDesc: 'Racimo selecto de valor medio con excelentes premios en 4 y 5 aciertos.',
    specialProperty: 'Sinergia con «Reserva de la Viña» (+35% pago)',
    badgeColor: '#a855f7',
  },
  trebol: {
    id: 'trebol',
    name: 'Trébol',
    category: 'normal',
    tier: 2,
    asset: FORTUNARIUM_SYMBOL_ASSETS.trebol,
    basePayout3: 36,
    basePayout4: 100,
    basePayout5: 255,
    weight: 90,
    shortDesc: 'Amuleto de buena fortuna que además neutraliza Calaveras.',
    specialProperty: 'Cada Trébol neutraliza 1 Calavera en la tirada (+12 CR)',
    badgeColor: '#34d399',
  },
  campana: {
    id: 'campana',
    name: 'Campana',
    category: 'normal',
    tier: 2,
    asset: FORTUNARIUM_SYMBOL_ASSETS.campana,
    basePayout3: 50,
    basePayout4: 140,
    basePayout5: 355,
    weight: 68,
    shortDesc: 'Campana de bronce del casino con pagos potentes.',
    specialProperty: 'Sinergia con «Campana de Bronce» (+45% en 4×/5×)',
    badgeColor: '#fbbf24',
  },
  herradura: {
    id: 'herradura',
    name: 'Herradura',
    category: 'normal',
    tier: 3,
    asset: FORTUNARIUM_SYMBOL_ASSETS.herradura,
    basePayout3: 68,
    basePayout4: 190,
    basePayout5: 485,
    weight: 50,
    shortDesc: 'Forja pesada que repara el chasis al formar un patrón ganador.',
    specialProperty: 'Al formar patrón ganador repara +4% de Integridad',
    badgeColor: '#f59e0b',
  },
  estrella: {
    id: 'estrella',
    name: 'Estrella',
    category: 'normal',
    tier: 3,
    asset: FORTUNARIUM_SYMBOL_ASSETS.estrella,
    basePayout3: 95,
    basePayout4: 265,
    basePayout5: 680,
    weight: 34,
    shortDesc: 'Astro brillante de alto valor para escalar cuotas avanzadas.',
    specialProperty: 'Al formar patrón ganador sube +0.10x el Voltaje',
    badgeColor: '#fef08a',
  },
  diamante: {
    id: 'diamante',
    name: 'Diamante',
    category: 'normal',
    tier: 4,
    asset: FORTUNARIUM_SYMBOL_ASSETS.diamante,
    basePayout3: 145,
    basePayout4: 400,
    basePayout5: 1000,
    weight: 20,
    shortDesc: 'Joya de alta rareza capaz de sellar una cuota de un golpe.',
    specialProperty: 'Sinergia con «Imán de Diamante» (+25% aparición)',
    badgeColor: '#38bdf8',
  },
  corona: {
    id: 'corona',
    name: 'Corona',
    category: 'normal',
    tier: 4,
    asset: FORTUNARIUM_SYMBOL_ASSETS.corona,
    basePayout3: 235,
    basePayout4: 640,
    basePayout5: 1600,
    weight: 9,
    shortDesc: 'Reliquia real extremadamente codiciada.',
    specialProperty: 'Otorga +1 Llave de Taller al alinear 4 o 5 Coronas',
    badgeColor: '#facc15',
  },
  siete: {
    id: 'siete',
    name: 'Siete',
    category: 'normal',
    tier: 5,
    asset: FORTUNARIUM_SYMBOL_ASSETS.siete,
    basePayout3: 390,
    basePayout4: 1050,
    basePayout5: 2750,
    weight: 3,
    shortDesc: 'El emblema supremo del Fortunarium (rareza máxima).',
    specialProperty: 'Sinergia con «Siete Dorado» (+45% pago y mayor probabilidad de Jackpot)',
    badgeColor: '#f43f5e',
  },

  // ==========================================================================
  // SPECIAL SYMBOLS (7) — Total weight = 3.55 (~0.32% per cell -> genuinely rare)
  // ==========================================================================
  moneda: {
    id: 'moneda',
    name: 'Moneda',
    category: 'special',
    tier: 2,
    asset: FORTUNARIUM_SYMBOL_ASSETS.moneda,
    basePayout3: 0,
    basePayout4: 0,
    basePayout5: 0,
    weight: 1.2,
    shortDesc:
      '¡Efecto directo! Cada Moneda otorga +16 CR inmediatos (escalados por apuesta y voltaje). Con 3+ Monedas añade un bono extra de +45 CR.',
    specialProperty: '+16 CR directos por cada Moneda',
    activationRule: 'SE ACTIVA CON 1 APARICIÓN',
    badgeColor: '#fcd34d',
  },
  llave: {
    id: 'llave',
    name: 'Llave',
    category: 'special',
    tier: 3,
    asset: FORTUNARIUM_SYMBOL_ASSETS.llave,
    basePayout3: 0,
    basePayout4: 0,
    basePayout5: 0,
    weight: 0.85,
    shortDesc:
      '¡Efecto directo! Otorga +1 Llave de Taller, repara +8% de Integridad y desactiva 1 Bomba en la misma tirada (+35 CR).',
    specialProperty: '+1 Llave · +8% Integridad · Desactiva 1 Bomba',
    activationRule: 'SE ACTIVA CON 1 APARICIÓN',
    badgeColor: '#fbbf24',
  },
  rayo: {
    id: 'rayo',
    name: 'Rayo',
    category: 'special',
    tier: 3,
    asset: FORTUNARIUM_SYMBOL_ASSETS.rayo,
    basePayout3: 0,
    basePayout4: 0,
    basePayout5: 0,
    weight: 0.55,
    shortDesc:
      '¡Efecto directo! Sobrecarga la máquina subiendo +0.25x el multiplicador de Voltaje antes de pagar los patrones.',
    specialProperty: '+0.25x Multiplicador de Voltaje inmediato',
    activationRule: 'SE ACTIVA CON 1 APARICIÓN',
    badgeColor: '#38bdf8',
  },
  interrogacion: {
    id: 'interrogacion',
    name: 'Interrogación',
    category: 'special',
    tier: 3,
    asset: FORTUNARIUM_SYMBOL_ASSETS.interrogacion,
    basePayout3: 0,
    basePayout4: 0,
    basePayout5: 0,
    weight: 0.35,
    shortDesc:
      '¡Efecto directo! Otorga un premio misterioso (+20 CR) o abre un Evento Interactivo de Riesgo/Recompensa para el grupo.',
    specialProperty: 'Premio Misterioso + Evento Interactivo',
    activationRule: 'SE ACTIVA CON 1 APARICIÓN',
    badgeColor: '#e879f9',
  },
  bomba: {
    id: 'bomba',
    name: 'Bomba',
    category: 'special',
    tier: 3,
    asset: FORTUNARIUM_SYMBOL_ASSETS.bomba,
    basePayout3: 0,
    basePayout4: 0,
    basePayout5: 0,
    weight: 0.28,
    shortDesc:
      '¡Peligro! Explota causando -14% de Integridad y destruyendo -20 CR de la Caja Común. Se neutraliza con Llave o Artificiero.',
    specialProperty: '-14% Integridad y -20 CR (Neutralizable)',
    activationRule: 'PELIGRO CON 1 APARICIÓN',
    badgeColor: '#ef4444',
  },
  calavera: {
    id: 'calavera',
    name: 'Calavera',
    category: 'special',
    tier: 3,
    asset: FORTUNARIUM_SYMBOL_ASSETS.calavera,
    basePayout3: 0,
    basePayout4: 0,
    basePayout5: 0,
    weight: 0.2,
    shortDesc:
      '¡Maldición! Drena el 20% de la ganancia de la tirada (mín. -15 CR) y resta -6% de Integridad. Un Trébol la bloquea.',
    specialProperty: 'Drena ganancias y -6% Integridad',
    activationRule: 'MALDICIÓN CON 1 APARICIÓN',
    badgeColor: '#a1a1aa',
  },
  comodin: {
    id: 'comodin',
    name: 'Comodín',
    category: 'special',
    tier: 5,
    asset: FORTUNARIUM_SYMBOL_ASSETS.comodin,
    basePayout3: 180,
    basePayout4: 480,
    basePayout5: 1200,
    weight: 0.12,
    shortDesc:
      'Sustituye a cualquier símbolo normal en patrones Horizontales, Verticales, Diagonales y Triángulos otorgando +25% de bono.',
    specialProperty: 'Sustituye a cualquier símbolo normal (+25% pago)',
    activationRule: ' SUSTITUYE EN PATRONES',
    badgeColor: '#c084fc',
  },
};

export const NORMAL_SYMBOL_IDS: NormalSymbolId[] = [
  'cereza',
  'limon',
  'naranja',
  'ciruela',
  'uvas',
  'trebol',
  'campana',
  'herradura',
  'estrella',
  'diamante',
  'corona',
  'siete',
];

export const NORMAL_SYMBOLS_BY_VALUE_DESC: NormalSymbolId[] = [
  'siete',
  'corona',
  'diamante',
  'estrella',
  'herradura',
  'campana',
  'trebol',
  'uvas',
  'ciruela',
  'naranja',
  'limon',
  'cereza',
];

export const SPECIAL_SYMBOL_IDS: SpecialSymbolId[] = [
  'comodin',
  'moneda',
  'llave',
  'rayo',
  'interrogacion',
  'bomba',
  'calavera',
];

export const ALL_FORTUNARIUM_SYMBOL_IDS: FortunariumSymbolId[] = [
  ...NORMAL_SYMBOL_IDS,
  ...SPECIAL_SYMBOL_IDS,
];

// ============================================================================
// DEDICATED JACKPOT CHANCE (SECTIONS 22–26)
// Base chance = 0.1% (0.001 = 1 / 1000) per completed paid spin
// Hard cap = 1.0% (0.01)
// ============================================================================
export const BASE_JACKPOT_CHANCE = 0.001;
export const MAX_JACKPOT_CHANCE = 0.01;

export function computeEffectiveJackpotChance(
  upgradesOrModifiers?:
    | Record<FortunariumUpgradeId, number>
    | Pick<FortunariumActiveModifier, 'modifierId'>[],
  betMode: FortunariumBetMode = 'normal',
  activeModifiers: Pick<FortunariumActiveModifier, 'modifierId'>[] = []
): number {
  let upgrades: Record<FortunariumUpgradeId, number>;
  let effectiveModifiers: Pick<FortunariumActiveModifier, 'modifierId'>[];

  if (Array.isArray(upgradesOrModifiers)) {
    upgrades = createInitialUpgradesState();
    effectiveModifiers = upgradesOrModifiers;
  } else {
    upgrades = upgradesOrModifiers || createInitialUpgradesState();
    effectiveModifiers = activeModifiers || [];
  }

  let baseChance = BASE_JACKPOT_CHANCE;
  const hasSieteSuerte = effectiveModifiers.some((m) => m.modifierId === 'siete_suerte');
  const hasFortunaDesatada = effectiveModifiers.some(
    (m) => m.modifierId === 'fortuna_desatada'
  );

  if (hasSieteSuerte) {
    baseChance = Math.max(baseChance, 0.005); // 0.50%
  } else if (hasFortunaDesatada) {
    baseChance = Math.max(baseChance, 0.0025); // 0.25%
  }

  let mult = 1.0;
  if ((upgrades.siete_dorado || 0) > 0) {
    mult += upgrades.siete_dorado * 0.25;
  }
  if (betMode === 'doble') mult *= 1.15;
  if (betMode === 'sobrecarga') mult *= 1.35;

  // Hard cap at 1.0% (0.01) so Jackpot remains genuinely rare
  return Math.min(MAX_JACKPOT_CHANCE, Number((baseChance * mult).toFixed(5)));
}

// ============================================================================
// EXACT SHAPE MASKS FOR X, TRIÁNGULO AND TRIÁNGULO INVERTIDO (SECTIONS 17–21)
// ============================================================================
// X Pattern (5 cells spanning the full 3×5 reel window):
// [X][ ][ ][ ][X] -> (row 0, col 0), (row 0, col 4)
// [ ][ ][X][ ][ ] -> (row 1, col 2)
// [X][ ][ ][ ][X] -> (row 2, col 0), (row 2, col 4)
export const X_MASK_CELLS: FortunariumCellCoord[] = [
  { col: 0, row: 0 },
  { col: 4, row: 0 },
  { col: 2, row: 1 },
  { col: 0, row: 2 },
  { col: 4, row: 2 },
];

// Upright Triangle (8 cells):
// [ ][ ][X][ ][ ]
// [ ][X][ ][X][ ]
// [X][X][X][X][X]
export const TRIANGLE_MASK_CELLS: FortunariumCellCoord[] = [
  { col: 2, row: 0 },
  { col: 1, row: 1 },
  { col: 3, row: 1 },
  { col: 0, row: 2 },
  { col: 1, row: 2 },
  { col: 2, row: 2 },
  { col: 3, row: 2 },
  { col: 4, row: 2 },
];

// Inverted Triangle (8 cells):
// [X][X][X][X][X]
// [ ][X][ ][X][ ]
// [ ][ ][X][ ][ ]
export const INVERTED_TRIANGLE_MASK_CELLS: FortunariumCellCoord[] = [
  { col: 0, row: 0 },
  { col: 1, row: 0 },
  { col: 2, row: 0 },
  { col: 3, row: 0 },
  { col: 4, row: 0 },
  { col: 1, row: 1 },
  { col: 3, row: 1 },
  { col: 2, row: 2 },
];

// ============================================================================
// DATA-DRIVEN PATTERN GUIDE CATALOG (SECTIONS 11–17 & 41)
// ============================================================================
export interface FortunariumPatternGuideItem {
  id: string;
  name: string;
  patternType: FortunariumPatternType;
  patternCategory: 'LINE' | 'SHAPE';
  baseMultiplier: number;
  geometryDesc: string;
  payoutDesc: string;
  allowsWild: boolean;
  cells: FortunariumCellCoord[];
}

export const FORTUNARIUM_PATTERNS_CATALOG: FortunariumPatternGuideItem[] = [
  {
    id: 'horizontal_line',
    name: 'Horizontal (3, 4 o 5)',
    patternType: 'HORIZONTAL',
    patternCategory: 'LINE',
    baseMultiplier: 1.0,
    geometryDesc:
      '3, 4 o 5 símbolos iguales compatibles consecutivos en la misma fila horizontal (superior, central o inferior). Se paga la cadena máxima.',
    payoutDesc: 'Multiplicador de línea ×1.00 (según longitud 3×, 4× o 5×)',
    allowsWild: true,
    cells: [
      { col: 0, row: 1 },
      { col: 1, row: 1 },
      { col: 2, row: 1 },
      { col: 3, row: 1 },
      { col: 4, row: 1 },
    ],
  },
  {
    id: 'vertical_line',
    name: 'Vertical (3)',
    patternType: 'VERTICAL',
    patternCategory: 'LINE',
    baseMultiplier: 1.0,
    geometryDesc:
      '3 símbolos iguales compatibles alineados verticalmente en cualquiera de las 5 columnas.',
    payoutDesc: 'Pago 3× del símbolo (Multiplicador ×1.00)',
    allowsWild: true,
    cells: [
      { col: 2, row: 0 },
      { col: 2, row: 1 },
      { col: 2, row: 2 },
    ],
  },
  {
    id: 'diagonal_down',
    name: 'Diagonal Descendente (3)',
    patternType: 'DIAGONAL',
    patternCategory: 'LINE',
    baseMultiplier: 1.15,
    geometryDesc:
      '3 símbolos iguales compatibles en diagonal continua de arriba-izquierda a abajo-derecha en cualquier tramo de 3 columnas.',
    payoutDesc: 'Pago 3× del símbolo × 1.15',
    allowsWild: true,
    cells: [
      { col: 0, row: 0 },
      { col: 1, row: 1 },
      { col: 2, row: 2 },
    ],
  },
  {
    id: 'diagonal_up',
    name: 'Diagonal Ascendente (3)',
    patternType: 'DIAGONAL',
    patternCategory: 'LINE',
    baseMultiplier: 1.15,
    geometryDesc:
      '3 símbolos iguales compatibles en diagonal continua de abajo-izquierda a arriba-derecha en cualquier tramo de 3 columnas.',
    payoutDesc: 'Pago 3× del símbolo × 1.15',
    allowsWild: true,
    cells: [
      { col: 0, row: 2 },
      { col: 1, row: 1 },
      { col: 2, row: 0 },
    ],
  },
  {
    id: 'pat_x',
    name: 'X (5 Casillas)',
    patternType: 'X',
    patternCategory: 'SHAPE',
    baseMultiplier: 3.5,
    geometryDesc:
      'Cinco símbolos iguales formando una X a través del tablero ( las 4 esquinas exteriores y el centro exacto ).',
    payoutDesc: 'Pago 5× del símbolo × 3.50',
    allowsWild: true,
    cells: X_MASK_CELLS,
  },
  {
    id: 'triangulo',
    name: 'Triángulo (8 Casillas)',
    patternType: 'TRIANGULO',
    patternCategory: 'SHAPE',
    baseMultiplier: 8.0,
    geometryDesc:
      'Figura completa de 8 casillas: las 5 de la fila inferior, los 2 hombros interiores de la fila central y el vértice superior central. Todas deben tener el mismo símbolo compatible.',
    payoutDesc: 'Pago 5× del símbolo × 8.00 (Figura Suprema)',
    allowsWild: true,
    cells: TRIANGLE_MASK_CELLS,
  },
  {
    id: 'triangulo_invertido',
    name: 'Triángulo Invertido (8 Casillas)',
    patternType: 'TRIANGULO_INVERTIDO',
    patternCategory: 'SHAPE',
    baseMultiplier: 8.0,
    geometryDesc:
      'Figura completa de 8 casillas: las 5 de la fila superior, los 2 hombros interiores de la fila central y el vértice inferior central. Todas deben tener el mismo símbolo compatible.',
    payoutDesc: 'Pago 5× del símbolo × 8.00 (Figura Suprema)',
    allowsWild: true,
    cells: INVERTED_TRIANGLE_MASK_CELLS,
  },
];

// ============================================================================
// BUILD-DEFINING UPGRADES CATALOG (12 UPGRADES)
// ============================================================================
export interface FortunariumUpgradeCatalogItem {
  id: FortunariumUpgradeId;
  name: string;
  rarity: FortunariumUpgradeRarity;
  synergyTags: ('fruit' | 'high_value' | 'geometry' | 'repair' | 'voltage' | 'economy')[];
  description: string;
  effectSummary: string;
  baseCostMoney: number;
  costMultiplierPerLevel: number;
  keyCost: number;
  maxLevel: number;
  iconSymbol: FortunariumSymbolId;
}

export const FORTUNARIUM_UPGRADES_CATALOG: Record<
  FortunariumUpgradeId,
  FortunariumUpgradeCatalogItem
> = {
  cosecha_roja: {
    id: 'cosecha_roja',
    name: 'Cosecha Roja',
    rarity: 'COMÚN',
    synergyTags: ['fruit', 'economy'],
    description: 'Aumenta los pagos de Cereza y Ciruela un +35% por nivel.',
    effectSummary: '+35% pago de Cereza y Ciruela',
    baseCostMoney: 55,
    costMultiplierPerLevel: 1.55,
    keyCost: 1,
    maxLevel: 3,
    iconSymbol: 'cereza',
  },
  huerto_citrico: {
    id: 'huerto_citrico',
    name: 'Huerto Cítrico',
    rarity: 'COMÚN',
    synergyTags: ['fruit', 'economy'],
    description:
      'Limón y Naranja aparecen un +18% más a menudo y pagan un +25% adicional por nivel.',
    effectSummary: '+18% frecuencia y +25% pago en Limón/Naranja',
    baseCostMoney: 60,
    costMultiplierPerLevel: 1.55,
    keyCost: 1,
    maxLevel: 3,
    iconSymbol: 'limon',
  },
  campana_bronce: {
    id: 'campana_bronce',
    name: 'Campana de Bronce',
    rarity: 'POCO COMÚN',
    synergyTags: ['high_value', 'economy'],
    description:
      'Campana y Herradura pagan +45% más en patrones y +20% más de frecuencia por nivel.',
    effectSummary: '+45% pago y +20% frecuencia Campana/Herradura',
    baseCostMoney: 70,
    costMultiplierPerLevel: 1.6,
    keyCost: 1,
    maxLevel: 3,
    iconSymbol: 'campana',
  },
  iman_diamante: {
    id: 'iman_diamante',
    name: 'Imán de Diamante',
    rarity: 'RARA',
    synergyTags: ['high_value', 'geometry'],
    description:
      'Diamante y Estrella aparecen un +30% más a menudo, pero el coste de tirada sube +5%.',
    effectSummary: '+30% peso Diamante/Estrella · +5% coste tirada',
    baseCostMoney: 85,
    costMultiplierPerLevel: 1.65,
    keyCost: 1,
    maxLevel: 3,
    iconSymbol: 'diamante',
  },
  siete_dorado: {
    id: 'siete_dorado',
    name: 'Siete Dorado',
    rarity: 'EXCEPCIONAL',
    synergyTags: ['high_value', 'geometry'],
    description:
      'Los pagos de Siete y Corona aumentan un +45% por nivel y mejora un +25% la probabilidad de Jackpot.',
    effectSummary: '+45% pago Siete/Corona · +25% prob. Jackpot',
    baseCostMoney: 95,
    costMultiplierPerLevel: 1.7,
    keyCost: 2,
    maxLevel: 3,
    iconSymbol: 'siete',
  },
  geometra: {
    id: 'geometra',
    name: 'Geómetra',
    rarity: 'RARA',
    synergyTags: ['geometry', 'high_value'],
    description:
      'Aumenta los multiplicadores de patrones Vertical, Diagonal, X y Triángulos un +30% por nivel.',
    effectSummary: '+30% en patrones Vertical, Diagonal, X y Triángulos',
    baseCostMoney: 80,
    costMultiplierPerLevel: 1.6,
    keyCost: 1,
    maxLevel: 3,
    iconSymbol: 'estrella',
  },
  mano_tahur: {
    id: 'mano_tahur',
    name: 'Mano del Tahúr',
    rarity: 'RARA',
    synergyTags: ['geometry', 'economy'],
    description:
      'El Comodín aparece un +50% más a menudo y el Trébol un +25% más a menudo.',
    effectSummary: '+50% frecuencia Comodín · +25% Trébol',
    baseCostMoney: 90,
    costMultiplierPerLevel: 1.65,
    keyCost: 1,
    maxLevel: 3,
    iconSymbol: 'comodin',
  },
  mecanico_jefe: {
    id: 'mecanico_jefe',
    name: 'Mecánico',
    rarity: 'COMÚN',
    synergyTags: ['repair', 'economy'],
    description:
      'La Llave aparece un +40% más a menudo y cada reparación restaura +10% extra de Integridad.',
    effectSummary: '+40% frecuencia Llave · +10% reparación',
    baseCostMoney: 65,
    costMultiplierPerLevel: 1.55,
    keyCost: 1,
    maxLevel: 3,
    iconSymbol: 'llave',
  },
  cableado_ilegal: {
    id: 'cableado_ilegal',
    name: 'Cableado Ilegal',
    rarity: 'POCO COMÚN',
    synergyTags: ['voltage', 'high_value'],
    description:
      'El Rayo aparece un +50% más a menudo y da +0.15x extra de Voltaje, pero añade +1% de desgaste por tirada.',
    effectSummary: '+50% Rayo y más Voltaje · +1% desgaste',
    baseCostMoney: 75,
    costMultiplierPerLevel: 1.6,
    keyCost: 1,
    maxLevel: 3,
    iconSymbol: 'rayo',
  },
  prensa_uvas: {
    id: 'prensa_uvas',
    name: 'Reserva de la Viña',
    rarity: 'POCO COMÚN',
    synergyTags: ['fruit', 'economy'],
    description:
      'Uvas y Trébol pagan +35% más por nivel y las Monedas dan +10 CR extra.',
    effectSummary: '+35% pago Uvas/Trébol · +10 CR por Moneda',
    baseCostMoney: 70,
    costMultiplierPerLevel: 1.6,
    keyCost: 1,
    maxLevel: 3,
    iconSymbol: 'uvas',
  },
  artificiero: {
    id: 'artificiero',
    name: 'Artificiero Automático',
    rarity: 'POCO COMÚN',
    synergyTags: ['repair', 'economy'],
    description:
      'Desactiva automáticamente 1 Bomba por tirada por nivel y otorga +35 CR al neutralizarla.',
    effectSummary: 'Desactiva 1 Bomba/nivel (+35 CR)',
    baseCostMoney: 80,
    costMultiplierPerLevel: 1.65,
    keyCost: 1,
    maxLevel: 3,
    iconSymbol: 'herradura',
  },
  motor_extra: {
    id: 'motor_extra',
    name: 'Reserva de Manivela',
    rarity: 'EXCEPCIONAL',
    synergyTags: ['repair', 'economy'],
    description:
      'Aumenta +15% la Integridad máxima por nivel y reduce en -1 CR el coste base de cada tirada.',
    effectSummary: '-1 CR coste tirada · +15% Integridad máx.',
    baseCostMoney: 90,
    costMultiplierPerLevel: 1.7,
    keyCost: 2,
    maxLevel: 3,
    iconSymbol: 'corona',
  },
};

export const ALL_UPGRADE_IDS: FortunariumUpgradeId[] = Object.keys(
  FORTUNARIUM_UPGRADES_CATALOG
) as FortunariumUpgradeId[];

export interface FortunariumModifierCatalogItem {
  id: FortunariumModifierId;
  name: string;
  type: 'BUFF' | 'DEBUFF';
  effect: string;
  defaultSpins: number;
  durationType?: 'SPINS' | 'UNTIL_TRIGGER';
  isPlayerTargeted?: boolean;
  jackpotBaseOverride?: number;
}

export const FORTUNARIUM_MODIFIERS_CATALOG: Record<
  FortunariumModifierId,
  FortunariumModifierCatalogItem
> = {
  fiebre_cerezas: {
    id: 'fiebre_cerezas',
    name: 'FIEBRE DE CEREZAS',
    type: 'BUFF',
    effect: 'Las Cerezas aparecen más y pagan ×2.',
    defaultSpins: 3,
  },
  geometra_efecto: {
    id: 'geometra_efecto',
    name: 'GEÓMETRA EN RACHA',
    type: 'BUFF',
    effect: 'Patrones no horizontales pagan +40% adicional.',
    defaultSpins: 3,
  },
  diagonal_perfecta: {
    id: 'diagonal_perfecta',
    name: 'DIAGONAL PERFECTA',
    type: 'BUFF',
    effect: 'Las líneas diagonales pagan ×1.75.',
    defaultSpins: 3,
  },
  ojo_dorado: {
    id: 'ojo_dorado',
    name: 'OJO DORADO',
    type: 'BUFF',
    effect: 'El próximo patrón X o Triángulo paga ×2.',
    defaultSpins: 4,
    durationType: 'UNTIL_TRIGGER',
    isPlayerTargeted: true,
  },
  dinamita: {
    id: 'dinamita',
    name: 'DINAMITA CONTROLADA',
    type: 'BUFF',
    effect: 'Cada Bomba detona hacia fuera pero suelta +30 CR.',
    defaultSpins: 3,
  },
  motor_fino: {
    id: 'motor_fino',
    name: 'MOTOR FINO',
    type: 'BUFF',
    effect: 'Anula el desgaste base del giro.',
    defaultSpins: 3,
    isPlayerTargeted: true,
  },
  lluvia_monedas: {
    id: 'lluvia_monedas',
    name: 'LLUVIA DE BRONCE',
    type: 'BUFF',
    effect: 'Cada tirada otorga +12 CR adicionales.',
    defaultSpins: 3,
  },
  escudo_termico: {
    id: 'escudo_termico',
    name: 'BLINDAJE TÉRMICO',
    type: 'BUFF',
    effect: 'Bloquea el desgaste y convierte Bombas en +45 CR.',
    defaultSpins: 3,
  },
  sobrecarga_dorada: {
    id: 'sobrecarga_dorada',
    name: 'SOBRECARGA DORADA',
    type: 'BUFF',
    effect: 'Todos los patrones ganadores pagan ×1.5.',
    defaultSpins: 2,
  },
  fortuna_desatada: {
    id: 'fortuna_desatada',
    name: 'FORTUNA DESATADA',
    type: 'BUFF',
    effect: '+ Probabilidad de Jackpot y más Comodines.',
    defaultSpins: 4,
    jackpotBaseOverride: 0.0025,
  },
  siete_suerte: {
    id: 'siete_suerte',
    name: 'SIETE DE LA SUERTE',
    type: 'BUFF',
    effect: '+ Probabilidad de Jackpot y más Sietes.',
    defaultSpins: 3,
    jackpotBaseOverride: 0.005,
  },
  mano_afortunada: {
    id: 'mano_afortunada',
    name: 'MANO AFORTUNADA',
    type: 'BUFF',
    effect: 'Tus giros pagan +25% en todos los patrones.',
    defaultSpins: 3,
    isPlayerTargeted: true,
  },
  motor_al_rojo: {
    id: 'motor_al_rojo',
    name: 'MOTOR AL ROJO',
    type: 'DEBUFF',
    effect: 'Cada giro añade +2% de desgaste térmico.',
    defaultSpins: 3,
  },
  recalentamiento: {
    id: 'recalentamiento',
    name: 'RECALENTAMIENTO',
    type: 'DEBUFF',
    effect: 'Las reparaciones cuestan +30% más créditos.',
    defaultSpins: 3,
  },
  cableado_quemado: {
    id: 'cableado_quemado',
    name: 'CABLEADO QUEMADO',
    type: 'DEBUFF',
    effect: 'Cada tirada provoca +3% de daño adicional al chasis.',
    defaultSpins: 4,
  },
  iman_roto: {
    id: 'iman_roto',
    name: 'IMÁN DESMAGNETIZADO',
    type: 'DEBUFF',
    effect: 'Diamante y Estrella aparecen menos y pagan -35%.',
    defaultSpins: 3,
  },
  rodillo_pegado: {
    id: 'rodillo_pegado',
    name: 'RODILLO PEGADO',
    type: 'DEBUFF',
    effect: 'Las líneas horizontales pagan -20%.',
    defaultSpins: 3,
  },
  apuesta_forzada: {
    id: 'apuesta_forzada',
    name: 'APUESTA FORZADA',
    type: 'DEBUFF',
    effect: 'Fuerza apuesta Doble si hay saldo suficiente.',
    defaultSpins: 2,
  },
  mal_contacto: {
    id: 'mal_contacto',
    name: 'MAL CONTACTO',
    type: 'DEBUFF',
    effect: 'Tus giros cuestan +4 CR adicionales.',
    defaultSpins: 3,
    isPlayerTargeted: true,
  },
  hacienda: {
    id: 'hacienda',
    name: 'INSPECCIÓN DE TASAS',
    type: 'DEBUFF',
    effect: 'Retiene un 15% de comisión sobre premios brutos ≥40 CR.',
    defaultSpins: 3,
  },
  mala_racha: {
    id: 'mala_racha',
    name: 'MALA RACHA',
    type: 'DEBUFF',
    effect: 'Aumenta la aparición de Calaveras y Bombas.',
    defaultSpins: 3,
  },
  fuga_creditos: {
    id: 'fuga_creditos',
    name: 'FUGA DE CRÉDITOS',
    type: 'DEBUFF',
    effect: 'Cada tirada pierde -6 CR por cortocircuito.',
    defaultSpins: 4,
  },
  rodillos_oxidados: {
    id: 'rodillos_oxidados',
    name: 'RODILLOS OXIDADOS',
    type: 'DEBUFF',
    effect: 'Reduce el pago de líneas horizontales un -20%.',
    defaultSpins: 3,
  },
  mano_negra: {
    id: 'mano_negra',
    name: 'MANO NEGRA',
    type: 'DEBUFF',
    effect: 'Tus giros sufren +3% de desgaste y atraen peligros.',
    defaultSpins: 3,
    isPlayerTargeted: true,
  },
};

export const ALL_MODIFIER_IDS: FortunariumModifierId[] = Object.keys(
  FORTUNARIUM_MODIFIERS_CATALOG
) as FortunariumModifierId[];

export function createInitialUpgradesState(): Record<FortunariumUpgradeId, number> {
  return {
    cosecha_roja: 0,
    huerto_citrico: 0,
    campana_bronce: 0,
    iman_diamante: 0,
    siete_dorado: 0,
    geometra: 0,
    mano_tahur: 0,
    mecanico_jefe: 0,
    cableado_ilegal: 0,
    prensa_uvas: 0,
    artificiero: 0,
    motor_extra: 0,
  };
}

export const FORTUNARIUM_BET_MODES: Record<
  FortunariumBetMode,
  {
    id: FortunariumBetMode;
    label: string;
    shortLabel: string;
    baseSpinCost: number;
    costMultiplier: number;
    payoutMultiplier: number;
    integrityWear: number;
    description: string;
  }
> = {
  normal: {
    id: 'normal',
    label: 'Estándar (x1)',
    shortLabel: 'ESTÁNDAR x1',
    baseSpinCost: 10,
    costMultiplier: 1,
    payoutMultiplier: 1.0,
    integrityWear: 1,
    description: '10 CR por tirada. Desgaste mínimo (-1% integridad).',
  },
  doble: {
    id: 'doble',
    label: 'Doble (x2)',
    shortLabel: 'DOBLE x2',
    baseSpinCost: 20,
    costMultiplier: 2,
    payoutMultiplier: 2.0,
    integrityWear: 2,
    description: '20 CR por tirada. Premios x2.0 y desgaste moderado (-2% integridad).',
  },
  sobrecarga: {
    id: 'sobrecarga',
    label: 'Sobrecarga (x3)',
    shortLabel: 'SOBRECARGA x3',
    baseSpinCost: 30,
    costMultiplier: 3,
    payoutMultiplier: 3.0,
    integrityWear: 4,
    description: '30 CR por tirada. Premios x3.0 y desgaste elevado (-4% integridad).',
  },
};

export function getUpgradeCostMoney(
  upgradeId: FortunariumUpgradeId,
  currentLevel: number
): number {
  const item = FORTUNARIUM_UPGRADES_CATALOG[upgradeId];
  return Math.round(
    item.baseCostMoney * Math.pow(item.costMultiplierPerLevel, currentLevel)
  );
}

export function calculateEffectiveSpinCost(
  betMode: FortunariumBetMode,
  upgrades: Record<FortunariumUpgradeId, number>
): number {
  const base = FORTUNARIUM_BET_MODES[betMode].baseSpinCost;
  const imanLv = upgrades.iman_diamante || 0;
  const motorLv = upgrades.motor_extra || 0;
  const mult = 1 + imanLv * 0.05;
  const discounted = Math.round(base * mult) - motorLv * FORTUNARIUM_BET_MODES[betMode].costMultiplier;
  return Math.max(2, discounted);
}

export function calculateMinimumSpinCost(
  upgrades: Record<FortunariumUpgradeId, number>
): number {
  return calculateEffectiveSpinCost('normal', upgrades);
}

// ============================================================================
// AUTHORITATIVE RUNTIME EFFECTIVE WEIGHT CALCULATOR
// Never mutates base weights. Computes effectiveWeight = baseWeight * modifiers
// ============================================================================
export function computeEffectiveSymbolWeights(
  upgrades: Record<FortunariumUpgradeId, number>,
  betMode: FortunariumBetMode
): { id: FortunariumSymbolId; weight: number }[] {
  const list: { id: FortunariumSymbolId; weight: number }[] = [];

  for (const id of ALL_FORTUNARIUM_SYMBOL_IDS) {
    let w = FORTUNARIUM_SYMBOLS[id].weight;

    // Permanent upgrade modifiers
    if ((id === 'limon' || id === 'naranja') && (upgrades.huerto_citrico || 0) > 0) {
      w *= 1 + upgrades.huerto_citrico * 0.18;
    }
    if ((id === 'campana' || id === 'herradura') && (upgrades.campana_bronce || 0) > 0) {
      w *= 1 + upgrades.campana_bronce * 0.2;
    }
    if ((id === 'diamante' || id === 'estrella') && (upgrades.iman_diamante || 0) > 0) {
      w *= 1 + upgrades.iman_diamante * 0.3;
    }
    if (id === 'comodin' && (upgrades.mano_tahur || 0) > 0) {
      w *= 1 + upgrades.mano_tahur * 0.5;
    }
    if (id === 'trebol' && (upgrades.mano_tahur || 0) > 0) {
      w *= 1 + upgrades.mano_tahur * 0.25;
    }
    if (id === 'llave' && (upgrades.mecanico_jefe || 0) > 0) {
      w *= 1 + upgrades.mecanico_jefe * 0.4;
    }
    if (id === 'rayo' && (upgrades.cableado_ilegal || 0) > 0) {
      w *= 1 + upgrades.cableado_ilegal * 0.5;
    }

    // Slight voltage risk/reward modifier in sobrecarga
    if (betMode === 'sobrecarga') {
      if (id === 'bomba' || id === 'calavera') {
        w *= 1.15;
      }
      if (id === 'rayo' || id === 'moneda') {
        w *= 1.1;
      }
    }

    list.push({ id, weight: w });
  }

  return list;
}
