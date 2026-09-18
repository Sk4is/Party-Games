export type DrawingTool = 'pencil' | 'marker' | 'brush' | 'eraser' | 'fill';

export type PinturilloCategory =
  | 'animales'
  | 'comida'
  | 'objetos'
  | 'lugares'
  | 'cine_tv'
  | 'videojuegos'
  | 'deportes'
  | 'profesiones'
  | 'naturaleza'
  | 'acciones';

export interface CategoryInfo {
  id: PinturilloCategory;
  name: string;
  icon: string;
  description: string;
}

export const PINTURILLO_CATEGORIES_LIST: CategoryInfo[] = [
  { id: 'animales', name: 'Animales', icon: '🐾', description: 'Mascotas, salvajes, aves e insectos' },
  { id: 'comida', name: 'Comida y Bebida', icon: '🍕', description: 'Platos típicos, tapas, postres y bebidas' },
  { id: 'objetos', name: 'Objetos', icon: '🏠', description: 'Herramientas, aparatos y cosas cotidianas' },
  { id: 'lugares', name: 'Lugares', icon: '🌍', description: 'Espacios, edificios y tipos de sitios' },
  { id: 'cine_tv', name: 'Cine y Televisión', icon: '🎬', description: 'Conceptos del cine, géneros y arquetipos' },
  { id: 'videojuegos', name: 'Videojuegos', icon: '🎮', description: 'Consolas, mecánicas y elementos gamer' },
  { id: 'deportes', name: 'Deportes', icon: '⚽', description: 'Disciplinas deportivas, material y acciones' },
  { id: 'profesiones', name: 'Profesiones', icon: '👷', description: 'Oficios, trabajos y uniformes' },
  { id: 'naturaleza', name: 'Naturaleza', icon: '🌳', description: 'Clima, paisajes, fenómenos y plantas' },
  { id: 'acciones', name: 'Acciones y Situaciones', icon: '🎭', description: 'Verbos divertidos y situaciones cotidianas' },
];

export interface NormalizedPoint {
  x: number; // 0 to 1
  y: number; // 0 to 1
  pressure?: number;
  widthFactor?: number; // Organic dynamic brush thickness
}

export interface DrawStroke {
  id: string;
  tool: DrawingTool;
  color: string;
  size: number; // base thickness in px at canonical 800x500 scale
  points: NormalizedPoint[];
  isFill?: boolean;
  fillPoint?: NormalizedPoint;
}

export type PinturilloPhase =
  | 'LOBBY'
  | 'WORD_SELECTION'
  | 'COUNTDOWN'
  | 'DRAWING'
  | 'ROUND_RESULTS'
  | 'FINAL_RESULTS'
  | 'MATCH_ABORTED'
  | 'MATCH_ABORTED_NOT_ENOUGH_PLAYERS';

export interface PinturilloPlayer {
  id: string;
  name: string;
  avatar: string;
  color: string;
  score: number;
  isHost: boolean;
  isConnected: boolean;
  hasGuessed: boolean;
  roundScore: number;
  guessOrder?: number; // 1 = first, 2 = second, etc.
}

export interface PinturilloConfig {
  roundTimeSeconds: number; // 30, 45, 60, 90 (default), 120, 180
  totalVueltas: number; // 1, 2 (default), 3, 5
  hintsEnabled: boolean; // true = CON PISTAS, false = SIN PISTAS
  categories: PinturilloCategory[]; // Selected categories
}

export interface ChatMessage {
  id: string;
  playerId?: string;
  playerName: string;
  playerAvatar?: string;
  playerColor?: string;
  text: string;
  isSystem?: boolean;
  isCorrectGuess?: boolean;
  nearMiss?: boolean;
  pointsEarned?: number;
  timestamp: number;
}

export interface PinturilloRoomState {
  code: string;
  hostId: string;
  phase: PinturilloPhase;
  config: PinturilloConfig;
  players: PinturilloPlayer[];
  currentDrawerId: string | null;
  currentTurn: number; // 1 to totalTurns
  totalTurns: number;
  currentVuelta: number; // 1 to totalVueltas
  secretWord?: string | null; // ONLY populated for the active drawer!
  wordHint: string; // e.g. "_ _ _ _ _ _ _ _ _"
  wordLength: number;
  wordCategory?: string;
  wordOptions?: Array<{ word: string; category: string; difficulty: string }>; // for drawer during WORD_SELECTION
  selectionRemainingSeconds?: number;
  countdownEndsAt?: number;
  roundStartedAt?: number;
  roundEndsAt?: number;
  remainingTime: number;
  totalRoundTime: number;
  drawingStrokes: DrawStroke[];
  chatMessages: ChatMessage[];
  lastRoundResults?: {
    word: string;
    scoresEarned: Array<{
      playerId: string;
      playerName: string;
      playerAvatar: string;
      playerColor: string;
      points: number;
      isDrawer: boolean;
      order?: number;
    }>;
  };
  abortReason?: string;
  endMessage?: string;
}

// WebSocket Event Payloads
export type ClientMessage =
  | { type: 'create_room'; player: { id: string; name: string; avatar: string; color: string } }
  | { type: 'join_room'; code: string; player: { id: string; name: string; avatar: string; color: string } }
  | { type: 'update_config'; config: Partial<PinturilloConfig> }
  | { type: 'start_game' }
  | { type: 'choose_word'; word: string }
  | { type: 'stroke_start'; stroke: DrawStroke }
  | { type: 'stroke_chunk'; strokeId: string; points: NormalizedPoint[] }
  | { type: 'stroke_end'; strokeId: string }
  | { type: 'flood_fill'; point: NormalizedPoint; color: string }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'clear_canvas' }
  | { type: 'send_chat'; text: string }
  | { type: 'leave_room' }
  | { type: 'restart_game' }
  | { type: 'ping' };

export type ServerMessage =
  | { type: 'room_state'; state: PinturilloRoomState }
  | { type: 'error'; message: string }
  | { type: 'stroke_start'; stroke: DrawStroke }
  | { type: 'stroke_chunk'; strokeId: string; points: NormalizedPoint[] }
  | { type: 'stroke_end'; strokeId: string }
  | { type: 'flood_fill'; stroke: DrawStroke }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'clear_canvas' }
  | { type: 'chat_message'; message: ChatMessage }
  | { type: 'tick'; remainingTime: number }
  | { type: 'countdown_tick'; count: number; text?: string }
  | { type: 'correct_guess'; playerId: string; playerName: string; points: number; totalScore: number }
  | { type: 'near_miss'; playerId: string }
  | { type: 'notification'; message: string; noticeType?: 'info' | 'success' | 'warning' }
  | { type: 'pong' };
