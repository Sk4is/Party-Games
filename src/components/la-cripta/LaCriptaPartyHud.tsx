import React, { useState } from 'react';
import { Copy, Check, Volume2, VolumeX, LogOut, Crown, Sparkles, Swords } from 'lucide-react';
import {
  CriptaAcquiredRelic,
  CriptaExpeditionState,
  CriptaSpriteAnimationState,
  CriptaVisualEvent,
} from '../../types/laCripta';
import { CRIPTA_CHARACTERS_CATALOG } from '../../data/la-cripta/criptaCatalog';
import { CRIPTA_CONSUMABLES_BY_ID } from '../../data/la-cripta/criptaItemsAndRelics';
import { laCriptaAudio } from '../../utils/laCriptaAudio';
import { LaCriptaPixelSprite } from './LaCriptaPixelSprite';
import {
  LaCriptaFallenSoulIcon,
  LaCriptaStatusEffectBadge,
} from './LaCriptaStatusEffectBadge';
import { LaCriptaFloatingEventBadge } from './LaCriptaVisualFeedback';
import {
  LaCriptaPartyRelicsBar,
  LaCriptaPlayerInventoryBar,
  LaCriptaRelicDetailModal,
} from './LaCriptaItemRelicArt';

interface LaCriptaPartyHudProps {
  expeditionState: CriptaExpeditionState;
  currentPlayerId: string;
  onLeaveExpedition: () => void;
  onReturnToLobby?: () => void;
  playerAnimationStates?: Record<string, CriptaSpriteAnimationState>;
  activeVisualEvents?: CriptaVisualEvent[];
  onUseConsumable?: (slotIndex: number, targetEnemyId?: string, targetPlayerId?: string) => void;
  selectedTargetEnemyId?: string | null;
}

/**
 * Top utility bar for room code, phase status, audio mute, and leaving/returning to camp.
 */
