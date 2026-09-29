import { useState, useEffect, useRef, useCallback } from 'react';
import {
  CantinaRoomState,
  CantinaConfig,
  CantinaServerMessage,
  CantinaClientMessage,
  HandInteractionType,
  TableRank,
  Card,
  DealCardsEventData,
  RouletteSpinEventData,
} from '../types/cantina';
import {
  createOnlineRoom,
  validateJoinOnlineRoom,
  PlayerProfile,
} from '../services/multiplayerRoomService';
import { sessionRecovery } from '../services/sessionRecovery';
import { getGameWsUrl } from '../config/network';
import { backendHealth } from '../services/backendHealth';
import { safeCloseWebSocket, safeSendWebSocket } from '../utils/safeWebSocket';

export type CantinaConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'failed';

export interface CardPlayedEventData {
  playerId: string;
  playerName: string;
  cardsCount: number;
  playId: string;
  claimedRank: TableRank;
  cards?: Card[];
}

interface UseCantinaSocketOptions {
  player: PlayerProfile;
  initialRoomCode?: string;
  enabled?: boolean;
  onWrongGame?: (actualGameType: any, roomCode: string) => void;
  onCardPlayedEvent?: (event: CardPlayedEventData) => void;
  onDealCardsEvent?: (round: number, data?: DealCardsEventData) => void;
}

function getInitialCantinaRoom(initialRoomCode?: string): { code: string } | null {
  if (initialRoomCode && initialRoomCode.trim()) {
    return { code: initialRoomCode.trim().toUpperCase() };
  }
  const saved = sessionRecovery.getActiveSession();
  if (
    saved &&
    ((saved.gameType as string) === 'la_cantina_del_farol' ||
      (saved.gameType as string) === 'la-cantina-del-farol') &&
    saved.roomCode
  ) {
    return { code: saved.roomCode.trim().toUpperCase() };
  }
  return null;
}

