import React, { useEffect, useRef, useState } from 'react';
import { CardRank, CantinaMapId } from '../../types/cantina';
import { CantinaCard, CantinaCardSize } from './CantinaCard';
import { audio } from '../../utils/audio';

export type TransientAnimationKind =
  | 'THROW_TO_PILE'
  | 'DRAW_TO_LOCAL'
  | 'DRAW_TO_OPPONENT'
  | 'RESHUFFLE_TO_DECK';

export interface TransientCard {
  id: string; // Stable unique visual key: `${playId}-${cardIndex}` or `${drawEventId}-${cardIndex}`
  playId: string;
  cardIndex: number;
  animationKind?: TransientAnimationKind;
  rank?: CardRank;
  substitutedNumber?: number;
  isFaceDown: boolean;
  revealNearArrival?: boolean; // True when local player draws a card: starts face-down, flips near hand
  cardSize?: CantinaCardSize;
  mapId: CantinaMapId;
  startX: number; // Center X of starting card
  startY: number; // Center Y of starting card
  startRotZ: number;
  startRotX: number;
  startScale: number;
  targetX: number; // Center X of final resting spot
  targetY: number; // Center Y of final resting spot
  targetRotZ: number;
  targetRotX: number; // Target perspective tilt
  targetScaleY: number; // Foreshortening scaleY
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
  onCardDeparted?: (cardId: string) => void;
  onCardLanded?: (cardId: string) => void;
  onCardFinished: (cardId: string) => void;
}

export const CantinaCardAnimationLayer: React.FC<CantinaCardAnimationLayerProps> = ({
  cards,
  onCardDeparted,
  onCardLanded,
  onCardFinished,
}) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden">
      {cards.map((card) => (
        <BezierAnimatedCard
          key={card.id}
          card={card}
          onDeparted={onCardDeparted}
          onLanded={onCardLanded}
          onFinished={onCardFinished}
        />
      ))}
    </div>
  );
};

