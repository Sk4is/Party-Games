import { WebSocketServer, WebSocket } from 'ws';
import {
  PalabraSecretaRoomState,
  PalabraSecretaPlayer,
  PalabraSecretaTeam,
  PalabraSecretaConfig,
  PalabraSecretaTurnSummary,
  SecretWordItem,
  TurnWordResult,
  PasswordProgressItem,
  EmojiCandidateItem,
  PalabraSecretaClientMessage,
  PalabraSecretaServerMessage,
} from '../src/types/palabraSecreta';
import {
  PALABRA_SECRETA_WORDS,
  getRandomWord,
  getEmojiCandidateOptions,
  getPasswordTargets,
} from '../src/data/palabraSecreta';
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

  // Mode 2: Password
  passwordTargets: { id: string; word: string; status: 'PENDING' | 'CURRENT' | 'CORRECT' | 'SKIPPED'; isGuessed: boolean }[];
  passwordCurrentIndex: number;
  passwordClueWordCount: number;
  passwordCorrectCount: number;
  processedActionIds: Set<string>;

  // Mode 3: Emoji
  emojiCandidateOptions: EmojiCandidateItem[];
  emojiSelectedTarget: EmojiCandidateItem | null;
  emojiClue: string;
  emojiCount: number;
  emojiCorrectCount: number;
  emojiSkipCount: number;
  emojiPhase: 'CHOOSE_OPTION' | 'COMPOSE_CLUE' | 'GUESSING';
  resolvedEmojiChallengeIds: Set<string>;
}

const DEFAULT_CONFIG: PalabraSecretaConfig = {
  gameMode: 'CLASSIC',
  timePerTurn: 60,
  totalRounds: 3,
  maxSkipsPerTurn: -1,
  penaltyOnSkip: true,
  penaltyOnTaboo: true,
  showForbiddenWords: true,
  passwordTargetCount: 10,
  passwordClueBudget: 15,
  emojiCategory: 'BOTH',
};

function countEmojis(text: string): number {
  if (!text) return 0;
  if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
    const segmenter = new (Intl as any).Segmenter('es', { granularity: 'grapheme' });
    return Array.from(segmenter.segment(text.trim())).length;
  }
  return Array.from(text.trim()).length;
}

function truncateEmojis(text: string, max: number = 5): string {
  if (!text) return '';
  if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
    const segmenter = new (Intl as any).Segmenter('es', { granularity: 'grapheme' });
    const segments = Array.from(segmenter.segment(text.trim()));
    return segments.slice(0, max).map((s: any) => s.segment).join('');
  }
  return Array.from(text.trim()).slice(0, max).join('');
}

