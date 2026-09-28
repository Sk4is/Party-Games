import {
  FortunariumSymbolId,
  FortunariumUpgradeId,
  FortunariumBetMode,
  FortunariumWinLine,
  FortunariumSpecialEffectLog,
  FortunariumCellCoord,
} from '../types/fortunarium';
import {
  FORTUNARIUM_SYMBOLS,
  FORTUNARIUM_PATTERNS_CATALOG,
  FORTUNARIUM_BET_MODES,
  computeEffectiveSymbolWeights,
  calculateEffectiveSpinCost,
  createInitialUpgradesState,
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
  betMode: FortunariumBetMode
): FortunariumSymbolId[][] {
  const weights = computeEffectiveSymbolWeights(upgrades, betMode);
  const totalWeight = weights.reduce((acc, item) => acc + item.weight, 0);

  const grid: FortunariumSymbolId[][] = [[], [], [], [], []];
  for (let col = 0; col < 5; col++) {
    for (let row = 0; row < 3; row++) {
      grid[col][row] = pickWeightedSymbol(weights, totalWeight);
    }
  }
  return grid;
}

export interface EvaluatedSpinCore {
  winLines: FortunariumWinLine[];
  specialEffects: FortunariumSpecialEffectLog[];
  winningCells: FortunariumCellCoord[];
  hazardCells: FortunariumCellCoord[];
  grossPayout: number;
  penalties: number;
  integrityDelta: number;
  voltageMultiplierUsed: number;
  voltageMultiplierAfter: number;
  keysGained: number;
  extraSpinsGained: number;
  shouldTriggerMysteryEvent: boolean;
  isJackpot: boolean;
}

