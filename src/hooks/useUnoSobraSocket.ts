import { useState, useEffect, useRef, useCallback } from 'react';
import {
  UnoSobraRoomState,
  UnoSobraConfig,
  UnoSobraClientMessage,
  UnoSobraServerMessage,
} from '../types/unoSobra';
import {
  createOnlineRoom,
  validateJoinOnlineRoom,
  PlayerProfile,
} from '../services/multiplayerRoomService';
import { sessionRecovery } from '../services/sessionRecovery';
import { audio } from '../utils/audio';
import { getGameWsUrl } from '../config/network';
import { backendHealth } from '../services/backendHealth';
import { safeCloseWebSocket } from '../utils/safeWebSocket';

export type UnoSobraConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'failed';

interface UseUnoSobraSocketOptions {
  player: PlayerProfile;
  initialRoomCode?: string;
  enabled?: boolean;
  onWrongGame?: (actualGameType: any, roomCode: string) => void;
}

export function useUnoSobraSocket({
  player,
  initialRoomCode,
  enabled = true,
  onWrongGame,
}: UseUnoSobraSocketOptions) {
  const [connectionStatus, setConnectionStatus] = useState<UnoSobraConnectionStatus>('idle');
  const [roomState, setRoomState] = useState<UnoSobraRoomState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const messageQueueRef = useRef<UnoSobraClientMessage[]>([]);
  const reconnectAttemptsRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isManuallyClosedRef = useRef<boolean>(false);
  const isCreatingOrJoiningRef = useRef<boolean>(false);

  const playerRef = useRef(player);
  playerRef.current = player;

  const onWrongGameRef = useRef(onWrongGame);
  onWrongGameRef.current = onWrongGame;

  const lastActiveRoomRef = useRef<{ code: string } | null>(
    (() => {
      if (initialRoomCode && initialRoomCode.trim()) {
        return { code: initialRoomCode.trim().toUpperCase() };
      }
      const saved = sessionRecovery.getActiveSession();
      if (saved && (saved.gameType as string) === 'uno-sobra' && saved.roomCode) {
        return { code: saved.roomCode.trim().toUpperCase() };
      }
      return null;
    })()
  );

  const getSanitizedSocketUrl = useCallback((): string => {
    return getGameWsUrl('/ws/uno-sobra', 'VITE_UNO_SOBRA_WS_URL');
  }, []);

  const sendClientMessage = useCallback((msg: UnoSobraClientMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    } else {
      messageQueueRef.current.push(msg);
    }
  }, []);

  const flushMessageQueue = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    while (messageQueueRef.current.length > 0) {
      const msg = messageQueueRef.current.shift();
      if (msg) {
        wsRef.current.send(JSON.stringify(msg));
      }
    }
  }, []);

  const connectToSocket = useCallback(
    (roomCode: string, isReconnect = false) => {
      if (!enabled) return;

      const cleanCode = roomCode.toUpperCase().trim();
      if (!cleanCode) return;

      if (wsRef.current) {
        safeCloseWebSocket(wsRef.current, 'Reemplazando socket');
        wsRef.current = null;
      }

      setConnectionStatus(isReconnect ? 'reconnecting' : 'connecting');
      setErrorMessage(null);
      isManuallyClosedRef.current = false;

      const wsUrl = getSanitizedSocketUrl();

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setConnectionStatus('connected');
          reconnectAttemptsRef.current = 0;
          backendHealth.markHealthy();

          lastActiveRoomRef.current = { code: cleanCode };
          sessionRecovery.saveActiveSession({
            gameType: 'uno-sobra',
            roomCode: cleanCode,
            playerId: playerRef.current.id,
          });

          if (isReconnect) {
            sendClientMessage({
              type: 'RECONNECT',
              code: cleanCode,
              playerId: playerRef.current.id,
            });
          } else {
            sendClientMessage({
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

          flushMessageQueue();

          if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = setInterval(() => {
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ type: 'PING' }));
            }
          }, 15000);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as UnoSobraServerMessage;
            if (data.type === 'PONG') return;

            if (data.type === 'ROOM_STATE') {
              setRoomState(data.state);
              setErrorMessage(null);
            } else if (data.type === 'ERROR') {
              setErrorMessage(data.message);
              audio.playExplosion();
            }
          } catch (err) {
            console.error('[useUnoSobraSocket] Error parseando mensaje:', err);
          }
        };

        ws.onclose = () => {
          if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
          }

          if (isManuallyClosedRef.current) {
            setConnectionStatus('disconnected');
            return;
          }

          if (lastActiveRoomRef.current && reconnectAttemptsRef.current < 6) {
            setConnectionStatus('reconnecting');
            const delay = Math.min(1000 * Math.pow(1.5, reconnectAttemptsRef.current), 5000);
            reconnectAttemptsRef.current += 1;

            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = setTimeout(() => {
              if (lastActiveRoomRef.current) {
                connectToSocket(lastActiveRoomRef.current.code, true);
              }
            }, delay);
          } else {
            setConnectionStatus('disconnected');
          }
        };

        ws.onerror = (err) => {
          console.warn('[useUnoSobraSocket] Error de conexión socket:', err);
        };
      } catch (err: any) {
        setConnectionStatus('failed');
        setErrorMessage('No se ha podido conectar al servidor');
      }
    },
    [enabled, flushMessageQueue, getSanitizedSocketUrl, sendClientMessage]
  );

  const createRoom = useCallback(
    async (config?: Partial<UnoSobraConfig>) => {
      if (isCreatingOrJoiningRef.current) return;
      isCreatingOrJoiningRef.current = true;
      setErrorMessage(null);
      setConnectionStatus('connecting');

      try {
        const roomSummary = await createOnlineRoom(
          'uno-sobra',
          playerRef.current,
          config
        );
        const code = roomSummary.code || roomSummary.roomCode;
        lastActiveRoomRef.current = { code };
        connectToSocket(code, false);
      } catch (err: any) {
        setConnectionStatus('failed');
        setErrorMessage(err.message || 'Error al crear la sala');
      } finally {
        isCreatingOrJoiningRef.current = false;
      }
    },
    [connectToSocket]
  );

  const joinRoom = useCallback(
    async (codeToJoin: string) => {
      if (isCreatingOrJoiningRef.current) return;
      isCreatingOrJoiningRef.current = true;
      const cleanCode = codeToJoin.trim().toUpperCase();
      setErrorMessage(null);
      setConnectionStatus('connecting');

      try {
        const valResult = await validateJoinOnlineRoom(
          cleanCode,
          'uno-sobra',
          playerRef.current
        );

        if (!valResult.valid) {
          if (valResult.wrongGame && valResult.actualGameType && onWrongGameRef.current) {
            onWrongGameRef.current(valResult.actualGameType, cleanCode);
            setConnectionStatus('idle');
            return;
          }
          setConnectionStatus('failed');
          setErrorMessage(valResult.message || 'No se puede unir a la sala');
          return;
        }

        lastActiveRoomRef.current = { code: cleanCode };
        connectToSocket(cleanCode, false);
      } catch (err: any) {
        setConnectionStatus('failed');
        setErrorMessage(err.message || 'Error al conectar con la sala');
      } finally {
        isCreatingOrJoiningRef.current = false;
      }
    },
    [connectToSocket]
  );

  const updateConfig = useCallback(
    (config: Partial<UnoSobraConfig>) => {
      sendClientMessage({ type: 'UPDATE_CONFIG', config });
    },
    [sendClientMessage]
  );

  const toggleReady = useCallback(
    (isReady: boolean) => {
      sendClientMessage({ type: 'TOGGLE_READY', isReady });
    },
    [sendClientMessage]
  );

  const startGame = useCallback(() => {
    sendClientMessage({ type: 'START_GAME' });
  }, [sendClientMessage]);

  const castVote = useCallback(
    (targetPlayerId: string) => {
      sendClientMessage({ type: 'CAST_VOTE', targetPlayerId });
    },
    [sendClientMessage]
  );

  const transferHost = useCallback(
    (targetPlayerId: string) => {
      sendClientMessage({ type: 'TRANSFER_HOST', targetPlayerId });
    },
    [sendClientMessage]
  );

  const kickPlayer = useCallback(
    (targetPlayerId: string) => {
      sendClientMessage({ type: 'KICK_PLAYER', targetPlayerId });
    },
    [sendClientMessage]
  );

  const returnToLobby = useCallback(() => {
    sendClientMessage({ type: 'RETURN_TO_LOBBY' });
  }, [sendClientMessage]);

  const leaveRoom = useCallback(() => {
    isManuallyClosedRef.current = true;
    lastActiveRoomRef.current = null;
    sessionRecovery.clearActiveSession();

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }

    sendClientMessage({ type: 'LEAVE_ROOM' });

    if (wsRef.current) {
      safeCloseWebSocket(wsRef.current, 'Salida voluntaria del jugador');
      wsRef.current = null;
    }

    setRoomState(null);
    setConnectionStatus('idle');
    setErrorMessage(null);
  }, [sendClientMessage]);

  useEffect(() => {
    if (!enabled) return;

    if (lastActiveRoomRef.current && connectionStatus === 'idle') {
      connectToSocket(lastActiveRoomRef.current.code, true);
    }

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (wsRef.current) {
        safeCloseWebSocket(wsRef.current, 'Desmontaje componente');
        wsRef.current = null;
      }
    };
  }, [connectToSocket, enabled]);

  return {
    connectionStatus,
    roomState,
    errorMessage,
    createRoom,
    joinRoom,
    updateConfig,
    toggleReady,
    startGame,
    castVote,
    transferHost,
    kickPlayer,
    returnToLobby,
    leaveRoom,
  };
}
