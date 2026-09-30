import React, { useState } from 'react';
import { Copy, Check, Volume2, VolumeX, LogOut, Crown, Sparkles, Swords } from 'lucide-react';
import {
  CriptaAcquiredRelic,
  CriptaCharacterId,
  CriptaExpeditionState,
  CriptaSpriteAnimationState,
  CriptaVisualEvent,
} from '../../types/laCripta';
import {
  CRIPTA_CHARACTERS_CATALOG,
  CRIPTA_DUNGEONS_REGISTRY,
} from '../../data/la-cripta/criptaCatalog';
import {
  computePlayerEffectiveStats,
  CRIPTA_ACCESSORIES_REGISTRY,
  CRIPTA_ARMORS_REGISTRY,
  getEquippedWeaponForPlayer,
} from '../../data/la-cripta/criptaEquipmentAndEvents';
import { laCriptaAudio } from '../../utils/laCriptaAudio';
import { LaCriptaPixelSprite } from './LaCriptaPixelSprite';
import {
  LaCriptaFallenSoulIcon,
  LaCriptaStatusEffectBadge,
} from './LaCriptaStatusEffectBadge';
import { LaCriptaFloatingEventBadge } from './LaCriptaVisualFeedback';
import {
  LaCriptaPartyRelicsBar,
  LaCriptaRelicDetailModal,
} from './LaCriptaItemRelicArt';
import {
  LaCriptaRoomTypeIcon,
  ROOM_TYPE_LABELS,
} from './LaCriptaRoomProgressTracker';
import { LaCriptaPixelTooltip } from './LaCriptaPixelTooltip';

export const LaCriptaPixelPortrait: React.FC<{
  characterId: CriptaCharacterId;
  size?: number;
}> = ({ characterId }) => (
  <div className="flex items-center justify-center overflow-hidden">
    <LaCriptaPixelSprite
      characterId={characterId}
      animationState="idle"
      size="hud"
    />
  </div>
);

/**
 * Compact pixel-art backpack icon for the Bottom HUD MOCHILA control.
 */
const HudBackpackPixelIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    shapeRendering="crispEdges"
    className="shrink-0 select-none"
  >
    <rect x="6" y="1" width="4" height="1" fill="#8C583A" />
    <rect x="5" y="2" width="1" height="2" fill="#8C583A" />
    <rect x="10" y="2" width="1" height="2" fill="#8C583A" />
    <rect x="3" y="4" width="10" height="10" fill="#6E4228" />
    <rect x="4" y="5" width="8" height="8" fill="#8C583A" />
    <rect x="3" y="4" width="10" height="4" fill="#52301C" />
    <rect x="7" y="7" width="2" height="3" fill="#FFD166" />
    <rect x="5" y="9" width="2" height="2" fill="#E7A54A" />
    <rect x="9" y="9" width="2" height="2" fill="#E7A54A" />
  </svg>
);

interface LaCriptaPartyHudProps {
  expeditionState: CriptaExpeditionState;
  currentPlayerId: string;
  onLeaveExpedition: () => void;
  onReturnToLobby?: () => void;
  playerAnimationStates?: Record<string, CriptaSpriteAnimationState>;
  activeVisualEvents?: CriptaVisualEvent[];
  onUseConsumable?: (
    slotIndex: number,
    targetEnemyId?: string,
    targetPlayerId?: string
  ) => void;
  selectedTargetEnemyId?: string | null;
  onOpenInventory?: () => void;
  isInventoryOpen?: boolean;
  onInspectPlayer?: (playerId: string) => void;
  inspectedPlayerId?: string | null;
}

/**
 * Unified Full-Screen Top HUD (48-56px height):
 * Left: LA CRIPTA + Room Code + Current Dungeon Name
 * Center: Inline Room Node Path ([1] ─ [2] ─ [3] ─ [★M]) + Door Progress (PUERTA X/3)
 * Right: Party Gold + Party Relics + Audio & Session Controls
 */
