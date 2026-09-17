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
  roundNumber: number;
  bombDurationMs: number;
  bombRemainingMs: number;
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
        roundNumber: 1,
        bombDurationMs: initialDuration,
        bombRemainingMs: initialDuration,
        turnStartedAt: Date.now(),
        lastUpdateTimestamp: Date.now(),
        timerInterval: null,
        disconnectGraceTimeout: null,
        explosionTimeout: null,
        usedWords: [],
        acceptedWordBanner: null,
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
        this.handleDisconnect(ws);
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

    const activePlayer = room.players[room.activePlayerIndex] || null;

    const state: BombaRoomState = {
      code: room.code,
      gameType: 'la-bomba',
      hostId: room.hostId,
      phase: room.phase,
      config: room.config,
      players: room.players,
      currentSequence: room.currentSequence,
      activePlayerIndex: room.activePlayerIndex,
      activePlayerId: activePlayer ? activePlayer.id : null,
      roundNumber: room.roundNumber,
      bombRemainingMs: Math.max(0, Math.round(room.bombRemainingMs)),
      bombDurationMs: room.bombDurationMs,
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
        };

        this.send(ws, { type: 'room_state', state });
      }
    }
  }

  private handleDisconnect(ws: WebSocket) {
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

      // In LOBBY phase, remove the leaving player immediately so no ghost players remain
      if (room.phase === 'LOBBY') {
        room.players = room.players.filter((p) => p.id !== playerId);
      }

      // If room is completely empty, clean it up immediately
      if (room.players.length === 0 || !room.players.some((p) => p.isConnected)) {
        if (room.phase === 'LOBBY' || room.players.length === 0) {
          if (room.timerInterval) clearInterval(room.timerInterval);
          this.bombaRooms.delete(roomId);
          roomRegistry.unregister(roomId);
          return;
        }

        // Schedule cleanup after 5 minutes for active games
        setTimeout(() => {
          const fresh = this.bombaRooms.get(roomId);
          if (fresh && !fresh.players.some((p) => p.isConnected)) {
            if (fresh.timerInterval) clearInterval(fresh.timerInterval);
            this.bombaRooms.delete(roomId);
            roomRegistry.unregister(roomId);
          }
        }, 5 * 60 * 1000);
      } else {
        // Migrate host if host disconnected
        if (room.hostId === playerId) {
          const nextHost = room.players.find((p) => p.isConnected) || room.players[0];
          if (nextHost) {
            room.hostId = nextHost.id;
            nextHost.isHost = true;
            this.broadcastToBomba(room, {
              type: 'notification',
              message: `${nextHost.name} es ahora el anfitrión de la sala`,
              noticeType: 'info',
            });
          }
        }

        // If disconnected player was active player in PLAYING phase, set a grace period
        if (room.phase === 'PLAYING') {
          const activePlayer = room.players[room.activePlayerIndex];
          if (activePlayer && activePlayer.id === playerId) {
            if (room.disconnectGraceTimeout) clearTimeout(room.disconnectGraceTimeout);
            room.disconnectGraceTimeout = setTimeout(() => {
              const currentRoom = this.bombaRooms.get(roomId);
              if (!currentRoom || currentRoom.phase !== 'PLAYING') return;
              const curActive = currentRoom.players[currentRoom.activePlayerIndex];
              if (curActive && !curActive.isConnected) {
                // Advance turn to next surviving connected player
                this.advanceBombaTurn(currentRoom);
              }
            }, 12000);
          }
        }

        this.broadcastBombaState(room);
      }
    } else if (gameType === 'la-peor-respuesta') {
      const room = this.lprRooms.get(roomId);
      if (!room) return;

      const player = room.players.find((p) => p.id === playerId);
      if (player) {
        player.isConnected = false;
      }

      // In LOBBY phase, remove the leaving player immediately so no ghost players remain
      if (room.phase === 'LOBBY') {
        room.players = room.players.filter((p) => p.id !== playerId);
      }

      if (room.players.length === 0 || !room.players.some((p) => p.isConnected)) {
        if (room.phase === 'LOBBY' || room.players.length === 0) {
          this.lprRooms.delete(roomId);
          roomRegistry.unregister(roomId);
          return;
        }

        setTimeout(() => {
          const fresh = this.lprRooms.get(roomId);
          if (fresh && !fresh.players.some((p) => p.isConnected)) {
            this.lprRooms.delete(roomId);
            roomRegistry.unregister(roomId);
          }
        }, 5 * 60 * 1000);
      } else {
        if (room.hostId === playerId) {
          const nextHost = room.players.find((p) => p.isConnected) || room.players[0];
          if (nextHost) {
            room.hostId = nextHost.id;
            nextHost.isHost = true;
            this.broadcastToLPR(room, {
              type: 'notification',
              message: `${nextHost.name} es ahora el anfitrión de la sala`,
              noticeType: 'info',
            });
          }
        }
        this.broadcastLPRState(room);
      }
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
        this.handleDisconnect(ws);
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

        const activePlayer = room.players[room.activePlayerIndex];
        if (activePlayer && activePlayer.id === conn.playerId) {
          activePlayer.currentTypingWord = message.text || '';
          this.broadcastToBomba(room, {
            type: 'bomba_typing_broadcast',
            playerId: activePlayer.id,
            text: activePlayer.currentTypingWord,
          });
        }
        break;
      }

      case 'bomba_submit_word': {
        const conn = this.clients.get(ws);
        if (!conn || conn.gameType !== 'la-bomba') return;
        const room = this.bombaRooms.get(conn.roomId);
        if (!room || room.phase !== 'PLAYING') return;

        const activePlayer = room.players[room.activePlayerIndex];
        if (!activePlayer || activePlayer.id !== conn.playerId) return;

        const word = message.word || '';
        const validation = await validateSpanishWordServer(
          word,
          room.currentSequence.sequence,
          room.usedWords.map((u) => u.word)
        );

        if (room.phase !== 'PLAYING') return;

        if (!validation.valid) {
          activePlayer.mistakes += 1;
          activePlayer.multiplier = Math.pow(1.5, activePlayer.mistakes);
          room.totalMistakes += 1;

          this.broadcastToBomba(room, {
            type: 'bomba_feedback',
            feedbackType: 'error',
            message: validation.reason || 'Palabra no válida',
          });
          this.broadcastBombaState(room);
          return;
        }

        // VALID WORD!
        const acceptedWord = validation.canonicalWord || word.toLowerCase();
        const answerTimeSeconds = Math.max(0.3, (Date.now() - room.turnStartedAt) / 1000);

        room.totalValidWords += 1;
        activePlayer.validWordsCount += 1;
        activePlayer.lastValidWord = acceptedWord;
        activePlayer.currentTypingWord = '';

        const currentFastest = activePlayer.fastestAnswerTimeMs;
        const answerMs = Math.round(answerTimeSeconds * 1000);
        activePlayer.fastestAnswerTimeMs = currentFastest ? Math.min(currentFastest, answerMs) : answerMs;

        if (!room.fastestAnswer || answerTimeSeconds < room.fastestAnswer.timeSeconds) {
          room.fastestAnswer = {
            playerName: activePlayer.name,
            playerColor: activePlayer.color,
            timeSeconds: answerTimeSeconds,
            word: acceptedWord,
          };
        }

        // Reto del Abecedario strictly for the active player!
        const alphabetUpdate = calculateAlphabetProgress(activePlayer.alphabetProgress || [], acceptedWord);
        let gainedLife = false;

        if (alphabetUpdate.isCompleted) {
          if (activePlayer.lives < room.config.startingLives) {
            activePlayer.lives += 1;
            gainedLife = true;
          }
          activePlayer.alphabetProgress = []; // Reset this player only
          this.broadcastToBomba(room, {
            type: 'bomba_alphabet_reward',
            playerId: activePlayer.id,
            playerName: activePlayer.name,
            gainedLife,
          });
        } else {
          activePlayer.alphabetProgress = alphabetUpdate.updatedProgress;
        }

        // Add to used words
        const newUsedWord: UsedWord = {
          word,
          canonicalWord: acceptedWord,
          playerId: activePlayer.id,
          playerName: activePlayer.name,
          playerColor: activePlayer.color,
          timestamp: Date.now(),
        };
        room.usedWords = [newUsedWord, ...room.usedWords];

        room.acceptedWordBanner = {
          word: acceptedWord.toUpperCase(),
          player: activePlayer.name,
          bonusLetters: alphabetUpdate.newLetters.length,
        };

        // Advance turn clockwise
        this.advanceBombaTurn(room);
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
          p.multiplier = 1.0;
          p.isEliminated = false;
          p.bombsReceived = 0;
          p.validWordsCount = 0;
          p.fastestAnswerTimeMs = null;
          p.lastValidWord = null;
          p.currentTypingWord = '';
          p.alphabetProgress = [];
        }

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

        const text = (message.text || '').trim();
        if (!text) return;

        room.privateSubmissions.set(conn.playerId, text);
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
    room.activePlayerIndex = 0;
    room.roundNumber = 1;
    const initialDuration = getRandomBombDurationMs();
    room.bombDurationMs = initialDuration;
    room.bombRemainingMs = initialDuration;
    room.turnStartedAt = Date.now();
    room.lastUpdateTimestamp = Date.now();
    room.acceptedWordBanner = null;
    room.usedWords = [];

    const startingPlayer = room.players[0];
    const initialSeq = getNextSequence({
      usedSequences: room.usedSequences,
      playerRecentSequences: room.playerRecentSequences[startingPlayer.id] || [],
    });
    room.currentSequence = initialSeq;
    room.usedSequences.add(initialSeq.sequence);
    room.playerRecentSequences[startingPlayer.id] = [initialSeq.sequence];

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

    const nextSeq = getNextSequence({
      usedSequences: room.usedSequences,
      previousSequence: room.currentSequence.sequence,
      playerRecentSequences: room.playerRecentSequences[nextPlayer.id] || [],
    });

    room.usedSequences.add(nextSeq.sequence);
    room.playerRecentSequences[nextPlayer.id] = [
      ...(room.playerRecentSequences[nextPlayer.id] || []).slice(-4),
      nextSeq.sequence,
    ];
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

      const activePlayer = room.players[room.activePlayerIndex];
      const multiplier = activePlayer ? activePlayer.multiplier : 1.0;
      const consumed = elapsed * multiplier;

      room.bombRemainingMs = Math.max(0, room.bombRemainingMs - consumed);

      if (room.bombRemainingMs <= 0) {
        if (room.timerInterval) clearInterval(room.timerInterval);
        this.triggerBombaExplosion(room);
      }
    }, 50);
  }

  private triggerBombaExplosion(room: BombaServerRoom) {
    const explodingPlayer = room.players[room.activePlayerIndex];
    if (!explodingPlayer) return;

    room.totalExplosions += 1;
    explodingPlayer.lives = Math.max(0, explodingPlayer.lives - 1);
    explodingPlayer.bombsReceived += 1;
    if (explodingPlayer.lives === 0) {
      explodingPlayer.isEliminated = true;
    }

    room.affectedPlayer = { ...explodingPlayer };
    explodingPlayer.currentTypingWord = '';
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

    const nextSeq = getNextSequence({
      usedSequences: room.usedSequences,
      previousSequence: room.currentSequence.sequence,
      playerRecentSequences: room.playerRecentSequences[nextPlayer.id] || [],
    });
    room.usedSequences.add(nextSeq.sequence);
    room.currentSequence = nextSeq;

    room.roundNumber += 1;
    room.usedWords = [];

    // Reset round mistakes and multiplier for all alive players
    for (const p of room.players) {
      p.mistakes = 0;
      p.multiplier = 1.0;
      p.lastValidWord = null;
      p.currentTypingWord = '';
    }

    // Brand new bomb duration
    const newDuration = getRandomBombDurationMs();
    room.bombDurationMs = newDuration;
    room.bombRemainingMs = newDuration;
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
