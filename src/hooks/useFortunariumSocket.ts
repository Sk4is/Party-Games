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
  FortunariumIncidentType,
} from '../types/fortunarium';
import {
  createOnlineRoom,
  validateJoinOnlineRoom,
  PlayerProfile,
} from '../services/multiplayerRoomService';
import { sessionRecovery } from '../services/sessionRecovery';
import { backendHealth } from '../services/backendHealth';
import { getGameWsUrl } from '../config/network';
import { createConnectionResilience } from '../utils/connectionResilience';
import {
  ExplicitSocketLifecycleState,
  connectWebSocketSafely,
  safeCloseWebSocket,
  safeSendWebSocket,
  getBoundedBackoffDelay,
} from '../utils/safeWebSocket';

export type FortunariumConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'failed';

const MAX_RECONNECT_ATTEMPTS = 8;

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
  const lifecycleStateRef = useRef<ExplicitSocketLifecycleState>('IDLE');
  const connectAbortRef = useRef<AbortController | null>(null);
  const connectAttemptIdRef = useRef<number>(0);
  const connectedRoomCodeRef = useRef<string | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

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

  const updateLifecycleState = useCallback((nextState: ExplicitSocketLifecycleState) => {
    lifecycleStateRef.current = nextState;
    switch (nextState) {
      case 'IDLE':
        setConnectionStatus('idle');
        break;
      case 'CONNECTING':
        setConnectionStatus('connecting');
        break;
      case 'OPEN':
        setConnectionStatus('connected');
        break;
      case 'RECONNECTING':
        setConnectionStatus('reconnecting');
        break;
      case 'CLOSING':
      case 'CLOSED':
        if (isManuallyClosedRef.current) {
          setConnectionStatus('disconnected');
        }
        break;
    }
  }, []);

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

  const abortInFlightConnection = useCallback(
    (reason = 'Connection superseded') => {
      if (connectAbortRef.current) {
        try {
          connectAbortRef.current.abort();
        } catch {
          // Ignore abort errors
        }
        connectAbortRef.current = null;
      }
      if (wsRef.current) {
        const prevSocket = wsRef.current;
        wsRef.current = null;
        safeCloseWebSocket(prevSocket, reason, updateLifecycleState);
      }
    },
    [updateLifecycleState]
  );

  const sendMessage = useCallback((msg: FortunariumClientMessage) => {
    const sock = wsRef.current;
    if (sock && sock.readyState === WebSocket.OPEN) {
      safeSendWebSocket(sock, msg as unknown as Record<string, unknown>);
    } else {
      messageQueueRef.current.push(msg);
    }
  }, []);

  const handleServerEvent = useCallback((event: MessageEvent) => {
    lastActivityRef.current = Date.now();
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
        if (
          msg.state.phase === 'LOBBY' ||
          msg.state.totalSpinsInMatch === 0 ||
          !msg.state.lastSpinResult
        ) {
          setSpinEvent(null);
        }
        setRoomState(msg.state);
        lastActiveRoomRef.current = { code: msg.state.roomCode };
        connectedRoomCodeRef.current = msg.state.roomCode;
        sessionRecovery.saveActiveSession({
          gameType: 'fortunarium',
          roomCode: msg.state.roomCode,
          playerId: playerRef.current.id,
        });
      } else if (msg.type === 'SPIN_STARTED') {
        latestStateVersionRef.current =
          msg.spinResult.stateVersion || msg.state.stateVersion || 0;
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
  }, []);

  const connectToRoom = useCallback(
    async (roomCode: string, isReconnectAttempt = false): Promise<void> => {
      if (!roomCode) return;
      const cleanCode = roomCode.trim().toUpperCase();
      if (!cleanCode) return;

      // Single logical connection owner check: do not create duplicate WebSockets
      const existing = wsRef.current;
      if (
        existing &&
        connectedRoomCodeRef.current === cleanCode &&
        (existing.readyState === WebSocket.OPEN || existing.readyState === WebSocket.CONNECTING)
      ) {
        return;
      }

      clearReconnectTimer();
      clearPingTimer();
      abortInFlightConnection('Reconnecting to room');

      isManuallyClosedRef.current = false;
      connectedRoomCodeRef.current = cleanCode;
      lastActiveRoomRef.current = { code: cleanCode };
      setErrorMessage(null);

      const attemptId = ++connectAttemptIdRef.current;
      const abortController = new AbortController();
      connectAbortRef.current = abortController;

      updateLifecycleState(isReconnectAttempt ? 'RECONNECTING' : 'CONNECTING');

      const scheduleRecoverableReconnect = () => {
        if (isManuallyClosedRef.current || connectAttemptIdRef.current !== attemptId) {
          updateLifecycleState('CLOSED');
          return;
        }

        const targetCode = lastActiveRoomRef.current?.code;
        if (targetCode && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          updateLifecycleState('RECONNECTING');
          const delay = getBoundedBackoffDelay(reconnectAttemptsRef.current, {
            baseDelayMs: 750,
            factor: 1.55,
            maxDelayMs: 5000,
            jitterMs: 180,
          });
          reconnectAttemptsRef.current += 1;
          clearReconnectTimer();
          reconnectTimeoutRef.current = setTimeout(() => {
            if (!isManuallyClosedRef.current && lastActiveRoomRef.current?.code) {
              void connectToRoom(lastActiveRoomRef.current.code, true);
            }
          }, delay);
        } else {
          updateLifecycleState('CLOSED');
          setConnectionStatus('failed');
        }
      };

      const wsUrl = getGameWsUrl('/ws/fortunarium', 'VITE_FORTUNARIUM_WS_URL');

      try {
        const ws = await connectWebSocketSafely({
          url: wsUrl,
          timeoutMs: 12000,
          signal: abortController.signal,
          onStateChange: (state) => {
            if (connectAttemptIdRef.current !== attemptId) return;
            if (state === 'CONNECTING' && isReconnectAttempt) {
              updateLifecycleState('RECONNECTING');
            } else {
              updateLifecycleState(state);
            }
          },
          onMessage: (event, socket) => {
            if (wsRef.current !== socket || connectAttemptIdRef.current !== attemptId) return;
            handleServerEvent(event);
          },
          onPostOpenError: () => {
            // Post-open errors are followed by onclose, which triggers bounded recovery
          },
          onPostOpenClose: (_event, socket) => {
            if (wsRef.current === socket) {
              wsRef.current = null;
            }
            clearPingTimer();
            scheduleRecoverableReconnect();
          },
        });

        if (
          isManuallyClosedRef.current ||
          abortController.signal.aborted ||
          connectAttemptIdRef.current !== attemptId
        ) {
          safeCloseWebSocket(ws, 'Stale connection attempt');
          return;
        }

        wsRef.current = ws;
        lastActivityRef.current = Date.now();
        reconnectAttemptsRef.current = 0;
        updateLifecycleState('OPEN');
        backendHealth.markHealthy();

        safeSendWebSocket(ws, {
          type: 'JOIN_ROOM',
          roomCode: cleanCode,
          player: {
            id: playerRef.current.id,
            name: playerRef.current.name,
            avatar: playerRef.current.avatar,
            color: playerRef.current.color,
          },
        } satisfies FortunariumClientMessage);

        while (messageQueueRef.current.length > 0) {
          const queued = messageQueueRef.current.shift();
          if (queued) {
            safeSendWebSocket(ws, queued as unknown as Record<string, unknown>);
          }
        }

        clearPingTimer();
        pingIntervalRef.current = setInterval(() => {
          if (wsRef.current === ws && ws.readyState === WebSocket.OPEN) {
            safeSendWebSocket(ws, { type: 'PING' } satisfies FortunariumClientMessage);
          }
        }, 15000);
      } catch {
        // Recoverable pre-open connection failure: never produce an unhandled rejection
        clearPingTimer();
        scheduleRecoverableReconnect();
      }
    },
    [
      abortInFlightConnection,
      clearPingTimer,
      clearReconnectTimer,
      handleServerEvent,
      updateLifecycleState,
    ]
  );

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    const initial = getInitialFortunariumRoom(initialRoomCode);
    if (initial?.code) {
      validateJoinOnlineRoom(initial.code, 'fortunarium', playerRef.current)
        .then((res) => {
          if (cancelled || isManuallyClosedRef.current) return;
          // Do not clobber if a room connection was already started manually
          if (
            wsRef.current &&
            (wsRef.current.readyState === WebSocket.OPEN ||
              wsRef.current.readyState === WebSocket.CONNECTING)
          ) {
            return;
          }
          if (res.valid) {
            void connectToRoom(initial.code);
          } else if (res.wrongGame && res.actualGameType && onWrongGameRef.current) {
            onWrongGameRef.current(res.actualGameType, initial.code);
          } else {
            sessionRecovery.clearActiveSession();
            lastActiveRoomRef.current = null;
          }
        })
        .catch(() => {
          if (!cancelled) {
            sessionRecovery.clearActiveSession();
          }
        });
    }

    const cleanupResilience = createConnectionResilience({
      getSocket: () => wsRef.current,
      onReconnect: () => {
        if (cancelled || isManuallyClosedRef.current) return;
        const activeCode = lastActiveRoomRef.current?.code;
        if (activeCode) {
          reconnectAttemptsRef.current = 0;
          void connectToRoom(activeCode, true);
        }
      },
      sendPing: () => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          safeSendWebSocket(wsRef.current, { type: 'PING' } satisfies FortunariumClientMessage);
        }
      },
      getLastActivityTime: () => lastActivityRef.current,
      logTag: '[FortunariumSocket]',
    });

    return () => {
      cancelled = true;
      isManuallyClosedRef.current = true;
      cleanupResilience();
      clearReconnectTimer();
      clearPingTimer();
      abortInFlightConnection('Component unmounted');
    };
  }, [
    enabled,
    initialRoomCode,
    connectToRoom,
    clearReconnectTimer,
    clearPingTimer,
    abortInFlightConnection,
  ]);

  const createRoom = useCallback(
    async (config?: Partial<FortunariumConfig>) => {
      updateLifecycleState('CONNECTING');
      setErrorMessage(null);
      const created = await createOnlineRoom('fortunarium', playerRef.current, config);
      lastActiveRoomRef.current = { code: created.roomCode };
      sessionRecovery.saveActiveSession({
        gameType: 'fortunarium',
        roomCode: created.roomCode,
        playerId: playerRef.current.id,
      });
      await connectToRoom(created.roomCode);
    },
    [connectToRoom, updateLifecycleState]
  );

  const joinRoom = useCallback(
    async (code: string) => {
      const cleanCode = code.trim().toUpperCase();
      updateLifecycleState('CONNECTING');
      setErrorMessage(null);

      const validation = await validateJoinOnlineRoom(
        cleanCode,
        'fortunarium',
        playerRef.current
      );
      if (!validation.valid) {
        updateLifecycleState('IDLE');
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
      await connectToRoom(cleanCode);
    },
    [connectToRoom, updateLifecycleState]
  );

  const leaveRoom = useCallback(() => {
    isManuallyClosedRef.current = true;
    clearReconnectTimer();
    clearPingTimer();
    lastActiveRoomRef.current = null;
    connectedRoomCodeRef.current = null;
    sessionRecovery.clearActiveSession();

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      safeSendWebSocket(wsRef.current, {
        type: 'LEAVE_ROOM',
      } satisfies FortunariumClientMessage);
    }
    abortInFlightConnection('User left room');
    setSpinEvent(null);
    setRoomState(null);
    updateLifecycleState('IDLE');
  }, [abortInFlightConnection, clearPingTimer, clearReconnectTimer, updateLifecycleState]);

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
      safeSendWebSocket(wsRef.current, {
        type: 'CURSOR_MOVE',
        x: Number(x.toFixed(4)),
        y: Number(y.toFixed(4)),
      } satisfies FortunariumClientMessage);
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
    setSpinEvent(null);
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
    (modifierId: FortunariumModifierId, targetPlayerId?: string) => {
      sendMessage({ type: 'DEV_GRANT_MODIFIER', modifierId, targetPlayerId });
    },
    [sendMessage]
  );

  const resolveIncident = useCallback(
    (choice: 'EMERGENCY_REPAIR' | 'ABSORB_IMPACT') => {
      sendMessage({ type: 'RESOLVE_INCIDENT', choice });
    },
    [sendMessage]
  );

  const dismissRoulette = useCallback(() => {
    sendMessage({ type: 'DISMISS_ROULETTE' });
  }, [sendMessage]);

  const devTriggerIncident = useCallback(
    (incidentType?: FortunariumIncidentType) => {
      sendMessage({ type: 'DEV_TRIGGER_INCIDENT', incidentType });
    },
    [sendMessage]
  );

  const devTriggerRoulette = useCallback(() => {
    sendMessage({ type: 'DEV_TRIGGER_ROULETTE' });
  }, [sendMessage]);

  const devSetIntegrity = useCallback(
    (integrity: number) => {
      sendMessage({ type: 'DEV_SET_INTEGRITY', integrity });
    },
    [sendMessage]
  );

  const devForceOverdrive = useCallback(() => {
    sendMessage({ type: 'DEV_FORCE_OVERDRIVE' });
  }, [sendMessage]);

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
    setSpinEvent(null);
    sendMessage({ type: 'RESTART_MATCH' });
  }, [sendMessage]);

  const returnToLobby = useCallback(() => {
    setSpinEvent(null);
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
    resolveIncident,
    dismissRoulette,
    devTriggerIncident,
    devTriggerRoulette,
    devSetIntegrity,
    devForceOverdrive,
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
