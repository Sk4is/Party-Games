import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  CantinaRoomState,
  CantinaPlayer,
  TableRank,
  HandInteractionType,
} from '../../types/cantina';
import { CANTINA_MAPS, getSeatPovNumber } from '../../data/cantina/maps';
import { CantinaCard } from './CantinaCard';
import { CantinaCardAnimationLayer, TransientCard } from './CantinaCardAnimationLayer';
import { CantinaRouletteOverlay } from './CantinaRouletteOverlay';
import { CantinaExitModal } from './CantinaExitModal';
import { audio } from '../../utils/audio';
import { Skull, Crosshair, Crown, LogOut, Check } from 'lucide-react';

interface CantinaTableProps {
  roomState: CantinaRoomState;
  localPlayerId: string;
  remoteInteractions: Record<string, { interaction: HandInteractionType; hoveredIndex?: number }>;
  onPlayCards: (cardIds: string[]) => void;
  onChallengeBluff: () => void;
  onTriggerRoulette: () => void;
  onNextRound: () => void;
  onRestartMatch: () => void;
  onReturnToLobby: () => void;
  onLeaveRoom: () => void;
  onSendHandInteraction: (interaction: HandInteractionType, hoveredIndex?: number) => void;
}

const RANK_LABELS: Record<TableRank, string> = {
  J: 'JOTAS (J)',
  Q: 'REINAS (Q)',
  K: 'REYES (K)',
};

// Deterministic hash to offset cards in central stack without Math.random()
function getDeterministicCardOffset(seed: string, index: number) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const rotSeed = Math.sin(hash + index * 997) * 9; // -9 to +9 deg
  const xSeed = Math.cos(hash + index * 733) * 12; // -12 to +12 px
  const ySeed = Math.sin(hash + index * 421) * 8; // -8 to +8 px
  return { rot: rotSeed, x: xSeed, y: ySeed };
}

