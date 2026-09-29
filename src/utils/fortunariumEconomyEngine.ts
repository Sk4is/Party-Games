import {
  FortunariumSymbolId,
  FortunariumUpgradeId,
  FortunariumBetMode,
  FortunariumWinLine,
  FortunariumSpecialEffectLog,
  FortunariumCellCoord,
  FortunariumPatternType,
  FortunariumDevScenario,
  FortunariumDifficulty,
  FortunariumActiveModifier,
  FortunariumModifierId,
  FortunariumWildSubstitution,
} from '../types/fortunarium';
import {
  FORTUNARIUM_SYMBOLS,
  FORTUNARIUM_BET_MODES,
  FORTUNARIUM_UPGRADES_CATALOG,
  ALL_UPGRADE_IDS,
  X_MASK_CELLS,
  TRIANGLE_MASK_CELLS,
  INVERTED_TRIANGLE_MASK_CELLS,
  BASE_JACKPOT_CHANCE,
  MAX_JACKPOT_CHANCE,
  computeEffectiveSymbolWeights,
  computeEffectiveJackpotChance,
  computeSymbolUpgradeMultiplier,
  getRepairCostMoney,
  calculateEffectiveSpinCost,
  calculateMinimumSpinCost,
  createInitialUpgradesState,
  ALL_MODIFIER_IDS,
  FORTUNARIUM_MODIFIERS_CATALOG,
} from '../data/fortunarium/fortunariumAssets';

export function pickWeightedSymbol(
  weights: { id: FortunariumSymbolId; weight: number }[],
  totalWeight: number
): FortunariumSymbolId {
  let r = Math.random() * totalWeight;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i].weight;
    if (r <= 0) return weights[i].id;
  }
  return 'cereza';
}

export function generateAuthoritativeGrid(
  upgrades: Record<FortunariumUpgradeId, number>,
  betMode: FortunariumBetMode,
  activeModifiers: FortunariumActiveModifier[] = []
): FortunariumSymbolId[][] {
  const weights = computeEffectiveSymbolWeights(upgrades, betMode).map((item) => ({ ...item }));

  const hasFiebreCerezas = activeModifiers.some((m) => m.modifierId === 'fiebre_cerezas');
  const hasLluviaMonedas = activeModifiers.some((m) => m.modifierId === 'lluvia_monedas');

  for (const w of weights) {
    if (hasFiebreCerezas && w.id === 'cereza') {
      w.weight *= 1.85;
    }
    if (hasLluviaMonedas && w.id === 'moneda') {
      w.weight *= 2.8;
    }
  }

  const totalWeight = weights.reduce((acc, item) => acc + item.weight, 0);

  const grid: FortunariumSymbolId[][] = [[], [], [], [], []];
  for (let col = 0; col < 5; col++) {
    for (let row = 0; row < 3; row++) {
      grid[col][row] = pickWeightedSymbol(weights, totalWeight);
    }
  }
  return grid;
}

// ============================================================================
// DETERMINISTIC DEV TEST BOARDS (SECTION 42 & ACCEPTANCE TESTS 50–52)
// Grid is indexed as grid[col][row] (5 columns x 3 rows)
// ============================================================================
export function generateDeterministicTestGrid(
  scenario: FortunariumDevScenario
): FortunariumSymbolId[][] {
  switch (scenario) {
    case 'horizontal_3':
    case 'single_pattern':
      // Row 0: cereza, cereza, cereza, limon, naranja
      // Row 1: ciruela, uvas, trebol, campana, herradura
      // Row 2: estrella, diamante, corona, siete, limon
      return [
        ['cereza', 'ciruela', 'estrella'],
        ['cereza', 'uvas', 'diamante'],
        ['cereza', 'trebol', 'corona'],
        ['limon', 'campana', 'siete'],
        ['naranja', 'herradura', 'limon'],
      ];

    case 'horizontal_4':
      // Row 1: campana x 4, cereza
      return [
        ['cereza', 'campana', 'uvas'],
        ['limon', 'campana', 'trebol'],
        ['naranja', 'campana', 'herradura'],
        ['ciruela', 'campana', 'estrella'],
        ['uvas', 'cereza', 'diamante'],
      ];

    case 'horizontal_5':
      // Row 0: naranja x 5 (must produce ONE HORIZONTAL x5, no nested 3/4 wins)
      return [
        ['naranja', 'cereza', 'uvas'],
        ['naranja', 'limon', 'trebol'],
        ['naranja', 'ciruela', 'campana'],
        ['naranja', 'herradura', 'estrella'],
        ['naranja', 'diamante', 'corona'],
      ];

    case 'vertical_3':
      // Col 0: campana, campana, campana
      return [
        ['campana', 'campana', 'campana'],
        ['cereza', 'uvas', 'estrella'],
        ['limon', 'trebol', 'diamante'],
        ['naranja', 'herradura', 'corona'],
        ['ciruela', 'siete', 'cereza'],
      ];

    case 'diagonal_left':
      // Down-right diagonal: (0,0), (1,1), (2,2) = herradura
      return [
        ['herradura', 'cereza', 'uvas'],
        ['limon', 'herradura', 'trebol'],
        ['naranja', 'ciruela', 'herradura'],
        ['campana', 'estrella', 'diamante'],
        ['corona', 'siete', 'cereza'],
      ];

    case 'diagonal_right':
      // Up-right diagonal: (1,2), (2,1), (3,0) = estrella
      return [
        ['cereza', 'limon', 'naranja'],
        ['ciruela', 'uvas', 'estrella'],
        ['trebol', 'estrella', 'campana'],
        ['estrella', 'herradura', 'diamante'],
        ['corona', 'siete', 'cereza'],
      ];

    case 'pat_x':
      // Exact 5-cell X pattern of 'cereza' at (r0,c0), (r0,c4), (r1,c2), (r2,c0), (r2,c4)
      // Noise in all '.' positions so NO horizontal, vertical, or diagonal triggers:
      // Row 0: cereza, limon, naranja, ciruela, cereza
      // Row 1: uvas, trebol, cereza, campana, herradura
      // Row 2: cereza, estrella, diamante, corona, cereza
      return [
        ['cereza', 'uvas', 'cereza'],
        ['limon', 'trebol', 'estrella'],
        ['naranja', 'cereza', 'diamante'],
        ['ciruela', 'campana', 'corona'],
        ['cereza', 'herradura', 'cereza'],
      ];

    case 'three_patterns':
      // Exactly 3 validated patterns:
      // 1) Horizontal x3 on Row 0 (cols 0,1,2 = cereza)
      // 2) Vertical x3 on Col 4 (rows 0,1,2 = campana)
      // 3) Diagonal x3 (r0c1=cereza? No, let's use r0c1=uvas? Wait: r2c0,r1c1,r0c2 = cereza!)
      // Row 0: cereza, cereza, cereza, limon, campana
      // Row 1: naranja, cereza, uvas, trebol, campana
      // Row 2: cereza, ciruela, herradura, estrella, campana
      return [
        ['cereza', 'naranja', 'cereza'],
        ['cereza', 'cereza', 'ciruela'],
        ['cereza', 'uvas', 'herradura'],
        ['limon', 'trebol', 'estrella'],
        ['campana', 'campana', 'campana'],
      ];

    case 'pattern_overlap':
      // Center cell (row 1, col 2) participates in:
      // 1) Horizontal x3 on Row 1 (cols 0,1,2 = campana)
      // 2) Vertical x3 on Col 2 (rows 0,1,2 = campana)
      // 3) PATRÓN X (r0c0, r0c4, r1c2, r2c0, r2c4 = campana)
      // Row 0: campana, limon, campana, naranja, campana
      // Row 1: campana, campana, campana, uvas, trebol
      // Row 2: campana, ciruela, campana, herradura, campana
      // Wait: col 0 also has 3 campanas (Vertical)! To make ONLY Horizontal(row 1), Vertical(col 2), and X(campana) share (r1,c2):
      // Put 'comodin' at (r1,c0) and 'cereza' at (r1,c1) so row 1 is campana? Wait: if (r1,c0) is 'cereza', then col 0 is campana,cereza,campana (no vertical on col 0!), and row 1 cols 2,3,4 = campana,campana,campana!
      // Let's check that!
      // Row 0: campana, limon, campana, naranja, campana
      // Row 1: cereza, uvas, campana, campana, campana
      // Row 2: campana, ciruela, campana, herradura, campana
      // In this board, cell (row 1, col 2) belongs to:
      // - HORIZONTAL x3 (row 1, cols 2,3,4)
      // - VERTICAL x3 (col 2, rows 0,1,2)
      // - PATRÓN X (r0c0, r0c4, r1c2, r2c0, r2c4)
      return [
        ['campana', 'cereza', 'campana'],
        ['limon', 'uvas', 'ciruela'],
        ['campana', 'campana', 'campana'],
        ['naranja', 'campana', 'herradura'],
        ['campana', 'campana', 'campana'],
      ];

    case 'triangulo':
      // Exact 8-cell upright triangle of 'diamante':
      // [ ][ ][X][ ][ ] -> (2,0)
      // [ ][X][ ][X][ ] -> (1,1), (3,1)
      // [X][X][X][X][X] -> (0,2), (1,2), (2,2), (3,2), (4,2)
      return [
        ['cereza', 'limon', 'diamante'],
        ['naranja', 'diamante', 'diamante'],
        ['diamante', 'ciruela', 'diamante'],
        ['uvas', 'diamante', 'diamante'],
        ['trebol', 'campana', 'diamante'],
      ];

    case 'triangulo_invertido':
      // Exact 8-cell inverted triangle of 'corona':
      // [X][X][X][X][X] -> (0,0)..(4,0)
      // [ ][X][ ][X][ ] -> (1,1), (3,1)
      // [ ][ ][X][ ][ ] -> (2,2)
      return [
        ['corona', 'cereza', 'limon'],
        ['corona', 'corona', 'naranja'],
        ['corona', 'ciruela', 'corona'],
        ['corona', 'corona', 'uvas'],
        ['corona', 'trebol', 'campana'],
      ];

    case 'multi_pattern':
      // Simultaneous Horizontal 4 + Vertical 3 + Diagonal 3
      return [
        ['uvas', 'cereza', 'limon'],
        ['uvas', 'uvas', 'naranja'],
        ['uvas', 'ciruela', 'uvas'],
        ['uvas', 'campana', 'campana'],
        ['trebol', 'herradura', 'campana'],
      ];

    case 'wild_substitution':
      // Horizontal 4 with Comodín + Diagonal 3 with Comodín
      return [
        ['diamante', 'cereza', 'limon'],
        ['comodin', 'diamante', 'naranja'],
        ['diamante', 'uvas', 'diamante'],
        ['diamante', 'trebol', 'campana'],
        ['herradura', 'estrella', 'corona'],
      ];

    case 'special_symbol':
      return [
        ['moneda', 'llave', 'cereza'],
        ['rayo', 'limon', 'naranja'],
        ['bomba', 'ciruela', 'uvas'],
        ['trebol', 'calavera', 'campana'],
        ['herradura', 'estrella', 'diamante'],
      ];

    case 'special_bomba':
      return [
        ['cereza', 'limon', 'naranja'],
        ['ciruela', 'bomba', 'uvas'],
        ['trebol', 'campana', 'herradura'],
        ['estrella', 'diamante', 'corona'],
        ['siete', 'cereza', 'limon'],
      ];

    case 'special_llave':
      return [
        ['cereza', 'limon', 'naranja'],
        ['ciruela', 'uvas', 'trebol'],
        ['campana', 'llave', 'herradura'],
        ['estrella', 'diamante', 'corona'],
        ['siete', 'cereza', 'limon'],
      ];

    case 'special_rayo':
      return [
        ['cereza', 'rayo', 'naranja'],
        ['ciruela', 'uvas', 'trebol'],
        ['campana', 'rayo', 'herradura'],
        ['estrella', 'diamante', 'corona'],
        ['siete', 'cereza', 'limon'],
      ];

    case 'special_calavera':
      return [
        ['cereza', 'limon', 'naranja'],
        ['ciruela', 'uvas', 'trebol'],
        ['campana', 'herradura', 'estrella'],
        ['diamante', 'calavera', 'corona'],
        ['siete', 'cereza', 'limon'],
      ];

    case 'special_moneda':
      return [
        ['moneda', 'limon', 'naranja'],
        ['ciruela', 'uvas', 'trebol'],
        ['campana', 'moneda', 'herradura'],
        ['estrella', 'diamante', 'corona'],
        ['siete', 'cereza', 'moneda'],
      ];

    case 'special_interrogacion':
      return [
        ['cereza', 'limon', 'naranja'],
        ['ciruela', 'uvas', 'trebol'],
        ['campana', 'interrogacion', 'herradura'],
        ['estrella', 'diamante', 'corona'],
        ['siete', 'cereza', 'limon'],
      ];

    case 'force_bankruptcy':
    case 'force_integrity_zero':
    case 'no_pattern':
      return [
        ['cereza', 'uvas', 'estrella'],
        ['limon', 'trebol', 'diamante'],
        ['naranja', 'campana', 'corona'],
        ['ciruela', 'herradura', 'siete'],
        ['cereza', 'limon', 'naranja'],
      ];

    case 'pantalla_completa':
    case 'jackpot':
      return [
        ['siete', 'siete', 'siete'],
        ['siete', 'siete', 'siete'],
        ['siete', 'siete', 'siete'],
        ['siete', 'siete', 'siete'],
        ['siete', 'siete', 'siete'],
      ];
  }
}

