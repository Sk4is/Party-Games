import { useState, useEffect, useRef, useCallback } from 'react';
import {
  PalabraSecretaRoomState,
  PalabraSecretaPlayer,
  PalabraSecretaConfig,
  PalabraSecretaServerMessage,
  PalabraSecretaClientMessage,
} from '../types/palabraSecreta';
import {
  createOnlineRoom,
  validateJoinOnlineRoom,
  PlayerProfile,
} from '../services/multiplayerRoomService';
import { sessionRecovery } from '../services/sessionRecovery';
import { audio } from '../utils/audio';

export type PalabraSecretaConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'error';

interface UsePalabraSecretaSocketOptions {
  player: { id: string; name: string; avatar: string; color: string };
  initialRoomCode?: string;
  onWrongGame?: (
    actualGameType: 'la-bomba' | 'la-peor-respuesta' | 'pinturillo',
    roomCode: string
  ) => void;
}

export function usePalabraSecretaSocket({
  player,
  initialRoomCode,
  onWrongGame,
}: UsePalabraSecretaSocketOptions) {
  const [connectionStatus, setConnectionStatus] = useState<PalabraSecretaConnectionStatus>('idle');
  const [roomState, setRoomState] = useState<PalabraSecretaRoomState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const [actionAlert, setActionAlert] = useState<{
    action: 'GUESSED' | 'SKIPPED' | 'TABOO';
    word: string;
    points: number;
  } | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const messageQueueRef = useRef<PalabraSecretaClientMessage[]>([]);
  const reconnectAttemptsRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isManuallyClosedRef = useRef<boolean>(false);
  const lastActiveRoomRef = useRef<{ code: string } | null>(
    initialRoomCode
      ? { code: initialRoomCode.trim().toUpperCase() }
      : (() => {
          const saved = sessionRecovery.getActiveSession();
          if (saved && saved.gameType === 'palabra-secreta' && saved.roomCode) {
            return { code: saved.roomCode };
          }
          return null;
        })()
  );

  const playerRef = useRef(player);
  playerRef.current = player;

  // Resolve sanitized WebSocket URL
  const getSanitizedSocketUrl = useCallback((): string => {
    const envUrl =
      (import.meta as any).env?.VITE_WS_URL ||
      (import.meta as any).env?.VITE_PALABRA_SECRETA_WS_URL;
    if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
      return envUrl.trim();
    }
    if (typeof window === 'undefined') {
      return 'ws://localhost:3000/ws/palabra-secreta';
    }
    const isHttps = window.location.protocol === 'https:';
    const protocol = isHttps ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws/palabra-secreta`;
  }, []);

  const connect = useCallback(() => {
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    const currentRoom = lastActiveRoomRef.current;
    if (!currentRoom) {
      setConnectionStatus('idle');
      return;
    }

    setConnectionStatus((prev) => (prev === 'idle' ? 'connecting' : 'reconnecting'));
    isManuallyClosedRef.current = false;

    const url = getSanitizedSocketUrl();
    console.log(`[PalabraSecretaSocket] Connecting to ${url} for room ${currentRoom.code}...`);

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[PalabraSecretaSocket] WebSocket connected successfully');
        setConnectionStatus('connected');
        setErrorMessage(null);
        reconnectAttemptsRef.current = 0;

        // Join room message
        const joinMsg: PalabraSecretaClientMessage = {
          type: 'JOIN_ROOM',
          roomCode: currentRoom.code,
          player: playerRef.current,
        };
        ws.send(JSON.stringify(joinMsg));

        // Flush any queued messages
        while (messageQueueRef.current.length > 0) {
          const queued = messageQueueRef.current.shift();
          if (queued) {
            ws.send(JSON.stringify(queued));
          }
        }

        // Heartbeat interval
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'PING' }));
          }
        }, 15000);
      };

      ws.onmessage = (event) => {
        try {
          const data: PalabraSecretaServerMessage = JSON.parse(event.data);
          handleServerMessage(data);
        } catch (err) {
          console.error('[PalabraSecretaSocket] Failed to parse server message:', err);
        }
      };

      ws.onclose = (event) => {
        console.warn(`[PalabraSecretaSocket] WebSocket closed (code: ${event.code})`);
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        wsRef.current = null;

        if (!isManuallyClosedRef.current && lastActiveRoomRef.current) {
          scheduleReconnect();
        } else {
          setConnectionStatus('disconnected');
        }
      };

      ws.onerror = (err) => {
        console.error('[PalabraSecretaSocket] WebSocket error occurred:', err);
      };
    } catch (e: any) {
      console.error('[PalabraSecretaSocket] Connection exception:', e);
      setConnectionStatus('error');
      setErrorMessage('No se ha podido conectar con el servidor.');
      scheduleReconnect();
    }
  }, [getSanitizedSocketUrl]);

  const scheduleReconnect = useCallback(() => {
    if (isManuallyClosedRef.current) return;
    setConnectionStatus('reconnecting');
    const delay = Math.min(1000 * Math.pow(1.5, reconnectAttemptsRef.current), 10000);
    reconnectAttemptsRef.current += 1;
    console.log(`[PalabraSecretaSocket] Reconnecting attempt #${reconnectAttemptsRef.current} in ${delay}ms`);

    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [connect]);

  const handleServerMessage = (data: PalabraSecretaServerMessage) => {
    switch (data.type) {
      case 'ROOM_STATE':
        setRoomState((prev) => {
          // Play sounds on phase change or turn change
          if (prev && prev.phase !== data.state.phase) {
            if (data.state.phase === 'ACTIVE_TURN') {
              audio.playTurnChange();
            } else if (data.state.phase === 'TURN_RESULTS') {
              audio.playBombWarning(1.5);
            } else if (data.state.phase === 'PODIUM') {
              audio.playVictory();
            }
          }
          return data.state;
        });

        if (data.state.code && playerRef.current.id) {
          sessionRecovery.saveActiveSession({
            gameType: 'palabra-secreta',
            roomCode: data.state.code,
            playerId: playerRef.current.id,
          });
        }
        break;

      case 'PRE_TURN_TICK':
        setCountdownSeconds(data.countdown);
        audio.playCountdownBeep();
        break;

      case 'TURN_TICK':
        setRoomState((prev) => (prev ? { ...prev, turnRemainingSeconds: data.remainingSeconds } : prev));
        if (data.remainingSeconds <= 5 && data.remainingSeconds > 0) {
          audio.playCountdownBeep();
        } else if (data.remainingSeconds === 0) {
          audio.playCountdownFinal();
        }
        break;

      case 'ACTION_FEEDBACK':
        setActionAlert({
          action: data.action,
          word: data.word,
          points: data.points,
        });
        if (data.action === 'GUESSED') {
          audio.playAnswerAccepted();
        } else if (data.action === 'TABOO') {
          audio.playAnswerRejected();
        } else {
          audio.playTurnChange();
        }
        setTimeout(() => {
          setActionAlert(null);
        }, 2000);
        break;

      case 'ERROR':
        setErrorMessage(data.message);
        break;

      case 'PONG':
        // Heartbeat confirmed
        break;
    }
  };

  const sendMessage = useCallback((msg: PalabraSecretaClientMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    } else {
      messageQueueRef.current.push(msg);
    }
  }, []);

  // Room lifecycle actions
  const createRoom = useCallback(
    async (
      creatorPlayer?: { id: string; name: string; avatar: string; color: string },
      config?: Partial<PalabraSecretaConfig>
    ) => {
      try {
        setConnectionStatus('connecting');
        setErrorMessage(null);
        if (creatorPlayer) {
          playerRef.current = creatorPlayer;
        }
        const hostProfile: PlayerProfile = {
          id: playerRef.current.id,
          name: playerRef.current.name,
          avatar: playerRef.current.avatar,
          color: playerRef.current.color,
        };
        const summary = await createOnlineRoom('palabra-secreta', hostProfile, config);
        lastActiveRoomRef.current = { code: summary.code };
        sessionRecovery.saveActiveSession({
          gameType: 'palabra-secreta',
          roomCode: summary.code,
          playerId: playerRef.current.id,
        });
        connect();
      } catch (err: any) {
        console.error('[PalabraSecretaSocket] Error creating room:', err);
        setConnectionStatus('error');
        setErrorMessage(err.message || 'Error al crear la sala');
      }
    },
    [connect]
  );

  const joinRoom = useCallback(
    async (
      code: string,
      joiningPlayer?: { id: string; name: string; avatar: string; color: string }
    ) => {
      try {
        setConnectionStatus('connecting');
        setErrorMessage(null);
        if (joiningPlayer) {
          playerRef.current = joiningPlayer;
        }
        const cleanCode = code.toUpperCase().trim();
        const playerProfile: PlayerProfile = {
          id: playerRef.current.id,
          name: playerRef.current.name,
          avatar: playerRef.current.avatar,
          color: playerRef.current.color,
        };

        const validation = await validateJoinOnlineRoom(cleanCode, 'palabra-secreta', playerProfile);
        if (!validation.valid) {
          if (validation.wrongGame && validation.actualGameType && onWrongGame) {
            onWrongGame(validation.actualGameType as any, cleanCode);
            return;
          }
          setConnectionStatus('error');
          setErrorMessage(validation.message || 'Código de sala inválido');
          return;
        }

        lastActiveRoomRef.current = { code: cleanCode };
        sessionRecovery.saveActiveSession({
          gameType: 'palabra-secreta',
          roomCode: cleanCode,
          playerId: playerRef.current.id,
        });
        connect();
      } catch (err: any) {
        console.error('[PalabraSecretaSocket] Error joining room:', err);
        setConnectionStatus('error');
        setErrorMessage(err.message || 'Error al unirse a la sala');
      }
    },
    [connect, onWrongGame]
  );

  const switchTeam = useCallback(
    (targetTeamId: 'team-1' | 'team-2', targetPlayerId?: string) => {
      const pid = targetPlayerId || playerRef.current.id;
      sendMessage({ type: 'SWITCH_TEAM', playerId: pid, targetTeamId });
    },
    [sendMessage]
  );

  const updateTeamName = useCallback(
    (teamId: 'team-1' | 'team-2', name: string) => {
      sendMessage({ type: 'UPDATE_TEAM_NAME', teamId, name });
    },
    [sendMessage]
  );

  const randomizeTeams = useCallback(() => {
    sendMessage({ type: 'RANDOMIZE_TEAMS' });
  }, [sendMessage]);

  const updateConfig = useCallback(
    (config: Partial<PalabraSecretaConfig>) => {
      sendMessage({ type: 'UPDATE_CONFIG', config });
    },
    [sendMessage]
  );

  const startGame = useCallback(() => {
    sendMessage({ type: 'START_GAME' });
  }, [sendMessage]);

  const startTurnNow = useCallback(() => {
    sendMessage({ type: 'START_TURN_NOW' });
  }, [sendMessage]);

  const markGuessed = useCallback(() => {
    sendMessage({ type: 'MARK_GUESSED' });
  }, [sendMessage]);

  const skipWord = useCallback(() => {
    sendMessage({ type: 'SKIP_WORD' });
  }, [sendMessage]);

  const markTaboo = useCallback(() => {
    sendMessage({ type: 'MARK_TABOO' });
  }, [sendMessage]);

  const nextTurn = useCallback(() => {
    sendMessage({ type: 'NEXT_TURN' });
  }, [sendMessage]);

  const playAgain = useCallback(() => {
    sendMessage({ type: 'PLAY_AGAIN' });
  }, [sendMessage]);

  const kickPlayer = useCallback(
    (targetPlayerId: string) => {
      sendMessage({ type: 'KICK_PLAYER', targetPlayerId });
    },
    [sendMessage]
  );

  const leaveRoom = useCallback(() => {
    isManuallyClosedRef.current = true;
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    lastActiveRoomRef.current = null;
    sessionRecovery.clearActiveSession();
    setRoomState(null);
    setConnectionStatus('idle');
  }, []);

  // Auto-connect if initialRoomCode or restored session
  useEffect(() => {
    if (initialRoomCode) {
      lastActiveRoomRef.current = { code: initialRoomCode.toUpperCase().trim() };
      connect();
    } else {
      const active = sessionRecovery.getActiveSession();
      if (active && active.gameType === 'palabra-secreta' && active.roomCode) {
        lastActiveRoomRef.current = { code: active.roomCode };
        connect();
      }
    }

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [initialRoomCode, connect]);

  return {
    connectionStatus,
    roomState,
    errorMessage,
    countdownSeconds,
    actionAlert,
    createRoom,
    joinRoom,
    switchTeam,
    updateTeamName,
    randomizeTeams,
    updateConfig,
    startGame,
    startTurnNow,
    markGuessed,
    skipWord,
    markTaboo,
    nextTurn,
    playAgain,
    kickPlayer,
    leaveRoom,
  };
}
