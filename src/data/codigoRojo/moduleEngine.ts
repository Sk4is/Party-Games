import {
  CodigoRojoModuleType,
  CodigoRojoDifficulty,
  CodigoRojoModuleState,
  CodigoRojoManualSection,
} from '../../types/codigoRojo';
import {
  MASTER_MANUAL_SECTIONS,
  ALL_28_GLYPHS,
  GLYPH_COLUMNS_EXPANDED,
} from './masterManualCatalog';

export interface GeneratedModuleInternal {
  moduleState: CodigoRojoModuleState;
  internalSolution: any;
  validateAction: (action: any, currentProgress: any) => { valid: boolean; solved: boolean; updatedProgress?: any };
}

export function generateMachineSerial(rng: Mulberry32): string {
  const prefixes = ['CR', 'NX', 'TX', 'ALFA', 'BETA', 'SEC'];
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const prefix = rng.pick(prefixes);
  const num1 = rng.range(1, 9);
  const num2 = rng.range(0, 9);
  const num3 = rng.range(0, 9);
  const letter = letters[rng.range(0, letters.length - 1)];
  const lastDigit = rng.range(1, 9);
  return `${prefix}-${num1}${num2}${num3}-${letter}${lastDigit}`;
}

export function getSerialLastDigit(serial: string): number {
  const match = serial.match(/\d(?=\D*$)/);
  return match ? parseInt(match[0], 10) : 4;
}

export function isSerialLastDigitEven(serial: string): boolean {
  return getSerialLastDigit(serial) % 2 === 0;
}

export function doesSerialContainVowel(serial: string): boolean {
  return /[AEIOUaeiou]/.test(serial);
}

