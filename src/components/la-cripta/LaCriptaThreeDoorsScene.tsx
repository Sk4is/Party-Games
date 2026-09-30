import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Eye,
  HeartPulse,
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
  CRIPTA_RELICS_REGISTRY,
  NORMAL_INVENTORY_MAX_SLOTS,
  playerHasRelic,
} from '../../data/la-cripta/criptaItemsAndRelics';
import {
  computeEnemyApproxDamageRange,
  computePlayerEffectiveStats,
  CRIPTA_WEAPONS_REGISTRY,
  estimatePlayerActionDamage,
  formatDamageRange,
  getEquippedWeaponForPlayer,
  WEAPON_UPGRADE_MAX_LEVEL,
} from '../../data/la-cripta/criptaEquipmentAndEvents';
import { buildEnemyAiProfileForArchetype } from '../../data/la-cripta/criptaEnemyAiEngine';
import { LaCriptaDoorArtwork } from './LaCriptaDoorArtwork';
import { ROOM_TYPE_LABELS } from './LaCriptaRoomProgressTracker';
import { LaCriptaEnemyPixelSprite } from './LaCriptaRoomEnvironment';
import {
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
} from './LaCriptaItemRelicArt';
import { LaCriptaFinalBossDoorScene } from './LaCriptaFinalBossComponents';
import { LaCriptaGiantDoorTransition } from './LaCriptaGiantDoorTransition';
import {
  LaCriptaBiomeStageBackdrop,
  LaCriptaCardPixelIllustration,
  LaCriptaNonCombatStagePortrait,
  LaCriptaPlayableCard,
} from './LaCriptaEncounterCards';
import {
  CriptaContextualPanelMode,
  LaCriptaBackpackPixelIcon,
  LaCriptaContextualSidePanel,
} from './LaCriptaSidePanels';
import { LaCriptaPixelTooltip } from './LaCriptaPixelTooltip';
import { CRIPTA_STATUS_EFFECTS_REGISTRY } from '../../data/la-cripta/criptaStatusEffects';
import { laCriptaAudio } from '../../utils/laCriptaAudio';

