export type CuantoTeAtrevesChallengesCount = 'unlimited' | 5 | 10 | 20;

export interface CuantoTeAtrevesConfig {
  challengeTimeSeconds: number; // 15 to 90 seconds, step of 5
  challengesCount: CuantoTeAtrevesChallengesCount;
}

export interface CuantoTeAtrevesTopic {
  id: string;
  text: string;
  title?: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  validationHint: string;
  hint?: string;
  tags?: string[];
}

export interface CuantoTeAtrevesPlayer {
  id: string;
  name: string;
  avatar: string;
  color: string;
  isHost: boolean;
  isConnected: boolean;
  isReady: boolean;
  score: number;
  challengesCompleted: number;
}

export type CuantoTeAtrevesPhase =
  | 'LOBBY'
  | 'TOPIC_REVEAL'
  | 'BETTING'
  | 'CHALLENGE_ACTIVE'
  | 'CHALLENGE_RESULT'
  | 'GAME_OVER'
  | 'MATCH_ABORTED';

export interface CuantoTeAtrevesLastResult {
  success: boolean;
  surrendered: boolean;
  expired: boolean;
  targetBet: number;
  pointsAwarded: number;
  playerId: string;
  playerName: string;
}

export interface CuantoTeAtrevesRoomState {
  code: string;
  gameType: 'cuanto-te-atreves';
  hostId: string;
  phase: CuantoTeAtrevesPhase;
  config: CuantoTeAtrevesConfig;
  players: CuantoTeAtrevesPlayer[];
  currentChallengeNumber: number;
  activePlayerId: string | null;
  currentTopic: CuantoTeAtrevesTopic | null;
  targetBet: number | null;
  timerRemainingSeconds: number;
  isTimerRunning: boolean;
  isTimerPaused: boolean;
  lastResult: CuantoTeAtrevesLastResult | null;
  abortReason?: string;
}

export type CuantoTeAtrevesClientMessage =
  | {
      type: 'JOIN_ROOM';
      code: string;
      player: { id: string; name: string; avatar?: string; color?: string };
    }
  | {
      type: 'RECONNECT';
      code: string;
      playerId: string;
    }
  | {
      type: 'UPDATE_CONFIG';
      config: Partial<CuantoTeAtrevesConfig>;
    }
  | {
      type: 'TOGGLE_READY';
      isReady: boolean;
    }
  | {
      type: 'START_GAME';
    }
  | {
      type: 'SELECT_PLAYER';
      playerId: string;
    }
  | {
      type: 'SET_BET';
      bet: number;
    }
  | {
      type: 'START_CHALLENGE';
    }
  | {
      type: 'RESOLVE_CHALLENGE';
      outcome: 'SUCCESS' | 'SURRENDER';
    }
  | {
      type: 'TOGGLE_PAUSE_TIMER';
    }
  | {
      type: 'NEXT_ROUND';
    }
  | {
      type: 'FINISH_GAME';
    }
  | {
      type: 'TRANSFER_HOST';
      targetPlayerId: string;
    }
  | {
      type: 'KICK_PLAYER';
      targetPlayerId: string;
    }
  | {
      type: 'RETURN_TO_LOBBY';
    }
  | {
      type: 'LEAVE_ROOM';
    }
  | {
      type: 'PING';
    };

export type CuantoTeAtrevesServerMessage =
  | {
      type: 'ROOM_STATE';
      state: CuantoTeAtrevesRoomState;
    }
  | {
      type: 'ERROR';
      message: string;
    }
  | {
      type: 'PONG';
    };

export {
  CUANTO_TE_ATREVES_TOPICS,
  CUANTO_TE_ATREVES_CATEGORIES,
  TOTAL_TOPICS_COUNT,
  pickBalancedTopic,
} from '../data/cuanto-te-atreves';

