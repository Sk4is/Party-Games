import React, { useEffect, useRef, useState } from 'react';
import {
  CombatPresentationEvent,
  CriptaExpeditionState,
  CriptaRoomEnemy,
  CriptaSpriteAnimationState,
  CriptaVisualEvent,
} from '../../types/laCripta';
import { LaCriptaStatusPixelIcon } from './LaCriptaStatusEffectBadge';
import { laCriptaAudio } from '../../utils/laCriptaAudio';

export interface LaCriptaVfxSpriteProps {
  styleType?: NonNullable<CriptaVisualEvent['vfxStyle']>;
  vfxStyle?: NonNullable<CriptaVisualEvent['vfxStyle']>;
  isCrit?: boolean;
  size?: number;
  damageTypeLabel?: string;
}

/**
 * Crisp 24x24 pixel-art combat & reward visual effect sprite.
 * Supports damage-type specific visuals:
 * - TAJANTE (slash / cleave)
 * - CONTUNDENTE (blunt)
 * - PERFORANTE (arrow / pierce)
 * - ARCANO (arcane)
 * - SAGRADO (holy / revive)
 * - ALQUÍMICO (alchemy)
 * - DEFENSA (shield)
 * - GARRA ENEMIGA (claw)
 * - DRENAJE VITAL (lifesteal)
 */
export const LaCriptaVfxSprite: React.FC<LaCriptaVfxSpriteProps> = ({
  styleType,
  vfxStyle,
  isCrit = false,
  size = 64,
}) => {
  const resolvedStyle = styleType || vfxStyle || 'slash';

  return (
    <div className="pointer-events-none select-none relative flex flex-col items-center justify-center">
      {isCrit && (
        <div className="mb-1 px-2 py-0.5 bg-[#2A0E17]/95 border-2 border-[#FFD166] text-[10px] font-cripta-pixel font-black text-[#FFD166] tracking-widest uppercase shadow-[0_0_16px_rgba(255,209,102,0.85)] animate-bounce z-40">
          ✦ ¡CRÍTICO! ✦
        </div>
      )}
      <svg
        width={isCrit ? size * 1.28 : size}
        height={isCrit ? size * 1.28 : size}
        viewBox="0 0 24 24"
        shapeRendering="crispEdges"
        className="pointer-events-none select-none animate-cripta-slash-arc drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)]"
      >
        {(resolvedStyle === 'slash' || resolvedStyle === 'cleave') && (
          <g>
            {/* TAJANTE: Sharp Diagonal Blade Slash Arc + Line Fragments */}
            <rect x="19" y="2" width="3" height="3" fill="#FFFFFF" />
            <rect x="16" y="4" width="4" height="3" fill="#FFF3C4" />
            <rect x="13" y="7" width="5" height="3" fill={isCrit ? '#FFD166' : '#E2E8F0'} />
            <rect x="9" y="10" width="5" height="4" fill="#FFF3C4" />
            <rect x="6" y="14" width="5" height="3" fill={isCrit ? '#E7A54A' : '#C93B5B'} />
            <rect x="3" y="17" width="4" height="3" fill="#C93B5B" />
            <rect x="1" y="20" width="3" height="3" fill="#8F263D" />
            {/* Contact Spark Cross at Center */}
            <rect x="10" y="7" width="2" height="8" fill="#FFFFFF" />
            <rect x="7" y="10" width="8" height="2" fill="#FFF3C4" />
            {/* Directional Slash Line Fragments */}
            <rect x="5" y="5" width="3" height="1" fill="#FFD166" />
            <rect x="16" y="15" width="4" height="1" fill="#FFF3C4" />
            <rect x="14" y="18" width="2" height="2" fill="#E7A54A" />
            {resolvedStyle === 'cleave' && (
              <>
                <rect x="2" y="9" width="18" height="2" fill="#FF4D6D" opacity="0.85" />
                <rect x="4" y="10" width="14" height="1" fill="#FFF3C4" />
              </>
            )}
            {isCrit && (
              <>
                <rect x="3" y="3" width="3" height="3" fill="#FFD166" />
                <rect x="18" y="18" width="3" height="3" fill="#FFD166" />
                <rect x="11" y="1" width="2" height="4" fill="#FFF3C4" />
              </>
            )}
          </g>
        )}

        {resolvedStyle === 'blunt' && (
          <g>
            {/* CONTUNDENTE: Heavy Compression Shockwave + Radial Stone Dust Particles */}
            <rect x="5" y="5" width="14" height="14" fill="#8C583A" opacity="0.55" />
            <rect x="7" y="7" width="10" height="10" fill="#E7A54A" />
            <rect x="9" y="9" width="6" height="6" fill="#FFF3C4" />
            {/* Radial Compression Ring & Dust Shards */}
            <rect x="8" y="2" width="8" height="2" fill="#D8C6A0" />
            <rect x="8" y="20" width="8" height="2" fill="#D8C6A0" />
            <rect x="2" y="8" width="2" height="8" fill="#D8C6A0" />
            <rect x="20" y="8" width="2" height="8" fill="#D8C6A0" />
            <rect x="3" y="4" width="3" height="3" fill="#FFD166" />
            <rect x="18" y="4" width="3" height="3" fill="#FFD166" />
            <rect x="3" y="17" width="3" height="3" fill="#B8AC93" />
            <rect x="18" y="17" width="3" height="3" fill="#B8AC93" />
          </g>
        )}

        {(resolvedStyle === 'arrow' || resolvedStyle === 'pierce') && (
          <g>
            {/* PERFORANTE: Focused High-Velocity Line + Puncture Flash */}
            <rect x="1" y="11" width="18" height="2" fill="#D9D0BC" />
            <rect x="4" y="11" width="15" height="1" fill="#FFFFFF" />
            <rect x="16" y="8" width="5" height="8" fill="#E7A54A" />
            <rect x="18" y="9" width="5" height="6" fill="#FFF3C4" />
            <rect x="20" y="10" width="3" height="4" fill="#FFFFFF" />
            {/* Puncture Star Flash */}
            <rect x="18" y="5" width="2" height="14" fill="#FFF3C4" />
            <rect x="13" y="7" width="2" height="2" fill="#7FB069" />
            <rect x="13" y="15" width="2" height="2" fill="#7FB069" />
          </g>
        )}

        {resolvedStyle === 'arcane' && (
          <g>
            {/* ARCANO: Magical Rune Burst & Crystalline Shards */}
            <rect x="11" y="1" width="2" height="22" fill="#9B72CF" />
            <rect x="1" y="11" width="22" height="2" fill="#9B72CF" />
            <rect x="5" y="5" width="14" height="14" fill="#7656A8" opacity="0.8" />
            <rect x="7" y="7" width="10" height="10" fill="#D8B4F8" />
            <rect x="9" y="9" width="6" height="6" fill="#FFFFFF" />
            <rect x="3" y="3" width="3" height="3" fill="#FFD166" />
            <rect x="18" y="3" width="3" height="3" fill="#FFD166" />
            <rect x="3" y="18" width="3" height="3" fill="#FFD166" />
            <rect x="18" y="18" width="3" height="3" fill="#FFD166" />
          </g>
        )}

        {(resolvedStyle === 'holy' || resolvedStyle === 'revive') && (
          <g>
            {/* SAGRADO: Sacred Golden Pillar & Sun Cross */}
            <rect x="8" y="1" width="8" height="22" fill="#E7A54A" opacity="0.5" />
            <rect x="10" y="1" width="4" height="22" fill="#FFD166" />
            <rect x="11" y="2" width="2" height="20" fill="#FFFFFF" />
            <rect x="3" y="8" width="18" height="4" fill="#E7A54A" />
            <rect x="5" y="9" width="14" height="2" fill="#FFF3C4" />
            <rect x="4" y="4" width="2" height="2" fill="#FFF3C4" />
            <rect x="18" y="4" width="2" height="2" fill="#FFF3C4" />
            <rect x="4" y="16" width="2" height="2" fill="#FFF3C4" />
            <rect x="18" y="16" width="2" height="2" fill="#FFF3C4" />
          </g>
        )}

        {resolvedStyle === 'alchemy' && (
          <g>
            {/* ALQUÍMICO: Volatile Emerald Acid & Vapor Splash */}
            <rect x="6" y="6" width="12" height="12" fill="#5EA87A" />
            <rect x="8" y="8" width="8" height="8" fill="#A8F0C2" />
            <rect x="10" y="10" width="4" height="4" fill="#FFFFFF" />
            <rect x="3" y="4" width="3" height="3" fill="#69A8A5" />
            <rect x="18" y="5" width="3" height="3" fill="#5EA87A" />
            <rect x="4" y="17" width="3" height="3" fill="#A8F0C2" />
            <rect x="17" y="16" width="3" height="3" fill="#69A8A5" />
          </g>
        )}

        {resolvedStyle === 'shield' && (
          <g>
            {/* GUARDIA / BLOQUEO: Heraldic Aegis Barrier */}
            <rect x="4" y="2" width="16" height="12" fill="#1F3A42" />
            <rect x="5" y="3" width="14" height="11" fill="#69A8A5" />
            <rect x="7" y="14" width="10" height="4" fill="#69A8A5" />
            <rect x="10" y="18" width="4" height="3" fill="#69A8A5" />
            <rect x="7" y="5" width="10" height="7" fill="#D9F2F0" />
            <rect x="11" y="3" width="2" height="15" fill="#FFD166" />
            <rect x="6" y="8" width="12" height="2" fill="#FFD166" />
          </g>
        )}

        {resolvedStyle === 'claw' && (
          <g>
            {/* GARRA ENEMIGA: Triple Crimson Claw Rend */}
            <rect x="2" y="3" width="3" height="5" fill="#C93B5B" />
            <rect x="5" y="8" width="3" height="5" fill="#FF6B8B" />
            <rect x="8" y="13" width="3" height="5" fill="#C93B5B" />
            <rect x="8" y="2" width="3" height="5" fill="#C93B5B" />
            <rect x="11" y="7" width="3" height="5" fill="#FFF3C4" />
            <rect x="14" y="12" width="3" height="5" fill="#C93B5B" />
            <rect x="14" y="4" width="3" height="5" fill="#C93B5B" />
            <rect x="17" y="9" width="3" height="5" fill="#FF6B8B" />
            <rect x="19" y="14" width="3" height="5" fill="#8F263D" />
          </g>
        )}

        {resolvedStyle === 'explosion' && (
          <g>
            {/* Starburst pixel spark without solid rectangular background */}
            <rect x="11" y="2" width="2" height="20" fill="#E7A54A" />
            <rect x="2" y="11" width="20" height="2" fill="#E7A54A" />
            <rect x="5" y="5" width="3" height="3" fill="#C93B5B" />
            <rect x="16" y="5" width="3" height="3" fill="#C93B5B" />
            <rect x="5" y="16" width="3" height="3" fill="#C93B5B" />
            <rect x="16" y="16" width="3" height="3" fill="#C93B5B" />
            <rect x="8" y="8" width="8" height="8" fill="#FFD166" />
            <rect x="10" y="10" width="4" height="4" fill="#FFF3C4" />
          </g>
        )}

        {resolvedStyle === 'gold' && (
          <g>
            <rect x="5" y="4" width="5" height="5" fill="#E7A54A" />
            <rect x="6" y="5" width="3" height="3" fill="#FFF3C4" />
            <rect x="14" y="6" width="5" height="5" fill="#E7A54A" />
            <rect x="15" y="7" width="3" height="3" fill="#FFF3C4" />
            <rect x="9" y="12" width="6" height="6" fill="#E7A54A" />
            <rect x="11" y="14" width="2" height="2" fill="#FFF3C4" />
          </g>
        )}

        {resolvedStyle === 'heal' && (
          <g>
            {/* CURACIÓN: Rising Emerald Vitality Crosses */}
            <rect x="10" y="4" width="4" height="12" fill="#5EA87A" />
            <rect x="6" y="8" width="12" height="4" fill="#5EA87A" />
            <rect x="11" y="6" width="2" height="8" fill="#A8F0C2" />
            <rect x="8" y="9" width="8" height="2" fill="#A8F0C2" />
            <rect x="4" y="15" width="2" height="4" fill="#5EA87A" />
            <rect x="18" y="3" width="2" height="4" fill="#5EA87A" />
          </g>
        )}

        {resolvedStyle === 'lifesteal' && (
          <g>
            {/* DRENAJE VITAL: Crimson-Violet Soul Siphon Orbs */}
            <rect x="8" y="8" width="8" height="8" fill="#C93B5B" />
            <rect x="10" y="10" width="4" height="4" fill="#FF8FA3" />
            <rect x="4" y="5" width="4" height="4" fill="#9B72CF" />
            <rect x="16" y="15" width="4" height="4" fill="#9B72CF" />
            <rect x="15" y="4" width="3" height="3" fill="#E03E52" />
            <rect x="5" y="16" width="3" height="3" fill="#E03E52" />
          </g>
        )}
      </svg>
    </div>
  );
};

