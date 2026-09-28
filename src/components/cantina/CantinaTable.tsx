import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  CantinaRoomState,
  CantinaPlayer,
  TableRank,
  HandInteractionType,
  CenterPileItem,
  DealCardsEventData,
  RouletteSpinEventData,
} from '../../types/cantina';
import {
  CANTINA_MAP_ASSETS,
  getSeatPovKey,
  resolveCantinaSeatBackground,
  logCantinaMapAssetError,
  CantinaMapId,
} from '../../data/cantina/cantinaAssets';
import {
  CANTINA_TABLE_LAYOUTS,
  MAX_VISIBLE_PILE_CARDS,
  getStableCardScatter,
  SeatVisualLayout,
} from '../../data/cantina/cantinaTableLayouts';
import { CardPlayedEventData } from '../../hooks/useCantinaSocket';
import { CantinaCard } from './CantinaCard';
import {
  CantinaCardAnimationLayer,
  TransientCard,
} from './CantinaCardAnimationLayer';
import { CantinaRouletteOverlay } from './CantinaRouletteOverlay';
import { CantinaExitModal } from './CantinaExitModal';
import { audio } from '../../utils/audio';
import {
  Skull,
  Crosshair,
  Crown,
  LogOut,
  Check,
  Flame,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface CantinaTableProps {
  roomState: CantinaRoomState;
  localPlayerId: string;
  remoteInteractions: Record<
    string,
    { interaction: HandInteractionType; hoveredIndex?: number }
  >;
  cardPlayedEvent?: CardPlayedEventData | null;
  dealCardsEvent?: DealCardsEventData | null;
  rouletteSpinEvent?: RouletteSpinEventData | null;
  onPlayCards: (cardIds: string[], playId?: string) => void;
  onChallengeBluff: () => void;
  onPullTrigger: (rouletteEventId: string) => void;
  onSpinCylinder: (
    rouletteEventId: string,
    velocity: number,
    angle: number,
    spinId: string,
    settled?: boolean
  ) => void;
  onTriggerRoulette: () => void;
  onNextRound: () => void;
  onRequestRematch: () => void;
  onRestartMatch: () => void;
  onReturnToLobby: () => void;
  onLeaveRoom: () => void;
  onSendHandInteraction: (
    interaction: HandInteractionType,
    hoveredIndex?: number
  ) => void;
}

const RANK_LABELS: Record<TableRank, string> = {
  J: 'JOTAS (J)',
  Q: 'REINAS (Q)',
  K: 'REYES (K)',
};

export const CantinaTable: React.FC<CantinaTableProps> = ({
  roomState,
  localPlayerId,
  remoteInteractions,
  cardPlayedEvent,
  dealCardsEvent,
  rouletteSpinEvent,
  onPlayCards,
  onChallengeBluff,
  onPullTrigger,
  onSpinCylinder,
  onRequestRematch,
  onReturnToLobby,
  onLeaveRoom,
  onSendHandInteraction,
}) => {
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [inFlightCardIds, setInFlightCardIds] = useState<string[]>([]);
  const [isHandHovered, setIsHandHovered] = useState(false);
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(() => audio.getIsMuted());
  const [audioVolume, setAudioVolume] = useState<number>(() => audio.getVolume());
  const [showVolumePopover, setShowVolumePopover] = useState<boolean>(false);
  const volumeControlRef = useRef<HTMLDivElement | null>(null);
  const [animatingCards, setAnimatingCards] = useState<TransientCard[]>([]);
  const [optimisticPlays, setOptimisticPlays] = useState<CenterPileItem[]>([]);
  const [topPlayEventBanner, setTopPlayEventBanner] = useState<string | null>(null);
  const [viewportWidth, setViewportWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );

  // Round-start dealing & face-down -> face-up flip state
  const [dealtCardCount, setDealtCardCount] = useState<number>(() =>
    roomState.phase === 'ROUND_INTRO' ? 0 : 5
  );
  const [flippedCardIndices, setFlippedCardIndices] = useState<Set<number>>(() =>
    roomState.phase === 'ROUND_INTRO' ? new Set() : new Set([0, 1, 2, 3, 4])
  );
  const [flippingCardIndex, setFlippingCardIndex] = useState<number | null>(null);
  const lastDealtRoundKeyRef = useRef<string>('');

  // Track which visual card keys (`${playId}-${cardIndex}`) have finished flying and landed on the table.
  const [landedCardKeys, setLandedCardKeys] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    (roomState.centerPileHistory || []).forEach((item) => {
      for (let i = 0; i < item.cardsCount; i++) {
        initial.add(`${item.playId}-${i}`);
      }
    });
    return initial;
  });

  // Authoritative deduplication sets so events NEVER animate or play audio more than once
  const animatedPlayIdsRef = useRef<Set<string>>(
    new Set((roomState.centerPileHistory || []).map((item) => item.playId))
  );
  const lastDevilSoundIdRef = useRef<string>('');
  const isSubmittingPlayRef = useRef<boolean>(false);
  const sequenceCounterRef = useRef<number>(
    (roomState.centerPileHistory || []).reduce((acc, item) => acc + item.cardsCount, 0)
  );

  // DOM node references for local hand cards, opponent seats, and table pile center
  const cardElementRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const opponentSeatRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const pileAnchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const localPlayer = roomState.players.find((p) => p.id === localPlayerId);
  const activePlayer = roomState.players.find(
    (p) => p.id === roomState.activePlayerId
  );
  const isMyTurn =
    roomState.activePlayerId === localPlayerId && roomState.phase === 'PLAYING';
  const isLocalAlive = localPlayer?.isAlive ?? false;
  const isMandatoryChallenge = Boolean(roomState.mandatoryChallenge && roomState.lastPlay);

  // 1. Authoritative Map & Independent Seat POV
  // PLAYER 1 / HOST (seatIndex 0) -> POV1
  // PLAYER 2 (seatIndex 1)        -> POV3
  // PLAYER 3 (seatIndex 2)        -> POV2
  // PLAYER 4 (seatIndex 3)        -> POV4
  const selectedMapId: CantinaMapId = roomState.config.mapId;
  const mapDef = CANTINA_MAP_ASSETS[selectedMapId];
  const seatIndex = localPlayer?.seatIndex ?? 0;
  const povKey = getSeatPovKey(seatIndex);
  const povImageSrc = resolveCantinaSeatBackground(selectedMapId, seatIndex);

  const layout =
    CANTINA_TABLE_LAYOUTS[selectedMapId] || CANTINA_TABLE_LAYOUTS.mapa1;

  // Order opponents clockwise relative to localPlayer's seat around the table
  const opponents = useMemo(() => {
    const total = roomState.players.length;
    if (total <= 1) return [];
    const myIdx = roomState.players.findIndex((p) => p.id === localPlayerId);
    if (myIdx < 0) {
      return roomState.players.filter((p) => p.id !== localPlayerId);
    }
    const ordered: CantinaPlayer[] = [];
    for (let offset = 1; offset < total; offset++) {
      ordered.push(roomState.players[(myIdx + offset) % total]);
    }
    return ordered;
  }, [roomState.players, localPlayerId]);

  const getOpponentSeatInfo = useCallback(
    (
      oppIndex: number,
      totalOpponents: number
    ): { seatLayout: SeatVisualLayout; seatRole: 'far' | 'left' | 'right' } => {
      if (totalOpponents === 1) {
        return { seatLayout: layout.farOpponent, seatRole: 'far' };
      }
      if (totalOpponents === 2) {
        return oppIndex === 0
          ? { seatLayout: layout.leftOpponent, seatRole: 'left' }
          : { seatLayout: layout.rightOpponent, seatRole: 'right' };
      }
      if (oppIndex === 0) {
        return { seatLayout: layout.leftOpponent, seatRole: 'left' };
      }
      if (oppIndex === 1) {
        return { seatLayout: layout.farOpponent, seatRole: 'far' };
      }
      return { seatLayout: layout.rightOpponent, seatRole: 'right' };
    },
    [layout]
  );

  // Reset submission lock when active turn or round changes
  useEffect(() => {
    isSubmittingPlayRef.current = false;
  }, [roomState.activePlayerId, roomState.currentRound, roomState.phase]);

  // Trigger physical card dealing (face-down -> face-up flip) at the start of each round
  useEffect(() => {
    const roundKey =
      roomState.roundStartEventId ||
      dealCardsEvent?.roundStartEventId ||
      `round_${roomState.currentRound}`;

    if (!roundKey || roundKey === lastDealtRoundKeyRef.current) return;

    // If reconnecting mid-round while already PLAYING and cards have been played, skip deal intro
    if (
      roomState.phase !== 'ROUND_INTRO' &&
      (roomState.centerPileCount > 0 || (roomState.centerPileHistory || []).length > 0)
    ) {
      lastDealtRoundKeyRef.current = roundKey;
      setDealtCardCount(5);
      setFlippedCardIndices(new Set([0, 1, 2, 3, 4]));
      setFlippingCardIndex(null);
      return;
    }

    lastDealtRoundKeyRef.current = roundKey;
    setDealtCardCount(0);
    setFlippedCardIndices(new Set());
    setFlippingCardIndex(null);

    const timers: ReturnType<typeof setTimeout>[] = [];

    // Step 1: Deal 5 cards face-down into each player's hand
    for (let i = 0; i < 5; i++) {
      timers.push(
        setTimeout(() => {
          setDealtCardCount(i + 1);
          audio.playCardDealt();
        }, 120 + i * 125)
      );
    }

    // Step 2: Flip local player's dealt cards from face-down to face-up one by one
    for (let i = 0; i < 5; i++) {
      const flipStartMs = 860 + i * 145;
      timers.push(
        setTimeout(() => {
          setFlippingCardIndex(i);
          audio.playCardFlip();
        }, flipStartMs)
      );
      timers.push(
        setTimeout(() => {
          setFlippedCardIndices((prev) => {
            const next = new Set(prev);
            next.add(i);
            return next;
          });
          if (i === 4) {
            setFlippingCardIndex(null);
          }
        }, flipStartMs + 95)
      );
    }

    return () => {
      timers.forEach((t) => clearTimeout(t));
    };
  }, [
    roomState.roundStartEventId,
    roomState.currentRound,
    roomState.phase,
    roomState.centerPileCount,
    roomState.centerPileHistory,
    dealCardsEvent?.roundStartEventId,
  ]);

  // Ensure all cards are visible and face-up once in PLAYING phase after deal finishes
  useEffect(() => {
    if (roomState.phase === 'PLAYING' && dealtCardCount < 5) {
      const fallbackTimer = setTimeout(() => {
        setDealtCardCount(5);
        setFlippedCardIndices(new Set([0, 1, 2, 3, 4]));
        setFlippingCardIndex(null);
      }, 1800);
      return () => clearTimeout(fallbackTimer);
    }
  }, [roomState.phase, dealtCardCount]);

  // Play ominous Devil sound once when DEVIL_REVEAL begins
  useEffect(() => {
    if (roomState.phase === 'DEVIL_REVEAL' && roomState.challengeResult) {
      const devilId =
        roomState.challengeResult.devilRevealEventId ||
        roomState.challengeResult.challengeId;
      if (devilId && lastDevilSoundIdRef.current !== devilId) {
        lastDevilSoundIdRef.current = devilId;
        audio.playDevilAwakens();
      }
    }
  }, [roomState.phase, roomState.challengeResult]);

  // Clean in-flight cards and reset pile when authoritative round changes or centerPileHistory is cleared
  const prevRoundRef = useRef<number>(roomState.currentRound);
  useEffect(() => {
    const isNewRound = roomState.currentRound !== prevRoundRef.current;
    const isPileCleared =
      (roomState.centerPileHistory || []).length === 0 &&
      roomState.centerPileCount === 0 &&
      roomState.lastPlay === null;

    if (isNewRound || isPileCleared) {
      prevRoundRef.current = roomState.currentRound;
      setInFlightCardIds([]);
      setSelectedCardIds([]);
      setAnimatingCards([]);
      setOptimisticPlays([]);
      setLandedCardKeys(new Set());
      sequenceCounterRef.current = 0;
      if (isNewRound) {
        animatedPlayIdsRef.current.clear();
        setTopPlayEventBanner(null);
      }
    }
  }, [
    roomState.currentRound,
    roomState.phase,
    roomState.centerPileHistory,
    roomState.centerPileCount,
    roomState.lastPlay,
  ]);

  // Prune optimisticPlays once confirmed in authoritative roomState.centerPileHistory
  useEffect(() => {
    const serverPlayIds = new Set(
      (roomState.centerPileHistory || []).map((item) => item.playId)
    );
    setOptimisticPlays((prev) => {
      if (prev.length === 0) return prev;
      const remaining = prev.filter((opt) => !serverPlayIds.has(opt.playId));
      return remaining.length === prev.length ? prev : remaining;
    });
  }, [roomState.centerPileHistory]);

  // Prune inFlightCardIds once server removes played cards from localPlayer.hand
  useEffect(() => {
    const handIds = new Set((localPlayer?.hand || []).map((c) => c.id));
    setInFlightCardIds((prev) => {
      if (prev.length === 0) return prev;
      const stillInHand = prev.filter((id) => handIds.has(id));
      return stillInHand.length === prev.length ? prev : stillInHand;
    });
  }, [localPlayer?.hand]);

  // Helper to resolve exact center coordinates of the tabletop pile
  const getPileCenterCoords = useCallback(() => {
    if (pileAnchorRef.current) {
      const rect = pileAnchorRef.current.getBoundingClientRect();
      if (rect.width > 0 || rect.height > 0 || rect.left > 0 || rect.top > 0) {
        return {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
      }
    }
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    return {
      x: vw * (layout.tablePile.centerLeftPercent / 100),
      y: vh * (layout.tablePile.centerTopPercent / 100),
    };
  }, [layout.tablePile.centerLeftPercent, layout.tablePile.centerTopPercent]);

  // Spawn remote throw animation for a play (strictly deduplicated by playId)
  const triggerRemotePlayAnimation = useCallback(
    (play: {
      playId: string;
      playerId: string;
      cardsCount: number;
    }) => {
      if (!play.playId || animatedPlayIdsRef.current.has(play.playId)) {
        return;
      }
      animatedPlayIdsRef.current.add(play.playId);

      if (play.playerId === localPlayerId) {
        setLandedCardKeys((prev) => {
          const next = new Set(prev);
          for (let i = 0; i < play.cardsCount; i++) {
            next.add(`${play.playId}-${i}`);
          }
          return next;
        });
        return;
      }

      const shooterIndex = opponents.findIndex((o) => o.id === play.playerId);
      const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
      const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

      const { seatLayout } = getOpponentSeatInfo(
        shooterIndex >= 0 ? shooterIndex : 0,
        Math.max(opponents.length, 1)
      );

      const seatEl = opponentSeatRefs.current[play.playerId];
      const seatRect = seatEl ? seatEl.getBoundingClientRect() : null;
      const baseStartX =
        seatRect && seatRect.width > 0
          ? seatRect.left + seatRect.width / 2
          : vw * (seatLayout.leftPercent / 100);
      const baseStartY =
        seatRect && seatRect.height > 0
          ? seatRect.top + seatRect.height / 2
          : vh * (seatLayout.topPercent / 100);

      const startRotZBase = seatLayout.rotationZ;
      const startRotX = seatLayout.perspectiveTiltX;
      const startScale = seatLayout.scale * 0.78;

      const pileCenter = getPileCenterCoords();
      const midIdx = (play.cardsCount - 1) / 2;

      const remoteCards: TransientCard[] = [];
      for (let i = 0; i < play.cardsCount; i++) {
        const visualKey = `${play.playId}-${i}`;
        const scatter = getStableCardScatter(play.playId, i);
        const targetX = pileCenter.x + scatter.x;
        const targetY = pileCenter.y + scatter.y;
        const cardSpreadOffset = (i - midIdx) * 22;
        const startX = baseStartX + cardSpreadOffset;
        const startY = baseStartY + Math.abs(i - midIdx) * 4;
        const startRotZ = startRotZBase + (i - midIdx) * 5;

        const seqZ = ++sequenceCounterRef.current + 100;

        remoteCards.push({
          id: visualKey,
          playId: play.playId,
          cardIndex: i,
          isFaceDown: true,
          mapId: selectedMapId,
          startX,
          startY,
          startRotZ,
          startRotX,
          startScale,
          targetX,
          targetY,
          targetRotZ: scatter.rotZ,
          targetRotX: layout.tablePile.rotateX + scatter.rotXDelta,
          targetScaleY: layout.tablePile.scaleY,
          targetScale: layout.tablePile.scale,
          perspectivePx: layout.tablePile.perspectivePx,
          controlPointX: (startX + targetX) / 2 + (i - midIdx) * 26,
          controlPointY: Math.min(startY, targetY) - (55 + i * 12),
          delayMs: i * layout.throwAnimation.staggerDelayMs,
          durationMs: layout.throwAnimation.durationMs,
          settlingMs: layout.throwAnimation.settlingMs,
          zIndex: seqZ,
        });
      }

      setAnimatingCards((prev) => {
        const existingIds = new Set(prev.map((c) => c.id));
        const uniqueNew = remoteCards.filter((c) => !existingIds.has(c.id));
        return uniqueNew.length > 0 ? [...prev, ...uniqueNew] : prev;
      });
    },
    [
      localPlayerId,
      opponents,
      getOpponentSeatInfo,
      getPileCenterCoords,
      selectedMapId,
      layout,
    ]
  );

  // Trigger remote throw animation when CARD_PLAYED_EVENT arrives
  useEffect(() => {
    if (!cardPlayedEvent) return;
    triggerRemotePlayAnimation({
      playId: cardPlayedEvent.playId,
      playerId: cardPlayedEvent.playerId,
      cardsCount: cardPlayedEvent.cardsCount,
    });
  }, [cardPlayedEvent, triggerRemotePlayAnimation]);

  // Fallback reconciliation: if a new play appears in centerPileHistory that hasn't been animated yet
  useEffect(() => {
    const history = roomState.centerPileHistory || [];
    if (history.length === 0) return;
    const latest = history[history.length - 1];
    if (latest && !animatedPlayIdsRef.current.has(latest.playId)) {
      triggerRemotePlayAnimation({
        playId: latest.playId,
        playerId: latest.playerId,
        cardsCount: latest.cardsCount,
      });
    }
  }, [roomState.centerPileHistory, triggerRemotePlayAnimation]);

  // Top-center play event message when a turn is played ("TAHONERO JUGÓ 2 CARTAS")
  const prevLastPlayIdRef = useRef<string | undefined>(roomState.lastPlay?.playId);
  useEffect(() => {
    if (
      roomState.lastPlay &&
      roomState.lastPlay.playId !== prevLastPlayIdRef.current
    ) {
      prevLastPlayIdRef.current = roomState.lastPlay.playId;
      setTopPlayEventBanner(
        `${roomState.lastPlay.playerName.toUpperCase()} JUGÓ ${
          roomState.lastPlay.cardsCount
        } CARTA${roomState.lastPlay.cardsCount > 1 ? 'S' : ''}`
      );
      const timer = setTimeout(() => setTopPlayEventBanner(null), 2900);
      return () => clearTimeout(timer);
    }
  }, [roomState.lastPlay]);

  // Card click selection (disabled when mandatoryChallenge is active)
  const handleCardClick = (cardId: string) => {
    if (
      !isMyTurn ||
      !isLocalAlive ||
      isSubmittingPlayRef.current ||
      isMandatoryChallenge
    ) {
      return;
    }
    audio.playCardSelect();

    setSelectedCardIds((prev) => {
      let next: string[];
      if (prev.includes(cardId)) {
        next = prev.filter((id) => id !== cardId);
      } else if (prev.length >= 3) {
        next = [...prev.slice(1), cardId];
      } else {
        next = [...prev, cardId];
      }
      onSendHandInteraction('CARD_SELECTED', hoveredCardIndex ?? undefined);
      return next;
    });
  };

  // Local physical card throw confirmation (EXACTLY 1 animation lifecycle shared with server via playId)
  const handleConfirmPlay = () => {
    if (
      isSubmittingPlayRef.current ||
      selectedCardIds.length < 1 ||
      selectedCardIds.length > 3 ||
      !isMyTurn ||
      !isLocalAlive ||
      isMandatoryChallenge
    ) {
      return;
    }

    isSubmittingPlayRef.current = true;
    const cardsToPlay = [...selectedCardIds];
    const playId = `play_${localPlayerId}_r${roomState.currentRound}_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 6)}`;

    animatedPlayIdsRef.current.add(playId);

    const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    const pileCenter = getPileCenterCoords();
    const midIdx = (cardsToPlay.length - 1) / 2;

    const localTransientCards: TransientCard[] = cardsToPlay.map((cid, idx) => {
      const visualKey = `${playId}-${idx}`;
      const found = (localPlayer?.hand || []).find((c) => c.id === cid);
      const el = cardElementRefs.current[cid];
      const rect = el ? el.getBoundingClientRect() : null;

      const startX =
        rect && rect.width > 0
          ? rect.left + rect.width / 2
          : vw / 2 + (idx - midIdx) * 48;
      const startY =
        rect && rect.height > 0
          ? rect.top + rect.height / 2
          : vh - 110;

      const scatter = getStableCardScatter(playId, idx);
      const targetX = pileCenter.x + scatter.x;
      const targetY = pileCenter.y + scatter.y;
      const seqZ = ++sequenceCounterRef.current + 100;

      return {
        id: visualKey,
        playId,
        cardIndex: idx,
        rank: found?.rank,
        isFaceDown: true,
        mapId: selectedMapId,
        startX,
        startY,
        startRotZ: (idx - midIdx) * 7,
        startRotX: 8,
        startScale: 1.06,
        targetX,
        targetY,
        targetRotZ: scatter.rotZ,
        targetRotX: layout.tablePile.rotateX + scatter.rotXDelta,
        targetScaleY: layout.tablePile.scaleY,
        targetScale: layout.tablePile.scale,
        perspectivePx: layout.tablePile.perspectivePx,
        controlPointX: (startX + targetX) / 2 + (idx - midIdx) * 28,
        controlPointY: Math.min(startY, targetY) - (85 + idx * 14),
        delayMs: idx * layout.throwAnimation.staggerDelayMs,
        durationMs: layout.throwAnimation.durationMs,
        settlingMs: layout.throwAnimation.settlingMs,
        zIndex: seqZ,
      };
    });

    setOptimisticPlays((prev) => [
      ...prev,
      {
        playId,
        playerId: localPlayerId,
        playerName: localPlayer?.name || 'Jugador',
        cardsCount: cardsToPlay.length,
        claimedRank: roomState.tableRank,
        timestamp: Date.now(),
      },
    ]);

    setInFlightCardIds((prev) => [...prev, ...cardsToPlay]);
    setAnimatingCards((prev) => [...prev, ...localTransientCards]);

    onPlayCards(cardsToPlay, playId);
    setSelectedCardIds([]);
    onSendHandInteraction('HAND_IDLE');
  };

  const handleCardAnimationFinished = useCallback((cardVisualKey: string) => {
    setLandedCardKeys((prev) => {
      const next = new Set(prev);
      next.add(cardVisualKey);
      return next;
    });
    setAnimatingCards((prev) => prev.filter((c) => c.id !== cardVisualKey));
  }, []);

  const handleCardMouseEnter = (index: number) => {
    setHoveredCardIndex(index);
    audio.playCardHover();
    onSendHandInteraction('CARD_HOVER', index);
  };

  const handleHandMouseEnter = () => {
    setIsHandHovered(true);
    onSendHandInteraction('HAND_HOVER');
  };

  const handleHandMouseLeave = () => {
    setIsHandHovered(false);
    setHoveredCardIndex(null);
    onSendHandInteraction('HAND_IDLE');
  };

  const handleChallenge = () => {
    if (isMyTurn && roomState.lastPlay && isLocalAlive) {
      audio.playChallenge();
      onChallengeBluff();
    }
  };

  const handleToggleMute = () => {
    const unmuted = audio.toggleMute();
    setIsAudioMuted(!unmuted);
    setAudioVolume(audio.getVolume());
  };

  const handleVolumeChange = (newVal: number) => {
    audio.setVolume(newVal);
    setAudioVolume(audio.getVolume());
    setIsAudioMuted(audio.getIsMuted());
  };

  useEffect(() => {
    if (!showVolumePopover) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        volumeControlRef.current &&
        !volumeControlRef.current.contains(e.target as Node)
      ) {
        setShowVolumePopover(false);
      }
    };
    window.addEventListener('pointerdown', handleOutsideClick);
    return () => window.removeEventListener('pointerdown', handleOutsideClick);
  }, [showVolumePopover]);

  // Merge authoritative centerPileHistory with any pending local optimistic play (deduplicated by playId)
  const effectivePileHistory = useMemo(() => {
    const serverHistory = roomState.centerPileHistory || [];
    const seenPlayIds = new Set(serverHistory.map((h) => h.playId));
    const pendingOptimistic = optimisticPlays.filter(
      (opt) => !seenPlayIds.has(opt.playId)
    );
    return [...serverHistory, ...pendingOptimistic];
  }, [roomState.centerPileHistory, optimisticPlays]);

  // Compile all round pile cards with stable visual keys and apply gradual visual culling
  const visiblePileCards = useMemo(() => {
    const allCards: {
      visualKey: string;
      playId: string;
      cardIndex: number;
      claimedRank: TableRank;
      totalPileIndex: number;
    }[] = [];
    let count = 0;
    effectivePileHistory.forEach((item) => {
      for (let i = 0; i < item.cardsCount; i++) {
        allCards.push({
          visualKey: `${item.playId}-${i}`,
          playId: item.playId,
          cardIndex: i,
          claimedRank: item.claimedRank,
          totalPileIndex: count++,
        });
      }
    });

    if (allCards.length <= MAX_VISIBLE_PILE_CARDS) {
      return allCards;
    }
    return allCards.slice(allCards.length - MAX_VISIBLE_PILE_CARDS);
  }, [effectivePileHistory]);

  const animatingCardKeySet = useMemo(() => {
    return new Set(animatingCards.map((c) => c.id));
  }, [animatingCards]);

  // Filter visible hand cards (subtract in-flight cards during throw, and respect dealing count during ROUND_INTRO)
  const visibleHandCards = useMemo(() => {
    const base = (localPlayer?.hand || []).filter(
      (c) => !inFlightCardIds.includes(c.id)
    );
    if (roomState.phase === 'ROUND_INTRO' || dealtCardCount < 5) {
      return base.slice(0, dealtCardCount);
    }
    return base;
  }, [localPlayer?.hand, inFlightCardIds, roomState.phase, dealtCardCount]);

  // Connected players for synchronized rematch
  const connectedPlayers = useMemo(
    () => roomState.players.filter((p) => p.isConnected),
    [roomState.players]
  );
  const rematchReadySet = useMemo(
    () => new Set(roomState.rematchReadyPlayerIds || []),
    [roomState.rematchReadyPlayerIds]
  );
  const isLocalReadyForRematch = rematchReadySet.has(localPlayerId);

  return (
    <div
      style={{
        backgroundImage: `url("${povImageSrc}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
      className="fixed inset-0 w-screen h-screen overflow-hidden select-none bg-[#0c0a09] text-stone-100 font-sans z-0"
    >
      {/* 1. IMMERSIVE MAP POV BACKGROUND — strictly resolves selectedMap + seat POV */}
      <img
        src={povImageSrc}
        alt=""
        onError={() => {
          logCantinaMapAssetError(selectedMapId, povKey, povImageSrc);
        }}
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none z-0"
      />

      {/* Subtle atmospheric shading overlay (never opaque black) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/25 pointer-events-none z-0" />

      {/* 2. TRANSIENT CARD ANIMATION LAYER (Curved Bézier throw, progressive table tilt & wood settle) */}
      <CantinaCardAnimationLayer
        cards={animatingCards}
        onCardFinished={handleCardAnimationFinished}
      />

      {/* 3. TOP BAR HEADER (SALA / RONDA / MODO on left, centered LA CANTINA DEL FAROL title, SALIR to the left of Volume Control on right) */}
      <header className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-3 sm:px-4 py-2 bg-black/50 backdrop-blur-sm border-b border-amber-900/35">
        <div className="flex items-center gap-2 sm:gap-3 z-10">
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 bg-stone-950/85 border border-amber-700/40 rounded-xl shadow-md">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
              SALA:
            </span>
            <span className="text-xs font-mono font-black text-amber-400 tracking-wider">
              {roomState.code}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 bg-stone-950/75 border border-stone-800 rounded-xl text-xs text-stone-300">
            <span className="font-bold text-amber-100">
              Ronda {roomState.currentRound}
            </span>
            <span className="text-stone-600">&bull;</span>
            <span className="font-semibold text-amber-300">
              {roomState.config.mode === 'DIABLO'
                ? 'Modo Diablo 😈'
                : 'Modo Clásico'}
            </span>
            <span className="hidden lg:inline text-stone-600">&bull;</span>
            <span className="hidden lg:inline text-stone-400 text-[11px]">
              {mapDef.name}
            </span>
          </div>
        </div>

        {/* Centered Cantina Title */}
        <div className="hidden md:flex items-center gap-2 absolute left-1/2 -translate-x-1/2 pointer-events-none select-none">
          <span className="text-base drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]">
            🏮
          </span>
          <span className="text-xs sm:text-sm font-black font-serif tracking-[0.18em] text-amber-200/95 uppercase drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
            LA CANTINA DEL FAROL
          </span>
        </div>

        {/* Right Header Controls: SALIR immediately to the LEFT of Volume/Mute control */}
        <div className="flex items-center gap-2 z-10">
          <button
            onClick={() => setShowExitModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900/85 hover:bg-stone-800 border border-stone-700/60 text-stone-200 hover:text-amber-200 text-xs font-semibold transition-colors shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" /> Salir
          </button>

          {/* Sound / Volume Control */}
          <div
            ref={volumeControlRef}
            className="relative flex items-center"
            onMouseEnter={() => setShowVolumePopover(true)}
          >
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-stone-900/85 hover:bg-stone-800 border border-amber-700/40 text-amber-200 transition-colors shadow-sm">
              <button
                type="button"
                onClick={handleToggleMute}
                title={isAudioMuted ? 'Activar sonido' : 'Silenciar sonido'}
                className="flex items-center justify-center text-amber-300 hover:text-amber-100 transition-colors"
              >
                {isAudioMuted || audioVolume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-amber-400" />
                )}
              </button>

              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isAudioMuted ? 0 : audioVolume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                aria-label="Volumen de la cantina"
                className="hidden sm:block w-16 h-1.5 accent-amber-400 bg-stone-700 rounded-lg cursor-pointer"
              />
            </div>

            {/* Mobile / compact popover slider when tapped */}
            {showVolumePopover && (
              <div className="sm:hidden absolute right-0 top-full mt-2 px-3 py-2.5 rounded-xl bg-stone-950/95 border border-amber-600/50 shadow-2xl flex items-center gap-2 z-50 backdrop-blur-md">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isAudioMuted ? 0 : audioVolume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  aria-label="Volumen"
                  className="w-24 h-1.5 accent-amber-400 bg-stone-700 rounded-lg cursor-pointer"
                />
                <span className="text-[10px] font-mono font-bold text-amber-300 w-8 text-right">
                  {Math.round((isAudioMuted ? 0 : audioVolume) * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 3B. PROMINENT TOP-LEFT TABLE RULE PLAQUE (Requirement 1: Upper-left immediately below header) */}
      <div className="absolute top-13 sm:top-14 left-3 sm:left-5 z-30 pointer-events-none">
        <div className="flex flex-col px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl bg-stone-950/82 backdrop-blur-md border border-amber-500/60 shadow-[0_12px_30px_rgba(0,0,0,0.85),0_0_18px_rgba(245,158,11,0.14)]">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.22em] text-amber-400/90">
              REGLA DE LA MESA
            </span>
          </div>
          <div className="mt-0.5 text-base sm:text-2xl font-black font-serif text-amber-100 tracking-wider drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
            {RANK_LABELS[roomState.tableRank]}
          </div>
        </div>
      </div>

      {/* 3C. TOP-CENTER PLAY EVENT & ACTIVE TURN BANNER (Requirements 2 & 3: Immediately below header) */}
      <div className="absolute top-13 sm:top-14 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center gap-1.5 max-w-[90vw]">
        {roomState.phase === 'ROUND_INTRO' && (
          <div className="px-4 py-1.5 rounded-2xl bg-stone-950/90 border border-amber-400/70 text-amber-200 text-xs sm:text-sm font-black uppercase tracking-wider shadow-[0_8px_24px_rgba(0,0,0,0.85)] backdrop-blur-md flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
            <span>
              RONDA {roomState.currentRound} • EMPIEZA{' '}
              {(
                roomState.roundStartingPlayerName ||
                activePlayer?.name ||
                'JUGADOR'
              ).toUpperCase()}
            </span>
          </div>
        )}

        {topPlayEventBanner && (
          <div className="px-4 py-1.5 rounded-2xl bg-stone-950/90 border border-amber-500/65 text-amber-200 text-xs sm:text-sm font-black uppercase tracking-wider shadow-[0_10px_28px_rgba(0,0,0,0.9)] backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200 whitespace-nowrap">
            {topPlayEventBanner}
          </div>
        )}

        {roomState.phase === 'PLAYING' && activePlayer && (
          <div
            className={`px-3.5 py-1 rounded-full border text-[11px] sm:text-xs font-black uppercase tracking-widest backdrop-blur-md flex items-center gap-2 shadow-lg transition-all duration-300 ${
              isMyTurn
                ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.35)]'
                : 'bg-stone-950/85 border-amber-500/45 text-amber-100/95'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isMyTurn
                  ? 'bg-amber-300 animate-ping'
                  : 'bg-amber-400 animate-pulse'
              }`}
            />
            <span>
              {isMyTurn
                ? 'ES TU TURNO'
                : `TURNO DE ${activePlayer.name.toUpperCase()}`}
            </span>
          </div>
        )}
      </div>

      {/* 4. OPPONENTS AROUND THE TABLE (CHAIR-ALIGNED, SEAT PERSPECTIVE, ACTIVE SEAT GLOW) */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {opponents.map((opp, oppIndex) => {
          const isOppTurn =
            roomState.activePlayerId === opp.id &&
            (roomState.phase === 'PLAYING' || roomState.phase === 'ROUND_INTRO');
          const oppInteraction = remoteInteractions[opp.id];
          const isOppHandHovered =
            oppInteraction?.interaction === 'HAND_HOVER' ||
            oppInteraction?.interaction === 'CARD_HOVER' ||
            oppInteraction?.interaction === 'CARD_SELECTED';

          const { seatLayout, seatRole } = getOpponentSeatInfo(
            oppIndex,
            opponents.length
          );
          const oppCardSize =
            seatRole === 'far' ? 'opponent-far' : 'opponent-side';

          const effectiveLeftPercent =
            viewportWidth < 640
              ? seatRole === 'left'
                ? 17
                : seatRole === 'right'
                ? 83
                : seatLayout.leftPercent
              : seatLayout.leftPercent;

          // During ROUND_INTRO dealing, stagger opponent card appearance
          const visibleOppCardsCount =
            roomState.phase === 'ROUND_INTRO'
              ? Math.min(opp.cardsCount, dealtCardCount)
              : opp.cardsCount;

          return (
            <div
              key={opp.id}
              style={{
                position: 'absolute',
                top: `${seatLayout.topPercent}%`,
                left: `${effectiveLeftPercent}%`,
                transform: `translate(-50%, -50%) rotate(${seatLayout.rotationZ}deg)`,
                perspective: '900px',
              }}
              className="flex flex-col items-center gap-1.5 transition-all duration-300 pointer-events-auto"
            >
              {/* Floating Active Turn Marker on Opponent's Seat */}
              {isOppTurn && opp.isAlive && (
                <div
                  style={{
                    transform: `rotate(${-seatLayout.rotationZ}deg)`,
                  }}
                  className="mb-0.5 px-2.5 py-0.5 rounded-full bg-amber-500 text-stone-950 font-black text-[10px] uppercase tracking-wider shadow-[0_0_18px_rgba(245,158,11,0.85)] flex items-center gap-1.5 animate-bounce whitespace-nowrap z-30"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-950 animate-ping" />
                  <span>TURNO DE {opp.name.toUpperCase()}</span>
                </div>
              )}

              {/* Opponent Card Backs Fan */}
              {opp.isAlive ? (
                <div
                  ref={(el) => {
                    opponentSeatRefs.current[opp.id] = el;
                  }}
                  className="relative flex items-center justify-center h-24 sm:h-28 min-w-[120px]"
                  style={{
                    transform: `scale(${seatLayout.scale}) rotateX(${seatLayout.perspectiveTiltX}deg)`,
                    transformOrigin: 'center bottom',
                  }}
                >
                  {/* Warm Ambient Seat Glow when it's this opponent's turn */}
                  {isOppTurn && (
                    <div className="absolute -inset-3 rounded-full bg-amber-400/25 blur-xl animate-pulse pointer-events-none" />
                  )}

                  {Array.from({ length: visibleOppCardsCount }).map((_, cIdx) => {
                    const mid = (visibleOppCardsCount - 1) / 2;
                    const offsetFromMid = cIdx - mid;
                    const spreadDeg = isOppHandHovered
                      ? seatLayout.fanRotationStep * 1.45
                      : seatLayout.fanRotationStep;
                    const spacingPx = isOppHandHovered
                      ? seatLayout.fanSpacing * 1.35
                      : seatLayout.fanSpacing;

                    const rotZ = offsetFromMid * spreadDeg;
                    const xOff = offsetFromMid * spacingPx;
                    const arcY = Math.pow(Math.abs(offsetFromMid), 1.4) * 2.5;
                    const hoverLift =
                      isOppHandHovered &&
                      oppInteraction?.hoveredIndex === cIdx
                        ? -seatLayout.cardLiftOnHover
                        : 0;

                    return (
                      <div
                        key={cIdx}
                        style={{
                          position: 'absolute',
                          transform: `translate3d(${xOff}px, ${arcY + hoverLift}px, 0) rotateZ(${rotZ}deg)`,
                          transformOrigin: '50% 88%',
                          transition:
                            'transform 200ms cubic-bezier(0.22, 1, 0.36, 1)',
                          zIndex: cIdx + 1,
                        }}
                      >
                        <CantinaCard
                          isFaceDown
                          mapId={selectedMapId}
                          size={oppCardSize}
                          className={
                            isOppTurn
                              ? 'shadow-[0_10px_24px_rgba(0,0,0,0.9),0_0_12px_rgba(245,158,11,0.35)] ring-1 ring-amber-400/50'
                              : 'shadow-xl shadow-black/85'
                          }
                        />
                      </div>
                    );
                  })}
                  {opp.cardsCount === 0 && roomState.phase !== 'ROUND_INTRO' && (
                    <span className="px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-500/50 text-[10px] text-amber-300 font-black uppercase tracking-wider shadow">
                      ¡Sin cartas!
                    </span>
                  )}
                </div>
              ) : (
                <div className="p-2 rounded-full bg-stone-950/80 border border-rose-900/60 text-xl shadow">
                  💀
                </div>
              )}

              {/* Opponent Name & Chamber Indicator Badge */}
              <div
                style={{
                  transform: `rotate(${-seatLayout.rotationZ}deg)`,
                }}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs backdrop-blur-md border transition-all duration-300 ${
                  !opp.isAlive
                    ? 'bg-rose-950/50 border-rose-900/50 text-stone-400'
                    : isOppTurn
                    ? 'bg-amber-950/95 border-2 border-amber-400 text-amber-100 shadow-[0_0_24px_rgba(245,158,11,0.55)] scale-105'
                    : 'bg-black/75 border-stone-700/80 text-stone-200'
                }`}
              >
                {isOppTurn && opp.isAlive && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
                )}
                <span className="font-bold flex items-center gap-1 text-[11px] sm:text-xs whitespace-nowrap">
                  {opp.avatar} {opp.name}
                  {opp.isHost && <Crown className="w-3 h-3 text-amber-400" />}
                </span>
                {opp.isAlive && (
                  <span
                    title="Recámaras probadas en su revólver personal"
                    className="text-[10px] font-mono tabular-nums text-amber-400/90 font-bold px-1.5 py-0.2 rounded bg-stone-900/90 border border-stone-700/80"
                  >
                    {opp.revolver?.shotsTaken ?? opp.chamberPulls}/6
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. CENTER TABLE: PERSISTENT PHYSICAL TABLETOP PILE (POSITIONED ON ACTUAL WOODEN SURFACE) */}
      <div
        ref={pileAnchorRef}
        style={{
          position: 'absolute',
          top: `${layout.tablePile.centerTopPercent}%`,
          left: `${layout.tablePile.centerLeftPercent}%`,
          transform: 'translate(-50%, -50%)',
        }}
        className="w-64 h-48 pointer-events-none z-10"
      >
        {visiblePileCards.map((item) => {
          if (
            !landedCardKeys.has(item.visualKey) ||
            animatingCardKeySet.has(item.visualKey)
          ) {
            return null;
          }

          const scatter = getStableCardScatter(item.playId, item.cardIndex);
          const cardRotX = layout.tablePile.rotateX + scatter.rotXDelta;

          return (
            <div
              key={item.visualKey}
              style={{
                position: 'absolute',
                left: `calc(50% + ${scatter.x}px)`,
                top: `calc(50% + ${scatter.y}px)`,
                transform: `translate(-50%, -50%) perspective(${layout.tablePile.perspectivePx}px) rotateX(${cardRotX}deg) scaleY(${layout.tablePile.scaleY}) rotateZ(${scatter.rotZ}deg) scale(${layout.tablePile.scale})`,
                transformOrigin: 'center center',
                zIndex: item.totalPileIndex + 1,
              }}
            >
              <CantinaCard
                isFaceDown
                mapId={selectedMapId}
                size="table"
                className="shadow-[0_12px_22px_rgba(0,0,0,0.82),0_2px_6px_rgba(0,0,0,0.92)]"
              />
            </div>
          );
        })}
      </div>

      {/* 6. LOCAL PLAYER ZONE (INDEPENDENT REGIONS: ACTION CONTROLS -> HAND VISUAL REGION -> DEDICATED STATUS SAFE AREA) */}
      <div className="absolute bottom-0 inset-x-0 z-20 flex flex-col items-center pointer-events-none">
        {/* Action Controls & Turn Prompt Bar — strictly above the hand visual region */}
        <div className="relative z-40 flex flex-col items-center justify-center gap-2 px-4 mb-2 min-h-[44px] pointer-events-auto">
          {/* Mandatory Final-Hand Accusation Alert */}
          {isMyTurn && isMandatoryChallenge && isLocalAlive && (
            <div className="px-4 py-1.5 rounded-xl bg-red-950/95 border border-red-400/80 text-red-200 text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-[0_0_25px_rgba(239,68,68,0.45)] animate-bounce">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                ¡{roomState.lastPlay?.playerName} SE QUEDÓ SIN CARTAS! DEBES ACUSAR ¡FAROL!
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
            {/* CHALLENGE BLUFF BUTTON ("¡FAROL!") */}
            {isMyTurn && roomState.lastPlay && isLocalAlive && (
              <button
                onClick={handleChallenge}
                className={`py-2.5 px-5 sm:px-6 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-2xl shadow-rose-600/45 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border border-rose-400/60 whitespace-nowrap ${
                  isMandatoryChallenge
                    ? 'ring-4 ring-amber-400/70 scale-105'
                    : ''
                }`}
              >
                <Skull className="w-4 h-4 shrink-0" /> ¡FAROL!
              </button>
            )}

            {/* CONFIRM PLAY BUTTON */}
            {isMyTurn &&
              !isMandatoryChallenge &&
              selectedCardIds.length > 0 &&
              isLocalAlive && (
                <button
                  onClick={handleConfirmPlay}
                  className="py-2.5 px-5 sm:px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-2xl shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border border-amber-300 animate-in zoom-in-95 duration-150 whitespace-nowrap"
                >
                  <Check className="w-4 h-4 stroke-[3] shrink-0" /> CONFIRMAR
                  SELECCIÓN ({selectedCardIds.length}{' '}
                  {RANK_LABELS[roomState.tableRank]})
                </button>
              )}

            {/* Compact Turn status reminder when no card selected */}
            {isMyTurn &&
              !isMandatoryChallenge &&
              selectedCardIds.length === 0 &&
              isLocalAlive && (
                <div className="px-4 py-1.5 rounded-full bg-stone-950/90 border-2 border-amber-400/80 text-amber-200 text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-[0_0_22px_rgba(245,158,11,0.35)] backdrop-blur-sm whitespace-nowrap">
                  <Crosshair className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
                  <span>ES TU TURNO • ELIGE DE 1 A 3 CARTAS</span>
                </div>
              )}
          </div>
        </div>

        {/* Physical Hand Fan Region — sized for larger cards + top lift headroom + bottom clearance above status row */}
        {isLocalAlive ? (
          <div
            onMouseEnter={handleHandMouseEnter}
            onMouseLeave={handleHandMouseLeave}
            style={{
              height: 'calc(clamp(156px, 20.8vh, 212px) + 64px)',
            }}
            className="relative flex items-end justify-center pointer-events-auto w-full max-w-[720px] px-6"
          >
            {/* Subtle warm golden glow behind local hand when it's local player's turn */}
            {isMyTurn && (
              <div className="absolute inset-x-16 bottom-6 h-28 rounded-full bg-amber-500/15 blur-2xl pointer-events-none" />
            )}

            {visibleHandCards.map((card, i) => {
              const totalCards = visibleHandCards.length;
              const mid = (totalCards - 1) / 2;
              const offsetFromMid = i - mid;
              const isSelected = selectedCardIds.includes(card.id);
              const isCardHovered = hoveredCardIndex === i;

              const isCardFlippedFaceUp = flippedCardIndices.has(i);
              const isCurrentlyFlipping = flippingCardIndex === i;

              const maxAllowedHoverSpacing = Math.min(
                layout.localHand.hoverFanSpacing,
                Math.max(42, (viewportWidth - 150) / Math.max(totalCards, 1))
              );
              const maxAllowedIdleSpacing = Math.min(
                layout.localHand.idleFanSpacing,
                Math.max(24, (viewportWidth - 165) / Math.max(totalCards, 1))
              );

              const spacingPx = isHandHovered
                ? maxAllowedHoverSpacing
                : maxAllowedIdleSpacing;
              const spreadDeg = isHandHovered
                ? layout.localHand.hoverFanRotation
                : layout.localHand.idleFanRotation;

              let neighborPushX = 0;
              if (hoveredCardIndex !== null && hoveredCardIndex !== i) {
                const diff = i - hoveredCardIndex;
                const distanceAttenuation = 1 / Math.abs(diff);
                neighborPushX =
                  Math.sign(diff) *
                  layout.localHand.neighborHoverPushPx *
                  distanceAttenuation;
              }

              const fanX = offsetFromMid * spacingPx + neighborPushX;
              const fanArcY =
                Math.pow(Math.abs(offsetFromMid), 1.45) *
                layout.localHand.arcDropPx;

              const selectLiftY = isSelected
                ? -layout.localHand.cardSelectedLiftPx
                : 0;
              const hoverLiftY = isCardHovered
                ? isSelected
                  ? -layout.localHand.cardSelectedHoverBonusPx
                  : -layout.localHand.cardHoverLiftPx
                : 0;

              const finalY = fanArcY + selectLiftY + hoverLiftY;
              const baseRot = offsetFromMid * spreadDeg;
              const finalRot = isCardHovered
                ? baseRot * 0.22
                : isSelected
                ? baseRot * 0.65
                : baseRot;
              const finalScale = isCardHovered
                ? 1.07
                : isSelected
                ? 1.03
                : 1.0;

              // 3D horizontal scale pinch during face-down -> face-up flip
              const flipScaleX = isCurrentlyFlipping ? 0.08 : 1;

              const zIndex = isCardHovered ? 35 : isSelected ? 20 + i : 10 + i;

              return (
                <div
                  key={card.id}
                  ref={(el) => {
                    cardElementRefs.current[card.id] = el;
                  }}
                  onMouseEnter={() => handleCardMouseEnter(i)}
                  style={{
                    position: 'absolute',
                    bottom: `${layout.localHand.bottomPx}px`,
                    transform: `translate3d(${fanX}px, ${finalY}px, 0) rotate(${finalRot}deg) scale(${finalScale}) scaleX(${flipScaleX})`,
                    transformOrigin: '50% 88%',
                    zIndex,
                    transition:
                      'transform 200ms cubic-bezier(0.22, 1, 0.36, 1), z-index 0ms',
                    willChange: 'transform',
                  }}
                >
                  <CantinaCard
                    rank={card.rank}
                    isFaceDown={!isCardFlippedFaceUp}
                    mapId={selectedMapId}
                    selected={isSelected}
                    disabled={isMandatoryChallenge}
                    onClick={() => handleCardClick(card.id)}
                    size="hand"
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-3 px-5 rounded-2xl bg-black/80 border border-stone-800 text-stone-400 text-xs font-semibold backdrop-blur-sm pointer-events-auto flex items-center gap-2 mb-3">
            <Skull className="w-4 h-4 text-rose-500" /> Has sido eliminado.
            Observando la cantina...
          </div>
        )}

        {/* DEDICATED BOTTOM STATUS SAFE AREA (24–30px below lowest card edge, never overlapped) */}
        <div className="w-full h-11 sm:h-12 flex items-center justify-center pb-2 sm:pb-2.5 pointer-events-none shrink-0">
          <div
            className={`flex items-center gap-2 px-3.5 py-1 rounded-full pointer-events-auto text-[11px] sm:text-xs font-medium border backdrop-blur-md transition-all ${
              isMyTurn
                ? 'bg-amber-950/90 border-amber-400 text-amber-100 shadow-[0_0_16px_rgba(245,158,11,0.4)]'
                : 'bg-black/75 border-stone-800 text-stone-200 shadow-lg'
            }`}
          >
            {isMyTurn && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            )}
            <span className="font-bold text-stone-100">
              {localPlayer?.avatar} {localPlayer?.name}
            </span>
            <span className="text-stone-500">&middot;</span>
            <span className="font-mono tabular-nums text-amber-400 font-bold">
              Tu Revólver: {localPlayer?.revolver?.shotsTaken ?? localPlayer?.chamberPulls ?? 0}/6
            </span>
          </div>
        </div>
      </div>

      {/* 7A. 5-SECOND DEVIL CARD REVEAL PRESENTATION (Explicit vertical separation & bounded 6px float) */}
      {roomState.phase === 'DEVIL_REVEAL' && roomState.challengeResult && (
        <div className="fixed inset-0 z-50 bg-gradient-to-b from-red-950/90 via-black/92 to-stone-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
          <style>{`
            @keyframes cantinaDevilFloat {
              0%, 100% { transform: translateY(2px); }
              50% { transform: translateY(-6px); }
            }
          `}</style>

          {/* Infernal radial glow */}
          <div
            className="fixed inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at 50% 48%, rgba(239, 68, 68, 0.32) 0%, rgba(147, 51, 234, 0.14) 38%, transparent 72%)',
            }}
          />

          <div className="relative z-10 w-full max-w-xl rounded-3xl bg-gradient-to-b from-[#2b0909] via-[#170606] to-[#0c0505] border-2 border-red-500/80 px-6 py-6 sm:px-8 sm:py-8 shadow-[0_0_90px_rgba(220,38,38,0.65)] flex flex-col items-center text-center">
            {/* 1. Top Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-950 border border-red-400/70 text-red-200 text-xs font-black uppercase tracking-[0.22em] shadow-lg">
              <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
              ¡CARTA DEL DIABLO REVELADA!
              <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
            </div>

            {/* 2. Main Heading — explicit vertical spacing below badge */}
            <h2 className="mt-3.5 sm:mt-4 text-2xl sm:text-4xl font-black font-serif text-amber-100 leading-tight tracking-wide drop-shadow-[0_4px_14px_rgba(220,38,38,0.9)]">
              ¡EL DIABLO DESPIERTA
              <span className="block mt-0.5">EN LA MESA!</span>
            </h2>

            {/* 3. Revealed Cards Stage — EXPLICIT 28px–36px CLEAR GAP below heading, bounded 6px float */}
            <div className="mt-7 sm:mt-9 mb-6 sm:mb-8 pt-2 pb-1 flex items-center justify-center gap-4 sm:gap-5">
              {roomState.challengeResult.revealedCards.map((card, idx) => {
                const isDiabloCard = card.rank === 'DIABLO';
                return (
                  <div
                    key={card.id || idx}
                    style={
                      isDiabloCard
                        ? {
                            animation:
                              'cantinaDevilFloat 2.6s ease-in-out infinite',
                          }
                        : undefined
                    }
                    className={`relative transition-all duration-500 ${
                      isDiabloCard
                        ? 'z-20 drop-shadow-[0_0_30px_rgba(239,68,68,0.9)]'
                        : 'scale-90 opacity-85'
                    }`}
                  >
                    {isDiabloCard && (
                      <div className="absolute -inset-3 rounded-2xl bg-gradient-to-t from-purple-700/25 via-red-600/40 to-amber-500/35 blur-lg animate-pulse pointer-events-none" />
                    )}
                    <CantinaCard
                      rank={card.rank}
                      mapId={selectedMapId}
                      size="lg"
                      className={
                        isDiabloCard
                          ? 'ring-2 ring-amber-400 shadow-2xl'
                          : 'shadow-xl'
                      }
                    />
                  </div>
                );
              })}
            </div>

            {/* 4. Safe Status Box — explicit clear gap below Devil card */}
            <div className="w-full p-4 rounded-2xl bg-black/60 border border-red-500/40 flex flex-col gap-1.5">
              <p className="text-base sm:text-lg font-black text-emerald-300 uppercase tracking-wider">
                🛡️ {roomState.challengeResult.accusedName} QUEDA A SALVO
              </p>
              <p className="text-xs sm:text-sm font-bold text-red-200 leading-relaxed">
                {roomState.challengeResult.accuserName} desafió una jugada con el
                Diablo. ¡Todos los demás rivales vivos deben enfrentarse al revólver!
              </p>
            </div>

            <div className="mt-4 w-full flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest text-amber-300 animate-pulse">
              <Crosshair className="w-4 h-4 text-red-400 animate-spin" />
              Preparando los tambores para todos los rivales...
            </div>
          </div>
        </div>
      )}

      {/* 7B. CARD REVELATION SUSPENSE MODAL (Standard accusation & Final-Hand resolution) */}
      {roomState.phase === 'REVELACION' && roomState.challengeResult && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-stone-950 border-2 border-amber-500/60 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center gap-5">
            <span className="text-xs font-black uppercase tracking-widest text-amber-400">
              {roomState.challengeResult.isFinalHandChallenge
                ? 'VERIFICACIÓN DE ÚLTIMAS CARTAS'
                : 'RESOLUCIÓN DE LA ACUSACIÓN'}
            </span>

            <h2 className="text-2xl sm:text-3xl font-black font-serif text-white">
              {roomState.challengeResult.isBluff ? (
                <span className="text-rose-500">¡FAROL DETECTADO!</span>
              ) : (
                <span className="text-emerald-400">¡JUGADA VÁLIDA!</span>
              )}
            </h2>

            {roomState.challengeResult.roundWinnerName && (
              <div className="px-4 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400 text-amber-200 text-xs sm:text-sm font-black uppercase tracking-wider">
                🏆 ¡{roomState.challengeResult.roundWinnerName} SE QUEDÓ SIN CARTAS VÁLIDAS!
              </div>
            )}

            {/* Revealed Cards */}
            <div className="flex items-center justify-center gap-3 my-2">
              {roomState.challengeResult.revealedCards.map((card) => (
                <CantinaCard
                  key={card.id}
                  rank={card.rank}
                  mapId={selectedMapId}
                  size="lg"
                  className="shadow-2xl"
                />
              ))}
            </div>

            <p className="text-sm text-stone-200 leading-relaxed font-semibold">
              {roomState.challengeResult.description}
            </p>

            <div className="w-full pt-3 border-t border-stone-800 flex items-center justify-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400">
              <Crosshair className="w-4 h-4 animate-spin" />{' '}
              {roomState.challengeResult.loserName} debe apretar el gatillo...
            </div>
          </div>
        </div>
      )}

      {/* 8. INTERACTIVE RUSSIAN ROULETTE OVERLAY */}
      {roomState.phase === 'RULETA' && roomState.rouletteResult && (
        <CantinaRouletteOverlay
          rouletteResult={roomState.rouletteResult}
          localPlayerId={localPlayerId}
          rouletteSpinEvent={rouletteSpinEvent}
          onPullTrigger={onPullTrigger}
          onSpinCylinder={onSpinCylinder}
        />
      )}

      {/* 9. GAME OVER PODIUM & SYNCHRONIZED REMATCH */}
      {roomState.phase === 'GAME_OVER' && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md bg-stone-950 border-2 border-amber-500/70 rounded-3xl p-6 sm:p-8 shadow-[0_25px_80px_rgba(0,0,0,0.95)] flex flex-col items-center text-center gap-5">
            <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-4xl shadow-xl shadow-amber-500/20">
              👑
            </div>

            <div>
              <span className="text-xs font-black uppercase tracking-widest text-amber-400">
                GANADOR DE LA PARTIDA
              </span>
              <h2 className="text-3xl font-black font-serif text-white mt-1">
                {roomState.winnerName}
              </h2>
              <p className="text-xs text-stone-400 mt-1">
                Único superviviente en La Cantina del Farol
              </p>
            </div>

            {/* Rematch readiness list for all connected players */}
            <div className="w-full p-3.5 rounded-2xl bg-stone-900/80 border border-stone-800 flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-stone-400">
                <span>Jugadores listos para revancha</span>
                <span className="text-amber-400">
                  {rematchReadySet.size} / {connectedPlayers.length}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {connectedPlayers.map((p) => {
                  const isReady = rematchReadySet.has(p.id);
                  return (
                    <div
                      key={p.id}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all ${
                        isReady
                          ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                          : 'bg-stone-950 border-stone-800 text-stone-400'
                      }`}
                    >
                      <span>{p.avatar}</span>
                      <span>{p.name}</span>
                      {isReady && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Primary Rematch Button for ALL players */}
            <div className="w-full flex flex-col gap-2.5">
              <button
                onClick={onRequestRematch}
                disabled={isLocalReadyForRematch}
                className={`w-full py-3.5 px-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 ${
                  isLocalReadyForRematch
                    ? 'bg-emerald-900/60 border border-emerald-500/50 text-emerald-200 cursor-default'
                    : 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-stone-950 shadow-amber-500/25 active:scale-95'
                }`}
              >
                <RotateCcw
                  className={`w-4 h-4 ${isLocalReadyForRematch ? 'animate-spin' : ''}`}
                />
                {isLocalReadyForRematch
                  ? `ESPERANDO JUGADORES (${rematchReadySet.size}/${connectedPlayers.length})...`
                  : 'VOLVER A JUGAR'}
              </button>

              <div className="w-full flex items-center justify-center gap-2.5">
                <button
                  onClick={onReturnToLobby}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 font-bold text-xs uppercase tracking-wider transition-colors border border-stone-700"
                >
                  Volver a la Sala
                </button>
                <button
                  onClick={() => setShowExitModal(true)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 font-bold text-xs uppercase tracking-wider transition-colors border border-stone-700"
                >
                  Salir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10. EXIT CONFIRMATION MODAL */}
      <CantinaExitModal
        isOpen={showExitModal}
        isInMatch={roomState.phase !== 'LOBBY'}
        onCancel={() => setShowExitModal(false)}
        onReturnToLobby={() => {
          setShowExitModal(false);
          onReturnToLobby();
        }}
        onReturnToMainMenu={() => {
          setShowExitModal(false);
          onLeaveRoom();
        }}
      />
    </div>
  );
};
