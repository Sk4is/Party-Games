import { WebSocketServer, WebSocket } from 'ws';
import type { Server as HttpServer } from 'http';
import {
  BombaRoomState,
  BombaPlayerState,
  BombaPhase,
  LPRRoomState,
  LPRPlayerState,
  LPRPhase,
  LPRShuffledCard,
  BoardCursor,
  PartyClientMessage,
  PartyServerMessage,
  SupportedGame,
} from '../src/types/multiplayer';
import { LetterSequence, GameConfig, UsedWord, BlackCard, LaPeorRespuestaConfig } from '../src/types';
import { roomRegistry } from './roomRegistry';
import { validateSpanishWordServer } from './wordValidator';
import { getNextSequence, getRandomSequence } from '../src/data/sequences';
import { getNextBlackCard } from '../src/data/blackCards';
import { extractSpanishLetters, calculateAlphabetProgress } from '../src/utils/alphabet';
import { matchDepartureHandler } from './matchDepartureHandler';

interface ClientConnection {
  ws: WebSocket;
  playerId: string;
  roomId: string;
  gameType: 'la-bomba' | 'la-peor-respuesta';
}

interface BombaServerRoom {
  code: string;
  gameType: 'la-bomba';
  hostId: string;
  phase: BombaPhase;
  config: GameConfig;
  players: BombaPlayerState[];
  currentSequence: LetterSequence;
  usedSequences: Set<string>;
  playerRecentSequences: Record<string, string[]>;
  activePlayerIndex: number;
  activePlayerId: string | null;
  currentTurnId: string;
  challengeId: string;
  processedSubmissionIds: Set<string>;
  pendingSubmissions: Set<string>;
  currentExplosionId: string | null;
  processedLifeEventIds: Set<string>;
  roundNumber: number;
  bombDurationMs: number;
  bombRemainingMs: number;
  speedMultiplier: number;
  roundMistakes: number;
  turnStartedAt: number;
  lastUpdateTimestamp: number;
  timerInterval: NodeJS.Timeout | null;
  disconnectGraceTimeout: NodeJS.Timeout | null;
  explosionTimeout: NodeJS.Timeout | null;
  usedWords: UsedWord[];
  acceptedWordBanner: {
    word: string;
    player: string;
    bonusLetters?: number;
  } | null;
  acceptedWordBannerTimeout: NodeJS.Timeout | null;
  affectedPlayer: BombaPlayerState | null;
  winner: BombaPlayerState | null;
  totalValidWords: number;
  totalMistakes: number;
  totalExplosions: number;
  fastestAnswer: {
    playerName: string;
    playerColor: string;
    timeSeconds: number;
    word: string;
  } | null;
  abortReason?: string;
  endMessage?: string;
}

interface LPRRawCard {
  id: string;
  authorId: string;
  text: string;
  revealed: boolean;
  votes: string[];
}

interface LPRServerRoom {
  code: string;
  gameType: 'la-peor-respuesta';
  hostId: string;
  phase: LPRPhase;
  config: LaPeorRespuestaConfig;
  players: LPRPlayerState[];
  round: number;
  usedBlackCardIds: Set<string>;
  currentBlackCard: BlackCard;
  privateSubmissions: Map<string, string>; // playerId -> answer text (private!)
  shuffledCards: LPRRawCard[];
  votes: Map<string, string>; // voterPlayerId -> cardId (secret!)
  winningAuthorIds: string[];
  abortReason?: string;
  endMessage?: string;
}

