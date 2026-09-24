/**
 * Shared Mobile Presence & Reconnection Resilience Manager
 * Solves the mobile backgrounding / screen lock issue across all multiplayer games:
 * - La Bomba
 * - La Peor Respuesta
 * - Pinturillo
 * - Palabra Secreta
 *
 * When mobile browsers suspend (iOS Safari, Android Chrome), TCP sockets enter zombie states
 * where readyState appears OPEN in memory, but packets cannot be transmitted.
 * This manager listens for tab foregrounding, window focus, and network online events,
 * detects stale sockets, and forces immediate reconnection within the server grace period.
 */

export interface ResilienceManagerOptions {
  getSocket: () => WebSocket | null;
  onReconnect: () => void;
  sendPing: () => void;
  getLastActivityTime: () => number;
  logTag?: string;
}

export function createConnectionResilience({
  getSocket,
  onReconnect,
  sendPing,
  getLastActivityTime,
  logTag = '[ConnectionResilience]',
}: ResilienceManagerOptions): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }

  let lastHiddenTimestamp = 0;
  let watchdogTimeout: NodeJS.Timeout | null = null;

  const clearWatchdog = () => {
    if (watchdogTimeout) {
      clearTimeout(watchdogTimeout);
      watchdogTimeout = null;
    }
  };

  const handleForegroundWakeup = () => {
    clearWatchdog();

    const now = Date.now();
    const ws = getSocket();
    const elapsedSinceHidden = lastHiddenTimestamp > 0 ? now - lastHiddenTimestamp : 0;
    const elapsedSinceLastActivity = now - getLastActivityTime();

    console.log(
      `${logTag} Foreground event detected. Elapsed hidden: ${elapsedSinceHidden}ms, last activity: ${elapsedSinceLastActivity}ms, socket readyState: ${ws?.readyState}`
    );

    // 1. If socket is closed or closing, reconnect immediately
    if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
      console.log(`${logTag} Socket is closed/closing. Triggering immediate reconnection.`);
      onReconnect();
      return;
    }

    // 2. If app was suspended/backgrounded for > 3.5 seconds, mobile OS socket is almost always dead.
    // Force immediate reconnection to beat the server grace period (15s) and re-sync state in <200ms.
    if (elapsedSinceHidden > 3500 || elapsedSinceLastActivity > 10000) {
      console.log(`${logTag} Extended background/inactivity detected (>3.5s). Closing stale socket and reconnecting.`);
      try {
        ws.close(1000, 'Background wakeup reset');
      } catch (e) {
        // Ignore
      }
      onReconnect();
      return;
    }

    // 3. Otherwise, if socket appears open, send an immediate heartbeat ping and set a 1500ms watchdog
    if (ws.readyState === WebSocket.OPEN) {
      const pingSentAt = Date.now();
      try {
        sendPing();
      } catch (e) {
        onReconnect();
        return;
      }

      watchdogTimeout = setTimeout(() => {
        const currentLastActivity = getLastActivityTime();
        if (currentLastActivity < pingSentAt) {
          console.warn(`${logTag} Heartbeat watchdog expired without response. Socket is zombie. Reconnecting.`);
          try {
            ws.close(1000, 'Zombie socket detected');
          } catch (e) {
            // Ignore
          }
          onReconnect();
        }
      }, 1500);
    }
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      lastHiddenTimestamp = Date.now();
    } else if (document.visibilityState === 'visible') {
      handleForegroundWakeup();
      lastHiddenTimestamp = 0;
    }
  };

  const handleOnline = () => {
    console.log(`${logTag} Network came online.`);
    handleForegroundWakeup();
  };

  const handlePageShow = (e: PageTransitionEvent) => {
    console.log(`${logTag} pageshow event (persisted: ${e.persisted})`);
    handleForegroundWakeup();
  };

  const handleFocus = () => {
    if (document.visibilityState === 'visible') {
      handleForegroundWakeup();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('online', handleOnline);
  window.addEventListener('pageshow', handlePageShow);
  window.addEventListener('focus', handleFocus);

  return () => {
    clearWatchdog();
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('pageshow', handlePageShow);
    window.removeEventListener('focus', handleFocus);
  };
}
