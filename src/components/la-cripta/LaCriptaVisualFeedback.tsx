import React from 'react';
import { CriptaVisualEvent } from '../../types/laCripta';
import { LaCriptaStatusPixelIcon } from './LaCriptaStatusEffectBadge';

interface LaCriptaVfxSpriteProps {
  styleType: NonNullable<CriptaVisualEvent['vfxStyle']>;
  isCrit?: boolean;
  size?: number;
}

/**
 * Crisp 24x24 pixel-art combat & reward visual effect sprite.
 */
export const LaCriptaVfxSprite: React.FC<LaCriptaVfxSpriteProps> = ({
  styleType,
  isCrit = false,
  size = 56,
}) => {
  return (
    <svg
      width={isCrit ? size * 1.25 : size}
      height={isCrit ? size * 1.25 : size}
      viewBox="0 0 24 24"
      shapeRendering="crispEdges"
      className="pointer-events-none select-none animate-cripta-slash-arc"
    >
      {(styleType === 'slash' || styleType === 'cleave') && (
        <g>
          {/* Diagonal Blade Slash Arc */}
          <rect x="18" y="2" width="3" height="3" fill="#FFF3C4" />
          <rect x="15" y="5" width="4" height="3" fill={isCrit ? '#E7A54A' : '#D9D0BC'} />
          <rect x="11" y="8" width="5" height="4" fill="#FFF3C4" />
          <rect x="7" y="12" width="5" height="4" fill={isCrit ? '#E7A54A' : '#C93B5B'} />
          <rect x="4" y="16" width="4" height="3" fill="#C93B5B" />
          <rect x="2" y="19" width="3" height="3" fill="#8F263D" />
          {/* Impact Sparks */}
          <rect x="6" y="6" width="2" height="2" fill="#E7A54A" />
          <rect x="16" y="14" width="2" height="2" fill="#FFF3C4" />
          {isCrit && (
            <>
              <rect x="3" y="4" width="3" height="3" fill="#E7A54A" />
              <rect x="17" y="17" width="3" height="3" fill="#E7A54A" />
              <rect x="11" y="2" width="2" height="4" fill="#FFF3C4" />
            </>
          )}
        </g>
      )}

      {styleType === 'arrow' && (
        <g>
          {/* High-Velocity Piercing Bolt */}
          <rect x="2" y="11" width="16" height="2" fill="#7FB069" />
          <rect x="16" y="9" width="4" height="6" fill="#D9D0BC" />
          <rect x="20" y="10" width="3" height="4" fill="#FFF3C4" />
          <rect x="2" y="9" width="3" height="2" fill="#E7A54A" />
          <rect x="2" y="13" width="3" height="2" fill="#E7A54A" />
          <rect x="14" y="6" width="2" height="2" fill="#FFF3C4" />
          <rect x="14" y="16" width="2" height="2" fill="#FFF3C4" />
        </g>
      )}

      {styleType === 'arcane' && (
        <g>
          {/* Violet Arcane Nova */}
          <rect x="11" y="2" width="2" height="20" fill="#9B72CF" />
          <rect x="2" y="11" width="20" height="2" fill="#9B72CF" />
          <rect x="6" y="6" width="12" height="12" fill="#7656A8" opacity="0.75" />
          <rect x="8" y="8" width="8" height="8" fill="#D8B4F8" />
          <rect x="10" y="10" width="4" height="4" fill="#FFFFFF" />
          <rect x="4" y="4" width="2" height="2" fill="#E7A54A" />
          <rect x="18" y="4" width="2" height="2" fill="#E7A54A" />
          <rect x="4" y="18" width="2" height="2" fill="#E7A54A" />
          <rect x="18" y="18" width="2" height="2" fill="#E7A54A" />
        </g>
      )}

      {(styleType === 'holy' || styleType === 'revive') && (
        <g>
          {/* Sacred Golden Pillar & Sun Cross */}
          <rect x="9" y="1" width="6" height="22" fill="#E7A54A" opacity="0.45" />
          <rect x="11" y="2" width="2" height="20" fill="#FFF3C4" />
          <rect x="4" y="9" width="16" height="3" fill="#E7A54A" />
          <rect x="6" y="10" width="12" height="1" fill="#FFF3C4" />
          <rect x="5" y="4" width="2" height="2" fill="#FFF3C4" />
          <rect x="17" y="4" width="2" height="2" fill="#FFF3C4" />
          <rect x="5" y="16" width="2" height="2" fill="#FFF3C4" />
          <rect x="17" y="16" width="2" height="2" fill="#FFF3C4" />
        </g>
      )}

      {styleType === 'alchemy' && (
        <g>
          {/* Alchemical Emerald Splash */}
          <rect x="7" y="7" width="10" height="10" fill="#5EA87A" />
          <rect x="9" y="9" width="6" height="6" fill="#A8F0C2" />
          <rect x="4" y="5" width="3" height="3" fill="#69A8A5" />
          <rect x="17" y="6" width="3" height="3" fill="#5EA87A" />
          <rect x="5" y="16" width="3" height="3" fill="#A8F0C2" />
          <rect x="16" y="15" width="3" height="3" fill="#69A8A5" />
        </g>
      )}

      {styleType === 'shield' && (
        <g>
          {/* Heraldic Aegis Barrier */}
          <rect x="5" y="3" width="14" height="11" fill="#69A8A5" opacity="0.85" />
          <rect x="7" y="14" width="10" height="4" fill="#69A8A5" opacity="0.85" />
          <rect x="10" y="18" width="4" height="3" fill="#69A8A5" />
          <rect x="7" y="5" width="10" height="7" fill="#D9F2F0" />
          <rect x="11" y="4" width="2" height="13" fill="#E7A54A" />
        </g>
      )}

      {styleType === 'claw' && (
        <g>
          {/* Triple Crimson Claw Rend */}
          <rect x="3" y="4" width="3" height="4" fill="#C93B5B" />
          <rect x="6" y="8" width="3" height="4" fill="#FF6B8B" />
          <rect x="9" y="12" width="3" height="4" fill="#C93B5B" />
          <rect x="8" y="3" width="3" height="4" fill="#C93B5B" />
          <rect x="11" y="7" width="3" height="4" fill="#FFF3C4" />
          <rect x="14" y="11" width="3" height="4" fill="#C93B5B" />
          <rect x="13" y="5" width="3" height="4" fill="#C93B5B" />
          <rect x="16" y="9" width="3" height="4" fill="#FF6B8B" />
          <rect x="18" y="13" width="3" height="4" fill="#8F263D" />
        </g>
      )}

      {styleType === 'explosion' && (
        <g>
          <rect x="5" y="5" width="14" height="14" fill="#C93B5B" />
          <rect x="7" y="7" width="10" height="10" fill="#E7A54A" />
          <rect x="9" y="9" width="6" height="6" fill="#FFF3C4" />
          <rect x="2" y="10" width="3" height="4" fill="#E7A54A" />
          <rect x="19" y="10" width="3" height="4" fill="#E7A54A" />
          <rect x="10" y="2" width="4" height="3" fill="#E7A54A" />
          <rect x="10" y="19" width="4" height="3" fill="#E7A54A" />
        </g>
      )}

      {styleType === 'gold' && (
        <g>
          {/* Cascading Pixel Gold Coins */}
          <rect x="5" y="4" width="5" height="5" fill="#E7A54A" />
          <rect x="6" y="5" width="3" height="3" fill="#FFF3C4" />
          <rect x="14" y="6" width="5" height="5" fill="#E7A54A" />
          <rect x="15" y="7" width="3" height="3" fill="#FFF3C4" />
          <rect x="9" y="12" width="6" height="6" fill="#E7A54A" />
          <rect x="11" y="14" width="2" height="2" fill="#FFF3C4" />
        </g>
      )}

      {styleType === 'heal' && (
        <g>
          {/* Emerald Healing Crosses */}
          <rect x="10" y="4" width="4" height="12" fill="#5EA87A" />
          <rect x="6" y="8" width="12" height="4" fill="#5EA87A" />
          <rect x="11" y="6" width="2" height="8" fill="#A8F0C2" />
          <rect x="8" y="9" width="8" height="2" fill="#A8F0C2" />
          <rect x="4" y="16" width="2" height="4" fill="#5EA87A" />
          <rect x="18" y="3" width="2" height="4" fill="#5EA87A" />
        </g>
      )}
    </svg>
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
      {(event.kind === 'HEAL_PLAYER' || event.kind === 'REVIVE_PLAYER') && (
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
      {(event.kind === 'SHIELD_PLAYER' || event.kind === 'GAIN_DEFENSE') && (
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
  isCrit = false,
  size = 76,
}) => {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
      <LaCriptaVfxSprite styleType={styleType} isCrit={isCrit} size={size} />
    </div>
  );
};

interface LaCriptaFloatingEventBadgeProps {
  event: CriptaVisualEvent;
  indexOffset?: number;
}

/**
 * Floating visual number / stat / status / loot badge that rises and fades cleanly.
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
        animationDelay: `${indexOffset * 95}ms`,
        borderColor: event.color,
        boxShadow: `0 6px 18px rgba(0,0,0,0.92), 0 0 12px ${event.color}55`,
      }}
      className={`pointer-events-none select-none inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#09070D]/95 border-2 font-cripta-pixel whitespace-nowrap z-40 ${
        isCritOrMajor
          ? 'text-xs sm:text-sm font-black animate-cripta-crit-pop'
          : 'text-[10px] sm:text-xs font-bold animate-cripta-float-up'
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
