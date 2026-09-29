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
  FortunariumDevScenario,
  FortunariumModifierId,
  FortunariumSpecialEffectLog,
  FortunariumWildSubstitution,
  FortunariumPatternType,
} from '../../types/fortunarium';
import {
  FORTUNARIUM_SYMBOLS,
  FORTUNARIUM_UPGRADES_CATALOG,
  FORTUNARIUM_BET_MODES,
  FORTUNARIUM_CURSOR_COLORS,
  ALL_UPGRADE_IDS,
  ALL_MODIFIER_IDS,
  FORTUNARIUM_MODIFIERS_CATALOG,
  X_MASK_CELLS,
  TRIANGLE_MASK_CELLS,
  INVERTED_TRIANGLE_MASK_CELLS,
  getUpgradeCostMoney,
  calculateEffectiveSpinCost,
  calculateMinimumSpinCost,
  computeEffectiveJackpotChance,
} from '../../data/fortunarium/fortunariumAssets';
import {
  runFortunariumSimulation,
  FortunariumSimulationReport,
  validateWorkshopPurchase,
  runCanonicalPatternUnitTests,
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
import { FortunariumGarageIntro } from './FortunariumGarageIntro';
import { FortunariumPaperBoard } from './FortunariumPaperBoard';
import { FortunariumSpecialSpotlight } from './FortunariumSpecialSpotlight';
import { FortunariumEndRunModal } from './FortunariumEndRunModal';

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
    forceScenario?: FortunariumDevScenario,
    triggerSource?: 'button' | 'lever'
  ) => void;
  onDevGrantModifier?: (modifierId: FortunariumModifierId) => void;
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
  patternType?: FortunariumPatternType;
  symbolId?: FortunariumSymbolId | 'synergy';
  wildSubstitutions?: FortunariumWildSubstitution[];
  specialEffect?: FortunariumSpecialEffectLog;
}

// Longer, smoother staggered stop times for the 5 reels (1.45s to 3.05s, 400ms cadence)
const REEL_STOP_DELAYS_MS = [1450, 1850, 2250, 2650, 3050];
const STRIP_SPIN_ITEMS = 45; // 42 filler/start symbols + 3 final symbols = 45 symbols (15 full 3-row windows scrolling smoothly)
const LEVER_ACTIVATION_THRESHOLD = 0.68;

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
  // At progress=0 (top of spin), the bottom 3 items (`startCol`) are visible.
  // We animate from translateY(-90%) down to translateY(0%), so the TOP 3 items (`finalCol`) land in the window!
  const filler: FortunariumSymbolId[] = [];
  for (let i = 0; i < STRIP_SPIN_ITEMS - 3; i++) {
    const idx = (seed * 7 + colIndex * 5 + i * 3) % VISUAL_FILLER_POOL.length;
    filler.push(VISUAL_FILLER_POOL[idx]);
  }
  return [...finalCol, ...filler, ...startCol];
}

function classifyWinTier(spin: FortunariumSpinResult): FortunariumWinTier {
  if (spin.isJackpot || spin.grossPayout >= 160) return 'JACKPOT';
  if (spin.grossPayout >= 90) return 'HUGE';
  if (spin.grossPayout >= 45) return 'BIG';
  if (spin.grossPayout >= 20) return 'MEDIUM';
  if (spin.grossPayout > 0) return 'SMALL';
  if (spin.penalties > 0 || spin.integrityDelta <= -6) return 'LOSS';
  return 'NONE';
}

