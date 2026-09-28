import React, { useEffect, useRef, useState } from 'react';
import { CardRank, CantinaMapId } from '../../types/cantina';
import { CantinaCard } from './CantinaCard';
import { audio } from '../../utils/audio';

export interface TransientCard {
  id: string;
  rank?: CardRank;
  isFaceDown: boolean;
  mapId: CantinaMapId;
  startX: number;
  startY: number;
  startRotZ: number;
  startScale: number;
  targetX: number;
  targetY: number;
  targetRotZ: number;
  targetScale: number;
  targetRotX: number; // Target perspective tilt on table (e.g. 44deg)
  controlPointX: number; // Bézier control point X
  controlPointY: number; // Bézier control point Y
  delayMs: number;
  durationMs: number;
}

interface CantinaCardAnimationLayerProps {
  cards: TransientCard[];
  onCardLanded?: (cardId: string) => void;
  onCardFinished: (cardId: string) => void;
}

export const CantinaCardAnimationLayer: React.FC<CantinaCardAnimationLayerProps> = ({
  cards,
  onCardLanded,
  onCardFinished,
}) => {
  return (
    <div
      style={{ perspective: '1000px' }}
      className="fixed inset-0 pointer-events-none z-40 overflow-hidden"
    >
      {cards.map((card) => (
        <BezierAnimatedCard
          key={card.id}
          card={card}
          onLanded={() => onCardLanded?.(card.id)}
          onFinished={() => onCardFinished(card.id)}
        />
      ))}
    </div>
  );
};

const BezierAnimatedCard: React.FC<{
  card: TransientCard;
  onLanded: () => void;
  onFinished: () => void;
}> = ({ card, onLanded, onFinished }) => {
  const [currentStyle, setCurrentStyle] = useState<React.CSSProperties>({
    position: 'absolute',
    left: `${card.startX}px`,
    top: `${card.startY}px`,
    transform: `scale(${card.startScale}) rotateZ(${card.startRotZ}deg) rotateX(0deg)`,
    transformOrigin: 'center center',
    opacity: 1,
    willChange: 'transform, left, top',
  });

  const landedRef = useRef(false);
  const finishedRef = useRef(false);

  useEffect(() => {
    let animFrameId: number;
    let startTimestamp: number | null = null;
    let delayTimeout: ReturnType<typeof setTimeout>;

    delayTimeout = setTimeout(() => {
      audio.playCardThrow();

      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const elapsed = timestamp - startTimestamp;
        const rawProgress = Math.min(elapsed / card.durationMs, 1);

        // Cubic ease-out curve: 1 - (1 - t)^3
        const easeProgress = 1 - Math.pow(1 - rawProgress, 3);
        const t = easeProgress;

        // Quadratic Bézier: B(t) = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
        const p0x = card.startX;
        const p0y = card.startY;
        const p1x = card.controlPointX;
        const p1y = card.controlPointY;
        const p2x = card.targetX;
        const p2y = card.targetY;

        const curX =
          Math.pow(1 - t, 2) * p0x + 2 * (1 - t) * t * p1x + Math.pow(t, 2) * p2x;
        const curY =
          Math.pow(1 - t, 2) * p0y + 2 * (1 - t) * t * p1y + Math.pow(t, 2) * p2y;

        // Interpolate rotation and progressive perspective tilt into flat tabletop angle
        const curRotZ = card.startRotZ + t * (card.targetRotZ - card.startRotZ);
        const curRotX = t * card.targetRotX; // Tilts progressively from 0deg (held in hand) to 44deg (lying on table)
        const curScale = card.startScale + t * (card.targetScale - card.startScale);

        setCurrentStyle({
          position: 'absolute',
          left: `${curX}px`,
          top: `${curY}px`,
          transform: `scale(${curScale}) rotateX(${curRotX}deg) rotateZ(${curRotZ}deg)`,
          transformOrigin: 'center center',
          opacity: 1,
          willChange: 'transform, left, top',
        });

        if (rawProgress >= 1) {
          if (!landedRef.current) {
            landedRef.current = true;
            audio.playCardLand();
            onLanded();
          }

          // Settling delay before clone is unmounted and authoritative pile representation takes over
          setTimeout(() => {
            if (!finishedRef.current) {
              finishedRef.current = true;
              onFinished();
            }
          }, 100);
          return;
        }

        animFrameId = requestAnimationFrame(step);
      };

      animFrameId = requestAnimationFrame(step);
    }, card.delayMs);

    return () => {
      clearTimeout(delayTimeout);
      cancelAnimationFrame(animFrameId);
    };
  }, [card, onLanded, onFinished]);

  return (
    <div style={currentStyle}>
      <CantinaCard
        rank={card.rank}
        isFaceDown={card.isFaceDown}
        mapId={card.mapId}
        size="md"
        className="shadow-2xl"
      />
    </div>
  );
};
