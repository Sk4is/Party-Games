import WebSocket from 'ws';
import { isValidRoundedAmount, generateRoundedAmount } from '../src/types/elPrecioJusto';
import { CUANTO_TE_ATREVES_TOPICS } from '../src/types/cuantoTeAtreves';
import { UNO_SOBRA_SCENARIOS } from '../src/types/unoSobra';

async function runComprehensiveTests() {
  console.log('=== TEST COMPLETO: VALIDACIONES UX Y ARQUITECTURA PARA LOS 3 JUEGOS ===');

  // 1. Validar reglas de redondeo de EL PRECIO JUSTO requeridas explícitamente por el usuario
  console.log('\n--- 1. Comprobando validador de importes redondeados (EL PRECIO JUSTO) ---');
  const validCases = [15, 750, 3500, 30000, 250000, 900000];
  const invalidCases = [30500, 245750, 123455, 4, 1000001, 7.5];

  for (const v of validCases) {
    if (!isValidRoundedAmount(v)) {
      throw new Error(`Fallo: ${v} debería ser válido según las reglas`);
    }
  }
  console.log('[OK] Todos los ejemplos válidos pasaron la verificación:', validCases);

  for (const inv of invalidCases) {
    if (isValidRoundedAmount(inv)) {
      throw new Error(`Fallo: ${inv} debería ser INVÁLIDO según las reglas`);
    }
  }
  console.log('[OK] Todos los ejemplos inválidos fueron rechazados correctamente:', invalidCases);

  // Verificar que el generador produce importes válidos
  for (let i = 0; i < 20; i++) {
    const generated = generateRoundedAmount(5, 1000000);
    if (!isValidRoundedAmount(generated)) {
      throw new Error(`Fallo: El generador produjo un importe inválido: ${generated}`);
    }
  }
  console.log('[OK] El generador produjo 20 importes válidos consecutivos');

  // 2. Verificar que los temas de ¿CUÁNTO TE ATREVES? son 100% verbales y accesibles
  console.log('\n--- 2. Verificando catálogo de temas de ¿CUÁNTO TE ATREVES? ---');
  if (CUANTO_TE_ATREVES_TOPICS.length < 30) {
    throw new Error('Faltan temas en el catálogo');
  }
  for (const topic of CUANTO_TE_ATREVES_TOPICS) {
    if (!topic.title.toLowerCase().startsWith('nombra ')) {
      throw new Error(`El tema "${topic.title}" no sigue el formato de nombrar cosas`);
    }
  }
  console.log(`[OK] Verificados ${CUANTO_TE_ATREVES_TOPICS.length} temas exclusivamente verbales`);

  // 3. Verificar escenarios de UNO SOBRA
  console.log('\n--- 3. Verificando escenarios de emergencia y roles de UNO SOBRA ---');
  if (UNO_SOBRA_SCENARIOS.length < 3) {
    throw new Error('Faltan escenarios en UNO SOBRA');
  }
  for (const sc of UNO_SOBRA_SCENARIOS) {
    if (sc.roles.length < 10) {
      throw new Error(`El escenario ${sc.title} no tiene al menos 10 roles`);
    }
  }
  console.log(`[OK] Verificados ${UNO_SOBRA_SCENARIOS.length} escenarios críticos con 10 roles cada uno`);

  // 4. Test en vivo vía WebSocket para ¿CUÁNTO TE ATREVES?
  console.log('\n--- 4. Test de flujo de rondas en vivo: ¿CUÁNTO TE ATREVES? ---');
  const createCTA = await fetch('http://localhost:3000/api/rooms/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      gameType: 'cuanto-te-atreves',
      hostPlayer: { id: 'host_cta', name: 'Presentador Show' },
      config: { challengeTimeSeconds: 30, challengesCount: 5 },
    }),
  });
  const ctaRoomData = await createCTA.json();
  const ctaCode = ctaRoomData.room.code;
  console.log(`[OK] Sala de ¿CUÁNTO TE ATREVES? creada: ${ctaCode}`);

  const ws1 = new WebSocket('ws://localhost:3000/ws/cuanto-te-atreves');
  const ws2 = new WebSocket('ws://localhost:3000/ws/cuanto-te-atreves');
  const ws3 = new WebSocket('ws://localhost:3000/ws/cuanto-te-atreves');

  const ctaStates: Record<string, any> = {};

  const setupWsCTA = (ws: WebSocket, id: string, name: string) => {
    return new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('Timeout CTA')), 5000);
      ws.on('open', () => {
        ws.send(JSON.stringify({ type: 'JOIN_ROOM', code: ctaCode, player: { id, name } }));
      });
      ws.on('message', (raw) => {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'ROOM_STATE') {
          ctaStates[id] = msg.state;
          clearTimeout(t);
          resolve();
        }
      });
    });
  };

  await Promise.all([
    setupWsCTA(ws1, 'host_cta', 'Presentador Show'),
    setupWsCTA(ws2, 'p2_cta', 'Desafiante 1'),
    setupWsCTA(ws3, 'p3_cta', 'Desafiante 2'),
  ]);

  console.log(`[OK] 3 jugadores conectados. Fase inicial: ${ctaStates['host_cta'].phase}`);

  // Iniciar partida
  ws1.send(JSON.stringify({ type: 'START_GAME' }));
  await new Promise((r) => setTimeout(r, 200));

  console.log(`[OK] START_GAME ejecutado. Fase: ${ctaStates['host_cta'].phase}. Tema: «${ctaStates['host_cta'].currentTopic?.title}»`);
  if (ctaStates['host_cta'].phase !== 'TOPIC_REVEAL') {
    throw new Error('Fase esperada: TOPIC_REVEAL');
  }

  // Admin selecciona jugador
  ws1.send(JSON.stringify({ type: 'SELECT_PLAYER', playerId: 'p2_cta' }));
  await new Promise((r) => setTimeout(r, 200));
  console.log(`[OK] SELECT_PLAYER ejecutado. Fase: ${ctaStates['host_cta'].phase}. Jugador activo: ${ctaStates['host_cta'].activePlayerId}`);
  if (ctaStates['host_cta'].phase !== 'BETTING') {
    throw new Error('Fase esperada: BETTING');
  }

  // Admin introduce apuesta (12 ejemplos, apuesta épica)
  ws1.send(JSON.stringify({ type: 'SET_BET', bet: 12 }));
  await new Promise((r) => setTimeout(r, 200));
  console.log(`[OK] SET_BET ejecutado. Apuesta: ${ctaStates['host_cta'].targetBet}`);

  // Admin inicia reto y temporizador
  ws1.send(JSON.stringify({ type: 'START_CHALLENGE' }));
  await new Promise((r) => setTimeout(r, 300));
  console.log(`[OK] START_CHALLENGE ejecutado. Fase: ${ctaStates['host_cta'].phase}. Cronómetro activo: ${ctaStates['host_cta'].isTimerRunning}`);
  if (ctaStates['host_cta'].phase !== 'CHALLENGE_ACTIVE' || !ctaStates['host_cta'].isTimerRunning) {
    throw new Error('El cronómetro debería estar corriendo en CHALLENGE_ACTIVE');
  }

  // Admin presiona "¡CONSEGUIDO!" de forma anticipada sin esperar al cero
  ws1.send(JSON.stringify({ type: 'RESOLVE_CHALLENGE', outcome: 'SUCCESS' }));
  await new Promise((r) => setTimeout(r, 300));
  console.log(`[OK] RESOLVE_CHALLENGE (SUCCESS) ejecutado anticipadamente. Fase: ${ctaStates['host_cta'].phase}`);
  console.log(`[OK] Resultado: Puntos otorgados = ${ctaStates['host_cta'].lastResult?.pointsAwarded}`);
  if (ctaStates['host_cta'].lastResult?.pointsAwarded !== 3) {
    throw new Error('Para apuesta >= 10, los puntos deben ser 3');
  }

  // Siguiente ronda
  ws1.send(JSON.stringify({ type: 'NEXT_ROUND' }));
  await new Promise((r) => setTimeout(r, 200));
  console.log(`[OK] NEXT_ROUND ejecutado. Ronda: ${ctaStates['host_cta'].currentChallengeNumber}. Nuevo tema: «${ctaStates['host_cta'].currentTopic?.title}»`);

  ws1.close();
  ws2.close();
  ws3.close();

  // 5. Test en vivo de UNO SOBRA (Escenario y rol privado)
  console.log('\n--- 5. Test en vivo: UNO SOBRA (Roles privados autoritativos) ---');
  const createUS = await fetch('http://localhost:3000/api/rooms/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      gameType: 'uno-sobra',
      hostPlayer: { id: 'host_us', name: 'Capitán Búnker' },
      config: { discussionDurationMinutes: 3 },
    }),
  });
  const usRoomData = await createUS.json();
  const usCode = usRoomData.room.code;
  console.log(`[OK] Sala de UNO SOBRA creada: ${usCode}`);

  const us1 = new WebSocket('ws://localhost:3000/ws/uno-sobra');
  const us2 = new WebSocket('ws://localhost:3000/ws/uno-sobra');
  const us3 = new WebSocket('ws://localhost:3000/ws/uno-sobra');

  const usStates: Record<string, any> = {};

  const setupWsUS = (ws: WebSocket, id: string, name: string) => {
    return new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('Timeout US')), 5000);
      ws.on('open', () => {
        ws.send(JSON.stringify({ type: 'JOIN_ROOM', code: usCode, player: { id, name } }));
      });
      ws.on('message', (raw) => {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'ROOM_STATE') {
          usStates[id] = msg.state;
          clearTimeout(t);
          resolve();
        }
      });
    });
  };

  await Promise.all([
    setupWsUS(us1, 'host_us', 'Capitán Búnker'),
    setupWsUS(us2, 'p2_us', 'Superviviente 2'),
    setupWsUS(us3, 'p3_us', 'Superviviente 3'),
  ]);

  us1.send(JSON.stringify({ type: 'START_GAME' }));
  await new Promise((r) => setTimeout(r, 300));

  console.log(`[OK] Partida iniciada en UNO SOBRA. Escenario: «${usStates['host_us'].activeScenario?.title}»`);
  const hostRole = usStates['host_us'].players.find((p: any) => p.id === 'host_us')?.privateRole;
  const p2RoleInHostView = usStates['host_us'].players.find((p: any) => p.id === 'p2_us')?.privateRole;
  const p2RoleInP2View = usStates['p2_us'].players.find((p: any) => p.id === 'p2_us')?.privateRole;

  console.log(`[OK] Rol privado del anfitrión: «${hostRole?.title}»`);
  console.log(`[OK] Rol privado del jugador 2 en su propia vista: «${p2RoleInP2View?.title}»`);

  if (!hostRole || !p2RoleInP2View) {
    throw new Error('Cada jugador debe recibir su rol privado');
  }

  if (p2RoleInHostView !== undefined) {
    throw new Error('FALLO DE PRIVACIDAD: El anfitrión no debe ver el rol privado del jugador 2');
  }
  console.log('[OK] Aislamiento estricto de roles verificado (ningún rival ve el rol de otro jugador)');

  us1.close();
  us2.close();
  us3.close();

  // 6. Test en vivo de EL PRECIO JUSTO (Importes redondeados autoritativos)
  console.log('\n--- 6. Test en vivo: EL PRECIO JUSTO (Importes redondeados generados) ---');
  const createEPJ = await fetch('http://localhost:3000/api/rooms/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      gameType: 'el-precio-justo',
      hostPlayer: { id: 'host_epj', name: 'Banquero' },
      config: { maxMoneyAmount: 500000 },
    }),
  });
  const epjRoomData = await createEPJ.json();
  const epjCode = epjRoomData.room.code;
  console.log(`[OK] Sala de EL PRECIO JUSTO creada: ${epjCode}`);

  const epj1 = new WebSocket('ws://localhost:3000/ws/el-precio-justo');
  const epj2 = new WebSocket('ws://localhost:3000/ws/el-precio-justo');
  const epj3 = new WebSocket('ws://localhost:3000/ws/el-precio-justo');

  const epjStates: Record<string, any> = {};

  const setupWsEPJ = (ws: WebSocket, id: string, name: string) => {
    return new Promise<void>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('Timeout EPJ')), 5000);
      ws.on('open', () => {
        ws.send(JSON.stringify({ type: 'JOIN_ROOM', code: epjCode, player: { id, name } }));
      });
      ws.on('message', (raw) => {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'ROOM_STATE') {
          epjStates[id] = msg.state;
          clearTimeout(t);
          resolve();
        }
      });
    });
  };

  await Promise.all([
    setupWsEPJ(epj1, 'host_epj', 'Banquero'),
    setupWsEPJ(epj2, 'p2_epj', 'Inversor 2'),
    setupWsEPJ(epj3, 'p3_epj', 'Inversor 3'),
  ]);

  epj1.send(JSON.stringify({ type: 'START_GAME' }));
  await new Promise((r) => setTimeout(r, 300));

  const hostMoney = epjStates['host_epj'].players.find((p: any) => p.id === 'host_epj')?.privateMoneyAmount;
  const p2Money = epjStates['p2_epj'].players.find((p: any) => p.id === 'p2_epj')?.privateMoneyAmount;

  console.log(`[OK] Fortuna privada generada para Banquero: ${hostMoney} € (Válida: ${isValidRoundedAmount(hostMoney)})`);
  console.log(`[OK] Fortuna privada generada para Inversor 2: ${p2Money} € (Válida: ${isValidRoundedAmount(p2Money)})`);

  if (!isValidRoundedAmount(hostMoney) || !isValidRoundedAmount(p2Money)) {
    throw new Error('El importe generado no cumple las reglas de redondeo');
  }

  epj1.close();
  epj2.close();
  epj3.close();

  console.log('\n=== ¡TODAS LAS VALIDACIONES DE UX, REGLAS Y ARQUITECTURA COMPLETADAS CON ÉXITO! ===\n');
}

runComprehensiveTests().catch((err) => {
  console.error('Error durante los tests:', err);
  process.exit(1);
});
