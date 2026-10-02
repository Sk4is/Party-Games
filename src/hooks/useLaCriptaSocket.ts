import { useState, useEffect, useRef, useCallback } from 'react';
import {
  CriptaCharacterId,
  CriptaClientMessage,
  CriptaDungeonId,
  CriptaExpeditionState,
  CriptaPlayerRoundActionType,
  CriptaRemoteCursor,
  CriptaSceneId,
  CriptaServerMessage,
  CriptaWeaponRuneId,
} from '../types/laCripta';
import {
  ALL_CRIPTA_CHARACTER_IDS,
  normalizeCriptaCharacterId,
  LA_CRIPTA_SCHEMA_VERSION,
} from '../data/la-cripta/criptaCatalog';

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
import { laCriptaAudio } from '../utils/laCriptaAudio';

export type LaCriptaConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'failed';

const MAX_RECONNECT_ATTEMPTS = 8;

interface UseLaCriptaSocketOptions {
  player: PlayerProfile;
  initialRoomCode?: string;
  enabled?: boolean;
  onWrongGame?: (actualGameType: any, roomCode: string) => void;
}

function getInitialCriptaRoom(initialRoomCode?: string): { code: string } | null {
  if (initialRoomCode && typeof initialRoomCode === 'string' && initialRoomCode.trim()) {
    return { code: initialRoomCode.trim().toUpperCase() };
  }
  const saved = sessionRecovery.getActiveSession();
  if (
    saved &&
    saved.gameType === 'la-cripta' &&
    typeof saved.roomCode === 'string' &&
    saved.roomCode.trim()
  ) {
    return { code: saved.roomCode.trim().toUpperCase() };
  }
  return null;
}

