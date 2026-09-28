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
} from '../src/types/fortunarium';
import {
  FORTUNARIUM_UPGRADES_CATALOG,
  ALL_UPGRADE_IDS,
  createInitialUpgradesState,
  getUpgradeCostMoney,
  calculateEffectiveSpinCost,
} from '../src/data/fortunarium/fortunariumAssets';
import {
  generateAuthoritativeGrid,
  evaluateSpinGridCore,
} from '../src/utils/fortunariumEconomyEngine';
import { roomRegistry } from './roomRegistry';

interface ClientConnection {
  ws: WebSocket;
  playerId: string;
  roomCode: string;
}

interface ServerFortunariumRoom extends FortunariumRoomState {
  hostId: string;
  spinTimer: NodeJS.Timeout | null;
  disconnectTimers: Map<string, NodeJS.Timeout>;
}

const DEFAULT_CONFIG: FortunariumConfig = {
  totalRounds: 5,
  difficulty: 'normal',
  turnMode: 'turns',
};

function createEmptyStats(): FortunariumPlayerStats {
  return {
    spinsTriggered: 0,
    totalMoneyGenerated: 0,
    totalMoneyLost: 0,
    netBalance: 0,
    biggestSingleWin: 0,
    jackpotsHit: 0,
    bombsTriggered: 0,
    skullsTriggered: 0,
    coinsCollected: 0,
    keysFound: 0,
    integrityDamageCaused: 0,
    integrityRepaired: 0,
    upgradesBought: 0,
  };
}

