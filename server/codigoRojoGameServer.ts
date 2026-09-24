import { WebSocketServer, WebSocket } from 'ws';
import {
  CodigoRojoRoomState,
  CodigoRojoPlayer,
  CodigoRojoConfig,
  CodigoRojoClientMessage,
  CodigoRojoServerMessage,
  CodigoRojoModuleState,
} from '../src/types/codigoRojo';
import {
  generateMissionModules,
  GeneratedModuleInternal,
} from '../src/data/codigoRojo/moduleEngine';
import { roomRegistry } from './roomRegistry';
import { matchDepartureHandler } from './matchDepartureHandler';

interface ClientConnection {
  ws: WebSocket;
  playerId: string;
  roomId: string;
}

interface ServerRoom {
  code: string;
  gameType: 'codigo-rojo';
  hostId: string;
  phase: CodigoRojoRoomState['phase'];
  config: CodigoRojoConfig;
  players: CodigoRojoPlayer[];
  missionNumber: number;
  totalMissions: number;
  operatorId: string;
  operatorHistory: string[];
  strikes: number;
  maxStrikes: number;
  timeRemainingSeconds: number;
  totalTimeSeconds: number;
  missionStartedAt?: number;
  missionEndsAt?: number;
  modules: CodigoRojoModuleState[];
  activeModuleIndex: number;
  lastEvent?: CodigoRojoRoomState['lastEvent'];
  stats: CodigoRojoRoomState['stats'];
  timerInterval: NodeJS.Timeout | null;
  abortReason?: string;
  endMessage?: string;
  // Authoritative server-side modules with validation functions
  internalModules: GeneratedModuleInternal[];
  processedActionIds: Set<string>;
}

const DEFAULT_CONFIG: CodigoRojoConfig = {
  difficulty: 'NORMAL',
  timeMode: 'AUTO',
  customTimeMinutes: 5,
  maxStrikes: 3,
  modulesCount: 3,
};

