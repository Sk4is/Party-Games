/**
 * Centralized Session Recovery Service
 * Provides durable session resilience across refreshes, backgrounding, and short connection losses
 * for all 3 multiplayer games: La Bomba, La Peor Respuesta, and Pinturillo.
 */

export type SupportedGameType = 'la-bomba' | 'la-peor-respuesta' | 'pinturillo';

export interface ActiveSessionData {
  gameType: SupportedGameType;
  roomCode: string;
  playerId: string;
  timestamp: number;
}

const SESSION_STORAGE_KEY = 'fiesta_active_game_session';
const MAX_SESSION_AGE_MS = 2 * 60 * 60 * 1000; // 2 hours

export const sessionRecovery = {
  /**
   * Save the active game session to persistent storage and update URL without page reload.
   */
  saveActiveSession(data: { gameType: SupportedGameType; roomCode: string; playerId: string }): void {
    if (typeof window === 'undefined') return;

    const session: ActiveSessionData = {
      gameType: data.gameType,
      roomCode: data.roomCode.toUpperCase().trim(),
      playerId: data.playerId,
      timestamp: Date.now(),
    };

    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch (e) {
      console.warn('[sessionRecovery] Failed to write session to localStorage:', e);
    }

    // Keep URL in sync (?game=...&room=...)
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('game', session.gameType);
      url.searchParams.set('room', session.roomCode);
      window.history.replaceState({ path: url.toString() }, '', url.toString());
    } catch (e) {
      // Ignore URL update errors in sandboxed environments
    }
  },

  /**
   * Retrieve active session if valid and not expired.
   */
  getActiveSession(): ActiveSessionData | null {
    if (typeof window === 'undefined') return null;

    try {
      // 1. Check URL parameters first for explicit room navigation
      const params = new URLSearchParams(window.location.search);
      const urlGame = params.get('game') as SupportedGameType | null;
      const urlRoom = params.get('room');

      // 2. Read stored session
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const parsed: ActiveSessionData = JSON.parse(stored);
        const age = Date.now() - parsed.timestamp;

        if (age < MAX_SESSION_AGE_MS) {
          // If URL specifies a different room, prefer URL room if game matches
          if (urlRoom && urlGame && (urlGame !== parsed.gameType || urlRoom !== parsed.roomCode)) {
            return {
              gameType: urlGame,
              roomCode: urlRoom.toUpperCase().trim(),
              playerId: parsed.playerId,
              timestamp: Date.now(),
            };
          }
          return parsed;
        }
      }

      // 3. Fallback to URL parameters if valid
      if (urlRoom && urlGame && ['la-bomba', 'la-peor-respuesta', 'pinturillo'].includes(urlGame)) {
        const playerId = localStorage.getItem('fiesta_playerId') || localStorage.getItem('pinturillo_playerId') || '';
        return {
          gameType: urlGame,
          roomCode: urlRoom.toUpperCase().trim(),
          playerId,
          timestamp: Date.now(),
        };
      }
    } catch (e) {
      console.warn('[sessionRecovery] Error reading active session:', e);
    }

    return null;
  },

  /**
   * Clear active session upon explicit user departure or room cancellation.
   */
  clearActiveSession(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (e) {
      // Ignore
    }

    // Clean URL parameters
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('game');
      url.searchParams.delete('room');
      window.history.replaceState({ path: url.pathname }, '', url.pathname);
    } catch (e) {
      // Ignore
    }
  },
};
