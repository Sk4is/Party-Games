import { WebSocketServer, WebSocket } from 'ws';
import {
  EntreToposRoomState,
  EntreToposPlayer,
  EntreToposConfig,
  EntreToposClientMessage,
  EntreToposServerMessage,
  EntreToposRole,
  VoteRecord,
  RoundResultSummary,
  MoleCustomization,
} from '../src/types/entreTopos';
import { generateEntreToposBoard, GeneratedBoardInternal } from '../src/data/entre-topos/categories';
import { roomRegistry } from './roomRegistry';

interface ClientConnection {
  ws: WebSocket;
  playerId: string;
  roomId: string;
}

interface ServerRoom {
  code: string;
  gameType: 'entre-topos';
  hostId: string;
  phase: EntreToposRoomState['phase'];
  config: EntreToposConfig;
  currentRound: number;
  players: EntreToposPlayer[];
  boardInternal: GeneratedBoardInternal | null;
  topoPlayerId: string | null;
  timerInterval: NodeJS.Timeout | null;
  phaseTransitionTimeout: NodeJS.Timeout | null;
  timerSecondsRemaining: number;
  timerEndsAt?: number;
  allVotes: VoteRecord[];
  accusedPlayerId?: string;
  isMoleCaught?: boolean;
  moleGuessSelectedWord?: string;
  roundSummary?: RoundResultSummary;
  abortReason?: string;
}

const DEFAULT_CONFIG: EntreToposConfig = {
  writingTimeSeconds: 45,
  discussionTimeSeconds: 90,
  totalRounds: 3,
};

