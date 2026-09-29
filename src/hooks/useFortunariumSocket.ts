import { useState, useEffect, useRef, useCallback } from 'react';
import {
  FortunariumRoomState,
  FortunariumConfig,
  FortunariumClientMessage,
  FortunariumServerMessage,
  FortunariumBetMode,
  FortunariumUpgradeId,
  FortunariumSpinResult,
  FortunariumRemoteCursor,
  FortunariumDevScenario,
  FortunariumModifierId,
} from '../types/fortunarium';
import {
  createOnlineRoom,
  validateJoinOnlineRoom,
  PlayerProfile,
} from '../services/multiplayerRoomService';
import { sessionRecovery } from '../services/sessionRecovery';
import { getGameWsUrl } from '../config/network';

export type FortunariumConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'failed';

interface UseFortunariumSocketOptions {
  player: PlayerProfile;
  initialRoomCode?: string;
  enabled?: boolean;
  onWrongGame?: (actualGameType: any, roomCode: string) => void;
}

function getInitialFortunariumRoom(initialRoomCode?: string): { code: string } | null {
  if (initialRoomCode && initialRoomCode.trim()) {
    return { code: initialRoomCode.trim().toUpperCase() };
  }
  const saved = sessionRecovery.getActiveSession();
  if (saved && saved.gameType === 'fortunarium' && saved.roomCode) {
    return { code: saved.roomCode.trim().toUpperCase() };
  }
  return null;
}