export const LaCriptaTopBar: React.FC<LaCriptaPartyHudProps> = ({
  expeditionState,
  currentPlayerId,
  onLeaveExpedition,
  onReturnToLobby,
}) => {
  const [copied, setCopied] = useState(false);
  const [muted, setMuted] = useState(() => laCriptaAudio.isMuted());

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

  return (
    <header className="relative z-30 w-full border-b-2 border-[#282039] bg-[#0B0A0E]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-base sm:text-lg animate-cripta-torch select-none">🕯️</span>
            <span className="font-cripta-display text-sm sm:text-base font-extrabold tracking-widest text-[#D8C6A0]">
              LA CRIPTA
            </span>
          </div>

          <span className="text-[#7656A8] select-none">·</span>

          <button
            type="button"
            onClick={handleCopyCode}
            title="Copiar código de expedición"
            className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#19111D] hover:bg-[#282039] border border-[#D8C6A0]/30 hover:border-[#E7A54A] text-xs font-cripta-pixel text-[#D9D0BC] transition-colors cursor-pointer"
          >
            <span className="text-[#D8C6A0]/70">SALA:</span>
            <span className="text-[#E7A54A] font-bold tracking-widest">{displayCode}</span>
            {copied ? (
              <Check className="w-3.5 h-3.5 text-[#69A8A5]" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-[#D8C6A0]/70 group-hover:text-[#E7A54A]" />
            )}
          </button>

          <span className="hidden md:inline text-[11px] font-cripta-pixel text-[#D9D0BC]/65">
            {expeditionState.phase === 'LOBBY' && 'PREPARACIÓN DE LA EXPEDICIÓN'}
            {expeditionState.phase === 'THREE_DOORS' &&
              ((expeditionState.completedDoorCount ?? 0) >= 3
                ? 'EL CORAZÓN DE LA CRIPTA'
                : `LAS TRES PUERTAS · (${expeditionState.completedDoorCount ?? 0}/3 SUPERADAS)`)}
            {expeditionState.phase === 'RETURNING_TO_DOORS' && 'REGRESANDO A LAS TRES PUERTAS...'}
            {(expeditionState.phase === 'ENTERING_DUNGEON' ||
              expeditionState.phase === 'DOOR_OPENING') &&
              'ABRIENDO SELLOS ANCESTRALES...'}
            {expeditionState.phase === 'FINAL_BOSS_ENTRANCE' &&
              'DESBLOQUEANDO EL CORAZÓN DE LA CRIPTA...'}
            {expeditionState.phase === 'FINAL_BOSS_COMBAT' &&
              `JEFE FINAL · FASE ${expeditionState.finalBossPhase ?? 1}`}
            {expeditionState.phase === 'RUN_VICTORY' && '¡EXPEDICIÓN VICTORIOSA!'}
            {(expeditionState.phase === 'DUNGEON' ||
              expeditionState.phase === 'DUNGEON_ARRIVAL') &&
              `PUERTA ${Math.min(3, (expeditionState.completedDoorCount ?? 0) + 1)}/3 · SALA ${
                (expeditionState.currentRoomIndex ?? 0) + 1
              }${
                expeditionState.roomSequence?.length
                  ? `/${expeditionState.roomSequence.length}`
                  : ''
              }`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {expeditionState.phase !== 'LOBBY' && isHost && onReturnToLobby && (
            <button
              type="button"
              onClick={() => {
                laCriptaAudio.playStoneClick();
                onReturnToLobby();
              }}
              className="px-2.5 py-1 rounded bg-[#19111D] hover:bg-[#282039] border border-[#7656A8]/50 hover:border-[#E7A54A] text-[11px] font-cripta-pixel text-[#D8C6A0] transition-colors cursor-pointer"
            >
              PREPARACIÓN
            </button>
          )}

          <button
            type="button"
            onClick={handleToggleMute}
            className="p-1.5 rounded bg-[#19111D] hover:bg-[#282039] border border-[#282039] hover:border-[#D8C6A0]/40 text-[#D8C6A0] transition-colors cursor-pointer"
            title={muted ? 'Activar sonido' : 'Silenciar sonido'}
          >
            {muted ? (
              <VolumeX className="w-4 h-4 text-[#8F263D]" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#E7A54A]" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              laCriptaAudio.playStoneClick();
              onLeaveExpedition();
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#19111D] hover:bg-[#8F263D]/30 border border-[#8F263D]/50 hover:border-[#8F263D] text-xs font-cripta-pixel text-[#D9D0BC] transition-colors cursor-pointer"
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
 * Persistent BOTTOM Video-Game Party HUD (Requirements 13, 14, 15 + Phase 4 Inventory & Relics).
 * Displays up to 4 adventurers with animated pixel-art character silhouettes breaking slightly
 * above the ornamental dark-fantasy HUD frame, segmented pixel HP strip, identity, cursor colour,
 * 3-slot personal inventory, and shared party Relics bar.
 */
export const LaCriptaPartyHud: React.FC<LaCriptaPartyHudProps> = ({
  expeditionState,
  currentPlayerId,
  playerAnimationStates = {},
  activeVisualEvents = [],
  onUseConsumable,
  selectedTargetEnemyId,
}) => {
  const [inspectedRelic, setInspectedRelic] = useState<CriptaAcquiredRelic | null>(null);

  const orderedPlayers = [...expeditionState.players].sort((a, b) => a.seatIndex - b.seatIndex);
  const playerCount = orderedPlayers.length;
  const isSolo = playerCount === 1;
  const partyRelics = expeditionState.partyRelics || [];

  // Determine current room & active turn player if in dungeon combat
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
  const queuedPlayerActions = activeRoom?.queuedPlayerActions || {};
  const activeCombatActorId = activeRoom?.activeCombatActorId || null;
  const activeTargetedPlayerIds = activeRoom?.activeTargetedPlayerIds || [];
  const isExploreOrBossPhase =
    expeditionState.phase === 'DUNGEON' ||
    expeditionState.phase === 'DUNGEON_ARRIVAL' ||
    expeditionState.phase === 'FINAL_BOSS_COMBAT';

  const gridLayoutClass =
    playerCount <= 1
      ? 'max-w-md mx-auto grid grid-cols-1'
      : playerCount === 2
      ? 'max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4'
      : playerCount === 3
      ? 'max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4'
      : 'max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4';

  return (
    <aside
      aria-label={isSolo ? 'Panel del aventurero' : 'Grupo de aventureros'}
      className="relative z-30 w-full border-t-2 border-[#E7A54A]/35 bg-gradient-to-t from-[#07060A] via-[#0B0A0E] to-[#19111D]/95 pt-2.5 pb-2.5 px-3 sm:px-6 shadow-[0_-14px_38px_rgba(0,0,0,0.92)] select-none"
    >
      {/* Ornamental pixel-gold top trim line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[#E7A54A]/60 to-transparent" />

      {/* Shared Party Relics Strip (Objetos Clave / Reliquias) */}
      {partyRelics.length > 0 && (
        <div className="max-w-7xl mx-auto mb-2 flex items-center justify-center">
          <LaCriptaPartyRelicsBar
            relics={partyRelics}
            onInspectRelic={(rel) => setInspectedRelic(rel)}
          />
        </div>
      )}

      {inspectedRelic && (
        <LaCriptaRelicDetailModal
          relic={inspectedRelic}
          players={expeditionState.players}
          onClose={() => setInspectedRelic(null)}
        />
      )}

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
          const queuedAction = queuedPlayerActions[player.id];
          const hasLockedAction = Boolean(queuedAction?.locked);
          const isCurrentlyActing = !isDead && hasLivingEnemies && activeCombatActorId === player.id;
          const isTargetedByEnemy =
            !isDead && hasLivingEnemies && activeTargetedPlayerIds.includes(player.id);
          const isChoosingInPlayerPhase =
            !isDead &&
            hasLivingEnemies &&
            isExploreOrBossPhase &&
            combatRoundPhase === 'PLAYER_PHASE' &&
            !hasLockedAction;

          // Events targeting this player (plus party-wide gold/loot shown on current player's card or solo card)
          const playerEvents = activeVisualEvents.filter(
            (ev) =>
              (ev.targetType === 'PLAYER' && ev.targetId === player.id) ||
              (ev.targetType === 'PARTY' &&
                (ev.kind === 'GAIN_GOLD' || ev.kind === 'LOSE_GOLD' || ev.kind === 'LOOT_ITEM') &&
                (isSolo || isMe))
          );

          // Compute 10-segment pixel HP bar
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

          const bonusAtk = player.bonusAttack || 0;
          const bonusDef = player.bonusDefense || 0;
          const bonusMag = player.bonusMagic || 0;
          const items = player.inventoryItems || [];
          const normalInv = player.normalInventory || [];

          return (
            <div
              key={player.id}
              className={`relative flex items-center gap-2.5 sm:gap-3 px-2.5 sm:px-3.5 py-2 border-2 transition-all duration-200 ${
                isDead
                  ? 'bg-[#0F090E]'
                  : isTargetedByEnemy
                  ? 'bg-[#2E0D18] -translate-y-1 ring-2 ring-[#E03E52]/70'
                  : animState === 'hit' || animState === 'debuff'
                  ? 'bg-[#2B0E17] -translate-y-0.5'
                  : animState === 'heal' || animState === 'revive'
                  ? 'bg-[#0E2419] -translate-y-0.5'
                  : isCurrentlyActing || animState === 'attack' || animState === 'cast'
                  ? 'bg-[#22182E] -translate-y-1'
                  : 'bg-[#140F1A]'
              }`}
              style={{
                borderColor: isDead
                  ? '#8F263D'
                  : isTargetedByEnemy
                  ? '#E03E52'
                  : isCurrentlyActing
                  ? '#FFD166'
                  : hasLivingEnemies && hasLockedAction && combatRoundPhase === 'PLAYER_PHASE'
                  ? '#5EA87A'
                  : isChoosingInPlayerPhase && isMe
                  ? '#FFD166'
                  : charDef
                  ? isMe
                    ? '#E7A54A'
                    : charDef.accentColor
                  : isMe
                  ? player.color
                  : '#282039',
                boxShadow: isDead
                  ? 'inset 0 0 22px rgba(143,38,61,0.3), 0 4px 16px rgba(0,0,0,0.9)'
                  : isTargetedByEnemy
                  ? 'inset 0 0 26px rgba(224,62,82,0.4), 0 0 20px rgba(224,62,82,0.55)'
                  : isCurrentlyActing
                  ? 'inset 0 0 22px rgba(255,209,102,0.28), 0 0 18px rgba(231,165,74,0.45)'
                  : hasLivingEnemies && hasLockedAction && combatRoundPhase === 'PLAYER_PHASE'
                  ? 'inset 0 0 18px rgba(94,168,122,0.22), 0 4px 16px rgba(0,0,0,0.85)'
                  : isMe
                  ? `inset 0 0 18px ${player.color}22, 0 4px 16px rgba(0,0,0,0.85)`
                  : '0 4px 16px rgba(0,0,0,0.85)',
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

              {/* Round Combat Readiness / Enemy Target / Active Resolution Tag */}
              {!isDead && hasLivingEnemies && isExploreOrBossPhase && (
                <div
                  className={`pointer-events-none absolute -top-2.5 right-2 z-30 px-1.5 py-0.5 border text-[8px] font-cripta-pixel font-bold tracking-wider flex items-center gap-1 shadow ${
                    isTargetedByEnemy
                      ? 'bg-[#E03E52] border-[#FFD166] text-white animate-pulse'
                      : isCurrentlyActing
                      ? 'bg-[#FFD166] border-[#FFF3C4] text-[#0B0A0E]'
                      : combatRoundPhase === 'PLAYER_PHASE' && hasLockedAction
                      ? 'bg-[#173626] border-[#5EA87A] text-[#8EE6AE]'
                      : combatRoundPhase === 'PLAYER_PHASE' && isMe
                      ? 'bg-[#E7A54A] border-[#FFF3C4] text-[#0B0A0E]'
                      : combatRoundPhase === 'PLAYER_PHASE'
                      ? 'bg-[#1F182B] border-[#D8C6A0]/50 text-[#D8C6A0]'
                      : 'bg-[#19111D] border-[#7656A8]/50 text-[#D8C6A0]/80'
                  }`}
                >
                  {isTargetedByEnemy ? (
                    <>
                      <span>🎯</span>
                      <span>¡OBJETIVO!</span>
                    </>
                  ) : isCurrentlyActing ? (
                    <>
                      <Swords className="w-2.5 h-2.5" />
                      <span>ACTUANDO</span>
                    </>
                  ) : combatRoundPhase === 'PLAYER_PHASE' && hasLockedAction ? (
                    <span>LISTO ✓</span>
                  ) : combatRoundPhase === 'PLAYER_PHASE' && isMe ? (
                    <>
                      <Swords className="w-2.5 h-2.5" />
                      <span>ELIGE TU ACCIÓN</span>
                    </>
                  ) : combatRoundPhase === 'PLAYER_PHASE' ? (
                    <span>PENSANDO...</span>
                  ) : (
                    <span>EN COMBATE</span>
                  )}
                </div>
              )}

              {/* Pixel corner rivets */}
              <span
                className="pointer-events-none absolute top-0.5 left-0.5 w-1.5 h-1.5"
                style={{ backgroundColor: isDead ? '#8F263D' : player.color }}
              />
              <span
                className="pointer-events-none absolute top-0.5 right-0.5 w-1.5 h-1.5"
                style={{ backgroundColor: isDead ? '#8F263D' : player.color }}
              />

              {/* Animated Pixel Character Bust — breaks slightly out of the top HUD frame */}
              <div
                className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 flex items-center justify-center bg-[#09070D] border-2 overflow-visible"
                style={{
                  borderColor: isDead
                    ? '#8F263D'
                    : isTargetedByEnemy
                    ? '#E03E52'
                    : isCurrentlyActing
                    ? '#FFD166'
                    : player.color,
                }}
              >
                {charId && charDef ? (
                  <div
                    className={`-mt-3 sm:-mt-4 pointer-events-none transition-all ${
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
                  <div className="flex flex-col items-center justify-center text-center p-1">
                    <span className="font-cripta-pixel text-base text-[#D8C6A0]/40 animate-pulse">
                      ?
                    </span>
                  </div>
                )}

                {/* Fallen / Dead Overlay on Portrait */}
                {isDead && (
                  <div className="absolute inset-0 bg-[#1A080E]/80 flex flex-col items-center justify-center gap-0.5 px-1 text-center">
                    <LaCriptaFallenSoulIcon size={18} />
                    <span className="text-[8px] font-cripta-pixel font-bold text-[#C93B5B] uppercase tracking-wider">
                      CAÍDO
                    </span>
                  </div>
                )}

                {/* Player Cursor Color Tag on Portrait Frame */}
                <span
                  className="absolute -bottom-1 -right-1 w-3 h-3 border border-[#0B0A0E]"
                  style={{ backgroundColor: player.color }}
                  title={`Color de puntero de ${player.name}`}
                />

                {!player.isConnected && (
                  <div className="absolute inset-0 bg-black/85 flex items-center justify-center px-1 text-center">
                    <span className="text-[8px] font-cripta-pixel text-[#C93B5B] uppercase">
                      OFFLINE
                    </span>
                  </div>
                )}
              </div>

              {/* Right HUD Module: Player Name, Class, 10-Block Pixel HP Strip & Statuses */}
              <div className="flex-1 min-w-0">
                {/* Row 1: Player Name + Host Crown + Armor & Stat Bonuses */}
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2 h-2 shrink-0"
                      style={{ backgroundColor: player.color }}
                    />
                    <span
                      className={`font-cripta-pixel text-xs sm:text-sm font-bold uppercase truncate ${
                        isDead ? 'text-[#C93B5B] line-through' : 'text-[#D9D0BC]'
                      }`}
                    >
                      {player.name}
                    </span>
                    {isMe && !isSolo && (
                      <span className="text-[9px] font-cripta-pixel text-[#E7A54A] shrink-0">
                        TÚ
                      </span>
                    )}
                    {player.isHost && !isSolo && (
                      <Crown
                        className="w-3 h-3 text-[#E7A54A] shrink-0"
                        title="Líder de la expedición"
                      />
                    )}
                  </div>

                  {charDef && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {bonusAtk > 0 && (
                        <span
                          className="font-cripta-mono text-[9px] text-[#E7A54A]"
                          title={`Bonificación de Ataque: +${bonusAtk}`}
                        >
                          ⚔+{bonusAtk}
                        </span>
                      )}
                      {bonusMag > 0 && (
                        <span
                          className="font-cripta-mono text-[9px] text-[#9B72CF]"
                          title={`Bonificación de Magia: +${bonusMag}`}
                        >
                          ✦+{bonusMag}
                        </span>
                      )}
                      <span
                        className="font-cripta-mono text-[10px] text-[#69A8A5]"
                        title={
                          bonusDef > 0
                            ? `Armadura actual (${player.armor}) · Bonificación Defensa +${bonusDef}`
                            : 'Armadura actual'
                        }
                      >
                        🛡 {player.armor}
                      </span>
                    </div>
                  )}
                </div>

                {/* Row 2: Selected Class or Choosing State */}
                <div className="mt-0.5 flex items-center justify-between gap-1">
                  {charDef ? (
                    <span
                      className="font-cripta-pixel text-[10px] sm:text-[11px] font-bold uppercase tracking-wider truncate"
                      style={{ color: isDead ? '#C93B5B' : charDef.accentColor }}
                    >
                      {isDead ? `${charDef.className} · CAÍDO` : charDef.className}
                    </span>
                  ) : (
                    <span className="font-cripta-pixel text-[10px] text-[#D8C6A0]/50 uppercase tracking-wider truncate">
                      SIN ELEGIR
                    </span>
                  )}

                  {charDef && (
                    <span
                      className={`font-cripta-mono text-[10px] shrink-0 ${
                        isDead ? 'text-[#C93B5B] font-bold' : 'text-[#D8C6A0]'
                      }`}
                    >
                      {isDead ? `0/${player.maxHp} PV` : `${player.hp}/${player.maxHp} PV`}
                    </span>
                  )}
                </div>

                {/* Row 3: Pixel-Art Segmented HP Bar (♥ ████████░░) */}
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-cripta-pixel leading-none shrink-0 ${
                      isDead ? 'text-[#8F263D]' : 'text-[#C93B5B]'
                    }`}
                  >
                    {isDead ? '☠' : '♥'}
                  </span>
                  <div className="flex items-center gap-0.5 flex-1">
                    {Array.from({ length: hpSegmentsTotal }).map((_, segIdx) => {
                      const lit = charDef && !isDead ? segIdx < hpFilledSegments : false;
                      return (
                        <span
                          key={segIdx}
                          className="h-2 sm:h-2.5 flex-1 border transition-colors duration-200"
                          style={{
                            backgroundColor: lit ? '#C93B5B' : '#09070D',
                            borderColor: lit
                              ? '#E7A54A'
                              : isDead
                              ? '#541826'
                              : '#282039',
                          }}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Row 4: Interactive Pixel Status Effects, 3-Slot Personal Inventory & Door Vote Seal */}
                <div className="mt-1.5 flex items-center justify-between gap-1.5 min-h-[20px]">
                  <div className="flex flex-wrap items-center gap-1 min-w-0">
                    {!player.isConnected ? (
                      <span className="text-[9px] font-cripta-pixel text-[#C93B5B]">
                        RECONECTANDO...
                      </span>
                    ) : isDead ? (
                      <span className="text-[9px] font-cripta-pixel text-[#C93B5B] uppercase">
                        SIN VIDA · ESPERA RESURRECCIÓN
                      </span>
                    ) : (
                      <>
                        {player.isDefendingThisRound && (
                          <span
                            className="inline-flex items-center gap-0.5 px-1 py-0.2 bg-[#112328] border border-[#69A8A5] text-[8px] font-cripta-pixel text-[#69A8A5]"
                            title="Postura defensiva activa en esta ronda"
                          >
                            🛡 DEFENSA
                          </span>
                        )}
                        {(player.tauntTurnsRemaining || 0) > 0 && (
                          <span
                            className="inline-flex items-center gap-0.5 px-1 py-0.2 bg-[#2B1D0E] border border-[#FFD166] text-[8px] font-cripta-pixel text-[#FFD166]"
                            title="Provocación activa: atrae ataques enemigos"
                          >
                            ⚡ PROVOCA
                          </span>
                        )}
                        {player.protectedByPlayerId && (
                          <span
                            className="inline-flex items-center gap-0.5 px-1 py-0.2 bg-[#14262E] border border-[#69A8A5] text-[8px] font-cripta-pixel text-[#8EE6AE]"
                            title="Protegido por un compañero"
                          >
                            🛡 PROTEGIDO
                          </span>
                        )}
                        {player.statuses.slice(0, 4).map((st) => (
                          <LaCriptaStatusEffectBadge key={st.id} status={st} />
                        ))}
                        {items.length > 0 && normalInv.length === 0 && (
                          <span
                            className="inline-flex items-center gap-0.5 px-1 py-0.2 bg-[#1D1526] border border-[#E7A54A]/60 text-[8px] font-cripta-pixel text-[#E7A54A]"
                            title={`Reliquias y objetos: ${items.join(', ')}`}
                          >
                            <span>✦</span>
                            <span className="truncate max-w-[78px]">
                              {items[items.length - 1]}
                            </span>
                            {items.length > 1 && <span>+{items.length - 1}</span>}
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {/* Personal Inventory Bar */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {charDef && (
                      <LaCriptaPlayerInventoryBar
                        inventory={normalInv}
                        slots={player.inventory}
                        isLocalPlayer={isMe}
                        inCombat={hasLivingEnemies}
                        canUseNow={Boolean(
                          isMe &&
                            !isDead &&
                            isExploreOrBossPhase &&
                            (!hasLivingEnemies ||
                              (combatRoundPhase === 'PLAYER_PHASE' && !hasLockedAction))
                        )}
                        onUseItem={(slotIdx) => {
                          if (!onUseConsumable) return;
                          const itemId = normalInv[slotIdx] || player.inventory?.[slotIdx]?.itemId;
                          if (!itemId) return;
                          const itemDef = CRIPTA_CONSUMABLES_BY_ID[itemId];
                          laCriptaAudio.playHeroSelect();
                          if (itemDef?.targetRule === 'SINGLE_ENEMY' || itemDef?.category === 'OFFENSIVE') {
                            onUseConsumable(slotIdx, selectedTargetEnemyId || undefined, undefined);
                          } else {
                            onUseConsumable(slotIdx, undefined, currentPlayerId);
                          }
                        }}
                      />
                    )}

                    {!isSolo && votedDoorId && expeditionState.phase === 'THREE_DOORS' && (
                      <span
                        className="inline-flex items-center gap-0.5 text-[9px] font-cripta-pixel text-[#E7A54A] shrink-0"
                        title="Ha sellado una puerta"
                      >
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
