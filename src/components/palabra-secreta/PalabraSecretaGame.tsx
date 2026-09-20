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
      {/* Responsive Top Bar / Navigation */}
      <header className="sticky top-0 z-30 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md px-3 sm:px-6 py-2.5 flex items-center justify-between">
        {/* Left: Back Button & Game Badge */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            id="btn-back-palabra-secreta"
            type="button"
            onClick={handleBackClick}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-800"
            title="Volver"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-2xl">🗣️</span>
            <div>
              <div className="font-black text-xs sm:text-sm tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 font-display">
                PALABRA SECRETA
              </div>
              <div className="text-[10px] text-slate-400 font-semibold hidden sm:block">
                Juego de palabras en equipo
              </div>
            </div>
          </div>
        </div>

        {/* Center: Room Code (if in room) */}
        {roomState?.code && (
          <button
            id="header-room-code-badge"
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-emerald-500/30 hover:border-emerald-500/60 transition-all cursor-pointer group"
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

        {/* Right: Sound toggle & User badge */}
        <div className="flex items-center gap-2">
          <button
            id="btn-sound-toggle-palabra"
            type="button"
            onClick={handleSoundToggle}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-800"
            title={soundMuted ? 'Activar sonido' : 'Silenciar sonido'}
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
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-800 hidden sm:flex items-center gap-1 text-xs font-bold"
            title="Cómo jugar"
          >
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <span>Reglas</span>
          </button>

          {/* User profile avatar pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-base">{localPlayer.avatar}</span>
            <span className="text-xs font-bold text-slate-200 hidden sm:inline max-w-[90px] truncate">
              {localPlayer.name}
            </span>
          </div>
        </div>
      </header>

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
      <main className="flex-1 flex flex-col justify-center items-center">
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
            onLeaveRoom={leaveRoom}
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
          <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900 border-2 border-rose-500/50 shadow-2xl text-center space-y-5 animate-fade-in mx-4">
            <div className="w-16 h-16 rounded-3xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto text-3xl">
              ⚠️
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white font-display">Partida Cancelada</h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                {roomState.endMessage ||
                  'No quedan suficientes jugadores conectados para continuar la partida de Palabra Secreta.'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleConfirmExit}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm tracking-wide transition-all shadow-lg shadow-emerald-500/25 active:scale-95 cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-slate-900 border-2 border-emerald-500/40 shadow-2xl space-y-5 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowHowToPlay(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-2xl">🗣️</span>
              <div>
                <h3 className="text-xl font-black text-white font-display">
                  Cómo Jugar a Palabra Secreta
                </h3>
                <span className="text-xs text-emerald-400 font-bold">Reglas oficiales del juego</span>
              </div>
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1">
                <strong className="text-white font-bold block">1. Equipos y Turnos</strong>
                <p>
                  Los jugadores se dividen en dos equipos (mínimo 2 jugadores por equipo). En cada turno, un miembro del equipo actúa como <strong>Descriptor</strong> y los demás como <strong>Adivinadores</strong>.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1">
                <strong className="text-white font-bold block">2. El Descriptor</strong>
                <p>
                  El descriptor ve la <strong>Palabra Secreta</strong> y una lista de <strong>Palabras Prohibidas</strong>. Debe explicar la palabra a sus compañeros usando pistas verbales sin pronunciar la palabra ni las prohibidas.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1">
                <strong className="text-white font-bold block">3. Adivinar y Puntuación</strong>
                <p>
                  Los compañeros gritan respuestas en voz alta. Cuando aciertan, el descriptor pulsa <strong>¡ACERTADA!</strong> (+1 punto). Si la palabra es muy difícil, puede <strong>PASAR</strong>. Si dice una palabra prohibida, debe pulsar <strong>FALTA / TABÚ</strong> (-1 punto).
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700 space-y-1">
                <strong className="text-white font-bold block">4. Papel de los Rivales (Árbitros)</strong>
                <p>
                  Los integrantes del equipo rival también pueden ver la palabra secreta en su pantalla para vigilar y arbitrar que no se hagan trampas ni se digan palabras prohibidas.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHowToPlay(false)}
              className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm uppercase tracking-wide transition-all cursor-pointer"
            >
              ¡Entendido, a jugar!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
