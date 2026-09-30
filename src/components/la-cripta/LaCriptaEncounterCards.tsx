import React, { useEffect, useState } from 'react';
import {
  CriptaCanonicalRoomType,
  CriptaDungeonDefinition,
  CriptaDungeonRoom,
  CriptaItemId,
  CriptaRelicId,
} from '../../types/laCripta';
import {
  LaCriptaItemPixelIcon,
  LaCriptaRelicPixelIcon,
} from './LaCriptaItemRelicArt';
import { LaCriptaPixelTooltip } from './LaCriptaPixelTooltip';
import { LaCriptaAnimatedStageNpc } from './LaCriptaCreatureArtSystem';

export type CriptaCardVisualTheme =
  | 'ATTACK'
  | 'SPECIAL'
  | 'ABILITY'
  | 'DEFEND'
  | 'ITEM'
  | 'EVENT'
  | 'GOLD'
  | 'DANGER';

export type CriptaCardArtKind =
  | 'SWORD_SLASH'
  | 'HEAVY_SPECIAL'
  | 'ARCANE_SPELL'
  | 'HOLY_LIGHT'
  | 'SHADOW_DAGGER'
  | 'HUNTER_ARROW'
  | 'ALCHEMY_BREW'
  | 'IRON_SHIELD'
  | 'POTION_ITEM'
  | 'TREASURE_CHEST'
  | 'SACRED_SHRINE'
  | 'CAMPFIRE_REST'
  | 'ANVIL_FORGE'
  | 'BLOOD_PACT'
  | 'RUNE_PUZZLE'
  | 'TRAP_MECHANISM'
  | 'CROSSROADS_DOOR';

const THEME_PALETTES: Record<
  CriptaCardVisualTheme,
  {
    border: string;
    hoverBorder: string;
    bg: string;
    headerBg: string;
    artBg: string;
    badgeBg: string;
    badgeText: string;
    accentText: string;
    glow: string;
  }
> = {
  ATTACK: {
    border: '#C93B5B',
    hoverBorder: '#FFD166',
    bg: '#1A0E15',
    headerBg: '#2B121E',
    artBg: '#11080E',
    badgeBg: '#C93B5B',
    badgeText: '#FFF8EC',
    accentText: '#FF758F',
    glow: 'rgba(201,59,91,0.42)',
  },
  SPECIAL: {
    border: '#E7A54A',
    hoverBorder: '#FFF3C4',
    bg: '#1D140C',
    headerBg: '#2E1F10',
    artBg: '#120C07',
    badgeBg: '#E7A54A',
    badgeText: '#0B0A0E',
    accentText: '#FFD166',
    glow: 'rgba(231,165,74,0.48)',
  },
  ABILITY: {
    border: '#9B72CF',
    hoverBorder: '#FFD166',
    bg: '#161021',
    headerBg: '#241836',
    artBg: '#0D0915',
    badgeBg: '#9B72CF',
    badgeText: '#FFF8EC',
    accentText: '#C8A6F5',
    glow: 'rgba(155,114,207,0.45)',
  },
  DEFEND: {
    border: '#69A8A5',
    hoverBorder: '#FFD166',
    bg: '#0F1A1D',
    headerBg: '#16282D',
    artBg: '#091114',
    badgeBg: '#69A8A5',
    badgeText: '#091114',
    accentText: '#8EE6AE',
    glow: 'rgba(105,168,165,0.42)',
  },
  ITEM: {
    border: '#5EA87A',
    hoverBorder: '#FFD166',
    bg: '#0F1A14',
    headerBg: '#16291E',
    artBg: '#09110C',
    badgeBg: '#5EA87A',
    badgeText: '#08110B',
    accentText: '#8EE6AE',
    glow: 'rgba(94,168,122,0.42)',
  },
  EVENT: {
    border: '#7656A8',
    hoverBorder: '#E7A54A',
    bg: '#14101D',
    headerBg: '#211930',
    artBg: '#0B0811',
    badgeBg: '#282039',
    badgeText: '#FFD166',
    accentText: '#E7A54A',
    glow: 'rgba(118,86,168,0.42)',
  },
  GOLD: {
    border: '#E7A54A',
    hoverBorder: '#FFF3C4',
    bg: '#19130D',
    headerBg: '#2A1E12',
    artBg: '#100B07',
    badgeBg: '#E7A54A',
    badgeText: '#0B0A0E',
    accentText: '#FFD166',
    glow: 'rgba(231,165,74,0.45)',
  },
  DANGER: {
    border: '#C93B5B',
    hoverBorder: '#FFD166',
    bg: '#1C0D13',
    headerBg: '#2E121D',
    artBg: '#12070B',
    badgeBg: '#8F263D',
    badgeText: '#FFD166',
    accentText: '#FF758F',
    glow: 'rgba(201,59,91,0.42)',
  },
};

