import React from 'react';
import {
  CriptaPlayerStatusEffect,
  CriptaStatusEffectType,
} from '../../types/laCripta';
import { CRIPTA_STATUS_EFFECTS_REGISTRY } from '../../data/la-cripta/criptaStatusEffects';
import { LaCriptaPixelTooltip } from './LaCriptaPixelTooltip';

interface LaCriptaStatusPixelIconProps {
  effectType: CriptaStatusEffectType;
  size?: number;
}

/**
 * Crisp 12x12 pixel-art icons for every canonical La Cripta status effect.
 */
export const LaCriptaStatusPixelIcon: React.FC<LaCriptaStatusPixelIconProps> = ({
  effectType,
  size = 12,
}) => {
  const def =
    CRIPTA_STATUS_EFFECTS_REGISTRY[effectType] ||
    CRIPTA_STATUS_EFFECTS_REGISTRY.TORCH_LIGHT;
  const color = def.visualTreatment.color;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      shapeRendering="crispEdges"
      className="shrink-0 select-none"
    >
      {effectType === 'POISON' && (
        <g fill={color}>
          {/* Bubbling Venom Vial / Skull Drop */}
          <rect x="5" y="1" width="2" height="2" />
          <rect x="4" y="3" width="4" height="2" />
          <rect x="3" y="5" width="6" height="4" />
          <rect x="4" y="9" width="4" height="2" />
          <rect x="4" y="6" width="1" height="1" fill="#0B0A0E" />
          <rect x="7" y="6" width="1" height="1" fill="#0B0A0E" />
          <rect x="2" y="2" width="1" height="1" fill="#A8F0C2" />
        </g>
      )}

      {effectType === 'BURN' && (
        <g fill={color}>
          {/* Infernal Flame */}
          <rect x="5" y="1" width="2" height="2" />
          <rect x="4" y="3" width="4" height="2" />
          <rect x="3" y="5" width="6" height="4" />
          <rect x="4" y="9" width="4" height="2" />
          <rect x="5" y="6" width="2" height="3" fill="#FFF3C4" />
        </g>
      )}

      {effectType === 'BLEED' && (
        <g fill={color}>
          {/* Jagged Crimson Drops */}
          <rect x="5" y="1" width="2" height="2" />
          <rect x="4" y="3" width="4" height="3" />
          <rect x="3" y="6" width="6" height="3" />
          <rect x="4" y="9" width="4" height="2" />
          <rect x="4" y="5" width="1" height="2" fill="#FFD6DF" />
        </g>
      )}

      {effectType === 'CONFUSION' && (
        <g fill={color}>
          {/* Swirling Void Spiral */}
          <rect x="3" y="2" width="6" height="1" />
          <rect x="8" y="3" width="2" height="4" />
          <rect x="4" y="7" width="4" height="1" />
          <rect x="2" y="4" width="2" height="5" />
          <rect x="4" y="9" width="5" height="1" />
          <rect x="5" y="4" width="2" height="2" fill="#FFF3C4" />
        </g>
      )}

      {effectType === 'FROST' && (
        <g fill={color}>
          {/* Ice Crystal Snowflake */}
          <rect x="5" y="1" width="2" height="10" />
          <rect x="1" y="5" width="10" height="2" />
          <rect x="3" y="3" width="2" height="2" />
          <rect x="7" y="3" width="2" height="2" />
          <rect x="3" y="7" width="2" height="2" />
          <rect x="7" y="7" width="2" height="2" />
          <rect x="5" y="5" width="2" height="2" fill="#FFFFFF" />
        </g>
      )}

      {effectType === 'CURSE' && (
        <g fill={color}>
          {/* Hexed Skull / Dark Sigil */}
          <rect x="3" y="2" width="6" height="5" />
          <rect x="4" y="7" width="4" height="3" />
          <rect x="4" y="4" width="1" height="2" fill="#0B0A0E" />
          <rect x="7" y="4" width="1" height="2" fill="#0B0A0E" />
          <rect x="5" y="8" width="2" height="1" fill="#0B0A0E" />
        </g>
      )}

      {effectType === 'FEAR' && (
        <g fill={color}>
          {/* Terrified Eye / Dread Mark */}
          <rect x="2" y="4" width="8" height="4" />
          <rect x="4" y="3" width="4" height="6" />
          <rect x="5" y="4" width="2" height="4" fill="#0B0A0E" />
          <rect x="5" y="5" width="1" height="1" fill="#FFFFFF" />
        </g>
      )}

      {effectType === 'WEAKENED' && (
        <g fill={color}>
          {/* Cracked Sword / Downward Chevron */}
          <rect x="5" y="1" width="2" height="4" />
          <rect x="4" y="6" width="2" height="3" />
          <rect x="3" y="9" width="6" height="2" />
          <rect x="2" y="5" width="8" height="1" fill="#C93B5B" />
        </g>
      )}

      {effectType === 'MARKED' && (
        <g fill={color}>
          {/* Hunter Crosshair Target */}
          <rect x="3" y="1" width="6" height="1" />
          <rect x="3" y="10" width="6" height="1" />
          <rect x="1" y="3" width="1" height="6" />
          <rect x="10" y="3" width="1" height="6" />
          <rect x="5" y="5" width="2" height="2" fill="#FFF3C4" />
        </g>
      )}

      {effectType === 'BLESSED' && (
        <g fill={color}>
          {/* Radiant Sun Cross */}
          <rect x="5" y="1" width="2" height="10" />
          <rect x="2" y="4" width="8" height="2" />
          <rect x="4" y="3" width="4" height="4" fill="#FFF3C4" />
        </g>
      )}

      {effectType === 'SHIELDED' && (
        <g fill={color}>
          {/* Heraldic Aegis Shield */}
          <rect x="2" y="2" width="8" height="5" />
          <rect x="3" y="7" width="6" height="2" />
          <rect x="5" y="9" width="2" height="2" />
          <rect x="4" y="3" width="4" height="3" fill="#FFF3C4" />
        </g>
      )}

      {effectType === 'REGENERATION' && (
        <g fill={color}>
          {/* Verdant Heart / Plus */}
          <rect x="2" y="3" width="3" height="3" />
          <rect x="7" y="3" width="3" height="3" />
          <rect x="3" y="5" width="6" height="3" />
          <rect x="5" y="8" width="2" height="2" />
          <rect x="5" y="4" width="2" height="4" fill="#FFF3C4" />
        </g>
      )}

      {effectType === 'TORCH_LIGHT' && (
        <g fill={color}>
          {/* Flickering Torch */}
          <rect x="5" y="1" width="2" height="4" fill="#FFF3C4" />
          <rect x="4" y="3" width="4" height="3" />
          <rect x="5" y="6" width="2" height="5" fill="#8C532B" />
        </g>
      )}
    </svg>
  );
};

export const LaCriptaFallenSoulIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 14 14"
    shapeRendering="crispEdges"
    className="shrink-0 select-none"
  >
    {/* Pixel Skull with Soul Wisp */}
    <rect x="6" y="1" width="2" height="2" fill="#69A8A5" />
    <rect x="3" y="3" width="8" height="6" fill="#D9D0BC" />
    <rect x="4" y="9" width="6" height="3" fill="#B8AC93" />
    <rect x="4" y="5" width="2" height="2" fill="#0B0A0E" />
    <rect x="8" y="5" width="2" height="2" fill="#0B0A0E" />
    <rect x="4" y="5" width="1" height="1" fill="#C93B5B" />
    <rect x="8" y="5" width="1" height="1" fill="#C93B5B" />
    <rect x="5" y="10" width="1" height="2" fill="#0B0A0E" />
    <rect x="8" y="10" width="1" height="2" fill="#0B0A0E" />
  </svg>
);

const CATEGORY_LABELS: Record<string, string> = {
  DAMAGE_OVER_TIME: 'DAÑO POR TURNO',
  CONTROL: 'CONTROL MENTAL',
  DEBUFF: 'AFLICCIÓN',
  BUFF: 'BENDICIÓN',
};

interface LaCriptaStatusEffectBadgeProps {
  status?: CriptaPlayerStatusEffect;
  effect?: CriptaPlayerStatusEffect;
  effectType?: CriptaStatusEffectType;
  turnsRemaining?: number;
  stacks?: number;
  compactIconOnly?: boolean;
}

export const LaCriptaStatusEffectBadge: React.FC<LaCriptaStatusEffectBadgeProps> = ({
  status,
  effect,
  effectType: propEffectType,
  turnsRemaining,
  stacks,
  compactIconOnly = false,
}) => {
  const resolved: CriptaPlayerStatusEffect | null =
    status ||
    effect ||
    (propEffectType
      ? {
          id: `enemy_${propEffectType}`,
          effectType: propEffectType,
          label: CRIPTA_STATUS_EFFECTS_REGISTRY[propEffectType]?.name || propEffectType,
          remainingTurns: turnsRemaining ?? 1,
          stacks: stacks ?? 1,
          isPositive: CRIPTA_STATUS_EFFECTS_REGISTRY[propEffectType]?.category === 'BUFF',
        }
      : null);
  if (!resolved) return null;

  const effectType: CriptaStatusEffectType =
    resolved.effectType ||
    (resolved.code === 'LUZ' ? 'TORCH_LIGHT' : 'BLESSED');

  const def =
    CRIPTA_STATUS_EFFECTS_REGISTRY[effectType] ||
    CRIPTA_STATUS_EFFECTS_REGISTRY.TORCH_LIGHT;

  const isPermanent =
    def.durationRule === 'EXPEDITION' || resolved.remainingTurns >= 50;

  const footerText = isPermanent
    ? 'DURACIÓN: EXPEDICIÓN'
    : `RESTANTE: ${resolved.remainingTurns} ${
        resolved.remainingTurns === 1 ? 'TURNO' : 'TURNOS'
      }${resolved.stacks > 1 ? ` · CARGAS: ${resolved.stacks}` : ''}`;

  return (
    <LaCriptaPixelTooltip
      title={def.name}
      category={CATEGORY_LABELS[def.category] || 'ESTADO'}
      description={def.description}
      footerLabel={footerText}
      borderColor={def.visualTreatment.color}
      accentColor={def.visualTreatment.color}
      icon={<LaCriptaStatusPixelIcon effectType={effectType} size={12} />}
    >
      <div
        className="inline-flex items-center gap-1 px-1.5 py-0.5 border text-[8px] sm:text-[9px] font-cripta-pixel cursor-help transition-transform hover:scale-105"
        style={{
          backgroundColor: def.visualTreatment.bgTint,
          borderColor: def.visualTreatment.borderColor,
          color: def.visualTreatment.color,
        }}
      >
        <LaCriptaStatusPixelIcon effectType={effectType} size={10} />
        {!compactIconOnly && (
          <span className="font-bold tracking-wider">{def.code}</span>
        )}
        {resolved.stacks > 1 && (
          <span className="text-[#FFF3C4]">x{resolved.stacks}</span>
        )}
        {!isPermanent && resolved.remainingTurns > 0 && (
          <span className="text-[#D9D0BC]/90">{resolved.remainingTurns}T</span>
        )}
      </div>
    </LaCriptaPixelTooltip>
  );
};