// ============================================================================
// CANONICAL 3 ROWS × 5 COLUMNS BOARD HELPERS (SECTION 13)
// Canonical board is indexed as: board[row][column] (row: 0..2, column: 0..4)
// Reel columns are indexed as: reelGrid[column][row] (column: 0..4, row: 0..2)
// ============================================================================
export function toRowMajorBoard(grid: FortunariumSymbolId[][]): FortunariumSymbolId[][] {
  // If already 3 rows x 5 columns:
  if (grid.length === 3 && grid[0]?.length === 5) {
    return [
      [...grid[0]],
      [...grid[1]],
      [...grid[2]],
    ];
  }
  // Convert from 5 columns x 3 rows (reelGrid[col][row]) -> 3 rows x 5 columns (board[row][col])
  const board: FortunariumSymbolId[][] = [
    ['cereza', 'cereza', 'cereza', 'cereza', 'cereza'],
    ['cereza', 'cereza', 'cereza', 'cereza', 'cereza'],
    ['cereza', 'cereza', 'cereza', 'cereza', 'cereza'],
  ];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 5; col++) {
      board[row][col] = grid[col]?.[row] || 'cereza';
    }
  }
  return board;
}

export function fromRowMajorBoard(board: FortunariumSymbolId[][]): FortunariumSymbolId[][] {
  if (board.length === 5 && board[0]?.length === 3) {
    return board.map((col) => [...col]);
  }
  const reelGrid: FortunariumSymbolId[][] = [[], [], [], [], []];
  for (let col = 0; col < 5; col++) {
    for (let row = 0; row < 3; row++) {
      reelGrid[col][row] = board[row]?.[col] || 'cereza';
    }
  }
  return reelGrid;
}

// ============================================================================
// COMPATIBLE SYMBOL MATCHING HELPER (SECTIONS 13–21)
// Evaluates against the canonical 3×5 board: board[row][column]
// Returns the matched NormalSymbolId and wild count if all cells in `coords`
// contain the SAME normal symbol (with optional 'comodin' Wild substitution).
// Returns null if any cell is a non-wild special symbol or if two different
// normal symbols appear in `coords`.
// ============================================================================
export function resolveCompatibleSymbolGroup(
  coords: FortunariumCellCoord[],
  gridOrBoard: FortunariumSymbolId[][]
): { symbolId: FortunariumSymbolId; wildCount: number } | null {
  const board = toRowMajorBoard(gridOrBoard);
  let targetSymbol: FortunariumSymbolId | null = null;
  let wildCount = 0;

  for (const c of coords) {
    if (c.row < 0 || c.row > 2 || c.col < 0 || c.col > 4) return null;
    const sym = board[c.row]?.[c.col];
    if (!sym) return null;
    if (sym === 'comodin') {
      wildCount += 1;
      continue;
    }
    const meta = FORTUNARIUM_SYMBOLS[sym];
    if (!meta || meta.category !== 'normal') {
      return null;
    }
    if (targetSymbol === null) {
      targetSymbol = sym;
    } else if (targetSymbol !== sym) {
      return null;
    }
  }

  return {
    symbolId: targetSymbol || 'siete',
    wildCount,
  };
}

export interface EvaluatedSpinCore {
  winLines: FortunariumWinLine[];
  specialEffects: FortunariumSpecialEffectLog[];
  winningCells: FortunariumCellCoord[];
  hazardCells: FortunariumCellCoord[];
  grossPayout: number;
  jackpotPayout: number;
  penalties: number;
  integrityDelta: number;
  overdriveWearAdded: number;
  voltageMultiplierUsed: number;
  voltageMultiplierAfter: number;
  keysGained: number;
  extraSpinsGained: number;
  shouldTriggerMysteryEvent: boolean;
  isJackpot: boolean;
  consumedOjoDorado: boolean;
}

