import { useState, useEffect, useRef, useCallback } from 'react';
import {
  PinturilloRoomState,
  PinturilloPlayer,
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

  // References to keep socket lifecycle decoupled from component render cycles
  const wsRef = useRef<WebSocket | null>(null);
  const messageQueueRef = useRef<ClientMessage[]>([]);
  const reconnectAttemptsRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownDismissTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isManuallyClosedRef = useRef<boolean>(false);
  const lastActiveRoomRef = useRef<{ code: string } | null>(() => {
    if (initialRoomCode) return { code: initialRoomCode.trim().toUpperCase() };
    const saved = sessionRecovery.getActiveSession();
    if (saved && saved.gameType === 'pinturillo' && saved.roomCode) {
      return { code: saved.roomCode };
    }
    return null;
  });

  const playerRef = useRef(player);
  playerRef.current = player;

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

  // Primary WebSocket Connect function
  const connect = useCallback(() => {
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const wsUrl = getSanitizedSocketUrl();
    const isInitial = reconnectAttemptsRef.current === 0;
    setConnectionStatus(isInitial ? 'connecting' : 'reconnecting');
    isManuallyClosedRef.current = false;

    console.log(
      isInitial
        ? `[Pinturillo Client] Connecting to: ${wsUrl}`
        : `[Pinturillo Client] Reconnecting (attempt ${reconnectAttemptsRef.current + 1}) to: ${wsUrl}`
    );

    try {
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        console.log('[Pinturillo Client] Connected', {
          url: wsUrl,
          readyState: socket.readyState,
        });
        setConnectionStatus('connected');
        setErrorMessage(null);
        reconnectAttemptsRef.current = 0;

        // Flush any queued client messages
        while (messageQueueRef.current.length > 0) {
          const queued = messageQueueRef.current.shift();
          if (queued && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(queued));
          }
        }

        // Heartbeat ping interval (every 20s)
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'ping' }));
          }
        }, 20000);

        // Auto-rejoin active room if session exists or reconnecting
        const activeSession = sessionRecovery.getActiveSession();
        const roomToJoin =
          lastActiveRoomRef.current?.code ||
          (activeSession && activeSession.gameType === 'pinturillo'
            ? activeSession.roomCode
            : null);

        if (roomToJoin) {
          lastActiveRoomRef.current = { code: roomToJoin };
          socket.send(
            JSON.stringify({
              type: 'join_room',
              code: roomToJoin,
              player: playerRef.current,
            })
          );
        }
      };

      socket.onmessage = (event: MessageEvent) => {
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
        console.error('[Pinturillo Client] WebSocket error', {
          type: event.type,
          readyState: socket.readyState,
          url: wsUrl,
        });
      };

      socket.onclose = (event: CloseEvent) => {
        console.log('[Pinturillo Client] WebSocket closed', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          readyState: socket.readyState,
          url: wsUrl,
        });

        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

        // If manually closed (e.g. user clicked Exit / Volver), don't reconnect
        if (isManuallyClosedRef.current) {
          setConnectionStatus('disconnected');
          return;
        }

        // Automatic controlled exponential backoff reconnection
        const maxAttempts = 5;
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

          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
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
  }, [getSanitizedSocketUrl]);

  // Clean unmount & Tab Visibility Change Recovery
  useEffect(() => {
    // If there is an active saved session or initial code, connect immediately
    const saved = sessionRecovery.getActiveSession();
    if (
      (saved && saved.gameType === 'pinturillo' && saved.roomCode) ||
      (initialRoomCode && initialRoomCode.trim().length >= 4)
    ) {
      connect();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (
          !wsRef.current ||
          wsRef.current.readyState === WebSocket.CLOSED ||
          wsRef.current.readyState === WebSocket.CLOSING
        ) {
          console.log('[Pinturillo Client] Tab foregrounded: resuming connection');
          reconnectAttemptsRef.current = 0;
          connect();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      isManuallyClosedRef.current = true;
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (countdownDismissTimeoutRef.current)
        clearTimeout(countdownDismissTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted');
      }
    };
  }, [connect, initialRoomCode]);

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

  // Manual retry handler
  const retryConnection = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    setErrorMessage(null);
    setConnectionStatus('connecting');
    if (wsRef.current) {
      try {
        wsRef.current.close(1000, 'Manual retry');
      } catch {}
    }
    connect();
  }, [connect]);

  // Create room with REST pre-registration and WebSocket join
  const createRoom = useCallback(
    async (
      creatorPlayer: { id: string; name: string; avatar: string; color: string },
      config?: Partial<PinturilloConfig>
    ) => {
      setErrorMessage(null);
      setIsSubmitting(true);
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
      playerRef.current = joiningPlayer;

      try {
        const validation = await validateJoinOnlineRoom(
          cleanCode,
          'pinturillo',
          joiningPlayer as PlayerProfile
        );

        if (!validation.valid) {
          setIsSubmitting(false);
          if (validation.wrongGame && validation.actualGameType && onWrongGame) {
            onWrongGame(
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
    [send, onWrongGame]
  );

  // Explicit leave room
  const leaveRoom = useCallback(() => {
    isManuallyClosedRef.current = true;
    sessionRecovery.clearActiveSession();
    lastActiveRoomRef.current = null;
    send({ type: 'leave_room' });
    setRoomState(null);
    setCountdownInfo(null);
    setErrorMessage(null);

    if (wsRef.current) {
      wsRef.current.close(1000, 'User left room');
      wsRef.current = null;
    }
    setConnectionStatus('idle');
  }, [send]);

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
