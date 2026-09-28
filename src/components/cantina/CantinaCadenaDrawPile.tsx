import React from 'react';
import { CantinaMapId } from '../../types/cantina';
import { CantinaCard } from './CantinaCard';

interface TablePileLayoutConfig {
  perspectivePx: number;
  rotateX: number;
  scaleY: number;
  scale: number;
}

interface CantinaCadenaDrawPileProps {
  drawPileCount: number;
  mapId: CantinaMapId;
  canDraw: boolean;
  tablePileLayout: TablePileLayoutConfig;
  deckAnchorRef: React.RefObject<HTMLDivElement | null>;
  onDrawClick: () => void;
}

const DECK_LAYER_OFFSETS: { dx: number; dy: number; rot: number }[] = [
  { dx: 0, dy: 0, rot: 0 },
  { dx: -1.1, dy: -2.4, rot: 0.7 },
  { dx: 0.8, dy: -4.9, rot: -0.9 },
  { dx: -0.6, dy: -7.5, rot: 0.5 },
  { dx: 1.0, dy: -10.2, rot: -0.6 },
  { dx: -0.9, dy: -12.9, rot: 0.8 },
  { dx: 0.5, dy: -15.6, rot: -0.5 },
  { dx: -0.4, dy: -18.4, rot: 0.4 },
];

/**
 * Maps authoritative drawPile.length (0..53, reference full deck ~52) to visible stack layers:
 * - 0 cards: 0 layers (no visible stack until reshuffle)
 * - 1 card: 1 single card
 * - 1-25% (2..13 cards): 3 layers (very thin)
 * - 25-50% (14..26 cards): 4 layers (medium-low)
 * - 50-75% (27..39 cards): 6 layers (medium-high)
 * - 75-100% (40+ cards): 8 layers (full height)
 */
export function getDeckStackLayerCount(drawPileCount: number): number {
  if (drawPileCount <= 0) return 0;
  if (drawPileCount === 1) return 1;
  const ratio = Math.min(1, drawPileCount / 52);
  if (ratio <= 0.25) return 3;
  if (ratio <= 0.5) return 4;
  if (ratio <= 0.75) return 6;
  return 8;
}

export const CantinaCadenaDrawPile: React.FC<CantinaCadenaDrawPileProps> = ({
  drawPileCount,
  mapId,
  canDraw,
  tablePileLayout,
  deckAnchorRef,
  onDrawClick,
}) => {
  const layerCount = getDeckStackLayerCount(drawPileCount);
  const topLayerOffset =
    layerCount > 0
      ? DECK_LAYER_OFFSETS[layerCount - 1]
      : { dx: 0, dy: 0, rot: 0 };

  return (
    <div
      ref={deckAnchorRef}
      onClick={() => {
        if (canDraw && drawPileCount > 0) {
          onDrawClick();
        }
      }}
      style={{
        position: 'absolute',
        left: '-112px',
        top: '50%',
        transform: `translate(-50%, -50%) perspective(${tablePileLayout.perspectivePx}px) rotateX(${tablePileLayout.rotateX}deg) scaleY(${tablePileLayout.scaleY}) rotateZ(-7deg) scale(${tablePileLayout.scale})`,
        zIndex: 55,
      }}
      title={
        canDraw
          ? 'Robar carta del mazo'
          : `Mazo (${drawPileCount} carta${drawPileCount === 1 ? '' : 's'})`
      }
      className={`pointer-events-auto select-none transition-transform duration-200 ${
        canDraw && drawPileCount > 0
          ? 'cursor-pointer hover:scale-105 active:scale-95'
          : 'cursor-default'
      }`}
    >
      <div
        className="relative flex items-center justify-center"
        style={{
          height: 'clamp(108px, 13.6vh, 138px)',
          aspectRatio: '2 / 3',
        }}
      >
        {/* Subtle wooden table resting footprint / shadow */}
        <div
          className={`absolute inset-0 rounded-xl transition-all duration-300 ${
            layerCount > 0
              ? 'bg-black/75 shadow-[0_18px_28px_rgba(0,0,0,0.92)] translate-y-2 scale-[1.02]'
              : 'border border-dashed border-amber-500/30 bg-black/25'
          }`}
        />

        {/* Physical face-down card stack layers */}
        {DECK_LAYER_OFFSETS.slice(0, layerCount).map((offset, idx) => {
          const isTopCard = idx === layerCount - 1;
          return (
            <div
              key={idx}
              style={{
                position: 'absolute',
                inset: 0,
                transform: `translate3d(${offset.dx}px, ${offset.dy}px, 0) rotateZ(${offset.rot}deg)`,
                transition:
                  'transform 280ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease',
                zIndex: idx + 1,
              }}
            >
              <CantinaCard
                isFaceDown
                mapId={mapId}
                size="table"
                className={
                  isTopCard
                    ? canDraw
                      ? 'ring-2 ring-amber-400/90 shadow-[0_6px_18px_rgba(0,0,0,0.88),0_0_20px_rgba(245,158,11,0.45)]'
                      : 'ring-1 ring-amber-900/50 shadow-[0_6px_16px_rgba(0,0,0,0.88)]'
                    : 'brightness-[0.82] border-b border-amber-950/80 shadow-[0_2px_4px_rgba(0,0,0,0.75)]'
                }
              />
            </div>
          );
        })}

        {/* Subtle deck counter pill (Requirement 8: MAZO · 34) */}
        <div
          style={{
            transform: `translate3d(${topLayerOffset.dx * 0.4}px, 0, 0)`,
            zIndex: 20,
          }}
          className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md bg-stone-950/90 border border-amber-500/45 text-[9px] font-mono font-bold tracking-wider text-amber-200/90 whitespace-nowrap shadow-md pointer-events-none"
        >
          MAZO &middot; {drawPileCount}
        </div>
      </div>
    </div>
  );
};
