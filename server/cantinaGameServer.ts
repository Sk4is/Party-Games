import { WebSocketServer, WebSocket } from 'ws';
import {
  CantinaRoomState,
  CantinaPlayer,
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
  activePlayerIndex: number;
  players: CantinaPlayer[];
  centerPileCount: number;
  centerPileCards: Card[]; // Server-only, hidden from clients
  centerPileHistory: CenterPileItem[];
  lastPlay: (PlayedTurn & { cards: Card[] }) | null;
  challengeResult: ChallengeResult | null;
  rouletteResult: RouletteResult | null;
  winnerPlayerId: string | null;
  winnerName: string | null;
  roundTransitionTimeout: NodeJS.Timeout | null;
  abortReason?: string;
}

const DEFAULT_CONFIG: CantinaConfig = {
  mode: 'CLASICO',
  mapId: 'mapa3',
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
      activePlayerIndex: 0,
      players: [initialPlayer],
      centerPileCount: 0,
      centerPileCards: [],
      centerPileHistory: [],
      lastPlay: null,
      challengeResult: null,
      rouletteResult: null,
      winnerPlayerId: null,
      winnerName: null,
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
        const activePlayer = room.players[room.activePlayerIndex];
        if (!activePlayer || activePlayer.id !== conn.playerId) {
          this.sendError(ws, 'NO ES TU TURNO');
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

        // Add to center pile
        room.centerPileCards.push(...playedCards);
        room.centerPileCount = room.centerPileCards.length;

        const playId = `play_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
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

        // Advance to next active alive player with cards
        this.advanceToNextTurn(room);
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

      case 'TRIGGER_ROULETTE': {
        if (room.phase !== 'RULETA') return;
        this.broadcastRoom(room);
        break;
      }

      case 'NEXT_ROUND': {
        if (room.hostId !== conn.playerId) return;
        if (room.phase === 'ROUND_END') {
          this.startRound(room);
        }
        break;
      }

      case 'RESTART_MATCH': {
        if (room.hostId !== conn.playerId) return;
        this.resetMatchToLobby(room);
        break;
      }

      case 'RETURN_TO_LOBBY': {
        // Return to lobby from active match or end state
        this.resetMatchToLobby(room);
        break;
      }

      case 'HAND_INTERACTION': {
        // Ephemeral live interaction: relay to other players in the room
        this.broadcastHandInteraction(room.code, conn.playerId, msg.interaction, msg.hoveredIndex);
        break;
      }

      case 'LEAVE_ROOM': {
        this.handleDisconnect(ws);
        break;
      }
    }
  }

  private startMatch(room: ServerRoom) {
    room.currentRound = 0;
    room.winnerPlayerId = null;
    room.winnerName = null;
    room.centerPileCards = [];
    room.centerPileCount = 0;
    room.centerPileHistory = [];

    // Reset all players
    room.players.forEach((p, idx) => {
      p.seatIndex = idx;
      p.isAlive = true;
      p.isEliminated = false;
      p.chamberPulls = 0;
      p.bulletChamber = Math.floor(Math.random() * 6);
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
        deck.push({ id: `card_${rank}_${idCounter++}`, rank });
      }
    }

    // 2 Jokers
    deck.push({ id: `card_JOKER_${idCounter++}`, rank: 'JOKER' });
    deck.push({ id: `card_JOKER_${idCounter++}`, rank: 'JOKER' });

    // In DIABLO mode: exactly ONE card of the matching tableRank is transformed into DIABLO!
    // Example: if tableRank is Q, deck has 6 J, 5 Q, 6 K, 2 Joker, 1 Devil = 20 total cards!
    if (room.config.mode === 'DIABLO') {
      const matchIndex = deck.findIndex((c) => c.rank === room.tableRank);
      if (matchIndex >= 0) {
        deck[matchIndex] = { id: `card_DIABLO_${idCounter++}`, rank: 'DIABLO' };
      }
    }

    const shuffled = shuffle(deck);

    // Deal 5 cards to each alive player
    alivePlayers.forEach((player) => {
      const hand = shuffled.splice(0, 5);
      player.hand = hand;
      player.cardsCount = hand.length;
    });

    // Start with the first alive player
    const firstAliveIndex = room.players.findIndex((p) => p.isAlive);
    room.activePlayerIndex = firstAliveIndex >= 0 ? firstAliveIndex : 0;

    // Broadcast dealing event for clients to trigger physical deal animation
    this.broadcastEvent(room.code, {
      type: 'DEAL_CARDS_EVENT',
      round: room.currentRound,
    });

    this.broadcastRoom(room);

    // After 2.5 seconds, transition to PLAYING
    room.roundTransitionTimeout = setTimeout(() => {
      room.phase = 'PLAYING';
      this.broadcastRoom(room);
    }, 2500);
  }

  private advanceToNextTurn(room: ServerRoom) {
    const total = room.players.length;
    let nextIdx = (room.activePlayerIndex + 1) % total;
    let found = false;

    // Look for next alive player who has cards
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
    } else {
      // All alive players are out of cards! Redeal a new round
      this.startRound(room);
    }
  }

  private resolveChallenge(room: ServerRoom, accuser: CantinaPlayer) {
    if (!room.lastPlay) return;

    const lastPlay = room.lastPlay;
    const accused = room.players.find((p) => p.id === lastPlay.playerId);
    if (!accused) return;

    room.phase = 'REVELACION';

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

    let loser = isBluff ? accused : accuser;
    let description = '';

    if (isDiabloMode && hasDiablo) {
      // In Devil Mode: if Devil is challenged:
      // Devil player is SAFE! Every OTHER alive player must shoot!
      description = `¡CARTA DEL DIABLO EN JUEGO! ${accused.name} se salva por el poder del Diablo. ¡Toda la mesa restante debe probar su suerte en el revólver!`;
    } else if (isBluff) {
      description = `¡FAROL DETECTADO! ${accused.name} ha mentido. No todas las cartas eran ${this.getRankName(room.tableRank)}.`;
    } else {
      description = `¡VERDAD PURA! ${accused.name} decía la verdad. ${accuser.name} ha fallado la acusación.`;
    }

    room.challengeResult = {
      accuserPlayerId: accuser.id,
      accuserName: accuser.name,
      accusedPlayerId: accused.id,
      accusedName: accused.name,
      claimedRank: room.tableRank,
      revealedCards,
      isBluff,
      loserPlayerId: loser.id,
      loserName: loser.name,
      hasDiablo: hasDiablo && isDiabloMode,
      description,
    };

    this.broadcastRoom(room);

    // After 3.5 seconds of card flip suspense, go to RULETA
    room.roundTransitionTimeout = setTimeout(() => {
      this.prepareRoulette(room, loser, hasDiablo && isDiabloMode, accused);
    }, 3500);
  }

  private prepareRoulette(
    room: ServerRoom,
    primaryLoser: CantinaPlayer,
    isDevilSequence: boolean,
    accused: CantinaPlayer
  ) {
    room.phase = 'RULETA';

    if (isDevilSequence) {
      // DEVIL SEQUENCE: Devil player is SAFE. Every OTHER alive player must shoot in sequence!
      const shooters = room.players.filter((p) => p.isAlive && p.id !== accused.id);
      const shots: SingleShotResult[] = [];

      shooters.forEach((shooter) => {
        const pull = shooter.chamberPulls;
        const fired = pull === shooter.bulletChamber;
        shooter.chamberPulls += 1;

        if (fired) {
          shooter.isAlive = false;
          shooter.isEliminated = true;
          shooter.eliminatedRound = room.currentRound;
        }

        shots.push({
          playerId: shooter.id,
          playerName: shooter.name,
          fired,
          chamberNumber: pull + 1,
          survived: !fired,
        });
      });

      // Initialize sequential roulette presentation
      room.rouletteResult = {
        stepIndex: 0,
        totalSteps: shots.length,
        targetPlayerId: shots[0]?.playerId || primaryLoser.id,
        targetPlayerName: shots[0]?.playerName || primaryLoser.name,
        fired: shots[0]?.fired || false,
        chamberNumber: shots[0]?.chamberNumber || 1,
        isFatal: shots[0]?.fired || false,
        survived: shots[0]?.survived ?? true,
        isDevilSequence: true,
        shots,
      };

      this.broadcastRoom(room);

      // Sequence each shot with 3 seconds gap
      this.runDevilShotSequence(room, 0);
    } else {
      // Normal single roulette pull
      const pull = primaryLoser.chamberPulls;
      const fired = pull === primaryLoser.bulletChamber;
      primaryLoser.chamberPulls += 1;

      if (fired) {
        primaryLoser.isAlive = false;
        primaryLoser.isEliminated = true;
        primaryLoser.eliminatedRound = room.currentRound;
      }

      room.rouletteResult = {
        stepIndex: 0,
        totalSteps: 1,
        targetPlayerId: primaryLoser.id,
        targetPlayerName: primaryLoser.name,
        fired,
        chamberNumber: pull + 1,
        isFatal: fired,
        survived: !fired,
        isDevilSequence: false,
        shots: [
          {
            playerId: primaryLoser.id,
            playerName: primaryLoser.name,
            fired,
            chamberNumber: pull + 1,
            survived: !fired,
          },
        ],
      };

      this.broadcastRoom(room);

      // After 4.2 seconds, evaluate match state
      room.roundTransitionTimeout = setTimeout(() => {
        this.evaluatePostRoulette(room);
      }, 4200);
    }
  }

  private runDevilShotSequence(room: ServerRoom, currentStep: number) {
    if (!room.rouletteResult || !room.rouletteResult.shots) return;
    const shots = room.rouletteResult.shots;

    if (currentStep < shots.length) {
      const shot = shots[currentStep];
      room.rouletteResult.stepIndex = currentStep;
      room.rouletteResult.targetPlayerId = shot.playerId;
      room.rouletteResult.targetPlayerName = shot.playerName;
      room.rouletteResult.fired = shot.fired;
      room.rouletteResult.chamberNumber = shot.chamberNumber;
      room.rouletteResult.isFatal = shot.fired;
      room.rouletteResult.survived = shot.survived;

      this.broadcastRoom(room);

      room.roundTransitionTimeout = setTimeout(() => {
        this.runDevilShotSequence(room, currentStep + 1);
      }, 3200);
    } else {
      this.evaluatePostRoulette(room);
    }
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
    room.phase = 'GAME_OVER';
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
      p.cardsCount = 0;
      p.hand = [];
      p.chamberPulls = 0;
      p.bulletChamber = Math.floor(Math.random() * 6);
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
        chamberPulls: p.chamberPulls,
        bulletChamber: p.isEliminated || isSelf ? p.bulletChamber : 0,
        isEliminated: p.isEliminated,
        eliminatedRound: p.eliminatedRound,
      };
    });

    const activePlayer = room.players[room.activePlayerIndex];

    let sanitizedLastPlay: PlayedTurn | null = null;
    if (room.lastPlay) {
      const revealCards =
        room.phase === 'REVELACION' || room.phase === 'RULETA' || room.phase === 'ROUND_END';
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
      activePlayerIndex: room.activePlayerIndex,
      activePlayerId: activePlayer ? activePlayer.id : null,
      players: sanitizedPlayers,
      centerPileCount: room.centerPileCount,
      centerPileHistory: room.centerPileHistory,
      lastPlay: sanitizedLastPlay,
      challengeResult: room.challengeResult,
      rouletteResult: room.rouletteResult,
      winnerPlayerId: room.winnerPlayerId,
      winnerName: room.winnerName,
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
