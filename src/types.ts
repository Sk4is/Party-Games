export interface LetterSequence {
  sequence: string; // e.g. "TRA", "ADO", "OMN"
  difficulty: 'EASY' | 'NORMAL' | 'HARD';
  wordCount?: number;
  examples?: string[];
}

export interface Player {
  id: string;
  name: string;
  color: string;
  avatar: string;
  lives: number; // starts at 3
  mistakes: number;
  multiplier: number; // 1.0, 1.5, 2.25, 3.375...
  isEliminated: boolean;
  bombsReceived: number;
  validWordsCount: number;
  fastestAnswerTimeMs: number | null;
  lastValidWord?: string | null; // Last valid word submitted by this player in the current round
  currentTypingWord?: string; // Realtime live typing state for the active player
  alphabetProgress?: string[]; // Array of unique uppercase letters completed in Spanish alphabet challenge (e.g. ['A', 'B', 'Ñ'])
}

export type GamePhase =
  | 'MENU'
  | 'SETUP'
  | 'ROUND_INTRO'
  | 'PLAYING'
  | 'EXPLOSION'
  | 'GAME_OVER';

export type BombDangerLevel = 'EARLY' | 'MIDDLE' | 'DANGER' | 'CRITICAL';

export interface UsedWord {
  word: string;
  canonicalWord: string;
  playerId: string;
  playerName: string;
  playerColor: string;
  timestamp: number;
}

export interface WordValidationResult {
  valid: boolean;
  canonicalAnswer: string;
  reason?: string;
  errorType?: 'NO_SEQUENCE' | 'NOT_A_WORD' | 'DUPLICATE' | 'TOO_SHORT' | null;
  duplicate?: boolean;
}

export interface GameStats {
  winner: Player | null;
  totalValidWords: number;
  totalMistakes: number;
  totalExplosions: number;
  fastestAnswer: {
    playerName: string;
    playerColor: string;
    timeSeconds: number;
    word: string;
  } | null;
  mostBurntPlayer: {
    player: Player;
    explosions: number;
  } | null;
}
