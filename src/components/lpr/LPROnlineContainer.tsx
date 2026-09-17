import React, { useState, useEffect } from 'react';
import { usePartySocket } from '../../hooks/usePartySocket';
import { getOrCreateUserProfile, saveUserProfile, UserProfile } from '../../utils/userProfile';
import { GameRoomEntry } from '../common/GameRoomEntry';
import { LPROnlineGame } from './LPROnlineGame';

interface LPROnlineContainerProps {
  onBackToMenu: () => void;
  initialRoomCode?: string;
  onSwitchGame?: (game: 'la-bomba' | 'pinturillo', code: string) => void;
}

export const LPROnlineContainer: React.FC<LPROnlineContainerProps> = ({
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
    lprState,
    otherCursors,
    errorMessage,
    createRoom,
    joinRoom,
    leaveRoom,
    updateConfig,
    lprStartGame,
    lprSubmitAnswer,
    lprRevealCard,
    lprRevealAll,
    lprProceedVoting,
    lprSubmitVote,
    lprCursorMove,
    lprNextRound,
    lprPlayAgain,
    clearError,
  } = usePartySocket({
    player: userProfile,
    gameType: 'la-peor-respuesta',
    onWrongGame: (actualGame, roomCode) => {
      if (onSwitchGame && (actualGame === 'la-bomba' || actualGame === 'pinturillo')) {
        onSwitchGame(actualGame, roomCode);
      }
    },
  });

  // Auto-join from URL parameter if provided
  useEffect(() => {
    if (initialRoomCode && initialRoomCode.length >= 4 && !lprState && connected) {
      joinRoom(initialRoomCode);
    }
  }, [initialRoomCode, connected, lprState, joinRoom]);

  const handleCreateRoom = () => {
    clearError();
    createRoom('la-peor-respuesta');
  };

  const handleJoinRoom = (code: string) => {
    clearError();
    joinRoom(code);
  };

  const handleLeaveRoom = () => {
    leaveRoom();
    onBackToMenu();
  };

  if (!lprState) {
    return (
      <GameRoomEntry
        gameType="la-peor-respuesta"
        title="LA PEOR RESPUESTA"
        subtitle="Cuanto peor, mejor. Humor irreverente entre amigos."
        badgeText="La Peor Respuesta"
        icon={<span className="text-4xl">💀</span>}
        minPlayers={3}
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
    <LPROnlineGame
      roomState={lprState}
      currentUserId={userProfile.id}
      otherCursors={otherCursors}
      onUpdateConfig={updateConfig}
      onStartGame={lprStartGame}
      onLeaveRoom={handleLeaveRoom}
      onSubmitAnswer={lprSubmitAnswer}
      onRevealCard={lprRevealCard}
      onRevealAll={lprRevealAll}
      onProceedVoting={lprProceedVoting}
      onSubmitVote={lprSubmitVote}
      onCursorMove={lprCursorMove}
      onNextRound={lprNextRound}
      onPlayAgain={lprPlayAgain}
    />
  );
};