export const LaCriptaCardIllustration: React.FC<{
  artKind: CriptaCardArtKind;
  itemId?: CriptaItemId;
  relicId?: CriptaRelicId;
}> = ({ artKind, itemId, relicId }) => {
  if (itemId) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <LaCriptaItemPixelIcon itemId={itemId} size={58} />
      </div>
    );
  }
  if (relicId) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <LaCriptaRelicPixelIcon relicId={relicId} size={58} />
      </div>
    );
  }

  return (
    <svg
      viewBox="0 0 36 26"
      shapeRendering="crispEdges"
      className="w-full h-full max-w-[116px] max-h-[84px] select-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.85)]"
    >
      {artKind === 'SWORD_SLASH' && (
        <g>
          {/* Crimson Slash Arc */}
          <rect x="6" y="18" width="4" height="2" fill="#C93B5B" />
          <rect x="10" y="14" width="5" height="2" fill="#FF4D6D" />
          <rect x="15" y="10" width="6" height="2" fill="#FFD166" />
          <rect x="21" y="6" width="7" height="2" fill="#FFF3C4" />
          {/* Steel Blade */}
          <rect x="22" y="4" width="4" height="4" fill="#D9D0BC" />
          <rect x="18" y="8" width="4" height="4" fill="#D9D0BC" />
          <rect x="14" y="12" width="4" height="4" fill="#B8AC93" />
          {/* Crossguard & Pommel */}
          <rect x="10" y="14" width="6" height="2" fill="#E7A54A" />
          <rect x="12" y="12" width="2" height="6" fill="#E7A54A" />
          <rect x="8" y="18" width="3" height="3" fill="#8F263D" />
          {/* Impact Sparks */}
          <rect x="26" y="11" width="2" height="2" fill="#FFD166" />
          <rect x="16" y="4" width="2" height="2" fill="#FF4D6D" />
        </g>
      )}

      {artKind === 'HEAVY_SPECIAL' && (
        <g>
          {/* Blazing Golden Aura */}
          <rect x="8" y="4" width="20" height="18" fill="#3B1D11" opacity="0.7" />
          <rect x="16" y="2" width="4" height="14" fill="#FFD166" />
          <rect x="17" y="3" width="2" height="12" fill="#FFF3C4" />
          <rect x="12" y="15" width="12" height="3" fill="#E7A54A" />
          <rect x="16" y="18" width="4" height="5" fill="#8F263D" />
          {/* Twin Cleave Waves */}
          <rect x="5" y="8" width="6" height="2" fill="#FF7A33" />
          <rect x="25" y="8" width="6" height="2" fill="#FF7A33" />
          <rect x="3" y="13" width="7" height="2" fill="#FFD166" />
          <rect x="26" y="13" width="7" height="2" fill="#FFD166" />
          <rect x="7" y="19" width="5" height="2" fill="#C93B5B" />
          <rect x="24" y="19" width="5" height="2" fill="#C93B5B" />
        </g>
      )}

      {artKind === 'ARCANE_SPELL' && (
        <g>
          {/* Outer Arcane Ring */}
          <rect x="12" y="3" width="12" height="2" fill="#7656A8" />
          <rect x="12" y="21" width="12" height="2" fill="#7656A8" />
          <rect x="9" y="6" width="2" height="14" fill="#7656A8" />
          <rect x="25" y="6" width="2" height="14" fill="#7656A8" />
          {/* Glowing Violet Core */}
          <rect x="13" y="7" width="10" height="12" fill="#9B72CF" />
          <rect x="15" y="9" width="6" height="8" fill="#E0C3FC" />
          <rect x="17" y="11" width="2" height="4" fill="#FFF3C4" />
          {/* Floating Runes */}
          <rect x="5" y="5" width="2" height="2" fill="#FFD166" />
          <rect x="29" y="6" width="2" height="2" fill="#FFD166" />
          <rect x="6" y="18" width="2" height="2" fill="#9B72CF" />
          <rect x="28" y="17" width="2" height="2" fill="#9B72CF" />
        </g>
      )}

      {artKind === 'HOLY_LIGHT' && (
        <g>
          {/* Radiant Cross & Sunburst */}
          <rect x="16" y="2" width="4" height="22" fill="#FFD166" />
          <rect x="8" y="9" width="20" height="4" fill="#FFD166" />
          <rect x="17" y="4" width="2" height="18" fill="#FFF3C4" />
          <rect x="10" y="10" width="16" height="2" fill="#FFF3C4" />
          {/* Emerald Healing Rays */}
          <rect x="11" y="4" width="3" height="3" fill="#5EA87A" />
          <rect x="22" y="4" width="3" height="3" fill="#5EA87A" />
          <rect x="11" y="15" width="3" height="3" fill="#5EA87A" />
          <rect x="22" y="15" width="3" height="3" fill="#5EA87A" />
        </g>
      )}

      {artKind === 'SHADOW_DAGGER' && (
        <g>
          {/* Twin Crossed Daggers */}
          <rect x="8" y="5" width="3" height="3" fill="#D9D0BC" />
          <rect x="11" y="8" width="4" height="4" fill="#D9D0BC" />
          <rect x="15" y="12" width="4" height="4" fill="#9A96A4" />
          <rect x="19" y="16" width="4" height="3" fill="#E7A54A" />
          <rect x="25" y="5" width="3" height="3" fill="#5EA87A" />
          <rect x="21" y="8" width="4" height="4" fill="#5EA87A" />
          <rect x="13" y="16" width="4" height="3" fill="#E7A54A" />
          {/* Venom Drops */}
          <rect x="17" y="4" width="2" height="3" fill="#5EA87A" />
          <rect x="17" y="20" width="2" height="3" fill="#C93B5B" />
        </g>
      )}

      {artKind === 'HUNTER_ARROW' && (
        <g>
          {/* Bow Arc */}
          <rect x="8" y="4" width="3" height="18" fill="#8C583A" />
          <rect x="11" y="3" width="4" height="2" fill="#E7A54A" />
          <rect x="11" y="21" width="4" height="2" fill="#E7A54A" />
          {/* Blazing Arrow */}
          <rect x="6" y="12" width="20" height="2" fill="#D9D0BC" />
          <rect x="24" y="10" width="5" height="6" fill="#5EA87A" />
          <rect x="28" y="12" width="3" height="2" fill="#FFF3C4" />
          <rect x="5" y="10" width="3" height="2" fill="#C93B5B" />
          <rect x="5" y="14" width="3" height="2" fill="#C93B5B" />
        </g>
      )}

      {artKind === 'ALCHEMY_BREW' && (
        <g>
          {/* Alchemical Flask */}
          <rect x="15" y="3" width="6" height="4" fill="#D8C6A0" />
          <rect x="16" y="7" width="4" height="3" fill="#69A8A5" />
          <rect x="11" y="10" width="14" height="12" fill="#1F3B2C" />
          <rect x="13" y="13" width="10" height="8" fill="#5EA87A" />
          <rect x="15" y="15" width="4" height="4" fill="#8EE6AE" />
          {/* Rising Bubbles */}
          <rect x="9" y="6" width="2" height="2" fill="#8EE6AE" />
          <rect x="25" y="7" width="2" height="2" fill="#FFD166" />
          <rect x="17" y="1" width="2" height="2" fill="#8EE6AE" />
        </g>
      )}

      {artKind === 'IRON_SHIELD' && (
        <g>
          {/* Heater Shield */}
          <rect x="10" y="3" width="16" height="14" fill="#324B52" />
          <rect x="12" y="5" width="12" height="11" fill="#69A8A5" />
          <rect x="13" y="17" width="10" height="4" fill="#324B52" />
          <rect x="16" y="21" width="4" height="3" fill="#324B52" />
          {/* Golden Trim & Cross */}
          <rect x="17" y="5" width="2" height="14" fill="#FFD166" />
          <rect x="12" y="10" width="12" height="2" fill="#FFD166" />
        </g>
      )}

      {artKind === 'POTION_ITEM' && (
        <g>
          <rect x="15" y="3" width="6" height="3" fill="#E7A54A" />
          <rect x="12" y="8" width="12" height="14" fill="#8F263D" />
          <rect x="14" y="10" width="8" height="10" fill="#C93B5B" />
          <rect x="17" y="12" width="2" height="6" fill="#FFF3C4" />
          <rect x="15" y="14" width="6" height="2" fill="#FFF3C4" />
        </g>
      )}

      {artKind === 'TREASURE_CHEST' && (
        <g>
          <rect x="7" y="7" width="22" height="15" fill="#5A3826" />
          <rect x="7" y="6" width="22" height="3" fill="#E7A54A" />
          <rect x="7" y="13" width="22" height="2" fill="#E7A54A" />
          <rect x="16" y="11" width="4" height="6" fill="#FFD166" />
          <rect x="11" y="3" width="2" height="2" fill="#FFD166" />
          <rect x="23" y="3" width="2" height="2" fill="#FFD166" />
        </g>
      )}

      {artKind === 'SACRED_SHRINE' && (
        <g>
          <rect x="12" y="18" width="12" height="5" fill="#3C324C" />
          <rect x="14" y="9" width="8" height="9" fill="#524668" />
          <rect x="15" y="3" width="6" height="6" fill="#FFD166" />
          <rect x="17" y="4" width="2" height="4" fill="#FFF3C4" />
          <rect x="9" y="7" width="2" height="2" fill="#5EA87A" />
          <rect x="25" y="7" width="2" height="2" fill="#5EA87A" />
        </g>
      )}

      {artKind === 'CAMPFIRE_REST' && (
        <g>
          <rect x="9" y="19" width="18" height="3" fill="#633D28" />
          <rect x="12" y="10" width="12" height="9" fill="#C93B5B" />
          <rect x="14" y="6" width="8" height="11" fill="#E7A54A" />
          <rect x="16" y="9" width="4" height="7" fill="#FFF3C4" />
          <rect x="14" y="3" width="2" height="2" fill="#FFD166" />
          <rect x="21" y="4" width="2" height="2" fill="#FF7A33" />
        </g>
      )}

      {artKind === 'ANVIL_FORGE' && (
        <g>
          <rect x="8" y="13" width="20" height="5" fill="#69A8A5" />
          <rect x="12" y="18" width="12" height="5" fill="#324B52" />
          <rect x="15" y="4" width="8" height="4" fill="#E7A54A" />
          <rect x="18" y="8" width="2" height="5" fill="#8C583A" />
          <rect x="11" y="9" width="2" height="2" fill="#FFD166" />
          <rect x="24" y="9" width="2" height="2" fill="#FFD166" />
        </g>
      )}

      {artKind === 'BLOOD_PACT' && (
        <g>
          <rect x="12" y="5" width="12" height="8" fill="#E7A54A" />
          <rect x="14" y="6" width="8" height="4" fill="#C93B5B" />
          <rect x="16" y="13" width="4" height="6" fill="#E7A54A" />
          <rect x="12" y="19" width="12" height="3" fill="#E7A54A" />
          <rect x="17" y="2" width="2" height="3" fill="#FF4D6D" />
        </g>
      )}

      {artKind === 'RUNE_PUZZLE' && (
        <g>
          <rect x="11" y="3" width="14" height="20" fill="#282039" />
          <rect x="13" y="5" width="10" height="16" fill="#3C2E56" />
          <rect x="16" y="7" width="4" height="12" fill="#9B72CF" />
          <rect x="14" y="11" width="8" height="4" fill="#FFD166" />
        </g>
      )}

      {artKind === 'TRAP_MECHANISM' && (
        <g>
          <rect x="7" y="19" width="22" height="4" fill="#3C324C" />
          <rect x="10" y="9" width="3" height="10" fill="#D9D0BC" />
          <rect x="17" y="6" width="3" height="13" fill="#D9D0BC" />
          <rect x="24" y="9" width="3" height="10" fill="#D9D0BC" />
          <rect x="10" y="7" width="3" height="2" fill="#C93B5B" />
          <rect x="17" y="4" width="3" height="2" fill="#C93B5B" />
          <rect x="24" y="7" width="3" height="2" fill="#C93B5B" />
        </g>
      )}

      {artKind === 'CROSSROADS_DOOR' && (
        <g>
          <rect x="6" y="5" width="10" height="18" fill="#3A2E4C" />
          <rect x="8" y="7" width="6" height="16" fill="#120C1C" />
          <rect x="20" y="5" width="10" height="18" fill="#3A2E4C" />
          <rect x="22" y="7" width="6" height="16" fill="#120C1C" />
          <rect x="10" y="13" width="2" height="2" fill="#E7A54A" />
          <rect x="24" y="13" width="2" height="2" fill="#69A8A5" />
        </g>
      )}
    </svg>
  );
};

