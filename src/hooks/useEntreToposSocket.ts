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
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isManuallyClosedRef = useRef<boolean>(false);
  const isCreatingOrJoiningRef = useRef<boolean>(false);

  const playerRef = useRef(player);
  playerRef.current = player;

  const onWrongGameRef = useRef(onWrongGame);
  onWrongGameRef.current = onWrongGame;

  const lastActiveRoomRef = useRef<{ code: string } | null>(() => {
    if (initialRoomCode && initialRoomCode.trim()) {
      return { code: initialRoomCode.trim().toUpperCase() };
    }
    const saved = sessionRecovery.getActiveSession();
    if (saved && (saved.gameType as string) === 'entre-topos' && saved.roomCode) {
      return { code: saved.roomCode.trim().toUpperCase() };
    }
    return null;
  });

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
    (roomCode: string) => {
      if (!enabled) return;

      const code = roomCode.trim().toUpperCase();
      if (!code) return;

      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {
          // ignore
        }
      }

      isManuallyClosedRef.current = false;
      setConnectionStatus((prev) => (prev === 'connected' ? 'reconnecting' : 'connecting'));
      setErrorMessage(null);

      const targetWsUrl = getSanitizedSocketUrl();
      const ws = new WebSocket(targetWsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;

        // Retrieve persisted mole customization
        let savedMole: MoleCustomization = DEFAULT_MOLE_CUSTOMIZATION;
        try {
          const raw = localStorage.getItem('entre_topos_mole_customization');
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
          gameType: 'entre-topos' as any,
          roomCode: code,
          playerId: playerRef.current.id,
        });

        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'PING' }));
          }
        }, 15000);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as EntreToposServerMessage;
          if (msg.type === 'SYNC_STATE') {
            setRoomState(msg.state);

            // Audio cues based on state
            if (msg.state.phase === 'WRITING' && msg.state.timerSecondsRemaining === 45) {
              audio.playTurnChange();
            } else if (msg.state.phase === 'VOTE_REVEAL') {
              audio.playExplosion();
            } else if (msg.state.phase === 'ROUND_RESULTS') {
              audio.playVictory();
            }
          } else if (msg.type === 'ERROR') {
            setErrorMessage(msg.message);
          }
        } catch (e) {
          console.warn('[useEntreToposSocket] Error parsing server message:', e);
        }
      };

      ws.onclose = () => {
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);

        if (isManuallyClosedRef.current) {
          setConnectionStatus('disconnected');
          return;
        }

        setConnectionStatus('reconnecting');
        const attempts = reconnectAttemptsRef.current + 1;
        reconnectAttemptsRef.current = attempts;

        if (attempts <= 10) {
          const delay = Math.min(1000 * Math.pow(1.3, attempts), 8000);
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            connectToRoom(code);
          }, delay);
        } else {
          setConnectionStatus('failed');
          setErrorMessage('Se ha perdido la conexión con la sala. Comprueba tu red.');
        }
      };

      ws.onerror = (err) => {
        console.warn('[useEntreToposSocket] WebSocket error:', err);
      };
    },
    [enabled, getSanitizedSocketUrl, flushMessageQueue]
  );

  const createRoom = useCallback(
    async (config?: Partial<EntreToposConfig>): Promise<string | null> => {
      if (isCreatingOrJoiningRef.current) return null;
      isCreatingOrJoiningRef.current = true;
      setErrorMessage(null);

      try {
        let savedMole: MoleCustomization = DEFAULT_MOLE_CUSTOMIZATION;
        try {
          const raw = localStorage.getItem('entre_topos_mole_customization');
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
        connectToRoom(newCode);
        return newCode;
      } catch (err: any) {
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
        const res = await validateJoinOnlineRoom(code, 'entre-topos');

        if (res.valid) {
          lastActiveRoomRef.current = { code };
          connectToRoom(code);
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
      sendClientMessage({
        type: 'UPDATE_MOLE',
        moleCustomization: customization,
        name: newName,
      });
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

  const nextRound = useCallback(() => {
    sendClientMessage({ type: 'NEXT_ROUND' });
  }, [sendClientMessage]);

  const playAgain = useCallback(() => {
    sendClientMessage({ type: 'PLAY_AGAIN' });
  }, [sendClientMessage]);

  const leaveRoom = useCallback(() => {
    isManuallyClosedRef.current = true;
    sendClientMessage({ type: 'LEAVE_ROOM' });
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {}
    }
    sessionRecovery.clearActiveSession();
    setRoomState(null);
    setConnectionStatus('idle');
  }, [sendClientMessage]);

  // Auto-connect on mount if room code exists
  useEffect(() => {
    if (!enabled) return;

    if (lastActiveRoomRef.current?.code && connectionStatus === 'idle') {
      connectToRoom(lastActiveRoomRef.current.code);
    }

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {}
      }
    };
  }, [enabled, connectToRoom, connectionStatus]);

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
    nextRound,
    playAgain,
    leaveRoom,
  };
}