function buildJackpotParadeSteps(spin: FortunariumSpinResult): RevealStep[] {
  const symId = spin.grid[0]?.[0] || 'siete';
  const symName = FORTUNARIUM_SYMBOLS[symId]?.name.toUpperCase() || symId.toUpperCase();
  const rawSteps: Omit<RevealStep, 'amount'>[] = [
    // 1. Horizontal lines 1–3
    ...[0, 1, 2].map((row) => ({
      id: `jp_h_${row}_${spin.spinId}`,
      title: `HORIZONTAL FILA ${row + 1} (${symName})`,
      subtitle: 'DESFILE JACKPOT · LÍNEA HORIZONTAL ×5',
      integrityDelta: 0,
      cells: [0, 1, 2, 3, 4].map((col) => ({ col, row })),
      variant: 'jackpot' as const,
      patternType: 'HORIZONTAL' as const,
      symbolId: symId,
    })),
    // 2. Vertical lines 1–5
    ...[0, 1, 2, 3, 4].map((col) => ({
      id: `jp_v_${col}_${spin.spinId}`,
      title: `VERTICAL COLUMNA ${col + 1} (${symName})`,
      subtitle: 'DESFILE JACKPOT · LÍNEA VERTICAL ×3',
      integrityDelta: 0,
      cells: [0, 1, 2].map((row) => ({ col, row })),
      variant: 'jackpot' as const,
      patternType: 'VERTICAL' as const,
      symbolId: symId,
    })),
    // 3. Diagonal lines (↘ and ↙)
    {
      id: `jp_diag_dr_${spin.spinId}`,
      title: `DIAGONAL ↘ (${symName})`,
      subtitle: 'DESFILE JACKPOT · DIAGONAL PRINCIPAL',
      integrityDelta: 0,
      cells: [
        { col: 1, row: 0 },
        { col: 2, row: 1 },
        { col: 3, row: 2 },
      ],
      variant: 'jackpot' as const,
      patternType: 'DIAGONAL' as const,
      symbolId: symId,
    },
    {
      id: `jp_diag_dl_${spin.spinId}`,
      title: `DIAGONAL ↙ (${symName})`,
      subtitle: 'DESFILE JACKPOT · DIAGONAL INVERSA',
      integrityDelta: 0,
      cells: [
        { col: 3, row: 0 },
        { col: 2, row: 1 },
        { col: 1, row: 2 },
      ],
      variant: 'jackpot' as const,
      patternType: 'DIAGONAL' as const,
      symbolId: symId,
    },
    // 4. X pattern
    {
      id: `jp_pat_x_${spin.spinId}`,
      title: `PATRÓN X (${symName})`,
      subtitle: 'DESFILE JACKPOT · PATRÓN X (5 CASILLAS)',
      integrityDelta: 0,
      cells: X_MASK_CELLS,
      variant: 'jackpot' as const,
      patternType: 'X' as const,
      symbolId: symId,
    },
    // 5. Triangle
    {
      id: `jp_tri_${spin.spinId}`,
      title: `TRIÁNGULO ▲ (${symName})`,
      subtitle: 'DESFILE JACKPOT · TRIÁNGULO COMPLETO (8 CASILLAS)',
      integrityDelta: 0,
      cells: TRIANGLE_MASK_CELLS,
      variant: 'jackpot' as const,
      patternType: 'TRIANGULO' as const,
      symbolId: symId,
    },
    // 6. Inverted Triangle
    {
      id: `jp_tri_inv_${spin.spinId}`,
      title: `TRIÁNGULO INVERTIDO ▼ (${symName})`,
      subtitle: 'DESFILE JACKPOT · CLÍMAX SUPREMO (8 CASILLAS)',
      integrityDelta: 0,
      cells: INVERTED_TRIANGLE_MASK_CELLS,
      variant: 'jackpot' as const,
      patternType: 'TRIANGULO_INVERTIDO' as const,
      symbolId: symId,
    },
  ];

  // Progressive weights across the 13 parade steps so the climax builds naturally and sums to spin.grossPayout
  const weights = [6, 6, 6, 4, 4, 4, 4, 4, 5, 5, 12, 18, 22]; // sum = 100
  const totalPayout = Math.max(0, spin.grossPayout);
  let allocated = 0;

  return rawSteps.map((s, idx) => {
    const isLast = idx === rawSteps.length - 1;
    const stepAmount = isLast
      ? Math.max(0, totalPayout - allocated)
      : Math.round((totalPayout * weights[idx]) / 100);
    allocated += stepAmount;
    return {
      ...s,
      amount: stepAmount,
    };
  });
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
  onDevGrantModifier,
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

  // Garage Door Intro State (Section 7: Plays once at the start of each match)
  const [introSeenMatchId, setIntroSeenMatchId] = useState<string | null>(() =>
    roomState.totalSpinsInMatch > 0 ? roomState.matchId : null
  );
  const [forceReplayIntro, setForceReplayIntro] = useState(false);
  const showGarageIntro =
    forceReplayIntro ||
    (roomState.phase === 'PLAYING' &&
      roomState.totalSpinsInMatch === 0 &&
      introSeenMatchId !== roomState.matchId);

  // Upgrade Installation Physical Toast (Section 25)
  const [installedUpgradeToast, setInstalledUpgradeToast] =
    useState<FortunariumUpgradeId | null>(null);
  const lastUpgradeToastRef = useRef<string | null>(null);

  useEffect(() => {
    const upgId = roomState.lastInstalledUpgradeId;
    if (!upgId) return;
    const key = `${roomState.matchId}_${upgId}_${roomState.upgrades[upgId] || 0}`;
    if (lastUpgradeToastRef.current && lastUpgradeToastRef.current !== key) {
      setInstalledUpgradeToast(upgId);
      fortunariumAudio.playUpgradeInstall();
      const t = setTimeout(() => setInstalledUpgradeToast(null), 2600);
      lastUpgradeToastRef.current = key;
      return () => clearTimeout(t);
    }
    lastUpgradeToastRef.current = key;
  }, [roomState.lastInstalledUpgradeId, roomState.upgrades, roomState.matchId]);

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
  const [machineShake, setMachineShake] = useState(false);

  // Manual Draggable Right-Side Lever State (Sections 23–28)
  const [leverProgress, setLeverProgress] = useState<number>(0); // 0.0 (top) to 1.0 (bottom)
  const [isDraggingLever, setIsDraggingLever] = useState<boolean>(false);
  const leverTrackRef = useRef<HTMLDivElement | null>(null);
  const leverDragStartYRef = useRef<number>(0);
  const leverMaxDeltaYRef = useRef<number>(0);
  const leverRatchetTickedHalfRef = useRef<boolean>(false);
  const leverRatchetTickedReadyRef = useRef<boolean>(false);

  // Authoritative Display State (NEVER flickers between pre-spin and post-spin values)
  const [displayedMoney, setDisplayedMoney] = useState<number>(roomState.money);
  const [displayedIntegrity, setDisplayedIntegrity] = useState<number>(roomState.integrity);
  const [displayedVoltage, setDisplayedVoltage] = useState<number>(roomState.voltageMultiplier);
  const [displayedKeys, setDisplayedKeys] = useState<number>(roomState.keys);
  const [displayedPlayers, setDisplayedPlayers] = useState<FortunariumPlayer[]>(
    roomState.players
  );
  const [displayedLastSpinResult, setDisplayedLastSpinResult] =
    useState<FortunariumSpinResult | null>(roomState.lastSpinResult);

  // Sequential Post-Stop Presentation State (only runs AFTER Reel 5 stops)
  // Uses a SINGLE activePresentedPatternId (`string | null`) so pattern highlights NEVER accumulate
  const [isSpinPresentationActive, setIsSpinPresentationActive] = useState(false);
  const [isRevealingRewards, setIsRevealingRewards] = useState(false);
  const [activePresentedPatternId, setActivePresentedPatternId] = useState<string | null>(null);
  const [activeRevealStep, setActiveRevealStep] = useState<RevealStep | null>(null);
  const [activeRevealStepIndex, setActiveRevealStepIndex] = useState<number>(0);
  const [totalRevealSteps, setTotalRevealSteps] = useState<number>(0);
  const [completedRevealSteps, setCompletedRevealSteps] = useState<RevealStep[]>([]);
  const [accumulatedSpinWin, setAccumulatedSpinWin] = useState<number>(0);
  const [displayedAccumulatedWin, setDisplayedAccumulatedWin] = useState<number>(0);
  const [winCountUpPulse, setWinCountUpPulse] = useState<boolean>(false);
  const [flyingRewardAddition, setFlyingRewardAddition] = useState<{
    id: string;
    amount: number;
    isJackpot?: boolean;
  } | null>(null);
  const [finalOutcomeBanner, setFinalOutcomeBanner] = useState<{
    title: string;
    subtitle: string;
    spinCost: number;
    grossPayout: number;
    netAmount: number;
    finalMoney: number;
    tier: FortunariumWinTier;
  } | null>(null);

  // Transient Quota Celebration State (Section 2: NEVER stays permanently floating)
  const completedQuotaEventRoundRef = useRef<number>(
    roomState.money >= roomState.quota ? roomState.round : 0
  );
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
      setDisplayedIntegrity(roomState.integrity);
      setDisplayedVoltage(roomState.voltageMultiplier);
      setDisplayedKeys(roomState.keys);
      setDisplayedPlayers(roomState.players);
      setDisplayedLastSpinResult(roomState.lastSpinResult);
      setSettledGrid(roomState.grid);
      settledGridRef.current = roomState.grid;
    }
  }, [
    roomState.isSpinning,
    roomState.money,
    roomState.integrity,
    roomState.voltageMultiplier,
    roomState.keys,
    roomState.players,
    roomState.lastSpinResult,
    roomState.grid,
    isSpinPresentationActive,
  ]);

  // Reset quota celebration tracker when a new match starts at Round 1 below quota
  useEffect(() => {
    if (roomState.round === 1 && roomState.money < roomState.quota) {
      completedQuotaEventRoundRef.current = 0;
      setShowQuotaBanner(false);
    }
  }, [roomState.round, roomState.money, roomState.quota]);

  // Trigger transient Quota Reached celebration ONCE per quota index after reels & rewards settle (Section 2)
  useEffect(() => {
    if (
      roomState.phase === 'PLAYING' &&
      !roomState.isSpinning &&
      !isSpinPresentationActive &&
      displayedMoney >= roomState.quota &&
      completedQuotaEventRoundRef.current !== roomState.round
    ) {
      completedQuotaEventRoundRef.current = roomState.round;
      setShowQuotaBanner(true);
      fortunariumAudio.playQuotaCompleted();
      const t = setTimeout(() => {
        setShowQuotaBanner(false);
      }, 3000);
      return () => clearTimeout(t);
    }
  }, [
    roomState.phase,
    roomState.isSpinning,
    isSpinPresentationActive,
    displayedMoney,
    roomState.quota,
    roomState.round,
  ]);

  // Smooth animated count-up ticker for the Large Top Win Accumulator Display
  useEffect(() => {
    if (accumulatedSpinWin === displayedAccumulatedWin) return;
    if (accumulatedSpinWin === 0) {
      setDisplayedAccumulatedWin(0);
      return;
    }
    const startVal = displayedAccumulatedWin;
    const targetVal = accumulatedSpinWin;
    const diff = targetVal - startVal;
    const totalTicks = 14;
    let currentTick = 0;
    const interval = setInterval(() => {
      currentTick += 1;
      if (currentTick >= totalTicks) {
        setDisplayedAccumulatedWin(targetVal);
        clearInterval(interval);
      } else {
        const eased = 1 - Math.pow(1 - currentTick / totalTicks, 2);
        setDisplayedAccumulatedWin(Math.round(startVal + diff * eased));
      }
    }, 28);
    return () => clearInterval(interval);
  }, [accumulatedSpinWin, displayedAccumulatedWin]);

  // Master Spin & Sequential Post-Stop Presentation Choreography (Sections 19–22, 29–32)
  useEffect(() => {
    if (!spinEvent || spinEvent.spinId === lastHandledSpinIdRef.current) return;
    lastHandledSpinIdRef.current = spinEvent.spinId;

    clearAllSpinTimers();
    setIsSpinPresentationActive(true);
    setIsRevealingRewards(false);
    setActivePresentedPatternId(null);
    setActiveRevealStep(null);
    setCompletedRevealSteps([]);
    setAccumulatedSpinWin(0);
    setDisplayedAccumulatedWin(0);
    setWinCountUpPulse(false);
    setFlyingRewardAddition(null);
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

    // STAGE 1: Deduct ONLY spinCost immediately; keep integrity & voltage at pre-spin values
    setDisplayedMoney(spinEvent.moneyAfterSpinCost);
    setDisplayedVoltage(spinEvent.voltageMultiplierUsed);

    // Animate lever down & start all 5 vertical reels spinning downward rapidly
    setLeverProgress(1);
    setReelsSpinning([true, true, true, true, true]);
    setReelsLandedBounce([false, false, false, false, false]);
    if (spinEvent.triggerSource === 'lever') {
      fortunariumAudio.playLeverRelease();
    } else {
      fortunariumAudio.playHeroSpinPress();
    }
    fortunariumAudio.startReelSpinLoop();

    const leverSpringTimer = setTimeout(() => {
      setLeverProgress(0);
    }, 380);
    timersRef.current.push(leverSpringTimer);

    // STAGE 2: Stop each reel sequentially from left (Reel 1: 750ms) to right (Reel 5: 1550ms)
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
        }, 240);
        timersRef.current.push(clearBounceTimer);
      }, delay);
      timersRef.current.push(stopTimer);
    });

    // STAGE 3: ONLY AFTER REEL 5 STOPS (1610ms), begin sequential pattern-by-pattern presentation
    const postStopDelay = REEL_STOP_DELAYS_MS[4] + 60;
    const postStopTimer = setTimeout(() => {
      fortunariumAudio.stopReelSpinLoop();
      fortunariumAudio.playMechanicalSettle();
      settledGridRef.current = spinEvent.grid;
      setSettledGrid(spinEvent.grid);
      setIsRevealingRewards(true);

      const steps: RevealStep[] = [];
      if (spinEvent.isJackpot) {
        // PROGRESSIVE JACKPOT BUILD-UP PARADE (Sections 15–19):
        // Step through Horizontal 1–3, Vertical 1–5, Diagonal 1–2, X, Triangle, and Inverted Triangle
        steps.push(...buildJackpotParadeSteps(spinEvent));
      } else {
        for (const line of spinEvent.winLines) {
          steps.push({
            id: line.id,
            title: `${line.name.toUpperCase()} (${FORTUNARIUM_SYMBOLS[line.symbolId]?.name.toUpperCase() || line.symbolId.toUpperCase()})`,
            subtitle: `Patrón ${line.patternType} ×${line.patternMultiplier}`,
            amount: line.payout,
            integrityDelta: 0,
            cells: line.cells,
            variant:
              line.patternCategory === 'SHAPE' ||
              (line.count === 5 && (line.symbolId === 'siete' || line.symbolId === 'corona'))
                ? 'jackpot'
                : 'win',
            patternType: line.patternType,
            symbolId: line.symbolId,
            wildSubstitutions: line.wildSubstitutions,
          });
        }
      }

      for (const fx of spinEvent.specialEffects) {
        // Skip duplicate jackpot specialEffect card when running the 13-step Jackpot Parade
        if (spinEvent.isJackpot && fx.variant === 'jackpot') continue;
        steps.push({
          id: fx.id,
          title: fx.title.toUpperCase(),
          subtitle: fx.description,
          amount: fx.moneyDelta,
          integrityDelta: fx.integrityDelta,
          cells: fx.cells,
          variant:
            fx.variant === 'jackpot'
              ? 'jackpot'
              : fx.variant === 'negative'
              ? 'hazard'
              : 'special',
          symbolId: fx.symbolId,
          specialEffect: fx,
        });
      }

      setTotalRevealSteps(steps.length);
      const tier = classifyWinTier(spinEvent);

      if (steps.length === 0) {
        setActivePresentedPatternId(null);
        setActiveRevealStep(null);
        setDisplayedMoney(spinEvent.finalMoney);
        setDisplayedIntegrity(spinEvent.finalIntegrity);
        setDisplayedVoltage(spinEvent.voltageMultiplierAfter);
        setDisplayedKeys(spinEvent.finalKeys);
        setDisplayedLastSpinResult(spinEvent);
        setFinalOutcomeBanner({
          title: 'SIN PREMIO',
          subtitle: `TIRADA: -${spinEvent.spinCost} CR · AHORA: ${spinEvent.finalMoney} CR`,
          spinCost: spinEvent.spinCost,
          grossPayout: 0,
          netAmount: -spinEvent.spinCost,
          finalMoney: spinEvent.finalMoney,
          tier: 'NONE',
        });

        const endEmptyTimer = setTimeout(() => {
          setIsRevealingRewards(false);
          setIsSpinPresentationActive(false);
        }, 1050);
        timersRef.current.push(endEmptyTimer);
        return;
      }

      // Hold each pattern for ~1.02s (820ms per step during 13-step Jackpot parade)
      // with a clean gap between steps where activePresentedPatternId resets to null
      const stepHoldMs = spinEvent.isJackpot ? 740 : 1020;
      const stepGapMs = spinEvent.isJackpot ? 90 : 130;
      const stepCadenceMs = stepHoldMs + stepGapMs;
      let runningAccumulatedWin = 0;

      steps.forEach((step, idx) => {
        const startDelay = idx * stepCadenceMs;

        const stepStartTimer = setTimeout(() => {
          // Activate ONLY this single pattern ID
          setActivePresentedPatternId(step.id);
          setActiveRevealStep(step);
          setActiveRevealStepIndex(idx + 1);
          setCompletedRevealSteps((prev) => [...prev, step]);

          if (step.specialEffect) {
            const sym = step.specialEffect.symbolId;
            if (sym === 'bomba') {
              setMachineShake(true);
              fortunariumAudio.playBombExplosion();
              setTimeout(() => setMachineShake(false), 450);
            } else if (sym === 'calavera') {
              setMachineShake(true);
              fortunariumAudio.playSkullPenalty();
              setTimeout(() => setMachineShake(false), 380);
            } else if (sym === 'rayo') {
              fortunariumAudio.playLightningCharge();
            } else if (sym === 'llave' || sym === 'synergy') {
              fortunariumAudio.playKeyRepairChime();
            } else if (sym === 'moneda') {
              fortunariumAudio.playCoinClink();
            } else if (sym === 'interrogacion') {
              fortunariumAudio.playMysteryJingle();
            } else {
              fortunariumAudio.playSpecialSymbolCue('positive');
            }
          } else if (spinEvent.isJackpot) {
            // Progressive audio build-up across the 13 Jackpot parade steps
            fortunariumAudio.playPatternChime(idx);
            if (idx >= 10) {
              setMachineShake(true);
              fortunariumAudio.playSpecialSymbolCue('jackpot');
              setTimeout(() => setMachineShake(false), 420);
            }
          } else if (step.variant === 'jackpot') {
            setMachineShake(true);
            fortunariumAudio.playSpecialSymbolCue('jackpot');
            setTimeout(() => setMachineShake(false), 580);
          } else {
            if (step.wildSubstitutions && step.wildSubstitutions.length > 0) {
              fortunariumAudio.playWildTransform();
            }
            fortunariumAudio.playPatternChime(idx);
          }

          if (step.amount !== 0) {
            // Visual +XX CR addition flying upward into the top counter
            setFlyingRewardAddition({
              id: `${step.id}_fly`,
              amount: step.amount,
              isJackpot: spinEvent.isJackpot || step.variant === 'jackpot',
            });
            runningAccumulatedWin = Math.max(0, runningAccumulatedWin + step.amount);
            setAccumulatedSpinWin(runningAccumulatedWin);
            setWinCountUpPulse(true);
            setTimeout(() => setWinCountUpPulse(false), 360);
            fortunariumAudio.playCoinCountTick(idx);
          }
        }, startDelay);
        timersRef.current.push(stepStartTimer);

        // Explicitly clear activePresentedPatternId before the next pattern starts so highlights NEVER accumulate
        const stepClearTimer = setTimeout(() => {
          setActivePresentedPatternId(null);
          setActiveRevealStep(null);
          setFlyingRewardAddition(null);
        }, startDelay + stepHoldMs);
        timersRef.current.push(stepClearTimer);
      });

      const summaryDelay = steps.length * stepCadenceMs + 90;
      const summaryTimer = setTimeout(() => {
        // ZERO illuminated cells when all patterns finish
        setActivePresentedPatternId(null);
        setActiveRevealStep(null);
        setFlyingRewardAddition(null);
        setAccumulatedSpinWin(Math.max(0, spinEvent.grossPayout - spinEvent.penalties));
        // Transfer final accumulated total into the machine's authoritative money display
        setDisplayedMoney(spinEvent.finalMoney);
        setDisplayedIntegrity(spinEvent.finalIntegrity);
        setDisplayedVoltage(spinEvent.voltageMultiplierAfter);
        setDisplayedKeys(spinEvent.finalKeys);
        setDisplayedLastSpinResult(spinEvent);

        fortunariumAudio.playWinTierSting(tier);

        const netDelta = spinEvent.netMoneyDelta;
        const bannerTitle = spinEvent.isJackpot
          ? `¡JACKPOT SUPREMO! TOTAL GANADO: +${spinEvent.grossPayout} CR`
          : spinEvent.grossPayout > 0
          ? `TOTAL GANADO: +${spinEvent.grossPayout} CR`
          : `AVERÍA EN LOS RODILLOS (${netDelta} CR)`;

        setFinalOutcomeBanner({
          title: bannerTitle,
          subtitle: `TIRADA: -${spinEvent.spinCost} CR · PREMIO: +${spinEvent.grossPayout} CR${
            spinEvent.penalties > 0 ? ` · PENALIZACIÓN: -${spinEvent.penalties} CR` : ''
          } · CAJA COMÚN: ${spinEvent.finalMoney} CR`,
          spinCost: spinEvent.spinCost,
          grossPayout: spinEvent.grossPayout,
          netAmount: netDelta,
          finalMoney: spinEvent.finalMoney,
          tier,
        });

        const finishTimer = setTimeout(() => {
          setIsRevealingRewards(false);
          setIsSpinPresentationActive(false);
        }, 1450);
        timersRef.current.push(finishTimer);
      }, summaryDelay);
      timersRef.current.push(summaryTimer);
    }, postStopDelay);
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

  const minimumSpinCost = useMemo(
    () => calculateMinimumSpinCost(roomState.upgrades),
    [roomState.upgrades]
  );

  const effectiveJackpotChance = useMemo(
    () => computeEffectiveJackpotChance(roomState.activeModifiers || []),
    [roomState.activeModifiers]
  );

  const canSpin =
    roomState.phase === 'PLAYING' &&
    !isBusy &&
    roomState.money >= currentSpinCost &&
    isMyTurn;

  const quotaMet = displayedMoney >= roomState.quota;
  const quotaPct = Math.min(
    100,
    Math.round((displayedMoney / Math.max(1, roomState.quota)) * 100)
  );
  const integrityPct = Math.max(
    0,
    Math.min(100, Math.round((displayedIntegrity / roomState.maxIntegrity) * 100))
  );
  const repairCost = 28 + (roomState.round - 1) * 8;
  const repairValidation = useMemo(
    () =>
      validateWorkshopPurchase({
        currentMoney: displayedMoney,
        cost: repairCost,
        quotaTarget: roomState.quota,
        upgrades: roomState.upgrades,
        activeModifiers: roomState.activeModifiers,
      }),
    [displayedMoney, repairCost, roomState.quota, roomState.upgrades, roomState.activeModifiers]
  );

  const unitTestSuite = useMemo(() => runCanonicalPatternUnitTests(), []);

  const quotaTargetLabel =
    roomState.totalRounds === null
      ? `CUOTA ${roomState.round} · ∞`
      : `CUOTA ${roomState.round}/${roomState.totalRounds}`;

  // STRICT CANONICAL SINGLE-PATTERN HIGHLIGHTING (Sections 3–5):
  // A cell is visually highlighted ONLY when `activePresentedPatternId !== null`
  // AND `activeRevealStep?.id === activePresentedPatternId` AND its coordinates
  // belong to that single active pattern. Never accumulate highlights.
  const highlightedWinCells = useMemo(() => {
    const map = new Set<string>();
    if (
      isAnyReelSpinning ||
      activePresentedPatternId === null ||
      !activeRevealStep ||
      activeRevealStep.id !== activePresentedPatternId
    ) {
      return map;
    }
    if (Boolean(activeRevealStep.patternType) && activeRevealStep.variant !== 'hazard') {
      for (const c of activeRevealStep.cells) {
        map.add(`${c.col},${c.row}`);
      }
    }
    return map;
  }, [isAnyReelSpinning, activePresentedPatternId, activeRevealStep]);

  const highlightedSpecialCells = useMemo(() => {
    const map = new Set<string>();
    if (
      isAnyReelSpinning ||
      activePresentedPatternId === null ||
      !activeRevealStep ||
      activeRevealStep.id !== activePresentedPatternId
    ) {
      return map;
    }
    if (!activeRevealStep.patternType && activeRevealStep.variant !== 'hazard') {
      for (const c of activeRevealStep.cells) {
        map.add(`${c.col},${c.row}`);
      }
    }
    return map;
  }, [isAnyReelSpinning, activePresentedPatternId, activeRevealStep]);

  const highlightedHazardCells = useMemo(() => {
    const map = new Set<string>();
    if (
      isAnyReelSpinning ||
      activePresentedPatternId === null ||
      !activeRevealStep ||
      activeRevealStep.id !== activePresentedPatternId
    ) {
      return map;
    }
    if (activeRevealStep.variant === 'hazard') {
      for (const c of activeRevealStep.cells) {
        map.add(`${c.col},${c.row}`);
      }
    }
    return map;
  }, [isAnyReelSpinning, activePresentedPatternId, activeRevealStep]);

  // Installed upgrades list for compact cabinet badge bar
  const installedUpgrades = useMemo(() => {
    return ALL_UPGRADE_IDS.filter((id) => (roomState.upgrades[id] || 0) > 0).map(
      (id) => ({
        meta: FORTUNARIUM_UPGRADES_CATALOG[id],
        level: roomState.upgrades[id],
      })
    );
  }, [roomState.upgrades]);

  const installedUpgradeTuples = useMemo<[FortunariumUpgradeId, number][]>(() => {
    return ALL_UPGRADE_IDS.filter((id) => (roomState.upgrades[id] || 0) > 0).map(
      (id) => [id, roomState.upgrades[id]]
    );
  }, [roomState.upgrades]);

  // Active Wild Substitutions during pattern reveal (Section 18)
  const activeWildSubstitutionMap = useMemo(() => {
    const map = new Map<string, FortunariumSymbolId>();
    if (isAnyReelSpinning) return map;
    if (activeRevealStep?.wildSubstitutions) {
      for (const sub of activeRevealStep.wildSubstitutions) {
        map.set(`${sub.col},${sub.row}`, sub.substitutedFor);
      }
    }
    return map;
  }, [isAnyReelSpinning, activeRevealStep]);

  // Handlers
  const handleTriggerSpin = useCallback(
    (
      forceScenario?: FortunariumDevScenario,
      triggerSource: 'button' | 'lever' = 'button'
    ) => {
      if (roomState.phase !== 'PLAYING' || isBusy || !isMyTurn) return;
      if (!forceScenario && roomState.money < currentSpinCost) return;
      onSpinSlot(forceScenario, triggerSource);
    },
    [roomState.phase, isBusy, isMyTurn, roomState.money, currentSpinCost, onSpinSlot]
  );

  // ==========================================================================
  // PHYSICAL DRAGGABLE LEVER INTERACTION (SECTIONS 23–28)
  // ==========================================================================
  const handleLeverPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canSpin) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDraggingLever(true);
    leverDragStartYRef.current = e.clientY;
    leverMaxDeltaYRef.current = 0;
    leverRatchetTickedHalfRef.current = false;
    leverRatchetTickedReadyRef.current = false;
  };

  const handleLeverPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingLever || !canSpin) return;
    const trackHeight = leverTrackRef.current?.clientHeight || 150;
    const maxTravel = Math.max(70, trackHeight - 44);
    const deltaY = Math.max(0, e.clientY - leverDragStartYRef.current);
    leverMaxDeltaYRef.current = Math.max(leverMaxDeltaYRef.current, deltaY);

    const progress = Math.max(0, Math.min(1, deltaY / maxTravel));
    setLeverProgress(progress);

    if (progress >= 0.35 && !leverRatchetTickedHalfRef.current) {
      leverRatchetTickedHalfRef.current = true;
      fortunariumAudio.playLeverDragTick(progress);
    }
    if (progress >= LEVER_ACTIVATION_THRESHOLD && !leverRatchetTickedReadyRef.current) {
      leverRatchetTickedReadyRef.current = true;
      fortunariumAudio.playLeverThresholdClick();
    }
  };

  const finishLeverInteraction = (e: React.PointerEvent<HTMLDivElement>, cancelled = false) => {
    if (!isDraggingLever) return;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {}

    const finalProgress = leverProgress;
    const maxDelta = leverMaxDeltaYRef.current;
    setIsDraggingLever(false);

    if (cancelled || !canSpin) {
      setLeverProgress(0);
      return;
    }

    // Quick click fallback (< 8px drag): animate full pull and trigger spin
    if (maxDelta < 8) {
      setLeverProgress(1);
      handleTriggerSpin(undefined, 'lever');
      return;
    }

    // Dragged past threshold (>= 68%): trigger spin!
    if (finalProgress >= LEVER_ACTIVATION_THRESHOLD) {
      setLeverProgress(1);
      handleTriggerSpin(undefined, 'lever');
      return;
    }

    // Partial pull (< 68%): spring back to top WITHOUT triggering a spin or deducting credits
    fortunariumAudio.playLeverSpringBack();
    setLeverProgress(0);
  };

  // Spacebar shortcut to spin when no modal is open
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === 'Space' &&
        !showGarageIntro &&
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
    showGarageIntro,
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
      fortunariumAudio.playBetSelectorClick(order[nextIdx]);
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

  // Total credits generated by all operators across the run
  const totalRunMoneyGenerated = useMemo(
    () => roomState.players.reduce((acc, p) => acc + p.stats.totalMoneyGenerated, 0),
    [roomState.players]
  );

  return (
    <div
      ref={stageRef}
      onPointerMove={handlePointerMove}
      className="fortunarium-root font-fortunarium fixed inset-0 w-screen h-[100dvh] bg-[#071120] text-amber-50 flex flex-col overflow-hidden select-none z-50"
    >
      {/* FULL-BLEED ILLUSTRATED CASINO BACKGROUND (No black strips anywhere) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,#163b5c_0%,#0b2038_52%,#050d1a_100%)]" />
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(251,191,36,0.12) 0px, rgba(251,191,36,0.12) 2px, transparent 2px, transparent 48px)',
          }}
        />
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[900px] h-[380px] rounded-full bg-amber-400/15 blur-[110px]" />
        <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-[#03070e] to-transparent" />
      </div>

      {/* GARAGE SHUTTER OPENING INTRO (Section 7: Plays once at start of match) */}
      {showGarageIntro && (
        <FortunariumGarageIntro
          matchId={roomState.matchId}
          onComplete={() => {
            setIntroSeenMatchId(roomState.matchId);
            setForceReplayIntro(false);
          }}
        />
      )}

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
        {/* Left Group: Exit, Title, Room Code, Quota Target */}
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
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-900/90 hover:bg-stone-800 border border-amber-500/25 text-xs font-mono font-black text-amber-300 cursor-pointer shrink-0 tabular-nums"
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
            {quotaTargetLabel}
          </div>
        </div>

        {/* Right Group: Manual, Premios, Taller, Sonido, Equipo (+ Dev Lab) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {Boolean(import.meta.env?.DEV) && (
            <button
              type="button"
              onClick={() => {
                fortunariumAudio.playButtonClick();
                setShowDevModal(true);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-fuchsia-950/90 hover:bg-fuchsia-900 border border-fuchsia-400/50 text-fuchsia-200 text-xs font-black flex items-center gap-1 cursor-pointer"
              title="Simulador de Economía y Patrones (DEV)"
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

      {/* TRANSIENT QUOTA COMPLETED CELEBRATION BANNER (Fires once for 3s, never sticks) */}
      {showQuotaBanner && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 pointer-events-none animate-bounce">
          <div className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 border-2 border-yellow-300 shadow-[0_0_40px_rgba(16,185,129,0.8)] text-center">
            <div className="text-lg sm:text-xl font-fortunarium text-yellow-200 tracking-wider">
              ¡CUOTA {roomState.round} SUPERADA!
            </div>
            <div className="text-xs font-bold text-white">
              Podéis pulsar «SELLAR CUOTA» ahora o seguir arriesgando sin perder vuestro dinero
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. CENTRAL ILLUSTRATED SLOT MACHINE CABINET STAGE + PAPER OVERLAY     */}
      {/* ===================================================================== */}
      <main className="relative z-10 flex-1 min-h-0 w-full flex items-center justify-center px-2 sm:px-6 py-2 overflow-hidden">
        {/* Centered Machine Anchor Wrapper (Visual center = 50vw; Paper note is absolute outside left) */}
        <div
          className={`relative w-full max-w-[930px] h-full max-h-[810px] mx-auto flex items-center justify-center transition-transform duration-150 ${
            machineShake ? 'translate-x-1.5 -translate-y-1 scale-[1.01]' : ''
          }`}
        >
          {/* LEFT-SIDE PHYSICAL TAPED PAPER OVERLAY (Sections 1–4: NEVER shifts machine centering) */}
          <FortunariumPaperBoard
            activeModifiers={roomState.activeModifiers || []}
            installedUpgradesCount={installedUpgrades.length}
            effectiveJackpotChance={effectiveJackpotChance}
            onOpenWorkshop={() => setShowWorkshopModal(true)}
          />

          {/* MAIN TURQUOISE / AGED-METAL & GOLD-BRASS SLOT CABINET (Idle hum + State lighting) */}
          <div
            className={`relative w-full h-full rounded-[36px] bg-gradient-to-b from-[#1f5f6b] via-[#13424d] to-[#0b2931] border-[5px] p-3 sm:p-5 flex flex-col justify-between gap-2.5 overflow-visible transition-all duration-300 ${
              roomState.phase === 'DEFEAT'
                ? 'border-stone-700 brightness-75 saturate-50'
                : finalOutcomeBanner?.tier === 'JACKPOT'
                ? 'border-yellow-300 shadow-[0_0_90px_rgba(250,204,21,0.55),inset_0_2px_16px_rgba(255,255,255,0.4)]'
                : integrityPct <= 30
                ? 'border-rose-500/80 shadow-[0_25px_70px_rgba(225,29,72,0.45),inset_0_2px_12px_rgba(255,255,255,0.2)]'
                : 'border-[#d9a441] shadow-[0_25px_70px_rgba(0,0,0,0.85),inset_0_2px_12px_rgba(255,255,255,0.25)] animate-fort-idle-hum'
            }`}
          >
            {/* Corner Brass Screws (Physical Cabinet Detail) */}
            <span className="pointer-events-none absolute top-3 left-3 w-3 h-3 rounded-full bg-gradient-to-br from-amber-200 to-amber-700 border border-amber-950 shadow" />
            <span className="pointer-events-none absolute top-3 right-3 w-3 h-3 rounded-full bg-gradient-to-br from-amber-200 to-amber-700 border border-amber-950 shadow" />
            <span className="pointer-events-none absolute bottom-3 left-3 w-3 h-3 rounded-full bg-gradient-to-br from-amber-200 to-amber-700 border border-amber-950 shadow" />
            <span className="pointer-events-none absolute bottom-3 right-3 w-3 h-3 rounded-full bg-gradient-to-br from-amber-200 to-amber-700 border border-amber-950 shadow" />
            <div className="pointer-events-none absolute inset-1.5 rounded-[30px] border border-amber-300/25" />

            {/* --------------------------------------------------------------- */}
            {/* CABINET SECTION A: ILLUMINATED MARQUEE & SPIN TRANSACTION BAR   */}
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
                            : integrityPct <= 30
                            ? 'bg-rose-400 animate-fort-spark'
                            : 'bg-amber-400 shadow-[0_0_8px_#fbbf24] animate-fort-bulb-flicker'
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
                      <span className="text-[11px] font-bold text-amber-200 tabular-nums">
                        {installedUpgrades.length} Piezas
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
                        ? '¡TU TURNO!'
                        : `Turno: ${currentTurnPlayer?.name || 'Operador'}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 2: LARGE PREMIUM WIN COUNT-UP DISPLAY & PATTERN ACCUMULATOR */}
              <div className="min-h-[60px] sm:min-h-[68px] rounded-2xl bg-gradient-to-r from-[#060b12] via-[#0b1320] to-[#060b12] border-2 border-amber-400/60 px-3.5 py-2 flex items-center justify-between gap-3 overflow-hidden shadow-[inset_0_4px_18px_rgba(0,0,0,0.95),0_0_20px_rgba(245,158,11,0.18)]">
                {isAnyReelSpinning ? (
                  <div className="w-full flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Sparkles className="w-5 h-5 text-yellow-300 animate-spin shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400/90">
                          TIRADA EN CURSO · COSTE -{spinEvent?.spinCost ?? currentSpinCost} CR
                        </div>
                        <div className="font-fortunarium text-sm sm:text-lg text-amber-200 tracking-wide truncate">
                          GIRANDO RODILLOS ({spinEvent?.playerName || localPlayer?.name})...
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-stone-400">
                        PREMIO ACUMULADO
                      </span>
                      <span className="font-mono font-black text-xl sm:text-3xl text-stone-500 tabular-nums leading-none">
                        +0 CR
                      </span>
                    </div>
                  </div>
                ) : activeRevealStep ? (
                  <div className="w-full flex items-center justify-between gap-3">
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-2 py-0.5 rounded-md bg-amber-400 text-stone-950 font-mono text-xs font-black tabular-nums shrink-0 shadow">
                          {activeRevealStepIndex}/{totalRevealSteps}
                        </span>
                        <span
                          className={`font-fortunarium text-sm sm:text-lg md:text-xl tracking-wide truncate drop-shadow ${
                            activeRevealStep.variant === 'hazard'
                              ? 'text-rose-400'
                              : activeRevealStep.variant === 'jackpot'
                              ? 'text-yellow-200'
                              : 'text-amber-300'
                          }`}
                        >
                          {activeRevealStep.title}
                        </span>
                        {activeRevealStep.amount !== 0 && (
                          <span
                            className={`px-2 py-0.5 rounded-lg font-mono font-black text-xs sm:text-sm tabular-nums shrink-0 ${
                              activeRevealStep.amount > 0
                                ? 'bg-emerald-500/25 border border-emerald-400/60 text-emerald-300'
                                : 'bg-rose-500/25 border border-rose-400/60 text-rose-300'
                            }`}
                          >
                            {activeRevealStep.amount > 0
                              ? `+${activeRevealStep.amount} CR`
                              : `${activeRevealStep.amount} CR`}
                          </span>
                        )}
                      </div>

                      {/* Accumulated pattern step trail */}
                      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                        {completedRevealSteps.map((s, idx) => (
                          <span
                            key={`${s.id}_${idx}`}
                            className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold whitespace-nowrap tabular-nums border ${
                              idx === completedRevealSteps.length - 1
                                ? 'bg-amber-400/25 border-yellow-300 text-yellow-200'
                                : 'bg-stone-900/90 border-stone-700 text-stone-300'
                            }`}
                          >
                            {s.title.split(' (')[0]}
                            {s.amount !== 0
                              ? ` (${s.amount > 0 ? `+${s.amount}` : s.amount})`
                              : ''}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Large Animated Win Accumulator Counter */}
                    <div className="flex flex-col items-end shrink-0 pl-2 border-l border-amber-500/30">
                      <span className="text-[9px] sm:text-[10px] font-mono font-black uppercase tracking-widest text-amber-300">
                        {spinEvent?.isJackpot ? 'JACKPOT ACUMULADO' : 'TOTAL ACUMULADO'}
                      </span>
                      <span
                        className={`font-mono font-black text-2xl sm:text-3xl md:text-4xl tabular-nums leading-none transition-transform duration-150 ${
                          winCountUpPulse
                            ? 'scale-115 text-yellow-200 drop-shadow-[0_0_16px_rgba(250,204,21,0.95)]'
                            : displayedAccumulatedWin > 0
                            ? 'scale-100 text-emerald-300 drop-shadow-[0_0_10px_rgba(16,185,129,0.65)]'
                            : 'scale-100 text-stone-400'
                        }`}
                      >
                        +{displayedAccumulatedWin} <span className="text-xs sm:text-base">CR</span>
                      </span>
                    </div>
                  </div>
                ) : finalOutcomeBanner ? (
                  <div className="w-full flex items-center justify-between gap-3 animate-fort-total-sweep">
                    <div className="min-w-0 flex-1">
                      <div
                        className={`font-fortunarium text-base sm:text-xl tracking-wide truncate ${
                          finalOutcomeBanner.tier === 'LOSS' || finalOutcomeBanner.netAmount < 0
                            ? 'text-rose-400'
                            : finalOutcomeBanner.grossPayout > 0
                            ? 'text-yellow-200 drop-shadow-[0_0_12px_rgba(250,204,21,0.75)]'
                            : 'text-stone-300'
                        }`}
                      >
                        {finalOutcomeBanner.title}
                      </div>
                      <div className="font-mono font-bold text-[11px] sm:text-xs text-amber-200/90 truncate tabular-nums">
                        {finalOutcomeBanner.subtitle}
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0 pl-2 border-l border-amber-500/30">
                      <span className="text-[9px] sm:text-[10px] font-mono font-black uppercase tracking-widest text-amber-300">
                        TOTAL GANADO
                      </span>
                      <span
                        className={`font-mono font-black text-2xl sm:text-3xl md:text-4xl tabular-nums leading-none ${
                          finalOutcomeBanner.grossPayout > 0
                            ? 'text-emerald-300 drop-shadow-[0_0_14px_rgba(16,185,129,0.85)]'
                            : 'text-stone-500'
                        }`}
                      >
                        +{finalOutcomeBanner.grossPayout}{' '}
                        <span className="text-xs sm:text-base">CR</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400/80">
                        VISOR DE PREMIOS Y PATRONES
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-stone-200 truncate">
                        {roomState.actionLog[0]?.text || 'LISTO PARA GIRAR LOS RODILLOS'}
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0 pl-2 border-l border-amber-500/30">
                      <span className="text-[9px] sm:text-[10px] font-mono font-black uppercase tracking-widest text-amber-300">
                        ÚLTIMO PREMIO
                      </span>
                      <span
                        className={`font-mono font-black text-xl sm:text-2xl md:text-3xl tabular-nums leading-none ${
                          (displayedLastSpinResult?.grossPayout || 0) > 0
                            ? 'text-amber-300'
                            : 'text-stone-500'
                        }`}
                      >
                        +{displayedLastSpinResult?.grossPayout || 0}{' '}
                        <span className="text-xs sm:text-sm">CR</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* --------------------------------------------------------------- */}
            {/* CABINET SECTION B: 3 PHYSICAL GAUGE SCREENS (SECTIONS 5–10, 50) */}
            {/* --------------------------------------------------------------- */}
            <div className="relative z-20 grid grid-cols-3 gap-2 sm:gap-3 shrink-0">
              {/* Screen 1: QUOTA AS A PHYSICAL PROGRESS BAR + HOVER TOOLTIP */}
              <div className="group relative rounded-2xl bg-[#08131c] border-2 border-[#d9a441]/80 p-2.5 sm:p-3 shadow-[inset_0_2px_10px_rgba(0,0,0,0.85)] flex flex-col justify-between gap-1.5 cursor-help">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] sm:text-xs font-fortunarium tracking-wider text-amber-300">
                    {quotaTargetLabel}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-black tabular-nums ${
                      quotaMet
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                        : 'bg-amber-500/15 text-amber-300'
                    }`}
                  >
                    {quotaPct}%
                  </span>
                </div>

                {/* Physical Illuminated Segmented Progress Bar (Primary Visual) */}
                <div className="relative w-full h-3.5 rounded-lg bg-[#04080d] p-0.5 border border-amber-500/40 shadow-[inset_0_2px_6px_rgba(0,0,0,0.95)] overflow-hidden">
                  <div
                    className={`h-full rounded-md transition-all duration-300 ${
                      quotaMet
                        ? 'bg-gradient-to-r from-emerald-500 via-emerald-300 to-teal-300 shadow-[0_0_12px_rgba(16,185,129,0.8)]'
                        : 'bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300 shadow-[0_0_10px_rgba(245,158,11,0.6)]'
                    }`}
                    style={{ width: `${quotaPct}%` }}
                  />
                  {/* Mechanical gauge tick lines */}
                  <div
                    className="pointer-events-none absolute inset-0 opacity-30"
                    style={{
                      backgroundImage:
                        'repeating-linear-gradient(90deg, transparent 0px, transparent 14px, rgba(0,0,0,0.85) 14px, rgba(0,0,0,0.85) 16px)',
                    }}
                  />
                </div>

                <div className="flex items-center justify-between gap-1">
                  <span className="font-mono font-bold text-[11px] sm:text-xs text-stone-300 tabular-nums">
                    {displayedMoney} / {roomState.quota} CR
                  </span>

                  {quotaMet && !isBusy && roomState.phase === 'PLAYING' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fortunariumAudio.playButtonClick();
                        onPayQuotaEarly();
                      }}
                      className="px-2 py-0.5 rounded-md bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-stone-950 font-fortunarium text-[10px] sm:text-[11px] tracking-wider shadow cursor-pointer animate-pulse shrink-0"
                    >
                      SELLAR CUOTA
                    </button>
                  )}
                </div>

                {/* QUOTA HOVER TOOLTIP (Section 7) */}
                <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute left-0 top-[calc(100%+8px)] w-64 z-50 p-3 rounded-xl bg-slate-950/95 border-2 border-amber-400/70 shadow-2xl text-left">
                  <div className="font-fortunarium text-xs text-amber-300 tracking-wider uppercase mb-1">
                    CUOTA
                  </div>
                  <p className="text-[11px] text-slate-200 leading-snug">
                    Debéis alcanzar esta cantidad de créditos para superar el objetivo actual.
                  </p>
                  <p className="text-[10px] text-emerald-300 font-bold mt-1">
                    El dinero NO desaparece al sellar la cuota.
                  </p>
                  <div className="mt-2 pt-1.5 border-t border-white/10 font-mono text-[10px] space-y-0.5 tabular-nums">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Actual:</span>
                      <span className="text-white font-bold">{displayedMoney} CR</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Objetivo:</span>
                      <span className="text-amber-300 font-bold">{roomState.quota} CR</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Faltan:</span>
                      <span className="text-rose-300 font-bold">
                        {Math.max(0, roomState.quota - displayedMoney)} CR
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Screen 2: CRÉDITOS + GANANCIA DE LA ÚLTIMA TIRADA (Sections 5, 11, 12) */}
              <div className="rounded-2xl bg-[#08131c] border-2 border-[#d9a441]/80 p-2.5 sm:p-3 shadow-[inset_0_2px_10px_rgba(0,0,0,0.85)] flex flex-col justify-between gap-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] sm:text-xs font-fortunarium tracking-wider text-amber-300">
                    CRÉDITOS
                  </span>
                  <span className="text-[10px] font-mono font-bold text-amber-200 tabular-nums">
                    {!displayedLastSpinResult ? (
                      <>
                        ÚLTIMA TIRADA:{' '}
                        <strong className="text-stone-400">+0 CR</strong>
                      </>
                    ) : displayedLastSpinResult.netMoneyDelta >= 0 ? (
                      <>
                        GANANCIA:{' '}
                        <strong className="text-emerald-300">
                          +{displayedLastSpinResult.netMoneyDelta} CR
                        </strong>
                      </>
                    ) : (
                      <>
                        PÉRDIDA:{' '}
                        <strong className="text-rose-400">
                          {displayedLastSpinResult.netMoneyDelta} CR
                        </strong>
                      </>
                    )}
                  </span>
                </div>

                <div className="flex items-baseline justify-between gap-2">
                  <div className="font-mono font-black text-xl sm:text-3xl text-amber-300 tabular-nums tracking-tight leading-none">
                    {displayedMoney} <span className="text-xs sm:text-base text-amber-200">CR</span>
                  </div>
                  {displayedLastSpinResult && (
                    <div
                      className={`font-mono font-black text-sm sm:text-lg tabular-nums leading-none ${
                        displayedLastSpinResult.netMoneyDelta > 0
                          ? 'text-emerald-400'
                          : displayedLastSpinResult.netMoneyDelta < 0
                          ? 'text-rose-400'
                          : 'text-stone-400'
                      }`}
                    >
                      {displayedLastSpinResult.netMoneyDelta >= 0
                        ? `+${displayedLastSpinResult.netMoneyDelta} CR`
                        : `${displayedLastSpinResult.netMoneyDelta} CR`}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-1.5 pt-0.5 border-t border-stone-800/90 text-[10px] sm:text-[11px] font-mono font-black tabular-nums">
                  <span className="text-sky-300 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-sky-400" />
                    x{displayedVoltage.toFixed(2)}
                  </span>
                  <span className="text-amber-200 flex items-center gap-1">
                    <Key className="w-3 h-3 text-amber-400" />
                    {displayedKeys} 🔑
                  </span>
                </div>
              </div>

              {/* Screen 3: INTEGRITY AS A PHYSICAL PROGRESS BAR + HOVER TOOLTIP (Sections 8–9) */}
              <div className="group relative rounded-2xl bg-[#08131c] border-2 border-[#d9a441]/80 p-2.5 sm:p-3 shadow-[inset_0_2px_10px_rgba(0,0,0,0.85)] flex flex-col justify-between gap-1.5 cursor-help">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] sm:text-xs font-fortunarium tracking-wider text-amber-300">
                    INTEGRIDAD
                  </span>
                  <span
                    className={`text-xs font-mono font-black tabular-nums ${
                      integrityPct < 35
                        ? 'text-rose-400 animate-pulse'
                        : integrityPct <= 70
                        ? 'text-amber-300'
                        : 'text-emerald-400'
                    }`}
                  >
                    {displayedIntegrity}%
                  </span>
                </div>

                {/* Physical Illuminated Segmented Integrity Bar */}
                <div className="relative w-full h-3.5 rounded-lg bg-[#04080d] p-0.5 border border-amber-500/40 shadow-[inset_0_2px_6px_rgba(0,0,0,0.95)] overflow-hidden">
                  <div
                    className={`h-full rounded-md transition-all duration-300 ${
                      integrityPct < 35
                        ? 'bg-gradient-to-r from-rose-600 to-red-400 shadow-[0_0_12px_rgba(244,63,94,0.85)]'
                        : integrityPct <= 70
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-300'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-300'
                    }`}
                    style={{ width: `${integrityPct}%` }}
                  />
                  <div
                    className="pointer-events-none absolute inset-0 opacity-30"
                    style={{
                      backgroundImage:
                        'repeating-linear-gradient(90deg, transparent 0px, transparent 14px, rgba(0,0,0,0.85) 14px, rgba(0,0,0,0.85) 16px)',
                    }}
                  />
                </div>

                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`font-mono font-bold text-[10px] sm:text-[11px] uppercase ${
                      integrityPct < 35
                        ? 'text-rose-300'
                        : integrityPct <= 70
                        ? 'text-amber-200'
                        : 'text-emerald-300/90'
                    }`}
                  >
                    {integrityPct < 35
                      ? '¡PELIGRO AVERÍA!'
                      : integrityPct <= 70
                      ? 'DESGASTE MEDIO'
                      : 'CHASIS ESTABLE'}
                  </span>

                  {displayedIntegrity < roomState.maxIntegrity && !isBusy && (
                    <button
                      type="button"
                      disabled={!repairValidation.allowed}
                      onClick={(e) => {
                        e.stopPropagation();
                        fortunariumAudio.playButtonClick();
                        onRepairMachine(false);
                      }}
                      className="px-2 py-0.5 rounded-md bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-40 border border-emerald-400/50 text-emerald-200 font-mono font-black text-[10px] cursor-pointer disabled:cursor-not-allowed shrink-0 tabular-nums"
                      title={
                        repairValidation.allowed
                          ? `Reparar máquina por ${repairCost} CR`
                          : repairValidation.reason
                      }
                    >
                      +REPARAR ({repairCost} CR)
                    </button>
                  )}
                </div>

                {/* INTEGRITY HOVER TOOLTIP (Section 9) */}
                <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute right-0 top-[calc(100%+8px)] w-64 z-50 p-3 rounded-xl bg-slate-950/95 border-2 border-amber-400/70 shadow-2xl text-left">
                  <div className="font-fortunarium text-xs text-amber-300 tracking-wider uppercase mb-1">
                    INTEGRIDAD ({displayedIntegrity}%)
                  </div>
                  <p className="text-[11px] text-slate-200 leading-snug">
                    Estado físico de la máquina. Si llega a 0%, la máquina se rompe y termina la partida.
                  </p>
                  <div className="mt-2 pt-1.5 border-t border-white/10 text-[10px] space-y-1">
                    <div>
                      <span className="text-rose-300 font-bold">Causas de daño:</span>{' '}
                      <span className="text-slate-300">
                        desgaste por tirada, bombas y sobrecargas.
                      </span>
                    </div>
                    <div>
                      <span className="text-emerald-300 font-bold">Cómo reparar:</span>{' '}
                      <span className="text-slate-300">
                        Llaves, herraduras o el botón Reparar.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------------- */}
            {/* CABINET SECTION C: 5-REEL VERTICAL CAROUSEL WINDOW + DRAG LEVER  */}
            {/* --------------------------------------------------------------- */}
            <div className="relative z-10 flex-1 min-h-0 flex items-stretch gap-2 sm:gap-3.5">
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
                    const totalStripCount = strip.length; // 30 symbols = 10 windows of 3

                    return (
                      <div
                        key={colIdx}
                        className="relative h-full w-full rounded-2xl bg-gradient-to-b from-[#e9dec5] via-[#faf4e4] to-[#dfd0b0] border-2 border-[#8c6223] overflow-hidden shadow-[inset_0_8px_18px_rgba(0,0,0,0.38)]"
                      >
                        {/* Top & Bottom Cylindrical Reel Drum Shading */}
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-7 bg-gradient-to-b from-black/45 to-transparent z-20" />
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-7 bg-gradient-to-t from-black/45 to-transparent z-20" />

                        {isSpinningCol ? (
                          /* LONGER, SMOOTHER VERTICAL CAROUSEL STRIP MOVING TOP-TO-BOTTOM */
                          <div
                            key={`spin_${spinEvent?.spinId || 'init'}_${colIdx}`}
                            style={{
                              height: `${(totalStripCount / 3) * 100}%`,
                              animation: `fortunariumReelCarouselDown ${REEL_STOP_DELAYS_MS[colIdx]}ms cubic-bezier(0.16, 0.76, 0.22, 1) forwards`,
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
                              const rawSymId = settledCol[rowIdx] || 'cereza';
                              const coordKey = `${colIdx},${rowIdx}`;
                              const wildTargetSymId = activeWildSubstitutionMap.get(coordKey);
                              const displaySymId = wildTargetSymId || rawSymId;
                              const symMeta =
                                FORTUNARIUM_SYMBOLS[displaySymId] || FORTUNARIUM_SYMBOLS.cereza;
                              const isWinCell = highlightedWinCells.has(coordKey);
                              const isSpecialCell = highlightedSpecialCells.has(coordKey);
                              const isHazardCell = highlightedHazardCells.has(coordKey);
                              const isAnyCellHighlighted =
                                highlightedWinCells.size > 0 ||
                                highlightedSpecialCells.size > 0 ||
                                highlightedHazardCells.size > 0;
                              const isDimmedCell =
                                isAnyCellHighlighted &&
                                !isWinCell &&
                                !isSpecialCell &&
                                !isHazardCell;

                              return (
                                <div
                                  key={rowIdx}
                                  className={`relative w-full h-full p-1.5 sm:p-2.5 flex items-center justify-center transition-all duration-200 ${
                                    isWinCell
                                      ? 'bg-amber-300/45 ring-4 ring-inset ring-amber-400 shadow-[inset_0_0_25px_rgba(245,158,11,0.75)] z-10'
                                      : isSpecialCell
                                      ? 'bg-cyan-400/35 ring-4 ring-inset ring-cyan-300 shadow-[inset_0_0_22px_rgba(34,211,238,0.75)] z-10'
                                      : isHazardCell
                                      ? 'bg-rose-500/45 ring-4 ring-inset ring-rose-500 shadow-[inset_0_0_25px_rgba(244,63,94,0.85)] z-10'
                                      : isDimmedCell
                                      ? 'opacity-35 grayscale-[0.4] scale-[0.95]'
                                      : ''
                                  }`}
                                >
                                  <img
                                    key={`${coordKey}_${activePresentedPatternId || 'idle'}`}
                                    src={symMeta.asset}
                                    alt={symMeta.name}
                                    className={`w-full h-full object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)] transition-transform duration-200 ${
                                      wildTargetSymId
                                        ? 'animate-fort-wild-morph scale-115'
                                        : isWinCell || isSpecialCell
                                        ? 'animate-fort-symbol-grow'
                                        : isHazardCell
                                        ? 'scale-110 animate-pulse'
                                        : ''
                                    }`}
                                    draggable={false}
                                  />

                                  {/* Wild Transformation Badge (Section 18) */}
                                  {wildTargetSymId && (
                                    <span className="absolute top-1 left-1 px-1.5 py-0.2 rounded bg-gradient-to-r from-amber-400 to-yellow-300 text-stone-950 font-mono text-[9px] font-black uppercase shadow-md">
                                      COMODÍN → {symMeta.name}
                                    </span>
                                  )}

                                  {/* Subtle corner badge for Special Symbols once stopped */}
                                  {symMeta.category === 'special' && !wildTargetSymId && (
                                    <span
                                      className={`absolute bottom-1 right-1 px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-tight shadow ${
                                        displaySymId === 'bomba' || displaySymId === 'calavera'
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

                {/* GEOMETRIC SVG PATTERN CONNECTOR & FLOATING PAYOUT POPUP (ONLY FOR ACTIVE SINGLE PATTERN) */}
                {!isAnyReelSpinning &&
                  activePresentedPatternId !== null &&
                  activeRevealStep &&
                  activeRevealStep.id === activePresentedPatternId &&
                  Boolean(activeRevealStep.patternType) &&
                  activeRevealStep.cells.length > 0 &&
                  (() => {
                    const pts = activeRevealStep.cells.map((c) => ({
                      x: c.col * 100 + 50,
                      y: c.row * 100 + 50,
                    }));
                    const isHazard = activeRevealStep.variant === 'hazard';
                    const strokeColor = isHazard ? '#fb7185' : '#fde047';
                    const glowColor = isHazard ? 'rgba(244,63,94,0.9)' : 'rgba(245,158,11,0.95)';
                    const isTriangle =
                      activeRevealStep.patternType === 'TRIANGULO' ||
                      activeRevealStep.patternType === 'TRIANGULO_INVERTIDO';
                    const isXPattern = activeRevealStep.patternType === 'X';

                    const avgX =
                      pts.reduce((acc, p) => acc + p.x, 0) / Math.max(1, pts.length);
                    const avgY =
                      pts.reduce((acc, p) => acc + p.y, 0) / Math.max(1, pts.length);
                    const popupLeftPct = Math.max(20, Math.min(80, (avgX / 500) * 100));
                    const popupTopPct = Math.max(18, Math.min(82, (avgY / 300) * 100));

                    return (
                      <div className="pointer-events-none absolute inset-2 sm:inset-3 z-25 overflow-hidden rounded-xl">
                        <svg
                          viewBox="0 0 500 300"
                          preserveAspectRatio="none"
                          className="w-full h-full"
                        >
                          <defs>
                            <filter id="fortunariumPatternGlow" x="-25%" y="-25%" width="150%" height="150%">
                              <feDropShadow
                                dx="0"
                                dy="0"
                                stdDeviation="6"
                                floodColor={glowColor}
                              />
                            </filter>
                          </defs>

                          {/* Geometric Line, X Cross, or Triangle Outline */}
                          {isTriangle ? (
                            <polygon
                              points={
                                activeRevealStep.patternType === 'TRIANGULO'
                                  ? '250,50 450,250 50,250'
                                  : '50,50 450,50 250,250'
                              }
                              fill="rgba(253,224,71,0.14)"
                              stroke={strokeColor}
                              strokeWidth="8"
                              strokeLinejoin="round"
                              filter="url(#fortunariumPatternGlow)"
                            />
                          ) : isXPattern ? (
                            <>
                              <polyline
                                points="150,50 250,150 350,250"
                                fill="none"
                                stroke={strokeColor}
                                strokeWidth="9"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                filter="url(#fortunariumPatternGlow)"
                              />
                              <polyline
                                points="350,50 250,150 150,250"
                                fill="none"
                                stroke={strokeColor}
                                strokeWidth="9"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                filter="url(#fortunariumPatternGlow)"
                              />
                            </>
                          ) : (
                            pts.length >= 2 && (
                              <polyline
                                points={pts.map((p) => `${p.x},${p.y}`).join(' ')}
                                fill="none"
                                stroke={strokeColor}
                                strokeWidth="9"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                filter="url(#fortunariumPatternGlow)"
                              />
                            )
                          )}

                          {/* Node Connectors at each winning cell center */}
                          {pts.map((p, idx) => (
                            <circle
                              key={idx}
                              cx={p.x}
                              cy={p.y}
                              r="11"
                              fill="#090d14"
                              stroke={strokeColor}
                              strokeWidth="5"
                              filter="url(#fortunariumPatternGlow)"
                            />
                          ))}
                        </svg>

                        {/* Floating Pattern Callout Badge over Pattern Centroid */}
                        <div
                          style={{
                            left: `${popupLeftPct}%`,
                            top: `${popupTopPct}%`,
                          }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 px-3.5 py-1.5 rounded-2xl bg-[#090d14]/95 border-2 border-yellow-300 shadow-[0_10px_28px_rgba(0,0,0,0.9)] flex flex-col items-center text-center whitespace-nowrap"
                        >
                          <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-200">
                            {activeRevealStep.title}
                          </span>
                          {activeRevealStep.amount !== 0 && (
                            <span
                              className={`font-mono text-base sm:text-xl font-black tabular-nums leading-tight ${
                                activeRevealStep.amount > 0
                                  ? 'text-emerald-400'
                                  : 'text-rose-400'
                              }`}
                            >
                              {activeRevealStep.amount > 0
                                ? `+${activeRevealStep.amount} CR`
                                : `${activeRevealStep.amount} CR`}
                            </span>
                          )}
                        </div>

                        {/* Visual +XX CR Reward Addition Flying Upward to Top Display */}
                        {flyingRewardAddition && flyingRewardAddition.amount !== 0 && (
                          <div
                            key={flyingRewardAddition.id}
                            style={{
                              left: `${popupLeftPct}%`,
                              top: `${Math.max(12, popupTopPct - 8)}%`,
                            }}
                            className="animate-fort-reward-fly-up absolute px-3 py-1 rounded-xl bg-amber-400 text-stone-950 border-2 border-yellow-100 font-fortunarium text-base sm:text-xl font-black shadow-[0_0_24px_rgba(250,204,21,0.95)] whitespace-nowrap"
                          >
                            {flyingRewardAddition.amount > 0
                              ? `+${flyingRewardAddition.amount} CR`
                              : `${flyingRewardAddition.amount} CR`}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                {/* SPECIAL SYMBOL SPOTLIGHT & UPGRADE SOCKET TOAST (Sections 17 & 25) */}
                <FortunariumSpecialSpotlight
                  activeEffect={activeRevealStep?.specialEffect || null}
                  installedUpgradeToast={installedUpgradeToast}
                />
              </div>

              {/* ============================================================= */}
              {/* RIGHT-SIDE DRAGGABLE MECHANICAL SLOT LEVER (SECTIONS 23–28)   */}
              {/* ============================================================= */}
              <div
                ref={leverTrackRef}
                onPointerDown={handleLeverPointerDown}
                onPointerMove={handleLeverPointerMove}
                onPointerUp={(e) => finishLeverInteraction(e, false)}
                onPointerCancel={(e) => finishLeverInteraction(e, true)}
                title={
                  canSpin
                    ? 'Arrastra la palanca hacia abajo (≥68%) o haz clic para girar'
                    : 'Esperando turno o tirada en curso'
                }
                className={`w-14 sm:w-18 md:w-20 rounded-3xl bg-gradient-to-b from-[#173f49] via-[#0e2a32] to-[#081a20] border-[3px] border-[#d9a441] p-2 flex flex-col items-center justify-between shadow-2xl touch-none select-none transition-colors ${
                  canSpin
                    ? 'cursor-grab active:cursor-grabbing hover:border-yellow-300'
                    : 'opacity-55 cursor-not-allowed'
                }`}
              >
                <span className="text-[9px] sm:text-[10px] font-fortunarium tracking-wider text-amber-300 text-center leading-tight">
                  PALANCA
                </span>

                {/* Vertical Travel Track & 68% Activation Threshold Marker */}
                <div className="relative flex-1 w-full flex items-center justify-center my-2">
                  {/* Recessed Metal Slot Track */}
                  <div className="relative w-3.5 h-full rounded-full bg-gradient-to-r from-stone-950 via-stone-800 to-stone-950 border border-amber-500/35 shadow-inner overflow-hidden">
                    {/* Pull Fill Bar */}
                    <div
                      style={{ height: `${Math.round(leverProgress * 100)}%` }}
                      className={`w-full transition-colors ${
                        leverProgress >= LEVER_ACTIVATION_THRESHOLD
                          ? 'bg-gradient-to-b from-amber-400 to-emerald-400'
                          : 'bg-gradient-to-b from-amber-500/60 to-amber-400/80'
                      }`}
                    />
                    {/* 68% Threshold Line */}
                    <div
                      style={{ top: `${LEVER_ACTIVATION_THRESHOLD * 100}%` }}
                      className="absolute inset-x-0 h-0.5 bg-yellow-300/80"
                    />
                  </div>

                  {/* Chromed Lever Arm & Red Casino Ball Handle */}
                  <div
                    style={{
                      top: `calc(${leverProgress * 76}% + 4px)`,
                      transition: isDraggingLever
                        ? 'none'
                        : 'top 280ms cubic-bezier(0.34, 1.56, 0.64, 1), transform 280ms ease',
                    }}
                    className={`absolute w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center shadow-[0_8px_18px_rgba(0,0,0,0.75)] ${
                      leverProgress >= LEVER_ACTIVATION_THRESHOLD
                        ? 'bg-gradient-to-br from-emerald-300 via-emerald-500 to-teal-800 border-yellow-200 scale-105 shadow-[0_0_20px_rgba(16,185,129,0.85)]'
                        : 'bg-gradient-to-br from-rose-400 via-red-600 to-rose-950 border-amber-200'
                    }`}
                  >
                    <div className="w-3 h-3 rounded-full bg-white/45 -translate-x-1 -translate-y-1" />
                  </div>
                </div>

                <span
                  className={`text-[9px] sm:text-[10px] font-mono font-black tabular-nums text-center leading-tight ${
                    leverProgress >= LEVER_ACTIVATION_THRESHOLD
                      ? 'text-emerald-300 animate-pulse'
                      : 'text-amber-200'
                  }`}
                >
                  {isDraggingLever
                    ? leverProgress >= LEVER_ACTIVATION_THRESHOLD
                      ? '¡SOLTAR!'
                      : `${Math.round(leverProgress * 100)}%`
                    : 'BAJAR ↓'}
                </span>
              </div>
            </div>

            {/* --------------------------------------------------------------- */}
            {/* CABINET SECTION D: MECHANICAL CONTROL DECK (SINGLE SPIN COST)   */}
            {/* --------------------------------------------------------------- */}
            <div className="relative z-10 rounded-2xl bg-gradient-to-b from-[#23150e] via-[#180e09] to-[#0f0805] border-[3px] border-[#d9a441] p-2.5 sm:p-3 shadow-[0_10px_25px_rgba(0,0,0,0.8)] flex flex-wrap items-center justify-between gap-2 shrink-0">
              {/* Left Controls: APUESTA MÍN / - / MODE & SINGLE SPIN COST / + / APUESTA MÁX */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <button
                  type="button"
                  disabled={isBusy || !isMyTurn || roomState.betMode === 'normal'}
                  onClick={() => {
                    fortunariumAudio.playButtonClick();
                    onSetBetMode('normal');
                  }}
                  className={`px-2.5 py-2 rounded-xl border-2 text-[11px] font-fortunarium tracking-wider transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed active:translate-y-0.5 ${
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

                <div className="px-3 py-1.5 rounded-xl bg-[#090d14] border border-amber-500/40 text-center min-w-[132px]">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-stone-400">
                    COSTE DE TIRADA ({FORTUNARIUM_BET_MODES[roomState.betMode].shortLabel})
                  </div>
                  <div className="text-xs sm:text-sm font-mono font-black text-amber-300 tabular-nums">
                    {currentSpinCost} CR
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
                  className={`px-2.5 py-2 rounded-xl border-2 text-[11px] font-fortunarium tracking-wider transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed active:translate-y-0.5 ${
                    roomState.betMode === 'sobrecarga'
                      ? 'bg-rose-600 text-white border-rose-300 shadow-[0_0_14px_rgba(225,29,72,0.65)]'
                      : 'bg-stone-900 hover:bg-stone-800 text-amber-200 border-amber-500/40'
                  }`}
                >
                  APUESTA MÁX
                </button>
              </div>

              {/* Center Primary Mechanical Spin Button: GIRAR ONLY (Section 1) */}
              <button
                type="button"
                disabled={!canSpin}
                onClick={() => handleTriggerSpin(undefined, 'button')}
                className={`fort-physical-btn flex-1 min-w-[180px] max-w-[300px] py-3.5 px-6 rounded-2xl border-[3px] flex items-center justify-center ${
                  canSpin
                    ? 'bg-gradient-to-b from-red-500 via-rose-600 to-red-800 hover:from-red-400 hover:to-red-700 border-yellow-300 text-white cursor-pointer shadow-[0_6px_0_#7f1d1d,0_10px_25px_rgba(225,29,72,0.6)] animate-fort-girar-breathe'
                    : 'bg-stone-800 border-stone-600 text-stone-400 cursor-not-allowed opacity-75'
                }`}
              >
                <span className="font-fortunarium text-2xl sm:text-3xl tracking-widest leading-none drop-shadow">
                  GIRAR
                </span>
              </button>

              {/* Right Utility Buttons on Deck: REPARAR & TALLER */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={
                    isBusy ||
                    displayedIntegrity >= roomState.maxIntegrity ||
                    !repairValidation.allowed
                  }
                  onClick={() => {
                    fortunariumAudio.playButtonClick();
                    onRepairMachine(false);
                  }}
                  className="px-3 py-2 rounded-xl bg-emerald-950/90 hover:bg-emerald-900 disabled:opacity-45 border-2 border-emerald-400/50 text-emerald-200 text-xs font-black flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed active:translate-y-0.5"
                  title={
                    displayedIntegrity >= roomState.maxIntegrity
                      ? 'Integridad al 100%'
                      : !repairValidation.allowed
                      ? repairValidation.reason || 'No permitido'
                      : `Reparar chasis por ${repairCost} CR`
                  }
                >
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <div className="text-left leading-tight">
                    <div className="text-[10px] font-fortunarium tracking-wide uppercase">
                      REPARAR
                    </div>
                    <div className="font-mono text-[11px] tabular-nums">
                      {repairValidation.code === 'SPIN_RESERVE_REQUIRED'
                        ? `RESERVA ${repairValidation.minSpinReserve} CR`
                        : `${repairCost} CR`}
                    </div>
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
                    <div className="text-[10px] font-fortunarium tracking-wide uppercase">
                      TALLER
                    </div>
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

      {/* Keyframe style for smooth top-to-bottom vertical reel carousel (45 items = 93.3333% travel with gentle mechanical settle) */}
      <style>{`
        @keyframes fortunariumReelCarouselDown {
          0% {
            transform: translateY(-93.333333%);
          }
          92% {
            transform: translateY(0.45%);
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
                    className={`px-2.5 py-1 rounded-lg font-mono text-xs font-black shrink-0 tabular-nums ${
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
                  ¡Cuota {roomState.round} Sellada! (Conserváis todos vuestros créditos)
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
                        <strong>Mejora Gratuita de Cuota:</strong> Elige 1 de las 3 mejoras aleatorias para especializar la máquina.
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
                            <div className="text-xs font-mono font-bold text-amber-300 tabular-nums">
                              Nivel {currentLv} → {currentLv + 1} (Máx. {meta.maxLevel})
                            </div>
                          </div>

                          <p className="text-xs text-stone-200 leading-relaxed">
                            {meta.description}
                          </p>
                        </div>

                        <div className="pt-2.5 border-t border-stone-800 flex flex-col gap-2">
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
                className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-amber-500/40 text-amber-200 text-xs font-black flex items-center gap-2 cursor-pointer tabular-nums"
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
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 disabled:from-stone-800 disabled:to-stone-800 disabled:text-stone-500 text-stone-950 font-fortunarium text-sm tracking-wider shadow-xl cursor-pointer disabled:cursor-not-allowed"
              >
                {roomState.offeredUpgradeIds.length > 0
                  ? 'ELEGID PRIMERO LA MEJORA DE CUOTA'
                  : `CONTINUAR A CUOTA ${roomState.round + 1} →`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. VICTORY / DEFEAT END-OF-RUN SUMMARY MODAL (SECTIONS 3, 4, 27, 38)  */}
      {/* ===================================================================== */}
      {(roomState.phase === 'VICTORY' || roomState.phase === 'DEFEAT') && !isBusy && (
        <FortunariumEndRunModal
          roomState={roomState}
          installedUpgrades={installedUpgradeTuples}
          onRestartMatch={onRestartMatch}
          onReturnToLobby={onReturnToLobby}
        />
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
                  <div className="text-sm font-black text-white font-mono tabular-nums">
                    Integridad del Chasis: {displayedIntegrity}% / {roomState.maxIntegrity}%
                  </div>
                  <div className="text-xs text-stone-300">
                    Restaura +{25 + (roomState.upgrades.mecanico_jefe || 0) * 10}% de Integridad usando créditos o 1 Llave.
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={
                      displayedIntegrity >= roomState.maxIntegrity || !repairValidation.allowed
                    }
                    onClick={() => {
                      fortunariumAudio.playButtonClick();
                      onRepairMachine(false);
                    }}
                    title={!repairValidation.allowed ? repairValidation.reason : undefined}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-stone-950 font-mono font-black text-xs cursor-pointer disabled:cursor-not-allowed tabular-nums"
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
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 font-mono font-black text-xs cursor-pointer disabled:cursor-not-allowed tabular-nums"
                  >
                    Usar 1 🔑
                  </button>
                </div>
                {displayedIntegrity < roomState.maxIntegrity &&
                  repairValidation.code === 'SPIN_RESERVE_REQUIRED' && (
                    <span className="text-[10px] font-mono font-bold text-amber-300">
                      ⚠️ Reserva mínima de {repairValidation.minSpinReserve} CR protegida para poder girar
                    </span>
                  )}
              </div>
            </div>

            {/* Upgrades Grid */}
            <div className="overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ALL_UPGRADE_IDS.map((upId) => {
                const meta = FORTUNARIUM_UPGRADES_CATALOG[upId];
                const lv = roomState.upgrades[upId] || 0;
                const isMax = lv >= meta.maxLevel;
                const costMoney = getUpgradeCostMoney(upId, lv);
                const upgradeMoneyCheck = validateWorkshopPurchase({
                  currentMoney: displayedMoney,
                  cost: costMoney,
                  quotaTarget: roomState.quota,
                  upgrades: roomState.upgrades,
                  activeModifiers: roomState.activeModifiers,
                  isMaxLevel: isMax,
                });

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
                        <span className="px-2 py-0.5 rounded bg-amber-500/15 text-[10px] font-mono font-black text-amber-300 tabular-nums">
                          Nv. {lv}/{meta.maxLevel}
                        </span>
                      </div>

                      <div>
                        <div className="text-sm font-fortunarium text-white tracking-wide">
                          {meta.name.toUpperCase()}
                        </div>
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
                      <div className="flex flex-col gap-1">
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            disabled={!upgradeMoneyCheck.allowed}
                            onClick={() => {
                              fortunariumAudio.playButtonClick();
                              onBuyUpgrade(upId, false);
                            }}
                            title={!upgradeMoneyCheck.allowed ? upgradeMoneyCheck.reason : undefined}
                            className="py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 font-mono font-black text-xs cursor-pointer disabled:cursor-not-allowed tabular-nums"
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
                            className="py-2 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-40 border border-amber-400/40 text-amber-200 font-mono font-black text-xs cursor-pointer disabled:cursor-not-allowed tabular-nums"
                          >
                            {meta.keyCost} 🔑
                          </button>
                        </div>
                        {upgradeMoneyCheck.code === 'SPIN_RESERVE_REQUIRED' && (
                          <div className="text-[10px] font-mono font-bold text-amber-300 text-center">
                            Protegido: deja ≥{upgradeMoneyCheck.minSpinReserve} CR para girar
                          </div>
                        )}
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
      {/* 9. DEV-ONLY PROBABILITY, PATTERNS & MONTE CARLO SIMULATOR (SEC. 42)   */}
      {/* ===================================================================== */}
      {Boolean(import.meta.env?.DEV) && showDevModal && (
        <div
          className="fixed inset-0 z-[90] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowDevModal(false)}
        >
          <div
            className="w-full max-w-4xl rounded-3xl bg-stone-950 border-2 border-fuchsia-500/60 p-5 sm:p-6 shadow-2xl flex flex-col gap-4 my-auto max-h-[90dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-fuchsia-400">
                  DEV-ONLY VERIFICATION SUITE
                </span>
                <h3 className="text-xl font-fortunarium text-white tracking-wide">
                  SIMULADOR DE PATRONES Y ECONOMÍA (FORTUNARIUM)
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

            {/* Deterministic Pattern & Special Symbol Test Triggers (Section 33 / 42) */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Disparar Tableros Deterministas de Prueba:
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowDevModal(false);
                    setForceReplayIntro(true);
                  }}
                  className="px-3 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/50 text-[11px] font-mono font-bold text-amber-200 cursor-pointer"
                >
                  🎬 Reproducir Intro Compuerta
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {(
                  [
                    { id: 'horizontal_3', label: 'Horizontal ×3' },
                    { id: 'horizontal_4', label: 'Horizontal ×4' },
                    { id: 'horizontal_5', label: 'Horizontal ×5' },
                    { id: 'vertical_3', label: 'Vertical ×3' },
                    { id: 'diagonal_left', label: 'Diagonal ↘' },
                    { id: 'diagonal_right', label: 'Diagonal ↗' },
                    { id: 'pat_x', label: 'Patrón X (5)' },
                    { id: 'triangulo', label: 'Triángulo ▲ (8)' },
                    { id: 'triangulo_invertido', label: 'Triángulo Inv. ▼ (8)' },
                    { id: 'multi_pattern', label: '2 Patrones' },
                    { id: 'three_patterns', label: '3 Patrones' },
                    { id: 'pattern_overlap', label: 'Solape Patrones' },
                    { id: 'wild_substitution', label: 'Comodín Wild' },
                    { id: 'no_pattern', label: 'Sin Premio' },
                    { id: 'special_bomba', label: '💣 Bomba' },
                    { id: 'special_llave', label: '🔑 Llave' },
                    { id: 'special_rayo', label: '⚡ Rayo' },
                    { id: 'special_calavera', label: '💀 Calavera' },
                    { id: 'special_moneda', label: '🪙 Moneda' },
                    { id: 'special_interrogacion', label: '❓ Interrogación' },
                    { id: 'jackpot', label: '🏆 Jackpot' },
                    { id: 'force_bankruptcy', label: '💸 Forzar Bancarrota' },
                    { id: 'force_integrity_zero', label: '🔧 Forzar Avería 0%' },
                  ] as const
                ).map((sc) => (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => {
                      setShowDevModal(false);
                      handleTriggerSpin(sc.id, 'button');
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-stone-700 text-[11px] font-mono font-bold text-amber-300 cursor-pointer"
                  >
                    {sc.label}
                  </button>
                ))}
              </div>

              {onDevGrantModifier && (
                <div className="pt-2 border-t border-stone-800 flex flex-col gap-1.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                    Pegar Nota Temporal (Buff / Debuff) en el Tablón de Papel:
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {ALL_MODIFIER_IDS.map((modId) => {
                      const mod = FORTUNARIUM_MODIFIERS_CATALOG[modId];
                      return (
                        <button
                          key={modId}
                          type="button"
                          onClick={() => {
                            onDevGrantModifier(modId);
                            setShowDevModal(false);
                          }}
                          className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono font-bold cursor-pointer ${
                            mod.type === 'BUFF'
                              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200 hover:bg-emerald-900'
                              : 'bg-rose-950/80 border-rose-500/50 text-rose-200 hover:bg-rose-900'
                          }`}
                        >
                          {mod.type === 'BUFF' ? 'BUFF:' : 'DEBUFF:'} {mod.name} (
                          {mod.defaultSpins}T)
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Automated 15-Case Canonical Pattern Engine Unit Tests (Section 61) */}
            <div className="p-3.5 rounded-2xl bg-stone-900/90 border border-stone-800 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-black uppercase text-emerald-400">
                  VERIFICACIÓN CANÓNICA DE PATRONES ({unitTestSuite.passedCount}/{unitTestSuite.totalCount} TESTS OK)
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-black ${
                    unitTestSuite.allPassed
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {unitTestSuite.allPassed ? 'ALL PASSED ✓' : 'FAILED ✗'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[10px] font-mono">
                {unitTestSuite.results.map((t) => (
                  <div
                    key={t.id}
                    className={`px-2 py-1 rounded border flex items-center justify-between gap-1 ${
                      t.passed
                        ? 'bg-stone-950/80 border-emerald-500/30 text-stone-300'
                        : 'bg-rose-950/60 border-rose-500 text-rose-200'
                    }`}
                  >
                    <span className="truncate" title={t.details}>
                      {t.passed ? '✓' : '✗'} {t.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-stone-800">
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
                Simular 100.000 Tiradas + 1.500 Partidas
              </button>
            </div>

            {simReport && (
              <div className="flex flex-col gap-3 font-mono text-xs tabular-nums">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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
                    <div className="text-[10px] text-stone-400">Éxito Cuota 1 / 2 / 3</div>
                    <div className="text-sm font-black text-sky-300">
                      {simReport.quota1SuccessRatePct}% / {simReport.quota2SuccessRatePct}% /{' '}
                      {simReport.quota3SuccessRatePct}%
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-900 border border-stone-800">
                    <div className="text-[10px] text-stone-400">Bancarrota Cuota 1</div>
                    <div className="text-base font-black text-rose-400">
                      {simReport.bankruptcyRateQuota1Pct}%
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div>Horiz ×3: {simReport.patternFrequencies.HORIZONTAL_3}%</div>
                  <div>Horiz ×4: {simReport.patternFrequencies.HORIZONTAL_4}%</div>
                  <div>Horiz ×5: {simReport.patternFrequencies.HORIZONTAL_5}%</div>
                  <div>Vertical ×3: {simReport.patternFrequencies.VERTICAL_3}%</div>
                  <div>Diagonal ×3: {simReport.patternFrequencies.DIAGONAL_3}%</div>
                  <div>Patrón X: {simReport.patternFrequencies.X}%</div>
                  <div>Triángulo ▲: {simReport.patternFrequencies.TRIANGULO}%</div>
                  <div>Triáng. Inv ▼: {simReport.patternFrequencies.TRIANGULO_INVERTIDO}%</div>
                  <div>Jackpot: {simReport.jackpotHitRatePct}%</div>
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
