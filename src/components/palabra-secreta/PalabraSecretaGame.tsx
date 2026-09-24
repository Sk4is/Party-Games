import React, { useState } from 'react';
import {
  PalabraSecretaConfig,
  PalabraSecretaRoomState,
} from '../../types/palabraSecreta';
import { PalabraSecretaEntry } from './PalabraSecretaEntry';
import { PalabraSecretaLobby } from './PalabraSecretaLobby';
import { PalabraSecretaPreTurn } from './PalabraSecretaPreTurn';
import { PalabraSecretaActiveTurn } from './PalabraSecretaActiveTurn';
import { PalabraSecretaTurnSummary } from './PalabraSecretaTurnSummary';
import { PalabraSecretaPodium } from './PalabraSecretaPodium';
import { AbandonConfirmationModal } from '../common/AbandonConfirmationModal';
import { usePalabraSecretaSocket } from '../../hooks/usePalabraSecretaSocket';
import { getOrCreateUserProfile, saveUserProfile } from '../../utils/userProfile';
import { audio } from '../../utils/audio';
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  Copy,
  Check,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  HelpCircle,
  X,
  Sparkles,
} from 'lucide-react';

interface PalabraSecretaGameProps {
  onBackToMenu: () => void;
  initialRoomCode?: string;
  onSwitchGame?: (
    actualGameType: 'la-bomba' | 'la-peor-respuesta' | 'pinturillo',
    roomCode: string
  ) => void;
}

