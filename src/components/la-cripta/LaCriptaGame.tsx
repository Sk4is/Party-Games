import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  CriptaCharacterId,
  CriptaRelicId,
  CriptaSceneId,
  CriptaSpriteAnimationState,
  CriptaVisualEvent,
} from '../../types/laCripta';
import { CRIPTA_CURSOR_COLORS } from '../../data/la-cripta/criptaCatalog';
import { useLaCriptaSocket } from '../../hooks/useLaCriptaSocket';
import { LaCriptaCursorOverlay } from './LaCriptaCursorOverlay';
import { LaCriptaTopBar, LaCriptaPartyHud } from './LaCriptaPartyHud';
import { LaCriptaLobbyView } from './LaCriptaLobbyView';
import { LaCriptaThreeDoorsScene } from './LaCriptaThreeDoorsScene';
import { LaCriptaCrtOverlay } from './LaCriptaCrtOverlay';
import {
  LaCriptaInventoryFullModal,
  LaCriptaRelicRevealBanner,
} from './LaCriptaItemRelicArt';
import {
  LaCriptaBossPhaseTransitionOverlay,
  LaCriptaRunVictoryScreen,
} from './LaCriptaFinalBossComponents';
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
    sendUseInventoryItem,
    sendClaimGroundDrop,
    sendReplaceInventoryItem,
    sendDiscardOverflowItem,
    sendShopBuyItem,
    sendShopBuyRelic,
    sendReviveAlly,
    sendRoomInteractOption,
    sendRoomPuzzleInput,
    sendRoomDiscoverSecret,
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
  const [activeRelicRevealId, setActiveRelicRevealId] = useState<CriptaRelicId | null>(null);
  const [showBossPhaseTransition, setShowBossPhaseTransition] = useState<boolean>(false);

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
    if (expeditionState.phase === 'RUN_VICTORY') return 'RUN_VICTORY';
    if (expeditionState.phase === 'FINAL_BOSS_COMBAT') return 'FINAL_BOSS_COMBAT';
    if (expeditionState.phase === 'FINAL_BOSS_ENTRANCE') return 'FINAL_BOSS_ENTRANCE';
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

  const handleLeaveExpedition = useCallback(() => {
    leaveRoom();
  }, [leaveRoom]);

  // Phase 3 & 4: Visual Gameplay Feedback, Floating Popups, Player Portrait States & Enemy Hit/Death States
  const lastProcessedBatchIdRef = useRef<number>(0);
  const [activeVisualEvents, setActiveVisualEvents] = useState<CriptaVisualEvent[]>([]);
  const [playerAnimationStates, setPlayerAnimationStates] = useState<
    Record<string, CriptaSpriteAnimationState>
  >({});
  const [enemyAnimStates, setEnemyAnimStates] = useState<
    Record<string, 'idle' | 'hit' | 'lunge' | 'death'>
  >({});

  useEffect(() => {
    const batch = expeditionState?.lastEventBatch;
    if (!batch || !batch.batchId || batch.batchId === lastProcessedBatchIdRef.current) {
      return;
    }
    lastProcessedBatchIdRef.current = batch.batchId;

    const events = batch.events || [];
    if (events.length === 0) return;

    setActiveVisualEvents(events);

    const nextPlayerAnims: Record<string, CriptaSpriteAnimationState> = {};
    const nextEnemyAnims: Record<string, 'idle' | 'hit' | 'lunge' | 'death'> = {};

    if (batch.actorPlayerId && batch.actorAction) {
      if (batch.actorAction === 'ATTACK') {
        nextPlayerAnims[batch.actorPlayerId] = 'attack';
      } else if (batch.actorAction === 'ABILITY' || batch.actorAction === 'USE_ITEM') {
        nextPlayerAnims[batch.actorPlayerId] = 'cast';
      } else if (batch.actorAction === 'DEFEND') {
        nextPlayerAnims[batch.actorPlayerId] = 'defend';
      }
    }

    let playedPrimarySfx = false;
    let relicRevealTimer: number | null = null;
    let bossPhaseTimer: number | null = null;

    for (const ev of events) {
      if (ev.kind === 'RELIC_ACQUIRED' && ev.relicId) {
        setActiveRelicRevealId(ev.relicId);
        relicRevealTimer = window.setTimeout(() => {
          setActiveRelicRevealId(null);
        }, 2800);
      }

      if (ev.kind === 'BOSS_PHASE_TRANSITION') {
        setShowBossPhaseTransition(true);
        bossPhaseTimer = window.setTimeout(() => {
          setShowBossPhaseTransition(false);
        }, 2400);
      }

      if (ev.targetType === 'ENEMY' && ev.targetId) {
        if (ev.kind === 'ENEMY_DEATH') {
          nextEnemyAnims[ev.targetId] = 'death';
        } else if (ev.kind === 'ENEMY_ATTACK') {
          if (nextEnemyAnims[ev.targetId] !== 'death') {
            nextEnemyAnims[ev.targetId] = 'lunge';
          }
        } else if (
          (ev.kind === 'DAMAGE_ENEMY' || ev.kind === 'CRIT_ENEMY' || ev.kind === 'STATUS_APPLIED') &&
          nextEnemyAnims[ev.targetId] !== 'death'
        ) {
          nextEnemyAnims[ev.targetId] = 'hit';
        }
      }

      if (ev.targetType === 'PLAYER' && ev.targetId) {
        if (ev.kind === 'REVIVE_PLAYER') {
          nextPlayerAnims[ev.targetId] = 'revive';
        } else if (ev.kind === 'HEAL_PLAYER') {
          if (!nextPlayerAnims[ev.targetId]) {
            nextPlayerAnims[ev.targetId] = 'heal';
          }
        } else if (ev.kind === 'DAMAGE_PLAYER') {
          nextPlayerAnims[ev.targetId] = 'hit';
        } else if (
          ev.kind === 'SHIELD_PLAYER' ||
          ev.kind === 'GAIN_ATTACK' ||
          ev.kind === 'GAIN_DEFENSE' ||
          ev.kind === 'GAIN_MAGIC' ||
          ev.kind === 'ITEM_ACQUIRED'
        ) {
          if (!nextPlayerAnims[ev.targetId]) {
            nextPlayerAnims[ev.targetId] = 'buff';
          }
        } else if (ev.kind === 'STATUS_APPLIED') {
          if (!nextPlayerAnims[ev.targetId]) {
            nextPlayerAnims[ev.targetId] = 'debuff';
          }
        }
      }

      // Trigger crisp synthesized audio feedback for the batch
      if (!playedPrimarySfx) {
        if (ev.kind === 'REVIVE_PLAYER' || ev.kind === 'RELIC_ACQUIRED' || ev.kind === 'DOOR_COMPLETED') {
          laCriptaAudio.playReviveFanfare();
          playedPrimarySfx = true;
        } else if (ev.kind === 'CRIT_ENEMY' || ev.kind === 'BOSS_PHASE_TRANSITION') {
          laCriptaAudio.playSwordSlash(true);
          playedPrimarySfx = true;
        } else if (ev.kind === 'ENEMY_DEATH') {
          laCriptaAudio.playEnemyDeath();
          playedPrimarySfx = true;
        } else if (ev.kind === 'DAMAGE_ENEMY') {
          if (ev.vfxStyle === 'arcane' || ev.vfxStyle === 'holy' || ev.vfxStyle === 'alchemy') {
            laCriptaAudio.playMagicCast();
          } else {
            laCriptaAudio.playSwordSlash(false);
          }
          playedPrimarySfx = true;
        } else if (
          ev.kind === 'GAIN_GOLD' ||
          ev.kind === 'LOOT_ITEM' ||
          ev.kind === 'ROOM_REWARD' ||
          ev.kind === 'ITEM_ACQUIRED'
        ) {
          laCriptaAudio.playGoldChange(true);
          playedPrimarySfx = true;
        } else if (ev.kind === 'LOSE_GOLD') {
          laCriptaAudio.playGoldChange(false);
          playedPrimarySfx = true;
        } else if (ev.kind === 'HEAL_PLAYER' || ev.kind === 'ITEM_CONSUMED') {
          laCriptaAudio.playHealChime();
          playedPrimarySfx = true;
        } else if (ev.kind === 'SHIELD_PLAYER' || ev.kind === 'GAIN_DEFENSE') {
          laCriptaAudio.playShieldGuard();
          playedPrimarySfx = true;
        } else if (ev.kind === 'DAMAGE_PLAYER' || ev.kind === 'ENEMY_ATTACK') {
          laCriptaAudio.playSwordSlash(false);
          playedPrimarySfx = true;
        } else if (ev.kind === 'STATUS_APPLIED') {
          laCriptaAudio.playMagicCast();
          playedPrimarySfx = true;
        }
      }
    }

    setPlayerAnimationStates(nextPlayerAnims);
    setEnemyAnimStates(nextEnemyAnims);

    const animTimer = window.setTimeout(() => {
      setPlayerAnimationStates({});
      setEnemyAnimStates({});
    }, 680);

    const eventsTimer = window.setTimeout(() => {
      setActiveVisualEvents([]);
    }, 1180);

    return () => {
      window.clearTimeout(animTimer);
      window.clearTimeout(eventsTimer);
      if (relicRevealTimer) window.clearTimeout(relicRevealTimer);
      if (bossPhaseTimer) window.clearTimeout(bossPhaseTimer);
    };
  }, [expeditionState?.lastEventBatch]);

  const localPlayer = useMemo(
    () => expeditionState?.players.find((p) => p.id === playerId) || null,
    [expeditionState?.players, playerId]
  );

  return (
    <div
      onPointerMove={handlePointerMove}
      className="relative min-h-screen w-full bg-[#0B0A0E] text-[#D9D0BC] flex flex-col justify-between overflow-x-hidden selection:bg-[#E7A54A] selection:text-[#0B0A0E]"
    >
      {/* Subtle Fantasy Arcade CRT Scanline Overlay (pointer-events: none) */}
      <LaCriptaCrtOverlay />

      {/* Celebratory Relic Acquired Banner */}
      {activeRelicRevealId && <LaCriptaRelicRevealBanner relicId={activeRelicRevealId} />}

      {/* Final Boss Phase 1 -> Phase 2 Dramatic Transformation Overlay */}
      {showBossPhaseTransition && <LaCriptaBossPhaseTransitionOverlay />}

      {/* Inventory Full (3/3) Replacement Modal for Local Player */}
      {localPlayer?.pendingItemOverflow && (
        <LaCriptaInventoryFullModal
          pendingItem={localPlayer.pendingItemOverflow}
          currentSlots={localPlayer.inventory || []}
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

      {expeditionState && expeditionState.phase === 'RUN_VICTORY' && (
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
          expeditionState.phase === 'FINAL_BOSS_ENTRANCE' ||
          expeditionState.phase === 'FINAL_BOSS_COMBAT' ||
          expeditionState.phase === 'DUNGEON' ||
          expeditionState.phase === 'DUNGEON_ARRIVAL') && (
          <LaCriptaThreeDoorsScene
            expeditionState={expeditionState}
            currentPlayerId={playerId}
            activeVisualEvents={activeVisualEvents}
            enemyAnimStates={enemyAnimStates}
            onVoteDoor={voteDoor}
            onVoteFinalBossDoor={voteFinalBossDoor}
            onRetryDungeonInit={retryDungeonInit}
            onCombatAction={sendCombatAction}
            onReviveAlly={sendReviveAlly}
            onInteractOption={sendRoomInteractOption}
            onPuzzleInput={sendRoomPuzzleInput}
            onDiscoverSecret={sendRoomDiscoverSecret}
            onAdvanceRoom={sendRoomAdvance}
            onClaimGroundDrop={sendClaimGroundDrop}
            onShopBuyItem={sendShopBuyItem}
            onShopBuyRelic={sendShopBuyRelic}
            onSelectedEnemyChange={setSelectedTargetEnemyId}
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
          onUseConsumable={sendUseInventoryItem}
          selectedTargetEnemyId={selectedTargetEnemyId}
        />
      )}
    </div>
  );
};
