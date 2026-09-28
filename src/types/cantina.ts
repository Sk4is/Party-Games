export type CantinaGameMode = 'CLASICO' | 'DIABLO' | 'CADENA';

export type CantinaMapId = 'mapa1' | 'mapa2' | 'mapa3';

// Only J, Q, K are table ranks in Clásico / Diablo (NO 'A'!)
export type TableRank = 'J' | 'Q' | 'K';

// Numeric ranks for Cadena mode (1 through 10)
export type NumericCardRank =
  | '1'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10';

// Cards can be 1..10, J, Q, K, JOKER, BOMBA, ESPEJO, REVOLVER, or DIABLO
export type CardRank =
  | NumericCardRank
  | 'J'
  | 'Q'
  | 'K'
  | 'JOKER'
  | 'BOMBA'
  | 'ESPEJO'
  | 'REVOLVER'
  | 'DIABLO';

export interface Card {
  id: string;
  rank: CardRank;
  substitutedNumber?: number; // 1..10 when a JOKER bridges a number in CADENA mode
}

export type CantinaPhase =
  | 'LOBBY'
  | 'ROUND_INTRO'
  | 'PLAYING'
  | 'REVELACION'
  | 'DEVIL_REVEAL'
  | 'RULETA'
  | 'ROUND_END'
  | 'GAME_OVER'
  | 'MATCH_ABORTED';

export interface CantinaPlayerRevolverState {
  chambers: 6;
  currentRotation: number; // Authoritative cylinder angle in degrees (multiple of 60° at rest)
  topChamberIndex: number; // 0..5 chamber currently at 12 o'clock
  shotsTaken: number; // 0..6 shots taken on this player's personal revolver
  firedChambers: number[]; // Chamber indices (0..5) already tested by this player
}

export type ReflectableSpecialType = 'J' | 'Q' | 'K' | 'BOMBA' | 'REVOLVER';

export interface ReflectableEffect {
  type: ReflectableSpecialType;
  sourcePlayerId: string;
  sourcePlayerName: string;
  timestamp: number;
}

export interface CantinaPlayer {
  id: string;
  name: string;
  avatar: string;
  color: string;
  seatIndex: number; // 0, 1, 2, 3
  isHost: boolean;
  isConnected: boolean;
  isAlive: boolean;
  cardsCount: number;
  hand?: Card[]; // Only provided to the local player by server
  chamberPulls: number; // How many times they have pulled trigger (0 to 6)
  bulletChamber: number; // 0 to 5 (secret on server, -1 on clients while alive, revealed only upon death)
  revolver?: CantinaPlayerRevolverState;
  isEliminated: boolean;
  eliminatedRound?: number;
  // Cadena mode per-player state
  lastReflectableEffectReceived?: ReflectableEffect | null;
}

export interface PlayedTurn {
  playerId: string;
  playerName: string;
  cardsCount: number;
  claimedRank: TableRank;
  cards?: Card[]; // Revealed in Cadena mode or during REVELACION in Clásico/Diablo
  timestamp: number;
  playId: string;
}

export interface CenterPileItem {
  playId: string;
  playerId: string;
  playerName: string;
  cardsCount: number;
  claimedRank: TableRank;
  cards?: Card[]; // In CADENA mode, center pile cards are face-up!
  timestamp: number;
}

export interface ChallengeResult {
  challengeId: string;
  devilRevealEventId?: string;
  accuserPlayerId: string;
  accuserName: string;
  accusedPlayerId: string;
  accusedName: string;
  claimedRank: TableRank;
  revealedCards: Card[];
  isBluff: boolean;
  loserPlayerId: string;
  loserName: string;
  hasDiablo: boolean;
  isFinalHandChallenge?: boolean;
  roundWinnerPlayerId?: string | null;
  roundWinnerName?: string | null;
  description: string;
}

export interface SingleShotResult {
  playerId: string;
  playerName: string;
  fired: boolean;
  chamberNumber: number; // 1 to 6
  survived: boolean;
}

export interface RouletteResult {
  rouletteEventId: string;
  shotEventId?: string | null;
  stepIndex: number;
  totalSteps: number;
  targetPlayerId: string;
  targetPlayerName: string;
  chamberPullsBefore: number;
  chamberNumber: number; // 1 to 6
  cylinderAngle: number; // Authoritative cylinder angle in degrees for targetPlayer's revolver
  firedChamberIndex: number; // 0 to 5 (the chamber at 12 o'clock)
  firedChambersBefore: number[]; // Chamber indices (0..5) already tested on targetPlayer's personal revolver before this shot
  shotResolved: boolean;
  fired: boolean;
  isFatal: boolean;
  survived: boolean;
  isDevilSequence: boolean;
  queuePlayerIds?: string[];
  shots: SingleShotResult[];
}