export function useFortunariumSocket({
  player,
  initialRoomCode,
  enabled = true,
  onWrongGame,
}: UseFortunariumSocketOptions) {
  const [connectionStatus, setConnectionStatus] = useState<FortunariumConnectionStatus>('idle');
  const [roomState, setRoomState] = useState<FortunariumRoomState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    text: string;
    variant?: 'info' | 'warning' | 'danger' | 'success';
  } | null>(null);
  const [spinEvent, setSpinEvent] = useState<FortunariumSpinResult | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const messageQueueRef = useRef<FortunariumClientMessage[]>([]);
  const cursorListenersRef = useRef<Set<(cursor: FortunariumRemoteCursor) => void>>(new Set());
  const lastCursorSentAtRef = useRef<number>(0);
  const latestStateVersionRef = useRef<number>(0);
  const reconnectAttemptsRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isManuallyClosedRef = useRef<boolean>(false);
  const lastActiveRoomRef = useRef<{ code: string } | null>(
    getInitialFortunariumRoom(initialRoomCode)
  );

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

  const sendMessage = useCallback((msg: FortunariumClientMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    } else {
      messageQueueRef.current.push(msg);
    }
  }, []);

  const connectToRoom = useCallback(
    (roomCode: string) => {
      if (!roomCode) return;
      const cleanCode = roomCode.trim().toUpperCase();
      clearReconnectTimer();
      clearPingTimer();

      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
        wsRef.current = null;
      }

      setConnectionStatus('connecting');
      setErrorMessage(null);
      isManuallyClosedRef.current = false;

      const wsUrl = getGameWsUrl('/ws/fortunarium');
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;

        ws.send(
          JSON.stringify({
            type: 'JOIN_ROOM',
            roomCode: cleanCode,
            player: {
              id: playerRef.current.id,
              name: playerRef.current.name,
              avatar: playerRef.current.avatar,
              color: playerRef.current.color,
            },
          } satisfies FortunariumClientMessage)
        );

        while (messageQueueRef.current.length > 0) {
          const queued = messageQueueRef.current.shift();
          if (queued && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(queued));
          }
        }

        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'PING' } satisfies FortunariumClientMessage));
          }
        }, 15000);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as FortunariumServerMessage;
          if (msg.type === 'ROOM_STATE') {
            if (
              typeof msg.state.stateVersion === 'number' &&
              msg.state.stateVersion < latestStateVersionRef.current
            ) {
              return;
            }
            latestStateVersionRef.current = msg.state.stateVersion || 0;
            setRoomState(msg.state);
            lastActiveRoomRef.current = { code: msg.state.roomCode };
            sessionRecovery.saveActiveSession({
              gameType: 'fortunarium',
              roomCode: msg.state.roomCode,
              playerId: playerRef.current.id,
            });
          } else if (msg.type === 'SPIN_STARTED') {
            latestStateVersionRef.current = msg.spinResult.stateVersion || msg.state.stateVersion || 0;
            setRoomState(msg.state);
            setSpinEvent(msg.spinResult);
          } else if (msg.type === 'CURSOR_UPDATE') {
            const cursorPacket: FortunariumRemoteCursor = {
              playerId: msg.playerId,
              name: msg.name,
              color: msg.color,
              x: msg.x,
              y: msg.y,
              updatedAt: Date.now(),
            };
            for (const listener of cursorListenersRef.current) {
              listener(cursorPacket);
            }
          } else if (msg.type === 'NOTIFICATION') {
            setNotification({ text: msg.text, variant: msg.variant });
            setTimeout(() => setNotification(null), 5000);
          } else if (msg.type === 'ERROR') {
            setErrorMessage(msg.message);
            setTimeout(() => setErrorMessage(null), 4500);
          }
        } catch (err) {
          console.error('[useFortunariumSocket] Error parsing message:', err);
        }
      };

      ws.onclose = () => {
        clearPingTimer();
        if (isManuallyClosedRef.current) {
          setConnectionStatus('disconnected');
          return;
        }

        if (lastActiveRoomRef.current?.code && reconnectAttemptsRef.current < 8) {
          setConnectionStatus('reconnecting');
          const delay = Math.min(4000, 700 * Math.pow(1.5, reconnectAttemptsRef.current));
          reconnectAttemptsRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            if (lastActiveRoomRef.current?.code && !isManuallyClosedRef.current) {
              connectToRoom(lastActiveRoomRef.current.code);
            }
          }, delay);
        } else {
          setConnectionStatus('failed');
        }
      };
    },
    [clearPingTimer, clearReconnectTimer]
  );

  useEffect(() => {
    if (!enabled) return;
    const initial = getInitialFortunariumRoom(initialRoomCode);
    if (initial?.code) {
      validateJoinOnlineRoom(initial.code, 'fortunarium', playerRef.current)
        .then((res) => {
          if (res.valid) {
            connectToRoom(initial.code);
          } else if (res.wrongGame && res.actualGameType && onWrongGameRef.current) {
            onWrongGameRef.current(res.actualGameType, initial.code);
          } else {
            sessionRecovery.clearActiveSession();
            lastActiveRoomRef.current = null;
          }
        })
        .catch(() => {
          sessionRecovery.clearActiveSession();
        });
    }

    return () => {
      isManuallyClosedRef.current = true;
      clearReconnectTimer();
      clearPingTimer();
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [enabled, initialRoomCode, connectToRoom, clearReconnectTimer, clearPingTimer]);

  const createRoom = useCallback(
    async (config?: Partial<FortunariumConfig>) => {
      setConnectionStatus('connecting');
      setErrorMessage(null);
      const created = await createOnlineRoom('fortunarium', playerRef.current, config);
      lastActiveRoomRef.current = { code: created.roomCode };
      sessionRecovery.saveActiveSession({
        gameType: 'fortunarium',
        roomCode: created.roomCode,
        playerId: playerRef.current.id,
      });
      connectToRoom(created.roomCode);
    },
    [connectToRoom]
  );

  const joinRoom = useCallback(
    async (code: string) => {
      const cleanCode = code.trim().toUpperCase();
      setConnectionStatus('connecting');
      setErrorMessage(null);

      const validation = await validateJoinOnlineRoom(
        cleanCode,
        'fortunarium',
        playerRef.current
      );
      if (!validation.valid) {
        setConnectionStatus('idle');
        if (validation.wrongGame && validation.actualGameType && onWrongGameRef.current) {
          onWrongGameRef.current(validation.actualGameType, cleanCode);
          return;
        }
        throw new Error(validation.message || 'No se ha podido unir a la sala');
      }

      lastActiveRoomRef.current = { code: cleanCode };
      sessionRecovery.saveActiveSession({
        gameType: 'fortunarium',
        roomCode: cleanCode,
        playerId: playerRef.current.id,
      });
      connectToRoom(cleanCode);
    },
    [connectToRoom]
  );

  const leaveRoom = useCallback(() => {
    isManuallyClosedRef.current = true;
    clearReconnectTimer();
    clearPingTimer();
    lastActiveRoomRef.current = null;
    sessionRecovery.clearActiveSession();

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'LEAVE_ROOM' } satisfies FortunariumClientMessage));
      wsRef.current.close();
    }
    wsRef.current = null;
    setRoomState(null);
    setConnectionStatus('idle');
  }, [clearPingTimer, clearReconnectTimer]);

  const subscribeToCursors = useCallback(
    (listener: (cursor: FortunariumRemoteCursor) => void) => {
      cursorListenersRef.current.add(listener);
      return () => {
        cursorListenersRef.current.delete(listener);
      };
    },
    []
  );

  const sendCursorMove = useCallback((x: number, y: number) => {
    const now = performance.now();
    // Throttle cursor broadcasts to ~30ms (33fps) and never queue cursor messages
    if (now - lastCursorSentAtRef.current < 30) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      lastCursorSentAtRef.current = now;
      wsRef.current.send(
        JSON.stringify({
          type: 'CURSOR_MOVE',
          x: Number(x.toFixed(4)),
          y: Number(y.toFixed(4)),
        } satisfies FortunariumClientMessage)
      );
    }
  }, []);

  const setCursorColor = useCallback(
    (color: string) => {
      sendMessage({ type: 'SET_CURSOR_COLOR', color });
    },
    [sendMessage]
  );

  const updateConfig = useCallback(
    (config: Partial<FortunariumConfig>) => {
      sendMessage({ type: 'UPDATE_CONFIG', config });
    },
    [sendMessage]
  );

  const startGame = useCallback(() => {
    sendMessage({ type: 'START_GAME' });
  }, [sendMessage]);

  const setBetMode = useCallback(
    (betMode: FortunariumBetMode) => {
      sendMessage({ type: 'SET_BET_MODE', betMode });
    },
    [sendMessage]
  );

  const spinSlot = useCallback(
    (forceScenario?: FortunariumDevScenario, triggerSource?: 'button' | 'lever') => {
      sendMessage({ type: 'SPIN_SLOT', forceScenario, triggerSource });
    },
    [sendMessage]
  );

  const devGrantModifier = useCallback(
    (modifierId: FortunariumModifierId) => {
      sendMessage({ type: 'DEV_GRANT_MODIFIER', modifierId });
    },
    [sendMessage]
  );

  const repairMachine = useCallback(
    (useKey?: boolean) => {
      sendMessage({ type: 'REPAIR_MACHINE', useKey });
    },
    [sendMessage]
  );

  const buyUpgrade = useCallback(
    (upgradeId: FortunariumUpgradeId, useKey?: boolean) => {
      sendMessage({ type: 'BUY_UPGRADE', upgradeId, useKey });
    },
    [sendMessage]
  );

  const voteUpgrade = useCallback(
    (upgradeId: FortunariumUpgradeId) => {
      sendMessage({ type: 'VOTE_UPGRADE', upgradeId });
    },
    [sendMessage]
  );

  const resolveEvent = useCallback(
    (optionId: string) => {
      sendMessage({ type: 'RESOLVE_EVENT', optionId });
    },
    [sendMessage]
  );

  const payQuotaEarly = useCallback(() => {
    sendMessage({ type: 'PAY_QUOTA_EARLY' });
  }, [sendMessage]);

  const nextRound = useCallback(() => {
    sendMessage({ type: 'NEXT_ROUND' });
  }, [sendMessage]);

  const restartMatch = useCallback(() => {
    sendMessage({ type: 'RESTART_MATCH' });
  }, [sendMessage]);

  const returnToLobby = useCallback(() => {
    sendMessage({ type: 'RETURN_TO_LOBBY' });
  }, [sendMessage]);

  return {
    connectionStatus,
    roomState,
    errorMessage,
    notification,
    spinEvent,
    subscribeToCursors,
    sendCursorMove,
    setCursorColor,
    createRoom,
    joinRoom,
    leaveRoom,
    updateConfig,
    startGame,
    setBetMode,
    spinSlot,
    devGrantModifier,
    repairMachine,
    buyUpgrade,
    voteUpgrade,
    resolveEvent,
    payQuotaEarly,
    nextRound,
    restartMatch,
    returnToLobby,
  };
}
