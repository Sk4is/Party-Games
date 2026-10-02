import React, { useEffect, useRef, useState } from 'react';
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
import {
  getClassMechanicForCharacter,
  getPlayerClassMechanicHudState,
} from '../../data/la-cripta/criptaClassMechanics';
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
  presentedPlayerHp?: Record<string, { hp: number; trailHp: number }>;
  playerCardImpacts?: Record<
    string,
    'DAMAGE' | 'HEAL' | 'SHIELD' | 'BUFF' | 'DEBUFF' | 'ANTICIPATION'
  >;
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
  onOpenStatusCodex?: () => void;
  activeTargetedPlayerIdsDuringPresentation?: string[];
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
  onOpenStatusCodex,
}) => {
  const [copied, setCopied] = useState(false);
  const [muted, setMuted] = useState(() => laCriptaAudio.isMuted());
  const [masterVol, setMasterVol] = useState(() => laCriptaAudio.getMasterVolume());
  const [inspectedRelic, setInspectedRelic] = useState<CriptaAcquiredRelic | null>(null);

  useEffect(() => {
    return laCriptaAudio.subscribe(() => {
      setMuted(laCriptaAudio.isMuted());
      setMasterVol(laCriptaAudio.getMasterVolume());
    });
  }, []);

  // 60 FPS Animated Gold Counter & Treasury Pulse (Priority 12)
  const authoritativeGold = expeditionState.partyGold ?? 0;
  const [displayedGold, setDisplayedGold] = useState<number>(authoritativeGold);
  const [goldDeltaBadge, setGoldDeltaBadge] = useState<{
    delta: number;
    key: number;
  } | null>(null);
  const [impactPulseActive, setImpactPulseActive] = useState(false);
  const prevGoldRef = useRef<number>(authoritativeGold);
  const goldCounterRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onCoinImpact = () => {
      setImpactPulseActive(true);
      const timer = window.setTimeout(() => setImpactPulseActive(false), 520);
      return () => window.clearTimeout(timer);
    };
    window.addEventListener('cripta-gold-counter-impact', onCoinImpact);
    return () => window.removeEventListener('cripta-gold-counter-impact', onCoinImpact);
  }, []);

  useEffect(() => {
    const prev = prevGoldRef.current;
    if (authoritativeGold === prev) return;
    const delta = authoritativeGold - prev;
    prevGoldRef.current = authoritativeGold;

    setGoldDeltaBadge({ delta, key: Date.now() });
    const badgeTimer = window.setTimeout(() => {
      setGoldDeltaBadge(null);
    }, 1800);

    let rafId = 0;
    let delayTimer = 0;
    const startVal = displayedGold;
    const endVal = authoritativeGold;
    // When gaining gold, wait briefly (~420ms) as the flying coins travel toward the GOLD counter before rolling the digits up
    const startDelayMs = delta > 0 ? 420 : 0;
    const duration = 560;

    delayTimer = window.setTimeout(() => {
      if (delta > 0) {
        setImpactPulseActive(true);
        window.setTimeout(() => setImpactPulseActive(false), 480);
      }
      const startTime = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - startTime) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        setDisplayedGold(Math.round(startVal + (endVal - startVal) * eased));
        if (t < 1) {
          rafId = window.requestAnimationFrame(step);
        }
      };
      rafId = window.requestAnimationFrame(step);
    }, startDelayMs);

    return () => {
      window.clearTimeout(badgeTimer);
      window.clearTimeout(delayTimer);
      window.cancelAnimationFrame(rafId);
    };
  }, [authoritativeGold]);

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
    <header className="relative z-20 w-full border-b border-[#282039]/45 bg-[#06050A]/42 shrink-0">
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
              footerLabel={`DISPONIBLE: ${authoritativeGold} ORO`}
              borderColor="#E7A54A"
            >
              <div
                ref={goldCounterRef}
                id="cripta-gold-counter-hud"
                data-reward-target="gold"
                data-cripta-gold-counter="true"
                className={`relative inline-flex items-center gap-1.5 px-2.5 py-1 border font-cripta-mono text-xs font-extrabold cursor-help transition-all duration-300 ${
                  impactPulseActive
                    ? 'bg-[#463012] border-[#FFF3C4] text-[#FFFFFF] scale-112 ring-2 ring-[#FFD166] shadow-[0_0_26px_rgba(255,209,102,0.95)]'
                    : goldDeltaBadge
                    ? goldDeltaBadge.delta > 0
                      ? 'bg-[#35240E] border-[#FFD166] text-[#FFF3C4] scale-105 ring-1 ring-[#FFD166] shadow-[0_0_18px_rgba(255,209,102,0.75)]'
                      : 'bg-[#2E111B] border-[#C93B5B] text-[#FF8FA3] scale-105'
                    : 'bg-[#1D140C] border-[#E7A54A] text-[#FFD166]'
                }`}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  shapeRendering="crispEdges"
                  className="shrink-0"
                >
                  <rect x="3" y="1" width="6" height="10" fill="#B66E19" />
                  <rect x="2" y="2" width="8" height="8" fill="#E7A54A" />
                  <rect x="3" y="2" width="6" height="8" fill="#FFD166" />
                  <rect x="5" y="3" width="2" height="6" fill="#FFF3C4" />
                </svg>
                <span>{displayedGold} ORO</span>

                {goldDeltaBadge && (
                  <span
                    key={goldDeltaBadge.key}
                    className={`pointer-events-none absolute -bottom-6 right-0 px-2 py-0.5 border text-[10px] font-cripta-pixel font-black whitespace-nowrap shadow-lg animate-cripta-float-up z-50 ${
                      goldDeltaBadge.delta > 0
                        ? 'bg-[#1B1308] border-[#FFD166] text-[#FFD166]'
                        : 'bg-[#260D16] border-[#C93B5B] text-[#FF8FA3]'
                    }`}
                  >
                    {goldDeltaBadge.delta > 0
                      ? `+${goldDeltaBadge.delta} ORO`
                      : `${goldDeltaBadge.delta} ORO`}
                  </span>
                )}
              </div>
            </LaCriptaPixelTooltip>
          )}

          {onOpenStatusCodex && (
            <button
              type="button"
              data-ui-target="statuses"
              onClick={() => {
                laCriptaAudio.playStoneClick();
                onOpenStatusCodex();
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#16101E] hover:bg-[#261B38] border border-[#9B72CF]/70 hover:border-[#FFD166] text-[10px] font-cripta-pixel font-bold text-[#E0AAFF] hover:text-[#FFD166] transition-colors cursor-pointer"
              title="Abrir Códice de Estados, Ventajas, Desventajas y Efectos"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 12 12"
                shapeRendering="crispEdges"
                className="shrink-0"
              >
                <rect x="2" y="1" width="8" height="10" fill="#7656A8" />
                <rect x="3" y="2" width="6" height="8" fill="#181126" />
                <rect x="4" y="4" width="4" height="1" fill="#FFD166" />
                <rect x="4" y="6" width="4" height="1" fill="#E0AAFF" />
                <rect x="4" y="8" width="3" height="1" fill="#E0AAFF" />
              </svg>
              <span>? ESTADOS</span>
            </button>
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

          {/* Master Volume Control (0-100% slider + quick mute/unmute toggle) */}
          <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-[#16101E] border border-[#282039]">
            <button
              type="button"
              onClick={handleToggleMute}
              aria-label={muted ? 'Activar sonido' : 'Silenciar sonido'}
              title={muted ? 'Activar sonido' : 'Silenciar rápido'}
              className="inline-flex items-center gap-1 text-[#D8C6A0] hover:text-[#FFD166] transition-colors cursor-pointer"
            >
              {muted ? (
                <VolumeX className="w-3.5 h-3.5 text-[#8F263D]" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-[#E7A54A]" />
              )}
              <span className="hidden xl:inline font-cripta-pixel text-[9px] font-bold text-[#D8C6A0] tracking-wider">
                VOLUMEN
              </span>
            </button>

            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={muted ? 0 : Math.round(masterVol * 100)}
              aria-label="Volumen maestro de La Cripta"
              onChange={(e) => {
                const pct = Number.parseInt(e.target.value, 10);
                const nextVol = Math.max(0, Math.min(100, Number.isFinite(pct) ? pct : 65)) / 100;
                laCriptaAudio.setMasterVolume(nextVol);
              }}
              className="w-14 sm:w-20 h-1.5 accent-[#E7A54A] bg-[#09070D] cursor-pointer"
            />

            <span className="font-cripta-mono text-[9px] font-bold text-[#FFD166] min-w-[28px] text-right">
              {muted ? '0%' : `${Math.round(masterVol * 100)}%`}
            </span>
          </div>

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
  presentedPlayerHp = {},
  playerCardImpacts = {},
  onOpenInventory,
  isInventoryOpen = false,
  onInspectPlayer,
  inspectedPlayerId = null,
  activeTargetedPlayerIdsDuringPresentation = [],
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
  const activeTargetedPlayerIds = [
    ...(activeRoom?.activeTargetedPlayerIds || []),
    ...activeTargetedPlayerIdsDuringPresentation,
  ];
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
          const cardImpact = playerCardImpacts[player.id];
          const presentedHpObj = presentedPlayerHp[player.id];
          const displayedHp = presentedHpObj ? presentedHpObj.hp : player.hp;
          const displayedTrailHp = presentedHpObj ? presentedHpObj.trailHp : player.hp;

          const isDead = Boolean(
            (player.isDead || (charDef && player.maxHp > 0 && player.hp <= 0)) &&
              displayedHp <= 0
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
            !isDead &&
            hasLivingEnemies &&
            (activeTargetedPlayerIds.includes(player.id) ||
              Boolean(
                combatRoundPhase === 'PLAYER_PHASE' &&
                  activeRoom?.enemies?.some(
                    (en) => en.hp > 0 && en.lastTargetedPlayerIds?.includes(player.id)
                  )
              ));
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
                    Math.round((displayedHp / Math.max(1, player.maxHp)) * hpSegmentsTotal)
                  )
                )
              : 0;
          const hpTrailSegments =
            charDef && player.maxHp > 0 && !isDead
              ? Math.max(
                  hpFilledSegments,
                  Math.min(
                    hpSegmentsTotal,
                    Math.round((displayedTrailHp / Math.max(1, player.maxHp)) * hpSegmentsTotal)
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
              data-player-hud-card={player.id}
              onClick={() => {
                if (onInspectPlayer) {
                  laCriptaAudio.playStoneClick();
                  onInspectPlayer(player.id);
                }
              }}
              className={`relative flex items-center gap-2.5 px-2.5 sm:px-3 py-1.5 border-2 transition-all duration-150 ${
                onInspectPlayer ? 'cursor-pointer' : ''
              } ${
                cardImpact === 'DAMAGE'
                  ? 'bg-[#3B0C18] translate-y-1 ring-2 ring-[#FF4D6D]'
                  : cardImpact === 'SHIELD'
                  ? 'bg-[#0F2A30] -translate-y-1 ring-2 ring-[#7BDFF2]'
                  : cardImpact === 'HEAL'
                  ? 'bg-[#0E291C] -translate-y-1 ring-2 ring-[#5EA87A]'
                  : cardImpact === 'BUFF' || cardImpact === 'ANTICIPATION'
                  ? 'bg-[#281C10] -translate-y-1.5 ring-2 ring-[#FFD166]'
                  : cardImpact === 'DEBUFF'
                  ? 'bg-[#26102A] translate-y-0.5 ring-2 ring-[#9B72CF]'
                  : isInspected
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
                borderColor:
                  cardImpact === 'DAMAGE'
                    ? '#FF4D6D'
                    : cardImpact === 'SHIELD'
                    ? '#7BDFF2'
                    : cardImpact === 'HEAL'
                    ? '#5EA87A'
                    : cardImpact === 'BUFF' || cardImpact === 'ANTICIPATION'
                    ? '#FFD166'
                    : isInspected
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
                boxShadow:
                  cardImpact === 'DAMAGE'
                    ? 'inset 0 0 26px rgba(255,77,109,0.55), 0 0 22px rgba(201,59,91,0.65)'
                    : cardImpact === 'SHIELD'
                    ? 'inset 0 0 24px rgba(123,223,242,0.4), 0 0 18px rgba(105,168,165,0.55)'
                    : cardImpact === 'HEAL'
                    ? 'inset 0 0 24px rgba(94,168,122,0.45), 0 0 18px rgba(94,168,122,0.55)'
                    : isActiveTurnPlayer
                    ? 'inset 0 0 22px rgba(255,209,102,0.22), 0 0 18px rgba(231,165,74,0.45)'
                    : '0 4px 14px rgba(0,0,0,0.85)',
              }}
            >
              {/* Spatial Floating Gameplay Feedback Popups Directly Around THIS Player's HUD Card */}
              {playerEvents.length > 0 && (
                <div className="pointer-events-none absolute -top-10 inset-x-0 z-40 flex flex-col items-center gap-1">
                  {playerEvents.slice(-3).map((ev, idx) => (
                    <LaCriptaFloatingEventBadge key={ev.id} event={ev} indexOffset={idx} />
                  ))}
                </div>
              )}

              {/* Active Turn / Readiness / Fallen Tag */}
              {isDead && isExploreOrBossPhase ? (
                <div className="pointer-events-none absolute -top-2.5 right-2 z-30 px-1.5 py-0.5 bg-[#2A0E17] border border-[#C93B5B] text-[8px] font-cripta-pixel font-bold text-[#FF8FA3] tracking-wider flex items-center gap-1 shadow">
                  <span>☠ CAÍDO · 0 PV</span>
                </div>
              ) : (
                !isDead &&
                hasLivingEnemies &&
                isExploreOrBossPhase && (
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
                )
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
                  className={`relative w-12 h-12 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center bg-[#09070D] border-2 overflow-visible transition-transform duration-150 ${
                    cardImpact === 'DAMAGE'
                      ? 'translate-x-1 translate-y-0.5'
                      : cardImpact === 'ANTICIPATION'
                      ? '-translate-y-1 scale-105'
                      : ''
                  }`}
                  style={{
                    borderColor:
                      cardImpact === 'DAMAGE'
                        ? '#FF4D6D'
                        : cardImpact === 'SHIELD'
                        ? '#7BDFF2'
                        : cardImpact === 'HEAL'
                        ? '#5EA87A'
                        : isDead
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
                        classResource={player.classResource}
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

                  {charDef && effStats && (
                    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 font-cripta-mono text-[10px]">
                      <LaCriptaPixelTooltip
                        title="Ataque Físico"
                        category="ATRIBUTO DE COMBATE"
                        description={`Potencia el daño de armas físicas y técnicas marciales (Base ${charDef.stats.attack}${
                          effStats.attack > charDef.stats.attack
                            ? ` +${effStats.attack - charDef.stats.attack} bono`
                            : ''
                        }).`}
                        footerLabel={`ATAQUE EFECTIVO: ${effStats.attack}`}
                        borderColor="#E7A54A"
                      >
                        <span className="inline-flex items-center gap-0.5 px-1 py-0.2 bg-[#1D130E] border border-[#E7A54A]/45 text-[#FFD166] cursor-help">
                          <svg width="8" height="8" viewBox="0 0 8 8" shapeRendering="crispEdges">
                            <rect x="5" y="1" width="2" height="2" fill="#FFD166" />
                            <rect x="3" y="3" width="2" height="2" fill="#E7A54A" />
                            <rect x="1" y="5" width="2" height="2" fill="#D9D0BC" />
                          </svg>
                          <span>{effStats.attack}</span>
                        </span>
                      </LaCriptaPixelTooltip>

                      <LaCriptaPixelTooltip
                        title="Armadura y Defensa"
                        category="ATRIBUTO DE COMBATE"
                        description={`Mitiga el daño físico directo recibido (Armadura actual: ${player.armor} · Defensa efectiva: ${effStats.defense}).`}
                        footerLabel={`DEFENSA EFECTIVA: ${effStats.defense}`}
                        borderColor="#69A8A5"
                      >
                        <span className="inline-flex items-center gap-0.5 px-1 py-0.2 bg-[#0F1E22] border border-[#69A8A5]/45 text-[#7BDFF2] cursor-help">
                          <svg width="8" height="8" viewBox="0 0 8 8" shapeRendering="crispEdges">
                            <rect x="1" y="1" width="6" height="4" fill="#69A8A5" />
                            <rect x="2" y="5" width="4" height="2" fill="#7BDFF2" />
                            <rect x="3" y="7" width="2" height="1" fill="#D9F2F0" />
                          </svg>
                          <span>{effStats.defense}</span>
                        </span>
                      </LaCriptaPixelTooltip>

                      <LaCriptaPixelTooltip
                        title="Poder Mágico y Alquímico"
                        category="ATRIBUTO DE COMBATE"
                        description={`Potencia hechizos arcanos, plegarias sagradas, curaciones y fórmulas alquímicas (Base ${charDef.stats.magic}${
                          effStats.magic > charDef.stats.magic
                            ? ` +${effStats.magic - charDef.stats.magic} bono`
                            : ''
                        }).`}
                        footerLabel={`MAGIA EFECTIVA: ${effStats.magic}`}
                        borderColor="#9B72CF"
                      >
                        <span className="inline-flex items-center gap-0.5 px-1 py-0.2 bg-[#1A1126] border border-[#9B72CF]/45 text-[#D8B4F8] cursor-help">
                          <svg width="8" height="8" viewBox="0 0 8 8" shapeRendering="crispEdges">
                            <rect x="3" y="0" width="2" height="8" fill="#9B72CF" />
                            <rect x="0" y="3" width="8" height="2" fill="#9B72CF" />
                            <rect x="3" y="3" width="2" height="2" fill="#FFF3C4" />
                          </svg>
                          <span>{effStats.magic}</span>
                        </span>
                      </LaCriptaPixelTooltip>

                      <span
                        className={`ml-0.5 ${
                          isDead
                            ? 'text-[#C93B5B] font-bold'
                            : cardImpact === 'DAMAGE'
                            ? 'text-[#FF4D6D] font-black'
                            : cardImpact === 'HEAL'
                            ? 'text-[#6EE7B7] font-black'
                            : 'text-[#FFD166] font-bold'
                        }`}
                      >
                        {isDead ? `0/${player.maxHp}` : `${displayedHp}/${player.maxHp}`} PV
                      </span>
                    </div>
                  )}
                </div>

                {/* Segmented Pixel HP Bar with Trailing Damage Strip */}
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
                      const isTrailSegment =
                        charDef && !isDead && !lit && segIdx < hpTrailSegments;
                      return (
                        <span
                          key={segIdx}
                          className="h-2 flex-1 border transition-colors duration-300"
                          style={{
                            backgroundColor: lit
                              ? cardImpact === 'HEAL'
                                ? '#5EA87A'
                                : '#C93B5B'
                              : isTrailSegment
                              ? '#FFD166'
                              : '#09070D',
                            borderColor:
                              lit || isTrailSegment ? '#E7A54A' : '#282039',
                          }}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Universal 9-Class Core Mechanic Strip (GUARDIA, CARGA ARCANA, COMBO, ACECHO, FERVOR, REACTIVOS, FURIA, COMPÁS, ESENCIA) */}
                {(() => {
                  const mechHud = !isDead ? getPlayerClassMechanicHudState(player) : null;
                  const mechDef = getClassMechanicForCharacter(player.characterId);
                  if (!mechHud || !mechDef) return null;
                  return (
                    <LaCriptaPixelTooltip
                      title={`${mechHud.iconSymbol} ${mechDef.name} (${mechHud.current}/${mechHud.max})`}
                      category={`MECÁNICA DE CLASE · ${charDef?.className || ''}`}
                      description={`${mechDef.shortDescription} | GANAR: ${mechDef.howToGain} | USAR: ${mechDef.howToSpendOrTrigger}`}
                      footerLabel={`${mechHud.stateBadge} · ${mechHud.bonusSummary}`}
                      borderColor={mechHud.colorHex}
                    >
                      <div
                        className="mt-1 flex items-center justify-between gap-1.5 px-1.5 py-0.5 bg-[#0A0710] border transition-colors cursor-help"
                        style={{
                          borderColor: mechHud.isReadyOrThreshold
                            ? `${mechHud.colorHex}B0`
                            : '#282039',
                          boxShadow: mechHud.isReadyOrThreshold
                            ? `0 0 8px ${mechHud.colorHex}30`
                            : undefined,
                        }}
                      >
                        <span
                          className="text-[8px] font-cripta-pixel font-bold uppercase tracking-wider shrink-0 flex items-center gap-1"
                          style={{ color: mechHud.colorHex }}
                        >
                          <span>{mechHud.iconSymbol}</span>
                          <span>{mechHud.shortLabel}</span>
                          <span className="text-[#F4EBD9] font-cripta-mono">
                            {mechHud.pipsText}
                          </span>
                        </span>

                        {mechHud.kind === 'FURIA' ? (
                          <div className="flex-1 flex items-center gap-1.5 max-w-[110px]">
                            <div className="flex-1 h-1.5 bg-[#050408] border border-[#451A1C] overflow-hidden relative">
                              <div
                                className="h-full transition-all duration-300"
                                style={{
                                  width: `${Math.min(100, mechHud.current)}%`,
                                  backgroundColor:
                                    mechHud.current >= 75
                                      ? '#EF4444'
                                      : mechHud.current >= 50
                                      ? '#F97316'
                                      : '#D97706',
                                }}
                              />
                            </div>
                          </div>
                        ) : null}

                        <span
                          className={`text-[7.5px] font-cripta-mono font-bold uppercase px-1 py-0.1 border truncate ${
                            mechHud.isReadyOrThreshold
                              ? 'bg-[#2A1B0E] border-[#FFD166]/80 text-[#FFD166]'
                              : 'bg-[#120D1B] border-[#282039] text-[#D8C6A0]/80'
                          }`}
                        >
                          {mechHud.stateBadge}
                        </span>
                      </div>
                    </LaCriptaPixelTooltip>
                  );
                })()}

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
                        {(player.statuses || []).slice(0, 4).map((st) => (
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
                          {normalInv.reduce((sum, st) => sum + (st.quantity || 1), 0)}/{player.inventoryCapacity || 6}
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
