export interface ElPrecioJustoConfig {
  maxMoneyAmount: number; // Configurable up to 1,000,000 € (e.g. 10000, 50000, 100000, 500000, 1000000)
  minMoneyAmount: 5; // Fixed minimum 5 €
  speakingTurnMode: 'free_speech'; // No automatic speaking turns
  investigationTimerMode: 'no_forced_timer'; // No forced investigation timer
}

export interface ElPrecioJustoPlayer {
  id: string;
  name: string;
  avatar: string;
  color: string;
  isHost: boolean;
  isConnected: boolean;
  isReady: boolean;
  score: number;
  // Private money amount: strictly server-authoritative and private.
  // ONLY serialized to the specific player who owns it, never broadcast to other players!
  privateMoneyAmount?: number;
}

export type ElPrecioJustoPhase =
  | 'LOBBY'
  | 'MONEY_DISTRIBUTION'
  | 'FREE_INVESTIGATION'
  | 'FINAL_ESTIMATION'
  | 'RESULTS'
  | 'MATCH_ABORTED';

export interface ElPrecioJustoRoomState {
  code: string;
  gameType: 'el-precio-justo';
  hostId: string;
  phase: ElPrecioJustoPhase;
  config: ElPrecioJustoConfig;
  players: ElPrecioJustoPlayer[];
  currentRound: number;
  timerRemainingSeconds: number;
  abortReason?: string;
}

export type ElPrecioJustoClientMessage =
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
      config: Partial<ElPrecioJustoConfig>;
    }
  | {
      type: 'TOGGLE_READY';
      isReady: boolean;
    }
  | {
      type: 'START_GAME';
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

export type ElPrecioJustoServerMessage =
  | {
      type: 'ROOM_STATE';
      state: ElPrecioJustoRoomState;
    }
  | {
      type: 'ERROR';
      message: string;
    }
  | {
      type: 'PONG';
    };

/**
 * Validates if an amount complies strictly with the rounded-number generation rules:
 * - 5–99: multiples of 5
 * - 100–999: multiples of 50
 * - 1,000–9,999: multiples of 500
 * - 10,000–99,999: multiples of 5,000
 * - 100,000–1,000,000: multiples of 50,000
 *
 * Valid examples: 15, 750, 3500, 30000, 250000, 900000.
 * Invalid examples: 30500, 245750, 123455.
 */
export function isValidRoundedAmount(amount: number): boolean {
  if (typeof amount !== 'number' || isNaN(amount) || !Number.isInteger(amount)) return false;
  if (amount < 5 || amount > 1000000) return false;

  if (amount <= 99) {
    return amount % 5 === 0;
  }
  if (amount <= 999) {
    return amount % 50 === 0;
  }
  if (amount <= 9999) {
    return amount % 500 === 0;
  }
  if (amount <= 99999) {
    return amount % 5000 === 0;
  }
  return amount % 50000 === 0;
}

/**
 * Generates an authoritative rounded number respecting magnitude tiers.
 */
export function generateRoundedAmount(min: number = 5, max: number = 1000000): number {
  const tiers = [
    { min: 5, max: 99, step: 5 },
    { min: 100, max: 999, step: 50 },
    { min: 1000, max: 9999, step: 500 },
    { min: 10000, max: 99999, step: 5000 },
    { min: 100000, max: 1000000, step: 50000 },
  ].filter((t) => t.min <= max && t.max >= min);

  if (tiers.length === 0) return 5;

  const chosenTier = tiers[Math.floor(Math.random() * tiers.length)];
  const actualMin = Math.max(min, chosenTier.min);
  const actualMax = Math.min(max, chosenTier.max);

  const minStep = Math.ceil(actualMin / chosenTier.step);
  const maxStep = Math.floor(actualMax / chosenTier.step);

  if (maxStep < minStep) return minStep * chosenTier.step;
  const stepIndex = minStep + Math.floor(Math.random() * (maxStep - minStep + 1));
  return stepIndex * chosenTier.step;
}
