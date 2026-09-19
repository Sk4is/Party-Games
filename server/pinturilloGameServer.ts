import { WebSocketServer, WebSocket } from 'ws';
import type { Server as HttpServer } from 'http';
import {
  PinturilloRoomState,
  PinturilloPlayer,
  PinturilloConfig,
  DrawStroke,
  ChatMessage,
  ClientMessage,
  ServerMessage,
  NormalizedPoint,
} from '../src/types/pinturillo';
import { PINTURILLO_WORDS, getRandomWordOptions, DrawableWord } from '../src/data/pinturilloWords';
import { calculateWordLength, buildStructuredHint, buildWordHintString } from '../src/utils/pinturilloHints';
import { roomRegistry } from './roomRegistry';
import { matchDepartureHandler } from './matchDepartureHandler';

interface ClientConnection {
  ws: WebSocket;
  playerId: string;
  roomId: string;
}

interface ServerRoom {
  code: string;
  roundId?: string;
  gameType?: 'pinturillo';
  hostId: string;
  phase: PinturilloRoomState['phase'];
  config: PinturilloConfig;
  players: PinturilloPlayer[];
  currentDrawerIndex: number;
  currentTurn: number;
  totalTurns: number;
  currentVuelta: number;
  secretWord: string;
  wordCategory: string;
  wordOptions: DrawableWord[];
  revealedIndices: Set<number>;
  wordHint: string;
  remainingTime: number;
  totalRoundTime: number;
  selectionRemainingSeconds: number;
  selectionEndsAt?: number;
  resultsEndsAt?: number;
  drawingStrokes: DrawStroke[];
  undoStack: DrawStroke[];
  chatMessages: ChatMessage[];
  usedWords: Set<string>;
  recentlyOfferedWords: Set<string>;
  countdownEndsAt?: number;
  roundStartedAt?: number;
  roundEndsAt?: number;
  timerInterval: NodeJS.Timeout | null;
  selectionInterval: NodeJS.Timeout | null;
  countdownInterval: NodeJS.Timeout | null;
  countdownTimeouts: NodeJS.Timeout[];
  countdownFailSafeTimeout: NodeJS.Timeout | null;
  intermissionTimeout: NodeJS.Timeout | null;
  lastRoundResults?: PinturilloRoomState['lastRoundResults'];
  abortReason?: string;
  endMessage?: string;
}

// Normalize strings for answer comparison (removes accents, punctuation, casing)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

// Levenshtein distance for "casi" (near-miss) detection
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// Generate a random 5-character room code avoiding confusing characters
function generateRoomCode(existingCodes: Set<string>): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  do {
    code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (existingCodes.has(code) || roomRegistry.has(code));
  return code;
}

export class PinturilloServer {
  public wss: WebSocketServer;
  private rooms = new Map<string, ServerRoom>();
  private clients = new Map<WebSocket, ClientConnection>();

  constructor(server?: HttpServer) {
    if (server) {
      this.wss = new WebSocketServer({ server, path: '/ws/pinturillo' });
    } else {
      this.wss = new WebSocketServer({ noServer: true });
    }
    this.init();
    console.log('[Pinturillo] Servidor WebSocket inicializado en /ws/pinturillo');
  }

  public getRoomInfo(code: string) {
    const clean = code.toUpperCase().trim();
    const room = this.rooms.get(clean);
    if (room) {
      return {
        roomId: room.code,
        roomCode: room.code,
        code: room.code,
        gameType: 'pinturillo' as const,
        hostId: room.hostId,
        phase: room.phase,
        playersCount: room.players.filter(p => p.isConnected).length,
        totalPlayers: room.players.length,
        maxPlayers: 10,
        isFull: room.players.length >= 10,
        players: room.players,
        createdAt: Date.now(),
      };
    }
    return null;
  }

  public createRoomDirect(player: PinturilloPlayer, config?: any) {
    const roomCode = roomRegistry.generateCode();
    const room: ServerRoom = {
      code: roomCode,
      gameType: 'pinturillo',
      hostId: player.id,
      phase: 'LOBBY',
      config: {
        roundTimeSeconds: (config as any)?.roundTimeSeconds || 90,
        totalVueltas: (config as any)?.totalVueltas || 2,
        hintsEnabled: (config as any)?.hintsEnabled ?? true,
        categories: [
          'animales',
          'comida',
          'objetos',
          'lugares',
          'cine_tv',
          'videojuegos',
          'deportes',
          'profesiones',
          'naturaleza',
          'acciones',
        ],
      },
      players: [{ ...player, isHost: true, isConnected: true }],
      currentDrawerIndex: 0,
      currentTurn: 0,
      totalTurns: 0,
      currentVuelta: 1,
      secretWord: '',
      wordCategory: '',
      wordOptions: [],
      revealedIndices: new Set(),
      wordHint: '',
      remainingTime: 90,
      totalRoundTime: 90,
      selectionRemainingSeconds: 10,
      drawingStrokes: [],
      undoStack: [],
      chatMessages: [
        {
          id: 'sys-welcome',
          playerName: 'Sistema',
          text: `¡Sala creada! Código de acceso: ${roomCode}`,
          isSystem: true,
          timestamp: Date.now(),
        },
      ],
      usedWords: new Set(),
      recentlyOfferedWords: new Set(),
      timerInterval: null,
      selectionInterval: null,
      countdownInterval: null,
      countdownTimeouts: [],
      countdownFailSafeTimeout: null,
      intermissionTimeout: null,
    };

    this.rooms.set(roomCode, room);
    roomRegistry.register(roomCode, 'pinturillo', 'pinturillo');
    return {
      roomId: roomCode,
      roomCode,
      code: roomCode,
      gameType: 'pinturillo' as const,
      hostId: player.id,
      phase: 'LOBBY' as const,
      createdAt: Date.now(),
      settings: room.config,
      players: room.players,
      playersCount: 1,
      maxPlayers: 10,
      isFull: false,
    };
  }

