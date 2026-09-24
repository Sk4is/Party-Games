import { useState, useEffect, useRef, useCallback } from 'react';
import {
  CodigoRojoRoomState,
  CodigoRojoPlayer,
  CodigoRojoConfig,
  CodigoRojoServerMessage,
  CodigoRojoClientMessage,
} from '../types/codigoRojo';
import {
  createOnlineRoom,
  validateJoinOnlineRoom,
  PlayerProfile,
} from '../services/multiplayerRoomService';
import { sessionRecovery } from '../services/sessionRecovery';
import { audio } from '../utils/audio';
import { createConnectionResilience } from '../utils/connectionResilience';

export type CodigoRojoConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'failed';

interface UseCodigoRojoSocketOptions {
  player: { id: string; name: string; avatar: string; color: string };
  initialRoomCode?: string;
  enabled?: boolean;
  onWrongGame?: (
    actualGameType: 'la-bomba' | 'la-peor-respuesta' | 'pinturillo' | 'palabra-secreta' | 'codigo-rojo',
    roomCode: string
  ) => void;
}

export function useCodigoRojoSocket({
  player,
  initialRoomCode,
  enabled = true,
  onWrongGame,
}: UseCodigoRojoSocketOptions) {
  const [connectionStatus, setConnectionStatus] = useState<CodigoRojoConnectionStatus>('idle');
  const [roomState, setRoomState] = useState<CodigoRojoRoomState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionAlert, setActionAlert] = useState<{
    success: boolean;
    strike: boolean;
    solved: boolean;
    moduleId: string;
    message?: string;
  } | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const messageQueueRef = useRef<CodigoRojoClientMessage[]>([]);
  const reconnectAttemptsRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isManuallyClosedRef = useRef<boolean>(false);
  const isCreatingOrJoiningRef = useRef<boolean>(false);
  const lastActivityRef = useRef<number>(Date.now());

  const playerRef = useRef(player);
  playerRef.current = player;

  const onWrongGameRef = useRef(onWrongGame);
  onWrongGameRef.current = onWrongGame;

  // Compute initial target room (if any) from prop or active session
  const lastActiveRoomRef = useRef<{ code: string } | null>(() => {
    if (initialRoomCode && initialRoomCode.trim()) {
      return { code: initialRoomCode.trim().toUpperCase() };
    }
    const saved = sessionRecovery.getActiveSession();
    if (saved && saved.gameType === 'codigo-rojo' && saved.roomCode) {
      return { code: saved.roomCode.trim().toUpperCase() };
    }
    return null;
  });

  const clearReconnectTimer = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  const clearPingInterval = () => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  };

  // Safe sanitized WebSocket URL resolution
  const getSanitizedSocketUrl = useCallback((): string => {
    const envUrl =
      (import.meta as any).env?.VITE_WS_URL ||
      (import.meta as any).env?.VITE_CODIGO_ROJO_WS_URL;
    if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
      return envUrl.trim();
    }
    if (typeof window === 'undefined') {
      return 'ws://localhost:3000/ws/codigo-rojo';
    }
    const isHttps = window.location.protocol === 'https:';
    const protocol = isHttps ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws/codigo-rojo`;
  }, []);

  // Gracefully close any existing socket without triggering unhandled rejections
  const cleanupExistingSocket = useCallback(() => {
    if (wsRef.current) {
      const sock = wsRef.current;
      sock.onopen = null;
      sock.onmessage = null;
      sock.onerror = null;
      sock.onclose = null;

      if (sock.readyState === WebSocket.OPEN) {
        try {
          sock.close(1000, 'Conexión reemplazada');
        } catch {
          // ignore
        }
      } else if (sock.readyState === WebSocket.CONNECTING) {
        // Closing while CONNECTING triggers "WebSocket closed without opened" in some browsers
        // We set onopen to close once handshake completes safely
        sock.onopen = () => {
          try {
            sock.close(1000, 'Cancelado durante conexión');
          } catch {
            // ignore
          }
        };
        sock.onerror = () => {};
      }
      wsRef.current = null;
    }
  }, []);

  const sendMessage = useCallback((msg: CodigoRojoClientMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    } else {
      messageQueueRef.current.push(msg);
    }
  }, []);

  const connectToRoom = useCallback(
    (code: string, isReconnection = false) => {
      const cleanCode = code.toUpperCase().trim();
      if (!cleanCode) return;

      // Prevent redundant reconnect if already connected to this room
      if (
        wsRef.current &&
        wsRef.current.readyState === WebSocket.OPEN &&
        lastActiveRoomRef.current?.code === cleanCode
      ) {
        return;
      }

      clearReconnectTimer();
      clearPingInterval();
      cleanupExistingSocket();

      setConnectionStatus(isReconnection ? 'reconnecting' : 'connecting');
      setErrorMessage(null);
      isManuallyClosedRef.current = false;
      lastActiveRoomRef.current = { code: cleanCode };

      const wsUrl = getSanitizedSocketUrl();
      let hasOpened = false;

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          hasOpened = true;
          setConnectionStatus('connected');
          setErrorMessage(null);
          reconnectAttemptsRef.current = 0;
          lastActivityRef.current = Date.now();

          // Save active session for resilience across refresh / backgrounding
          sessionRecovery.saveActiveSession({
            gameType: 'codigo-rojo',
            roomCode: cleanCode,
            playerId: playerRef.current.id,
          });

          if (isReconnection) {
            sendMessage({
              type: 'RECONNECT',
              code: cleanCode,
              playerId: playerRef.current.id,
            });
          } else {
            sendMessage({
              type: 'JOIN_ROOM',
              code: cleanCode,
              player: {
                id: playerRef.current.id,
                name: playerRef.current.name,
                avatar: playerRef.current.avatar,
                color: playerRef.current.color,
              },
            });
          }

          // Flush any queued messages
          while (messageQueueRef.current.length > 0) {
            const m = messageQueueRef.current.shift();
            if (m && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify(m));
            }
          }

          // Keep-alive ping every 15s
          if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'PING' }));
            }
          }, 15000);
        };

        ws.onmessage = (event) => {
          lastActivityRef.current = Date.now();
          try {
            const msg = JSON.parse(event.data) as CodigoRojoServerMessage;

            if (msg.type === 'PONG') {
              return;
            }

            if (msg.type === 'ROOM_STATE') {
              setRoomState(msg.room);
            } else if (msg.type === 'TICK') {
              setRoomState((prev) =>
                prev ? { ...prev, timeRemainingSeconds: msg.timeRemainingSeconds } : null
              );
            } else if (msg.type === 'ACTION_RESULT') {
              setActionAlert({
                success: msg.success,
                strike: msg.strike,
                solved: msg.solved,
                moduleId: msg.moduleId,
                message: msg.message,
              });

              if (msg.strike) {
                audio.playBombWarning(1.5);
              } else if (msg.solved) {
                audio.playCorrect();
              }

              setTimeout(() => {
                setActionAlert(null);
              }, 2500);
            } else if (msg.type === 'ERROR') {
              if (
                msg.message === 'NO SE HA ENCONTRADO LA SALA' ||
                msg.message === 'SALA NO ENCONTRADA' ||
                msg.message === 'JUGADOR NO ENCONTRADO'
              ) {
                sessionRecovery.clearActiveSession();
                lastActiveRoomRef.current = null;
                setRoomState(null);
                setConnectionStatus('idle');
                setErrorMessage(msg.message);
              } else {
                setErrorMessage(msg.message);
              }
            }
          } catch (e) {
            console.error('[Código Rojo] Error processing server message:', e);
          }
        };

        ws.onerror = (event: Event) => {
          console.error('[Código Rojo] WebSocket error diagnostic:', {
            type: event.type,
            readyState: ws?.readyState,
            url: wsUrl,
            roomCode: cleanCode,
            hasOpened,
          });
          setConnectionStatus('failed');
        };

        ws.onclose = (event: CloseEvent) => {
          clearPingInterval();
          wsRef.current = null;

          console.info('[Código Rojo] WebSocket closed diagnostic:', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
            readyState: ws.readyState,
            url: wsUrl,
            openedPreviously: hasOpened,
            explicitLeave: isManuallyClosedRef.current,
          });

          if (isManuallyClosedRef.current) {
            setConnectionStatus('disconnected');
            return;
          }

          // If connection was never established and room was unknown, handle cleanly
          setConnectionStatus('reconnecting');

          // Exponential backoff reconnect: 1s, 2s, 4s, 5s, 5s...
          const backoff = [1000, 2000, 4000, 5000, 5000];
          if (reconnectAttemptsRef.current < 10) {
            const delay = backoff[Math.min(reconnectAttemptsRef.current, backoff.length - 1)];
            reconnectAttemptsRef.current++;
            reconnectTimeoutRef.current = setTimeout(() => {
              if (!isManuallyClosedRef.current && lastActiveRoomRef.current) {
                connectToRoom(lastActiveRoomRef.current.code, true);
              }
            }, delay);
          } else {
            setConnectionStatus('failed');
            setErrorMessage('No se ha podido restablecer la conexión con la sala.');
          }
        };
      } catch (err: any) {
        console.error('[Código Rojo] Failed to instantiate WebSocket:', err);
        setConnectionStatus('failed');
        setErrorMessage('Error al conectar con el servidor.');
      }
    },
    [cleanupExistingSocket, getSanitizedSocketUrl, sendMessage]
  );

  // Auto-connect on mount ONLY if an active session or initial room is verified
  useEffect(() => {
    if (!enabled) return;
    const initial = lastActiveRoomRef.current;
    if (!initial || !initial.code) return;

    let isMounted = true;
    validateJoinOnlineRoom(initial.code, 'codigo-rojo', playerRef.current)
      .then((validation) => {
        if (!isMounted) return;
        if (validation.valid) {
          connectToRoom(initial.code, true);
        } else {
          // If room no longer exists on server, clear stale session cleanly
          sessionRecovery.clearActiveSession();
          lastActiveRoomRef.current = null;
          setConnectionStatus('idle');
          if (validation.wrongGame && validation.actualGameType && onWrongGameRef.current) {
            onWrongGameRef.current(validation.actualGameType, initial.code);
          }
        }
      })
      .catch(() => {
        if (!isMounted) return;
        sessionRecovery.clearActiveSession();
        lastActiveRoomRef.current = null;
        setConnectionStatus('idle');
      });

    return () => {
      isMounted = false;
    };
  }, [enabled, connectToRoom]);

  // Mobile backgrounding / tab visibility resilience manager
  useEffect(() => {
    const cleanupResilience = createConnectionResilience({
      getSocket: () => wsRef.current,
      onReconnect: () => {
        if (!isManuallyClosedRef.current && lastActiveRoomRef.current) {
          connectToRoom(lastActiveRoomRef.current.code, true);
        }
      },
      sendPing: () => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'PING' }));
        }
      },
      getLastActivityTime: () => lastActivityRef.current,
      logTag: '[Código Rojo Client]',
    });

    return () => {
      cleanupResilience();
    };
  }, [connectToRoom]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      isManuallyClosedRef.current = true;
      clearReconnectTimer();
      clearPingInterval();
      cleanupExistingSocket();
    };
  }, [cleanupExistingSocket]);

  // Action: Create Room
  const createRoom = useCallback(
    async (config?: Partial<CodigoRojoConfig>) => {
      if (isCreatingOrJoiningRef.current) return;
      isCreatingOrJoiningRef.current = true;

      try {
        setConnectionStatus('connecting');
        setErrorMessage(null);

        const summary = await createOnlineRoom(
          'codigo-rojo',
          {
            id: playerRef.current.id,
            name: playerRef.current.name,
            avatar: playerRef.current.avatar,
            color: playerRef.current.color,
          },
          config
        );

        connectToRoom(summary.code, false);
        return summary.code;
      } catch (e: any) {
        setConnectionStatus('failed');
        setErrorMessage(e.message || 'NO SE HA PODIDO CREAR LA SALA');
        throw e;
      } finally {
        isCreatingOrJoiningRef.current = false;
      }
    },
    [connectToRoom]
  );

  // Action: Join Room
  const joinRoom = useCallback(
    async (code: string) => {
      if (isCreatingOrJoiningRef.current) return;
      isCreatingOrJoiningRef.current = true;

      try {
        const cleanCode = code.toUpperCase().trim();
        if (!cleanCode) {
          setErrorMessage('Introduce un código de sala');
          return;
        }

        setErrorMessage(null);
        setConnectionStatus('connecting');

        const validation = await validateJoinOnlineRoom(
          cleanCode,
          'codigo-rojo',
          playerRef.current
        );

        if (!validation.valid) {
          setConnectionStatus('idle');
          if (validation.wrongGame && validation.actualGameType && onWrongGameRef.current) {
            onWrongGameRef.current(validation.actualGameType, cleanCode);
            return;
          }
          setErrorMessage(validation.message || 'NO SE HA PODIDO UNIR A LA SALA');
          return;
        }

        connectToRoom(cleanCode, false);
      } catch (e: any) {
        setConnectionStatus('idle');
        setErrorMessage(e.message || 'Error al validar sala');
      } finally {
        isCreatingOrJoiningRef.current = false;
      }
    },
    [connectToRoom]
  );

  const updateConfig = useCallback(
    (config: Partial<CodigoRojoConfig>) => {
      sendMessage({ type: 'UPDATE_CONFIG', config });
    },
    [sendMessage]
  );

  const startMission = useCallback(() => {
    audio.playGameStart();
    sendMessage({ type: 'START_MISSION' });
  }, [sendMessage]);

  const submitModuleAction = useCallback(
    (moduleId: string, action: any) => {
      audio.playKeyboardTick();
      sendMessage({ type: 'MODULE_ACTION', moduleId, action });
    },
    [sendMessage]
  );

  const nextMission = useCallback(() => {
    audio.playGameStart();
    sendMessage({ type: 'NEXT_MISSION' });
  }, [sendMessage]);

  const restartMatch = useCallback(() => {
    sendMessage({ type: 'RESTART_MATCH' });
  }, [sendMessage]);

  const leaveRoom = useCallback(() => {
    isManuallyClosedRef.current = true;
    lastActiveRoomRef.current = null;
    sessionRecovery.clearActiveSession();

    sendMessage({ type: 'LEAVE_ROOM' });
    clearReconnectTimer();
    clearPingInterval();
    cleanupExistingSocket();

    setRoomState(null);
    setConnectionStatus('idle');
  }, [cleanupExistingSocket, sendMessage]);

  const kickPlayer = useCallback(
    (targetPlayerId: string) => {
      sendMessage({ type: 'KICK_PLAYER', targetPlayerId });
    },
    [sendMessage]
  );

  return {
    connectionStatus,
    roomState,
    errorMessage,
    actionAlert,
    createRoom,
    joinRoom,
    updateConfig,
    startMission,
    submitModuleAction,
    nextMission,
    restartMatch,
    leaveRoom,
    kickPlayer,
  };
}
