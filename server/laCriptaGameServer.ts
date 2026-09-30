import { WebSocketServer, WebSocket } from 'ws';
import {
  CriptaAcquiredRelic,
  CriptaCharacterId,
  CriptaClientMessage,
  CriptaDungeonId,
  CriptaDungeonRoom,
  CriptaExpeditionState,
  CriptaItemId,
  CriptaPlayer,
  CriptaRelicId,
  CriptaRunStats,
  CriptaServerMessage,
  CriptaVisualEvent,
} from '../src/types/laCripta';
import {
  ALL_CRIPTA_CHARACTER_IDS,
  CRIPTA_CHARACTERS_CATALOG,
  CRIPTA_CURSOR_COLORS,
  CRIPTA_DUNGEONS_REGISTRY,
  normalizeCriptaCharacterId,
  selectThreeDistinctDungeons,
} from '../src/data/la-cripta/criptaCatalog';
import {
  generateProceduralDungeon,
} from '../src/data/la-cripta/criptaDungeonGenerator';
import {
  applyStatusEffectToPlayer,
  createStatusEffectInstance,
  CRIPTA_STATUS_EFFECTS_REGISTRY,
  DUNGEON_BIOME_THREAT_PROFILES,
  playerHasStatus,
  purifyPlayerDebuffs,
  resolvePlayerTurnEndStatusTicks,
} from '../src/data/la-cripta/criptaStatusEffects';
import {
  buildFinalBossChamber,
  CRIPTA_ITEMS_REGISTRY,
  CRIPTA_RELICS_REGISTRY,
  NORMAL_INVENTORY_MAX_SLOTS,
  pickUnownedRelic,
  playerHasRelic,
  rollEnemyLootDrop,
  transformFinalBossToPhase2,
} from '../src/data/la-cripta/criptaItemsAndRelics';
import { roomRegistry } from './roomRegistry';

interface ClientConnection {
  ws: WebSocket;
  playerId: string;
  roomCode: string;
}

interface ServerCriptaRoom extends CriptaExpeditionState {
  doorOpeningTimer: NodeJS.Timeout | null;
  disconnectTimers: Map<string, NodeJS.Timeout>;
  nextEventBatchId: number;
  dungeonStartGold: number;
  dungeonItemsFound: number;
  dungeonRelicsFound: number;
  dungeonEnemiesDefeated: number;
}

const ENTERING_DUNGEON_DURATION_MS = 2350;
const RETURNING_TO_DOORS_DURATION_MS = 1450;

function buildDefaultRunStats(): CriptaRunStats {
  return {
    dungeonsCompleted: 0,
    roomsVisited: 0,
    enemiesDefeated: 0,
    elitesDefeated: 0,
    goldEarned: 0,
    goldSpent: 0,
    itemsUsed: 0,
    relicsObtained: 0,
    damageDealt: 0,
    damageReceived: 0,
    healingDone: 0,
    playersRevived: 0,
    finalBossDefeated: false,
  };
}

function selectThreeDistinctDungeonsExcluding(
  seed: number,
  excludedIds: CriptaDungeonId[] = []
): CriptaDungeonId[] {
  const allIds = Object.keys(CRIPTA_DUNGEONS_REGISTRY) as CriptaDungeonId[];
  const filtered = allIds.filter((id) => !excludedIds.includes(id));
  const pool = filtered.length >= 3 ? [...filtered] : [...allIds];

  let s = seed | 0;
  const nextRand = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(nextRand() * (i + 1));
    const tmp = pool[i];
    pool[i] = pool[j];
    pool[j] = tmp;
  }

  return pool.slice(0, 3);
}