export const PalabraSecretaGame: React.FC<PalabraSecretaGameProps> = ({
  onBackToMenu,
  initialRoomCode: propRoomCode,
  onSwitchGame,
}) => {
  const initialRoomCode =
    propRoomCode ||
    (typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('room') || ''
      : '');

  const [localPlayer, setLocalPlayer] = useState(() => {
    const saved = getOrCreateUserProfile();
    return {
      id: saved.id,
      name: saved.name || 'Jugador',
      avatar: saved.avatar || '🦊',
      color: saved.color || '#10b981',
    };
  });

  const [soundMuted, setSoundMuted] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const {
    connectionStatus,
    roomState,
    errorMessage,
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
    incrementClueCount,
    decrementClueCount,
    markPasswordGuessed,
    skipPasswordWord,
    finishPasswordTurn,
    chooseEmojiOption,
    updateEmojiClue,
    markEmojiGuessed,
    skipEmoji,
    nextTurn,
    playAgain,
    leaveRoom,
  } = usePalabraSecretaSocket({
    player: localPlayer,
    initialRoomCode,
    onWrongGame: (actualGame, code) => {
      if (onSwitchGame) {
        onSwitchGame(actualGame, code);
      }
    },
  });

  const handleCreateRoom = (
    player: { id: string; name: string; avatar: string; color: string },
    config?: Partial<PalabraSecretaConfig>
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

  const isHost = Boolean(roomState && roomState.hostId === localPlayer.id);
  const inActiveGame = Boolean(
    roomState &&
      (roomState.phase === 'ACTIVE_TURN' ||
        roomState.phase === 'PRE_TURN' ||
        roomState.phase === 'TURN_RESULTS')
  );

  const handleSoundToggle = () => {
    const nextMuted = !soundMuted;
    setSoundMuted(nextMuted);
    audio.setMuted(nextMuted);
  };

  const handleCopyCode = () => {
    if (!roomState?.code) return;
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(roomState.code);
      setCopiedCode(true);
      audio.playTurnChange();
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleBackClick = () => {
    if (roomState) {
      setShowExitConfirm(true);
    } else {
      handleConfirmExit();
    }
  };

  const handleConfirmExit = () => {
    leaveRoom();
    onBackToMenu();
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      {/* Responsive Top Bar / Navigation (Only when in active room) */}
      {roomState && (
        <header className="sticky top-0 z-30 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-2.5 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between min-w-0">
          {/* Left: Back Button & Game Badge */}
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            <button
              id="btn-back-palabra-secreta"
              type="button"
              onClick={handleBackClick}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-800 flex items-center justify-center shrink-0"
              title="Volver"
              aria-label="Volver"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <div className="flex items-center gap-1 sm:gap-2 min-w-0">
              <span className="text-lg sm:text-2xl shrink-0">🗣️</span>
              <div className="min-w-0">
                <div className="font-black text-xs sm:text-sm tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 font-display truncate">
                  PALABRA SECRETA
                </div>
                <div className="text-[10px] text-slate-400 font-semibold hidden sm:block">
                  Juego de palabras en equipo
                </div>
              </div>
            </div>
          </div>

          {/* Center: Room Code (if in room, desktop / tablet) */}
          {roomState?.code && (
            <button
              id="header-room-code-badge"
              type="button"
              onClick={handleCopyCode}
              className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-emerald-500/30 hover:border-emerald-500/60 transition-all cursor-pointer group shrink-0"
              title="Copiar código de sala"
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sala:</span>
              <span className="font-mono text-xs sm:text-sm font-black text-emerald-400">
                {roomState.code}
              </span>
              {copiedCode ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3 text-slate-500 group-hover:text-emerald-400" />
              )}
            </button>
          )}

          {/* Right: Sound toggle, Rules & User badge */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              id="btn-sound-toggle-palabra"
              type="button"
              onClick={handleSoundToggle}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-800 flex items-center justify-center shrink-0"
              title={soundMuted ? 'Activar sonido' : 'Silenciar sonido'}
              aria-label={soundMuted ? 'Activar sonido' : 'Silenciar sonido'}
            >
              {soundMuted ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
            </button>

            <button
              id="btn-how-to-play-header"
              type="button"
              onClick={() => setShowHowToPlay(true)}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-800 hidden sm:flex items-center gap-1 text-xs font-bold shrink-0"
              title="Cómo jugar"
            >
              <HelpCircle className="w-4 h-4 text-emerald-400" />
              <span>Reglas</span>
            </button>

            {/* User profile avatar pill */}
            <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
              <span className="text-base">{localPlayer.avatar}</span>
              <span className="text-xs font-bold text-slate-200 hidden md:inline max-w-[80px] truncate">
                {localPlayer.name}
              </span>
            </div>
          </div>
        </header>
      )}

      {/* Sub-bar for Room Code on mobile if present */}
      {roomState?.code && (
        <div className="md:hidden w-full bg-slate-900/90 border-b border-slate-800/80 px-3 py-1 flex items-center justify-between text-xs min-w-0">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Sala:</span>
          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-xs cursor-pointer active:scale-95"
          >
            <span>{roomState.code}</span>
            {copiedCode ? <Check className="w-3 h-3 text-emerald-400 stroke-[3]" /> : <Copy className="w-3 h-3 text-slate-400" />}
          </button>
        </div>
      )}

      {/* Reconnecting / Offline Banner */}
      {connectionStatus === 'reconnecting' && (
        <div className="w-full bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 flex items-center justify-center gap-2 text-amber-300 text-xs font-bold animate-pulse">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Reconectando con la partida...</span>
        </div>
      )}

      {connectionStatus === 'disconnected' && (
        <div className="w-full bg-rose-500/15 border-b border-rose-500/30 px-4 py-2 flex items-center justify-center gap-2 text-rose-300 text-xs font-bold">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Desconectado de la sala. Comprueba tu conexión a Internet.</span>
        </div>
      )}

      {/* Floating Action Alert Toast (+1 Acertada, Falta, etc.) */}
      {actionAlert && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-fade-in pointer-events-none">
          <div
            className={`px-4 py-2 rounded-2xl font-black text-sm shadow-2xl flex items-center gap-2 border ${
              actionAlert.action === 'GUESSED'
                ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                : actionAlert.action === 'TABOO'
                ? 'bg-rose-500 text-white border-rose-400'
                : 'bg-slate-800 text-slate-200 border-slate-700'
            }`}
          >
            <span>
              {actionAlert.action === 'GUESSED'
                ? `¡Acertada! (+${actionAlert.points} pto)`
                : actionAlert.action === 'TABOO'
                ? `¡Falta / Tabú! (${actionAlert.points} pto)`
                : 'Palabra pasada'}
            </span>
            <span className="opacity-80 uppercase text-xs font-bold">&bull; {actionAlert.word}</span>
          </div>
        </div>
      )}

      {/* Main Game Screen Router */}
      <main className="flex-1 flex flex-col w-full min-w-0 max-w-full">
        {!roomState ? (
          <PalabraSecretaEntry
            initialRoomCode={initialRoomCode}
            initialName={localPlayer.name}
            initialAvatar={localPlayer.avatar}
            initialColor={localPlayer.color}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onBackToMenu={onBackToMenu}
            errorMessage={errorMessage}
          />
        ) : roomState.phase === 'LOBBY' ? (
          <PalabraSecretaLobby
            roomState={roomState}
            localPlayer={localPlayer}
            isHost={isHost}
            onUpdateConfig={updateConfig}
            onSwitchTeam={switchTeam}
            onUpdateTeamName={updateTeamName}
            onRandomizeTeams={randomizeTeams}
            onStartGame={startGame}
            onLeaveRoom={handleConfirmExit}
            onOpenHowToPlay={() => setShowHowToPlay(true)}
          />
        ) : roomState.phase === 'PRE_TURN' ? (
          <PalabraSecretaPreTurn
            roomState={roomState}
            localPlayerId={localPlayer.id}
            onStartNow={startTurnNow}
          />
        ) : roomState.phase === 'ACTIVE_TURN' ? (
          <PalabraSecretaActiveTurn
            roomState={roomState}
            localPlayerId={localPlayer.id}
            onMarkGuessed={markGuessed}
            onSkipWord={skipWord}
            onMarkTaboo={markTaboo}
            onIncrementClueCount={incrementClueCount}
            onDecrementClueCount={decrementClueCount}
            onMarkPasswordGuessed={markPasswordGuessed}
            onSkipPasswordWord={skipPasswordWord}
            onFinishPasswordTurn={finishPasswordTurn}
            onChooseEmojiOption={chooseEmojiOption}
            onUpdateEmojiClue={updateEmojiClue}
            onMarkEmojiGuessed={markEmojiGuessed}
            onSkipEmoji={skipEmoji}
          />
        ) : roomState.phase === 'TURN_RESULTS' ? (
          <PalabraSecretaTurnSummary
            roomState={roomState}
            isHost={isHost}
            onNextTurn={nextTurn}
          />
        ) : roomState.phase === 'PODIUM' ? (
          <PalabraSecretaPodium
            roomState={roomState}
            isHost={isHost}
            onPlayAgain={playAgain}
            onExit={handleConfirmExit}
          />
        ) : roomState.phase === 'MATCH_ABORTED' ? (
          <div className="w-full max-w-md p-5 sm:p-8 rounded-3xl bg-slate-900 border-2 border-rose-500/50 shadow-2xl text-center space-y-4 sm:space-y-5 animate-fade-in mx-3">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto text-2xl sm:text-3xl">
              ⚠️
            </div>
            <div className="space-y-1.5 sm:space-y-2">
              <h2 className="text-xl sm:text-2xl font-black text-white font-display">Partida Cancelada</h2>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                {roomState.endMessage ||
                  'No quedan suficientes jugadores conectados para continuar la partida de Palabra Secreta.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleConfirmExit}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm tracking-wide transition-all shadow-lg shadow-emerald-500/25 active:scale-95 cursor-pointer"
            >
              Volver al Menú Principal
            </button>
          </div>
        ) : null}
      </main>

      {/* Abandon Confirmation Modal */}
      <AbandonConfirmationModal
        isOpen={showExitConfirm}
        onCancel={() => setShowExitConfirm(false)}
        onConfirm={handleConfirmExit}
        title="¿Abandonar la partida?"
        message={
          inActiveGame
            ? 'La partida está en curso. Si sales ahora, abandonarás la sala y tu equipo perderá un integrante activo.'
            : 'Saldrás de la sala multijugador y volverás al menú principal.'
        }
        cancelText="Continuar jugando"
        confirmText="Salir de la sala"
      />

      {/* How to Play Modal */}
      {showHowToPlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg p-4 xs:p-6 sm:p-8 rounded-3xl bg-slate-900 border-2 border-emerald-500/40 shadow-2xl space-y-4 sm:space-y-5 relative max-h-[90vh] overflow-y-auto min-w-0">
            <button
              type="button"
              onClick={() => setShowHowToPlay(false)}
              className="absolute top-3.5 right-3.5 p-1.5 sm:p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 pr-6 min-w-0">
              <span className="text-xl sm:text-2xl shrink-0">🗣️</span>
              <div className="min-w-0">
                <h3 className="text-base sm:text-xl font-black text-white font-display truncate">
                  Cómo Jugar a Palabra Secreta
                </h3>
                <span className="text-[11px] sm:text-xs text-emerald-400 font-bold block">Reglas oficiales del juego</span>
              </div>
            </div>

            <div className="space-y-2.5 sm:space-y-3.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1">
                <strong className="text-white font-bold block">1. Equipos y Turnos</strong>
                <p>
                  2 equipos (mínimo 2 jugadores por equipo). En cada turno, un miembro actúa como <strong>Descriptor</strong> (rota de forma justa cada ronda) y todos los demás miembros del equipo intentan adivinar simultáneamente.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1 text-emerald-300">
                <strong className="text-white font-bold block">🗣️ Modo 1: Clásico</strong>
                <p className="text-stone-300">
                  El descriptor ve la palabra secreta y palabras prohibidas. Debe explicar tantas como pueda antes de que se agote el tiempo. Los rivales vigilan como árbitros.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1 text-amber-300">
                <strong className="text-white font-bold block">🔑 Modo 2: Contraseña</strong>
                <p className="text-stone-300">
                  10 palabras objetivo y un presupuesto de 15 pistas verbales. El descriptor registra cada pista usada con los botones [+] y [-]. Resolver con ≤15 pistas otorga bonificación de eficiencia (hasta x1.5). Cada pista por encima de 15 resta 1 punto.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 space-y-1 text-cyan-300">
                <strong className="text-white font-bold block">😀 Modo 3: Emoji Misterioso</strong>
                <p className="text-stone-300">
                  El descriptor elige 1 de 3 títulos (cine o videojuegos) y compone una pista de hasta 5 emojis en directo. Su equipo adivina en voz alta. Pasar un título resta 1 punto a la puntuación del turno.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHowToPlay(false)}
              className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wide transition-all cursor-pointer"
            >
              ¡Entendido, a jugar!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
