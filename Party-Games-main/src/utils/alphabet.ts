/**
 * Reto del Abecedario (Spanish Alphabet Challenge)
 * 27 letras del alfabeto español (A-Z + Ñ).
 * Las vocales acentuadas (Á, É, Í, Ó, Ú, Ü) se normalizan a su vocal base.
 * La Ñ se mantiene como letra independiente con entidad propia.
 */

export const SPANISH_ALPHABET = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'Ñ', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
] as const;

export const TOTAL_ALPHABET_LETTERS = SPANISH_ALPHABET.length; // 27

/**
 * Normaliza las vocales con tilde / diéresis a su letra base,
 * preservando la Ñ como letra independiente.
 */
export function normalizeSpanishChar(char: string): string {
  const upper = char.toUpperCase();
  switch (upper) {
    case 'Á':
      return 'A';
    case 'É':
      return 'E';
    case 'Í':
      return 'I';
    case 'Ó':
      return 'O';
    case 'Ú':
    case 'Ü':
      return 'U';
    case 'Ñ':
      return 'Ñ';
    default:
      return upper;
  }
}

/**
 * Extrae todas las letras únicas del alfabeto español presentes en una palabra válida.
 */
export function extractSpanishLetters(word: string): string[] {
  const unique = new Set<string>();
  for (const rawChar of word) {
    const normalized = normalizeSpanishChar(rawChar);
    if ((SPANISH_ALPHABET as readonly string[]).includes(normalized)) {
      unique.add(normalized);
    }
  }
  return Array.from(unique).sort(
    (a, b) => SPANISH_ALPHABET.indexOf(a as any) - SPANISH_ALPHABET.indexOf(b as any)
  );
}

export interface AlphabetProgressUpdate {
  newLetters: string[];
  updatedProgress: string[];
  isCompleted: boolean;
  previousCount: number;
  newCount: number;
}

/**
 * Calcula el progreso del abecedario tras una palabra válida.
 * Si se completan las 27 letras, isCompleted = true.
 */
export function calculateAlphabetProgress(
  currentProgress: string[] = [],
  validWord: string
): AlphabetProgressUpdate {
  const wordLetters = extractSpanishLetters(validWord);
  const currentSet = new Set(currentProgress);
  const newLetters = wordLetters.filter((l) => !currentSet.has(l));

  const mergedSet = new Set([...currentProgress, ...newLetters]);
  const updatedProgress = (SPANISH_ALPHABET as readonly string[]).filter((letter) =>
    mergedSet.has(letter)
  );

  const isCompleted = updatedProgress.length === TOTAL_ALPHABET_LETTERS;

  return {
    newLetters,
    updatedProgress,
    isCompleted,
    previousCount: currentProgress.length,
    newCount: updatedProgress.length,
  };
}