export function evaluateSpinGridCore(params: {
  grid: FortunariumSymbolId[][];
  betMode: FortunariumBetMode;
  upgrades: Record<FortunariumUpgradeId, number>;
  currentVoltage: number;
  round: number;
  overdriveSpins?: number;
  playerId?: string;
  activeModifiers?: FortunariumActiveModifier[];
  allowMysteryEvents?: boolean;
  forceJackpot?: boolean;
  enableJackpotRoll?: boolean;
}): EvaluatedSpinCore {
  const {
    grid,
    betMode,
    upgrades,
    round,
    overdriveSpins = 0,
    playerId,
    activeModifiers = [],
    allowMysteryEvents = true,
    forceJackpot = false,
    enableJackpotRoll = true,
  } = params;

  const hasFiebreCerezas = activeModifiers.some((m) => m.modifierId === 'fiebre_cerezas');
  const hasGeometraEfecto = activeModifiers.some((m) => m.modifierId === 'geometra_efecto');
  const hasDiagonalPerfecta = activeModifiers.some((m) => m.modifierId === 'diagonal_perfecta');
  const hasOjoDorado = activeModifiers.some((m) => m.modifierId === 'ojo_dorado');
  const hasDinamita = activeModifiers.some((m) => m.modifierId === 'dinamita');
  const hasMotorFino = activeModifiers.some((m) => m.modifierId === 'motor_fino');
  const hasLluviaMonedas = activeModifiers.some((m) => m.modifierId === 'lluvia_monedas');
  const hasEscudoTermico = activeModifiers.some((m) => m.modifierId === 'escudo_termico');
  const hasSobrecargaDorada = activeModifiers.some((m) => m.modifierId === 'sobrecarga_dorada');
  const hasMotorAlRojo = activeModifiers.some((m) => m.modifierId === 'motor_al_rojo');
  const hasCableadoQuemado = activeModifiers.some((m) => m.modifierId === 'cableado_quemado');
  const hasImanRoto = activeModifiers.some((m) => m.modifierId === 'iman_roto');
  const hasRodilloPegado = activeModifiers.some((m) => m.modifierId === 'rodillo_pegado');
  const hasHacienda = activeModifiers.some((m) => m.modifierId === 'hacienda');
  const hasMalaRacha = activeModifiers.some((m) => m.modifierId === 'mala_racha');
  const hasFugaCreditos = activeModifiers.some((m) => m.modifierId === 'fuga_creditos');
  const hasRodillosOxidados = activeModifiers.some((m) => m.modifierId === 'rodillos_oxidados');
  const hasManoAfortunada = activeModifiers.some(
    (m) =>
      m.modifierId === 'mano_afortunada' &&
      (!m.targetPlayerId || !playerId || m.targetPlayerId === playerId)
  );
  const hasManoNegra = activeModifiers.some(
    (m) =>
      m.modifierId === 'mano_negra' &&
      (!m.targetPlayerId || !playerId || m.targetPlayerId === playerId)
  );

  let consumedOjoDorado = false;

  const betConfig = FORTUNARIUM_BET_MODES[betMode];
  const board = toRowMajorBoard(grid); // Canonical 3 rows × 5 columns: board[row][col]
  const winLines: FortunariumWinLine[] = [];
  const seenPatternIds = new Set<string>();
  const seenGeometryIds = new Set<string>();
  const specialEffects: FortunariumSpecialEffectLog[] = [];
  const winningCellSet = new Set<string>();
  const hazardCellSet = new Set<string>();

  const markWinCells = (cells: FortunariumCellCoord[]) => {
    for (const c of cells) winningCellSet.add(`${c.col},${c.row}`);
  };
  const markHazardCells = (cells: FortunariumCellCoord[]) => {
    for (const c of cells) hazardCellSet.add(`${c.col},${c.row}`);
  };

  // 1. Collect coordinates by symbol using canonical board[row][col]
  const coordsBySymbol: Record<FortunariumSymbolId, FortunariumCellCoord[]> = {
    cereza: [],
    limon: [],
    naranja: [],
    ciruela: [],
    uvas: [],
    trebol: [],
    campana: [],
    herradura: [],
    estrella: [],
    diamante: [],
    corona: [],
    siete: [],
    bomba: [],
    llave: [],
    rayo: [],
    calavera: [],
    comodin: [],
    moneda: [],
    interrogacion: [],
  };

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 5; col++) {
      const sym = board[row][col];
      coordsBySymbol[sym].push({ col, row });
    }
  }

  // 2. Process RAYO (Lightning) first so it boosts voltage for this spin
  let activeVoltage = params.currentVoltage;
  const rayoCoords = coordsBySymbol.rayo;
  let extraSpinsGained = 0;
  if (rayoCoords.length > 0) {
    const perRayo = 0.25 + (upgrades.cableado_ilegal || 0) * 0.08;
    const deltaV = Number((rayoCoords.length * perRayo).toFixed(2));
    activeVoltage = Number((activeVoltage + deltaV).toFixed(2));

    if (rayoCoords.length >= 3) {
      extraSpinsGained += 1;
    }

    specialEffects.push({
      id: `fx_rayo_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      symbolId: 'rayo',
      title: `Carga de Voltaje (${rayoCoords.length}× Rayo)`,
      description: `El multiplicador de voltaje sube +${deltaV.toFixed(2)}x.`,
      moneyDelta: 0,
      integrityDelta: 0,
      voltageDelta: deltaV,
      keysDelta: 0,
      variant: 'positive',
      cells: rayoCoords,
    });
  }

  const totalBetAndVoltageMult = betConfig.payoutMultiplier * activeVoltage;

  const getSymbolUpgradeMult = (symId: FortunariumSymbolId): number =>
    computeSymbolUpgradeMultiplier(symId, upgrades);

  const geometraBonus = 1 + (upgrades.geometra || 0) * 0.18;

  const registerPatternWin = (opts: {
    patternType: FortunariumPatternType;
    patternCategory: 'LINE' | 'SHAPE';
    displayName: string;
    basePatternMult: number;
    symbolId: FortunariumSymbolId;
    wildCount: number;
    cells: FortunariumCellCoord[];
  }) => {
    const sortedCoords = [...opts.cells].sort((a, b) =>
      a.row !== b.row ? a.row - b.row : a.col - b.col
    );
    const coordSig = sortedCoords.map((c) => `r${c.row}c${c.col}`).join('-');
    const geometryId = `${opts.patternType}:${coordSig}`;
    const detId = `${opts.patternType}:${opts.symbolId}:${coordSig}`;

    // Deduplicate both exact patternId and geometric cell-set so the same geometric win is NEVER paid twice
    if (seenPatternIds.has(detId) || seenGeometryIds.has(geometryId)) return;
    seenPatternIds.add(detId);
    seenGeometryIds.add(geometryId);

    const symMeta = FORTUNARIUM_SYMBOLS[opts.symbolId];
    const len = opts.cells.length;
    const baseSymbolVal = symMeta.baseSymbolValue;

    const effectivePatternMult = Number(
      (
        opts.basePatternMult *
        (opts.patternType === 'HORIZONTAL' ? 1.0 : geometraBonus)
      ).toFixed(2)
    );
    const baseVal = Math.max(1, Math.round(baseSymbolVal * opts.basePatternMult));

    const wildBonus = opts.wildCount > 0 ? 1.25 : 1.0;
    const symUpgradeMult = getSymbolUpgradeMult(opts.symbolId);
    let modMult = 1.0;
    if (hasSobrecargaDorada) modMult *= 1.5;
    if (hasFiebreCerezas && opts.symbolId === 'cereza') modMult *= 2.0;
    if (hasImanRoto && (opts.symbolId === 'diamante' || opts.symbolId === 'estrella')) {
      modMult *= 0.65;
    }
    if (hasGeometraEfecto && opts.patternType !== 'HORIZONTAL') {
      modMult *= 1.4;
    }
    if (hasDiagonalPerfecta && opts.patternType === 'DIAGONAL') {
      modMult *= 1.75;
    }
    if (
      hasOjoDorado &&
      !consumedOjoDorado &&
      (opts.patternType === 'X' ||
        opts.patternType === 'TRIANGULO' ||
        opts.patternType === 'TRIANGULO_INVERTIDO')
    ) {
      modMult *= 2.0;
      consumedOjoDorado = true;
    }
    if (hasManoAfortunada) {
      modMult *= 1.25;
    }
    if ((hasRodillosOxidados || hasRodilloPegado) && opts.patternType === 'HORIZONTAL') {
      modMult *= 0.8;
    }

    const payout = Math.max(
      1,
      Math.round(
        baseSymbolVal *
          effectivePatternMult *
          wildBonus *
          symUpgradeMult *
          modMult *
          totalBetAndVoltageMult
      )
    );

    const wildSubstitutions: FortunariumWildSubstitution[] = [];
    for (const c of opts.cells) {
      if (board[c.row]?.[c.col] === 'comodin') {
        wildSubstitutions.push({
          col: c.col,
          row: c.row,
          substitutedFor: opts.symbolId,
        });
      }
    }

    winLines.push({
      id: detId,
      patternId: detId,
      name: opts.displayName,
      type: opts.patternType,
      patternType: opts.patternType,
      patternCategory: opts.patternCategory,
      resolvedSymbol: opts.symbolId,
      symbolId: opts.symbolId,
      coordinates: sortedCoords,
      cells: opts.cells,
      length: len,
      count: len,
      baseSymbolValue: baseSymbolVal,
      baseReward: baseVal,
      multiplier: effectivePatternMult,
      patternMultiplier: effectivePatternMult,
      finalReward: payout,
      payout,
      wildSubstitutions: wildSubstitutions.length > 0 ? wildSubstitutions : undefined,
    });
    markWinCells(opts.cells);
  };

  // ==========================================================================
  // 3A. HORIZONTAL PATTERNS (Sections 14, 15, 20, 22)
  // Maximal contiguous run of 3, 4, or 5 identical compatible symbols per row.
  // ==========================================================================
  for (let row = 0; row < 3; row++) {
    const validIntervals: {
      startCol: number;
      endCol: number;
      runLen: number;
      symbolId: FortunariumSymbolId;
      wildCount: number;
      baseScore: number;
      cells: FortunariumCellCoord[];
    }[] = [];

    for (let startCol = 0; startCol <= 2; startCol++) {
      for (let endCol = startCol + 2; endCol <= 4; endCol++) {
        const cells: FortunariumCellCoord[] = [];
        for (let col = startCol; col <= endCol; col++) {
          cells.push({ col, row });
        }
        const match = resolveCompatibleSymbolGroup(cells, board);
        if (match) {
          const runLen = endCol - startCol + 1;
          const symMeta = FORTUNARIUM_SYMBOLS[match.symbolId];
          const horizMult = runLen >= 5 ? 8.0 : runLen === 4 ? 3.0 : 1.0;
          const baseScore = Math.round(symMeta.baseSymbolValue * horizMult);

          validIntervals.push({
            startCol,
            endCol,
            runLen,
            symbolId: match.symbolId,
            wildCount: match.wildCount,
            baseScore,
            cells,
          });
        }
      }
    }

    // Filter to MAXIMAL contiguous runs only (exclude any sub-interval of a longer valid interval on this row)
    const maximalIntervals = validIntervals.filter(
      (cand) =>
        !validIntervals.some(
          (other) =>
            other.startCol <= cand.startCol &&
            other.endCol >= cand.endCol &&
            (other.startCol < cand.startCol || other.endCol > cand.endCol)
        )
    );

    if (maximalIntervals.length > 0) {
      maximalIntervals.sort((a, b) =>
        b.runLen !== a.runLen ? b.runLen - a.runLen : b.baseScore - a.baseScore
      );
      const bestRun = maximalIntervals[0];
      const horizPatternMult =
        bestRun.runLen >= 5 ? 8.0 : bestRun.runLen === 4 ? 3.0 : 1.0;
      registerPatternWin({
        patternType: 'HORIZONTAL',
        patternCategory: 'LINE',
        displayName: `HORIZONTAL ×${bestRun.runLen}`,
        basePatternMult: horizPatternMult,
        symbolId: bestRun.symbolId,
        wildCount: bestRun.wildCount,
        cells: bestRun.cells,
      });
    }
  }

  // ==========================================================================
  // 3B. VERTICAL PATTERNS (Sections 14, 16, 20, 22)
  // ==========================================================================
  for (let col = 0; col < 5; col++) {
    const cells: FortunariumCellCoord[] = [
      { col, row: 0 },
      { col, row: 1 },
      { col, row: 2 },
    ];
    const match = resolveCompatibleSymbolGroup(cells, board);
    if (match) {
      registerPatternWin({
        patternType: 'VERTICAL',
        patternCategory: 'LINE',
        displayName: 'VERTICAL ×3',
        basePatternMult: 1.15,
        symbolId: match.symbolId,
        wildCount: match.wildCount,
        cells,
      });
    }
  }

  // ==========================================================================
  // 3C. DIAGONAL PATTERNS (Sections 14, 17, 20, 22)
  // ==========================================================================
  for (let startCol = 0; startCol <= 2; startCol++) {
    const downCells: FortunariumCellCoord[] = [
      { col: startCol, row: 0 },
      { col: startCol + 1, row: 1 },
      { col: startCol + 2, row: 2 },
    ];
    const downMatch = resolveCompatibleSymbolGroup(downCells, board);
    if (downMatch) {
      registerPatternWin({
        patternType: 'DIAGONAL',
        patternCategory: 'LINE',
        displayName: 'DIAGONAL ×3',
        basePatternMult: 1.3,
        symbolId: downMatch.symbolId,
        wildCount: downMatch.wildCount,
        cells: downCells,
      });
    }

    const upCells: FortunariumCellCoord[] = [
      { col: startCol + 2, row: 0 },
      { col: startCol + 1, row: 1 },
      { col: startCol, row: 2 },
    ];
    const upMatch = resolveCompatibleSymbolGroup(upCells, board);
    if (upMatch) {
      registerPatternWin({
        patternType: 'DIAGONAL',
        patternCategory: 'LINE',
        displayName: 'DIAGONAL ×3',
        basePatternMult: 1.3,
        symbolId: upMatch.symbolId,
        wildCount: upMatch.wildCount,
        cells: upCells,
      });
    }
  }

  // ==========================================================================
  // 3D. SHAPE PATTERNS: X, TRIÁNGULO & TRIÁNGULO INVERTIDO (Sections 17–21)
  // ==========================================================================
  const xPatternMatch = resolveCompatibleSymbolGroup(X_MASK_CELLS, board);
  if (xPatternMatch) {
    registerPatternWin({
      patternType: 'X',
      patternCategory: 'SHAPE',
      displayName: 'PATRÓN X',
      basePatternMult: 28.0,
      symbolId: xPatternMatch.symbolId,
      wildCount: xPatternMatch.wildCount,
      cells: X_MASK_CELLS,
    });
  }

  const triangleMatch = resolveCompatibleSymbolGroup(TRIANGLE_MASK_CELLS, board);
  if (triangleMatch) {
    registerPatternWin({
      patternType: 'TRIANGULO',
      patternCategory: 'SHAPE',
      displayName: 'TRIÁNGULO',
      basePatternMult: 64.0,
      symbolId: triangleMatch.symbolId,
      wildCount: triangleMatch.wildCount,
      cells: TRIANGLE_MASK_CELLS,
    });
  }

  const invTriangleMatch = resolveCompatibleSymbolGroup(
    INVERTED_TRIANGLE_MASK_CELLS,
    board
  );
  if (invTriangleMatch) {
    registerPatternWin({
      patternType: 'TRIANGULO_INVERTIDO',
      patternCategory: 'SHAPE',
      displayName: 'TRIÁNGULO INVERTIDO',
      basePatternMult: 64.0,
      symbolId: invTriangleMatch.symbolId,
      wildCount: invTriangleMatch.wildCount,
      cells: INVERTED_TRIANGLE_MASK_CELLS,
    });
  }

  // 3E. CANONICAL FULL GRID JACKPOT PATTERN (PART D: ALL 15 CELLS)
  const all15GridCells: FortunariumCellCoord[] = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 5; c++) {
      all15GridCells.push({ col: c, row: r });
    }
  }
  const fullGridMatch = resolveCompatibleSymbolGroup(all15GridCells, board);
  let isFullGridJackpot = false;
  if (fullGridMatch) {
    isFullGridJackpot = true;
    registerPatternWin({
      patternType: 'PANTALLA_COMPLETA',
      patternCategory: 'SHAPE',
      displayName: 'PANTALLA COMPLETA / JACKPOT',
      basePatternMult: 100.0,
      symbolId: fullGridMatch.symbolId,
      wildCount: fullGridMatch.wildCount,
      cells: all15GridCells,
    });
  }

  // 4. Sum line & shape pattern payouts and apply symbol-specific line perks
  let grossPayout = 0;
  const lateGameWear = round >= 5 ? Math.min(3, Math.floor((round - 3) / 2)) : 0;
  let baseSpinWear =
    betConfig.integrityWear +
    lateGameWear +
    ((upgrades.cableado_ilegal || 0) > 0 ? 1 : 0) +
    (hasMotorAlRojo ? 2 : 0) +
    (hasManoNegra ? 2 : 0);

  if (hasMotorFino) {
    baseSpinWear = Math.max(0, Math.floor(baseSpinWear * 0.5));
  }
  if (hasEscudoTermico) {
    baseSpinWear = 0;
  }

  // Post-quota overdrive wear curve (Sections 2, 3, 10)
  let overdriveWearAdded = 0;
  if (overdriveSpins > 0 && !hasEscudoTermico) {
    if (overdriveSpins === 1) {
      overdriveWearAdded = 1 + (Math.random() < 0.45 ? 1 : 0);
    } else if (overdriveSpins === 2) {
      overdriveWearAdded = 2 + Math.floor(Math.random() * 2);
    } else if (overdriveSpins === 3) {
      overdriveWearAdded = 4 + Math.floor(Math.random() * 3);
    } else {
      overdriveWearAdded = overdriveSpins * 2 + Math.floor(Math.random() * 3);
    }
  }

  let integrityDelta = -(baseSpinWear + overdriveWearAdded);
  let keysGained = 0;

  if (hasLluviaMonedas) {
    grossPayout += Math.round(12 * betConfig.payoutMultiplier);
  }

  for (const w of winLines) {
    grossPayout += w.payout;
    if (w.symbolId === 'herradura') {
      integrityDelta += 4;
    }
    if (w.symbolId === 'estrella') {
      activeVoltage = Number((activeVoltage + 0.1).toFixed(2));
    }
    if (w.symbolId === 'corona' && w.count >= 4) {
      keysGained += 1;
    }
  }

  // 5. Process MONEDA (Direct Coin Bonus)
  const monedaCoords = coordsBySymbol.moneda;
  if (monedaCoords.length > 0) {
    const perCoinBase = 16 + (upgrades.prensa_uvas || 0) * 6;
    const trioBonus = monedaCoords.length >= 3 ? 45 : 0;
    const coinReward = Math.round(
      (monedaCoords.length * perCoinBase + trioBonus) * totalBetAndVoltageMult
    );
    grossPayout += coinReward;

    specialEffects.push({
      id: `fx_moneda_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      symbolId: 'moneda',
      title:
        monedaCoords.length >= 3
          ? `¡Lluvia de Oro! (${monedaCoords.length}× Monedas)`
          : `Moneda Directa (${monedaCoords.length}×)`,
      description: `Premio instantáneo de +${coinReward} CR.`,
      moneyDelta: coinReward,
      integrityDelta: 0,
      voltageDelta: 0,
      keysDelta: 0,
      variant: 'positive',
      cells: monedaCoords,
    });
  }

  // 6. Process LLAVE & BOMBA (Keys + Bombs + Defuse Synergy)
  const llaveCoords = coordsBySymbol.llave;
  const bombaCoords = coordsBySymbol.bomba;
  const autoDefuseCapacity = Math.ceil((upgrades.artificiero || 0) / 2);

  if (llaveCoords.length > 0) {
    const keysFromSymbol = llaveCoords.length;
    const repairFromKey = llaveCoords.length * 8;
    keysGained += keysFromSymbol;
    integrityDelta += repairFromKey;

    specialEffects.push({
      id: `fx_llave_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      symbolId: 'llave',
      title: `Llave Maestra (${llaveCoords.length}×)`,
      description: `+${keysFromSymbol} Llave(s) de Taller y +${repairFromKey}% de Integridad.`,
      moneyDelta: 0,
      integrityDelta: repairFromKey,
      voltageDelta: 0,
      keysDelta: keysFromSymbol,
      variant: 'positive',
      cells: llaveCoords,
    });
  }

  let PenaltiesTotal = 0;
  if (bombaCoords.length > 0) {
    const defusedCount = Math.min(
      bombaCoords.length,
      llaveCoords.length + autoDefuseCapacity
    );
    const explodedCount = bombaCoords.length - defusedCount;

    if (defusedCount > 0) {
      const perDefuseBase = 35 + (upgrades.artificiero || 0) * 10;
      const defuseReward = Math.round(defusedCount * perDefuseBase * betConfig.payoutMultiplier);
      grossPayout += defuseReward;
      specialEffects.push({
        id: `fx_defuse_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        symbolId: 'synergy',
        title: `¡Bomba Neutralizada! (${defusedCount}×)`,
        description: `Desactivada a tiempo: +${defuseReward} CR de recompensa.`,
        moneyDelta: defuseReward,
        integrityDelta: 0,
        voltageDelta: 0,
        keysDelta: 0,
        variant: 'positive',
        cells: bombaCoords.slice(0, defusedCount),
      });
    }

    if (explodedCount > 0) {
      if (hasDinamita || hasEscudoTermico) {
        const dynBonus = Math.round(explodedCount * 45 * betConfig.payoutMultiplier);
        grossPayout += dynBonus;
        specialEffects.push({
          id: `fx_bomba_dyn_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
          symbolId: 'bomba',
          title: hasDinamita
            ? `¡Dinamita Beneficiosa! (${explodedCount}× Bomba)`
            : `¡Blindaje Térmico! (${explodedCount}× Bomba)`,
          description: `Las bombas explotan a vuestro favor: +${dynBonus} CR y 0 daño al chasis.`,
          moneyDelta: dynBonus,
          integrityDelta: 0,
          voltageDelta: 0,
          keysDelta: 0,
          variant: 'positive',
          cells: bombaCoords.slice(defusedCount),
        });
      } else {
        const hazardMult = (hasMalaRacha ? 1.3 : 1.0) * (hasManoNegra ? 1.15 : 1.0);
        const rawDmg = Math.round((explodedCount * 14 + (hasCableadoQuemado ? 3 : 0)) * hazardMult);
        const cashLoss = Math.round(explodedCount * (20 + round * 3) * hazardMult);
        integrityDelta -= rawDmg;
        PenaltiesTotal += cashLoss;
        markHazardCells(bombaCoords.slice(defusedCount));

        specialEffects.push({
          id: `fx_bomba_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
          symbolId: 'bomba',
          title: `¡Explosión en Rodillos! (${explodedCount}× Bomba)`,
          description: `Daña -${rawDmg}% la Integridad y destruye -${cashLoss} CR.`,
          moneyDelta: -cashLoss,
          integrityDelta: -rawDmg,
          voltageDelta: 0,
          keysDelta: 0,
          variant: 'negative',
          cells: bombaCoords.slice(defusedCount),
        });
      }
    }
  } else if (hasCableadoQuemado && !hasEscudoTermico) {
    integrityDelta -= 3;
  }

  if (hasFugaCreditos) {
    PenaltiesTotal += 6;
  }

  // 7. Process CALAVERA & TRÉBOL Synergy
  const calaveraCoords = coordsBySymbol.calavera;
  const trebolCoords = coordsBySymbol.trebol;
  if (calaveraCoords.length > 0) {
    const wardedCount = Math.min(calaveraCoords.length, trebolCoords.length);
    const activeSkulls = calaveraCoords.length - wardedCount;

    if (wardedCount > 0) {
      const wardBonus = Math.round(wardedCount * 12 * betConfig.payoutMultiplier);
      grossPayout += wardBonus;
      specialEffects.push({
        id: `fx_ward_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        symbolId: 'synergy',
        title: `Maldición Bloqueada (${wardedCount}× Trébol)`,
        description: `El Trébol purifica la Calavera y otorga +${wardBonus} CR.`,
        moneyDelta: wardBonus,
        integrityDelta: 0,
        voltageDelta: 0,
        keysDelta: 0,
        variant: 'positive',
        cells: calaveraCoords.slice(0, wardedCount),
      });
    }

    if (activeSkulls > 0) {
      const drain = Math.max(
        15 * activeSkulls,
        Math.round(grossPayout * 0.2 * activeSkulls)
      );
      const skullIntegrityLoss = activeSkulls * 6;
      PenaltiesTotal += drain;
      integrityDelta -= skullIntegrityLoss;
      markHazardCells(calaveraCoords.slice(wardedCount));

      specialEffects.push({
        id: `fx_calavera_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        symbolId: 'calavera',
        title: `Drenaje de Calavera (${activeSkulls}×)`,
        description: `Absorbe -${drain} CR y resta -${skullIntegrityLoss}% de Integridad.`,
        moneyDelta: -drain,
        integrityDelta: -skullIntegrityLoss,
        voltageDelta: 0,
        keysDelta: 0,
        variant: 'negative',
        cells: calaveraCoords.slice(wardedCount),
      });
    }
  }

  // 8. Process INTERROGACIÓN (Mystery Box / Interactive Event + Temporary Note)
  const mysteryCoords = coordsBySymbol.interrogacion;
  let shouldTriggerMysteryEvent = false;
  if (mysteryCoords.length > 0) {
    if (allowMysteryEvents) {
      shouldTriggerMysteryEvent = true;
    }
    const instantMysteryCash = Math.round(
      mysteryCoords.length * 20 * totalBetAndVoltageMult
    );
    grossPayout += instantMysteryCash;

    const pickedModId: FortunariumModifierId =
      ALL_MODIFIER_IDS[Math.floor(Math.random() * ALL_MODIFIER_IDS.length)];
    const modDef = FORTUNARIUM_MODIFIERS_CATALOG[pickedModId];

    specialEffects.push({
      id: `fx_mystery_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      symbolId: 'interrogacion',
      title: `Incógnita del Fortunarium (${mysteryCoords.length}× ?)`,
      description: shouldTriggerMysteryEvent
        ? `Otorga +${instantMysteryCash} CR, adhiere «${modDef.name}» (${modDef.defaultSpins} tiradas) y abre decisión de equipo.`
        : `Premio misterioso directo de +${instantMysteryCash} CR y nota «${modDef.name}».`,
      moneyDelta: instantMysteryCash,
      integrityDelta: 0,
      voltageDelta: 0,
      keysDelta: 0,
      variant: modDef.type === 'BUFF' ? 'positive' : 'neutral',
      cells: mysteryCoords,
      grantedModifierId: pickedModId,
    });
  }

  // 9. DEDICATED SERVER-AUTHORITATIVE JACKPOT ROLL (SECTIONS 22–26 & PART D)
  let isJackpot = false;
  let jackpotPayout = 0;
  if (isFullGridJackpot) {
    isJackpot = true;
    const fullGridW = winLines.find((w) => w.patternType === 'PANTALLA_COMPLETA');
    jackpotPayout = fullGridW ? fullGridW.payout : Math.round(520 * totalBetAndVoltageMult);
    // Controlled authoritative settlement: full-grid jackpot payout governs total reward
    grossPayout = jackpotPayout;
  } else if (enableJackpotRoll) {
    const jackpotChance = computeEffectiveJackpotChance(
      upgrades,
      betMode,
      activeModifiers
    );
    if (forceJackpot || Math.random() < jackpotChance) {
      isJackpot = true;
      jackpotPayout = Math.round(280 * totalBetAndVoltageMult);
      grossPayout += jackpotPayout;
    }
  }

  // Voltage decays slightly toward 1.0 after spin resolution
  const voltageMultiplierAfter =
    activeVoltage > 1.0
      ? Number(Math.max(1.0, activeVoltage - 0.12).toFixed(2))
      : 1.0;

  const winningCells: FortunariumCellCoord[] = Array.from(winningCellSet).map((s) => {
    const [col, row] = s.split(',').map(Number);
    return { col, row };
  });
  const hazardCells: FortunariumCellCoord[] = Array.from(hazardCellSet).map((s) => {
    const [col, row] = s.split(',').map(Number);
    return { col, row };
  });

  if (hasHacienda && grossPayout > 0) {
    const tax = Math.max(1, Math.round(grossPayout * 0.18));
    PenaltiesTotal += tax;
  }

  return {
    winLines,
    specialEffects,
    winningCells,
    hazardCells,
    grossPayout,
    jackpotPayout,
    penalties: PenaltiesTotal,
    integrityDelta,
    overdriveWearAdded,
    voltageMultiplierUsed: activeVoltage,
    voltageMultiplierAfter,
    keysGained,
    extraSpinsGained,
    shouldTriggerMysteryEvent,
    isJackpot,
    consumedOjoDorado,
  };
}

// ============================================================================
// REPAIR COST SCALING, INCIDENT PROBABILITY, SYNERGY OFFERS & BIG WIN (PASS 2)
// ============================================================================
export function calculateRepairCost(params: {
  round: number;
  repairsUsedInQuota?: number;
  integrity: number;
  maxIntegrity?: number;
  upgrades?: Record<FortunariumUpgradeId, number>;
  activeModifiers?: Pick<FortunariumActiveModifier, 'modifierId'>[];
}): number {
  return getRepairCostMoney(params);
}

export function calculateIncidentProbability(params: {
  round: number;
  overdriveSpins?: number;
  integrity: number;
  maxIntegrity?: number;
  spinsSinceLastIncident: number;
  activeModifiers?: FortunariumActiveModifier[];
  playerId?: string;
}): number {
  const {
    round,
    overdriveSpins = 0,
    integrity,
    maxIntegrity = 100,
    spinsSinceLastIncident,
    activeModifiers = [],
    playerId,
  } = params;

  // Quota 1 has no random incidents unless players push into Overdrive
  if (round <= 1 && overdriveSpins === 0) {
    return 0;
  }

  // Minimum spacing cooldown (shorter cooldown only when pushing deep into Overdrive)
  const minCooldown = overdriveSpins >= 3 ? 2 : 4;
  if (spinsSinceLastIncident < minCooldown) {
    return 0;
  }

  let prob =
    round <= 1
      ? 0.02
      : round === 2
      ? 0.06
      : Math.min(0.18, 0.09 + (round - 3) * 0.015);

  // Overdrive pressure curve
  if (overdriveSpins === 1) prob += 0.06;
  else if (overdriveSpins === 2) prob += 0.14;
  else if (overdriveSpins === 3) prob += 0.24;
  else if (overdriveSpins >= 4) prob += Math.min(0.42, 0.24 + (overdriveSpins - 3) * 0.08);

  // Damaged machine instability
  if (integrity / Math.max(1, maxIntegrity) <= 0.45) {
    prob += 0.05;
  }

  // Mano Negra player-specific debuff
  const hasManoNegra = activeModifiers.some(
    (m) =>
      m.modifierId === 'mano_negra' &&
      (!m.targetPlayerId || !playerId || m.targetPlayerId === playerId)
  );
  if (hasManoNegra) {
    prob += 0.07;
  }

  return Number(Math.min(0.6, prob).toFixed(3));
}

export function isBigWinSpin(params: {
  winLinesCount: number;
  grossPayout: number;
  spinCost: number;
  isJackpot?: boolean;
}): boolean {
  if (params.isJackpot) return true;
  if (params.winLinesCount >= 3) return true;
  const relativeThreshold = Math.max(42, params.spinCost * 4.2);
  return params.grossPayout >= relativeThreshold;
}

export function rollSynergyWeightedUpgrades(params: {
  upgrades: Record<FortunariumUpgradeId, number>;
  integrity: number;
  maxIntegrity: number;
  round: number;
}): FortunariumUpgradeId[] {
  const { upgrades, integrity, maxIntegrity, round } = params;
  const candidates = ALL_UPGRADE_IDS.filter((id) => {
    const lv = upgrades[id] || 0;
    return lv < FORTUNARIUM_UPGRADES_CATALOG[id].maxLevel;
  });

  if (candidates.length <= 3) {
    return [...candidates];
  }

  // Calculate synergy weights without guaranteeing ideal picks
  const fruitInstalled =
    (upgrades.cosecha_roja || 0) +
    (upgrades.huerto_citrico || 0) +
    (upgrades.prensa_uvas || 0);
  const geoInstalled = (upgrades.geometra || 0) + (upgrades.mano_tahur || 0);
  const lowIntegrity = integrity / Math.max(1, maxIntegrity) <= 0.65;

  const weightedPool = candidates.map((id) => {
    const item = FORTUNARIUM_UPGRADES_CATALOG[id];
    let weight =
      item.rarity === 'COMÚN'
        ? 38
        : item.rarity === 'POCO COMÚN'
        ? 30
        : item.rarity === 'RARA'
        ? 20
        : 12;

    if (round >= 3 && (item.rarity === 'RARA' || item.rarity === 'EXCEPCIONAL')) {
      weight *= 1.35;
    }
    if (fruitInstalled > 0 && item.synergyTags.includes('fruit')) {
      weight *= 1.3;
    }
    if (geoInstalled > 0 && item.synergyTags.includes('geometry')) {
      weight *= 1.3;
    }
    if (lowIntegrity && item.synergyTags.includes('repair')) {
      weight *= 1.4;
    }
    if ((upgrades[id] || 0) > 0) {
      weight *= 1.2;
    }

    return { id, weight };
  });

  const picked: FortunariumUpgradeId[] = [];
  const pool = [...weightedPool];

  while (picked.length < 3 && pool.length > 0) {
    const totalW = pool.reduce((acc, p) => acc + p.weight, 0);
    let r = Math.random() * totalW;
    let chosenIdx = 0;
    for (let i = 0; i < pool.length; i++) {
      r -= pool[i].weight;
      if (r <= 0) {
        chosenIdx = i;
        break;
      }
    }
    picked.push(pool[chosenIdx].id);
    pool.splice(chosenIdx, 1);
  }

  return picked;
}

// ============================================================================
// QUOTA SCALING (SECTIONS 33 & 34)
// Next quota is based on `previousQuota` (NEVER current overshot money!)
// Multiplies previousQuota by a factor in [1.85 .. 2.15] and rounds nicely.
// ============================================================================
export function roundToNiceQuotaNumber(value: number): number {
  if (value <= 500) {
    return Math.round(value / 10) * 10;
  }
  if (value <= 2500) {
    return Math.round(value / 25) * 25;
  }
  if (value <= 10000) {
    return Math.round(value / 50) * 50;
  }
  return Math.round(value / 100) * 100;
}

export function calculateInitialQuota(difficulty: FortunariumDifficulty): number {
  if (difficulty === 'temerario') return 260;
  if (difficulty === 'dificil') return 240;
  return 220;
}

export function calculateNextQuotaTarget(
  previousQuota: number,
  difficulty: FortunariumDifficulty,
  deterministicFactor?: number
): number {
  const minFactor = difficulty === 'temerario' ? 1.95 : difficulty === 'dificil' ? 1.9 : 1.85;
  const maxFactor = difficulty === 'temerario' ? 2.2 : difficulty === 'dificil' ? 2.18 : 2.15;
  const factor =
    deterministicFactor !== undefined
      ? deterministicFactor
      : minFactor + Math.random() * (maxFactor - minFactor);
  const raw = previousQuota * factor;
  return Math.max(previousQuota + 50, roundToNiceQuotaNumber(raw));
}

// ============================================================================
// DEV-ONLY MONTE CARLO ECONOMY SIMULATOR (SECTIONS 6, 7, 42)
// ============================================================================
export interface FortunariumSimulationReport {
  totalSpins: number;
  betMode: FortunariumBetMode;
  averageSpinCost: number;
  averageGrossPayout: number;
  averageNetPayout: number;
  rtpPercentage: number;
  medianPayout: number;
  zeroWinPercentage: number;
  patternHitPercentage: number;
  jackpotHitPercentage: number;
  jackpotHitRatePct: number;
  averageSpecialsPerSpin: number;
  spinsWith1SpecialPct: number;
  spinsWith2SpecialsPct: number;
  spinsWith3PlusSpecialsPct: number;
  symbolFrequenciesPct: Record<FortunariumSymbolId, number>;
  patternFrequencies: {
    HORIZONTAL_3: number;
    HORIZONTAL_4: number;
    HORIZONTAL_5: number;
    VERTICAL_3: number;
    DIAGONAL_3: number;
    X: number;
    TRIANGULO: number;
    TRIANGULO_INVERTIDO: number;
  };
  estimatedSpinsToQuota1: number;
  bankruptcyRateQuota1Pct: number;
  quota1SuccessRatePct: number;
  quota2SuccessRatePct: number;
  quota3SuccessRatePct: number;
}

export function runFortunariumSimulation(
  numSpins = 50000,
  betMode: FortunariumBetMode = 'normal',
  upgrades: Record<FortunariumUpgradeId, number> = createInitialUpgradesState()
): FortunariumSimulationReport {
  const spinCost = calculateEffectiveSpinCost(betMode, upgrades);
  let totalCost = 0;
  let totalGross = 0;
  let totalNet = 0;
  let zeroWins = 0;
  let patternHits = 0;
  let jackpotHits = 0;
  let totalSpecials = 0;
  let spins1Spec = 0;
  let spins2Spec = 0;
  let spins3PlusSpec = 0;

  const patCounts = {
    HORIZONTAL_3: 0,
    HORIZONTAL_4: 0,
    HORIZONTAL_5: 0,
    VERTICAL_3: 0,
    DIAGONAL_3: 0,
    X: 0,
    TRIANGULO: 0,
    TRIANGULO_INVERTIDO: 0,
  };

  const symCounts: Record<FortunariumSymbolId, number> = {
    cereza: 0,
    limon: 0,
    naranja: 0,
    ciruela: 0,
    uvas: 0,
    trebol: 0,
    campana: 0,
    herradura: 0,
    estrella: 0,
    diamante: 0,
    corona: 0,
    siete: 0,
    bomba: 0,
    llave: 0,
    rayo: 0,
    calavera: 0,
    comodin: 0,
    moneda: 0,
    interrogacion: 0,
  };

  const samplePayouts: number[] = [];
  let voltage = 1.0;

  for (let i = 0; i < numSpins; i++) {
    const grid = generateAuthoritativeGrid(upgrades, betMode);
    let specInSpin = 0;
    for (let c = 0; c < 5; c++) {
      for (let r = 0; r < 3; r++) {
        const s = grid[c][r];
        symCounts[s]++;
        if (FORTUNARIUM_SYMBOLS[s].category === 'special') {
          specInSpin++;
        }
      }
    }

    totalSpecials += specInSpin;
    if (specInSpin === 1) spins1Spec++;
    else if (specInSpin === 2) spins2Spec++;
    else if (specInSpin >= 3) spins3PlusSpec++;

    const res = evaluateSpinGridCore({
      grid,
      betMode,
      upgrades,
      currentVoltage: voltage,
      round: 1,
      allowMysteryEvents: false,
      enableJackpotRoll: true,
    });

    for (const w of res.winLines) {
      if (w.patternType === 'HORIZONTAL') {
        if (w.count === 3) patCounts.HORIZONTAL_3++;
        else if (w.count === 4) patCounts.HORIZONTAL_4++;
        else if (w.count >= 5) patCounts.HORIZONTAL_5++;
      } else if (w.patternType === 'VERTICAL') {
        patCounts.VERTICAL_3++;
      } else if (w.patternType === 'DIAGONAL') {
        patCounts.DIAGONAL_3++;
      } else if (w.patternType === 'X') {
        patCounts.X++;
      } else if (w.patternType === 'TRIANGULO') {
        patCounts.TRIANGULO++;
      } else if (w.patternType === 'TRIANGULO_INVERTIDO') {
        patCounts.TRIANGULO_INVERTIDO++;
      }
    }

    voltage = res.voltageMultiplierAfter;
    const netPayout = Math.max(0, res.grossPayout - res.penalties);
    totalCost += spinCost;
    totalGross += res.grossPayout;
    totalNet += netPayout;

    if (res.grossPayout === 0) zeroWins++;
    if (res.winLines.length > 0) patternHits++;
    if (res.isJackpot) jackpotHits++;
    if (i < 10000) samplePayouts.push(netPayout);
  }

  // Simulate 1,200 full progression runs from 140 CR through Quota 1 -> Quota 2 -> Quota 3
  const numRuns = 1200;
  let q1Success = 0;
  let q1Bankrupt = 0;
  let q2Success = 0;
  let q3Success = 0;
  let totalSpinsInQ1Success = 0;

  for (let r = 0; r < numRuns; r++) {
    let money = 140;
    let integrity = 100;
    let volt = 1.0;
    const runUpgrades = { ...upgrades };
    let quotaTarget = calculateInitialQuota('normal'); // 220 CR
    let spinsInQ1 = 0;

    // Quota 1 loop
    while (money >= spinCost && integrity > 0 && money < quotaTarget && spinsInQ1 < 120) {
      spinsInQ1++;
      money -= spinCost;
      const g = generateAuthoritativeGrid(runUpgrades, 'normal');
      const sRes = evaluateSpinGridCore({
        grid: g,
        betMode: 'normal',
        upgrades: runUpgrades,
        currentVoltage: volt,
        round: 1,
        allowMysteryEvents: false,
        enableJackpotRoll: true,
      });
      volt = sRes.voltageMultiplierAfter;
      money = Math.max(0, money + sRes.grossPayout - sRes.penalties);
      integrity = Math.max(0, Math.min(100, integrity + sRes.integrityDelta));
    }

    if (money >= quotaTarget && integrity > 0) {
      q1Success++;
      totalSpinsInQ1Success += spinsInQ1;
      // Grant 1 free build upgrade after sealing Quota 1
      runUpgrades.cosecha_roja = (runUpgrades.cosecha_roja || 0) + 1;
      runUpgrades.geometra = (runUpgrades.geometra || 0) + 1;
      quotaTarget = calculateNextQuotaTarget(quotaTarget, 'normal', 1.95);

      let spinsInQ2 = 0;
      while (money >= spinCost && integrity > 0 && money < quotaTarget && spinsInQ2 < 160) {
        spinsInQ2++;
        money -= spinCost;
        const g = generateAuthoritativeGrid(runUpgrades, 'normal');
        const sRes = evaluateSpinGridCore({
          grid: g,
          betMode: 'normal',
          upgrades: runUpgrades,
          currentVoltage: volt,
          round: 2,
          allowMysteryEvents: false,
          enableJackpotRoll: true,
        });
        volt = sRes.voltageMultiplierAfter;
        money = Math.max(0, money + sRes.grossPayout - sRes.penalties);
        integrity = Math.max(0, Math.min(100, integrity + sRes.integrityDelta));
      }

      if (money >= quotaTarget && integrity > 0) {
        q2Success++;
        runUpgrades.huerto_citrico = (runUpgrades.huerto_citrico || 0) + 1;
        runUpgrades.campana_bronce = (runUpgrades.campana_bronce || 0) + 1;
        quotaTarget = calculateNextQuotaTarget(quotaTarget, 'normal', 1.95);

        let spinsInQ3 = 0;
        while (money >= spinCost && integrity > 0 && money < quotaTarget && spinsInQ3 < 200) {
          spinsInQ3++;
          money -= spinCost;
          const g = generateAuthoritativeGrid(runUpgrades, 'normal');
          const sRes = evaluateSpinGridCore({
            grid: g,
            betMode: 'normal',
            upgrades: runUpgrades,
            currentVoltage: volt,
            round: 3,
            allowMysteryEvents: false,
            enableJackpotRoll: true,
          });
          volt = sRes.voltageMultiplierAfter;
          money = Math.max(0, money + sRes.grossPayout - sRes.penalties);
          integrity = Math.max(0, Math.min(100, integrity + sRes.integrityDelta));
        }

        if (money >= quotaTarget && integrity > 0) {
          q3Success++;
        }
      }
    } else if (money < spinCost) {
      q1Bankrupt++;
    }
  }

  samplePayouts.sort((a, b) => a - b);
  const medianPayout =
    samplePayouts.length > 0
      ? samplePayouts[Math.floor(samplePayouts.length / 2)]
      : 0;

  const totalCells = numSpins * 15;
  const symbolFrequenciesPct = {} as Record<FortunariumSymbolId, number>;
  for (const k of Object.keys(symCounts) as FortunariumSymbolId[]) {
    symbolFrequenciesPct[k] = Number(((symCounts[k] / totalCells) * 100).toFixed(3));
  }

  const avgGross = totalGross / numSpins;
  const avgNet = totalNet / numSpins;
  const rtpPercentage = Number(((totalNet / totalCost) * 100).toFixed(2));
  const jackpotHitRatePct = Number(((jackpotHits / numSpins) * 100).toFixed(3));
  const estimatedSpinsToQuota1 =
    q1Success > 0 ? Number((totalSpinsInQ1Success / q1Success).toFixed(1)) : 14.0;

  return {
    totalSpins: numSpins,
    betMode,
    averageSpinCost: spinCost,
    averageGrossPayout: Number(avgGross.toFixed(2)),
    averageNetPayout: Number(avgNet.toFixed(2)),
    rtpPercentage,
    medianPayout,
    zeroWinPercentage: Number(((zeroWins / numSpins) * 100).toFixed(2)),
    patternHitPercentage: Number(((patternHits / numSpins) * 100).toFixed(2)),
    jackpotHitPercentage: jackpotHitRatePct,
    jackpotHitRatePct,
    averageSpecialsPerSpin: Number((totalSpecials / numSpins).toFixed(3)),
    spinsWith1SpecialPct: Number(((spins1Spec / numSpins) * 100).toFixed(2)),
    spinsWith2SpecialsPct: Number(((spins2Spec / numSpins) * 100).toFixed(2)),
    spinsWith3PlusSpecialsPct: Number(((spins3PlusSpec / numSpins) * 100).toFixed(3)),
    symbolFrequenciesPct,
    patternFrequencies: {
      HORIZONTAL_3: Number(((patCounts.HORIZONTAL_3 / numSpins) * 100).toFixed(2)),
      HORIZONTAL_4: Number(((patCounts.HORIZONTAL_4 / numSpins) * 100).toFixed(2)),
      HORIZONTAL_5: Number(((patCounts.HORIZONTAL_5 / numSpins) * 100).toFixed(3)),
      VERTICAL_3: Number(((patCounts.VERTICAL_3 / numSpins) * 100).toFixed(2)),
      DIAGONAL_3: Number(((patCounts.DIAGONAL_3 / numSpins) * 100).toFixed(2)),
      X: Number(((patCounts.X / numSpins) * 100).toFixed(3)),
      TRIANGULO: Number(((patCounts.TRIANGULO / numSpins) * 100).toFixed(4)),
      TRIANGULO_INVERTIDO: Number(((patCounts.TRIANGULO_INVERTIDO / numSpins) * 100).toFixed(4)),
    },
    estimatedSpinsToQuota1,
    bankruptcyRateQuota1Pct: Number(((q1Bankrupt / numRuns) * 100).toFixed(1)),
    quota1SuccessRatePct: Number(((q1Success / numRuns) * 100).toFixed(1)),
    quota2SuccessRatePct: Number(((q2Success / numRuns) * 100).toFixed(1)),
    quota3SuccessRatePct: Number(((q3Success / numRuns) * 100).toFixed(1)),
  };
}

// ============================================================================
// SHOP SAFETY & ANTI-SOFTLOCK VALIDATION (SECTIONS 34–38)
// ============================================================================

export function getMinimumPlayableSpinCost(
  upgrades?: Record<FortunariumUpgradeId, number>,
  _activeModifiers: FortunariumActiveModifier[] = []
): number {
  if (upgrades) {
    return calculateMinimumSpinCost(upgrades);
  }
  return FORTUNARIUM_BET_MODES.normal.baseSpinCost;
}

export interface WorkshopPurchaseValidation {
  allowed: boolean;
  reason?: string;
  code?:
    | 'INSUFFICIENT_CREDITS'
    | 'MAX_LEVEL'
    | 'NO_SLOTS'
    | 'SPIN_RESERVE_REQUIRED';
  minSpinReserve: number;
  remainingCredits: number;
}

export function validateWorkshopPurchase(params: {
  currentMoney: number;
  cost?: number;
  costMoney?: number;
  quotaTarget?: number;
  quota?: number;
  upgrades?: Record<FortunariumUpgradeId, number>;
  activeModifiers?: FortunariumActiveModifier[];
  isMaxLevel?: boolean;
  requiresNewSlot?: boolean;
  usedSlots?: number;
  maxSlots?: number;
}): WorkshopPurchaseValidation {
  const {
    currentMoney,
    upgrades,
    activeModifiers = [],
    isMaxLevel = false,
    requiresNewSlot = false,
    usedSlots = 0,
    maxSlots = 4,
  } = params;
  const rawCost = params.cost ?? params.costMoney ?? 0;
  const effectiveCost = Number(rawCost);
  const safeCurrentMoney = Number(currentMoney);
  const rawQuotaTarget = params.quotaTarget ?? params.quota ?? Infinity;
  const effectiveQuotaTarget = Number.isFinite(Number(rawQuotaTarget))
    ? Number(rawQuotaTarget)
    : Infinity;

  const minSpinReserve = getMinimumPlayableSpinCost(upgrades, activeModifiers);

  if (!Number.isFinite(effectiveCost) || effectiveCost <= 0 || !Number.isFinite(safeCurrentMoney)) {
    return {
      allowed: false,
      code: 'INSUFFICIENT_CREDITS',
      reason: 'COSTE NO DISPONIBLE (— CR)',
      minSpinReserve,
      remainingCredits: Number.isFinite(safeCurrentMoney) ? safeCurrentMoney : 0,
    };
  }

  const remainingCredits = safeCurrentMoney - effectiveCost;

  if (isMaxLevel) {
    return {
      allowed: false,
      code: 'MAX_LEVEL',
      reason: 'NIVEL MÁXIMO ALCANZADO',
      minSpinReserve,
      remainingCredits,
    };
  }

  if (requiresNewSlot && usedSlots >= maxSlots) {
    return {
      allowed: false,
      code: 'NO_SLOTS',
      reason: 'RANURAS COMPLETAS (AMPLÍA CHASIS)',
      minSpinReserve,
      remainingCredits,
    };
  }

  if (currentMoney < effectiveCost) {
    return {
      allowed: false,
      code: 'INSUFFICIENT_CREDITS',
      reason: `CRÉDITOS INSUFICIENTES (${effectiveCost} CR)`,
      minSpinReserve,
      remainingCredits,
    };
  }

  // Anti-softlock rule (Section 35):
  // Purchase must leave at least `minSpinReserve` credits UNLESS the remaining credits
  // are already enough to immediately seal the current quota without another spin.
  const canAlreadySealAfterPurchase = remainingCredits >= effectiveQuotaTarget;
  if (remainingCredits < minSpinReserve && !canAlreadySealAfterPurchase) {
    return {
      allowed: false,
      code: 'SPIN_RESERVE_REQUIRED',
      reason: `RESERVA ${minSpinReserve} CR PARA GIRAR`,
      minSpinReserve,
      remainingCredits,
    };
  }

  return {
    allowed: true,
    minSpinReserve,
    remainingCredits,
  };
}

// ============================================================================
// AUTOMATED CANONICAL PATTERN ENGINE TEST SUITE (SECTION 61)
// ============================================================================

export interface PatternUnitTestResult {
  id: string;
  name: string;
  passed: boolean;
  details: string;
}

export function runCanonicalPatternUnitTests(): {
  allPassed: boolean;
  passedCount: number;
  totalCount: number;
  results: PatternUnitTestResult[];
} {
  const emptyUpgrades: Record<FortunariumUpgradeId, number> = {
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

  // Helper to build a 5-col × 3-row grid from a 3-row × 5-col visual matrix
  const buildGridFromRows = (
    rows: [
      [FortunariumSymbolId, FortunariumSymbolId, FortunariumSymbolId, FortunariumSymbolId, FortunariumSymbolId],
      [FortunariumSymbolId, FortunariumSymbolId, FortunariumSymbolId, FortunariumSymbolId, FortunariumSymbolId],
      [FortunariumSymbolId, FortunariumSymbolId, FortunariumSymbolId, FortunariumSymbolId, FortunariumSymbolId]
    ]
  ): FortunariumSymbolId[][] => {
    const grid: FortunariumSymbolId[][] = [[], [], [], [], []];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 5; c++) {
        grid[c][r] = rows[r][c];
      }
    }
    return grid;
  };

  const evalBoard = (
    rows: [
      [FortunariumSymbolId, FortunariumSymbolId, FortunariumSymbolId, FortunariumSymbolId, FortunariumSymbolId],
      [FortunariumSymbolId, FortunariumSymbolId, FortunariumSymbolId, FortunariumSymbolId, FortunariumSymbolId],
      [FortunariumSymbolId, FortunariumSymbolId, FortunariumSymbolId, FortunariumSymbolId, FortunariumSymbolId]
    ]
  ) =>
    evaluateSpinGridCore({
      grid: buildGridFromRows(rows),
      betMode: 'normal',
      upgrades: emptyUpgrades,
      currentVoltage: 1.0,
      round: 1,
      allowMysteryEvents: false,
      enableJackpotRoll: false,
    });

  const results: PatternUnitTestResult[] = [];

  // Test 1: Horizontal 3 at start of row 0
  {
    const r = evalBoard([
      ['cereza', 'cereza', 'cereza', 'limon', 'uvas'],
      ['naranja', 'campana', 'siete', 'corona', 'trebol'],
      ['herradura', 'limon', 'naranja', 'uvas', 'campana'],
    ]);
    const ok =
      r.winLines.length === 1 &&
      r.winLines[0].patternType === 'HORIZONTAL' &&
      r.winLines[0].count === 3 &&
      r.winLines[0].symbolId === 'cereza';
    results.push({
      id: 'T1',
      name: 'Horizontal ×3 (Inicio Fila 0)',
      passed: ok,
      details: `${r.winLines.map((w) => `${w.name}:${w.symbolId}`).join(', ') || 'Ninguno'}`,
    });
  }

  // Test 2: Horizontal 3 in middle of row 1
  {
    const r = evalBoard([
      ['naranja', 'campana', 'siete', 'corona', 'trebol'],
      ['limon', 'campana', 'campana', 'campana', 'uvas'],
      ['herradura', 'limon', 'naranja', 'uvas', 'cereza'],
    ]);
    const ok =
      r.winLines.length === 1 &&
      r.winLines[0].patternType === 'HORIZONTAL' &&
      r.winLines[0].count === 3 &&
      r.winLines[0].symbolId === 'campana';
    results.push({
      id: 'T2',
      name: 'Horizontal ×3 (Centro Fila 1)',
      passed: ok,
      details: `${r.winLines.map((w) => `${w.name}:${w.symbolId}`).join(', ')}`,
    });
  }

  // Test 3: Horizontal 3 at end of row 2
  {
    const r = evalBoard([
      ['naranja', 'campana', 'siete', 'corona', 'trebol'],
      ['herradura', 'limon', 'naranja', 'uvas', 'cereza'],
      ['limon', 'uvas', 'siete', 'siete', 'siete'],
    ]);
    const ok =
      r.winLines.length === 1 &&
      r.winLines[0].patternType === 'HORIZONTAL' &&
      r.winLines[0].count === 3 &&
      r.winLines[0].symbolId === 'siete';
    results.push({
      id: 'T3',
      name: 'Horizontal ×3 (Final Fila 2)',
      passed: ok,
      details: `${r.winLines.map((w) => `${w.name}:${w.symbolId}`).join(', ')}`,
    });
  }

  // Test 4: Horizontal 4 (must NOT also trigger Horizontal 3 sub-patterns)
  {
    const r = evalBoard([
      ['uvas', 'uvas', 'uvas', 'uvas', 'limon'],
      ['naranja', 'campana', 'siete', 'corona', 'trebol'],
      ['herradura', 'limon', 'naranja', 'cereza', 'campana'],
    ]);
    const ok =
      r.winLines.length === 1 &&
      r.winLines[0].patternType === 'HORIZONTAL' &&
      r.winLines[0].count === 4 &&
      r.winLines[0].symbolId === 'uvas';
    results.push({
      id: 'T4',
      name: 'Horizontal ×4 sin sub-patrones ×3 duplicados',
      passed: ok,
      details: `Patrones=${r.winLines.length} (${r.winLines.map((w) => w.name).join(', ')})`,
    });
  }

  // Test 5: Horizontal 5 (must NOT trigger Horizontal 4 or 3 sub-patterns)
  {
    const r = evalBoard([
      ['corona', 'corona', 'corona', 'corona', 'corona'],
      ['naranja', 'campana', 'siete', 'limon', 'trebol'],
      ['herradura', 'limon', 'naranja', 'cereza', 'campana'],
    ]);
    const ok =
      r.winLines.length === 1 &&
      r.winLines[0].patternType === 'HORIZONTAL' &&
      r.winLines[0].count === 5 &&
      r.winLines[0].symbolId === 'corona';
    results.push({
      id: 'T5',
      name: 'Horizontal ×5 sin sub-patrones ×4/×3',
      passed: ok,
      details: `Patrones=${r.winLines.length} (${r.winLines.map((w) => w.name).join(', ')})`,
    });
  }

  // Test 6: Non-contiguous 3 symbols in a row (MUST NOT match)
  {
    const r = evalBoard([
      ['cereza', 'cereza', 'limon', 'cereza', 'uvas'],
      ['naranja', 'campana', 'siete', 'corona', 'trebol'],
      ['herradura', 'limon', 'naranja', 'uvas', 'campana'],
    ]);
    const ok = r.winLines.length === 0;
    results.push({
      id: 'T6',
      name: 'Símbolos no contiguos en fila NO forman patrón',
      passed: ok,
      details: `Patrones=${r.winLines.length}`,
    });
  }

  // Test 7: Vertical 3 in each column (tested on col 0 and col 4 simultaneously)
  {
    const r = evalBoard([
      ['herradura', 'campana', 'siete', 'corona', 'trebol'],
      ['herradura', 'limon', 'naranja', 'uvas', 'trebol'],
      ['herradura', 'uvas', 'cereza', 'limon', 'trebol'],
    ]);
    const ok =
      r.winLines.length === 2 &&
      r.winLines.every((w) => w.patternType === 'VERTICAL' && w.count === 3);
    results.push({
      id: 'T7',
      name: 'Vertical ×3 en columnas independientes',
      passed: ok,
      details: `${r.winLines.map((w) => `${w.name}:${w.symbolId}`).join(', ')}`,
    });
  }

  // Test 8: Down-right diagonal (↘) starting at col 1
  {
    const r = evalBoard([
      ['limon', 'diamante', 'siete', 'corona', 'trebol'],
      ['naranja', 'campana', 'diamante', 'uvas', 'cereza'],
      ['herradura', 'uvas', 'cereza', 'diamante', 'campana'],
    ]);
    const ok =
      r.winLines.length === 1 &&
      r.winLines[0].patternType === 'DIAGONAL' &&
      r.winLines[0].symbolId === 'diamante';
    results.push({
      id: 'T8',
      name: 'Diagonal ↘ (3 celdas continuas)',
      passed: ok,
      details: `${r.winLines.map((w) => `${w.name}:${w.symbolId}`).join(', ')}`,
    });
  }

  // Test 9: Down-left / Up-right diagonal (↙)
  {
    const r = evalBoard([
      ['limon', 'campana', 'siete', 'corona', 'estrella'],
      ['naranja', 'uvas', 'siete', 'estrella', 'cereza'],
      ['herradura', 'uvas', 'estrella', 'limon', 'campana'],
    ]);
    const ok =
      r.winLines.length === 1 &&
      r.winLines[0].patternType === 'DIAGONAL' &&
      r.winLines[0].symbolId === 'estrella';
    results.push({
      id: 'T9',
      name: 'Diagonal ↙ (3 celdas continuas)',
      passed: ok,
      details: `${r.winLines.map((w) => `${w.name}:${w.symbolId}`).join(', ')}`,
    });
  }

  // Test 10: Upright Triangle (8-cell canonical mask)
  {
    const r = evalBoard([
      ['limon', 'naranja', 'campana', 'uvas', 'cereza'],
      ['siete', 'campana', 'uvas', 'campana', 'trebol'],
      ['campana', 'campana', 'campana', 'campana', 'campana'],
    ]);
    const hasTri = r.winLines.some(
      (w) => w.patternType === 'TRIANGULO' && w.symbolId === 'campana' && w.count === 8
    );
    results.push({
      id: 'T10',
      name: 'Triángulo Canónico (8 celdas)',
      passed: hasTri,
      details: `${r.winLines.map((w) => `${w.name}(${w.count})`).join(', ')}`,
    });
  }

  // Test 11: Inverted Triangle (8-cell canonical mask)
  {
    const r = evalBoard([
      ['siete', 'siete', 'siete', 'siete', 'siete'],
      ['limon', 'siete', 'uvas', 'siete', 'trebol'],
      ['naranja', 'cereza', 'siete', 'corona', 'herradura'],
    ]);
    const hasInvTri = r.winLines.some(
      (w) =>
        w.patternType === 'TRIANGULO_INVERTIDO' &&
        w.symbolId === 'siete' &&
        w.count === 8
    );
    results.push({
      id: 'T11',
      name: 'Triángulo Invertido Canónico (8 celdas)',
      passed: hasInvTri,
      details: `${r.winLines.map((w) => `${w.name}(${w.count})`).join(', ')}`,
    });
  }

  // Test 12: Wild substitution in Horizontal & Vertical simultaneously
  {
    const r = evalBoard([
      ['cereza', 'comodin', 'cereza', 'limon', 'uvas'],
      ['naranja', 'campana', 'siete', 'corona', 'trebol'],
      ['herradura', 'campana', 'naranja', 'uvas', 'cereza'],
    ]);
    const hasHoriz = r.winLines.some(
      (w) => w.patternType === 'HORIZONTAL' && w.symbolId === 'cereza'
    );
    const hasVert = r.winLines.some(
      (w) => w.patternType === 'VERTICAL' && w.symbolId === 'campana'
    );
    results.push({
      id: 'T12',
      name: 'Comodín sustituye en Horizontal y Vertical distintos',
      passed: hasHoriz && hasVert && r.winLines.length === 2,
      details: `${r.winLines.map((w) => `${w.name}:${w.symbolId}`).join(', ')}`,
    });
  }

  // Test 13: Non-pattern specials (bomba, llave, moneda) NEVER form line patterns
  {
    const r = evalBoard([
      ['moneda', 'moneda', 'moneda', 'limon', 'uvas'],
      ['bomba', 'bomba', 'bomba', 'corona', 'trebol'],
      ['llave', 'llave', 'llave', 'uvas', 'campana'],
    ]);
    const ok = r.winLines.length === 0 && r.specialEffects.length > 0;
    results.push({
      id: 'T13',
      name: 'Especiales (Moneda/Bomba/Llave) no crean líneas de patrón',
      passed: ok,
      details: `Líneas=${r.winLines.length}, EfectosEspeciales=${r.specialEffects.length}`,
    });
  }

  // Test 14: Combined patterns in one spin (Horizontal + Vertical + Diagonal)
  {
    const r = evalBoard([
      ['uvas', 'uvas', 'uvas', 'limon', 'cereza'],
      ['uvas', 'campana', 'uvas', 'corona', 'trebol'],
      ['uvas', 'naranja', 'siete', 'uvas', 'herradura'],
    ]);
    const types = new Set(r.winLines.map((w) => w.patternType));
    const ok =
      types.has('HORIZONTAL') &&
      types.has('VERTICAL') &&
      types.has('DIAGONAL') &&
      r.winLines.length === 3;
    results.push({
      id: 'T14',
      name: 'Múltiples patrones simultáneos (H + V + D)',
      passed: ok,
      details: `${r.winLines.map((w) => w.name).join(' + ')}`,
    });
  }

  // Test 15: Shop Safety Anti-Softlock validation
  {
    const blockedCheck = validateWorkshopPurchase({
      currentMoney: 60,
      cost: 55,
      quotaTarget: 220,
      upgrades: emptyUpgrades,
      activeModifiers: [],
    });
    const allowedCheck = validateWorkshopPurchase({
      currentMoney: 65,
      cost: 55,
      quotaTarget: 220,
      upgrades: emptyUpgrades,
      activeModifiers: [],
    });
    const ok = !blockedCheck.allowed && allowedCheck.allowed;
    results.push({
      id: 'T15',
      name: 'Bloqueo de compra que dejaría < 10 CR para girar',
      passed: ok,
      details: `60-55=5CR (${blockedCheck.allowed ? 'FALLO' : 'BLOQUEADO'}), 65-55=10CR (${allowedCheck.allowed ? 'PERMITIDO' : 'FALLO'})`,
    });
  }

  // Test 16: Canonical Bet Modes & Spin Cost Regression Check
  {
    const normalCost = calculateEffectiveSpinCost('normal', emptyUpgrades);
    const dobleCost = calculateEffectiveSpinCost('doble', emptyUpgrades);
    const sobrecargaCost = calculateEffectiveSpinCost('sobrecarga', emptyUpgrades);
    const minPlayable = getMinimumPlayableSpinCost(emptyUpgrades, []);
    const ok =
      normalCost === FORTUNARIUM_BET_MODES.normal.baseSpinCost &&
      dobleCost === FORTUNARIUM_BET_MODES.doble.baseSpinCost &&
      sobrecargaCost === FORTUNARIUM_BET_MODES.sobrecarga.baseSpinCost &&
      minPlayable === normalCost &&
      normalCost > 0;
    results.push({
      id: 'T16',
      name: 'Resolución canónica de apuestas (normal/doble/sobrecarga)',
      passed: ok,
      details: `normal=${normalCost}CR, doble=${dobleCost}CR, sobrecarga=${sobrecargaCost}CR, min=${minPlayable}CR`,
    });
  }

  // Test 17: Partial Triangle (7 of 8 cells match) MUST NOT trigger Triangle or partial highlight
  {
    const r = evalBoard([
      ['limon', 'naranja', 'campana', 'uvas', 'cereza'],
      ['siete', 'campana', 'uvas', 'campana', 'trebol'],
      ['campana', 'campana', 'campana', 'campana', 'limon'],
    ]);
    const hasTri = r.winLines.some((w) => w.patternType === 'TRIANGULO');
    const ok = !hasTri;
    results.push({
      id: 'T17',
      name: 'Triángulo incompleto (7/8 celdas) NO activa Triángulo',
      passed: ok,
      details: `Triángulo=${hasTri ? 'FALLO' : 'NO'}, Líneas=${r.winLines.map((w) => w.name).join(', ')}`,
    });
  }

  // Test 18: 2-in-a-row pairs & scattered duplicates produce ZERO winningCells
  {
    const r = evalBoard([
      ['cereza', 'cereza', 'limon', 'naranja', 'naranja'],
      ['uvas', 'campana', 'campana', 'trebol', 'cereza'],
      ['limon', 'uvas', 'siete', 'siete', 'corona'],
    ]);
    const ok = r.winLines.length === 0 && r.winningCells.length === 0;
    results.push({
      id: 'T18',
      name: 'Parejas (2 seguidos) producen 0 patrones y 0 celdas amarillas',
      passed: ok,
      details: `Líneas=${r.winLines.length}, CeldasGanadoras=${r.winningCells.length}`,
    });
  }

  // Test 19: winningCells strictly equals union of validated winLines coordinates (no special symbol bleed)
  {
    const r = evalBoard([
      ['moneda', 'limon', 'naranja', 'rayo', 'llave'],
      ['uvas', 'campana', 'trebol', 'siete', 'corona'],
      ['herradura', 'estrella', 'diamante', 'cereza', 'limon'],
    ]);
    const ok = r.winLines.length === 0 && r.winningCells.length === 0 && r.specialEffects.length === 3;
    results.push({
      id: 'T19',
      name: 'Símbolos especiales sueltos NO ensucian winningCells de patrones',
      passed: ok,
      details: `WinningCells=${r.winningCells.length}, Efectos=${r.specialEffects.length}`,
    });
  }

  // Test 20: Canonical X Pattern (5 cells: 4 corners + center) & partial X rejection
  {
    const validX = evalBoard([
      ['cereza', 'limon', 'naranja', 'ciruela', 'cereza'],
      ['uvas', 'trebol', 'cereza', 'campana', 'herradura'],
      ['cereza', 'estrella', 'diamante', 'corona', 'cereza'],
    ]);
    const partialX = evalBoard([
      ['cereza', 'limon', 'naranja', 'ciruela', 'cereza'],
      ['uvas', 'trebol', 'cereza', 'campana', 'herradura'],
      ['cereza', 'estrella', 'diamante', 'corona', 'limon'],
    ]);
    const ok =
      validX.winLines.length === 1 &&
      validX.winLines[0].patternType === 'X' &&
      validX.winLines[0].count === 5 &&
      validX.winLines[0].symbolId === 'cereza' &&
      partialX.winLines.length === 0 &&
      partialX.winningCells.length === 0;
    results.push({
      id: 'T20',
      name: 'Patrón X canónico (5 celdas) y rechazo de X incompleta (4/5)',
      passed: ok,
      details: `ValidX=${validX.winLines.map((w) => w.name).join(',')}, PartialX=${partialX.winLines.length}`,
    });
  }

  // Test 21: Pattern Overlap (center cell shared across Horizontal + Vertical + X)
  {
    const r = evalBoard([
      ['campana', 'limon', 'campana', 'naranja', 'campana'],
      ['cereza', 'uvas', 'campana', 'campana', 'campana'],
      ['campana', 'ciruela', 'campana', 'herradura', 'limon'],
    ]);
    // wait: let's make r2c4 = 'campana' and r1c4 = 'trebol', and r1c0,r1c1,r1c2 = 'campana' with r0c0='comodin' so col 0 isn't vertical
    const overlapBoard = evalBoard([
      ['campana', 'limon', 'campana', 'naranja', 'campana'],
      ['campana', 'campana', 'campana', 'uvas', 'trebol'],
      ['campana', 'ciruela', 'campana', 'herradura', 'campana'],
    ]);
    const types = new Set(overlapBoard.winLines.map((w) => w.patternType));
    const centerSharedCount = overlapBoard.winLines.filter((w) =>
      w.cells.some((c) => c.col === 2 && c.row === 1)
    ).length;
    const ok =
      types.has('HORIZONTAL') &&
      types.has('VERTICAL') &&
      types.has('X') &&
      centerSharedCount >= 3;
    results.push({
      id: 'T21',
      name: 'Solapamiento de celda central en Horizontal + Vertical + X',
      passed: ok,
      details: `CompartidosEnCentro=${centerSharedCount} (${overlapBoard.winLines.map((w) => w.name).join(' + ')})`,
    });
  }

  // Test 22: Server-authoritative Jackpot Buffs (0.10% base -> 0.25% Fortuna Desatada -> 0.50% Siete de la Suerte, <= 1.0% cap)
  {
    const base = computeEffectiveJackpotChance(emptyUpgrades, 'normal', []);
    const withFortuna = computeEffectiveJackpotChance(emptyUpgrades, 'normal', [
      { modifierId: 'fortuna_desatada' },
    ]);
    const withSiete = computeEffectiveJackpotChance(emptyUpgrades, 'normal', [
      { modifierId: 'siete_suerte' },
    ]);
    const maxStacked = computeEffectiveJackpotChance(
      { ...emptyUpgrades, siete_dorado: 3 },
      'sobrecarga',
      [{ modifierId: 'siete_suerte' }]
    );
    const ok =
      base === BASE_JACKPOT_CHANCE &&
      withFortuna === 0.0025 &&
      withSiete === 0.005 &&
      maxStacked <= MAX_JACKPOT_CHANCE;
    results.push({
      id: 'T22',
      name: 'Buffs de Jackpot (0,10% base / 0,25% / 0,50% / tope 1,00%)',
      passed: ok,
      details: `base=${(base * 100).toFixed(2)}%, fortuna=${(withFortuna * 100).toFixed(2)}%, mono=${(withSiete * 100).toFixed(2)}%, cap=${(maxStacked * 100).toFixed(2)}%`,
    });
  }

  // Test 23: Canonical Full Grid Jackpot (15 matching cells)
  {
    const fullGrid = evalBoard([
      ['siete', 'siete', 'siete', 'siete', 'siete'],
      ['siete', 'siete', 'siete', 'siete', 'siete'],
      ['siete', 'siete', 'siete', 'siete', 'siete'],
    ]);
    const hasFull = fullGrid.winLines.some((w) => w.patternType === 'PANTALLA_COMPLETA');
    const ok = hasFull && fullGrid.isJackpot && fullGrid.winningCells.length === 15;
    results.push({
      id: 'T23',
      name: 'Pantalla Completa / Jackpot canónico (15 casillas idénticas)',
      passed: ok,
      details: `Jackpot=${fullGrid.isJackpot}, Líneas=${fullGrid.winLines.length}, Celdas=${fullGrid.winningCells.length}`,
    });
  }

  const passedCount = results.filter((t) => t.passed).length;
  return {
    allPassed: passedCount === results.length,
    passedCount,
    totalCount: results.length,
    results,
  };
}

