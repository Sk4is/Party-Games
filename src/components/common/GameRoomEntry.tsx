import React, { useState } from 'react';
import { UserProfile } from '../../utils/userProfile';
import { GameConfig, LaPeorRespuestaConfig } from '../../types';
import { GameLobbyLayout } from '../lobby/GameLobbyLayout';
import { PlayerProfileSetup } from '../lobby/PlayerProfileSetup';
import { RoomModeSelector, RoomMode } from '../lobby/RoomModeSelector';
import { JoinRoomPanel } from '../lobby/JoinRoomPanel';
import { CreateRoomPanel } from '../lobby/CreateRoomPanel';
import { BombaSettings, LPRSettings } from '../lobby/GameSettings';

export interface GameRoomEntryProps {
  gameType: 'la-bomba' | 'la-peor-respuesta';
  title?: string;
  gameTitle?: string;
  subtitle?: string;
  gameDescription?: string;
  icon?: React.ReactNode;
  gameIcon?: React.ReactNode;
  badgeText?: string;
  minPlayers: number;
  maxPlayers: number;
  initialRoomCode?: string;
  currentUser: UserProfile;
  onUpdateUser?: (updated: Partial<UserProfile>) => void;
  onUpdateProfile?: (updated: Partial<UserProfile>) => void;
  onCreateRoom: (config?: any) => void;
  onJoinRoom: (code: string) => void;
  onBackToMenu: () => void;
  isConnecting?: boolean;
  errorMessage?: string | null;
}

export const GameRoomEntry: React.FC<GameRoomEntryProps> = ({
  gameType,
  title,
  gameTitle,
  subtitle,
  gameDescription,
  icon,
  gameIcon,
  minPlayers,
  maxPlayers,
  initialRoomCode = '',
  currentUser,
  onUpdateUser,
  onUpdateProfile,
  onCreateRoom,
  onJoinRoom,
  onBackToMenu,
  isConnecting = false,
  errorMessage,
}) => {
  const resolvedTitle = title || gameTitle || (gameType === 'la-bomba' ? 'La Bomba' : 'La Peor Respuesta');
  const resolvedIcon = icon || gameIcon || (gameType === 'la-bomba' ? '💣' : '💀');
  const resolvedDesc =
    subtitle ||
    gameDescription ||
    (gameType === 'la-bomba'
      ? 'Encuentra palabras antes de que explote la bomba. Piensa rápido, completa tu abecedario y no pierdas tus vidas.'
      : 'Completa la frase con la respuesta más divertida. Después, votad en secreto cuál ha sido la mejor.');

  const handleProfileUpdate = onUpdateUser || onUpdateProfile || (() => {});

  const [mode, setMode] = useState<RoomMode>(initialRoomCode ? 'join' : 'create');

  // Bomba initial settings state
  const [bombaLives, setBombaLives] = useState(3);
  const [bombaMistakes, setBombaMistakes] = useState(3);

  // LPR initial settings state
  const [lprRounds, setLprRounds] = useState(10);

  const handleCreate = () => {
    if (gameType === 'la-bomba') {
      onCreateRoom({
        startingLives: bombaLives,
        allowedMistakesPerRound: bombaMistakes,
      } as Partial<GameConfig>);
    } else {
      onCreateRoom({
        totalRounds: lprRounds,
      } as Partial<LaPeorRespuestaConfig>);
    }
  };

  return (
    <GameLobbyLayout
      title={resolvedTitle}
      icon={resolvedIcon}
      description={resolvedDesc}
      minPlayers={minPlayers}
      maxPlayers={maxPlayers}
      onBack={onBackToMenu}
      backLabel="Volver al menú"
      errorMessage={errorMessage}
    >
      {/* 1. Player Profile Setup */}
      <PlayerProfileSetup
        profile={currentUser}
        onChange={handleProfileUpdate}
      />

      {/* 2. Mode Selector: Crear Sala / Unirse a Sala */}
      <div className="space-y-4">
        <RoomModeSelector
          mode={mode}
          onChange={setMode}
        />

        {/* 3. Panel based on active mode */}
        {mode === 'create' ? (
          <CreateRoomPanel
            onCreate={handleCreate}
            isLoading={isConnecting}
            settingsSlot={
              gameType === 'la-bomba' ? (
                <BombaSettings
                  startingLives={bombaLives}
                  allowedMistakesPerRound={bombaMistakes}
                  isHost={true}
                  onChangeLives={setBombaLives}
                  onChangeMistakes={setBombaMistakes}
                />
              ) : (
                <LPRSettings
                  totalRounds={lprRounds}
                  isHost={true}
                  onChangeRounds={setLprRounds}
                />
              )
            }
          />
        ) : (
          <JoinRoomPanel
            onJoin={onJoinRoom}
            isLoading={isConnecting}
            initialCode={initialRoomCode}
          />
        )}
      </div>
    </GameLobbyLayout>
  );
};
