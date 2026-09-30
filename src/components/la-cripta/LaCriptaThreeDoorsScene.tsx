import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Compass,
  Eye,
  Flame,
  Hammer,
  Package,
  RotateCcw,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  X,
} from 'lucide-react';
import {
  CriptaDungeonDefinition,
  CriptaDungeonId,
  CriptaExpeditionState,
  CriptaPlayerRoundActionType,
  CriptaVisualEvent,
} from '../../types/laCripta';
import {
  CRIPTA_CHARACTERS_CATALOG,
  CRIPTA_DUNGEONS_REGISTRY,
} from '../../data/la-cripta/criptaCatalog';
import {
  CRIPTA_ITEMS_REGISTRY,
  playerHasRelic,
} from '../../data/la-cripta/criptaItemsAndRelics';
import {
  computeEnemyApproxDamageRange,
  computePlayerEffectiveStats,
  CRIPTA_ACCESSORIES_REGISTRY,
  CRIPTA_ARMORS_REGISTRY,
  CRIPTA_WEAPONS_REGISTRY,
  estimatePlayerActionDamage,
  getEquippedWeaponForPlayer,
  WEAPON_UPGRADE_MAX_LEVEL,
} from '../../data/la-cripta/criptaEquipmentAndEvents';
import { buildEnemyAiProfileForArchetype } from '../../data/la-cripta/criptaEnemyAiEngine';
import { LaCriptaDoorArtwork } from './LaCriptaDoorArtwork';
import {
  LaCriptaRoomProgressTracker,
  LaCriptaRoomTypeIcon,
  ROOM_TYPE_LABELS,
} from './LaCriptaRoomProgressTracker';
import {
  LaCriptaEnemyPixelSprite,
  LaCriptaRoomEnvironmentCanvas,
} from './LaCriptaRoomEnvironment';
import {
  LaCriptaFallenSoulIcon,
  LaCriptaStatusEffectBadge,
  LaCriptaStatusPixelIcon,
} from './LaCriptaStatusEffectBadge';
import {
  LaCriptaCombatVfxOverlay,
  LaCriptaFloatingEventBadge,
} from './LaCriptaVisualFeedback';
import {
  LaCriptaDoorCounterBadge,
  LaCriptaGroundDropsOverlay,
  LaCriptaItemPixelIcon,
  LaCriptaShopShelvesPanel,
} from './LaCriptaItemRelicArt';
import {
  LaCriptaFinalBossDoorScene,
  LaCriptaFinalBossRoomArt,
} from './LaCriptaFinalBossComponents';
import { LaCriptaGiantDoorTransition } from './LaCriptaGiantDoorTransition';
import { CRIPTA_STATUS_EFFECTS_REGISTRY } from '../../data/la-cripta/criptaStatusEffects';
import { laCriptaAudio } from '../../utils/laCriptaAudio';

const FINAL_BOSS_DUNGEON_DEF: CriptaDungeonDefinition = {
  id: 'el_abismo',
  index: 20,
  name: 'El Corazón de la Cripta',
  subtitle: 'Santuario Abisal del Rey Exánime',
  description:
    'Tras superar los tres sellos ancestrales, las puertas convergen en el trono donde late el Corazón de la Cripta.',
  palette: {
    stone: '#1E112A',
    stoneDark: '#0D0714',
    highlight: '#FFD166',
    glow: '#E7A54A',
    fog: '#2A0F21',
    secondary: '#C93B5B',
  },
  dangerProfile: {
    tier: 'EXTREMO',
    primaryThreat: 'Cataclismo del Eclipse',
    trapDensity: 'ALTA',
  },
  enemyPool: ['soberano_del_umbral'],
  elitePool: ['corazon_de_la_cripta'],
  roomPool: ['BOSS'],
  eventPool: [],
  shopPool: [],
  treasurePool: [],
  bossPool: ['soberano_del_umbral'],
  environmentModifiers: ['Eclipse Abisal'],
  musicKey: 'abyssal_sanctum',
  artTheme: {
    archStyle: 'abyssal_rift',
    ambientEffect: 'void_tendrils',
    reliefMotif: 'Eclipse Abisal',
    doorMaterial: 'Obsidiana y Oro',
    hoverPrompt: 'Cruzar el Umbral Final',
  },
};

interface LaCriptaThreeDoorsSceneProps {
  expeditionState: CriptaExpeditionState;
  currentPlayerId: string;
  activeVisualEvents?: CriptaVisualEvent[];
  enemyAnimStates?: Record<string, 'idle' | 'hit' | 'lunge' | 'death'>;
  onVoteDoor: (dungeonId: CriptaDungeonId) => void;
  onVoteFinalBossDoor?: () => void;
  onRetryDungeonInit?: () => void;
  onCombatAction?: (
    action: 'ATTACK' | 'ABILITY' | 'DEFEND',
    targetEnemyId?: string
  ) => void;
  onLockRoundAction?: (
    actionType: CriptaPlayerRoundActionType | 'USE_ITEM',
    targetEnemyId?: string,
    targetPlayerId?: string,
    abilityId?: string,
    itemSlotIndex?: number
  ) => void;
  onUnlockRoundAction?: () => void;
  onUseConsumable?: (
    slotIndex: number,
    targetEnemyId?: string,
    targetPlayerId?: string
  ) => void;
  onBuyShopSlot?: (slotId: string) => void;
  onInteractRoomObject?: (objectId: string) => void;
  onUpgradeWeapon?: () => void;
  onReviveAlly?: (
    targetPlayerId: string,
    method: 'GOLD' | 'BLOOD' | 'SHRINE'
  ) => void;
  onInteractOption?: (optionId: string) => void;
  onPuzzleInput?: (runeIndex: number) => void;
  onDiscoverSecret?: () => void;
  onAdvanceRoom?: () => void;
  onClaimGroundDrop?: (dropId: string) => void;
  onShopBuyItem?: (offerId: string) => void;
  onShopBuyRelic?: () => void;
  onSelectedEnemyChange?: (enemyId: string | null) => void;
  onReturnToLobby: () => void;
  onRerollExpedition: () => void;
}

