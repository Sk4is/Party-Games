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
  CriptaAccessoryId,
  CriptaArmorId,
  CriptaCharacterId,
  CriptaDungeonDefinition,
  CriptaDungeonId,
  CriptaExpeditionState,
  CriptaPlayerRoundActionType,
  CriptaRoomEnemy,
  CriptaVisualEvent,
  CriptaWeaponId,
  CriptaWeaponRuneId,
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
  CRIPTA_ACCESSORIES_REGISTRY,
  CRIPTA_ARMORS_REGISTRY,
  CRIPTA_WEAPON_RUNES_REGISTRY,
  CRIPTA_WEAPONS_REGISTRY,
  estimatePlayerActionDamage,
  formatDamageRange,
  getEquippedWeaponForPlayer,
  WEAPON_UPGRADE_MAX_LEVEL,
} from '../../data/la-cripta/criptaEquipmentAndEvents';
import { LaCriptaPixelSprite } from './LaCriptaPixelSprite';
import { buildEnemyAiProfileForArchetype } from '../../data/la-cripta/criptaEnemyAiEngine';
import { LaCriptaDoorArtwork } from './LaCriptaDoorArtwork';
import { ROOM_TYPE_LABELS } from './LaCriptaRoomProgressTracker';
import { LaCriptaEnemyPixelSprite } from './LaCriptaRoomEnvironment';
import {
  LaCriptaStatusEffectBadge,
  LaCriptaStatusPixelIcon,
} from './LaCriptaStatusEffectBadge';
import {
  getClassMechanicForCharacter,
  getEnemyActiveStatuses,
  getPlayerActionMechanicBadge,
  getPlayerClassMechanicHudState,
} from '../../data/la-cripta/criptaClassMechanics';
import {
  CriptaEnemyLifecycleStage,
  LaCriptaCombatVfxOverlay,
  LaCriptaEnemyDeathOverlay,
  LaCriptaFloatingEventBadge,
} from './LaCriptaVisualFeedback';
import {
  LaCriptaDamageTypeBadge,
  LaCriptaDoorCounterBadge,
  LaCriptaGroundDropsOverlay,
  LaCriptaItemPixelIcon,
  LaCriptaWeaponRunePixelIcon,
} from './LaCriptaItemRelicArt';
import { LaCriptaFinalBossDoorScene } from './LaCriptaFinalBossComponents';
import { LaCriptaGiantDoorTransition } from './LaCriptaGiantDoorTransition';
import {
  LaCriptaContextualDecisionArt,
  LaCriptaDoorCardIllustration,
} from './LaCriptaContextualArtSystem';
import {
  LaCriptaBiomeStageBackdrop,
  LaCriptaCardPixelIllustration,
  LaCriptaCombatCardArtwork,
  LaCriptaNonCombatStagePortrait,
  LaCriptaPlayableCard,
  resolveWeaponCombatArtKey,
} from './LaCriptaEncounterCards';
import {
  CriptaContextualPanelMode,
  LaCriptaBackpackPixelIcon,
  LaCriptaContextualSidePanel,
} from './LaCriptaSidePanels';
import { LaCriptaPixelTooltip } from './LaCriptaPixelTooltip';
import {
  LaCriptaMinigameControlBoard,
  LaCriptaMinigameStageArt,
} from './LaCriptaMinigameRoomView';
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
  enemyLifecycleStates?: Record<string, CriptaEnemyLifecycleStage>;
  isPresentingSequence?: boolean;
  presentationBannerText?: string | null;
  hitStopActive?: boolean;
  presentedEnemyHp?: Record<string, { hp: number; trailHp: number }>;
  dyingEnemies?: Record<string, CriptaRoomEnemy>;
  hideGroundDropsDuringDeath?: boolean;
  presentedExpeditionDefeated?: boolean;
  activeActingEnemyId?: string | null;
  activeTargetedPlayerIdsDuringPresentation?: string[];
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
  onEquipWeaponRune?: (runeId: CriptaWeaponRuneId | null) => void;
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
  onHoveredDoorChange?: (dungeonId: CriptaDungeonId | null) => void;
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
  enemyLifecycleStates = {},
  isPresentingSequence = false,
  presentationBannerText = null,
  hitStopActive = false,
  presentedEnemyHp = {},
  dyingEnemies = {},
  hideGroundDropsDuringDeath = false,
  presentedExpeditionDefeated = false,
  activeActingEnemyId = null,
  activeTargetedPlayerIdsDuringPresentation = [],
  onVoteDoor,
  onVoteFinalBossDoor,
  onRetryDungeonInit,
  onCombatAction,
  onLockRoundAction,
  onUseConsumable,
  onBuyShopSlot,
  onUpgradeWeapon,
  onEquipWeaponRune,
  onReviveAlly,
  onInteractOption,
  onPuzzleInput,
  onDiscoverSecret,
  onAdvanceRoom,
  onClaimGroundDrop,
  onShopBuyItem,
  onShopBuyRelic,
  onSelectedEnemyChange,
  onHoveredDoorChange,
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
  const [localLockedTurnKey, setLocalLockedTurnKey] = useState<string | null>(null);
  const [claimingDropIds, setClaimingDropIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const id = window.setInterval(() => {
      setLockpickTick((t) => (t + 1) % 40);
    }, 90);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    onSelectedEnemyChange?.(selectedEnemyId);
  }, [selectedEnemyId, onSelectedEnemyChange]);

  useEffect(() => {
    onHoveredDoorChange?.(hoveredDoorId);
  }, [hoveredDoorId, onHoveredDoorChange]);

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

    const livingEnemies = activeRoom.enemies.filter(
      (e) => e.hp > 0 && enemyLifecycleStates[e.id] !== 'DEAD_REMOVED'
    );
    // Authoritative enemy lifecycle: ALIVE -> DYING -> DEAD_REMOVED
    // Once an enemy enters DEAD_REMOVED, it must NEVER be rendered again in this encounter.
    const visibleRoomEnemies = activeRoom.enemies
      .filter((e) => enemyLifecycleStates[e.id] !== 'DEAD_REMOVED')
      .map((e) => {
        if (dyingEnemies[e.id] && e.hp <= 0) {
          return dyingEnemies[e.id];
        }
        return e;
      })
      .filter(
        (e) =>
          enemyLifecycleStates[e.id] !== 'DEAD_REMOVED' &&
          (e.hp > 0 ||
            (presentedEnemyHp[e.id]?.hp ?? 0) > 0 ||
            enemyAnimStates[e.id] === 'death' ||
            enemyLifecycleStates[e.id] === 'DYING' ||
            Boolean(dyingEnemies[e.id]))
      );
    const activeTargetEnemy =
      livingEnemies.find((e) => e.id === selectedEnemyId) ||
      livingEnemies[0] ||
      visibleRoomEnemies[0] ||
      null;

    const getEquipmentComparison = (opts: {
      weaponId?: CriptaWeaponId;
      armorId?: CriptaArmorId;
      accessoryId?: CriptaAccessoryId;
      weaponRuneId?: CriptaWeaponRuneId;
      isForgeUpgrade?: boolean;
    }): {
      badge: string | null;
      tone: 'upgrade' | 'downgrade' | 'neutral';
      detailTooltip: string;
    } => {
      if (!me) {
        return { badge: null, tone: 'neutral', detailTooltip: '' };
      }
      const eqWep = getEquippedWeaponForPlayer(me);
      if (opts.isForgeUpgrade && eqWep) {
        return {
          badge: `MEJORA NV.${eqWep.level} → NV.${eqWep.level + 1} (+2–3 DAÑO BASE)`,
          tone: 'upgrade',
          detailTooltip: `Actual: ${eqWep.weapon.name} NV.${eqWep.level} (${eqWep.scaledMin}–${eqWep.scaledMax} daño). Al forjar sube a NV.${eqWep.level + 1} con +2 daño mínimo y +3 daño máximo.`,
        };
      }
      if (opts.weaponId) {
        const cand = CRIPTA_WEAPONS_REGISTRY[opts.weaponId];
        if (!cand) return { badge: null, tone: 'neutral', detailTooltip: '' };
        const candDmgType = cand.baseDamageType || 'FISICO';
        if (!eqWep) {
          return {
            badge: `NUEVA ARMA: ${cand.baseMinDamage}–${cand.baseMaxDamage} DAÑO (${candDmgType})`,
            tone: 'upgrade',
            detailTooltip: `${cand.specialEffectText} Escala con ${cand.scalingStat}.`,
          };
        }
        if (eqWep.weapon.id === cand.id) {
          return {
            badge: `YA EQUIPADA (NV.${eqWep.level} · ${eqWep.scaledMin}–${eqWep.scaledMax} DAÑO)`,
            tone: 'neutral',
            detailTooltip: `Ya llevas equipada ${cand.name}. Comprarla o reclamarla la templará a NV.${eqWep.level + 1}.`,
          };
        }
        const dMin = cand.baseMinDamage - eqWep.scaledMin;
        const dMax = cand.baseMaxDamage - eqWep.scaledMax;
        const dAvg = (dMin + dMax) / 2;
        const fmt = (n: number) => (n > 0 ? `+${n}` : `${n}`);
        return {
          badge: `VS ${eqWep.weapon.name.slice(0, 14)}: ${fmt(dMin)}/${fmt(dMax)} DAÑO · ${candDmgType}`,
          tone: dAvg > 0 ? 'upgrade' : dAvg < 0 ? 'downgrade' : 'neutral',
          detailTooltip: `COMPARATIVA DE ARMA — Equipada: ${eqWep.weapon.name} NV.${eqWep.level} (${eqWep.scaledMin}–${eqWep.scaledMax} daño ${eqWep.activeDamageType}) vs Candidata: ${cand.name} (${cand.baseMinDamage}–${cand.baseMaxDamage} daño ${candDmgType}, escala con ${cand.scalingStat}). Técnica: ${cand.specialAttack?.name || 'Especial'}.`,
        };
      }
      if (opts.armorId) {
        const cand = CRIPTA_ARMORS_REGISTRY[opts.armorId];
        if (!cand) return { badge: null, tone: 'neutral', detailTooltip: '' };
        const cur = me.equippedArmorId
          ? CRIPTA_ARMORS_REGISTRY[me.equippedArmorId]
          : null;
        if (cur && cur.id === cand.id) {
          return {
            badge: `YA EQUIPADA (+${cand.bonusDefense} DEF · +${cand.bonusMaxHp} PV)`,
            tone: 'neutral',
            detailTooltip: cand.specialEffectText,
          };
        }
        const dDef = cand.bonusDefense - (cur?.bonusDefense || 0);
        const dHp = cand.bonusMaxHp - (cur?.bonusMaxHp || 0);
        const score = dDef * 2 + dHp * 0.5;
        const fmt = (n: number) => (n > 0 ? `+${n}` : `${n}`);
        return {
          badge: `VS ${cur ? cur.name.slice(0, 12) : 'SIN ARMADURA'}: ${fmt(dDef)} DEF · ${fmt(dHp)} PV`,
          tone: score > 0 ? 'upgrade' : score < 0 ? 'downgrade' : 'neutral',
          detailTooltip: `COMPARATIVA DE ARMADURA — Equipada: ${
            cur ? `${cur.name} (+${cur.bonusDefense} DEF, +${cur.bonusMaxHp} PV)` : 'Ninguna'
          } vs Candidata: ${cand.name} (+${cand.bonusDefense} DEF, +${cand.bonusMaxHp} PV). ${cand.specialEffectText}`,
        };
      }
      if (opts.accessoryId) {
        const cand = CRIPTA_ACCESSORIES_REGISTRY[opts.accessoryId];
        if (!cand) return { badge: null, tone: 'neutral', detailTooltip: '' };
        const cur = me.equippedAccessoryId
          ? CRIPTA_ACCESSORIES_REGISTRY[me.equippedAccessoryId]
          : null;
        if (cur && cur.id === cand.id) {
          return {
            badge: 'ACCESORIO YA EQUIPADO',
            tone: 'neutral',
            detailTooltip: cand.specialEffectText,
          };
        }
        const bonusParts: string[] = [];
        if (cand.bonusAttack) bonusParts.push(`+${cand.bonusAttack} ATQ`);
        if (cand.bonusMagic) bonusParts.push(`+${cand.bonusMagic} MAG`);
        if (cand.bonusDefense) bonusParts.push(`+${cand.bonusDefense} DEF`);
        if (cand.bonusAgility) bonusParts.push(`+${cand.bonusAgility} AGI`);
        if (cand.bonusPrecision) bonusParts.push(`+${cand.bonusPrecision} PRE`);
        if (cand.bonusWillpower) bonusParts.push(`+${cand.bonusWillpower} VOL`);
        return {
          badge: cur
            ? `REEMPLAZA ${cur.name.slice(0, 12)} (${bonusParts.join(' · ') || 'EFECTO'})`
            : `RANURA LIBRE: ${bonusParts.join(' · ') || 'BONO ESPECIAL'}`,
          tone: cur ? 'neutral' : 'upgrade',
          detailTooltip: `COMPARATIVA DE ACCESORIO — Equipado: ${
            cur ? `${cur.name} (${cur.specialEffectText})` : 'Ninguno'
          } vs Candidato: ${cand.name} (${cand.specialEffectText}).`,
        };
      }
      if (opts.weaponRuneId) {
        const cand = CRIPTA_WEAPON_RUNES_REGISTRY[opts.weaponRuneId];
        if (!cand) return { badge: null, tone: 'neutral', detailTooltip: '' };
        const alreadyOwned = (me.ownedWeaponRunes || []).includes(opts.weaponRuneId);
        return {
          badge: alreadyOwned
            ? `RUNA YA EN INVENTARIO (${cand.infusedDamageType})`
            : `INFUSIÓN ${cand.infusedDamageType}: ${cand.benefitText.slice(0, 26)}`,
          tone: alreadyOwned ? 'neutral' : 'upgrade',
          detailTooltip: `${cand.name}: Infunde daño ${cand.infusedDamageType}. Beneficio: ${cand.benefitText} Contrapartida: ${cand.tradeoffText}`,
        };
      }
      return { badge: null, tone: 'neutral', detailTooltip: '' };
    };
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

    // Individual Player Turn & Strict 1-Card-Per-Turn Action Lock
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
    const currentTurnAp = activeRoom.currentTurnAp ?? 1;
    const maxTurnAp = activeRoom.maxTurnAp ?? 1;
    const authoritativeTurnKey = `${activeRoom.id}_${
      activeRoom.turnId ?? activeRoom.roundNumber ?? 1
    }_${activeTurnPlayerId || 'none'}_${currentTurnAp}`;
    const isTurnActionLocked = Boolean(
      isPresentingSequence ||
        activeRoom.actionConsumedThisTurn ||
        activeRoom.turnActionLocked ||
        localLockedTurnKey === authoritativeTurnKey
    );

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

    // Do NOT reveal the defeat screen until the fatal attack, damage number, and player death animations finish!
    const isDefeated =
      Boolean(expeditionState.expeditionDefeated) &&
      (presentedExpeditionDefeated || !isPresentingSequence);
    const hasDiscountRelic = Boolean(
      me &&
        playerHasRelic(
          me,
          expeditionState.partyRelics || [],
          'moneda_del_muerto'
        )
    );

    const unclaimedDrops = hideGroundDropsDuringDeath
      ? []
      : (activeRoom.groundDrops || []).filter((d) => !d.claimedByPlayerId);
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

    const hasActiveCombat =
      (livingEnemies.length > 0 && !activeRoom.resolved) ||
      (isCombatRoomType && visibleRoomEnemies.length > 0 && isPresentingSequence);

    const canAdvance =
      !isDefeated &&
      !isFinalBossCombat &&
      !isTransitioningDoor &&
      (activeRoom.resolved ||
        !hasActiveCombat ||
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
      if (actionType !== 'USE_ITEM' && isTurnActionLocked) return;
      if (actionType !== 'USE_ITEM') {
        setLocalLockedTurnKey(authoritativeTurnKey);
      }
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
            <div
              className={`relative z-20 flex-1 min-h-[180px] flex flex-col items-center justify-center my-1.5 transition-transform duration-75 ${
                hitStopActive ? 'scale-[1.02] brightness-125' : ''
              }`}
            >
              {visibleRoomEnemies.length > 0 ? (
                <div className="w-full flex flex-wrap items-end justify-center gap-4 sm:gap-6">
                  {visibleRoomEnemies.map((enemy, enemyIdx) => {
                    const presentedHpObj = presentedEnemyHp[enemy.id];
                    const displayedHp = Math.max(
                      0,
                      Math.round(presentedHpObj ? presentedHpObj.hp : enemy.hp)
                    );
                    const displayedTrailHp = Math.max(
                      displayedHp,
                      Math.round(
                        presentedHpObj ? presentedHpObj.trailHp : displayedHp
                      )
                    );
                    const isDead =
                      enemy.hp <= 0 &&
                      displayedHp <= 0 &&
                      (enemyAnimStates[enemy.id] === 'death' ||
                        Boolean(dyingEnemies[enemy.id]));
                    const isTargeted = activeTargetEnemy?.id === enemy.id && !isDead;
                    const isActingNow =
                      !isDead &&
                      (activeActingEnemyId === enemy.id ||
                        (!isPlayerPhase && activeRoom.activeCombatActorId === enemy.id));
                    const sameSpeciesList = visibleRoomEnemies.filter(
                      (e) => e.name === enemy.name
                    );
                    const instanceOrdinal =
                      sameSpeciesList.length > 1
                        ? sameSpeciesList.findIndex((e) => e.id === enemy.id) + 1
                        : 0;
                    const enemyDisplayNameWithInstance =
                      instanceOrdinal > 0
                        ? `${enemy.name} #${instanceOrdinal}`
                        : enemy.name;
                    const intendedTargetPlayers = (enemy.lastTargetedPlayerIds || [])
                      .map((pid) => expeditionState.players.find((p) => p.id === pid))
                      .filter(Boolean);
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
                        data-enemy-stage-id={enemy.id}
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
                            ? 'opacity-40 scale-90 translate-y-2 pointer-events-none'
                            : isActingNow
                            ? '-translate-y-1.5 scale-[1.04] z-30 drop-shadow-[0_6px_14px_rgba(231,165,74,0.35)]'
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

                        {/* Acting Indicator + Multi-Enemy Target Indicator & Explicit Inspect Action */}
                        {!isDead && (
                          <div className="mb-1 flex flex-wrap items-center justify-center gap-1">
                            {isActingNow && (
                              <div className="px-2 py-0.5 bg-[#1B1326]/95 border border-[#FFD166]/85 text-[8px] font-cripta-pixel font-bold text-[#FFD166] uppercase tracking-wider shadow-[0_0_10px_rgba(255,209,102,0.3)]">
                                ◆ ACTÚA
                              </div>
                            )}
                            {visibleRoomEnemies.length > 1 && !isActingNow && (
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
                                title={`Examinar a ${enemyDisplayNameWithInstance}`}
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
                              isCrit={
                                latestEnemyVfx.isCrit ||
                                latestEnemyVfx.kind === 'CRIT_ENEMY'
                              }
                            />
                          )}
                          {isDead && (
                            <LaCriptaEnemyDeathOverlay
                              enemyName={enemyDisplayNameWithInstance}
                              dungeonId={chosenDungeon.id}
                              isBossOrMiniboss={
                                enemy.isBoss ||
                                enemy.isFinalBoss ||
                                enemy.isMiniboss
                              }
                            />
                          )}
                          <LaCriptaEnemyPixelSprite
                            enemy={enemy}
                            dungeonId={chosenDungeon.id}
                            isTargeted={isTargeted || isActingNow}
                            animState={animState}
                            totalVisibleEnemies={visibleRoomEnemies.length}
                            enemyIndex={enemyIdx}
                            customSizePx={spriteSize}
                          />
                        </div>

                        {/* Secondary mini HP bar when multiple enemies exist */}
                        {visibleRoomEnemies.length > 1 && (
                          <div
                            className={`mt-2 w-40 bg-[#0B0811]/95 border p-1.5 text-center transition-colors ${
                              isActingNow
                                ? 'border-[#FFD166] shadow-[0_0_14px_rgba(255,209,102,0.35)]'
                                : 'border-[#3E2F4B]'
                            }`}
                          >
                            <div className="text-[9px] font-cripta-display font-bold text-[#F5EFE6] truncate">
                              {enemyDisplayNameWithInstance}
                            </div>
                            <div className="mt-0.5 text-[7px] font-cripta-pixel font-bold text-[#FFD166] uppercase tracking-wider truncate">
                              {enemy.abilityName ||
                                enemy.intent ||
                                enemy.profession ||
                                buildEnemyAiProfileForArchetype(enemy).profession}
                            </div>
                            {intendedTargetPlayers.length > 0 && (
                              <div className="mt-0.5 text-[7px] font-cripta-pixel font-bold text-[#FF8FA3] truncate">
                                🎯{' '}
                                {intendedTargetPlayers.length >= connectedPlayers.length &&
                                connectedPlayers.length > 1
                                  ? 'TODO EL GRUPO'
                                  : intendedTargetPlayers
                                      .map((tp) => tp?.name)
                                      .filter(Boolean)
                                      .join(', ')}
                              </div>
                            )}
                            <div className="mt-1 h-2 w-full bg-[#161020] border border-[#2D223B] overflow-hidden relative">
                              {/* Delayed trailing damage strip */}
                              <div
                                className="absolute inset-y-0 left-0 bg-[#FFD166]/85 transition-all duration-500 ease-out"
                                style={{
                                  width: `${Math.max(
                                    0,
                                    Math.min(
                                      100,
                                      (displayedTrailHp /
                                        Math.max(1, enemy.maxHp)) *
                                        100
                                    )
                                  )}%`,
                                }}
                              />
                              <div
                                className="relative z-10 h-full bg-gradient-to-r from-[#9E2A45] to-[#E63956] transition-all duration-400 ease-out"
                                style={{
                                  width: `${Math.max(
                                    0,
                                    Math.min(
                                      100,
                                      (displayedHp / Math.max(1, enemy.maxHp)) *
                                        100
                                    )
                                  )}%`,
                                }}
                              />
                            </div>
                            <div className="mt-0.5 flex items-center justify-between text-[8px] font-cripta-pixel text-[#D8C6A0]">
                              <span>
                                PV {displayedHp}/{enemy.maxHp}
                              </span>
                              <span>DEF {enemy.armor || 0}</span>
                            </div>
                            {/* Active status badges on secondary multi-enemy card (All Buffs & Debuffs) */}
                            {(() => {
                              const activeEnStatuses = getEnemyActiveStatuses(enemy);
                              if (activeEnStatuses.length === 0) return null;
                              return (
                                <div className="mt-1 pt-1 border-t border-[#261C33] flex flex-wrap items-center justify-center gap-1">
                                  {activeEnStatuses.map((st) => (
                                    <LaCriptaStatusEffectBadge
                                      key={st.id}
                                      effectType={st.effectType}
                                      turnsRemaining={st.remainingTurns}
                                      stacks={st.stacks}
                                      compact
                                    />
                                  ))}
                                </div>
                              );
                            })()}
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
              ) : activeRoom.minigame &&
                !activeRoom.resolved &&
                !activeRoom.minigame.completed ? (
                /* Interactive Minigame Room Stage Mechanism (Roulette, Obelisk, Lock, Mirrors, Chains, Alchemical Cauldron) */
                <div className="flex flex-col items-center justify-center">
                  <LaCriptaMinigameStageArt
                    room={activeRoom}
                    dungeon={chosenDungeon}
                    minigame={activeRoom.minigame}
                    players={expeditionState.players}
                    currentPlayerId={currentPlayerId}
                  />
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
                    const intendedTargetIds =
                      activeTargetEnemy.lastTargetedPlayerIds || [];
                    const intendedTargetPlayers = intendedTargetIds
                      .map((pid) => expeditionState.players.find((p) => p.id === pid))
                      .filter(Boolean);
                    const isAoeTarget =
                      intendedTargetPlayers.length > 1 &&
                      intendedTargetPlayers.length >= connectedPlayers.length;

                    return (
                      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#291E36]">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-1.5 py-0.5 bg-[#2A121D] border border-[#E63956] text-[8px] font-cripta-pixel font-bold text-[#FF8FA3] uppercase tracking-wider">
                            INTENCIÓN ENEMIGA
                          </span>
                          <span className="text-xs font-cripta-display font-bold text-[#FFD166] uppercase tracking-wide">
                            {telegraphedLabel}
                          </span>
                          {intendedTargetPlayers.length > 0 && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#1E0F1C] border border-[#FF4D6D] text-[8px] font-cripta-pixel font-bold text-[#FFF3C4] uppercase">
                              <span className="text-[#FF8FA3]">🎯 OBJETIVO:</span>
                              {isAoeTarget ? (
                                <span className="text-[#FFD166]">TODO EL GRUPO</span>
                              ) : (
                                intendedTargetPlayers.map((tp, idx) =>
                                  tp ? (
                                    <span
                                      key={tp.id}
                                      style={{ color: tp.color || '#FFD166' }}
                                    >
                                      {idx > 0 ? ', ' : ''}
                                      {tp.name}
                                    </span>
                                  ) : null
                                )
                              )}
                            </span>
                          )}
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
                  {(() => {
                    const targetHpObj = presentedEnemyHp[activeTargetEnemy.id];
                    const targetDisplayedHp = Math.max(
                      0,
                      Math.round(
                        targetHpObj ? targetHpObj.hp : activeTargetEnemy.hp
                      )
                    );
                    const targetTrailHp = Math.max(
                      targetDisplayedHp,
                      Math.round(
                        targetHpObj
                          ? targetHpObj.trailHp
                          : targetDisplayedHp
                      )
                    );
                    return (
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
                        <div className="flex items-center justify-between text-xs font-cripta-pixel mb-1 gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[#F5EFE6] font-bold uppercase truncate">
                              SALUD DE {activeTargetEnemy.name}
                            </span>
                            <span className="px-1.5 py-0.5 bg-[#241838] border border-[#7656A8] text-[8px] font-cripta-pixel font-bold text-[#FFD166] uppercase tracking-wider shrink-0">
                              {activeTargetEnemy.profession ||
                                buildEnemyAiProfileForArchetype(
                                  activeTargetEnemy
                                ).profession}
                            </span>
                          </div>
                          <span className="text-[#FFD166] font-bold shrink-0">
                            {targetDisplayedHp} / {activeTargetEnemy.maxHp} PV
                          </span>
                        </div>
                        <div className="h-4 w-full bg-[#160F20] border-2 border-[#3E2F4B] overflow-hidden relative">
                          {/* Delayed trailing damage strip */}
                          <div
                            className="absolute inset-y-0 left-0 bg-[#FFD166]/85 transition-all duration-500 ease-out"
                            style={{
                              width: `${Math.max(
                                0,
                                Math.min(
                                  100,
                                  (targetTrailHp /
                                    Math.max(1, activeTargetEnemy.maxHp)) *
                                    100
                                )
                              )}%`,
                            }}
                          />
                          <div
                            className="relative z-10 h-full bg-gradient-to-r from-[#8A1C33] via-[#C93B5B] to-[#FF4D6D] transition-all duration-400 ease-out"
                            style={{
                              width: `${Math.max(
                                0,
                                Math.min(
                                  100,
                                  (targetDisplayedHp /
                                    Math.max(1, activeTargetEnemy.maxHp)) *
                                    100
                                )
                              )}%`,
                            }}
                          />
                          {/* Crisp pixel segment ticks */}
                          <div
                            className="pointer-events-none absolute inset-0 z-20 opacity-25"
                            style={{
                              backgroundImage:
                                'repeating-linear-gradient(90deg, transparent 0px, transparent 14px, #09070D 14px, #09070D 16px)',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })()}

                  {/* Active Status Effects on Target Enemy (All Buffs & Debuffs with full Tooltip clarity) */}
                  {(() => {
                    const targetStatuses = getEnemyActiveStatuses(activeTargetEnemy);
                    if (targetStatuses.length === 0) return null;
                    return (
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#261C33]">
                        <span className="text-[8px] font-cripta-pixel text-[#D8C6A0]/70 uppercase tracking-wider mr-1">
                          ESTADOS ACTIVOS:
                        </span>
                        {targetStatuses.map((st) => (
                          <LaCriptaStatusEffectBadge
                            key={st.id}
                            effectType={st.effectType}
                            turnsRemaining={st.remainingTurns}
                            stacks={st.stacks}
                          />
                        ))}
                      </div>
                    );
                  })()}
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
              RIGHT SIDE: LARGE TACTICAL CARD & DECISION BOARD (58-62vw, ZERO VERTICAL SCROLL)
              ================================================================= */}
          <section className="relative min-h-0 h-full flex flex-col justify-between p-3 sm:p-4 lg:p-5 bg-[#090710]/36 overflow-hidden">
            {/* Subtle Biome Radial Accent Over Right Board */}
            <div
              className="pointer-events-none absolute inset-0 opacity-25"
              style={{
                backgroundImage: `radial-gradient(circle at 80% 20%, ${chosenDungeon.palette.glow}33 0%, transparent 58%)`,
              }}
            />

            {/* TOP BAR OF RIGHT BOARD: TURN BANNER + AP CRYSTALS OR ENCOUNTER CONTEXT */}
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#2A1F36] shrink-0">
              {hasActiveCombat ? (
                <>
                  {/* Active Turn Banner */}
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`px-3 py-1 border-2 font-cripta-pixel text-xs font-bold uppercase tracking-widest transition-all ${
                        !isPlayerPhase || isTurnActionLocked
                          ? 'bg-[#2A1019] border-[#E63956] text-[#FF8FA3] animate-pulse'
                          : isMyTurn
                          ? 'bg-[#261A0E] border-[#FFD166] text-[#FFD166] shadow-[0_0_20px_rgba(255,209,102,0.3)]'
                          : 'bg-[#161120] border-[#4A3B5C] text-[#D8C6A0]'
                      }`}
                    >
                      {!isPlayerPhase || Boolean(activeActingEnemyId)
                        ? '◆ TURNO ENEMIGO'
                        : isPresentingSequence && presentationBannerText
                        ? `✦ ${presentationBannerText}`
                        : isTurnActionLocked
                        ? '✦ RESOLVIENDO ACCIÓN...'
                        : isMyTurn
                        ? `✦ ¡TU TURNO, ${me?.name || 'HÉROE'}! · ELIGE 1 CARTA`
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

                  {/* Action Points (1 Card Per Turn Lock) Crystal Counter */}
                  <div className="flex items-center gap-2 px-2.5 py-1 bg-[#120D1A] border border-[#4A3B5C]">
                    <span className="text-[9px] font-cripta-pixel text-[#D8C6A0] uppercase tracking-wider">
                      ACCIÓN DE TURNO:
                    </span>
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: maxTurnAp }).map((_, idx) => {
                        const filled =
                          idx < currentTurnAp &&
                          isPlayerPhase &&
                          !isTurnActionLocked;
                        return (
                          <span
                            key={idx}
                            className={`w-3 h-3 rotate-45 border transition-all ${
                              filled
                                ? 'bg-[#FFD166] border-[#FFF3B0] shadow-[0_0_8px_rgba(255,209,102,0.85)]'
                                : 'bg-[#1B1426] border-[#4A3B5C] opacity-45'
                            }`}
                          />
                        );
                      })}
                    </div>
                    <span className="text-[11px] font-cripta-pixel font-bold text-[#FFD166]">
                      {isPlayerPhase && !isTurnActionLocked ? currentTurnAp : 0} / {maxTurnAp} CARTA
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
                CENTER OF RIGHT BOARD (.gameContent): PLAYABLE CARDS / ENCOUNTER OPTIONS
                Responsive room fitting with smooth vertical scroll when needed so progression is NEVER cut off
                =============================================================== */}
            <div className="gameContent relative z-10 flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col items-center justify-start my-1 py-1.5 pb-6 pr-1">
              {/* CASE A: EXPEDITION DEFEATED (FULL PARTY FALLEN STATE — ONLY AFTER DEATH SEQUENCE COMPLETES) */}
              {isDefeated ? (
                <div className="my-auto max-w-2xl w-full bg-[#140B14]/95 border-2 border-[#C93B5B] p-4 sm:p-6 text-center shadow-[0_0_45px_rgba(201,59,91,0.35)] flex flex-col items-center gap-3.5">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#2B0E18] border border-[#C93B5B] text-[10px] font-cripta-pixel font-bold text-[#FF8FA3] uppercase tracking-widest">
                    <span>☠ EXPEDICIÓN FALLIDA · LA CRIPTA OS HA RECLAMADO</span>
                  </div>
                  <h3 className="font-cripta-display text-2xl sm:text-3xl font-black text-[#F5EFE6] uppercase tracking-wide">
                    LA CRIPTA OS HA RECLAMADO
                  </h3>
                  <p className="text-xs font-cripta-pixel text-[#D8C6A0]/85 leading-relaxed max-w-xl">
                    {activeRoom.outcomeLog ||
                      `Todos los aventureros han caído en ${chosenDungeon.name} (${activeRoom.title}).`}
                  </p>

                  {/* Fallen Party Portraits Strip */}
                  <div className="w-full flex flex-wrap items-center justify-center gap-2.5 py-1">
                    {expeditionState.players
                      .filter((p) => p.isConnected)
                      .map((p) => {
                        const cId = (p.characterId || 'caballero') as CriptaCharacterId;
                        const cDef = CRIPTA_CHARACTERS_CATALOG[cId];
                        return (
                          <div
                            key={p.id}
                            className="px-3 py-1.5 bg-[#0D0811] border border-[#C93B5B]/60 flex items-center gap-2.5 opacity-85"
                          >
                            <div className="grayscale contrast-125">
                              <LaCriptaPixelSprite
                                characterId={cId}
                                animationState="debuff"
                                size="sm"
                              />
                            </div>
                            <div className="text-left">
                              <div className="text-[10px] font-cripta-pixel font-bold text-[#F5EFE6] uppercase">
                                {p.name}
                              </div>
                              <div className="text-[8px] font-cripta-pixel text-[#D8C6A0]/70 uppercase">
                                {cDef?.className || cId}
                              </div>
                              <div className="text-[9px] font-cripta-mono font-bold text-[#FF8FA3]">
                                0 / {p.maxHp} PV · CAÍDO
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Expedition Summary Metrics: Mazmorra, Sala, Enemigos Derrotados, Oro Obtenido */}
                  <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="p-2 bg-[#0D0914] border border-[#3E2F4B]">
                      <div className="text-[8px] font-cripta-pixel text-[#D8C6A0]/65 uppercase">
                        MAZMORRA ALCANZADA
                      </div>
                      <div className="mt-0.5 text-[11px] font-cripta-display font-bold text-[#FFD166] truncate">
                        {chosenDungeon.name}
                      </div>
                    </div>
                    <div className="p-2 bg-[#0D0914] border border-[#3E2F4B]">
                      <div className="text-[8px] font-cripta-pixel text-[#D8C6A0]/65 uppercase">
                        SALA ALCANZADA
                      </div>
                      <div className="mt-0.5 text-sm font-cripta-mono font-black text-[#E8DFCE]">
                        SALA {roomRoman} ({completedDoorCount}/3 SELLOS)
                      </div>
                    </div>
                    <div className="p-2 bg-[#0D0914] border border-[#3E2F4B]">
                      <div className="text-[8px] font-cripta-pixel text-[#D8C6A0]/65 uppercase">
                        ENEMIGOS DERROTADOS
                      </div>
                      <div className="mt-0.5 text-sm font-cripta-mono font-black text-[#FF8FA3]">
                        {expeditionState.runStats?.enemiesDefeated ?? 0}
                      </div>
                    </div>
                    <div className="p-2 bg-[#0D0914] border border-[#3E2F4B]">
                      <div className="text-[8px] font-cripta-pixel text-[#D8C6A0]/65 uppercase">
                        ORO OBTENIDO
                      </div>
                      <div className="mt-0.5 text-sm font-cripta-mono font-black text-[#FFD166]">
                        {partyGold}G
                      </div>
                    </div>
                  </div>

                  <div className="mt-1 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        laCriptaAudio.playDoorVote();
                        onRerollExpedition();
                      }}
                      className="px-5 py-2.5 bg-[#E7A54A] hover:bg-[#F3B861] text-[#09070D] font-cripta-pixel text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all shadow-[0_0_16px_rgba(231,165,74,0.35)]"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>NUEVA EXPEDICIÓN</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        laCriptaAudio.playStoneClick();
                        onReturnToLobby();
                      }}
                      className="px-5 py-2.5 bg-[#1F162B] hover:bg-[#2B1F3B] border border-[#4A3B5C] text-[#D9D0BC] font-cripta-pixel text-xs uppercase tracking-wider cursor-pointer transition-all"
                    >
                      VOLVER AL LOBBY
                    </button>
                  </div>
                </div>
              ) : hasActiveCombat ? (
                /* CASE B: ACTIVE COMBAT — SINGLE CONSOLIDATED ENEMY TURN PRESENTATION vs FALLEN PLAYER vs PLAYER CARD HAND */
                <div className="my-auto w-full flex flex-col items-center justify-center gap-3">
                  {!isPlayerPhase || Boolean(activeActingEnemyId) ? (
                    /* B1: ONE PRIMARY ENEMY TURN PRESENTATION (Sections 9, 10, 11, 12) */
                    (() => {
                      const actingEnemyId =
                        activeActingEnemyId ||
                        activeRoom.activeCombatActorId ||
                        visibleRoomEnemies[0]?.id ||
                        null;
                      const actingEnemy =
                        visibleRoomEnemies.find((e) => e.id === actingEnemyId) ||
                        visibleRoomEnemies[0] ||
                        null;
                      const sameSpecies = actingEnemy
                        ? visibleRoomEnemies.filter((e) => e.name === actingEnemy.name)
                        : [];
                      const speciesOrd =
                        actingEnemy && sameSpecies.length > 1
                          ? sameSpecies.findIndex((e) => e.id === actingEnemy.id) + 1
                          : 0;
                      const actingName = actingEnemy
                        ? speciesOrd > 0
                          ? `${actingEnemy.name} #${speciesOrd}`
                          : actingEnemy.name
                        : 'CRIATURA HOSTIL';
                      const abilityLabel =
                        actingEnemy?.preparedTelegraphLabel ||
                        actingEnemy?.abilityName ||
                        actingEnemy?.intent ||
                        'ATAQUE HOSTIL';
                      const targetIds =
                        activeTargetedPlayerIdsDuringPresentation.length > 0
                          ? activeTargetedPlayerIdsDuringPresentation
                          : actingEnemy?.lastTargetedPlayerIds ||
                            activeRoom.activeTargetedPlayerIds ||
                            [];
                      const targetNames = targetIds
                        .map(
                          (pid) =>
                            expeditionState.players.find((p) => p.id === pid)?.name
                        )
                        .filter(Boolean);
                      const targetSummary =
                        targetNames.length >= connectedPlayers.length &&
                        connectedPlayers.length > 1
                          ? 'TODO EL GRUPO'
                          : targetNames.length > 0
                          ? targetNames.join(', ')
                          : aliveOrderedPlayers[0]?.name || 'AVENTURERO';

                      const latestPlayerDmgEvents = activeVisualEvents.filter(
                        (ev) => ev.kind === 'DAMAGE_PLAYER'
                      );
                      const latestPlayerStatusEvents = activeVisualEvents.filter(
                        (ev) =>
                          ev.kind === 'STATUS_APPLIED' && ev.targetType === 'PLAYER'
                      );

                      return (
                        <div className="w-full max-w-xl bg-[#110C1A]/95 border-2 border-[#4A3B5C] px-6 py-5 text-center shadow-[0_12px_36px_rgba(0,0,0,0.85)] flex flex-col items-center gap-2.5">
                          <div className="inline-flex items-center gap-2 px-3 py-0.5 bg-[#1E142B] border border-[#E7A54A]/70 text-[10px] font-cripta-pixel font-bold text-[#FFD166] uppercase tracking-widest">
                            ◆ TURNO ENEMIGO
                          </div>

                          <div className="mt-1 font-cripta-display text-2xl sm:text-3xl font-black text-[#F5EFE6] uppercase tracking-wider">
                            {actingName}
                          </div>

                          <div className="px-3.5 py-1 bg-[#1A1124] border border-[#6B538C] font-cripta-pixel text-xs sm:text-sm font-bold text-[#FFD166] uppercase tracking-widest">
                            {abilityLabel}
                          </div>

                          <div className="mt-0.5 font-cripta-pixel text-xs sm:text-sm font-bold text-[#FF8FA3] uppercase tracking-wider flex items-center justify-center gap-2">
                            <span>→</span>
                            <span className="text-[#F5EFE6]">{targetSummary}</span>
                          </div>

                          {/* Impact & Status Resolution Readout when active during animation */}
                          {(latestPlayerDmgEvents.length > 0 ||
                            latestPlayerStatusEvents.length > 0) && (
                            <div className="mt-2 pt-2.5 border-t border-[#2D213B] w-full flex flex-col items-center gap-1.5">
                              {latestPlayerDmgEvents.map((dEv) => (
                                <div
                                  key={dEv.id}
                                  className="px-3 py-1 bg-[#2B101B] border border-[#E63956] font-cripta-mono text-sm font-black text-[#FF8FA3] uppercase tracking-wider"
                                >
                                  {dEv.label || `-${Math.abs(dEv.value || 0)} PV`}
                                </div>
                              ))}
                              {latestPlayerStatusEvents.map((sEv) => {
                                const stDef = sEv.statusType
                                  ? CRIPTA_STATUS_EFFECTS_REGISTRY[sEv.statusType]
                                  : null;
                                return (
                                  <div
                                    key={sEv.id}
                                    className="px-3 py-1 bg-[#22132C] border border-[#B57CFF] font-cripta-pixel text-[10px] font-bold text-[#E0AAFF] uppercase tracking-wider"
                                  >
                                    <div>{stDef?.name || sEv.label}</div>
                                    {sEv.sublabel && (
                                      <div className="text-[8.5px] text-[#D8C6A0]/85 mt-0.5">
                                        {sEv.sublabel}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })()
                  ) : iAmDead ? (
                    /* B2: INDIVIDUAL PLAYER DEATH / FALLEN SPECTATOR PANEL IN COMBAT */
                    <div className="w-full max-w-2xl bg-[#190C14]/95 border-2 border-[#C93B5B] p-5 text-center shadow-[0_0_32px_rgba(201,59,91,0.3)] flex flex-col items-center gap-3">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#2E101B] border border-[#C93B5B] text-[9px] font-cripta-pixel font-bold text-[#FF8FA3] uppercase tracking-widest">
                        ☠ HAS CAÍDO EN COMBATE · MODO ESPECTADOR
                      </div>
                      <div className="flex items-center gap-3">
                        {me && (
                          <div className="grayscale contrast-125">
                            <LaCriptaPixelSprite
                              characterId={
                                (me.characterId || 'caballero') as CriptaCharacterId
                              }
                              animationState="debuff"
                              size="sm"
                            />
                          </div>
                        )}
                        <div className="text-left">
                          <div className="text-sm font-cripta-display font-black text-[#F5EFE6] uppercase">
                            {me?.name || 'Aventurero'} — 0 / {me?.maxHp || 0} PV
                          </div>
                          <div className="text-[10px] font-cripta-pixel text-[#D8C6A0]/80">
                            Turno actual de:{' '}
                            <strong className="text-[#FFD166]">
                              {activeTurnPlayer?.name || 'Compañero'}
                            </strong>{' '}
                            ({currentTurnAp} AP restantes)
                          </div>
                        </div>
                      </div>
                      <p className="text-xs font-cripta-pixel text-[#D8C6A0]/85 leading-relaxed max-w-lg">
                        Tus compañeros vivos pueden revivirte al despejar la sala, en una
                        Hoguera o Santuario, o mediante Tributo Vital / Oro (20G) en la
                        barra inferior.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Helper Banner when waiting for another teammate's turn */}
                      {!isMyTurn && isPlayerPhase && (
                        <div className="px-4 py-2 bg-[#161021]/90 border border-[#4A3B5C] text-xs font-cripta-pixel text-[#D8C6A0] text-center">
                          Esperando a que{' '}
                          <strong className="text-[#FFD166]">
                            {activeTurnPlayer?.name || 'tu compañero'}
                          </strong>{' '}
                          juegue sus cartas ({currentTurnAp} AP restantes)...
                        </div>
                      )}

                      {/* TACTICAL COMBAT CARDS (Basic Attack + Guard + Weapon Special + 2 Active Class Abilities) */}
                      <div className="w-full flex flex-wrap lg:flex-nowrap items-stretch justify-center gap-2 sm:gap-2.5">
                        {/* CARD 1: BASIC WEAPON ATTACK (1 Card Per Turn) */}
                        {(() => {
                          const basicUsed = Boolean(me?.basicAttackUsedThisTurn);
                          const dmgTag = attackEst?.damageTypeLabel || 'TAJANTE';
                          const specialProp = myEquippedWeapon?.activeRune
                            ? `◆ RUNA ${myEquippedWeapon.activeRune.infusedDamageType}`
                            : attackEst?.matchupState === 'WEAKNESS'
                            ? `◆ +${attackEst.matchupDeltaPct}% vs. VULNERABLE`
                            : attackEst?.matchupState === 'RESISTANCE'
                            ? `◆ ${attackEst.matchupDeltaPct}% (RESISTE)`
                            : myWeapon?.onHitStatus
                            ? `◆ APLICA ${
                                CRIPTA_STATUS_EFFECTS_REGISTRY[myWeapon.onHitStatus]
                                  ?.name.toUpperCase() || myWeapon.onHitStatus
                              }`
                            : `◆ ESCALA ${myWeapon?.scalingStat || 'ATQ'}`;
                          return (
                            <LaCriptaPlayableCard
                              title={myWeapon ? myWeapon.name : 'Ataque Básico'}
                              categoryLabel={dmgTag}
                              costLabel="1 AP"
                              cooldownLabel={basicUsed ? '⏱ USADA' : 'LISTA'}
                              headlineValue={
                                attackEst
                                  ? `${formatDamageRange(attackEst.min, attackEst.max)} DAÑO`
                                  : '4–6 DAÑO'
                              }
                              summary={specialProp}
                              tooltipDescription={
                                myWeapon
                                  ? `Inflige ${
                                      attackEst
                                        ? formatDamageRange(attackEst.min, attackEst.max)
                                        : '4–6'
                                    } de daño ${dmgTag}. ${myWeapon.specialEffectText} Escala con ${
                                      myWeapon.scalingStat
                                    }.${
                                      myEquippedWeapon?.activeRune
                                        ? ` Runa activa: ${myEquippedWeapon.activeRune.name} (${myEquippedWeapon.activeRune.benefitText}).`
                                        : ''
                                    }`
                                  : 'Inflige daño directo con tu arma equipada.'
                              }
                              accentColor={
                                basicUsed
                                  ? 'slate'
                                  : attackEst?.matchupState === 'WEAKNESS'
                                  ? 'emerald'
                                  : 'crimson'
                              }
                              disabled={!isMyTurn || currentTurnAp < 1 || basicUsed}
                              turnLocked={isTurnActionLocked}
                              weaponId={myWeapon?.id}
                              upgradeLevel={myWeaponLv}
                              illustration={
                                <LaCriptaCombatCardArtwork
                                  artKey={resolveWeaponCombatArtKey(
                                    myWeapon?.id,
                                    false,
                                    attackEst?.damageTypeLabel
                                  )}
                                  cardId={myWeapon?.id || 'basic_attack'}
                                  weaponId={myWeapon?.id}
                                  upgradeLevel={myWeaponLv}
                                />
                              }
                              onClick={() => submitPlayerCombatChoice('ATTACK')}
                              footerBadge={
                                basicUsed
                                  ? '⏱ 1 RONDA'
                                  : getPlayerActionMechanicBadge(me, 'ATTACK') || `NV.${myWeaponLv}`
                              }
                            />
                          );
                        })()}

                        {/* CARD 2: DEFEND / GUARD (1 AP — Pure defense, never deals damage) */}
                        <LaCriptaPlayableCard
                          title="Guardia de Hierro"
                          categoryLabel="DEFENSA"
                          costLabel="1 AP"
                          cooldownLabel="LISTA"
                          headlineValue="+8 ARMADURA"
                          summary="◆ CONTRAGOLPE"
                          tooltipDescription="Otorga +4 Armadura, Escudo (+4 mitigación por 2 rondas) y restaura +5 PV. CONTRAGOLPE: +18% daño en tu próximo ataque."
                          accentColor="cyan"
                          disabled={!isMyTurn || currentTurnAp < 1}
                          turnLocked={isTurnActionLocked}
                          illustration={
                            <LaCriptaCombatCardArtwork
                              artKey="common_iron_guard"
                              cardId="guardia_de_hierro"
                            />
                          }
                          onClick={() => submitPlayerCombatChoice('DEFEND')}
                          footerBadge={
                            getPlayerActionMechanicBadge(me, 'DEFEND') || '◆ +5 PV · ESCUDO'
                          }
                        />

                        {/* CARD 3: WEAPON SPECIAL TECHNIQUE (1 AP) */}
                        {myWeapon && (
                          <LaCriptaPlayableCard
                            title={myWeapon.specialAttack?.name || 'Técnica de Arma'}
                            categoryLabel={
                              myWeapon.specialAttack?.dealsDamage === false
                                ? 'CURACIÓN'
                                : specialEst?.damageTypeLabel || 'TÉCNICA'
                            }
                            costLabel="1 AP"
                            cooldownLabel={
                              mySpecialCd > 0 ? `⏱ ${mySpecialCd}` : 'LISTA'
                            }
                            headlineValue={
                              myWeapon.specialAttack?.dealsDamage === false
                                ? `+${myWeapon.specialAttack?.partyHealBase || 14} PV`
                                : specialEst && specialEst.max > 0
                                ? `${formatDamageRange(specialEst.min, specialEst.max)} DAÑO`
                                : '7–11 DAÑO'
                            }
                            summary={
                              myWeapon.specialAttack?.dealsDamage === false
                                ? `◆ PURIFICA ${myWeapon.specialAttack?.purifyCount || 1}`
                                : myWeapon.specialAttack?.poisonStacks
                                ? `◆ VENENO ${myWeapon.specialAttack.poisonStacks}`
                                : myWeapon.specialAttack?.armorBreak
                                ? `◆ ROMPE ${myWeapon.specialAttack.armorBreak} ARM.`
                                : myWeapon.specialAttack?.vulnerableTurns
                                ? `◆ VULNERABLE ${myWeapon.specialAttack.vulnerableTurns}T`
                                : myWeapon.specialAttack?.targetRule === 'ALL_ENEMIES'
                                ? '◆ GOLPE EN ÁREA'
                                : specialEst?.matchupState === 'WEAKNESS'
                                ? `◆ +${specialEst.matchupDeltaPct}% vs. VULNERABLE`
                                : '◆ TÉCNICA DE ARMA'
                            }
                            tooltipDescription={`${
                              myWeapon.specialAttack?.description ||
                              myWeapon.specialEffectText
                            } ENFRIAMIENTO: ${
                              myWeapon.specialAttack?.cooldownRounds || 2
                            } rondas.`}
                            accentColor={
                              myWeapon.specialAttack?.dealsDamage === false ||
                              specialEst?.matchupState === 'WEAKNESS'
                                ? 'emerald'
                                : 'amber'
                            }
                            disabled={!isMyTurn || currentTurnAp < 1 || mySpecialCd > 0}
                            turnLocked={isTurnActionLocked}
                            weaponId={myWeapon.id}
                            upgradeLevel={myWeaponLv}
                            illustration={
                              <LaCriptaCombatCardArtwork
                                artKey={resolveWeaponCombatArtKey(
                                  myWeapon.id,
                                  true,
                                  specialEst?.damageTypeLabel
                                )}
                                cardId={`${myWeapon.id}_special`}
                                weaponId={myWeapon.id}
                                upgradeLevel={myWeaponLv}
                              />
                            }
                            onClick={() => submitPlayerCombatChoice('WEAPON_SPECIAL')}
                            footerBadge={
                              mySpecialCd > 0
                                ? `⏱ ${mySpecialCd} ${mySpecialCd === 1 ? 'RONDA' : 'RONDAS'}`
                                : getPlayerActionMechanicBadge(me, 'WEAPON_SPECIAL') ||
                                  `⏱ CD ${myWeapon.specialAttack?.cooldownRounds || 2}`
                            }
                          />
                        )}

                        {/* CARDS 4 & 5: ACTIVE CLASS ABILITIES (2 distinct active skills per class) */}
                        {(myCharDef?.abilities || [])
                          .filter((ab) => ab.type !== 'PASIVA')
                          .map((ab) => {
                            const abCd = me?.abilityCooldowns?.[ab.id] || 0;
                            const myRes =
                              me?.classResource ??
                              myCharDef?.classResource?.initialValue ??
                              0;
                            const minResReq =
                              ab.minResourceRequired ?? ab.resourceCost ?? 0;
                            const lacksResource = minResReq > 0 && myRes < minResReq;
                            const resLabel =
                              myCharDef?.classResource?.shortLabel ||
                              myCharDef?.classResource?.label ||
                              'REC';

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
                                ? `+${ab.healAmount || ab.power || 16} PV`
                                : `+${ab.shieldGrant || 5} ARMADURA`
                              : abEst && abEst.max > 0
                              ? `${formatDamageRange(abEst.min, abEst.max)} DAÑO`
                              : `${ab.power || 14} DAÑO`;

                            const categoryBadge = !abDealsDamage
                              ? ab.kind === 'HEAL' || ab.category === 'HEAL'
                                ? 'CURACIÓN'
                                : ab.kind === 'BUFF'
                                ? 'APOYO'
                                : 'DEFENSA'
                              : ab.targetRule === 'ALL_ENEMIES'
                              ? 'ÁREA'
                              : abEst?.damageTypeLabel || 'HABILIDAD';

                            const specialPropertyLine = !abDealsDamage
                              ? ab.purifyCount
                                ? `◆ PURIFICA ${ab.purifyCount}`
                                : ab.kind === 'HEAL' || ab.category === 'HEAL'
                                ? '◆ BENDICE GRUPO'
                                : ab.id === 'muro_de_hierro'
                                ? '◆ PROVOCA ENEMIGOS'
                                : '◆ ESCUDO GRUPAL'
                              : ab.statusToApply
                              ? `◆ ${
                                  CRIPTA_STATUS_EFFECTS_REGISTRY[ab.statusToApply]?.name.toUpperCase() ||
                                  ab.statusToApply
                                } ${ab.statusTurns || ab.statusStacks || 2}`
                              : ab.armorBreak
                              ? `◆ ROMPE ${ab.armorBreak} ARM.`
                              : ab.targetRule === 'ALL_ENEMIES'
                              ? '◆ GOLPE EN ÁREA'
                              : '◆ IMPACTO CRÍTICO';

                            const mechBadge = getPlayerActionMechanicBadge(
                              me,
                              'ABILITY',
                              ab.id
                            );

                            return (
                              <LaCriptaPlayableCard
                                key={ab.id}
                                title={ab.name}
                                categoryLabel={categoryBadge}
                                costLabel="1 AP"
                                cooldownLabel={
                                  abCd > 0
                                    ? `⏱ ${abCd}`
                                    : lacksResource
                                    ? `REQ. ${minResReq} ${resLabel}`
                                    : 'LISTA'
                                }
                                headlineValue={headline}
                                summary={specialPropertyLine}
                                tooltipDescription={`${ab.description} ENFRIAMIENTO: ${
                                  ab.cooldownTurns || 2
                                } rondas.`}
                                accentColor={
                                  !abDealsDamage
                                    ? ab.kind === 'HEAL'
                                      ? 'emerald'
                                      : 'cyan'
                                    : 'purple'
                                }
                                disabled={
                                  !isMyTurn ||
                                  currentTurnAp < 1 ||
                                  abCd > 0 ||
                                  lacksResource
                                }
                                turnLocked={isTurnActionLocked}
                                illustration={
                                  <LaCriptaCombatCardArtwork
                                    artKey={ab.artKey || ab.id}
                                    cardId={ab.id}
                                  />
                                }
                                onClick={() =>
                                  submitPlayerCombatChoice('ABILITY', undefined, ab.id)
                                }
                                footerBadge={
                                  abCd > 0
                                    ? `⏱ ${abCd} ${abCd === 1 ? 'RONDA' : 'RONDAS'}`
                                    : lacksResource
                                    ? `FALTA ${resLabel} (${myRes}/${minResReq})`
                                    : mechBadge || `⏱ CD ${ab.cooldownTurns || 2}`
                                }
                              />
                            );
                          })}
                      </div>
                    </>
                  )}

                  {/* Secondary Bottom Strip under Combat Cards: Universal 9-Class Mechanic Bar + Weapon Identity + Rune Switcher + MOCHILA */}
                  <div className="mt-2 flex flex-wrap items-center justify-center gap-2.5">
                    {(() => {
                      const mechHud = getPlayerClassMechanicHudState(me);
                      const mechDef = getClassMechanicForCharacter(me?.characterId);
                      if (!mechHud || !mechDef) return null;
                      return (
                        <LaCriptaPixelTooltip
                          title={`${mechHud.iconSymbol} ${mechDef.name} (${mechHud.current}/${mechHud.max})`}
                          category={`MECÁNICA ÚNICA · ${myCharDef?.className || ''}`}
                          description={`${mechDef.shortDescription} | CÓMO GANAR: ${mechDef.howToGain} | CÓMO USAR: ${mechDef.howToSpendOrTrigger}`}
                          footerLabel={`${mechHud.stateBadge} · ${mechHud.bonusSummary}`}
                          borderColor={mechHud.colorHex}
                        >
                          <div
                            className="px-2.5 py-1.5 bg-[#120C1C] border flex items-center gap-2 cursor-help"
                            style={{ borderColor: mechHud.colorHex }}
                          >
                            <span
                              className="text-[9px] font-cripta-pixel font-bold uppercase tracking-wider"
                              style={{ color: mechHud.colorHex }}
                            >
                              {mechHud.iconSymbol} {mechHud.label}:
                            </span>
                            <span
                              className="font-cripta-mono text-[11px] font-black"
                              style={{ color: mechHud.colorHex }}
                            >
                              {mechHud.pipsText}
                            </span>
                            <span className="text-[8px] font-cripta-pixel text-[#FFD166]">
                              {mechHud.stateBadge} · {mechHud.bonusSummary}
                            </span>
                          </div>
                        </LaCriptaPixelTooltip>
                      );
                    })()}
                    {myEquippedWeapon && (
                      <div className="px-2.5 py-1.5 bg-[#120D1A] border border-[#3E2F4B] flex flex-wrap items-center gap-2">
                        <span className="text-[8px] font-cripta-pixel text-[#D8C6A0]/70 uppercase">
                          ARMA:
                        </span>
                        <LaCriptaDamageTypeBadge
                          damageType={myEquippedWeapon.activeDamageType}
                          secondaryType={myEquippedWeapon.secondaryDamageType}
                          compact
                        />
                        {(me?.ownedWeaponRunes || []).length > 0 && onEquipWeaponRune && (
                          <div className="flex items-center gap-1 pl-1.5 border-l border-[#2E223D]">
                            <span className="text-[8px] font-cripta-pixel text-[#B57CFF] uppercase">
                              RUNAS:
                            </span>
                            {(me?.ownedWeaponRunes || []).map((rId) => {
                              const rDef = CRIPTA_WEAPON_RUNES_REGISTRY[rId];
                              if (!rDef) return null;
                              const isEquippedRune = me?.equippedWeaponRuneId === rId;
                              return (
                                <button
                                  key={rId}
                                  type="button"
                                  onClick={() => {
                                    laCriptaAudio.playDoorVote();
                                    onEquipWeaponRune(isEquippedRune ? null : rId);
                                  }}
                                  title={`${rDef.name}\n✦ ${rDef.benefitText}\n⚠ ${rDef.tradeoffText}`}
                                  className={`px-1.5 py-0.5 border flex items-center gap-1 text-[8px] font-cripta-pixel cursor-pointer transition-all ${
                                    isEquippedRune
                                      ? 'bg-[#26193A] border-[#FFD166] text-[#FFD166] font-bold'
                                      : 'bg-[#171122] hover:bg-[#221933] border-[#4A3B5C] text-[#D9D0BC]'
                                  }`}
                                >
                                  <LaCriptaWeaponRunePixelIcon runeId={rId} size={13} />
                                  <span>{rDef.infusedDamageType}</span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
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
                <div className="my-auto w-full flex flex-col items-center justify-center gap-2.5 pb-4">
                  {/* Narrative Prompt / Resolution Banner */}
                  <div className="max-w-3xl w-full bg-[#140E1D]/95 border border-[#3E2F4B] px-3.5 py-2 text-center">
                    <p className="text-xs sm:text-[13px] font-cripta-pixel text-[#E8DFCE] leading-snug">
                      {activeRoom.outcomeLog ||
                        activeRoom.narrative ||
                        activeRoom.subtitle}
                    </p>
                  </div>

                  {/* UNCLAIMED PHYSICAL DROPS AS PLAYABLE LOOT CARDS WITH 60 FPS CLAIM FEEDBACK */}
                  {unclaimedDrops.length > 0 && onClaimGroundDrop && (
                    <div className="w-full flex flex-col items-center gap-2">
                      <div className="text-[10px] font-cripta-pixel font-bold text-[#FFD166] uppercase tracking-widest animate-pulse">
                        ✦ RECOMPENSAS DE LA CÁMARA · HAZ CLIC PARA RECLAMAR ✦
                      </div>
                      <div className="flex flex-wrap items-stretch justify-center gap-3">
                        {unclaimedDrops.map((drop) => {
                          const resolvedDropId = drop.dropId || drop.id;
                          const itemDef = drop.itemId
                            ? CRIPTA_ITEMS_REGISTRY[drop.itemId]
                            : undefined;
                          const relicDef = drop.relicId
                            ? CRIPTA_RELICS_REGISTRY[drop.relicId]
                            : undefined;
                          const weaponDef = drop.weaponId
                            ? CRIPTA_WEAPONS_REGISTRY[drop.weaponId]
                            : undefined;
                          const runeDef = drop.weaponRuneId
                            ? CRIPTA_WEAPON_RUNES_REGISTRY[drop.weaponRuneId]
                            : undefined;
                          const resolvedTitle =
                            drop.label ||
                            itemDef?.name ||
                            relicDef?.name ||
                            weaponDef?.name ||
                            runeDef?.name ||
                            'Botín de la Cámara';
                          const resolvedSummary =
                            itemDef?.description ||
                            relicDef?.description ||
                            (weaponDef
                              ? `${weaponDef.baseMinDamage}–${weaponDef.baseMaxDamage} DAÑO · ${weaponDef.specialEffectText}`
                              : undefined) ||
                            (runeDef
                              ? `${runeDef.benefitText} · ${runeDef.tradeoffText}`
                              : undefined) ||
                            (drop.type === 'GOLD_POUCH' && drop.goldAmount
                              ? `Bolsa con +${drop.goldAmount} de oro para el grupo.`
                              : `Botín hallado en la cámara: ${resolvedTitle}.`);
                          const resolvedRarity =
                            relicDef?.rarity ||
                            runeDef?.rarity ||
                            (weaponDef
                              ? 'ARMA FORJADA'
                              : drop.type === 'RELIC_PEDESTAL' || drop.kind === 'RELIC'
                              ? 'RELIQUIA'
                              : drop.type === 'GOLD_POUCH' || drop.kind === 'GOLD'
                              ? 'ORO'
                              : 'CONSUMIBLE');
                          const isClaimingThis = Boolean(claimingDropIds[resolvedDropId]);
                          const dropComparison = getEquipmentComparison({
                            weaponId: drop.weaponId,
                            weaponRuneId: drop.weaponRuneId,
                          });

                          return (
                            <div
                              key={resolvedDropId}
                              className={`transition-all duration-300 ${
                                isClaimingThis
                                  ? 'scale-75 -translate-y-8 opacity-0 pointer-events-none'
                                  : 'scale-100 opacity-100'
                              }`}
                            >
                              <LaCriptaPlayableCard
                                title={resolvedTitle}
                                categoryLabel={
                                  drop.weaponRuneId
                                    ? `RUNA DE ARMA · ${runeDef?.infusedDamageType || 'INFUSIÓN'}`
                                    : weaponDef
                                    ? `ARMA · ${weaponDef.baseMinDamage}–${weaponDef.baseMaxDamage} DAÑO`
                                    : drop.type === 'GOLD_POUCH' || drop.kind === 'GOLD'
                                    ? 'BOTÍN DE ORO'
                                    : drop.type === 'RELIC_PEDESTAL' || drop.kind === 'RELIC'
                                    ? 'RELIQUIA ANCESTRAL'
                                    : 'OBJETO DE CRIPTA'
                                }
                                costLabel="RECLAMAR"
                                cooldownLabel={resolvedRarity}
                                summary={resolvedSummary}
                                tooltipDescription={
                                  dropComparison.detailTooltip || resolvedSummary
                                }
                                comparisonBadge={dropComparison.badge}
                                comparisonTone={dropComparison.tone}
                                accentColor={
                                  drop.weaponRuneId ||
                                  drop.type === 'RELIC_PEDESTAL' ||
                                  drop.kind === 'RELIC'
                                    ? 'purple'
                                    : weaponDef
                                    ? 'crimson'
                                    : drop.type === 'GOLD_POUCH' || drop.kind === 'GOLD'
                                    ? 'amber'
                                    : 'emerald'
                                }
                                itemId={drop.itemId}
                                relicId={drop.relicId}
                                weaponId={drop.weaponId}
                                illustration={
                                  drop.weaponRuneId ? (
                                    <div className="flex items-center justify-center py-2">
                                      <LaCriptaWeaponRunePixelIcon
                                        runeId={drop.weaponRuneId}
                                        size={46}
                                      />
                                    </div>
                                  ) : (
                                    <LaCriptaCardPixelIllustration
                                      kind={weaponDef ? 'WEAPON_TECHNIQUE' : 'TREASURE_CHEST'}
                                      itemId={drop.itemId}
                                      relicId={drop.relicId}
                                      weaponId={drop.weaponId}
                                    />
                                  )
                                }
                                onClick={() => {
                                  laCriptaAudio.playDoorVote();
                                  setClaimingDropIds((prev) => ({
                                    ...prev,
                                    [resolvedDropId]: true,
                                  }));
                                  onClaimGroundDrop(resolvedDropId);
                                }}
                                footerBadge="✦ RECLAMAR BOTÍN"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* SHOP ROOM: LARGE PLAYABLE MERCHANT CARDS + DYNAMIC REROLL */}
                  {activeRoom.type === 'SHOP' && (
                    <div className="w-full flex flex-col items-center gap-2.5">
                      <div className="w-full flex flex-wrap items-stretch justify-center gap-3">
                        {(activeRoom.shopSlots && activeRoom.shopSlots.length > 0
                          ? activeRoom.shopSlots
                          : activeRoom.shopInventory || []
                        ).map((slot) => {
                          const slotKey = slot.slotId || slot.id;
                          const isSold = Boolean(slot.sold || slot.soldOut);
                          const displayPrice = slot.priceGold;
                          const canAfford = partyGold >= displayPrice && !isSold;
                          const shopComparison = getEquipmentComparison({
                            weaponId: slot.weaponId,
                            armorId: slot.armorId,
                            accessoryId: slot.accessoryId,
                            weaponRuneId: slot.weaponRuneId,
                            isForgeUpgrade: slot.kind === 'FORGE_UPGRADE',
                          });

                          return (
                            <LaCriptaPlayableCard
                              key={slotKey}
                              title={slot.name || 'Mercancía'}
                              categoryLabel={`MERCADER · ${slot.category || slot.kind}`}
                              costLabel={isSold ? 'AGOTADO' : `${displayPrice} ORO`}
                              cooldownLabel={slot.rarity || 'COMÚN'}
                              summary={slot.description || 'Artículo del mercader errante.'}
                              tooltipDescription={
                                shopComparison.detailTooltip ||
                                slot.description ||
                                'Artículo del mercader errante.'
                              }
                              comparisonBadge={shopComparison.badge}
                              comparisonTone={shopComparison.tone}
                              accentColor={
                                isSold
                                  ? 'slate'
                                  : slot.kind === 'RELIC' || slot.kind === 'WEAPON_RUNE'
                                  ? 'purple'
                                  : slot.kind === 'WEAPON'
                                  ? 'crimson'
                                  : 'amber'
                              }
                              disabled={isSold || !canAfford || iAmDead}
                              itemId={slot.itemId}
                              relicId={slot.relicId}
                              weaponId={slot.weaponId}
                              armorId={slot.armorId}
                              accessoryId={slot.accessoryId}
                              illustration={
                                slot.kind === 'WEAPON_RUNE' && slot.weaponRuneId ? (
                                  <div className="flex items-center justify-center py-2">
                                    <LaCriptaWeaponRunePixelIcon
                                      runeId={slot.weaponRuneId}
                                      size={46}
                                    />
                                  </div>
                                ) : slot.kind === 'FORGE_UPGRADE' ? (
                                  <LaCriptaContextualDecisionArt
                                    biomeId={chosenDungeon.id}
                                    roomType="FORGE"
                                    cardTitle="FORJAR Y MEJORAR ARMA"
                                    equippedWeaponId={me?.equippedWeaponId}
                                    equippedWeaponLevel={myWeaponLv}
                                  />
                                ) : (
                                  <LaCriptaCardPixelIllustration
                                    kind={
                                      slot.kind === 'WEAPON'
                                        ? 'WEAPON_TECHNIQUE'
                                        : 'SHOP_MERCHANT'
                                    }
                                    itemId={slot.itemId}
                                    relicId={slot.relicId}
                                    weaponId={slot.weaponId}
                                    armorId={slot.armorId}
                                    accessoryId={slot.accessoryId}
                                  />
                                )
                              }
                              onClick={() => {
                                if (onBuyShopSlot && !isSold && canAfford) {
                                  laCriptaAudio.playDoorVote();
                                  onBuyShopSlot(slot.id || slotKey);
                                }
                              }}
                              footerBadge={
                                isSold
                                  ? slot.buyerName
                                    ? `VENDIDO A ${slot.buyerName.toUpperCase()}`
                                    : 'VENDIDO'
                                  : canAfford
                                  ? 'COMPRAR AHORA'
                                  : 'ORO INSUFICIENTE'
                              }
                            />
                          );
                        })}
                      </div>

                      {/* Shop Reroll & Non-Blocking Exit Action Bar */}
                      <div className="mt-1 flex flex-wrap items-center justify-center gap-2.5">
                        {onBuyShopSlot &&
                          (() => {
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
                                  RENOVAR MERCANCÍA ({rerollCost} ORO)
                                </span>
                              </button>
                            );
                          })()}

                        <button
                          type="button"
                          onClick={() => {
                            laCriptaAudio.playDoorVote();
                            onAdvanceRoom();
                          }}
                          className="px-4 py-2 bg-[#15281E] hover:bg-[#1E3B2C] border border-[#5EA87A] text-[10px] font-cripta-pixel font-bold text-[#8EE6AE] uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all shadow-[0_0_12px_rgba(94,168,122,0.2)]"
                        >
                          <ArrowRight className="w-3.5 h-3.5 text-[#8EE6AE]" />
                          <span>SALIR SIN COMPRAR · CONTINUAR</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* INTERACTIVE MINIGAME ROOMS (ALL 10 COOPERATIVE / SOLO MINIGAME FAMILIES) */}
                  {!activeRoom.resolved &&
                    activeRoom.minigame &&
                    !activeRoom.minigame.completed && (
                      <LaCriptaMinigameControlBoard
                        room={activeRoom}
                        dungeon={chosenDungeon}
                        minigame={activeRoom.minigame}
                        players={expeditionState.players}
                        currentPlayerId={currentPlayerId}
                        partyGold={partyGold}
                        iAmDead={iAmDead}
                        onPuzzleInput={(code) => {
                          if (onPuzzleInput && !iAmDead) {
                            onPuzzleInput(code);
                          }
                        }}
                      />
                    )}

                  {/* INTERACTIVE ROOM OPTIONS + PROGRESSION DOOR CARD IN RESPONSIVE FITTING ROW */}
                  {((!activeRoom.resolved &&
                    activeRoom.options &&
                    activeRoom.options.length > 0) ||
                    (canAdvance && onAdvanceRoom)) && (
                    <div className="w-full flex flex-wrap items-stretch justify-center gap-2.5 sm:gap-3">
                      {!activeRoom.resolved &&
                        activeRoom.options &&
                        activeRoom.options.map((opt, idx) => {
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
                            : opt.riskLabel || opt.subtitle || 'DECISIÓN';
                          const resolvedSummary =
                            opt.effectText ||
                            opt.subtitle ||
                            'Ejecutar esta decisión en la cámara.';

                          const optionVoters = expeditionState.players
                            .filter(
                              (p) =>
                                p.isConnected &&
                                activeRoom.optionVotes?.[p.id] === opt.id
                            )
                            .map((p) => ({
                              id: p.id,
                              name: p.name,
                              color: '#FFD166',
                            }));
                          const isMyVotedOption =
                            Boolean(currentPlayerId) &&
                            activeRoom.optionVotes?.[currentPlayerId] === opt.id;

                          return (
                            <LaCriptaPlayableCard
                              key={opt.id}
                              title={opt.label}
                              categoryLabel={`DECISIÓN · ${
                                ROOM_TYPE_LABELS[activeRoom.type] || 'EVENTO'
                              }`}
                              costLabel={resolvedCostLabel}
                              cooldownLabel={
                                opt.ownershipScope
                                  ? `${opt.ownershipScope} · OPCIÓN ${idx + 1}`
                                  : `OPCIÓN ${idx + 1}`
                              }
                              summary={resolvedSummary}
                              accentColor={accent}
                              selected={isMyVotedOption}
                              voterBadges={optionVoters}
                              disabled={
                                iAmDead ||
                                (hasGoldCost &&
                                  partyGold < (opt.costGold || 0))
                              }
                              illustration={
                                <LaCriptaContextualDecisionArt
                                  biomeId={chosenDungeon.id}
                                  roomType={activeRoom.type}
                                  option={opt}
                                  cardTitle={opt.label}
                                  equippedWeaponId={me?.equippedWeaponId}
                                  equippedWeaponLevel={myWeaponLv}
                                />
                              }
                              onClick={() => {
                                if (onInteractOption && !iAmDead) {
                                  laCriptaAudio.playDoorVote();
                                  onInteractOption(opt.id);
                                }
                              }}
                              footerBadge={
                                isMyVotedOption
                                  ? '✓ VOTO REGISTRADO'
                                  : 'ELEGIR DESTINO'
                              }
                            />
                          );
                        })}

                      {/* Weapon Forge Upgrade Card if available in REST / WEAPON_UPGRADE */}
                      {!activeRoom.resolved &&
                        activeRoom.options &&
                        activeRoom.options.length > 0 &&
                        canForgeUpgradeHere &&
                        myWeapon &&
                        onUpgradeWeapon && (
                          <LaCriptaPlayableCard
                            title={`Forjar ${myWeapon.name}`}
                            categoryLabel="YUNQUE DE FORJA"
                            costLabel={`${forgeUpgradeCost} ORO`}
                            cooldownLabel={`NV.${myWeaponLv} → NV.${myWeaponLv + 1}`}
                            summary="Templa tu arma en las brasas para aumentar permanentemente su daño base y técnica."
                            accentColor="amber"
                            disabled={partyGold < forgeUpgradeCost || iAmDead}
                            illustration={
                              <LaCriptaContextualDecisionArt
                                biomeId={chosenDungeon.id}
                                roomType="FORGE"
                                cardTitle={`FORJAR Y MEJORAR ARMA ${myWeapon.name}`}
                                equippedWeaponId={me?.equippedWeaponId}
                                equippedWeaponLevel={myWeaponLv}
                              />
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

                      {/* Secret Room Discovery Card if available */}
                      {canAdvance &&
                        onAdvanceRoom &&
                        activeRoom.hasSecretEntrance &&
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
                              <LaCriptaContextualDecisionArt
                                biomeId={chosenDungeon.id}
                                roomType="SECRET"
                                cardTitle="INVESTIGAR GRIETA RÚNICA"
                                equippedWeaponId={me?.equippedWeaponId}
                                equippedWeaponLevel={myWeaponLv}
                              />
                            }
                            onClick={() => {
                              laCriptaAudio.playDoorVote();
                              onDiscoverSecret();
                            }}
                            footerBadge="DESCUBRIR CÁMARA"
                          />
                        )}

                      {/* Primary Advance / Cross Giant Door Card */}
                      {canAdvance && onAdvanceRoom && (
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
                              : 'Las pesadas hojas de piedra se abrirán ante el grupo para cruzar hacia la siguiente cámara.'
                          }
                          accentColor="amber"
                          selected={iAmReadyToAdvance}
                          voterBadges={expeditionState.players
                            .filter(
                              (p) => p.isConnected && readyPlayerIds.includes(p.id)
                            )
                            .map((p) => ({
                              id: p.id,
                              name: p.name,
                              color: '#FFD166',
                            }))}
                          illustration={
                            <LaCriptaDoorCardIllustration
                              dungeon={chosenDungeon}
                              isReadyOrSelected={iAmReadyToAdvance}
                            />
                          }
                          onClick={() => {
                            laCriptaAudio.playDoorVote();
                            if (unclaimedDrops.length > 0 && onClaimGroundDrop) {
                              unclaimedDrops.forEach((d) =>
                                onClaimGroundDrop(d.dropId || d.id)
                              );
                            }
                            onAdvanceRoom();
                          }}
                          footerBadge={
                            iAmReadyToAdvance
                              ? '✓ ESPERANDO GRUPO'
                              : unclaimedDrops.length > 0
                              ? 'RECLAMAR Y AVANZAR →'
                              : 'CRUZAR PUERTA →'
                          }
                        />
                      )}
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
              onEquipWeaponRune={onEquipWeaponRune}
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
    expeditionState.phase === 'FINAL_BOSS_DOOR_READY' ||
    expeditionState.phase === 'FINAL_BOSS_ENTRANCE'
  ) {
    const canonicalCompletedIds =
      Array.isArray(expeditionState.completedDungeonIds) &&
      expeditionState.completedDungeonIds.length > 0
        ? expeditionState.completedDungeonIds
        : Array.isArray(expeditionState.completedBiomes) &&
          expeditionState.completedBiomes.length > 0
        ? expeditionState.completedBiomes
        : [];
    return (
      <div className="relative z-10 flex-1 min-h-0 w-full h-full px-3 sm:px-6 py-2 flex flex-col justify-center gap-2 select-none overflow-y-auto">
        <LaCriptaGiantDoorTransition
          transition={expeditionState.roomDoorTransition}
        />
        <div className="flex justify-center">
          <LaCriptaDoorCounterBadge completedDoorCount={3} />
        </div>
        <LaCriptaFinalBossDoorScene
          completedDungeonIds={canonicalCompletedIds}
          completedBiomes={canonicalCompletedIds}
          finalBossDoorVotes={expeditionState.finalBossDoorVotes || {}}
          players={expeditionState.players || []}
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
    <div className="relative z-10 flex-1 min-h-0 w-full h-full max-w-6xl mx-auto px-3 sm:px-6 pt-3 sm:pt-5 pb-2 flex flex-col justify-start gap-2.5 sm:gap-3.5 select-none overflow-y-auto">
      <LaCriptaGiantDoorTransition
        transition={expeditionState.roomDoorTransition}
      />

      {/* Returning-to-Doors Celebration Banner */}
      {isReturningToDoors && (
        <div className="mx-auto px-5 py-1.5 bg-[#1F1529] border-2 border-[#FFD166] text-center shadow-[0_0_28px_rgba(231,165,74,0.45)]">
          <div className="text-xs sm:text-sm font-cripta-display font-black text-[#FFD166] tracking-widest uppercase">
            ✦ PUERTA {completedDoorCount} / 3 SUPERADA ✦
          </div>
          <div className="text-[10px] font-cripta-pixel text-[#D9D0BC]">
            Nuevos sellos ancestrales emergen en la cámara...
          </div>
        </div>
      )}

      {/* Top Title Header — Fixed height so hovering a door NEVER changes layout or pushes doors down */}
      <header className="text-center shrink-0">
        <h1 className="font-cripta-display text-2xl sm:text-3xl md:text-4xl font-black tracking-widest text-[#D8C6A0] uppercase leading-tight">
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

        {/* Fixed 24px subtitle slot — always rendered in both solo & multiplayer so doors never shift on hover */}
        <div className="mt-1 h-[24px] flex items-center justify-center overflow-hidden">
          {openingDungeonDef ? (
            <p
              className="text-xs font-cripta-pixel tracking-wider uppercase animate-pulse truncate"
              style={{ color: openingDungeonDef.palette.highlight }}
            >
              ✦ LOS CERROJOS CEDEN · EL GRUPO CRUZA EL UMBRAL ✦
            </p>
          ) : hoveredDoorId && CRIPTA_DUNGEONS_REGISTRY[hoveredDoorId] ? (
            <p
              className="text-xs font-cripta-pixel tracking-wider uppercase transition-colors duration-300 truncate"
              style={{ color: CRIPTA_DUNGEONS_REGISTRY[hoveredDoorId].palette.highlight }}
            >
              ✦ {CRIPTA_DUNGEONS_REGISTRY[hoveredDoorId].name} ·{' '}
              {CRIPTA_DUNGEONS_REGISTRY[hoveredDoorId].artTheme.hoverPrompt ||
                CRIPTA_DUNGEONS_REGISTRY[hoveredDoorId].subtitle}{' '}
              ✦
            </p>
          ) : !isSolo && !expeditionState.voteTieWarning ? (
            <p className="text-xs font-cripta-pixel text-[#D8C6A0]/65 tracking-wider truncate">
              VOTOS DEL GRUPO: {Object.keys(expeditionState.doorVotes).length} /{' '}
              {totalConnected}
            </p>
          ) : (
            <p className="text-xs font-cripta-pixel text-[#D8C6A0]/60 tracking-wider uppercase truncate">
              ✦ INSPECCIONA LOS TRES UMBRALES Y ELIGE TU CAMINO ✦
            </p>
          )}
        </div>

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

      {/* THREE ARCHITECTURAL DOORS SIDE-BY-SIDE (STRICT ZERO-MOVEMENT HOVER ARCHITECTURE) */}
      <section className="relative max-w-5xl mx-auto w-full pt-2 shrink-0">
        {/* Continuous Stone Threshold Floor Line shared by all 3 doors */}
        <div
          className="pointer-events-none absolute left-2 right-2 top-[233px] sm:top-[276px] lg:top-[310px] h-[3px] z-0"
          style={{
            background:
              'linear-gradient(90deg, transparent 0%, rgba(216,198,160,0.28) 12%, rgba(231,165,74,0.45) 50%, rgba(216,198,160,0.28) 88%, transparent 100%)',
          }}
        />

        <div className="grid grid-cols-3 gap-2.5 sm:gap-6 md:gap-8 items-start w-full relative z-10">
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
                data-hovered={isHovered ? 'true' : 'false'}
                data-selected={isVotedByMe ? 'true' : 'false'}
                onMouseEnter={(e) => {
                  const slotEl = e.currentTarget;
                  const labelEl = slotEl.querySelector('.dungeonDoorLabel');
                  const beforeSlotRect = slotEl.getBoundingClientRect();
                  const beforeLabelRect = labelEl?.getBoundingClientRect();
                  setHoveredDoorId(dungeonId);
                  if (!isOpeningPhase) {
                    laCriptaAudio.playDoorHover();
                  }
                  if (import.meta.env.DEV) {
                    window.requestAnimationFrame(() => {
                      const afterSlotRect = slotEl.getBoundingClientRect();
                      const afterLabelRect = labelEl?.getBoundingClientRect();
                      if (
                        Math.abs(afterSlotRect.y - beforeSlotRect.y) > 0.5 ||
                        (beforeLabelRect &&
                          afterLabelRect &&
                          Math.abs(afterLabelRect.y - beforeLabelRect.y) > 0.5)
                      ) {
                        console.warn('Door hover layout shift detected', {
                          beforeSlotRect,
                          afterSlotRect,
                        });
                      }
                    });
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
                className={`dungeonDoorSlot dungeonDoorOption group relative h-[325px] sm:h-[368px] lg:h-[402px] flex flex-col items-center outline-none ${
                  isDimmedOtherDoor
                    ? 'opacity-15 pointer-events-none'
                    : isThisDoorOpening
                    ? 'z-30'
                    : 'cursor-pointer'
                }`}
              >
                {/* Fixed Door Visual Frame — All 3 doors share identical fixed height & bottom=0 anchor */}
                <div className="dungeonDoorVisualFrame relative w-full h-[225px] sm:h-[268px] lg:h-[302px] shrink-0">
                  <div
                    className="dungeonDoorVisual absolute inset-0 flex items-end justify-center"
                    style={{
                      filter:
                        isThisDoorOpening
                          ? `drop-shadow(0 0 42px ${dungeon.palette.glow})`
                          : isVotedByMe || voters.length > 0
                          ? `drop-shadow(0 0 18px ${dungeon.palette.glow}77)`
                          : isHovered
                          ? `drop-shadow(0 0 14px ${dungeon.palette.highlight}66)`
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
                        className="pointer-events-none absolute inset-x-[22%] top-[21%] bottom-[8%] flex flex-col items-center justify-end pb-3 animate-pulse z-30"
                        style={{
                          background: `radial-gradient(ellipse at 50% 55%, ${dungeon.palette.highlight}99 0%, ${dungeon.palette.glow}66 45%, rgba(8,6,12,0.92) 90%)`,
                          boxShadow: `inset 0 0 34px ${dungeon.palette.glow}, 0 0 36px ${dungeon.palette.highlight}66`,
                        }}
                      >
                        <span
                          className="px-2.5 py-0.5 bg-[#09070D]/95 border text-[9px] font-cripta-pixel font-bold uppercase tracking-widest shadow-lg"
                          style={{
                            borderColor: dungeon.palette.highlight,
                            color: dungeon.palette.highlight,
                          }}
                        >
                          ✦ UMBRAL ABIERTO ✦
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Fixed-Height Label Block Directly Beneath the Door — Never transforms or shifts */}
                <div className="dungeonDoorLabel mt-3 w-full h-[88px] shrink-0 flex flex-col items-center justify-start text-center px-1 overflow-hidden">
                  <h2
                    className="font-cripta-display text-sm sm:text-lg md:text-xl font-bold tracking-wide transition-colors leading-tight line-clamp-1"
                    style={{
                      color:
                        isThisDoorOpening || isVotedByMe || isHovered
                          ? dungeon.palette.highlight
                          : '#D9D0BC',
                    }}
                  >
                    {dungeon.name}
                  </h2>
                  <div className="text-[9px] font-cripta-pixel text-[#D8C6A0]/70 uppercase tracking-wider mt-0.5 line-clamp-1">
                    {dungeon.biomeTag}
                  </div>

                  {/* Compact Player Selection Indicators */}
                  <div className="mt-1.5 h-[22px] flex flex-wrap items-center justify-center gap-1.5">
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
        </div>
      </section>

      {/* 60 FPS DUNGEON ENTRY CINEMATIC OVERLAY BANNER */}
      {openingDungeonDef && (
        <div
          className="pointer-events-none mx-auto max-w-xl w-full px-5 py-2.5 bg-[#0C0913]/95 border-2 text-center transition-all duration-500"
          style={{
            borderColor: openingDungeonDef.palette.highlight,
            boxShadow: `0 0 36px ${openingDungeonDef.palette.glow}66, inset 0 0 22px ${openingDungeonDef.palette.glow}33`,
          }}
        >
          <div
            className="text-[10px] font-cripta-pixel uppercase tracking-[0.25em] font-bold"
            style={{ color: openingDungeonDef.palette.highlight }}
          >
            ✦ DESCENDIENDO AL UMBRAL · {openingDungeonDef.biomeTag} ✦
          </div>
          <div className="mt-0.5 text-xs font-cripta-body text-[#E8DFCE]/90 italic">
            «{openingDungeonDef.atmosphereHint}»
          </div>
        </div>
      )}
    </div>
  );
};
