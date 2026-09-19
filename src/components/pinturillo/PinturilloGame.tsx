import React, { useState, useEffect, useRef } from 'react';
import {
  PinturilloConfig,
  DrawStroke,
  DrawingTool,
  NormalizedPoint,
} from '../../types/pinturillo';
import { PinturilloEntry } from './PinturilloEntry';
import { PinturilloLobby } from './PinturilloLobby';
import { PinturilloCanvas } from './PinturilloCanvas';
import { PinturilloToolbar } from './PinturilloToolbar';
import { PinturilloChat } from './PinturilloChat';
import { PinturilloWordChoiceModal } from './PinturilloWordChoiceModal';
import { PinturilloResults } from './PinturilloResults';
import { PinturilloBackground } from './PinturilloBackground';
import { MatchAbortedModal } from '../common/MatchAbortedModal';
import { audio } from '../../utils/audio';
import { parseWordHintToGroups } from '../../utils/pinturilloHints';
import { getOrCreateUserProfile, saveUserProfile } from '../../utils/userProfile';
import { usePinturilloSocket } from '../../hooks/usePinturilloSocket';
import {
  Clock,
  Volume2,
  VolumeX,
  Music,
  ArrowLeft,
  Eye,
  AlertCircle,
  WifiOff,
  RefreshCw,
} from 'lucide-react';

interface PinturilloGameProps {
  onBackToMenu: () => void;
  initialRoomCode?: string;
  onSwitchGame?: (actualGameType: 'la-bomba' | 'la-peor-respuesta', roomCode: string) => void;
}

