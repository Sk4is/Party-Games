import {
  LetterSequence,
  GameConfig,
  UsedWord,
  BombDangerLevel,
  GameStats,
  BlackCard,
  LaPeorRespuestaConfig,
} from '../types';

export type SupportedGame = 'la-bomba' | 'la-peor-respuesta' | 'pinturillo';

export interface BaseParticipant {
  id: string;
  name: string;
  avatar: string;
  color: string;
  isHost: boolean;
  isConnected: boolean;
}

// ==========================================
// LA BOMBA MULTIPLAYER STATE
// ==========================================

export interface BombaPlayerState extends BaseParticipant {
  lives: number;
  mistakes: number;
  roundMistakes: number;
  multiplier: number;
  isEliminated: boolean;
  bombsReceived: number;
  validWordsCount: number;
  fastestAnswerTimeMs: number | null;
  lastValidWord: string | null;
  currentTypingWord: string;
  alphabetProgress: string[]; // 27 Spanish letters individual progress
}

export type BombaPhase =
  | 'LOBBY'
  | 'ROUND_INTRO'
  | 'PLAYING'
  | 'EXPLOSION'
  | 'GAME_OVER'
  | 'MATCH_ABORTED';

export interface BombaRoomState {
  code: string;
  gameType: 'la-bomba';
  hostId: string;
  phase: BombaPhase;
  config: GameConfig;
  players: BombaPlayerState[];
  currentSequence: LetterSequence | null;
  activePlayerIndex: number;
  activePlayerId: string | null;
  roundNumber: number;
  bombRemainingMs: number;
  bombDurationMs: number;
  dangerLevel: BombDangerLevel;
  usedWords: UsedWord[];
  acceptedWordBanner: {
    word: string;
    player: string;
    bonusLetters?: number;
  } | null;
  affectedPlayer: BombaPlayerState | null;
  winner: BombaPlayerState | null;
  stats: GameStats;
  abortReason?: string;
  endMessage?: string;
}

// ==========================================
// LA PEOR RESPUESTA MULTIPLAYER STATE
// ==========================================

export interface LPRPlayerState extends BaseParticipant {
  score: number;
  hasSubmittedAnswer: boolean;
  hasVoted: boolean;
}

export type LPRPhase =
  | 'LOBBY'
  | 'WRITING'
  | 'REVEAL'
  | 'VOTING'
  | 'RESULTS'
  | 'FINAL_RESULTS'
  | 'MATCH_ABORTED';

export interface LPRShuffledCard {
  id: string;
  text: string;
  revealed: boolean;
  isOwnCard?: boolean; // Only true for the requesting client!
  votesCount?: number; // Shown in RESULTS
  authorId?: string; // Shown in RESULTS
  authorName?: string; // Shown in RESULTS
  authorAvatar?: string; // Shown in RESULTS
  authorColor?: string; // Shown in RESULTS
  votes?: string[]; // Shown in RESULTS
  isWinner?: boolean; // Shown in RESULTS
}

export interface LPRRoomState {
  code: string;
  gameType: 'la-peor-respuesta';
  hostId: string;
  phase: LPRPhase;
  config: LaPeorRespuestaConfig;
  players: LPRPlayerState[];
  round: number;
  currentBlackCard: BlackCard | null;
  answers: LPRShuffledCard[];
  readyCount: number;
  votedCount: number;
  winningAuthorIds?: string[];
  abortReason?: string;
  endMessage?: string;
}

// Normalized cursor for live board cursors
export interface BoardCursor {
  playerId: string;
  name: string;
  avatar: string;
  color: string;
  x: number; // 0.0 to 1.0
  y: number; // 0.0 to 1.0
  updatedAt: number;
}

// ==========================================
// WEBSOCKET MESSAGES PROTOCOL
// ==========================================

export type PartyClientMessage =
  | {
      type: 'create_room';
      gameType: 'la-bomba' | 'la-peor-respuesta';
      player: { id: string; name: string; avatar: string; color: string };
      config?: Partial<GameConfig | LaPeorRespuestaConfig>;
    }
  | {
      type: 'join_room';
      code: string;
      player: { id: string; name: string; avatar: string; color: string };
    }
  | {
      type: 'update_config';
      config: Partial<GameConfig | LaPeorRespuestaConfig>;
    }
  | {
      type: 'start_game';
    }
  | {
      type: 'leave_room';
    }
  // La Bomba client actions
  | {
      type: 'bomba_typing';
      text: string;
    }
  | {
      type: 'bomba_submit_word';
      word: string;
    }
  | {
      type: 'bomba_dismiss_explosion';
    }
  | {
      type: 'bomba_play_again';
    }
  // La Peor Respuesta client actions
  | {
      type: 'lpr_submit_answer';
      text: string;
    }
  | {
      type: 'lpr_reveal_card';
      cardId: string;
    }
  | {
      type: 'lpr_reveal_all';
    }
  | {
      type: 'lpr_proceed_voting';
    }
  | {
      type: 'lpr_submit_vote';
      cardId: string;
    }
  | {
      type: 'lpr_cursor_move';
      x: number;
      y: number;
    }
  | {
      type: 'lpr_next_round';
    }
  | {
      type: 'lpr_play_again';
    }
  | {
      type: 'ping';
    };

export type PartyServerMessage =
  | {
      type: 'room_state';
      state: BombaRoomState | LPRRoomState;
    }
  | {
      type: 'error';
      message: string;
      code?: string;
    }
  | {
      type: 'notification';
      message: string;
      noticeType?: 'info' | 'success' | 'warning';
    }
  | {
      type: 'bomba_typing_broadcast';
      playerId: string;
      text: string;
    }
  | {
      type: 'bomba_feedback';
      feedbackType: 'success' | 'error';
      message: string;
      canonicalWord?: string;
    }
  | {
      type: 'bomba_alphabet_reward';
      playerId: string;
      playerName: string;
      gainedLife: boolean;
    }
  | {
      type: 'lpr_cursor_broadcast';
      cursor: BoardCursor;
    }
  | {
      type: 'pong';
    };
