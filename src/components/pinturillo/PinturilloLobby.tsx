import React from 'react';
import { Play, Sparkles } from 'lucide-react';
import { PinturilloRoomState, PinturilloConfig } from '../../types/pinturillo';
import { audio } from '../../utils/audio';
import { GameLobbyLayout } from '../lobby/GameLobbyLayout';
import { RoomCode } from '../lobby/RoomCode';
import { PlayerList } from '../lobby/PlayerList';
import { PinturilloSettings } from '../lobby/GameSettings';

interface PinturilloLobbyProps {
  roomState: PinturilloRoomState;
  localPlayer: { id: string; name: string; avatar: string; color: string };
  isHost: boolean;
  onUpdateConfig: (config: Partial<PinturilloConfig>) => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

export const PinturilloLobby: React.FC<PinturilloLobbyProps> = ({
  roomState,
  localPlayer,
  isHost,
  onUpdateConfig,
  onStartGame,
  onLeaveRoom,
}) => {
  const canStart = roomState.players.length >= 2;

  const handleStart = () => {
    if (!canStart) return;
    audio.playGameStart();
    onStartGame();
  };

  return (
    <GameLobbyLayout
      title="Pinturillo"
      icon="🎨"
      description="Dibuja la palabra secreta mientras tus amigos intentan adivinarla antes de que se acabe el tiempo."
      minPlayers={2}
      maxPlayers={10}
      gameType="pinturillo"
      onBack={onLeaveRoom}
      backLabel="Salir de la sala"
      roomCode={roomState.code}
      isOnlineLobby={true}
    >
      {/* 1. Room Code & Share */}
      <RoomCode
        code={roomState.code}
        gameSlug="pinturillo"
      />

      {/* 2. Players in Room */}
      <PlayerList
        players={roomState.players}
        currentUserId={localPlayer.id}
        minPlayers={2}
        maxPlayers={10}
      />

      {/* 3. Game Settings */}
      <div className="bg-stone-900/70 border border-stone-800/90 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <h3 className="text-sm font-bold uppercase tracking-wider text-stone-200">
            Ajustes de la partida
          </h3>
          <span className="text-xs text-stone-500">
            {isHost ? 'Eres anfitrión' : 'Solo el anfitrión puede modificarlos'}
          </span>
        </div>

        <PinturilloSettings
          config={roomState.config}
          isHost={isHost}
          onChangeConfig={onUpdateConfig}
        />
      </div>

      {/* 4. Start Game / Waiting Action */}
      <div className="pt-2">
        {isHost ? (
          <div>
            <button
              type="button"
              disabled={!canStart}
              onClick={handleStart}
              className="w-full py-4 px-6 rounded-2xl bg-[#00BCEB] hover:bg-[#009ED0] disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-sm sm:text-base uppercase tracking-wider transition-all shadow-xl shadow-[#00BCEB]/25 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Iniciar Partida</span>
            </button>
            {!canStart && (
              <p className="text-center text-xs text-[#00BCEB]/90 mt-2.5 font-medium">
                ⚠️ Invita al menos a 1 amigo para poder empezar (mínimo 2 jugadores).
              </p>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800/80 text-center">
            <div className="flex items-center justify-center gap-2 text-stone-300 text-sm font-semibold mb-1">
              <Sparkles className="w-4 h-4 text-[#00BCEB] animate-spin" />
              <span>Esperando a que el anfitrión inicie la partida...</span>
            </div>
            <p className="text-xs text-stone-500">
              Ten preparado tu ratón o pantalla táctil para dibujar con soltura.
            </p>
          </div>
        )}
      </div>
    </GameLobbyLayout>
  );
};
