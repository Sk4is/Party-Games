import { EMOJI_MOVIES, EmojiMovieItem } from './emojiMovies';
import { EMOJI_VIDEOGAMES, EmojiVideogameItem } from './emojiVideogames';
import { PASSWORD_WORDS, PasswordWordItem } from './passwordWords';
import { PALABRA_SECRETA_WORDS, getRandomWord, shuffleWords } from '../palabraSecretaWords';

export * from './emojiMovies';
export * from './emojiVideogames';
export * from './passwordWords';
export { PALABRA_SECRETA_WORDS, getRandomWord, shuffleWords };

export type EmojiItem = (EmojiMovieItem | EmojiVideogameItem);

/**
 * Returns 3 fresh distinct emoji candidate options for the descriptor
 */
export function getEmojiCandidateOptions(
  category: 'CINEMA' | 'VIDEOGAMES' | 'BOTH',
  usedIds: Set<string>
): EmojiItem[] {
  let pool: EmojiItem[] = [];

  if (category === 'CINEMA') {
    pool = [...EMOJI_MOVIES];
  } else if (category === 'VIDEOGAMES') {
    pool = [...EMOJI_VIDEOGAMES];
  } else {
    pool = [...EMOJI_MOVIES, ...EMOJI_VIDEOGAMES];
  }

  // Filter out used IDs
  let eligible = pool.filter((item) => !usedIds.has(item.id));

  // If pool exhausted during a very long match, reset used pool
  if (eligible.length < 3) {
    eligible = pool;
  }

  const shuffled = shuffleWords(eligible);
  return shuffled.slice(0, 3);
}

/**
 * Returns 10 fresh password target words
 */
export function getPasswordTargets(count: number = 10, usedIds: Set<string>): PasswordWordItem[] {
  let eligible = PASSWORD_WORDS.filter((item) => !usedIds.has(item.id));
  if (eligible.length < count) {
    eligible = [...PASSWORD_WORDS];
  }
  const shuffled = shuffleWords(eligible);
  return shuffled.slice(0, count);
}
