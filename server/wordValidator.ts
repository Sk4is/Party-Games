import { createRequire } from 'module';
import { GoogleGenAI, Type } from '@google/genai';

const require = createRequire(import.meta.url);

let spanishDictionarySet: Set<string> | null = null;
try {
  const wordsList: string[] = require('an-array-of-spanish-words');
  spanishDictionarySet = new Set(wordsList);
} catch (e) {
  console.error('[wordValidator] Error cargando an-array-of-spanish-words:', e);
}

let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

export function normalizeSimple(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents
    .replace(/[^a-zñ]/g, ''); // keep only spanish letters
}

export interface ServerValidationResult {
  valid: boolean;
  canonicalWord: string;
  reason?: string;
  errorType?: 'TOO_SHORT' | 'NO_SEQUENCE' | 'DUPLICATE' | 'NOT_A_WORD' | null;
}

export async function validateSpanishWordServer(
  word: string,
  sequence?: string,
  usedWords: string[] = []
): Promise<ServerValidationResult> {
  const trimmedWord = (word || '').trim();
  const normWord = normalizeSimple(trimmedWord);
  const normSeq = sequence ? normalizeSimple(sequence) : '';

  // 1. Length check
  if (normWord.length < 2) {
    return {
      valid: false,
      canonicalWord: trimmedWord,
      reason: 'Demasiado corta',
      errorType: 'TOO_SHORT',
    };
  }

  // 2. Sequence check
  if (normSeq && !normWord.includes(normSeq)) {
    return {
      valid: false,
      canonicalWord: trimmedWord,
      reason: `NO CONTIENE «${sequence?.toUpperCase()}»`,
      errorType: 'NO_SEQUENCE',
    };
  }

  // 3. Duplicate check
  const isDuplicate = usedWords.some(
    (w) => normalizeSimple(w) === normWord
  );
  if (isDuplicate) {
    return {
      valid: false,
      canonicalWord: trimmedWord,
      reason: 'YA SE HA DICHO',
      errorType: 'DUPLICATE',
    };
  }

  // 4. Dictionary set lookup
  if (spanishDictionarySet && spanishDictionarySet.has(normWord)) {
    return {
      valid: true,
      canonicalWord: trimmedWord.toLowerCase(),
      reason: 'Palabra aceptada',
    };
  }

  // 5. Optional Gemini fallback
  const ai = getAIClient();
  if (ai) {
    try {
      const prompt = `Determina si la siguiente cadena es una PALABRA REAL Y EXISTENTE en español (sustantivo, verbo conjugado, adjetivo, jerga real o adverbio).
Cadena a evaluar: "${trimmedWord}".
No admitas nombres propios de personas, marcas ni cadenas aleatorias inventadas.
Devuelve JSON: { "isRealWord": boolean, "canonicalWord": string }`;

      const generatePromise = ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isRealWord: { type: Type.BOOLEAN },
              canonicalWord: { type: Type.STRING },
            },
            required: ['isRealWord', 'canonicalWord'],
          },
        },
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI timeout')), 2200)
      );

      const response: any = await Promise.race([generatePromise, timeoutPromise]);
      if (response?.text) {
        const parsed = JSON.parse(response.text);
        if (parsed.isRealWord) {
          return {
            valid: true,
            canonicalWord: parsed.canonicalWord || trimmedWord.toLowerCase(),
            reason: 'Palabra aceptada',
          };
        }
      }
    } catch {
      // fallback failed/timed out, proceed to reject
    }
  }

  return {
    valid: false,
    canonicalWord: trimmedWord,
    reason: `«${trimmedWord.toUpperCase()}» no es una palabra válida`,
    errorType: 'NOT_A_WORD',
  };
}