/**
 * Tiny 10x10 pixel icon for floating stat/gold/damage/heal badges.
 */
const FloatingEventMiniIcon: React.FC<{ event: CriptaVisualEvent }> = ({ event }) => {
  if (event.statusType) {
    return <LaCriptaStatusPixelIcon effectType={event.statusType} size={11} />;
  }

  return (
    <svg
      width={11}
      height={11}
      viewBox="0 0 10 10"
      shapeRendering="crispEdges"
      className="shrink-0"
    >
      {(event.kind === 'GAIN_GOLD' || event.kind === 'LOSE_GOLD') && (
        <g>
          <rect x="2" y="1" width="6" height="8" fill="#E7A54A" />
          <rect x="1" y="2" width="8" height="6" fill="#E7A54A" />
          <rect x="4" y="3" width="2" height="4" fill="#FFF3C4" />
        </g>
      )}
      {(event.kind === 'HEAL_PLAYER' ||
        event.kind === 'HEAL_ENEMY' ||
        event.kind === 'REVIVE_PLAYER') && (
        <g fill={event.kind === 'REVIVE_PLAYER' ? '#E7A54A' : '#5EA87A'}>
          <rect x="4" y="1" width="2" height="8" />
          <rect x="1" y="4" width="8" height="2" />
        </g>
      )}
      {(event.kind === 'DAMAGE_ENEMY' ||
        event.kind === 'CRIT_ENEMY' ||
        event.kind === 'GAIN_ATTACK') && (
        <g fill={event.isCrit || event.kind === 'CRIT_ENEMY' ? '#E7A54A' : '#C93B5B'}>
          <rect x="7" y="1" width="2" height="2" />
          <rect x="5" y="3" width="2" height="2" />
          <rect x="3" y="5" width="2" height="2" />
          <rect x="1" y="7" width="3" height="2" fill="#FFF3C4" />
        </g>
      )}
      {(event.kind === 'SHIELD_PLAYER' ||
        event.kind === 'DEFEND_ENEMY' ||
        event.kind === 'PROTECT_ENEMY' ||
        event.kind === 'GAIN_DEFENSE') && (
        <g fill="#69A8A5">
          <rect x="2" y="1" width="6" height="5" />
          <rect x="3" y="6" width="4" height="2" />
          <rect x="4" y="8" width="2" height="1" />
        </g>
      )}
      {event.kind === 'GAIN_MAGIC' && (
        <g fill="#9B72CF">
          <rect x="4" y="1" width="2" height="8" />
          <rect x="1" y="4" width="8" height="2" />
          <rect x="4" y="4" width="2" height="2" fill="#FFF3C4" />
        </g>
      )}
      {(event.kind === 'DAMAGE_PLAYER' || event.kind === 'ENEMY_ATTACK') && (
        <g fill="#C93B5B">
          <rect x="2" y="2" width="2" height="3" />
          <rect x="6" y="2" width="2" height="3" />
          <rect x="1" y="4" width="8" height="3" />
          <rect x="3" y="7" width="4" height="2" />
        </g>
      )}
      {(event.kind === 'LOOT_ITEM' ||
        event.kind === 'ROOM_REWARD' ||
        event.kind === 'STATUS_REMOVED') && (
        <g fill="#E7A54A">
          <rect x="4" y="1" width="2" height="2" />
          <rect x="2" y="3" width="6" height="4" />
          <rect x="4" y="7" width="2" height="2" />
        </g>
      )}
      {event.kind === 'ENEMY_DEATH' && (
        <g fill="#D9D0BC">
          <rect x="2" y="1" width="6" height="5" />
          <rect x="3" y="6" width="4" height="3" />
          <rect x="3" y="3" width="1" height="1" fill="#0B0A0E" />
          <rect x="6" y="3" width="1" height="1" fill="#0B0A0E" />
        </g>
      )}
    </svg>
  );
};

/**
 * Centered combat & reward pixel VFX overlay rendered over enemies or the central dungeon chamber.
 */
export const LaCriptaCombatVfxOverlay: React.FC<LaCriptaVfxSpriteProps> = ({
  styleType,
  vfxStyle,
  isCrit = false,
  size = 84,
}) => {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
      <LaCriptaVfxSprite
        styleType={styleType || vfxStyle}
        isCrit={isCrit}
        size={size}
      />
    </div>
  );
};

interface LaCriptaFloatingEventBadgeProps {
  event: CriptaVisualEvent;
  indexOffset?: number;
}

/**
 * Spatial floating visual number / stat / status / loot badge.
 */
export const LaCriptaFloatingEventBadge: React.FC<LaCriptaFloatingEventBadgeProps> = ({
  event,
  indexOffset = 0,
}) => {
  const isCritOrMajor =
    event.isCrit ||
    event.kind === 'CRIT_ENEMY' ||
    event.kind === 'ENEMY_DEATH' ||
    event.kind === 'REVIVE_PLAYER' ||
    event.kind === 'ROOM_REWARD';

  return (
    <div
      style={{
        animationDelay: `${indexOffset * 90}ms`,
        borderColor: event.color,
        boxShadow: `0 6px 20px rgba(0,0,0,0.95), 0 0 14px ${event.color}66`,
      }}
      className={`pointer-events-none select-none inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#09070D]/95 border-2 font-cripta-pixel whitespace-nowrap z-40 ${
        isCritOrMajor
          ? 'text-xs sm:text-sm md:text-base font-black animate-cripta-crit-pop scale-110'
          : 'text-[11px] sm:text-xs font-bold animate-cripta-float-up'
      }`}
    >
      <FloatingEventMiniIcon event={event} />
      <span style={{ color: event.color }}>{event.label}</span>
      {event.sublabel && (
        <span className="text-[9px] text-[#D9D0BC]/90 font-normal">{event.sublabel}</span>
      )}
    </div>
  );
};

// ============================================================================
// SMOOTH PIXEL HP BAR WITH DELAYED TRAILING DAMAGE STRIP (Section 14)
// ============================================================================

export const LaCriptaAnimatedHpBar: React.FC<{
  currentHp: number;
  maxHp: number;
  trailHp?: number;
  heightClass?: string;
  fillGradientClass?: string;
  trailColor?: string;
}> = ({
  currentHp,
  maxHp,
  trailHp,
  heightClass = 'h-4',
  fillGradientClass = 'from-[#8A1C33] via-[#C93B5B] to-[#FF4D6D]',
  trailColor = '#FFD166',
}) => {
  const safeMax = Math.max(1, maxHp);
  const currentPct = Math.max(0, Math.min(100, (currentHp / safeMax) * 100));
  const resolvedTrailHp = trailHp !== undefined ? Math.max(currentHp, trailHp) : currentHp;
  const trailPct = Math.max(currentPct, Math.min(100, (resolvedTrailHp / safeMax) * 100));

  return (
    <div
      className={`${heightClass} w-full bg-[#160F20] border-2 border-[#3E2F4B] overflow-hidden relative`}
    >
      {/* Delayed Trailing Damage Strip */}
      <div
        className="position-absolute inset-y-0 left-0 h-full transition-all duration-700 ease-out"
        style={{
          position: 'absolute',
          width: `${trailPct}%`,
          backgroundColor: trailColor,
          opacity: trailPct > currentPct + 0.5 ? 0.85 : 0,
        }}
      />
      {/* Authoritative Smooth Target HP Bar */}
      <div
        className={`relative z-10 h-full bg-gradient-to-r ${fillGradientClass} transition-all duration-500 ease-out`}
        style={{
          width: `${currentPct}%`,
        }}
      />
    </div>
  );
};

