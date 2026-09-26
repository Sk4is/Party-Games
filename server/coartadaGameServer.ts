import { WebSocketServer, WebSocket } from 'ws';
import {
  CoartadaRoomState,
  CoartadaPlayer,
  CoartadaConfig,
  CoartadaClientMessage,
  CoartadaServerMessage,
  CoartadaRole,
  CoartadaRoleChoice,
  CoartadaDurationMinutes,
  CoartadaPrepSeconds,
  DetectiveVerdictSubmission,
  CoartadaVerdictResult,
  EvidenceCard,
} from '../src/types/coartada';
import { generateProceduralCase } from '../src/data/coartada/caseEngine';
import { GeneratedCaseInternal } from '../src/data/coartada/caseValidator';
import { roomRegistry } from './roomRegistry';

interface ClientConnection {
  ws: WebSocket;
  playerId: string;
  roomId: string;
}

interface ServerRoom {
  code: string;
  gameType: 'coartada';
  hostId: string;
  phase: CoartadaRoomState['phase'];
  config: CoartadaConfig;
  players: CoartadaPlayer[];
  detectiveId?: string;
  suspectId?: string;
  previousDetectiveId?: string;
  activeCase?: GeneratedCaseInternal;
  prepEndsAt?: number;
  prepSecondsRemaining?: number;
  startedAt?: number;
  roundEndsAt?: number;
  timeRemainingSeconds?: number;
  revealedEvidenceIds: Set<string>;
  detectiveNotebooks: Map<string, string>; // playerId -> notes
  detectiveSubmission?: DetectiveVerdictSubmission;
  verdictResult?: CoartadaVerdictResult;
  timerInterval: NodeJS.Timeout | null;
  roleRevealTimeout: NodeJS.Timeout | null;
  abortReason?: string;
  abortPlayerName?: string;
}

const DEFAULT_CONFIG: CoartadaConfig = {
  durationMinutes: 10,
  prepSeconds: 90,
};

