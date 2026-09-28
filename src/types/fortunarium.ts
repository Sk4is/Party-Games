export type NormalSymbolId =
  | 'cereza'
  | 'limon'
  | 'naranja'
  | 'ciruela'
  | 'uvas'
  | 'trebol'
  | 'campana'
  | 'herradura'
  | 'estrella'
  | 'diamante'
  | 'corona'
  | 'siete';

export type SpecialSymbolId =
  | 'bomba'
  | 'llave'
  | 'rayo'
  | 'calavera'
  | 'comodin'
  | 'moneda'
  | 'interrogacion';

export type FortunariumSymbolId = NormalSymbolId | SpecialSymbolId;

export type FortunariumPhase =
  | 'LOBBY'
  | 'PLAYING'
  | 'EVENT_CHOICE'
  | 'ROUND_SHOP'
  | 'VICTORY'
  | 'DEFEAT';

export type FortunariumBetMode = 'normal' | 'doble' | 'sobrecarga';

export type FortunariumTurnMode = 'turns' | 'free';

export type FortunariumDifficulty = 'normal' | 'dificil' | 'temerario';

export interface FortunariumConfig {
  totalRounds: 5 | 7 | 10;
  difficulty: FortunariumDifficulty;
  turnMode: FortunariumTurnMode;
}

export interface FortunariumPlayerStats {
  spinsTriggered: number;
  totalMoneyGenerated: number;
  totalMoneyLost: number;
  netBalance: number;
  biggestSingleWin: number;
  jackpotsHit: number;
  bombsTriggered: number;
  skullsTriggered: number;
  coinsCollected: number;
  keysFound: number;
  integrityDamageCaused: number;
  integrityRepaired: number;
  upgradesBought: number;
}

export interface FortunariumPlayer {
  id: string;
  name: string;
  avatar: string;
  color: string;
  seatIndex: number;
  isHost: boolean;
  isConnected: boolean;
  stats: FortunariumPlayerStats;
}

export interface FortunariumCellCoord {
  col: number; // 0..4
  row: number; // 0..2
}

export type FortunariumPatternType =
  | 'HORIZONTAL'
  | 'DIAGONAL'
  | 'V'
  | 'V_INVERTIDA'
  | 'ZIGZAG';

export interface FortunariumWinLine {
  id: string;
  name: string;
  patternType: FortunariumPatternType;
  patternMultiplier: number;
  symbolId: FortunariumSymbolId;
  count: number;
  payout: number;
  cells: FortunariumCellCoord[];
}

export interface FortunariumSpecialEffectLog {
  id: string;
  symbolId: SpecialSymbolId | 'synergy';
  title: string;
  description: string;
  moneyDelta: number;
  integrityDelta: number;
  voltageDelta: number;
  keysDelta: number;
  variant: 'positive' | 'negative' | 'neutral' | 'jackpot';
  cells: FortunariumCellCoord[];
}

export interface FortunariumSpinResult {
  spinId: string;
  stateVersion: number;
  playerId: string;
  playerName: string;
  betMode: FortunariumBetMode;
  spinCost: number;
  moneyBeforeSpin: number;
  moneyAfterSpinCost: number;
  finalMoney: number;
  quotaProgressBefore: number;
  finalQuotaProgress: number;
  grid: FortunariumSymbolId[][]; // 5 columns x 3 rows: grid[col][row]
  winLines: FortunariumWinLine[];
  specialEffects: FortunariumSpecialEffectLog[];
  winningCells: FortunariumCellCoord[];
  hazardCells: FortunariumCellCoord[];
  grossPayout: number;
  penalties: number;
  netMoneyDelta: number;
  integrityDelta: number;
  finalIntegrity: number;
  voltageMultiplierUsed: number;
  voltageMultiplierAfter: number;
  keysGained: number;
  finalKeys: number;
  extraSpinsGained: number;
  triggeredEventId?: string | null;
  isJackpot: boolean;
  summaryText: string;
  timestamp: number;
}

export type FortunariumUpgradeId =
  | 'cosecha_roja'
  | 'huerto_citrico'
  | 'campana_bronce'
  | 'iman_diamante'
  | 'siete_dorado'
  | 'geometra'
  | 'mano_tahur'
  | 'mecanico_jefe'
  | 'cableado_ilegal'
  | 'prensa_uvas'
  | 'artificiero'
  | 'motor_extra';

export interface FortunariumUpgradeState {
  id: FortunariumUpgradeId;
  level: number;
  maxLevel: number;
}

export interface FortunariumEventOption {
  id: string;
  label: string;
  description: string;
  costMoney?: number;
  costKeys?: number;
  badgeText: string;
  riskLevel: 'safe' | 'medium' | 'high';
}

