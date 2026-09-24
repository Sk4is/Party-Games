import { useState, useEffect, useRef, useCallback } from 'react';
import {
  BombaRoomState,
  LPRRoomState,
  PartyClientMessage,
  PartyServerMessage,
  BoardCursor,
} from '../types/multiplayer';
import { GameConfig, LaPeorRespuestaConfig } from '../types';
import {
  createOnlineRoom,
  validateJoinOnlineRoom,
  SharedRoomSummary,
} from '../services/multiplayerRoomService';
import { sessionRecovery } from '../services/sessionRecovery';
import { createConnectionResilience } from '../utils/connectionResilience';

export type SocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface FeedbackEvent {
  id: string;
  type: 'success' | 'error';
  message: string;
}

export interface AlphabetRewardEvent {
  id: string;
  playerId: string;
  playerName: string;
  gainedLife: boolean;
}

export interface ActiveTypingState {
  playerId: string;
  text: string;
  turnId?: string;
  roundNumber?: number;
}

export interface UsePartySocketOptions {
  id?: string;
  name?: string;
  avatar?: string;
  color?: string;
  player?: {
    id: string;
    name: string;
    avatar: string;
    color: string;
  };
  gameType?: 'la-bomba' | 'la-peor-respuesta';
  onWrongGame?: (targetGame: string, roomCode: string) => void;
}

