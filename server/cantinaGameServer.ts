import { WebSocketServer, WebSocket } from 'ws';
import {
  CantinaRoomState,
  CantinaPlayer,
  CantinaPlayerRevolverState,
  CantinaConfig,
  CantinaClientMessage,
  Card,
  TableRank,
  PlayedTurn,
  CenterPileItem,
  ChallengeResult,
  RouletteResult,
  SingleShotResult,
  CadenaRoomState,
  CadenaVisualEvent,
  CadenaDrawReason,
  ReflectableSpecialType,
} from '../src/types/cantina';
import {
  buildCadenaDeck,
  getCardNumericValue,
  isCircularlyAdjacent,
  isSpecialActionCard,
  validateCadenaChain,
} from '../src/utils/cadenaRules';
import { roomRegistry } from './roomRegistry';

interface ClientConnection {
  ws: WebSocket;
  playerId: string;
  roomCode: string;
}

interface ServerRoom {
  code: string;
  gameType: 'la_cantina_del_farol';
  hostId: string;
  phase: CantinaRoomState['phase'];
  config: CantinaConfig;
  currentRound: number;
  tableRank: TableRank;
  roundStartEventId: string;
  lastRoundStarterSeatIndex: number;
  roundStartingPlayerId: string | null;
  roundStartingPlayerName: string | null;
  activePlayerIndex: number;
  mandatoryChallenge: boolean;
  players: CantinaPlayer[];
  centerPileCount: number;
  centerPileCards: Card[]; // Server-only in Clásico/Diablo, face-up discard in Cadena
  centerPileHistory: CenterPileItem[];
  lastPlay: (PlayedTurn & { cards: Card[] }) | null;
  challengeResult: ChallengeResult | null;
  rouletteResult: RouletteResult | null;
  // Cadena mode server state:
  cadenaState: CadenaRoomState | null;
  cadenaDrawPile: Card[];
  cadenaActiveBombCard: Card | null;
  cadenaIsMirrorSteal: boolean;
  cadenaSkippedPlayerId: string | null;
  winnerPlayerId: string | null;
  winnerName: string | null;
  rematchReadyPlayerIds: string[];
  roundTransitionTimeout: NodeJS.Timeout | null;
  abortReason?: string;
}

const DEFAULT_CONFIG: CantinaConfig = {
  mode: 'CLASICO',
  mapId: 'mapa1',
};

const TABLE_RANKS: TableRank[] = ['J', 'Q', 'K'];

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Snaps any cylinder angle in degrees to the nearest 60° chamber detent.
 */
function snapAngleToChamber(angle: number): number {
  const finite = Number.isFinite(angle) ? angle : 0;
  return Math.round(finite / 60) * 60;
}

/**
 * Returns which chamber index (0..5) is physically located at 12 o'clock (-90°)
 * for a given cylinder rotation angle in degrees.
 */
function getTopChamberIndexFromAngle(angle: number): number {
  const steps = -Math.round((Number.isFinite(angle) ? angle : 0) / 60);
  return ((steps % 6) + 6) % 6;
}

function createInitialRevolverState(): CantinaPlayerRevolverState {
  return {
    chambers: 6,
    currentRotation: 0,
    topChamberIndex: 0,
    shotsTaken: 0,
    firedChambers: [],
  };
}

function ensurePlayerRevolver(player: CantinaPlayer): CantinaPlayerRevolverState {
  if (!player.revolver) {
    player.revolver = {
      chambers: 6,
      currentRotation: -player.chamberPulls * 60,
      topChamberIndex: ((player.chamberPulls % 6) + 6) % 6,
      shotsTaken: player.chamberPulls,
      firedChambers: Array.from({ length: Math.min(6, player.chamberPulls) }, (_, i) => i),
    };
  }
  return player.revolver;
}

/**
 * Advances a player's personal revolver rotation by -60° steps until the chamber at 12 o'clock
 * is an untested chamber (used between rounds/turns, NEVER after pressing DISPARAR).
 */
function advanceRevolverToNextUntestedChamber(player: CantinaPlayer) {
  const rev = ensurePlayerRevolver(player);
  if (rev.firedChambers.length >= 6) return;
  let angle = snapAngleToChamber(rev.currentRotation);
  for (let i = 0; i < 6; i++) {
    const candidateIdx = getTopChamberIndexFromAngle(angle);
    if (!rev.firedChambers.includes(candidateIdx)) {
      rev.currentRotation = angle;
      rev.topChamberIndex = candidateIdx;
      return;
    }
    angle -= 60;
  }
}