export interface FortunariumActiveEvent {
  id: string;
  title: string;
  subtitle: string;
  triggeredByPlayerId: string;
  triggeredByPlayerName: string;
  options: FortunariumEventOption[];
}

export interface FortunariumActionLogEntry {
  id: string;
  playerId?: string;
  playerName?: string;
  text: string;
  moneyDelta?: number;
  integrityDelta?: number;
  variant: 'spin' | 'win' | 'hazard' | 'upgrade' | 'event' | 'repair' | 'round';
  timestamp: number;
}

export interface FortunariumRoomState {
  roomCode: string;
  stateVersion: number;
  gameType: 'fortunarium';
  phase: FortunariumPhase;
  config: FortunariumConfig;
  players: FortunariumPlayer[];
  currentTurnPlayerId: string | null;

  // Shared Machine State
  round: number;
  totalRounds: number;
  money: number; // CAJA COMÚN (spendable shared credits)
  quotaProgress: number; // PROGRESO DE CUOTA (earnings accumulated toward current cycle quota)
  quota: number; // Current cycle quota target
  spinsLeft: number;
  maxSpinsPerRound: number;
  totalSpinsInMatch: number;

  integrity: number;
  maxIntegrity: number;
  voltageMultiplier: number;
  keys: number;
  betMode: FortunariumBetMode;

  // 5 columns x 3 rows grid: grid[col][row]
  grid: FortunariumSymbolId[][];
  isSpinning: boolean;
  lastSpinResult: FortunariumSpinResult | null;

  upgrades: Record<FortunariumUpgradeId, number>;
  // 3 Random upgrade options offered upon completing a quota
  offeredUpgradeIds: FortunariumUpgradeId[];
  // Map of playerId -> chosen FortunariumUpgradeId for unanimous multiplayer selection
  upgradeVotes: Record<string, FortunariumUpgradeId>;

  activeEvent: FortunariumActiveEvent | null;
  readyForNextRoundPlayerIds: string[];
  actionLog: FortunariumActionLogEntry[];

  endReason?: string | null;
}

export type FortunariumWinTier = 'NONE' | 'LOSS' | 'SMALL' | 'MEDIUM' | 'BIG' | 'HUGE' | 'JACKPOT';

export interface FortunariumRemoteCursor {
  playerId: string;
  name: string;
  color: string;
  x: number; // normalized 0..1 relative to shared Fortunarium scene
  y: number; // normalized 0..1 relative to shared Fortunarium scene
  updatedAt: number;
}

export type FortunariumClientMessage =
  | {
      type: 'JOIN_ROOM';
      roomCode: string;
      player: {
        id: string;
        name: string;
        avatar: string;
        color: string;
      };
    }
  | {
      type: 'SET_CURSOR_COLOR';
      color: string;
    }
  | {
      type: 'CURSOR_MOVE';
      x: number;
      y: number;
    }
  | {
      type: 'UPDATE_CONFIG';
      config: Partial<FortunariumConfig>;
    }
  | {
      type: 'START_GAME';
    }
  | {
      type: 'SET_BET_MODE';
      betMode: FortunariumBetMode;
    }
  | {
      type: 'SPIN_SLOT';
      forceScenario?: 'single_pattern' | 'multi_pattern' | 'special_symbol' | 'jackpot';
    }
  | {
      type: 'REPAIR_MACHINE';
      useKey?: boolean;
    }
  | {
      type: 'BUY_UPGRADE';
      upgradeId: FortunariumUpgradeId;
      useKey?: boolean;
    }
  | {
      type: 'VOTE_UPGRADE';
      upgradeId: FortunariumUpgradeId;
    }
  | {
      type: 'RESOLVE_EVENT';
      optionId: string;
    }
  | {
      type: 'PAY_QUOTA_EARLY';
    }
  | {
      type: 'NEXT_ROUND';
    }
  | {
      type: 'RESTART_MATCH';
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

export type FortunariumServerMessage =
  | {
      type: 'ROOM_STATE';
      state: FortunariumRoomState;
    }
  | {
      type: 'SPIN_STARTED';
      spinResult: FortunariumSpinResult;
      state: FortunariumRoomState;
    }
  | {
      type: 'CURSOR_UPDATE';
      playerId: string;
      name: string;
      color: string;
      x: number;
      y: number;
    }
  | {
      type: 'NOTIFICATION';
      text: string;
      variant?: 'info' | 'warning' | 'danger' | 'success';
    }
  | {
      type: 'ERROR';
      message: string;
    }
  | {
      type: 'PONG';
    };
