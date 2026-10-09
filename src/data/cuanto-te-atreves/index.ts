import { CuantoTeAtrevesTopic } from '../../types/cuantoTeAtreves';
import { ENTERTAINMENT_TOPICS } from './entertainmentTopics';
import { CULTURE_MEDIA_TOPICS } from './cultureMediaTopics';
import { SPORTS_GEOGRAPHY_TOPICS } from './sportsGeographyTopics';
import { LIFESTYLE_FOOD_TOPICS } from './lifestyleFoodTopics';
import { KNOWLEDGE_NATURE_TOPICS } from './knowledgeNatureTopics';

// ============================================================================
// CONSOLIDACIÓN DEL DATASET DE RETOS VERBALES: ¿CUÁNTO TE ATREVES?
// Total: 640 temas reales, contrastados, diversos y sin duplicados
// ============================================================================

export const CUANTO_TE_ATREVES_TOPICS: CuantoTeAtrevesTopic[] = [
  ...ENTERTAINMENT_TOPICS,
  ...CULTURE_MEDIA_TOPICS,
  ...SPORTS_GEOGRAPHY_TOPICS,
  ...LIFESTYLE_FOOD_TOPICS,
  ...KNOWLEDGE_NATURE_TOPICS,
];

// Comprobación de integridad y unicidad de identificadores
const topicIdMap = new Map<string, CuantoTeAtrevesTopic>();
CUANTO_TE_ATREVES_TOPICS.forEach((t) => {
  if (topicIdMap.has(t.id)) {
    console.warn(`[CuantoTeAtreves] ID duplicado detectado: ${t.id}`);
  }
  topicIdMap.set(t.id, t);
});

export const TOTAL_TOPICS_COUNT = CUANTO_TE_ATREVES_TOPICS.length;

// Lista de categorías internas para balanceo automático
export const CUANTO_TE_ATREVES_CATEGORIES = [
  'videojuegos',
  'cine',
  'series-tv',
  'animacion',
  'internet-streamers',
  'musica',
  'personajes-ficcion',
  'infancia-nostalgia',
  'ocio-hobbies',
  'fiestas-tradiciones',
  'futbol',
  'deportes',
  'geografia-paises',
  'geografia-ciudades',
  'viajes-lugares',
  'comida-platos',
  'comida-ingredientes',
  'marcas-empresas',
  'objetos-hogar',
  'transporte-vehiculos',
  'animales-terrestres',
  'animales-marinos',
  'tecnologia-apps',
  'colegio-conocimiento',
  'profesiones',
] as const;

/**
 * Algoritmo autoritativo de selección equilibrada:
 * 1. Filtra los temas ya usados en la partida actual.
 * 2. Si se agotan todos los temas, reinicia el ciclo evitando repetir el último jugado.
 * 3. Prioriza categorías distintas a las últimas jugadas (ventana de 3 a 5 retos previos)
 *    para garantizar variedad temática continua.
 */
export function pickBalancedTopic(
  usedTopicIds: Set<string>,
  recentCategories: string[] = []
): { topic: CuantoTeAtrevesTopic; recycled: boolean } {
  let available = CUANTO_TE_ATREVES_TOPICS.filter((t) => !usedTopicIds.has(t.id));
  let recycled = false;

  // Si se han agotado todos los más de 600 temas en una partida maratoniana
  if (available.length === 0) {
    usedTopicIds.clear();
    available = [...CUANTO_TE_ATREVES_TOPICS];
    recycled = true;
  }

  // Filtrar por categorías que NO estén en la ventana reciente
  const recentSet = new Set(recentCategories.slice(-4));
  const balancedCandidates = available.filter((t) => !recentSet.has(t.category));

  const candidatePool = balancedCandidates.length > 0 ? balancedCandidates : available;
  const randomIndex = Math.floor(Math.random() * candidatePool.length);
  const selected = candidatePool[randomIndex];

  usedTopicIds.add(selected.id);
  return { topic: selected, recycled };
}