  private init() {
    this.wss.on('connection', (ws: WebSocket) => {
      ws.on('message', (data: string) => {
        try {
          const message: ClientMessage = JSON.parse(data.toString());
          this.handleClientMessage(ws, message);
        } catch (err) {
          console.error('[Pinturillo] Error procesando mensaje WS:', err);
        }
      });

      ws.on('close', () => {
        this.handleSocketClose(ws);
      });

      ws.on('error', (err) => {
        console.error('[Pinturillo] Error en socket:', err);
      });
    });

    // Authoritative Watchdog: ensures no room can ever get frozen or stuck in any phase
    setInterval(() => {
      const now = Date.now();
      for (const room of this.rooms.values()) {
        try {
          if (room.phase === 'DRAWING' && room.roundEndsAt && now > room.roundEndsAt + 2000) {
            console.warn(`[Pinturillo Watchdog] Room ${room.code} round ${room.roundId} exceeded roundEndsAt by >2s, advancing.`);
            this.endDrawingRound(room, room.roundId);
          } else if (room.phase === 'WORD_SELECTION' && room.selectionEndsAt && now > room.selectionEndsAt + 2000) {
            console.warn(`[Pinturillo Watchdog] Room ${room.code} word selection expired, forcing default word.`);
            const defaultChoice = room.wordOptions[0] || { word: 'casa', category: 'objeto', difficulty: 'FACIL' };
            this.selectWordAndStartCountdown(room, defaultChoice.word, defaultChoice.category);
          } else if (room.phase === 'ROUND_RESULTS' && room.resultsEndsAt && now > room.resultsEndsAt + 2000) {
            console.warn(`[Pinturillo Watchdog] Room ${room.code} round results expired, advancing to next turn.`);
            this.advanceToNextTurn(room);
          }
        } catch (e) {
          console.error(`[Pinturillo Watchdog] Error checking room ${room.code}:`, e);
        }
      }
    }, 1000);
  }

