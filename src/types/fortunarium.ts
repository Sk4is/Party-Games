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

export interface FortunariumPlayerSessionStats {
  playerId: string;
  displayName: string;
  cursorColor: string;
  firstJoinedOrder: number;
  isCurrentlyInRoom: boolean;
  isConnected: boolean;

  matchesPlayed: number;
  spins: number;
  creditsWon: number;
  creditsLost: number;
  netBalance: number;

  bestSpin: number;
  quotasCompleted: number;
  jackpots: number;
}

export interface FortunariumRoomSessionSummary {
  totalMatchesPlayed: number;
  totalSpins: number;
  totalQuotasCompleted: number;
  totalJackpots: number;
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
  baseSymbolValue?: number;
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
  | 'geometra_efecto'
  | 'diagonal_perfecta'
  | 'ojo_dorado'
  | 'dinamita'
  | 'motor_fino'
  | 'lluvia_monedas'
  | 'escudo_termico'
  | 'sobrecarga_dorada'
  | 'fortuna_desatada'
  | 'siete_suerte'
  | 'mano_afortunada'
  | 'motor_al_rojo'
  | 'recalentamiento'
  | 'cableado_quemado'
  | 'iman_roto'
  | 'rodillo_pegado'
  | 'apuesta_forzada'
  | 'mal_contacto'
  | 'hacienda'
  | 'mala_racha'
  | 'fuga_creditos'
  | 'rodillos_oxidados'
  | 'mano_negra';

export interface FortunariumVoltageModifier {
  id: string;
  source: string;
  multiplier: number;
  remainingSpins: number;
}

export interface FortunariumActiveModifier {
  id: string;
  modifierId: FortunariumModifierId;
  name: string;
  type: 'BUFF' | 'DEBUFF';
  effect: string;
  spinsRemaining: number;
  durationType?: 'SPINS' | 'UNTIL_TRIGGER';
  appliedAtSpin: number;
  source?: string;
  targetPlayerId?: string;
  targetPlayerName?: string;
  consumeOnPattern?: boolean;
}

export type FortunariumUpgradeRarity =
  | 'COMÚN'
  | 'POCO COMÚN'
  | 'RARA'
  | 'EXCEPCIONAL';

export interface FortunariumInstalledUpgradeRecord {
  upgradeId: FortunariumUpgradeId;
  level: number;
  round?: number;
  installedAtQuota?: number;
  installedBy?: string;
  installedByPlayerName?: string;
  timestamp: number;
}

export type FortunariumIncidentType =
  | 'blackout'
  | 'electrical_interference'
  | 'stuck_controls'
  | 'loose_cable'
  | 'crt_interference'
  | 'fuse_failure'
  | 'overheating_warning'
  | 'mechanical_obstruction'
  | 'chispazo'
  | 'sobrecalentamiento'
  | 'atasco_engranajes'
  | 'fuga_aceite'
  | 'cortocircuito'
  | 'vibracion_critica'
  | 'ruleta_averiada';

export type FortunariumMalfunctionState = 'ACTIVE' | 'RESOLVED';

export type FortunariumMalfunctionVisualEffect =
  | 'blackout'
  | 'crt_glitch'
  | 'sparks'
  | 'overheat'
  | 'jammed'
  | 'cable_loose';

export interface FortunariumIncidentControl {
  id: string;
  label: string;
  sublabel?: string;
  currentValue: number;
  targetValue: number;
  activatedByPlayerIds: string[];
  activatedByPlayerNames?: string[];
  completed: boolean;
  isCorrectTarget?: boolean;
  statusText?: string;
  variant?: 'primary' | 'danger' | 'bonus' | 'neutral';
}

export interface FortunariumActiveIncident {
  id: string;
  eventId: string;
  incidentId?: string;
  type: FortunariumIncidentType;
  state: FortunariumMalfunctionState;
  startedAt: number;
  resolvedAt?: number | null;
  resolvedByPlayerId?: string | null;
  resolvedByPlayerName?: string | null;
  category?: 'hazard' | 'positive' | 'choice';
  title: string;
  subtitle?: string;
  description: string;
  instructionHint?: string;
  visualEffect?: FortunariumMalfunctionVisualEffect;
  integrityDamage: number;
  emergencyRepairCost: number;
  reducedDamage: number;
  stabilizeIntegrityBonus?: number;
  inflictedModifierId?: FortunariumModifierId;
  targetPlayerId?: string;
  targetPlayerName?: string;
  quotaTriggered?: number;
  timestamp: number;
  jammedReelIndex?: number | null;
  targetFrequencyLabel?: string;
  controls: FortunariumIncidentControl[];
  resolved?: boolean;
  outcomeText?: string | null;
  outcomeVariant?: 'positive' | 'negative' | 'neutral' | null;
  collectedCoins?: number;
  leakedCoins?: number;
}

export interface FortunariumMalfunctionResolvedPayload {
  eventId: string;
  incidentType: FortunariumIncidentType;
  title: string;
  resolvedByPlayerId: string;
  resolvedByPlayerName: string;
  outcomeText: string;
  timestamp: number;
}

export interface FortunariumEffectRouletteState {
  id: string;
  triggeredByReason: string;
  isOverdrive: boolean;
  candidates: FortunariumModifierId[];
  selectedModifierId: FortunariumModifierId;
  targetPlayerId?: string;
  targetPlayerName?: string;
  timestamp: number;
}

export type FortunariumActiveRoulette = FortunariumEffectRouletteState;

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
  activeVoltageModifierUsed?: FortunariumVoltageModifier | null;
  activeVoltageModifierAfter?: FortunariumVoltageModifier | null;
  keysGained: number;
  finalKeys: number;
  extraSpinsGained: number;
  triggeredEventId?: string | null;
  isJackpot: boolean;
  isBigWin?: boolean;
  overdriveSpinNumber?: number;
  overdriveWearAdded?: number;
  summaryText: string;
  timestamp: number;
}

