import React, { useEffect, useState } from 'react';
import { Card, CardRank, CantinaMapId } from '../../types/cantina';
import { CantinaCard } from './CantinaCard';
import { audio } from '../../utils/audio';

export interface TransientCard {
  id: string;
  rank?: CardRank;
  isFaceDown: boolean;
  mapId: CantinaMapId;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  startScale: number;
  targetScale: number;
  startRot: number;
  targetRot: number;
  delayMs: number;
  durationMs: number;
  flipOnLanding?: boolean;
}

interface CantinaCardAnimationLayerProps {
  cards: TransientCard[];
  onCardFinished: (cardId: string) => void;
}

export const CantinaCardAnimationLayer: React.FC<CantinaCardAnimationLayerProps> = ({
  cards,
  onCardFinished,
}) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {cards.map((card) => (
        <AnimatedCardItem
          key={card.id}
          card={card}
          onFinished={() => onCardFinished(card.id)}
        />
      ))}
    </div>
  );
};

const AnimatedCardItem: React.FC<{
  card: TransientCard;
  onFinished: () => void;
}> = ({ card, onFinished }) => {
  const [phase, setPhase] = useState<'pending' | 'moving' | 'settled'>('pending');
  const [isFaceDown, setIsFaceDown] = useState(card.isFaceDown);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase('moving');
      audio.playCardThrow();

      const finishTimer = setTimeout(() => {
        setPhase('settled');
        if (card.flipOnLanding) {
          setIsFaceDown(false);
          audio.playCardFlip();
        } else {
          audio.playCardLand();
        }
        setTimeout(onFinished, 120);
      }, card.durationMs);

      return () => clearTimeout(finishTimer);
    }, card.delayMs);

    return () => clearTimeout(timer);
  }, [card, onFinished]);

  const isMovingOrSettled = phase !== 'pending';

  const currentX = isMovingOrSettled ? card.targetX : card.startX;
  const currentY = isMovingOrSettled ? card.targetY : card.startY;
  const currentScale = isMovingOrSettled ? card.targetScale : card.startScale;
  const currentRot = isMovingOrSettled ? card.targetRot : card.startRot;

  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        transform: `translate3d(${currentX}px, ${currentY}px, 0) scale(${currentScale}) rotate(${currentRot}deg)`,
        transition: isMovingOrSettled
          ? `transform ${card.durationMs}ms cubic-bezier(0.25, 1, 0.5, 1)`
          : 'none',
        willChange: 'transform',
      }}
    >
      <CantinaCard
        rank={card.rank}
        isFaceDown={isFaceDown}
        mapId={card.mapId}
        size="md"
        className="shadow-2xl"
      />
    </div>
  );
};