function calculatePasswordScore(correctCount: number, clueWordCount: number, budget: number = 15): {
  basePoints: number;
  multiplier?: number;
  overBudgetWords?: number;
  penalty?: number;
  finalPoints: number;
} {
  const basePoints = correctCount;
  if (clueWordCount <= budget) {
    let multiplier = 1.0;
    if (clueWordCount <= 10) multiplier = 1.5;
    else if (clueWordCount === 11) multiplier = 1.4;
    else if (clueWordCount === 12) multiplier = 1.3;
    else if (clueWordCount === 13) multiplier = 1.2;
    else if (clueWordCount === 14) multiplier = 1.1;
    else multiplier = 1.0;

    const finalPoints = Math.round(basePoints * multiplier);
    return {
      basePoints,
      multiplier,
      finalPoints,
    };
  } else {
    const overBudgetWords = clueWordCount - budget;
    const penalty = overBudgetWords;
    const finalPoints = basePoints - penalty;
    return {
      basePoints,
      overBudgetWords,
      penalty,
      finalPoints,
    };
  }
}

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

      // Password
      passwordTargets: [],
      passwordCurrentIndex: 0,
      passwordClueWordCount: 0,
      passwordCorrectCount: 0,
      processedActionIds: new Set<string>(),

      // Emoji
      emojiCandidateOptions: [],
      emojiSelectedTarget: null,
      emojiClue: '',
      emojiCount: 0,
      emojiCorrectCount: 0,
      emojiSkipCount: 0,
      emojiPhase: 'CHOOSE_OPTION',
      resolvedEmojiChallengeIds: new Set<string>(),
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

      // Classic actions
      case 'MARK_GUESSED':
        this.handleClassicMarkGuessed(room, conn.playerId);
        break;
      case 'SKIP_WORD':
        this.handleClassicSkipWord(room, conn.playerId);
        break;
      case 'MARK_TABOO':
        this.handleClassicMarkTaboo(room, conn.playerId);
        break;

      // Password actions
      case 'INCREMENT_CLUE_COUNT':
        this.handlePasswordIncrementClue(room, conn.playerId);
        break;
      case 'DECREMENT_CLUE_COUNT':
        this.handlePasswordDecrementClue(room, conn.playerId);
        break;
      case 'PASSWORD_MARK_GUESSED':
        this.handlePasswordMarkGuessed(room, conn.playerId, message.targetId, message.actionId);
        break;
      case 'PASSWORD_SKIP_WORD':
        this.handlePasswordSkipWord(room, conn.playerId, message.targetId, message.actionId);
        break;
      case 'PASSWORD_FINISH_TURN':
        this.handlePasswordFinishTurn(room, conn.playerId, message.actionId);
        break;

      // Emoji actions
      case 'EMOJI_CHOOSE_OPTION':
        this.handleEmojiChooseOption(room, conn.playerId, message.optionId);
        break;
      case 'EMOJI_UPDATE_CLUE':
        this.handleEmojiUpdateClue(room, conn.playerId, message.clue);
        break;
      case 'EMOJI_MARK_GUESSED':
        this.handleEmojiMarkGuessed(room, conn.playerId, message.actionId);
        break;
      case 'EMOJI_SKIP':
        this.handleEmojiSkip(room, conn.playerId, message.actionId);
        break;

      // General
      case 'NEXT_TURN':
        this.handleNextTurn(room, conn.playerId);
        break;
      case 'PLAY_AGAIN':
        this.handlePlayAgain(room, conn.playerId);
        break;
      case 'KICK_PLAYER':
        this.handleKickPlayer(room, conn.playerId, message.targetPlayerId);
        break;
      case 'LEAVE_ROOM':
        this.handleExplicitLeave(ws);
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
      player.isConnected = true;
      player.name = playerData.name.trim() || player.name;
      player.avatar = playerData.avatar || player.avatar;
      player.color = playerData.color || player.color;
    } else {
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

    matchDepartureHandler.cancelGracePeriod(room.code, player.id);
    console.log(`[PalabraSecretaServer] Player ${player.name} joined room ${room.code} on ${player.teamId}`);
    this.broadcastRoomState(room);
  }

  private handleExplicitLeave(ws: WebSocket) {
    const conn = this.connections.get(ws);
    if (!conn) return;

    this.connections.delete(ws);
    const { roomId, playerId } = conn;
    matchDepartureHandler.cancelGracePeriod(roomId, playerId);
    this.processPermanentDeparture(roomId, playerId);
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

    const isMatchFinished = room.phase === 'PODIUM' || room.phase === 'MATCH_ABORTED';
    if (isMatchFinished) {
      this.processPermanentDeparture(conn.roomId, conn.playerId);
      return;
    }

    this.broadcastRoomState(room);

    matchDepartureHandler.registerDisconnection(conn.roomId, conn.playerId, 'palabra-secreta', () => {
      this.processPermanentDeparture(conn.roomId, conn.playerId);
    });
  }

  private processPermanentDeparture(roomId: string, playerId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const departingPlayer = room.players.find((p) => p.id === playerId);
    const wasHost = room.hostId === playerId;
    const isGameActive = room.phase !== 'LOBBY' && room.phase !== 'PODIUM' && room.phase !== 'MATCH_ABORTED';

    // 1. In LOBBY phase
    if (room.phase === 'LOBBY') {
      room.players = room.players.filter((p) => p.id !== playerId);
      room.teams['team-1'].playerIds = room.teams['team-1'].playerIds.filter((id) => id !== playerId);
      room.teams['team-2'].playerIds = room.teams['team-2'].playerIds.filter((id) => id !== playerId);

      if (room.players.length === 0) {
        this.clearAllTimers(room);
        this.rooms.delete(roomId);
        roomRegistry.unregister(roomId);
        matchDepartureHandler.clearRoomGracePeriods(roomId);
        return;
      }

      if (wasHost) {
        const next = matchDepartureHandler.findEarliestConnectedPlayer(room.players);
        if (next) {
          room.players.forEach((p) => (p.isHost = false));
          next.isHost = true;
          room.hostId = next.id;
        }
      }
      this.broadcastRoomState(room);
      return;
    }

    // 2. In active game
    room.players = room.players.filter((p) => p.id !== playerId);
    room.teams['team-1'].playerIds = room.teams['team-1'].playerIds.filter((id) => id !== playerId);
    room.teams['team-2'].playerIds = room.teams['team-2'].playerIds.filter((id) => id !== playerId);

    const evaluation = matchDepartureHandler.evaluatePermanentDeparture({
      gameType: 'palabra-secreta',
      isGameActive,
      departingPlayerId: playerId,
      wasHost,
      players: room.players,
    });

    if (evaluation.shouldAbort) {
      this.clearAllTimers(room);
      room.phase = 'MATCH_ABORTED';
      room.abortReason = evaluation.abortReason;
      room.endMessage = evaluation.endMessage;
      matchDepartureHandler.clearRoomGracePeriods(roomId);
      this.broadcastRoomState(room);
      return;
    }

    if (evaluation.migratedHost) {
      const newHost = room.players.find((p) => p.id === evaluation.migratedHost!.id);
      if (newHost) {
        room.players.forEach((p) => (p.isHost = false));
        newHost.isHost = true;
        room.hostId = newHost.id;
      }
    }

    // Critical fix: If the departing player was the active descriptor in an active match,
    // advance or end turn immediately so the game does not freeze.
    if (room.activeDescriptorId === playerId && isGameActive) {
      console.log(`[PalabraSecretaServer] Active descriptor ${playerId} left match. Ending active turn.`);
      this.endActiveTurn(room);
      return;
    }

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
    if (senderId !== targetPlayerId && room.hostId !== senderId) return;

    const player = room.players.find((p) => p.id === targetPlayerId);
    if (!player) return;

    const oldTeamId = player.teamId;
    if (oldTeamId === targetTeamId) return;

    room.teams[oldTeamId].playerIds = room.teams[oldTeamId].playerIds.filter((id) => id !== targetPlayerId);
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

    const team1Count = room.teams['team-1'].playerIds.length;
    const team2Count = room.teams['team-2'].playerIds.length;

    if (team1Count < 2 || team2Count < 2) {
      this.sendToPlayer(playerId, {
        type: 'ERROR',
        message: 'Se necesitan al menos 2 jugadores por equipo (mínimo 4 jugadores en total) para comenzar.',
      });
      return;
    }

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

    const maxPlayersPerTeam = Math.max(team1Count, team2Count);
    room.totalTurnsInMatch = room.config.totalRounds * 2 * maxPlayersPerTeam;

    this.preparePreTurn(room);
  }

  private preparePreTurn(room: ServerRoom) {
    this.clearAllTimers(room);

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

    // Reset mode state
    room.passwordTargets = [];
    room.passwordCurrentIndex = 0;
    room.passwordClueWordCount = 0;
    room.passwordCorrectCount = 0;

    room.emojiCandidateOptions = [];
    room.emojiSelectedTarget = null;
    room.emojiClue = '';
    room.emojiCount = 0;
    room.emojiCorrectCount = 0;
    room.emojiSkipCount = 0;
    room.emojiPhase = 'CHOOSE_OPTION';
    room.resolvedEmojiChallengeIds.clear();

    this.broadcastRoomState(room);

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

    const mode = room.config.gameMode || 'CLASSIC';

    if (mode === 'CLASSIC') {
      room.turnRemainingSeconds = room.config.timePerTurn;
      room.turnEndsAt = Date.now() + room.config.timePerTurn * 1000;
      room.turnPoints = 0;
      room.turnSkipsUsed = 0;
      room.turnWordsHistory = [];
      this.nextSecretWord(room);

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
    } else if (mode === 'PASSWORD') {
      // 10 targets generated for descriptor with stable IDs and status
      const rawTargets = getPasswordTargets(room.config.passwordTargetCount || 10, room.usedWordIds);
      rawTargets.forEach((t) => room.usedWordIds.add(t.id));
      room.passwordTargets = rawTargets.map((t, idx) => ({
        id: t.id || `target_${idx}_${Date.now()}`,
        word: t.word,
        status: idx === 0 ? 'CURRENT' : 'PENDING',
        isGuessed: false,
      }));
      room.passwordCurrentIndex = 0;
      room.passwordClueWordCount = 0;
      room.passwordCorrectCount = 0;

      // In Contraseña, turn duration is generous/safety timer (e.g. 180s) so room never stalls
      const duration = 180;
      room.turnRemainingSeconds = duration;
      room.turnEndsAt = Date.now() + duration * 1000;

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
    } else if (mode === 'EMOJI') {
      room.turnRemainingSeconds = room.config.timePerTurn;
      room.turnEndsAt = Date.now() + room.config.timePerTurn * 1000;
      room.emojiCorrectCount = 0;
      room.emojiSkipCount = 0;
      this.prepareNextEmojiOptions(room);

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

    this.broadcastRoomState(room);
  }

  // ==========================================
  // CLASSIC MODE HANDLERS
  // ==========================================
  private nextSecretWord(room: ServerRoom) {
    const nextWord = getRandomWord(room.usedWordIds);
    room.usedWordIds.add(nextWord.id);
    room.currentWord = nextWord;
  }

  private handleClassicMarkGuessed(room: ServerRoom, playerId: string) {
    if (room.phase !== 'ACTIVE_TURN' || room.config.gameMode !== 'CLASSIC') return;
    if (playerId !== room.activeDescriptorId) return;
    if (!room.currentWord) return;

    const points = 1;
    room.turnPoints += points;
    room.teams[room.activeTeamId].score += points;

    const descriptor = room.players.find((p) => p.id === playerId);
    if (descriptor) descriptor.wordsDescribedCount += 1;

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

  private handleClassicSkipWord(room: ServerRoom, playerId: string) {
    if (room.phase !== 'ACTIVE_TURN' || room.config.gameMode !== 'CLASSIC') return;
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
    const points = -1;
    room.turnPoints += points;
    room.teams[room.activeTeamId].score += points;

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

  private handleClassicMarkTaboo(room: ServerRoom, playerId: string) {
    if (room.phase !== 'ACTIVE_TURN' || room.config.gameMode !== 'CLASSIC') return;
    if (playerId !== room.activeDescriptorId) return;
    if (!room.currentWord) return;

    const points = room.config.penaltyOnTaboo ? -1 : 0;
    if (points !== 0) {
      room.turnPoints += points;
      room.teams[room.activeTeamId].score += points;
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

  // ==========================================
  // PASSWORD MODE HANDLERS
  // ==========================================
  private handlePasswordIncrementClue(room: ServerRoom, playerId: string) {
    if (room.phase !== 'ACTIVE_TURN' || room.config.gameMode !== 'PASSWORD') return;
    // Only active descriptor can alter clue count
    if (playerId !== room.activeDescriptorId) return;

    room.passwordClueWordCount += 1;
    this.broadcastRoomState(room);
  }

  private handlePasswordDecrementClue(room: ServerRoom, playerId: string) {
    if (room.phase !== 'ACTIVE_TURN' || room.config.gameMode !== 'PASSWORD') return;
    if (playerId !== room.activeDescriptorId) return;

    if (room.passwordClueWordCount > 0) {
      room.passwordClueWordCount -= 1;
      this.broadcastRoomState(room);
    }
  }

  private handlePasswordMarkGuessed(
    room: ServerRoom,
    playerId: string,
    targetId?: string,
    actionId?: string
  ) {
    if (room.phase !== 'ACTIVE_TURN' || room.config.gameMode !== 'PASSWORD') return;
    if (playerId !== room.activeDescriptorId) return;

    if (actionId) {
      if (room.processedActionIds.has(actionId)) return;
      room.processedActionIds.add(actionId);
    }

    let target = room.passwordTargets[room.passwordCurrentIndex];
    if (targetId) {
      const found = room.passwordTargets.find((t) => t.id === targetId);
      if (found && found.status === 'CURRENT') {
        target = found;
      }
    }

    if (!target || target.status !== 'CURRENT') return;

    target.status = 'CORRECT';
    target.isGuessed = true;
    room.passwordCorrectCount += 1;

    // Advance to next pending target
    const nextPendingIdx = room.passwordTargets.findIndex((t) => t.status === 'PENDING');
    if (nextPendingIdx !== -1) {
      room.passwordCurrentIndex = nextPendingIdx;
      room.passwordTargets[nextPendingIdx].status = 'CURRENT';
      this.broadcast({
        type: 'ACTION_FEEDBACK',
        action: 'GUESSED',
        word: target.word,
        points: 1,
      }, room);
      this.broadcastRoomState(room);
    } else {
      // All targets resolved! End turn
      this.broadcast({
        type: 'ACTION_FEEDBACK',
        action: 'GUESSED',
        word: target.word,
        points: 1,
      }, room);
      this.endActiveTurn(room);
    }
  }

  private handlePasswordSkipWord(
    room: ServerRoom,
    playerId: string,
    targetId?: string,
    actionId?: string
  ) {
    if (room.phase !== 'ACTIVE_TURN' || room.config.gameMode !== 'PASSWORD') return;
    if (playerId !== room.activeDescriptorId) return;

    if (actionId) {
      if (room.processedActionIds.has(actionId)) return;
      room.processedActionIds.add(actionId);
    }

    let target = room.passwordTargets[room.passwordCurrentIndex];
    if (targetId) {
      const found = room.passwordTargets.find((t) => t.id === targetId);
      if (found && found.status === 'CURRENT') {
        target = found;
      }
    }

    if (!target || target.status !== 'CURRENT') return;

    target.status = 'SKIPPED';
    target.isGuessed = false;

    // Advance to next pending target
    const nextPendingIdx = room.passwordTargets.findIndex((t) => t.status === 'PENDING');
    if (nextPendingIdx !== -1) {
      room.passwordCurrentIndex = nextPendingIdx;
      room.passwordTargets[nextPendingIdx].status = 'CURRENT';
      this.broadcast({
        type: 'ACTION_FEEDBACK',
        action: 'SKIPPED',
        word: target.word,
        points: 0,
      }, room);
      this.broadcastRoomState(room);
    } else {
      // All targets resolved! End turn
      this.broadcast({
        type: 'ACTION_FEEDBACK',
        action: 'SKIPPED',
        word: target.word,
        points: 0,
      }, room);
      this.endActiveTurn(room);
    }
  }

  private handlePasswordFinishTurn(room: ServerRoom, playerId: string, actionId?: string) {
    if (room.phase !== 'ACTIVE_TURN' || room.config.gameMode !== 'PASSWORD') return;
    if (playerId !== room.activeDescriptorId && playerId !== room.hostId) return;

    if (actionId) {
      if (room.processedActionIds.has(actionId)) return;
      room.processedActionIds.add(actionId);
    }

    this.endActiveTurn(room);
  }

  // ==========================================
  // EMOJI MISTERIOSO HANDLERS
  // ==========================================
  private prepareNextEmojiOptions(room: ServerRoom) {
    const category = room.config.emojiCategory || 'BOTH';
    const options = getEmojiCandidateOptions(category, room.usedWordIds);
    options.forEach((opt) => room.usedWordIds.add(opt.id));

    room.emojiCandidateOptions = options.map((opt) => ({
      id: opt.id,
      title: opt.title,
      category: opt.category,
    }));
    room.emojiSelectedTarget = null;
    room.emojiClue = '';
    room.emojiCount = 0;
    room.emojiPhase = 'CHOOSE_OPTION';
  }

  private handleEmojiChooseOption(room: ServerRoom, playerId: string, optionId: string) {
    if (room.phase !== 'ACTIVE_TURN' || room.config.gameMode !== 'EMOJI') return;
    if (playerId !== room.activeDescriptorId) return;

    const chosen = room.emojiCandidateOptions.find((opt) => opt.id === optionId);
    if (!chosen) return;

    room.emojiSelectedTarget = chosen;
    room.emojiClue = '';
    room.emojiCount = 0;
    room.emojiPhase = 'COMPOSE_CLUE';

    this.broadcastRoomState(room);
  }

  private handleEmojiUpdateClue(room: ServerRoom, playerId: string, rawClue: string) {
    if (room.phase !== 'ACTIVE_TURN' || room.config.gameMode !== 'EMOJI') return;
    if (playerId !== room.activeDescriptorId) return;
    if (!room.emojiSelectedTarget) return;

    const clean = truncateEmojis(rawClue, 5);
    room.emojiClue = clean;
    room.emojiCount = countEmojis(clean);
    if (room.emojiCount > 0) {
      room.emojiPhase = 'GUESSING';
    }

    this.broadcastRoomState(room);
  }

  private handleEmojiMarkGuessed(room: ServerRoom, playerId: string, actionId?: string) {
    if (room.phase !== 'ACTIVE_TURN' || room.config.gameMode !== 'EMOJI') return;
    if (playerId !== room.activeDescriptorId) return;
    if (!room.emojiSelectedTarget) return;

    const challengeKey = `${room.currentTurnNumber}_${room.emojiSelectedTarget.id}`;
    if (room.resolvedEmojiChallengeIds.has(challengeKey)) return;
    room.resolvedEmojiChallengeIds.add(challengeKey);

    room.emojiCorrectCount += 1;

    this.broadcast({
      type: 'ACTION_FEEDBACK',
      action: 'GUESSED',
      word: room.emojiSelectedTarget.title,
      points: 1,
    }, room);

    this.prepareNextEmojiOptions(room);
    this.broadcastRoomState(room);
  }

  private handleEmojiSkip(room: ServerRoom, playerId: string, actionId?: string) {
    if (room.phase !== 'ACTIVE_TURN' || room.config.gameMode !== 'EMOJI') return;
    if (playerId !== room.activeDescriptorId) return;
    if (!room.emojiSelectedTarget) return;

    const challengeKey = `${room.currentTurnNumber}_${room.emojiSelectedTarget.id}`;
    if (room.resolvedEmojiChallengeIds.has(challengeKey)) return;
    room.resolvedEmojiChallengeIds.add(challengeKey);

    room.emojiSkipCount += 1;

    this.broadcast({
      type: 'ACTION_FEEDBACK',
      action: 'SKIPPED',
      word: room.emojiSelectedTarget.title,
      points: -1,
    }, room);

    this.prepareNextEmojiOptions(room);
    this.broadcastRoomState(room);
  }

  // ==========================================
  // TURN COMPLETION & SCORING
  // ==========================================
  private endActiveTurn(room: ServerRoom) {
    this.clearAllTimers(room);
    room.phase = 'TURN_RESULTS';
    room.turnRemainingSeconds = 0;

    const mode = room.config.gameMode || 'CLASSIC';
    const descriptor = room.players.find((p) => p.id === room.activeDescriptorId);
    const activeTeam = room.teams[room.activeTeamId];
    const nextTeamId: 'team-1' | 'team-2' = room.activeTeamId === 'team-1' ? 'team-2' : 'team-1';
    const nextTeam = room.teams[nextTeamId];

    const nextPointer = room.teamDescriptorPointers[nextTeamId];
    const nextDescriptorId = nextTeam.playerIds[nextPointer % nextTeam.playerIds.length];
    const nextDescriptor = room.players.find((p) => p.id === nextDescriptorId);

    let summary: PalabraSecretaTurnSummary;

    if (mode === 'CLASSIC') {
      summary = {
        teamId: room.activeTeamId,
        teamName: activeTeam.name,
        descriptorName: descriptor?.name || 'Descriptor',
        descriptorAvatar: descriptor?.avatar || '🦊',
        pointsGained: room.turnPoints,
        gameMode: 'CLASSIC',
        words: [...room.turnWordsHistory],
        nextTeamId,
        nextDescriptorName: nextDescriptor?.name || 'Compañero',
      };
    } else if (mode === 'PASSWORD') {
      const scoring = calculatePasswordScore(
        room.passwordCorrectCount,
        room.passwordClueWordCount,
        room.config.passwordClueBudget || 15
      );
      // Add score to team (can be negative)
      activeTeam.score += scoring.finalPoints;

      summary = {
        teamId: room.activeTeamId,
        teamName: activeTeam.name,
        descriptorName: descriptor?.name || 'Descriptor',
        descriptorAvatar: descriptor?.avatar || '🦊',
        pointsGained: scoring.finalPoints,
        gameMode: 'PASSWORD',
        passwordSummary: {
          correctCount: scoring.basePoints,
          totalTargets: room.passwordTargets.length || 10,
          clueWordCount: room.passwordClueWordCount,
          budget: room.config.passwordClueBudget || 15,
          multiplier: scoring.multiplier,
          overBudgetWords: scoring.overBudgetWords,
          penalty: scoring.penalty,
          basePoints: scoring.basePoints,
          finalPoints: scoring.finalPoints,
        },
        nextTeamId,
        nextDescriptorName: nextDescriptor?.name || 'Compañero',
      };
    } else {
      // EMOJI
      const finalPoints = room.emojiCorrectCount - room.emojiSkipCount;
      activeTeam.score += finalPoints;

      summary = {
        teamId: room.activeTeamId,
        teamName: activeTeam.name,
        descriptorName: descriptor?.name || 'Descriptor',
        descriptorAvatar: descriptor?.avatar || '🦊',
        pointsGained: finalPoints,
        gameMode: 'EMOJI',
        emojiSummary: {
          correctCount: room.emojiCorrectCount,
          skipCount: room.emojiSkipCount,
          penalty: room.emojiSkipCount,
          finalPoints,
        },
        nextTeamId,
        nextDescriptorName: nextDescriptor?.name || 'Compañero',
      };
    }

    room.lastTurnSummary = summary;

    room.currentTurnNumber += 1;
    if (room.currentTurnNumber > room.totalTurnsInMatch) {
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
      const turnsPerRound = room.teams['team-1'].playerIds.length + room.teams['team-2'].playerIds.length;
      room.currentRound = Math.min(
        room.config.totalRounds,
        Math.floor((room.currentTurnNumber - 1) / Math.max(1, turnsPerRound)) + 1
      );
      room.activeTeamId = nextTeamId;
    }

    this.broadcastRoomState(room);
  }

  private handleNextTurn(room: ServerRoom, playerId: string) {
    if (room.phase !== 'TURN_RESULTS') return;
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

    room.teams['team-1'].playerIds = room.teams['team-1'].playerIds.filter((id) => id !== targetPlayerId);
    room.teams['team-2'].playerIds = room.teams['team-2'].playerIds.filter((id) => id !== targetPlayerId);
    room.players = room.players.filter((p) => p.id !== targetPlayerId);

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
   * Builds sanitized room state per player according to authoritative privacy rules:
   * - CLASSIC: descriptor & rival see word, guesser teammates see '???'
   * - PASSWORD: ONLY descriptor receives secret word and word labels in progress list. Guesser teammates and rivals receive null and masked progress.
   * - EMOJI: ONLY descriptor receives candidate options (3 choices) and selected title. Emojis and subtle category are public.
   */
  private buildClientRoomState(room: ServerRoom, playerId: string): PalabraSecretaRoomState {
    const player = room.players.find((p) => p.id === playerId);
    const isDescriptor = room.activeDescriptorId === playerId;
    const playerTeamId = player?.teamId;
    const isTeammateGuesser = Boolean(
      playerTeamId && playerTeamId === room.activeTeamId && !isDescriptor
    );
    const isRival = Boolean(playerTeamId && playerTeamId !== room.activeTeamId);
    const mode = room.config.gameMode || 'CLASSIC';

    // Classic sanitized word
    let sanitizedWord: SecretWordItem | null = null;
    if (mode === 'CLASSIC' && room.currentWord) {
      if (isDescriptor || isRival) {
        sanitizedWord = room.currentWord;
      } else {
        sanitizedWord = {
          id: room.currentWord.id,
          word: '???',
          category: room.currentWord.category,
          forbidden: [],
          hint: '¡Escucha a tu descriptor y adivina en voz alta!',
        };
      }
    }

    // Password sanitized state
    let passwordCurrentWord: string | null = null;
    let passwordTargetsProgress: PasswordProgressItem[] = [];
    if (mode === 'PASSWORD') {
      const currentTarget = room.passwordTargets[room.passwordCurrentIndex];
      if (isDescriptor && currentTarget) {
        passwordCurrentWord = currentTarget.word;
      }
      passwordTargetsProgress = room.passwordTargets.map((t, idx) => ({
        id: t.id,
        index: idx,
        status: t.status,
        isGuessed: t.isGuessed,
        word: isDescriptor ? t.word : undefined, // Only descriptor sees target words!
      }));
    }

    // Emoji sanitized state
    let emojiCandidateOptions: EmojiCandidateItem[] = [];
    let emojiSelectedTitle: string | null = null;
    if (mode === 'EMOJI') {
      if (isDescriptor) {
        emojiCandidateOptions = room.emojiCandidateOptions;
        emojiSelectedTitle = room.emojiSelectedTarget?.title || null;
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

      // Password mode
      passwordTargetCount: room.config.passwordTargetCount || 10,
      passwordClueBudget: room.config.passwordClueBudget || 15,
      passwordClueWordCount: room.passwordClueWordCount,
      passwordCorrectCount: room.passwordCorrectCount,
      passwordCurrentIndex: room.passwordCurrentIndex,
      passwordCurrentWord,
      passwordTargetsProgress,

      // Emoji mode
      emojiCandidateOptions,
      emojiSelectedTargetId: room.emojiSelectedTarget?.id || null,
      emojiSelectedTitle,
      emojiSelectedCategory: room.emojiSelectedTarget?.category || null,
      emojiClue: room.emojiClue,
      emojiCount: room.emojiCount,
      emojiCorrectCount: room.emojiCorrectCount,
      emojiSkipCount: room.emojiSkipCount,
      emojiPhase: room.emojiPhase,
    };
  }
}