export function evaluateSpinGridCore(params: {
  grid: FortunariumSymbolId[][];
  betMode: FortunariumBetMode;
  upgrades: Record<FortunariumUpgradeId, number>;
  currentVoltage: number;
  round: number;
  allowMysteryEvents?: boolean;
}): EvaluatedSpinCore {
  const { grid, betMode, upgrades, round, allowMysteryEvents = true } = params;
  const betConfig = FORTUNARIUM_BET_MODES[betMode];
  const rawWinLines: FortunariumWinLine[] = [];
  const specialEffects: FortunariumSpecialEffectLog[] = [];
  const winningCellSet = new Set<string>();
  const hazardCellSet = new Set<string>();

  const markWinCells = (cells: FortunariumCellCoord[]) => {
    for (const c of cells) winningCellSet.add(`${c.col},${c.row}`);
  };
  const markHazardCells = (cells: FortunariumCellCoord[]) => {
    for (const c of cells) hazardCellSet.add(`${c.col},${c.row}`);
  };

  // 1. Collect coordinates by symbol
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

  for (let col = 0; col < 5; col++) {
    for (let row = 0; row < 3; row++) {
      coordsBySymbol[grid[col][row]].push({ col, row });
    }
  }

  // 2. Process RAYO (Lightning) first so it boosts voltage for this spin
  let activeVoltage = params.currentVoltage;
  const rayoCoords = coordsBySymbol.rayo;
  let extraSpinsGained = 0;
  if (rayoCoords.length > 0) {
    const perRayo = 0.25 + (upgrades.cableado_ilegal || 0) * 0.15;
    const deltaV = Number((rayoCoords.length * perRayo).toFixed(2));
    activeVoltage = Number((activeVoltage + deltaV).toFixed(2));
    markWinCells(rayoCoords);

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

  // Helper to compute symbol upgrade payout multiplier
  const getSymbolUpgradeMult = (symId: FortunariumSymbolId, count: number): number => {
    let m = 1.0;
    if ((symId === 'cereza' || symId === 'ciruela') && (upgrades.cosecha_roja || 0) > 0) {
      m += upgrades.cosecha_roja * 0.3;
    }
    if ((symId === 'limon' || symId === 'naranja') && (upgrades.huerto_citrico || 0) > 0) {
      m += upgrades.huerto_citrico * 0.2;
    }
    if (
      (symId === 'campana' || symId === 'herradura') &&
      count >= 4 &&
      (upgrades.campana_bronce || 0) > 0
    ) {
      m += upgrades.campana_bronce * 0.4;
    }
    if ((symId === 'siete' || symId === 'corona') && (upgrades.siete_dorado || 0) > 0) {
      m += upgrades.siete_dorado * 0.45;
    }
    if ((symId === 'uvas' || symId === 'trebol') && (upgrades.prensa_uvas || 0) > 0) {
      m += upgrades.prensa_uvas * 0.3;
    }
    return m;
  };

  // 3. Evaluate all 8 canonical 5-reel patterns (any contiguous 3, 4, or 5 match along the pattern)
  for (const pat of FORTUNARIUM_PATTERNS_CATALOG) {
    const lineSymbols = pat.cells.map((c) => grid[c.col][c.row]);

    let bestRunCoords: FortunariumCellCoord[] = [];
    let bestTargetSymbol: FortunariumSymbolId | null = null;
    let bestWildCount = 0;

    for (let startIdx = 0; startIdx <= 2; startIdx++) {
      let targetSym: FortunariumSymbolId | null = null;
      const runCoords: FortunariumCellCoord[] = [];
      let wilds = 0;

      for (let i = startIdx; i < 5; i++) {
        const sym = lineSymbols[i];
        const meta = FORTUNARIUM_SYMBOLS[sym];
        if (sym === 'comodin') {
          runCoords.push(pat.cells[i]);
          wilds++;
        } else if (meta.category === 'normal') {
          if (!targetSym) {
            targetSym = sym;
            runCoords.push(pat.cells[i]);
          } else if (targetSym === sym) {
            runCoords.push(pat.cells[i]);
          } else {
            break;
          }
        } else {
          break;
        }
      }

      if (runCoords.length >= 3 && runCoords.length > bestRunCoords.length) {
        bestRunCoords = runCoords;
        bestTargetSymbol = targetSym || 'comodin';
        bestWildCount = wilds;
      }
    }

    if (bestRunCoords.length >= 3 && bestTargetSymbol) {
      const symMeta = FORTUNARIUM_SYMBOLS[bestTargetSymbol];
      const count = bestRunCoords.length;
      const baseVal =
        count === 5
          ? symMeta.basePayout5
          : count === 4
          ? symMeta.basePayout4
          : symMeta.basePayout3;

      let patMult = pat.baseMultiplier;
      if (pat.patternType !== 'HORIZONTAL' && (upgrades.geometra || 0) > 0) {
        patMult = Number((patMult * (1 + upgrades.geometra * 0.25)).toFixed(2));
      }

      const symUpMult = getSymbolUpgradeMult(bestTargetSymbol, count);
      const wildBonus = 1 + bestWildCount * 0.15;
      const payout = Math.max(
        1,
        Math.round(baseVal * patMult * symUpMult * wildBonus * totalBetAndVoltageMult)
      );

      rawWinLines.push({
        id: `win_${pat.id}_${count}`,
        name: `${pat.name} (${count}× ${symMeta.name})`,
        patternType: pat.patternType,
        patternMultiplier: patMult,
        symbolId: bestTargetSymbol,
        count,
        payout,
        cells: bestRunCoords,
      });
    }
  }

  // 4. Evaluate Vertical Column Triples (3 matching normal/wild in the same vertical column)
  for (let col = 0; col < 5; col++) {
    const colCells: FortunariumCellCoord[] = [
      { col, row: 0 },
      { col, row: 1 },
      { col, row: 2 },
    ];
    const colSyms = colCells.map((c) => grid[c.col][c.row]);
    if (
      colSyms.every(
        (s) => FORTUNARIUM_SYMBOLS[s].category === 'normal' || s === 'comodin'
      )
    ) {
      const normals = colSyms.filter((s) => s !== 'comodin');
      if (normals.length === 0 || normals.every((n) => n === normals[0])) {
        const targetSym = normals[0] || 'comodin';
        const wilds = 3 - normals.length;
        const symMeta = FORTUNARIUM_SYMBOLS[targetSym];
        const symUpMult = getSymbolUpgradeMult(targetSym, 3);
        const wildBonus = 1 + wilds * 0.15;
        const payout = Math.max(
          1,
          Math.round(symMeta.basePayout3 * symUpMult * wildBonus * totalBetAndVoltageMult)
        );
        rawWinLines.push({
          id: `win_col_${col + 1}`,
          name: `Columna ${col + 1} (${symMeta.name})`,
          patternType: 'HORIZONTAL',
          patternMultiplier: 1.0,
          symbolId: targetSym,
          count: 3,
          payout,
          cells: colCells,
        });
      }
    }
  }

  // 5. Deduplicate any patterns that cover the exact same set of cells (keep highest payout)
  // Also prevent a 3-cell sub-segment from duplicating a 4/5-cell match that completely contains its cells
  const sortedCandidates = [...rawWinLines].sort((a, b) => b.payout - a.payout);
  const winLines: FortunariumWinLine[] = [];

  for (const cand of sortedCandidates) {
    const candCellKeys = cand.cells.map((c) => `${c.col},${c.row}`);
    const isSubsetOfExistingSameSymbol = winLines.some(
      (existing) =>
        existing.symbolId === cand.symbolId &&
        candCellKeys.every((k) =>
          existing.cells.some((ec) => `${ec.col},${ec.row}` === k)
        )
    );
    if (!isSubsetOfExistingSameSymbol) {
      winLines.push(cand);
      markWinCells(cand.cells);
    }
  }

  let grossPayout = winLines.reduce((acc, w) => acc + w.payout, 0);
  let penalties = 0;
  const illegalWiringWear = upgrades.cableado_ilegal || 0;
  let integrityDelta = -(betConfig.integrityWear + illegalWiringWear);
  let keysGained = 0;

  // Herradura line bonus: +3% integrity
  if (winLines.some((w) => w.symbolId === 'herradura')) {
    integrityDelta += 3;
  }

  // 6. Process MONEDA (Direct cash)
  const monedaCoords = coordsBySymbol.moneda;
  if (monedaCoords.length > 0) {
    const perCoinBase = 18 + (upgrades.prensa_uvas || 0) * 8;
    const coinPayout = Math.round(
      monedaCoords.length * perCoinBase * totalBetAndVoltageMult
    );
    grossPayout += coinPayout;
    markWinCells(monedaCoords);

    specialEffects.push({
      id: `fx_moneda_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      symbolId: 'moneda',
      title: `Moneda Directa (${monedaCoords.length}×)`,
      description: `Ingreso directo de +${coinPayout} CR.`,
      moneyDelta: coinPayout,
      integrityDelta: 0,
      voltageDelta: 0,
      keysDelta: 0,
      variant: monedaCoords.length >= 2 ? 'jackpot' : 'positive',
      cells: monedaCoords,
    });
  }

  // 7. Process LLAVE & BOMBA
  const llaveCoords = coordsBySymbol.llave;
  const bombaCoords = coordsBySymbol.bomba;
  const availableDefusers = llaveCoords.length + (upgrades.artificiero || 0);

  if (llaveCoords.length > 0) {
    const repPerKey = 8 + (upgrades.mecanico_jefe || 0) * 4;
    const rep = llaveCoords.length * repPerKey;
    integrityDelta += rep;
    keysGained += llaveCoords.length;
    markWinCells(llaveCoords);

    specialEffects.push({
      id: `fx_llave_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      symbolId: 'llave',
      title: `Llave de Taller (${llaveCoords.length}×)`,
      description: `Repara +${rep}% de Integridad y suma +${llaveCoords.length} Llave(s).`,
      moneyDelta: 0,
      integrityDelta: rep,
      voltageDelta: 0,
      keysDelta: llaveCoords.length,
      variant: 'positive',
      cells: llaveCoords,
    });
  }

  if (bombaCoords.length > 0) {
    const defusedCount = Math.min(bombaCoords.length, availableDefusers);
    const explodedCount = bombaCoords.length - defusedCount;

    if (defusedCount > 0) {
      const defuseCash = Math.round(
        defusedCount * 30 * betConfig.payoutMultiplier
      );
      grossPayout += defuseCash;
      markWinCells(bombaCoords.slice(0, defusedCount));

      specialEffects.push({
        id: `fx_bomba_defused_${Date.now()}`,
        symbolId: 'bomba',
        title: `Bomba Neutralizada (${defusedCount}×)`,
        description: `Neutralizada por Llave/Artificiero (+${defuseCash} CR).`,
        moneyDelta: defuseCash,
        integrityDelta: 0,
        voltageDelta: 0,
        keysDelta: 0,
        variant: 'positive',
        cells: bombaCoords.slice(0, defusedCount),
      });
    }

    if (explodedCount > 0) {
      const totalBombDmg = explodedCount * 14;
      const bombMoneyLoss = explodedCount * (15 + (round - 1) * 3);
      integrityDelta -= totalBombDmg;
      penalties += bombMoneyLoss;
      markHazardCells(bombaCoords.slice(defusedCount));

      specialEffects.push({
        id: `fx_bomba_boom_${Date.now()}`,
        symbolId: 'bomba',
        title: `¡Explosión! (${explodedCount}× Bomba)`,
        description: `Causa -${totalBombDmg}% de Integridad y -${bombMoneyLoss} CR.`,
        moneyDelta: -bombMoneyLoss,
        integrityDelta: -totalBombDmg,
        voltageDelta: 0,
        keysDelta: 0,
        variant: 'negative',
        cells: bombaCoords.slice(defusedCount),
      });
    }
  }

  // 8. Process CALAVERA & TREBOL
  const calaveraCoords = coordsBySymbol.calavera;
  const trebolCoords = coordsBySymbol.trebol;
  if (calaveraCoords.length > 0) {
    const blockedCount = Math.min(calaveraCoords.length, trebolCoords.length);
    const activeSkulls = calaveraCoords.length - blockedCount;

    if (blockedCount > 0) {
      const cloverBonus = blockedCount * 8;
      grossPayout += cloverBonus;
      markWinCells(calaveraCoords.slice(0, blockedCount));

      specialEffects.push({
        id: `fx_skull_blocked_${Date.now()}`,
        symbolId: 'calavera',
        title: `Calavera Bloqueada por Trébol (${blockedCount}×)`,
        description: `El Trébol anuló la maldición (+${cloverBonus} CR).`,
        moneyDelta: cloverBonus,
        integrityDelta: 0,
        voltageDelta: 0,
        keysDelta: 0,
        variant: 'positive',
        cells: calaveraCoords.slice(0, blockedCount),
      });
    }

    if (activeSkulls > 0) {
      const skullDmg = activeSkulls * 7;
      const skullDrain = activeSkulls * 12;
      integrityDelta -= skullDmg;
      penalties += skullDrain;
      markHazardCells(calaveraCoords.slice(blockedCount));

      specialEffects.push({
        id: `fx_skull_drain_${Date.now()}`,
        symbolId: 'calavera',
        title: `Maldición de Calavera (${activeSkulls}×)`,
        description: `Drena -${skullDrain} CR y -${skullDmg}% de Integridad.`,
        moneyDelta: -skullDrain,
        integrityDelta: -skullDmg,
        voltageDelta: 0,
        keysDelta: 0,
        variant: 'negative',
        cells: calaveraCoords.slice(blockedCount),
      });
    }
  }

  // 9. Process INTERROGACION
  const mysteryCoords = coordsBySymbol.interrogacion;
  let shouldTriggerMysteryEvent = false;
  if (mysteryCoords.length > 0) {
    markWinCells(mysteryCoords);
    if (allowMysteryEvents && Math.random() < 0.45) {
      shouldTriggerMysteryEvent = true;
      const instantCash = mysteryCoords.length * 15;
      grossPayout += instantCash;
      specialEffects.push({
        id: `fx_mystery_evt_${Date.now()}`,
        symbolId: 'interrogacion',
        title: `¡Dilema del Fortunarium!`,
        description: `Otorga +${instantCash} CR y abre un evento de decisión.`,
        moneyDelta: instantCash,
        integrityDelta: 0,
        voltageDelta: 0,
        keysDelta: 0,
        variant: 'jackpot',
        cells: mysteryCoords,
      });
    } else {
      const mysteryCash = Math.round(
        mysteryCoords.length * 25 * betConfig.payoutMultiplier
      );
      grossPayout += mysteryCash;
      specialEffects.push({
        id: `fx_mystery_bonus_${Date.now()}`,
        symbolId: 'interrogacion',
        title: `Premio Misterioso (${mysteryCoords.length}× ?)`,
        description: `Revela +${mysteryCash} CR.`,
        moneyDelta: mysteryCash,
        integrityDelta: 0,
        voltageDelta: 0,
        keysDelta: 0,
        variant: 'positive',
        cells: mysteryCoords,
      });
    }
  }

  // Voltage decay after spin
  const retention = Math.min(0.75, 0.35 + (upgrades.cableado_ilegal || 0) * 0.15);
  const excessVoltage = Math.max(0, activeVoltage - 1);
  const voltageMultiplierAfter =
    rayoCoords.length > 0
      ? activeVoltage
      : Number((1 + excessVoltage * retention).toFixed(2));

  const isJackpot =
    grossPayout >= 180 ||
    winLines.some((w) => w.symbolId === 'siete' || (w.symbolId === 'corona' && w.count >= 4));

  const parseCoords = (set: Set<string>): FortunariumCellCoord[] =>
    Array.from(set).map((str) => {
      const [c, r] = str.split(',').map(Number);
      return { col: c, row: r };
    });

  return {
    winLines,
    specialEffects,
    winningCells: parseCoords(winningCellSet),
    hazardCells: parseCoords(hazardCellSet),
    grossPayout,
    penalties,
    integrityDelta,
    voltageMultiplierUsed: activeVoltage,
    voltageMultiplierAfter,
    keysGained,
    extraSpinsGained,
    shouldTriggerMysteryEvent,
    isJackpot,
  };
}

// ============================================================================
// DEVELOPMENT PROBABILITY & TELEMETRY SIMULATOR (10,000 - 100,000 SPINS)
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
  averageSpecialsPerSpin: number;
  spinsWith1SpecialPct: number;
  spinsWith2SpecialsPct: number;
  spinsWith3PlusSpecialsPct: number;
  symbolFrequenciesPct: Record<FortunariumSymbolId, number>;
  estimatedSpinsToQuota1: number;
}