const BezierAnimatedCard: React.FC<{
  card: TransientCard;
  onDeparted?: (cardId: string) => void;
  onLanded?: (cardId: string) => void;
  onFinished: (cardId: string) => void;
}> = ({ card, onDeparted, onLanded, onFinished }) => {
  const cardRef = useRef(card);
  cardRef.current = card;

  const onDepartedRef = useRef(onDeparted);
  onDepartedRef.current = onDeparted;

  const onLandedRef = useRef(onLanded);
  onLandedRef.current = onLanded;

  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

  const [hasStarted, setHasStarted] = useState<boolean>(() => card.delayMs <= 0);
  const [currentlyFaceDown, setCurrentlyFaceDown] = useState<boolean>(() =>
    card.revealNearArrival ? true : card.isFaceDown
  );

  const [currentStyle, setCurrentStyle] = useState<React.CSSProperties>(() => ({
    position: 'absolute',
    left: `${card.startX}px`,
    top: `${card.startY}px`,
    transform: `translate(-50%, -50%) perspective(${card.perspectivePx}px) rotateX(${card.startRotX}deg) scaleY(1) rotateZ(${card.startRotZ}deg) scale(${card.startScale})`,
    transformOrigin: 'center center',
    zIndex: card.zIndex,
    opacity: card.delayMs <= 0 ? 1 : 0,
    willChange: 'transform, left, top, opacity',
  }));

  const departedRef = useRef(false);
  const flippedRef = useRef(false);
  const landedRef = useRef(false);
  const finishedRef = useRef(false);

  // Keyed strictly by card.id so parent re-renders NEVER restart or duplicate the animation
  useEffect(() => {
    const c = cardRef.current;
    const kind = c.animationKind || 'THROW_TO_PILE';
    let animFrameId: number;
    let startTimestamp: number | null = null;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Direction vector for micro-settle upon hitting the wood tabletop or arriving in hand
    const dx = c.targetX - c.startX;
    const dy = c.targetY - c.startY;
    const dist = Math.hypot(dx, dy) || 1;
    const settleSlidePx = kind === 'THROW_TO_PILE' ? 3.2 : 1.5;
    const impactX = c.targetX - (dx / dist) * settleSlidePx;
    const impactY = c.targetY - (dy / dist) * settleSlidePx;

    const delayTimeout = setTimeout(() => {
      setHasStarted(true);
      if (!departedRef.current) {
        departedRef.current = true;
        onDepartedRef.current?.(c.id);
      }

      if (kind === 'THROW_TO_PILE') {
        audio.playCardThrow(c.cardIndex);
      } else if (kind === 'DRAW_TO_LOCAL' || kind === 'DRAW_TO_OPPONENT') {
        audio.playCardDealt();
      }

      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const elapsed = timestamp - startTimestamp;

        if (elapsed <= c.durationMs) {
          // PHASE 1: Smooth Bézier flight
          const rawFlight = Math.min(Math.max(elapsed / c.durationMs, 0), 1);
          const t = prefersReducedMotion
            ? rawFlight
            : 1 - Math.pow(1 - rawFlight, 2.55);

          const curX = prefersReducedMotion
            ? c.startX + t * (impactX - c.startX)
            : Math.pow(1 - t, 2) * c.startX +
              2 * (1 - t) * t * c.controlPointX +
              Math.pow(t, 2) * impactX;
          const curY = prefersReducedMotion
            ? c.startY + t * (impactY - c.startY)
            : Math.pow(1 - t, 2) * c.startY +
              2 * (1 - t) * t * c.controlPointY +
              Math.pow(t, 2) * impactY;

          const curRotZ = c.startRotZ + t * (c.targetRotZ - c.startRotZ);
          const impactRotX =
            kind === 'THROW_TO_PILE' ? c.targetRotX - 2.2 : c.targetRotX;
          const curRotX = c.startRotX + t * (impactRotX - c.startRotX);
          const curScaleY = 1 + t * (c.targetScaleY - 1);

          // For local player draw: flip from face-down to face-up near arrival (t around 0.62)
          let flipScaleX = 1;
          if (c.revealNearArrival) {
            if (rawFlight >= 0.62 && !flippedRef.current) {
              flippedRef.current = true;
              setCurrentlyFaceDown(false);
              audio.playCardFlip();
            }
            if (!prefersReducedMotion && rawFlight >= 0.44 && rawFlight <= 0.8) {
              const flipPhase = (rawFlight - 0.44) / 0.36; // 0..1
              flipScaleX = Math.max(0.08, Math.abs(Math.cos(flipPhase * Math.PI)));
            }
          }

          // Subtle lift scale boost at mid-flight when drawing from deck
          const liftBoost =
            !prefersReducedMotion &&
            (kind === 'DRAW_TO_LOCAL' || kind === 'DRAW_TO_OPPONENT')
              ? Math.sin(rawFlight * Math.PI) * 0.08
              : 0;
          const curScale =
            c.startScale + t * (c.targetScale * 1.01 - c.startScale) + liftBoost;

          setCurrentStyle({
            position: 'absolute',
            left: `${curX}px`,
            top: `${curY}px`,
            transform: `translate(-50%, -50%) perspective(${c.perspectivePx}px) rotateX(${curRotX}deg) scaleY(${curScaleY}) rotateZ(${curRotZ}deg) scale(${curScale}) scaleX(${flipScaleX})`,
            transformOrigin: 'center center',
            zIndex: c.zIndex,
            opacity: 1,
            willChange: 'transform, left, top, opacity',
          });

          animFrameId = requestAnimationFrame(step);
          return;
        }

        if (c.revealNearArrival && !flippedRef.current) {
          flippedRef.current = true;
          setCurrentlyFaceDown(false);
        }

        // Trigger landing impact sound once at transition from flight -> settle
        if (!landedRef.current) {
          landedRef.current = true;
          if (kind === 'THROW_TO_PILE') {
            audio.playCardLand(c.cardIndex);
          }
          onLandedRef.current?.(c.id);
        }

        const settleElapsed = elapsed - c.durationMs;
        const settleDuration = Math.max(1, c.settlingMs);
        const settleProgress = Math.min(Math.max(settleElapsed / settleDuration, 0), 1);
        const s = 1 - Math.pow(1 - settleProgress, 2);

        // PHASE 2: Physical settle
        const curX = impactX + s * (c.targetX - impactX);
        const curY = impactY + s * (c.targetY - impactY);
        const impactRotX =
          kind === 'THROW_TO_PILE' ? c.targetRotX - 2.2 : c.targetRotX;
        const curRotX = impactRotX + s * (c.targetRotX - impactRotX);
        const curScale = c.targetScale * (1.01 - 0.01 * s);

        setCurrentStyle({
          position: 'absolute',
          left: `${curX}px`,
          top: `${curY}px`,
          transform: `translate(-50%, -50%) perspective(${c.perspectivePx}px) rotateX(${curRotX}deg) scaleY(${c.targetScaleY}) rotateZ(${c.targetRotZ}deg) scale(${curScale})`,
          transformOrigin: 'center center',
          zIndex: c.zIndex,
          opacity: 1,
          willChange: 'transform, left, top, opacity',
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

  if (!hasStarted) {
    return null;
  }

  return (
    <div style={currentStyle}>
      <CantinaCard
        rank={card.rank}
        substitutedNumber={card.substitutedNumber}
        isFaceDown={currentlyFaceDown}
        mapId={card.mapId}
        size={card.cardSize || 'table'}
        className="shadow-[0_12px_22px_rgba(0,0,0,0.82),0_2px_6px_rgba(0,0,0,0.92)]"
      />
    </div>
  );
};
