export type DrawingTool = 'pencil' | 'marker' | 'brush' | 'eraser' | 'fill';

export interface NormalizedPoint {
  x: number; // 0 to 1
  y: number; // 0 to 1
  pressure?: number;
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
  | 'FINAL_RESULTS';

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
  | { type: 'pong' };
