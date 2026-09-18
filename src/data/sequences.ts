import { LetterSequence } from '../types';
import sequencesData from './sequencesData.json';

export const SEQUENCES: LetterSequence[] = sequencesData as LetterSequence[];

// Precomputed fast index for lookup
export const SEQUENCE_INDEX: Record<string, LetterSequence> = {};
for (const item of SEQUENCES) {
  SEQUENCE_INDEX[item.sequence] = item;
}

// Separate pools by difficulty
const easyPool = SEQUENCES.filter((s) => s.difficulty === 'EASY');
const normalPool = SEQUENCES.filter((s) => s.difficulty === 'NORMAL');
const hardPool = SEQUENCES.filter((s) => s.difficulty === 'HARD');

/**
 * Check if two sequences are too similar phonetically or structurally
 * Examples of similar:
 * - TRA and TR (substring)
 * - TRA and ATR (anagram)
 * - TRA and RAT (same letters)
 * - BLA and BLE (consonant skeleton identical with just 1 vowel changed if 3-letter)
 */
export function isSimilarSequence(s1?: string, s2?: string): boolean {
  if (!s1 || !s2) return false;
  if (s1 === s2) return true;

  const a = s1.toUpperCase();
  const b = s2.toUpperCase();

  // Substring check (e.g. TRA vs TR, ADO vs AD)
  if (a.includes(b) || b.includes(a)) return true;

  // Anagram / same letter set check (e.g. TRA vs ATR or RAT)
  if (a.length === b.length) {
    const sortedA = a.split('').sort().join('');
    const sortedB = b.split('').sort().join('');
    if (sortedA === sortedB) return true;
  }

  // If both start with the same 2 consonants (e.g. TRA and TRO, CLA and CLO)
  if (a.length >= 2 && b.length >= 2 && a.slice(0, 2) === b.slice(0, 2)) {
    return true;
  }

  return false;
}

export interface GetNextSequenceOptions {
  usedSequences?: Set<string>;
  previousSequence?: string;
  playerRecentSequences?: string[];
  preferredDifficulty?: 'EASY' | 'NORMAL' | 'HARD';
}

export interface SequenceChallenge {
  challengeId: string;
  sequence: LetterSequence;
}

// In-memory shuffle bags for non-repeating sequence selection
class ShuffleBag<T> {
  private items: T[];
  private currentBag: T[] = [];

  constructor(items: T[]) {
    this.items = [...items];
    this.refill();
  }

  private refill() {
    this.currentBag = [...this.items];
    // Fisher-Yates shuffle
    for (let i = this.currentBag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = this.currentBag[i];
      this.currentBag[i] = this.currentBag[j];
      this.currentBag[j] = temp;
    }
  }

  next(): T {
    if (this.currentBag.length === 0) {
      this.refill();
    }
    return this.currentBag.pop()!;
  }
}

const easyBag = new ShuffleBag(easyPool);
const normalBag = new ShuffleBag(normalPool);
const hardBag = new ShuffleBag(hardPool);

export function generateChallengeId(seq: string): string {
  return `chal-${seq.toUpperCase()}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Generates the next letter sequence according to difficulty weights (45% Fácil, 40% Normal, 15% Difícil),
 * ensuring high replayability across thousands of Spanish word combinations and avoiding consecutive similarity.
 */
export function getNextSequence(options: GetNextSequenceOptions = {}): LetterSequence {
  const {
    usedSequences,
    previousSequence,
    playerRecentSequences,
    preferredDifficulty,
  } = options;

  // 1. Determine target difficulty according to weighted distribution (45% EASY, 40% NORMAL, 15% HARD)
  let targetDifficulty = preferredDifficulty;
  if (!targetDifficulty) {
    const roll = Math.random();
    if (roll < 0.45) {
      targetDifficulty = 'EASY';
    } else if (roll < 0.85) {
      targetDifficulty = 'NORMAL';
    } else {
      targetDifficulty = 'HARD';
    }
  }

  const primaryPool =
    targetDifficulty === 'EASY'
      ? easyPool
      : targetDifficulty === 'NORMAL'
      ? normalPool
      : hardPool;

  // 2. Filter candidates strictly
  let candidates = primaryPool.filter((item) => {
    const seq = item.sequence;
    if (usedSequences && usedSequences.has(seq)) return false;
    if (previousSequence && isSimilarSequence(seq, previousSequence)) return false;
    if (playerRecentSequences && playerRecentSequences.includes(seq)) return false;
    return true;
  });

  // 3. If primary pool strictly exhausted, relax playerRecentSequences
  if (candidates.length === 0) {
    candidates = primaryPool.filter((item) => {
      const seq = item.sequence;
      if (usedSequences && usedSequences.has(seq)) return false;
      if (previousSequence && isSimilarSequence(seq, previousSequence)) return false;
      return true;
    });
  }

  // 4. If still empty, use the corresponding shuffle bag
  if (candidates.length === 0) {
    const bag =
      targetDifficulty === 'EASY'
        ? easyBag
        : targetDifficulty === 'NORMAL'
        ? normalBag
        : hardBag;

    // Try a few picks from the bag to avoid immediate similarity
    for (let attempts = 0; attempts < 15; attempts++) {
      const candidate = bag.next();
      if (!previousSequence || !isSimilarSequence(candidate.sequence, previousSequence)) {
        return candidate;
      }
    }
  }

  // 5. If still empty, search across all pools without usedSequences constraint (resetting cycle)
  if (candidates.length === 0) {
    candidates = SEQUENCES.filter((item) => {
      const seq = item.sequence;
      if (previousSequence && isSimilarSequence(seq, previousSequence)) return false;
      return true;
    });
  }

  // 6. Absolute fallback
  if (candidates.length === 0) {
    candidates = SEQUENCES.filter((item) => item.sequence !== previousSequence);
  }

  if (candidates.length === 0) {
    return SEQUENCES[0];
  }

  const pickedIndex = Math.floor(Math.random() * candidates.length);
  return candidates[pickedIndex];
}

/**
 * Creates a unique challenge pairing a letter sequence with a stable challengeId.
 */
export function createSequenceChallenge(options: GetNextSequenceOptions = {}): SequenceChallenge {
  const sequence = getNextSequence(options);
  return {
    challengeId: generateChallengeId(sequence.sequence),
    sequence,
  };
}

/**
 * Backward compatible helper
 */
export function getRandomSequence(previousSequence?: string): LetterSequence {
  return getNextSequence({ previousSequence });
}
