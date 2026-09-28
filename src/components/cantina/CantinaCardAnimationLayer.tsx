import React, { useEffect, useRef, useState } from 'react';
import { CardRank, CantinaMapId } from '../../types/cantina';
import { CantinaCard } from './CantinaCard';
import { audio } from '../../utils/audio';

export interface TransientCard {
  id: string; // Stable unique visual key: `${playId}-${cardIndex}`
  playId: string;
  cardIndex: number;
  rank?: CardRank;
  isFaceDown: boolean;
  mapId: CantinaMapId;
  startX: number; // Center X of starting card
  startY: number; // Center Y of starting card
  startRotZ: number;
  startRotX: number;
  startScale: number;
  targetX: number; // Center X of final resting spot on table
  targetY: number; // Center Y of final resting spot on table
  targetRotZ: number;
  targetRotX: number; // Target perspective tilt on table (e.g. 52deg)
  targetScaleY: number; // Foreshortening scaleY on table (e.g. 0.88)
  targetScale: number;
  perspectivePx: number;
  controlPointX: number; // Bézier control point X
  controlPointY: number; // Bézier control point Y
  delayMs: number;
  durationMs: number;
  settlingMs: number;
  zIndex: number;
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
    <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden">
      {cards.map((card) => (
        <BezierAnimatedCard
          key={card.id}
          card={card}
          onLanded={onCardLanded}
          onFinished={onCardFinished}
        />
      ))}
    </div>
  );
};

const BezierAnimatedCard: React.FC<{
  card: TransientCard;
  onLanded?: (cardId: string) => void;
  onFinished: (cardId: string) => void;
}> = ({ card, onLanded, onFinished }) => {
  const cardRef = useRef(card);
  cardRef.current = card;

  const onLandedRef = useRef(onLanded);
  onLandedRef.current = onLanded;

  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

  const [currentStyle, setCurrentStyle] = useState<React.CSSProperties>(() => ({
    position: 'absolute',
    left: `${card.startX}px`,
    top: `${card.startY}px`,
    transform: `translate(-50%, -50%) perspective(${card.perspectivePx}px) rotateX(${card.startRotX}deg) scaleY(1) rotateZ(${card.startRotZ}deg) scale(${card.startScale})`,
    transformOrigin: 'center center',
    zIndex: card.zIndex,
    opacity: 1,
    willChange: 'transform, left, top',
  }));

  const landedRef = useRef(false);
  const finishedRef = useRef(false);

  // Keyed strictly by card.id so parent re-renders NEVER restart or duplicate the animation
  useEffect(() => {
    const c = cardRef.current;
    let animFrameId: number;
    let startTimestamp: number | null = null;

    // Direction vector for 3px micro-settle upon hitting the wood tabletop
    const dx = c.targetX - c.startX;
    const dy = c.targetY - c.startY;
    const dist = Math.hypot(dx, dy) || 1;
    const settleSlidePx = 3.2;
    const impactX = c.targetX - (dx / dist) * settleSlidePx;
    const impactY = c.targetY - (dy / dist) * settleSlidePx;

    const delayTimeout = setTimeout(() => {
      audio.playCardThrow(c.cardIndex);

      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const elapsed = timestamp - startTimestamp;

        if (elapsed <= c.durationMs) {
          // PHASE 1: Smooth Bézier flight toward tabletop impact point
          const rawFlight = Math.min(Math.max(elapsed / c.durationMs, 0), 1);
          // Smooth cubic ease-out deceleration
          const t = 1 - Math.pow(1 - rawFlight, 2.75);

          const curX =
            Math.pow(1 - t, 2) * c.startX +
            2 * (1 - t) * t * c.controlPointX +
            Math.pow(t, 2) * impactX;
          const curY =
            Math.pow(1 - t, 2) * c.startY +
            2 * (1 - t) * t * c.controlPointY +
            Math.pow(t, 2) * impactY;

          const curRotZ = c.startRotZ + t * (c.targetRotZ - c.startRotZ);
          const impactRotX = c.targetRotX - 2.2;
          const curRotX = c.startRotX + t * (impactRotX - c.startRotX);
          const curScaleY = 1 + t * (c.targetScaleY - 1);
          const curScale = c.startScale + t * (c.targetScale * 1.02 - c.startScale);

          setCurrentStyle({
            position: 'absolute',
            left: `${curX}px`,
            top: `${curY}px`,
            transform: `translate(-50%, -50%) perspective(${c.perspectivePx}px) rotateX(${curRotX}deg) scaleY(${curScaleY}) rotateZ(${curRotZ}deg) scale(${curScale})`,
            transformOrigin: 'center center',
            zIndex: c.zIndex,
            opacity: 1,
            willChange: 'transform, left, top',
          });

          animFrameId = requestAnimationFrame(step);
          return;
        }

        // Trigger landing impact sound once at transition from flight -> settle
        if (!landedRef.current) {
          landedRef.current = true;
          audio.playCardLand(c.cardIndex);
          onLandedRef.current?.(c.id);
        }

        const settleElapsed = elapsed - c.durationMs;
        const settleProgress = Math.min(Math.max(settleElapsed / c.settlingMs, 0), 1);
        const s = 1 - Math.pow(1 - settleProgress, 2);

        // PHASE 2: Tiny 3px physical slide & tilt settle onto the wooden table
        const curX = impactX + s * (c.targetX - impactX);
        const curY = impactY + s * (c.targetY - impactY);
        const impactRotX = c.targetRotX - 2.2;
        const curRotX = impactRotX + s * (c.targetRotX - impactRotX);
        const curScale = c.targetScale * (1.02 - 0.02 * s);

        setCurrentStyle({
          position: 'absolute',
          left: `${curX}px`,
          top: `${curY}px`,
          transform: `translate(-50%, -50%) perspective(${c.perspectivePx}px) rotateX(${curRotX}deg) scaleY(${c.targetScaleY}) rotateZ(${c.targetRotZ}deg) scale(${curScale})`,
          transformOrigin: 'center center',
          zIndex: c.zIndex,
          opacity: 1,
          willChange: 'transform, left, top',
        });

        if (settleProgress >= 1) {
          if (!finishedRef.current) {
            finishedRef.current = true;
            onFinishedRef.current(c.id);
          }
          return;
        }

        animFrameId = requestAnimationFrame(step);
      };

      animFrameId = requestAnimationFrame(step);
    }, c.delayMs);

    return () => {
      clearTimeout(delayTimeout);
      cancelAnimationFrame(animFrameId);
    };
  }, [card.id]);

  return (
    <div style={currentStyle}>
      <CantinaCard
        rank={card.rank}
        isFaceDown={card.isFaceDown}
        mapId={card.mapId}
        size="table"
        className="shadow-[0_12px_22px_rgba(0,0,0,0.82),0_2px_6px_rgba(0,0,0,0.92)]"
      />
    </div>
  );
};
