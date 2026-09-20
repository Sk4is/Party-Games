export type PalabraSecretaPhase =
  | 'LOBBY'
  | 'PRE_TURN'
  | 'ACTIVE_TURN'
  | 'TURN_RESULTS'
  | 'PODIUM'
  | 'MATCH_ABORTED';

export interface PalabraSecretaPlayer {
  id: string;
  name: string;
  avatar: string;
  color: string;
  teamId: 'team-1' | 'team-2';
  isConnected: boolean;
  isHost: boolean;
  wordsDescribedCount: number;
  wordsGuessedCount: number;
}

export interface PalabraSecretaTeam {
  id: 'team-1' | 'team-2';
  name: string;
  color: string; // e.g. '#10B981' for Emerald, '#06B6D4' for Cyan / '#8B5CF6' for Violet
  score: number;
  playerIds: string[];
}

export interface SecretWordItem {
  id: string;
  word: string;
  category: string;
  forbidden: string[];
  hint?: string;
}

export interface TurnWordResult {
  word: string;
  category: string;
  status: 'GUESSED' | 'SKIPPED' | 'TABOO';
  points: number;
  timestamp: number;
}

export interface PalabraSecretaConfig {
  timePerTurn: number; // 30, 45, 60, 90 (default 60)
  totalRounds: number; // 2, 3, 4, 5 (default 3)
  maxSkipsPerTurn: number; // -1 for unlimited, 1, 2, 3 (default 3)
  penaltyOnSkip: boolean; // false = 0 pts, true = -1 pt (default false)
  penaltyOnTaboo: boolean; // false = 0 pts, true = -1 pt (default true)
  showForbiddenWords: boolean; // default true
}

export interface PalabraSecretaTurnSummary {
  teamId: 'team-1' | 'team-2';
  teamName: string;
  descriptorName: string;
  descriptorAvatar: string;
  pointsGained: number;
  words: TurnWordResult[];
  nextTeamId: 'team-1' | 'team-2';
  nextDescriptorName: string;
}

export interface PalabraSecretaRoomState {
  code: string;
  gameType: 'palabra-secreta';
  phase: PalabraSecretaPhase;
  hostId: string;
  config: PalabraSecretaConfig;
  players: PalabraSecretaPlayer[];
  teams: {
    'team-1': PalabraSecretaTeam;
    'team-2': PalabraSecretaTeam;
  };
  currentRound: number;
  totalRounds: number;
  activeTeamId: 'team-1' | 'team-2';
  activeDescriptorId: string;
  currentTurnNumber: number;
  totalTurnsInMatch: number;
  turnEndsAt?: number;
  turnRemainingSeconds: number;
  currentWord: SecretWordItem | null;
  // Masked info for non-descriptors if server chooses to hide
  isDescriptor: boolean;
  isRival: boolean;
  isTeammateGuesser: boolean;
  turnWordsHistory: TurnWordResult[];
  turnPoints: number;
  turnSkipsUsed: number;
  winningTeamId: 'team-1' | 'team-2' | 'tie' | null;
  lastTurnSummary?: PalabraSecretaTurnSummary;
  abortReason?: string;
  endMessage?: string;
  preTurnCountdown?: number;
}

export type PalabraSecretaClientMessage =
  | { type: 'JOIN_ROOM'; roomCode: string; player: { id: string; name: string; avatar: string; color: string } }
  | { type: 'UPDATE_CONFIG'; config: Partial<PalabraSecretaConfig> }
  | { type: 'SWITCH_TEAM'; playerId: string; targetTeamId: 'team-1' | 'team-2' }
  | { type: 'UPDATE_TEAM_NAME'; teamId: 'team-1' | 'team-2'; name: string }
  | { type: 'RANDOMIZE_TEAMS' }
  | { type: 'START_GAME' }
  | { type: 'START_TURN_NOW' }
  | { type: 'MARK_GUESSED' }
  | { type: 'SKIP_WORD' }
  | { type: 'MARK_TABOO' }
  | { type: 'NEXT_TURN' }
  | { type: 'PLAY_AGAIN' }
  | { type: 'KICK_PLAYER'; targetPlayerId: string }
  | { type: 'PING' };

export type PalabraSecretaServerMessage =
  | { type: 'ROOM_STATE'; state: PalabraSecretaRoomState }
  | { type: 'WORD_UPDATE'; word: SecretWordItem | null; turnPoints: number; turnSkipsUsed: number }
  | { type: 'TURN_TICK'; remainingSeconds: number }
  | { type: 'PRE_TURN_TICK'; countdown: number }
  | { type: 'TURN_ENDED'; summary: PalabraSecretaTurnSummary; state: PalabraSecretaRoomState }
  | { type: 'GAME_OVER'; state: PalabraSecretaRoomState }
  | { type: 'ACTION_FEEDBACK'; action: 'GUESSED' | 'SKIPPED' | 'TABOO'; word: string; points: number }
  | { type: 'ERROR'; message: string; code?: string }
  | { type: 'PONG' };
