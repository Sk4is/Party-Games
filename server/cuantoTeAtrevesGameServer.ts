import { WebSocketServer, WebSocket } from 'ws';
import {
  CuantoTeAtrevesRoomState,
  CuantoTeAtrevesPlayer,
  CuantoTeAtrevesConfig,
  CuantoTeAtrevesClientMessage,
  CuantoTeAtrevesServerMessage,
  CuantoTeAtrevesChallengesCount,
  CuantoTeAtrevesTopic,
  CuantoTeAtrevesLastResult,
  CUANTO_TE_ATREVES_TOPICS,
  pickBalancedTopic,
} from '../src/types/cuantoTeAtreves';
import { roomRegistry } from './roomRegistry';

interface ClientConnection {
  ws: WebSocket;
  playerId: string;
  roomId: string;
}

interface ServerRoom {
  code: string;
  gameType: 'cuanto-te-atreves';
  hostId: string;
  phase: CuantoTeAtrevesRoomState['phase'];
  config: CuantoTeAtrevesConfig;
  players: CuantoTeAtrevesPlayer[];
  currentChallengeNumber: number;
  activePlayerId: string | null;
  currentTopic: CuantoTeAtrevesTopic | null;
  usedTopicIds: Set<string>;
  recentCategories: string[];
  targetBet: number | null;
  timerInterval: NodeJS.Timeout | null;
  timerSecondsRemaining: number;
  isTimerRunning: boolean;
  isTimerPaused: boolean;
  lastResult: CuantoTeAtrevesLastResult | null;
  hasResolvedCurrentChallenge: boolean;
  abortReason?: string;
}

const DEFAULT_CONFIG: CuantoTeAtrevesConfig = {
  challengeTimeSeconds: 45,
  challengesCount: 10,
};

