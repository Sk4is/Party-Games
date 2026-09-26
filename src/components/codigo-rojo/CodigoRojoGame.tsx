import React, { useState } from 'react';
import { useCodigoRojoSocket } from '../../hooks/useCodigoRojoSocket';
import { getOrCreateUserProfile } from '../../utils/userProfile';
import { CodigoRojoEntry } from './CodigoRojoEntry';
import { CodigoRojoLobby } from './CodigoRojoLobby';
import { CodigoRojoOperatorView } from './CodigoRojoOperatorView';
import { CodigoRojoGuideView } from './CodigoRojoGuideView';
import { MissionResultModal } from './MissionResultModal';
import { AbandonConfirmationModal } from '../common/AbandonConfirmationModal';
import { MatchAbortedModal } from '../common/MatchAbortedModal';
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
    updateProfile,
    selectOperator,
  } = useCodigoRojoSocket({
    player: localPlayer,
    initialRoomCode,
    onWrongGame: (actualGame, roomCode) => {
      if (onSwitchGame) onSwitchGame(actualGame, roomCode);
    },
  });

  const handleUpdateProfile = (name: string, avatar: string, color: string) => {
    setLocalPlayer((p) => ({ ...p, name, avatar, color }));
    updateProfile(name, avatar, color);
  };

  const handleConfirmExit = () => {
    setShowAbandonModal(false);
    leaveRoom();
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
      {/* Reconnecting banner overlay */}
      {connectionStatus === 'reconnecting' && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-xl backdrop-blur animate-pulse">
          <span className="w-2 h-2 rounded-full bg-slate-950 animate-ping" />
          <span>RECONECTANDO…</span>
        </div>
      )}

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
          onUpdateProfile={handleUpdateProfile}
          onSelectOperator={selectOperator}
        />
      )}

      {/* 2. ACTIVE MISSION PHASE or RESULTS PHASE */}
      {roomState.phase !== 'LOBBY' && roomState.phase !== 'MATCH_ABORTED' && (
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
              onBackToMenu={leaveRoom}
              onSelectOperator={selectOperator}
            />
          )}
        </>
      )}

      {/* 3. MATCH ABORTED (e.g. only 1 player remains in 2-player match) */}
      {roomState.phase === 'MATCH_ABORTED' && (
        <MatchAbortedModal
          isOpen={true}
          title="PARTIDA FINALIZADA"
          message={
            roomState.endMessage ||
            (roomState.players.filter((p) => p.isConnected).length < 2
              ? 'El otro jugador ha abandonado la partida.'
              : 'No quedan suficientes jugadores para continuar.')
          }
          onReturnToMenu={leaveRoom}
          autoReturnSeconds={5}
        />
      )}

      {/* Abandon Confirmation Modal */}
      <AbandonConfirmationModal
        isOpen={showAbandonModal}
        onConfirm={handleConfirmExit}
        onCancel={() => setShowAbandonModal(false)}
        title="¿Salir de la sala?"
        message="Si sales de la sala, dejarás al equipo sin tu puesto en la misión."
        confirmText="Salir de la sala"
        cancelText="Permanecer"
      />
    </div>
  );
};
