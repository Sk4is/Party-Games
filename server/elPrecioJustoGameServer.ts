import { WebSocketServer, WebSocket } from 'ws';
import {
  ElPrecioJustoRoomState,
  ElPrecioJustoPlayer,
  ElPrecioJustoConfig,
  ElPrecioJustoClientMessage,
  ElPrecioJustoServerMessage,
  generateRoundedAmount,
  isValidRoundedAmount,
} from '../src/types/elPrecioJusto';
import { roomRegistry } from './roomRegistry';

interface ClientConnection {
  ws: WebSocket;
  playerId: string;
  roomId: string;
}

interface ServerRoom {
  code: string;
  gameType: 'el-precio-justo';
  hostId: string;
  phase: ElPrecioJustoRoomState['phase'];
  config: ElPrecioJustoConfig;
  players: ElPrecioJustoPlayer[];
  currentRound: number;
  timerInterval: NodeJS.Timeout | null;
  timerSecondsRemaining: number;
  abortReason?: string;
  // Private server-only money allocation per player.
  // CRITICAL SECURITY: Never leaked to rival clients!
  playerMoneyInternal: Map<string, number>; // playerId -> privateMoneyAmount
  playerEstimationsInternal: Map<string, Map<string, number>>; // guesserId -> (targetPlayerId -> estimatedAmount)
}

const DEFAULT_CONFIG: ElPrecioJustoConfig = {
  maxMoneyAmount: 100000,
  minMoneyAmount: 5,
  speakingTurnMode: 'free_speech',
  investigationTimerMode: 'no_forced_timer',
};