export const LaCriptaTopBar: React.FC<LaCriptaPartyHudProps> = ({
  expeditionState,
  currentPlayerId,
  onLeaveExpedition,
  onReturnToLobby,
}) => {
  const [copied, setCopied] = useState(false);
  const [muted, setMuted] = useState(() => laCriptaAudio.isMuted());
  const [inspectedRelic, setInspectedRelic] = useState<CriptaAcquiredRelic | null>(null);

  const handleCopyCode = () => {
    laCriptaAudio.playStoneClick();
    const roomCode = expeditionState.code || expeditionState.roomCode || '';
    if (roomCode && navigator.clipboard) {
      navigator.clipboard.writeText(roomCode).catch(() => {});
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleToggleMute = () => {
    const next = laCriptaAudio.toggleMute();
    setMuted(next);
    if (!next) {
      laCriptaAudio.playStoneClick();
    }
  };

  const me = expeditionState.players.find((p) => p.id === currentPlayerId);
  const isHost = Boolean(me?.isHost);
  const displayCode = expeditionState.code || expeditionState.roomCode || '-----';
  const partyRelics = expeditionState.partyRelics || [];
  const roomSequence = expeditionState.roomSequence || [];
  const currentRoomIndex = expeditionState.currentRoomIndex ?? 0;
  const completedDoorCount = expeditionState.completedDoorCount ?? 0;
  const chosenDungeon = expeditionState.selectedDungeonId
    ? CRIPTA_DUNGEONS_REGISTRY[expeditionState.selectedDungeonId]
    : null;
  const isDungeonPhase =
    expeditionState.phase === 'DUNGEON' ||
    expeditionState.phase === 'DUNGEON_ARRIVAL' ||
    expeditionState.phase === 'FINAL_BOSS_COMBAT';

  return (
    <header className="relative z-20 w-full border-b border-[#282039]/90 bg-[#07050B]/68 shrink-0">
      {inspectedRelic && (
        <LaCriptaRelicDetailModal
          relic={inspectedRelic}
          players={expeditionState.players}
          onClose={() => setInspectedRelic(null)}
        />
      )}

      <div className="w-full px-3 sm:px-5 h-12 sm:h-13 flex items-center justify-between gap-2">
        {/* LEFT ZONE: Brand + Room Code + Dungeon Name */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-cripta-display text-sm sm:text-base font-extrabold tracking-widest text-[#D8C6A0]">
              LA CRIPTA
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopyCode}
            aria-label="Copiar código de expedición"
            className="group inline-flex items-center gap-1 px-2 py-0.5 bg-[#16101E] hover:bg-[#282039] border border-[#D8C6A0]/30 hover:border-[#E7A54A] text-[11px] font-cripta-pixel text-[#D9D0BC] transition-colors cursor-pointer shrink-0"
          >
            <span className="text-[#E7A54A] font-bold tracking-widest">{displayCode}</span>
            {copied ? (
              <Check className="w-3 h-3 text-[#69A8A5]" />
            ) : (
              <Copy className="w-3 h-3 text-[#D8C6A0]/70 group-hover:text-[#E7A54A]" />
            )}
          </button>

          {chosenDungeon && isDungeonPhase && (
            <div className="hidden md:flex items-center gap-2 min-w-0">
              <span className="text-[#7656A8]">·</span>
              <span
                className="font-cripta-display text-xs sm:text-sm font-bold truncate"
                style={{ color: chosenDungeon.palette.highlight }}
              >
                {expeditionState.phase === 'FINAL_BOSS_COMBAT'
                  ? 'EL CORAZÓN DE LA CRIPTA'
                  : chosenDungeon.name}
              </span>
              <span className="font-cripta-pixel text-[10px] text-[#D8C6A0]/70 shrink-0">
                · PUERTA {Math.min(3, completedDoorCount + 1)}/3
              </span>
            </div>
          )}
        </div>

        {/* CENTER ZONE: Inline Visual Room Path when inside a Dungeon */}
        {isDungeonPhase && roomSequence.length > 0 && (
          <div className="hidden lg:flex items-center gap-1 px-2.5 py-1 bg-[#120D19] border border-[#282039]">
            {roomSequence.map((rm, idx) => {
              const isCurrent = !expeditionState.inSecretRoom && idx === currentRoomIndex;
              const isCleared = rm.resolved && idx < currentRoomIndex;
              const isRevealed = rm.revealed || idx <= currentRoomIndex + 1;
              const isFinalNode =
                idx === roomSequence.length - 1 ||
                rm.type === 'MINIBOSS' ||
                rm.type === 'BOSS';

              return (
                <React.Fragment key={rm.id}>
                  <LaCriptaPixelTooltip
                    title={
                      isRevealed
                        ? `Sala ${rm.roomNumber}: ${ROOM_TYPE_LABELS[rm.type] || rm.type}`
                        : `Sala ${rm.roomNumber}`
                    }
                    category={isCurrent ? 'SALA ACTUAL' : isCleared ? 'COMPLETADA' : 'RUTA'}
                    description={
                      isRevealed
                        ? `${rm.title} — ${rm.subtitle}`
                        : 'Cámara aún envuelta en las sombras de la mazmorra.'
                    }
                    borderColor={
                      isCurrent ? '#FFD166' : isCleared ? '#5EA87A' : '#7656A8'
                    }
                  >
                    <div
                      className={`w-6 h-6 border flex items-center justify-center transition-all cursor-help ${
                        isCurrent
                          ? 'bg-[#261812] border-[#FFD166] scale-110 shadow-[0_0_10px_rgba(255,209,102,0.45)]'
                          : isCleared
                          ? 'bg-[#112219] border-[#5EA87A]/70 opacity-85'
                          : isFinalNode
                          ? 'bg-[#210D16] border-[#C93B5B]/80'
                          : 'bg-[#09070D] border-[#282039] opacity-60'
                      }`}
                    >
                      {isRevealed || isFinalNode ? (
                        <LaCriptaRoomTypeIcon
                          type={rm.type}
                          color={
                            isCurrent
                              ? '#FFD166'
                              : isCleared
                              ? '#5EA87A'
                              : isFinalNode
                              ? '#C93B5B'
                              : '#D8C6A0'
                          }
                          size={12}
                        />
                      ) : (
                        <span className="font-cripta-mono text-[9px] text-[#D8C6A0]/50">?</span>
                      )}
                    </div>
                  </LaCriptaPixelTooltip>
                  {idx < roomSequence.length - 1 && (
                    <span
                      className={`w-2.5 h-0.5 ${
                        idx < currentRoomIndex ? 'bg-[#5EA87A]' : 'bg-[#282039]'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* RIGHT ZONE: Party Relics + Party Gold + Utility Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {partyRelics.length > 0 && (
            <div className="hidden sm:flex items-center">
              <LaCriptaPartyRelicsBar
                relics={partyRelics}
                onInspectRelic={(rel) => setInspectedRelic(rel)}
              />
            </div>
          )}

          {expeditionState.phase !== 'LOBBY' && (
            <LaCriptaPixelTooltip
              title="Oro de Expedición"
              category="TESORO COMPARTIDO"
              description="Oro acumulado por el grupo. Se emplea en el Mercader, en la Forja de armas y en rituales de resurrección."
              footerLabel={`DISPONIBLE: ${expeditionState.partyGold ?? 0} ORO`}
              borderColor="#E7A54A"
            >
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#1D140C] border border-[#E7A54A] font-cripta-mono text-xs font-extrabold text-[#FFD166] cursor-help">
                <span>◆</span>
                <span>{expeditionState.partyGold ?? 0} ORO</span>
              </div>
            </LaCriptaPixelTooltip>
          )}

          {expeditionState.phase !== 'LOBBY' && isHost && onReturnToLobby && (
            <button
              type="button"
              onClick={() => {
                laCriptaAudio.playStoneClick();
                onReturnToLobby();
              }}
              className="hidden sm:inline-flex px-2 py-1 bg-[#16101E] hover:bg-[#282039] border border-[#7656A8]/50 hover:border-[#E7A54A] text-[10px] font-cripta-pixel text-[#D8C6A0] transition-colors cursor-pointer"
            >
              SALA INICIAL
            </button>
          )}

          <button
            type="button"
            onClick={handleToggleMute}
            aria-label={muted ? 'Activar sonido' : 'Silenciar sonido'}
            className="p-1.5 bg-[#16101E] hover:bg-[#282039] border border-[#282039] hover:border-[#D8C6A0]/40 text-[#D8C6A0] transition-colors cursor-pointer"
          >
            {muted ? (
              <VolumeX className="w-3.5 h-3.5 text-[#8F263D]" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-[#E7A54A]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              laCriptaAudio.playStoneClick();
              onLeaveExpedition();
            }}
            className="inline-flex items-center gap-1 px-2 py-1 bg-[#16101E] hover:bg-[#8F263D]/30 border border-[#8F263D]/60 text-[11px] font-cripta-pixel text-[#D9D0BC] transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-[#8F263D]" />
            <span className="hidden sm:inline">SALIR</span>
          </button>
        </div>
      </div>
    </header>
  );
};

/**
 * Clean Full-Width Bottom Party HUD:
 * Highlights the active turn player with golden frame & AP badge, allows clicking any player portrait
 * to open Player Inspection, and provides a dedicated MOCHILA button for the local player.
 */
export const LaCriptaPartyHud: React.FC<LaCriptaPartyHudProps> = ({
  expeditionState,
  currentPlayerId,
  playerAnimationStates = {},
  activeVisualEvents = [],
  onOpenInventory,
  isInventoryOpen = false,
  onInspectPlayer,
  inspectedPlayerId = null,
}) => {
  const orderedPlayers = [...expeditionState.players].sort((a, b) => a.seatIndex - b.seatIndex);
  const playerCount = orderedPlayers.length;
  const isSolo = playerCount === 1;

  const roomSequence = expeditionState.roomSequence || [];
  const currentRoomIndex = expeditionState.currentRoomIndex ?? 0;
  const activeRoom =
    expeditionState.inSecretRoom && expeditionState.discoveredSecretRoom
      ? expeditionState.discoveredSecretRoom
      : roomSequence[currentRoomIndex] || null;
  const hasLivingEnemies = Boolean(
    activeRoom &&
      !activeRoom.resolved &&
      activeRoom.enemies &&
      activeRoom.enemies.some((e) => e.hp > 0)
  );
  const combatRoundPhase = activeRoom?.combatRoundPhase || 'PLAYER_PHASE';
  const activeCombatActorId = activeRoom?.activeCombatActorId || null;
  const activeTurnPlayerId = activeRoom?.activeTurnPlayerId || null;
  const currentTurnAp = activeRoom?.currentTurnAp ?? 2;
  const maxTurnAp = activeRoom?.maxTurnAp ?? 2;
  const actedPlayerIds = activeRoom?.actedPlayerIdsThisRound || [];
  const activeTargetedPlayerIds = activeRoom?.activeTargetedPlayerIds || [];
  const isExploreOrBossPhase =
    expeditionState.phase === 'DUNGEON' ||
    expeditionState.phase === 'DUNGEON_ARRIVAL' ||
    expeditionState.phase === 'FINAL_BOSS_COMBAT';

  const gridLayoutClass =
    playerCount <= 1
      ? 'max-w-xl mx-auto grid grid-cols-1'
      : playerCount === 2
      ? 'max-w-4xl mx-auto grid grid-cols-2 gap-3'
      : playerCount === 3
      ? 'w-full grid grid-cols-3 gap-3'
      : 'w-full grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3';

  return (
    <aside
      aria-label={isSolo ? 'Panel del aventurero' : 'Grupo de aventureros'}
      className="relative z-20 w-full border-t border-[#E7A54A]/35 bg-[#07050B]/70 py-2 px-3 sm:px-5 shadow-[0_-8px_24px_rgba(0,0,0,0.75)] select-none shrink-0"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[#E7A54A]/50 to-transparent" />

      <div className={gridLayoutClass}>
        {orderedPlayers.map((player) => {
          const charId = player.characterId ?? player.selectedCharacterId ?? null;
          const charDef = charId ? CRIPTA_CHARACTERS_CATALOG[charId] : null;
          const isMe = player.id === currentPlayerId;
          const votedDoorId = expeditionState.doorVotes[player.id];
          const animState = playerAnimationStates[player.id] || 'idle';
          const isDead = Boolean(
            player.isDead || (charDef && player.maxHp > 0 && player.hp <= 0)
          );
          const isActiveTurnPlayer =
            !isDead &&
            hasLivingEnemies &&
            isExploreOrBossPhase &&
            combatRoundPhase === 'PLAYER_PHASE' &&
            (activeTurnPlayerId === player.id || (isSolo && !activeTurnPlayerId));
          const hasActedThisRound = actedPlayerIds.includes(player.id);
          const isCurrentlyActing =
            !isDead && hasLivingEnemies && activeCombatActorId === player.id;
          const isTargetedByEnemy =
            !isDead && hasLivingEnemies && activeTargetedPlayerIds.includes(player.id);
          const isInspected = inspectedPlayerId === player.id;

          const playerEvents = activeVisualEvents.filter(
            (ev) =>
              (ev.targetType === 'PLAYER' && ev.targetId === player.id) ||
              (ev.targetType === 'PARTY' &&
                (ev.kind === 'GAIN_GOLD' || ev.kind === 'LOSE_GOLD' || ev.kind === 'LOOT_ITEM') &&
                (isSolo || isMe))
          );

          const hpSegmentsTotal = 10;
          const hpFilledSegments =
            charDef && player.maxHp > 0 && !isDead
              ? Math.max(
                  0,
                  Math.min(
                    hpSegmentsTotal,
                    Math.round((player.hp / Math.max(1, player.maxHp)) * hpSegmentsTotal)
                  )
                )
              : 0;

          const effStats = charDef ? computePlayerEffectiveStats(player) : null;
          const eqWeapon = charDef ? getEquippedWeaponForPlayer(player) : null;
          const armorDef = player.equippedArmorId
            ? CRIPTA_ARMORS_REGISTRY[player.equippedArmorId]
            : null;
          const accDef = player.equippedAccessoryId
            ? CRIPTA_ACCESSORIES_REGISTRY[player.equippedAccessoryId]
            : null;
          const normalInv = player.normalInventory || [];

          return (
            <div
              key={player.id}
              onClick={() => {
                if (onInspectPlayer) {
                  laCriptaAudio.playStoneClick();
                  onInspectPlayer(player.id);
                }
              }}
              className={`relative flex items-center gap-2.5 px-2.5 sm:px-3 py-1.5 border-2 transition-all duration-150 ${
                onInspectPlayer ? 'cursor-pointer' : ''
              } ${
                isInspected
                  ? 'bg-[#261B38] -translate-y-1.5 ring-2 ring-[#FFD166]'
                  : isDead
                  ? 'bg-[#0F090E]'
                  : isTargetedByEnemy
                  ? 'bg-[#2E0D18] -translate-y-1 ring-2 ring-[#E03E52]/70'
                  : isActiveTurnPlayer
                  ? 'bg-[#231912] -translate-y-1'
                  : isCurrentlyActing || animState === 'attack' || animState === 'cast'
                  ? 'bg-[#22182E] -translate-y-1'
                  : 'bg-[#130E19] hover:bg-[#191222]'
              }`}
              style={{
                borderColor: isInspected
                  ? '#FFD166'
                  : isDead
                  ? '#8F263D'
                  : isTargetedByEnemy
                  ? '#E03E52'
                  : isActiveTurnPlayer || isCurrentlyActing
                  ? '#FFD166'
                  : hasLivingEnemies && hasActedThisRound && combatRoundPhase === 'PLAYER_PHASE'
                  ? '#5EA87A'
                  : charDef
                  ? isMe
                    ? '#E7A54A'
                    : charDef.accentColor
                  : '#282039',
                boxShadow: isActiveTurnPlayer
                  ? 'inset 0 0 22px rgba(255,209,102,0.22), 0 0 18px rgba(231,165,74,0.45)'
                  : '0 4px 14px rgba(0,0,0,0.85)',
              }}
            >
              {/* Floating Visual Gameplay Feedback Popups above Player Card */}
              {playerEvents.length > 0 && (
                <div className="pointer-events-none absolute -top-9 inset-x-0 z-40 flex flex-col items-center gap-1">
                  {playerEvents.slice(-3).map((ev, idx) => (
                    <LaCriptaFloatingEventBadge key={ev.id} event={ev} indexOffset={idx} />
                  ))}
                </div>
              )}

              {/* Active Turn / Readiness Tag */}
              {!isDead && hasLivingEnemies && isExploreOrBossPhase && (
                <div
                  className={`pointer-events-none absolute -top-2.5 right-2 z-30 px-1.5 py-0.5 border text-[8px] font-cripta-pixel font-bold tracking-wider flex items-center gap-1 shadow ${
                    isTargetedByEnemy
                      ? 'bg-[#E03E52] border-[#FFD166] text-white animate-pulse'
                      : isActiveTurnPlayer
                      ? 'bg-[#FFD166] border-[#FFF3C4] text-[#0B0A0E]'
                      : combatRoundPhase === 'PLAYER_PHASE' && hasActedThisRound
                      ? 'bg-[#173626] border-[#5EA87A] text-[#8EE6AE]'
                      : combatRoundPhase === 'PLAYER_PHASE'
                      ? 'bg-[#1F182B] border-[#D8C6A0]/50 text-[#D8C6A0]'
                      : 'bg-[#19111D] border-[#C93B5B]/60 text-[#FF758F]'
                  }`}
                >
                  {isTargetedByEnemy ? (
                    <span>◆ ¡OBJETIVO!</span>
                  ) : isActiveTurnPlayer ? (
                    <>
                      <Swords className="w-2.5 h-2.5" />
                      <span>
                        {isMe ? 'TU TURNO' : 'EN TURNO'} · ◆{currentTurnAp}/{maxTurnAp} AP
                      </span>
                    </>
                  ) : combatRoundPhase === 'PLAYER_PHASE' && hasActedThisRound ? (
                    <span>✓ ACTUÓ</span>
                  ) : combatRoundPhase === 'PLAYER_PHASE' ? (
                    <span>EN ESPERA</span>
                  ) : (
                    <span>FASE ENEMIGA</span>
                  )}
                </div>
              )}

              {/* Animated Pixel Character Bust (Click inspects player) */}
              <LaCriptaPixelTooltip
                title={`${player.name} (${charDef?.className || 'Aventurero'})`}
                category={isDead ? 'CAÍDO' : 'INSPECCIONAR HÉROE'}
                description={
                  eqWeapon && effStats
                    ? `Arma: ${eqWeapon.weapon.name} Nv.${eqWeapon.level} · ATQ ${effStats.attack} · DEF ${effStats.defense} · MAG ${effStats.magic}${
                        armorDef ? ` · ${armorDef.name}` : ''
                      }${accDef ? ` · ${accDef.name}` : ''}`
                    : 'Haz clic para inspeccionar atributos, equipo, técnicas y mochila.'
                }
                footerLabel="CLIC PARA ABRIR FICHA DE INSPECCIÓN"
                borderColor={charDef?.accentColor || '#E7A54A'}
              >
                <div
                  className="relative w-12 h-12 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center bg-[#09070D] border-2 overflow-visible"
                  style={{
                    borderColor: isDead
                      ? '#8F263D'
                      : isTargetedByEnemy
                      ? '#E03E52'
                      : isActiveTurnPlayer
                      ? '#FFD166'
                      : player.color,
                  }}
                >
                  {charId && charDef ? (
                    <div
                      className={`-mt-2.5 sm:-mt-3 pointer-events-none transition-all ${
                        isDead ? 'grayscale opacity-35' : ''
                      }`}
                    >
                      <LaCriptaPixelSprite
                        characterId={charId}
                        animationState={isDead ? 'idle' : animState}
                        size="hud"
                      />
                    </div>
                  ) : (
                    <span className="font-cripta-pixel text-base text-[#D8C6A0]/40">?</span>
                  )}

                  {isDead && (
                    <div className="absolute inset-0 bg-[#1A080E]/80 flex flex-col items-center justify-center">
                      <LaCriptaFallenSoulIcon size={16} />
                      <span className="text-[7px] font-cripta-pixel font-bold text-[#C93B5B]">
                        CAÍDO
                      </span>
                    </div>
                  )}

                  <span
                    className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border border-[#0B0A0E]"
                    style={{ backgroundColor: player.color }}
                  />
                </div>
              </LaCriptaPixelTooltip>

              {/* Right HUD Module: Player Name, Class, HP Strip, Statuses & Dedicated MOCHILA Control */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={`font-cripta-pixel text-xs font-bold uppercase truncate ${
                        isDead ? 'text-[#C93B5B] line-through' : 'text-[#F4EBD9]'
                      }`}
                    >
                      {player.name}
                    </span>
                    {charDef && (
                      <span
                        className="font-cripta-pixel text-[10px] font-bold uppercase truncate"
                        style={{ color: isDead ? '#C93B5B' : charDef.accentColor }}
                      >
                        · {charDef.className}
                      </span>
                    )}
                    {player.isHost && !isSolo && (
                      <Crown className="w-3 h-3 text-[#E7A54A] shrink-0" />
                    )}
                  </div>

                  {charDef && (
                    <div className="flex items-center gap-1.5 shrink-0 font-cripta-mono text-[10px]">
                      <LaCriptaPixelTooltip
                        title="Armadura y Defensa"
                        category="PROTECCIÓN"
                        description="Mitiga el daño físico recibido de los ataques enemigos."
                        footerLabel={`ARMADURA: ${player.armor}`}
                        borderColor="#69A8A5"
                      >
                        <span className="text-[#69A8A5] cursor-help">
                          DEF {player.armor}
                        </span>
                      </LaCriptaPixelTooltip>
                      <span className={isDead ? 'text-[#C93B5B] font-bold' : 'text-[#FFD166] font-bold'}>
                        {isDead ? `0/${player.maxHp}` : `${player.hp}/${player.maxHp}`} PV
                      </span>
                    </div>
                  )}
                </div>

                {/* Segmented Pixel HP Bar */}
                <div className="mt-1 flex items-center gap-1">
                  <span
                    className={`text-[10px] font-cripta-pixel leading-none shrink-0 ${
                      isDead ? 'text-[#8F263D]' : 'text-[#C93B5B]'
                    }`}
                  >
                    {isDead ? '†' : '♥'}
                  </span>
                  <div className="flex items-center gap-0.5 flex-1">
                    {Array.from({ length: hpSegmentsTotal }).map((_, segIdx) => {
                      const lit = charDef && !isDead ? segIdx < hpFilledSegments : false;
                      return (
                        <span
                          key={segIdx}
                          className="h-2 flex-1 border transition-colors duration-200"
                          style={{
                            backgroundColor: lit ? '#C93B5B' : '#09070D',
                            borderColor: lit ? '#E7A54A' : '#282039',
                          }}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Statuses & Dedicated MOCHILA / INSPECT Controls */}
                <div
                  className="mt-1 flex items-center justify-between gap-1 min-h-[20px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex flex-wrap items-center gap-1 min-w-0">
                    {!player.isConnected ? (
                      <span className="text-[8px] font-cripta-pixel text-[#C93B5B]">
                        RECONECTANDO...
                      </span>
                    ) : isDead ? (
                      <span className="text-[8px] font-cripta-pixel text-[#C93B5B] uppercase">
                        ESPERA RESURRECCIÓN
                      </span>
                    ) : (
                      <>
                        {player.isDefendingThisRound && (
                          <LaCriptaPixelTooltip
                            title="Guardia Firme"
                            category="DEFENSA"
                            description="Postura defensiva activa: reduce un 45% el daño recibido en esta ronda."
                            footerLabel="ACTIVO ESTA RONDA"
                            borderColor="#69A8A5"
                          >
                            <span className="px-1 py-0.1 bg-[#112328] border border-[#69A8A5] text-[8px] font-cripta-pixel text-[#69A8A5] cursor-help">
                              GUARDIA
                            </span>
                          </LaCriptaPixelTooltip>
                        )}
                        {player.statuses.slice(0, 4).map((st) => (
                          <LaCriptaStatusEffectBadge key={st.id} status={st} />
                        ))}
                      </>
                    )}
                  </div>

                  {/* Right Side: Dedicated MOCHILA Button for Local Player (or Inspect Pill for Teammate) */}
                  <div className="flex items-center gap-1 shrink-0">
                    {charDef && isExploreOrBossPhase && isMe && onOpenInventory && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          laCriptaAudio.playStoneClick();
                          onOpenInventory();
                        }}
                        className={`px-2 py-0.5 border font-cripta-pixel text-[9px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                          isInventoryOpen
                            ? 'bg-[#2A1D10] border-[#FFD166] text-[#FFD166] shadow-[0_0_10px_rgba(255,209,102,0.35)]'
                            : 'bg-[#1A1325] hover:bg-[#261B36] border-[#E7A54A]/80 text-[#F4EBD9]'
                        }`}
                      >
                        <HudBackpackPixelIcon size={12} />
                        <span>MOCHILA</span>
                        <span className="px-1 bg-[#09070D] border border-[#4A3B5C] text-[#FFD166] font-cripta-mono text-[9px]">
                          {normalInv.length}
                        </span>
                      </button>
                    )}

                    {charDef && isExploreOrBossPhase && !isMe && onInspectPlayer && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          laCriptaAudio.playStoneClick();
                          onInspectPlayer(player.id);
                        }}
                        className="px-1.5 py-0.5 bg-[#161021] hover:bg-[#231A34] border border-[#4A3B5C] text-[8px] font-cripta-pixel text-[#D8C6A0] hover:text-[#FFD166] flex items-center gap-1 cursor-pointer"
                      >
                        <HudBackpackPixelIcon size={11} />
                        <span>{normalInv.length}</span>
                      </button>
                    )}

                    {!isSolo && votedDoorId && expeditionState.phase === 'THREE_DOORS' && (
                      <span className="inline-flex items-center gap-0.5 text-[8px] font-cripta-pixel text-[#E7A54A]">
                        <Sparkles className="w-2.5 h-2.5" />
                        SELLO
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
