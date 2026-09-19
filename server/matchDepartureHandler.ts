/**
 * Centralized Match Departure & Disconnection Service
 * Source of truth for minimum player counts, host migration, reconnection grace periods,
 * and automatic match cancellation across all 3 games:
 * - La Bomba (min: 2)
 * - La Peor Respuesta (min: 3)
 * - Pinturillo (min: 2)
 */

export type SupportedGameType = 'la-bomba' | 'la-peor-respuesta' | 'pinturillo';

export const GAME_MINIMUM_PLAYERS: Record<SupportedGameType, number> = {
  'la-bomba': 2,
  'la-peor-respuesta': 3,
  'pinturillo': 2,
};

export const RECONNECTION_GRACE_PERIOD_MS = 15000; // 15 seconds grace period (10-15s requirement)

export type AbortReasonCode =
  | 'HOST_LEFT_NOT_ENOUGH_PLAYERS'
  | 'NOT_ENOUGH_PLAYERS'
  | 'ALL_OTHER_PLAYERS_LEFT';

export interface DepartureEvaluation {
  shouldAbort: boolean;
  abortReason?: AbortReasonCode;
  endMessage?: string;
  migratedHost?: {
    id: string;
    name: string;
  };
  remainingActiveConnectedCount: number;
}

export interface MinimalPlayer {
  id: string;
  name: string;
  isConnected: boolean;
  isHost?: boolean;
}

class MatchDepartureHandler {
  // Map of active reconnection grace periods: `${roomId}:${playerId}` -> timeout
  private pendingGracePeriods = new Map<string, {
    timeout: NodeJS.Timeout;
    roomId: string;
    playerId: string;
    gameType: SupportedGameType;
    onExpire: () => void;
  }>();

  public getMinimumPlayers(gameType: SupportedGameType): number {
    return GAME_MINIMUM_PLAYERS[gameType] || 2;
  }

  /**
   * Deterministically finds the earliest joined player who is connected.
   * Since room.players preserves join order, the first connected element is the earliest.
   */
  public findEarliestConnectedPlayer<T extends MinimalPlayer>(
    players: T[],
    excludePlayerId?: string
  ): T | undefined {
    return players.find((p) => p.isConnected && p.id !== excludePlayerId);
  }

  /**
   * Evaluates the outcome of a permanent player departure.
   * Call this when a player explicitly leaves or when their grace period expires.
   */
  public evaluatePermanentDeparture<T extends MinimalPlayer>(params: {
    gameType: SupportedGameType;
    isGameActive: boolean;
    departingPlayerId: string;
    wasHost: boolean;
    players: T[];
  }): DepartureEvaluation {
    const { gameType, isGameActive, departingPlayerId, wasHost, players } = params;
    const minPlayers = this.getMinimumPlayers(gameType);

    // Connected players excluding the departing player
    const remainingConnected = players.filter(
      (p) => p.id !== departingPlayerId && p.isConnected
    );
    const count = remainingConnected.length;

    // Rule 5: Do NOT apply match abort in the lobby
    if (!isGameActive) {
      let migratedHost: { id: string; name: string } | undefined;
      if (wasHost && count > 0) {
        const next = this.findEarliestConnectedPlayer(players, departingPlayerId);
        if (next) {
          migratedHost = { id: next.id, name: next.name };
        }
      }
      return {
        shouldAbort: false,
        migratedHost,
        remainingActiveConnectedCount: count,
      };
    }

    // Active match: Check against minimum players
    if (count < minPlayers) {
      let abortReason: AbortReasonCode;
      let endMessage: string;

      if (wasHost) {
        // CASE A: The HOST left AND the remaining player count is below the minimum
        abortReason = 'HOST_LEFT_NOT_ENOUGH_PLAYERS';
        endMessage = 'El anfitrión ha abandonado la partida y no quedan suficientes jugadores para continuar.';
      } else if (count === 1) {
        // CASE B: 1 player remains in min-2 game (everyone else left)
        abortReason = 'ALL_OTHER_PLAYERS_LEFT';
        endMessage = 'Todos los demás jugadores han abandonado la partida.';
      } else {
        // CASE B: Room falls below minimum (e.g., 2 players remain in a min-3 game)
        abortReason = 'NOT_ENOUGH_PLAYERS';
        endMessage =
          minPlayers === 3
            ? 'No quedan suficientes jugadores para continuar. Se necesitan al menos 3 jugadores.'
            : 'No quedan suficientes jugadores para continuar la partida.';
      }

      return {
        shouldAbort: true,
        abortReason,
        endMessage,
        remainingActiveConnectedCount: count,
      };
    }

    // Enough players remain to continue the match!
    let migratedHost: { id: string; name: string } | undefined;
    if (wasHost) {
      const next = this.findEarliestConnectedPlayer(players, departingPlayerId);
      if (next) {
        migratedHost = { id: next.id, name: next.name };
      }
    }

    return {
      shouldAbort: false,
      migratedHost,
      remainingActiveConnectedCount: count,
    };
  }

  /**
   * Registers a temporary disconnection with a grace period.
   * If the player does not reconnect before RECONNECTION_GRACE_PERIOD_MS,
   * the onPermanentLeave callback is executed.
   */
  public registerDisconnection(
    roomId: string,
    playerId: string,
    gameType: SupportedGameType,
    onPermanentLeave: () => void
  ): void {
    this.cancelGracePeriod(roomId, playerId);

    const key = `${roomId}:${playerId}`;
    const timeout = setTimeout(() => {
      this.pendingGracePeriods.delete(key);
      console.log(`[DepartureHandler] Periodo de gracia expirado para ${playerId} en sala ${roomId}. Tratando como abandono definitivo.`);
      onPermanentLeave();
    }, RECONNECTION_GRACE_PERIOD_MS);

    this.pendingGracePeriods.set(key, {
      timeout,
      roomId,
      playerId,
      gameType,
      onExpire: onPermanentLeave,
    });
  }

  /**
   * Cancels a pending disconnection grace period if player reconnects or explicitly leaves.
   */
  public cancelGracePeriod(roomId: string, playerId: string): boolean {
    const key = `${roomId}:${playerId}`;
    const existing = this.pendingGracePeriods.get(key);
    if (existing) {
      clearTimeout(existing.timeout);
      this.pendingGracePeriods.delete(key);
      return true;
    }
    return false;
  }

  /**
   * Cleans up all pending grace periods for an entire room (e.g. when room is destroyed).
   */
  public clearRoomGracePeriods(roomId: string): void {
    for (const [key, item] of this.pendingGracePeriods.entries()) {
      if (item.roomId === roomId) {
        clearTimeout(item.timeout);
        this.pendingGracePeriods.delete(key);
      }
    }
  }
}

export const matchDepartureHandler = new MatchDepartureHandler();
