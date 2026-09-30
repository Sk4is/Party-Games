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
          background: `radial-gradient(ellipse at 50% 42%, ${dungeon.palette.glow}33 0%, ${dungeon.palette.fog}75 48%, ${dungeon.palette.stoneDark} 94%)`,
        }}
      />

      {/* Full-Stage Pixel Art Biome Architecture, Props, Lighting & Ambient Particles */}
      <svg
        viewBox="0 0 160 120"
        preserveAspectRatio="none"
        shapeRendering="crispEdges"
        className="absolute inset-0 w-full h-full opacity-75"
      >
        {/* Distant Vault Pillars & Layered Stonework */}
        <rect x="8" y="0" width="13" height="92" fill={dungeon.palette.stone} opacity="0.52" />
        <rect x="139" y="0" width="13" height="92" fill={dungeon.palette.stone} opacity="0.52" />
        <rect x="21" y="0" width="4" height="88" fill={dungeon.palette.stoneDark} opacity="0.78" />
        <rect x="135" y="0" width="4" height="88" fill={dungeon.palette.stoneDark} opacity="0.78" />

        {/* Brick Mortar & Crack Lines on Pillars */}
        <rect x="9" y="22" width="11" height="1" fill="#09070E" opacity="0.6" />
        <rect x="11" y="46" width="9" height="1" fill="#09070E" opacity="0.6" />
        <rect x="8" y="68" width="12" height="1" fill="#09070E" opacity="0.6" />
        <rect x="140" y="26" width="10" height="1" fill="#09070E" opacity="0.6" />
        <rect x="139" y="52" width="11" height="1" fill="#09070E" opacity="0.6" />

        {/* Upper Gothic Arch Silhouette */}
        <rect x="0" y="0" width="160" height="9" fill="#07050A" opacity="0.86" />
        <rect x="24" y="9" width="112" height="3" fill={dungeon.palette.stone} opacity="0.45" />

        {/* ================================================================ */}
        {/* BIOME-SPECIFIC ARCHITECTURAL PROPS & LIVING DETAILS              */}
        {/* ================================================================ */}

        {biomeId === 'jardin_podrido' && (
          <g>
            {/* Hanging Overgrown Vines & Tangled Canopy Roots */}
            <rect x="28" y="9" width="3" height={22 + (tick % 2)} fill="#1D3622" />
            <rect x="30" y="20" width="2" height="15" fill="#355E3B" />
            <rect x="46" y="9" width="2" height="16" fill="#234229" />
            <rect x="114" y="9" width="2" height="19" fill="#234229" />
            <rect x="128" y="9" width="3" height={25 - (tick % 2)} fill="#1D3622" />
            <rect x="127" y="24" width="2" height="14" fill="#355E3B" />

            {/* Giant Background Bioluminescent Fungal Stalks (Left & Right) */}
            <rect x="25" y="66" width="5" height="20" fill="#5A4D41" />
            <rect x="27" y="66" width="2" height="20" fill="#8C7A68" />
            <rect x="18" y="58" width="19" height="8" fill="#4A2559" />
            <rect x="20" y="55" width="15" height="4" fill="#7A3E8F" />
            <rect x="22" y="59" width="11" height="2" fill="#A55CC2" />
            {/* Glowing Fungal Cap Spots */}
            <rect x="22" y="57" width="3" height="2" fill="#B8FF66" opacity={flicker} />
            <rect x="29" y="60" width="3" height="2" fill="#D4FF80" opacity={flicker} />
            <rect x="20" y="65" width="15" height="2" fill="#2D1638" />

            {/* Right Cluster of Glowing Toadstools */}
            <rect x="128" y="70" width="4" height="16" fill="#5A4D41" />
            <rect x="122" y="63" width="16" height="7" fill="#3D204A" />
            <rect x="124" y="61" width="12" height="3" fill="#7A3E8F" />
            <rect x="126" y="63" width="3" height="2" fill="#B8FF66" opacity={flicker} />
            <rect x="132" y="65" width="2" height="2" fill="#8CE65A" opacity={flicker} />

            {/* Smaller Foreground Spore Bulbs on Floor */}
            <rect x="38" y="81" width="6" height="4" fill="#59306B" />
            <rect x="39" y="80" width="4" height="2" fill="#B8FF66" opacity={flicker} />
            <rect x="116" y="81" width="6" height="4" fill="#59306B" />
            <rect x="117" y="80" width="4" height="2" fill="#B8FF66" opacity={flicker} />

            {/* Floating Bioluminescent Spore Particles */}
            <rect x={34 + driftX} y={70 - particleLift * 4} width="2" height="2" fill="#B8FF66" opacity="0.8" />
            <rect x={62 - driftX} y={64 - ((particleLift + 3) % 8) * 4} width="2" height="2" fill="#D4FF80" opacity="0.7" />
            <rect x={98 + driftX} y={68 - ((particleLift + 5) % 8) * 4} width="2" height="2" fill="#B8FF66" opacity="0.75" />
            <rect x={122 - driftX} y={60 - ((particleLift + 2) % 8) * 4} width="2" height="2" fill="#C285E6" opacity="0.75" />
            <rect x={78} y={52 - particleLift * 3} width="1" height="1" fill="#E6FFB2" opacity="0.65" />
          </g>
        )}

        {biomeId === 'catacumbas_reales' && (
          <g>
            {/* Recessed Skull Ossuary Niches in Walls */}
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

            {/* Hanging Crypt Chains & Necromantic Green Torch Sconces */}
            <rect x="44" y="12" width="2" height="18" fill="#4E4A59" />
            <rect x="114" y="12" width="2" height="22" fill="#4E4A59" />
            <rect x="29" y="25" width="6" height="6" fill="#5CE6A0" opacity={flicker} />
            <rect x="125" y="25" width="6" height="6" fill="#5CE6A0" opacity={flicker} />

            {/* Rising Soul Wisps & Crypt Dust Motes */}
            <rect x={42 + driftX} y={68 - particleLift * 4} width="2" height="3" fill="#5CE6A0" opacity="0.65" />
            <rect x={112 - driftX} y={64 - ((particleLift + 4) % 8) * 4} width="2" height="3" fill="#5CE6A0" opacity="0.65" />
          </g>
        )}

        {biomeId === 'bosque_susurrante' && (
          <g>
            {/* Gnarled Deadwood Trunks & Hanging Briar Branches */}
            <rect x="22" y="12" width="9" height="74" fill="#1E1714" />
            <rect x="31" y="24" width="12" height="4" fill="#29201B" />
            <rect x="129" y="12" width="9" height="74" fill="#1E1714" />
            <rect x="117" y="28" width="12" height="4" fill="#29201B" />

            {/* Drifting Ground Mist & Will-o'-Wisp Fireflies */}
            <rect x={18 + driftX * 2} y="76" width="48" height="4" fill="#4B6B63" opacity="0.32" />
            <rect x={92 - driftX * 2} y="78" width="46" height="4" fill="#4B6B63" opacity="0.32" />
            <rect x={44 + driftX} y={62 - particleLift * 3} width="2" height="2" fill="#8CE6B8" opacity={flicker} />
            <rect x={108 - driftX} y={58 - ((particleLift + 3) % 8) * 3} width="2" height="2" fill="#B8FFE0" opacity={flicker} />
          </g>
        )}

        {biomeId === 'forja_infernal' && (
          <g>
            {/* Dwarf Smelter Crucible Pipes & Molten Lava Channels */}
            <rect x="26" y="12" width="8" height="72" fill="#2B2121" />
            <rect x="28" y="12" width="4" height="72" fill="#FF5926" opacity={flicker} />
            <rect x="30" y="12" width="1" height="72" fill="#FFD166" opacity={flicker} />

            <rect x="126" y="12" width="8" height="72" fill="#2B2121" />
            <rect x="128" y="12" width="4" height="72" fill="#FF5926" opacity={flicker} />
            <rect x="129" y="12" width="1" height="72" fill="#FFD166" opacity={flicker} />

            {/* Rising Forge Sparks & Cinders */}
            <rect x={38 + driftX} y={76 - particleLift * 6} width="2" height="2" fill="#FF8C3B" opacity="0.9" />
            <rect x={76 - driftX} y={74 - ((particleLift + 3) % 8) * 6} width="2" height="2" fill="#FFD166" opacity="0.85" />
            <rect x={118 + driftX} y={78 - ((particleLift + 5) % 8) * 6} width="2" height="2" fill="#FF5926" opacity="0.9" />
          </g>
        )}

        {biomeId === 'alcantarillas_imperiales' && (
          <g>
            {/* Iron Sewer Grates & Dripping Toxic Sluice Pipes */}
            <rect x="26" y="34" width="16" height="12" fill="#1C2621" />
            <rect x="28" y="34" width="2" height="12" fill="#3B4D43" />
            <rect x="33" y="34" width="2" height="12" fill="#3B4D43" />
            <rect x="38" y="34" width="2" height="12" fill="#3B4D43" />
            {/* Dripping Acid Stream */}
            <rect x="31" y="46" width="4" height="40" fill="#6EE64E" opacity="0.55" />
            <rect x="32" y={48 + particleLift * 4} width="2" height="4" fill="#C4FF80" />

            <rect x="118" y="34" width="16" height="12" fill="#1C2621" />
            <rect x="123" y="46" width="4" height="40" fill="#6EE64E" opacity="0.55" />
            <rect x="124" y={48 + ((particleLift + 4) % 8) * 4} width="2" height="4" fill="#C4FF80" />

            {/* Rising Alchemical / Sewer Gas Bubbles */}
            <rect x={46 + driftX} y={76 - particleLift * 4} width="3" height="3" fill="#80FF59" opacity="0.65" />
            <rect x={112 - driftX} y={74 - ((particleLift + 3) % 8) * 4} width="3" height="3" fill="#80FF59" opacity="0.65" />
          </g>
        )}

        {biomeId === 'cavernas_heladas' && (
          <g>
            {/* Jagged Ceiling Icicles & Frozen Crystal Columns */}
            <rect x="26" y="9" width="6" height="18" fill="#6EC2E6" opacity="0.8" />
            <rect x="28" y="27" width="2" height="8" fill="#B8F2FF" opacity="0.9" />
            <rect x="40" y="9" width="4" height="14" fill="#6EC2E6" opacity="0.75" />
            <rect x="116" y="9" width="4" height="15" fill="#6EC2E6" opacity="0.75" />
            <rect x="128" y="9" width="6" height="20" fill="#6EC2E6" opacity="0.8" />
            <rect x="130" y="29" width="2" height="8" fill="#B8F2FF" opacity="0.9" />

            {/* Falling Snowflakes & Frost Crystals */}
            <rect x={36 + driftX} y={18 + particleLift * 7} width="2" height="2" fill="#E0FAFF" opacity="0.85" />
            <rect x={78 - driftX} y={14 + ((particleLift + 3) % 8) * 7} width="2" height="2" fill="#B8F2FF" opacity="0.8" />
            <rect x={118 + driftX} y={20 + ((particleLift + 5) % 8) * 7} width="2" height="2" fill="#E0FAFF" opacity="0.85" />
          </g>
        )}

        {/* Default & Shared Wall Sconces with Animated Flicker */}
        <rect x="30" y="32" width="4" height="10" fill="#2B2138" />
        <rect
          x="29"
          y={27 + pulseY}
          width="6"
          height="5"
          fill={dungeon.palette.highlight}
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
          fill={dungeon.palette.highlight}
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

        {/* Ambient Floating Motes for All Other Biomes */}
        {biomeId !== 'jardin_podrido' &&
          biomeId !== 'forja_infernal' &&
          biomeId !== 'cavernas_heladas' && (
            <g>
              <rect
                x={48 + driftX}
                y={68 - particleLift * 4}
                width="2"
                height="2"
                fill={dungeon.palette.glow}
                opacity="0.65"
              />
              <rect
                x={108 - driftX}
                y={62 - ((particleLift + 4) % 8) * 4}
                width="2"
                height="2"
                fill={dungeon.palette.highlight}
                opacity="0.65"
              />
            </g>
          )}

        {/* Creature Stage Stone Pedestal / Ground Plane */}
        <rect x="0" y="88" width="160" height="32" fill="#08060D" opacity="0.9" />
        <rect x="12" y="84" width="136" height="5" fill={dungeon.palette.stone} opacity="0.82" />
        <rect x="20" y="83" width="120" height="1" fill={dungeon.palette.highlight} opacity="0.45" />
        {/* Carved Pedestal Stone Blocks */}
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
              fill={dungeon.palette.highlight}
              opacity={0.8 * flicker}
            />
            <rect
              x="46"
              y="88"
              width="68"
              height="1"
              fill={dungeon.palette.glow}
              opacity={0.9 * flicker}
            />
          </>
        )}
      </svg>

      {/* Vignette Framing */}
      <div className="absolute inset-0 shadow-[inset_0_0_65px_rgba(5,4,8,0.92)]" />
    </div>
  );
};

