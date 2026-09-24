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
  | 'error';

interface UseCodigoRojoSocketOptions {
  player: { id: string; name: string; avatar: string; color: string };
  initialRoomCode?: string;
  onWrongGame?: (
    actualGameType: 'la-bomba' | 'la-peor-respuesta' | 'pinturillo' | 'palabra-secreta' | 'codigo-rojo',
    roomCode: string
  ) => void;
}

export function useCodigoRojoSocket({
  player,
  initialRoomCode,
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
  const lastActiveRoomRef = useRef<{ code: string } | null>(
    initialRoomCode
      ? { code: initialRoomCode.trim().toUpperCase() }
      : (() => {
          const rec = sessionRecovery.get('codigo-rojo');
          return rec ? { code: rec.code } : null;
        })()
  );

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
      clearReconnectTimer();
      clearPingInterval();

      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (e) {
          // ignore
        }
        wsRef.current = null;
      }

      setConnectionStatus(isReconnection ? 'reconnecting' : 'connecting');
      setErrorMessage(null);
      isManuallyClosedRef.current = false;
      lastActiveRoomRef.current = { code: cleanCode };

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ws/codigo-rojo`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;

        sessionRecovery.save('codigo-rojo', {
          code: cleanCode,
          playerId: player.id,
          gameType: 'codigo-rojo',
        });

        if (isReconnection) {
          sendMessage({
            type: 'RECONNECT',
            code: cleanCode,
            playerId: player.id,
          });
        } else {
          sendMessage({
            type: 'JOIN_ROOM',
            code: cleanCode,
            player: {
              id: player.id,
              name: player.name,
              avatar: player.avatar,
              color: player.color,
            },
          });
        }

        // Flush queued messages
        while (messageQueueRef.current.length > 0) {
          const m = messageQueueRef.current.shift();
          if (m) ws.send(JSON.stringify(m));
        }

        // Keep-alive ping
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'PING' }));
          }
        }, 15000);
      };

      ws.onmessage = (event) => {
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
            setErrorMessage(msg.message);
          }
        } catch (e) {
          console.error('[useCodigoRojoSocket] Error processing message:', e);
        }
      };

      ws.onclose = () => {
        clearPingInterval();
        if (isManuallyClosedRef.current) {
          setConnectionStatus('disconnected');
          return;
        }

        setConnectionStatus('disconnected');

        // Auto-reconnect up to 10 attempts
        if (reconnectAttemptsRef.current < 10) {
          reconnectAttemptsRef.current++;
          const delay = Math.min(1000 * reconnectAttemptsRef.current, 5000);
          reconnectTimeoutRef.current = setTimeout(() => {
            if (!isManuallyClosedRef.current && lastActiveRoomRef.current) {
              connectToRoom(lastActiveRoomRef.current.code, true);
            }
          }, delay);
        }
      };

      ws.onerror = (err) => {
        console.error('[useCodigoRojoSocket] WebSocket error:', err);
        setConnectionStatus('error');
      };
    },
    [player, sendMessage]
  );

  // Connection resilience for tab visibility/re-foregrounding
  useEffect(() => {
    const resilience = createConnectionResilience({
      getSocket: () => wsRef.current,
      onReconnect: () => {
        if (!isManuallyClosedRef.current && lastActiveRoomRef.current) {
          connectToRoom(lastActiveRoomRef.current.code, true);
        }
      },
    });

    resilience.attach();
    return () => {
      resilience.detach();
    };
  }, [connectToRoom]);

  // Handle initial room code
  useEffect(() => {
    if (initialRoomCode && initialRoomCode.trim()) {
      connectToRoom(initialRoomCode.trim());
    }
  }, [initialRoomCode, connectToRoom]);

  // Clean-up on unmount
  useEffect(() => {
    return () => {
      isManuallyClosedRef.current = true;
      clearReconnectTimer();
      clearPingInterval();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  const createRoom = async (config?: Partial<CodigoRojoConfig>) => {
    try {
      setConnectionStatus('connecting');
      setErrorMessage(null);
      const summary = await createOnlineRoom(
        'codigo-rojo',
        {
          id: player.id,
          name: player.name,
          avatar: player.avatar,
          color: player.color,
        },
        config
      );
      connectToRoom(summary.code);
      return summary.code;
    } catch (e: any) {
      setConnectionStatus('error');
      setErrorMessage(e.message || 'Error al crear la sala');
      throw e;
    }
  };

  const joinRoom = async (code: string) => {
    try {
      const cleanCode = code.toUpperCase().trim();
      const validation = await validateJoinOnlineRoom(cleanCode, 'codigo-rojo');
      if (!validation.valid) {
        if (validation.wrongGame && validation.actualGameType && onWrongGame) {
          onWrongGame(validation.actualGameType, cleanCode);
          return;
        }
        setErrorMessage(validation.message || 'No se puede unir a esta sala');
        return;
      }
      connectToRoom(cleanCode);
    } catch (e: any) {
      setErrorMessage(e.message || 'Error al validar sala');
    }
  };

  const updateConfig = (config: Partial<CodigoRojoConfig>) => {
    sendMessage({ type: 'UPDATE_CONFIG', config });
  };

  const startMission = () => {
    audio.playGameStart();
    sendMessage({ type: 'START_MISSION' });
  };

  const submitModuleAction = (moduleId: string, action: any) => {
    audio.playKeyboardTick();
    sendMessage({ type: 'MODULE_ACTION', moduleId, action });
  };

  const nextMission = () => {
    audio.playGameStart();
    sendMessage({ type: 'NEXT_MISSION' });
  };

  const restartMatch = () => {
    sendMessage({ type: 'RESTART_MATCH' });
  };

  const leaveRoom = () => {
    isManuallyClosedRef.current = true;
    sessionRecovery.clear('codigo-rojo');
    sendMessage({ type: 'LEAVE_ROOM' });
    clearReconnectTimer();
    clearPingInterval();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setRoomState(null);
    setConnectionStatus('idle');
  };

  const kickPlayer = (targetPlayerId: string) => {
    sendMessage({ type: 'KICK_PLAYER', targetPlayerId });
  };

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