  private handleClientMessage(ws: WebSocket, message: ClientMessage) {
    switch (message.type) {
      case 'ping':
        this.send(ws, { type: 'pong' });
        break;

      case 'create_room': {
        const roomCode = generateRoomCode(new Set(this.rooms.keys()));
        const player: PinturilloPlayer = {
          id: message.player.id,
          name: message.player.name.trim() || 'Jugador',
          avatar: message.player.avatar || '🐯',
          color: message.player.color || '#f59e0b',
          score: 0,
          isHost: true,
          isConnected: true,
          hasGuessed: false,
          roundScore: 0,
        };

        const room: ServerRoom = {
          code: roomCode,
          hostId: player.id,
          phase: 'LOBBY',
          config: {
            roundTimeSeconds: 90,
            totalVueltas: 2,
            hintsEnabled: true,
            categories: [
              'animales',
              'comida',
              'objetos',
              'lugares',
              'cine_tv',
              'videojuegos',
              'deportes',
              'profesiones',
              'naturaleza',
              'acciones',
            ],
          },
          players: [player],
          currentDrawerIndex: 0,
          currentTurn: 0,
          totalTurns: 0,
          currentVuelta: 1,
          secretWord: '',
          wordCategory: '',
          wordOptions: [],
          revealedIndices: new Set(),
          wordHint: '',
          remainingTime: 90,
          totalRoundTime: 90,
          selectionRemainingSeconds: 10,
          drawingStrokes: [],
          undoStack: [],
          chatMessages: [
            {
              id: 'sys-welcome',
              playerName: 'Sistema',
              text: `¡Sala creada! Código de acceso: ${roomCode}`,
              isSystem: true,
              timestamp: Date.now(),
            },
          ],
          usedWords: new Set(),
          recentlyOfferedWords: new Set(),
          timerInterval: null,
          selectionInterval: null,
          countdownInterval: null,
          countdownTimeouts: [],
          countdownFailSafeTimeout: null,
          intermissionTimeout: null,
        };

        this.rooms.set(roomCode, room);
        roomRegistry.register(roomCode, 'pinturillo', 'pinturillo');
        this.clients.set(ws, { ws, playerId: player.id, roomId: roomCode });
        this.broadcastRoomState(room);
        break;
      }

      case 'join_room': {
        const code = message.code.trim().toUpperCase();
        const room = this.rooms.get(code);

        if (!room) {
          const roomMeta = roomRegistry.get(code);
          if (roomMeta && roomMeta.gameType !== 'pinturillo') {
            const gameName = roomMeta.gameType === 'la-bomba' ? 'La Bomba' : 'La Peor Respuesta';
            this.send(ws, {
              type: 'error',
              message: `Este código de sala (${code}) pertenece a ${gameName}.`,
            });
            return;
          }
          this.send(ws, { type: 'error', message: `No se ha encontrado ninguna sala con el código «${code}». Comprueba el código e inténtalo de nuevo.` });
          return;
        }

        // Check if player is reconnecting
        const existingPlayer = room.players.find(p => p.id === message.player.id);
        if (existingPlayer) {
          matchDepartureHandler.cancelGracePeriod(code, existingPlayer.id);
          existingPlayer.isConnected = true;
          existingPlayer.name = message.player.name.trim() || existingPlayer.name;
          existingPlayer.avatar = message.player.avatar || existingPlayer.avatar;
          existingPlayer.color = message.player.color || existingPlayer.color;
          this.clients.set(ws, { ws, playerId: existingPlayer.id, roomId: code });
          this.broadcastRoomState(room);
          return;
        }

        // Check player count
        if (room.players.length >= 10) {
          this.send(ws, { type: 'error', message: 'La sala está completa (máximo 10 jugadores).' });
          return;
        }

        const newPlayer: PinturilloPlayer = {
          id: message.player.id,
          name: message.player.name.trim() || `Jugador ${room.players.length + 1}`,
          avatar: message.player.avatar || '🦊',
          color: message.player.color || '#3b82f6',
          score: 0,
          isHost: room.players.length === 0,
          isConnected: true,
          hasGuessed: false,
          roundScore: 0,
        };

        room.players.push(newPlayer);
        this.clients.set(ws, { ws, playerId: newPlayer.id, roomId: code });

        room.chatMessages.push({
          id: `sys-join-${Date.now()}`,
          playerName: 'Sistema',
          text: `👋 ${newPlayer.name} se ha unido a la sala`,
          isSystem: true,
          timestamp: Date.now(),
        });

        this.broadcastRoomState(room);
        break;
      }

      case 'update_config': {
        const client = this.clients.get(ws);
        if (!client) return;
        const room = this.rooms.get(client.roomId);
        if (!room || room.hostId !== client.playerId || room.phase !== 'LOBBY') return;

        if (message.config.roundTimeSeconds) {
          room.config.roundTimeSeconds = message.config.roundTimeSeconds;
          room.remainingTime = message.config.roundTimeSeconds;
          room.totalRoundTime = message.config.roundTimeSeconds;
        }
        if (message.config.totalVueltas) {
          room.config.totalVueltas = message.config.totalVueltas;
        }
        if (typeof message.config.hintsEnabled === 'boolean') {
          room.config.hintsEnabled = message.config.hintsEnabled;
        }
        if (Array.isArray(message.config.categories) && message.config.categories.length > 0) {
          room.config.categories = message.config.categories;
        }

        this.broadcastRoomState(room);
        break;
      }

      case 'start_game': {
        const client = this.clients.get(ws);
        if (!client) return;
        const room = this.rooms.get(client.roomId);
        if (!room || room.hostId !== client.playerId) return;

        if (room.players.length < 2) {
          this.send(ws, { type: 'error', message: 'Se necesitan al menos 2 jugadores para comenzar.' });
          return;
        }

        // Reset game stats and scores
        room.players.forEach(p => {
          p.score = 0;
          p.roundScore = 0;
          p.hasGuessed = false;
        });

        // Setup turns
        room.totalTurns = room.players.length * room.config.totalVueltas;
        room.currentTurn = 1;
        room.currentVuelta = 1;
        room.currentDrawerIndex = 0;
        room.usedWords.clear();

        this.startWordSelectionPhase(room);
        break;
      }

      case 'choose_word': {
        const client = this.clients.get(ws);
        if (!client) return;
        const room = this.rooms.get(client.roomId);
        if (!room || room.phase !== 'WORD_SELECTION') return;

        const currentDrawer = room.players[room.currentDrawerIndex];
        if (!currentDrawer || currentDrawer.id !== client.playerId) return;

        const selectedOption = room.wordOptions.find(w => w.word.toLowerCase() === message.word.toLowerCase());
        const word = selectedOption ? selectedOption.word : message.word;

        this.selectWordAndStartCountdown(room, word, selectedOption?.category || 'objeto');
        break;
      }

      case 'stroke_start': {
        const client = this.clients.get(ws);
        if (!client) return;
        const room = this.rooms.get(client.roomId);
        if (!room || room.phase !== 'DRAWING') return;

        const currentDrawer = room.players[room.currentDrawerIndex];
        if (!currentDrawer || currentDrawer.id !== client.playerId) return;

        message.stroke.roundId = room.roundId;
        room.drawingStrokes.push(message.stroke);
        room.undoStack = []; // Clear redo stack on new stroke

        // Broadcast immediately to all other players in room
        this.broadcastToRoomExcept(room, ws, {
          type: 'stroke_start',
          stroke: message.stroke,
          roundId: room.roundId,
        });
        break;
      }

      case 'stroke_chunk': {
        const client = this.clients.get(ws);
        if (!client) return;
        const room = this.rooms.get(client.roomId);
        if (!room || room.phase !== 'DRAWING') return;

        const currentDrawer = room.players[room.currentDrawerIndex];
        if (!currentDrawer || currentDrawer.id !== client.playerId) return;

        const targetStroke = room.drawingStrokes.find(s => s.id === message.strokeId);
        if (targetStroke) {
          targetStroke.points.push(...message.points);
        }

        this.broadcastToRoomExcept(room, ws, {
          type: 'stroke_chunk',
          strokeId: message.strokeId,
          points: message.points,
          roundId: room.roundId,
        });
        break;
      }

      case 'stroke_end': {
        const client = this.clients.get(ws);
        if (!client) return;
        const room = this.rooms.get(client.roomId);
        if (!room || room.phase !== 'DRAWING') return;

        const currentDrawer = room.players[room.currentDrawerIndex];
        if (!currentDrawer || currentDrawer.id !== client.playerId) return;

        this.broadcastToRoomExcept(room, ws, {
          type: 'stroke_end',
          strokeId: message.strokeId,
          roundId: room.roundId,
        });
        break;
      }

      case 'flood_fill': {
        const client = this.clients.get(ws);
        if (!client) return;
        const room = this.rooms.get(client.roomId);
        if (!room || room.phase !== 'DRAWING') return;

        const currentDrawer = room.players[room.currentDrawerIndex];
        if (!currentDrawer || currentDrawer.id !== client.playerId) return;

        const fillStroke: DrawStroke = {
          id: `fill-${Date.now()}`,
          roundId: room.roundId,
          tool: 'fill',
          color: message.color,
          size: 0,
          points: [message.point],
          isFill: true,
          fillPoint: message.point,
        };

        room.drawingStrokes.push(fillStroke);
        room.undoStack = [];

        this.broadcastToRoomExcept(room, ws, {
          type: 'flood_fill',
          stroke: fillStroke,
          roundId: room.roundId,
        });
        break;
      }

      case 'undo': {
        const client = this.clients.get(ws);
        if (!client) return;
        const room = this.rooms.get(client.roomId);
        if (!room || room.phase !== 'DRAWING') return;

        const currentDrawer = room.players[room.currentDrawerIndex];
        if (!currentDrawer || currentDrawer.id !== client.playerId) return;

        if (room.drawingStrokes.length > 0) {
          const popped = room.drawingStrokes.pop();
          if (popped) {
            room.undoStack.push(popped);
          }
          this.broadcastToRoom(room, { type: 'undo', roundId: room.roundId });
        }
        break;
      }

      case 'redo': {
        const client = this.clients.get(ws);
        if (!client) return;
        const room = this.rooms.get(client.roomId);
        if (!room || room.phase !== 'DRAWING') return;

        const currentDrawer = room.players[room.currentDrawerIndex];
        if (!currentDrawer || currentDrawer.id !== client.playerId) return;

        if (room.undoStack.length > 0) {
          const restored = room.undoStack.pop();
          if (restored) {
            room.drawingStrokes.push(restored);
            this.broadcastToRoom(room, {
              type: restored.isFill ? 'flood_fill' : 'stroke_start',
              stroke: restored,
              roundId: room.roundId,
            });
          }
        }
        break;
      }

      case 'clear_canvas': {
        const client = this.clients.get(ws);
        if (!client) return;
        const room = this.rooms.get(client.roomId);
        if (!room || room.phase !== 'DRAWING') return;

        const currentDrawer = room.players[room.currentDrawerIndex];
        if (!currentDrawer || currentDrawer.id !== client.playerId) return;

        room.drawingStrokes = [];
        room.undoStack = [];
        this.broadcastToRoom(room, { type: 'clear_canvas', roundId: room.roundId });
        break;
      }

      case 'send_chat': {
        const client = this.clients.get(ws);
        if (!client) return;
        const room = this.rooms.get(client.roomId);
        if (!room) return;

        const sender = room.players.find(p => p.id === client.playerId);
        if (!sender) return;

        const rawText = message.text.trim();
        if (!rawText) return;

        const currentDrawer = room.players[room.currentDrawerIndex];
        const isDrawer = currentDrawer && currentDrawer.id === sender.id;

        // If in DRAWING phase and player is NOT drawer and hasn't guessed yet, check answer!
        if (room.phase === 'DRAWING' && !isDrawer && !sender.hasGuessed) {
          const normGuess = normalizeText(rawText);
          const normSecret = normalizeText(room.secretWord);

          // EXACT MATCH
          if (normGuess === normSecret) {
            sender.hasGuessed = true;

            // Calculate points: Speed bonus + rank bonus
            const previousGuessersCount = room.players.filter(p => p.hasGuessed && p.id !== sender.id).length;
            const rank = previousGuessersCount + 1;
            sender.guessOrder = rank;

            const baseBonuses: { [key: number]: number } = {
              1: 1000,
              2: 750,
              3: 550,
              4: 400,
            };
            const basePoints = baseBonuses[rank] || 300;
            const timeBonus = Math.round(500 * (room.remainingTime / room.totalRoundTime));
            const totalPoints = basePoints + timeBonus;

            sender.score += totalPoints;
            sender.roundScore = totalPoints;

            // Award drawer points (+200 per guesser)
            if (currentDrawer) {
              currentDrawer.score += 200;
              currentDrawer.roundScore = (currentDrawer.roundScore || 0) + 200;
            }

            // DO NOT post the actual word to public chat!
            const successChat: ChatMessage = {
              id: `guess-${Date.now()}-${sender.id}`,
              playerId: sender.id,
              playerName: sender.name,
              playerAvatar: sender.avatar,
              playerColor: sender.color,
              text: `🎉 ¡Ha acertado la palabra! (+${totalPoints.toLocaleString('es-ES')} pts)`,
              isCorrectGuess: true,
              pointsEarned: totalPoints,
              timestamp: Date.now(),
            };
            room.chatMessages.push(successChat);

            // Send private success event to the guesser
            this.send(ws, {
              type: 'correct_guess',
              playerId: sender.id,
              playerName: sender.name,
              points: totalPoints,
              totalScore: sender.score,
            });

            // Broadcast chat to all
            this.broadcastToRoom(room, {
              type: 'chat_message',
              message: successChat,
            });

            // Update room state for scores & check if all eligible have guessed
            const eligibleGuessers = room.players.filter(p => p.id !== currentDrawer?.id && p.isConnected);
            const allGuessed = eligibleGuessers.length > 0 && eligibleGuessers.every(p => p.hasGuessed);

            if (allGuessed) {
              // Bonus for drawer: everyone understood!
              if (currentDrawer) {
                currentDrawer.score += 300;
                currentDrawer.roundScore = (currentDrawer.roundScore || 0) + 300;
              }

              room.chatMessages.push({
                id: `sys-all-guessed-${Date.now()}`,
                playerName: 'Sistema',
                text: '🎉 ¡Todos los jugadores han acertado! Fin de la ronda.',
                isSystem: true,
                timestamp: Date.now(),
              });

              // End round immediately
              this.endDrawingRound(room);
            } else {
              this.broadcastRoomState(room);
            }
            return;
          }

          // NEAR MISS CHECK (Levenshtein distance = 1 or very close)
          const dist = levenshteinDistance(normGuess, normSecret);
          if (dist === 1 && normSecret.length >= 4) {
            // Send private notification to this guesser only!
            this.send(ws, { type: 'near_miss', playerId: sender.id });
          }
        }

        // Normal chat message
        const chatItem: ChatMessage = {
          id: `chat-${Date.now()}-${sender.id}`,
          playerId: sender.id,
          playerName: sender.name,
          playerAvatar: sender.avatar,
          playerColor: sender.color,
          text: rawText,
          timestamp: Date.now(),
        };

        room.chatMessages.push(chatItem);
        if (room.chatMessages.length > 100) {
          room.chatMessages.shift();
        }

        this.broadcastToRoom(room, {
          type: 'chat_message',
          message: chatItem,
        });
        break;
      }

      case 'restart_game': {
        const client = this.clients.get(ws);
        if (!client) return;
        const room = this.rooms.get(client.roomId);
        if (!room || room.hostId !== client.playerId) return;

        this.clearAllTimers(room);
        room.phase = 'LOBBY';
        room.drawingStrokes = [];
        room.undoStack = [];
        room.players.forEach(p => {
          p.score = 0;
          p.roundScore = 0;
          p.hasGuessed = false;
        });

        this.broadcastRoomState(room);
        break;
      }

      case 'leave_room': {
        this.handleExplicitLeave(ws);
        break;
      }
    }
  }

