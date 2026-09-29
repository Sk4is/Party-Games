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
  baseSymbolValue: number;
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
    baseSymbolValue: 11,
    basePayout3: 11,
    basePayout4: 33,
    basePayout5: 88,
    weight: 220,
    shortDesc: 'Fruta básica muy frecuente. Permite recuperar el coste de la tirada.',
    specialProperty: 'Sinergia con «Cosecha Roja» (+20% valor base por nivel)',
    badgeColor: '#fb7185',
  },
  limon: {
    id: 'limon',
    name: 'Limón',
    category: 'normal',
    tier: 1,
    asset: FORTUNARIUM_SYMBOL_ASSETS.limon,
    baseSymbolValue: 13,
    basePayout3: 13,
    basePayout4: 39,
    basePayout5: 104,
    weight: 190,
    shortDesc: 'Cítrico frecuente que aporta pequeños beneficios iniciales.',
    specialProperty: 'Sinergia con «Huerto Cítrico» (+12% frecuencia, +15% valor base)',
    badgeColor: '#fde047',
  },
  naranja: {
    id: 'naranja',
    name: 'Naranja',
    category: 'normal',
    tier: 1,
    asset: FORTUNARIUM_SYMBOL_ASSETS.naranja,
    baseSymbolValue: 17,
    basePayout3: 17,
    basePayout4: 51,
    basePayout5: 136,
    weight: 165,
    shortDesc: 'Fruta jugosa con retorno sólido en líneas de 3, 4 o 5.',
    specialProperty: 'Sinergia con «Huerto Cítrico» (+12% frecuencia, +15% valor base)',
    badgeColor: '#fb923c',
  },
  ciruela: {
    id: 'ciruela',
    name: 'Ciruela',
    category: 'normal',
    tier: 1,
    asset: FORTUNARIUM_SYMBOL_ASSETS.ciruela,
    baseSymbolValue: 20,
    basePayout3: 20,
    basePayout4: 60,
    basePayout5: 160,
    weight: 140,
    shortDesc: 'Fruta clásica de buen rendimiento cuando forma diagonales o columnas.',
    specialProperty: 'Sinergia con «Cosecha Roja» (+20% valor base por nivel)',
    badgeColor: '#c084fc',
  },
  uvas: {
    id: 'uvas',
    name: 'Uvas',
    category: 'normal',
    tier: 2,
    asset: FORTUNARIUM_SYMBOL_ASSETS.uvas,
    baseSymbolValue: 27,
    basePayout3: 27,
    basePayout4: 81,
    basePayout5: 216,
    weight: 115,
    shortDesc: 'Racimo selecto de valor medio con excelentes premios en 4 y 5 aciertos.',
    specialProperty: 'Sinergia con «Reserva de la Viña» (+20% valor base)',
    badgeColor: '#a855f7',
  },
  trebol: {
    id: 'trebol',
    name: 'Trébol',
    category: 'normal',
    tier: 2,
    asset: FORTUNARIUM_SYMBOL_ASSETS.trebol,
    baseSymbolValue: 36,
    basePayout3: 36,
    basePayout4: 108,
    basePayout5: 288,
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
    baseSymbolValue: 50,
    basePayout3: 50,
    basePayout4: 150,
    basePayout5: 400,
    weight: 68,
    shortDesc: 'Campana de bronce del casino con pagos potentes.',
    specialProperty: 'Sinergia con «Campana de Bronce» (+25% valor base por nivel)',
    badgeColor: '#fbbf24',
  },
  herradura: {
    id: 'herradura',
    name: 'Herradura',
    category: 'normal',
    tier: 3,
    asset: FORTUNARIUM_SYMBOL_ASSETS.herradura,
    baseSymbolValue: 68,
    basePayout3: 68,
    basePayout4: 204,
    basePayout5: 544,
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
    baseSymbolValue: 95,
    basePayout3: 95,
    basePayout4: 285,
    basePayout5: 760,
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
    baseSymbolValue: 145,
    basePayout3: 145,
    basePayout4: 435,
    basePayout5: 1160,
    weight: 20,
    shortDesc: 'Joya de alta rareza capaz de sellar una cuota de un golpe.',
    specialProperty: 'Sinergia con «Imán de Diamante» (+18% aparición por nivel)',
    badgeColor: '#38bdf8',
  },
  corona: {
    id: 'corona',
    name: 'Corona',
    category: 'normal',
    tier: 4,
    asset: FORTUNARIUM_SYMBOL_ASSETS.corona,
    baseSymbolValue: 235,
    basePayout3: 235,
    basePayout4: 705,
    basePayout5: 1880,
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
    baseSymbolValue: 390,
    basePayout3: 390,
    basePayout4: 1170,
    basePayout5: 3120,
    weight: 3,
    shortDesc: 'El emblema supremo del Fortunarium (rareza máxima).',
    specialProperty: 'Sinergia con «Siete Dorado» (+25% valor base y prob. Jackpot)',
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
    baseSymbolValue: 16,
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
    baseSymbolValue: 0,
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
    baseSymbolValue: 0,
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
    baseSymbolValue: 20,
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
    baseSymbolValue: 0,
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
    baseSymbolValue: 0,
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
    baseSymbolValue: 180,
    basePayout3: 180,
    basePayout4: 540,
    basePayout5: 1440,
    weight: 0.12,
    shortDesc:
      'Sustituye a cualquier símbolo normal en patrones Horizontales, Verticales, Diagonales y Triángulos otorgando +25% de bono.',
    specialProperty: 'Sustituye a cualquier símbolo normal (+25% pago)',
    activationRule: ' SUSTITUYE EN PATRONES',
    badgeColor: '#c089fc',
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
    mult += upgrades.siete_dorado * 0.12;
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
    payoutDesc: 'Valor Base (VB) × 1.00 (3 casillas) · × 3.00 (4 casillas) · × 8.00 (5 casillas)',
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
    baseMultiplier: 1.15,
    geometryDesc:
      '3 símbolos iguales compatibles alineados verticalmente en cualquiera de las 5 columnas.',
    payoutDesc: 'Valor Base del símbolo (VB) × 1.15',
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
    baseMultiplier: 1.3,
    geometryDesc:
      '3 símbolos iguales compatibles en diagonal continua de arriba-izquierda a abajo-derecha en cualquier tramo de 3 columnas.',
    payoutDesc: 'Valor Base del símbolo (VB) × 1.30',
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
    baseMultiplier: 1.3,
    geometryDesc:
      '3 símbolos iguales compatibles en diagonal continua de abajo-izquierda a arriba-derecha en cualquier tramo de 3 columnas.',
    payoutDesc: 'Valor Base del símbolo (VB) × 1.30',
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
    baseMultiplier: 28.0,
    geometryDesc:
      'Cinco símbolos iguales formando una X a través del tablero (las 4 esquinas exteriores y el centro exacto).',
    payoutDesc: 'Valor Base del símbolo (VB) × 28.00',
    allowsWild: true,
    cells: X_MASK_CELLS,
  },
  {
    id: 'triangulo',
    name: 'Triángulo (8 Casillas)',
    patternType: 'TRIANGULO',
    patternCategory: 'SHAPE',
    baseMultiplier: 64.0,
    geometryDesc:
      'Figura completa de 8 casillas: las 5 de la fila inferior, los 2 hombros interiores de la fila central y el vértice superior central. Todas deben tener el mismo símbolo compatible.',
    payoutDesc: 'Valor Base del símbolo (VB) × 64.00 (Figura Suprema)',
    allowsWild: true,
    cells: TRIANGLE_MASK_CELLS,
  },
  {
    id: 'triangulo_invertido',
    name: 'Triángulo Invertido (8 Casillas)',
    patternType: 'TRIANGULO_INVERTIDO',
    patternCategory: 'SHAPE',
    baseMultiplier: 64.0,
    geometryDesc:
      'Figura completa de 8 casillas: las 5 de la fila superior, los 2 hombros interiores de la fila central y el vértice inferior central. Todas deben tener el mismo símbolo compatible.',
    payoutDesc: 'Valor Base del símbolo (VB) × 64.00 (Figura Suprema)',
    allowsWild: true,
    cells: INVERTED_TRIANGLE_MASK_CELLS,
  },
  {
    id: 'pantalla_completa',
    name: 'Pantalla Completa / Jackpot (15 Casillas)',
    patternType: 'PANTALLA_COMPLETA',
    patternCategory: 'SHAPE',
    baseMultiplier: 100.0,
    geometryDesc:
      'Las 15 casillas del tablero 3×5 muestran el mismo símbolo compatible (o sustituidas con Comodín ⭐). Activa el Gran Jackpot y el desfile completo de patrones.',
    payoutDesc: 'Valor Base del símbolo (VB) × 100.00 + Bono Jackpot',
    allowsWild: true,
    cells: [
      { col: 0, row: 0 },
      { col: 1, row: 0 },
      { col: 2, row: 0 },
      { col: 3, row: 0 },
      { col: 4, row: 0 },
      { col: 0, row: 1 },
      { col: 1, row: 1 },
      { col: 2, row: 1 },
      { col: 3, row: 1 },
      { col: 4, row: 1 },
      { col: 0, row: 2 },
      { col: 1, row: 2 },
      { col: 2, row: 2 },
      { col: 3, row: 2 },
      { col: 4, row: 2 },
    ],
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
    description: 'Aumenta el valor base y pagos de Cereza y Ciruela un +20% por nivel (hasta Nv. 10).',
    effectSummary: '+20% valor base Cereza y Ciruela / nv.',
    baseCostMoney: 55,
    costMultiplierPerLevel: 1.28,
    keyCost: 1,
    maxLevel: 10,
    iconSymbol: 'cereza',
  },
  huerto_citrico: {
    id: 'huerto_citrico',
    name: 'Huerto Cítrico',
    rarity: 'COMÚN',
    synergyTags: ['fruit', 'economy'],
    description:
      'Limón y Naranja aparecen un +12% más a menudo y su valor base sube +15% por nivel (hasta Nv. 10).',
    effectSummary: '+12% frecuencia y +15% valor Limón/Naranja / nv.',
    baseCostMoney: 60,
    costMultiplierPerLevel: 1.28,
    keyCost: 1,
    maxLevel: 10,
    iconSymbol: 'limon',
  },
  campana_bronce: {
    id: 'campana_bronce',
    name: 'Campana de Bronce',
    rarity: 'POCO COMÚN',
    synergyTags: ['high_value', 'economy'],
    description:
      'Campana y Herradura suben +25% su valor base y +12% su frecuencia por nivel (hasta Nv. 10).',
    effectSummary: '+25% valor y +12% frecuencia Campana/Herradura / nv.',
    baseCostMoney: 70,
    costMultiplierPerLevel: 1.3,
    keyCost: 1,
    maxLevel: 10,
    iconSymbol: 'campana',
  },
  iman_diamante: {
    id: 'iman_diamante',
    name: 'Imán de Diamante',
    rarity: 'RARA',
    synergyTags: ['high_value', 'geometry'],
    description:
      'Diamante y Estrella aparecen un +18% más a menudo por nivel, pero el coste de tirada sube +3%.',
    effectSummary: '+18% peso Diamante/Estrella · +3% coste tirada / nv.',
    baseCostMoney: 85,
    costMultiplierPerLevel: 1.32,
    keyCost: 1,
    maxLevel: 10,
    iconSymbol: 'diamante',
  },
  siete_dorado: {
    id: 'siete_dorado',
    name: 'Siete Dorado',
    rarity: 'EXCEPCIONAL',
    synergyTags: ['high_value', 'geometry'],
    description:
      'El valor base de Siete y Corona sube un +25% por nivel y mejora un +12% la probabilidad de Jackpot.',
    effectSummary: '+25% valor Siete/Corona · +12% prob. Jackpot / nv.',
    baseCostMoney: 95,
    costMultiplierPerLevel: 1.35,
    keyCost: 2,
    maxLevel: 10,
    iconSymbol: 'siete',
  },
  geometra: {
    id: 'geometra',
    name: 'Geómetra',
    rarity: 'RARA',
    synergyTags: ['geometry', 'high_value'],
    description:
      'Aumenta los multiplicadores de patrones Vertical, Diagonal, X y Triángulos un +18% por nivel (hasta Nv. 10).',
    effectSummary: '+18% en patrones Vertical, Diagonal, X y Triángulos / nv.',
    baseCostMoney: 80,
    costMultiplierPerLevel: 1.3,
    keyCost: 1,
    maxLevel: 10,
    iconSymbol: 'estrella',
  },
  mano_tahur: {
    id: 'mano_tahur',
    name: 'Mano del Tahúr',
    rarity: 'RARA',
    synergyTags: ['geometry', 'economy'],
    description:
      'El Comodín aparece un +30% más a menudo y el Trébol un +15% más a menudo por nivel (hasta Nv. 10).',
    effectSummary: '+30% frecuencia Comodín · +15% Trébol / nv.',
    baseCostMoney: 90,
    costMultiplierPerLevel: 1.32,
    keyCost: 1,
    maxLevel: 10,
    iconSymbol: 'comodin',
  },
  mecanico_jefe: {
    id: 'mecanico_jefe',
    name: 'Mecánico',
    rarity: 'COMÚN',
    synergyTags: ['repair', 'economy'],
    description:
      'La Llave aparece un +25% más a menudo, cada reparación restaura +5% extra de Integridad y reduce -6% el coste de reparación por nivel.',
    effectSummary: '+25% frec. Llave · +5% rep. · -6% coste rep. / nv.',
    baseCostMoney: 65,
    costMultiplierPerLevel: 1.28,
    keyCost: 1,
    maxLevel: 10,
    iconSymbol: 'llave',
  },
  cableado_ilegal: {
    id: 'cableado_ilegal',
    name: 'Cableado Ilegal',
    rarity: 'POCO COMÚN',
    synergyTags: ['voltage', 'high_value'],
    description:
      'El Rayo aparece un +30% más a menudo y da +0.08x extra de Voltaje por nivel, pero añade +1% de desgaste por tirada.',
    effectSummary: '+30% Rayo y +0.08x Voltaje/nv. · +1% desgaste',
    baseCostMoney: 75,
    costMultiplierPerLevel: 1.3,
    keyCost: 1,
    maxLevel: 10,
    iconSymbol: 'rayo',
  },
  prensa_uvas: {
    id: 'prensa_uvas',
    name: 'Reserva de la Viña',
    rarity: 'POCO COMÚN',
    synergyTags: ['fruit', 'economy'],
    description:
      'Uvas y Trébol suben +20% su valor base por nivel y las Monedas dan +6 CR extra por nivel.',
    effectSummary: '+20% valor Uvas/Trébol · +6 CR por Moneda / nv.',
    baseCostMoney: 70,
    costMultiplierPerLevel: 1.3,
    keyCost: 1,
    maxLevel: 10,
    iconSymbol: 'uvas',
  },
  artificiero: {
    id: 'artificiero',
    name: 'Artificiero Automático',
    rarity: 'POCO COMÚN',
    synergyTags: ['repair', 'economy'],
    description:
      'Desactiva automáticamente Bombas por tirada y otorga +35 CR (+10 CR extra por nivel) al neutralizarlas.',
    effectSummary: 'Desactiva Bombas auto. · Bono neutralización / nv.',
    baseCostMoney: 80,
    costMultiplierPerLevel: 1.32,
    keyCost: 1,
    maxLevel: 10,
    iconSymbol: 'herradura',
  },
  motor_extra: {
    id: 'motor_extra',
    name: 'Reserva de Manivela',
    rarity: 'EXCEPCIONAL',
    synergyTags: ['repair', 'economy'],
    description:
      'Aumenta +8% la Integridad máxima por nivel y reduce el coste base de cada tirada (hasta Nv. 10).',
    effectSummary: 'Reduce coste tirada · +8% Integridad máx. / nv.',
    baseCostMoney: 90,
    costMultiplierPerLevel: 1.35,
    keyCost: 2,
    maxLevel: 10,
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

// ============================================================================
// AUTHORITATIVE REPAIR COST SCALING (SINGLE SOURCE OF TRUTH)
// Scales with:
// 1. Current quota (`round`): 1 + (round - 1) * 0.25
// 2. Repairs used in current quota (`repairsUsedInQuota`): 1 + repairsUsed * 0.35
// 3. Missing integrity severity & Mecánico Jefe discount (-6% per level, max -60%)
// ============================================================================
export interface RepairCostInput {
  round?: number;
  repairsUsedInQuota?: number;
  integrity?: number;
  maxIntegrity?: number;
  upgrades?: Partial<Record<FortunariumUpgradeId, number>>;
  activeModifiers?: Pick<FortunariumActiveModifier, 'modifierId'>[];
}

export function getRepairCostMoney(
  paramsOrRound?: RepairCostInput | number,
  legacyRepairsUsedInQuota?: number
): number {
  const normalizedParams: RepairCostInput =
    typeof paramsOrRound === 'number'
      ? {
          round: paramsOrRound,
          repairsUsedInQuota: legacyRepairsUsedInQuota,
        }
      : paramsOrRound && typeof paramsOrRound === 'object'
      ? paramsOrRound
      : {};

  const rawRound = Number(normalizedParams.round);
  const safeRound = Number.isFinite(rawRound) && rawRound >= 1 ? Math.floor(rawRound) : 1;

  const rawRepairsUsed = Number(normalizedParams.repairsUsedInQuota);
  const safeRepairsUsed =
    Number.isFinite(rawRepairsUsed) && rawRepairsUsed >= 0
      ? Math.floor(rawRepairsUsed)
      : 0;

  const rawMaxIntegrity = Number(normalizedParams.maxIntegrity);
  const safeMaxIntegrity =
    Number.isFinite(rawMaxIntegrity) && rawMaxIntegrity > 0 ? rawMaxIntegrity : 100;

  const rawIntegrity = Number(normalizedParams.integrity);
  const safeIntegrity = Number.isFinite(rawIntegrity)
    ? Math.max(0, Math.min(safeMaxIntegrity, rawIntegrity))
    : Math.min(70, safeMaxIntegrity);

  const baseRepairCost = 28;
  const quotaScale = 1 + Math.max(0, safeRound - 1) * 0.25;
  const repeatScale = 1 + Math.max(0, safeRepairsUsed) * 0.35;

  const missingRatio = Math.max(
    0,
    Math.min(1, (safeMaxIntegrity - safeIntegrity) / Math.max(1, safeMaxIntegrity))
  );
  // Monotonic damage curve: more damaged chassis is strictly more expensive to repair
  const damageScale =
    missingRatio <= 0.25
      ? 0.9 + (missingRatio / 0.25) * 0.1
      : 1.0 + (missingRatio - 0.25) * 0.5;

  const rawMecanicoLv = Number(normalizedParams.upgrades?.mecanico_jefe);
  const mecanicoLv =
    Number.isFinite(rawMecanicoLv) && rawMecanicoLv > 0 ? Math.floor(rawMecanicoLv) : 0;
  const discountMult = Math.max(0.4, 1 - mecanicoLv * 0.06);

  const activeModifiers = Array.isArray(normalizedParams.activeModifiers)
    ? normalizedParams.activeModifiers
    : [];
  const hasRecalentamiento = activeModifiers.some(
    (m) => m && m.modifierId === 'recalentamiento'
  );
  const debuffMult = hasRecalentamiento ? 1.3 : 1.0;

  const computed = Math.round(
    baseRepairCost * quotaScale * repeatScale * damageScale * discountMult * debuffMult
  );
  return Number.isFinite(computed) ? Math.max(15, computed) : 28;
}

export function calculateEffectiveSpinCost(
  betMode: FortunariumBetMode,
  upgrades: Record<FortunariumUpgradeId, number>
): number {
  const base = FORTUNARIUM_BET_MODES[betMode].baseSpinCost;
  const imanLv = upgrades.iman_diamante || 0;
  const motorLv = upgrades.motor_extra || 0;
  const mult = 1 + imanLv * 0.03;
  const discountPerUnit = Math.floor((motorLv + 1) / 2);
  const discounted =
    Math.round(base * mult) - discountPerUnit * FORTUNARIUM_BET_MODES[betMode].costMultiplier;
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

    // Permanent upgrade modifiers (scaled for 10 levels)
    if ((id === 'limon' || id === 'naranja') && (upgrades.huerto_citrico || 0) > 0) {
      w *= 1 + upgrades.huerto_citrico * 0.12;
    }
    if ((id === 'campana' || id === 'herradura') && (upgrades.campana_bronce || 0) > 0) {
      w *= 1 + upgrades.campana_bronce * 0.12;
    }
    if ((id === 'diamante' || id === 'estrella') && (upgrades.iman_diamante || 0) > 0) {
      w *= 1 + upgrades.iman_diamante * 0.18;
    }
    if (id === 'comodin' && (upgrades.mano_tahur || 0) > 0) {
      w *= 1 + upgrades.mano_tahur * 0.3;
    }
    if (id === 'trebol' && (upgrades.mano_tahur || 0) > 0) {
      w *= 1 + upgrades.mano_tahur * 0.15;
    }
    if (id === 'llave' && (upgrades.mecanico_jefe || 0) > 0) {
      w *= 1 + upgrades.mecanico_jefe * 0.25;
    }
    if (id === 'rayo' && (upgrades.cableado_ilegal || 0) > 0) {
      w *= 1 + upgrades.cableado_ilegal * 0.3;
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

// ============================================================================
// CANONICAL UPGRADE PROGRESSION & LIVE SYMBOL METRICS (SINGLE SOURCE OF TRUTH)
// ============================================================================
export interface FortunariumUpgradeStatLine {
  label: string;
  currentValue: string;
  nextValue?: string;
}

export interface FortunariumUpgradeLevelDetails {
  upgradeId: FortunariumUpgradeId;
  level: number;
  maxLevel: number;
  isMax: boolean;
  compactLines: string[];
  detailedLines: FortunariumUpgradeStatLine[];
}

export function getUpgradeLevelDetails(
  upgradeId: FortunariumUpgradeId,
  level: number
): FortunariumUpgradeLevelDetails {
  const meta = FORTUNARIUM_UPGRADES_CATALOG[upgradeId];
  const lv = Math.max(0, level);
  const effectiveLv = Math.max(1, lv);
  const nextLv = Math.min(meta.maxLevel, lv + 1);
  const isMax = lv >= meta.maxLevel;

  switch (upgradeId) {
    case 'cosecha_roja':
      return {
        upgradeId,
        level: lv,
        maxLevel: meta.maxLevel,
        isMax,
        compactLines: [
          `+${effectiveLv * 20}% valor base Cereza/Ciruela`,
          `+2% Integridad por línea Cerezas`,
        ],
        detailedLines: [
          {
            label: 'Valor Base Cereza y Ciruela',
            currentValue: lv > 0 ? `+${lv * 20}%` : 'Base (0%)',
            nextValue: !isMax ? `+${nextLv * 20}%` : undefined,
          },
          {
            label: 'Reparación por línea de Cerezas',
            currentValue: lv > 0 ? '+2% INT / línea' : 'Inactivo (0%)',
            nextValue: lv === 0 ? '+2% INT / línea' : undefined,
          },
        ],
      };

    case 'huerto_citrico':
      return {
        upgradeId,
        level: lv,
        maxLevel: meta.maxLevel,
        isMax,
        compactLines: [
          `+${effectiveLv * 15}% valor base Limón/Naranja`,
          `+${effectiveLv * 12}% frecuencia Limón/Naranja`,
        ],
        detailedLines: [
          {
            label: 'Valor Base Limón y Naranja',
            currentValue: lv > 0 ? `+${lv * 15}%` : 'Base (0%)',
            nextValue: !isMax ? `+${nextLv * 15}%` : undefined,
          },
          {
            label: 'Frecuencia Limón/Naranja',
            currentValue: lv > 0 ? `+${lv * 12}%` : 'Base (0%)',
            nextValue: !isMax ? `+${nextLv * 12}%` : undefined,
          },
        ],
      };

    case 'campana_bronce':
      return {
        upgradeId,
        level: lv,
        maxLevel: meta.maxLevel,
        isMax,
        compactLines: [
          `+${effectiveLv * 25}% valor base Campana/Herradura`,
          `+${effectiveLv * 12}% frecuencia Campana/Herradura`,
        ],
        detailedLines: [
          {
            label: 'Valor Base Campana y Herradura',
            currentValue: lv > 0 ? `+${lv * 25}%` : 'Base (0%)',
            nextValue: !isMax ? `+${nextLv * 25}%` : undefined,
          },
          {
            label: 'Frecuencia Campana/Herradura',
            currentValue: lv > 0 ? `+${lv * 12}%` : 'Base (0%)',
            nextValue: !isMax ? `+${nextLv * 12}%` : undefined,
          },
        ],
      };

    case 'iman_diamante':
      return {
        upgradeId,
        level: lv,
        maxLevel: meta.maxLevel,
        isMax,
        compactLines: [
          `+${effectiveLv * 18}% frecuencia Diamante/Estrella`,
          `+${effectiveLv * 3}% coste de tirada`,
        ],
        detailedLines: [
          {
            label: 'Frecuencia Diamante y Estrella',
            currentValue: lv > 0 ? `+${lv * 18}%` : 'Base (0%)',
            nextValue: !isMax ? `+${nextLv * 18}%` : undefined,
          },
          {
            label: 'Sobrecoste de tirada',
            currentValue: lv > 0 ? `+${lv * 3}%` : '0%',
            nextValue: !isMax ? `+${nextLv * 3}%` : undefined,
          },
        ],
      };

    case 'geometra':
      return {
        upgradeId,
        level: lv,
        maxLevel: meta.maxLevel,
        isMax,
        compactLines: [
          `+${effectiveLv * 18}% pago Vertical/Diagonal/Figuras`,
          `Multiplicador extra ×${(1 + effectiveLv * 0.18).toFixed(2)}`,
        ],
        detailedLines: [
          {
            label: 'Bono Vertical, Diagonal, X y Triángulos',
            currentValue: lv > 0 ? `+${lv * 18}% (×${(1 + lv * 0.18).toFixed(2)})` : 'Base (×1.00)',
            nextValue: !isMax ? `+${nextLv * 18}% (×${(1 + nextLv * 0.18).toFixed(2)})` : undefined,
          },
        ],
      };

    case 'siete_dorado':
      return {
        upgradeId,
        level: lv,
        maxLevel: meta.maxLevel,
        isMax,
        compactLines: [
          `+${effectiveLv * 25}% valor base Siete/Corona`,
          `+${effectiveLv * 12}% bono prob. Jackpot`,
        ],
        detailedLines: [
          {
            label: 'Valor Base Siete (7) y Corona',
            currentValue: lv > 0 ? `+${lv * 25}%` : 'Base (0%)',
            nextValue: !isMax ? `+${nextLv * 25}%` : undefined,
          },
          {
            label: 'Bono Probabilidad Jackpot',
            currentValue: lv > 0 ? `+${lv * 12}%` : 'Base (0.10%)',
            nextValue: !isMax ? `+${nextLv * 12}%` : undefined,
          },
        ],
      };

    case 'mano_tahur':
      return {
        upgradeId,
        level: lv,
        maxLevel: meta.maxLevel,
        isMax,
        compactLines: [
          `+${effectiveLv * 30}% frecuencia Comodín`,
          `+${effectiveLv * 15}% frecuencia Trébol`,
        ],
        detailedLines: [
          {
            label: 'Frecuencia Comodín (Wild)',
            currentValue: lv > 0 ? `+${lv * 30}%` : 'Base (0%)',
            nextValue: !isMax ? `+${nextLv * 30}%` : undefined,
          },
          {
            label: 'Frecuencia Trébol Protector',
            currentValue: lv > 0 ? `+${lv * 15}%` : 'Base (0%)',
            nextValue: !isMax ? `+${nextLv * 15}%` : undefined,
          },
        ],
      };

    case 'mecanico_jefe':
      return {
        upgradeId,
        level: lv,
        maxLevel: meta.maxLevel,
        isMax,
        compactLines: [
          `+${effectiveLv * 25}% frec. Llave · -${Math.min(60, effectiveLv * 6)}% coste rep.`,
          `+${25 + effectiveLv * 5}% Integridad por reparación`,
        ],
        detailedLines: [
          {
            label: 'Frecuencia Llaves de Taller',
            currentValue: lv > 0 ? `+${lv * 25}%` : 'Base (0%)',
            nextValue: !isMax ? `+${nextLv * 25}%` : undefined,
          },
          {
            label: 'Integridad restaurada en Taller',
            currentValue: `+${25 + lv * 5}% INT`,
            nextValue: !isMax ? `+${25 + nextLv * 5}% INT` : undefined,
          },
          {
            label: 'Descuento coste reparación',
            currentValue: lv > 0 ? `-${Math.min(60, lv * 6)}%` : '0%',
            nextValue: !isMax ? `-${Math.min(60, nextLv * 6)}%` : undefined,
          },
        ],
      };

    case 'cableado_ilegal':
      return {
        upgradeId,
        level: lv,
        maxLevel: meta.maxLevel,
        isMax,
        compactLines: [
          `+${(0.25 + effectiveLv * 0.08).toFixed(2)}x Voltaje por Rayo`,
          `+${effectiveLv * 30}% frec. Rayo (-1% INT/giro)`,
        ],
        detailedLines: [
          {
            label: 'Carga de Voltaje por Rayo',
            currentValue: `+${(0.25 + lv * 0.08).toFixed(2)}x`,
            nextValue: !isMax ? `+${(0.25 + nextLv * 0.08).toFixed(2)}x` : undefined,
          },
          {
            label: 'Frecuencia Rayo Eléctrico',
            currentValue: lv > 0 ? `+${lv * 30}%` : 'Base (0%)',
            nextValue: !isMax ? `+${nextLv * 30}%` : undefined,
          },
          {
            label: 'Desgaste adicional chasis',
            currentValue: lv > 0 ? '-1% INT / giro' : '0%',
            nextValue: lv === 0 ? '-1% INT / giro' : undefined,
          },
        ],
      };

    case 'prensa_uvas':
      return {
        upgradeId,
        level: lv,
        maxLevel: meta.maxLevel,
        isMax,
        compactLines: [
          `+${effectiveLv * 20}% valor base Uvas/Trébol`,
          `${16 + effectiveLv * 6} CR base por Moneda (+${effectiveLv * 6} CR)`,
        ],
        detailedLines: [
          {
            label: 'Valor Base Uvas y Trébol',
            currentValue: lv > 0 ? `+${lv * 20}%` : 'Base (0%)',
            nextValue: !isMax ? `+${nextLv * 20}%` : undefined,
          },
          {
            label: 'Bono base por Moneda Directa',
            currentValue: `${16 + lv * 6} CR (+${lv * 6} CR)`,
            nextValue: !isMax ? `${16 + nextLv * 6} CR (+${nextLv * 6} CR)` : undefined,
          },
        ],
      };

    case 'artificiero':
      return {
        upgradeId,
        level: lv,
        maxLevel: meta.maxLevel,
        isMax,
        compactLines: [
          `Desactiva ${Math.ceil(effectiveLv / 2)} Bomba(s) / giro auto.`,
          `+${35 + effectiveLv * 10} CR de bono por bomba neutralizada`,
        ],
        detailedLines: [
          {
            label: 'Desactivación automática de Bombas',
            currentValue: lv > 0 ? `${Math.ceil(lv / 2)} bomba(s) / giro` : '0 bombas / giro',
            nextValue: !isMax ? `${Math.ceil(nextLv / 2)} bomba(s) / giro` : undefined,
          },
          {
            label: 'Recompensa por neutralización',
            currentValue: `+${35 + lv * 10} CR × apuesta`,
            nextValue: !isMax ? `+${35 + nextLv * 10} CR × apuesta` : undefined,
          },
        ],
      };

    case 'motor_extra': {
      const curDisc = Math.floor((lv + 1) / 2);
      const nextDisc = Math.floor((nextLv + 1) / 2);
      return {
        upgradeId,
        level: lv,
        maxLevel: meta.maxLevel,
        isMax,
        compactLines: [
          `+${effectiveLv * 8}% Integridad máxima del chasis`,
          `-${Math.floor((effectiveLv + 1) / 2)} CR coste tirada Estándar`,
        ],
        detailedLines: [
          {
            label: 'Integridad Máxima del Chasis',
            currentValue: lv > 0 ? `+${lv * 8}% (${100 + lv * 8}% máx)` : '100% Base',
            nextValue: !isMax ? `+${nextLv * 8}% (${100 + nextLv * 8}% máx)` : undefined,
          },
          {
            label: 'Reducción coste tirada (×1 / ×2 / ×3)',
            currentValue: lv > 0 ? `-${curDisc} / -${curDisc * 2} / -${curDisc * 3} CR` : '0 CR',
            nextValue: !isMax ? `-${nextDisc} / -${nextDisc * 2} / -${nextDisc * 3} CR` : undefined,
          },
        ],
      };
    }
  }
}

export function computeSymbolUpgradeMultiplier(
  symId: FortunariumSymbolId,
  upgrades: Record<FortunariumUpgradeId, number>
): number {
  let m = 1.0;
  if ((symId === 'cereza' || symId === 'ciruela') && (upgrades.cosecha_roja || 0) > 0) {
    m += upgrades.cosecha_roja * 0.2;
  }
  if ((symId === 'limon' || symId === 'naranja') && (upgrades.huerto_citrico || 0) > 0) {
    m += upgrades.huerto_citrico * 0.15;
  }
  if ((symId === 'campana' || symId === 'herradura') && (upgrades.campana_bronce || 0) > 0) {
    m += upgrades.campana_bronce * 0.25;
  }
  if ((symId === 'siete' || symId === 'corona') && (upgrades.siete_dorado || 0) > 0) {
    m += upgrades.siete_dorado * 0.25;
  }
  if ((symId === 'uvas' || symId === 'trebol') && (upgrades.prensa_uvas || 0) > 0) {
    m += upgrades.prensa_uvas * 0.2;
  }
  return m;
}

export interface FortunariumLiveSymbolStat {
  id: FortunariumSymbolId;
  name: string;
  category: 'normal' | 'special';
  asset: string;
  baseWeight: number;
  effectiveWeight: number;
  baseProbabilityPct: number;
  liveProbabilityPct: number;
  probabilityDeltaPct: number;
  baseSymbolValue: number;
  liveBaseSymbolValue: number;
  liveSymbolBaseValue: number;
  basePayout3: number;
  basePayout4: number;
  basePayout5: number;
  livePayout3: number;
  livePayout4: number;
  livePayout5: number;
  upgradePayoutMult: number;
  totalPayoutMult: number;
  isValueBoosted: boolean;
  isProbabilityModified: boolean;
  activeUpgradeSources: string[];
  specialLiveValueLabel?: string;
}

export function computeLiveSymbolStats(
  upgrades: Record<FortunariumUpgradeId, number>,
  betMode: FortunariumBetMode = 'normal',
  currentVoltage = 1.0,
  activeModifiers: FortunariumActiveModifier[] = []
): FortunariumLiveSymbolStat[] {
  const baseTotalWeight = ALL_FORTUNARIUM_SYMBOL_IDS.reduce(
    (acc, id) => acc + FORTUNARIUM_SYMBOLS[id].weight,
    0
  );

  const effectiveWeights = computeEffectiveSymbolWeights(upgrades, betMode).map((item) => ({
    ...item,
  }));

  const hasFiebreCerezas = activeModifiers.some((m) => m.modifierId === 'fiebre_cerezas');
  const hasLluviaMonedas = activeModifiers.some((m) => m.modifierId === 'lluvia_monedas');
  const hasSobrecargaDorada = activeModifiers.some((m) => m.modifierId === 'sobrecarga_dorada');
  const hasImanRoto = activeModifiers.some((m) => m.modifierId === 'iman_roto');
  const hasMalaRacha = activeModifiers.some((m) => m.modifierId === 'mala_racha');
  const hasRodillosOxidados = activeModifiers.some((m) => m.modifierId === 'rodillos_oxidados');
  const hasManoAfortunada = activeModifiers.some((m) => m.modifierId === 'mano_afortunada');

  for (const w of effectiveWeights) {
    if (hasFiebreCerezas && w.id === 'cereza') {
      w.weight *= 1.85;
    }
    if (hasLluviaMonedas && w.id === 'moneda') {
      w.weight *= 2.8;
    }
  }

  const effectiveTotalWeight = effectiveWeights.reduce((acc, item) => acc + item.weight, 0);
  const betMult = FORTUNARIUM_BET_MODES[betMode].payoutMultiplier;

  return ALL_FORTUNARIUM_SYMBOL_IDS.map((id) => {
    const meta = FORTUNARIUM_SYMBOLS[id];
    const effEntry = effectiveWeights.find((w) => w.id === id);
    const effWeight = effEntry ? effEntry.weight : meta.weight;

    const baseProbabilityPct = Number(((meta.weight / baseTotalWeight) * 100).toFixed(2));
    const liveProbabilityPct = Number(((effWeight / effectiveTotalWeight) * 100).toFixed(2));
    const probabilityDeltaPct = Number((liveProbabilityPct - baseProbabilityPct).toFixed(2));

    const upgradePayoutMult = computeSymbolUpgradeMultiplier(id, upgrades);
    let modMult = 1.0;
    if (hasSobrecargaDorada) modMult *= 1.5;
    if (hasFiebreCerezas && id === 'cereza') modMult *= 2.0;
    if (hasImanRoto && (id === 'diamante' || id === 'estrella')) modMult *= 0.65;
    if (hasMalaRacha) modMult *= 0.7;
    if (hasRodillosOxidados) modMult *= 0.85;
    if (hasManoAfortunada) modMult *= 1.25;

    const totalPayoutMult = betMult * currentVoltage * upgradePayoutMult * modMult;

    const liveBaseSymbolValue = Math.max(0, Math.round(meta.baseSymbolValue * totalPayoutMult));
    const livePayout3 = Math.max(0, Math.round(meta.baseSymbolValue * 1.0 * totalPayoutMult));
    const livePayout4 = Math.max(0, Math.round(meta.baseSymbolValue * 3.0 * totalPayoutMult));
    const livePayout5 = Math.max(0, Math.round(meta.baseSymbolValue * 8.0 * totalPayoutMult));

    const activeUpgradeSources: string[] = [];
    if ((id === 'cereza' || id === 'ciruela') && (upgrades.cosecha_roja || 0) > 0) {
      activeUpgradeSources.push(`Cosecha Roja Nv.${upgrades.cosecha_roja}`);
    }
    if ((id === 'limon' || id === 'naranja') && (upgrades.huerto_citrico || 0) > 0) {
      activeUpgradeSources.push(`Huerto Cítrico Nv.${upgrades.huerto_citrico}`);
    }
    if ((id === 'campana' || id === 'herradura') && (upgrades.campana_bronce || 0) > 0) {
      activeUpgradeSources.push(`Campana de Bronce Nv.${upgrades.campana_bronce}`);
    }
    if ((id === 'diamante' || id === 'estrella') && (upgrades.iman_diamante || 0) > 0) {
      activeUpgradeSources.push(`Imán de Diamantes Nv.${upgrades.iman_diamante}`);
    }
    if ((id === 'siete' || id === 'corona') && (upgrades.siete_dorado || 0) > 0) {
      activeUpgradeSources.push(`Siete Dorado Nv.${upgrades.siete_dorado}`);
    }
    if ((id === 'uvas' || id === 'trebol') && (upgrades.prensa_uvas || 0) > 0) {
      activeUpgradeSources.push(`Reserva de la Viña Nv.${upgrades.prensa_uvas}`);
    }
    if ((id === 'comodin' || id === 'trebol') && (upgrades.mano_tahur || 0) > 0) {
      activeUpgradeSources.push(`Mano del Tahúr Nv.${upgrades.mano_tahur}`);
    }
    if (id === 'llave' && (upgrades.mecanico_jefe || 0) > 0) {
      activeUpgradeSources.push(`Mecánico Nv.${upgrades.mecanico_jefe}`);
    }
    if (id === 'rayo' && (upgrades.cableado_ilegal || 0) > 0) {
      activeUpgradeSources.push(`Cableado Ilegal Nv.${upgrades.cableado_ilegal}`);
    }
    if (id === 'moneda' && (upgrades.prensa_uvas || 0) > 0) {
      activeUpgradeSources.push(`Reserva de la Viña Nv.${upgrades.prensa_uvas}`);
    }
    if (id === 'bomba' && (upgrades.artificiero || 0) > 0) {
      activeUpgradeSources.push(`Artificiero Nv.${upgrades.artificiero}`);
    }

    let specialLiveValueLabel: string | undefined;
    if (id === 'moneda') {
      const perCoin = Math.round(
        (16 + (upgrades.prensa_uvas || 0) * 6) * betMult * currentVoltage
      );
      specialLiveValueLabel = `+${perCoin} CR directo`;
    } else if (id === 'rayo') {
      const perRayo = (0.25 + (upgrades.cableado_ilegal || 0) * 0.08).toFixed(2);
      specialLiveValueLabel = `+${perRayo}x Voltaje`;
    } else if (id === 'llave') {
      specialLiveValueLabel = `+1 🔑 y +8% INT`;
    } else if (id === 'comodin') {
      specialLiveValueLabel = `Wild +25% línea (VB: ${liveBaseSymbolValue} CR)`;
    } else if (id === 'bomba') {
      specialLiveValueLabel =
        (upgrades.artificiero || 0) > 0
          ? `Artificiero (${Math.ceil((upgrades.artificiero || 0) / 2)}/giro)`
          : `-14% INT / -CR`;
    } else if (id === 'calavera') {
      specialLiveValueLabel = `-6% INT / -20% CR`;
    } else if (id === 'interrogacion') {
      const mysCash = Math.round(20 * betMult * currentVoltage);
      specialLiveValueLabel = `+${mysCash} CR + Evento`;
    }

    return {
      id,
      name: meta.name,
      category: meta.category,
      asset: meta.asset,
      baseWeight: meta.weight,
      effectiveWeight: Number(effWeight.toFixed(2)),
      baseProbabilityPct,
      liveProbabilityPct,
      probabilityDeltaPct,
      baseSymbolValue: meta.baseSymbolValue,
      liveBaseSymbolValue,
      liveSymbolBaseValue: liveBaseSymbolValue,
      basePayout3: meta.basePayout3,
      basePayout4: meta.basePayout4,
      basePayout5: meta.basePayout5,
      livePayout3,
      livePayout4,
      livePayout5,
      upgradePayoutMult: Number(upgradePayoutMult.toFixed(2)),
      totalPayoutMult: Number(totalPayoutMult.toFixed(2)),
      isValueBoosted: upgradePayoutMult > 1.001 || totalPayoutMult > 1.001,
      isProbabilityModified: Math.abs(effWeight - meta.weight) > 0.01,
      activeUpgradeSources,
      specialLiveValueLabel,
    };
  });
}

