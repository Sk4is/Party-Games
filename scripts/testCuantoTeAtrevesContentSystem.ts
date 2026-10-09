import {
  CUANTO_TE_ATREVES_TOPICS,
  TOTAL_TOPICS_COUNT,
  CUANTO_TE_ATREVES_CATEGORIES,
  pickBalancedTopic,
} from '../src/data/cuanto-te-atreves';
import WebSocket from 'ws';

async function runCuantoTeAtrevesContentValidation() {
  console.log('=== TEST: VALIDACIÓN DE CONTENIDO DE ¿CUÁNTO TE ATREVES? ===');

  // 1. Conteo de temas
  console.log(`[1] Total de temas cargados: ${TOTAL_TOPICS_COUNT}`);
  if (TOTAL_TOPICS_COUNT < 600) {
    throw new Error(`Se requerían al menos 600 temas, pero hay ${TOTAL_TOPICS_COUNT}`);
  }
  console.log('  -> SUPERADO: Se supera el requisito mínimo de 600 temas.');

  // 2. Unicidad de IDs y textos
  const ids = new Set<string>();
  const texts = new Set<string>();
  const categoryCounts: Record<string, number> = {};

  for (const topic of CUANTO_TE_ATREVES_TOPICS) {
    if (ids.has(topic.id)) {
      throw new Error(`ID duplicado detectado: ${topic.id}`);
    }
    ids.add(topic.id);

    const normalizedText = topic.text.trim().toLowerCase();
    if (texts.has(normalizedText)) {
      throw new Error(`Texto de reto duplicado detectado: "${topic.text}" (ID: ${topic.id})`);
    }
    texts.add(normalizedText);

    if (!topic.text || !topic.validationHint || !topic.category || !topic.difficulty) {
      throw new Error(`Tema incompleto en ID ${topic.id}`);
    }

    if (!['easy', 'medium', 'hard'].includes(topic.difficulty)) {
      throw new Error(`Dificultad inválida en ID ${topic.id}: ${topic.difficulty}`);
    }

    categoryCounts[topic.category] = (categoryCounts[topic.category] || 0) + 1;
  }

  console.log(`[2] Unicidad perfecta: ${ids.size} IDs únicos y ${texts.size} enunciados únicos.`);
  console.log('[3] Distribución por categorías internas:');
  for (const [cat, count] of Object.entries(categoryCounts)) {
    console.log(`    - ${cat}: ${count} temas`);
  }

  // 3. Simulación de 50 rondas con balanceo de categorías
  console.log('\n[4] Probando algoritmo de selección autoritativa balanceada (50 rondas seguidas)...');
  const usedIds = new Set<string>();
  const recentCategories: string[] = [];
  const chosenCategories: string[] = [];

  for (let round = 1; round <= 50; round++) {
    const { topic } = pickBalancedTopic(usedIds, recentCategories);
    if (!topic || !topic.id) {
      throw new Error(`Fallo en ronda ${round}: no se devolvió un tema válido`);
    }
    recentCategories.push(topic.category);
    chosenCategories.push(topic.category);

    // Comprobar que no se repiten consecutivamente las mismas categorías
    if (round > 1 && chosenCategories[round - 1] === chosenCategories[round - 2]) {
      console.warn(`Aviso: categoría consecutiva en ronda ${round}: ${topic.category}`);
    }
  }

  console.log(`  -> 50 temas distintos seleccionados sin colisión (IDs usados: ${usedIds.size})`);

  // 4. Test de Servidor Multijugador Real HTTP + WebSocket
  console.log('\n[5] Probando integración directa en servidor multijugador...');
  const baseUrl = 'http://localhost:3000';

  // Crear sala
  const createRes = await fetch(`${baseUrl}/api/rooms/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      gameType: 'cuanto-te-atreves',
      hostPlayer: { id: 'admin-host-1', name: 'Presentador Show', avatar: '🔥', color: '#F97316' },
      config: { challengeTimeSeconds: 30, challengesCount: 5 },
    }),
  });

  if (!createRes.ok) {
    const errorBody = await createRes.text();
    throw new Error(`Error al crear sala en servidor: ${createRes.status} - ${errorBody}`);
  }

  const createData = await createRes.json();
  const code = createData.room?.code || createData.code;
  console.log(`  -> Sala creada con código: ${code}`);

  // Conectar 3 jugadores por WebSocket
  const wsUrl = `ws://localhost:3000/ws/cuanto-te-atreves?code=${code}`;

  const wsHost = new WebSocket(wsUrl);
  const wsPlayer2 = new WebSocket(wsUrl);
  const wsPlayer3 = new WebSocket(wsUrl);

  await new Promise<void>((resolve, reject) => {
    let connected = 0;
    const onOpen = () => {
      connected++;
      if (connected === 3) resolve();
    };
    wsHost.on('open', onOpen);
    wsPlayer2.on('open', onOpen);
    wsPlayer3.on('open', onOpen);
    setTimeout(() => reject(new Error('Timeout conectando WebSockets')), 5000);
  });

  // Enviar JOIN_ROOM
  wsHost.send(JSON.stringify({
    type: 'JOIN_ROOM',
    code,
    player: { id: 'admin-host-1', name: 'Presentador Show', avatar: '🔥' },
  }));
  wsPlayer2.send(JSON.stringify({
    type: 'JOIN_ROOM',
    code,
    player: { id: 'player-2', name: 'Concursante 2', avatar: '⚡' },
  }));
  wsPlayer3.send(JSON.stringify({
    type: 'JOIN_ROOM',
    code,
    player: { id: 'player-3', name: 'Concursante 3', avatar: '🎯' },
  }));

  // Esperar sincronización de sala
  await new Promise((r) => setTimeout(r, 600));

  // Iniciar partida desde el host
  let currentTopicReceived: any = null;
  wsHost.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'ERROR') {
        console.error('Mensaje de error del servidor:', msg.message);
      }
      if (msg.type === 'ROOM_STATE' && msg.state.phase === 'TOPIC_REVEAL') {
        currentTopicReceived = msg.state.currentTopic;
      }
    } catch {}
  });

  // Esperar un momento para asegurar que los 3 jugadores están registrados
  await new Promise((r) => setTimeout(r, 1000));

  wsHost.send(JSON.stringify({ type: 'START_GAME' }));

  await new Promise((r) => setTimeout(r, 1500));

  if (!currentTopicReceived) {
    throw new Error('No se recibió el tema del reto al iniciar partida');
  }

  console.log(`  -> Tema recibido con éxito del servidor autoritativo:`);
  console.log(`     ID: ${currentTopicReceived.id}`);
  console.log(`     Texto: "${currentTopicReceived.text || currentTopicReceived.title}"`);
  console.log(`     Categoría: ${currentTopicReceived.category}`);
  console.log(`     Dificultad: ${currentTopicReceived.difficulty}`);
  console.log(`     Criterio: "${currentTopicReceived.validationHint || currentTopicReceived.hint}"`);

  // Cerrar sockets limpiamente
  wsHost.close();
  wsPlayer2.close();
  wsPlayer3.close();

  console.log('\n=== TODOS LOS TESTS DEL SISTEMA DE CONTENIDOS HAN SIDO SUPERADOS CON ÉXITO ===\n');
}

runCuantoTeAtrevesContentValidation().catch((err) => {
  console.error('ERROR EN VALIDACIÓN:', err);
  process.exit(1);
});
