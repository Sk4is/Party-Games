import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  PinturilloRoomState,
  PinturilloPlayer,
  PinturilloConfig,
  DrawStroke,
  DrawingTool,
  NormalizedPoint,
  ServerMessage,
  ClientMessage,
} from '../../types/pinturillo';
import { PinturilloEntry } from './PinturilloEntry';
import { PinturilloLobby } from './PinturilloLobby';
import { PinturilloCanvas } from './PinturilloCanvas';
import { PinturilloToolbar } from './PinturilloToolbar';
import { PinturilloChat } from './PinturilloChat';
import { PinturilloWordChoiceModal } from './PinturilloWordChoiceModal';
import { PinturilloResults } from './PinturilloResults';
import { PinturilloBackgroundDoodles } from './PinturilloBackgroundDoodles';
import { audio } from '../../utils/audio';
import {
  Clock,
  Volume2,
  VolumeX,
  Music,
  ArrowLeft,
  Eye,
  Sparkles,
  HelpCircle,
  AlertCircle,
} from 'lucide-react';

interface PinturilloGameProps {
  onBackToMenu: () => void;
}

export const PinturilloGame: React.FC<PinturilloGameProps> = ({ onBackToMenu }) => {
  // Local player profile
  const [localPlayer, setLocalPlayer] = useState<{ id: string; name: string; avatar: string; color: string }>(() => {
    let playerId = localStorage.getItem('pinturillo_playerId');
    if (!playerId) {
      playerId = `player-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      localStorage.setItem('pinturillo_playerId', playerId);
    }
    return {
      id: playerId,
      name: localStorage.getItem('pinturillo_playerName') || 'Artista',
      avatar: localStorage.getItem('pinturillo_playerAvatar') || '🦊',
      color: localStorage.getItem('pinturillo_playerColor') || '#f59e0b',
    };
  });

  // Check URL query parameters for invitation room code
  const [initialRoomCode, setInitialRoomCode] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('room') || '';
  });

  // Room state from server
  const [roomState, setRoomState] = useState<PinturilloRoomState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [countdownInfo, setCountdownInfo] = useState<{ count: number; text: string } | null>(null);
  const [nearMissAlert, setNearMissAlert] = useState(false);
  const dismissTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Audio / Music states
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Drawing tool state
  const [currentTool, setCurrentTool] = useState<DrawingTool>('pencil');
  const [currentColor, setCurrentColor] = useState<string>('#000000');
  const [currentSize, setCurrentSize] = useState<number>(7);

  // WebSocket Ref
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const heartbeatIntervalRef = useRef<any>(null);

  // Send message helper
  const sendMessage = useCallback((msg: ClientMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  // Connect to WebSocket Server
  const connectWebSocket = useCallback((onConnected?: () => void) => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      if (onConnected && wsRef.current.readyState === WebSocket.OPEN) {
        onConnected();
      }
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/pinturillo`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[Pinturillo Client] Conectado al servidor WebSocket');
      setErrorMessage(null);
      if (onConnected) onConnected();

      // Start ping heartbeat
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      heartbeatIntervalRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 25000);
    };

    ws.onmessage = (event) => {
      try {
        const msg: ServerMessage = JSON.parse(event.data);

        switch (msg.type) {
          case 'room_state':
            setRoomState(msg.state);
            if (msg.state.phase === 'DRAWING') {
              if (dismissTimeoutRef.current) clearTimeout(dismissTimeoutRef.current);
              dismissTimeoutRef.current = setTimeout(() => {
                setCountdownInfo(null);
              }, 400);
            } else if (msg.state.phase !== 'COUNTDOWN') {
              if (dismissTimeoutRef.current) clearTimeout(dismissTimeoutRef.current);
              setCountdownInfo(null);
            }
            break;

          case 'error':
            setErrorMessage(msg.message);
            break;

          case 'countdown_tick':
            if (msg.count < 0) {
              // Immediately clear overlay
              if (dismissTimeoutRef.current) clearTimeout(dismissTimeoutRef.current);
              setCountdownInfo(null);
            } else if (msg.count === 0) {
              // "¡A DIBUJAR!"
              audio.playPinturilloCountdown(0);
              setCountdownInfo({ count: 0, text: msg.text || '¡A DIBUJAR!' });
              if (dismissTimeoutRef.current) clearTimeout(dismissTimeoutRef.current);
              dismissTimeoutRef.current = setTimeout(() => {
                setCountdownInfo(null);
              }, 500);
            } else {
              // 3, 2, 1
              audio.playPinturilloCountdown(msg.count);
              setCountdownInfo({ count: msg.count, text: msg.text || String(msg.count) });
            }
            break;

          case 'tick':
            setRoomState(prev => prev ? { ...prev, remainingTime: msg.remainingTime } : null);
            if (msg.remainingTime <= 10 && msg.remainingTime > 0) {
              audio.playPinturilloClockTick(msg.remainingTime <= 5);
            }
            break;

          case 'stroke_start':
            setRoomState(prev => {
              if (!prev) return null;
              return {
                ...prev,
                drawingStrokes: [...prev.drawingStrokes, msg.stroke],
              };
            });
            break;

          case 'stroke_chunk':
            setRoomState(prev => {
              if (!prev) return null;
              const strokes = [...prev.drawingStrokes];
              const target = strokes.find(s => s.id === msg.strokeId);
              if (target) {
                target.points = [...target.points, ...msg.points];
              }
              return { ...prev, drawingStrokes: strokes };
            });
            break;

          case 'flood_fill':
            setRoomState(prev => {
              if (!prev) return null;
              return {
                ...prev,
                drawingStrokes: [...prev.drawingStrokes, msg.stroke],
              };
            });
            break;

          case 'undo':
            setRoomState(prev => {
              if (!prev) return null;
              const strokes = [...prev.drawingStrokes];
              strokes.pop();
              return { ...prev, drawingStrokes: strokes };
            });
            break;

          case 'redo':
            // Redo strokes are sent via stroke_start / flood_fill
            break;

          case 'clear_canvas':
            setRoomState(prev => {
              if (!prev) return null;
              return { ...prev, drawingStrokes: [] };
            });
            break;

          case 'chat_message':
            setRoomState(prev => {
              if (!prev) return null;
              return {
                ...prev,
                chatMessages: [...prev.chatMessages, msg.message],
              };
            });
            break;

          case 'correct_guess':
            audio.playPinturilloCorrect();
            break;

          case 'near_miss':
            audio.playPinturilloNearMiss();
            setNearMissAlert(true);
            setTimeout(() => setNearMissAlert(false), 3500);
            break;
        }
      } catch (err) {
        console.error('[Pinturillo Client] Error analizando mensaje del servidor:', err);
      }
    };

    ws.onclose = () => {
      console.log('[Pinturillo Client] Conexión cerrada.');
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
    };

    ws.onerror = (err) => {
      console.error('[Pinturillo Client] Error de conexión:', err);
    };
  }, []);

  // Clean up socket and timers on unmount
  useEffect(() => {
    return () => {
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (dismissTimeoutRef.current) clearTimeout(dismissTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
      audio.stopPinturilloMusic();
    };
  }, []);

  // Fail-safe cleanup: Ensure countdown overlay never lingers after DRAWING phase begins
  useEffect(() => {
    if (roomState?.phase === 'DRAWING') {
      const timer = setTimeout(() => {
        setCountdownInfo(null);
      }, 700);
      return () => clearTimeout(timer);
    } else if (roomState?.phase && roomState.phase !== 'COUNTDOWN') {
      setCountdownInfo(null);
    }
  }, [roomState?.phase]);

  // Handlers for room actions
  const handleCreateRoom = (player: { id: string; name: string; avatar: string; color: string }) => {
    setLocalPlayer(player);
    connectWebSocket(() => {
      sendMessage({ type: 'create_room', player });
    });
  };

  const handleJoinRoom = (code: string, player: { id: string; name: string; avatar: string; color: string }) => {
    setLocalPlayer(player);
    connectWebSocket(() => {
      sendMessage({ type: 'join_room', code, player });
    });
  };

  const handleUpdateConfig = (config: Partial<PinturilloConfig>) => {
    sendMessage({ type: 'update_config', config });
  };

  const handleStartGame = () => {
    sendMessage({ type: 'start_game' });
  };

  const handleChooseWord = (word: string) => {
    sendMessage({ type: 'choose_word', word });
  };

  const handleLeaveRoom = () => {
    sendMessage({ type: 'leave_room' });
    setRoomState(null);
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const handleRestartGame = () => {
    sendMessage({ type: 'restart_game' });
  };

  // Drawing event handlers
  const handleStrokeStart = (stroke: DrawStroke) => {
    sendMessage({ type: 'stroke_start', stroke });
  };

  const handleStrokeChunk = (strokeId: string, points: NormalizedPoint[]) => {
    sendMessage({ type: 'stroke_chunk', strokeId, points });
  };

  const handleStrokeEnd = (strokeId: string) => {
    sendMessage({ type: 'stroke_end', strokeId });
  };

  const handleFloodFill = (point: NormalizedPoint, color: string) => {
    sendMessage({ type: 'flood_fill', point, color });
  };

  const handleUndo = () => {
    sendMessage({ type: 'undo' });
  };

  const handleRedo = () => {
    sendMessage({ type: 'redo' });
  };

  const handleClear = () => {
    sendMessage({ type: 'clear_canvas' });
  };

  const handleSendMessage = (text: string) => {
    sendMessage({ type: 'send_chat', text });
  };

  // Music toggle
  const handleToggleMusic = () => {
    const isPlaying = audio.toggleMusic();
    setIsMusicPlaying(isPlaying);
  };

  // Sound toggle
  const handleToggleMute = () => {
    const isMutedNow = audio.toggleMute();
    setIsMuted(isMutedNow);
  };

  // Current active roles
  const isHost = Boolean(roomState && roomState.hostId === localPlayer.id);
  const currentDrawer = roomState?.players.find(p => p.id === roomState.currentDrawerId);
  const isDrawer = Boolean(currentDrawer && currentDrawer.id === localPlayer.id);
  const meInRoom = roomState?.players.find(p => p.id === localPlayer.id);
  const hasGuessed = Boolean(meInRoom?.hasGuessed);

  // 1. If not in a room, show Entry profile / join / create screen
  if (!roomState) {
    return (
      <div className="relative min-h-screen bg-slate-950 text-white flex flex-col justify-center overflow-x-hidden">
        <PinturilloBackgroundDoodles />
        <div className="relative z-10">
          {errorMessage && (
            <div className="max-w-md mx-auto mb-4 p-4 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
          <PinturilloEntry
            initialRoomCode={initialRoomCode}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onBackToMenu={onBackToMenu}
          />
        </div>
      </div>
    );
  }

  // 2. If in LOBBY phase
  if (roomState.phase === 'LOBBY') {
    return (
      <div className="relative min-h-screen bg-slate-950 text-white flex flex-col justify-center overflow-x-hidden">
        <PinturilloBackgroundDoodles />
        <div className="relative z-10">
          {errorMessage && (
            <div className="max-w-md mx-auto mb-4 p-4 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
          <PinturilloLobby
            roomState={roomState}
            localPlayer={localPlayer}
            isHost={isHost}
            onUpdateConfig={handleUpdateConfig}
            onStartGame={handleStartGame}
            onLeaveRoom={handleLeaveRoom}
          />
        </div>
      </div>
    );
  }

  // 3. Gameplay Screen (WORD_SELECTION, COUNTDOWN, DRAWING, ROUND_RESULTS, FINAL_RESULTS)
  const isDrawing = roomState.phase === 'DRAWING';
  const isTimeCritical = isDrawing && roomState.remainingTime <= 10;

  return (
    <div className="relative min-h-screen bg-slate-950 text-white flex flex-col overflow-x-hidden select-none">
      <PinturilloBackgroundDoodles />

      {/* Countdown 3, 2, 1, ¡A DIBUJAR! Overlay */}
      {countdownInfo && (roomState.phase === 'COUNTDOWN' || roomState.phase === 'DRAWING') && (
        <div
          id="pinturillo-countdown-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md pointer-events-none transition-all duration-300"
        >
          <div className="text-center max-w-lg mx-auto">
            {countdownInfo.count > 0 ? (
              <div key={`cd-${countdownInfo.count}`} className="animate-countdown-pop">
                <span className="inline-block text-8xl sm:text-9xl font-black font-display text-amber-400 drop-shadow-[0_10px_35px_rgba(245,158,11,0.5)]">
                  {countdownInfo.count}
                </span>
                <p className="text-2xl sm:text-3xl font-black font-display text-white mt-4 uppercase tracking-widest drop-shadow-md">
                  {isDrawer ? '¡Prepárate para dibujar!' : '¡Adivina el dibujo!'}
                </p>
              </div>
            ) : (
              <div key="cd-start" className="animate-countdown-pop">
                <div className="inline-flex items-center justify-center px-8 py-4 sm:px-12 sm:py-5 rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 text-slate-950 shadow-2xl shadow-emerald-500/50 border-4 border-white">
                  <span className="text-4xl sm:text-6xl font-black font-display uppercase tracking-wider">
                    ¡A DIBUJAR!
                  </span>
                </div>
                <p className="text-xl sm:text-2xl font-black text-emerald-300 mt-4 uppercase tracking-wide">
                  {isDrawer ? '¡El lienzo es tuyo!' : '¡Escribe tu respuesta en el chat!'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Word Selection Modal */}
      {roomState.phase === 'WORD_SELECTION' && (
        <PinturilloWordChoiceModal
          isDrawer={isDrawer}
          drawerName={currentDrawer?.name || 'Dibujante'}
          drawerAvatar={currentDrawer?.avatar || '🎨'}
          wordOptions={roomState.wordOptions}
          remainingSeconds={roomState.selectionRemainingSeconds ?? 10}
          onSelectWord={handleChooseWord}
        />
      )}

      {/* Results Modals */}
      {(roomState.phase === 'ROUND_RESULTS' || roomState.phase === 'FINAL_RESULTS') && (
        <PinturilloResults
          phase={roomState.phase}
          lastRoundResults={roomState.lastRoundResults}
          players={roomState.players}
          isHost={isHost}
          onRestartGame={handleRestartGame}
          onLeaveGame={handleLeaveRoom}
        />
      )}

      {/* Top Header Navigation & Status Bar */}
      <header className="relative z-20 px-3 sm:px-6 py-2.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Left: Exit & Audio Toggles */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleLeaveRoom}
              title="Salir de la sala"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {/* Chill Music Synth Toggle */}
            <button
              type="button"
              onClick={handleToggleMusic}
              title={isMusicPlaying ? 'Pausar música chill' : 'Activar música chill'}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isMusicPlaying
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              <Music className={`w-4 h-4 ${isMusicPlaying ? 'animate-bounce' : ''}`} />
            </button>

            {/* Mute SFX Toggle */}
            <button
              type="button"
              onClick={handleToggleMute}
              title={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer border border-slate-700"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Turn info */}
            <div className="hidden md:flex flex-col ml-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Turno {roomState.currentTurn}/{roomState.totalTurns}
              </span>
              <span className="text-xs font-black text-amber-400">
                Vuelta {roomState.currentVuelta}/{roomState.config.totalVueltas}
              </span>
            </div>
          </div>

          {/* Center: Secret Word (Drawer) or Hint (Guesser) */}
          <div className="flex-1 flex items-center justify-center max-w-xl mx-2">
            {isDrawer && roomState.secretWord ? (
              <div className="flex flex-col items-center bg-amber-500/15 border-2 border-amber-400/50 px-4 sm:px-6 py-1.5 rounded-2xl shadow-inner">
                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-black uppercase text-amber-300">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Tu palabra secreta (¡Solo la ves tú!)</span>
                </div>
                <span className="text-lg sm:text-2xl font-black font-display tracking-widest text-white uppercase">
                  {roomState.secretWord}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center bg-slate-800/80 border border-slate-700/80 px-4 sm:px-6 py-1.5 rounded-2xl shadow-inner">
                <div className="flex items-center gap-2 text-[10px] sm:text-xs font-black uppercase text-slate-400">
                  <span>Pistas ({roomState.wordLength} letras)</span>
                  {roomState.wordCategory && (
                    <span className="px-1.5 py-0.2 rounded bg-slate-700 text-amber-300 font-bold">
                      {roomState.wordCategory}
                    </span>
                  )}
                </div>
                <span className="text-lg sm:text-2xl font-black font-mono tracking-widest text-amber-400 uppercase">
                  {roomState.wordHint || '...'}
                </span>
              </div>
            )}
          </div>

          {/* Right: Round Timer */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-2xl border transition-all ${
                isTimeCritical
                  ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
                  : 'bg-slate-800/90 border-slate-700 text-slate-200'
              }`}
            >
              <Clock className={`w-4 h-4 ${isTimeCritical ? 'text-rose-400 animate-spin' : 'text-amber-400'}`} />
              <span className="font-mono font-black text-sm sm:text-base">
                {roomState.remainingTime}s
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Game Stage: 80% Canvas + 20% Chat Layout */}
      <main className="relative z-10 flex-1 p-2 sm:p-4 max-w-7xl w-full mx-auto flex flex-col lg:flex-row gap-3 min-h-0">
        {/* Left / Center: Canvas Stage & Toolbar (~80% area) */}
        <section className="flex-1 flex flex-col gap-2 min-h-[380px] lg:min-h-0">
          {/* Canvas Header info: Active drawer label */}
          <div className="flex items-center justify-between px-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-base">{currentDrawer?.avatar || '🎨'}</span>
              <span className="text-slate-300 font-bold">
                {isDrawer ? '¡Estás dibujando tú!' : `Dibujando: ${currentDrawer?.name || 'Compañero'}`}
              </span>
            </div>

            {hasGuessed && !isDrawer && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[11px] border border-emerald-500/40">
                ✓ ¡Acertaste!
              </span>
            )}
          </div>

          {/* The Hero White Canvas Element */}
          <div className="flex-1 w-full min-h-[320px] sm:min-h-[440px] relative">
            <PinturilloCanvas
              isDrawer={isDrawer && isDrawing}
              strokes={roomState.drawingStrokes}
              currentTool={currentTool}
              currentColor={currentColor}
              currentSize={currentSize}
              onStrokeStart={handleStrokeStart}
              onStrokeChunk={handleStrokeChunk}
              onStrokeEnd={handleStrokeEnd}
              onFloodFill={handleFloodFill}
            />
          </div>

          {/* Drawer Toolbar (Only visible to active drawer during DRAWING phase) */}
          {isDrawer && isDrawing && (
            <div className="animate-fade-in">
              <PinturilloToolbar
                currentTool={currentTool}
                currentColor={currentColor}
                currentSize={currentSize}
                onSelectTool={setCurrentTool}
                onSelectColor={setCurrentColor}
                onSelectSize={setCurrentSize}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onClear={handleClear}
              />
            </div>
          )}
        </section>

        {/* Right Column: Chat & Guess Box (~20% desktop area) */}
        <aside className="w-full lg:w-80 xl:w-96 h-72 lg:h-auto flex flex-col">
          <PinturilloChat
            messages={roomState.chatMessages}
            players={roomState.players}
            currentDrawerId={roomState.currentDrawerId}
            localPlayerId={localPlayer.id}
            hasGuessed={hasGuessed}
            nearMiss={nearMissAlert}
            disabled={roomState.phase === 'COUNTDOWN'}
            onSendMessage={handleSendMessage}
          />
        </aside>
      </main>
    </div>
  );
};
