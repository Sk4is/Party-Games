import { WebSocketServer, WebSocket } from 'ws';
import {
  FortunariumRoomState,
  FortunariumPlayer,
  FortunariumPlayerStats,
  FortunariumConfig,
  FortunariumClientMessage,
  FortunariumServerMessage,
  FortunariumSymbolId,
  FortunariumUpgradeId,
  FortunariumSpinResult,
  FortunariumActiveEvent,
  FortunariumActionLogEntry,
  FortunariumModifierId,
  FortunariumIncidentType,
  FortunariumActiveIncident,
  FortunariumEffectRouletteState,
  FortunariumPlayerSessionStats,
  FortunariumRoomSessionSummary,
} from '../src/types/fortunarium';
import {
  FORTUNARIUM_UPGRADES_CATALOG,
  ALL_UPGRADE_IDS,
  createInitialUpgradesState,
  getUpgradeCostMoney,
  calculateEffectiveSpinCost,
  FORTUNARIUM_MODIFIERS_CATALOG,
  ALL_MODIFIER_IDS,
} from '../src/data/fortunarium/fortunariumAssets';
import {
  generateAuthoritativeGrid,
  generateDeterministicTestGrid,
  evaluateSpinGridCore,
  calculateInitialQuota,
  calculateNextQuotaTarget,
  validateWorkshopPurchase,
  calculateRepairCost,
  calculateIncidentProbability,
  isBigWinSpin,
  rollSynergyWeightedUpgrades,
} from '../src/utils/fortunariumEconomyEngine';
import { roomRegistry } from './roomRegistry';

interface ClientConnection {
  ws: WebSocket;
  playerId: string;
  roomCode: string;
}

interface MatchParticipantRecord {
  player: FortunariumPlayer;
  quotasCompletedWhilePresent: number;
}

interface ServerFortunariumRoom extends FortunariumRoomState {
  hostId: string;
  spinTimer: NodeJS.Timeout | null;
  disconnectTimers: Map<string, NodeJS.Timeout>;
  spinsSinceLastIncident: number;
  processedMatchIds: Set<string>;
  nextSessionJoinOrder: number;
  currentMatchQuotasCompleted: number;
  currentMatchParticipants: Map<string, MatchParticipantRecord>;
}

const DEFAULT_CONFIG: FortunariumConfig = {
  totalRounds: 5,
  difficulty: 'normal',
  turnMode: 'turns',
};

const STARTING_CREDITS = 140;

function createEmptyStats(): FortunariumPlayerStats {
  return {
    spinsTriggered: 0,
    totalMoneyGenerated: 0,
    totalMoneyLost: 0,
    netBalance: 0,
    biggestSingleWin: 0,
    biggestSingleLoss: 0,
    patternsHit: 0,
    specialSymbolsTriggered: 0,
    jackpotsHit: 0,
    bombsTriggered: 0,
    bombsDefused: 0,
    skullsTriggered: 0,
    coinsCollected: 0,
    keysFound: 0,
    integrityDamageCaused: 0,
    integrityRepaired: 0,
    repairsCount: 0,
    upgradesBought: 0,
  };
}

function createDefaultGrid(): FortunariumSymbolId[][] {
  return [
    ['cereza', 'siete', 'limon'],
    ['campana', 'corona', 'naranja'],
    ['diamante', 'siete', 'trebol'],
    ['herradura', 'estrella', 'ciruela'],
    ['uvas', 'campana', 'cereza'],
  ];
}

