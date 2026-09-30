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
    interactIncident,
    lastResolvedMalfunction,
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
        <div className="fortunarium-root font-fortunarium fort-lobby-bg relative min-h-screen w-full">
          {notification && (
            <div className="fixed top-4 inset-x-4 max-w-md mx-auto z-50 p-3 rounded-2xl bg-[#09111C]/95 border border-[#FF2A6D]/60 text-pink-100 text-xs font-bold shadow-[0_0_25px_rgba(255,42,109,0.3)] flex items-center gap-2 backdrop-blur-md">
              <Bell className="w-4 h-4 text-[#FF2A6D] shrink-0" />
              <span>{notification.text}</span>
            </div>
          )}

          {errorMessage && (
            <div className="fixed top-16 inset-x-4 max-w-md mx-auto z-50 p-3 rounded-2xl bg-rose-950/95 border border-rose-500/60 text-rose-200 text-xs font-bold shadow-2xl flex items-center gap-2 backdrop-blur-md">
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
        onInteractIncident={interactIncident}
        lastResolvedMalfunction={lastResolvedMalfunction}
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
    <div className="fortunarium-root font-fortunarium fort-lobby-bg fixed inset-0 w-screen h-screen flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100 select-none overflow-hidden z-50">
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
        <button
          type="button"
          onClick={handleLeaveAndBack}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#070B14]/90 hover:bg-[#0D1424] border border-[#FF2A6D]/45 hover:border-[#FF2A6D] text-slate-100 text-xs font-bold transition-all shadow-[0_0_16px_rgba(255,42,109,0.2)] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#FF2A6D]" />
          <span>Volver al Menú</span>
        </button>

        <button
          type="button"
          onClick={() => {
            fortunariumAudio.playButtonClick();
            setShowRulebook(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#070B14]/90 hover:bg-[#0D1424] border border-cyan-400/45 hover:border-cyan-400 text-cyan-200 text-xs font-black transition-all shadow-[0_0_16px_rgba(34,211,238,0.18)] cursor-pointer"
        >
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <span>Manual</span>
        </button>
      </div>

      <div className="relative z-10 w-full max-w-md fort-cyber-modal rounded-3xl p-6 sm:p-7 flex flex-col items-center gap-4">
        {/* Canonical Lobby Emoji Logo */}
        <div className="relative">
          <div className="absolute -inset-4 rounded-full bg-[#FF2A6D]/25 blur-xl pointer-events-none" />
          <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-b from-[#FF2A6D]/30 via-[#120A1A] to-[#050810] border-2 border-[#FF2A6D]/70 flex items-center justify-center shadow-[0_0_35px_rgba(255,42,109,0.4)]">
            <span className="text-5xl leading-none select-none" role="img" aria-label="Fortunarium">
              🎰
            </span>
          </div>
        </div>

        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FF2A6D]/15 border border-[#FF2A6D]/45 text-[10px] font-mono font-black uppercase tracking-widest text-[#FF7AA2] mb-1">
            SISTEMA COOPERATIVO · 1–4 OPERADORES
          </div>
          <h1 className="text-2xl sm:text-3xl font-fortunarium text-white tracking-wider drop-shadow-[0_0_14px_rgba(255,42,109,0.55)]">
            FORTUNARIUM
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto leading-relaxed">
            Tragaperras industrial en tiempo real (1 a 4 jugadores). Juega en solitario o comparte la máquina con tus amigos.
          </p>
        </div>

        <div className="w-full flex flex-col gap-1.5">
          <label className="text-[11px] font-mono font-black uppercase tracking-wider text-cyan-300">
            Tu Nombre de Operador:
          </label>
          <div className="flex items-center gap-2">
            <div className="w-11 h-11 rounded-xl fort-crt-panel p-1.5 flex items-center justify-center shrink-0">
              <img
                src={FORTUNARIUM_SYMBOL_ASSETS.siete}
                alt="MONO"
                className="w-full h-full object-contain"
              />
            </div>
            <input
              type="text"
              value={nameInput}
              maxLength={20}
              onChange={(e) => handleUpdateName(e.target.value)}
              placeholder="Tu apodo"
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#050811] border border-slate-700/80 focus:border-[#FF2A6D] focus:shadow-[0_0_14px_rgba(255,42,109,0.3)] text-sm font-bold text-white outline-none transition-all"
            />
          </div>
        </div>

        {/* Cursor Color Selector */}
        <div className="w-full flex flex-col gap-1.5">
          <label className="text-[11px] font-mono font-black uppercase tracking-wider text-cyan-300">
            Color de tu Cursor en Tiempo Real:
          </label>
          <div className="flex items-center justify-between gap-1.5 p-2 rounded-xl fort-crt-panel">
            {FORTUNARIUM_CURSOR_COLORS.map((c) => {
              const selected = player.color.toLowerCase() === c.hex.toLowerCase();
              return (
                <button
                  key={c.id}
                  type="button"
                  title={c.label}
                  onClick={() => handleSelectColor(c.hex)}
                  style={{ backgroundColor: c.hex }}
                  className={`w-7 h-7 rounded-full transition-all cursor-pointer flex items-center justify-center relative z-10 ${
                    selected
                      ? 'ring-2 ring-white scale-110 shadow-[0_0_12px_rgba(255,255,255,0.75)]'
                      : 'opacity-75 hover:opacity-100'
                  }`}
                >
                  {selected && <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="w-full flex p-1 rounded-xl bg-[#050811] border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'bg-[#FF2A6D] text-white shadow-[0_0_16px_rgba(255,42,109,0.45)] font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Crear Sala
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'join'
                ? 'bg-[#FF2A6D] text-white shadow-[0_0_16px_rgba(255,42,109,0.45)] font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Unirse con Código
          </button>
        </div>

        {(errorMessage || localError) && (
          <div className="w-full p-3 rounded-xl bg-rose-950/80 border border-rose-500/60 text-xs font-semibold text-rose-200 flex items-center gap-2">
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
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#FF2A6D] via-[#E01E5A] to-[#FF2A6D] hover:from-[#FF4782] hover:to-[#FF2A6D] border border-[#FF7AA2]/50 text-white font-black text-sm uppercase tracking-wider transition-all shadow-[0_8px_28px_rgba(255,42,109,0.4)] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>
                {connectionStatus === 'connecting'
                  ? 'Encendiendo máquina...'
                  : 'Abrir Sala de Fortunarium'}
              </span>
            </button>
            <p className="text-[11px] text-slate-400 text-center">
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
              className="w-full px-4 py-3 rounded-xl fort-crt-display border border-cyan-400/40 text-center font-mono font-black text-lg tracking-widest text-cyan-300 outline-none focus:border-[#FF2A6D] uppercase placeholder:text-slate-600"
            />
            <button
              type="button"
              onClick={handleJoin}
              disabled={connectionStatus === 'connecting' || !inputCode.trim()}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#FF2A6D] via-[#E01E5A] to-[#FF2A6D] hover:from-[#FF4782] hover:to-[#FF2A6D] border border-[#FF7AA2]/50 text-white font-black text-sm uppercase tracking-wider transition-all shadow-[0_8px_28px_rgba(255,42,109,0.4)] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50"
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
