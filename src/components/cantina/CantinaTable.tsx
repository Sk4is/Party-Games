import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  CantinaRoomState,
  CantinaPlayer,
  Card,
  CardRank,
  TableRank,
  HandInteractionType,
  CenterPileItem,
  DealCardsEventData,
  RouletteSpinEventData,
} from '../../types/cantina';
import {
  CANTINA_MAP_ASSETS,
  CANTINA_CARD_ASSETS,
  getSeatPovKey,
  resolveCantinaSeatBackground,
  logCantinaMapAssetError,
  logCantinaCardAssetError,
  CantinaMapId,
} from '../../data/cantina/cantinaAssets';
import {
  CANTINA_TABLE_LAYOUTS,
  MAX_VISIBLE_PILE_CARDS,
  getStableCardScatter,
  SeatVisualLayout,
} from '../../data/cantina/cantinaTableLayouts';
import {
  canAppendCardToSelection,
  getCardNumericValue,
  isCircularlyAdjacent,
  isSpecialActionCard,
  nextCircularNumber,
  prevCircularNumber,
  validateCadenaChain,
  findInvalidCardsInSelection,
  sortCadenaHand,
  createShuffledStealSlots,
} from '../../utils/cadenaRules';
import { CardPlayedEventData } from '../../hooks/useCantinaSocket';
import { CantinaCard } from './CantinaCard';
import {
  CantinaCardAnimationLayer,
  TransientCard,
} from './CantinaCardAnimationLayer';
import { CantinaRouletteOverlay } from './CantinaRouletteOverlay';
import { CantinaCadenaRevolverOverlay } from './CantinaCadenaRevolverOverlay';
import { CantinaExitModal } from './CantinaExitModal';
import { CantinaCadenaGuideModal } from './CantinaCadenaGuideModal';
import { CantinaCadenaDrawPile } from './CantinaCadenaDrawPile';
import { CantinaCadenaGameOverOverlay } from './CantinaCadenaGameOverOverlay';
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
  BookOpen,
  Layers,
  Repeat,
  Zap,
  Hand,
  Megaphone,
  Shuffle,
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
  // Cadena mode callbacks:
  onCadenaPlayChain?: (cardIds: string[], playId?: string) => void;
  onCadenaPlaySpecial?: (cardId: string, targetPlayerId?: string, playId?: string) => void;
  onCadenaDrawCard?: () => void;
  onCadenaEndTurn?: () => void;
  onCadenaStealCard?: (targetPlayerId: string, slotIndex: number) => void;
  onCadenaSelectBombTarget?: (targetPlayerId: string) => void;
  onCadenaSelectRevolverTarget?: (targetPlayerId: string) => void;
  onCadenaSpinRevolver: (
    eventId: string,
    velocity: number,
    angle: number,
    spinId: string,
    settled?: boolean
  ) => void;
  onCadenaPullRevolver: (eventId: string) => void;
  onCadenaDeclareUltima?: () => void;
  onCadenaCatchUltima?: () => void;
}

const RANK_LABELS: Record<TableRank, string> = {
  J: 'JOTAS (J)',
  Q: 'REINAS (Q)',
  K: 'REYES (K)',
};

const SPECIAL_CARD_NAMES: Record<string, string> = {
  J: 'SALTO (J)',
  Q: 'REVERSA (Q)',
  K: 'ROBO (K)',
  BOMBA: 'BOMBA',
  ESPEJO: 'ESPEJO',
  REVOLVER: 'REVÓLVER',
};

