import React, { useState } from 'react';
import { useFortunariumSocket } from '../../hooks/useFortunariumSocket';
import { FortunariumLobby } from './FortunariumLobby';
import { FortunariumMachineView } from './FortunariumMachineView';
import { PlayerProfile } from '../../services/multiplayerRoomService';
import {
  FORTUNARIUM_SYMBOL_ASSETS,
  FORTUNARIUM_CURSOR_COLORS,
} from '../../data/fortunarium/fortunariumAssets';
import { ArrowLeft, Play, LogIn, AlertCircle, Bell, Check, BookOpen } from 'lucide-react';
import { fortunariumAudio } from '../../utils/fortunariumAudio';
import { FortunariumRulebookModal } from './FortunariumRulebookModal';

interface FortunariumGameProps {
  onBackToMenu: () => void;
  initialRoomCode?: string;
  onSwitchGame?: (game: any, code: string) => void;
}

const PLAYER_ID_KEY = 'fam2play_fortunarium_player_id';
const PLAYER_NAME_KEY = 'fam2play_fortunarium_player_name';
const PLAYER_COLOR_KEY = 'fam2play_fortunarium_player_color';

export const FortunariumGame: React.FC<FortunariumGameProps> = ({
  onBackToMenu,
  initialRoomCode = '',
  onSwitchGame,
}) => {
  const [player, setPlayer] = useState<PlayerProfile>(() => {
    let id = '';
    let name = 'Operador';
    let color = '#22d3ee';
    try {
      id = localStorage.getItem(PLAYER_ID_KEY) || '';
      if (!id) {
        id = `fort_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        localStorage.setItem(PLAYER_ID_KEY, id);
      }
      const savedName = localStorage.getItem(PLAYER_NAME_KEY);
      if (savedName) name = savedName;
      const savedColor = localStorage.getItem(PLAYER_COLOR_KEY);
      if (savedColor) color = savedColor;
    } catch {
      id = `fort_${Date.now()}`;
    }

    return {
      id,
      name,
      avatar: '🎰',
      color,
    };
  });

  const [inputCode, setInputCode] = useState(initialRoomCode);
  const [nameInput, setNameInput] = useState(player.name);
  const [activeTab, setActiveTab] = useState<'create' | 'join'>(
    initialRoomCode ? 'join' : 'create'
  );
  const [localError, setLocalError] = useState<string | null>(null);
  const [showRulebook, setShowRulebook] = useState(false);

  const {
    connectionStatus,
    roomState,
    errorMessage,
    notification,
    spinEvent,
    subscribeToCursors,
    sendCursorMove,
    setCursorColor,
    createRoom,
    joinRoom,
    leaveRoom,
    updateConfig,
    startGame,
    setBetMode,
    spinSlot,
    devGrantModifier,
    resolveIncident,
    dismissRoulette,
    devTriggerIncident,
    devTriggerRoulette,
    devSetIntegrity,
    devForceOverdrive,
    repairMachine,
    buyUpgrade,
    voteUpgrade,
    resolveEvent,
    payQuotaEarly,
    nextRound,
    restartMatch,
    returnToLobby,
  } = useFortunariumSocket({
    player,
    initialRoomCode,
    onWrongGame: (actualGame, code) => {
      if (onSwitchGame) {
        onSwitchGame(actualGame, code);
      }
    },
  });

  const handleUpdateName = (newName: string) => {
    setNameInput(newName);
    const trimmed = newName.trim();
    if (!trimmed) return;
    setPlayer((prev) => {
      const updated = { ...prev, name: trimmed };
      try {
        localStorage.setItem(PLAYER_NAME_KEY, trimmed);
      } catch {}
      return updated;
    });
  };

  const handleSelectColor = (hex: string) => {
    fortunariumAudio.playButtonClick();
    setPlayer((prev) => {
      const updated = { ...prev, color: hex };
      try {
        localStorage.setItem(PLAYER_COLOR_KEY, hex);
      } catch {}
      return updated;
    });
    if (roomState) {
      setCursorColor(hex);
    }
  };

  const handleCreate = async () => {
    try {
      fortunariumAudio.playButtonClick();
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
      fortunariumAudio.playButtonClick();
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

  if (roomState) {
    if (roomState.phase === 'LOBBY') {
      return (
        <div className="fortunarium-root font-fortunarium relative min-h-screen w-full bg-[#09060e]">
          {notification && (
            <div className="fixed top-4 inset-x-4 max-w-md mx-auto z-50 p-3 rounded-2xl bg-amber-950/95 border border-amber-500/50 text-amber-200 text-xs font-bold shadow-2xl flex items-center gap-2 backdrop-blur-md">
              <Bell className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{notification.text}</span>
            </div>
          )}

          {errorMessage && (
            <div className="fixed top-16 inset-x-4 max-w-md mx-auto z-50 p-3 rounded-2xl bg-rose-950/95 border border-rose-500/50 text-rose-200 text-xs font-bold shadow-2xl flex items-center gap-2 backdrop-blur-md">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <FortunariumLobby
            roomState={roomState}
            localPlayerId={player.id}
            onUpdateConfig={updateConfig}
            onSetCursorColor={handleSelectColor}
            onStartGame={startGame}
            onLeaveRoom={handleLeaveAndBack}
          />
        </div>
      );
    }

    return (
      <FortunariumMachineView
        roomState={roomState}
        localPlayerId={player.id}
        spinEvent={spinEvent}
        errorMessage={errorMessage}
        subscribeToCursors={subscribeToCursors}
        onSendCursorMove={sendCursorMove}
        onSetCursorColor={handleSelectColor}
        onSetBetMode={setBetMode}
        onSpinSlot={spinSlot}
        onDevGrantModifier={devGrantModifier}
        onResolveIncident={resolveIncident}
        onDismissRoulette={dismissRoulette}
        onDevTriggerIncident={devTriggerIncident}
        onDevTriggerRoulette={devTriggerRoulette}
        onDevSetIntegrity={devSetIntegrity}
        onDevForceOverdrive={devForceOverdrive}
        onRepairMachine={repairMachine}
        onBuyUpgrade={buyUpgrade}
        onVoteUpgrade={voteUpgrade}
        onResolveEvent={resolveEvent}
        onPayQuotaEarly={payQuotaEarly}
        onNextRound={nextRound}
        onRestartMatch={restartMatch}
        onReturnToLobby={returnToLobby}
        onLeaveRoom={handleLeaveAndBack}
      />
    );
  }

  return (
    <div className="fortunarium-root font-fortunarium fixed inset-0 w-screen h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-[#09060e] text-stone-100 select-none overflow-hidden z-50">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.15),transparent_70%)] pointer-events-none" />

      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
        <button
          type="button"
          onClick={handleLeaveAndBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-amber-500/30 text-stone-200 text-xs font-bold transition-colors shadow-lg cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-amber-400" />
          <span>Volver al Menú</span>
        </button>

        <button
          type="button"
          onClick={() => {
            fortunariumAudio.playButtonClick();
            setShowRulebook(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-stone-900/90 hover:bg-stone-800 border border-amber-500/35 text-amber-200 text-xs font-black transition-colors shadow-lg cursor-pointer"
        >
          <BookOpen className="w-4 h-4 text-amber-400" />
          <span>Manual</span>
        </button>
      </div>

      <div className="relative z-10 w-full max-w-md bg-stone-950/90 border border-amber-500/40 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-md flex flex-col items-center gap-4">
        {/* Canonical Lobby Emoji Logo */}
        <div className="relative">
          <div className="absolute -inset-4 rounded-full bg-amber-500/20 blur-xl pointer-events-none" />
          <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-b from-amber-500/25 to-stone-950 border border-amber-400/50 flex items-center justify-center shadow-[0_0_35px_rgba(245,158,11,0.3)]">
            <span className="text-5xl leading-none select-none" role="img" aria-label="Fortunarium">
              🎰
            </span>
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-fortunarium text-amber-300 tracking-wider">
            FORTUNARIUM
          </h1>
          <p className="text-xs text-stone-300 mt-1 max-w-xs mx-auto leading-relaxed">
            Tragaperras en tiempo real (1 a 4 jugadores). Juega en solitario o comparte la máquina con tus amigos.
          </p>
        </div>

        <div className="w-full flex flex-col gap-1.5">
          <label className="text-xs font-bold text-stone-300">
            Tu Nombre de Operador:
          </label>
          <div className="flex items-center gap-2">
            <div className="w-11 h-11 rounded-xl bg-stone-900 border border-amber-500/30 p-1.5 flex items-center justify-center shrink-0">
              <img
                src={FORTUNARIUM_SYMBOL_ASSETS.siete}
                alt="Siete"
                className="w-full h-full object-contain"
              />
            </div>
            <input
              type="text"
              value={nameInput}
              maxLength={20}
              onChange={(e) => handleUpdateName(e.target.value)}
              placeholder="Tu apodo"
              className="flex-1 px-4 py-2.5 rounded-xl bg-stone-900 border border-stone-700 focus:border-amber-500 text-sm font-bold text-white outline-none transition-all"
            />
          </div>
        </div>

        {/* Cursor Color Selector */}
        <div className="w-full flex flex-col gap-1.5">
          <label className="text-xs font-bold text-stone-300">
            Color de tu Cursor en Tiempo Real:
          </label>
          <div className="flex items-center justify-between gap-1.5 p-2 rounded-xl bg-stone-900/90 border border-stone-800">
            {FORTUNARIUM_CURSOR_COLORS.map((c) => {
              const selected = player.color.toLowerCase() === c.hex.toLowerCase();
              return (
                <button
                  key={c.id}
                  type="button"
                  title={c.label}
                  onClick={() => handleSelectColor(c.hex)}
                  style={{ backgroundColor: c.hex }}
                  className={`w-7 h-7 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                    selected
                      ? 'ring-2 ring-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.6)]'
                      : 'opacity-75 hover:opacity-100'
                  }`}
                >
                  {selected && <Check className="w-3.5 h-3.5 text-stone-950 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="w-full flex p-1 rounded-xl bg-stone-900 border border-stone-800">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'bg-amber-500 text-stone-950 shadow-md font-black'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Crear Sala
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'join'
                ? 'bg-amber-500 text-stone-950 shadow-md font-black'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Unirse con Código
          </button>
        </div>

        {(errorMessage || localError) && (
          <div className="w-full p-3 rounded-xl bg-rose-950/70 border border-rose-600/60 text-xs font-semibold text-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage || localError}</span>
          </div>
        )}

        {activeTab === 'create' ? (
          <div className="w-full flex flex-col gap-2.5">
            <button
              type="button"
              onClick={handleCreate}
              disabled={connectionStatus === 'connecting'}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-stone-950 font-black text-sm uppercase tracking-wider transition-all shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>
                {connectionStatus === 'connecting'
                  ? 'Encendiendo máquina...'
                  : 'Abrir Sala de Fortunarium'}
              </span>
            </button>
            <p className="text-[11px] text-stone-400 text-center">
              Comparte el código de 5 letras con 1 a 3 amigos para operar la misma tragaperras.
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
              className="w-full px-4 py-3 rounded-xl bg-stone-900 border border-stone-700 text-center font-mono font-black text-lg tracking-widest text-amber-300 outline-none focus:border-amber-500 uppercase placeholder:text-stone-600"
            />
            <button
              type="button"
              onClick={handleJoin}
              disabled={connectionStatus === 'connecting' || !inputCode.trim()}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-stone-950 font-black text-sm uppercase tracking-wider transition-all shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>
                {connectionStatus === 'connecting'
                  ? 'Conectando...'
                  : 'Unirse al Fortunarium'}
              </span>
            </button>
          </div>
        )}
      </div>

      {showRulebook && (
        <FortunariumRulebookModal isOpen={true} onClose={() => setShowRulebook(false)} />
      )}
    </div>
  );
};