export interface FortunariumBestSpinRecord {
  spinId: string;
  spinNumber: number;
  round: number;
  playerId: string;
  playerName: string;
  playerColor: string;
  betMode: FortunariumBetMode;
  spinCost: number;
  grossPayout: number;
  netMoneyDelta: number;
  isJackpot: boolean;
  isBigWin: boolean;
  patternsCount: number;
  topPatternName: string;
  patternNames: string[];
  specialSummary?: string[];
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
  overdriveSpins?: number; // Extra spins performed AFTER reaching current quota
  overdriveMessage?: string | null; // Physical CRT machine warning during overdrive
  spinsLeft: number; // Spins in current cycle
  maxSpinsPerRound: number;
  totalSpinsInMatch: number;
  totalPatternsHit: number;
  totalJackpotsHit: number;
  biggestSingleWinInMatch: number;
  bestPatternNameInMatch: string;
  peakMoneyInMatch?: number;
  bestSpinsInMatch?: FortunariumBestSpinRecord[];

  integrity: number;
  maxIntegrity: number;
  repairsUsedInQuota?: number;
  voltageMultiplier: number;
  keys: number;
  betMode: FortunariumBetMode;

  // 5 columns x 3 rows grid: grid[col][row]
  grid: FortunariumSymbolId[][];
  isSpinning: boolean;
  lastSpinResult: FortunariumSpinResult | null;

  upgrades: Record<FortunariumUpgradeId, number>;
  upgradeHistory?: FortunariumInstalledUpgradeRecord[];
  offeredUpgradeIds: FortunariumUpgradeId[];
  upgradeVotes: Record<string, FortunariumUpgradeId>;
  lastInstalledUpgradeId?: FortunariumUpgradeId | null;

  // Temporary Buffs & Debuffs (Paper Note on Left of Machine)
  activeModifiers: FortunariumActiveModifier[];

  activeEvent: FortunariumActiveEvent | null;
  activeIncident?: FortunariumActiveIncident | null;
  activeMalfunction?: FortunariumActiveIncident | null;
  activeRoulette?: FortunariumActiveRoulette | null;
  lastIncidentSpin?: number;
  readyForNextRoundPlayerIds: string[];
  actionLog: FortunariumActionLogEntry[];

  defeatCause?: 'bankruptcy' | 'integrity' | 'quota' | null;
  endReason?: string | null;

  // Room-session cumulative statistics (persist across matches for the lifetime of this room only)
  fortunariumSessionStats?: Record<string, FortunariumPlayerSessionStats>;
  fortunariumSessionSummary?: FortunariumRoomSessionSummary;
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
  | 'big_win'
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
      targetPlayerId?: string;
    }
  | {
      type: 'RESOLVE_INCIDENT';
      choice: 'EMERGENCY_REPAIR' | 'ABSORB_IMPACT' | 'INTERACTIVE_FIX';
      eventId?: string;
    }
  | {
      type: 'DISMISS_ROULETTE';
    }
  | {
      type: 'DEV_TRIGGER_INCIDENT';
      incidentType?: FortunariumIncidentType;
    }
  | {
      type: 'DEV_TRIGGER_ROULETTE';
    }
  | {
      type: 'DEV_SET_INTEGRITY';
      integrity: number;
    }
  | {
      type: 'DEV_FORCE_OVERDRIVE';
    }
  | {
      type: 'DEV_FORCE_INCIDENT';
      incidentType: FortunariumIncidentType | 'ruleta_efectos';
    }
  | {
      type: 'DEV_REACH_QUOTA';
    }
  | {
      type: 'INTERACT_INCIDENT';
      incidentId: string;
      controlId: string;
    }
  | {
      type: 'SPIN_ROULETTE';
      rouletteId: string;
    }
  | {
      type: 'COMPLETE_ROULETTE';
      rouletteId: string;
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
      type: 'MALFUNCTION_RESOLVED';
      eventId: string;
      incidentType: FortunariumIncidentType;
      title: string;
      resolvedByPlayerId: string;
      resolvedByPlayerName: string;
      outcomeText: string;
      state: FortunariumRoomState;
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
