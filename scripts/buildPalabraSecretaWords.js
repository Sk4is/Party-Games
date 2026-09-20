import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { part1Categories } from './wordsDataPart1.js';
import { part2Categories } from './wordsDataPart2.js';
import { categoryExpansions } from './wordsExpansion.js';
import { categoryExpansions2 } from './wordsExpansion2.js';
import { categoryExpansions3 } from './wordsExpansion3.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allCategories = [...part1Categories, ...part2Categories];
const items = [];
const seenWords = new Set();

for (const cat of allCategories) {
  const catKey = cat.categoryKey;
  const catName = cat.categoryName;
  const prefix = cat.idPrefix;
  
  const wordList = [
    ...cat.words,
    ...(categoryExpansions[catKey] || []),
    ...(categoryExpansions2[catKey] || []),
    ...(categoryExpansions3[catKey] || [])
  ];

  let counter = 1;
  for (const item of wordList) {
    const cleanWord = item.w.trim();
    const upperWord = cleanWord.toUpperCase();
    if (seenWords.has(upperWord)) {
      continue;
    }
    seenWords.add(upperWord);

    items.push({
      id: `${prefix}-${counter}`,
      word: cleanWord,
      category: catName,
      forbidden: item.f
    });
    counter++;
  }
}

console.log(`Generated ${items.length} unique words across ${allCategories.length} categories.`);

const fileContent = `import { SecretWordItem } from '../types/palabraSecreta';

export const PALABRA_SECRETA_WORDS: SecretWordItem[] = ${JSON.stringify(items, null, 2)};

/**
 * Shuffles an array deterministically or pseudo-randomly
 */
export function shuffleWords<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function getRandomWord(excludeIds: Set<string> = new Set()): SecretWordItem {
  const available = PALABRA_SECRETA_WORDS.filter((w) => !excludeIds.has(w.id));
  if (available.length === 0) {
    // Reset pool if exhausted
    const idx = Math.floor(Math.random() * PALABRA_SECRETA_WORDS.length);
    return PALABRA_SECRETA_WORDS[idx];
  }
  const idx = Math.floor(Math.random() * available.length);
  return available[idx];
}
`;

const outputPath = path.join(__dirname, '../src/data/palabraSecretaWords.ts');
fs.writeFileSync(outputPath, fileContent, 'utf-8');
console.log(`Successfully written to ${outputPath}`);
