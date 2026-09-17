import { BlackCard } from '../types';
import rawBlackCards from './blackCardsData.json';

export const ALL_BLACK_CARDS: BlackCard[] = rawBlackCards as BlackCard[];

/**
 * Picks a random black card that hasn't been used yet in the match.
 * If all cards in the deck have been used, resets and uses all cards.
 */
export function getNextBlackCard(usedCardIds: Set<string>): BlackCard {
  const unused = ALL_BLACK_CARDS.filter((card) => !usedCardIds.has(card.id));
  const pool = unused.length > 0 ? unused : ALL_BLACK_CARDS;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}
