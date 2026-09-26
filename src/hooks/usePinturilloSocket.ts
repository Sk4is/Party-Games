import { useState, useEffect, useRef, useCallback } from 'react';
import {
  PinturilloRoomState,
  PinturilloConfig,
  DrawStroke,
  NormalizedPoint,
  ServerMessage,
  ClientMessage,
} from '../types/pinturillo';
import {
  createOnlineRoom,
  validateJoinOnlineRoom,
  PlayerProfile,
} from '../services/multiplayerRoomService';
import { sessionRecovery } from '../services/sessionRecovery';
import { audio } from '../utils/audio';

export type PinturilloConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'error';

interface UsePinturilloSocketOptions {
  player: { id: string; name: string; avatar: string; color: string };
  initialRoomCode?: string;
  onWrongGame?: (actualGameType: 'la-bomba' | 'la-peor-respuesta', roomCode: string) => void;
}

function getInitialActiveRoom(initialRoomCode?: string): { code: string } | null {
  if (initialRoomCode && initialRoomCode.trim().length >= 4) {
    return { code: initialRoomCode.trim().toUpperCase() };
  }
  const saved = sessionRecovery.getActiveSession();
  if (saved && saved.gameType === 'pinturillo' && saved.roomCode) {
    return { code: saved.roomCode.trim().toUpperCase() };
  }
  return null;
}

