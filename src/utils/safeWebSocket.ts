/**
 * Shared Safe WebSocket Lifecycle & Connection Utilities for FAM2PLAY
 *
 * Enforces:
 * - Explicit lifecycle states: IDLE, CONNECTING, OPEN, RECONNECTING, CLOSING, CLOSED
 * - Single-settlement Promise guard (resolveOnce / rejectOnce) across onopen, onerror, onclose, timeout, abort
 * - Safe pre-open close handling without throwing inside event callbacks or producing unhandled rejections
 * - Strict send() guard (only when socket && socket.readyState === WebSocket.OPEN)
 * - Bounded exponential backoff with jitter
 */

export type ExplicitSocketLifecycleState =
  | 'IDLE'
  | 'CONNECTING'
  | 'OPEN'
  | 'RECONNECTING'
  | 'CLOSING'
  | 'CLOSED';

export interface ConnectWebSocketOptions {
  url: string;
  protocols?: string | string[];
  timeoutMs?: number;
  signal?: AbortSignal;
  onMessage?: (event: MessageEvent, socket: WebSocket) => void;
  onPostOpenClose?: (event: CloseEvent, socket: WebSocket) => void;
  onPostOpenError?: (event: Event, socket: WebSocket) => void;
  onStateChange?: (state: ExplicitSocketLifecycleState) => void;
}

export class RecoverableWebSocketError extends Error {
  public readonly code?: number;
  public readonly reason?: string;
  public readonly isPreOpenFailure: boolean;

  constructor(
    message: string,
    options?: { code?: number; reason?: string; isPreOpenFailure?: boolean }
  ) {
    super(message);
    this.name = 'RecoverableWebSocketError';
    this.code = options?.code;
    this.reason = options?.reason;
    this.isPreOpenFailure = options?.isPreOpenFailure ?? true;
  }
}

/**
 * Safely closes and detaches a WebSocket instance in any readyState without
 * triggering duplicate reconnect callbacks or browser "closed before established" errors.
 */
export function safeCloseWebSocket(
  socket: WebSocket | null | undefined,
  reason = 'Normal closure',
  onStateChange?: (state: ExplicitSocketLifecycleState) => void
): void {
  if (!socket) {
    onStateChange?.('CLOSED');
    return;
  }

  socket.onmessage = null;
  socket.onclose = null;

  try {
    if (socket.readyState === WebSocket.OPEN) {
      onStateChange?.('CLOSING');
      socket.onopen = null;
      socket.onerror = null;
      socket.close(1000, reason);
      onStateChange?.('CLOSED');
    } else if (socket.readyState === WebSocket.CONNECTING) {
      onStateChange?.('CLOSING');
      // Avoid browser warning/error for closing a socket while still in CONNECTING handshake:
      // swallow any pre-open error and immediately close once handshake finishes.
      socket.onerror = () => {};
      socket.onopen = () => {
        try {
          socket.close(1000, reason);
        } catch {
          // Ignore close errors
        } finally {
          onStateChange?.('CLOSED');
        }
      };
    } else {
      socket.onopen = null;
      socket.onerror = null;
      onStateChange?.('CLOSED');
    }
  } catch {
    onStateChange?.('CLOSED');
  }
}

/**
 * Strictly sends a JSON or string payload only when `socket && socket.readyState === WebSocket.OPEN`.
 * Returns true if transmitted, false otherwise. Never throws.
 */
export function safeSendWebSocket(
  socket: WebSocket | null | undefined,
  payload: string | Record<string, unknown>
): boolean {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    return false;
  }
  try {
    const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload);
    socket.send(serialized);
    return true;
  } catch {
    return false;
  }
}

/**
 * Connects a WebSocket and returns a Promise that resolves with the open WebSocket
 * or rejects once with a RecoverableWebSocketError if any pre-open termination occurs
 * (onerror, onclose before open, timeout, or abort).
 */
