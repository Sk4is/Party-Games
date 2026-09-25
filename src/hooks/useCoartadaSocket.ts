import { useState, useEffect, useRef, useCallback } from 'react';
import {
  CoartadaRoomState,
  CoartadaConfig,
  CoartadaServerMessage,
  CoartadaClientMessage,
  DetectiveVerdictSubmission,
  EvidenceCard,
} from '../types/coartada';
import {
  createOnlineRoom,
  validateJoinOnlineRoom,
  PlayerProfile,
} from '../services/multiplayerRoomService';
import { sessionRecovery } from '../services/sessionRecovery';
import { audio } from '../utils/audio';

export type CoartadaConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'failed';

interface UseCoartadaSocketOptions {
  player: PlayerProfile;
  initialRoomCode?: string;
  enabled?: boolean;
  onWrongGame?: (
    actualGameType: 'la-bomba' | 'la-peor-respuesta' | 'pinturillo' | 'palabra-secreta' | 'codigo-rojo' | 'coartada',
    roomCode: string
  ) => void;
}

export function useCoartadaSocket({
  player,
  initialRoomCode,
  enabled = true,
  onWrongGame,
}: UseCoartadaSocketOptions) {
  const [connectionStatus, setConnectionStatus] = useState<CoartadaConnectionStatus>('idle');
  const [roomState, setRoomState] = useState<CoartadaRoomState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notebookText, setNotebookText] = useState<string>('');
  const [newEvidenceAlert, setNewEvidenceAlert] = useState<EvidenceCard | null>(null);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(0);

  const wsRef = useRef<WebSocket | null>(null);
  const messageQueueRef = useRef<CoartadaClientMessage[]>([]);
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
    if (saved && (saved.gameType as string) === 'coartada' && saved.roomCode) {
      return { code: saved.roomCode.trim().toUpperCase() };
    }
    return null;
  });

  const getSanitizedSocketUrl = useCallback((): string => {
    const envUrl =
      (import.meta as any).env?.VITE_WS_URL ||
      (import.meta as any).env?.VITE_COARTADA_WS_URL;
    if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
      return envUrl.trim();
    }
    if (typeof window !== 'undefined') {
      const loc = window.location;
      const protocol = loc.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${loc.host}/ws/coartada`;
    }
    return 'ws://localhost:3000/ws/coartada';
  }, []);

  const sendClientMessage = useCallback((msg: CoartadaClientMessage) => {
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
      const cleanCode = roomCode.toUpperCase().trim();
      if (!cleanCode) return;

      isManuallyClosedRef.current = false;
      lastActiveRoomRef.current = { code: cleanCode };

      if (
        wsRef.current &&
        (wsRef.current.readyState === WebSocket.OPEN ||
          wsRef.current.readyState === WebSocket.CONNECTING)
      ) {
        // Send join if socket open
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
        return;
      }

      setConnectionStatus(reconnectAttemptsRef.current > 0 ? 'reconnecting' : 'connecting');

      try {
        const wsUrl = getSanitizedSocketUrl();
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          reconnectAttemptsRef.current = 0;
          setConnectionStatus('connected');
          setErrorMessage(null);

          // Join message
          const joinMsg: CoartadaClientMessage = {
            type: 'JOIN_ROOM',
            code: cleanCode,
            player: {
              id: playerRef.current.id,
              name: playerRef.current.name,
              avatar: playerRef.current.avatar,
              color: playerRef.current.color,
            },
          };
          ws.send(JSON.stringify(joinMsg));

          // Save active session
          sessionRecovery.saveActiveSession({
            gameType: 'coartada',
            roomCode: cleanCode,
            playerId: playerRef.current.id,
          });

          flushMessageQueue();

          // Ping interval
          if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
          pingIntervalRef.current = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'PING' }));
            }
          }, 15000);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data) as CoartadaServerMessage;
            if (data.type === 'PONG') return;

            if (data.type === 'ROOM_STATE') {
              setRoomState(data.room);
              if (data.room.timeRemainingSeconds !== undefined) {
                setTimeRemainingSeconds(data.room.timeRemainingSeconds);
              }
              if (data.savedNotebookText !== undefined) {
                setNotebookText(data.savedNotebookText);
              }
            } else if (data.type === 'TICK') {
              setTimeRemainingSeconds(data.timeRemainingSeconds);
            } else if (data.type === 'NEW_EVIDENCE') {
              audio.playEvidenceReveal();
              setNewEvidenceAlert(data.evidence);
              setTimeout(() => {
                setNewEvidenceAlert(null);
              }, 6000);
            } else if (data.type === 'ERROR') {
              setErrorMessage(data.message);
            }
          } catch (err) {
            console.error('[useCoartadaSocket] Error parsing server message:', err);
          }
        };

        ws.onclose = () => {
          if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
          if (isManuallyClosedRef.current) {
            setConnectionStatus('disconnected');
            return;
          }

          if (reconnectAttemptsRef.current < 6) {
            reconnectAttemptsRef.current += 1;
            setConnectionStatus('reconnecting');
            const delay = Math.min(1000 * Math.pow(1.5, reconnectAttemptsRef.current), 5000);
            reconnectTimeoutRef.current = setTimeout(() => {
              if (lastActiveRoomRef.current) {
                connectToRoom(lastActiveRoomRef.current.code);
              }
            }, delay);
          } else {
            setConnectionStatus('failed');
            setErrorMessage('Se ha perdido la conexión con la sala.');
          }
        };

        ws.onerror = () => {
          // let onclose handle reconnection
        };
      } catch (err) {
        console.error('[useCoartadaSocket] WebSocket connection exception:', err);
        setConnectionStatus('failed');
      }
    },
    [enabled, getSanitizedSocketUrl, sendClientMessage, flushMessageQueue]
  );

  const createRoom = useCallback(
    async (durationMinutes: CoartadaConfig['durationMinutes'] = 10) => {
      if (isCreatingOrJoiningRef.current) return;
      isCreatingOrJoiningRef.current = true;
      setErrorMessage(null);

      try {
        const roomMeta = await createOnlineRoom(
          'coartada' as any,
          playerRef.current,
          { durationMinutes }
        );
        connectToRoom(roomMeta.code);
      } catch (err: any) {
        setErrorMessage(err.message || 'Error al crear la sala');
      } finally {
        isCreatingOrJoiningRef.current = false;
      }
    },
    [connectToRoom]
  );

  const joinRoom = useCallback(
    async (code: string) => {
      if (isCreatingOrJoiningRef.current) return;
      isCreatingOrJoiningRef.current = true;
      setErrorMessage(null);

      try {
        const check = await validateJoinOnlineRoom(code, 'coartada' as any);
        if (!check.valid) {
          if (check.wrongGame && check.actualGameType && onWrongGameRef.current) {
            onWrongGameRef.current(check.actualGameType, code);
            return;
          }
          setErrorMessage(check.message || 'No se puede unir a la sala');
          return;
        }
        connectToRoom(code);
      } catch (err: any) {
        setErrorMessage(err.message || 'Error al validar la sala');
      } finally {
        isCreatingOrJoiningRef.current = false;
      }
    },
    [connectToRoom]
  );

  const updateConfig = useCallback(
    (config: Partial<CoartadaConfig>) => {
      sendClientMessage({ type: 'UPDATE_CONFIG', config });
    },
    [sendClientMessage]
  );

  const startCase = useCallback(() => {
    audio.playPaperSlide();
    sendClientMessage({ type: 'START_CASE' });
  }, [sendClientMessage]);

  const requestVerdictPhase = useCallback(() => {
    sendClientMessage({ type: 'REQUEST_VERDICT_PHASE' });
  }, [sendClientMessage]);

  const submitVerdict = useCallback(
    (verdict: DetectiveVerdictSubmission) => {
      audio.playStampHeavy();
      sendClientMessage({ type: 'SUBMIT_VERDICT', verdict });
    },
    [sendClientMessage]
  );

  const newCase = useCallback(() => {
    audio.playPaperSlide();
    sendClientMessage({ type: 'NEW_CASE' });
  }, [sendClientMessage]);

  const saveNotebook = useCallback(
    (text: string) => {
      setNotebookText(text);
      sendClientMessage({ type: 'SAVE_NOTEBOOK', notebookText: text });
    },
    [sendClientMessage]
  );

  const leaveRoom = useCallback(() => {
    isManuallyClosedRef.current = true;
    if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    sendClientMessage({ type: 'LEAVE_ROOM' });
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    sessionRecovery.clearActiveSession();
    lastActiveRoomRef.current = null;
    setRoomState(null);
    setConnectionStatus('idle');
  }, [sendClientMessage]);

  // Handle initial auto-connect if code exists
  useEffect(() => {
    if (!enabled) return;
    const initial = lastActiveRoomRef.current;
    if (initial && initial.code && connectionStatus === 'idle') {
      connectToRoom(initial.code);
    }
  }, [enabled, connectionStatus, connectToRoom]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isManuallyClosedRef.current = true;
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  return {
    connectionStatus,
    roomState,
    errorMessage,
    notebookText,
    newEvidenceAlert,
    timeRemainingSeconds,
    createRoom,
    joinRoom,
    updateConfig,
    startCase,
    requestVerdictPhase,
    submitVerdict,
    newCase,
    saveNotebook,
    leaveRoom,
  };
}
