export type EntreToposRole = 'INOCENTE' | 'TOPO';

export type EntreToposPhase =
  | 'LOBBY'
  | 'ROUND_INTRO'
  | 'WRITING'
  | 'DISCUSSION'
  | 'VOTING'
  | 'VOTE_REVEAL'
  | 'MOLE_GUESS'
  | 'ROUND_RESULTS'
  | 'FINAL_RESULTS'
  | 'MATCH_ABORTED';

export type WritingDurationSeconds = 20 | 30 | 45 | 60 | 90;
export type DiscussionDurationSeconds = 45 | 60 | 90 | 120 | 180;
export type TotalRoundsCount = 1 | 3 | 5;

export interface MoleCustomization {
  hat: string; // e.g. 'none', 'boina', 'bombin', 'detective', 'corona', etc.
  face: string; // e.g. 'none', 'gafas-sol', 'monoculo', 'bigote', etc.
  clothing: string; // e.g. 'none', 'gabardina', 'traje', 'sudadera', etc.
  color: string; // Hex color for mole fur
}

export interface EntreToposPlayer {
  id: string;
  name: string;
  avatar: string;
  color: string;
  isConnected: boolean;
  isHost: boolean;
  score: number;
  moleCustomization: MoleCustomization;
  // Dynamic round fields:
  role?: EntreToposRole; // Only populated for the local player (or all players at reveal)
  clue?: string; // Revealed during DISCUSSION
  hasSubmittedClue: boolean;
  votedPlayerId?: string | null;
  hasVoted: boolean;
  votesReceived: number;
  isAccused?: boolean;
}

export interface EntreToposConfig {
  writingTimeSeconds: WritingDurationSeconds;
  discussionTimeSeconds: DiscussionDurationSeconds;
  totalRounds: TotalRoundsCount;
}

export interface BoardData {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  words: string[]; // Exactly 16 unique words
  secretWord?: string; // STRICTLY EXCLUDED for the Topo during playing phases!
}

export interface VoteRecord {
  voterId: string;
  targetId: string;
}

export interface RoundResultSummary {
  roundNumber: number;
  categoryName: string;
  secretWord: string;
  topoPlayerId: string;
  topoSucceeded: boolean;
  topoGuessedSecretWord?: boolean;
  moleGuessWord?: string;
  accusedPlayerId?: string;
  pointsAwarded: Record<string, number>; // playerId -> points
}

// Client-facing room state (Sanitized per player!)
export interface EntreToposRoomState {
  code: string;
  gameType: 'entre-topos';
  hostId: string;
  phase: EntreToposPhase;
  config: EntreToposConfig;
  currentRound: number;
  players: EntreToposPlayer[];
  board: BoardData | null;
  // Local player's own role (always authoritative)
  myRole?: EntreToposRole;
  // Timer state
  timerSecondsRemaining?: number;
  timerEndsAt?: number;
  // Discussion / voting details
  allVotesRevealed?: VoteRecord[];
  accusedPlayerId?: string;
  isMoleCaught?: boolean;
  moleGuessTimeoutSeconds?: number;
  moleGuessSelectedWord?: string;
  // Round results
  roundSummary?: RoundResultSummary;
  // Abort info
  abortReason?: string;
}

// Client-to-Server actions
export type EntreToposClientMessage =
  | {
      type: 'JOIN_ROOM';
      code: string;
      player: {
        id: string;
        name: string;
        avatar?: string;
        color?: string;
        moleCustomization?: MoleCustomization;
      };
    }
  | {
      type: 'UPDATE_MOLE';
      moleCustomization: MoleCustomization;
      name?: string;
    }
  | {
      type: 'UPDATE_CONFIG';
      config: Partial<EntreToposConfig>;
    }
  | {
      type: 'START_GAME';
    }
  | {
      type: 'SUBMIT_CLUE';
      clue: string;
    }
  | {
      type: 'CAST_VOTE';
      targetPlayerId: string;
    }
  | {
      type: 'MOLE_GUESS_WORD';
      word: string;
    }
  | {
      type: 'NEXT_ROUND';
    }
  | {
      type: 'PLAY_AGAIN';
    }
  | {
      type: 'KICK_PLAYER';
      targetPlayerId: string;
    }
  | {
      type: 'LEAVE_ROOM';
    }
  | {
      type: 'PING';
    }
  | {
      type: 'RECONNECT';
      code: string;
      playerId: string;
    };

// Server-to-Client message
export type EntreToposServerMessage =
  | {
      type: 'SYNC_STATE';
      state: EntreToposRoomState;
    }
  | {
      type: 'ERROR';
      message: string;
    }
  | {
      type: 'NOTIFICATION';
      text: string;
      level?: 'info' | 'warning' | 'success';
    }
  | {
      type: 'PONG';
    };