  private startWordSelectionPhase(room: ServerRoom) {
    this.clearAllTimers(room);
    room.phase = 'WORD_SELECTION';
    room.drawingStrokes = [];
    room.undoStack = [];
    room.players.forEach(p => {
      p.hasGuessed = false;
      p.roundScore = 0;
      p.guessOrder = undefined;
    });

    const currentDrawer = room.players[room.currentDrawerIndex];
    if (!currentDrawer) return;

    // Pick 3 words from word bank according to room categories
    room.wordOptions = getRandomWordOptions(3, room.usedWords, room.config.categories, room.recentlyOfferedWords);
    for (const opt of room.wordOptions) {
      room.recentlyOfferedWords.add(opt.word.toLowerCase());
    }
    if (room.recentlyOfferedWords.size > 80) {
      room.recentlyOfferedWords.clear();
    }
    room.selectionRemainingSeconds = 10;
    room.selectionEndsAt = Date.now() + 10000;

    this.broadcastRoomState(room);

    // 10-second authoritative timer for drawer to select word
    room.selectionInterval = setInterval(() => {
      const now = Date.now();
      const remMs = (room.selectionEndsAt || now) - now;
      const remSec = Math.max(0, Math.ceil(remMs / 1000));
      room.selectionRemainingSeconds = remSec;

      if (remSec <= 0) {
        if (room.selectionInterval) clearInterval(room.selectionInterval);
        room.selectionInterval = null;
        // Auto-select first word if drawer didn't choose
        const defaultChoice = room.wordOptions[0] || { word: 'casa', category: 'objeto', difficulty: 'FACIL' };
        this.selectWordAndStartCountdown(room, defaultChoice.word, defaultChoice.category);
      } else {
        this.broadcastRoomState(room);
      }
    }, 500);
  }

