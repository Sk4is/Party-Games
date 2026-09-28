import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  FortunariumRoomState,
  FortunariumSpinResult,
  FortunariumBetMode,
  FortunariumUpgradeId,
  FortunariumSymbolId,
  FortunariumCellCoord,
  FortunariumRemoteCursor,
  FortunariumPlayer,
  FortunariumWinTier,
} from '../../types/fortunarium';
import {
  FORTUNARIUM_SYMBOLS,
  FORTUNARIUM_UPGRADES_CATALOG,
  FORTUNARIUM_BET_MODES,
  FORTUNARIUM_CURSOR_COLORS,
  ALL_UPGRADE_IDS,
  getUpgradeCostMoney,
  calculateEffectiveSpinCost,
} from '../../data/fortunarium/fortunariumAssets';
import {
  runFortunariumSimulation,
  FortunariumSimulationReport,
} from '../../utils/fortunariumEconomyEngine';
import {
  ArrowLeft,
  Wrench,
  BookOpen,
  Trophy,
  Volume2,
  VolumeX,
  Users,
  Zap,
  Shield,
  Key,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Crown,
  Copy,
  Check,
  X,
  Palette,
  FlaskConical,
  Minus,
  Plus,
  LogOut,
} from 'lucide-react';
import { fortunariumAudio } from '../../utils/fortunariumAudio';
import { FortunariumCursorsOverlay } from './FortunariumCursorsOverlay';
import { FortunariumRulebookModal } from './FortunariumRulebookModal';
import { FortunariumPrizeTableModal } from './FortunariumPrizeTableModal';
import { FortunariumAudioModal } from './FortunariumAudioModal';

interface FortunariumMachineViewProps {
  roomState: FortunariumRoomState;
  localPlayerId: string;
  spinEvent: FortunariumSpinResult | null;
  errorMessage: string | null;
  subscribeToCursors: (listener: (cursor: FortunariumRemoteCursor) => void) => () => void;
  onSendCursorMove: (x: number, y: number) => void;
  onSetCursorColor: (color: string) => void;
  onSetBetMode: (betMode: FortunariumBetMode) => void;
  onSpinSlot: (
    forceScenario?: 'single_pattern' | 'multi_pattern' | 'special_symbol' | 'jackpot'
  ) => void;
  onRepairMachine: (useKey?: boolean) => void;
  onBuyUpgrade: (upgradeId: FortunariumUpgradeId, useKey?: boolean) => void;
  onVoteUpgrade: (upgradeId: FortunariumUpgradeId) => void;
  onResolveEvent: (optionId: string) => void;
  onPayQuotaEarly: () => void;
  onNextRound: () => void;
  onRestartMatch: () => void;
  onReturnToLobby: () => void;
  onLeaveRoom: () => void;
}

interface RevealStep {
  id: string;
  title: string;
  subtitle?: string;
  amount: number;
  integrityDelta: number;
  cells: FortunariumCellCoord[];
  variant: 'win' | 'jackpot' | 'hazard' | 'special';
  symbolId?: FortunariumSymbolId;
}

// Staggered stop times for the 5 reels (visible downward carousel)
const REEL_STOP_DELAYS_MS = [1350, 1750, 2150, 2550, 2950];
const STRIP_SPIN_ITEMS = 21; // 21 intermediate symbols + 3 final symbols = 24 symbols (8 full windows)

const VISUAL_FILLER_POOL: FortunariumSymbolId[] = [
  'cereza',
  'limon',
  'naranja',
  'ciruela',
  'uvas',
  'trebol',
  'campana',
  'herradura',
  'estrella',
  'diamante',
  'corona',
  'siete',
];

function buildReelCarouselStrip(
  colIndex: number,
  startCol: FortunariumSymbolId[],
  finalCol: FortunariumSymbolId[],
  seed: number
): FortunariumSymbolId[] {
  // For downward motion:
  // At progress=0 (top of spin), we show the bottom 3 items (`startCol`).
  // We animate from translateY(-87.5%) down to translateY(0%), so the TOP 3 items (`finalCol`) land in the window!
  const filler: FortunariumSymbolId[] = [];
  for (let i = 0; i < STRIP_SPIN_ITEMS - 3; i++) {
    const idx = (seed * 7 + colIndex * 5 + i * 3) % VISUAL_FILLER_POOL.length;
    filler.push(VISUAL_FILLER_POOL[idx]);
  }
  return [...finalCol, ...filler, ...startCol];
}

function classifyWinTier(spin: FortunariumSpinResult): FortunariumWinTier {
  if (spin.isJackpot || spin.grossPayout >= 140) return 'JACKPOT';
  if (spin.grossPayout >= 85) return 'HUGE';
  if (spin.grossPayout >= 45) return 'BIG';
  if (spin.grossPayout >= 20) return 'MEDIUM';
  if (spin.grossPayout > 0) return 'SMALL';
  if (spin.penalties > 0 || spin.integrityDelta <= -6) return 'LOSS';
  return 'NONE';
}

