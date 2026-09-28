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
  isFaceDown?: boolean;
  mapId?: CantinaMapId;
  selected?: boolean;
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
  isFaceDown = false,
  mapId = 'mapa1',
  selected = false,
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
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
        style={mergedStyle}
        className={`relative select-none overflow-hidden shadow-2xl transition-shadow duration-200 ${sizeClasses[size]} ${
          selected
            ? 'ring-3 ring-amber-400 shadow-[0_0_24px_rgba(251,191,36,0.45)]'
            : 'shadow-black/90 hover:brightness-110'
        } ${className}`}
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

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      style={mergedStyle}
      className={`relative select-none overflow-hidden shadow-2xl transition-shadow duration-200 cursor-pointer ${sizeClasses[size]} ${
        selected
          ? 'ring-3 ring-amber-400 shadow-[0_0_26px_rgba(251,191,36,0.55)] brightness-105'
          : 'shadow-black/90 hover:brightness-105'
      } ${className}`}
    >
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

      {selected && (
        <div className="absolute inset-0 bg-amber-400/10 pointer-events-none rounded-inherit ring-2 ring-amber-300" />
      )}
    </div>
  );
};
