import React, { useEffect, useRef, useState } from 'react';
import {
  CriptaAccessoryId,
  CriptaArmorId,
  CriptaCanonicalRoomType,
  CriptaDungeonDefinition,
  CriptaDungeonRoom,
  CriptaItemId,
  CriptaRelicId,
  CriptaWeaponId,
} from '../../types/laCripta';
import {
  LaCriptaAccessoryPixelIcon,
  LaCriptaArmorPixelIcon,
  LaCriptaItemPixelIcon,
  LaCriptaRelicPixelIcon,
  LaCriptaWeaponPixelIcon,
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
  weaponId?: CriptaWeaponId;
  armorId?: CriptaArmorId;
  accessoryId?: CriptaAccessoryId;
  upgradeLevel?: number;
}> = ({
  artKind,
  itemId,
  relicId,
  weaponId,
  armorId,
  accessoryId,
  upgradeLevel,
}) => {
  if (weaponId) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <LaCriptaWeaponPixelIcon
          weaponId={weaponId}
          upgradeLevel={upgradeLevel}
          size={60}
        />
      </div>
    );
  }
  if (armorId) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <LaCriptaArmorPixelIcon armorId={armorId} size={54} />
      </div>
    );
  }
  if (accessoryId) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <LaCriptaAccessoryPixelIcon accessoryId={accessoryId} size={54} />
      </div>
    );
  }
  if (itemId) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <LaCriptaItemPixelIcon itemId={itemId} size={56} />
      </div>
    );
  }
  if (relicId) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <LaCriptaRelicPixelIcon relicId={relicId} size={56} />
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
  comparisonBadge?: string | null;
  comparisonTone?: 'upgrade' | 'downgrade' | 'neutral';
  theme?: CriptaCardVisualTheme;
  accentColor?: 'crimson' | 'cyan' | 'amber' | 'purple' | 'emerald' | 'slate';
  artKind?: CriptaCardArtKind;
  illustration?: React.ReactNode;
  itemId?: CriptaItemId;
  relicId?: CriptaRelicId;
  weaponId?: CriptaWeaponId;
  armorId?: CriptaArmorId;
  accessoryId?: CriptaAccessoryId;
  upgradeLevel?: number;
  topRightBadge?: string;
  disabled?: boolean;
  selected?: boolean;
  turnLocked?: boolean;
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
 * Compact height ensures ZERO vertical scroll on the right decision panel.
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
  comparisonBadge,
  comparisonTone = 'neutral',
  theme,
  accentColor,
  artKind = 'SWORD_SLASH',
  illustration,
  itemId,
  relicId,
  weaponId,
  armorId,
  accessoryId,
  upgradeLevel,
  topRightBadge,
  disabled = false,
  selected = false,
  turnLocked = false,
  voterBadges = [],
  onClick,
}) => {
  const [commitFlash, setCommitFlash] = useState(false);

  const resolvedTheme: CriptaCardVisualTheme =
    theme || (accentColor ? ACCENT_TO_THEME[accentColor] : 'EVENT');
  const pal = THEME_PALETTES[resolvedTheme];
  const resolvedTopRight = topRightBadge || cooldownLabel;
  const resolvedPrimary = effectPrimary || footerBadge || categoryLabel;
  const resolvedSecondary = effectSecondary || summary;
  const isDisabled = disabled || turnLocked;
  const isOnCooldown = Boolean(
    resolvedTopRight &&
      (resolvedTopRight.startsWith('⏱') ||
        resolvedTopRight.startsWith('CD:') ||
        resolvedTopRight === 'USADA' ||
        resolvedTopRight === 'EJECUTADO')
  );
  const isReadyLabel =
    resolvedTopRight === 'LISTA' || resolvedTopRight === 'SIEMPRE LISTA';

  const handleCardClick = () => {
    if (isDisabled) return;
    setCommitFlash(true);
    window.setTimeout(() => setCommitFlash(false), 680);
    onClick();
  };

  const cardElement = (
    <button
      type="button"
      disabled={isDisabled}
      onClick={handleCardClick}
      className={`group relative w-[142px] sm:w-[152px] lg:w-[144px] xl:w-[154px] 2xl:w-[170px] h-[clamp(218px,28.5dvh,262px)] shrink-0 border-2 flex flex-col justify-between text-left transition-all duration-150 select-none ${
        isOnCooldown
          ? 'opacity-60 saturate-50 cursor-not-allowed'
          : isDisabled
          ? 'opacity-50 grayscale-[25%] cursor-not-allowed'
          : commitFlash
          ? '-translate-y-2.5 scale-[1.06] ring-2 ring-[#FFD166] cursor-pointer z-30'
          : selected
          ? '-translate-y-2 scale-[1.03] ring-1 ring-[#FFD166] cursor-pointer z-20'
          : 'hover:-translate-y-1.5 hover:scale-[1.02] active:translate-y-0 cursor-pointer hover:z-10'
      }`}
      style={{
        backgroundColor: pal.bg,
        borderColor:
          commitFlash || selected
            ? '#FFD166'
            : isOnCooldown
            ? '#524364'
            : pal.border,
        boxShadow:
          commitFlash || selected
            ? `0 14px 32px rgba(0,0,0,0.95), 0 0 24px #FFD16688, inset 0 0 18px ${pal.glow}`
            : isDisabled
            ? '0 4px 12px rgba(0,0,0,0.7)'
            : `0 8px 20px rgba(0,0,0,0.88), inset 0 0 16px ${pal.glow}`,
      }}
    >
      {/* Physical Commitment / Vote Lock Seal Stamp */}
      {(commitFlash || selected) && (
        <div className="pointer-events-none absolute -top-2.5 left-1/2 -translate-x-1/2 z-30 px-2 py-0.5 bg-[#2A1C0E] border-2 border-[#FFD166] text-[8px] font-cripta-pixel font-black text-[#FFD166] uppercase tracking-widest shadow-[0_0_12px_rgba(255,209,102,0.75)] whitespace-nowrap">
          ✦ {commitFlash ? 'ACCIÓN SELLADA' : 'SELECCIONADA'} ✦
        </div>
      )}

      {/* 1. Fixed Top Cost Badge & Cooldown/Ready Bar (22px) */}
      <div
        className="w-full h-[22px] px-1.5 border-b flex items-center justify-between gap-1 shrink-0"
        style={{
          backgroundColor: pal.headerBg,
          borderColor: `${pal.border}66`,
        }}
      >
        <span
          className="px-1.5 py-0.5 font-cripta-mono text-[8.5px] font-extrabold tracking-wider uppercase shrink-0"
          style={{
            backgroundColor: pal.badgeBg,
            color: pal.badgeText,
          }}
        >
          {turnLocked ? 'EN CURSO' : costLabel}
        </span>

        {resolvedTopRight ? (
          <span
            className={`px-1 py-0.2 font-cripta-mono text-[8px] font-extrabold uppercase truncate ${
              isOnCooldown
                ? 'bg-[#2A1C12] border border-[#E7A54A]/70 text-[#FFD166]'
                : isReadyLabel
                ? 'text-[#8EE6AE]'
                : 'text-[#FFD166]'
            }`}
          >
            {resolvedTopRight}
          </span>
        ) : (
          <span
            className="font-cripta-pixel text-[7.5px] uppercase tracking-wider truncate"
            style={{ color: pal.accentText }}
          >
            {categoryLabel}
          </span>
        )}
      </div>

      {/* 2. Title + Short Tag Block */}
      <div className="min-h-[38px] px-1.5 pt-1 pb-0.5 text-center shrink-0 flex flex-col justify-center">
        <div className="font-cripta-display text-[11px] sm:text-xs font-black text-[#F4EBD9] uppercase tracking-wide leading-[1.12] line-clamp-2 flex items-center justify-center">
          {title}
        </div>
        <div
          className="font-cripta-pixel text-[7.5px] uppercase tracking-wider truncate leading-tight mt-0.5"
          style={{ color: pal.accentText }}
        >
          {categoryLabel}
        </div>
      </div>

      {/* 3. STRICT NORMALIZED PIXEL-ART ILLUSTRATION FRAME */}
      <div
        className="mx-1.5 h-[clamp(64px,9.2dvh,80px)] shrink-0 border flex items-center justify-center relative overflow-hidden"
        style={{
          backgroundColor: pal.artBg,
          borderColor: `${pal.border}55`,
          backgroundImage: `radial-gradient(circle at 50% 50%, ${pal.glow} 0%, transparent 75%)`,
        }}
      >
        <div className="transition-transform duration-150 group-hover:scale-105 flex items-center justify-center w-full h-full p-1 overflow-hidden">
          {illustration ? (
            illustration
          ) : (
            <LaCriptaCardIllustration
              artKind={artKind}
              itemId={itemId}
              relicId={relicId}
              weaponId={weaponId}
              armorId={armorId}
              accessoryId={accessoryId}
              upgradeLevel={upgradeLevel}
            />
          )}
        </div>

        {/* Subtle Hover/Touch Info Indicator when Tooltip Exists */}
        {tooltipDescription && (
          <span
            className="pointer-events-none absolute top-1 right-1 z-20 w-3.5 h-3.5 bg-[#0D0915]/85 border border-[#4A3B5C] text-[7.5px] font-cripta-mono font-bold text-[#D8C6A0]/80 group-hover:border-[#FFD166] group-hover:text-[#FFD166] flex items-center justify-center"
            aria-hidden="true"
          >
            i
          </span>
        )}

        {/* Cooldown Subdued Overlay Pill inside Art Frame */}
        {isOnCooldown && !comparisonBadge && voterBadges.length === 0 && (
          <div className="pointer-events-none absolute inset-x-1 bottom-1 z-20 px-1.5 py-0.5 bg-[#120C1C]/95 border border-[#E7A54A]/80 text-center font-cripta-mono text-[8px] font-black text-[#FFD166] uppercase tracking-wider shadow-md">
            {resolvedTopRight}
          </div>
        )}

        {/* Equipment Comparison Overlay Pill at bottom of art frame when comparisonBadge is provided */}
        {comparisonBadge && voterBadges.length === 0 && (
          <div
            className={`pointer-events-none absolute inset-x-1 bottom-1 z-20 px-1.5 py-0.5 border text-center font-cripta-mono text-[7.5px] font-bold uppercase truncate shadow-md ${
              comparisonTone === 'upgrade'
                ? 'bg-[#0C2216]/95 border-[#5EA87A] text-[#8EE6AE]'
                : comparisonTone === 'downgrade'
                ? 'bg-[#260E16]/95 border-[#C93B5B] text-[#FF8FA3]'
                : 'bg-[#161024]/95 border-[#E7A54A] text-[#FFD166]'
            }`}
          >
            {comparisonBadge}
          </div>
        )}

        {/* Multiplayer Voter Badges Overlay anchored inside bottom of art box so card layout never shifts */}
        {voterBadges.length > 0 && (
          <div className="pointer-events-none absolute inset-x-1 bottom-1 z-20 flex flex-wrap items-center justify-center gap-1">
            {voterBadges.map((v) => (
              <span
                key={v.id}
                className="px-1.5 py-0.2 bg-[#09070D]/95 border text-[7px] font-cripta-pixel text-[#FFD166] shadow-md"
                style={{ borderColor: v.color }}
              >
                {v.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 4. Bottom Hierarchy: Largest Gameplay Number -> Concise Special Property -> Class Mechanic / Cooldown Footer */}
      <div className="px-1.5 pt-1 pb-1.5 text-center flex-1 min-h-0 flex flex-col justify-between">
        <div className="flex flex-col items-center justify-center my-auto gap-0.5">
          {headlineValue && (
            <div className="font-cripta-mono text-xs sm:text-[13px] font-black text-[#FFD166] tracking-wide uppercase leading-none max-w-full drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]">
              {headlineValue}
            </div>
          )}
          {resolvedSecondary && (
            <div className="font-cripta-pixel text-[8px] sm:text-[8.5px] font-bold text-[#F4EBD9]/95 leading-[1.2] line-clamp-2 flex items-center justify-center">
              {resolvedSecondary}
            </div>
          )}
        </div>
        <div
          className="pt-1 border-t border-[#2A1F38]/80 font-cripta-mono text-[8px] font-extrabold tracking-wider uppercase leading-tight truncate shrink-0"
          style={{ color: isOnCooldown ? '#FFD166' : pal.accentText }}
        >
          {resolvedPrimary}
        </div>
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

// ============================================================================
// CENTRALIZED COMBAT CARD ART REGISTRY (Sections 5, 6, 7, 8)
// Every playable character card, weapon attack, weapon special, and guard
// references an explicit artKey with bespoke La Cripta pixel-art illustration.
// ============================================================================

export type CriptaCombatCardArtKey =
  // Guard / Defense
  | 'common_iron_guard'
  // Caballero
  | 'knight_iron_wall'
  | 'knight_shield_bash'
  // Mago
  | 'mage_astral_fire'
  | 'mage_mirror_veil'
  // Pícaro
  | 'rogue_backstab'
  | 'rogue_smoke_veil'
  // Cazador
  | 'hunter_prey_mark'
  | 'hunter_silver_volley'
  // Clérigo
  | 'cleric_reliquary_light'
  | 'cleric_dawn_judgment'
  // Alquimista
  | 'alchemist_vital_elixir'
  | 'alchemist_vitriol_flask'
  // Bárbaro
  | 'barbarian_brutal_cleave'
  | 'barbarian_war_cry'
  | 'barbarian_bonebreaker'
  // Bardo
  | 'bard_dissonant_chord'
  | 'bard_valor_ballad'
  | 'bard_eclipse_coda'
  // Nigromante
  | 'necromancer_soul_drain'
  | 'necromancer_bone_pact'
  | 'necromancer_corpse_explosion'
  // Weapon Basic Attacks (by equipped weapon family)
  | 'weapon_attack_sword'
  | 'weapon_attack_axe'
  | 'weapon_attack_mace'
  | 'weapon_attack_dagger'
  | 'weapon_attack_bow'
  | 'weapon_attack_crossbow'
  | 'weapon_attack_staff'
  | 'weapon_attack_alchemy'
  | 'weapon_attack_instrument'
  | 'weapon_attack_scythe'
  | 'weapon_attack_halberd'
  | 'weapon_attack_pickaxe'
  | 'weapon_attack_tome'
  // Weapon Special Techniques (by equipped weapon family)
  | 'weapon_special_sword'
  | 'weapon_special_axe'
  | 'weapon_special_mace'
  | 'weapon_special_dagger'
  | 'weapon_special_bow'
  | 'weapon_special_crossbow'
  | 'weapon_special_staff'
  | 'weapon_special_alchemy'
  | 'weapon_special_instrument'
  | 'weapon_special_scythe'
  | 'weapon_special_halberd'
  | 'weapon_special_pickaxe'
  | 'weapon_special_tome';

export const combatCardArtRegistry: Record<
  CriptaCombatCardArtKey,
  {
    artKey: CriptaCombatCardArtKey;
    label: string;
    renderSvg: () => React.ReactNode;
  }
> = {
  common_iron_guard: {
    artKey: 'common_iron_guard',
    label: 'Guardia de Hierro',
    renderSvg: () => (
      <g>
        {/* Heraldic Steel Heater Shield + Counter-Strike Gleam */}
        <rect x="9" y="3" width="18" height="14" fill="#1F3A42" />
        <rect x="11" y="4" width="14" height="12" fill="#467A82" />
        <rect x="12" y="16" width="12" height="4" fill="#1F3A42" />
        <rect x="14" y="16" width="8" height="3" fill="#69A8A5" />
        <rect x="15" y="20" width="6" height="3" fill="#1F3A42" />
        <rect x="17" y="4" width="2" height="16" fill="#FFD166" />
        <rect x="11" y="9" width="14" height="2" fill="#FFD166" />
        <rect x="16" y="8" width="4" height="4" fill="#FFF3C4" />
        {/* Ward Sparks */}
        <rect x="5" y="7" width="2" height="6" fill="#8EE6AE" />
        <rect x="29" y="7" width="2" height="6" fill="#8EE6AE" />
        <rect x="6" y="4" width="2" height="2" fill="#FFD166" />
        <rect x="28" y="4" width="2" height="2" fill="#FFD166" />
      </g>
    ),
  },
  knight_iron_wall: {
    artKey: 'knight_iron_wall',
    label: 'Muro de Hierro',
    renderSvg: () => (
      <g>
        {/* Towering Fortress Pavise Shield + Dual Bastion Wings */}
        <rect x="4" y="6" width="6" height="15" fill="#2A3E48" />
        <rect x="26" y="6" width="6" height="15" fill="#2A3E48" />
        <rect x="5" y="8" width="4" height="11" fill="#69A8A5" />
        <rect x="27" y="8" width="4" height="11" fill="#69A8A5" />
        <rect x="10" y="2" width="16" height="21" fill="#324B52" />
        <rect x="12" y="4" width="12" height="17" fill="#78B7BB" />
        <rect x="17" y="3" width="2" height="19" fill="#FFD166" />
        <rect x="12" y="10" width="12" height="3" fill="#E7A54A" />
        <rect x="15" y="8" width="6" height="7" fill="#FFF3C4" />
        <rect x="2" y="21" width="32" height="2" fill="#E7A54A" />
      </g>
    ),
  },
  knight_shield_bash: {
    artKey: 'knight_shield_bash',
    label: 'Embate de Pavés',
    renderSvg: () => (
      <g>
        {/* Heavy Spiked Pavise Ramming Forward + Armor Shatter Shards */}
        <rect x="7" y="4" width="14" height="18" fill="#324B52" />
        <rect x="9" y="6" width="10" height="14" fill="#69A8A5" />
        <rect x="13" y="6" width="3" height="14" fill="#E7A54A" />
        <rect x="19" y="10" width="6" height="6" fill="#FFD166" />
        <rect x="23" y="11" width="5" height="4" fill="#FFF3C4" />
        {/* Compression Shockwave & Broken Armor Shards */}
        <rect x="26" y="4" width="3" height="5" fill="#FF7A33" />
        <rect x="28" y="9" width="4" height="8" fill="#FFD166" />
        <rect x="26" y="17" width="3" height="5" fill="#FF7A33" />
        <rect x="31" y="6" width="3" height="3" fill="#C93B5B" />
        <rect x="31" y="17" width="3" height="3" fill="#C93B5B" />
      </g>
    ),
  },
  mage_astral_fire: {
    artKey: 'mage_astral_fire',
    label: 'Fuego Astral',
    renderSvg: () => (
      <g>
        {/* Twin Astral Meteor Comets + Violet-Gold Starburst */}
        <rect x="5" y="4" width="6" height="4" fill="#9B72CF" />
        <rect x="9" y="6" width="8" height="6" fill="#E0AAFF" />
        <rect x="14" y="8" width="12" height="10" fill="#C77DFF" />
        <rect x="16" y="10" width="8" height="6" fill="#FFD166" />
        <rect x="18" y="11" width="4" height="4" fill="#FFFFFF" />
        {/* Flame Tongues & Star Runes */}
        <rect x="24" y="5" width="6" height="3" fill="#FF7A33" />
        <rect x="26" y="14" width="6" height="3" fill="#FF4D6D" />
        <rect x="19" y="3" width="2" height="4" fill="#FFD166" />
        <rect x="19" y="19" width="2" height="4" fill="#FFD166" />
        <rect x="7" y="17" width="4" height="4" fill="#FF7A33" />
      </g>
    ),
  },
  mage_mirror_veil: {
    artKey: 'mage_mirror_veil',
    label: 'Convergencia Astral',
    renderSvg: () => (
      <g>
        {/* Prismatic Mirror Dome + Orbiting Astral Crystals */}
        <rect x="11" y="3" width="14" height="2" fill="#67E8F9" />
        <rect x="8" y="5" width="3" height="15" fill="#67E8F9" />
        <rect x="25" y="5" width="3" height="15" fill="#67E8F9" />
        <rect x="11" y="20" width="14" height="2" fill="#67E8F9" />
        <rect x="11" y="5" width="14" height="15" fill="#2E1065" />
        <rect x="14" y="7" width="8" height="11" fill="#9B72CF" />
        <rect x="16" y="9" width="4" height="7" fill="#ECFEFF" />
        {/* Orbiting Star Motes */}
        <rect x="4" y="11" width="3" height="3" fill="#FFD166" />
        <rect x="29" y="11" width="3" height="3" fill="#FFD166" />
        <rect x="17" y="1" width="2" height="2" fill="#FFF3C4" />
      </g>
    ),
  },
  rogue_backstab: {
    artKey: 'rogue_backstab',
    label: 'Remate en Penumbra',
    renderSvg: () => (
      <g>
        {/* Twin Shadow Kris Daggers Crossing in Lethal Crimson X-Slash */}
        <rect x="5" y="4" width="5" height="3" fill="#C93B5B" />
        <rect x="9" y="7" width="6" height="3" fill="#FF4D6D" />
        <rect x="14" y="10" width="8" height="4" fill="#FFF3C4" />
        <rect x="21" y="14" width="6" height="3" fill="#FF4D6D" />
        <rect x="26" y="17" width="5" height="3" fill="#C93B5B" />
        {/* Second Crossing Blade */}
        <rect x="26" y="4" width="4" height="3" fill="#CBD5E1" />
        <rect x="21" y="7" width="5" height="3" fill="#E2E8F0" />
        <rect x="10" y="14" width="5" height="3" fill="#94A3B8" />
        <rect x="6" y="17" width="4" height="4" fill="#E7A54A" />
        {/* Blood Drops */}
        <rect x="17" y="4" width="2" height="3" fill="#E11D48" />
        <rect x="17" y="19" width="2" height="4" fill="#E11D48" />
      </g>
    ),
  },
  rogue_smoke_veil: {
    artKey: 'rogue_smoke_veil',
    label: 'Velo de Humo y Apertura',
    renderSvg: () => (
      <g>
        {/* Alchemical Smoke Bomb + Emerald-Violet Stealth Cloud + Poison Needles */}
        <rect x="8" y="11" width="20" height="9" fill="#2E1B3B" />
        <rect x="6" y="14" width="24" height="7" fill="#1F2937" />
        <rect x="11" y="7" width="14" height="7" fill="#374151" />
        {/* Toxic Emerald & Shadow Plumes */}
        <rect x="9" y="9" width="6" height="5" fill="#4ADE80" />
        <rect x="21" y="10" width="6" height="5" fill="#A855F7" />
        <rect x="15" y="5" width="6" height="6" fill="#6EE7B7" />
        {/* Hidden Twin Darts */}
        <rect x="4" y="5" width="6" height="2" fill="#E2E8F0" />
        <rect x="26" y="5" width="6" height="2" fill="#4ADE80" />
        <rect x="17" y="14" width="2" height="4" fill="#FFD166" />
      </g>
    ),
  },
  hunter_prey_mark: {
    artKey: 'hunter_prey_mark',
    label: 'Marca de Cazador',
    renderSvg: () => (
      <g>
        {/* Predator Crosshair Reticle + Piercing Tracer Bolt */}
        <rect x="11" y="3" width="14" height="2" fill="#FF4D6D" />
        <rect x="11" y="21" width="14" height="2" fill="#FF4D6D" />
        <rect x="8" y="6" width="2" height="14" fill="#FF4D6D" />
        <rect x="26" y="6" width="2" height="14" fill="#FF4D6D" />
        {/* Crosshair Ticks */}
        <rect x="17" y="1" width="2" height="6" fill="#FFD166" />
        <rect x="17" y="19" width="2" height="6" fill="#FFD166" />
        <rect x="4" y="12" width="6" height="2" fill="#FFD166" />
        <rect x="26" y="12" width="6" height="2" fill="#FFD166" />
        {/* Bullseye Core & Arrowhead */}
        <rect x="14" y="9" width="8" height="8" fill="#881337" />
        <rect x="16" y="11" width="4" height="4" fill="#FFF3C4" />
        <rect x="12" y="12" width="12" height="2" fill="#4ADE80" />
      </g>
    ),
  },
  hunter_silver_volley: {
    artKey: 'hunter_silver_volley',
    label: 'Salva de Acecho',
    renderSvg: () => (
      <g>
        {/* Triple Silver Arbalest Bolts Raining Downward */}
        {/* Bolt 1 (Left) */}
        <rect x="6" y="3" width="2" height="11" fill="#94A3B8" />
        <rect x="5" y="13" width="4" height="4" fill="#E2E8F0" />
        <rect x="6" y="17" width="2" height="3" fill="#FFFFFF" />
        {/* Bolt 2 (Center Lead) */}
        <rect x="17" y="2" width="2" height="13" fill="#E7A54A" />
        <rect x="15" y="14" width="6" height="5" fill="#FFF3C4" />
        <rect x="17" y="19" width="2" height="4" fill="#FFFFFF" />
        <rect x="15" y="2" width="6" height="2" fill="#5EA87A" />
        {/* Bolt 3 (Right) */}
        <rect x="28" y="3" width="2" height="11" fill="#94A3B8" />
        <rect x="27" y="13" width="4" height="4" fill="#E2E8F0" />
        <rect x="28" y="17" width="2" height="3" fill="#FFFFFF" />
        {/* Wind Streaks */}
        <rect x="11" y="6" width="2" height="8" fill="#67E8F9" opacity="0.75" />
        <rect x="23" y="6" width="2" height="8" fill="#67E8F9" opacity="0.75" />
      </g>
    ),
  },
  cleric_reliquary_light: {
    artKey: 'cleric_reliquary_light',
    label: 'Luz del Relicario',
    renderSvg: () => (
      <g>
        {/* Sacred Golden Reliquary Lantern + Healing Crosses */}
        <rect x="15" y="2" width="6" height="2" fill="#E7A54A" />
        <rect x="12" y="5" width="12" height="14" fill="#B45309" />
        <rect x="14" y="7" width="8" height="10" fill="#FFD166" />
        <rect x="16" y="8" width="4" height="8" fill="#FFFFFF" />
        <rect x="10" y="19" width="16" height="3" fill="#E7A54A" />
        {/* Emerald & Gold Restoration Crosses */}
        <rect x="5" y="7" width="2" height="6" fill="#4ADE80" />
        <rect x="3" y="9" width="6" height="2" fill="#4ADE80" />
        <rect x="29" y="7" width="2" height="6" fill="#4ADE80" />
        <rect x="27" y="9" width="6" height="2" fill="#4ADE80" />
      </g>
    ),
  },
  cleric_dawn_judgment: {
    artKey: 'cleric_dawn_judgment',
    label: 'Juicio del Alba',
    renderSvg: () => (
      <g>
        {/* Descending Pillar of Solar Fire + Winged Halo */}
        <rect x="6" y="4" width="24" height="3" fill="#E7A54A" />
        <rect x="10" y="2" width="16" height="3" fill="#FFD166" />
        <rect x="13" y="5" width="10" height="18" fill="#F59E0B" />
        <rect x="15" y="5" width="6" height="18" fill="#FEF08A" />
        <rect x="17" y="5" width="2" height="18" fill="#FFFFFF" />
        {/* Ground Sunburst Impact */}
        <rect x="8" y="20" width="20" height="3" fill="#FFD166" />
        <rect x="5" y="17" width="4" height="3" fill="#FF7A33" />
        <rect x="27" y="17" width="4" height="3" fill="#FF7A33" />
      </g>
    ),
  },
  alchemist_vital_elixir: {
    artKey: 'alchemist_vital_elixir',
    label: 'Elixir Transmutado',
    renderSvg: () => (
      <g>
        {/* Ornate Panacea Alembic Flask + Rising Emerald Vitality Crosses */}
        <rect x="15" y="2" width="6" height="3" fill="#E7A54A" />
        <rect x="16" y="5" width="4" height="4" fill="#CBD5E1" />
        <rect x="11" y="9" width="14" height="13" fill="#064E3B" />
        <rect x="13" y="11" width="10" height="9" fill="#10B981" />
        <rect x="15" y="13" width="6" height="6" fill="#A7F3D0" />
        <rect x="17" y="12" width="2" height="6" fill="#FFFFFF" />
        <rect x="15" y="14" width="6" height="2" fill="#FFFFFF" />
        {/* Rising Vapor & Gold Catalyst */}
        <rect x="6" y="6" width="3" height="3" fill="#4ADE80" />
        <rect x="27" y="6" width="3" height="3" fill="#FFD166" />
        <rect x="5" y="14" width="3" height="3" fill="#6EE7B7" />
        <rect x="28" y="14" width="3" height="3" fill="#6EE7B7" />
      </g>
    ),
  },
  alchemist_vitriol_flask: {
    artKey: 'alchemist_vitriol_flask',
    label: 'Reacción de Vitriolo',
    renderSvg: () => (
      <g>
        {/* Shattering Acid Vial + Volatile Green/Orange Explosion */}
        <rect x="12" y="7" width="12" height="12" fill="#15803D" />
        <rect x="14" y="9" width="8" height="8" fill="#84CC16" />
        <rect x="16" y="11" width="4" height="4" fill="#ECFCCB" />
        {/* Corrosive Acid Splashes & Glass Shards */}
        <rect x="6" y="4" width="4" height="4" fill="#A3E635" />
        <rect x="26" y="4" width="4" height="4" fill="#FF7A33" />
        <rect x="4" y="12" width="5" height="3" fill="#4ADE80" />
        <rect x="27" y="12" width="5" height="3" fill="#4ADE80" />
        <rect x="8" y="19" width="20" height="3" fill="#65A30D" />
        <rect x="11" y="21" width="14" height="2" fill="#BEF264" />
      </g>
    ),
  },
  barbarian_brutal_cleave: {
    artKey: 'barbarian_brutal_cleave',
    label: 'Hachazo Brutal',
    renderSvg: () => (
      <g>
        {/* Double-Bitted Barbaric Greataxe + Crimson Fury Cleave Arc */}
        <rect x="4" y="14" width="28" height="4" fill="#C93B5B" />
        <rect x="6" y="16" width="24" height="3" fill="#FF7A33" />
        <rect x="9" y="17" width="18" height="2" fill="#FFD166" />
        {/* Greataxe Head & Shaft */}
        <rect x="17" y="3" width="3" height="19" fill="#78350F" />
        <rect x="9" y="4" width="8" height="10" fill="#94A3B8" />
        <rect x="20" y="4" width="8" height="10" fill="#CBD5E1" />
        <rect x="7" y="5" width="3" height="8" fill="#F8FAFC" />
        <rect x="27" y="5" width="3" height="8" fill="#E11D48" />
      </g>
    ),
  },
  barbarian_war_cry: {
    artKey: 'barbarian_war_cry',
    label: 'Grito de Guerra y Sangre',
    renderSvg: () => (
      <g>
        {/* Horned Berserker Crest + Concentric Fury Shockwaves */}
        <rect x="3" y="6" width="3" height="14" fill="#FF4D6D" />
        <rect x="30" y="6" width="3" height="14" fill="#FF4D6D" />
        <rect x="7" y="4" width="2" height="18" fill="#FF7A33" />
        <rect x="27" y="4" width="2" height="18" fill="#FF7A33" />
        {/* Horned Skull / Helm Core */}
        <rect x="10" y="4" width="3" height="5" fill="#D8C6A0" />
        <rect x="23" y="4" width="3" height="5" fill="#D8C6A0" />
        <rect x="12" y="7" width="12" height="12" fill="#B91C1C" />
        <rect x="14" y="9" width="8" height="8" fill="#FFD166" />
        <rect x="15" y="11" width="2" height="2" fill="#FFFFFF" />
        <rect x="19" y="11" width="2" height="2" fill="#FFFFFF" />
        <rect x="15" y="15" width="6" height="3" fill="#450A0A" />
      </g>
    ),
  },
  barbarian_bonebreaker: {
    artKey: 'barbarian_bonebreaker',
    label: 'Quebrantahuesos',
    renderSvg: () => (
      <g>
        {/* Colossal Iron Maul Crushing Skull & Stone Ground */}
        <rect x="17" y="1" width="2" height="10" fill="#78350F" />
        <rect x="10" y="5" width="16" height="8" fill="#475569" />
        <rect x="12" y="6" width="12" height="6" fill="#94A3B8" />
        <rect x="14" y="11" width="8" height="2" fill="#FF7A33" />
        {/* Cracked Skull & Magma Ground Fissure */}
        <rect x="13" y="14" width="10" height="6" fill="#E2E8F0" />
        <rect x="17" y="14" width="2" height="6" fill="#C93B5B" />
        <rect x="4" y="20" width="28" height="3" fill="#E11D48" />
        <rect x="8" y="21" width="20" height="2" fill="#FFD166" />
        <rect x="5" y="14" width="4" height="3" fill="#FFD166" />
        <rect x="27" y="14" width="4" height="3" fill="#FFD166" />
      </g>
    ),
  },
  bard_dissonant_chord: {
    artKey: 'bard_dissonant_chord',
    label: 'Acorde Disonante',
    renderSvg: () => (
      <g>
        {/* Arcane Lute Resonator + Jagged Sonic Shockwave Rings */}
        <rect x="5" y="11" width="10" height="8" fill="#B45309" />
        <rect x="7" y="13" width="6" height="4" fill="#F59E0B" />
        <rect x="15" y="9" width="8" height="3" fill="#78350F" />
        {/* Dissonant Sonic Waves & Eighth Notes */}
        <rect x="22" y="4" width="2" height="18" fill="#C084FC" />
        <rect x="26" y="6" width="2" height="14" fill="#F43F5E" />
        <rect x="30" y="8" width="2" height="10" fill="#FFD166" />
        <rect x="14" y="3" width="4" height="4" fill="#2DD4BF" />
        <rect x="17" y="1" width="2" height="5" fill="#2DD4BF" />
      </g>
    ),
  },
  bard_valor_ballad: {
    artKey: 'bard_valor_ballad',
    label: 'Balada de Tempo y Valor',
    renderSvg: () => (
      <g>
        {/* Golden Harmonic Lyre + Rising Teal & Gold Musical Notes */}
        <rect x="12" y="6" width="3" height="13" fill="#F59E0B" />
        <rect x="21" y="6" width="3" height="13" fill="#F59E0B" />
        <rect x="12" y="18" width="12" height="3" fill="#FFD166" />
        <rect x="16" y="7" width="1" height="11" fill="#67E8F9" />
        <rect x="18" y="7" width="1" height="11" fill="#FFF3C4" />
        <rect x="20" y="7" width="1" height="11" fill="#67E8F9" />
        {/* Musical Notes */}
        <rect x="5" y="9" width="4" height="3" fill="#2DD4BF" />
        <rect x="8" y="4" width="2" height="6" fill="#2DD4BF" />
        <rect x="27" y="10" width="4" height="3" fill="#FFD166" />
        <rect x="30" y="5" width="2" height="6" fill="#FFD166" />
      </g>
    ),
  },
  bard_eclipse_coda: {
    artKey: 'bard_eclipse_coda',
    label: 'Coda del Eclipse',
    renderSvg: () => (
      <g>
        {/* Solar-Lunar Eclipse Corona + Harmonic Staff Lines */}
        <rect x="3" y="9" width="30" height="1" fill="#2DD4BF" />
        <rect x="3" y="13" width="30" height="1" fill="#FFD166" />
        <rect x="3" y="17" width="30" height="1" fill="#C084FC" />
        {/* Eclipse Sun/Moon Core */}
        <rect x="11" y="5" width="14" height="16" fill="#F59E0B" />
        <rect x="13" y="7" width="10" height="12" fill="#1E1B4B" />
        <rect x="20" y="8" width="3" height="10" fill="#FEF08A" />
        {/* Exploding Tempo Stars */}
        <rect x="6" y="4" width="3" height="3" fill="#67E8F9" />
        <rect x="27" y="4" width="3" height="3" fill="#FFD166" />
        <rect x="6" y="19" width="3" height="3" fill="#FFD166" />
        <rect x="27" y="19" width="3" height="3" fill="#67E8F9" />
      </g>
    ),
  },
  necromancer_soul_drain: {
    artKey: 'necromancer_soul_drain',
    label: 'Drenaje de Almas',
    renderSvg: () => (
      <g>
        {/* Spectral Bone Claw Siphoning Cyan-Crimson Soul Essence */}
        <rect x="5" y="6" width="8" height="3" fill="#E2E8F0" />
        <rect x="5" y="11" width="9" height="3" fill="#E2E8F0" />
        <rect x="5" y="16" width="8" height="3" fill="#E2E8F0" />
        {/* Soul Essence Stream & Orb */}
        <rect x="14" y="10" width="8" height="4" fill="#A855F7" />
        <rect x="16" y="11" width="6" height="2" fill="#4ADE80" />
        <rect x="22" y="6" width="9" height="12" fill="#68D391" />
        <rect x="24" y="8" width="5" height="8" fill="#ECFEFF" />
        <rect x="25" y="10" width="3" height="4" fill="#C93B5B" />
      </g>
    ),
  },
  necromancer_bone_pact: {
    artKey: 'necromancer_bone_pact',
    label: 'Pacto de Hueso y Ceniza',
    renderSvg: () => (
      <g>
        {/* Ritual Ossuary Ribcage Shield + Crimson Blood Sacrifice Drop */}
        <rect x="13" y="4" width="10" height="8" fill="#E2E8F0" />
        <rect x="15" y="6" width="2" height="2" fill="#9333EA" />
        <rect x="19" y="6" width="2" height="2" fill="#9333EA" />
        {/* Bone Ribs Wrapping Around Party */}
        <rect x="8" y="13" width="20" height="2" fill="#CBD5E1" />
        <rect x="10" y="17" width="16" height="2" fill="#CBD5E1" />
        <rect x="17" y="12" width="2" height="10" fill="#F8FAFC" />
        {/* Blood Drop & Soul Flames */}
        <rect x="17" y="1" width="2" height="3" fill="#E11D48" />
        <rect x="5" y="8" width="3" height="6" fill="#68D391" />
        <rect x="28" y="8" width="3" height="6" fill="#68D391" />
      </g>
    ),
  },
  necromancer_corpse_explosion: {
    artKey: 'necromancer_corpse_explosion',
    label: 'Detonación Sepulcral',
    renderSvg: () => (
      <g>
        {/* Erupting Ossuary Skull + Necrotic Emerald & Violet Shockwave */}
        <rect x="9" y="5" width="18" height="16" fill="#581C87" />
        <rect x="12" y="7" width="12" height="11" fill="#4ADE80" />
        <rect x="14" y="9" width="8" height="7" fill="#F8FAFC" />
        <rect x="15" y="11" width="2" height="2" fill="#1E1B4B" />
        <rect x="19" y="11" width="2" height="2" fill="#1E1B4B" />
        {/* Flying Bone Shards */}
        <rect x="4" y="3" width="4" height="3" fill="#E2E8F0" />
        <rect x="28" y="3" width="4" height="3" fill="#E2E8F0" />
        <rect x="3" y="17" width="5" height="3" fill="#A855F7" />
        <rect x="28" y="17" width="5" height="3" fill="#A855F7" />
        <rect x="16" y="1" width="4" height="4" fill="#86EFAC" />
      </g>
    ),
  },
  // Weapon Attack & Special Action Overlays
  weapon_attack_sword: {
    artKey: 'weapon_attack_sword',
    label: 'Tajo de Espada',
    renderSvg: () => (
      <g>
        <rect x="4" y="18" width="8" height="2" fill="#C93B5B" />
        <rect x="10" y="14" width="10" height="2" fill="#FF4D6D" />
        <rect x="18" y="9" width="10" height="2" fill="#FFD166" />
        <rect x="24" y="5" width="8" height="2" fill="#FFF3C4" />
      </g>
    ),
  },
  weapon_attack_axe: {
    artKey: 'weapon_attack_axe',
    label: 'Hachazo Desgarrador',
    renderSvg: () => (
      <g>
        <rect x="4" y="6" width="28" height="3" fill="#FF7A33" />
        <rect x="8" y="17" width="20" height="2" fill="#C93B5B" />
      </g>
    ),
  },
  weapon_attack_mace: {
    artKey: 'weapon_attack_mace',
    label: 'Golpe Contundente',
    renderSvg: () => (
      <g>
        <rect x="6" y="19" width="24" height="3" fill="#E7A54A" />
        <rect x="4" y="14" width="4" height="4" fill="#FFD166" />
        <rect x="28" y="14" width="4" height="4" fill="#FFD166" />
      </g>
    ),
  },
  weapon_attack_dagger: {
    artKey: 'weapon_attack_dagger',
    label: 'Punzón Rápido',
    renderSvg: () => (
      <g>
        <rect x="4" y="12" width="28" height="2" fill="#FF4D6D" />
        <rect x="26" y="9" width="4" height="8" fill="#FFF3C4" />
      </g>
    ),
  },
  weapon_attack_bow: {
    artKey: 'weapon_attack_bow',
    label: 'Disparo de Arco',
    renderSvg: () => (
      <g>
        <rect x="3" y="12" width="30" height="2" fill="#8EE6AE" />
        <rect x="27" y="9" width="5" height="8" fill="#FFF3C4" />
      </g>
    ),
  },
  weapon_attack_crossbow: {
    artKey: 'weapon_attack_crossbow',
    label: 'Virote Pesado',
    renderSvg: () => (
      <g>
        <rect x="3" y="11" width="30" height="3" fill="#FFD166" />
        <rect x="26" y="8" width="6" height="9" fill="#FF7A33" />
      </g>
    ),
  },
  weapon_attack_staff: {
    artKey: 'weapon_attack_staff',
    label: 'Descarga de Báculo',
    renderSvg: () => (
      <g>
        <rect x="5" y="5" width="4" height="4" fill="#C084FC" />
        <rect x="27" y="5" width="4" height="4" fill="#67E8F9" />
        <rect x="5" y="17" width="4" height="4" fill="#67E8F9" />
        <rect x="27" y="17" width="4" height="4" fill="#C084FC" />
      </g>
    ),
  },
  weapon_attack_alchemy: {
    artKey: 'weapon_attack_alchemy',
    label: 'Disparo Alquímico',
    renderSvg: () => (
      <g>
        <rect x="4" y="7" width="4" height="4" fill="#4ADE80" />
        <rect x="28" y="7" width="4" height="4" fill="#A3E635" />
        <rect x="6" y="18" width="24" height="2" fill="#10B981" />
      </g>
    ),
  },
  weapon_attack_instrument: {
    artKey: 'weapon_attack_instrument',
    label: 'Pulso Armónico',
    renderSvg: () => (
      <g>
        <rect x="4" y="8" width="3" height="10" fill="#2DD4BF" />
        <rect x="29" y="8" width="3" height="10" fill="#FFD166" />
      </g>
    ),
  },
  weapon_attack_scythe: {
    artKey: 'weapon_attack_scythe',
    label: 'Corte de Guadaña',
    renderSvg: () => (
      <g>
        <rect x="4" y="5" width="28" height="2" fill="#A855F7" />
        <rect x="6" y="19" width="24" height="2" fill="#4ADE80" />
      </g>
    ),
  },
  weapon_attack_halberd: {
    artKey: 'weapon_attack_halberd',
    label: 'Estocada de Alabarda',
    renderSvg: () => (
      <g>
        <rect x="3" y="12" width="30" height="2" fill="#FFD166" />
        <rect x="25" y="6" width="6" height="14" fill="#F8FAFC" />
      </g>
    ),
  },
  weapon_attack_pickaxe: {
    artKey: 'weapon_attack_pickaxe',
    label: 'Impacto de Pico',
    renderSvg: () => (
      <g>
        <rect x="6" y="18" width="24" height="3" fill="#38BDF8" />
        <rect x="16" y="2" width="4" height="6" fill="#FFD166" />
      </g>
    ),
  },
  weapon_attack_tome: {
    artKey: 'weapon_attack_tome',
    label: 'Salmo Arcano',
    renderSvg: () => (
      <g>
        <rect x="4" y="4" width="4" height="18" fill="#FFD166" />
        <rect x="28" y="4" width="4" height="18" fill="#C084FC" />
      </g>
    ),
  },
  weapon_special_sword: {
    artKey: 'weapon_special_sword',
    label: 'Técnica de Espada',
    renderSvg: () => (
      <g>
        <rect x="2" y="9" width="32" height="3" fill="#FFD166" />
        <rect x="5" y="15" width="26" height="2" fill="#FF4D6D" />
        <rect x="16" y="2" width="4" height="22" fill="#FFF3C4" opacity="0.7" />
      </g>
    ),
  },
  weapon_special_axe: {
    artKey: 'weapon_special_axe',
    label: 'Técnica de Hacha',
    renderSvg: () => (
      <g>
        <rect x="2" y="6" width="32" height="4" fill="#FF7A33" />
        <rect x="4" y="16" width="28" height="3" fill="#FFD166" />
      </g>
    ),
  },
  weapon_special_mace: {
    artKey: 'weapon_special_mace',
    label: 'Técnica de Maza',
    renderSvg: () => (
      <g>
        <rect x="15" y="1" width="6" height="24" fill="#FFD166" opacity="0.75" />
        <rect x="4" y="18" width="28" height="4" fill="#FFF3C4" />
      </g>
    ),
  },
  weapon_special_dagger: {
    artKey: 'weapon_special_dagger',
    label: 'Técnica de Dagas',
    renderSvg: () => (
      <g>
        <rect x="4" y="5" width="28" height="2" fill="#FF4D6D" />
        <rect x="4" y="19" width="28" height="2" fill="#4ADE80" />
        <rect x="16" y="2" width="4" height="22" fill="#FFD166" opacity="0.65" />
      </g>
    ),
  },
  weapon_special_bow: {
    artKey: 'weapon_special_bow',
    label: 'Lluvia de Flechas',
    renderSvg: () => (
      <g>
        <rect x="5" y="3" width="2" height="20" fill="#8EE6AE" />
        <rect x="17" y="1" width="2" height="24" fill="#FFD166" />
        <rect x="29" y="3" width="2" height="20" fill="#8EE6AE" />
      </g>
    ),
  },
  weapon_special_crossbow: {
    artKey: 'weapon_special_crossbow',
    label: 'Andanada de Asedio',
    renderSvg: () => (
      <g>
        <rect x="2" y="8" width="32" height="3" fill="#FF7A33" />
        <rect x="2" y="15" width="32" height="3" fill="#FFD166" />
      </g>
    ),
  },
  weapon_special_staff: {
    artKey: 'weapon_special_staff',
    label: 'Cadena Arcana',
    renderSvg: () => (
      <g>
        <rect x="3" y="4" width="30" height="2" fill="#C084FC" />
        <rect x="3" y="20" width="30" height="2" fill="#67E8F9" />
        <rect x="3" y="6" width="2" height="14" fill="#FFD166" />
        <rect x="31" y="6" width="2" height="14" fill="#FFD166" />
      </g>
    ),
  },
  weapon_special_alchemy: {
    artKey: 'weapon_special_alchemy',
    label: 'Frasco Explosivo',
    renderSvg: () => (
      <g>
        <rect x="3" y="4" width="6" height="6" fill="#4ADE80" />
        <rect x="27" y="4" width="6" height="6" fill="#FF7A33" />
        <rect x="4" y="18" width="28" height="4" fill="#84CC16" />
      </g>
    ),
  },
  weapon_special_instrument: {
    artKey: 'weapon_special_instrument',
    label: 'Sinfonía Resonante',
    renderSvg: () => (
      <g>
        <rect x="2" y="6" width="32" height="2" fill="#2DD4BF" />
        <rect x="2" y="18" width="32" height="2" fill="#FFD166" />
      </g>
    ),
  },
  weapon_special_scythe: {
    artKey: 'weapon_special_scythe',
    label: 'Siega de Almas',
    renderSvg: () => (
      <g>
        <rect x="2" y="4" width="32" height="3" fill="#9333EA" />
        <rect x="4" y="19" width="28" height="3" fill="#4ADE80" />
      </g>
    ),
  },
  weapon_special_halberd: {
    artKey: 'weapon_special_halberd',
    label: 'Barrido del Bastión',
    renderSvg: () => (
      <g>
        <rect x="2" y="4" width="32" height="3" fill="#FFD166" />
        <rect x="4" y="19" width="28" height="3" fill="#69A8A5" />
      </g>
    ),
  },
  weapon_special_pickaxe: {
    artKey: 'weapon_special_pickaxe',
    label: 'Golpe Sísmico',
    renderSvg: () => (
      <g>
        <rect x="2" y="18" width="32" height="4" fill="#F59E0B" />
        <rect x="8" y="4" width="4" height="6" fill="#38BDF8" />
        <rect x="24" y="4" width="4" height="6" fill="#38BDF8" />
      </g>
    ),
  },
  weapon_special_tome: {
    artKey: 'weapon_special_tome',
    label: 'Milagro del Códice',
    renderSvg: () => (
      <g>
        <rect x="3" y="3" width="30" height="2" fill="#FFD166" />
        <rect x="3" y="21" width="30" height="2" fill="#FFD166" />
      </g>
    ),
  },
};

export function resolveWeaponCombatArtKey(
  weaponId?: CriptaWeaponId,
  mode: 'ATTACK' | 'SPECIAL' | boolean = 'ATTACK',
  _fallbackDamageType?: string
): CriptaCombatCardArtKey {
  const isSpecial = mode === 'SPECIAL' || mode === true;
  const prefix = isSpecial ? 'weapon_special_' : 'weapon_attack_';
  switch (weaponId) {
    case 'hacha_forja_infernal':
    case 'gran_hacha_barbara':
      return `${prefix}axe` as CriptaCombatCardArtKey;
    case 'maza_consagrada':
    case 'martillo_del_juicio':
    case 'mazo_colosal_rompecraneos':
    case 'simbolo_del_alba':
      return `${prefix}mace` as CriptaCombatCardArtKey;
    case 'dagas_melladas':
    case 'hojas_colmillo_venenoso':
    case 'estoque_carmesi':
    case 'dagas_sombra_nocturna':
      return `${prefix}dagger` as CriptaCombatCardArtKey;
    case 'arco_cazador':
    case 'arco_de_espinas':
      return `${prefix}bow` as CriptaCombatCardArtKey;
    case 'ballesta_de_asedio':
    case 'canon_de_azufre':
      return `${prefix}crossbow` as CriptaCombatCardArtKey;
    case 'baston_ceniza':
    case 'vara_de_cristal_astral':
    case 'cetro_del_eclipse':
      return `${prefix}staff` as CriptaCombatCardArtKey;
    case 'lanzador_alquimico':
    case 'catalizador_esporas':
    case 'guantelete_mutageno':
      return `${prefix}alchemy` as CriptaCombatCardArtKey;
    case 'laud_resonancia_arcana':
    case 'viola_del_eclipse':
      return `${prefix}instrument` as CriptaCombatCardArtKey;
    case 'guadana_de_hueso':
    case 'guadana_del_verdugo':
      return `${prefix}scythe` as CriptaCombatCardArtKey;
    case 'alabarda_del_juramento':
      return `${prefix}halberd` as CriptaCombatCardArtKey;
    case 'pico_de_minero_runico':
      return `${prefix}pickaxe` as CriptaCombatCardArtKey;
    case 'grimorio_prohibido_arma':
    case 'grimorio_sepulcral':
    case 'relicario_serafin':
      return `${prefix}tome` as CriptaCombatCardArtKey;
    case 'espada_oxidada':
    case 'espada_del_sepulcro':
    case 'espadon_del_rey_hundido':
    case 'espada_bastarda_real':
    default:
      return `${prefix}sword` as CriptaCombatCardArtKey;
  }
}

export const LaCriptaCombatCardArtwork: React.FC<{
  cardId: string;
  artKey?: string;
  weaponId?: CriptaWeaponId;
  upgradeLevel?: number;
  isWeaponSpecial?: boolean;
}> = ({ cardId, artKey, weaponId, upgradeLevel = 1, isWeaponSpecial = false }) => {
  const resolvedKey = (artKey ||
    (weaponId
      ? resolveWeaponCombatArtKey(weaponId, isWeaponSpecial ? 'SPECIAL' : 'ATTACK')
      : 'common_iron_guard')) as CriptaCombatCardArtKey;

  const entry = combatCardArtRegistry[resolvedKey];

  if (!entry && import.meta.env.DEV) {
    console.warn(
      '[La Cripta] Missing combat card artwork:',
      cardId,
      artKey
    );
  }

  // When the action comes from an equipped weapon, show the actual equipped weapon sprite
  // paired with its distinct attack/special action effect so weapon identity is always preserved!
  if (weaponId) {
    return (
      <div className="relative flex items-center justify-center w-full h-full">
        {entry && (
          <svg
            viewBox="0 0 36 26"
            shapeRendering="crispEdges"
            className={`pointer-events-none absolute inset-0 w-full h-full select-none ${
              isWeaponSpecial ? 'opacity-95' : 'opacity-70'
            }`}
          >
            {entry.renderSvg()}
          </svg>
        )}
        <div
          className={`relative z-10 flex items-center justify-center ${
            isWeaponSpecial ? 'scale-110 -rotate-6' : ''
          }`}
        >
          <LaCriptaWeaponPixelIcon
            weaponId={weaponId}
            upgradeLevel={upgradeLevel}
            size={56}
          />
        </div>
      </div>
    );
  }

  const safeEntry = entry || combatCardArtRegistry.common_iron_guard;
  return (
    <svg
      viewBox="0 0 36 26"
      shapeRendering="crispEdges"
      className="w-full h-full max-w-[116px] max-h-[80px] select-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.85)]"
    >
      {safeEntry.renderSvg()}
    </svg>
  );
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
  weaponId?: CriptaWeaponId;
  armorId?: CriptaArmorId;
  accessoryId?: CriptaAccessoryId;
  upgradeLevel?: number;
}> = ({
  kind,
  itemId,
  relicId,
  weaponId,
  armorId,
  accessoryId,
  upgradeLevel,
}) => {
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
      weaponId={weaponId}
      armorId={armorId}
      accessoryId={accessoryId}
      upgradeLevel={upgradeLevel}
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

type CriptaParticleShape =
  | 'pixel_dust'
  | 'bone_speck'
  | 'candle_mote'
  | 'spore_orb'
  | 'firefly'
  | 'ember'
  | 'spark'
  | 'pixel_bubble'
  | 'snowflake'
  | 'ice_crystal'
  | 'magic_mote'
  | 'crystal_shard'
  | 'pixel_leaf'
  | 'drip_streak'
  | 'void_fragment';

type CriptaParticleMotionProfile =
  | 'CATACOMBS_DUST_AND_CANDLES'
  | 'GARDEN_SPORES_AND_FIREFLIES'
  | 'FORGE_EMBERS_AND_SPARKS'
  | 'SUNKEN_BUBBLES_AND_CAUSTICS'
  | 'FROZEN_SNOW_AND_ICE'
  | 'ARCANE_ORBITAL_MOTES'
  | 'CRYSTAL_SHIMMER_DUST'
  | 'FOREST_LEAVES_AND_FIREFLIES'
  | 'MIASMA_BUBBLES_AND_DRIPS'
  | 'DRIFTING_ASH_AND_SAND'
  | 'ABYSS_VOID_FRAGMENTS';

interface CriptaAmbientParticleInstance {
  x: number;
  y: number;
  vx: number;
  vy: number;
  swayAmpX: number;
  swayAmpY: number;
  swayFreq: number;
  swayPhase: number;
  pulseFreq: number;
  pulsePhase: number;
  baseAlpha: number;
  size: number;
  color: string;
  secondaryColor: string;
  shape: CriptaParticleShape;
  rotSpeed: number;
  rotPhase: number;
}

function getBiomeMotionProfile(dungeonId?: string): CriptaParticleMotionProfile {
  switch (dungeonId) {
    case 'jardin_podrido':
      return 'GARDEN_SPORES_AND_FIREFLIES';
    case 'forja_infernal':
    case 'fortaleza_goblin':
      return 'FORGE_EMBERS_AND_SPARKS';
    case 'templo_sumergido':
      return 'SUNKEN_BUBBLES_AND_CAUSTICS';
    case 'cavernas_heladas':
      return 'FROZEN_SNOW_AND_ICE';
    case 'biblioteca_prohibida':
    case 'torre_del_astrologo':
      return 'ARCANE_ORBITAL_MOTES';
    case 'cripta_de_cristal':
    case 'palacio_de_los_espejos':
    case 'minas_abandonadas':
      return 'CRYSTAL_SHIMMER_DUST';
    case 'bosque_de_los_susurros':
    case 'la_colmena':
      return 'FOREST_LEAVES_AND_FIREFLIES';
    case 'alcantarillas_imperiales':
    case 'santuario_de_sangre':
      return 'MIASMA_BUBBLES_AND_DRIPS';
    case 'prision_maldita':
    case 'castillo_del_verdugo':
    case 'ciudad_sepultada':
      return 'DRIFTING_ASH_AND_SAND';
    case 'el_abismo':
      return 'ABYSS_VOID_FRAGMENTS';
    case 'catacumbas_del_rey':
    case 'cementerio_de_gigantes':
    default:
      return 'CATACOMBS_DUST_AND_CANDLES';
  }
}

function createBiomeParticle(
  index: number,
  width: number,
  height: number,
  layer: 'far' | 'mid' | 'foreground',
  motionProfile: CriptaParticleMotionProfile,
  palette: CriptaBiomeVisualProfile
): CriptaAmbientParticleInstance {
  // Deterministic-seeded initial distribution mixed with smooth organic variance
  const seedA = ((index * 73 + 19) % 101) / 101;
  const seedB = ((index * 137 + 43) % 107) / 107;
  const seedC = ((index * 211 + 71) % 113) / 113;

  const speedScale = layer === 'far' ? 0.56 : layer === 'mid' ? 1.0 : 1.24;
  const minAlpha =
    layer === 'far' ? 0.12 : layer === 'mid' ? 0.26 : 0.08;
  const maxAlpha =
    layer === 'far' ? 0.28 : layer === 'mid' ? 0.54 : 0.17;
  const baseAlpha = minAlpha + seedA * (maxAlpha - minAlpha);

  const baseSize =
    layer === 'far'
      ? seedB > 0.65
        ? 3
        : 2
      : layer === 'mid'
      ? seedB > 0.72
        ? 4
        : seedB > 0.3
        ? 3
        : 2
      : seedB > 0.5
      ? 4
      : 3;

  const isSecondary = index % 3 === 0;
  const primaryColor = isSecondary ? palette.particleSecondary : palette.particlePrimary;
  const secondaryColor = isSecondary ? palette.particlePrimary : palette.accentPrimary;

  let vx = 0;
  let vy = 0;
  let swayAmpX = 12;
  let swayAmpY = 4;
  let swayFreq = 0.75 + seedC * 0.65;
  let pulseFreq = 1.1 + seedA * 1.2;
  let shape: CriptaParticleShape = 'pixel_dust';
  let rotSpeed = 0;

  switch (motionProfile) {
    case 'GARDEN_SPORES_AND_FIREFLIES': {
      // Spores & fireflies float smoothly upward with wide sinusoidal horizontal drift
      const isFirefly = index % 4 === 0;
      vx = (-6 + seedA * 12) * speedScale;
      vy = (isFirefly ? -7 - seedB * 9 : -10 - seedB * 14) * speedScale;
      swayAmpX = (isFirefly ? 24 : 16) + seedC * 16;
      swayAmpY = isFirefly ? 10 + seedA * 8 : 4;
      swayFreq = 0.55 + seedB * 0.65;
      pulseFreq = isFirefly ? 1.8 + seedC * 1.4 : 1.0 + seedA * 0.9;
      shape = isFirefly ? 'firefly' : 'spore_orb';
      break;
    }
    case 'FORGE_EMBERS_AND_SPARKS': {
      // Embers & sparks rise rapidly upward with thermal diagonal drafts
      const isSpark = index % 4 === 0;
      vx = (8 + seedA * 18) * speedScale;
      vy = (isSpark ? -34 - seedB * 26 : -18 - seedB * 22) * speedScale;
      swayAmpX = 10 + seedC * 14;
      swayAmpY = 3 + seedA * 4;
      swayFreq = 1.35 + seedB * 1.2;
      pulseFreq = 2.2 + seedC * 1.8;
      shape = isSpark ? 'spark' : 'ember';
      break;
    }
    case 'SUNKEN_BUBBLES_AND_CAUSTICS': {
      // Bubbles rise gently upward with classic aquatic side-to-side wobble
      const isBubble = index % 3 !== 0;
      vx = (-4 + seedA * 8) * speedScale;
      vy = (isBubble ? -14 - seedB * 16 : -5 + seedB * 8) * speedScale;
      swayAmpX = 12 + seedC * 12;
      swayAmpY = 5 + seedA * 5;
      swayFreq = 1.0 + seedB * 0.85;
      pulseFreq = 1.2 + seedC * 0.9;
      shape = isBubble ? 'pixel_bubble' : 'magic_mote';
      break;
    }
    case 'FROZEN_SNOW_AND_ICE': {
      // Smooth diagonal snowfall and glinting ice crystals
      const isCrystal = index % 4 === 0;
      vx = (-14 - seedA * 16) * speedScale;
      vy = (isCrystal ? 12 + seedB * 14 : 20 + seedB * 22) * speedScale;
      swayAmpX = 14 + seedC * 14;
      swayAmpY = 3 + seedA * 4;
      swayFreq = 0.85 + seedB * 0.7;
      pulseFreq = isCrystal ? 2.4 + seedC * 1.6 : 1.1 + seedA * 0.7;
      shape = isCrystal ? 'ice_crystal' : 'snowflake';
      break;
    }
    case 'ARCANE_ORBITAL_MOTES': {
      // Weightless floating arcane motes & paper dust
      const isStar = index % 3 === 0;
      vx = (-6 + seedA * 12) * speedScale;
      vy = (-8 + seedB * 11) * speedScale;
      swayAmpX = 18 + seedC * 18;
      swayAmpY = 12 + seedA * 12;
      swayFreq = 0.6 + seedB * 0.55;
      pulseFreq = 1.5 + seedC * 1.4;
      shape = isStar ? 'magic_mote' : 'candle_mote';
      break;
    }
    case 'CRYSTAL_SHIMMER_DUST': {
      // Suspended crystal particles with slow drift and periodic twinkle
      vx = (-5 + seedA * 10) * speedScale;
      vy = (-7 + seedB * 10) * speedScale;
      swayAmpX = 12 + seedC * 14;
      swayAmpY = 9 + seedA * 9;
      swayFreq = 0.5 + seedB * 0.5;
      pulseFreq = 2.0 + seedC * 1.8;
      shape = index % 2 === 0 ? 'crystal_shard' : 'ice_crystal';
      break;
    }
    case 'FOREST_LEAVES_AND_FIREFLIES': {
      // Small pixel leaves drifting diagonally downward with pendulum sway + rising fireflies
      const isLeaf = index % 3 !== 0;
      vx = (isLeaf ? 10 + seedA * 14 : -6 + seedA * 12) * speedScale;
      vy = (isLeaf ? 11 + seedB * 14 : -9 - seedB * 10) * speedScale;
      swayAmpX = (isLeaf ? 22 : 16) + seedC * 16;
      swayAmpY = 6 + seedA * 6;
      swayFreq = 0.7 + seedB * 0.6;
      pulseFreq = isLeaf ? 0.9 + seedC * 0.6 : 1.9 + seedC * 1.3;
      shape = isLeaf ? 'pixel_leaf' : 'firefly';
      rotSpeed = isLeaf ? (seedA > 0.5 ? 0.8 : -0.8) : 0;
      break;
    }
    case 'MIASMA_BUBBLES_AND_DRIPS': {
      // Rising miasma/blood bubbles + occasional smooth liquid droplets falling
      const isDrip = index % 5 === 0 && layer !== 'foreground';
      vx = (isDrip ? 0 : -5 + seedA * 10) * speedScale;
      vy = (isDrip ? 36 + seedB * 24 : -11 - seedB * 14) * speedScale;
      swayAmpX = isDrip ? 1.5 : 13 + seedC * 12;
      swayAmpY = isDrip ? 0 : 4 + seedA * 4;
      swayFreq = 0.85 + seedB * 0.7;
      pulseFreq = 1.3 + seedC * 1.1;
      shape = isDrip ? 'drip_streak' : index % 2 === 0 ? 'pixel_bubble' : 'spore_orb';
      break;
    }
    case 'DRIFTING_ASH_AND_SAND': {
      // Wind-carried ash, sand and warm torch embers
      const isEmber = index % 4 === 0;
      vx = (11 + seedA * 16) * speedScale;
      vy = (isEmber ? -14 - seedB * 14 : 6 + seedB * 12) * speedScale;
      swayAmpX = 14 + seedC * 14;
      swayAmpY = 5 + seedA * 5;
      swayFreq = 0.8 + seedB * 0.7;
      pulseFreq = isEmber ? 2.0 + seedC * 1.4 : 1.0 + seedA * 0.8;
      shape = isEmber ? 'ember' : index % 2 === 0 ? 'bone_speck' : 'pixel_dust';
      break;
    }
    case 'ABYSS_VOID_FRAGMENTS': {
      // Anti-gravity rising void fragments and abyssal motes
      const isVoidShard = index % 2 === 0;
      vx = (-8 + seedA * 16) * speedScale;
      vy = (-15 - seedB * 20) * speedScale;
      swayAmpX = 16 + seedC * 18;
      swayAmpY = 7 + seedA * 7;
      swayFreq = 0.75 + seedB * 0.75;
      pulseFreq = 1.6 + seedC * 1.5;
      shape = isVoidShard ? 'void_fragment' : 'magic_mote';
      rotSpeed = isVoidShard ? (seedB > 0.5 ? 0.65 : -0.65) : 0;
      break;
    }
    case 'CATACOMBS_DUST_AND_CANDLES':
    default: {
      // Bone dust & crypt ash drifting gently downward/diagonally + warm candle motes rising
      const isCandleMote = index % 4 === 0;
      vx = (isCandleMote ? -4 + seedA * 8 : 4 + seedA * 9) * speedScale;
      vy = (isCandleMote ? -10 - seedB * 11 : 7 + seedB * 11) * speedScale;
      swayAmpX = 12 + seedC * 14;
      swayAmpY = 4 + seedA * 4;
      swayFreq = 0.55 + seedB * 0.55;
      pulseFreq = isCandleMote ? 1.7 + seedC * 1.2 : 0.95 + seedA * 0.7;
      shape = isCandleMote
        ? 'candle_mote'
        : index % 2 === 0
        ? 'bone_speck'
        : 'pixel_dust';
      break;
    }
  }

  return {
    x: seedA * width,
    y: seedB * height,
    vx,
    vy,
    swayAmpX,
    swayAmpY,
    swayFreq,
    swayPhase: seedC * Math.PI * 2,
    pulseFreq,
    pulsePhase: seedA * Math.PI * 2,
    baseAlpha,
    size: baseSize,
    color: primaryColor,
    secondaryColor,
    shape,
    rotSpeed,
    rotPhase: seedB * Math.PI * 2,
  };
}

function drawCrispPixelParticle(
  ctx: CanvasRenderingContext2D,
  p: CriptaAmbientParticleInstance,
  x: number,
  y: number,
  alpha: number,
  timeSec: number
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.translate(x, y);
  if (p.rotSpeed !== 0) {
    ctx.rotate(p.rotPhase + timeSec * p.rotSpeed);
  }

  const s = p.size;
  const half = -s * 0.5;

  switch (p.shape) {
    case 'spore_orb':
    case 'firefly':
    case 'candle_mote': {
      // Soft outer pixel halo (still crisp pixel geometry) + bright pixel core
      const haloSize = s + 2;
      ctx.globalAlpha = alpha * 0.36;
      ctx.fillStyle = p.secondaryColor;
      ctx.fillRect(-haloSize * 0.5, -haloSize * 0.5, haloSize, haloSize);

      ctx.globalAlpha = Math.min(1, alpha * 1.15);
      ctx.fillStyle = p.color;
      ctx.fillRect(half, half, s, s);
      break;
    }
    case 'ember': {
      // Warm orange pixel jacket + hot yellow-white pixel center
      ctx.globalAlpha = alpha * 0.55;
      ctx.fillStyle = p.secondaryColor;
      ctx.fillRect(half - 1, half - 1, s + 2, s + 2);

      ctx.globalAlpha = Math.min(1, alpha * 1.2);
      ctx.fillStyle = p.color;
      ctx.fillRect(half, half, s, s);
      break;
    }
    case 'spark': {
      // Crisp 2x4 or 2x3 vertical/diagonal pixel streak
      ctx.globalAlpha = Math.min(1, alpha * 1.15);
      ctx.fillStyle = p.color;
      ctx.fillRect(-1, -s, 2, s + 1);
      ctx.globalAlpha = alpha * 0.55;
      ctx.fillStyle = p.secondaryColor;
      ctx.fillRect(-1, 1, 2, s);
      break;
    }
    case 'pixel_bubble': {
      // Crisp hollow pixel bubble ring with 1px specular highlight
      const b = Math.max(3, s + 1);
      const hb = -b * 0.5;
      ctx.globalAlpha = alpha * 0.75;
      ctx.fillStyle = p.color;
      ctx.fillRect(hb + 1, hb, b - 2, 1);
      ctx.fillRect(hb + 1, hb + b - 1, b - 2, 1);
      ctx.fillRect(hb, hb + 1, 1, b - 2);
      ctx.fillRect(hb + b - 1, hb + 1, 1, b - 2);
      // Specular pixel dot
      ctx.globalAlpha = Math.min(1, alpha * 1.15);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(hb + 1, hb + 1, 1, 1);
      break;
    }
    case 'snowflake':
    case 'ice_crystal':
    case 'magic_mote':
    case 'crystal_shard': {
      // Pixel cross / diamond glint
      ctx.globalAlpha = alpha * 0.55;
      ctx.fillStyle = p.secondaryColor;
      ctx.fillRect(-1, -s, 2, s * 2);
      ctx.fillRect(-s, -1, s * 2, 2);

      ctx.globalAlpha = Math.min(1, alpha * 1.15);
      ctx.fillStyle = p.color;
      ctx.fillRect(half, half, s, s);
      break;
    }
    case 'pixel_leaf': {
      // Crisp 4x2 stepped pixel leaf cluster
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(-2, -1, 3, 2);
      ctx.fillStyle = p.secondaryColor;
      ctx.fillRect(0, 0, 2, 2);
      break;
    }
    case 'drip_streak': {
      // Falling liquid pixel drop (2x5)
      ctx.globalAlpha = alpha * 0.45;
      ctx.fillStyle = p.secondaryColor;
      ctx.fillRect(-1, -5, 2, 3);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(-1, -2, 2, 3);
      break;
    }
    case 'void_fragment': {
      // Jagged dark-core pixel shard with glowing rim
      ctx.globalAlpha = alpha * 0.75;
      ctx.fillStyle = p.color;
      ctx.fillRect(half - 1, half, s + 2, s);
      ctx.fillRect(half, half - 1, s, s + 2);
      ctx.globalAlpha = Math.min(1, alpha * 1.1);
      ctx.fillStyle = '#12071F';
      ctx.fillRect(-1, -1, 2, 2);
      break;
    }
    case 'bone_speck': {
      // Stepped 3x2 pixel bone/ash grain
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(half, half, s, Math.max(2, s - 1));
      ctx.globalAlpha = alpha * 0.65;
      ctx.fillStyle = p.secondaryColor;
      ctx.fillRect(half + 1, half + 1, Math.max(1, s - 1), 1);
      break;
    }
    case 'pixel_dust':
    default: {
      // Classic 2x2 / 3x3 crisp pixel dust square
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(half, half, s, s);
      break;
    }
  }

  ctx.restore();
}

/**
 * 60 FPS Continuous Hardware-Accelerated Canvas Particle Renderer.
 * Renders crisp pixel-art particle shapes moving with fluid sub-pixel velocity,
 * sinusoidal drift, and smooth alpha fade-in/fade-out.
 */
const LaCriptaSmoothParticleLayer: React.FC<{
  dungeonId: string;
  layer: 'far' | 'mid' | 'foreground';
  className?: string;
}> = ({ dungeonId, layer, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const palette = getBiomeVisualProfile(dungeonId);
    const motionProfile = getBiomeMotionProfile(dungeonId);

    let width = Math.max(320, canvas.clientWidth || window.innerWidth);
    let height = Math.max(240, canvas.clientHeight || window.innerHeight);
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const updateCanvasSize = () => {
      if (!canvas) return;
      width = Math.max(320, canvas.clientWidth || window.innerWidth);
      height = Math.max(240, canvas.clientHeight || window.innerHeight);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    updateCanvasSize();

    const isMobile = width < 768;
    const count =
      layer === 'far'
        ? isMobile
          ? 11
          : 18
        : layer === 'mid'
        ? isMobile
          ? 13
          : 22
        : isMobile
        ? 3
        : 5;

    const particles: CriptaAmbientParticleInstance[] = Array.from(
      { length: count },
      (_, idx) =>
        createBiomeParticle(idx, width, height, layer, motionProfile, palette)
    );

    let rafId = 0;
    let lastTime = performance.now();
    let elapsedSec = 0;

    const renderFrame = (now: number) => {
      const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;
      elapsedSec += dt;

      ctx.clearRect(0, 0, width, height);

      const margin = 24;
      const spanW = width + margin * 2;
      const spanH = height + margin * 2;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        // Smooth wrap-around outside viewport margins so particles never pop abruptly
        if (p.x < -margin) p.x += spanW;
        else if (p.x > width + margin) p.x -= spanW;

        if (p.y < -margin) p.y += spanH;
        else if (p.y > height + margin) p.y -= spanH;

        const swayX =
          Math.sin(elapsedSec * p.swayFreq + p.swayPhase) * p.swayAmpX;
        const swayY =
          Math.cos(elapsedSec * (p.swayFreq * 0.85) + p.swayPhase) * p.swayAmpY;

        const drawX = p.x + swayX;
        const drawY = p.y + swayY;

        // Smooth continuous pulse + soft fade near top/bottom screen edges
        const pulseWave =
          0.72 + 0.28 * Math.sin(elapsedSec * p.pulseFreq + p.pulsePhase);
        const verticalNorm = Math.max(0, Math.min(1, drawY / Math.max(1, height)));
        const edgeFade =
          verticalNorm < 0.08
            ? verticalNorm / 0.08
            : verticalNorm > 0.92
            ? (1 - verticalNorm) / 0.08
            : 1;

        const finalAlpha = p.baseAlpha * pulseWave * Math.max(0, Math.min(1, edgeFade));

        drawCrispPixelParticle(ctx, p, drawX, drawY, finalAlpha, elapsedSec);
      }

      rafId = window.requestAnimationFrame(renderFrame);
    };

    rafId = window.requestAnimationFrame(renderFrame);

    const handleResize = () => {
      updateCanvasSize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
    };
  }, [dungeonId, layer]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 w-full h-full block select-none ${className}`}
    />
  );
};

/**
 * Layer 3 — VERY RARE SUBTLE FOREGROUND PARTICLES (3-5 particles across the whole screen,
 * low opacity 0.08-0.17, pointer-events: none, rendered in front of enemies/cards/UI
 * and behind modals/tooltips).
 */
export const LaCriptaForegroundBiomeParticles: React.FC<{
  dungeon: CriptaDungeonDefinition;
}> = ({ dungeon }) => {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none z-25">
      <LaCriptaSmoothParticleLayer dungeonId={dungeon.id} layer="foreground" />
    </div>
  );
};

export const LaCriptaFullScreenBiomeAtmosphere: React.FC<{
  dungeon: CriptaDungeonDefinition;
  roomType?: CriptaCanonicalRoomType;
}> = ({ dungeon, roomType }) => {
  const id = dungeon.id;
  const p = getBiomeVisualProfile(id);
  const isBoss = roomType === 'BOSS' || roomType === 'MINIBOSS';

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none z-0">
      <style>{`
        @keyframes criptaMistDriftA {
          0% { transform: translate3d(-4%, 0px, 0) scale(1.04); opacity: 0.34; }
          50% { transform: translate3d(4%, -6px, 0) scale(1.09); opacity: 0.56; }
          100% { transform: translate3d(-4%, 0px, 0) scale(1.04); opacity: 0.34; }
        }
        @keyframes criptaMistDriftB {
          0% { transform: translate3d(5%, 4px, 0) scale(1.06); opacity: 0.26; }
          50% { transform: translate3d(-5%, -4px, 0) scale(1.02); opacity: 0.48; }
          100% { transform: translate3d(5%, 4px, 0) scale(1.06); opacity: 0.26; }
        }
        @keyframes criptaTorchBreathe {
          0%, 100% { transform: scale(1) translate3d(0, 0, 0); opacity: 0.78; }
          35% { transform: scale(1.04) translate3d(0, -2px, 0); opacity: 0.94; }
          70% { transform: scale(0.98) translate3d(0, 1px, 0); opacity: 0.84; }
        }
      `}</style>

      {/* 1. BIOME BACKGROUND: Base Full-Viewport Gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${p.bgTop} 0%, ${p.bgMid} 58%, ${p.bgBottom} 100%)`,
        }}
      />

      {/* 1B. BIOME BACKGROUND: Full-Screen Pixel-Art World Architecture (320x180 crispEdges) */}
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
                  x={rx}
                  y={36 + (idx % 3) * 12}
                  width={2}
                  height={4}
                  fill="#4ade80"
                  opacity={0.75}
                />
              </g>
            ))}
            {[28, 92, 154, 212, 268].map((mx, idx) => (
              <g key={mx}>
                <rect x={mx} y={131} width={12} height={4} fill="#15803d" />
                <rect x={mx + 2} y={129} width={8} height={2} fill="#4ade80" opacity={0.9} />
                <rect x={mx + 4} y={135} width={4} height={4} fill="#bbf7d0" opacity={0.7} />
                {idx % 2 === 0 && (
                  <rect x={mx + 3} y={130} width={2} height={1} fill="#fef08a" opacity={0.9} />
                )}
              </g>
            ))}
          </g>
        )}

        {(id === 'catacumbas_del_rey' || id === 'cementerio_de_gigantes') && (
          <g>
            {[36, 108, 188, 264].map((tx) => (
              <g key={tx}>
                <rect x={tx - 8} y={32} width={20} height={80} fill={p.wallDark} opacity={0.7} />
                <rect x={tx - 6} y={34} width={16} height={4} fill={p.wallLight} opacity={0.35} />
                <rect x={tx} y={58} width={4} height={10} fill="#334155" />
                <rect x={tx - 1} y={56} width={6} height={2} fill="#475569" />
                <rect
                  x={tx - 1}
                  y={50}
                  width={6}
                  height={6}
                  fill={p.accentPrimary}
                  opacity={0.88}
                />
                <rect
                  x={tx}
                  y={52}
                  width={4}
                  height={4}
                  fill="#e0f2fe"
                  opacity={0.92}
                />
              </g>
            ))}
          </g>
        )}

        {(id === 'prision_maldita' || id === 'castillo_del_verdugo') && (
          <g>
            {[24, 72, 134, 196, 248, 292].map((cx, idx) => (
              <g key={cx}>
                <rect x={cx} y={10} width={2} height={42 + (idx % 3) * 16} fill="#334155" />
                <rect x={cx} y={16} width={1} height={36 + (idx % 3) * 16} fill="#64748b" />
                {idx % 2 === 0 && (
                  <g>
                    <rect x={cx - 5} y={52 + (idx % 2) * 12} width={12} height={16} fill="#1e293b" />
                    <rect x={cx - 3} y={54 + (idx % 2) * 12} width={2} height={12} fill="#475569" />
                    <rect x={cx + 3} y={54 + (idx % 2) * 12} width={2} height={12} fill="#475569" />
                    <rect
                      x={cx - 1}
                      y={60 + (idx % 2) * 12}
                      width={4}
                      height={3}
                      fill={p.accentPrimary}
                      opacity={0.85}
                    />
                  </g>
                )}
              </g>
            ))}
          </g>
        )}

        {(id === 'forja_infernal' || id === 'fortaleza_goblin') && (
          <g>
            <rect x={0} y={135} width={320} height={4} fill="#7c2d12" />
            <rect x={0} y={136} width={320} height={2} fill="#f97316" opacity={0.9} />
            {[22, 84, 148, 216, 278].map((lx) => (
              <rect
                key={lx}
                x={lx}
                y={136}
                width={18}
                height={2}
                fill="#fde047"
                opacity={0.88}
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
                  opacity={0.82}
                />
                <rect
                  x={hx + 3}
                  y={38 + (idx % 2) * 14}
                  width={2}
                  height={4}
                  fill={p.particlePrimary}
                  opacity={0.9}
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
            <rect x={0} y={135} width={320} height={2} fill={p.accentPrimary} opacity={0.75} />
            {[16, 68, 124, 182, 238, 288].map((wx) => (
              <rect
                key={wx}
                x={wx}
                y={137}
                width={14}
                height={1}
                fill={p.particlePrimary}
                opacity={0.85}
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
                  opacity={0.9}
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
            {[42, 118, 194, 268].map((ax) => (
              <g key={ax}>
                <rect
                  x={ax}
                  y={44}
                  width={6}
                  height={14}
                  fill={p.accentPrimary}
                  opacity={0.62}
                />
                <rect
                  x={ax + 2}
                  y={46}
                  width={2}
                  height={10}
                  fill={p.particlePrimary}
                  opacity={0.88}
                />
              </g>
            ))}
          </g>
        )}
      </svg>

      {/* 2. LAYER 1 — DISTANT PARTICLES (Far Background: small, slow, low opacity 0.12-0.28) */}
      <LaCriptaSmoothParticleLayer dungeonId={id} layer="far" />

      {/* 3. MIST / ENVIRONMENTAL LIGHT LAYER (Smooth continuous 60 FPS GPU-interpolated drift & breathing) */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 68% 42% at 26% 62%, ${p.glowColor}, transparent 70%), radial-gradient(ellipse 58% 38% at 78% 36%, ${p.glowColor}, transparent 72%)`,
          animation: 'criptaMistDriftA 18s ease-in-out infinite',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 80% 26% at 50% 84%, ${p.glowColor}, transparent 76%)`,
          animation: 'criptaMistDriftB 24s ease-in-out infinite',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 24% 48%, ${
            isBoss ? 'rgba(244,63,94,0.28)' : p.glowColor
          }, transparent 56%), radial-gradient(circle at 74% 44%, ${p.glowColor}, transparent 60%)`,
          animation: 'criptaTorchBreathe 5.4s ease-in-out infinite',
        }}
      />

      {/* 4. LAYER 2 — MID-DISTANCE PARTICLES (Behind enemies, NPCs, cards & UI: opacity 0.25-0.55) */}
      <LaCriptaSmoothParticleLayer dungeonId={id} layer="mid" />

      {/* Subtle Edge Vignette so UI floats cleanly over the living world */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_52%,rgba(2,4,8,0.62)_100%)]" />
    </div>
  );
};

export const LaCriptaBiomeStageBackdrop: React.FC<{
  dungeon: CriptaDungeonDefinition;
  isBossOrMiniboss?: boolean;
  transparentSkybox?: boolean;
}> = ({ dungeon, isBossOrMiniboss = false, transparentSkybox = true }) => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTick((t) => (t + 1) % 24);
    }, 420);
    return () => window.clearInterval(id);
  }, []);

  const biomeId = dungeon.id;
  const p = getBiomeVisualProfile(biomeId);
  const flicker = tick % 3 === 0 ? 1 : tick % 3 === 1 ? 0.88 : 0.94;
  const pulseY = tick % 4 === 1 || tick % 4 === 2 ? -1 : 0;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
      {/* When used inside standalone Enemy Inspection sheet, provide self-contained biome skybox;
          when used on the main Encounter Stage, keep skybox translucent so the unified full-screen
          biome atmosphere and 60 FPS particle layers flow seamlessly behind the creature/NPC! */}
      {!transparentSkybox ? (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, ${p.bgTop} 0%, ${p.bgMid} 58%, ${p.bgBottom} 100%)`,
          }}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, rgba(6,8,13,0.12) 0%, rgba(6,8,13,0.04) 64%, rgba(6,8,13,0.42) 100%)`,
          }}
        />
      )}

      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          background: `radial-gradient(ellipse at 50% 54%, ${p.glowColor} 0%, transparent 70%)`,
          opacity: flicker,
        }}
      />

      {/* Full-Stage Pixel Art Biome Architectural Framing, Pedestal & Props (NO container-bound low-FPS particles) */}
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
        <rect x="0" y="0" width="160" height="9" fill={p.bgBottom} opacity="0.82" />
        <rect x="24" y="9" width="112" height="3" fill={p.wallLight} opacity="0.45" />

        {/* BIOME-SPECIFIC ARCHITECTURAL PROPS & LIVING DETAILS */}
        {biomeId === 'jardin_podrido' && (
          <g>
            <rect x="28" y="9" width="3" height="22" fill="#1D3622" />
            <rect x="30" y="20" width="2" height="15" fill="#355E3B" />
            <rect x="46" y="9" width="2" height="16" fill="#234229" />
            <rect x="114" y="9" width="2" height="19" fill="#234229" />
            <rect x="128" y="9" width="3" height="24" fill="#1D3622" />
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
            <rect x="18" y="76" width="48" height="4" fill={p.accentPrimary} opacity="0.24" />
            <rect x="92" y="78" width="46" height="4" fill={p.accentPrimary} opacity="0.24" />
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

            <rect x="118" y="34" width="16" height="12" fill={p.wallDark} />
            <rect x="123" y="46" width="4" height="40" fill={p.accentPrimary} opacity="0.55" />
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

        {/* Creature Stage Stone Pedestal / Ground Plane */}
        <rect x="0" y="88" width="160" height="32" fill={p.floorDark} opacity="0.92" />
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
      <div className="absolute inset-0 shadow-[inset_0_0_45px_rgba(4,4,8,0.72)]" />
    </div>
  );
};

