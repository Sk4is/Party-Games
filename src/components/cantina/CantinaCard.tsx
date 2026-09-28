import React, { useState } from 'react';
import { CardRank, CantinaMapId } from '../../types/cantina';
import { CANTINA_MAPS } from '../../data/cantina/maps';

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

// User-provided card artwork mapping
const CARD_FRONT_ASSETS: Record<CardRank, string[]> = {
  J: ['/assets/cartas/cartaj.png'],
  Q: ['/assets/cartas/cartoq.png', '/assets/cartas/cartaq.png'],
  K: ['/assets/cartas/cartak.png'],
  JOKER: ['/assets/cartas/joker.png'],
  DIABLO: ['/assets/cartas/diablo.png'],
};

export const CantinaCard: React.FC<CantinaCardProps> = ({
  rank,
  isFaceDown = false,
  mapId = 'mapa3',
  selected = false,
  onClick,
  size = 'md',
  className = '',
  style,
}) => {
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [backCardError, setBackCardError] = useState(false);

  const sizeClasses = {
    xs: 'w-10 h-14 rounded-md',
    sm: 'w-14 h-20 rounded-lg',
    md: 'w-20 h-28 sm:w-24 sm:h-34 rounded-xl',
    lg: 'w-28 h-40 sm:w-32 sm:h-46 rounded-2xl',
  }[size];

  const mapDef = CANTINA_MAPS[mapId] || CANTINA_MAPS.mapa3;
  const backCardSrc = backCardError ? '/assets/mapas/mapa3/map3backcard.png' : mapDef.backCard;

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
          alt="Reverso de carta"
          onError={() => {
            if (!backCardError) setBackCardError(true);
          }}
          draggable={false}
          className="w-full h-full object-cover object-center pointer-events-none rounded-inherit"
        />
        {selected && (
          <div className="absolute inset-0 bg-amber-400/15 pointer-events-none rounded-inherit ring-2 ring-amber-300" />
        )}
      </div>
    );
  }

  const candidates = rank ? CARD_FRONT_ASSETS[rank] || [] : [];
  const currentSrc = candidates[candidateIndex] || candidates[0];

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
      {currentSrc ? (
        <img
          src={currentSrc}
          alt={rank || 'Carta'}
          onError={() => {
            if (candidateIndex + 1 < candidates.length) {
              setCandidateIndex(candidateIndex + 1);
            }
          }}
          draggable={false}
          className="w-full h-full object-cover object-center pointer-events-none rounded-inherit"
        />
      ) : (
        <div className="w-full h-full bg-stone-900 border border-stone-800 rounded-inherit" />
      )}

      {selected && (
        <div className="absolute inset-0 bg-amber-400/15 pointer-events-none rounded-inherit ring-2 ring-amber-300" />
      )}
    </div>
  );
};