export class FortunariumServer {
  public wss: WebSocketServer;
  private rooms = new Map<string, ServerFortunariumRoom>();
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
        const msg = JSON.parse(data.toString()) as FortunariumClientMessage;
        this.handleClientMessage(ws, msg);
      } catch (err) {
        console.error('[FortunariumServer] Error parsing message:', err);
      }
    });

    ws.on('close', () => {
      this.handleDisconnect(ws);
    });

    ws.on('error', (err) => {
      console.error('[FortunariumServer] WebSocket error:', err);
    });
  }

  public getRoomInfo(code: string) {
    const cleanCode = code.toUpperCase().trim();
    const room = this.rooms.get(cleanCode);
    if (!room) return null;
    const connectedCount = room.players.filter((p) => p.isConnected).length;
    return {
      roomId: room.roomCode,
      roomCode: room.roomCode,
      code: room.roomCode,
      gameType: 'fortunarium' as const,
      hostId: room.hostId,
      phase: room.phase,
      createdAt: Date.now(),
      playersCount: connectedCount,
      totalPlayers: room.players.length,
      maxPlayers: 4,
      isFull: room.players.length >= 4,
      playerIds: room.players.map((p) => p.id),
      players: room.players,
    };
  }

  public createRoomDirect(
    hostPlayer: { id: string; name: string; avatar: string; color: string },
    config?: Partial<FortunariumConfig>
  ): FortunariumRoomState {
    const code = roomRegistry.generateCode();
    const finalConfig: FortunariumConfig = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    const host: FortunariumPlayer = {
      id: hostPlayer.id,
      name: (hostPlayer.name || 'Operador').trim(),
      avatar: hostPlayer.avatar || '🎰',
      color: hostPlayer.color || '#06b6d4',
      seatIndex: 0,
      isHost: true,
      isConnected: true,
      stats: createEmptyStats(),
    };

    const initialQuota = calculateInitialQuota(finalConfig.difficulty);

    const room: ServerFortunariumRoom = {
      roomCode: code,
      matchId: `match_${code}_${Date.now()}`,
      stateVersion: 1,
      gameType: 'fortunarium',
      hostId: host.id,
      phase: 'LOBBY',
      config: finalConfig,
      players: [host],
      currentTurnPlayerId: host.id,
      round: 1,
      totalRounds: finalConfig.totalRounds,
      money: STARTING_CREDITS,
      quotaProgress: STARTING_CREDITS,
      quota: initialQuota,
      spinsLeft: 999,
      maxSpinsPerRound: 999,
      totalSpinsInMatch: 0,
      totalPatternsHit: 0,
      totalJackpotsHit: 0,
      biggestSingleWinInMatch: 0,
      bestPatternNameInMatch: '—',
      peakMoneyInMatch: STARTING_CREDITS,
      bestSpinsInMatch: [],
      integrity: 100,
      maxIntegrity: 100,
      repairsUsedInQuota: 0,
      voltageMultiplier: 1.0,
      keys: 1,
      betMode: 'normal',
      grid: createDefaultGrid(),
      isSpinning: false,
      lastSpinResult: null,
      upgrades: createInitialUpgradesState(),
      offeredUpgradeIds: [],
      upgradeVotes: {},
      lastInstalledUpgradeId: null,
      upgradeHistory: [],
      overdriveSpins: 0,
      activeModifiers: [],
      activeEvent: null,
      activeIncident: null,
      activeRoulette: null,
      readyForNextRoundPlayerIds: [],
      actionLog: [],
      defeatCause: null,
      endReason: null,
      fortunariumSessionStats: {
        [host.id]: {
          playerId: host.id,
          displayName: host.name,
          cursorColor: host.color,
          firstJoinedOrder: 1,
          isCurrentlyInRoom: true,
          isConnected: true,
          matchesPlayed: 0,
          spins: 0,
          creditsWon: 0,
          creditsLost: 0,
          netBalance: 0,
          bestSpin: 0,
          quotasCompleted: 0,
          jackpots: 0,
        },
      },
      fortunariumSessionSummary: {
        totalMatchesPlayed: 0,
        totalSpins: 0,
        totalQuotasCompleted: 0,
        totalJackpots: 0,
      },
      spinTimer: null,
      disconnectTimers: new Map(),
      spinsSinceLastIncident: 0,
      processedMatchIds: new Set(),
      nextSessionJoinOrder: 2,
      currentMatchQuotasCompleted: 0,
      currentMatchParticipants: new Map(),
    };

    this.rooms.set(code, room);
    roomRegistry.register(code, 'fortunarium', 'fortunarium');
    return this.serializeRoom(room);
  }

  private ensurePlayerSessionEntry(
    room: ServerFortunariumRoom,
    player: { id: string; name: string; color: string; isConnected?: boolean },
    isCurrentlyInRoom: boolean
  ): FortunariumPlayerSessionStats {
    if (!room.fortunariumSessionStats) {
      room.fortunariumSessionStats = {};
    }
    let entry = room.fortunariumSessionStats[player.id];
    if (!entry) {
      entry = {
        playerId: player.id,
        displayName: player.name,
        cursorColor: player.color,
        firstJoinedOrder: room.nextSessionJoinOrder++,
        isCurrentlyInRoom,
        isConnected: Boolean(player.isConnected ?? isCurrentlyInRoom),
        matchesPlayed: 0,
        spins: 0,
        creditsWon: 0,
        creditsLost: 0,
        netBalance: 0,
        bestSpin: 0,
        quotasCompleted: 0,
        jackpots: 0,
      };
      room.fortunariumSessionStats[player.id] = entry;
    } else {
      if (player.name) entry.displayName = player.name;
      if (player.color) entry.cursorColor = player.color;
      entry.isCurrentlyInRoom = isCurrentlyInRoom;
      entry.isConnected = Boolean(player.isConnected ?? isCurrentlyInRoom);
    }
    return entry;
  }

  private syncSessionParticipantsPresence(room: ServerFortunariumRoom) {
    if (!room.fortunariumSessionStats) {
      room.fortunariumSessionStats = {};
    }
    if (!room.fortunariumSessionSummary) {
      room.fortunariumSessionSummary = {
        totalMatchesPlayed: 0,
        totalSpins: 0,
        totalQuotasCompleted: 0,
        totalJackpots: 0,
      };
    }

    const currentRoomIds = new Set<string>();
    for (const p of room.players) {
      currentRoomIds.add(p.id);
      this.ensurePlayerSessionEntry(room, p, true);
    }

    for (const [playerId, entry] of Object.entries(room.fortunariumSessionStats)) {
      if (!currentRoomIds.has(playerId)) {
        entry.isCurrentlyInRoom = false;
        entry.isConnected = false;
      }
    }
  }

  private recordMatchParticipantSnapshot(room: ServerFortunariumRoom, player: FortunariumPlayer) {
    if (!room.currentMatchParticipants) {
      room.currentMatchParticipants = new Map();
    }
    const existing = room.currentMatchParticipants.get(player.id);
    room.currentMatchParticipants.set(player.id, {
      player: {
        ...player,
        stats: { ...player.stats },
      },
      quotasCompletedWhilePresent: existing?.quotasCompletedWhilePresent ?? 0,
    });
  }

  /**
   * Idempotently merges the finalized match statistics into the room's cumulative
   * session statistics (`fortunariumSessionStats` & `fortunariumSessionSummary`)
   * EXACTLY ONCE per unique `room.matchId`.
   */
  private finalizeMatchSessionStats(room: ServerFortunariumRoom) {
    if (!room.matchId) return;
    if (!room.processedMatchIds) {
      room.processedMatchIds = new Set();
    }
    if (room.processedMatchIds.has(room.matchId)) {
      return;
    }

    room.processedMatchIds.add(room.matchId);

    // Ensure all current room players are snapshotted into currentMatchParticipants
    for (const p of room.players) {
      this.recordMatchParticipantSnapshot(room, p);
    }

    if (!room.fortunariumSessionSummary) {
      room.fortunariumSessionSummary = {
        totalMatchesPlayed: 0,
        totalSpins: 0,
        totalQuotasCompleted: 0,
        totalJackpots: 0,
      };
    }

    room.fortunariumSessionSummary.totalMatchesPlayed += 1;
    room.fortunariumSessionSummary.totalSpins += room.totalSpinsInMatch || 0;
    room.fortunariumSessionSummary.totalQuotasCompleted +=
      room.currentMatchQuotasCompleted || 0;
    room.fortunariumSessionSummary.totalJackpots += room.totalJackpotsHit || 0;

    for (const [playerId, record] of room.currentMatchParticipants.entries()) {
      const p = record.player;
      const isStillInRoom = room.players.some((rp) => rp.id === playerId);
      const entry = this.ensurePlayerSessionEntry(room, p, isStillInRoom);

      const won = p.stats.totalMoneyGenerated || 0;
      const lost = p.stats.totalMoneyLost || 0;

      entry.matchesPlayed += 1;
      entry.spins += p.stats.spinsTriggered || 0;
      entry.creditsWon += won;
      entry.creditsLost += lost;
      entry.netBalance = entry.creditsWon - entry.creditsLost;
      entry.bestSpin = Math.max(entry.bestSpin, p.stats.biggestSingleWin || 0);
      entry.quotasCompleted += record.quotasCompletedWhilePresent || 0;
      entry.jackpots += p.stats.jackpotsHit || 0;
    }

    this.syncSessionParticipantsPresence(room);
  }

  private serializeRoom(room: ServerFortunariumRoom): FortunariumRoomState {
    this.syncSessionParticipantsPresence(room);
    return {
      roomCode: room.roomCode,
      matchId: room.matchId,
      stateVersion: room.stateVersion,
      gameType: room.gameType,
      phase: room.phase,
      config: room.config,
      players: room.players,
      currentTurnPlayerId: room.currentTurnPlayerId,
      round: room.round,
      totalRounds: room.totalRounds,
      money: room.money,
      quotaProgress: room.quotaProgress,
      quota: room.quota,
      spinsLeft: room.spinsLeft,
      maxSpinsPerRound: room.maxSpinsPerRound,
      totalSpinsInMatch: room.totalSpinsInMatch,
      totalPatternsHit: room.totalPatternsHit,
      totalJackpotsHit: room.totalJackpotsHit,
      biggestSingleWinInMatch: room.biggestSingleWinInMatch,
      bestPatternNameInMatch: room.bestPatternNameInMatch,
      peakMoneyInMatch: room.peakMoneyInMatch ?? STARTING_CREDITS,
      bestSpinsInMatch: room.bestSpinsInMatch || [],
      integrity: room.integrity,
      maxIntegrity: room.maxIntegrity,
      repairsUsedInQuota: room.repairsUsedInQuota || 0,
      voltageMultiplier: room.voltageMultiplier,
      keys: room.keys,
      betMode: room.betMode,
      grid: room.grid,
      isSpinning: room.isSpinning,
      lastSpinResult: room.lastSpinResult,
      upgrades: room.upgrades,
      offeredUpgradeIds: room.offeredUpgradeIds,
      upgradeVotes: room.upgradeVotes,
      lastInstalledUpgradeId: room.lastInstalledUpgradeId,
      upgradeHistory: room.upgradeHistory || [],
      overdriveSpins: room.overdriveSpins || 0,
      activeModifiers: room.activeModifiers,
      activeEvent: room.activeEvent,
      activeIncident: room.activeIncident || null,
      activeRoulette: room.activeRoulette || null,
      readyForNextRoundPlayerIds: room.readyForNextRoundPlayerIds,
      actionLog: room.actionLog.slice(0, 18),
      defeatCause: room.defeatCause,
      endReason: room.endReason,
      fortunariumSessionStats: room.fortunariumSessionStats || {},
      fortunariumSessionSummary: room.fortunariumSessionSummary || {
        totalMatchesPlayed: 0,
        totalSpins: 0,
        totalQuotasCompleted: 0,
        totalJackpots: 0,
      },
    };
  }

  private broadcastRoomState(room: ServerFortunariumRoom) {
    if (room.phase === 'VICTORY' || room.phase === 'DEFEAT') {
      this.finalizeMatchSessionStats(room);
    }
    room.stateVersion += 1;
    const state = this.serializeRoom(room);
    const payload = JSON.stringify({
      type: 'ROOM_STATE',
      state,
    } satisfies FortunariumServerMessage);

    for (const [ws, client] of this.clients.entries()) {
      if (client.roomCode === room.roomCode && ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  }

  private broadcastMessage(room: ServerFortunariumRoom, msg: FortunariumServerMessage) {
    const payload = JSON.stringify(msg);
    for (const [ws, client] of this.clients.entries()) {
      if (client.roomCode === room.roomCode && ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  }

  private sendError(ws: WebSocket, message: string) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ERROR', message } satisfies FortunariumServerMessage));
    }
  }

  private addLog(
    room: ServerFortunariumRoom,
    entry: Omit<FortunariumActionLogEntry, 'id' | 'timestamp'>
  ) {
    room.actionLog.unshift({
      ...entry,
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
    });
    if (room.actionLog.length > 24) {
      room.actionLog.length = 24;
    }
  }

  // Pick 3 synergy- & rarity-weighted distinct upgrades that are not yet at max level
  private rollRandomUpgrades(room: ServerFortunariumRoom): FortunariumUpgradeId[] {
    return rollSynergyWeightedUpgrades({
      upgrades: room.upgrades,
      integrity: room.integrity,
      maxIntegrity: room.maxIntegrity,
      round: room.round,
    });
  }

  private installUpgradeOnMachine(
    room: ServerFortunariumRoom,
    upgradeId: FortunariumUpgradeId,
    installedByText: string
  ) {
    const catalogItem = FORTUNARIUM_UPGRADES_CATALOG[upgradeId];
    if (!catalogItem) return;
    const currentLv = room.upgrades[upgradeId] || 0;
    if (currentLv >= catalogItem.maxLevel) return;

    const newLevel = currentLv + 1;
    room.upgrades[upgradeId] = newLevel;
    room.lastInstalledUpgradeId = upgradeId;
    if (!room.upgradeHistory) room.upgradeHistory = [];
    room.upgradeHistory.push({
      upgradeId,
      level: newLevel,
      round: room.round,
      installedBy: installedByText,
      timestamp: Date.now(),
    });

    if (upgradeId === 'motor_extra') {
      room.maxIntegrity += 8;
      room.integrity = Math.min(room.maxIntegrity, room.integrity + 8);
    }

    this.addLog(room, {
      text: `${installedByText}: «${catalogItem.name}» [${catalogItem.rarity}] (Nv. ${newLevel}) instalada permanentemente.`,
      variant: 'upgrade',
    });
  }

  private advanceTurn(room: ServerFortunariumRoom) {
    const connected = room.players
      .filter((p) => p.isConnected)
      .sort((a, b) => a.seatIndex - b.seatIndex);
    if (connected.length === 0) return;

    const currentIdx = connected.findIndex((p) => p.id === room.currentTurnPlayerId);
    const nextIdx = (currentIdx + 1) % connected.length;
    room.currentTurnPlayerId = connected[nextIdx].id;
  }

  private ensureValidCurrentTurn(room: ServerFortunariumRoom) {
    const connected = room.players
      .filter((p) => p.isConnected)
      .sort((a, b) => a.seatIndex - b.seatIndex);
    if (connected.length === 0) return;
    if (!connected.some((p) => p.id === room.currentTurnPlayerId)) {
      room.currentTurnPlayerId = connected[0].id;
    }
  }

  private createInteractiveEvent(player: FortunariumPlayer): FortunariumActiveEvent {
    const templates: FortunariumActiveEvent[] = [
      {
        id: `evt_overclock_${Date.now()}`,
        title: 'Cortocircuito Dorado',
        subtitle:
          'Una chispa en la cámara central permite desviar energía directamente al depósito de créditos.',
        triggeredByPlayerId: player.id,
        triggeredByPlayerName: player.name,
        options: [
          {
            id: 'overclock_push',
            label: 'Forzar el Condensador',
            description:
              'Gana +45 CR para la Caja Común y +0.4x de Voltaje, pero sufre -12% de Integridad.',
            badgeText: '+45 CR / +0.4x / -12% INT',
            riskLevel: 'high',
          },
          {
            id: 'overclock_stabilize',
            label: 'Canalizar con Cuidado',
            description: 'Gana +22 CR seguros y repara +12% de Integridad.',
            badgeText: '+22 CR / +12% INT',
            riskLevel: 'safe',
          },
          {
            id: 'overclock_key',
            label: 'Extraer Pieza Maestra',
            description: 'Obtén +1 Llave de Taller y +15 CR.',
            badgeText: '+1 LLAVE / +15 CR',
            riskLevel: 'medium',
          },
        ],
      },
      {
        id: `evt_vault_${Date.now()}`,
        title: 'Cámara Secreta del Fortunarium',
        subtitle:
          'Los engranajes traseros se abren revelando un compartimento sellado del antiguo casino.',
        triggeredByPlayerId: player.id,
        triggeredByPlayerName: player.name,
        options: [
          {
            id: 'vault_key_open',
            label: 'Abrir con Llave de Taller',
            description:
              'Si tenéis 1 Llave, ábrelo limpiamente y gana +60 CR (si no, fuerza la cerradura por +35 CR y -10% Integridad).',
            badgeText: '+60 CR CON LLAVE',
            riskLevel: 'medium',
          },
          {
            id: 'vault_reinforce',
            label: 'Fundir en Blindaje',
            description: 'Restaura +25% de Integridad y suma +18 CR.',
            badgeText: '+25% INT / +18 CR',
            riskLevel: 'safe',
          },
          {
            id: 'vault_gamble',
            label: 'Doble o Nada Mecánico',
            description:
              '65% de probabilidad de ganar +70 CR; 35% de perder -20 CR y -10% Integridad.',
            badgeText: '65% +70 CR',
            riskLevel: 'high',
          },
        ],
      },
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  private handleClientMessage(ws: WebSocket, msg: FortunariumClientMessage) {
    if (msg.type === 'PING') {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'PONG' } satisfies FortunariumServerMessage));
      }
      return;
    }

    if (msg.type === 'JOIN_ROOM') {
      const cleanCode = (msg.roomCode || '').toUpperCase().trim();
      const room = this.rooms.get(cleanCode);
      if (!room) {
        this.sendError(ws, 'NO SE HA ENCONTRADO ESA SALA');
        return;
      }

      const existingTimer = room.disconnectTimers.get(msg.player.id);
      if (existingTimer) {
        clearTimeout(existingTimer);
        room.disconnectTimers.delete(msg.player.id);
      }

      let player = room.players.find((p) => p.id === msg.player.id);
      if (!player) {
        if (room.phase !== 'LOBBY') {
          this.sendError(ws, 'LA PARTIDA YA HA EMPEZADO');
          return;
        }
        if (room.players.length >= 4) {
          this.sendError(ws, 'LA SALA ESTÁ COMPLETA (MÁX. 4 JUGADORES)');
          return;
        }
        const occupiedSeats = new Set(room.players.map((p) => p.seatIndex));
        const seatIndex =
          [0, 1, 2, 3].find((s) => !occupiedSeats.has(s)) ?? room.players.length;
        const defaultColors = ['#06b6d4', '#ef4444', '#84cc16', '#a855f7'];

        player = {
          id: msg.player.id,
          name: (msg.player.name || 'Operador').trim(),
          avatar: msg.player.avatar || '🎰',
          color: msg.player.color || defaultColors[seatIndex % defaultColors.length],
          seatIndex,
          isHost: room.players.length === 0,
          isConnected: true,
          stats: createEmptyStats(),
        };
        room.players.push(player);
      } else {
        player.isConnected = true;
        if (msg.player.name?.trim()) {
          player.name = msg.player.name.trim();
        }
        if (msg.player.avatar) {
          player.avatar = msg.player.avatar;
        }
        if (msg.player.color) {
          player.color = msg.player.color;
        }
      }

      this.clients.set(ws, {
        ws,
        playerId: player.id,
        roomCode: room.roomCode,
      });

      this.ensureValidCurrentTurn(room);
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
      case 'SET_CURSOR_COLOR': {
        if (typeof msg.color === 'string' && msg.color.trim().length > 0) {
          player.color = msg.color.trim();
          this.broadcastRoomState(room);
        }
        break;
      }

      case 'CURSOR_MOVE': {
        const clampedX = Math.max(0, Math.min(1, Number(msg.x) || 0));
        const clampedY = Math.max(0, Math.min(1, Number(msg.y) || 0));
        const payload = JSON.stringify({
          type: 'CURSOR_UPDATE',
          playerId: player.id,
          name: player.name,
          color: player.color,
          x: clampedX,
          y: clampedY,
        } satisfies FortunariumServerMessage);

        for (const [otherWs, otherClient] of this.clients.entries()) {
          if (
            otherClient.roomCode === room.roomCode &&
            otherClient.playerId !== player.id &&
            otherWs.readyState === WebSocket.OPEN
          ) {
            otherWs.send(payload);
          }
        }
        break;
      }

      case 'UPDATE_CONFIG': {
        if (!player.isHost || room.phase !== 'LOBBY') return;
        if (
          msg.config.totalRounds === null ||
          (typeof msg.config.totalRounds === 'number' &&
            [5, 10, 15, 20].includes(msg.config.totalRounds))
        ) {
          room.config.totalRounds = msg.config.totalRounds;
          room.totalRounds = msg.config.totalRounds;
        }
        if (
          msg.config.difficulty &&
          ['normal', 'dificil', 'temerario'].includes(msg.config.difficulty)
        ) {
          room.config.difficulty = msg.config.difficulty;
        }
        if (msg.config.turnMode && ['turns', 'free'].includes(msg.config.turnMode)) {
          room.config.turnMode = msg.config.turnMode;
        }
        this.broadcastRoomState(room);
        break;
      }

      case 'START_GAME': {
        if (!player.isHost || room.phase !== 'LOBBY') return;
        const connectedCount = room.players.filter((p) => p.isConnected).length;
        if (connectedCount < 1) {
          this.sendError(ws, 'Se necesita al menos 1 jugador conectado para iniciar.');
          return;
        }
        this.startNewMatch(room);
        break;
      }

      case 'SET_BET_MODE': {
        if (room.phase !== 'PLAYING' || room.isSpinning) return;
        if (room.config.turnMode === 'turns' && room.currentTurnPlayerId !== player.id) {
          this.sendError(ws, 'Espera a tu turno para cambiar la apuesta.');
          return;
        }
        if (['normal', 'doble', 'sobrecarga'].includes(msg.betMode)) {
          room.betMode = msg.betMode;
          this.broadcastRoomState(room);
        }
        break;
      }

      case 'SPIN_SLOT': {
        if (room.phase !== 'PLAYING' || room.isSpinning) return;
        if (room.config.turnMode === 'turns' && room.currentTurnPlayerId !== player.id) {
          this.sendError(ws, 'Es el turno de otro compañero en la máquina.');
          return;
        }

        if (msg.forceScenario === 'force_bankruptcy') {
          room.money = 0;
          room.quotaProgress = 0;
          room.phase = 'DEFEAT';
          room.defeatCause = 'bankruptcy';
          room.endReason =
            'SIN CRÉDITOS — LA FORTUNA SE HA TERMINADO. FORTUNARIUM HA CERRADO SUS PUERTAS.';
          this.broadcastRoomState(room);
          return;
        }
        if (msg.forceScenario === 'force_integrity_zero') {
          room.integrity = 0;
          room.phase = 'DEFEAT';
          room.defeatCause = 'integrity';
          room.endReason =
            '¡MÁQUINA AVERIADA! LA INTEGRIDAD DEL FORTUNARIUM HA LLEGADO A CERO.';
          this.broadcastRoomState(room);
          return;
        }

        const cheapestSpinCost = calculateEffectiveSpinCost('normal', room.upgrades);
        if (room.money < cheapestSpinCost) {
          // Cannot afford even the cheapest spin -> evaluate bankruptcy
          this.evaluateBankruptcyOrQuota(room);
          this.broadcastRoomState(room);
          return;
        }

        // Enforce 'apuesta_forzada' debuff if active and affordable
        const hasApuestaForzada = room.activeModifiers.some(
          (m) => m.modifierId === 'apuesta_forzada'
        );
        if (hasApuestaForzada && room.betMode === 'normal') {
          const dobleCost = calculateEffectiveSpinCost('doble', room.upgrades);
          if (room.money >= dobleCost) {
            room.betMode = 'doble';
          }
        }

        let currentBetCost = calculateEffectiveSpinCost(room.betMode, room.upgrades);
        if (room.money < currentBetCost) {
          // Auto-adjust to normal bet mode if they can afford normal but not higher bet mode
          room.betMode = 'normal';
          currentBetCost = cheapestSpinCost;
        }

        // Player-specific 'mal_contacto' adds +4 CR cost if affordable
        const hasMalContacto = room.activeModifiers.some(
          (m) =>
            m.modifierId === 'mal_contacto' &&
            (!m.targetPlayerId || m.targetPlayerId === player.id)
        );
        const extraContactCost =
          hasMalContacto && room.money >= currentBetCost + 4 ? 4 : 0;

        const actualSpinCost = currentBetCost + extraContactCost;
        const moneyBeforeSpin = room.money;
        const moneyAfterSpinCost = Math.max(0, moneyBeforeSpin - actualSpinCost);

        // Track post-quota Overdrive spins if quota was already reached before this spin
        if (moneyBeforeSpin >= room.quota || (room.overdriveSpins || 0) > 0) {
          room.overdriveSpins = (room.overdriveSpins || 0) + 1;
        }

        // Clear any leftover roulette popup when spinning
        room.activeRoulette = null;

        // Deduct ONLY spin cost when spin starts; do NOT evaluate bankruptcy mid-spin!
        room.money = moneyAfterSpinCost;
        room.quotaProgress = moneyAfterSpinCost;
        room.totalSpinsInMatch += 1;

        const scenarioToUse =
          msg.forceScenario === 'big_win' ? 'multi_pattern' : msg.forceScenario;

        const newGrid = scenarioToUse
          ? generateDeterministicTestGrid(scenarioToUse)
          : generateAuthoritativeGrid(room.upgrades, room.betMode, room.activeModifiers);

        const core = evaluateSpinGridCore({
          grid: newGrid,
          betMode: room.betMode,
          upgrades: room.upgrades,
          currentVoltage: room.voltageMultiplier,
          round: room.round,
          overdriveSpins: room.overdriveSpins || 0,
          playerId: player.id,
          activeModifiers: room.activeModifiers,
          allowMysteryEvents: true,
          forceJackpot: msg.forceScenario === 'jackpot',
          enableJackpotRoll: !msg.forceScenario || msg.forceScenario === 'jackpot',
        });

        const spinIsBigWin =
          msg.forceScenario === 'big_win' ||
          isBigWinSpin({
            winLinesCount: core.winLines.length,
            grossPayout: core.grossPayout,
            spinCost: actualSpinCost,
            isJackpot: core.isJackpot,
          });

        let triggeredEventId: string | null = null;
        if (core.shouldTriggerMysteryEvent) {
          const evt = this.createInteractiveEvent(player);
          room.activeEvent = evt;
          triggeredEventId = evt.id;
        }

        const finalMoney = Math.max(
          0,
          moneyAfterSpinCost + core.grossPayout - core.penalties
        );
        const finalQuotaProgress = finalMoney;
        const finalIntegrity = Math.max(
          0,
          Math.min(room.maxIntegrity, room.integrity + core.integrityDelta)
        );
        const finalKeys = room.keys + core.keysGained;
        const netMoneyDelta = finalMoney - moneyBeforeSpin;

        let summaryText = '';
        if (core.isJackpot) {
          summaryText = `¡JACKPOT DEL FORTUNARIUM! ${player.name} desató +${core.grossPayout} CR`;
        } else if (spinIsBigWin) {
          summaryText = `¡GRAN PREMIO ARCADE! ${player.name} logró +${core.grossPayout} CR (${core.winLines.length} patrón/es)`;
        } else if (core.grossPayout > 0 && core.penalties > 0) {
          summaryText = `${player.name} ganó +${core.grossPayout} CR (-${core.penalties} CR en penalizaciones)`;
        } else if (core.grossPayout > 0) {
          summaryText = `${player.name} obtuvo +${core.grossPayout} CR (${core.winLines.length} patrón/es)`;
        } else if (core.penalties > 0) {
          summaryText = `${player.name} sufrió -${core.penalties} CR en penalizaciones`;
        } else {
          summaryText = `${player.name} giró sin combinación (-${actualSpinCost} CR)`;
        }

        room.stateVersion += 1;
        const spinResult: FortunariumSpinResult = {
          spinId: `spin_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          stateVersion: room.stateVersion,
          playerId: player.id,
          playerName: player.name,
          initiatedByPlayerId: player.id,
          triggerSource: msg.triggerSource || 'button',
          betMode: room.betMode,
          spinCost: actualSpinCost,
          moneyBeforeSpin,
          moneyAfterSpinCost,
          finalMoney,
          quotaProgressBefore: moneyBeforeSpin,
          finalQuotaProgress,
          grid: newGrid,
          winLines: core.winLines,
          specialEffects: core.specialEffects,
          winningCells: core.winningCells,
          hazardCells: core.hazardCells,
          grossPayout: core.grossPayout,
          jackpotPayout: core.jackpotPayout,
          penalties: core.penalties,
          netMoneyDelta,
          integrityDelta: core.integrityDelta,
          finalIntegrity,
          voltageMultiplierUsed: core.voltageMultiplierUsed,
          voltageMultiplierAfter: core.voltageMultiplierAfter,
          keysGained: core.keysGained,
          finalKeys,
          extraSpinsGained: core.extraSpinsGained,
          triggeredEventId,
          isJackpot: core.isJackpot,
          isBigWin: spinIsBigWin,
          overdriveSpinNumber: room.overdriveSpins || 0,
          overdriveWearAdded: core.overdriveWearAdded,
          summaryText,
          timestamp: Date.now(),
        };

        // Keep pre-payout money in room state while reels spin so nothing leaks early
        room.grid = newGrid;
        room.isSpinning = true;

        this.broadcastMessage(room, {
          type: 'SPIN_STARTED',
          spinResult,
          state: this.serializeRoom(room),
        });

        // Wait for the 5-reel carousel stop sequence (3050ms) + pattern reveal before committing final state
        const presentationStepsCount = core.winLines.length + core.specialEffects.length;
        const spinCommitDelayMs = core.isJackpot
          ? 14200
          : presentationStepsCount === 0
          ? 3250
          : Math.min(10800, 3250 + presentationStepsCount * 1160 + 850);
        if (room.spinTimer) clearTimeout(room.spinTimer);
        room.spinTimer = setTimeout(() => {
          room.spinTimer = null;
          room.isSpinning = false;

          room.money = finalMoney;
          room.quotaProgress = finalQuotaProgress;
          room.peakMoneyInMatch = Math.max(
            room.peakMoneyInMatch ?? STARTING_CREDITS,
            finalMoney
          );
          room.integrity = finalIntegrity;
          room.voltageMultiplier = core.voltageMultiplierAfter;
          room.keys = finalKeys;
          room.totalPatternsHit += core.winLines.length;
          if (core.isJackpot) {
            room.totalJackpotsHit += 1;
          }
          if (core.grossPayout > room.biggestSingleWinInMatch) {
            room.biggestSingleWinInMatch = core.grossPayout;
          }
          for (const wl of core.winLines) {
            if (room.bestPatternNameInMatch === '—' || wl.payout >= room.biggestSingleWinInMatch * 0.5) {
              room.bestPatternNameInMatch = wl.name;
            }
          }

          if (core.grossPayout > 0 || core.isJackpot) {
            const sortedLines = [...core.winLines].sort((a, b) => b.payout - a.payout);
            const patternNames = sortedLines.map((w) => w.name);
            const topPatternName = core.isJackpot
              ? sortedLines[0]?.name || 'PANTALLA COMPLETA'
              : sortedLines[0]?.name ||
                (core.specialEffects.some((fx) => fx.symbolId === 'moneda')
                  ? 'BONO DE MONEDAS'
                  : 'PREMIO ESPECIAL');
            const positiveSpecials = core.specialEffects
              .filter((fx) => fx.variant === 'positive' || fx.variant === 'jackpot')
              .map((fx) => fx.title);

            if (!room.bestSpinsInMatch) {
              room.bestSpinsInMatch = [];
            }
            room.bestSpinsInMatch.push({
              spinId: spinResult.spinId,
              spinNumber: room.totalSpinsInMatch,
              round: room.round,
              playerId: player.id,
              playerName: player.name,
              playerColor: player.color,
              betMode: room.betMode,
              spinCost: actualSpinCost,
              grossPayout: core.grossPayout,
              netMoneyDelta,
              isJackpot: core.isJackpot,
              isBigWin: Boolean(spinIsBigWin),
              patternsCount: core.winLines.length,
              topPatternName,
              patternNames,
              specialSummary: positiveSpecials,
              timestamp: spinResult.timestamp,
            });
            room.bestSpinsInMatch.sort((a, b) => {
              if (b.grossPayout !== a.grossPayout) {
                return b.grossPayout - a.grossPayout;
              }
              if (b.isJackpot !== a.isJackpot) {
                return b.isJackpot ? 1 : -1;
              }
              return b.netMoneyDelta - a.netMoneyDelta;
            });
            if (room.bestSpinsInMatch.length > 5) {
              room.bestSpinsInMatch.length = 5;
            }
          }

          // Remove Ojo Dorado if it was consumed this spin
          if (core.consumedOjoDorado) {
            room.activeModifiers = room.activeModifiers.filter(
              (m) => m.modifierId !== 'ojo_dorado'
            );
          }

          // Decrement existing temporary modifiers by 1 spin and remove expired ones
          room.activeModifiers = room.activeModifiers
            .map((m) => ({
              ...m,
              spinsRemaining: m.spinsRemaining - 1,
            }))
            .filter((m) => m.spinsRemaining > 0);

          // Apply any new temporary modifier granted during this spin (e.g. from '?')
          for (const fx of core.specialEffects) {
            if (fx.grantedModifierId) {
              this.applyTemporaryModifier(room, fx.grantedModifierId, player);
            }
          }

          room.lastSpinResult = spinResult;

          // Update individual player statistics
          player.stats.spinsTriggered += 1;
          player.stats.totalMoneyGenerated += core.grossPayout;
          player.stats.totalMoneyLost += actualSpinCost + core.penalties;
          player.stats.netBalance =
            player.stats.totalMoneyGenerated - player.stats.totalMoneyLost;
          player.stats.patternsHit += core.winLines.length;
          player.stats.specialSymbolsTriggered =
            (player.stats.specialSymbolsTriggered || 0) + core.specialEffects.length;
          if (core.grossPayout > player.stats.biggestSingleWin) {
            player.stats.biggestSingleWin = core.grossPayout;
          }
          if (netMoneyDelta < 0) {
            const singleSpinLoss = Math.abs(netMoneyDelta);
            if (singleSpinLoss > (player.stats.biggestSingleLoss || 0)) {
              player.stats.biggestSingleLoss = singleSpinLoss;
            }
          }
          if (core.isJackpot) {
            player.stats.jackpotsHit += 1;
          }
          const bombsCount = newGrid.flat().filter((s) => s === 'bomba').length;
          const skullsCount = newGrid.flat().filter((s) => s === 'calavera').length;
          const coinsCount = newGrid.flat().filter((s) => s === 'moneda').length;
          const defusedEffectsCount = core.specialEffects.filter(
            (fx) => fx.symbolId === 'synergy'
          ).length;
          player.stats.bombsTriggered += bombsCount;
          player.stats.bombsDefused =
            (player.stats.bombsDefused || 0) + defusedEffectsCount;
          player.stats.skullsTriggered += skullsCount;
          player.stats.coinsCollected += coinsCount;
          player.stats.keysFound += core.keysGained;
          if (core.integrityDelta < 0) {
            player.stats.integrityDamageCaused += Math.abs(core.integrityDelta);
          } else if (core.integrityDelta > 0) {
            player.stats.integrityRepaired += core.integrityDelta;
          }
          this.recordMatchParticipantSnapshot(room, player);

          this.addLog(room, {
            playerId: player.id,
            playerName: player.name,
            text: spinResult.summaryText,
            moneyDelta: spinResult.netMoneyDelta,
            integrityDelta: spinResult.integrityDelta,
            variant:
              core.grossPayout > core.penalties
                ? 'win'
                : core.penalties > 0
                ? 'hazard'
                : 'spin',
          });

          // 1. Check critical integrity breakdown
          if (room.integrity <= 0) {
            room.phase = 'DEFEAT';
            room.defeatCause = 'integrity';
            room.endReason =
              '¡AVERÍA CATASTRÓFICA! La integridad de la máquina cayó al 0% y el Fortunarium quedó fuera de servicio.';
            this.broadcastRoomState(room);
            return;
          }

          // 2. Check if an interactive mystery event was triggered
          if (room.activeEvent) {
            room.phase = 'EVENT_CHOICE';
            this.broadcastRoomState(room);
            return;
          }

          // 3. Random Machine Incident or Overdrive Effect Roulette check
          room.spinsSinceLastIncident = (room.spinsSinceLastIncident || 0) + 1;
          const incidentProb = calculateIncidentProbability({
            round: room.round,
            overdriveSpins: room.overdriveSpins || 0,
            integrity: room.integrity,
            maxIntegrity: room.maxIntegrity,
            spinsSinceLastIncident: room.spinsSinceLastIncident,
            activeModifiers: room.activeModifiers,
            playerId: player.id,
          });

          if (!room.activeIncident && Math.random() < incidentProb) {
            room.spinsSinceLastIncident = 0;
            this.triggerRandomIncident(room, player);
          } else if (
            !room.activeIncident &&
            !room.activeRoulette &&
            (room.overdriveSpins || 0) >= 2 &&
            Math.random() < 0.26
          ) {
            this.triggerEffectRoulette(
              room,
              `SOBRECARGA DE CUOTA (+${room.overdriveSpins})`,
              true,
              player
            );
          }

          // 4. Advance turn and evaluate bankruptcy ONLY after full spin transaction resolves
          this.advanceTurn(room);
          this.evaluateBankruptcyOrQuota(room);
          this.broadcastRoomState(room);
        }, spinCommitDelayMs);

        break;
      }

      case 'REPAIR_MACHINE': {
        if ((room.phase !== 'PLAYING' && room.phase !== 'ROUND_SHOP') || room.isSpinning)
          return;
        if (room.integrity >= room.maxIntegrity) {
          this.sendError(ws, 'La integridad de la máquina ya está al máximo.');
          return;
        }

        const baseRepairAmount = 25 + (room.upgrades.mecanico_jefe || 0) * 5;
        if (msg.useKey) {
          if (room.keys < 1) {
            this.sendError(ws, 'No tenéis Llaves disponibles.');
            return;
          }
          room.keys -= 1;
        } else {
          const repairCost = calculateRepairCost({
            round: room.round,
            repairsUsedInQuota: room.repairsUsedInQuota || 0,
            integrity: room.integrity,
            maxIntegrity: room.maxIntegrity,
            upgrades: room.upgrades,
            activeModifiers: room.activeModifiers,
          });
          const check = validateWorkshopPurchase({
            currentMoney: room.money,
            cost: repairCost,
            quotaTarget: room.quota,
            upgrades: room.upgrades,
            activeModifiers: room.activeModifiers,
          });
          if (!check.allowed) {
            this.sendError(
              ws,
              check.code === 'SPIN_RESERVE_REQUIRED'
                ? `Compra bloqueada: debéis reservar al menos ${check.minSpinReserve} CR para poder girar.`
                : `Necesitáis ${repairCost} CR para reparar la máquina.`
            );
            return;
          }
          room.money -= repairCost;
          room.quotaProgress = room.money;
          room.repairsUsedInQuota = (room.repairsUsedInQuota || 0) + 1;
          player.stats.totalMoneyLost += repairCost;
          player.stats.netBalance =
            player.stats.totalMoneyGenerated - player.stats.totalMoneyLost;
        }

        const actualRepaired = Math.min(
          baseRepairAmount,
          room.maxIntegrity - room.integrity
        );
        room.integrity += actualRepaired;
        player.stats.integrityRepaired += actualRepaired;
        player.stats.repairsCount = (player.stats.repairsCount || 0) + 1;

        this.addLog(room, {
          playerId: player.id,
          playerName: player.name,
          text: `${player.name} reparó +${actualRepaired}% de Integridad.`,
          integrityDelta: actualRepaired,
          variant: 'repair',
        });

        this.evaluateBankruptcyOrQuota(room);
        this.broadcastRoomState(room);
        break;
      }

      case 'RESOLVE_INCIDENT': {
        if (!room.activeIncident || room.isSpinning) return;
        const inc = room.activeIncident;

        if (msg.choice === 'EMERGENCY_REPAIR') {
          const canUseKey = room.keys >= 1 && room.money < inc.emergencyRepairCost + 10;
          if (canUseKey) {
            room.keys -= 1;
            const dmg = inc.reducedDamage;
            room.integrity = Math.max(1, room.integrity - dmg);
            this.addLog(room, {
              playerId: player.id,
              playerName: player.name,
              text: `${player.name} contuvo «${inc.title}» con 1 Llave (-${dmg}% INT, avería evitada).`,
              integrityDelta: -dmg,
              variant: 'repair',
            });
          } else {
            const check = validateWorkshopPurchase({
              currentMoney: room.money,
              cost: inc.emergencyRepairCost,
              quotaTarget: room.quota,
              upgrades: room.upgrades,
              activeModifiers: room.activeModifiers,
            });
            if (!check.allowed) {
              this.sendError(
                ws,
                `No podéis pagar los ${inc.emergencyRepairCost} CR sin quedaros sin reserva de giro.`
              );
              return;
            }
            room.money -= inc.emergencyRepairCost;
            room.quotaProgress = room.money;
            player.stats.totalMoneyLost += inc.emergencyRepairCost;
            player.stats.netBalance =
              player.stats.totalMoneyGenerated - player.stats.totalMoneyLost;
            const dmg = inc.reducedDamage;
            room.integrity = Math.max(1, room.integrity - dmg);
            this.addLog(room, {
              playerId: player.id,
              playerName: player.name,
              text: `${player.name} realizó reparación de emergencia en «${inc.title}» (-${inc.emergencyRepairCost} CR, -${dmg}% INT).`,
              moneyDelta: -inc.emergencyRepairCost,
              integrityDelta: -dmg,
              variant: 'repair',
            });
          }
        } else {
          // ABSORB_IMPACT
          const dmg = inc.integrityDamage;
          room.integrity = Math.max(0, room.integrity - dmg);
          player.stats.integrityDamageCaused += dmg;
          if (inc.inflictedModifierId) {
            this.applyTemporaryModifier(room, inc.inflictedModifierId, player);
          }
          this.addLog(room, {
            playerId: player.id,
            playerName: player.name,
            text: `La máquina absorbió «${inc.title}» (-${dmg}% Integridad${
              inc.inflictedModifierId
                ? ` y efecto «${FORTUNARIUM_MODIFIERS_CATALOG[inc.inflictedModifierId].name}»`
                : ''
            }).`,
            integrityDelta: -dmg,
            variant: 'hazard',
          });
        }

        room.activeIncident = null;

        if (room.integrity <= 0) {
          room.phase = 'DEFEAT';
          room.defeatCause = 'integrity';
          room.endReason =
            '¡AVERÍA CATASTRÓFICA! El incidente mecánico destruyó la integridad del Fortunarium (0%).';
          this.broadcastRoomState(room);
          return;
        }

        this.evaluateBankruptcyOrQuota(room);
        this.broadcastRoomState(room);
        break;
      }

      case 'DISMISS_ROULETTE': {
        room.activeRoulette = null;
        this.broadcastRoomState(room);
        break;
      }

      case 'BUY_UPGRADE': {
        if ((room.phase !== 'PLAYING' && room.phase !== 'ROUND_SHOP') || room.isSpinning)
          return;
        const catalogItem = FORTUNARIUM_UPGRADES_CATALOG[msg.upgradeId];
        if (!catalogItem) return;

        const currentLevel = room.upgrades[msg.upgradeId] || 0;
        if (currentLevel >= catalogItem.maxLevel) {
          this.sendError(ws, 'Esta mejora ya ha alcanzado su nivel máximo.');
          return;
        }

        if (msg.useKey) {
          if (room.keys < catalogItem.keyCost) {
            this.sendError(
              ws,
              `Necesitáis ${catalogItem.keyCost} Llave(s) para instalar esta mejora.`
            );
            return;
          }
          room.keys -= catalogItem.keyCost;
        } else {
          const cost = getUpgradeCostMoney(msg.upgradeId, currentLevel);
          const check = validateWorkshopPurchase({
            currentMoney: room.money,
            cost,
            quotaTarget: room.quota,
            upgrades: room.upgrades,
            activeModifiers: room.activeModifiers,
            isMaxLevel: currentLevel >= catalogItem.maxLevel,
          });
          if (!check.allowed) {
            this.sendError(
              ws,
              check.code === 'SPIN_RESERVE_REQUIRED'
                ? `Compra bloqueada: debéis reservar al menos ${check.minSpinReserve} CR para poder girar.`
                : `No hay suficientes créditos en la Caja Común (${cost} CR).`
            );
            return;
          }
          room.money -= cost;
          room.quotaProgress = room.money;
          player.stats.totalMoneyLost += cost;
          player.stats.netBalance =
            player.stats.totalMoneyGenerated - player.stats.totalMoneyLost;
        }

        player.stats.upgradesBought += 1;
        this.installUpgradeOnMachine(
          room,
          msg.upgradeId,
          `${player.name} compró en el Taller`
        );
        this.evaluateBankruptcyOrQuota(room);
        this.broadcastRoomState(room);
        break;
      }

      case 'VOTE_UPGRADE': {
        if (room.phase !== 'ROUND_SHOP') return;
        if (!room.offeredUpgradeIds.includes(msg.upgradeId)) return;

        room.upgradeVotes[player.id] = msg.upgradeId;

        const connectedPlayers = room.players.filter((p) => p.isConnected);
        const allVotedSame =
          connectedPlayers.length > 0 &&
          connectedPlayers.every((p) => room.upgradeVotes[p.id] === msg.upgradeId);

        if (allVotedSame) {
          player.stats.upgradesBought += 1;
          this.installUpgradeOnMachine(
            room,
            msg.upgradeId,
            connectedPlayers.length === 1
              ? `${player.name} seleccionó la mejora de cuota`
              : 'Mejora de cuota aprobada por unanimidad'
          );
          room.offeredUpgradeIds = [];
          room.upgradeVotes = {};
        }

        this.broadcastRoomState(room);
        break;
      }

      case 'RESOLVE_EVENT': {
        if (room.phase !== 'EVENT_CHOICE' || !room.activeEvent) return;
        const evt = room.activeEvent;
        const opt = evt.options.find((o) => o.id === msg.optionId);
        if (!opt) return;

        let moneyChange = 0;
        let integrityChange = 0;
        let outcomeText = '';

        switch (opt.id) {
          case 'overclock_push': {
            moneyChange = 45;
            integrityChange = -12;
            room.voltageMultiplier = Number((room.voltageMultiplier + 0.4).toFixed(2));
            outcomeText = `${player.name} forzó el condensador (+45 CR, +0.4x Voltaje, -12% Integridad).`;
            break;
          }
          case 'overclock_stabilize': {
            moneyChange = 22;
            integrityChange = 12;
            outcomeText = `${player.name} estabilizó la chispa (+22 CR y +12% Integridad).`;
            break;
          }
          case 'overclock_key': {
            room.keys += 1;
            moneyChange = 15;
            player.stats.keysFound += 1;
            outcomeText = `${player.name} extrajo +1 Llave y +15 CR.`;
            break;
          }
          case 'vault_key_open': {
            if (room.keys >= 1) {
              room.keys -= 1;
              moneyChange = 60;
              outcomeText = `${player.name} abrió la cámara con una Llave (+60 CR).`;
            } else {
              moneyChange = 35;
              integrityChange = -10;
              outcomeText = `${player.name} forzó la cámara sin llave (+35 CR, -10% Integridad).`;
            }
            break;
          }
          case 'vault_reinforce': {
            moneyChange = 18;
            integrityChange = 25;
            outcomeText = `${player.name} reforzó el chasis (+25% Integridad y +18 CR).`;
            break;
          }
          case 'vault_gamble': {
            if (Math.random() < 0.65) {
              moneyChange = 70;
              outcomeText = `¡Apuesta mecánica exitosa de ${player.name}! (+70 CR).`;
            } else {
              moneyChange = -20;
              integrityChange = -10;
              outcomeText = `¡Fallo en el doble o nada de ${player.name}! (-20 CR, -10% Integridad).`;
            }
            break;
          }
        }

        if (moneyChange > 0) {
          room.money += moneyChange;
          room.peakMoneyInMatch = Math.max(
            room.peakMoneyInMatch ?? STARTING_CREDITS,
            room.money
          );
          player.stats.totalMoneyGenerated += moneyChange;
          if (moneyChange > player.stats.biggestSingleWin) {
            player.stats.biggestSingleWin = moneyChange;
          }
        } else if (moneyChange < 0) {
          const loss = Math.min(room.money, Math.abs(moneyChange));
          room.money -= loss;
          player.stats.totalMoneyLost += loss;
        }
        room.quotaProgress = room.money;
        player.stats.netBalance =
          player.stats.totalMoneyGenerated - player.stats.totalMoneyLost;

        if (integrityChange > 0) {
          const rep = Math.min(integrityChange, room.maxIntegrity - room.integrity);
          room.integrity += rep;
          player.stats.integrityRepaired += rep;
        } else if (integrityChange < 0) {
          room.integrity = Math.max(0, room.integrity + integrityChange);
          player.stats.integrityDamageCaused += Math.abs(integrityChange);
        }

        room.activeEvent = null;
        this.addLog(room, {
          playerId: player.id,
          playerName: player.name,
          text: outcomeText,
          moneyDelta: moneyChange,
          integrityDelta: integrityChange,
          variant: 'event',
        });

        if (room.integrity <= 0) {
          room.phase = 'DEFEAT';
          room.defeatCause = 'integrity';
          room.endReason =
            '¡AVERÍA CATASTRÓFICA! El evento sobrecargó la máquina y redujo su integridad al 0%.';
          this.broadcastRoomState(room);
          return;
        }

        room.phase = 'PLAYING';
        this.advanceTurn(room);
        this.evaluateBankruptcyOrQuota(room);
        this.broadcastRoomState(room);
        break;
      }

      case 'PAY_QUOTA_EARLY': {
        if (room.phase !== 'PLAYING' || room.isSpinning) return;
        if (room.money < room.quota) {
          this.sendError(
            ws,
            `Aún faltan ${room.quota - room.money} CR para alcanzar la Cuota ${room.round}.`
          );
          return;
        }
        this.sealCurrentQuota(room, player);
        this.broadcastRoomState(room);
        break;
      }

      case 'NEXT_ROUND': {
        if (room.phase !== 'ROUND_SHOP') return;
        if (room.offeredUpgradeIds.length > 0) {
          this.sendError(
            ws,
            'Debéis elegir una de las 3 mejoras de cuota antes de continuar.'
          );
          return;
        }

        if (!room.readyForNextRoundPlayerIds.includes(player.id)) {
          room.readyForNextRoundPlayerIds.push(player.id);
        }

        const connectedIds = room.players.filter((p) => p.isConnected).map((p) => p.id);
        const allReady = connectedIds.every((id) =>
          room.readyForNextRoundPlayerIds.includes(id)
        );

        if (player.isHost || allReady || connectedIds.length === 1) {
          room.round += 1;
          // CRITICAL (Sections 30, 31, 33, 34, 49):
          // Money is NEVER reset or subtracted!
          // Next quota is calculated from `previousQuota`, NOT `room.money`!
          room.quota = calculateNextQuotaTarget(room.quota, room.config.difficulty);
          room.quotaProgress = room.money;
          room.repairsUsedInQuota = 0;
          room.overdriveSpins = 0;
          room.activeIncident = null;
          room.activeRoulette = null;
          room.readyForNextRoundPlayerIds = [];
          room.offeredUpgradeIds = [];
          room.upgradeVotes = {};
          room.phase = 'PLAYING';

          const quotaLabel =
            room.totalRounds === null
              ? `Cuota ${room.round} (Ilimitadas)`
              : `Cuota ${room.round}/${room.totalRounds}`;

          this.addLog(room, {
            text: `¡Comienza la ${quotaLabel}! Nuevo umbral: ${room.quota} CR (Conserváis ${room.money} CR).`,
            variant: 'round',
          });

          // Milestone quota Effect Roulette (Quotas 3, 5, 8, 10, 13...)
          if (room.round >= 3 && (room.round === 3 || room.round === 5 || room.round % 3 === 2)) {
            this.triggerEffectRoulette(room, `HITO DE CUOTA ${room.round}`, false, player);
          }

          // If player spent all their money in the workshop during ROUND_SHOP, check bankruptcy on entering PLAYING
          this.evaluateBankruptcyOrQuota(room);
        }
        this.broadcastRoomState(room);
        break;
      }

      case 'RESTART_MATCH': {
        const isEndPhase = room.phase === 'VICTORY' || room.phase === 'DEFEAT';
        if (
          !isEndPhase &&
          !player.isHost &&
          room.players.filter((p) => p.isConnected).length > 1
        ) {
          return;
        }
        this.startNewMatch(room);
        break;
      }

      case 'RETURN_TO_LOBBY': {
        if (room.spinTimer) {
          clearTimeout(room.spinTimer);
          room.spinTimer = null;
        }
        if (
          room.phase === 'VICTORY' ||
          room.phase === 'DEFEAT' ||
          (room.phase !== 'LOBBY' && room.totalSpinsInMatch > 0)
        ) {
          this.finalizeMatchSessionStats(room);
        }
        room.phase = 'LOBBY';
        room.isSpinning = false;
        room.activeEvent = null;
        room.activeIncident = null;
        room.activeRoulette = null;
        room.overdriveSpins = 0;
        room.defeatCause = null;
        room.endReason = null;
        this.broadcastRoomState(room);
        break;
      }

      case 'LEAVE_ROOM': {
        this.removePlayerPermanently(room, player.id);
        this.clients.delete(ws);
        break;
      }

      case 'DEV_GRANT_MODIFIER': {
        const targetP = msg.targetPlayerId
          ? room.players.find((p) => p.id === msg.targetPlayerId) || player
          : player;
        this.applyTemporaryModifier(room, msg.modifierId, targetP);
        this.broadcastRoomState(room);
        break;
      }

      case 'DEV_TRIGGER_INCIDENT': {
        this.triggerRandomIncident(room, player, msg.incidentType);
        this.broadcastRoomState(room);
        break;
      }

      case 'DEV_TRIGGER_ROULETTE': {
        this.triggerEffectRoulette(
          room,
          (room.overdriveSpins || 0) > 0
            ? `SOBRECARGA DE CUOTA (+${room.overdriveSpins})`
            : 'RULETA DE TALLER',
          (room.overdriveSpins || 0) > 0,
          player
        );
        this.broadcastRoomState(room);
        break;
      }

      case 'DEV_SET_INTEGRITY': {
        room.integrity = Math.max(0, Math.min(room.maxIntegrity, Math.round(msg.integrity)));
        if (room.integrity <= 0) {
          room.phase = 'DEFEAT';
          room.defeatCause = 'integrity';
          room.endReason =
            '¡AVERÍA CATASTRÓFICA! La integridad de la máquina cayó al 0% y el Fortunarium quedó fuera de servicio.';
        }
        this.broadcastRoomState(room);
        break;
      }

      case 'DEV_FORCE_OVERDRIVE': {
        if (room.money < room.quota) {
          room.money = room.quota + 35;
          room.quotaProgress = room.money;
        }
        room.overdriveSpins = (room.overdriveSpins || 0) + 1;
        this.addLog(room, {
          playerId: player.id,
          playerName: player.name,
          text: `⚡ [DEV] Sobrecarga de Cuota activada (Giro extra +${room.overdriveSpins}).`,
          variant: 'event',
        });
        this.broadcastRoomState(room);
        break;
      }
    }
  }

  private triggerRandomIncident(
    room: ServerFortunariumRoom,
    player: FortunariumPlayer,
    forcedType?: FortunariumIncidentType
  ) {
    const allTypes: FortunariumIncidentType[] = [
      'chispazo',
      'sobrecalentamiento',
      'atasco_engranajes',
      'fuga_aceite',
      'cortocircuito',
      'vibracion_critica',
      'ruleta_averiada',
    ];
    const chosenType =
      forcedType || allTypes[Math.floor(Math.random() * allTypes.length)];

    if (chosenType === 'ruleta_averiada') {
      room.integrity = Math.max(1, room.integrity - 4);
      this.triggerEffectRoulette(
        room,
        'AVERÍA EN RULETA INTERNA (-4% INT)',
        (room.overdriveSpins || 0) > 0,
        player
      );
      return;
    }

    const baseRepair = calculateRepairCost({
      round: room.round,
      repairsUsedInQuota: room.repairsUsedInQuota || 0,
      integrity: room.integrity,
      maxIntegrity: room.maxIntegrity,
      upgrades: room.upgrades,
      activeModifiers: room.activeModifiers,
    });
    const emergencyRepairCost = Math.max(12, Math.round(baseRepair * 0.58));
    const overdriveBonusDmg = Math.min(8, (room.overdriveSpins || 0) * 2);

    const incidentConfigs: Record<
      Exclude<FortunariumIncidentType, 'ruleta_averiada'>,
      {
        title: string;
        description: string;
        baseDmg: number;
        reducedDamage: number;
        inflictedModifierId?: FortunariumModifierId;
      }
    > = {
      chispazo: {
        title: '¡CHISPAZO EN RELÉ PRINCIPAL!',
        description:
          'Un arco voltaico sacude el cuadro superior. Podéis aislar el cable ahora o absorber la descarga.',
        baseDmg: 10 + overdriveBonusDmg,
        reducedDamage: 2,
        inflictedModifierId: 'cableado_quemado',
      },
      sobrecalentamiento: {
        title: '¡BOBINAS AL ROJO VIVO!',
        description:
          'El motor echa humo espeso por la rejilla lateral. Purgad el circuito o el chasis sufrirá recalentamiento.',
        baseDmg: 12 + overdriveBonusDmg,
        reducedDamage: 3,
        inflictedModifierId: 'recalentamiento',
      },
      atasco_engranajes: {
        title: '¡ATASCO EN ENGRANAJES CENTRALES!',
        description:
          'Un diente de latón bloquea la tracción del rodillo 3. Lubricad de urgencia o los rodillos quedarán oxidados.',
        baseDmg: 11 + overdriveBonusDmg,
        reducedDamage: 2,
        inflictedModifierId: 'rodillos_oxidados',
      },
      fuga_aceite: {
        title: '¡FUGA DE PRESIÓN HIDRÁULICA!',
        description:
          'Una junta reventada gotea sobre el cajón de monedas. Sellad la válvula o habrá fuga de créditos.',
        baseDmg: 9 + overdriveBonusDmg,
        reducedDamage: 2,
        inflictedModifierId: 'fuga_creditos',
      },
      cortocircuito: {
        title: '¡CORTOCIRCUITO EN SELECTOR DE APUESTA!',
        description:
          'El conmutador de potencia chisporrotea sin control. Reparad el puente o forzará la apuesta mínima.',
        baseDmg: 12 + overdriveBonusDmg,
        reducedDamage: 3,
        inflictedModifierId: 'apuesta_forzada',
      },
      vibracion_critica: {
        title: '¡VIBRACIÓN CRÍTICA DEL CHASIS!',
        description:
          'Los pernos traseros ceden bajo la tensión. Apretad los anclajes o la máquina entrará en mala racha.',
        baseDmg: 13 + overdriveBonusDmg,
        reducedDamage: 3,
        inflictedModifierId: 'mala_racha',
      },
    };

    const cfg = incidentConfigs[chosenType];
    const incident: FortunariumActiveIncident = {
      id: `inc_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      type: chosenType,
      title: cfg.title,
      description: cfg.description,
      integrityDamage: cfg.baseDmg,
      emergencyRepairCost,
      reducedDamage: cfg.reducedDamage,
      inflictedModifierId: cfg.inflictedModifierId,
      targetPlayerId: player.id,
      targetPlayerName: player.name,
      timestamp: Date.now(),
    };

    room.activeIncident = incident;
    this.addLog(room, {
      playerId: player.id,
      playerName: player.name,
      text: `⚠️ INCIDENTE MECÁNICO: ${cfg.title}`,
      variant: 'hazard',
    });
  }

  private triggerEffectRoulette(
    room: ServerFortunariumRoom,
    reason: string,
    isOverdrive: boolean,
    triggeredBy?: FortunariumPlayer
  ) {
    const buffIds = ALL_MODIFIER_IDS.filter(
      (id) => FORTUNARIUM_MODIFIERS_CATALOG[id].type === 'BUFF'
    );
    const debuffIds = ALL_MODIFIER_IDS.filter(
      (id) => FORTUNARIUM_MODIFIERS_CATALOG[id].type === 'DEBUFF'
    );

    // In Overdrive, negative outcomes become more likely
    const debuffChance = isOverdrive
      ? Math.min(0.78, 0.54 + (room.overdriveSpins || 1) * 0.06)
      : 0.4;
    const chooseDebuff = Math.random() < debuffChance;
    const sourcePool = chooseDebuff ? debuffIds : buffIds;
    const selectedModifierId =
      sourcePool[Math.floor(Math.random() * sourcePool.length)];

    // Build 8 visual candidates for the roulette strip
    const candidates: FortunariumModifierId[] = [];
    for (let i = 0; i < 7; i++) {
      const pool = i % 2 === 0 ? buffIds : debuffIds;
      candidates.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    candidates.push(selectedModifierId);

    const targetPlayer =
      triggeredBy ||
      room.players.find((p) => p.id === room.currentTurnPlayerId) ||
      room.players[0];

    const appliedMod = this.applyTemporaryModifier(
      room,
      selectedModifierId,
      targetPlayer
    );

    room.activeRoulette = {
      id: `roul_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      triggeredByReason: reason,
      isOverdrive,
      candidates,
      selectedModifierId,
      targetPlayerId: appliedMod?.targetPlayerId,
      targetPlayerName: appliedMod?.targetPlayerName,
      timestamp: Date.now(),
    };

    const modDef = FORTUNARIUM_MODIFIERS_CATALOG[selectedModifierId];
    this.addLog(room, {
      playerId: targetPlayer?.id,
      playerName: targetPlayer?.name,
      text: `🎡 Ruleta de Efectos (${reason}): «${modDef.name}» anotado en la hoja (${modDef.defaultSpins} giros).`,
      variant: modDef.type === 'BUFF' ? 'win' : 'hazard',
    });
  }

  private applyTemporaryModifier(
    room: ServerFortunariumRoom,
    modifierId: FortunariumModifierId,
    targetPlayer?: FortunariumPlayer
  ) {
    const def = FORTUNARIUM_MODIFIERS_CATALOG[modifierId];
    if (!def) return null;

    // Player-specific modifiers attach to a player in multiplayer
    const playerTargetedMods: FortunariumModifierId[] = [
      'mano_negra',
      'mal_contacto',
      'motor_fino',
      'ojo_dorado',
    ];
    const isPlayerTargeted =
      playerTargetedMods.includes(modifierId) && targetPlayer !== undefined;

    const existingIdx = room.activeModifiers.findIndex(
      (m) => m.modifierId === modifierId
    );
    if (existingIdx >= 0) {
      room.activeModifiers[existingIdx].spinsRemaining = def.defaultSpins;
      room.activeModifiers[existingIdx].appliedAtSpin = room.totalSpinsInMatch;
      if (isPlayerTargeted && targetPlayer) {
        room.activeModifiers[existingIdx].targetPlayerId = targetPlayer.id;
        room.activeModifiers[existingIdx].targetPlayerName = targetPlayer.name;
      }
      return room.activeModifiers[existingIdx];
    } else {
      const newMod = {
        id: `mod_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        modifierId,
        name: def.name,
        type: def.type,
        effect: def.effect,
        spinsRemaining: def.defaultSpins,
        durationType: def.durationType || 'SPINS',
        targetPlayerId: isPlayerTargeted && targetPlayer ? targetPlayer.id : undefined,
        targetPlayerName: isPlayerTargeted && targetPlayer ? targetPlayer.name : undefined,
        appliedAtSpin: room.totalSpinsInMatch,
      };
      room.activeModifiers.unshift(newMod);
      if (room.activeModifiers.length > 4) {
        room.activeModifiers.length = 4;
      }
      return newMod;
    }
  }

  // CRITICAL (Sections 30–39, 49, 55):
  // Sealing a quota NEVER subtracts or resets `room.money`.
  // In finite mode (`totalRounds !== null`), sealing the final quota wins the run.
  // In infinite mode (`totalRounds === null`), it always offers 3 upgrades and continues.
  private sealCurrentQuota(room: ServerFortunariumRoom, triggeredBy?: FortunariumPlayer) {
    room.quotaProgress = room.money;
    const overdriveBonusKeys = (room.overdriveSpins || 0) >= 3 ? 1 : 0;
    const hadOverdrive = room.overdriveSpins || 0;
    room.overdriveSpins = 0;
    room.activeIncident = null;
    room.activeRoulette = null;

    if (overdriveBonusKeys > 0) {
      room.keys += overdriveBonusKeys;
    }

    // Track completed quota for room-session statistics
    room.currentMatchQuotasCompleted = (room.currentMatchQuotasCompleted || 0) + 1;
    for (const p of room.players) {
      this.recordMatchParticipantSnapshot(room, p);
      const rec = room.currentMatchParticipants.get(p.id);
      if (rec) {
        rec.quotasCompletedWhilePresent += 1;
      }
    }

    if (room.totalRounds !== null && room.round >= room.totalRounds) {
      room.phase = 'VICTORY';
      room.defeatCause = null;
      room.endReason = `¡Habéis superado las ${room.totalRounds} cuotas del Fortunarium conservando ${room.money} CR en la Caja Común!`;
      this.finalizeMatchSessionStats(room);
      return;
    }

    room.readyForNextRoundPlayerIds = [];
    room.offeredUpgradeIds = this.rollRandomUpgrades(room);
    room.upgradeVotes = {};
    room.phase = 'ROUND_SHOP';

    this.addLog(room, {
      playerId: triggeredBy?.id,
      playerName: triggeredBy?.name,
      text: `¡Cuota ${room.round} sellada con ${room.money} CR${
        hadOverdrive > 0 ? ` tras +${hadOverdrive} giro(s) en Sobrecarga` : ''
      }${overdriveBonusKeys > 0 ? ' (+1 Llave por temeridad)' : ''}! Conserváis todo el dinero.`,
      variant: 'round',
    });
  }

  // Evaluate Bankruptcy (Sections 3, 4, 45, 54):
  // If sharedCash <= 0 OR sharedCash < cheapestSpinCost (and below quota with no active event),
  // the team is bankrupt -> DEFEAT.
  private evaluateBankruptcyOrQuota(room: ServerFortunariumRoom) {
    if (room.phase !== 'PLAYING' || room.isSpinning || room.activeEvent) return;

    const cheapestSpinCost = calculateEffectiveSpinCost('normal', room.upgrades);

    // If they cannot afford a spin, check if they already reached the quota
    if (room.money < cheapestSpinCost) {
      if (room.money >= room.quota) {
        this.sealCurrentQuota(room);
        return;
      }

      room.phase = 'DEFEAT';
      room.defeatCause = 'bankruptcy';
      room.endReason =
        room.money <= 0
          ? 'SIN CRÉDITOS — LA FORTUNA SE HA TERMINADO. FORTUNARIUM HA CERRADO SUS PUERTAS.'
          : `SIN CRÉDITOS SUFICIENTES (${room.money} CR) PARA COBRAR LA TIRADA MÍNIMA (${cheapestSpinCost} CR). LA FORTUNA SE HA TERMINADO.`;
    }
  }

  private startNewMatch(room: ServerFortunariumRoom) {
    if (room.spinTimer) {
      clearTimeout(room.spinTimer);
      room.spinTimer = null;
    }

    // If a previous match had not yet been finalized (e.g. direct restart), finalize it once
    if (
      room.phase === 'VICTORY' ||
      room.phase === 'DEFEAT' ||
      (room.phase !== 'LOBBY' && room.totalSpinsInMatch > 0)
    ) {
      this.finalizeMatchSessionStats(room);
    }

    for (const p of room.players) {
      p.stats = createEmptyStats();
    }

    const sortedConnected = room.players
      .filter((p) => p.isConnected)
      .sort((a, b) => a.seatIndex - b.seatIndex);

    const initialQuota = calculateInitialQuota(room.config.difficulty);

    room.matchId = `match_${room.roomCode}_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 6)}`;
    room.currentMatchQuotasCompleted = 0;
    room.currentMatchParticipants = new Map();
    for (const p of room.players) {
      this.ensurePlayerSessionEntry(room, p, true);
      this.recordMatchParticipantSnapshot(room, p);
    }

    room.phase = 'PLAYING';
    room.round = 1;
    room.totalRounds = room.config.totalRounds;
    room.money = STARTING_CREDITS;
    room.quotaProgress = STARTING_CREDITS;
    room.quota = initialQuota;
    room.maxSpinsPerRound = 999;
    room.spinsLeft = 999;
    room.totalSpinsInMatch = 0;
    room.totalPatternsHit = 0;
    room.totalJackpotsHit = 0;
    room.biggestSingleWinInMatch = 0;
    room.bestPatternNameInMatch = '—';
    room.peakMoneyInMatch = STARTING_CREDITS;
    room.bestSpinsInMatch = [];
    room.integrity = 100;
    room.maxIntegrity = 100;
    room.repairsUsedInQuota = 0;
    room.voltageMultiplier = 1.0;
    room.keys = 1;
    room.betMode = 'normal';
    room.grid = createDefaultGrid();
    room.isSpinning = false;
    room.lastSpinResult = null;
    room.upgrades = createInitialUpgradesState();
    room.offeredUpgradeIds = [];
    room.upgradeVotes = {};
    room.lastInstalledUpgradeId = null;
    room.upgradeHistory = [];
    room.overdriveSpins = 0;
    room.spinsSinceLastIncident = 0;
    room.activeModifiers = [];
    room.activeEvent = null;
    room.activeIncident = null;
    room.activeRoulette = null;
    room.readyForNextRoundPlayerIds = [];
    room.defeatCause = null;
    room.endReason = null;
    room.currentTurnPlayerId = sortedConnected[0]?.id || room.hostId;

    const quotaModeLabel =
      room.totalRounds === null ? 'ILIMITADAS' : `${room.totalRounds} Cuotas`;

    room.actionLog = [
      {
        id: `log_init_${Date.now()}`,
        text: `¡Fortunarium encendido! Modo: ${quotaModeLabel} — Cuota 1: alcanza ${room.quota} CR.`,
        variant: 'round',
        timestamp: Date.now(),
      },
    ];

    this.broadcastRoomState(room);
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
    this.ensureValidCurrentTurn(room);
    this.broadcastRoomState(room);

    const timer = setTimeout(() => {
      room.disconnectTimers.delete(player.id);
      if (!player.isConnected) {
        this.removePlayerPermanently(room, player.id);
      }
    }, 20000);

    room.disconnectTimers.set(player.id, timer);
  }

  private removePlayerPermanently(room: ServerFortunariumRoom, playerId: string) {
    const timer = room.disconnectTimers.get(playerId);
    if (timer) {
      clearTimeout(timer);
      room.disconnectTimers.delete(playerId);
    }

    const departingPlayer = room.players.find((p) => p.id === playerId);
    if (departingPlayer && room.phase !== 'LOBBY') {
      this.recordMatchParticipantSnapshot(room, departingPlayer);
    }

    room.players = room.players.filter((p) => p.id !== playerId);
    delete room.upgradeVotes[playerId];

    // Update room-session presence: keep entry if they participated in any match, otherwise clean up 0-stat entry
    const sessionEntry = room.fortunariumSessionStats?.[playerId];
    if (sessionEntry) {
      const participatedInCurrentMatch =
        room.phase !== 'LOBBY' && room.currentMatchParticipants?.has(playerId);
      if (
        sessionEntry.matchesPlayed === 0 &&
        sessionEntry.spins === 0 &&
        !participatedInCurrentMatch
      ) {
        delete room.fortunariumSessionStats[playerId];
      } else {
        sessionEntry.isCurrentlyInRoom = false;
        sessionEntry.isConnected = false;
      }
    }

    if (room.players.length === 0) {
      if (room.spinTimer) clearTimeout(room.spinTimer);
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

    const connectedCount = room.players.filter((p) => p.isConnected).length;
    if (room.phase !== 'LOBBY' && connectedCount < 1) {
      if (room.spinTimer) {
        clearTimeout(room.spinTimer);
        room.spinTimer = null;
      }
      room.phase = 'LOBBY';
      room.isSpinning = false;
      room.activeEvent = null;
    }

    this.ensureValidCurrentTurn(room);
    this.broadcastRoomState(room);
  }
}