// ============================================================================
// DIRECTIONAL ATTACK & LIFESTEAL TRAVEL OVERLAY (Sections 7, 8, 12, 13, 15)
// ============================================================================

export interface ActiveDirectionalTravel {
  id: string;
  direction: 'PLAYER_TO_ENEMY' | 'ENEMY_TO_PLAYER' | 'LIFESTEAL_TO_PLAYER';
  vfxStyle: NonNullable<CriptaVisualEvent['vfxStyle']>;
  label?: string;
  color: string;
  isCrit?: boolean;
  sourceEnemyId?: string;
  sourceEnemyName?: string;
  targetPlayerId?: string;
  targetPlayerName?: string;
  targetPlayerColor?: string;
}

export interface ActiveGoldBurst {
  id: string;
  amount: number;
  label?: string;
  isGain: boolean;
}

/**
 * True pixel-art projectile sprite for ENEMY RANGED/MAGIC/ALCHEMY and LIFESTEAL travel.
 * Player attacks NEVER launch generic objects or projectiles across the screen!
 */
const ProjectilePixelSprite: React.FC<{
  vfxStyle: NonNullable<CriptaVisualEvent['vfxStyle']>;
  isCrit?: boolean;
}> = ({ vfxStyle, isCrit = false }) => {
  return (
    <svg
      width={isCrit ? 68 : 56}
      height={isCrit ? 68 : 56}
      viewBox="0 0 24 24"
      shapeRendering="crispEdges"
      className="pointer-events-none select-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.95)]"
    >
      {(vfxStyle === 'arrow' || vfxStyle === 'pierce') && (
        <g>
          {/* High-velocity fletched arrow / bolt */}
          <rect x="2" y="11" width="4" height="2" fill="#FFFFFF" />
          <rect x="4" y="9" width="3" height="6" fill="#E2E8F0" />
          <rect x="3" y="10" width="3" height="4" fill="#FFD166" />
          {/* Wooden shaft */}
          <rect x="7" y="11" width="11" height="2" fill="#8C583A" />
          <rect x="8" y="11" width="9" height="1" fill="#D8C6A0" />
          {/* Feather fletching */}
          <rect x="17" y="8" width="4" height="2" fill="#5EA87A" />
          <rect x="17" y="14" width="4" height="2" fill="#5EA87A" />
          <rect x="19" y="9" width="3" height="1" fill="#A8F0C2" />
          <rect x="19" y="14" width="3" height="1" fill="#A8F0C2" />
          {/* Wind streak lines */}
          <rect x="10" y="7" width="8" height="1" fill="#FFF3C4" opacity="0.75" />
          <rect x="12" y="16" width="7" height="1" fill="#FFF3C4" opacity="0.75" />
        </g>
      )}

      {vfxStyle === 'alchemy' && (
        <g>
          {/* Thrown bubbling alchemical glass flask */}
          <rect x="10" y="3" width="4" height="2" fill="#8C583A" />
          <rect x="9" y="5" width="6" height="2" fill="#D9F2F0" />
          <rect x="7" y="7" width="10" height="10" fill="#1F3A42" />
          <rect x="8" y="8" width="8" height="8" fill="#5EA87A" />
          <rect x="9" y="10" width="6" height="5" fill="#80FF72" />
          <rect x="10" y="9" width="2" height="2" fill="#FFFFFF" />
          {/* Trailing acid droplets & vapor */}
          <rect x="18" y="6" width="3" height="3" fill="#80FF72" />
          <rect x="19" y="13" width="2" height="2" fill="#5EA87A" />
          <rect x="16" y="17" width="3" height="2" fill="#A8F0C2" />
        </g>
      )}

      {(vfxStyle === 'arcane' || vfxStyle === 'holy' || vfxStyle === 'revive') && (
        <g>
          {/* Comet-like arcane/solar spell orb with trailing rune motes */}
          <rect
            x="5"
            y="6"
            width="12"
            height="12"
            fill={vfxStyle === 'holy' ? '#E7A54A' : '#7656A8'}
          />
          <rect
            x="7"
            y="8"
            width="8"
            height="8"
            fill={vfxStyle === 'holy' ? '#FFD166' : '#C8A6F5'}
          />
          <rect x="9" y="10" width="4" height="4" fill="#FFFFFF" />
          {/* Trailing tail */}
          <rect
            x="16"
            y="8"
            width="5"
            height="2"
            fill={vfxStyle === 'holy' ? '#FFD166' : '#9B72CF'}
          />
          <rect
            x="17"
            y="11"
            width="6"
            height="2"
            fill={vfxStyle === 'holy' ? '#FFF3C4' : '#D8B4F8'}
          />
          <rect
            x="16"
            y="14"
            width="5"
            height="2"
            fill={vfxStyle === 'holy' ? '#FFD166' : '#9B72CF'}
          />
        </g>
      )}

      {vfxStyle === 'lifesteal' && (
        <g>
          <rect x="7" y="7" width="10" height="10" fill="#8F263D" />
          <rect x="9" y="9" width="6" height="6" fill="#E03E52" />
          <rect x="10" y="10" width="4" height="4" fill="#FF8FA3" />
          <rect x="4" y="5" width="3" height="3" fill="#9B72CF" />
          <rect x="17" y="15" width="3" height="3" fill="#9B72CF" />
          <rect x="15" y="4" width="3" height="3" fill="#FF4D6D" />
        </g>
      )}

      {(vfxStyle === 'claw' || vfxStyle === 'slash' || vfxStyle === 'blunt' || vfxStyle === 'cleave') && (
        <g>
          {/* Crisp diagonal pixel-art slash arc (no rectangular background) */}
          <rect x="3" y="18" width="3" height="3" fill="#8F263D" />
          <rect x="6" y="15" width="3" height="3" fill="#E03E52" />
          <rect x="9" y="12" width="3" height="3" fill="#FF6B8B" />
          <rect x="12" y="9" width="3" height="3" fill="#FFD166" />
          <rect x="15" y="6" width="3" height="3" fill="#FFF3C4" />
          <rect x="18" y="3" width="3" height="3" fill="#FFD166" />
          <rect x="7" y="18" width="2" height="2" fill="#C93B5B" />
          <rect x="10" y="15" width="2" height="2" fill="#E03E52" />
          <rect x="13" y="12" width="2" height="2" fill="#FFD166" />
          <rect x="16" y="9" width="2" height="2" fill="#E03E52" />
        </g>
      )}
    </svg>
  );
};