export function usePinturilloSocket({
  player,
  initialRoomCode,
  onWrongGame,
}: UsePinturilloSocketOptions) {
  const [connectionStatus, setConnectionStatus] = useState<PinturilloConnectionStatus>('idle');
  const [roomState, setRoomState] = useState<PinturilloRoomState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdownInfo, setCountdownInfo] = useState<{ count: number; text: string } | null>(null);
  const [nearMissAlert, setNearMissAlert] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // References to keep socket lifecycle completely decoupled from React render cycles
  const wsRef = useRef<WebSocket | null>(null);
  const messageQueueRef = useRef<ClientMessage[]>([]);
  const reconnectAttemptsRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownDismissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isManuallyClosedRef = useRef<boolean>(false);
  const lastActivityRef = useRef<number>(Date.now());
  const lastActiveRoomRef = useRef<{ code: string } | null>(getInitialActiveRoom(initialRoomCode));

  const playerRef = useRef(player);
  playerRef.current = player;

  const onWrongGameRef = useRef(onWrongGame);
  onWrongGameRef.current = onWrongGame;

  const clearReconnectTimer = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const clearPingTimer = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  // Safely detach and close a socket without triggering its onclose reconnect logic
  const closeAndDetachSocket = useCallback((reason: string) => {
    const sock = wsRef.current;
    if (!sock) return;
    wsRef.current = null;
    sock.onopen = null;
    sock.onmessage = null;
    sock.onerror = null;
    sock.onclose = null;

    try {
      if (sock.readyState === WebSocket.OPEN || sock.readyState === WebSocket.CONNECTING) {
        sock.close(1000, reason);
      }
    } catch {
      // Ignore close errors
    }
  }, []);

  // Resolve sanitized WebSocket URL
  const getSanitizedSocketUrl = useCallback((): string => {
    const envUrl =
      (import.meta as any).env?.VITE_WS_URL ||
      (import.meta as any).env?.VITE_PINTURILLO_WS_URL;
    if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
      return envUrl.trim();
    }
    if (typeof window === 'undefined') {
      return 'ws://localhost:3000/ws/pinturillo';
    }
    const isHttps = window.location.protocol === 'https:';
    const protocol = isHttps ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws/pinturillo`;
  }, []);

  // Primary WebSocket Connect function — strictly idempotent for OPEN / CONNECTING sockets
  const connect = useCallback(() => {
    const existing = wsRef.current;
    if (
      existing &&
      (existing.readyState === WebSocket.OPEN ||
        existing.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    // If a stale socket is in CLOSING/CLOSED state, detach its handlers before creating a new one
    if (existing) {
      existing.onopen = null;
      existing.onmessage = null;
      existing.onerror = null;
      existing.onclose = null;
      wsRef.current = null;
    }

    clearReconnectTimer();

    const wsUrl = getSanitizedSocketUrl();
    const isInitial = reconnectAttemptsRef.current === 0;
    setConnectionStatus(isInitial ? 'connecting' : 'reconnecting');
    isManuallyClosedRef.current = false;
    lastActivityRef.current = Date.now();

    console.log(
      isInitial
        ? `[Pinturillo Client] Connecting to: ${wsUrl}`
        : `[Pinturillo Client] Reconnecting (attempt ${reconnectAttemptsRef.current}) to: ${wsUrl}`
    );

    try {
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        if (wsRef.current !== socket) return;

        lastActivityRef.current = Date.now();
        clearReconnectTimer();
        reconnectAttemptsRef.current = 0;

        console.log('[Pinturillo Client] Connected', {
          url: wsUrl,
          readyState: socket.readyState,
        });
        setConnectionStatus('connected');
        setErrorMessage(null);

        // Auto-rejoin active room if a room code is set and not already queued in messageQueue
        const activeSession = sessionRecovery.getActiveSession();
        const roomToJoin =
          lastActiveRoomRef.current?.code ||
          (activeSession && activeSession.gameType === 'pinturillo'
            ? activeSession.roomCode
            : null);

        const hasQueuedJoinOrCreate = messageQueueRef.current.some(
          (m) => m.type === 'join_room' || m.type === 'create_room'
        );

        if (roomToJoin && !hasQueuedJoinOrCreate) {
          lastActiveRoomRef.current = { code: roomToJoin };
          socket.send(
            JSON.stringify({
              type: 'join_room',
              code: roomToJoin,
              player: playerRef.current,
            })
          );
        }

        // Flush any queued client messages
        while (messageQueueRef.current.length > 0) {
          const queued = messageQueueRef.current.shift();
          if (queued && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(queued));
          }
        }

        // Heartbeat ping interval (every 15s to keep Render / proxy connections warm)
        clearPingTimer();
        pingIntervalRef.current = setInterval(() => {
          if (wsRef.current === socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'ping' }));
          }
        }, 15000);
      };

      socket.onmessage = (event: MessageEvent) => {
        if (wsRef.current !== socket) return;
        lastActivityRef.current = Date.now();

        try {
          const msg: ServerMessage = JSON.parse(event.data);

          switch (msg.type) {
            case 'room_state': {
              setIsSubmitting(false);
              lastActiveRoomRef.current = { code: msg.state.code };
              sessionRecovery.saveActiveSession({
                gameType: 'pinturillo',
                roomCode: msg.state.code,
                playerId: playerRef.current.id,
              });

              setRoomState(msg.state);

              if (msg.state.phase === 'DRAWING') {
                if (countdownDismissTimeoutRef.current)
                  clearTimeout(countdownDismissTimeoutRef.current);
                countdownDismissTimeoutRef.current = setTimeout(() => {
                  setCountdownInfo(null);
                }, 400);
              } else if (msg.state.phase !== 'COUNTDOWN') {
                if (countdownDismissTimeoutRef.current)
                  clearTimeout(countdownDismissTimeoutRef.current);
                setCountdownInfo(null);
              }
              break;
            }

            case 'error': {
              setIsSubmitting(false);
              setErrorMessage(msg.message);
              if (
                msg.message.toLowerCase().includes('no se ha encontrado') ||
                msg.message.toLowerCase().includes('ha finalizado') ||
                msg.message.toLowerCase().includes('completa')
              ) {
                sessionRecovery.clearActiveSession();
                lastActiveRoomRef.current = null;
              }
              break;
            }

            case 'countdown_tick': {
              if (msg.count < 0) {
                if (countdownDismissTimeoutRef.current)
                  clearTimeout(countdownDismissTimeoutRef.current);
                setCountdownInfo(null);
              } else if (msg.count === 0) {
                audio.playPinturilloCountdown(0);
                setCountdownInfo({ count: 0, text: msg.text || '¡A DIBUJAR!' });
                if (countdownDismissTimeoutRef.current)
                  clearTimeout(countdownDismissTimeoutRef.current);
                countdownDismissTimeoutRef.current = setTimeout(() => {
                  setCountdownInfo(null);
                }, 500);
              } else {
                audio.playPinturilloCountdown(msg.count);
                setCountdownInfo({ count: msg.count, text: msg.text || String(msg.count) });
              }
              break;
            }

            case 'tick': {
              setRoomState((prev) => {
                if (!prev) return null;
                if (msg.roundId && prev.roundId && msg.roundId !== prev.roundId) return prev;
                return {
                  ...prev,
                  remainingTime: msg.remainingTime,
                  roundEndsAt: msg.roundEndsAt || prev.roundEndsAt,
                };
              });
              if (msg.remainingTime <= 10 && msg.remainingTime > 0) {
                audio.playPinturilloClockTick(msg.remainingTime <= 5);
              }
              break;
            }

            case 'stroke_start': {
              setRoomState((prev) => {
                if (!prev) return null;
                if (msg.roundId && prev.roundId && msg.roundId !== prev.roundId) return prev;
                if (prev.drawingStrokes.some((s) => s.id === msg.stroke.id)) return prev;
                return {
                  ...prev,
                  drawingStrokes: [...prev.drawingStrokes, msg.stroke],
                };
              });
              break;
            }

            case 'stroke_chunk': {
              setRoomState((prev) => {
                if (!prev) return null;
                if (msg.roundId && prev.roundId && msg.roundId !== prev.roundId) return prev;
                const strokes = [...prev.drawingStrokes];
                const target = strokes.find((s) => s.id === msg.strokeId);
                if (target) {
                  target.points = [...target.points, ...msg.points];
                }
                return { ...prev, drawingStrokes: strokes };
              });
              break;
            }

            case 'flood_fill': {
              setRoomState((prev) => {
                if (!prev) return null;
                if (msg.roundId && prev.roundId && msg.roundId !== prev.roundId) return prev;
                if (prev.drawingStrokes.some((s) => s.id === msg.stroke.id)) return prev;
                return {
                  ...prev,
                  drawingStrokes: [...prev.drawingStrokes, msg.stroke],
                };
              });
              break;
            }

            case 'undo': {
              setRoomState((prev) => {
                if (!prev) return null;
                const strokes = [...prev.drawingStrokes];
                strokes.pop();
                return { ...prev, drawingStrokes: strokes };
              });
              break;
            }

            case 'redo':
              break;

            case 'clear_canvas': {
              setRoomState((prev) => {
                if (!prev) return null;
                return { ...prev, drawingStrokes: [] };
              });
              break;
            }

            case 'chat_message': {
              setRoomState((prev) => {
                if (!prev) return null;
                return {
                  ...prev,
                  chatMessages: [...prev.chatMessages, msg.message],
                };
              });
              break;
            }

            case 'correct_guess': {
              audio.playPinturilloCorrect();
              break;
            }

            case 'near_miss': {
              audio.playPinturilloNearMiss();
              setNearMissAlert(true);
              setTimeout(() => setNearMissAlert(false), 3500);
              break;
            }

            case 'notification': {
              setRoomState((prev) => {
                if (!prev) return null;
                return {
                  ...prev,
                  chatMessages: [
                    ...prev.chatMessages,
                    {
                      id: `sys-notif-${Date.now()}`,
                      playerName: 'Sistema',
                      text: msg.message,
                      isSystem: true,
                      timestamp: Date.now(),
                    },
                  ],
                };
              });
              break;
            }

            case 'pong':
              break;
          }
        } catch (err) {
          console.error('[Pinturillo Client] Error parsing server message:', err);
        }
      };

      socket.onerror = (event: Event) => {
        if (wsRef.current !== socket) return;
        console.error('[Pinturillo Client] WebSocket error', {
          type: event.type,
          readyState: socket.readyState,
          url: wsUrl,
        });
      };

      socket.onclose = (event: CloseEvent) => {
        if (wsRef.current !== socket) return;
        wsRef.current = null;
        clearPingTimer();

        console.log('[Pinturillo Client] WebSocket closed', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          readyState: socket.readyState,
          url: wsUrl,
        });

        // If manually closed (e.g. user clicked Exit / Volver), or no active room, do not reconnect
        if (isManuallyClosedRef.current || !lastActiveRoomRef.current?.code) {
          setConnectionStatus('disconnected');
          return;
        }

        // Automatic controlled exponential backoff reconnection
        const maxAttempts = 6;
        if (reconnectAttemptsRef.current < maxAttempts) {
          reconnectAttemptsRef.current += 1;
          const delay = Math.min(
            5000,
            1000 * Math.pow(1.5, reconnectAttemptsRef.current - 1)
          );
          setConnectionStatus('reconnecting');
          console.log(
            `[Pinturillo Client] Scheduling reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxAttempts})`
          );

          clearReconnectTimer();
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectTimeoutRef.current = null;
            if (!isManuallyClosedRef.current && lastActiveRoomRef.current?.code) {
              connect();
            }
          }, delay);
        } else {
          console.warn('[Pinturillo Client] Max reconnection attempts reached');
          setConnectionStatus('error');
          setErrorMessage(
            'No hemos podido conectar con la partida. Comprueba tu conexión e inténtalo de nuevo.'
          );
        }
      };
    } catch (e: any) {
      console.error('[Pinturillo Client] Failed to create WebSocket connection:', e);
      setConnectionStatus('error');
      setErrorMessage('Error al inicializar la conexión con el servidor.');
    }
  }, [clearPingTimer, clearReconnectTimer, getSanitizedSocketUrl]);

  // Lifecycle & Non-Destructive Foreground Recovery
  // NEVER closes an OPEN or CONNECTING socket on focus, blur, or visibilitychange
  useEffect(() => {
    isManuallyClosedRef.current = false;

    const initialRoom = getInitialActiveRoom(initialRoomCode);
    if (initialRoom) {
      lastActiveRoomRef.current = initialRoom;
      connect();
    }

    const handleNonDestructiveWakeup = () => {
      // Do nothing if the user intentionally left or hasn't joined/created a room yet
      if (isManuallyClosedRef.current || !lastActiveRoomRef.current?.code) {
        return;
      }

      const ws = wsRef.current;

      // If socket is currently OPEN, keep it open and send a lightweight heartbeat ping
      if (ws && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({ type: 'ping' }));
        } catch {
          // If send fails synchronously, onclose will handle reconnection
        }
        return;
      }

      // If socket is currently CONNECTING, let the handshake complete untouched
      if (ws && ws.readyState === WebSocket.CONNECTING) {
        return;
      }

      // Only if socket is missing or CLOSED, trigger a clean reconnection for the active room
      if (!ws || ws.readyState === WebSocket.CLOSED) {
        reconnectAttemptsRef.current = 0;
        connect();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleNonDestructiveWakeup();
      }
    };

    const handleOnline = () => {
      handleNonDestructiveWakeup();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      isManuallyClosedRef.current = true;
      clearPingTimer();
      clearReconnectTimer();
      if (countdownDismissTimeoutRef.current) {
        clearTimeout(countdownDismissTimeoutRef.current);
        countdownDismissTimeoutRef.current = null;
      }
      closeAndDetachSocket('Component unmounted');
    };
  }, [connect, initialRoomCode, clearPingTimer, clearReconnectTimer, closeAndDetachSocket]);

  // Send message helper with automatic queueing
  const send = useCallback(
    (message: ClientMessage) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(message));
      } else {
        messageQueueRef.current.push(message);
        if (
          !wsRef.current ||
          wsRef.current.readyState === WebSocket.CLOSED ||
          wsRef.current.readyState === WebSocket.CLOSING
        ) {
          connect();
        }
      }
    },
    [connect]
  );

  // Manual retry handler (only used when user explicitly clicks REINTENTAR button)
  const retryConnection = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    setErrorMessage(null);
    isManuallyClosedRef.current = false;
    closeAndDetachSocket('Manual retry');
    connect();
  }, [closeAndDetachSocket, connect]);

  // Create room with REST pre-registration and WebSocket join
  const createRoom = useCallback(
    async (
      creatorPlayer: { id: string; name: string; avatar: string; color: string },
      config?: Partial<PinturilloConfig>
    ) => {
      setErrorMessage(null);
      setIsSubmitting(true);
      isManuallyClosedRef.current = false;
      playerRef.current = creatorPlayer;

      try {
        const room = await createOnlineRoom('pinturillo', creatorPlayer as PlayerProfile, config);
        lastActiveRoomRef.current = { code: room.roomCode };
        send({
          type: 'join_room',
          code: room.roomCode,
          player: creatorPlayer,
        });
      } catch (err: any) {
        console.warn('[Pinturillo Client] REST create failed, attempting direct WS create:', err);
        send({
          type: 'create_room',
          player: creatorPlayer,
        });
        if (config) {
          send({
            type: 'update_config',
            config,
          });
        }
      }
    },
    [send]
  );

  // Join room with REST pre-validation and WebSocket join
  const joinRoom = useCallback(
    async (
      code: string,
      joiningPlayer: { id: string; name: string; avatar: string; color: string }
    ) => {
      const cleanCode = code.trim().toUpperCase();
      if (!cleanCode) {
        setErrorMessage('Introduce un código de sala');
        return;
      }

      setErrorMessage(null);
      setIsSubmitting(true);
      isManuallyClosedRef.current = false;
      playerRef.current = joiningPlayer;

      try {
        const validation = await validateJoinOnlineRoom(
          cleanCode,
          'pinturillo',
          joiningPlayer as PlayerProfile
        );

        if (!validation.valid) {
          setIsSubmitting(false);
          if (validation.wrongGame && validation.actualGameType && onWrongGameRef.current) {
            onWrongGameRef.current(
              validation.actualGameType as 'la-bomba' | 'la-peor-respuesta',
              cleanCode
            );
            return;
          }
          setErrorMessage(validation.message || 'No se ha podido unir a la sala');
          return;
        }

        lastActiveRoomRef.current = { code: cleanCode };
        send({
          type: 'join_room',
          code: cleanCode,
          player: joiningPlayer,
        });
      } catch (err: any) {
        console.warn('[Pinturillo Client] REST validate-join failed, attempting direct WS join:', err);
        lastActiveRoomRef.current = { code: cleanCode };
        send({
          type: 'join_room',
          code: cleanCode,
          player: joiningPlayer,
        });
      }
    },
    [send]
  );

  // Explicit leave room
  const leaveRoom = useCallback(() => {
    isManuallyClosedRef.current = true;
    sessionRecovery.clearActiveSession();
    lastActiveRoomRef.current = null;
    messageQueueRef.current = [];
    clearPingTimer();
    clearReconnectTimer();

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ type: 'leave_room' }));
      } catch {
        // Ignore send error on leave
      }
    }

    closeAndDetachSocket('User left room');
    setRoomState(null);
    setCountdownInfo(null);
    setErrorMessage(null);
    setConnectionStatus('idle');
  }, [clearPingTimer, clearReconnectTimer, closeAndDetachSocket]);

  return {
    connectionStatus,
    roomState,
    setRoomState,
    errorMessage,
    countdownInfo,
    setCountdownInfo,
    nearMissAlert,
    isSubmitting,
    createRoom,
    joinRoom,
    leaveRoom,
    retryConnection,
    clearError: () => setErrorMessage(null),
    updateConfig: (config: Partial<PinturilloConfig>) => send({ type: 'update_config', config }),
    startGame: () => send({ type: 'start_game' }),
    chooseWord: (word: string) => send({ type: 'choose_word', word }),
    sendStrokeStart: (stroke: DrawStroke) => send({ type: 'stroke_start', stroke }),
    sendStrokeChunk: (strokeId: string, points: NormalizedPoint[]) =>
      send({ type: 'stroke_chunk', strokeId, points }),
    sendStrokeEnd: (strokeId: string) => send({ type: 'stroke_end', strokeId }),
    sendFloodFill: (point: NormalizedPoint, color: string) =>
      send({ type: 'flood_fill', point, color }),
    sendUndo: () => send({ type: 'undo' }),
    sendRedo: () => send({ type: 'redo' }),
    sendClearCanvas: () => send({ type: 'clear_canvas' }),
    sendChat: (text: string) => send({ type: 'send_chat', text }),
    restartGame: () => send({ type: 'restart_game' }),
  };
}
