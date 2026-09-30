import { WebSocketServer, WebSocket } from 'ws';
import {
  CriptaCharacterId,
  CriptaClientMessage,
  CriptaExpeditionState,
  CriptaPlayer,
  CriptaServerMessage,
} from '../src/types/laCripta';
import {
  ALL_CRIPTA_CHARACTER_IDS,
  CRIPTA_CHARACTERS_CATALOG,
  CRIPTA_CURSOR_COLORS,
  generatePhase1ArrivalNodes,
  normalizeCriptaCharacterId,
  selectThreeDistinctDungeons,
} from '../src/data/la-cripta/criptaCatalog';
import { roomRegistry } from './roomRegistry';

interface ClientConnection {
  ws: WebSocket;
  playerId: string;
  roomCode: string;
}

interface ServerCriptaRoom extends CriptaExpeditionState {
  doorOpeningTimer: NodeJS.Timeout | null;
  disconnectTimers: Map<string, NodeJS.Timeout>;
}

const ENTERING_DUNGEON_DURATION_MS = 2350;

function buildDefaultPlayer(
  raw: { id: string; name: string; color?: string },
  seatIndex: number,
  isHost: boolean
): CriptaPlayer {
  const defaultColor =
    raw.color && typeof raw.color === 'string' && raw.color.trim()
      ? raw.color.trim()
      : CRIPTA_CURSOR_COLORS[seatIndex % CRIPTA_CURSOR_COLORS.length].hex;

  return {
    id: String(raw.id || `cripta_${seatIndex}`),
    name: String(raw.name || 'Aventurero').trim().slice(0, 22) || 'Aventurero',
    color: defaultColor,
    seatIndex,
    isHost,
    isConnected: true,
    characterId: null,
    selectedCharacterId: null,
    hp: 0,
    maxHp: 0,
    armor: 0,
    statuses: [
      {
        id: 'antorcha_viva',
        name: 'Luz de Antorcha',
        code: 'LUZ',
        type: 'buff',
      },
    ],
  };
}

export class LaCriptaServer {
  public wss: WebSocketServer;
  private rooms = new Map<string, ServerCriptaRoom>();
  private clients = new Map<WebSocket, ClientConnection>();

  constructor() {
    this.wss = new WebSocketServer({ noServer: true });
    this.wss.on('connection', (ws: WebSocket) => {
      this.handleConnection(ws);
    });
  }

  private handleConnection(ws: WebSocket) {
    ws.on('message', (data: string) => {
      try {
        const msg = JSON.parse(data.toString()) as CriptaClientMessage;
        this.handleClientMessage(ws, msg);
      } catch (err) {
        console.error('[LaCriptaServer] Error parsing message:', err);
      }
    });

    ws.on('close', () => {
      this.handleDisconnect(ws);
    });

    ws.on('error', (err) => {
      console.error('[LaCriptaServer] WebSocket error:', err);
    });
  }

  public getRoomInfo(code: string) {
    const cleanCode = String(code || '').toUpperCase().trim();
    if (!cleanCode) return null;
    const room = this.rooms.get(cleanCode);
    if (!room) return null;
    const connectedCount = room.players.filter((p) => p.isConnected).length;
    return {
      roomId: room.roomCode,
      roomCode: room.roomCode,
      code: room.roomCode,
      gameType: 'la-cripta' as const,
      hostId: room.hostId,
      phase: room.phase,
      createdAt: Date.now(),
      playersCount: connectedCount,
      totalPlayers: room.players.length,
      minPlayers: 1,
      maxPlayers: 4,
      isFull: room.players.length >= 4,
      playerIds: room.players.map((p) => p.id),
      players: room.players,
    };
  }

  public createRoomDirect(hostPlayer: {
    id: string;
    name: string;
    avatar?: string;
    color?: string;
  }): CriptaExpeditionState {
    const code = roomRegistry.generateCode();
    const host = buildDefaultPlayer(hostPlayer, 0, true);
    const seed = Math.floor(Math.random() * 2147483647);
    const initialDoors = selectThreeDistinctDungeons(seed);

    const room: ServerCriptaRoom = {
      roomId: code,
      code,
      roomCode: code,
      expeditionId: `exp_${code}_${Date.now()}`,
      seed,
      stateVersion: 1,
      gameType: 'la-cripta',
      minPlayers: 1,
      maxPlayers: 4,
      hostId: host.id,
      phase: 'LOBBY',
      players: [host],
      selectedCharacters: {
        [host.id]: null,
      },
      offeredDungeons: initialDoors,
      doorVotes: {},
      decisionResolved: false,
      voteTieWarning: false,
      initializationError: null,
      selectedDungeonId: null,
      doorOpeningStartedAt: null,
      floor: 1,
      currentNodeId: null,
      generatedNodes: [],
      doorOpeningTimer: null,
      disconnectTimers: new Map(),
    };

    this.rooms.set(code, room);
    roomRegistry.register(code, 'la-cripta', 'la-cripta');
    return this.serializeRoom(room);
  }

