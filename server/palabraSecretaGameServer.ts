import { WebSocketServer, WebSocket } from 'ws';
import {
  PalabraSecretaRoomState,
  PalabraSecretaPlayer,
  PalabraSecretaTeam,
  PalabraSecretaConfig,
  PalabraSecretaTurnSummary,
  SecretWordItem,
  TurnWordResult,
  PalabraSecretaClientMessage,
  PalabraSecretaServerMessage,
} from '../src/types/palabraSecreta';
import { PALABRA_SECRETA_WORDS, getRandomWord } from '../src/data/palabraSecretaWords';
import { roomRegistry } from './roomRegistry';
import { matchDepartureHandler } from './matchDepartureHandler';

interface ClientConnection {
  ws: WebSocket;
  playerId: string;
  roomId: string;
}

interface ServerRoom {
  code: string;
  gameType: 'palabra-secreta';
  hostId: string;
  phase: PalabraSecretaRoomState['phase'];
  config: PalabraSecretaConfig;
  players: PalabraSecretaPlayer[];
  teams: {
    'team-1': PalabraSecretaTeam;
    'team-2': PalabraSecretaTeam;
  };
  currentRound: number;
  totalRounds: number;
  activeTeamId: 'team-1' | 'team-2';
  activeDescriptorId: string;
  teamDescriptorPointers: {
    'team-1': number;
    'team-2': number;
  };
  currentTurnNumber: number;
  totalTurnsInMatch: number;
  turnEndsAt?: number;
  turnRemainingSeconds: number;
  preTurnCountdown?: number;
  currentWord: SecretWordItem | null;
  usedWordIds: Set<string>;
  turnWordsHistory: TurnWordResult[];
  turnPoints: number;
  turnSkipsUsed: number;
  winningTeamId: 'team-1' | 'team-2' | 'tie' | null;
  lastTurnSummary?: PalabraSecretaTurnSummary;
  timerInterval: NodeJS.Timeout | null;
  preTurnInterval: NodeJS.Timeout | null;
  intermissionTimeout: NodeJS.Timeout | null;
  abortReason?: string;
  endMessage?: string;
}

const DEFAULT_CONFIG: PalabraSecretaConfig = {
  timePerTurn: 60,
  totalRounds: 3,
  maxSkipsPerTurn: -1,
  penaltyOnSkip: true,
  penaltyOnTaboo: true,
  showForbiddenWords: true,
};

export class PalabraSecretaServer {
  public wss: WebSocketServer;
  private rooms: Map<string, ServerRoom> = new Map();
  private connections: Map<WebSocket, ClientConnection> = new Map();

  constructor() {
    this.wss = new WebSocketServer({ noServer: true });
    this.setupWebSocketServer();
  }