export class CuantoTeAtrevesServer {
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
        const msg = JSON.parse(data.toString()) as CuantoTeAtrevesClientMessage;
        this.handleClientMessage(ws, msg);
      } catch (err) {
        console.error('[CuantoTeAtrevesServer] Error parsing client message:', err);
      }
    });

    ws.on('close', () => {
      this.handleDisconnect(ws);
    });

    ws.on('error', (err) => {
      console.error('[CuantoTeAtrevesServer] WebSocket error:', err);
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
      minPlayers: 3,
      maxPlayers: 10,
      isFull: room.players.length >= 10,
      playerIds: room.players.map((p) => p.id),
      createdAt: Date.now(),
    };
  }

  private pickNextTopic(room: ServerRoom): CuantoTeAtrevesTopic {
    const { topic } = pickBalancedTopic(room.usedTopicIds, room.recentCategories);
    room.recentCategories.push(topic.category);
    if (room.recentCategories.length > 8) {
      room.recentCategories.shift();
    }
    return topic;
  }

  public createRoomDirect(
    hostPlayer: { id: string; name: string; avatar?: string; color?: string },
    config?: Partial<CuantoTeAtrevesConfig>
  ): { code: string; room: CuantoTeAtrevesRoomState } {
    const code = roomRegistry.generateCode();
    const cleanCode = code.toUpperCase().trim();

    const initialPlayer: CuantoTeAtrevesPlayer = {
      id: hostPlayer.id,
      name: (hostPlayer.name || 'Desafiante').trim(),
      avatar: hostPlayer.avatar || '🔥',
      color: hostPlayer.color || '#F97316',
      isHost: true,
      isConnected: true,
      isReady: true,
      score: 0,
      challengesCompleted: 0,
    };

    const sanitizedTime =
      config?.challengeTimeSeconds && config.challengeTimeSeconds >= 15 && config.challengeTimeSeconds <= 90
        ? Math.round(config.challengeTimeSeconds / 5) * 5
        : DEFAULT_CONFIG.challengeTimeSeconds;

    const sanitizedCount: CuantoTeAtrevesChallengesCount =
      config?.challengesCount && [5, 10, 20, 'unlimited'].includes(config.challengesCount)
        ? config.challengesCount
        : DEFAULT_CONFIG.challengesCount;

    const roomConfig: CuantoTeAtrevesConfig = {
      challengeTimeSeconds: sanitizedTime,
      challengesCount: sanitizedCount,
    };

    const serverRoom: ServerRoom = {
      code: cleanCode,
      gameType: 'cuanto-te-atreves',
      hostId: hostPlayer.id,
      phase: 'LOBBY',
      config: roomConfig,
      players: [initialPlayer],
      currentChallengeNumber: 0,
      activePlayerId: null,
      currentTopic: null,
      usedTopicIds: new Set<string>(),
      recentCategories: [],
      targetBet: null,
      timerInterval: null,
      timerSecondsRemaining: 0,
      isTimerRunning: false,
      isTimerPaused: false,
      lastResult: null,
      hasResolvedCurrentChallenge: false,
    };

    this.rooms.set(cleanCode, serverRoom);
    roomRegistry.register(cleanCode, 'cuanto-te-atreves', 'cuanto-te-atreves');

    return {
      code: cleanCode,
      room: this.sanitizeRoomForPlayer(serverRoom, hostPlayer.id),
    };
  }

  private handleClientMessage(ws: WebSocket, msg: CuantoTeAtrevesClientMessage) {
    if (msg.type === 'PING') {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'PONG' }));
      }
      return;
    }

    if (msg.type === 'RECONNECT') {
      const code = (msg.code || '').toUpperCase().trim();
      const room = this.rooms.get(code);
      if (!room) {
        ws.send(JSON.stringify({ type: 'ERROR', message: 'NO SE HA ENCONTRADO ESA SALA' }));
        return;
      }
      const player = room.players.find((p) => p.id === msg.playerId);
      if (!player) {
        ws.send(JSON.stringify({ type: 'ERROR', message: 'NO SE HA ENCONTRADO AL JUGADOR EN ESTA SALA' }));
        return;
      }

      // Evict old socket
      this.clients.forEach((c, sock) => {
        if (c.playerId === player.id && sock !== ws) {
          this.clients.delete(sock);
          try {
            sock.close(1000, 'Reemplazado por nueva sesión');
          } catch {}
        }
      });

      player.isConnected = true;
      this.clients.set(ws, { ws, playerId: player.id, roomId: room.code });
      this.broadcastRoom(room);
      return;
    }

    if (msg.type === 'JOIN_ROOM') {
      const code = (msg.code || '').toUpperCase().trim();
      const room = this.rooms.get(code);
      if (!room) {
        ws.send(JSON.stringify({ type: 'ERROR', message: 'NO SE HA ENCONTRADO ESA SALA' }));
        return;
      }

      let player = room.players.find((p) => p.id === msg.player.id);
      if (player) {
        player.isConnected = true;
        if (msg.player.name) player.name = msg.player.name.trim().slice(0, 20);
        if (msg.player.avatar) player.avatar = msg.player.avatar;
        if (msg.player.color) player.color = msg.player.color;
      } else {
        if (room.phase !== 'LOBBY') {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'LA PARTIDA YA HA EMPEZADO' }));
          return;
        }
        if (room.players.length >= 10) {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'SALA COMPLETA (MÁXIMO 10 JUGADORES)' }));
          return;
        }

        player = {
          id: msg.player.id,
          name: (msg.player.name || 'Desafiante').trim().slice(0, 20),
          avatar: msg.player.avatar || '🔥',
          color: msg.player.color || '#F97316',
          isHost: room.players.length === 0,
          isConnected: true,
          isReady: false,
          score: 0,
          challengesCompleted: 0,
        };
        room.players.push(player);
      }

      // Evict old socket
      const targetId = player.id;
      this.clients.forEach((c, sock) => {
        if (c.playerId === targetId && sock !== ws) {
          this.clients.delete(sock);
          try {
            sock.close(1000, 'Reemplazado por nueva sesión');
          } catch {}
        }
      });

      this.clients.set(ws, { ws, playerId: player.id, roomId: room.code });
      this.broadcastRoom(room);
      return;
    }

    const client = this.clients.get(ws);
    if (!client) return;

    const room = this.rooms.get(client.roomId);
    if (!room) return;

    if (msg.type === 'UPDATE_CONFIG') {
      if (room.hostId === client.playerId && room.phase === 'LOBBY') {
        const nextTime =
          msg.config.challengeTimeSeconds !== undefined
            ? Math.max(15, Math.min(90, Math.round(msg.config.challengeTimeSeconds / 5) * 5))
            : room.config.challengeTimeSeconds;

        const nextCount =
          msg.config.challengesCount !== undefined ? msg.config.challengesCount : room.config.challengesCount;

        room.config = {
          challengeTimeSeconds: nextTime,
          challengesCount: nextCount,
        };
        this.broadcastRoom(room);
      }
      return;
    }

    if (msg.type === 'TOGGLE_READY') {
      const player = room.players.find((p) => p.id === client.playerId);
      if (player && room.phase === 'LOBBY') {
        player.isReady = Boolean(msg.isReady);
        this.broadcastRoom(room);
      }
      return;
    }

    if (msg.type === 'START_GAME') {
      if (room.hostId !== client.playerId || room.phase !== 'LOBBY') return;
      const connectedCount = room.players.filter((p) => p.isConnected).length;
      if (connectedCount < 3) {
        ws.send(JSON.stringify({ type: 'ERROR', message: 'SE NECESITAN AL MENOS 3 JUGADORES PARA COMENZAR' }));
        return;
      }
      if (room.players.length > 10) {
        ws.send(JSON.stringify({ type: 'ERROR', message: 'MÁXIMO 10 JUGADORES PERMITIDOS' }));
        return;
      }

      // Reset scores and challenge counts
      room.players.forEach((p) => {
        p.score = 0;
        p.challengesCompleted = 0;
      });

      room.currentChallengeNumber = 1;
      room.usedTopicIds.clear();
      room.recentCategories = [];
      room.currentTopic = this.pickNextTopic(room);
      room.activePlayerId = null;
      room.targetBet = null;
      room.isTimerRunning = false;
      room.isTimerPaused = false;
      room.lastResult = null;
      room.hasResolvedCurrentChallenge = false;
      room.phase = 'TOPIC_REVEAL';

      this.broadcastRoom(room);
      return;
    }

    // Phase B: Admin selects player who attempts the challenge
    if (msg.type === 'SELECT_PLAYER') {
      if (room.hostId !== client.playerId) return;
      if (room.phase !== 'TOPIC_REVEAL' && room.phase !== 'BETTING') return;

      const target = room.players.find((p) => p.id === msg.playerId && p.isConnected);
      if (!target) return;

      room.activePlayerId = target.id;
      room.phase = 'BETTING';
      room.targetBet = null;
      this.broadcastRoom(room);
      return;
    }

    // Phase C: Bet number entry (positive integer)
    if (msg.type === 'SET_BET') {
      if (room.hostId !== client.playerId) return;
      if (room.phase !== 'BETTING') return;

      const betVal = Math.floor(Number(msg.bet));
      if (betVal > 0) {
        room.targetBet = betVal;
        this.broadcastRoom(room);
      }
      return;
    }

    // Phase D: Admin starts countdown
    if (msg.type === 'START_CHALLENGE') {
      if (room.hostId !== client.playerId) return;
      if (room.phase !== 'BETTING') return;
      if (!room.activePlayerId || !room.targetBet || room.targetBet <= 0) {
        ws.send(JSON.stringify({ type: 'ERROR', message: 'Introduce una apuesta válida antes de comenzar' }));
        return;
      }

      room.phase = 'CHALLENGE_ACTIVE';
      room.timerSecondsRemaining = room.config.challengeTimeSeconds;
      room.isTimerRunning = true;
      room.isTimerPaused = false;
      room.hasResolvedCurrentChallenge = false;

      if (room.timerInterval) clearInterval(room.timerInterval);
      room.timerInterval = setInterval(() => {
        if (room.isTimerPaused) return;

        room.timerSecondsRemaining -= 1;
        if (room.timerSecondsRemaining <= 0) {
          if (room.timerInterval) {
            clearInterval(room.timerInterval);
            room.timerInterval = null;
          }
          room.isTimerRunning = false;

          // Phase F: Timer expired without early success
          if (!room.hasResolvedCurrentChallenge) {
            room.hasResolvedCurrentChallenge = true;
            const activePlayer = room.players.find((p) => p.id === room.activePlayerId);
            room.lastResult = {
              success: false,
              surrendered: false,
              expired: true,
              targetBet: room.targetBet || 0,
              pointsAwarded: 0,
              playerId: activePlayer?.id || '',
              playerName: activePlayer?.name || 'Desafiante',
            };
            room.phase = 'CHALLENGE_RESULT';
            this.broadcastRoom(room);
          }
        } else {
          // Heartbeat broadcast every 3 seconds or in final 5 seconds
          if (room.timerSecondsRemaining % 3 === 0 || room.timerSecondsRemaining <= 5) {
            this.broadcastRoom(room);
          }
        }
      }, 1000);

      this.broadcastRoom(room);
      return;
    }

    // Phase E: Early Success or Surrender
    if (msg.type === 'RESOLVE_CHALLENGE') {
      if (room.hostId !== client.playerId) return;
      if (room.phase !== 'CHALLENGE_ACTIVE' || room.hasResolvedCurrentChallenge) return;

      room.hasResolvedCurrentChallenge = true;
      if (room.timerInterval) {
        clearInterval(room.timerInterval);
        room.timerInterval = null;
      }
      room.isTimerRunning = false;
      room.isTimerPaused = false;

      const activePlayer = room.players.find((p) => p.id === room.activePlayerId);
      const bet = room.targetBet || 0;

      if (msg.outcome === 'SUCCESS') {
        // Scoring rules: bet < 10 -> +2 points, bet >= 10 -> +3 points
        const points = bet >= 10 ? 3 : 2;
        if (activePlayer) {
          activePlayer.score += points;
          activePlayer.challengesCompleted += 1;
        }
        room.lastResult = {
          success: true,
          surrendered: false,
          expired: false,
          targetBet: bet,
          pointsAwarded: points,
          playerId: activePlayer?.id || '',
          playerName: activePlayer?.name || 'Desafiante',
        };
      } else {
        // Surrendered
        room.lastResult = {
          success: false,
          surrendered: true,
          expired: false,
          targetBet: bet,
          pointsAwarded: 0,
          playerId: activePlayer?.id || '',
          playerName: activePlayer?.name || 'Desafiante',
        };
      }

      room.phase = 'CHALLENGE_RESULT';
      this.broadcastRoom(room);
      return;
    }

    if (msg.type === 'TOGGLE_PAUSE_TIMER') {
      if (room.hostId !== client.playerId) return;
      if (room.phase === 'CHALLENGE_ACTIVE') {
        room.isTimerPaused = !room.isTimerPaused;
        this.broadcastRoom(room);
      }
      return;
    }

    if (msg.type === 'NEXT_ROUND') {
      if (room.hostId !== client.playerId) return;
      if (room.phase !== 'CHALLENGE_RESULT') return;

      const totalAllowed = room.config.challengesCount;
      if (typeof totalAllowed === 'number' && room.currentChallengeNumber >= totalAllowed) {
        room.phase = 'GAME_OVER';
      } else {
        room.currentChallengeNumber += 1;
        room.currentTopic = this.pickNextTopic(room);
        room.activePlayerId = null;
        room.targetBet = null;
        room.isTimerRunning = false;
        room.isTimerPaused = false;
        room.hasResolvedCurrentChallenge = false;
        room.phase = 'TOPIC_REVEAL';
      }

      this.broadcastRoom(room);
      return;
    }

    if (msg.type === 'FINISH_GAME') {
      if (room.hostId !== client.playerId) return;
      if (room.timerInterval) {
        clearInterval(room.timerInterval);
        room.timerInterval = null;
      }
      room.phase = 'GAME_OVER';
      this.broadcastRoom(room);
      return;
    }

    if (msg.type === 'TRANSFER_HOST') {
      if (room.hostId === client.playerId && room.phase === 'LOBBY') {
        const nextHost = room.players.find((p) => p.id === msg.targetPlayerId && p.isConnected);
        if (nextHost) {
          room.players.forEach((p) => {
            p.isHost = p.id === nextHost.id;
          });
          room.hostId = nextHost.id;
          this.broadcastRoom(room);
        }
      }
      return;
    }

    if (msg.type === 'KICK_PLAYER') {
      if (room.hostId === client.playerId && room.phase === 'LOBBY' && msg.targetPlayerId !== client.playerId) {
        this.removePlayer(msg.targetPlayerId, room);
      }
      return;
    }

    if (msg.type === 'RETURN_TO_LOBBY') {
      if (room.hostId === client.playerId) {
        if (room.timerInterval) {
          clearInterval(room.timerInterval);
          room.timerInterval = null;
        }
        room.phase = 'LOBBY';
        room.currentChallengeNumber = 0;
        room.activePlayerId = null;
        room.currentTopic = null;
        room.targetBet = null;
        room.timerSecondsRemaining = 0;
        room.isTimerRunning = false;
        room.isTimerPaused = false;
        room.lastResult = null;
        room.hasResolvedCurrentChallenge = false;
        room.players.forEach((p) => {
          p.isReady = false;
        });
        this.broadcastRoom(room);
      }
      return;
    }

    if (msg.type === 'LEAVE_ROOM') {
      this.clients.delete(ws);
      this.removePlayer(client.playerId, room);
      return;
    }
  }

  private handleDisconnect(ws: WebSocket) {
    const client = this.clients.get(ws);
    if (!client) return;

    this.clients.delete(ws);
    const room = this.rooms.get(client.roomId);
    if (!room) return;

    let hasOtherOpenSocket = false;
    this.clients.forEach((c) => {
      if (c.roomId === client.roomId && c.playerId === client.playerId && c.ws.readyState === WebSocket.OPEN) {
        hasOtherOpenSocket = true;
      }
    });

    if (hasOtherOpenSocket) return;

    const player = room.players.find((p) => p.id === client.playerId);
    if (player) {
      player.isConnected = false;
    }

    // 90 seconds grace period
    setTimeout(() => {
      const currentRoom = this.rooms.get(client.roomId);
      if (!currentRoom) return;

      const p = currentRoom.players.find((item) => item.id === client.playerId);
      if (p && !p.isConnected) {
        const connectedPlayers = currentRoom.players.filter((item) => item.isConnected);

        if (connectedPlayers.length === 0) {
          if (currentRoom.timerInterval) clearInterval(currentRoom.timerInterval);
          this.rooms.delete(currentRoom.code);
          roomRegistry.unregister(currentRoom.code);
          return;
        }

        if (currentRoom.hostId === p.id && connectedPlayers.length > 0) {
          currentRoom.players.forEach((item) => {
            item.isHost = false;
          });
          currentRoom.hostId = connectedPlayers[0].id;
          connectedPlayers[0].isHost = true;
        }

        if (currentRoom.phase !== 'LOBBY' && currentRoom.phase !== 'GAME_OVER') {
          if (connectedPlayers.length < 3) {
            if (currentRoom.timerInterval) clearInterval(currentRoom.timerInterval);
            currentRoom.phase = 'MATCH_ABORTED';
            currentRoom.abortReason = `${p.name} se ha desconectado. Menos de 3 jugadores restantes.`;
          }
        }
        this.broadcastRoom(currentRoom);
      }
    }, 90000);

    this.broadcastRoom(room);
  }

  private removePlayer(playerId: string, room: ServerRoom) {
    const idx = room.players.findIndex((p) => p.id === playerId);
    if (idx === -1) return;

    const removed = room.players[idx];
    room.players.splice(idx, 1);

    if (room.players.length === 0) {
      if (room.timerInterval) clearInterval(room.timerInterval);
      this.rooms.delete(room.code);
      roomRegistry.unregister(room.code);
      return;
    }

    if (room.hostId === removed.id) {
      const nextHost = room.players.find((p) => p.isConnected) || room.players[0];
      room.players.forEach((p) => {
        p.isHost = p.id === nextHost.id;
      });
      room.hostId = nextHost.id;
    }

    if (room.phase !== 'LOBBY' && room.phase !== 'GAME_OVER') {
      const connectedCount = room.players.filter((p) => p.isConnected).length;
      if (connectedCount < 3) {
        if (room.timerInterval) clearInterval(room.timerInterval);
        room.phase = 'MATCH_ABORTED';
        room.abortReason = `${removed.name} ha abandonado la partida. Menos de 3 jugadores disponibles.`;
      }
    }

    this.broadcastRoom(room);
  }

  private sanitizeRoomForPlayer(room: ServerRoom, _targetPlayerId: string): CuantoTeAtrevesRoomState {
    return {
      code: room.code,
      gameType: 'cuanto-te-atreves',
      hostId: room.hostId,
      phase: room.phase,
      config: { ...room.config },
      players: room.players.map((p) => ({ ...p })),
      currentChallengeNumber: room.currentChallengeNumber,
      activePlayerId: room.activePlayerId,
      currentTopic: room.currentTopic ? { ...room.currentTopic } : null,
      targetBet: room.targetBet,
      timerRemainingSeconds: room.timerSecondsRemaining,
      isTimerRunning: room.isTimerRunning,
      isTimerPaused: room.isTimerPaused,
      lastResult: room.lastResult ? { ...room.lastResult } : null,
      abortReason: room.abortReason,
    };
  }

  private broadcastRoom(room: ServerRoom) {
    this.clients.forEach((client) => {
      if (client.roomId === room.code && client.ws.readyState === WebSocket.OPEN) {
        const payload: CuantoTeAtrevesServerMessage = {
          type: 'ROOM_STATE',
          state: this.sanitizeRoomForPlayer(room, client.playerId),
        };
        client.ws.send(JSON.stringify(payload));
      }
    });
  }
}
