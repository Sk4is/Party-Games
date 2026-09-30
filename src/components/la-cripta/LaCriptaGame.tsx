import React, { useState, useCallback, useMemo } from 'react';
import {
  CriptaCharacterId,
  CriptaSceneId,
} from '../../types/laCripta';
import { CRIPTA_CURSOR_COLORS } from '../../data/la-cripta/criptaCatalog';
import { useLaCriptaSocket } from '../../hooks/useLaCriptaSocket';
import { LaCriptaCursorOverlay } from './LaCriptaCursorOverlay';
import { LaCriptaTopBar, LaCriptaPartyHud } from './LaCriptaPartyHud';
import { LaCriptaLobbyView } from './LaCriptaLobbyView';
import { LaCriptaThreeDoorsScene } from './LaCriptaThreeDoorsScene';
import { LaCriptaCrtOverlay } from './LaCriptaCrtOverlay';

interface LaCriptaGameProps {
  onBackToMenu: () => void;
  initialRoomCode?: string;
  onSwitchGame?: (game: any, code: string) => void;
}

const STORAGE_PLAYER_ID_KEY = 'fam2play_la_cripta_player_id';
const STORAGE_PLAYER_NAME_KEY = 'fam2play_la_cripta_player_name';
const STORAGE_PLAYER_COLOR_KEY = 'fam2play_la_cripta_player_color';