export class CantinaServer {
  public wss: WebSocketServer;
  private rooms = new Map<string, ServerRoom>();
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
        const msg = JSON.parse(data.toString()) as CantinaClientMessage;
        this.handleClientMessage(ws, msg);
      } catch (err) {
        console.error('[CantinaServer] Error parsing message:', err);
      }
    });

    ws.on('close', () => {
      this.handleDisconnect(ws, false);
    });

    ws.on('error', (err) => {
      console.error('[CantinaServer] WebSocket error:', err);
    });
  }

  public getRoomInfo(code: string) {
    const room = this.rooms.get(code.toUpperCase().trim());
    if (!room) return null;
    return {
      code: room.code,
      gameType: room.gameType,
      phase: room.phase,
      playerCount: room.players.length,
      maxPlayers: 4,
      isFull: room.players.length >= 4,
      hostId: room.hostId,
      playerIds: room.players.map((p) => p.id),
      players: room.players.map((p) => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        color: p.color,
        isHost: p.isHost,
      })),
      settings: room.config,
    };
  }

  public createRoomDirect(
    hostPlayer: { id: string; name: string; avatar: string; color: string },
    config?: Partial<CantinaConfig>
  ): CantinaRoomState {
    let code: string;
    do {
      code = roomRegistry.generateCode();
    } while (this.rooms.has(code));

    const initialPlayer: CantinaPlayer = {
      id: hostPlayer.id,
      name: (hostPlayer.name || 'Jugador').trim(),
      avatar: hostPlayer.avatar || '🤠',
      color: hostPlayer.color || '#eab308',
      seatIndex: 0,
      isHost: true,
      isConnected: true,
      isAlive: true,
      cardsCount: 0,
      hand: [],
      chamberPulls: 0,
      bulletChamber: Math.floor(Math.random() * 6),
      revolver: createInitialRevolverState(),
      isEliminated: false,
      lastReflectableEffectReceived: null,
    };

    const newRoom: ServerRoom = {
      code,
      gameType: 'la_cantina_del_farol',
      hostId: hostPlayer.id,
      phase: 'LOBBY',
      config: {
        mode: config?.mode || DEFAULT_CONFIG.mode,
        mapId: config?.mapId || DEFAULT_CONFIG.mapId,
      },
      currentRound: 0,
      tableRank: 'K',
      roundStartEventId: '',
      lastRoundStarterSeatIndex: -1,
      roundStartingPlayerId: null,
      roundStartingPlayerName: null,
      activePlayerIndex: 0,
      mandatoryChallenge: false,
      players: [initialPlayer],
      centerPileCount: 0,
      centerPileCards: [],
      centerPileHistory: [],
      lastPlay: null,
      challengeResult: null,
      rouletteResult: null,
      cadenaState: null,
      cadenaDrawPile: [],
      cadenaActiveBombCard: null,
      cadenaIsMirrorSteal: false,
      cadenaSkippedPlayerId: null,
      winnerPlayerId: null,
      winnerName: null,
      rematchReadyPlayerIds: [],
      roundTransitionTimeout: null,
    };

    this.rooms.set(code, newRoom);
    roomRegistry.register(code, 'la_cantina_del_farol', 'cantina');

    return this.sanitizeRoomForPlayer(newRoom, hostPlayer.id);
  }

  private handleClientMessage(ws: WebSocket, msg: CantinaClientMessage) {
    if (msg.type === 'JOIN_ROOM') {
      const code = (msg.code || '').toUpperCase().trim();
      const room = this.rooms.get(code);

      if (!room) {
        this.sendError(ws, 'NO SE HA ENCONTRADO ESA SALA');
        return;
      }

      let player = room.players.find((p) => p.id === msg.player.id);

      if (player) {
        player.isConnected = true;
        player.name = (msg.player.name || player.name).trim();
      } else {
        if (room.phase !== 'LOBBY') {
          this.sendError(ws, 'LA PARTIDA YA HA EMPEZADO');
          return;
        }
        if (room.players.length >= 4) {
          this.sendError(ws, 'LA SALA ESTÁ COMPLETA (MÁXIMO 4 JUGADORES)');
          return;
        }

        const seatIndex = room.players.length;
        player = {
          id: msg.player.id,
          name: (msg.player.name || `Jugador ${room.players.length + 1}`).trim(),
          avatar: msg.player.avatar || '🤠',
          color: msg.player.color || '#eab308',
          seatIndex,
          isHost: false,
          isConnected: true,
          isAlive: true,
          cardsCount: 0,
          hand: [],
          chamberPulls: 0,
          bulletChamber: Math.floor(Math.random() * 6),
          revolver: createInitialRevolverState(),
          isEliminated: false,
          lastReflectableEffectReceived: null,
        };
        room.players.push(player);
      }

      this.clients.set(ws, { ws, playerId: msg.player.id, roomCode: code });
      this.broadcastRoom(room);
      return;
    }

    const conn = this.clients.get(ws);
    if (!conn) return;

    const room = this.rooms.get(conn.roomCode);
    if (!room) return;

    switch (msg.type) {
      case 'UPDATE_CONFIG': {
        if (room.hostId !== conn.playerId || room.phase !== 'LOBBY') return;
        if (msg.config.mode) room.config.mode = msg.config.mode;
        if (msg.config.mapId) room.config.mapId = msg.config.mapId;
        this.broadcastRoom(room);
        break;
      }

      case 'START_GAME': {
        if (room.hostId !== conn.playerId || room.phase !== 'LOBBY') return;
        if (room.players.length < 2) {
          this.sendError(ws, 'HACEN FALTA AL MENOS 2 JUGADORES PARA EMPEZAR');
          return;
        }
        this.startMatch(room);
        break;
      }

      case 'PLAY_CARDS': {
        if (room.config.mode === 'CADENA') {
          this.handleCadenaPlayChain(ws, room, conn.playerId, msg.cardIds, msg.playId);
          return;
        }
        if (room.phase !== 'PLAYING') return;
        if (msg.playId && room.centerPileHistory.some((h) => h.playId === msg.playId)) {
          return;
        }
        const activePlayer = room.players[room.activePlayerIndex];
        if (!activePlayer || activePlayer.id !== conn.playerId) {
          this.sendError(ws, 'NO ES TU TURNO');
          return;
        }

        if (room.mandatoryChallenge) {
          this.sendError(
            ws,
            '¡EL JUGADOR ANTERIOR SE QUEDÓ SIN CARTAS! DEBES ACUSAR ¡FAROL!'
          );
          return;
        }

        const cardIds = msg.cardIds;
        if (!Array.isArray(cardIds) || cardIds.length < 1 || cardIds.length > 3) {
          this.sendError(ws, 'DEBES SELECCIONAR ENTRE 1 Y 3 CARTAS');
          return;
        }

        const playerHand = activePlayer.hand || [];
        const playedCards: Card[] = [];
        for (const cid of cardIds) {
          const found = playerHand.find((c) => c.id === cid);
          if (!found) {
            this.sendError(ws, 'NO TIENES ESA CARTA');
            return;
          }
          playedCards.push(found);
        }

        // Remove cards from player's hand
        activePlayer.hand = playerHand.filter((c) => !cardIds.includes(c.id));
        activePlayer.cardsCount = activePlayer.hand.length;
        const emptiedHand = activePlayer.cardsCount === 0;

        // Add to center pile
        room.centerPileCards.push(...playedCards);
        room.centerPileCount = room.centerPileCards.length;

        const clientPlayId =
          typeof msg.playId === 'string' &&
          msg.playId.trim().length > 0 &&
          msg.playId.length <= 80 &&
          !room.centerPileHistory.some((h) => h.playId === msg.playId)
            ? msg.playId.trim()
            : null;

        const playId =
          clientPlayId ||
          `play_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const turnRecord = {
          playerId: activePlayer.id,
          playerName: activePlayer.name,
          cardsCount: playedCards.length,
          claimedRank: room.tableRank,
          cards: playedCards,
          timestamp: Date.now(),
          playId,
        };

        room.lastPlay = turnRecord;
        room.centerPileHistory.push({
          playId,
          playerId: activePlayer.id,
          playerName: activePlayer.name,
          cardsCount: playedCards.length,
          claimedRank: room.tableRank,
          timestamp: Date.now(),
        });

        // Broadcast card played event for visual throw animation
        this.broadcastEvent(room.code, {
          type: 'CARD_PLAYED_EVENT',
          playerId: activePlayer.id,
          playerName: activePlayer.name,
          cardsCount: playedCards.length,
          playId,
          claimedRank: room.tableRank,
        });

        // Advance to next active alive player (or force mandatory accusation if activePlayer emptied hand)
        this.advanceToNextTurn(room, emptiedHand, activePlayer.id);
        this.broadcastRoom(room);
        break;
      }

      case 'CHALLENGE_BLUFF': {
        if (room.config.mode === 'CADENA') return;
        if (room.phase !== 'PLAYING') return;
        const activePlayer = room.players[room.activePlayerIndex];
        if (!activePlayer || activePlayer.id !== conn.playerId) {
          this.sendError(ws, 'NO ES TU TURNO');
          return;
        }

        if (!room.lastPlay) {
          this.sendError(ws, 'NO HAY NINGUNA JUGADA QUE DESAFIAR');
          return;
        }

        this.resolveChallenge(room, activePlayer);
        break;
      }

      // ============================================================
      // CADENA MODE HANDLERS
      // ============================================================
      case 'CADENA_PLAY_CHAIN': {
        this.handleCadenaPlayChain(ws, room, conn.playerId, msg.cardIds, msg.playId);
        break;
      }

      case 'CADENA_PLAY_SPECIAL': {
        this.handleCadenaPlaySpecial(
          ws,
          room,
          conn.playerId,
          msg.cardId,
          msg.targetPlayerId,
          msg.playId
        );
        break;
      }

      case 'CADENA_DRAW_CARD': {
        this.handleCadenaDrawCard(ws, room, conn.playerId);
        break;
      }

      case 'CADENA_END_TURN': {
        this.handleCadenaEndTurn(ws, room, conn.playerId);
        break;
      }

      case 'CADENA_STEAL_CARD': {
        this.handleCadenaStealCard(ws, room, conn.playerId, msg.targetPlayerId, msg.slotIndex);
        break;
      }

      case 'CADENA_SELECT_BOMB_TARGET': {
        this.handleCadenaSelectBombTarget(ws, room, conn.playerId, msg.targetPlayerId);
        break;
      }

      case 'CADENA_DECLARE_ULTIMA': {
        this.handleCadenaDeclareUltima(ws, room, conn.playerId);
        break;
      }

      case 'CADENA_CATCH_ULTIMA': {
        this.handleCadenaCatchUltima(ws, room, conn.playerId);
        break;
      }

      case 'ROULETTE_SPIN': {
        if (room.phase !== 'RULETA' || !room.rouletteResult) return;
        if (room.rouletteResult.shotResolved) return;
        if (room.rouletteResult.targetPlayerId !== conn.playerId) return;
        if (
          msg.rouletteEventId &&
          msg.rouletteEventId !== room.rouletteResult.rouletteEventId
        ) {
          return;
        }

        const shooter = room.players.find((p) => p.id === conn.playerId);
        if (!shooter) return;
        const rev = ensurePlayerRevolver(shooter);

        const safeVel = Math.max(-75, Math.min(75, Number(msg.velocity) || 0));
        const rawAngle = Number(msg.angle) || 0;
        const settled = Boolean(msg.settled) || Math.abs(safeVel) < 0.08;
        const effectiveAngle = settled ? snapAngleToChamber(rawAngle) : rawAngle;
        const topIdx = getTopChamberIndexFromAngle(effectiveAngle);
        const spinId = String(msg.spinId || `spin_${Date.now()}`);

        rev.currentRotation = snapAngleToChamber(effectiveAngle);
        rev.topChamberIndex = topIdx;
        room.rouletteResult.cylinderAngle = effectiveAngle;
        room.rouletteResult.firedChamberIndex = topIdx;

        this.broadcastEventExcept(room.code, conn.playerId, {
          type: 'ROULETTE_SPIN_EVENT',
          rouletteEventId: room.rouletteResult.rouletteEventId,
          playerId: conn.playerId,
          velocity: settled ? 0 : safeVel,
          angle: effectiveAngle,
          spinId,
          settled,
        });
        break;
      }

      case 'PULL_TRIGGER': {
        if (room.phase !== 'RULETA' || !room.rouletteResult) return;
        if (room.rouletteResult.shotResolved) return;
        if (room.rouletteResult.targetPlayerId !== conn.playerId) {
          this.sendError(ws, 'NO ES TU TURNO DE DISPARAR');
          return;
        }
        if (
          msg.rouletteEventId &&
          msg.rouletteEventId !== room.rouletteResult.rouletteEventId
        ) {
          return;
        }
        this.executeRouletteTriggerPull(
          room,
          conn.playerId,
          room.rouletteResult.rouletteEventId
        );
        break;
      }

      case 'TRIGGER_ROULETTE': {
        if (room.phase !== 'RULETA' || !room.rouletteResult) return;
        if (
          !room.rouletteResult.shotResolved &&
          room.rouletteResult.targetPlayerId === conn.playerId
        ) {
          this.executeRouletteTriggerPull(
            room,
            conn.playerId,
            room.rouletteResult.rouletteEventId
          );
        } else {
          this.broadcastRoom(room);
        }
        break;
      }

      case 'NEXT_ROUND': {
        if (room.hostId !== conn.playerId) return;
        if (room.phase === 'ROUND_END') {
          this.startRound(room);
        }
        break;
      }

      case 'REQUEST_REMATCH': {
        if (room.phase !== 'GAME_OVER') return;
        if (!room.rematchReadyPlayerIds.includes(conn.playerId)) {
          room.rematchReadyPlayerIds.push(conn.playerId);
        }
        const connectedPlayers = room.players.filter((p) => p.isConnected);
        const allReady =
          connectedPlayers.length >= 2 &&
          connectedPlayers.every((p) => room.rematchReadyPlayerIds.includes(p.id));
        if (allReady) {
          this.startMatch(room);
        } else {
          this.broadcastRoom(room);
        }
        break;
      }

      case 'RESTART_MATCH': {
        if (room.phase === 'GAME_OVER') {
          if (!room.rematchReadyPlayerIds.includes(conn.playerId)) {
            room.rematchReadyPlayerIds.push(conn.playerId);
          }
          const connectedPlayers = room.players.filter((p) => p.isConnected);
          const allReady =
            connectedPlayers.length >= 2 &&
            connectedPlayers.every((p) =>
              room.rematchReadyPlayerIds.includes(p.id)
            );
          if (allReady) {
            this.startMatch(room);
          } else {
            this.broadcastRoom(room);
          }
          return;
        }
        if (room.hostId !== conn.playerId) return;
        this.resetMatchToLobby(room);
        break;
      }

      case 'RETURN_TO_LOBBY': {
        this.resetMatchToLobby(room);
        break;
      }

      case 'HAND_INTERACTION': {
        this.broadcastHandInteraction(
          room.code,
          conn.playerId,
          msg.interaction,
          msg.hoveredIndex
        );
        break;
      }

      case 'LEAVE_ROOM': {
        this.handleDisconnect(ws, true);
        break;
      }
    }
  }

  private startMatch(room: ServerRoom) {
    if (room.roundTransitionTimeout) {
      clearTimeout(room.roundTransitionTimeout);
      room.roundTransitionTimeout = null;
    }

    room.currentRound = 0;
    room.lastRoundStarterSeatIndex = -1;
    room.roundStartingPlayerId = null;
    room.roundStartingPlayerName = null;
    room.mandatoryChallenge = false;
    room.rematchReadyPlayerIds = [];
    room.winnerPlayerId = null;
    room.winnerName = null;
    room.lastPlay = null;
    room.challengeResult = null;
    room.rouletteResult = null;
    room.cadenaState = null;
    room.cadenaDrawPile = [];
    room.cadenaActiveBombCard = null;
    room.cadenaIsMirrorSteal = false;
    room.cadenaSkippedPlayerId = null;
    room.centerPileCards = [];
    room.centerPileCount = 0;
    room.centerPileHistory = [];

    room.players.forEach((p, idx) => {
      p.seatIndex = idx;
      p.isAlive = true;
      p.isEliminated = false;
      p.eliminatedRound = undefined;
      p.chamberPulls = 0;
      p.bulletChamber = Math.floor(Math.random() * 6);
      p.revolver = createInitialRevolverState();
      p.cardsCount = 0;
      p.hand = [];
      p.lastReflectableEffectReceived = null;
    });

    if (room.config.mode === 'CADENA') {
      this.startCadenaRound(room);
    } else {
      this.startRound(room);
    }
  }

  // ============================================================
  // CADENA MODE SERVER ENGINE
  // ============================================================

  private startCadenaRound(room: ServerRoom) {
    if (room.roundTransitionTimeout) {
      clearTimeout(room.roundTransitionTimeout);
      room.roundTransitionTimeout = null;
    }

    room.currentRound = 1;
    room.phase = 'ROUND_INTRO';
    room.mandatoryChallenge = false;
    room.lastPlay = null;
    room.challengeResult = null;
    room.rouletteResult = null;
    room.centerPileCards = [];
    room.centerPileCount = 0;
    room.centerPileHistory = [];
    room.cadenaActiveBombCard = null;
    room.cadenaIsMirrorSteal = false;
    room.cadenaSkippedPlayerId = null;

    // 1. Build and shuffle the authoritative 68-card Cadena deck
    const fullDeck = shuffle(buildCadenaDeck(room.currentRound));

    // 2. Deal 7 private cards to each active player
    room.players.forEach((player) => {
      if (player.isAlive) {
        const hand = fullDeck.splice(0, 7);
        player.hand = hand;
        player.cardsCount = hand.length;
        player.lastReflectableEffectReceived = null;
      } else {
        player.hand = [];
        player.cardsCount = 0;
        player.lastReflectableEffectReceived = null;
      }
    });

    // 3. Reveal an initial NUMERIC card (1..10) from the remaining deck
    let initialCardIdx = fullDeck.findIndex(
      (c) => getCardNumericValue(c.rank) !== null
    );
    if (initialCardIdx < 0) {
      initialCardIdx = 0;
    }
    const [initialCard] = fullDeck.splice(initialCardIdx, 1);
    const initialNumber = getCardNumericValue(initialCard.rank) || 5;

    room.cadenaDrawPile = fullDeck;
    room.centerPileCards = [initialCard];
    room.centerPileCount = 1;

    const initialPlayId = `cad_init_r${room.currentRound}_${Date.now()}`;
    room.centerPileHistory = [
      {
        playId: initialPlayId,
        playerId: 'dealer',
        playerName: 'Cantina',
        cardsCount: 1,
        claimedRank: 'K',
        cards: [initialCard],
        timestamp: Date.now(),
      },
    ];

    // 4. Choose starting player using fair server-side rotation
    const total = room.players.length;
    let startIdx = 0;
    if (room.lastRoundStarterSeatIndex < 0) {
      const firstAlive = room.players.findIndex((p) => p.isAlive);
      startIdx = firstAlive >= 0 ? firstAlive : 0;
    } else {
      for (let offset = 1; offset <= total; offset++) {
        const candidateIdx = (room.lastRoundStarterSeatIndex + offset) % total;
        if (room.players[candidateIdx]?.isAlive) {
          startIdx = candidateIdx;
          break;
        }
      }
    }

    room.lastRoundStarterSeatIndex = startIdx;
    room.activePlayerIndex = startIdx;
    const starterPlayer = room.players[startIdx];
    room.roundStartingPlayerId = starterPlayer ? starterPlayer.id : null;
    room.roundStartingPlayerName = starterPlayer ? starterPlayer.name : null;
    room.roundStartEventId = `deal_${room.code}_r${room.currentRound}_${Date.now()}`;

    room.cadenaState = {
      currentNumber: initialNumber,
      turnDirection: 1,
      drawPileCount: room.cadenaDrawPile.length,
      discardPileCount: room.centerPileCards.length,
      topCard: initialCard,
      turnSubPhase: 'NORMAL',
      drawnCardId: null,
      stealTargetPlayerId: null,
      stolenCardId: null,
      stolenCard: null,
      bombHolderPlayerId: null,
      bombHolderPlayerName: null,
      bombTurnsRemaining: 0,
      ultimaWindow: null,
      lastEvent: null,
      lastDrawEvent: null,
    };

    // Broadcast dealing event (7 cards per player)
    this.broadcastEvent(room.code, {
      type: 'DEAL_CARDS_EVENT',
      round: room.currentRound,
      roundStartEventId: room.roundStartEventId,
      startingPlayerId: room.roundStartingPlayerId || '',
      startingPlayerName: room.roundStartingPlayerName || '',
      tableRank: room.tableRank,
      cardsPerPlayer: 7,
    });

    this.broadcastRoom(room);

    // Transition to PLAYING after dealing & reveal completes
    room.roundTransitionTimeout = setTimeout(() => {
      room.phase = 'PLAYING';
      this.broadcastRoom(room);
    }, 2600);
  }

  /**
   * Draws `count` cards from `room.cadenaDrawPile`, reshuffling eligible discarded cards
   * from `room.centerPileCards` if the draw pile is exhausted (Requirement 54).
   * Records `lastDrawEvent` on `room.cadenaState` so clients can animate physical draws from deck.
   */
  private drawCardsFromCadenaDeck(
    room: ServerRoom,
    count: number,
    targetPlayer?: CantinaPlayer,
    reason: CadenaDrawReason = 'NORMAL_DRAW'
  ): Card[] {
    const drawn: Card[] = [];
    const drawPileCountBefore = room.cadenaDrawPile.length;
    let didReshuffle = false;
    let reshuffledCount = 0;

    for (let i = 0; i < count; i++) {
      if (room.cadenaDrawPile.length === 0) {
        // Reshuffle all discarded cards in centerPileCards EXCEPT the current top card
        if (room.centerPileCards.length > 1) {
          const topCard = room.centerPileCards[room.centerPileCards.length - 1];
          const recyclable = room.centerPileCards.slice(0, -1).map((c) => {
            if (c.rank === 'JOKER') {
              return { id: c.id, rank: c.rank };
            }
            return { ...c };
          });
          didReshuffle = true;
          reshuffledCount = recyclable.length;
          room.cadenaDrawPile = shuffle(recyclable);
          room.centerPileCards = [topCard];
          room.centerPileCount = 1;
          if (room.centerPileHistory.length > 1) {
            room.centerPileHistory = [
              room.centerPileHistory[room.centerPileHistory.length - 1],
            ];
          }
        }
      }

      if (room.cadenaDrawPile.length > 0) {
        const nextCard = room.cadenaDrawPile.shift()!;
        drawn.push(nextCard);
      }
    }

    if (room.cadenaState) {
      room.cadenaState.drawPileCount = room.cadenaDrawPile.length;
      room.cadenaState.discardPileCount = room.centerPileCards.length;

      if (targetPlayer && drawn.length > 0) {
        room.cadenaState.lastDrawEvent = {
          eventId: `cdraw_${room.code}_${targetPlayer.id}_${Date.now()}_${Math.random()
            .toString(36)
            .substring(2, 6)}`,
          playerId: targetPlayer.id,
          playerName: targetPlayer.name,
          count: drawn.length,
          reason,
          reshuffled: didReshuffle,
          reshuffledCount,
          drawPileCountBefore,
          drawPileCountAfter: room.cadenaDrawPile.length,
          drawnCards: drawn.map((c) => ({ ...c })),
          timestamp: Date.now(),
        };
      }
    }

    return drawn;
  }

  private getActiveCadenaPlayers(room: ServerRoom): CantinaPlayer[] {
    return room.players.filter((p) => p.isAlive);
  }

  private getNextCadenaPlayerIndex(
    room: ServerRoom,
    fromIndex: number,
    direction: 1 | -1,
    steps: number = 1
  ): number {
    const total = room.players.length;
    if (total === 0) return 0;

    let currentIdx = fromIndex;
    let remainingSteps = steps;

    while (remainingSteps > 0) {
      for (let i = 1; i <= total; i++) {
        const candidateIdx = (((currentIdx + direction * i) % total) + total) % total;
        const candidate = room.players[candidateIdx];
        if (candidate && candidate.isAlive) {
          currentIdx = candidateIdx;
          break;
        }
      }
      remainingSteps--;
    }

    return currentIdx;
  }

  private triggerUltimaWindowIfNeeded(
    room: ServerRoom,
    player: CantinaPlayer,
    prevHandCount: number
  ) {
    if (!room.cadenaState) return;
    const newCount = (player.hand || []).length;
    if (prevHandCount >= 2 && newCount === 1) {
      room.cadenaState.ultimaWindow = {
        eventId: `ult_${room.code}_${player.id}_${Date.now()}`,
        targetPlayerId: player.id,
        targetPlayerName: player.name,
        declared: false,
        caughtByPlayerId: null,
        caughtByPlayerName: null,
        resolved: false,
        deadlineMs: Date.now() + 4000,
      };
    } else if (
      room.cadenaState.ultimaWindow &&
      room.cadenaState.ultimaWindow.targetPlayerId === player.id &&
      newCount !== 1
    ) {
      room.cadenaState.ultimaWindow = null;
    }
  }

  private emitCadenaEvent(room: ServerRoom, ev: Omit<CadenaVisualEvent, 'eventId' | 'timestamp'>) {
    if (!room.cadenaState) return;
    room.cadenaState.lastEvent = {
      ...ev,
      eventId: `cev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
    };
  }

  /**
   * Completes `activePlayer`'s turn in Cadena mode:
   * - Clears expired `lastReflectableEffectReceived` on `activePlayer` (Requirement 33)
   * - Resets turnSubPhase / drawnCardId / stolenCardId
   * - Handles Bomb countdown if `activePlayer` holds the Bomb and did NOT defuse/reflect it (Requirements 27 & 29)
   * - Advances `activePlayerIndex` according to `turnDirection` and `stepCount`
   */
  private finishCadenaPlayerTurn(
    room: ServerRoom,
    activePlayer: CantinaPlayer,
    defusedOrReflectedBomb: boolean,
    stepCount: number = 1
  ) {
    if (!room.cadenaState) return;
    const cs = room.cadenaState;

    // Clear Mirror eligibility when player's turn ends (Requirement 33)
    activePlayer.lastReflectableEffectReceived = null;

    cs.turnSubPhase = 'NORMAL';
    cs.drawnCardId = null;
    cs.stealTargetPlayerId = null;
    cs.stolenCardId = null;
    cs.stolenCard = null;
    room.cadenaIsMirrorSteal = false;

    // Bomb countdown check (only decrements when the bomb holder finishes a turn without defusing/reflecting)
    if (
      cs.bombHolderPlayerId === activePlayer.id &&
      !defusedOrReflectedBomb &&
      cs.bombTurnsRemaining > 0
    ) {
      cs.bombTurnsRemaining -= 1;
      if (cs.bombTurnsRemaining <= 0) {
        // BOOM! Explosion: holder draws 3 cards, Bomb is discarded (Requirement 29)
        const penaltyCards = this.drawCardsFromCadenaDeck(
          room,
          3,
          activePlayer,
          'BOMB_EXPLOSION'
        );
        activePlayer.hand = [...(activePlayer.hand || []), ...penaltyCards];
        activePlayer.cardsCount = activePlayer.hand.length;

        if (room.cadenaActiveBombCard) {
          room.centerPileCards.push(room.cadenaActiveBombCard);
          room.centerPileCount = room.centerPileCards.length;
          room.cadenaActiveBombCard = null;
        }

        cs.bombHolderPlayerId = null;
        cs.bombHolderPlayerName = null;
        cs.bombTurnsRemaining = 0;

        if (
          cs.ultimaWindow &&
          cs.ultimaWindow.targetPlayerId === activePlayer.id
        ) {
          cs.ultimaWindow = null;
        }

        this.emitCadenaEvent(room, {
          kind: 'BOMB_EXPLODED',
          actorPlayerId: activePlayer.id,
          actorPlayerName: activePlayer.name,
          targetPlayerId: activePlayer.id,
          targetPlayerName: activePlayer.name,
          turnsRemaining: 0,
          text: `💥 ¡BOOM! La Bomba explotó en manos de ${activePlayer.name} (+3 cartas)`,
        });
      } else {
        this.emitCadenaEvent(room, {
          kind: 'BOMB_TICK',
          actorPlayerId: activePlayer.id,
          actorPlayerName: activePlayer.name,
          targetPlayerId: activePlayer.id,
          targetPlayerName: activePlayer.name,
          turnsRemaining: cs.bombTurnsRemaining,
          text: `💣 La Bomba de ${activePlayer.name} baja a ${cs.bombTurnsRemaining} turno${
            cs.bombTurnsRemaining === 1 ? '' : 's'
          }`,
        });
      }
    }

    // Advance turn
    if (stepCount > 0) {
      let nextIdx = this.getNextCadenaPlayerIndex(
        room,
        room.activePlayerIndex,
        cs.turnDirection,
        stepCount
      );

      // If the next player was marked to be skipped by a reflected J
      if (
        room.cadenaSkippedPlayerId &&
        room.players[nextIdx]?.id === room.cadenaSkippedPlayerId
      ) {
        room.cadenaSkippedPlayerId = null;
        nextIdx = this.getNextCadenaPlayerIndex(
          room,
          nextIdx,
          cs.turnDirection,
          1
        );
      }

      room.activePlayerIndex = nextIdx;
    }

    cs.drawPileCount = room.cadenaDrawPile.length;
    cs.discardPileCount = room.centerPileCards.length;
  }

  private handleCadenaPlayChain(
    ws: WebSocket,
    room: ServerRoom,
    playerId: string,
    cardIds: string[],
    clientPlayId?: string
  ) {
    if (room.config.mode !== 'CADENA' || room.phase !== 'PLAYING' || !room.cadenaState) {
      return;
    }
    const cs = room.cadenaState;
    const activePlayer = room.players[room.activePlayerIndex];
    if (!activePlayer || activePlayer.id !== playerId) {
      this.sendError(ws, 'NO ES TU TURNO');
      return;
    }

    if (
      cs.turnSubPhase !== 'NORMAL' &&
      cs.turnSubPhase !== 'DRAWN_DECISION' &&
      cs.turnSubPhase !== 'K_FOLLOWUP_CHAIN'
    ) {
      this.sendError(ws, 'DEBES COMPLETAR LA ACCIÓN ESPECIAL EN CURSO');
      return;
    }

    if (!Array.isArray(cardIds) || cardIds.length === 0) {
      this.sendError(ws, 'SELECCIONA AL MENOS UNA CARTA');
      return;
    }

    // If in K_FOLLOWUP_CHAIN, the chain MUST begin with the stolen card
    if (cs.turnSubPhase === 'K_FOLLOWUP_CHAIN' && cs.stolenCardId) {
      if (cardIds[0] !== cs.stolenCardId) {
        this.sendError(
          ws,
          'LA CADENA DEBE EMPEZAR CON LA CARTA ROBADA QUE CONECTA CON LA MESA'
        );
        return;
      }
    }

    const playerHand = activePlayer.hand || [];
    const selectedCards: Card[] = [];
    const seenIds = new Set<string>();

    for (const cid of cardIds) {
      if (seenIds.has(cid)) {
        this.sendError(ws, 'NO PUEDES REPETIR LA MISMA CARTA');
        return;
      }
      seenIds.add(cid);
      const found = playerHand.find((c) => c.id === cid);
      if (!found) {
        this.sendError(ws, 'NO TIENES ESA CARTA EN TU MANO');
        return;
      }
      selectedCards.push(found);
    }

    // If player selected a single special action card (J, Q, K, BOMBA, ESPEJO) and pressed confirm,
    // route to handleCadenaPlaySpecial for convenience
    if (
      selectedCards.length === 1 &&
      isSpecialActionCard(selectedCards[0]) &&
      cs.turnSubPhase !== 'K_FOLLOWUP_CHAIN'
    ) {
      this.handleCadenaPlaySpecial(
        ws,
        room,
        playerId,
        selectedCards[0].id,
        undefined,
        clientPlayId
      );
      return;
    }

    // Authoritative chain validation
    const validation = validateCadenaChain(cs.currentNumber, selectedCards);
    if (!validation.valid || !validation.resolvedCards || !validation.newCurrentNumber) {
      this.sendError(
        ws,
        validation.reason || 'CADENA NO VÁLIDA CON EL NÚMERO ACTUAL'
      );
      return;
    }

    const prevHandCount = playerHand.length;
    const resolvedCards = validation.resolvedCards;

    // Remove played cards from player's hand
    activePlayer.hand = playerHand.filter((c) => !seenIds.has(c.id));
    activePlayer.cardsCount = activePlayer.hand.length;

    // Add to center discard pile
    room.centerPileCards.push(...resolvedCards);
    room.centerPileCount = room.centerPileCards.length;
    cs.currentNumber = validation.newCurrentNumber;
    cs.topCard = resolvedCards[resolvedCards.length - 1];
    cs.discardPileCount = room.centerPileCards.length;

    const safePlayId =
      typeof clientPlayId === 'string' &&
      clientPlayId.trim().length > 0 &&
      !room.centerPileHistory.some((h) => h.playId === clientPlayId)
        ? clientPlayId.trim()
        : `cad_play_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    room.lastPlay = {
      playerId: activePlayer.id,
      playerName: activePlayer.name,
      cardsCount: resolvedCards.length,
      claimedRank: room.tableRank,
      cards: resolvedCards,
      timestamp: Date.now(),
      playId: safePlayId,
    };

    room.centerPileHistory.push({
      playId: safePlayId,
      playerId: activePlayer.id,
      playerName: activePlayer.name,
      cardsCount: resolvedCards.length,
      claimedRank: room.tableRank,
      cards: resolvedCards,
      timestamp: Date.now(),
    });

    this.broadcastEvent(room.code, {
      type: 'CARD_PLAYED_EVENT',
      playerId: activePlayer.id,
      playerName: activePlayer.name,
      cardsCount: resolvedCards.length,
      playId: safePlayId,
      claimedRank: room.tableRank,
      cards: resolvedCards,
    });

    // Requirement 35 & 40: If player reaches 0 cards, immediate victory!
    if (activePlayer.cardsCount === 0) {
      this.endGame(room, activePlayer);
      return;
    }

    // Requirement 36: Check if player went from 2+ cards to 1 card
    this.triggerUltimaWindowIfNeeded(room, activePlayer, prevHandCount);

    // Requirement 28: Check if activePlayer held the Bomb and defused it with a chain of >= 3 cards
    if (
      cs.bombHolderPlayerId === activePlayer.id &&
      resolvedCards.length >= 3
    ) {
      cs.turnSubPhase = 'BOMB_PASS_TARGET';
      cs.drawnCardId = null;
      cs.stolenCardId = null;
      cs.stolenCard = null;
      this.emitCadenaEvent(room, {
        kind: 'BOMB_DEFUSED',
        actorPlayerId: activePlayer.id,
        actorPlayerName: activePlayer.name,
        text: `¡BOMBA DESACTIVADA! ${activePlayer.name} jugó ${resolvedCards.length} cartas y puede pasar la Bomba.`,
      });
      this.broadcastRoom(room);
      return;
    }

    this.finishCadenaPlayerTurn(room, activePlayer, false, 1);
    this.broadcastRoom(room);
  }

  private handleCadenaPlaySpecial(
    ws: WebSocket,
    room: ServerRoom,
    playerId: string,
    cardId: string,
    targetPlayerId?: string,
    clientPlayId?: string
  ) {
    if (room.config.mode !== 'CADENA' || room.phase !== 'PLAYING' || !room.cadenaState) {
      return;
    }
    const cs = room.cadenaState;
    const activePlayer = room.players[room.activePlayerIndex];
    if (!activePlayer || activePlayer.id !== playerId) {
      this.sendError(ws, 'NO ES TU TURNO');
      return;
    }

    if (cs.turnSubPhase !== 'NORMAL' && cs.turnSubPhase !== 'DRAWN_DECISION') {
      this.sendError(ws, 'NO PUEDES JUGAR OTRA CARTA ESPECIAL AHORA');
      return;
    }

    const playerHand = activePlayer.hand || [];
    const card = playerHand.find((c) => c.id === cardId);
    if (!card || !isSpecialActionCard(card)) {
      this.sendError(ws, 'CARTA ESPECIAL NO VÁLIDA');
      return;
    }

    // Pre-validate ESPEJO eligibility before removing card from hand
    if (card.rank === 'ESPEJO') {
      if (!activePlayer.lastReflectableEffectReceived) {
        this.sendError(
          ws,
          'NO TIENES NINGÚN PODER RECIENTE CONTRA TI PARA REFLEJAR CON EL ESPEJO'
        );
        return;
      }
    }

    const prevHandCount = playerHand.length;
    activePlayer.hand = playerHand.filter((c) => c.id !== card.id);
    activePlayer.cardsCount = activePlayer.hand.length;

    const safePlayId =
      typeof clientPlayId === 'string' &&
      clientPlayId.trim().length > 0 &&
      !room.centerPileHistory.some((h) => h.playId === clientPlayId)
        ? clientPlayId.trim()
        : `cad_spec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Place card on center pile UNLESS it is BOMBA (active Bomb stays near bomb holder's seat!)
    if (card.rank !== 'BOMBA') {
      room.centerPileCards.push(card);
      room.centerPileCount = room.centerPileCards.length;
      cs.topCard = card;
      cs.discardPileCount = room.centerPileCards.length;

      room.lastPlay = {
        playerId: activePlayer.id,
        playerName: activePlayer.name,
        cardsCount: 1,
        claimedRank: room.tableRank,
        cards: [card],
        timestamp: Date.now(),
        playId: safePlayId,
      };

      room.centerPileHistory.push({
        playId: safePlayId,
        playerId: activePlayer.id,
        playerName: activePlayer.name,
        cardsCount: 1,
        claimedRank: room.tableRank,
        cards: [card],
        timestamp: Date.now(),
      });

      this.broadcastEvent(room.code, {
        type: 'CARD_PLAYED_EVENT',
        playerId: activePlayer.id,
        playerName: activePlayer.name,
        cardsCount: 1,
        playId: safePlayId,
        claimedRank: room.tableRank,
        cards: [card],
      });
    } else {
      room.cadenaActiveBombCard = card;
    }

    // Immediate victory check if playing this special card emptied the player's hand
    // (except K which steals a card back into hand if not winning; wait: if hand reached 0 on J/Q/BOMBA/ESPEJO, they win immediately!)
    if (activePlayer.cardsCount === 0 && card.rank !== 'K') {
      this.endGame(room, activePlayer);
      return;
    }

    this.triggerUltimaWindowIfNeeded(room, activePlayer, prevHandCount);

    switch (card.rank) {
      case 'J': {
        // J — SALTO: skips the next active player, currentNumber unchanged
        const skippedIdx = this.getNextCadenaPlayerIndex(
          room,
          room.activePlayerIndex,
          cs.turnDirection,
          1
        );
        const skippedPlayer = room.players[skippedIdx];
        if (skippedPlayer && skippedPlayer.id !== activePlayer.id) {
          skippedPlayer.lastReflectableEffectReceived = {
            type: 'J',
            sourcePlayerId: activePlayer.id,
            sourcePlayerName: activePlayer.name,
            timestamp: Date.now(),
          };
        }

        this.emitCadenaEvent(room, {
          kind: 'J_SKIP',
          actorPlayerId: activePlayer.id,
          actorPlayerName: activePlayer.name,
          targetPlayerId: skippedPlayer?.id,
          targetPlayerName: skippedPlayer?.name,
          text: `${activePlayer.name} jugó SALTO (J) • Salta a ${
            skippedPlayer?.name || 'rival'
          }`,
        });

        this.finishCadenaPlayerTurn(room, activePlayer, false, 2);
        this.broadcastRoom(room);
        break;
      }

      case 'Q': {
        // Q — REVERSA: reverses turn direction; in 2-player game, returns turn to activePlayer
        cs.turnDirection = (cs.turnDirection * -1) as 1 | -1;
        const activePlayers = this.getActiveCadenaPlayers(room);

        room.players.forEach((p) => {
          if (p.isAlive && p.id !== activePlayer.id) {
            p.lastReflectableEffectReceived = {
              type: 'Q',
              sourcePlayerId: activePlayer.id,
              sourcePlayerName: activePlayer.name,
              timestamp: Date.now(),
            };
          }
        });

        this.emitCadenaEvent(room, {
          kind: 'Q_REVERSE',
          actorPlayerId: activePlayer.id,
          actorPlayerName: activePlayer.name,
          text:
            activePlayers.length === 2
              ? `${activePlayer.name} jugó REVERSA (Q) • Repite turno (2 jugadores)`
              : `${activePlayer.name} jugó REVERSA (Q) • Cambia el sentido de giro`,
        });

        const steps = activePlayers.length === 2 ? 0 : 1;
        this.finishCadenaPlayerTurn(room, activePlayer, false, steps);
        this.broadcastRoom(room);
        break;
      }

      case 'K': {
        // K — ROBO: steal 1 random card from a chosen rival
        const validRivals = room.players.filter(
          (p) => p.isAlive && p.id !== activePlayer.id && (p.hand || []).length > 0
        );
        if (validRivals.length === 0) {
          if (activePlayer.cardsCount === 0) {
            this.endGame(room, activePlayer);
            return;
          }
          this.finishCadenaPlayerTurn(room, activePlayer, false, 1);
          this.broadcastRoom(room);
          return;
        }

        const chosenRival =
          (targetPlayerId && validRivals.find((r) => r.id === targetPlayerId)) ||
          validRivals[0];

        cs.turnSubPhase = 'K_STEAL_PICK';
        cs.stealTargetPlayerId = chosenRival.id;
        room.cadenaIsMirrorSteal = false;
        this.broadcastRoom(room);
        break;
      }

      case 'BOMBA': {
        // BOMBA: place on a chosen rival with 3-turn countdown
        const validRivals = room.players.filter(
          (p) => p.isAlive && p.id !== activePlayer.id
        );
        if (validRivals.length === 0) {
          this.finishCadenaPlayerTurn(room, activePlayer, false, 1);
          this.broadcastRoom(room);
          return;
        }

        const chosenRival =
          targetPlayerId ? validRivals.find((r) => r.id === targetPlayerId) : null;

        if (chosenRival) {
          this.assignBombToTarget(room, activePlayer, chosenRival, false);
          this.finishCadenaPlayerTurn(room, activePlayer, true, 1);
          this.broadcastRoom(room);
        } else {
          cs.turnSubPhase = 'BOMB_SELECT_TARGET';
          this.broadcastRoom(room);
        }
        break;
      }

      case 'ESPEJO': {
        // ESPEJO: reflects the most recent compatible effect back at its source!
        const reflected = activePlayer.lastReflectableEffectReceived!;
        activePlayer.lastReflectableEffectReceived = null;

        const sourcePlayer = room.players.find(
          (p) => p.id === reflected.sourcePlayerId && p.isAlive
        );

        this.emitCadenaEvent(room, {
          kind: 'MIRROR_REFLECTED',
          actorPlayerId: activePlayer.id,
          actorPlayerName: activePlayer.name,
          targetPlayerId: sourcePlayer?.id,
          targetPlayerName: sourcePlayer?.name || reflected.sourcePlayerName,
          reflectedType: reflected.type,
          text: `🪞 ¡ESPEJO! ${activePlayer.name} reflejó ${reflected.type} contra ${
            sourcePlayer?.name || reflected.sourcePlayerName
          }`,
        });

        this.applyMirroredEffect(room, activePlayer, reflected.type, sourcePlayer || null);
        break;
      }
    }
  }

  private applyMirroredEffect(
    room: ServerRoom,
    mirrorPlayer: CantinaPlayer,
    reflectedType: ReflectableSpecialType,
    sourcePlayer: CantinaPlayer | null
  ) {
    if (!room.cadenaState) return;
    const cs = room.cadenaState;

    switch (reflectedType) {
      case 'BOMBA': {
        // Reflect the active Bomb back to sourcePlayer (or next rival if sourcePlayer left)
        const target =
          sourcePlayer ||
          room.players.find((p) => p.isAlive && p.id !== mirrorPlayer.id) ||
          null;
        if (target) {
          // IMPORTANT: Do NOT set lastReflectableEffectReceived when reflecting via Mirror (Requirement 31)
          cs.bombHolderPlayerId = target.id;
          cs.bombHolderPlayerName = target.name;
          cs.bombTurnsRemaining = 3;
        } else {
          cs.bombHolderPlayerId = null;
          cs.bombHolderPlayerName = null;
          cs.bombTurnsRemaining = 0;
        }
        this.finishCadenaPlayerTurn(room, mirrorPlayer, true, 1);
        this.broadcastRoom(room);
        break;
      }

      case 'K': {
        // Mirror player steals a card back from sourcePlayer!
        if (sourcePlayer && (sourcePlayer.hand || []).length > 0) {
          cs.turnSubPhase = 'K_STEAL_PICK';
          cs.stealTargetPlayerId = sourcePlayer.id;
          room.cadenaIsMirrorSteal = true;
          this.broadcastRoom(room);
        } else {
          this.finishCadenaPlayerTurn(room, mirrorPlayer, false, 1);
          this.broadcastRoom(room);
        }
        break;
      }

      case 'J': {
        // Mirror skips sourcePlayer (if sourcePlayer is next, stepCount = 2; otherwise mark sourcePlayer skipped)
        const nextIdx = this.getNextCadenaPlayerIndex(
          room,
          room.activePlayerIndex,
          cs.turnDirection,
          1
        );
        const nextPlayer = room.players[nextIdx];
        if (sourcePlayer && nextPlayer && nextPlayer.id === sourcePlayer.id) {
          this.finishCadenaPlayerTurn(room, mirrorPlayer, false, 2);
        } else if (sourcePlayer) {
          room.cadenaSkippedPlayerId = sourcePlayer.id;
          this.finishCadenaPlayerTurn(room, mirrorPlayer, false, 1);
        } else {
          this.finishCadenaPlayerTurn(room, mirrorPlayer, false, 2);
        }
        this.broadcastRoom(room);
        break;
      }

      case 'Q': {
        // Mirror repeats the reversal
        cs.turnDirection = (cs.turnDirection * -1) as 1 | -1;
        const activePlayers = this.getActiveCadenaPlayers(room);
        const steps = activePlayers.length === 2 ? 0 : 1;
        this.finishCadenaPlayerTurn(room, mirrorPlayer, false, steps);
        this.broadcastRoom(room);
        break;
      }
    }
  }

  private assignBombToTarget(
    room: ServerRoom,
    actor: CantinaPlayer,
    target: CantinaPlayer,
    isDefuseTransfer: boolean
  ) {
    if (!room.cadenaState) return;
    const cs = room.cadenaState;

    cs.bombHolderPlayerId = target.id;
    cs.bombHolderPlayerName = target.name;
    cs.bombTurnsRemaining = 3;

    // Record reflectable effect on target (unless it came from a Mirror)
    target.lastReflectableEffectReceived = {
      type: 'BOMBA',
      sourcePlayerId: actor.id,
      sourcePlayerName: actor.name,
      timestamp: Date.now(),
    };

    this.emitCadenaEvent(room, {
      kind: 'BOMB_PLACED',
      actorPlayerId: actor.id,
      actorPlayerName: actor.name,
      targetPlayerId: target.id,
      targetPlayerName: target.name,
      turnsRemaining: 3,
      text: isDefuseTransfer
        ? `💣 ${actor.name} desactivó la Bomba y se la pasó a ${target.name} (3 turnos)`
        : `💣 ${actor.name} colocó la BOMBA a ${target.name} (3 turnos)`,
    });
  }

  private handleCadenaSelectBombTarget(
    ws: WebSocket,
    room: ServerRoom,
    playerId: string,
    targetPlayerId: string
  ) {
    if (room.config.mode !== 'CADENA' || room.phase !== 'PLAYING' || !room.cadenaState) {
      return;
    }
    const cs = room.cadenaState;
    const activePlayer = room.players[room.activePlayerIndex];
    if (!activePlayer || activePlayer.id !== playerId) {
      this.sendError(ws, 'NO ES TU TURNO');
      return;
    }

    if (
      cs.turnSubPhase !== 'BOMB_SELECT_TARGET' &&
      cs.turnSubPhase !== 'BOMB_PASS_TARGET'
    ) {
      return;
    }

    const target = room.players.find(
      (p) => p.id === targetPlayerId && p.isAlive && p.id !== activePlayer.id
    );
    if (!target) {
      this.sendError(ws, 'SELECCIONA UN RIVAL VÁLIDO');
      return;
    }

    const isDefuseTransfer = cs.turnSubPhase === 'BOMB_PASS_TARGET';
    this.assignBombToTarget(room, activePlayer, target, isDefuseTransfer);

    this.finishCadenaPlayerTurn(room, activePlayer, true, 1);
    this.broadcastRoom(room);
  }

  private handleCadenaStealCard(
    ws: WebSocket,
    room: ServerRoom,
    playerId: string,
    targetPlayerId: string,
    slotIndex: number
  ) {
    if (room.config.mode !== 'CADENA' || room.phase !== 'PLAYING' || !room.cadenaState) {
      return;
    }
    const cs = room.cadenaState;
    const activePlayer = room.players[room.activePlayerIndex];
    if (!activePlayer || activePlayer.id !== playerId) {
      this.sendError(ws, 'NO ES TU TURNO');
      return;
    }

    if (cs.turnSubPhase !== 'K_STEAL_PICK') {
      return;
    }

    // If Mirror locked the target onto sourcePlayer, enforce that target
    const effectiveTargetId = room.cadenaIsMirrorSteal
      ? cs.stealTargetPlayerId || targetPlayerId
      : targetPlayerId || cs.stealTargetPlayerId || '';

    const victim = room.players.find(
      (p) =>
        p.id === effectiveTargetId &&
        p.isAlive &&
        p.id !== activePlayer.id &&
        (p.hand || []).length > 0
    );

    if (!victim || !victim.hand || victim.hand.length === 0) {
      this.sendError(ws, 'EL RIVAL ELEGIDO NO TIENE CARTAS');
      return;
    }

    // Server-authoritative random card selection from victim's hand (slotIndex used as entropy offset)
    const victimHand = victim.hand;
    const randomIdx =
      (Math.floor(Math.random() * victimHand.length) +
        Math.max(0, Number(slotIndex) || 0)) %
      victimHand.length;
    const [stolenCard] = victimHand.splice(randomIdx, 1);
    victim.cardsCount = victimHand.length;

    // Transfer stolen card privately to activePlayer's hand
    activePlayer.hand = [...(activePlayer.hand || []), stolenCard];
    activePlayer.cardsCount = activePlayer.hand.length;

    // Update Última window if victim dropped to 1 card or if activePlayer left 1 card
    if (
      cs.ultimaWindow &&
      cs.ultimaWindow.targetPlayerId === activePlayer.id &&
      activePlayer.cardsCount > 1
    ) {
      cs.ultimaWindow = null;
    }

    // If victim was emptied to 0 cards by being stolen from, check if victim wins
    if (victim.cardsCount === 0) {
      this.endGame(room, victim);
      return;
    }

    // Record reflectable K effect on victim (unless this steal was itself a Mirror reflection)
    if (!room.cadenaIsMirrorSteal) {
      victim.lastReflectableEffectReceived = {
        type: 'K',
        sourcePlayerId: activePlayer.id,
        sourcePlayerName: activePlayer.name,
        timestamp: Date.now(),
      };
    }

    this.emitCadenaEvent(room, {
      kind: 'K_STEAL',
      actorPlayerId: activePlayer.id,
      actorPlayerName: activePlayer.name,
      targetPlayerId: victim.id,
      targetPlayerName: victim.name,
      text: `${activePlayer.name} robó 1 carta al azar de ${victim.name}`,
    });

    // Requirement 22: If stolen card is a NUMERIC card immediately adjacent to currentNumber,
    // allow activePlayer to play it immediately (and continue a chain from their hand)!
    const stolenNumericVal = getCardNumericValue(stolenCard.rank);
    if (
      stolenNumericVal !== null &&
      isCircularlyAdjacent(cs.currentNumber, stolenNumericVal)
    ) {
      cs.turnSubPhase = 'K_FOLLOWUP_CHAIN';
      cs.stolenCardId = stolenCard.id;
      cs.stolenCard = stolenCard;
      cs.stealTargetPlayerId = null;
      this.broadcastRoom(room);
      return;
    }

    // Otherwise stolen card stays in hand and turn ends
    this.finishCadenaPlayerTurn(room, activePlayer, false, 1);
    this.broadcastRoom(room);
  }

  private handleCadenaDrawCard(
    ws: WebSocket,
    room: ServerRoom,
    playerId: string
  ) {
    if (room.config.mode !== 'CADENA' || room.phase !== 'PLAYING' || !room.cadenaState) {
      return;
    }
    const cs = room.cadenaState;
    const activePlayer = room.players[room.activePlayerIndex];
    if (!activePlayer || activePlayer.id !== playerId) {
      this.sendError(ws, 'NO ES TU TURNO');
      return;
    }

    if (cs.turnSubPhase !== 'NORMAL') {
      this.sendError(ws, 'YA HAS REALIZADO UNA ACCIÓN EN ESTE TURNO');
      return;
    }

    const drawn = this.drawCardsFromCadenaDeck(
      room,
      1,
      activePlayer,
      'NORMAL_DRAW'
    );
    if (drawn.length === 0) {
      // No cards left to draw anywhere -> end turn
      this.finishCadenaPlayerTurn(room, activePlayer, false, 1);
      this.broadcastRoom(room);
      return;
    }

    const drawnCard = drawn[0];
    activePlayer.hand = [...(activePlayer.hand || []), drawnCard];
    activePlayer.cardsCount = activePlayer.hand.length;

    if (
      cs.ultimaWindow &&
      cs.ultimaWindow.targetPlayerId === activePlayer.id &&
      activePlayer.cardsCount > 1
    ) {
      cs.ultimaWindow = null;
    }

    // Check if the drawn card is immediately playable (Requirement 18)
    const drawnNum = getCardNumericValue(drawnCard.rank);
    const isDrawnNumericPlayable =
      drawnNum !== null && isCircularlyAdjacent(cs.currentNumber, drawnNum);
    const isDrawnSpecialPlayable =
      isSpecialActionCard(drawnCard) &&
      (drawnCard.rank !== 'ESPEJO' ||
        Boolean(activePlayer.lastReflectableEffectReceived));
    const isDrawnJokerPlayable =
      drawnCard.rank === 'JOKER' &&
      (activePlayer.hand || []).some(
        (other) =>
          other.id !== drawnCard.id &&
          (validateCadenaChain(cs.currentNumber, [drawnCard, other]).valid ||
            validateCadenaChain(cs.currentNumber, [other, drawnCard]).valid)
      );

    if (isDrawnNumericPlayable || isDrawnSpecialPlayable || isDrawnJokerPlayable) {
      cs.turnSubPhase = 'DRAWN_DECISION';
      cs.drawnCardId = drawnCard.id;
      this.broadcastRoom(room);
    } else {
      // Drawn card cannot be played immediately -> turn ends
      this.finishCadenaPlayerTurn(room, activePlayer, false, 1);
      this.broadcastRoom(room);
    }
  }

  private handleCadenaEndTurn(
    ws: WebSocket,
    room: ServerRoom,
    playerId: string
  ) {
    if (room.config.mode !== 'CADENA' || room.phase !== 'PLAYING' || !room.cadenaState) {
      return;
    }
    const cs = room.cadenaState;
    const activePlayer = room.players[room.activePlayerIndex];
    if (!activePlayer || activePlayer.id !== playerId) {
      this.sendError(ws, 'NO ES TU TURNO');
      return;
    }

    if (
      cs.turnSubPhase !== 'DRAWN_DECISION' &&
      cs.turnSubPhase !== 'K_FOLLOWUP_CHAIN'
    ) {
      this.sendError(ws, 'DEBES JUGAR O ROBAR UNA CARTA ANTES DE TERMINAR EL TURNO');
      return;
    }

    this.finishCadenaPlayerTurn(room, activePlayer, false, 1);
    this.broadcastRoom(room);
  }

  private handleCadenaDeclareUltima(
    ws: WebSocket,
    room: ServerRoom,
    playerId: string
  ) {
    if (room.config.mode !== 'CADENA' || room.phase !== 'PLAYING' || !room.cadenaState) {
      return;
    }
    const cs = room.cadenaState;
    const player = room.players.find((p) => p.id === playerId && p.isAlive);
    if (!player) return;

    const uw = cs.ultimaWindow;
    if (!uw || uw.targetPlayerId !== playerId || uw.resolved) {
      return;
    }

    uw.declared = true;
    uw.resolved = true;

    this.emitCadenaEvent(room, {
      kind: 'ULTIMA_DECLARED',
      actorPlayerId: player.id,
      actorPlayerName: player.name,
      text: `¡ÚLTIMA! ${player.name} declaró su última carta a tiempo`,
    });

    this.broadcastRoom(room);
  }

  private handleCadenaCatchUltima(
    ws: WebSocket,
    room: ServerRoom,
    accuserId: string
  ) {
    if (room.config.mode !== 'CADENA' || room.phase !== 'PLAYING' || !room.cadenaState) {
      return;
    }
    const cs = room.cadenaState;
    const accuser = room.players.find((p) => p.id === accuserId && p.isAlive);
    if (!accuser) return;

    const uw = cs.ultimaWindow;

    // Valid catch: ultimaWindow is active for another player who has 1 card and has NOT declared yet!
    if (
      uw &&
      uw.targetPlayerId !== accuserId &&
      !uw.declared &&
      !uw.resolved
    ) {
      const target = room.players.find((p) => p.id === uw.targetPlayerId && p.isAlive);
      if (target && (target.hand || []).length === 1) {
        uw.resolved = true;
        uw.caughtByPlayerId = accuser.id;
        uw.caughtByPlayerName = accuser.name;

        const penalty = this.drawCardsFromCadenaDeck(
          room,
          2,
          target,
          'ULTIMA_PENALTY'
        );
        target.hand = [...(target.hand || []), ...penalty];
        target.cardsCount = target.hand.length;

        this.emitCadenaEvent(room, {
          kind: 'ULTIMA_CAUGHT',
          actorPlayerId: accuser.id,
          actorPlayerName: accuser.name,
          targetPlayerId: target.id,
          targetPlayerName: target.name,
          text: `¡TE HAN PILLADO! ${accuser.name} pilló a ${target.name} sin cantar ¡ÚLTIMA! (+2 cartas)`,
        });

        this.broadcastRoom(room);
        return;
      }
    }

    // Otherwise: False accusation! The false accuser draws 1 card (Requirement 39)
    const penalty = this.drawCardsFromCadenaDeck(
      room,
      1,
      accuser,
      'FALSE_ULTIMA_PENALTY'
    );
    accuser.hand = [...(accuser.hand || []), ...penalty];
    accuser.cardsCount = accuser.hand.length;

    this.emitCadenaEvent(room, {
      kind: 'ULTIMA_FALSE_ACCUSATION',
      actorPlayerId: accuser.id,
      actorPlayerName: accuser.name,
      text: `¡Falsa acusación! ${accuser.name} intentó pillar a destiempo y roba 1 carta`,
    });

    this.broadcastRoom(room);
  }

  // ============================================================
  // CLÁSICO & DIABLO MODE SERVER ENGINE (UNTOUCHED)
  // ============================================================

  private startRound(room: ServerRoom) {
    if (room.roundTransitionTimeout) {
      clearTimeout(room.roundTransitionTimeout);
      room.roundTransitionTimeout = null;
    }

    const alivePlayers = room.players.filter((p) => p.isAlive);
    if (alivePlayers.length <= 1) {
      this.endGame(room, alivePlayers[0] || null);
      return;
    }

    room.currentRound += 1;
    room.phase = 'ROUND_INTRO';
    room.mandatoryChallenge = false;
    room.lastPlay = null;
    room.challengeResult = null;
    room.rouletteResult = null;
    room.centerPileCards = [];
    room.centerPileCount = 0;
    room.centerPileHistory = [];

    room.tableRank = TABLE_RANKS[Math.floor(Math.random() * TABLE_RANKS.length)];

    const deck: Card[] = [];
    let idCounter = 1;

    for (const rank of TABLE_RANKS) {
      for (let i = 0; i < 6; i++) {
        deck.push({ id: `card_${rank}_r${room.currentRound}_${idCounter++}`, rank });
      }
    }

    deck.push({ id: `card_JOKER_r${room.currentRound}_${idCounter++}`, rank: 'JOKER' });
    deck.push({ id: `card_JOKER_r${room.currentRound}_${idCounter++}`, rank: 'JOKER' });

    if (room.config.mode === 'DIABLO') {
      const matchIndex = deck.findIndex((c) => c.rank === room.tableRank);
      if (matchIndex >= 0) {
        deck[matchIndex] = {
          id: `card_DIABLO_r${room.currentRound}_${idCounter++}`,
          rank: 'DIABLO',
        };
      }
    }

    const shuffled = shuffle(deck);

    room.players.forEach((player) => {
      if (player.isAlive) {
        const hand = shuffled.splice(0, 5);
        player.hand = hand;
        player.cardsCount = hand.length;
      } else {
        player.hand = [];
        player.cardsCount = 0;
      }
    });

    const total = room.players.length;
    let startIdx = 0;
    if (room.lastRoundStarterSeatIndex < 0) {
      const firstAlive = room.players.findIndex((p) => p.isAlive);
      startIdx = firstAlive >= 0 ? firstAlive : 0;
    } else {
      for (let offset = 1; offset <= total; offset++) {
        const candidateIdx = (room.lastRoundStarterSeatIndex + offset) % total;
        if (room.players[candidateIdx]?.isAlive) {
          startIdx = candidateIdx;
          break;
        }
      }
    }

    room.lastRoundStarterSeatIndex = startIdx;
    room.activePlayerIndex = startIdx;
    const starterPlayer = room.players[startIdx];
    room.roundStartingPlayerId = starterPlayer ? starterPlayer.id : null;
    room.roundStartingPlayerName = starterPlayer ? starterPlayer.name : null;
    room.roundStartEventId = `deal_${room.code}_r${room.currentRound}_${Date.now()}`;

    this.broadcastEvent(room.code, {
      type: 'DEAL_CARDS_EVENT',
      round: room.currentRound,
      roundStartEventId: room.roundStartEventId,
      startingPlayerId: room.roundStartingPlayerId || '',
      startingPlayerName: room.roundStartingPlayerName || '',
      tableRank: room.tableRank,
      cardsPerPlayer: 5,
    });

    this.broadcastRoom(room);

    room.roundTransitionTimeout = setTimeout(() => {
      room.phase = 'PLAYING';
      this.broadcastRoom(room);
    }, 2400);
  }

  private advanceToNextTurn(
    room: ServerRoom,
    emptiedHand: boolean,
    justPlayedPlayerId: string
  ) {
    const total = room.players.length;

    if (emptiedHand) {
      let nextIdx = (room.activePlayerIndex + 1) % total;
      for (let i = 0; i < total; i++) {
        const candidate = room.players[nextIdx];
        if (candidate && candidate.isAlive && candidate.id !== justPlayedPlayerId) {
          room.activePlayerIndex = nextIdx;
          room.mandatoryChallenge = true;
          return;
        }
        nextIdx = (nextIdx + 1) % total;
      }
    }

    let nextIdx = (room.activePlayerIndex + 1) % total;
    let found = false;

    for (let i = 0; i < total; i++) {
      const candidate = room.players[nextIdx];
      if (candidate.isAlive && (candidate.hand || []).length > 0) {
        found = true;
        break;
      }
      nextIdx = (nextIdx + 1) % total;
    }

    if (found) {
      room.activePlayerIndex = nextIdx;
      room.mandatoryChallenge = false;
    } else {
      let fallbackIdx = (room.activePlayerIndex + 1) % total;
      for (let i = 0; i < total; i++) {
        const candidate = room.players[fallbackIdx];
        if (candidate && candidate.isAlive && candidate.id !== justPlayedPlayerId) {
          room.activePlayerIndex = fallbackIdx;
          room.mandatoryChallenge = true;
          return;
        }
        fallbackIdx = (fallbackIdx + 1) % total;
      }
    }
  }

  private resolveChallenge(room: ServerRoom, accuser: CantinaPlayer) {
    if (!room.lastPlay) return;

    if (room.roundTransitionTimeout) {
      clearTimeout(room.roundTransitionTimeout);
      room.roundTransitionTimeout = null;
    }

    const lastPlay = room.lastPlay;
    const accused = room.players.find((p) => p.id === lastPlay.playerId);
    if (!accused) return;

    const isFinalHandChallenge = Boolean(
      room.mandatoryChallenge || (accused.hand || []).length === 0
    );
    room.mandatoryChallenge = false;

    const revealedCards = lastPlay.cards || [];
    const isDiabloMode = room.config.mode === 'DIABLO';
    const hasDiablo = revealedCards.some((c) => c.rank === 'DIABLO');

    let isBluff = false;
    for (const card of revealedCards) {
      if (card.rank === 'JOKER') continue;
      if (isDiabloMode && card.rank === 'DIABLO') continue;
      if (card.rank !== room.tableRank) {
        isBluff = true;
        break;
      }
    }

    const loser = isBluff ? accused : accuser;
    let description = '';
    let roundWinnerPlayerId: string | null = null;
    let roundWinnerName: string | null = null;

    if (isDiabloMode && hasDiablo) {
      if (isFinalHandChallenge && !isBluff) {
        roundWinnerPlayerId = accused.id;
        roundWinnerName = accused.name;
      }
      description = `¡EL DIABLO DESPIERTA! ${accused.name} queda a salvo. ¡Todos los demás rivales vivos deben enfrentarse al revólver!`;
    } else if (isFinalHandChallenge) {
      if (!isBluff) {
        roundWinnerPlayerId = accused.id;
        roundWinnerName = accused.name;
        description = `${accused.name} se quedó sin cartas con una jugada válida y gana la ronda. ${accuser.name} falló la acusación y debe disparar.`;
      } else {
        roundWinnerPlayerId = null;
        roundWinnerName = null;
        description = `¡Farol en la jugada final! ${accused.name} mintió al quedarse sin cartas y NO gana la ronda. ${accused.name} debe disparar.`;
      }
    } else if (isBluff) {
      description = `¡FAROL DETECTADO! ${accused.name} ha mentido. No todas las cartas eran ${this.getRankName(
        room.tableRank
      )}.`;
    } else {
      description = `¡JUGADA VÁLIDA! ${accused.name} decía la verdad. ${accuser.name} ha fallado la acusación.`;
    }

    const challengeId = `chal_${room.code}_r${room.currentRound}_${Date.now()}`;
    const isDevilEvent = Boolean(hasDiablo && isDiabloMode);
    const devilRevealEventId = isDevilEvent
      ? `devil_${room.code}_r${room.currentRound}_${Date.now()}`
      : undefined;

    room.challengeResult = {
      challengeId,
      devilRevealEventId,
      accuserPlayerId: accuser.id,
      accuserName: accuser.name,
      accusedPlayerId: accused.id,
      accusedName: accused.name,
      claimedRank: room.tableRank,
      revealedCards,
      isBluff,
      loserPlayerId: loser.id,
      loserName: loser.name,
      hasDiablo: isDevilEvent,
      isFinalHandChallenge,
      roundWinnerPlayerId,
      roundWinnerName,
      description,
    };

    if (isDevilEvent) {
      room.phase = 'DEVIL_REVEAL';
      this.broadcastRoom(room);

      room.roundTransitionTimeout = setTimeout(() => {
        this.prepareRoulette(room, loser, true, accused);
      }, 5200);
    } else {
      room.phase = 'REVELACION';
      this.broadcastRoom(room);

      room.roundTransitionTimeout = setTimeout(() => {
        this.prepareRoulette(room, loser, false, accused);
      }, 3400);
    }
  }

  private prepareRoulette(
    room: ServerRoom,
    primaryLoser: CantinaPlayer,
    isDevilSequence: boolean,
    accused: CantinaPlayer
  ) {
    if (room.roundTransitionTimeout) {
      clearTimeout(room.roundTransitionTimeout);
      room.roundTransitionTimeout = null;
    }

    let queuePlayerIds: string[] = [];
    if (isDevilSequence) {
      queuePlayerIds = room.players
        .filter((p) => p.isAlive && p.id !== accused.id)
        .map((p) => p.id);
    } else {
      queuePlayerIds = [primaryLoser.id];
    }

    if (queuePlayerIds.length === 0) {
      this.evaluatePostRoulette(room);
      return;
    }

    this.startInteractiveRouletteStep(
      room,
      queuePlayerIds,
      0,
      isDevilSequence,
      []
    );
  }

  private startInteractiveRouletteStep(
    room: ServerRoom,
    queuePlayerIds: string[],
    stepIndex: number,
    isDevilSequence: boolean,
    completedShots: SingleShotResult[]
  ) {
    if (room.roundTransitionTimeout) {
      clearTimeout(room.roundTransitionTimeout);
      room.roundTransitionTimeout = null;
    }

    const survivors = room.players.filter((p) => p.isAlive);
    if (survivors.length <= 1 || stepIndex >= queuePlayerIds.length) {
      this.evaluatePostRoulette(room);
      return;
    }

    const targetId = queuePlayerIds[stepIndex];
    const shooter = room.players.find((p) => p.id === targetId);
    if (!shooter || !shooter.isAlive) {
      this.startInteractiveRouletteStep(
        room,
        queuePlayerIds,
        stepIndex + 1,
        isDevilSequence,
        completedShots
      );
      return;
    }

    room.phase = 'RULETA';
    const rouletteEventId = `roul_${room.code}_r${room.currentRound}_s${stepIndex}_${Date.now()}`;

    advanceRevolverToNextUntestedChamber(shooter);
    const shooterRevolver = ensurePlayerRevolver(shooter);

    room.rouletteResult = {
      rouletteEventId,
      shotEventId: null,
      stepIndex,
      totalSteps: queuePlayerIds.length,
      targetPlayerId: shooter.id,
      targetPlayerName: shooter.name,
      chamberPullsBefore: shooterRevolver.shotsTaken,
      chamberNumber: Math.min(6, shooterRevolver.shotsTaken + 1),
      cylinderAngle: shooterRevolver.currentRotation,
      firedChamberIndex: shooterRevolver.topChamberIndex,
      firedChambersBefore: [...shooterRevolver.firedChambers],
      shotResolved: false,
      fired: false,
      isFatal: false,
      survived: true,
      isDevilSequence,
      queuePlayerIds,
      shots: completedShots,
    };

    this.broadcastRoom(room);

    if (!shooter.isConnected) {
      room.roundTransitionTimeout = setTimeout(() => {
        this.executeRouletteTriggerPull(room, shooter.id, rouletteEventId);
      }, 3500);
    }
  }

  private executeRouletteTriggerPull(
    room: ServerRoom,
    playerId: string,
    rouletteEventId: string
  ) {
    if (
      room.phase !== 'RULETA' ||
      !room.rouletteResult ||
      room.rouletteResult.shotResolved ||
      room.rouletteResult.rouletteEventId !== rouletteEventId ||
      room.rouletteResult.targetPlayerId !== playerId
    ) {
      return;
    }

    if (room.roundTransitionTimeout) {
      clearTimeout(room.roundTransitionTimeout);
      room.roundTransitionTimeout = null;
    }

    const shooter = room.players.find((p) => p.id === playerId);
    if (!shooter) return;

    const shooterRevolver = ensurePlayerRevolver(shooter);

    const restingAngle = snapAngleToChamber(shooterRevolver.currentRotation);
    const firedChamberIndex = getTopChamberIndexFromAngle(restingAngle);
    shooterRevolver.currentRotation = restingAngle;
    shooterRevolver.topChamberIndex = firedChamberIndex;

    const pullsBefore = shooterRevolver.shotsTaken;
    const fired = firedChamberIndex === shooter.bulletChamber;

    if (!shooterRevolver.firedChambers.includes(firedChamberIndex)) {
      shooterRevolver.firedChambers.push(firedChamberIndex);
    }
    shooterRevolver.shotsTaken = Math.min(6, shooterRevolver.firedChambers.length);
    shooter.chamberPulls = shooterRevolver.shotsTaken;

    if (fired) {
      shooter.isAlive = false;
      shooter.isEliminated = true;
      shooter.eliminatedRound = room.currentRound;
      shooter.hand = [];
      shooter.cardsCount = 0;
    }

    const shotRecord: SingleShotResult = {
      playerId: shooter.id,
      playerName: shooter.name,
      fired,
      chamberNumber: Math.min(6, pullsBefore + 1),
      survived: !fired,
    };

    const updatedShots = [...(room.rouletteResult.shots || []), shotRecord];
    const queuePlayerIds = room.rouletteResult.queuePlayerIds || [shooter.id];
    const currentStep = room.rouletteResult.stepIndex;
    const isDevilSequence = room.rouletteResult.isDevilSequence;

    room.rouletteResult = {
      ...room.rouletteResult,
      shotEventId: `shot_${rouletteEventId}_${Date.now()}`,
      chamberNumber: Math.min(6, pullsBefore + 1),
      cylinderAngle: restingAngle,
      firedChamberIndex,
      shotResolved: true,
      fired,
      isFatal: fired,
      survived: !fired,
      shots: updatedShots,
    };

    this.broadcastRoom(room);

    room.roundTransitionTimeout = setTimeout(() => {
      if (!fired && shooter.isAlive) {
        advanceRevolverToNextUntestedChamber(shooter);
      }

      const survivors = room.players.filter((p) => p.isAlive);
      if (survivors.length <= 1) {
        this.endGame(room, survivors[0] || null);
        return;
      }

      if (currentStep + 1 < queuePlayerIds.length) {
        this.startInteractiveRouletteStep(
          room,
          queuePlayerIds,
          currentStep + 1,
          isDevilSequence,
          updatedShots
        );
      } else {
        this.evaluatePostRoulette(room);
      }
    }, 3500);
  }

  private evaluatePostRoulette(room: ServerRoom) {
    const survivors = room.players.filter((p) => p.isAlive);
    if (survivors.length <= 1) {
      this.endGame(room, survivors[0] || null);
    } else {
      this.startRound(room);
    }
  }

  private endGame(room: ServerRoom, winner: CantinaPlayer | null) {
    if (room.roundTransitionTimeout) {
      clearTimeout(room.roundTransitionTimeout);
      room.roundTransitionTimeout = null;
    }
    room.phase = 'GAME_OVER';
    room.mandatoryChallenge = false;
    room.rematchReadyPlayerIds = [];
    room.winnerPlayerId = winner ? winner.id : null;
    room.winnerName = winner ? winner.name : 'Nadie (todos eliminados)';
    if (room.cadenaState) {
      room.cadenaState.turnSubPhase = 'NORMAL';
      room.cadenaState.ultimaWindow = null;
    }
    this.broadcastRoom(room);
  }

  private resetMatchToLobby(room: ServerRoom, notificationMsg?: string) {
    if (room.roundTransitionTimeout) {
      clearTimeout(room.roundTransitionTimeout);
      room.roundTransitionTimeout = null;
    }
    room.phase = 'LOBBY';
    room.currentRound = 0;
    room.roundStartEventId = '';
    room.lastRoundStarterSeatIndex = -1;
    room.roundStartingPlayerId = null;
    room.roundStartingPlayerName = null;
    room.mandatoryChallenge = false;
    room.rematchReadyPlayerIds = [];
    room.winnerPlayerId = null;
    room.winnerName = null;
    room.lastPlay = null;
    room.challengeResult = null;
    room.rouletteResult = null;
    room.cadenaState = null;
    room.cadenaDrawPile = [];
    room.cadenaActiveBombCard = null;
    room.cadenaIsMirrorSteal = false;
    room.cadenaSkippedPlayerId = null;
    room.centerPileCards = [];
    room.centerPileCount = 0;
    room.centerPileHistory = [];

    room.players.forEach((p) => {
      p.isAlive = true;
      p.isEliminated = false;
      p.eliminatedRound = undefined;
      p.cardsCount = 0;
      p.hand = [];
      p.chamberPulls = 0;
      p.bulletChamber = Math.floor(Math.random() * 6);
      p.revolver = createInitialRevolverState();
      p.lastReflectableEffectReceived = null;
    });

    if (notificationMsg) {
      this.broadcastNotification(room.code, notificationMsg, 'warning');
    }

    this.broadcastRoom(room);
  }

  private handleDisconnect(ws: WebSocket, isExplicitLeave: boolean = false) {
    const conn = this.clients.get(ws);
    if (!conn) return;

    this.clients.delete(ws);
    const room = this.rooms.get(conn.roomCode);
    if (!room) return;

    const player = room.players.find((p) => p.id === conn.playerId);
    if (player) {
      player.isConnected = false;
    }

    if (room.phase === 'LOBBY') {
      room.players = room.players.filter((p) => p.id !== conn.playerId || (!isExplicitLeave && p.isHost));
      room.players.forEach((p, idx) => {
        p.seatIndex = idx;
      });
    } else {
      // Explicit permanent leave during an active match (Requirements 52 & 53)
      if (isExplicitLeave && player) {
        player.isAlive = false;
        player.isEliminated = true;
        // Return their hand cards to draw pile in Cadena mode
        if (room.config.mode === 'CADENA' && room.cadenaState) {
          const cs = room.cadenaState;
          if (player.hand && player.hand.length > 0) {
            room.cadenaDrawPile.push(...player.hand);
            room.cadenaDrawPile = shuffle(room.cadenaDrawPile);
            player.hand = [];
            player.cardsCount = 0;
          }

          // Requirement 53: If Bomb holder permanently leaves, discard/clear the active Bomb
          if (cs.bombHolderPlayerId === player.id) {
            if (room.cadenaActiveBombCard) {
              room.centerPileCards.push(room.cadenaActiveBombCard);
              room.centerPileCount = room.centerPileCards.length;
              room.cadenaActiveBombCard = null;
            }
            cs.bombHolderPlayerId = null;
            cs.bombHolderPlayerName = null;
            cs.bombTurnsRemaining = 0;
          }

          // Clear any Mirror references targeting the player who left
          room.players.forEach((other) => {
            if (
              other.lastReflectableEffectReceived?.sourcePlayerId === player.id
            ) {
              other.lastReflectableEffectReceived = null;
            }
          });

          if (cs.ultimaWindow?.targetPlayerId === player.id) {
            cs.ultimaWindow = null;
          }

          // If the leaving player was the active player, advance turn cleanly
          if (room.players[room.activePlayerIndex]?.id === player.id) {
            cs.turnSubPhase = 'NORMAL';
            cs.drawnCardId = null;
            cs.stealTargetPlayerId = null;
            cs.stolenCardId = null;
            cs.stolenCard = null;
            room.activePlayerIndex = this.getNextCadenaPlayerIndex(
              room,
              room.activePlayerIndex,
              cs.turnDirection,
              1
            );
          }
        }
      }

      const activeConnectedCount = room.players.filter(
        (p) => p.isConnected && p.isAlive
      ).length;
      const connectedCount = room.players.filter((p) => p.isConnected).length;

      if (connectedCount < 2 || (room.phase !== 'GAME_OVER' && activeConnectedCount < 2 && isExplicitLeave)) {
        // Remove explicitly left players so lobby only has remaining players
        if (isExplicitLeave) {
          room.players = room.players.filter((p) => p.id !== conn.playerId);
          room.players.forEach((p, idx) => {
            p.seatIndex = idx;
          });
        }
        this.resetMatchToLobby(
          room,
          'No quedan suficientes jugadores activos en la mesa. Has vuelto a la sala.'
        );
        return;
      }

      if (room.phase === 'GAME_OVER') {
        room.rematchReadyPlayerIds = room.rematchReadyPlayerIds.filter(
          (id) => id !== conn.playerId
        );
        const connectedPlayers = room.players.filter((p) => p.isConnected);
        if (
          connectedPlayers.length >= 2 &&
          connectedPlayers.every((p) => room.rematchReadyPlayerIds.includes(p.id))
        ) {
          this.startMatch(room);
          return;
        }
      } else if (
        room.phase === 'RULETA' &&
        room.rouletteResult &&
        !room.rouletteResult.shotResolved &&
        room.rouletteResult.targetPlayerId === conn.playerId
      ) {
        const eventId = room.rouletteResult.rouletteEventId;
        if (room.roundTransitionTimeout) {
          clearTimeout(room.roundTransitionTimeout);
        }
        room.roundTransitionTimeout = setTimeout(() => {
          this.executeRouletteTriggerPull(room, conn.playerId, eventId);
        }, 2000);
      }
    }

    if (room.hostId === conn.playerId) {
      const nextHost = room.players.find((p) => p.isConnected && p.id !== conn.playerId);
      if (nextHost) {
        room.hostId = nextHost.id;
        nextHost.isHost = true;
        if (player) player.isHost = false;
      }
    }

    const anyConnected = room.players.some((p) => p.isConnected);
    if (!anyConnected) {
      setTimeout(() => {
        const checkRoom = this.rooms.get(conn.roomCode);
        if (checkRoom && !checkRoom.players.some((p) => p.isConnected)) {
          this.rooms.delete(conn.roomCode);
          roomRegistry.unregister(conn.roomCode);
        }
      }, 60000);
    } else {
      this.broadcastRoom(room);
    }
  }

  private sanitizeRoomForPlayer(room: ServerRoom, playerId: string): CantinaRoomState {
    const sanitizedPlayers: CantinaPlayer[] = room.players.map((p) => {
      const isSelf = p.id === playerId;
      const rev = ensurePlayerRevolver(p);
      return {
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        color: p.color,
        seatIndex: p.seatIndex,
        isHost: p.isHost,
        isConnected: p.isConnected,
        isAlive: p.isAlive,
        cardsCount: p.hand ? p.hand.length : p.cardsCount,
        // Private hand is ONLY visible to the player themselves!
        hand: isSelf ? p.hand || [] : undefined,
        chamberPulls: rev.shotsTaken,
        bulletChamber: p.isEliminated ? p.bulletChamber : -1,
        revolver: {
          chambers: 6,
          currentRotation: rev.currentRotation,
          topChamberIndex: rev.topChamberIndex,
          shotsTaken: rev.shotsTaken,
          firedChambers: [...rev.firedChambers],
        },
        isEliminated: p.isEliminated,
        eliminatedRound: p.eliminatedRound,
        lastReflectableEffectReceived: isSelf
          ? p.lastReflectableEffectReceived || null
          : null,
      };
    });

    const activePlayer = room.players[room.activePlayerIndex];
    const isActiveSelf = activePlayer?.id === playerId;

    let sanitizedLastPlay: PlayedTurn | null = null;
    if (room.lastPlay) {
      const revealCards =
        room.config.mode === 'CADENA' ||
        room.phase === 'REVELACION' ||
        room.phase === 'DEVIL_REVEAL' ||
        room.phase === 'RULETA' ||
        room.phase === 'ROUND_END';
      sanitizedLastPlay = {
        playerId: room.lastPlay.playerId,
        playerName: room.lastPlay.playerName,
        cardsCount: room.lastPlay.cardsCount,
        claimedRank: room.lastPlay.claimedRank,
        cards: revealCards ? room.lastPlay.cards : undefined,
        timestamp: room.lastPlay.timestamp,
        playId: room.lastPlay.playId,
      };
    }

    let sanitizedCadenaState: CadenaRoomState | null = null;
    if (room.config.mode === 'CADENA' && room.cadenaState) {
      const rawDrawEvent = room.cadenaState.lastDrawEvent;
      sanitizedCadenaState = {
        ...room.cadenaState,
        // Stolen card identity is ONLY exposed to the active thief!
        stolenCard: isActiveSelf ? room.cadenaState.stolenCard || null : null,
        // Drawn card identities are ONLY exposed to the player who drew them!
        lastDrawEvent: rawDrawEvent
          ? {
              ...rawDrawEvent,
              drawnCards:
                rawDrawEvent.playerId === playerId
                  ? rawDrawEvent.drawnCards
                  : undefined,
            }
          : null,
      };
    }

    return {
      code: room.code,
      gameType: 'la_cantina_del_farol',
      hostId: room.hostId,
      phase: room.phase,
      config: room.config,
      currentRound: room.currentRound,
      tableRank: room.tableRank,
      roundStartEventId: room.roundStartEventId,
      roundStartingPlayerId: room.roundStartingPlayerId,
      roundStartingPlayerName: room.roundStartingPlayerName,
      activePlayerIndex: room.activePlayerIndex,
      activePlayerId: activePlayer ? activePlayer.id : null,
      mandatoryChallenge: room.mandatoryChallenge,
      players: sanitizedPlayers,
      centerPileCount: room.centerPileCount,
      centerPileHistory: room.centerPileHistory,
      lastPlay: sanitizedLastPlay,
      challengeResult: room.challengeResult,
      rouletteResult: room.rouletteResult,
      cadenaState: sanitizedCadenaState,
      winnerPlayerId: room.winnerPlayerId,
      winnerName: room.winnerName,
      rematchReadyPlayerIds: room.rematchReadyPlayerIds,
      abortReason: room.abortReason,
    };
  }

  private broadcastRoom(room: ServerRoom) {
    for (const [ws, conn] of this.clients.entries()) {
      if (conn.roomCode === room.code && ws.readyState === WebSocket.OPEN) {
        const payload = this.sanitizeRoomForPlayer(room, conn.playerId);
        ws.send(JSON.stringify({ type: 'ROOM_STATE', state: payload }));
      }
    }
  }

  private broadcastHandInteraction(
    roomCode: string,
    senderPlayerId: string,
    interaction: string,
    hoveredIndex?: number
  ) {
    for (const [ws, conn] of this.clients.entries()) {
      if (
        conn.roomCode === roomCode &&
        conn.playerId !== senderPlayerId &&
        ws.readyState === WebSocket.OPEN
      ) {
        ws.send(
          JSON.stringify({
            type: 'PLAYER_HAND_INTERACTION',
            playerId: senderPlayerId,
            interaction,
            hoveredIndex,
          })
        );
      }
    }
  }

  private broadcastEvent(roomCode: string, eventPayload: any) {
    for (const [ws, conn] of this.clients.entries()) {
      if (conn.roomCode === roomCode && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(eventPayload));
      }
    }
  }

  private broadcastEventExcept(
    roomCode: string,
    excludePlayerId: string,
    eventPayload: any
  ) {
    for (const [ws, conn] of this.clients.entries()) {
      if (
        conn.roomCode === roomCode &&
        conn.playerId !== excludePlayerId &&
        ws.readyState === WebSocket.OPEN
      ) {
        ws.send(JSON.stringify(eventPayload));
      }
    }
  }

  private broadcastNotification(
    roomCode: string,
    text: string,
    variant: 'info' | 'warning' | 'danger' | 'success'
  ) {
    for (const [ws, conn] of this.clients.entries()) {
      if (conn.roomCode === roomCode && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'NOTIFICATION', text, variant }));
      }
    }
  }

  private sendError(ws: WebSocket, message: string) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ERROR', message }));
    }
  }

  private getRankName(rank: TableRank): string {
    switch (rank) {
      case 'J':
        return 'Jotas (J)';
      case 'Q':
        return 'Reinas (Q)';
      case 'K':
        return 'Reyes (K)';
    }
  }
}