export function connectWebSocketSafely(
  options: ConnectWebSocketOptions
): Promise<WebSocket> {
  const {
    url,
    protocols,
    timeoutMs = 12000,
    signal,
    onMessage,
    onPostOpenClose,
    onPostOpenError,
    onStateChange,
  } = options;

  return new Promise<WebSocket>((resolve, reject) => {
    let settled = false;
    let opened = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let socket: WebSocket | null = null;

    const clearConnectTimeout = () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const cleanupAbortListener = () => {
      if (signal) {
        signal.removeEventListener('abort', handleAbort);
      }
    };

    function resolveOnce(ws: WebSocket) {
      if (settled) return;
      settled = true;
      clearConnectTimeout();
      cleanupAbortListener();
      resolve(ws);
    }

    function rejectOnce(err: Error) {
      if (settled) return;
      settled = true;
      clearConnectTimeout();
      cleanupAbortListener();
      reject(err);
    }

    function handleAbort() {
      if (settled) return;
      safeCloseWebSocket(socket, 'Connection aborted', onStateChange);
      rejectOnce(
        new RecoverableWebSocketError('WebSocket connection aborted before opening.', {
          isPreOpenFailure: true,
        })
      );
    }

    if (signal?.aborted) {
      handleAbort();
      return;
    }

    if (signal) {
      signal.addEventListener('abort', handleAbort, { once: true });
    }

    try {
      onStateChange?.('CONNECTING');
      socket = protocols ? new WebSocket(url, protocols) : new WebSocket(url);
    } catch (err: unknown) {
      onStateChange?.('CLOSED');
      const message =
        err instanceof Error ? err.message : 'Failed to instantiate WebSocket.';
      rejectOnce(new RecoverableWebSocketError(message, { isPreOpenFailure: true }));
      return;
    }

    if (timeoutMs > 0) {
      timeoutId = setTimeout(() => {
        if (!opened && !settled) {
          safeCloseWebSocket(socket, 'Connection timeout', onStateChange);
          rejectOnce(
            new RecoverableWebSocketError(
              `WebSocket connection timed out after ${timeoutMs}ms.`,
              { isPreOpenFailure: true }
            )
          );
        }
      }, timeoutMs);
    }

    socket.onopen = () => {
      if (!socket) return;
      if (signal?.aborted) {
        safeCloseWebSocket(socket, 'Connection aborted on open', onStateChange);
        rejectOnce(
          new RecoverableWebSocketError('WebSocket connection aborted.', {
            isPreOpenFailure: true,
          })
        );
        return;
      }
      opened = true;
      onStateChange?.('OPEN');
      resolveOnce(socket);
    };

    socket.onmessage = (event: MessageEvent) => {
      if (!socket || socket.readyState !== WebSocket.OPEN) return;
      onMessage?.(event, socket);
    };

    socket.onerror = (event: Event) => {
      if (!socket) return;
      if (!opened) {
        // Do not throw from event callback; wait briefly or settle cleanly if already closed
        if (socket.readyState === WebSocket.CLOSED || socket.readyState === WebSocket.CLOSING) {
          onStateChange?.('CLOSED');
          rejectOnce(
            new RecoverableWebSocketError('WebSocket error before reaching OPEN.', {
              isPreOpenFailure: true,
            })
          );
        }
        return;
      }
      onPostOpenError?.(event, socket);
    };

    socket.onclose = (event: CloseEvent) => {
      const currentSocket = socket;
      onStateChange?.('CLOSED');
      if (!opened) {
        rejectOnce(
          new RecoverableWebSocketError(
            'WebSocket closed before reaching OPEN.',
            {
              code: event.code,
              reason: event.reason,
              isPreOpenFailure: true,
            }
          )
        );
        return;
      }
      if (currentSocket) {
        onPostOpenClose?.(event, currentSocket);
      }
    };
  });
}

/**
 * Computes a bounded exponential backoff delay (in ms) with small jitter.
 */
export function getBoundedBackoffDelay(
  attempt: number,
  options?: { baseDelayMs?: number; factor?: number; maxDelayMs?: number; jitterMs?: number }
): number {
  const baseDelayMs = options?.baseDelayMs ?? 800;
  const factor = options?.factor ?? 1.55;
  const maxDelayMs = options?.maxDelayMs ?? 6000;
  const jitterMs = options?.jitterMs ?? 200;

  const safeAttempt = Math.max(0, Math.min(20, Math.floor(attempt || 0)));
  const exponential = baseDelayMs * Math.pow(factor, safeAttempt);
  const jitter = Math.floor(Math.random() * jitterMs);
  return Math.min(maxDelayMs, Math.round(exponential + jitter));
}