const getRandomBombDurationMs = () => (60 + Math.random() * 120) * 1000;

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export class PartyGameServer {
  public wss: WebSocketServer;
  private bombaRooms = new Map<string, BombaServerRoom>();
  private lprRooms = new Map<string, LPRServerRoom>();
  private clients = new Map<WebSocket, ClientConnection>();

  constructor(server?: HttpServer) {
    if (server) {
      this.wss = new WebSocketServer({ server, path: '/ws/party' });
    } else {
      this.wss = new WebSocketServer({ noServer: true });
    }
    this.init();
    console.log('[PartyGameServer] WebSocket server initialized');
  }

  public getRoomInfo(code: string) {
    const clean = code.toUpperCase().trim();
    const bomba = this.bombaRooms.get(clean);
    if (bomba) {
      return {
        roomId: bomba.code,
        roomCode: bomba.code,
        code: bomba.code,
        gameType: 'la-bomba' as const,
        hostId: bomba.hostId,
        phase: bomba.phase,
        playersCount: bomba.players.filter((p) => p.isConnected).length,
        totalPlayers: bomba.players.length,
        maxPlayers: 10,
        isFull: bomba.players.length >= 10,
        players: bomba.players,
        createdAt: bomba.turnStartedAt || Date.now(),
      };
    }
    const lpr = this.lprRooms.get(clean);
    if (lpr) {
      return {
        roomId: lpr.code,
        roomCode: lpr.code,
        code: lpr.code,
        gameType: 'la-peor-respuesta' as const,
        hostId: lpr.hostId,
        phase: lpr.phase,
        playersCount: lpr.players.filter((p) => p.isConnected).length,
        totalPlayers: lpr.players.length,
        maxPlayers: 10,
        isFull: lpr.players.length >= 10,
        players: lpr.players,
        createdAt: Date.now(),
      };
    }
    return null;
  }

  public createRoomDirect(
    gameType: 'la-bomba' | 'la-peor-respuesta',
    player: { id: string; name: string; avatar: string; color: string },
    config?: any
  ) {
    const code = roomRegistry.generateCode();

    if (gameType === 'la-bomba') {
      const initialSeq = getRandomSequence();
      const initialDuration = getRandomBombDurationMs();
      const bombaConfig: GameConfig = {
        startingLives: (config as any)?.startingLives || 3,
        allowedMistakesPerRound: (config as any)?.allowedMistakesPerRound || 3,
      };

      const hostPlayer: BombaPlayerState = {
        id: player.id,
        name: player.name || 'Jugador',
        avatar: player.avatar || '🦊',
        color: player.color || '#f59e0b',
        isHost: true,
        isConnected: true,
        lives: bombaConfig.startingLives,
        mistakes: 0,
        roundMistakes: 0,
        multiplier: 1.0,
        isEliminated: false,
        bombsReceived: 0,
        validWordsCount: 0,
        fastestAnswerTimeMs: null,
        lastValidWord: null,
        currentTypingWord: '',
        alphabetProgress: [],
      };

      const room: BombaServerRoom = {
        code,
        gameType: 'la-bomba',
        hostId: player.id,
        phase: 'LOBBY',
        config: bombaConfig,
        players: [hostPlayer],
        currentSequence: initialSeq,
        usedSequences: new Set([initialSeq.sequence]),
        playerRecentSequences: { [player.id]: [initialSeq.sequence] },
        activePlayerIndex: 0,
        activePlayerId: player.id,
        currentTurnId: `turn-1-0-${Date.now()}`,
        challengeId: `chal-1-0-${Date.now()}`,
        processedSubmissionIds: new Set(),
        pendingSubmissions: new Set(),
        currentExplosionId: null,
        processedLifeEventIds: new Set(),
        roundNumber: 1,
        bombDurationMs: initialDuration,
        bombRemainingMs: initialDuration,
        speedMultiplier: 1.0,
        roundMistakes: 0,
        turnStartedAt: Date.now(),
        lastUpdateTimestamp: Date.now(),
        timerInterval: null,
        disconnectGraceTimeout: null,
        explosionTimeout: null,
        usedWords: [],
        acceptedWordBanner: null,
        acceptedWordBannerTimeout: null,
        affectedPlayer: null,
        winner: null,
        totalValidWords: 0,
        totalMistakes: 0,
        totalExplosions: 0,
        fastestAnswer: null,
      };

      this.bombaRooms.set(code, room);
      roomRegistry.register(code, 'la-bomba', 'party');
      return {
        roomId: code,
        roomCode: code,
        code,
        gameType: 'la-bomba' as const,
        hostId: player.id,
        phase: 'LOBBY' as const,
        createdAt: Date.now(),
        settings: bombaConfig,
        players: [hostPlayer],
        playersCount: 1,
        maxPlayers: 10,
        isFull: false,
      };
    } else {
      const lprConfig: LaPeorRespuestaConfig = {
        totalRounds: (config as any)?.totalRounds ?? 10,
      };
      const firstCard = getNextBlackCard(new Set());

      const hostPlayer: LPRPlayerState = {
        id: player.id,
        name: player.name || 'Jugador',
        avatar: player.avatar || '🦊',
        color: player.color || '#f59e0b',
        isHost: true,
        isConnected: true,
        score: 0,
        hasSubmittedAnswer: false,
        hasVoted: false,
      };

      const room: LPRServerRoom = {
        code,
        gameType: 'la-peor-respuesta',
        hostId: player.id,
        phase: 'LOBBY',
        config: lprConfig,
        players: [hostPlayer],
        round: 1,
        usedBlackCardIds: new Set([firstCard.id]),
        currentBlackCard: firstCard,
        privateSubmissions: new Map(),
        shuffledCards: [],
        votes: new Map(),
        winningAuthorIds: [],
      };

      this.lprRooms.set(code, room);
      roomRegistry.register(code, 'la-peor-respuesta', 'party');
      return {
        roomId: code,
        roomCode: code,
        code,
        gameType: 'la-peor-respuesta' as const,
        hostId: player.id,
        phase: 'LOBBY' as const,
        createdAt: Date.now(),
        settings: lprConfig,
        players: [hostPlayer],
        playersCount: 1,
        maxPlayers: 10,
        isFull: false,
      };
    }
  }

  private init() {
    this.wss.on('connection', (ws: WebSocket) => {
      ws.on('message', async (data: string) => {
        try {
          const message: PartyClientMessage = JSON.parse(data.toString());
          await this.handleClientMessage(ws, message);
        } catch (err) {
          console.error('[PartyGameServer] Error handling message:', err);
        }
      });

      ws.on('close', () => {
        this.handleSocketClose(ws);
      });

      ws.on('error', (err) => {
        console.error('[PartyGameServer] WebSocket error:', err);
      });
    });
  }

  private send(ws: WebSocket, message: PartyServerMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private broadcastToBomba(room: BombaServerRoom, message: PartyServerMessage) {
    const payload = JSON.stringify(message);
    for (const [ws, conn] of this.clients.entries()) {
      if (conn.roomId === room.code && ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  }

  private broadcastToLPR(room: LPRServerRoom, message: PartyServerMessage) {
    const payload = JSON.stringify(message);
    for (const [ws, conn] of this.clients.entries()) {
      if (conn.roomId === room.code && ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  }

  /**
   * Single Authoritative Life-Loss Function: applyLifeLoss
   * Guarantees atomic, idempotent subtraction of exactly 1 life per unique eventId.
   */
  private applyLifeLoss(
    room: BombaServerRoom,
    targetPlayerId: string,
    reason: 'EXPLOSION',
    eventId: string
  ): { success: boolean; player: BombaPlayerState | null; previousLives: number; newLives: number } {
    if (!room.processedLifeEventIds) {
      room.processedLifeEventIds = new Set<string>();
    }

    // Idempotency check: exactly 1 life deducted per unique eventId
    if (room.processedLifeEventIds.has(eventId)) {
      console.warn(`[LIFE_EVENT] Duplicate life-loss event ignored: ${eventId} in room ${room.code}`);
      const existingPlayer = room.players.find((p) => p.id === targetPlayerId) || null;
      return {
        success: false,
        player: existingPlayer,
        previousLives: existingPlayer?.lives ?? 0,
        newLives: existingPlayer?.lives ?? 0,
      };
    }

    const targetPlayer = room.players.find((p) => p.id === targetPlayerId);
    if (!targetPlayer) {
      console.error(`[LIFE_EVENT] Player not found: ${targetPlayerId} in room ${room.code}`);
      return { success: false, player: null, previousLives: 0, newLives: 0 };
    }

    if (targetPlayer.isEliminated || targetPlayer.lives <= 0) {
      console.warn(
        `[LIFE_EVENT] Player ${targetPlayer.name} (${targetPlayer.id}) is already eliminated (lives: ${targetPlayer.lives}). Ignoring.`
      );
      return {
        success: false,
        player: targetPlayer,
        previousLives: targetPlayer.lives,
        newLives: targetPlayer.lives,
      };
    }

    const previousLives = targetPlayer.lives;
    const newLives = Math.max(0, previousLives - 1);

    // Record idempotency token BEFORE state mutation
    room.processedLifeEventIds.add(eventId);

    // Atomic assignment
    targetPlayer.lives = newLives;
    if (newLives === 0) {
      targetPlayer.isEliminated = true;
    }

    // Strict assertion
    if (targetPlayer.lives !== previousLives - 1) {
      console.error(
        `[LIFE_EVENT ASSERTION FAILED] Room ${room.code} | Player ${targetPlayer.name} | Expected ${previousLives - 1} lives, got ${targetPlayer.lives}`
      );
    }

    // Structured logging
    console.log(
      `[LIFE_EVENT] Room ${room.code} | Round ${room.roundNumber} | Player: ${targetPlayer.name} (${targetPlayer.id}) | Reason: ${reason} | EventId: ${eventId} | Lives: ${previousLives} -> ${newLives} | Eliminated: ${targetPlayer.isEliminated}`
    );

    return {
      success: true,
      player: targetPlayer,
      previousLives,
      newLives,
    };
  }

  private broadcastBombaState(room: BombaServerRoom) {
    const progress = Math.min(1.0, Math.max(0, 1 - room.bombRemainingMs / room.bombDurationMs));
    const dangerLevel =
      progress >= 0.88
        ? 'CRITICAL'
        : progress >= 0.70
        ? 'DANGER'
        : progress >= 0.40
        ? 'MIDDLE'
        : 'EARLY';

    const activePlayer =
      (room.activePlayerId ? room.players.find((p) => p.id === room.activePlayerId) : null) ||
      room.players[room.activePlayerIndex] ||
      null;

    const state: BombaRoomState = {
      code: room.code,
      gameType: 'la-bomba',
      hostId: room.hostId,
      phase: room.phase,
      config: room.config,
      players: room.players,
      currentSequence: room.currentSequence,
      activePlayerIndex: room.activePlayerIndex,
      activePlayerId: room.activePlayerId || (activePlayer ? activePlayer.id : null),
      currentTurnId: room.currentTurnId,
      challengeId: room.challengeId,
      roundNumber: room.roundNumber,
      bombRemainingMs: Math.max(0, Math.round(room.bombRemainingMs)),
      bombDurationMs: room.bombDurationMs,
      speedMultiplier: room.speedMultiplier || 1.0,
      roundMistakes: room.roundMistakes || 0,
      dangerLevel,
      usedWords: room.usedWords,
      acceptedWordBanner: room.acceptedWordBanner,
      affectedPlayer: room.affectedPlayer,
      winner: room.winner,
      stats: {
        winner: room.winner,
        totalValidWords: room.totalValidWords,
        totalMistakes: room.totalMistakes,
        totalExplosions: room.totalExplosions,
        fastestAnswer: room.fastestAnswer,
        mostBurntPlayer: null,
      },
      abortReason: room.abortReason,
      endMessage: room.endMessage,
    };

    this.broadcastToBomba(room, { type: 'room_state', state });
  }

  private broadcastLPRState(room: LPRServerRoom) {
    const isResultsPhase = room.phase === 'RESULTS' || room.phase === 'FINAL_RESULTS';
    const isVotingPhase = room.phase === 'VOTING';
    const isRevealPhase = room.phase === 'REVEAL';

    for (const [ws, conn] of this.clients.entries()) {
      if (conn.roomId === room.code && ws.readyState === WebSocket.OPEN) {
        const clientPlayerId = conn.playerId;

        const transformedAnswers: LPRShuffledCard[] = room.shuffledCards.map((c) => {
          if (isResultsPhase) {
            const author = room.players.find((p) => p.id === c.authorId);
            return {
              id: c.id,
              text: c.text,
              revealed: true,
              isOwnCard: c.authorId === clientPlayerId,
              votesCount: c.votes.length,
              authorId: c.authorId,
              authorName: author?.name || 'Anónimo',
              authorAvatar: author?.avatar || '👤',
              authorColor: author?.color || '#f59e0b',
              votes: c.votes,
              isWinner: room.winningAuthorIds.includes(c.authorId),
            };
          }

          if (isVotingPhase || isRevealPhase) {
            return {
              id: c.id,
              text: c.revealed ? c.text : '',
              revealed: c.revealed,
              isOwnCard: c.authorId === clientPlayerId, // ONLY true for this client's own card!
            };
          }

          return {
            id: c.id,
            text: '',
            revealed: false,
          };
        });

        const state: LPRRoomState = {
          code: room.code,
          gameType: 'la-peor-respuesta',
          hostId: room.hostId,
          phase: room.phase,
          config: room.config,
          players: room.players,
          round: room.round,
          currentBlackCard: room.currentBlackCard,
          answers: transformedAnswers,
          readyCount: room.privateSubmissions.size,
          votedCount: room.votes.size,
          winningAuthorIds: isResultsPhase ? room.winningAuthorIds : undefined,
          abortReason: room.abortReason,
          endMessage: room.endMessage,
        };

        this.send(ws, { type: 'room_state', state });
      }
    }
  }

  private handleSocketClose(ws: WebSocket) {
    const conn = this.clients.get(ws);
    if (!conn) return;

    this.clients.delete(ws);
    const { roomId, playerId, gameType } = conn;

    if (gameType === 'la-bomba') {
      const room = this.bombaRooms.get(roomId);
      if (!room) return;

      const player = room.players.find((p) => p.id === playerId);
      if (player) {
        player.isConnected = false;
      }

      const isMatchFinished = room.phase === 'MATCH_ABORTED' || room.phase === 'GAME_OVER';
      if (isMatchFinished) {
        this.processPermanentDeparture(roomId, playerId, gameType);
        return;
      }

      // Broadcast disconnected state to other players
      this.broadcastBombaState(room);

      // Register grace period for reconnection (15s)
      matchDepartureHandler.registerDisconnection(roomId, playerId, gameType, () => {
        this.processPermanentDeparture(roomId, playerId, gameType);
      });
    } else if (gameType === 'la-peor-respuesta') {
      const room = this.lprRooms.get(roomId);
      if (!room) return;

      const player = room.players.find((p) => p.id === playerId);
      if (player) {
        player.isConnected = false;
      }

      const isMatchFinished = room.phase === 'MATCH_ABORTED' || room.phase === 'FINAL_RESULTS';
      if (isMatchFinished) {
        this.processPermanentDeparture(roomId, playerId, gameType);
        return;
      }

      this.broadcastLPRState(room);

      matchDepartureHandler.registerDisconnection(roomId, playerId, gameType, () => {
        this.processPermanentDeparture(roomId, playerId, gameType);
      });
    }
  }

  private handleExplicitLeave(ws: WebSocket) {
    const conn = this.clients.get(ws);
    if (!conn) return;

    this.clients.delete(ws);
    const { roomId, playerId, gameType } = conn;
    matchDepartureHandler.cancelGracePeriod(roomId, playerId);
    this.processPermanentDeparture(roomId, playerId, gameType);
  }

  private processPermanentDeparture(roomId: string, playerId: string, gameType: 'la-bomba' | 'la-peor-respuesta') {
    if (gameType === 'la-bomba') {
      const room = this.bombaRooms.get(roomId);
      if (!room) return;

      const departingPlayer = room.players.find((p) => p.id === playerId);
      const wasHost = room.hostId === playerId;
      const isGameActive = room.phase !== 'LOBBY' && room.phase !== 'MATCH_ABORTED' && room.phase !== 'GAME_OVER';

      // 1. In LOBBY phase
      if (room.phase === 'LOBBY') {
        room.players = room.players.filter((p) => p.id !== playerId);
        if (room.players.length === 0) {
          if (room.timerInterval) clearInterval(room.timerInterval);
          this.bombaRooms.delete(roomId);
          roomRegistry.unregister(roomId);
          matchDepartureHandler.clearRoomGracePeriods(roomId);
          return;
        }

        if (wasHost) {
          const nextHost = matchDepartureHandler.findEarliestConnectedPlayer(room.players) || room.players[0];
          if (nextHost) {
            room.hostId = nextHost.id;
            nextHost.isHost = true;
            this.broadcastToBomba(room, {
              type: 'notification',
              message: `👑 ${nextHost.name} es ahora quien gestiona la sala.`,
              noticeType: 'info',
            });
          }
        }
        this.broadcastBombaState(room);
        return;
      }

      // 2. In ACTIVE MATCH or GAME OVER
      const evaluation = matchDepartureHandler.evaluatePermanentDeparture({
        gameType: 'la-bomba',
        isGameActive,
        departingPlayerId: playerId,
        wasHost,
        players: room.players,
      });

      if (evaluation.shouldAbort) {
        if (room.timerInterval) clearInterval(room.timerInterval);
        if (room.explosionTimeout) clearTimeout(room.explosionTimeout);
        if (room.disconnectGraceTimeout) clearTimeout(room.disconnectGraceTimeout);
        room.timerInterval = null;
        room.explosionTimeout = null;
        room.disconnectGraceTimeout = null;

        room.phase = 'MATCH_ABORTED';
        room.abortReason = evaluation.abortReason;
        room.endMessage = evaluation.endMessage;

        matchDepartureHandler.clearRoomGracePeriods(roomId);
        this.broadcastBombaState(room);

        setTimeout(() => {
          this.bombaRooms.delete(roomId);
          roomRegistry.unregister(roomId);
        }, 30000);
        return;
      }

      // Match continues (enough players remaining)
      if (evaluation.migratedHost) {
        room.hostId = evaluation.migratedHost.id;
        const newHost = room.players.find((p) => p.id === evaluation.migratedHost!.id);
        if (newHost) {
          newHost.isHost = true;
        }
        this.broadcastToBomba(room, {
          type: 'notification',
          message: `👑 ${evaluation.migratedHost.name} es ahora quien gestiona la sala.`,
          noticeType: 'info',
        });
      }

      if (departingPlayer) {
        departingPlayer.isConnected = false;
        departingPlayer.isEliminated = true;
      }

      // If active player left while playing, advance turn immediately
      if (room.activePlayerId === playerId && room.phase === 'PLAYING') {
        this.advanceBombaTurn(room);
      } else {
        this.broadcastBombaState(room);
      }
    } else if (gameType === 'la-peor-respuesta') {
      const room = this.lprRooms.get(roomId);
      if (!room) return;

      const departingPlayer = room.players.find((p) => p.id === playerId);
      const wasHost = room.hostId === playerId;
      const isGameActive = room.phase !== 'LOBBY' && room.phase !== 'MATCH_ABORTED' && room.phase !== 'FINAL_RESULTS';

      // 1. In LOBBY phase
      if (room.phase === 'LOBBY') {
        room.players = room.players.filter((p) => p.id !== playerId);
        if (room.players.length === 0) {
          this.lprRooms.delete(roomId);
          roomRegistry.unregister(roomId);
          matchDepartureHandler.clearRoomGracePeriods(roomId);
          return;
        }

        if (wasHost) {
          const nextHost = matchDepartureHandler.findEarliestConnectedPlayer(room.players) || room.players[0];
          if (nextHost) {
            room.hostId = nextHost.id;
            nextHost.isHost = true;
            this.broadcastToLPR(room, {
              type: 'notification',
              message: `👑 ${nextHost.name} es ahora quien gestiona la sala.`,
              noticeType: 'info',
            });
          }
        }
        this.broadcastLPRState(room);
        return;
      }

      // 2. In ACTIVE MATCH or FINAL RESULTS
      const evaluation = matchDepartureHandler.evaluatePermanentDeparture({
        gameType: 'la-peor-respuesta',
        isGameActive,
        departingPlayerId: playerId,
        wasHost,
        players: room.players,
      });

      if (evaluation.shouldAbort) {
        room.phase = 'MATCH_ABORTED';
        room.abortReason = evaluation.abortReason;
        room.endMessage = evaluation.endMessage;

        matchDepartureHandler.clearRoomGracePeriods(roomId);
        this.broadcastLPRState(room);

        setTimeout(() => {
          this.lprRooms.delete(roomId);
          roomRegistry.unregister(roomId);
        }, 30000);
        return;
      }

      // Match continues (at least 3 players remain connected)
      if (evaluation.migratedHost) {
        room.hostId = evaluation.migratedHost.id;
        const newHost = room.players.find((p) => p.id === evaluation.migratedHost!.id);
        if (newHost) {
          newHost.isHost = true;
        }
        this.broadcastToLPR(room, {
          type: 'notification',
          message: `👑 ${evaluation.migratedHost.name} es ahora quien gestiona la sala.`,
          noticeType: 'info',
        });
      }

      // Remove departing player
      room.players = room.players.filter((p) => p.id !== playerId);
      room.privateSubmissions.delete(playerId);
      room.votes.delete(playerId);

      // Check progression so the match does not get blocked
      const remainingConnected = room.players.filter((p) => p.isConnected);
      if (room.phase === 'WRITING') {
        const allSubmitted = remainingConnected.length > 0 && remainingConnected.every((p) => room.privateSubmissions.has(p.id));
        if (allSubmitted) {
          const rawCards = remainingConnected.map((p, idx) => ({
            id: `card-${idx + 1}-${Math.random().toString(36).substring(2, 6)}`,
            authorId: p.id,
            text: room.privateSubmissions.get(p.id) || '',
            revealed: false,
            votes: [],
          }));
          room.shuffledCards = shuffleArray(rawCards);
          room.phase = 'REVEAL';
        }
      } else if (room.phase === 'VOTING') {
        const allVoted = remainingConnected.length > 0 && remainingConnected.every((p) => room.votes.has(p.id));
        if (allVoted) {
          for (const card of room.shuffledCards) {
            card.votes = [];
            for (const [voterId, votedCardId] of room.votes.entries()) {
              if (votedCardId === card.id) {
                card.votes.push(voterId);
              }
            }
          }
          const maxVotes = Math.max(...room.shuffledCards.map((c) => c.votes.length), 0);
          const winningCards = room.shuffledCards.filter((c) => c.votes.length === maxVotes && maxVotes > 0);
          const winningAuthors = Array.from(new Set(winningCards.map((c) => c.authorId)));
          room.winningAuthorIds = winningAuthors;
          for (const p of room.players) {
            if (winningAuthors.includes(p.id)) {
              p.score += 1;
            }
          }
          room.phase = 'RESULTS';
        }
      }

      this.broadcastLPRState(room);
    }
  }

  private async handleClientMessage(ws: WebSocket, message: PartyClientMessage) {
    switch (message.type) {
      case 'create_room': {
        const { gameType, player, config } = message;
        const roomInfo = this.createRoomDirect(gameType, player, config);

        this.clients.set(ws, { ws, playerId: player.id, roomId: roomInfo.code, gameType });
        if (gameType === 'la-bomba') {
          const room = this.bombaRooms.get(roomInfo.code)!;
          this.broadcastBombaState(room);
        } else if (gameType === 'la-peor-respuesta') {
          const room = this.lprRooms.get(roomInfo.code)!;
          this.broadcastLPRState(room);
        }
        break;
      }

      case 'join_room': {
        const code = message.code.toUpperCase().trim();
        const { player } = message;

        // Check if room is in Bomba
        const bombaRoom = this.bombaRooms.get(code);
        if (bombaRoom) {
          if (bombaRoom.players.length >= 10 && !bombaRoom.players.some((p) => p.id === player.id)) {
            return this.send(ws, { type: 'error', message: 'La sala está completa (máximo 10 jugadores)' });
          }

          let existingPlayer = bombaRoom.players.find((p) => p.id === player.id);
          if (existingPlayer) {
            matchDepartureHandler.cancelGracePeriod(code, existingPlayer.id);
            existingPlayer.isConnected = true;
            existingPlayer.name = player.name;
            existingPlayer.avatar = player.avatar;
            existingPlayer.color = player.color;
          } else {
            if (bombaRoom.phase !== 'LOBBY') {
              return this.send(ws, {
                type: 'error',
                message: 'La partida ya ha comenzado. Espera a que termine para unirte.',
              });
            }

            const newPlayer: BombaPlayerState = {
              id: player.id,
              name: player.name,
              avatar: player.avatar,
              color: player.color,
              isHost: bombaRoom.players.length === 0,
              isConnected: true,
              lives: bombaRoom.config.startingLives,
              mistakes: 0,
              roundMistakes: 0,
              multiplier: 1.0,
              isEliminated: false,
              bombsReceived: 0,
              validWordsCount: 0,
              fastestAnswerTimeMs: null,
              lastValidWord: null,
              currentTypingWord: '',
              alphabetProgress: [],
            };
            bombaRoom.players.push(newPlayer);
          }

          this.clients.set(ws, { ws, playerId: player.id, roomId: code, gameType: 'la-bomba' });
          this.broadcastBombaState(bombaRoom);
          this.broadcastToBomba(bombaRoom, {
            type: 'notification',
            message: `${player.name} se ha unido a la sala`,
            noticeType: 'info',
          });
          return;
        }

        // Check if room is in LPR
        const lprRoom = this.lprRooms.get(code);
        if (lprRoom) {
          if (lprRoom.players.length >= 10 && !lprRoom.players.some((p) => p.id === player.id)) {
            return this.send(ws, { type: 'error', message: 'La sala está completa (máximo 10 jugadores)' });
          }

          let existingPlayer = lprRoom.players.find((p) => p.id === player.id);
          if (existingPlayer) {
            matchDepartureHandler.cancelGracePeriod(code, existingPlayer.id);
            existingPlayer.isConnected = true;
            existingPlayer.name = player.name;
            existingPlayer.avatar = player.avatar;
            existingPlayer.color = player.color;
          } else {
            if (lprRoom.phase !== 'LOBBY') {
              return this.send(ws, {
                type: 'error',
                message: 'La partida ya ha comenzado. Espera a que termine para unirte.',
              });
            }

            const newPlayer: LPRPlayerState = {
              id: player.id,
              name: player.name,
              avatar: player.avatar,
              color: player.color,
              isHost: lprRoom.players.length === 0,
              isConnected: true,
              score: 0,
              hasSubmittedAnswer: false,
              hasVoted: false,
            };
            lprRoom.players.push(newPlayer);
          }

          this.clients.set(ws, { ws, playerId: player.id, roomId: code, gameType: 'la-peor-respuesta' });
          this.broadcastLPRState(lprRoom);
          this.broadcastToLPR(lprRoom, {
            type: 'notification',
            message: `${player.name} se ha unido a la sala`,
            noticeType: 'info',
          });
          return;
        }

        // Check if room exists in Pinturillo
        const roomMeta = roomRegistry.get(code);
        if (roomMeta && roomMeta.gameType === 'pinturillo') {
          return this.send(ws, {
            type: 'error',
            message: `Este código de sala (${code}) pertenece a Pinturillo.`,
          });
        }

        this.send(ws, {
          type: 'error',
          message: `No se ha encontrado ninguna sala con el código ${code}. Comprueba el código e inténtalo de nuevo.`,
        });
        break;
      }

      case 'update_config': {
        const conn = this.clients.get(ws);
        if (!conn) return;

        if (conn.gameType === 'la-bomba') {
          const room = this.bombaRooms.get(conn.roomId);
          if (room && room.hostId === conn.playerId && room.phase === 'LOBBY') {
            room.config = { ...room.config, ...message.config };
            for (const p of room.players) {
              p.lives = room.config.startingLives;
            }
            this.broadcastBombaState(room);
          }
        } else if (conn.gameType === 'la-peor-respuesta') {
          const room = this.lprRooms.get(conn.roomId);
          if (room && room.hostId === conn.playerId && room.phase === 'LOBBY') {
            room.config = { ...room.config, ...message.config };
            this.broadcastLPRState(room);
          }
        }
        break;
      }

      case 'start_game': {
        const conn = this.clients.get(ws);
        if (!conn) return;

        if (conn.gameType === 'la-bomba') {
          const room = this.bombaRooms.get(conn.roomId);
          if (room && room.hostId === conn.playerId && room.phase === 'LOBBY') {
            if (room.players.length < 2) {
              return this.send(ws, { type: 'error', message: 'Se necesitan al menos 2 jugadores para empezar.' });
            }
            this.startBombaMatch(room);
          }
        } else if (conn.gameType === 'la-peor-respuesta') {
          const room = this.lprRooms.get(conn.roomId);
          if (room && room.hostId === conn.playerId && room.phase === 'LOBBY') {
            if (room.players.length < 3) {
              return this.send(ws, { type: 'error', message: 'Se necesitan al menos 3 jugadores para La Peor Respuesta.' });
            }
            this.startLPRMatch(room);
          }
        }
        break;
      }

      case 'leave_room': {
        this.handleExplicitLeave(ws);
        break;
      }

      case 'ping': {
        this.send(ws, { type: 'pong' });
        break;
      }

      // ==========================================
      // LA BOMBA EVENTS
      // ==========================================
      case 'bomba_typing': {
        const conn = this.clients.get(ws);
        if (!conn || conn.gameType !== 'la-bomba') return;
        const room = this.bombaRooms.get(conn.roomId);
        if (!room || room.phase !== 'PLAYING') return;

        // Verify that sender is the active player by playerId
        if (conn.playerId !== room.activePlayerId) return;

        // Turn matching check
        if (message.turnId && message.turnId !== room.currentTurnId) return;
        if (message.roundNumber && message.roundNumber !== room.roundNumber) return;

        const activePlayer = room.players.find((p) => p.id === room.activePlayerId);
        if (!activePlayer || activePlayer.isEliminated) return;

        activePlayer.currentTypingWord = message.text || '';
        this.broadcastToBomba(room, {
          type: 'bomba_typing_broadcast',
          playerId: activePlayer.id,
          text: activePlayer.currentTypingWord,
          turnId: room.currentTurnId,
          roundNumber: room.roundNumber,
        });
        break;
      }

      case 'bomba_submit_word': {
        const conn = this.clients.get(ws);
        if (!conn || conn.gameType !== 'la-bomba') return;
        const room = this.bombaRooms.get(conn.roomId);
        if (!room || room.phase !== 'PLAYING') return;

        const submittingPlayerId = conn.playerId;

        // Verify that submitting player is strictly the active player by playerId
        if (submittingPlayerId !== room.activePlayerId) return;

        // Check turn match to prevent stale submissions
        if (message.turnId && message.turnId !== room.currentTurnId) return;
        if (message.roundNumber && message.roundNumber !== room.roundNumber) return;

        // Check if submissionId is duplicate
        const submissionId = message.submissionId;
        if (submissionId && room.processedSubmissionIds.has(submissionId)) {
          return;
        }

        // Lock concurrent submissions for this player
        if (room.pendingSubmissions.has(submittingPlayerId)) {
          return;
        }
        room.pendingSubmissions.add(submittingPlayerId);
        if (submissionId) {
          room.processedSubmissionIds.add(submissionId);
        }

        try {
          const targetPlayer = room.players.find((p) => p.id === submittingPlayerId);
          if (!targetPlayer || targetPlayer.isEliminated) return;

          const word = (message.word || '').trim();
          if (!word) return;

          const validation = await validateSpanishWordServer(
            word,
            room.currentSequence.sequence,
            room.usedWords.map((u) => u.word)
          );

          // If phase or turn changed while validating asynchronously, abort
          if (room.phase !== 'PLAYING') return;
          if (room.activePlayerId !== submittingPlayerId) return;

          if (!validation.valid) {
            // 1. Calculate and consume fuse elapsed with the current multiplier up to this instant
            const now = Date.now();
            const elapsed = Math.max(0, now - room.lastUpdateTimestamp);
            room.lastUpdateTimestamp = now;
            const consumed = elapsed * (room.speedMultiplier || 1.0);
            room.bombRemainingMs = Math.max(0, room.bombRemainingMs - consumed);

            // 2. Mistake handling: atomic increment for submitting player & round
            const maxMistakes = room.config.allowedMistakesPerRound || 3;
            targetPlayer.mistakes += 1;
            targetPlayer.roundMistakes = Math.min(maxMistakes, (targetPlayer.roundMistakes || 0) + 1);
            room.totalMistakes += 1;

            // Round-based mistake counter (accumulates during the round, capped at maxMistakes)
            room.roundMistakes = Math.min(maxMistakes, (room.roundMistakes || 0) + 1);

            // Speed multiplier progression:
            // 0 mistakes -> x1
            // 1 mistake -> x1
            // 2 mistakes -> x2
            // 3 mistakes -> x3
            // 4 mistakes -> x4
            // 5 mistakes -> x5
            // capped at maxMistakes
            const newMultiplier = Math.min(maxMistakes, Math.max(1, room.roundMistakes));
            room.speedMultiplier = newMultiplier;

            // Update all players' multiplier to the single authoritative round bomb multiplier
            for (const p of room.players) {
              p.multiplier = newMultiplier;
            }

            this.broadcastToBomba(room, {
              type: 'bomba_feedback',
              feedbackType: 'error',
              message: validation.reason || 'Palabra no válida',
              playerId: targetPlayer.id,
              submissionId,
            });

            // If the elapsed time reached zero, explode now
            if (room.bombRemainingMs <= 0) {
              if (room.timerInterval) {
                clearInterval(room.timerInterval);
                room.timerInterval = null;
              }
              this.triggerBombaExplosion(room);
              return;
            }

            this.broadcastBombaState(room);
            return;
          }

          // VALID WORD!
          const acceptedWord = validation.canonicalWord || word.toLowerCase();
          const answerTimeSeconds = Math.max(0.3, (Date.now() - room.turnStartedAt) / 1000);

          room.totalValidWords += 1;
          targetPlayer.validWordsCount += 1;
          targetPlayer.lastValidWord = acceptedWord;
          targetPlayer.currentTypingWord = '';

          const currentFastest = targetPlayer.fastestAnswerTimeMs;
          const answerMs = Math.round(answerTimeSeconds * 1000);
          targetPlayer.fastestAnswerTimeMs = currentFastest ? Math.min(currentFastest, answerMs) : answerMs;

          if (!room.fastestAnswer || answerTimeSeconds < room.fastestAnswer.timeSeconds) {
            room.fastestAnswer = {
              playerName: targetPlayer.name,
              playerColor: targetPlayer.color,
              timeSeconds: answerTimeSeconds,
              word: acceptedWord,
            };
          }

          // Reto del Abecedario strictly for the active player!
          const alphabetUpdate = calculateAlphabetProgress(targetPlayer.alphabetProgress || [], acceptedWord);
          let gainedLife = false;

          if (alphabetUpdate.isCompleted) {
            if (targetPlayer.lives < room.config.startingLives) {
              targetPlayer.lives += 1;
              gainedLife = true;
            }
            targetPlayer.alphabetProgress = []; // Reset this player only
            this.broadcastToBomba(room, {
              type: 'bomba_alphabet_reward',
              playerId: targetPlayer.id,
              playerName: targetPlayer.name,
              gainedLife,
            });
          } else {
            targetPlayer.alphabetProgress = alphabetUpdate.updatedProgress;
          }

          // Add to used words
          const newUsedWord: UsedWord = {
            word,
            canonicalWord: acceptedWord,
            playerId: targetPlayer.id,
            playerName: targetPlayer.name,
            playerColor: targetPlayer.color,
            timestamp: Date.now(),
          };
          room.usedWords = [newUsedWord, ...room.usedWords];

          if (room.acceptedWordBannerTimeout) {
            clearTimeout(room.acceptedWordBannerTimeout);
            room.acceptedWordBannerTimeout = null;
          }

          room.acceptedWordBanner = {
            word: acceptedWord.toUpperCase(),
            player: targetPlayer.name,
            bonusLetters: alphabetUpdate.newLetters.length,
          };

          // Automatically clear the correct-answer notification after ~1 second (1000ms)
          room.acceptedWordBannerTimeout = setTimeout(() => {
            if (room.acceptedWordBanner) {
              room.acceptedWordBanner = null;
              room.acceptedWordBannerTimeout = null;
              this.broadcastBombaState(room);
            }
          }, 1000);

          // Advance turn clockwise immediately (gameplay never waits on notification)
          this.advanceBombaTurn(room);
        } finally {
          room.pendingSubmissions.delete(submittingPlayerId);
        }
        break;
      }

      case 'bomba_dismiss_explosion': {
        const conn = this.clients.get(ws);
        if (!conn || conn.gameType !== 'la-bomba') return;
        const room = this.bombaRooms.get(conn.roomId);
        if (!room || room.phase !== 'EXPLOSION') return;

        if (room.explosionTimeout) {
          clearTimeout(room.explosionTimeout);
          room.explosionTimeout = null;
        }
        this.startNextBombaRound(room);
        break;
      }

      case 'bomba_play_again': {
        const conn = this.clients.get(ws);
        if (!conn || conn.gameType !== 'la-bomba') return;
        const room = this.bombaRooms.get(conn.roomId);
        if (!room || room.phase !== 'GAME_OVER' || room.hostId !== conn.playerId) return;

        for (const p of room.players) {
          p.lives = room.config.startingLives;
          p.mistakes = 0;
          p.roundMistakes = 0;
          p.multiplier = 1.0;
          p.isEliminated = false;
          p.bombsReceived = 0;
          p.validWordsCount = 0;
          p.fastestAnswerTimeMs = null;
          p.lastValidWord = null;
          p.currentTypingWord = '';
          p.alphabetProgress = [];
        }

        room.processedLifeEventIds = new Set<string>();
        room.roundNumber = 1;
        room.totalValidWords = 0;
        room.totalMistakes = 0;
        room.totalExplosions = 0;
        room.fastestAnswer = null;
        room.winner = null;
        room.usedWords = [];
        this.startBombaMatch(room);
        break;
      }

      // ==========================================
      // LA PEOR RESPUESTA EVENTS
      // ==========================================
      case 'lpr_submit_answer': {
        const conn = this.clients.get(ws);
        if (!conn || conn.gameType !== 'la-peor-respuesta') return;
        const room = this.lprRooms.get(conn.roomId);
        if (!room || room.phase !== 'WRITING') return;

        // Authoritative validation: answer must be trimmed, 1-60 characters
        const answer = typeof message.text === 'string' ? message.text.trim() : '';
        if (answer.length === 0 || answer.length > 60) return;

        room.privateSubmissions.set(conn.playerId, answer);
        const player = room.players.find((p) => p.id === conn.playerId);
        if (player) {
          player.hasSubmittedAnswer = true;
        }

        // Check if all connected players submitted
        const connectedPlayers = room.players.filter((p) => p.isConnected);
        const allReady = connectedPlayers.length > 0 && connectedPlayers.every((p) => room.privateSubmissions.has(p.id));

        if (allReady) {
          // Prepare shuffled cards
          const rawCards: LPRRawCard[] = connectedPlayers.map((p, idx) => ({
            id: `card-${idx + 1}-${Math.random().toString(36).substring(2, 6)}`,
            authorId: p.id,
            text: room.privateSubmissions.get(p.id) || '',
            revealed: false,
            votes: [],
          }));

          room.shuffledCards = shuffleArray(rawCards);
          room.phase = 'REVEAL';
        }

        this.broadcastLPRState(room);
        break;
      }

      case 'lpr_reveal_card': {
        const conn = this.clients.get(ws);
        if (!conn || conn.gameType !== 'la-peor-respuesta') return;
        const room = this.lprRooms.get(conn.roomId);
        if (!room || room.phase !== 'REVEAL') return;

        const target = room.shuffledCards.find((c) => c.id === message.cardId);
        if (target && !target.revealed) {
          target.revealed = true;
          this.broadcastLPRState(room);

          // If all revealed, automatically proceed to VOTING after 1.8s delay
          const allRevealed = room.shuffledCards.every((c) => c.revealed);
          if (allRevealed) {
            setTimeout(() => {
              const fresh = this.lprRooms.get(room.code);
              if (fresh && fresh.phase === 'REVEAL') {
                fresh.phase = 'VOTING';
                for (const p of fresh.players) {
                  p.hasVoted = false;
                }
                fresh.votes.clear();
                this.broadcastLPRState(fresh);
              }
            }, 1800);
          }
        }
        break;
      }

      case 'lpr_reveal_all': {
        const conn = this.clients.get(ws);
        if (!conn || conn.gameType !== 'la-peor-respuesta') return;
        const room = this.lprRooms.get(conn.roomId);
        if (!room || room.phase !== 'REVEAL') return;

        for (const c of room.shuffledCards) {
          c.revealed = true;
        }
        this.broadcastLPRState(room);

        setTimeout(() => {
          const fresh = this.lprRooms.get(room.code);
          if (fresh && fresh.phase === 'REVEAL') {
            fresh.phase = 'VOTING';
            for (const p of fresh.players) {
              p.hasVoted = false;
            }
            fresh.votes.clear();
            this.broadcastLPRState(fresh);
          }
        }, 1800);
        break;
      }

      case 'lpr_proceed_voting': {
        const conn = this.clients.get(ws);
        if (!conn || conn.gameType !== 'la-peor-respuesta') return;
        const room = this.lprRooms.get(conn.roomId);
        if (!room || room.phase !== 'REVEAL') return;

        for (const c of room.shuffledCards) {
          c.revealed = true;
        }
        room.phase = 'VOTING';
        for (const p of room.players) {
          p.hasVoted = false;
        }
        room.votes.clear();
        this.broadcastLPRState(room);
        break;
      }

      case 'lpr_submit_vote': {
        const conn = this.clients.get(ws);
        if (!conn || conn.gameType !== 'la-peor-respuesta') return;
        const room = this.lprRooms.get(conn.roomId);
        if (!room || room.phase !== 'VOTING') return;

        const targetCard = room.shuffledCards.find((c) => c.id === message.cardId);
        if (!targetCard) return;

        // Authoritative validation: NO SELF VOTING!
        if (targetCard.authorId === conn.playerId) {
          return this.send(ws, { type: 'error', message: 'No puedes votar por tu propia respuesta.' });
        }

        room.votes.set(conn.playerId, targetCard.id);
        const player = room.players.find((p) => p.id === conn.playerId);
        if (player) {
          player.hasVoted = true;
        }

        // Check if all connected players voted
        const connectedPlayers = room.players.filter((p) => p.isConnected);
        const allVoted = connectedPlayers.length > 0 && connectedPlayers.every((p) => room.votes.has(p.id));

        if (allVoted) {
          // Map votes to cards
          for (const card of room.shuffledCards) {
            card.votes = [];
            for (const [voterId, votedCardId] of room.votes.entries()) {
              if (votedCardId === card.id) {
                card.votes.push(voterId);
              }
            }
          }

          // Calculate winner(s)
          const maxVotes = Math.max(...room.shuffledCards.map((c) => c.votes.length), 0);
          const winningCards = room.shuffledCards.filter((c) => c.votes.length === maxVotes && maxVotes > 0);
          const winningAuthors = Array.from(new Set(winningCards.map((c) => c.authorId)));

          room.winningAuthorIds = winningAuthors;

          // Award +1 point to winning authors
          for (const p of room.players) {
            if (winningAuthors.includes(p.id)) {
              p.score += 1;
            }
          }

          room.phase = 'RESULTS';
        }

        this.broadcastLPRState(room);
        break;
      }

      case 'lpr_cursor_move': {
        const conn = this.clients.get(ws);
        if (!conn || conn.gameType !== 'la-peor-respuesta') return;
        const room = this.lprRooms.get(conn.roomId);
        if (!room || (room.phase !== 'REVEAL' && room.phase !== 'VOTING')) return;

        const player = room.players.find((p) => p.id === conn.playerId);
        if (!player) return;

        const cursorPayload: BoardCursor = {
          playerId: player.id,
          name: player.name,
          avatar: player.avatar,
          color: player.color,
          x: Math.max(0, Math.min(1, message.x)),
          y: Math.max(0, Math.min(1, message.y)),
          updatedAt: Date.now(),
        };

        const msgStr = JSON.stringify({ type: 'lpr_cursor_broadcast', cursor: cursorPayload });
        for (const [clientWs, clientConn] of this.clients.entries()) {
          if (clientConn.roomId === room.code && clientConn.playerId !== player.id && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(msgStr);
          }
        }
        break;
      }

      case 'lpr_next_round': {
        const conn = this.clients.get(ws);
        if (!conn || conn.gameType !== 'la-peor-respuesta') return;
        const room = this.lprRooms.get(conn.roomId);
        if (!room || room.phase !== 'RESULTS') return;

        const isFinished = room.config.totalRounds !== -1 && room.round >= room.config.totalRounds;
        if (isFinished) {
          room.phase = 'FINAL_RESULTS';
        } else {
          const nextCard = getNextBlackCard(room.usedBlackCardIds);
          room.currentBlackCard = nextCard;
          room.usedBlackCardIds.add(nextCard.id);
          room.privateSubmissions.clear();
          room.shuffledCards = [];
          room.votes.clear();
          room.winningAuthorIds = [];
          room.round += 1;
          for (const p of room.players) {
            p.hasSubmittedAnswer = false;
            p.hasVoted = false;
          }
          room.phase = 'WRITING';
        }

        this.broadcastLPRState(room);
        break;
      }

      case 'lpr_play_again': {
        const conn = this.clients.get(ws);
        if (!conn || conn.gameType !== 'la-peor-respuesta') return;
        const room = this.lprRooms.get(conn.roomId);
        if (!room || room.phase !== 'FINAL_RESULTS' || room.hostId !== conn.playerId) return;

        for (const p of room.players) {
          p.score = 0;
          p.hasSubmittedAnswer = false;
          p.hasVoted = false;
        }
        room.round = 1;
        room.usedBlackCardIds.clear();
        const firstCard = getNextBlackCard(new Set());
        room.currentBlackCard = firstCard;
        room.usedBlackCardIds.add(firstCard.id);
        room.privateSubmissions.clear();
        room.shuffledCards = [];
        room.votes.clear();
        room.winningAuthorIds = [];
        room.phase = 'WRITING';

        this.broadcastLPRState(room);
        break;
      }
    }
  }

  // ==========================================
  // LA BOMBA ENGINE
  // ==========================================

  private startBombaMatch(room: BombaServerRoom) {
    room.phase = 'PLAYING';
    const startingPlayer = room.players[0];
    room.activePlayerIndex = 0;
    room.activePlayerId = startingPlayer ? startingPlayer.id : null;
    room.currentTurnId = `turn-1-0-${Date.now()}`;
    room.challengeId = `chal-1-0-${Date.now()}`;
    room.currentExplosionId = null;
    room.processedLifeEventIds = new Set<string>();
    room.processedSubmissionIds.clear();
    room.pendingSubmissions.clear();
    room.roundNumber = 1;
    room.roundMistakes = 0;
    room.speedMultiplier = 1.0;
    const initialDuration = getRandomBombDurationMs();
    room.bombDurationMs = initialDuration;
    room.bombRemainingMs = initialDuration;
    room.turnStartedAt = Date.now();
    room.lastUpdateTimestamp = Date.now();
    if (room.acceptedWordBannerTimeout) {
      clearTimeout(room.acceptedWordBannerTimeout);
      room.acceptedWordBannerTimeout = null;
    }
    room.acceptedWordBanner = null;
    room.usedWords = [];

    const initialSeq = getNextSequence({
      usedSequences: room.usedSequences,
      playerRecentSequences: startingPlayer ? room.playerRecentSequences[startingPlayer.id] || [] : [],
    });
    room.currentSequence = initialSeq;
    room.usedSequences.add(initialSeq.sequence);
    if (startingPlayer) {
      room.playerRecentSequences[startingPlayer.id] = [initialSeq.sequence];
    }

    this.runBombaTimer(room);
    this.broadcastBombaState(room);
  }

  private advanceBombaTurn(room: BombaServerRoom) {
    const total = room.players.length;
    let nextIdx = room.activePlayerIndex;

    for (let i = 1; i <= total; i++) {
      const candIdx = (room.activePlayerIndex + i) % total;
      const cand = room.players[candIdx];
      if (!cand.isEliminated && cand.isConnected) {
        nextIdx = candIdx;
        break;
      }
    }

    room.activePlayerIndex = nextIdx;
    const nextPlayer = room.players[nextIdx];
    room.activePlayerId = nextPlayer ? nextPlayer.id : null;
    room.currentTurnId = `turn-${room.roundNumber}-${nextIdx}-${Date.now()}`;
    room.challengeId = `chal-${room.roundNumber}-${nextIdx}-${Date.now()}`;
    room.currentExplosionId = null;

    // Clear typing buffer for all players upon turn advance
    for (const p of room.players) {
      p.currentTypingWord = '';
    }

    const nextSeq = getNextSequence({
      usedSequences: room.usedSequences,
      previousSequence: room.currentSequence.sequence,
      playerRecentSequences: nextPlayer ? room.playerRecentSequences[nextPlayer.id] || [] : [],
    });

    room.usedSequences.add(nextSeq.sequence);
    if (nextPlayer) {
      room.playerRecentSequences[nextPlayer.id] = [
        ...(room.playerRecentSequences[nextPlayer.id] || []).slice(-4),
        nextSeq.sequence,
      ];
    }
    room.currentSequence = nextSeq;
    room.turnStartedAt = Date.now();

    this.broadcastBombaState(room);
  }

  private runBombaTimer(room: BombaServerRoom) {
    if (room.timerInterval) clearInterval(room.timerInterval);

    room.lastUpdateTimestamp = Date.now();

    room.timerInterval = setInterval(() => {
      if (room.phase !== 'PLAYING') {
        if (room.timerInterval) clearInterval(room.timerInterval);
        return;
      }

      const now = Date.now();
      const elapsed = Math.max(0, now - room.lastUpdateTimestamp);
      room.lastUpdateTimestamp = now;

      const multiplier = room.speedMultiplier || 1.0;
      const consumed = elapsed * multiplier;

      room.bombRemainingMs = Math.max(0, room.bombRemainingMs - consumed);

      if (room.bombRemainingMs <= 0) {
        if (room.timerInterval) clearInterval(room.timerInterval);
        this.triggerBombaExplosion(room);
      }
    }, 50);
  }

  private triggerBombaExplosion(room: BombaServerRoom) {
    if (room.phase !== 'PLAYING') return;
    if (room.timerInterval) {
      clearInterval(room.timerInterval);
      room.timerInterval = null;
    }
    if (room.acceptedWordBannerTimeout) {
      clearTimeout(room.acceptedWordBannerTimeout);
      room.acceptedWordBannerTimeout = null;
    }
    room.acceptedWordBanner = null;

    // Strict playerId lookup for the exploding player
    const explodingPlayer =
      (room.activePlayerId ? room.players.find((p) => p.id === room.activePlayerId) : null) ||
      room.players[room.activePlayerIndex];
    if (!explodingPlayer) return;

    // Idempotent eventId uniquely identifying this explosion event by round and player ID
    const explosionEventId = `exp-r${room.roundNumber}-t${room.currentTurnId}-p${explodingPlayer.id}`;
    if (room.currentExplosionId === explosionEventId) return;
    room.currentExplosionId = explosionEventId;

    room.totalExplosions += 1;
    explodingPlayer.bombsReceived += 1;

    // Single authoritative life-loss invocation: EXACTLY ONE LIFE
    this.applyLifeLoss(room, explodingPlayer.id, 'EXPLOSION', explosionEventId);

    // Freeze and assign affectedPlayer with authoritative updated state
    room.affectedPlayer = { ...explodingPlayer };
    for (const p of room.players) {
      p.currentTypingWord = '';
    }
    room.phase = 'EXPLOSION';
    this.broadcastBombaState(room);

    // Auto-advance after 3.8s explosion animation
    if (room.explosionTimeout) clearTimeout(room.explosionTimeout);
    room.explosionTimeout = setTimeout(() => {
      this.startNextBombaRound(room);
    }, 3800);
  }

  private startNextBombaRound(room: BombaServerRoom) {
    const remainingAlive = room.players.filter((p) => !p.isEliminated);

    if (remainingAlive.length <= 1) {
      room.phase = 'GAME_OVER';
      room.winner = remainingAlive[0] || null;
      this.broadcastBombaState(room);
      return;
    }

    // Advance to next surviving player
    let nextIdx = room.activePlayerIndex;
    const total = room.players.length;
    for (let i = 1; i <= total; i++) {
      const candIdx = (room.activePlayerIndex + i) % total;
      if (!room.players[candIdx].isEliminated) {
        nextIdx = candIdx;
        break;
      }
    }
    room.activePlayerIndex = nextIdx;
    const nextPlayer = room.players[nextIdx];
    room.activePlayerId = nextPlayer ? nextPlayer.id : null;

    room.roundNumber += 1;
    room.currentTurnId = `turn-${room.roundNumber}-${nextIdx}-${Date.now()}`;
    room.challengeId = `chal-${room.roundNumber}-${nextIdx}-${Date.now()}`;
    room.currentExplosionId = null;
    room.processedSubmissionIds.clear();
    room.pendingSubmissions.clear();

    const nextSeq = getNextSequence({
      usedSequences: room.usedSequences,
      previousSequence: room.currentSequence.sequence,
      playerRecentSequences: nextPlayer ? room.playerRecentSequences[nextPlayer.id] || [] : [],
    });
    room.usedSequences.add(nextSeq.sequence);
    room.currentSequence = nextSeq;

    room.usedWords = [];
    room.roundMistakes = 0;
    room.speedMultiplier = 1.0;

    // Reset round mistakes and multiplier for all alive players
    for (const p of room.players) {
      p.roundMistakes = 0;
      p.multiplier = 1.0;
      p.lastValidWord = null;
      p.currentTypingWord = '';
    }

    // Brand new bomb duration
    const newDuration = getRandomBombDurationMs();
    room.bombDurationMs = newDuration;
    room.bombRemainingMs = newDuration;
    if (room.acceptedWordBannerTimeout) {
      clearTimeout(room.acceptedWordBannerTimeout);
      room.acceptedWordBannerTimeout = null;
    }
    room.acceptedWordBanner = null;
    room.affectedPlayer = null;
    room.phase = 'ROUND_INTRO';
    this.broadcastBombaState(room);

    // Transition from ROUND_INTRO to PLAYING after 2.5s
    setTimeout(() => {
      const fresh = this.bombaRooms.get(room.code);
      if (fresh && fresh.phase === 'ROUND_INTRO') {
        fresh.phase = 'PLAYING';
        fresh.turnStartedAt = Date.now();
        fresh.lastUpdateTimestamp = Date.now();
        this.runBombaTimer(fresh);
        this.broadcastBombaState(fresh);
      }
    }, 2500);
  }

  // ==========================================
  // LA PEOR RESPUESTA ENGINE
  // ==========================================

  private startLPRMatch(room: LPRServerRoom) {
    room.round = 1;
    room.privateSubmissions.clear();
    room.shuffledCards = [];
    room.votes.clear();
    room.winningAuthorIds = [];
    for (const p of room.players) {
      p.score = 0;
      p.hasSubmittedAnswer = false;
      p.hasVoted = false;
    }
    room.phase = 'WRITING';
    this.broadcastLPRState(room);
  }
}
