import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createRequire } from 'module';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const require = createRequire(import.meta.url);

// Load Spanish dictionary (636,598 authentic words)
let spanishDictionarySet: Set<string> | null = null;
try {
  const wordsList: string[] = require('an-array-of-spanish-words');
  spanishDictionarySet = new Set(wordsList);
  console.log(`[Diccionario] Cargadas ${spanishDictionarySet.size} palabras españolas.`);
} catch (e) {
  console.error('[Diccionario] Error cargando an-array-of-spanish-words:', e);
}

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-initialized Gemini client (only used as optional fallback for rare slang/modern words)
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

function normalizeSimple(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics / accents
    .replace(/[^a-zñ]/g, ''); // keep only spanish alphabet
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    dictionaryWordsCount: spanishDictionarySet?.size || 0,
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Real Spanish Word & Sequence Validation Endpoint
app.post('/api/validate-word', async (req, res) => {
  try {
    const { word, sequence, usedWords = [] } = req.body;

    if (!word || typeof word !== 'string') {
      return res.status(400).json({
        valid: false,
        reason: 'Palabra no proporcionada',
        errorType: 'INVALID_INPUT',
      });
    }

    const trimmedWord = word.trim();
    const normWord = normalizeSimple(trimmedWord);
    const normSeq = sequence ? normalizeSimple(sequence) : '';

    // 1. Format check
    if (normWord.length < 2) {
      return res.json({
        valid: false,
        canonicalWord: trimmedWord,
        reason: 'Demasiado corta',
        errorType: 'TOO_SHORT',
      });
    }

    // 2. Sequence check (deterministic & instant)
    if (normSeq && !normWord.includes(normSeq)) {
      return res.json({
        valid: false,
        canonicalWord: trimmedWord,
        reason: `NO CONTIENE «${sequence.toUpperCase()}»`,
        errorType: 'NO_SEQUENCE',
      });
    }

    // 3. Duplicate check (case & accent insensitive)
    const isDuplicate = usedWords.some(
      (w: string) => normalizeSimple(w) === normWord
    );
    if (isDuplicate) {
      return res.json({
        valid: false,
        canonicalWord: trimmedWord,
        reason: 'YA SE HA DICHO',
        errorType: 'DUPLICATE',
        duplicate: true,
      });
    }

    // 4. Real Spanish Word Check in local dictionary (0.001 ms)
    if (spanishDictionarySet && spanishDictionarySet.has(normWord)) {
      return res.json({
        valid: true,
        canonicalWord: trimmedWord.toLowerCase(),
        reason: 'Palabra aceptada',
      });
    }

    // 5. Fallback: If not in dictionary, check if Gemini is available for colloquial/regional words
    // Fallback: Optional AI check for modern slang, neologisms or colloquial forms with 2.5s timeout
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
          setTimeout(() => reject(new Error('AI timeout')), 2500)
        );

        const response: any = await Promise.race([generatePromise, timeoutPromise]);

        if (response?.text) {
          const parsed = JSON.parse(response.text);
          if (parsed.isRealWord) {
            return res.json({
              valid: true,
              canonicalWord: parsed.canonicalWord || trimmedWord.toLowerCase(),
              reason: 'Palabra aceptada',
            });
          }
        }
      } catch (aiErr) {
        console.warn('Gemini fallback check error/timeout:', aiErr);
      }
    }

    // If not in 636k words dictionary and not approved by AI, reject
    return res.json({
      valid: false,
      canonicalWord: trimmedWord,
      reason: `«${trimmedWord.toUpperCase()}» no es una palabra válida`,
      errorType: 'NOT_A_WORD',
    });
  } catch (error) {
    console.error('Error in /api/validate-word:', error);
    return res.status(500).json({
      valid: false,
      reason: 'Error al validar la palabra',
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
