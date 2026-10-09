import { WebSocketServer, WebSocket } from 'ws';
import {
  UnoSobraRoomState,
  UnoSobraPlayer,
  UnoSobraConfig,
  UnoSobraClientMessage,
  UnoSobraServerMessage,
  UnoSobraScenario,
  UnoSobraRole,
  UNO_SOBRA_SCENARIOS,
} from '../src/types/unoSobra';
import { roomRegistry } from './roomRegistry';

interface ClientConnection {
  ws: WebSocket;
  playerId: string;
  roomId: string;
}

interface ServerRoom {
  code: string;
  gameType: 'uno-sobra';
  hostId: string;
  phase: UnoSobraRoomState['phase'];
  config: UnoSobraConfig;
  players: UnoSobraPlayer[];
  currentRound: number;
  activeScenario: UnoSobraScenario | null;
  usedScenarioIds: Set<string>;
  timerInterval: NodeJS.Timeout | null;
  timerSecondsRemaining: number;
  eliminatedPlayerId?: string | null;
  abortReason?: string;
  votesInternal: Map<string, string>; // voterId -> targetPlayerId
  playerRolesInternal: Map<string, UnoSobraRole>; // playerId -> privateRole
}

const DEFAULT_CONFIG: UnoSobraConfig = {
  discussionDurationMinutes: 3,
  presentationDurationSeconds: 10,
  eliminationMode: 'permanent',
};