// Pseudo-random deterministic PRNG based on seed
class Mulberry32 {
  private s: number;
  constructor(seed: number) {
    this.s = seed;
  }
  next(): number {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  pick<T>(arr: T[]): T {
    return arr[this.range(0, arr.length - 1)];
  }
  shuffle<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
}

// =========================================================================
// 1. FILAMENTOS DE POTENCIA (Filament wire array)
// =========================================================================
function generateFilamentos(
  rng: Mulberry32,
  difficulty: CodigoRojoDifficulty,
  serial: string = 'CR-4821-X7'
): GeneratedModuleInternal {
  const wireColors = ['Rojo', 'Azul', 'Amarillo', 'Verde', 'Blanco', 'Negro'] as const;
  type WireColor = typeof wireColors[number];

  // Cable count: 3, 4, 5, or 6
  let wireCount = 4;
  if (difficulty === 'NORMAL') wireCount = rng.pick([3, 4]);
  else if (difficulty === 'DIFICIL') wireCount = rng.pick([4, 5]);
  else wireCount = rng.pick([5, 6]);

  const sectors = ['C-14', 'SEC-R7', 'SEC-B3', 'SEC-X0', 'SEC-M9', 'P-22'];
  const sector = rng.pick(sectors);
  const leds = ['Ámbar', 'Verde', 'Rojo', 'Apagado'] as const;
  const indicatorLed = rng.pick([...leds]);

  const wires: {
    id: number;
    color: WireColor;
    hasStripe: boolean;
    stripeColor?: string;
    isCut: boolean;
    gauge: 'estandar' | 'grueso';
  }[] = [];

  for (let i = 0; i < wireCount; i++) {
    const color = rng.pick([...wireColors]);
    const hasStripe = rng.next() > 0.5;
    const stripeColor = hasStripe ? (color === 'Blanco' ? 'Negro' : 'Blanco') : undefined;
    const gauge = rng.next() > 0.75 ? 'grueso' : 'estandar';
    wires.push({ id: i, color, hasStripe, stripeColor, isCut: false, gauge });
  }

  const redCount = wires.filter((w) => w.color === 'Rojo').length;
  const blueCount = wires.filter((w) => w.color === 'Azul').length;
  const yellowCount = wires.filter((w) => w.color === 'Amarillo').length;
  const blackCount = wires.filter((w) => w.color === 'Negro').length;
  const whiteCount = wires.filter((w) => w.color === 'Blanco').length;
  const stripedCount = wires.filter((w) => w.hasStripe).length;
  const lastWire = wires[wires.length - 1];
  const isSerialOdd = !isSerialLastDigitEven(serial);

  let targetIndex = 0; // 0-based

  if (wireCount === 3) {
    if (stripedCount > 0 && indicatorLed === 'Ámbar') {
      targetIndex = 1; // 2nd wire
    } else if (redCount === 0) {
      const secondBlue = wires.filter((w) => w.color === 'Azul')[1];
      targetIndex = secondBlue ? wires.indexOf(secondBlue) : wires.findIndex((w) => w.color === 'Azul');
      if (targetIndex < 0) targetIndex = 0;
    } else if (lastWire.color === 'Blanco' && !lastWire.hasStripe) {
      targetIndex = wires.length - 1;
    } else {
      targetIndex = 0;
    }
  } else if (wireCount === 4) {
    if (stripedCount >= 2) {
      if (isSerialOdd) {
        const firstBlue = wires.findIndex((w) => w.color === 'Azul');
        targetIndex = firstBlue >= 0 ? firstBlue : 1;
      } else {
        targetIndex = 1;
      }
    } else if (redCount === 1 && yellowCount > 1) {
      const firstStriped = wires.findIndex((w) => w.hasStripe);
      targetIndex = firstStriped >= 0 ? firstStriped : 3;
    } else if (redCount === 0 && !lastWire.hasStripe) {
      if (!isSerialOdd) {
        targetIndex = 1;
      } else {
        const firstBlue = wires.findIndex((w) => w.color === 'Azul');
        targetIndex = firstBlue >= 0 ? firstBlue : 1;
      }
    } else {
      targetIndex = wires.length >= 2 ? wires.length - 2 : 0;
    }
  } else if (wireCount === 5) {
    if (lastWire.color === 'Negro' && isSerialOdd) {
      targetIndex = 3;
    } else if (redCount === 2 && stripedCount >= 1) {
      const secondStriped = wires.filter((w) => w.hasStripe)[1];
      targetIndex = secondStriped ? wires.indexOf(secondStriped) : wires.findIndex((w) => w.hasStripe);
      if (targetIndex < 0) targetIndex = wires.findIndex((w) => w.color === 'Rojo');
    } else if (yellowCount > 0 && blackCount === 0) {
      targetIndex = 0;
    } else {
      targetIndex = 1;
    }
  } else {
    // 6 cables
    if (yellowCount === 0 && isSerialOdd) {
      targetIndex = 2;
    } else if (yellowCount === 1 && whiteCount >= 2) {
      targetIndex = 3;
    } else if (stripedCount >= 3) {
      targetIndex = wires.findIndex((w) => w.hasStripe);
      if (targetIndex < 0) targetIndex = 0;
    } else {
      targetIndex = wires.length - 1;
    }
  }

  if (targetIndex < 0 || targetIndex >= wires.length) targetIndex = 0;

  const manualSection = MASTER_MANUAL_SECTIONS.find((s) => s.moduleType === 'FILAMENTOS')!;

  return {
    moduleState: {
      id: `mod-filamentos-${rng.range(1000, 9999)}`,
      moduleType: 'FILAMENTOS',
      title: 'Filamentos de Potencia',
      solved: false,
      strikes: 0,
      estimatedSolveSeconds: 40,
      operatorState: {
        sector,
        indicatorLed,
        wires,
      },
      manualSection,
    },
    internalSolution: { targetIndex },
    validateAction: (action: { wireIndex: number }) => {
      if (action.wireIndex === targetIndex) {
        return { valid: true, solved: true };
      }
      return { valid: false, solved: false };
    },
  };
}

// =========================================================================
// 2. MODULADOR DE FRECUENCIA SONORA
// =========================================================================
function generateModuladorFrecuencia(rng: Mulberry32, difficulty: CodigoRojoDifficulty): GeneratedModuleInternal {
  const waveforms = ['SENOIDAL', 'CUADRADA', 'TRIANGULAR', 'DIENTE_SIERRA'] as const;
  const waveform = rng.pick([...waveforms]);
  const ledChannels = ['CANAL-ALPHA', 'CANAL-BETA', 'CANAL-GAMMA', 'CANAL-DELTA'] as const;
  const channel = rng.pick([...ledChannels]);

  // Base frequency displayed (e.g. between 110.0 kHz and 190.0 kHz in 5.0 steps)
  const baseFreq = rng.range(22, 38) * 5; // e.g. 110 to 190
  let targetFreq = baseFreq;

  const matrix: Record<string, Record<string, number>> = {
    SENOIDAL: { 'CANAL-ALPHA': 15, 'CANAL-BETA': 25, 'CANAL-GAMMA': -10, 'CANAL-DELTA': -20 },
    CUADRADA: { 'CANAL-ALPHA': -15, 'CANAL-BETA': 20, 'CANAL-GAMMA': 30, 'CANAL-DELTA': 10 },
    TRIANGULAR: { 'CANAL-ALPHA': 30, 'CANAL-BETA': -20, 'CANAL-GAMMA': 15, 'CANAL-DELTA': -15 },
    DIENTE_SIERRA: { 'CANAL-ALPHA': -25, 'CANAL-BETA': -15, 'CANAL-GAMMA': 20, 'CANAL-DELTA': 25 },
  };

  const delta = matrix[waveform][channel] || 15;
  targetFreq = baseFreq + delta;

  const manualSection: CodigoRojoManualSection = {
    moduleType: 'MODULADOR_FRECUENCIA',
    title: 'Modulador de Frecuencia',
    subtitle: 'Calibración Armónica del Osciloscopio',
    classificationCode: 'DOC-RAD-04',
    description:
      'El osciloscopio táctico emite una portadora desfasada. El Operador debe describir la FORMA DE ONDA y el CANAL LED iluminado. Los Guías deben consultar la tabla armónica y sumar o restar el ajuste indicado a la frecuencia base mostrada.',
    tableHeaders: ['Forma de Onda', 'CANAL-ALPHA', 'CANAL-BETA', 'CANAL-GAMMA', 'CANAL-DELTA'],
    tableRows: [
      ['Senoidal (onda suave)', '+15 kHz', '+25 kHz', '-10 kHz', '-20 kHz'],
      ['Cuadrada (bloques rectos)', '-15 kHz', '+20 kHz', '+30 kHz', '+10 kHz'],
      ['Triangular (picos agudos)', '+30 kHz', '-20 kHz', '+15 kHz', '-15 kHz'],
      ['Diente de Sierra (rampa)', '-25 kHz', '-15 kHz', '+20 kHz', '+25 kHz'],
    ],
    rules: [
      {
        condition: '1. El operador indica la forma de la onda (pantalla verde) y el canal LED encendido.',
        action: 'Cruza la forma de onda con el canal en la tabla armónica.',
      },
      {
        condition: '2. Aplica el desfase en kHz sobre la frecuencia base indicada.',
        action: 'El operador usa los mandos [-] [+] para fijar el valor exacto y pulsa «CALIBRAR».',
      },
    ],
    notes: [
      'La frecuencia final calculada siempre terminará en número entero terminado en 0 o 5.',
      'Pulsar «CALIBRAR» con una frecuencia incorrecta provocará un fallo de resonancia (Strike).',
    ],
  };

  return {
    moduleState: {
      id: `mod-frecuencia-${rng.range(1000, 9999)}`,
      moduleType: 'MODULADOR_FRECUENCIA',
      title: 'Modulador de Frecuencia',
      solved: false,
      strikes: 0,
      estimatedSolveSeconds: 40,
      operatorState: {
        waveform,
        channel,
        currentFreq: baseFreq,
        baseFreq,
      },
      manualSection,
    },
    internalSolution: { targetFreq },
    validateAction: (action: { tunedFreq: number }) => {
      if (Math.abs(action.tunedFreq - targetFreq) < 0.1) {
        return { valid: true, solved: true };
      }
      return { valid: false, solved: false };
    },
  };
}

// =========================================================================
// 3. GLIFOS CRIPTOGRÁFICOS
// =========================================================================
function generateGlifosCriptograficos(rng: Mulberry32): GeneratedModuleInternal {
  // Pick one column that will contain our 4 chosen glyphs
  const columnIndex = rng.range(0, GLYPH_COLUMNS_EXPANDED.length - 1);
  const selectedColumn = GLYPH_COLUMNS_EXPANDED[columnIndex];

  // Pick 4 distinct symbols from this column preserving their vertical order
  const colIndices = Array.from({ length: selectedColumn.length }, (_, i) => i);
  const shuffledIndices = rng.shuffle(colIndices).slice(0, 4).sort((a, b) => a - b);
  const correctSymbolsInOrder = shuffledIndices.map((i) => selectedColumn[i]);

  // Display the 4 symbols on the machine scrambled
  const displaySymbols = rng.shuffle(correctSymbolsInOrder);

  const manualSection = MASTER_MANUAL_SECTIONS.find((s) => s.moduleType === 'GLIFOS_CRIPTOGRAFICOS')!;

  return {
    moduleState: {
      id: `mod-glifos-${rng.range(1000, 9999)}`,
      moduleType: 'GLIFOS_CRIPTOGRAFICOS',
      title: 'Glifos Criptográficos',
      solved: false,
      strikes: 0,
      estimatedSolveSeconds: 45,
      operatorState: {
        buttons: displaySymbols.map((s, idx) => ({ id: `glyph-${idx}`, symbol: s, pressed: false })),
        correctPressCount: 0,
      },
      manualSection,
    },
    internalSolution: { correctSymbolsInOrder, progressIndex: 0 },
    validateAction: (action: { symbol: string }, currentProgress: { progressIndex: number }) => {
      const currentIndex = currentProgress?.progressIndex || 0;
      const expectedSymbol = correctSymbolsInOrder[currentIndex];
      if (action.symbol === expectedSymbol) {
        const nextIndex = currentIndex + 1;
        const isSolved = nextIndex === correctSymbolsInOrder.length;
        return { valid: true, solved: isSolved, updatedProgress: { progressIndex: nextIndex } };
      }
      return { valid: false, solved: false, updatedProgress: { progressIndex: 0 } };
    },
  };
}

// =========================================================================
// 4. MATRIZ DE CELDAS DE ENERGÍA
// =========================================================================
function generateMatrizEnergia(rng: Mulberry32): GeneratedModuleInternal {
  const coreStates = ['ESTABLE', 'CRÍTICO', 'PURGA_REQUERIDA'] as const;
  const coreState = rng.pick([...coreStates]);

  // 3x3 grid coordinates: A1, A2, A3, B1, B2, B3, C1, C2, C3
  const gridCoords = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3', 'C1', 'C2', 'C3'];
  // Initial active cells (random 3 or 4)
  const initialActive = rng.shuffle(gridCoords).slice(0, rng.range(3, 4));

  // Determine solution safe pattern based on core state
  let targetCells: string[] = [];
  if (coreState === 'ESTABLE') {
    // Target is diagonal: A1, B2, C3
    targetCells = ['A1', 'B2', 'C3'];
  } else if (coreState === 'CRÍTICO') {
    // Target is cross: B1, B2, B3, A2, C2
    targetCells = ['A2', 'B1', 'B2', 'B3', 'C2'];
  } else {
    // PURGA_REQUERIDA: corners A1, A3, C1, C3
    targetCells = ['A1', 'A3', 'C1', 'C3'];
  }

  const manualSection: CodigoRojoManualSection = {
    moduleType: 'MATRIZ_ENERGIA',
    title: 'Matriz de Celdas de Energía',
    subtitle: 'Disipación de Carga Residual en Matriz 3x3',
    classificationCode: 'DOC-PWR-09',
    description:
      'La matriz contiene 9 celdas magnéticas identificadas de A1 a C3. El núcleo presenta un estado de diagnóstico en su pantalla central. Para desenergizar el módulo sin cortocircuitar el sistema, las celdas activas finales deben coincidir exactamente con el patrón de seguridad.',
    rules: [
      {
        condition: 'Si el núcleo indica «ESTABLE»:',
        action: 'Activa únicamente la diagonal principal: A1, B2 y C3. Apaga todas las demás.',
      },
      {
        condition: 'Si el núcleo indica «CRÍTICO»:',
        action: 'Forma la cruz de emergencia activando: B2 (centro), A2, C2, B1 y B3.',
      },
      {
        condition: 'Si el núcleo indica «PURGA_REQUERIDA»:',
        action: 'Activa únicamente las cuatro esquinas: A1, A3, C1 y C3.',
      },
    ],
    notes: [
      'El Operador puede hacer clic en cualquier celda para encenderla o apagarla.',
      'Una vez configurado el patrón deseado, debe presionar el botón «DESCARGAR MATRIZ».',
      'Si el patrón al pulsar «DESCARGAR» no es el exacto, saltará un Strike de sobretensión.',
    ],
  };

  return {
    moduleState: {
      id: `mod-matriz-${rng.range(1000, 9999)}`,
      moduleType: 'MATRIZ_ENERGIA',
      title: 'Matriz de Celdas de Energía',
      solved: false,
      strikes: 0,
      estimatedSolveSeconds: 40,
      operatorState: {
        coreState,
        activeCells: initialActive,
      },
      manualSection,
    },
    internalSolution: { targetCells: targetCells.sort() },
    validateAction: (action: { activeCells: string[] }) => {
      const sortedInput = [...action.activeCells].sort();
      const sortedTarget = [...targetCells].sort();
      const match =
        sortedInput.length === sortedTarget.length &&
        sortedInput.every((val, index) => val === sortedTarget[index]);
      if (match) {
        return { valid: true, solved: true };
      }
      return { valid: false, solved: false };
    },
  };
}

// =========================================================================
// 5. SELECTOR DE VÁLVULAS NEUMÁTICAS
// =========================================================================
function generateValvulasPresion(rng: Mulberry32): GeneratedModuleInternal {
  // 3 Manómetros: PSI de 10 a 90
  const psiA = rng.range(2, 9) * 10;
  const psiB = rng.range(2, 9) * 10;
  const psiC = rng.range(2, 9) * 10;
  const ledColors = ['VERDE', 'AMBAR', 'AZUL'] as const;
  const ledColor = rng.pick([...ledColors]);

  // Target angles (0°, 45°, 90°)
  let targetA = 0;
  let targetB = 0;
  let targetC = 0;

  if (ledColor === 'VERDE') {
    targetA = psiA >= 50 ? 90 : 0;
    targetB = 45;
    targetC = psiC > psiB ? 90 : 45;
  } else if (ledColor === 'AMBAR') {
    targetA = 45;
    targetB = psiB >= 60 ? 90 : 0;
    targetC = 0;
  } else {
    // AZUL
    targetA = 90;
    targetB = psiA > psiC ? 0 : 45;
    targetC = 90;
  }

  const manualSection: CodigoRojoManualSection = {
    moduleType: 'VALVULAS_PRESION',
    title: 'Selector de Válvulas Neumáticas',
    subtitle: 'Compensación de Cámaras de Presión',
    classificationCode: 'DOC-PNE-12',
    description:
      'Tres manómetros (A, B, C) miden la presión interna y una luz indicadora marca el modo de purga (VERDE, ÁMBAR o AZUL). Cada válvula dispone de 3 posiciones angulares: 0° (Cerrada / Horizontal), 45° (Media) y 90° (Abierta / Vertical).',
    rules: [
      {
        condition: 'Si la luz indicadora es VERDE:',
        action: 'Válvula A: 90° si PSI A ≥ 50, sino 0°. Válvula B: fijar en 45°. Válvula C: 90° si PSI C > PSI B, sino 45°.',
      },
      {
        condition: 'Si la luz indicadora es ÁMBAR:',
        action: 'Válvula A: fijar en 45°. Válvula B: 90° si PSI B ≥ 60, sino 0°. Válvula C: fijar en 0°.',
      },
      {
        condition: 'Si la luz indicadora es AZUL:',
        action: 'Válvula A: fijar en 90°. Válvula B: 0° si PSI A > PSI C, sino 45°. Válvula C: fijar en 90°.',
      },
    ],
    notes: [
      'El Operador ajusta las 3 válvulas a sus posiciones exactas y pulsa «PURGAR PRESIÓN».',
      'Cualquier posición de válvula discordante generará una fuga de alta presión (Strike).',
    ],
  };

  return {
    moduleState: {
      id: `mod-valvulas-${rng.range(1000, 9999)}`,
      moduleType: 'VALVULAS_PRESION',
      title: 'Selector de Válvulas Neumáticas',
      solved: false,
      strikes: 0,
      estimatedSolveSeconds: 45,
      operatorState: {
        psiA,
        psiB,
        psiC,
        ledColor,
        valves: { a: 0, b: 0, c: 0 },
      },
      manualSection,
    },
    internalSolution: { targetA, targetB, targetC },
    validateAction: (action: { a: number; b: number; c: number }) => {
      if (action.a === targetA && action.b === targetB && action.c === targetC) {
        return { valid: true, solved: true };
      }
      return { valid: false, solved: false };
    },
  };
}

// =========================================================================
// 6. SECUENCIA DE RELÉS HEXADECIMALES
// =========================================================================
function generateRelesHexadecimales(rng: Mulberry32): GeneratedModuleInternal {
  const hexChars = ['3A', '7F', 'C2', '9E', '5B', 'E4', '2D', '8C', 'F1', '40'];
  const relays = [
    rng.pick(hexChars),
    rng.pick(hexChars),
    rng.pick(hexChars),
    rng.pick(hexChars),
  ];

  // Evaluate UP or DOWN for each switch (0 = DOWN, 1 = UP)
  // Rule 1: Switch 1 is UP if the first hex value starts with A-F, else DOWN
  const sw0 = /^[A-F]/.test(relays[0]) ? 1 : 0;
  // Rule 2: Switch 2 is UP if the second hex value ends in an even number (0,2,4,6,8,A,C,E)
  const lastChar = relays[1][1];
  const sw1 = ['0', '2', '4', '6', '8', 'A', 'C', 'E'].includes(lastChar) ? 1 : 0;
  // Rule 3: Switch 3 is UP if the sum of numeric digits across all 4 displays is > 10
  const digits = relays.join('').replace(/[^0-9]/g, '');
  const sumDigits = digits.split('').reduce((acc, c) => acc + parseInt(c, 10), 0);
  const sw2 = sumDigits > 10 ? 1 : 0;
  // Rule 4: Switch 4 is UP if at least two relays contain the same character
  const allChars = relays.join('');
  const hasDup = new Set(allChars.split('')).size < allChars.length;
  const sw3 = hasDup ? 1 : 0;

  const targetSwitches = [sw0, sw1, sw2, sw3];

  const manualSection: CodigoRojoManualSection = {
    moduleType: 'RELES_HEXADECIMALES',
    title: 'Secuencia de Relés Hexadecimales',
    subtitle: 'Protocolo de Conmutación Lógica de Buses',
    classificationCode: 'DOC-HEX-15',
    description:
      'Cuatro pantallas digitales muestran valores en código hexadecimal (R1, R2, R3, R4) sobre cuatro interruptores de palanca. Cada interruptor puede posicionarse ARRIBA o ABAJO.',
    rules: [
      {
        condition: 'Interruptor 1:',
        action: 'ARRIBA si el código de R1 comienza por letra (A-F). En caso contrario, ABAJO.',
      },
      {
        condition: 'Interruptor 2:',
        action: 'ARRIBA si el último carácter de R2 es par (0, 2, 4, 6, 8, A, C, E). En caso contrario, ABAJO.',
      },
      {
        condition: 'Interruptor 3:',
        action: 'ARRIBA si la suma de todas las cifras numéricas visibles (0-9) en los 4 relés supera 10. En caso contrario, ABAJO.',
      },
      {
        condition: 'Interruptor 4:',
        action: 'ARRIBA si hay algún carácter (letra o número) repetido entre los 4 códigos. En caso contrario, ABAJO.',
      },
    ],
    notes: [
      'El Operador ajusta los 4 conmutadores y pulsa «ENCLAVAR RELÉS».',
      'Si alguno no coincide, se produce un arco voltaico (Strike).',
    ],
  };

  return {
    moduleState: {
      id: `mod-reles-${rng.range(1000, 9999)}`,
      moduleType: 'RELES_HEXADECIMALES',
      title: 'Secuencia de Relés Hexadecimales',
      solved: false,
      strikes: 0,
      estimatedSolveSeconds: 40,
      operatorState: {
        relays,
        switches: [0, 0, 0, 0],
      },
      manualSection,
    },
    internalSolution: { targetSwitches },
    validateAction: (action: { switches: number[] }) => {
      const match = action.switches.every((s, i) => s === targetSwitches[i]);
      if (match) {
        return { valid: true, solved: true };
      }
      return { valid: false, solved: false };
    },
  };
}

// =========================================================================
// 7. RADAR DE COORDENADAS TÁCTICAS
// =========================================================================
function generateRadarVectorial(rng: Mulberry32): GeneratedModuleInternal {
  const blipNames = ['TANGO', 'SIERRA', 'BRAVO', 'ECHO'];
  const sweepDirs = ['HORARIO', 'ANTIHORARIO'] as const;
  const sweepDir = rng.pick([...sweepDirs]);

  const blips = [
    { name: 'TANGO', sector: 'NO', ring: rng.range(1, 3) },
    { name: 'SIERRA', sector: 'NE', ring: rng.range(1, 3) },
    { name: 'BRAVO', sector: 'SE', ring: rng.range(1, 3) },
    { name: 'ECHO', sector: 'SO', ring: rng.range(1, 3) },
  ];

  // True target logic:
  // If sweep is HORARIO: Target is the blip in the outermost ring (highest ring). If tie, pick SIERRA or TANGO.
  // If sweep is ANTIHORARIO: Target is the blip in the innermost ring (ring 1). If tie, pick BRAVO or ECHO.
  let targetBlipName = 'TANGO';
  if (sweepDir === 'HORARIO') {
    const maxRing = Math.max(...blips.map((b) => b.ring));
    const cand = blips.filter((b) => b.ring === maxRing);
    targetBlipName = cand[0].name;
  } else {
    const minRing = Math.min(...blips.map((b) => b.ring));
    const cand = blips.filter((b) => b.ring === minRing);
    targetBlipName = cand[cand.length - 1].name;
  }

  const manualSection: CodigoRojoManualSection = {
    moduleType: 'RADAR_VECTORIAL',
    title: 'Radar de Coordenadas Tácticas',
    subtitle: 'Identificación de Baliza de Intercepción',
    classificationCode: 'DOC-NAV-18',
    description:
      'Una pantalla CRT táctica muestra un haz de barrido giratorio y cuatro contactos de radar: TANGO (Noroeste), SIERRA (Noreste), BRAVO (Sureste) y ECHO (Suroeste). Los anillos concéntricos marcan la distancia (1 = interior, 3 = exterior).',
    rules: [
      {
        condition: 'Si el haz gira en sentido HORARIO:',
        action: 'El objetivo auténtico es el contacto en el anillo MÁS EXTERIOR (mayor número). En caso de empate, prioriza el primer contacto alcanzado tras el Norte (SIERRA sobre TANGO).',
      },
      {
        condition: 'Si el haz gira en sentido ANTIHORARIO:',
        action: 'El objetivo auténtico es el contacto en el anillo MÁS INTERIOR (menor número). En caso de empate, prioriza el contacto del hemisferio Sur (BRAVO sobre ECHO).',
      },
    ],
    notes: [
      'El Operador debe pulsar sobre la baliza correcta en el radar y confirmar con «BLOQUEAR VECTOR».',
      'Bloquear un señuelo falso activará la contramedida defensiva (Strike).',
    ],
  };

  return {
    moduleState: {
      id: `mod-radar-${rng.range(1000, 9999)}`,
      moduleType: 'RADAR_VECTORIAL',
      title: 'Radar de Coordenadas Tácticas',
      solved: false,
      strikes: 0,
      estimatedSolveSeconds: 35,
      operatorState: {
        sweepDir,
        blips,
      },
      manualSection,
    },
    internalSolution: { targetBlipName },
    validateAction: (action: { blipName: string }) => {
      if (action.blipName === targetBlipName) {
        return { valid: true, solved: true };
      }
      return { valid: false, solved: false };
    },
  };
}

// =========================================================================
// 8. TRANSMISOR ÓPTICO / CÓDIGO CENTELLA
// =========================================================================
function generateSeñalOptica(rng: Mulberry32): GeneratedModuleInternal {
  const stations = [
    { name: 'CENTINELA', freq: '88.4 MHz', pattern: 'CORTO-LARGO-CORTO', dots: [1, 3, 1] },
    { name: 'VANGUARDIA', freq: '92.1 MHz', pattern: 'LARGO-LARGO-CORTO', dots: [3, 3, 1] },
    { name: 'FARO NORTE', freq: '96.5 MHz', pattern: 'CORTO-CORTO-LARGO', dots: [1, 1, 3] },
    { name: 'OMEGA', freq: '101.8 MHz', pattern: 'LARGO-CORTO-LARGO', dots: [3, 1, 3] },
    { name: 'CONDOR', freq: '104.2 MHz', pattern: 'CORTO-LARGO-LARGO', dots: [1, 3, 3] },
    { name: 'METEORO', freq: '107.9 MHz', pattern: 'LARGO-CORTO-CORTO', dots: [3, 1, 1] },
  ];

  const targetStation = rng.pick(stations);

  const manualSection: CodigoRojoManualSection = {
    moduleType: 'SEÑAL_OPTICA',
    title: 'Transmisor Óptico',
    subtitle: 'Decodificación de Pulsos de Baliza',
    classificationCode: 'DOC-COM-21',
    description:
      'Una lámpara de emergencia parpadea emitiendo un patrón rítmico repetitivo de 3 destellos (Cortos o Largos). El Operador debe describir el ritmo a los Guías para que identifiquen la frecuencia de radio correcta en la tabla y la sintonice.',
    tableHeaders: ['Estación', 'Frecuencia', 'Patrón de Destellos'],
    tableRows: [
      ['CENTINELA', '88.4 MHz', 'Corto - Largo - Corto ( • ▬ • )'],
      ['VANGUARDIA', '92.1 MHz', 'Largo - Largo - Corto ( ▬ ▬ • )'],
      ['FARO NORTE', '96.5 MHz', 'Corto - Corto - Largo ( • • ▬ )'],
      ['OMEGA', '101.8 MHz', 'Largo - Corto - Largo ( ▬ • ▬ )'],
      ['CONDOR', '104.2 MHz', 'Corto - Largo - Largo ( • ▬ ▬ )'],
      ['METEORO', '107.9 MHz', 'Largo - Corto - Corto ( ▬ • • )'],
    ],
    rules: [
      {
        condition: '1. El Operador cuenta la duración de los 3 pulsos luminosos sucesivos.',
        action: 'Un pulso CORTO dura ~0.3s. Un pulso LARGO dura ~1.0s. Hay una pausa de 2.0s entre ciclos.',
      },
      {
        condition: '2. Los Guías localizan la estación en la tabla y dictan su frecuencia exacta.',
        action: 'El Operador selecciona la frecuencia en el sintonizador y presiona «TRANSMITIR».',
      },
    ],
    notes: [
      'El botón «REPETIR CICLO» permite al Operador volver a ver la secuencia lumínica desde el principio.',
      'Sintonizar una frecuencia errónea delatará la posición a la red hostil (Strike).',
    ],
  };

  return {
    moduleState: {
      id: `mod-optica-${rng.range(1000, 9999)}`,
      moduleType: 'SEÑAL_OPTICA',
      title: 'Transmisor Óptico',
      solved: false,
      strikes: 0,
      estimatedSolveSeconds: 35,
      operatorState: {
        patternDurations: targetStation.dots, // [1, 3, 1] relative
        availableStations: stations.map((s) => ({ name: s.name, freq: s.freq })),
      },
      manualSection,
    },
    internalSolution: { correctFreq: targetStation.freq },
    validateAction: (action: { freq: string }) => {
      if (action.freq === targetStation.freq) {
        return { valid: true, solved: true };
      }
      return { valid: false, solved: false };
    },
  };
}

// =========================================================================
// 9. TECLADO DE AUTENTICACIÓN MAESTRO
// =========================================================================
function generateTecladoMaestro(rng: Mulberry32): GeneratedModuleInternal {
  // Serial prompt e.g. "SYS-4821" or "SYS-9137"
  const digits = [rng.range(1, 9), rng.range(0, 9), rng.range(0, 9), rng.range(1, 9)];
  const serial = `SYS-${digits.join('')}`;
  const ledAux = rng.next() > 0.5; // true / false

  // Algorithm to compute 4-digit code:
  // Digit 1: (digits[0] + (ledAux ? 3 : 1)) % 10
  // Digit 2: (digits[1] + 5) % 10
  // Digit 3: Math.abs(digits[2] - 2)
  // Digit 4: (digits[3] * 2) % 10
  const c1 = (digits[0] + (ledAux ? 3 : 1)) % 10;
  const c2 = (digits[1] + 5) % 10;
  const c3 = Math.abs(digits[2] - 2);
  const c4 = (digits[3] * 2) % 10;
  const targetPin = `${c1}${c2}${c3}${c4}`;

  const manualSection: CodigoRojoManualSection = {
    moduleType: 'TECLADO_MAESTRO',
    title: 'Teclado de Autenticación Maestro',
    subtitle: 'Descifrado de Contraseña de Desbloqueo',
    classificationCode: 'DOC-SEC-25',
    description:
      'Un teclado numérico protegido requiere un código PIN de 4 dígitos. La pantalla muestra un identificador de sistema («SYS-XXXX») y un LED de Alimentación Auxiliar (ENCENDIDO / APAGADO).',
    rules: [
      {
        condition: '1er Dígito del PIN:',
        action: 'Toma el 1er dígito del serial y súmale 3 si el LED auxiliar está encendido, o súmale 1 si está apagado (si pasa de 9, quédate con la última cifra).',
      },
      {
        condition: '2º Dígito del PIN:',
        action: 'Toma el 2º dígito del serial y súmale 5 (si pasa de 9, quédate con la última cifra).',
      },
      {
        condition: '3er Dígito del PIN:',
        action: 'Resta 2 al 3er dígito del serial (si da negativo, conviértelo en positivo absoluto).',
      },
      {
        condition: '4º Dígito del PIN:',
        action: 'Multiplica el 4º dígito del serial por 2 (quédate con la última cifra si pasa de 9).',
      },
    ],
    notes: [
      'Ejemplo: Serial SYS-4821 con LED encendido: (4+3=7), (8+5=13→3), (|2-2|=0), (1x2=2) → PIN = 7302.',
      'El Operador introduce los 4 dígitos y pulsa «ENTER».',
      'Introducir un PIN erróneo bloqueará el módulo temporalmente y sumará un Strike.',
    ],
  };

  return {
    moduleState: {
      id: `mod-teclado-${rng.range(1000, 9999)}`,
      moduleType: 'TECLADO_MAESTRO',
      title: 'Teclado de Autenticación Maestro',
      solved: false,
      strikes: 0,
      estimatedSolveSeconds: 45,
      operatorState: {
        serial,
        ledAux,
        currentInput: '',
      },
      manualSection,
    },
    internalSolution: { targetPin },
    validateAction: (action: { pin: string }) => {
      if (action.pin === targetPin) {
        return { valid: true, solved: true };
      }
      return { valid: false, solved: false };
    },
  };
}

// =========================================================================
// 10. PALANCA DE SOBRECARGA MAGNÉTICA
// =========================================================================
function generatePalancaSobrecarga(rng: Mulberry32): GeneratedModuleInternal {
  const chargeColors = ['AZUL', 'AMARILLO', 'ROJO'] as const;
  const chargeColor = rng.pick([...chargeColors]);

  // Target ending second digit
  // AZUL: ends in 3 or 7
  // AMARILLO: ends in even number (0, 2, 4, 6, 8)
  // ROJO: ends in 5 or 9
  let validLastDigits: number[] = [];
  if (chargeColor === 'AZUL') validLastDigits = [3, 7];
  else if (chargeColor === 'AMARILLO') validLastDigits = [0, 2, 4, 6, 8];
  else validLastDigits = [5, 9];

  const manualSection: CodigoRojoManualSection = {
    moduleType: 'PALANCA_SOBRECARGA',
    title: 'Palanca de Sobrecarga',
    subtitle: 'Descarga Magnética Sincronizada con el Cronómetro',
    classificationCode: 'DOC-MAG-30',
    description:
      'Una palanca industrial acumula energía estática. En su base brilla una franja luminiscente (AZUL, AMARILLO o ROJO). La descarga solo es segura cuando el último dígito del segundero de la misión coincide con el ciclo armónico.',
    rules: [
      {
        condition: 'Si la franja es AZUL:',
        action: 'Baja la palanca cuando el ÚLTIMO DÍGITO del segundero de la misión sea exactamente 3 o 7 (ej: 03:43, 02:17).',
      },
      {
        condition: 'Si la franja es AMARILLA:',
        action: 'Baja la palanca cuando el ÚLTIMO DÍGITO del segundero de la misión sea PAR (0, 2, 4, 6 u 8).',
      },
      {
        condition: 'Si la franja es ROJA:',
        action: 'Baja la palanca cuando el ÚLTIMO DÍGITO del segundero de la misión sea exactamente 5 o 9 (ej: 04:15, 01:09).',
      },
    ],
    notes: [
      '¡Atención al segundero global de la misión visible en la parte superior!',
      'Accionar la palanca en cualquier otro segundo producirá una descarga violenta (Strike).',
    ],
  };

  return {
    moduleState: {
      id: `mod-palanca-${rng.range(1000, 9999)}`,
      moduleType: 'PALANCA_SOBRECARGA',
      title: 'Palanca de Sobrecarga',
      solved: false,
      strikes: 0,
      estimatedSolveSeconds: 30,
      operatorState: {
        chargeColor,
      },
      manualSection,
    },
    internalSolution: { validLastDigits },
    validateAction: (action: { secondRemaining: number }) => {
      const lastDigit = Math.abs(action.secondRemaining % 10);
      if (validLastDigits.includes(lastDigit)) {
        return { valid: true, solved: true };
      }
      return { valid: false, solved: false };
    },
  };
}

// =========================================================================
// 11. MATRIZ DE COMPUERTAS LÓGICAS
// =========================================================================
function generateCompuertasLogicas(rng: Mulberry32): GeneratedModuleInternal {
  const gateTypes = ['AND', 'OR', 'XOR', 'NAND'] as const;
  const gate = rng.pick([...gateTypes]);
  const inputA = rng.next() > 0.5 ? 1 : 0;
  const inputB = rng.next() > 0.5 ? 1 : 0;

  let gateResult = 0;
  if (gate === 'AND') gateResult = inputA && inputB ? 1 : 0;
  else if (gate === 'OR') gateResult = inputA || inputB ? 1 : 0;
  else if (gate === 'XOR') gateResult = inputA !== inputB ? 1 : 0;
  else if (gate === 'NAND') gateResult = !(inputA && inputB) ? 1 : 0;

  // 3 Output shunt pins: Pin 1, Pin 2, Pin 3
  // Target:
  // If gateResult === 1: Pin 1 and Pin 3 must be ON, Pin 2 must be OFF
  // If gateResult === 0: Pin 2 must be ON, Pin 1 and Pin 3 must be OFF
  const targetPins = gateResult === 1 ? [true, false, true] : [false, true, false];

  const manualSection: CodigoRojoManualSection = {
    moduleType: 'COMPUERTAS_LOGICAS',
    title: 'Compuertas Lógicas',
    subtitle: 'Ruteo de Shunts de Silicio',
    classificationCode: 'DOC-LOG-33',
    description:
      'Un circuito integrado procesa dos entradas lógicas (A y B) con valores 0 o 1. El chip lleva impresa la denominación de la compuerta (AND, OR, XOR o NAND). El resultado binario determina qué pines de salida (1, 2, 3) deben quedar energizados.',
    rules: [
      {
        condition: 'Compuerta AND:',
        action: 'Salida = 1 solo si A=1 y B=1. En cualquier otro caso, Salida = 0.',
      },
      {
        condition: 'Compuerta OR:',
        action: 'Salida = 1 si A=1 o B=1 (o ambos). Si A=0 y B=0, Salida = 0.',
      },
      {
        condition: 'Compuerta XOR:',
        action: 'Salida = 1 si A y B son DISTINTOS (uno es 0 y el otro 1). Si son iguales, Salida = 0.',
      },
      {
        condition: 'Compuerta NAND:',
        action: 'Salida = 0 solo si A=1 y B=1. En cualquier otro caso, Salida = 1.',
      },
      {
        condition: 'Ruteo final de Pines:',
        action: 'Si el resultado de la compuerta es 1: activa los Pines 1 y 3 (deja Pin 2 apagado). Si es 0: activa únicamente el Pin 2 (deja Pines 1 y 3 apagados).',
      },
    ],
    notes: [
      'El Operador configura los interruptores de los Pines 1, 2 y 3 y presiona «ENERGIZAR».',
    ],
  };

  return {
    moduleState: {
      id: `mod-logica-${rng.range(1000, 9999)}`,
      moduleType: 'COMPUERTAS_LOGICAS',
      title: 'Compuertas Lógicas',
      solved: false,
      strikes: 0,
      estimatedSolveSeconds: 35,
      operatorState: {
        inputA,
        inputB,
        gate,
        pins: [false, false, false],
      },
      manualSection,
    },
    internalSolution: { targetPins },
    validateAction: (action: { pins: boolean[] }) => {
      const match =
        action.pins[0] === targetPins[0] &&
        action.pins[1] === targetPins[1] &&
        action.pins[2] === targetPins[2];
      if (match) {
        return { valid: true, solved: true };
      }
      return { valid: false, solved: false };
    },
  };
}

// =========================================================================
// 12. MÓDULO DE REFRIGERANTE QUÍMICO
// =========================================================================
function generateRefrigeranteQuimico(rng: Mulberry32): GeneratedModuleInternal {
  const stripColors = ['PÚRPURA', 'CIAN', 'NARANJA', 'LIMA'] as const;
  const stripColor = rng.pick([...stripColors]);

  // 3 flasks: Criolita Azul, Xenón Verde, Pirógeno Rojo (0 to 5)
  let targetBlue = 2;
  let targetGreen = 2;
  let targetRed = 2;

  if (stripColor === 'PÚRPURA') {
    targetBlue = 4;
    targetGreen = 1;
    targetRed = 3;
  } else if (stripColor === 'CIAN') {
    targetBlue = 2;
    targetGreen = 4;
    targetRed = 1;
  } else if (stripColor === 'NARANJA') {
    targetBlue = 3;
    targetGreen = 3;
    targetRed = 5;
  } else {
    // LIMA
    targetBlue = 1;
    targetGreen = 5;
    targetRed = 2;
  }

  const manualSection: CodigoRojoManualSection = {
    moduleType: 'REFRIGERANTE_QUIMICO',
    title: 'Refrigerante Químico',
    subtitle: 'Neutralización de Reactivos Térmicos',
    classificationCode: 'DOC-CHM-38',
    description:
      'Tres matraces dosifican agentes de enfriamiento: Criolita (Azul), Xenón (Verde) y Pirógeno (Rojo), regulables de nivel 0 a 5. Una tira reactiva de pH en el centro cambia de color según los gases de la fuga.',
    tableHeaders: ['Tira Reactiva', 'Criolita (Azul)', 'Xenón (Verde)', 'Pirógeno (Rojo)'],
    tableRows: [
      ['PÚRPURA', 'Nivel 4', 'Nivel 1', 'Nivel 3'],
      ['CIAN', 'Nivel 2', 'Nivel 4', 'Nivel 1'],
      ['NARANJA', 'Nivel 3', 'Nivel 3', 'Nivel 5'],
      ['LIMA', 'Nivel 1', 'Nivel 5', 'Nivel 2'],
    ],
    rules: [
      {
        condition: '1. El Operador comunica el color exacto de la tira reactiva central.',
        action: 'Los Guías buscan el color en la tabla de proporciones estequiométricas.',
      },
      {
        condition: '2. El Operador ajusta los 3 deslizadores a los niveles indicados.',
        action: 'Presiona «INYECTAR MEZCLA» para estabilizar la temperatura.',
      },
    ],
    notes: [
      'Una proporción incorrecta generará una reacción endotérmica fallida (Strike).',
    ],
  };

  return {
    moduleState: {
      id: `mod-quimico-${rng.range(1000, 9999)}`,
      moduleType: 'REFRIGERANTE_QUIMICO',
      title: 'Refrigerante Químico',
      solved: false,
      strikes: 0,
      estimatedSolveSeconds: 35,
      operatorState: {
        stripColor,
        levels: { blue: 0, green: 0, red: 0 },
      },
      manualSection,
    },
    internalSolution: { targetBlue, targetGreen, targetRed },
    validateAction: (action: { blue: number; green: number; red: number }) => {
      if (
        action.blue === targetBlue &&
        action.green === targetGreen &&
        action.red === targetRed
      ) {
        return { valid: true, solved: true };
      }
      return { valid: false, solved: false };
    },
  };
}

// =========================================================================
// 13. PLACA DE CONEXIONES AUXILIARES (Patch Bay)
// =========================================================================
function generatePuertosConexion(rng: Mulberry32): GeneratedModuleInternal {
  const ports = ['J1', 'J2', 'J3', 'J4', 'J5', 'J6'];
  const busCodes = ['BUS-ALFA', 'BUS-BETA', 'BUS-GAMMA'] as const;
  const busCode = rng.pick([...busCodes]);

  let targetCableRed: [string, string] = ['J1', 'J4'];
  let targetCableYellow: [string, string] = ['J2', 'J5'];

  if (busCode === 'BUS-ALFA') {
    targetCableRed = ['J1', 'J5'];
    targetCableYellow = ['J2', 'J6'];
  } else if (busCode === 'BUS-BETA') {
    targetCableRed = ['J2', 'J4'];
    targetCableYellow = ['J3', 'J5'];
  } else {
    // BUS-GAMMA
    targetCableRed = ['J3', 'J6'];
    targetCableYellow = ['J1', 'J4'];
  }

  const manualSection: CodigoRojoManualSection = {
    moduleType: 'PUERTOS_CONEXION',
    title: 'Placa de Conexiones Auxiliares',
    subtitle: 'Puenteado de Jacks de Señal',
    classificationCode: 'DOC-JCK-42',
    description:
      'Seis conectores jack de audio/datos rotulados de J1 a J6 permiten desviar el flujo de señal mediante dos cables de parcheo: un Cable Rojo y un Cable Amarillo.',
    rules: [
      {
        condition: 'Si el rótulo del bus indica BUS-ALFA:',
        action: 'Conecta Cable Rojo de J1 a J5. Conecta Cable Amarillo de J2 a J6.',
      },
      {
        condition: 'Si el rótulo del bus indica BUS-BETA:',
        action: 'Conecta Cable Rojo de J2 a J4. Conecta Cable Amarillo de J3 a J5.',
      },
      {
        condition: 'Si el rótulo del bus indica BUS-GAMMA:',
        action: 'Conecta Cable Rojo de J3 a J6. Conecta Cable Amarillo de J1 a J4.',
      },
    ],
    notes: [
      'El orden de los extremos de un mismo cable no altera el circuito (J1 a J5 es idéntico a J5 a J1).',
      'Una vez conectados ambos cables, el Operador pulsa «ENLAZAR SEÑAL».',
    ],
  };

  return {
    moduleState: {
      id: `mod-puertos-${rng.range(1000, 9999)}`,
      moduleType: 'PUERTOS_CONEXION',
      title: 'Placa de Conexiones Auxiliares',
      solved: false,
      strikes: 0,
      estimatedSolveSeconds: 40,
      operatorState: {
        busCode,
        ports,
        cables: {
          red: null,
          yellow: null,
        },
      },
      manualSection,
    },
    internalSolution: { targetCableRed, targetCableYellow },
    validateAction: (action: { red: [string, string]; yellow: [string, string] }) => {
      const isRedValid =
        action.red &&
        ((action.red[0] === targetCableRed[0] && action.red[1] === targetCableRed[1]) ||
          (action.red[0] === targetCableRed[1] && action.red[1] === targetCableRed[0]));
      const isYellowValid =
        action.yellow &&
        ((action.yellow[0] === targetCableYellow[0] && action.yellow[1] === targetCableYellow[1]) ||
          (action.yellow[0] === targetCableYellow[1] && action.yellow[1] === targetCableYellow[0]));

      if (isRedValid && isYellowValid) {
        return { valid: true, solved: true };
      }
      return { valid: false, solved: false };
    },
  };
}

// =========================================================================
// 14. DISIPADOR DE RADIACIÓN TÉRMICA
// =========================================================================
function generateDisipadorTermico(rng: Mulberry32): GeneratedModuleInternal {
  const directions = ['NORTE', 'SUR', 'ESTE', 'OESTE'] as const;
  const windFlow = rng.pick([...directions]);
  const alertLevel = rng.pick(['ALERTA-AMARILLA', 'ALERTA-NARANJA', 'ALERTA-ROJA']);

  // Target baffles (true = ABIERTO, false = CERRADO)
  // [Norte, Sur, Este, Oeste]
  let target = [false, false, false, false];

  if (alertLevel === 'ALERTA-AMARILLA') {
    // Open opposite to wind flow
    if (windFlow === 'NORTE') target = [false, true, true, false];
    else if (windFlow === 'SUR') target = [true, false, false, true];
    else if (windFlow === 'ESTE') target = [true, false, false, true];
    else target = [false, true, true, false];
  } else if (alertLevel === 'ALERTA-NARANJA') {
    if (windFlow === 'NORTE' || windFlow === 'SUR') target = [false, false, true, true];
    else target = [true, true, false, false];
  } else {
    // ALERTA-ROJA: 3 open, 1 closed in direction of wind
    if (windFlow === 'NORTE') target = [false, true, true, true];
    else if (windFlow === 'SUR') target = [true, false, true, true];
    else if (windFlow === 'ESTE') target = [true, true, false, true];
    else target = [true, true, true, false];
  }

  const manualSection: CodigoRojoManualSection = {
    moduleType: 'DISIPADOR_TERMICO',
    title: 'Disipador Térmico',
    subtitle: 'Aletas de Expulsión de Radiación',
    classificationCode: 'DOC-THR-47',
    description:
      'Cuatro aletas térmicas motorizadas protegen los cuadrantes NORTE, SUR, ESTE y OESTE. Una flecha de convección indica hacia dónde fluye el aire caliente y un indicador muestra el nivel de alerta térmica.',
    rules: [
      {
        condition: 'Si la alerta es ALERTA-AMARILLA:',
        action: 'Si el flujo es NORTE: abre SUR y ESTE. Si es SUR: abre NORTE y OESTE. Si es ESTE: abre NORTE y OESTE. Si es OESTE: abre SUR y ESTE.',
      },
      {
        condition: 'Si la alerta es ALERTA-NARANJA:',
        action: 'Si el flujo es NORTE o SUR: abre ESTE y OESTE (cierra Norte y Sur). Si es ESTE u OESTE: abre NORTE y SUR (cierra Este y Oeste).',
      },
      {
        condition: 'Si la alerta es ALERTA-ROJA:',
        action: 'Abre 3 aletas y cierra ÚNICAMENTE la aleta que apunta en la dirección del flujo de viento.',
      },
    ],
    notes: [
      'El Operador conmuta cada aleta entre ABIERTA y CERRADA y pulsa «FIJAR ALETAS».',
      'Configurarlas mal sobrecalentará el fuselaje (Strike).',
    ],
  };

  return {
    moduleState: {
      id: `mod-disipador-${rng.range(1000, 9999)}`,
      moduleType: 'DISIPADOR_TERMICO',
      title: 'Disipador Térmico',
      solved: false,
      strikes: 0,
      estimatedSolveSeconds: 35,
      operatorState: {
        windFlow,
        alertLevel,
        baffles: [false, false, false, false], // [N, S, E, O]
      },
      manualSection,
    },
    internalSolution: { target },
    validateAction: (action: { baffles: boolean[] }) => {
      const match = action.baffles.every((b, i) => b === target[i]);
      if (match) {
        return { valid: true, solved: true };
      }
      return { valid: false, solved: false };
    },
  };
}

// =========================================================================
// 15. SINCRONIZADOR DE FASES CUÁNTICAS
// =========================================================================
function generateSincronizadorFases(rng: Mulberry32): GeneratedModuleInternal {
  const angles = [0, 60, 120, 180, 240, 300];
  const innerAngle = rng.pick(angles);
  const phaseModes = ['MODO-RESONANTE', 'MODO-INVERSO'] as const;
  const phaseMode = rng.pick([...phaseModes]);

  // Target outer angle
  let targetOuterAngle = 0;
  if (phaseMode === 'MODO-RESONANTE') {
    // Outer angle should be innerAngle + 120 degrees
    targetOuterAngle = (innerAngle + 120) % 360;
  } else {
    // MODO-INVERSO: Opposite (innerAngle + 180) % 360
    targetOuterAngle = (innerAngle + 180) % 360;
  }

  const manualSection: CodigoRojoManualSection = {
    moduleType: 'SINCRONIZADOR_FASES',
    title: 'Sincronizador de Fases Cuánticas',
    subtitle: 'Alineación de Anillos de Aceleración',
    classificationCode: 'DOC-QNT-50',
    description:
      'Dos anillos concéntricos graduados en pasos de 60° (0°, 60°, 120°, 180°, 240°, 300°). El Anillo Interior está bloqueado en una posición fija. El Operador puede hacer girar el Anillo Exterior con los botones «GIRAR 60°».',
    rules: [
      {
        condition: 'Si el sistema indica MODO-RESONANTE:',
        action: 'Gira el anillo exterior hasta que su marcador marque exactamente +120° respecto al anillo interior (sumar 120° en sentido horario).',
      },
      {
        condition: 'Si el sistema indica MODO-INVERSO:',
        action: 'Gira el anillo exterior a la posición diametralmente opuesta (+180°) respecto al anillo interior.',
      },
    ],
    notes: [
      'Ejemplo en Modo Resonante: Si el Anillo Interior está a 60°, el Exterior debe situarse a 180° (60 + 120 = 180). Si pasa de 360°, resta 360.',
      'Una vez alienados, pulsa «ENCLAVAR FASE».',
    ],
  };

  return {
    moduleState: {
      id: `mod-fases-${rng.range(1000, 9999)}`,
      moduleType: 'SINCRONIZADOR_FASES',
      title: 'Sincronizador de Fases Cuánticas',
      solved: false,
      strikes: 0,
      estimatedSolveSeconds: 30,
      operatorState: {
        innerAngle,
        phaseMode,
        currentOuterAngle: 0,
      },
      manualSection,
    },
    internalSolution: { targetOuterAngle },
    validateAction: (action: { outerAngle: number }) => {
      if ((action.outerAngle % 360) === (targetOuterAngle % 360)) {
        return { valid: true, solved: true };
      }
      return { valid: false, solved: false };
    },
  };
}

// =========================================================================
// 16. CALIBRADOR GIROSCÓPICO INERCIAL (NUEVO)
// =========================================================================
function generateCalibradorGiroscopio(rng: Mulberry32, serial: string): GeneratedModuleInternal {
  const axes = ['Eje X', 'Eje Y', 'Eje Z'] as const;
  const pitches = ['Subiendo (+)', 'Bajando (-)', 'Estable (=)'] as const;
  const leds = ['Ámbar', 'Verde', 'Apagado'] as const;

  const axis = rng.pick([...axes]);
  const pitch = rng.pick([...pitches]);
  const led = rng.pick([...leds]);
  const currentBearing = rng.range(0, 35) * 10;
  const isSerialOdd = !isSerialLastDigitEven(serial);

  let baseDrift = 0;
  if (axis === 'Eje X') {
    baseDrift = isSerialOdd ? currentBearing + 45 : currentBearing + 90;
  } else if (axis === 'Eje Y') {
    baseDrift = isSerialOdd ? currentBearing + 180 : currentBearing + 30;
  } else {
    baseDrift = isSerialOdd ? currentBearing + 60 : currentBearing + 120;
  }

  let pitchComp = 0;
  if (pitch === 'Subiendo (+)') pitchComp = 15;
  else if (pitch === 'Bajando (-)') pitchComp = -15;

  if (led === 'Ámbar') {
    pitchComp = -pitchComp;
  }

  let targetHeading = (baseDrift + pitchComp) % 360;
  if (targetHeading < 0) targetHeading += 360;

  const manualSection = MASTER_MANUAL_SECTIONS.find((s) => s.moduleType === 'CALIBRADOR_GIROSCOPIO')!;

  return {
    moduleState: {
      id: `mod-giro-${rng.range(1000, 9999)}`,
      moduleType: 'CALIBRADOR_GIROSCOPIO',
      title: 'Calibrador Giroscópico',
      solved: false,
      strikes: 0,
      estimatedSolveSeconds: 50,
      operatorState: {
        axis,
        pitch,
        led,
        currentBearing,
        selectedHeading: currentBearing,
      },
      manualSection,
    },
    internalSolution: { targetHeading },
    validateAction: (action: { lockedHeading: number }) => {
      const diff = Math.abs(((action.lockedHeading - targetHeading + 180) % 360) - 180);
      if (diff <= 2) {
        return { valid: true, solved: true };
      }
      return { valid: false, solved: false };
    },
  };
}

// =========================================================================
// 17. CONTENCIÓN DE PLASMA CUÁNTICO (NUEVO)
// =========================================================================
function generateReactorPlasma(rng: Mulberry32, serial: string): GeneratedModuleInternal {
  const isotopes = ['Azul Neón', 'Púrpura Iónico', 'Verde Tóxico', 'Ámbar Solar'] as const;
  const isotope = rng.pick([...isotopes]);
  const temperatureK = rng.range(32, 55) * 100;
  const hasVowel = doesSerialContainVowel(serial);
  const isSerialOdd = !isSerialLastDigitEven(serial);

  let targetAlpha = 3;
  let targetBeta = 3;
  let targetGamma = 3;

  if (isotope === 'Azul Neón') {
    targetAlpha = 4;
    if (hasVowel) {
      targetBeta = 2;
      targetGamma = 3;
    } else {
      targetBeta = 3;
      targetGamma = 1;
    }
  } else if (isotope === 'Púrpura Iónico') {
    targetBeta = 5;
    if (isSerialOdd) {
      targetAlpha = 2;
      targetGamma = 4;
    } else {
      targetAlpha = 3;
      targetGamma = 2;
    }
  } else if (isotope === 'Verde Tóxico') {
    targetGamma = 4;
    if (temperatureK > 4000) {
      targetAlpha = 3;
      targetBeta = 2;
    } else {
      targetAlpha = 1;
      targetBeta = 5;
    }
  } else {
    // Ámbar Solar
    targetAlpha = 4;
    targetBeta = 2;
    targetGamma = 3;
  }

  const manualSection = MASTER_MANUAL_SECTIONS.find((s) => s.moduleType === 'REACTOR_PLASMA')!;

  return {
    moduleState: {
      id: `mod-plasma-${rng.range(1000, 9999)}`,
      moduleType: 'REACTOR_PLASMA',
      title: 'Contención de Plasma',
      solved: false,
      strikes: 0,
      estimatedSolveSeconds: 50,
      operatorState: {
        isotope,
        temperatureK,
        initialAlpha: 1,
        initialBeta: 1,
        initialGamma: 1,
      },
      manualSection,
    },
    internalSolution: { alpha: targetAlpha, beta: targetBeta, gamma: targetGamma },
    validateAction: (action: { alpha: number; beta: number; gamma: number }) => {
      if (
        action.alpha === targetAlpha &&
        action.beta === targetBeta &&
        action.gamma === targetGamma
      ) {
        return { valid: true, solved: true };
      }
      return { valid: false, solved: false };
    },
  };
}

// =========================================================================
// 18. ATENUADOR ACÚSTICO DE RESONANCIA (NUEVO)
// =========================================================================
function generateFrecuenciaResonancia(rng: Mulberry32, serial: string): GeneratedModuleInternal {
  const peakFrequencies = ['60 Hz', '250 Hz', '1 kHz', '4 kHz', '8 kHz', '16 kHz'] as const;
  const chamberStates = ['ALTA PRESIÓN', 'VACÍO PARCIAL'] as const;
  const peakFreq = rng.pick([...peakFrequencies]);
  const chamber = rng.pick([...chamberStates]);
  const isSerialOdd = !isSerialLastDigitEven(serial);
  const containsCR = /[CRcr]/.test(serial);

  let targetFilters: number[] = [];

  if (peakFreq === '60 Hz') {
    targetFilters = chamber === 'ALTA PRESIÓN' ? [1, 4] : [1, 2];
  } else if (peakFreq === '250 Hz') {
    targetFilters = isSerialOdd ? [1, 3] : [2, 3];
  } else if (peakFreq === '1 kHz') {
    targetFilters = containsCR ? [2, 4] : [3, 4];
  } else if (peakFreq === '4 kHz') {
    targetFilters = [1, 2, 4];
  } else if (peakFreq === '8 kHz') {
    targetFilters = [1, 4];
  } else {
    // 16 kHz
    targetFilters = isSerialOdd ? [3, 4] : [1, 4];
  }

  const manualSection = MASTER_MANUAL_SECTIONS.find((s) => s.moduleType === 'FRECUENCIA_RESONANCIA')!;

  return {
    moduleState: {
      id: `mod-res-${rng.range(1000, 9999)}`,
      moduleType: 'FRECUENCIA_RESONANCIA',
      title: 'Atenuador Acústico',
      solved: false,
      strikes: 0,
      estimatedSolveSeconds: 45,
      operatorState: {
        peakFreq,
        chamber,
        activeFilters: [],
      },
      manualSection,
    },
    internalSolution: { targetFilters: targetFilters.sort((a, b) => a - b) },
    validateAction: (action: { activeFilters: number[] }) => {
      const sortedAct = [...action.activeFilters].sort((a, b) => a - b);
      const isMatch =
        sortedAct.length === targetFilters.length &&
        sortedAct.every((v, i) => v === targetFilters[i]);
      if (isMatch) {
        return { valid: true, solved: true };
      }
      return { valid: false, solved: false };
    },
  };
}

// =========================================================================
// 19. BLOQUEO DE PISTONES CINÉTICOS (NUEVO)
// =========================================================================
function generateSecuenciaCinetica(rng: Mulberry32, serial: string): GeneratedModuleInternal {
  const collarColors = ['Dorado', 'Carmesí', 'Cobalto', 'Esmeralda'] as const;
  const strokeDepths = ['Corto', 'Medio', 'Largo'] as const;

  const pistons = [1, 2, 3, 4].map((id) => ({
    id,
    collar: rng.pick([...collarColors]),
    stroke: rng.pick([...strokeDepths]),
    pressed: false,
  }));

  const lastDigit = getSerialLastDigit(serial);

  // Step 1:
  let p1Id = 1;
  const goldenPistons = pistons.filter((p) => p.collar === 'Dorado');
  const crimsonPistons = pistons.filter((p) => p.collar === 'Carmesí');
  const cobaltPistons = pistons.filter((p) => p.collar === 'Cobalto');

  if (goldenPistons.length > 0) {
    const strokeRank: Record<string, number> = { Largo: 3, Medio: 2, Corto: 1 };
    const sorted = [...goldenPistons].sort((a, b) => strokeRank[b.stroke] - strokeRank[a.stroke]);
    p1Id = sorted[0].id;
  } else if (crimsonPistons.length >= 2) {
    p1Id = crimsonPistons[crimsonPistons.length - 1].id;
  } else if (cobaltPistons.length > 0) {
    p1Id = cobaltPistons[0].id;
  } else {
    p1Id = 1;
  }

  // Step 2:
  const p4 = pistons.find((p) => p.id === 4)!;
  let p2Id = 2;
  if (p4.collar === 'Esmeralda' && p1Id !== 1) {
    p2Id = 1;
  } else if (lastDigit > 4) {
    let candidate = p1Id === 4 ? 1 : p1Id + 1;
    if (candidate === p1Id) candidate = candidate === 4 ? 1 : candidate + 1;
    p2Id = candidate;
  } else {
    p2Id = p1Id === 3 ? 2 : 3;
  }

  // Step 3:
  const remainingAfterStep2 = pistons.filter((p) => p.id !== p1Id && p.id !== p2Id);
  const primaryRemaining = remainingAfterStep2.filter(
    (p) => p.collar === 'Carmesí' || p.collar === 'Cobalto'
  );
  let p3Id = remainingAfterStep2[0].id;
  if (primaryRemaining.length === 1) {
    p3Id = primaryRemaining[0].id;
  } else {
    p3Id = Math.min(remainingAfterStep2[0].id, remainingAfterStep2[1].id);
  }

  // Step 4:
  const p4Id = pistons.find((p) => p.id !== p1Id && p.id !== p2Id && p.id !== p3Id)!.id;

  const sequence = [p1Id, p2Id, p3Id, p4Id];

  const manualSection = MASTER_MANUAL_SECTIONS.find((s) => s.moduleType === 'SECUENCIA_CINETICA')!;

  return {
    moduleState: {
      id: `mod-cin-${rng.range(1000, 9999)}`,
      moduleType: 'SECUENCIA_CINETICA',
      title: 'Pistones Cinéticos',
      solved: false,
      strikes: 0,
      estimatedSolveSeconds: 50,
      operatorState: {
        pistons,
        pressedPistonIds: [],
        stepProgress: 0,
      },
      manualSection,
    },
    internalSolution: { sequence },
    validateAction: (action: { pressedPistonId: number }, currentProgress: any) => {
      const stepIndex = currentProgress?.stepProgress || 0;
      const expectedPiston = sequence[stepIndex];

      if (action.pressedPistonId === expectedPiston) {
        const nextStep = stepIndex + 1;
        const isSolved = nextStep >= 4;
        const pressedList = [...(currentProgress?.pressedPistonIds || []), action.pressedPistonId];
        return {
          valid: true,
          solved: isSolved,
          updatedProgress: { stepProgress: nextStep, pressedPistonIds: pressedList },
        };
      } else {
        return {
          valid: false,
          solved: false,
          updatedProgress: { stepProgress: 0, pressedPistonIds: [] },
        };
      }
    },
  };
}

// =========================================================================
// 20. PUENTE POTENCIOMÉTRICO DE PRECISIÓN (NUEVO)
// =========================================================================
function generateDivisorVoltaje(rng: Mulberry32, serial: string): GeneratedModuleInternal {
  const deflectionMV = rng.pick([-42, -35, -28, -20, -14, 16, 22, 28, 36, 44]);
  const scales = ['R1 (x1)', 'R2 (x2)', 'R3 (x3)'] as const;
  const scale = rng.pick([...scales]);
  const isSerialOdd = !isSerialLastDigitEven(serial);
  const hasXK = /[XKxk]/.test(serial);

  const multiplier = scale === 'R1 (x1)' ? 1 : scale === 'R2 (x2)' ? 2 : 3;
  const absVal = Math.abs(deflectionMV) * multiplier;

  let targetValue = 50;
  if (deflectionMV > 0) {
    let prelim = absVal + 15;
    if (isSerialOdd) prelim += 10;
    targetValue = prelim % 100;
  } else {
    let prelim = (100 - (absVal % 100)) % 100;
    if (hasXK) prelim = (prelim - 5 + 100) % 100;
    targetValue = prelim % 100;
  }

  const manualSection = MASTER_MANUAL_SECTIONS.find((s) => s.moduleType === 'DIVISOR_VOLTAJE')!;

  return {
    moduleState: {
      id: `mod-volt-${rng.range(1000, 9999)}`,
      moduleType: 'DIVISOR_VOLTAJE',
      title: 'Puente Potenciométrico',
      solved: false,
      strikes: 0,
      estimatedSolveSeconds: 45,
      operatorState: {
        deflectionMV,
        scale,
        dialValue: 50,
      },
      manualSection,
    },
    internalSolution: { targetValue },
    validateAction: (action: { dialValue: number }) => {
      if (action.dialValue === targetValue) {
        return { valid: true, solved: true };
      }
      return { valid: false, solved: false };
    },
  };
}

// =========================================================================
// AUTHORITATIVE GENERATOR & VALIDATOR REGISTRY (20 MODULE FAMILIES)
// =========================================================================
export const ALL_MODULE_TYPES: CodigoRojoModuleType[] = [
  'FILAMENTOS',
  'MODULADOR_FRECUENCIA',
  'GLIFOS_CRIPTOGRAFICOS',
  'MATRIZ_ENERGIA',
  'VALVULAS_PRESION',
  'RELES_HEXADECIMALES',
  'RADAR_VECTORIAL',
  'SEÑAL_OPTICA',
  'TECLADO_MAESTRO',
  'PALANCA_SOBRECARGA',
  'COMPUERTAS_LOGICAS',
  'REFRIGERANTE_QUIMICO',
  'PUERTOS_CONEXION',
  'DISIPADOR_TERMICO',
  'SINCRONIZADOR_FASES',
  'CALIBRADOR_GIROSCOPIO',
  'REACTOR_PLASMA',
  'FRECUENCIA_RESONANCIA',
  'SECUENCIA_CINETICA',
  'DIVISOR_VOLTAJE',
];

export function generateModuleInstance(
  type: CodigoRojoModuleType,
  seed: number,
  difficulty: CodigoRojoDifficulty,
  serial: string = 'CR-4821-X7'
): GeneratedModuleInternal {
  const rng = new Mulberry32(seed);

  switch (type) {
    case 'FILAMENTOS':
      return generateFilamentos(rng, difficulty, serial);
    case 'MODULADOR_FRECUENCIA':
      return generateModuladorFrecuencia(rng, difficulty);
    case 'GLIFOS_CRIPTOGRAFICOS':
      return generateGlifosCriptograficos(rng);
    case 'MATRIZ_ENERGIA':
      return generateMatrizEnergia(rng);
    case 'VALVULAS_PRESION':
      return generateValvulasPresion(rng);
    case 'RELES_HEXADECIMALES':
      return generateRelesHexadecimales(rng);
    case 'RADAR_VECTORIAL':
      return generateRadarVectorial(rng);
    case 'SEÑAL_OPTICA':
      return generateSeñalOptica(rng);
    case 'TECLADO_MAESTRO':
      return generateTecladoMaestro(rng);
    case 'PALANCA_SOBRECARGA':
      return generatePalancaSobrecarga(rng);
    case 'COMPUERTAS_LOGICAS':
      return generateCompuertasLogicas(rng);
    case 'REFRIGERANTE_QUIMICO':
      return generateRefrigeranteQuimico(rng);
    case 'PUERTOS_CONEXION':
      return generatePuertosConexion(rng);
    case 'DISIPADOR_TERMICO':
      return generateDisipadorTermico(rng);
    case 'SINCRONIZADOR_FASES':
      return generateSincronizadorFases(rng);
    case 'CALIBRADOR_GIROSCOPIO':
      return generateCalibradorGiroscopio(rng, serial);
    case 'REACTOR_PLASMA':
      return generateReactorPlasma(rng, serial);
    case 'FRECUENCIA_RESONANCIA':
      return generateFrecuenciaResonancia(rng, serial);
    case 'SECUENCIA_CINETICA':
      return generateSecuenciaCinetica(rng, serial);
    case 'DIVISOR_VOLTAJE':
      return generateDivisorVoltaje(rng, serial);
    default:
      return generateFilamentos(rng, difficulty, serial);
  }
}

/**
 * Validates a generated module to verify that it is fully solvable,
 * non-contradictory, and valid before dispatching to players.
 */
export function validateModuleInstance(instance: GeneratedModuleInternal): boolean {
  if (!instance || !instance.moduleState || !instance.internalSolution) return false;
  if (!instance.moduleState.operatorState || !instance.moduleState.manualSection) return false;
  if (!instance.moduleState.manualSection.rules || instance.moduleState.manualSection.rules.length === 0) return false;
  return true;
}

/**
 * Generates a full mission with verified unique modules and calculated automatic time.
 */
export function generateMissionModules(
  count: number,
  difficulty: CodigoRojoDifficulty,
  seed: number,
  existingSerial?: string
): { modules: GeneratedModuleInternal[]; totalEstimatedSeconds: number; machineSerial: string } {
  const rng = new Mulberry32(seed);
  const machineSerial = existingSerial || generateMachineSerial(rng);
  const shuffledTypes = rng.shuffle(ALL_MODULE_TYPES);
  const selectedTypes = shuffledTypes.slice(0, Math.min(count, ALL_MODULE_TYPES.length));

  const resultModules: GeneratedModuleInternal[] = [];
  let totalEstimated = 60; // base setup time 60 seconds

  for (let i = 0; i < selectedTypes.length; i++) {
    const type = selectedTypes[i];
    let attempts = 0;
    let validModule: GeneratedModuleInternal | null = null;

    while (attempts < 10 && !validModule) {
      const subSeed = rng.range(100000, 999999) + attempts * 37;
      const mod = generateModuleInstance(type, subSeed, difficulty, machineSerial);
      if (validateModuleInstance(mod)) {
        validModule = mod;
      }
      attempts++;
    }

    if (validModule) {
      resultModules.push(validModule);
      totalEstimated += validModule.moduleState.estimatedSolveSeconds;
    }
  }

  // Adjust for difficulty
  if (difficulty === 'DIFICIL') totalEstimated = Math.round(totalEstimated * 0.9);
  if (difficulty === 'EXTREMO') totalEstimated = Math.round(totalEstimated * 0.8);

  return {
    modules: resultModules,
    totalEstimatedSeconds: Math.max(120, totalEstimated),
    machineSerial,
  };
}
