/**
 * Hexadecimal relay decoding helpers.
 * Maps 1 hexadecimal digit (0-F) directly into a 4-bit binary pattern for R1..R4:
 * 1 = ARRIBA, 0 = ABAJO
 */

export interface HexRelayModuleData {
  hexChar: string; // '0'..'9', 'A'..'F'
  polarity: 'NORMAL' | 'INVERTIDA';
  order?: 'NORMAL' | 'INVERSO';
}

export const HEX_RELAY_TABLE: Record<string, [number, number, number, number]> = {
  '0': [0, 0, 0, 0],
  '1': [0, 0, 0, 1],
  '2': [0, 0, 1, 0],
  '3': [0, 0, 1, 1],
  '4': [0, 1, 0, 0],
  '5': [0, 1, 0, 1],
  '6': [0, 1, 1, 0],
  '7': [0, 1, 1, 1],
  '8': [1, 0, 0, 0],
  '9': [1, 0, 0, 1],
  'A': [1, 0, 1, 0],
  'B': [1, 0, 1, 1],
  'C': [1, 1, 0, 0],
  'D': [1, 1, 0, 1],
  'E': [1, 1, 1, 0],
  'F': [1, 1, 1, 1],
};

/**
 * Deterministically derives the target relay positions [R1, R2, R3, R4]
 * 1 = ARRIBA, 0 = ABAJO
 */
export function deriveHexRelaySolution(data: HexRelayModuleData): [number, number, number, number] {
  const cleanChar = (data.hexChar.replace(/^0x/i, '') || 'A').toUpperCase().charAt(0);
  const baseBits = HEX_RELAY_TABLE[cleanChar] || [0, 0, 0, 0];
  let [r1, r2, r3, r4] = baseBits;

  // Polarity: INVERTIDA swaps ARRIBA (1) <-> ABAJO (0)
  if (data.polarity === 'INVERTIDA') {
    r1 = r1 === 1 ? 0 : 1;
    r2 = r2 === 1 ? 0 : 1;
    r3 = r3 === 1 ? 0 : 1;
    r4 = r4 === 1 ? 0 : 1;
  }

  // Optional order check (for hard difficulty): INVERSO reads from right to left (R4 -> R1)
  if (data.order === 'INVERSO') {
    return [r4, r3, r2, r1];
  }

  return [r1, r2, r3, r4];
}