export class UnoSobraServer {
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
        const msg = JSON.parse(data.toString()) as UnoSobraClientMessage;
        this.handleClientMessage(ws, msg);
      } catch (err) {
        console.error('[UnoSobraServer] Error parsing client message:', err);
      }
    });

    ws.on('close', () => {
      this.handleDisconnect(ws);
    });

    ws.on('error', (err) => {
      console.error('[UnoSobraServer] WebSocket error:', err);
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

  private pickNextScenario(room: ServerRoom): UnoSobraScenario {
    const available = UNO_SOBRA_SCENARIOS.filter((s) => !room.usedScenarioIds.has(s.id));
    const pool = available.length > 0 ? available : UNO_SOBRA_SCENARIOS;
    const picked = pool[Math.floor(Math.random() * pool.length)];
    room.usedScenarioIds.add(picked.id);
    return picked;
  }

  public createRoomDirect(
    hostPlayer: { id: string; name: string; avatar?: string; color?: string },
    config?: Partial<UnoSobraConfig>
  ): { code: string; room: UnoSobraRoomState } {
    const code = roomRegistry.generateCode();
    const cleanCode = code.toUpperCase().trim();

    const initialPlayer: UnoSobraPlayer = {
      id: hostPlayer.id,
      name: (hostPlayer.name || 'Superviviente').trim(),
      avatar: hostPlayer.avatar || '👤',
      color: hostPlayer.color || '#8B5CF6',
      isHost: true,
      isConnected: true,
      isReady: true,
      isEliminated: false,
      votesReceived: 0,
    };

    const sanitizedDuration =
      config?.discussionDurationMinutes && config.discussionDurationMinutes >= 2 && config.discussionDurationMinutes <= 10
        ? Math.round(config.discussionDurationMinutes)
        : DEFAULT_CONFIG.discussionDurationMinutes;

    const roomConfig: UnoSobraConfig = {
      discussionDurationMinutes: sanitizedDuration,
      presentationDurationSeconds: 10,
      eliminationMode: 'permanent',
    };

    const serverRoom: ServerRoom = {
      code: cleanCode,
      gameType: 'uno-sobra',
      hostId: hostPlayer.id,
      phase: 'LOBBY',
      config: roomConfig,
      players: [initialPlayer],
      currentRound: 0,
      activeScenario: null,
      usedScenarioIds: new Set<string>(),
      timerInterval: null,
      timerSecondsRemaining: 0,
      eliminatedPlayerId: null,
      votesInternal: new Map(),
      playerRolesInternal: new Map(),
    };

    this.rooms.set(cleanCode, serverRoom);
    roomRegistry.register(cleanCode, 'uno-sobra', 'uno-sobra');

    return {
      code: cleanCode,
      room: this.sanitizeRoomForPlayer(serverRoom, hostPlayer.id),
    };
  }

  private handleClientMessage(ws: WebSocket, msg: UnoSobraClientMessage) {
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
          name: (msg.player.name || 'Superviviente').trim().slice(0, 20),
          avatar: msg.player.avatar || '👤',
          color: msg.player.color || '#8B5CF6',
          isHost: room.players.length === 0,
          isConnected: true,
          isReady: false,
          isEliminated: false,
          votesReceived: 0,
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
        const nextDuration =
          msg.config.discussionDurationMinutes !== undefined
            ? Math.max(2, Math.min(10, Math.round(msg.config.discussionDurationMinutes)))
            : room.config.discussionDurationMinutes;

        room.config = {
          ...room.config,
          discussionDurationMinutes: nextDuration,
          presentationDurationSeconds: 10,
          eliminationMode: 'permanent',
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

      // Reset players
      room.players.forEach((p) => {
        p.isEliminated = false;
        p.votesReceived = 0;
      });
      room.usedScenarioIds.clear();
      room.currentRound = 1;

      this.startRoundScenario(room);
      return;
    }

    if (msg.type === 'CAST_VOTE') {
      if (room.phase !== 'VOTING') return;
      const voter = room.players.find((p) => p.id === client.playerId);
      if (!voter || voter.isEliminated) return;

      const target = room.players.find((p) => p.id === msg.targetPlayerId && !p.isEliminated);
      if (!target) return;

      room.votesInternal.set(voter.id, target.id);

      const activeSurvivors = room.players.filter((p) => !p.isEliminated && p.isConnected);
      if (room.votesInternal.size >= activeSurvivors.length) {
        this.resolveVotes(room);
      } else {
        this.broadcastRoom(room);
      }
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
        room.currentRound = 0;
        room.activeScenario = null;
        room.timerSecondsRemaining = 0;
        room.eliminatedPlayerId = null;
        room.playerRolesInternal.clear();
        room.votesInternal.clear();
        room.players.forEach((p) => {
          p.isReady = false;
          p.isEliminated = false;
          p.votesReceived = 0;
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

  private startRoundScenario(room: ServerRoom) {
    if (room.timerInterval) clearInterval(room.timerInterval);

    // Pick random scenario without repeating during the match
    const scenario = this.pickNextScenario(room);
    room.activeScenario = scenario;
    room.votesInternal.clear();
    room.playerRolesInternal.clear();

    const activeSurvivors = room.players.filter((p) => !p.isEliminated);
    const shuffledRoles = [...scenario.roles].sort(() => Math.random() - 0.5);

    // Assign appropriate private roles to each active survivor
    activeSurvivors.forEach((survivor, index) => {
      const assignedRole = shuffledRoles[index % shuffledRoles.length];
      room.playerRolesInternal.set(survivor.id, assignedRole);
    });

    // Phase 1: Scenario Intro (fixed 10 seconds)
    room.phase = 'SCENARIO_INTRO';
    room.timerSecondsRemaining = room.config.presentationDurationSeconds;

    room.timerInterval = setInterval(() => {
      room.timerSecondsRemaining -= 1;
      if (room.timerSecondsRemaining <= 0) {
        if (room.timerInterval) clearInterval(room.timerInterval);
        this.startDiscussionPhase(room);
      } else {
        this.broadcastRoom(room);
      }
    }, 1000);

    this.broadcastRoom(room);
  }

  private startDiscussionPhase(room: ServerRoom) {
    room.phase = 'DISCUSSION';
    room.timerSecondsRemaining = room.config.discussionDurationMinutes * 60;

    room.timerInterval = setInterval(() => {
      room.timerSecondsRemaining -= 1;
      if (room.timerSecondsRemaining <= 0) {
        if (room.timerInterval) clearInterval(room.timerInterval);
        this.startVotingPhase(room);
      } else {
        if (room.timerSecondsRemaining % 10 === 0 || room.timerSecondsRemaining <= 10) {
          this.broadcastRoom(room);
        }
      }
    }, 1000);

    this.broadcastRoom(room);
  }

  private startVotingPhase(room: ServerRoom) {
    room.phase = 'VOTING';
    room.timerSecondsRemaining = 60; // 60 seconds voting window

    room.timerInterval = setInterval(() => {
      room.timerSecondsRemaining -= 1;
      if (room.timerSecondsRemaining <= 0) {
        if (room.timerInterval) clearInterval(room.timerInterval);
        this.resolveVotes(room);
      } else {
        if (room.timerSecondsRemaining % 5 === 0) {
          this.broadcastRoom(room);
        }
      }
    }, 1000);

    this.broadcastRoom(room);
  }

  private resolveVotes(room: ServerRoom) {
    if (room.timerInterval) {
      clearInterval(room.timerInterval);
      room.timerInterval = null;
    }

    // Tally votes
    const voteCounts: Record<string, number> = {};
    room.players.forEach((p) => {
      voteCounts[p.id] = 0;
    });

    room.votesInternal.forEach((targetId) => {
      if (voteCounts[targetId] !== undefined) {
        voteCounts[targetId] += 1;
      }
    });

    room.players.forEach((p) => {
      p.votesReceived = voteCounts[p.id] || 0;
    });

    // Find most voted active survivor
    const activeSurvivors = room.players.filter((p) => !p.isEliminated);
    let highestVotes = -1;
    let candidateToEliminate: UnoSobraPlayer | null = null;

    activeSurvivors.forEach((p) => {
      if (p.votesReceived > highestVotes) {
        highestVotes = p.votesReceived;
        candidateToEliminate = p;
      }
    });

    if (candidateToEliminate) {
      (candidateToEliminate as UnoSobraPlayer).isEliminated = true;
      room.eliminatedPlayerId = (candidateToEliminate as UnoSobraPlayer).id;
    }

    room.phase = 'ELIMINATION_REVEAL';
    this.broadcastRoom(room);

    // After 8 seconds, advance round or finish game
    setTimeout(() => {
      const remainingSurvivors = room.players.filter((p) => !p.isEliminated && p.isConnected);
      if (remainingSurvivors.length <= 1) {
        room.phase = 'GAME_OVER';
        this.broadcastRoom(room);
      } else {
        room.currentRound += 1;
        this.startRoundScenario(room);
      }
    }, 8000);
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
    room.playerRolesInternal.delete(playerId);
    room.votesInternal.delete(playerId);

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

  /**
   * CRITICAL AUTHORITATIVE SERIALIZATION:
   * Each player ONLY receives their own privateRole!
   */
  private sanitizeRoomForPlayer(room: ServerRoom, targetPlayerId: string): UnoSobraRoomState {
    const activeSurvivorsCount = room.players.filter((p) => !p.isEliminated).length;
    const slots = Math.max(1, activeSurvivorsCount - 1);

    return {
      code: room.code,
      gameType: 'uno-sobra',
      hostId: room.hostId,
      phase: room.phase,
      config: { ...room.config },
      players: room.players.map((p) => ({
        ...p,
        privateRole: p.id === targetPlayerId ? room.playerRolesInternal.get(p.id) : undefined,
      })),
      currentRound: room.currentRound,
      activeScenario: room.activeScenario
        ? {
            id: room.activeScenario.id,
            title: room.activeScenario.title,
            description: room.activeScenario.description,
            slotsAvailable: slots,
          }
        : null,
      timerRemainingSeconds: room.timerSecondsRemaining,
      eliminatedPlayerId: room.eliminatedPlayerId,
      abortReason: room.abortReason,
    };
  }

  private broadcastRoom(room: ServerRoom) {
    this.clients.forEach((client) => {
      if (client.roomId === room.code && client.ws.readyState === WebSocket.OPEN) {
        const payload: UnoSobraServerMessage = {
          type: 'ROOM_STATE',
          state: this.sanitizeRoomForPlayer(room, client.playerId),
        };
        client.ws.send(JSON.stringify(payload));
      }
    });
  }
}