export class EntreToposServer {
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
        const msg = JSON.parse(data.toString()) as EntreToposClientMessage;
        this.handleClientMessage(ws, msg);
      } catch (err) {
        console.error('[EntreToposServer] Error parsing client message:', err);
      }
    });

    ws.on('close', () => {
      this.handleDisconnect(ws);
    });

    ws.on('error', (err) => {
      console.error('[EntreToposServer] WebSocket error:', err);
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
    };
  }

  public createRoomDirect(hostPlayer: any, config?: Partial<EntreToposConfig>) {
    const code = roomRegistry.generateCode();
    const moleCustomization: MoleCustomization = hostPlayer.moleCustomization || {
      hat: 'detective',
      face: 'bigote',
      clothing: 'gabardina',
      color: '#78523A',
    };

    const player: EntreToposPlayer = {
      id: hostPlayer.id,
      name: (hostPlayer.name || 'Sospechoso').trim(),
      avatar: hostPlayer.avatar || '🕵️',
      color: hostPlayer.color || '#f59e0b',
      isConnected: true,
      isHost: true,
      score: 0,
      moleCustomization,
      hasSubmittedClue: false,
      hasVoted: false,
      votesReceived: 0,
    };

    const room: ServerRoom = {
      code,
      gameType: 'entre-topos',
      hostId: player.id,
      phase: 'LOBBY',
      config: { ...DEFAULT_CONFIG, ...config },
      currentRound: 1,
      players: [player],
      boardInternal: null,
      topoPlayerId: null,
      timerInterval: null,
      phaseTransitionTimeout: null,
      timerSecondsRemaining: 0,
      allVotes: [],
    };

    this.rooms.set(code, room);
    roomRegistry.register(code, 'entre-topos', 'party');
    return this.sanitizeRoomForPlayer(room, player.id);
  }

  private handleClientMessage(ws: WebSocket, msg: EntreToposClientMessage) {
    if (msg.type === 'JOIN_ROOM') {
      const code = (msg.code || '').toUpperCase().trim();
      let room = this.rooms.get(code);

      if (!room) {
        // Create if does not exist
        const moleCustomization = msg.player.moleCustomization || {
          hat: 'detective',
          face: 'bigote',
          clothing: 'gabardina',
          color: '#78523A',
        };
        const player: EntreToposPlayer = {
          id: msg.player.id,
          name: (msg.player.name || 'Sospechoso').trim(),
          avatar: msg.player.avatar || '🕵️',
          color: msg.player.color || '#f59e0b',
          isConnected: true,
          isHost: true,
          score: 0,
          moleCustomization,
          hasSubmittedClue: false,
          hasVoted: false,
          votesReceived: 0,
        };

        room = {
          code,
          gameType: 'entre-topos',
          hostId: player.id,
          phase: 'LOBBY',
          config: { ...DEFAULT_CONFIG },
          currentRound: 1,
          players: [player],
          boardInternal: null,
          topoPlayerId: null,
          timerInterval: null,
          phaseTransitionTimeout: null,
          timerSecondsRemaining: 0,
          allVotes: [],
        };

        this.rooms.set(code, room);
        roomRegistry.register(code, 'entre-topos', 'party');
      }

      let player = room.players.find((p) => p.id === msg.player.id);
      if (player) {
        player.isConnected = true;
        if (msg.player.name) player.name = msg.player.name.trim();
        if (msg.player.moleCustomization) player.moleCustomization = msg.player.moleCustomization;
      } else {
        if (room.players.length >= 10) {
          ws.send(JSON.stringify({ type: 'ERROR', message: 'La sala está completa (máximo 10 jugadores)' }));
          return;
        }

        const moleCustomization = msg.player.moleCustomization || {
          hat: 'detective',
          face: 'bigote',
          clothing: 'gabardina',
          color: '#78523A',
        };

        player = {
          id: msg.player.id,
          name: (msg.player.name || 'Sospechoso').trim(),
          avatar: msg.player.avatar || '🕵️',
          color: msg.player.color || '#f59e0b',
          isConnected: true,
          isHost: room.players.length === 0,
          score: 0,
          moleCustomization,
          hasSubmittedClue: false,
          hasVoted: false,
          votesReceived: 0,
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

    // UPDATE MOLE CUSTOMIZATION
    if (msg.type === 'UPDATE_MOLE') {
      const player = room.players.find((p) => p.id === client.playerId);
      if (player) {
        player.moleCustomization = msg.moleCustomization;
        if (msg.name && msg.name.trim()) {
          player.name = msg.name.trim().slice(0, 16);
        }
        this.broadcastRoom(room);
      }
      return;
    }

    // UPDATE CONFIG (HOST ONLY)
    if (msg.type === 'UPDATE_CONFIG') {
      if (room.hostId === client.playerId && room.phase === 'LOBBY') {
        room.config = { ...room.config, ...msg.config };
        this.broadcastRoom(room);
      }
      return;
    }

    // START GAME (HOST ONLY, MIN 3 PLAYERS, MAX 10)
    if (msg.type === 'START_GAME') {
      if (room.hostId !== client.playerId || room.phase !== 'LOBBY') return;
      if (room.players.length < 3) {
        ws.send(JSON.stringify({ type: 'ERROR', message: 'Se necesitan al menos 3 jugadores para empezar.' }));
        return;
      }
      if (room.players.length > 10) {
        ws.send(JSON.stringify({ type: 'ERROR', message: 'Máximo 10 jugadores permitidos.' }));
        return;
      }

      this.startRound(room, 1);
      return;
    }

    // SUBMIT CLUE
    if (msg.type === 'SUBMIT_CLUE') {
      if (room.phase !== 'WRITING') return;
      const player = room.players.find((p) => p.id === client.playerId);
      if (!player || player.hasSubmittedClue) return;

      const trimmed = (msg.clue || '').trim().slice(0, 20);
      if (!trimmed) return;

      player.clue = trimmed;
      player.hasSubmittedClue = true;

      // Check if all connected players submitted
      const connectedPlayers = room.players.filter((p) => p.isConnected);
      const allDone = connectedPlayers.every((p) => p.hasSubmittedClue);

      if (allDone) {
        this.startDiscussionPhase(room);
      } else {
        this.broadcastRoom(room);
      }
      return;
    }

    // CAST VOTE
    if (msg.type === 'CAST_VOTE') {
      if (room.phase !== 'DISCUSSION' && room.phase !== 'VOTING') return;
      const voter = room.players.find((p) => p.id === client.playerId);
      if (!voter) return;
      if (msg.targetPlayerId === voter.id) return; // cannot vote for self

      const target = room.players.find((p) => p.id === msg.targetPlayerId);
      if (!target) return;

      voter.votedPlayerId = msg.targetPlayerId;
      voter.hasVoted = true;

      // Check if all active connected players have voted
      const connectedPlayers = room.players.filter((p) => p.isConnected);
      const allVoted = connectedPlayers.every((p) => p.hasVoted);

      if (allVoted) {
        this.startVoteRevealPhase(room);
      } else {
        this.broadcastRoom(room);
      }
      return;
    }

    // MOLE GUESS WORD
    if (msg.type === 'MOLE_GUESS_WORD') {
      if (room.phase !== 'MOLE_GUESS') return;
      if (room.topoPlayerId !== client.playerId) return;

      room.moleGuessSelectedWord = (msg.word || '').trim();
      this.resolveMoleGuess(room);
      return;
    }

    // NEXT ROUND
    if (msg.type === 'NEXT_ROUND') {
      if (room.hostId !== client.playerId || room.phase !== 'ROUND_RESULTS') return;
      const nextRoundNum = room.currentRound + 1;
      if (nextRoundNum <= room.config.totalRounds) {
        this.startRound(room, nextRoundNum);
      } else {
        room.phase = 'FINAL_RESULTS';
        this.broadcastRoom(room);
      }
      return;
    }

    // PLAY AGAIN
    if (msg.type === 'PLAY_AGAIN') {
      if (room.hostId !== client.playerId) return;
      // Reset players state and return to LOBBY
      room.players.forEach((p) => {
        p.score = 0;
        p.role = undefined;
        p.clue = undefined;
        p.hasSubmittedClue = false;
        p.hasVoted = false;
        p.votedPlayerId = undefined;
        p.votesReceived = 0;
      });
      room.currentRound = 1;
      room.phase = 'LOBBY';
      room.boardInternal = null;
      room.topoPlayerId = null;
      room.roundSummary = undefined;
      this.broadcastRoom(room);
      return;
    }

    // LEAVE ROOM
    if (msg.type === 'LEAVE_ROOM') {
      this.removePlayer(client.playerId, room);
    }
  }

  /**
   * Authoritative Round Initialization:
   * 1. Generates 16 words & 1 secret word.
   * 2. Authoritatively selects 1 player as TOPO, others as INOCENTE.
   * 3. Transitions to ROUND_INTRO (3s) -> WRITING.
   */
  private startRound(room: ServerRoom, roundNumber: number) {
    if (room.timerInterval) clearInterval(room.timerInterval);
    if (room.phaseTransitionTimeout) clearTimeout(room.phaseTransitionTimeout);

    room.currentRound = roundNumber;
    room.allVotes = [];
    room.accusedPlayerId = undefined;
    room.isMoleCaught = undefined;
    room.moleGuessSelectedWord = undefined;
    room.roundSummary = undefined;

    // Reset round states
    room.players.forEach((p) => {
      p.hasSubmittedClue = false;
      p.clue = undefined;
      p.hasVoted = false;
      p.votedPlayerId = undefined;
      p.votesReceived = 0;
    });

    // 1. Authoritative Role Assignment: Exactly 1 TOPO
    const connectedPlayers = room.players.filter((p) => p.isConnected);
    if (connectedPlayers.length < 3) {
      room.phase = 'MATCH_ABORTED';
      room.abortReason = 'Se necesitan al menos 3 jugadores conectados para continuar.';
      this.broadcastRoom(room);
      return;
    }

    const topoIndex = Math.floor(Math.random() * connectedPlayers.length);
    const topo = connectedPlayers[topoIndex];
    room.topoPlayerId = topo.id;

    room.players.forEach((p) => {
      if (p.id === topo.id) {
        p.role = 'TOPO';
      } else {
        p.role = 'INOCENTE';
      }
    });

    // 2. Authoritative Board Selection
    room.boardInternal = generateEntreToposBoard();

    // 3. Enter ROUND_INTRO for 3.5s
    room.phase = 'ROUND_INTRO';
    this.broadcastRoom(room);

    room.phaseTransitionTimeout = setTimeout(() => {
      this.startWritingPhase(room);
    }, 3500);
  }

  /**
   * Phase: WRITING
   */
  private startWritingPhase(room: ServerRoom) {
    if (room.timerInterval) clearInterval(room.timerInterval);
    if (room.phaseTransitionTimeout) clearTimeout(room.phaseTransitionTimeout);

    room.phase = 'WRITING';
    room.timerSecondsRemaining = room.config.writingTimeSeconds;
    room.timerEndsAt = Date.now() + room.config.writingTimeSeconds * 1000;
    this.broadcastRoom(room);

    room.timerInterval = setInterval(() => {
      room.timerSecondsRemaining -= 1;

      if (room.timerSecondsRemaining <= 0) {
        if (room.timerInterval) clearInterval(room.timerInterval);
        // Lock unsubmitted clues with "SIN RESPUESTA"
        room.players.forEach((p) => {
          if (!p.hasSubmittedClue) {
            p.clue = 'SIN RESPUESTA';
            p.hasSubmittedClue = true;
          }
        });
        this.startDiscussionPhase(room);
      } else {
        this.broadcastRoom(room);
      }
    }, 1000);
  }

  /**
   * Phase: DISCUSSION & VOTING
   */
  private startDiscussionPhase(room: ServerRoom) {
    if (room.timerInterval) clearInterval(room.timerInterval);
    if (room.phaseTransitionTimeout) clearTimeout(room.phaseTransitionTimeout);

    room.phase = 'DISCUSSION';
    room.timerSecondsRemaining = room.config.discussionTimeSeconds;
    room.timerEndsAt = Date.now() + room.config.discussionTimeSeconds * 1000;
    this.broadcastRoom(room);

    room.timerInterval = setInterval(() => {
      room.timerSecondsRemaining -= 1;

      if (room.timerSecondsRemaining <= 0) {
        if (room.timerInterval) clearInterval(room.timerInterval);
        this.startVoteRevealPhase(room);
      } else {
        this.broadcastRoom(room);
      }
    }, 1000);
  }

  /**
   * Phase: VOTE_REVEAL & ACCUSATION TALLY
   */
  private startVoteRevealPhase(room: ServerRoom) {
    if (room.timerInterval) clearInterval(room.timerInterval);
    if (room.phaseTransitionTimeout) clearTimeout(room.phaseTransitionTimeout);

    room.phase = 'VOTE_REVEAL';

    // Tally votes
    const voteCounts: Record<string, number> = {};
    room.players.forEach((p) => {
      voteCounts[p.id] = 0;
    });

    const voteRecords: VoteRecord[] = [];
    room.players.forEach((p) => {
      if (p.votedPlayerId) {
        voteRecords.push({ voterId: p.id, targetId: p.votedPlayerId });
        voteCounts[p.votedPlayerId] = (voteCounts[p.votedPlayerId] || 0) + 1;
      }
    });

    room.allVotes = voteRecords;
    room.players.forEach((p) => {
      p.votesReceived = voteCounts[p.id] || 0;
    });

    // Find player with highest votes
    let maxVotes = 0;
    let mostVotedPlayers: string[] = [];
    Object.entries(voteCounts).forEach(([pid, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        mostVotedPlayers = [pid];
      } else if (count === maxVotes && count > 0) {
        mostVotedPlayers.push(pid);
      }
    });

    // If strictly one player has the maximum votes and that player is the TOPO:
    const accusedId = mostVotedPlayers.length === 1 ? mostVotedPlayers[0] : undefined;
    room.accusedPlayerId = accusedId;

    const isMoleCaught = accusedId === room.topoPlayerId;
    room.isMoleCaught = isMoleCaught;

    this.broadcastRoom(room);

    // Wait 5 seconds for dramatic suspense reveal
    room.phaseTransitionTimeout = setTimeout(() => {
      if (isMoleCaught) {
        // Mole gets last chance: MOLE_GUESS
        this.startMoleGuessPhase(room);
      } else {
        // Mole escaped!
        this.finishRound(room, true, false);
      }
    }, 5000);
  }

  /**
   * Phase: MOLE_GUESS (The mole's last chance to steal victory)
   */
  private startMoleGuessPhase(room: ServerRoom) {
    if (room.timerInterval) clearInterval(room.timerInterval);
    if (room.phaseTransitionTimeout) clearTimeout(room.phaseTransitionTimeout);

    room.phase = 'MOLE_GUESS';
    room.timerSecondsRemaining = 25;
    room.timerEndsAt = Date.now() + 25000;
    this.broadcastRoom(room);

    room.timerInterval = setInterval(() => {
      room.timerSecondsRemaining -= 1;

      if (room.timerSecondsRemaining <= 0) {
        if (room.timerInterval) clearInterval(room.timerInterval);
        // Time ran out: Mole fails to guess word
        this.finishRound(room, false, false);
      } else {
        this.broadcastRoom(room);
      }
    }, 1000);
  }

  private resolveMoleGuess(room: ServerRoom) {
    if (room.timerInterval) clearInterval(room.timerInterval);
    if (room.phaseTransitionTimeout) clearTimeout(room.phaseTransitionTimeout);

    const secret = room.boardInternal?.secretWord;
    const guess = room.moleGuessSelectedWord;

    if (secret && guess && secret.toLowerCase().trim() === guess.toLowerCase().trim()) {
      // Mole guessed correctly! Steals victory!
      this.finishRound(room, true, true);
    } else {
      // Mole guessed wrong! Innocents win!
      this.finishRound(room, false, false);
    }
  }

  /**
   * Concludes round, awards scores, and transitions to ROUND_RESULTS
   */
  private finishRound(room: ServerRoom, topoSucceeded: boolean, topoGuessedSecretWord: boolean) {
    if (room.timerInterval) clearInterval(room.timerInterval);
    if (room.phaseTransitionTimeout) clearTimeout(room.phaseTransitionTimeout);

    room.phase = 'ROUND_RESULTS';
    const pointsAwarded: Record<string, number> = {};

    room.players.forEach((p) => {
      pointsAwarded[p.id] = 0;
      if (topoSucceeded) {
        if (p.id === room.topoPlayerId) {
          const topoPts = topoGuessedSecretWord ? 300 : 200;
          p.score += topoPts;
          pointsAwarded[p.id] = topoPts;
        }
      } else {
        if (p.id !== room.topoPlayerId) {
          p.score += 100;
          pointsAwarded[p.id] = 100;
        }
      }
    });

    room.roundSummary = {
      roundNumber: room.currentRound,
      categoryName: room.boardInternal?.categoryName || '',
      secretWord: room.boardInternal?.secretWord || '',
      topoPlayerId: room.topoPlayerId || '',
      topoSucceeded,
      topoGuessedSecretWord,
      moleGuessWord: room.moleGuessSelectedWord,
      accusedPlayerId: room.accusedPlayerId,
      pointsAwarded,
    };

    this.broadcastRoom(room);
  }

  private removePlayer(playerId: string, room: ServerRoom) {
    room.players = room.players.filter((p) => p.id !== playerId);

    if (room.players.length === 0) {
      if (room.timerInterval) clearInterval(room.timerInterval);
      if (room.phaseTransitionTimeout) clearTimeout(room.phaseTransitionTimeout);
      this.rooms.delete(room.code);
      roomRegistry.unregister(room.code);
      return;
    }

    if (room.hostId === playerId && room.players.length > 0) {
      room.hostId = room.players[0].id;
      room.players[0].isHost = true;
    }

    if (room.phase !== 'LOBBY' && room.phase !== 'FINAL_RESULTS') {
      const connectedCount = room.players.filter((p) => p.isConnected).length;
      if (connectedCount < 3) {
        if (room.timerInterval) clearInterval(room.timerInterval);
        if (room.phaseTransitionTimeout) clearTimeout(room.phaseTransitionTimeout);
        room.phase = 'MATCH_ABORTED';
        room.abortReason = 'Un jugador ha abandonado la partida y quedan menos de 3 sospechosos.';
      }
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

    // 30 seconds disconnect grace period
    setTimeout(() => {
      const currentRoom = this.rooms.get(client.roomId);
      if (!currentRoom) return;

      const currentPlayer = currentRoom.players.find((p) => p.id === client.playerId);
      if (currentPlayer && !currentPlayer.isConnected) {
        if (currentRoom.phase !== 'LOBBY' && currentRoom.phase !== 'FINAL_RESULTS') {
          const connected = currentRoom.players.filter((p) => p.isConnected).length;
          if (connected < 3) {
            if (currentRoom.timerInterval) clearInterval(currentRoom.timerInterval);
            if (currentRoom.phaseTransitionTimeout) clearTimeout(currentRoom.phaseTransitionTimeout);
            currentRoom.phase = 'MATCH_ABORTED';
            currentRoom.abortReason = `${currentPlayer.name} se ha desconectado. Menos de 3 jugadores restantes.`;
            this.broadcastRoom(currentRoom);
          }
        }
      }
    }, 30000);

    this.broadcastRoom(room);
  }

  /**
   * CRITICAL SECURITY: Sanitizes room state specifically for player targetPlayerId.
   * - TOPO receives { categoryId, categoryName, categoryIcon, words } with NO secretWord!
   * - INOCENTE receives secretWord in board.
   * - During WRITING, other players' clues are hidden.
   * - During VOTING, other players' votes are hidden.
   */
  private sanitizeRoomForPlayer(room: ServerRoom, targetPlayerId: string): EntreToposRoomState {
    const player = room.players.find((p) => p.id === targetPlayerId);
    const isTopo = player?.id === room.topoPlayerId;
    const isReveal = room.phase === 'ROUND_RESULTS' || room.phase === 'FINAL_RESULTS';

    // Mask secret word for the Mole during gameplay
    let clientBoard = null;
    if (room.boardInternal) {
      clientBoard = {
        categoryId: room.boardInternal.categoryId,
        categoryName: room.boardInternal.categoryName,
        categoryIcon: room.boardInternal.categoryIcon,
        words: room.boardInternal.words,
        secretWord: isTopo && !isReveal ? undefined : room.boardInternal.secretWord,
      };
    }

    // Sanitize players array
    const sanitizedPlayers = room.players.map((p) => {
      const isTarget = p.id === targetPlayerId;
      return {
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        color: p.color,
        isConnected: p.isConnected,
        isHost: p.isHost,
        score: p.score,
        moleCustomization: p.moleCustomization,
        // Only reveal roles at round results, or own role
        role: isReveal || isTarget ? p.role : undefined,
        // Hide clues during writing
        clue: room.phase === 'WRITING' && !isTarget ? undefined : p.clue,
        hasSubmittedClue: p.hasSubmittedClue,
        // Hide votes until reveal
        votedPlayerId:
          room.phase === 'VOTE_REVEAL' || isReveal || isTarget ? p.votedPlayerId : undefined,
        hasVoted: p.hasVoted,
        votesReceived: p.votesReceived,
        isAccused: p.id === room.accusedPlayerId,
      };
    });

    return {
      code: room.code,
      gameType: room.gameType,
      hostId: room.hostId,
      phase: room.phase,
      config: room.config,
      currentRound: room.currentRound,
      players: sanitizedPlayers,
      board: clientBoard,
      myRole: player?.role,
      timerSecondsRemaining: room.timerSecondsRemaining,
      timerEndsAt: room.timerEndsAt,
      allVotesRevealed: room.phase === 'VOTE_REVEAL' || isReveal ? room.allVotes : undefined,
      accusedPlayerId: room.accusedPlayerId,
      isMoleCaught: room.isMoleCaught,
      moleGuessSelectedWord: isReveal ? room.moleGuessSelectedWord : undefined,
      roundSummary: room.roundSummary,
      abortReason: room.abortReason,
    };
  }

  private broadcastRoom(room: ServerRoom) {
    this.clients.forEach((client) => {
      if (client.roomId === room.code && client.ws.readyState === WebSocket.OPEN) {
        const payload = this.sanitizeRoomForPlayer(room, client.playerId);
        client.ws.send(JSON.stringify({ type: 'SYNC_STATE', state: payload }));
      }
    });
  }
}