function getOrCreatePlayerId(): string {
  if (typeof window === 'undefined') return 'cripta_guest';
  try {
    const existing =
      localStorage.getItem(STORAGE_PLAYER_ID_KEY) ||
      localStorage.getItem('fam2play_fortunarium_player_id') ||
      localStorage.getItem('fam2play_player_id');
    if (existing && existing.trim()) {
      localStorage.setItem(STORAGE_PLAYER_ID_KEY, existing.trim());
      return existing.trim();
    }
    const created = `cripta_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
    localStorage.setItem(STORAGE_PLAYER_ID_KEY, created);
    return created;
  } catch {
    return `cripta_${Math.random().toString(36).slice(2, 9)}`;
  }
}

export const LaCriptaGame: React.FC<LaCriptaGameProps> = ({
  onBackToMenu,
  initialRoomCode = '',
  onSwitchGame,
}) => {
  const [playerId] = useState<string>(() => getOrCreatePlayerId());

  const [playerName, setPlayerName] = useState<string>(() => {
    if (typeof window === 'undefined') return 'Aventurero';
    try {
      return (
        localStorage.getItem(STORAGE_PLAYER_NAME_KEY) ||
        localStorage.getItem('fam2play_fortunarium_player_name') ||
        localStorage.getItem('fam2play_player_name') ||
        'Aventurero'
      );
    } catch {
      return 'Aventurero';
    }
  });

  const [playerColor, setPlayerColor] = useState<string>(() => {
    if (typeof window === 'undefined') return CRIPTA_CURSOR_COLORS[0].hex;
    try {
      return localStorage.getItem(STORAGE_PLAYER_COLOR_KEY) || CRIPTA_CURSOR_COLORS[0].hex;
    } catch {
      return CRIPTA_CURSOR_COLORS[0].hex;
    }
  });

  const playerProfile = useMemo(
    () => ({
      id: playerId,
      name: playerName.trim() || 'Aventurero',
      avatar: '🕯️',
      color: playerColor,
    }),
    [playerId, playerName, playerColor]
  );

  const {
    connectionStatus,
    expeditionState,
    errorMessage,
    subscribeToCursors,
    sendCursorMove,
    createRoom,
    joinRoom,
    leaveRoom,
    selectCharacter,
    setCursorColor,
    startExpedition,
    voteDoor,
    retryDungeonInit,
    returnToLobby,
  } = useLaCriptaSocket({
    player: playerProfile,
    initialRoomCode,
    enabled: true,
    onWrongGame: (actualGameType, code) => {
      if (onSwitchGame) {
        onSwitchGame(actualGameType, code);
      }
    },
  });

  const handleChangePlayerName = useCallback((nextName: string) => {
    setPlayerName(nextName);
    try {
      localStorage.setItem(STORAGE_PLAYER_NAME_KEY, nextName);
    } catch {
      // Ignore
    }
  }, []);

  const handleChangePlayerColor = useCallback(
    (nextColor: string) => {
      setPlayerColor(nextColor);
      try {
        localStorage.setItem(STORAGE_PLAYER_COLOR_KEY, nextColor);
      } catch {
        // Ignore
      }
      if (expeditionState) {
        setCursorColor(nextColor);
      }
    },
    [expeditionState, setCursorColor]
  );

  const handleSelectCharacter = useCallback(
    (charId: CriptaCharacterId) => {
      if (expeditionState) {
        selectCharacter(charId);
      }
    },
    [expeditionState, selectCharacter]
  );

  const activeSceneId: CriptaSceneId = useMemo(() => {
    if (!expeditionState) return 'ENTRY';
    if (expeditionState.phase === 'LOBBY') return 'LOBBY';
    if (
      expeditionState.phase === 'DUNGEON' ||
      expeditionState.phase === 'DUNGEON_ARRIVAL'
    ) {
      return 'DUNGEON';
    }
    if (
      expeditionState.phase === 'ENTERING_DUNGEON' ||
      expeditionState.phase === 'DOOR_OPENING'
    ) {
      return 'ENTERING_DUNGEON';
    }
    return 'THREE_DOORS';
  }, [expeditionState]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!expeditionState) return;
      const connectedCount = expeditionState.players.filter((p) => p.isConnected).length;
      if (connectedCount <= 1) return;
      const width = window.innerWidth || 1;
      const height = window.innerHeight || 1;
      const xNorm = e.clientX / width;
      const yNorm = e.clientY / height;
      sendCursorMove(xNorm, yNorm, activeSceneId);
    },
    [activeSceneId, expeditionState, sendCursorMove]
  );

  const handleLeaveExpedition = useCallback(() => {
    leaveRoom();
  }, [leaveRoom]);

  return (
    <div
      onPointerMove={handlePointerMove}
      className="relative min-h-screen w-full bg-[#0B0A0E] text-[#D9D0BC] flex flex-col justify-between overflow-x-hidden selection:bg-[#E7A54A] selection:text-[#0B0A0E]"
    >
      {/* Subtle Fantasy Arcade CRT Scanline Overlay (pointer-events: none) */}
      <LaCriptaCrtOverlay />

      {/* Shared Realtime Player Cursors Overlay */}
      {expeditionState && (
        <LaCriptaCursorOverlay
          currentPlayerId={playerId}
          activeSceneId={activeSceneId}
          players={expeditionState.players}
          subscribeToCursors={subscribeToCursors}
        />
      )}

      {/* Top Expedition Bar when connected to a room */}
      {expeditionState && (
        <LaCriptaTopBar
          expeditionState={expeditionState}
          currentPlayerId={playerId}
          onLeaveExpedition={handleLeaveExpedition}
          onReturnToLobby={returnToLobby}
        />
      )}

      {/* Main Interactive Stage */}
      {(!expeditionState || expeditionState.phase === 'LOBBY') && (
        <LaCriptaLobbyView
          playerId={playerId}
          playerName={playerName}
          playerColor={playerColor}
          onChangePlayerName={handleChangePlayerName}
          onChangePlayerColor={handleChangePlayerColor}
          expeditionState={expeditionState}
          connectionStatus={connectionStatus}
          errorMessage={errorMessage}
          initialRoomCode={initialRoomCode}
          onCreateRoom={async () => {
            await createRoom();
          }}
          onJoinRoom={async (code) => {
            await joinRoom(code);
          }}
          onSelectCharacter={handleSelectCharacter}
          onStartExpedition={startExpedition}
          onBackToMenu={onBackToMenu}
        />
      )}

      {expeditionState &&
        (expeditionState.phase === 'THREE_DOORS' ||
          expeditionState.phase === 'ENTERING_DUNGEON' ||
          expeditionState.phase === 'DOOR_OPENING' ||
          expeditionState.phase === 'DUNGEON' ||
          expeditionState.phase === 'DUNGEON_ARRIVAL') && (
          <LaCriptaThreeDoorsScene
            expeditionState={expeditionState}
            currentPlayerId={playerId}
            onVoteDoor={voteDoor}
            onRetryDungeonInit={retryDungeonInit}
            onReturnToLobby={returnToLobby}
            onRerollExpedition={startExpedition}
          />
        )}

      {/* Persistent BOTTOM Video-Game Party HUD when connected to a room */}
      {expeditionState && (
        <LaCriptaPartyHud
          expeditionState={expeditionState}
          currentPlayerId={playerId}
          onLeaveExpedition={handleLeaveExpedition}
          onReturnToLobby={returnToLobby}
        />
      )}
    </div>
  );
};