export class CoartadaServer {
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
        const msg = JSON.parse(data.toString()) as CoartadaClientMessage;
        this.handleClientMessage(ws, msg);
      } catch (err) {
        console.error('[CoartadaServer] Error parsing client message:', err);
      }
    });

    ws.on('close', () => {
      this.handleDisconnect(ws);
    });

    ws.on('error', (err) => {
      console.error('[CoartadaServer] WebSocket error:', err);
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
      maxPlayers: 2,
      isFull: room.players.length >= 2,
    };
  }

  public createRoomDirect(
    hostPlayer: { id: string; name: string; avatar: string; color: string },
    config?: Partial<CoartadaConfig>
  ): { code: string; room: CoartadaRoomState } {
    const code = roomRegistry.generateCode();
    const cleanCode = code.toUpperCase().trim();

    const initialPlayer: CoartadaPlayer = {
      id: hostPlayer.id,
      name: (hostPlayer.name || 'Detective').trim(),
      avatar: hostPlayer.avatar || '🕵️',
      color: hostPlayer.color || '#e2e8f0',
      role: 'DETECTIVE',
      selectedRolePreference: 'ALEATORIO',
      isConnected: true,
      isHost: true,
    };

    const validDuration: CoartadaDurationMinutes =
      config?.durationMinutes && [5, 7, 10, 12, 15].includes(config.durationMinutes)
        ? config.durationMinutes
        : 10;

    const validPrep: CoartadaPrepSeconds =
      config?.prepSeconds && [30, 60, 90, 120, 150, 180].includes(config.prepSeconds)
        ? config.prepSeconds
        : 90;

    const roomConfig: CoartadaConfig = {
      durationMinutes: validDuration,
      prepSeconds: validPrep,
    };

    const serverRoom: ServerRoom = {
      code: cleanCode,
      gameType: 'coartada',
      hostId: hostPlayer.id,
      phase: 'LOBBY',
      config: roomConfig,
      players: [initialPlayer],
      revealedEvidenceIds: new Set<string>(),
      detectiveNotebooks: new Map<string, string>(),
      timerInterval: null,
      roleRevealTimeout: null,
    };

    this.rooms.set(cleanCode, serverRoom);
    roomRegistry.register(cleanCode, 'coartada', 'party');

    const clientState = this.sanitizeRoomForPlayer(serverRoom, hostPlayer.id);
    return { code: cleanCode, room: clientState };
  }

  private handleClientMessage(ws: WebSocket, msg: CoartadaClientMessage) {
    if (msg.type === 'PING') {
      ws.send(JSON.stringify({ type: 'PONG' }));
      return;
    }

    if (msg.type === 'JOIN_ROOM') {
      const code = (msg.code || '').toUpperCase().trim();
      const room = this.rooms.get(code);

      if (!room) {
        ws.send(JSON.stringify({ type: 'ERROR', message: 'SALA NO ENCONTRADA' }));
        return;
      }

      const existingPlayerIndex = room.players.findIndex((p) => p.id === msg.player.id);

      if (existingPlayerIndex === -1 && room.players.length >= 2) {
        ws.send(JSON.stringify({ type: 'ERROR', message: 'LA SALA ESTÁ COMPLETA (MÁXIMO 2 JUGADORES)' }));
        return;
      }

      if (existingPlayerIndex === -1 && room.phase !== 'LOBBY') {
        ws.send(JSON.stringify({ type: 'ERROR', message: 'LA PARTIDA YA HA COMENZADO' }));
        return;
      }

      let player: CoartadaPlayer;
      if (existingPlayerIndex !== -1) {
        player = room.players[existingPlayerIndex];
        player.isConnected = true;
        player.name = (msg.player.name || player.name).trim();
        player.avatar = msg.player.avatar || player.avatar;
      } else {
        player = {
          id: msg.player.id,
          name: (msg.player.name || 'Sospechoso').trim(),
          avatar: msg.player.avatar || '💼',
          color: msg.player.color || '#94a3b8',
          role: 'SOSPECHOSO',
          selectedRolePreference: 'ALEATORIO',
          isConnected: true,
          isHost: room.players.length === 0,
        };
        room.players.push(player);
      }

      this.clients.set(ws, { ws, playerId: player.id, roomId: room.code });
      this.broadcastRoom(room);
      return;
    }

    const client = this.clients.get(ws);
    if (!client) return;

    const room = this.rooms.get(client.roomId);
    if (!room) return;

    // Role Claiming (Authoritative & Race-safe)
    if (msg.type === 'CLAIM_ROLE') {
      if (room.phase !== 'LOBBY') return;
      const targetPlayer = room.players.find((p) => p.id === client.playerId);
      const otherPlayer = room.players.find((p) => p.id !== client.playerId);
      if (!targetPlayer) return;

      const requestedRole = msg.role; // 'DETECTIVE' | 'SOSPECHOSO' | 'ALEATORIO'
      targetPlayer.selectedRolePreference = requestedRole;

      if (requestedRole === 'DETECTIVE') {
        targetPlayer.role = 'DETECTIVE';
        if (otherPlayer) {
          otherPlayer.role = 'SOSPECHOSO';
          if (otherPlayer.selectedRolePreference === 'DETECTIVE') {
            otherPlayer.selectedRolePreference = 'SOSPECHOSO';
          }
        }
      } else if (requestedRole === 'SOSPECHOSO') {
        targetPlayer.role = 'SOSPECHOSO';
        if (otherPlayer) {
          otherPlayer.role = 'DETECTIVE';
          if (otherPlayer.selectedRolePreference === 'SOSPECHOSO') {
            otherPlayer.selectedRolePreference = 'DETECTIVE';
          }
        }
      } else {
        // ALEATORIO
        if (otherPlayer?.selectedRolePreference === 'DETECTIVE') {
          targetPlayer.role = 'SOSPECHOSO';
        } else if (otherPlayer?.selectedRolePreference === 'SOSPECHOSO') {
          targetPlayer.role = 'DETECTIVE';
        }
      }

      this.broadcastRoom(room);
      return;
    }

    if (msg.type === 'UPDATE_CONFIG') {
      if (client.playerId !== room.hostId || room.phase !== 'LOBBY') return;
      if (msg.config.durationMinutes && [5, 7, 10, 12, 15].includes(msg.config.durationMinutes)) {
        room.config.durationMinutes = msg.config.durationMinutes;
      }
      if (msg.config.prepSeconds && [30, 60, 90, 120, 150, 180].includes(msg.config.prepSeconds)) {
        room.config.prepSeconds = msg.config.prepSeconds;
      }
      this.broadcastRoom(room);
      return;
    }

    if (msg.type === 'START_CASE') {
      if (client.playerId !== room.hostId) return;
      if (room.players.length !== 2) {
        ws.send(JSON.stringify({ type: 'ERROR', message: 'SE REQUIEREN EXACTAMENTE 2 JUGADORES' }));
        return;
      }
      this.startNewCase(room);
      return;
    }

    if (msg.type === 'SAVE_NOTEBOOK') {
      if (client.playerId === room.detectiveId) {
        room.detectiveNotebooks.set(client.playerId, msg.notebookText);
      }
      return;
    }

    if (msg.type === 'REQUEST_VERDICT_PHASE') {
      if (client.playerId === room.detectiveId && room.phase === 'INTERROGATION') {
        this.transitionToVerdict(room);
      }
      return;
    }

    if (msg.type === 'SUBMIT_VERDICT') {
      if (client.playerId !== room.detectiveId || room.phase !== 'VERDICT' || !room.activeCase) return;
      this.resolveVerdict(room, msg.verdict);
      return;
    }

    if (msg.type === 'NEW_CASE') {
      if (room.phase === 'CASE_REVEAL') {
        this.startNewCase(room, true); // Swap roles
      }
      return;
    }

    if (msg.type === 'LEAVE_ROOM') {
      this.handlePlayerLeave(client.playerId, room);
      return;
    }
  }

  private startNewCase(room: ServerRoom, swapRoles: boolean = false) {
    if (room.timerInterval) clearInterval(room.timerInterval);
    if (room.roleRevealTimeout) clearTimeout(room.roleRevealTimeout);

    const p1 = room.players[0];
    const p2 = room.players[1];

    if (swapRoles && room.detectiveId && room.suspectId) {
      const prevDet = room.detectiveId;
      const prevSusp = room.suspectId;
      room.detectiveId = prevSusp;
      room.suspectId = prevDet;
    } else {
      // Respect player role selections if set
      if (p1.selectedRolePreference === 'DETECTIVE' && p2.selectedRolePreference !== 'DETECTIVE') {
        room.detectiveId = p1.id;
        room.suspectId = p2.id;
      } else if (p2.selectedRolePreference === 'DETECTIVE' && p1.selectedRolePreference !== 'DETECTIVE') {
        room.detectiveId = p2.id;
        room.suspectId = p1.id;
      } else if (p1.selectedRolePreference === 'SOSPECHOSO' && p2.selectedRolePreference !== 'SOSPECHOSO') {
        room.suspectId = p1.id;
        room.detectiveId = p2.id;
      } else if (p2.selectedRolePreference === 'SOSPECHOSO' && p1.selectedRolePreference !== 'SOSPECHOSO') {
        room.suspectId = p2.id;
        room.detectiveId = p1.id;
      } else {
        // Both random or identical: coin flip
        const pick = Math.random() < 0.5 ? 0 : 1;
        room.detectiveId = room.players[pick].id;
        room.suspectId = room.players[1 - pick].id;
      }
    }

    for (const p of room.players) {
      p.role = p.id === room.detectiveId ? 'DETECTIVE' : 'SOSPECHOSO';
    }

    // Generate coherent procedural case
    const generatedCase = generateProceduralCase(room.config.durationMinutes);
    room.activeCase = generatedCase;
    room.revealedEvidenceIds = new Set<string>();
    room.detectiveSubmission = undefined;
    room.verdictResult = undefined;

    // Initial evidence at 0s (available during preparation)
    for (const ev of room.activeCase.allEvidence) {
      if (ev.revealedAtSeconds <= 0) {
        room.revealedEvidenceIds.add(ev.id);
      }
    }

    // 1. Phase: ROLE_REVEAL for ~2.5 seconds
    room.phase = 'ROLE_REVEAL';
    this.broadcastRoom(room);

    room.roleRevealTimeout = setTimeout(() => {
      this.beginPreparation(room);
    }, 2500);
  }

  // Phase 2: PREPARATION / READING (Timer does NOT start interrogation yet!)
  private beginPreparation(room: ServerRoom) {
    if (!room.activeCase) return;

    room.phase = 'PREPARATION';
    const prepSeconds = room.config.prepSeconds || 90;
    room.prepEndsAt = Date.now() + prepSeconds * 1000;
    room.prepSecondsRemaining = prepSeconds;
    room.startedAt = undefined;
    room.roundEndsAt = undefined;
    room.timeRemainingSeconds = undefined;

    this.broadcastRoom(room);

    room.timerInterval = setInterval(() => {
      if (!room.prepEndsAt) return;
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((room.prepEndsAt - now) / 1000));
      room.prepSecondsRemaining = remaining;

      if (remaining <= 0) {
        if (room.timerInterval) clearInterval(room.timerInterval);
        this.beginInterrogation(room);
      } else {
        this.broadcastPrepTick(room);
      }
    }, 1000);
  }

  // Phase 3: INTERROGATION (Interrogation timer begins NOW!)
  private beginInterrogation(room: ServerRoom) {
    if (!room.activeCase) return;

    room.phase = 'INTERROGATION';
    const totalSeconds = room.config.durationMinutes * 60;
    room.startedAt = Date.now();
    room.roundEndsAt = room.startedAt + totalSeconds * 1000;
    room.timeRemainingSeconds = totalSeconds;
    room.prepEndsAt = undefined;
    room.prepSecondsRemaining = undefined;

    this.broadcastRoom(room);

    // Synchronized interrogation interval
    room.timerInterval = setInterval(() => {
      if (!room.roundEndsAt) return;
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((room.roundEndsAt - now) / 1000));
      room.timeRemainingSeconds = remaining;

      // Check progressive evidence schedule relative to interrogation start
      const elapsed = Math.floor((now - (room.startedAt || now)) / 1000);
      let newEvidenceRevealed = false;

      if (room.activeCase) {
        for (const ev of room.activeCase.allEvidence) {
          if (!room.revealedEvidenceIds.has(ev.id) && elapsed >= ev.revealedAtSeconds) {
            room.revealedEvidenceIds.add(ev.id);
            newEvidenceRevealed = true;
          }
        }
      }

      if (newEvidenceRevealed) {
        this.broadcastRoom(room);
      } else {
        this.broadcastTick(room);
      }

      if (remaining <= 0) {
        if (room.timerInterval) clearInterval(room.timerInterval);
        this.transitionToVerdict(room);
      }
    }, 1000);
  }

  private transitionToVerdict(room: ServerRoom) {
    if (room.timerInterval) clearInterval(room.timerInterval);
    room.phase = 'VERDICT';
    this.broadcastRoom(room);
  }

  // Phase 5: VERDICT RESOLUTION
  private resolveVerdict(room: ServerRoom, submission: DetectiveVerdictSubmission) {
    if (!room.activeCase) return;

    const actualGuilty = room.activeCase.suspectIsGuilty;
    const guiltMatched = submission.accusedGuilty === actualGuilty;
    const caseSolved = guiltMatched;

    const verdictResult: CoartadaVerdictResult = {
      guiltMatched,
      caseSolved,
      detectiveSubmission: submission,
    };

    room.verdictResult = verdictResult;
    room.phase = 'CASE_REVEAL';
    this.broadcastRoom(room);
  }

  private handlePlayerLeave(playerId: string, room: ServerRoom) {
    const leavingPlayer = room.players.find((p) => p.id === playerId);
    const leavingName = leavingPlayer?.name || 'El otro jugador';

    // Active match phases: permanent leave terminates the match
    if (
      room.phase === 'ROLE_REVEAL' ||
      room.phase === 'PREPARATION' ||
      room.phase === 'INTERROGATION' ||
      room.phase === 'VERDICT'
    ) {
      if (room.timerInterval) clearInterval(room.timerInterval);
      if (room.roleRevealTimeout) clearTimeout(room.roleRevealTimeout);
      room.phase = 'MATCH_ABORTED';
      room.abortReason = `${leavingName} ha abandonado la sala.`;
      room.abortPlayerName = leavingName;
      this.broadcastRoom(room);
      return;
    }

    // In LOBBY or CASE_REVEAL: remove the player cleanly
    room.players = room.players.filter((p) => p.id !== playerId);
    if (room.players.length === 0) {
      if (room.timerInterval) clearInterval(room.timerInterval);
      if (room.roleRevealTimeout) clearTimeout(room.roleRevealTimeout);
      this.rooms.delete(room.code);
      roomRegistry.unregister(room.code);
      return;
    }

    if (room.hostId === playerId && room.players.length > 0) {
      room.hostId = room.players[0].id;
      room.players[0].isHost = true;
    }

    this.broadcastRoom(room);
  }

  private handleDisconnect(ws: WebSocket) {
    const client = this.clients.get(ws);
    if (!client) return;

    this.clients.delete(ws);
    const room = this.rooms.get(client.roomId);
    if (!room) return;

    const player = room.players.find((p) => p.id === client.playerId);
    if (player) {
      player.isConnected = false;
    }

    // Temporary disconnect grace of 30 seconds
    setTimeout(() => {
      const currRoom = this.rooms.get(client.roomId);
      if (!currRoom) return;
      const currPlayer = currRoom.players.find((p) => p.id === client.playerId);
      if (currPlayer && !currPlayer.isConnected) {
        if (
          currRoom.phase === 'PREPARATION' ||
          currRoom.phase === 'INTERROGATION' ||
          currRoom.phase === 'VERDICT'
        ) {
          if (currRoom.timerInterval) clearInterval(currRoom.timerInterval);
          currRoom.phase = 'MATCH_ABORTED';
          currRoom.abortReason = `${currPlayer.name} se ha desconectado.`;
          currRoom.abortPlayerName = currPlayer.name;
          this.broadcastRoom(currRoom);
        }
      }
    }, 30000);

    this.broadcastRoom(room);
  }

  private sanitizeRoomForPlayer(room: ServerRoom, targetPlayerId: string): CoartadaRoomState {
    const player = room.players.find((p) => p.id === targetPlayerId);
    const isDetective = player?.role === 'DETECTIVE';
    const isSuspect = player?.role === 'SOSPECHOSO';
    const isReveal = room.phase === 'CASE_REVEAL';

    const state: CoartadaRoomState = {
      code: room.code,
      gameType: room.gameType,
      phase: room.phase,
      config: room.config,
      players: room.players,
      hostId: room.hostId,
      caseId: room.activeCase?.caseId,
      prepEndsAt: room.prepEndsAt,
      prepSecondsRemaining: room.prepSecondsRemaining,
      startedAt: room.startedAt,
      roundEndsAt: room.roundEndsAt,
      timeRemainingSeconds: room.timeRemainingSeconds,
      abortReason: room.abortReason,
      abortPlayerName: room.abortPlayerName,
    };

    if (room.activeCase) {
      // 1. Case dossier (public incident info): visible to Detective and Suspect
      state.caseDossier = room.activeCase.caseDossier;

      // 2. Detective Evidence: only revealed evidence, and only sent to Detective (or both on CASE_REVEAL)
      if (isDetective || isReveal) {
        state.revealedEvidence = room.activeCase.allEvidence
          .filter((ev) => room.revealedEvidenceIds.has(ev.id))
          .map((ev) => ({ ...ev, isRevealed: true }));
      }

      // 3. Suspect Dossier (private secrets/identity/truth): ONLY sent to Suspect! (or both on CASE_REVEAL)
      if (isSuspect || isReveal) {
        state.suspectDossier = room.activeCase.suspectDossier;
      }

      // 4. Final truth and verdict: ONLY sent in CASE_REVEAL!
      if (isReveal) {
        state.finalTruthReveal = room.activeCase.finalTruthReveal;
        state.verdictResult = room.verdictResult;
      }
    }

    return state;
  }

  private broadcastRoom(room: ServerRoom) {
    for (const [ws, client] of this.clients.entries()) {
      if (client.roomId === room.code && ws.readyState === WebSocket.OPEN) {
        const sanitized = this.sanitizeRoomForPlayer(room, client.playerId);
        const notebookText =
          client.playerId === room.detectiveId
            ? room.detectiveNotebooks.get(client.playerId) || ''
            : undefined;

        ws.send(
          JSON.stringify({
            type: 'ROOM_STATE',
            room: sanitized,
            savedNotebookText: notebookText,
          } as CoartadaServerMessage)
        );
      }
    }
  }

  private broadcastTick(room: ServerRoom) {
    const msg: CoartadaServerMessage = {
      type: 'TICK',
      timeRemainingSeconds: room.timeRemainingSeconds || 0,
    };
    const payload = JSON.stringify(msg);

    for (const [ws, client] of this.clients.entries()) {
      if (client.roomId === room.code && ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  }

  private broadcastPrepTick(room: ServerRoom) {
    const msg: CoartadaServerMessage = {
      type: 'PREP_TICK',
      prepSecondsRemaining: room.prepSecondsRemaining || 0,
    };
    const payload = JSON.stringify(msg);

    for (const [ws, client] of this.clients.entries()) {
      if (client.roomId === room.code && ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    }
  }
}
