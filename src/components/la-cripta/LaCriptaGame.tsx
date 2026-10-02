import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  CriptaCharacterId,
  CriptaRelicId,
  CriptaSceneId,
  CriptaSpriteAnimationState,
  CriptaVisualEvent,
} from '../../types/laCripta';
import {
  CRIPTA_CURSOR_COLORS,
  CRIPTA_DUNGEONS_REGISTRY,
} from '../../data/la-cripta/criptaCatalog';
import { useLaCriptaSocket } from '../../hooks/useLaCriptaSocket';
import { LaCriptaCursorOverlay } from './LaCriptaCursorOverlay';
import { LaCriptaTopBar, LaCriptaPartyHud } from './LaCriptaPartyHud';
import { LaCriptaLobbyView } from './LaCriptaLobbyView';
import { LaCriptaThreeDoorsScene } from './LaCriptaThreeDoorsScene';
import { CriptaContextualPanelMode } from './LaCriptaSidePanels';
import { LaCriptaCrtOverlay } from './LaCriptaCrtOverlay';
import {
  LaCriptaForegroundBiomeParticles,
  LaCriptaFullScreenBiomeAtmosphere,
} from './LaCriptaEncounterCards';
import {
  LaCriptaInventoryFullModal,
  LaCriptaRelicRevealBanner,
} from './LaCriptaItemRelicArt';
import {
  LaCriptaBossPhaseTransitionOverlay,
  LaCriptaRunVictoryScreen,
} from './LaCriptaFinalBossComponents';
import {
  LaCriptaExitExpeditionModal,
  LaCriptaStatusCodexModal,
} from './LaCriptaStatusEffectBadge';
import { LaCriptaEnemyVisualQADebugModal } from './bestiary/LaCriptaEnemyVisualQADebugModal';
import {
  LaCriptaDirectionalTravelOverlay,
  LaCriptaGoldCollectionOverlay,
  useLaCriptaPresentationQueue,
} from './LaCriptaVisualFeedback';
import { laCriptaAudio } from '../../utils/laCriptaAudio';

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
    voteFinalBossDoor,
    retryDungeonInit,
    sendCombatAction,
    sendLockRoundAction,
    sendUnlockRoundAction,
    sendUseInventoryItem,
    sendClaimGroundDrop,
    sendBuyShopSlot,
    sendReplaceInventoryItem,
    sendDiscardOverflowItem,
    sendShopBuyItem,
    sendShopBuyRelic,
    sendReviveAlly,
    sendRoomInteractOption,
    sendRoomPuzzleInput,
    sendRoomDiscoverSecret,
    sendInteractRoomObject,
    sendUpgradeWeapon,
    sendEquipWeaponRune,
    sendRoomAdvance,
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

  const [selectedTargetEnemyId, setSelectedTargetEnemyId] = useState<string | null>(null);
  const [hoveredPreviewDungeonId, setHoveredPreviewDungeonId] = useState<string | null>(null);
  const [showBestiaryQA, setShowBestiaryQA] = useState<boolean>(false);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey || (e.ctrlKey && e.shiftKey)) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setShowBestiaryQA((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

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
      expeditionState.phase === 'RUN_VICTORY' ||
      expeditionState.phase === 'FINAL_BOSS_VICTORY'
    ) {
      return 'RUN_VICTORY';
    }
    if (expeditionState.phase === 'FINAL_BOSS_COMBAT') return 'FINAL_BOSS_COMBAT';
    if (
      expeditionState.phase === 'FINAL_BOSS_ENTRANCE' ||
      expeditionState.phase === 'FINAL_BOSS_DOOR_READY'
    ) {
      return 'FINAL_BOSS_ENTRANCE';
    }
    if (expeditionState.phase === 'RETURNING_TO_DOORS') return 'RETURNING_TO_DOORS';
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

  const [showExitModal, setShowExitModal] = useState(false);
  const [showStatusCodex, setShowStatusCodex] = useState(false);

  const handleLeaveExpedition = useCallback(() => {
    setShowExitModal(true);
  }, []);

  const handleConfirmReturnToLobby = useCallback(() => {
    setShowExitModal(false);
    returnToLobby();
  }, [returnToLobby]);

  const handleConfirmReturnToMenu = useCallback(() => {
    setShowExitModal(false);
    leaveRoom();
    onBackToMenu();
  }, [leaveRoom, onBackToMenu]);

  // Action Presentation Queue Engine (Chronological Combat & Decision Sequencing)
  const {
    isPresentingSequence,
    presentationBannerText,
    hitStopActive,
    activeVisualEvents,
    activeTravel,
    activeGoldBurst,
    playerAnimationStates,
    enemyAnimStates,
    enemyLifecycleStates,
    presentedEnemyHp,
    presentedPlayerHp,
    dyingEnemies,
    hideGroundDropsDuringDeath,
    presentedExpeditionDefeated,
    playerCardImpacts,
    activeRelicRevealId,
    showBossPhaseTransition,
    activeActingEnemyId,
    activeTargetedPlayerIdsDuringPresentation,
  } = useLaCriptaPresentationQueue(expeditionState);

  // Unified Contextual Side Panel State (only ONE panel open at a time)
  const [contextualPanelMode, setContextualPanelMode] =
    useState<CriptaContextualPanelMode>('NONE');
  const [inspectedPlayerId, setInspectedPlayerId] = useState<string | null>(null);
  const [inspectedEnemyId, setInspectedEnemyId] = useState<string | null>(null);

  const handleCloseContextualPanel = useCallback(() => {
    setContextualPanelMode('NONE');
    setInspectedPlayerId(null);
    setInspectedEnemyId(null);
  }, []);

  const handleToggleInventory = useCallback(() => {
    setContextualPanelMode((prev) => {
      if (prev === 'INVENTORY') return 'NONE';
      setInspectedPlayerId(null);
      setInspectedEnemyId(null);
      return 'INVENTORY';
    });
  }, []);

  const handleInspectPlayer = useCallback((targetPlayerId: string) => {
    setContextualPanelMode((prevMode) => {
      if (prevMode === 'PLAYER_INSPECTION' && inspectedPlayerId === targetPlayerId) {
        setInspectedPlayerId(null);
        return 'NONE';
      }
      setInspectedPlayerId(targetPlayerId);
      setInspectedEnemyId(null);
      return 'PLAYER_INSPECTION';
    });
  }, [inspectedPlayerId]);

  const handleInspectEnemy = useCallback((enemyId: string) => {
    setInspectedEnemyId(enemyId);
    setInspectedPlayerId(null);
    setContextualPanelMode('ENEMY_INSPECTION');
  }, []);

  const localPlayer = useMemo(
    () => expeditionState?.players.find((p) => p.id === playerId) || null,
    [expeditionState?.players, playerId]
  );

  const isFullViewportGame = Boolean(
    expeditionState &&
      expeditionState.phase !== 'LOBBY' &&
      expeditionState.phase !== 'RUN_VICTORY' &&
      expeditionState.phase !== 'FINAL_BOSS_VICTORY'
  );

  const activeAtmosphereDungeon = useMemo(() => {
    if (!expeditionState) return CRIPTA_DUNGEONS_REGISTRY.catacumbas_del_rey;
    if (
      expeditionState.phase === 'FINAL_BOSS_DOOR_READY' ||
      expeditionState.phase === 'FINAL_BOSS_ENTRANCE' ||
      expeditionState.phase === 'FINAL_BOSS_COMBAT'
    ) {
      return (
        CRIPTA_DUNGEONS_REGISTRY.el_abismo ||
        CRIPTA_DUNGEONS_REGISTRY.catacumbas_del_rey
      );
    }
    if (
      (expeditionState.phase === 'THREE_DOORS' ||
        expeditionState.phase === 'RETURNING_TO_DOORS') &&
      hoveredPreviewDungeonId &&
      CRIPTA_DUNGEONS_REGISTRY[hoveredPreviewDungeonId as keyof typeof CRIPTA_DUNGEONS_REGISTRY]
    ) {
      return CRIPTA_DUNGEONS_REGISTRY[
        hoveredPreviewDungeonId as keyof typeof CRIPTA_DUNGEONS_REGISTRY
      ];
    }
    if (
      expeditionState.selectedDungeonId &&
      CRIPTA_DUNGEONS_REGISTRY[expeditionState.selectedDungeonId]
    ) {
      return CRIPTA_DUNGEONS_REGISTRY[expeditionState.selectedDungeonId];
    }
    const firstOffered = expeditionState.offeredDungeons?.[0];
    if (firstOffered && CRIPTA_DUNGEONS_REGISTRY[firstOffered]) {
      return CRIPTA_DUNGEONS_REGISTRY[firstOffered];
    }
    return CRIPTA_DUNGEONS_REGISTRY.catacumbas_del_rey;
  }, [
    expeditionState?.phase,
    expeditionState?.selectedDungeonId,
    expeditionState?.offeredDungeons,
    hoveredPreviewDungeonId,
  ]);

  const activeAtmosphereRoomType = useMemo(() => {
    if (!expeditionState) return undefined;
    if (expeditionState.phase === 'FINAL_BOSS_COMBAT') return 'BOSS' as const;
    const seq = expeditionState.roomSequence || [];
    const idx = expeditionState.currentRoomIndex ?? 0;
    const room =
      expeditionState.inSecretRoom && expeditionState.discoveredSecretRoom
        ? expeditionState.discoveredSecretRoom
        : seq[idx];
    return room?.type;
  }, [
    expeditionState?.phase,
    expeditionState?.roomSequence,
    expeditionState?.currentRoomIndex,
    expeditionState?.inSecretRoom,
    expeditionState?.discoveredSecretRoom,
  ]);

  return (
    <div
      onPointerMove={handlePointerMove}
      className={`gameScreen relative w-full bg-[#06080D] text-[#D9D0BC] flex flex-col justify-between overflow-x-hidden selection:bg-[#E7A54A] selection:text-[#0B0A0E] ${
        isFullViewportGame
          ? 'h-[100dvh] max-h-[100dvh] overflow-hidden'
          : 'min-h-screen'
      }`}
    >
      {/* 1-4. FULL-VIEWPORT BIOME ATMOSPHERE + DISTANT PARTICLES + MIST/LIGHT + MID-DISTANCE PARTICLES */}
      {isFullViewportGame && activeAtmosphereDungeon && (
        <LaCriptaFullScreenBiomeAtmosphere
          dungeon={activeAtmosphereDungeon}
          roomType={activeAtmosphereRoomType}
        />
      )}

      {/* 7. VERY RARE SUBTLE FOREGROUND PARTICLES (3-5 low-opacity particles crossing in front of UI, behind modals/tooltips) */}
      {isFullViewportGame && activeAtmosphereDungeon && (
        <LaCriptaForegroundBiomeParticles dungeon={activeAtmosphereDungeon} />
      )}

      {/* Directional Attack & Lifesteal Travel Overlay (Player <-> Enemy Stage) */}
      <LaCriptaDirectionalTravelOverlay travel={activeTravel} />

      {/* 60 FPS Gold Collection Coin Arc & Banner Overlay */}
      <LaCriptaGoldCollectionOverlay burst={activeGoldBurst} />

      {/* Subtle Fantasy Arcade CRT Scanline Overlay (pointer-events: none) */}
      <LaCriptaCrtOverlay />

      {/* Celebratory Relic Acquired Banner */}
      {activeRelicRevealId && <LaCriptaRelicRevealBanner relicId={activeRelicRevealId} />}

      {/* Final Boss Phase 1 -> Phase 2 Dramatic Transformation Overlay */}
      {showBossPhaseTransition && <LaCriptaBossPhaseTransitionOverlay />}

      {/* Inventory Full Replacement Modal for Local Player */}
      {localPlayer?.pendingInventoryReplacement && (
        <LaCriptaInventoryFullModal
          pendingItem={localPlayer.pendingInventoryReplacement}
          currentSlots={localPlayer.normalInventory || []}
          onReplaceSlot={(slotIdx) => sendReplaceInventoryItem(slotIdx)}
          onDiscardNew={() => sendDiscardOverflowItem()}
        />
      )}

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
          onOpenStatusCodex={() => setShowStatusCodex(true)}
        />
      )}

      {/* Status & Effect Codex Modal (? ESTADOS) */}
      <LaCriptaStatusCodexModal
        isOpen={showStatusCodex}
        onClose={() => setShowStatusCodex(false)}
      />

      {/* Dark Fantasy Exit Confirmation Modal (SALIR -> VOLVER AL LOBBY / VOLVER AL MENÚ / CANCELAR) */}
      <LaCriptaExitExpeditionModal
        isOpen={showExitModal}
        onCancel={() => setShowExitModal(false)}
        onReturnToLobby={handleConfirmReturnToLobby}
        onReturnToMenu={handleConfirmReturnToMenu}
      />

      {/* Development-Only Enemy Visual QA Debug Modal & Trigger */}
      {import.meta.env.DEV && (
        <>
          <button
            type="button"
            onClick={() => setShowBestiaryQA(true)}
            title="Abrir QA Visual del Bestiario (Alt+B)"
            className="fixed bottom-2 left-2 z-[95] px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-[#120F1D]/90 hover:bg-[#1E1930] text-[#FFD166] border border-[#FFD166]/40 rounded shadow-lg"
          >
            Bestiario QA (166)
          </button>
          <LaCriptaEnemyVisualQADebugModal
            isOpen={showBestiaryQA}
            onClose={() => setShowBestiaryQA(false)}
          />
        </>
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
        (expeditionState.phase === 'RUN_VICTORY' ||
          expeditionState.phase === 'FINAL_BOSS_VICTORY') && (
          <LaCriptaRunVictoryScreen
            expeditionState={expeditionState}
            currentPlayerId={playerId}
            onNewExpedition={startExpedition}
            onReturnToLobby={returnToLobby}
          />
        )}

      {expeditionState &&
        (expeditionState.phase === 'THREE_DOORS' ||
          expeditionState.phase === 'RETURNING_TO_DOORS' ||
          expeditionState.phase === 'ENTERING_DUNGEON' ||
          expeditionState.phase === 'DOOR_OPENING' ||
          expeditionState.phase === 'FINAL_BOSS_DOOR_READY' ||
          expeditionState.phase === 'FINAL_BOSS_ENTRANCE' ||
          expeditionState.phase === 'FINAL_BOSS_COMBAT' ||
          expeditionState.phase === 'DUNGEON' ||
          expeditionState.phase === 'DUNGEON_ARRIVAL') && (
          <LaCriptaThreeDoorsScene
            expeditionState={expeditionState}
            currentPlayerId={playerId}
            activeVisualEvents={activeVisualEvents}
            enemyAnimStates={enemyAnimStates}
            enemyLifecycleStates={enemyLifecycleStates}
            isPresentingSequence={isPresentingSequence}
            presentationBannerText={presentationBannerText}
            hitStopActive={hitStopActive}
            presentedEnemyHp={presentedEnemyHp}
            dyingEnemies={dyingEnemies}
            hideGroundDropsDuringDeath={hideGroundDropsDuringDeath}
            presentedExpeditionDefeated={presentedExpeditionDefeated}
            activeActingEnemyId={activeActingEnemyId}
            activeTargetedPlayerIdsDuringPresentation={
              activeTargetedPlayerIdsDuringPresentation
            }
            onVoteDoor={voteDoor}
            onVoteFinalBossDoor={voteFinalBossDoor}
            onRetryDungeonInit={retryDungeonInit}
            onCombatAction={sendCombatAction}
            onLockRoundAction={sendLockRoundAction}
            onUnlockRoundAction={sendUnlockRoundAction}
            onUseConsumable={sendUseInventoryItem}
            onReviveAlly={sendReviveAlly}
            onInteractOption={sendRoomInteractOption}
            onInteractRoomObject={sendInteractRoomObject}
            onUpgradeWeapon={sendUpgradeWeapon}
            onEquipWeaponRune={sendEquipWeaponRune}
            onPuzzleInput={sendRoomPuzzleInput}
            onDiscoverSecret={sendRoomDiscoverSecret}
            onAdvanceRoom={sendRoomAdvance}
            onClaimGroundDrop={sendClaimGroundDrop}
            onBuyShopSlot={sendBuyShopSlot}
            onShopBuyItem={sendShopBuyItem}
            onShopBuyRelic={sendShopBuyRelic}
            onSelectedEnemyChange={setSelectedTargetEnemyId}
            onHoveredDoorChange={setHoveredPreviewDungeonId}
            contextualPanelMode={contextualPanelMode}
            inspectedPlayerId={inspectedPlayerId}
            inspectedEnemyId={inspectedEnemyId}
            onOpenInventory={handleToggleInventory}
            onInspectEnemy={handleInspectEnemy}
            onCloseContextualPanel={handleCloseContextualPanel}
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
          playerAnimationStates={playerAnimationStates}
          activeVisualEvents={activeVisualEvents}
          presentedPlayerHp={presentedPlayerHp}
          playerCardImpacts={playerCardImpacts}
          onUseConsumable={sendUseInventoryItem}
          selectedTargetEnemyId={selectedTargetEnemyId}
          onOpenInventory={handleToggleInventory}
          isInventoryOpen={contextualPanelMode === 'INVENTORY'}
          onInspectPlayer={handleInspectPlayer}
          inspectedPlayerId={
            contextualPanelMode === 'PLAYER_INSPECTION' ? inspectedPlayerId : null
          }
          activeTargetedPlayerIdsDuringPresentation={
            activeTargetedPlayerIdsDuringPresentation
          }
        />
      )}
    </div>
  );
};