  private selectWordAndStartCountdown(room: ServerRoom, word: string, category: string) {
    // Guard strictly: only start countdown if room is currently in WORD_SELECTION
    if (room.phase !== 'WORD_SELECTION') {
      console.log(`[Pinturillo Server] Room ${room.code} is not in WORD_SELECTION (current: ${room.phase}), ignoring call.`);
      return;
    }

    this.clearAllTimers(room);

    room.secretWord = word;
    room.wordCategory = category;
    room.usedWords.add(word.toLowerCase());
    room.revealedIndices.clear();

    // Generate initial underscore hint
    room.wordHint = this.buildWordHint(word, room.revealedIndices);

    // Enter COUNTDOWN phase
    room.phase = 'COUNTDOWN';
    const now = Date.now();
    // 3 seconds numbers (3, 2, 1) + 500ms for "¡A DIBUJAR!"
    room.countdownEndsAt = now + 3500;

    // Broadcast room state so clients know phase is COUNTDOWN and active drawer receives secretWord
    this.broadcastRoomState(room);

    // T = 0ms: Initial tick 3
    console.log(`[Pinturillo Server] Room ${room.code} COUNTDOWN -> 3`);
    this.broadcastToRoom(room, { type: 'countdown_tick', count: 3, text: '3' });

    // T = 1000ms: Tick 2
    const t2 = setTimeout(() => {
      if (room.phase === 'COUNTDOWN') {
        console.log(`[Pinturillo Server] Room ${room.code} COUNTDOWN -> 2`);
        this.broadcastToRoom(room, { type: 'countdown_tick', count: 2, text: '2' });
      }
    }, 1000);

    // T = 2000ms: Tick 1
    const t1 = setTimeout(() => {
      if (room.phase === 'COUNTDOWN') {
        console.log(`[Pinturillo Server] Room ${room.code} COUNTDOWN -> 1`);
        this.broadcastToRoom(room, { type: 'countdown_tick', count: 1, text: '1' });
      }
    }, 2000);

    // T = 3000ms: Tick 0 ("¡A DIBUJAR!")
    const t0 = setTimeout(() => {
      if (room.phase === 'COUNTDOWN') {
        console.log(`[Pinturillo Server] Room ${room.code} COUNTDOWN -> 0 (¡A DIBUJAR!)`);
        this.broadcastToRoom(room, { type: 'countdown_tick', count: 0, text: '¡A DIBUJAR!' });
      }
    }, 3000);

    // T = 3500ms: Transition to DRAWING phase exactly once!
    const tDrawing = setTimeout(() => {
      if (room.phase === 'COUNTDOWN') {
        console.log(`[Pinturillo Server] Room ${room.code} COUNTDOWN finished -> DRAWING START`);
        this.startDrawingPhase(room);
      }
    }, 3500);

    // Fail-safe: If for ANY reason room is still in COUNTDOWN after 4500ms (1s past target transition)
    const failSafe = setTimeout(() => {
      if (room.phase === 'COUNTDOWN') {
        console.warn(`[Pinturillo Server] Fail-safe triggered for room ${room.code}: forcing DRAWING phase transition.`);
        this.startDrawingPhase(room);
      }
    }, 4500);

    room.countdownTimeouts = [t2, t1, t0, tDrawing];
    room.countdownFailSafeTimeout = failSafe;
  }