export function runFortunariumSimulation(
  numSpins = 100000,
  betMode: FortunariumBetMode = 'normal',
  upgrades: Record<FortunariumUpgradeId, number> = createInitialUpgradesState()
): FortunariumSimulationReport {
  const spinCost = calculateEffectiveSpinCost(betMode, upgrades);
  let totalCost = 0;
  let totalGross = 0;
  let totalNet = 0;
  let zeroWins = 0;
  let patternHits = 0;
  let totalSpecials = 0;
  let spins1Spec = 0;
  let spins2Spec = 0;
  let spins3PlusSpec = 0;

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
    });

    voltage = res.voltageMultiplierAfter;
    const netPayout = Math.max(0, res.grossPayout - res.penalties);
    totalCost += spinCost;
    totalGross += res.grossPayout;
    totalNet += netPayout;

    if (res.grossPayout === 0) zeroWins++;
    if (res.winLines.length > 0) patternHits++;
    if (i < 10000) samplePayouts.push(netPayout);
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
  const quota1Target = 95;
  const estimatedSpinsToQuota1 =
    avgGross > 0 ? Number((quota1Target / avgGross).toFixed(1)) : 99;

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
    averageSpecialsPerSpin: Number((totalSpecials / numSpins).toFixed(3)),
    spinsWith1SpecialPct: Number(((spins1Spec / numSpins) * 100).toFixed(2)),
    spinsWith2SpecialsPct: Number(((spins2Spec / numSpins) * 100).toFixed(2)),
    spinsWith3PlusSpecialsPct: Number(((spins3PlusSpec / numSpins) * 100).toFixed(3)),
    symbolFrequenciesPct,
    estimatedSpinsToQuota1,
  };
}