export type CadenaTurnSubPhase =
  | 'NORMAL'
  | 'DRAWN_DECISION'
  | 'K_STEAL_PICK'
  | 'K_FOLLOWUP_CHAIN'
  | 'BOMB_SELECT_TARGET'
  | 'BOMB_PASS_TARGET'
  | 'REVOLVER_SELECT_TARGET'
  | 'REVOLVER_DUEL';

export interface CadenaUltimaWindow {
  eventId: string;
  targetPlayerId: string;
  targetPlayerName: string;
  declared: boolean;
  caughtByPlayerId: string | null;
  caughtByPlayerName: string | null;
  resolved: boolean;
  deadlineMs: number;
}

export interface CadenaRevolverState {
  eventId: string;
  actorPlayerId: string;
  actorPlayerName: string;
  shooterPlayerId: string;
  shooterPlayerName: string;
  chambers: 6;
  cylinderAngle: number;
  firedChamberIndex: number;
  shotResolved: boolean;
  fired: boolean;
  penaltyCardsCount: number;
  isReflected?: boolean;
}

export interface CadenaVisualEvent {
  eventId: string;
  kind:
    | 'CHAIN_PLAYED'
    | 'J_SKIP'
    | 'Q_REVERSE'
    | 'K_STEAL'
    | 'BOMB_PLACED'
    | 'BOMB_DEFUSED'
    | 'BOMB_TICK'
    | 'BOMB_EXPLODED'
    | 'MIRROR_REFLECTED'
    | 'REVOLVER_TARGETED'
    | 'REVOLVER_BANG'
    | 'REVOLVER_CLICK'
    | 'ULTIMA_DECLARED'
    | 'ULTIMA_CAUGHT'
    | 'ULTIMA_FALSE_ACCUSATION';
  actorPlayerId: string;
  actorPlayerName: string;
  targetPlayerId?: string;
  targetPlayerName?: string;
  reflectedType?: ReflectableSpecialType;
  chainNumbers?: number[];
  turnsRemaining?: number;
  text: string;
  timestamp: number;
}

export type CadenaDrawReason =
  | 'NORMAL_DRAW'
  | 'ULTIMA_PENALTY'
  | 'FALSE_ULTIMA_PENALTY'
  | 'BOMB_EXPLOSION'
  | 'REVOLVER_PENALTY';

export interface CadenaDrawEventData {
  eventId: string;
  playerId: string;
  playerName: string;
  count: number;
  reason: CadenaDrawReason;
  reshuffled: boolean;
  reshuffledCount: number;
  drawPileCountBefore: number;
  drawPileCountAfter: number;
  drawnCardIds?: string[];
  drawnCards?: Card[]; // Strictly provided ONLY to the player who drew the cards; undefined for opponents
  timestamp: number;
}

export interface CadenaRoomState {
  currentNumber: number; // 1..10
  turnDirection: 1 | -1; // 1 = normal/clockwise, -1 = reversed/counter-clockwise
  drawPileCount: number;
  discardPileCount: number;
  topCard: Card | null;
  turnSubPhase: CadenaTurnSubPhase;
  // When activePlayer draws 1 card and it is playable:
  drawnCardId: string | null;
  // When activePlayer plays K (or reflects K) and is picking a rival's face-down card:
  stealTargetPlayerId: string | null;
  stealShuffleSeed?: string | null;
  // When activePlayer just stole a card with K:
  stolenCardId: string | null;
  stolenCard?: Card | null; // Only populated for the thief!
  // Bomb state:
  bombHolderPlayerId: string | null;
  bombHolderPlayerName: string | null;
  bombTurnsRemaining: number; // 3, 2, 1, or 0 when inactive
  // Isolated Cadena Revolver special-card minigame state (never mutates Clásico/Diablo personal revolvers):
  revolverState?: CadenaRevolverState | null;
  // ¡ÚLTIMA! declaration / catch window:
  ultimaWindow: CadenaUltimaWindow | null;
  // Latest visual event for table animations (Bomb flight, Mirror flash, K steal, etc.)
  lastEvent: CadenaVisualEvent | null;
  // Latest authoritative draw event for physical deck-to-player draw & reshuffle animations
  lastDrawEvent?: CadenaDrawEventData | null;
}

export interface CantinaConfig {
  mode: CantinaGameMode;
  mapId: CantinaMapId;
}

export interface MapDefinition {
  id: CantinaMapId;
  name: string;
  description: string;
  thumbnail: string;
  povImages: string[];
  backCard: string;
}