export const CantinaTable = ({
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
  onCadenaPlayChain,
  onCadenaPlaySpecial,
  onCadenaDrawCard,
  onCadenaEndTurn,
  onCadenaStealCard,
  onCadenaSelectBombTarget,
  onCadenaSelectRevolverTarget,
  onCadenaSpinRevolver,
  onCadenaPullRevolver,
  onCadenaDeclareUltima,
  onCadenaCatchUltima,
}: CantinaTableProps) => {
  const isCadenaMode = roomState.config.mode === 'CADENA';
  const cadenaState = roomState.cadenaState || null;
  const targetInitialDealCount = isCadenaMode ? 7 : 5;

  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [inFlightCardIds, setInFlightCardIds] = useState<string[]>([]);
  const [inFlightDrawnCardIds, setInFlightDrawnCardIds] = useState<string[]>([]);
  const [settlingIntoSortCardIds, setSettlingIntoSortCardIds] = useState<
    Set<string>
  >(() => new Set());
  const [invalidShakeKeysByCardId, setInvalidShakeKeysByCardId] = useState<
    Record<string, number>
  >({});
  const [visualDeckCountOverride, setVisualDeckCountOverride] = useState<
    number | null
  >(null);
  const [isHandHovered, setIsHandHovered] = useState(false);
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showCadenaGuideModal, setShowCadenaGuideModal] = useState(false);
  const [selectedStealRivalId, setSelectedStealRivalId] = useState<string | null>(null);
  const [activeVisualEffect, setActiveVisualEffect] = useState<{
    eventId: string;
    kind: string;
    text: string;
  } | null>(null);

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
    roomState.phase === 'ROUND_INTRO' ? 0 : targetInitialDealCount
  );
  const [flippedCardIndices, setFlippedCardIndices] = useState<Set<number>>(() =>
    roomState.phase === 'ROUND_INTRO'
      ? new Set()
      : new Set(Array.from({ length: 20 }, (_, idx) => idx))
  );
  const [flippingCardIndex, setFlippingCardIndex] = useState<number | null>(null);
  const lastDealtRoundKeyRef = useRef<string>('');
  const lastCadenaEventIdRef = useRef<string>('');
  const lastCadenaDrawEventIdRef = useRef<string>('');

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

  // DOM node references for local hand cards, opponent seats, table pile center, and Cadena draw deck
  const cardElementRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const opponentSeatRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const pileAnchorRef = useRef<HTMLDivElement | null>(null);
  const deckAnchorRef = useRef<HTMLDivElement | null>(null);

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
  const isMandatoryChallenge = Boolean(
    !isCadenaMode && roomState.mandatoryChallenge && roomState.lastPlay
  );

  // 1. Authoritative Map & Independent Seat POV
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

  const aliveOpponents = useMemo(
    () => opponents.filter((o) => o.isAlive),
    [opponents]
  );
  const opponentsWithCards = useMemo(
    () => opponents.filter((o) => o.isAlive && o.cardsCount > 0),
    [opponents]
  );

  // Synchronize default steal target rival when entering K_STEAL_PICK
  useEffect(() => {
    if (!isCadenaMode || !cadenaState) return;
    if (cadenaState.turnSubPhase === 'K_STEAL_PICK') {
      audio.playCardFlip();
      if (
        cadenaState.stealTargetPlayerId &&
        opponentsWithCards.some((o) => o.id === cadenaState.stealTargetPlayerId)
      ) {
        setSelectedStealRivalId(cadenaState.stealTargetPlayerId);
      } else if (opponentsWithCards.length > 0) {
        setSelectedStealRivalId((prev) =>
          prev && opponentsWithCards.some((o) => o.id === prev)
            ? prev
            : opponentsWithCards[0].id
        );
      }
    } else {
      setSelectedStealRivalId(null);
    }
  }, [
    isCadenaMode,
    cadenaState?.turnSubPhase,
    cadenaState?.stealTargetPlayerId,
    opponentsWithCards,
  ]);

  // Auto-select drawn card or stolen card when entering DRAWN_DECISION or K_FOLLOWUP_CHAIN
  useEffect(() => {
    if (!isCadenaMode || !cadenaState || !isMyTurn) return;
    if (cadenaState.turnSubPhase === 'DRAWN_DECISION' && cadenaState.drawnCardId) {
      setSelectedCardIds([cadenaState.drawnCardId]);
    } else if (
      cadenaState.turnSubPhase === 'K_FOLLOWUP_CHAIN' &&
      cadenaState.stolenCardId
    ) {
      setSelectedCardIds([cadenaState.stolenCardId]);
    } else if (
      cadenaState.turnSubPhase === 'K_STEAL_PICK' ||
      cadenaState.turnSubPhase === 'BOMB_SELECT_TARGET' ||
      cadenaState.turnSubPhase === 'BOMB_PASS_TARGET' ||
      cadenaState.turnSubPhase === 'REVOLVER_SELECT_TARGET' ||
      cadenaState.turnSubPhase === 'REVOLVER_DUEL'
    ) {
      setSelectedCardIds([]);
    }
  }, [
    isCadenaMode,
    isMyTurn,
    cadenaState?.turnSubPhase,
    cadenaState?.drawnCardId,
    cadenaState?.stolenCardId,
  ]);

  // Watch Cadena visual events for sound effects & animated table banners
  useEffect(() => {
    if (!isCadenaMode || !cadenaState?.lastEvent) return;
    const ev = cadenaState.lastEvent;
    if (!ev.eventId || ev.eventId === lastCadenaEventIdRef.current) return;
    lastCadenaEventIdRef.current = ev.eventId;

    if (ev.kind === 'MIRROR_REFLECTED') {
      audio.playMirrorReflect();
    } else if (ev.kind === 'BOMB_PLACED' || ev.kind === 'BOMB_TICK') {
      audio.playBombTick();
    } else if (ev.kind === 'BOMB_DEFUSED') {
      audio.playBombDefuse();
    } else if (ev.kind === 'BOMB_EXPLODED') {
      audio.playExplosion();
    } else if (ev.kind === 'REVOLVER_TARGETED') {
      audio.playHammerCock();
    } else if (
      ev.kind === 'ULTIMA_DECLARED' ||
      ev.kind === 'ULTIMA_CAUGHT' ||
      ev.kind === 'ULTIMA_FALSE_ACCUSATION'
    ) {
      audio.playUltimaDeclare();
    } else if (ev.kind === 'K_STEAL' || ev.kind === 'J_SKIP' || ev.kind === 'Q_REVERSE') {
      audio.playCardFlip();
    }

    setActiveVisualEffect({
      eventId: ev.eventId,
      kind: ev.kind,
      text: ev.text,
    });

    const timer = setTimeout(() => {
      setActiveVisualEffect((prev) =>
        prev?.eventId === ev.eventId ? null : prev
      );
    }, 3200);
    return () => clearTimeout(timer);
  }, [isCadenaMode, cadenaState?.lastEvent]);

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

  // Reset submission lock when active turn, subPhase, or round changes
  useEffect(() => {
    isSubmittingPlayRef.current = false;
  }, [
    roomState.activePlayerId,
    roomState.currentRound,
    roomState.phase,
    cadenaState?.turnSubPhase,
    cadenaState?.currentNumber,
  ]);

  // Clear selection when turn leaves local player
  useEffect(() => {
    if (!isMyTurn) {
      setSelectedCardIds([]);
    }
  }, [isMyTurn]);

  // Trigger physical card dealing (face-down -> face-up flip) at the start of each round
  useEffect(() => {
    const roundKey =
      roomState.roundStartEventId ||
      dealCardsEvent?.roundStartEventId ||
      `round_${roomState.currentRound}`;

    if (!roundKey || roundKey === lastDealtRoundKeyRef.current) return;

    const dealTotal = dealCardsEvent?.cardsPerPlayer || targetInitialDealCount;

    // If reconnecting mid-round while already PLAYING and cards have been played, skip deal intro
    if (
      roomState.phase !== 'ROUND_INTRO' &&
      (roomState.centerPileCount > 1 || (roomState.centerPileHistory || []).length > 1)
    ) {
      lastDealtRoundKeyRef.current = roundKey;
      setDealtCardCount(dealTotal);
      setFlippedCardIndices(new Set(Array.from({ length: 30 }, (_, idx) => idx)));
      setFlippingCardIndex(null);
      return;
    }

    lastDealtRoundKeyRef.current = roundKey;
    setDealtCardCount(0);
    setFlippedCardIndices(new Set());
    setFlippingCardIndex(null);

    const timers: ReturnType<typeof setTimeout>[] = [];
    const stepDelay = dealTotal > 5 ? 95 : 125;
    const flipBaseDelay = 120 + dealTotal * stepDelay + 110;
    const flipStepDelay = dealTotal > 5 ? 105 : 145;

    // Step 1: Deal cards face-down into each player's hand
    for (let i = 0; i < dealTotal; i++) {
      timers.push(
        setTimeout(() => {
          setDealtCardCount(i + 1);
          audio.playCardDealt();
        }, 110 + i * stepDelay)
      );
    }

    // Step 2: Flip local player's dealt cards from face-down to face-up one by one
    for (let i = 0; i < dealTotal; i++) {
      const flipStartMs = flipBaseDelay + i * flipStepDelay;
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
          if (i === dealTotal - 1) {
            setFlippingCardIndex(null);
          }
        }, flipStartMs + 85)
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
    dealCardsEvent?.cardsPerPlayer,
    targetInitialDealCount,
  ]);

  // Ensure all cards in hand (including newly drawn/stolen cards in Cadena) are face-up once in PLAYING phase
  useEffect(() => {
    const handLen = (localPlayer?.hand || []).length;
    if (roomState.phase === 'PLAYING') {
      if (dealtCardCount < targetInitialDealCount) {
        const fallbackTimer = setTimeout(() => {
          setDealtCardCount(Math.max(targetInitialDealCount, handLen));
          setFlippedCardIndices(new Set(Array.from({ length: 30 }, (_, idx) => idx)));
          setFlippingCardIndex(null);
        }, 1850);
        return () => clearTimeout(fallbackTimer);
      } else if (handLen > flippedCardIndices.size) {
        setDealtCardCount(handLen);
        setFlippedCardIndices((prev) => {
          const next = new Set(prev);
          for (let idx = 0; idx < handLen + 5; idx++) {
            next.add(idx);
          }
          return next;
        });
      }
    }
  }, [
    roomState.phase,
    dealtCardCount,
    targetInitialDealCount,
    localPlayer?.hand,
    flippedCardIndices.size,
  ]);

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
      const initialLanded = new Set<string>();
      (roomState.centerPileHistory || []).forEach((item) => {
        for (let i = 0; i < item.cardsCount; i++) {
          initialLanded.add(`${item.playId}-${i}`);
        }
      });
      setLandedCardKeys(initialLanded);
      sequenceCounterRef.current = 0;
      if (isNewRound) {
        animatedPlayIdsRef.current = new Set(
          (roomState.centerPileHistory || []).map((item) => item.playId)
        );
        setTopPlayEventBanner(null);
        setInFlightDrawnCardIds([]);
        setVisualDeckCountOverride(null);
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

  // Helper to resolve exact center coordinates of the physical Cadena draw deck
  const getDeckCenterCoords = useCallback(() => {
    if (deckAnchorRef.current) {
      const rect = deckAnchorRef.current.getBoundingClientRect();
      if (rect.width > 0 || rect.height > 0) {
        return {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
      }
    }
    const pileCenter = getPileCenterCoords();
    return {
      x: pileCenter.x - 112,
      y: pileCenter.y,
    };
  }, [getPileCenterCoords]);

  // Watch authoritative Cadena draw events (normal draw, Última +2 penalty, False Última +1 penalty, Bomb +3 explosion, and deck reshuffle)
  useEffect(() => {
    if (!isCadenaMode || !cadenaState?.lastDrawEvent) return;
    const drawEv = cadenaState.lastDrawEvent;
    if (!drawEv.eventId || drawEv.eventId === lastCadenaDrawEventIdRef.current) {
      return;
    }
    lastCadenaDrawEventIdRef.current = drawEv.eventId;

    const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    const deckCoords = getDeckCenterCoords();
    const pileCoords = getPileCenterCoords();

    const newTransients: TransientCard[] = [];
    const reshuffleOffsetMs = drawEv.reshuffled ? 290 : 0;

    // Requirement 15: If the draw pile had to reshuffle from discard pile, animate cards gathering from center pile into the draw deck
    if (drawEv.reshuffled) {
      audio.playDeckReshuffle();
      for (let rIdx = 0; rIdx < 3; rIdx++) {
        const seqZ = ++sequenceCounterRef.current + 120;
        newTransients.push({
          id: `reshuffle_${drawEv.eventId}_${rIdx}`,
          playId: drawEv.eventId,
          cardIndex: rIdx,
          animationKind: 'RESHUFFLE_TO_DECK',
          isFaceDown: true,
          mapId: selectedMapId,
          startX: pileCoords.x + (rIdx - 1) * 14,
          startY: pileCoords.y + (rIdx - 1) * 8,
          startRotZ: (rIdx - 1) * 12,
          startRotX: layout.tablePile.rotateX,
          startScale: layout.tablePile.scale * 0.95,
          targetX: deckCoords.x,
          targetY: deckCoords.y - rIdx * 3,
          targetRotZ: -7,
          targetRotX: layout.tablePile.rotateX,
          targetScaleY: layout.tablePile.scaleY,
          targetScale: layout.tablePile.scale,
          perspectivePx: layout.tablePile.perspectivePx,
          controlPointX: (pileCoords.x + deckCoords.x) / 2,
          controlPointY: Math.min(pileCoords.y, deckCoords.y) - 55 - rIdx * 10,
          delayMs: rIdx * 55,
          durationMs: 250,
          settlingMs: 40,
          zIndex: seqZ,
        });
      }
    }

    // Track visual deck count so layers step down card-by-card as each card departs the deck
    let runningDeckCount = drawEv.drawPileCountBefore;
    setVisualDeckCountOverride(runningDeckCount);

    const isLocalDraw = drawEv.playerId === localPlayerId;
    if (isLocalDraw && drawEv.drawnCardIds && drawEv.drawnCardIds.length > 0) {
      setInFlightDrawnCardIds((prev) => [
        ...prev,
        ...(drawEv.drawnCardIds || []),
      ]);
    }

    // Determine target coordinates (local hand vs opponent seat)
    let targetBaseX = vw / 2;
    let targetBaseY = vh - 125;
    let targetRotZBase = 0;
    let targetRotXBase = 6;
    let targetScaleBase = 1.0;

    if (!isLocalDraw) {
      const oppIdx = opponents.findIndex((o) => o.id === drawEv.playerId);
      const { seatLayout } = getOpponentSeatInfo(
        oppIdx >= 0 ? oppIdx : 0,
        Math.max(opponents.length, 1)
      );
      const seatEl = opponentSeatRefs.current[drawEv.playerId];
      const seatRect = seatEl ? seatEl.getBoundingClientRect() : null;
      targetBaseX =
        seatRect && seatRect.width > 0
          ? seatRect.left + seatRect.width / 2
          : vw * (seatLayout.leftPercent / 100);
      targetBaseY =
        seatRect && seatRect.height > 0
          ? seatRect.top + seatRect.height / 2
          : vh * (seatLayout.topPercent / 100);
      targetRotZBase = seatLayout.rotationZ;
      targetRotXBase = seatLayout.perspectiveTiltX;
      targetScaleBase = seatLayout.scale * 0.78;
    }

    const totalDrawn = Math.max(1, drawEv.count);
    const midIdx = (totalDrawn - 1) / 2;

    for (let i = 0; i < totalDrawn; i++) {
      const drawnCardId = drawEv.drawnCards?.[i]?.id || drawEv.drawnCardIds?.[i];
      const drawnCardObj =
        drawEv.drawnCards?.[i] ||
        (isLocalDraw && drawnCardId
          ? (localPlayer?.hand || []).find((c) => c.id === drawnCardId)
          : undefined);
      const visualId = drawnCardId
        ? `draw_${drawEv.eventId}_${drawnCardId}`
        : `draw_${drawEv.eventId}_${i}`;
      const seqZ = ++sequenceCounterRef.current + 140;

      const spreadOffset = (i - midIdx) * (isLocalDraw ? 38 : 18);
      const targetX = targetBaseX + spreadOffset;
      const targetY = targetBaseY + Math.abs(i - midIdx) * 4;

      newTransients.push({
        id: visualId,
        playId: drawEv.eventId,
        cardIndex: i,
        animationKind: isLocalDraw ? 'DRAW_TO_LOCAL' : 'DRAW_TO_OPPONENT',
        rank: drawnCardObj?.rank,
        isFaceDown: !isLocalDraw,
        mapId: selectedMapId,
        startX: deckCoords.x,
        startY: deckCoords.y - 6,
        startRotZ: -7,
        startRotX: layout.tablePile.rotateX,
        startScale: layout.tablePile.scale,
        targetX,
        targetY,
        targetRotZ: targetRotZBase + (i - midIdx) * 4,
        targetRotX: targetRotXBase,
        targetScaleY: 1,
        targetScale: targetScaleBase,
        perspectivePx: layout.tablePile.perspectivePx,
        controlPointX: (deckCoords.x + targetX) / 2 + (i - midIdx) * 20,
        controlPointY: Math.min(deckCoords.y, targetY) - (65 + i * 10),
        delayMs: reshuffleOffsetMs + i * 155,
        durationMs: isLocalDraw ? 380 : 350,
        settlingMs: 65,
        zIndex: seqZ,
      });
    }

    setAnimatingCards((prev) => [...prev, ...newTransients]);

    const clearOverrideTimer = window.setTimeout(() => {
      setVisualDeckCountOverride(null);
    }, reshuffleOffsetMs + totalDrawn * 155 + 480);

    return () => {
      window.clearTimeout(clearOverrideTimer);
    };
  }, [
    isCadenaMode,
    cadenaState?.lastDrawEvent,
    localPlayerId,
    opponents,
    getOpponentSeatInfo,
    getDeckCenterCoords,
    getPileCenterCoords,
    selectedMapId,
    layout,
  ]);

  // Spawn remote throw animation for a play (strictly deduplicated by playId)
  const triggerRemotePlayAnimation = useCallback(
    (play: {
      playId: string;
      playerId: string;
      cardsCount: number;
      cards?: Card[];
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
        const faceUpCard = play.cards?.[i];

        const seqZ = ++sequenceCounterRef.current + 100;

        remoteCards.push({
          id: visualKey,
          playId: play.playId,
          cardIndex: i,
          rank: faceUpCard?.rank,
          substitutedNumber: faceUpCard?.substitutedNumber,
          isFaceDown: !isCadenaMode,
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
      isCadenaMode,
    ]
  );

  // Trigger remote throw animation when CARD_PLAYED_EVENT arrives
  useEffect(() => {
    if (!cardPlayedEvent) return;
    triggerRemotePlayAnimation({
      playId: cardPlayedEvent.playId,
      playerId: cardPlayedEvent.playerId,
      cardsCount: cardPlayedEvent.cardsCount,
      cards: cardPlayedEvent.cards,
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
        cards: latest.cards,
      });
    }
  }, [roomState.centerPileHistory, triggerRemotePlayAnimation]);

  // Top-center play event message when a turn is played ("TAHONERO JUGÓ 2 CARTAS")
  // Requirement 21: Do NOT show repetitive "X JUGÓ CADENA..." banner in Cadena mode
  const prevLastPlayIdRef = useRef<string | undefined>(roomState.lastPlay?.playId);
  useEffect(() => {
    if (
      roomState.lastPlay &&
      roomState.lastPlay.playId !== prevLastPlayIdRef.current
    ) {
      prevLastPlayIdRef.current = roomState.lastPlay.playId;
      if (isCadenaMode) {
        setTopPlayEventBanner(null);
        return;
      }
      setTopPlayEventBanner(
        `${roomState.lastPlay.playerName.toUpperCase()} JUGÓ ${
          roomState.lastPlay.cardsCount
        } CARTA${roomState.lastPlay.cardsCount > 1 ? 'S' : ''}`
      );
      const timer = setTimeout(() => setTopPlayEventBanner(null), 2900);
      return () => clearTimeout(timer);
    }
  }, [roomState.lastPlay, isCadenaMode]);

  // Requirement 2 & 3: Physical invalid-card shake + muted error SFX (with cooldown)
  const triggerInvalidCardsShake = useCallback((cardIds: string[]) => {
    if (cardIds.length === 0) return;
    audio.playInvalidCardFeedback();
    setInvalidShakeKeysByCardId((prev) => {
      const next = { ...prev };
      cardIds.forEach((cid) => {
        next[cid] = (next[cid] || 0) + 1;
      });
      return next;
    });
  }, []);

  // Selected card objects in exact selection order
  const selectedCardObjects = useMemo(() => {
    const handMap = new Map((localPlayer?.hand || []).map((c) => [c.id, c]));
    return selectedCardIds
      .map((id) => handMap.get(id))
      .filter((c): c is Card => Boolean(c));
  }, [localPlayer?.hand, selectedCardIds]);

  // Validate current Cadena selection for live preview & Joker substitutedNumber annotation
  const cadenaValidation = useMemo(() => {
    if (!isCadenaMode || !cadenaState || selectedCardObjects.length === 0) {
      return null;
    }
    if (selectedCardObjects.length === 1 && isSpecialActionCard(selectedCardObjects[0])) {
      return null;
    }
    return validateCadenaChain(cadenaState.currentNumber, selectedCardObjects);
  }, [isCadenaMode, cadenaState, selectedCardObjects]);

  // Map cardId -> resolved substitutedNumber for selected Jokers
  const resolvedJokerNumbersByCardId = useMemo(() => {
    const map: Record<string, number> = {};
    if (cadenaValidation?.valid && cadenaValidation.resolvedCards) {
      cadenaValidation.resolvedCards.forEach((rc) => {
        if (rc.substitutedNumber !== undefined) {
          map[rc.id] = rc.substitutedNumber;
        }
      });
    }
    return map;
  }, [cadenaValidation]);

  // Card click selection (handles both Clásico/Diablo and Cadena mode)
  const handleCardClick = (cardId: string) => {
    if (
      !isMyTurn ||
      !isLocalAlive ||
      isSubmittingPlayRef.current ||
      isMandatoryChallenge
    ) {
      return;
    }

    // CLÁSICO / DIABLO SELECTION (1 to 3 cards)
    if (!isCadenaMode) {
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
      return;
    }

    // CADENA MODE SELECTION
    if (!cadenaState) return;
    const subPhase = cadenaState.turnSubPhase;
    if (
      subPhase === 'K_STEAL_PICK' ||
      subPhase === 'BOMB_SELECT_TARGET' ||
      subPhase === 'BOMB_PASS_TARGET' ||
      subPhase === 'REVOLVER_SELECT_TARGET' ||
      subPhase === 'REVOLVER_DUEL'
    ) {
      return;
    }

    const hand = localPlayer?.hand || [];
    const clickedCard = hand.find((c) => c.id === cardId);
    if (!clickedCard) return;

    // If in DRAWN_DECISION, only the drawn card (or a 2-card Joker chain with it) can be selected
    if (subPhase === 'DRAWN_DECISION') {
      if (
        cardId !== cadenaState.drawnCardId &&
        !selectedCardIds.includes(cadenaState.drawnCardId || '')
      ) {
        triggerInvalidCardsShake([cardId]);
        return;
      }
    }

    // If already selected: clicking it removes it (and any cards chained after it)
    const existingIdx = selectedCardIds.indexOf(cardId);
    if (existingIdx >= 0) {
      audio.playCardSelect();
      const next = selectedCardIds.slice(0, existingIdx);
      setSelectedCardIds(next);
      onSendHandInteraction(
        'CARD_SELECTED',
        isCadenaMode ? undefined : hoveredCardIndex ?? undefined
      );
      return;
    }

    // If clicking a special action card (J, Q, K, BOMBA, ESPEJO, REVOLVER)
    if (isSpecialActionCard(clickedCard)) {
      if (subPhase === 'K_FOLLOWUP_CHAIN') {
        triggerInvalidCardsShake([cardId]);
        return;
      }
      if (clickedCard.rank === 'ESPEJO' && !localPlayer?.lastReflectableEffectReceived) {
        triggerInvalidCardsShake([cardId]);
        return;
      }
      if (clickedCard.rank === 'K' && opponentsWithCards.length === 0) {
        triggerInvalidCardsShake([cardId]);
        return;
      }
      if (clickedCard.rank === 'BOMBA' && cadenaState.bombHolderPlayerId) {
        triggerInvalidCardsShake([cardId]);
        return;
      }
      if (clickedCard.rank === 'REVOLVER' && aliveOpponents.length === 0) {
        triggerInvalidCardsShake([cardId]);
        return;
      }
      audio.playCardSelect();
      setSelectedCardIds([cardId]);
      onSendHandInteraction(
        'CARD_SELECTED',
        isCadenaMode ? undefined : hoveredCardIndex ?? undefined
      );
      return;
    }

    // Numeric or JOKER card clicked:
    const currentSelectedCards = selectedCardIds
      .map((id) => hand.find((c) => c.id === id))
      .filter((c): c is Card => Boolean(c));

    // Try appending to current chain selection
    if (
      canAppendCardToSelection(
        cadenaState.currentNumber,
        currentSelectedCards,
        clickedCard,
        hand
      )
    ) {
      audio.playCardSelect();
      setSelectedCardIds([...selectedCardIds, cardId]);
      onSendHandInteraction(
        'CARD_SELECTED',
        isCadenaMode ? undefined : hoveredCardIndex ?? undefined
      );
      return;
    }

    // Otherwise, check if clickedCard can start a fresh chain from currentNumber
    if (
      subPhase !== 'K_FOLLOWUP_CHAIN' &&
      canAppendCardToSelection(cadenaState.currentNumber, [], clickedCard, hand)
    ) {
      audio.playCardSelect();
      setSelectedCardIds([cardId]);
      onSendHandInteraction(
        'CARD_SELECTED',
        isCadenaMode ? undefined : hoveredCardIndex ?? undefined
      );
      return;
    }

    // Requirement 1-3: Invalid card selection — do NOT select, shake only this card + play short muted error SFX
    triggerInvalidCardsShake([cardId]);
  };

  // Helper to launch local card throw animation to the center pile
  const launchLocalThrowAnimation = (
    cardsToAnimate: Card[],
    playId: string,
    faceDown: boolean
  ) => {
    animatedPlayIdsRef.current.add(playId);

    const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    const pileCenter = getPileCenterCoords();
    const midIdx = (cardsToAnimate.length - 1) / 2;

    const localTransientCards: TransientCard[] = cardsToAnimate.map((cardObj, idx) => {
      const visualKey = `${playId}-${idx}`;
      const el = cardElementRefs.current[cardObj.id];
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
        rank: cardObj.rank,
        substitutedNumber: cardObj.substitutedNumber,
        isFaceDown: faceDown,
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

    const cardIds = cardsToAnimate.map((c) => c.id);
    setOptimisticPlays((prev) => [
      ...prev,
      {
        playId,
        playerId: localPlayerId,
        playerName: localPlayer?.name || 'Jugador',
        cardsCount: cardsToAnimate.length,
        claimedRank: roomState.tableRank,
        cards: faceDown ? undefined : cardsToAnimate,
        timestamp: Date.now(),
      },
    ]);

    setInFlightCardIds((prev) => [...prev, ...cardIds]);
    setAnimatingCards((prev) => [...prev, ...localTransientCards]);
  };

  // Local physical card throw confirmation for Clásico / Diablo
  const handleConfirmPlay = () => {
    if (
      isCadenaMode ||
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

    const cardObjs = cardsToPlay
      .map((cid) => (localPlayer?.hand || []).find((c) => c.id === cid))
      .filter((c): c is Card => Boolean(c));

    launchLocalThrowAnimation(cardObjs, playId, true);

    onPlayCards(cardsToPlay, playId);
    setSelectedCardIds([]);
    onSendHandInteraction('HAND_IDLE');
  };

  // Confirm numeric chain play in CADENA mode
  const handleConfirmCadenaChain = () => {
    if (
      !isCadenaMode ||
      !cadenaState ||
      !onCadenaPlayChain ||
      isSubmittingPlayRef.current ||
      !isMyTurn ||
      !isLocalAlive
    ) {
      return;
    }

    // Requirement 4: If player reaches CONFIRMAR with an invalid sequence, shake the invalid card(s), play failure SFX, keep valid prefix selected
    if (!cadenaValidation?.valid || !cadenaValidation.resolvedCards) {
      const { invalidCardIds, validPrefixCardIds } =
        findInvalidCardsInSelection(
          cadenaState.currentNumber,
          selectedCardObjects,
          localPlayer?.hand || [],
          cadenaState.turnSubPhase === 'K_FOLLOWUP_CHAIN'
            ? cadenaState.stolenCardId
            : cadenaState.turnSubPhase === 'DRAWN_DECISION'
            ? cadenaState.drawnCardId
            : null
        );
      triggerInvalidCardsShake(
        invalidCardIds.length > 0 ? invalidCardIds : selectedCardIds
      );
      if (validPrefixCardIds.length !== selectedCardIds.length) {
        setSelectedCardIds(validPrefixCardIds);
      }
      return;
    }

    if (
      cadenaState.turnSubPhase === 'K_FOLLOWUP_CHAIN' &&
      cadenaState.stolenCardId &&
      !selectedCardIds.includes(cadenaState.stolenCardId)
    ) {
      triggerInvalidCardsShake(selectedCardIds);
      return;
    }

    isSubmittingPlayRef.current = true;
    const cardsToPlay = [...selectedCardIds];
    const playId = `cad_${localPlayerId}_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 6)}`;

    launchLocalThrowAnimation(cadenaValidation.resolvedCards, playId, false);
    onCadenaPlayChain(cardsToPlay, playId);
    setSelectedCardIds([]);
    onSendHandInteraction('HAND_IDLE');
  };

  // Confirm special action card play in CADENA mode
  const handleConfirmCadenaSpecial = (targetPlayerId?: string) => {
    if (
      !isCadenaMode ||
      !cadenaState ||
      !onCadenaPlaySpecial ||
      isSubmittingPlayRef.current ||
      !isMyTurn ||
      !isLocalAlive ||
      selectedCardObjects.length !== 1
    ) {
      return;
    }

    const specialCard = selectedCardObjects[0];
    if (!isSpecialActionCard(specialCard)) return;

    isSubmittingPlayRef.current = true;
    const playId = `cad_sp_${localPlayerId}_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 6)}`;

    if (specialCard.rank !== 'BOMBA') {
      launchLocalThrowAnimation([specialCard], playId, false);
    }

    onCadenaPlaySpecial(specialCard.id, targetPlayerId, playId);
    setSelectedCardIds([]);
    onSendHandInteraction('HAND_IDLE');
  };

  const handleCardDeparted = useCallback((cardVisualKey: string) => {
    if (cardVisualKey.startsWith('draw_')) {
      setVisualDeckCountOverride((prev) =>
        prev !== null ? Math.max(0, prev - 1) : null
      );
    }
  }, []);

  const handleSpinCadenaRevolver = useCallback(
    (
      eventId: string,
      velocity: number,
      angle: number,
      spinId: string,
      settled?: boolean
    ) => {
      onCadenaSpinRevolver(eventId, velocity, angle, spinId, settled);
    },
    [onCadenaSpinRevolver]
  );

  const handlePullCadenaRevolver = useCallback(
    (eventId: string) => {
      onCadenaPullRevolver(eventId);
    },
    [onCadenaPullRevolver]
  );

  const handleCardAnimationFinished = useCallback((cardVisualKey: string) => {
    if (cardVisualKey.startsWith('draw_')) {
      // Extract drawnCardId if present: `draw_${eventId}_${cardId}`
      let landedId: string | null = null;
      setInFlightDrawnCardIds((prev) => {
        const matched = prev.find((cid) => cardVisualKey.endsWith(`_${cid}`));
        if (matched) landedId = matched;
        return prev.filter((cid) => !cardVisualKey.endsWith(`_${cid}`));
      });
      setAnimatingCards((prev) => prev.filter((c) => c.id !== cardVisualKey));
      if (landedId) {
        const cid = landedId;
        setSettlingIntoSortCardIds((prev) => {
          const next = new Set(prev);
          next.add(cid);
          return next;
        });
        if (typeof window !== 'undefined') {
          window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
              setSettlingIntoSortCardIds((prev) => {
                if (!prev.has(cid)) return prev;
                const next = new Set(prev);
                next.delete(cid);
                return next;
              });
            });
          });
        }
      }
      return;
    }
    if (cardVisualKey.startsWith('reshuffle_')) {
      setAnimatingCards((prev) => prev.filter((c) => c.id !== cardVisualKey));
      return;
    }
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
    onSendHandInteraction('CARD_HOVER', isCadenaMode ? undefined : index);
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
    if (!isCadenaMode && isMyTurn && roomState.lastPlay && isLocalAlive) {
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
      rank?: CardRank;
      substitutedNumber?: number;
      totalPileIndex: number;
    }[] = [];
    let count = 0;
    effectivePileHistory.forEach((item) => {
      for (let i = 0; i < item.cardsCount; i++) {
        const faceUpCard = item.cards?.[i];
        allCards.push({
          visualKey: `${item.playId}-${i}`,
          playId: item.playId,
          cardIndex: i,
          claimedRank: item.claimedRank,
          rank: faceUpCard?.rank,
          substitutedNumber: faceUpCard?.substitutedNumber,
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

  // Filter visible hand cards (subtract in-flight cards during throw or draw, and respect dealing count during ROUND_INTRO)
  // Requirement 1 & 2: In CADENA mode, derive a sorted visual hand (1..10 ascending, then J, Q, K, JOKER, ESPEJO, BOMBA, REVOLVER)
  const visibleHandCards = useMemo(() => {
    const base = (localPlayer?.hand || []).filter(
      (c) =>
        !inFlightCardIds.includes(c.id) && !inFlightDrawnCardIds.includes(c.id)
    );
    const ordered = isCadenaMode ? sortCadenaHand(base) : base;
    if (roomState.phase === 'ROUND_INTRO' || dealtCardCount < targetInitialDealCount) {
      return ordered.slice(0, dealtCardCount);
    }
    return ordered;
  }, [
    localPlayer?.hand,
    inFlightCardIds,
    inFlightDrawnCardIds,
    isCadenaMode,
    roomState.phase,
    dealtCardCount,
    targetInitialDealCount,
  ]);

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

  // Última button state in Cadena mode
  const ultimaWindow = cadenaState?.ultimaWindow || null;
  const isLocalUltimaPending = Boolean(
    isCadenaMode &&
      ultimaWindow &&
      !ultimaWindow.resolved &&
      !ultimaWindow.declared &&
      ultimaWindow.targetPlayerId === localPlayerId
  );
  const isRivalUltimaCatchable = Boolean(
    isCadenaMode &&
      ultimaWindow &&
      !ultimaWindow.resolved &&
      !ultimaWindow.declared &&
      ultimaWindow.targetPlayerId !== localPlayerId
  );

  const handleUltimaButtonClick = () => {
    if (!isCadenaMode || !isLocalAlive || roomState.phase !== 'PLAYING') return;
    if (isLocalUltimaPending) {
      onCadenaDeclareUltima?.();
    } else {
      // Either catches an undeclared rival with 1 card (+2 cards to rival)
      // OR triggers a false accusation penalty (+1 card to local player)!
      onCadenaCatchUltima?.();
    }
  };

  const singleSelectedSpecialCard =
    isCadenaMode &&
    selectedCardObjects.length === 1 &&
    isSpecialActionCard(selectedCardObjects[0])
      ? selectedCardObjects[0]
      : null;

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

      {/* 2. TRANSIENT CARD ANIMATION LAYER (Curved Bézier throw, progressive table tilt & wood settle, plus Cadena draw & reshuffle flights) */}
      <CantinaCardAnimationLayer
        cards={animatingCards}
        onCardDeparted={handleCardDeparted}
        onCardFinished={handleCardAnimationFinished}
      />

      {/* 3. TOP BAR HEADER */}
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
              {isCadenaMode ? 'Partida' : `Ronda ${roomState.currentRound}`}
            </span>
            <span className="text-stone-600">&bull;</span>
            <span
              className={`font-semibold ${
                roomState.config.mode === 'CADENA'
                  ? 'text-sky-300'
                  : 'text-amber-300'
              }`}
            >
              {roomState.config.mode === 'CADENA'
                ? 'Modo Cadena ⛓️'
                : roomState.config.mode === 'DIABLO'
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

        {/* Right Header Controls: GUÍA (in Cadena mode), SALIR, and Volume/Mute control */}
        <div className="flex items-center gap-2 z-10">
          {isCadenaMode && (
            <button
              type="button"
              onClick={() => setShowCadenaGuideModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/60 text-sky-200 text-xs font-black uppercase tracking-wider transition-all shadow-sm"
            >
              <BookOpen className="w-3.5 h-3.5 text-sky-300" />
              <span>📖 Guía</span>
            </button>
          )}

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

      {/* 3B. PROMINENT TOP-LEFT TABLE RULE / CADENA NUMBER PLAQUE */}
      <div className="absolute top-13 sm:top-14 left-3 sm:left-5 z-30 flex flex-col gap-2 pointer-events-none">
        {isCadenaMode && cadenaState ? (
          <div className="flex flex-col gap-1.5 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-2xl bg-stone-950/88 backdrop-blur-md border border-amber-500/65 shadow-[0_12px_30px_rgba(0,0,0,0.88),0_0_18px_rgba(245,158,11,0.16)] min-w-[168px] sm:min-w-[196px]">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-amber-400/95">
                  NÚMERO ACTUAL
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-400/40 text-[9px] font-black text-amber-200 uppercase tracking-wider">
                {cadenaState.turnDirection === 1 ? '↻ Horario' : '↺ Inverso'}
              </span>
            </div>

            <div className="flex items-baseline gap-3 mt-0.5">
              <span className="text-3xl sm:text-4xl font-black font-serif text-amber-100 leading-none drop-shadow-[0_2px_10px_rgba(245,158,11,0.5)]">
                {cadenaState.currentNumber}
              </span>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  Conecta con:
                </span>
                <span className="text-xs sm:text-sm font-black text-emerald-300 tracking-wide">
                  {prevCircularNumber(cadenaState.currentNumber)} o{' '}
                  {nextCircularNumber(cadenaState.currentNumber)}
                </span>
              </div>
            </div>

            <div className="pt-1.5 border-t border-stone-800/90 flex items-center justify-between text-[10px] text-stone-300 font-bold">
              <span>Mazo: {cadenaState.drawPileCount}</span>
              <span>Mesa: {cadenaState.discardPileCount}</span>
            </div>

            {/* Active Bomb Status in HUD */}
            {cadenaState.bombHolderPlayerId && (
              <div className="mt-1 px-2.5 py-1.5 rounded-xl bg-red-950/90 border border-red-500/70 flex items-center gap-2 animate-pulse">
                <img
                  src={CANTINA_CARD_ASSETS.BOMBA}
                  alt="Bomba"
                  onError={() =>
                    logCantinaCardAssetError('BOMBA', CANTINA_CARD_ASSETS.BOMBA)
                  }
                  className="w-6 h-8 object-contain rounded shadow"
                />
                <div className="flex flex-col leading-tight">
                  <span className="text-[9px] font-black uppercase tracking-wider text-red-300">
                    💣 BOMBA ACTIVA
                  </span>
                  <span className="text-[11px] font-black text-amber-200">
                    {cadenaState.bombHolderPlayerName} ({cadenaState.bombTurnsRemaining})
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
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
        )}
      </div>

      {/* 3C. TOP-RIGHT ¡ÚLTIMA! ACTION BUTTON IN CADENA MODE */}
      {isCadenaMode && roomState.phase === 'PLAYING' && isLocalAlive && (
        <div className="absolute top-13 sm:top-14 right-3 sm:right-5 z-30 flex flex-col items-end gap-1.5">
          <button
            type="button"
            onClick={handleUltimaButtonClick}
            className={`px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl font-black text-xs sm:text-sm uppercase tracking-wider transition-all flex items-center gap-2 shadow-2xl border ${
              isLocalUltimaPending
                ? 'bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-500 text-stone-950 border-white ring-4 ring-amber-400/70 animate-bounce scale-105'
                : isRivalUltimaCatchable
                ? 'bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600 text-white border-amber-300 ring-4 ring-rose-500/60 animate-bounce scale-105'
                : 'bg-stone-950/88 hover:bg-stone-900 text-amber-200 border-amber-500/60 hover:border-amber-400 active:scale-95'
            }`}
          >
            <Megaphone className="w-4 h-4 shrink-0" />
            <span>
              {isLocalUltimaPending
                ? '¡GRITAR ÚLTIMA!'
                : isRivalUltimaCatchable
                ? `¡PILLAR A ${ultimaWindow?.targetPlayerName?.toUpperCase()}!`
                : '¡ÚLTIMA!'}
            </span>
          </button>

          {ultimaWindow && ultimaWindow.declared && (
            <div className="px-3 py-1 rounded-xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-[10px] font-black uppercase tracking-wider shadow-lg">
              🔔 {ultimaWindow.targetPlayerName} cantó ¡ÚLTIMA!
            </div>
          )}
        </div>
      )}

      {/* 3D. TOP-CENTER PLAY EVENT & ACTIVE TURN BANNER */}
      <div className="absolute top-13 sm:top-14 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex flex-col items-center gap-1.5 max-w-[90vw]">
        {roomState.phase === 'ROUND_INTRO' && (
          <div className="px-4 py-1.5 rounded-2xl bg-stone-950/90 border border-amber-400/70 text-amber-200 text-xs sm:text-sm font-black uppercase tracking-wider shadow-[0_8px_24px_rgba(0,0,0,0.85)] backdrop-blur-md flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
            <span>
              {isCadenaMode ? 'MODO CADENA' : `RONDA ${roomState.currentRound}`} • EMPIEZA{' '}
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

        {activeVisualEffect && (
          <div className="px-4 py-2 rounded-2xl bg-gradient-to-r from-stone-950/95 via-amber-950/95 to-stone-950/95 border-2 border-amber-400/80 text-amber-100 text-xs sm:text-sm font-black uppercase tracking-wider shadow-[0_0_30px_rgba(245,158,11,0.45)] backdrop-blur-md flex items-center gap-2.5 animate-in zoom-in-95 duration-200">
            {activeVisualEffect.kind === 'MIRROR_REFLECTED' && (
              <img
                src={CANTINA_CARD_ASSETS.ESPEJO}
                alt="Espejo"
                className="w-6 h-8 object-contain rounded"
              />
            )}
            {(activeVisualEffect.kind === 'BOMB_PLACED' ||
              activeVisualEffect.kind === 'BOMB_EXPLODED' ||
              activeVisualEffect.kind === 'BOMB_DEFUSED') && (
              <img
                src={CANTINA_CARD_ASSETS.BOMBA}
                alt="Bomba"
                className="w-6 h-8 object-contain rounded"
              />
            )}
            {(activeVisualEffect.kind === 'REVOLVER_TARGETED' ||
              activeVisualEffect.kind === 'REVOLVER_CLICK' ||
              activeVisualEffect.kind === 'REVOLVER_BANG') && (
              <img
                src={CANTINA_CARD_ASSETS.REVOLVER}
                alt="Revólver"
                className="w-6 h-8 object-contain rounded"
              />
            )}
            <span>{activeVisualEffect.text}</span>
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

          const visibleOppCardsCount =
            roomState.phase === 'ROUND_INTRO'
              ? Math.min(opp.cardsCount, dealtCardCount)
              : opp.cardsCount;

          const oppHasBomb =
            isCadenaMode && cadenaState?.bombHolderPlayerId === opp.id;
          const isBombSelectableRival =
            isCadenaMode &&
            isMyTurn &&
            opp.isAlive &&
            (cadenaState?.turnSubPhase === 'BOMB_SELECT_TARGET' ||
              cadenaState?.turnSubPhase === 'BOMB_PASS_TARGET');
          const isRevolverSelectableRival =
            isCadenaMode &&
            isMyTurn &&
            opp.isAlive &&
            cadenaState?.turnSubPhase === 'REVOLVER_SELECT_TARGET';

          return (
            <div
              key={opp.id}
              onClick={() => {
                if (isBombSelectableRival) {
                  onCadenaSelectBombTarget?.(opp.id);
                } else if (isRevolverSelectableRival) {
                  onCadenaSelectRevolverTarget?.(opp.id);
                }
              }}
              style={{
                position: 'absolute',
                top: `${seatLayout.topPercent}%`,
                left: `${effectiveLeftPercent}%`,
                transform: `translate(-50%, -50%) rotate(${seatLayout.rotationZ}deg)`,
                perspective: '900px',
              }}
              className={`flex flex-col items-center gap-1.5 transition-all duration-300 pointer-events-auto ${
                isBombSelectableRival || isRevolverSelectableRival
                  ? 'cursor-pointer hover:scale-105'
                  : ''
              }`}
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

              {/* Floating Bomb Badge on Opponent's Seat */}
              {oppHasBomb && opp.isAlive && (
                <div
                  style={{
                    transform: `rotate(${-seatLayout.rotationZ}deg)`,
                  }}
                  className="mb-0.5 px-2.5 py-1 rounded-xl bg-red-950/95 border-2 border-red-400 text-amber-200 font-black text-[10px] uppercase tracking-wider shadow-[0_0_22px_rgba(239,68,68,0.85)] flex items-center gap-1.5 animate-pulse z-30"
                >
                  <img
                    src={CANTINA_CARD_ASSETS.BOMBA}
                    alt="Bomba"
                    className="w-4 h-6 object-contain rounded-sm"
                  />
                  <span>💣 BOMBA: {cadenaState?.bombTurnsRemaining}</span>
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
                  {isOppTurn && (
                    <div className="absolute -inset-3 rounded-full bg-amber-400/25 blur-xl animate-pulse pointer-events-none" />
                  )}

                  {Array.from({ length: Math.min(visibleOppCardsCount, 12) }).map(
                    (_, cIdx) => {
                      const renderCount = Math.min(visibleOppCardsCount, 12);
                      const mid = (renderCount - 1) / 2;
                      const offsetFromMid = cIdx - mid;
                      const spreadDeg = isOppHandHovered
                        ? seatLayout.fanRotationStep * 1.3
                        : seatLayout.fanRotationStep * (renderCount > 6 ? 0.78 : 1);
                      const spacingPx = isOppHandHovered
                        ? seatLayout.fanSpacing * 1.25
                        : seatLayout.fanSpacing * (renderCount > 6 ? 0.78 : 1);

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
                    }
                  )}
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

              {/* Opponent Name & Status Badge */}
              <div
                style={{
                  transform: `rotate(${-seatLayout.rotationZ}deg)`,
                }}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs backdrop-blur-md border transition-all duration-300 ${
                  !opp.isAlive
                    ? 'bg-rose-950/50 border-rose-900/50 text-stone-400'
                    : isBombSelectableRival || isRevolverSelectableRival
                    ? 'bg-red-950/95 border-2 border-red-400 text-amber-100 shadow-[0_0_24px_rgba(239,68,68,0.65)] scale-105'
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
                    title={
                      isCadenaMode
                        ? 'Cartas en mano'
                        : 'Recámaras probadas en su revólver personal'
                    }
                    className={`text-[10px] font-mono tabular-nums font-bold px-1.5 py-0.2 rounded border ${
                      isCadenaMode && opp.cardsCount === 1
                        ? 'bg-red-950 text-amber-300 border-red-400 animate-pulse'
                        : 'bg-stone-900/90 text-amber-400/90 border-stone-700/80'
                    }`}
                  >
                    {isCadenaMode
                      ? `${opp.cardsCount} 🃏`
                      : `${opp.revolver?.shotsTaken ?? opp.chamberPulls}/6`}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. CENTER TABLE: PERSISTENT PHYSICAL TABLETOP PILE + CADENA DRAW PILE */}
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
        {/* In CADENA mode, render the physical multi-layer Draw Pile Deck beside the center pile */}
        {isCadenaMode && cadenaState && (
          <CantinaCadenaDrawPile
            drawPileCount={
              visualDeckCountOverride !== null
                ? visualDeckCountOverride
                : cadenaState.drawPileCount
            }
            mapId={selectedMapId}
            canDraw={Boolean(
              isMyTurn && isLocalAlive && cadenaState.turnSubPhase === 'NORMAL'
            )}
            tablePileLayout={layout.tablePile}
            deckAnchorRef={deckAnchorRef}
            onDrawClick={() => {
              onCadenaDrawCard?.();
            }}
          />
        )}

        {visiblePileCards.map((item) => {
          if (
            !landedCardKeys.has(item.visualKey) ||
            animatingCardKeySet.has(item.visualKey)
          ) {
            return null;
          }

          const scatter = getStableCardScatter(item.playId, item.cardIndex);
          const cardRotX = layout.tablePile.rotateX + scatter.rotXDelta;
          const showFaceUp = isCadenaMode && Boolean(item.rank);

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
                rank={item.rank}
                substitutedNumber={item.substitutedNumber}
                isFaceDown={!showFaceUp}
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
        <div className="relative z-40 flex flex-col items-center justify-center gap-2 px-4 mb-2 min-h-[44px] pointer-events-auto max-w-[96vw]">
          {/* CLÁSICO / DIABLO: Mandatory Final-Hand Accusation Alert */}
          {!isCadenaMode && isMyTurn && isMandatoryChallenge && isLocalAlive && (
            <div className="px-4 py-1.5 rounded-xl bg-red-950/95 border border-red-400/80 text-red-200 text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-[0_0_25px_rgba(239,68,68,0.45)] animate-bounce">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                ¡{roomState.lastPlay?.playerName} SE QUEDÓ SIN CARTAS! DEBES ACUSAR ¡FAROL!
              </span>
            </div>
          )}

          {/* CADENA MODE: Local Player Bomb Alert */}
          {isCadenaMode &&
            cadenaState &&
            cadenaState.bombHolderPlayerId === localPlayerId &&
            isLocalAlive && (
              <div className="px-3.5 py-1.5 rounded-2xl bg-red-950/95 border-2 border-red-500 text-amber-100 text-[11px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-2.5 shadow-[0_0_25px_rgba(239,68,68,0.55)]">
                <img
                  src={CANTINA_CARD_ASSETS.BOMBA}
                  alt="Bomba"
                  className="w-5 h-7 object-contain rounded"
                />
                <span>
                  💣 ¡TIENES LA BOMBA ({cadenaState.bombTurnsRemaining} TURNO
                  {cadenaState.bombTurnsRemaining === 1 ? '' : 'S'})! CADENA DE 2 = DESACTIVAR • CADENA DE 3+ = PASARLA
                </span>
              </div>
            )}

          {/* CADENA MODE: Live Chain Preview Pill */}
          {isCadenaMode &&
            cadenaState &&
            isMyTurn &&
            selectedCardObjects.length > 0 &&
            !singleSelectedSpecialCard && (
              <div
                className={`px-3.5 py-1 rounded-xl border text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg backdrop-blur-md ${
                  cadenaValidation?.valid
                    ? 'bg-emerald-950/90 border-emerald-400/80 text-emerald-200'
                    : 'bg-amber-950/90 border-amber-500/70 text-amber-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                {cadenaValidation?.valid && cadenaValidation.resolvedNumbers ? (
                  <span>
                    CADENA: {cadenaState.currentNumber} →{' '}
                    {cadenaValidation.resolvedCards
                      ?.map((c) =>
                        c.rank === 'JOKER'
                          ? `🃏(${c.substitutedNumber})`
                          : c.rank
                      )
                      .join(' → ')}{' '}
                    • NUEVO NÚMERO: {cadenaValidation.newCurrentNumber}
                  </span>
                ) : (
                  <span>
                    🃏 COMODÍN SELECCIONADO • ELIGE LA SIGUIENTE CARTA NUMÉRICA
                  </span>
                )}
              </div>
            )}

          {/* CADENA MODE SUBPHASE: BOMB TARGET SELECTION */}
          {isCadenaMode &&
            cadenaState &&
            isMyTurn &&
            (cadenaState.turnSubPhase === 'BOMB_SELECT_TARGET' ||
              cadenaState.turnSubPhase === 'BOMB_PASS_TARGET') && (
              <div className="p-3 sm:p-4 rounded-2xl bg-stone-950/95 border-2 border-red-500/80 shadow-[0_0_40px_rgba(239,68,68,0.5)] flex flex-col items-center gap-2.5">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider text-amber-200">
                  <img
                    src={CANTINA_CARD_ASSETS.BOMBA}
                    alt="Bomba"
                    className="w-6 h-8 object-contain rounded"
                  />
                  <span>
                    {cadenaState.turnSubPhase === 'BOMB_PASS_TARGET'
                      ? '¡CADENA DE 3+ CARTAS! ELIGE A QUIÉN PASAR LA BOMBA:'
                      : '💣 ELIGE A QUÉ RIVAL COLOCAR LA BOMBA (3 TURNOS):'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {aliveOpponents.map((opp) => (
                    <button
                      key={opp.id}
                      type="button"
                      onClick={() => onCadenaSelectBombTarget?.(opp.id)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 border border-amber-300/60 active:scale-95 transition-all"
                    >
                      <span>{opp.avatar}</span>
                      <span>{opp.name}</span>
                      <span className="text-[10px] opacity-85">
                        ({opp.cardsCount} 🃏)
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

          {/* CADENA MODE SUBPHASE: REVOLVER TARGET SELECTION */}
          {isCadenaMode &&
            cadenaState &&
            isMyTurn &&
            cadenaState.turnSubPhase === 'REVOLVER_SELECT_TARGET' && (
              <div className="p-3 sm:p-4 rounded-2xl bg-stone-950/95 border-2 border-sky-400/85 shadow-[0_0_40px_rgba(56,189,248,0.45)] flex flex-col items-center gap-2.5">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider text-sky-100">
                  <img
                    src={CANTINA_CARD_ASSETS.REVOLVER}
                    alt="Revólver"
                    className="w-6 h-8 object-contain rounded"
                  />
                  <span>
                    🔫 ELIGE A QUÉ RIVAL RETAS AL REVÓLVER (GIRA Y DISPARA):
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {aliveOpponents.map((opp) => (
                    <button
                      key={opp.id}
                      type="button"
                      onClick={() => onCadenaSelectRevolverTarget?.(opp.id)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider shadow-lg flex items-center gap-2 border border-sky-300/60 active:scale-95 transition-all"
                    >
                      <span>{opp.avatar}</span>
                      <span>{opp.name}</span>
                      <span className="text-[10px] opacity-85">
                        ({opp.cardsCount} 🃏)
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

          {/* CADENA MODE SUBPHASE: K STEAL PICK FACE-DOWN CARD (PRIVATELY SHUFFLED) */}
          {isCadenaMode &&
            cadenaState &&
            isMyTurn &&
            cadenaState.turnSubPhase === 'K_STEAL_PICK' && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-stone-950/95 border-2 border-amber-400/85 shadow-[0_0_40px_rgba(245,158,11,0.45)] flex flex-col items-center gap-3 max-w-lg animate-in zoom-in-95 duration-200">
                <div className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-200 flex items-center gap-2">
                  <Hand className="w-4 h-4 text-amber-400" />
                  <span>ROBO (K): ELIGE UNA CARTA BOCA ABAJO DE TU RIVAL</span>
                </div>

                {/* Private shuffle indicator so players know sorted positions cannot leak */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-950/90 border border-sky-400/50 text-[10px] font-black uppercase tracking-wider text-sky-200">
                  <Shuffle className="w-3 h-3 text-sky-400" />
                  <span>Cartas barajadas en privado • Posiciones aleatorias</span>
                </div>

                {/* Rival selector tabs if multiple rivals have cards and not locked by Mirror */}
                {opponentsWithCards.length > 1 && !cadenaState.stealTargetPlayerId && (
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    {opponentsWithCards.map((opp) => (
                      <button
                        key={opp.id}
                        type="button"
                        onClick={() => setSelectedStealRivalId(opp.id)}
                        className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                          selectedStealRivalId === opp.id
                            ? 'bg-amber-500 text-stone-950 border-amber-300'
                            : 'bg-stone-900 text-stone-300 border-stone-700 hover:border-amber-500/50'
                        }`}
                      >
                        {opp.avatar} {opp.name} ({opp.cardsCount})
                      </button>
                    ))}
                  </div>
                )}

                {/* Face-down cards of the target rival to pick from (shuffled slots) */}
                {(() => {
                  const targetRival =
                    opponentsWithCards.find(
                      (o) =>
                        o.id ===
                        (cadenaState.stealTargetPlayerId || selectedStealRivalId)
                    ) || opponentsWithCards[0];

                  if (!targetRival) return null;

                  const displayCount = Math.min(targetRival.cardsCount, 8);
                  const shuffledSlots = createShuffledStealSlots(
                    displayCount,
                    `${cadenaState.stealShuffleSeed || 'kshuf'}_${targetRival.id}`
                  );

                  return (
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-[11px] font-bold text-stone-300">
                        Haz clic en una carta de{' '}
                        <strong className="text-amber-300">
                          {targetRival.name}
                        </strong>{' '}
                        para robarla al azar:
                      </span>
                      <div className="flex flex-wrap items-center justify-center gap-2 py-1">
                        {shuffledSlots.map((slotPermIdx, visualPos) => (
                          <button
                            key={`steal_${cadenaState.stealShuffleSeed || 0}_${slotPermIdx}`}
                            type="button"
                            style={{
                              animationDelay: `${visualPos * 35}ms`,
                            }}
                            onClick={() =>
                              onCadenaStealCard?.(targetRival.id, slotPermIdx)
                            }
                            className="group relative transition-transform hover:-translate-y-2 hover:scale-105 active:scale-95 animate-in fade-in zoom-in-90 duration-200"
                          >
                            <CantinaCard
                              isFaceDown
                              mapId={selectedMapId}
                              size="opponent-side"
                              className="ring-2 ring-amber-400/70 group-hover:ring-amber-300 shadow-xl"
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

          {/* MAIN ACTION BUTTONS ROW */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
            {/* CLÁSICO / DIABLO CONTROLS */}
            {!isCadenaMode && (
              <>
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

                {isMyTurn &&
                  !isMandatoryChallenge &&
                  selectedCardIds.length === 0 &&
                  isLocalAlive && (
                    <div className="px-4 py-1.5 rounded-full bg-stone-950/90 border-2 border-amber-400/80 text-amber-200 text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-[0_0_22px_rgba(245,158,11,0.35)] backdrop-blur-sm whitespace-nowrap">
                      <Crosshair className="w-3.5 h-3.5 text-amber-400 animate-spin shrink-0" />
                      <span>ES TU TURNO • ELIGE DE 1 A 3 CARTAS</span>
                    </div>
                  )}
              </>
            )}

            {/* CADENA MODE CONTROLS */}
            {isCadenaMode && cadenaState && isMyTurn && isLocalAlive && (
              <>
                {/* Confirm Numeric Chain Button */}
                {(cadenaState.turnSubPhase === 'NORMAL' ||
                  cadenaState.turnSubPhase === 'DRAWN_DECISION' ||
                  cadenaState.turnSubPhase === 'K_FOLLOWUP_CHAIN') &&
                  selectedCardObjects.length > 0 &&
                  !singleSelectedSpecialCard && (
                    <button
                      type="button"
                      onClick={handleConfirmCadenaChain}
                      className="py-2.5 px-5 sm:px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-2xl shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border border-amber-300 animate-in zoom-in-95 duration-150 whitespace-nowrap"
                    >
                      <Check className="w-4 h-4 stroke-[3] shrink-0" />
                      <span>
                        JUGAR CADENA ({selectedCardIds.length} CARTA
                        {selectedCardIds.length > 1 ? 'S' : ''})
                      </span>
                    </button>
                  )}

                {/* Confirm Special Action Card Button */}
                {(cadenaState.turnSubPhase === 'NORMAL' ||
                  cadenaState.turnSubPhase === 'DRAWN_DECISION') &&
                  singleSelectedSpecialCard && (
                    <>
                      {singleSelectedSpecialCard.rank === 'K' &&
                      opponentsWithCards.length > 1 ? (
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          {opponentsWithCards.map((opp) => (
                            <button
                              key={opp.id}
                              type="button"
                              onClick={() => handleConfirmCadenaSpecial(opp.id)}
                              className="py-2 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs uppercase tracking-wider shadow-xl flex items-center gap-1.5 border border-amber-300"
                            >
                              <Hand className="w-3.5 h-3.5" />
                              <span>ROBAR (K) A {opp.name}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            handleConfirmCadenaSpecial(
                              singleSelectedSpecialCard.rank === 'K'
                                ? opponentsWithCards[0]?.id
                                : undefined
                            )
                          }
                          className="py-2.5 px-5 sm:px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-2xl shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border border-amber-200 animate-in zoom-in-95 duration-150 whitespace-nowrap"
                        >
                          <Zap className="w-4 h-4 fill-current shrink-0" />
                          <span>
                            {singleSelectedSpecialCard.rank === 'ESPEJO' &&
                            localPlayer?.lastReflectableEffectReceived
                              ? `USAR ESPEJO • REFLEJAR ${localPlayer.lastReflectableEffectReceived.type} A ${localPlayer.lastReflectableEffectReceived.sourcePlayerName}`
                              : `JUGAR ${
                                  SPECIAL_CARD_NAMES[singleSelectedSpecialCard.rank] ||
                                  singleSelectedSpecialCard.rank
                                }`}
                          </span>
                        </button>
                      )}
                    </>
                  )}

                {/* Draw 1 Card Button (in NORMAL subPhase) */}
                {cadenaState.turnSubPhase === 'NORMAL' && (
                  <button
                    type="button"
                    onClick={() => {
                      onCadenaDrawCard?.();
                    }}
                    className="py-2.5 px-4 sm:px-5 rounded-2xl bg-stone-900/95 hover:bg-stone-800 text-amber-200 font-black text-xs sm:text-sm uppercase tracking-wider shadow-xl border border-amber-500/60 hover:border-amber-400 transition-all flex items-center gap-2 active:scale-95 whitespace-nowrap"
                  >
                    <Repeat className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>ROBAR 1 CARTA</span>
                  </button>
                )}

                {/* Keep Drawn / Stolen Card & End Turn Button */}
                {(cadenaState.turnSubPhase === 'DRAWN_DECISION' ||
                  cadenaState.turnSubPhase === 'K_FOLLOWUP_CHAIN') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCardIds([]);
                      onCadenaEndTurn?.();
                    }}
                    className="py-2.5 px-4 sm:px-5 rounded-2xl bg-stone-900/95 hover:bg-stone-800 text-stone-200 font-black text-xs sm:text-sm uppercase tracking-wider shadow-xl border border-stone-600 hover:border-amber-400/60 transition-all flex items-center gap-2 active:scale-95 whitespace-nowrap"
                  >
                    <span>
                      {cadenaState.turnSubPhase === 'K_FOLLOWUP_CHAIN'
                        ? 'GUARDAR CARTA ROBADA Y PASAR'
                        : 'GUARDAR CARTA Y PASAR TURNO'}
                    </span>
                  </button>
                )}
              </>
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
            className="relative flex items-end justify-center pointer-events-auto w-full max-w-[920px] px-6"
          >
            {isMyTurn && (
              <div className="absolute inset-x-16 bottom-6 h-28 rounded-full bg-amber-500/15 blur-2xl pointer-events-none" />
            )}

            {visibleHandCards.map((card, i) => {
              const totalCards = visibleHandCards.length;
              const mid = (totalCards - 1) / 2;
              const offsetFromMid = i - mid;
              const selectedIdx = selectedCardIds.indexOf(card.id);
              const isSelected = selectedIdx >= 0;
              const isCardHovered = hoveredCardIndex === i;

              const isCardFlippedFaceUp = flippedCardIndices.has(i);
              const isCurrentlyFlipping = flippingCardIndex === i;

              const maxAllowedHoverSpacing = Math.min(
                layout.localHand.hoverFanSpacing,
                Math.max(32, (viewportWidth - 140) / Math.max(totalCards, 1))
              );
              const maxAllowedIdleSpacing = Math.min(
                layout.localHand.idleFanSpacing,
                Math.max(20, (viewportWidth - 160) / Math.max(totalCards, 1))
              );

              const spacingPx = isHandHovered
                ? maxAllowedHoverSpacing
                : maxAllowedIdleSpacing;
              const spreadDeg =
                (isHandHovered
                  ? layout.localHand.hoverFanRotation
                  : layout.localHand.idleFanRotation) *
                (totalCards > 7 ? 0.72 : 1);

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
                (totalCards > 7
                  ? layout.localHand.arcDropPx * 0.65
                  : layout.localHand.arcDropPx);

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

              const isSettlingIntoSortedSlot =
                isCadenaMode && settlingIntoSortCardIds.has(card.id);
              const effectiveFanX = isSettlingIntoSortedSlot ? 0 : fanX;
              const effectiveFinalY = isSettlingIntoSortedSlot
                ? finalY - 34
                : finalY;
              const effectiveRot = isSettlingIntoSortedSlot ? 0 : finalRot;
              const effectiveScale = isSettlingIntoSortedSlot
                ? 1.08
                : finalScale;

              const flipScaleX = isCurrentlyFlipping ? 0.08 : 1;
              const zIndex = isSettlingIntoSortedSlot
                ? 50
                : isCardHovered
                ? 45
                : isSelected
                ? 25 + i
                : 10 + i;

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
                    transform: `translate3d(${effectiveFanX}px, ${effectiveFinalY}px, 0) rotate(${effectiveRot}deg) scale(${effectiveScale}) scaleX(${flipScaleX})`,
                    transformOrigin: '50% 88%',
                    zIndex,
                    transition:
                      'transform 310ms cubic-bezier(0.22, 1, 0.36, 1), z-index 0ms',
                    willChange: 'transform',
                  }}
                >
                  <CantinaCard
                    rank={card.rank}
                    substitutedNumber={resolvedJokerNumbersByCardId[card.id]}
                    selectionOrder={
                      isCadenaMode && isSelected ? selectedIdx + 1 : undefined
                    }
                    invalidShakeKey={invalidShakeKeysByCardId[card.id] || 0}
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

        {/* DEDICATED BOTTOM STATUS SAFE AREA */}
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
            {isCadenaMode ? (
              <>
                <span className="font-mono tabular-nums text-amber-400 font-bold">
                  Cartas: {localPlayer?.cardsCount ?? 0}
                </span>
                {localPlayer?.lastReflectableEffectReceived && (
                  <>
                    <span className="text-stone-500">&middot;</span>
                    <span className="text-cyan-300 font-bold">
                      🪞 Espejo listo ({localPlayer.lastReflectableEffectReceived.type} de{' '}
                      {localPlayer.lastReflectableEffectReceived.sourcePlayerName})
                    </span>
                  </>
                )}
              </>
            ) : (
              <span className="font-mono tabular-nums text-amber-400 font-bold">
                Tu Revólver:{' '}
                {localPlayer?.revolver?.shotsTaken ??
                  localPlayer?.chamberPulls ??
                  0}
                /6
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 7A. 5-SECOND DEVIL CARD REVEAL PRESENTATION (Clásico / Diablo) */}
      {roomState.phase === 'DEVIL_REVEAL' && roomState.challengeResult && (
        <div className="fixed inset-0 z-50 bg-gradient-to-b from-red-950/90 via-black/92 to-stone-950/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
          <style>{`
            @keyframes cantinaDevilFloat {
              0%, 100% { transform: translateY(2px); }
              50% { transform: translateY(-6px); }
            }
          `}</style>

          <div
            className="fixed inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at 50% 48%, rgba(239, 68, 68, 0.32) 0%, rgba(147, 51, 234, 0.14) 38%, transparent 72%)',
            }}
          />

          <div className="relative z-10 w-full max-w-xl rounded-3xl bg-gradient-to-b from-[#2b0909] via-[#170606] to-[#0c0505] border-2 border-red-500/80 px-6 py-6 sm:px-8 sm:py-8 shadow-[0_0_90px_rgba(220,38,38,0.65)] flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-950 border border-red-400/70 text-red-200 text-xs font-black uppercase tracking-[0.22em] shadow-lg">
              <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
              ¡CARTA DEL DIABLO REVELADA!
              <Flame className="w-4 h-4 text-amber-400 animate-bounce" />
            </div>

            <h2 className="mt-3.5 sm:mt-4 text-2xl sm:text-4xl font-black font-serif text-amber-100 leading-tight tracking-wide drop-shadow-[0_4px_14px_rgba(220,38,38,0.9)]">
              ¡EL DIABLO DESPIERTA
              <span className="block mt-0.5">EN LA MESA!</span>
            </h2>

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

      {/* 7B. CARD REVELATION SUSPENSE MODAL (Clásico / Diablo) */}
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

      {/* 8. INTERACTIVE RUSSIAN ROULETTE OVERLAY (Clásico / Diablo) */}
      {roomState.phase === 'RULETA' && roomState.rouletteResult && (
        <CantinaRouletteOverlay
          rouletteResult={roomState.rouletteResult}
          localPlayerId={localPlayerId}
          rouletteSpinEvent={rouletteSpinEvent}
          onPullTrigger={onPullTrigger}
          onSpinCylinder={onSpinCylinder}
        />
      )}

      {/* 8B. CADENA SPECIAL CARD REVOLVER OVERLAY (Isolated Cadena Minigame — penalty cards, no death) */}
      {isCadenaMode && cadenaState?.revolverState && (
        <CantinaCadenaRevolverOverlay
          key={cadenaState.revolverState.eventId}
          revolverState={cadenaState.revolverState}
          localPlayerId={localPlayerId}
          interactive={Boolean(
            isLocalAlive &&
              cadenaState.revolverState.shooterPlayerId === localPlayerId
          )}
          rouletteSpinEvent={rouletteSpinEvent}
          onSpinRevolver={handleSpinCadenaRevolver}
          onPullRevolver={handlePullCadenaRevolver}
        />
      )}

      {/* 9. GAME OVER PODIUM & SYNCHRONIZED REMATCH */}
      {roomState.phase === 'GAME_OVER' &&
        (isCadenaMode ? (
          <CantinaCadenaGameOverOverlay
            roomState={roomState}
            localPlayerId={localPlayerId}
            onRequestRematch={onRequestRematch}
            onReturnToLobby={onReturnToLobby}
          />
        ) : (
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
        ))}

      {/* 10. IN-GAME CADENA RULE BOOK MODAL */}
      <CantinaCadenaGuideModal
        isOpen={showCadenaGuideModal}
        onClose={() => setShowCadenaGuideModal(false)}
      />

      {/* 11. EXIT CONFIRMATION MODAL */}
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