export const LaCriptaThreeDoorsScene: React.FC<LaCriptaThreeDoorsSceneProps> = ({
  expeditionState,
  currentPlayerId,
  activeVisualEvents = [],
  enemyAnimStates = {},
  onVoteDoor,
  onVoteFinalBossDoor,
  onRetryDungeonInit,
  onCombatAction,
  onLockRoundAction,
  onUnlockRoundAction,
  onUseConsumable,
  onBuyShopSlot,
  onInteractRoomObject,
  onUpgradeWeapon,
  onReviveAlly,
  onInteractOption,
  onPuzzleInput,
  onDiscoverSecret,
  onAdvanceRoom,
  onClaimGroundDrop,
  onSelectedEnemyChange,
  onReturnToLobby,
  onRerollExpedition,
}) => {
  const [hoveredDoorId, setHoveredDoorId] = useState<CriptaDungeonId | null>(null);
  const [selectedEnemyId, setSelectedEnemyId] = useState<string | null>(null);
  const [inspectedEnemyId, setInspectedEnemyId] = useState<string | null>(null);
  const [showCombatItemPicker, setShowCombatItemPicker] = useState(false);

  useEffect(() => {
    onSelectedEnemyChange?.(selectedEnemyId);
  }, [selectedEnemyId, onSelectedEnemyChange]);

  const connectedPlayers = expeditionState.players.filter((p) => p.isConnected);
  const totalConnected = Math.max(1, connectedPlayers.length);
  const isSolo = totalConnected === 1;
  const me = expeditionState.players.find((p) => p.id === currentPlayerId);
  const isHost = Boolean(me?.isHost);
  const myCharId = me?.characterId ?? me?.selectedCharacterId ?? null;
  const myCharDef = myCharId ? CRIPTA_CHARACTERS_CATALOG[myCharId] : null;
  const myVotedDoor = expeditionState.doorVotes[currentPlayerId] || null;
  const completedDoorCount = expeditionState.completedDoorCount ?? 0;

  const isOpeningPhase =
    expeditionState.phase === 'ENTERING_DUNGEON' ||
    expeditionState.phase === 'DOOR_OPENING';

  const isFinalBossCombat = expeditionState.phase === 'FINAL_BOSS_COMBAT';

  const isInsideDungeonPhase =
    expeditionState.phase === 'DUNGEON' ||
    expeditionState.phase === 'DUNGEON_ARRIVAL' ||
    isFinalBossCombat;

  // ===========================================================================
  // PHASE 2: PROCEDURAL DUNGEON EXPLORATION & FINAL BOSS COMBAT
  // ===========================================================================
  if (isInsideDungeonPhase && (expeditionState.selectedDungeonId || isFinalBossCombat)) {
    const chosenDungeon = isFinalBossCombat
      ? FINAL_BOSS_DUNGEON_DEF
      : expeditionState.selectedDungeonId
      ? CRIPTA_DUNGEONS_REGISTRY[expeditionState.selectedDungeonId]
      : FINAL_BOSS_DUNGEON_DEF;
    if (!chosenDungeon) return null;

    const roomSequence = expeditionState.roomSequence || [];
    const currentRoomIndex = expeditionState.currentRoomIndex ?? 0;
    const inSecretRoom = Boolean(expeditionState.inSecretRoom);
    const activeRoom =
      inSecretRoom && expeditionState.discoveredSecretRoom
        ? expeditionState.discoveredSecretRoom
        : roomSequence[currentRoomIndex] || null;

    const partyGold = expeditionState.partyGold ?? 35;

    if (!activeRoom) {
      return null;
    }

    const livingEnemies = activeRoom.enemies.filter((e) => e.hp > 0);
    // Keep recently defeated enemies visible during their short death dissolve animation
    const visibleRoomEnemies = activeRoom.enemies.filter(
      (e) => e.hp > 0 || enemyAnimStates[e.id] === 'death'
    );
    const activeTargetEnemy =
      livingEnemies.find((e) => e.id === selectedEnemyId) || livingEnemies[0] || null;
    const inspectedEnemy =
      activeRoom.enemies.find((e) => e.id === inspectedEnemyId) || null;
    const discoveredAbilityIds = expeditionState.discoveredEnemyAbilityIds || [];

    const iAmDead = Boolean(
      me?.isDead || (me?.characterId && (me?.maxHp || 0) > 0 && (me?.hp || 0) <= 0)
    );
    const fallenPlayers = expeditionState.players.filter(
      (p) => p.isConnected && (p.isDead || (p.characterId && p.maxHp > 0 && p.hp <= 0))
    );
    const aliveOrderedPlayers = [...expeditionState.players]
      .filter((p) => p.isConnected && !p.isDead && p.hp > 0)
      .sort((a, b) => a.seatIndex - b.seatIndex);

    // Simultaneous Round Combat State
    const combatRoundPhase = activeRoom.combatRoundPhase || 'PLAYER_PHASE';
    const isPlayerPhase = combatRoundPhase === 'PLAYER_PHASE';
    const queuedActions = activeRoom.queuedPlayerActions || {};
    const myQueuedAction = me ? queuedActions[me.id] : undefined;
    const iHaveLockedAction = Boolean(myQueuedAction?.locked);

    // Events displayed in the central room stage (non-targeted room rewards, gold, loot, secrets)
    const roomCenterEvents = activeVisualEvents.filter(
      (ev) => ev.targetType === 'ROOM' || ev.targetType === 'PARTY'
    );
    const roomCenterVfxEvent = [...roomCenterEvents]
      .reverse()
      .find((ev) => Boolean(ev.vfxStyle));

    // Local Player Weapon, Equipment & Damage Estimates
    const myEffectiveStats = me ? computePlayerEffectiveStats(me) : null;
    const myEquippedWeapon = me ? getEquippedWeaponForPlayer(me) : null;
    const myWeapon = myEquippedWeapon?.weapon || null;
    const myWeaponLv = myEquippedWeapon?.level || 1;
    const mySpecialCd = me?.weaponSpecialCooldown || 0;
    const myArmor = me?.equippedArmorId
      ? CRIPTA_ARMORS_REGISTRY[me.equippedArmorId]
      : null;
    const myAccessory = me?.equippedAccessoryId
      ? CRIPTA_ACCESSORIES_REGISTRY[me.equippedAccessoryId]
      : null;
    const myInventory = me?.normalInventory || [];

    const attackEst =
      me && activeTargetEnemy
        ? estimatePlayerActionDamage(
            me,
            'ATTACK',
            activeTargetEnemy,
            livingEnemies,
            expeditionState.partyRelics || []
          )
        : null;
    const specialEst =
      me && activeTargetEnemy
        ? estimatePlayerActionDamage(
            me,
            'WEAPON_SPECIAL',
            activeTargetEnemy,
            livingEnemies,
            expeditionState.partyRelics || []
          )
        : null;
    const abilityEst =
      me && activeTargetEnemy
        ? estimatePlayerActionDamage(
            me,
            'ABILITY',
            activeTargetEnemy,
            livingEnemies,
            expeditionState.partyRelics || []
          )
        : null;

    const isDefeated = Boolean(expeditionState.expeditionDefeated);
    const hasDiscountRelic = Boolean(
      me &&
        playerHasRelic(
          me,
          expeditionState.partyRelics || [],
          'moneda_del_muerto'
        )
    );

    const unclaimedDrops = (activeRoom.groundDrops || []).filter(
      (d) => !d.claimedByPlayerId
    );
    const isTransitioningDoor = Boolean(
      expeditionState.roomDoorTransition?.active
    );
    const isMinibossRoom =
      activeRoom.type === 'MINIBOSS' || Boolean(activeRoom.isMinibossRoom);
    const finalBossPhaseNum: 1 | 2 =
      expeditionState.finalBossState?.phase === 'PHASE_2' ? 2 : 1;

    const canAdvance =
      !isDefeated &&
      !isFinalBossCombat &&
      !isTransitioningDoor &&
      unclaimedDrops.length === 0 &&
      (activeRoom.resolved ||
        activeRoom.type === 'SHOP' ||
        activeRoom.type === 'REST' ||
        activeRoom.type === 'LOOT');

    const readyPlayerIds = activeRoom.readyToAdvancePlayerIds || [];
    const iAmReadyToAdvance = readyPlayerIds.includes(currentPlayerId);

    const submitPlayerCombatChoice = (
      actionType: CriptaPlayerRoundActionType | 'USE_ITEM',
      itemSlotIndex?: number
    ) => {
      if (iAmDead || !isPlayerPhase) return;
      laCriptaAudio.playDoorVote();
      if (onLockRoundAction) {
        onLockRoundAction(
          actionType,
          activeTargetEnemy?.id,
          undefined,
          myCharDef?.abilities[0]?.id,
          itemSlotIndex
        );
      } else if (
        onCombatAction &&
        (actionType === 'ATTACK' || actionType === 'ABILITY' || actionType === 'DEFEND')
      ) {
        onCombatAction(actionType, activeTargetEnemy?.id);
      }
      setShowCombatItemPicker(false);
    };

    const forgeUpgradeCost = myWeaponLv === 1 ? 30 : 45;
    const canForgeUpgradeHere =
      (activeRoom.type === 'REST' || activeRoom.type === 'SHOP') &&
      Boolean(myWeapon) &&
      myWeaponLv < WEAPON_UPGRADE_MAX_LEVEL;

    return (
      <div className="relative flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-2 flex flex-col justify-between gap-2.5 select-none">
        {/* GIANT PHYSICAL DUNGEON DOOR TRANSITION BETWEEN EVERY ROOM */}
        <LaCriptaGiantDoorTransition
          transition={expeditionState.roomDoorTransition}
          totalRooms={roomSequence.length}
        />

        {/* 1. COMPACT TOP ROOM PROGRESS TRACKER */}
        {roomSequence.length > 0 && (
          <LaCriptaRoomProgressTracker
            dungeon={chosenDungeon}
            floor={expeditionState.floor || 1}
            rooms={roomSequence}
            currentRoomIndex={currentRoomIndex}
            inSecretRoom={inSecretRoom}
            partyGold={partyGold}
            lengthTier={expeditionState.dungeonLengthTier || 'MEDIA'}
            completedDoorCount={completedDoorCount}
          />
        )}

        {/* 2. TWO-COLUMN VISUAL ENCOUNTER BOARD (SECTION 1) */}
        <section
          className="relative border-2 p-3 sm:p-4 overflow-hidden shadow-[0_16px_44px_rgba(0,0,0,0.92)] flex flex-col gap-3"
          style={{
            backgroundColor: '#120D17',
            borderColor: isDefeated
              ? '#8F263D'
              : isFinalBossCombat
              ? finalBossPhaseNum === 2
                ? '#C93B5B'
                : '#E7A54A'
              : isMinibossRoom
              ? '#C93B5B'
              : chosenDungeon.palette.glow,
            backgroundImage: `radial-gradient(circle at 30% 25%, ${chosenDungeon.palette.fog}99 0%, #0B0A0E 85%)`,
          }}
        >
          {/* Room Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#282039] pb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-8 h-8 border-2 flex items-center justify-center shrink-0 bg-[#09070D]"
                style={{
                  borderColor: isMinibossRoom
                    ? '#C93B5B'
                    : chosenDungeon.palette.glow,
                }}
              >
                <LaCriptaRoomTypeIcon
                  type={activeRoom.type}
                  color={
                    isMinibossRoom ? '#FFD166' : chosenDungeon.palette.highlight
                  }
                  size={18}
                />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-cripta-pixel uppercase tracking-widest text-[#E7A54A]">
                  <span>
                    {isFinalBossCombat
                      ? `SANTUARIO FINAL · FASE ${finalBossPhaseNum} DE 2`
                      : inSecretRoom
                      ? 'CÁMARA OCULTA'
                      : `PUERTA ${Math.min(3, completedDoorCount + 1)}/3 · SALA ${activeRoom.roomNumber} DE ${roomSequence.length} · ${(
                          ROOM_TYPE_LABELS[activeRoom.type] || activeRoom.type
                        ).toUpperCase()}`}
                  </span>
                  {isMinibossRoom && !activeRoom.resolved && (
                    <span className="px-1.5 py-0.2 bg-[#2A0E19] border border-[#C93B5B] text-[9px] text-[#FFD166] font-bold">
                      ★ GUARDIÁN DE MAZMORRA
                    </span>
                  )}
                  {activeRoom.resolved && unclaimedDrops.length > 0 && (
                    <span className="px-1.5 py-0.2 bg-[#261810] border border-[#FFD166] text-[9px] text-[#FFD166] animate-pulse">
                      ✦ RECOGIENDO BOTÍN ({unclaimedDrops.length})
                    </span>
                  )}
                  {activeRoom.resolved && unclaimedDrops.length === 0 && (
                    <span className="px-1.5 py-0.2 bg-[#112419] border border-[#5EA87A] text-[9px] text-[#5EA87A]">
                      ✓ SALA DESPEJADA
                    </span>
                  )}
                </div>
                <h1
                  className="font-cripta-display text-lg sm:text-2xl font-black tracking-wide truncate"
                  style={{ color: chosenDungeon.palette.highlight }}
                >
                  {activeRoom.title}
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {expeditionState.eventFlags?.fedCryptHound && (
                <span
                  className="px-2 py-1 bg-[#14241B] border border-[#5EA87A] text-[9px] font-cripta-pixel text-[#5EA87A]"
                  title="La Sabuesa de la Cripta os acompaña hacia el Jefe"
                >
                  🐕 SABUESA LEAL ACTIVA
                </span>
              )}
              {isHost && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      laCriptaAudio.playDoorVote();
                      onRerollExpedition();
                    }}
                    className="px-2.5 py-1 bg-[#19111D] hover:bg-[#282039] border border-[#E7A54A]/50 text-[#E7A54A] font-cripta-pixel text-[10px] transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Compass className="w-3 h-3" />
                    <span className="hidden sm:inline">REINICIAR</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      laCriptaAudio.playStoneClick();
                      onReturnToLobby();
                    }}
                    className="px-2.5 py-1 bg-[#0B0A0E] hover:bg-[#282039] border border-[#D8C6A0]/30 text-[#D8C6A0] font-cripta-pixel text-[10px] transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span className="hidden sm:inline">PREPARACIÓN</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* ================================================================= */}
          {/* TWO-COLUMN ENCOUNTER BOARD: LEFT (STAGE 40%) + RIGHT (ACTIONS 60%) */}
          {/* ================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
            {/* =============================================================== */}
            {/* LEFT COLUMN (5/12 ≈ 41.6%): LARGE ANIMATED ENEMY / NPC STAGE     */}
            {/* =============================================================== */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-2.5">
              <div className="relative flex-1 min-h-[250px] sm:min-h-[320px] flex flex-col">
                {isFinalBossCombat ? (
                  <div className="relative w-full h-full min-h-[250px] sm:min-h-[320px] border-2 border-[#282039] bg-[#08050C] overflow-hidden">
                    <LaCriptaFinalBossRoomArt phase={finalBossPhaseNum} />
                  </div>
                ) : (
                  <LaCriptaRoomEnvironmentCanvas
                    dungeon={chosenDungeon}
                    room={activeRoom}
                    canAdvance={canAdvance && !expeditionState.dungeonCompleted}
                    unclaimedDropsCount={unclaimedDrops.length}
                    onClickExitArchway={() => {
                      if (onAdvanceRoom) {
                        laCriptaAudio.playDoorVote();
                        onAdvanceRoom();
                      }
                    }}
                    onClickSecretHook={
                      onDiscoverSecret
                        ? () => {
                            laCriptaAudio.playDoorVote();
                            onDiscoverSecret();
                          }
                        : undefined
                    }
                    onClickInteractiveObject={
                      onInteractRoomObject
                        ? (objId) => {
                            laCriptaAudio.playStoneClick();
                            onInteractRoomObject(objId);
                          }
                        : undefined
                    }
                    className="flex-1"
                  />
                )}

                {/* Physical Ground Loot Drops inside the Room */}
                {onClaimGroundDrop && unclaimedDrops.length > 0 && (
                  <LaCriptaGroundDropsOverlay
                    drops={activeRoom.groundDrops || []}
                    onClaimDrop={(dropId) => {
                      laCriptaAudio.playHeroSelect();
                      onClaimGroundDrop(dropId);
                    }}
                  />
                )}

                {/* Central Room Visual Feedback Overlay */}
                {(roomCenterEvents.length > 0 || roomCenterVfxEvent?.vfxStyle) && (
                  <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center">
                    {roomCenterVfxEvent?.vfxStyle && (
                      <LaCriptaCombatVfxOverlay
                        styleType={roomCenterVfxEvent.vfxStyle}
                        size={96}
                      />
                    )}
                    <div className="flex flex-col items-center gap-1 -mt-2">
                      {roomCenterEvents.slice(-3).map((ev, idx) => (
                        <LaCriptaFloatingEventBadge
                          key={ev.id}
                          event={ev}
                          indexOffset={idx}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Large Focal Enemies on the Left Stage (Section 2) */}
                {visibleRoomEnemies.length > 0 && (
                  <div className="pointer-events-none absolute inset-x-2 bottom-2 top-3 flex items-end justify-center">
                    <div className="pointer-events-auto flex flex-wrap items-end justify-center gap-2.5 sm:gap-4 w-full px-1">
                      {visibleRoomEnemies.map((enemy) => {
                        const isDying =
                          enemy.hp <= 0 || enemyAnimStates[enemy.id] === 'death';
                        const isTargeted =
                          !isDying && activeTargetEnemy?.id === enemy.id;
                        const isInspected = inspectedEnemy?.id === enemy.id;
                        const hpPct = Math.max(
                          0,
                          Math.min(
                            100,
                            Math.round((enemy.hp / Math.max(1, enemy.maxHp)) * 100)
                          )
                        );
                        const threatDef = enemy.statusThreat
                          ? CRIPTA_STATUS_EFFECTS_REGISTRY[enemy.statusThreat]
                          : null;
                        const enemyEvents = activeVisualEvents.filter(
                          (ev) => ev.targetType === 'ENEMY' && ev.targetId === enemy.id
                        );
                        const latestEnemyVfx = [...enemyEvents]
                          .reverse()
                          .find((ev) => Boolean(ev.vfxStyle));
                        const currentEnemyAnim =
                          enemyAnimStates[enemy.id] || (isDying ? 'death' : 'idle');

                        return (
                          <div
                            key={enemy.id}
                            className={`relative flex flex-col items-center transition-transform ${
                              isDying
                                ? 'pointer-events-none'
                                : isTargeted
                                ? '-translate-y-1'
                                : 'opacity-90 hover:opacity-100'
                            }`}
                          >
                            {/* Floating Damage / Crit / Defeat Popups over Enemy */}
                            {enemyEvents.length > 0 && (
                              <div className="pointer-events-none absolute -top-9 inset-x-0 z-40 flex flex-col items-center gap-1">
                                {enemyEvents.slice(-3).map((ev, idx) => (
                                  <LaCriptaFloatingEventBadge
                                    key={ev.id}
                                    event={ev}
                                    indexOffset={idx}
                                  />
                                ))}
                              </div>
                            )}

                            {/* Enemy Intent + Inspect Button */}
                            {!isDying && (
                              <div className="mb-1 flex items-center gap-1">
                                <div className="flex items-center gap-1 px-2 py-0.5 bg-[#19111D]/95 border border-[#C93B5B] text-[9px] font-cripta-pixel text-[#E7A54A] shadow">
                                  <span title="Intención del enemigo en la fase enemiga">
                                    ⚔ {enemy.intent} ({enemy.intentValue})
                                  </span>
                                  {threatDef && enemy.statusThreat && (
                                    <span
                                      className="inline-flex items-center gap-0.5 pl-1 border-l border-[#282039]"
                                      style={{
                                        color: threatDef.visualTreatment.color,
                                      }}
                                      title={`Amenaza: ${threatDef.name}`}
                                    >
                                      <LaCriptaStatusPixelIcon
                                        effectType={enemy.statusThreat}
                                        size={9}
                                      />
                                      <span>{threatDef.code}</span>
                                    </span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    laCriptaAudio.playStoneClick();
                                    setInspectedEnemyId((prev) =>
                                      prev === enemy.id ? null : enemy.id
                                    );
                                  }}
                                  title="Inspeccionar estadísticas y habilidades del enemigo"
                                  className={`px-1.5 py-0.5 border text-[9px] font-cripta-pixel flex items-center gap-0.5 cursor-pointer transition-colors ${
                                    isInspected
                                      ? 'bg-[#E7A54A] border-[#FFF3C4] text-[#0B0A0E] font-bold'
                                      : 'bg-[#09070D]/95 hover:bg-[#282039] border-[#E7A54A]/60 text-[#E7A54A]'
                                  }`}
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>INFO</span>
                                </button>
                              </div>
                            )}

                            {/* Clickable Large Enemy Sprite */}
                            <button
                              type="button"
                              disabled={isDying}
                              onClick={() => {
                                if (isDying) return;
                                laCriptaAudio.playStoneClick();
                                setSelectedEnemyId(enemy.id);
                              }}
                              className="relative flex flex-col items-center cursor-pointer"
                            >
                              <div className="relative flex items-center justify-center">
                                <LaCriptaEnemyPixelSprite
                                  enemy={enemy}
                                  isTargeted={isTargeted}
                                  animState={currentEnemyAnim}
                                  totalVisibleEnemies={visibleRoomEnemies.length}
                                />
                                {latestEnemyVfx?.vfxStyle && (
                                  <LaCriptaCombatVfxOverlay
                                    styleType={latestEnemyVfx.vfxStyle}
                                    size={enemy.isBoss ? 136 : 104}
                                  />
                                )}
                              </div>

                              {/* Enemy HP Bar, Armor & Active Statuses */}
                              <div
                                className="mt-0.5 px-2.5 py-1 bg-[#09070D]/95 border-2 text-center min-w-[124px] shadow-[0_6px_16px_rgba(0,0,0,0.9)]"
                                style={{
                                  borderColor: enemy.enrageTriggered
                                    ? '#C93B5B'
                                    : isTargeted
                                    ? '#E7A54A'
                                    : '#282039',
                                }}
                              >
                                {(enemy.isMiniboss || enemy.enrageTriggered) && (
                                  <div className="mb-0.5 flex items-center justify-center gap-1">
                                    {enemy.isMiniboss && (
                                      <span className="px-1 py-0.2 bg-[#26111B] border border-[#E7A54A] text-[7px] font-cripta-pixel font-bold text-[#FFD166] uppercase">
                                        ★ MINIJEFE
                                      </span>
                                    )}
                                    {enemy.enrageTriggered && (
                                      <span className="px-1 py-0.2 bg-[#360E1B] border border-[#C93B5B] text-[7px] font-cripta-pixel font-bold text-[#FF6B8B] uppercase animate-pulse">
                                        🔥 ENFURECIDO
                                      </span>
                                    )}
                                  </div>
                                )}
                                <div className="flex items-center justify-center gap-1">
                                  {isTargeted && (
                                    <span className="text-[8px] font-cripta-pixel text-[#E7A54A]">
                                      ▶
                                    </span>
                                  )}
                                  <span className="text-[10px] font-cripta-pixel font-bold text-[#D9D0BC] truncate max-w-[136px]">
                                    {enemy.name}
                                  </span>
                                </div>
                                <div className="mt-1 w-full h-2.5 bg-[#19111D] border border-[#282039]">
                                  <div
                                    className="h-full bg-[#C93B5B] transition-all duration-200"
                                    style={{ width: `${hpPct}%` }}
                                  />
                                </div>
                                <div className="mt-0.5 flex items-center justify-between gap-2 text-[9px] font-cripta-mono text-[#D8C6A0]">
                                  <span>
                                    {Math.max(0, enemy.hp)}/{enemy.maxHp} PV
                                  </span>
                                  <span className="text-[#69A8A5]">
                                    🛡 {enemy.armor || 0}
                                  </span>
                                </div>
                                {((enemy.poisonStacks || 0) > 0 ||
                                  (enemy.vulnerableTurns || 0) > 0) && (
                                  <div className="mt-1 flex flex-wrap items-center justify-center gap-1">
                                    {(enemy.poisonStacks || 0) > 0 && (
                                      <LaCriptaStatusEffectBadge
                                        status={{
                                          type: 'VENENO',
                                          turnsRemaining: enemy.poisonStacks || 1,
                                          potency: enemy.poisonStacks || 1,
                                        }}
                                        compact
                                      />
                                    )}
                                    {(enemy.vulnerableTurns || 0) > 0 && (
                                      <LaCriptaStatusEffectBadge
                                        status={{
                                          type: 'VULNERABLE',
                                          turnsRemaining: enemy.vulnerableTurns || 1,
                                          potency: 1,
                                        }}
                                        compact
                                      />
                                    )}
                                  </div>
                                )}
                              </div>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* ENEMY INSPECTION PANEL WITH PROGRESSIVE KNOWLEDGE (SECTIONS 6 & 7) */}
              {inspectedEnemy && (
                <div className="p-2.5 bg-[#0D0914] border-2 border-[#E7A54A] shadow-[0_8px_24px_rgba(0,0,0,0.95)] flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2 border-b border-[#282039] pb-1">
                    <div className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-[#E7A54A]" />
                      <span className="font-cripta-pixel text-[11px] font-bold text-[#FFD166]">
                        INSPECCIÓN: {inspectedEnemy.name.toUpperCase()}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setInspectedEnemyId(null)}
                      className="p-0.5 text-[#D8C6A0]/70 hover:text-[#FFD166] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {(() => {
                    const aiProfile =
                      inspectedEnemy.aiProfile ||
                      buildEnemyAiProfileForArchetype(inspectedEnemy).aiProfile;
                    const approxRange = computeEnemyApproxDamageRange(inspectedEnemy);
                    const abilitiesList = aiProfile?.abilities || [];

                    return (
                      <>
                        <div className="grid grid-cols-3 gap-1.5 text-[9px] font-cripta-mono">
                          <div className="px-2 py-1 bg-[#140F1D] border border-[#282039]">
                            <span className="text-[#D8C6A0]/65 block">SALUD / DEF</span>
                            <span className="text-[#D9D0BC] font-bold">
                              {inspectedEnemy.hp}/{inspectedEnemy.maxHp} PV · 🛡
                              {inspectedEnemy.armor || 0}
                            </span>
                          </div>
                          <div className="px-2 py-1 bg-[#140F1D] border border-[#282039]">
                            <span className="text-[#D8C6A0]/65 block">DAÑO EST.</span>
                            <span className="text-[#C93B5B] font-bold">
                              ⚔ {approxRange.min}–{approxRange.max}
                            </span>
                          </div>
                          <div className="px-2 py-1 bg-[#140F1D] border border-[#282039]">
                            <span className="text-[#D8C6A0]/65 block">CONDUCTA IA</span>
                            <span className="text-[#E7A54A] font-bold">
                              {aiProfile?.personality ||
                                inspectedEnemy.roleTag ||
                                'TÁCTICO'}
                            </span>
                          </div>
                        </div>

                        {abilitiesList.length > 0 && (
                          <div className="flex flex-col gap-1 mt-0.5">
                            <span className="text-[8px] font-cripta-pixel uppercase tracking-wider text-[#D8C6A0]/70">
                              HABILIDADES DEL ENEMIGO (CONOCIMIENTO PROGRESIVO):
                            </span>
                            {abilitiesList.map((ab) => {
                              const isDiscovered =
                                discoveredAbilityIds.includes(ab.id) ||
                                ab.actionKind === 'BASIC_ATTACK';
                              return (
                                <div
                                  key={ab.id}
                                  className="px-2 py-1 bg-[#140F1D] border border-[#282039] flex items-center justify-between gap-2 text-[9px] font-cripta-pixel"
                                >
                                  {isDiscovered ? (
                                    <>
                                      <span className="text-[#E7A54A] font-bold">
                                        ✦ {ab.name}
                                      </span>
                                      <span className="text-[#D9D0BC]/80 text-right">
                                        {ab.statusToApply
                                          ? `Aplica ${ab.statusToApply} (${ab.statusTurns || 2}T)`
                                          : ab.actionKind === 'HEAL_ALLY' ||
                                            ab.actionKind === 'HEAL_SELF'
                                          ? 'Cura aliado herido'
                                          : ab.actionKind === 'BUFF_ALLY' ||
                                            ab.actionKind === 'DEFEND_SELF' ||
                                            ab.actionKind === 'DEFEND_ALLY'
                                          ? 'Refuerza armadura'
                                          : ab.targetScope === 'ALL_PLAYERS'
                                          ? 'Ataque a todo el grupo'
                                          : 'Golpe directo'}
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="text-[#9B72CF]">
                                        ??? Habilidad desconocida
                                      </span>
                                      <span className="text-[#D8C6A0]/50 italic">
                                        Se revela al observarla en combate
                                      </span>
                                    </>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Atmospheric Room Narrative / NPC Quote & Outcome Log */}
              <div className="px-3 py-2 bg-[#09070D] border border-[#282039] flex flex-col gap-1">
                {activeRoom.encounterSubject?.dialogueQuote && !activeRoom.resolved && (
                  <div className="text-[11px] font-cripta-pixel text-[#FFD166] italic border-b border-[#282039] pb-1">
                    <span className="font-bold not-italic text-[#E7A54A]">
                      {activeRoom.encounterSubject.name}:{' '}
                    </span>
                    {activeRoom.encounterSubject.dialogueQuote}
                  </div>
                )}
                <div className="text-xs font-cripta-pixel text-[#D9D0BC]">
                  {activeRoom.outcomeLog ? (
                    <span className="text-[#E7A54A]">▸ {activeRoom.outcomeLog}</span>
                  ) : (
                    <span className="text-[#D8C6A0]/85">{activeRoom.narrative}</span>
                  )}
                </div>
              </div>
            </div>

            {/* =============================================================== */}
            {/* RIGHT COLUMN (7/12 ≈ 58.4%): TACTICAL CONTEXT & ACTION AREA      */}
            {/* =============================================================== */}
            <div className="lg:col-span-7 flex flex-col justify-between gap-2.5">
              {/* DEFEAT / PARTY WIPE BANNER */}
              {isDefeated && (
                <div className="p-4 bg-[#1A080E] border-2 border-[#C93B5B] flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <LaCriptaFallenSoulIcon size={32} />
                    <div>
                      <div className="font-cripta-display text-lg sm:text-xl font-black text-[#C93B5B] uppercase">
                        {isSolo
                          ? 'HAS CAÍDO EN LAS PROFUNDIDADES'
                          : 'LA EXPEDICIÓN HA SIDO ANIQUILADA'}
                      </div>
                      <div className="text-xs font-cripta-pixel text-[#D9D0BC]">
                        Alcanzasteis la Sala {activeRoom.roomNumber} de {chosenDungeon.name}{' '}
                        con {partyGold} de oro acumulado.
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {isHost && (
                      <button
                        type="button"
                        onClick={() => {
                          laCriptaAudio.playDoorVote();
                          onRerollExpedition();
                        }}
                        className="px-4 py-2 bg-[#E7A54A] hover:bg-[#f2b863] text-[#0B0A0E] font-cripta-pixel text-xs font-bold cursor-pointer"
                      >
                        REINTENTAR EXPEDICIÓN
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        laCriptaAudio.playStoneClick();
                        onReturnToLobby();
                      }}
                      className="px-3.5 py-2 bg-[#09070D] hover:bg-[#282039] border border-[#D8C6A0]/40 text-[#D8C6A0] font-cripta-pixel text-xs cursor-pointer"
                    >
                      PREPARACIÓN
                    </button>
                  </div>
                </div>
              )}

              {/* FALLEN PLAYER / ALLY REVIVAL PANEL */}
              {!isDefeated && fallenPlayers.length > 0 && (
                <div className="p-2.5 bg-[#170B12] border-2 border-[#8F263D] flex flex-col gap-2">
                  {iAmDead ? (
                    <div className="flex items-center gap-2.5 text-xs font-cripta-pixel text-[#C93B5B]">
                      <LaCriptaFallenSoulIcon size={18} />
                      <span>
                        HAS CAÍDO EN COMBATE · Tus compañeros vivos pueden revivirte con un
                        Sello de Resurrección, en un Santuario, en una Hoguera o con el Clérigo.
                      </span>
                    </div>
                  ) : (
                    onReviveAlly && (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs font-cripta-pixel font-bold text-[#E7A54A]">
                            <LaCriptaFallenSoulIcon size={16} />
                            <span>COMPAÑERO CAÍDO · RESURRECCIÓN DISPONIBLE</span>
                          </div>
                          <span className="text-[10px] font-cripta-pixel text-[#D8C6A0]/80">
                            ORO DEL GRUPO: {partyGold}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {fallenPlayers.map((fallen) => {
                            const isFreeShrineOrRest =
                              activeRoom.type === 'SHRINE' || activeRoom.type === 'REST';
                            const canAffordGold = partyGold >= 20;
                            const bloodCost = myCharId === 'clerigo' ? 6 : 10;
                            const canAffordBlood = (me?.hp || 0) > bloodCost + 2;

                            return (
                              <div
                                key={fallen.id}
                                className="p-2 bg-[#09070D] border border-[#8F263D] flex flex-wrap items-center justify-between gap-2"
                              >
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="w-2.5 h-2.5 shrink-0"
                                    style={{ backgroundColor: fallen.color }}
                                  />
                                  <span className="font-cripta-pixel text-xs font-bold text-[#D9D0BC]">
                                    {fallen.name}
                                  </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-1.5">
                                  {isFreeShrineOrRest && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        laCriptaAudio.playDoorVote();
                                        onReviveAlly(fallen.id, 'SHRINE');
                                      }}
                                      className="px-2 py-1 bg-[#241B0D] hover:bg-[#382913] border border-[#E7A54A] text-[9px] font-cripta-pixel text-[#E7A54A] cursor-pointer"
                                    >
                                      LLAMA SAGRADA (GRATIS)
                                    </button>
                                  )}

                                  <button
                                    type="button"
                                    disabled={!canAffordGold}
                                    onClick={() => {
                                      laCriptaAudio.playDoorVote();
                                      onReviveAlly(fallen.id, 'GOLD');
                                    }}
                                    className={`px-2 py-1 border text-[9px] font-cripta-pixel ${
                                      canAffordGold
                                        ? 'bg-[#19111D] hover:bg-[#282039] border-[#E7A54A] text-[#E7A54A] cursor-pointer'
                                        : 'bg-[#0E0B12] border-[#282039] text-[#D8C6A0]/40 cursor-not-allowed'
                                    }`}
                                  >
                                    20 ORO
                                  </button>

                                  <button
                                    type="button"
                                    disabled={!canAffordBlood}
                                    onClick={() => {
                                      laCriptaAudio.playDoorVote();
                                      onReviveAlly(fallen.id, 'BLOOD');
                                    }}
                                    className={`px-2 py-1 border text-[9px] font-cripta-pixel ${
                                      canAffordBlood
                                        ? 'bg-[#240B12] hover:bg-[#38111C] border-[#C93B5B] text-[#D9D0BC] cursor-pointer'
                                        : 'bg-[#0E0B12] border-[#282039] text-[#D8C6A0]/40 cursor-not-allowed'
                                    }`}
                                  >
                                    -{bloodCost} PV
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* ============================================================= */}
              {/* A) TACTICAL ROUND-BASED COMBAT BOARD (SECTIONS 3, 4, 8, 9)    */}
              {/* ============================================================= */}
              {!isDefeated && livingEnemies.length > 0 && (
                <div className="flex flex-col gap-2.5">
                  {/* Round Phase Header & Target Switcher */}
                  <div className="px-3 py-2 bg-[#0E0B14] border-2 border-[#282039] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 bg-[#19111D] border border-[#E7A54A] text-[10px] font-cripta-pixel font-bold text-[#E7A54A]">
                        RONDA {activeRoom.combatTurn || 1}
                      </span>
                      <span
                        className={`px-2 py-0.5 border text-[10px] font-cripta-pixel font-bold ${
                          isPlayerPhase
                            ? 'bg-[#13241B] border-[#5EA87A] text-[#5EA87A]'
                            : 'bg-[#261019] border-[#C93B5B] text-[#C93B5B] animate-pulse'
                        }`}
                      >
                        {isPlayerPhase
                          ? '⚔ FASE DE JUGADORES'
                          : combatRoundPhase === 'ENEMY_PHASE'
                          ? '👹 FASE ENEMIGA EN CURSO...'
                          : '⚡ RESOLVIENDO ACCIONES...'}
                      </span>

                      {/* Simultaneous Player Readiness Badges */}
                      <div className="flex flex-wrap items-center gap-1">
                        {aliveOrderedPlayers.map((p) => {
                          const pLocked = Boolean(queuedActions[p.id]?.locked);
                          return (
                            <span
                              key={p.id}
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 border text-[9px] font-cripta-pixel ${
                                pLocked
                                  ? 'bg-[#12241B] border-[#5EA87A] text-[#5EA87A] font-bold'
                                  : 'bg-[#140F1A] border-[#E7A54A]/40 text-[#E7A54A]'
                              }`}
                            >
                              <span
                                className="w-1.5 h-1.5 shrink-0"
                                style={{ backgroundColor: p.color }}
                              />
                              <span className="truncate max-w-[68px]">{p.name}</span>
                              <span>{pLocked ? 'LISTO ✓' : '…'}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Target Enemy Switcher */}
                    {livingEnemies.length > 1 && (
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-[9px] font-cripta-pixel text-[#D8C6A0]/70">
                          OBJETIVO:
                        </span>
                        {livingEnemies.map((en) => {
                          const sel = activeTargetEnemy?.id === en.id;
                          return (
                            <button
                              key={en.id}
                              type="button"
                              onClick={() => {
                                laCriptaAudio.playStoneClick();
                                setSelectedEnemyId(en.id);
                              }}
                              className={`px-2 py-0.5 border text-[9px] font-cripta-pixel cursor-pointer ${
                                sel
                                  ? 'bg-[#241811] border-[#E7A54A] text-[#FFD166] font-bold'
                                  : 'bg-[#09070D] border-[#282039] text-[#D8C6A0]/70 hover:text-[#D9D0BC]'
                              }`}
                            >
                              ▶ {en.name} ({en.hp} PV)
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Equipped Weapon & Meaningful Stats Strip (Sections 3, 5, 10) */}
                  {me && myEffectiveStats && (
                    <div className="px-3 py-1.5 bg-[#150F1E] border border-[#352849] flex flex-wrap items-center justify-between gap-2 text-[10px] font-cripta-pixel">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[#FFD166] font-bold">
                          ⚔ {myWeapon ? myWeapon.name : 'Arma Base'}
                          {myWeaponLv > 1 ? ` +${myWeaponLv}` : ''}
                        </span>
                        {myArmor && (
                          <span className="px-1.5 py-0.5 bg-[#09070D] border border-[#69A8A5]/50 text-[9px] text-[#69A8A5]">
                            🛡 {myArmor.name}
                          </span>
                        )}
                        {myAccessory && (
                          <span className="px-1.5 py-0.5 bg-[#09070D] border border-[#9B72CF]/50 text-[9px] text-[#9B72CF]">
                            💍 {myAccessory.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2.5 font-cripta-mono text-[9px]">
                        <span
                          className="text-[#C93B5B]"
                          title="Ataque físico efectivo (aumenta daño de arma)"
                        >
                          ATQ {myEffectiveStats.attack}
                        </span>
                        <span
                          className="text-[#69A8A5]"
                          title="Defensa y armadura (mitiga daño recibido)"
                        >
                          DEF {myEffectiveStats.defense}
                        </span>
                        <span
                          className="text-[#9B72CF]"
                          title="Poder mágico (potencia habilidades y efectos)"
                        >
                          MAG {myEffectiveStats.magic}
                        </span>
                        <span
                          className="text-[#FFD166]"
                          title="Probabilidad de golpe crítico (x1.5 daño)"
                        >
                          CRIT {myEffectiveStats.critChancePct}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Locked Action Confirmation Banner (if player already locked action in multiplayer) */}
                  {iHaveLockedAction && isPlayerPhase && (
                    <div className="px-3 py-2 bg-[#12241B] border-2 border-[#5EA87A] flex items-center justify-between gap-2">
                      <div className="text-xs font-cripta-pixel text-[#5EA87A] font-bold">
                        ✓ ACCIÓN CONFIRMADA PARA ESTA RONDA · Esperando al resto del grupo...
                      </div>
                      {onUnlockRoundAction && (
                        <button
                          type="button"
                          onClick={() => {
                            laCriptaAudio.playStoneClick();
                            onUnlockRoundAction();
                          }}
                          className="px-2.5 py-1 bg-[#09070D] hover:bg-[#1E3529] border border-[#5EA87A] text-[10px] font-cripta-pixel text-[#D9D0BC] cursor-pointer"
                        >
                          CAMBIAR ACCIÓN
                        </button>
                      )}
                    </div>
                  )}

                  {/* TACTICAL COMBAT ACTION CARDS (2x3 Grid) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* 1. PRIMARY WEAPON ATTACK */}
                    <button
                      type="button"
                      disabled={iAmDead || !isPlayerPhase}
                      onClick={() => submitPlayerCombatChoice('ATTACK')}
                      className={`p-2.5 border-2 text-left transition-all flex items-start gap-2.5 ${
                        iAmDead || !isPlayerPhase
                          ? 'bg-[#0E0B12] border-[#282039] opacity-45 cursor-not-allowed'
                          : myQueuedAction?.actionType === 'ATTACK'
                          ? 'bg-[#2E1624] border-[#FFD166] shadow-[0_0_16px_rgba(255,209,102,0.3)] cursor-pointer'
                          : 'bg-[#1F121D] hover:bg-[#2E1A2B] border-[#C93B5B] hover:border-[#FFD166] cursor-pointer'
                      }`}
                    >
                      <Swords className="w-5 h-5 text-[#C93B5B] shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-cripta-pixel text-xs font-bold text-[#D9D0BC] truncate">
                            ATACAR · {myWeapon ? myWeapon.name : 'ARMA'}
                            {myWeaponLv > 1 ? ` +${myWeaponLv}` : ''}
                          </span>
                          {attackEst && (
                            <span className="font-cripta-mono text-[10px] font-bold text-[#FFD166] shrink-0">
                              {attackEst.label} DAÑO
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-cripta-pixel text-[#D8C6A0]/80 truncate mt-0.5">
                          Objetivo: {activeTargetEnemy?.name || 'Enemigo'}
                          {myWeapon?.onHitStatus
                            ? ` · Aplica ${myWeapon.onHitStatus}`
                            : ''}
                        </div>
                        {myEffectiveStats && (
                          <div className="mt-1 flex items-center gap-2 text-[9px] font-cripta-mono text-[#D8C6A0]/70">
                            <span className="text-[#5EA87A]">
                              ⚔ Escala con {myWeapon?.scalingStat || 'ATAQUE'}
                            </span>
                            <span className="text-[#E7A54A]">
                              💥 Crítico {myEffectiveStats.critChancePct}%
                            </span>
                          </div>
                        )}
                      </div>
                    </button>

                    {/* 2. WEAPON SPECIAL ATTACK (WITH COOLDOWN) */}
                    {myWeapon && (
                      <button
                        type="button"
                        disabled={iAmDead || !isPlayerPhase || mySpecialCd > 0}
                        onClick={() => submitPlayerCombatChoice('WEAPON_SPECIAL')}
                        className={`p-2.5 border-2 text-left transition-all flex items-start gap-2.5 ${
                          iAmDead || !isPlayerPhase || mySpecialCd > 0
                            ? 'bg-[#0E0B12] border-[#282039] opacity-45 cursor-not-allowed'
                            : myQueuedAction?.actionType === 'WEAPON_SPECIAL'
                            ? 'bg-[#2B1F11] border-[#FFD166] shadow-[0_0_16px_rgba(255,209,102,0.3)] cursor-pointer'
                            : 'bg-[#21170E] hover:bg-[#302114] border-[#E7A54A] hover:border-[#FFD166] cursor-pointer'
                        }`}
                      >
                        <Flame className="w-5 h-5 text-[#E7A54A] shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-cripta-pixel text-xs font-bold text-[#FFD166] truncate">
                              {myWeapon.specialAttack.name.toUpperCase()}
                            </span>
                            {mySpecialCd > 0 ? (
                              <span className="px-1.5 py-0.2 bg-[#09070D] border border-[#C93B5B] font-cripta-mono text-[9px] text-[#C93B5B] shrink-0">
                                RECARGA: {mySpecialCd}T
                              </span>
                            ) : (
                              specialEst && (
                                <span className="font-cripta-mono text-[10px] font-bold text-[#E7A54A] shrink-0">
                                  {specialEst.label} DAÑO
                                </span>
                              )
                            )}
                          </div>
                          <div className="text-[10px] font-cripta-pixel text-[#D8C6A0]/80 truncate mt-0.5">
                            {myWeapon.specialAttack.description}
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-[9px] font-cripta-mono text-[#D8C6A0]/70">
                            <span>
                              ⏳ Enfriamiento: {myWeapon.specialAttack.cooldownRounds} rondas
                            </span>
                            {myWeapon.specialAttack.appliesStatus && (
                              <span className="text-[#5EA87A]">
                                ✦ {myWeapon.specialAttack.appliesStatus}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    )}

                    {/* 3. CLASS ABILITY */}
                    <button
                      type="button"
                      disabled={iAmDead || !isPlayerPhase}
                      onClick={() => submitPlayerCombatChoice('ABILITY')}
                      className={`p-2.5 border-2 text-left transition-all flex items-start gap-2.5 ${
                        iAmDead || !isPlayerPhase
                          ? 'bg-[#0E0B12] border-[#282039] opacity-45 cursor-not-allowed'
                          : myQueuedAction?.actionType === 'ABILITY'
                          ? 'bg-[#281C38] border-[#FFD166] shadow-[0_0_16px_rgba(255,209,102,0.3)] cursor-pointer'
                          : 'bg-[#1B1326] hover:bg-[#281C38] border-[#9B72CF] hover:border-[#FFD166] cursor-pointer'
                      }`}
                    >
                      <Sparkles className="w-5 h-5 text-[#9B72CF] shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-cripta-pixel text-xs font-bold text-[#D9D0BC] truncate">
                            {(
                              myCharDef?.abilities[0]?.name || 'HABILIDAD DE CLASE'
                            ).toUpperCase()}
                          </span>
                          {abilityEst && (
                            <span className="font-cripta-mono text-[10px] font-bold text-[#9B72CF] shrink-0">
                              {myCharId === 'clerigo'
                                ? 'CURA + GOLPE'
                                : `${abilityEst.label} DAÑO`}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-cripta-pixel text-[#D8C6A0]/80 truncate mt-0.5">
                          {myCharDef?.abilities[0]?.description ||
                            'Técnica especial de clase'}
                        </div>
                        {abilityEst && (
                          <div className="mt-1 flex items-center gap-2 text-[9px] font-cripta-mono text-[#D8C6A0]/70">
                            <span className="text-[#5EA87A]">
                              ✦ {abilityEst.isMagical ? 'Poder Mágico' : 'Técnica Marcial'}
                            </span>
                            {abilityEst.targetCount > 1 && (
                              <span className="text-[#9B72CF] truncate">
                                Golpea a {abilityEst.targetCount} objetivos
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </button>

                    {/* 4. DEFEND / PARTY GUARD */}
                    <button
                      type="button"
                      disabled={iAmDead || !isPlayerPhase}
                      onClick={() => submitPlayerCombatChoice('DEFEND')}
                      className={`p-2.5 border-2 text-left transition-all flex items-start gap-2.5 ${
                        iAmDead || !isPlayerPhase
                          ? 'bg-[#0E0B12] border-[#282039] opacity-45 cursor-not-allowed'
                          : myQueuedAction?.actionType === 'DEFEND'
                          ? 'bg-[#192C32] border-[#FFD166] shadow-[0_0_16px_rgba(255,209,102,0.3)] cursor-pointer'
                          : 'bg-[#111E22] hover:bg-[#192C32] border-[#69A8A5] hover:border-[#FFD166] cursor-pointer'
                      }`}
                    >
                      <Shield className="w-5 h-5 text-[#69A8A5] shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-cripta-pixel text-xs font-bold text-[#D9D0BC] truncate">
                            DEFENDER · GUARDIA
                          </span>
                          <span className="font-cripta-mono text-[10px] font-bold text-[#69A8A5] shrink-0">
                            +ESCUDO (2T)
                          </span>
                        </div>
                        <div className="text-[10px] font-cripta-pixel text-[#D8C6A0]/80 truncate mt-0.5">
                          Otorga armadura al grupo, ESCUDO y contragolpe táctico
                        </div>
                        <div className="mt-1 text-[9px] font-cripta-mono text-[#69A8A5]">
                          🛡 Reduce daño enemigo entrante esta ronda
                        </div>
                      </div>
                    </button>

                    {/* 5. USE INVENTORY ITEM IN COMBAT */}
                    <button
                      type="button"
                      disabled={iAmDead || !isPlayerPhase || myInventory.length === 0}
                      onClick={() => {
                        laCriptaAudio.playStoneClick();
                        setShowCombatItemPicker((prev) => !prev);
                      }}
                      className={`p-2 border-2 text-left transition-all flex items-center justify-between gap-2 ${
                        iAmDead || !isPlayerPhase || myInventory.length === 0
                          ? 'bg-[#0E0B12] border-[#282039] opacity-45 cursor-not-allowed'
                          : showCombatItemPicker || myQueuedAction?.actionType === 'USE_ITEM'
                          ? 'bg-[#1F291E] border-[#FFD166] cursor-pointer'
                          : 'bg-[#141D16] hover:bg-[#1D2B20] border-[#5EA87A] cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Package className="w-4 h-4 text-[#5EA87A] shrink-0" />
                        <div className="min-w-0">
                          <div className="font-cripta-pixel text-[11px] font-bold text-[#D9D0BC]">
                            USAR OBJETO ({myInventory.length}/3)
                          </div>
                          <div className="text-[9px] font-cripta-pixel text-[#D8C6A0]/70 truncate">
                            {myInventory.length > 0
                              ? 'Pociones, elixires o bombas en tu turno'
                              : 'Sin consumibles en la mochila'}
                          </div>
                        </div>
                      </div>
                      <span className="text-[9px] font-cripta-pixel text-[#5EA87A] shrink-0">
                        {showCombatItemPicker ? 'CERRAR ▲' : 'ELEGIR ▼'}
                      </span>
                    </button>

                    {/* 6. PASS / HOLD POSITION */}
                    <button
                      type="button"
                      disabled={iAmDead || !isPlayerPhase}
                      onClick={() => submitPlayerCombatChoice('PASS')}
                      className={`p-2 border-2 text-left transition-all flex items-center justify-between gap-2 ${
                        iAmDead || !isPlayerPhase
                          ? 'bg-[#0E0B12] border-[#282039] opacity-45 cursor-not-allowed'
                          : myQueuedAction?.actionType === 'PASS'
                          ? 'bg-[#221B2E] border-[#FFD166] cursor-pointer'
                          : 'bg-[#14101C] hover:bg-[#1E182B] border-[#7656A8]/70 cursor-pointer'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-cripta-pixel text-[11px] font-bold text-[#D9D0BC]">
                          MANTENER POSICIÓN (PASAR)
                        </div>
                        <div className="text-[9px] font-cripta-pixel text-[#D8C6A0]/70 truncate">
                          +2 Armadura personal y reduce estados negativos en 1T
                        </div>
                      </div>
                      <span className="text-[9px] font-cripta-mono text-[#D8C6A0]">
                        +2 🛡
                      </span>
                    </button>
                  </div>

                  {/* Expandable Combat Consumable Picker */}
                  {showCombatItemPicker && myInventory.length > 0 && (
                    <div className="p-2.5 bg-[#111814] border-2 border-[#5EA87A] grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {myInventory.map((itemId, slotIdx) => {
                        const itemDef = CRIPTA_ITEMS_REGISTRY[itemId];
                        if (!itemDef) return null;
                        return (
                          <button
                            key={`${itemId}_${slotIdx}`}
                            type="button"
                            onClick={() => submitPlayerCombatChoice('USE_ITEM', slotIdx)}
                            className="p-2 bg-[#09070D] hover:bg-[#18261D] border border-[#5EA87A] text-left flex items-center gap-2 cursor-pointer"
                          >
                            <LaCriptaItemPixelIcon itemId={itemId} size={20} />
                            <div className="min-w-0 flex-1">
                              <div className="font-cripta-pixel text-[10px] font-bold text-[#FFD166] truncate">
                                {itemDef.name}
                              </div>
                              <div className="text-[9px] font-cripta-pixel text-[#5EA87A] truncate">
                                {itemDef.description}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================= */}
              {/* B) PUZZLE RUNE PEDESTALS                                      */}
              {/* ============================================================= */}
              {!isDefeated &&
                activeRoom.type === 'PUZZLE' &&
                activeRoom.puzzleRunes &&
                !activeRoom.puzzleRunes.solved &&
                onPuzzleInput && (
                  <div className="grid grid-cols-3 gap-2.5">
                    {[0, 1, 2].map((runeIdx) => {
                      const isActivated =
                        activeRoom.puzzleRunes?.currentInput.includes(runeIdx);
                      return (
                        <button
                          key={runeIdx}
                          type="button"
                          disabled={isActivated || iAmDead}
                          onClick={() => {
                            laCriptaAudio.playDoorVote();
                            onPuzzleInput(runeIdx);
                          }}
                          className={`p-3 border-2 text-center font-cripta-pixel transition-all ${
                            isActivated
                              ? 'bg-[#282039] border-[#E7A54A] text-[#E7A54A] cursor-default'
                              : iAmDead
                              ? 'bg-[#0E0B12] border-[#282039] text-[#D8C6A0]/40 cursor-not-allowed'
                              : 'bg-[#140F1A] hover:bg-[#22192B] border-[#7656A8] text-[#D9D0BC] cursor-pointer'
                          }`}
                        >
                          <div className="text-xs font-bold">
                            PEDESTAL RÚNICO {runeIdx + 1}
                          </div>
                          <div className="text-[10px] text-[#D8C6A0]/75 mt-0.5">
                            {isActivated ? '✦ SELLO ENCENDIDO' : 'PULSAR PARA ACTIVAR GLIFO'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

              {/* ============================================================= */}
              {/* C0) SHOP SHELVES, ARSENAL RACK, FORGE & RELIC PEDESTAL        */}
              {/* ============================================================= */}
              {!isDefeated &&
                activeRoom.type === 'SHOP' &&
                activeRoom.shopInventory &&
                activeRoom.shopInventory.length > 0 &&
                (onBuyShopSlot || onShopBuyItem) && (
                  <LaCriptaShopShelvesPanel
                    slots={activeRoom.shopInventory}
                    partyGold={partyGold}
                    disabled={iAmDead}
                    hasDiscountRelic={Boolean(hasDiscountRelic)}
                    localPlayer={me}
                    purchaseHistory={activeRoom.shopPurchaseHistory || []}
                    onBuySlot={(slotId) =>
                      (onBuyShopSlot || onShopBuyItem)?.(slotId)
                    }
                  />
                )}

              {/* ============================================================= */}
              {/* C1) REST / FORGE WEAPON UPGRADE BAR (SECTION 3)               */}
              {/* ============================================================= */}
              {!isDefeated &&
                canForgeUpgradeHere &&
                activeRoom.type === 'REST' &&
                onUpgradeWeapon &&
                myWeapon && (
                  <div className="p-2.5 bg-[#1C130E] border-2 border-[#E7A54A] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Hammer className="w-4 h-4 text-[#E7A54A] shrink-0" />
                      <div>
                        <div className="font-cripta-pixel text-[11px] font-bold text-[#FFD166]">
                          YUNQUE DE CAMPAÑA · TEMPLAR {myWeapon.name.toUpperCase()} (+
                          {myWeaponLv} → +{myWeaponLv + 1})
                        </div>
                        <div className="text-[9px] font-cripta-pixel text-[#D8C6A0]/80">
                          Aumenta permanentemente el daño base y poder especial de tu arma
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={partyGold < forgeUpgradeCost || iAmDead}
                      onClick={() => {
                        laCriptaAudio.playDoorVote();
                        onUpgradeWeapon();
                      }}
                      className={`px-3 py-1.5 border text-[10px] font-cripta-pixel font-bold ${
                        partyGold >= forgeUpgradeCost && !iAmDead
                          ? 'bg-[#E7A54A] hover:bg-[#f2b863] text-[#0B0A0E] border-[#FFF3C4] cursor-pointer'
                          : 'bg-[#0E0B12] border-[#282039] text-[#D8C6A0]/40 cursor-not-allowed'
                      }`}
                    >
                      MEJORAR ARMA ({forgeUpgradeCost} ORO)
                    </button>
                  </div>
                )}

              {/* ============================================================= */}
              {/* C) INTERACTIVE ROOM OPTIONS & EVENTS (SECTIONS 12, 13, 14)    */}
              {/* ============================================================= */}
              {!isDefeated && activeRoom.options.length > 0 && onInteractOption && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeRoom.options.map((opt) => {
                    const canAfford =
                      typeof opt.costGold !== 'number' || partyGold >= opt.costGold;
                    const votersForOpt = connectedPlayers.filter(
                      (p) => activeRoom.optionVotes?.[p.id] === opt.id
                    );
                    const partyHasRecClass =
                      opt.recommendedClass &&
                      connectedPlayers.some(
                        (p) => p.characterId === opt.recommendedClass
                      );
                    const grantedWeapon = opt.grantsWeaponId
                      ? CRIPTA_WEAPONS_REGISTRY[opt.grantsWeaponId]
                      : null;
                    const grantedArmor = opt.grantsArmorId
                      ? CRIPTA_ARMORS_REGISTRY[opt.grantsArmorId]
                      : null;
                    const grantedAcc = opt.grantsAccessoryId
                      ? CRIPTA_ACCESSORIES_REGISTRY[opt.grantsAccessoryId]
                      : null;

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={opt.resolved || !canAfford || iAmDead}
                        onClick={() => {
                          laCriptaAudio.playDoorVote();
                          onInteractOption(opt.id);
                        }}
                        className={`p-3 border-2 text-left transition-all flex flex-col justify-between gap-1.5 ${
                          opt.resolved
                            ? 'bg-[#0E0B12] border-[#282039] opacity-55 cursor-default'
                            : !canAfford || iAmDead
                            ? 'bg-[#140F1A] border-[#8F263D]/50 opacity-60 cursor-not-allowed'
                            : 'bg-[#15101D] hover:bg-[#22192E] border-[#7656A8] hover:border-[#E7A54A] cursor-pointer shadow-[0_6px_18px_rgba(0,0,0,0.6)]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-cripta-pixel text-xs font-bold text-[#E7A54A]">
                            {opt.label}
                          </span>
                          <div className="flex items-center gap-1 shrink-0">
                            {opt.riskLabel && (
                              <span
                                className={`px-1.5 py-0.5 border text-[8px] font-cripta-pixel font-bold ${
                                  opt.riskLabel === 'MUY ARRIESGADO'
                                    ? 'bg-[#290D16] border-[#C93B5B] text-[#C93B5B]'
                                    : opt.riskLabel === 'ARRIESGADO'
                                    ? 'bg-[#261B0D] border-[#E7A54A] text-[#E7A54A]'
                                    : 'bg-[#102219] border-[#5EA87A] text-[#5EA87A]'
                                }`}
                              >
                                {opt.riskLabel}
                              </span>
                            )}
                            {typeof opt.costGold === 'number' && (
                              <span className="px-1.5 py-0.5 bg-[#09070D] border border-[#E7A54A] text-[9px] font-cripta-pixel text-[#E7A54A]">
                                {opt.costGold} ORO
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-[11px] font-cripta-pixel text-[#D9D0BC]/85">
                          {opt.subtitle}
                        </div>

                        <div className="text-[10px] font-cripta-pixel text-[#5EA87A]">
                          {opt.effectText}
                        </div>

                        {/* Class / Stat Test / Equipment Grant Badges */}
                        {(opt.recommendedClass ||
                          opt.recommendedStat ||
                          grantedWeapon ||
                          grantedArmor ||
                          grantedAcc ||
                          opt.isWeaponUpgradeOption) && (
                          <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-[#282039]">
                            {opt.recommendedClass && (
                              <span
                                className={`px-1.5 py-0.5 border text-[8px] font-cripta-pixel uppercase ${
                                  partyHasRecClass
                                    ? 'bg-[#13261B] border-[#5EA87A] text-[#5EA87A] font-bold'
                                    : 'bg-[#19111D] border-[#7656A8]/50 text-[#D8C6A0]/75'
                                }`}
                              >
                                {partyHasRecClass ? '✓ ' : ''}CLASE IDEAL:{' '}
                                {CRIPTA_CHARACTERS_CATALOG[opt.recommendedClass]?.className ||
                                  opt.recommendedClass}
                              </span>
                            )}
                            {opt.recommendedStat && (
                              <span className="px-1.5 py-0.5 bg-[#19111D] border border-[#E7A54A]/50 text-[8px] font-cripta-pixel text-[#FFD166]">
                                PRUEBA: {opt.recommendedStat}{' '}
                                {opt.recommendedStatLevel ? `${opt.recommendedStatLevel}+` : ''}
                              </span>
                            )}
                            {grantedWeapon && (
                              <span className="px-1.5 py-0.5 bg-[#261810] border border-[#E7A54A] text-[8px] font-cripta-pixel text-[#FFD166]">
                                ⚔ ARMA: {grantedWeapon.name} ({grantedWeapon.baseMinDamage}–
                                {grantedWeapon.baseMaxDamage})
                              </span>
                            )}
                            {grantedArmor && (
                              <span className="px-1.5 py-0.5 bg-[#101E24] border border-[#69A8A5] text-[8px] font-cripta-pixel text-[#69A8A5]">
                                🛡 ARMADURA: {grantedArmor.name} (
                                {grantedArmor.specialEffectText})
                              </span>
                            )}
                            {grantedAcc && (
                              <span className="px-1.5 py-0.5 bg-[#1D1328] border border-[#9B72CF] text-[8px] font-cripta-pixel text-[#9B72CF]">
                                💍 ACCESORIO: {grantedAcc.name} ({grantedAcc.specialEffectText})
                              </span>
                            )}
                            {opt.isWeaponUpgradeOption && (
                              <span className="px-1.5 py-0.5 bg-[#261810] border border-[#FFD166] text-[8px] font-cripta-pixel text-[#FFD166]">
                                🔨 TEMPLA ARMA EQUIPADA +1 NIVEL
                              </span>
                            )}
                            {opt.ownershipScope && (
                              <span className="px-1.5 py-0.5 bg-[#09070D] border border-[#282039] text-[8px] font-cripta-pixel text-[#D8C6A0]/70">
                                {opt.ownershipScope === 'GRUPO' ||
                                opt.ownershipScope === 'EXPEDICIÓN'
                                  ? '👥 GRUPAL'
                                  : '👤 PERSONAL'}
                              </span>
                            )}
                          </div>
                        )}

                        {votersForOpt.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {votersForOpt.map((v) => (
                              <span
                                key={v.id}
                                className="px-1.5 py-0.2 bg-[#0B0A0E] border text-[9px] font-cripta-pixel text-[#D9D0BC]"
                                style={{ borderColor: v.color }}
                              >
                                {v.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ============================================================= */}
              {/* D) ROOM RESOLVED -> REWARD SETTLING -> CROSS GIANT DOOR       */}
              {/* ============================================================= */}
              {!isDefeated && activeRoom.resolved && unclaimedDrops.length > 0 && (
                <div className="p-3 bg-[#24170D] border-2 border-[#FFD166] flex flex-wrap items-center justify-between gap-2 shadow-[0_0_20px_rgba(255,209,102,0.25)]">
                  <div className="flex items-center gap-2 text-xs font-cripta-pixel text-[#FFD166] font-bold">
                    <span>✦</span>
                    <span>
                      SALA DESPEJADA · RECOGE EL BOTÍN EN EL SUELO ({unclaimedDrops.length}) ANTES DE CRUZAR LA PUERTA
                    </span>
                  </div>
                  <span className="text-[10px] font-cripta-pixel text-[#D9D0BC]/80">
                    Haz clic en el botín del escenario izquierdo para reclamarlo
                  </span>
                </div>
              )}

              {expeditionState.dungeonCompleted && unclaimedDrops.length === 0 ? (
                <div className="p-4 bg-[#19111D] border-2 border-[#E7A54A] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_26px_rgba(231,165,74,0.28)]">
                  <div className="flex items-center gap-3">
                    <Trophy className="w-8 h-8 text-[#E7A54A] shrink-0" />
                    <div>
                      <div className="text-[10px] font-cripta-pixel text-[#FFD166] tracking-widest uppercase">
                        ✦ MINIJEFE DERROTADO · PUERTA {Math.min(3, completedDoorCount + 1)} / 3 SUPERADA ✦
                      </div>
                      <div className="font-cripta-display text-lg sm:text-xl font-black text-[#E7A54A]">
                        ¡{chosenDungeon.name} CONQUISTADA!
                      </div>
                      <div className="text-xs font-cripta-pixel text-[#D9D0BC]">
                        El grupo conserva sus PV, armas, equipo, reliquias y {partyGold} de
                        oro.
                      </div>
                    </div>
                  </div>
                  {onAdvanceRoom && (
                    <button
                      type="button"
                      disabled={isTransitioningDoor}
                      onClick={() => {
                        laCriptaAudio.playDoorVote();
                        onAdvanceRoom();
                      }}
                      className="px-5 py-2.5 bg-[#E7A54A] hover:bg-[#f2b863] text-[#0B0A0E] border-2 border-[#FFF3C4] font-cripta-pixel text-xs font-bold tracking-wider flex items-center gap-2 cursor-pointer shrink-0 shadow-[0_0_18px_rgba(231,165,74,0.45)]"
                    >
                      <span>
                        {completedDoorCount + 1 >= 3
                          ? 'CRUZAR PUERTA AL CORAZÓN DE LA CRIPTA'
                          : isSolo
                          ? 'CRUZAR PUERTA Y VOLVER A LAS TRES PUERTAS'
                          : iAmReadyToAdvance
                          ? `ESPERANDO AL GRUPO (${readyPlayerIds.length}/${totalConnected})`
                          : 'CRUZAR PUERTA Y VOLVER A LAS TRES PUERTAS'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                canAdvance &&
                onAdvanceRoom && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#282039]">
                    <div className="text-xs font-cripta-pixel text-[#5EA87A]">
                      ✓ SALA COMPLETADA ·{' '}
                      {inSecretRoom
                        ? 'Listos para regresar a la galería principal'
                        : currentRoomIndex + 1 >= roomSequence.length
                        ? 'Minijefe derrotado · Puerta de salida desbloqueada'
                        : currentRoomIndex + 2 === roomSequence.length
                        ? `⚠ Siguiente cámara: GUARDIÁN MINIJEFE (${roomSequence.length}/${roomSequence.length})`
                        : `Siguiente cámara lista (${Math.min(
                            roomSequence.length,
                            currentRoomIndex + 2
                          )}/${roomSequence.length})`}
                    </div>
                    <button
                      type="button"
                      disabled={isTransitioningDoor}
                      onClick={() => {
                        laCriptaAudio.playDoorVote();
                        onAdvanceRoom();
                      }}
                      className="px-4 py-2 bg-[#E7A54A] hover:bg-[#f2b863] text-[#0B0A0E] border-2 border-[#FFF3C4] font-cripta-pixel text-xs font-bold tracking-wider flex items-center gap-2 cursor-pointer"
                    >
                      <span>
                        {inSecretRoom
                          ? 'CRUZAR PUERTA A LA GALERÍA'
                          : currentRoomIndex + 1 >= roomSequence.length
                          ? 'CRUZAR PUERTA Y COMPLETAR MAZMORRA'
                          : isSolo
                          ? 'CRUZAR PUERTA A LA SIGUIENTE SALA'
                          : iAmReadyToAdvance
                          ? `ESPERANDO AL GRUPO (${readyPlayerIds.length}/${totalConnected})`
                          : 'CRUZAR PUERTA A LA SIGUIENTE SALA'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ===========================================================================
  // SCENE 3A: AFTER 3 DOORS -> THE FINAL BOSS CHAMBER (EL CORAZÓN DE LA CRIPTA)
  // ===========================================================================
  if (
    completedDoorCount >= 3 ||
    expeditionState.phase === 'FINAL_BOSS_ENTRANCE'
  ) {
    return (
      <div className="relative flex-1 w-full max-w-6xl mx-auto px-3 sm:px-6 py-3 flex flex-col justify-center gap-3 select-none">
        <LaCriptaGiantDoorTransition
          transition={expeditionState.roomDoorTransition}
        />
        <div className="flex items-center justify-center">
          <LaCriptaDoorCounterBadge completedDoorCount={3} />
        </div>
        <LaCriptaFinalBossDoorScene
          completedDungeonIds={expeditionState.completedDungeonIds || []}
          players={expeditionState.players}
          currentPlayerId={currentPlayerId}
          isUnlocking={expeditionState.phase === 'FINAL_BOSS_ENTRANCE'}
          onVoteBossDoor={() => {
            if (onVoteFinalBossDoor) {
              laCriptaAudio.playDoorVote();
              onVoteFinalBossDoor();
            }
          }}
        />
      </div>
    );
  }

  // ===========================================================================
  // SCENE 3B: THE THREE DUNGEON DOORS (CLEAN ARCHITECTURAL VIEW + RUN PROGRESS)
  // ===========================================================================
  const openingDungeonDef =
    isOpeningPhase && expeditionState.selectedDungeonId
      ? CRIPTA_DUNGEONS_REGISTRY[expeditionState.selectedDungeonId]
      : null;

  const isReturningToDoors = expeditionState.phase === 'RETURNING_TO_DOORS';

  return (
    <div className="relative flex-1 w-full max-w-6xl mx-auto px-3 sm:px-6 py-3 flex flex-col justify-center gap-3 sm:gap-4 select-none">
      <LaCriptaGiantDoorTransition
        transition={expeditionState.roomDoorTransition}
      />
      {/* Persistent Door Counter + Completed Biomes Strip */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <LaCriptaDoorCounterBadge completedDoorCount={completedDoorCount} />
        {(expeditionState.completedDungeonIds || []).length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {(expeditionState.completedDungeonIds || []).map((cId, idx) => {
              const dDef = CRIPTA_DUNGEONS_REGISTRY[cId];
              return (
                <span
                  key={`${cId}_${idx}`}
                  className="px-2 py-1 bg-[#140F1A] border border-[#E7A54A]/50 text-[9px] font-cripta-pixel text-[#E7A54A]"
                >
                  ✓ PUERTA {idx + 1}: {dDef?.name || cId}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Returning-to-Doors Celebration Banner */}
      {isReturningToDoors && (
        <div className="mx-auto px-5 py-2 bg-[#1F1529] border-2 border-[#FFD166] text-center shadow-[0_0_28px_rgba(231,165,74,0.45)] animate-bounce">
          <div className="text-xs sm:text-sm font-cripta-display font-black text-[#FFD166] tracking-widest uppercase">
            ✦ PUERTA {completedDoorCount} / 3 SUPERADA ✦
          </div>
          <div className="text-[10px] font-cripta-pixel text-[#D9D0BC]">
            Nuevos sellos ancestrales emergen en la cámara...
          </div>
        </div>
      )}

      {/* Top Title Header */}
      <header className="text-center">
        <h1 className="font-cripta-display text-2xl sm:text-4xl font-black tracking-widest text-[#D8C6A0] uppercase">
          {openingDungeonDef
            ? `ADENTRÁNDOSE EN ${openingDungeonDef.name}`
            : completedDoorCount === 0
            ? isSolo
              ? 'ELIGE TU PRIMERA PUERTA'
              : 'ELIGE VUESTRA PRIMERA PUERTA'
            : isSolo
            ? `ELIGE LA PUERTA ${completedDoorCount + 1} DE 3`
            : `ELIGE VUESTRA PUERTA ${completedDoorCount + 1} DE 3`}
        </h1>

        {openingDungeonDef ? (
          <p
            className="mt-1 text-xs font-cripta-pixel tracking-wider uppercase animate-pulse"
            style={{ color: openingDungeonDef.palette.highlight }}
          >
            ✦ LOS CERROJOS CEDEN · EL GRUPO CRUZA EL UMBRAL ✦
          </p>
        ) : (
          !isSolo &&
          !expeditionState.voteTieWarning && (
            <p className="mt-1 text-xs font-cripta-pixel text-[#D8C6A0]/65 tracking-wider">
              VOTOS DEL GRUPO: {Object.keys(expeditionState.doorVotes).length} / {totalConnected}
            </p>
          )
        )}

        {/* Multiplayer Tie Notice */}
        {expeditionState.voteTieWarning && !isOpeningPhase && (
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-[#19111D] border border-[#E7A54A] text-xs font-cripta-pixel text-[#E7A54A]">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>EMPATE EN LA VOTACIÓN · CAMBIAD VUESTRO VOTO PARA ABRIR UN CAMINO</span>
          </div>
        )}

        {/* Initialization Retry Notice (if an error ever occurs) */}
        {expeditionState.initializationError && (
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3 px-3 py-1.5 bg-[#19111D] border border-[#C93B5B] text-xs font-cripta-pixel text-[#D9D0BC]">
            <span>{expeditionState.initializationError}</span>
            {onRetryDungeonInit && (
              <button
                type="button"
                onClick={onRetryDungeonInit}
                className="px-2.5 py-0.5 bg-[#E7A54A] text-[#0B0A0E] font-bold cursor-pointer"
              >
                REINTENTAR
              </button>
            )}
          </div>
        )}
      </header>

      {/* THREE ARCHITECTURAL DOORS SIDE-BY-SIDE */}
      <section className="grid grid-cols-3 gap-2.5 sm:gap-6 md:gap-8 items-end max-w-5xl mx-auto w-full">
        {expeditionState.offeredDungeons.map((dungeonId) => {
          const dungeon = CRIPTA_DUNGEONS_REGISTRY[dungeonId];
          if (!dungeon) return null;

          const voters = connectedPlayers.filter(
            (p) => expeditionState.doorVotes[p.id] === dungeonId
          );
          const isVotedByMe = myVotedDoor === dungeonId;
          const isThisDoorOpening =
            isOpeningPhase && expeditionState.selectedDungeonId === dungeonId;
          const isDimmedOtherDoor =
            isOpeningPhase && expeditionState.selectedDungeonId !== dungeonId;
          const isHovered = hoveredDoorId === dungeonId;

          return (
            <div
              key={dungeonId}
              role="button"
              tabIndex={isOpeningPhase ? -1 : 0}
              aria-label={`Puerta a ${dungeon.name}`}
              onMouseEnter={() => {
                setHoveredDoorId(dungeonId);
                if (!isOpeningPhase) {
                  laCriptaAudio.playDoorHover();
                }
              }}
              onMouseLeave={() => {
                setHoveredDoorId((prev) => (prev === dungeonId ? null : prev));
              }}
              onClick={() => {
                if (isOpeningPhase) return;
                laCriptaAudio.playDoorVote();
                onVoteDoor(dungeonId);
              }}
              onKeyDown={(e) => {
                if (isOpeningPhase) return;
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  laCriptaAudio.playDoorVote();
                  onVoteDoor(dungeonId);
                }
              }}
              className={`group relative flex flex-col items-center transition-all duration-700 outline-none ${
                isDimmedOtherDoor
                  ? 'opacity-15 scale-[0.92] blur-[1px] pointer-events-none'
                  : isThisDoorOpening
                  ? 'scale-[1.12] -translate-y-2 z-30'
                  : isVotedByMe
                  ? '-translate-y-1 cursor-pointer'
                  : 'hover:-translate-y-1 cursor-pointer'
              }`}
            >
              {/* The Physical Pixel-Art Doorway */}
              <div
                className="relative w-full transition-all duration-500"
                style={{
                  filter:
                    isThisDoorOpening
                      ? `drop-shadow(0 0 36px ${dungeon.palette.glow})`
                      : isVotedByMe || voters.length > 0
                      ? `drop-shadow(0 0 14px ${dungeon.palette.glow}55)`
                      : isHovered
                      ? `drop-shadow(0 0 10px ${dungeon.palette.highlight}44)`
                      : 'none',
                }}
              >
                <LaCriptaDoorArtwork
                  dungeon={dungeon}
                  isHovered={isHovered}
                  isVotedByMe={isVotedByMe}
                  isOpening={isThisDoorOpening}
                  voteCount={voters.length}
                />

                {/* Inner Biome Light Spill & Open Threshold Portal when this door is opening */}
                {isThisDoorOpening && (
                  <div
                    className="pointer-events-none absolute inset-x-[22%] top-[18%] bottom-[6%] flex flex-col items-center justify-end pb-3 animate-pulse"
                    style={{
                      background: `radial-gradient(ellipse at 50% 60%, ${dungeon.palette.highlight}66 0%, ${dungeon.palette.glow}44 45%, rgba(8,6,12,0.92) 90%)`,
                      boxShadow: `inset 0 0 28px ${dungeon.palette.glow}`,
                    }}
                  >
                    <span
                      className="px-2 py-0.5 bg-[#09070D]/90 border text-[9px] font-cripta-pixel font-bold uppercase tracking-widest"
                      style={{
                        borderColor: dungeon.palette.highlight,
                        color: dungeon.palette.highlight,
                      }}
                    >
                      UMBRAL ABIERTO
                    </span>
                  </div>
                )}
              </div>

              {/* Dungeon Name Directly Beneath the Door */}
              <div className="mt-2.5 text-center px-1">
                <h2
                  className="font-cripta-display text-sm sm:text-lg md:text-xl font-bold tracking-wide transition-colors leading-tight"
                  style={{
                    color:
                      isThisDoorOpening || isVotedByMe || isHovered
                        ? dungeon.palette.highlight
                        : '#D9D0BC',
                  }}
                >
                  {dungeon.name}
                </h2>
                <div className="text-[9px] font-cripta-pixel text-[#D8C6A0]/65 uppercase tracking-wider mt-0.5">
                  {dungeon.biomeTag}
                </div>

                {/* Compact Player Selection Indicators */}
                <div className="mt-1.5 min-h-[22px] flex flex-wrap items-center justify-center gap-1.5">
                  {voters.map((voter) => (
                    <span
                      key={voter.id}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#140F1A] border text-[10px] font-cripta-pixel text-[#D9D0BC]"
                      style={{ borderColor: voter.color }}
                    >
                      <span
                        className="w-2 h-2 shrink-0"
                        style={{ backgroundColor: voter.color }}
                      />
                      <span className="truncate max-w-[80px]">{voter.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
};
