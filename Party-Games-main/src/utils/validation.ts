import { WordValidationResult } from '../types';

/**
 * Normalizes a Spanish word:
 * - lowercase
 * - strips accents and diacritics (á -> a, é -> e, etc.)
 * - preserves 'ñ'
 * - removes all non-alphabetical characters
 */
export function normalizeSpanishWord(word: string): string {
  return word
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zñ]/g, '');
}

/**
 * Checks whether the word contains the required sequence of letters in exact order.
 * Accents are normalized (e.g. "omnívoro" matches "OMN").
 */
export function checkContainsSequence(word: string, sequence: string): boolean {
  const normWord = normalizeSpanishWord(word);
  const normSeq = normalizeSpanishWord(sequence);
  return normWord.includes(normSeq);
}

/**
 * Full two-step validation:
 * Step 1 (INSTANT LOCAL):
 *   - Check sequence inclusion.
 *   - Check duplicate against current round's used words.
 * Step 2 (FAST LEXICAL LOOKUP):
 *   - Query the 636k Spanish dictionary API on localhost (1-2 ms).
 */
export async function validateSpanishWordAsync(
  rawWord: string,
  sequence: string,
  usedWords: string[] = []
): Promise<WordValidationResult> {
  const trimmed = rawWord.trim();
  const normWord = normalizeSpanishWord(trimmed);
  const normSeq = normalizeSpanishWord(sequence);

  // Check minimum length
  if (normWord.length < Math.max(2, normSeq.length)) {
    return {
      valid: false,
      canonicalAnswer: trimmed,
      reason: 'Demasiado corta',
      errorType: 'TOO_SHORT',
    };
  }

  // STEP 1A: INSTANT LOCAL SEQUENCE CHECK
  if (!normWord.includes(normSeq)) {
    return {
      valid: false,
      canonicalAnswer: trimmed,
      reason: `NO CONTIENE «${sequence.toUpperCase()}»`,
      errorType: 'NO_SEQUENCE',
    };
  }

  // STEP 1B: INSTANT LOCAL DUPLICATE CHECK
  const isDuplicate = usedWords.some(
    (w) => normalizeSpanishWord(w) === normWord
  );
  if (isDuplicate) {
    return {
      valid: false,
      canonicalAnswer: trimmed,
      reason: 'YA SE HA DICHO',
      errorType: 'DUPLICATE',
      duplicate: true,
    };
  }

  // STEP 2: FAST LEXICAL LOOKUP (Local server dictionary with 636,598 Spanish words)
  try {
    const response = await fetch('/api/validate-word', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        word: trimmed,
        sequence,
        usedWords,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    return {
      valid: Boolean(result.valid),
      canonicalAnswer: result.canonicalWord || trimmed.toLowerCase(),
      reason: result.reason || (result.valid ? 'VÁLIDA' : `«${trimmed.toUpperCase()}» no es una palabra válida`),
      errorType: result.errorType || (result.valid ? null : 'NOT_A_WORD'),
      duplicate: result.duplicate,
    };
  } catch (error) {
    console.warn('Fallback validating word:', error);
    // In case server is unreachable, sequence was verified, accept if basic format is standard
    const isLettersOnly = /^[a-záéíóúñüÁÉÍÓÚÑÜ]{2,30}$/i.test(trimmed);
    return {
      valid: isLettersOnly,
      canonicalAnswer: trimmed.toLowerCase(),
      reason: isLettersOnly ? 'VÁLIDA' : 'Palabra inválida',
      errorType: isLettersOnly ? null : 'NOT_A_WORD',
    };
  }
}