  private setupWebSocketServer() {
    this.wss.on('connection', (ws: WebSocket) => {
      ws.on('message', (data: string) => {
        try {
          const message: PalabraSecretaClientMessage = JSON.parse(data.toString());
          this.handleClientMessage(ws, message);
        } catch (e) {
          console.error('[PalabraSecretaServer] Error parsing JSON message:', e);
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(ws);
      });

      ws.on('error', (err) => {
        console.error('[PalabraSecretaServer] WebSocket error:', err);
      });
    });
  }

  public getRoomInfo(code: string) {
    const cleanCode = code.toUpperCase().trim();
    const room = this.rooms.get(cleanCode);
    if (!room) return null;
    return {
      roomId: room.code,
      roomCode: room.code,
      code: room.code,
      gameType: 'palabra-secreta' as const,
      hostId: room.hostId,
      phase: room.phase,
      createdAt: Date.now(),
      playersCount: room.players.length,
      maxPlayers: 16,
      isFull: room.players.length >= 16,
      settings: room.config,
      config: room.config,
      players: room.players,
    };
  }

  public createRoomDirect(
    hostPlayer: { id: string; name: string; avatar: string; color: string },
    config?: Partial<PalabraSecretaConfig>
  ) {
    const code = roomRegistry.generateCode();
    const cleanCode = code.toUpperCase().trim();

    const mergedConfig: PalabraSecretaConfig = {
      ...DEFAULT_CONFIG,
      ...(config || {}),
    };

    const host: PalabraSecretaPlayer = {
      id: hostPlayer.id,
      name: hostPlayer.name.trim() || 'Jugador 1',
      avatar: hostPlayer.avatar || '🦊',
      color: hostPlayer.color || '#10B981',
      teamId: 'team-1',
      isConnected: false,
      isHost: true,
      wordsDescribedCount: 0,
      wordsGuessedCount: 0,
    };

    const room: ServerRoom = {
      code: cleanCode,
      gameType: 'palabra-secreta',
      hostId: host.id,
      phase: 'LOBBY',
      config: mergedConfig,
      players: [host],
      teams: {
        'team-1': {
          id: 'team-1',
          name: 'Equipo Esmeralda',
          color: '#10B981',
          score: 0,
          playerIds: [host.id],
        },
        'team-2': {
          id: 'team-2',
          name: 'Equipo Zafiro',
          color: '#06B6D4',
          score: 0,
          playerIds: [],
        },
      },
      currentRound: 1,
      totalRounds: mergedConfig.totalRounds,
      activeTeamId: 'team-1',
      activeDescriptorId: '',
      teamDescriptorPointers: {
        'team-1': 0,
        'team-2': 0,
      },
      currentTurnNumber: 1,
      totalTurnsInMatch: mergedConfig.totalRounds * 2,
      turnRemainingSeconds: mergedConfig.timePerTurn,
      currentWord: null,
      usedWordIds: new Set<string>(),
      turnWordsHistory: [],
      turnPoints: 0,
      turnSkipsUsed: 0,
      winningTeamId: null,
      timerInterval: null,
      preTurnInterval: null,
      intermissionTimeout: null,
    };

    this.rooms.set(cleanCode, room);
    roomRegistry.register(cleanCode, 'palabra-secreta', 'party');
    console.log(`[PalabraSecretaServer] Created room ${cleanCode} with host ${host.name}`);
    return {
      roomId: cleanCode,
      roomCode: cleanCode,
      code: cleanCode,
      gameType: 'palabra-secreta' as const,
      hostId: host.id,
      phase: 'LOBBY' as const,
      createdAt: Date.now(),
      settings: mergedConfig,
      config: mergedConfig,
      players: [host],
      playersCount: 1,
      maxPlayers: 16,
      isFull: false,
    };
  }

  private handleClientMessage(ws: WebSocket, message: PalabraSecretaClientMessage) {
    if (message.type === 'PING') {
      ws.send(JSON.stringify({ type: 'PONG' }));
      return;
    }

    if (message.type === 'JOIN_ROOM') {
      this.handleJoinRoom(ws, message.roomCode, message.player);
      return;
    }

    const conn = this.connections.get(ws);
    if (!conn) {
      ws.send(JSON.stringify({ type: 'ERROR', message: 'No estás conectado a ninguna sala' }));
      return;
    }

    const room = this.rooms.get(conn.roomId);
    if (!room) {
      ws.send(JSON.stringify({ type: 'ERROR', message: 'La sala ya no existe' }));
      return;
    }

    switch (message.type) {
      case 'UPDATE_CONFIG':
        this.handleUpdateConfig(room, conn.playerId, message.config);
        break;
      case 'SWITCH_TEAM':
        this.handleSwitchTeam(room, conn.playerId, message.playerId, message.targetTeamId);
        break;
      case 'UPDATE_TEAM_NAME':
        this.handleUpdateTeamName(room, conn.playerId, message.teamId, message.name);
        break;
      case 'RANDOMIZE_TEAMS':
        this.handleRandomizeTeams(room, conn.playerId);
        break;
      case 'START_GAME':
        this.handleStartGame(room, conn.playerId);
        break;
      case 'START_TURN_NOW':
        this.handleStartTurnNow(room, conn.playerId);
        break;
      case 'MARK_GUESSED':
        this.handleMarkGuessed(room, conn.playerId);
        break;
      case 'SKIP_WORD':
        this.handleSkipWord(room, conn.playerId);
        break;
      case 'MARK_TABOO':
        this.handleMarkTaboo(room, conn.playerId);
        break;
      case 'NEXT_TURN':
        this.handleNextTurn(room, conn.playerId);
        break;
      case 'PLAY_AGAIN':
        this.handlePlayAgain(room, conn.playerId);
        break;
      case 'KICK_PLAYER':
        this.handleKickPlayer(room, conn.playerId, message.targetPlayerId);
        break;
    }
  }

  private handleJoinRoom(
    ws: WebSocket,
    rawCode: string,
    playerData: { id: string; name: string; avatar: string; color: string }
  ) {
    const code = rawCode.toUpperCase().trim();
    let room = this.rooms.get(code);

    if (!room) {
      // Auto-create if not existing yet
      const created = this.createRoomDirect(playerData);
      room = this.rooms.get(created.code)!;
    }

    this.connections.set(ws, {
      ws,
      playerId: playerData.id,
      roomId: room.code,
    });

    let player = room.players.find((p) => p.id === playerData.id);
    if (player) {
      // Reconnecting player
      player.isConnected = true;
      player.name = playerData.name.trim() || player.name;
      player.avatar = playerData.avatar || player.avatar;
      player.color = playerData.color || player.color;
    } else {
      // Balance onto team with fewer players
      const team1Count = room.teams['team-1'].playerIds.length;
      const team2Count = room.teams['team-2'].playerIds.length;
      const assignedTeam: 'team-1' | 'team-2' = team1Count <= team2Count ? 'team-1' : 'team-2';

      player = {
        id: playerData.id,
        name: playerData.name.trim() || `Jugador ${room.players.length + 1}`,
        avatar: playerData.avatar || '🦊',
        color: playerData.color || (assignedTeam === 'team-1' ? '#10B981' : '#06B6D4'),
        teamId: assignedTeam,
        isConnected: true,
        isHost: room.players.length === 0 || room.hostId === playerData.id,
        wordsDescribedCount: 0,
        wordsGuessedCount: 0,
      };

      room.players.push(player);
      room.teams[assignedTeam].playerIds.push(player.id);

      if (player.isHost) {
        room.hostId = player.id;
      }
    }

    // Cancel any pending grace period for reconnected player
    matchDepartureHandler.cancelGracePeriod(room.code, player.id);

    console.log(`[PalabraSecretaServer] Player ${player.name} joined room ${room.code} on ${player.teamId}`);
    this.broadcastRoomState(room);
  }

  private handleDisconnect(ws: WebSocket) {
    const conn = this.connections.get(ws);
    if (!conn) return;
    this.connections.delete(ws);

    const room = this.rooms.get(conn.roomId);
    if (!room) return;

    const player = room.players.find((p) => p.id === conn.playerId);
    if (!player) return;

    player.isConnected = false;
    console.log(`[PalabraSecretaServer] Player ${player.name} disconnected from room ${room.code}`);

    if (room.phase === 'LOBBY') {
      // In lobby, if player disconnects permanently or after short delay, can be removed if needed
      // If host left, migrate host
      if (player.isHost) {
        const nextHost = room.players.find((p) => p.isConnected && p.id !== player.id);
        if (nextHost) {
          player.isHost = false;
          nextHost.isHost = true;
          room.hostId = nextHost.id;
        }
      }
      this.broadcastRoomState(room);
      return;
    }

    // In match: Start grace period for reconnection
    matchDepartureHandler.registerDisconnection(
      room.code,
      player.id,
      'palabra-secreta',
      () => {
        const isGameActive =
          room.phase !== 'LOBBY' && room.phase !== 'PODIUM' && room.phase !== 'MATCH_ABORTED';
        const evalResult = matchDepartureHandler.evaluatePermanentDeparture({
          gameType: 'palabra-secreta',
          isGameActive,
          departingPlayerId: player.id,
          wasHost: room.hostId === player.id,
          players: room.players,
        });

        if (evalResult.shouldAbort) {
          this.clearAllTimers(room);
          room.phase = 'MATCH_ABORTED';
          room.abortReason = evalResult.abortReason;
          room.endMessage = evalResult.endMessage;
          matchDepartureHandler.clearRoomGracePeriods(room.code);
          this.broadcastRoomState(room);
        } else if (evalResult.migratedHost) {
          const newHost = room.players.find((p) => p.id === evalResult.migratedHost!.id);
          if (newHost) {
            room.players.forEach((p) => (p.isHost = false));
            newHost.isHost = true;
            room.hostId = newHost.id;
            this.broadcastRoomState(room);
          }
        }
      }
    );

    this.broadcastRoomState(room);
  }

  private handleUpdateConfig(room: ServerRoom, playerId: string, config: Partial<PalabraSecretaConfig>) {
    if (room.hostId !== playerId) return;
    if (room.phase !== 'LOBBY') return;

    room.config = {
      ...room.config,
      ...config,
    };
    room.totalRounds = room.config.totalRounds;
    room.turnRemainingSeconds = room.config.timePerTurn;
    this.broadcastRoomState(room);
  }

  private handleSwitchTeam(
    room: ServerRoom,
    senderId: string,
    targetPlayerId: string,
    targetTeamId: 'team-1' | 'team-2'
  ) {
    if (room.phase !== 'LOBBY') return;
    // Allow players to switch themselves, or host to move any player
    if (senderId !== targetPlayerId && room.hostId !== senderId) return;

    const player = room.players.find((p) => p.id === targetPlayerId);
    if (!player) return;

    const oldTeamId = player.teamId;
    if (oldTeamId === targetTeamId) return;

    // Remove from old team
    room.teams[oldTeamId].playerIds = room.teams[oldTeamId].playerIds.filter((id) => id !== targetPlayerId);
    // Add to target team
    room.teams[targetTeamId].playerIds.push(targetPlayerId);
    player.teamId = targetTeamId;

    this.broadcastRoomState(room);
  }

  private handleUpdateTeamName(
    room: ServerRoom,
    playerId: string,
    teamId: 'team-1' | 'team-2',
    name: string
  ) {
    if (room.hostId !== playerId) return;
    const cleanName = name.trim().slice(0, 24);
    if (!cleanName) return;

    room.teams[teamId].name = cleanName;
    this.broadcastRoomState(room);
  }

  private handleRandomizeTeams(room: ServerRoom, playerId: string) {
    if (room.hostId !== playerId) return;
    if (room.phase !== 'LOBBY') return;

    const shuffled = [...room.players].sort(() => Math.random() - 0.5);
    room.teams['team-1'].playerIds = [];
    room.teams['team-2'].playerIds = [];

    shuffled.forEach((p, idx) => {
      const teamId: 'team-1' | 'team-2' = idx % 2 === 0 ? 'team-1' : 'team-2';
      p.teamId = teamId;
      room.teams[teamId].playerIds.push(p.id);
    });

    this.broadcastRoomState(room);
  }

  private handleStartGame(room: ServerRoom, playerId: string) {
    if (room.hostId !== playerId) return;
    if (room.phase !== 'LOBBY') return;

    // Requirement: Must support 4+ players (2 teams, 2 players/team minimum)
    const team1Count = room.teams['team-1'].playerIds.length;
    const team2Count = room.teams['team-2'].playerIds.length;

    if (team1Count < 2 || team2Count < 2) {
      this.sendToPlayer(playerId, {
        type: 'ERROR',
        message: 'Se necesitan al menos 2 jugadores por equipo (mínimo 4 jugadores en total) para comenzar.',
      });
      return;
    }

    // Reset scores & stats
    room.teams['team-1'].score = 0;
    room.teams['team-2'].score = 0;
    room.players.forEach((p) => {
      p.wordsDescribedCount = 0;
      p.wordsGuessedCount = 0;
    });
    room.currentRound = 1;
    room.currentTurnNumber = 1;
    room.teamDescriptorPointers = { 'team-1': 0, 'team-2': 0 };
    room.activeTeamId = 'team-1';
    room.usedWordIds.clear();

    // Calculate total turns in match
    const maxPlayersPerTeam = Math.max(team1Count, team2Count);
    room.totalTurnsInMatch = room.config.totalRounds * 2 * maxPlayersPerTeam;

    this.preparePreTurn(room);
  }

  private preparePreTurn(room: ServerRoom) {
    this.clearAllTimers(room);

    // Pick active descriptor for current team
    const activeTeam = room.teams[room.activeTeamId];
    const pointer = room.teamDescriptorPointers[room.activeTeamId];
    const validPlayerIds = activeTeam.playerIds.filter((id) =>
      room.players.some((p) => p.id === id && p.isConnected)
    );
    const fallbackPlayerIds = activeTeam.playerIds;
    const pool = validPlayerIds.length > 0 ? validPlayerIds : fallbackPlayerIds;

    const descriptorId = pool[pointer % pool.length];
    room.activeDescriptorId = descriptorId;
    room.teamDescriptorPointers[room.activeTeamId] = (pointer + 1) % pool.length;

    room.phase = 'PRE_TURN';
    room.preTurnCountdown = 4;
    room.turnPoints = 0;
    room.turnSkipsUsed = 0;
    room.turnWordsHistory = [];
    room.currentWord = null;

    this.broadcastRoomState(room);

    // Automatic countdown in pre-turn
    room.preTurnInterval = setInterval(() => {
      if (room.preTurnCountdown !== undefined && room.preTurnCountdown > 1) {
        room.preTurnCountdown -= 1;
        this.broadcast({
          type: 'PRE_TURN_TICK',
          countdown: room.preTurnCountdown,
        }, room);
      } else {
        if (room.preTurnInterval) clearInterval(room.preTurnInterval);
        room.preTurnInterval = null;
        this.startActiveTurn(room);
      }
    }, 1000);
  }

  private handleStartTurnNow(room: ServerRoom, playerId: string) {
    if (room.phase !== 'PRE_TURN') return;
    // Descriptor or host can bypass countdown
    if (playerId !== room.activeDescriptorId && playerId !== room.hostId) return;

    if (room.preTurnInterval) {
      clearInterval(room.preTurnInterval);
      room.preTurnInterval = null;
    }
    this.startActiveTurn(room);
  }

  private startActiveTurn(room: ServerRoom) {
    this.clearAllTimers(room);
    room.phase = 'ACTIVE_TURN';
    room.turnRemainingSeconds = room.config.timePerTurn;
    room.turnEndsAt = Date.now() + room.config.timePerTurn * 1000;
    room.turnPoints = 0;
    room.turnSkipsUsed = 0;
    room.turnWordsHistory = [];

    // Draw first secret word
    this.nextSecretWord(room);

    this.broadcastRoomState(room);

    // Active turn authoritative clock
    room.timerInterval = setInterval(() => {
      room.turnRemainingSeconds -= 1;

      if (room.turnRemainingSeconds <= 0) {
        this.endActiveTurn(room);
      } else {
        this.broadcast({
          type: 'TURN_TICK',
          remainingSeconds: room.turnRemainingSeconds,
        }, room);
      }
    }, 1000);
  }

  private nextSecretWord(room: ServerRoom) {
    const nextWord = getRandomWord(room.usedWordIds);
    room.usedWordIds.add(nextWord.id);
    room.currentWord = nextWord;
  }

  private handleMarkGuessed(room: ServerRoom, playerId: string) {
    if (room.phase !== 'ACTIVE_TURN') return;
    if (playerId !== room.activeDescriptorId) return;
    if (!room.currentWord) return;

    const points = 1;
    room.turnPoints += points;
    room.teams[room.activeTeamId].score += points;

    const descriptor = room.players.find((p) => p.id === playerId);
    if (descriptor) {
      descriptor.wordsDescribedCount += 1;
    }

    // Record word
    room.turnWordsHistory.push({
      word: room.currentWord.word,
      category: room.currentWord.category,
      status: 'GUESSED',
      points,
      timestamp: Date.now(),
    });

    this.broadcast({
      type: 'ACTION_FEEDBACK',
      action: 'GUESSED',
      word: room.currentWord.word,
      points,
    }, room);

    this.nextSecretWord(room);
    this.broadcastRoomState(room);
  }

  private handleSkipWord(room: ServerRoom, playerId: string) {
    if (room.phase !== 'ACTIVE_TURN') return;
    if (playerId !== room.activeDescriptorId) return;
    if (!room.currentWord) return;

    if (room.config.maxSkipsPerTurn !== -1 && room.turnSkipsUsed >= room.config.maxSkipsPerTurn) {
      this.sendToPlayer(playerId, {
        type: 'ERROR',
        message: 'Has agotado los saltos permitidos para este turno',
      });
      return;
    }

    room.turnSkipsUsed += 1;
    const points = -1; // Each skipped word gives -1 penalty to the team's score
    room.turnPoints += points;
    room.teams[room.activeTeamId].score += points; // Score can go negative

    room.turnWordsHistory.push({
      word: room.currentWord.word,
      category: room.currentWord.category,
      status: 'SKIPPED',
      points,
      timestamp: Date.now(),
    });

    this.broadcast({
      type: 'ACTION_FEEDBACK',
      action: 'SKIPPED',
      word: room.currentWord.word,
      points,
    }, room);

    this.nextSecretWord(room);
    this.broadcastRoomState(room);
  }

  private handleMarkTaboo(room: ServerRoom, playerId: string) {
    if (room.phase !== 'ACTIVE_TURN') return;
    if (playerId !== room.activeDescriptorId) return;
    if (!room.currentWord) return;

    const points = room.config.penaltyOnTaboo ? -1 : 0;
    if (points !== 0) {
      room.turnPoints += points;
      room.teams[room.activeTeamId].score += points; // Score can go negative
    }

    room.turnWordsHistory.push({
      word: room.currentWord.word,
      category: room.currentWord.category,
      status: 'TABOO',
      points,
      timestamp: Date.now(),
    });

    this.broadcast({
      type: 'ACTION_FEEDBACK',
      action: 'TABOO',
      word: room.currentWord.word,
      points,
    }, room);

    this.nextSecretWord(room);
    this.broadcastRoomState(room);
  }

  private endActiveTurn(room: ServerRoom) {
    this.clearAllTimers(room);
    room.phase = 'TURN_RESULTS';
    room.turnRemainingSeconds = 0;

    const descriptor = room.players.find((p) => p.id === room.activeDescriptorId);
    const activeTeam = room.teams[room.activeTeamId];
    const nextTeamId: 'team-1' | 'team-2' = room.activeTeamId === 'team-1' ? 'team-2' : 'team-1';
    const nextTeam = room.teams[nextTeamId];

    const nextPointer = room.teamDescriptorPointers[nextTeamId];
    const nextDescriptorId = nextTeam.playerIds[nextPointer % nextTeam.playerIds.length];
    const nextDescriptor = room.players.find((p) => p.id === nextDescriptorId);

    const summary: PalabraSecretaTurnSummary = {
      teamId: room.activeTeamId,
      teamName: activeTeam.name,
      descriptorName: descriptor?.name || 'Descriptor',
      descriptorAvatar: descriptor?.avatar || '🦊',
      pointsGained: room.turnPoints,
      words: [...room.turnWordsHistory],
      nextTeamId,
      nextDescriptorName: nextDescriptor?.name || 'Compañero',
    };

    room.lastTurnSummary = summary;

    // Advance turn & round tracking
    room.currentTurnNumber += 1;
    // Check if match ended
    if (room.currentTurnNumber > room.totalTurnsInMatch) {
      // Determine winner
      const s1 = room.teams['team-1'].score;
      const s2 = room.teams['team-2'].score;
      if (s1 > s2) {
        room.winningTeamId = 'team-1';
      } else if (s2 > s1) {
        room.winningTeamId = 'team-2';
      } else {
        room.winningTeamId = 'tie';
      }
      room.phase = 'PODIUM';
    } else {
      // Calculate current round
      const turnsPerRound = room.teams['team-1'].playerIds.length + room.teams['team-2'].playerIds.length;
      room.currentRound = Math.min(
        room.config.totalRounds,
        Math.floor((room.currentTurnNumber - 1) / Math.max(1, turnsPerRound)) + 1
      );
      // Alternate active team
      room.activeTeamId = nextTeamId;
    }

    this.broadcastRoomState(room);
  }

  private handleNextTurn(room: ServerRoom, playerId: string) {
    if (room.phase !== 'TURN_RESULTS') return;
    // Anyone can click or host can click to proceed
    this.preparePreTurn(room);
  }

  private handlePlayAgain(room: ServerRoom, playerId: string) {
    if (room.phase !== 'PODIUM') return;
    if (room.hostId !== playerId) return;

    room.phase = 'LOBBY';
    room.currentRound = 1;
    room.currentTurnNumber = 1;
    room.teams['team-1'].score = 0;
    room.teams['team-2'].score = 0;
    room.winningTeamId = null;
    room.lastTurnSummary = undefined;
    room.turnWordsHistory = [];
    room.usedWordIds.clear();

    this.broadcastRoomState(room);
  }

  private handleKickPlayer(room: ServerRoom, hostPlayerId: string, targetPlayerId: string) {
    if (room.hostId !== hostPlayerId) return;
    if (hostPlayerId === targetPlayerId) return;

    const target = room.players.find((p) => p.id === targetPlayerId);
    if (!target) return;

    // Remove from team & player list
    room.teams['team-1'].playerIds = room.teams['team-1'].playerIds.filter((id) => id !== targetPlayerId);
    room.teams['team-2'].playerIds = room.teams['team-2'].playerIds.filter((id) => id !== targetPlayerId);
    room.players = room.players.filter((p) => p.id !== targetPlayerId);

    // Disconnect websocket
    for (const [ws, conn] of this.connections.entries()) {
      if (conn.roomId === room.code && conn.playerId === targetPlayerId) {
        ws.send(JSON.stringify({ type: 'ERROR', message: 'Has sido expulsado de la sala por el anfitrión' }));
        ws.close();
        this.connections.delete(ws);
        break;
      }
    }

    this.broadcastRoomState(room);
  }

  private abortMatch(room: ServerRoom, reason: string) {
    this.clearAllTimers(room);
    room.phase = 'LOBBY';
    room.abortReason = reason;
    room.endMessage = reason;
    this.broadcast({
      type: 'ERROR',
      message: reason,
    }, room);
    this.broadcastRoomState(room);
  }

  private clearAllTimers(room: ServerRoom) {
    if (room.timerInterval) {
      clearInterval(room.timerInterval);
      room.timerInterval = null;
    }
    if (room.preTurnInterval) {
      clearInterval(room.preTurnInterval);
      room.preTurnInterval = null;
    }
    if (room.intermissionTimeout) {
      clearTimeout(room.intermissionTimeout);
      room.intermissionTimeout = null;
    }
  }

  private broadcast(message: PalabraSecretaServerMessage, room: ServerRoom) {
    const payload = JSON.stringify(message);
    for (const [ws, conn] of this.connections.entries()) {
      if (conn.roomId === room.code && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(payload);
        } catch (e) {
          console.error('[PalabraSecretaServer] Error sending broadcast:', e);
        }
      }
    }
  }

