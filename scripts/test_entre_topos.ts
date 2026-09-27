import WebSocket from 'ws';

async function testEntreToposFlow() {
  console.log('--- Iniciando prueba de Entre Topos ---');

  const createRes = await fetch('http://localhost:3000/api/rooms/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      gameType: 'entre-topos',
      hostPlayer: { id: 'p1', name: 'Jugador 1 (Host)', avatar: '🕵️', color: '#f59e0b' },
    }),
  });
  const createData = await createRes.json();
  const roomCode = createData.room.code;
  console.log(`Sala creada: ${roomCode}`);

  const ws1 = new WebSocket('ws://localhost:3000/ws/entre-topos');
  const ws2 = new WebSocket('ws://localhost:3000/ws/entre-topos');
  const ws3 = new WebSocket('ws://localhost:3000/ws/entre-topos');

  const states: Record<string, any> = {};

  const setupWs = (ws: WebSocket, id: string, name: string) => {
    return new Promise<void>((resolve) => {
      ws.on('open', () => {
        ws.send(
          JSON.stringify({
            type: 'JOIN_ROOM',
            code: roomCode,
            player: { id, name, moleCustomization: { hat: 'detective', face: 'bigote', clothing: 'gabardina', color: '#78523A' } },
          })
        );
      });

      ws.on('message', (raw) => {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'SYNC_STATE') {
          states[id] = msg.state;
          resolve();
        }
      });
    });
  };

  await Promise.all([
    setupWs(ws1, 'p1', 'Jugador 1'),
    setupWs(ws2, 'p2', 'Jugador 2'),
    setupWs(ws3, 'p3', 'Jugador 3'),
  ]);

  console.log('Los 3 jugadores se han unido. Estado:', states['p1']?.phase, 'Jugadores:', states['p1']?.players.length);

  // 1. Host starts the game
  ws1.send(JSON.stringify({ type: 'START_GAME' }));

  // Wait for WRITING phase (after ROUND_INTRO)
  await new Promise<void>((resolve) => {
    const handler = (raw: any) => {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'SYNC_STATE' && msg.state.phase === 'WRITING') {
        ws1.off('message', handler);
        resolve();
      }
    };
    ws1.on('message', handler);
  });

  console.log('¡Partida iniciada! Fase: WRITING');

  // 2. VERIFY INFORMATION SECURITY: Check Mole payload vs Innocent payload
  const stateP1 = states['p1'];
  const stateP2 = states['p2'];
  const stateP3 = states['p3'];

  const allStates = [stateP1, stateP2, stateP3];
  const topoState = allStates.find((s) => s.myRole === 'TOPO');
  const innocentStates = allStates.filter((s) => s.myRole === 'INOCENTE');

  console.log(`Roles asignados: 1 Topo, ${innocentStates.length} Inocentes`);
  if (!topoState) {
    throw new Error('FALLO: No se asignó ningún TOPO autoritativamente.');
  }

  // CRITICAL CHECK: Mole board MUST NOT contain secretWord
  if (topoState.board.secretWord !== undefined) {
    throw new Error(`FALLO CRÍTICO DE SEGURIDAD: El topo recibió la palabra secreta: ${topoState.board.secretWord}`);
  }
  console.log('✅ SEGURIDAD VERIFICADA: El cliente del Topo NO tiene secretWord (valor es undefined).');

  // Verify innocent DOES have secretWord
  innocentStates.forEach((innocent, idx) => {
    if (!innocent.board.secretWord) {
      throw new Error(`FALLO: El inocente ${idx + 1} no recibió la palabra secreta.`);
    }
  });
  console.log(`✅ Inocentes verificados: Tienen la palabra secreta «${innocentStates[0].board.secretWord}»`);

  // 3. Submit clues
  ws1.send(JSON.stringify({ type: 'SUBMIT_CLUE', clue: 'Pista P1' }));
  ws2.send(JSON.stringify({ type: 'SUBMIT_CLUE', clue: 'Pista P2' }));
  ws3.send(JSON.stringify({ type: 'SUBMIT_CLUE', clue: 'Pista P3' }));

  // Wait for DISCUSSION phase
  await new Promise<void>((resolve) => {
    const handler = (raw: any) => {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'SYNC_STATE' && msg.state.phase === 'DISCUSSION') {
        ws1.off('message', handler);
        resolve();
      }
    };
    ws1.on('message', handler);
  });

  console.log('¡Pistas recibidas! Fase: DISCUSSION');

  // Verify clues are now revealed
  const discussionState = states['p1'];
  const clues = discussionState.players.map((p: any) => `${p.name}: ${p.clue}`);
  console.log('Pistas reveladas:', clues.join(' | '));

  // 4. Cast votes
  const topoId = topoState.players.find((p: any) => p.role === 'TOPO')?.id || 'p2';
  ws1.send(JSON.stringify({ type: 'CAST_VOTE', targetPlayerId: topoId }));
  ws2.send(JSON.stringify({ type: 'CAST_VOTE', targetPlayerId: 'p1' }));
  ws3.send(JSON.stringify({ type: 'CAST_VOTE', targetPlayerId: topoId }));

  // Wait for VOTE_REVEAL phase
  await new Promise<void>((resolve) => {
    const handler = (raw: any) => {
      const msg = JSON.parse(raw.toString());
      if (msg.type === 'SYNC_STATE' && msg.state.phase === 'VOTE_REVEAL') {
        ws1.off('message', handler);
        resolve();
      }
    };
    ws1.on('message', handler);
  });

  console.log('¡Votos emitidos! Fase: VOTE_REVEAL');
  console.log('Acusado como topo:', states['p1'].accusedPlayerId, '¿Topo atrapado?:', states['p1'].isMoleCaught);

  ws1.close();
  ws2.close();
  ws3.close();

  console.log('--- Prueba de Entre Topos completada con éxito rotundo ---');
}

testEntreToposFlow().catch((err) => {
  console.error('Error en prueba:', err);
  process.exit(1);
});
