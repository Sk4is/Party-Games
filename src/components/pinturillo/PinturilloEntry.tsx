import React, { useState } from 'react';
import { PinturilloConfig, PINTURILLO_CATEGORIES_LIST } from '../../types/pinturillo';
import { GameLobbyLayout } from '../lobby/GameLobbyLayout';
import { PlayerProfileSetup, PlayerProfile } from '../lobby/PlayerProfileSetup';
import { RoomModeSelector, RoomMode } from '../lobby/RoomModeSelector';
import { JoinRoomPanel } from '../lobby/JoinRoomPanel';
import { CreateRoomPanel } from '../lobby/CreateRoomPanel';
import { PinturilloSettings } from '../lobby/GameSettings';
import { getOrCreateUserProfile, saveUserProfile } from '../../utils/userProfile';

interface PinturilloEntryProps {
  initialRoomCode?: string;
  initialName?: string;
  initialAvatar?: string;
  initialColor?: string;
  onCreateRoom: (player: { id: string; name: string; avatar: string; color: string }, config?: Partial<PinturilloConfig>) => void;
  onJoinRoom: (code: string, player: { id: string; name: string; avatar: string; color: string }) => void;
  onBackToMenu: () => void;
  errorMessage?: string | null;
}

export const PinturilloEntry: React.FC<PinturilloEntryProps> = ({
  initialRoomCode = '',
  initialName,
  initialAvatar,
  initialColor,
  onCreateRoom,
  onJoinRoom,
  onBackToMenu,
  errorMessage,
}) => {
  // Load initial profile synchronized with shared userProfile
  const [profile, setProfile] = useState<PlayerProfile>(() => {
    const saved = getOrCreateUserProfile();
    return {
      id: saved.id,
      name: initialName || saved.name || 'Jugador',
      avatar: initialAvatar || saved.avatar || '🦊',
      color: initialColor || saved.color || '#f59e0b',
    };
  });

  const [mode, setMode] = useState<RoomMode>(initialRoomCode ? 'join' : 'create');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pinturillo initial room settings
  const [config, setConfig] = useState<PinturilloConfig>({
    roundTimeSeconds: 90,
    totalVueltas: 2,
    hintsEnabled: true,
    categories: PINTURILLO_CATEGORIES_LIST.map((c) => c.id),
  });

  const handleUpdateProfile = (updated: Partial<PlayerProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...updated };
      saveUserProfile(next);
      return next;
    });
  };

  const handleCreate = () => {
    setIsSubmitting(true);
    onCreateRoom(profile, config);
  };

  const handleJoin = (code: string) => {
    setIsSubmitting(true);
    onJoinRoom(code, profile);
  };

  return (
    <GameLobbyLayout
      title="Pinturillo"
      icon="🎨"
      description="Dibuja la palabra secreta mientras tus amigos intentan adivinarla antes de que se acabe el tiempo."
      minPlayers={2}
      maxPlayers={10}
      onBack={onBackToMenu}
      backLabel="Volver al menú"
      errorMessage={errorMessage}
    >
      {/* 1. Player Profile Setup */}
      <PlayerProfileSetup
        profile={profile}
        onChange={handleUpdateProfile}
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
            isLoading={isSubmitting}
            settingsSlot={
              <PinturilloSettings
                config={config}
                isHost={true}
                onChangeConfig={(upd) => setConfig((prev) => ({ ...prev, ...upd }))}
              />
            }
          />
        ) : (
          <JoinRoomPanel
            onJoin={handleJoin}
            isLoading={isSubmitting}
            initialCode={initialRoomCode}
          />
        )}
      </div>
    </GameLobbyLayout>
  );
};
