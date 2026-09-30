import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Compass,
  RotateCcw,
  Shield,
  Sparkles,
  Swords,
  Trophy,
} from 'lucide-react';
import {
  CriptaDungeonDefinition,
  CriptaDungeonId,
  CriptaExpeditionState,
  CriptaVisualEvent,
} from '../../types/laCripta';
import {
  CRIPTA_CHARACTERS_CATALOG,
  CRIPTA_DUNGEONS_REGISTRY,
} from '../../data/la-cripta/criptaCatalog';
import {
  CRIPTA_CONSUMABLES_BY_ID,
  CRIPTA_RELICS_BY_ID,
  RARITY_BADGE_COLORS,
} from '../../data/la-cripta/criptaItemsAndRelics';
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
  LaCriptaRelicPixelIcon,
} from './LaCriptaItemRelicArt';
import {
  LaCriptaFinalBossDoorScene,
  LaCriptaFinalBossRoomArt,
} from './LaCriptaFinalBossComponents';
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
  onReviveAlly,
  onInteractOption,
  onPuzzleInput,
  onDiscoverSecret,
  onAdvanceRoom,
  onClaimGroundDrop,
  onShopBuyItem,
  onShopBuyRelic,
  onSelectedEnemyChange,
  onReturnToLobby,
  onRerollExpedition,
}) => {
  const [hoveredDoorId, setHoveredDoorId] = useState<CriptaDungeonId | null>(null);
  const [selectedEnemyId, setSelectedEnemyId] = useState<string | null>(null);

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

    const iAmDead = Boolean(
      me?.isDead || (me?.characterId && (me?.maxHp || 0) > 0 && (me?.hp || 0) <= 0)
    );
    const fallenPlayers = expeditionState.players.filter(
      (p) => p.isConnected && (p.isDead || (p.characterId && p.maxHp > 0 && p.hp <= 0))
    );
    const aliveOrderedPlayers = [...expeditionState.players]
      .filter((p) => p.isConnected && !p.isDead && p.hp > 0)
      .sort((a, b) => a.seatIndex - b.seatIndex);

    const activeTurnPlayerId =
      activeRoom.activeTurnPlayerId &&
      aliveOrderedPlayers.some((p) => p.id === activeRoom.activeTurnPlayerId)
        ? activeRoom.activeTurnPlayerId
        : aliveOrderedPlayers[0]?.id || null;
    const activeTurnPlayer =
      aliveOrderedPlayers.find((p) => p.id === activeTurnPlayerId) || null;
    const isMyTurn = Boolean(
      !iAmDead && (isSolo || !activeTurnPlayerId || activeTurnPlayerId === currentPlayerId)
    );
    const actedIds = activeRoom.actedPlayerIdsThisRound || [];

    // Events displayed in the central room stage (non-targeted room rewards, gold, loot, secrets)
    const roomCenterEvents = activeVisualEvents.filter(
      (ev) => ev.targetType === 'ROOM' || ev.targetType === 'PARTY'
    );
    const roomCenterVfxEvent = [...roomCenterEvents]
      .reverse()
      .find((ev) => Boolean(ev.vfxStyle));

    const myBonusAtk = me?.bonusAttack || 0;
    const myBonusMag = me?.bonusMagic || 0;
    const myBonusDef = me?.bonusDefense || 0;
    const estimatedAttackDmg = (myCharDef?.stats?.attack || 6) + myBonusAtk;
    const estimatedMagicPower = (myCharDef?.stats?.magic || 6) + myBonusMag;

    const isDefeated = Boolean(expeditionState.expeditionDefeated);

    const canAdvance =
      !isDefeated &&
      !isFinalBossCombat &&
      (activeRoom.resolved ||
        activeRoom.type === 'SHOP' ||
        activeRoom.type === 'REST' ||
        activeRoom.type === 'LOOT');

    const readyPlayerIds = activeRoom.readyToAdvancePlayerIds || [];
    const iAmReadyToAdvance = readyPlayerIds.includes(currentPlayerId);

    return (
      <div className="relative flex-1 w-full max-w-5xl mx-auto px-3 sm:px-6 py-2.5 flex flex-col justify-between gap-2.5 select-none">
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

        {/* 2. MAIN ILLUSTRATED DUNGEON CHAMBER */}
        <section
          className="relative border-2 p-3 sm:p-4 overflow-hidden shadow-[0_16px_44px_rgba(0,0,0,0.92)] flex flex-col gap-3"
          style={{
            backgroundColor: '#120D17',
            borderColor: isDefeated
              ? '#8F263D'
              : isFinalBossCombat
              ? expeditionState.finalBossPhase === 2
                ? '#C93B5B'
                : '#E7A54A'
              : chosenDungeon.palette.glow,
            backgroundImage: `radial-gradient(circle at 50% 20%, ${chosenDungeon.palette.fog}99 0%, #0B0A0E 85%)`,
          }}
        >
          {/* Room Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#282039] pb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-8 h-8 border-2 flex items-center justify-center shrink-0 bg-[#09070D]"
                style={{ borderColor: chosenDungeon.palette.glow }}
              >
                <LaCriptaRoomTypeIcon
                  type={activeRoom.type}
                  color={chosenDungeon.palette.highlight}
                  size={18}
                />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-cripta-pixel uppercase tracking-widest text-[#E7A54A]">
                  {isFinalBossCombat
                    ? `SANTUARIO FINAL · FASE ${expeditionState.finalBossPhase || 1} DE 2`
                    : inSecretRoom
                    ? 'CÁMARA OCULTA'
                    : `PUERTA ${Math.min(3, completedDoorCount + 1)}/3 · SALA ${activeRoom.roomNumber} DE ${roomSequence.length} · ${ROOM_TYPE_LABELS[activeRoom.type].toUpperCase()}`}
                </div>
                <h1
                  className="font-cripta-display text-lg sm:text-2xl font-black tracking-wide truncate"
                  style={{ color: chosenDungeon.palette.highlight }}
                >
                  {activeRoom.title}
                </h1>
              </div>
            </div>

            {isHost && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    laCriptaAudio.playDoorVote();
                    onRerollExpedition();
                  }}
                  className="px-2.5 py-1 bg-[#19111D] hover:bg-[#282039] border border-[#E7A54A]/50 text-[#E7A54A] font-cripta-pixel text-[10px] transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Compass className="w-3 h-3" />
                  <span>REINICIAR EXPEDICIÓN</span>
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
                  <span>PREPARACIÓN</span>
                </button>
              </div>
            )}
          </div>

          {/* Illustrated Pixel-Art Room Scene: ENVIRONMENT + ENEMIES + NPCs + INTERACTIVE OBJECTS + VISUAL EFFECTS (NO PLAYER SPRITES IN ROOM) */}
          <div className="relative">
            {isFinalBossCombat ? (
              <div className="relative w-full h-56 sm:h-72 md:h-80 border-2 border-[#282039] bg-[#08050C] overflow-hidden">
                <LaCriptaFinalBossRoomArt phase={expeditionState.finalBossPhase || 1} />
              </div>
            ) : (
              <LaCriptaRoomEnvironmentCanvas
                dungeon={chosenDungeon}
                room={activeRoom}
                canAdvance={canAdvance && !expeditionState.dungeonCompleted}
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
              />
            )}

            {/* Physical Ground Loot Drops inside the Room */}
            {onClaimGroundDrop &&
              activeRoom.groundDrops &&
              activeRoom.groundDrops.some((d) => !d.claimed) && (
                <LaCriptaGroundDropsOverlay
                  drops={activeRoom.groundDrops}
                  onClaimDrop={(dropId) => {
                    laCriptaAudio.playHeroSelect();
                    onClaimGroundDrop(dropId);
                  }}
                />
              )}

            {/* Central Room Visual Feedback Overlay (Gold bursts, Chest rewards, Shrine blessings, Campfire heals) */}
            {(roomCenterEvents.length > 0 || roomCenterVfxEvent?.vfxStyle) && (
              <div className="pointer-events-none absolute inset-0 z-30 flex flex-col items-center justify-center">
                {roomCenterVfxEvent?.vfxStyle && (
                  <LaCriptaCombatVfxOverlay
                    styleType={roomCenterVfxEvent.vfxStyle}
                    size={92}
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

            {/* Central Stage: Active & Dissolving Enemies Only (Players are represented strictly in the bottom HUD) */}
            {visibleRoomEnemies.length > 0 && (
              <div className="pointer-events-none absolute inset-x-3 sm:inset-x-8 bottom-2 flex items-end justify-center gap-4 sm:gap-8">
                <div className="pointer-events-auto flex items-end justify-center gap-3 sm:gap-6">
                  {visibleRoomEnemies.map((enemy) => {
                    const isDying = enemy.hp <= 0 || enemyAnimStates[enemy.id] === 'death';
                    const isTargeted = !isDying && activeTargetEnemy?.id === enemy.id;
                    const hpPct = Math.max(
                      0,
                      Math.min(100, Math.round((enemy.hp / Math.max(1, enemy.maxHp)) * 100))
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
                      <button
                        key={enemy.id}
                        type="button"
                        disabled={isDying}
                        onClick={() => {
                          if (isDying) return;
                          laCriptaAudio.playStoneClick();
                          setSelectedEnemyId(enemy.id);
                        }}
                        className={`relative group flex flex-col items-center cursor-pointer transition-transform ${
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

                        {/* Enemy Intent & Biome Status Threat Pill */}
                        {!isDying && (
                          <div className="mb-1 flex items-center gap-1 px-2 py-0.5 bg-[#19111D]/95 border border-[#C93B5B] text-[9px] font-cripta-pixel text-[#E7A54A] shadow">
                            <span title="Intención del enemigo en su próximo turno">
                              ⚔ {enemy.intent} ({enemy.intentValue})
                            </span>
                            {threatDef && enemy.statusThreat && (
                              <span
                                className="inline-flex items-center gap-0.5 pl-1 border-l border-[#282039]"
                                style={{ color: threatDef.visualTreatment.color }}
                                title={`Amenaza de bioma: ${threatDef.name} (${
                                  enemy.abilityName || threatDef.description
                                })`}
                              >
                                <LaCriptaStatusPixelIcon
                                  effectType={enemy.statusThreat}
                                  size={9}
                                />
                                <span>{threatDef.code}</span>
                              </span>
                            )}
                          </div>
                        )}

                        {/* Enemy Sprite + Direct Pixel VFX Overlay */}
                        <div className="relative flex items-center justify-center">
                          <LaCriptaEnemyPixelSprite
                            enemy={enemy}
                            isTargeted={isTargeted}
                            animState={currentEnemyAnim}
                          />
                          {latestEnemyVfx?.vfxStyle && (
                            <LaCriptaCombatVfxOverlay
                              styleType={latestEnemyVfx.vfxStyle}
                              size={enemy.isBoss ? 110 : 84}
                            />
                          )}
                        </div>

                        {/* Enemy HP Bar & Nameplate */}
                        <div
                          className="mt-0.5 px-2 py-1 bg-[#09070D]/95 border text-center min-w-[96px] shadow"
                          style={{
                            borderColor: isTargeted ? '#E7A54A' : '#282039',
                          }}
                        >
                          <div className="flex items-center justify-center gap-1">
                            {isTargeted && (
                              <span className="text-[8px] font-cripta-pixel text-[#E7A54A]">
                                ▶
                              </span>
                            )}
                            <span className="text-[9px] font-cripta-pixel font-bold text-[#D9D0BC] truncate max-w-[116px]">
                              {enemy.name}
                            </span>
                          </div>
                          {enemy.abilityName && (
                            <div className="text-[7px] font-cripta-pixel text-[#D8C6A0]/70 truncate max-w-[116px]">
                              {enemy.abilityName}
                            </div>
                          )}
                          <div className="mt-1 w-full h-2 bg-[#19111D] border border-[#282039]">
                            <div
                              className="h-full bg-[#C93B5B] transition-all duration-200"
                              style={{ width: `${hpPct}%` }}
                            />
                          </div>
                          <div className="mt-0.5 text-[8px] font-cripta-mono text-[#D8C6A0]">
                            {Math.max(0, enemy.hp)}/{enemy.maxHp} PV
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Narrative & Action Outcome Log */}
          <div className="px-3 py-2 bg-[#09070D] border border-[#282039] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="text-xs font-cripta-pixel text-[#D9D0BC]">
              {activeRoom.outcomeLog ? (
                <span className="text-[#E7A54A]">▸ {activeRoom.outcomeLog}</span>
              ) : (
                <span className="text-[#D8C6A0]/85">{activeRoom.narrative}</span>
              )}
            </div>
            <span className="text-[10px] font-cripta-pixel text-[#D8C6A0]/60 shrink-0">
              {activeRoom.subtitle}
            </span>
          </div>

          {/* ================================================================= */}
          {/* DEFEAT / PARTY WIPE BANNER (SOLO OR ALL PLAYERS DEAD)             */}
          {/* ================================================================= */}
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
                    Alcanzasteis la Sala {activeRoom.roomNumber} de {chosenDungeon.name} con{' '}
                    {partyGold} de oro acumulado.
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

          {/* ================================================================= */}
          {/* FALLEN PLAYER / ALLY REVIVAL PANEL (MULTIPLAYER COOPERATIVE)      */}
          {/* ================================================================= */}
          {!isDefeated && fallenPlayers.length > 0 && (
            <div className="p-3 bg-[#170B12] border-2 border-[#8F263D] flex flex-col gap-2">
              {iAmDead ? (
                <div className="flex items-center gap-2.5 text-xs font-cripta-pixel text-[#C93B5B]">
                  <LaCriptaFallenSoulIcon size={18} />
                  <span>
                    HAS CAÍDO EN COMBATE · Tus compañeros vivos pueden revivirte con un Sello de
                    Resurrección, en un Santuario, en una Hoguera o mediante la Luz del Clérigo.
                  </span>
                </div>
              ) : (
                onReviveAlly && (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-cripta-pixel font-bold text-[#E7A54A]">
                        <LaCriptaFallenSoulIcon size={16} />
                        <span>COMPAÑERO CAÍDO · RITUAL DE RESURRECCIÓN DISPONIBLE</span>
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
                              <span className="text-[9px] font-cripta-pixel text-[#C93B5B]">
                                (0/{fallen.maxHp} PV)
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
                                  className="px-2 py-1 bg-[#241B0D] hover:bg-[#382913] border border-[#E7A54A] text-[10px] font-cripta-pixel text-[#E7A54A] cursor-pointer"
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
                                className={`px-2 py-1 border text-[10px] font-cripta-pixel ${
                                  canAffordGold
                                    ? 'bg-[#19111D] hover:bg-[#282039] border-[#E7A54A] text-[#E7A54A] cursor-pointer'
                                    : 'bg-[#0E0B12] border-[#282039] text-[#D8C6A0]/40 cursor-not-allowed'
                                }`}
                              >
                                SELLO DE ORO (20 ORO)
                              </button>

                              <button
                                type="button"
                                disabled={!canAffordBlood}
                                onClick={() => {
                                  laCriptaAudio.playDoorVote();
                                  onReviveAlly(fallen.id, 'BLOOD');
                                }}
                                className={`px-2 py-1 border text-[10px] font-cripta-pixel ${
                                  canAffordBlood
                                    ? 'bg-[#240B12] hover:bg-[#38111C] border-[#C93B5B] text-[#D9D0BC] cursor-pointer'
                                    : 'bg-[#0E0B12] border-[#282039] text-[#D8C6A0]/40 cursor-not-allowed'
                                }`}
                              >
                                TRIBUTO VITAL (-{bloodCost} PV)
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

          {/* ================================================================= */}
          {/* INTERACTIVE ROOM CONTROLS BY CATEGORY                             */}
          {/* ================================================================= */}

          {/* A) COMBAT / ELITE / BOSS TURN-BASED CONTROLS */}
          {!isDefeated && livingEnemies.length > 0 && onCombatAction && (
            <div className="flex flex-col gap-2">
              {/* Turn-Based Combat Initiative & Target Selector Bar */}
              <div className="px-3 py-1.5 bg-[#0E0B14] border border-[#282039] flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 bg-[#19111D] border border-[#E7A54A]/60 text-[10px] font-cripta-pixel font-bold text-[#E7A54A]">
                    RONDA {activeRoom.combatTurn || 1}
                  </span>

                  {/* Turn Queue Strip */}
                  <div className="flex flex-wrap items-center gap-1">
                    {aliveOrderedPlayers.map((p) => {
                      const hasActed = actedIds.includes(p.id);
                      const isCurrentTurn = activeTurnPlayerId === p.id;
                      return (
                        <span
                          key={p.id}
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 border text-[9px] font-cripta-pixel transition-all ${
                            isCurrentTurn
                              ? 'bg-[#2B1F11] border-[#FFD166] text-[#FFD166] font-bold'
                              : hasActed
                              ? 'bg-[#09070D] border-[#282039] text-[#5EA87A]/80 opacity-65'
                              : 'bg-[#140F1A] border-[#282039] text-[#D9D0BC]/85'
                          }`}
                        >
                          <span
                            className="w-1.5 h-1.5 shrink-0"
                            style={{ backgroundColor: p.color }}
                          />
                          <span className="truncate max-w-[74px]">{p.name}</span>
                          {hasActed && <span>✓</span>}
                          {isCurrentTurn && <span>⚡</span>}
                        </span>
                      );
                    })}
                    <span className="text-[9px] font-cripta-pixel text-[#D8C6A0]/50">▸</span>
                    <span className="px-1.5 py-0.5 bg-[#1E0C13] border border-[#8F263D] text-[9px] font-cripta-pixel text-[#C93B5B]">
                      👹 FASE ENEMIGA
                    </span>
                  </div>
                </div>

                {/* Active Turn Status & Target Switcher */}
                <div className="flex items-center gap-2">
                  {livingEnemies.length > 1 && (
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-cripta-pixel text-[#D8C6A0]/65">
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
                            className={`px-1.5 py-0.5 border text-[9px] font-cripta-pixel cursor-pointer ${
                              sel
                                ? 'bg-[#241811] border-[#E7A54A] text-[#E7A54A] font-bold'
                                : 'bg-[#09070D] border-[#282039] text-[#D8C6A0]/70 hover:text-[#D9D0BC]'
                            }`}
                          >
                            {en.name}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {!isSolo && activeTurnPlayer && (
                    <span
                      className={`text-[10px] font-cripta-pixel font-bold ${
                        isMyTurn ? 'text-[#FFD166]' : 'text-[#D8C6A0]'
                      }`}
                    >
                      {isMyTurn
                        ? '⚡ ¡ES TU TURNO!'
                        : `TURNO SUGERIDO: ${activeTurnPlayer.name.toUpperCase()}`}
                    </span>
                  )}
                </div>
              </div>

              {/* 3 Combat Action Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  disabled={iAmDead}
                  onClick={() => {
                    laCriptaAudio.playDoorVote();
                    onCombatAction('ATTACK', activeTargetEnemy?.id);
                  }}
                  className={`p-2.5 border-2 text-left transition-all flex items-center gap-2.5 ${
                    iAmDead
                      ? 'bg-[#0E0B12] border-[#282039] opacity-45 cursor-not-allowed'
                      : isMyTurn
                      ? 'bg-[#1F121D] hover:bg-[#2E1A2B] border-[#C93B5B] hover:border-[#FFD166] cursor-pointer shadow-[0_0_14px_rgba(201,59,91,0.25)]'
                      : 'bg-[#19111D] hover:bg-[#282039] border-[#C93B5B]/75 hover:border-[#E7A54A] cursor-pointer'
                  }`}
                >
                  <Swords className="w-5 h-5 text-[#C93B5B] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-cripta-pixel text-xs font-bold text-[#D9D0BC] truncate">
                        ATACAR A {(activeTargetEnemy?.name || 'ENEMIGO').toUpperCase()}
                      </span>
                      <span className="font-cripta-mono text-[10px] text-[#E7A54A] shrink-0">
                        ~{estimatedAttackDmg} DAÑO
                      </span>
                    </div>
                    <div className="text-[10px] font-cripta-pixel text-[#D8C6A0]/75 truncate">
                      Golpe directo {myBonusAtk > 0 ? `(Bonif. +${myBonusAtk} ATQ)` : 'con arma principal'}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  disabled={iAmDead}
                  onClick={() => {
                    laCriptaAudio.playDoorVote();
                    onCombatAction('ABILITY', activeTargetEnemy?.id);
                  }}
                  className={`p-2.5 border-2 text-left transition-all flex items-center gap-2.5 ${
                    iAmDead
                      ? 'bg-[#0E0B12] border-[#282039] opacity-45 cursor-not-allowed'
                      : isMyTurn
                      ? 'bg-[#1B1326] hover:bg-[#281C38] border-[#9B72CF] hover:border-[#FFD166] cursor-pointer shadow-[0_0_14px_rgba(155,114,207,0.25)]'
                      : 'bg-[#19111D] hover:bg-[#282039] border-[#9B72CF]/75 hover:border-[#E7A54A] cursor-pointer'
                  }`}
                >
                  <Sparkles className="w-5 h-5 text-[#9B72CF] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-cripta-pixel text-xs font-bold text-[#D9D0BC] truncate">
                        {(myCharDef?.abilities[0]?.name || 'HABILIDAD DE CLASE').toUpperCase()}
                      </span>
                      {myBonusMag > 0 && (
                        <span className="font-cripta-mono text-[10px] text-[#9B72CF] shrink-0">
                          ✦+{myBonusMag} MAG
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-cripta-pixel text-[#D8C6A0]/75 truncate">
                      {myCharDef?.abilities[0]?.description || `Poder arcano (~${estimatedMagicPower})`}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  disabled={iAmDead}
                  onClick={() => {
                    laCriptaAudio.playStoneClick();
                    onCombatAction('DEFEND', activeTargetEnemy?.id);
                  }}
                  className={`p-2.5 border-2 text-left transition-all flex items-center gap-2.5 ${
                    iAmDead
                      ? 'bg-[#0E0B12] border-[#282039] opacity-45 cursor-not-allowed'
                      : isMyTurn
                      ? 'bg-[#111E22] hover:bg-[#192C32] border-[#69A8A5] hover:border-[#FFD166] cursor-pointer shadow-[0_0_14px_rgba(105,168,165,0.25)]'
                      : 'bg-[#19111D] hover:bg-[#282039] border-[#69A8A5]/75 hover:border-[#E7A54A] cursor-pointer'
                  }`}
                >
                  <Shield className="w-5 h-5 text-[#69A8A5] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-cripta-pixel text-xs font-bold text-[#D9D0BC] truncate">
                        GUARDIA DEL GRUPO
                      </span>
                      <span className="font-cripta-mono text-[10px] text-[#69A8A5] shrink-0">
                        +{2 + Math.floor(myBonusDef / 2)} 🛡
                      </span>
                    </div>
                    <div className="text-[10px] font-cripta-pixel text-[#D8C6A0]/75 truncate">
                      Armadura grupal, ESCUDO (2T) y contragolpe
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* B) PUZZLE RUNE PEDESTALS */}
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

          {/* C0) SHOP CONSUMABLE SHELF & RELIC PEDESTAL */}
          {!isDefeated && activeRoom.type === 'SHOP' && activeRoom.shopStock && (
            <div className="p-3 bg-[#130E1B] border-2 border-[#E7A54A]/60 flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#282039] pb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-cripta-pixel font-bold text-[#E7A54A]">
                    ✦ ESTANTERÍA DE CONSUMIBLES Y PEDESTAL DE RELIQUIA
                  </span>
                </div>
                <span className="text-[10px] font-cripta-pixel text-[#D8C6A0]/80">
                  INVENTARIO PERSONAL: {(me?.inventory || []).length} / 3 HUECOS
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {activeRoom.shopStock.consumables.map((offer) => {
                  const itemDef = CRIPTA_CONSUMABLES_BY_ID[offer.itemId];
                  if (!itemDef) return null;
                  const canAfford = partyGold >= offer.costGold;
                  return (
                    <button
                      key={offer.id}
                      type="button"
                      disabled={offer.sold || !canAfford || iAmDead}
                      onClick={() => {
                        if (!onShopBuyItem) return;
                        laCriptaAudio.playDoorVote();
                        onShopBuyItem(offer.id);
                      }}
                      className={`p-2.5 border-2 text-left transition-all flex flex-col justify-between gap-1.5 ${
                        offer.sold
                          ? 'bg-[#0C0910] border-[#282039] opacity-45 cursor-default'
                          : !canAfford || iAmDead
                          ? 'bg-[#140F1A] border-[#8F263D]/45 opacity-60 cursor-not-allowed'
                          : 'bg-[#171122] hover:bg-[#241A35] border-[#7656A8] hover:border-[#E7A54A] cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 bg-[#09070D] border border-[#E7A54A]/50 flex items-center justify-center shrink-0">
                            <LaCriptaItemPixelIcon itemId={offer.itemId} size={20} />
                          </div>
                          <span className="font-cripta-pixel text-[11px] font-bold text-[#D9D0BC] truncate">
                            {itemDef.name}
                          </span>
                        </div>
                        <span className="px-1.5 py-0.5 bg-[#09070D] border border-[#E7A54A] text-[9px] font-cripta-pixel text-[#E7A54A] shrink-0">
                          {offer.sold ? 'AGOTADO' : `${offer.costGold} ORO`}
                        </span>
                      </div>
                      <div className="text-[10px] font-cripta-pixel text-[#5EA87A]">
                        {itemDef.shortLabel}
                      </div>
                      <div className="text-[9px] font-cripta-pixel text-[#D8C6A0]/70 line-clamp-2">
                        {itemDef.description}
                      </div>
                    </button>
                  );
                })}

                {activeRoom.shopStock.relic &&
                  (() => {
                    const relicOffer = activeRoom.shopStock.relic;
                    const relicDef = CRIPTA_RELICS_BY_ID[relicOffer.relicId];
                    if (!relicDef) return null;
                    const canAfford = partyGold >= relicOffer.costGold;
                    const rarityStyle = RARITY_BADGE_COLORS[relicDef.rarity];

                    return (
                      <button
                        type="button"
                        disabled={relicOffer.sold || !canAfford || iAmDead}
                        onClick={() => {
                          if (!onShopBuyRelic) return;
                          laCriptaAudio.playDoorVote();
                          onShopBuyRelic();
                        }}
                        className={`p-2.5 border-2 text-left transition-all flex flex-col justify-between gap-1.5 ${
                          relicOffer.sold
                            ? 'bg-[#0C0910] border-[#282039] opacity-45 cursor-default'
                            : !canAfford || iAmDead
                            ? 'bg-[#19111D] border-[#8F263D]/50 opacity-60 cursor-not-allowed'
                            : 'bg-[#21162E] hover:bg-[#2E1E40] border-[#E7A54A] hover:border-[#FFD166] cursor-pointer shadow-[0_0_16px_rgba(231,165,74,0.2)]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className="w-7 h-7 bg-[#09070D] border flex items-center justify-center shrink-0"
                              style={{ borderColor: rarityStyle.border }}
                            >
                              <LaCriptaRelicPixelIcon relicId={relicOffer.relicId} size={20} />
                            </div>
                            <div className="min-w-0">
                              <div
                                className="text-[8px] font-cripta-pixel font-bold uppercase"
                                style={{ color: rarityStyle.text }}
                              >
                                PEDESTAL · {rarityStyle.label}
                              </div>
                              <div className="font-cripta-pixel text-[11px] font-bold text-[#FFD166] truncate">
                                {relicDef.name}
                              </div>
                            </div>
                          </div>
                          <span className="px-1.5 py-0.5 bg-[#09070D] border border-[#FFD166] text-[9px] font-cripta-pixel text-[#FFD166] shrink-0">
                            {relicOffer.sold ? 'OBTENIDA' : `${relicOffer.costGold} ORO`}
                          </span>
                        </div>
                        <div className="text-[10px] font-cripta-pixel text-[#E7A54A]">
                          ✦ {relicDef.passiveDescription}
                        </div>
                      </button>
                    );
                  })()}
              </div>
            </div>
          )}

          {/* C) INTERACTIVE ROOM OPTIONS (TREASURE, LOOT, SHOP, REST, SHRINE, TRAP, EVENT, DECISION, SECRET) */}
          {!isDefeated && activeRoom.options.length > 0 && onInteractOption && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {activeRoom.options.map((opt) => {
                const canAfford =
                  typeof opt.costGold !== 'number' || partyGold >= opt.costGold;
                const votersForOpt = connectedPlayers.filter(
                  (p) => activeRoom.optionVotes?.[p.id] === opt.id
                );

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
                        : 'bg-[#15101D] hover:bg-[#22192E] border-[#7656A8] hover:border-[#E7A54A] cursor-pointer'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-cripta-pixel text-xs font-bold text-[#E7A54A]">
                        {opt.label}
                      </span>
                      {typeof opt.costGold === 'number' && (
                        <span className="px-1.5 py-0.5 bg-[#09070D] border border-[#E7A54A] text-[10px] font-cripta-pixel text-[#E7A54A] shrink-0">
                          {opt.costGold} ORO
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-cripta-pixel text-[#D9D0BC]/80">
                      {opt.subtitle}
                    </div>
                    <div className="text-[10px] font-cripta-pixel text-[#5EA87A]">
                      {opt.effectText}
                    </div>

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

          {/* D) ROOM RESOLVED -> ADVANCE TO NEXT ROOM OR COMPLETE DUNGEON DOOR */}
          {expeditionState.dungeonCompleted ? (
            <div className="p-4 bg-[#19111D] border-2 border-[#E7A54A] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_0_26px_rgba(231,165,74,0.28)]">
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-[#E7A54A] shrink-0" />
                <div>
                  <div className="text-[10px] font-cripta-pixel text-[#FFD166] tracking-widest uppercase">
                    ✦ PUERTA {Math.min(3, completedDoorCount + 1)} / 3 SUPERADA ✦
                  </div>
                  <div className="font-cripta-display text-lg sm:text-xl font-black text-[#E7A54A]">
                    ¡{chosenDungeon.name} CONQUISTADA!
                  </div>
                  <div className="text-xs font-cripta-pixel text-[#D9D0BC]">
                    El grupo conserva sus PV, estadísticas, reliquias, objetos y {partyGold} de oro.
                  </div>
                </div>
              </div>
              {onAdvanceRoom && (
                <button
                  type="button"
                  onClick={() => {
                    laCriptaAudio.playDoorVote();
                    onAdvanceRoom();
                  }}
                  className="px-5 py-2.5 bg-[#E7A54A] hover:bg-[#f2b863] text-[#0B0A0E] border-2 border-[#FFF3C4] font-cripta-pixel text-xs font-bold tracking-wider flex items-center gap-2 cursor-pointer shrink-0 shadow-[0_0_18px_rgba(231,165,74,0.45)]"
                >
                  <span>
                    {completedDoorCount + 1 >= 3
                      ? 'SALIR HACIA EL CORAZÓN DE LA CRIPTA'
                      : isSolo
                      ? 'SALIR Y VOLVER A LAS TRES PUERTAS'
                      : iAmReadyToAdvance
                      ? `ESPERANDO AL GRUPO (${readyPlayerIds.length}/${totalConnected})`
                      : 'SALIR Y VOLVER A LAS TRES PUERTAS'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            canAdvance &&
            onAdvanceRoom && (
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="text-xs font-cripta-pixel text-[#5EA87A]">
                  ✓ PASO DESPEJADO ·{' '}
                  {inSecretRoom
                    ? 'Listos para regresar a la galería principal'
                    : currentRoomIndex + 1 >= roomSequence.length
                    ? 'Jefe del bioma derrotado · Puerta de salida desbloqueada'
                    : `Siguiente cámara lista (${Math.min(
                        roomSequence.length,
                        currentRoomIndex + 2
                      )}/${roomSequence.length})`}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    laCriptaAudio.playDoorVote();
                    onAdvanceRoom();
                  }}
                  className="px-4 py-2 bg-[#E7A54A] hover:bg-[#f2b863] text-[#0B0A0E] border-2 border-[#FFF3C4] font-cripta-pixel text-xs font-bold tracking-wider flex items-center gap-2 cursor-pointer"
                >
                  <span>
                    {inSecretRoom
                      ? 'SALIR DE LA CÁMARA SECRETA'
                      : currentRoomIndex + 1 >= roomSequence.length
                      ? 'COMPLETAR MAZMORRA'
                      : isSolo
                      ? 'AVANZAR A LA SIGUIENTE SALA'
                      : iAmReadyToAdvance
                      ? `ESPERANDO AL GRUPO (${readyPlayerIds.length}/${totalConnected})`
                      : 'AVANZAR A LA SIGUIENTE SALA'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )
          )}
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
        <div className="flex items-center justify-center">
          <LaCriptaDoorCounterBadge completedDoors={3} />
        </div>
        <LaCriptaFinalBossDoorScene
          completedBiomes={expeditionState.completedBiomes || []}
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
      {/* Persistent Door Counter + Completed Biomes Strip */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <LaCriptaDoorCounterBadge completedDoors={completedDoorCount} />
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