export const LaCriptaDirectionalTravelOverlay: React.FC<{
  travel: ActiveDirectionalTravel | null;
}> = ({ travel }) => {
  const [progress, setProgress] = useState<'START' | 'END'>('START');
  const [coords, setCoords] = useState<{
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } | null>(null);

  useEffect(() => {
    if (!travel) {
      setProgress('START');
      setCoords(null);
      return;
    }

    // Dynamically measure exact source enemy element and target player HUD card
    const winW = window.innerWidth || 1280;
    const winH = window.innerHeight || 720;

    let startX = winW * 0.23;
    let startY = winH * 0.42;
    let endX = winW * 0.48;
    let endY = winH * 0.88;

    if (travel.sourceEnemyId) {
      const enemyEl = document.querySelector(
        `[data-enemy-stage-id="${travel.sourceEnemyId}"]`
      );
      if (enemyEl) {
        const er = enemyEl.getBoundingClientRect();
        if (er.width > 0 && er.height > 0) {
          startX = er.left + er.width / 2;
          startY = er.top + er.height / 2;
        }
      }
    }

    if (travel.targetPlayerId) {
      const playerCardEl = document.querySelector(
        `[data-player-hud-card="${travel.targetPlayerId}"]`
      );
      if (playerCardEl) {
        const pr = playerCardEl.getBoundingClientRect();
        if (pr.width > 0 && pr.height > 0) {
          endX = pr.left + pr.width / 2;
          endY = pr.top + pr.height / 2;
        }
      }
    }

    setCoords({ startX, startY, endX, endY });
    setProgress('START');
    const raf = window.requestAnimationFrame(() => {
      setProgress('END');
    });
    return () => window.cancelAnimationFrame(raf);
  }, [travel]);

  if (!travel || !coords) return null;

  const startTransform = `translate3d(${coords.startX.toFixed(1)}px, ${coords.startY.toFixed(
    1
  )}px, 0) scale(0.9)`;
  const endTransform = `translate3d(${coords.endX.toFixed(1)}px, ${coords.endY.toFixed(
    1
  )}px, 0) scale(1.12)`;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden select-none">
      {/* Explicit Target Trajectory Line & Target Reticle on the Targeted Player's HUD Card */}
      {travel.direction === 'ENEMY_TO_PLAYER' && (
        <>
          <svg className="pointer-events-none absolute inset-0 w-full h-full">
            <line
              x1={coords.startX}
              y1={coords.startY}
              x2={coords.endX}
              y2={coords.endY}
              stroke={travel.targetPlayerColor || '#FF4D6D'}
              strokeWidth="2.5"
              strokeDasharray="6 6"
              opacity="0.78"
            />
          </svg>
          <div
            style={{
              transform: `translate3d(${coords.endX.toFixed(1)}px, ${coords.endY.toFixed(
                1
              )}px, 0)`,
            }}
            className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
          >
            {travel.targetPlayerName && (
              <div
                className="mt-1 px-2 py-0.5 bg-[#1E0810]/95 border text-[9px] font-cripta-pixel font-black uppercase tracking-widest whitespace-nowrap shadow-[0_0_12px_rgba(255,209,102,0.5)]"
                style={{
                  borderColor: '#FFD166',
                  color: '#FFD166',
                }}
              >
                ◆ BLANCO: {travel.targetPlayerName} ◆
              </div>
            )}
          </div>
        </>
      )}

      <div
        style={{
          transform: progress === 'START' ? startTransform : endTransform,
          transition:
            travel.direction === 'LIFESTEAL_TO_PLAYER'
              ? 'transform 560ms cubic-bezier(0.22, 1, 0.36, 1)'
              : 'transform 520ms cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
      >
        <div
          className="p-1.5 rounded-none"
          style={{
            filter: `drop-shadow(0 0 18px ${travel.color})`,
          }}
        >
          <ProjectilePixelSprite
            vfxStyle={
              travel.direction === 'LIFESTEAL_TO_PLAYER'
                ? 'lifesteal'
                : travel.vfxStyle
            }
            isCrit={travel.isCrit}
          />
        </div>
        {(travel.label || travel.targetPlayerName) && (
          <span
            style={{ borderColor: travel.color, color: '#FFD166' }}
            className="px-2 py-0.5 bg-[#09070D]/95 border-2 text-[9px] font-cripta-pixel font-bold uppercase tracking-widest shadow-lg whitespace-nowrap"
          >
            {travel.label ? `${travel.label}` : ''}
            {travel.targetPlayerName ? ` → ${travel.targetPlayerName}` : ''}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * 60 FPS Gold Collection Coin Arc & Banner Overlay (Requirements 2 & 3).
 * Dynamically measures [data-reward-target="gold"] when the animation starts.
 * NEVER targets ESTADOS or uses hardcoded coordinates.
 */
export const LaCriptaGoldCollectionOverlay: React.FC<{
  burst: ActiveGoldBurst | null;
}> = ({ burst }) => {
  const [phase, setPhase] = useState<'START' | 'FLY'>('START');
  const [targetCoords, setTargetCoords] = useState<{
    x: number;
    y: number;
    sourceX: number;
    sourceY: number;
  } | null>(null);

  useEffect(() => {
    if (!burst || !burst.isGain) {
      setPhase('START');
      setTargetCoords(null);
      return;
    }

    // Measure the EXPLICIT dedicated [data-reward-target="gold"] element right when animation starts
    const goldCounterEl = document.querySelector('[data-reward-target="gold"]');
    const winW = window.innerWidth || 1280;
    const winH = window.innerHeight || 720;

    let targetX = winW * 0.75;
    let targetY = 26;
    if (goldCounterEl) {
      const rect = goldCounterEl.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        targetX = rect.left + rect.width / 2;
        targetY = rect.top + rect.height / 2;
      }
    }

    const sourceX = winW * 0.48;
    const sourceY = winH * 0.52;

    setTargetCoords({ x: targetX, y: targetY, sourceX, sourceY });
    setPhase('START');

    const raf = window.requestAnimationFrame(() => {
      setPhase('FLY');
    });

    const impactTimer = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent('cripta-gold-counter-impact'));
    }, 620);

    return () => {
      window.cancelAnimationFrame(raf);
      window.clearTimeout(impactTimer);
    };
  }, [burst]);

  if (!burst || !burst.isGain || !targetCoords) return null;

  const coinOffsets = [
    { dx: -44, dy: 12, delayMs: 0 },
    { dx: -18, dy: 28, delayMs: 45 },
    { dx: 22, dy: -14, delayMs: 90 },
    { dx: -28, dy: -22, delayMs: 135 },
    { dx: 38, dy: 18, delayMs: 180 },
    { dx: 6, dy: 34, delayMs: 225 },
  ];

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden select-none">
      {/* Initial Source Gold Burst Ring */}
      <div
        style={{
          transform: `translate3d(${targetCoords.sourceX.toFixed(1)}px, ${targetCoords.sourceY.toFixed(
            1
          )}px, 0) scale(${phase === 'START' ? 0.5 : 1.55})`,
          opacity: phase === 'START' ? 0.95 : 0,
          transition: 'transform 420ms ease-out, opacity 420ms ease-out',
        }}
        className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 w-20 h-20 border-2 border-[#FFD166] bg-[#FFD166]/20"
      />

      {coinOffsets.map((c, idx) => {
        const startX = targetCoords.sourceX + c.dx;
        const startY = targetCoords.sourceY + c.dy;
        return (
          <div
            key={`${burst.id}_coin_${idx}`}
            style={{
              transform:
                phase === 'START'
                  ? `translate3d(${startX.toFixed(1)}px, ${startY.toFixed(1)}px, 0) scale(1)`
                  : `translate3d(${targetCoords.x.toFixed(1)}px, ${targetCoords.y.toFixed(
                      1
                    )}px, 0) scale(0.65)`,
              opacity: phase === 'START' ? 1 : 0.25,
              transition: `transform 640ms cubic-bezier(0.2, 0.9, 0.3, 1) ${c.delayMs}ms, opacity 640ms ease-in ${c.delayMs}ms`,
            }}
            className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2 will-change-transform"
          >
            <svg
              width={24}
              height={24}
              viewBox="0 0 12 12"
              shapeRendering="crispEdges"
              className="drop-shadow-[0_0_12px_rgba(255,209,102,0.95)]"
            >
              <rect x="3" y="1" width="6" height="10" fill="#B66E19" />
              <rect x="2" y="2" width="8" height="8" fill="#E7A54A" />
              <rect x="3" y="2" width="6" height="8" fill="#FFD166" />
              <rect x="5" y="3" width="2" height="6" fill="#FFF3C4" />
            </svg>
          </div>
        );
      })}

      {/* Crisp Central Treasury Callout */}
      <div className="absolute left-1/2 top-[20%] -translate-x-1/2 flex flex-col items-center animate-cripta-crit-pop">
        <div className="px-3.5 py-1.5 bg-[#1B1309]/95 border-2 border-[#FFD166] shadow-[0_0_28px_rgba(255,209,102,0.75)] flex items-center gap-2">
          <svg
            width={18}
            height={18}
            viewBox="0 0 12 12"
            shapeRendering="crispEdges"
          >
            <rect x="3" y="1" width="6" height="10" fill="#E7A54A" />
            <rect x="2" y="2" width="8" height="8" fill="#FFD166" />
            <rect x="5" y="3" width="2" height="6" fill="#FFF3C4" />
          </svg>
          <span className="font-cripta-pixel text-xs sm:text-sm font-black text-[#FFD166] tracking-widest">
            +{burst.amount} ORO
          </span>
          {burst.label && (
            <span className="text-[9px] font-cripta-pixel text-[#F5EFE6]/85 uppercase">
              · {burst.label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// ENEMY DEATH COLLAPSE & BIOME-SPECIFIC SOUL DISSOLVE OVERLAY (Requirement 8)
// ============================================================================

export const LaCriptaEnemyDeathOverlay: React.FC<{
  enemyName: string;
  isBossOrMiniboss?: boolean;
  dungeonId?: string;
}> = ({ enemyName, isBossOrMiniboss = false, dungeonId }) => {
  // Biome-specific residue & dissolving particle palette
  const biomeColors =
    dungeonId === 'cavernas_heladas' || dungeonId === 'templo_sumergido'
      ? { primary: '#7BDFF2', secondary: '#E0FBFC', residue: 'ESCARCHA Y CRISTAL' }
      : dungeonId === 'jardin_podrido' || dungeonId === 'cripta_de_esporas'
      ? { primary: '#80FF72', secondary: '#5EA87A', residue: 'ESPORAS Y CENIZA FÚNGICA' }
      : dungeonId === 'forja_infernal' || dungeonId === 'reloj_de_fuego'
      ? { primary: '#FF6B35', secondary: '#FFD166', residue: 'BRASAS Y ESCORIA' }
      : dungeonId === 'palacio_de_los_espejos' || dungeonId === 'observatorio_estelar'
      ? { primary: '#E0AAFF', secondary: '#FFFFFF', residue: 'ESQUIRLAS DE ESPEJO' }
      : { primary: '#9B72CF', secondary: '#FF4D6D', residue: 'ESENCIA ESPECTRAL' };

  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex flex-col items-center justify-center select-none">
      {/* Rising Biome-Specific Dissolve & Spectral Particles */}
      <svg
        width={isBossOrMiniboss ? 220 : 168}
        height={isBossOrMiniboss ? 220 : 168}
        viewBox="0 0 32 32"
        shapeRendering="crispEdges"
        className="animate-pulse"
      >
        <rect x="14" y="5" width="4" height="4" fill={biomeColors.secondary} />
        <rect x="7" y="9" width="3" height="3" fill={biomeColors.primary} />
        <rect x="21" y="8" width="3" height="3" fill={biomeColors.primary} />
        <rect x="5" y="17" width="3" height="3" fill={biomeColors.secondary} />
        <rect x="23" y="16" width="3" height="3" fill={biomeColors.primary} />
        <rect x="11" y="13" width="2" height="7" fill={biomeColors.primary} />
        <rect x="18" y="12" width="2" height="7" fill={biomeColors.secondary} />
        {/* Dissolving ground residue at threshold */}
        <rect x="8" y="24" width="16" height="2" fill={biomeColors.primary} opacity="0.75" />
        <rect x="11" y="26" width="10" height="2" fill={biomeColors.secondary} opacity="0.55" />
      </svg>
      <div
        className="mt-1 px-3 py-1 bg-[#140810]/95 border-2 text-[10px] sm:text-xs font-cripta-pixel font-black text-[#FFD166] uppercase tracking-widest shadow-[0_0_24px_rgba(255,77,109,0.8)]"
        style={{ borderColor: biomeColors.primary }}
      >
        ☠ {enemyName} ABATIDO ☠
      </div>
    </div>
  );
};

// ============================================================================
// ACTION PRESENTATION QUEUE COMPILER & ENGINE HOOK (Sections 1–20)
// ============================================================================

export type CriptaEnemyLifecycleStage = 'ALIVE' | 'DYING' | 'DEAD_REMOVED';

export interface LaCriptaPresentationState {
  isPresentingSequence: boolean;
  presentationBannerText: string | null;
  hitStopActive: boolean;
  activeVisualEvents: CriptaVisualEvent[];
  activeTravel: ActiveDirectionalTravel | null;
  activeGoldBurst: ActiveGoldBurst | null;
  playerAnimationStates: Record<string, CriptaSpriteAnimationState>;
  enemyAnimStates: Record<string, 'idle' | 'hit' | 'lunge' | 'death'>;
  enemyLifecycleStates: Record<string, CriptaEnemyLifecycleStage>;
  presentedEnemyHp: Record<string, { hp: number; trailHp: number }>;
  presentedPlayerHp: Record<string, { hp: number; trailHp: number }>;
  dyingEnemies: Record<string, CriptaRoomEnemy>;
  hideGroundDropsDuringDeath: boolean;
  presentedExpeditionDefeated: boolean;
  playerCardImpacts: Record<
    string,
    'DAMAGE' | 'HEAL' | 'SHIELD' | 'BUFF' | 'DEBUFF' | 'ANTICIPATION'
  >;
  activeRelicRevealId: CriptaVisualEvent['relicId'] | null;
  showBossPhaseTransition: boolean;
  activeActingEnemyId: string | null;
  activeTargetedPlayerIdsDuringPresentation: string[];
}

export function useLaCriptaPresentationQueue(
  expeditionState: CriptaExpeditionState | null
): LaCriptaPresentationState {
  const lastProcessedBatchIdRef = useRef<number>(0);
  const lastRoomKeyRef = useRef<string>('');
  const timersRef = useRef<number[]>([]);
  const activeBatchEndTimeRef = useRef<number>(0);

  // Authoritative snapshots from the previous render so we can animate FROM pre-action HP TO post-action HP
  const prevEnemyHpRef = useRef<Record<string, number>>({});
  const prevPlayerHpRef = useRef<Record<string, number>>({});
  const knownEnemiesByIdRef = useRef<Record<string, CriptaRoomEnemy>>({});
  const deadRemovedEnemyIdsRef = useRef<Set<string>>(new Set());

  const [isPresentingSequence, setIsPresentingSequence] = useState(false);
  const [presentationBannerText, setPresentationBannerText] = useState<string | null>(
    null
  );
  const [hitStopActive, setHitStopActive] = useState(false);
  const [activeVisualEvents, setActiveVisualEvents] = useState<CriptaVisualEvent[]>([]);
  const [activeTravel, setActiveTravel] = useState<ActiveDirectionalTravel | null>(null);
  const [activeGoldBurst, setActiveGoldBurst] = useState<ActiveGoldBurst | null>(null);
  const [playerAnimationStates, setPlayerAnimationStates] = useState<
    Record<string, CriptaSpriteAnimationState>
  >({});
  const [enemyAnimStates, setEnemyAnimStates] = useState<
    Record<string, 'idle' | 'hit' | 'lunge' | 'death'>
  >({});
  const [enemyLifecycleStates, setEnemyLifecycleStates] = useState<
    Record<string, CriptaEnemyLifecycleStage>
  >({});
  const [presentedEnemyHp, setPresentedEnemyHp] = useState<
    Record<string, { hp: number; trailHp: number }>
  >({});
  const [presentedPlayerHp, setPresentedPlayerHp] = useState<
    Record<string, { hp: number; trailHp: number }>
  >({});
  const [dyingEnemies, setDyingEnemies] = useState<Record<string, CriptaRoomEnemy>>({});
  const [hideGroundDropsDuringDeath, setHideGroundDropsDuringDeath] = useState(false);
  const [presentedExpeditionDefeated, setPresentedExpeditionDefeated] = useState(false);
  const [playerCardImpacts, setPlayerCardImpacts] = useState<
    Record<string, 'DAMAGE' | 'HEAL' | 'SHIELD' | 'BUFF' | 'DEBUFF' | 'ANTICIPATION'>
  >({});
  const [activeRelicRevealId, setActiveRelicRevealId] = useState<
    CriptaVisualEvent['relicId'] | null
  >(null);
  const [showBossPhaseTransition, setShowBossPhaseTransition] = useState(false);
  const [activeActingEnemyId, setActiveActingEnemyId] = useState<string | null>(null);
  const [
    activeTargetedPlayerIdsDuringPresentation,
    setActiveTargetedPlayerIdsDuringPresentation,
  ] = useState<string[]>([]);

  const clearScheduledTimers = () => {
    for (const id of timersRef.current) {
      window.clearTimeout(id);
    }
    timersRef.current = [];
  };

  const schedule = (fn: () => void, delayMs: number) => {
    const id = window.setTimeout(fn, delayMs);
    timersRef.current.push(id);
    return id;
  };

  // Keep enemy catalog snapshot and sync non-combat HP changes or room transitions immediately
  useEffect(() => {
    if (!expeditionState) return;
    const seq = expeditionState.roomSequence || [];
    const idx = expeditionState.currentRoomIndex ?? 0;
    const activeRoom =
      expeditionState.inSecretRoom && expeditionState.discoveredSecretRoom
        ? expeditionState.discoveredSecretRoom
        : seq[idx] || null;

    // Normalize phase so DUNGEON_ARRIVAL -> DUNGEON never resets in-flight room combat state
    const isDungeonPlayPhase =
      expeditionState.phase === 'DUNGEON' ||
      expeditionState.phase === 'DUNGEON_ARRIVAL' ||
      expeditionState.phase === 'ENTERING_DUNGEON';
    const normalizedPhase = isDungeonPlayPhase ? 'DUNGEON_PLAY' : expeditionState.phase;

    const roomKey = `${normalizedPhase}_${expeditionState.selectedDungeonId || 'none'}_${
      activeRoom?.id || idx
    }_${Boolean(expeditionState.inSecretRoom)}`;

    // If room or phase changed (or on initial connect/reconnect), snap all presentation state to authoritative state
    if (roomKey !== lastRoomKeyRef.current) {
      lastRoomKeyRef.current = roomKey;
      clearScheduledTimers();
      activeBatchEndTimeRef.current = 0;
      setIsPresentingSequence(false);
      setPresentationBannerText(null);
      setHitStopActive(false);
      setActiveVisualEvents([]);
      setActiveTravel(null);
      setActiveGoldBurst(null);
      setPlayerAnimationStates({});
      setEnemyAnimStates({});
      setDyingEnemies({});
      setHideGroundDropsDuringDeath(false);
      setPresentedExpeditionDefeated(Boolean(expeditionState.expeditionDefeated));
      setPlayerCardImpacts({});
      setActiveActingEnemyId(null);
      setActiveTargetedPlayerIdsDuringPresentation([]);

      deadRemovedEnemyIdsRef.current = new Set();
      const snapLifecycle: Record<string, CriptaEnemyLifecycleStage> = {};
      const snapEnemyHp: Record<string, { hp: number; trailHp: number }> = {};
      const nextPrevEnemy: Record<string, number> = {};
      for (const en of activeRoom?.enemies || []) {
        snapEnemyHp[en.id] = { hp: en.hp, trailHp: en.hp };
        nextPrevEnemy[en.id] = en.hp;
        knownEnemiesByIdRef.current[en.id] = { ...en };
        if (en.hp <= 0) {
          deadRemovedEnemyIdsRef.current.add(en.id);
          snapLifecycle[en.id] = 'DEAD_REMOVED';
        } else {
          snapLifecycle[en.id] = 'ALIVE';
        }
      }
      setEnemyLifecycleStates(snapLifecycle);
      setPresentedEnemyHp(snapEnemyHp);
      prevEnemyHpRef.current = nextPrevEnemy;

      const snapPlayerHp: Record<string, { hp: number; trailHp: number }> = {};
      const nextPrevPlayer: Record<string, number> = {};
      for (const p of expeditionState.players) {
        snapPlayerHp[p.id] = { hp: p.hp, trailHp: p.hp };
        nextPrevPlayer[p.id] = p.hp;
      }
      setPresentedPlayerHp(snapPlayerHp);
      prevPlayerHpRef.current = nextPrevPlayer;
      return;
    }

    // Also register any newly summoned enemies immediately
    if (activeRoom?.enemies) {
      for (const en of activeRoom.enemies) {
        if (en.hp > 0) {
          knownEnemiesByIdRef.current[en.id] = { ...en };
          if (deadRemovedEnemyIdsRef.current.has(en.id)) {
            deadRemovedEnemyIdsRef.current.delete(en.id);
          }
          setEnemyLifecycleStates((prev) =>
            prev[en.id] ? prev : { ...prev, [en.id]: 'ALIVE' }
          );
        }
        if (prevEnemyHpRef.current[en.id] === undefined) {
          prevEnemyHpRef.current[en.id] = en.hp;
          setPresentedEnemyHp((prev) => ({
            ...prev,
            [en.id]: { hp: en.hp, trailHp: en.hp },
          }));
        }
      }
    }

    // If no presentation sequence is active and no new batch is pending, keep displayed HP synced
    const batchId = expeditionState.lastEventBatch?.batchId || 0;
    const isNowPresenting =
      isPresentingSequence || performance.now() < activeBatchEndTimeRef.current;
    if (!isNowPresenting && batchId === lastProcessedBatchIdRef.current) {
      setPresentedExpeditionDefeated(Boolean(expeditionState.expeditionDefeated));
      if (activeRoom?.enemies) {
        setPresentedEnemyHp((prev) => {
          const next = { ...prev };
          for (const en of activeRoom.enemies) {
            next[en.id] = { hp: en.hp, trailHp: en.hp };
            prevEnemyHpRef.current[en.id] = en.hp;
          }
          return next;
        });
      }
      setPresentedPlayerHp((prev) => {
        const next = { ...prev };
        for (const p of expeditionState.players) {
          next[p.id] = { hp: p.hp, trailHp: p.hp };
          prevPlayerHpRef.current[p.id] = p.hp;
        }
        return next;
      });
    }
  }, [expeditionState, isPresentingSequence]);

  // Process incoming authoritative lastEventBatch into a chronological CombatPresentationEvent queue
  useEffect(() => {
    if (!expeditionState) return;
    const batch = expeditionState.lastEventBatch;
    if (!batch || !batch.batchId || batch.batchId === lastProcessedBatchIdRef.current) {
      return;
    }
    lastProcessedBatchIdRef.current = batch.batchId;

    const events = batch.events || [];
    if (events.length === 0) {
      setPresentedExpeditionDefeated(Boolean(expeditionState.expeditionDefeated));
      return;
    }

    // DO NOT preempt or cancel an in-flight player/enemy presentation!
    // If a previous batch is still resolving, queue this new batch to begin right after the current one finishes.
    const nowPerf = performance.now();
    const baseQueueOffsetMs =
      activeBatchEndTimeRef.current > nowPerf
        ? Math.ceil(activeBatchEndTimeRef.current - nowPerf) + 250
        : 0;
    if (baseQueueOffsetMs === 0) {
      clearScheduledTimers();
    }

    const seq = expeditionState.roomSequence || [];
    const idx = expeditionState.currentRoomIndex ?? 0;
    const activeRoom =
      expeditionState.inSecretRoom && expeditionState.discoveredSecretRoom
        ? expeditionState.discoveredSecretRoom
        : seq[idx] || null;

    const authoritativeEnemyHp: Record<string, number> = {};
    for (const en of activeRoom?.enemies || []) {
      authoritativeEnemyHp[en.id] = en.hp;
    }
    const authoritativePlayerHp: Record<string, number> = {};
    for (const p of expeditionState.players) {
      authoritativePlayerHp[p.id] = p.hp;
    }

    const enemyDamageEvents = events.filter(
      (e) => e.kind === 'DAMAGE_ENEMY' || e.kind === 'CRIT_ENEMY'
    );
    const enemyAttackHeaderEvents = events.filter(
      (e) => e.kind === 'ENEMY_ATTACK'
    );
    const playerDamageEvents = events.filter((e) => e.kind === 'DAMAGE_PLAYER');
    const shieldEvents = events.filter(
      (e) =>
        e.kind === 'SHIELD_PLAYER' ||
        e.kind === 'DEFEND_ENEMY' ||
        e.kind === 'PROTECT_ENEMY' ||
        e.kind === 'GAIN_DEFENSE'
    );
    const statusAndBuffEvents = events.filter(
      (e) =>
        e.kind === 'STATUS_APPLIED' ||
        e.kind === 'STATUS_REMOVED' ||
        e.kind === 'BUFF_ENEMY' ||
        e.kind === 'TELEGRAPH_ENEMY' ||
        e.kind === 'MINIBOSS_ENRAGE' ||
        e.kind === 'GAIN_ATTACK' ||
        e.kind === 'GAIN_MAGIC'
    );
    const healEvents = events.filter(
      (e) =>
        e.kind === 'HEAL_PLAYER' ||
        e.kind === 'HEAL_ENEMY' ||
        e.kind === 'REVIVE_PLAYER'
    );
    const deathEvents = events.filter(
      (e) => e.kind === 'ENEMY_DEATH' || e.kind === 'MINIBOSS_DEFEATED'
    );
    const lootAndRewardEvents = events.filter(
      (e) =>
        e.kind === 'GAIN_GOLD' ||
        e.kind === 'LOSE_GOLD' ||
        e.kind === 'LOOT_ITEM' ||
        e.kind === 'ITEM_ACQUIRED' ||
        e.kind === 'ITEM_CONSUMED' ||
        e.kind === 'SHOP_PURCHASE' ||
        e.kind === 'WEAPON_EQUIPPED' ||
        e.kind === 'WEAPON_UPGRADED' ||
        e.kind === 'RELIC_OBTAINED' ||
        e.kind === 'RELIC_ACQUIRED' ||
        e.kind === 'ROOM_REWARD' ||
        e.kind === 'DOOR_COMPLETED'
    );
    const bossTransitionEvent = events.find(
      (e) => e.kind === 'BOSS_PHASE_TRANSITION'
    );

    const isEnemyTurnBatch =
      batch.actorAction?.startsWith('ENEMY_') || enemyAttackHeaderEvents.length > 0;
    const isPlayerOffensiveBatch =
      !isEnemyTurnBatch && enemyDamageEvents.length > 0;

    // Identify ONLY enemies that died in THIS batch and are NOT already in DEAD_REMOVED!
    const newlyDyingEnemyIds: string[] = [];
    for (const dEv of deathEvents) {
      if (
        dEv.targetId &&
        !deadRemovedEnemyIdsRef.current.has(dEv.targetId) &&
        !newlyDyingEnemyIds.includes(dEv.targetId)
      ) {
        newlyDyingEnemyIds.push(dEv.targetId);
      }
    }
    for (const en of activeRoom?.enemies || []) {
      if (
        en.hp <= 0 &&
        !deadRemovedEnemyIdsRef.current.has(en.id) &&
        (prevEnemyHpRef.current[en.id] ?? 0) > 0 &&
        !newlyDyingEnemyIds.includes(en.id)
      ) {
        newlyDyingEnemyIds.push(en.id);
      }
    }
    const hasEnemyDeath = newlyDyingEnemyIds.length > 0;

    // Hold expedition defeat screen hidden while this batch's fatal attack/damage/death sequence resolves
    if (expeditionState.expeditionDefeated) {
      setPresentedExpeditionDefeated(false);
    }

    // Immediately register ONLY newly dying enemies in state (synchronously in this effect, NOT delayed!)
    // so they remain mounted on stage in ALIVE -> HIT -> DYING states until STAGE 7 finishes,
    // while NEVER resurrecting enemies that already entered DEAD_REMOVED!
    if (hasEnemyDeath) {
      setHideGroundDropsDuringDeath(true);
      setDyingEnemies((prev) => {
        const dyingMap: Record<string, CriptaRoomEnemy> = { ...prev };
        for (const dyingId of newlyDyingEnemyIds) {
          const baseEnemy =
            knownEnemiesByIdRef.current[dyingId] ||
            activeRoom?.enemies?.find((e) => e.id === dyingId);
          if (baseEnemy) {
            dyingMap[dyingId] = {
              ...baseEnemy,
              hp: Math.max(1, prevEnemyHpRef.current[dyingId] || 1),
            };
          }
        }
        return dyingMap;
      });
    }

    setIsPresentingSequence(true);
    let cursorMs = baseQueueOffsetMs;

    // Clear previous batch's floating badges when this queued batch begins
    if (baseQueueOffsetMs > 0) {
      schedule(() => {
        setActiveVisualEvents([]);
        setActiveTravel(null);
      }, baseQueueOffsetMs);
    } else {
      setActiveVisualEvents([]);
    }

    // =========================================================================
    // STAGE 1: PLAYER ACTION TITLE & ANTICIPATION (Requirements 4, 6, 10)
    // Player Action Title: ~950ms | Attack Anticipation: ~500ms
    // NEVER launch generic objects/projectiles from player to enemy!
    // =========================================================================
    if (isPlayerOffensiveBatch && batch.actorPlayerId) {
      const actorPlayer = expeditionState.players.find(
        (p) => p.id === batch.actorPlayerId
      );
      const firstDmg = enemyDamageEvents[0];
      const vfx = firstDmg?.vfxStyle || 'slash';
      const antStyle =
        vfx === 'arcane' || vfx === 'holy'
          ? 'magic'
          : vfx === 'arrow' || vfx === 'pierce'
          ? 'ranged'
          : vfx === 'alchemy'
          ? 'alchemy'
          : 'melee';

      const actionTitleLabel =
        activeRoom?.lastPlayedCardTitle ||
        firstDmg?.sublabel?.split('·')[0]?.trim() ||
        'ATAQUE';

      // Step 1A: Announce Player Action Title clearly (650ms) + Anticipation (450ms) = 1100ms total before impact
      schedule(() => {
        setActiveActingEnemyId(null);
        setActiveTargetedPlayerIdsDuringPresentation([]);
        setPresentationBannerText(
          `${actorPlayer?.name?.toUpperCase() || 'HÉROE'}: ${actionTitleLabel.toUpperCase()}`
        );
        setPlayerAnimationStates({
          [batch.actorPlayerId!]:
            antStyle === 'magic' || antStyle === 'alchemy' ? 'cast' : 'attack',
        });
        setPlayerCardImpacts({ [batch.actorPlayerId!]: 'ANTICIPATION' });
        laCriptaAudio.playAttackAnticipation(antStyle);
      }, cursorMs);
      cursorMs += 620;

      // Step 1B: Weapon / Skill Strike Lunge (No generic floating objects thrown across screen!)
      schedule(() => {
        laCriptaAudio.playAttackTravel(vfx);
      }, cursorMs);
      cursorMs += 380;

      // =======================================================================
      // STAGE 3: ENEMY IMPACT & DAMAGE NUMBERS (Impact + 1250ms Damage Visibility)
      // =======================================================================
      enemyDamageEvents.forEach((dmgEv, hitIdx) => {
        const hitTime = cursorMs + hitIdx * 280;
        schedule(() => {
          const isCritHit = Boolean(dmgEv.isCrit || dmgEv.kind === 'CRIT_ENEMY');
          laCriptaAudio.playImpactByDamageType(dmgEv.sublabel, isCritHit);

          // Visual Hit-Stop (85–115ms) on impact
          if (isCritHit || hitIdx === 0) {
            setHitStopActive(true);
            schedule(() => setHitStopActive(false), isCritHit ? 115 : 85);
          }

          if (dmgEv.targetId) {
            const targetId = dmgEv.targetId;
            // Enemy enters HIT state (NEVER 'death' yet, even if HP reaches 0!)
            setEnemyAnimStates((prev) => ({
              ...prev,
              [targetId]: 'hit',
            }));

            // Smoothly drop enemy HP bar NOW (with delayed trailing strip)
            const beforeHp =
              prevEnemyHpRef.current[targetId] ??
              (authoritativeEnemyHp[targetId] || 0) + Math.abs(dmgEv.value || 0);
            const afterHp = Math.max(
              authoritativeEnemyHp[targetId] ?? 0,
              beforeHp - Math.abs(dmgEv.value || 0)
            );
            prevEnemyHpRef.current[targetId] = afterHp;

            setPresentedEnemyHp((prev) => ({
              ...prev,
              [targetId]: {
                hp: afterHp,
                trailHp: prev[targetId]?.hp ?? beforeHp,
              },
            }));

            // Return enemy from 'hit' recoil to 'idle' after 420ms (unless Stage 7 sets 'death')
            schedule(() => {
              setEnemyAnimStates((prev) =>
                prev[targetId] === 'hit' ? { ...prev, [targetId]: 'idle' } : prev
              );
            }, 420);

            // Trailing strip catches up after 650ms
            schedule(() => {
              setPresentedEnemyHp((prev) => ({
                ...prev,
                [targetId]: {
                  hp: prev[targetId]?.hp ?? afterHp,
                  trailHp: prev[targetId]?.hp ?? afterHp,
                },
              }));
            }, 650);
          }

          setActiveVisualEvents((prev) => [...prev, dmgEv]);
        }, hitTime);
      });

      // Keep damage numbers comfortably readable (1250ms)
      cursorMs += enemyDamageEvents.length * 280 + 1150;
    } else if (isEnemyTurnBatch) {
      // =======================================================================
      // ENEMY TURN SEQUENCING (Requirements 4, 9, 10, 11):
      // 1. TURNO ENEMIGO — [ENEMY NAME] (highlight ONLY that enemy, 950ms)
      // 2. [ENEMY NAME] PREPARA [ABILITY] -> OBJETIVO: [PLAYER] (550ms)
      // 3. Projectile / Lunge toward specific target player + Impact Result (1350ms)
      // =======================================================================
      const enemyActorId =
        batch.actorPlayerId || enemyAttackHeaderEvents[0]?.targetId || null;
      const actingEnemyObj =
        (enemyActorId
          ? activeRoom?.enemies?.find((e) => e.id === enemyActorId) ||
            knownEnemiesByIdRef.current[enemyActorId]
          : null) || null;
      const headerEv = enemyAttackHeaderEvents[0];
      const enemyDisplayName = actingEnemyObj?.name?.toUpperCase() || 'CRIATURA ENEMIGA';
      const abilityDisplayName = headerEv?.label || 'ATAQUE';

      const targetPlayerIds = playerDamageEvents
        .map((e) => e.targetId)
        .filter((id): id is string => Boolean(id));
      const targetPlayerNames = targetPlayerIds
        .map((pid) => expeditionState.players.find((p) => p.id === pid)?.name)
        .filter(Boolean)
        .join(', ');

      // Step 1: Announce TURNO ENEMIGO + Enemy Name & highlight ONLY that enemy
      schedule(() => {
        setActiveActingEnemyId(enemyActorId);
        setActiveTargetedPlayerIdsDuringPresentation(targetPlayerIds);
        setPresentationBannerText(`⚔ TURNO ENEMIGO · ${enemyDisplayName}`);
        laCriptaAudio.playAttackAnticipation('enemy');
      }, cursorMs);
      cursorMs += 850;

      // Step 2: Announce "[ENEMY NAME] PREPARA [ABILITY]" + Target Player
      schedule(() => {
        setPresentationBannerText(
          targetPlayerNames
            ? `⚔ ${enemyDisplayName} PREPARA ${abilityDisplayName} → OBJETIVO: ${targetPlayerNames.toUpperCase()}`
            : `⚔ ${enemyDisplayName} PREPARA ${abilityDisplayName}`
        );
        if (enemyActorId) {
          setEnemyAnimStates({ [enemyActorId]: 'lunge' });
        }
        if (headerEv) {
          setActiveVisualEvents([headerEv]);
        }
      }, cursorMs);
      cursorMs += 620;

      if (playerDamageEvents.length > 0) {
        const enemyVfx = playerDamageEvents[0]?.vfxStyle || headerEv?.vfxStyle || 'claw';
        const firstTargetPid = playerDamageEvents[0]?.targetId;
        const firstTargetPlayer = firstTargetPid
          ? expeditionState.players.find((p) => p.id === firstTargetPid)
          : undefined;

        // Launch enemy directional attack / projectile directly toward the targeted player's HUD card!
        schedule(() => {
          laCriptaAudio.playAttackTravel(enemyVfx);
          setActiveTravel({
            id: `en_travel_${batch.batchId}`,
            direction: 'ENEMY_TO_PLAYER',
            vfxStyle: enemyVfx,
            label: abilityDisplayName,
            color: '#C93B5B',
            sourceEnemyId: enemyActorId || undefined,
            sourceEnemyName: enemyDisplayName,
            targetPlayerId: firstTargetPid,
            targetPlayerName: firstTargetPlayer?.name || targetPlayerNames || undefined,
            targetPlayerColor: firstTargetPlayer?.color || '#FF4D6D',
          });
        }, cursorMs);
        cursorMs += 520;

        playerDamageEvents.forEach((pDmgEv, pIdx) => {
          const hitTime = cursorMs + pIdx * 260;
          schedule(() => {
            setActiveTravel(null);
            laCriptaAudio.playImpactByDamageType('FISICO', false);
            setHitStopActive(true);
            schedule(() => setHitStopActive(false), 85);

            if (pDmgEv.targetId) {
              const pid = pDmgEv.targetId;
              setPlayerAnimationStates((prev) => ({ ...prev, [pid]: 'hit' }));
              setPlayerCardImpacts((prev) => ({ ...prev, [pid]: 'DAMAGE' }));

              const beforeHp =
                prevPlayerHpRef.current[pid] ??
                (authoritativePlayerHp[pid] || 0) + Math.abs(pDmgEv.value || 0);
              const afterHp = authoritativePlayerHp[pid] ?? beforeHp;
              prevPlayerHpRef.current[pid] = afterHp;

              setPresentedPlayerHp((prev) => ({
                ...prev,
                [pid]: {
                  hp: afterHp,
                  trailHp: prev[pid]?.hp ?? beforeHp,
                },
              }));

              schedule(() => {
                setPresentedPlayerHp((prev) => ({
                  ...prev,
                  [pid]: {
                    hp: prev[pid]?.hp ?? afterHp,
                    trailHp: prev[pid]?.hp ?? afterHp,
                  },
                }));
              }, 650);
            }

            setActiveVisualEvents((prev) => [...prev, pDmgEv]);
          }, hitTime);
        });

        cursorMs += playerDamageEvents.length * 260 + 1150;
      }

      // If Espina Viva reflected damage back to the enemy, present it sequentially AFTER player hit!
      if (enemyDamageEvents.length > 0) {
        schedule(() => {
          enemyDamageEvents.forEach((refEv) => {
            laCriptaAudio.playSwordSlash(false);
            if (refEv.targetId) {
              const eid = refEv.targetId;
              const afterHp = authoritativeEnemyHp[eid] ?? 0;
              prevEnemyHpRef.current[eid] = afterHp;
              setEnemyAnimStates((prev) => ({ ...prev, [eid]: 'hit' }));
              setPresentedEnemyHp((prev) => ({
                ...prev,
                [eid]: { hp: afterHp, trailHp: afterHp },
              }));
            }
            setActiveVisualEvents((prev) => [...prev, refEv]);
          });
        }, cursorMs);
        cursorMs += 780;
      }
    } else if (playerDamageEvents.length > 0) {
      // Non-enemy player damage (e.g., trap, blood tribute, poison/bleed tick at end of round)
      playerDamageEvents.forEach((pDmgEv, pIdx) => {
        schedule(() => {
          laCriptaAudio.playSwordSlash(false);
          if (pDmgEv.targetId) {
            const pid = pDmgEv.targetId;
            const beforeHp = prevPlayerHpRef.current[pid] ?? authoritativePlayerHp[pid] ?? 0;
            const afterHp = authoritativePlayerHp[pid] ?? beforeHp;
            prevPlayerHpRef.current[pid] = afterHp;
            setPlayerAnimationStates((prev) => ({ ...prev, [pid]: 'hit' }));
            setPlayerCardImpacts((prev) => ({ ...prev, [pid]: 'DAMAGE' }));
            setPresentedPlayerHp((prev) => ({
              ...prev,
              [pid]: { hp: afterHp, trailHp: beforeHp },
            }));
            schedule(() => {
              setPresentedPlayerHp((prev) => ({
                ...prev,
                [pid]: { hp: afterHp, trailHp: afterHp },
              }));
            }, 600);
          }
          setActiveVisualEvents((prev) => [...prev, pDmgEv]);
        }, cursorMs + pIdx * 220);
      });
      cursorMs += playerDamageEvents.length * 220 + 950;
    }

    // =========================================================================
    // STAGE 4: SHIELD / GUARD / BLOCK (1050ms)
    // =========================================================================
    if (shieldEvents.length > 0) {
      schedule(() => {
        setPresentationBannerText('✦ GUARDIA Y PROTECCIÓN ACTIVA ✦');
        laCriptaAudio.playShieldGuard();
        for (const sEv of shieldEvents) {
          if (sEv.targetType === 'PLAYER' && sEv.targetId) {
            setPlayerAnimationStates((prev) => ({
              ...prev,
              [sEv.targetId!]: 'defend',
            }));
            setPlayerCardImpacts((prev) => ({
              ...prev,
              [sEv.targetId!]: 'SHIELD',
            }));
          }
        }
        setActiveVisualEvents((prev) => [...prev, ...shieldEvents]);
      }, cursorMs);
      cursorMs += 1050;
    }

    // =========================================================================
    // STAGE 5: STATUS EFFECTS, BUFFS & DEBUFFS (Sequenced after impact! 1200ms)
    // =========================================================================
    if (statusAndBuffEvents.length > 0) {
      schedule(() => {
        const hasEnrage = statusAndBuffEvents.some(
          (e) => e.kind === 'MINIBOSS_ENRAGE'
        );
        const firstStatusLabel = statusAndBuffEvents[0]?.label;
        if (firstStatusLabel) {
          setPresentationBannerText(`✦ ESTADO APLICADO: ${firstStatusLabel} ✦`);
        }
        if (hasEnrage) {
          laCriptaAudio.playMinibossEnrage();
        } else {
          laCriptaAudio.playMagicCast();
        }
        for (const stEv of statusAndBuffEvents) {
          if (stEv.targetType === 'PLAYER' && stEv.targetId) {
            const isBuff =
              stEv.kind === 'GAIN_ATTACK' ||
              stEv.kind === 'GAIN_MAGIC' ||
              stEv.statusType === 'BLESSED' ||
              stEv.statusType === 'REGENERATION' ||
              stEv.statusType === 'SHIELDED';
            setPlayerAnimationStates((prev) => ({
              ...prev,
              [stEv.targetId!]: isBuff ? 'buff' : 'debuff',
            }));
            setPlayerCardImpacts((prev) => ({
              ...prev,
              [stEv.targetId!]: isBuff ? 'BUFF' : 'DEBUFF',
            }));
          } else if (stEv.targetType === 'ENEMY' && stEv.targetId) {
            setEnemyAnimStates((prev) => ({
              ...prev,
              [stEv.targetId!]: 'hit',
            }));
          }
        }
        setActiveVisualEvents((prev) => [...prev, ...statusAndBuffEvents]);
      }, cursorMs);
      cursorMs += 1200;
    }

    // =========================================================================
    // STAGE 6: SEQUENTIAL LIFESTEAL / HEALING (NEVER simultaneous with attack! 1200ms)
    // =========================================================================
    if (healEvents.length > 0) {
      // If this batch also dealt enemy damage, show life-essence traveling from Enemy -> Player first!
      if (isPlayerOffensiveBatch) {
        const healTargetPlayerId = healEvents.find((e) => e.targetType === 'PLAYER')?.targetId;
        const healTargetPlayer = healTargetPlayerId
          ? expeditionState.players.find((p) => p.id === healTargetPlayerId)
          : undefined;
        schedule(() => {
          setPresentationBannerText('✦ DRENAJE VITAL EN CURSO ✦');
          laCriptaAudio.playLifestealTravel();
          setActiveTravel({
            id: `lifesteal_${batch.batchId}`,
            direction: 'LIFESTEAL_TO_PLAYER',
            vfxStyle: 'lifesteal',
            label: 'ESENCIA VITAL',
            color: '#E03E52',
            sourceEnemyId: enemyDamageEvents[0]?.targetId,
            targetPlayerId: healTargetPlayerId,
            targetPlayerName: healTargetPlayer?.name,
          });
        }, cursorMs);
        cursorMs += 540;
      }

      schedule(() => {
        setActiveTravel(null);
        setPresentationBannerText('✦ SALUD RESTAURADA ✦');
        const hasRevive = healEvents.some((e) => e.kind === 'REVIVE_PLAYER');
        if (hasRevive) {
          laCriptaAudio.playReviveFanfare();
        } else {
          laCriptaAudio.playHealChime();
        }

        for (const hEv of healEvents) {
          if (hEv.targetType === 'PLAYER' && hEv.targetId) {
            const pid = hEv.targetId;
            const afterHp = authoritativePlayerHp[pid] ?? prevPlayerHpRef.current[pid] ?? 1;
            prevPlayerHpRef.current[pid] = afterHp;
            setPlayerAnimationStates((prev) => ({
              ...prev,
              [pid]: hEv.kind === 'REVIVE_PLAYER' ? 'revive' : 'heal',
            }));
            setPlayerCardImpacts((prev) => ({ ...prev, [pid]: 'HEAL' }));
            setPresentedPlayerHp((prev) => ({
              ...prev,
              [pid]: { hp: afterHp, trailHp: afterHp },
            }));
          } else if (hEv.targetType === 'ENEMY' && hEv.targetId) {
            const eid = hEv.targetId;
            const afterHp = authoritativeEnemyHp[eid] ?? prevEnemyHpRef.current[eid] ?? 1;
            prevEnemyHpRef.current[eid] = afterHp;
            setPresentedEnemyHp((prev) => ({
              ...prev,
              [eid]: { hp: afterHp, trailHp: afterHp },
            }));
          }
        }
        setActiveVisualEvents((prev) => [...prev, ...healEvents]);
      }, cursorMs);
      cursorMs += 1150;
    }

    // =========================================================================
    // STAGE 7: DRAMATIC ENEMY DEATH SEQUENCE (Requirements 15, 16, 17, 18)
    // Enemy transitions from ALIVE ('hit') -> DYING ('death') -> DEAD_REMOVED!
    // If multiple enemies die in one action, stagger their deaths cleanly and
    // remove each enemy permanently when its death animation finishes.
    // =========================================================================
    if (hasEnemyDeath) {
      newlyDyingEnemyIds.forEach((dyingId, idx) => {
        const deathStartMs = cursorMs + idx * 320;
        const deathEndMs = deathStartMs + 1150;
        const matchingDeathEvents = deathEvents.filter((e) => e.targetId === dyingId);

        schedule(() => {
          setPresentationBannerText('☠ ¡CRIATURA ABATIDA! ☠');
          laCriptaAudio.playEnemyDeath();
          setEnemyLifecycleStates((prev) => ({
            ...prev,
            [dyingId]: 'DYING',
          }));
          setEnemyAnimStates((prev) => ({
            ...prev,
            [dyingId]: 'death',
          }));
          setPresentedEnemyHp((prev) => ({
            ...prev,
            [dyingId]: { hp: 0, trailHp: 0 },
          }));
          if (matchingDeathEvents.length > 0) {
            setActiveVisualEvents((prev) => [...prev, ...matchingDeathEvents]);
          }
        }, deathStartMs);

        // Permanently transition this enemy to DEAD_REMOVED once its death completes
        schedule(() => {
          deadRemovedEnemyIdsRef.current.add(dyingId);
          setEnemyLifecycleStates((prev) => ({
            ...prev,
            [dyingId]: 'DEAD_REMOVED',
          }));
          setDyingEnemies((prev) => {
            const next = { ...prev };
            delete next[dyingId];
            return next;
          });
          setEnemyAnimStates((prev) => {
            const next = { ...prev };
            delete next[dyingId];
            return next;
          });
        }, deathEndMs);
      });

      cursorMs += (newlyDyingEnemyIds.length - 1) * 320 + 1200;
    }

    // =========================================================================
    // STAGE 7B: PLAYER DEATH & EXPEDITION DEFEAT SEQUENCE (Requirements 19–24)
    // Play player death state and pause briefly BEFORE revealing defeat screen!
    // =========================================================================
    if (expeditionState.expeditionDefeated) {
      schedule(() => {
        setPresentationBannerText('☠ ¡EL GRUPO HA CAÍDO EN LA CRIPTA! ☠');
        setActiveActingEnemyId(null);
        setActiveTargetedPlayerIdsDuringPresentation([]);
        const fallenMap: Record<string, CriptaSpriteAnimationState> = {};
        for (const p of expeditionState.players) {
          if (p.isConnected) {
            fallenMap[p.id] = 'debuff';
          }
        }
        setPlayerAnimationStates(fallenMap);
      }, cursorMs);
      cursorMs += 1050;
    }

    // =========================================================================
    // STAGE 8: LOOT, GOLD & RELIC REVEAL (After enemy death finishes!)
    // =========================================================================
    if (lootAndRewardEvents.length > 0 || hasEnemyDeath) {
      schedule(() => {
        setHideGroundDropsDuringDeath(false);
        if (lootAndRewardEvents.length > 0) {
          const goldGainEv = lootAndRewardEvents.find(
            (e) => e.kind === 'GAIN_GOLD' && (e.value || 0) > 0
          );
          if (goldGainEv) {
            setActiveGoldBurst({
              id: `gold_burst_${batch.batchId}`,
              amount: Math.abs(goldGainEv.value || 0),
              label: goldGainEv.sublabel,
              isGain: true,
            });
            schedule(() => setActiveGoldBurst(null), 1200);
          }

          const relicEv = lootAndRewardEvents.find(
            (e) =>
              (e.kind === 'RELIC_ACQUIRED' || e.kind === 'RELIC_OBTAINED') &&
              Boolean(e.relicId)
          );
          if (relicEv?.relicId) {
            laCriptaAudio.playReviveFanfare();
            setActiveRelicRevealId(relicEv.relicId);
            schedule(() => setActiveRelicRevealId(null), 2800);
          } else {
            const isLoseGold = lootAndRewardEvents.every(
              (e) => e.kind === 'LOSE_GOLD'
            );
            laCriptaAudio.playGoldChange(!isLoseGold);
          }
          setActiveVisualEvents((prev) => [...prev, ...lootAndRewardEvents]);
        }
      }, cursorMs);
      if (lootAndRewardEvents.length > 0) {
        cursorMs += 950;
      }
    }

    if (bossTransitionEvent) {
      schedule(() => {
        laCriptaAudio.playSwordSlash(true);
        setShowBossPhaseTransition(true);
        schedule(() => setShowBossPhaseTransition(false), 2400);
      }, cursorMs);
      cursorMs += 950;
    }

    // =========================================================================
    // STAGE 9: ACTION_END — Sync Final Authoritative HP & Release Presentation Lock
    // =========================================================================
    const totalDuration = Math.max(baseQueueOffsetMs + 950, cursorMs);
    activeBatchEndTimeRef.current = performance.now() + totalDuration;

    schedule(() => {
      // Only clear global lock if no newer batch was queued after this one
      if (performance.now() >= activeBatchEndTimeRef.current - 50) {
        setIsPresentingSequence(false);
        setPresentationBannerText(null);
        setActiveTravel(null);
        setPlayerAnimationStates({});
        setEnemyAnimStates({});
        setPlayerCardImpacts({});
        setDyingEnemies({});
        setHideGroundDropsDuringDeath(false);
        setActiveActingEnemyId(null);
        setActiveTargetedPlayerIdsDuringPresentation([]);
        setPresentedExpeditionDefeated(Boolean(expeditionState.expeditionDefeated));
      }

      // Final authoritative sync
      const finalEnemyHp: Record<string, { hp: number; trailHp: number }> = {};
      for (const en of activeRoom?.enemies || []) {
        finalEnemyHp[en.id] = { hp: en.hp, trailHp: en.hp };
        prevEnemyHpRef.current[en.id] = en.hp;
      }
      setPresentedEnemyHp(finalEnemyHp);

      const finalPlayerHp: Record<string, { hp: number; trailHp: number }> = {};
      for (const p of expeditionState.players) {
        finalPlayerHp[p.id] = { hp: p.hp, trailHp: p.hp };
        prevPlayerHpRef.current[p.id] = p.hp;
      }
      setPresentedPlayerHp(finalPlayerHp);
    }, totalDuration);

    // Clear floating badges after sequence ends so the last status/damage number stays readable
    schedule(() => {
      if (performance.now() >= activeBatchEndTimeRef.current + 650) {
        setActiveVisualEvents([]);
      }
    }, totalDuration + 850);
  }, [expeditionState]);

  return {
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
  };
}
