import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  FortunariumRoomState,
  FortunariumUpgradeId,
  FortunariumBestSpinRecord,
} from '../../types/fortunarium';
import {
  FORTUNARIUM_UPGRADES_CATALOG,
  FORTUNARIUM_SYMBOL_ASSETS,
  getUpgradeLevelDetails,
} from '../../data/fortunarium/fortunariumAssets';
import {
  RotateCcw,
  Home,
  Trophy,
  Coins,
  Dices,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { fortunariumAudio } from '../../utils/fortunariumAudio';

interface FortunariumEndRunModalProps {
  roomState: FortunariumRoomState;
  installedUpgrades: [FortunariumUpgradeId, number][];
  onRestartMatch: () => void;
  onReturnToLobby: () => void;
}

interface HighlightItem {
  id: string;
  title: string;
  playerName: string;
  playerColor: string;
  valueText: string;
  tone: 'amber' | 'emerald' | 'cyan';
  icon: React.ReactNode;
}

export const FortunariumEndRunModal: React.FC<FortunariumEndRunModalProps> = ({
  roomState,
  installedUpgrades,
  onRestartMatch,
  onReturnToLobby,
}) => {
  const isVictory = roomState.phase === 'VICTORY';
  const isIntegrityDefeat = roomState.defeatCause === 'integrity';
  const isInfiniteMode = roomState.totalRounds === null;
  const quotasCompleted = isVictory
    ? roomState.round
    : Math.max(0, roomState.round - 1);

  // Peak credits from authoritative server tracking (with fallback for older match states)
  const peakCredits = useMemo(() => {
    if (
      typeof roomState.peakMoneyInMatch === 'number' &&
      Number.isFinite(roomState.peakMoneyInMatch) &&
      roomState.peakMoneyInMatch > 0
    ) {
      return Math.max(roomState.money, roomState.peakMoneyInMatch);
    }
    const totalGen = roomState.players.reduce(
      (acc, p) => acc + p.stats.totalMoneyGenerated,
      0
    );
    return Math.max(
      roomState.money,
      140 + Math.round(totalGen * 0.45),
      roomState.biggestSingleWinInMatch || 0
    );
  }, [
    roomState.money,
    roomState.peakMoneyInMatch,
    roomState.players,
    roomState.biggestSingleWinInMatch,
  ]);

  // Authoritative Top 1..3 Best Spins of the Match (Never fabricates spins)
  const bestSpins = useMemo<FortunariumBestSpinRecord[]>(() => {
    if (
      Array.isArray(roomState.bestSpinsInMatch) &&
      roomState.bestSpinsInMatch.length > 0
    ) {
      return [...roomState.bestSpinsInMatch]
        .filter((s) => s && s.grossPayout > 0)
        .sort((a, b) => {
          if (b.grossPayout !== a.grossPayout) return b.grossPayout - a.grossPayout;
          if (b.isJackpot !== a.isJackpot) return b.isJackpot ? 1 : -1;
          return b.netMoneyDelta - a.netMoneyDelta;
        })
        .slice(0, 3);
    }

    // Fallback if only the single best spin was stored on an older match state
    if ((roomState.biggestSingleWinInMatch || 0) > 0) {
      const topPlayer = [...roomState.players].sort(
        (a, b) => b.stats.biggestSingleWin - a.stats.biggestSingleWin
      )[0];
      const matchingLast =
        roomState.lastSpinResult &&
        roomState.lastSpinResult.grossPayout === roomState.biggestSingleWinInMatch
          ? roomState.lastSpinResult
          : null;

      const patternName =
        roomState.bestPatternNameInMatch && roomState.bestPatternNameInMatch !== '—'
          ? roomState.bestPatternNameInMatch
          : 'COMBINACIÓN GANADORA';

      return [
        {
          spinId: matchingLast?.spinId || 'best_spin_1',
          spinNumber: roomState.totalSpinsInMatch || 1,
          round: roomState.round,
          playerId: topPlayer?.id || 'player_1',
          playerName: matchingLast?.playerName || topPlayer?.name || 'Operador',
          playerColor: topPlayer?.color || '#06b6d4',
          betMode: matchingLast?.betMode || roomState.betMode || 'normal',
          spinCost: matchingLast?.spinCost || 10,
          grossPayout: roomState.biggestSingleWinInMatch,
          netMoneyDelta:
            matchingLast?.netMoneyDelta ?? roomState.biggestSingleWinInMatch,
          isJackpot: Boolean(
            matchingLast?.isJackpot || roomState.totalJackpotsHit > 0
          ),
          isBigWin: true,
          patternsCount: matchingLast?.winLines?.length || 1,
          topPatternName: patternName,
          patternNames: matchingLast?.winLines?.map((w) => w.name) || [patternName],
          timestamp: matchingLast?.timestamp || Date.now(),
        },
      ];
    }

    return [];
  }, [
    roomState.bestSpinsInMatch,
    roomState.biggestSingleWinInMatch,
    roomState.bestPatternNameInMatch,
    roomState.players,
    roomState.lastSpinResult,
    roomState.totalSpinsInMatch,
    roomState.round,
    roomState.betMode,
    roomState.totalJackpotsHit,
  ]);

  // Responsive visible cards count for Installed Upgrades Carousel:
  // Desktop (>= 1024px): 3 | Tablet (>= 640px): 2 | Mobile (< 640px): 1
  const [visibleCardsCount, setVisibleCardsCount] = useState<number>(() => {
    if (typeof window === 'undefined') return 3;
    if (window.innerWidth < 640) return 1;
    if (window.innerWidth < 1024) return 2;
    return 3;
  });

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const nextCount = w < 640 ? 1 : w < 1024 ? 2 : 3;
      setVisibleCardsCount(nextCount);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const totalUpgrades = installedUpgrades.length;
  const maxCarouselIndex = Math.max(0, totalUpgrades - visibleCardsCount);
  const canCarouselScroll = totalUpgrades > visibleCardsCount;

  const [carouselIndex, setCarouselIndex] = useState<number>(0);
  const [isHoverPaused, setIsHoverPaused] = useState<boolean>(false);
  const [isResumeCoolingDown, setIsResumeCoolingDown] = useState<boolean>(false);

  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchDeltaXRef = useRef<number>(0);

  // Keep carouselIndex within valid bounds if viewport resizes
  useEffect(() => {
    setCarouselIndex((prev) => Math.min(prev, maxCarouselIndex));
  }, [maxCarouselIndex]);

  const clearResumeTimer = useCallback(() => {
    if (resumeTimeoutRef.current !== null) {
      clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
  }, []);

  const scheduleDelayedResume = useCallback(
    (delayMs: number) => {
      clearResumeTimer();
      setIsResumeCoolingDown(true);
      resumeTimeoutRef.current = setTimeout(() => {
        resumeTimeoutRef.current = null;
        setIsResumeCoolingDown(false);
      }, delayMs);
    },
    [clearResumeTimer]
  );

  useEffect(() => {
    return () => clearResumeTimer();
  }, [clearResumeTimer]);

  // Step-by-step auto-advance every 4.5s (Wait -> Smooth 500ms step -> Wait)
  useEffect(() => {
    if (!canCarouselScroll || isHoverPaused || isResumeCoolingDown) {
      return;
    }

    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev >= maxCarouselIndex ? 0 : prev + 1));
    }, 4500);

    return () => clearInterval(interval);
  }, [canCarouselScroll, isHoverPaused, isResumeCoolingDown, maxCarouselIndex]);

  const handleCarouselMouseEnter = () => {
    clearResumeTimer();
    setIsHoverPaused(true);
  };

  const handleCarouselMouseLeave = () => {
    setIsHoverPaused(false);
    // Resume after ~2 seconds when pointer leaves
    scheduleDelayedResume(2000);
  };

  const handleManualStep = (nextIndex: number) => {
    if (!canCarouselScroll) return;
    fortunariumAudio.playButtonClick();
    const wrapped =
      nextIndex < 0
        ? maxCarouselIndex
        : nextIndex > maxCarouselIndex
        ? 0
        : nextIndex;
    setCarouselIndex(wrapped);
    // Give the player time to read after manual interaction before auto-advance resumes
    scheduleDelayedResume(5500);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    clearResumeTimer();
    setIsHoverPaused(true);
    if (e.touches.length > 0) {
      touchStartXRef.current = e.touches[0].clientX;
      touchDeltaXRef.current = 0;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || e.touches.length === 0) return;
    touchDeltaXRef.current = e.touches[0].clientX - touchStartXRef.current;
  };

  const handleTouchEnd = () => {
    const deltaX = touchDeltaXRef.current;
    touchStartXRef.current = null;
    touchDeltaXRef.current = 0;

    if (canCarouselScroll && Math.abs(deltaX) > 38) {
      if (deltaX < 0) {
        setCarouselIndex((prev) => Math.min(maxCarouselIndex, prev + 1));
      } else {
        setCarouselIndex((prev) => Math.max(0, prev - 1));
      }
    }

    setIsHoverPaused(false);
    // Give mobile user plenty of time to inspect after touch/swipe
    scheduleDelayedResume(5500);
  };

  // Global Match Highlights — shown only in multiplayer (2+ players) so it never duplicates solo cards
  const multiplayerHighlights = useMemo<HighlightItem[]>(() => {
    const players = roomState.players;
    if (players.length <= 1) return [];

    const items: HighlightItem[] = [];

    // 1. MAYOR PREMIO
    const bestWinPlayer = [...players].sort(
      (a, b) => b.stats.biggestSingleWin - a.stats.biggestSingleWin
    )[0];
    if (bestWinPlayer && bestWinPlayer.stats.biggestSingleWin > 0) {
      items.push({
        id: 'biggest_win',
        title: 'MAYOR PREMIO',
        playerName: bestWinPlayer.name,
        playerColor: bestWinPlayer.color,
        valueText: `+${bestWinPlayer.stats.biggestSingleWin} CR`,
        tone: 'amber',
        icon: <Trophy className="w-4 h-4 text-amber-300" />,
      });
    }

    // 2. MÁS RENTABLE
    const mostProfitable = [...players].sort(
      (a, b) => b.stats.netBalance - a.stats.netBalance
    )[0];
    if (mostProfitable && mostProfitable.stats.spinsTriggered > 0) {
      const nb = mostProfitable.stats.netBalance;
      items.push({
        id: 'most_profitable',
        title: 'MÁS RENTABLE',
        playerName: mostProfitable.name,
        playerColor: mostProfitable.color,
        valueText: `${nb >= 0 ? `+${nb}` : nb} CR netos`,
        tone: 'emerald',
        icon: <Coins className="w-4 h-4 text-emerald-300" />,
      });
    }

    // 3. MÁS TIRADAS
    const mostSpins = [...players].sort(
      (a, b) => b.stats.spinsTriggered - a.stats.spinsTriggered
    )[0];
    if (mostSpins && mostSpins.stats.spinsTriggered > 0) {
      items.push({
        id: 'most_spins',
        title: 'MÁS TIRADAS',
        playerName: mostSpins.name,
        playerColor: mostSpins.color,
        valueText: `${mostSpins.stats.spinsTriggered} tiradas`,
        tone: 'cyan',
        icon: <Dices className="w-4 h-4 text-cyan-300" />,
      });
    }

    return items;
  }, [roomState.players]);

  // Hero Title & Single Concise Explanation
  const heroTitle = isVictory
    ? 'CUOTAS COMPLETADAS'
    : isIntegrityDefeat
    ? 'MÁQUINA DESTRUIDA'
    : 'SIN CRÉDITOS';

  const heroExplanation = isVictory
    ? 'Habéis superado todas las cuotas de la partida conservando la máquina operativa.'
    : isIntegrityDefeat
    ? 'La integridad del chasis cayó al 0% y la máquina colapsó.'
    : 'No quedan créditos suficientes para realizar otra tirada.';

  return (
    <div className="fortunarium-root font-fortunarium fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-5 overflow-hidden select-none">
      <div
        className={`fort-cyber-modal relative w-full max-w-4xl max-h-[94dvh] rounded-3xl flex flex-col overflow-hidden ${
          isVictory
            ? 'border-cyan-400/80 shadow-[0_28px_90px_rgba(0,0,0,0.95),0_0_42px_rgba(34,211,238,0.26)]'
            : 'border-[#FF2A6D]/85 shadow-[0_28px_90px_rgba(0,0,0,0.95),0_0_45px_rgba(255,42,109,0.3)]'
        }`}
      >
        {/* Subtle Moving CRT Scanline Beam */}
        <div className="fort-end-scanline-beam" />

        {/* Scrollable Terminal Body (Stable Outer Dimensions) */}
        <div className="relative z-10 flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 sm:px-7 pt-5 sm:pt-6 pb-4 flex flex-col gap-5">
          {/* ================================================================= */}
          {/* 1. RESULT HERO                                                    */}
          {/* ================================================================= */}
          <div
            className={`fort-crt-display rounded-2xl px-4 py-4 sm:py-5 text-center border ${
              isVictory
                ? 'fort-end-hero-victory border-cyan-400/55'
                : 'fort-end-hero-defeat border-[#FF2A6D]/60'
            }`}
          >
            <div
              className={`text-[11px] font-mono font-black uppercase tracking-[0.22em] mb-1 ${
                isVictory ? 'text-amber-300' : 'text-[#FF2A6D]'
              }`}
            >
              {isVictory ? '★ VICTORIA ★' : 'FIN DE LA PARTIDA'}
            </div>

            <h2
              className={`font-fortunarium text-3xl sm:text-5xl tracking-wider uppercase leading-none drop-shadow-[0_3px_0_rgba(0,0,0,0.9)] ${
                isVictory
                  ? 'text-cyan-200'
                  : isIntegrityDefeat
                  ? 'text-rose-400'
                  : 'text-[#FF2A6D]'
              }`}
            >
              {heroTitle}
            </h2>

            <p className="mt-2 font-sans text-xs sm:text-sm font-medium text-cyan-100/90 max-w-xl mx-auto">
              {heroExplanation}
            </p>
          </div>

          {/* ================================================================= */}
          {/* 2. MAIN MATCH SUMMARY (4 LARGE SCANNABLE GLOBAL CARDS)            */}
          {/* ================================================================= */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
            {/* Card 1: CUOTA ALCANZADA */}
            <div className="fort-crt-display px-3.5 py-3 rounded-2xl border border-cyan-500/40 flex flex-col justify-between text-left">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-300/85">
                CUOTA ALCANZADA
              </span>
              <div className="mt-1 text-2xl sm:text-3xl font-mono font-black text-white tabular-nums leading-tight">
                {isInfiniteMode
                  ? `${quotasCompleted} · ∞`
                  : `${quotasCompleted} / ${roomState.totalRounds}`}
              </div>
              <span
                className={`mt-1 text-[11px] font-mono font-bold uppercase tracking-wide ${
                  isVictory ? 'text-emerald-300' : 'text-cyan-300/75'
                }`}
              >
                {isInfiniteMode ? 'MODO ILIMITADO' : isVictory ? 'COMPLETADAS' : `OBJETIVO: ${roomState.quota} CR`}
              </span>
            </div>

            {/* Card 2: CRÉDITOS */}
            <div className="fort-crt-display px-3.5 py-3 rounded-2xl border border-amber-400/45 flex flex-col justify-between text-left">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-300/85">
                CRÉDITOS
              </span>
              <div className="mt-1 text-2xl sm:text-3xl font-mono font-black text-amber-300 tabular-nums leading-tight">
                {roomState.money} CR
              </div>
              <span className="mt-1 text-[11px] font-mono font-bold text-cyan-300 tabular-nums">
                PICO: {peakCredits} CR
              </span>
            </div>

            {/* Card 3: TIRADAS */}
            <div className="fort-crt-display px-3.5 py-3 rounded-2xl border border-cyan-500/40 flex flex-col justify-between text-left">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-300/85">
                TIRADAS
              </span>
              <div className="mt-1 text-2xl sm:text-3xl font-mono font-black text-cyan-200 tabular-nums leading-tight">
                {roomState.totalSpinsInMatch}
              </div>
              <span className="mt-1 text-[11px] font-mono font-bold text-cyan-300/80 tabular-nums">
                {roomState.totalPatternsHit} PATRONES
              </span>
            </div>

            {/* Card 4: MAYOR PREMIO */}
            <div className="fort-crt-display px-3.5 py-3 rounded-2xl border border-amber-400/45 flex flex-col justify-between text-left">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-300/85">
                MAYOR PREMIO
              </span>
              <div className="mt-1 text-2xl sm:text-3xl font-mono font-black text-amber-300 tabular-nums leading-tight">
                +{roomState.biggestSingleWinInMatch || 0} CR
              </div>
              <span
                className={`mt-1 text-[11px] font-mono font-bold tabular-nums ${
                  roomState.integrity > 0 ? 'text-emerald-300' : 'text-[#FF2A6D]'
                }`}
              >
                INTEGRIDAD: {roomState.integrity}%
              </span>
            </div>
          </div>

          {/* ================================================================= */}
          {/* 3. BEST SPINS OF THE MATCH (MEJORES TIRADAS)                      */}
          {/* ================================================================= */}
          <section className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2 border-b border-cyan-500/25 pb-1.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
                <h3 className="text-xs sm:text-sm font-mono font-black uppercase tracking-widest text-cyan-200">
                  MEJORES TIRADAS
                </h3>
              </div>
              {bestSpins.length > 0 && (
                <span className="text-[11px] font-mono text-cyan-300/75 tabular-nums">
                  TOP {bestSpins.length} DE LA PARTIDA
                </span>
              )}
            </div>

            {bestSpins.length === 0 ? (
              <div className="fort-crt-panel rounded-2xl px-4 py-3.5 border border-cyan-500/25 text-center font-mono text-xs text-cyan-200/70">
                — Sin tiradas premiadas registradas en esta partida —
              </div>
            ) : (
              <div
                className={`grid gap-2.5 sm:gap-3 ${
                  bestSpins.length === 1
                    ? 'grid-cols-1'
                    : bestSpins.length === 2
                    ? 'grid-cols-1 sm:grid-cols-2'
                    : 'grid-cols-1 sm:grid-cols-3'
                }`}
              >
                {bestSpins.map((spin, idx) => {
                  const isRank1 = idx === 0;
                  const secondaryPatterns = spin.patternNames
                    .slice(1, 3)
                    .filter(Boolean);

                  return (
                    <div
                      key={spin.spinId || `spin_${idx}`}
                      className={`rounded-2xl p-3.5 flex flex-col justify-between text-left transition-colors ${
                        isRank1
                          ? spin.isJackpot
                            ? 'fort-crt-display border-2 border-amber-300 shadow-[0_0_24px_rgba(250,204,21,0.25)]'
                            : 'fort-crt-display border-2 border-[#FF2A6D]/85 shadow-[0_0_20px_rgba(255,42,109,0.22)]'
                          : 'fort-crt-panel border border-cyan-500/35'
                      }`}
                    >
                      {/* Top Header: Rank / Jackpot / Mejor Tirada Badge + Operator */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          {isRank1 ? (
                            <span
                              className={`text-[10px] font-mono font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                                spin.isJackpot
                                  ? 'bg-amber-400/20 border-amber-300 text-amber-200'
                                  : 'bg-[#FF2A6D]/20 border-[#FF2A6D]/70 text-pink-200'
                              }`}
                            >
                              {spin.isJackpot ? '★ JACKPOT ★' : '★ MEJOR TIRADA ★'}
                            </span>
                          ) : (
                            <span className="text-xs font-mono font-black text-cyan-300 px-2 py-0.5 rounded bg-[#050d18] border border-cyan-500/35 tabular-nums">
                              #{idx + 1}
                            </span>
                          )}

                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: spin.playerColor || '#06b6d4' }}
                            />
                            <span className="text-[11px] font-mono font-bold text-cyan-100/90 truncate">
                              {spin.playerName}
                            </span>
                          </div>
                        </div>

                        {/* Big CR Win Readout */}
                        <div
                          className={`font-mono font-black tabular-nums leading-none ${
                            isRank1
                              ? 'text-2xl sm:text-3xl text-amber-300 drop-shadow-[0_0_10px_rgba(250,204,21,0.3)]'
                              : 'text-xl sm:text-2xl text-amber-300'
                          }`}
                        >
                          +{spin.grossPayout} CR
                        </div>

                        {/* Dominant Pattern Name */}
                        <div className="mt-2 font-fortunarium text-sm sm:text-base text-white tracking-wide uppercase truncate">
                          {spin.topPatternName}
                        </div>

                        {/* Secondary Pattern Names if multi-pattern */}
                        {secondaryPatterns.length > 0 && (
                          <div className="text-[11px] font-mono font-bold text-cyan-300/85 truncate mt-0.5">
                            {secondaryPatterns.join(' · ')}
                          </div>
                        )}
                      </div>

                      {/* Footer Meta: Patterns Count + Bet Cost */}
                      <div className="mt-3 pt-2 border-t border-cyan-500/20 flex items-center justify-between gap-2 text-[11px] font-mono font-bold tabular-nums">
                        <span className="text-emerald-300">
                          {spin.patternsCount > 0
                            ? `${spin.patternsCount} ${
                                spin.patternsCount === 1 ? 'PATRÓN' : 'PATRONES'
                              }`
                            : 'EFECTO DIRECTO'}
                        </span>
                        <span className="text-cyan-200/80">
                          APUESTA: {spin.spinCost} CR
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ================================================================= */}
          {/* 4. INSTALLED UPGRADES — HORIZONTAL AUTO-ADVANCING CAROUSEL        */}
          {/* ================================================================= */}
          <section className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2 border-b border-[#FF2A6D]/35 pb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <Wrench className="w-4 h-4 text-[#FF2A6D] shrink-0" />
                <div className="flex items-baseline gap-2 flex-wrap min-w-0">
                  <h3 className="text-xs sm:text-sm font-mono font-black uppercase tracking-widest text-[#FF2A6D]">
                    MEJORAS INSTALADAS
                  </h3>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300/75 hidden sm:inline">
                    · CONFIGURACIÓN FINAL DE LA MÁQUINA
                  </span>
                </div>
              </div>

              {totalUpgrades > 0 && (
                <span className="text-[11px] font-mono font-bold text-cyan-200 tabular-nums shrink-0">
                  {totalUpgrades} {totalUpgrades === 1 ? 'MÓDULO' : 'MÓDULOS'}
                </span>
              )}
            </div>

            {totalUpgrades === 0 ? (
              <div className="fort-crt-panel rounded-2xl px-4 py-3.5 border border-[#FF2A6D]/30 text-center font-mono text-xs text-cyan-200/75">
                — Ninguna mejora instalada —
              </div>
            ) : (
              <div
                className="flex flex-col gap-2 select-none"
                onMouseEnter={handleCarouselMouseEnter}
                onMouseLeave={handleCarouselMouseLeave}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {/* Fixed-height, overflow-hidden Carousel Viewport */}
                <div className="overflow-hidden w-full h-[120px]">
                  <div
                    className="flex h-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{
                      transform: `translate3d(-${
                        carouselIndex * (100 / visibleCardsCount)
                      }%, 0, 0)`,
                    }}
                  >
                    {installedUpgrades.map(([uId, lv]) => {
                      const catalogItem = FORTUNARIUM_UPGRADES_CATALOG[uId];
                      if (!catalogItem) return null;
                      const details = getUpgradeLevelDetails(uId, lv);
                      const isMaxLevel = lv >= catalogItem.maxLevel;
                      const iconSrc =
                        FORTUNARIUM_SYMBOL_ASSETS[catalogItem.iconSymbol];

                      return (
                        <div
                          key={uId}
                          style={{ width: `${100 / visibleCardsCount}%` }}
                          className="shrink-0 h-full px-1.5 first:pl-0 last:pr-0"
                        >
                          <div
                            className={`h-full rounded-2xl p-3 flex flex-col justify-between text-left border transition-colors ${
                              isMaxLevel
                                ? 'fort-crt-display border-amber-400/75 shadow-[inset_0_0_16px_rgba(250,204,21,0.12)]'
                                : 'fort-crt-panel border-[#FF2A6D]/45 hover:border-cyan-400/65'
                            }`}
                          >
                            {/* Top Row: Icon + Upgrade Name + Prominent Level Badge */}
                            <div className="flex items-start justify-between gap-2 min-w-0">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-[#040a12] border border-cyan-500/40 p-1.5 flex items-center justify-center shrink-0">
                                  <img
                                    src={iconSrc}
                                    alt={catalogItem.name}
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-fortunarium text-sm sm:text-base text-white tracking-wide uppercase truncate">
                                    {catalogItem.name}
                                  </div>
                                  <div
                                    className={`inline-flex items-center mt-0.5 px-2 py-0.5 rounded font-mono text-[11px] font-black uppercase tracking-wider tabular-nums ${
                                      isMaxLevel
                                        ? 'bg-amber-400/20 border border-amber-300 text-amber-200'
                                        : 'bg-[#FF2A6D]/20 border border-[#FF2A6D]/65 text-pink-200'
                                    }`}
                                  >
                                    {isMaxLevel
                                      ? `NIVEL ${lv} · MÁX.`
                                      : `NIVEL ${lv}`}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Bottom Row: Real Current-Level Effect (Fixed 2-line clamp) */}
                            <div className="mt-1.5 pt-1.5 border-t border-cyan-500/20 flex flex-col justify-center min-h-[34px] overflow-hidden">
                              {details.compactLines.slice(0, 2).map((line, lineIdx) => (
                                <div
                                  key={lineIdx}
                                  className="text-[11px] font-mono font-bold text-cyan-200 truncate leading-snug"
                                >
                                  • {line}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Subtle Carousel Controls (‹ ● ○ ○ ›) when scrollable */}
                {canCarouselScroll && (
                  <div className="flex items-center justify-center gap-3 pt-0.5">
                    <button
                      type="button"
                      aria-label="Mejora anterior"
                      onClick={() => handleManualStep(carouselIndex - 1)}
                      className="w-6 h-6 rounded-lg bg-[#071320] hover:bg-[#0d2136] border border-cyan-500/40 flex items-center justify-center text-cyan-300 hover:text-white cursor-pointer transition-colors"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: maxCarouselIndex + 1 }).map((_, dotIdx) => {
                        const isActive = dotIdx === carouselIndex;
                        return (
                          <button
                            key={dotIdx}
                            type="button"
                            aria-label={`Ir a posición ${dotIdx + 1}`}
                            onClick={() => handleManualStep(dotIdx)}
                            className={`h-2 rounded-full transition-all cursor-pointer ${
                              isActive
                                ? 'w-5 bg-[#FF2A6D] shadow-[0_0_8px_rgba(255,42,109,0.7)]'
                                : 'w-2 bg-cyan-500/35 hover:bg-cyan-400/60'
                            }`}
                          />
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      aria-label="Siguiente mejora"
                      onClick={() => handleManualStep(carouselIndex + 1)}
                      className="w-6 h-6 rounded-lg bg-[#071320] hover:bg-[#0d2136] border border-cyan-500/40 flex items-center justify-center text-cyan-300 hover:text-white cursor-pointer transition-colors"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ================================================================= */}
          {/* 5. SIMPLIFIED PLAYER ECONOMIC SUMMARY (+ MULTIPLAYER HIGHLIGHTS)  */}
          {/* ================================================================= */}
          <section className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2 border-b border-cyan-500/25 pb-1.5">
              <h3 className="text-xs sm:text-sm font-mono font-black uppercase tracking-widest text-cyan-200">
                EQUIPO / ECONOMÍA ({roomState.players.length})
              </h3>
              <span className="text-[11px] font-mono text-cyan-300/75 uppercase">
                RESUMEN INDIVIDUAL
              </span>
            </div>

            {/* Optional Concise Multiplayer Highlights (Only when 2+ players) */}
            {multiplayerHighlights.length > 0 && (
              <div
                className={`grid gap-2 ${
                  multiplayerHighlights.length === 1
                    ? 'grid-cols-1'
                    : multiplayerHighlights.length === 2
                    ? 'grid-cols-1 sm:grid-cols-2'
                    : 'grid-cols-1 sm:grid-cols-3'
                }`}
              >
                {multiplayerHighlights.map((item) => (
                  <div
                    key={item.id}
                    className="fort-crt-panel px-3 py-2 rounded-xl border border-cyan-500/30 flex items-center gap-2.5 text-left"
                  >
                    <div className="p-1.5 rounded-lg bg-[#040a12] border border-cyan-500/30 shrink-0">
                      {item.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300/80">
                        {item.title}
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: item.playerColor }}
                          />
                          <span className="text-xs font-bold text-white truncate">
                            {item.playerName}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-black text-amber-300 tabular-nums shrink-0">
                          {item.valueText}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Clean Player Economic Cards — ONLY: GANADO / PERDIDO / BALANCE / TIRADAS */}
            <div className="flex flex-col gap-2.5">
              {roomState.players.map((p) => {
                const net = p.stats.netBalance;
                const balanceColorClass =
                  net > 0
                    ? 'text-emerald-300 border-emerald-400/50 bg-emerald-950/35'
                    : net < 0
                    ? 'text-[#FF2A6D] border-[#FF2A6D]/55 bg-[#240915]/55'
                    : 'text-slate-200 border-cyan-500/35 bg-[#050d17]';

                return (
                  <div
                    key={p.id}
                    className="fort-crt-panel px-4 py-3 rounded-2xl border border-cyan-500/35 flex flex-col gap-2.5 text-left"
                  >
                    {/* Player Identity Row */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-3 h-3 rounded-full border border-white/40 shrink-0"
                          style={{ backgroundColor: p.color }}
                        />
                        <span className="font-fortunarium text-base sm:text-lg text-white tracking-wide uppercase truncate">
                          {p.name}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-black text-amber-200 uppercase tracking-wider tabular-nums shrink-0">
                        {p.stats.spinsTriggered} TIRADAS
                      </span>
                    </div>

                    {/* 4-Metric Economic Grid (Mobile: 2x2 | Desktop: 4 columns) */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono tabular-nums">
                      {/* GANADO */}
                      <div className="px-3 py-2 rounded-xl bg-[#040a12] border border-cyan-500/25">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300/75 block">
                          GANADO
                        </span>
                        <span className="text-base sm:text-lg font-black text-cyan-300">
                          +{p.stats.totalMoneyGenerated} CR
                        </span>
                      </div>

                      {/* PERDIDO */}
                      <div className="px-3 py-2 rounded-xl bg-[#040a12] border border-cyan-500/25">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300/75 block">
                          PERDIDO
                        </span>
                        <span className="text-base sm:text-lg font-black text-[#FF2A6D]">
                          -{p.stats.totalMoneyLost} CR
                        </span>
                      </div>

                      {/* BALANCE (Strongest Number) */}
                      <div
                        className={`px-3 py-2 rounded-xl border ${balanceColorClass}`}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-200/85 block">
                          BALANCE
                        </span>
                        <span className="text-lg sm:text-xl font-black">
                          {net > 0 ? `+${net} CR` : `${net} CR`}
                        </span>
                      </div>

                      {/* TIRADAS */}
                      <div className="px-3 py-2 rounded-xl bg-[#040a12] border border-cyan-500/25">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300/75 block">
                          TIRADAS
                        </span>
                        <span className="text-base sm:text-lg font-black text-amber-200">
                          {p.stats.spinsTriggered}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* ================================================================= */}
        {/* 6. STICKY ACTION BUTTONS FOOTER                                   */}
        {/* ================================================================= */}
        <div className="relative z-10 shrink-0 px-4 sm:px-7 py-3.5 bg-[#060c16]/95 border-t border-[#FF2A6D]/40 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              fortunariumAudio.playButtonClick();
              onRestartMatch();
            }}
            className="fort-arcade-btn flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FF2A6D] hover:bg-[#ff4782] border border-pink-200 text-white font-fortunarium text-base tracking-wider shadow-[0_0_24px_rgba(255,42,109,0.5)] cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            NUEVA PARTIDA
          </button>

          <button
            type="button"
            onClick={() => {
              fortunariumAudio.playButtonClick();
              onReturnToLobby();
            }}
            className="fort-arcade-btn flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0b1624] hover:bg-[#122338] text-cyan-100 font-fortunarium text-base tracking-wider border border-cyan-400/50 cursor-pointer"
          >
            <Home className="w-4 h-4 text-cyan-400" />
            VOLVER A LA SALA
          </button>
        </div>
      </div>
    </div>
  );
};
