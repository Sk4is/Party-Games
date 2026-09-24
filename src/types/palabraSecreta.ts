export type PalabraSecretaPhase =
  | 'LOBBY'
  | 'PRE_TURN'
  | 'ACTIVE_TURN'
  | 'TURN_RESULTS'
  | 'PODIUM'
  | 'MATCH_ABORTED';

export type PalabraSecretaGameMode = 'CLASSIC' | 'PASSWORD' | 'EMOJI';

export type EmojiCategory = 'CINEMA' | 'VIDEOGAMES' | 'BOTH';

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
  color: string; // e.g. '#10B981' for Emerald, '#06B6D4' for Cyan
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
  gameMode: PalabraSecretaGameMode;
  timePerTurn: number; // 30, 45, 60, 90 (default 60 for Classic and Emoji)
  totalRounds: number; // 2, 3, 4, 5 (default 3)
  maxSkipsPerTurn: number; // -1 for unlimited, 1, 2, 3
  penaltyOnSkip: boolean; // default true (-1 pt)
  penaltyOnTaboo: boolean; // default true
  showForbiddenWords: boolean; // default true
  // Mode 2: Password
  passwordTargetCount: number; // default 10 targets
  passwordClueBudget: number; // default 15 clues
  // Mode 3: Emoji Misterioso
  emojiCategory: EmojiCategory; // 'CINEMA' | 'VIDEOGAMES' | 'BOTH'
}

export type PasswordTargetStatus = 'PENDING' | 'CURRENT' | 'CORRECT' | 'SKIPPED';

export interface PasswordProgressItem {
  id: string;
  index: number;
  status: PasswordTargetStatus;
  isGuessed: boolean;
  word?: string; // Only descriptor receives this!
}

export interface EmojiCandidateItem {
  id: string;
  title: string;
  category: 'MOVIE' | 'VIDEOGAME';
}

export interface PalabraSecretaTurnSummary {
  teamId: 'team-1' | 'team-2';
  teamName: string;
  descriptorName: string;
  descriptorAvatar: string;
  pointsGained: number;
  gameMode: PalabraSecretaGameMode;
  // Classic mode details
  words?: TurnWordResult[];
  // Password mode details
  passwordSummary?: {
    correctCount: number;
    totalTargets: number;
    clueWordCount: number;
    budget: number;
    multiplier?: number;
    overBudgetWords?: number;
    penalty?: number;
    basePoints: number;
    finalPoints: number;
  };
  // Emoji mode details
  emojiSummary?: {
    correctCount: number;
    skipCount: number;
    penalty: number;
    finalPoints: number;
  };
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
  // Masked info for non-descriptors
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

  // --- PASSWORD MODE FIELDS ---
  passwordTargetCount?: number;
  passwordClueBudget?: number;
  passwordClueWordCount?: number; // Public (e.g. 7 / 15)
  passwordCorrectCount?: number; // Public (e.g. 4 / 10)
  passwordCurrentIndex?: number; // Public (0..9)
  passwordCurrentWord?: string | null; // ONLY for descriptor!
  passwordTargetsProgress?: PasswordProgressItem[]; // Public list of 10 items (descriptor sees words)

  // --- EMOJI MISTERIOSO FIELDS ---
  emojiCandidateOptions?: EmojiCandidateItem[]; // ONLY for descriptor!
  emojiSelectedTargetId?: string | null;
  emojiSelectedTitle?: string | null; // ONLY for descriptor!
  emojiSelectedCategory?: 'MOVIE' | 'VIDEOGAME' | null; // Public subtle category icon
  emojiClue?: string; // Public (up to 5 emojis, e.g. 🚢🧊💔🌊)
  emojiCount?: number; // Public (0..5)
  emojiCorrectCount?: number; // Public
  emojiSkipCount?: number; // Public
  emojiPhase?: 'CHOOSE_OPTION' | 'COMPOSE_CLUE' | 'GUESSING';
}

export type PalabraSecretaClientMessage =
  | { type: 'JOIN_ROOM'; roomCode: string; player: { id: string; name: string; avatar: string; color: string } }
  | { type: 'UPDATE_CONFIG'; config: Partial<PalabraSecretaConfig> }
  | { type: 'SWITCH_TEAM'; playerId: string; targetTeamId: 'team-1' | 'team-2' }
  | { type: 'UPDATE_TEAM_NAME'; teamId: 'team-1' | 'team-2'; name: string }
  | { type: 'RANDOMIZE_TEAMS' }
  | { type: 'START_GAME' }
  | { type: 'START_TURN_NOW' }
  // Classic mode
  | { type: 'MARK_GUESSED'; actionId?: string }
  | { type: 'SKIP_WORD'; actionId?: string }
  | { type: 'MARK_TABOO'; actionId?: string }
  // Password mode
  | { type: 'INCREMENT_CLUE_COUNT'; actionId?: string }
  | { type: 'DECREMENT_CLUE_COUNT'; actionId?: string }
  | { type: 'PASSWORD_MARK_GUESSED'; targetId?: string; actionId?: string }
  | { type: 'PASSWORD_SKIP_WORD'; targetId?: string; actionId?: string }
  | { type: 'PASSWORD_FINISH_TURN'; actionId?: string }
  // Emoji mode
  | { type: 'EMOJI_CHOOSE_OPTION'; optionId: string; actionId?: string }
  | { type: 'EMOJI_UPDATE_CLUE'; clue: string; actionId?: string }
  | { type: 'EMOJI_MARK_GUESSED'; actionId?: string }
  | { type: 'EMOJI_SKIP'; actionId?: string }
  // General
  | { type: 'NEXT_TURN' }
  | { type: 'PLAY_AGAIN' }
  | { type: 'KICK_PLAYER'; targetPlayerId: string }
  | { type: 'LEAVE_ROOM' }
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