export interface CantinaRoomState {
  code: string;
  gameType: 'la_cantina_del_farol';
  hostId: string;
  phase: CantinaPhase;
  config: CantinaConfig;
  currentRound: number;
  tableRank: TableRank; // Current round required rank in Clásico/Diablo (J, Q, K)
  roundStartEventId?: string;
  roundStartingPlayerId?: string | null;
  roundStartingPlayerName?: string | null;
  activePlayerIndex: number;
  activePlayerId: string | null;
  mandatoryChallenge?: boolean;
  players: CantinaPlayer[];
  centerPileCount: number;
  centerPileHistory: CenterPileItem[];
  lastPlay: PlayedTurn | null;
  challengeResult: ChallengeResult | null;
  rouletteResult: RouletteResult | null;
  cadenaState?: CadenaRoomState | null;
  winnerPlayerId: string | null;
  winnerName: string | null;
  rematchReadyPlayerIds?: string[];
  abortReason?: string;
  notification?: {
    type: 'info' | 'warning' | 'danger' | 'success';
    text: string;
  };
}

export type HandInteractionType =
  | 'HAND_IDLE'
  | 'HAND_HOVER'
  | 'CARD_HOVER'
  | 'CARD_SELECTED';

export interface RouletteSpinEventData {
  rouletteEventId: string;
  playerId: string;
  velocity: number;
  angle: number;
  spinId: string;
  settled?: boolean;
}

export interface DealCardsEventData {
  round: number;
  roundStartEventId: string;
  startingPlayerId: string;
  startingPlayerName: string;
  tableRank: TableRank;
  cardsPerPlayer?: number;
}

// Client to Server Messages
export type CantinaClientMessage =
  | { type: 'JOIN_ROOM'; code: string; player: { id: string; name: string; avatar: string; color: string } }
  | { type: 'UPDATE_CONFIG'; config: Partial<CantinaConfig> }
  | { type: 'START_GAME' }
  | { type: 'PLAY_CARDS'; cardIds: string[]; playId?: string }
  | { type: 'CHALLENGE_BLUFF' }
  | { type: 'PULL_TRIGGER'; rouletteEventId: string }
  | { type: 'ROULETTE_SPIN'; rouletteEventId: string; velocity: number; angle: number; spinId: string; settled?: boolean }
  | { type: 'TRIGGER_ROULETTE' }
  | { type: 'NEXT_ROUND' }
  | { type: 'REQUEST_REMATCH' }
  | { type: 'RESTART_MATCH' }
  | { type: 'RETURN_TO_LOBBY' }
  | { type: 'LEAVE_ROOM' }
  | { type: 'HAND_INTERACTION'; interaction: HandInteractionType; hoveredIndex?: number }
  // Cadena Mode Actions:
  | { type: 'CADENA_PLAY_CHAIN'; cardIds: string[]; playId?: string }
  | { type: 'CADENA_PLAY_SPECIAL'; cardId: string; targetPlayerId?: string; playId?: string }
  | { type: 'CADENA_DRAW_CARD' }
  | { type: 'CADENA_END_TURN' }
  | { type: 'CADENA_STEAL_CARD'; targetPlayerId: string; slotIndex: number }
  | { type: 'CADENA_SELECT_BOMB_TARGET'; targetPlayerId: string }
  | { type: 'CADENA_SELECT_REVOLVER_TARGET'; targetPlayerId: string }
  | { type: 'CADENA_SPIN_REVOLVER'; eventId: string; velocity: number; angle: number; spinId: string; settled?: boolean }
  | { type: 'CADENA_PULL_REVOLVER'; eventId?: string }
  | { type: 'CADENA_DECLARE_ULTIMA' }
  | { type: 'CADENA_CATCH_ULTIMA' };

// Server to Client Messages
export type CantinaServerMessage =
  | { type: 'ROOM_STATE'; state: CantinaRoomState }
  | { type: 'ERROR'; message: string }
  | { type: 'NOTIFICATION'; text: string; variant?: 'info' | 'warning' | 'danger' | 'success' }
  | { type: 'PLAYER_HAND_INTERACTION'; playerId: string; interaction: HandInteractionType; hoveredIndex?: number }
  | { type: 'CARD_PLAYED_EVENT'; playerId: string; playerName: string; cardsCount: number; playId: string; claimedRank: TableRank; cards?: Card[] }
  | { type: 'DEAL_CARDS_EVENT'; round: number; roundStartEventId: string; startingPlayerId: string; startingPlayerName: string; tableRank: TableRank; cardsPerPlayer?: number }
  | { type: 'ROULETTE_SPIN_EVENT'; rouletteEventId: string; playerId: string; velocity: number; angle: number; spinId: string; settled?: boolean };
