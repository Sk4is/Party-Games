import { useState, useEffect, useRef, useCallback } from 'react';
import {
  EntreToposRoomState,
  EntreToposConfig,
  EntreToposServerMessage,
  EntreToposClientMessage,
  MoleCustomization,
} from '../types/entreTopos';
import {
  createOnlineRoom,
  validateJoinOnlineRoom,
  PlayerProfile,
} from '../services/multiplayerRoomService';
import { sessionRecovery } from '../services/sessionRecovery';
import { audio } from '../utils/audio';
import { getGameWsUrl } from '../config/network';
import { backendHealth } from '../services/backendHealth';
import { DEFAULT_MOLE_CUSTOMIZATION } from '../components/entre-topos/MolePortrait';

export type EntreToposConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'failed';

interface UseEntreToposSocketOptions {
  player: PlayerProfile & { moleCustomization?: MoleCustomization };
  initialRoomCode?: string;
  enabled?: boolean;
  onWrongGame?: (actualGameType: any, roomCode: string) => void;
}

function getInitialEntreToposRoom(initialRoomCode?: string): { code: string } | null {
  if (initialRoomCode && initialRoomCode.trim()) {
    return { code: initialRoomCode.trim().toUpperCase() };
  }
  const saved = sessionRecovery.getActiveSession();
  if (saved && (saved.gameType as string) === 'entre-topos' && saved.roomCode) {
    return { code: saved.roomCode.trim().toUpperCase() };
  }
  return null;
}