const FINAL_BOSS_DUNGEON_DEF: CriptaDungeonDefinition = {
  id: 'el_abismo',
  index: 20,
  name: 'El Corazón de la Cripta',
  subtitle: 'Santuario Abisal del Rey Exánime',
  description:
    'Tras superar los tres sellos ancestrales, las puertas convergen en el trono donde late el Corazón de la Cripta.',
  biomeTag: 'Santuario Abisal',
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

const ROMAN_NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

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
  contextualPanelMode?: CriptaContextualPanelMode;
  inspectedPlayerId?: string | null;
  inspectedEnemyId?: string | null;
  onOpenInventory?: () => void;
  onInspectEnemy?: (enemyId: string) => void;
  onCloseContextualPanel?: () => void;
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
  onUseConsumable,
  onBuyShopSlot,
  onUpgradeWeapon,
  onReviveAlly,
  onInteractOption,
  onPuzzleInput,
  onDiscoverSecret,
  onAdvanceRoom,
  onClaimGroundDrop,
  onShopBuyItem,
  onShopBuyRelic,
  onSelectedEnemyChange,
  contextualPanelMode = 'NONE',
  inspectedPlayerId = null,
  inspectedEnemyId = null,
  onOpenInventory,
  onInspectEnemy,
  onCloseContextualPanel,
  onReturnToLobby,
  onRerollExpedition,
}) => {
  const [hoveredDoorId, setHoveredDoorId] = useState<CriptaDungeonId | null>(null);
  const [selectedEnemyId, setSelectedEnemyId] = useState<string | null>(null);
  const [lockpickTick, setLockpickTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setLockpickTick((t) => (t + 1) % 40);
    }, 90);
    return () => window.clearInterval(id);
  }, []);

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
  // FULL-SCREEN ENCOUNTER BOARD (DUNGEON ROOMS + MINIBOSS + FINAL BOSS)
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
    const visibleRoomEnemies = activeRoom.enemies.filter(
      (e) => e.hp > 0 || enemyAnimStates[e.id] === 'death'
    );
    const activeTargetEnemy =
      livingEnemies.find((e) => e.id === selectedEnemyId) || livingEnemies[0] || null;
    const inspectedEnemy =
      activeRoom.enemies.find((e) => e.id === inspectedEnemyId) ||
      activeTargetEnemy ||
      null;
    const inspectedPlayer =
      expeditionState.players.find((p) => p.id === inspectedPlayerId) || me || null;
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

    // Individual Player Turn & AP State
    const combatRoundPhase = activeRoom.combatRoundPhase || 'PLAYER_PHASE';
    const isPlayerPhase = combatRoundPhase === 'PLAYER_PHASE';
    const activeTurnPlayerId =
      activeRoom.activeTurnPlayerId || aliveOrderedPlayers[0]?.id || null;
    const activeTurnPlayer =
      expeditionState.players.find((p) => p.id === activeTurnPlayerId) ||
      aliveOrderedPlayers[0] ||
      null;
    const isMyTurn = Boolean(
      isPlayerPhase &&
        !iAmDead &&
        (!activeTurnPlayerId || activeTurnPlayerId === currentPlayerId)
    );
    const currentTurnAp = activeRoom.currentTurnAp ?? 2;
    const maxTurnAp = activeRoom.maxTurnAp ?? 2;

    // Room Center Visual Events
    const roomCenterEvents = activeVisualEvents.filter(
      (ev) => ev.targetType === 'ROOM' || ev.targetType === 'PARTY'
    );
    const roomCenterVfxEvent = [...roomCenterEvents]
      .reverse()
      .find((ev) => Boolean(ev.vfxStyle));

    // Local Player Weapon, Equipment & Damage Estimates
    const myEquippedWeapon = me ? getEquippedWeaponForPlayer(me) : null;
    const myWeapon = myEquippedWeapon?.weapon || null;
    const myWeaponLv = myEquippedWeapon?.level || 1;
    const mySpecialCd = me?.weaponSpecialCooldown || 0;
    const myAbilityCd = (me as { abilityCooldown?: number })?.abilityCooldown || 0;
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

    const isCombatRoomType =
      activeRoom.type === 'COMBAT' ||
      activeRoom.type === 'AMBUSH' ||
      activeRoom.type === 'ELITE' ||
      activeRoom.type === 'MINIBOSS' ||
      activeRoom.type === 'BOSS' ||
      livingEnemies.length > 0;

    const hasActiveCombat = livingEnemies.length > 0 && !activeRoom.resolved;

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
      itemSlotIndex?: number,
      abilityIdOverride?: string
    ) => {
      if (iAmDead || !isPlayerPhase || !isMyTurn) return;
      laCriptaAudio.playDoorVote();
      if (onLockRoundAction) {
        onLockRoundAction(
          actionType,
          activeTargetEnemy?.id,
          undefined,
          abilityIdOverride || myCharDef?.abilities[0]?.id,
          itemSlotIndex
        );
      } else if (
        onCombatAction &&
        (actionType === 'ATTACK' || actionType === 'ABILITY' || actionType === 'DEFEND')
      ) {
        onCombatAction(actionType, activeTargetEnemy?.id);
      }
    };

    const forgeUpgradeCost = myWeaponLv === 1 ? 30 : 45;
    const canForgeUpgradeHere =
      (activeRoom.type === 'REST' ||
        activeRoom.type === 'SHOP' ||
        activeRoom.canonicalType === 'WEAPON_UPGRADE') &&
      Boolean(myWeapon) &&
      myWeaponLv < WEAPON_UPGRADE_MAX_LEVEL;

    const isLastRoomInDungeon = currentRoomIndex >= roomSequence.length - 1;
    const roomRoman =
      ROMAN_NUMERALS[currentRoomIndex] || String(currentRoomIndex + 1);
    const totalRoomsRoman =
      ROMAN_NUMERALS[roomSequence.length - 1] || String(roomSequence.length);

    return (
      <div className="relative z-10 flex-1 min-h-0 w-full h-full overflow-hidden flex flex-col select-none bg-transparent">
        {/* GIANT PHYSICAL DUNGEON DOOR TRANSITION BETWEEN EVERY ROOM */}
        <LaCriptaGiantDoorTransition
          transition={expeditionState.roomDoorTransition}
          totalRooms={roomSequence.length}
        />

        {/* FULL-SCREEN 2-COLUMN ENCOUNTER CANVAS */}
        <div className="relative z-10 flex-1 min-h-0 w-full h-full grid grid-cols-1 lg:grid-cols-[minmax(340px,0.40fr)_minmax(0,0.60fr)] overflow-y-auto lg:overflow-hidden">
          {/* =================================================================
              LEFT SIDE: LARGE CREATURE / NPC / ENCOUNTER STAGE (38-42vw)
              ================================================================= */}
          <section className="relative min-h-[340px] lg:min-h-0 h-full flex flex-col justify-between p-4 sm:p-6 border-b-2 lg:border-b-0 lg:border-r-2 border-[#2E2238]/85 overflow-hidden">
            {/* Stage Architectural Framing & Pedestal (Transparent Skybox so Full-Screen Atmosphere & Particles Flow Behind Creature) */}
            <LaCriptaBiomeStageBackdrop
              dungeon={chosenDungeon}
              transparentSkybox={true}
              isBossOrMiniboss={isMinibossRoom || isFinalBossCombat}
            />

            {/* Room Center Animated VFX Overlay */}
            {roomCenterVfxEvent?.vfxStyle && (
              <LaCriptaCombatVfxOverlay vfxStyle={roomCenterVfxEvent.vfxStyle} />
            )}

            {/* Floating Room Feedback Popups */}
            {roomCenterEvents.length > 0 && (
              <div className="pointer-events-none absolute inset-x-0 top-16 z-30 flex flex-col items-center gap-1.5">
                {roomCenterEvents.slice(-2).map((ev) => (
                  <LaCriptaFloatingEventBadge key={ev.id} event={ev} />
                ))}
              </div>
            )}

            {/* TOP OF LEFT STAGE: ROOM IDENTITY & BIOME HEADER */}
            <div className="relative z-20 flex items-start justify-between gap-2">
              <div>
                <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-[#09070D]/85 border border-[#3E2F4B] text-[9px] font-cripta-pixel uppercase tracking-widest text-[#D8C6A0]">
                  <span style={{ color: chosenDungeon.palette.highlight }}>
                    {inSecretRoom
                      ? 'CÁMARA OCULTA'
                      : isFinalBossCombat
                      ? `JEFE FINAL · FASE ${finalBossPhaseNum}`
                      : isMinibossRoom
                      ? 'GUARDIÁN DEL UMBRAL · MINIJFE'
                      : `SALA ${roomRoman} / ${totalRoomsRoman}`}
                  </span>
                  <span className="text-[#4A3B5C]">·</span>
                  <span>
                    {ROOM_TYPE_LABELS[activeRoom.type] || activeRoom.type}
                  </span>
                </div>

                <h1
                  onClick={() => {
                    if (activeTargetEnemy && onInspectEnemy) {
                      laCriptaAudio.playStoneClick();
                      onInspectEnemy(activeTargetEnemy.id);
                    }
                  }}
                  className={`mt-1.5 font-cripta-display text-xl sm:text-2xl xl:text-3xl font-black uppercase tracking-wider text-[#F5EFE6] leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] ${
                    activeTargetEnemy ? 'cursor-pointer hover:text-[#FFD166] transition-colors' : ''
                  }`}
                  title={activeTargetEnemy ? 'Haz clic para examinar criatura' : undefined}
                >
                  {activeTargetEnemy
                    ? activeTargetEnemy.name
                    : activeRoom.title}
                </h1>

                {activeTargetEnemy ? (
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    <span
                      className={`px-1.5 py-0.5 border text-[9px] font-cripta-pixel font-bold uppercase ${
                        activeTargetEnemy.isFinalBoss || activeTargetEnemy.isBoss
                          ? 'bg-[#2A0E19] border-[#FF4D6D] text-[#FFD166]'
                          : activeTargetEnemy.isMiniboss
                          ? 'bg-[#26142A] border-[#E7A54A] text-[#FFD166]'
                          : activeTargetEnemy.isElite
                          ? 'bg-[#22162B] border-[#C77DFF] text-[#E0AAFF]'
                          : 'bg-[#140F1C] border-[#4A3B5C] text-[#D8C6A0]'
                      }`}
                    >
                      {activeTargetEnemy.isFinalBoss || activeTargetEnemy.isBoss
                        ? 'SOBERANO DEL ABISMO'
                        : activeTargetEnemy.isMiniboss
                        ? 'MINIJFE DE LA MAZMORRA'
                        : activeTargetEnemy.isElite
                        ? 'CRIATURA ÉLITE'
                        : 'CRIATURA DE CRIPTA'}
                    </span>
                    <span className="text-[9px] font-cripta-pixel text-[#D8C6A0]/80">
                      · {activeTargetEnemy.title}
                    </span>
                  </div>
                ) : (
                  <p className="mt-0.5 text-[10px] font-cripta-pixel text-[#D8C6A0]/75 uppercase tracking-wider">
                    {activeRoom.subtitle}
                  </p>
                )}
              </div>

              {/* Inspect / Examinar Button when enemy is active */}
              {activeTargetEnemy && onInspectEnemy && (
                <button
                  type="button"
                  onClick={() => {
                    laCriptaAudio.playStoneClick();
                    if (
                      contextualPanelMode === 'ENEMY_INSPECTION' &&
                      inspectedEnemyId === activeTargetEnemy.id &&
                      onCloseContextualPanel
                    ) {
                      onCloseContextualPanel();
                    } else {
                      onInspectEnemy(activeTargetEnemy.id);
                    }
                  }}
                  className={`px-2.5 py-1.5 border text-[9px] font-cripta-pixel flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 ${
                    contextualPanelMode === 'ENEMY_INSPECTION' &&
                    inspectedEnemyId === activeTargetEnemy.id
                      ? 'bg-[#2A1C12] border-[#FFD166] text-[#FFD166]'
                      : 'bg-[#120D1A]/90 hover:bg-[#1D1528] border-[#4A3B5C] hover:border-[#E7A54A] text-[#D8C6A0] hover:text-[#FFD166]'
                  }`}
                  title="Examinar estadísticas, debilidades, resistencias y ataques"
                >
                  <Eye className="w-3.5 h-3.5 text-[#E7A54A]" />
                  <span>EXAMINAR</span>
                </button>
              )}
            </div>

            {/* CENTER OF LEFT STAGE: COMMANDING LARGE CREATURE / NPC / OBJECT ART */}
            <div className="relative z-20 flex-1 min-h-[200px] flex flex-col items-center justify-center my-2">
              {visibleRoomEnemies.length > 0 ? (
                <div className="w-full flex flex-wrap items-end justify-center gap-4 sm:gap-6">
                  {visibleRoomEnemies.map((enemy, enemyIdx) => {
                    const isDead = enemy.hp <= 0;
                    const isTargeted = activeTargetEnemy?.id === enemy.id && !isDead;
                    const animState =
                      enemyAnimStates[enemy.id] || (isDead ? 'death' : 'idle');
                    const enemyEvents = activeVisualEvents.filter(
                      (ev) => ev.targetType === 'ENEMY' && ev.targetId === enemy.id
                    );
                    const latestEnemyVfx = [...enemyEvents]
                      .reverse()
                      .find((ev) => Boolean(ev.vfxStyle));

                    // Dynamic commanding size based on enemy count and tier
                    const spriteSize =
                      visibleRoomEnemies.length === 1
                        ? enemy.isBoss || enemy.isFinalBoss || enemy.isMiniboss
                          ? 256
                          : 232
                        : visibleRoomEnemies.length === 2
                        ? 176
                        : 146;

                    return (
                      <div
                        key={enemy.id}
                        role="button"
                        tabIndex={isDead ? -1 : 0}
                        onClick={() => {
                          if (!isDead) {
                            laCriptaAudio.playDoorHover();
                            setSelectedEnemyId(enemy.id);
                            if (contextualPanelMode === 'ENEMY_INSPECTION') {
                              onInspectEnemy?.(enemy.id);
                            }
                          }
                        }}
                        onKeyDown={(e) => {
                          if (!isDead && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault();
                            setSelectedEnemyId(enemy.id);
                            if (contextualPanelMode === 'ENEMY_INSPECTION') {
                              onInspectEnemy?.(enemy.id);
                            }
                          }
                        }}
                        className={`group relative flex flex-col items-center transition-all duration-300 outline-none ${
                          isDead
                            ? 'opacity-30 scale-90 pointer-events-none'
                            : isTargeted
                            ? 'scale-105 cursor-pointer z-20'
                            : 'opacity-85 hover:opacity-100 hover:scale-102 cursor-pointer z-10'
                        }`}
                      >
                        {/* Floating Damage / Status Numbers Above Creature */}
                        {enemyEvents.length > 0 && (
                          <div className="pointer-events-none absolute -top-10 inset-x-0 z-40 flex flex-col items-center gap-1">
                            {enemyEvents.slice(-3).map((ev) => (
                              <LaCriptaFloatingEventBadge key={ev.id} event={ev} />
                            ))}
                          </div>
                        )}

                        {/* Multi-Enemy Target Indicator & Explicit Inspect Action */}
                        {!isDead && (
                          <div className="mb-1 flex items-center gap-1">
                            {visibleRoomEnemies.length > 1 && (
                              <div
                                className={`px-2 py-0.5 border text-[8px] font-cripta-pixel font-bold uppercase tracking-wider transition-colors ${
                                  isTargeted
                                    ? 'bg-[#2A141D] border-[#FF4D6D] text-[#FFD166] shadow-[0_0_10px_rgba(255,77,109,0.4)]'
                                    : 'bg-[#0E0A14]/80 border-[#3E2F4B] text-[#D8C6A0]/60 group-hover:text-[#D8C6A0]'
                                }`}
                              >
                                {isTargeted ? '◆ OBJETIVO ◆' : 'CLIC: OBJETIVO'}
                              </div>
                            )}
                            {onInspectEnemy && visibleRoomEnemies.length > 1 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  laCriptaAudio.playStoneClick();
                                  if (
                                    contextualPanelMode === 'ENEMY_INSPECTION' &&
                                    inspectedEnemyId === enemy.id &&
                                    onCloseContextualPanel
                                  ) {
                                    onCloseContextualPanel();
                                  } else {
                                    onInspectEnemy(enemy.id);
                                  }
                                }}
                                className={`px-1.5 py-0.5 border text-[8px] font-cripta-pixel font-bold uppercase flex items-center gap-1 cursor-pointer transition-colors ${
                                  contextualPanelMode === 'ENEMY_INSPECTION' &&
                                  inspectedEnemyId === enemy.id
                                    ? 'bg-[#2A1C12] border-[#FFD166] text-[#FFD166]'
                                    : 'bg-[#120D1A]/95 hover:bg-[#211730] border-[#4A3B5C] hover:border-[#E7A54A] text-[#D8C6A0] hover:text-[#FFD166]'
                                }`}
                                title={`Examinar a ${enemy.name}`}
                              >
                                <Eye className="w-2.5 h-2.5 text-[#E7A54A]" />
                                <span>EXAMINAR</span>
                              </button>
                            )}
                          </div>
                        )}

                        {/* Pixel Art Creature Stage Container */}
                        <div className="relative flex items-center justify-center">
                          {latestEnemyVfx?.vfxStyle && (
                            <LaCriptaCombatVfxOverlay
                              vfxStyle={latestEnemyVfx.vfxStyle}
                            />
                          )}
                          <LaCriptaEnemyPixelSprite
                            enemy={enemy}
                            dungeonId={chosenDungeon.id}
                            isTargeted={isTargeted}
                            animState={animState}
                            totalVisibleEnemies={visibleRoomEnemies.length}
                            enemyIndex={enemyIdx}
                            customSizePx={spriteSize}
                          />
                        </div>

                        {/* Secondary mini HP bar when multiple enemies exist */}
                        {visibleRoomEnemies.length > 1 && (
                          <div className="mt-2 w-36 bg-[#0B0811]/95 border border-[#3E2F4B] p-1.5 text-center">
                            <div className="text-[9px] font-cripta-display font-bold text-[#F5EFE6] truncate">
                              {enemy.name}
                            </div>
                            <div className="mt-1 h-2 w-full bg-[#161020] border border-[#2D223B] overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#9E2A45] to-[#E63956] transition-all duration-300"
                                style={{
                                  width: `${Math.max(
                                    0,
                                    Math.min(100, (enemy.hp / Math.max(1, enemy.maxHp)) * 100)
                                  )}%`,
                                }}
                              />
                            </div>
                            <div className="mt-0.5 flex items-center justify-between text-[8px] font-cripta-pixel text-[#D8C6A0]">
                              <span>
                                PV {enemy.hp}/{enemy.maxHp}
                              </span>
                              <span>DEF {enemy.armor || 0}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : activeRoom.type === 'COMBAT' ||
                activeRoom.type === 'ELITE' ||
                activeRoom.type === 'MINIBOSS' ||
                activeRoom.type === 'BOSS' ? (
                /* Cleared Combat Chamber Stage — Never Spawn a Post-Combat NPC */
                <div className="flex flex-col items-center justify-center py-4 select-none">
                  {unclaimedDrops.length === 0 && (
                    <div className="flex flex-col items-center gap-2 px-5 py-3 bg-[#0D0914]/90 border border-[#3E2F4B] shadow-[0_10px_28px_rgba(0,0,0,0.85)]">
                      <div className="text-[10px] font-cripta-pixel font-bold text-[#6EE7B7] uppercase tracking-widest">
                        ✦ CÁMARA DESPEJADA ✦
                      </div>
                      <div className="text-[9px] font-cripta-pixel text-[#D8C6A0]/75 text-center max-w-xs">
                        Los enemigos han caído. El umbral hacia la siguiente sala está abierto.
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Non-Combat Room Large Stage Portrait (Merchant / Chest / Shrine / Rest / Forge / Event) */
                <div className="flex flex-col items-center justify-center">
                  <LaCriptaNonCombatStagePortrait
                    room={activeRoom}
                    dungeon={chosenDungeon}
                    sizePx={236}
                  />
                </div>
              )}

              {/* PHYSICAL GROUND DROPS ON THE STAGE PEDESTAL */}
              {unclaimedDrops.length > 0 && onClaimGroundDrop && (
                <div className="mt-3 w-full max-w-md z-30">
                  <LaCriptaGroundDropsOverlay
                    drops={activeRoom.groundDrops || []}
                    onClaimDrop={(dropId) => {
                      laCriptaAudio.playDoorVote();
                      onClaimGroundDrop(dropId);
                    }}
                  />
                </div>
              )}
            </div>

            {/* BOTTOM OF LEFT STAGE: PRIMARY TARGET HEALTH BAR, STATUSES & ENEMY INTENT */}
            <div className="relative z-20 mt-auto">
              {activeTargetEnemy ? (
                <div className="bg-[#0D0914]/95 border-2 border-[#3E2F4B] p-3 sm:p-3.5 shadow-[0_8px_28px_rgba(0,0,0,0.85)]">
                  {/* Enemy Intent Banner */}
                  {(() => {
                    const approxRange = computeEnemyApproxDamageRange(
                      activeTargetEnemy,
                      currentRoomIndex
                    );
                    const telegraphedLabel =
                      activeTargetEnemy.preparedTelegraphLabel ||
                      activeTargetEnemy.abilityName ||
                      activeTargetEnemy.intent ||
                      'ATAQUE DIRECTO';

                    return (
                      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#291E36]">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-[#2A121D] border border-[#E63956] text-[8px] font-cripta-pixel font-bold text-[#FF8FA3] uppercase tracking-wider">
                            INTENCIÓN ENEMIGA
                          </span>
                          <span className="text-xs font-cripta-display font-bold text-[#FFD166] uppercase tracking-wide">
                            {telegraphedLabel}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-cripta-pixel">
                          <LaCriptaPixelTooltip
                            title="Amenaza de Daño"
                            category="INTENCIÓN ENEMIGA"
                            description="Rango aproximado de daño antes de aplicar la defensa y mitigación del aventurero objetivo."
                            borderColor="#C93B5B"
                          >
                            <span className="px-2 py-0.5 bg-[#1B1224] border border-[#4A3B5C] text-[#FF8FA3] font-bold cursor-help">
                              ~{approxRange.min}–{approxRange.max} DAÑO
                            </span>
                          </LaCriptaPixelTooltip>
                          <LaCriptaPixelTooltip
                            title="Defensa de la Criatura"
                            category="ARMADURA"
                            description="Reduce el daño físico directo que recibe esta criatura. Haz clic en la criatura para ver sus debilidades y resistencias."
                            borderColor="#7BDFF2"
                          >
                            <span className="px-2 py-0.5 bg-[#140E1C] border border-[#3E2F4B] text-[#7BDFF2] cursor-help">
                              DEF {activeTargetEnemy.armor || 0}
                            </span>
                          </LaCriptaPixelTooltip>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Commanding Enemy Health Bar */}
                  <div
                    onClick={() => {
                      if (onInspectEnemy) {
                        laCriptaAudio.playStoneClick();
                        onInspectEnemy(activeTargetEnemy.id);
                      }
                    }}
                    className="cursor-pointer"
                    title="Haz clic para examinar estadísticas, debilidades y resistencias"
                  >
                    <div className="flex items-center justify-between text-xs font-cripta-pixel mb-1">
                      <span className="text-[#F5EFE6] font-bold uppercase">
                        SALUD DE {activeTargetEnemy.name}
                      </span>
                      <span className="text-[#FFD166] font-bold">
                        {activeTargetEnemy.hp} / {activeTargetEnemy.maxHp} PV
                      </span>
                    </div>
                    <div className="h-4 w-full bg-[#160F20] border-2 border-[#3E2F4B] overflow-hidden relative">
                      <div
                        className="h-full bg-gradient-to-r from-[#8A1C33] via-[#C93B5B] to-[#FF4D6D] transition-all duration-300"
                        style={{
                          width: `${Math.max(
                            0,
                            Math.min(
                              100,
                              (activeTargetEnemy.hp /
                                Math.max(1, activeTargetEnemy.maxHp)) *
                                100
                            )
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Active Status Effects on Target Enemy */}
                  {(Boolean(activeTargetEnemy.poisonStacks && activeTargetEnemy.poisonStacks > 0) ||
                    Boolean(activeTargetEnemy.vulnerableTurns && activeTargetEnemy.vulnerableTurns > 0) ||
                    Boolean(activeTargetEnemy.isDefending)) && (
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#261C33]">
                      {Boolean(activeTargetEnemy.poisonStacks && activeTargetEnemy.poisonStacks > 0) && (
                        <LaCriptaStatusEffectBadge
                          effectType="POISON"
                          turnsRemaining={activeTargetEnemy.poisonStacks || 1}
                          stacks={activeTargetEnemy.poisonStacks}
                        />
                      )}
                      {Boolean(activeTargetEnemy.vulnerableTurns && activeTargetEnemy.vulnerableTurns > 0) && (
                        <LaCriptaStatusEffectBadge
                          effectType="MARKED"
                          turnsRemaining={activeTargetEnemy.vulnerableTurns || 1}
                        />
                      )}
                      {Boolean(activeTargetEnemy.isDefending) && (
                        <LaCriptaStatusEffectBadge
                          effectType="SHIELDED"
                          turnsRemaining={activeTargetEnemy.defendingRoundsRemaining || 1}
                        />
                      )}
                    </div>
                  )}
                </div>
              ) : (
                /* Non-combat / Cleared Room Stage Footer */
                <div className="bg-[#0D0914]/90 border border-[#3E2F4B] px-3.5 py-2.5 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[9px] font-cripta-pixel text-[#E7A54A] uppercase tracking-widest">
                      {activeRoom.resolved ? '✦ SALA COMPLETADA' : '✦ ENCUENTRO ACTIVO'}
                    </div>
                    <div className="text-xs font-cripta-display font-bold text-[#D9D0BC]">
                      {chosenDungeon.name} · {chosenDungeon.biomeTag}
                    </div>
                  </div>
                  <div className="px-2.5 py-1 bg-[#161022] border border-[#3E2F4B] text-[9px] font-cripta-pixel text-[#D8C6A0]">
                    PUERTA {Math.min(3, completedDoorCount + 1)}/3
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* =================================================================
              RIGHT SIDE: LARGE TACTICAL CARD & DECISION BOARD (58-62vw)
              ================================================================= */}
          <section className="relative min-h-0 h-full flex flex-col justify-between p-4 sm:p-6 lg:p-7 bg-[#090710]/36 overflow-y-auto">
            {/* Subtle Biome Radial Accent Over Right Board */}
            <div
              className="pointer-events-none absolute inset-0 opacity-25"
              style={{
                backgroundImage: `radial-gradient(circle at 80% 20%, ${chosenDungeon.palette.glow}33 0%, transparent 58%)`,
              }}
            />

            {/* TOP BAR OF RIGHT BOARD: TURN BANNER + AP CRYSTALS OR ENCOUNTER CONTEXT */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-[#2A1F36]">
              {hasActiveCombat ? (
                <>
                  {/* Active Turn Banner */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`px-3 py-1.5 border-2 font-cripta-pixel text-xs font-bold uppercase tracking-widest transition-all ${
                        !isPlayerPhase
                          ? 'bg-[#2A1019] border-[#E63956] text-[#FF8FA3] animate-pulse'
                          : isMyTurn
                          ? 'bg-[#261A0E] border-[#FFD166] text-[#FFD166] shadow-[0_0_20px_rgba(255,209,102,0.3)]'
                          : 'bg-[#161120] border-[#4A3B5C] text-[#D8C6A0]'
                      }`}
                    >
                      {!isPlayerPhase
                        ? '⚔ TURNO DEL ENEMIGO · RESOLVIENDO...'
                        : isMyTurn
                        ? `✦ ¡TU TURNO, ${me?.name || 'HÉROE'}! · ELIGE UNA CARTA`
                        : `TURNO DE: ${activeTurnPlayer?.name || 'COMPAÑERO'}`}
                    </div>

                    {activeRoom.lastPlayedCardTitle && (
                      <span className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#15101F] border border-[#3E2F4B] text-[10px] font-cripta-pixel text-[#D8C6A0]">
                        <Sparkles className="w-3 h-3 text-[#E7A54A]" />
                        <span>
                          {activeRoom.lastPlayedByPlayerName}:{' '}
                          <strong className="text-[#FFD166]">
                            {activeRoom.lastPlayedCardTitle}
                          </strong>
                        </span>
                      </span>
                    )}
                  </div>

                  {/* Action Points (AP) Crystal Counter */}
                  <div className="flex items-center gap-2.5 px-3 py-1.5 bg-[#120D1A] border border-[#4A3B5C]">
                    <span className="text-[10px] font-cripta-pixel text-[#D8C6A0] uppercase tracking-wider">
                      PUNTOS DE ACCIÓN:
                    </span>
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: maxTurnAp }).map((_, idx) => {
                        const filled = idx < currentTurnAp && isPlayerPhase;
                        return (
                          <span
                            key={idx}
                            className={`w-3.5 h-3.5 rotate-45 border transition-all ${
                              filled
                                ? 'bg-[#FFD166] border-[#FFF3B0] shadow-[0_0_8px_rgba(255,209,102,0.85)]'
                                : 'bg-[#1B1426] border-[#4A3B5C] opacity-45'
                            }`}
                          />
                        );
                      })}
                    </div>
                    <span className="text-xs font-cripta-pixel font-bold text-[#FFD166]">
                      {isPlayerPhase ? currentTurnAp : 0} / {maxTurnAp} AP
                    </span>
                  </div>
                </>
              ) : (
                /* Non-combat or Cleared Room Header on Right Board */
                <div className="w-full flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] font-cripta-pixel text-[#E7A54A] uppercase tracking-widest">
                      {activeRoom.resolved
                        ? '✦ RESOLUCIÓN DE LA CÁMARA'
                        : '✦ DECISIONES DEL ENCUENTRO'}
                    </div>
                    <h2 className="font-cripta-display text-lg sm:text-xl font-black text-[#F5EFE6] uppercase tracking-wide">
                      {activeRoom.resolved
                        ? 'SALA DESPEJADA · BOTÍN Y UMBRAL'
                        : activeRoom.title}
                    </h2>
                  </div>

                  {activeRoom.type === 'SHOP' && (
                    <div className="px-3 py-1.5 bg-[#1E1610] border border-[#E7A54A] text-xs font-cripta-pixel font-bold text-[#FFD166]">
                      ORO DISPONIBLE: {partyGold}G
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ===============================================================
                CENTER OF RIGHT BOARD: PLAYABLE CARDS / ENCOUNTER OPTIONS
                =============================================================== */}
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center my-3">
              {/* CASE A: EXPEDITION DEFEATED */}
              {isDefeated ? (
                <div className="max-w-lg w-full bg-[#170D16] border-2 border-[#C93B5B] p-6 text-center shadow-[0_0_45px_rgba(201,59,91,0.35)]">
                  <div className="text-xs font-cripta-pixel text-[#FF8FA3] uppercase tracking-widest">
                    EXPEDICIÓN CAÍDA
                  </div>
                  <h3 className="mt-1 font-cripta-display text-2xl sm:text-3xl font-black text-[#F5EFE6] uppercase">
                    LA CRIPTA HA RECLAMADO AL GRUPO
                  </h3>
                  <p className="mt-2 text-xs font-cripta-pixel text-[#D8C6A0]/80 leading-relaxed">
                    Todos los aventureros han caído en {chosenDungeon.name}. Podéis
                    iniciar una nueva expedición o regresar a la sala de preparación.
                  </p>
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                    {isHost && (
                      <button
                        type="button"
                        onClick={onRerollExpedition}
                        className="px-5 py-2.5 bg-[#E7A54A] hover:bg-[#F3B861] text-[#09070D] font-cripta-pixel text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>NUEVA EXPEDICIÓN</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onReturnToLobby}
                      className="px-5 py-2.5 bg-[#1F162B] hover:bg-[#2B1F3B] border border-[#4A3B5C] text-[#D9D0BC] font-cripta-pixel text-xs uppercase tracking-wider cursor-pointer"
                    >
                      VOLVER AL LOBBY
                    </button>
                  </div>
                </div>
              ) : hasActiveCombat ? (
                /* CASE B: ACTIVE COMBAT — SEQUENTIAL TURN CARD HAND */
                <div className="w-full flex flex-col items-center justify-center gap-4">
                  {/* Helper Banner when waiting for another teammate's turn */}
                  {!isMyTurn && isPlayerPhase && !iAmDead && (
                    <div className="px-4 py-2 bg-[#161021]/90 border border-[#4A3B5C] text-xs font-cripta-pixel text-[#D8C6A0] text-center">
                      Esperando a que{' '}
                      <strong className="text-[#FFD166]">
                        {activeTurnPlayer?.name || 'tu compañero'}
                      </strong>{' '}
                      juegue sus cartas ({currentTurnAp} AP restantes)...
                    </div>
                  )}

                  {iAmDead && (
                    <div className="px-4 py-2 bg-[#261019] border border-[#C93B5B] text-xs font-cripta-pixel text-[#FF8FA3] text-center">
                      Has caído en combate. Tus compañeros pueden revivirte en un
                      Santuario, Hoguera o tras despejar la sala.
                    </div>
                  )}

                  {/* TACTICAL COMBAT CARDS (Basic Attack + Guard + Weapon Special + 2 Active Class Abilities) */}
                  <div className="w-full flex flex-wrap items-stretch justify-center gap-3 sm:gap-3.5">
                    {/* CARD 1: BASIC WEAPON ATTACK (1 AP, max 1 per turn to prevent mindless spam) */}
                    {(() => {
                      const basicUsed = Boolean(me?.basicAttackUsedThisTurn);
                      return (
                        <LaCriptaPlayableCard
                          title={myWeapon ? myWeapon.name : 'Ataque Básico'}
                          categoryLabel="ATAQUE DE ARMA (MÁX. 1/T)"
                          costLabel="1 AP"
                          cooldownLabel={basicUsed ? 'USADO ESTE TURNO' : `NV.${myWeaponLv}`}
                          headlineValue={
                            attackEst
                              ? `${formatDamageRange(attackEst.min, attackEst.max)} DAÑO`
                              : '4–6 DAÑO'
                          }
                          summary={
                            basicUsed
                              ? 'Ya atacaste este turno. Combina tu 2.º AP con Técnica, Habilidad o Guardia.'
                              : `Golpe directo contra ${
                                  activeTargetEnemy?.name || 'objetivo'
                                }.`
                          }
                          tooltipDescription={
                            myWeapon
                              ? `${myWeapon.specialEffectText} Escala con ${myWeapon.scalingStat}. Límite: 1 golpe básico por turno para fomentar combinaciones tácticas.`
                              : 'Ataque físico básico con tu arma equipada (máximo 1 vez por turno).'
                          }
                          accentColor={basicUsed ? 'slate' : 'crimson'}
                          disabled={!isMyTurn || currentTurnAp < 1 || basicUsed}
                          illustration={
                            <LaCriptaCardPixelIllustration kind="ATTACK_SWORD" />
                          }
                          onClick={() => submitPlayerCombatChoice('ATTACK')}
                          footerBadge={
                            basicUsed
                              ? 'USADO · ELIGE OTRA ACCIÓN'
                              : `OBJETIVO: ${
                                  activeTargetEnemy?.name.slice(0, 14) || 'ENEMIGO'
                                }`
                          }
                        />
                      );
                    })()}

                    {/* CARD 2: DEFEND / GUARD (1 AP — Pure defense, never deals damage) */}
                    <LaCriptaPlayableCard
                      title="Guardia de Hierro"
                      categoryLabel="DEFENSA · NO HACE DAÑO"
                      costLabel="1 AP"
                      cooldownLabel="SIEMPRE LISTA"
                      headlineValue="+ARMADURA + ESCUDO"
                      summary="Mitiga 40% de daño, +5 PV y prepara Contragolpe (+18% daño)."
                      tooltipDescription="Postura puramente defensiva (no inflige daño directo). Otorga +2–4 Armadura, Escudo por 2 rondas, recupera +5 PV y potencia un +18% tu siguiente ataque."
                      accentColor="cyan"
                      disabled={!isMyTurn || currentTurnAp < 1}
                      illustration={
                        <LaCriptaCardPixelIllustration kind="DEFEND_SHIELD" />
                      }
                      onClick={() => submitPlayerCombatChoice('DEFEND')}
                      footerBadge="DEFENSA + CONTRAGOLPE"
                    />

                    {/* CARD 3: WEAPON SPECIAL TECHNIQUE (1 AP) */}
                    {myWeapon && (
                      <LaCriptaPlayableCard
                        title={myWeapon.specialAttack?.name || 'Técnica de Arma'}
                        categoryLabel={`ARMA · ${myWeapon.name.toUpperCase()}`}
                        costLabel="1 AP"
                        cooldownLabel={
                          mySpecialCd > 0 ? `CD: ${mySpecialCd}T` : 'LISTA'
                        }
                        headlineValue={
                          myWeapon.specialAttack?.dealsDamage === false
                            ? `+${myWeapon.specialAttack?.partyHealBase || 14} PV GRUPO`
                            : specialEst && specialEst.max > 0
                            ? `${formatDamageRange(specialEst.min, specialEst.max)} ${
                                myWeapon.specialAttack?.targetRule === 'ALL_ENEMIES'
                                  ? 'DAÑO · ÁREA'
                                  : myWeapon.specialAttack?.targetRule === 'CLEAVE_2' ||
                                    myWeapon.specialAttack?.targetRule === 'CHAIN_2'
                                  ? 'DAÑO · 2 OBJ.'
                                  : 'DAÑO'
                              }`
                            : '7–11 DAÑO'
                        }
                        summary={
                          (
                            myWeapon.specialAttack?.description ||
                            myWeapon.specialEffectText ||
                            'Técnica especial de arma.'
                          ).split('.')[0] + '.'
                        }
                        tooltipDescription={`${
                          myWeapon.specialAttack?.description ||
                          myWeapon.specialEffectText
                        } Recarga: ${
                          myWeapon.specialAttack?.cooldownRounds || 2
                        } rondas.`}
                        accentColor={
                          myWeapon.specialAttack?.dealsDamage === false ? 'emerald' : 'amber'
                        }
                        disabled={!isMyTurn || currentTurnAp < 1 || mySpecialCd > 0}
                        illustration={
                          <LaCriptaCardPixelIllustration kind="WEAPON_TECHNIQUE" />
                        }
                        onClick={() => submitPlayerCombatChoice('WEAPON_SPECIAL')}
                        footerBadge={
                          mySpecialCd > 0
                            ? `ENFRIAMIENTO (${mySpecialCd}T)`
                            : `CD: ${myWeapon.specialAttack?.cooldownRounds || 2} RONDAS`
                        }
                      />
                    )}

                    {/* CARDS 4 & 5: ACTIVE CLASS ABILITIES (2 distinct active skills per class) */}
                    {(myCharDef?.abilities || [])
                      .filter((ab) => ab.type !== 'PASIVA')
                      .map((ab) => {
                        const abCd = me?.abilityCooldowns?.[ab.id] || 0;
                        const abDealsDamage =
                          ab.dealsDamage ??
                          (ab.kind === 'DAMAGE' ||
                            ab.category === 'ATTACK' ||
                            ab.category === 'DEBUFF');
                        const abEst =
                          me && activeTargetEnemy
                            ? estimatePlayerActionDamage(
                                me,
                                'ABILITY',
                                activeTargetEnemy,
                                livingEnemies,
                                expeditionState.partyRelics || [],
                                ab.id
                              )
                            : null;

                        const headline = !abDealsDamage
                          ? ab.kind === 'HEAL' || ab.category === 'HEAL'
                            ? `+${ab.healAmount || ab.power || 16} PV GRUPO`
                            : `+${ab.shieldGrant || 3} ARM · PROVOCAR`
                          : abEst && abEst.max > 0
                          ? `${formatDamageRange(abEst.min, abEst.max)} ${
                              ab.targetRule === 'ALL_ENEMIES'
                                ? 'DAÑO · ÁREA'
                                : ab.targetRule === 'CHAIN_2' || ab.targetRule === 'CLEAVE_2'
                                ? 'DAÑO · 2 OBJ.'
                                : 'DAÑO'
                            }`
                          : `${ab.power || 14} DAÑO`;

                        const categoryBadge = !abDealsDamage
                          ? ab.kind === 'HEAL' || ab.category === 'HEAL'
                            ? 'CURACIÓN · NO DAÑA'
                            : 'DEFENSA · NO DAÑA'
                          : ab.targetRule === 'ALL_ENEMIES'
                          ? `HABILIDAD ÁREA · ${myCharDef?.className || ''}`
                          : `HABILIDAD · ${myCharDef?.className || ''}`;

                        return (
                          <LaCriptaPlayableCard
                            key={ab.id}
                            title={ab.name}
                            categoryLabel={categoryBadge}
                            costLabel="1 AP"
                            cooldownLabel={abCd > 0 ? `CD: ${abCd}T` : 'LISTA'}
                            headlineValue={headline}
                            summary={(ab.description || '').split('.')[0] + '.'}
                            tooltipDescription={`${ab.description} Recarga: ${
                              ab.cooldownTurns || 2
                            } rondas.`}
                            accentColor={
                              !abDealsDamage
                                ? ab.kind === 'HEAL'
                                  ? 'emerald'
                                  : 'cyan'
                                : 'purple'
                            }
                            disabled={!isMyTurn || currentTurnAp < 1 || abCd > 0}
                            illustration={
                              <LaCriptaCardPixelIllustration
                                kind={
                                  !abDealsDamage && ab.kind === 'DEFEND'
                                    ? 'DEFEND_SHIELD'
                                    : 'CLASS_SKILL'
                                }
                              />
                            }
                            onClick={() =>
                              submitPlayerCombatChoice('ABILITY', undefined, ab.id)
                            }
                            footerBadge={
                              abCd > 0
                                ? `RECARGANDO (${abCd}T)`
                                : `CD: ${ab.cooldownTurns || 2} RONDAS`
                            }
                          />
                        );
                      })}
                  </div>

                  {/* Secondary Bottom Strip under Combat Cards: Dedicated MOCHILA Control + End Turn Button */}
                  <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
                    {onOpenInventory && (
                      <button
                        type="button"
                        onClick={() => {
                          laCriptaAudio.playStoneClick();
                          onOpenInventory();
                        }}
                        className={`px-3.5 py-2 border font-cripta-pixel text-[10px] font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all ${
                          contextualPanelMode === 'INVENTORY'
                            ? 'bg-[#2C1E12] border-[#FFD166] text-[#FFD166] shadow-[0_0_12px_rgba(255,209,102,0.35)]'
                            : 'bg-[#171122] hover:bg-[#231934] border-[#E7A54A]/70 hover:border-[#FFD166] text-[#F5EFE6]'
                        }`}
                      >
                        <LaCriptaBackpackPixelIcon size={15} />
                        <span>
                          MOCHILA ({myInventory.length}/{NORMAL_INVENTORY_MAX_SLOTS})
                        </span>
                        {!activeRoom.consumableUsedThisTurn &&
                          myInventory.length > 0 &&
                          isMyTurn && (
                            <span className="px-1.5 py-0.2 bg-[#14291D] border border-[#5EA87A] text-[8px] text-[#8EE6AE]">
                              ACCIÓN LIBRE
                            </span>
                          )}
                      </button>
                    )}

                    {isMyTurn && (
                      <button
                        type="button"
                        onClick={() => submitPlayerCombatChoice('PASS')}
                        className="px-5 py-2 bg-[#1A1326] hover:bg-[#281D3A] border-2 border-[#E7A54A] text-xs font-cripta-pixel font-bold text-[#FFD166] uppercase tracking-widest shadow-[0_0_16px_rgba(231,165,74,0.25)] cursor-pointer transition-all"
                      >
                        {currentTurnAp > 0
                          ? `TERMINAR TURNO (+GUARDIA CON ${currentTurnAp} AP)`
                          : 'TERMINAR TURNO →'}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* CASE C: NON-COMBAT ENCOUNTERS (EVENTS, SHRINES, SHOP, PUZZLE, TREASURE) OR CLEARED ROOM */
                <div className="w-full flex flex-col items-center justify-center gap-4">
                  {/* Narrative Prompt / Resolution Banner */}
                  <div className="max-w-3xl w-full bg-[#140E1D]/95 border border-[#3E2F4B] px-4 py-3 text-center">
                    <p className="text-xs sm:text-sm font-cripta-pixel text-[#E8DFCE] leading-relaxed">
                      {activeRoom.outcomeLog ||
                        activeRoom.narrative ||
                        activeRoom.subtitle}
                    </p>
                  </div>

                  {/* UNCLAIMED PHYSICAL DROPS AS PLAYABLE LOOT CARDS */}
                  {unclaimedDrops.length > 0 && onClaimGroundDrop && (
                    <div className="w-full flex flex-col items-center gap-2">
                      <div className="text-[10px] font-cripta-pixel font-bold text-[#FFD166] uppercase tracking-widest animate-pulse">
                        ✦ RECOGE EL BOTÍN DE LA SALA ANTES DE CONTINUAR ✦
                      </div>
                      <div className="flex flex-wrap items-stretch justify-center gap-3.5">
                        {unclaimedDrops.map((drop) => {
                          const itemDef = drop.itemId
                            ? CRIPTA_ITEMS_REGISTRY[drop.itemId]
                            : undefined;
                          const relicDef = drop.relicId
                            ? CRIPTA_RELICS_REGISTRY[drop.relicId]
                            : undefined;
                          const resolvedSummary =
                            itemDef?.description ||
                            relicDef?.description ||
                            (drop.type === 'GOLD_POUCH' && drop.goldAmount
                              ? `Bolsa con +${drop.goldAmount} de oro para el grupo.`
                              : `Botín hallado en la cámara: ${drop.label}.`);
                          const resolvedRarity =
                            relicDef?.rarity ||
                            (drop.type === 'RELIC_PEDESTAL'
                              ? 'RELIQUIA'
                              : drop.type === 'GOLD_POUCH'
                              ? 'ORO'
                              : 'CONSUMIBLE');

                          return (
                            <LaCriptaPlayableCard
                              key={drop.dropId}
                              title={drop.label}
                              categoryLabel={
                                drop.type === 'GOLD_POUCH'
                                  ? 'BOTÍN DE ORO'
                                  : drop.type === 'RELIC_PEDESTAL'
                                  ? 'RELIQUIA ANCESTRAL'
                                  : 'OBJETO DE CRIPTA'
                              }
                              costLabel="RECOGER"
                              cooldownLabel={resolvedRarity}
                              summary={resolvedSummary}
                              accentColor={
                                drop.type === 'RELIC_PEDESTAL'
                                  ? 'purple'
                                  : drop.type === 'GOLD_POUCH'
                                  ? 'amber'
                                  : 'emerald'
                              }
                              illustration={
                                <LaCriptaCardPixelIllustration
                                  kind="TREASURE_CHEST"
                                  itemId={drop.itemId}
                                  relicId={drop.relicId}
                                />
                              }
                              onClick={() => {
                                laCriptaAudio.playDoorVote();
                                onClaimGroundDrop(drop.dropId);
                              }}
                              footerBadge="CLIC PARA RECOGER"
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* SHOP ROOM: LARGE PLAYABLE MERCHANT CARDS + DYNAMIC REROLL */}
                  {activeRoom.type === 'SHOP' && (
                    <div className="w-full flex flex-col items-center gap-3">
                      <div className="w-full flex flex-wrap items-stretch justify-center gap-3.5">
                        {(activeRoom.shopSlots && activeRoom.shopSlots.length > 0
                          ? activeRoom.shopSlots
                          : activeRoom.shopInventory || []
                        ).map((slot) => {
                          const slotKey = slot.slotId || slot.id;
                          const isSold = Boolean(slot.sold || slot.soldOut);
                          const displayPrice = slot.priceGold;
                          const canAfford = partyGold >= displayPrice && !isSold;

                          return (
                            <LaCriptaPlayableCard
                              key={slotKey}
                              title={slot.name || 'Mercancía'}
                              categoryLabel={`MERCADER · ${slot.category || slot.kind}`}
                              costLabel={isSold ? 'AGOTADO' : `${displayPrice} ORO`}
                              cooldownLabel={slot.rarity || 'COMÚN'}
                              summary={slot.description || 'Artículo del mercader errante.'}
                              accentColor={
                                isSold
                                  ? 'slate'
                                  : slot.kind === 'RELIC'
                                  ? 'purple'
                                  : slot.kind === 'WEAPON'
                                  ? 'crimson'
                                  : 'amber'
                              }
                              disabled={isSold || !canAfford || iAmDead}
                              illustration={
                                <LaCriptaCardPixelIllustration
                                  kind={
                                    slot.kind === 'FORGE_UPGRADE'
                                      ? 'FORGE_ANVIL'
                                      : slot.kind === 'WEAPON'
                                      ? 'WEAPON_TECHNIQUE'
                                      : 'SHOP_MERCHANT'
                                  }
                                  itemId={slot.itemId}
                                  relicId={slot.relicId}
                                />
                              }
                              onClick={() => {
                                if (onBuyShopSlot && !isSold && canAfford) {
                                  laCriptaAudio.playDoorVote();
                                  onBuyShopSlot(slot.id || slotKey);
                                }
                              }}
                              footerBadge={
                                isSold
                                  ? 'VENDIDO'
                                  : canAfford
                                  ? 'COMPRAR AHORA'
                                  : 'ORO INSUFICIENTE'
                              }
                            />
                          );
                        })}
                      </div>

                      {/* Shop Reroll Action Bar */}
                      {onBuyShopSlot && (
                        <div className="mt-1 flex items-center justify-center">
                          {(() => {
                            const rerollCost = 10 + (activeRoom.shopRerollCount || 0) * 6;
                            const canReroll = partyGold >= rerollCost && !iAmDead;
                            return (
                              <button
                                type="button"
                                disabled={!canReroll}
                                onClick={() => {
                                  laCriptaAudio.playDoorVote();
                                  onBuyShopSlot('REROLL_SHOP');
                                }}
                                className="px-4 py-2 bg-[#1A1326] hover:bg-[#271C38] disabled:opacity-40 border border-[#E7A54A] text-[10px] font-cripta-pixel font-bold text-[#FFD166] uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all"
                              >
                                <RotateCcw className="w-3.5 h-3.5 text-[#E7A54A]" />
                                <span>
                                  RENOVAR MERCANCÍA DEL MERCADER ({rerollCost} ORO)
                                </span>
                              </button>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}

                  {/* INTERACTIVE MINIGAME ROOMS (RUNE_SEQUENCE, LOCKPICK_TIMING, TRAP_STEPPING, ALCHEMICAL_BALANCE) */}
                  {!activeRoom.resolved &&
                    activeRoom.minigame &&
                    !activeRoom.minigame.completed &&
                    (() => {
                      const mg = activeRoom.minigame;
                      const attemptsLeft = Math.max(0, mg.maxMistakes - mg.mistakes);
                      // Ping-pong needle between 4% and 96% using lockpickTick (0..39)
                      const rawPhase = lockpickTick <= 20 ? lockpickTick : 40 - lockpickTick;
                      const needlePct = Math.round(4 + (rawPhase / 20) * 92);
                      const sweetStart = mg.sweetSpotStart ?? 36;
                      const sweetEnd = mg.sweetSpotEnd ?? 66;
                      const inSweetSpot = needlePct >= sweetStart && needlePct <= sweetEnd;

                      return (
                        <div className="w-full max-w-3xl bg-[#110C1B]/95 border-2 border-[#E7A54A]/80 p-4 flex flex-col items-center gap-3 shadow-[0_0_28px_rgba(0,0,0,0.85)]">
                          <div className="w-full flex flex-wrap items-center justify-between gap-2 border-b border-[#2E223D] pb-2">
                            <div>
                              <div className="text-[9px] font-cripta-pixel text-[#FFD166] uppercase tracking-widest">
                                ✦ MINIJUEGO INTERACTIVO DE CÁMARA · PASO {mg.currentStep + 1} /{' '}
                                {mg.maxSteps}
                              </div>
                              <div className="font-cripta-display text-base sm:text-lg font-black text-[#F5EFE6] uppercase">
                                {mg.title}
                              </div>
                            </div>
                            <div className="px-2.5 py-1 bg-[#1D142B] border border-[#4A3B5C] text-[9px] font-cripta-pixel text-[#E8DFCE]">
                              MARGEN DE FALLO: {attemptsLeft} INTENTO{attemptsLeft === 1 ? '' : 'S'}
                            </div>
                          </div>

                          <p className="text-xs font-cripta-pixel text-[#D8C6A0] text-center">
                            {mg.instructions}
                          </p>

                          {/* 1. RUNE_SEQUENCE */}
                          {mg.minigameType === 'RUNE_SEQUENCE' && (
                            <div className="w-full flex flex-col items-center gap-3">
                              <div className="px-3 py-1.5 bg-[#1A1228] border border-[#9B72CF] text-[10px] font-cripta-pixel text-[#E0AAFF] uppercase tracking-wider">
                                SECUENCIA ARCANO-RÚNICA:{' '}
                                {mg.targetSequence
                                  .map((idx, stepIdx) => {
                                    const names = ['SOLAR', 'VACÍO', 'SANGRE', 'ESCARCELA'];
                                    const done = stepIdx < mg.currentStep;
                                    return `${done ? '✓' : `${stepIdx + 1}.º`} ${
                                      names[idx] || `GLIFO #${idx + 1}`
                                    }`;
                                  })
                                  .join('  →  ')}
                              </div>
                              <div className="flex flex-wrap items-stretch justify-center gap-3">
                                {['SOLAR', 'VACÍO', 'SANGRE', 'ESCARCELA'].map((rName, rIdx) => {
                                  const isNextExpected =
                                    mg.targetSequence[mg.currentStep] === rIdx;
                                  const alreadyPressed = mg.playerInputs.includes(rIdx);
                                  return (
                                    <button
                                      key={rName}
                                      type="button"
                                      disabled={iAmDead}
                                      onClick={() => {
                                        if (onPuzzleInput && !iAmDead) {
                                          laCriptaAudio.playDoorVote();
                                          onPuzzleInput(rIdx);
                                        }
                                      }}
                                      className={`w-36 p-3 border-2 flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                                        alreadyPressed
                                          ? 'bg-[#13291E] border-[#5EA87A] text-[#8EE6AE]'
                                          : isNextExpected
                                          ? 'bg-[#221638] hover:bg-[#2E1E4A] border-[#FFD166] text-[#F5EFE6] shadow-[0_0_14px_rgba(255,209,102,0.3)]'
                                          : 'bg-[#171124] hover:bg-[#231936] border-[#4A3B5C] text-[#D8C6A0]'
                                      }`}
                                    >
                                      <span className="text-[9px] font-cripta-pixel uppercase text-[#E7A54A]">
                                        PEDESTAL #{rIdx + 1}
                                      </span>
                                      <span className="font-cripta-display text-sm font-black uppercase">
                                        GLIFO {rName}
                                      </span>
                                      <span className="text-[8px] font-cripta-pixel uppercase opacity-80">
                                        {alreadyPressed ? '✓ SELLADO' : 'PULSAR RUNA'}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* 2. LOCKPICK_TIMING */}
                          {mg.minigameType === 'LOCKPICK_TIMING' && (
                            <div className="w-full max-w-xl flex flex-col items-center gap-3">
                              {/* Live Lockpick Timing Bar */}
                              <div className="w-full bg-[#09070E] border-2 border-[#4A3B5C] h-8 relative overflow-hidden">
                                {/* Sweet Spot Zone */}
                                <div
                                  className="absolute inset-y-0 bg-[#5EA87A]/35 border-x-2 border-[#5EA87A]"
                                  style={{
                                    left: `${sweetStart}%`,
                                    width: `${sweetEnd - sweetStart}%`,
                                  }}
                                />
                                {/* Moving Needle */}
                                <div
                                  className={`absolute inset-y-0 w-2 -ml-1 transition-all duration-75 ${
                                    inSweetSpot
                                      ? 'bg-[#FFD166] shadow-[0_0_12px_#FFD166]'
                                      : 'bg-[#FF4D6D]'
                                  }`}
                                  style={{ left: `${needlePct}%` }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[9px] font-cripta-pixel font-bold text-[#F5EFE6] uppercase">
                                  ZONA MAESTRA ({sweetStart}%–{sweetEnd}%) · PERNO{' '}
                                  {mg.currentStep + 1} DE {mg.maxSteps}
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center justify-center gap-3">
                                <button
                                  type="button"
                                  disabled={iAmDead}
                                  onClick={() => {
                                    if (onPuzzleInput && !iAmDead) {
                                      laCriptaAudio.playDoorVote();
                                      onPuzzleInput(inSweetSpot ? 100 : 200);
                                    }
                                  }}
                                  className={`px-5 py-2.5 border-2 font-cripta-pixel text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
                                    inSweetSpot
                                      ? 'bg-[#183626] border-[#6EE7B7] text-[#FFD166] shadow-[0_0_16px_rgba(110,231,183,0.45)]'
                                      : 'bg-[#231834] hover:bg-[#2F2046] border-[#E7A54A] text-[#F5EFE6]'
                                  }`}
                                >
                                  ⚡ FIJAR PERNO #{mg.currentStep + 1} AHORA
                                </button>
                              </div>
                            </div>
                          )}

                          {/* 3. TRAP_STEPPING */}
                          {mg.minigameType === 'TRAP_STEPPING' && (
                            <div className="w-full flex flex-col items-center gap-2.5">
                              <div className="text-[10px] font-cripta-pixel text-[#FFD166] uppercase">
                                HILERA ACTUAL: PASO {mg.currentStep + 1} DE {mg.maxSteps} (OBSERVA EL GRABADO FIRME)
                              </div>
                              <div className="flex flex-wrap items-center justify-center gap-3.5">
                                {[0, 1, 2].map((tileIdx) => {
                                  const isSafeTile =
                                    mg.targetSequence[mg.currentStep] === tileIdx;
                                  const tileNames = [
                                    'LOSA IZQUIERDA',
                                    'LOSA CENTRAL',
                                    'LOSA DERECHA',
                                  ];
                                  return (
                                    <button
                                      key={tileIdx}
                                      type="button"
                                      disabled={iAmDead}
                                      onClick={() => {
                                        if (onPuzzleInput && !iAmDead) {
                                          laCriptaAudio.playDoorVote();
                                          onPuzzleInput(tileIdx);
                                        }
                                      }}
                                      className={`w-44 p-3 border-2 flex flex-col items-center gap-1 cursor-pointer transition-all ${
                                        isSafeTile
                                          ? 'bg-[#1A162B] hover:bg-[#26203D] border-[#E7A54A] text-[#F5EFE6]'
                                          : 'bg-[#161120] hover:bg-[#221A30] border-[#3E2F4B] text-[#D8C6A0]/85'
                                      }`}
                                    >
                                      <span className="font-cripta-display text-xs font-black uppercase">
                                        {tileNames[tileIdx]}
                                      </span>
                                      <span className="text-[9px] font-cripta-pixel text-[#FFD166]">
                                        {isSafeTile
                                          ? '✦ SELLO INTACTO (FIRME)'
                                          : '≈ LOSA FISURADA'}
                                      </span>
                                      <span className="mt-1 text-[8px] font-cripta-pixel uppercase text-[#6EE7B7]">
                                        PISAR LOSA →
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* 4. ALCHEMICAL_BALANCE */}
                          {mg.minigameType === 'ALCHEMICAL_BALANCE' && (
                            <div className="w-full max-w-xl flex flex-col items-center gap-3">
                              <div className="w-full bg-[#09070E] border-2 border-[#4A3B5C] h-7 relative overflow-hidden">
                                {/* Optimal 70-86% Zone */}
                                <div
                                  className="absolute inset-y-0 bg-[#5EA87A]/35 border-x-2 border-[#5EA87A]"
                                  style={{ left: '70%', width: '16%' }}
                                />
                                {/* Current Alchemical Fill */}
                                <div
                                  className="h-full bg-gradient-to-r from-[#69A8A5] via-[#9B72CF] to-[#FFD166] transition-all duration-300"
                                  style={{
                                    width: `${Math.min(100, mg.alchemicalMeter ?? 20)}%`,
                                  }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center text-[9px] font-cripta-pixel font-bold text-[#F5EFE6] uppercase">
                                  RESONANCIA ACTUAL: {mg.alchemicalMeter ?? 20}% (ZONA PERFECTA: 70%–86%)
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center justify-center gap-2.5">
                                <button
                                  type="button"
                                  disabled={iAmDead}
                                  onClick={() => onPuzzleInput?.(2)}
                                  className="px-3 py-2 bg-[#181326] hover:bg-[#241C38] border border-[#69A8A5] text-[10px] font-cripta-pixel text-[#A5F3FC] uppercase cursor-pointer"
                                >
                                  +15% ESENCIA CENIZA
                                </button>
                                <button
                                  type="button"
                                  disabled={iAmDead}
                                  onClick={() => onPuzzleInput?.(0)}
                                  className="px-3 py-2 bg-[#181326] hover:bg-[#241C38] border border-[#9B72CF] text-[10px] font-cripta-pixel text-[#E0AAFF] uppercase cursor-pointer"
                                >
                                  +25% GOTA LUNAR
                                </button>
                                <button
                                  type="button"
                                  disabled={iAmDead}
                                  onClick={() => onPuzzleInput?.(1)}
                                  className="px-3 py-2 bg-[#181326] hover:bg-[#241C38] border border-[#E7A54A] text-[10px] font-cripta-pixel text-[#FFD166] uppercase cursor-pointer"
                                >
                                  +35% CATALIZADOR SOLAR
                                </button>
                                <button
                                  type="button"
                                  disabled={iAmDead}
                                  onClick={() => onPuzzleInput?.(3)}
                                  className="px-3.5 py-2 bg-[#14291E] hover:bg-[#1E3D2D] border-2 border-[#5EA87A] text-[10px] font-cripta-pixel font-bold text-[#8EE6AE] uppercase cursor-pointer"
                                >
                                  ✓ ESTABILIZAR MATRAZ
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                  {/* INTERACTIVE ROOM OPTIONS (EVENTS, SHRINES, TREASURE, REST, TRAP) AS LARGE PLAYABLE CARDS */}
                  {!activeRoom.resolved &&
                    activeRoom.options &&
                    activeRoom.options.length > 0 && (
                      <div className="w-full flex flex-wrap items-stretch justify-center gap-4">
                        {activeRoom.options.map((opt, idx) => {
                          const cardIllustrationKind =
                            activeRoom.type === 'SHRINE'
                              ? 'SHRINE_ALTAR'
                              : activeRoom.type === 'TREASURE'
                              ? 'TREASURE_CHEST'
                              : activeRoom.type === 'REST'
                              ? 'REST_CAMPFIRE'
                              : activeRoom.type === 'FORGE'
                              ? 'FORGE_ANVIL'
                              : activeRoom.type === 'TRAP'
                              ? 'EVENT_TRAP'
                              : idx === 0
                              ? 'EVENT_PACT'
                              : idx === 1
                              ? 'EVENT_RUNE'
                              : 'EVENT_PATH';

                          const hasHpCost = Boolean(opt.costHp && opt.costHp > 0);
                          const hasGoldCost = Boolean(
                            opt.costGold && opt.costGold > 0
                          );
                          const accent = hasHpCost
                            ? 'crimson'
                            : hasGoldCost
                            ? 'amber'
                            : 'emerald';
                          const resolvedCostLabel = hasGoldCost
                            ? `${opt.costGold} ORO`
                            : hasHpCost
                            ? `-${opt.costHp} PV`
                            : opt.subtitle || 'DECISIÓN';
                          const resolvedSummary =
                            opt.effectText ||
                            opt.subtitle ||
                            'Ejecutar esta decisión en la cámara.';

                          return (
                            <LaCriptaPlayableCard
                              key={opt.id}
                              title={opt.label}
                              categoryLabel={`DECISIÓN · ${
                                ROOM_TYPE_LABELS[activeRoom.type] || 'EVENTO'
                              }`}
                              costLabel={resolvedCostLabel}
                              cooldownLabel={`OPCIÓN ${idx + 1}`}
                              summary={resolvedSummary}
                              accentColor={accent}
                              disabled={
                                iAmDead ||
                                (hasGoldCost &&
                                  partyGold < (opt.costGold || 0))
                              }
                              illustration={
                                <LaCriptaCardPixelIllustration
                                  kind={cardIllustrationKind}
                                />
                              }
                              onClick={() => {
                                if (onInteractOption && !iAmDead) {
                                  laCriptaAudio.playDoorVote();
                                  onInteractOption(opt.id);
                                }
                              }}
                              footerBadge="ELEGIR DESTINO"
                            />
                          );
                        })}

                        {/* Weapon Forge Upgrade Card if available in REST / WEAPON_UPGRADE */}
                        {canForgeUpgradeHere && myWeapon && onUpgradeWeapon && (
                          <LaCriptaPlayableCard
                            title={`Forjar ${myWeapon.name}`}
                            categoryLabel="YUNQUE DE FORJA"
                            costLabel={`${forgeUpgradeCost} ORO`}
                            cooldownLabel={`NV.${myWeaponLv} → NV.${myWeaponLv + 1}`}
                            summary="Templa tu arma en las brasas para aumentar permanentemente su daño base y técnica."
                            accentColor="amber"
                            disabled={partyGold < forgeUpgradeCost || iAmDead}
                            illustration={
                              <LaCriptaCardPixelIllustration kind="FORGE_ANVIL" />
                            }
                            onClick={() => {
                              if (partyGold >= forgeUpgradeCost && !iAmDead) {
                                laCriptaAudio.playDoorVote();
                                onUpgradeWeapon();
                              }
                            }}
                            footerBadge={
                              partyGold >= forgeUpgradeCost
                                ? 'MEJORAR ARMA'
                                : 'ORO INSUFICIENTE'
                            }
                          />
                        )}
                      </div>
                    )}

                  {/* READY TO LEAVE / GIANT DOOR ADVANCE CARD */}
                  {canAdvance && onAdvanceRoom && (
                    <div className="mt-2 flex flex-wrap items-stretch justify-center gap-4">
                      {/* Secret Room Discovery Card if available */}
                      {activeRoom.hasSecretEntrance &&
                        !activeRoom.secretDiscovered &&
                        !inSecretRoom &&
                        onDiscoverSecret && (
                          <LaCriptaPlayableCard
                            title="Investigar Grieta Rúnica"
                            categoryLabel="SECRETO DETECTADO"
                            costLabel="EXPLORAR"
                            cooldownLabel="OCULTO"
                            summary="Una corriente de aire arcano escapa tras los bloques de piedra de esta cámara."
                            accentColor="purple"
                            disabled={iAmDead}
                            illustration={
                              <LaCriptaCardPixelIllustration kind="EVENT_RUNE" />
                            }
                            onClick={() => {
                              laCriptaAudio.playDoorVote();
                              onDiscoverSecret();
                            }}
                            footerBadge="DESCUBRIR CÁMARA"
                          />
                        )}

                      {/* Primary Advance / Cross Giant Door Card */}
                      <LaCriptaPlayableCard
                        title={
                          inSecretRoom
                            ? 'Salir de Cámara Oculta'
                            : isLastRoomInDungeon
                            ? completedDoorCount + 1 >= 3
                              ? 'Despertar Umbral Final'
                              : 'Completar Mazmorra'
                            : 'Cruzar Compuerta'
                        }
                        categoryLabel={
                          isLastRoomInDungeon
                            ? 'SELLO DE LA MAZMORRA'
                            : `AVANZAR A SALA ${currentRoomIndex + 2}`
                        }
                        costLabel="LISTO"
                        cooldownLabel={`${readyPlayerIds.length}/${totalConnected}`}
                        summary={
                          iAmReadyToAdvance
                            ? 'Esperando a que el resto del grupo confirme cruzar la compuerta...'
                            : isLastRoomInDungeon
                            ? 'Has derrotado al Guardián. Regresa a la Cámara de las Puertas con el sello conquistado.'
                            : 'Las pesadas hojas de piedra se cerrarán tras el grupo para abrir la siguiente cámara.'
                        }
                        accentColor="amber"
                        selected={iAmReadyToAdvance}
                        illustration={
                          <LaCriptaCardPixelIllustration kind="LEAVE_DOOR" />
                        }
                        onClick={() => {
                          laCriptaAudio.playDoorVote();
                          onAdvanceRoom();
                        }}
                        footerBadge={
                          iAmReadyToAdvance
                            ? '✓ ESPERANDO GRUPO'
                            : 'CRUZAR PUERTA →'
                        }
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ===============================================================
                BOTTOM BAR OF RIGHT BOARD: CO-OP REVIVAL & QUICK STATUS FOOTER
                =============================================================== */}
            <div className="relative z-10 pt-3 border-t border-[#2A1F36] flex flex-wrap items-center justify-between gap-2 text-[10px] font-cripta-pixel text-[#D8C6A0]/80">
              {/* Co-op Fallen Ally Revival Strip ONLY in multiplayer when allies are actually dead */}
              {!isSolo && fallenPlayers.length > 0 && !iAmDead && onReviveAlly ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[#FF8FA3] font-bold uppercase flex items-center gap-1">
                    <HeartPulse className="w-3.5 h-3.5" />
                    <span>ALIADO CAÍDO:</span>
                  </span>
                  {fallenPlayers.map((fp) => (
                    <div key={fp.id} className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={partyGold < 20}
                        onClick={() => {
                          laCriptaAudio.playDoorVote();
                          onReviveAlly(fp.id, 'GOLD');
                        }}
                        className="px-2 py-1 bg-[#1E1510] hover:bg-[#2C1E14] disabled:opacity-40 border border-[#E7A54A] text-[#FFD166] cursor-pointer"
                      >
                        REVIVIR A {fp.name} (20 ORO)
                      </button>
                      <button
                        type="button"
                        disabled={(me?.hp || 0) <= 12}
                        onClick={() => {
                          laCriptaAudio.playDoorVote();
                          onReviveAlly(fp.id, 'BLOOD');
                        }}
                        className="px-2 py-1 bg-[#261018] hover:bg-[#381623] disabled:opacity-40 border border-[#C93B5B] text-[#FF8FA3] cursor-pointer"
                      >
                        TRIBUTO VITAL (-{me?.characterId === 'clerigo' ? 6 : 10} PV)
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[#E7A54A]">◆</span>
                  <span>
                    {hasActiveCombat
                      ? 'Juega cartas usando tus Puntos de Acción (AP). Haz clic en un enemigo a la izquierda para cambiar de objetivo.'
                      : canAdvance
                      ? 'Sala despejada. Elige la carta "Cruzar Compuerta" para abrir el umbral hacia la siguiente cámara.'
                      : 'Selecciona una de las cartas en el tablero para resolver el encuentro.'}
                  </span>
                </div>
              )}

              <div className="text-[#D8C6A0]/60">
                RONDA {activeRoom.roundNumber || 1}
              </div>
            </div>

            {/* UNIFIED SLIDE-IN CONTEXTUAL SIDE PANEL (MOCHILA / PLAYER / ENEMY) */}
            <LaCriptaContextualSidePanel
              mode={contextualPanelMode}
              onClose={() => onCloseContextualPanel?.()}
              localPlayer={me || null}
              inspectedPlayer={inspectedPlayer}
              inspectedEnemy={inspectedEnemy}
              activeRoom={activeRoom}
              dungeon={chosenDungeon}
              partyRelics={expeditionState.partyRelics || []}
              discoveredAbilityIds={discoveredAbilityIds}
              isMyTurnInCombat={isMyTurn}
              hasActiveCombat={hasActiveCombat}
              selectedTargetEnemyId={activeTargetEnemy?.id || null}
              onSelectTargetEnemy={(enemyId) => setSelectedEnemyId(enemyId)}
              onUseConsumable={onUseConsumable}
            />
          </section>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // SCENE 3A: FINAL BOSS DOOR UNLOCKING CHAMBER (AFTER 3 DOORS COMPLETED)
  // ===========================================================================
  if (
    completedDoorCount >= 3 ||
    expeditionState.phase === 'FINAL_BOSS_ENTRANCE'
  ) {
    return (
      <div className="relative z-10 flex-1 min-h-0 w-full h-full px-3 sm:px-6 py-2 flex flex-col justify-center gap-2 select-none overflow-y-auto">
        <LaCriptaGiantDoorTransition
          transition={expeditionState.roomDoorTransition}
        />
        <div className="flex justify-center">
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
  // SCENE 3B: THE THREE DUNGEON DOORS (FULL-VIEWPORT ARCHITECTURAL SELECTION)
  // ===========================================================================
  const openingDungeonDef =
    isOpeningPhase && expeditionState.selectedDungeonId
      ? CRIPTA_DUNGEONS_REGISTRY[expeditionState.selectedDungeonId]
      : null;

  const isReturningToDoors = expeditionState.phase === 'RETURNING_TO_DOORS';

  return (
    <div className="relative z-10 flex-1 min-h-0 w-full h-full max-w-6xl mx-auto px-3 sm:px-6 py-2 flex flex-col justify-center gap-2.5 sm:gap-3.5 select-none overflow-y-auto">
      <LaCriptaGiantDoorTransition
        transition={expeditionState.roomDoorTransition}
      />

      {/* Returning-to-Doors Celebration Banner */}
      {isReturningToDoors && (
        <div className="mx-auto px-5 py-1.5 bg-[#1F1529] border-2 border-[#FFD166] text-center shadow-[0_0_28px_rgba(231,165,74,0.45)] animate-bounce">
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
        <h1 className="font-cripta-display text-2xl sm:text-3xl md:text-4xl font-black tracking-widest text-[#D8C6A0] uppercase">
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
              VOTOS DEL GRUPO: {Object.keys(expeditionState.doorVotes).length} /{' '}
              {totalConnected}
            </p>
          )
        )}

        {/* Multiplayer Tie Notice */}
        {expeditionState.voteTieWarning && !isOpeningPhase && (
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-[#19111D] border border-[#E7A54A] text-xs font-cripta-pixel text-[#E7A54A]">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>
              EMPATE EN LA VOTACIÓN · CAMBIAD VUESTRO VOTO PARA ABRIR UN CAMINO
            </span>
          </div>
        )}

        {/* Initialization Retry Notice */}
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
                  ? 'scale-[1.10] -translate-y-2 z-30'
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
              <div className="mt-2 text-center px-1">
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
                <div className="mt-1 min-h-[20px] flex flex-wrap items-center justify-center gap-1.5">
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
