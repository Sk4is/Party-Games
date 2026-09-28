import { Card, CardRank, NumericCardRank } from '../types/cantina';

export const NUMERIC_RANKS: NumericCardRank[] = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
];

export const SPECIAL_ACTION_RANKS: CardRank[] = [
  'J',
  'Q',
  'K',
  'BOMBA',
  'ESPEJO',
  'REVOLVER',
];

/**
 * Explicit presentation sort order for CADENA hands:
 * Numeric cards 1..10 ascending first, then special cards in stable order:
 * J -> Q -> K -> JOKER -> ESPEJO -> BOMBA -> REVOLVER
 */
export const CADENA_HAND_SORT_WEIGHT: Record<CardRank, number> = {
  '1': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  J: 11,
  Q: 12,
  K: 13,
  JOKER: 14,
  ESPEJO: 15,
  BOMBA: 16,
  REVOLVER: 17,
  DIABLO: 99,
};

/**
 * Pure presentation helper that sorts a player's hand for CADENA mode without mutating
 * the authoritative hand array or altering card IDs.
 * Identical ranks stay grouped together and preserve a deterministic order by stable card ID.
 */
export function sortCadenaHand(cards: readonly Card[] | undefined | null): Card[] {
  if (!cards || cards.length === 0) return [];
  return [...cards].sort((a, b) => {
    const weightA = CADENA_HAND_SORT_WEIGHT[a.rank] ?? 50;
    const weightB = CADENA_HAND_SORT_WEIGHT[b.rank] ?? 50;
    if (weightA !== weightB) {
      return weightA - weightB;
    }
    return a.id.localeCompare(b.id, undefined, { numeric: true });
  });
}

/**
 * Generates a freshly shuffled permutation of slot indices [0 .. count - 1]
 * so K's steal-selection cards never leak sorted hand positions.
 */