export function useEntreToposSocket({
  player,
  initialRoomCode,
  enabled = true,
  onWrongGame,
}: UseEntreToposSocketOptions) {
  const [connectionStatus, setConnectionStatus] = useState<EntreToposConnectionStatus>('idle');
  const [roomState, setRoomState] = useState<EntreToposRoomState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const messageQueueRef = useRef<EntreToposClientMessage[]>([]);
  const reconnectAttemptsRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isManuallyClosedRef = useRef<boolean>(false);
  const isCreatingOrJoiningRef = useRef<boolean>(false);
  const lastActiveRoomRef = useRef<{ code: string } | null>(getInitialEntreToposRoom(initialRoomCode));

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

  // Safely detach and close an existing socket without triggering its onclose reconnect loop
  const cleanupExistingSocket = useCallback((reason = 'Conexión reemplazada') => {
    const sock = wsRef.current;
    if (!sock) return;
    wsRef.current = null;

    sock.onopen = null;
    sock.onmessage = null;
    sock.onerror = null;
    sock.onclose = null;

    if (sock.readyState === WebSocket.OPEN) {
      try {
        sock.close(1000, reason);
      } catch {
        // ignore
      }
    } else if (sock.readyState === WebSocket.CONNECTING) {
      sock.onopen = () => {
        try {
          sock.close(1000, reason);
        } catch {
          // ignore
        }
      };
      sock.onerror = () => {};
    }
  }, []);

  const getSanitizedSocketUrl = useCallback((): string => {
    return getGameWsUrl('/ws/entre-topos', 'VITE_ENTRE_TOPOS_WS_URL');
  }, []);

  const sendClientMessage = useCallback((msg: EntreToposClientMessage) => {
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

  const connectToRoom = useCallback(
    (roomCode: string, isReconnection = false) => {
      if (!enabled) return;

      const code = roomCode.trim().toUpperCase();
      if (!code) return;

      // Avoid replacing a healthy open/connecting socket for the same room
      if (
        wsRef.current &&
        (wsRef.current.readyState === WebSocket.OPEN ||
          wsRef.current.readyState === WebSocket.CONNECTING) &&
        lastActiveRoomRef.current?.code === code
      ) {
        return;
      }

      clearReconnectTimer();
      clearPingTimer();
      cleanupExistingSocket('Nueva conexión a sala');

      isManuallyClosedRef.current = false;
      lastActiveRoomRef.current = { code };
      setConnectionStatus(isReconnection ? 'reconnecting' : 'connecting');
      setErrorMessage(null);

      try {
        const targetWsUrl = getSanitizedSocketUrl();
        const ws = new WebSocket(targetWsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (wsRef.current !== ws) return;

          setConnectionStatus('connected');
          setErrorMessage(null);
          reconnectAttemptsRef.current = 0;
          backendHealth.markHealthy();

          // Retrieve persisted mole customization
          let savedMole: MoleCustomization = DEFAULT_MOLE_CUSTOMIZATION;
          try {
            const raw = localStorage.getItem('entre_topos_mole_customization_v2');
            if (raw) savedMole = JSON.parse(raw);
          } catch {
            // fallback
          }

          const joinMsg: EntreToposClientMessage = {
            type: 'JOIN_ROOM',
            code,
            player: {
              id: playerRef.current.id,
              name: playerRef.current.name,
              avatar: playerRef.current.avatar,
              color: playerRef.current.color,
              moleCustomization: playerRef.current.moleCustomization || savedMole,
            },
          };

          ws.send(JSON.stringify(joinMsg));
          flushMessageQueue();

          sessionRecovery.saveActiveSession({
            gameType: 'entre-topos',
            roomCode: code,
            playerId: playerRef.current.id,
          });

          clearPingTimer();
          pingIntervalRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'PING' }));
            }
          }, 15000);
        };

        ws.onmessage = (event) => {
          if (wsRef.current !== ws) return;
          try {
            const msg = JSON.parse(event.data) as EntreToposServerMessage;
            if (msg.type === 'PONG') return;

            if (msg.type === 'SYNC_STATE') {
              setRoomState((prev) => {
                const prevPhase = prev?.phase;
                const nextPhase = msg.state.phase;
                if (prevPhase !== nextPhase) {
                  if (nextPhase === 'WRITING') {
                    audio.playTurnChange();
                  } else if (nextPhase === 'VOTE_REVEAL') {
                    audio.playExplosion();
                  } else if (nextPhase === 'ROUND_RESULTS') {
                    audio.playVictory();
                  }
                }
                return msg.state;
              });
            } else if (msg.type === 'ERROR') {
              if (
                msg.message === 'NO SE HA ENCONTRADO ESA SALA' ||
                msg.message === 'NO SE HA ENCONTRADO LA SALA' ||
                msg.message === 'SALA NO ENCONTRADA'
              ) {
                isManuallyClosedRef.current = true;
                sessionRecovery.clearActiveSession();
                lastActiveRoomRef.current = null;
                setRoomState(null);
                setConnectionStatus('idle');
                setErrorMessage(msg.message);
                cleanupExistingSocket('Sala no encontrada');
              } else {
                setErrorMessage(msg.message);
              }
            }
          } catch (e) {
            console.warn('[useEntreToposSocket] Error parsing server message:', e);
          }
        };

        ws.onclose = () => {
          if (wsRef.current === ws) {
            wsRef.current = null;
          }
          clearPingTimer();

          if (isManuallyClosedRef.current) {
            setConnectionStatus('disconnected');
            return;
          }

          setConnectionStatus('reconnecting');
          const attempts = reconnectAttemptsRef.current + 1;
          reconnectAttemptsRef.current = attempts;

          if (attempts <= 10) {
            const delay = Math.min(1000 * Math.pow(1.3, attempts), 8000);
            clearReconnectTimer();
            reconnectTimeoutRef.current = setTimeout(() => {
              if (!isManuallyClosedRef.current && lastActiveRoomRef.current?.code) {
                connectToRoom(lastActiveRoomRef.current.code, true);
              }
            }, delay);
          } else {
            setConnectionStatus('failed');
            setErrorMessage('Se ha perdido la conexión con la sala. Comprueba tu red.');
          }
        };

        ws.onerror = (err) => {
          console.warn('[useEntreToposSocket] WebSocket error:', err);
        };
      } catch (err) {
        console.error('[useEntreToposSocket] Failed to create WebSocket:', err);
        setConnectionStatus('failed');
        setErrorMessage('Error al conectar con el servidor de Entre Topos.');
      }
    },
    [
      enabled,
      clearReconnectTimer,
      clearPingTimer,
      cleanupExistingSocket,
      getSanitizedSocketUrl,
      flushMessageQueue,
    ]
  );

  const createRoom = useCallback(
    async (config?: Partial<EntreToposConfig>): Promise<string | null> => {
      if (isCreatingOrJoiningRef.current) return null;
      isCreatingOrJoiningRef.current = true;
      setErrorMessage(null);

      try {
        let savedMole: MoleCustomization = DEFAULT_MOLE_CUSTOMIZATION;
        try {
          const raw = localStorage.getItem('entre_topos_mole_customization_v2');
          if (raw) savedMole = JSON.parse(raw);
        } catch {}

        const res = await createOnlineRoom(
          'entre-topos',
          {
            id: playerRef.current.id,
            name: playerRef.current.name,
            avatar: playerRef.current.avatar,
            color: playerRef.current.color,
          },
          {
            ...config,
            moleCustomization: playerRef.current.moleCustomization || savedMole,
          }
        );

        const newCode = res.code.toUpperCase().trim();
        lastActiveRoomRef.current = { code: newCode };
        connectToRoom(newCode, false);
        return newCode;
      } catch (err: any) {
        if (err?.name === 'AbortError' || err?.message === 'OPERATION_CANCELLED') {
          return null;
        }
        console.error('[useEntreToposSocket] Error creating room:', err);
        setErrorMessage(err.message || 'Error al crear la sala');
        return null;
      } finally {
        isCreatingOrJoiningRef.current = false;
      }
    },
    [connectToRoom]
  );

  const joinRoom = useCallback(
    async (roomCode: string): Promise<boolean> => {
      const code = roomCode.trim().toUpperCase();
      if (!code) {
        setErrorMessage('Introduce un código de sala válido');
        return false;
      }

      if (isCreatingOrJoiningRef.current) return false;
      isCreatingOrJoiningRef.current = true;
      setErrorMessage(null);

      try {
        await backendHealth.ensureBackendAvailable();
        const res = await validateJoinOnlineRoom(code, 'entre-topos', playerRef.current);

        if (res.valid) {
          lastActiveRoomRef.current = { code };
          connectToRoom(code, false);
          return true;
        } else {
          if (res.wrongGame && res.actualGameType && onWrongGameRef.current) {
            onWrongGameRef.current(res.actualGameType, code);
            return false;
          }
          setErrorMessage(res.message || 'No se puede entrar a la sala');
          return false;
        }
      } catch (err: any) {
        if (err?.name === 'AbortError' || err?.message === 'OPERATION_CANCELLED') {
          return false;
        }
        console.error('[useEntreToposSocket] Error joining room:', err);
        setErrorMessage(err.message || 'Error al unirse a la sala');
        return false;
      } finally {
        isCreatingOrJoiningRef.current = false;
      }
    },
    [connectToRoom]
  );

  // Client gameplay actions
  const updateMole = useCallback(
    (customization: MoleCustomization, newName?: string) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        sendClientMessage({
          type: 'UPDATE_MOLE',
          moleCustomization: customization,
          name: newName,
        });
      }
    },
    [sendClientMessage]
  );

  const updateConfig = useCallback(
    (config: Partial<EntreToposConfig>) => {
      sendClientMessage({ type: 'UPDATE_CONFIG', config });
    },
    [sendClientMessage]
  );

  const startGame = useCallback(() => {
    sendClientMessage({ type: 'START_GAME' });
  }, [sendClientMessage]);

  const submitClue = useCallback(
    (clue: string) => {
      sendClientMessage({ type: 'SUBMIT_CLUE', clue });
    },
    [sendClientMessage]
  );

  const castVote = useCallback(
    (targetPlayerId: string) => {
      sendClientMessage({ type: 'CAST_VOTE', targetPlayerId });
    },
    [sendClientMessage]
  );

  const moleGuessWord = useCallback(
    (word: string) => {
      sendClientMessage({ type: 'MOLE_GUESS_WORD', word });
    },
    [sendClientMessage]
  );

  const continueVoteReveal = useCallback(() => {
    sendClientMessage({ type: 'CONTINUE_VOTE_REVEAL' });
  }, [sendClientMessage]);

  const nextRound = useCallback(() => {
    sendClientMessage({ type: 'NEXT_ROUND' });
  }, [sendClientMessage]);

  const playAgain = useCallback(() => {
    sendClientMessage({ type: 'PLAY_AGAIN' });
  }, [sendClientMessage]);

  const returnToLobby = useCallback(() => {
    sendClientMessage({ type: 'RETURN_TO_LOBBY' });
  }, [sendClientMessage]);

  const leaveRoom = useCallback(() => {
    isManuallyClosedRef.current = true;
    lastActiveRoomRef.current = null;
    clearReconnectTimer();
    clearPingTimer();

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ type: 'LEAVE_ROOM' }));
      } catch {
        // ignore
      }
    }

    cleanupExistingSocket('Salida voluntaria de la sala');
    sessionRecovery.clearActiveSession();
    setRoomState(null);
    setConnectionStatus('idle');
  }, [clearReconnectTimer, clearPingTimer, cleanupExistingSocket]);

  // Auto-connect on mount if an initial room code or saved session exists
  useEffect(() => {
    if (!enabled) return;
    const initial = lastActiveRoomRef.current;
    if (!initial || !initial.code) return;

    let cancelled = false;
    validateJoinOnlineRoom(initial.code, 'entre-topos', playerRef.current)
      .then((res) => {
        if (cancelled || isManuallyClosedRef.current) return;
        if (res.valid) {
          connectToRoom(initial.code, true);
        } else {
          sessionRecovery.clearActiveSession();
          lastActiveRoomRef.current = null;
          setConnectionStatus('idle');
          if (res.wrongGame && res.actualGameType && onWrongGameRef.current) {
            onWrongGameRef.current(res.actualGameType, initial.code);
          }
        }
      })
      .catch(() => {
        if (cancelled) return;
        sessionRecovery.clearActiveSession();
        lastActiveRoomRef.current = null;
        setConnectionStatus('idle');
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, connectToRoom]);

  // Unmount-only cleanup (never closes active socket on state updates)
  useEffect(() => {
    return () => {
      isManuallyClosedRef.current = true;
      clearReconnectTimer();
      clearPingTimer();
      cleanupExistingSocket('Componente desmontado');
    };
  }, [clearReconnectTimer, clearPingTimer, cleanupExistingSocket]);

  return {
    connectionStatus,
    roomState,
    errorMessage,
    createRoom,
    joinRoom,
    updateMole,
    updateConfig,
    startGame,
    submitClue,
    castVote,
    moleGuessWord,
    continueVoteReveal,
    nextRound,
    playAgain,
    returnToLobby,
    leaveRoom,
  };
}
