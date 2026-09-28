import React from 'react';
import { CardRank, CantinaMapId } from '../../types/cantina';
import {
  CANTINA_CARD_ASSETS,
  CANTINA_MAP_ASSETS,
  logCantinaCardAssetError,
  logCantinaMapAssetError,
} from '../../data/cantina/cantinaAssets';

export type CantinaCardSize =
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'hand'
  | 'table'
  | 'opponent-side'
  | 'opponent-far';

interface CantinaCardProps {
  rank?: CardRank;
  substitutedNumber?: number;
  selectionOrder?: number;
  invalidShakeKey?: number;
  isInvalidReveal?: boolean;
  isFaceDown?: boolean;
  mapId?: CantinaMapId;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  size?: CantinaCardSize;
  className?: string;
  style?: React.CSSProperties;
}

const RESPONSIVE_SIZE_STYLES: Partial<Record<CantinaCardSize, React.CSSProperties>> = {
  hand: {
    height: 'clamp(156px, 20.8vh, 212px)',
    aspectRatio: '2 / 3',
  },
  table: {
    height: 'clamp(108px, 13.6vh, 138px)',
    aspectRatio: '2 / 3',
  },
  'opponent-side': {
    height: 'clamp(86px, 11vh, 112px)',
    aspectRatio: '2 / 3',
  },
  'opponent-far': {
    height: 'clamp(76px, 9.8vh, 100px)',
    aspectRatio: '2 / 3',
  },
};