  private startDrawingPhase(room: ServerRoom) {
    this.clearAllTimers(room);

    // Guard against multiple executions
    if (room.phase === 'DRAWING' && room.timerInterval) {
      return;
    }

    // Authoritative unique round ID
    room.roundId = `${room.code}-r${room.currentTurn}-v${room.currentVuelta}-${Date.now()}`;
    const activeRoundId = room.roundId;

    room.phase = 'DRAWING';
    room.countdownEndsAt = undefined;
    const now = Date.now();
    room.roundStartedAt = now;
    room.roundEndsAt = now + room.config.roundTimeSeconds * 1000;
    room.remainingTime = room.config.roundTimeSeconds;
    room.totalRoundTime = room.config.roundTimeSeconds;
    room.drawingStrokes = [];
    room.undoStack = [];

    // Clear any residual countdown display on all clients
    this.broadcastToRoom(room, { type: 'countdown_tick', count: -1, text: '' });

    // Authoritative room state broadcast with phase DRAWING and initial round time
    this.broadcastRoomState(room);

    // Authoritative interval for drawing round using roundEndsAt timestamp
    room.timerInterval = setInterval(() => {
      if (room.phase !== 'DRAWING' || room.roundId !== activeRoundId) {
        if (room.timerInterval) clearInterval(room.timerInterval);
        room.timerInterval = null;
        return;
      }

      const currentNow = Date.now();
      const remainingMs = (room.roundEndsAt || currentNow) - currentNow;
      const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
      room.remainingTime = remainingSeconds;

      // Hints reveal at 50% and 20% remaining time (only if hintsEnabled is true)
      if (room.config.hintsEnabled && room.secretWord) {
        const pct = remainingSeconds / room.totalRoundTime;
        const cleanWord = room.secretWord.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]/g, '');

        if (pct <= 0.50 && room.revealedIndices.size === 0 && cleanWord.length >= 5) {
          // Reveal 1 random letter
          this.revealRandomLetter(room);
        } else if (pct <= 0.20 && room.revealedIndices.size === 1 && cleanWord.length >= 7) {
          // Reveal another letter
          this.revealRandomLetter(room);
        }
      }

      this.broadcastToRoom(room, {
        type: 'tick',
        remainingTime: remainingSeconds,
        roundId: activeRoundId,
        roundEndsAt: room.roundEndsAt,
      });

      if (remainingMs <= 0 || remainingSeconds <= 0) {
        this.endDrawingRound(room, activeRoundId);
      }
    }, 500);
  }

  private revealRandomLetter(room: ServerRoom) {
    const word = room.secretWord;
    if (!word) return;
    const eligibleIndices: number[] = [];
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      if (/[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]/.test(char) && !room.revealedIndices.has(i)) {
        eligibleIndices.push(i);
      }
    }
    if (eligibleIndices.length > 0) {
      const pick = eligibleIndices[Math.floor(Math.random() * eligibleIndices.length)];
      room.revealedIndices.add(pick);
      room.wordHint = this.buildWordHint(word, room.revealedIndices);
      this.broadcastRoomState(room);
    }
  }

  private buildWordHint(word: string, revealedIndices: Set<number>): string {
    return buildWordHintString(word, revealedIndices);
  }

  private endDrawingRound(room: ServerRoom, expectedRoundId?: string) {
    if (expectedRoundId && room.roundId && room.roundId !== expectedRoundId) {
      return; // Already transitioned to another round
    }
    if (room.phase !== 'DRAWING') {
      return; // Not currently in DRAWING phase
    }

    this.clearAllTimers(room);
    room.phase = 'ROUND_RESULTS';
    room.resultsEndsAt = Date.now() + 6500;

    const currentDrawer = room.players[room.currentDrawerIndex];

    // Build round scores summary
    const scoresEarned = room.players.map(p => ({
      playerId: p.id,
      playerName: p.name,
      playerAvatar: p.avatar,
      playerColor: p.color,
      points: p.roundScore || 0,
      isDrawer: p.id === currentDrawer?.id,
      order: p.guessOrder,
    })).sort((a, b) => b.points - a.points);

    room.lastRoundResults = {
      word: room.secretWord,
      scoresEarned,
    };

    this.broadcastRoomState(room);

    // 6-second intermission to see word and scores
    room.intermissionTimeout = setTimeout(() => {
      this.advanceToNextTurn(room);
    }, 6500);
  }

  private advanceToNextTurn(room: ServerRoom) {
    this.clearAllTimers(room);
    room.currentTurn++;

    if (room.currentTurn > room.totalTurns) {
      // Game over!
      room.phase = 'FINAL_RESULTS';
      this.broadcastRoomState(room);
      return;
    }

    // Move to next drawer
    room.currentDrawerIndex = (room.currentDrawerIndex + 1) % room.players.length;
    room.currentVuelta = Math.floor((room.currentTurn - 1) / room.players.length) + 1;

    this.startWordSelectionPhase(room);
  }

  private handleSocketClose(ws: WebSocket) {
    const client = this.clients.get(ws);
    if (!client) return;

    this.clients.delete(ws);
    const room = this.rooms.get(client.roomId);
    if (!room) return;

    const player = room.players.find((p) => p.id === client.playerId);
    if (player) {
      player.isConnected = false;
    }

    // In LOBBY, departures are immediate
    if (room.phase === 'LOBBY') {
      this.processPermanentDeparture(client.roomId, client.playerId);
      return;
    }

    const isGameActive = room.phase !== 'FINAL_RESULTS' && room.phase !== 'MATCH_ABORTED';
    if (!isGameActive) {
      this.processPermanentDeparture(client.roomId, client.playerId);
      return;
    }

    this.broadcastRoomState(room);

    matchDepartureHandler.registerDisconnection(client.roomId, client.playerId, 'pinturillo', () => {
      this.processPermanentDeparture(client.roomId, client.playerId);
    });
  }

  private handleExplicitLeave(ws: WebSocket) {
    const client = this.clients.get(ws);
    if (!client) return;

    this.clients.delete(ws);
    const { roomId, playerId } = client;
    matchDepartureHandler.cancelGracePeriod(roomId, playerId);
    this.processPermanentDeparture(roomId, playerId);
  }

  private processPermanentDeparture(roomId: string, playerId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const departingPlayer = room.players.find((p) => p.id === playerId);
    const wasHost = room.hostId === playerId;
    const isGameActive = room.phase !== 'LOBBY' && room.phase !== 'FINAL_RESULTS' && room.phase !== 'MATCH_ABORTED';

    // 1. In LOBBY phase
    if (room.phase === 'LOBBY') {
      room.players = room.players.filter((p) => p.id !== playerId);
      if (room.players.length === 0) {
        this.clearAllTimers(room);
        this.rooms.delete(roomId);
        roomRegistry.unregister(roomId);
        matchDepartureHandler.clearRoomGracePeriods(roomId);
        return;
      }

      if (wasHost) {
        const nextHost = matchDepartureHandler.findEarliestConnectedPlayer(room.players) || room.players[0];
        if (nextHost) {
          room.hostId = nextHost.id;
          nextHost.isHost = true;
          this.broadcastToRoom(room, {
            type: 'notification',
            message: `👑 ${nextHost.name} es ahora quien gestiona la sala.`,
            noticeType: 'info',
          });
        }
      }
      this.broadcastRoomState(room);
      return;
    }

    // 2. In ACTIVE MATCH or FINAL RESULTS
    const evaluation = matchDepartureHandler.evaluatePermanentDeparture({
      gameType: 'pinturillo',
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

      setTimeout(() => {
        this.clearAllTimers(room);
        this.rooms.delete(roomId);
        roomRegistry.unregister(roomId);
      }, 30000);
      return;
    }

    // Match continues (at least 2 players connected)
    if (evaluation.migratedHost) {
      room.hostId = evaluation.migratedHost.id;
      const newHost = room.players.find((p) => p.id === evaluation.migratedHost!.id);
      if (newHost) {
        newHost.isHost = true;
      }
      this.broadcastToRoom(room, {
        type: 'notification',
        message: `👑 ${evaluation.migratedHost.name} es ahora quien gestiona la sala.`,
        noticeType: 'info',
      });
    }

    // Remove player from room.players
    const drawerWasDeparting = room.players[room.currentDrawerIndex]?.id === playerId;
    room.players = room.players.filter((p) => p.id !== playerId);

    // Adjust currentDrawerIndex if needed
    if (room.currentDrawerIndex >= room.players.length) {
      room.currentDrawerIndex = 0;
    }

    // If departing player was current drawer during active drawing/selection/countdown
    if (drawerWasDeparting && (room.phase === 'DRAWING' || room.phase === 'WORD_SELECTION' || room.phase === 'COUNTDOWN')) {
      room.chatMessages.push({
        id: `sys-drawer-left-${Date.now()}`,
        playerName: 'Sistema',
        text: `⚠️ El dibujante ${departingPlayer?.name || 'actual'} ha salido. Pasando a la siguiente ronda...`,
        isSystem: true,
        timestamp: Date.now(),
      });
      this.endDrawingRound(room);
      return;
    }

    // If departing player was a guesser during DRAWING, check if all remaining connected guessers have guessed
    if (room.phase === 'DRAWING') {
      const currentDrawer = room.players[room.currentDrawerIndex];
      const eligibleGuessers = room.players.filter(p => p.id !== currentDrawer?.id && p.isConnected);
      const allGuessed = eligibleGuessers.length > 0 && eligibleGuessers.every(p => p.hasGuessed);
      if (allGuessed) {
        this.endDrawingRound(room);
        return;
      }
    }

    this.broadcastRoomState(room);
  }

  private clearAllTimers(room: ServerRoom) {
    if (room.timerInterval) clearInterval(room.timerInterval);
    if (room.selectionInterval) clearInterval(room.selectionInterval);
    if (room.countdownInterval) clearInterval(room.countdownInterval);
    if (room.intermissionTimeout) clearTimeout(room.intermissionTimeout);
    if (room.countdownFailSafeTimeout) clearTimeout(room.countdownFailSafeTimeout);
    if (room.countdownTimeouts && room.countdownTimeouts.length > 0) {
      room.countdownTimeouts.forEach(t => clearTimeout(t));
      room.countdownTimeouts = [];
    }
    room.timerInterval = null;
    room.selectionInterval = null;
    room.countdownInterval = null;
    room.intermissionTimeout = null;
    room.countdownFailSafeTimeout = null;
    room.countdownTimeouts = [];
  }

  // Broadcasts sanitized state per player
  // CRITICAL SECURITY: ONLY drawer receives secretWord during DRAWING and COUNTDOWN phases!
  private broadcastRoomState(room: ServerRoom) {
    const currentDrawer = room.players[room.currentDrawerIndex];

    for (const [ws, client] of this.clients.entries()) {
      if (client.roomId === room.code && ws.readyState === WebSocket.OPEN) {
        const isDrawer = currentDrawer && client.playerId === currentDrawer.id;
        const isRevealedPhase = room.phase === 'ROUND_RESULTS' || room.phase === 'FINAL_RESULTS';

        const sanitizedState: PinturilloRoomState = {
          code: room.code,
          roundId: room.roundId,
          hostId: room.hostId,
          phase: room.phase,
          config: room.config,
          players: room.players,
          currentDrawerId: currentDrawer ? currentDrawer.id : null,
          currentTurn: room.currentTurn,
          totalTurns: room.totalTurns,
          currentVuelta: room.currentVuelta,
          // Private secret word protection:
          secretWord: (isDrawer || isRevealedPhase) ? room.secretWord : null,
          wordHint: room.wordHint,
          hintWords: room.secretWord ? buildStructuredHint(room.secretWord, room.revealedIndices) : [],
          wordLength: calculateWordLength(room.secretWord),
          wordCategory: room.wordCategory,
          wordOptions: (room.phase === 'WORD_SELECTION' && isDrawer) ? room.wordOptions : undefined,
          selectionRemainingSeconds: room.phase === 'WORD_SELECTION' ? room.selectionRemainingSeconds : undefined,
          selectionEndsAt: room.phase === 'WORD_SELECTION' ? room.selectionEndsAt : undefined,
          countdownEndsAt: room.countdownEndsAt,
          roundStartedAt: room.roundStartedAt,
          roundEndsAt: room.roundEndsAt,
          remainingTime: room.remainingTime,
          totalRoundTime: room.totalRoundTime,
          drawingStrokes: room.drawingStrokes,
          chatMessages: room.chatMessages,
          lastRoundResults: room.lastRoundResults,
          abortReason: room.abortReason,
          endMessage: room.endMessage,
        };

        this.send(ws, {
          type: 'room_state',
          state: sanitizedState,
        });
      }
    }
  }

  private broadcastToRoom(room: ServerRoom, message: ServerMessage) {
    for (const [ws, client] of this.clients.entries()) {
      if (client.roomId === room.code && ws.readyState === WebSocket.OPEN) {
        this.send(ws, message);
      }
    }
  }

  private broadcastToRoomExcept(room: ServerRoom, senderWs: WebSocket, message: ServerMessage) {
    for (const [ws, client] of this.clients.entries()) {
      if (client.roomId === room.code && ws !== senderWs && ws.readyState === WebSocket.OPEN) {
        this.send(ws, message);
      }
    }
  }

  private send(ws: WebSocket, message: ServerMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }
}