export function useCantinaSocket({
  player,
  initialRoomCode,
  enabled = true,
  onWrongGame,
  onCardPlayedEvent,
  onDealCardsEvent,
}: UseCantinaSocketOptions) {
  const [connectionStatus, setConnectionStatus] = useState<CantinaConnectionStatus>('idle');
  const [roomState, setRoomState] = useState<CantinaRoomState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ text: string; variant?: string } | null>(null);
  const [remoteInteractions, setRemoteInteractions] = useState<
    Record<
      string,
      {
        interaction: HandInteractionType;
        hoveredIndex?: number;
        hoveredCardId?: string | null;
        selectedCardIds?: string[];
      }
    >
  >({});
  const [cardPlayedEvent, setCardPlayedEvent] = useState<CardPlayedEventData | null>(null);
  const [dealCardsEvent, setDealCardsEvent] = useState<DealCardsEventData | null>(null);
  const [rouletteSpinEvent, setRouletteSpinEvent] = useState<RouletteSpinEventData | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const messageQueueRef = useRef<CantinaClientMessage[]>([]);
  const reconnectAttemptsRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isManuallyClosedRef = useRef<boolean>(false);
  const isCreatingOrJoiningRef = useRef<boolean>(false);
  const lastActiveRoomRef = useRef<{ code: string } | null>(getInitialCantinaRoom(initialRoomCode));

  const playerRef = useRef(player);
  playerRef.current = player;

  const onWrongGameRef = useRef(onWrongGame);
  onWrongGameRef.current = onWrongGame;

  const onCardPlayedEventRef = useRef(onCardPlayedEvent);
  onCardPlayedEventRef.current = onCardPlayedEvent;

  const onDealCardsEventRef = useRef(onDealCardsEvent);
  onDealCardsEventRef.current = onDealCardsEvent;

  const lastSentInteractionRef = useRef<{
    interaction: string;
    hoveredIndex?: number;
    hoveredCardId?: string | null;
    selectedKey?: string;
  }>({
    interaction: '',
  });

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

  const sendMessage = useCallback((msg: CantinaClientMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    } else {
      messageQueueRef.current.push(msg);
    }
  }, []);

  const sendHandInteraction = useCallback(
    (
      interaction: HandInteractionType,
      hoveredIndex?: number,
      hoveredCardId?: string | null,
      selectedCardIds?: string[]
    ) => {
      const selectedKey = Array.isArray(selectedCardIds)
        ? selectedCardIds.join(',')
        : '';
      // Throttle: only send when state, index, cardId, or selection changes
      if (
        lastSentInteractionRef.current.interaction === interaction &&
        lastSentInteractionRef.current.hoveredIndex === hoveredIndex &&
        lastSentInteractionRef.current.hoveredCardId === hoveredCardId &&
        lastSentInteractionRef.current.selectedKey === selectedKey
      ) {
        return;
      }
      lastSentInteractionRef.current = {
        interaction,
        hoveredIndex,
        hoveredCardId,
        selectedKey,
      };
      sendMessage({
        type: 'HAND_INTERACTION',
        interaction,
        hoveredIndex,
        hoveredCardId,
        selectedCardIds,
      });
    },
    [sendMessage]
  );

  const connectToRoom = useCallback((roomCode: string) => {
    if (!roomCode) return;
    clearReconnectTimer();
    clearPingTimer();

    if (wsRef.current) {
      const prev = wsRef.current;
      wsRef.current = null;
      safeCloseWebSocket(prev, 'Reconnecting to Cantina room');
    }

    setConnectionStatus('connecting');
    setErrorMessage(null);
    isManuallyClosedRef.current = false;

    const wsUrl = getGameWsUrl('/ws/cantina');
    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;
    } catch (err) {
      console.warn('[useCantinaSocket] Failed to instantiate WebSocket:', err);
      setConnectionStatus('disconnected');
      return;
    }

    ws.onopen = () => {
      if (wsRef.current !== ws) return;
      setConnectionStatus('connected');
      reconnectAttemptsRef.current = 0;

      // Join room message
      const joinMsg: CantinaClientMessage = {
        type: 'JOIN_ROOM',
        code: roomCode.toUpperCase().trim(),
        player: {
          id: playerRef.current.id,
          name: playerRef.current.name,
          avatar: playerRef.current.avatar,
          color: playerRef.current.color,
        },
      };
      safeSendWebSocket(ws, joinMsg as unknown as Record<string, unknown>);

      // Flush queue
      while (messageQueueRef.current.length > 0) {
        const pending = messageQueueRef.current.shift();
        if (pending && ws.readyState === WebSocket.OPEN) {
          safeSendWebSocket(ws, pending as unknown as Record<string, unknown>);
        }
      }

      // Ping keepalive every 15 seconds
      pingIntervalRef.current = setInterval(() => {
        if (wsRef.current === ws && ws.readyState === WebSocket.OPEN) {
          safeSendWebSocket(ws, { type: 'PING' });
        }
      }, 15000);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data) as CantinaServerMessage;
        if (msg.type === 'ROOM_STATE') {
          setRoomState(msg.state);
          lastActiveRoomRef.current = { code: msg.state.code };

          sessionRecovery.saveActiveSession({
            gameType: 'la_cantina_del_farol',
            roomCode: msg.state.code,
            playerId: playerRef.current.id,
          });
        } else if (msg.type === 'PLAYER_HAND_INTERACTION') {
          setRemoteInteractions((prev) => ({
            ...prev,
            [msg.playerId]: {
              interaction: msg.interaction,
              hoveredIndex: msg.hoveredIndex,
              hoveredCardId: msg.hoveredCardId,
              selectedCardIds:
                msg.selectedCardIds !== undefined
                  ? msg.selectedCardIds
                  : prev[msg.playerId]?.selectedCardIds,
            },
          }));
        } else if (msg.type === 'CARD_PLAYED_EVENT') {
          setCardPlayedEvent(msg);
          if (onCardPlayedEventRef.current) {
            onCardPlayedEventRef.current(msg);
          }
        } else if (msg.type === 'DEAL_CARDS_EVENT') {
          setDealCardsEvent({
            round: msg.round,
            roundStartEventId: msg.roundStartEventId,
            startingPlayerId: msg.startingPlayerId,
            startingPlayerName: msg.startingPlayerName,
            tableRank: msg.tableRank,
            cardsPerPlayer: msg.cardsPerPlayer,
          });
          if (onDealCardsEventRef.current) {
            onDealCardsEventRef.current(msg.round, {
              round: msg.round,
              roundStartEventId: msg.roundStartEventId,
              startingPlayerId: msg.startingPlayerId,
              startingPlayerName: msg.startingPlayerName,
              tableRank: msg.tableRank,
              cardsPerPlayer: msg.cardsPerPlayer,
            });
          }
        } else if (msg.type === 'ROULETTE_SPIN_EVENT') {
          setRouletteSpinEvent({
            rouletteEventId: msg.rouletteEventId,
            playerId: msg.playerId,
            velocity: msg.velocity,
            angle: msg.angle,
            spinId: msg.spinId,
            settled: msg.settled,
          });
        } else if (msg.type === 'NOTIFICATION') {
          setNotification({ text: msg.text, variant: msg.variant });
        } else if (msg.type === 'ERROR') {
          setErrorMessage(msg.message);
        }
      } catch (err) {
        console.error('[useCantinaSocket] Error handling message:', err);
      }
    };

    ws.onerror = (err) => {
      console.warn('[useCantinaSocket] WebSocket error:', err);
    };

    ws.onclose = (event) => {
      clearPingTimer();
      if (isManuallyClosedRef.current) {
        setConnectionStatus('disconnected');
        return;
      }

      if (event.code === 4001 || event.code === 4004) {
        setConnectionStatus('failed');
        setErrorMessage('SALA NO ENCONTRADA O COMPLETA');
        return;
      }

      const attempts = reconnectAttemptsRef.current;
      if (attempts < 8 && lastActiveRoomRef.current?.code) {
        setConnectionStatus('reconnecting');
        const delay = Math.min(1000 * Math.pow(1.5, attempts), 8000);
        reconnectAttemptsRef.current += 1;
        reconnectTimeoutRef.current = setTimeout(() => {
          if (lastActiveRoomRef.current?.code) {
            connectToRoom(lastActiveRoomRef.current.code);
          }
        }, delay);
      } else {
        setConnectionStatus('disconnected');
      }
    };
  }, [clearReconnectTimer, clearPingTimer]);

  const createRoom = useCallback(
    async (config?: Partial<CantinaConfig>) => {
      try {
        isCreatingOrJoiningRef.current = true;
        setConnectionStatus('connecting');
        setErrorMessage(null);

        const summary = await createOnlineRoom(
          'la_cantina_del_farol',
          {
            id: playerRef.current.id,
            name: playerRef.current.name,
            avatar: playerRef.current.avatar,
            color: playerRef.current.color,
          },
          config
        );

        lastActiveRoomRef.current = { code: summary.code };
        connectToRoom(summary.code);
        return summary;
      } catch (err: any) {
        console.error('[useCantinaSocket] Error creating room:', err);
        setConnectionStatus('failed');
        setErrorMessage(err.message || 'Error al crear la sala');
        throw err;
      } finally {
        isCreatingOrJoiningRef.current = false;
      }
    },
    [connectToRoom]
  );

  const joinRoom = useCallback(
    async (codeToJoin: string) => {
      try {
        isCreatingOrJoiningRef.current = true;
        setConnectionStatus('connecting');
        setErrorMessage(null);

        await backendHealth.ensureBackendAvailable();

        const validation = await validateJoinOnlineRoom(
          codeToJoin,
          'la_cantina_del_farol',
          playerRef.current
        );

        if (!validation.valid) {
          if (validation.wrongGame && validation.actualGameType && onWrongGameRef.current) {
            onWrongGameRef.current(validation.actualGameType, codeToJoin);
            return null;
          }
          setErrorMessage(validation.message || 'Código de sala no válido');
          setConnectionStatus('failed');
          return null;
        }

        const roomCode = validation.room?.code || codeToJoin.toUpperCase().trim();
        lastActiveRoomRef.current = { code: roomCode };
        connectToRoom(roomCode);
        return validation.room;
      } catch (err: any) {
        console.error('[useCantinaSocket] Error joining room:', err);
        setConnectionStatus('failed');
        setErrorMessage(err.message || 'Error al unirse a la sala');
        throw err;
      } finally {
        isCreatingOrJoiningRef.current = false;
      }
    },
    [connectToRoom]
  );

  const updateConfig = useCallback(
    (config: Partial<CantinaConfig>) => {
      sendMessage({ type: 'UPDATE_CONFIG', config });
    },
    [sendMessage]
  );

  const startGame = useCallback(() => {
    sendMessage({ type: 'START_GAME' });
  }, [sendMessage]);

  const playCards = useCallback(
    (cardIds: string[], playId?: string) => {
      sendMessage({ type: 'PLAY_CARDS', cardIds, playId });
    },
    [sendMessage]
  );

  const challengeBluff = useCallback(() => {
    sendMessage({ type: 'CHALLENGE_BLUFF' });
  }, [sendMessage]);

  const pullTrigger = useCallback(
    (rouletteEventId: string) => {
      sendMessage({ type: 'PULL_TRIGGER', rouletteEventId });
    },
    [sendMessage]
  );

  const sendRouletteSpin = useCallback(
    (
      rouletteEventId: string,
      velocity: number,
      angle: number,
      spinId: string,
      settled?: boolean
    ) => {
      sendMessage({
        type: 'ROULETTE_SPIN',
        rouletteEventId,
        velocity,
        angle,
        spinId,
        settled,
      });
    },
    [sendMessage]
  );

  const triggerRoulette = useCallback(() => {
    sendMessage({ type: 'TRIGGER_ROULETTE' });
  }, [sendMessage]);

  const nextRound = useCallback(() => {
    sendMessage({ type: 'NEXT_ROUND' });
  }, [sendMessage]);

  const requestRematch = useCallback(() => {
    sendMessage({ type: 'REQUEST_REMATCH' });
  }, [sendMessage]);

  const restartMatch = useCallback(() => {
    sendMessage({ type: 'RESTART_MATCH' });
  }, [sendMessage]);

  const returnToLobby = useCallback(() => {
    sendMessage({ type: 'RETURN_TO_LOBBY' });
  }, [sendMessage]);

  // Cadena Mode Actions:
  const cadenaPlayChain = useCallback(
    (cardIds: string[], playId?: string) => {
      sendMessage({ type: 'CADENA_PLAY_CHAIN', cardIds, playId });
    },
    [sendMessage]
  );

  const cadenaPlaySpecial = useCallback(
    (cardId: string, targetPlayerId?: string, playId?: string) => {
      sendMessage({ type: 'CADENA_PLAY_SPECIAL', cardId, targetPlayerId, playId });
    },
    [sendMessage]
  );

  const cadenaDrawCard = useCallback(() => {
    sendMessage({ type: 'CADENA_DRAW_CARD' });
  }, [sendMessage]);

  const cadenaEndTurn = useCallback(() => {
    sendMessage({ type: 'CADENA_END_TURN' });
  }, [sendMessage]);

  const cadenaStealCard = useCallback(
    (targetPlayerId: string, slotIndex: number) => {
      sendMessage({ type: 'CADENA_STEAL_CARD', targetPlayerId, slotIndex });
    },
    [sendMessage]
  );

  const cadenaSelectBombTarget = useCallback(
    (targetPlayerId: string) => {
      sendMessage({ type: 'CADENA_SELECT_BOMB_TARGET', targetPlayerId });
    },
    [sendMessage]
  );

  const cadenaSelectRevolverTarget = useCallback(
    (targetPlayerId: string) => {
      sendMessage({ type: 'CADENA_SELECT_REVOLVER_TARGET', targetPlayerId });
    },
    [sendMessage]
  );

  const cadenaSpinRevolver = useCallback(
    (
      eventId: string,
      velocity: number,
      angle: number,
      spinId: string,
      settled?: boolean
    ) => {
      sendMessage({
        type: 'CADENA_SPIN_REVOLVER',
        eventId,
        velocity,
        angle,
        spinId,
        settled,
      });
    },
    [sendMessage]
  );

  const cadenaPullRevolver = useCallback(
    (eventId?: string) => {
      sendMessage({ type: 'CADENA_PULL_REVOLVER', eventId });
    },
    [sendMessage]
  );

  const cadenaDeclareUltima = useCallback(() => {
    sendMessage({ type: 'CADENA_DECLARE_ULTIMA' });
  }, [sendMessage]);

  const cadenaCatchUltima = useCallback(() => {
    sendMessage({ type: 'CADENA_CATCH_ULTIMA' });
  }, [sendMessage]);

  const leaveRoom = useCallback(() => {
    isManuallyClosedRef.current = true;
    clearReconnectTimer();
    clearPingTimer();
    sessionRecovery.clearActiveSession();

    if (wsRef.current) {
      const prev = wsRef.current;
      wsRef.current = null;
      if (prev.readyState === WebSocket.OPEN) {
        safeSendWebSocket(prev, { type: 'LEAVE_ROOM' });
      }
      safeCloseWebSocket(prev, 'User left room');
    }

    setRoomState(null);
    setConnectionStatus('disconnected');
    lastActiveRoomRef.current = null;
  }, [clearReconnectTimer, clearPingTimer]);

  useEffect(() => {
    if (!enabled) return;

    const initial = getInitialCantinaRoom(initialRoomCode);
    if (initial && initial.code && !wsRef.current && !isCreatingOrJoiningRef.current) {
      connectToRoom(initial.code);
    }

    return () => {
      clearReconnectTimer();
      clearPingTimer();
      if (wsRef.current) {
        const prev = wsRef.current;
        wsRef.current = null;
        safeCloseWebSocket(prev, 'Component unmounted');
      }
    };
  }, [enabled, initialRoomCode, connectToRoom, clearReconnectTimer, clearPingTimer]);

  return {
    connectionStatus,
    roomState,
    errorMessage,
    notification,
    remoteInteractions,
    cardPlayedEvent,
    dealCardsEvent,
    rouletteSpinEvent,
    createRoom,
    joinRoom,
    updateConfig,
    startGame,
    playCards,
    challengeBluff,
    pullTrigger,
    sendRouletteSpin,
    triggerRoulette,
    nextRound,
    requestRematch,
    restartMatch,
    returnToLobby,
    leaveRoom,
    sendHandInteraction,
    cadenaPlayChain,
    cadenaPlaySpecial,
    cadenaDrawCard,
    cadenaEndTurn,
    cadenaStealCard,
    cadenaSelectBombTarget,
    cadenaSelectRevolverTarget,
    cadenaSpinRevolver,
    cadenaPullRevolver,
    cadenaDeclareUltima,
    cadenaCatchUltima,
  };
}