export function createShuffledStealSlots(
  count: number,
  seed?: number | string | null
): number[] {
  const slots = Array.from({ length: Math.max(0, count) }, (_, i) => i);
  let numericSeed = 0;
  if (typeof seed === 'number' && Number.isFinite(seed)) {
    numericSeed = Math.abs(Math.floor(seed)) || 1;
  } else if (typeof seed === 'string' && seed.length > 0) {
    let hash = 2166136261;
    for (let i = 0; i < seed.length; i++) {
      hash ^= seed.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    numericSeed = Math.abs(hash) || 1;
  }
  let s = numericSeed;
  const nextRand = () => {
    if (seed === undefined || seed === null) {
      return Math.random();
    }
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
  for (let i = slots.length - 1; i > 0; i--) {
    const j = Math.floor(nextRand() * (i + 1));
    [slots[i], slots[j]] = [slots[j], slots[i]];
  }
  return slots;
}

/**
 * Returns the numeric value (1..10) if the card rank is '1'..'10', otherwise null.
 */
export function getCardNumericValue(rank: CardRank | string | undefined): number | null {
  if (!rank) return null;
  const n = Number(rank);
  if (Number.isInteger(n) && n >= 1 && n <= 10) {
    return n;
  }
  return null;
}

export function isNumericCard(card: Card | undefined | null): boolean {
  if (!card) return false;
  return getCardNumericValue(card.rank) !== null;
}

export function isSpecialActionCard(card: Card | undefined | null): boolean {
  if (!card) return false;
  return SPECIAL_ACTION_RANKS.includes(card.rank);
}

/**
 * Circular ascending step on 1..10:
 * 1 -> 2 -> ... -> 9 -> 10 -> 1
 */
export function nextCircularNumber(n: number): number {
  return ((((n - 1 + 1) % 10) + 10) % 10) + 1;
}

/**
 * Circular descending step on 1..10:
 * 2 -> 1 -> 10 -> 9 -> ... -> 2
 */
export function prevCircularNumber(n: number): number {
  return ((((n - 1 - 1) % 10) + 10) % 10) + 1;
}

/**
 * Checks if `candidate` (1..10) is immediately adjacent (+1 or -1 circularly) to `currentNumber` (1..10).
 */
export function isCircularlyAdjacent(currentNumber: number, candidate: number): boolean {
  if (candidate < 1 || candidate > 10) return false;
  return (
    candidate === nextCircularNumber(currentNumber) ||
    candidate === prevCircularNumber(currentNumber)
  );
}

/**
 * Builds the authoritative 70-card CADENA deck:
 * - Numeric 1..10: 5 copies each = 50 cards
 * - 4 x J (SALTO)
 * - 4 x Q (REVERSA)
 * - 4 x K (ROBO)
 * - 3 x JOKER (COMODÍN)
 * - 2 x ESPEJO (REFLEJO)
 * - 1 x BOMBA
 * - 2 x REVOLVER (RULETA DE CARTAS)
 * Total = 70 cards. Zero DIABLO cards.
 */
export function buildCadenaDeck(roundTag: string | number = 1): Card[] {
  const deck: Card[] = [];
  let seq = 1;

  // 50 numeric cards (5 copies of 1..10)
  for (const numRank of NUMERIC_RANKS) {
    for (let copy = 0; copy < 5; copy++) {
      deck.push({
        id: `cad_${numRank}_r${roundTag}_${seq++}`,
        rank: numRank,
      });
    }
  }

  // 4 x J (SALTO)
  for (let i = 0; i < 4; i++) {
    deck.push({ id: `cad_J_r${roundTag}_${seq++}`, rank: 'J' });
  }

  // 4 x Q (REVERSA)
  for (let i = 0; i < 4; i++) {
    deck.push({ id: `cad_Q_r${roundTag}_${seq++}`, rank: 'Q' });
  }

  // 4 x K (ROBO)
  for (let i = 0; i < 4; i++) {
    deck.push({ id: `cad_K_r${roundTag}_${seq++}`, rank: 'K' });
  }

  // 3 x JOKER (COMODÍN)
  for (let i = 0; i < 3; i++) {
    deck.push({ id: `cad_JOKER_r${roundTag}_${seq++}`, rank: 'JOKER' });
  }

  // 2 x ESPEJO (REFLEJO)
  for (let i = 0; i < 2; i++) {
    deck.push({ id: `cad_ESPEJO_r${roundTag}_${seq++}`, rank: 'ESPEJO' });
  }

  // 1 x BOMBA
  deck.push({ id: `cad_BOMBA_r${roundTag}_${seq++}`, rank: 'BOMBA' });

  // 2 x REVOLVER
  for (let i = 0; i < 2; i++) {
    deck.push({ id: `cad_REVOLVER_r${roundTag}_${seq++}`, rank: 'REVOLVER' });
  }

  return deck;
}

export interface ChainValidationResult {
  valid: boolean;
  reason?: string;
  direction?: 'ASC' | 'DESC';
  newCurrentNumber?: number;
  resolvedCards?: Card[]; // Cards annotated with substitutedNumber for any JOKER
  resolvedNumbers?: number[]; // Numeric sequence e.g. [6, 7, 7, 8]
}

/**
 * Attempts to validate an ordered sequence of cards in a single fixed direction ('ASC' or 'DESC').
 */
function tryValidateChainInDirection(
  currentNumber: number,
  cards: Card[],
  direction: 'ASC' | 'DESC'
): ChainValidationResult {
  const stepFn = direction === 'ASC' ? nextCircularNumber : prevCircularNumber;

  // All cards must be numeric ('1'..'10') or 'JOKER'
  let realNumericCount = 0;
  let jokerCount = 0;
  for (const c of cards) {
    const val = getCardNumericValue(c.rank);
    if (val !== null) {
      realNumericCount++;
    } else if (c.rank === 'JOKER') {
      jokerCount++;
    } else {
      return {
        valid: false,
        reason: 'Las cartas especiales no pueden mezclarse dentro de una cadena numérica.',
      };
    }
  }

  // Requirement 23 & 24: Joker is a bridge inside a numeric chain, never a standalone arbitrary play.
  // If any Joker is present, the chain must contain at least one real numeric card to anchor the chain.
  if (jokerCount > 0 && realNumericCount === 0) {
    return {
      valid: false,
      reason: 'El Comodín (Joker) debe formar parte de una cadena junto con al menos un número.',
    };
  }

  const resolvedCards: Card[] = [];
  const resolvedNumbers: number[] = [];

  // Step 0: First card in the chain MUST be immediately adjacent to currentNumber in `direction`
  const expectedFirst = stepFn(currentNumber);
  const firstCard = cards[0];
  const firstVal = getCardNumericValue(firstCard.rank);

  if (firstCard.rank === 'JOKER') {
    resolvedCards.push({ ...firstCard, substitutedNumber: expectedFirst });
    resolvedNumbers.push(expectedFirst);
  } else if (firstVal === expectedFirst) {
    resolvedCards.push({ ...firstCard });
    resolvedNumbers.push(expectedFirst);
  } else {
    return {
      valid: false,
      reason: `La primera carta debe conectar con el ${currentNumber} (${nextCircularNumber(
        currentNumber
      )} o ${prevCircularNumber(currentNumber)}).`,
    };
  }

  let currentChainVal = expectedFirst;
  let prevWasJoker = firstCard.rank === 'JOKER';

  // Subsequent cards in the chain
  for (let i = 1; i < cards.length; i++) {
    const card = cards[i];
    const numVal = getCardNumericValue(card.rank);
    const nextStepVal = stepFn(currentChainVal);

    if (card.rank === 'JOKER') {
      // Joker bridges to the next number in the chain's direction
      currentChainVal = nextStepVal;
      resolvedCards.push({ ...card, substitutedNumber: currentChainVal });
      resolvedNumbers.push(currentChainVal);
      prevWasJoker = true;
    } else if (numVal !== null) {
      if (!prevWasJoker && numVal === currentChainVal) {
        // Consecutive duplicate of the current real number (e.g. 6 -> 6 -> 6)
        resolvedCards.push({ ...card });
        resolvedNumbers.push(currentChainVal);
        prevWasJoker = false;
      } else if (numVal === nextStepVal) {
        // Advance 1 step in the fixed chain direction
        currentChainVal = nextStepVal;
        resolvedCards.push({ ...card });
        resolvedNumbers.push(currentChainVal);
        prevWasJoker = false;
      } else {
        return {
          valid: false,
          reason: 'La cadena debe mantener una única dirección consecutiva sin saltos ni cambios de sentido.',
        };
      }
    }
  }

  return {
    valid: true,
    direction,
    newCurrentNumber: currentChainVal,
    resolvedCards,
    resolvedNumbers,
  };
}

/**
 * Authoritatively validates a numeric chain starting from `currentNumber` (1..10).
 * Supports:
 * - Basic adjacency (+1 or -1)
 * - Circular 10 <-> 1 transitions
 * - Strict single direction (ASC or DESC)
 * - Consecutive duplicates (e.g. 6 -> 6 -> 6 -> 7)
 * - Joker bridges (e.g. 6 -> Joker(7) -> 8 or Joker(6) -> 7)
 */
export function validateCadenaChain(
  currentNumber: number,
  cards: Card[]
): ChainValidationResult {
  if (!Array.isArray(cards) || cards.length === 0) {
    return { valid: false, reason: 'Selecciona al menos una carta para la cadena.' };
  }

  // Check duplicate card IDs
  const seenIds = new Set<string>();
  for (const c of cards) {
    if (!c || !c.id) {
      return { valid: false, reason: 'Carta no válida.' };
    }
    if (seenIds.has(c.id)) {
      return { valid: false, reason: 'No puedes repetir la misma carta física.' };
    }
    seenIds.add(c.id);
  }

  const ascResult = tryValidateChainInDirection(currentNumber, cards, 'ASC');
  if (ascResult.valid) {
    return ascResult;
  }

  const descResult = tryValidateChainInDirection(currentNumber, cards, 'DESC');
  if (descResult.valid) {
    return descResult;
  }

  return {
    valid: false,
    reason:
      ascResult.reason ||
      descResult.reason ||
      'Esa combinación no forma una cadena válida con el número actual.',
  };
}

/**
 * Checks whether `candidateCard` can be appended as the next step to `selectedCards`
 * given `currentNumber` and the player's full `hand` (for Joker lookahead).
 */
export function canAppendCardToSelection(
  currentNumber: number,
  selectedCards: Card[],
  candidateCard: Card,
  fullHand: Card[]
): boolean {
  if (selectedCards.some((c) => c.id === candidateCard.id)) {
    return false;
  }

  // Special action cards (J, Q, K, BOMBA, ESPEJO) can only be selected alone
  if (isSpecialActionCard(candidateCard)) {
    return selectedCards.length === 0;
  }
  if (selectedCards.some((c) => isSpecialActionCard(c))) {
    return false;
  }

  const nextSelection = [...selectedCards, candidateCard];
  const directCheck = validateCadenaChain(currentNumber, nextSelection);
  if (directCheck.valid) {
    return true;
  }

  // Special case: if the user clicks a JOKER as the very first card in their chain,
  // it is valid as a prefix ONLY IF they also hold at least one numeric card in `fullHand`
  // that can complete `Joker(adj) -> nextAdj`!
  if (nextSelection.length === 1 && candidateCard.rank === 'JOKER') {
    const remainingHand = fullHand.filter((c) => c.id !== candidateCard.id);
    return remainingHand.some(
      (other) => validateCadenaChain(currentNumber, [candidateCard, other]).valid
    );
  }

  return false;
}

/**
 * Identifies which selected card(s) break a sequence and which prefix of valid cards
 * should remain selected when the player attempts to confirm an invalid/incomplete sequence.
 */
export function findInvalidCardsInSelection(
  currentNumber: number,
  selectedCards: Card[],
  fullHand: Card[],
  requiredFirstCardId?: string | null
): {
  invalidCardIds: string[];
  validPrefixCardIds: string[];
} {
  if (selectedCards.length === 0) {
    return { invalidCardIds: [], validPrefixCardIds: [] };
  }

  if (requiredFirstCardId && selectedCards[0].id !== requiredFirstCardId) {
    return {
      invalidCardIds: [selectedCards[0].id],
      validPrefixCardIds: [],
    };
  }

  // If the entire sequence is only JOKER(s) without a numeric anchor yet,
  // shake the JOKER card(s) to indicate they need a numeric card, while keeping them selected
  if (selectedCards.every((c) => c.rank === 'JOKER')) {
    return {
      invalidCardIds: selectedCards.map((c) => c.id),
      validPrefixCardIds: selectedCards.map((c) => c.id),
    };
  }

  // Walk through the selected cards to find the longest valid prefix
  const validPrefix: Card[] = [];
  for (let i = 0; i < selectedCards.length; i++) {
    const candidate = selectedCards[i];
    if (canAppendCardToSelection(currentNumber, validPrefix, candidate, fullHand)) {
      validPrefix.push(candidate);
    } else {
      // First card that breaks the sequence!
      return {
        invalidCardIds: [candidate.id],
        validPrefixCardIds: validPrefix.map((c) => c.id),
      };
    }
  }

  // If all prefixes were appendable but final validation still failed
  const finalCheck = validateCadenaChain(currentNumber, selectedCards);
  if (!finalCheck.valid) {
    const lastCard = selectedCards[selectedCards.length - 1];
    return {
      invalidCardIds: [lastCard.id],
      validPrefixCardIds: selectedCards.slice(0, -1).map((c) => c.id),
    };
  }

  return {
    invalidCardIds: [],
    validPrefixCardIds: selectedCards.map((c) => c.id),
  };
}

