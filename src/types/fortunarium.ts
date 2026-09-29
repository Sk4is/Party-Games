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

export type FortunariumPresentationState =
  | 'INTRO_GARAGE'
  | 'INTRO_POWER_ON'
  | 'READY'
  | 'BET_CHANGE'
  | 'LEVER_PULL'
  | 'SPIN_START'
  | 'SPINNING'
  | 'REEL_SETTLING'
  | 'PATTERN_REVEAL'
  | 'SPECIAL_REVEAL'
  | 'RESULT_SUMMARY'
  | 'QUOTA_REACHED'
  | 'QUOTA_SEAL'
  | 'UPGRADE_SELECTION'
  | 'UPGRADE_INSTALL'
  | 'BANKRUPT'
  | 'MACHINE_BROKEN'
  | 'VICTORY';

export type FortunariumBetMode = 'normal' | 'doble' | 'sobrecarga';

export type FortunariumTurnMode = 'turns' | 'free';

export type FortunariumDifficulty = 'normal' | 'dificil' | 'temerario';

export type FortunariumQuotaLimit = 5 | 10 | 15 | 20 | null;

export interface FortunariumConfig {
  totalRounds: FortunariumQuotaLimit; // null = ILIMITADAS
  difficulty: FortunariumDifficulty;
  turnMode: FortunariumTurnMode;
}

export interface FortunariumPlayerStats {
  spinsTriggered: number;
  totalMoneyGenerated: number;
  totalMoneyLost: number;
  netBalance: number;
  biggestSingleWin: number;
  biggestSingleLoss?: number;
  patternsHit: number;
  specialSymbolsTriggered?: number;
  jackpotsHit: number;
  bombsTriggered: number;
  bombsDefused?: number;
  skullsTriggered: number;
  coinsCollected: number;
  keysFound: number;
  integrityDamageCaused: number;
  integrityRepaired: number;
  repairsCount?: number;
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
  | 'VERTICAL'
  | 'DIAGONAL'
  | 'X'
  | 'TRIANGULO'
  | 'TRIANGULO_INVERTIDO'
  | 'PANTALLA_COMPLETA';

export interface FortunariumWildSubstitution {
  col: number;
  row: number;
  substitutedFor: FortunariumSymbolId;
}

export interface FortunariumWinLine {
  id: string;
  patternId: string;
  name: string;
  type: FortunariumPatternType;
  patternType: FortunariumPatternType;
  patternCategory: 'LINE' | 'SHAPE';
  resolvedSymbol: FortunariumSymbolId;
  symbolId: FortunariumSymbolId;
  coordinates: FortunariumCellCoord[];
  cells: FortunariumCellCoord[];
  length: number;
  count: number;
  baseReward: number;
  multiplier: number;
  patternMultiplier: number;
  finalReward: number;
  payout: number;
  wildSubstitutions?: FortunariumWildSubstitution[];
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
  grantedModifierId?: FortunariumModifierId;
}

export type FortunariumModifierId =
  | 'fiebre_cerezas'
  | 'lluvia_monedas'
  | 'escudo_termico'
  | 'sobrecarga_dorada'
  | 'fortuna_desatada'
  | 'siete_suerte'
  | 'cableado_quemado'
  | 'fuga_creditos'
  | 'rodillos_oxidados';

export interface FortunariumActiveModifier {
  id: string;
  modifierId: FortunariumModifierId;
  name: string;
  type: 'BUFF' | 'DEBUFF';
  effect: string;
  spinsRemaining: number;
  appliedAtSpin: number;
}

export interface FortunariumSpinResult {
  spinId: string;
  stateVersion: number;
  playerId: string;
  playerName: string;
  initiatedByPlayerId: string;
  triggerSource: 'button' | 'lever';
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
  jackpotPayout: number;
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
  matchId: string;
  stateVersion: number;
  gameType: 'fortunarium';
  phase: FortunariumPhase;
  config: FortunariumConfig;
  players: FortunariumPlayer[];
  currentTurnPlayerId: string | null;

  // Shared Machine State
  round: number; // Current quota number (1, 2, 3...)
  totalRounds: FortunariumQuotaLimit; // 5 | 10 | 15 | 20 | null (ILIMITADAS)
  money: number; // Shared available credits (NEVER resets when sealing a quota!)
  quotaProgress: number; // Synchronized with shared money for threshold comparison
  quota: number; // Current money threshold target
  spinsLeft: number; // Spins in current cycle
  maxSpinsPerRound: number;
  totalSpinsInMatch: number;
  totalPatternsHit: number;
  totalJackpotsHit: number;
  biggestSingleWinInMatch: number;
  bestPatternNameInMatch: string;

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
  offeredUpgradeIds: FortunariumUpgradeId[];
  upgradeVotes: Record<string, FortunariumUpgradeId>;
  lastInstalledUpgradeId?: FortunariumUpgradeId | null;

  // Temporary Buffs & Debuffs (Paper Note on Left of Machine)
  activeModifiers: FortunariumActiveModifier[];

  activeEvent: FortunariumActiveEvent | null;
  readyForNextRoundPlayerIds: string[];
  actionLog: FortunariumActionLogEntry[];

  defeatCause?: 'bankruptcy' | 'integrity' | 'quota' | null;
  endReason?: string | null;
}

export type FortunariumWinTier =
  | 'NONE'
  | 'LOSS'
  | 'SMALL'
  | 'MEDIUM'
  | 'BIG'
  | 'HUGE'
  | 'JACKPOT';

export interface FortunariumRemoteCursor {
  playerId: string;
  name: string;
  color: string;
  x: number;
  y: number;
  updatedAt: number;
}

export type FortunariumDevScenario =
  | 'horizontal_3'
  | 'horizontal_4'
  | 'horizontal_5'
  | 'vertical_3'
  | 'diagonal_left'
  | 'diagonal_right'
  | 'pat_x'
  | 'triangulo'
  | 'triangulo_invertido'
  | 'multi_pattern'
  | 'three_patterns'
  | 'pattern_overlap'
  | 'wild_substitution'
  | 'no_pattern'
  | 'special_symbol'
  | 'special_bomba'
  | 'special_llave'
  | 'special_rayo'
  | 'special_calavera'
  | 'special_moneda'
  | 'special_interrogacion'
  | 'jackpot'
  | 'pantalla_completa'
  | 'single_pattern'
  | 'force_bankruptcy'
  | 'force_integrity_zero';

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
      forceScenario?: FortunariumDevScenario;
      triggerSource?: 'button' | 'lever';
    }
  | {
      type: 'DEV_GRANT_MODIFIER';
      modifierId: FortunariumModifierId;
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
