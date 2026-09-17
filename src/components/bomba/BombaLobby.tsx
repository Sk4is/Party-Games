import React, { useState } from 'react';
import { Play, Sparkles } from 'lucide-react';
import { BombaRoomState } from '../../types/multiplayer';
import { GameConfig } from '../../types';
import { AbandonConfirmationModal } from '../common/AbandonConfirmationModal';
import { audio } from '../../utils/audio';
import { GameLobbyLayout } from '../lobby/GameLobbyLayout';
import { RoomCode } from '../lobby/RoomCode';
import { PlayerList } from '../lobby/PlayerList';
import { BombaSettings } from '../lobby/GameSettings';

interface BombaLobbyProps {
  roomState: BombaRoomState;
  currentUserId: string;
  onUpdateConfig: (cfg: Partial<GameConfig>) => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

export const BombaLobby: React.FC<BombaLobbyProps> = ({
  roomState,
  currentUserId,
  onUpdateConfig,
  onStartGame,
  onLeaveRoom,
}) => {
  const [isAbandonModalOpen, setIsAbandonModalOpen] = useState(false);

  const isHost = roomState.hostId === currentUserId;
  const canStart = roomState.players.length >= 2;

  const handleLivesChange = (lives: number) => {
    if (!isHost) return;
    onUpdateConfig({ startingLives: lives });
  };

  const handleMistakesChange = (mistakes: number) => {
    if (!isHost) return;
    onUpdateConfig({ allowedMistakesPerRound: mistakes });
  };

  return (
    <GameLobbyLayout
      title="La Bomba"
      icon="💣"
      description="Encuentra palabras antes de que explote la bomba. Piensa rápido, completa tu abecedario y no pierdas tus vidas."
      minPlayers={2}
      maxPlayers={10}
      onBack={() => setIsAbandonModalOpen(true)}
      backLabel="Salir de la sala"
      roomCode={roomState.code}
      isOnlineLobby={true}
    >
      {/* 1. Room Code & Share */}
      <RoomCode
        code={roomState.code}
        gameSlug="la-bomba"
      />

      {/* 2. Players in Room */}
      <PlayerList
        players={roomState.players}
        currentUserId={currentUserId}
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

        <BombaSettings
          startingLives={roomState.config.startingLives}
          allowedMistakesPerRound={roomState.config.allowedMistakesPerRound}
          isHost={isHost}
          onChangeLives={handleLivesChange}
          onChangeMistakes={handleMistakesChange}
        />
      </div>

      {/* 4. Start Game / Waiting Action */}
      <div className="pt-2">
        {isHost ? (
          <div>
            <button
              type="button"
              disabled={!canStart}
              onClick={() => {
                audio.playSpark();
                onStartGame();
              }}
              className="w-full py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-stone-950 font-black text-sm sm:text-base uppercase tracking-wider transition-all shadow-xl shadow-amber-500/20 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Iniciar Partida</span>
            </button>
            {!canStart && (
              <p className="text-center text-xs text-amber-400/90 mt-2.5 font-medium">
                ⚠️ Se necesitan al menos 2 jugadores para empezar.
              </p>
            )}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-stone-900/60 border border-stone-800/80 text-center">
            <div className="flex items-center justify-center gap-2 text-stone-300 text-sm font-semibold mb-1">
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
              <span>Esperando a que el anfitrión inicie la partida...</span>
            </div>
            <p className="text-xs text-stone-500">
              Asegúrate de tener el audio activado para escuchar las pistas de la bomba.
            </p>
          </div>
        )}
      </div>

      {/* Abandon Confirmation Modal */}
      <AbandonConfirmationModal
        isOpen={isAbandonModalOpen}
        onCancel={() => setIsAbandonModalOpen(false)}
        onConfirm={onLeaveRoom}
        title="¿Salir de la sala?"
        message="Saldrás de la sala multijugador y volverás al menú principal."
      />
    </GameLobbyLayout>
  );
};