export const FortunariumMachineView: React.FC<FortunariumMachineViewProps> = ({
  roomState,
  localPlayerId,
  spinEvent,
  errorMessage,
  subscribeToCursors,
  onSendCursorMove,
  onSetCursorColor,
  onSetBetMode,
  onSpinSlot,
  onRepairMachine,
  onBuyUpgrade,
  onVoteUpgrade,
  onResolveEvent,
  onPayQuotaEarly,
  onNextRound,
  onRestartMatch,
  onReturnToLobby,
  onLeaveRoom,
}) => {
  // Modals & Drawers
  const [showWorkshopModal, setShowWorkshopModal] = useState(false);
  const [showPrizeTableModal, setShowPrizeTableModal] = useState(false);
  const [showRulebookModal, setShowRulebookModal] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);
  const [showTeamDrawer, setShowTeamDrawer] = useState(false);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
  const [showDevModal, setShowDevModal] = useState(false);
  const [simReport, setSimReport] = useState<FortunariumSimulationReport | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(() => fortunariumAudio.getSettings().muted);

  // Reel Carousel Animation State
  const [reelsSpinning, setReelsSpinning] = useState<boolean[]>([
    false,
    false,
    false,
    false,
    false,
  ]);
  const [reelsLandedBounce, setReelsLandedBounce] = useState<boolean[]>([
    false,
    false,
    false,
    false,
    false,
  ]);
  const [reelStrips, setReelStrips] = useState<FortunariumSymbolId[][]>(() =>
    roomState.grid.map((col, idx) => buildReelCarouselStrip(idx, col, col, 1))
  );
  const [settledGrid, setSettledGrid] = useState<FortunariumSymbolId[][]>(roomState.grid);
  const [leverPulled, setLeverPulled] = useState(false);
  const [machineShake, setMachineShake] = useState(false);

  // Authoritative Display State (NEVER flickers between pre-spin and post-spin values)
  const [displayedMoney, setDisplayedMoney] = useState<number>(roomState.money);
  const [displayedQuotaProgress, setDisplayedQuotaProgress] = useState<number>(
    roomState.quotaProgress
  );
  const [displayedIntegrity, setDisplayedIntegrity] = useState<number>(roomState.integrity);
  const [displayedVoltage, setDisplayedVoltage] = useState<number>(roomState.voltageMultiplier);
  const [displayedKeys, setDisplayedKeys] = useState<number>(roomState.keys);
  const [displayedPlayers, setDisplayedPlayers] = useState<FortunariumPlayer[]>(
    roomState.players
  );

  // Sequential Post-Stop Presentation State (only runs AFTER Reel 5 stops)
  const [isSpinPresentationActive, setIsSpinPresentationActive] = useState(false);
  const [isRevealingRewards, setIsRevealingRewards] = useState(false);
  const [activeRevealStep, setActiveRevealStep] = useState<RevealStep | null>(null);
  const [activeRevealStepIndex, setActiveRevealStepIndex] = useState<number>(0);
  const [totalRevealSteps, setTotalRevealSteps] = useState<number>(0);
  const [finalOutcomeBanner, setFinalOutcomeBanner] = useState<{
    title: string;
    subtitle: string;
    netAmount: number;
    tier: FortunariumWinTier;
  } | null>(null);

  // Quota celebration state
  const [quotaCelebrationShownForRound, setQuotaCelebrationShownForRound] =
    useState<number>(0);
  const [showQuotaBanner, setShowQuotaBanner] = useState(false);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const lastHandledSpinIdRef = useRef<string | null>(null);
  const settledGridRef = useRef<FortunariumSymbolId[][]>(roomState.grid);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAllSpinTimers = useCallback(() => {
    for (const t of timersRef.current) clearTimeout(t);
    timersRef.current = [];
  }, []);

  useEffect(() => {
    return fortunariumAudio.subscribe((s) => {
      setIsAudioMuted(s.muted);
    });
  }, []);

  useEffect(() => {
    return () => {
      clearAllSpinTimers();
      fortunariumAudio.stopReelSpinLoop();
    };
  }, [clearAllSpinTimers]);

  // Sync roomState to displayed values ONLY when NOT in an active spin presentation
  useEffect(() => {
    if (!roomState.isSpinning && !isSpinPresentationActive) {
      setDisplayedMoney(roomState.money);
      setDisplayedQuotaProgress(roomState.quotaProgress);
      setDisplayedIntegrity(roomState.integrity);
      setDisplayedVoltage(roomState.voltageMultiplier);
      setDisplayedKeys(roomState.keys);
      setDisplayedPlayers(roomState.players);
      setSettledGrid(roomState.grid);
      settledGridRef.current = roomState.grid;
    }
  }, [
    roomState.isSpinning,
    roomState.money,
    roomState.quotaProgress,
    roomState.integrity,
    roomState.voltageMultiplier,
    roomState.keys,
    roomState.players,
    roomState.grid,
    isSpinPresentationActive,
  ]);

  // Trigger Quota Reached celebration ONLY after reels and reward reveals have settled
  useEffect(() => {
    if (
      roomState.phase === 'PLAYING' &&
      !roomState.isSpinning &&
      !isSpinPresentationActive &&
      displayedQuotaProgress >= roomState.quota &&
      quotaCelebrationShownForRound !== roomState.round
    ) {
      setQuotaCelebrationShownForRound(roomState.round);
      setShowQuotaBanner(true);
      fortunariumAudio.playQuotaCompleted();
      const t = setTimeout(() => setShowQuotaBanner(false), 3600);
      return () => clearTimeout(t);
    }
  }, [
    roomState.phase,
    roomState.isSpinning,
    isSpinPresentationActive,
    displayedQuotaProgress,
    roomState.quota,
    roomState.round,
    quotaCelebrationShownForRound,
  ]);

  // Master Spin & Sequential Post-Stop Presentation Choreography
  useEffect(() => {
    if (!spinEvent || spinEvent.spinId === lastHandledSpinIdRef.current) return;
    lastHandledSpinIdRef.current = spinEvent.spinId;

    clearAllSpinTimers();
    setIsSpinPresentationActive(true);
    setIsRevealingRewards(false);
    setActiveRevealStep(null);
    setFinalOutcomeBanner(null);

    // Build real symbol carousel strips from previous settled grid -> new spinEvent.grid
    const seed = Date.now() % 97;
    const strips = spinEvent.grid.map((finalCol, colIdx) =>
      buildReelCarouselStrip(
        colIdx,
        settledGridRef.current[colIdx] || finalCol,
        finalCol,
        seed
      )
    );
    setReelStrips(strips);

    // STAGE 1: Deduct ONLY spinCost immediately; keep quotaProgress, integrity, voltage at pre-spin values
    setDisplayedMoney(spinEvent.moneyAfterSpinCost);
    setDisplayedQuotaProgress(spinEvent.quotaProgressBefore);
    setDisplayedVoltage(spinEvent.voltageMultiplierUsed);

    // Pull lever & start all 5 vertical reels spinning downward
    setLeverPulled(true);
    setReelsSpinning([true, true, true, true, true]);
    setReelsLandedBounce([false, false, false, false, false]);
    fortunariumAudio.playLeverPull();
    fortunariumAudio.startReelSpinLoop();

    const leverTimer = setTimeout(() => setLeverPulled(false), 550);
    timersRef.current.push(leverTimer);

    // STAGE 2: Stop each reel sequentially from left (Reel 1) to right (Reel 5)
    REEL_STOP_DELAYS_MS.forEach((delay, colIndex) => {
      const stopTimer = setTimeout(() => {
        setSettledGrid((prev) => {
          const next = [...prev];
          next[colIndex] = spinEvent.grid[colIndex];
          return next;
        });
        setReelsSpinning((prev) => {
          const next = [...prev];
          next[colIndex] = false;
          return next;
        });
        setReelsLandedBounce((prev) => {
          const next = [...prev];
          next[colIndex] = true;
          return next;
        });
        fortunariumAudio.playReelLockClack(colIndex);

        const clearBounceTimer = setTimeout(() => {
          setReelsLandedBounce((prev) => {
            const next = [...prev];
            next[colIndex] = false;
            return next;
          });
        }, 280);
        timersRef.current.push(clearBounceTimer);
      }, delay);
      timersRef.current.push(stopTimer);
    });

    // STAGE 3: ONLY AFTER REEL 5 STOPS (3020ms), begin sequential pattern-by-pattern presentation
    const postStopTimer = setTimeout(() => {
      fortunariumAudio.stopReelSpinLoop();
      fortunariumAudio.playMechanicalSettle();
      settledGridRef.current = spinEvent.grid;
      setSettledGrid(spinEvent.grid);
      setIsRevealingRewards(true);

      const steps: RevealStep[] = [];
      for (const line of spinEvent.winLines) {
        steps.push({
          id: line.id,
          title: line.name.toUpperCase(),
          subtitle: `${line.count}× ${FORTUNARIUM_SYMBOLS[line.symbolId]?.name || line.symbolId} (x${line.patternMultiplier})`,
          amount: line.payout,
          integrityDelta: 0,
          cells: line.cells,
          variant:
            line.count === 5 && (line.symbolId === 'siete' || line.symbolId === 'corona')
              ? 'jackpot'
              : 'win',
          symbolId: line.symbolId,
        });
      }

      for (const fx of spinEvent.specialEffects) {
        steps.push({
          id: fx.id,
          title: fx.title.toUpperCase(),
          subtitle: fx.description,
          amount: fx.moneyDelta,
          integrityDelta: fx.integrityDelta,
          cells: fx.cells,
          variant: fx.variant === 'negative' ? 'hazard' : 'special',
          symbolId: fx.symbolId,
        });
      }

      setTotalRevealSteps(steps.length);
      const tier = classifyWinTier(spinEvent);

      if (steps.length === 0) {
        setDisplayedMoney(spinEvent.finalMoney);
        setDisplayedQuotaProgress(spinEvent.finalQuotaProgress);
        setDisplayedIntegrity(spinEvent.finalIntegrity);
        setDisplayedVoltage(spinEvent.voltageMultiplierAfter);
        setDisplayedKeys(spinEvent.finalKeys);
        setFinalOutcomeBanner({
          title: 'SIN COMBINACIÓN',
          subtitle: `Coste de tirada: -${spinEvent.spinCost} CR`,
          netAmount: -spinEvent.spinCost,
          tier: 'NONE',
        });

        const endEmptyTimer = setTimeout(() => {
          setIsRevealingRewards(false);
          setIsSpinPresentationActive(false);
          setFinalOutcomeBanner(null);
        }, 1200);
        timersRef.current.push(endEmptyTimer);
        return;
      }

      const stepDurationMs = steps.length > 3 ? 680 : 820;
      let runningMoney = spinEvent.moneyAfterSpinCost;
      let runningQuota = spinEvent.quotaProgressBefore;

      steps.forEach((step, idx) => {
        const stepTimer = setTimeout(() => {
          setActiveRevealStep(step);
          setActiveRevealStepIndex(idx + 1);

          if (step.variant === 'hazard') {
            setMachineShake(true);
            fortunariumAudio.playSpecialSymbolCue('negative');
            setTimeout(() => setMachineShake(false), 450);
          } else if (step.variant === 'jackpot') {
            setMachineShake(true);
            fortunariumAudio.playSpecialSymbolCue('jackpot');
            setTimeout(() => setMachineShake(false), 600);
          } else if (step.variant === 'special') {
            fortunariumAudio.playSpecialSymbolCue('positive');
          } else {
            fortunariumAudio.playPatternChime(idx);
          }

          if (step.amount !== 0) {
            runningMoney = Math.max(0, runningMoney + step.amount);
            setDisplayedMoney(runningMoney);
            if (step.amount > 0) {
              runningQuota += step.amount;
              setDisplayedQuotaProgress(runningQuota);
            }
            fortunariumAudio.playCoinCountTick(idx);
          }
        }, idx * stepDurationMs);
        timersRef.current.push(stepTimer);
      });

      const summaryDelay = steps.length * stepDurationMs + 80;
      const summaryTimer = setTimeout(() => {
        setActiveRevealStep(null);
        setDisplayedMoney(spinEvent.finalMoney);
        setDisplayedQuotaProgress(spinEvent.finalQuotaProgress);
        setDisplayedIntegrity(spinEvent.finalIntegrity);
        setDisplayedVoltage(spinEvent.voltageMultiplierAfter);
        setDisplayedKeys(spinEvent.finalKeys);

        fortunariumAudio.playWinTierSting(tier);

        const bannerTitle =
          tier === 'JACKPOT'
            ? '¡GRAN BOTE DEL FORTUNARIUM!'
            : tier === 'HUGE'
            ? '¡PREMIO COLOSAL!'
            : tier === 'BIG'
            ? '¡GRAN COMBINACIÓN!'
            : tier === 'LOSS'
            ? '¡AVERÍA EN LOS RODILLOS!'
            : spinEvent.grossPayout > 0
            ? `¡PREMIO +${spinEvent.grossPayout} CR!`
            : 'TIRADA COMPLETADA';

        setFinalOutcomeBanner({
          title: bannerTitle,
          subtitle:
            steps.length > 1
              ? `${steps.length} efectos resueltos en secuencia`
              : steps[0]?.title || '',
          netAmount: spinEvent.grossPayout - spinEvent.penalties,
          tier,
        });

        const finishTimer = setTimeout(() => {
          setIsRevealingRewards(false);
          setIsSpinPresentationActive(false);
          setFinalOutcomeBanner(null);
        }, 1600);
        timersRef.current.push(finishTimer);
      }, summaryDelay);
      timersRef.current.push(summaryTimer);
    }, 3020);
    timersRef.current.push(postStopTimer);
  }, [spinEvent, clearAllSpinTimers]);

  // Derived gameplay state
  const localPlayer = roomState.players.find((p) => p.id === localPlayerId);
  const currentTurnPlayer = roomState.players.find(
    (p) => p.id === roomState.currentTurnPlayerId
  );
  const isMyTurn =
    roomState.config.turnMode === 'free' ||
    roomState.currentTurnPlayerId === localPlayerId;

  const isAnyReelSpinning = reelsSpinning.some(Boolean);
  const isBusy = roomState.isSpinning || isAnyReelSpinning || isSpinPresentationActive;

  const currentSpinCost = useMemo(
    () => calculateEffectiveSpinCost(roomState.betMode, roomState.upgrades),
    [roomState.betMode, roomState.upgrades]
  );

  const canSpin =
    roomState.phase === 'PLAYING' &&
    !isBusy &&
    roomState.spinsLeft > 0 &&
    roomState.money > 0 &&
    isMyTurn;

  const quotaMet = displayedQuotaProgress >= roomState.quota;
  const quotaPct = Math.min(
    100,
    Math.round((displayedQuotaProgress / Math.max(1, roomState.quota)) * 100)
  );
  const integrityPct = Math.max(
    0,
    Math.min(100, Math.round((displayedIntegrity / roomState.maxIntegrity) * 100))
  );
  const repairCost = 28 + (roomState.round - 1) * 8;

  // Highlighted cells ONLY when reels have finished stopping
  const highlightedWinCells = useMemo(() => {
    const map = new Set<string>();
    if (isAnyReelSpinning) return map;

    if (activeRevealStep) {
      if (activeRevealStep.variant !== 'hazard') {
        for (const c of activeRevealStep.cells) {
          map.add(`${c.col},${c.row}`);
        }
      }
      return map;
    }

    if (
      (isRevealingRewards || finalOutcomeBanner) &&
      roomState.lastSpinResult?.winningCells
    ) {
      for (const c of roomState.lastSpinResult.winningCells) {
        map.add(`${c.col},${c.row}`);
      }
    }
    return map;
  }, [
    isAnyReelSpinning,
    activeRevealStep,
    isRevealingRewards,
    finalOutcomeBanner,
    roomState.lastSpinResult,
  ]);

  const highlightedHazardCells = useMemo(() => {
    const map = new Set<string>();
    if (isAnyReelSpinning) return map;

    if (activeRevealStep) {
      if (activeRevealStep.variant === 'hazard') {
        for (const c of activeRevealStep.cells) {
          map.add(`${c.col},${c.row}`);
        }
      }
      return map;
    }

    if (
      (isRevealingRewards || finalOutcomeBanner) &&
      roomState.lastSpinResult?.hazardCells
    ) {
      for (const c of roomState.lastSpinResult.hazardCells) {
        map.add(`${c.col},${c.row}`);
      }
    }
    return map;
  }, [
    isAnyReelSpinning,
    activeRevealStep,
    isRevealingRewards,
    finalOutcomeBanner,
    roomState.lastSpinResult,
  ]);

  // Installed upgrades list for compact cabinet badge bar
  const installedUpgrades = useMemo(() => {
    return ALL_UPGRADE_IDS.filter((id) => (roomState.upgrades[id] || 0) > 0).map(
      (id) => ({
        meta: FORTUNARIUM_UPGRADES_CATALOG[id],
        level: roomState.upgrades[id],
      })
    );
  }, [roomState.upgrades]);

  // Handlers
  const handleTriggerSpin = useCallback(
    (forceScenario?: 'single_pattern' | 'multi_pattern' | 'special_symbol' | 'jackpot') => {
      if (!canSpin) return;
      onSpinSlot(forceScenario);
    },
    [canSpin, onSpinSlot]
  );

  // Spacebar shortcut to spin when no modal is open
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === 'Space' &&
        !showWorkshopModal &&
        !showPrizeTableModal &&
        !showRulebookModal &&
        !showAudioModal &&
        !showTeamDrawer &&
        !showExitConfirmModal &&
        !showDevModal
      ) {
        e.preventDefault();
        handleTriggerSpin();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    handleTriggerSpin,
    showWorkshopModal,
    showPrizeTableModal,
    showRulebookModal,
    showAudioModal,
    showTeamDrawer,
    showExitConfirmModal,
    showDevModal,
  ]);

  const handleStepBetMode = (direction: -1 | 1) => {
    if (isBusy || !isMyTurn) return;
    const order: FortunariumBetMode[] = ['normal', 'doble', 'sobrecarga'];
    const idx = order.indexOf(roomState.betMode);
    const nextIdx = Math.max(0, Math.min(order.length - 1, idx + direction));
    if (nextIdx !== idx) {
      fortunariumAudio.playButtonClick();
      onSetBetMode(order[nextIdx]);
    }
  };

  const handleCopyRoomCode = () => {
    try {
      navigator.clipboard.writeText(roomState.roomCode);
      setCopiedCode(true);
      fortunariumAudio.playButtonClick();
      setTimeout(() => setCopiedCode(false), 1800);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const normX = (e.clientX - rect.left) / rect.width;
    const normY = (e.clientY - rect.top) / rect.height;
    onSendCursorMove(normX, normY);
  };

  return (
    <div
      ref={stageRef}
      onPointerMove={handlePointerMove}
      className="fixed inset-0 w-screen h-[100dvh] bg-[#071120] text-amber-50 flex flex-col overflow-hidden select-none z-50"
    >
      {/* FULL-BLEED ILLUSTRATED CASINO BACKGROUND (No black strips anywhere) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Deep Prussian & Royal Blue Casino Hall Gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,#163b5c_0%,#0b2038_52%,#050d1a_100%)]" />
        {/* Subtle Art-Deco Casino Wallpaper Stripes */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(251,191,36,0.12) 0px, rgba(251,191,36,0.12) 2px, transparent 2px, transparent 48px)',
          }}
        />
        {/* Warm Overhead Casino Chandelier Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[900px] h-[380px] rounded-full bg-amber-400/15 blur-[110px]" />
        <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-[#03070e] to-transparent" />
      </div>

      {/* REALTIME MULTIPLAYER CURSORS OVERLAY */}
      <FortunariumCursorsOverlay
        localPlayerId={localPlayerId}
        players={roomState.players}
        subscribeToCursors={subscribeToCursors}
      />

      {/* ===================================================================== */}
      {/* 1. COMPACT SINGLE TOP HEADER BAR (h-12)                               */}
      {/* ===================================================================== */}
      <header className="relative z-30 h-12 shrink-0 w-full bg-[#060f1d]/95 border-b border-amber-400/30 px-2.5 sm:px-4 flex items-center justify-between gap-2 backdrop-blur-md shadow-lg">
        {/* Left Group: Exit, Title, Room Code, Quota Cycle */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => {
              fortunariumAudio.playButtonClick();
              setShowExitConfirmModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-stone-900/90 hover:bg-rose-950/80 border border-amber-500/30 hover:border-rose-500/50 text-amber-200 hover:text-rose-200 text-xs font-bold transition-all cursor-pointer shrink-0 active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
            <span>SALIR</span>
          </button>

          <span className="hidden md:inline font-fortunarium text-lg text-amber-300 tracking-wider drop-shadow">
            FORTUNARIUM
          </span>

          <button
            type="button"
            onClick={handleCopyRoomCode}
            title="Copiar código de sala"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-900/90 hover:bg-stone-800 border border-amber-500/25 text-xs font-mono font-black text-amber-300 cursor-pointer shrink-0"
          >
            <span className="text-stone-400 font-sans font-bold text-[10px]">SALA</span>
            <span className="tracking-wider">{roomState.roomCode}</span>
            {copiedCode ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3 text-amber-400/80" />
            )}
          </button>

          <div className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-400/40 text-xs font-mono font-black text-amber-200 tabular-nums shrink-0">
            CUOTA {roomState.round}/{roomState.totalRounds}
          </div>
        </div>

        {/* Right Group: Manual, Premios, Taller, Sonido, Equipo (+ Dev Lab) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {import.meta.env.DEV && (
            <button
              type="button"
              onClick={() => {
                fortunariumAudio.playButtonClick();
                setShowDevModal(true);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-fuchsia-950/90 hover:bg-fuchsia-900 border border-fuchsia-400/50 text-fuchsia-200 text-xs font-black flex items-center gap-1 cursor-pointer"
              title="Simulador de Economía y Probabilidades (DEV)"
            >
              <FlaskConical className="w-3.5 h-3.5 text-fuchsia-300" />
              <span className="hidden xl:inline">SIMULADOR</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              fortunariumAudio.playButtonClick();
              setShowRulebookModal(true);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-amber-500/35 text-amber-100 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">MANUAL</span>
          </button>

          <button
            type="button"
            onClick={() => {
              fortunariumAudio.playButtonClick();
              setShowPrizeTableModal(true);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-amber-500/35 text-amber-100 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">PREMIOS</span>
          </button>

          <button
            type="button"
            onClick={() => {
              fortunariumAudio.playButtonClick();
              setShowWorkshopModal(true);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/60 text-amber-200 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
          >
            <Wrench className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">TALLER</span>
            {displayedKeys > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-stone-950 font-mono text-[10px] font-black tabular-nums">
                {displayedKeys}🔑
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              fortunariumAudio.playButtonClick();
              setShowAudioModal(true);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-amber-500/35 text-amber-100 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
          >
            {isAudioMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className="hidden md:inline">SONIDO</span>
          </button>

          <button
            type="button"
            onClick={() => {
              fortunariumAudio.playButtonClick();
              setShowTeamDrawer((v) => !v);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-amber-500/35 text-amber-100 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
          >
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">EQUIPO</span>
            <span className="font-mono text-[11px] text-amber-300 tabular-nums">
              ({roomState.players.length})
            </span>
          </button>
        </div>
      </header>

      {/* FLOATING ERROR TOAST */}
      {errorMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-rose-950/95 border-2 border-rose-500 text-rose-100 text-xs sm:text-sm font-bold shadow-2xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* QUOTA COMPLETED CELEBRATION BANNER */}
      {showQuotaBanner && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 pointer-events-none animate-bounce">
          <div className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 border-2 border-yellow-300 shadow-[0_0_40px_rgba(16,185,129,0.8)] text-center">
            <div className="text-lg sm:text-xl font-fortunarium text-yellow-200 tracking-wider">
              ¡CUOTA {roomState.round} SUPERADA!
            </div>
            <div className="text-xs font-bold text-white">
              Podéis sellar la cuota ahora para cobrar bono y elegir 1 de las 3 mejoras
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. CENTRAL ILLUSTRATED SLOT MACHINE CABINET STAGE                     */}
      {/* ===================================================================== */}
      <main className="relative z-10 flex-1 min-h-0 w-full flex items-center justify-center px-2 sm:px-6 py-2 overflow-hidden">
        <div
          className={`relative w-full max-w-[1060px] h-full max-h-[840px] flex items-center justify-center transition-transform duration-150 ${
            machineShake ? 'translate-x-1.5 -translate-y-1 scale-[1.01]' : ''
          }`}
        >
          {/* MAIN TURQUOISE / AGED-METAL & GOLD-BRASS SLOT CABINET */}
          <div className="relative w-full max-w-[920px] h-full max-h-[810px] rounded-[36px] bg-gradient-to-b from-[#1f5f6b] via-[#13424d] to-[#0b2931] border-[5px] border-[#d9a441] shadow-[0_25px_70px_rgba(0,0,0,0.85),inset_0_2px_12px_rgba(255,255,255,0.25)] p-3 sm:p-5 flex flex-col justify-between gap-2.5 overflow-hidden">
            {/* Decorative Rivets & Aged Brass Corner Plates */}
            <div className="pointer-events-none absolute inset-1.5 rounded-[30px] border border-amber-300/25" />

            {/* --------------------------------------------------------------- */}
            {/* CABINET SECTION A: ILLUMINATED MARQUEE ARCH & TURN STATUS       */}
            {/* --------------------------------------------------------------- */}
            <div className="relative z-10 rounded-2xl bg-gradient-to-b from-[#2b1810] via-[#1b0f0a] to-[#120906] border-[3px] border-[#e5b54f] px-3.5 py-2 shadow-[0_6px_20px_rgba(0,0,0,0.6),inset_0_0_24px_rgba(245,158,11,0.18)] flex flex-col gap-1.5 shrink-0">
              {/* Row 1: Bulb strip + FORTUNARIUM Title + Turn Badge */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[0, 1, 2].map((b) => (
                      <span
                        key={b}
                        className={`w-2.5 h-2.5 rounded-full border border-amber-200 ${
                          isAnyReelSpinning
                            ? 'bg-yellow-300 animate-ping'
                            : 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
                        }`}
                      />
                    ))}
                  </div>
                  <h1 className="font-fortunarium text-xl sm:text-2xl md:text-3xl text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-amber-300 to-amber-500 tracking-wider drop-shadow-[0_2px_6px_rgba(245,158,11,0.5)]">
                    FORTUNARIUM
                  </h1>
                </div>

                {/* Active Turn / Mode Pill */}
                <div className="flex items-center gap-2">
                  {installedUpgrades.length > 0 && (
                    <div
                      onClick={() => setShowWorkshopModal(true)}
                      title="Ver mejoras instaladas en la máquina"
                      className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-stone-900/90 border border-amber-500/35 cursor-pointer hover:border-amber-400"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="text-[11px] font-bold text-amber-200">
                        {installedUpgrades.length} Mejoras Activas
                      </span>
                    </div>
                  )}

                  <div className="px-3 py-1 rounded-xl bg-stone-900/95 border border-amber-400/40 flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: currentTurnPlayer?.color || '#fbbf24' }}
                    />
                    <span className="text-xs font-bold text-stone-200">
                      {roomState.config.turnMode === 'free'
                        ? 'Palanca Libre'
                        : isMyTurn
                        ? '¡TU TURNO EN LA MÁQUINA!'
                        : `Turno de ${currentTurnPlayer?.name || 'Operador'}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 2: Live Digital Ticker (Spin status / Sequential pattern step / Ready state) */}
              <div className="h-8 rounded-xl bg-[#090d14] border border-amber-500/35 px-3 flex items-center justify-between gap-2 overflow-hidden shadow-inner">
                {isAnyReelSpinning ? (
                  <div className="w-full flex items-center justify-center gap-2 text-amber-300 font-bold text-xs sm:text-sm animate-pulse">
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                    <span>
                      GIRANDO RODILLOS ({spinEvent?.playerName || localPlayer?.name}) — COSTE -
                      {spinEvent?.spinCost ?? currentSpinCost} CR
                    </span>
                  </div>
                ) : activeRevealStep ? (
                  <div className="w-full flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-2 py-0.5 rounded bg-amber-500 text-stone-950 font-mono text-[11px] font-black tabular-nums shrink-0">
                        PASO {activeRevealStepIndex}/{totalRevealSteps}
                      </span>
                      <span
                        className={`font-fortunarium text-sm sm:text-base tracking-wide truncate ${
                          activeRevealStep.variant === 'hazard'
                            ? 'text-rose-400'
                            : 'text-yellow-300'
                        }`}
                      >
                        {activeRevealStep.title}
                      </span>
                      {activeRevealStep.subtitle && (
                        <span className="hidden sm:inline text-xs text-stone-300 truncate">
                          — {activeRevealStep.subtitle}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 font-mono font-black text-xs sm:text-sm tabular-nums">
                      {activeRevealStep.amount !== 0 && (
                        <span
                          className={
                            activeRevealStep.amount > 0 ? 'text-emerald-400' : 'text-rose-400'
                          }
                        >
                          {activeRevealStep.amount > 0
                            ? `+${activeRevealStep.amount} CR`
                            : `${activeRevealStep.amount} CR`}
                        </span>
                      )}
                      {activeRevealStep.integrityDelta !== 0 && (
                        <span
                          className={
                            activeRevealStep.integrityDelta > 0
                              ? 'text-emerald-300'
                              : 'text-rose-400'
                          }
                        >
                          {activeRevealStep.integrityDelta > 0
                            ? `+${activeRevealStep.integrityDelta}% INT`
                            : `${activeRevealStep.integrityDelta}% INT`}
                        </span>
                      )}
                    </div>
                  </div>
                ) : finalOutcomeBanner ? (
                  <div className="w-full flex items-center justify-between gap-2">
                    <span
                      className={`font-fortunarium text-sm sm:text-base tracking-wide truncate ${
                        finalOutcomeBanner.tier === 'LOSS'
                          ? 'text-rose-400'
                          : finalOutcomeBanner.netAmount > 0
                          ? 'text-emerald-300'
                          : 'text-stone-300'
                      }`}
                    >
                      {finalOutcomeBanner.title}
                    </span>
                    <span className="text-xs text-stone-300 truncate hidden sm:inline">
                      {finalOutcomeBanner.subtitle}
                    </span>
                    <span
                      className={`font-mono font-black text-xs sm:text-sm tabular-nums ${
                        finalOutcomeBanner.netAmount > 0
                          ? 'text-emerald-400'
                          : finalOutcomeBanner.netAmount < 0
                          ? 'text-rose-400'
                          : 'text-stone-400'
                      }`}
                    >
                      {finalOutcomeBanner.netAmount > 0
                        ? `+${finalOutcomeBanner.netAmount} CR`
                        : `${finalOutcomeBanner.netAmount} CR`}
                    </span>
                  </div>
                ) : (
                  <div className="w-full flex items-center justify-between text-xs text-stone-300">
                    <span className="truncate">
                      {roomState.actionLog[0]?.text ||
                        'Alinea 3, 4 o 5 símbolos iguales en cualquiera de los 8 patrones.'}
                    </span>
                    <span className="font-mono font-bold text-amber-300/90 shrink-0 ml-2 tabular-nums">
                      Apuesta {FORTUNARIUM_BET_MODES[roomState.betMode].shortLabel} (-
                      {currentSpinCost} CR)
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* --------------------------------------------------------------- */}
            {/* CABINET SECTION B: 3 HIGH-CONTRAST DIGITAL READOUT SCREENS      */}
            {/* --------------------------------------------------------------- */}
            <div className="relative z-10 grid grid-cols-3 gap-2 sm:gap-3 shrink-0">
              {/* Screen 1: PROGRESO DE CUOTA */}
              <div className="rounded-2xl bg-[#08131c] border-2 border-[#d9a441]/80 p-2.5 sm:p-3 shadow-[inset_0_2px_10px_rgba(0,0,0,0.85)] flex flex-col justify-between gap-1.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-300/90">
                    PROGRESO CUOTA {roomState.round}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-black tabular-nums ${
                      quotaMet
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                        : 'bg-amber-500/15 text-amber-300'
                    }`}
                  >
                    {quotaPct}%
                  </span>
                </div>

                <div className="flex items-baseline justify-between gap-1">
                  <div className="font-mono font-black text-base sm:text-2xl text-white tabular-nums tracking-tight">
                    {displayedQuotaProgress}
                    <span className="text-xs sm:text-base text-amber-300/90 font-bold">
                      {' '}
                      / {roomState.quota} CR
                    </span>
                  </div>

                  {quotaMet && !isBusy && roomState.phase === 'PLAYING' && (
                    <button
                      type="button"
                      onClick={() => {
                        fortunariumAudio.playButtonClick();
                        onPayQuotaEarly();
                      }}
                      className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-stone-950 font-black text-[10px] sm:text-xs uppercase tracking-wider shadow-md cursor-pointer animate-pulse shrink-0"
                    >
                      SELLAR CUOTA
                    </button>
                  )}
                </div>

                <div className="w-full h-2 rounded-full bg-stone-900 overflow-hidden border border-stone-800">
                  <div
                    className={`h-full transition-all duration-300 ${
                      quotaMet
                        ? 'bg-gradient-to-r from-emerald-400 to-teal-300'
                        : 'bg-gradient-to-r from-amber-500 to-yellow-300'
                    }`}
                    style={{ width: `${quotaPct}%` }}
                  />
                </div>
              </div>

              {/* Screen 2: CAJA COMÚN + VOLTAJE + LLAVES */}
              <div className="rounded-2xl bg-[#08131c] border-2 border-[#d9a441]/80 p-2.5 sm:p-3 shadow-[inset_0_2px_10px_rgba(0,0,0,0.85)] flex flex-col justify-between gap-1.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-300/90">
                    CAJA COMÚN DISPONIBLE
                  </span>
                  <span className="text-[10px] font-mono font-bold text-stone-400 tabular-nums">
                    Coste: -{currentSpinCost} CR
                  </span>
                </div>

                <div className="font-mono font-black text-xl sm:text-3xl text-amber-300 tabular-nums tracking-tight leading-none">
                  {displayedMoney} <span className="text-xs sm:text-base text-amber-200">CR</span>
                </div>

                <div className="flex items-center justify-between gap-1.5 pt-0.5 border-t border-stone-800/90 text-[11px] font-mono font-black tabular-nums">
                  <span className="text-sky-300 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-sky-400" />
                    VOLT x{displayedVoltage.toFixed(2)}
                  </span>
                  <span className="text-amber-200 flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    {displayedKeys} {displayedKeys === 1 ? 'LLAVE' : 'LLAVES'}
                  </span>
                </div>
              </div>

              {/* Screen 3: TIRADAS RESTANTES & INTEGRIDAD MECÁNICA */}
              <div className="rounded-2xl bg-[#08131c] border-2 border-[#d9a441]/80 p-2.5 sm:p-3 shadow-[inset_0_2px_10px_rgba(0,0,0,0.85)] flex flex-col justify-between gap-1.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-300/90">
                    TIRADAS Y CHASIS
                  </span>
                  <span
                    className={`text-xs font-mono font-black tabular-nums ${
                      integrityPct <= 30
                        ? 'text-rose-400 animate-pulse'
                        : integrityPct <= 60
                        ? 'text-amber-300'
                        : 'text-emerald-400'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5 inline mr-0.5" />
                    {displayedIntegrity}%
                  </span>
                </div>

                <div className="flex items-baseline justify-between gap-1">
                  <div className="font-mono font-black text-base sm:text-2xl text-white tabular-nums">
                    {roomState.spinsLeft}
                    <span className="text-xs sm:text-sm text-stone-400 font-bold">
                      /{roomState.maxSpinsPerRound} TIRADAS
                    </span>
                  </div>

                  {displayedIntegrity < roomState.maxIntegrity && !isBusy && (
                    <button
                      type="button"
                      onClick={() => {
                        fortunariumAudio.playButtonClick();
                        onRepairMachine(false);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/50 text-emerald-200 font-mono font-black text-[10px] cursor-pointer shrink-0"
                      title={`Reparar máquina por ${repairCost} CR`}
                    >
                      +REPARAR ({repairCost} CR)
                    </button>
                  )}
                </div>

                <div className="w-full h-2 rounded-full bg-stone-900 overflow-hidden border border-stone-800">
                  <div
                    className={`h-full transition-all duration-300 ${
                      integrityPct <= 30
                        ? 'bg-rose-500'
                        : integrityPct <= 60
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${integrityPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------------- */}
            {/* CABINET SECTION C: 5-REEL VERTICAL CAROUSEL WINDOW + RIGHT LEVER */}
            {/* --------------------------------------------------------------- */}
            <div className="relative z-10 flex-1 min-h-0 flex items-stretch gap-2.5 sm:gap-3.5">
              {/* Cream & Gold Trim Reel Frame (`5 columns × 3 rows`) */}
              <div className="relative flex-1 min-h-0 rounded-[28px] bg-gradient-to-b from-[#d9a441] via-[#b87e22] to-[#8a5812] p-2 sm:p-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.75)] flex flex-col">
                <div className="relative flex-1 min-h-0 rounded-[22px] bg-[#161210] border-4 border-[#3a2818] p-2 sm:p-3 grid grid-cols-5 gap-2 sm:gap-3 overflow-hidden shadow-[inset_0_12px_28px_rgba(0,0,0,0.9)]">
                  {[0, 1, 2, 3, 4].map((colIdx) => {
                    const isSpinningCol = reelsSpinning[colIdx];
                    const isBounceCol = reelsLandedBounce[colIdx];
                    const strip = reelStrips[colIdx] || settledGrid[colIdx] || [
                      'cereza',
                      'siete',
                      'limon',
                    ];
                    const settledCol = settledGrid[colIdx] || ['cereza', 'siete', 'limon'];
                    const totalStripCount = strip.length; // 24 symbols = 8 windows of 3

                    return (
                      <div
                        key={colIdx}
                        className="relative h-full w-full rounded-2xl bg-gradient-to-b from-[#e9dec5] via-[#faf4e4] to-[#dfd0b0] border-2 border-[#8c6223] overflow-hidden shadow-[inset_0_8px_18px_rgba(0,0,0,0.38)]"
                      >
                        {/* Top & Bottom Cylindrical Reel Drum Shading */}
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-7 bg-gradient-to-b from-black/45 to-transparent z-20" />
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-7 bg-gradient-to-t from-black/45 to-transparent z-20" />

                        {isSpinningCol ? (
                          /* TRUE VERTICAL CAROUSEL STRIP MOVING TOP-TO-BOTTOM */
                          <div
                            key={`spin_${spinEvent?.spinId || 'init'}_${colIdx}`}
                            style={{
                              height: `${(totalStripCount / 3) * 100}%`,
                              animation: `fortunariumReelCarouselDown ${REEL_STOP_DELAYS_MS[colIdx]}ms cubic-bezier(0.15, 0.85, 0.25, 1) forwards`,
                            }}
                            className="w-full flex flex-col will-change-transform"
                          >
                            {strip.map((symId, itemIdx) => {
                              const symMeta =
                                FORTUNARIUM_SYMBOLS[symId] || FORTUNARIUM_SYMBOLS.cereza;
                              return (
                                <div
                                  key={itemIdx}
                                  style={{ height: `${100 / totalStripCount}%` }}
                                  className="w-full p-1.5 sm:p-2.5 flex items-center justify-center border-b border-amber-900/15"
                                >
                                  <img
                                    src={symMeta.asset}
                                    alt={symMeta.name}
                                    className="w-full h-full object-contain drop-shadow-[0_3px_5px_rgba(0,0,0,0.35)]"
                                    draggable={false}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          /* SETTLED 3-ROW COLUMN WITH MECHANICAL BOUNCE & POST-STOP HIGHLIGHTS */
                          <div
                            className={`w-full h-full grid grid-rows-3 divide-y divide-amber-950/15 transition-transform duration-200 ${
                              isBounceCol ? 'translate-y-1.5 scale-y-[0.98]' : 'translate-y-0'
                            }`}
                          >
                            {[0, 1, 2].map((rowIdx) => {
                              const symId = settledCol[rowIdx] || 'cereza';
                              const symMeta =
                                FORTUNARIUM_SYMBOLS[symId] || FORTUNARIUM_SYMBOLS.cereza;
                              const coordKey = `${colIdx},${rowIdx}`;
                              const isWinCell = highlightedWinCells.has(coordKey);
                              const isHazardCell = highlightedHazardCells.has(coordKey);

                              return (
                                <div
                                  key={rowIdx}
                                  className={`relative w-full h-full p-1.5 sm:p-2.5 flex items-center justify-center transition-all duration-200 ${
                                    isWinCell
                                      ? 'bg-amber-300/45 ring-4 ring-inset ring-amber-400 shadow-[inset_0_0_25px_rgba(245,158,11,0.75)] z-10'
                                      : isHazardCell
                                      ? 'bg-rose-500/45 ring-4 ring-inset ring-rose-500 shadow-[inset_0_0_25px_rgba(244,63,94,0.85)] z-10'
                                      : ''
                                  }`}
                                >
                                  <img
                                    src={symMeta.asset}
                                    alt={symMeta.name}
                                    className={`w-full h-full object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)] transition-transform duration-200 ${
                                      isWinCell
                                        ? 'scale-110 animate-bounce'
                                        : isHazardCell
                                        ? 'scale-110 animate-pulse'
                                        : ''
                                    }`}
                                    draggable={false}
                                  />

                                  {/* Subtle corner badge for Special Symbols once stopped */}
                                  {symMeta.category === 'special' && (
                                    <span
                                      className={`absolute bottom-1 right-1 px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-tight shadow ${
                                        symId === 'bomba' || symId === 'calavera'
                                          ? 'bg-rose-600 text-white'
                                          : 'bg-amber-950/90 text-amber-200 border border-amber-400/50'
                                      }`}
                                    >
                                      {symMeta.name}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right-Side Interactive Mechanical Slot Lever */}
              <button
                type="button"
                disabled={!canSpin}
                onClick={() => handleTriggerSpin()}
                title={
                  canSpin
                    ? 'Tirar de la palanca mecánica (Espacio)'
                    : 'Esperando turno o tirada en curso'
                }
                className={`hidden sm:flex w-16 md:w-20 rounded-3xl bg-gradient-to-b from-[#173f49] via-[#0e2a32] to-[#081a20] border-[3px] border-[#d9a441] p-2 flex-col items-center justify-between shadow-2xl transition-all ${
                  canSpin
                    ? 'cursor-pointer hover:border-yellow-300 group'
                    : 'opacity-60 cursor-not-allowed'
                }`}
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                  PALANCA
                </span>

                {/* Mechanical Shaft & Red Ball Knob */}
                <div className="relative flex-1 w-full flex items-center justify-center my-2">
                  <div className="w-3 h-full rounded-full bg-gradient-to-r from-stone-400 via-stone-100 to-stone-500 border border-stone-700 shadow-inner" />
                  <div
                    className={`absolute w-11 h-11 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-rose-400 via-red-600 to-rose-950 border-2 border-amber-200 shadow-[0_6px_16px_rgba(225,29,72,0.75)] transition-all duration-300 flex items-center justify-center ${
                      leverPulled || isAnyReelSpinning
                        ? 'translate-y-12 scale-95'
                        : '-translate-y-10 group-hover:-translate-y-8'
                    }`}
                  >
                    <div className="w-3.5 h-3.5 rounded-full bg-white/40 -translate-x-1 -translate-y-1" />
                  </div>
                </div>

                <span className="text-[10px] font-mono font-black text-amber-200">
                  TIRAR
                </span>
              </button>
            </div>

            {/* --------------------------------------------------------------- */}
            {/* CABINET SECTION D: MECHANICAL CONTROL DECK                      */}
            {/* --------------------------------------------------------------- */}
            <div className="relative z-10 rounded-2xl bg-gradient-to-b from-[#23150e] via-[#180e09] to-[#0f0805] border-[3px] border-[#d9a441] p-2.5 sm:p-3 shadow-[0_10px_25px_rgba(0,0,0,0.8)] flex flex-wrap items-center justify-between gap-2 shrink-0">
              {/* Left Controls: APUESTA MÍN / - / MODE BADGE / + / APUESTA MÁX */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <button
                  type="button"
                  disabled={isBusy || !isMyTurn || roomState.betMode === 'normal'}
                  onClick={() => {
                    fortunariumAudio.playButtonClick();
                    onSetBetMode('normal');
                  }}
                  className={`px-2.5 py-2 rounded-xl border-2 text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed active:translate-y-0.5 ${
                    roomState.betMode === 'normal'
                      ? 'bg-amber-500 text-stone-950 border-yellow-200 shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                      : 'bg-stone-900 hover:bg-stone-800 text-amber-200 border-amber-500/40'
                  }`}
                >
                  APUESTA MÍN
                </button>

                <button
                  type="button"
                  disabled={isBusy || !isMyTurn || roomState.betMode === 'normal'}
                  onClick={() => handleStepBetMode(-1)}
                  className="w-9 h-9 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-40 border-2 border-amber-500/40 text-amber-200 flex items-center justify-center font-black cursor-pointer disabled:cursor-not-allowed active:translate-y-0.5"
                  title="Reducir modo de apuesta"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <div className="px-3 py-1.5 rounded-xl bg-[#090d14] border border-amber-500/40 text-center min-w-[108px]">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-stone-400">
                    MODO ACTUAL
                  </div>
                  <div className="text-xs font-mono font-black text-amber-300 tabular-nums">
                    {FORTUNARIUM_BET_MODES[roomState.betMode].shortLabel} (-{currentSpinCost} CR)
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isBusy || !isMyTurn || roomState.betMode === 'sobrecarga'}
                  onClick={() => handleStepBetMode(1)}
                  className="w-9 h-9 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-40 border-2 border-amber-500/40 text-amber-200 flex items-center justify-center font-black cursor-pointer disabled:cursor-not-allowed active:translate-y-0.5"
                  title="Aumentar modo de apuesta"
                >
                  <Plus className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  disabled={isBusy || !isMyTurn || roomState.betMode === 'sobrecarga'}
                  onClick={() => {
                    fortunariumAudio.playButtonClick();
                    onSetBetMode('sobrecarga');
                  }}
                  className={`px-2.5 py-2 rounded-xl border-2 text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed active:translate-y-0.5 ${
                    roomState.betMode === 'sobrecarga'
                      ? 'bg-rose-600 text-white border-rose-300 shadow-[0_0_14px_rgba(225,29,72,0.65)]'
                      : 'bg-stone-900 hover:bg-stone-800 text-amber-200 border-amber-500/40'
                  }`}
                >
                  APUESTA MÁX
                </button>
              </div>

              {/* Center Primary Mechanical Spin Button: GIRAR */}
              <button
                type="button"
                disabled={!canSpin}
                onClick={() => handleTriggerSpin()}
                className={`flex-1 min-w-[180px] max-w-[300px] py-3 px-6 rounded-2xl border-[3px] transition-all flex flex-col items-center justify-center shadow-2xl ${
                  canSpin
                    ? 'bg-gradient-to-b from-red-500 via-rose-600 to-red-800 hover:from-red-400 hover:to-red-700 border-yellow-300 text-white cursor-pointer shadow-[0_6px_0_#7f1d1d,0_10px_25px_rgba(225,29,72,0.6)] active:translate-y-1 active:shadow-[0_2px_0_#7f1d1d]'
                    : 'bg-stone-800 border-stone-600 text-stone-400 cursor-not-allowed opacity-75'
                }`}
              >
                <span className="font-fortunarium text-xl sm:text-2xl tracking-widest leading-none drop-shadow">
                  {isAnyReelSpinning
                    ? 'GIRANDO...'
                    : isRevealingRewards
                    ? 'RESOLVIENDO...'
                    : '¡GIRAR!'}
                </span>
                <span className="text-[11px] font-mono font-black text-amber-200 mt-0.5 tabular-nums">
                  {canSpin
                    ? `COSTE: -${currentSpinCost} CR · [ESPACIO]`
                    : !isMyTurn
                    ? `TURNO DE ${currentTurnPlayer?.name?.toUpperCase() || 'COMPAÑERO'}`
                    : 'ESPERANDO...'}
                </span>
              </button>

              {/* Right Utility Buttons on Deck: REPARAR & TALLER */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isBusy || displayedIntegrity >= roomState.maxIntegrity}
                  onClick={() => {
                    fortunariumAudio.playButtonClick();
                    onRepairMachine(false);
                  }}
                  className="px-3 py-2 rounded-xl bg-emerald-950/90 hover:bg-emerald-900 disabled:opacity-40 border-2 border-emerald-400/50 text-emerald-200 text-xs font-black flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed active:translate-y-0.5"
                  title={`Reparar +25% de Integridad por ${repairCost} CR`}
                >
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <div className="text-left leading-tight">
                    <div className="text-[10px] uppercase">REPARAR</div>
                    <div className="font-mono text-[11px] tabular-nums">{repairCost} CR</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    fortunariumAudio.playButtonClick();
                    setShowWorkshopModal(true);
                  }}
                  className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border-2 border-amber-400/60 text-amber-200 text-xs font-black flex items-center gap-1.5 cursor-pointer active:translate-y-0.5"
                >
                  <Wrench className="w-4 h-4 text-amber-300" />
                  <div className="text-left leading-tight">
                    <div className="text-[10px] uppercase">TALLER</div>
                    <div className="font-mono text-[11px] tabular-nums">
                      {installedUpgrades.length} MEJ.
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Keyframe style for smooth top-to-bottom vertical reel carousel */}
      <style>{`
        @keyframes fortunariumReelCarouselDown {
          0% {
            transform: translateY(-87.5%);
          }
          100% {
            transform: translateY(0%);
          }
        }
      `}</style>

      {/* ===================================================================== */}
      {/* 3. INTERACTIVE MYSTERY EVENT MODAL (`EVENT_CHOICE`)                   */}
      {/* ===================================================================== */}
      {roomState.phase === 'EVENT_CHOICE' && roomState.activeEvent && !isBusy && (
        <div className="fixed inset-0 z-[75] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-3xl bg-stone-950 border-2 border-amber-400 p-5 sm:p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-xs font-black text-amber-300 uppercase tracking-wider">
                Suceso Mecánico · Activado por {roomState.activeEvent.triggeredByPlayerName}
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-fortunarium text-amber-300 tracking-wide">
                {roomState.activeEvent.title.toUpperCase()}
              </h2>
              <p className="text-xs sm:text-sm text-stone-300 mt-1 leading-relaxed">
                {roomState.activeEvent.subtitle}
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              {roomState.activeEvent.options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    fortunariumAudio.playButtonClick();
                    onResolveEvent(opt.id);
                  }}
                  className="p-4 rounded-2xl bg-stone-900 hover:bg-stone-800 border border-amber-500/35 hover:border-amber-400 text-left flex items-center justify-between gap-3 transition-all cursor-pointer active:scale-[0.99]"
                >
                  <div>
                    <div className="text-sm font-black text-white">{opt.label}</div>
                    <p className="text-xs text-stone-300 mt-0.5">{opt.description}</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-lg font-mono text-xs font-black shrink-0 ${
                      opt.riskLevel === 'high'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : opt.riskLevel === 'medium'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {opt.badgeText}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. QUOTA COMPLETED: 3 BUILD-DEFINING UPGRADES SELECTION (`ROUND_SHOP`)*/}
      {/* ===================================================================== */}
      {roomState.phase === 'ROUND_SHOP' && !isBusy && (
        <div className="fixed inset-0 z-[75] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="w-full max-w-4xl rounded-3xl bg-stone-950 border-2 border-amber-400 p-5 sm:p-6 shadow-2xl flex flex-col gap-5 my-auto">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 pb-3">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
                  ¡Cuota {roomState.round} Completada con Éxito!
                </span>
                <h2 className="text-2xl sm:text-3xl font-fortunarium text-amber-300 tracking-wide mt-0.5">
                  RECOMPENSA DE CUOTA: ELEGID 1 MEJORA DE BUILD
                </h2>
              </div>

              <div className="flex items-center gap-3 font-mono text-sm font-black">
                <span className="px-3 py-1.5 rounded-xl bg-stone-900 border border-amber-500/40 text-amber-300 tabular-nums">
                  Caja: {roomState.money} CR
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-stone-900 border border-amber-500/40 text-amber-200 tabular-nums">
                  Llaves: {roomState.keys} 🔑
                </span>
              </div>
            </div>

            {roomState.offeredUpgradeIds.length > 0 ? (
              <div className="flex flex-col gap-3">
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-400/35 text-xs sm:text-sm text-amber-100 flex items-center justify-between gap-2">
                  <span>
                    {roomState.players.filter((p) => p.isConnected).length > 1 ? (
                      <>
                        <strong>Acuerdo Unánime Requerido:</strong> Todos los operadores conectados deben votar la <strong>misma mejora</strong> para instalarla gratis en la máquina.
                      </>
                    ) : (
                      <>
                        <strong>Mejora Gratuita de Ciclo:</strong> Elige 1 de las 3 mejoras aleatorias para especializar la máquina.
                      </>
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {roomState.offeredUpgradeIds.map((upId) => {
                    const meta = FORTUNARIUM_UPGRADES_CATALOG[upId];
                    const currentLv = roomState.upgrades[upId] || 0;
                    const myVote = roomState.upgradeVotes[localPlayerId] === upId;
                    const voters = roomState.players.filter(
                      (p) => p.isConnected && roomState.upgradeVotes[p.id] === upId
                    );

                    return (
                      <button
                        key={upId}
                        type="button"
                        onClick={() => {
                          fortunariumAudio.playButtonClick();
                          onVoteUpgrade(upId);
                        }}
                        className={`p-4 rounded-2xl border-2 text-left flex flex-col justify-between gap-3 transition-all cursor-pointer ${
                          myVote
                            ? 'bg-amber-500/20 border-yellow-300 shadow-[0_0_25px_rgba(245,158,11,0.35)] scale-[1.01]'
                            : 'bg-stone-900/90 hover:bg-stone-900 border-stone-700 hover:border-amber-400/60'
                        }`}
                      >
                        <div className="flex flex-col gap-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="w-12 h-12 rounded-2xl bg-stone-950 border border-amber-500/35 p-1.5 flex items-center justify-center shrink-0">
                              <img
                                src={FORTUNARIUM_SYMBOLS[meta.iconSymbol].asset}
                                alt={meta.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/40 text-[10px] font-black uppercase text-amber-300">
                              {meta.effectSummary}
                            </span>
                          </div>

                          <div>
                            <div className="text-base font-fortunarium text-white tracking-wide">
                              {meta.name.toUpperCase()}
                            </div>
                            <div className="text-xs font-mono font-bold text-amber-300">
                              Nivel {currentLv} → {currentLv + 1} (Máx. {meta.maxLevel})
                            </div>
                          </div>

                          <p className="text-xs text-stone-200 leading-relaxed">
                            {meta.description}
                          </p>
                        </div>

                        <div className="pt-2.5 border-t border-stone-800 flex flex-col gap-2">
                          {/* Live Player Votes on this Card */}
                          <div className="flex flex-wrap items-center gap-1.5 min-h-[24px]">
                            {voters.length > 0 ? (
                              voters.map((v) => (
                                <span
                                  key={v.id}
                                  style={{ borderColor: v.color, color: v.color }}
                                  className="px-2 py-0.5 rounded-full bg-stone-950 border text-[10px] font-black flex items-center gap-1"
                                >
                                  <span
                                    style={{ backgroundColor: v.color }}
                                    className="w-2 h-2 rounded-full"
                                  />
                                  {v.name}
                                </span>
                              ))
                            ) : (
                              <span className="text-[11px] text-stone-500">Sin votos aún</span>
                            )}
                          </div>

                          <div
                            className={`w-full py-2 rounded-xl text-center text-xs font-black uppercase tracking-wider ${
                              myVote
                                ? 'bg-amber-400 text-stone-950'
                                : 'bg-stone-800 text-amber-200'
                            }`}
                          >
                            {myVote ? '✓ Votado por ti' : 'Votar esta Mejora'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                <div className="text-lg font-fortunarium text-emerald-300 tracking-wide">
                  ¡MEJORA DE CUOTA INSTALADA EN LA MÁQUINA!
                </div>
                <p className="text-xs text-stone-300">
                  Podéis abrir el Taller para gastar créditos/llaves extra o iniciar ya la Cuota{' '}
                  {roomState.round + 1}.
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => {
                  fortunariumAudio.playButtonClick();
                  setShowWorkshopModal(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-amber-500/40 text-amber-200 text-xs font-black flex items-center gap-2 cursor-pointer"
              >
                <Wrench className="w-4 h-4 text-amber-400" />
                <span>Abrir Taller Completo ({roomState.money} CR)</span>
              </button>

              <button
                type="button"
                disabled={roomState.offeredUpgradeIds.length > 0}
                onClick={() => {
                  fortunariumAudio.playButtonClick();
                  onNextRound();
                }}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 disabled:from-stone-800 disabled:to-stone-800 disabled:text-stone-500 text-stone-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-xl cursor-pointer disabled:cursor-not-allowed"
              >
                {roomState.offeredUpgradeIds.length > 0
                  ? 'Elegid primero la mejora de cuota'
                  : `Iniciar Cuota ${roomState.round + 1} →`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. VICTORY / DEFEAT END-OF-MATCH MODAL                                */}
      {/* ===================================================================== */}
      {(roomState.phase === 'VICTORY' || roomState.phase === 'DEFEAT') && !isBusy && (
        <div className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-stone-950 border-2 border-amber-400 p-6 shadow-2xl flex flex-col gap-5 my-auto">
            <div className="text-center flex flex-col items-center gap-2">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 ${
                  roomState.phase === 'VICTORY'
                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                    : 'bg-rose-500/20 border-rose-400 text-rose-300'
                }`}
              >
                {roomState.phase === 'VICTORY' ? (
                  <Crown className="w-9 h-9" />
                ) : (
                  <AlertTriangle className="w-9 h-9" />
                )}
              </div>

              <h2
                className={`text-3xl sm:text-4xl font-fortunarium tracking-wider ${
                  roomState.phase === 'VICTORY' ? 'text-emerald-300' : 'text-rose-400'
                }`}
              >
                {roomState.phase === 'VICTORY'
                  ? '¡FORTUNARIUM CONQUISTADO!'
                  : '¡MÁQUINA FUERA DE SERVICIO!'}
              </h2>
              <p className="text-xs sm:text-sm text-stone-300 max-w-lg">
                {roomState.endReason}
              </p>
            </div>

            {/* Player Contribution Ranking */}
            <div className="flex flex-col gap-2">
              <div className="text-xs font-black uppercase tracking-wider text-amber-300">
                Rendimiento de los Operadores
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {roomState.players.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: p.color }}
                      />
                      <span className="text-sm font-bold text-white truncate">{p.name}</span>
                    </div>
                    <div className="text-right font-mono text-xs tabular-nums">
                      <div className="text-emerald-400 font-black">
                        +{p.stats.totalMoneyGenerated} CR gen.
                      </div>
                      <div className="text-stone-400">
                        {p.stats.spinsTriggered} tiradas · Neto{' '}
                        {p.stats.netBalance >= 0
                          ? `+${p.stats.netBalance}`
                          : p.stats.netBalance}{' '}
                        CR
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => {
                  fortunariumAudio.playButtonClick();
                  onReturnToLobby();
                }}
                className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-200 text-xs font-bold cursor-pointer"
              >
                Volver a la Sala
              </button>
              <button
                type="button"
                onClick={() => {
                  fortunariumAudio.playButtonClick();
                  onRestartMatch();
                }}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Jugar Otra Partida</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 6. WORKSHOP MODAL (`showWorkshopModal`)                               */}
      {/* ===================================================================== */}
      {showWorkshopModal && (
        <div
          className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
          onClick={() => setShowWorkshopModal(false)}
        >
          <div
            className="w-full max-w-4xl rounded-3xl bg-stone-950 border-2 border-amber-500/50 p-4 sm:p-6 shadow-2xl flex flex-col gap-4 my-auto max-h-[90dvh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-stone-800 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-amber-400">
                  Mantenimiento e Ingeniería de Build
                </span>
                <h2 className="text-2xl sm:text-3xl font-fortunarium text-amber-300 tracking-wide">
                  TALLER DEL FORTUNARIUM
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-stone-900 border border-amber-500/30 font-mono text-xs font-black text-amber-300 tabular-nums">
                  {displayedMoney} CR
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-stone-900 border border-amber-500/30 font-mono text-xs font-black text-amber-200 tabular-nums">
                  {displayedKeys} 🔑
                </span>
                <button
                  type="button"
                  onClick={() => setShowWorkshopModal(false)}
                  className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Repair Banner */}
            <div className="p-3.5 rounded-2xl bg-stone-900/90 border border-emerald-500/35 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-sm font-black text-white">
                    Integridad del Chasis: {displayedIntegrity}% / {roomState.maxIntegrity}%
                  </div>
                  <div className="text-xs text-stone-300">
                    Restaura +{25 + (roomState.upgrades.mecanico_jefe || 0) * 10}% de Integridad usando créditos o 1 Llave.
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={displayedIntegrity >= roomState.maxIntegrity || displayedMoney < repairCost}
                  onClick={() => {
                    fortunariumAudio.playButtonClick();
                    onRepairMachine(false);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-stone-950 font-mono font-black text-xs cursor-pointer disabled:cursor-not-allowed"
                >
                  Reparar ({repairCost} CR)
                </button>
                <button
                  type="button"
                  disabled={displayedIntegrity >= roomState.maxIntegrity || displayedKeys < 1}
                  onClick={() => {
                    fortunariumAudio.playButtonClick();
                    onRepairMachine(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 font-mono font-black text-xs cursor-pointer disabled:cursor-not-allowed"
                >
                  Usar 1 🔑
                </button>
              </div>
            </div>

            {/* Upgrades Grid */}
            <div className="overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ALL_UPGRADE_IDS.map((upId) => {
                const meta = FORTUNARIUM_UPGRADES_CATALOG[upId];
                const lv = roomState.upgrades[upId] || 0;
                const isMax = lv >= meta.maxLevel;
                const costMoney = getUpgradeCostMoney(upId, lv);

                return (
                  <div
                    key={upId}
                    className="p-3.5 rounded-2xl bg-stone-900/90 border border-stone-800 flex flex-col justify-between gap-3"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-11 h-11 rounded-xl bg-stone-950 border border-amber-500/30 p-1.5 flex items-center justify-center shrink-0">
                          <img
                            src={FORTUNARIUM_SYMBOLS[meta.iconSymbol].asset}
                            alt={meta.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <span className="px-2 py-0.5 rounded bg-amber-500/15 text-[10px] font-mono font-black text-amber-300">
                          Nv. {lv}/{meta.maxLevel}
                        </span>
                      </div>

                      <div>
                        <div className="text-sm font-black text-white">{meta.name}</div>
                        <span className="text-[10px] font-bold uppercase text-amber-400">
                          {meta.effectSummary}
                        </span>
                        <p className="text-xs text-stone-300 mt-1 leading-snug">
                          {meta.description}
                        </p>
                      </div>
                    </div>

                    {isMax ? (
                      <div className="py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-center text-xs font-black text-emerald-300">
                        NIVEL MÁXIMO
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          disabled={displayedMoney < costMoney}
                          onClick={() => {
                            fortunariumAudio.playButtonClick();
                            onBuyUpgrade(upId, false);
                          }}
                          className="py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 font-mono font-black text-xs cursor-pointer disabled:cursor-not-allowed"
                        >
                          {costMoney} CR
                        </button>
                        <button
                          type="button"
                          disabled={displayedKeys < meta.keyCost}
                          onClick={() => {
                            fortunariumAudio.playButtonClick();
                            onBuyUpgrade(upId, true);
                          }}
                          className="py-2 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-40 border border-amber-400/40 text-amber-200 font-mono font-black text-xs cursor-pointer disabled:cursor-not-allowed"
                        >
                          {meta.keyCost} 🔑
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 7. TEAM & CURSOR COLOR DRAWER (`showTeamDrawer`)                      */}
      {/* ===================================================================== */}
      {showTeamDrawer && (
        <div
          className="fixed inset-0 z-[75] bg-black/65 backdrop-blur-sm flex justify-end"
          onClick={() => setShowTeamDrawer(false)}
        >
          <div
            className="w-full max-w-md h-full bg-stone-950 border-l border-amber-500/40 p-5 flex flex-col justify-between gap-4 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                    Estadísticas Individuales en Vivo
                  </span>
                  <h3 className="text-2xl font-fortunarium text-amber-300 tracking-wide">
                    EQUIPO DE OPERADORES
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTeamDrawer(false)}
                  className="p-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cursor Color Selector */}
              <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col gap-2">
                <span className="text-xs font-bold text-stone-200 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-amber-400" />
                  Color de tu Cursor en Tiempo Real
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {FORTUNARIUM_CURSOR_COLORS.map((c) => {
                    const selected =
                      (localPlayer?.color || '').toLowerCase() === c.hex.toLowerCase();
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => onSetCursorColor(c.hex)}
                        style={{ backgroundColor: c.hex }}
                        className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer ${
                          selected ? 'ring-2 ring-white scale-110' : 'opacity-75 hover:opacity-100'
                        }`}
                      >
                        {selected && <Check className="w-3.5 h-3.5 text-stone-950 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Players List */}
              <div className="flex flex-col gap-2.5">
                {displayedPlayers.map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-2xl bg-stone-900/90 border border-stone-800 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: p.color }}
                        />
                        <span className="font-bold text-sm text-white">{p.name}</span>
                        {p.id === localPlayerId && (
                          <span className="text-[10px] font-bold text-amber-300">(Tú)</span>
                        )}
                      </div>
                      <span className="font-mono text-xs font-black text-amber-300 tabular-nums">
                        {p.stats.spinsTriggered} tiradas
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-stone-800/80 font-mono text-xs tabular-nums">
                      <div>
                        <span className="text-[10px] text-stone-400 block">Generado</span>
                        <span className="font-black text-emerald-400">
                          +{p.stats.totalMoneyGenerated} CR
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 block">Gastado/Perd.</span>
                        <span className="font-black text-rose-400">
                          -{p.stats.totalMoneyLost} CR
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-stone-400 block">Balance Neto</span>
                        <span
                          className={`font-black ${
                            p.stats.netBalance >= 0 ? 'text-amber-300' : 'text-rose-400'
                          }`}
                        >
                          {p.stats.netBalance >= 0
                            ? `+${p.stats.netBalance}`
                            : p.stats.netBalance}{' '}
                          CR
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 8. EXIT CONFIRMATION MODAL (`showExitConfirmModal`)                   */}
      {/* ===================================================================== */}
      {showExitConfirmModal && (
        <div
          className="fixed inset-0 z-[85] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowExitConfirmModal(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-stone-950 border-2 border-amber-500/50 p-6 shadow-2xl flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-fortunarium text-amber-300 tracking-wide">
              ¿SALIR DE LA PARTIDA?
            </h3>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              Puedes volver a la sala de configuración con tu grupo o abandonar la sala para regresar al menú principal de FAM2PLAY.
            </p>

            <div className="flex flex-col gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  fortunariumAudio.playButtonClick();
                  setShowExitConfirmModal(false);
                  onReturnToLobby();
                }}
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Volver al Lobby de la Sala</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  fortunariumAudio.playButtonClick();
                  setShowExitConfirmModal(false);
                  onLeaveRoom();
                }}
                className="w-full py-3 px-4 rounded-xl bg-rose-950 hover:bg-rose-900 border border-rose-500/50 text-rose-200 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Abandonar Sala y Salir al Menú</span>
              </button>

              <button
                type="button"
                onClick={() => setShowExitConfirmModal(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 font-bold text-xs cursor-pointer"
              >
                Cancelar y Seguir Jugando
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 9. DEV-ONLY PROBABILITY & MONTE CARLO SIMULATOR (`import.meta.env.DEV`)*/}
      {/* ===================================================================== */}
      {import.meta.env.DEV && showDevModal && (
        <div
          className="fixed inset-0 z-[90] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowDevModal(false)}
        >
          <div
            className="w-full max-w-3xl rounded-3xl bg-stone-950 border-2 border-fuchsia-500/60 p-5 sm:p-6 shadow-2xl flex flex-col gap-4 my-auto max-h-[90dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-fuchsia-400">
                  DEV-ONLY VERIFICATION SUITE
                </span>
                <h3 className="text-xl font-black text-white">
                  Simulador de Probabilidades y Economía (Fortunarium)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDevModal(false)}
                className="p-2 rounded-xl bg-stone-900 text-stone-300 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setSimReport(
                    runFortunariumSimulation(10000, roomState.betMode, roomState.upgrades)
                  )
                }
                className="px-3.5 py-2 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-mono text-xs font-black cursor-pointer"
              >
                Simular 10.000 Tiradas
              </button>
              <button
                type="button"
                onClick={() =>
                  setSimReport(
                    runFortunariumSimulation(100000, roomState.betMode, roomState.upgrades)
                  )
                }
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-mono text-xs font-black cursor-pointer"
              >
                Simular 100.000 Tiradas
              </button>

              <div className="ml-auto flex items-center gap-1.5">
                {(
                  [
                    { id: 'single_pattern', label: 'Test 1 Patrón' },
                    { id: 'multi_pattern', label: 'Test Multi-Patrón' },
                    { id: 'special_symbol', label: 'Test Especiales' },
                    { id: 'jackpot', label: 'Test Jackpot' },
                  ] as const
                ).map((sc) => (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => {
                      setShowDevModal(false);
                      handleTriggerSpin(sc.id);
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-[11px] font-mono font-bold text-amber-300 cursor-pointer"
                  >
                    {sc.label}
                  </button>
                ))}
              </div>
            </div>

            {simReport && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
                <div className="p-3 rounded-xl bg-stone-900 border border-stone-800">
                  <div className="text-[10px] text-stone-400">RTP Retorno</div>
                  <div className="text-base font-black text-emerald-400">
                    {simReport.rtpPercentage}%
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-stone-900 border border-stone-800">
                  <div className="text-[10px] text-stone-400">Premio Bruto / Giro</div>
                  <div className="text-base font-black text-amber-300">
                    {simReport.averageGrossPayout} CR
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-stone-900 border border-stone-800">
                  <div className="text-[10px] text-stone-400">Giros Est. Cuota 1</div>
                  <div className="text-base font-black text-sky-300">
                    {simReport.estimatedSpinsToQuota1} giros
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-stone-900 border border-stone-800">
                  <div className="text-[10px] text-stone-400">Especiales / Giro</div>
                  <div className="text-base font-black text-fuchsia-300">
                    {simReport.averageSpecialsPerSpin} (1 esp: {simReport.spinsWith1SpecialPct}%)
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SHARED MODALS: RULEBOOK, PRIZE TABLE, AUDIO */}
      <FortunariumRulebookModal
        isOpen={showRulebookModal}
        onClose={() => setShowRulebookModal(false)}
      />
      <FortunariumPrizeTableModal
        isOpen={showPrizeTableModal}
        onClose={() => setShowPrizeTableModal(false)}
        currentVoltage={displayedVoltage}
      />
      <FortunariumAudioModal
        isOpen={showAudioModal}
        onClose={() => setShowAudioModal(false)}
      />
    </div>
  );
};
