import React, { useState } from 'react';
import { Copy, Check, Volume2, VolumeX, LogOut, Crown, Sparkles } from 'lucide-react';
import { CriptaExpeditionState, CriptaSpriteAnimationState } from '../../types/laCripta';
import { CRIPTA_CHARACTERS_CATALOG } from '../../data/la-cripta/criptaCatalog';
import { laCriptaAudio } from '../../utils/laCriptaAudio';
import { LaCriptaPixelSprite } from './LaCriptaPixelSprite';

interface LaCriptaPartyHudProps {
  expeditionState: CriptaExpeditionState;
  currentPlayerId: string;
  onLeaveExpedition: () => void;
  onReturnToLobby?: () => void;
  playerAnimationStates?: Record<string, CriptaSpriteAnimationState>;
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
            {expeditionState.phase === 'THREE_DOORS' && 'LAS TRES PUERTAS DEL DESTINO'}
            {(expeditionState.phase === 'ENTERING_DUNGEON' ||
              expeditionState.phase === 'DOOR_OPENING') &&
              'ABRIENDO SELLOS ANCESTRALES...'}
            {(expeditionState.phase === 'DUNGEON' ||
              expeditionState.phase === 'DUNGEON_ARRIVAL') &&
              `PISO ${expeditionState.floor} · SALA I`}
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
 * Persistent BOTTOM Video-Game Party HUD (Requirements 13, 14, 15).
 * Displays up to 4 adventurers with animated pixel-art character silhouettes breaking slightly
 * above the ornamental dark-fantasy HUD frame, segmented pixel HP strip, identity, cursor colour,
 * and statuses.
 */
export const LaCriptaPartyHud: React.FC<LaCriptaPartyHudProps> = ({
  expeditionState,
  currentPlayerId,
  playerAnimationStates = {},
}) => {
  const orderedPlayers = [...expeditionState.players].sort((a, b) => a.seatIndex - b.seatIndex);
  const playerCount = orderedPlayers.length;
  const isSolo = playerCount === 1;

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
      className="relative z-30 w-full border-t-2 border-[#E7A54A]/35 bg-gradient-to-t from-[#07060A] via-[#0B0A0E] to-[#19111D]/95 pt-3 pb-2.5 px-3 sm:px-6 shadow-[0_-14px_38px_rgba(0,0,0,0.92)] select-none"
    >
      {/* Ornamental pixel-gold top trim line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-[#E7A54A]/60 to-transparent" />

      <div className={gridLayoutClass}>
        {orderedPlayers.map((player) => {
          const charId = player.characterId ?? player.selectedCharacterId ?? null;
          const charDef = charId ? CRIPTA_CHARACTERS_CATALOG[charId] : null;
          const isMe = player.id === currentPlayerId;
          const votedDoorId = expeditionState.doorVotes[player.id];
          const animState = playerAnimationStates[player.id] || 'idle';

          // Compute 10-segment pixel HP bar
          const hpSegmentsTotal = 10;
          const hpFilledSegments =
            charDef && player.maxHp > 0
              ? Math.max(
                  0,
                  Math.min(
                    hpSegmentsTotal,
                    Math.round((player.hp / Math.max(1, player.maxHp)) * hpSegmentsTotal)
                  )
                )
              : 0;

          return (
            <div
              key={player.id}
              className="relative flex items-center gap-2.5 sm:gap-3 px-2.5 sm:px-3.5 py-2 bg-[#140F1A] border-2 transition-colors"
              style={{
                borderColor: charDef
                  ? isMe
                    ? '#E7A54A'
                    : charDef.accentColor
                  : isMe
                  ? player.color
                  : '#282039',
                boxShadow: isMe
                  ? `inset 0 0 18px ${player.color}22, 0 4px 16px rgba(0,0,0,0.85)`
                  : '0 4px 16px rgba(0,0,0,0.85)',
              }}
            >
              {/* Pixel corner rivets */}
              <span
                className="pointer-events-none absolute top-0.5 left-0.5 w-1.5 h-1.5"
                style={{ backgroundColor: player.color }}
              />
              <span
                className="pointer-events-none absolute top-0.5 right-0.5 w-1.5 h-1.5"
                style={{ backgroundColor: player.color }}
              />

              {/* Animated Pixel Character Bust — breaks slightly out of the top HUD frame */}
              <div
                className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0 flex items-center justify-center bg-[#09070D] border-2 overflow-visible"
                style={{
                  borderColor: player.color,
                }}
              >
                {charId && charDef ? (
                  <div className="-mt-3 sm:-mt-4 pointer-events-none">
                    <LaCriptaPixelSprite
                      characterId={charId}
                      animationState={animState}
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
                {/* Row 1: Player Name + Host Crown */}
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2 h-2 shrink-0"
                      style={{ backgroundColor: player.color }}
                    />
                    <span className="font-cripta-pixel text-xs sm:text-sm font-bold text-[#D9D0BC] uppercase truncate">
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
                </div>

                {/* Row 2: Selected Class or Choosing State */}
                <div className="mt-0.5 flex items-center justify-between gap-1">
                  {charDef ? (
                    <span
                      className="font-cripta-pixel text-[10px] sm:text-[11px] font-bold uppercase tracking-wider truncate"
                      style={{ color: charDef.accentColor }}
                    >
                      {charDef.className}
                    </span>
                  ) : (
                    <span className="font-cripta-pixel text-[10px] text-[#D8C6A0]/50 uppercase tracking-wider truncate">
                      SIN ELEGIR
                    </span>
                  )}

                  {charDef && (
                    <span className="font-cripta-mono text-[10px] text-[#D8C6A0] shrink-0">
                      {player.hp}/{player.maxHp}
                    </span>
                  )}
                </div>

                {/* Row 3: Pixel-Art Segmented HP Bar (♥ ████████░░) */}
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="text-[10px] text-[#C93B5B] font-cripta-pixel leading-none shrink-0">
                    ♥
                  </span>
                  <div className="flex items-center gap-0.5 flex-1">
                    {Array.from({ length: hpSegmentsTotal }).map((_, segIdx) => {
                      const lit = charDef ? segIdx < hpFilledSegments : false;
                      return (
                        <span
                          key={segIdx}
                          className="h-2 sm:h-2.5 flex-1 border transition-colors duration-200"
                          style={{
                            backgroundColor: lit ? '#C93B5B' : '#09070D',
                            borderColor: lit ? '#E7A54A' : '#282039',
                          }}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Row 4: Compact Status Effects & Door Vote Seal (multiplayer) */}
                <div className="mt-1 flex items-center justify-between gap-1 min-h-[14px]">
                  <div className="flex items-center gap-1 overflow-hidden">
                    {!player.isConnected ? (
                      <span className="text-[9px] font-cripta-pixel text-[#C93B5B]">
                        RECONECTANDO...
                      </span>
                    ) : (
                      player.statuses.slice(0, 2).map((st) => (
                        <span
                          key={st.id}
                          className="px-1 py-0.2 bg-[#0B0A0E] border border-[#282039] text-[8px] font-cripta-pixel text-[#E7A54A]"
                          title={st.name}
                        >
                          {st.code}
                        </span>
                      ))
                    )}
                  </div>

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
          );
        })}
      </div>
    </aside>
  );
};