export interface LaCriptaPlayableCardProps {
  title: string;
  categoryLabel: string;
  costLabel: string;
  headlineValue?: string | null;
  effectPrimary?: string;
  effectSecondary?: string;
  summary?: string;
  footerBadge?: string;
  cooldownLabel?: string;
  tooltipDescription?: string;
  tooltipFooter?: string;
  theme?: CriptaCardVisualTheme;
  accentColor?: 'crimson' | 'cyan' | 'amber' | 'purple' | 'emerald' | 'slate';
  artKind?: CriptaCardArtKind;
  illustration?: React.ReactNode;
  itemId?: CriptaItemId;
  relicId?: CriptaRelicId;
  topRightBadge?: string;
  disabled?: boolean;
  selected?: boolean;
  voterBadges?: Array<{ id: string; name: string; color: string }>;
  onClick: () => void;
}

const ACCENT_TO_THEME: Record<
  NonNullable<LaCriptaPlayableCardProps['accentColor']>,
  CriptaCardVisualTheme
> = {
  crimson: 'ATTACK',
  cyan: 'DEFEND',
  amber: 'SPECIAL',
  purple: 'ABILITY',
  emerald: 'ITEM',
  slate: 'EVENT',
};

/**
 * Large vertical playable game card for the Right Stage (Combat Actions, Events, Shop, Rest, Shrine).
 */