  private broadcastRoomState(room: ServerRoom) {
    for (const [ws, conn] of this.connections.entries()) {
      if (conn.roomId === room.code && ws.readyState === WebSocket.OPEN) {
        const clientState = this.buildClientRoomState(room, conn.playerId);
        try {
          ws.send(JSON.stringify({ type: 'ROOM_STATE', state: clientState }));
        } catch (e) {
          console.error('[PalabraSecretaServer] Error sending room state to player:', conn.playerId, e);
        }
      }
    }
  }

  private sendToPlayer(playerId: string, message: PalabraSecretaServerMessage) {
    const payload = JSON.stringify(message);
    for (const [ws, conn] of this.connections.entries()) {
      if (conn.playerId === playerId && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(payload);
        } catch (e) {
          console.error('[PalabraSecretaServer] Error sending to player:', playerId, e);
        }
      }
    }
  }

  /**
   * Builds sanitized room state per player:
   * - Descriptors get the real secret word + forbidden words
   * - Rivals get the real secret word with isRival: true to verify no rules are broken
   * - Teammates (Guessers) receive masked word (category only, no word or forbidden hints)
   */
  private buildClientRoomState(room: ServerRoom, playerId: string): PalabraSecretaRoomState {
    const player = room.players.find((p) => p.id === playerId);
    const isDescriptor = room.activeDescriptorId === playerId;
    const playerTeamId = player?.teamId;
    const isTeammateGuesser = Boolean(
      playerTeamId && playerTeamId === room.activeTeamId && !isDescriptor
    );
    const isRival = Boolean(playerTeamId && playerTeamId !== room.activeTeamId);

    let sanitizedWord: SecretWordItem | null = null;
    if (room.currentWord) {
      if (isDescriptor || isRival) {
        // Descriptors and Rivals see the real word
        sanitizedWord = room.currentWord;
      } else {
        // Guessers receive category only, word masked as ???
        sanitizedWord = {
          id: room.currentWord.id,
          word: '???',
          category: room.currentWord.category,
          forbidden: [],
          hint: '¡Escucha a tu descriptor y adivina en voz alta!',
        };
      }
    }

    return {
      code: room.code,
      gameType: 'palabra-secreta',
      phase: room.phase,
      hostId: room.hostId,
      config: room.config,
      players: room.players,
      teams: room.teams,
      currentRound: room.currentRound,
      totalRounds: room.totalRounds,
      activeTeamId: room.activeTeamId,
      activeDescriptorId: room.activeDescriptorId,
      currentTurnNumber: room.currentTurnNumber,
      totalTurnsInMatch: room.totalTurnsInMatch,
      turnEndsAt: room.turnEndsAt,
      turnRemainingSeconds: room.turnRemainingSeconds,
      preTurnCountdown: room.preTurnCountdown,
      currentWord: sanitizedWord,
      isDescriptor,
      isRival,
      isTeammateGuesser,
      turnWordsHistory: room.turnWordsHistory,
      turnPoints: room.turnPoints,
      turnSkipsUsed: room.turnSkipsUsed,
      winningTeamId: room.winningTeamId,
      lastTurnSummary: room.lastTurnSummary,
      abortReason: room.abortReason,
      endMessage: room.endMessage,
    };
  }
}
