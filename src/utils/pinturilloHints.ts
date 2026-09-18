export interface HintSlot {
  type: 'letter' | 'punctuation';
  char: string;
  isRevealed: boolean;
}

export type HintWordGroup = HintSlot[];

/**
 * Calculates only the guessable letters and numbers in a phrase.
 * Spaces and punctuation (such as hyphens, apostrophes, etc.) do NOT count toward the letter count.
 * Accented characters (á, é, í, ó, ú, ü, ñ) count as exactly ONE letter.
 *
 * Example:
 * "INFLAR UN GLOBO" -> 13
 * "MARIO KART" -> 9
 * "HARRY POTTER" -> 11
 * "PAC-MAN" -> 6
 */
export function calculateWordLength(secretWord?: string | null): number {
  if (!secretWord) return 0;
  const matches = secretWord.match(/[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ]/g);
  return matches ? matches.length : 0;
}

/**
 * Checks whether a character is a guessable letter or digit.
 */
export function isAlphaNumericChar(char: string): boolean {
  return /[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ]/.test(char);
}

/**
 * Builds structured word groups from a secret word and the set of revealed character indices.
 * 
 * - Words are separated into distinct groups (outer array).
 * - Spaces are NOT letter slots and do not occupy mystery boxes.
 * - Punctuation (e.g., hyphens) are revealed structurally with type 'punctuation'.
 * - Letters/digits are mystery slots ('letter') which reveal their uppercase char when revealed.
 */
export function buildStructuredHint(secretWord: string, revealedIndices: Set<number>): HintSlot[][] {
  if (!secretWord) return [];

  const rawWords = secretWord.trim().split(/\s+/);
  let globalCharIndex = 0;
  const groups: HintSlot[][] = [];

  for (let w = 0; w < rawWords.length; w++) {
    const word = rawWords[w];
    if (!word) continue;

    const slots: HintSlot[] = [];
    for (let c = 0; c < word.length; c++) {
      const char = word[c];
      const charIndex = globalCharIndex;
      globalCharIndex++;

      if (!isAlphaNumericChar(char)) {
        // Hyphen, apostrophe, or punctuation mark
        slots.push({
          type: 'punctuation',
          char,
          isRevealed: true,
        });
      } else {
        const isRevealed = revealedIndices.has(charIndex);
        slots.push({
          type: 'letter',
          char: isRevealed ? char.toUpperCase() : '',
          isRevealed,
        });
      }
    }

    groups.push(slots);
    // Increment globalCharIndex to account for the space between words
    globalCharIndex++;
  }

  return groups;
}

/**
 * Produces a string representation of the hint.
 * Letters in a word are separated by a single space, and words are separated by three spaces.
 * Example:
 * "_ N _ _ _ _   _ _   _ _ O _ O"
 */
export function buildWordHintString(secretWord: string, revealedIndices: Set<number>): string {
  const groups = buildStructuredHint(secretWord, revealedIndices);
  return groups
    .map((wordGroup) =>
      wordGroup
        .map((slot) => {
          if (slot.type === 'punctuation') return slot.char;
          return slot.isRevealed ? slot.char : '_';
        })
        .join(' ')
    )
    .join('   ');
}

/**
 * Fallback parser in case only `wordHint` string is available on the client.
 */
export function parseWordHintToGroups(
  hintWords?: HintSlot[][],
  wordHint?: string
): HintSlot[][] {
  if (hintWords && Array.isArray(hintWords) && hintWords.length > 0) {
    return hintWords;
  }

  if (!wordHint) return [];

  // If wordHint contains triple spaces or slashes between words
  const wordTokens = wordHint.includes('   ')
    ? wordHint.split('   ')
    : wordHint.includes(' / ')
    ? wordHint.split(' / ')
    : [wordHint];

  return wordTokens.map((wToken) => {
    const chars = wToken.trim().split(/\s+/);
    return chars.map((ch) => {
      if (!isAlphaNumericChar(ch) && ch !== '_') {
        return {
          type: 'punctuation',
          char: ch,
          isRevealed: true,
        };
      }
      const isRevealed = ch !== '_' && ch !== '';
      return {
        type: 'letter',
        char: isRevealed ? ch.toUpperCase() : '',
        isRevealed,
      };
    });
  });
}