  private serializeRoom(room: ServerCriptaRoom): CriptaExpeditionState {
    return {
      roomId: room.roomCode,
      code: room.roomCode,
      roomCode: room.roomCode,
      expeditionId: room.expeditionId,
      seed: room.seed,
      stateVersion: room.stateVersion,
      gameType: 'la-cripta',
      minPlayers: 1,
      maxPlayers: 4,
      hostId: room.hostId,
      phase: room.phase,
      players: room.players.map((p) => ({
        ...p,
        characterId: p.characterId ?? null,
        selectedCharacterId: p.characterId ?? null,
      })),
      selectedCharacters: { ...room.selectedCharacters },
      offeredDungeons: [...room.offeredDungeons],
      doorVotes: { ...room.doorVotes },
      decisionResolved: Boolean(room.decisionResolved),
      voteTieWarning: Boolean(room.voteTieWarning),
      initializationError: room.initializationError ?? null,
      selectedDungeonId: room.selectedDungeonId,
      doorOpeningStartedAt: room.doorOpeningStartedAt,
      floor: room.floor,
      currentNodeId: room.currentNodeId,
      generatedNodes: [...room.generatedNodes],
    };
  }

  private broadcastRoomState(room: ServerCriptaRoom) {
    room.stateVersion += 1;
    const state = this.serializeRoom(room);
    const payload = JSON.stringify({
      type: 'EXPEDITION_STATE',
      state,
    } satisfies CriptaServerMessage);

    for (const [ws, client] of this.clients.entries()) {
      if (client.roomCode === room.roomCode && ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  }

  private broadcastMessage(room: ServerCriptaRoom, msg: CriptaServerMessage) {
    const payload = JSON.stringify(msg);
    for (const [ws, client] of this.clients.entries()) {
      if (client.roomCode === room.roomCode && ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  }

  private sendError(ws: WebSocket, message: string) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ERROR', message } satisfies CriptaServerMessage));
    }
  }

  private handleClientMessage(ws: WebSocket, msg: CriptaClientMessage) {
    if (!msg || typeof msg.type !== 'string') return;

    if (msg.type === 'PING') {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'PONG' } satisfies CriptaServerMessage));
      }
      return;
    }

    if (msg.type === 'JOIN_ROOM') {
      const cleanCode = String(msg.roomCode || '').toUpperCase().trim();
      const room = this.rooms.get(cleanCode);
      if (!room) {
        this.sendError(ws, 'NO SE HA ENCONTRADO ESA EXPEDICIÓN');
        return;
      }

      const incomingPlayerId = String(msg.player?.id || '').trim();
      if (!incomingPlayerId) {
        this.sendError(ws, 'IDENTIFICADOR DE JUGADOR INVÁLIDO');
        return;
      }

      const existingTimer = room.disconnectTimers.get(incomingPlayerId);
      if (existingTimer) {
        clearTimeout(existingTimer);
        room.disconnectTimers.delete(incomingPlayerId);
      }

      let player = room.players.find((p) => p.id === incomingPlayerId);
      if (!player) {
        if (room.phase !== 'LOBBY') {
          this.sendError(ws, 'LA EXPEDICIÓN YA HA COMENZADO');
          return;
        }
        if (room.players.length >= 4) {
          this.sendError(ws, 'EL GRUPO ESTÁ COMPLETO (MÁX. 4 AVENTUREROS)');
          return;
        }
        const occupiedSeats = new Set(room.players.map((p) => p.seatIndex));
        let seatIndex = 0;
        while (occupiedSeats.has(seatIndex)) seatIndex++;

        player = buildDefaultPlayer(
          {
            id: incomingPlayerId,
            name: msg.player?.name || 'Aventurero',
            color: msg.player?.color,
          },
          seatIndex,
          false
        );
        room.players.push(player);
        room.selectedCharacters[player.id] = null;
      } else {
        // Reconnecting player: preserve their character ownership!
        player.isConnected = true;
        if (msg.player?.name && String(msg.player.name).trim()) {
          player.name = String(msg.player.name).trim().slice(0, 22);
        }
        if (msg.player?.color && typeof msg.player.color === 'string') {
          player.color = msg.player.color;
        }
      }

      this.clients.set(ws, {
        ws,
        playerId: player.id,
        roomCode: room.roomCode,
      });

      this.broadcastRoomState(room);
      return;
    }

    const client = this.clients.get(ws);
    if (!client) return;
    const room = this.rooms.get(client.roomCode);
    if (!room) return;
    const player = room.players.find((p) => p.id === client.playerId);
    if (!player) return;

    switch (msg.type) {
      case 'CURSOR_MOVE': {
        const xNormalized = Math.max(0, Math.min(1, Number(msg.xNormalized) || 0));
        const yNormalized = Math.max(0, Math.min(1, Number(msg.yNormalized) || 0));
        const cursorPayload = JSON.stringify({
          type: 'CURSOR_UPDATE',
          playerId: player.id,
          name: player.name,
          color: player.color,
          xNormalized,
          yNormalized,
          sceneId: msg.sceneId,
        } satisfies CriptaServerMessage);

        for (const [peerWs, peerClient] of this.clients.entries()) {
          if (
            peerClient.roomCode === room.roomCode &&
            peerClient.playerId !== player.id &&
            peerWs.readyState === WebSocket.OPEN
          ) {
            peerWs.send(cursorPayload);
          }
        }
        break;
      }

      case 'SET_CURSOR_COLOR': {
        if (msg.color && typeof msg.color === 'string') {
          player.color = msg.color.trim();
          this.broadcastRoomState(room);
        }
        break;
      }

      case 'SELECT_CHARACTER': {
        if (room.phase !== 'LOBBY') {
          this.sendError(ws, 'No se puede cambiar de aventurero una vez iniciada la expedición.');
          return;
        }

        if (msg.characterId === null) {
          player.characterId = null;
          player.selectedCharacterId = null;
          player.hp = 0;
          player.maxHp = 0;
          player.armor = 0;
          room.selectedCharacters[player.id] = null;
          this.broadcastRoomState(room);
          return;
        }

        const charId = normalizeCriptaCharacterId(msg.characterId);
        if (!charId || !ALL_CRIPTA_CHARACTER_IDS.includes(charId)) {
          this.sendError(ws, 'Ese aventurero no existe en La Cripta.');
          return;
        }

        // Authoritative exclusivity check: no two players can occupy the same character
        const occupiedByOther = room.players.find(
          (p) => p.id !== player.id && p.characterId === charId
        );
        if (occupiedByOther) {
          const charDef = CRIPTA_CHARACTERS_CATALOG[charId];
          this.sendError(
            ws,
            `${charDef.className} ya está ocupado por ${occupiedByOther.name}.`
          );
          // Send authoritative state so client stays in sync
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: 'EXPEDITION_STATE',
                state: this.serializeRoom(room),
              } satisfies CriptaServerMessage)
            );
          }
          return;
        }

        const charDef = CRIPTA_CHARACTERS_CATALOG[charId];
        player.characterId = charId;
        player.selectedCharacterId = charId;
        player.maxHp = charDef.maxHp;
        player.hp = charDef.maxHp;
        player.armor = charDef.baseArmor;
        room.selectedCharacters[player.id] = charId;

        this.broadcastRoomState(room);
        break;
      }

      case 'START_EXPEDITION': {
        if (!player.isHost) {
          this.sendError(ws, 'Solo el líder de la expedición puede iniciar la partida.');
          return;
        }
        if (
          room.phase !== 'LOBBY' &&
          room.phase !== 'DUNGEON' &&
          room.phase !== 'DUNGEON_ARRIVAL'
        ) {
          return;
        }

        const connectedPlayers = room.players.filter((p) => p.isConnected);
        if (connectedPlayers.length < 1) return;

        const everyoneSelected = connectedPlayers.every(
          (p) => p.characterId !== null && ALL_CRIPTA_CHARACTER_IDS.includes(p.characterId)
        );
        if (!everyoneSelected) {
          this.sendError(
            ws,
            connectedPlayers.length === 1
              ? 'Elige a tu aventurero antes de iniciar la expedición.'
              : 'Todos los jugadores deben elegir aventurero.'
          );
          return;
        }

        if (room.doorOpeningTimer) {
          clearTimeout(room.doorOpeningTimer);
          room.doorOpeningTimer = null;
        }

        const newSeed = Math.floor(Math.random() * 2147483647);
        const threeDoors = selectThreeDistinctDungeons(newSeed);

        room.expeditionId = `exp_${room.roomCode}_${Date.now()}`;
        room.seed = newSeed;
        room.offeredDungeons = threeDoors;
        room.doorVotes = {};
        room.decisionResolved = false;
        room.voteTieWarning = false;
        room.initializationError = null;
        room.selectedDungeonId = null;
        room.doorOpeningStartedAt = null;
        room.floor = 1;
        room.currentNodeId = null;
        room.generatedNodes = [];
        room.phase = 'THREE_DOORS';

        // Refresh party HP/armor to their chosen class base stats at expedition start
        for (const p of room.players) {
          if (p.characterId) {
            const cDef = CRIPTA_CHARACTERS_CATALOG[p.characterId];
            if (cDef) {
              p.maxHp = cDef.maxHp;
              p.hp = cDef.maxHp;
              p.armor = cDef.baseArmor;
            }
          }
        }

        this.broadcastRoomState(room);
        break;
      }

      case 'VOTE_DOOR': {
        if (room.phase !== 'THREE_DOORS' || room.decisionResolved) return;
        if (!room.offeredDungeons.includes(msg.dungeonId)) return;

        // One active vote per player; clicking another door moves their vote
        room.doorVotes[player.id] = msg.dungeonId;
        room.initializationError = null;

        this.evaluateAndResolveDoorVotes(room);
        break;
      }

      case 'RETRY_DUNGEON_INIT': {
        if (room.phase !== 'THREE_DOORS' && room.phase !== 'ENTERING_DUNGEON') return;
        room.decisionResolved = false;
        room.initializationError = null;
        room.phase = 'THREE_DOORS';
        this.evaluateAndResolveDoorVotes(room);
        break;
      }

      case 'RETURN_TO_LOBBY': {
        if (room.doorOpeningTimer) {
          clearTimeout(room.doorOpeningTimer);
          room.doorOpeningTimer = null;
        }
        room.phase = 'LOBBY';
        room.doorVotes = {};
        room.decisionResolved = false;
        room.voteTieWarning = false;
        room.initializationError = null;
        room.selectedDungeonId = null;
        room.doorOpeningStartedAt = null;
        this.broadcastRoomState(room);
        break;
      }

      case 'LEAVE_ROOM': {
        this.removePlayerPermanently(room, player.id);
        this.clients.delete(ws);
        break;
      }
    }
  }

  /**
   * Authoritative group majority resolution for the 3 candidate dungeon doors.
   * - 1 player (Solo): their single vote decides immediately.
   * - 2-4 players: waits until every connected active player has cast a vote.
   *   - Clear majority/plurality winner -> locks decision, initializes dungeon immediately,
   *     transitions to ENTERING_DUNGEON -> DUNGEON.
   *   - Tie (e.g. 1-1, 1-1-1, 2-2) -> does NOT randomly pick; sets voteTieWarning = true
   *     and keeps selection open so players can change their vote.
   */
  private evaluateAndResolveDoorVotes(room: ServerCriptaRoom) {
    if (room.phase !== 'THREE_DOORS' || room.decisionResolved) return;

    const connectedPlayers = room.players.filter((p) => p.isConnected);
    if (connectedPlayers.length === 0) {
      this.broadcastRoomState(room);
      return;
    }

    const allActiveVoted = connectedPlayers.every((p) =>
      Boolean(room.doorVotes[p.id] && room.offeredDungeons.includes(room.doorVotes[p.id]))
    );

    if (!allActiveVoted) {
      room.voteTieWarning = false;
      this.broadcastRoomState(room);
      return;
    }

    // Tally votes among active connected players
    const voteCounts = new Map<string, number>();
    for (const dId of room.offeredDungeons) {
      voteCounts.set(dId, 0);
    }
    for (const p of connectedPlayers) {
      const voted = room.doorVotes[p.id];
      if (voted && voteCounts.has(voted)) {
        voteCounts.set(voted, (voteCounts.get(voted) || 0) + 1);
      }
    }

    let maxVotes = 0;
    for (const count of voteCounts.values()) {
      if (count > maxVotes) {
        maxVotes = count;
      }
    }

    const topDoors = room.offeredDungeons.filter((dId) => (voteCounts.get(dId) || 0) === maxVotes);

    // Tie check: never randomly choose a dungeon on a tie
    if (topDoors.length !== 1 || maxVotes === 0) {
      room.voteTieWarning = true;
      room.decisionResolved = false;
      this.broadcastRoomState(room);
      return;
    }

    // Winning door determined! Lock decision idempotently and initialize dungeon immediately.
    const chosenDungeonId = topDoors[0];
    const now = Date.now();

    try {
      const initializedNodes = generatePhase1ArrivalNodes(chosenDungeonId);
      const firstNodeId = initializedNodes[0]?.id || null;
      if (!initializedNodes.length || !firstNodeId) {
        throw new Error('No se pudo inicializar la primera sala de la mazmorra.');
      }

      room.decisionResolved = true;
      room.voteTieWarning = false;
      room.initializationError = null;
      room.selectedDungeonId = chosenDungeonId;
      room.doorOpeningStartedAt = now;
      room.floor = 1;
      room.generatedNodes = initializedNodes;
      room.currentNodeId = firstNodeId;
      room.phase = 'ENTERING_DUNGEON';

      room.stateVersion += 1;
      const lockedState = this.serializeRoom(room);

      this.broadcastMessage(room, {
        type: 'DOOR_LOCKED',
        expeditionId: room.expeditionId,
        selectedDungeonId: chosenDungeonId,
        doorOpeningStartedAt: now,
        state: lockedState,
      });

      if (room.doorOpeningTimer) {
        clearTimeout(room.doorOpeningTimer);
      }
      room.doorOpeningTimer = setTimeout(() => {
        room.doorOpeningTimer = null;
        if (room.phase === 'ENTERING_DUNGEON' || room.phase === 'DOOR_OPENING') {
          room.phase = 'DUNGEON';
          this.broadcastRoomState(room);
        }
      }, ENTERING_DUNGEON_DURATION_MS);
    } catch (err: any) {
      room.decisionResolved = false;
      room.phase = 'THREE_DOORS';
      room.initializationError =
        err?.message || 'Error al inicializar la mazmorra. Pulsa para reintentar.';
      this.broadcastRoomState(room);
    }
  }

  private handleDisconnect(ws: WebSocket) {
    const client = this.clients.get(ws);
    if (!client) return;
    this.clients.delete(ws);

    const room = this.rooms.get(client.roomCode);
    if (!room) return;

    const player = room.players.find((p) => p.id === client.playerId);
    if (!player) return;

    player.isConnected = false;

    if (room.phase === 'THREE_DOORS' && !room.decisionResolved) {
      delete room.doorVotes[player.id];
      this.evaluateAndResolveDoorVotes(room);
    } else {
      this.broadcastRoomState(room);
    }

    // Preserve character ownership during the 25s reconnect grace window
    const timer = setTimeout(() => {
      room.disconnectTimers.delete(player.id);
      if (!player.isConnected) {
        this.removePlayerPermanently(room, player.id);
      }
    }, 25000);

    room.disconnectTimers.set(player.id, timer);
  }

  private removePlayerPermanently(room: ServerCriptaRoom, playerId: string) {
    const timer = room.disconnectTimers.get(playerId);
    if (timer) {
      clearTimeout(timer);
      room.disconnectTimers.delete(playerId);
    }

    room.players = room.players.filter((p) => p.id !== playerId);
    delete room.selectedCharacters[playerId];
    delete room.doorVotes[playerId];

    if (room.players.length === 0) {
      if (room.doorOpeningTimer) clearTimeout(room.doorOpeningTimer);
      this.rooms.delete(room.roomCode);
      roomRegistry.unregister(room.roomCode);
      return;
    }

    if (room.hostId === playerId) {
      const nextHost = room.players.find((p) => p.isConnected) || room.players[0];
      room.hostId = nextHost.id;
      room.players.forEach((p) => {
        p.isHost = p.id === nextHost.id;
      });
    }

    this.broadcastRoomState(room);
  }
}
