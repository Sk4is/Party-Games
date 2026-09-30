import React from 'react';
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
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
      {/* Deep Biome Atmospheric Gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 42%, ${dungeon.palette.glow}2A 0%, ${dungeon.palette.fog}66 48%, ${dungeon.palette.stoneDark} 92%)`,
        }}
      />

      {/* Full-Stage Pixel Art Architectural Silhouettes & Pedestal */}
      <svg
        viewBox="0 0 160 120"
        preserveAspectRatio="none"
        shapeRendering="crispEdges"
        className="absolute inset-0 w-full h-full opacity-55"
      >
        {/* Distant Vault Pillars */}
        <rect x="10" y="0" width="12" height="96" fill={dungeon.palette.stone} opacity="0.55" />
        <rect x="138" y="0" width="12" height="96" fill={dungeon.palette.stone} opacity="0.55" />
        <rect x="22" y="0" width="4" height="88" fill={dungeon.palette.stoneDark} opacity="0.7" />
        <rect x="134" y="0" width="4" height="88" fill={dungeon.palette.stoneDark} opacity="0.7" />

        {/* Upper Gothic Arch Silhouette */}
        <rect x="0" y="0" width="160" height="10" fill="#07050A" opacity="0.8" />
        <rect x="26" y="10" width="108" height="3" fill={dungeon.palette.stone} opacity="0.45" />

        {/* Wall Torches / Biome Sconces */}
        <rect x="30" y="32" width="4" height="10" fill="#2B2138" />
        <rect x="29" y="27" width="6" height="5" fill={dungeon.palette.highlight} opacity="0.85" />
        <rect x="30" y="24" width="4" height="3" fill="#FFF3B0" opacity="0.9" />

        <rect x="126" y="32" width="4" height="10" fill="#2B2138" />
        <rect x="125" y="27" width="6" height="5" fill={dungeon.palette.highlight} opacity="0.85" />
        <rect x="126" y="24" width="4" height="3" fill="#FFF3B0" opacity="0.9" />

        {/* Creature Stage Stone Pedestal / Ground Plane */}
        <rect x="0" y="88" width="160" height="32" fill="#08060D" opacity="0.88" />
        <rect x="14" y="84" width="132" height="5" fill={dungeon.palette.stone} opacity="0.75" />
        <rect x="24" y="82" width="112" height="2" fill={dungeon.palette.highlight} opacity="0.38" />

        {/* Boss / Miniboss Runic Circle Glow on Floor */}
        {isBossOrMiniboss && (
          <>
            <rect x="36" y="85" width="88" height="2" fill={dungeon.palette.highlight} opacity="0.75" />
            <rect x="48" y="88" width="64" height="1" fill={dungeon.palette.glow} opacity="0.85" />
          </>
        )}
      </svg>

      {/* Vignette Framing */}
      <div className="absolute inset-0 shadow-[inset_0_0_65px_rgba(5,4,8,0.92)]" />
    </div>
  );
};

