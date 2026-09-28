import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  CantinaRoomState,
  CantinaPlayer,
  TableRank,
  HandInteractionType,
  CenterPileItem,
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
import { Skull, Crosshair, Crown, LogOut, Check } from 'lucide-react';

interface CantinaTableProps {
  roomState: CantinaRoomState;
  localPlayerId: string;
  remoteInteractions: Record<
    string,
    { interaction: HandInteractionType; hoveredIndex?: number }
  >;
  cardPlayedEvent?: CardPlayedEventData | null;
  onPlayCards: (cardIds: string[], playId?: string) => void;
  onChallengeBluff: () => void;
  onTriggerRoulette: () => void;
  onNextRound: () => void;
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
  onPlayCards,
  onChallengeBluff,
  onTriggerRoulette,
  onNextRound,
  onRestartMatch,
  onReturnToLobby,
  onLeaveRoom,
  onSendHandInteraction,
}) => {
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [inFlightCardIds, setInFlightCardIds] = useState<string[]>([]);
  const [isHandHovered, setIsHandHovered] = useState(false);
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [animatingCards, setAnimatingCards] = useState<TransientCard[]>([]);
  const [optimisticPlays, setOptimisticPlays] = useState<CenterPileItem[]>([]);
  const [temporaryToast, setTemporaryToast] = useState<string | null>(null);
  const [viewportWidth, setViewportWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );

  // Track which visual card keys (`${playId}-${cardIndex}`) have finished flying and landed on the table.
  // Seeded on mount with any plays already in roomState.centerPileHistory so reconnecting mid-round
  // displays existing pile cards immediately without replaying old animations.
  const [landedCardKeys, setLandedCardKeys] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    (roomState.centerPileHistory || []).forEach((item) => {
      for (let i = 0; i < item.cardsCount; i++) {
        initial.add(`${item.playId}-${i}`);
      }
    });
    return initial;
  });

  // Authoritative deduplication set of processed playIds so a play NEVER animates more than once
  const animatedPlayIdsRef = useRef<Set<string>>(
    new Set((roomState.centerPileHistory || []).map((item) => item.playId))
  );
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
  const isHost = localPlayer?.isHost ?? false;
  const isMyTurn =
    roomState.activePlayerId === localPlayerId && roomState.phase === 'PLAYING';
  const isLocalAlive = localPlayer?.isAlive ?? false;

  // 1. Authoritative Map & Independent Seat POV
  // Strict specification for POV mapping:
  // PLAYER 1 / HOST (seatIndex 0) -> POV1
  // PLAYER 2 (seatIndex 1)        -> POV3
  // PLAYER 3 (seatIndex 2)        -> POV2
  // PLAYER 4 (seatIndex 3)        -> POV4
  const selectedMapId: CantinaMapId = roomState.config.mapId;
  const mapDef = CANTINA_MAP_ASSETS[selectedMapId];
  const seatIndex = localPlayer?.seatIndex ?? 0;
  const povKey = getSeatPovKey(seatIndex);
  const povImageSrc = resolveCantinaSeatBackground(selectedMapId, seatIndex);

  // Visual layout tuning values for current map
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

      // If this play belongs to the local player (e.g. fallback where playId wasn't matched),
      // mark its cards as landed and do not spawn a duplicate remote animation.
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

      // Prefer exact DOM coordinates of the opponent's hand fan on the viewer's screen
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

  // Temporary toast when a turn is played
  const prevLastPlayIdRef = useRef<string | undefined>(roomState.lastPlay?.playId);
  useEffect(() => {
    if (
      roomState.lastPlay &&
      roomState.lastPlay.playId !== prevLastPlayIdRef.current
    ) {
      prevLastPlayIdRef.current = roomState.lastPlay.playId;
      setTemporaryToast(
        `${roomState.lastPlay.playerName} jugó ${roomState.lastPlay.cardsCount} carta${
          roomState.lastPlay.cardsCount > 1 ? 's' : ''
        }`
      );
      const timer = setTimeout(() => setTemporaryToast(null), 2400);
      return () => clearTimeout(timer);
    }
  }, [roomState.lastPlay]);

  // Card click selection
  const handleCardClick = (cardId: string) => {
    if (!isMyTurn || !isLocalAlive || isSubmittingPlayRef.current) return;
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
      !isLocalAlive
    ) {
      return;
    }

    isSubmittingPlayRef.current = true;
    const cardsToPlay = [...selectedCardIds];
    const playId = `play_${localPlayerId}_r${roomState.currentRound}_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 6)}`;

    // 1. Mark this playId as animated so server confirmation / CARD_PLAYED_EVENT never re-triggers it
    animatedPlayIdsRef.current.add(playId);

    const vw = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    const pileCenter = getPileCenterCoords();
    const midIdx = (cardsToPlay.length - 1) / 2;

    // 2. Capture exact DOM center geometry of each selected card in the local player's hand
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
        isFaceDown: true, // Thrown face down onto the wooden tabletop
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

    // 3. Optimistically register the play in pile history so the moment each card finishes settling,
    // its persistent table representation is ready in the exact same frame
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

    // 4. Hide thrown cards from hand and launch their flight
    setInFlightCardIds((prev) => [...prev, ...cardsToPlay]);
    setAnimatingCards((prev) => [...prev, ...localTransientCards]);

    // 5. Send authoritative play with the shared playId
    onPlayCards(cardsToPlay, playId);
    setSelectedCardIds([]);
    onSendHandInteraction('HAND_IDLE');
  };

  // Seamless handoff: in the exact same React render batch, mark the card as landed in the
  // persistent table pile and remove its flying transient card.
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
  // (retaining the newest MAX_VISIBLE_PILE_CARDS = 15 cards while culling oldest bottom cards)
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

  // Filter visible hand cards (subtract in-flight cards during throw)
  const visibleHandCards = useMemo(() => {
    return (localPlayer?.hand || []).filter(
      (c) => !inFlightCardIds.includes(c.id)
    );
  }, [localPlayer?.hand, inFlightCardIds]);

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

      {/* 3. TOP HUD: TABLE RULE (COMPACT, DOES NOT COVER TABLE) */}
      <header className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-4 py-2 bg-black/40 backdrop-blur-sm border-b border-amber-900/30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 bg-stone-950/80 border border-amber-700/40 rounded-xl shadow-md">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
              SALA:
            </span>
            <span className="text-xs font-mono font-black text-amber-400 tracking-wider">
              {roomState.code}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-stone-950/60 border border-stone-800 rounded-xl text-xs text-stone-300">
            <span>Ronda {roomState.currentRound}</span>
            <span className="text-stone-600">&bull;</span>
            <span className="font-semibold text-amber-300">
              {roomState.config.mode === 'DIABLO'
                ? 'Modo Diablo 😈'
                : 'Modo Clásico'}
            </span>
            <span className="text-stone-600">&bull;</span>
            <span className="text-stone-400 text-[11px]">{mapDef.name}</span>
          </div>
        </div>

        {/* COMPACT TOP-CENTRE TABLE RULE HUD */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-stone-950/85 border border-amber-500/50 shadow-xl shadow-amber-500/10 backdrop-blur-md">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
            MESA:
          </span>
          <span className="text-xs sm:text-sm font-black font-serif text-amber-300 tracking-wider">
            {RANK_LABELS[roomState.tableRank]}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowExitModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-stone-700/60 text-stone-300 text-xs font-semibold transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Salir
          </button>
        </div>
      </header>

      {/* 4. OPPONENTS AROUND THE TABLE (CHAIR-ALIGNED, SEAT PERSPECTIVE, HIERARCHICAL SIZING) */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {opponents.map((opp, oppIndex) => {
          const isOppTurn =
            roomState.activePlayerId === opp.id &&
            roomState.phase === 'PLAYING';
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

          // Responsive clamp for side opponents on narrow screens
          const effectiveLeftPercent =
            viewportWidth < 640
              ? seatRole === 'left'
                ? 17
                : seatRole === 'right'
                ? 83
                : seatLayout.leftPercent
              : seatLayout.leftPercent;

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
              className="flex flex-col items-center gap-2 transition-all duration-300 pointer-events-auto"
            >
              {/* Opponent Card Backs Fan (No HUD rectangle behind the hand) */}
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
                  {Array.from({ length: opp.cardsCount }).map((_, cIdx) => {
                    const mid = (opp.cardsCount - 1) / 2;
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
                          className="shadow-xl shadow-black/85"
                        />
                      </div>
                    );
                  })}
                  {opp.cardsCount === 0 && (
                    <span className="text-[10px] text-stone-400/80 font-bold uppercase tracking-wider">
                      Sin cartas
                    </span>
                  )}
                </div>
              ) : (
                <div className="p-2 rounded-full bg-stone-950/80 border border-rose-900/60 text-xl shadow">
                  💀
                </div>
              )}

              {/* Minimal Opponent Name & Chamber Indicator */}
              <div
                className={`flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs backdrop-blur-md border ${
                  !opp.isAlive
                    ? 'bg-rose-950/40 border-rose-900/40 text-stone-400'
                    : isOppTurn
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-md shadow-amber-400/20 animate-pulse'
                    : 'bg-black/65 border-stone-800/90 text-stone-200'
                }`}
              >
                <span className="font-bold flex items-center gap-1 text-[11px] whitespace-nowrap">
                  {opp.avatar} {opp.name}
                  {opp.isHost && <Crown className="w-3 h-3 text-amber-400" />}
                </span>
                {opp.isAlive && (
                  <span className="text-[10px] font-mono tabular-nums text-amber-400/90 font-bold px-1.5 py-0.2 rounded bg-stone-900/80 border border-stone-800">
                    {opp.chamberPulls}/6
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
          // Wait to display each card in the persistent pile until its flight/settle completes
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

        {/* Temporary play notice toast above the table pile */}
        {temporaryToast && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1 rounded-full bg-black/85 border border-amber-600/45 text-amber-300 text-xs font-semibold whitespace-nowrap shadow-lg backdrop-blur-sm animate-in fade-in duration-200">
            {temporaryToast}
          </div>
        )}
      </div>

      {/* 6. LOCAL PLAYER ZONE (CLEAR PHYSICAL VERTICAL SEPARATION: TURN MESSAGE -> ACTION CONTROLS -> HAND FAN) */}
      <div className="absolute bottom-0 inset-x-0 z-20 flex flex-col items-center pointer-events-none pb-2 sm:pb-3">
        {/* Action Controls & Turn Prompt Bar — physically above the maximum raised card height */}
        <div className="relative z-40 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 px-4 mb-2 sm:mb-3 min-h-[42px] pointer-events-auto">
          {/* CHALLENGE BLUFF BUTTON ("¡FAROL!") */}
          {isMyTurn && roomState.lastPlay && isLocalAlive && (
            <button
              onClick={handleChallenge}
              className="py-2.5 px-5 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-2xl shadow-rose-600/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border border-rose-400/40 whitespace-nowrap"
            >
              <Skull className="w-4 h-4 shrink-0" /> ¡FAROL!
            </button>
          )}

          {/* CONFIRM PLAY BUTTON (Appears when 1-3 cards selected, unobstructed by raised cards) */}
          {isMyTurn && selectedCardIds.length > 0 && isLocalAlive && (
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
          {isMyTurn && selectedCardIds.length === 0 && isLocalAlive && (
            <div className="px-4 py-1.5 rounded-full bg-stone-950/90 border border-amber-500/45 text-amber-300 text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg backdrop-blur-sm animate-pulse whitespace-nowrap">
              <Crosshair className="w-3.5 h-3.5 shrink-0" /> Es tu turno: elige
              de 1 a 3 cartas
            </div>
          )}
        </div>

        {/* Physical Hand Fan Container — sized to include full card height + top lift headroom so cards never overlap buttons above */}
        {isLocalAlive ? (
          <div
            onMouseEnter={handleHandMouseEnter}
            onMouseLeave={handleHandMouseLeave}
            style={{
              height: 'calc(clamp(138px, 17.6vh, 178px) + 42px)',
            }}
            className="relative flex items-end justify-center pointer-events-auto w-full max-w-[640px] px-6 pb-1"
          >
            {visibleHandCards.map((card, i) => {
              const totalCards = visibleHandCards.length;
              const mid = (totalCards - 1) / 2;
              const offsetFromMid = i - mid;
              const isSelected = selectedCardIds.includes(card.id);
              const isCardHovered = hoveredCardIndex === i;

              // Responsive horizontal spacing so cards spread generously on hover without overflowing narrow viewports
              const maxAllowedHoverSpacing = Math.min(
                layout.localHand.hoverFanSpacing,
                Math.max(40, (viewportWidth - 130) / Math.max(totalCards, 1))
              );
              const maxAllowedIdleSpacing = Math.min(
                layout.localHand.idleFanSpacing,
                Math.max(24, (viewportWidth - 150) / Math.max(totalCards, 1))
              );

              const spacingPx = isHandHovered
                ? maxAllowedHoverSpacing
                : maxAllowedIdleSpacing;
              const spreadDeg = isHandHovered
                ? layout.localHand.hoverFanRotation
                : layout.localHand.idleFanRotation;

              // Subtle neighbor separation away from the hovered card to reduce overlap
              let neighborPushX = 0;
              if (hoveredCardIndex !== null && hoveredCardIndex !== i) {
                const diff = i - hoveredCardIndex;
                const distanceAttenuation = 1 / Math.abs(diff);
                neighborPushX =
                  Math.sign(diff) *
                  layout.localHand.neighborHoverPushPx *
                  distanceAttenuation;
              }

              // Single composed transform: fan translation + neighbor separation + arc + selection lift + hover lift + rotation + scale
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
                    bottom: '6px',
                    transform: `translate3d(${fanX}px, ${finalY}px, 0) rotate(${finalRot}deg) scale(${finalScale})`,
                    transformOrigin: '50% 88%',
                    zIndex,
                    transition:
                      'transform 220ms cubic-bezier(0.22, 1, 0.36, 1), z-index 0ms',
                    willChange: 'transform',
                  }}
                >
                  <CantinaCard
                    rank={card.rank}
                    mapId={selectedMapId}
                    selected={isSelected}
                    onClick={() => handleCardClick(card.id)}
                    size="hand"
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-3 px-5 rounded-2xl bg-black/80 border border-stone-800 text-stone-400 text-xs font-semibold backdrop-blur-sm pointer-events-auto flex items-center gap-2 mb-2">
            <Skull className="w-4 h-4 text-rose-500" /> Has sido eliminado.
            Observando la cantina...
          </div>
        )}

        {/* Local player status line */}
        <div className="flex items-center gap-2 mt-1 pointer-events-auto text-[11px] text-stone-400 font-medium">
          <span className="font-bold text-stone-200">
            {localPlayer?.avatar} {localPlayer?.name}
          </span>
          <span className="text-stone-600">&bull;</span>
          <span className="font-mono tabular-nums text-amber-400/90 font-bold">
            Tambor: {localPlayer?.chamberPulls ?? 0}/6
          </span>
        </div>
      </div>

      {/* 7. CARD REVELATION SUSPENSE MODAL */}
      {roomState.phase === 'REVELACION' && roomState.challengeResult && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-stone-950 border border-amber-600/50 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center gap-5">
            <span className="text-xs font-black uppercase tracking-widest text-amber-400">
              RESOLUCIÓN DE LA ACUSACIÓN
            </span>

            <h2 className="text-2xl sm:text-3xl font-black font-serif text-white">
              {roomState.challengeResult.isBluff ? (
                <span className="text-rose-500">¡FAROL DETECTADO!</span>
              ) : (
                <span className="text-emerald-400">¡ERA LA VERDAD!</span>
              )}
            </h2>

            {/* Revealed Cards - Pure images, zero fake HTML text */}
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

            <p className="text-sm text-stone-300 leading-relaxed font-medium">
              {roomState.challengeResult.description}
            </p>

            <div className="w-full pt-3 border-t border-stone-800 flex items-center justify-center gap-2 text-xs font-bold text-amber-400">
              <Crosshair className="w-4 h-4 animate-spin" /> Pasando a la Ruleta
              Rusa...
            </div>
          </div>
        </div>
      )}

      {/* 8. SYNCHRONIZED ROULETTE EVENT OVERLAY */}
      {roomState.phase === 'RULETA' && roomState.rouletteResult && (
        <CantinaRouletteOverlay rouletteResult={roomState.rouletteResult} />
      )}

      {/* 9. GAME OVER PODIUM */}
      {roomState.phase === 'GAME_OVER' && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md bg-stone-950 border border-amber-500/60 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center gap-6">
            <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-4xl shadow-xl shadow-amber-500/20">
              👑
            </div>

            <div>
              <span className="text-xs font-black uppercase tracking-widest text-amber-400">
                FIN DE LA PARTIDA
              </span>
              <h2 className="text-3xl font-black font-serif text-white mt-1">
                {roomState.winnerName}
              </h2>
              <p className="text-xs text-stone-400 mt-1">
                Único superviviente en La Cantina del Farol
              </p>
            </div>

            <div className="w-full flex items-center justify-center gap-3">
              {isHost && (
                <button
                  onClick={onRestartMatch}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-sm uppercase tracking-wider transition-all shadow-lg"
                >
                  Nueva Partida
                </button>
              )}
              <button
                onClick={() => setShowExitModal(true)}
                className="flex-1 py-3 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-sm uppercase tracking-wider transition-colors border border-stone-700"
              >
                Salir
              </button>
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
