import React, { useState } from 'react';
import { useCantinaSocket } from '../../hooks/useCantinaSocket';
import { CantinaLobby } from './CantinaLobby';
import { CantinaTable } from './CantinaTable';
import { CantinaExitModal } from './CantinaExitModal';
import { PlayerProfile } from '../../services/multiplayerRoomService';
import { ArrowLeft, Play, LogIn, Users, AlertCircle, Bell } from 'lucide-react';

interface CantinaGameProps {
  onBackToMenu: () => void;
  initialRoomCode?: string;
  onSwitchGame?: (game: any, code: string) => void;
}

const PLAYER_ID_KEY = 'fam2play_cantina_player_id';
const PLAYER_NAME_KEY = 'fam2play_cantina_player_name';

export const CantinaGame: React.FC<CantinaGameProps> = ({
  onBackToMenu,
  initialRoomCode = '',
  onSwitchGame,
}) => {
  const [player, setPlayer] = useState<PlayerProfile>(() => {
    let id = '';
    let name = 'Tahonero';
    try {
      id = localStorage.getItem(PLAYER_ID_KEY) || '';
      if (!id) {
        id = `cantina_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        localStorage.setItem(PLAYER_ID_KEY, id);
      }
      const savedName = localStorage.getItem(PLAYER_NAME_KEY);
      if (savedName) name = savedName;
    } catch {
      id = `cantina_${Date.now()}`;
    }

    const avatars = ['🤠', '🥃', '🃏', '🎩', '🐺', '🦊', '🦅', '☠️'];
    const avatar = avatars[Math.floor(Math.random() * avatars.length)];

    return {
      id,
      name,
      avatar,
      color: '#eab308',
    };
  });

  const [inputCode, setInputCode] = useState(initialRoomCode);
  const [nameInput, setNameInput] = useState(player.name);
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create');
  const [localError, setLocalError] = useState<string | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);

  const {
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
  } = useCantinaSocket({
    player,
    initialRoomCode,
    onWrongGame: (actualGame, code) => {
      if (onSwitchGame) {
        onSwitchGame(actualGame, code);
      }
    },
  });

  const handleUpdateName = (newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setNameInput(trimmed);
    setPlayer((prev) => {
      const updated = { ...prev, name: trimmed };
      try {
        localStorage.setItem(PLAYER_NAME_KEY, trimmed);
      } catch {}
      return updated;
    });
  };

  const handleCreate = async () => {
    try {
      setLocalError(null);
      await createRoom();
    } catch (err: any) {
      setLocalError(err.message || 'Error al crear la sala');
    }
  };

  const handleJoin = async () => {
    if (!inputCode.trim()) {
      setLocalError('Introduce un código de sala');
      return;
    }
    try {
      setLocalError(null);
      await joinRoom(inputCode.trim().toUpperCase());
    } catch (err: any) {
      setLocalError(err.message || 'Error al unirse a la sala');
    }
  };

  const handleLeaveAndBack = () => {
    leaveRoom();
    onBackToMenu();
  };

  // If in a room, render lobby or game table
  if (roomState) {
    if (roomState.phase === 'LOBBY') {
      return (
        <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-[#0c0a09] z-50">
          {/* Notification banner if match was aborted back to lobby */}
          {notification && (
            <div className="absolute top-4 inset-x-4 max-w-md mx-auto z-50 p-3 rounded-2xl bg-amber-950/90 border border-amber-600/60 text-amber-200 text-xs font-bold shadow-2xl flex items-center gap-2 backdrop-blur-md animate-in slide-in-from-top-4 duration-300">
              <Bell className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{notification.text}</span>
            </div>
          )}

          <CantinaLobby
            roomState={roomState}
            localPlayerId={player.id}
            onUpdateConfig={updateConfig}
            onStartGame={startGame}
            onRequestLeave={() => setShowExitModal(true)}
          />

          <CantinaExitModal
            isOpen={showExitModal}
            isInMatch={false}
            onCancel={() => setShowExitModal(false)}
            onReturnToLobby={() => setShowExitModal(false)}
            onReturnToMainMenu={() => {
              setShowExitModal(false);
              handleLeaveAndBack();
            }}
          />
        </div>
      );
    }

    return (
      <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-[#0c0a09] z-50">
        <CantinaTable
          roomState={roomState}
          localPlayerId={player.id}
          remoteInteractions={remoteInteractions}
          cardPlayedEvent={cardPlayedEvent}
          dealCardsEvent={dealCardsEvent}
          rouletteSpinEvent={rouletteSpinEvent}
          onPlayCards={playCards}
          onChallengeBluff={challengeBluff}
          onPullTrigger={pullTrigger}
          onSpinCylinder={sendRouletteSpin}
          onTriggerRoulette={triggerRoulette}
          onNextRound={nextRound}
          onRequestRematch={requestRematch}
          onRestartMatch={restartMatch}
          onReturnToLobby={returnToLobby}
          onLeaveRoom={handleLeaveAndBack}
          onSendHandInteraction={sendHandInteraction}
        />
      </div>
    );
  }

  // Pre-room Entry screen (Create / Join) — Pure charcoal & amber noir, zero blue strip!
  return (
    <div className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-[#0c0a09] text-stone-100 font-sans select-none overflow-hidden z-50">
      {/* Background noir lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(217,119,6,0.12),transparent_70%)] pointer-events-none" />

      {/* Top return button */}
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={handleLeaveAndBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-stone-800 text-stone-300 text-xs font-bold transition-colors shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" /> Volver al Menú
        </button>
      </div>

      <div className="relative z-10 w-full max-w-md bg-stone-900/90 border border-amber-800/40 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md flex flex-col items-center gap-6">
        {/* Cantina Logo / Icon */}
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-600 via-amber-700 to-stone-900 border border-amber-500/50 flex items-center justify-center text-4xl shadow-2xl shadow-amber-600/30">
          🥃
        </div>

        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-black font-serif text-amber-200 tracking-wide">
            LA CANTINA DEL FAROL
          </h1>
          <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto leading-relaxed">
            Mesa de cartas clandestina. 2 a 4 jugadores. Faroles, sospechas y ruleta rusa.
          </p>
        </div>

        {/* Player Name Config */}
        <div className="w-full flex flex-col gap-1.5">
          <label className="text-xs font-bold text-stone-300 uppercase tracking-wider">
            Tu Nombre en la Cantina:
          </label>
          <div className="flex items-center gap-2">
            <span className="text-2xl p-2 rounded-xl bg-stone-950 border border-stone-800 shadow-inner">
              {player.avatar}
            </span>
            <input
              type="text"
              value={nameInput}
              maxLength={20}
              onChange={(e) => handleUpdateName(e.target.value)}
              placeholder="Tu apodo"
              className="flex-1 px-4 py-2.5 rounded-xl bg-stone-950 border border-stone-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm font-bold text-white outline-none transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Tab switch: Crear Sala / Unirse */}
        <div className="w-full flex p-1 rounded-xl bg-stone-950 border border-stone-800">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              activeTab === 'create'
                ? 'bg-amber-500 text-stone-950 shadow-md font-black'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Crear Mesa
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
              activeTab === 'join'
                ? 'bg-amber-500 text-stone-950 shadow-md font-black'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Unirse con Código
          </button>
        </div>

        {/* Error notice */}
        {(errorMessage || localError) && (
          <div className="w-full p-3 rounded-xl bg-rose-950/60 border border-rose-700/60 text-xs font-semibold text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage || localError}</span>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'create' ? (
          <div className="w-full flex flex-col gap-3">
            <button
              onClick={handleCreate}
              disabled={connectionStatus === 'connecting'}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-sm uppercase tracking-wider transition-all shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              <Play className="w-4 h-4 fill-current" />
              {connectionStatus === 'connecting' ? 'Preparando mesa...' : 'Abrir Mesa en la Cantina'}
            </button>
            <p className="text-[11px] text-stone-500 text-center">
              Podrás invitar de 1 a 3 amigos con tu código de sala.
            </p>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-3">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="CÓDIGO DE SALA"
              maxLength={6}
              className="w-full px-4 py-3 rounded-xl bg-stone-950 border border-stone-800 text-center font-mono font-black text-lg tracking-widest text-amber-400 outline-none focus:border-amber-500 uppercase placeholder:text-stone-600 shadow-inner"
            />
            <button
              onClick={handleJoin}
              disabled={connectionStatus === 'connecting' || !inputCode.trim()}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-sm uppercase tracking-wider transition-all shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <LogIn className="w-4 h-4" />
              {connectionStatus === 'connecting' ? 'Entrando a la mesa...' : 'Entrar a la Mesa'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
