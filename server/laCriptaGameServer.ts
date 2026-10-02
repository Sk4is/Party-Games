import { WebSocketServer, WebSocket } from 'ws';
import type {
  CriptaAcquiredRelic,
  CriptaCharacterId,
  CriptaClientMessage,
  CriptaDungeonId,
  CriptaDungeonRoom,
  CriptaExpeditionState,
  CriptaItemId,
  CriptaPlayer,
  CriptaPlayerRoundActionType,
  CriptaQueuedPlayerAction,
  CriptaRelicId,
  CriptaRoomEnemy,
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
  buildEnemyAiProfileForArchetype,
  chooseEnemyTacticalAction,
  createInitialEnemyMemory,
  refreshEnemyIntentPreview,
  tickEnemyCooldownsForNewRound,
} from '../src/data/la-cripta/criptaEnemyAiEngine';
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
  generateShopInventoryForRoom,
  NORMAL_INVENTORY_MAX_SLOTS,
  pickUnownedRelic,
  playerHasRelic,
  rollEnemyLootDrop,
  transformFinalBossToPhase2,
} from '../src/data/la-cripta/criptaItemsAndRelics';
import {
  computePlayerEffectiveStats,
  CRIPTA_ACCESSORIES_REGISTRY,
  CRIPTA_ARMORS_REGISTRY,
  CRIPTA_DAMAGE_TYPE_META,
  CRIPTA_WEAPON_RUNES_REGISTRY,
  CRIPTA_WEAPONS_REGISTRY,
  estimatePlayerActionDamage,
  getEquippedWeaponForPlayer,
  getWeaponUpgradeCost,
  pickWeaponDropForDungeon,
  pickWeaponRuneDropForDungeon,
  rollAuthoritativePlayerDamage,
  STARTER_WEAPON_BY_CLASS,
} from '../src/data/la-cripta/criptaEquipmentAndEvents';
import { roomRegistry } from './roomRegistry';

interface ClientConnection {
  ws: WebSocket;
  playerId: string;
  roomCode: string;
}

interface ServerCriptaRoom extends CriptaExpeditionState {
  doorOpeningTimer: NodeJS.Timeout | null;
  combatRoundTimer: NodeJS.Timeout | null;
  roomTransitionTimer: NodeJS.Timeout | null;
  isResolvingRound: boolean;
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
    minibossesDefeated: 0,
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
    agility: 5,
    precision: 5,
    willpower: 5,
    bonusAttack: 0,
    bonusDefense: 0,
    bonusMagic: 0,
    bonusAgility: 0,
    bonusPrecision: 0,
    bonusWillpower: 0,
    classResource: 0,
    maxClassResource: 0,
    classResourceKind: null,
    equippedWeaponId: null,
    weaponUpgradeLevel: 1,
    equippedWeaponRuneId: null,
    ownedWeaponRunes: [],
    weaponSpecialCooldown: 0,
    abilityCooldowns: {},
    basicAttackUsedThisTurn: false,
    learnedTechniqueIds: [],
    equippedArmorId: null,
    equippedAccessoryId: null,
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
      discoveredEnemyAbilityIds: [],
      eventFlags: {},
      dungeonCompletionSummary: null,
      runStats: buildDefaultRunStats(),
      finalBossState: null,
      runVictory: false,
      dungeonSeed: seed,
      dungeonLengthTier: 'MEDIA',
      partyGold: 45,
      currentRoomIndex: 0,
      transitioningToRoomIndex: null,
      roomDoorTransition: null,
      roomSequence: [],
      discoveredSecretRoom: null,
      inSecretRoom: false,
      dungeonCompleted: false,
      expeditionDefeated: false,
      lastEventBatch: null,
      doorOpeningTimer: null,
      combatRoundTimer: null,
      roomTransitionTimer: null,
      isResolvingRound: false,
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
      .sort((a, b) => {
        const initDiff =
          computePlayerEffectiveStats(b).initiativeScore -
          computePlayerEffectiveStats(a).initiativeScore;
        return initDiff !== 0 ? initDiff : a.seatIndex - b.seatIndex;
      });
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

  private assignFreshPlayerTurn(
    activeRoom: CriptaDungeonRoom,
    nextPlayerId: string | null
  ) {
    const seq = (activeRoom.turnSequenceNumber || 0) + 1;
    const roundNum = activeRoom.combatTurn || 1;
    activeRoom.turnSequenceNumber = seq;
    activeRoom.activeTurnPlayerId = nextPlayerId;
    activeRoom.turnId = nextPlayerId
      ? `turn_${activeRoom.id}_r${roundNum}_${nextPlayerId}_${seq}`
      : null;
    activeRoom.turnActionConsumed = false;
    activeRoom.currentTurnAp = 1;
    activeRoom.maxTurnAp = 1;
    activeRoom.consumableUsedThisTurn = false;
  }

  private computeAuthoritativeRunPhase(room: ServerCriptaRoom) {
    const completedCount = room.completedDoorCount ?? 0;
    if (room.phase === 'LOBBY') return 'LOBBY' as const;
    if (room.phase === 'RUN_VICTORY' || room.expeditionDefeated) {
      return 'RUN_END' as const;
    }
    if (
      room.phase === 'FINAL_BOSS_COMBAT' ||
      room.phase === 'FINAL_BOSS_ENTRANCE' ||
      room.phase === 'FINAL_BOSS_DOOR_READY' ||
      (room.phase === 'THREE_DOORS' && completedCount >= 3)
    ) {
      return 'MAJOR_BOSS' as const;
    }
    if (room.phase === 'ENTERING_DUNGEON' || room.phase === 'DOOR_OPENING') {
      return 'ENTERING_DUNGEON' as const;
    }
    if (room.phase === 'THREE_DOORS' || room.phase === 'RETURNING_TO_DOORS') {
      return 'DOOR_SELECTION' as const;
    }
    if (room.dungeonCompleted) {
      return 'DUNGEON_COMPLETE' as const;
    }
    if (completedCount === 0) return 'DUNGEON_1' as const;
    if (completedCount === 1) return 'DUNGEON_2' as const;
    return 'DUNGEON_3' as const;
  }

  private computeAuthoritativeRoomPhase(
    room: ServerCriptaRoom,
    activeRoom: CriptaDungeonRoom | null
  ) {
    if (!activeRoom) return 'COMPLETE' as const;
    if (room.roomDoorTransition?.active) return 'EXITING' as const;
    if (room.isResolvingRound) return 'RESOLVING' as const;
    const unclaimed = (activeRoom.groundDrops || []).filter((d) => !d.claimedByPlayerId);
    if (activeRoom.resolved) {
      if (unclaimed.length > 0) return 'REWARD_PENDING' as const;
      return 'READY_TO_LEAVE' as const;
    }
    if (activeRoom.lifecyclePhase === 'ENTERING') return 'ENTERING' as const;
    return 'ACTIVE' as const;
  }

  private logRejectedTransition(
    room: ServerCriptaRoom,
    action: string,
    reason: string
  ) {
    const activeRoom = this.getActiveDungeonRoom(room);
    const runPhase = this.computeAuthoritativeRunPhase(room);
    const roomPhase = this.computeAuthoritativeRoomPhase(room, activeRoom);
    console.warn(
      [
        '[LA CRIPTA STATE]',
        'Rejected transition:',
        `action: ${action}`,
        `currentRunPhase: ${runPhase} (${room.phase})`,
        `currentRoomPhase: ${roomPhase}`,
        `roomId: ${activeRoom?.id || 'none'}`,
        `dungeon: ${room.selectedDungeonId || 'none'}`,
        `completedDungeonCount: ${room.completedDoorCount ?? 0}`,
        `reason: ${reason}`,
      ].join('\n')
    );
  }

  private serializeRoom(room: ServerCriptaRoom): CriptaExpeditionState {
    const activeRoom = this.getActiveDungeonRoom(room);
    const completedCount = room.completedDoorCount ?? 0;
    const completedIds = room.completedDungeonIds ? [...room.completedDungeonIds] : [];
    const runPhase = this.computeAuthoritativeRunPhase(room);
    const currentRoomPhase = this.computeAuthoritativeRoomPhase(room, activeRoom);
    const unclaimedDrops = (activeRoom?.groundDrops || []).filter(
      (d) => !d.claimedByPlayerId
    );

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
      runPhase,
      players: room.players.map((p) => ({
        ...p,
        characterId: p.characterId ?? null,
        selectedCharacterId: p.characterId ?? null,
        agility: p.agility ?? (p.characterId ? CRIPTA_CHARACTERS_CATALOG[p.characterId]?.stats.agility : 5),
        precision: p.precision ?? (p.characterId ? CRIPTA_CHARACTERS_CATALOG[p.characterId]?.stats.precision : 5),
        willpower: p.willpower ?? (p.characterId ? CRIPTA_CHARACTERS_CATALOG[p.characterId]?.stats.willpower : 5),
        bonusAttack: p.bonusAttack ?? 0,
        bonusDefense: p.bonusDefense ?? 0,
        bonusMagic: p.bonusMagic ?? 0,
        bonusAgility: p.bonusAgility ?? 0,
        bonusPrecision: p.bonusPrecision ?? 0,
        bonusWillpower: p.bonusWillpower ?? 0,
        classResource:
          p.classResource ??
          (p.characterId ? CRIPTA_CHARACTERS_CATALOG[p.characterId]?.classResource?.initialValue ?? 0 : 0),
        maxClassResource:
          p.maxClassResource ??
          (p.characterId ? CRIPTA_CHARACTERS_CATALOG[p.characterId]?.classResource?.maxValue ?? 0 : 0),
        classResourceKind:
          p.classResourceKind ??
          (p.characterId ? CRIPTA_CHARACTERS_CATALOG[p.characterId]?.classResource?.kind ?? null : null),
        equippedWeaponId:
          p.equippedWeaponId ??
          (p.characterId ? STARTER_WEAPON_BY_CLASS[p.characterId] : null),
        weaponUpgradeLevel: p.weaponUpgradeLevel ?? 1,
        equippedWeaponRuneId: p.equippedWeaponRuneId ?? null,
        ownedWeaponRunes: p.ownedWeaponRunes ? [...p.ownedWeaponRunes] : [],
        weaponSpecialCooldown: p.weaponSpecialCooldown ?? 0,
        abilityCooldowns: p.abilityCooldowns ? { ...p.abilityCooldowns } : {},
        basicAttackUsedThisTurn: Boolean(p.basicAttackUsedThisTurn),
        learnedTechniqueIds: p.learnedTechniqueIds ? [...p.learnedTechniqueIds] : [],
        equippedArmorId: p.equippedArmorId ?? null,
        equippedAccessoryId: p.equippedAccessoryId ?? null,
        normalInventory: p.normalInventory ? [...p.normalInventory] : [],
        personalRelics: p.personalRelics ? p.personalRelics.map((r) => ({ ...r })) : [],
        pendingInventoryReplacement: p.pendingInventoryReplacement
          ? { ...p.pendingInventoryReplacement }
          : null,
        inventoryItems: p.inventoryItems ? [...p.inventoryItems] : [],
        isDead: Boolean(p.isDead || (p.characterId && p.maxHp > 0 && p.hp <= 0)),
        deathsCount: p.deathsCount ?? 0,
        statuses: (p.statuses || []).map((st) => ({ ...st })),
        votedFinalBossDoor: Boolean(room.finalBossDoorVotes?.[p.id]),
      })),
      selectedCharacters: { ...room.selectedCharacters },
      offeredDungeons: [...(room.offeredDungeons || [])],
      doorVotes: { ...room.doorVotes },
      finalBossDoorVotes: room.finalBossDoorVotes ? { ...room.finalBossDoorVotes } : {},
      decisionResolved: Boolean(room.decisionResolved),
      voteTieWarning: Boolean(room.voteTieWarning),
      initializationError: room.initializationError ?? null,
      selectedDungeonId: room.selectedDungeonId,
      currentDungeonId: room.selectedDungeonId,
      currentDungeonInstanceId: room.selectedDungeonId
        ? `${room.expeditionId}_${room.selectedDungeonId}_${completedCount + 1}`
        : null,
      doorOpeningStartedAt: room.doorOpeningStartedAt,
      returningToDoorsStartedAt: room.returningToDoorsStartedAt ?? null,
      exitingDungeonId: room.exitingDungeonId ?? null,
      floor: room.floor,
      currentNodeId: room.currentNodeId,
      currentRoomId: activeRoom?.id ?? room.currentNodeId,
      currentRoomPhase,
      completedRoomIds: (room.roomSequence || [])
        .filter((r) => r.resolved)
        .map((r) => r.id),
      currentRewardState: activeRoom?.resolved
        ? {
            roomId: activeRoom.id,
            hasUnclaimedDrops: unclaimedDrops.length > 0,
            unclaimedDropCount: unclaimedDrops.length,
            goldEarned: activeRoom.rewardSummary?.goldGranted ?? 0,
            healGranted: activeRoom.rewardSummary?.healGranted ?? 0,
          }
        : null,
      currentTransitionState: room.roomDoorTransition?.active
        ? {
            active: true,
            kind: room.roomDoorTransition.isReturningToDoors
              ? 'RETURNING_TO_DOORS'
              : 'ROOM_TO_ROOM',
            startedAt: room.roomDoorTransition.startedAt,
          }
        : room.phase === 'ENTERING_DUNGEON' && room.doorOpeningStartedAt
        ? {
            active: true,
            kind: 'ENTERING_DUNGEON',
            startedAt: room.doorOpeningStartedAt,
          }
        : null,
      majorBossUnlocked: completedCount >= 3,
      generatedNodes: [...room.generatedNodes],
      completedDoorCount: completedCount,
      completedDungeonCount: completedCount,
      completedDungeonIds: completedIds,
      completedBiomes: completedIds,
      partyRelics: room.partyRelics ? room.partyRelics.map((r) => ({ ...r })) : [],
      discoveredEnemyAbilityIds: room.discoveredEnemyAbilityIds
        ? [...room.discoveredEnemyAbilityIds]
        : [],
      eventFlags: room.eventFlags ? { ...room.eventFlags } : {},
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
      roomDoorTransition: room.roomDoorTransition
        ? { ...room.roomDoorTransition }
        : null,
      roomSequence: room.roomSequence ? room.roomSequence.map((r) => ({ ...r })) : [],
      discoveredSecretRoom: room.discoveredSecretRoom
        ? { ...room.discoveredSecretRoom }
        : null,
      inSecretRoom: Boolean(room.inSecretRoom),
      dungeonCompleted: Boolean(room.dungeonCompleted),
      expeditionDefeated: Boolean(room.expeditionDefeated),
      defeatReason: room.defeatReason ?? null,
      defeatedByEnemyName: room.defeatedByEnemyName ?? null,
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
        player.agility = charDef.stats.agility;
        player.precision = charDef.stats.precision;
        player.willpower = charDef.stats.willpower;
        player.classResource = charDef.classResource?.initialValue ?? 0;
        player.maxClassResource = charDef.classResource?.maxValue ?? 0;
        player.classResourceKind = charDef.classResource?.kind ?? null;
        player.equippedWeaponId = STARTER_WEAPON_BY_CLASS[charId];
        player.weaponUpgradeLevel = 1;
        player.weaponSpecialCooldown = 0;
        room.selectedCharacters[player.id] = charId;

        this.broadcastRoomState(room);
        break;
      }

      case 'START_EXPEDITION': {
        if (!player.isHost && !room.expeditionDefeated && room.phase !== 'RUN_VICTORY') {
          this.sendError(ws, 'Solo el líder de la expedición puede iniciar la partida.');
          return;
        }
        if (
          room.phase !== 'LOBBY' &&
          room.phase !== 'DUNGEON' &&
          room.phase !== 'DUNGEON_ARRIVAL' &&
          room.phase !== 'FINAL_BOSS_COMBAT' &&
          room.phase !== 'RUN_VICTORY' &&
          !room.expeditionDefeated
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
        room.discoveredEnemyAbilityIds = [];
        room.eventFlags = {};
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
        room.defeatReason = null;
        room.defeatedByEnemyName = null;
        room.lastEventBatch = null;
        room.phase = 'THREE_DOORS';

        // Refresh party HP/armor/statuses/bonuses/inventory/relics/death state at new run start
        for (const p of room.players) {
          p.isDead = false;
          p.bonusAttack = 0;
          p.bonusDefense = 0;
          p.bonusMagic = 0;
          p.bonusAgility = 0;
          p.bonusPrecision = 0;
          p.bonusWillpower = 0;
          p.equippedWeaponId = p.characterId ? STARTER_WEAPON_BY_CLASS[p.characterId] : 'espada_oxidada';
          p.weaponUpgradeLevel = 1;
          p.equippedWeaponRuneId = null;
          p.ownedWeaponRunes = [];
          p.weaponSpecialCooldown = 0;
          p.abilityCooldowns = {};
          p.basicAttackUsedThisTurn = false;
          p.learnedTechniqueIds = [];
          p.equippedArmorId = null;
          p.equippedAccessoryId = null;
          p.passedLastRound = false;
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
              p.agility = cDef.stats.agility;
              p.precision = cDef.stats.precision;
              p.willpower = cDef.stats.willpower;
              p.classResource = cDef.classResource?.initialValue ?? 0;
              p.maxClassResource = cDef.classResource?.maxValue ?? 0;
              p.classResourceKind = cDef.classResource?.kind ?? null;
            }
          }
        }

