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
            <rect x="4" y="4" width="16" height="16" fill="#C93B5B" />
            <rect x="6" y="6" width="12" height="12" fill="#E7A54A" />
            <rect x="9" y="9" width="6" height="6" fill="#FFF3C4" />
            <rect x="1" y="10" width="3" height="4" fill="#FFD166" />
            <rect x="20" y="10" width="3" height="4" fill="#FFD166" />
            <rect x="10" y="1" width="4" height="3" fill="#FFD166" />
            <rect x="10" y="20" width="4" height="3" fill="#FFD166" />
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
}

export interface ActiveGoldBurst {
  id: string;
  amount: number;
  label?: string;
  isGain: boolean;
}

/**
 * True pixel-art projectile sprite for RANGED, MAGIC, ALCHEMY, and LIFESTEAL travel.
 * Normal melee attacks (slash, cleave, blunt, claw) NEVER throw objects across the screen!
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
          {/* High-velocity fletched arrow / bolt oriented toward the left enemy stage */}
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
    </svg>
  );
};

export const LaCriptaDirectionalTravelOverlay: React.FC<{
  travel: ActiveDirectionalTravel | null;
}> = ({ travel }) => {
  const [progress, setProgress] = useState<'START' | 'END'>('START');

  useEffect(() => {
    if (!travel) {
      setProgress('START');
      return;
    }
    setProgress('START');
    const raf = window.requestAnimationFrame(() => {
      setProgress('END');
    });
    return () => window.cancelAnimationFrame(raf);
  }, [travel]);

  if (!travel) return null;

  // Player -> Enemy moves from right action area toward left enemy stage
  // Enemy -> Player moves from left enemy stage toward bottom player HUD
  // Lifesteal moves from left enemy stage toward bottom player HUD in a swirling siphon arc
  const startTransform =
    travel.direction === 'PLAYER_TO_ENEMY'
      ? 'translate(62vw, 64vh) scale(0.85)'
      : 'translate(22vw, 42vh) scale(0.9)';

  const endTransform =
    travel.direction === 'PLAYER_TO_ENEMY'
      ? 'translate(24vw, 40vh) scale(1.15)'
      : 'translate(48vw, 84vh) scale(1.12)';

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden select-none">
      <div
        style={{
          transform: progress === 'START' ? startTransform : endTransform,
          transition:
            travel.direction === 'LIFESTEAL_TO_PLAYER'
              ? 'transform 460ms cubic-bezier(0.22, 1, 0.36, 1)'
              : 'transform 340ms cubic-bezier(0.16, 1, 0.3, 1)',
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
        {travel.label && (
          <span
            style={{ borderColor: travel.color, color: travel.color }}
            className="px-2 py-0.5 bg-[#09070D]/95 border text-[9px] font-cripta-pixel font-bold uppercase tracking-widest shadow-lg"
          >
            {travel.label}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * 60 FPS Gold Collection Coin Arc & Banner Overlay (Priority 12).
 * Spawns gleaming pixel gold coins that arc from the chamber toward the top-right ORO counter.
 */
export const LaCriptaGoldCollectionOverlay: React.FC<{
  burst: ActiveGoldBurst | null;
}> = ({ burst }) => {
  const [phase, setPhase] = useState<'START' | 'FLY'>('START');

  useEffect(() => {
    if (!burst || !burst.isGain) {
      setPhase('START');
      return;
    }
    setPhase('START');
    const raf = window.requestAnimationFrame(() => {
      setPhase('FLY');
    });
    return () => window.cancelAnimationFrame(raf);
  }, [burst]);

  if (!burst || !burst.isGain) return null;

  const coinOffsets = [
    { startX: 44, startY: 54, delayMs: 0 },
    { startX: 48, startY: 58, delayMs: 55 },
    { startX: 52, startY: 52, delayMs: 110 },
    { startX: 46, startY: 50, delayMs: 165 },
    { startX: 54, startY: 56, delayMs: 215 },
    { startX: 50, startY: 60, delayMs: 265 },
  ];

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden select-none">
      {coinOffsets.map((c, idx) => (
        <div
          key={`${burst.id}_coin_${idx}`}
          style={{
            transform:
              phase === 'START'
                ? `translate(${c.startX}vw, ${c.startY}vh) scale(0.95)`
                : 'translate(83vw, 3.5vh) scale(0.65)',
            opacity: phase === 'START' ? 1 : 0.25,
            transition: `transform 680ms cubic-bezier(0.2, 0.9, 0.3, 1) ${c.delayMs}ms, opacity 680ms ease-in ${c.delayMs}ms`,
          }}
          className="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2"
        >
          <svg
            width={26}
            height={26}
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
      ))}

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
// ENEMY DEATH COLLAPSE & SOUL DISSOLVE OVERLAY (Section 6 & Death Animations)
// ============================================================================

export const LaCriptaEnemyDeathOverlay: React.FC<{
  enemyName: string;
  isBossOrMiniboss?: boolean;
}> = ({ enemyName, isBossOrMiniboss = false }) => {
  return (
    <div className="pointer-events-none absolute inset-0 z-40 flex flex-col items-center justify-center select-none">
      {/* Rising Soul / Bone / Ember Pixel Particles */}
      <svg
        width={isBossOrMiniboss ? 220 : 160}
        height={isBossOrMiniboss ? 220 : 160}
        viewBox="0 0 32 32"
        shapeRendering="crispEdges"
        className="animate-pulse"
      >
        <rect x="14" y="6" width="4" height="4" fill="#FFF3C4" />
        <rect x="8" y="10" width="3" height="3" fill="#E7A54A" />
        <rect x="21" y="9" width="3" height="3" fill="#C93B5B" />
        <rect x="6" y="18" width="3" height="3" fill="#9B72CF" />
        <rect x="23" y="17" width="3" height="3" fill="#FFD166" />
        <rect x="11" y="22" width="4" height="2" fill="#D9D0BC" />
        <rect x="18" y="23" width="4" height="2" fill="#D9D0BC" />
        <rect x="15" y="13" width="2" height="8" fill="#FF4D6D" />
      </svg>
      <div className="mt-1 px-3 py-1 bg-[#1A0910]/95 border-2 border-[#FF4D6D] text-[10px] sm:text-xs font-cripta-pixel font-black text-[#FFD166] uppercase tracking-widest shadow-[0_0_24px_rgba(255,77,109,0.8)]">
        ☠ {enemyName} DERROTADO ☠
      </div>
    </div>
  );
};

// ============================================================================
// ACTION PRESENTATION QUEUE COMPILER & ENGINE HOOK (Sections 1–20)
// ============================================================================

export interface LaCriptaPresentationState {
  isPresentingSequence: boolean;
  presentationBannerText: string | null;
  hitStopActive: boolean;
  activeVisualEvents: CriptaVisualEvent[];
  activeTravel: ActiveDirectionalTravel | null;
  activeGoldBurst: ActiveGoldBurst | null;
  playerAnimationStates: Record<string, CriptaSpriteAnimationState>;
  enemyAnimStates: Record<string, 'idle' | 'hit' | 'lunge' | 'death'>;
  presentedEnemyHp: Record<string, { hp: number; trailHp: number }>;
  presentedPlayerHp: Record<string, { hp: number; trailHp: number }>;
  dyingEnemies: Record<string, CriptaRoomEnemy>;
  hideGroundDropsDuringDeath: boolean;
  playerCardImpacts: Record<
    string,
    'DAMAGE' | 'HEAL' | 'SHIELD' | 'BUFF' | 'DEBUFF' | 'ANTICIPATION'
  >;
  activeRelicRevealId: CriptaVisualEvent['relicId'] | null;
  showBossPhaseTransition: boolean;
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
  const [presentedEnemyHp, setPresentedEnemyHp] = useState<
    Record<string, { hp: number; trailHp: number }>
  >({});
  const [presentedPlayerHp, setPresentedPlayerHp] = useState<
    Record<string, { hp: number; trailHp: number }>
  >({});
  const [dyingEnemies, setDyingEnemies] = useState<Record<string, CriptaRoomEnemy>>({});
  const [hideGroundDropsDuringDeath, setHideGroundDropsDuringDeath] = useState(false);
  const [playerCardImpacts, setPlayerCardImpacts] = useState<
    Record<string, 'DAMAGE' | 'HEAL' | 'SHIELD' | 'BUFF' | 'DEBUFF' | 'ANTICIPATION'>
  >({});
  const [activeRelicRevealId, setActiveRelicRevealId] = useState<
    CriptaVisualEvent['relicId'] | null
  >(null);
  const [showBossPhaseTransition, setShowBossPhaseTransition] = useState(false);

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

    const roomKey = `${expeditionState.phase}_${expeditionState.selectedDungeonId || 'none'}_${
      activeRoom?.id || idx
    }`;

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
      setPlayerCardImpacts({});

      const snapEnemyHp: Record<string, { hp: number; trailHp: number }> = {};
      const nextPrevEnemy: Record<string, number> = {};
      for (const en of activeRoom?.enemies || []) {
        snapEnemyHp[en.id] = { hp: en.hp, trailHp: en.hp };
        nextPrevEnemy[en.id] = en.hp;
        knownEnemiesByIdRef.current[en.id] = { ...en };
      }
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
    if (!isPresentingSequence && batchId === lastProcessedBatchIdRef.current) {
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
    if (events.length === 0) return;

    // DO NOT preempt or cancel an in-flight player/enemy presentation!
    // If a previous batch is still resolving, queue this new batch to begin right after the current one finishes.
    const nowPerf = performance.now();
    const baseQueueOffsetMs =
      activeBatchEndTimeRef.current > nowPerf
        ? Math.ceil(activeBatchEndTimeRef.current - nowPerf) + 220
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
    const hasEnemyDeath = deathEvents.length > 0;

    // If an enemy died in this batch, keep them visible on stage in dyingEnemies and hide new ground drops until death finishes!
    if (hasEnemyDeath) {
      schedule(() => {
        setHideGroundDropsDuringDeath(true);
        const dyingMap: Record<string, CriptaRoomEnemy> = {};
        for (const dEv of deathEvents) {
          if (dEv.targetId && knownEnemiesByIdRef.current[dEv.targetId]) {
            dyingMap[dEv.targetId] = {
              ...knownEnemiesByIdRef.current[dEv.targetId],
              hp: 0,
            };
          }
        }
        for (const en of activeRoom?.enemies || []) {
          if (en.hp <= 0 && (prevEnemyHpRef.current[en.id] ?? 0) > 0) {
            dyingMap[en.id] = { ...en, hp: 0 };
          }
        }
        setDyingEnemies(dyingMap);
      }, baseQueueOffsetMs);
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
    // STAGE 1: ANTICIPATION (360ms)
    // =========================================================================
    if (isPlayerOffensiveBatch && batch.actorPlayerId) {
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
      const isProjectileAttack =
        antStyle === 'ranged' || antStyle === 'magic' || antStyle === 'alchemy';

      schedule(() => {
        setPresentationBannerText(
          antStyle === 'magic'
            ? 'CANALIZANDO CONJURO...'
            : antStyle === 'ranged'
            ? 'APUNTANDO PROYECTIL...'
            : antStyle === 'alchemy'
            ? 'PREPARANDO MEZCLA...'
            : 'PREPARANDO GOLPE...'
        );
        setPlayerAnimationStates({
          [batch.actorPlayerId!]:
            antStyle === 'magic' || antStyle === 'alchemy' ? 'cast' : 'attack',
        });
        setPlayerCardImpacts({ [batch.actorPlayerId!]: 'ANTICIPATION' });
        laCriptaAudio.playAttackAnticipation(antStyle);
      }, cursorMs);
      cursorMs += 360;

      // =======================================================================
      // STAGE 2: RANGED/MAGIC/ALCHEMY PROJECTILE OR MELEE WEAPON LUNGE (340ms)
      // Priority 9: NEVER throw generic objects at enemies for normal melee attacks!
      // =======================================================================
      if (isProjectileAttack) {
        schedule(() => {
          setPresentationBannerText('¡IMPACTO EN CURSO!');
          laCriptaAudio.playAttackTravel(vfx);
          setActiveTravel({
            id: `travel_${batch.batchId}`,
            direction: 'PLAYER_TO_ENEMY',
            vfxStyle: vfx,
            label: firstDmg?.sublabel?.split('·')[0]?.trim(),
            color: firstDmg?.color || '#FFD166',
            isCrit: firstDmg?.isCrit || firstDmg?.kind === 'CRIT_ENEMY',
          });
        }, cursorMs);
        cursorMs += 340;
      } else {
        // Melee lunge directly into the strike without throwing a floating icon across the screen
        schedule(() => {
          setPresentationBannerText('¡GOLPE CUERPO A CUERPO!');
          laCriptaAudio.playAttackTravel('slash');
        }, cursorMs);
        cursorMs += 190;
      }

      // =======================================================================
      // STAGE 3: ENEMY IMPACT & DAMAGE NUMBERS (Staggered 220ms for Multi-Target)
      // =======================================================================
      enemyDamageEvents.forEach((dmgEv, hitIdx) => {
        const hitTime = cursorMs + hitIdx * 220;
        schedule(() => {
          setActiveTravel(null);
          const isCritHit = Boolean(dmgEv.isCrit || dmgEv.kind === 'CRIT_ENEMY');
          laCriptaAudio.playImpactByDamageType(dmgEv.sublabel, isCritHit);

          // Short visual Hit-Stop (65–95ms) on strong physical or critical impacts
          if (isCritHit || hitIdx === 0) {
            setHitStopActive(true);
            schedule(() => setHitStopActive(false), isCritHit ? 95 : 65);
          }

          if (dmgEv.targetId) {
            setEnemyAnimStates((prev) => ({
              ...prev,
              [dmgEv.targetId!]: 'hit',
            }));

            // Smoothly drop enemy HP bar NOW (with delayed trailing strip)
            const targetId = dmgEv.targetId;
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

            // Trailing strip catches up after 520ms
            schedule(() => {
              setPresentedEnemyHp((prev) => ({
                ...prev,
                [targetId]: {
                  hp: prev[targetId]?.hp ?? afterHp,
                  trailHp: prev[targetId]?.hp ?? afterHp,
                },
              }));
            }, 520);
          }

          setActiveVisualEvents((prev) => [...prev, dmgEv]);
        }, hitTime);
      });

      cursorMs += enemyDamageEvents.length * 220 + 680;
    } else if (isEnemyTurnBatch) {
      // =======================================================================
      // ENEMY TURN SEQUENCING: Anticipation (380ms) -> Lunge/Strike -> Player Hit
      // =======================================================================
      const enemyActorId =
        batch.actorPlayerId || enemyAttackHeaderEvents[0]?.targetId || undefined;
      const headerEv = enemyAttackHeaderEvents[0];

      schedule(() => {
        setPresentationBannerText(
          headerEv?.label
            ? `⚔ ATAQUE ENEMIGO: ${headerEv.label}`
            : '⚔ TURNO DEL ENEMIGO · RESOLVIENDO...'
        );
        if (enemyActorId) {
          setEnemyAnimStates({ [enemyActorId]: 'lunge' });
        }
        if (headerEv) {
          setActiveVisualEvents([headerEv]);
        }
        laCriptaAudio.playAttackAnticipation('enemy');
      }, cursorMs);
      cursorMs += 400;

      if (playerDamageEvents.length > 0) {
        const enemyVfx = playerDamageEvents[0]?.vfxStyle || 'claw';
        const isEnemyRangedOrMagic =
          enemyVfx === 'arcane' ||
          enemyVfx === 'arrow' ||
          enemyVfx === 'pierce' ||
          enemyVfx === 'alchemy';

        if (isEnemyRangedOrMagic) {
          schedule(() => {
            laCriptaAudio.playAttackTravel(enemyVfx);
            setActiveTravel({
              id: `en_travel_${batch.batchId}`,
              direction: 'ENEMY_TO_PLAYER',
              vfxStyle: enemyVfx,
              label: headerEv?.label,
              color: '#C93B5B',
            });
          }, cursorMs);
          cursorMs += 340;
        } else {
          schedule(() => {
            laCriptaAudio.playAttackTravel('claw');
          }, cursorMs);
          cursorMs += 200;
        }

        playerDamageEvents.forEach((pDmgEv, pIdx) => {
          const hitTime = cursorMs + pIdx * 210;
          schedule(() => {
            setActiveTravel(null);
            laCriptaAudio.playImpactByDamageType('FISICO', false);
            setHitStopActive(true);
            schedule(() => setHitStopActive(false), 70);

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
              }, 520);
            }

            setActiveVisualEvents((prev) => [...prev, pDmgEv]);
          }, hitTime);
        });

        cursorMs += playerDamageEvents.length * 210 + 680;
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
        cursorMs += 580;
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
            }, 480);
          }
          setActiveVisualEvents((prev) => [...prev, pDmgEv]);
        }, cursorMs + pIdx * 180);
      });
      cursorMs += playerDamageEvents.length * 180 + 620;
    }

    // =========================================================================
    // STAGE 4: SHIELD / GUARD / BLOCK (680ms)
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
      cursorMs += 680;
    }

    // =========================================================================
    // STAGE 5: STATUS EFFECTS, BUFFS & DEBUFFS (Sequenced after impact! 760ms)
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
      cursorMs += 760;
    }

    // =========================================================================
    // STAGE 6: SEQUENTIAL LIFESTEAL / HEALING (NEVER simultaneous with attack!)
    // =========================================================================
    if (healEvents.length > 0) {
      // If this batch also dealt enemy damage, show life-essence traveling from Enemy -> Player first!
      if (isPlayerOffensiveBatch) {
        schedule(() => {
          setPresentationBannerText('✦ DRENAJE VITAL EN CURSO ✦');
          laCriptaAudio.playLifestealTravel();
          setActiveTravel({
            id: `lifesteal_${batch.batchId}`,
            direction: 'LIFESTEAL_TO_PLAYER',
            vfxStyle: 'lifesteal',
            label: 'ESENCIA VITAL',
            color: '#E03E52',
          });
        }, cursorMs);
        cursorMs += 480;
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
      cursorMs += 780;
    }

    // =========================================================================
    // STAGE 7: DRAMATIC ENEMY DEATH SEQUENCE (1650ms)
    // =========================================================================
    if (hasEnemyDeath) {
      schedule(() => {
        setPresentationBannerText('☠ ¡CRIATURA ABATIDA! ☠');
        laCriptaAudio.playEnemyDeath();
        for (const dEv of deathEvents) {
          if (dEv.targetId) {
            setEnemyAnimStates((prev) => ({
              ...prev,
              [dEv.targetId!]: 'death',
            }));
          }
        }
        setActiveVisualEvents((prev) => [...prev, ...deathEvents]);
      }, cursorMs);
      cursorMs += 1650;
    }

    // =========================================================================
    // STAGE 8: LOOT, GOLD & RELIC REVEAL (After enemy death finishes!)
    // =========================================================================
    if (lootAndRewardEvents.length > 0 || hasEnemyDeath) {
      schedule(() => {
        setHideGroundDropsDuringDeath(false);
        setDyingEnemies({});
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
            schedule(() => setActiveGoldBurst(null), 1150);
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
        cursorMs += 820;
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
    const totalDuration = Math.max(baseQueueOffsetMs + 720, cursorMs);
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
      if (performance.now() >= activeBatchEndTimeRef.current + 500) {
        setActiveVisualEvents([]);
      }
    }, totalDuration + 700);
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
    presentedEnemyHp,
    presentedPlayerHp,
    dyingEnemies,
    hideGroundDropsDuringDeath,
    playerCardImpacts,
    activeRelicRevealId,
    showBossPhaseTransition,
  };
}
