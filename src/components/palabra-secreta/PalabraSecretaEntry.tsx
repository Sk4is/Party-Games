import React, { useState } from 'react';
import { PalabraSecretaConfig } from '../../types/palabraSecreta';
import { GameLobbyLayout } from '../lobby/GameLobbyLayout';
import { PlayerProfileSetup, PlayerProfile } from '../lobby/PlayerProfileSetup';
import { RoomModeSelector, RoomMode } from '../lobby/RoomModeSelector';
import { JoinRoomPanel } from '../lobby/JoinRoomPanel';
import { CreateRoomPanel } from '../lobby/CreateRoomPanel';
import { PalabraSecretaSettings } from '../lobby/GameSettings';
import { getOrCreateUserProfile, saveUserProfile } from '../../utils/userProfile';

interface PalabraSecretaEntryProps {
  initialRoomCode?: string;
  initialName?: string;
  initialAvatar?: string;
  initialColor?: string;
  onCreateRoom: (
    player: { id: string; name: string; avatar: string; color: string },
    config?: Partial<PalabraSecretaConfig>
  ) => void;
  onJoinRoom: (
    code: string,
    player: { id: string; name: string; avatar: string; color: string }
  ) => void;
  onBackToMenu: () => void;
  errorMessage?: string | null;
}

export const PalabraSecretaEntry: React.FC<PalabraSecretaEntryProps> = ({
  initialRoomCode = '',
  initialName,
  initialAvatar,
  initialColor,
  onCreateRoom,
  onJoinRoom,
  onBackToMenu,
  errorMessage,
}) => {
  const [profile, setProfile] = useState<PlayerProfile>(() => {
    const saved = getOrCreateUserProfile();
    return {
      id: saved.id,
      name: initialName || saved.name || 'Jugador',
      avatar: initialAvatar || saved.avatar || '🦊',
      color: initialColor || saved.color || '#10B981',
    };
  });

  const [mode, setMode] = useState<RoomMode>(initialRoomCode ? 'join' : 'create');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Default configuration: 120s (2:00) and 3 rounds
  const [config, setConfig] = useState<PalabraSecretaConfig>({
    timePerTurn: 120,
    totalRounds: 3,
    maxSkipsPerTurn: 3,
    tabooPenalty: true,
  });

  const handleUpdateProfile = (updated: Partial<PlayerProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...updated };
      saveUserProfile(next);
      return next;
    });
  };

  const handleCreate = () => {
    if (!profile.name.trim() || isSubmitting) return;
    setIsSubmitting(true);
    onCreateRoom(profile, config);
  };

  const handleJoin = (code: string) => {
    if (!profile.name.trim() || !code.trim() || isSubmitting) return;
    setIsSubmitting(true);
    onJoinRoom(code.trim().toUpperCase(), profile);
  };

  return (
    <GameLobbyLayout
      title="Palabra Secreta"
      icon="🗣️"
      description="Juego en equipo: describe tantas palabras como puedas sin decir las palabras prohibidas antes de que se acabe el tiempo."
      minPlayers={4}
      maxPlayers={16}
      gameType="palabra-secreta"
      onBack={onBackToMenu}
      backLabel="Menú Principal"
      isOnlineLobby={false}
      errorMessage={errorMessage}
    >
      {/* 1. Setup Player Profile */}
      <PlayerProfileSetup profile={profile} onChange={handleUpdateProfile} />

      {/* 2. Room Mode Selector (Create vs Join) */}
      <RoomModeSelector mode={mode} onChange={setMode} gameType="palabra-secreta" />

      {/* 3. Panel based on mode */}
      {mode === 'create' ? (
        <CreateRoomPanel
          onCreate={handleCreate}
          isLoading={isSubmitting}
          gameType="palabra-secreta"
          settingsSlot={
            <PalabraSecretaSettings
              timePerTurn={config.timePerTurn}
              totalRounds={config.totalRounds}
              isHost={true}
              onChangeTime={(seconds) =>
                setConfig((prev) => ({ ...prev, timePerTurn: seconds }))
              }
              onChangeRounds={(rounds) =>
                setConfig((prev) => ({ ...prev, totalRounds: rounds }))
              }
            />
          }
        />
      ) : (
        <JoinRoomPanel
          onJoin={handleJoin}
          isLoading={isSubmitting}
          initialCode={initialRoomCode}
          gameType="palabra-secreta"
        />
      )}
    </GameLobbyLayout>
  );
};