function createDefaultGrid(): FortunariumSymbolId[][] {
  return [
    ['cereza', 'siete', 'limon'],
    ['campana', 'siete', 'naranja'],
    ['diamante', 'siete', 'trebol'],
    ['herradura', 'corona', 'ciruela'],
    ['uvas', 'estrella', 'cereza'],
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

    const room: ServerFortunariumRoom = {
      roomCode: code,
      stateVersion: 1,
      gameType: 'fortunarium',
      hostId: host.id,
      phase: 'LOBBY',
      config: finalConfig,
      players: [host],
      currentTurnPlayerId: host.id,
      round: 1,
      totalRounds: finalConfig.totalRounds,
      money: 120,
      quotaProgress: 0,
      quota: 95,
      spinsLeft: 15,
      maxSpinsPerRound: 15,
      totalSpinsInMatch: 0,
      integrity: 100,
      maxIntegrity: 100,
      voltageMultiplier: 1.0,
      keys: 1,
      betMode: 'normal',
      grid: createDefaultGrid(),
      isSpinning: false,
      lastSpinResult: null,
      upgrades: createInitialUpgradesState(),
      offeredUpgradeIds: [],
      upgradeVotes: {},
      activeEvent: null,
      readyForNextRoundPlayerIds: [],
      actionLog: [],
      endReason: null,
      spinTimer: null,
      disconnectTimers: new Map(),
    };

    this.rooms.set(code, room);
    roomRegistry.register(code, 'fortunarium', 'fortunarium');
    return this.serializeRoom(room);
  }

  private serializeRoom(room: ServerFortunariumRoom): FortunariumRoomState {
    return {
      roomCode: room.roomCode,
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
      integrity: room.integrity,
      maxIntegrity: room.maxIntegrity,
      voltageMultiplier: room.voltageMultiplier,
      keys: room.keys,
      betMode: room.betMode,
      grid: room.grid,
      isSpinning: room.isSpinning,
      lastSpinResult: room.lastSpinResult,
      upgrades: room.upgrades,
      offeredUpgradeIds: room.offeredUpgradeIds,
      upgradeVotes: room.upgradeVotes,
      activeEvent: room.activeEvent,
      readyForNextRoundPlayerIds: room.readyForNextRoundPlayerIds,
      actionLog: room.actionLog.slice(0, 18),
      endReason: room.endReason,
    };
  }

  private broadcastRoomState(room: ServerFortunariumRoom) {
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

  // Quota 1 = 95 CR (~10-12 ordinary spins). Escalates each cycle as upgrades empower the machine.
  private calculateQuotaForRound(
    round: number,
    difficulty: FortunariumConfig['difficulty']
  ): number {
    const diffMult =
      difficulty === 'temerario' ? 1.3 : difficulty === 'dificil' ? 1.15 : 1.0;
    const base = 95 * Math.pow(1.48, round - 1);
    return Math.round((base * diffMult) / 5) * 5;
  }

  // Pick 3 random distinct upgrades that are not yet at max level
  private rollRandomUpgrades(room: ServerFortunariumRoom): FortunariumUpgradeId[] {
    const candidates = ALL_UPGRADE_IDS.filter((id) => {
      const currentLv = room.upgrades[id] || 0;
      return currentLv < FORTUNARIUM_UPGRADES_CATALOG[id].maxLevel;
    });

    const pool = [...candidates];
    const picked: FortunariumUpgradeId[] = [];
    while (picked.length < 3 && pool.length > 0) {
      const idx = Math.floor(Math.random() * pool.length);
      picked.push(pool[idx]);
      pool.splice(idx, 1);
    }
    return picked;
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

    room.upgrades[upgradeId] = currentLv + 1;

    if (upgradeId === 'motor_extra') {
      room.maxSpinsPerRound += 2;
      room.spinsLeft += 2;
      room.maxIntegrity += 15;
      room.integrity = Math.min(room.maxIntegrity, room.integrity + 15);
    }

    this.addLog(room, {
      text: `${installedByText}: «${catalogItem.name}» (Nv. ${currentLv + 1}) instalada permanentemente.`,
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

  private generateForcedGrid(
    scenario: 'single_pattern' | 'multi_pattern' | 'special_symbol' | 'jackpot'
  ): FortunariumSymbolId[][] {
    if (scenario === 'single_pattern') {
      return [
        ['cereza', 'campana', 'limon'],
        ['naranja', 'campana', 'uvas'],
        ['ciruela', 'campana', 'trebol'],
        ['herradura', 'campana', 'estrella'],
        ['uvas', 'limon', 'cereza'],
      ];
    }
    if (scenario === 'multi_pattern') {
      return [
        ['diamante', 'corona', 'cereza'],
        ['diamante', 'corona', 'cereza'],
        ['diamante', 'corona', 'cereza'],
        ['diamante', 'comodin', 'limon'],
        ['estrella', 'herradura', 'naranja'],
      ];
    }
    if (scenario === 'special_symbol') {
      return [
        ['moneda', 'llave', 'cereza'],
        ['rayo', 'moneda', 'limon'],
        ['bomba', 'rayo', 'naranja'],
        ['moneda', 'trebol', 'calavera'],
        ['ciruela', 'uvas', 'campana'],
      ];
    }
    return [
      ['siete', 'corona', 'diamante'],
      ['siete', 'corona', 'diamante'],
      ['siete', 'comodin', 'estrella'],
      ['siete', 'corona', 'moneda'],
      ['siete', 'moneda', 'rayo'],
    ];
  }

  private createInteractiveEvent(
    player: FortunariumPlayer
  ): FortunariumActiveEvent {
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
              'Gana +45 CR para la Caja y la Cuota y +0.4x de Voltaje, pero sufre -12% de Integridad.',
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
            description: 'Obtén +1 Llave de Taller y +2 Tiradas Extra en este ciclo.',
            badgeText: '+1 LLAVE / +2 TIRADAS',
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
        const seatIndex = [0, 1, 2, 3].find((s) => !occupiedSeats.has(s)) ?? room.players.length;
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
        if (msg.config.totalRounds && [5, 7, 10].includes(msg.config.totalRounds)) {
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
        // Support 1 to 4 players (solo + co-op)
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
        if (room.spinsLeft <= 0) {
          this.sendError(ws, 'No quedan tiradas en este ciclo.');
          return;
        }
        if (room.config.turnMode === 'turns' && room.currentTurnPlayerId !== player.id) {
          this.sendError(ws, 'Es el turno de otro compañero en la máquina.');
          return;
        }

        const rawCost = calculateEffectiveSpinCost(room.betMode, room.upgrades);
        if (room.money <= 0) {
          this.sendError(ws, 'No quedan créditos en la Caja Común.');
          return;
        }
        const actualSpinCost = Math.min(room.money, rawCost);
        const moneyBeforeSpin = room.money;
        const moneyAfterSpinCost = Math.max(0, moneyBeforeSpin - actualSpinCost);
        const quotaProgressBefore = room.quotaProgress;

        // Deduct ONLY spin cost and decrement spinsLeft when spin starts
        room.money = moneyAfterSpinCost;
        room.spinsLeft = Math.max(0, room.spinsLeft - 1);
        room.totalSpinsInMatch += 1;

        const newGrid = msg.forceScenario
          ? this.generateForcedGrid(msg.forceScenario)
          : generateAuthoritativeGrid(room.upgrades, room.betMode);

        const core = evaluateSpinGridCore({
          grid: newGrid,
          betMode: room.betMode,
          upgrades: room.upgrades,
          currentVoltage: room.voltageMultiplier,
          round: room.round,
          allowMysteryEvents: room.spinsLeft >= 1,
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
        const finalQuotaProgress = quotaProgressBefore + core.grossPayout;
        const finalIntegrity = Math.max(
          0,
          Math.min(room.maxIntegrity, room.integrity + core.integrityDelta)
        );
        const finalKeys = room.keys + core.keysGained;
        const netMoneyDelta = core.grossPayout - core.penalties - actualSpinCost;

        let summaryText = '';
        if (core.grossPayout > 0 && core.penalties > 0) {
          summaryText = `${player.name} ganó +${core.grossPayout} CR (y sufrió -${core.penalties} CR en penalizaciones)`;
        } else if (core.grossPayout > 0) {
          summaryText = `${player.name} obtuvo +${core.grossPayout} CR`;
        } else if (core.penalties > 0) {
          summaryText = `${player.name} sufrió -${core.penalties} CR en penalizaciones`;
        } else {
          summaryText = `${player.name} giró sin combinación ganadora`;
        }

        room.stateVersion += 1;
        const spinResult: FortunariumSpinResult = {
          spinId: `spin_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          stateVersion: room.stateVersion,
          playerId: player.id,
          playerName: player.name,
          betMode: room.betMode,
          spinCost: actualSpinCost,
          moneyBeforeSpin,
          moneyAfterSpinCost,
          finalMoney,
          quotaProgressBefore,
          finalQuotaProgress,
          grid: newGrid,
          winLines: core.winLines,
          specialEffects: core.specialEffects,
          winningCells: core.winningCells,
          hazardCells: core.hazardCells,
          grossPayout: core.grossPayout,
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
          summaryText,
          timestamp: Date.now(),
        };

        // Keep pre-payout money/quotaProgress in room state while reels spin so nothing leaks early
        room.grid = newGrid;
        room.isSpinning = true;

        this.broadcastMessage(room, {
          type: 'SPIN_STARTED',
          spinResult,
          state: this.serializeRoom(room),
        });

        // Wait for the 5-reel carousel stop sequence (3.00s) before committing final state
        if (room.spinTimer) clearTimeout(room.spinTimer);
        room.spinTimer = setTimeout(() => {
          room.spinTimer = null;
          room.isSpinning = false;

          room.money = finalMoney;
          room.quotaProgress = finalQuotaProgress;
          room.integrity = finalIntegrity;
          room.voltageMultiplier = core.voltageMultiplierAfter;
          room.keys = finalKeys;
          room.spinsLeft += core.extraSpinsGained;
          room.lastSpinResult = spinResult;

          // Update individual player statistics
          player.stats.spinsTriggered += 1;
          player.stats.totalMoneyGenerated += core.grossPayout;
          player.stats.totalMoneyLost += actualSpinCost + core.penalties;
          player.stats.netBalance =
            player.stats.totalMoneyGenerated - player.stats.totalMoneyLost;
          if (core.grossPayout > player.stats.biggestSingleWin) {
            player.stats.biggestSingleWin = core.grossPayout;
          }
          if (core.isJackpot) {
            player.stats.jackpotsHit += 1;
          }
          const bombsCount = newGrid.flat().filter((s) => s === 'bomba').length;
          const skullsCount = newGrid.flat().filter((s) => s === 'calavera').length;
          const coinsCount = newGrid.flat().filter((s) => s === 'moneda').length;
          player.stats.bombsTriggered += bombsCount;
          player.stats.skullsTriggered += skullsCount;
          player.stats.coinsCollected += coinsCount;
          player.stats.keysFound += core.keysGained;
          if (core.integrityDelta < 0) {
            player.stats.integrityDamageCaused += Math.abs(core.integrityDelta);
          } else if (core.integrityDelta > 0) {
            player.stats.integrityRepaired += core.integrityDelta;
          }

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

          // 3. Advance turn and check round completion if out of spins or out of money
          this.advanceTurn(room);
          this.checkRoundEndAfterAction(room);
          this.broadcastRoomState(room);
        }, 3150);

        break;
      }

      case 'REPAIR_MACHINE': {
        if ((room.phase !== 'PLAYING' && room.phase !== 'ROUND_SHOP') || room.isSpinning) return;
        if (room.integrity >= room.maxIntegrity) {
          this.sendError(ws, 'La integridad de la máquina ya está al máximo.');
          return;
        }

        const baseRepairAmount = 25 + (room.upgrades.mecanico_jefe || 0) * 10;
        if (msg.useKey) {
          if (room.keys < 1) {
            this.sendError(ws, 'No tenéis Llaves disponibles.');
            return;
          }
          room.keys -= 1;
        } else {
          const repairCost = 28 + (room.round - 1) * 8;
          if (room.money < repairCost) {
            this.sendError(ws, `Necesitáis ${repairCost} CR para reparar la máquina.`);
            return;
          }
          room.money -= repairCost;
          player.stats.totalMoneyLost += repairCost;
          player.stats.netBalance =
            player.stats.totalMoneyGenerated - player.stats.totalMoneyLost;
        }

        const actualRepaired = Math.min(baseRepairAmount, room.maxIntegrity - room.integrity);
        room.integrity += actualRepaired;
        player.stats.integrityRepaired += actualRepaired;

        this.addLog(room, {
          playerId: player.id,
          playerName: player.name,
          text: `${player.name} reparó +${actualRepaired}% de Integridad.`,
          integrityDelta: actualRepaired,
          variant: 'repair',
        });

        this.broadcastRoomState(room);
        break;
      }

      case 'BUY_UPGRADE': {
        if ((room.phase !== 'PLAYING' && room.phase !== 'ROUND_SHOP') || room.isSpinning) return;
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
          if (room.money < cost) {
            this.sendError(ws, `No hay suficientes créditos en la Caja Común (${cost} CR).`);
            return;
          }
          room.money -= cost;
          player.stats.totalMoneyLost += cost;
          player.stats.netBalance =
            player.stats.totalMoneyGenerated - player.stats.totalMoneyLost;
        }

        player.stats.upgradesBought += 1;
        this.installUpgradeOnMachine(room, msg.upgradeId, `${player.name} compró en el Taller`);
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
          // Unanimous agreement reached! Install the selected build-defining upgrade
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
            room.spinsLeft += 2;
            player.stats.keysFound += 1;
            outcomeText = `${player.name} extrajo +1 Llave y +2 Tiradas Extra.`;
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
          room.quotaProgress += moneyChange;
          player.stats.totalMoneyGenerated += moneyChange;
          if (moneyChange > player.stats.biggestSingleWin) {
            player.stats.biggestSingleWin = moneyChange;
          }
        } else if (moneyChange < 0) {
          const loss = Math.min(room.money, Math.abs(moneyChange));
          room.money -= loss;
          player.stats.totalMoneyLost += loss;
        }
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
          room.endReason =
            '¡AVERÍA CATASTRÓFICA! El evento sobrecargó la máquina y redujo su integridad al 0%.';
          this.broadcastRoomState(room);
          return;
        }

        room.phase = 'PLAYING';
        this.advanceTurn(room);
        this.checkRoundEndAfterAction(room);
        this.broadcastRoomState(room);
        break;
      }

      case 'PAY_QUOTA_EARLY': {
        if (room.phase !== 'PLAYING' || room.isSpinning) return;
        if (room.quotaProgress < room.quota) {
          this.sendError(
            ws,
            `Aún faltan ${room.quota - room.quotaProgress} CR de Progreso de Cuota.`
          );
          return;
        }
        this.completeCurrentQuota(room, player);
        this.broadcastRoomState(room);
        break;
      }

      case 'NEXT_ROUND': {
        if (room.phase !== 'ROUND_SHOP') return;
        if (room.offeredUpgradeIds.length > 0) {
          this.sendError(
            ws,
            'Debéis elegir por unanimidad una de las 3 mejoras de cuota antes de continuar.'
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
          room.quotaProgress = 0;
          room.quota = this.calculateQuotaForRound(room.round, room.config.difficulty);
          room.spinsLeft = room.maxSpinsPerRound;
          room.readyForNextRoundPlayerIds = [];
          room.offeredUpgradeIds = [];
          room.upgradeVotes = {};
          room.phase = 'PLAYING';
          this.addLog(room, {
            text: `¡Comienza la Cuota ${room.round}/${room.totalRounds}! Objetivo del ciclo: ${room.quota} CR.`,
            variant: 'round',
          });
        }
        this.broadcastRoomState(room);
        break;
      }

      case 'RESTART_MATCH': {
        if (!player.isHost && room.players.filter((p) => p.isConnected).length > 1) return;
        this.startNewMatch(room);
        break;
      }

      case 'RETURN_TO_LOBBY': {
        if (room.spinTimer) {
          clearTimeout(room.spinTimer);
          room.spinTimer = null;
        }
        room.phase = 'LOBBY';
        room.isSpinning = false;
        room.activeEvent = null;
        room.endReason = null;
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

  private completeCurrentQuota(room: ServerFortunariumRoom, triggeredBy?: FortunariumPlayer) {
    if (room.round >= room.totalRounds) {
      room.phase = 'VICTORY';
      room.endReason = `¡Habéis superado las ${room.totalRounds} cuotas del Fortunarium con ${room.money} CR en la Caja Común!`;
      return;
    }

    const earlySpinBonus = room.spinsLeft * (4 + room.round * 2);
    if (earlySpinBonus > 0) {
      room.money += earlySpinBonus;
      if (triggeredBy) {
        triggeredBy.stats.totalMoneyGenerated += earlySpinBonus;
        triggeredBy.stats.netBalance =
          triggeredBy.stats.totalMoneyGenerated - triggeredBy.stats.totalMoneyLost;
      }
    }

    room.spinsLeft = 0;
    room.readyForNextRoundPlayerIds = [];
    room.offeredUpgradeIds = this.rollRandomUpgrades(room);
    room.upgradeVotes = {};
    room.phase = 'ROUND_SHOP';

    this.addLog(room, {
      playerId: triggeredBy?.id,
      playerName: triggeredBy?.name,
      text:
        earlySpinBonus > 0
          ? `¡Cuota ${room.round} sellada! Bono por tiradas restantes: +${earlySpinBonus} CR. Elegid 1 de las 3 mejoras.`
          : `¡Cuota ${room.round} completada! Elegid 1 de las 3 mejoras.`,
      moneyDelta: earlySpinBonus,
      variant: 'round',
    });
  }

  private checkRoundEndAfterAction(room: ServerFortunariumRoom) {
    if (room.phase !== 'PLAYING') return;

    // If out of spins or out of money without enough to spin
    const minSpinCost = calculateEffectiveSpinCost('normal', room.upgrades);
    const cannotSpinAnymore = room.spinsLeft <= 0 || room.money <= 0;

    if (!cannotSpinAnymore) return;

    if (room.quotaProgress >= room.quota) {
      this.completeCurrentQuota(room);
    } else {
      room.phase = 'DEFEAT';
      room.endReason =
        room.money <= 0 && room.spinsLeft > 0 && minSpinCost > 0
          ? `La Caja Común se quedó a 0 CR en la Cuota ${room.round} (${room.quotaProgress}/${room.quota} CR conseguidos).`
          : `Se agotaron las tiradas de la Cuota ${room.round}. Lograsteis ${room.quotaProgress} CR de los ${room.quota} CR requeridos.`;
    }
  }

  private startNewMatch(room: ServerFortunariumRoom) {
    if (room.spinTimer) {
      clearTimeout(room.spinTimer);
      room.spinTimer = null;
    }

    for (const p of room.players) {
      p.stats = createEmptyStats();
    }

    const sortedConnected = room.players
      .filter((p) => p.isConnected)
      .sort((a, b) => a.seatIndex - b.seatIndex);

    room.phase = 'PLAYING';
    room.round = 1;
    room.totalRounds = room.config.totalRounds;
    room.money = 120;
    room.quotaProgress = 0;
    room.quota = this.calculateQuotaForRound(1, room.config.difficulty);
    room.maxSpinsPerRound = 15;
    room.spinsLeft = 15;
    room.totalSpinsInMatch = 0;
    room.integrity = 100;
    room.maxIntegrity = 100;
    room.voltageMultiplier = 1.0;
    room.keys = 1;
    room.betMode = 'normal';
    room.grid = createDefaultGrid();
    room.isSpinning = false;
    room.lastSpinResult = null;
    room.upgrades = createInitialUpgradesState();
    room.offeredUpgradeIds = [];
    room.upgradeVotes = {};
    room.activeEvent = null;
    room.readyForNextRoundPlayerIds = [];
    room.endReason = null;
    room.currentTurnPlayerId = sortedConnected[0]?.id || room.hostId;
    room.actionLog = [
      {
        id: `log_init_${Date.now()}`,
        text: `¡Fortunarium encendido! Cuota 1/${room.totalRounds} — Objetivo: ${room.quota} CR.`,
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

    room.players = room.players.filter((p) => p.id !== playerId);
    delete room.upgradeVotes[playerId];

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