export class ElPrecioJustoServer {
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
        const msg = JSON.parse(data.toString()) as ElPrecioJustoClientMessage;
        this.handleClientMessage(ws, msg);
      } catch (err) {
        console.error('[ElPrecioJustoServer] Error parsing client message:', err);
      }
    });

    ws.on('close', () => {
      this.handleDisconnect(ws);
    });

    ws.on('error', (err) => {
      console.error('[ElPrecioJustoServer] WebSocket error:', err);
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

  public createRoomDirect(
    hostPlayer: { id: string; name: string; avatar: string; color: string },
    config?: Partial<ElPrecioJustoConfig>
  ): { code: string; room: ElPrecioJustoRoomState } {
    const code = roomRegistry.generateCode();
    const cleanCode = code.toUpperCase().trim();

    const initialPlayer: ElPrecioJustoPlayer = {
      id: hostPlayer.id,
      name: (hostPlayer.name || 'Inversor').trim(),
      avatar: hostPlayer.avatar || '💰',
      color: hostPlayer.color || '#10B981',
      isHost: true,
      isConnected: true,
      isReady: true,
      score: 0,
    };

    const sanitizedMaxMoney =
      config?.maxMoneyAmount && [10000, 50000, 100000, 500000, 1000000].includes(config.maxMoneyAmount)
        ? config.maxMoneyAmount
        : DEFAULT_CONFIG.maxMoneyAmount;

    const roomConfig: ElPrecioJustoConfig = {
      maxMoneyAmount: sanitizedMaxMoney,
      minMoneyAmount: 5,
      speakingTurnMode: 'free_speech',
      investigationTimerMode: 'no_forced_timer',
    };

    const serverRoom: ServerRoom = {
      code: cleanCode,
      gameType: 'el-precio-justo',
      hostId: hostPlayer.id,
      phase: 'LOBBY',
      config: roomConfig,
      players: [initialPlayer],
      currentRound: 1,
      timerInterval: null,
      timerSecondsRemaining: 0,
      playerMoneyInternal: new Map(),
      playerEstimationsInternal: new Map(),
    };

    this.rooms.set(cleanCode, serverRoom);
    roomRegistry.register(cleanCode, 'el-precio-justo', 'el-precio-justo');

    return {
      code: cleanCode,
      room: this.sanitizeRoomForPlayer(serverRoom, hostPlayer.id),
    };
  }

  private handleClientMessage(ws: WebSocket, msg: ElPrecioJustoClientMessage) {
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
        if (msg.player.name) player.name = msg.player.name.trim().slice(0, 16);
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
          name: (msg.player.name || 'Inversor').trim().slice(0, 16),
          avatar: msg.player.avatar || '💰',
          color: msg.player.color || '#10B981',
          isHost: room.players.length === 0,
          isConnected: true,
          isReady: false,
          score: 0,
        };
        room.players.push(player);
      }

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
        const nextMaxMoney =
          msg.config.maxMoneyAmount !== undefined &&
          [10000, 50000, 100000, 500000, 1000000].includes(msg.config.maxMoneyAmount)
            ? msg.config.maxMoneyAmount
            : room.config.maxMoneyAmount;

        room.config = {
          ...room.config,
          maxMoneyAmount: nextMaxMoney,
          minMoneyAmount: 5,
          speakingTurnMode: 'free_speech',
          investigationTimerMode: 'no_forced_timer',
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

      // Enter phase 1 game transition state
      room.phase = 'MONEY_DISTRIBUTION';
      room.currentRound = 1;
      room.timerSecondsRemaining = 0;

      // Generate authoritative rounded amounts based on magnitude tiers
      room.players.forEach((p) => {
        const generated = generateRoundedAmount(5, room.config.maxMoneyAmount);
        room.playerMoneyInternal.set(p.id, generated);
      });

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
        room.currentRound = 1;
        room.timerSecondsRemaining = 0;
        room.playerMoneyInternal.clear();
        room.playerEstimationsInternal.clear();
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

    // 90 seconds grace period for reconnections
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

        if (currentRoom.phase !== 'LOBBY') {
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
    room.playerMoneyInternal.delete(playerId);
    room.playerEstimationsInternal.delete(playerId);

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

    if (room.phase !== 'LOBBY') {
      const connectedCount = room.players.filter((p) => p.isConnected).length;
      if (connectedCount < 3) {
        if (room.timerInterval) clearInterval(room.timerInterval);
        room.phase = 'MATCH_ABORTED';
        room.abortReason = `${removed.name} ha abandonado la partida. Menos de 3 jugadores disponibles.`;
      }
    }

    this.broadcastRoom(room);
  }

  /**
   * Authoritative Sanitization:
   * Private money amount is strictly enclosed: only targetPlayerId receives their own money amount.
   * Other players' money amounts remain undefined!
   */
  private sanitizeRoomForPlayer(room: ServerRoom, targetPlayerId: string): ElPrecioJustoRoomState {
    const sanitizedPlayers: ElPrecioJustoPlayer[] = room.players.map((p) => {
      const isSelf = p.id === targetPlayerId;
      return {
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        color: p.color,
        isHost: p.isHost,
        isConnected: p.isConnected,
        isReady: p.isReady,
        score: p.score,
        // STRICT AUTHORITATIVE ISOLATION:
        privateMoneyAmount: isSelf ? room.playerMoneyInternal.get(p.id) : undefined,
      };
    });

    return {
      code: room.code,
      gameType: 'el-precio-justo',
      hostId: room.hostId,
      phase: room.phase,
      config: { ...room.config },
      players: sanitizedPlayers,
      currentRound: room.currentRound,
      timerRemainingSeconds: room.timerSecondsRemaining,
      abortReason: room.abortReason,
    };
  }

  private broadcastRoom(room: ServerRoom) {
    this.clients.forEach((client) => {
      if (client.roomId === room.code && client.ws.readyState === WebSocket.OPEN) {
        const payload: ElPrecioJustoServerMessage = {
          type: 'ROOM_STATE',
          state: this.sanitizeRoomForPlayer(room, client.playerId),
        };
        client.ws.send(JSON.stringify(payload));
      }
    });
  }
}
