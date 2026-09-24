import React, { useState } from 'react';
import { useCodigoRojoSocket } from '../../hooks/useCodigoRojoSocket';
import { getOrCreateUserProfile } from '../../utils/userProfile';
import { CodigoRojoEntry } from './CodigoRojoEntry';
import { CodigoRojoLobby } from './CodigoRojoLobby';
import { CodigoRojoOperatorView } from './CodigoRojoOperatorView';
import { CodigoRojoGuideView } from './CodigoRojoGuideView';
import { MissionResultModal } from './MissionResultModal';
import { AbandonConfirmationModal } from '../common/AbandonConfirmationModal';
import { audio } from '../../utils/audio';

interface CodigoRojoGameProps {
  onBackToMenu: () => void;
  initialRoomCode?: string;
  onSwitchGame?: (
    actualGameType: 'la-bomba' | 'la-peor-respuesta' | 'pinturillo' | 'palabra-secreta' | 'codigo-rojo',
    roomCode: string
  ) => void;
}

export const CodigoRojoGame: React.FC<CodigoRojoGameProps> = ({
  onBackToMenu,
  initialRoomCode: propRoomCode,
  onSwitchGame,
}) => {
  const initialRoomCode =
    propRoomCode ||
    (typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('room') || ''
      : '');

  const [localPlayer, setLocalPlayer] = useState(() => {
    const saved = getOrCreateUserProfile();
    return {
      id: saved.id,
      name: saved.name || 'Agente',
      avatar: saved.avatar || '🦊',
      color: saved.color || '#ef4444',
    };
  });

  const [showAbandonModal, setShowAbandonModal] = useState(false);

  const {
    connectionStatus,
    roomState,
    errorMessage,
    createRoom,
    joinRoom,
    updateConfig,
    startMission,
    submitModuleAction,
    nextMission,
    restartMatch,
    leaveRoom,
    kickPlayer,
  } = useCodigoRojoSocket({
    player: localPlayer,
    initialRoomCode,
    onWrongGame: (actualGame, roomCode) => {
      if (onSwitchGame) onSwitchGame(actualGame, roomCode);
    },
  });

  const handleConfirmExit = () => {
    leaveRoom();
    onBackToMenu();
  };

  // If not connected to any room yet, render entry screen
  if (!roomState) {
    return (
      <CodigoRojoEntry
        initialRoomCode={initialRoomCode}
        initialName={localPlayer.name}
        initialAvatar={localPlayer.avatar}
        initialColor={localPlayer.color}
        onCreateRoom={(p, config) => {
          setLocalPlayer(p);
          createRoom(config);
        }}
        onJoinRoom={(code, p) => {
          setLocalPlayer(p);
          joinRoom(code);
        }}
        onBackToMenu={onBackToMenu}
        errorMessage={errorMessage}
      />
    );
  }

  const isHost = roomState.hostId === localPlayer.id;
  const currentPlayer = roomState.players.find((p) => p.id === localPlayer.id);
  const isOperator = currentPlayer?.role === 'OPERADOR';

  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-slate-100 select-none">
      {/* 1. LOBBY PHASE */}
      {roomState.phase === 'LOBBY' && (
        <CodigoRojoLobby
          roomState={roomState}
          currentPlayerId={localPlayer.id}
          isHost={isHost}
          onUpdateConfig={updateConfig}
          onStartMission={startMission}
          onLeaveRoom={() => setShowAbandonModal(true)}
          onKickPlayer={kickPlayer}
        />
      )}

      {/* 2. ACTIVE MISSION PHASE or RESULTS PHASE */}
      {roomState.phase !== 'LOBBY' && (
        <>
          {isOperator ? (
            <CodigoRojoOperatorView
              roomState={roomState}
              onSubmitAction={submitModuleAction}
              onAbandon={() => setShowAbandonModal(true)}
            />
          ) : (
            <CodigoRojoGuideView
              roomState={roomState}
              onAbandon={() => setShowAbandonModal(true)}
            />
          )}

          {/* Results Modal overlay when mission succeeds or fails */}
          {(roomState.phase === 'MISSION_SUCCESS' || roomState.phase === 'MISSION_FAILED') && (
            <MissionResultModal
              roomState={roomState}
              isHost={isHost}
              onNextMission={nextMission}
              onRestartMatch={restartMatch}
              onBackToMenu={handleConfirmExit}
            />
          )}
        </>
      )}

      {/* Abandon Confirmation Modal */}
      <AbandonConfirmationModal
        isOpen={showAbandonModal}
        onConfirm={handleConfirmExit}
        onCancel={() => setShowAbandonModal(false)}
        title="¿Abandonar Misión?"
        description="Si sales de la sala, dejarás al equipo sin tu puesto en la misión."
      />
    </div>
  );
};