function buildDefaultPlayer(
  raw: { id: string; name: string; color?: string },
  seatIndex: number,
  isHost: boolean
): CriptaPlayer {
  const defaultColor =
    raw.color && typeof raw.color === 'string' && raw.color.trim()
      ? raw.color.trim()
      : CRIPTA_CURSOR_COLORS[seatIndex % CRIPTA_CURSOR_COLORS.length].hex;

  const pid = String(raw.id || `cripta_${seatIndex}`);

  return {
    id: pid,
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
    bonusAttack: 0,
    bonusDefense: 0,
    bonusMagic: 0,
    normalInventory: ['venda'],
    personalRelics: [],
    pendingInventoryReplacement: null,
    inventoryItems: [],
    isDead: false,
    deathsCount: 0,
    statuses: [
      createStatusEffectInstance('TORCH_LIGHT', pid, 'camp', 0, 99, 1),
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
      finalBossDoorVotes: {},
      decisionResolved: false,
      voteTieWarning: false,
      initializationError: null,
      selectedDungeonId: null,
      doorOpeningStartedAt: null,
      returningToDoorsStartedAt: null,
      exitingDungeonId: null,
      floor: 1,
      currentNodeId: null,
      generatedNodes: [],
      completedDoorCount: 0,
      completedDungeonIds: [],
      partyRelics: [],
      dungeonCompletionSummary: null,
      runStats: buildDefaultRunStats(),
      finalBossState: null,
      runVictory: false,
      dungeonSeed: seed,
      dungeonLengthTier: 'MEDIA',
      partyGold: 45,
      currentRoomIndex: 0,
      transitioningToRoomIndex: null,
      roomSequence: [],
      discoveredSecretRoom: null,
      inSecretRoom: false,
      dungeonCompleted: false,
      expeditionDefeated: false,
      lastEventBatch: null,
      doorOpeningTimer: null,
      disconnectTimers: new Map(),
      nextEventBatchId: 1,
      dungeonStartGold: 45,
      dungeonItemsFound: 0,
      dungeonRelicsFound: 0,
      dungeonEnemiesDefeated: 0,
    };

    this.rooms.set(code, room);
    roomRegistry.register(code, 'la-cripta', 'la-cripta');
    return this.serializeRoom(room);
  }

  private emitVisualEventBatch(
    room: ServerCriptaRoom,
    events: CriptaVisualEvent[],
    actorPlayerId?: string,
    actorAction?: string
  ) {
    if (!events || events.length === 0) return;
    room.nextEventBatchId = (room.nextEventBatchId || 0) + 1;
    room.lastEventBatch = {
      batchId: room.nextEventBatchId,
      createdAt: Date.now(),
      actorPlayerId,
      actorAction,
      events,
    };
  }

  private computeNextTurnPlayerId(
    room: ServerCriptaRoom,
    activeRoom: CriptaDungeonRoom,
    afterPlayerId?: string
  ): string | null {
    const livingPlayers = room.players
      .filter((p) => p.isConnected && !p.isDead && p.hp > 0)
      .sort((a, b) => a.seatIndex - b.seatIndex);
    if (livingPlayers.length === 0) return null;
    if (livingPlayers.length === 1) return livingPlayers[0].id;

    const acted = new Set(activeRoom.actedPlayerIdsThisRound || []);
    const unacted = livingPlayers.filter((p) => !acted.has(p.id));
    if (unacted.length > 0) {
      return unacted[0].id;
    }

    if (afterPlayerId) {
      const idx = livingPlayers.findIndex((p) => p.id === afterPlayerId);
      if (idx >= 0) {
        return livingPlayers[(idx + 1) % livingPlayers.length].id;
      }
    }
    return livingPlayers[0].id;
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
        bonusAttack: p.bonusAttack ?? 0,
        bonusDefense: p.bonusDefense ?? 0,
        bonusMagic: p.bonusMagic ?? 0,
        normalInventory: p.normalInventory ? [...p.normalInventory] : [],
        personalRelics: p.personalRelics ? p.personalRelics.map((r) => ({ ...r })) : [],
        pendingInventoryReplacement: p.pendingInventoryReplacement
          ? { ...p.pendingInventoryReplacement }
          : null,
        inventoryItems: p.inventoryItems ? [...p.inventoryItems] : [],
        isDead: Boolean(p.isDead || (p.characterId && p.maxHp > 0 && p.hp <= 0)),
        deathsCount: p.deathsCount ?? 0,
        statuses: (p.statuses || []).map((st) => ({ ...st })),
      })),
      selectedCharacters: { ...room.selectedCharacters },
      offeredDungeons: [...room.offeredDungeons],
      doorVotes: { ...room.doorVotes },
      finalBossDoorVotes: room.finalBossDoorVotes ? { ...room.finalBossDoorVotes } : {},
      decisionResolved: Boolean(room.decisionResolved),
      voteTieWarning: Boolean(room.voteTieWarning),
      initializationError: room.initializationError ?? null,
      selectedDungeonId: room.selectedDungeonId,
      doorOpeningStartedAt: room.doorOpeningStartedAt,
      returningToDoorsStartedAt: room.returningToDoorsStartedAt ?? null,
      exitingDungeonId: room.exitingDungeonId ?? null,
      floor: room.floor,
      currentNodeId: room.currentNodeId,
      generatedNodes: [...room.generatedNodes],
      completedDoorCount: room.completedDoorCount ?? 0,
      completedDungeonIds: room.completedDungeonIds ? [...room.completedDungeonIds] : [],
      partyRelics: room.partyRelics ? room.partyRelics.map((r) => ({ ...r })) : [],
      dungeonCompletionSummary: room.dungeonCompletionSummary
        ? { ...room.dungeonCompletionSummary }
        : null,
      runStats: room.runStats ? { ...room.runStats } : buildDefaultRunStats(),
      finalBossState: room.finalBossState ? { ...room.finalBossState } : null,
      runVictory: Boolean(room.runVictory),
      dungeonSeed: room.dungeonSeed ?? room.seed,
      dungeonLengthTier: room.dungeonLengthTier ?? 'MEDIA',
      partyGold: room.partyGold ?? 45,
      currentRoomIndex: room.currentRoomIndex ?? 0,
      transitioningToRoomIndex: room.transitioningToRoomIndex ?? null,
      roomSequence: room.roomSequence ? room.roomSequence.map((r) => ({ ...r })) : [],
      discoveredSecretRoom: room.discoveredSecretRoom
        ? { ...room.discoveredSecretRoom }
        : null,
      inSecretRoom: Boolean(room.inSecretRoom),
      dungeonCompleted: Boolean(room.dungeonCompleted),
      expeditionDefeated: Boolean(room.expeditionDefeated),
      lastEventBatch: room.lastEventBatch ? { ...room.lastEventBatch } : null,
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
          room.phase !== 'DUNGEON_ARRIVAL' &&
          room.phase !== 'FINAL_BOSS_COMBAT' &&
          room.phase !== 'RUN_VICTORY'
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
        room.finalBossDoorVotes = {};
        room.decisionResolved = false;
        room.voteTieWarning = false;
        room.initializationError = null;
        room.selectedDungeonId = null;
        room.doorOpeningStartedAt = null;
        room.returningToDoorsStartedAt = null;
        room.exitingDungeonId = null;
        room.floor = 1;
        room.currentNodeId = null;
        room.generatedNodes = [];
        room.completedDoorCount = 0;
        room.completedDungeonIds = [];
        room.partyRelics = [];
        room.dungeonCompletionSummary = null;
        room.runStats = buildDefaultRunStats();
        room.finalBossState = null;
        room.runVictory = false;
        room.dungeonSeed = newSeed;
        room.partyGold = 45;
        room.dungeonStartGold = 45;
        room.dungeonItemsFound = 0;
        room.dungeonRelicsFound = 0;
        room.dungeonEnemiesDefeated = 0;
        room.currentRoomIndex = 0;
        room.transitioningToRoomIndex = null;
        room.roomSequence = [];
        room.discoveredSecretRoom = null;
        room.inSecretRoom = false;
        room.dungeonCompleted = false;
        room.expeditionDefeated = false;
        room.lastEventBatch = null;
        room.phase = 'THREE_DOORS';

        // Refresh party HP/armor/statuses/bonuses/inventory/relics/death state at new run start
        for (const p of room.players) {
          p.isDead = false;
          p.bonusAttack = 0;
          p.bonusDefense = 0;
          p.bonusMagic = 0;
          p.normalInventory = ['venda'];
          p.personalRelics = [];
          p.pendingInventoryReplacement = null;
          p.inventoryItems = [];
          p.statuses = [createStatusEffectInstance('TORCH_LIGHT', p.id, 'camp', 0, 99, 1)];
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
        if ((room.completedDoorCount ?? 0) >= 3) return;
        if (!room.offeredDungeons.includes(msg.dungeonId)) return;

        // One active vote per player; clicking another door moves their vote
        room.doorVotes[player.id] = msg.dungeonId;
        room.initializationError = null;

        this.evaluateAndResolveDoorVotes(room);
        break;
      }

      case 'VOTE_FINAL_BOSS_DOOR': {
        this.handleVoteFinalBossDoor(room, player);
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

      case 'ROOM_COMBAT_ACTION': {
        this.handleRoomCombatAction(ws, room, player, msg.action, msg.targetEnemyId);
        break;
      }

      case 'USE_INVENTORY_ITEM': {
        this.handleUseInventoryItem(
          ws,
          room,
          player,
          msg.slotIndex,
          msg.targetPlayerId,
          msg.targetEnemyId
        );
        break;
      }

      case 'CLAIM_GROUND_DROP': {
        this.handleClaimGroundDrop(ws, room, player, msg.dropId);
        break;
      }

      case 'BUY_SHOP_SLOT': {
        this.handleBuyShopSlot(ws, room, player, msg.slotId);
        break;
      }

      case 'RESOLVE_INVENTORY_FULL': {
        this.handleResolveInventoryFull(ws, room, player, msg.replaceSlotIndex);
        break;
      }

      case 'ROOM_REVIVE_ALLY': {
        this.handleRoomReviveAlly(ws, room, player, msg.targetPlayerId, msg.method);
        break;
      }

      case 'ROOM_INTERACT_OPTION': {
        this.handleRoomInteractOption(ws, room, player, msg.optionId);
        break;
      }

      case 'ROOM_PUZZLE_INPUT': {
        this.handleRoomPuzzleInput(ws, room, player, msg.runeIndex);
        break;
      }

      case 'ROOM_DISCOVER_SECRET': {
        this.handleRoomDiscoverSecret(ws, room, player);
        break;
      }

      case 'ROOM_ADVANCE': {
        this.handleRoomAdvance(room, player);
        break;
      }

      case 'RETURN_TO_LOBBY': {
        if (room.doorOpeningTimer) {
          clearTimeout(room.doorOpeningTimer);
          room.doorOpeningTimer = null;
        }
        room.phase = 'LOBBY';
        room.doorVotes = {};
        room.finalBossDoorVotes = {};
        room.decisionResolved = false;
        room.voteTieWarning = false;
        room.initializationError = null;
        room.selectedDungeonId = null;
        room.doorOpeningStartedAt = null;
        room.returningToDoorsStartedAt = null;
        room.exitingDungeonId = null;
        room.completedDoorCount = 0;
        room.completedDungeonIds = [];
        room.partyRelics = [];
        room.dungeonCompletionSummary = null;
        room.runStats = buildDefaultRunStats();
        room.finalBossState = null;
        room.runVictory = false;
        room.roomSequence = [];
        room.currentRoomIndex = 0;
        room.inSecretRoom = false;
        room.dungeonCompleted = false;
        room.expeditionDefeated = false;
        room.lastEventBatch = null;
        for (const p of room.players) {
          p.isDead = false;
          p.bonusAttack = 0;
          p.bonusDefense = 0;
          p.bonusMagic = 0;
          p.normalInventory = ['venda'];
          p.personalRelics = [];
          p.pendingInventoryReplacement = null;
          p.inventoryItems = [];
          p.statuses = [createStatusEffectInstance('TORCH_LIGHT', p.id, 'camp', 0, 99, 1)];
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

      case 'LEAVE_ROOM': {
        this.removePlayerPermanently(room, player.id);
        this.clients.delete(ws);
        break;
      }
    }
  }

  private getActiveDungeonRoom(room: ServerCriptaRoom) {
    if (room.inSecretRoom && room.discoveredSecretRoom) {
      return room.discoveredSecretRoom;
    }
    const seq = room.roomSequence || [];
    const idx = room.currentRoomIndex ?? 0;
    return seq[idx] || null;
  }

  private syncLegacyNodes(room: ServerCriptaRoom) {
    if (!room.roomSequence) return;
    room.generatedNodes = room.roomSequence.map((rm, idx) => ({
      id: rm.id,
      type: rm.type,
      floor: room.floor || 1,
      depth: idx,
      title: rm.title,
      connections: idx + 1 < room.roomSequence!.length ? [room.roomSequence![idx + 1].id] : [],
      contentId: rm.id,
      revealed: rm.revealed,
      visited: rm.visited,
      resolved: rm.resolved,
    }));
    const active = this.getActiveDungeonRoom(room);
    if (active) {
      room.currentNodeId = active.id;
    }
  }

  private checkAndApplyPartyDefeat(room: ServerCriptaRoom): boolean {
    const connected = room.players.filter((p) => p.isConnected);
    const checkList = connected.length > 0 ? connected : room.players;
    const allDead = checkList.every((p) => p.isDead || p.hp <= 0);
    if (allDead) {
      room.expeditionDefeated = true;
      return true;
    }
    return false;
  }

  private revivePlayerAuthoritatively(
    target: CriptaPlayer,
    hpFraction = 0.5,
    grantStatus: 'BLESSED' | 'SHIELDED' | 'REGENERATION' = 'SHIELDED',
    turnNumber = 1
  ) {
    target.isDead = false;
    const restoredHp = Math.max(12, Math.round(target.maxHp * hpFraction));
    target.hp = Math.min(target.maxHp, restoredHp);
    target.statuses = [createStatusEffectInstance('TORCH_LIGHT', target.id, 'revive', turnNumber, 99, 1)];
    applyStatusEffectToPlayer(target, grantStatus, 'revive', turnNumber, 2);
  }

  private isInsideExploreOrBossPhase(room: ServerCriptaRoom): boolean {
    return (
      room.phase === 'DUNGEON' ||
      room.phase === 'DUNGEON_ARRIVAL' ||
      room.phase === 'FINAL_BOSS_COMBAT'
    );
  }

  private getCurrentDungeonDisplayName(room: ServerCriptaRoom): string {
    if (room.phase === 'FINAL_BOSS_COMBAT') return 'El Corazón de la Cripta';
    if (room.selectedDungeonId && CRIPTA_DUNGEONS_REGISTRY[room.selectedDungeonId]) {
      return CRIPTA_DUNGEONS_REGISTRY[room.selectedDungeonId].name;
    }
    return 'La Cripta';
  }

  private hasPartyRelic(room: ServerCriptaRoom, relicId: CriptaRelicId): boolean {
    if ((room.partyRelics || []).some((r) => r.relicId === relicId)) return true;
    return room.players.some((p) =>
      (p.personalRelics || []).some((r) => r.relicId === relicId)
    );
  }

  private grantRelicAuthoritatively(
    room: ServerCriptaRoom,
    player: CriptaPlayer,
    relicId: CriptaRelicId,
    visualEvents: CriptaVisualEvent[]
  ): CriptaAcquiredRelic | null {
    const def = CRIPTA_RELICS_REGISTRY[relicId];
    if (!def) return null;

    if (!room.runStats) room.runStats = buildDefaultRunStats();
    room.runStats.relicsObtained += 1;
    room.dungeonRelicsFound = (room.dungeonRelicsFound || 0) + 1;

    const acquired: CriptaAcquiredRelic = {
      relicId,
      ownerPlayerId: def.ownershipType === 'PARTY' ? null : player.id,
      ownerPlayerName: def.ownershipType === 'PARTY' ? 'GRUPO' : player.name,
      obtainedInDungeonId: room.selectedDungeonId,
      obtainedInDungeonName: this.getCurrentDungeonDisplayName(room),
      obtainedAtRoomNumber: (room.currentRoomIndex ?? 0) + 1,
      obtainedAtTimestamp: Date.now(),
      consumedOncePerRun: false,
    };

    if (def.ownershipType === 'PARTY') {
      if (!room.partyRelics) room.partyRelics = [];
      if (!room.partyRelics.some((r) => r.relicId === relicId)) {
        room.partyRelics.push(acquired);
      }
      if (relicId === 'ojo_del_oraculo') {
        for (const p of room.players) {
          if (!p.isDead && p.hp > 0) {
            p.bonusMagic = (p.bonusMagic || 0) + 1;
          }
        }
      } else if (relicId === 'corona_de_cristal') {
        for (const p of room.players) {
          if (!p.isDead && p.hp > 0) {
            p.bonusMagic = (p.bonusMagic || 0) + 1;
            applyStatusEffectToPlayer(p, 'SHIELDED', 'corona_de_cristal', 1, 2);
          }
        }
      }
    } else {
      if (!player.personalRelics) player.personalRelics = [];
      if (!player.personalRelics.some((r) => r.relicId === relicId)) {
        player.personalRelics.push(acquired);
      }
      // Immediate permanent stat boosts from personal relics
      if (relicId === 'corazon_de_hierro') {
        const extraHp = Math.max(8, Math.round(player.maxHp * 0.15));
        player.maxHp += extraHp;
        player.hp = Math.min(player.maxHp, player.hp + extraHp);
        player.armor = Math.min(24, player.armor + 2);
      } else if (relicId === 'libro_prohibido') {
        player.bonusMagic = (player.bonusMagic || 0) + 2;
      } else if (relicId === 'diente_del_rey') {
        player.bonusAttack = (player.bonusAttack || 0) + 1;
      }
    }

    visualEvents.push({
      id: `ev_relic_${Date.now()}_${relicId}`,
      kind: 'RELIC_OBTAINED',
      targetType: def.ownershipType === 'PARTY' ? 'PARTY' : 'PLAYER',
      targetId: def.ownershipType === 'PARTY' ? undefined : player.id,
      sourcePlayerId: player.id,
      label: `✦ RELIQUIA: ${def.name.toUpperCase()}`,
      sublabel: def.description,
      color: '#FFD166',
      relicId,
      relicOwnerName: acquired.ownerPlayerName,
      relicIsParty: def.ownershipType === 'PARTY',
      vfxStyle: 'holy',
    });

    return acquired;
  }

  private grantNormalItemAuthoritatively(
    room: ServerCriptaRoom,
    player: CriptaPlayer,
    itemId: CriptaItemId,
    sourceType: 'DROP' | 'SHOP' | 'CHEST',
    sourceRefId: string | undefined,
    priceGold: number | undefined,
    visualEvents: CriptaVisualEvent[]
  ): 'ADDED' | 'PENDING_FULL' {
    const def = CRIPTA_ITEMS_REGISTRY[itemId];
    if (!def) return 'ADDED';

    if (!player.normalInventory) player.normalInventory = [];

    if (player.normalInventory.length >= NORMAL_INVENTORY_MAX_SLOTS) {
      player.pendingInventoryReplacement = {
        playerId: player.id,
        newItemId: itemId,
        sourceType,
        sourceRefId,
        priceGold,
      };
      return 'PENDING_FULL';
    }

    player.normalInventory.push(itemId);
    room.dungeonItemsFound = (room.dungeonItemsFound || 0) + 1;

    visualEvents.push({
      id: `ev_item_gain_${Date.now()}_${itemId}`,
      kind: 'LOOT_ITEM',
      targetType: 'PLAYER',
      targetId: player.id,
      sourcePlayerId: player.id,
      label: `+${def.name.toUpperCase()}`,
      sublabel: `INVENTARIO (${player.normalInventory.length}/${NORMAL_INVENTORY_MAX_SLOTS})`,
      color: '#E7A54A',
      itemId,
      vfxStyle: 'gold',
    });

    return 'ADDED';
  }

  private handleUseInventoryItem(
    ws: WebSocket,
    room: ServerCriptaRoom,
    player: CriptaPlayer,
    slotIndex: number,
    targetPlayerId?: string,
    targetEnemyId?: string
  ) {
    if (!this.isInsideExploreOrBossPhase(room)) return;
    if (room.expeditionDefeated) return;
    if (player.isDead || player.hp <= 0) {
      this.sendError(ws, 'Has caído en combate. No puedes usar objetos mientras estés caído.');
      return;
    }

    const inv = player.normalInventory || [];
    const idx = Number(slotIndex);
    if (!Number.isInteger(idx) || idx < 0 || idx >= inv.length) return;

    const itemId = inv[idx];
    const def = CRIPTA_ITEMS_REGISTRY[itemId];
    if (!def) return;

    const activeRoom = this.getActiveDungeonRoom(room);
    if (!activeRoom) return;

    const livingEnemies = activeRoom.enemies.filter((e) => e.hp > 0);
    const inCombat = livingEnemies.length > 0 && !activeRoom.resolved;

    if (inCombat && !def.combatUsable) {
      this.sendError(ws, `${def.name} no se puede usar en mitad del combate.`);
      return;
    }
    if (!inCombat && !def.roomUsable) {
      this.sendError(ws, `${def.name} solo se puede usar durante un combate.`);
      return;
    }

    // Remove the consumed item from the slot
    player.normalInventory.splice(idx, 1);
    if (!room.runStats) room.runStats = buildDefaultRunStats();
    room.runStats.itemsUsed += 1;

    const targetAlly =
      (targetPlayerId && room.players.find((p) => p.id === targetPlayerId && !p.isDead && p.hp > 0)) ||
      player;
    const targetEnemy =
      (targetEnemyId && livingEnemies.find((e) => e.id === targetEnemyId)) ||
      livingEnemies[0] ||
      null;

    const ts = Date.now();
    const turnNum = (activeRoom.combatTurn || 0) + 1;
    const visualEvents: CriptaVisualEvent[] = [
      {
        id: `ev_${ts}_use_${itemId}`,
        kind: 'ITEM_USED',
        targetType: 'PLAYER',
        targetId: player.id,
        sourcePlayerId: player.id,
        label: `USÓ ${def.name.toUpperCase()}`,
        color: '#FFD166',
        itemId,
      },
    ];

    // Relic synergy: Frasco sin Fondo (+40% healing from potions & bandages)
    const hasBottomlessFlask =
      playerHasRelic(player, room.partyRelics, 'frasco_sin_fondo') ||
      playerHasRelic(targetAlly, room.partyRelics, 'frasco_sin_fondo');
    const healMultiplier = hasBottomlessFlask ? 1.4 : 1;

    let logText = `${player.name} usa ${def.name}.`;

    switch (itemId) {
      case 'venda': {
        const healAmt = Math.round((def.healAmount || 14) * healMultiplier);
        targetAlly.hp = Math.min(targetAlly.maxHp, targetAlly.hp + healAmt);
        targetAlly.statuses = targetAlly.statuses.filter((s) => s.effectType !== 'BLEED');
        room.runStats.healingDone += healAmt;
        visualEvents.push({
          id: `ev_${ts}_ban_${targetAlly.id}`,
          kind: 'HEAL_PLAYER',
          targetType: 'PLAYER',
          targetId: targetAlly.id,
          value: healAmt,
          label: `+${healAmt} PV`,
          sublabel: 'VENDAJE · DETIENE SANGRADO',
          color: '#5EA87A',
          vfxStyle: 'heal',
        });
        logText = `${player.name} venda las heridas de ${targetAlly.name} (+${healAmt} PV y detiene Sangrado).`;
        break;
      }

      case 'pocion_curacion': {
        const healAmt = Math.round((def.healAmount || 26) * healMultiplier);
        targetAlly.hp = Math.min(targetAlly.maxHp, targetAlly.hp + healAmt);
        room.runStats.healingDone += healAmt;
        visualEvents.push({
          id: `ev_${ts}_pot_h`,
          kind: 'HEAL_PLAYER',
          targetType: 'PLAYER',
          targetId: targetAlly.id,
          value: healAmt,
          label: `+${healAmt} PV`,
          sublabel: def.name.toUpperCase(),
          color: '#5EA87A',
          vfxStyle: 'heal',
        });
        logText = `${player.name} usa ${def.name} sobre ${targetAlly.name} (+${healAmt} PV).`;
        break;
      }

      case 'pocion_mayor': {
        const healAmt = Math.round((def.healAmount || 46) * healMultiplier);
        targetAlly.hp = Math.min(targetAlly.maxHp, targetAlly.hp + healAmt);
        room.runStats.healingDone += healAmt;
        applyStatusEffectToPlayer(targetAlly, 'REGENERATION', player.id, turnNum, 2);
        visualEvents.push({
          id: `ev_${ts}_gpot_h`,
          kind: 'HEAL_PLAYER',
          targetType: 'PLAYER',
          targetId: targetAlly.id,
          value: healAmt,
          label: `+${healAmt} PV`,
          sublabel: '+REGENERACIÓN (2T)',
          color: '#5EA87A',
          statusType: 'REGENERATION',
          vfxStyle: 'heal',
        });
        logText = `${player.name} usa ${def.name} sobre ${targetAlly.name} (+${healAmt} PV y REGENERACIÓN).`;
        break;
      }

      case 'antidoto': {
        targetAlly.statuses = targetAlly.statuses.filter(
          (s) => s.effectType !== 'POISON' && s.effectType !== 'BLEED'
        );
        const healAmt = Math.round((def.healAmount || 10) * healMultiplier);
        targetAlly.hp = Math.min(targetAlly.maxHp, targetAlly.hp + healAmt);
        room.runStats.healingDone += healAmt;
        visualEvents.push(
          {
            id: `ev_${ts}_ant_rem`,
            kind: 'STATUS_REMOVED',
            targetType: 'PLAYER',
            targetId: targetAlly.id,
            label: 'VENENO ELIMINADO',
            color: '#5EA87A',
            vfxStyle: 'alchemy',
          },
          {
            id: `ev_${ts}_ant_h`,
            kind: 'HEAL_PLAYER',
            targetType: 'PLAYER',
            targetId: targetAlly.id,
            value: healAmt,
            label: `+${healAmt} PV`,
            color: '#5EA87A',
          }
        );
        logText = `${player.name} aplica ${def.name} a ${targetAlly.name} (elimina Veneno y cura +${healAmt} PV).`;
        break;
      }

      case 'tonico_claridad': {
        targetAlly.statuses = targetAlly.statuses.filter(
          (s) => s.effectType !== 'CONFUSION' && s.effectType !== 'FEAR'
        );
        const healAmt = Math.round((def.healAmount || 10) * healMultiplier);
        targetAlly.hp = Math.min(targetAlly.maxHp, targetAlly.hp + healAmt);
        room.runStats.healingDone += healAmt;
        visualEvents.push({
          id: `ev_${ts}_ton_rem`,
          kind: 'STATUS_REMOVED',
          targetType: 'PLAYER',
          targetId: targetAlly.id,
          label: `CONFUSIÓN ELIMINADA (+${healAmt} PV)`,
          color: '#69A8A5',
          vfxStyle: 'heal',
        });
        logText = `${player.name} usa ${def.name} en ${targetAlly.name} (elimina Confusión/Temor y +${healAmt} PV).`;
        break;
      }

      case 'unguento_igneo': {
        targetAlly.statuses = targetAlly.statuses.filter(
          (s) => s.effectType !== 'BURN' && s.effectType !== 'FROST'
        );
        targetAlly.armor = Math.min(24, targetAlly.armor + 2);
        visualEvents.push({
          id: `ev_${ts}_ung_rem`,
          kind: 'STATUS_REMOVED',
          targetType: 'PLAYER',
          targetId: targetAlly.id,
          label: 'QUEMADURA ELIMINADA (+2 ARMADURA)',
          color: '#69A8A5',
          vfxStyle: 'shield',
        });
        logText = `${player.name} aplica ${def.name} a ${targetAlly.name} (elimina Quemadura/Escarcha y +2 Armadura).`;
        break;
      }

      case 'sal_purificadora': {
        purifyPlayerDebuffs(targetAlly, 99);
        const healAmt = Math.round((def.healAmount || 12) * healMultiplier);
        targetAlly.hp = Math.min(targetAlly.maxHp, targetAlly.hp + healAmt);
        room.runStats.healingDone += healAmt;
        applyStatusEffectToPlayer(targetAlly, 'BLESSED', player.id, turnNum, 2);
        visualEvents.push({
          id: `ev_${ts}_sal_b`,
          kind: 'STATUS_REMOVED',
          targetType: 'PLAYER',
          targetId: targetAlly.id,
          label: `MALDICIONES PURIFICADAS (+${healAmt} PV)`,
          color: '#FFD166',
          statusType: 'BLESSED',
          vfxStyle: 'holy',
        });
        logText = `${player.name} purifica a ${targetAlly.name} con ${def.name} (+${healAmt} PV y BENDECIDO).`;
        break;
      }

      case 'elixir_fuerza': {
        targetAlly.bonusAttack = (targetAlly.bonusAttack || 0) + 2;
        applyStatusEffectToPlayer(targetAlly, 'BLESSED', player.id, turnNum, 3);
        visualEvents.push({
          id: `ev_${ts}_str_${targetAlly.id}`,
          kind: 'GAIN_ATTACK',
          targetType: 'PLAYER',
          targetId: targetAlly.id,
          value: 2,
          label: '+2 ATAQUE',
          sublabel: '+BENDECIDO (3T)',
          color: '#E7A54A',
          statusType: 'BLESSED',
          vfxStyle: 'slash',
        });
        logText = `${player.name} otorga ${def.name} a ${targetAlly.name} (+2 ATAQUE y BENDECIDO 3T).`;
        break;
      }

      case 'elixir_hierro': {
        targetAlly.armor = Math.min(24, targetAlly.armor + 4);
        targetAlly.bonusDefense = (targetAlly.bonusDefense || 0) + 1;
        applyStatusEffectToPlayer(targetAlly, 'SHIELDED', player.id, turnNum, 3);
        visualEvents.push({
          id: `ev_${ts}_iron_${targetAlly.id}`,
          kind: 'SHIELD_PLAYER',
          targetType: 'PLAYER',
          targetId: targetAlly.id,
          value: 4,
          label: '+4 ARMADURA',
          sublabel: '+ESCUDO (3T)',
          color: '#69A8A5',
          statusType: 'SHIELDED',
          vfxStyle: 'shield',
        });
        logText = `${player.name} usa ${def.name} en ${targetAlly.name} (+4 ARMADURA y ESCUDO 3T).`;
        break;
      }

      case 'elixir_arcano': {
        targetAlly.bonusMagic = (targetAlly.bonusMagic || 0) + 2;
        applyStatusEffectToPlayer(targetAlly, 'REGENERATION', player.id, turnNum, 3);
        visualEvents.push({
          id: `ev_${ts}_arc_${targetAlly.id}`,
          kind: 'GAIN_MAGIC',
          targetType: 'PLAYER',
          targetId: targetAlly.id,
          value: 2,
          label: '+2 MAGIA',
          sublabel: '+REGENERACIÓN (3T)',
          color: '#9B72CF',
          statusType: 'REGENERATION',
          vfxStyle: 'arcane',
        });
        logText = `${player.name} usa ${def.name} en ${targetAlly.name} (+2 MAGIA y REGENERACIÓN 3T).`;
        break;
      }

      case 'bomba_humo': {
        for (const p of room.players) {
          if (!p.isDead && p.hp > 0) {
            p.armor = Math.min(24, p.armor + 2);
            p.statuses = p.statuses.filter((s) => s.effectType !== 'MARKED');
            applyStatusEffectToPlayer(p, 'SHIELDED', player.id, turnNum, 2);
            visualEvents.push({
              id: `ev_${ts}_smoke_${p.id}`,
              kind: 'SHIELD_PLAYER',
              targetType: 'PLAYER',
              targetId: p.id,
              value: 2,
              label: '+2 ARMADURA',
              sublabel: '+ESCUDO (2T)',
              color: '#69A8A5',
              statusType: 'SHIELDED',
              vfxStyle: 'shield',
            });
          }
        }
        logText = `${player.name} detona una ${def.name}: +2 ARMADURA y ESCUDO (2T) para todo el grupo.`;
        break;
      }

      case 'frasco_volatil': {
        if (targetEnemy) {
          const dmg = def.enemyDamage || 26;
          const prevHp = targetEnemy.hp;
          targetEnemy.hp = Math.max(0, targetEnemy.hp - dmg);
          targetEnemy.poisonStacks = (targetEnemy.poisonStacks || 0) + 2;
          targetEnemy.vulnerableTurns = (targetEnemy.vulnerableTurns || 0) + 2;
          room.runStats.damageDealt += dmg;
          visualEvents.push({
            id: `ev_${ts}_fire_${targetEnemy.id}`,
            kind: 'DAMAGE_ENEMY',
            targetType: 'ENEMY',
            targetId: targetEnemy.id,
            sourcePlayerId: player.id,
            value: -dmg,
            label: `-${dmg} PV`,
            sublabel: 'FRASCO VOLÁTIL · ENVENENADO',
            color: '#FF7A33',
            vfxStyle: 'explosion',
          });
          if (prevHp > 0 && targetEnemy.hp <= 0) {
            this.handleEnemyKilledSideEffects(room, activeRoom, targetEnemy, visualEvents, ts);
          }
          logText = `${player.name} arroja un ${def.name} contra ${targetEnemy.name} (-${dmg} PV y lo envenena).`;
        }
        break;
      }
    }

    // Relic synergy: Guantes del Boticario (On any consumable use, poison active enemy & heal +6 PV)
    if (playerHasRelic(player, room.partyRelics, 'guantes_del_boticario')) {
      player.hp = Math.min(player.maxHp, player.hp + 6);
      room.runStats.healingDone += 6;
      if (targetEnemy && targetEnemy.hp > 0) {
        targetEnemy.poisonStacks = (targetEnemy.poisonStacks || 0) + 2;
        const prevHp = targetEnemy.hp;
        targetEnemy.hp = Math.max(0, targetEnemy.hp - 6);
        room.runStats.damageDealt += 6;
        visualEvents.push({
          id: `ev_${ts}_bot_${targetEnemy.id}`,
          kind: 'DAMAGE_ENEMY',
          targetType: 'ENEMY',
          targetId: targetEnemy.id,
          value: -6,
          label: '-6 PV (TOXINA)',
          sublabel: 'GUANTES DEL BOTICARIO',
          color: '#5EA87A',
          vfxStyle: 'alchemy',
        });
        if (prevHp > 0 && targetEnemy.hp <= 0) {
          this.handleEnemyKilledSideEffects(room, activeRoom, targetEnemy, visualEvents, ts);
        }
      }
    }

    // Check if an offensive item finished off the last enemy in the room
    if (inCombat) {
      this.checkAndResolveCombatVictoryIfCleared(room, activeRoom, player, [logText], visualEvents, ts);
    } else {
      activeRoom.outcomeLog = logText;
    }

    this.emitVisualEventBatch(room, visualEvents, player.id, 'USE_ITEM');
    this.syncLegacyNodes(room);
    this.broadcastRoomState(room);
  }

  private handleClaimGroundDrop(
    ws: WebSocket,
    room: ServerCriptaRoom,
    player: CriptaPlayer,
    dropId: string
  ) {
    if (!this.isInsideExploreOrBossPhase(room)) return;
    if (room.expeditionDefeated) return;
    if (player.isDead || player.hp <= 0) {
      this.sendError(ws, 'Un compañero vivo debe recoger el botín.');
      return;
    }

    const activeRoom = this.getActiveDungeonRoom(room);
    if (!activeRoom || !activeRoom.groundDrops) return;

    const drop = activeRoom.groundDrops.find((d) => d.id === dropId && !d.claimedByPlayerId);
    if (!drop) return;

    const visualEvents: CriptaVisualEvent[] = [];

    if (drop.kind === 'RELIC' && drop.relicId) {
      drop.claimedByPlayerId = player.id;
      drop.claimedByPlayerName = player.name;
      const acq = this.grantRelicAuthoritatively(room, player, drop.relicId, visualEvents);
      const rDef = CRIPTA_RELICS_REGISTRY[drop.relicId];
      if (acq && rDef) {
        activeRoom.outcomeLog = `¡${player.name} ha reclamado la Reliquia Ancestral: ${rDef.name} (${rDef.description})!`;
      }
    } else if (drop.kind === 'ITEM' && drop.itemId) {
      const status = this.grantNormalItemAuthoritatively(
        room,
        player,
        drop.itemId,
        'DROP',
        drop.id,
        undefined,
        visualEvents
      );
      if (status === 'ADDED') {
        drop.claimedByPlayerId = player.id;
        drop.claimedByPlayerName = player.name;
        const iDef = CRIPTA_ITEMS_REGISTRY[drop.itemId];
        activeRoom.outcomeLog = `${player.name} recoge ${iDef?.name || 'un objeto'} y lo guarda en su inventario.`;
      } else {
        activeRoom.outcomeLog = `El inventario de ${player.name} está lleno (6/6). Elige qué objeto reemplazar.`;
      }
    }

    this.emitVisualEventBatch(room, visualEvents, player.id, 'CLAIM_DROP');
    this.broadcastRoomState(room);
  }

  private handleBuyShopSlot(
    ws: WebSocket,
    room: ServerCriptaRoom,
    player: CriptaPlayer,
    slotId: string
  ) {
    if (!this.isInsideExploreOrBossPhase(room)) return;
    if (room.expeditionDefeated) return;
    if (player.isDead || player.hp <= 0) {
      this.sendError(ws, 'Un aventurero caído no puede comerciar.');
      return;
    }

    const activeRoom = this.getActiveDungeonRoom(room);
    if (!activeRoom || !activeRoom.shopInventory) return;

    const slot = activeRoom.shopInventory.find((s) => s.id === slotId && !s.soldOut);
    if (!slot) return;

    const currentGold = room.partyGold ?? 0;
    if (currentGold < slot.priceGold) {
      this.sendError(ws, `Oro insuficiente. Necesitas ${slot.priceGold} de ORO.`);
      return;
    }

    const visualEvents: CriptaVisualEvent[] = [];

    if (slot.kind === 'RELIC' && slot.relicId) {
      room.partyGold = currentGold - slot.priceGold;
      slot.soldOut = true;
      slot.buyerName = player.name;
      if (!room.runStats) room.runStats = buildDefaultRunStats();
      room.runStats.goldSpent += slot.priceGold;

      visualEvents.push({
        id: `ev_shop_gold_${Date.now()}`,
        kind: 'LOSE_GOLD',
        targetType: 'PARTY',
        value: -slot.priceGold,
        label: `-${slot.priceGold} ORO`,
        color: '#E7A54A',
        vfxStyle: 'gold',
      });

      this.grantRelicAuthoritatively(room, player, slot.relicId, visualEvents);
      const rDef = CRIPTA_RELICS_REGISTRY[slot.relicId];
      activeRoom.outcomeLog = `¡${player.name} compra la Reliquia ${rDef?.name || ''} por ${slot.priceGold} ORO!`;
    } else if (slot.kind === 'ITEM' && slot.itemId) {
      if ((player.normalInventory || []).length >= NORMAL_INVENTORY_MAX_SLOTS) {
        player.pendingInventoryReplacement = {
          playerId: player.id,
          newItemId: slot.itemId,
          sourceType: 'SHOP',
          sourceRefId: slot.id,
          priceGold: slot.priceGold,
        };
        activeRoom.outcomeLog = `Inventario lleno (6/6). Elige qué objeto reemplazar para comprar ${
          CRIPTA_ITEMS_REGISTRY[slot.itemId]?.name || 'el objeto'
        }.`;
        this.broadcastRoomState(room);
        return;
      }

      room.partyGold = currentGold - slot.priceGold;
      slot.soldOut = true;
      slot.buyerName = player.name;
      if (!room.runStats) room.runStats = buildDefaultRunStats();
      room.runStats.goldSpent += slot.priceGold;

      visualEvents.push({
        id: `ev_shop_gold_${Date.now()}`,
        kind: 'LOSE_GOLD',
        targetType: 'PARTY',
        value: -slot.priceGold,
        label: `-${slot.priceGold} ORO`,
        color: '#E7A54A',
        vfxStyle: 'gold',
      });

      this.grantNormalItemAuthoritatively(
        room,
        player,
        slot.itemId,
        'SHOP',
        slot.id,
        slot.priceGold,
        visualEvents
      );
      const iDef = CRIPTA_ITEMS_REGISTRY[slot.itemId];
      activeRoom.outcomeLog = `${player.name} compra ${iDef?.name || 'un objeto'} por ${slot.priceGold} ORO.`;
    }

    this.emitVisualEventBatch(room, visualEvents, player.id, 'BUY_SHOP');
    this.broadcastRoomState(room);
  }

  private handleResolveInventoryFull(
    ws: WebSocket,
    room: ServerCriptaRoom,
    player: CriptaPlayer,
    replaceSlotIndex: number | null
  ) {
    const pending = player.pendingInventoryReplacement;
    if (!pending) return;

    const activeRoom = this.getActiveDungeonRoom(room);
    const visualEvents: CriptaVisualEvent[] = [];

    if (replaceSlotIndex === null) {
      // Leave the new item behind
      player.pendingInventoryReplacement = null;
      if (activeRoom) {
        activeRoom.outcomeLog = `${player.name} decide conservar su inventario actual.`;
      }
      this.broadcastRoomState(room);
      return;
    }

    const idx = Number(replaceSlotIndex);
    if (!player.normalInventory || idx < 0 || idx >= player.normalInventory.length) {
      player.pendingInventoryReplacement = null;
      this.broadcastRoomState(room);
      return;
    }

    // If from SHOP, verify and deduct gold now
    if (pending.sourceType === 'SHOP' && pending.sourceRefId && activeRoom?.shopInventory) {
      const slot = activeRoom.shopInventory.find((s) => s.id === pending.sourceRefId && !s.soldOut);
      if (!slot || (room.partyGold ?? 0) < slot.priceGold) {
        player.pendingInventoryReplacement = null;
        this.sendError(ws, 'Ese objeto ya no está disponible o falta oro.');
        this.broadcastRoomState(room);
        return;
      }
      room.partyGold = (room.partyGold ?? 0) - slot.priceGold;
      slot.soldOut = true;
      slot.buyerName = player.name;
      if (!room.runStats) room.runStats = buildDefaultRunStats();
      room.runStats.goldSpent += slot.priceGold;
    } else if (pending.sourceType === 'DROP' && pending.sourceRefId && activeRoom?.groundDrops) {
      const drop = activeRoom.groundDrops.find(
        (d) => d.id === pending.sourceRefId && !d.claimedByPlayerId
      );
      if (drop) {
        drop.claimedByPlayerId = player.id;
        drop.claimedByPlayerName = player.name;
      }
    }

    const oldItemId = player.normalInventory[idx];
    const oldDef = CRIPTA_ITEMS_REGISTRY[oldItemId];
    const newDef = CRIPTA_ITEMS_REGISTRY[pending.newItemId];

    player.normalInventory[idx] = pending.newItemId;
    player.pendingInventoryReplacement = null;
    room.dungeonItemsFound = (room.dungeonItemsFound || 0) + 1;

    if (newDef) {
      visualEvents.push({
        id: `ev_rep_${Date.now()}`,
        kind: 'LOOT_ITEM',
        targetType: 'PLAYER',
        targetId: player.id,
        label: `+${newDef.name.toUpperCase()}`,
        sublabel: `REEMPLAZÓ ${oldDef?.name.toUpperCase() || ''}`,
        color: '#E7A54A',
        itemId: newDef.id,
        vfxStyle: 'gold',
      });
    }

    if (activeRoom && newDef) {
      activeRoom.outcomeLog = `${player.name} reemplaza ${oldDef?.name || 'un objeto'} por ${newDef.name}.`;
    }

    this.emitVisualEventBatch(room, visualEvents, player.id, 'REPLACE_ITEM');
    this.broadcastRoomState(room);
  }

  private handleVoteFinalBossDoor(room: ServerCriptaRoom, player: CriptaPlayer) {
    if (
      room.phase !== 'FINAL_BOSS_DOOR_READY' &&
      !(room.phase === 'THREE_DOORS' && (room.completedDoorCount ?? 0) >= 3)
    ) {
      return;
    }
    if (room.decisionResolved) return;

    if (!room.finalBossDoorVotes) room.finalBossDoorVotes = {};
    room.finalBossDoorVotes[player.id] = true;

    const connectedPlayers = room.players.filter((p) => p.isConnected);
    const votedCount = connectedPlayers.filter((p) => Boolean(room.finalBossDoorVotes?.[p.id]))
      .length;
    const isSolo = connectedPlayers.length <= 1;

    if (!isSolo && votedCount < Math.ceil(connectedPlayers.length / 2)) {
      this.broadcastRoomState(room);
      return;
    }

    // Enter the Final Boss Chamber!
    const now = Date.now();
    const bossChamber = buildFinalBossChamber(
      room.seed + 777,
      connectedPlayers.length,
      room.completedDungeonIds || []
    );
    const firstLiving = [...connectedPlayers]
      .filter((p) => !p.isDead && p.hp > 0)
      .sort((a, b) => a.seatIndex - b.seatIndex)[0];
    bossChamber.activeTurnPlayerId = firstLiving ? firstLiving.id : connectedPlayers[0]?.id || null;

    room.decisionResolved = true;
    room.doorOpeningStartedAt = now;
    room.phase = 'FINAL_BOSS_ENTRANCE';
    room.floor = 4;
    room.currentRoomIndex = 0;
    room.roomSequence = [bossChamber];
    room.inSecretRoom = false;
    room.dungeonCompleted = false;
    room.dungeonCompletionSummary = null;
    room.finalBossState = {
      active: true,
      phase: 'PHASE_1',
      phaseTransitionStartedAt: null,
      coreExposedTurns: 0,
      cataclysmCharge: 0,
    };

    // Apply start-of-combat relic passives for the Final Boss chamber
    if (this.hasPartyRelic(room, 'corona_de_cristal')) {
      for (const p of room.players) {
        if (!p.isDead && p.hp > 0) {
          applyStatusEffectToPlayer(p, 'SHIELDED', 'corona_de_cristal', 1, 2);
        }
      }
    }

    this.syncLegacyNodes(room);
    this.broadcastRoomState(room);

    if (room.doorOpeningTimer) {
      clearTimeout(room.doorOpeningTimer);
    }
    room.doorOpeningTimer = setTimeout(() => {
      room.doorOpeningTimer = null;
      if (room.phase === 'FINAL_BOSS_ENTRANCE') {
        room.phase = 'FINAL_BOSS_COMBAT';
        this.broadcastRoomState(room);
      }
    }, ENTERING_DUNGEON_DURATION_MS);
  }

  private handleEnemyKilledSideEffects(
    room: ServerCriptaRoom,
    activeRoom: CriptaDungeonRoom,
    killedEnemy: CriptaDungeonRoom['enemies'][0],
    visualEvents: CriptaVisualEvent[],
    ts: number
  ) {
    if (!room.runStats) room.runStats = buildDefaultRunStats();
    room.runStats.enemiesDefeated += 1;
    if (killedEnemy.isElite) {
      room.runStats.elitesDefeated += 1;
    }
    room.dungeonEnemiesDefeated = (room.dungeonEnemiesDefeated || 0) + 1;

    visualEvents.push({
      id: `ev_${ts}_kill_${killedEnemy.id}`,
      kind: 'ENEMY_DEATH',
      targetType: 'ENEMY',
      targetId: killedEnemy.id,
      label: `¡${killedEnemy.name.toUpperCase()} DERROTADO!`,
      color: '#E7A54A',
      vfxStyle: 'explosion',
    });

    // Relic trigger: Escudo del Sepulturero (+6 PV & +2 Armor to living party on enemy death)
    if (this.hasPartyRelic(room, 'escudo_del_sepulturero')) {
      for (const p of room.players) {
        if (!p.isDead && p.hp > 0) {
          p.hp = Math.min(p.maxHp, p.hp + 6);
          p.armor = Math.min(24, p.armor + 2);
          room.runStats.healingDone += 6;
        }
      }
    }

    // Authoritative Enemy Loot Drop Roll (Requirements 10, 11, 18)
    if (!killedEnemy.isFinalBoss) {
      const enemyIdx = Math.max(0, activeRoom.enemies.indexOf(killedEnemy));
      const drop = rollEnemyLootDrop(
        room.dungeonSeed || room.seed,
        activeRoom.index,
        enemyIdx,
        killedEnemy.name,
        killedEnemy.isElite,
        killedEnemy.isBoss,
        room.players,
        room.partyRelics || []
      );
      if (drop) {
        if (!activeRoom.groundDrops) activeRoom.groundDrops = [];
        activeRoom.groundDrops.push(drop);
      }
    }
  }

  private checkAndResolveCombatVictoryIfCleared(
    room: ServerCriptaRoom,
    activeRoom: CriptaDungeonRoom,
    actorPlayer: CriptaPlayer,
    logParts: string[],
    visualEvents: CriptaVisualEvent[],
    ts: number
  ): boolean {
    // Special check: Final Boss Phase 1 -> Phase 2 Transformation! (Requirements 32 & 33)
    if (
      activeRoom.isFinalBossRoom &&
      room.finalBossState &&
      room.finalBossState.phase === 'PHASE_1'
    ) {
      const phase1Boss = activeRoom.enemies.find((e) => e.isFinalBoss && e.bossPhase === 1);
      if (phase1Boss && phase1Boss.hp <= 0) {
        room.finalBossState.phase = 'PHASE_2';
        room.finalBossState.phaseTransitionStartedAt = ts;

        transformFinalBossToPhase2(
          activeRoom,
          room.players.filter((p) => p.isConnected).length,
          room.seed + 777
        );
        activeRoom.outcomeLog = `${logParts.join(
          ' '
        )} ¡LAS CADENAS ANCESTRALES SE QUIEBRAN! Malkorath desata su FASE II e invoca una Esquirla del Corazón.`;

        visualEvents.push({
          id: `ev_${ts}_boss_p2`,
          kind: 'BOSS_PHASE_TRANSITION',
          targetType: 'ROOM',
          label: '¡FASE II: EL CORAZÓN DESATADO!',
          sublabel: 'MALKORATH SE TRANSFORMA',
          color: '#FFD166',
          vfxStyle: 'explosion',
        });

        return true;
      }
    }

    const remainingEnemies = activeRoom.enemies.filter((e) => e.hp > 0);
    if (remainingEnemies.length > 0) {
      return false;
    }

    activeRoom.resolved = true;
    activeRoom.state = 'RESOLVED';
    activeRoom.activeTurnPlayerId = null;

    const hasGoldRelic = playerHasRelic(actorPlayer, room.partyRelics || [], 'moneda_del_muerto');
    const baseGoldReward = activeRoom.isFinalBossRoom
      ? 160
      : activeRoom.type === 'BOSS'
      ? 80
      : activeRoom.type === 'ELITE'
      ? 38
      : 22;
    const goldReward = baseGoldReward + (hasGoldRelic ? 8 : 0);

    room.partyGold = (room.partyGold ?? 45) + goldReward;
    if (!room.runStats) room.runStats = buildDefaultRunStats();
    room.runStats.goldEarned += goldReward;

    visualEvents.push({
      id: `ev_${ts}_vic_gold`,
      kind: 'GAIN_GOLD',
      targetType: 'PARTY',
      value: goldReward,
      label: `+${goldReward} ORO`,
      sublabel: activeRoom.isFinalBossRoom
        ? 'TESORO SUPREMO DE LA CRIPTA'
        : activeRoom.type === 'BOSS'
        ? 'BOTÍN DEL JEFE'
        : 'BOTÍN DE CÁMARA',
      color: '#E7A54A',
      vfxStyle: 'gold',
    });

    // Post-combat victory breath for living players
    for (const p of room.players) {
      if (!p.isDead && p.hp > 0) {
        p.hp = Math.min(p.maxHp, p.hp + 8);
        room.runStats.healingDone += 8;
        visualEvents.push({
          id: `ev_${ts}_vic_heal_${p.id}`,
          kind: 'HEAL_PLAYER',
          targetType: 'PLAYER',
          targetId: p.id,
          value: 8,
          label: '+8 PV',
          sublabel: 'VICTORIA',
          color: '#5EA87A',
          vfxStyle: 'heal',
        });
      }
    }

    if (activeRoom.isFinalBossRoom) {
      // COMPLETE RUN VICTORY! (Requirements 38 & 39)
      room.runVictory = true;
      room.dungeonCompleted = true;
      room.phase = 'RUN_VICTORY';
      if (room.finalBossState) {
        room.finalBossState.phase = 'DEFEATED';
      }
      room.runStats.finalBossDefeated = true;
      room.runStats.roomsVisited += 1;
      activeRoom.outcomeLog = `${logParts.join(
        ' '
      )} ¡MALKORATH HA SIDO DESTRUIDO! Habéis conquistado las 3 Puertas y derrotado al Corazón de la Cripta.`;
    } else if (activeRoom.type === 'BOSS') {
      room.dungeonCompleted = true;
      const doorNum = Math.min(3, (room.completedDoorCount ?? 0) + 1);
      const dName = this.getCurrentDungeonDisplayName(room);
      room.dungeonCompletionSummary = {
        dungeonId: room.selectedDungeonId || 'catacumbas_del_rey',
        dungeonName: dName,
        doorNumberCompleted: doorNum,
        goldEarned: Math.max(0, (room.partyGold ?? 0) - (room.dungeonStartGold ?? 0)),
        itemsFound: room.dungeonItemsFound || 0,
        relicsFound: room.dungeonRelicsFound || 0,
        enemiesDefeated: room.dungeonEnemiesDefeated || 0,
      };
      activeRoom.outcomeLog = `${logParts.join(
        ' '
      )} ¡Guardián derrotado! Mazmorra superada (${doorNum}/3). Recoged el botín del suelo y regresad a las Tres Puertas.`;
    } else {
      activeRoom.outcomeLog = `${logParts.join(
        ' '
      )} ¡Cámara despejada! Botín obtenido: +${goldReward} ORO y +8 VIDA.`;
    }

    return true;
  }

  private handleRoomReviveAlly(
    ws: WebSocket,
    room: ServerCriptaRoom,
    player: CriptaPlayer,
    targetPlayerId: string,
    method: 'GOLD' | 'BLOOD' | 'SHRINE'
  ) {
    if (!this.isInsideExploreOrBossPhase(room)) return;
    if (room.expeditionDefeated) return;
    const activeRoom = this.getActiveDungeonRoom(room);
    if (!activeRoom) return;

    if (player.isDead || player.hp <= 0) {
      this.sendError(ws, 'Has caído en combate. Solo un aliado en pie puede realizar el ritual de resurrección.');
      return;
    }

    const target = room.players.find((p) => p.id === targetPlayerId);
    if (!target || (!target.isDead && target.hp > 0)) {
      return;
    }

    const turnNum = (activeRoom.combatTurn || 0) + 1;
    const visualEvents: CriptaVisualEvent[] = [];

    if (method === 'SHRINE') {
      if (activeRoom.type !== 'SHRINE' && activeRoom.type !== 'REST') {
        this.sendError(ws, 'El ritual gratuito solo está disponible en un Santuario o Campamento.');
        return;
      }
      this.revivePlayerAuthoritatively(target, 0.6, 'BLESSED', turnNum);
      activeRoom.outcomeLog = `¡${player.name} canaliza la llama sagrada y REVIVE a ${target.name} (${target.hp}/${target.maxHp} PV + BENDECIDO)!`;
      visualEvents.push(
        {
          id: `ev_rev_${Date.now()}_1`,
          kind: 'REVIVE_PLAYER',
          targetType: 'PLAYER',
          targetId: target.id,
          sourcePlayerId: player.id,
          value: target.hp,
          label: `¡RESUCITADO! +${target.hp} PV`,
          sublabel: 'LLAMA SAGRADA',
          color: '#E7A54A',
          vfxStyle: 'revive',
        },
        {
          id: `ev_rev_${Date.now()}_2`,
          kind: 'STATUS_APPLIED',
          targetType: 'PLAYER',
          targetId: target.id,
          label: '+BENDECIDO (2T)',
          color: '#E7A54A',
          statusType: 'BLESSED',
        }
      );
    } else if (method === 'GOLD') {
      const cost = 20;
      const currentGold = room.partyGold ?? 0;
      if (currentGold < cost) {
        this.sendError(ws, `Se requieren ${cost} de ORO para activar el Sello de Resurrección.`);
        return;
      }
      room.partyGold = currentGold - cost;
      if (!room.runStats) room.runStats = buildDefaultRunStats();
      room.runStats.goldSpent += cost;
      this.revivePlayerAuthoritatively(target, 0.5, 'SHIELDED', turnNum);
      activeRoom.outcomeLog = `¡${player.name} ofrece ${cost} ORO al brasero de almas y REVIVE a ${target.name} (${target.hp}/${target.maxHp} PV + ESCUDO)!`;
      visualEvents.push(
        {
          id: `ev_rev_${Date.now()}_gold`,
          kind: 'LOSE_GOLD',
          targetType: 'PARTY',
          value: -cost,
          label: `-${cost} ORO`,
          sublabel: 'SELLO DE RESURRECCIÓN',
          color: '#E7A54A',
          vfxStyle: 'gold',
        },
        {
          id: `ev_rev_${Date.now()}_p`,
          kind: 'REVIVE_PLAYER',
          targetType: 'PLAYER',
          targetId: target.id,
          sourcePlayerId: player.id,
          value: target.hp,
          label: `¡RESUCITADO! +${target.hp} PV`,
          sublabel: '+ESCUDO (2T)',
          color: '#E7A54A',
          vfxStyle: 'revive',
        }
      );
    } else {
      // BLOOD tribute: rescuer sacrifices 10 HP (or Clérigo sacrifices 6 HP)
      const hpCost = player.characterId === 'clerigo' ? 6 : 10;
      if (player.hp <= hpCost + 2) {
        this.sendError(ws, `Necesitas más de ${hpCost + 2} PV para ofrecer un Tributo de Vitalidad.`);
        return;
      }
      player.hp -= hpCost;
      this.revivePlayerAuthoritatively(target, 0.45, 'REGENERATION', turnNum);
      activeRoom.outcomeLog = `¡${player.name} entrega -${hpCost} PV de su propia fuerza vital y REVIVE a ${target.name} (${target.hp}/${target.maxHp} PV)!`;
      visualEvents.push(
        {
          id: `ev_rev_${Date.now()}_cost`,
          kind: 'DAMAGE_PLAYER',
          targetType: 'PLAYER',
          targetId: player.id,
          value: -hpCost,
          label: `-${hpCost} PV`,
          sublabel: 'TRIBUTO VITAL',
          color: '#C93B5B',
        },
        {
          id: `ev_rev_${Date.now()}_p`,
          kind: 'REVIVE_PLAYER',
          targetType: 'PLAYER',
          targetId: target.id,
          sourcePlayerId: player.id,
          value: target.hp,
          label: `¡RESUCITADO! +${target.hp} PV`,
          sublabel: '+REGENERACIÓN',
          color: '#E7A54A',
          vfxStyle: 'revive',
        }
      );
    }

    if (!room.runStats) room.runStats = buildDefaultRunStats();
    room.runStats.playersRevived += 1;

    this.emitVisualEventBatch(room, visualEvents, player.id, 'REVIVE');

    this.broadcastMessage(room, {
      type: 'NOTIFICATION',
      text: `¡${target.name} ha vuelto a la vida!`,
      variant: 'success',
    });

    this.syncLegacyNodes(room);
    this.broadcastRoomState(room);
  }

  private handleRoomCombatAction(
    ws: WebSocket,
    room: ServerCriptaRoom,
    player: CriptaPlayer,
    action: 'ATTACK' | 'ABILITY' | 'DEFEND',
    targetEnemyId?: string
  ) {
    if (!this.isInsideExploreOrBossPhase(room)) return;
    if (room.expeditionDefeated) return;
    const activeRoom = this.getActiveDungeonRoom(room);
    if (!activeRoom || activeRoom.resolved) return;

    if (player.isDead || player.hp <= 0) {
      this.sendError(ws, 'Has caído en combate. Espera a que un compañero te reviva.');
      return;
    }

    const livingEnemies = activeRoom.enemies.filter((e) => e.hp > 0);
    if (livingEnemies.length === 0) {
      activeRoom.resolved = true;
      activeRoom.state = 'RESOLVED';
      this.syncLegacyNodes(room);
      this.broadcastRoomState(room);
      return;
    }

    activeRoom.combatTurn = (activeRoom.combatTurn || 0) + 1;
    const currentTurn = activeRoom.combatTurn;

    if (!activeRoom.actedPlayerIdsThisRound) {
      activeRoom.actedPlayerIdsThisRound = [];
    }
    if (!activeRoom.actedPlayerIdsThisRound.includes(player.id)) {
      activeRoom.actedPlayerIdsThisRound.push(player.id);
    }

    let target =
      livingEnemies.find((e) => e.id === targetEnemyId) || livingEnemies[0];
    const charDef = player.characterId
      ? CRIPTA_CHARACTERS_CATALOG[player.characterId]
      : null;

    const atkStat = (charDef ? charDef.stats.attack : 5) + (player.bonusAttack || 0);
    const magStat = (charDef ? charDef.stats.magic : 4) + (player.bonusMagic || 0);
    const defStat = (charDef ? charDef.stats.defense : 5) + (player.bonusDefense || 0);

    const visualEvents: CriptaVisualEvent[] = [];
    const ts = Date.now();

    // Class-specific VFX style
    const classVfx: NonNullable<CriptaVisualEvent['vfxStyle']> =
      player.characterId === 'mago'
        ? 'arcane'
        : player.characterId === 'cazador'
        ? 'arrow'
        : player.characterId === 'clerigo'
        ? 'holy'
        : player.characterId === 'alquimista'
        ? 'alchemy'
        : 'slash';

    // 1. Check active player status modifiers (CONFUSION, FROST, CURSE, FEAR, WEAKENED, BLESSED, BLEED)
    const hasConfusion = Boolean(playerHasStatus(player, 'CONFUSION'));
    const hasFrost = Boolean(playerHasStatus(player, 'FROST'));
    const hasCurse = Boolean(playerHasStatus(player, 'CURSE'));
    const hasFear = Boolean(playerHasStatus(player, 'FEAR'));
    const hasWeakened = Boolean(playerHasStatus(player, 'WEAKENED'));
    const hasBlessed = Boolean(playerHasStatus(player, 'BLESSED'));
    const bleedInstance = playerHasStatus(player, 'BLEED');

    let dmgMultiplier = 1;
    if (hasFrost) dmgMultiplier -= 0.2;
    if (hasCurse) dmgMultiplier -= 0.2;
    if (hasFear) dmgMultiplier -= 0.2;
    if (hasWeakened) dmgMultiplier -= 0.18;
    if (hasBlessed) dmgMultiplier += 0.25;
    if (action === 'ABILITY' && playerHasRelic(player, room.partyRelics || [], 'libro_prohibido')) {
      dmgMultiplier += 0.3;
      applyStatusEffectToPlayer(player, 'BLESSED', 'libro_prohibido', currentTurn, 2);
    }
    if (this.hasPartyRelic(room, 'sello_del_vacio')) {
      dmgMultiplier += 0.1;
    }
    if ((target.poisonStacks || 0) > 0 && this.hasPartyRelic(room, 'toxina_real')) {
      dmgMultiplier += 0.25;
    }
    dmgMultiplier = Math.max(0.45, dmgMultiplier);

    const logParts: string[] = [];

    // Confusion check: may redirect attack or reduce accuracy
    if (hasConfusion && action !== 'DEFEND') {
      const randomIdx = currentTurn % livingEnemies.length;
      target = livingEnemies[randomIdx];
      dmgMultiplier *= 0.8;
      logParts.push(`¡CONFUSIÓN desvía el golpe de ${player.name} hacia ${target.name}!`);
    }

    // Bleed on offensive action
    if (bleedInstance && (action === 'ATTACK' || action === 'ABILITY')) {
      const bleedDmg = 2 * Math.max(1, bleedInstance.stacks);
      player.hp = Math.max(1, player.hp - bleedDmg);
      logParts.push(`(${player.name} pierde -${bleedDmg} PV por SANGRADO al atacar)`);
      visualEvents.push({
        id: `ev_${ts}_bleed_act`,
        kind: 'DAMAGE_PLAYER',
        targetType: 'PLAYER',
        targetId: player.id,
        value: -bleedDmg,
        label: `-${bleedDmg} PV`,
        sublabel: 'SANGRADO',
        color: '#E03E52',
        statusType: 'BLEED',
      });
    }

    const healMult = hasCurse ? 0.65 : 1;

    // Critical hit determination (Pícaro & Cazador crit more frequently; Blessed also boosts crit)
    const critMod =
      player.characterId === 'picaro' || player.characterId === 'cazador' ? 2 : 3;
    const isCrit =
      action !== 'DEFEND' &&
      !hasWeakened &&
      ((currentTurn + player.seatIndex) % critMod === 0 || hasBlessed);
    const hasCalizRelic = playerHasRelic(player, room.partyRelics || [], 'diente_del_rey');

    if (!room.runStats) room.runStats = buildDefaultRunStats();

    if (action === 'DEFEND') {
      const healAmt = Math.max(3, Math.round(6 * healMult));
      // Reinforce living party armor, apply SHIELDED, and counter-strike
      for (const p of room.players) {
        if (!p.isDead && p.hp > 0) {
          p.armor = Math.min(24, p.armor + 2);
          p.hp = Math.min(p.maxHp, p.hp + healAmt);
          room.runStats.healingDone += healAmt;
          applyStatusEffectToPlayer(p, 'SHIELDED', player.id, currentTurn, 2);
          visualEvents.push(
            {
              id: `ev_${ts}_def_${p.id}`,
              kind: 'SHIELD_PLAYER',
              targetType: 'PLAYER',
              targetId: p.id,
              sourcePlayerId: player.id,
              value: 2,
              label: '+2 ARMADURA',
              sublabel: 'ESCUDO (2T)',
              color: '#69A8A5',
              statusType: 'SHIELDED',
              vfxStyle: 'shield',
            },
            {
              id: `ev_${ts}_def_heal_${p.id}`,
              kind: 'HEAL_PLAYER',
              targetType: 'PLAYER',
              targetId: p.id,
              value: healAmt,
              label: `+${healAmt} PV`,
              color: '#5EA87A',
              vfxStyle: 'heal',
            }
          );
        }
      }
      const prevTargetHp = target.hp;
      const dmg = Math.max(4, Math.round(defStat * 1.4 * dmgMultiplier));
      target.hp = Math.max(0, target.hp - dmg);
      room.runStats.damageDealt += dmg;
      visualEvents.push({
        id: `ev_${ts}_def_strike_${target.id}`,
        kind: 'DAMAGE_ENEMY',
        targetType: 'ENEMY',
        targetId: target.id,
        sourcePlayerId: player.id,
        value: -dmg,
        label: `-${dmg} PV`,
        sublabel: 'CONTRAGOLPE',
        color: '#69A8A5',
        vfxStyle: 'shield',
      });
      if (prevTargetHp > 0 && target.hp <= 0) {
        this.handleEnemyKilledSideEffects(room, activeRoom, target, visualEvents, ts);
      }
      logParts.push(
        `${player.name} alza la guardia (+2 ARMADURA, ESCUDO 2T) y golpea a ${target.name} (-${dmg} PV).`
      );
    } else if (action === 'ABILITY') {
      const abilityName = charDef?.abilities[0]?.name || 'Técnica Arcana';
      const rawPower = Math.max(atkStat, magStat) * 2.4 + 6;
      const critFactor = isCrit ? (hasCalizRelic ? 1.7 : 1.35) : 1;
      const dmg = Math.max(
        7,
        Math.round((rawPower - target.armor * 0.3) * dmgMultiplier * critFactor)
      );
      const prevTargetHp = target.hp;
      target.hp = Math.max(0, target.hp - dmg);
      room.runStats.damageDealt += dmg;

      visualEvents.push({
        id: `ev_${ts}_ab_${target.id}`,
        kind: isCrit ? 'CRIT_ENEMY' : 'DAMAGE_ENEMY',
        targetType: 'ENEMY',
        targetId: target.id,
        sourcePlayerId: player.id,
        value: -dmg,
        label: isCrit ? `¡CRÍTICO! -${dmg} PV` : `-${dmg} PV`,
        sublabel: abilityName.toUpperCase(),
        color: isCrit ? '#E7A54A' : '#9B72CF',
        vfxStyle: classVfx,
        isCrit,
      });

      if (prevTargetHp > 0 && target.hp <= 0) {
        this.handleEnemyKilledSideEffects(room, activeRoom, target, visualEvents, ts);
      }

      if (player.characterId === 'clerigo') {
        // Clérigo heals, purifies 1 debuff, and if an ally is fallen, revives them!
        const fallenAlly = room.players.find((p) => p.isDead || (p.characterId && p.hp <= 0));
        if (fallenAlly) {
          this.revivePlayerAuthoritatively(fallenAlly, 0.4, 'BLESSED', currentTurn);
          room.runStats.playersRevived += 1;
          visualEvents.push({
            id: `ev_${ts}_cler_rev_${fallenAlly.id}`,
            kind: 'REVIVE_PLAYER',
            targetType: 'PLAYER',
            targetId: fallenAlly.id,
            sourcePlayerId: player.id,
            value: fallenAlly.hp,
            label: `¡RESUCITADO! +${fallenAlly.hp} PV`,
            sublabel: abilityName.toUpperCase(),
            color: '#E7A54A',
            vfxStyle: 'revive',
          });
          logParts.push(
            `${player.name} invoca ${abilityName} (-${dmg} PV a ${target.name}) y ¡REVIVE a ${fallenAlly.name} con luz sagrada!`
          );
        } else {
          const healAmt = Math.round(11 * healMult);
          for (const p of room.players) {
            if (!p.isDead && p.hp > 0) {
              p.hp = Math.min(p.maxHp, p.hp + healAmt);
              room.runStats.healingDone += healAmt;
              const removed = purifyPlayerDebuffs(p, 1);
              applyStatusEffectToPlayer(p, 'BLESSED', player.id, currentTurn, 2);
              visualEvents.push({
                id: `ev_${ts}_cler_heal_${p.id}`,
                kind: 'HEAL_PLAYER',
                targetType: 'PLAYER',
                targetId: p.id,
                value: healAmt,
                label: `+${healAmt} PV`,
                sublabel: removed.length > 0 ? 'PURIFICADO + BENDECIDO' : '+BENDECIDO (2T)',
                color: '#5EA87A',
                statusType: 'BLESSED',
                vfxStyle: 'holy',
              });
            }
          }
          logParts.push(
            `${player.name} invoca ${abilityName} (-${dmg} PV a ${target.name}), restaura vida, purifica 1 aflicción y otorga BENDECIDO.`
          );
        }
      } else if (player.characterId === 'alquimista') {
        const healAmt = Math.round(9 * healMult);
        for (const p of room.players) {
          if (!p.isDead && p.hp > 0) {
            p.hp = Math.min(p.maxHp, p.hp + healAmt);
            room.runStats.healingDone += healAmt;
            const removed = purifyPlayerDebuffs(p, 1);
            applyStatusEffectToPlayer(p, 'REGENERATION', player.id, currentTurn, 2);
            visualEvents.push({
              id: `ev_${ts}_alq_${p.id}`,
              kind: 'HEAL_PLAYER',
              targetType: 'PLAYER',
              targetId: p.id,
              value: healAmt,
              label: `+${healAmt} PV`,
              sublabel: removed.length > 0 ? 'ANTÍDOTO + REGEN' : '+REGENERACIÓN (2T)',
              color: '#5EA87A',
              statusType: 'REGENERATION',
              vfxStyle: 'alchemy',
            });
          }
        }
        logParts.push(
          `${player.name} lanza ${abilityName} (-${dmg} PV a ${target.name}), purifica toxinas y otorga REGENERACIÓN (2T).`
        );
      } else if (player.characterId === 'caballero') {
        for (const p of room.players) {
          if (!p.isDead && p.hp > 0) {
            p.armor = Math.min(24, p.armor + 2);
            applyStatusEffectToPlayer(p, 'SHIELDED', player.id, currentTurn, 2);
            visualEvents.push({
              id: `ev_${ts}_cab_${p.id}`,
              kind: 'SHIELD_PLAYER',
              targetType: 'PLAYER',
              targetId: p.id,
              value: 2,
              label: '+2 ARMADURA',
              sublabel: '+ESCUDO (2T)',
              color: '#69A8A5',
              statusType: 'SHIELDED',
              vfxStyle: 'shield',
            });
          }
        }
        logParts.push(
          `${player.name} ejecuta ${abilityName} (-${dmg} PV a ${target.name}) y protege al grupo con ESCUDO (2T).`
        );
      } else {
        // Splash damage to other living enemies
        for (const other of livingEnemies) {
          if (other.id !== target.id) {
            const prevOtherHp = other.hp;
            const splashDmg = Math.round(dmg * 0.45);
            other.hp = Math.max(0, other.hp - splashDmg);
            room.runStats.damageDealt += splashDmg;
            visualEvents.push({
              id: `ev_${ts}_splash_${other.id}`,
              kind: 'DAMAGE_ENEMY',
              targetType: 'ENEMY',
              targetId: other.id,
              sourcePlayerId: player.id,
              value: -splashDmg,
              label: `-${splashDmg} PV`,
              color: '#9B72CF',
              vfxStyle: classVfx,
            });
            if (prevOtherHp > 0 && other.hp <= 0) {
              this.handleEnemyKilledSideEffects(room, activeRoom, other, visualEvents, ts);
            }
          }
        }
        logParts.push(
          `${player.name} desata ${abilityName} contra ${target.name} (${isCrit ? '¡CRÍTICO! ' : ''}-${dmg} PV).`
        );
      }
    } else {
      // Standard ATTACK
      const rawDmg = atkStat * 2.1 + magStat * 0.7 + 5;
      const critFactor = isCrit ? (hasCalizRelic ? 1.8 : 1.45) : 1;
      const dmg = Math.max(
        5,
        Math.round((rawDmg - target.armor * 0.5) * dmgMultiplier * critFactor)
      );
      const prevTargetHp = target.hp;
      target.hp = Math.max(0, target.hp - dmg);
      room.runStats.damageDealt += dmg;

      visualEvents.push({
        id: `ev_${ts}_atk_${target.id}`,
        kind: isCrit ? 'CRIT_ENEMY' : 'DAMAGE_ENEMY',
        targetType: 'ENEMY',
        targetId: target.id,
        sourcePlayerId: player.id,
        value: -dmg,
        label: isCrit ? `¡CRÍTICO! -${dmg} PV` : `-${dmg} PV`,
        sublabel: isCrit ? 'GOLPE LETAL' : 'ATAQUE',
        color: isCrit ? '#E7A54A' : '#C93B5B',
        vfxStyle: classVfx,
        isCrit,
      });

      if (prevTargetHp > 0 && target.hp <= 0) {
        this.handleEnemyKilledSideEffects(room, activeRoom, target, visualEvents, ts);
      }

      // Passive Relic: Espina Viva poisons target and deals +6 extra damage
      if (playerHasRelic(player, room.partyRelics || [], 'espina_viva') && target.hp > 0) {
        target.poisonStacks = (target.poisonStacks || 0) + 1;
        const prevHp = target.hp;
        target.hp = Math.max(0, target.hp - 6);
        room.runStats.damageDealt += 6;
        visualEvents.push({
          id: `ev_${ts}_thorn_atk_${target.id}`,
          kind: 'DAMAGE_ENEMY',
          targetType: 'ENEMY',
          targetId: target.id,
          value: -6,
          label: '-6 PV (ESPINA VIVA)',
          color: '#5EA87A',
        });
        if (prevHp > 0 && target.hp <= 0) {
          this.handleEnemyKilledSideEffects(room, activeRoom, target, visualEvents, ts);
        }
      }

      logParts.push(
        `${player.name} ataca a ${target.name} e inflige ${isCrit ? '¡DAÑO CRÍTICO! ' : ''}${dmg} de daño.`
      );
    }

    const victoryOrPhaseTriggered = this.checkAndResolveCombatVictoryIfCleared(
      room,
      activeRoom,
      player,
      logParts,
      visualEvents,
      ts
    );

    if (!victoryOrPhaseTriggered) {
      const remainingEnemies = activeRoom.enemies.filter((e) => e.hp > 0);
      // 2. Living enemy counterattack + Biome Status Application
      const attacker = remainingEnemies[0];
      const hasFrostDebuff = Boolean(playerHasStatus(player, 'FROST'));
      const effectiveArmor = hasFrostDebuff ? Math.max(0, player.armor - 2) : player.armor;
      const shieldBuff = playerHasStatus(player, 'SHIELDED');
      const markedDebuff = playerHasStatus(player, 'MARKED');

      const mitigation = Math.min(
        attacker.intentValue - 3,
        Math.round(effectiveArmor * 0.6) + (shieldBuff ? shieldBuff.potency : 0)
      );
      let netDamage = Math.max(4, attacker.intentValue - Math.max(0, mitigation));

      if (markedDebuff) {
        netDamage = Math.round(netDamage * 1.35);
        // Consume MARKED after boosted hit
        player.statuses = player.statuses.filter((s) => s.effectType !== 'MARKED');
        logParts.push(`¡MARCADO amplifica el golpe!`);
      }

      // Real damage: player HP can reach 0!
      player.hp = Math.max(0, player.hp - netDamage);
      room.runStats.damageReceived += netDamage;

      visualEvents.push(
        {
          id: `ev_${ts}_en_lunge_${attacker.id}`,
          kind: 'ENEMY_ATTACK',
          targetType: 'ENEMY',
          targetId: attacker.id,
          label: `${attacker.intent} -${netDamage}`,
          color: '#C93B5B',
          vfxStyle: 'claw',
        },
        {
          id: `ev_${ts}_p_hit_${player.id}`,
          kind: 'DAMAGE_PLAYER',
          targetType: 'PLAYER',
          targetId: player.id,
          value: -netDamage,
          label: `-${netDamage} PV`,
          sublabel: attacker.name.toUpperCase(),
          color: '#C93B5B',
          vfxStyle: 'claw',
        }
      );

      // Passive Relic: Espina Viva reflects 3 damage to attacker
      if (playerHasRelic(player, room.partyRelics || [], 'espina_viva') && attacker.hp > 0) {
        const prevAttHp = attacker.hp;
        attacker.hp = Math.max(0, attacker.hp - 3);
        room.runStats.damageDealt += 3;
        visualEvents.push({
          id: `ev_${ts}_thorn_${attacker.id}`,
          kind: 'DAMAGE_ENEMY',
          targetType: 'ENEMY',
          targetId: attacker.id,
          value: -3,
          label: '-3 PV',
          sublabel: 'ESPINA VIVA',
          color: '#E7A54A',
        });
        if (prevAttHp > 0 && attacker.hp <= 0) {
          this.handleEnemyKilledSideEffects(room, activeRoom, attacker, visualEvents, ts);
        }
      }

      // Apply biome status effect if enemy intent is AFLICCIÓN / MALDICIÓN or on Elite/Boss strikes
      const shouldInflictStatus =
        player.hp > 0 &&
        attacker.statusThreat &&
        (attacker.intent === 'AFLICCIÓN' ||
          attacker.intent === 'MALDICIÓN' ||
          attacker.isBoss ||
          attacker.isElite ||
          currentTurn % 2 === 1);

      let statusAppliedLog = '';
      if (shouldInflictStatus && attacker.statusThreat) {
        const statusToApply =
          currentTurn % 3 === 0 && attacker.statusSecondaryThreat
            ? attacker.statusSecondaryThreat
            : attacker.statusThreat;
        const applied = applyStatusEffectToPlayer(
          player,
          statusToApply,
          attacker.id,
          currentTurn
        );
        if (applied) {
          if (
            this.hasPartyRelic(room, 'sello_del_vacio') &&
            (applied.effectType === 'CONFUSION' || applied.effectType === 'CURSE')
          ) {
            applied.remainingTurns = Math.max(1, applied.remainingTurns - 1);
          }
          const sDef = CRIPTA_STATUS_EFFECTS_REGISTRY[applied.effectType];
          const abilityLabel = attacker.abilityName ? ` con ${attacker.abilityName}` : '';
          statusAppliedLog = ` y aplica ${applied.name} (${applied.remainingTurns}T)${abilityLabel}`;
          visualEvents.push({
            id: `ev_${ts}_st_${player.id}`,
            kind: 'STATUS_APPLIED',
            targetType: 'PLAYER',
            targetId: player.id,
            label: `+${applied.name} (${applied.remainingTurns}T)`,
            sublabel: attacker.abilityName || undefined,
            color: sDef?.visualTreatment.color || '#E7A54A',
            statusType: applied.effectType,
          });
        }
      }

      // Cycle enemy intent
      const nextIntents: CriptaDungeonRoom['enemies'][0]['intent'][] = [
        'ATAQUE',
        'AFLICCIÓN',
        'GUARDIA',
        'MALDICIÓN',
        'FURIA',
      ];
      attacker.intent =
        nextIntents[(attacker.hp + currentTurn) % nextIntents.length];

      logParts.push(
        `${attacker.name} contraataca (-${netDamage} PV${statusAppliedLog}).`
      );

      // Check if player died from direct hit
      if (player.hp <= 0) {
        player.hp = 0;
        player.isDead = true;
        player.deathsCount = (player.deathsCount || 0) + 1;
        player.statuses = [];
        logParts.push(`¡${player.name} ha CAÍDO en combate!`);
        this.broadcastMessage(room, {
          type: 'NOTIFICATION',
          text: `¡${player.name} ha caído en combate!`,
          variant: 'danger',
        });
      } else {
        // 3. End-of-turn status ticks (POISON, BURN, BLEED, REGENERATION)
        const tickResult = resolvePlayerTurnEndStatusTicks(player);
        if (tickResult.damageTaken > 0) {
          room.runStats.damageReceived += tickResult.damageTaken;
          visualEvents.push({
            id: `ev_${ts}_dot_${player.id}`,
            kind: 'DAMAGE_PLAYER',
            targetType: 'PLAYER',
            targetId: player.id,
            value: -tickResult.damageTaken,
            label: `-${tickResult.damageTaken} PV`,
            sublabel: 'AFLICCIÓN',
            color: '#C93B5B',
          });
        }
        if (tickResult.healedAmount > 0) {
          room.runStats.healingDone += tickResult.healedAmount;
          visualEvents.push({
            id: `ev_${ts}_hot_${player.id}`,
            kind: 'HEAL_PLAYER',
            targetType: 'PLAYER',
            targetId: player.id,
            value: tickResult.healedAmount,
            label: `+${tickResult.healedAmount} PV`,
            sublabel: 'REGENERACIÓN',
            color: '#5EA87A',
            statusType: 'REGENERATION',
          });
        }
        if (tickResult.logSegments.length > 0) {
          logParts.push(`[${tickResult.logSegments.join(' · ')}]`);
        }
        if (tickResult.diedFromStatus) {
          this.broadcastMessage(room, {
            type: 'NOTIFICATION',
            text: `¡${player.name} ha caído por sus aflicciones!`,
            variant: 'danger',
          });
        }
      }

      // Advance turn pointer to next living connected player
      const livingConnected = room.players.filter(
        (p) => p.isConnected && !p.isDead && p.hp > 0
      );
      if (
        activeRoom.actedPlayerIdsThisRound &&
        activeRoom.actedPlayerIdsThisRound.length >= livingConnected.length
      ) {
        activeRoom.actedPlayerIdsThisRound = [];
      }
      activeRoom.activeTurnPlayerId = this.computeNextTurnPlayerId(
        room,
        activeRoom,
        player.id
      );

      // Check if entire party is defeated
      if (this.checkAndApplyPartyDefeat(room)) {
        logParts.push('¡TODA LA EXPEDICIÓN HA CAÍDO EN LA CRIPTA!');
      }

      activeRoom.outcomeLog = logParts.join(' ');
    }

    this.emitVisualEventBatch(room, visualEvents, player.id, action);
    this.syncLegacyNodes(room);
    this.broadcastRoomState(room);
  }

  private handleRoomInteractOption(
    ws: WebSocket,
    room: ServerCriptaRoom,
    player: CriptaPlayer,
    optionId: string
  ) {
    if (room.phase !== 'DUNGEON' && room.phase !== 'DUNGEON_ARRIVAL') return;
    if (room.expeditionDefeated) return;
    const activeRoom = this.getActiveDungeonRoom(room);
    if (!activeRoom) return;

    if (player.isDead || player.hp <= 0) {
      this.sendError(ws, 'Has caído en combate. Un compañero vivo debe activar esta opción.');
      return;
    }

    const opt = activeRoom.options.find((o) => o.id === optionId);
    if (!opt || opt.resolved) return;

    const connectedPlayers = room.players.filter((p) => p.isConnected);
    const livingConnected = connectedPlayers.filter((p) => !p.isDead && p.hp > 0);
    const isSolo = livingConnected.length <= 1;

    // For DECISION rooms in multiplayer, allow group voting among living players
    if (activeRoom.type === 'DECISION' && !isSolo && !activeRoom.resolved) {
      activeRoom.optionVotes[player.id] = optionId;
      const votedCount = livingConnected.filter(
        (p) => Boolean(activeRoom.optionVotes[p.id])
      ).length;
      const votesForThis = livingConnected.filter(
        (p) => activeRoom.optionVotes[p.id] === optionId
      ).length;

      if (votesForThis < Math.ceil(livingConnected.length / 2) && votedCount < livingConnected.length) {
        activeRoom.outcomeLog = `${player.name} señala: ${opt.label} (${votesForThis}/${livingConnected.length} votos).`;
        this.broadcastRoomState(room);
        return;
      }
    }

    const visualEvents: CriptaVisualEvent[] = [];
    const ts = Date.now();

    // Shop cost check
    if (typeof opt.costGold === 'number' && opt.costGold > 0) {
      const currentGold = room.partyGold ?? 0;
      if (currentGold < opt.costGold) {
        activeRoom.outcomeLog = `Oro insuficiente para adquirir ${opt.label} (requiere ${opt.costGold} ORO).`;
        this.broadcastRoomState(room);
        return;
      }
      room.partyGold = currentGold - opt.costGold;
      visualEvents.push({
        id: `ev_${ts}_spend_gold`,
        kind: 'LOSE_GOLD',
        targetType: 'PARTY',
        value: -opt.costGold,
        label: `-${opt.costGold} ORO`,
        sublabel: opt.label,
        color: '#E7A54A',
        vfxStyle: 'gold',
      });
    }

    opt.resolved = true;
    if (!opt.usedByPlayerIds.includes(player.id)) {
      opt.usedByPlayerIds.push(player.id);
    }

    const dungeonId = room.selectedDungeonId || 'catacumbas_del_rey';
    const threatProfile =
      DUNGEON_BIOME_THREAT_PROFILES[dungeonId] ||
      DUNGEON_BIOME_THREAT_PROFILES.catacumbas_del_rey;

    // If this option is a revival option, revive all fallen players first
    if (opt.isReviveOption) {
      for (const p of room.players) {
        if (p.isDead || p.hp <= 0) {
          this.revivePlayerAuthoritatively(p, 0.55, 'BLESSED', 1);
          visualEvents.push({
            id: `ev_${ts}_opt_rev_${p.id}`,
            kind: 'REVIVE_PLAYER',
            targetType: 'PLAYER',
            targetId: p.id,
            value: p.hp,
            label: `¡RESUCITADO! +${p.hp} PV`,
            color: '#E7A54A',
            vfxStyle: 'revive',
          });
        }
      }
    }

    const pushPartyStatEvents = (
      healAmt: number,
      armorGain: number,
      atkGain: number,
      magGain: number,
      statusType?: 'SHIELDED' | 'BLESSED' | 'REGENERATION' | 'BLEED',
      purified = false
    ) => {
      for (const p of room.players) {
        if (!p.isDead && p.hp > 0) {
          if (healAmt > 0) {
            visualEvents.push({
              id: `ev_${ts}_h_${p.id}`,
              kind: 'HEAL_PLAYER',
              targetType: 'PLAYER',
              targetId: p.id,
              value: healAmt,
              label: `+${healAmt} PV`,
              sublabel: purified ? 'PURIFICADO' : undefined,
              color: '#5EA87A',
              vfxStyle: 'heal',
            });
          } else if (healAmt < 0) {
            visualEvents.push({
              id: `ev_${ts}_dmg_${p.id}`,
              kind: 'DAMAGE_PLAYER',
              targetType: 'PLAYER',
              targetId: p.id,
              value: healAmt,
              label: `${healAmt} PV`,
              color: '#C93B5B',
            });
          }
          if (atkGain > 0) {
            visualEvents.push({
              id: `ev_${ts}_atk_${p.id}`,
              kind: 'GAIN_ATTACK',
              targetType: 'PLAYER',
              targetId: p.id,
              value: atkGain,
              label: `+${atkGain} ATAQUE`,
              color: '#E7A54A',
              vfxStyle: 'slash',
            });
          }
          if (armorGain > 0) {
            visualEvents.push({
              id: `ev_${ts}_arm_${p.id}`,
              kind: 'GAIN_DEFENSE',
              targetType: 'PLAYER',
              targetId: p.id,
              value: armorGain,
              label: `+${armorGain} ARMADURA`,
              color: '#69A8A5',
              vfxStyle: 'shield',
            });
          }
          if (magGain > 0) {
            visualEvents.push({
              id: `ev_${ts}_mag_${p.id}`,
              kind: 'GAIN_MAGIC',
              targetType: 'PLAYER',
              targetId: p.id,
              value: magGain,
              label: `+${magGain} MAGIA`,
              color: '#9B72CF',
              vfxStyle: 'arcane',
            });
          }
          if (statusType) {
            const sDef = CRIPTA_STATUS_EFFECTS_REGISTRY[statusType];
            visualEvents.push({
              id: `ev_${ts}_st_${p.id}`,
              kind: 'STATUS_APPLIED',
              targetType: 'PLAYER',
              targetId: p.id,
              label: `+${sDef.name}`,
              color: sDef.visualTreatment.color,
              statusType,
            });
          }
        }
      }
    };

    // Apply effects based on option icon/type to living players
    if (opt.id.includes('open_chest')) {
      room.partyGold = (room.partyGold ?? 0) + 45;
      room.runStats.goldEarned += 45;
      visualEvents.push({
        id: `ev_${ts}_gold`,
        kind: 'GAIN_GOLD',
        targetType: 'PARTY',
        value: 45,
        label: '+45 ORO',
        sublabel: 'ARCA DEL TESORO',
        color: '#E7A54A',
        vfxStyle: 'gold',
      });
      const chestSeed = (room.dungeonSeed || room.seed) + activeRoom.index * 97 + ts;
      const relicCandId = pickUnownedRelic(chestSeed, 1, room.players, room.partyRelics || []);
      if (relicCandId && ((chestSeed >>> 2) % 100) < 65) {
        this.grantRelicAuthoritatively(room, player, relicCandId, visualEvents);
      } else {
        this.grantNormalItemAuthoritatively(
          room,
          player,
          'pocion_curacion',
          'CHEST',
          opt.id,
          undefined,
          visualEvents
        );
      }
      for (const p of room.players) {
        if (!p.isDead && p.hp > 0) {
          p.hp = Math.min(p.maxHp, p.hp + 12);
          p.armor = Math.min(24, p.armor + 3);
          p.bonusAttack = (p.bonusAttack || 0) + 1;
          p.inventoryItems = [...(p.inventoryItems || []), opt.label.replace('ABRIR ARCA: ', '')];
          applyStatusEffectToPlayer(p, 'SHIELDED', 'chest', 1, 3);
        }
      }
      pushPartyStatEvents(12, 3, 1, 0, 'SHIELDED', false);
    } else if (opt.id.includes('purify_relic')) {
      room.partyGold = (room.partyGold ?? 0) + 20;
      room.runStats.goldEarned += 20;
      visualEvents.push({
        id: `ev_${ts}_gold`,
        kind: 'GAIN_GOLD',
        targetType: 'PARTY',
        value: 20,
        label: '+20 ORO',
        color: '#E7A54A',
        vfxStyle: 'gold',
      });
      for (const p of room.players) {
        if (!p.isDead && p.hp > 0) {
          p.hp = Math.min(p.maxHp, p.hp + 24);
          p.bonusMagic = (p.bonusMagic || 0) + 1;
          purifyPlayerDebuffs(p, 99);
          applyStatusEffectToPlayer(p, 'BLESSED', 'relic', 1, 3);
        }
      }
      pushPartyStatEvents(24, 0, 0, 1, 'BLESSED', true);
    } else if (opt.id.includes('loot_pouch')) {
      room.partyGold = (room.partyGold ?? 0) + 28;
      room.runStats.goldEarned += 28;
      visualEvents.push({
        id: `ev_${ts}_gold`,
        kind: 'GAIN_GOLD',
        targetType: 'PARTY',
        value: 28,
        label: '+28 ORO',
        sublabel: 'SUMINISTROS',
        color: '#E7A54A',
        vfxStyle: 'gold',
      });
      this.grantNormalItemAuthoritatively(
        room,
        player,
        'venda',
        'CHEST',
        opt.id,
        undefined,
        visualEvents
      );
      for (const p of room.players) {
        if (!p.isDead && p.hp > 0) {
          p.hp = Math.min(p.maxHp, p.hp + 10);
          purifyPlayerDebuffs(p, 1);
        }
      }
      pushPartyStatEvents(10, 0, 0, 0, undefined, true);
    } else if (opt.id.includes('loot_armor')) {
      room.partyGold = (room.partyGold ?? 0) + 15;
      room.runStats.goldEarned += 15;
      visualEvents.push({
        id: `ev_${ts}_gold`,
        kind: 'GAIN_GOLD',
        targetType: 'PARTY',
        value: 15,
        label: '+15 ORO',
        color: '#E7A54A',
        vfxStyle: 'gold',
      });
      for (const p of room.players) {
        if (!p.isDead && p.hp > 0) {
          p.armor = Math.min(24, p.armor + 2);
          p.bonusAttack = (p.bonusAttack || 0) + 1;
          applyStatusEffectToPlayer(p, 'SHIELDED', 'loot', 1, 3);
        }
      }
      pushPartyStatEvents(0, 2, 1, 0, 'SHIELDED', false);
    } else if (opt.id.includes('rest_heal')) {
      for (const p of room.players) {
        if (!p.isDead && p.hp > 0) {
          const healAmt = Math.max(18, Math.round(p.maxHp * 0.35));
          p.hp = Math.min(p.maxHp, p.hp + healAmt);
          purifyPlayerDebuffs(p, 99);
        }
      }
      pushPartyStatEvents(22, 0, 0, 0, undefined, true);
    } else if (opt.id.includes('rest_sharpen')) {
      for (const p of room.players) {
        if (!p.isDead && p.hp > 0) {
          p.armor = Math.min(24, p.armor + 3);
          p.bonusAttack = (p.bonusAttack || 0) + 1;
          p.hp = Math.min(p.maxHp, p.hp + 15);
          applyStatusEffectToPlayer(p, 'REGENERATION', 'rest', 1, 3);
        }
      }
      pushPartyStatEvents(15, 3, 1, 0, 'REGENERATION', false);
    } else if (opt.id.includes('shrine_blessing')) {
      for (const p of room.players) {
        if (!p.isDead && p.hp > 0) {
          p.hp = Math.min(p.maxHp, p.hp + 22);
          p.armor = Math.min(24, p.armor + 3);
          p.bonusMagic = (p.bonusMagic || 0) + 1;
          purifyPlayerDebuffs(p, 99);
          applyStatusEffectToPlayer(p, 'BLESSED', 'shrine', 1, 3);
        }
      }
      pushPartyStatEvents(22, 3, 0, 1, 'BLESSED', true);
    } else if (opt.id.includes('shrine_pact')) {
      room.partyGold = (room.partyGold ?? 0) + 55;
      room.runStats.goldEarned += 55;
      visualEvents.push({
        id: `ev_${ts}_gold`,
        kind: 'GAIN_GOLD',
        targetType: 'PARTY',
        value: 55,
        label: '+55 ORO',
        sublabel: 'PACTO DE SANGRE',
        color: '#E7A54A',
        vfxStyle: 'gold',
      });
      for (const p of room.players) {
        if (!p.isDead && p.hp > 0) {
          p.hp = Math.max(4, p.hp - 8);
          p.armor = Math.min(24, p.armor + 4);
          p.bonusAttack = (p.bonusAttack || 0) + 2;
          applyStatusEffectToPlayer(p, 'BLEED', 'shrine_pact', 1, 2);
        }
      }
      pushPartyStatEvents(-8, 4, 2, 0, 'BLEED', false);
    } else if (opt.id.includes('shop_elixir')) {
      for (const p of room.players) {
        if (!p.isDead && p.hp > 0) {
          p.hp = Math.min(p.maxHp, p.hp + 30);
          purifyPlayerDebuffs(p, 99);
          applyStatusEffectToPlayer(p, 'REGENERATION', 'shop', 1, 3);
        }
      }
      pushPartyStatEvents(30, 0, 0, 0, 'REGENERATION', true);
    } else if (opt.id.includes('shop_revive')) {
      for (const p of room.players) {
        if (!p.isDead && p.hp > 0) {
          applyStatusEffectToPlayer(p, 'SHIELDED', 'shop', 1, 3);
        }
      }
      pushPartyStatEvents(0, 0, 0, 0, 'SHIELDED', false);
    } else if (opt.id.includes('shop_plate')) {
      for (const p of room.players) {
        if (!p.isDead && p.hp > 0) {
          p.armor = Math.min(24, p.armor + 4);
          p.bonusAttack = (p.bonusAttack || 0) + 1;
          applyStatusEffectToPlayer(p, 'SHIELDED', 'shop', 1, 3);
        }
      }
      pushPartyStatEvents(0, 4, 1, 0, 'SHIELDED', false);
    } else if (opt.id.includes('shop_relic')) {
      const shopRelicId = pickUnownedRelic(
        (room.dungeonSeed || room.seed) + activeRoom.index * 83 + ts,
        2,
        room.players,
        room.partyRelics || []
      );
      if (shopRelicId) {
        this.grantRelicAuthoritatively(room, player, shopRelicId, visualEvents);
      } else {
        visualEvents.push({
          id: `ev_${ts}_shop_relic`,
          kind: 'LOOT_ITEM',
          targetType: 'ROOM',
          label: `✦ ${opt.label}`,
          color: '#E7A54A',
          vfxStyle: 'holy',
        });
      }
      for (const p of room.players) {
        if (!p.isDead && p.hp > 0) {
          p.maxHp += 18;
          p.hp = Math.min(p.maxHp, p.hp + 18);
          p.bonusAttack = (p.bonusAttack || 0) + 1;
          p.bonusMagic = (p.bonusMagic || 0) + 1;
          p.inventoryItems = [...(p.inventoryItems || []), opt.label];
          applyStatusEffectToPlayer(p, 'BLESSED', 'shop', 1, 3);
        }
      }
      pushPartyStatEvents(18, 0, 1, 1, 'BLESSED', false);
    } else if (opt.id.includes('trap_disarm')) {
      room.partyGold = (room.partyGold ?? 0) + 20;
      room.runStats.goldEarned += 20;
      visualEvents.push({
        id: `ev_${ts}_gold`,
        kind: 'GAIN_GOLD',
        targetType: 'PARTY',
        value: 20,
        label: '+20 ORO',
        sublabel: 'TRAMPA DESACTIVADA',
        color: '#E7A54A',
        vfxStyle: 'gold',
      });
    } else if (opt.id.includes('trap_shield_rush')) {
      const trapStDef = CRIPTA_STATUS_EFFECTS_REGISTRY[threatProfile.trapStatus];
      for (const p of room.players) {
        if (!p.isDead && p.hp > 0) {
          p.hp = Math.max(4, p.hp - 6);
          p.armor = Math.min(24, p.armor + 2);
          applyStatusEffectToPlayer(p, threatProfile.trapStatus, 'trap', 1);
          visualEvents.push(
            {
              id: `ev_${ts}_trap_dmg_${p.id}`,
              kind: 'DAMAGE_PLAYER',
              targetType: 'PLAYER',
              targetId: p.id,
              value: -6,
              label: '-6 PV',
              sublabel: `+${trapStDef.name}`,
              color: '#C93B5B',
              statusType: threatProfile.trapStatus,
            },
            {
              id: `ev_${ts}_trap_arm_${p.id}`,
              kind: 'GAIN_DEFENSE',
              targetType: 'PLAYER',
              targetId: p.id,
              value: 2,
              label: '+2 ARMADURA',
              color: '#69A8A5',
            }
          );
        }
      }
    } else if (opt.id.includes('event_inspect')) {
      room.partyGold = (room.partyGold ?? 0) + 30;
      room.runStats.goldEarned += 30;
      visualEvents.push({
        id: `ev_${ts}_gold`,
        kind: 'GAIN_GOLD',
        targetType: 'PARTY',
        value: 30,
        label: '+30 ORO',
        color: '#E7A54A',
        vfxStyle: 'gold',
      });
      for (const p of room.players) {
        if (!p.isDead && p.hp > 0) {
          p.hp = Math.min(p.maxHp, p.hp + 12);
          p.bonusMagic = (p.bonusMagic || 0) + 1;
          applyStatusEffectToPlayer(p, 'BLESSED', 'event', 1, 3);
        }
      }
      pushPartyStatEvents(12, 0, 0, 1, 'BLESSED', false);
    } else if (opt.id.includes('event_respect')) {
      for (const p of room.players) {
        if (!p.isDead && p.hp > 0) {
          p.hp = Math.min(p.maxHp, p.hp + 20);
          p.armor = Math.min(24, p.armor + 2);
          purifyPlayerDebuffs(p, 99);
        }
      }
      pushPartyStatEvents(20, 2, 0, 0, undefined, true);
    } else if (opt.id.includes('path_left')) {
      room.partyGold = (room.partyGold ?? 0) + 30;
      room.runStats.goldEarned += 30;
      visualEvents.push({
        id: `ev_${ts}_gold`,
        kind: 'GAIN_GOLD',
        targetType: 'PARTY',
        value: 30,
        label: '+30 ORO',
        color: '#E7A54A',
        vfxStyle: 'gold',
      });
      for (const p of room.players) {
        if (!p.isDead && p.hp > 0) {
          p.hp = Math.min(p.maxHp, p.hp + 10);
          p.bonusAttack = (p.bonusAttack || 0) + 1;
          applyStatusEffectToPlayer(p, 'REGENERATION', 'decision', 1, 3);
        }
      }
      pushPartyStatEvents(10, 0, 1, 0, 'REGENERATION', false);
    } else if (opt.id.includes('path_right')) {
      for (const p of room.players) {
        if (!p.isDead && p.hp > 0) {
          p.armor = Math.min(24, p.armor + 3);
          p.bonusMagic = (p.bonusMagic || 0) + 1;
          p.hp = Math.min(p.maxHp, p.hp + 15);
          applyStatusEffectToPlayer(p, 'SHIELDED', 'decision', 1, 3);
        }
      }
      pushPartyStatEvents(15, 3, 0, 1, 'SHIELDED', false);
    } else if (opt.id.includes('secret_hoard')) {
      room.partyGold = (room.partyGold ?? 0) + 75;
      room.runStats.goldEarned += 75;
      visualEvents.push({
        id: `ev_${ts}_gold`,
        kind: 'GAIN_GOLD',
        targetType: 'PARTY',
        value: 75,
        label: '+75 ORO',
        sublabel: 'TESORO PROHIBIDO',
        color: '#E7A54A',
        vfxStyle: 'gold',
      });
      const secretRelicId = pickUnownedRelic(
        (room.dungeonSeed || room.seed) + ts,
        3,
        room.players,
        room.partyRelics || []
      );
      if (secretRelicId) {
        this.grantRelicAuthoritatively(room, player, secretRelicId, visualEvents);
      }
      for (const p of room.players) {
        if (!p.isDead && p.hp > 0) {
          p.hp = Math.min(p.maxHp, p.hp + 25);
          p.armor = Math.min(24, p.armor + 4);
          p.bonusAttack = (p.bonusAttack || 0) + 2;
          p.bonusMagic = (p.bonusMagic || 0) + 1;
          purifyPlayerDebuffs(p, 99);
          applyStatusEffectToPlayer(p, 'BLESSED', 'secret', 1, 3);
        }
      }
      pushPartyStatEvents(25, 4, 2, 1, 'BLESSED', true);
    }

    // In non-SHOP rooms, picking one primary action resolves the room
    if (activeRoom.type !== 'SHOP') {
      for (const otherOpt of activeRoom.options) {
        otherOpt.resolved = true;
      }
    }

    activeRoom.resolved = true;
    activeRoom.state = 'RESOLVED';
    activeRoom.outcomeLog = `${player.name}: ${opt.label} · ${opt.effectText}`;

    this.emitVisualEventBatch(room, visualEvents, player.id, 'INTERACT_OPTION');
    this.syncLegacyNodes(room);
    this.broadcastRoomState(room);
  }

  private handleRoomPuzzleInput(
    ws: WebSocket,
    room: ServerCriptaRoom,
    player: CriptaPlayer,
    runeIndex: number
  ) {
    if (room.phase !== 'DUNGEON' && room.phase !== 'DUNGEON_ARRIVAL') return;
    if (room.expeditionDefeated) return;
    const activeRoom = this.getActiveDungeonRoom(room);
    if (!activeRoom || !activeRoom.puzzleRunes || activeRoom.puzzleRunes.solved) return;

    if (player.isDead || player.hp <= 0) {
      this.sendError(ws, 'Has caído en combate. Un compañero vivo debe activar los pedestales.');
      return;
    }

    if (!activeRoom.puzzleRunes.currentInput.includes(runeIndex)) {
      activeRoom.puzzleRunes.currentInput.push(runeIndex);
    }

    const visualEvents: CriptaVisualEvent[] = [];
    const ts = Date.now();

    if (activeRoom.puzzleRunes.currentInput.length >= 3) {
      activeRoom.puzzleRunes.solved = true;
      activeRoom.resolved = true;
      activeRoom.state = 'RESOLVED';
      room.partyGold = (room.partyGold ?? 0) + 35;
      if (!room.runStats) room.runStats = buildDefaultRunStats();
      room.runStats.goldEarned += 35;
      visualEvents.push({
        id: `ev_${ts}_puz_gold`,
        kind: 'GAIN_GOLD',
        targetType: 'PARTY',
        value: 35,
        label: '+35 ORO',
        sublabel: 'ACERTIJO RESUELTO',
        color: '#E7A54A',
        vfxStyle: 'gold',
      });
      for (const p of room.players) {
        if (!p.isDead && p.hp > 0) {
          p.hp = Math.min(p.maxHp, p.hp + 15);
          p.bonusMagic = (p.bonusMagic || 0) + 1;
          purifyPlayerDebuffs(p, 1);
          applyStatusEffectToPlayer(p, 'BLESSED', 'puzzle', 1, 3);
          visualEvents.push(
            {
              id: `ev_${ts}_puz_h_${p.id}`,
              kind: 'HEAL_PLAYER',
              targetType: 'PLAYER',
              targetId: p.id,
              value: 15,
              label: '+15 PV',
              sublabel: '+BENDECIDO',
              color: '#5EA87A',
              vfxStyle: 'holy',
            },
            {
              id: `ev_${ts}_puz_m_${p.id}`,
              kind: 'GAIN_MAGIC',
              targetType: 'PLAYER',
              targetId: p.id,
              value: 1,
              label: '+1 MAGIA',
              color: '#9B72CF',
              vfxStyle: 'arcane',
            }
          );
        }
      }
      activeRoom.outcomeLog = `¡${player.name} ha completado la secuencia rúnica! El sello se abre (+35 ORO, +1 MAGIA, +15 VIDA y BENDECIDO).`;
    } else {
      visualEvents.push({
        id: `ev_${ts}_puz_rune`,
        kind: 'ROOM_REWARD',
        targetType: 'ROOM',
        label: `✦ RUNA #${runeIndex + 1} ENCENDIDA (${activeRoom.puzzleRunes.currentInput.length}/3)`,
        color: '#9B72CF',
        vfxStyle: 'arcane',
      });
      activeRoom.outcomeLog = `${player.name} activa el glifo #${runeIndex + 1} (${activeRoom.puzzleRunes.currentInput.length}/3 sellos encendidos).`;
    }

    this.emitVisualEventBatch(room, visualEvents, player.id, 'PUZZLE');
    this.syncLegacyNodes(room);
    this.broadcastRoomState(room);
  }

  private handleRoomDiscoverSecret(ws: WebSocket, room: ServerCriptaRoom, player: CriptaPlayer) {
    if (room.phase !== 'DUNGEON' && room.phase !== 'DUNGEON_ARRIVAL') return;
    if (room.expeditionDefeated) return;
    if (player.isDead || player.hp <= 0) {
      this.sendError(ws, 'Has caído en combate.');
      return;
    }
    const activeRoom = this.getActiveDungeonRoom(room);
    if (!activeRoom || !activeRoom.secretHook || activeRoom.secretHook.discovered) return;

    activeRoom.secretHook.discovered = true;
    if (room.discoveredSecretRoom) {
      room.discoveredSecretRoom.visited = true;
      room.discoveredSecretRoom.revealed = true;
      room.discoveredSecretRoom.state = 'IN_PROGRESS';
      room.discoveredSecretRoom.outcomeLog = `¡${player.name} ha accionado el sello oculto! Habéis entrado en la Cámara Secreta.`;
      room.inSecretRoom = true;
      this.emitVisualEventBatch(
        room,
        [
          {
            id: `ev_${Date.now()}_secret`,
            kind: 'LOOT_ITEM',
            targetType: 'ROOM',
            label: '★ CÁMARA SECRETA DESCUBIERTA',
            color: '#9B72CF',
            vfxStyle: 'arcane',
          },
        ],
        player.id,
        'SECRET'
      );
    }

    this.broadcastRoomState(room);
  }

  private handleRoomAdvance(room: ServerCriptaRoom, player: CriptaPlayer) {
    if (room.phase !== 'DUNGEON' && room.phase !== 'DUNGEON_ARRIVAL') return;
    if (room.expeditionDefeated) return;
    const activeRoom = this.getActiveDungeonRoom(room);
    if (!activeRoom) return;

    // Allow SHOP rooms to be exited at any time even if nothing was bought
    const canLeaveRoom =
      activeRoom.resolved ||
      activeRoom.type === 'SHOP' ||
      activeRoom.type === 'REST' ||
      activeRoom.type === 'LOOT';

    if (!canLeaveRoom) return;

    activeRoom.resolved = true;
    activeRoom.state = 'RESOLVED';

    const connectedPlayers = room.players.filter((p) => p.isConnected);
    const livingConnected = connectedPlayers.filter((p) => !p.isDead && p.hp > 0);
    const activeDecisionPlayers = livingConnected.length > 0 ? livingConnected : connectedPlayers;
    const isSolo = activeDecisionPlayers.length <= 1;

    if (!activeRoom.readyToAdvancePlayerIds.includes(player.id)) {
      activeRoom.readyToAdvancePlayerIds.push(player.id);
    }

    const readyCount = activeDecisionPlayers.filter((p) =>
      activeRoom.readyToAdvancePlayerIds.includes(p.id)
    ).length;

    // In Solo mode or when majority/all living connected players are ready, advance immediately
    const shouldAdvance =
      isSolo ||
      readyCount >= activeDecisionPlayers.length ||
      (player.isHost && readyCount >= Math.ceil(activeDecisionPlayers.length / 2));

    if (!shouldAdvance) {
      this.broadcastRoomState(room);
      return;
    }

    // If currently in the Secret Room, return to the main room sequence (or advance to next room if main room was resolved)
    if (room.inSecretRoom) {
      room.inSecretRoom = false;
      const mainRoom = (room.roomSequence || [])[room.currentRoomIndex ?? 0];
      if (mainRoom && mainRoom.resolved) {
        const nextIdx = (room.currentRoomIndex ?? 0) + 1;
        if (room.roomSequence && nextIdx < room.roomSequence.length) {
          room.currentRoomIndex = nextIdx;
          const nextRoom = room.roomSequence[nextIdx];
          nextRoom.revealed = true;
          nextRoom.visited = true;
          nextRoom.state = nextRoom.type === 'SHOP' ? 'RESOLVED' : 'IN_PROGRESS';
          if (nextRoom.type === 'SHOP') nextRoom.resolved = true;
          if (nextRoom.enemies.length > 0) {
            nextRoom.actedPlayerIdsThisRound = [];
            nextRoom.activeTurnPlayerId = this.computeNextTurnPlayerId(room, nextRoom);
          }
        }
      }
      this.syncLegacyNodes(room);
      this.broadcastRoomState(room);
      return;
    }

    const seq = room.roomSequence || [];
    const currentIdx = room.currentRoomIndex ?? 0;
    const nextIdx = currentIdx + 1;

    if (nextIdx >= seq.length) {
      // First press at the end of a dungeon opens the Dungeon Completion summary screen;
      // Second press transitions the party back to the Three Doors chamber (incrementing door count)!
      if (!room.dungeonCompleted) {
        room.dungeonCompleted = true;
        activeRoom.readyToAdvancePlayerIds = [];
        this.syncLegacyNodes(room);
        this.broadcastRoomState(room);
        return;
      }

      // Leaving completed dungeon -> return to Three Doors chamber!
      const finishedDungeonId = room.selectedDungeonId;
      if (!room.completedDungeonIds) room.completedDungeonIds = [];
      if (finishedDungeonId && !room.completedDungeonIds.includes(finishedDungeonId)) {
        room.completedDungeonIds.push(finishedDungeonId);
      }
      room.completedDoorCount = Math.min(3, (room.completedDoorCount ?? 0) + 1);
      if (!room.runStats) room.runStats = buildDefaultRunStats();
      room.runStats.dungeonsCompleted = room.completedDoorCount;

      const ts = Date.now();
      const visualEvents: CriptaVisualEvent[] = [
        {
          id: `ev_${ts}_door_cleared`,
          kind: 'DOOR_COMPLETED',
          targetType: 'ROOM',
          value: room.completedDoorCount,
          label: `PUERTA SUPERADA (${room.completedDoorCount} / 3)`,
          sublabel:
            room.completedDoorCount >= 3
              ? 'EL CORAZÓN DE LA CRIPTA DESPIERTA'
              : 'REGRESANDO A LAS TRES PUERTAS',
          color: '#E7A54A',
          vfxStyle: 'gold',
        },
      ];

      // Relic: Escudo del Sepulturero (+10 PV al superar una puerta)
      if (this.hasPartyRelic(room, 'escudo_del_sepulturero')) {
        for (const p of room.players) {
          if (!p.isDead && p.hp > 0) {
            p.hp = Math.min(p.maxHp, p.hp + 10);
            visualEvents.push({
              id: `ev_${ts}_sepul_${p.id}`,
              kind: 'HEAL_PLAYER',
              targetType: 'PLAYER',
              targetId: p.id,
              value: 10,
              label: '+10 PV',
              sublabel: 'ESCUDO DEL SEPULTURERO',
              color: '#5EA87A',
              vfxStyle: 'holy',
            });
          }
        }
      }

      // Prepare next door offer (avoiding already completed dungeons)
      const nextSeed = (room.seed + room.completedDoorCount * 7919) >>> 0;
      room.seed = nextSeed;
      if (room.completedDoorCount < 3) {
        room.offeredDungeons = selectThreeDistinctDungeonsExcluding(
          nextSeed,
          room.completedDungeonIds
        );
      } else {
        room.offeredDungeons = [];
      }
      room.doorVotes = {};
      room.voteTieWarning = false;
      room.decisionResolved = false;
      room.selectedDungeonId = null;
      room.doorOpeningStartedAt = null;
      room.dungeonCompleted = false;
      room.inSecretRoom = false;
      room.phase = 'RETURNING_TO_DOORS';

      this.emitVisualEventBatch(room, visualEvents, player.id, 'DOOR_CLEAR');
      this.broadcastRoomState(room);

      if (room.doorOpeningTimer) {
        clearTimeout(room.doorOpeningTimer);
      }
      room.doorOpeningTimer = setTimeout(() => {
        room.doorOpeningTimer = null;
        if (room.phase === 'RETURNING_TO_DOORS') {
          room.phase = 'THREE_DOORS';
          this.broadcastRoomState(room);
        }
      }, 1600);
      return;
    }

    room.currentRoomIndex = nextIdx;
    if (!room.runStats) room.runStats = buildDefaultRunStats();
    room.runStats.roomsVisited += 1;
    const nextRoom = seq[nextIdx];
    nextRoom.revealed = true;
    nextRoom.visited = true;
    nextRoom.state = nextRoom.type === 'SHOP' ? 'RESOLVED' : 'IN_PROGRESS';
    if (nextRoom.type === 'SHOP') {
      nextRoom.resolved = true;
    }

    // Relic: Corazón de Hierro (+2 Armor on entering room)
    for (const p of room.players) {
      if (!p.isDead && p.hp > 0 && playerHasRelic(p, room.partyRelics, 'corazon_de_hierro')) {
        p.armor = Math.min(24, p.armor + 2);
      }
    }

    // Relic: Corona de Cristal (SHIELDED 2T on combat start)
    if (this.hasPartyRelic(room, 'corona_de_cristal') && nextRoom.enemies.length > 0) {
      for (const p of room.players) {
        if (!p.isDead && p.hp > 0) {
          applyStatusEffectToPlayer(p, 'SHIELDED', 'corona_de_cristal', 1, 2);
        }
      }
    }

    if (nextRoom.enemies.length > 0) {
      nextRoom.actedPlayerIdsThisRound = [];
      nextRoom.activeTurnPlayerId = this.computeNextTurnPlayerId(room, nextRoom);
    }

    this.syncLegacyNodes(room);
    this.broadcastRoomState(room);
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
    if ((room.completedDoorCount ?? 0) >= 3) return;

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
      const hasDiscountRelic = this.hasPartyRelic(room, 'moneda_del_muerto');
      const generatedDungeon = generateProceduralDungeon(
        chosenDungeonId,
        room.seed,
        connectedPlayers.length,
        hasDiscountRelic
      );
      if (!generatedDungeon.rooms.length) {
        throw new Error('No se pudo inicializar la primera sala de la mazmorra.');
      }

      // Relic: Ojo del Oráculo (+1 MAGIA y BLESSED en la primera sala de cada puerta)
      if (this.hasPartyRelic(room, 'ojo_del_oraculo')) {
        for (const p of room.players) {
          if (!p.isDead && p.hp > 0) {
            applyStatusEffectToPlayer(p, 'BLESSED', 'ojo_del_oraculo', 1, 2);
          }
        }
      }

      // Relic: Corona de Cristal (SHIELDED 2T en el turno 1 de combate)
      const firstRoom = generatedDungeon.rooms[0];
      if (this.hasPartyRelic(room, 'corona_de_cristal') && firstRoom.enemies.length > 0) {
        for (const p of room.players) {
          if (!p.isDead && p.hp > 0) {
            applyStatusEffectToPlayer(p, 'SHIELDED', 'corona_de_cristal', 1, 2);
          }
        }
      }

      if (firstRoom.enemies.length > 0) {
        firstRoom.actedPlayerIdsThisRound = [];
        const firstLiving = [...connectedPlayers]
          .filter((p) => !p.isDead && p.hp > 0)
          .sort((a, b) => a.seatIndex - b.seatIndex)[0];
        firstRoom.activeTurnPlayerId = firstLiving ? firstLiving.id : null;
      }

      room.dungeonStartGold = room.partyGold ?? 45;
      room.dungeonItemsFound = 0;
      room.dungeonRelicsFound = 0;
      room.dungeonEnemiesDefeated = 0;
      if (!room.runStats) room.runStats = buildDefaultRunStats();
      room.runStats.roomsVisited += 1;

      room.decisionResolved = true;
      room.voteTieWarning = false;
      room.initializationError = null;
      room.selectedDungeonId = chosenDungeonId;
      room.doorOpeningStartedAt = now;
      room.floor = (room.completedDoorCount ?? 0) + 1;
      room.dungeonSeed = generatedDungeon.seed;
      room.dungeonLengthTier = generatedDungeon.tier;
      // Preserve partyGold across doors! Initialize to 35 only if starting Door 1 with 0 gold.
      if ((room.completedDoorCount ?? 0) === 0 && (room.partyGold ?? 0) === 0) {
        room.partyGold = 35;
      }
      room.currentRoomIndex = 0;
      room.transitioningToRoomIndex = null;
      room.roomSequence = generatedDungeon.rooms;
      room.discoveredSecretRoom = generatedDungeon.secretRoom;
      room.inSecretRoom = false;
      room.dungeonCompleted = false;
      room.expeditionDefeated = false;
      room.lastEventBatch = null;
      room.generatedNodes = generatedDungeon.legacyNodes;
      room.currentNodeId = generatedDungeon.rooms[0].id;
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