export const CantinaCard: React.FC<CantinaCardProps> = ({
  rank,
  substitutedNumber,
  selectionOrder,
  invalidShakeKey = 0,
  isInvalidReveal = false,
  isFaceDown = false,
  mapId = 'mapa1',
  selected = false,
  disabled = false,
  onClick,
  size = 'md',
  className = '',
  style,
}) => {
  // Card dimensions with natural 2:3 aspect ratio
  const sizeClasses: Record<CantinaCardSize, string> = {
    xs: 'w-10 h-15 rounded-md',
    sm: 'w-14 h-21 rounded-lg',
    md: 'w-22 h-33 sm:w-26 sm:h-39 rounded-xl',
    lg: 'w-32 h-48 sm:w-36 sm:h-54 rounded-2xl',
    hand: 'rounded-xl sm:rounded-2xl',
    table: 'rounded-xl',
    'opponent-side': 'rounded-lg sm:rounded-xl',
    'opponent-far': 'rounded-lg sm:rounded-xl',
  };

  const mergedStyle: React.CSSProperties = {
    ...RESPONSIVE_SIZE_STYLES[size],
    ...style,
  };

  // Card back is strictly determined by mapId from canonical registry (no map3 fallback)
  const mapAssets = CANTINA_MAP_ASSETS[mapId];
  const backCardSrc = mapAssets.back;

  if (isFaceDown) {
    return (
      <div
        role={onClick && !disabled ? 'button' : undefined}
        tabIndex={onClick && !disabled ? 0 : undefined}
        onClick={disabled ? undefined : onClick}
        style={mergedStyle}
        className={`relative select-none overflow-hidden shadow-2xl transition-shadow duration-200 ${sizeClasses[size]} ${
          selected
            ? 'ring-3 ring-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.45)]'
            : 'shadow-black/90 hover:brightness-110'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
      >
        <img
          src={backCardSrc}
          alt=""
          onError={() => {
            logCantinaMapAssetError(mapId, 'back', backCardSrc);
          }}
          draggable={false}
          className="w-full h-full object-contain object-center pointer-events-none rounded-inherit"
        />
        {selected && (
          <div className="absolute inset-0 bg-amber-400/10 pointer-events-none rounded-inherit ring-2 ring-amber-300" />
        )}
      </div>
    );
  }

  // Card front: resolved strictly from single source of truth CANTINA_CARD_ASSETS
  const frontCardSrc = rank ? CANTINA_CARD_ASSETS[rank] : '';

  const shakeStyle: React.CSSProperties =
    invalidShakeKey > 0
      ? {
          animation: `cantinaInvalidCardShake_${invalidShakeKey % 2} 270ms cubic-bezier(0.36, 0.07, 0.19, 0.97) both`,
        }
      : {};

  return (
    <div
      role={onClick && !disabled ? 'button' : undefined}
      tabIndex={onClick && !disabled ? 0 : undefined}
      onClick={disabled ? undefined : onClick}
      style={{ ...mergedStyle, ...shakeStyle }}
      className={`relative select-none overflow-hidden shadow-2xl transition-shadow duration-200 ${
        disabled ? 'cursor-not-allowed' : onClick ? 'cursor-pointer' : ''
      } ${sizeClasses[size]} ${
        isInvalidReveal
          ? 'ring-4 ring-red-500 shadow-[0_0_32px_rgba(239,68,68,0.85)]'
          : selected
          ? 'ring-3 ring-amber-400 shadow-[0_0_26px_rgba(251,191,36,0.55)] brightness-105'
          : 'shadow-black/90 hover:brightness-105'
      } ${className}`}
    >
      {invalidShakeKey > 0 && (
        <style>{`
          @keyframes cantinaInvalidCardShake_0 {
            0% { transform: translate3d(0, 0, 0) rotate(0deg); }
            20% { transform: translate3d(-7px, 0, 0) rotate(-2deg); }
            45% { transform: translate3d(6px, 0, 0) rotate(2deg); }
            70% { transform: translate3d(-4px, 0, 0) rotate(-1deg); }
            88% { transform: translate3d(2px, 0, 0) rotate(0.5deg); }
            100% { transform: translate3d(0, 0, 0) rotate(0deg); }
          }
          @keyframes cantinaInvalidCardShake_1 {
            0% { transform: translate3d(0, 0, 0) rotate(0deg); }
            20% { transform: translate3d(-7px, 0, 0) rotate(-2deg); }
            45% { transform: translate3d(6px, 0, 0) rotate(2deg); }
            70% { transform: translate3d(-4px, 0, 0) rotate(-1deg); }
            88% { transform: translate3d(2px, 0, 0) rotate(0.5deg); }
            100% { transform: translate3d(0, 0, 0) rotate(0deg); }
          }
          @media (prefers-reduced-motion: reduce) {
            @keyframes cantinaInvalidCardShake_0 {
              0%, 100% { transform: none; filter: brightness(1); }
              40% { transform: none; filter: brightness(1.25); }
            }
            @keyframes cantinaInvalidCardShake_1 {
              0%, 100% { transform: none; filter: brightness(1); }
              40% { transform: none; filter: brightness(1.25); }
            }
          }
        `}</style>
      )}

      {frontCardSrc ? (
        <img
          src={frontCardSrc}
          alt=""
          onError={() => {
            if (rank) {
              logCantinaCardAssetError(rank, frontCardSrc);
            }
          }}
          draggable={false}
          className="w-full h-full object-contain object-center pointer-events-none rounded-inherit"
        />
      ) : (
        <div className="w-full h-full bg-stone-900 border border-stone-800 rounded-inherit" />
      )}

      {/* Substituted number badge for JOKER in CADENA mode */}
      {rank === 'JOKER' && typeof substitutedNumber === 'number' && (
        <div className="absolute bottom-1.5 inset-x-1.5 flex items-center justify-center pointer-events-none z-10">
          <span className="px-2 py-0.5 rounded-md bg-stone-950/92 border border-amber-400 text-amber-300 font-mono font-black text-[10px] sm:text-xs tracking-wider shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
            = {substitutedNumber}
          </span>
        </div>
      )}

      {/* Selection order badge for multi-card chains */}
      {typeof selectionOrder === 'number' && selectionOrder > 0 && (
        <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-amber-400 text-stone-950 font-mono font-black text-xs flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.85)] border border-stone-950 pointer-events-none z-10">
          {selectionOrder}
        </div>
      )}

      {selected && (
        <div className="absolute inset-0 bg-amber-400/10 pointer-events-none rounded-inherit ring-2 ring-amber-300" />
      )}

      {isInvalidReveal && (
        <>
          <div className="absolute inset-0 bg-gradient-to-b from-red-600/25 via-red-600/18 to-red-900/45 pointer-events-none rounded-inherit ring-2 ring-inset ring-red-400" />
          <div className="absolute bottom-2 inset-x-1.5 flex items-center justify-center pointer-events-none z-20">
            <span className="px-2 py-0.5 rounded-md bg-red-600/95 border border-red-200 text-white font-black text-[10px] sm:text-xs uppercase tracking-wider shadow-[0_2px_12px_rgba(0,0,0,0.95)]">
              ✕ FAROL
            </span>
          </div>
        </>
      )}
    </div>
  );
};