export const PinturilloGame: React.FC<PinturilloGameProps> = ({
  onBackToMenu,
  initialRoomCode: propRoomCode,
  onSwitchGame,
}) => {
  // Check URL query parameters or prop for invitation room code
  const initialRoomCode =
    propRoomCode ||
    (typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('room') || ''
      : '');

  // Local player profile synchronized with shared userProfile
  const [localPlayer, setLocalPlayer] = useState<{
    id: string;
    name: string;
    avatar: string;
    color: string;
  }>(() => {
    const saved = getOrCreateUserProfile();
    return {
      id: saved.id,
      name: saved.name || 'Artista',
      avatar: saved.avatar || '🦊',
      color: saved.color || '#f59e0b',
    };
  });

  // Pinturillo Socket Hook with reconnection backoff, REST integration, & state sync
  const {
    connectionStatus,
    roomState,
    setRoomState,
    errorMessage,
    countdownInfo,
    setCountdownInfo,
    nearMissAlert,
    createRoom,
    joinRoom,
    leaveRoom,
    retryConnection,
    updateConfig,
    startGame,
    chooseWord,
    sendStrokeStart,
    sendStrokeChunk,
    sendStrokeEnd,
    sendFloodFill,
    sendUndo,
    sendRedo,
    sendClearCanvas,
    sendChat,
    restartGame,
  } = usePinturilloSocket({
    player: localPlayer,
    initialRoomCode,
    onWrongGame: onSwitchGame,
  });

  // Audio / Music states
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Drawing tool state
  const [currentTool, setCurrentTool] = useState<DrawingTool>('pencil');
  const [currentColor, setCurrentColor] = useState<string>('#0f172a');
  const [currentSize, setCurrentSize] = useState<number>(7);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState<boolean>(false);

  // Close clear canvas modal automatically on turn/phase transitions
  useEffect(() => {
    setIsClearConfirmOpen(false);
  }, [roomState?.currentTurn, roomState?.phase]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
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
  }, [roomState?.phase, setCountdownInfo]);

  // Keep remainingTime and selectionRemainingSeconds strictly synchronized with authoritative timestamps
  useEffect(() => {
    if (!roomState) return;

    if (roomState.phase === 'DRAWING' && roomState.roundEndsAt) {
      const interval = setInterval(() => {
        const now = Date.now();
        const rem = Math.max(0, Math.ceil((roomState.roundEndsAt! - now) / 1000));
        setRoomState((prev) => {
          if (!prev || prev.phase !== 'DRAWING' || prev.remainingTime === rem) return prev;
          return { ...prev, remainingTime: rem };
        });
      }, 250);
      return () => clearInterval(interval);
    }

    if (roomState.phase === 'WORD_SELECTION' && roomState.selectionEndsAt) {
      const interval = setInterval(() => {
        const now = Date.now();
        const rem = Math.max(0, Math.ceil((roomState.selectionEndsAt! - now) / 1000));
        setRoomState((prev) => {
          if (!prev || prev.phase !== 'WORD_SELECTION' || prev.selectionRemainingSeconds === rem)
            return prev;
          return { ...prev, selectionRemainingSeconds: rem };
        });
      }, 250);
      return () => clearInterval(interval);
    }
  }, [roomState?.phase, roomState?.roundEndsAt, roomState?.selectionEndsAt, setRoomState]);

  // Handlers for room actions
  const handleCreateRoom = (
    player: { id: string; name: string; avatar: string; color: string },
    config?: Partial<PinturilloConfig>
  ) => {
    setLocalPlayer(player);
    saveUserProfile(player);
    createRoom(player, config);
  };

  const handleJoinRoom = (
    code: string,
    player: { id: string; name: string; avatar: string; color: string }
  ) => {
    setLocalPlayer(player);
    saveUserProfile(player);
    joinRoom(code, player);
  };

  const handleUpdateConfig = (config: Partial<PinturilloConfig>) => {
    updateConfig(config);
  };

  const handleStartGame = () => {
    startGame();
  };

  const handleChooseWord = (word: string) => {
    chooseWord(word);
  };

  const handleLeaveRoom = () => {
    leaveRoom();
    onBackToMenu();
  };

  const handleRestartGame = () => {
    restartGame();
  };

  // Drawing event handlers
  const handleStrokeStart = (stroke: DrawStroke) => {
    sendStrokeStart(stroke);
    setRoomState((prev) => {
      if (!prev) return null;
      if (prev.drawingStrokes.some((s) => s.id === stroke.id)) return prev;
      return { ...prev, drawingStrokes: [...prev.drawingStrokes, stroke] };
    });
  };

  const handleStrokeChunk = (strokeId: string, points: NormalizedPoint[]) => {
    sendStrokeChunk(strokeId, points);
    setRoomState((prev) => {
      if (!prev) return null;
      const strokes = [...prev.drawingStrokes];
      const target = strokes.find((s) => s.id === strokeId);
      if (target) {
        target.points = [...target.points, ...points];
      }
      return { ...prev, drawingStrokes: strokes };
    });
  };

  const handleStrokeEnd = (strokeId: string) => {
    sendStrokeEnd(strokeId);
  };

  const handleFloodFill = (point: NormalizedPoint, color: string) => {
    sendFloodFill(point, color);
    const fillStroke: DrawStroke = {
      id: `fill-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tool: 'fill',
      color,
      size: 1,
      points: [point],
      isFill: true,
      fillPoint: point,
    };
    setRoomState((prev) => {
      if (!prev) return null;
      return { ...prev, drawingStrokes: [...prev.drawingStrokes, fillStroke] };
    });
  };

  const handleUndo = () => {
    sendUndo();
  };

  const handleRedo = () => {
    sendRedo();
  };

  const handleClear = () => {
    sendClearCanvas();
  };

  const handleSendMessage = (text: string) => {
    sendChat(text);
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
  const currentDrawer = roomState?.players.find((p) => p.id === roomState.currentDrawerId);
  const isDrawer = Boolean(currentDrawer && currentDrawer.id === localPlayer.id);
  const meInRoom = roomState?.players.find((p) => p.id === localPlayer.id);
  const hasGuessed = Boolean(meInRoom?.hasGuessed);

  // 1. If not in a room, show Entry profile / join / create screen
  if (!roomState) {
    return (
      <div className="relative min-h-screen bg-[#050A18] text-white flex flex-col justify-center overflow-x-hidden">
        <PinturilloBackground />

        {/* Reconnecting banner */}
        {connectionStatus === 'reconnecting' && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-amber-500/90 text-slate-950 font-black text-xs sm:text-sm shadow-xl flex items-center gap-2 animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>RECONECTANDO CON LA PARTIDA...</span>
          </div>
        )}

        {/* Failed Connection Modal */}
        {connectionStatus === 'error' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="max-w-md w-full bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 text-center shadow-2xl space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center">
                <WifiOff className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black font-display uppercase tracking-wide text-white">
                NO SE HA PODIDO CONECTAR
              </h3>
              <p className="text-sm text-slate-300">
                No hemos podido conectar con la partida. Comprueba tu conexión e inténtalo de nuevo.
              </p>
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={onBackToMenu}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-all cursor-pointer"
                >
                  VOLVER AL MENÚ
                </button>
                <button
                  type="button"
                  onClick={retryConnection}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#00BCEB] hover:bg-cyan-400 text-slate-950 font-black text-sm transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>REINTENTAR</span>
                </button>
              </div>
            </div>
          </div>
        )}

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
            errorMessage={errorMessage}
          />
        </div>
      </div>
    );
  }

  // 2. If in LOBBY phase
  if (roomState.phase === 'LOBBY') {
    return (
      <div className="relative min-h-screen bg-[#050A18] text-white flex flex-col justify-center overflow-x-hidden">
        <PinturilloBackground />

        {/* Reconnecting banner */}
        {connectionStatus === 'reconnecting' && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-amber-500/90 text-slate-950 font-black text-xs sm:text-sm shadow-xl flex items-center gap-2 animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>RECONECTANDO CON LA SALA...</span>
          </div>
        )}

        {/* Failed Connection Modal */}
        {connectionStatus === 'error' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="max-w-md w-full bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 text-center shadow-2xl space-y-4">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center">
                <WifiOff className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black font-display uppercase tracking-wide text-white">
                NO SE HA PODIDO CONECTAR
              </h3>
              <p className="text-sm text-slate-300">
                No hemos podido conectar con la partida. Comprueba tu conexión e inténtalo de nuevo.
              </p>
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={handleLeaveRoom}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-all cursor-pointer"
                >
                  VOLVER AL MENÚ
                </button>
                <button
                  type="button"
                  onClick={retryConnection}
                  className="flex-1 py-3 px-4 rounded-xl bg-[#00BCEB] hover:bg-cyan-400 text-slate-950 font-black text-sm transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>REINTENTAR</span>
                </button>
              </div>
            </div>
          </div>
        )}

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
    <div className="relative h-screen max-h-screen bg-[#050A18] text-white flex flex-col overflow-hidden select-none">
      <PinturilloBackground />

      {/* Reconnecting banner during active gameplay */}
      {connectionStatus === 'reconnecting' && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-amber-500/90 text-slate-950 font-black text-xs sm:text-sm shadow-xl flex items-center gap-2 animate-pulse">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>RECONECTANDO... TUS DIBUJOS Y PUNTOS ESTÁN A SALVO</span>
        </div>
      )}

      {/* Failed Connection Modal */}
      {connectionStatus === 'error' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="max-w-md w-full bg-slate-900 border-2 border-slate-700 rounded-3xl p-6 text-center shadow-2xl space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center">
              <WifiOff className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-black font-display uppercase tracking-wide text-white">
              NO SE HA PODIDO CONECTAR
            </h3>
            <p className="text-sm text-slate-300">
              No hemos podido conectar con la partida. Comprueba tu conexión e inténtalo de nuevo.
            </p>
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={handleLeaveRoom}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-all cursor-pointer"
              >
                VOLVER AL MENÚ
              </button>
              <button
                type="button"
                onClick={retryConnection}
                className="flex-1 py-3 px-4 rounded-xl bg-[#00BCEB] hover:bg-cyan-400 text-slate-950 font-black text-sm transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>REINTENTAR</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Countdown 3, 2, 1, ¡A DIBUJAR! Overlay */}
      {countdownInfo && (roomState.phase === 'COUNTDOWN' || roomState.phase === 'DRAWING') && (
        <div
          id="pinturillo-countdown-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md pointer-events-none transition-all duration-300"
        >
          <div className="text-center max-w-lg mx-auto">
            {countdownInfo.count > 0 ? (
              <div key={`cd-${countdownInfo.count}`} className="animate-countdown-pop">
                <span className="inline-block text-8xl sm:text-9xl font-black font-display text-[#00BCEB] drop-shadow-[0_10px_35px_rgba(0,188,235,0.5)]">
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

      {/* MATCH ABORTED MODAL */}
      <MatchAbortedModal
        isOpen={roomState.phase === 'MATCH_ABORTED'}
        title="PARTIDA FINALIZADA"
        message={
          roomState.endMessage ||
          roomState.abortReason ||
          'La partida no puede continuar por falta de jugadores suficientes.'
        }
        onReturnToMenu={handleLeaveRoom}
      />

      {/* Top Header Navigation & Status Bar */}
      <header className="flex-shrink-0 relative z-20 px-3 sm:px-6 py-2.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-md">
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
                  ? 'bg-[#00BCEB]/20 border-[#00BCEB]/50 text-cyan-300 shadow-sm'
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
              <span className="text-xs font-black text-[#00BCEB]">
                Vuelta {roomState.currentVuelta}/{roomState.config.totalVueltas}
              </span>
            </div>
          </div>

          {/* Center: Secret Word (Drawer) or Hint (Guesser) */}
          <div className="flex-1 flex items-center justify-center max-w-xl mx-2">
            {isDrawer && roomState.secretWord ? (
              <div className="flex flex-col items-center bg-[#00BCEB]/15 border-2 border-[#00BCEB]/60 px-4 sm:px-6 py-1.5 rounded-2xl shadow-[0_0_20px_rgba(0,188,235,0.2)]">
                <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-black uppercase text-[#00BCEB]">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Tu palabra secreta (¡Solo la ves tú!)</span>
                  {roomState.wordCategory && (
                    <span className="ml-1 px-2 py-0.5 rounded-full bg-slate-900/80 text-[#00BCEB] text-[10px] font-bold border border-slate-700">
                      {roomState.wordCategory}
                    </span>
                  )}
                </div>
                <span className="text-xl sm:text-3xl font-black font-display tracking-widest text-white uppercase drop-shadow-md">
                  {roomState.secretWord}
                </span>
              </div>
            ) : (() => {
                const hintGroups = parseWordHintToGroups(
                  roomState.hintWords,
                  roomState.wordHint
                );
                const wordsCount = hintGroups.length;
                const letterCount =
                  roomState.wordLength ||
                  hintGroups.reduce(
                    (acc, g) => acc + g.filter((s) => s.type === 'letter').length,
                    0
                  );

                return (
                  <div className="flex flex-col items-center bg-[#070b18]/90 border-2 border-slate-700/80 px-3 sm:px-5 py-1.5 rounded-2xl shadow-inner max-w-full">
                    <div className="flex items-center gap-2 text-[10px] sm:text-xs font-black uppercase text-slate-400 mb-1">
                      <span className="text-slate-300">
                        {roomState.config.hintsEnabled ? '💡 Con pistas' : '🔒 Sin pistas'}{' '}
                        ({wordsCount > 1 ? `${wordsCount} palabras • ${letterCount} letras` : `${letterCount} letras`})
                      </span>
                      {roomState.wordCategory && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[#00BCEB] font-bold text-[10px]">
                          {roomState.wordCategory}
                        </span>
                      )}
                    </div>

                    {/* Word groups with visible spacing between words */}
                    <div className="flex flex-wrap items-center justify-center gap-x-3.5 sm:gap-x-5 gap-y-2 max-w-full">
                      {hintGroups.map((wordGroup, wordIndex) => (
                        <div
                          key={`word-${wordIndex}`}
                          className="flex items-center gap-1 sm:gap-1.5 flex-nowrap"
                        >
                          {wordGroup.map((slot, slotIndex) => {
                            if (slot.type === 'punctuation') {
                              return (
                                <span
                                  key={`punct-${wordIndex}-${slotIndex}`}
                                  className="w-3.5 sm:w-4 h-7 sm:h-8 flex items-center justify-center font-black font-mono text-base sm:text-xl text-slate-400 select-none"
                                >
                                  {slot.char}
                                </span>
                              );
                            }

                            const isLetter = slot.isRevealed && slot.char !== '';
                            return (
                              <span
                                key={`slot-${wordIndex}-${slotIndex}-${slot.char}`}
                                className={`w-7 h-8 sm:w-8 sm:h-9 flex items-center justify-center rounded-lg font-black font-mono text-base sm:text-lg uppercase transition-all select-none ${
                                  isLetter
                                    ? 'bg-[#00BCEB]/25 border-2 border-[#00BCEB] text-[#00BCEB] shadow-[0_0_8px_rgba(0,188,235,0.5)] animate-letter-pop'
                                    : 'bg-slate-800/80 border border-slate-700 text-slate-500'
                                }`}
                              >
                                {isLetter ? slot.char : ''}
                              </span>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
          </div>

          {/* Right: Round Timer with multi-tier playful colors */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-2xl border-2 transition-all ${
                isTimeCritical
                  ? 'bg-rose-500/20 border-[#FF6B6B] text-rose-300 shadow-[0_0_15px_rgba(255,107,107,0.4)] animate-pulse'
                  : roomState.remainingTime <= 25
                  ? 'bg-amber-500/15 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.25)]'
                  : 'bg-[#070b18]/90 border-[#00BCEB]/60 text-cyan-200'
              }`}
            >
              <Clock
                className={`w-4 h-4 ${
                  isTimeCritical
                    ? 'text-[#FF6B6B] animate-spin'
                    : roomState.remainingTime <= 25
                    ? 'text-amber-400'
                    : 'text-[#00BCEB]'
                }`}
              />
              <span className="font-mono font-black text-sm sm:text-base">
                {roomState.remainingTime}s
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Game Stage: 80% Canvas + 20% Chat Layout */}
      <main className="relative z-10 flex-1 min-h-0 p-2 sm:p-3 md:p-4 max-w-7xl w-full mx-auto flex flex-col lg:flex-row gap-3 overflow-hidden">
        {/* Left / Center: Canvas Stage & Toolbar (~80% area) */}
        <section className="flex-1 min-h-0 flex flex-col gap-2 overflow-hidden">
          {/* Canvas Header info: Active drawer label */}
          <div className="flex-shrink-0 flex items-center justify-between px-2 text-xs">
            <div className="flex items-center gap-2 sm:gap-3">
              <div
                className={`flex items-center gap-2 px-3 py-1 rounded-xl border font-bold text-xs sm:text-sm shadow-sm ${
                  isDrawer
                    ? 'bg-[#00BCEB] text-slate-950 border-cyan-300 font-black shadow-[0_0_12px_rgba(0,188,235,0.35)]'
                    : 'bg-slate-800/90 text-slate-200 border-slate-700'
                }`}
              >
                <span className="text-base">{currentDrawer?.avatar || '🎨'}</span>
                <span>
                  {isDrawer
                    ? '¡Estás dibujando tú!'
                    : `Dibujando: ${currentDrawer?.name || 'Compañero'}`}
                </span>
              </div>

              {roomState.wordCategory && (
                <span className="hidden sm:inline-block px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-semibold">
                  Categoría: <strong className="text-[#00BCEB]">{roomState.wordCategory}</strong>
                </span>
              )}
            </div>

            {hasGuessed && !isDrawer && (
              <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-[#4ADE80] font-black text-xs border border-emerald-500/50 shadow-sm flex items-center gap-1.5 animate-guess-sparkle">
                <span>✓</span>
                <span>¡Acertaste la palabra!</span>
              </span>
            )}
          </div>

          {/* The Hero White Canvas Element */}
          <div className="flex-1 min-h-0 w-full relative rounded-2xl overflow-hidden shadow-2xl">
            <PinturilloCanvas
              roundId={roomState.roundId}
              isDrawer={isDrawer && isDrawing}
              strokes={roomState.drawingStrokes}
              currentTool={currentTool}
              currentColor={currentColor}
              currentSize={currentSize}
              isClearConfirmOpen={isClearConfirmOpen}
              onConfirmClear={() => {
                setIsClearConfirmOpen(false);
                handleClear();
              }}
              onCancelClear={() => setIsClearConfirmOpen(false)}
              onStrokeStart={handleStrokeStart}
              onStrokeChunk={handleStrokeChunk}
              onStrokeEnd={handleStrokeEnd}
              onFloodFill={handleFloodFill}
            />
          </div>

          {/* Drawer Toolbar (Only visible to active drawer during DRAWING phase) */}
          {isDrawer && isDrawing && (
            <div className="flex-shrink-0 animate-fade-in">
              <PinturilloToolbar
                currentTool={currentTool}
                currentColor={currentColor}
                currentSize={currentSize}
                onSelectTool={setCurrentTool}
                onSelectColor={setCurrentColor}
                onSelectSize={setCurrentSize}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onRequestClear={() => setIsClearConfirmOpen(true)}
              />
            </div>
          )}
        </section>

        {/* Right Column: Chat & Guess Box (~20% desktop area) */}
        <aside className="w-full lg:w-80 xl:w-96 h-64 sm:h-72 lg:h-full min-h-0 flex-shrink-0 flex flex-col overflow-hidden">
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