export const CantinaTable: React.FC<CantinaTableProps> = ({
  roomState,
  localPlayerId,
  remoteInteractions,
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
  const [isHandHovered, setIsHandHovered] = useState(false);
  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null);
  const [showExitModal, setShowExitModal] = useState(false);
  const [bgLoadError, setBgLoadError] = useState(false);
  const [animatingCards, setAnimatingCards] = useState<TransientCard[]>([]);
  const [temporaryToast, setTemporaryToast] = useState<string | null>(null);

  const localPlayer = roomState.players.find((p) => p.id === localPlayerId);
  const isHost = localPlayer?.isHost ?? false;
  const isMyTurn = roomState.activePlayerId === localPlayerId && roomState.phase === 'PLAYING';
  const isLocalAlive = localPlayer?.isAlive ?? false;

  const mapDef = CANTINA_MAPS[roomState.config.mapId] || CANTINA_MAPS.mapa3;

  // Derive POV image for local player according to strict mapping:
  // PLAYER 1 / HOST -> POV1
  // PLAYER 2        -> POV3
  // PLAYER 3        -> POV2
  // PLAYER 4        -> POV4
  const povNum = getSeatPovNumber(localPlayer?.seatIndex ?? 0);
  const mapNum = roomState.config.mapId === 'mapa1' ? 1 : roomState.config.mapId === 'mapa2' ? 2 : 3;
  const povImageSrc = bgLoadError
    ? `/assets/mapas/mapa3/map3pov${povNum}.png`
    : `/assets/mapas/mapa${mapNum}/map${mapNum}pov${povNum}.png`;

  // Brief temporary toast when a turn is played
  const prevLastPlayRef = useRef(roomState.lastPlay);
  useEffect(() => {
    if (roomState.lastPlay && roomState.lastPlay.playId !== prevLastPlayRef.current?.playId) {
      prevLastPlayRef.current = roomState.lastPlay;
      setTemporaryToast(
        `${roomState.lastPlay.playerName} jugó ${roomState.lastPlay.cardsCount} carta${
          roomState.lastPlay.cardsCount > 1 ? 's' : ''
        }`
      );
      const timer = setTimeout(() => setTemporaryToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [roomState.lastPlay]);

  // Opponents around table
  const opponents = useMemo(() => {
    return roomState.players.filter((p) => p.id !== localPlayerId);
  }, [roomState.players, localPlayerId]);

  // Card selection
  const handleCardClick = (cardId: string) => {
    if (!isMyTurn || !isLocalAlive) return;
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

  const handleConfirmPlay = () => {
    if (selectedCardIds.length >= 1 && selectedCardIds.length <= 3 && isMyTurn && isLocalAlive) {
      // Trigger local throw animation
      const cardsToAnimate = selectedCardIds.map((cid, idx) => {
        const found = (localPlayer?.hand || []).find((c) => c.id === cid);
        const vw = typeof window !== 'undefined' ? window.innerWidth : 1000;
        const vh = typeof window !== 'undefined' ? window.innerHeight : 800;

        return {
          id: `throw_local_${cid}_${Date.now()}`,
          rank: found?.rank,
          isFaceDown: true, // Face down when thrown onto center table
          mapId: roomState.config.mapId,
          startX: vw / 2 - 40 + (idx - 1) * 30,
          startY: vh - 110,
          targetX: vw / 2 - 35 + (idx - 1) * 12,
          targetY: vh / 2 - 45,
          startScale: 1.05,
          targetScale: 0.78,
          startRot: (idx - 1) * 6,
          targetRot: (idx - 1) * 8 + Math.sin(idx) * 4,
          delayMs: idx * 60,
          durationMs: 380,
        };
      });

      setAnimatingCards((prev) => [...prev, ...cardsToAnimate]);
      onPlayCards(selectedCardIds);
      setSelectedCardIds([]);
      onSendHandInteraction('HAND_IDLE');
    }
  };

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

  // Compile all persistent pile cards from history
  const flattenedPile = useMemo(() => {
    const list: { playId: string; cardIndex: number; claimedRank: TableRank }[] = [];
    (roomState.centerPileHistory || []).forEach((item) => {
      for (let i = 0; i < item.cardsCount; i++) {
        list.push({
          playId: item.playId,
          cardIndex: i,
          claimedRank: item.claimedRank,
        });
      }
    });
    return list;
  }, [roomState.centerPileHistory]);

  const activePlayer = roomState.players[roomState.activePlayerIndex];

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden select-none bg-[#0c0a09] text-stone-100 font-sans z-0">
      {/* 1. IMMERSIVE MAP POV BACKGROUND (FULL COVER, NO SKEW, NO BLUE STRIP) */}
      <img
        src={povImageSrc}
        alt="Cantina POV"
        onError={() => {
          if (!bgLoadError) setBgLoadError(true);
        }}
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none z-0"
      />

      {/* Atmospheric lighting gradient overlay (pure charcoal/amber noir, zero blue) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/60 pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.75)_100%)] pointer-events-none z-0" />

      {/* 2. TRANSIENT CARD ANIMATION LAYER */}
      <CantinaCardAnimationLayer
        cards={animatingCards}
        onCardFinished={(cardId) => {
          setAnimatingCards((prev) => prev.filter((c) => c.id !== cardId));
        }}
      />

      {/* 3. TOP HUD: TABLE RULE (COMPACT, DOES NOT COVER TABLE) & EXIT BUTTON */}
      <header className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-4 py-2.5 bg-black/40 backdrop-blur-sm border-b border-amber-900/30">
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
              {roomState.config.mode === 'DIABLO' ? 'Modo Diablo 😈' : 'Modo Clásico'}
            </span>
          </div>
        </div>

        {/* COMPACT TOP-CENTRE TABLE RULE HUD */}
        <div className="flex items-center gap-2.5 px-4 py-1.5 rounded-2xl bg-stone-950/85 border border-amber-500/50 shadow-xl shadow-amber-500/10 backdrop-blur-md">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[11px] font-bold text-stone-400 uppercase tracking-widest">
            REGLA DE LA MESA:
          </span>
          <span className="text-sm font-black font-serif text-amber-300 tracking-wider">
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

      {/* 4. OPPONENTS AROUND THE TABLE (NO GIANT PANELS, ONLY CARD BACKS & SMALL NAME) */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {opponents.map((opp, oppIndex) => {
          const isOppTurn = roomState.activePlayerId === opp.id && roomState.phase === 'PLAYING';
          const oppInteraction = remoteInteractions[opp.id];
          const isOppHandHovered =
            oppInteraction?.interaction === 'HAND_HOVER' ||
            oppInteraction?.interaction === 'CARD_HOVER' ||
            oppInteraction?.interaction === 'CARD_SELECTED';

          // Perspective positioning based on count of opponents
          let posClasses = '';
          let fanRot = 0;
          let scaleFactor = 0.8;

          if (opponents.length === 1) {
            // 2-player game: Single opponent is FAR (top center)
            posClasses = 'top-14 left-1/2 -translate-x-1/2';
            fanRot = 180;
            scaleFactor = 0.72;
          } else if (opponents.length === 2) {
            // 3-player game: Left and Right
            if (oppIndex === 0) {
              posClasses = 'top-24 left-6 sm:left-12';
              fanRot = 45;
              scaleFactor = 0.76;
            } else {
              posClasses = 'top-24 right-6 sm:right-12';
              fanRot = -45;
              scaleFactor = 0.76;
            }
          } else {
            // 4-player game: Left, Far, Right
            if (oppIndex === 0) {
              posClasses = 'top-32 left-4 sm:left-10';
              fanRot = 60;
              scaleFactor = 0.75;
            } else if (oppIndex === 1) {
              posClasses = 'top-14 left-1/2 -translate-x-1/2';
              fanRot = 180;
              scaleFactor = 0.72;
            } else {
              posClasses = 'top-32 right-4 sm:right-10';
              fanRot = -60;
              scaleFactor = 0.75;
            }
          }

          return (
            <div
              key={opp.id}
              className={`absolute flex flex-col items-center gap-1.5 transition-all duration-300 pointer-events-auto ${posClasses}`}
            >
              {/* Opponent Card Backs Fan (Live Reaction when remote player hovers) */}
              {opp.isAlive ? (
                <div
                  className="flex items-center justify-center -space-x-4 transition-all duration-200"
                  style={{
                    transform: `scale(${scaleFactor})`,
                  }}
                >
                  {Array.from({ length: opp.cardsCount }).map((_, cIdx) => {
                    const mid = (opp.cardsCount - 1) / 2;
                    const spread = isOppHandHovered ? 7 : 4;
                    const rot = (cIdx - mid) * spread;
                    const lift =
                      isOppHandHovered && oppInteraction?.hoveredIndex === cIdx ? -14 : 0;

                    return (
                      <div
                        key={cIdx}
                        style={{
                          transform: `rotate(${rot}deg) translateY(${lift}px)`,
                          transition: 'transform 180ms ease-out',
                        }}
                      >
                        <CantinaCard
                          isFaceDown
                          mapId={roomState.config.mapId}
                          size="sm"
                          className="shadow-xl"
                        />
                      </div>
                    );
                  })}
                  {opp.cardsCount === 0 && (
                    <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">
                      Sin cartas
                    </span>
                  )}
                </div>
              ) : (
                <div className="p-2 rounded-full bg-stone-950/80 border border-rose-900/60 text-xl shadow">
                  💀
                </div>
              )}

              {/* Minimal Player Name & Roulette Counter */}
              <div
                className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-xs backdrop-blur-md border ${
                  !opp.isAlive
                    ? 'bg-rose-950/40 border-rose-900/40 text-stone-400'
                    : isOppTurn
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-md shadow-amber-400/20 animate-pulse'
                    : 'bg-black/60 border-stone-800 text-stone-300'
                }`}
              >
                <span className="font-bold flex items-center gap-1">
                  {opp.avatar} {opp.name}
                  {opp.isHost && <Crown className="w-3 h-3 text-amber-400" />}
                </span>
                {opp.isAlive && (
                  <span className="text-[10px] font-mono text-amber-400/90 font-bold px-1.5 py-0.2 rounded bg-stone-900/80 border border-stone-800">
                    {opp.chamberPulls}/6
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. CENTER TABLE: PURELY PHYSICAL CARD PILE OVER THE ILLUSTRATED TABLE (NO GIANT PANEL!) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <div className="relative w-44 h-44 flex items-center justify-center">
          {/* Real physical card backs in the pile */}
          {flattenedPile.map((item, idx) => {
            const { rot, x, y } = getDeterministicCardOffset(item.playId, item.cardIndex);
            return (
              <div
                key={`${item.playId}_${item.cardIndex}`}
                style={{
                  position: 'absolute',
                  transform: `translate3d(${x}px, ${y}px, 0) rotate(${rot}deg)`,
                  zIndex: idx,
                }}
              >
                <CantinaCard
                  isFaceDown
                  mapId={roomState.config.mapId}
                  size="md"
                  className="shadow-2xl"
                />
              </div>
            );
          })}

          {/* Temporary play notice toast (fades out automatically) */}
          {temporaryToast && (
            <div className="absolute -top-12 z-30 px-3 py-1 rounded-full bg-black/75 border border-amber-600/40 text-amber-300 text-xs font-semibold shadow-lg backdrop-blur-sm animate-in fade-in duration-200">
              {temporaryToast}
            </div>
          )}
        </div>
      </div>

      {/* 6. LOCAL HAND (VERY BOTTOM OF VIEWPORT, PHYSICAL CLOSED FAN, OPENS ON HOVER) */}
      <div className="absolute bottom-0 inset-x-0 z-20 flex flex-col items-center pointer-events-none pb-2 sm:pb-3">
        {/* Floating Action Controls above the fan */}
        <div className="flex items-center gap-3 mb-2 pointer-events-auto">
          {/* CHALLENGE BLUFF BUTTON ("¡FAROL!") */}
          {isMyTurn && roomState.lastPlay && isLocalAlive && (
            <button
              onClick={handleChallenge}
              className="py-2.5 px-5 rounded-2xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-2xl shadow-rose-600/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border border-rose-400/40"
            >
              <Skull className="w-4 h-4" /> ¡FAROL!
            </button>
          )}

          {/* CONFIRM PLAY BUTTON (Appears when 1-3 cards selected) */}
          {isMyTurn && selectedCardIds.length > 0 && isLocalAlive && (
            <button
              onClick={handleConfirmPlay}
              className="py-2.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-2xl shadow-amber-500/40 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border border-amber-300 animate-in zoom-in-95 duration-150"
            >
              <Check className="w-4 h-4 stroke-[3]" /> CONFIRMAR SELECCIÓN ({selectedCardIds.length}{' '}
              {RANK_LABELS[roomState.tableRank]})
            </button>
          )}

          {/* Turn status reminder */}
          {isMyTurn && selectedCardIds.length === 0 && isLocalAlive && (
            <div className="px-3.5 py-1.5 rounded-full bg-stone-950/80 border border-amber-500/40 text-amber-300 text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg backdrop-blur-sm animate-pulse">
              <Crosshair className="w-3.5 h-3.5" /> Es tu turno: elige de 1 a 3 cartas
            </div>
          )}
        </div>

        {/* Physical Hand Fan Container */}
        {isLocalAlive ? (
          <div
            onMouseEnter={handleHandMouseEnter}
            onMouseLeave={handleHandMouseLeave}
            className="relative flex items-center justify-center pointer-events-auto h-36 sm:h-44 px-8 min-w-[320px]"
          >
            {(localPlayer?.hand || []).map((card, i) => {
              const totalCards = (localPlayer?.hand || []).length;
              const mid = (totalCards - 1) / 2;
              const isSelected = selectedCardIds.includes(card.id);
              const isCardHovered = hoveredCardIndex === i;

              // Shallow horizontal fan calculation
              const spreadDeg = isHandHovered ? 4.5 : 3.5;
              const spacingPx = isHandHovered ? 48 : 28;
              const baseRot = (i - mid) * spreadDeg;
              const rot = isCardHovered ? baseRot * 0.3 : baseRot;

              const xOffset = (i - mid) * spacingPx;
              const arcY = Math.pow(Math.abs(i - mid), 1.5) * 4;
              const yOffset = isSelected ? -38 : isCardHovered ? -24 : arcY;
              const scale = isCardHovered ? 1.08 : 1.0;
              const zIndex = isCardHovered ? 30 : isSelected ? 25 : i + 10;

              return (
                <div
                  key={card.id}
                  onMouseEnter={() => handleCardMouseEnter(i)}
                  style={{
                    position: 'absolute',
                    transform: `translate3d(${xOffset}px, ${yOffset}px, 0) rotate(${rot}deg) scale(${scale})`,
                    zIndex,
                    transition:
                      'transform 180ms cubic-bezier(0.2, 0.8, 0.4, 1), z-index 0ms',
                    willChange: 'transform',
                  }}
                >
                  <CantinaCard
                    rank={card.rank}
                    mapId={roomState.config.mapId}
                    selected={isSelected}
                    onClick={() => handleCardClick(card.id)}
                    size="md"
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-3 px-5 rounded-2xl bg-black/80 border border-stone-800 text-stone-400 text-xs font-semibold backdrop-blur-sm pointer-events-auto flex items-center gap-2 mb-2">
            <Skull className="w-4 h-4 text-rose-500" /> Has sido eliminado. Observando como tahonero espectador...
          </div>
        )}

        {/* Local player subtle stats indicator */}
        <div className="flex items-center gap-2 mt-1 pointer-events-auto text-[11px] text-stone-400 font-medium">
          <span className="font-bold text-stone-200">
            {localPlayer?.avatar} {localPlayer?.name}
          </span>
          <span className="text-stone-600">&bull;</span>
          <span className="font-mono text-amber-400/90 font-bold">
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
                  mapId={roomState.config.mapId}
                  size="lg"
                  className="shadow-2xl"
                />
              ))}
            </div>

            <p className="text-sm text-stone-300 leading-relaxed font-medium">
              {roomState.challengeResult.description}
            </p>

            <div className="w-full pt-3 border-t border-stone-800 flex items-center justify-center gap-2 text-xs font-bold text-amber-400">
              <Crosshair className="w-4 h-4 animate-spin" /> Pasando a la Ruleta Rusa...
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