        this.broadcastRoomState(room);
        break;
      }

      case 'VOTE_DOOR': {
        if (room.phase === 'RETURNING_TO_DOORS') {
          if (room.doorOpeningTimer) {
            clearTimeout(room.doorOpeningTimer);
            room.doorOpeningTimer = null;
          }
          room.phase = 'THREE_DOORS';
        }
        if (room.phase !== 'THREE_DOORS' || room.decisionResolved) {
          this.logRejectedTransition(
            room,
            'VOTE_DOOR',
            `Invalid phase (${room.phase}) or decision already resolved (${room.decisionResolved})`
          );
          return;
        }
        if ((room.completedDoorCount ?? 0) >= 3) {
          this.logRejectedTransition(
            room,
            'VOTE_DOOR',
            '3 dungeons already completed; Final Boss threshold is unlocked instead of normal doors'
          );
          return;
        }
        if (!room.offeredDungeons.includes(msg.dungeonId)) {
          this.logRejectedTransition(
            room,
            'VOTE_DOOR',
            `Dungeon ${msg.dungeonId} is not in offeredDungeons (${room.offeredDungeons.join(', ')})`
          );
          return;
        }

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
        this.handleLockRoundAction(ws, room, player, {
          actionType: msg.action,
          targetEnemyId: msg.targetEnemyId,
          turnId: msg.turnId,
          actionNonce: msg.actionNonce,
        });
        break;
      }

      case 'LOCK_ROUND_ACTION': {
        this.handleLockRoundAction(ws, room, player, {
          actionType: msg.actionType,
          abilityId: msg.abilityId,
          targetEnemyId: msg.targetEnemyId,
          targetPlayerId: msg.targetPlayerId,
          itemSlotIndex: msg.itemSlotIndex,
          turnId: msg.turnId,
          actionNonce: msg.actionNonce,
          cardId: msg.cardId,
        });
        break;
      }

      case 'UNLOCK_ROUND_ACTION': {
        this.handleUnlockRoundAction(ws, room, player);
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

      case 'ROOM_MINIGAME_INPUT': {
        this.handleRoomPuzzleInput(ws, room, player, msg.stepValue);
        break;
      }

      case 'ROOM_DISCOVER_SECRET': {
        this.handleRoomDiscoverSecret(ws, room, player);
        break;
      }

      case 'INTERACT_ROOM_OBJECT': {
        this.handleInteractRoomObject(ws, room, player, msg.objectId);
        break;
      }

      case 'UPGRADE_WEAPON': {
        this.handleUpgradeWeapon(ws, room, player);
        break;
      }

      case 'EQUIP_WEAPON_RUNE': {
        const nextRuneId = msg.runeId ?? null;
        if (nextRuneId !== null) {
          const rDef = CRIPTA_WEAPON_RUNES_REGISTRY[nextRuneId];
          if (!rDef || !(player.ownedWeaponRunes || []).includes(nextRuneId)) {
            this.sendError(ws, 'No posees esa runa de arma en tu inventario de infusiones.');
            break;
          }
        }
        const prevRune = player.equippedWeaponRuneId
          ? CRIPTA_WEAPON_RUNES_REGISTRY[player.equippedWeaponRuneId]
          : null;
        const nextRune = nextRuneId ? CRIPTA_WEAPON_RUNES_REGISTRY[nextRuneId] : null;
        if (prevRune?.maxHpPenalty) {
          player.maxHp += prevRune.maxHpPenalty;
        }
        if (nextRune?.maxHpPenalty) {
          player.maxHp = Math.max(12, player.maxHp - nextRune.maxHpPenalty);
          player.hp = Math.min(player.hp, player.maxHp);
        }
        player.equippedWeaponRuneId = nextRuneId;
        const activeRoom = this.getActiveDungeonRoom(room);
        const eq = getEquippedWeaponForPlayer(player);
        if (activeRoom) {
          activeRoom.outcomeLog = nextRune
            ? `¡${player.name} engarza ${nextRune.name} en ${eq.weapon.name} (Daño ${eq.activeDamageType})!`
            : `${player.name} retira la runa de ${eq.weapon.name}, restaurando su daño original (${eq.activeDamageType}).`;
        }
        this.emitVisualEventBatch(
          room,
          [
            {
              id: `ev_rune_${Date.now()}_${player.id}`,
              kind: 'WEAPON_UPGRADED',
              targetType: 'PLAYER',
              targetId: player.id,
              label: nextRune
                ? `INFUSIÓN: ${nextRune.name.toUpperCase()}`
                : 'RUNA DESENGARZADA',
              sublabel: `${eq.weapon.name.toUpperCase()} · DAÑO ${eq.activeDamageType}`,
              color: nextRune ? nextRune.accentColor : eq.weapon.accentColor,
              vfxStyle: 'arcane',
            },
          ],
          player.id,
          'EQUIP_WEAPON_RUNE'
        );
        this.broadcastRoomState(room);
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
        room.roomDoorTransition = null;
        room.isResolvingRound = false;
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
          p.equippedWeaponRuneId = null;
          p.ownedWeaponRunes = [];
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

  private checkAndApplyPartyDefeat(
    room: ServerCriptaRoom,
    defeatReason?: string,
    killerName?: string,
    visualEvents?: CriptaVisualEvent[]
  ): boolean {
    const connected = room.players.filter((p) => p.isConnected);
    const checkList = connected.length > 0 ? connected : room.players;
    const allDead = checkList.every((p) => p.isDead || p.hp <= 0);
    if (allDead) {
      room.expeditionDefeated = true;
      room.defeatReason =
        defeatReason || room.defeatReason || 'Caídos en las profundidades de La Cripta';
      room.defeatedByEnemyName = killerName || room.defeatedByEnemyName || null;
      if (visualEvents) {
        visualEvents.push({
          id: `ev_defeat_${Date.now()}`,
          kind: 'EXPEDITION_DEFEATED',
          targetType: 'PARTY',
          label: 'EXPEDICIÓN CAÍDA',
          sublabel: room.defeatReason,
          color: '#E03E52',
          vfxStyle: 'explosion',
        });
      }
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

    // In sequential turn combat, using a consumable from MOCHILA does NOT spend AP or end the player's turn (max 1 per turn)!
    if (inCombat) {
      if (room.isResolvingRound || activeRoom.combatRoundPhase !== 'PLAYER_PHASE') {
        this.sendError(ws, 'Disponible en tu turno.');
        return;
      }

      const livingConnected = room.players
        .filter((p) => p.isConnected && !p.isDead && p.hp > 0)
        .sort((a, b) => a.seatIndex - b.seatIndex);
      const currentTurnPlayer =
        livingConnected.find((p) => p.id === activeRoom.activeTurnPlayerId) ||
        livingConnected[0];

      if (currentTurnPlayer && player.id !== currentTurnPlayer.id) {
        this.sendError(ws, `Disponible en tu turno (Turno actual: ${currentTurnPlayer.name}).`);
        return;
      }

      if (activeRoom.consumableUsedThisTurn) {
        this.sendError(ws, 'Ya has utilizado un consumible en este turno.');
        return;
      }
    }

    const visualEvents: CriptaVisualEvent[] = [];
    const logText = this.executeInventoryItemEffect(
      room,
      activeRoom,
      player,
      idx,
      itemId,
      targetPlayerId,
      targetEnemyId,
      visualEvents
    );
    if (logText) {
      activeRoom.outcomeLog = logText;
    }

    if (inCombat) {
      activeRoom.consumableUsedThisTurn = true;
      activeRoom.lastPlayedByPlayerName = player.name;
      activeRoom.lastPlayedCardTitle = def.name.toUpperCase();
      this.checkAndResolveCombatVictoryIfCleared(
        room,
        activeRoom,
        player,
        logText ? [logText] : [],
        visualEvents,
        Date.now()
      );
    }

    this.emitVisualEventBatch(room, visualEvents, player.id, 'USE_ITEM');
    this.syncLegacyNodes(room);
    this.broadcastRoomState(room);
  }

  private executeInventoryItemEffect(
    room: ServerCriptaRoom,
    activeRoom: CriptaDungeonRoom,
    player: CriptaPlayer,
    slotIndex: number,
    expectedItemId: CriptaItemId | undefined,
    targetPlayerId: string | undefined,
    targetEnemyId: string | undefined,
    visualEvents: CriptaVisualEvent[]
  ): string | null {
    const inv = player.normalInventory || [];
    let idx = slotIndex;
    if (idx < 0 || idx >= inv.length || (expectedItemId && inv[idx] !== expectedItemId)) {
      idx = expectedItemId ? inv.indexOf(expectedItemId) : -1;
    }
    if (idx < 0 || idx >= inv.length) return null;

    const itemId = inv[idx];
    const def = CRIPTA_ITEMS_REGISTRY[itemId];
    if (!def) return null;

    const livingEnemies = activeRoom.enemies.filter((e) => e.hp > 0);

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
    const turnNum = activeRoom.combatTurn || 1;
    visualEvents.push({
      id: `ev_${ts}_use_${itemId}`,
      kind: 'ITEM_USED',
      targetType: 'PLAYER',
      targetId: player.id,
      sourcePlayerId: player.id,
      label: `USÓ ${def.name.toUpperCase()}`,
      color: '#FFD166',
      itemId,
    });

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
          visualEvents.push(
            {
              id: `ev_${ts}_fire_${targetEnemy.id}`,
              kind: 'DAMAGE_ENEMY',
              targetType: 'ENEMY',
              targetId: targetEnemy.id,
              sourcePlayerId: player.id,
              value: -dmg,
              label: `-${dmg} PV`,
              sublabel: 'FRASCO VOLÁTIL',
              color: '#FF7A33',
              vfxStyle: 'explosion',
            },
            {
              id: `ev_${ts}_fire_st1_${targetEnemy.id}`,
              kind: 'STATUS_APPLIED',
              targetType: 'ENEMY',
              targetId: targetEnemy.id,
              sourcePlayerId: player.id,
              label: '+VENENO (2)',
              sublabel: 'FRASCO VOLÁTIL',
              color: '#5EA87A',
              statusType: 'POISON',
            },
            {
              id: `ev_${ts}_fire_st2_${targetEnemy.id}`,
              kind: 'STATUS_APPLIED',
              targetType: 'ENEMY',
              targetId: targetEnemy.id,
              sourcePlayerId: player.id,
              label: '+VULNERABLE (2T)',
              sublabel: '+20% DAÑO RECIBIDO',
              color: '#E7A54A',
              statusType: 'VULNERABLE',
            }
          );
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

    if (def.healAmount) {
      player.recentHealingDone = (player.recentHealingDone || 0) + def.healAmount;
      player.threatScore = (player.threatScore || 0) + Math.round(def.healAmount * 0.4);
    }

    return logText;
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

    const drop = activeRoom.groundDrops.find(
      (d) => (d.id === dropId || d.dropId === dropId) && !d.claimedByPlayerId && !d.claimed
    );
    if (!drop) return;

    const visualEvents: CriptaVisualEvent[] = [];
    const livingConnected = room.players.filter((p) => p.isConnected && !p.isDead && p.hp > 0);
    const isSharedBossOrEliteLoot =
      activeRoom.type === 'MINIBOSS' ||
      activeRoom.type === 'BOSS' ||
      activeRoom.type === 'ELITE' ||
      drop.id.includes('miniboss');

    if (drop.kind === 'RELIC' && drop.relicId) {
      drop.claimed = true;
      drop.claimedByPlayerId = player.id;
      drop.claimedByPlayerName = player.name;
      const acq = this.grantRelicAuthoritatively(room, player, drop.relicId, visualEvents);
      const rDef = CRIPTA_RELICS_REGISTRY[drop.relicId];
      // In multiplayer, if a personal relic is claimed from a boss/miniboss/elite, also bless living teammates so everyone benefits from the victory
      if (rDef && rDef.ownershipType !== 'PARTY' && livingConnected.length > 1) {
        for (const mate of livingConnected) {
          if (mate.id === player.id) continue;
          mate.hp = Math.min(mate.maxHp, mate.hp + 10);
          mate.armor = Math.min(24, mate.armor + 2);
          applyStatusEffectToPlayer(mate, 'BLESSED', 'shared_relic', 1, 2);
        }
      }
      if (acq && rDef) {
        activeRoom.outcomeLog = `¡${player.name} ha reclamado la Reliquia Ancestral: ${rDef.name} (${rDef.description})!`;
      }
    } else if (drop.kind === 'WEAPON' && drop.weaponId) {
      drop.claimed = true;
      drop.claimedByPlayerId = player.id;
      drop.claimedByPlayerName = player.name;
      const dungeonId = room.selectedDungeonId || 'catacumbas_del_rey';
      for (const member of livingConnected) {
        const assignedWepId =
          member.id === player.id
            ? drop.weaponId
            : pickWeaponDropForDungeon(
                dungeonId,
                activeRoom.index + member.seatIndex + 1,
                true,
                member.characterId ? [member.characterId] : []
              );
        const wDef = CRIPTA_WEAPONS_REGISTRY[assignedWepId];
        if (wDef) {
          member.equippedWeaponId = wDef.id;
          member.weaponSpecialCooldown = 0;
          visualEvents.push({
            id: `ev_drop_wep_${Date.now()}_${member.id}`,
            kind: 'WEAPON_EQUIPPED',
            targetType: 'PLAYER',
            targetId: member.id,
            sourcePlayerId: member.id,
            label: `EQUIPÓ: ${wDef.name.toUpperCase()}`,
            sublabel: `${wDef.baseMinDamage}–${wDef.baseMaxDamage} DAÑO`,
            color: wDef.accentColor,
            vfxStyle: 'slash',
          });
        }
      }
      const mainWep = CRIPTA_WEAPONS_REGISTRY[drop.weaponId];
      activeRoom.outcomeLog =
        livingConnected.length > 1
          ? `¡${player.name} abre el armero del guardián! El grupo equipa armamento forjado (${mainWep?.name || 'Arma'}).`
          : `¡${player.name} reclama y equipa ${mainWep?.name || 'el arma'}!`;
    } else if (drop.kind === 'GOLD' || drop.type === 'GOLD_POUCH') {
      drop.claimed = true;
      drop.claimedByPlayerId = player.id;
      drop.claimedByPlayerName = player.name;
      const amt = drop.goldAmount || 28;
      room.partyGold = (room.partyGold ?? 0) + amt;
      if (!room.runStats) room.runStats = buildDefaultRunStats();
      room.runStats.goldEarned += amt;
      visualEvents.push({
        id: `ev_drop_gold_${Date.now()}`,
        kind: 'GAIN_GOLD',
        targetType: 'PARTY',
        value: amt,
        label: `+${amt} ORO`,
        sublabel: 'BOTÍN COMPARTIDO DEL GRUPO',
        color: '#E7A54A',
        vfxStyle: 'gold',
      });
      activeRoom.outcomeLog = `${player.name} recoge la bolsa de oro (+${amt} ORO para la expedición).`;
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
        drop.claimed = true;
        drop.claimedByPlayerId = player.id;
        drop.claimedByPlayerName = player.name;
        const iDef = CRIPTA_ITEMS_REGISTRY[drop.itemId];
        // Shared enemy/miniboss/boss loot: in multiplayer, also grant living teammates a supply item when claiming boss/miniboss/elite caches!
        if (isSharedBossOrEliteLoot && livingConnected.length > 1) {
          const companionItems: CriptaItemId[] = ['pocion_curacion', 'venda', 'sal_purificadora'];
          for (const mate of livingConnected) {
            if (mate.id === player.id) continue;
            if ((mate.normalInventory || []).length < NORMAL_INVENTORY_MAX_SLOTS) {
              const mateItem =
                companionItems[(activeRoom.index + mate.seatIndex) % companionItems.length];
              this.grantNormalItemAuthoritatively(
                room,
                mate,
                mateItem,
                'DROP',
                undefined,
                undefined,
                visualEvents
              );
            }
          }
          activeRoom.outcomeLog = `${player.name} reclama ${iDef?.name || 'el botín'} y reparte suministros de campaña con el grupo.`;
        } else {
          activeRoom.outcomeLog = `${player.name} recoge ${iDef?.name || 'un objeto'} y lo guarda en su inventario.`;
        }
      } else {
        activeRoom.outcomeLog = `El inventario de ${player.name} está lleno (6/6). Elige qué objeto reemplazar.`;
      }
    }

    const remainingUnclaimed = (activeRoom.groundDrops || []).filter(
      (d) => !d.claimed && !d.claimedByPlayerId
    );
    if (activeRoom.resolved && remainingUnclaimed.length === 0) {
      activeRoom.lifecyclePhase = 'READY_TO_LEAVE';
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
    if (!activeRoom) return;

    if (!activeRoom.shopInventory && activeRoom.shopSlots) {
      activeRoom.shopInventory = activeRoom.shopSlots.map((s) => ({ ...s }));
    }
    if (!activeRoom.shopInventory) return;

    // Handle Shop Reroll ("Reabastecer Mercancía")
    if (slotId === 'REROLL_SHOP') {
      const rerollCount = activeRoom.shopRerollCount || 0;
      const rerollCost = 10 + rerollCount * 6;
      const currentGold = room.partyGold ?? 0;
      if (currentGold < rerollCost) {
        this.sendError(ws, `Oro insuficiente para renovar la tienda (${rerollCost} ORO).`);
        return;
      }
      room.partyGold = currentGold - rerollCost;
      if (!room.runStats) room.runStats = buildDefaultRunStats();
      room.runStats.goldSpent += rerollCost;
      activeRoom.shopRerollCount = rerollCount + 1;

      const preferredClasses = room.players
        .map((p) => p.characterId)
        .filter((c): c is CriptaCharacterId => Boolean(c));
      const excludedRelics = [
        ...(room.partyRelics || []).map((r) => r.relicId),
        ...room.players.flatMap((p) => (p.personalRelics || []).map((r) => r.relicId)),
      ];
      const excludedWeapons = room.players
        .map((p) => p.equippedWeaponId)
        .filter((w): w is NonNullable<typeof w> => Boolean(w));

      const refreshed = generateShopInventoryForRoom(
        (room.dungeonSeed || room.seed) + activeRoom.index * 131,
        activeRoom.index,
        this.hasPartyRelic(room, 'moneda_del_muerto'),
        preferredClasses,
        excludedRelics,
        excludedWeapons,
        activeRoom.shopRerollCount
      );
      activeRoom.shopInventory = refreshed;
      activeRoom.shopSlots = refreshed.map((s) => ({ ...s }));
      activeRoom.outcomeLog = `${player.name} paga ${rerollCost} ORO y el mercader descubre nuevas mercancías.`;
      this.emitVisualEventBatch(
        room,
        [
          {
            id: `ev_shop_reroll_${Date.now()}`,
            kind: 'LOSE_GOLD',
            targetType: 'PARTY',
            value: -rerollCost,
            label: `-${rerollCost} ORO · NUEVA MERCANCÍA`,
            color: '#FFD166',
            vfxStyle: 'gold',
          },
        ],
        player.id,
        'REROLL_SHOP'
      );
      this.broadcastRoomState(room);
      return;
    }

    const slot = activeRoom.shopInventory.find(
      (s) => (s.id === slotId || s.slotId === slotId) && !s.soldOut && !s.sold
    );
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
    } else if (slot.kind === 'WEAPON' && slot.weaponId) {
      const wDef = CRIPTA_WEAPONS_REGISTRY[slot.weaponId];
      if (!wDef) return;
      room.partyGold = currentGold - slot.priceGold;
      slot.soldOut = true;
      slot.buyerName = player.name;
      if (!room.runStats) room.runStats = buildDefaultRunStats();
      room.runStats.goldSpent += slot.priceGold;

      player.equippedWeaponId = wDef.id;
      player.weaponSpecialCooldown = 0;

      visualEvents.push(
        {
          id: `ev_shop_gold_${Date.now()}`,
          kind: 'LOSE_GOLD',
          targetType: 'PARTY',
          value: -slot.priceGold,
          label: `-${slot.priceGold} ORO`,
          color: '#E7A54A',
          vfxStyle: 'gold',
        },
        {
          id: `ev_shop_wep_${Date.now()}`,
          kind: 'WEAPON_EQUIPPED',
          targetType: 'PLAYER',
          targetId: player.id,
          sourcePlayerId: player.id,
          label: `EQUIPÓ: ${wDef.name.toUpperCase()}`,
          sublabel: `${wDef.baseMinDamage}–${wDef.baseMaxDamage} DAÑO · ${wDef.specialAttack.name.toUpperCase()}`,
          color: wDef.accentColor,
          vfxStyle: 'slash',
        }
      );
      activeRoom.outcomeLog = `¡${player.name} compra y equipa ${wDef.name} (${wDef.baseMinDamage}–${wDef.baseMaxDamage} DAÑO) por ${slot.priceGold} ORO!`;
    } else if (slot.kind === 'ARMOR' && slot.armorId) {
      const aDef = CRIPTA_ARMORS_REGISTRY[slot.armorId];
      if (!aDef) return;
      room.partyGold = currentGold - slot.priceGold;
      slot.soldOut = true;
      slot.buyerName = player.name;
      if (!room.runStats) room.runStats = buildDefaultRunStats();
      room.runStats.goldSpent += slot.priceGold;

      player.equippedArmorId = aDef.id;
      player.maxHp += aDef.bonusMaxHp;
      player.hp = Math.min(player.maxHp, player.hp + aDef.bonusMaxHp);
      player.armor = Math.min(24, player.armor + aDef.bonusDefense);

      visualEvents.push(
        {
          id: `ev_shop_gold_${Date.now()}`,
          kind: 'LOSE_GOLD',
          targetType: 'PARTY',
          value: -slot.priceGold,
          label: `-${slot.priceGold} ORO`,
          color: '#E7A54A',
          vfxStyle: 'gold',
        },
        {
          id: `ev_shop_arm_${Date.now()}`,
          kind: 'GAIN_DEFENSE',
          targetType: 'PLAYER',
          targetId: player.id,
          value: aDef.bonusDefense,
          label: `EQUIPÓ: ${aDef.name.toUpperCase()}`,
          sublabel: aDef.specialEffectText,
          color: '#69A8A5',
          vfxStyle: 'shield',
        }
      );
      activeRoom.outcomeLog = `¡${player.name} equipa ${aDef.name} (${aDef.specialEffectText}) por ${slot.priceGold} ORO!`;
    } else if (slot.kind === 'ACCESSORY' && slot.accessoryId) {
      const accDef = CRIPTA_ACCESSORIES_REGISTRY[slot.accessoryId];
      if (!accDef) return;
      room.partyGold = currentGold - slot.priceGold;
      slot.soldOut = true;
      slot.buyerName = player.name;
      if (!room.runStats) room.runStats = buildDefaultRunStats();
      room.runStats.goldSpent += slot.priceGold;

      player.equippedAccessoryId = accDef.id;

      visualEvents.push(
        {
          id: `ev_shop_gold_${Date.now()}`,
          kind: 'LOSE_GOLD',
          targetType: 'PARTY',
          value: -slot.priceGold,
          label: `-${slot.priceGold} ORO`,
          color: '#E7A54A',
          vfxStyle: 'gold',
        },
        {
          id: `ev_shop_acc_${Date.now()}`,
          kind: 'GAIN_MAGIC',
          targetType: 'PLAYER',
          targetId: player.id,
          label: `EQUIPÓ: ${accDef.name.toUpperCase()}`,
          sublabel: accDef.specialEffectText,
          color: '#9B72CF',
          vfxStyle: 'arcane',
        }
      );
      activeRoom.outcomeLog = `¡${player.name} equipa ${accDef.name} (${accDef.specialEffectText}) por ${slot.priceGold} ORO!`;
    } else if (slot.kind === 'WEAPON_RUNE' && slot.weaponRuneId) {
      const runeDef = CRIPTA_WEAPON_RUNES_REGISTRY[slot.weaponRuneId];
      if (!runeDef) return;
      room.partyGold = currentGold - slot.priceGold;
      slot.soldOut = true;
      slot.buyerName = player.name;
      if (!room.runStats) room.runStats = buildDefaultRunStats();
      room.runStats.goldSpent += slot.priceGold;

      if (!player.ownedWeaponRunes) player.ownedWeaponRunes = [];
      if (!player.ownedWeaponRunes.includes(runeDef.id)) {
        player.ownedWeaponRunes.push(runeDef.id);
      }
      const prevRune = player.equippedWeaponRuneId
        ? CRIPTA_WEAPON_RUNES_REGISTRY[player.equippedWeaponRuneId]
        : null;
      if (prevRune?.maxHpPenalty) {
        player.maxHp += prevRune.maxHpPenalty;
      }
      if (runeDef.maxHpPenalty) {
        player.maxHp = Math.max(12, player.maxHp - runeDef.maxHpPenalty);
        player.hp = Math.min(player.hp, player.maxHp);
      }
      player.equippedWeaponRuneId = runeDef.id;
      const eq = getEquippedWeaponForPlayer(player);

      visualEvents.push(
        {
          id: `ev_shop_gold_${Date.now()}`,
          kind: 'LOSE_GOLD',
          targetType: 'PARTY',
          value: -slot.priceGold,
          label: `-${slot.priceGold} ORO`,
          color: '#E7A54A',
          vfxStyle: 'gold',
        },
        {
          id: `ev_shop_rune_${Date.now()}`,
          kind: 'WEAPON_UPGRADED',
          targetType: 'PLAYER',
          targetId: player.id,
          label: `INFUSIÓN: ${runeDef.name.toUpperCase()}`,
          sublabel: `${eq.weapon.name.toUpperCase()} -> DAÑO ${runeDef.infusedDamageType}`,
          color: runeDef.accentColor,
          vfxStyle: 'arcane',
        }
      );
      activeRoom.outcomeLog = `¡${player.name} adquiere e infunde ${runeDef.name} en su ${eq.weapon.name} (${runeDef.benefitText} · ${runeDef.tradeoffText})!`;
    } else if (slot.kind === 'FORGE_UPGRADE') {
      const currLevel = player.weaponUpgradeLevel || 1;
      if (currLevel >= 3) {
        this.sendError(ws, 'Tu arma ya ha alcanzado el NIVEL III máximo.');
        return;
      }
      room.partyGold = currentGold - slot.priceGold;
      slot.soldOut = true;
      slot.buyerName = player.name;
      if (!room.runStats) room.runStats = buildDefaultRunStats();
      room.runStats.goldSpent += slot.priceGold;

      player.weaponUpgradeLevel = (currLevel + 1) as 2 | 3;
      const eq = getEquippedWeaponForPlayer(player);

      visualEvents.push(
        {
          id: `ev_shop_gold_${Date.now()}`,
          kind: 'LOSE_GOLD',
          targetType: 'PARTY',
          value: -slot.priceGold,
          label: `-${slot.priceGold} ORO`,
          color: '#E7A54A',
          vfxStyle: 'gold',
        },
        {
          id: `ev_shop_up_${Date.now()}`,
          kind: 'WEAPON_UPGRADED',
          targetType: 'PLAYER',
          targetId: player.id,
          label: `¡ARMA MEJORADA A NIVEL ${player.weaponUpgradeLevel}!`,
          sublabel: `${eq.weapon.name.toUpperCase()} (${eq.scaledMin}–${eq.scaledMax} DAÑO)`,
          color: '#FFD166',
          vfxStyle: 'slash',
        }
      );
      activeRoom.outcomeLog = `¡${player.name} forja su ${eq.weapon.name} al NIVEL ${player.weaponUpgradeLevel} (${eq.scaledMin}–${eq.scaledMax} DAÑO)!`;
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

    // Record multiplayer shop purchase history & emit live SHOP_PURCHASE event (Section 6)
    const purchasedLabel =
      slot.kind === 'RELIC' && slot.relicId
        ? CRIPTA_RELICS_REGISTRY[slot.relicId]?.name || 'Reliquia'
        : slot.kind === 'WEAPON' && slot.weaponId
        ? CRIPTA_WEAPONS_REGISTRY[slot.weaponId]?.name || 'Arma'
        : slot.kind === 'ARMOR' && slot.armorId
        ? CRIPTA_ARMORS_REGISTRY[slot.armorId]?.name || 'Armadura'
        : slot.kind === 'ACCESSORY' && slot.accessoryId
        ? CRIPTA_ACCESSORIES_REGISTRY[slot.accessoryId]?.name || 'Accesorio'
        : slot.kind === 'WEAPON_RUNE' && slot.weaponRuneId
        ? CRIPTA_WEAPON_RUNES_REGISTRY[slot.weaponRuneId]?.name || 'Runa de Arma'
        : slot.kind === 'FORGE_UPGRADE'
        ? 'Mejora de Forja'
        : slot.itemId
        ? CRIPTA_ITEMS_REGISTRY[slot.itemId]?.name || 'Objeto'
        : 'Artículo';

    if (!activeRoom.shopPurchaseHistory) {
      activeRoom.shopPurchaseHistory = [];
    }
    slot.sold = Boolean(slot.soldOut);
    activeRoom.shopSlots = activeRoom.shopInventory.map((s) => ({
      ...s,
      sold: Boolean(s.soldOut || s.sold),
    }));
    activeRoom.shopPurchaseHistory.unshift({
      id: `pur_${Date.now()}_${slot.id}`,
      buyerName: player.name,
      itemName: purchasedLabel,
      priceGold: slot.priceGold,
      timestamp: Date.now(),
    });

    visualEvents.push({
      id: `ev_shop_notice_${Date.now()}`,
      kind: 'SHOP_PURCHASE',
      targetType: 'ROOM',
      sourcePlayerId: player.id,
      value: slot.priceGold,
      label: `${player.name.toUpperCase()} COMPRÓ ${purchasedLabel.toUpperCase()}`,
      sublabel: `-${slot.priceGold} ORO · TIENDA ABIERTA`,
      color: '#FFD166',
      vfxStyle: 'gold',
    });

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
      // Leave the new item behind — if it came from a ground drop, mark that ground drop as discarded so it never blocks room exit!
      if (pending.sourceType === 'DROP' && pending.sourceRefId && activeRoom?.groundDrops) {
        const drop = activeRoom.groundDrops.find(
          (d) => d.id === pending.sourceRefId && !d.claimedByPlayerId
        );
        if (drop) {
          drop.claimedByPlayerId = player.id;
          drop.claimedByPlayerName = player.name;
        }
      }
      player.pendingInventoryReplacement = null;
      if (activeRoom) {
        const remainingDrops = (activeRoom.groundDrops || []).filter((d) => !d.claimedByPlayerId);
        if (activeRoom.resolved && remainingDrops.length === 0) {
          activeRoom.lifecyclePhase = 'READY_TO_LEAVE';
        }
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
      !(
        (room.phase === 'THREE_DOORS' || room.phase === 'RETURNING_TO_DOORS') &&
        (room.completedDoorCount ?? 0) >= 3
      )
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
    this.assignFreshPlayerTurn(
      bossChamber,
      firstLiving ? firstLiving.id : connectedPlayers[0]?.id || null
    );
    bossChamber.actedPlayerIdsThisRound = [];

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
    if (killedEnemy.isMiniboss || (killedEnemy.isBoss && !killedEnemy.isFinalBoss)) {
      room.runStats.minibossesDefeated = (room.runStats.minibossesDefeated || 0) + 1;
    }
    room.dungeonEnemiesDefeated = (room.dungeonEnemiesDefeated || 0) + 1;

    visualEvents.push({
      id: `ev_${ts}_kill_${killedEnemy.id}`,
      kind:
        killedEnemy.isMiniboss || (killedEnemy.isBoss && !killedEnemy.isFinalBoss)
          ? 'MINIBOSS_DEFEATED'
          : 'ENEMY_DEATH',
      targetType: 'ENEMY',
      targetId: killedEnemy.id,
      label:
        killedEnemy.isMiniboss || (killedEnemy.isBoss && !killedEnemy.isFinalBoss)
          ? `¡MINIBOSS DERROTADO: ${killedEnemy.name.toUpperCase()}!`
          : `¡${killedEnemy.name.toUpperCase()} DERROTADO!`,
      sublabel:
        killedEnemy.isMiniboss || (killedEnemy.isBoss && !killedEnemy.isFinalBoss)
          ? 'GUARDIÁN DE LA PUERTA VENCIDO · RECLAMA EL BOTÍN'
          : undefined,
      color: '#FFD166',
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

    // Class Resource on Enemy Death:
    // - Nigromante (Cosecha de Almas): +1 ESENCIA (max 5) & +4 PV
    // - Bárbaro (Sed de Batalla): +20 FURIA (max 100)
    for (const p of room.players) {
      if (p.isDead || p.hp <= 0) continue;
      if (p.characterId === 'nigromante') {
        p.classResource = Math.min(5, (p.classResource || 0) + 1);
        p.hp = Math.min(p.maxHp, p.hp + 4);
        room.runStats.healingDone += 4;
        visualEvents.push({
          id: `ev_${ts}_nigro_soul_${p.id}_${killedEnemy.id}`,
          kind: 'HEAL_PLAYER',
          targetType: 'PLAYER',
          targetId: p.id,
          value: 4,
          label: `+1 ESENCIA (${p.classResource}/5) · +4 PV`,
          sublabel: 'COSECHA DE ALMAS',
          color: '#34D399',
          vfxStyle: 'arcane',
        });
      } else if (p.characterId === 'barbaro') {
        p.classResource = Math.min(100, (p.classResource || 0) + 20);
      }
    }

    // Authoritative Enemy Loot Drop Roll (Requirements 10, 11, 18 & Miniboss Guaranteed Rewards Section 44)
    if (!killedEnemy.isFinalBoss) {
      const enemyIdx = Math.max(0, activeRoom.enemies.indexOf(killedEnemy));
      const drop = rollEnemyLootDrop(
        room.dungeonSeed || room.seed,
        activeRoom.index,
        enemyIdx,
        killedEnemy.name,
        killedEnemy.isElite,
        Boolean(killedEnemy.isBoss || killedEnemy.isMiniboss),
        room.players,
        room.partyRelics || []
      );
      if (drop) {
        if (!activeRoom.groundDrops) activeRoom.groundDrops = [];
        activeRoom.groundDrops.push(drop);
      }

      // Dungeon Minibosses and Elites also award a tactical Weapon Rune / Elemental Infusion!
      if (killedEnemy.isElite || killedEnemy.isMiniboss || (killedEnemy.isBoss && !killedEnemy.isFinalBoss)) {
        const droppedRuneId = pickWeaponRuneDropForDungeon(
          room.selectedDungeonId || 'catacumbas_del_rey',
          activeRoom.index,
          Boolean(killedEnemy.isMiniboss || killedEnemy.isBoss)
        );
        const runeDef = CRIPTA_WEAPON_RUNES_REGISTRY[droppedRuneId];
        if (runeDef) {
          for (const p of room.players) {
            if (!p.isConnected) continue;
            if (!p.ownedWeaponRunes) p.ownedWeaponRunes = [];
            if (!p.ownedWeaponRunes.includes(droppedRuneId)) {
              p.ownedWeaponRunes.push(droppedRuneId);
              if (!p.equippedWeaponRuneId) {
                if (runeDef.maxHpPenalty) {
                  p.maxHp = Math.max(12, p.maxHp - runeDef.maxHpPenalty);
                  p.hp = Math.min(p.hp, p.maxHp);
                }
                p.equippedWeaponRuneId = droppedRuneId;
              }
            }
          }
          visualEvents.push({
            id: `ev_${ts}_rune_drop_${droppedRuneId}`,
            kind: 'WEAPON_UPGRADED',
            targetType: 'PARTY',
            label: `✦ RUNA OBTENIDA: ${runeDef.name.toUpperCase()}`,
            sublabel: `INFUSIÓN ${runeDef.infusedDamageType} DISPONIBLE EN TU ARMA`,
            color: runeDef.accentColor,
            vfxStyle: 'arcane',
          });
        }
      }

      // Dungeon Minibosses also drop distinctive Custodio Special Loot: a named Custodio Elixir, a Biome-Forged Signature Weapon, and a Custodio Relic!
      if (killedEnemy.isMiniboss || (killedEnemy.isBoss && !killedEnemy.isFinalBoss)) {
        if (!activeRoom.groundDrops) activeRoom.groundDrops = [];
        const bonusMinibossItems: CriptaItemId[] = [
          'pocion_mayor',
          'elixir_fuerza',
          'elixir_arcano',
          'sal_purificadora',
        ];
        const pickedBonusItem =
          bonusMinibossItems[
            ((room.dungeonSeed || room.seed) + activeRoom.index) % bonusMinibossItems.length
          ];
        const bonusItemDef = CRIPTA_ITEMS_REGISTRY[pickedBonusItem];
        const bonusDropId = `drop_miniboss_bonus_${activeRoom.index}_${ts}`;
        activeRoom.groundDrops.push({
          id: bonusDropId,
          dropId: bonusDropId,
          kind: 'ITEM',
          type: 'ITEM',
          label: `Reserva de ${killedEnemy.name}: ${bonusItemDef?.name || 'Elixir Mayor'}`,
          itemId: pickedBonusItem,
          droppedByEnemyName: killedEnemy.name,
          xPercent: 34,
          claimed: false,
          claimedByPlayerId: null,
        });

        // Also drop a canonical Biome Weapon forged by the Miniboss so the party can claim a distinctive weapon reward card!
        const preferredClasses = room.players
          .filter((p) => p.isConnected)
          .map((p) => p.characterId)
          .filter((c): c is CriptaCharacterId => Boolean(c));
        const minibossWeaponId = pickWeaponDropForDungeon(
          room.selectedDungeonId || 'catacumbas_del_rey',
          activeRoom.index + 3,
          true,
          preferredClasses
        );
        const minibossWepDef = CRIPTA_WEAPONS_REGISTRY[minibossWeaponId];
        if (minibossWepDef) {
          const wepDropId = `drop_miniboss_weapon_${activeRoom.index}_${ts}`;
          activeRoom.groundDrops.push({
            id: wepDropId,
            dropId: wepDropId,
            kind: 'WEAPON',
            type: 'WEAPON',
            label: `Trofeo de ${killedEnemy.name}: ${minibossWepDef.name}`,
            weaponId: minibossWeaponId,
            droppedByEnemyName: killedEnemy.name,
            xPercent: 66,
            claimed: false,
            claimedByPlayerId: null,
          });
        }

        // Grant a permanent +1 Attack & +1 Defense Custodio Trophy blessing to all living adventurers!
        for (const p of room.players) {
          if (!p.isDead && p.hp > 0) {
            p.bonusAttack = (p.bonusAttack || 0) + 1;
            p.armor = Math.min(24, p.armor + 1);
          }
        }
        visualEvents.push({
          id: `ev_${ts}_miniboss_special_loot_${killedEnemy.id}`,
          kind: 'LOOT_ITEM',
          targetType: 'PARTY',
          label: `★ BOTÍN ESPECIAL DE ${killedEnemy.name.toUpperCase()}`,
          sublabel: 'RELIQUIA + ARMA DE CUSTODIO + ELIXIR (+1 ATQ / +1 DEF)',
          color: '#FFD166',
          vfxStyle: 'gold',
        });
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
    const unclaimedDropsAfterKill = (activeRoom.groundDrops || []).filter(
      (d) => !d.claimedByPlayerId
    );
    activeRoom.lifecyclePhase =
      unclaimedDropsAfterKill.length > 0 ? 'REWARD_PENDING' : 'READY_TO_LEAVE';
    activeRoom.resolvedAtTimestamp = ts;
    activeRoom.activeTurnPlayerId = null;
    activeRoom.turnId = null;
    activeRoom.turnActionConsumed = true;
    activeRoom.currentTurnAp = 0;

    const isMinibossRoom =
      activeRoom.type === 'MINIBOSS' ||
      (activeRoom.type === 'BOSS' && !activeRoom.isFinalBossRoom);

    const hasGoldRelic = playerHasRelic(actorPlayer, room.partyRelics || [], 'moneda_del_muerto');
    const baseGoldReward = activeRoom.isFinalBossRoom
      ? 160
      : isMinibossRoom
      ? 58
      : activeRoom.type === 'ELITE'
      ? 30
      : 15;
    const goldReward = baseGoldReward + (hasGoldRelic ? 6 : 0);
    const victoryHeal = isMinibossRoom ? 12 : 8;

    activeRoom.rewardSummary = {
      goldGranted: goldReward,
      healGranted: victoryHeal,
      itemDropsCount: unclaimedDropsAfterKill.filter((d) => d.kind === 'ITEM').length,
      relicDropsCount: unclaimedDropsAfterKill.filter((d) => d.kind === 'RELIC').length,
    };

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
        : isMinibossRoom
        ? 'TESORO DEL MINIBOSS DE MAZMORRA'
        : 'BOTÍN DE CÁMARA',
      color: '#E7A54A',
      vfxStyle: 'gold',
    });

    // Post-combat victory breath for living players
    for (const p of room.players) {
      if (!p.isDead && p.hp > 0) {
        p.hp = Math.min(p.maxHp, p.hp + victoryHeal);
        room.runStats.healingDone += victoryHeal;
        visualEvents.push({
          id: `ev_${ts}_vic_heal_${p.id}`,
          kind: 'HEAL_PLAYER',
          targetType: 'PLAYER',
          targetId: p.id,
          value: victoryHeal,
          label: `+${victoryHeal} PV`,
          sublabel: isMinibossRoom ? 'TRIUNFO SOBRE EL MINIBOSS' : 'VICTORIA',
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
    } else if (isMinibossRoom) {
      room.dungeonCompleted = true;
      const doorNum = Math.min(3, (room.completedDoorCount ?? 0) + 1);
      const dName = this.getCurrentDungeonDisplayName(room);
      const defeatedMinibossName = activeRoom.enemies[0]?.name || 'Custodio de la Puerta';
      room.dungeonCompletionSummary = {
        dungeonId: room.selectedDungeonId || 'catacumbas_del_rey',
        dungeonName: dName,
        doorNumberCompleted: doorNum,
        minibossDefeatedName: defeatedMinibossName,
        goldEarned: Math.max(0, (room.partyGold ?? 0) - (room.dungeonStartGold ?? 0)),
        itemsFound: room.dungeonItemsFound || 0,
        relicsFound: room.dungeonRelicsFound || 0,
        enemiesDefeated: room.dungeonEnemiesDefeated || 0,
      };
      activeRoom.outcomeLog = `${logParts.join(
        ' '
      )} ¡${defeatedMinibossName} derrotado! Recoged la Reliquia y el botín del suelo antes de cruzar la Gran Puerta de salida (${doorNum}/3).`;
    } else {
      activeRoom.outcomeLog = `${logParts.join(
        ' '
      )} ¡Cámara despejada! Botín obtenido: +${goldReward} ORO y +${victoryHeal} VIDA.`;
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

  private getPlayerInitiativeSpeed(player: CriptaPlayer): number {
    return computePlayerEffectiveStats(player).initiativeScore;
  }

  private handleLockRoundAction(
    ws: WebSocket,
    room: ServerCriptaRoom,
    player: CriptaPlayer,
    payload: {
      actionType: CriptaPlayerRoundActionType;
      abilityId?: string;
      targetEnemyId?: string;
      targetPlayerId?: string;
      itemSlotIndex?: number;
      turnId?: string;
      actionNonce?: string;
      cardId?: string;
    }
  ) {
    if (!this.isInsideExploreOrBossPhase(room)) {
      this.logRejectedTransition(room, 'LOCK_ROUND_ACTION', 'Not inside an active dungeon or boss phase');
      return;
    }
    if (room.expeditionDefeated) {
      this.logRejectedTransition(room, 'LOCK_ROUND_ACTION', 'Expedition is defeated');
      return;
    }
    const activeRoom = this.getActiveDungeonRoom(room);
    if (!activeRoom || activeRoom.resolved) {
      this.logRejectedTransition(room, 'LOCK_ROUND_ACTION', 'Active room is missing or already resolved');
      return;
    }

    if (player.isDead || player.hp <= 0) {
      this.sendError(ws, 'Has caído en combate. Espera a que un compañero te reviva.');
      return;
    }

    const livingEnemies = activeRoom.enemies.filter((e) => e.hp > 0);
    if (livingEnemies.length === 0) {
      activeRoom.resolved = true;
      activeRoom.state = 'RESOLVED';
      activeRoom.lifecyclePhase = 'READY_TO_LEAVE';
      this.syncLegacyNodes(room);
      this.broadcastRoomState(room);
      return;
    }

    const currentRoundPhase = activeRoom.combatRoundPhase || 'PLAYER_PHASE';
    if (currentRoundPhase !== 'PLAYER_PHASE' || room.isResolvingRound) {
      this.logRejectedTransition(
        room,
        'LOCK_ROUND_ACTION',
        `Combat round is not in PLAYER_PHASE (${currentRoundPhase}) or is currently resolving`
      );
      return;
    }

    if (!activeRoom.actedPlayerIdsThisRound) {
      activeRoom.actedPlayerIdsThisRound = [];
    }

    // Ensure activeTurnPlayerId points to a valid living connected player
    const livingConnected = room.players
      .filter((p) => p.isConnected && !p.isDead && p.hp > 0)
      .sort((a, b) => a.seatIndex - b.seatIndex);
    if (livingConnected.length === 0) return;

    let currentTurnPlayer = livingConnected.find((p) => p.id === activeRoom.activeTurnPlayerId);
    if (!currentTurnPlayer) {
      const nextId = this.computeNextTurnPlayerId(room, activeRoom);
      currentTurnPlayer = livingConnected.find((p) => p.id === nextId) || livingConnected[0];
      this.assignFreshPlayerTurn(activeRoom, currentTurnPlayer.id);
    }

    // Enforce individual sequential player turns!
    if (player.id !== currentTurnPlayer.id) {
      this.logRejectedTransition(
        room,
        'LOCK_ROUND_ACTION',
        `Player ${player.id} attempted to act on ${currentTurnPlayer.id}'s turn`
      );
      this.sendError(ws, `Es el turno de ${currentTurnPlayer.name}.`);
      return;
    }

    // STRICT ONE-CARD-PER-TURN VALIDATION (Section 7):
    // Reject if this turn's main action was already consumed or if turnId/actionNonce is stale
    if (
      activeRoom.turnActionConsumed ||
      activeRoom.actedPlayerIdsThisRound.includes(player.id) ||
      (typeof activeRoom.currentTurnAp === 'number' && activeRoom.currentTurnAp <= 0)
    ) {
      this.logRejectedTransition(
        room,
        'LOCK_ROUND_ACTION',
        `Turn action already consumed for player ${player.id} on turnId=${activeRoom.turnId}`
      );
      return;
    }

    if (payload.turnId && activeRoom.turnId && payload.turnId !== activeRoom.turnId) {
      this.logRejectedTransition(
        room,
        'LOCK_ROUND_ACTION',
        `Stale turnId (${payload.turnId} !== ${activeRoom.turnId})`
      );
      return;
    }

    if (payload.actionNonce && activeRoom.lastActionNonce === payload.actionNonce) {
      this.logRejectedTransition(
        room,
        'LOCK_ROUND_ACTION',
        `Duplicate actionNonce (${payload.actionNonce})`
      );
      return;
    }

    if (payload.actionType === 'WEAPON_SPECIAL' && (player.weaponSpecialCooldown || 0) > 0) {
      this.sendError(
        ws,
        `Tu habilidad especial de arma está en recarga (${player.weaponSpecialCooldown}T).`
      );
      return;
    }

    if (payload.actionType === 'ABILITY') {
      const charDef = player.characterId ? CRIPTA_CHARACTERS_CATALOG[player.characterId] : null;
      const chosenAb =
        charDef?.abilities.find((a) => a.id === payload.abilityId) || charDef?.abilities[0];
      const abCd = chosenAb && player.abilityCooldowns ? player.abilityCooldowns[chosenAb.id] || 0 : 0;
      if (abCd > 0) {
        this.sendError(
          ws,
          `${chosenAb?.name || 'La habilidad'} está en enfriamiento (${abCd}T).`
        );
        return;
      }
      const minRes = chosenAb?.minResourceRequired ?? chosenAb?.resourceCost ?? 0;
      const curRes = player.classResource ?? charDef?.classResource?.initialValue ?? 0;
      if (minRes > 0 && curRes < minRes) {
        this.sendError(
          ws,
          `${chosenAb?.name || 'La técnica'} requiere al menos ${minRes} de ${
            charDef?.classResource?.label || 'recurso'
          } (actual: ${curRes}).`
        );
        return;
      }
    }

    // Validate ITEM action if chosen
    let resolvedItemId: CriptaItemId | undefined;
    if (payload.actionType === 'ITEM') {
      const inv = player.normalInventory || [];
      const idx = typeof payload.itemSlotIndex === 'number' ? payload.itemSlotIndex : 0;
      if (idx < 0 || idx >= inv.length) {
        this.sendError(ws, 'Selecciona un objeto válido de tu inventario.');
        return;
      }
      const itemId = inv[idx];
      const def = CRIPTA_ITEMS_REGISTRY[itemId];
      if (!def || !def.combatUsable) {
        this.sendError(ws, 'Ese objeto no se puede utilizar en combate.');
        return;
      }
      resolvedItemId = itemId;
    }

    // Immediately lock the turn action BEFORE resolving card effects (Section 7)
    activeRoom.turnActionConsumed = true;
    activeRoom.currentTurnAp = 0;
    activeRoom.maxTurnAp = 1;
    if (payload.actionNonce) {
      activeRoom.lastActionNonce = payload.actionNonce;
    }
    if (!activeRoom.actedPlayerIdsThisRound.includes(player.id)) {
      activeRoom.actedPlayerIdsThisRound.push(player.id);
    }

    const validEnemy =
      (payload.targetEnemyId && livingEnemies.find((e) => e.id === payload.targetEnemyId)) ||
      livingEnemies[0];

    const queued: CriptaQueuedPlayerAction = {
      playerId: player.id,
      actionType: payload.actionType,
      abilityId: payload.abilityId,
      targetEnemyId: validEnemy?.id,
      targetPlayerId: payload.targetPlayerId,
      itemSlotIndex: payload.itemSlotIndex,
      itemId: resolvedItemId,
      locked: true,
      submittedAt: Date.now(),
    };

    const currentRound = activeRoom.combatTurn || 1;
    activeRoom.combatTurn = currentRound;
    activeRoom.activeCombatActorId = player.id;
    activeRoom.lastPlayedByPlayerName = player.name;
    activeRoom.lastPlayedCardTitle =
      payload.actionType === 'ATTACK'
        ? 'ATAQUE DE ARMA'
        : payload.actionType === 'WEAPON_SPECIAL'
        ? 'TÉCNICA ESPECIAL'
        : payload.actionType === 'ABILITY'
        ? 'HABILIDAD DE CLASE'
        : payload.actionType === 'DEFEND'
        ? 'GUARDIA DE HIERRO'
        : payload.actionType === 'ITEM'
        ? 'USAR OBJETO'
        : 'FINALIZAR TURNO';

    // Execute the ONE played card immediately!
    const victoryOrPhase2 = this.executeSinglePlayerRoundAction(
      room,
      activeRoom,
      player,
      queued,
      currentRound
    );

    if (victoryOrPhase2 || activeRoom.resolved || room.expeditionDefeated) {
      room.isResolvingRound = false;
      activeRoom.activeCombatActorId = null;
      if (!activeRoom.resolved && !room.expeditionDefeated) {
        // Transitioned to Final Boss Phase 2 -> reset round turn order with 1 main action per player turn
        activeRoom.actedPlayerIdsThisRound = [];
        const nextPlayerId = this.computeNextTurnPlayerId(room, activeRoom);
        this.assignFreshPlayerTurn(activeRoom, nextPlayerId);
      }
      this.syncLegacyNodes(room);
      this.broadcastRoomState(room);
      return;
    }

    // Advance immediately to next living player or Enemy Turn (1 player turn = 1 main action card)
    this.advanceSequentialTurnOrTriggerEnemyPhase(room, activeRoom);
  }

  private advanceSequentialTurnOrTriggerEnemyPhase(
    room: ServerCriptaRoom,
    activeRoom: CriptaDungeonRoom
  ) {
    const livingConnected = room.players
      .filter((p) => p.isConnected && !p.isDead && p.hp > 0)
      .sort((a, b) => {
        const initDiff =
          computePlayerEffectiveStats(b).initiativeScore -
          computePlayerEffectiveStats(a).initiativeScore;
        return initDiff !== 0 ? initDiff : a.seatIndex - b.seatIndex;
      });

    const actedSet = new Set(activeRoom.actedPlayerIdsThisRound || []);
    const unactedPlayers = livingConnected.filter((p) => !actedSet.has(p.id));

    if (unactedPlayers.length > 0) {
      const nextPlayer = unactedPlayers[0];
      nextPlayer.basicAttackUsedThisTurn = false;
      this.assignFreshPlayerTurn(activeRoom, nextPlayer.id);
      activeRoom.activeCombatActorId = null;
      activeRoom.combatRoundPhase = 'PLAYER_PHASE';
      activeRoom.combatBannerText = `TURNO DE ${nextPlayer.name.toUpperCase()}`;
      this.syncLegacyNodes(room);
      this.broadcastRoomState(room);
      return;
    }

    // All living connected players have completed their individual turns -> start Enemy Phase!
    activeRoom.activeTurnPlayerId = null;
    activeRoom.turnId = null;
    activeRoom.turnActionConsumed = true;
    activeRoom.currentTurnAp = 0;
    this.syncLegacyNodes(room);
    this.broadcastRoomState(room);
    this.runAuthoritativeRoundResolution(room, activeRoom);
  }

  private handleUnlockRoundAction(
    _ws: WebSocket,
    room: ServerCriptaRoom,
    _player: CriptaPlayer
  ) {
    this.broadcastRoomState(room);
  }

  private checkAndTriggerRoundResolutionIfReady(room: ServerCriptaRoom) {
    if (room.isResolvingRound) return;
    const activeRoom = this.getActiveDungeonRoom(room);
    if (!activeRoom || activeRoom.resolved) return;

    const livingEnemies = activeRoom.enemies.filter((e) => e.hp > 0);
    if (livingEnemies.length === 0) return;

    const livingConnectedPlayers = room.players
      .filter((p) => p.isConnected && !p.isDead && p.hp > 0)
      .sort((a, b) => a.seatIndex - b.seatIndex);
    if (livingConnectedPlayers.length === 0) return;

    // If the currently active turn player disconnected or died, advance to the next living player or enemy turn
    const activeTurnStillValid = livingConnectedPlayers.some(
      (p) => p.id === activeRoom.activeTurnPlayerId
    );
    if (!activeTurnStillValid && activeRoom.combatRoundPhase === 'PLAYER_PHASE') {
      this.advanceSequentialTurnOrTriggerEnemyPhase(room, activeRoom);
    }
  }

  private runAuthoritativeRoundResolution(
    room: ServerCriptaRoom,
    activeRoom: CriptaDungeonRoom
  ) {
    if (room.isResolvingRound) return;
    room.isResolvingRound = true;

    const currentRound = activeRoom.combatTurn || 1;
    activeRoom.combatTurn = currentRound;
    activeRoom.activeTargetedPlayerIds = [];

    const scheduleStep = (fn: () => void, delayMs: number) => {
      if (room.combatRoundTimer) {
        clearTimeout(room.combatRoundTimer);
      }
      room.combatRoundTimer = setTimeout(() => {
        room.combatRoundTimer = null;
        fn();
      }, delayMs);
    };

    const survivingEnemies = activeRoom.enemies.filter((e) => e.hp > 0);
    if (survivingEnemies.length === 0) {
      room.isResolvingRound = false;
      activeRoom.activeCombatActorId = null;
      this.broadcastRoomState(room);
      return;
    }

    activeRoom.combatRoundPhase = 'ENEMY_PHASE_WARNING';
    activeRoom.activeCombatActorId = null;
    activeRoom.activeTurnPlayerId = null;
    this.broadcastRoomState(room);

    const startEnemyPhaseResolution = () => {
      if (room.expeditionDefeated || activeRoom.resolved) {
        room.isResolvingRound = false;
        return;
      }

      activeRoom.combatRoundPhase = 'RESOLVING_ENEMIES';
      const survivingEnemies = activeRoom.enemies.filter((e) => e.hp > 0);

      // Clear enemy single-round defense/protection stances before enemies take their new round actions
      for (const en of survivingEnemies) {
        en.defendingRoundsRemaining = 0;
        en.protectedByEnemyId = null;
        tickEnemyCooldownsForNewRound(en);
      }

      const alreadyTargetedCounts: Record<string, number> = {};

      const stepEnemyAction = (enemyIdx: number) => {
        if (room.expeditionDefeated || activeRoom.resolved) {
          room.isResolvingRound = false;
          activeRoom.activeCombatActorId = null;
          activeRoom.activeTargetedPlayerIds = [];
          this.broadcastRoomState(room);
          return;
        }

        const currentLivingEnemies = activeRoom.enemies.filter((e) => e.hp > 0);
        // All surviving enemies have acted -> END_OF_ROUND resolution (wait for last enemy attack animation to complete)
        if (enemyIdx >= currentLivingEnemies.length) {
          scheduleStep(() => {
            this.resolveEndOfCombatRound(room, activeRoom);
          }, 2750);
          return;
        }

        const enemy = currentLivingEnemies[enemyIdx];
        if (!enemy || enemy.hp <= 0) {
          stepEnemyAction(enemyIdx + 1);
          return;
        }

        activeRoom.activeCombatActorId = enemy.id;
        this.executeSingleEnemyTacticalAction(
          room,
          activeRoom,
          enemy,
          alreadyTargetedCounts,
          currentRound,
          enemyIdx
        );

        this.syncLegacyNodes(room);
        this.broadcastRoomState(room);

        if (room.expeditionDefeated || activeRoom.resolved) {
          room.isResolvingRound = false;
          activeRoom.activeCombatActorId = null;
          activeRoom.activeTargetedPlayerIds = [];
          this.broadcastRoomState(room);
          return;
        }

        scheduleStep(() => {
          stepEnemyAction(enemyIdx + 1);
        }, 3150);
      };

      stepEnemyAction(0);
    };

    // Wait 2650ms so the player's attack/ability/status/heal sequence fully resolves on screen BEFORE enemy phase starts
    scheduleStep(() => {
      startEnemyPhaseResolution();
    }, 2650);
  }

  private executeSinglePlayerRoundAction(
    room: ServerCriptaRoom,
    activeRoom: CriptaDungeonRoom,
    player: CriptaPlayer,
    queued: CriptaQueuedPlayerAction,
    currentTurn: number
  ): boolean {
    const livingEnemies = activeRoom.enemies.filter((e) => e.hp > 0);
    if (livingEnemies.length === 0) return true;

    const visualEvents: CriptaVisualEvent[] = [];
    const logParts: string[] = [];
    const ts = Date.now();

    // Handle ITEM action
    if (queued.actionType === 'ITEM') {
      const itemLog = this.executeInventoryItemEffect(
        room,
        activeRoom,
        player,
        queued.itemSlotIndex ?? 0,
        queued.itemId,
        queued.targetPlayerId,
        queued.targetEnemyId,
        visualEvents
      );
      if (itemLog) {
        logParts.push(itemLog);
      } else {
        logParts.push(`${player.name} intenta usar un objeto, pero ya fue consumido.`);
      }

      const victory = this.checkAndResolveCombatVictoryIfCleared(
        room,
        activeRoom,
        player,
        logParts,
        visualEvents,
        ts
      );
      if (!victory) {
        activeRoom.outcomeLog = logParts.join(' ');
      }
      this.emitVisualEventBatch(room, visualEvents, player.id, 'USE_ITEM');
      return victory;
    }

    const action = queued.actionType;

    // Dead Target Fallback (Section 7): If the chosen target Enemy A died earlier in the phase,
    // automatically retarget another living enemy!
    let target = livingEnemies.find((e) => e.id === queued.targetEnemyId);
    let retargetedFromDead = false;
    if (!target) {
      target = livingEnemies[0];
      retargetedFromDead = Boolean(queued.targetEnemyId);
    }

    // Enemy Protection Redirection (Section 18, 19, 50):
    // If the target enemy is protected by an ally enemy that is still alive, redirect the hit!
    if (action !== 'DEFEND' && target.protectedByEnemyId) {
      const protector = livingEnemies.find(
        (e) => e.id === target!.protectedByEnemyId && e.hp > 0
      );
      if (protector && protector.id !== target.id) {
        logParts.push(`¡${protector.name} intercepta el ataque dirigido a ${target.name}!`);
        target = protector;
      }
    }

    const charDef = player.characterId
      ? CRIPTA_CHARACTERS_CATALOG[player.characterId]
      : null;

    const effStats = computePlayerEffectiveStats(player);
    const eqWeapon = getEquippedWeaponForPlayer(player);
    const atkStat = effStats.attack;
    const magStat = effStats.magic;
    const defStat = effStats.defense;

    const classVfx: NonNullable<CriptaVisualEvent['vfxStyle']> =
      player.characterId === 'mago'
        ? 'arcane'
        : player.characterId === 'cazador'
        ? 'arrow'
        : player.characterId === 'clerigo' || player.characterId === 'bardo'
        ? 'holy'
        : player.characterId === 'alquimista' || player.characterId === 'nigromante'
        ? 'alchemy'
        : 'slash';

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
    if (player.passedLastRound) {
      dmgMultiplier += 0.18;
      player.passedLastRound = false;
    }
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
    if ((target.vulnerableTurns || 0) > 0) {
      dmgMultiplier += 0.2;
    }
    dmgMultiplier = Math.max(0.45, dmgMultiplier);

    if (retargetedFromDead && action !== 'DEFEND' && action !== 'PASS') {
      logParts.push(`(Objetivo previo derrotado -> redirigido a ${target.name})`);
    }

    if (hasConfusion && action !== 'DEFEND' && action !== 'PASS') {
      const randomIdx = (currentTurn + player.seatIndex) % livingEnemies.length;
      target = livingEnemies[randomIdx];
      dmgMultiplier *= 0.8;
      logParts.push(`¡CONFUSIÓN desvía el golpe de ${player.name} hacia ${target.name}!`);
    }

    if (bleedInstance && (action === 'ATTACK' || action === 'WEAPON_SPECIAL' || action === 'ABILITY')) {
      const bleedDmg = 2 * Math.max(1, bleedInstance.stacks);
      player.hp = Math.max(1, player.hp - bleedDmg);
      logParts.push(`(${player.name} pierde -${bleedDmg} PV por SANGRADO al atacar)`);
      visualEvents.push({
        id: `ev_${ts}_bleed_act_${player.id}`,
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

    const healMult = (hasCurse ? 0.65 : 1) * (1 + effStats.healBoostPct / 100);
    const critMod =
      player.characterId === 'picaro' || player.characterId === 'cazador' ? 2 : 3;
    const isCrit =
      action !== 'DEFEND' &&
      action !== 'PASS' &&
      !hasWeakened &&
      ((currentTurn + player.seatIndex) % critMod === 0 || hasBlessed);
    const hasCalizRelic = playerHasRelic(player, room.partyRelics || [], 'diente_del_rey');

    if (!room.runStats) room.runStats = buildDefaultRunStats();

    // Account for enemy defending armor bonus (Section 17 & 42)
    const targetEffectiveArmor =
      target.armor +
      (target.armorBuffBonus || 0) +
      ((target.defendingRoundsRemaining || 0) > 0 ? 4 : 0);

    const recordPlayerDamageAndThreat = (enemyHit: CriptaRoomEnemy, dmgDealt: number) => {
      player.recentDamageDealt = (player.recentDamageDealt || 0) + dmgDealt;
      player.threatScore = (player.threatScore || 0) + Math.round(dmgDealt * 0.75);
      if (!enemyHit.memory) {
        enemyHit.memory = createInitialEnemyMemory();
      }
      enemyHit.memory.recentDamageByPlayer[player.id] =
        (enemyHit.memory.recentDamageByPlayer[player.id] || 0) + dmgDealt;

      // Section 40: Dungeon Miniboss 50% HP Threshold Behavior (Enrage + Signature Move Telegraph)
      if (
        (enemyHit.isMiniboss || (enemyHit.isBoss && !enemyHit.isFinalBoss)) &&
        !enemyHit.enrageTriggered &&
        enemyHit.hp > 0 &&
        enemyHit.hp <= enemyHit.maxHp * 0.5
      ) {
        enemyHit.enrageTriggered = true;
        enemyHit.attack += 3;
        enemyHit.armorBuffBonus = (enemyHit.armorBuffBonus || 0) + 2;
        enemyHit.armorBuffRounds = 3;
        const sigMove = enemyHit.signatureMoveName || 'Furia del Umbral';
        enemyHit.intent = 'CATACLISMO';
        enemyHit.intentCategory = 'SPECIAL';
        enemyHit.intentValue = enemyHit.attack + 4;
        enemyHit.preparedTelegraphLabel = sigMove;

        visualEvents.push({
          id: `ev_${ts}_miniboss_enrage_${enemyHit.id}`,
          kind: 'MINIBOSS_ENRAGE',
          targetType: 'ENEMY',
          targetId: enemyHit.id,
          label: `¡FURIA DE MINIBOSS (≤50% PV)!`,
          sublabel: `+3 ATAQUE · +2 ARMADURA · PREPARA ${sigMove.toUpperCase()}`,
          color: '#FFD166',
          vfxStyle: 'explosion',
        });
        logParts.push(
          `¡${enemyHit.name} desata su umbral de furia al caer bajo el 50% de vida (+3 ATAQUE, +2 ARMADURA y prepara ${sigMove})!`
        );
      }
    };

    if (action === 'PASS') {
      player.isDefendingThisRound = true;
      player.passedLastRound = true;
      player.armor = Math.min(24, player.armor + 2);
      const focusHeal = Math.max(2, Math.round(4 * healMult));
      player.hp = Math.min(player.maxHp, player.hp + focusHeal);
      room.runStats.healingDone += focusHeal;
      visualEvents.push({
        id: `ev_${ts}_pass_${player.id}`,
        kind: 'SHIELD_PLAYER',
        targetType: 'PLAYER',
        targetId: player.id,
        sourcePlayerId: player.id,
        value: 2,
        label: 'CONCENTRACIÓN +2 DEF',
        sublabel: '+18% DAÑO PRÓXIMA RONDA',
        color: '#69A8A5',
        vfxStyle: 'shield',
      });
      logParts.push(
        `${player.name} aguarda y concentra sus fuerzas (+2 ARMADURA, +${focusHeal} PV y +18% daño en la próxima ronda).`
      );
    } else if (action === 'WEAPON_SPECIAL') {
      const spec = eqWeapon.weapon.specialAttack;
      const cdReduction = player.equippedAccessoryId === 'reloj_de_arena_astral' ? 1 : 0;
      player.weaponSpecialCooldown = Math.max(1, spec.cooldownRounds - cdReduction);

      const isSupportOnlyWeaponSpecial =
        spec.dealsDamage === false ||
        spec.category === 'HEAL' ||
        spec.category === 'DEFEND' ||
        spec.category === 'BUFF';

      if (isSupportOnlyWeaponSpecial) {
        const pHeal = Math.round((spec.partyHealBase || 14) * healMult + magStat * 0.8);
        const shieldGrant = spec.shieldGrant || 2;
        const purifyAmt = spec.purifyCount || 1;
        for (const p of room.players) {
          if (!p.isDead && p.hp > 0) {
            if (pHeal > 0) {
              p.hp = Math.min(p.maxHp, p.hp + pHeal);
              room.runStats.healingDone += pHeal;
              player.recentHealingDone = (player.recentHealingDone || 0) + pHeal;
            }
            if (purifyAmt > 0) {
              purifyPlayerDebuffs(p, purifyAmt);
            }
            if (shieldGrant > 0) {
              p.armor = Math.min(24, p.armor + shieldGrant);
              applyStatusEffectToPlayer(p, 'SHIELDED', player.id, currentTurn, 2);
            } else {
              applyStatusEffectToPlayer(p, 'BLESSED', player.id, currentTurn, 2);
            }
            visualEvents.push({
              id: `ev_${ts}_wspec_sup_${p.id}`,
              kind: 'HEAL_PLAYER',
              targetType: 'PLAYER',
              targetId: p.id,
              value: pHeal,
              label: `+${pHeal} PV${shieldGrant > 0 ? ` · +${shieldGrant} ARM` : ''}`,
              sublabel: spec.name.toUpperCase(),
              color: '#5EA87A',
              vfxStyle: 'holy',
            });
          }
        }
        player.threatScore = (player.threatScore || 0) + 14;
        logParts.push(
          `${player.name} canaliza ${spec.name} (${eqWeapon.weapon.name}), restaurando +${pHeal} PV al grupo${
            purifyAmt > 0 ? `, purificando ${purifyAmt} aflicción` : ''
          }${shieldGrant > 0 ? ` y otorgando +${shieldGrant} ARMADURA` : ''}.`
        );
      } else {
        let hitTargets: CriptaRoomEnemy[] = [target];
        if (spec.targetRule === 'ALL_ENEMIES') {
          hitTargets = [...livingEnemies];
        } else if (spec.targetRule === 'CLEAVE_2' || spec.targetRule === 'CHAIN_2') {
          const secondary = livingEnemies.find((e) => e.id !== target.id && e.hp > 0);
          if (secondary) hitTargets.push(secondary);
        }

        const hitLogNames: string[] = [];
        for (let i = 0; i < hitTargets.length; i++) {
          const en = hitTargets[i];
          if (!en || en.hp <= 0) continue;
          const rolled = rollAuthoritativePlayerDamage(
            player,
            'WEAPON_SPECIAL',
            en,
            currentTurn + i,
            room.partyRelics || [],
            i > 0 && spec.targetRule === 'CHAIN_2'
          );
          let dmg = rolled.damage;
          if (
            eqWeapon.activeRune?.executeBonusPctVsHalfHp &&
            en.hp <= en.maxHp * 0.5
          ) {
            dmg = Math.round(dmg * (1 + eqWeapon.activeRune.executeBonusPctVsHalfHp / 100));
          }
          const prevHp = en.hp;
          en.hp = Math.max(0, en.hp - dmg);
          room.runStats.damageDealt += dmg;
          recordPlayerDamageAndThreat(en, dmg);
          const dmgTypeMeta =
            CRIPTA_DAMAGE_TYPE_META[rolled.damageType] || CRIPTA_DAMAGE_TYPE_META.FISICO;
          const matchupNote =
            rolled.matchupState === 'WEAKNESS'
              ? ` · ¡VULNERABLE A ${dmgTypeMeta.shortLabel}!`
              : rolled.matchupState === 'RESISTANCE'
              ? ` · RESISTE ${dmgTypeMeta.shortLabel}`
              : '';
          hitLogNames.push(`${en.name} (-${dmg} PV ${dmgTypeMeta.shortLabel}${matchupNote})`);

          const appliedStatusEvents: CriptaVisualEvent[] = [];
          if (en.hp > 0) {
            if (spec.armorBreak && spec.armorBreak > 0) {
              en.armor = Math.max(0, en.armor - spec.armorBreak);
              appliedStatusEvents.push({
                id: `ev_${ts}_wspec_abrk_${en.id}_${i}`,
                kind: 'STATUS_APPLIED',
                targetType: 'ENEMY',
                targetId: en.id,
                sourcePlayerId: player.id,
                label: `-${spec.armorBreak} ARMADURA`,
                sublabel: spec.name.toUpperCase(),
                color: '#E7A54A',
                statusType: 'VULNERABLE',
              });
            }
            if (spec.vulnerableTurns && spec.vulnerableTurns > 0) {
              en.vulnerableTurns = (en.vulnerableTurns || 0) + spec.vulnerableTurns;
              appliedStatusEvents.push({
                id: `ev_${ts}_wspec_vuln_${en.id}_${i}`,
                kind: 'STATUS_APPLIED',
                targetType: 'ENEMY',
                targetId: en.id,
                sourcePlayerId: player.id,
                label: `+VULNERABLE (${spec.vulnerableTurns}T)`,
                sublabel: '+20% DAÑO RECIBIDO',
                color: '#E7A54A',
                statusType: 'VULNERABLE',
              });
            }
            if (spec.poisonStacks && spec.poisonStacks > 0) {
              const extraPoison =
                (playerHasRelic(player, room.partyRelics || [], 'guantes_del_boticario') ? 1 : 0) +
                (eqWeapon.activeRune?.extraPoisonStacksOnHit || 0);
              const totalPoisonAdded = spec.poisonStacks + extraPoison;
              en.poisonStacks = (en.poisonStacks || 0) + totalPoisonAdded;
              appliedStatusEvents.push({
                id: `ev_${ts}_wspec_pois_${en.id}_${i}`,
                kind: 'STATUS_APPLIED',
                targetType: 'ENEMY',
                targetId: en.id,
                sourcePlayerId: player.id,
                label: `+VENENO (${totalPoisonAdded})`,
                sublabel: `${en.poisonStacks * 4} DAÑO/RONDA`,
                color: '#5EA87A',
                statusType: 'POISON',
              });
            } else if (eqWeapon.activeRune?.extraPoisonStacksOnHit) {
              const runePoison = eqWeapon.activeRune.extraPoisonStacksOnHit;
              en.poisonStacks = (en.poisonStacks || 0) + runePoison;
              appliedStatusEvents.push({
                id: `ev_${ts}_wspec_rpois_${en.id}_${i}`,
                kind: 'STATUS_APPLIED',
                targetType: 'ENEMY',
                targetId: en.id,
                sourcePlayerId: player.id,
                label: `+VENENO (${runePoison})`,
                sublabel: eqWeapon.activeRune.name.toUpperCase(),
                color: '#5EA87A',
                statusType: 'POISON',
              });
            }
            if (rolled.appliedOnHitStatus) {
              const stDef = CRIPTA_STATUS_EFFECTS_REGISTRY[rolled.appliedOnHitStatus];
              if (rolled.appliedOnHitStatus === 'POISON') {
                en.poisonStacks = (en.poisonStacks || 0) + 1;
              } else if (rolled.appliedOnHitStatus === 'BLEED') {
                en.bleedStacks = (en.bleedStacks || 0) + 1;
              } else if (rolled.appliedOnHitStatus === 'BURN') {
                en.burnStacks = (en.burnStacks || 0) + 1;
              } else if (rolled.appliedOnHitStatus === 'CORROSION') {
                en.corrosionTurns = (en.corrosionTurns || 0) + 2;
              }
              if (
                rolled.appliedOnHitStatus === 'POISON' ||
                rolled.appliedOnHitStatus === 'BLEED' ||
                rolled.appliedOnHitStatus === 'BURN'
              ) {
                if (!spec.poisonStacks) {
                  appliedStatusEvents.push({
                    id: `ev_${ts}_wspec_ohs_${en.id}_${i}`,
                    kind: 'STATUS_APPLIED',
                    targetType: 'ENEMY',
                    targetId: en.id,
                    sourcePlayerId: player.id,
                    label: `+${stDef?.name || 'ESTADO'} (1)`,
                    sublabel: eqWeapon.weapon.name.toUpperCase(),
                    color: stDef?.visualTreatment.color || '#5EA87A',
                    statusType: rolled.appliedOnHitStatus,
                  });
                }
              } else if (
                rolled.appliedOnHitStatus === 'CURSE' ||
                rolled.appliedOnHitStatus === 'MARKED'
              ) {
                if (rolled.appliedOnHitStatus === 'CURSE') {
                  en.curseTurns = (en.curseTurns || 0) + 2;
                } else {
                  en.markedTurns = (en.markedTurns || 0) + 2;
                }
                en.vulnerableTurns = (en.vulnerableTurns || 0) + 2;
                if (!spec.vulnerableTurns) {
                  appliedStatusEvents.push({
                    id: `ev_${ts}_wspec_ohv_${en.id}_${i}`,
                    kind: 'STATUS_APPLIED',
                    targetType: 'ENEMY',
                    targetId: en.id,
                    sourcePlayerId: player.id,
                    label: `+${stDef?.name || 'MARCADO'} (2T)`,
                    sublabel: '+20% DAÑO RECIBIDO',
                    color: stDef?.visualTreatment.color || '#E7A54A',
                    statusType: rolled.appliedOnHitStatus,
                  });
                }
              } else if (
                rolled.appliedOnHitStatus === 'FROST' ||
                rolled.appliedOnHitStatus === 'BLINDED' ||
                rolled.appliedOnHitStatus === 'WEAKENED'
              ) {
                if (rolled.appliedOnHitStatus === 'FROST') {
                  en.frostTurns = (en.frostTurns || 0) + 2;
                }
                en.attackBuffBonus = -2;
                en.attackBuffRounds = 2;
                appliedStatusEvents.push({
                  id: `ev_${ts}_wspec_ohw_${en.id}_${i}`,
                  kind: 'STATUS_APPLIED',
                  targetType: 'ENEMY',
                  targetId: en.id,
                  sourcePlayerId: player.id,
                  label: `+${stDef?.name || 'DEBILITADO'} (-2 ATQ)`,
                  sublabel: '2 RONDAS',
                  color: stDef?.visualTreatment.color || '#69A8A5',
                  statusType: rolled.appliedOnHitStatus,
                });
              }
            }
          }

          visualEvents.push({
            id: `ev_${ts}_wspec_${en.id}_${player.id}_${i}`,
            kind: rolled.isCrit ? 'CRIT_ENEMY' : 'DAMAGE_ENEMY',
            targetType: 'ENEMY',
            targetId: en.id,
            sourcePlayerId: player.id,
            value: -dmg,
            label: rolled.isCrit ? `¡CRÍTICO! -${dmg} PV` : `-${dmg} PV`,
            sublabel: `${spec.name.toUpperCase()} · ${dmgTypeMeta.shortLabel}${matchupNote}`,
            color:
              rolled.matchupState === 'WEAKNESS'
                ? '#68D391'
                : rolled.isCrit
                ? '#FFD166'
                : dmgTypeMeta.color,
            vfxStyle:
              spec.targetRule === 'CLEAVE_2' || spec.targetRule === 'ALL_ENEMIES'
                ? 'cleave'
                : classVfx,
            isCrit: rolled.isCrit,
          });
          visualEvents.push(...appliedStatusEvents);

          if (prevHp > 0 && en.hp <= 0) {
            this.handleEnemyKilledSideEffects(room, activeRoom, en, visualEvents, ts);
          }
        }

        // Generate Class Resource on Weapon Special (All 9 Classes)
        const maxResWep = charDef?.classResource?.maxValue || 5;
        if (player.characterId === 'barbaro') {
          player.classResource = Math.min(100, (player.classResource ?? 0) + 22);
        } else if (player.characterId === 'bardo') {
          player.classResource = Math.min(4, (player.classResource ?? 0) + 1);
        } else if (player.characterId === 'nigromante') {
          player.classResource = Math.min(6, (player.classResource ?? 0) + 1);
        } else {
          player.classResource = Math.min(maxResWep, (player.classResource ?? 0) + 1);
        }

        if (spec.shieldGrant && spec.shieldGrant > 0) {
          player.armor = Math.min(24, player.armor + spec.shieldGrant);
          applyStatusEffectToPlayer(player, 'SHIELDED', player.id, currentTurn, 2);
        }

        if (spec.partyHealBase && spec.partyHealBase > 0) {
          const pHeal = Math.round(spec.partyHealBase * healMult);
          for (const p of room.players) {
            if (!p.isDead && p.hp > 0) {
              p.hp = Math.min(p.maxHp, p.hp + pHeal);
              room.runStats.healingDone += pHeal;
              if (spec.purifyCount && spec.purifyCount > 0) {
                purifyPlayerDebuffs(p, spec.purifyCount);
              }
              visualEvents.push({
                id: `ev_${ts}_wspec_heal_${p.id}`,
                kind: 'HEAL_PLAYER',
                targetType: 'PLAYER',
                targetId: p.id,
                value: pHeal,
                label: `+${pHeal} PV`,
                sublabel: spec.name.toUpperCase(),
                color: '#5EA87A',
                vfxStyle: 'holy',
              });
            }
          }
        }

        logParts.push(
          `${player.name} ejecuta ${spec.name} (${eqWeapon.weapon.name}) sobre ${hitLogNames.join(', ')}.`
        );
      }
    } else if (action === 'DEFEND') {
      // Pure tactical defense: NEVER deals damage to enemies!
      player.isDefendingThisRound = true;
      player.passedLastRound = true; // Grants +18% Riposte damage on next offensive action
      player.threatScore = (player.threatScore || 0) + 6;
      const armorGain = Math.max(2, Math.min(4, Math.round(2 + defStat * 0.25)));
      const healAmt = Math.max(3, Math.round(5 * healMult));
      player.armor = Math.min(24, player.armor + armorGain);
      player.hp = Math.min(player.maxHp, player.hp + healAmt);
      room.runStats.healingDone += healAmt;
      applyStatusEffectToPlayer(player, 'SHIELDED', player.id, currentTurn, 2);

      // Class mechanic interaction on DEFEND (0 damage to enemies!)
      const maxResDef = charDef?.classResource?.maxValue || 5;
      if (player.characterId === 'caballero') {
        player.classResource = Math.min(maxResDef, (player.classResource ?? 0) + 2);
        player.tauntTurnsRemaining = 1;
        const woundedAlly = room.players
          .filter((p) => p.id !== player.id && !p.isDead && p.hp > 0)
          .sort((a, b) => a.hp / Math.max(1, a.maxHp) - b.hp / Math.max(1, b.maxHp))[0];
        if (woundedAlly) {
          woundedAlly.protectedByPlayerId = player.id;
        }
      } else if (player.characterId === 'mago') {
        // Mago venting 1 Carga Arcana into extra shield when defending
        if ((player.classResource ?? 0) > 0) {
          player.classResource = Math.max(0, (player.classResource ?? 0) - 1);
          player.armor = Math.min(24, player.armor + 2);
        }
      } else if (player.characterId === 'barbaro') {
        player.classResource = Math.min(100, (player.classResource ?? 0) + 10);
      } else {
        player.classResource = Math.min(maxResDef, (player.classResource ?? 0) + 1);
      }

      visualEvents.push(
        {
          id: `ev_${ts}_def_${player.id}`,
          kind: 'SHIELD_PLAYER',
          targetType: 'PLAYER',
          targetId: player.id,
          sourcePlayerId: player.id,
          value: armorGain,
          label: `GUARDIA +${armorGain} ARMADURA`,
          sublabel: 'ESCUDO (2T) · +18% CONTRAGOLPE',
          color: '#69A8A5',
          statusType: 'SHIELDED',
          vfxStyle: 'shield',
        },
        {
          id: `ev_${ts}_def_heal_${player.id}`,
          kind: 'HEAL_PLAYER',
          targetType: 'PLAYER',
          targetId: player.id,
          value: healAmt,
          label: `+${healAmt} PV`,
          color: '#5EA87A',
          vfxStyle: 'heal',
        }
      );

      logParts.push(
        `${player.name} alza su Guardia de Hierro (+${armorGain} ARMADURA, ESCUDO 2T, +${healAmt} PV y prepara Contragolpe +18% daño).`
      );
    } else if (action === 'ABILITY') {
      const ability =
        charDef?.abilities.find((a) => a.id === queued.abilityId) ||
        charDef?.abilities[0] || {
          id: 'tecnica_clase',
          name: 'Técnica de Clase',
          type: 'ACTIVA' as const,
          kind: 'DAMAGE' as const,
          category: 'ATTACK' as const,
          dealsDamage: true,
          power: 14,
          cooldownTurns: 2,
          description: '',
        };

      if (!player.abilityCooldowns) player.abilityCooldowns = {};
      const cdReduction = player.equippedAccessoryId === 'reloj_de_arena_astral' ? 1 : 0;
      player.abilityCooldowns[ability.id] = Math.max(
        1,
        (ability.cooldownTurns || 2) - cdReduction
      );

      const abilityName = ability.name;
      const abilityDealsDamage =
        ability.dealsDamage ??
        (ability.kind === 'DAMAGE' ||
          ability.category === 'ATTACK' ||
          ability.category === 'DEBUFF');

      // CASE A: NON-DAMAGING DEFENSIVE / HEALING / BUFF ABILITIES (NEVER DAMAGE ENEMIES!)
      if (!abilityDealsDamage) {
        if (ability.id === 'grito_de_guerra') {
          if (!room.runStats) room.runStats = buildDefaultRunStats();
          room.runStats.supportActionsUsed += 1;
          const maxRes = charDef?.classResource?.maxValue || 100;
          player.classResource = Math.min(maxRes, (player.classResource ?? 0) + 25);

          for (const p of room.players) {
            if (!p.isDead && p.hp > 0) {
              p.bonusAttack = Math.min(12, (p.bonusAttack || 0) + 1);
              p.armor = Math.min(24, p.armor + 2);
              applyStatusEffectToPlayer(p, 'BLESSED', player.id, currentTurn, 2);
              visualEvents.push({
                id: `ev_${ts}_grito_${p.id}`,
                kind: 'STATUS_APPLIED',
                targetType: 'PLAYER',
                targetId: p.id,
                sourcePlayerId: player.id,
                label: '+1 ATAQUE · +2 DEFENSA · BENDICIÓN',
                sublabel: 'GRITO DE GUERRA',
                color: '#D85A4A',
                statusType: 'BLESSED',
              });
            }
          }
          visualEvents.push({
            id: `ev_${ts}_grito_furia_${player.id}`,
            kind: 'SHIELD_PLAYER',
            targetType: 'PLAYER',
            targetId: player.id,
            sourcePlayerId: player.id,
            value: 25,
            label: `+25 FURIA (${player.classResource}/100)`,
            sublabel: 'RUGIDO ANCESTRAL',
            color: '#FF5A36',
            vfxStyle: 'slash',
          });
          logParts.push(
            `¡${player.name} desata ${abilityName} (+25 FURIA, +1 ATAQUE, +2 ARMADURA y BENDICIÓN grupal)!`
          );
        } else if (ability.id === 'himno_del_alba_astral') {
          if (!room.runStats) room.runStats = buildDefaultRunStats();
          room.runStats.supportActionsUsed += 1;
          const currCompas = player.classResource ?? 2;
          const isCrescendo = currCompas >= 5;
          player.classResource = Math.max(0, currCompas - 2);
          const baseHeal = (ability.healAmount || 16) + (isCrescendo ? 10 : 0);
          const healAmt = Math.round((baseHeal + magStat * 1.1 + effStats.willpower * 0.8) * healMult);
          const armorGrant = (ability.shieldGrant || 2) + (isCrescendo ? 2 : 0) + Math.floor(effStats.willpower / 4);

          for (const p of room.players) {
            if (!p.isDead && p.hp > 0) {
              p.hp = Math.min(p.maxHp, p.hp + healAmt);
              room.runStats.healingDone += healAmt;
              player.recentHealingDone = (player.recentHealingDone || 0) + healAmt;
              p.armor = Math.min(24, p.armor + armorGrant);
              purifyPlayerDebuffs(p, isCrescendo ? 2 : 1);
              applyStatusEffectToPlayer(p, 'BLESSED', player.id, currentTurn, isCrescendo ? 3 : 2);
              if (isCrescendo) {
                applyStatusEffectToPlayer(p, 'REGENERATION', player.id, currentTurn, 2);
              }
              visualEvents.push({
                id: `ev_${ts}_bardo_himno_${p.id}`,
                kind: 'HEAL_PLAYER',
                targetType: 'PLAYER',
                targetId: p.id,
                value: healAmt,
                label: `+${healAmt} PV · +${armorGrant} ARM`,
                sublabel: isCrescendo ? '¡CRESCENDO ASTRAL! +BENDICIÓN +REGEN' : 'HIMNO DEL ALBA +BENDICIÓN',
                color: '#5EC2B7',
                statusType: 'BLESSED',
                vfxStyle: 'holy',
              });
            }
          }
          player.threatScore = (player.threatScore || 0) + 14;
          logParts.push(
            `¡${player.name} interpreta ${abilityName}${isCrescendo ? ' en CRESCENDO PERFECTO' : ''}: restaura +${healAmt} PV, otorga +${armorGrant} ARMADURA, purifica y bendice a la expedición!`
          );
        } else if (ability.id === 'muro_de_hierro' || ability.category === 'DEFEND') {
          player.classResource = Math.min(5, (player.classResource ?? 0) + 2);
          player.tauntTurnsRemaining = 2;
          player.isDefendingThisRound = true;
          player.threatScore = (player.threatScore || 0) + 24;
          const shieldAmt =
            (ability.shieldGrant || 3) +
            Math.floor(effStats.willpower / 5) +
            Math.floor((player.classResource || 0) * 0.8);
          const woundedAlly = room.players
            .filter((p) => p.id !== player.id && !p.isDead && p.hp > 0)
            .sort((a, b) => a.hp / Math.max(1, a.maxHp) - b.hp / Math.max(1, b.maxHp))[0];
          if (woundedAlly) {
            woundedAlly.protectedByPlayerId = player.id;
          }
          for (const p of room.players) {
            if (!p.isDead && p.hp > 0) {
              p.armor = Math.min(24, p.armor + shieldAmt);
              applyStatusEffectToPlayer(p, 'SHIELDED', player.id, currentTurn, 2);
              visualEvents.push({
                id: `ev_${ts}_cab_muro_${p.id}`,
                kind: 'SHIELD_PLAYER',
                targetType: 'PLAYER',
                targetId: p.id,
                value: shieldAmt,
                label: `+${shieldAmt} ARMADURA`,
                sublabel: p.id === player.id ? 'MURO DE HIERRO · PROVOCACIÓN' : 'PROTEGIDO · ESCUDO (2T)',
                color: '#69A8A5',
                statusType: 'SHIELDED',
                vfxStyle: 'shield',
              });
            }
          }
          logParts.push(
            `${player.name} alza ${abilityName}: provoca a los enemigos, intercepta golpes y otorga +${shieldAmt} ARMADURA y ESCUDO al grupo.`
          );
        } else if (ability.id === 'velo_de_espejos' || ability.id === 'convergencia_astral') {
          // Mago safe discharge of Carga Arcana into group shield & blessing (0 damage)
          const discharged = player.classResource ?? 0;
          player.classResource = 0;
          const shieldGrant = 5 + discharged * 2;
          for (const p of room.players) {
            if (!p.isDead && p.hp > 0) {
              p.armor = Math.min(24, p.armor + shieldGrant);
              applyStatusEffectToPlayer(p, 'BLESSED', player.id, currentTurn, 2);
              visualEvents.push({
                id: `ev_${ts}_mago_conv_${p.id}`,
                kind: 'SHIELD_PLAYER',
                targetType: 'PLAYER',
                targetId: p.id,
                value: shieldGrant,
                label: `+${shieldGrant} ARMADURA · BENDECIDO`,
                sublabel: discharged > 0 ? `CONVERGENCIA (${discharged} CARGAS)` : 'CONVERGENCIA ASTRAL',
                color: '#9B72CF',
                statusType: 'BLESSED',
                vfxStyle: 'arcane',
              });
            }
          }
          logParts.push(
            `${player.name} disipa ${discharged} Carga Arcana con ${abilityName}, otorgando +${shieldGrant} ARMADURA y BENDECIDO al grupo.`
          );
        } else if (ability.id === 'ganzua_maestra') {
          // Pícaro Velo de Humo y Apertura: +2 COMBO, +Escudo, +Veneno a enemigos (0 daño directo)
          player.classResource = Math.min(3, (player.classResource ?? 0) + 2);
          player.armor = Math.min(24, player.armor + 5);
          applyStatusEffectToPlayer(player, 'SHIELDED', player.id, currentTurn, 2);
          applyStatusEffectToPlayer(player, 'BLESSED', player.id, currentTurn, 2);
          for (const en of livingEnemies) {
            en.poisonStacks = (en.poisonStacks || 0) + 2;
          }
          visualEvents.push({
            id: `ev_${ts}_pic_smoke_${player.id}`,
            kind: 'SHIELD_PLAYER',
            targetType: 'PLAYER',
            targetId: player.id,
            value: 5,
            label: `+2 COMBO (${player.classResource}/3) · +5 ARM`,
            sublabel: 'VELO DE HUMO · +2 VENENO ENEMIGO',
            color: '#48C78E',
            statusType: 'SHIELDED',
            vfxStyle: 'shield',
          });
          logParts.push(
            `${player.name} despliega ${abilityName}: gana +2 COMBO, +5 ARMADURA y envenena a los enemigos.`
          );
        } else if (ability.id === 'pacto_de_ceniza') {
          // Nigromante Pacto de Hueso y Ceniza: sacrifica 4 PV, gana +3 ESENCIA, +6 Escudo grupal y Maldición
          const sacCost = Math.min(4, Math.max(0, player.hp - 1));
          player.hp = Math.max(1, player.hp - sacCost);
          player.classResource = Math.min(6, (player.classResource ?? 0) + 3);
          for (const p of room.players) {
            if (!p.isDead && p.hp > 0) {
              p.armor = Math.min(24, p.armor + 6);
              applyStatusEffectToPlayer(p, 'SHIELDED', player.id, currentTurn, 2);
            }
          }
          for (const en of livingEnemies) {
            en.curseTurns = (en.curseTurns || 0) + 2;
            en.vulnerableTurns = (en.vulnerableTurns || 0) + 2;
          }
          visualEvents.push({
            id: `ev_${ts}_nig_pact_${player.id}`,
            kind: 'SHIELD_PLAYER',
            targetType: 'PLAYER',
            targetId: player.id,
            value: 6,
            label: `+3 ESENCIA (${player.classResource}/6) · +6 ARM ÓSEA`,
            sublabel: `PACTO DE SANGRE (-${sacCost} PV) · MALDICE ENEMIGOS`,
            color: '#9B72CF',
            statusType: 'SHIELDED',
            vfxStyle: 'arcane',
          });
          logParts.push(
            `${player.name} sella ${abilityName} (-${sacCost} PV): cosecha +3 ESENCIA, otorga +6 ARMADURA ÓSEA al grupo y maldice a los enemigos.`
          );
        } else if (ability.id === 'elixir_transmutado' || ability.id === 'destilado_vital') {
          player.classResource = Math.min(3, (player.classResource ?? 0) + 2);
          const baseHeal = ability.healAmount || ability.power || 15;
          const healAmt = Math.round((baseHeal + magStat * 0.9 + effStats.willpower * 0.7) * healMult);
          const extraPurify = playerHasRelic(
            player,
            room.partyRelics || [],
            'guantes_del_boticario'
          )
            ? 1
            : 0;
          for (const p of room.players) {
            if (!p.isDead && p.hp > 0) {
              p.hp = Math.min(p.maxHp, p.hp + healAmt);
              room.runStats.healingDone += healAmt;
              player.recentHealingDone = (player.recentHealingDone || 0) + healAmt;
              const removed = purifyPlayerDebuffs(p, (ability.purifyCount || 2) + extraPurify);
              applyStatusEffectToPlayer(p, 'REGENERATION', player.id, currentTurn, 2);
              if (ability.shieldGrant) {
                p.armor = Math.min(24, p.armor + ability.shieldGrant);
              }
              visualEvents.push({
                id: `ev_${ts}_alq_elix_${p.id}`,
                kind: 'HEAL_PLAYER',
                targetType: 'PLAYER',
                targetId: p.id,
                value: healAmt,
                label: `+${healAmt} PV`,
                sublabel:
                  removed.length > 0
                    ? `PURIFICADO (${removed.length}) + REGEN`
                    : '+REGENERACIÓN (2T)',
                color: '#5EA87A',
                statusType: 'REGENERATION',
                vfxStyle: 'alchemy',
              });
            }
          }
          player.threatScore = (player.threatScore || 0) + 14;
          logParts.push(
            `${player.name} destila ${abilityName}: restaura +${healAmt} PV al grupo, purifica aflicciones y aplica REGENERACIÓN.`
          );
        } else {
          // Luz del Relicario / Balada del Valor or any pure healing/blessing ability
          if (player.characterId === 'clerigo') {
            player.classResource = Math.min(5, (player.classResource ?? 0) + 2);
          } else if (player.characterId === 'bardo') {
            player.classResource = Math.min(4, (player.classResource ?? 0) + 1);
          }
          const baseHeal = ability.healAmount || ability.power || 18;
          const fervorBonus = player.characterId === 'clerigo' ? 1 + (player.classResource || 0) * 0.08 : 1;
          const healAmt = Math.round((baseHeal + magStat * 1.1 + effStats.willpower * 0.8) * healMult * fervorBonus);
          for (const p of room.players) {
            if (!p.isDead && p.hp > 0) {
              p.hp = Math.min(p.maxHp, p.hp + healAmt);
              room.runStats.healingDone += healAmt;
              player.recentHealingDone = (player.recentHealingDone || 0) + healAmt;
              const removed = purifyPlayerDebuffs(p, ability.purifyCount || 1);
              applyStatusEffectToPlayer(p, 'BLESSED', player.id, currentTurn, 2);
              visualEvents.push({
                id: `ev_${ts}_cler_luz_${p.id}`,
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
          player.threatScore = (player.threatScore || 0) + 16;
          logParts.push(
            `${player.name} invoca ${abilityName}: restaura +${healAmt} PV a los aliados vivos, purifica 1 aflicción y otorga BENDECIDO.`
          );
        }
      } else {
        // CASE B: OFFENSIVE / TACTICAL DEBUFF CLASS ABILITIES
        // Consume or generate class resources for all 9 classes
        const maxRes = charDef?.classResource?.maxValue || 5;
        const currRes = player.classResource ?? (charDef?.classResource?.initialValue || 0);
        let consumedFullResource = false;

        if (ability.id === 'quebrantahuesos') {
          consumedFullResource = currRes >= 75;
          player.classResource = Math.max(0, currRes - 50);
          const selfHeal = Math.min(18, Math.max(6, Math.round((player.maxHp - player.hp) * 0.28)));
          if (selfHeal > 0 && player.hp < player.maxHp) {
            player.hp = Math.min(player.maxHp, player.hp + selfHeal);
            visualEvents.push({
              id: `ev_${ts}_queb_self_${player.id}`,
              kind: 'HEAL_PLAYER',
              targetType: 'PLAYER',
              targetId: player.id,
              sourcePlayerId: player.id,
              value: selfHeal,
              label: `+${selfHeal} PV (SED DE BATALLA)`,
              color: '#D85A4A',
              vfxStyle: 'heal',
            });
          }
        } else if (ability.id === 'hachazo_brutal') {
          player.classResource = Math.min(100, currRes + 25);
        } else if (ability.id === 'tajo_de_antorcha' || ability.id === 'embate_de_paves') {
          consumedFullResource = currRes >= 3;
          player.classResource = 0;
        } else if (ability.id === 'llama_sepulcral' || ability.id === 'descarga_arcana') {
          const nextCharge = Math.min(5, currRes + 2);
          player.classResource = nextCharge;
          if (nextCharge >= 5) {
            consumedFullResource = true;
            // Sobrecarga Arcana: +35% power, slight 2 HP arcane recoil
            player.hp = Math.max(1, player.hp - 2);
          }
        } else if (ability.id === 'filo_artero' || ability.id === 'ejecucion_carmesi') {
          consumedFullResource = currRes >= 3;
          player.classResource = 0;
        } else if (ability.id === 'marca_de_presa') {
          player.classResource = Math.min(3, currRes + 2);
        } else if (ability.id === 'virote_de_plata' || ability.id === 'tiro_perforante') {
          consumedFullResource = currRes >= 3;
          player.classResource = 0;
        } else if (ability.id === 'plegaria_de_ceniza' || ability.id === 'juicio_del_alba') {
          consumedFullResource = currRes >= 3;
          player.classResource = 0;
        } else if (ability.id === 'frasco_corrosivo' || ability.id === 'reaccion_en_cadena') {
          consumedFullResource = currRes >= 2;
          player.classResource = currRes > 0 ? 0 : 1;
        } else if (ability.id === 'acorde_disonante') {
          player.classResource = Math.min(4, currRes + 1);
        } else if (ability.id === 'coda_del_eclipse') {
          consumedFullResource = currRes >= 3;
          player.classResource = 0;
        } else if (ability.id === 'drenaje_umbrio' || ability.id === 'cosecha_de_almas') {
          player.classResource = Math.min(6, currRes + 2);
        } else if (ability.id === 'explosion_cadaverica' || ability.id === 'explosion_osea') {
          consumedFullResource = currRes >= 4;
          player.classResource = 0;
        }

        let hitTargets: CriptaRoomEnemy[] = [target];
        if (ability.targetRule === 'ALL_ENEMIES') {
          hitTargets = [...livingEnemies];
        } else if (ability.targetRule === 'CLEAVE_2' || ability.targetRule === 'CHAIN_2') {
          const secondary = livingEnemies.find((e) => e.id !== target.id && e.hp > 0);
          if (secondary) hitTargets.push(secondary);
        }

        const hitSummaries: string[] = [];
        for (let i = 0; i < hitTargets.length; i++) {
          const en = hitTargets[i];
          if (!en || en.hp <= 0) continue;

          const rolledAb = rollAuthoritativePlayerDamage(
            player,
            'ABILITY',
            en,
            currentTurn + i,
            room.partyRelics || [],
            i > 0 && (ability.targetRule === 'CHAIN_2' || ability.targetRule === 'CLEAVE_2'),
            ability.id
          );
          let dmg = Math.max(4, Math.round(rolledAb.damage * dmgMultiplier));
          if (ability.id === 'quebrantahuesos' && consumedFullResource) {
            dmg = Math.round(dmg * 1.25);
          } else if (ability.id === 'explosion_osea' && consumedFullResource) {
            dmg = Math.round(dmg * 1.3);
          }
          const abIsCrit = rolledAb.isCrit || isCrit;
          const prevTargetHp = en.hp;
          en.hp = Math.max(0, en.hp - dmg);
          room.runStats.damageDealt += dmg;
          recordPlayerDamageAndThreat(en, dmg);
          hitSummaries.push(`${en.name} (-${dmg} PV)`);

          const appliedAbStatusEvents: CriptaVisualEvent[] = [];
          if (en.hp > 0) {
            if (ability.armorBreak && ability.armorBreak > 0) {
              en.armor = Math.max(0, en.armor - ability.armorBreak);
              appliedAbStatusEvents.push({
                id: `ev_${ts}_ab_abrk_${en.id}_${i}`,
                kind: 'STATUS_APPLIED',
                targetType: 'ENEMY',
                targetId: en.id,
                sourcePlayerId: player.id,
                label: `-${ability.armorBreak} ARMADURA`,
                sublabel: abilityName.toUpperCase(),
                color: '#E7A54A',
                statusType: 'VULNERABLE',
              });
            }
            // Embate de Escudo or Quebrantahuesos interrupts enemy telegraphed heavy attack!
            if (
              (ability.id === 'embate_de_escudo' || ability.id === 'quebrantahuesos') &&
              en.memory?.preparedAbilityId
            ) {
              en.memory.preparedAbilityId = null;
              en.preparedTelegraphLabel = undefined;
              en.intent = 'ATAQUE';
              en.intentCategory = 'ATTACK';
              logParts.push(`¡${player.name} INTERRUMPE el ataque cargado de ${en.name}!`);
              appliedAbStatusEvents.push({
                id: `ev_${ts}_ab_int_${en.id}_${i}`,
                kind: 'STATUS_APPLIED',
                targetType: 'ENEMY',
                targetId: en.id,
                sourcePlayerId: player.id,
                label: '¡ATAQUE INTERRUMPIDO!',
                sublabel: abilityName.toUpperCase(),
                color: '#FFD166',
                statusType: 'WEAKENED',
              });
            }
            if (ability.id === 'acorde_disonante') {
              en.attackBuffBonus = -2;
              en.attackBuffRounds = 2;
            }
            if (ability.statusToApply) {
              const stDef = CRIPTA_STATUS_EFFECTS_REGISTRY[ability.statusToApply];
              if (
                ability.statusToApply === 'POISON' ||
                ability.statusToApply === 'BLEED' ||
                ability.statusToApply === 'BURN' ||
                ability.statusToApply === 'CORROSION'
              ) {
                const baseStacks =
                  ability.statusStacks ||
                  (ability.id === 'hoja_envenenada' || ability.id === 'bomba_corrosiva' ? 2 : 2);
                const extraStacks = playerHasRelic(
                  player,
                  room.partyRelics || [],
                  'guantes_del_boticario'
                )
                  ? 1
                  : 0;
                const addedStacks = baseStacks + extraStacks + (consumedFullResource ? 1 : 0);
                if (ability.statusToApply === 'BLEED') {
                  en.bleedStacks = (en.bleedStacks || 0) + addedStacks;
                } else if (ability.statusToApply === 'BURN') {
                  en.burnStacks = (en.burnStacks || 0) + addedStacks;
                } else if (ability.statusToApply === 'CORROSION') {
                  en.corrosionTurns = (en.corrosionTurns || 0) + addedStacks;
                  en.poisonStacks = (en.poisonStacks || 0) + 2;
                } else {
                  en.poisonStacks = (en.poisonStacks || 0) + addedStacks;
                }
                appliedAbStatusEvents.push({
                  id: `ev_${ts}_ab_st_${en.id}_${i}`,
                  kind: 'STATUS_APPLIED',
                  targetType: 'ENEMY',
                  targetId: en.id,
                  sourcePlayerId: player.id,
                  label: `+${stDef?.name || 'ESTADO'} (${addedStacks})`,
                  sublabel: abilityName.toUpperCase(),
                  color: stDef?.visualTreatment.color || '#5EA87A',
                  statusType: ability.statusToApply,
                });
              } else if (
                ability.statusToApply === 'MARKED' ||
                ability.statusToApply === 'CURSE' ||
                ability.statusToApply === 'VULNERABLE'
              ) {
                const turnsAdded = (ability.statusTurns || ability.statusStacks || 2) + (consumedFullResource ? 1 : 0);
                if (ability.statusToApply === 'MARKED') {
                  en.markedTurns = (en.markedTurns || 0) + turnsAdded;
                } else if (ability.statusToApply === 'CURSE') {
                  en.curseTurns = (en.curseTurns || 0) + turnsAdded;
                }
                en.vulnerableTurns = (en.vulnerableTurns || 0) + turnsAdded;
                appliedAbStatusEvents.push({
                  id: `ev_${ts}_ab_st_${en.id}_${i}`,
                  kind: 'STATUS_APPLIED',
                  targetType: 'ENEMY',
                  targetId: en.id,
                  sourcePlayerId: player.id,
                  label: `+${stDef?.name || 'MARCADO'} (${turnsAdded}T)`,
                  sublabel: '+25% DAÑO RECIBIDO',
                  color: stDef?.visualTreatment.color || '#E7A54A',
                  statusType: ability.statusToApply,
                });
              } else if (
                ability.statusToApply === 'WEAKENED' ||
                ability.statusToApply === 'FROST' ||
                ability.statusToApply === 'BLINDED'
              ) {
                const turnsAdded = ability.statusTurns || ability.statusStacks || 2;
                if (ability.statusToApply === 'FROST') {
                  en.frostTurns = (en.frostTurns || 0) + turnsAdded;
                }
                en.attackBuffBonus = -2;
                en.attackBuffRounds = turnsAdded;
                appliedAbStatusEvents.push({
                  id: `ev_${ts}_ab_st_${en.id}_${i}`,
                  kind: 'STATUS_APPLIED',
                  targetType: 'ENEMY',
                  targetId: en.id,
                  sourcePlayerId: player.id,
                  label: `+${stDef?.name || 'DEBILITADO'} (-2 ATQ)`,
                  sublabel: `${turnsAdded} RONDAS`,
                  color: stDef?.visualTreatment.color || '#69A8A5',
                  statusType: ability.statusToApply,
                });
              }
            }
          }

          visualEvents.push({
            id: `ev_${ts}_ab_${en.id}_${player.id}_${i}`,
            kind: abIsCrit ? 'CRIT_ENEMY' : 'DAMAGE_ENEMY',
            targetType: 'ENEMY',
            targetId: en.id,
            sourcePlayerId: player.id,
            value: -dmg,
            label: abIsCrit ? `¡CRÍTICO! -${dmg} PV` : `-${dmg} PV`,
            sublabel: abilityName.toUpperCase(),
            color: abIsCrit ? '#E7A54A' : '#9B72CF',
            vfxStyle: classVfx,
            isCrit: abIsCrit,
          });
          visualEvents.push(...appliedAbStatusEvents);

          if (prevTargetHp > 0 && en.hp <= 0) {
            this.handleEnemyKilledSideEffects(room, activeRoom, en, visualEvents, ts);
          }
        }

        if (ability.shieldGrant && ability.shieldGrant > 0) {
          player.armor = Math.min(24, player.armor + ability.shieldGrant);
          applyStatusEffectToPlayer(player, 'SHIELDED', player.id, currentTurn, 2);
        }

        if (ability.healsSelfOrParty && ability.healAmount) {
          const splashHeal = Math.round(ability.healAmount * healMult);
          for (const p of room.players) {
            if (!p.isDead && p.hp > 0) {
              p.hp = Math.min(p.maxHp, p.hp + splashHeal);
              room.runStats.healingDone += splashHeal;
              visualEvents.push({
                id: `ev_${ts}_ab_heal_${p.id}`,
                kind: 'HEAL_PLAYER',
                targetType: 'PLAYER',
                targetId: p.id,
                value: splashHeal,
                label: `+${splashHeal} PV`,
                sublabel: abilityName.toUpperCase(),
                color: '#5EA87A',
                vfxStyle: 'holy',
              });
            }
          }
        }

        logParts.push(
          `${player.name} ejecuta ${abilityName} sobre ${hitSummaries.join(', ')}.`
        );
      }
    } else {
      // Standard ATTACK (1 per turn per player to prevent mindless basic attack spam)
      player.basicAttackUsedThisTurn = true;
      const rolledAtk = rollAuthoritativePlayerDamage(
        player,
        'ATTACK',
        target,
        currentTurn,
        room.partyRelics || []
      );
      let dmg = Math.max(2, Math.round(rolledAtk.damage * (player.passedLastRound ? 1.15 : 1)));
      if (
        eqWeapon.activeRune?.executeBonusPctVsHalfHp &&
        target.hp <= target.maxHp * 0.5
      ) {
        dmg = Math.round(dmg * (1 + eqWeapon.activeRune.executeBonusPctVsHalfHp / 100));
      }
      const atkIsCrit = rolledAtk.isCrit || isCrit;
      const prevTargetHp = target.hp;
      target.hp = Math.max(0, target.hp - dmg);
      room.runStats.damageDealt += dmg;
      recordPlayerDamageAndThreat(target, dmg);

      const dmgTypeMeta =
        CRIPTA_DAMAGE_TYPE_META[rolledAtk.damageType] || CRIPTA_DAMAGE_TYPE_META.FISICO;
      const matchupNote =
        rolledAtk.matchupState === 'WEAKNESS'
          ? ` · ¡VULNERABLE A ${dmgTypeMeta.shortLabel}!`
          : rolledAtk.matchupState === 'RESISTANCE'
          ? ` · RESISTE ${dmgTypeMeta.shortLabel}`
          : '';

      const appliedAtkStatusEvents: CriptaVisualEvent[] = [];
      if (target.hp > 0) {
        if (eqWeapon.activeRune?.extraPoisonStacksOnHit) {
          const runeStacks = eqWeapon.activeRune.extraPoisonStacksOnHit;
          target.poisonStacks = (target.poisonStacks || 0) + runeStacks;
          appliedAtkStatusEvents.push({
            id: `ev_${ts}_atk_rpois_${target.id}`,
            kind: 'STATUS_APPLIED',
            targetType: 'ENEMY',
            targetId: target.id,
            sourcePlayerId: player.id,
            label: `+VENENO (${runeStacks})`,
            sublabel: eqWeapon.activeRune.name.toUpperCase(),
            color: '#5EA87A',
            statusType: 'POISON',
          });
        }
        if (rolledAtk.appliedOnHitStatus) {
          const stDef = CRIPTA_STATUS_EFFECTS_REGISTRY[rolledAtk.appliedOnHitStatus];
          if (
            rolledAtk.appliedOnHitStatus === 'POISON' ||
            rolledAtk.appliedOnHitStatus === 'BLEED' ||
            rolledAtk.appliedOnHitStatus === 'BURN'
          ) {
            if (rolledAtk.appliedOnHitStatus === 'BLEED') {
              target.bleedStacks = (target.bleedStacks || 0) + 1;
            } else if (rolledAtk.appliedOnHitStatus === 'BURN') {
              target.burnStacks = (target.burnStacks || 0) + 1;
            } else {
              target.poisonStacks = (target.poisonStacks || 0) + 1;
            }
            appliedAtkStatusEvents.push({
              id: `ev_${ts}_atk_ohs_${target.id}`,
              kind: 'STATUS_APPLIED',
              targetType: 'ENEMY',
              targetId: target.id,
              sourcePlayerId: player.id,
              label: `+${stDef?.name || 'VENENO'} (1)`,
              sublabel: eqWeapon.weapon.name.toUpperCase(),
              color: stDef?.visualTreatment.color || '#5EA87A',
              statusType: rolledAtk.appliedOnHitStatus,
            });
          } else if (
            rolledAtk.appliedOnHitStatus === 'CURSE' ||
            rolledAtk.appliedOnHitStatus === 'MARKED'
          ) {
            if (rolledAtk.appliedOnHitStatus === 'CURSE') {
              target.curseTurns = (target.curseTurns || 0) + 2;
            } else {
              target.markedTurns = (target.markedTurns || 0) + 2;
            }
            target.vulnerableTurns = (target.vulnerableTurns || 0) + 2;
            appliedAtkStatusEvents.push({
              id: `ev_${ts}_atk_ohv_${target.id}`,
              kind: 'STATUS_APPLIED',
              targetType: 'ENEMY',
              targetId: target.id,
              sourcePlayerId: player.id,
              label: `+${stDef?.name || 'MARCADO'} (2T)`,
              sublabel: '+20% DAÑO RECIBIDO',
              color: stDef?.visualTreatment.color || '#E7A54A',
              statusType: rolledAtk.appliedOnHitStatus,
            });
          } else if (
            rolledAtk.appliedOnHitStatus === 'FROST' ||
            rolledAtk.appliedOnHitStatus === 'BLINDED' ||
            rolledAtk.appliedOnHitStatus === 'WEAKENED'
          ) {
            if (rolledAtk.appliedOnHitStatus === 'FROST') {
              target.frostTurns = (target.frostTurns || 0) + 2;
            }
            target.attackBuffBonus = -2;
            target.attackBuffRounds = 2;
            appliedAtkStatusEvents.push({
              id: `ev_${ts}_atk_ohw_${target.id}`,
              kind: 'STATUS_APPLIED',
              targetType: 'ENEMY',
              targetId: target.id,
              sourcePlayerId: player.id,
              label: `+${stDef?.name || 'DEBILITADO'} (-2 ATQ)`,
              sublabel: '2 RONDAS',
              color: stDef?.visualTreatment.color || '#69A8A5',
              statusType: rolledAtk.appliedOnHitStatus,
            });
          }
        }
      }

      // Weapon Rune Vampiric / Self-Recoil mechanics (e.g. Runa de Filo Vampírico)
      if (eqWeapon.activeRune?.selfRecoilHpOnAttack) {
        const recoil = eqWeapon.activeRune.selfRecoilHpOnAttack;
        player.hp = Math.max(1, player.hp - recoil);
      }
      if (eqWeapon.activeRune?.onHitDrainHp) {
        const drainAmt = Math.max(1, Math.round(eqWeapon.activeRune.onHitDrainHp * healMult));
        player.hp = Math.min(player.maxHp, player.hp + drainAmt);
        room.runStats.healingDone += drainAmt;
        visualEvents.push({
          id: `ev_${ts}_rune_drain_${player.id}`,
          kind: 'HEAL_PLAYER',
          targetType: 'PLAYER',
          targetId: player.id,
          value: drainAmt,
          label: `+${drainAmt} PV (FILO VAMPÍRICO)`,
          color: '#E03E52',
          vfxStyle: 'heal',
        });
      }

      visualEvents.push({
        id: `ev_${ts}_atk_${target.id}_${player.id}`,
        kind: atkIsCrit ? 'CRIT_ENEMY' : 'DAMAGE_ENEMY',
        targetType: 'ENEMY',
        targetId: target.id,
        sourcePlayerId: player.id,
        value: -dmg,
        label: atkIsCrit ? `¡CRÍTICO! -${dmg} PV` : `-${dmg} PV`,
        sublabel: `${eqWeapon.weapon.name.toUpperCase()} · ${dmgTypeMeta.shortLabel}${matchupNote}`,
        color:
          rolledAtk.matchupState === 'WEAKNESS'
            ? '#68D391'
            : atkIsCrit
            ? '#E7A54A'
            : dmgTypeMeta.color,
        vfxStyle: classVfx,
        isCrit: atkIsCrit,
      });
      visualEvents.push(...appliedAtkStatusEvents);

      if (prevTargetHp > 0 && target.hp <= 0) {
        this.handleEnemyKilledSideEffects(room, activeRoom, target, visualEvents, ts);
      }

      // Generate Class Resource on Basic Attack (All 9 Classes)
      const maxResAtk = charDef?.classResource?.maxValue || 5;
      if (player.characterId === 'barbaro') {
        player.classResource = Math.min(100, (player.classResource ?? 0) + (atkIsCrit ? 26 : 18));
      } else if (player.characterId === 'bardo') {
        player.classResource = Math.min(4, (player.classResource ?? 0) + 1);
      } else if (player.characterId === 'nigromante') {
        player.classResource = Math.min(6, (player.classResource ?? 0) + 1);
      } else if (player.characterId === 'picaro') {
        const hasBleedOrPoison = (target.bleedStacks || 0) > 0 || (target.poisonStacks || 0) > 0;
        player.classResource = Math.min(3, (player.classResource ?? 0) + (hasBleedOrPoison ? 2 : 1));
      } else {
        player.classResource = Math.min(maxResAtk, (player.classResource ?? 0) + 1);
      }

      if (playerHasRelic(player, room.partyRelics || [], 'espina_viva') && target.hp > 0) {
        target.poisonStacks = (target.poisonStacks || 0) + 1;
        const prevHp = target.hp;
        target.hp = Math.max(0, target.hp - 6);
        room.runStats.damageDealt += 6;
        visualEvents.push({
          id: `ev_${ts}_thorn_atk_${target.id}_${player.id}`,
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
        `${player.name} ataca con ${eqWeapon.weapon.name} a ${target.name} (${atkIsCrit ? '¡CRÍTICO! ' : ''}-${dmg} PV).`
      );
    }

    const victoryOrPhase2 = this.checkAndResolveCombatVictoryIfCleared(
      room,
      activeRoom,
      player,
      logParts,
      visualEvents,
      ts
    );

    if (!victoryOrPhase2) {
      activeRoom.outcomeLog = logParts.join(' ');
    }

    this.emitVisualEventBatch(room, visualEvents, player.id, action);
    return victoryOrPhase2;
  }

  private executeSingleEnemyTacticalAction(
    room: ServerCriptaRoom,
    activeRoom: CriptaDungeonRoom,
    enemy: CriptaRoomEnemy,
    alreadyTargetedThisRoundCounts: Record<string, number>,
    currentRound: number,
    enemyStepIndex: number
  ) {
    const decision = chooseEnemyTacticalAction(
      enemy,
      activeRoom,
      room.players,
      alreadyTargetedThisRoundCounts,
      room.dungeonSeed || room.seed,
      currentRound,
      enemyStepIndex
    );

    if (!decision) return;

    const { ability, actionKind, targetPlayers, targetAllyEnemy } = decision;
    const visualEvents: CriptaVisualEvent[] = [];
    const logParts: string[] = [];
    const ts = Date.now();

    // Progressive Enemy Knowledge (Section 7): once an enemy executes an ability, mark it discovered!
    if (!room.discoveredEnemyAbilityIds) {
      room.discoveredEnemyAbilityIds = [];
    }
    if (ability.id && !room.discoveredEnemyAbilityIds.includes(ability.id)) {
      room.discoveredEnemyAbilityIds.push(ability.id);
    }

    activeRoom.activeTargetedPlayerIds = targetPlayers.map((p) => p.id);
    activeRoom.combatBannerText = `FASE ENEMIGA — ${enemy.name.toUpperCase()} · ${ability.name.toUpperCase()}`;

    // Track multi-enemy target distribution for anti-focus-fire fairness
    for (const tp of targetPlayers) {
      alreadyTargetedThisRoundCounts[tp.id] =
        (alreadyTargetedThisRoundCounts[tp.id] || 0) + 1;
    }

    // 1. HEAL_SELF or HEAL_ALLY (Strict cap & Cortacuras counterplay)
    if (actionKind === 'HEAL_SELF' || actionKind === 'HEAL_ALLY') {
      const healTarget = targetAllyEnemy || enemy;
      enemy.totalHealsUsedThisCombat = (enemy.totalHealsUsedThisCombat || 0) + 1;
      if (enemy.memory) {
        enemy.memory.abilityCooldowns[ability.id] = Math.max(3, ability.cooldownRounds || 3);
      }
      const pctHeal = Math.round(healTarget.maxHp * Math.min(0.18, ability.healPercentOfMax || 0.16));
      let rawHeal = Math.min(Math.round(healTarget.maxHp * 0.18), Math.max(ability.healAmount || 12, pctHeal));

      // Cortacuras: Poison or Vulnerability reduces enemy healing by 50%!
      const hasAntiHeal = (healTarget.poisonStacks || 0) > 0 || (healTarget.vulnerableTurns || 0) > 0;
      if (hasAntiHeal) {
        rawHeal = Math.max(3, Math.round(rawHeal * 0.5));
      }

      // Cap total HP healed across the entire combat to 35% of maxHp
      const maxTotalHealAllowed = Math.round(healTarget.maxHp * 0.35);
      const alreadyHealed = healTarget.totalHpHealedThisCombat || 0;
      const remainingHealBudget = Math.max(4, maxTotalHealAllowed - alreadyHealed);
      rawHeal = Math.min(rawHeal, remainingHealBudget);

      const beforeHp = healTarget.hp;
      healTarget.hp = Math.min(healTarget.maxHp, healTarget.hp + rawHeal);
      const actualHeal = Math.max(1, healTarget.hp - beforeHp);
      healTarget.totalHpHealedThisCombat = alreadyHealed + actualHeal;

      visualEvents.push(
        {
          id: `ev_${ts}_en_cast_${enemy.id}`,
          kind: 'ENEMY_ATTACK',
          targetType: 'ENEMY',
          targetId: enemy.id,
          label: ability.name.toUpperCase(),
          sublabel: healTarget.id === enemy.id ? 'AUTOCURACIÓN' : `CURA A ${healTarget.name.toUpperCase()}`,
          color: '#5EA87A',
          vfxStyle: 'alchemy',
        },
        {
          id: `ev_${ts}_en_heal_${healTarget.id}`,
          kind: 'HEAL_ENEMY',
          targetType: 'ENEMY',
          targetId: healTarget.id,
          value: actualHeal,
          label: `+${actualHeal} PV`,
          sublabel: ability.name.toUpperCase(),
          color: '#5EA87A',
          vfxStyle: 'heal',
        }
      );

      logParts.push(
        healTarget.id === enemy.id
          ? `¡${enemy.name} canaliza ${ability.name} y restaura +${actualHeal} PV!`
          : `¡${enemy.name} alza su báculo con ${ability.name} y cura a ${healTarget.name} (+${actualHeal} PV)!`
      );
      activeRoom.outcomeLog = logParts.join(' ');
      this.emitVisualEventBatch(room, visualEvents, enemy.id, 'ENEMY_HEAL');
      return;
    }

    // 2. DEFEND_SELF (Section 17 & 42)
    if (actionKind === 'DEFEND_SELF') {
      const armorGain = ability.armorBonus || 4;
      enemy.defendingRoundsRemaining = 1;
      enemy.armorBuffBonus = armorGain;
      enemy.armorBuffRounds = 1;

      visualEvents.push({
        id: `ev_${ts}_en_def_${enemy.id}`,
        kind: 'DEFEND_ENEMY',
        targetType: 'ENEMY',
        targetId: enemy.id,
        value: armorGain,
        label: `DEFENSA +${armorGain}`,
        sublabel: ability.name.toUpperCase(),
        color: '#69A8A5',
        vfxStyle: 'shield',
      });

      logParts.push(
        `¡${enemy.name} adopta ${ability.name} y refuerza su defensa (+${armorGain} ARMADURA por 1 ronda)!`
      );
      activeRoom.outcomeLog = logParts.join(' ');
      this.emitVisualEventBatch(room, visualEvents, enemy.id, 'ENEMY_DEFEND');
      return;
    }

    // 3. PROTECT_ALLY (Section 18, 19, 50: e.g. Guardián / Gólem protecting wounded ally or shaman)
    if (actionKind === 'PROTECT_ALLY') {
      const protectedAlly =
        targetAllyEnemy ||
        activeRoom.enemies.find((e) => e.hp > 0 && e.id !== enemy.id) ||
        enemy;
      if (protectedAlly.id !== enemy.id) {
        protectedAlly.protectedByEnemyId = enemy.id;
        if (!enemy.memory) enemy.memory = createInitialEnemyMemory();
        enemy.memory.protectedAllyId = protectedAlly.id;
      }
      const armorGain = ability.armorBonus || 3;
      enemy.defendingRoundsRemaining = 1;
      enemy.armorBuffBonus = armorGain;

      visualEvents.push({
        id: `ev_${ts}_en_prot_${protectedAlly.id}`,
        kind: 'PROTECT_ENEMY',
        targetType: 'ENEMY',
        targetId: protectedAlly.id,
        value: armorGain,
        label: `PROTEGIDO POR ${enemy.name.toUpperCase()}`,
        sublabel: ability.name.toUpperCase(),
        color: '#69A8A5',
        vfxStyle: 'shield',
      });

      logParts.push(
        `¡${enemy.name} usa ${ability.name} y se interpone para PROTEGER a ${protectedAlly.name}!`
      );
      activeRoom.outcomeLog = logParts.join(' ');
      this.emitVisualEventBatch(room, visualEvents, enemy.id, 'ENEMY_PROTECT');
      return;
    }

    // 4. BUFF_ALLY (Section 42: Commander / Support buffing allies)
    if (actionKind === 'BUFF_ALLY') {
      const livingAllies = activeRoom.enemies.filter((e) => e.hp > 0);
      const atkBonus = ability.attackBonus || 3;
      const armBonus = ability.armorBonus || 2;
      for (const ally of livingAllies) {
        ally.attackBuffBonus = atkBonus;
        ally.attackBuffRounds = 2;
        ally.armorBuffBonus = Math.max(ally.armorBuffBonus || 0, armBonus);
        ally.armorBuffRounds = 2;
        visualEvents.push({
          id: `ev_${ts}_en_buff_${ally.id}`,
          kind: 'BUFF_ENEMY',
          targetType: 'ENEMY',
          targetId: ally.id,
          value: atkBonus,
          label: `+${atkBonus} ATQ / +${armBonus} DEF`,
          sublabel: ability.name.toUpperCase(),
          color: '#E7A54A',
          vfxStyle: 'holy',
        });
      }
      logParts.push(
        `¡${enemy.name} entona ${ability.name} y potencia a las fuerzas enemigas (+${atkBonus} ATAQUE, +${armBonus} DEFENSA)!`
      );
      activeRoom.outcomeLog = logParts.join(' ');
      this.emitVisualEventBatch(room, visualEvents, enemy.id, 'ENEMY_BUFF');
      return;
    }

    // 5. PREPARE_ATTACK (Section 41: Telegraphed heavy attack preparation)
    if (actionKind === 'PREPARE_ATTACK') {
      if (!enemy.memory) enemy.memory = createInitialEnemyMemory();
      enemy.memory.preparedAbilityId = ability.id;
      enemy.memory.preparedTargetIds = targetPlayers.map((p) => p.id);
      enemy.preparedTelegraphLabel =
        ability.telegraphLabel || `PREPARANDO: ${ability.name.toUpperCase()}`;
      enemy.intent = 'CATACLISMO';
      enemy.intentCategory = 'TELEGRAPH';

      visualEvents.push({
        id: `ev_${ts}_en_tele_${enemy.id}`,
        kind: 'TELEGRAPH_ENEMY',
        targetType: 'ENEMY',
        targetId: enemy.id,
        label: `⚠ ${enemy.preparedTelegraphLabel}`,
        sublabel: '¡DEFENDEOS O INTERRUMPID EL ATAQUE!',
        color: '#FFD166',
        vfxStyle: 'arcane',
      });

      logParts.push(
        `⚠ ¡${enemy.name} acumula energía oscura (${enemy.preparedTelegraphLabel})! Se desatará en la siguiente ronda.`
      );
      activeRoom.outcomeLog = logParts.join(' ');
      this.emitVisualEventBatch(room, visualEvents, enemy.id, 'ENEMY_TELEGRAPH');
      return;
    }

    // 6. SUMMON (Section 14 & 43: Controlled summon with max 1 active summoned creature and cap <= 3 enemies)
    if (actionKind === 'SUMMON') {
      const livingAllies = activeRoom.enemies.filter((e) => e.hp > 0);
      const hasActiveSummon = livingAllies.some((e) => e.id.startsWith('summon_'));
      if (!hasActiveSummon && livingAllies.length < 3) {
        const summonHp = Math.max(18, Math.round(enemy.maxHp * 0.28));
        const summonedBase: CriptaRoomEnemy = {
          id: `summon_${currentRound}_${Date.now()}`,
          slug: enemy.isFinalBoss ? 'esquirla_del_vacio' : 'engendro_invocado',
          name: enemy.isFinalBoss ? 'Esquirla del Vacío' : 'Siervo de la Cripta',
          title: 'INVOCACIÓN',
          profession: 'GUERRERO',
          isElite: false,
          isBoss: false,
          hp: summonHp,
          maxHp: summonHp,
          attack: Math.max(7, Math.round(enemy.attack * 0.65)),
          armor: 1,
          intent: 'ATAQUE',
          intentCategory: 'ATTACK',
          intentValue: Math.max(7, Math.round(enemy.attack * 0.65)),
          accentColor: enemy.accentColor,
          statusThreat: enemy.statusThreat,
          spriteArchetype: enemy.spriteArchetype,
        };
        const aiBuilt = buildEnemyAiProfileForArchetype(summonedBase, activeRoom.index);
        activeRoom.enemies.push({
          ...summonedBase,
          roleTag: aiBuilt.roleTag,
          profession: aiBuilt.profession,
          aiProfile: aiBuilt.aiProfile,
          memory: createInitialEnemyMemory(),
        });
        visualEvents.push({
          id: `ev_${ts}_en_sum_${enemy.id}`,
          kind: 'BUFF_ENEMY',
          targetType: 'ENEMY',
          targetId: enemy.id,
          label: `¡INVOCÓ A ${summonedBase.name.toUpperCase()}!`,
          color: '#9B72CF',
          vfxStyle: 'arcane',
        });
        logParts.push(`¡${enemy.name} invoca un ${summonedBase.name} (${summonHp} PV) al combate!`);
        activeRoom.outcomeLog = logParts.join(' ');
        this.emitVisualEventBatch(room, visualEvents, enemy.id, 'ENEMY_SUMMON');
        return;
      }
    }

    // 7. OFFENSIVE / STATUS / BOSS ACTIONS against 1 or multiple targetPlayers
    // Section 15: BERSERKER FURIA (Below 35% HP: +25% damage, -15% defense)
    const isBerserkerFuria =
      (enemy.profession === 'BERSERKER' || enemy.aiProfile?.personality === 'BERSERKER') &&
      enemy.hp / Math.max(1, enemy.maxHp) <= 0.35;
    if (isBerserkerFuria && !enemy.furiaActive) {
      enemy.furiaActive = true;
      enemy.armor = Math.max(0, Math.floor((enemy.armor || 2) * 0.85));
    }
    const effectiveEnemyAttack = Math.round(
      (enemy.attack + (enemy.attackBuffBonus || 0)) * (isBerserkerFuria ? 1.25 : 1.0)
    );
    const dmgMult = ability.damageMultiplier ?? 1.0;

    const enemyVfxStyle: NonNullable<CriptaVisualEvent['vfxStyle']> =
      ability.statusToApply === 'POISON' ||
      enemy.statusThreat === 'POISON' ||
      enemy.profession === 'CHAMÁN'
        ? 'alchemy'
        : enemy.roleTag === 'CASTER' ||
          enemy.profession === 'CONTROLADOR' ||
          enemy.profession === 'INVOCADOR' ||
          ability.actionKind === 'APPLY_STATUS' ||
          ability.statusToApply === 'CURSE' ||
          ability.statusToApply === 'WEAKENED' ||
          ability.statusToApply === 'VULNERABLE'
        ? 'arcane'
        : enemy.profession === 'TIRADOR' || enemy.profession === 'ASESINO'
        ? 'arrow'
        : enemy.roleTag === 'TANK' ||
          enemy.profession === 'GUARDIÁN' ||
          enemy.profession === 'TANQUE' ||
          enemy.profession === 'BRUTO'
        ? 'blunt'
        : 'claw';

    const intendedTargetNames = targetPlayers.map((tp) => tp.name).join(', ');

    visualEvents.push({
      id: `ev_${ts}_en_lunge_${enemy.id}`,
      kind: 'ENEMY_ATTACK',
      targetType: 'ENEMY',
      targetId: enemy.id,
      label: ability.name.toUpperCase(),
      sublabel: intendedTargetNames
        ? `${enemy.name.toUpperCase()} → ${intendedTargetNames.toUpperCase()}`
        : enemy.name.toUpperCase(),
      color: '#C93B5B',
      vfxStyle: enemyVfxStyle,
    });

    for (let tIdx = 0; tIdx < targetPlayers.length; tIdx++) {
      let targetPlayer = targetPlayers[tIdx];
      if (!targetPlayer || targetPlayer.isDead || targetPlayer.hp <= 0) {
        // Fallback to any living player if the chosen player died earlier in the enemy phase
        const fallbackPlayer = room.players.find((p) => p.isConnected && !p.isDead && p.hp > 0);
        if (!fallbackPlayer) break;
        targetPlayer = fallbackPlayer;
      }

      // Check if an allied player (e.g. Caballero) is protecting this player!
      let interceptedByProtector: CriptaPlayer | null = null;
      if (
        targetPlayer.protectedByPlayerId &&
        targetPlayer.protectedByPlayerId !== targetPlayer.id &&
        targetPlayers.length === 1
      ) {
        const protector = room.players.find(
          (p) =>
            p.id === targetPlayer.protectedByPlayerId &&
            p.isConnected &&
            !p.isDead &&
            p.hp > 0
        );
        if (protector) {
          interceptedByProtector = protector;
          targetPlayer = protector;
        }
      }

      const targetEffStats = computePlayerEffectiveStats(targetPlayer);

      // Roll AGILIDAD Evasion! High AGILIDAD allows dodging part of incoming damage & avoiding debuffs
      const evasionSeed =
        ((room.dungeonSeed || room.seed) +
          currentRound * 59 +
          enemyStepIndex * 31 +
          tIdx * 17 +
          targetPlayer.seatIndex * 13) >>>
        0;
      const evadedAttack =
        !interceptedByProtector &&
        targetEffStats.evasionPct > 0 &&
        evasionSeed % 100 < targetEffStats.evasionPct;

      const hasFrostDebuff = Boolean(playerHasStatus(targetPlayer, 'FROST'));
      const effectiveArmor = hasFrostDebuff
        ? Math.max(0, targetEffStats.defense - 2)
        : targetEffStats.defense;
      const shieldBuff = playerHasStatus(targetPlayer, 'SHIELDED');
      const markedDebuff = playerHasStatus(targetPlayer, 'MARKED');

      let rawEnemyDmg = Math.round(effectiveEnemyAttack * dmgMult);
      if (
        ability.comboAfterStatus &&
        playerHasStatus(targetPlayer, ability.comboAfterStatus)
      ) {
        rawEnemyDmg = Math.round(rawEnemyDmg * (ability.comboBonusMultiplier || 1.3));
      }

      const mitigation = Math.min(
        rawEnemyDmg - 3,
        Math.round(effectiveArmor * 0.55) + (shieldBuff ? shieldBuff.potency : 0)
      );
      let netDamage = Math.max(3, rawEnemyDmg - Math.max(0, mitigation));

      if (targetPlayer.isDefendingThisRound) {
        netDamage = Math.max(2, Math.round(netDamage * 0.62));
      }

      // Bárbaro high-Fury recklessness (75+ FURIA: +15% damage taken for +28% damage dealt)
      if (targetPlayer.characterId === 'barbaro' && (targetPlayer.classResource || 0) >= 75) {
        netDamage = Math.round(netDamage * 1.15);
      }

      if (evadedAttack) {
        netDamage = Math.max(1, Math.round(netDamage * 0.35));
      }

      if (markedDebuff) {
        netDamage = Math.round(netDamage * 1.35);
        targetPlayer.statuses = targetPlayer.statuses.filter((s) => s.effectType !== 'MARKED');
        logParts.push(`¡MARCADO amplifica el golpe sobre ${targetPlayer.name}!`);
      }

      targetPlayer.hp = Math.max(0, targetPlayer.hp - netDamage);
      if (!room.runStats) room.runStats = buildDefaultRunStats();
      room.runStats.damageReceived += netDamage;

      // Bárbaro gains FURIA when taking damage!
      if (targetPlayer.characterId === 'barbaro' && targetPlayer.hp > 0) {
        targetPlayer.classResource = Math.min(
          100,
          (targetPlayer.classResource ?? 0) + Math.min(25, Math.max(10, Math.round(netDamage * 1.1)))
        );
      } else if (targetPlayer.characterId === 'caballero' && targetPlayer.hp > 0) {
        targetPlayer.classResource = Math.min(5, (targetPlayer.classResource ?? 0) + 1);
      }

      visualEvents.push({
        id: `ev_${ts}_p_hit_${targetPlayer.id}_${tIdx}`,
        kind: 'DAMAGE_PLAYER',
        targetType: 'PLAYER',
        targetId: targetPlayer.id,
        value: -netDamage,
        label: evadedAttack ? `¡ESQUIVA ÁGIL! -${netDamage} PV` : `-${netDamage} PV`,
        sublabel: interceptedByProtector
          ? `INTERCEPTÓ POR ALIADO · ${ability.name.toUpperCase()}`
          : evadedAttack
          ? `AGILIDAD (${targetEffStats.evasionPct}%) REDUJO EL GOLPE`
          : `${enemy.name.toUpperCase()} · ${ability.name.toUpperCase()}`,
        color: evadedAttack ? '#38BDF8' : '#C93B5B',
        vfxStyle: enemyVfxStyle,
      });

      // Relic: Espina Viva reflects 3 damage to attacker
      if (
        playerHasRelic(targetPlayer, room.partyRelics || [], 'espina_viva') &&
        enemy.hp > 0
      ) {
        const prevAttHp = enemy.hp;
        enemy.hp = Math.max(0, enemy.hp - 3);
        room.runStats.damageDealt += 3;
        visualEvents.push({
          id: `ev_${ts}_thorn_${enemy.id}_${targetPlayer.id}`,
          kind: 'DAMAGE_ENEMY',
          targetType: 'ENEMY',
          targetId: enemy.id,
          value: -3,
          label: '-3 PV',
          sublabel: 'ESPINA VIVA',
          color: '#E7A54A',
        });
        if (prevAttHp > 0 && enemy.hp <= 0) {
          this.handleEnemyKilledSideEffects(room, activeRoom, enemy, visualEvents, ts);
        }
      }

      // Apply status if ability specifies statusToApply (Checked against VOLUNTAD Status Resistance & Evasion!)
      let statusLog = '';
      if (targetPlayer.hp > 0 && ability.statusToApply && !evadedAttack) {
        const resistSeed = (evasionSeed + 43) >>> 0;
        const resistedByWillpower =
          targetEffStats.statusResistPct > 0 &&
          resistSeed % 100 < targetEffStats.statusResistPct;

        if (resistedByWillpower) {
          statusLog = ` (¡${targetPlayer.name} RESISTIÓ ${ability.statusToApply} con VOLUNTAD!)`;
          visualEvents.push({
            id: `ev_${ts}_res_${targetPlayer.id}_${tIdx}`,
            kind: 'STATUS_APPLIED',
            targetType: 'PLAYER',
            targetId: targetPlayer.id,
            label: '¡RESISTIDO! (VOLUNTAD)',
            sublabel: `${targetEffStats.statusResistPct}% RES. ESTADOS`,
            color: '#C084FC',
          });
        } else {
          const applied = applyStatusEffectToPlayer(
            targetPlayer,
            ability.statusToApply,
            enemy.id,
            currentRound,
            ability.statusTurns || 2
          );
          if (applied) {
            if (
              this.hasPartyRelic(room, 'sello_del_vacio') &&
              (applied.effectType === 'CONFUSION' || applied.effectType === 'CURSE')
            ) {
              applied.remainingTurns = Math.max(1, applied.remainingTurns - 1);
            }
            const sDef = CRIPTA_STATUS_EFFECTS_REGISTRY[applied.effectType];
            statusLog = ` y aplica ${applied.name} (${applied.remainingTurns}T)`;
            visualEvents.push({
              id: `ev_${ts}_st_${targetPlayer.id}_${tIdx}`,
              kind: 'STATUS_APPLIED',
              targetType: 'PLAYER',
              targetId: targetPlayer.id,
              label: `+${applied.name} (${applied.remainingTurns}T)`,
              sublabel: ability.name,
              color: sDef?.visualTreatment.color || '#E7A54A',
              statusType: applied.effectType,
            });
          }
        }
      }

      logParts.push(
        interceptedByProtector
          ? `¡${targetPlayer.name} protege a su aliado y recibe ${ability.name} de ${enemy.name} (-${netDamage} PV${statusLog})!`
          : `${enemy.name} usa ${ability.name} contra ${targetPlayer.name} (-${netDamage} PV${statusLog}).`
      );

      if (targetPlayer.hp <= 0) {
        targetPlayer.hp = 0;
        targetPlayer.isDead = true;
        targetPlayer.deathsCount = (targetPlayer.deathsCount || 0) + 1;
        targetPlayer.statuses = [];
        visualEvents.push({
          id: `ev_${ts}_p_death_${targetPlayer.id}`,
          kind: 'PLAYER_DEATH',
          targetType: 'PLAYER',
          targetId: targetPlayer.id,
          label: `¡${targetPlayer.name.toUpperCase()} HA CAÍDO!`,
          sublabel: `DERROTADO POR ${enemy.name.toUpperCase()}`,
          color: '#E03E52',
          vfxStyle: 'explosion',
        });
        logParts.push(`¡${targetPlayer.name} ha CAÍDO en combate!`);
        this.broadcastMessage(room, {
          type: 'NOTIFICATION',
          text: `¡${targetPlayer.name} ha caído en combate!`,
          variant: 'danger',
        });
      }
    }

    // Check if Espina Viva killed the last enemy
    this.checkAndResolveCombatVictoryIfCleared(
      room,
      activeRoom,
      room.players[0],
      logParts,
      visualEvents,
      ts
    );

    if (
      this.checkAndApplyPartyDefeat(
        room,
        `Derrotados por ${enemy.name} (${ability.name})`,
        enemy.name,
        visualEvents
      )
    ) {
      logParts.push('¡TODA LA EXPEDICIÓN HA CAÍDO EN LA CRIPTA!');
    }

    activeRoom.outcomeLog = logParts.join(' ');
    this.emitVisualEventBatch(room, visualEvents, enemy.id, 'ENEMY_ACTION');
  }

  private resolveEndOfCombatRound(
    room: ServerCriptaRoom,
    activeRoom: CriptaDungeonRoom
  ) {
    if (room.expeditionDefeated || activeRoom.resolved) {
      room.isResolvingRound = false;
      return;
    }

    activeRoom.combatRoundPhase = 'END_OF_ROUND';
    const ts = Date.now();
    const visualEvents: CriptaVisualEvent[] = [];
    const logParts: string[] = [];

    // 1. Resolve enemy end-of-round Poison, Bleed, Burn stacks & decrement temporary buffs/debuffs
    for (const enemy of activeRoom.enemies) {
      if (enemy.hp <= 0) continue;
      if ((enemy.poisonStacks || 0) > 0) {
        const pDmg = enemy.poisonStacks! * 4;
        const prevHp = enemy.hp;
        enemy.hp = Math.max(0, enemy.hp - pDmg);
        if (!room.runStats) room.runStats = buildDefaultRunStats();
        room.runStats.damageDealt += pDmg;
        visualEvents.push({
          id: `ev_${ts}_en_pois_${enemy.id}`,
          kind: 'DAMAGE_ENEMY',
          targetType: 'ENEMY',
          targetId: enemy.id,
          value: -pDmg,
          label: `-${pDmg} PV (VENENO)`,
          color: '#5EA87A',
        });
        logParts.push(`${enemy.name} sufre -${pDmg} PV por veneno.`);
        enemy.poisonStacks = Math.max(0, (enemy.poisonStacks || 0) - 1);
        if (prevHp > 0 && enemy.hp <= 0) {
          this.handleEnemyKilledSideEffects(room, activeRoom, enemy, visualEvents, ts);
        }
      }
      if (enemy.hp > 0 && (enemy.bleedStacks || 0) > 0) {
        const bDmg = enemy.bleedStacks! * 4;
        const prevHp = enemy.hp;
        enemy.hp = Math.max(0, enemy.hp - bDmg);
        if (!room.runStats) room.runStats = buildDefaultRunStats();
        room.runStats.damageDealt += bDmg;
        visualEvents.push({
          id: `ev_${ts}_en_bleed_${enemy.id}`,
          kind: 'DAMAGE_ENEMY',
          targetType: 'ENEMY',
          targetId: enemy.id,
          value: -bDmg,
          label: `-${bDmg} PV (SANGRADO)`,
          color: '#E03E52',
        });
        logParts.push(`${enemy.name} sufre -${bDmg} PV por sangrado.`);
        enemy.bleedStacks = Math.max(0, (enemy.bleedStacks || 0) - 1);
        if (prevHp > 0 && enemy.hp <= 0) {
          this.handleEnemyKilledSideEffects(room, activeRoom, enemy, visualEvents, ts);
        }
      }
      if (enemy.hp > 0 && (enemy.burnStacks || 0) > 0) {
        const burnDmg = enemy.burnStacks! * 5;
        const prevHp = enemy.hp;
        enemy.hp = Math.max(0, enemy.hp - burnDmg);
        if (!room.runStats) room.runStats = buildDefaultRunStats();
        room.runStats.damageDealt += burnDmg;
        visualEvents.push({
          id: `ev_${ts}_en_burn_${enemy.id}`,
          kind: 'DAMAGE_ENEMY',
          targetType: 'ENEMY',
          targetId: enemy.id,
          value: -burnDmg,
          label: `-${burnDmg} PV (QUEMADURA)`,
          color: '#F59E0B',
        });
        logParts.push(`${enemy.name} sufre -${burnDmg} PV por quemadura.`);
        enemy.burnStacks = Math.max(0, (enemy.burnStacks || 0) - 1);
        if (prevHp > 0 && enemy.hp <= 0) {
          this.handleEnemyKilledSideEffects(room, activeRoom, enemy, visualEvents, ts);
        }
      }
      if ((enemy.vulnerableTurns || 0) > 0) {
        enemy.vulnerableTurns = Math.max(0, enemy.vulnerableTurns! - 1);
      }
      if ((enemy.markedTurns || 0) > 0) {
        enemy.markedTurns = Math.max(0, enemy.markedTurns! - 1);
      }
      if ((enemy.curseTurns || 0) > 0) {
        enemy.curseTurns = Math.max(0, enemy.curseTurns! - 1);
      }
      if ((enemy.corrosionTurns || 0) > 0) {
        enemy.corrosionTurns = Math.max(0, enemy.corrosionTurns! - 1);
      }
      if ((enemy.frostTurns || 0) > 0) {
        enemy.frostTurns = Math.max(0, enemy.frostTurns! - 1);
      }
      if ((enemy.attackBuffRounds || 0) > 0) {
        enemy.attackBuffRounds = Math.max(0, enemy.attackBuffRounds! - 1);
        if (enemy.attackBuffRounds === 0) enemy.attackBuffBonus = 0;
      }
      if ((enemy.armorBuffRounds || 0) > 0) {
        enemy.armorBuffRounds = Math.max(0, enemy.armorBuffRounds! - 1);
        if (enemy.armorBuffRounds === 0) enemy.armorBuffBonus = 0;
      }
    }

    const clearedByPoison = this.checkAndResolveCombatVictoryIfCleared(
      room,
      activeRoom,
      room.players[0],
      logParts,
      visualEvents,
      ts
    );

    if (clearedByPoison) {
      room.isResolvingRound = false;
      activeRoom.activeCombatActorId = null;
      activeRoom.activeTargetedPlayerIds = [];
      this.emitVisualEventBatch(room, visualEvents, undefined, 'END_OF_ROUND');
      this.syncLegacyNodes(room);
      this.broadcastRoomState(room);
      return;
    }

    // 2. Resolve player end-of-round status ticks (POISON, BURN, BLEED, REGENERATION)
    for (const player of room.players) {
      if (!player.isConnected || player.isDead || player.hp <= 0) continue;

      const tickResult = resolvePlayerTurnEndStatusTicks(player);
      if (tickResult.damageTaken > 0) {
        if (!room.runStats) room.runStats = buildDefaultRunStats();
        room.runStats.damageReceived += tickResult.damageTaken;
        visualEvents.push({
          id: `ev_${ts}_dot_${player.id}`,
          kind: 'DAMAGE_PLAYER',
          targetType: 'PLAYER',
          targetId: player.id,
          value: -tickResult.damageTaken,
          label: `-${tickResult.damageTaken} PV`,
          sublabel: 'FIN DE RONDA · AFLICCIÓN',
          color: '#C93B5B',
        });
      }
      if (tickResult.healedAmount > 0) {
        if (!room.runStats) room.runStats = buildDefaultRunStats();
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
        logParts.push(`[${player.name}: ${tickResult.logSegments.join(' · ')}]`);
      }
      if (tickResult.diedFromStatus) {
        visualEvents.push({
          id: `ev_${ts}_p_death_dot_${player.id}`,
          kind: 'PLAYER_DEATH',
          targetType: 'PLAYER',
          targetId: player.id,
          label: `¡${player.name.toUpperCase()} HA CAÍDO!`,
          sublabel: 'CONSUMIDO POR AFLICCIÓN',
          color: '#E03E52',
          vfxStyle: 'explosion',
        });
        this.broadcastMessage(room, {
          type: 'NOTIFICATION',
          text: `¡${player.name} ha caído por sus aflicciones!`,
          variant: 'danger',
        });
      }

      // Decay short-term threat & recent counters for next round
      player.recentDamageDealt = Math.round((player.recentDamageDealt || 0) * 0.5);
      player.recentHealingDone = Math.round((player.recentHealingDone || 0) * 0.5);
      player.threatScore = Math.round((player.threatScore || 0) * 0.7);
      player.isDefendingThisRound = false;
      player.basicAttackUsedThisTurn = false;
      if ((player.weaponSpecialCooldown || 0) > 0) {
        player.weaponSpecialCooldown = Math.max(0, (player.weaponSpecialCooldown || 0) - 1);
      }
      if (player.abilityCooldowns) {
        for (const abKey of Object.keys(player.abilityCooldowns)) {
          if (player.abilityCooldowns[abKey] > 0) {
            player.abilityCooldowns[abKey] = Math.max(0, player.abilityCooldowns[abKey] - 1);
          }
        }
      }
      if ((player.tauntTurnsRemaining || 0) > 0) {
        player.tauntTurnsRemaining = Math.max(0, player.tauntTurnsRemaining! - 1);
      }
    }

    if (
      this.checkAndApplyPartyDefeat(
        room,
        'Consumidos por aflicciones letales al final de la ronda',
        'Aflicción Letal',
        visualEvents
      )
    ) {
      logParts.push('¡TODA LA EXPEDICIÓN HA CAÍDO EN LA CRIPTA!');
      activeRoom.outcomeLog = logParts.join(' ');
      room.isResolvingRound = false;
      activeRoom.activeCombatActorId = null;
      activeRoom.activeTargetedPlayerIds = [];
      this.emitVisualEventBatch(room, visualEvents, undefined, 'END_OF_ROUND');
      this.syncLegacyNodes(room);
      this.broadcastRoomState(room);
      return;
    }

    // 3. Advance to NEXT ROUND -> PLAYER_PHASE
    const nextRound = (activeRoom.combatTurn || 1) + 1;
    activeRoom.combatTurn = nextRound;
    activeRoom.combatRoundPhase = 'PLAYER_PHASE';
    activeRoom.queuedPlayerActions = {};
    activeRoom.actedPlayerIdsThisRound = [];
    activeRoom.activeCombatActorId = null;
    activeRoom.activeTargetedPlayerIds = [];
    const nextTurnPlayerId = this.computeNextTurnPlayerId(room, activeRoom);
    this.assignFreshPlayerTurn(activeRoom, nextTurnPlayerId);
    const firstTurnPlayer = room.players.find((p) => p.id === activeRoom.activeTurnPlayerId);
    activeRoom.combatBannerText = firstTurnPlayer
      ? `RONDA ${nextRound} — TURNO DE ${firstTurnPlayer.name.toUpperCase()}`
      : `RONDA ${nextRound} — FASE DE JUGADORES`;

    // Update visible enemy intents for the new round
    for (const enemy of activeRoom.enemies) {
      if (enemy.hp > 0) {
        refreshEnemyIntentPreview(
          enemy,
          activeRoom,
          room.players,
          room.dungeonSeed || room.seed
        );
      }
    }

    if (logParts.length > 0) {
      activeRoom.outcomeLog = `${logParts.join(' ')} — Comienza la RONDA ${nextRound}.`;
    }

    room.isResolvingRound = false;
    if (visualEvents.length > 0) {
      this.emitVisualEventBatch(room, visualEvents, undefined, 'END_OF_ROUND');
    }
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

    let opt = activeRoom.options.find((o) => o.id === optionId);
    if (!opt || opt.resolved) return;

    const connectedPlayers = room.players.filter((p) => p.isConnected);
    const livingConnected = connectedPlayers.filter((p) => !p.isDead && p.hp > 0);
    const isSolo = livingConnected.length <= 1;

    // For non-SHOP rooms in multiplayer, use authoritative group voting among living connected players
    if (activeRoom.type !== 'SHOP' && !isSolo && !activeRoom.resolved) {
      activeRoom.optionVotes[player.id] = optionId;
      const votedCount = livingConnected.filter(
        (p) => Boolean(activeRoom.optionVotes[p.id])
      ).length;
      const votesForThis = livingConnected.filter(
        (p) => activeRoom.optionVotes[p.id] === optionId
      ).length;

      if (votesForThis < Math.ceil(livingConnected.length / 2) && votedCount < livingConnected.length) {
        activeRoom.outcomeLog = `${player.name} propone: ${opt.label} (${votesForThis}/${livingConnected.length} votos).`;
        this.broadcastRoomState(room);
        return;
      }

      // If all living players voted and split their votes, resolve the option with the highest vote tally
      if (votedCount >= livingConnected.length && votesForThis < Math.ceil(livingConnected.length / 2)) {
        let bestOpt = opt;
        let bestTally = votesForThis;
        for (const candidate of activeRoom.options) {
          const tally = livingConnected.filter(
            (p) => activeRoom.optionVotes[p.id] === candidate.id
          ).length;
          if (tally > bestTally) {
            bestTally = tally;
            bestOpt = candidate;
          }
        }
        opt = bestOpt;
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
    } else if (opt.id.includes('rest_train')) {
      for (const p of room.players) {
        if (!p.isDead && p.hp > 0) {
          p.bonusAttack = (p.bonusAttack || 0) + 1;
          p.bonusMagic = (p.bonusMagic || 0) + 1;
          p.bonusPrecision = (p.bonusPrecision || 0) + 1;
          p.hp = Math.min(p.maxHp, p.hp + 12);
          applyStatusEffectToPlayer(p, 'BLESSED', 'rest_train', 1, 2);
        }
      }
      pushPartyStatEvents(12, 0, 1, 1, 'BLESSED', false);
    } else if (opt.id.includes('shrine_blessing')) {
      const actorEff = computePlayerEffectiveStats(player);
      const willBonusHeal = Math.floor(actorEff.willpower * 0.8);
      for (const p of room.players) {
        if (!p.isDead && p.hp > 0) {
          p.hp = Math.min(p.maxHp, p.hp + 22 + willBonusHeal);
          p.armor = Math.min(24, p.armor + 3);
          p.bonusMagic = (p.bonusMagic || 0) + 1;
          p.bonusWillpower = (p.bonusWillpower || 0) + 1;
          purifyPlayerDebuffs(p, 99);
          applyStatusEffectToPlayer(p, 'BLESSED', 'shrine', 1, 3);
        }
      }
      pushPartyStatEvents(22 + willBonusHeal, 3, 0, 1, 'BLESSED', true);
    } else if (opt.id.includes('shrine_forge')) {
      for (const p of room.players) {
        if (!p.isDead && p.hp > 0) {
          p.hp = Math.min(p.maxHp, p.hp + 15);
          p.armor = Math.min(24, p.armor + 2);
          p.bonusPrecision = (p.bonusPrecision || 0) + 1;
          applyStatusEffectToPlayer(p, 'SHIELDED', 'shrine_forge', 1, 3);
        }
      }
      if ((player.weaponUpgradeLevel || 1) >= 3) {
        player.bonusAttack = (player.bonusAttack || 0) + 2;
      }
      pushPartyStatEvents(15, 2, 0, 0, 'SHIELDED', false);
    } else if (opt.id.includes('event_relic_trial')) {
      const actorEff = computePlayerEffectiveStats(player);
      // High VOLUNTAD reduces health sacrifice in dark/occult trials!
      const trialHpCost = Math.max(3, 10 - Math.floor(actorEff.willpower * 0.6));
      room.partyGold = (room.partyGold ?? 0) + 20;
      room.runStats.goldEarned += 20;
      player.hp = Math.max(4, player.hp - trialHpCost);
      player.bonusWillpower = (player.bonusWillpower || 0) + 1;
      const trialRelicId = pickUnownedRelic(
        (room.dungeonSeed || room.seed) + activeRoom.index * 53 + ts,
        2,
        room.players,
        room.partyRelics || []
      );
      if (trialRelicId) {
        this.grantRelicAuthoritatively(room, player, trialRelicId, visualEvents);
      }
      visualEvents.push({
        id: `ev_${ts}_trial_dmg_${player.id}`,
        kind: 'DAMAGE_PLAYER',
        targetType: 'PLAYER',
        targetId: player.id,
        value: -trialHpCost,
        label: `-${trialHpCost} PV (TEMPLADO POR VOLUNTAD +1 VOL)`,
        color: '#C93B5B',
      });
    } else if (opt.id.includes('shrine_pact')) {
      const actorEff = computePlayerEffectiveStats(player);
      const pactHpCost = Math.max(3, 8 - Math.floor(actorEff.willpower * 0.5));
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
          p.hp = Math.max(4, p.hp - pactHpCost);
          p.armor = Math.min(24, p.armor + 4);
          p.bonusAttack = (p.bonusAttack || 0) + 2;
          p.bonusWillpower = (p.bonusWillpower || 0) + 1;
          applyStatusEffectToPlayer(p, 'BLEED', 'shrine_pact', 1, 2);
        }
      }
      pushPartyStatEvents(-pactHpCost, 4, 2, 0, 'BLEED', false);
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
      // AGILIDAD and PRECISIÓN increase trap disarm gold and grant +1 AGILIDAD
      const maxPartyAgiPre = Math.max(
        ...room.players
          .filter((p) => !p.isDead && p.hp > 0)
          .map((p) => {
            const eff = computePlayerEffectiveStats(p);
            return eff.agility + eff.precision;
          }),
        10
      );
      const trapGold = 20 + Math.min(20, Math.max(0, (maxPartyAgiPre - 10) * 2));
      room.partyGold = (room.partyGold ?? 0) + trapGold;
      room.runStats.goldEarned += trapGold;
      for (const p of room.players) {
        if (!p.isDead && p.hp > 0) {
          p.bonusAgility = (p.bonusAgility || 0) + 1;
        }
      }
      visualEvents.push({
        id: `ev_${ts}_gold`,
        kind: 'GAIN_GOLD',
        targetType: 'PARTY',
        value: trapGold,
        label: `+${trapGold} ORO · +1 AGILIDAD`,
        sublabel: 'TRAMPA DESACTIVADA CON PRECISIÓN',
        color: '#E7A54A',
        vfxStyle: 'gold',
      });
    } else if (opt.id.includes('trap_shield_rush')) {
      const trapStDef = CRIPTA_STATUS_EFFECTS_REGISTRY[threatProfile.trapStatus];
      for (const p of room.players) {
        if (!p.isDead && p.hp > 0) {
          const pEff = computePlayerEffectiveStats(p);
          // High AGILIDAD or DEFENSA reduces trap damage!
          const trapDmg = Math.max(2, 6 - Math.floor((pEff.agility + pEff.defense) / 6));
          p.hp = Math.max(4, p.hp - trapDmg);
          p.armor = Math.min(24, p.armor + 2);
          // High VOLUNTAD can resist the trap affliction!
          const resistedTrapStatus = pEff.willpower >= 7;
          if (!resistedTrapStatus) {
            applyStatusEffectToPlayer(p, threatProfile.trapStatus, 'trap', 1);
          }
          visualEvents.push(
            {
              id: `ev_${ts}_trap_dmg_${p.id}`,
              kind: 'DAMAGE_PLAYER',
              targetType: 'PLAYER',
              targetId: p.id,
              value: -trapDmg,
              label: `-${trapDmg} PV`,
              sublabel: resistedTrapStatus ? '¡AFLICCIÓN RESISTIDA (VOLUNTAD)!' : `+${trapStDef.name}`,
              color: '#C93B5B',
              statusType: resistedTrapStatus ? undefined : threatProfile.trapStatus,
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

    // Apply Weapon / Armor / Accessory / Upgrade / Event Flags to the party when the decision resolves!
    const recipients = livingConnected.length > 0 ? livingConnected : [player];

    if (opt.grantsWeaponId && CRIPTA_WEAPONS_REGISTRY[opt.grantsWeaponId]) {
      for (const recipient of recipients) {
        const assignedWepId =
          recipient.id === player.id
            ? opt.grantsWeaponId
            : pickWeaponDropForDungeon(
                dungeonId,
                activeRoom.index + recipient.seatIndex,
                activeRoom.type === 'TREASURE' || activeRoom.type === 'SECRET',
                recipient.characterId ? [recipient.characterId] : []
              );
        const wDef = CRIPTA_WEAPONS_REGISTRY[assignedWepId] || CRIPTA_WEAPONS_REGISTRY[opt.grantsWeaponId];
        if (wDef) {
          recipient.equippedWeaponId = wDef.id;
          recipient.weaponSpecialCooldown = 0;
          visualEvents.push({
            id: `ev_${ts}_opt_wep_${recipient.id}`,
            kind: 'WEAPON_EQUIPPED',
            targetType: 'PLAYER',
            targetId: recipient.id,
            sourcePlayerId: recipient.id,
            label: `EQUIPÓ: ${wDef.name.toUpperCase()}`,
            sublabel: `${wDef.baseMinDamage}–${wDef.baseMaxDamage} DAÑO`,
            color: wDef.accentColor,
            vfxStyle: 'slash',
          });
        }
      }
    }
    if (opt.grantsArmorId && CRIPTA_ARMORS_REGISTRY[opt.grantsArmorId]) {
      const aDef = CRIPTA_ARMORS_REGISTRY[opt.grantsArmorId];
      for (const recipient of recipients) {
        recipient.equippedArmorId = aDef.id;
        recipient.maxHp += aDef.bonusMaxHp;
        recipient.hp = Math.min(recipient.maxHp, recipient.hp + aDef.bonusMaxHp);
        recipient.armor = Math.min(24, recipient.armor + aDef.bonusDefense);
      }
    }
    if (opt.grantsAccessoryId && CRIPTA_ACCESSORIES_REGISTRY[opt.grantsAccessoryId]) {
      const accDef = CRIPTA_ACCESSORIES_REGISTRY[opt.grantsAccessoryId];
      for (const recipient of recipients) {
        recipient.equippedAccessoryId = accDef.id;
      }
    }
    if (opt.isWeaponUpgradeOption) {
      for (const recipient of recipients) {
        const currLvl = recipient.weaponUpgradeLevel || 1;
        if (currLvl < 3) {
          recipient.weaponUpgradeLevel = (currLvl + 1) as 2 | 3;
          const eq = getEquippedWeaponForPlayer(recipient);
          visualEvents.push({
            id: `ev_${ts}_opt_wup_${recipient.id}`,
            kind: 'WEAPON_UPGRADED',
            targetType: 'PLAYER',
            targetId: recipient.id,
            label: `¡ARMA NIVEL ${recipient.weaponUpgradeLevel}!`,
            sublabel: `${eq.weapon.name.toUpperCase()} (${eq.scaledMin}–${eq.scaledMax} DAÑO)`,
            color: '#FFD166',
            vfxStyle: 'slash',
          });
        }
      }
    }

    if (!room.eventFlags) room.eventFlags = {};
    if (activeRoom.encounterSubject?.archetype === 'SPECTRAL_KNIGHT' && opt.id.includes('respect')) {
      room.eventFlags.freedSpectralKnight = true;
    } else if (activeRoom.encounterSubject?.archetype === 'INJURED_HOUND' && !opt.id.includes('abandon')) {
      room.eventFlags.fedCryptHound = true;
    }

    activeRoom.resolved = true;
    activeRoom.state = 'RESOLVED';
    activeRoom.outcomeLog = `${player.name}: ${opt.label} · ${opt.effectText}`;

    this.emitVisualEventBatch(room, visualEvents, player.id, 'INTERACT_OPTION');
    this.syncLegacyNodes(room);
    this.broadcastRoomState(room);
  }

  private handleInteractRoomObject(
    ws: WebSocket,
    room: ServerCriptaRoom,
    player: CriptaPlayer,
    objectId: string
  ) {
    if (!this.isInsideExploreOrBossPhase(room)) return;
    if (room.expeditionDefeated) return;
    if (player.isDead || player.hp <= 0) {
      this.sendError(ws, 'Un aventurero vivo debe examinar este objeto.');
      return;
    }
    const activeRoom = this.getActiveDungeonRoom(room);
    if (!activeRoom || !activeRoom.interactiveObjects) return;

    const obj = activeRoom.interactiveObjects.find((o) => o.id === objectId && !o.discovered);
    if (!obj) return;

    obj.discovered = true;
    obj.discoveredByPlayerName = player.name;

    const ts = Date.now();
    const visualEvents: CriptaVisualEvent[] = [];
    if (!room.runStats) room.runStats = buildDefaultRunStats();

    if (obj.objectKind === 'SKULL' || obj.objectKind === 'SKELETON') {
      const goldFound = 10;
      room.partyGold = (room.partyGold ?? 0) + goldFound;
      room.runStats.goldEarned += goldFound;
      obj.outcomeSummary = `+${goldFound} ORO hallado por ${player.name}`;
      visualEvents.push({
        id: `ev_${ts}_obj_gold`,
        kind: 'GAIN_GOLD',
        targetType: 'PARTY',
        value: goldFound,
        label: `+${goldFound} ORO`,
        sublabel: obj.label.toUpperCase(),
        color: '#E7A54A',
        vfxStyle: 'gold',
      });
    } else if (obj.objectKind === 'MUSHROOM' || obj.objectKind === 'CHALICE') {
      const healAmt = 8;
      player.hp = Math.min(player.maxHp, player.hp + healAmt);
      room.runStats.healingDone += healAmt;
      obj.outcomeSummary = `+${healAmt} PV restaurados a ${player.name}`;
      visualEvents.push({
        id: `ev_${ts}_obj_heal`,
        kind: 'HEAL_PLAYER',
        targetType: 'PLAYER',
        targetId: player.id,
        value: healAmt,
        label: `+${healAmt} PV`,
        sublabel: obj.label.toUpperCase(),
        color: '#5EA87A',
        vfxStyle: 'heal',
      });
    } else {
      const hasPickaxe = player.equippedWeaponId === 'pico_de_minero_runico';
      const goldFound = hasPickaxe ? 24 : 12;
      room.partyGold = (room.partyGold ?? 0) + goldFound;
      room.runStats.goldEarned += goldFound;
      player.armor = Math.min(24, player.armor + 1);
      obj.outcomeSummary = `+${goldFound} ORO y +1 DEFENSA`;
      visualEvents.push({
        id: `ev_${ts}_obj_crack`,
        kind: 'GAIN_GOLD',
        targetType: 'PARTY',
        value: goldFound,
        label: `+${goldFound} ORO`,
        sublabel: hasPickaxe ? 'BRECHA CON PICO RÚNICO' : obj.label.toUpperCase(),
        color: '#FFD166',
        vfxStyle: 'gold',
      });
    }

    activeRoom.outcomeLog = `${player.name} examina ${obj.label}: ${obj.outcomeSummary}.`;
    this.emitVisualEventBatch(room, visualEvents, player.id, 'INTERACT_OBJECT');
    this.broadcastRoomState(room);
  }

  private handleUpgradeWeapon(
    ws: WebSocket,
    room: ServerCriptaRoom,
    player: CriptaPlayer
  ) {
    if (!this.isInsideExploreOrBossPhase(room)) return;
    if (player.isDead || player.hp <= 0) return;

    const currLevel = player.weaponUpgradeLevel || 1;
    if (currLevel >= 3) {
      this.sendError(ws, 'Tu arma ya está mejorada al NIVEL III máximo.');
      return;
    }

    const discountPct = this.hasPartyRelic(room, 'moneda_del_muerto') ? 25 : 0;
    const cost = getWeaponUpgradeCost(currLevel, discountPct);
    if (!cost) return;

    const currentGold = room.partyGold ?? 0;
    if (currentGold < cost) {
      this.sendError(ws, `Oro insuficiente. Necesitas ${cost} ORO para mejorar tu arma.`);
      return;
    }

    room.partyGold = currentGold - cost;
    if (!room.runStats) room.runStats = buildDefaultRunStats();
    room.runStats.goldSpent += cost;

    player.weaponUpgradeLevel = (currLevel + 1) as 2 | 3;
    const eq = getEquippedWeaponForPlayer(player);
    const activeRoom = this.getActiveDungeonRoom(room);

    const visualEvents: CriptaVisualEvent[] = [
      {
        id: `ev_up_gold_${Date.now()}`,
        kind: 'LOSE_GOLD',
        targetType: 'PARTY',
        value: -cost,
        label: `-${cost} ORO`,
        color: '#E7A54A',
        vfxStyle: 'gold',
      },
      {
        id: `ev_up_wep_${Date.now()}`,
        kind: 'WEAPON_UPGRADED',
        targetType: 'PLAYER',
        targetId: player.id,
        label: `¡ARMA NIVEL ${player.weaponUpgradeLevel}!`,
        sublabel: `${eq.weapon.name.toUpperCase()} (${eq.scaledMin}–${eq.scaledMax} DAÑO)`,
        color: '#FFD166',
        vfxStyle: 'slash',
      },
    ];

    if (activeRoom) {
      activeRoom.outcomeLog = `¡${player.name} mejora su ${eq.weapon.name} a NIVEL ${player.weaponUpgradeLevel} (${eq.scaledMin}–${eq.scaledMax} DAÑO)!`;
    }

    this.emitVisualEventBatch(room, visualEvents, player.id, 'UPGRADE_WEAPON');
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
    if (!activeRoom) return;

    if (player.isDead || player.hp <= 0) {
      this.sendError(ws, 'Has caído en combate. Un compañero vivo debe activar el mecanismo.');
      return;
    }

    const visualEvents: CriptaVisualEvent[] = [];
    const ts = Date.now();
    if (!room.runStats) room.runStats = buildDefaultRunStats();

    // Interactive Minigame Resolution (RUNE_SEQUENCE, LOCKPICK_TIMING, TRAP_STEPPING, ALCHEMICAL_BALANCE)
    if (activeRoom.minigame && !activeRoom.minigame.completed) {
      const mg = activeRoom.minigame;

      const grantMinigameSuccessReward = (
        goldBonus: number,
        healAmt: number,
        statKind: 'MAGIC' | 'DEFENSE' | 'ATTACK',
        grantLootOrRelic: boolean
      ) => {
        mg.completed = true;
        mg.succeeded = true;
        activeRoom.resolved = true;
        activeRoom.state = 'RESOLVED';
        if (activeRoom.puzzleRunes) {
          activeRoom.puzzleRunes.solved = true;
        }
        room.partyGold = (room.partyGold ?? 0) + goldBonus;
        room.runStats.goldEarned += goldBonus;
        visualEvents.push({
          id: `ev_${ts}_mg_gold`,
          kind: 'GAIN_GOLD',
          targetType: 'PARTY',
          value: goldBonus,
          label: `+${goldBonus} ORO`,
          sublabel: `${mg.title.toUpperCase()} SUPERADO`,
          color: '#FFD166',
          vfxStyle: 'gold',
        });

        if (grantLootOrRelic) {
          const relicId = pickUnownedRelic(
            (room.dungeonSeed || room.seed) + activeRoom.index * 71 + ts,
            1,
            room.players,
            room.partyRelics || []
          );
          if (relicId && ((ts + activeRoom.index) % 100) < 60) {
            this.grantRelicAuthoritatively(room, player, relicId, visualEvents);
          } else {
            this.grantNormalItemAuthoritatively(
              room,
              player,
              'pocion_mayor',
              'CHEST',
              mg.minigameType,
              undefined,
              visualEvents
            );
          }
        }

        for (const p of room.players) {
          if (!p.isDead && p.hp > 0) {
            p.hp = Math.min(p.maxHp, p.hp + healAmt);
            room.runStats.healingDone += healAmt;
            if (statKind === 'MAGIC') p.bonusMagic = (p.bonusMagic || 0) + 1;
            if (statKind === 'DEFENSE') p.armor = Math.min(24, p.armor + 3);
            if (statKind === 'ATTACK') p.bonusAttack = (p.bonusAttack || 0) + 1;
            purifyPlayerDebuffs(p, 1);
            applyStatusEffectToPlayer(
              p,
              statKind === 'DEFENSE' ? 'SHIELDED' : 'BLESSED',
              'minigame',
              1,
              3
            );
            visualEvents.push({
              id: `ev_${ts}_mg_h_${p.id}`,
              kind: 'HEAL_PLAYER',
              targetType: 'PLAYER',
              targetId: p.id,
              value: healAmt,
              label: `+${healAmt} PV`,
              sublabel:
                statKind === 'DEFENSE'
                  ? '+3 ARMADURA · ESCUDO'
                  : statKind === 'ATTACK'
                  ? '+1 ATAQUE · BENDECIDO'
                  : '+1 MAGIA · BENDECIDO',
              color: '#5EA87A',
              vfxStyle: 'holy',
            });
          }
        }
      };

      const currentMeter = mg.alchemicalMeter ?? 20;
      const maxMistakes = mg.maxMistakes ?? 3;
      const family = mg.family;

      // 0. WHEEL_OF_FORTUNE (8-sector Biome Wheel of Fortune)
      if (mg.minigameType === 'WHEEL_OF_FORTUNE') {
        const targetSeq = mg.targetSequence || mg.targetPattern || [];
        const authoritativeSectorIdx =
          typeof runeIndex === 'number' && runeIndex >= 0 && runeIndex < 8
            ? runeIndex
            : typeof targetSeq[0] === 'number'
            ? targetSeq[0] % 8
            : Math.abs(room.seed + ts + activeRoom.index * 53) % 8;

        mg.wheelOutcomeIndex = authoritativeSectorIdx;
        mg.rouletteLandedSectorIndex = authoritativeSectorIdx;
        mg.rouletteSpinStartedAt = ts;
        mg.completed = true;
        activeRoom.resolved = true;
        activeRoom.state = 'RESOLVED';
        activeRoom.lifecyclePhase = 'READY_TO_LEAVE';
        if (activeRoom.puzzleRunes) {
          activeRoom.puzzleRunes.solved = true;
        }

        switch (authoritativeSectorIdx) {
          case 0: {
            // +45 ORO
            mg.succeeded = true;
            mg.wheelOutcomeLabel = 'Arca del Tesoro Real (+45 ORO)';
            mg.rewardSummary = '+45 ORO · ARCA DEL TESORO REAL';
            room.partyGold = (room.partyGold ?? 0) + 45;
            room.runStats.goldEarned += 45;
            visualEvents.push({
              id: `ev_${ts}_wof_0`,
              kind: 'GAIN_GOLD',
              targetType: 'PARTY',
              value: 45,
              label: '+45 ORO',
              sublabel: 'RUEDA DEL DESTINO',
              color: '#FFD166',
              vfxStyle: 'gold',
            });
            activeRoom.outcomeLog = `¡${player.name} gira la Rueda del Destino! Resultado: Arca del Tesoro Real (+45 ORO).`;
            break;
          }
          case 1: {
            // +24 VIDA & Purify
            mg.succeeded = true;
            mg.wheelOutcomeLabel = 'Fuente Restauradora (+24 PV y Purificación)';
            mg.rewardSummary = '+24 PV · PURIFICACIÓN GRUPAL';
            for (const p of room.players) {
              if (!p.isDead && p.hp > 0) {
                p.hp = Math.min(p.maxHp, p.hp + 24);
                room.runStats.healingDone += 24;
                purifyPlayerDebuffs(p, 99);
                visualEvents.push({
                  id: `ev_${ts}_wof_1_${p.id}`,
                  kind: 'HEAL_PLAYER',
                  targetType: 'PLAYER',
                  targetId: p.id,
                  value: 24,
                  label: '+24 PV',
                  sublabel: 'FUENTE RESTAURADORA',
                  color: '#4ADE80',
                  vfxStyle: 'heal',
                });
              }
            }
            activeRoom.outcomeLog = `¡${player.name} gira la Rueda del Destino! Resultado: Fuente Restauradora (+24 PV y Purificación).`;
            break;
          }
          case 2: {
            // PACTO (-8 PV / +35 ORO & +1 ATQ)
            mg.succeeded = true;
            mg.wheelOutcomeLabel = 'Tributo de Sangre (-8 PV, +35 ORO y +1 ATAQUE)';
            mg.rewardSummary = '+35 ORO · +1 ATAQUE · -8 PV (TRIBUTO)';
            room.partyGold = (room.partyGold ?? 0) + 35;
            room.runStats.goldEarned += 35;
            for (const p of room.players) {
              if (!p.isDead && p.hp > 0) {
                p.hp = Math.max(4, p.hp - 8);
                p.bonusAttack = (p.bonusAttack || 0) + 1;
              }
            }
            visualEvents.push({
              id: `ev_${ts}_wof_2`,
              kind: 'GAIN_GOLD',
              targetType: 'PARTY',
              value: 35,
              label: '+35 ORO · +1 ATQ (-8 PV)',
              sublabel: 'PACTO DE LA RUEDA',
              color: '#F87171',
              vfxStyle: 'gold',
            });
            activeRoom.outcomeLog = `¡${player.name} gira la Rueda del Destino! Resultado: Tributo de Sangre (-8 PV a cambio de +35 ORO y +1 ATAQUE).`;
            break;
          }
          case 3: {
            // +2 ATQ / +2 DEF & ESCUDO
            mg.succeeded = true;
            mg.wheelOutcomeLabel = 'Temple de Batalla (+2 ATAQUE, +2 ARMADURA y ESCUDO)';
            mg.rewardSummary = '+2 ATAQUE · +2 ARMADURA · ESCUDO';
            for (const p of room.players) {
              if (!p.isDead && p.hp > 0) {
                p.bonusAttack = (p.bonusAttack || 0) + 2;
                p.armor = Math.min(24, p.armor + 2);
                applyStatusEffectToPlayer(p, 'SHIELDED', 'roulette', 1, 3);
                visualEvents.push({
                  id: `ev_${ts}_wof_3_${p.id}`,
                  kind: 'GAIN_DEFENSE',
                  targetType: 'PLAYER',
                  targetId: p.id,
                  value: 2,
                  label: '+2 ATQ / +2 DEF',
                  sublabel: '+ESCUDO (3T)',
                  color: '#60A5FA',
                  vfxStyle: 'shield',
                });
              }
            }
            activeRoom.outcomeLog = `¡${player.name} gira la Rueda del Destino! Resultado: Temple de Batalla (+2 ATAQUE, +2 ARMADURA y ESCUDO).`;
            break;
          }
          case 4: {
            // RELIQUIA / +2 MAGIA
            mg.succeeded = true;
            mg.wheelOutcomeLabel = 'Favor del Oráculo (Reliquia Ancestral +2 MAGIA)';
            mg.rewardSummary = 'RELIQUIA ANCESTRAL · +2 MAGIA';
            const relicId = pickUnownedRelic(
              (room.dungeonSeed || room.seed) + activeRoom.index * 91 + ts,
              2,
              room.players,
              room.partyRelics || []
            );
            if (relicId) {
              this.grantRelicAuthoritatively(room, player, relicId, visualEvents);
            }
            for (const p of room.players) {
              if (!p.isDead && p.hp > 0) {
                p.bonusMagic = (p.bonusMagic || 0) + 2;
              }
            }
            activeRoom.outcomeLog = `¡${player.name} gira la Rueda del Destino! Resultado: Favor del Oráculo (Reliquia Ancestral y +2 MAGIA).`;
            break;
          }
          case 5: {
            // POCIÓN + 20 ORO
            mg.succeeded = true;
            mg.wheelOutcomeLabel = 'Alijo del Boticario (Poción de Curación + 20 ORO)';
            mg.rewardSummary = 'POCIÓN DE CURACIÓN · +20 ORO';
            room.partyGold = (room.partyGold ?? 0) + 20;
            room.runStats.goldEarned += 20;
            this.grantNormalItemAuthoritatively(
              room,
              player,
              'pocion_curacion',
              'CHEST',
              'WHEEL_OF_FORTUNE',
              undefined,
              visualEvents
            );
            activeRoom.outcomeLog = `¡${player.name} gira la Rueda del Destino! Resultado: Alijo del Boticario (Poción de Curación y +20 ORO).`;
            break;
          }
          case 6: {
            // DESCARGA (-10 PV pero +20 ORO)
            mg.succeeded = false;
            mg.wheelOutcomeLabel = 'Chispazo Rúnico (-10 PV y +20 ORO residuales)';
            mg.rewardSummary = 'DESCARGA RÚNICA (-10 PV · +20 ORO)';
            room.partyGold = (room.partyGold ?? 0) + 20;
            room.runStats.goldEarned += 20;
            player.hp = Math.max(4, player.hp - 10);
            visualEvents.push({
              id: `ev_${ts}_wof_6_${player.id}`,
              kind: 'DAMAGE_PLAYER',
              targetType: 'PLAYER',
              targetId: player.id,
              value: -10,
              label: '-10 PV (CHISPAZO RÚNICO)',
              sublabel: '+20 ORO RESIDUALES',
              color: '#EF4444',
            });
            activeRoom.outcomeLog = `¡${player.name} gira la Rueda del Destino! Resultado: Chispazo Rúnico (-10 PV, pero halláis +20 ORO entre las chispas).`;
            break;
          }
          default: {
            // Sector 7: ¡PREMIO MAYOR! (+55 ORO, +18 PV y BENDECIDO)
            mg.succeeded = true;
            mg.wheelOutcomeLabel = '¡PREMIO MAYOR! Corona de la Fortuna (+55 ORO, +18 PV y BENDECIDO)';
            mg.rewardSummary = '¡PREMIO MAYOR! +55 ORO · +18 PV · BENDECIDO';
            room.partyGold = (room.partyGold ?? 0) + 55;
            room.runStats.goldEarned += 55;
            for (const p of room.players) {
              if (!p.isDead && p.hp > 0) {
                p.hp = Math.min(p.maxHp, p.hp + 18);
                room.runStats.healingDone += 18;
                applyStatusEffectToPlayer(p, 'BLESSED', 'roulette_jackpot', 1, 3);
              }
            }
            visualEvents.push({
              id: `ev_${ts}_wof_7`,
              kind: 'GAIN_GOLD',
              targetType: 'PARTY',
              value: 55,
              label: '¡PREMIO MAYOR! +55 ORO · +18 PV',
              sublabel: '+BENDECIDO (3T)',
              color: '#FDE047',
              vfxStyle: 'gold',
            });
            activeRoom.outcomeLog = `¡${player.name} gira la Rueda del Destino! ¡PREMIO MAYOR: +55 ORO, +18 PV y BENDECIDO para toda la expedición!`;
            break;
          }
        }

        this.emitVisualEventBatch(room, visualEvents, player.id, 'PUZZLE');
        this.syncLegacyNodes(room);
        this.broadcastRoomState(room);
        return;
      }

      // 1. CURSED_ROULETTE
      if (family === 'CURSED_ROULETTE') {
        const sectors = mg.rouletteSectors || [];
        if (sectors.length > 0) {
          if (runeIndex === 0 || (runeIndex === 2 && mg.rouletteCanReroll)) {
            // Spin or Paid Reroll
            if (runeIndex === 2) {
              const rerollCost = mg.rouletteRerollCostGold ?? 18;
              if ((room.partyGold ?? 0) < rerollCost) {
                this.sendError(ws, 'Oro insuficiente para forzar un nuevo giro.');
                return;
              }
              room.partyGold = Math.max(0, (room.partyGold ?? 0) - rerollCost);
              mg.rouletteCanReroll = false;
            }
            const landedIdx =
              (Math.abs(room.seed + ts + activeRoom.index * 31) +
                (mg.rouletteSpinCount || 0) * 3) %
              sectors.length;
            const degPerSector = 360 / sectors.length;
            // Land pointer at top (-sector angle + 5 full rotations)
            const targetDeg = 360 * 5 + (360 - landedIdx * degPerSector);
            mg.rouletteLandedSectorIndex = landedIdx;
            mg.rouletteLandingAngleDeg = targetDeg;
            mg.rouletteSpinStartedAt = ts;
            mg.rouletteSpinCount = (mg.rouletteSpinCount || 0) + 1;
            const landedSec = sectors[landedIdx];
            activeRoom.outcomeLog = `¡${player.name} hace girar la Ruleta del Destino! La aguja se detiene en «${landedSec.label}»: ${landedSec.description}`;
            this.syncLegacyNodes(room);
            this.broadcastRoomState(room);
            return;
          }

          if (runeIndex === 1) {
            // Claim / Resolve landed sector
            const landedIdx = mg.rouletteLandedSectorIndex ?? 0;
            const sec = sectors[landedIdx] || sectors[0];
            mg.completed = true;
            mg.succeeded = sec.isPositive;
            activeRoom.resolved = true;
            activeRoom.state = 'RESOLVED';
            activeRoom.lifecyclePhase = 'READY_TO_LEAVE';

            if (sec.goldDelta && sec.goldDelta !== 0) {
              room.partyGold = Math.max(0, (room.partyGold ?? 0) + sec.goldDelta);
              if (sec.goldDelta > 0) room.runStats.goldEarned += sec.goldDelta;
              visualEvents.push({
                id: `ev_${ts}_roul_g`,
                kind: sec.goldDelta > 0 ? 'GAIN_GOLD' : 'LOSE_GOLD',
                targetType: 'PARTY',
                value: sec.goldDelta,
                label: `${sec.goldDelta > 0 ? '+' : ''}${sec.goldDelta} ORO`,
                color: sec.goldDelta > 0 ? '#FFD166' : '#C93B5B',
                vfxStyle: 'gold',
              });
            }
            if (sec.relicId) {
              this.grantRelicAuthoritatively(room, player, sec.relicId, visualEvents);
            }
            if (sec.itemId) {
              this.grantNormalItemAuthoritatively(
                room,
                player,
                sec.itemId,
                'CHEST',
                'CURSED_ROULETTE',
                undefined,
                visualEvents
              );
            }
            if (sec.weaponId) {
              player.equippedWeaponId = sec.weaponId;
            }
            for (const p of room.players) {
              if (!p.isDead && p.hp > 0) {
                if (sec.hpDelta && sec.hpDelta > 0) {
                  p.hp = Math.min(p.maxHp, p.hp + sec.hpDelta);
                } else if (sec.hpDelta && sec.hpDelta < 0) {
                  p.hp = Math.max(4, p.hp + sec.hpDelta);
                }
                if (sec.statusType) {
                  applyStatusEffectToPlayer(
                    p,
                    sec.statusType,
                    'roulette',
                    1,
                    sec.statusTurns || 2
                  );
                }
              }
            }
            mg.rewardSummary = sec.label;
            activeRoom.outcomeLog = `Destino sellado en la Ruleta: «${sec.label}». ${sec.description}`;
            this.emitVisualEventBatch(room, visualEvents, player.id, 'PUZZLE');
            this.syncLegacyNodes(room);
            this.broadcastRoomState(room);
            return;
          }
        }
      }

      // 2. CRYPT_LOCK (3 Concentric Rings)
      if (family === 'CRYPT_LOCK') {
        const angles = mg.lockRingAngles || [90, 180, 270];
        if (runeIndex >= 0 && runeIndex <= 2) {
          angles[runeIndex] = (angles[runeIndex] + 45) % 360;
          mg.lockRingAngles = [...angles];
          mg.lockRingLocked = angles.map((a) => a % 360 === 0);
          const alignedCount = mg.lockRingLocked.filter(Boolean).length;
          mg.currentStep = alignedCount;
          activeRoom.outcomeLog = `${player.name} gira el anillo #${
            runeIndex + 1
          } (${alignedCount}/3 anillos alineados en el Cenit 0°).`;
          this.syncLegacyNodes(room);
          this.broadcastRoomState(room);
          return;
        }
        if (runeIndex === 99) {
          const allAligned = angles.every((a) => a % 360 === 0);
          if (allAligned) {
            grantMinigameSuccessReward(48, 16, 'DEFENSE', true);
            mg.rewardSummary = '+48 ORO · RELIQUIA/ELIXIR · +3 ARMADURA';
            activeRoom.outcomeLog = `¡${player.name} alinea los 3 anillos astrales en el Cenit y abre la Cerradura de la Cripta! (${mg.rewardSummary})`;
          } else {
            mg.mistakes = (mg.mistakes ?? 0) + 1;
            player.hp = Math.max(4, player.hp - 6);
            if ((mg.mistakes ?? 0) >= maxMistakes) {
              mg.completed = true;
              mg.succeeded = false;
              activeRoom.resolved = true;
              activeRoom.state = 'RESOLVED';
              room.partyGold = (room.partyGold ?? 0) + 18;
              activeRoom.outcomeLog = `El cerrojo astral descarga energía (-6 PV), pero cede dejando +18 ORO.`;
            } else {
              activeRoom.outcomeLog = `Aún hay anillos fuera del Cenit (0°). ¡Alinéalos todos antes de sellar (-6 PV)!`;
            }
          }
          this.emitVisualEventBatch(room, visualEvents, player.id, 'PUZZLE');
          this.syncLegacyNodes(room);
          this.broadcastRoomState(room);
          return;
        }
      }

      // 3. SHADOW_MIRRORS (4 Rotatable Optical Mirrors)
      if (family === 'SHADOW_MIRRORS') {
        const orients = mg.mirrorOrientations || [0, 0, 0, 0];
        const sol = mg.mirrorSolution || [1, 2, 0, 3];
        if (runeIndex >= 0 && runeIndex <= 3) {
          orients[runeIndex] = (orients[runeIndex] + 1) % 4;
          mg.mirrorOrientations = [...orients];
          const alignedCount = orients.filter((o, i) => o === sol[i]).length;
          mg.currentStep = alignedCount;
          mg.mirrorTargetLit = alignedCount === 4;
          activeRoom.outcomeLog = `${player.name} rota el Espejo #${
            runeIndex + 1
          } (${alignedCount}/4 espejos en resonancia con el haz astral).`;
          this.syncLegacyNodes(room);
          this.broadcastRoomState(room);
          return;
        }
        if (runeIndex === 99) {
          const allAligned = orients.every((o, i) => o === sol[i]);
          if (allAligned) {
            grantMinigameSuccessReward(52, 18, 'MAGIC', true);
            mg.rewardSummary = '+52 ORO · RELIQUIA · +1 MAGIA · BENDECIDO';
            activeRoom.outcomeLog = `¡El haz purificador ilumina el Cristal del Eclipse! (${mg.rewardSummary})`;
          } else {
            mg.mistakes = (mg.mistakes ?? 0) + 1;
            player.hp = Math.max(4, player.hp - 6);
            if ((mg.mistakes ?? 0) >= maxMistakes) {
              mg.completed = true;
              mg.succeeded = false;
              activeRoom.resolved = true;
              activeRoom.state = 'RESOLVED';
              room.partyGold = (room.partyGold ?? 0) + 18;
              activeRoom.outcomeLog = `El haz refractado sobrecarga los pedestales (-6 PV) y abre el umbral (+18 ORO).`;
            } else {
              activeRoom.outcomeLog = `El haz aún no alcanza el Cristal Receptor. ¡Alinea los 4 espejos antes de canalizar!`;
            }
          }
          this.emitVisualEventBatch(room, visualEvents, player.id, 'PUZZLE');
          this.syncLegacyNodes(room);
          this.broadcastRoomState(room);
          return;
        }
      }

      // 4. SOUL_CHAINS (Sever 2 Weak Links, Avoid Trap Link)
      if (family === 'SOUL_CHAINS') {
        const weak = mg.chainsWeakIndices || [0, 2];
        const broken = mg.chainsBroken || [false, false, false, false];
        if (weak.includes(runeIndex)) {
          broken[runeIndex] = true;
          mg.chainsBroken = [...broken];
          const cutWeakCount = weak.filter((idx) => broken[idx]).length;
          mg.currentStep = cutWeakCount;
          if (cutWeakCount >= weak.length) {
            grantMinigameSuccessReward(46, 16, 'ATTACK', true);
            mg.rewardSummary = '+46 ORO · +1 ATAQUE · RELIQUIA LIBERADA';
            activeRoom.outcomeLog = `¡${player.name} rompe las Cadenas de Ánima y libera el relicario! (${mg.rewardSummary})`;
          } else {
            activeRoom.outcomeLog = `¡${player.name} parte el eslabón fisurado #${
              runeIndex + 1
            }! Falta 1 cadena débil por cortar.`;
          }
        } else {
          mg.mistakes = (mg.mistakes ?? 0) + 1;
          const dmg = runeIndex === mg.chainsTrapIndex ? 9 : 5;
          player.hp = Math.max(4, player.hp - dmg);
          applyStatusEffectToPlayer(player, 'VULNERABLE', 'chains', 1, 2);
          if ((mg.mistakes ?? 0) >= maxMistakes) {
            mg.completed = true;
            mg.succeeded = false;
            activeRoom.resolved = true;
            activeRoom.state = 'RESOLVED';
            room.partyGold = (room.partyGold ?? 0) + 16;
            activeRoom.outcomeLog = `La cadena maldita descarga su furia (-${dmg} PV) antes de romperse (+16 ORO).`;
          } else {
            activeRoom.outcomeLog = `¡Eslabón equivocado (-${dmg} PV a ${player.name})! Corta solo las cadenas con fisuras incandescentes.`;
          }
        }
        this.emitVisualEventBatch(room, visualEvents, player.id, 'PUZZLE');
        this.syncLegacyNodes(room);
        this.broadcastRoomState(room);
        return;
      }

      // 5. COOP_GAMBLE_CHEST (Push-Your-Luck Coffer)
      if (family === 'COOP_GAMBLE_CHEST') {
        const tier = mg.gambleChestTier || 1;
        const accGold = mg.gambleAccumulatedGold || 28;
        if (runeIndex === 1) {
          // Cash out safely
          grantMinigameSuccessReward(accGold, 14, 'DEFENSE', tier >= 2);
          mg.rewardSummary = `+${accGold} ORO SEGURO · +14 PV`;
          activeRoom.outcomeLog = `¡${player.name} asegura el botín del Arca de las Ánimas en el Nivel ${tier} (+${accGold} ORO)!`;
        } else {
          // Push luck
          const roll = Math.abs(room.seed + ts + activeRoom.index * 19 + tier * 37) % 100;
          const curseChance = mg.gambleCurseChancePct || 20;
          if (roll < curseChance) {
            // Triggered curse!
            mg.completed = true;
            mg.succeeded = false;
            activeRoom.resolved = true;
            activeRoom.state = 'RESOLVED';
            for (const p of room.players) {
              if (!p.isDead && p.hp > 0) {
                p.hp = Math.max(4, p.hp - 8);
                applyStatusEffectToPlayer(p, 'CURSE', 'gamble_chest', 1, 2);
              }
            }
            const consolation = Math.max(12, Math.floor(accGold * 0.4));
            room.partyGold = (room.partyGold ?? 0) + consolation;
            activeRoom.outcomeLog = `¡El Sello Abisal despierta una maldición (-8 PV y MALDICIÓN)! Rescatáis +${consolation} ORO entre las brasas.`;
          } else {
            const nextTier = tier + 1;
            const nextGold = accGold + 30;
            mg.gambleChestTier = nextTier;
            mg.gambleAccumulatedGold = nextGold;
            mg.gambleCurseChancePct = Math.min(65, curseChance + 20);
            mg.currentStep = nextTier - 1;
            if (nextTier >= (mg.gambleMaxTier || 3)) {
              grantMinigameSuccessReward(nextGold, 20, 'ATTACK', true);
              mg.rewardSummary = `+${nextGold} ORO · RELIQUIA · +20 PV`;
              activeRoom.outcomeLog = `¡${player.name} conquista el Sello Maestro del Arca de las Ánimas! (${mg.rewardSummary})`;
            } else {
              activeRoom.outcomeLog = `¡Sello de Nivel ${nextTier} abierto! Botín acumulado: +${nextGold} ORO. ¿Plantarse o arriesgar el sello final?`;
            }
          }
        }
        this.emitVisualEventBatch(room, visualEvents, player.id, 'PUZZLE');
        this.syncLegacyNodes(room);
        this.broadcastRoomState(room);
        return;
      }

      // 6. FORBIDDEN_COFFERS (Deduction of 3 Relic Coffers)
      if (family === 'FORBIDDEN_COFFERS') {
        const trueIdx = mg.cofferTrueIndex ?? 0;
        const mimicIdx = mg.cofferMimicIndex ?? 1;
        if (runeIndex === trueIdx) {
          grantMinigameSuccessReward(54, 18, 'MAGIC', true);
          mg.rewardSummary = '+54 ORO · RELIQUIA VERDADERA · +18 PV';
          activeRoom.outcomeLog = `¡${player.name} deduce las inscripciones y abre el Cofre Verdadero! (${mg.rewardSummary})`;
        } else if (runeIndex === mimicIdx) {
          mg.completed = true;
          mg.succeeded = false;
          activeRoom.resolved = true;
          activeRoom.state = 'RESOLVED';
          player.hp = Math.max(4, player.hp - 10);
          applyStatusEffectToPlayer(player, 'BLEED', 'mimic_coffer', 1, 2);
          room.partyGold = (room.partyGold ?? 0) + 15;
          activeRoom.outcomeLog = `¡Trampa de Cofre Mímico (-10 PV y SANGRADO a ${player.name})! Halláis +15 ORO tras destruir el mecanismo.`;
        } else {
          // Minor coffer
          mg.completed = true;
          mg.succeeded = true;
          activeRoom.resolved = true;
          activeRoom.state = 'RESOLVED';
          room.partyGold = (room.partyGold ?? 0) + 28;
          room.runStats.goldEarned += 28;
          activeRoom.outcomeLog = `${player.name} abre el cofre secundario: obtenéis +28 ORO sin activar la trampa.`;
        }
        this.emitVisualEventBatch(room, visualEvents, player.id, 'PUZZLE');
        this.syncLegacyNodes(room);
        this.broadcastRoomState(room);
        return;
      }

      if (mg.minigameType === 'ALCHEMICAL_BALANCE' || family === 'ALCHEMICAL_BALANCE') {
        if (runeIndex === 3) {
          // Stabilize flask now!
          if (currentMeter >= 65 && currentMeter <= 90) {
            grantMinigameSuccessReward(38, 18, 'MAGIC', true);
            mg.rewardSummary = '+38 ORO · +18 PV · +1 MAGIA · ELIXIR DESTILADO';
            activeRoom.outcomeLog = `¡${player.name} estabiliza el matraz al ${currentMeter}% de resonancia exacta! (${mg.rewardSummary})`;
          } else {
            mg.mistakes = (mg.mistakes ?? 0) + 1;
            player.hp = Math.max(4, player.hp - 6);
            visualEvents.push({
              id: `ev_${ts}_mg_err_${player.id}`,
              kind: 'DAMAGE_PLAYER',
              targetType: 'PLAYER',
              targetId: player.id,
              value: -6,
              label: '-6 PV (MEZCLA INESTABLE)',
              color: '#C93B5B',
            });
            if ((mg.mistakes ?? 0) >= maxMistakes) {
              mg.completed = true;
              mg.succeeded = false;
              activeRoom.resolved = true;
              activeRoom.state = 'RESOLVED';
              room.partyGold = (room.partyGold ?? 0) + 15;
              activeRoom.outcomeLog = `El matraz se agota tras varios intentos. Recuperáis +15 ORO de los residuos.`;
            } else {
              activeRoom.outcomeLog = `La mezcla aún está al ${currentMeter}% (zona óptima: 70%–85%). ¡Ajusta los reactivos antes de estabilizar!`;
            }
          }
        } else {
          const delta = runeIndex === 0 ? 22 : runeIndex === 1 ? -12 : 14;
          const nextMeter = Math.max(0, currentMeter + delta);
          mg.alchemicalMeter = nextMeter;
          if (!mg.playerInputs) mg.playerInputs = [];
          mg.playerInputs.push(runeIndex);
          mg.currentStep = (mg.currentStep ?? 0) + 1;

          if (nextMeter >= 70 && nextMeter <= 86) {
            grantMinigameSuccessReward(38, 18, 'MAGIC', true);
            mg.rewardSummary = '+38 ORO · +18 PV · +1 MAGIA · ELIXIR PERFECTO';
            activeRoom.outcomeLog = `¡${player.name} alcanza la resonancia alquímica perfecta (${nextMeter}%)! (${mg.rewardSummary})`;
          } else if (nextMeter > 90) {
            mg.mistakes = (mg.mistakes ?? 0) + 1;
            mg.alchemicalMeter = 25;
            mg.currentStep = 0;
            mg.playerInputs = [];
            player.hp = Math.max(4, player.hp - 7);
            visualEvents.push({
              id: `ev_${ts}_mg_boom_${player.id}`,
              kind: 'DAMAGE_PLAYER',
              targetType: 'PLAYER',
              targetId: player.id,
              value: -7,
              label: '-7 PV (SOBRECARGA ALQUÍMICA)',
              color: '#C93B5B',
            });
            if ((mg.mistakes ?? 0) >= maxMistakes) {
              mg.completed = true;
              mg.succeeded = false;
              activeRoom.resolved = true;
              activeRoom.state = 'RESOLVED';
              room.partyGold = (room.partyGold ?? 0) + 15;
              activeRoom.outcomeLog = `El alambique estalla por sobrecarga (-7 PV). Rescatáis +15 ORO entre las cenizas.`;
            } else {
              activeRoom.outcomeLog = `¡Sobrecarga (${nextMeter}%)! El matraz chisporrotea (-7 PV a ${player.name}) y vuelve al 25%.`;
            }
          } else {
            activeRoom.outcomeLog = `${player.name} vierte reactivo: resonancia al ${nextMeter}% (objetivo: 70%–85%).`;
          }
        }

        this.emitVisualEventBatch(room, visualEvents, player.id, 'PUZZLE');
        this.syncLegacyNodes(room);
        this.broadcastRoomState(room);
        return;
      }

      // RUNE_SEQUENCE, LOCKPICK_TIMING, TRAP_STEPPING
      const targetSeq = mg.targetSequence || mg.targetPattern || [];
      const currStep = mg.currentStep ?? mg.step ?? 0;
      const expectedTarget = targetSeq[currStep] ?? 0;
      const isTimingSuccess = runeIndex === 100 || runeIndex === expectedTarget;

      if (isTimingSuccess) {
        if (!mg.playerInputs) mg.playerInputs = [];
        mg.playerInputs.push(expectedTarget);
        if (mg.family === 'PRESSURE_SIGILS') {
          mg.sigilLockedPlates = [...(mg.sigilLockedPlates || []), expectedTarget];
        }
        const updatedStep = currStep + 1;
        mg.currentStep = updatedStep;
        mg.step = updatedStep;
        if (activeRoom.puzzleRunes && !activeRoom.puzzleRunes.currentInput.includes(expectedTarget)) {
          activeRoom.puzzleRunes.currentInput.push(expectedTarget);
        }

        if (updatedStep >= mg.maxSteps) {
          if (mg.minigameType === 'LOCKPICK_TIMING') {
            grantMinigameSuccessReward(50, 15, 'DEFENSE', true);
            mg.rewardSummary = '+50 ORO · RELIQUIA/BOTÍN · +3 ARMADURA';
            activeRoom.outcomeLog = `¡${player.name} desbloquea los 3 pernos maestros sin activar la aguja! (${mg.rewardSummary})`;
          } else if (mg.minigameType === 'TRAP_STEPPING') {
            grantMinigameSuccessReward(35, 14, 'DEFENSE', false);
            mg.rewardSummary = '+35 ORO · +3 ARMADURA · TRAMPA DESACTIVADA';
            activeRoom.outcomeLog = `¡${player.name} cruza las losas seguras y desactiva el mecanismo de la cámara! (${mg.rewardSummary})`;
          } else {
            grantMinigameSuccessReward(40, 16, 'MAGIC', false);
            mg.rewardSummary = '+40 ORO · +16 PV · +1 MAGIA · SELLO ABIERTO';
            activeRoom.outcomeLog = `¡${player.name} completa la secuencia de glifos ancestrales! (${mg.rewardSummary})`;
          }
        } else {
          visualEvents.push({
            id: `ev_${ts}_mg_step`,
            kind: 'ROOM_REWARD',
            targetType: 'ROOM',
            label: `✦ PASO ${updatedStep}/${mg.maxSteps} COMPLETADO`,
            color: '#FFD166',
            vfxStyle: 'arcane',
          });
          activeRoom.outcomeLog = `${player.name} acierta el paso ${updatedStep}/${mg.maxSteps} de «${mg.title}».`;
        }
      } else {
        mg.mistakes = (mg.mistakes ?? 0) + 1;
        const mistakeNum = mg.mistakes;
        mg.attemptsRemaining = Math.max(0, maxMistakes - mistakeNum);

        // Varied, meaningful puzzle consequences (Sections 40-44):
        // Mistake 1 -> Arcane Trap Shock (-8 PV + Status or Party -6 PV)
        // Mistake 2 -> Seal Curse / Gold Tribute (-7 PV, -10 ORO & MALDICIÓN 2T)
        // Mistake 3 (Final) -> Mechanism Collapses (-10 PV to party, seal locks with 0 bonus gold)
        const baseTrapDmg = mg.minigameType === 'TRAP_STEPPING' ? 9 : mistakeNum >= maxMistakes ? 10 : 7;
        const currentGold = room.partyGold ?? 0;

        if (mistakeNum === 2 && currentGold >= 8) {
          const goldLost = Math.min(currentGold, 10);
          room.partyGold = currentGold - goldLost;
          player.hp = Math.max(0, player.hp - baseTrapDmg);
          if (!room.runStats) room.runStats = buildDefaultRunStats();
          room.runStats.damageReceived += baseTrapDmg;
          const appliedCurse = applyStatusEffectToPlayer(player, 'CURSE', 'puzzle_trap', 1, 2);
          visualEvents.push(
            {
              id: `ev_${ts}_mg_gold_${player.id}`,
              kind: 'LOSE_GOLD',
              targetType: 'PARTY',
              value: -goldLost,
              label: `-${goldLost} ORO (TRIBUTO FORZADO)`,
              color: '#E7A54A',
              vfxStyle: 'gold',
            },
            {
              id: `ev_${ts}_mg_fail_${player.id}`,
              kind: 'DAMAGE_PLAYER',
              targetType: 'PLAYER',
              targetId: player.id,
              value: -baseTrapDmg,
              label: `-${baseTrapDmg} PV (SELLO MALDITO)`,
              sublabel: appliedCurse ? '+MALDICIÓN (2T)' : 'DESCARGA RÚNICA',
              color: '#C93B5B',
            }
          );
          mg.lastPenaltyDetail = {
            penaltyType: 'CURSE_DEBUFF',
            title: 'MALDICIÓN DEL SELLO RÚNICO',
            description: `${player.name} sufre -${baseTrapDmg} PV, recibe MALDICIÓN (2T) y el altar drena -${goldLost} ORO.`,
            hpLost: baseTrapDmg,
            goldLost,
            statusApplied: 'MALDICIÓN (2T)',
            targetPlayerName: player.name,
            mistakeNumber: mistakeNum,
            maxMistakes,
            timestamp: ts,
          };
        } else {
          player.hp = Math.max(0, player.hp - baseTrapDmg);
          if (!room.runStats) room.runStats = buildDefaultRunStats();
          room.runStats.damageReceived += baseTrapDmg;
          const debuffType =
            room.selectedDungeonId === 'jardin_podrido'
              ? 'POISON'
              : room.selectedDungeonId === 'forja_infernal'
              ? 'BURN'
              : 'WEAKENED';
          const appliedSt = applyStatusEffectToPlayer(player, debuffType, 'puzzle_trap', 1, 2);
          visualEvents.push({
            id: `ev_${ts}_mg_fail_${player.id}`,
            kind: 'DAMAGE_PLAYER',
            targetType: 'PLAYER',
            targetId: player.id,
            value: -baseTrapDmg,
            label: `-${baseTrapDmg} PV (TRAMPA RÚNICA)`,
            sublabel: appliedSt ? `+${appliedSt.name.toUpperCase()} (2T)` : 'FALLO DE MECANISMO',
            color: '#C93B5B',
          });
          mg.lastPenaltyDetail = {
            penaltyType: mistakeNum >= maxMistakes ? 'MECHANISM_SEALED' : 'HP_DRAIN',
            title:
              mistakeNum >= maxMistakes
                ? 'MECANISMO COLAPSADO — PASO FORZADO'
                : 'TRAMPA RÚNICA ACTIVADA',
            description: `${player.name} sufre -${baseTrapDmg} PV${
              appliedSt ? ` y ${appliedSt.name.toUpperCase()} (2T)` : ''
            } por activar el glifo incorrecto.`,
            hpLost: baseTrapDmg,
            statusApplied: appliedSt ? `${appliedSt.name.toUpperCase()} (2T)` : undefined,
            targetPlayerName: player.name,
            mistakeNumber: mistakeNum,
            maxMistakes,
            timestamp: ts,
          };
        }

        if (player.hp <= 0) {
          player.hp = 0;
          player.isDead = true;
          player.deathsCount = (player.deathsCount || 0) + 1;
          player.statuses = [];
          visualEvents.push({
            id: `ev_${ts}_p_death_puz_${player.id}`,
            kind: 'PLAYER_DEATH',
            targetType: 'PLAYER',
            targetId: player.id,
            label: `¡${player.name.toUpperCase()} HA CAÍDO!`,
            sublabel: `TRAMPA DE «${mg.title.toUpperCase()}»`,
            color: '#E03E52',
            vfxStyle: 'explosion',
          });
        }

        this.checkAndApplyPartyDefeat(
          room,
          `Aplastados por la trampa de «${mg.title}»`,
          mg.title,
          visualEvents
        );

        if ((mg.mistakes ?? 0) >= maxMistakes) {
          mg.completed = true;
          mg.succeeded = false;
          activeRoom.resolved = true;
          activeRoom.state = 'RESOLVED';
          if (activeRoom.puzzleRunes) activeRoom.puzzleRunes.solved = true;
          mg.rewardSummary = 'MECANISMO SELLADO — SIN RECOMPENSA RÚNICA';
          activeRoom.outcomeLog = `¡El mecanismo de «${mg.title}» se bloquea tras ${maxMistakes} fallos (-${baseTrapDmg} PV a ${player.name})! La compuerta cede pero el tesoro rúnico se pierde.`;
        } else {
          if (mg.minigameType === 'RUNE_SEQUENCE') {
            mg.currentStep = 0;
            mg.step = 0;
            mg.playerInputs = [];
            if (activeRoom.puzzleRunes) activeRoom.puzzleRunes.currentInput = [];
          }
          activeRoom.outcomeLog = `¡Secuencia incorrecta en «${mg.title}» (-${baseTrapDmg} PV a ${player.name})! Intentos restantes: ${
            maxMistakes - (mg.mistakes ?? 0)
          }.`;
        }
      }

      this.emitVisualEventBatch(room, visualEvents, player.id, 'PUZZLE');
      this.syncLegacyNodes(room);
      this.broadcastRoomState(room);
      return;
    }

    if (!activeRoom.puzzleRunes || activeRoom.puzzleRunes.solved) return;

    if (!activeRoom.puzzleRunes.currentInput.includes(runeIndex)) {
      activeRoom.puzzleRunes.currentInput.push(runeIndex);
    }

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
    if (room.phase !== 'DUNGEON' && room.phase !== 'DUNGEON_ARRIVAL') {
      this.logRejectedTransition(
        room,
        'ROOM_ADVANCE',
        `Cannot advance room while run phase is ${room.phase}`
      );
      return;
    }
    if (room.expeditionDefeated) {
      this.logRejectedTransition(room, 'ROOM_ADVANCE', 'Expedition is defeated');
      return;
    }
    // Prevent double transitions or transitioning while combat round is still resolving
    if (room.roomDoorTransition?.active || room.isResolvingRound) {
      this.logRejectedTransition(
        room,
        'ROOM_ADVANCE',
        `Door transition already active (${Boolean(room.roomDoorTransition?.active)}) or round resolving (${room.isResolvingRound})`
      );
      return;
    }

    const activeRoom = this.getActiveDungeonRoom(room);
    if (!activeRoom) {
      this.logRejectedTransition(room, 'ROOM_ADVANCE', 'No active room found');
      return;
    }

    // Allow SHOP, REST, and LOOT rooms to be exited once players choose to leave
    const canLeaveRoom =
      activeRoom.resolved ||
      activeRoom.type === 'SHOP' ||
      activeRoom.type === 'REST' ||
      activeRoom.type === 'LOOT';

    if (!canLeaveRoom) {
      this.logRejectedTransition(
        room,
        'ROOM_ADVANCE',
        `Room ${activeRoom.id} (${activeRoom.type}) is not yet resolved`
      );
      return;
    }

    // Clear any stale pendingInventoryReplacement so it never soft-locks room exit!
    for (const p of room.players) {
      if (p.pendingInventoryReplacement) {
        p.pendingInventoryReplacement = null;
      }
    }

    // Auto-claim any unclaimed Relics and fitting Consumable Drops on the floor before exiting!
    if (activeRoom.groundDrops && activeRoom.groundDrops.length > 0) {
      const claimEvents: CriptaVisualEvent[] = [];
      const recipient =
        !player.isDead && player.hp > 0
          ? player
          : room.players.find((p) => p.isConnected && !p.isDead && p.hp > 0) || player;
      for (const drop of activeRoom.groundDrops) {
        if (drop.claimedByPlayerId) continue;
        if (drop.kind === 'RELIC' && drop.relicId) {
          drop.claimedByPlayerId = recipient.id;
          drop.claimedByPlayerName = recipient.name;
          this.grantRelicAuthoritatively(room, recipient, drop.relicId, claimEvents);
        } else if (drop.kind === 'ITEM' && drop.itemId) {
          const recipientWithSpace =
            room.players.find(
              (p) =>
                p.isConnected &&
                !p.isDead &&
                p.hp > 0 &&
                (p.normalInventory || []).length < NORMAL_INVENTORY_MAX_SLOTS
            ) || null;
          if (recipientWithSpace) {
            this.grantNormalItemAuthoritatively(
              room,
              recipientWithSpace,
              drop.itemId,
              'DROP',
              drop.id,
              undefined,
              claimEvents
            );
          }
          drop.claimedByPlayerId = (recipientWithSpace || recipient).id;
          drop.claimedByPlayerName = (recipientWithSpace || recipient).name;
        }
      }
      if (claimEvents.length > 0) {
        this.emitVisualEventBatch(room, claimEvents, recipient.id, 'CLAIM_DROP');
      }
    }

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

    // In Solo mode or when all living connected players (or host majority) are ready, start the Giant Door Transition!
    const shouldAdvance =
      isSolo ||
      readyCount >= activeDecisionPlayers.length ||
      (player.isHost && readyCount >= Math.ceil(activeDecisionPlayers.length / 2));

    if (!shouldAdvance) {
      activeRoom.lifecyclePhase = 'READY_TO_LEAVE';
      this.broadcastRoomState(room);
      return;
    }

    const seq = room.roomSequence || [];
    const currentIdx = room.currentRoomIndex ?? 0;
    const nextIdx = currentIdx + 1;
    const isLeavingSecret = Boolean(room.inSecretRoom);
    const mainRoomWhenLeavingSecret = isLeavingSecret ? seq[currentIdx] : null;
    const isEndOfDungeon = isLeavingSecret
      ? Boolean(mainRoomWhenLeavingSecret?.resolved && nextIdx >= seq.length)
      : nextIdx >= seq.length;

    const targetNextRoom = isLeavingSecret
      ? !mainRoomWhenLeavingSecret?.resolved
        ? mainRoomWhenLeavingSecret
        : !isEndOfDungeon
        ? seq[nextIdx]
        : null
      : !isEndOfDungeon
      ? seq[nextIdx]
      : null;

    // Begin STAGE 1-3 of Giant Door Transition (Door Closes & Seals over the current room for 820ms)
    activeRoom.lifecyclePhase = 'EXITING';
    const transitionStartedAt = Date.now();
    room.transitioningToRoomIndex = isEndOfDungeon
      ? currentIdx
      : targetNextRoom?.index ?? nextIdx;
    room.roomDoorTransition = {
      active: true,
      fromRoomIndex: currentIdx,
      toRoomIndex: isEndOfDungeon ? currentIdx : targetNextRoom?.index ?? nextIdx,
      fromDungeonId: room.selectedDungeonId || 'catacumbas_del_rey',
      targetRoomType: isEndOfDungeon
        ? 'MINIBOSS'
        : targetNextRoom?.type || 'COMBAT',
      targetRoomTitle: isEndOfDungeon
        ? 'Cámara de las Tres Puertas'
        : targetNextRoom?.title || 'Siguiente Cámara',
      isEnteringMiniboss: Boolean(
        !isEndOfDungeon && targetNextRoom?.type === 'MINIBOSS'
      ),
      isReturningToDoors: isEndOfDungeon,
      startedAt: transitionStartedAt,
    };

    this.broadcastRoomState(room);

    if (room.roomTransitionTimer) {
      clearTimeout(room.roomTransitionTimer);
    }

    // At 820ms (while the Giant Door is sealed shut), swap the authoritative room behind the door!
    room.roomTransitionTimer = setTimeout(() => {
      room.roomTransitionTimer = null;

      if (isLeavingSecret && !isEndOfDungeon) {
        room.inSecretRoom = false;
        const mainRoom = (room.roomSequence || [])[room.currentRoomIndex ?? 0];
        if (mainRoom && mainRoom.resolved) {
          const nIdx = (room.currentRoomIndex ?? 0) + 1;
          if (room.roomSequence && nIdx < room.roomSequence.length) {
            this.activateDungeonRoomAtIndex(room, nIdx);
          }
        } else if (mainRoom) {
          mainRoom.lifecyclePhase = 'ACTIVE';
          mainRoom.readyToAdvancePlayerIds = [];
        }
        this.syncLegacyNodes(room);
        this.broadcastRoomState(room);
      } else if (isEndOfDungeon) {
        // Leaving completed Miniboss room -> return to Three Doors chamber!
        room.inSecretRoom = false;
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
          const allDungeonIds = Object.keys(
            CRIPTA_DUNGEONS_REGISTRY
          ) as CriptaDungeonId[];
          for (const fallbackId of allDungeonIds) {
            if (
              room.completedDungeonIds.length < 3 &&
              !room.completedDungeonIds.includes(fallbackId)
            ) {
              room.completedDungeonIds.push(fallbackId);
            }
          }
          room.offeredDungeons = [];
        }
        room.doorVotes = {};
        room.finalBossDoorVotes = {};
        room.voteTieWarning = false;
        room.decisionResolved = false;
        room.selectedDungeonId = null;
        room.doorOpeningStartedAt = null;
        room.dungeonCompleted = false;
        room.inSecretRoom = false;
        room.transitioningToRoomIndex = null;
        room.roomDoorTransition = null;
        room.phase =
          room.completedDoorCount >= 3
            ? 'FINAL_BOSS_DOOR_READY'
            : 'RETURNING_TO_DOORS';

        this.emitVisualEventBatch(room, visualEvents, player.id, 'DOOR_CLEAR');
        this.broadcastRoomState(room);

        if (room.doorOpeningTimer) {
          clearTimeout(room.doorOpeningTimer);
          room.doorOpeningTimer = null;
        }
        if (room.phase === 'RETURNING_TO_DOORS') {
          room.doorOpeningTimer = setTimeout(() => {
            room.doorOpeningTimer = null;
            if (room.phase === 'RETURNING_TO_DOORS') {
              room.phase =
                (room.completedDoorCount ?? 0) >= 3
                  ? 'FINAL_BOSS_DOOR_READY'
                  : 'THREE_DOORS';
              this.broadcastRoomState(room);
            }
          }, 1400);
        }
        return;
      } else {
        this.activateDungeonRoomAtIndex(room, nextIdx);
        this.syncLegacyNodes(room);
        this.broadcastRoomState(room);
      }

      // STAGE 5-6: Giant Door swings open over 780ms to reveal the new room, then unlocks controls
      room.roomTransitionTimer = setTimeout(() => {
        room.roomTransitionTimer = null;
        room.transitioningToRoomIndex = null;
        room.roomDoorTransition = null;
        const currRoom = this.getActiveDungeonRoom(room);
        if (currRoom) {
          currRoom.lifecyclePhase = currRoom.resolved ? 'READY_TO_LEAVE' : 'ACTIVE';
        }
        this.broadcastRoomState(room);
      }, 780);
    }, 820);
  }

  private activateDungeonRoomAtIndex(room: ServerCriptaRoom, nextIdx: number) {
    const seq = room.roomSequence || [];
    if (nextIdx < 0 || nextIdx >= seq.length) return;

    room.currentRoomIndex = nextIdx;
    if (!room.runStats) room.runStats = buildDefaultRunStats();
    room.runStats.roomsVisited += 1;
    const nextRoom = seq[nextIdx];
    nextRoom.revealed = true;
    nextRoom.visited = true;
    nextRoom.lifecyclePhase = 'ENTERING';
    nextRoom.state = nextRoom.type === 'SHOP' ? 'RESOLVED' : 'IN_PROGRESS';
    if (nextRoom.type === 'SHOP') {
      nextRoom.resolved = true;
      const preferredClasses = room.players
        .map((p) => p.characterId)
        .filter((c): c is CriptaCharacterId => Boolean(c));
      const excludedRelics = [
        ...(room.partyRelics || []).map((r) => r.relicId),
        ...room.players.flatMap((p) => (p.personalRelics || []).map((r) => r.relicId)),
      ];
      const excludedWeapons = room.players
        .map((p) => p.equippedWeaponId)
        .filter((w): w is NonNullable<typeof w> => Boolean(w));

      const freshShop = generateShopInventoryForRoom(
        (room.dungeonSeed || room.seed) + nextRoom.index * 97,
        nextRoom.index,
        this.hasPartyRelic(room, 'moneda_del_muerto'),
        preferredClasses,
        excludedRelics,
        excludedWeapons,
        nextRoom.shopRerollCount || 0
      );
      nextRoom.shopInventory = freshShop;
      nextRoom.shopSlots = freshShop.map((s) => ({ ...s }));
    }

    for (const p of room.players) {
      p.basicAttackUsedThisTurn = false;
      p.abilityCooldowns = {};
      p.weaponSpecialCooldown = 0;
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
      nextRoom.combatTurn = 1;
      nextRoom.combatRoundPhase = 'PLAYER_PHASE';
      nextRoom.combatBannerText =
        nextRoom.type === 'MINIBOSS'
          ? `¡MINIBOSS DE MAZMORRA: ${(nextRoom.enemies[0]?.name || 'GUARDIÁN').toUpperCase()}!`
          : 'RONDA 1 — FASE DE JUGADORES';
      nextRoom.queuedPlayerActions = {};
      nextRoom.activeCombatActorId = null;
      nextRoom.activeTargetedPlayerIds = [];
      nextRoom.actedPlayerIdsThisRound = [];
      const firstPlayerId = this.computeNextTurnPlayerId(room, nextRoom);
      this.assignFreshPlayerTurn(nextRoom, firstPlayerId);
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
      const preferredClasses = room.players
        .map((p) => p.characterId)
        .filter((c): c is CriptaCharacterId => Boolean(c));
      const ownedRelics = [
        ...(room.partyRelics || []).map((r) => r.relicId),
        ...room.players.flatMap((p) => (p.personalRelics || []).map((r) => r.relicId)),
      ];
      const ownedWeapons = room.players
        .map((p) => p.equippedWeaponId)
        .filter((w): w is NonNullable<typeof w> => Boolean(w));

      const generatedDungeon = generateProceduralDungeon(
        chosenDungeonId,
        room.seed,
        connectedPlayers.length,
        hasDiscountRelic,
        preferredClasses,
        ownedRelics,
        ownedWeapons
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
        this.assignFreshPlayerTurn(firstRoom, firstLiving ? firstLiving.id : null);
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
      this.checkAndTriggerRoundResolutionIfReady(room);
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
      if (room.combatRoundTimer) clearTimeout(room.combatRoundTimer);
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
