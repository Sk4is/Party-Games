export type CantinaGameMode = 'CLASICO' | 'DIABLO';

export type CantinaMapId = 'mapa1' | 'mapa2' | 'mapa3';

// Only J, Q, K are table ranks (NO 'A'!)
export type TableRank = 'J' | 'Q' | 'K';

// Cards can be J, Q, K, JOKER, or DIABLO
export type CardRank = 'J' | 'Q' | 'K' | 'JOKER' | 'DIABLO';

export interface Card {
  id: string;
  rank: CardRank;
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
  bulletChamber: number; // 0 to 5 (secret on server, revealed upon death)
  isEliminated: boolean;
  eliminatedRound?: number;
}

export interface PlayedTurn {
  playerId: string;
  playerName: string;
  cardsCount: number;
  claimedRank: TableRank;
  cards?: Card[]; // Only revealed during REVELACION
  timestamp: number;
  playId: string;
}

export interface CenterPileItem {
  playId: string;
  playerId: string;
  playerName: string;
  cardsCount: number;
  claimedRank: TableRank;
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
  shotResolved: boolean;
  fired: boolean;
  isFatal: boolean;
  survived: boolean;
  isDevilSequence: boolean;
  queuePlayerIds?: string[];
  shots: SingleShotResult[];
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
  tableRank: TableRank; // Current round required rank (J, Q, K)
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
}

export interface DealCardsEventData {
  round: number;
  roundStartEventId: string;
  startingPlayerId: string;
  startingPlayerName: string;
  tableRank: TableRank;
}

// Client to Server Messages
export type CantinaClientMessage =
  | { type: 'JOIN_ROOM'; code: string; player: { id: string; name: string; avatar: string; color: string } }
  | { type: 'UPDATE_CONFIG'; config: Partial<CantinaConfig> }
  | { type: 'START_GAME' }
  | { type: 'PLAY_CARDS'; cardIds: string[]; playId?: string }
  | { type: 'CHALLENGE_BLUFF' }
  | { type: 'PULL_TRIGGER'; rouletteEventId: string }
  | { type: 'ROULETTE_SPIN'; rouletteEventId: string; velocity: number; angle: number; spinId: string }
  | { type: 'TRIGGER_ROULETTE' }
  | { type: 'NEXT_ROUND' }
  | { type: 'REQUEST_REMATCH' }
  | { type: 'RESTART_MATCH' }
  | { type: 'RETURN_TO_LOBBY' }
  | { type: 'LEAVE_ROOM' }
  | { type: 'HAND_INTERACTION'; interaction: HandInteractionType; hoveredIndex?: number };

// Server to Client Messages
export type CantinaServerMessage =
  | { type: 'ROOM_STATE'; state: CantinaRoomState }
  | { type: 'ERROR'; message: string }
  | { type: 'NOTIFICATION'; text: string; variant?: 'info' | 'warning' | 'danger' | 'success' }
  | { type: 'PLAYER_HAND_INTERACTION'; playerId: string; interaction: HandInteractionType; hoveredIndex?: number }
  | { type: 'CARD_PLAYED_EVENT'; playerId: string; playerName: string; cardsCount: number; playId: string; claimedRank: TableRank }
  | { type: 'DEAL_CARDS_EVENT'; round: number; roundStartEventId: string; startingPlayerId: string; startingPlayerName: string; tableRank: TableRank }
  | { type: 'ROULETTE_SPIN_EVENT'; rouletteEventId: string; playerId: string; velocity: number; angle: number; spinId: string };
