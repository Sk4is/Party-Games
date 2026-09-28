import { WebSocketServer, WebSocket } from 'ws';
import {
  CantinaRoomState,
  CantinaPlayer,
  CantinaPlayerRevolverState,
  CantinaConfig,
  CantinaClientMessage,
  CantinaServerMessage,
  Card,
  CardRank,
  TableRank,
  PlayedTurn,
  CenterPileItem,
  ChallengeResult,
  RouletteResult,
  SingleShotResult,
} from '../src/types/cantina';
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
  centerPileCards: Card[]; // Server-only, hidden from clients
  centerPileHistory: CenterPileItem[];
  lastPlay: (PlayedTurn & { cards: Card[] }) | null;
  challengeResult: ChallengeResult | null;
  rouletteResult: RouletteResult | null;
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
 * for a given cylinder rotation angle in degrees:
 *   chamber 0 = -90° (at 12 o'clock when angle = 0°)
 *   chamber idx sits at -90° + idx * 60° + angle
 *   => at 12 o'clock when idx ≡ -Math.round(angle / 60) (mod 6)
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
      this.handleDisconnect(ws);
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

        // Authoritatively update this player's personal revolver orientation
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
        // Return to lobby from active match or end state while preserving the room
        this.resetMatchToLobby(room);
        break;
      }

      case 'HAND_INTERACTION': {
        // Ephemeral live interaction: relay to other players in the room
        this.broadcastHandInteraction(
          room.code,
          conn.playerId,
          msg.interaction,
          msg.hoveredIndex
        );
        break;
      }

      case 'LEAVE_ROOM': {
        this.handleDisconnect(ws);
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
    room.centerPileCards = [];
    room.centerPileCount = 0;
    room.centerPileHistory = [];

    // Reset all players for the new match (each player gets their own personal 6-chamber revolver)
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
    });

    this.startRound(room);
  }

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

    // Select table rank from J, Q, K (NO 'A'!)
    room.tableRank = TABLE_RANKS[Math.floor(Math.random() * TABLE_RANKS.length)];

    // Build the 20-card deck:
    // Base deck: 6 J, 6 Q, 6 K, 2 JOKER = 20 total cards.
    const deck: Card[] = [];
    let idCounter = 1;

    for (const rank of TABLE_RANKS) {
      for (let i = 0; i < 6; i++) {
        deck.push({ id: `card_${rank}_r${room.currentRound}_${idCounter++}`, rank });
      }
    }

    // 2 Jokers
    deck.push({ id: `card_JOKER_r${room.currentRound}_${idCounter++}`, rank: 'JOKER' });
    deck.push({ id: `card_JOKER_r${room.currentRound}_${idCounter++}`, rank: 'JOKER' });

    // In DIABLO mode: exactly ONE card of the matching tableRank is transformed into DIABLO!
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

    // Deal 5 cards to each alive player; clear eliminated players' hands
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

    // Server-authoritative round starting player rotation across alive players:
    // Round 1 -> first alive player (seat 0). Subsequent rounds -> next alive seat clockwise.
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

    // Broadcast dealing event for clients to trigger physical deal animation
    this.broadcastEvent(room.code, {
      type: 'DEAL_CARDS_EVENT',
      round: room.currentRound,
      roundStartEventId: room.roundStartEventId,
      startingPlayerId: room.roundStartingPlayerId || '',
      startingPlayerName: room.roundStartingPlayerName || '',
      tableRank: room.tableRank,
    });

    this.broadcastRoom(room);

    // After 2.4 seconds (when dealing & reveal completes), transition to PLAYING
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

    // Requirement 8: When a player plays their final card(s), DO NOT immediately declare them winner.
    // The NEXT alive player is FORCED to accuse: ¡FAROL!
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

    // Normal turn advancement: find next alive player who has cards
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
      // Fallback if no one has cards left: force challenge on next alive player
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

    // Truth checking:
    // Joker is wildcard (always matches table rank).
    // Diablo is also wildcard in Diablo mode.
    // If any card is NOT tableRank, NOT JOKER, and NOT DIABLO -> BLUFF!
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
      // In Devil Mode: if Devil is challenged:
      // Devil player is SAFE! Every OTHER alive player must shoot!
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
      // Requirement 20-23: Pause normal flow and run 5-second Devil card reveal from central pile
      room.phase = 'DEVIL_REVEAL';
      this.broadcastRoom(room);

      room.roundTransitionTimeout = setTimeout(() => {
        this.prepareRoulette(room, loser, true, accused);
      }, 5200);
    } else {
      room.phase = 'REVELACION';
      this.broadcastRoom(room);

      // After 3.4 seconds of card flip & round result presentation, go to interactive RULETA
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
      // Devil player (accused) is SAFE. All other alive rivals shoot in sequence!
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

    // Requirement 28: If only 1 player remains alive, match ends immediately
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

    // Load THIS shooter's personal 6-chamber revolver (never shared with other players)
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

    // If the target shooter is disconnected, auto-pull after 3.5s so the match never stalls
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

    // CRITICAL: Pressing DISPARAR performs ZERO additional cylinder rotation.
    // Evaluate the exact chamber currently physically aligned at 12 o'clock on shooter's personal revolver.
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

    // Allow 3.5 seconds for trigger strike + gunshot/click + elimination/relief presentation
    room.roundTransitionTimeout = setTimeout(() => {
      if (!fired && shooter.isAlive) {
        // Prepare shooter's personal revolver for future rounds AFTER the roulette overlay finishes
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
    });

    if (notificationMsg) {
      this.broadcastNotification(room.code, notificationMsg, 'warning');
    }

    this.broadcastRoom(room);
  }

  private handleDisconnect(ws: WebSocket) {
    const conn = this.clients.get(ws);
    if (!conn) return;

    this.clients.delete(ws);
    const room = this.rooms.get(conn.roomCode);
    if (!room) return;

    const player = room.players.find((p) => p.id === conn.playerId);
    if (player) {
      player.isConnected = false;
    }

    // In lobby, remove disconnected player
    if (room.phase === 'LOBBY') {
      room.players = room.players.filter((p) => p.id !== conn.playerId || p.isHost);
      // Reassign seats
      room.players.forEach((p, idx) => {
        p.seatIndex = idx;
      });
    } else {
      // In active match: if only 1 player remains connected/alive, abort match back to lobby!
      const connectedCount = room.players.filter((p) => p.isConnected).length;
      if (connectedCount < 2) {
        this.resetMatchToLobby(
          room,
          'Los demás jugadores han abandonado la partida. Has vuelto a la sala.'
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

    // If host left, reassign to next connected player
    if (room.hostId === conn.playerId) {
      const nextHost = room.players.find((p) => p.isConnected && p.id !== conn.playerId);
      if (nextHost) {
        room.hostId = nextHost.id;
        nextHost.isHost = true;
        if (player) player.isHost = false;
      }
    }

    // If no players connected, schedule room cleanup
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
        // Hand is ONLY visible to the player themselves!
        hand: isSelf ? p.hand || [] : undefined,
        chamberPulls: rev.shotsTaken,
        // Bullet chamber is NEVER exposed to any client while the player is alive!
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
      };
    });

    const activePlayer = room.players[room.activePlayerIndex];

    let sanitizedLastPlay: PlayedTurn | null = null;
    if (room.lastPlay) {
      const revealCards =
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
      // Send only to OTHER players
      if (conn.roomCode === roomCode && conn.playerId !== senderPlayerId && ws.readyState === WebSocket.OPEN) {
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

  private broadcastNotification(roomCode: string, text: string, variant: 'info' | 'warning' | 'danger' | 'success') {
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
