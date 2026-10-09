import React, { useState } from 'react';
import { useElPrecioJustoSocket } from '../../hooks/useElPrecioJustoSocket';
import { ElPrecioJustoLobby } from './ElPrecioJustoLobby';
import { ElPrecioJustoPlaceholder } from './ElPrecioJustoPlaceholder';
import { PlayerProfile } from '../../services/multiplayerRoomService';
import { ArrowLeft, Volume2, VolumeX, AlertTriangle } from 'lucide-react';
import { audio } from '../../utils/audio';

interface ElPrecioJustoGameProps {
  onBackToMenu: () => void;
  initialRoomCode?: string;
  onSwitchGame?: (game: any, code: string) => void;
}

const PLAYER_KEY = 'fam2play_precio_justo_player';

export const ElPrecioJustoGame: React.FC<ElPrecioJustoGameProps> = ({
  onBackToMenu,
  initialRoomCode = '',
  onSwitchGame,
}) => {
  const [player, setPlayer] = useState<PlayerProfile>(() => {
    try {
      const saved = localStorage.getItem(PLAYER_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}

    const defaultAvatars = ['💰', '💎', '🎩', '💼', '🏦', '⚖️', '🗝️', '📜'];
    const randomAvatar = defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];
    const newPlayer: PlayerProfile = {
      id: `p-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: 'Inversor',
      avatar: randomAvatar,
      color: '#10B981',
    };
    try {
      localStorage.setItem(PLAYER_KEY, JSON.stringify(newPlayer));
    } catch {}
    return newPlayer;
  });

  const [inputCode, setInputCode] = useState<string>(initialRoomCode);
  const [showLeaveModal, setShowLeaveModal] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => audio.getIsMuted());

  const handleUpdatePlayer = (updates: Partial<PlayerProfile>) => {
    setPlayer((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(PLAYER_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleToggleSound = () => {
    const next = audio.toggleMute();
    setIsMuted(next);
  };

  const {
    connectionStatus,
    roomState,
    errorMessage,
    createRoom,
    joinRoom,
    updateConfig,
    toggleReady,
    startGame,
    transferHost,
    kickPlayer,
    returnToLobby,
    leaveRoom,
  } = useElPrecioJustoSocket({
    player,
    initialRoomCode,
    enabled: true,
    onWrongGame: (actualGame, code) => {
      if (onSwitchGame) {
        onSwitchGame(actualGame, code);
      }
    },
  });

  const handleTopBack = () => {
    if (roomState) {
      setShowLeaveModal(true);
    } else {
      onBackToMenu();
    }
  };

  const handleConfirmLeave = () => {
    setShowLeaveModal(false);
    leaveRoom();
    onBackToMenu();
  };

  return (
    <div className="relative min-h-screen w-full bg-[#020e0a] text-slate-100 flex flex-col justify-between p-4 sm:p-6 overflow-x-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Luxury Emerald / Gold Atmospheric Backing */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-32 left-1/3 w-96 h-96 rounded-full bg-[#10B981]/10 blur-[130px]" />
        <div className="absolute bottom-0 right-1/3 w-96 h-96 rounded-full bg-[#F59E0B]/10 blur-[130px]" />
      </div>

      {/* Top Navigation */}
      <header className="relative z-10 flex items-center justify-between w-full max-w-5xl mx-auto pb-4">
        <button
          onClick={handleTopBack}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{roomState ? 'Salir de la mesa' : 'Volver al menú'}</span>
        </button>

        <div className="flex items-center gap-2">
          {connectionStatus === 'reconnecting' && (
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold animate-pulse border border-emerald-500/40">
              Reconectando...
            </span>
          )}
          <button
            onClick={handleToggleSound}
            className="p-2 rounded-full bg-black/40 hover:bg-black/60 border border-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Content Router */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center w-full">
        {!roomState || roomState.phase === 'LOBBY' ? (
          <ElPrecioJustoLobby
            roomState={roomState}
            player={player}
            inputCode={inputCode}
            isConnecting={connectionStatus === 'connecting'}
            errorMessage={errorMessage}
            onUpdatePlayer={handleUpdatePlayer}
            onSetInputCode={setInputCode}
            onCreateRoom={createRoom}
            onJoinRoom={joinRoom}
            onUpdateConfig={updateConfig}
            onToggleReady={toggleReady}
            onStartGame={startGame}
            onLeaveRoom={() => setShowLeaveModal(true)}
          />
        ) : (
          <ElPrecioJustoPlaceholder
            roomState={roomState}
            myPlayerId={player.id}
            onReturnToLobby={returnToLobby}
            onLeaveRoom={() => setShowLeaveModal(true)}
          />
        )}
      </main>

      {/* Footer Branding */}
      <footer className="relative z-10 text-center text-xs py-4 text-slate-500 max-w-5xl mx-auto w-full">
        EL PRECIO JUSTO &bull; FAM2PLAY Deducción Secreta de Patrimonio
      </footer>

      {/* Confirmation Leave Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-[#021b14] border-2 border-emerald-500/40 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-black uppercase text-white font-display">¿Abandonar la mesa?</h3>
            </div>
            <p className="text-sm text-slate-300">
              Si sales de la mesa, tu patrimonio y libreta serán cerrados. Podrás volver a entrar con el código mientras la partida siga activa.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowLeaveModal(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                Permanecer en la mesa
              </button>
              <button
                onClick={handleConfirmLeave}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Salir ahora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
