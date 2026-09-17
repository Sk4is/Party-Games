import React, { useState, useEffect } from 'react';
import { usePartySocket } from '../../hooks/usePartySocket';
import { getOrCreateUserProfile, saveUserProfile, UserProfile } from '../../utils/userProfile';
import { GameRoomEntry } from '../common/GameRoomEntry';
import { BombaOnlineGame } from './BombaOnlineGame';

interface BombaOnlineContainerProps {
  onBackToMenu: () => void;
  initialRoomCode?: string;
  onSwitchGame?: (game: 'la-peor-respuesta' | 'pinturillo', code: string) => void;
}

export const BombaOnlineContainer: React.FC<BombaOnlineContainerProps> = ({
  onBackToMenu,
  initialRoomCode = '',
  onSwitchGame,
}) => {
  const [userProfile, setUserProfile] = useState<UserProfile>(getOrCreateUserProfile);

  const handleUpdateUser = (updated: { name: string; avatar: string; color: string }) => {
    const full = { ...userProfile, ...updated };
    setUserProfile(full);
    saveUserProfile(full);
  };

  const {
    connected,
    connecting,
    bombaState,
    activeTyping,
    serverFeedback,
    alphabetReward,
    errorMessage,
    createRoom,
    joinRoom,
    leaveRoom,
    updateConfig,
    bombaStartGame,
    bombaTyping,
    bombaSubmitWord,
    bombaDismissExplosion,
    bombaPlayAgain,
    clearError,
  } = usePartySocket({
    player: userProfile,
    gameType: 'la-bomba',
    onWrongGame: (actualGame, roomCode) => {
      if (onSwitchGame && (actualGame === 'la-peor-respuesta' || actualGame === 'pinturillo')) {
        onSwitchGame(actualGame, roomCode);
      }
    },
  });

  // Auto-join from URL parameter if provided
  useEffect(() => {
    if (initialRoomCode && initialRoomCode.length >= 4 && !bombaState && connected) {
      joinRoom(initialRoomCode);
    }
  }, [initialRoomCode, connected, bombaState, joinRoom]);

  const handleCreateRoom = () => {
    clearError();
    createRoom('la-bomba');
  };

  const handleJoinRoom = (code: string) => {
    clearError();
    joinRoom(code);
  };

  const handleLeaveRoom = () => {
    leaveRoom();
    onBackToMenu();
  };

  if (!bombaState) {
    return (
      <GameRoomEntry
        gameType="la-bomba"
        title="LA BOMBA"
        subtitle="Piensa rápido antes de que explote."
        badgeText="La Bomba"
        icon={<span className="text-4xl">💣</span>}
        minPlayers={2}
        maxPlayers={10}
        currentUser={userProfile}
        onUpdateUser={handleUpdateUser}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onBackToMenu={onBackToMenu}
        initialRoomCode={initialRoomCode}
        errorMessage={errorMessage}
        isConnecting={connecting}
      />
    );
  }

  return (
    <BombaOnlineGame
      roomState={bombaState}
      currentUserId={userProfile.id}
      activeTyping={activeTyping}
      serverFeedback={serverFeedback}
      alphabetReward={alphabetReward}
      onUpdateConfig={updateConfig}
      onStartGame={bombaStartGame}
      onLeaveRoom={handleLeaveRoom}
      onTyping={bombaTyping}
      onSubmitWord={bombaSubmitWord}
      onDismissExplosion={bombaDismissExplosion}
      onPlayAgain={bombaPlayAgain}
    />
  );
};
