import React from 'react';
import { CardRank, CantinaMapId } from '../../types/cantina';
import {
  CANTINA_CARD_ASSETS,
  CANTINA_MAP_ASSETS,
  logCantinaCardAssetError,
  logCantinaMapAssetError,
} from '../../data/cantina/cantinaAssets';

interface CantinaCardProps {
  rank?: CardRank;
  isFaceDown?: boolean;
  mapId?: CantinaMapId;
  selected?: boolean;
  onClick?: () => void;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
  style?: React.CSSProperties;
}

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
  const sizeClasses = {
    xs: 'w-10 h-15 rounded-md',
    sm: 'w-14 h-21 rounded-lg',
    md: 'w-22 h-33 sm:w-26 sm:h-39 rounded-xl',
    lg: 'w-32 h-48 sm:w-36 sm:h-54 rounded-2xl',
  }[size];

  // Card back is strictly determined by mapId from canonical registry (no map3 fallback)
  const mapAssets = CANTINA_MAP_ASSETS[mapId];
  const backCardSrc = mapAssets.back;

  if (isFaceDown) {
    return (
      <div
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
        style={style}
        className={`relative select-none overflow-hidden shadow-2xl transition-all duration-200 ${sizeClasses} ${
          selected
            ? 'ring-4 ring-amber-400 -translate-y-4 shadow-amber-500/40'
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
      style={style}
      className={`relative select-none overflow-hidden shadow-2xl transition-all duration-200 cursor-pointer ${sizeClasses} ${
        selected
          ? 'ring-4 ring-amber-400 -translate-y-5 shadow-2xl shadow-amber-400/50 scale-105'
          : 'shadow-black/90 hover:brightness-110'
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