export const LaCriptaPlayableCard: React.FC<LaCriptaPlayableCardProps> = ({
  title,
  categoryLabel,
  costLabel,
  headlineValue,
  effectPrimary,
  effectSecondary,
  summary,
  footerBadge,
  cooldownLabel,
  tooltipDescription,
  tooltipFooter,
  theme,
  accentColor,
  artKind = 'SWORD_SLASH',
  illustration,
  itemId,
  relicId,
  topRightBadge,
  disabled = false,
  selected = false,
  voterBadges = [],
  onClick,
}) => {
  const resolvedTheme: CriptaCardVisualTheme =
    theme || (accentColor ? ACCENT_TO_THEME[accentColor] : 'EVENT');
  const pal = THEME_PALETTES[resolvedTheme];
  const resolvedTopRight = topRightBadge || cooldownLabel;
  const resolvedPrimary = effectPrimary || footerBadge || categoryLabel;
  const resolvedSecondary = effectSecondary || summary;

  const cardElement = (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`group relative w-[168px] sm:w-[188px] xl:w-[202px] h-[272px] sm:h-[292px] border-2 flex flex-col justify-between text-left transition-all duration-150 select-none ${
        disabled
          ? 'opacity-40 grayscale-[35%] cursor-not-allowed'
          : selected
          ? '-translate-y-2.5 scale-[1.03] cursor-pointer z-20'
          : 'hover:-translate-y-2 hover:scale-[1.02] active:translate-y-0 cursor-pointer hover:z-10'
      }`}
      style={{
        backgroundColor: pal.bg,
        borderColor: selected ? '#FFD166' : pal.border,
        boxShadow: selected
          ? `0 14px 32px rgba(0,0,0,0.95), 0 0 22px ${pal.glow}`
          : disabled
          ? '0 6px 16px rgba(0,0,0,0.7)'
          : `0 10px 24px rgba(0,0,0,0.88), inset 0 0 18px ${pal.glow}`,
      }}
    >
      {/* Top Cost Badge & Optional Cooldown/Risk Badge */}
      <div
        className="w-full px-2.5 py-1.5 border-b flex items-center justify-between gap-1 shrink-0"
        style={{
          backgroundColor: pal.headerBg,
          borderColor: `${pal.border}66`,
        }}
      >
        <span
          className="px-1.5 py-0.5 font-cripta-mono text-[10px] font-extrabold tracking-wider uppercase shrink-0"
          style={{
            backgroundColor: pal.badgeBg,
            color: pal.badgeText,
          }}
        >
          {costLabel}
        </span>

        {resolvedTopRight ? (
          <span className="font-cripta-pixel text-[8px] font-bold text-[#FFD166] uppercase truncate">
            {resolvedTopRight}
          </span>
        ) : (
          <span
            className="font-cripta-pixel text-[8px] uppercase tracking-widest truncate"
            style={{ color: pal.accentText }}
          >
            {categoryLabel}
          </span>
        )}
      </div>

      {/* Card Category + Title */}
      <div className="px-2.5 pt-1.5 pb-1 text-center shrink-0">
        <div
          className="font-cripta-pixel text-[8px] uppercase tracking-widest truncate mb-0.5"
          style={{ color: pal.accentText }}
        >
          {categoryLabel}
        </div>
        <div className="font-cripta-display text-xs sm:text-sm font-black text-[#F4EBD9] uppercase tracking-wide leading-tight line-clamp-2 min-h-[30px] flex items-center justify-center">
          {title}
        </div>
      </div>

      {/* Central Pixel-Art Illustration Frame */}
      <div
        className="mx-2.5 my-0.5 flex-1 min-h-[76px] sm:min-h-[86px] border flex items-center justify-center relative overflow-hidden"
        style={{
          backgroundColor: pal.artBg,
          borderColor: `${pal.border}55`,
          backgroundImage: `radial-gradient(circle at 50% 50%, ${pal.glow} 0%, transparent 75%)`,
        }}
      >
        <div className="transition-transform duration-150 group-hover:scale-110 flex items-center justify-center w-full h-full">
          {illustration ? (
            illustration
          ) : (
            <LaCriptaCardIllustration
              artKind={artKind}
              itemId={itemId}
              relicId={relicId}
            />
          )}
        </div>
      </div>

      {/* Bottom Deliberate Hierarchy: Headline Number -> Concise Copy -> Target/Status Footer */}
      <div className="px-2.5 pt-1 pb-2 text-center flex flex-col justify-end gap-0.5 shrink-0">
        {headlineValue && (
          <div className="font-cripta-mono text-xs sm:text-sm font-black text-[#FFD166] tracking-wide uppercase leading-tight">
            {headlineValue}
          </div>
        )}
        {resolvedSecondary && (
          <div className="font-cripta-pixel text-[9px] text-[#E8DFCE]/90 leading-snug line-clamp-2 min-h-[24px] flex items-center justify-center">
            {resolvedSecondary}
          </div>
        )}
        <div
          className="mt-0.5 pt-1 border-t border-[#2A1F38]/80 font-cripta-mono text-[9px] font-extrabold tracking-wider uppercase leading-snug truncate"
          style={{ color: pal.accentText }}
        >
          {resolvedPrimary}
        </div>
        {voterBadges.length > 0 && (
          <div className="mt-0.5 flex flex-wrap items-center justify-center gap-1">
            {voterBadges.map((v) => (
              <span
                key={v.id}
                className="px-1 py-0.2 bg-[#09070D] border text-[8px] font-cripta-pixel text-[#D9D0BC]"
                style={{ borderColor: v.color }}
              >
                {v.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );

  if (tooltipDescription) {
    return (
      <LaCriptaPixelTooltip
        title={title}
        category={categoryLabel}
        description={tooltipDescription}
        footerLabel={tooltipFooter || `${costLabel}${resolvedTopRight ? ` · ${resolvedTopRight}` : ''}`}
        borderColor={pal.border}
        accentColor={pal.accentText}
      >
        {cardElement}
      </LaCriptaPixelTooltip>
    );
  }

  return cardElement;
};

export const LaCriptaCardPixelIllustration: React.FC<{
  kind:
    | 'ATTACK_SWORD'
    | 'DEFEND_SHIELD'
    | 'WEAPON_TECHNIQUE'
    | 'CLASS_SKILL'
    | 'USE_CONSUMABLE'
    | 'EVENT_PACT'
    | 'EVENT_RUNE'
    | 'EVENT_TRAP'
    | 'EVENT_PATH'
    | 'SHRINE_ALTAR'
    | 'TREASURE_CHEST'
    | 'SHOP_MERCHANT'
    | 'REST_CAMPFIRE'
    | 'FORGE_ANVIL'
    | 'LEAVE_DOOR';
  itemId?: CriptaItemId;
  relicId?: CriptaRelicId;
}> = ({ kind, itemId, relicId }) => {
  const mapKind: Record<typeof kind, CriptaCardArtKind> = {
    ATTACK_SWORD: 'SWORD_SLASH',
    DEFEND_SHIELD: 'IRON_SHIELD',
    WEAPON_TECHNIQUE: 'HEAVY_SPECIAL',
    CLASS_SKILL: 'ARCANE_SPELL',
    USE_CONSUMABLE: 'POTION_ITEM',
    EVENT_PACT: 'BLOOD_PACT',
    EVENT_RUNE: 'RUNE_PUZZLE',
    EVENT_TRAP: 'TRAP_MECHANISM',
    EVENT_PATH: 'CROSSROADS_DOOR',
    SHRINE_ALTAR: 'SACRED_SHRINE',
    TREASURE_CHEST: 'TREASURE_CHEST',
    SHOP_MERCHANT: 'TREASURE_CHEST',
    REST_CAMPFIRE: 'CAMPFIRE_REST',
    FORGE_ANVIL: 'ANVIL_FORGE',
    LEAVE_DOOR: 'CROSSROADS_DOOR',
  };
  return (
    <LaCriptaCardIllustration
      artKind={mapKind[kind]}
      itemId={itemId}
      relicId={relicId}
    />
  );
};

export const LaCriptaNonCombatStagePortrait: React.FC<{
  room: CriptaDungeonRoom;
  dungeon: CriptaDungeonDefinition;
  sizePx?: number;
}> = ({ room, dungeon }) => {
  return <LaCriptaAnimatedStageNpc room={room} dungeon={dungeon} />;
};

/**
 * Large focal pixel-art portrait for the Left Stage in Non-Combat rooms (or cleared combat rooms).
 */
export const LaCriptaStageSubjectPortrait: React.FC<{
  room: CriptaDungeonRoom;
  dungeon: CriptaDungeonDefinition;
}> = ({ room, dungeon }) => {
  return <LaCriptaAnimatedStageNpc room={room} dungeon={dungeon} />;
};

export interface CriptaBiomeVisualProfile {
  bgTop: string;
  bgMid: string;
  bgBottom: string;
  wallDark: string;
  wallMid: string;
  wallLight: string;
  floorDark: string;
  floorMid: string;
  floorLight: string;
  accentPrimary: string;
  accentSecondary: string;
  glowColor: string;
  particlePrimary: string;
  particleSecondary: string;
}

export function getBiomeVisualProfile(dungeonId?: string): CriptaBiomeVisualProfile {
  switch (dungeonId) {
    case 'jardin_podrido':
      return {
        bgTop: '#061109',
        bgMid: '#0d1f12',
        bgBottom: '#050b06',
        wallDark: '#0c1c10',
        wallMid: '#16301c',
        wallLight: '#254a2d',
        floorDark: '#09140b',
        floorMid: '#152918',
        floorLight: '#27472b',
        accentPrimary: '#4ade80',
        accentSecondary: '#a3e635',
        glowColor: 'rgba(74, 222, 128, 0.24)',
        particlePrimary: '#86efac',
        particleSecondary: '#bef264',
      };
    case 'forja_infernal':
      return {
        bgTop: '#160604',
        bgMid: '#280b06',
        bgBottom: '#0e0302',
        wallDark: '#1f0906',
        wallMid: '#36110b',
        wallLight: '#541b11',
        floorDark: '#170604',
        floorMid: '#2b0d08',
        floorLight: '#4a180e',
        accentPrimary: '#f97316',
        accentSecondary: '#fbbf24',
        glowColor: 'rgba(249, 115, 22, 0.28)',
        particlePrimary: '#fdba74',
        particleSecondary: '#fde047',
      };
    case 'templo_sumergido':
      return {
        bgTop: '#03101a',
        bgMid: '#072235',
        bgBottom: '#020910',
        wallDark: '#071d2c',
        wallMid: '#0e334c',
        wallLight: '#194d70',
        floorDark: '#051521',
        floorMid: '#0c293d',
        floorLight: '#184766',
        accentPrimary: '#38bdf8',
        accentSecondary: '#2dd4bf',
        glowColor: 'rgba(56, 189, 248, 0.25)',
        particlePrimary: '#7dd3fc',
        particleSecondary: '#5eead4',
      };
    case 'minas_abandonadas':
      return {
        bgTop: '#110d08',
        bgMid: '#1f170e',
        bgBottom: '#090704',
        wallDark: '#1c150d',
        wallMid: '#2e2216',
        wallLight: '#473522',
        floorDark: '#140f0a',
        floorMid: '#261d13',
        floorLight: '#3d2f1f',
        accentPrimary: '#f59e0b',
        accentSecondary: '#38bdf8',
        glowColor: 'rgba(245, 158, 11, 0.22)',
        particlePrimary: '#fcd34d',
        particleSecondary: '#7dd3fc',
      };
    case 'castillo_del_verdugo':
      return {
        bgTop: '#140609',
        bgMid: '#240b11',
        bgBottom: '#0a0305',
        wallDark: '#1c0a0e',
        wallMid: '#301219',
        wallLight: '#4a1c27',
        floorDark: '#14070a',
        floorMid: '#260e14',
        floorLight: '#3d1720',
        accentPrimary: '#ef4444',
        accentSecondary: '#fda4af',
        glowColor: 'rgba(239, 68, 68, 0.24)',
        particlePrimary: '#fca5a5',
        particleSecondary: '#fecdd3',
      };
    case 'bosque_de_los_susurros':
      return {
        bgTop: '#071014',
        bgMid: '#0f2129',
        bgBottom: '#04090c',
        wallDark: '#0d1b22',
        wallMid: '#182f3a',
        wallLight: '#264857',
        floorDark: '#091419',
        floorMid: '#13262f',
        floorLight: '#213e4a',
        accentPrimary: '#2dd4bf',
        accentSecondary: '#a78bfa',
        glowColor: 'rgba(45, 212, 191, 0.22)',
        particlePrimary: '#5eead4',
        particleSecondary: '#c4b5fd',
      };
    case 'alcantarillas_imperiales':
      return {
        bgTop: '#091108',
        bgMid: '#142410',
        bgBottom: '#050a04',
        wallDark: '#111f0e',
        wallMid: '#1f3619',
        wallLight: '#315228',
        floorDark: '#0d170a',
        floorMid: '#192b14',
        floorLight: '#2b4722',
        accentPrimary: '#84cc16',
        accentSecondary: '#4ade80',
        glowColor: 'rgba(132, 204, 22, 0.25)',
        particlePrimary: '#bef264',
        particleSecondary: '#86efac',
      };
    case 'biblioteca_prohibida':
      return {
        bgTop: '#10081c',
        bgMid: '#1e1035',
        bgBottom: '#08040f',
        wallDark: '#180d2b',
        wallMid: '#2a184a',
        wallLight: '#40266e',
        floorDark: '#130921',
        floorMid: '#23133d',
        floorLight: '#371f5e',
        accentPrimary: '#c084fc',
        accentSecondary: '#fbbf24',
        glowColor: 'rgba(192, 132, 252, 0.25)',
        particlePrimary: '#d8b4fe',
        particleSecondary: '#fde68a',
      };
    case 'torre_del_astrologo':
      return {
        bgTop: '#060a1c',
        bgMid: '#0e1738',
        bgBottom: '#030510',
        wallDark: '#0b122e',
        wallMid: '#162354',
        wallLight: '#253980',
        floorDark: '#080e24',
        floorMid: '#121d47',
        floorLight: '#1f3170',
        accentPrimary: '#60a5fa',
        accentSecondary: '#fde047',
        glowColor: 'rgba(96, 165, 250, 0.26)',
        particlePrimary: '#93c5fd',
        particleSecondary: '#fef08a',
      };
    case 'la_colmena':
      return {
        bgTop: '#170f04',
        bgMid: '#2b1c08',
        bgBottom: '#0c0802',
        wallDark: '#241706',
        wallMid: '#3d280c',
        wallLight: '#5c3d14',
        floorDark: '#1a1105',
        floorMid: '#302009',
        floorLight: '#4d3310',
        accentPrimary: '#f59e0b',
        accentSecondary: '#a3e635',
        glowColor: 'rgba(245, 158, 11, 0.26)',
        particlePrimary: '#fcd34d',
        particleSecondary: '#bef264',
      };
    case 'cripta_de_cristal':
      return {
        bgTop: '#08121f',
        bgMid: '#10243d',
        bgBottom: '#040a12',
        wallDark: '#0d1e33',
        wallMid: '#183559',
        wallLight: '#275185',
        floorDark: '#0a1729',
        floorMid: '#142b4a',
        floorLight: '#224573',
        accentPrimary: '#67e8f9',
        accentSecondary: '#e879f9',
        glowColor: 'rgba(103, 232, 249, 0.27)',
        particlePrimary: '#a5f3fc',
        particleSecondary: '#f0abfc',
      };
    case 'prision_maldita':
      return {
        bgTop: '#0c0e12',
        bgMid: '#171b24',
        bgBottom: '#06070a',
        wallDark: '#141820',
        wallMid: '#242b38',
        wallLight: '#374154',
        floorDark: '#0f1218',
        floorMid: '#1c222e',
        floorLight: '#2e374a',
        accentPrimary: '#fb923c',
        accentSecondary: '#94a3b8',
        glowColor: 'rgba(251, 146, 60, 0.20)',
        particlePrimary: '#fdba74',
        particleSecondary: '#cbd5e1',
      };
    case 'santuario_de_sangre':
      return {
        bgTop: '#170408',
        bgMid: '#2b0810',
        bgBottom: '#0c0204',
        wallDark: '#24060d',
        wallMid: '#400c18',
        wallLight: '#631426',
        floorDark: '#1a0409',
        floorMid: '#330913',
        floorLight: '#521020',
        accentPrimary: '#f43f5e',
        accentSecondary: '#fbbf24',
        glowColor: 'rgba(244, 63, 94, 0.28)',
        particlePrimary: '#fda4af',
        particleSecondary: '#fde68a',
      };
    case 'ciudad_sepultada':
      return {
        bgTop: '#171108',
        bgMid: '#2b2010',
        bgBottom: '#0d0904',
        wallDark: '#241b0d',
        wallMid: '#3d2e18',
        wallLight: '#5c4626',
        floorDark: '#1c150a',
        floorMid: '#332614',
        floorLight: '#523d20',
        accentPrimary: '#fbbf24',
        accentSecondary: '#2dd4bf',
        glowColor: 'rgba(251, 191, 36, 0.24)',
        particlePrimary: '#fde68a',
        particleSecondary: '#5eead4',
      };
    case 'palacio_de_los_espejos':
      return {
        bgTop: '#0d101c',
        bgMid: '#1a2038',
        bgBottom: '#070910',
        wallDark: '#161b30',
        wallMid: '#283154',
        wallLight: '#3e4b80',
        floorDark: '#111526',
        floorMid: '#202745',
        floorLight: '#34406e',
        accentPrimary: '#e2e8f0',
        accentSecondary: '#c084fc',
        glowColor: 'rgba(226, 232, 240, 0.24)',
        particlePrimary: '#f8fafc',
        particleSecondary: '#e9d5ff',
      };
    case 'cavernas_heladas':
      return {
        bgTop: '#06131f',
        bgMid: '#0d263d',
        bgBottom: '#030a12',
        wallDark: '#0b2033',
        wallMid: '#153959',
        wallLight: '#235887',
        floorDark: '#081826',
        floorMid: '#112e47',
        floorLight: '#1e4a70',
        accentPrimary: '#7dd3fc',
        accentSecondary: '#e0f2fe',
        glowColor: 'rgba(125, 211, 252, 0.26)',
        particlePrimary: '#bae6fd',
        particleSecondary: '#f0f9ff',
      };
    case 'fortaleza_goblin':
      return {
        bgTop: '#120e07',
        bgMid: '#241b0e',
        bgBottom: '#0a0704',
        wallDark: '#1c150b',
        wallMid: '#332614',
        wallLight: '#4f3b20',
        floorDark: '#140f08',
        floorMid: '#261d10',
        floorLight: '#3d2e1a',
        accentPrimary: '#f97316',
        accentSecondary: '#84cc16',
        glowColor: 'rgba(249, 115, 22, 0.24)',
        particlePrimary: '#fdba74',
        particleSecondary: '#bef264',
      };
    case 'cementerio_de_gigantes':
      return {
        bgTop: '#0e1012',
        bgMid: '#1c2024',
        bgBottom: '#070809',
        wallDark: '#171a1e',
        wallMid: '#292e36',
        wallLight: '#3f4752',
        floorDark: '#121417',
        floorMid: '#20242b',
        floorLight: '#333945',
        accentPrimary: '#cbd5e1',
        accentSecondary: '#38bdf8',
        glowColor: 'rgba(203, 213, 225, 0.20)',
        particlePrimary: '#e2e8f0',
        particleSecondary: '#7dd3fc',
      };
    case 'el_abismo':
      return {
        bgTop: '#080312',
        bgMid: '#130726',
        bgBottom: '#030108',
        wallDark: '#100621',
        wallMid: '#1f0c3d',
        wallLight: '#331561',
        floorDark: '#0b0417',
        floorMid: '#180930',
        floorLight: '#28104f',
        accentPrimary: '#a855f7',
        accentSecondary: '#f43f5e',
        glowColor: 'rgba(168, 85, 247, 0.28)',
        particlePrimary: '#d8b4fe',
        particleSecondary: '#fda4af',
      };
    case 'catacumbas_del_rey':
    default:
      return {
        bgTop: '#0a0d14',
        bgMid: '#131926',
        bgBottom: '#06080d',
        wallDark: '#111622',
        wallMid: '#1e273b',
        wallLight: '#303e5c',
        floorDark: '#0d111a',
        floorMid: '#182030',
        floorLight: '#28354f',
        accentPrimary: '#38bdf8',
        accentSecondary: '#fbbf24',
        glowColor: 'rgba(56, 189, 248, 0.22)',
        particlePrimary: '#7dd3fc',
        particleSecondary: '#fde68a',
      };
  }
}

export const LaCriptaFullScreenBiomeAtmosphere: React.FC<{
  dungeon: CriptaDungeonDefinition;
  roomType?: CriptaRoomType;
}> = ({ dungeon, roomType }) => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTick((t) => (t + 1) % 24);
    }, 340);
    return () => window.clearInterval(id);
  }, []);

  const id = dungeon.id;
  const p = getBiomeVisualProfile(id);
  const pulse = tick % 4 === 0 ? 1 : tick % 2 === 0 ? 0.86 : 0.72;
  const driftY = (tick % 8) - 4;
  const driftX = ((tick + 3) % 6) - 3;
  const isBoss = roomType === 'BOSS' || roomType === 'MINIBOSS';

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none z-0">
      {/* Base Full-Viewport Biome Gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${p.bgTop} 0%, ${p.bgMid} 58%, ${p.bgBottom} 100%)`,
        }}
      />

      {/* Full-Screen Pixel-Art World Canvas (320x180 crispEdges) */}
      <svg
        viewBox="0 0 320 180"
        preserveAspectRatio="xMidYMid slice"
        shapeRendering="crispEdges"
        className="absolute inset-0 h-full w-full opacity-90"
        style={{ imageRendering: 'pixelated' }}
      >
        {/* Distant architectural masonry / cavern ribs spanning full width */}
        {Array.from({ length: 16 }).map((_, col) => {
          const x = col * 20;
          const isPillar = col % 3 === 0;
          return (
            <g key={col}>
              {isPillar && (
                <>
                  <rect x={x} y={0} width={10} height={142} fill={p.wallDark} opacity={0.85} />
                  <rect x={x + 1} y={0} width={6} height={142} fill={p.wallMid} opacity={0.55} />
                  <rect x={x + 2} y={14} width={2} height={116} fill={p.wallLight} opacity={0.32} />
                </>
              )}
              <rect
                x={x + (col % 2) * 4}
                y={18 + (col % 4) * 24}
                width={12}
                height={6}
                fill={p.wallMid}
                opacity={0.32}
              />
              <rect
                x={x + 2}
                y={30 + ((col + 2) % 4) * 22}
                width={10}
                height={5}
                fill={p.wallLight}
                opacity={0.18}
              />
            </g>
          );
        })}

        {/* Upper Ceiling Silhouette across full screen */}
        <rect x={0} y={0} width={320} height={12} fill={p.bgBottom} opacity={0.88} />
        {Array.from({ length: 32 }).map((_, i) => {
          const h = 6 + ((i * 7) % 14);
          return (
            <g key={i}>
              <rect x={i * 10} y={10} width={8} height={h} fill={p.wallDark} opacity={0.9} />
              <rect x={i * 10 + 2} y={10 + h} width={4} height={5} fill={p.wallMid} opacity={0.65} />
            </g>
          );
        })}

        {/* Floor Composition spanning entire bottom of screen */}
        <rect x={0} y={138} width={320} height={42} fill={p.floorDark} />
        <rect x={0} y={138} width={320} height={3} fill={p.floorMid} opacity={0.85} />
        <rect x={0} y={141} width={320} height={1} fill={p.floorLight} opacity={0.45} />
        {Array.from({ length: 20 }).map((_, i) => (
          <g key={i}>
            <rect
              x={i * 16 + (i % 2) * 3}
              y={144 + (i % 3) * 9}
              width={12}
              height={4}
              fill={p.floorMid}
              opacity={0.65}
            />
            <rect
              x={i * 16 + (i % 2) * 3 + 1}
              y={144 + (i % 3) * 9}
              width={8}
              height={1}
              fill={p.floorLight}
              opacity={0.35}
            />
          </g>
        ))}

        {/* Biome-Specific Full-Screen Environmental Details */}
        {id === 'jardin_podrido' && (
          <g>
            {[18, 54, 112, 168, 224, 276, 302].map((rx, idx) => (
              <g key={rx}>
                <rect x={rx} y={12} width={3} height={26 + (idx % 3) * 14} fill="#16301c" />
                <rect x={rx + 1} y={18} width={2} height={22 + (idx % 2) * 12} fill="#254a2d" />
                <rect
                  x={rx + (tick % 2 === idx % 2 ? 1 : 0)}
                  y={36 + (idx % 3) * 12}
                  width={2}
                  height={4}
                  fill="#4ade80"
                  opacity={pulse * 0.75}
                />
              </g>
            ))}
            {[28, 92, 154, 212, 268].map((mx, idx) => (
              <g key={mx}>
                <rect x={mx} y={131} width={12} height={4} fill="#15803d" />
                <rect x={mx + 2} y={129} width={8} height={2} fill="#4ade80" opacity={pulse} />
                <rect x={mx + 4} y={135} width={4} height={4} fill="#bbf7d0" opacity={0.7} />
                {idx % 2 === 0 && (
                  <rect x={mx + 3} y={130} width={2} height={1} fill="#fef08a" opacity={pulse} />
                )}
              </g>
            ))}
          </g>
        )}

        {(id === 'catacumbas_del_rey' || id === 'cementerio_de_gigantes') && (
          <g>
            {[36, 108, 188, 264].map((tx, idx) => {
              const flicker = (tick + idx) % 3 === 0 ? 1 : 0.7;
              return (
                <g key={tx}>
                  <rect x={tx - 8} y={32} width={20} height={80} fill={p.wallDark} opacity={0.7} />
                  <rect x={tx - 6} y={34} width={16} height={4} fill={p.wallLight} opacity={0.35} />
                  <rect x={tx} y={58} width={4} height={10} fill="#334155" />
                  <rect x={tx - 1} y={56} width={6} height={2} fill="#475569" />
                  <rect
                    x={tx - 1}
                    y={50 - (tick % 2)}
                    width={6}
                    height={6}
                    fill={p.accentPrimary}
                    opacity={flicker}
                  />
                  <rect
                    x={tx}
                    y={52 - (tick % 2)}
                    width={4}
                    height={4}
                    fill="#e0f2fe"
                    opacity={flicker}
                  />
                </g>
              );
            })}
          </g>
        )}

        {(id === 'prision_maldita' || id === 'castillo_del_verdugo') && (
          <g>
            {[24, 72, 134, 196, 248, 292].map((cx, idx) => {
              const sway = (tick + idx) % 4 === 0 ? 1 : 0;
              return (
                <g key={cx}>
                  <rect x={cx + sway} y={10} width={2} height={42 + (idx % 3) * 16} fill="#334155" />
                  <rect x={cx + sway} y={16} width={1} height={36 + (idx % 3) * 16} fill="#64748b" />
                  {idx % 2 === 0 && (
                    <g>
                      <rect x={cx - 5 + sway} y={52 + (idx % 2) * 12} width={12} height={16} fill="#1e293b" />
                      <rect x={cx - 3 + sway} y={54 + (idx % 2) * 12} width={2} height={12} fill="#475569" />
                      <rect x={cx + 3 + sway} y={54 + (idx % 2) * 12} width={2} height={12} fill="#475569" />
                      <rect
                        x={cx - 1 + sway}
                        y={60 + (idx % 2) * 12}
                        width={4}
                        height={3}
                        fill={p.accentPrimary}
                        opacity={pulse}
                      />
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        )}

        {(id === 'forja_infernal' || id === 'fortaleza_goblin') && (
          <g>
            <rect x={0} y={135} width={320} height={4} fill="#7c2d12" />
            <rect x={0} y={136} width={320} height={2} fill="#f97316" opacity={pulse} />
            {[22, 84, 148, 216, 278].map((lx, idx) => (
              <rect
                key={lx}
                x={lx + ((tick + idx) % 3)}
                y={136}
                width={18}
                height={2}
                fill="#fde047"
                opacity={pulse}
              />
            ))}
          </g>
        )}

        {(id === 'la_colmena' || id === 'bosque_de_los_susurros') && (
          <g>
            {[30, 96, 164, 232, 286].map((hx, idx) => (
              <g key={hx}>
                <rect x={hx} y={14} width={8} height={28 + (idx % 2) * 14} fill={p.wallMid} />
                <rect
                  x={hx + 2}
                  y={36 + (idx % 2) * 14}
                  width={4}
                  height={8}
                  fill={p.accentPrimary}
                  opacity={pulse * 0.85}
                />
                <rect
                  x={hx + 3}
                  y={38 + (idx % 2) * 14}
                  width={2}
                  height={4}
                  fill={p.particlePrimary}
                  opacity={pulse}
                />
              </g>
            ))}
          </g>
        )}

        {(id === 'templo_sumergido' ||
          id === 'alcantarillas_imperiales' ||
          id === 'santuario_de_sangre') && (
          <g>
            <rect x={0} y={134} width={320} height={8} fill={p.wallMid} opacity={0.85} />
            <rect x={0} y={135} width={320} height={2} fill={p.accentPrimary} opacity={pulse * 0.75} />
            {[16, 68, 124, 182, 238, 288].map((wx, idx) => (
              <rect
                key={wx}
                x={wx + ((tick + idx * 2) % 6)}
                y={137}
                width={14}
                height={1}
                fill={p.particlePrimary}
                opacity={pulse}
              />
            ))}
          </g>
        )}

        {(id === 'cripta_de_cristal' ||
          id === 'cavernas_heladas' ||
          id === 'palacio_de_los_espejos' ||
          id === 'minas_abandonadas') && (
          <g>
            {[24, 82, 146, 208, 272].map((cx, idx) => (
              <g key={cx}>
                <rect x={cx} y={116 - (idx % 2) * 8} width={8} height={24 + (idx % 2) * 8} fill={p.wallLight} />
                <rect
                  x={cx + 2}
                  y={112 - (idx % 2) * 8}
                  width={4}
                  height={28 + (idx % 2) * 8}
                  fill={p.accentPrimary}
                  opacity={0.75}
                />
                <rect
                  x={cx + 3}
                  y={114 - (idx % 2) * 8}
                  width={2}
                  height={16}
                  fill={p.particlePrimary}
                  opacity={pulse}
                />
              </g>
            ))}
          </g>
        )}

        {(id === 'biblioteca_prohibida' ||
          id === 'torre_del_astrologo' ||
          id === 'ciudad_sepultada' ||
          id === 'el_abismo') && (
          <g>
            {[42, 118, 194, 268].map((ax, idx) => {
              const floatOff = ((tick + idx * 2) % 4) - 2;
              return (
                <g key={ax}>
                  <rect
                    x={ax}
                    y={44 + floatOff}
                    width={6}
                    height={14}
                    fill={p.accentPrimary}
                    opacity={pulse * 0.65}
                  />
                  <rect
                    x={ax + 2}
                    y={46 + floatOff}
                    width={2}
                    height={10}
                    fill={p.particlePrimary}
                    opacity={pulse}
                  />
                </g>
              );
            })}
          </g>
        )}

        {/* Animated Full-Screen Environmental Particles */}
        {Array.from({ length: 24 }).map((_, idx) => {
          const baseX = (idx * 13 + 9) % 310;
          const baseY = 18 + ((idx * 19) % 116);
          const px = (baseX + driftX * (idx % 2 === 0 ? 1 : -1) + 320) % 320;
          const py = (baseY + driftY * (idx % 3 === 0 ? -1 : 1) + 140) % 140;
          const isSecondary = idx % 3 === 0;
          const size = idx % 5 === 0 ? 3 : 2;
          return (
            <rect
              key={idx}
              x={px}
              y={py}
              width={size}
              height={size}
              fill={isSecondary ? p.particleSecondary : p.particlePrimary}
              opacity={((tick + idx) % 4 === 0 ? 0.9 : 0.45) * pulse}
            />
          );
        })}
      </svg>

      {/* Ambient Biome Radial Glows */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at 28% 54%, ${
            isBoss ? 'rgba(244,63,94,0.26)' : p.glowColor
          }, transparent 58%), radial-gradient(circle at 76% 42%, ${p.glowColor}, transparent 62%)`,
          opacity: pulse,
        }}
      />

      {/* Subtle Edge Vignette so UI floats cleanly over the living world */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_48%,rgba(2,4,8,0.68)_100%)]" />
    </div>
  );
};

export const LaCriptaBiomeStageBackdrop: React.FC<{
  dungeon: CriptaDungeonDefinition;
  isBossOrMiniboss?: boolean;
}> = ({ dungeon, isBossOrMiniboss = false }) => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTick((t) => (t + 1) % 24);
    }, 340);
    return () => window.clearInterval(id);
  }, []);

  const biomeId = dungeon.id;
  const p = getBiomeVisualProfile(biomeId);
  const flicker = tick % 3 === 0 ? 1 : tick % 3 === 1 ? 0.86 : 0.94;
  const pulseY = tick % 4 === 1 || tick % 4 === 2 ? -1 : 0;
  const driftX = (tick % 6) - 2;
  const particleLift = tick % 8;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
      {/* Deep Biome Atmospheric Gradient */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background: `linear-gradient(180deg, ${p.bgTop} 0%, ${p.bgMid} 58%, ${p.bgBottom} 100%)`,
        }}
      />
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          background: `radial-gradient(ellipse at 50% 46%, ${p.glowColor} 0%, transparent 72%)`,
          opacity: flicker,
        }}
      />

      {/* Full-Stage Pixel Art Biome Architecture, Props, Lighting & Ambient Particles */}
      <svg
        viewBox="0 0 160 120"
        preserveAspectRatio="none"
        shapeRendering="crispEdges"
        className="absolute inset-0 w-full h-full opacity-85"
        style={{ imageRendering: 'pixelated' }}
      >
        {/* Distant Vault Pillars & Layered Stonework */}
        <rect x="8" y="0" width="13" height="92" fill={p.wallMid} opacity="0.65" />
        <rect x="139" y="0" width="13" height="92" fill={p.wallMid} opacity="0.65" />
        <rect x="21" y="0" width="4" height="88" fill={p.wallDark} opacity="0.85" />
        <rect x="135" y="0" width="4" height="88" fill={p.wallDark} opacity="0.85" />

        {/* Brick Mortar & Crack Lines on Pillars */}
        <rect x="9" y="22" width="11" height="1" fill="#09070E" opacity="0.6" />
        <rect x="11" y="46" width="9" height="1" fill="#09070E" opacity="0.6" />
        <rect x="8" y="68" width="12" height="1" fill="#09070E" opacity="0.6" />
        <rect x="140" y="26" width="10" height="1" fill="#09070E" opacity="0.6" />
        <rect x="139" y="52" width="11" height="1" fill="#09070E" opacity="0.6" />

        {/* Upper Gothic Arch Silhouette */}
        <rect x="0" y="0" width="160" height="9" fill={p.bgBottom} opacity="0.9" />
        <rect x="24" y="9" width="112" height="3" fill={p.wallLight} opacity="0.45" />

        {/* BIOME-SPECIFIC ARCHITECTURAL PROPS & LIVING DETAILS */}
        {biomeId === 'jardin_podrido' && (
          <g>
            <rect x="28" y="9" width="3" height={22 + (tick % 2)} fill="#1D3622" />
            <rect x="30" y="20" width="2" height="15" fill="#355E3B" />
            <rect x="46" y="9" width="2" height="16" fill="#234229" />
            <rect x="114" y="9" width="2" height="19" fill="#234229" />
            <rect x="128" y="9" width="3" height={25 - (tick % 2)} fill="#1D3622" />
            <rect x="127" y="24" width="2" height="14" fill="#355E3B" />

            <rect x="25" y="66" width="5" height="20" fill="#5A4D41" />
            <rect x="27" y="66" width="2" height="20" fill="#8C7A68" />
            <rect x="18" y="58" width="19" height="8" fill="#4A2559" />
            <rect x="20" y="55" width="15" height="4" fill="#7A3E8F" />
            <rect x="22" y="59" width="11" height="2" fill="#A55CC2" />
            <rect x="22" y="57" width="3" height="2" fill="#B8FF66" opacity={flicker} />
            <rect x="29" y="60" width="3" height="2" fill="#D4FF80" opacity={flicker} />
            <rect x="20" y="65" width="15" height="2" fill="#2D1638" />

            <rect x="128" y="70" width="4" height="16" fill="#5A4D41" />
            <rect x="122" y="63" width="16" height="7" fill="#3D204A" />
            <rect x="124" y="61" width="12" height="3" fill="#7A3E8F" />
            <rect x="126" y="63" width="3" height="2" fill="#B8FF66" opacity={flicker} />
            <rect x="132" y="65" width="2" height="2" fill="#8CE65A" opacity={flicker} />

            <rect x="38" y="81" width="6" height="4" fill="#59306B" />
            <rect x="39" y="80" width="4" height="2" fill="#B8FF66" opacity={flicker} />
            <rect x="116" y="81" width="6" height="4" fill="#59306B" />
            <rect x="117" y="80" width="4" height="2" fill="#B8FF66" opacity={flicker} />
          </g>
        )}

        {(biomeId === 'catacumbas_del_rey' || biomeId === 'cementerio_de_gigantes') && (
          <g>
            <rect x="26" y="46" width="14" height="24" fill="#0B0912" />
            <rect x="28" y="50" width="4" height="4" fill="#9E927B" opacity="0.6" />
            <rect x="34" y="50" width="4" height="4" fill="#8A7E68" opacity="0.6" />
            <rect x="28" y="58" width="4" height="4" fill="#8A7E68" opacity="0.6" />
            <rect x="34" y="58" width="4" height="4" fill="#9E927B" opacity="0.6" />

            <rect x="120" y="46" width="14" height="24" fill="#0B0912" />
            <rect x="122" y="50" width="4" height="4" fill="#9E927B" opacity="0.6" />
            <rect x="128" y="50" width="4" height="4" fill="#8A7E68" opacity="0.6" />
            <rect x="122" y="58" width="4" height="4" fill="#8A7E68" opacity="0.6" />
            <rect x="128" y="58" width="4" height="4" fill="#9E927B" opacity="0.6" />

            <rect x="44" y="12" width="2" height="18" fill="#4E4A59" />
            <rect x="114" y="12" width="2" height="22" fill="#4E4A59" />
            <rect x="29" y="25" width="6" height="6" fill="#5CE6A0" opacity={flicker} />
            <rect x="125" y="25" width="6" height="6" fill="#5CE6A0" opacity={flicker} />
          </g>
        )}

        {(biomeId === 'bosque_de_los_susurros' || biomeId === 'la_colmena') && (
          <g>
            <rect x="22" y="12" width="9" height="74" fill={p.wallDark} />
            <rect x="31" y="24" width="12" height="4" fill={p.wallMid} />
            <rect x="129" y="12" width="9" height="74" fill={p.wallDark} />
            <rect x="117" y="28" width="12" height="4" fill={p.wallMid} />
            <rect x={18 + driftX * 2} y="76" width="48" height="4" fill={p.accentPrimary} opacity="0.28" />
            <rect x={92 - driftX * 2} y="78" width="46" height="4" fill={p.accentPrimary} opacity="0.28" />
          </g>
        )}

        {(biomeId === 'forja_infernal' || biomeId === 'fortaleza_goblin') && (
          <g>
            <rect x="26" y="12" width="8" height="72" fill="#2B2121" />
            <rect x="28" y="12" width="4" height="72" fill="#FF5926" opacity={flicker} />
            <rect x="30" y="12" width="1" height="72" fill="#FFD166" opacity={flicker} />

            <rect x="126" y="12" width="8" height="72" fill="#2B2121" />
            <rect x="128" y="12" width="4" height="72" fill="#FF5926" opacity={flicker} />
            <rect x="129" y="12" width="1" height="72" fill="#FFD166" opacity={flicker} />
          </g>
        )}

        {(biomeId === 'alcantarillas_imperiales' ||
          biomeId === 'templo_sumergido' ||
          biomeId === 'santuario_de_sangre') && (
          <g>
            <rect x="26" y="34" width="16" height="12" fill={p.wallDark} />
            <rect x="31" y="46" width="4" height="40" fill={p.accentPrimary} opacity="0.55" />
            <rect x="32" y={48 + particleLift * 4} width="2" height="4" fill={p.particlePrimary} />

            <rect x="118" y="34" width="16" height="12" fill={p.wallDark} />
            <rect x="123" y="46" width="4" height="40" fill={p.accentPrimary} opacity="0.55" />
            <rect x="124" y={48 + ((particleLift + 4) % 8) * 4} width="2" height="4" fill={p.particlePrimary} />
          </g>
        )}

        {(biomeId === 'cavernas_heladas' ||
          biomeId === 'cripta_de_cristal' ||
          biomeId === 'minas_abandonadas' ||
          biomeId === 'palacio_de_los_espejos') && (
          <g>
            <rect x="26" y="9" width="6" height="18" fill={p.accentPrimary} opacity="0.75" />
            <rect x="28" y="27" width="2" height="8" fill={p.particlePrimary} opacity="0.9" />
            <rect x="128" y="9" width="6" height="20" fill={p.accentPrimary} opacity="0.75" />
            <rect x="130" y="29" width="2" height="8" fill={p.particlePrimary} opacity="0.9" />
          </g>
        )}

        {(biomeId === 'prision_maldita' || biomeId === 'castillo_del_verdugo') && (
          <g>
            <rect x="34" y="9" width="2" height="36" fill="#475569" />
            <rect x="29" y="45" width="12" height="15" fill="#1e293b" />
            <rect x="31" y="47" width="2" height="11" fill="#64748b" />
            <rect x="37" y="47" width="2" height="11" fill="#64748b" />
            <rect x="124" y="9" width="2" height="40" fill="#475569" />
          </g>
        )}

        {/* Default & Shared Wall Sconces with Animated Flicker */}
        <rect x="30" y="32" width="4" height="10" fill="#2B2138" />
        <rect
          x="29"
          y={27 + pulseY}
          width="6"
          height="5"
          fill={p.accentPrimary}
          opacity={0.85 * flicker}
        />
        <rect
          x="30"
          y={24 + pulseY}
          width="4"
          height="3"
          fill="#FFF3B0"
          opacity={0.92 * flicker}
        />

        <rect x="126" y="32" width="4" height="10" fill="#2B2138" />
        <rect
          x="125"
          y={27 + pulseY}
          width="6"
          height="5"
          fill={p.accentPrimary}
          opacity={0.85 * flicker}
        />
        <rect
          x="126"
          y={24 + pulseY}
          width="4"
          height="3"
          fill="#FFF3B0"
          opacity={0.92 * flicker}
        />

        {/* Animated Floating Particles Across Stage */}
        {Array.from({ length: 10 }).map((_, idx) => {
          const px = (24 + idx * 12 + driftX * (idx % 2 === 0 ? 1 : -1)) % 144;
          const py = (68 - ((particleLift + idx * 2) % 8) * 6 + 80) % 80;
          return (
            <rect
              key={idx}
              x={px}
              y={py}
              width="2"
              height="2"
              fill={idx % 2 === 0 ? p.particlePrimary : p.particleSecondary}
              opacity={0.75 * flicker}
            />
          );
        })}

        {/* Creature Stage Stone Pedestal / Ground Plane */}
        <rect x="0" y="88" width="160" height="32" fill={p.floorDark} opacity="0.95" />
        <rect x="12" y="84" width="136" height="5" fill={p.floorMid} opacity="0.9" />
        <rect x="20" y="83" width="120" height="1" fill={p.floorLight} opacity="0.65" />
        <rect x="38" y="84" width="1" height="5" fill="#08060D" opacity="0.65" />
        <rect x="80" y="84" width="1" height="5" fill="#08060D" opacity="0.65" />
        <rect x="122" y="84" width="1" height="5" fill="#08060D" opacity="0.65" />

        {/* Boss / Miniboss Runic Circle Glow on Floor */}
        {isBossOrMiniboss && (
          <>
            <rect
              x="34"
              y="85"
              width="92"
              height="2"
              fill={p.accentPrimary}
              opacity={0.85 * flicker}
            />
            <rect
              x="46"
              y="88"
              width="68"
              height="1"
              fill={p.particlePrimary}
              opacity={0.95 * flicker}
            />
          </>
        )}
      </svg>

      {/* Vignette Framing */}
      <div className="absolute inset-0 shadow-[inset_0_0_55px_rgba(4,4,8,0.85)]" />
    </div>
  );
};