export function useLaCriptaSocket({
  player,
  initialRoomCode,
  enabled = true,
  onWrongGame,
}: UseLaCriptaSocketOptions) {
  const [connectionStatus, setConnectionStatus] = useState<LaCriptaConnectionStatus>('idle');
  const [expeditionState, setExpeditionState] = useState<CriptaExpeditionState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    text: string;
    variant?: 'info' | 'warning' | 'danger' | 'success';
  } | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const lifecycleStateRef = useRef<ExplicitSocketLifecycleState>('IDLE');
  const connectAbortRef = useRef<AbortController | null>(null);
  const connectAttemptIdRef = useRef<number>(0);
  const connectedRoomCodeRef = useRef<string | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const messageQueueRef = useRef<CriptaClientMessage[]>([]);
  const cursorListenersRef = useRef<Set<(cursor: CriptaRemoteCursor) => void>>(new Set());
  const lastCursorSentAtRef = useRef<number>(0);
  const latestStateVersionRef = useRef<number>(0);
  const lockedExpeditionIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log(
        `[LaCripta] Character contract - client characters: ${ALL_CRIPTA_CHARACTER_IDS.length} (schema v${LA_CRIPTA_SCHEMA_VERSION})`
      );
    }
  }, []);

  const reconnectAttemptsRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isManuallyClosedRef = useRef<boolean>(false);
  const lastActiveRoomRef = useRef<{ code: string } | null>(
    getInitialCriptaRoom(initialRoomCode)
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

  const sendMessage = useCallback((msg: CriptaClientMessage) => {
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
      const msg = JSON.parse(event.data) as CriptaServerMessage;
      if (msg.type === 'EXPEDITION_STATE') {
        if (
          typeof msg.state.stateVersion === 'number' &&
          msg.state.stateVersion < latestStateVersionRef.current
        ) {
          return;
        }
        latestStateVersionRef.current = msg.state.stateVersion || 0;
        setExpeditionState(msg.state);
        const authoritativeCode = String(msg.state.code || msg.state.roomCode || '')
          .trim()
          .toUpperCase();
        if (authoritativeCode) {
          lastActiveRoomRef.current = { code: authoritativeCode };
          connectedRoomCodeRef.current = authoritativeCode;
          sessionRecovery.saveActiveSession({
            gameType: 'la-cripta',
            roomCode: authoritativeCode,
            playerId: playerRef.current.id,
          });
        }
      } else if (msg.type === 'DOOR_LOCKED') {
        latestStateVersionRef.current = Math.max(
          latestStateVersionRef.current,
          msg.state.stateVersion || 0
        );
        setExpeditionState(msg.state);
        if (!lockedExpeditionIdsRef.current.has(msg.expeditionId)) {
          lockedExpeditionIdsRef.current.add(msg.expeditionId);
          laCriptaAudio.playDoorOpeningSequence();
        }
      } else if (msg.type === 'CURSOR_UPDATE') {
        const cursorPacket: CriptaRemoteCursor = {
          playerId: msg.playerId,
          name: msg.name,
          color: msg.color,
          xNormalized: msg.xNormalized,
          yNormalized: msg.yNormalized,
          sceneId: msg.sceneId,
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
      console.error('[useLaCriptaSocket] Error parsing message:', err);
    }
  }, []);

  const connectToRoom = useCallback(
    async (roomCode: string, isReconnectAttempt = false): Promise<void> => {
      if (!roomCode || typeof roomCode !== 'string') return;
      const cleanCode = roomCode.trim().toUpperCase();
      if (!cleanCode) return;

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
      abortInFlightConnection('Reconnecting to La Cripta room');

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

      const wsUrl = getGameWsUrl('/ws/la-cripta', 'VITE_LA_CRIPTA_WS_URL');

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
          onPostOpenError: () => {},
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
            color: playerRef.current.color,
          },
        } satisfies CriptaClientMessage);

        while (messageQueueRef.current.length > 0) {
          const queued = messageQueueRef.current.shift();
          if (queued) {
            safeSendWebSocket(ws, queued as unknown as Record<string, unknown>);
          }
        }

        clearPingTimer();
        pingIntervalRef.current = setInterval(() => {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            safeSendWebSocket(wsRef.current, { type: 'PING' } satisfies CriptaClientMessage);
          }
        }, 22000);
      } catch (err: any) {
        if (err?.name === 'AbortError' || connectAttemptIdRef.current !== attemptId) {
          return;
        }
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

  const createRoom = useCallback(async () => {
    setErrorMessage(null);
    updateLifecycleState('CONNECTING');
    try {
      const roomSummary = await createOnlineRoom('la-cripta', playerRef.current);
      const resolvedCode = String(roomSummary?.code || roomSummary?.roomCode || '')
        .trim()
        .toUpperCase();
      if (!resolvedCode) {
        throw new Error('EL SERVIDOR NO HA DEVUELTO UN CÓDIGO DE SALA VÁLIDO');
      }
      sessionRecovery.saveActiveSession({
        gameType: 'la-cripta',
        roomCode: resolvedCode,
        playerId: playerRef.current.id,
      });
      await connectToRoom(resolvedCode, false);
      return resolvedCode;
    } catch (err: any) {
      updateLifecycleState('IDLE');
      const msg = err?.message || 'NO SE HA PODIDO CREAR LA EXPEDICIÓN';
      setErrorMessage(msg);
      throw err;
    }
  }, [connectToRoom, updateLifecycleState]);

  const joinRoom = useCallback(
    async (code: string) => {
      const cleanCode = String(code || '').trim().toUpperCase();
      if (!cleanCode) {
        setErrorMessage('INTRODUCE UN CÓDIGO DE SALA');
        return;
      }

      setErrorMessage(null);
      updateLifecycleState('CONNECTING');
      try {
        const validation = await validateJoinOnlineRoom(
          cleanCode,
          'la-cripta',
          playerRef.current
        );
        if (!validation.valid) {
          updateLifecycleState('IDLE');
          if (validation.wrongGame && validation.actualGameType && onWrongGameRef.current) {
            onWrongGameRef.current(validation.actualGameType, cleanCode);
            return;
          }
          const msg = validation.message || 'NO SE HA ENCONTRADO ESA EXPEDICIÓN';
          setErrorMessage(msg);
          throw new Error(msg);
        }

        sessionRecovery.saveActiveSession({
          gameType: 'la-cripta',
          roomCode: cleanCode,
          playerId: playerRef.current.id,
        });
        await connectToRoom(cleanCode, false);
      } catch (err: any) {
        updateLifecycleState('IDLE');
        const msg = err?.message || 'NO SE HA PODIDO ENTRAR EN LA EXPEDICIÓN';
        setErrorMessage(msg);
        throw err;
      }
    },
    [connectToRoom, updateLifecycleState]
  );

  const leaveRoom = useCallback(() => {
    isManuallyClosedRef.current = true;
    clearReconnectTimer();
    clearPingTimer();
    sessionRecovery.clearActiveSession();
    lastActiveRoomRef.current = null;
    connectedRoomCodeRef.current = null;
    latestStateVersionRef.current = 0;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      safeSendWebSocket(wsRef.current, { type: 'LEAVE_ROOM' } satisfies CriptaClientMessage);
    }
    abortInFlightConnection('User left La Cripta room');
    setExpeditionState(null);
    updateLifecycleState('IDLE');
  }, [abortInFlightConnection, clearPingTimer, clearReconnectTimer, updateLifecycleState]);

  useEffect(() => {
    if (!enabled) return;
    const initial = lastActiveRoomRef.current;
    if (initial?.code && !wsRef.current) {
      void validateJoinOnlineRoom(initial.code, 'la-cripta', playerRef.current).then((res) => {
        if (res.valid) {
          void connectToRoom(initial.code, false);
        } else {
          sessionRecovery.clearActiveSession();
          lastActiveRoomRef.current = null;
        }
      });
    }
  }, [connectToRoom, enabled]);

  useEffect(() => {
    const cleanupResilience = createConnectionResilience({
      getSocket: () => wsRef.current,
      getLastActivityTime: () => lastActivityRef.current,
      sendPing: () => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          safeSendWebSocket(wsRef.current, { type: 'PING' } satisfies CriptaClientMessage);
        }
      },
      onReconnect: () => {
        if (lastActiveRoomRef.current?.code && !isManuallyClosedRef.current) {
          reconnectAttemptsRef.current = 0;
          void connectToRoom(lastActiveRoomRef.current.code, true);
        }
      },
      logTag: '[LaCriptaResilience]',
    });
    return cleanupResilience;
  }, [connectToRoom]);

  useEffect(() => {
    return () => {
      isManuallyClosedRef.current = true;
      clearReconnectTimer();
      clearPingTimer();
      abortInFlightConnection('Component unmounted');
    };
  }, [abortInFlightConnection, clearPingTimer, clearReconnectTimer]);

  const subscribeToCursors = useCallback((listener: (cursor: CriptaRemoteCursor) => void) => {
    cursorListenersRef.current.add(listener);
    return () => {
      cursorListenersRef.current.delete(listener);
    };
  }, []);

  const trailingCursorTimeoutRef = useRef<number | null>(null);
  const pendingCursorPayloadRef = useRef<{
    xNormalized: number;
    yNormalized: number;
    sceneId: CriptaSceneId;
  } | null>(null);

  const sendCursorMove = useCallback(
    (xNormalized: number, yNormalized: number, sceneId: CriptaSceneId) => {
      const clampedX = Math.max(0, Math.min(1, Number(xNormalized.toFixed(4))));
      const clampedY = Math.max(0, Math.min(1, Number(yNormalized.toFixed(4))));
      pendingCursorPayloadRef.current = {
        xNormalized: clampedX,
        yNormalized: clampedY,
        sceneId,
      };

      const now = performance.now();
      const elapsed = now - lastCursorSentAtRef.current;
      if (elapsed >= 16) {
        if (trailingCursorTimeoutRef.current !== null) {
          window.clearTimeout(trailingCursorTimeoutRef.current);
          trailingCursorTimeoutRef.current = null;
        }
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          lastCursorSentAtRef.current = now;
          safeSendWebSocket(wsRef.current, {
            type: 'CURSOR_MOVE',
            xNormalized: clampedX,
            yNormalized: clampedY,
            sceneId,
          } satisfies CriptaClientMessage);
        }
      } else if (trailingCursorTimeoutRef.current === null) {
        trailingCursorTimeoutRef.current = window.setTimeout(() => {
          trailingCursorTimeoutRef.current = null;
          const pending = pendingCursorPayloadRef.current;
          if (pending && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            lastCursorSentAtRef.current = performance.now();
            safeSendWebSocket(wsRef.current, {
              type: 'CURSOR_MOVE',
              xNormalized: pending.xNormalized,
              yNormalized: pending.yNormalized,
              sceneId: pending.sceneId,
            } satisfies CriptaClientMessage);
          }
        }, Math.max(4, Math.ceil(16 - elapsed)));
      }
    },
    []
  );

  const selectCharacter = useCallback(
    (characterId: CriptaCharacterId | null) => {
      const normalized = characterId ? normalizeCriptaCharacterId(characterId) : null;
      if (import.meta.env.DEV && normalized) {
        console.log(
          `[LaCripta] Character contract - selected: ${normalized.toUpperCase()} (raw input: ${characterId})`
        );
      }
      sendMessage({ type: 'SELECT_CHARACTER', characterId: normalized });
    },
    [sendMessage]
  );


  const setCursorColor = useCallback(
    (color: string) => {
      sendMessage({ type: 'SET_CURSOR_COLOR', color });
    },
    [sendMessage]
  );

  const startExpedition = useCallback(() => {
    sendMessage({ type: 'START_EXPEDITION' });
  }, [sendMessage]);

  const voteDoor = useCallback(
    (dungeonId: CriptaDungeonId) => {
      sendMessage({ type: 'VOTE_DOOR', dungeonId });
    },
    [sendMessage]
  );

  const voteFinalBossDoor = useCallback(() => {
    sendMessage({ type: 'VOTE_FINAL_BOSS_DOOR' });
  }, [sendMessage]);

  const retryDungeonInit = useCallback(() => {
    sendMessage({ type: 'RETRY_DUNGEON_INIT' });
  }, [sendMessage]);

  const sendCombatAction = useCallback(
    (action: 'ATTACK' | 'ABILITY' | 'DEFEND', targetEnemyId?: string) => {
      sendMessage({ type: 'ROOM_COMBAT_ACTION', action, targetEnemyId });
    },
    [sendMessage]
  );

  const sendLockRoundAction = useCallback(
    (
      actionOrPayload:
        | CriptaPlayerRoundActionType
        | 'USE_ITEM'
        | {
            actionType: CriptaPlayerRoundActionType;
            abilityId?: string;
            targetEnemyId?: string;
            targetPlayerId?: string;
            itemSlotIndex?: number;
          },
      targetEnemyId?: string,
      targetPlayerId?: string,
      abilityId?: string,
      itemSlotIndex?: number
    ) => {
      if (typeof actionOrPayload === 'object' && actionOrPayload !== null) {
        sendMessage({
          type: 'LOCK_ROUND_ACTION',
          actionType: actionOrPayload.actionType,
          abilityId: actionOrPayload.abilityId,
          targetEnemyId: actionOrPayload.targetEnemyId,
          targetPlayerId: actionOrPayload.targetPlayerId,
          itemSlotIndex: actionOrPayload.itemSlotIndex,
        });
      } else {
        sendMessage({
          type: 'LOCK_ROUND_ACTION',
          actionType: actionOrPayload as CriptaPlayerRoundActionType,
          abilityId,
          targetEnemyId,
          targetPlayerId,
          itemSlotIndex,
        });
      }
    },
    [sendMessage]
  );

  const sendUnlockRoundAction = useCallback(() => {
    sendMessage({ type: 'UNLOCK_ROUND_ACTION' });
  }, [sendMessage]);

  const sendUseInventoryItem = useCallback(
    (slotIndex: number, targetPlayerId?: string, targetEnemyId?: string) => {
      sendMessage({
        type: 'USE_INVENTORY_ITEM',
        slotIndex,
        targetPlayerId,
        targetEnemyId,
      });
    },
    [sendMessage]
  );

  const sendClaimGroundDrop = useCallback(
    (dropId: string) => {
      sendMessage({ type: 'CLAIM_GROUND_DROP', dropId });
    },
    [sendMessage]
  );

  const sendBuyShopSlot = useCallback(
    (slotId: string) => {
      sendMessage({ type: 'BUY_SHOP_SLOT', slotId });
    },
    [sendMessage]
  );

  const sendResolveInventoryFull = useCallback(
    (replaceSlotIndex: number | null) => {
      sendMessage({ type: 'RESOLVE_INVENTORY_FULL', replaceSlotIndex });
    },
    [sendMessage]
  );

  const sendReplaceInventoryItem = useCallback(
    (replaceSlotIndex: number) => {
      sendMessage({ type: 'RESOLVE_INVENTORY_FULL', replaceSlotIndex });
    },
    [sendMessage]
  );

  const sendDiscardOverflowItem = useCallback(() => {
    sendMessage({ type: 'RESOLVE_INVENTORY_FULL', replaceSlotIndex: null });
  }, [sendMessage]);

  const sendShopBuyItem = useCallback(
    (slotId: string) => {
      sendMessage({ type: 'BUY_SHOP_SLOT', slotId });
    },
    [sendMessage]
  );

  const sendShopBuyRelic = useCallback(
    (slotId?: string) => {
      const currentIdx = expeditionState?.currentRoomIndex ?? 0;
      const resolvedSlotId = slotId || `shop_${currentIdx}_slot_relic`;
      sendMessage({ type: 'BUY_SHOP_SLOT', slotId: resolvedSlotId });
    },
    [expeditionState?.currentRoomIndex, sendMessage]
  );

  const sendReviveAlly = useCallback(
    (targetPlayerId: string, method: 'GOLD' | 'BLOOD' | 'SHRINE') => {
      sendMessage({ type: 'ROOM_REVIVE_ALLY', targetPlayerId, method });
    },
    [sendMessage]
  );

  const sendRoomInteractOption = useCallback(
    (optionId: string) => {
      sendMessage({ type: 'ROOM_INTERACT_OPTION', optionId });
    },
    [sendMessage]
  );

  const sendRoomPuzzleInput = useCallback(
    (runeIndex: number) => {
      sendMessage({ type: 'ROOM_PUZZLE_INPUT', runeIndex });
    },
    [sendMessage]
  );

  const sendRoomDiscoverSecret = useCallback(() => {
    sendMessage({ type: 'ROOM_DISCOVER_SECRET' });
  }, [sendMessage]);

  const sendInteractRoomObject = useCallback(
    (objectId: string) => {
      sendMessage({ type: 'INTERACT_ROOM_OBJECT', objectId });
    },
    [sendMessage]
  );

  const sendUpgradeWeapon = useCallback(() => {
    sendMessage({ type: 'UPGRADE_WEAPON' });
  }, [sendMessage]);

  const sendEquipWeaponRune = useCallback(
    (runeId: CriptaWeaponRuneId | null) => {
      sendMessage({ type: 'EQUIP_WEAPON_RUNE', runeId });
    },
    [sendMessage]
  );

  const sendPassShopChoice = useCallback(() => {
    sendMessage({ type: 'PASS_SHOP_CHOICE' });
  }, [sendMessage]);

  const sendTradeItem = useCallback(
    (targetPlayerId: string, slotIndex: number) => {
      sendMessage({ type: 'TRADE_ITEM', targetPlayerId, slotIndex });
    },
    [sendMessage]
  );

  const sendTradeGold = useCallback(
    (targetPlayerId: string, amount: number) => {
      sendMessage({ type: 'TRADE_GOLD', targetPlayerId, amount });
    },
    [sendMessage]
  );

  const sendUpgradeAttribute = useCallback(
    (attribute: 'attack' | 'defense' | 'magic' | 'agility' | 'precision' | 'willpower' | 'health') => {
      sendMessage({ type: 'UPGRADE_ATTRIBUTE', attribute });
    },
    [sendMessage]
  );

  const sendRoomAdvance = useCallback(() => {
    sendMessage({ type: 'ROOM_ADVANCE' });
  }, [sendMessage]);

  const returnToLobby = useCallback(() => {
    sendMessage({ type: 'RETURN_TO_LOBBY' });
  }, [sendMessage]);

  return {
    connectionStatus,
    expeditionState,
    errorMessage,
    notification,
    subscribeToCursors,
    sendCursorMove,
    createRoom,
    joinRoom,
    leaveRoom,
    selectCharacter,
    setCursorColor,
    startExpedition,
    voteDoor,
    voteFinalBossDoor,
    retryDungeonInit,
    sendCombatAction,
    sendLockRoundAction,
    sendUnlockRoundAction,
    sendUseInventoryItem,
    sendClaimGroundDrop,
    sendBuyShopSlot,
    sendPassShopChoice,
    sendTradeItem,
    sendTradeGold,
    sendUpgradeAttribute,
    sendResolveInventoryFull,
    sendReplaceInventoryItem,
    sendDiscardOverflowItem,
    sendShopBuyItem,
    sendShopBuyRelic,
    sendReviveAlly,
    sendRoomInteractOption,
    sendRoomPuzzleInput,
    sendRoomDiscoverSecret,
    sendInteractRoomObject,
    sendUpgradeWeapon,
    sendEquipWeaponRune,
    sendRoomAdvance,
    returnToLobby,
  };
}