export class CodigoRojoServer {
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
        const msg = JSON.parse(data.toString()) as CodigoRojoClientMessage;
        this.handleClientMessage(ws, msg);
      } catch (err) {
        console.error('[CodigoRojoServer] Error parsing client message:', err);
      }
    });

    ws.on('close', () => {
      this.handleDisconnect(ws);
    });

    ws.on('error', (err) => {
      console.error('[CodigoRojoServer] WebSocket error:', err);
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
      maxPlayers: 10,
      isFull: room.players.length >= 10,
      hostName: room.players.find((p) => p.isHost)?.name || 'Anfitrión',
    };
  }

  public createRoomDirect(
    hostPlayer: { id: string; name: string; avatar: string; color: string },
    config?: Partial<CodigoRojoConfig>
  ): CodigoRojoRoomState {
    const code = roomRegistry.generateCode();
    const finalConfig: CodigoRojoConfig = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    const host: CodigoRojoPlayer = {
      id: hostPlayer.id,
      name: hostPlayer.name,
      avatar: hostPlayer.avatar,
      color: hostPlayer.color,
      role: 'OPERADOR', // host starts as default operator preview
      isConnected: true,
      isHost: true,
      missionsOperatedCount: 0,
      missionsGuidedCount: 0,
    };

    const room: ServerRoom = {
      code,
      gameType: 'codigo-rojo',
      hostId: host.id,
      phase: 'LOBBY',
      config: finalConfig,
      players: [host],
      missionNumber: 1,
      totalMissions: 1,
      operatorId: host.id,
      operatorHistory: [],
      strikes: 0,
      maxStrikes: finalConfig.maxStrikes,
      timeRemainingSeconds: 300,
      totalTimeSeconds: 300,
      modules: [],
      activeModuleIndex: 0,
      stats: {
        totalSolvedModules: 0,
        totalStrikes: 0,
        missionDurationSeconds: 0,
        timeRemainingAtEndSeconds: 0,
      },
      timerInterval: null,
      internalModules: [],
      processedActionIds: new Set(),
    };

    this.rooms.set(code, room);
    roomRegistry.register(code, 'codigo-rojo' as any, 'party');
    return this.serializeRoom(room);
  }

  private handleClientMessage(ws: WebSocket, msg: CodigoRojoClientMessage) {
    if (msg.type === 'PING') {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'PONG' }));
      }
      return;
    }

    if (msg.type === 'JOIN_ROOM') {
      this.handleJoinRoom(ws, msg.code, msg.player);
      return;
    }

    if (msg.type === 'RECONNECT') {
      this.handleReconnect(ws, msg.code, msg.playerId);
      return;
    }

    const conn = this.clients.get(ws);
    if (!conn) return;

    const room = this.rooms.get(conn.roomId);
    if (!room) return;

    switch (msg.type) {
      case 'UPDATE_CONFIG':
        if (room.hostId === conn.playerId && room.phase === 'LOBBY') {
          room.config = { ...room.config, ...msg.config };
          this.broadcastRoom(room);
        }
        break;

      case 'START_MISSION':
        if (room.hostId === conn.playerId && (room.phase === 'LOBBY' || room.phase === 'MISSION_SUCCESS' || room.phase === 'MISSION_FAILED')) {
          this.startMission(room);
        }
        break;

      case 'MODULE_ACTION':
        this.handleModuleAction(room, conn.playerId, msg.moduleId, msg.action);
        break;

      case 'NEXT_MISSION':
        if (room.hostId === conn.playerId) {
          this.rotateAndPrepareNextMission(room);
        }
        break;

      case 'RESTART_MATCH':
        if (room.hostId === conn.playerId) {
          this.resetToLobby(room);
        }
        break;

      case 'LEAVE_ROOM':
        this.handleExplicitLeave(ws);
        break;

      case 'KICK_PLAYER':
        if (room.hostId === conn.playerId && msg.targetPlayerId !== room.hostId) {
          this.kickPlayer(room, msg.targetPlayerId);
        }
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
      ws.send(
        JSON.stringify({
          type: 'ERROR',
          message: 'NO SE HA ENCONTRADO LA SALA',
        })
      );
      return;
    }

    // Cancel pending departure if rejoining
    matchDepartureHandler.cancelGracePeriod(room.code, playerData.id);

    let player = room.players.find((p) => p.id === playerData.id);
    if (!player) {
      if (room.phase !== 'LOBBY') {
        ws.send(
          JSON.stringify({
            type: 'ERROR',
            message: 'LA MISIÓN YA ESTÁ EN CURSO',
          })
        );
        return;
      }

      player = {
        id: playerData.id,
        name: playerData.name || 'Agente',
        avatar: playerData.avatar || '🦊',
        color: playerData.color || '#ef4444',
        role: room.players.length === 0 ? 'OPERADOR' : 'GUIA',
        isConnected: true,
        isHost: room.players.length === 0,
        missionsOperatedCount: 0,
        missionsGuidedCount: 0,
      };
      room.players.push(player);
    } else {
      player.isConnected = true;
      player.name = playerData.name || player.name;
      player.avatar = playerData.avatar || player.avatar;
      player.color = playerData.color || player.color;
    }

    this.clients.set(ws, { ws, playerId: player.id, roomId: room.code });
    this.broadcastRoom(room);
  }

  private handleReconnect(ws: WebSocket, rawCode: string, playerId: string) {
    const code = rawCode.toUpperCase().trim();
    const room = this.rooms.get(code);
    if (!room) {
      ws.send(JSON.stringify({ type: 'ERROR', message: 'SALA NO ENCONTRADA' }));
      return;
    }

    matchDepartureHandler.cancelGracePeriod(room.code, playerId);

    const player = room.players.find((p) => p.id === playerId);
    if (!player) {
      ws.send(JSON.stringify({ type: 'ERROR', message: 'JUGADOR NO ENCONTRADO' }));
      return;
    }

    player.isConnected = true;
    this.clients.set(ws, { ws, playerId, roomId: room.code });

    // Recalculate remaining time if mission is active
    if (room.phase === 'ACTIVE_MISSION' && room.missionEndsAt) {
      const remainingMs = Math.max(0, room.missionEndsAt - Date.now());
      room.timeRemainingSeconds = Math.ceil(remainingMs / 1000);
      if (remainingMs <= 0) {
        this.handleMissionFailure(room, 'TIEMPO AGOTADO — COLAPSO DEL SISTEMA');
        return;
      }
    }

    this.sendToClient(ws, { type: 'ROOM_STATE', room: this.serializeRoom(room) });
    this.broadcastRoom(room);
  }

  private startMission(room: ServerRoom) {
    if (room.timerInterval) {
      clearInterval(room.timerInterval);
      room.timerInterval = null;
    }

    // Assign roles: Operator rotation
    this.assignRolesForMission(room);

    // Determine module count based on difficulty
    let targetCount = room.config.modulesCount;
    if (room.config.difficulty === 'NORMAL') targetCount = Math.min(Math.max(targetCount, 2), 3);
    else if (room.config.difficulty === 'DIFICIL') targetCount = Math.min(Math.max(targetCount, 4), 5);
    else if (room.config.difficulty === 'EXTREMO') targetCount = Math.min(Math.max(targetCount, 5), 6);

    const seed = Date.now() + Math.floor(Math.random() * 10000);
    const generated = generateMissionModules(targetCount, room.config.difficulty, seed);

    room.internalModules = generated.modules;
    room.modules = generated.modules.map((m) => m.moduleState);

    // Determine time
    let timeSeconds = generated.totalEstimatedSeconds;
    if (room.config.timeMode === 'CUSTOM') {
      timeSeconds = Math.max(60, room.config.customTimeMinutes * 60);
    }

    const now = Date.now();
    room.missionStartedAt = now;
    room.missionEndsAt = now + timeSeconds * 1000;
    room.timeRemainingSeconds = timeSeconds;
    room.totalTimeSeconds = timeSeconds;
    room.strikes = 0;
    room.maxStrikes = room.config.maxStrikes;
    room.activeModuleIndex = 0;
    room.phase = 'ACTIVE_MISSION';
    room.lastEvent = {
      type: 'MISSION_COMPLETE',
      message: '¡MISIÓN INICIADA! EL OPERADOR CONTROLA LA MÁQUINA.',
      timestamp: Date.now(),
    };

    // Update stats counters
    const op = room.players.find((p) => p.id === room.operatorId);
    if (op) op.missionsOperatedCount++;
    room.players.forEach((p) => {
      if (p.id !== room.operatorId) p.missionsGuidedCount++;
    });

    // Start timer interval
    room.timerInterval = setInterval(() => {
      this.tickMissionTimer(room);
    }, 1000);

    this.broadcastRoom(room);
  }

  private assignRolesForMission(room: ServerRoom) {
    const connectedPlayers = room.players.filter((p) => p.isConnected);
    if (connectedPlayers.length === 0) return;

    // Pick next operator from history
    let nextOperatorId = connectedPlayers[0].id;

    // Find the player who has operated the least or oldest
    const sorted = [...connectedPlayers].sort((a, b) => {
      if (a.missionsOperatedCount !== b.missionsOperatedCount) {
        return a.missionsOperatedCount - b.missionsOperatedCount;
      }
      const lastA = room.operatorHistory.lastIndexOf(a.id);
      const lastB = room.operatorHistory.lastIndexOf(b.id);
      return lastA - lastB;
    });

    nextOperatorId = sorted[0].id;
    room.operatorId = nextOperatorId;
    room.operatorHistory.push(nextOperatorId);

    room.players.forEach((p) => {
      p.role = p.id === nextOperatorId ? 'OPERADOR' : 'GUIA';
    });
  }

  private tickMissionTimer(room: ServerRoom) {
    if (room.phase !== 'ACTIVE_MISSION') {
      if (room.timerInterval) {
        clearInterval(room.timerInterval);
        room.timerInterval = null;
      }
      return;
    }

    const now = Date.now();
    if (room.missionEndsAt) {
      const remainingMs = Math.max(0, room.missionEndsAt - now);
      room.timeRemainingSeconds = Math.ceil(remainingMs / 1000);
      if (remainingMs <= 0) {
        this.handleMissionFailure(room, 'TIEMPO AGOTADO — COLAPSO DEL SISTEMA');
        return;
      }
    } else {
      room.timeRemainingSeconds = Math.max(0, room.timeRemainingSeconds - 1);
      if (room.timeRemainingSeconds <= 0) {
        this.handleMissionFailure(room, 'TIEMPO AGOTADO — COLAPSO DEL SISTEMA');
        return;
      }
    }

    // Broadcast tick or state every few seconds, or tick message
    this.broadcastToRoom(room.code, {
      type: 'TICK',
      timeRemainingSeconds: room.timeRemainingSeconds,
    });
  }

  private handleModuleAction(
    room: ServerRoom,
    playerId: string,
    moduleId: string,
    action: any
  ) {
    if (room.phase !== 'ACTIVE_MISSION') return;

    // Only OPERATOR is allowed to interact with the machine!
    if (playerId !== room.operatorId) {
      return;
    }

    const modIndex = room.modules.findIndex((m) => m.id === moduleId);
    if (modIndex === -1) return;

    const moduleState = room.modules[modIndex];
    if (moduleState.solved) return; // already solved

    const internalMod = room.internalModules[modIndex];
    if (!internalMod) return;

    const result = internalMod.validateAction(action, internalMod.internalSolution);

    if (result.valid) {
      if (result.updatedProgress) {
        internalMod.internalSolution = { ...internalMod.internalSolution, ...result.updatedProgress };
      }

      if (result.solved) {
        moduleState.solved = true;
        room.stats.totalSolvedModules++;

        room.lastEvent = {
          type: 'MODULE_SOLVED',
          moduleTitle: moduleState.title,
          message: `¡MÓDULO RESUELTO! (${moduleState.title})`,
          timestamp: Date.now(),
        };

        // Check if all modules are solved
        const allSolved = room.modules.every((m) => m.solved);
        if (allSolved) {
          this.handleMissionSuccess(room);
          return;
        }
      }

      this.broadcastToRoom(room.code, {
        type: 'ACTION_RESULT',
        success: true,
        solved: Boolean(result.solved),
        strike: false,
        moduleId,
        strikesCount: room.strikes,
      });

      this.broadcastRoom(room);
    } else {
      // Strike!
      room.strikes++;
      moduleState.strikes++;
      room.stats.totalStrikes++;

      if (result.updatedProgress) {
        internalMod.internalSolution = { ...internalMod.internalSolution, ...result.updatedProgress };
      }

      room.lastEvent = {
        type: 'STRIKE',
        moduleTitle: moduleState.title,
        message: `¡ERROR EN ${moduleState.title.toUpperCase()}! STRIKE ${room.strikes}/${room.maxStrikes}`,
        timestamp: Date.now(),
      };

      if (room.strikes >= room.maxStrikes) {
        this.handleMissionFailure(room, `LÍMITE DE STRIKES ALCANZADO (${room.strikes}/${room.maxStrikes})`);
        return;
      }

      this.broadcastToRoom(room.code, {
        type: 'ACTION_RESULT',
        success: false,
        solved: false,
        strike: true,
        moduleId,
        strikesCount: room.strikes,
        message: `Fallo detectado en ${moduleState.title}. Strike añadido.`,
      });

      this.broadcastRoom(room);
    }
  }

  private handleMissionSuccess(room: ServerRoom) {
    if (room.timerInterval) {
      clearInterval(room.timerInterval);
      room.timerInterval = null;
    }

    room.phase = 'MISSION_SUCCESS';
    room.stats.missionDurationSeconds = room.totalTimeSeconds - room.timeRemainingSeconds;
    room.stats.timeRemainingAtEndSeconds = room.timeRemainingSeconds;

    room.lastEvent = {
      type: 'MISSION_COMPLETE',
      message: '¡MISIÓN CUMPLIDA CON ÉXITO! Todos los módulos han sido neutralizados.',
      timestamp: Date.now(),
    };

    this.broadcastRoom(room);
  }

  private handleMissionFailure(room: ServerRoom, reason: string) {
    if (room.timerInterval) {
      clearInterval(room.timerInterval);
      room.timerInterval = null;
    }

    room.phase = 'MISSION_FAILED';
    room.endMessage = reason;
    room.stats.missionDurationSeconds = room.totalTimeSeconds - room.timeRemainingSeconds;
    room.stats.timeRemainingAtEndSeconds = 0;

    room.lastEvent = {
      type: 'CRITICAL_MELTDOWN',
      message: `¡FALLO CRÍTICO! ${reason}`,
      timestamp: Date.now(),
    };

    this.broadcastRoom(room);
  }

  private rotateAndPrepareNextMission(room: ServerRoom) {
    room.missionNumber++;
    this.startMission(room);
  }

  private resetToLobby(room: ServerRoom) {
    if (room.timerInterval) {
      clearInterval(room.timerInterval);
      room.timerInterval = null;
    }
    room.phase = 'LOBBY';
    room.modules = [];
    room.internalModules = [];
    room.strikes = 0;
    this.broadcastRoom(room);
  }

  private handleDisconnect(ws: WebSocket) {
    const conn = this.clients.get(ws);
    if (!conn) return;

    this.clients.delete(ws);
    const room = this.rooms.get(conn.roomId);
    if (!room) return;

    const player = room.players.find((p) => p.id === conn.playerId);
    if (player) {
      player.isConnected = false;
      this.broadcastRoom(room);

      // Grace period for reconnection before removing
      matchDepartureHandler.registerDisconnection(conn.roomId, conn.playerId, 'codigo-rojo', () => {
        const currentRoom = this.rooms.get(conn.roomId);
        if (!currentRoom) return;
        const p = currentRoom.players.find((pl) => pl.id === conn.playerId);
        if (p && !p.isConnected) {
          this.removePlayer(currentRoom, conn.playerId);
        }
      });
    }
  }

  private handleExplicitLeave(ws: WebSocket) {
    const conn = this.clients.get(ws);
    if (!conn) return;

    this.clients.delete(ws);
    const room = this.rooms.get(conn.roomId);
    if (!room) return;

    matchDepartureHandler.cancelGracePeriod(conn.roomId, conn.playerId);
    this.removePlayer(room, conn.playerId);
  }

  private kickPlayer(room: ServerRoom, targetPlayerId: string) {
    matchDepartureHandler.cancelGracePeriod(room.code, targetPlayerId);
    this.removePlayer(room, targetPlayerId);
  }

  private removePlayer(room: ServerRoom, playerId: string) {
    const index = room.players.findIndex((p) => p.id === playerId);
    if (index === -1) return;

    const removedPlayer = room.players[index];
    room.players.splice(index, 1);

    if (room.players.length === 0) {
      if (room.timerInterval) clearInterval(room.timerInterval);
      this.rooms.delete(room.code);
      roomRegistry.unregister(room.code);
      return;
    }

    // Transfer host if host left
    if (removedPlayer.isHost && room.players.length > 0) {
      const nextHost = room.players.find((p) => p.isConnected) || room.players[0];
      nextHost.isHost = true;
      room.hostId = nextHost.id;
    }

    const isGameActive = room.phase !== 'LOBBY' && room.phase !== 'MATCH_ABORTED';
    if (isGameActive) {
      const activeConnectedCount = room.players.filter((p) => p.isConnected).length;
      // If match loses players below the minimum of 2, abort match authoritatively!
      if (activeConnectedCount < 2) {
        if (room.timerInterval) {
          clearInterval(room.timerInterval);
          room.timerInterval = null;
        }
        room.phase = 'MATCH_ABORTED';
        room.abortReason = 'INSUFFICIENT_PLAYERS';
        room.endMessage = 'El otro jugador ha abandonado la partida.';
        this.broadcastRoom(room);
        return;
      }

      // If at least 2 players remain and the Operator permanently left, promote next connected player to Operator
      if (room.operatorId === playerId) {
        const nextOperator = room.players.find((p) => p.isConnected);
        if (nextOperator) {
          room.operatorId = nextOperator.id;
          room.operatorHistory.push(nextOperator.id);
          room.players.forEach((p) => {
            p.role = p.id === nextOperator.id ? 'OPERADOR' : 'GUIA';
          });
          room.lastEvent = {
            type: 'MODULE_SOLVED',
            message: `${removedPlayer.name} ha abandonado la partida. ${nextOperator.name} asume los mandos como Operador.`,
            timestamp: Date.now(),
          };
        }
      }
    }

    this.broadcastRoom(room);
  }

  private serializeRoom(room: ServerRoom): CodigoRojoRoomState {
    let timeRemainingSeconds = room.timeRemainingSeconds;
    if (room.phase === 'ACTIVE_MISSION' && room.missionEndsAt) {
      timeRemainingSeconds = Math.max(0, Math.ceil((room.missionEndsAt - Date.now()) / 1000));
    }

    return {
      code: room.code,
      gameType: room.gameType,
      hostId: room.hostId,
      phase: room.phase,
      config: room.config,
      players: room.players,
      missionNumber: room.missionNumber,
      totalMissions: room.totalMissions,
      operatorId: room.operatorId,
      operatorHistory: room.operatorHistory,
      strikes: room.strikes,
      maxStrikes: room.maxStrikes,
      timeRemainingSeconds,
      totalTimeSeconds: room.totalTimeSeconds,
      missionStartedAt: room.missionStartedAt,
      missionEndsAt: room.missionEndsAt,
      modules: room.modules,
      activeModuleIndex: room.activeModuleIndex,
      lastEvent: room.lastEvent,
      stats: room.stats,
      abortReason: room.abortReason,
      endMessage: room.endMessage,
    };
  }

  private broadcastRoom(room: ServerRoom) {
    const serialized = this.serializeRoom(room);
    this.broadcastToRoom(room.code, {
      type: 'ROOM_STATE',
      room: serialized,
    });
  }

  private broadcastToRoom(code: string, message: CodigoRojoServerMessage) {
    const payload = JSON.stringify(message);
    this.clients.forEach((conn) => {
      if (conn.roomId === code && conn.ws.readyState === WebSocket.OPEN) {
        conn.ws.send(payload);
      }
    });
  }

  private sendToClient(ws: WebSocket, message: CodigoRojoServerMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }
}
