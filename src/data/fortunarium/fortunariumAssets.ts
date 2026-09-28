import {
  FortunariumSymbolId,
  NormalSymbolId,
  SpecialSymbolId,
  FortunariumUpgradeId,
  FortunariumBetMode,
  FortunariumPatternType,
  FortunariumCellCoord,
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
// SINGLE AUTHORITATIVE SYMBOL & WEIGHT TABLE
// Normal pool total weight = 944.0
// Special pool total weight = 9.95 (~1.04% per cell -> genuinely rare)
// ============================================================================
export const FORTUNARIUM_SYMBOLS: Record<FortunariumSymbolId, FortunariumSymbolMeta> = {
  cereza: {
    id: 'cereza',
    name: 'Cereza',
    category: 'normal',
    tier: 1,
    asset: FORTUNARIUM_SYMBOL_ASSETS.cereza,
    basePayout3: 8,
    basePayout4: 22,
    basePayout5: 58,
    weight: 180,
    shortDesc: 'Fruta básica muy frecuente. Ideal para amortiguar el coste de tirada.',
    specialProperty: 'Sinergia con «Cosecha Roja» (+30% pago)',
    badgeColor: '#fb7185',
  },
  limon: {
    id: 'limon',
    name: 'Limón',
    category: 'normal',
    tier: 1,
    asset: FORTUNARIUM_SYMBOL_ASSETS.limon,
    basePayout3: 9,
    basePayout4: 26,
    basePayout5: 72,
    weight: 155,
    shortDesc: 'Cítrico frecuente con retorno constante en líneas horizontales.',
    specialProperty: 'Sinergia con «Huerto Cítrico» (+18% frecuencia, +20% pago)',
    badgeColor: '#fde047',
  },
  naranja: {
    id: 'naranja',
    name: 'Naranja',
    category: 'normal',
    tier: 1,
    asset: FORTUNARIUM_SYMBOL_ASSETS.naranja,
    basePayout3: 11,
    basePayout4: 33,
    basePayout5: 88,
    weight: 135,
    shortDesc: 'Fruta jugosa que equilibra la tirada con 3 aciertos.',
    specialProperty: 'Sinergia con «Huerto Cítrico» (+18% frecuencia, +20% pago)',
    badgeColor: '#fb923c',
  },
  ciruela: {
    id: 'ciruela',
    name: 'Ciruela',
    category: 'normal',
    tier: 1,
    asset: FORTUNARIUM_SYMBOL_ASSETS.ciruela,
    basePayout3: 14,
    basePayout4: 42,
    basePayout5: 115,
    weight: 115,
    shortDesc: 'Fruta selecta que genera un beneficio modesto desde 3 en línea.',
    specialProperty: 'Sinergia con «Cosecha Roja» (+30% pago)',
    badgeColor: '#c084fc',
  },
  uvas: {
    id: 'uvas',
    name: 'Uvas',
    category: 'normal',
    tier: 2,
    asset: FORTUNARIUM_SYMBOL_ASSETS.uvas,
    basePayout3: 19,
    basePayout4: 55,
    basePayout5: 150,
    weight: 95,
    shortDesc: 'Racimo real con buen beneficio desde 3 en línea.',
    specialProperty: 'Sinergia con «Reserva de la Viña» (+30% pago)',
    badgeColor: '#a855f7',
  },
  trebol: {
    id: 'trebol',
    name: 'Trébol',
    category: 'normal',
    tier: 2,
    asset: FORTUNARIUM_SYMBOL_ASSETS.trebol,
    basePayout3: 25,
    basePayout4: 75,
    basePayout5: 205,
    weight: 78,
    shortDesc: 'Amuleto de la fortuna: paga en línea y bloquea 1 Calavera en pantalla.',
    specialProperty: 'Anula 1 Calavera en la misma tirada',
    badgeColor: '#4ade80',
  },
  campana: {
    id: 'campana',
    name: 'Campana',
    category: 'normal',
    tier: 2,
    asset: FORTUNARIUM_SYMBOL_ASSETS.campana,
    basePayout3: 35,
    basePayout4: 105,
    basePayout5: 285,
    weight: 62,
    shortDesc: 'Campana de bronce con excelente escalado en 4 y 5 aciertos.',
    specialProperty: 'Sinergia con «Campana de Bronce» (+40% en 4×/5×)',
    badgeColor: '#fbbf24',
  },
  herradura: {
    id: 'herradura',
    name: 'Herradura',
    category: 'normal',
    tier: 3,
    asset: FORTUNARIUM_SYMBOL_ASSETS.herradura,
    basePayout3: 48,
    basePayout4: 150,
    basePayout5: 410,
    weight: 48,
    shortDesc: 'Forja de hierro: al formar línea ganadora restaura +3% de Integridad.',
    specialProperty: 'Restaura +3% de Integridad al formar línea',
    badgeColor: '#f59e0b',
  },
  estrella: {
    id: 'estrella',
    name: 'Estrella',
    category: 'normal',
    tier: 3,
    asset: FORTUNARIUM_SYMBOL_ASSETS.estrella,
    basePayout3: 72,
    basePayout4: 220,
    basePayout5: 620,
    weight: 35,
    shortDesc: 'Astro de casino de alto valor que impulsa el progreso de cuota.',
    specialProperty: 'Premio alto; sinergia con «Imán de Diamante»',
    badgeColor: '#fef08a',
  },
  diamante: {
    id: 'diamante',
    name: 'Diamante',
    category: 'normal',
    tier: 4,
    asset: FORTUNARIUM_SYMBOL_ASSETS.diamante,
    basePayout3: 110,
    basePayout4: 350,
    basePayout5: 1000,
    weight: 23,
    shortDesc: 'Joya de alta precisión con premios enormes en 4 y 5 aciertos.',
    specialProperty: 'Gran premio; sinergia con «Imán de Diamante»',
    badgeColor: '#38bdf8',
  },
  corona: {
    id: 'corona',
    name: 'Corona',
    category: 'normal',
    tier: 4,
    asset: FORTUNARIUM_SYMBOL_ASSETS.corona,
    basePayout3: 190,
    basePayout4: 640,
    basePayout5: 1800,
    weight: 12,
    shortDesc: 'Reliquia imperial muy rara capaz de sellar una cuota entera.',
    specialProperty: 'Activa categoría Gran Premio; sinergia «Siete Dorado»',
    badgeColor: '#facc15',
  },
  siete: {
    id: 'siete',
    name: 'Siete',
    category: 'normal',
    tier: 4,
    asset: FORTUNARIUM_SYMBOL_ASSETS.siete,
    basePayout3: 375,
    basePayout4: 1250,
    basePayout5: 3800,
    weight: 6,
    shortDesc: 'El símbolo más codiciado del Fortunarium. 3, 4 o 5 Sietes desatan el Bote.',
    specialProperty: 'Símbolo de Bote Mayor (Jackpot)',
    badgeColor: '#ef4444',
  },

  // ==========================================================================
  // RARE SPECIAL SYMBOLS (Relative weights against 944 normal pool)
  // ==========================================================================
  moneda: {
    id: 'moneda',
    name: 'Moneda',
    category: 'special',
    tier: 5,
    asset: FORTUNARIUM_SYMBOL_ASSETS.moneda,
    basePayout3: 0,
    basePayout4: 0,
    basePayout5: 0,
    weight: 3.0,
    shortDesc: 'Otorga +18 créditos directos por cada Moneda sin necesitar línea.',
    specialProperty: 'Pago directo (+18 CR por Moneda × Voltaje)',
    activationRule: 'SE ACTIVA CON 1 APARICIÓN',
    badgeColor: '#eab308',
  },
  llave: {
    id: 'llave',
    name: 'Llave',
    category: 'special',
    tier: 5,
    asset: FORTUNARIUM_SYMBOL_ASSETS.llave,
    basePayout3: 0,
    basePayout4: 0,
    basePayout5: 0,
    weight: 2.2,
    shortDesc: 'Repara +8% de Integridad, suma +1 Llave de Taller y desactiva 1 Bomba.',
    specialProperty: '+8% Integridad, +1 Llave y desactiva 1 Bomba',
    activationRule: 'SE ACTIVA CON 1 APARICIÓN',
    badgeColor: '#34d399',
  },
  rayo: {
    id: 'rayo',
    name: 'Rayo',
    category: 'special',
    tier: 5,
    asset: FORTUNARIUM_SYMBOL_ASSETS.rayo,
    basePayout3: 0,
    basePayout4: 0,
    basePayout5: 0,
    weight: 1.6,
    shortDesc: 'Aumenta el multiplicador de Voltaje en +0.25x para esta tirada y las siguientes.',
    specialProperty: 'Sube +0.25x el Multiplicador de Voltaje',
    activationRule: 'SE ACTIVA CON 1 APARICIÓN',
    badgeColor: '#38bdf8',
  },
  interrogacion: {
    id: 'interrogacion',
    name: 'Interrogación',
    category: 'special',
    tier: 5,
    asset: FORTUNARIUM_SYMBOL_ASSETS.interrogacion,
    basePayout3: 0,
    basePayout4: 0,
    basePayout5: 0,
    weight: 1.1,
    shortDesc: 'Otorga un bono misterioso (+25 CR) o abre un Dilema del Fortunarium.',
    specialProperty: 'Premio sorpresa o Dilema Cooperativo',
    activationRule: 'SE ACTIVA CON 1 APARICIÓN',
    badgeColor: '#c084fc',
  },
  bomba: {
    id: 'bomba',
    name: 'Bomba',
    category: 'special',
    tier: 5,
    asset: FORTUNARIUM_SYMBOL_ASSETS.bomba,
    basePayout3: 0,
    basePayout4: 0,
    basePayout5: 0,
    weight: 0.9,
    shortDesc: 'Explota causando -14% de Integridad y -15 CR salvo que haya Llave o Artificiero.',
    specialProperty: 'Peligro: -14% Integridad y -15 CR',
    activationRule: 'SE ACTIVA CON 1 APARICIÓN',
    badgeColor: '#f97316',
  },
  calavera: {
    id: 'calavera',
    name: 'Calavera',
    category: 'special',
    tier: 5,
    asset: FORTUNARIUM_SYMBOL_ASSETS.calavera,
    basePayout3: 0,
    basePayout4: 0,
    basePayout5: 0,
    weight: 0.7,
    shortDesc: 'Maldición: drena -12 CR y -7% de Integridad salvo que un Trébol la bloquee.',
    specialProperty: 'Maldición: -12 CR y -7% Integridad (Trébol la bloquea)',
    activationRule: 'SE ACTIVA CON 1 APARICIÓN',
    badgeColor: '#94a3b8',
  },
  comodin: {
    id: 'comodin',
    name: 'Comodín',
    category: 'special',
    tier: 5,
    asset: FORTUNARIUM_SYMBOL_ASSETS.comodin,
    basePayout3: 60,
    basePayout4: 180,
    basePayout5: 500,
    weight: 0.45,
    shortDesc: 'Sustituye a cualquier símbolo normal en un patrón y añade +15% al pago.',
    specialProperty: 'Sustituye cualquier símbolo normal (+15% bono)',
    activationRule: 'ACTÚA EN CUALQUIER LÍNEA',
    badgeColor: '#f43f5e',
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

// Ordered from HIGHEST VALUE to LOWEST VALUE as required for TABLA DE PREMIOS
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
// CENTRALIZED PATTERN DEFINITIONS & GEOMETRY MULTIPLIERS
// ============================================================================
export interface FortunariumPatternGuideItem {
  id: string;
  name: string;
  patternType: FortunariumPatternType;
  baseMultiplier: number;
  geometryDesc: string;
  payoutDesc: string;
  allowsWild: boolean;
  cells: FortunariumCellCoord[];
}

export const FORTUNARIUM_PATTERNS_CATALOG: FortunariumPatternGuideItem[] = [
  {
    id: 'horizontal_center',
    name: 'Horizontal Central',
    patternType: 'HORIZONTAL',
    baseMultiplier: 1.0,
    geometryDesc: '3, 4 o 5 símbolos iguales desde la columna izquierda en la fila central.',
    payoutDesc: 'Multiplicador de patrón ×1.00',
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
    id: 'horizontal_top',
    name: 'Horizontal Superior',
    patternType: 'HORIZONTAL',
    baseMultiplier: 1.0,
    geometryDesc: '3, 4 o 5 símbolos iguales desde la columna izquierda en la fila superior.',
    payoutDesc: 'Multiplicador de patrón ×1.00',
    allowsWild: true,
    cells: [
      { col: 0, row: 0 },
      { col: 1, row: 0 },
      { col: 2, row: 0 },
      { col: 3, row: 0 },
      { col: 4, row: 0 },
    ],
  },
  {
    id: 'horizontal_bottom',
    name: 'Horizontal Inferior',
    patternType: 'HORIZONTAL',
    baseMultiplier: 1.0,
    geometryDesc: '3, 4 o 5 símbolos iguales desde la columna izquierda en la fila inferior.',
    payoutDesc: 'Multiplicador de patrón ×1.00',
    allowsWild: true,
    cells: [
      { col: 0, row: 2 },
      { col: 1, row: 2 },
      { col: 2, row: 2 },
      { col: 3, row: 2 },
      { col: 4, row: 2 },
    ],
  },
  {
    id: 'diagonal_down',
    name: 'Diagonal Descendente',
    patternType: 'DIAGONAL',
    baseMultiplier: 1.15,
    geometryDesc: 'Escalera diagonal de arriba-izquierda hacia abajo-derecha.',
    payoutDesc: 'Multiplicador de patrón ×1.15',
    allowsWild: true,
    cells: [
      { col: 0, row: 0 },
      { col: 1, row: 0 },
      { col: 2, row: 1 },
      { col: 3, row: 2 },
      { col: 4, row: 2 },
    ],
  },
  {
    id: 'diagonal_up',
    name: 'Diagonal Ascendente',
    patternType: 'DIAGONAL',
    baseMultiplier: 1.15,
    geometryDesc: 'Escalera diagonal de abajo-izquierda hacia arriba-derecha.',
    payoutDesc: 'Multiplicador de patrón ×1.15',
    allowsWild: true,
    cells: [
      { col: 0, row: 2 },
      { col: 1, row: 2 },
      { col: 2, row: 1 },
      { col: 3, row: 0 },
      { col: 4, row: 0 },
    ],
  },
  {
    id: 'v_shape',
    name: 'Patrón en V',
    patternType: 'V',
    baseMultiplier: 1.25,
    geometryDesc: 'Baja hasta el centro inferior y vuelve a subir (3, 4 o 5 columnas).',
    payoutDesc: 'Multiplicador de patrón ×1.25',
    allowsWild: true,
    cells: [
      { col: 0, row: 0 },
      { col: 1, row: 1 },
      { col: 2, row: 2 },
      { col: 3, row: 1 },
      { col: 4, row: 0 },
    ],
  },
  {
    id: 'v_inverted',
    name: 'Patrón en V Invertida',
    patternType: 'V_INVERTIDA',
    baseMultiplier: 1.25,
    geometryDesc: 'Sube hasta la cumbre central y vuelve a bajar (3, 4 o 5 columnas).',
    payoutDesc: 'Multiplicador de patrón ×1.25',
    allowsWild: true,
    cells: [
      { col: 0, row: 2 },
      { col: 1, row: 1 },
      { col: 2, row: 0 },
      { col: 3, row: 1 },
      { col: 4, row: 2 },
    ],
  },
  {
    id: 'zigzag_wave',
    name: 'Zigzag Real',
    patternType: 'ZIGZAG',
    baseMultiplier: 1.35,
    geometryDesc: 'Alterna filas arriba-abajo-arriba-abajo-arriba a través de los 5 rodillos.',
    payoutDesc: 'Multiplicador de patrón ×1.35',
    allowsWild: true,
    cells: [
      { col: 0, row: 0 },
      { col: 1, row: 2 },
      { col: 2, row: 0 },
      { col: 3, row: 2 },
      { col: 4, row: 0 },
    ],
  },
];

// ============================================================================
// BUILD-DEFINING UPGRADES CATALOG (12 UPGRADES)
// ============================================================================
export interface FortunariumUpgradeCatalogItem {
  id: FortunariumUpgradeId;
  name: string;
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
    description: 'Aumenta los pagos de Cereza y Ciruela un +30% por nivel.',
    effectSummary: '+30% pago de Cereza y Ciruela',
    baseCostMoney: 55,
    costMultiplierPerLevel: 1.55,
    keyCost: 1,
    maxLevel: 3,
    iconSymbol: 'cereza',
  },
  huerto_citrico: {
    id: 'huerto_citrico',
    name: 'Huerto Cítrico',
    description: 'Limón y Naranja aparecen un +18% más a menudo y pagan un +20% adicional por nivel.',
    effectSummary: '+18% frecuencia y +20% pago en Limón/Naranja',
    baseCostMoney: 60,
    costMultiplierPerLevel: 1.55,
    keyCost: 1,
    maxLevel: 3,
    iconSymbol: 'limon',
  },
  campana_bronce: {
    id: 'campana_bronce',
    name: 'Campana de Bronce',
    description: 'Campana y Herradura pagan +40% más en combinaciones de 4 y 5 símbolos.',
    effectSummary: '+40% en líneas 4×/5× de Campana y Herradura',
    baseCostMoney: 70,
    costMultiplierPerLevel: 1.6,
    keyCost: 1,
    maxLevel: 3,
    iconSymbol: 'campana',
  },
  iman_diamante: {
    id: 'iman_diamante',
    name: 'Imán de Diamante',
    description: 'Diamante y Estrella aparecen un +25% más a menudo, pero el coste de tirada sube +5%.',
    effectSummary: '+25% peso Diamante/Estrella · +5% coste tirada',
    baseCostMoney: 85,
    costMultiplierPerLevel: 1.65,
    keyCost: 1,
    maxLevel: 3,
    iconSymbol: 'diamante',
  },
  siete_dorado: {
    id: 'siete_dorado',
    name: 'Siete Dorado',
    description: 'Los pagos de Siete y Corona aumentan un +45% por nivel manteniendo su rareza.',
    effectSummary: '+45% pago en Siete y Corona',
    baseCostMoney: 95,
    costMultiplierPerLevel: 1.7,
    keyCost: 2,
    maxLevel: 3,
    iconSymbol: 'siete',
  },
  geometra: {
    id: 'geometra',
    name: 'Geómetra',
    description: 'Aumenta los multiplicadores de patrones Diagonal, V, V Invertida y Zigzag un +25% por nivel.',
    effectSummary: '+25% en patrones Diagonal, V y Zigzag',
    baseCostMoney: 80,
    costMultiplierPerLevel: 1.6,
    keyCost: 1,
    maxLevel: 3,
    iconSymbol: 'estrella',
  },
  mano_tahur: {
    id: 'mano_tahur',
    name: 'Mano del Tahúr',
    description: 'El Comodín aparece un +40% más a menudo y el Trébol un +20% más a menudo.',
    effectSummary: '+40% frecuencia Comodín · +20% Trébol',
    baseCostMoney: 90,
    costMultiplierPerLevel: 1.65,
    keyCost: 1,
    maxLevel: 3,
    iconSymbol: 'comodin',
  },
  mecanico_jefe: {
    id: 'mecanico_jefe',
    name: 'Mecánico',
    description: 'La Llave aparece un +35% más a menudo y cada reparación restaura +10% extra de Integridad.',
    effectSummary: '+35% frecuencia Llave · +10% reparación',
    baseCostMoney: 65,
    costMultiplierPerLevel: 1.55,
    keyCost: 1,
    maxLevel: 3,
    iconSymbol: 'llave',
  },
  cableado_ilegal: {
    id: 'cableado_ilegal',
    name: 'Cableado Ilegal',
    description: 'El Rayo aparece un +45% más a menudo y da +0.15x extra de Voltaje, pero añade +1% de desgaste por tirada.',
    effectSummary: '+45% Rayo y más Voltaje · +1% desgaste',
    baseCostMoney: 75,
    costMultiplierPerLevel: 1.6,
    keyCost: 1,
    maxLevel: 3,
    iconSymbol: 'rayo',
  },
  prensa_uvas: {
    id: 'prensa_uvas',
    name: 'Reserva de la Viña',
    description: 'Uvas y Trébol pagan +30% más por nivel y las Monedas dan +8 CR extra.',
    effectSummary: '+30% pago Uvas/Trébol · +8 CR por Moneda',
    baseCostMoney: 70,
    costMultiplierPerLevel: 1.6,
    keyCost: 1,
    maxLevel: 3,
    iconSymbol: 'uvas',
  },
  artificiero: {
    id: 'artificiero',
    name: 'Artificiero Automático',
    description: 'Desactiva automáticamente 1 Bomba por tirada por nivel y otorga +30 CR al neutralizarla.',
    effectSummary: 'Desactiva 1 Bomba/nivel (+30 CR)',
    baseCostMoney: 80,
    costMultiplierPerLevel: 1.65,
    keyCost: 1,
    maxLevel: 3,
    iconSymbol: 'herradura',
  },
  motor_extra: {
    id: 'motor_extra',
    name: 'Reserva de Manivela',
    description: 'Otorga +2 tiradas máximas por ciclo y +15% de Integridad máxima por nivel.',
    effectSummary: '+2 tiradas por ciclo · +15% Integridad máx.',
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
    description: '10 créditos por tirada. Desgaste mínimo (-1% integridad).',
  },
  doble: {
    id: 'doble',
    label: 'Doble (x2)',
    shortLabel: 'DOBLE x2',
    baseSpinCost: 20,
    costMultiplier: 2,
    payoutMultiplier: 2.0,
    integrityWear: 2,
    description: '20 créditos por tirada. Premios x2.0 y desgaste moderado (-2% integridad).',
  },
  sobrecarga: {
    id: 'sobrecarga',
    label: 'Sobrecarga (x3)',
    shortLabel: 'SOBRECARGA x3',
    baseSpinCost: 30,
    costMultiplier: 3,
    payoutMultiplier: 3.0,
    integrityWear: 4,
    description: '30 créditos por tirada. Premios x3.0 y desgaste elevado (-4% integridad).',
  },
};

export function getUpgradeCostMoney(upgradeId: FortunariumUpgradeId, currentLevel: number): number {
  const item = FORTUNARIUM_UPGRADES_CATALOG[upgradeId];
  return Math.round(item.baseCostMoney * Math.pow(item.costMultiplierPerLevel, currentLevel));
}

export function calculateEffectiveSpinCost(
  betMode: FortunariumBetMode,
  upgrades: Record<FortunariumUpgradeId, number>
): number {
  const base = FORTUNARIUM_BET_MODES[betMode].baseSpinCost;
  const imanLv = upgrades.iman_diamante || 0;
  const mult = 1 + imanLv * 0.05;
  return Math.max(1, Math.round(base * mult));
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
    if ((id === 'diamante' || id === 'estrella') && (upgrades.iman_diamante || 0) > 0) {
      w *= 1 + upgrades.iman_diamante * 0.25;
    }
    if (id === 'comodin' && (upgrades.mano_tahur || 0) > 0) {
      w *= 1 + upgrades.mano_tahur * 0.4;
    }
    if (id === 'trebol' && (upgrades.mano_tahur || 0) > 0) {
      w *= 1 + upgrades.mano_tahur * 0.2;
    }
    if (id === 'llave' && (upgrades.mecanico_jefe || 0) > 0) {
      w *= 1 + upgrades.mecanico_jefe * 0.35;
    }
    if (id === 'rayo' && (upgrades.cableado_ilegal || 0) > 0) {
      w *= 1 + upgrades.cableado_ilegal * 0.45;
    }

    // Slight voltage risk/reward modifier in sobrecarga
    if (betMode === 'sobrecarga') {
      if (id === 'bomba' || id === 'calavera') {
        w *= 1.18;
      }
      if (id === 'rayo' || id === 'moneda') {
        w *= 1.12;
      }
    }

    list.push({ id, weight: w });
  }

  return list;
}