export function usePartySocket(options: UsePartySocketOptions) {
  const currentUser = options.player || {
    id: options.id || '',
    name: options.name || 'Jugador',
    avatar: options.avatar || '🦊',
    color: options.color || '#f59e0b',
  };
  const targetGameType = options.gameType;
  const onWrongGame = options.onWrongGame;

  const [status, setStatus] = useState<SocketStatus>('disconnected');
  const [bombaState, setBombaState] = useState<BombaRoomState | null>(null);
  const [lprState, setLprState] = useState<LPRRoomState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; noticeType?: string } | null>(null);
  const [activeTyping, setActiveTyping] = useState<ActiveTypingState | null>(null);
  const [feedback, setFeedback] = useState<FeedbackEvent | null>(null);
  const [alphabetReward, setAlphabetReward] = useState<AlphabetRewardEvent | null>(null);
  const [otherCursors, setOtherCursors] = useState<Record<string, BoardCursor>>({});
  const [isJoiningOrCreating, setIsJoiningOrCreating] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const messageQueueRef = useRef<PartyClientMessage[]>([]);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isManuallyClosedRef = useRef<boolean>(false);
  const lastActivityRef = useRef<number>(Date.now());
  const lastActiveRoomRef = useRef<{ code: string; gameType: string } | null>(null);

  const connect = useCallback(() => {
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    setStatus('connecting');
    isManuallyClosedRef.current = false;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/party`;

    try {
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setStatus('connected');
        setErrorMessage(null);

        // Flush any queued messages
        while (messageQueueRef.current.length > 0) {
          const queued = messageQueueRef.current.shift();
          if (queued && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(queued));
          }
        }

        // Start ping heartbeat
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'ping' }));
          }
        }, 20000);

        // Auto re-join room if reconnected or restoring active session
        const activeSession = sessionRecovery.getActiveSession();
        const roomToJoin =
          lastActiveRoomRef.current ||
          (activeSession && (!targetGameType || activeSession.gameType === targetGameType)
            ? { code: activeSession.roomCode, gameType: activeSession.gameType }
            : null);

        if (roomToJoin) {
          lastActiveRoomRef.current = roomToJoin;
          socket.send(
            JSON.stringify({
              type: 'join_room',
              code: roomToJoin.code,
              player: currentUser,
            })
          );
        }
      };

      socket.onmessage = (event) => {
        lastActivityRef.current = Date.now();
        try {
          const msg: PartyServerMessage = JSON.parse(event.data);
          switch (msg.type) {
            case 'room_state': {
              setIsJoiningOrCreating(false);
              sessionRecovery.saveActiveSession({
                gameType: msg.state.gameType as any,
                roomCode: msg.state.code,
                playerId: currentUser.id,
              });

              if (msg.state.gameType === 'la-bomba') {
                const newBombaState = msg.state as BombaRoomState;
                setBombaState((prev) => {
                  if (
                    !prev ||
                    prev.activePlayerId !== newBombaState.activePlayerId ||
                    prev.currentTurnId !== newBombaState.currentTurnId ||
                    prev.roundNumber !== newBombaState.roundNumber
                  ) {
                    setActiveTyping(null);
                  }
                  return newBombaState;
                });
                lastActiveRoomRef.current = { code: msg.state.code, gameType: 'la-bomba' };
              } else if (msg.state.gameType === 'la-peor-respuesta') {
                setLprState(msg.state as LPRRoomState);
                lastActiveRoomRef.current = { code: msg.state.code, gameType: 'la-peor-respuesta' };
              }
              break;
            }

            case 'error': {
              setIsJoiningOrCreating(false);
              setErrorMessage(msg.message);
              // If room doesn't exist or expired, clear session
              if (
                msg.message.toLowerCase().includes('no se ha encontrado') ||
                msg.message.toLowerCase().includes('ha finalizado') ||
                msg.message.toLowerCase().includes('completa')
              ) {
                sessionRecovery.clearActiveSession();
                lastActiveRoomRef.current = null;
              }
              setTimeout(() => setErrorMessage(null), 5000);
              break;
            }

            case 'notification': {
              setNotification({ message: msg.message, noticeType: msg.noticeType });
              setTimeout(() => setNotification(null), 4000);
              break;
            }

            case 'bomba_typing_broadcast': {
              setActiveTyping({
                playerId: msg.playerId,
                text: msg.text,
                turnId: msg.turnId,
                roundNumber: msg.roundNumber,
              });
              break;
            }

            case 'bomba_feedback': {
              setFeedback({
                id: Math.random().toString(),
                type: msg.feedbackType,
                message: msg.message,
              });
              setTimeout(() => setFeedback(null), 3000);
              break;
            }

            case 'bomba_alphabet_reward': {
              setAlphabetReward({
                id: Math.random().toString(),
                playerId: msg.playerId,
                playerName: msg.playerName,
                gainedLife: msg.gainedLife,
              });
              setTimeout(() => setAlphabetReward(null), 4000);
              break;
            }

            case 'lpr_cursor_broadcast': {
              setOtherCursors((prev) => ({
                ...prev,
                [msg.cursor.playerId]: msg.cursor,
              }));
              break;
            }

            case 'pong':
              break;
          }
        } catch (err) {
          console.error('[usePartySocket] Error parsing message:', err);
        }
      };

      socket.onclose = () => {
        setStatus('disconnected');
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

        if (!isManuallyClosedRef.current) {
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 2000);
        }
      };

      socket.onerror = () => {
        setStatus('error');
      };
    } catch (e) {
      console.error('[usePartySocket] Socket init error:', e);
      setStatus('error');
    }
  }, [currentUser]);

  // Connect automatically on mount and recover on mobile foreground / tab switch
  useEffect(() => {
    connect();

    const cleanupResilience = createConnectionResilience({
      getSocket: () => wsRef.current,
      onReconnect: () => {
        isManuallyClosedRef.current = false;
        connect();
      },
      sendPing: () => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'ping' }));
        }
      },
      getLastActivityTime: () => lastActivityRef.current,
      logTag: '[PartySocket Client]',
    });

    return () => {
      cleanupResilience();
      isManuallyClosedRef.current = true;
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  const send = useCallback(
    (message: PartyClientMessage) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(message));
      } else {
        // Queue message and ensure connection is open
        messageQueueRef.current.push(message);
        connect();
      }
    },
    [connect]
  );

  // Action helpers
  const createRoom = useCallback(
    async (
      gameType: 'la-bomba' | 'la-peor-respuesta',
      config?: Partial<GameConfig | LaPeorRespuestaConfig>
    ) => {
      setErrorMessage(null);
      setIsJoiningOrCreating(true);

      try {
        // 1. Try REST creation first for immediate deterministic room registration
        const room = await createOnlineRoom(gameType, currentUser, config);
        // 2. Connect and join room via WebSocket
        send({
          type: 'join_room',
          code: room.roomCode,
          player: currentUser,
        });
      } catch (err: any) {
        console.warn('[usePartySocket] REST create failed, falling back to WS create:', err);
        // Fallback directly through WebSocket
        send({
          type: 'create_room',
          gameType,
          player: currentUser,
          config,
        });
      }
    },
    [currentUser, send]
  );

  const joinRoom = useCallback(
    async (code: string) => {
      const cleanCode = code.trim().toUpperCase();
      if (!cleanCode) {
        setErrorMessage('INTRODUCE UN CÓDIGO DE SALA');
        return;
      }

      setErrorMessage(null);
      setIsJoiningOrCreating(true);

      try {
        // Validate with server first
        const validation = await validateJoinOnlineRoom(cleanCode, targetGameType, currentUser);
        if (!validation.valid) {
          setIsJoiningOrCreating(false);
          if (validation.wrongGame && validation.actualGameType && onWrongGame) {
            onWrongGame(validation.actualGameType, cleanCode);
            return;
          }
          setErrorMessage(validation.message || 'NO SE HA PODIDO UNIR A LA SALA');
          return;
        }

        // Room is valid, join via WebSocket
        send({
          type: 'join_room',
          code: cleanCode,
          player: currentUser,
        });
      } catch (err: any) {
        console.warn('[usePartySocket] Validation error, trying direct WS join:', err);
        send({
          type: 'join_room',
          code: cleanCode,
          player: currentUser,
        });
      }
    },
    [currentUser, send, targetGameType, onWrongGame]
  );

  const updateConfig = useCallback(
    (config: Partial<GameConfig | LaPeorRespuestaConfig>) => {
      send({ type: 'update_config', config });
    },
    [send]
  );

  const startGame = useCallback(() => {
    send({ type: 'start_game' });
  }, [send]);

  const leaveRoom = useCallback(() => {
    isManuallyClosedRef.current = false;
    lastActiveRoomRef.current = null;
    sessionRecovery.clearActiveSession();
    send({ type: 'leave_room' });
    setBombaState(null);
    setLprState(null);
    setErrorMessage(null);
  }, [send]);

  // La Bomba Actions
  const bombaTyping = useCallback(
    (text: string, turnId?: string, roundNumber?: number) => {
      send({
        type: 'bomba_typing',
        text,
        turnId,
        roundNumber,
        playerId: currentUser.id,
      });
    },
    [send, currentUser.id]
  );

  const bombaSubmitWord = useCallback(
    (
      word: string,
      submissionId?: string,
      turnId?: string,
      roundNumber?: number,
      challengeId?: string
    ) => {
      send({
        type: 'bomba_submit_word',
        word,
        submissionId: submissionId || `sub-${currentUser.id}-${Date.now()}`,
        turnId,
        roundNumber,
        playerId: currentUser.id,
        challengeId,
      });
    },
    [send, currentUser.id]
  );

  const bombaDismissExplosion = useCallback(() => {
    send({ type: 'bomba_dismiss_explosion' });
  }, [send]);

  const bombaPlayAgain = useCallback(() => {
    send({ type: 'bomba_play_again' });
  }, [send]);

  // La Peor Respuesta Actions
  const lprSubmitAnswer = useCallback(
    (text: string) => {
      const answer = typeof text === 'string' ? text.trim() : '';
      if (answer.length === 0 || answer.length > 60) return;
      send({ type: 'lpr_submit_answer', text: answer });
    },
    [send]
  );

  const lprRevealCard = useCallback(
    (cardId: string) => {
      send({ type: 'lpr_reveal_card', cardId });
    },
    [send]
  );

  const lprRevealAll = useCallback(() => {
    send({ type: 'lpr_reveal_all' });
  }, [send]);

  const lprProceedVoting = useCallback(() => {
    send({ type: 'lpr_proceed_voting' });
  }, [send]);

  const lprSubmitVote = useCallback(
    (cardId: string) => {
      send({ type: 'lpr_submit_vote', cardId });
    },
    [send]
  );

  const lprCursorMove = useCallback(
    (x: number, y: number) => {
      send({ type: 'lpr_cursor_move', x, y });
    },
    [send]
  );

  const lprNextRound = useCallback(() => {
    send({ type: 'lpr_next_round' });
  }, [send]);

  const lprPlayAgain = useCallback(() => {
    send({ type: 'lpr_play_again' });
  }, [send]);

  return {
    status,
    connected: status === 'connected',
    connecting: status === 'connecting' || isJoiningOrCreating,
    isJoiningOrCreating,
    connect,
    bombaState,
    lprState,
    errorMessage,
    setErrorMessage,
    clearError: () => setErrorMessage(null),
    notification,
    activeTyping,
    feedback,
    serverFeedback: feedback,
    alphabetReward,
    otherCursors,
    createRoom,
    joinRoom,
    updateConfig,
    startGame,
    bombaStartGame: startGame,
    lprStartGame: startGame,
    leaveRoom,
    bombaTyping,
    bombaSubmitWord,
    bombaDismissExplosion,
    bombaPlayAgain,
    lprSubmitAnswer,
    lprRevealCard,
    lprRevealAll,
    lprProceedVoting,
    lprSubmitVote,
    lprCursorMove,
    lprNextRound,
    lprPlayAgain,
  };
}

