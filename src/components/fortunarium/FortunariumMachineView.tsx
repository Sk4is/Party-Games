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
  generateDeterministicTestGrid,
  evaluateSpinGridCore,
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
import { FortunariumGarageIntro, FortunariumNextQuotaPaperInfo } from './FortunariumGarageIntro';
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

const FULL_GRID_15_CELLS: FortunariumCellCoord[] = [
  { col: 0, row: 0 }, { col: 1, row: 0 }, { col: 2, row: 0 }, { col: 3, row: 0 }, { col: 4, row: 0 },
  { col: 0, row: 1 }, { col: 1, row: 1 }, { col: 2, row: 1 }, { col: 3, row: 1 }, { col: 4, row: 1 },
  { col: 0, row: 2 }, { col: 1, row: 2 }, { col: 2, row: 2 }, { col: 3, row: 2 }, { col: 4, row: 2 },
];

function classifyWinTier(spin: FortunariumSpinResult): FortunariumWinTier {
  const mult = spin.grossPayout / Math.max(1, spin.spinCost);
  if (spin.isJackpot || spin.grossPayout >= 160 || mult >= 15) return 'JACKPOT';
  if (spin.grossPayout >= 90 || mult >= 8) return 'HUGE';
  if (spin.grossPayout >= 40 || mult >= 4) return 'BIG';
  if (spin.grossPayout >= 18 || mult >= 1.5) return 'MEDIUM';
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
      subtitle: 'DESFILE JACKPOT · TRIÁNGULO INVERSO (8 CASILLAS)',
      integrityDelta: 0,
      cells: INVERTED_TRIANGLE_MASK_CELLS,
      variant: 'jackpot' as const,
      patternType: 'TRIANGULO_INVERTIDO' as const,
      symbolId: symId,
    },
    // 7. Canonical Full-Grid Climax (Part D: All 15 Cells)
    {
      id: `jp_full_grid_${spin.spinId}`,
      title: `PANTALLA COMPLETA · JACKPOT SUPREMO (${symName})`,
      subtitle: 'DESFILE JACKPOT · CLÍMAX SUPREMO (15 CASILLAS)',
      integrityDelta: 0,
      cells: FULL_GRID_15_CELLS,
      variant: 'jackpot' as const,
      patternType: 'PANTALLA_COMPLETA' as const,
      symbolId: symId,
    },
  ];

  // Progressive weights across the 14 parade steps so the climax builds naturally and sums to spin.grossPayout
  const weights = [5, 5, 5, 3, 3, 3, 3, 3, 4, 4, 10, 14, 18, 20]; // sum = 100
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

  // Garage Door Intro State & Inter-Quota Transition (Part H)
  const [introSeenMatchId, setIntroSeenMatchId] = useState<string | null>(() =>
    roomState.totalSpinsInMatch > 0 ? roomState.matchId : null
  );
  const [forceReplayIntro, setForceReplayIntro] = useState(false);
  const [lastSeenQuotaRound, setLastSeenQuotaRound] = useState<number>(roomState.round);
  const [quotaSealingStampActive, setQuotaSealingStampActive] = useState(false);
  const [simBetMode, setSimBetMode] = useState<FortunariumBetMode>(roomState.betMode);
  const [localSandboxSpinOverride, setLocalSandboxSpinOverride] =
    useState<FortunariumSpinResult | null>(null);

  const showInterQuotaGarageDoor =
    roomState.phase === 'PLAYING' &&
    roomState.round > 1 &&
    lastSeenQuotaRound < roomState.round;

  const showGarageIntro =
    forceReplayIntro ||
    showInterQuotaGarageDoor ||
    (roomState.phase === 'PLAYING' &&
      roomState.totalSpinsInMatch === 0 &&
      introSeenMatchId !== roomState.matchId);

  const nextQuotaPaperInfo = useMemo<FortunariumNextQuotaPaperInfo | null>(() => {
    if (roomState.round <= 1 && roomState.totalSpinsInMatch === 0) return null;
    return {
      quotaNumber: roomState.round,
      quotaTarget: roomState.quota,
      currentCredits: roomState.money,
      currentIntegrity: roomState.integrity,
      repairCost: 28 + (roomState.round - 1) * 8,
      flavorQuote:
        roomState.round === 2
          ? 'El bobinado aguanta bien. Pero la demanda sube. Mantened un ojo en la temperatura.'
          : roomState.round === 3
          ? 'Los relés crujen si forzáis la sobrecarga. No escatiméis en reparaciones básicas.'
          : 'La caja común es vuestro pulmón. Todo lo que no gastéis en taller sigue con vosotros.',
    };
  }, [
    roomState.round,
    roomState.quota,
    roomState.money,
    roomState.integrity,
    roomState.totalSpinsInMatch,
  ]);

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
  const activeSpinEvent = localSandboxSpinOverride || spinEvent;

  useEffect(() => {
    if (!activeSpinEvent || activeSpinEvent.spinId === lastHandledSpinIdRef.current) return;
    lastHandledSpinIdRef.current = activeSpinEvent.spinId;

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

    // Build real symbol carousel strips from previous settled grid -> new activeSpinEvent.grid
    const seed = Date.now() % 97;
    const strips = activeSpinEvent.grid.map((finalCol, colIdx) =>
      buildReelCarouselStrip(
        colIdx,
        settledGridRef.current[colIdx] || finalCol,
        finalCol,
        seed
      )
    );
    setReelStrips(strips);

    // STAGE 1: Deduct ONLY spinCost immediately; keep integrity & voltage at pre-spin values
    setDisplayedMoney(activeSpinEvent.moneyAfterSpinCost);
    setDisplayedVoltage(activeSpinEvent.voltageMultiplierUsed);

    // Animate lever down & start all 5 vertical reels spinning downward rapidly
    setLeverProgress(1);
    setReelsSpinning([true, true, true, true, true]);
    setReelsLandedBounce([false, false, false, false, false]);
    if (activeSpinEvent.triggerSource === 'lever') {
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
          next[colIndex] = activeSpinEvent.grid[colIndex];
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
      settledGridRef.current = activeSpinEvent.grid;
      setSettledGrid(activeSpinEvent.grid);
      setIsRevealingRewards(true);

      const steps: RevealStep[] = [];
      if (activeSpinEvent.isJackpot) {
        // PROGRESSIVE JACKPOT BUILD-UP PARADE (Sections 15–19):
        // Step through Horizontal 1–3, Vertical 1–5, Diagonal 1–2, X, Triangle, Inverted Triangle, and Full Grid Climax
        steps.push(...buildJackpotParadeSteps(activeSpinEvent));
      } else {
        for (const line of activeSpinEvent.winLines) {
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

      for (const fx of activeSpinEvent.specialEffects) {
        // Skip duplicate jackpot specialEffect card when running the 14-step Jackpot Parade
        if (activeSpinEvent.isJackpot && fx.variant === 'jackpot') continue;
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
      const tier = classifyWinTier(activeSpinEvent);

      if (steps.length === 0) {
        setActivePresentedPatternId(null);
        setActiveRevealStep(null);
        setDisplayedMoney(activeSpinEvent.finalMoney);
        setDisplayedIntegrity(activeSpinEvent.finalIntegrity);
        setDisplayedVoltage(activeSpinEvent.voltageMultiplierAfter);
        setDisplayedKeys(activeSpinEvent.finalKeys);
        setDisplayedLastSpinResult(activeSpinEvent);
        setFinalOutcomeBanner({
          title: 'SIN PREMIO',
          subtitle: `TIRADA: -${activeSpinEvent.spinCost} CR · AHORA: ${activeSpinEvent.finalMoney} CR`,
          spinCost: activeSpinEvent.spinCost,
          grossPayout: 0,
          netAmount: -activeSpinEvent.spinCost,
          finalMoney: activeSpinEvent.finalMoney,
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
      const stepHoldMs = activeSpinEvent.isJackpot ? 740 : 1020;
      const stepGapMs = activeSpinEvent.isJackpot ? 90 : 130;
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
          } else if (activeSpinEvent.isJackpot) {
            // Progressive audio build-up across the 14 Jackpot parade steps
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
              isJackpot: activeSpinEvent.isJackpot || step.variant === 'jackpot',
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
        setAccumulatedSpinWin(Math.max(0, activeSpinEvent.grossPayout - activeSpinEvent.penalties));
        // Transfer final accumulated total into the machine's authoritative money display
        setDisplayedMoney(activeSpinEvent.finalMoney);
        setDisplayedIntegrity(activeSpinEvent.finalIntegrity);
        setDisplayedVoltage(activeSpinEvent.voltageMultiplierAfter);
        setDisplayedKeys(activeSpinEvent.finalKeys);
        setDisplayedLastSpinResult(activeSpinEvent);

        fortunariumAudio.playWinTierSting(tier);

        const netDelta = activeSpinEvent.netMoneyDelta;
        const bannerTitle = activeSpinEvent.isJackpot
          ? `¡JACKPOT SUPREMO! TOTAL GANADO: +${activeSpinEvent.grossPayout} CR`
          : activeSpinEvent.grossPayout > 0
          ? `TOTAL GANADO: +${activeSpinEvent.grossPayout} CR`
          : `AVERÍA EN LOS RODILLOS (${netDelta} CR)`;

        setFinalOutcomeBanner({
          title: bannerTitle,
          subtitle: `TIRADA: -${activeSpinEvent.spinCost} CR · PREMIO: +${activeSpinEvent.grossPayout} CR${
            activeSpinEvent.penalties > 0 ? ` · PENALIZACIÓN: -${activeSpinEvent.penalties} CR` : ''
          } · CAJA COMÚN: ${activeSpinEvent.finalMoney} CR`,
          spinCost: activeSpinEvent.spinCost,
          grossPayout: activeSpinEvent.grossPayout,
          netAmount: netDelta,
          finalMoney: activeSpinEvent.finalMoney,
          tier,
        });

        const finishTimer = setTimeout(() => {
          setIsRevealingRewards(false);
          setIsSpinPresentationActive(false);
          setLocalSandboxSpinOverride(null);
        }, 1450);
        timersRef.current.push(finishTimer);
      }, summaryDelay);
      timersRef.current.push(summaryTimer);
    }, postStopDelay);
    timersRef.current.push(postStopTimer);
  }, [activeSpinEvent, clearAllSpinTimers]);

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
    () =>
      computeEffectiveJackpotChance(
        roomState.upgrades,
        roomState.betMode,
        roomState.activeModifiers || []
      ),
    [roomState.upgrades, roomState.betMode, roomState.activeModifiers]
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

  // Local Client-Only Sandbox Spin Runner (Part C: Pure memory inspection, zero WebSocket traffic)
  const handleRunLocalSandboxSpin = useCallback(
    (scenarioId: string) => {
      setShowDevModal(false);

      const sandboxGrid = generateDeterministicTestGrid(
        scenarioId as FortunariumDevScenario
      );
      const core = evaluateSpinGridCore({
        grid: sandboxGrid,
        betMode: simBetMode,
        upgrades: roomState.upgrades,
        currentVoltage: displayedVoltage,
        round: roomState.round,
        allowMysteryEvents: false,
        enableJackpotRoll: scenarioId === 'jackpot' || scenarioId === 'pantalla_completa',
        forceJackpot: scenarioId === 'jackpot' || scenarioId === 'pantalla_completa',
      });

      const sandboxSpin: FortunariumSpinResult = {
        spinId: `sandbox_${Date.now()}`,
        stateVersion: roomState.stateVersion,
        playerId: localPlayerId,
        playerName: `${localPlayer?.name || 'Operador'} (Sandbox)`,
        initiatedByPlayerId: localPlayerId,
        triggerSource: 'button',
        betMode: simBetMode,
        spinCost: currentSpinCost,
        moneyBeforeSpin: roomState.money,
        moneyAfterSpinCost: Math.max(0, roomState.money - currentSpinCost),
        finalMoney: Math.max(
          0,
          roomState.money - currentSpinCost + core.grossPayout - core.penalties
        ),
        quotaProgressBefore: roomState.quotaProgress,
        finalQuotaProgress: roomState.quotaProgress,
        grid: sandboxGrid,
        winLines: core.winLines,
        specialEffects: core.specialEffects,
        winningCells: core.winningCells,
        hazardCells: core.hazardCells,
        grossPayout: core.grossPayout,
        jackpotPayout: core.jackpotPayout,
        penalties: core.penalties,
        netMoneyDelta: core.grossPayout - core.penalties - currentSpinCost,
        integrityDelta: core.integrityDelta,
        finalIntegrity: Math.max(
          0,
          Math.min(100, roomState.integrity + core.integrityDelta)
        ),
        voltageMultiplierUsed: core.voltageMultiplierUsed,
        voltageMultiplierAfter: core.voltageMultiplierAfter,
        keysGained: core.keysGained,
        finalKeys: roomState.keys + core.keysGained,
        extraSpinsGained: core.extraSpinsGained,
        isJackpot: core.isJackpot,
        summaryText: `[SANDBOX AISLADO] ${
          core.grossPayout > 0 ? `+${core.grossPayout} CR` : 'Sin premio'
        }`,
        timestamp: Date.now(),
      };

      setLocalSandboxSpinOverride(sandboxSpin);
    },
    [
      roomState.upgrades,
      simBetMode,
      displayedVoltage,
      roomState.round,
      roomState.stateVersion,
      localPlayerId,
      localPlayer?.name,
      currentSpinCost,
      roomState.money,
      roomState.quotaProgress,
      roomState.integrity,
      roomState.keys,
    ]
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
      {/* FULL-BLEED RETRO WORKSHOP & ARCADE ROOM BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,#1d4b58_0%,#112a36_54%,#08141c_100%)]" />
        {/* Subtle workshop pegboard / grid texture */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(rgba(217,164,65,0.22) 1.5px, transparent 1.5px), repeating-linear-gradient(90deg, rgba(20,55,68,0.35) 0px, rgba(20,55,68,0.35) 2px, transparent 2px, transparent 56px)',
            backgroundSize: '28px 28px, 56px 56px',
          }}
        />
        {/* Warm incandescent workshop lamp overhead glow */}
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[860px] h-[340px] rounded-full bg-[#e07a2e]/18 blur-[100px]" />
        <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-[#050b10] to-transparent" />
      </div>

      {/* GARAGE SHUTTER OPENING INTRO (Section 7: Plays once at start of match + between quotas) */}
      {showGarageIntro && (
        <FortunariumGarageIntro
          matchId={roomState.matchId}
          quotaInfo={nextQuotaPaperInfo}
          initialSlideDown={showInterQuotaGarageDoor}
          onComplete={() => {
            setIntroSeenMatchId(roomState.matchId);
            setLastSeenQuotaRound(roomState.round);
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
      {/* 1. COMPACT WORKSHOP UTILITY HEADER BAR (h-12)                         */}
      {/* ===================================================================== */}
      <header className="relative z-30 h-12 shrink-0 w-full bg-[#10252e] border-b-2 border-[#b98532] px-2.5 sm:px-4 flex items-center justify-between gap-2 shadow-[0_4px_14px_rgba(0,0,0,0.75)]">
        {/* Left Group: Exit, Title, Room Code, Quota Target */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => {
              fortunariumAudio.playButtonClick();
              setShowExitConfirmModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#261714] hover:bg-[#3d1c18] border-2 border-[#b98532]/80 hover:border-rose-400 text-[#f5deb3] hover:text-rose-200 text-xs font-bold transition-all cursor-pointer shrink-0 shadow-[0_2px_0_#140a08] active:translate-y-0.5"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#e89b3c]" />
            <span>SALIR</span>
          </button>

          <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#1b3c46] border border-[#b98532]/60 font-fortunarium text-sm text-[#f4d06f] tracking-wider -rotate-1 shadow-inner">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e05324]" />
            FORTUNARIUM MK-IV
          </span>

          <button
            type="button"
            onClick={handleCopyRoomCode}
            title="Copiar código de sala"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#091410] hover:bg-[#0f211b] border-2 border-[#8c6b32] text-xs font-mono font-black text-[#f4d06f] cursor-pointer shrink-0 tabular-nums shadow-inner"
          >
            <span className="text-[#88a89d] font-sans font-bold text-[10px]">SALA</span>
            <span className="tracking-wider">{roomState.roomCode}</span>
            {copiedCode ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3 text-[#d99b38]" />
            )}
          </button>

          <div className="px-2.5 py-1 rounded-md bg-[#2a1c11] border-2 border-[#b98532] text-xs font-mono font-black text-[#f7d97e] tabular-nums shrink-0 shadow-inner">
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
              className="px-2.5 py-1 rounded-lg bg-[#3b1736] hover:bg-[#521f4b] border-2 border-fuchsia-400/70 text-fuchsia-200 text-xs font-black flex items-center gap-1 cursor-pointer shadow-[0_2px_0_#1a0717]"
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
            className="px-2.5 py-1 rounded-lg bg-[#193842] hover:bg-[#224956] border-2 border-[#b98532] text-[#f5e6c4] text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_2px_0_#0a181d] active:translate-y-0.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#f4d06f]" />
            <span className="hidden sm:inline">MANUAL</span>
          </button>

          <button
            type="button"
            onClick={() => {
              fortunariumAudio.playButtonClick();
              setShowPrizeTableModal(true);
            }}
            className="px-2.5 py-1 rounded-lg bg-[#193842] hover:bg-[#224956] border-2 border-[#b98532] text-[#f5e6c4] text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_2px_0_#0a181d] active:translate-y-0.5"
          >
            <Trophy className="w-3.5 h-3.5 text-[#f4d06f]" />
            <span className="hidden sm:inline">PREMIOS</span>
          </button>

          <button
            type="button"
            onClick={() => {
              fortunariumAudio.playButtonClick();
              setShowWorkshopModal(true);
            }}
            className="px-2.5 py-1 rounded-lg bg-[#8c3b19] hover:bg-[#a8471f] border-2 border-[#f2b24c] text-[#fff3d6] text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_2px_0_#3d1607] active:translate-y-0.5"
          >
            <Wrench className="w-3.5 h-3.5 text-[#fbd37d]" />
            <span className="hidden sm:inline">TALLER</span>
            {displayedKeys > 0 && (
              <span className="px-1.5 py-0.2 rounded bg-[#f4d06f] text-stone-950 font-mono text-[10px] font-black tabular-nums">
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
            className="px-2.5 py-1 rounded-lg bg-[#193842] hover:bg-[#224956] border-2 border-[#b98532] text-[#f5e6c4] text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_2px_0_#0a181d] active:translate-y-0.5"
          >
            {isAudioMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-[#f4d06f]" />
            )}
            <span className="hidden md:inline">SONIDO</span>
          </button>

          <button
            type="button"
            onClick={() => {
              fortunariumAudio.playButtonClick();
              setShowTeamDrawer((v) => !v);
            }}
            className="px-2.5 py-1 rounded-lg bg-[#193842] hover:bg-[#224956] border-2 border-[#b98532] text-[#f5e6c4] text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_2px_0_#0a181d] active:translate-y-0.5"
          >
            <Users className="w-3.5 h-3.5 text-[#f4d06f]" />
            <span className="hidden md:inline">EQUIPO</span>
            <span className="font-mono text-[11px] text-[#f4d06f] tabular-nums">
              ({roomState.players.length})
            </span>
          </button>
        </div>
      </header>

      {/* FLOATING ERROR TOAST */}
      {errorMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-[#3b1216] border-2 border-[#e05324] text-amber-100 text-xs sm:text-sm font-bold shadow-2xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#f4d06f] shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* TRANSIENT QUOTA COMPLETED CELEBRATION BANNER (Fires once for 3s, never sticks) */}
      {showQuotaBanner && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 pointer-events-none animate-bounce">
          <div className="px-6 py-2.5 rounded-xl bg-[#164e38] border-3 border-[#f2b24c] shadow-[0_8px_0_#092419,0_0_36px_rgba(16,185,129,0.75)] text-center">
            <div className="text-lg sm:text-xl font-fortunarium text-[#f9e076] tracking-wider">
              ¡CUOTA {roomState.round} SUPERADA!
            </div>
            <div className="text-xs font-bold text-[#e6f5ed]">
              Podéis pulsar «SELLAR CUOTA» ahora o seguir arriesgando sin perder vuestro dinero
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. CENTRAL HAND-BUILT ARCADE CABINET STAGE + PAPER OVERLAY            */}
      {/* ===================================================================== */}
      <main className="relative z-10 flex-1 min-h-0 w-full flex items-center justify-center px-2 sm:px-6 py-2 overflow-hidden">
        {/* Centered Machine Anchor Wrapper (Visual center = 50vw; Paper note is absolute outside left) */}
        <div
          className={`relative w-full max-w-[930px] h-full max-h-[810px] mx-auto flex items-center justify-center transition-transform duration-150 ${
            machineShake ? '-translate-y-0.5 scale-[1.008]' : ''
          }`}
        >
          {/* LEFT-SIDE PHYSICAL TAPED PAPER OVERLAY (Sections 1–4: NEVER shifts machine centering) */}
          <FortunariumPaperBoard
            activeModifiers={roomState.activeModifiers || []}
            installedUpgradesCount={installedUpgrades.length}
            effectiveJackpotChance={effectiveJackpotChance}
            onOpenWorkshop={() => setShowWorkshopModal(true)}
          />

          {/* PROTRUDING SIDE MECHANICAL HARDWARE EARS / VENT GRILLES & CABLES (Asymmetrical Silhouette) */}
          <div
            aria-hidden="true"
            className="hidden md:flex pointer-events-none absolute -left-3.5 bottom-24 w-4 h-28 rounded-l-lg bg-gradient-to-b from-[#3d4c52] via-[#273338] to-[#1a2226] border-y-2 border-l-2 border-[#8c6b32] flex-col justify-evenly items-center py-2 shadow-lg z-0"
          >
            <span className="w-2 h-1 bg-black/70 rounded-full" />
            <span className="w-2 h-1 bg-black/70 rounded-full" />
            <span className="w-2 h-1 bg-black/70 rounded-full" />
            <span className="w-2 h-1 bg-black/70 rounded-full" />
          </div>
          <div
            aria-hidden="true"
            className="hidden md:flex pointer-events-none absolute -right-4 top-16 w-4 h-24 rounded-r-lg bg-gradient-to-b from-[#6e2b1c] via-[#4d1d12] to-[#2e100a] border-y-2 border-r-2 border-[#b98532] flex-col items-center justify-between py-1.5 shadow-lg z-0"
          >
            <span className="w-2 h-2 rounded-full bg-[#e05324] animate-pulse" />
            <span className="w-1.5 h-10 rounded-full bg-black/60" />
            <span className="w-2 h-2 rounded-full bg-[#8c6b32]" />
          </div>

          {/* MAIN RETRO PETROL-BLUE & AGED-BRASS ELECTROMECHANICAL CABINET */}
          <div
            className={`fort-cabinet-metal relative w-full h-full rounded-tl-[34px] rounded-tr-[26px] rounded-bl-[26px] rounded-br-[36px] border-[5px] p-3 sm:p-4 flex flex-col justify-between gap-2 overflow-visible transition-all duration-300 ${
              roomState.phase === 'DEFEAT'
                ? 'border-stone-700 brightness-75 saturate-50'
                : finalOutcomeBanner?.tier === 'JACKPOT'
                ? 'border-[#f7d97e] shadow-[0_0_90px_rgba(245,158,11,0.55),inset_0_2px_16px_rgba(255,255,255,0.4)]'
                : integrityPct <= 30
                ? 'border-[#d94826] shadow-[0_25px_70px_rgba(225,29,72,0.45),inset_0_2px_12px_rgba(255,255,255,0.2)]'
                : 'border-[#b98532] animate-fort-idle-hum'
            }`}
          >
            {/* Corner Slotted Rivets & Welded Repair Patch Plate (Hand-Built Workshop Details) */}
            <span className="pointer-events-none absolute top-2.5 left-2.5 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-[#e8c27a] to-[#785118] border border-[#2b1b06] shadow flex items-center justify-center">
              <span className="w-2 h-[1.5px] bg-[#2b1b06] rotate-45" />
            </span>
            <span className="pointer-events-none absolute top-2.5 right-2.5 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-[#cbd5e1] to-[#475569] border border-slate-950 shadow flex items-center justify-center">
              <span className="w-2 h-[1.5px] bg-slate-950 -rotate-12" />
            </span>
            <span className="pointer-events-none absolute bottom-2.5 left-2.5 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-[#cbd5e1] to-[#475569] border border-slate-950 shadow flex items-center justify-center">
              <span className="w-2 h-[1.5px] bg-slate-950 rotate-12" />
            </span>
            <span className="pointer-events-none absolute bottom-2.5 right-2.5 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-[#e8c27a] to-[#785118] border border-[#2b1b06] shadow flex items-center justify-center">
              <span className="w-2 h-[1.5px] bg-[#2b1b06] -rotate-45" />
            </span>

            {/* Subtle Patched Metal Plate & Serial Tag on Upper Right Bezel */}
            <div
              aria-hidden="true"
              className="pointer-events-none hidden sm:flex absolute -top-2 right-12 z-20 px-2 py-0.5 rounded-sm bg-[#8c6b32] border border-[#38260a] text-[8px] text-[#1c1204] tracking-widest uppercase shadow rotate-[1.2deg] items-center gap-1"
            >
              <span>SERIE Nº 79-B · TALLER CENTRAL</span>
            </div>

            {/* Inner Recessed Steel Seam */}
            <div className="pointer-events-none absolute inset-1.5 rounded-[26px] border-2 border-[#091c22]/80" />

            {/* --------------------------------------------------------------- */}
            {/* CABINET SECTION A: PHYSICAL MARQUEE BOX & CRT SCOREBOARD        */}
            {/* --------------------------------------------------------------- */}
            <div className="relative z-10 rounded-2xl bg-gradient-to-b from-[#401b13] via-[#2b120d] to-[#1a0a07] border-[3px] border-[#b98532] px-3 py-2 shadow-[0_6px_16px_rgba(0,0,0,0.7),inset_0_2px_0_rgba(255,222,158,0.25)] flex flex-col gap-1.5 shrink-0">
              {/* Row 1: Physical Incandescent Bulb Strip + Bolted FORTUNARIUM Sign + Turn Indicator */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  {/* Warm Carnival / Arcade Bulbs */}
                  <div className="flex items-center gap-1.5 bg-[#170906] px-2 py-1 rounded-full border border-[#785118]">
                    {[0, 1, 2].map((b) => (
                      <span
                        key={b}
                        className={`w-2.5 h-2.5 rounded-full border border-[#fff3d1]/70 ${
                          isAnyReelSpinning
                            ? 'bg-[#fde047] shadow-[0_0_10px_#fde047] animate-ping'
                            : integrityPct <= 30
                            ? 'bg-[#ef4444] shadow-[0_0_8px_#ef4444] animate-fort-spark'
                            : 'bg-[#f59e0b] shadow-[0_0_8px_#f59e0b] animate-fort-bulb'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Physical Bolted Marquee Nameplate */}
                  <div className="relative px-3 py-0.5 rounded-lg bg-gradient-to-b from-[#f3ead3] to-[#d5c295] border-2 border-[#5c3d12] shadow-[0_3px_0_#241504] -rotate-[0.6deg] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#473010]" />
                    <h1 className="font-fortunarium text-lg sm:text-2xl md:text-3xl text-[#7c2212] tracking-wider drop-shadow-[0_1px_0_rgba(255,255,255,0.75)] leading-none">
                      FORTUNARIUM
                    </h1>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#473010]" />
                  </div>
                </div>

                {/* Active Turn / Installed Parts Physical Tags */}
                <div className="flex items-center gap-2">
                  {installedUpgrades.length > 0 && (
                    <div
                      onClick={() => setShowWorkshopModal(true)}
                      title="Ver mejoras instaladas en la máquina"
                      className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1d3942] border-2 border-[#b98532] cursor-pointer hover:bg-[#254954] shadow-[0_2px_0_#0a161a]"
                    >
                      <Wrench className="w-3.5 h-3.5 text-[#f4d06f] shrink-0" />
                      <span className="text-[11px] font-bold text-[#f5e6c4] tabular-nums">
                        {installedUpgrades.length} PIEZAS
                      </span>
                    </div>
                  )}

                  <div className="px-2.5 py-1 rounded-lg bg-[#12262e] border-2 border-[#8c6b32] flex items-center gap-2 shadow-inner">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/50"
                      style={{ backgroundColor: currentTurnPlayer?.color || '#fbbf24' }}
                    />
                    <span className="text-xs font-bold text-[#f3ead3]">
                      {roomState.config.turnMode === 'free'
                        ? 'PALANCA LIBRE'
                        : isMyTurn
                        ? '¡TU TURNO!'
                        : `TURNO: ${currentTurnPlayer?.name || 'Operador'}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 2: INSET AMBER/GREEN CRT SCOREBOARD & PATTERN ACCUMULATOR (Section 8) */}
              <div className="fort-crt-display fort-dot-matrix min-h-[60px] sm:min-h-[68px] rounded-xl border-[3px] border-[#6e5223] px-3.5 py-2 flex items-center justify-between gap-3 overflow-hidden">
                {isAnyReelSpinning ? (
                  <div className="w-full flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Sparkles className="w-5 h-5 text-[#f7d97e] animate-spin shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#e09f3e]">
                          BOBINAS EN MARCHA · COSTE -{spinEvent?.spinCost ?? currentSpinCost} CR
                        </div>
                        <div className="font-fortunarium text-sm sm:text-lg text-[#fef08a] tracking-wide truncate">
                          GIRANDO RODILLOS ({spinEvent?.playerName || localPlayer?.name})...
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0 pl-2 border-l-2 border-[#b98532]/40">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#a3b899]">
                        CONTADOR CRT
                      </span>
                      <span className="font-mono font-black text-xl sm:text-3xl text-[#84a98c] tabular-nums leading-none">
                        +0 CR
                      </span>
                    </div>
                  </div>
                ) : activeRevealStep ? (
                  <div className="w-full flex items-center justify-between gap-3">
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-2 py-0.5 rounded bg-[#f4d06f] text-stone-950 font-mono text-xs font-black tabular-nums shrink-0 shadow">
                          {activeRevealStepIndex}/{totalRevealSteps}
                        </span>
                        <span
                          className={`font-fortunarium text-sm sm:text-lg md:text-xl tracking-wide truncate drop-shadow ${
                            activeRevealStep.variant === 'hazard'
                              ? 'text-rose-400'
                              : activeRevealStep.variant === 'jackpot'
                              ? 'text-[#fde047]'
                              : 'text-[#f4d06f]'
                          }`}
                        >
                          {activeRevealStep.title}
                        </span>
                        {activeRevealStep.amount !== 0 && (
                          <span
                            className={`px-2 py-0.5 rounded font-mono font-black text-xs sm:text-sm tabular-nums shrink-0 ${
                              activeRevealStep.amount > 0
                                ? 'bg-emerald-950/90 border border-emerald-400/70 text-emerald-300'
                                : 'bg-rose-950/90 border border-rose-400/70 text-rose-300'
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
                                ? 'bg-[#b98532]/35 border-[#fde047] text-[#fef08a]'
                                : 'bg-[#0e1c16] border-[#3a5a40] text-[#a3b18a]'
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

                    {/* Large Animated CRT Win Accumulator Counter */}
                    <div className="flex flex-col items-end shrink-0 pl-2 border-l-2 border-[#b98532]/40">
                      <span className="text-[9px] sm:text-[10px] font-mono font-black uppercase tracking-widest text-[#f4d06f]">
                        {spinEvent?.isJackpot ? 'JACKPOT ACUMULADO' : 'GANANCIA ACUMULADA'}
                      </span>
                      <span
                        className={`font-mono font-black text-2xl sm:text-3xl md:text-4xl tabular-nums leading-none transition-transform duration-150 ${
                          winCountUpPulse
                            ? 'scale-115 text-[#fde047] drop-shadow-[0_0_14px_rgba(250,204,21,0.95)]'
                            : displayedAccumulatedWin > 0
                            ? 'scale-100 text-[#7ae582] drop-shadow-[0_0_10px_rgba(122,229,130,0.65)]'
                            : 'scale-100 text-[#84a98c]'
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
                            ? 'text-[#fde047] drop-shadow-[0_0_10px_rgba(250,204,21,0.7)]'
                            : 'text-[#cbd5e1]'
                        }`}
                      >
                        {finalOutcomeBanner.title}
                      </div>
                      <div className="font-mono font-bold text-[11px] sm:text-xs text-[#e9c46a] truncate tabular-nums">
                        {finalOutcomeBanner.subtitle}
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0 pl-2 border-l-2 border-[#b98532]/40">
                      <span className="text-[9px] sm:text-[10px] font-mono font-black uppercase tracking-widest text-[#f4d06f]">
                        GANANCIA DE LA TIRADA
                      </span>
                      <span
                        className={`font-mono font-black text-2xl sm:text-3xl md:text-4xl tabular-nums leading-none ${
                          finalOutcomeBanner.grossPayout > 0
                            ? 'text-[#7ae582] drop-shadow-[0_0_12px_rgba(122,229,130,0.8)]'
                            : 'text-[#84a98c]'
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
                      <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#e9c46a]">
                        MONITOR CRT DE PREMIOS Y PATRONES
                      </div>
                      <div className="text-xs sm:text-sm font-bold text-[#e2ece9] truncate">
                        {roomState.actionLog[0]?.text || 'LISTO PARA ACCIONAR TAMBORES'}
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0 pl-2 border-l-2 border-[#b98532]/40">
                      <span className="text-[9px] sm:text-[10px] font-mono font-black uppercase tracking-widest text-[#f4d06f]">
                        GANANCIA TIRADA
                      </span>
                      <span
                        className={`font-mono font-black text-xl sm:text-2xl md:text-3xl tabular-nums leading-none ${
                          (displayedLastSpinResult?.grossPayout || 0) > 0
                            ? 'text-[#7ae582]'
                            : 'text-[#84a98c]'
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
            {/* CABINET SECTION B: 3 ELECTROMECHANICAL GAUGES (SECTIONS 9–11)   */}
            {/* --------------------------------------------------------------- */}
            <div className="relative z-20 grid grid-cols-3 gap-2 sm:gap-3 shrink-0">
              {/* Screen 1: QUOTA AS A PHYSICAL ELECTROMECHANICAL PROGRESS GAUGE + HOVER TOOLTIP */}
              <div className="fort-crt-display group relative rounded-xl border-[3px] border-[#8c6b32] p-2.5 sm:p-3 flex flex-col justify-between gap-1.5 cursor-help">
                {/* Tiny corner screw heads */}
                <span className="pointer-events-none absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-[#785118]" />
                <span className="pointer-events-none absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#785118]" />

                <div className="flex items-center justify-between gap-1">
                  <span className="px-1.5 py-0.2 rounded-sm bg-[#2b1d0e] border border-[#b98532] text-[10px] sm:text-xs font-fortunarium tracking-wider text-[#f4d06f]">
                    {quotaTargetLabel}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-black tabular-nums ${
                      quotaMet
                        ? 'bg-emerald-950 text-[#7ae582] border border-emerald-400/60'
                        : 'bg-[#2a1c0e] text-[#f4d06f] border border-[#8c6b32]'
                    }`}
                  >
                    {quotaPct}%
                  </span>
                </div>

                {/* Physical Segmented LED / Electromechanical Gauge Bar */}
                <div className="relative w-full h-4 rounded bg-[#050a08] p-0.5 border-2 border-[#6e5223] shadow-[inset_0_2px_6px_rgba(0,0,0,0.95)] overflow-hidden">
                  <div
                    className={`h-full rounded-xs transition-all duration-300 ${
                      quotaMet
                        ? 'bg-gradient-to-r from-[#2b9348] via-[#55a630] to-[#80b918] shadow-[0_0_12px_rgba(128,185,24,0.85)]'
                        : 'bg-gradient-to-r from-[#c2410c] via-[#d97706] to-[#facc15] shadow-[0_0_10px_rgba(234,179,8,0.65)]'
                    }`}
                    style={{ width: `${quotaPct}%` }}
                  />
                  {/* Segmented LED cell dividers */}
                  <div
                    className="pointer-events-none absolute inset-0 opacity-55"
                    style={{
                      backgroundImage:
                        'repeating-linear-gradient(90deg, transparent 0px, transparent 9px, rgba(5,10,8,0.92) 9px, rgba(5,10,8,0.92) 12px)',
                    }}
                  />
                </div>

                <div className="flex items-center justify-between gap-1">
                  <span className="font-mono font-bold text-[11px] sm:text-xs text-[#d8e2dc] tabular-nums">
                    {displayedMoney} / {roomState.quota} CR
                  </span>

                  {quotaMet && !isBusy && roomState.phase === 'PLAYING' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fortunariumAudio.playQuotaStamp();
                        setQuotaSealingStampActive(true);
                        setTimeout(() => {
                          setQuotaSealingStampActive(false);
                          onPayQuotaEarly();
                        }, 750);
                      }}
                      className="px-2 py-0.5 rounded bg-[#55a630] hover:bg-[#80b918] border border-[#d9f99d] text-stone-950 font-fortunarium text-[10px] sm:text-[11px] tracking-wider shadow-[0_2px_0_#1e3a10] cursor-pointer animate-pulse shrink-0"
                    >
                      SELLAR CUOTA
                    </button>
                  )}
                </div>

                {/* QUOTA HOVER TOOLTIP */}
                <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute left-0 top-[calc(100%+8px)] w-64 z-50 p-3 rounded-xl bg-[#112229] border-2 border-[#b98532] shadow-2xl text-left">
                  <div className="font-fortunarium text-xs text-[#f4d06f] tracking-wider uppercase mb-1">
                    MEDIDOR DE CUOTA
                  </div>
                  <p className="text-[11px] text-[#e2ece9] leading-snug">
                    Debéis alcanzar esta cantidad de créditos para superar el objetivo actual.
                  </p>
                  <p className="text-[10px] text-[#7ae582] font-bold mt-1">
                    El dinero NO desaparece al sellar la cuota.
                  </p>
                  <div className="mt-2 pt-1.5 border-t border-white/15 font-mono text-[10px] space-y-0.5 tabular-nums">
                    <div className="flex justify-between">
                      <span className="text-[#94a3b8]">Actual:</span>
                      <span className="text-white font-bold">{displayedMoney} CR</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#94a3b8]">Objetivo:</span>
                      <span className="text-[#f4d06f] font-bold">{roomState.quota} CR</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#94a3b8]">Faltan:</span>
                      <span className="text-rose-300 font-bold">
                        {Math.max(0, roomState.quota - displayedMoney)} CR
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Screen 2: CRÉDITOS + GANANCIA DE LA ÚLTIMA TIRADA (CRT Counter) */}
              <div className="fort-crt-display fort-dot-matrix relative rounded-xl border-[3px] border-[#8c6b32] p-2.5 sm:p-3 flex flex-col justify-between gap-1">
                <span className="pointer-events-none absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-[#785118]" />
                <span className="pointer-events-none absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#785118]" />

                <div className="flex items-center justify-between gap-1">
                  <span className="px-1.5 py-0.2 rounded-sm bg-[#2b1d0e] border border-[#b98532] text-[10px] sm:text-xs font-fortunarium tracking-wider text-[#f4d06f]">
                    CRÉDITOS
                  </span>
                  <span className="text-[10px] font-mono font-bold text-[#e9c46a] tabular-nums">
                    {!displayedLastSpinResult ? (
                      <>
                        ÚLTIMA:{' '}
                        <strong className="text-[#84a98c]">+0 CR</strong>
                      </>
                    ) : displayedLastSpinResult.netMoneyDelta >= 0 ? (
                      <>
                        NETO:{' '}
                        <strong className="text-[#7ae582]">
                          +{displayedLastSpinResult.netMoneyDelta} CR
                        </strong>
                      </>
                    ) : (
                      <>
                        NETO:{' '}
                        <strong className="text-rose-400">
                          {displayedLastSpinResult.netMoneyDelta} CR
                        </strong>
                      </>
                    )}
                  </span>
                </div>

                <div className="flex items-baseline justify-between gap-2">
                  <div className="font-mono font-black text-xl sm:text-3xl text-[#f7d97e] tabular-nums tracking-tight leading-none drop-shadow-[0_0_8px_rgba(247,217,126,0.35)]">
                    {displayedMoney} <span className="text-xs sm:text-base text-[#e9c46a]">CR</span>
                  </div>
                  {displayedLastSpinResult && (
                    <div
                      className={`font-mono font-black text-sm sm:text-lg tabular-nums leading-none ${
                        displayedLastSpinResult.netMoneyDelta > 0
                          ? 'text-[#7ae582]'
                          : displayedLastSpinResult.netMoneyDelta < 0
                          ? 'text-rose-400'
                          : 'text-[#84a98c]'
                      }`}
                    >
                      {displayedLastSpinResult.netMoneyDelta >= 0
                        ? `+${displayedLastSpinResult.netMoneyDelta} CR`
                        : `${displayedLastSpinResult.netMoneyDelta} CR`}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-1.5 pt-0.5 border-t border-[#3a5a40]/60 text-[10px] sm:text-[11px] font-mono font-black tabular-nums">
                  <span className="text-[#90e0ef] flex items-center gap-1">
                    <Zap className="w-3 h-3 text-[#48cae4]" />
                    VOLT x{displayedVoltage.toFixed(2)}
                  </span>
                  <span className="text-[#f4d06f] flex items-center gap-1">
                    <Key className="w-3 h-3 text-[#e89b3c]" />
                    {displayedKeys} 🔑
                  </span>
                </div>
              </div>

              {/* Screen 3: INTEGRITY AS A MECHANICAL BOILER/CHASSIS GAUGE + HOVER TOOLTIP */}
              <div className="fort-crt-display group relative rounded-xl border-[3px] border-[#8c6b32] p-2.5 sm:p-3 flex flex-col justify-between gap-1.5 cursor-help">
                <span className="pointer-events-none absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-[#785118]" />
                <span className="pointer-events-none absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#785118]" />

                <div className="flex items-center justify-between gap-1">
                  <span className="px-1.5 py-0.2 rounded-sm bg-[#2b1d0e] border border-[#b98532] text-[10px] sm:text-xs font-fortunarium tracking-wider text-[#f4d06f]">
                    INTEGRIDAD
                  </span>
                  <span
                    className={`text-xs font-mono font-black tabular-nums ${
                      integrityPct < 35
                        ? 'text-rose-400 animate-pulse'
                        : integrityPct <= 70
                        ? 'text-[#f4d06f]'
                        : 'text-[#7ae582]'
                    }`}
                  >
                    {displayedIntegrity}%
                  </span>
                </div>

                {/* Physical Illuminated Segmented Integrity Bar */}
                <div className="relative w-full h-4 rounded bg-[#050a08] p-0.5 border-2 border-[#6e5223] shadow-[inset_0_2px_6px_rgba(0,0,0,0.95)] overflow-hidden">
                  <div
                    className={`h-full rounded-xs transition-all duration-300 ${
                      integrityPct < 35
                        ? 'bg-gradient-to-r from-[#991b1b] via-[#dc2626] to-[#f87171] shadow-[0_0_12px_rgba(239,68,68,0.85)]'
                        : integrityPct <= 70
                        ? 'bg-gradient-to-r from-[#b45309] via-[#d97706] to-[#facc15]'
                        : 'bg-gradient-to-r from-[#2b9348] via-[#55a630] to-[#80b918]'
                    }`}
                    style={{ width: `${integrityPct}%` }}
                  />
                  <div
                    className="pointer-events-none absolute inset-0 opacity-55"
                    style={{
                      backgroundImage:
                        'repeating-linear-gradient(90deg, transparent 0px, transparent 9px, rgba(5,10,8,0.92) 9px, rgba(5,10,8,0.92) 12px)',
                    }}
                  />
                </div>

                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`font-mono font-bold text-[10px] sm:text-[11px] uppercase ${
                      integrityPct < 35
                        ? 'text-rose-300'
                        : integrityPct <= 70
                        ? 'text-[#f4d06f]'
                        : 'text-[#7ae582]'
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
                      className="px-2 py-0.5 rounded bg-[#1b4332] hover:bg-[#2d6a4f] disabled:opacity-40 border border-[#7ae582]/60 text-[#d8f3dc] font-mono font-black text-[10px] cursor-pointer disabled:cursor-not-allowed shrink-0 tabular-nums"
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

                {/* INTEGRITY HOVER TOOLTIP */}
                <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute right-0 top-[calc(100%+8px)] w-64 z-50 p-3 rounded-xl bg-[#112229] border-2 border-[#b98532] shadow-2xl text-left">
                  <div className="font-fortunarium text-xs text-[#f4d06f] tracking-wider uppercase mb-1">
                    MANÓMETRO DE INTEGRIDAD ({displayedIntegrity}%)
                  </div>
                  <p className="text-[11px] text-[#e2ece9] leading-snug">
                    Estado físico del chasis. Si cae a 0%, la máquina revienta y termina la partida.
                  </p>
                  <div className="mt-2 pt-1.5 border-t border-white/15 text-[10px] space-y-1">
                    <div>
                      <span className="text-rose-300 font-bold">Causas de daño:</span>{' '}
                      <span className="text-slate-300">
                        desgaste por tirada, bombas y sobrecargas.
                      </span>
                    </div>
                    <div>
                      <span className="text-[#7ae582] font-bold">Cómo reparar:</span>{' '}
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
              {/* Bolted Aged-Brass & Workshop Steel Reel Housing (`5 columns × 3 rows`) */}
              <div className="relative flex-1 min-h-0 rounded-[24px] bg-gradient-to-b from-[#b98532] via-[#8c6223] to-[#5c3d12] border-2 border-[#382409] p-2 sm:p-2.5 shadow-[0_10px_28px_rgba(0,0,0,0.8),inset_0_2px_0_rgba(255,235,180,0.4)] flex flex-col">
                {/* Tiny corner bolts on reel bezel */}
                <span className="pointer-events-none absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-[#382409]" />
                <span className="pointer-events-none absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#382409]" />
                <span className="pointer-events-none absolute bottom-1.5 left-1.5 w-2 h-2 rounded-full bg-[#382409]" />
                <span className="pointer-events-none absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full bg-[#382409]" />

                <div className="relative flex-1 min-h-0 rounded-[18px] bg-[#14110f] border-4 border-[#2b1d12] p-2 sm:p-3 grid grid-cols-5 gap-2 sm:gap-3 overflow-hidden shadow-[inset_0_12px_28px_rgba(0,0,0,0.92)]">
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
                        className="relative h-full w-full rounded-xl bg-gradient-to-b from-[#e4d5b7] via-[#f7eed7] to-[#d6c39e] border-2 border-[#6e4e1e] overflow-hidden shadow-[inset_0_10px_20px_rgba(0,0,0,0.42)]"
                      >
                        {/* Top & Bottom Cylindrical Mechanical Drum Shading */}
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-black/50 via-black/15 to-transparent z-20" />
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/50 via-black/15 to-transparent z-20" />

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
                                      ? 'bg-amber-400/20 ring-2 ring-inset ring-amber-300/80 shadow-[inset_0_0_18px_rgba(250,204,21,0.45)] z-10 rounded-lg'
                                      : isSpecialCell
                                      ? 'bg-cyan-400/20 ring-2 ring-inset ring-cyan-300/80 shadow-[inset_0_0_16px_rgba(34,211,238,0.45)] z-10 rounded-lg'
                                      : isHazardCell
                                      ? 'bg-rose-500/25 ring-2 ring-inset ring-rose-500/80 shadow-[inset_0_0_18px_rgba(244,63,94,0.5)] z-10 rounded-lg'
                                      : isDimmedCell
                                      ? 'opacity-35 grayscale-[0.4] scale-[0.96]'
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
                    const isFullGrid =
                      activeRevealStep.patternType === 'PANTALLA_COMPLETA' ||
                      activeRevealStep.cells.length === 15;
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

                          {/* Clean, Elegant Geometric Overlays (Zero intrusive dark circles over symbols) */}
                          {isFullGrid ? (
                            <>
                              <rect
                                x="12"
                                y="12"
                                width="476"
                                height="276"
                                rx="16"
                                fill="rgba(253,224,71,0.08)"
                                stroke={strokeColor}
                                strokeWidth="4"
                                filter="url(#fortunariumPatternGlow)"
                              />
                              <path
                                d="M 28 12 L 12 12 L 12 28 M 472 12 L 488 12 L 488 28 M 12 272 L 12 288 L 28 288 M 488 272 L 488 288 L 472 288"
                                stroke="#fef08a"
                                strokeWidth="3.5"
                                fill="none"
                              />
                            </>
                          ) : isTriangle ? (
                            <polygon
                              points={
                                activeRevealStep.patternType === 'TRIANGULO'
                                  ? '250,45 455,255 45,255'
                                  : '45,45 455,45 250,255'
                              }
                              fill="rgba(253,224,71,0.07)"
                              stroke={strokeColor}
                              strokeWidth="4"
                              strokeLinejoin="round"
                              filter="url(#fortunariumPatternGlow)"
                            />
                          ) : isXPattern ? (
                            <>
                              <polyline
                                points="150,50 250,150 350,250"
                                fill="none"
                                stroke={strokeColor}
                                strokeWidth="4.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                filter="url(#fortunariumPatternGlow)"
                              />
                              <polyline
                                points="350,50 250,150 150,250"
                                fill="none"
                                stroke={strokeColor}
                                strokeWidth="4.5"
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
                                strokeWidth="4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                filter="url(#fortunariumPatternGlow)"
                              />
                            )
                          )}
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

                {/* PART G: CENTRAL CELEBRATION FOR BIG WINS, HUGE WINS, AND JACKPOT */}
                {finalOutcomeBanner &&
                  (finalOutcomeBanner.tier === 'BIG' ||
                    finalOutcomeBanner.tier === 'HUGE' ||
                    finalOutcomeBanner.tier === 'JACKPOT') && (
                    <div className="pointer-events-none absolute inset-0 z-35 flex flex-col items-center justify-center p-4">
                      {/* Golden / Emerald radial ambient burst */}
                      <div
                        className="absolute inset-0 rounded-2xl transition-opacity duration-300"
                        style={{
                          background:
                            finalOutcomeBanner.tier === 'JACKPOT'
                              ? 'radial-gradient(circle at 50% 50%, rgba(251,191,36,0.4) 0%, rgba(217,119,6,0.2) 45%, rgba(0,0,0,0.7) 85%)'
                              : finalOutcomeBanner.tier === 'HUGE'
                              ? 'radial-gradient(circle at 50% 50%, rgba(34,197,94,0.35) 0%, rgba(16,185,129,0.18) 45%, rgba(0,0,0,0.6) 85%)'
                              : 'radial-gradient(circle at 50% 50%, rgba(250,204,21,0.28) 0%, rgba(0,0,0,0.5) 75%)',
                        }}
                      />

                      {/* Central Celebration Plaque */}
                      <div className="relative px-6 py-4 sm:px-8 sm:py-5 rounded-2xl bg-gradient-to-b from-[#1c222c]/98 to-[#0b0e14]/98 border-[3px] border-amber-400 shadow-[0_16px_40px_rgba(0,0,0,0.95),0_0_35px_rgba(245,158,11,0.55)] flex flex-col items-center text-center max-w-sm sm:max-w-md animate-fort-pop">
                        <span className="absolute top-2 left-2 w-2 h-2 rounded-full bg-amber-400 border border-black" />
                        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 border border-black" />
                        <span className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-amber-400 border border-black" />
                        <span className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-amber-400 border border-black" />

                        <div className="text-[10px] sm:text-xs font-mono font-black uppercase tracking-[0.25em] text-amber-300 mb-1 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                          {finalOutcomeBanner.tier === 'JACKPOT'
                            ? '¡JACKPOT FORTUNARIUM!'
                            : finalOutcomeBanner.tier === 'HUGE'
                            ? '¡PREMIO MASIVO!'
                            : '¡GRAN PREMIO!'}
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                        </div>

                        <div className="font-mono font-black text-3xl sm:text-5xl text-[#7ae582] tabular-nums tracking-tight drop-shadow-[0_0_16px_rgba(122,229,130,0.95)] leading-none my-1">
                          +{finalOutcomeBanner.grossPayout} <span className="text-lg sm:text-2xl text-amber-300">CR</span>
                        </div>

                        <div className="text-xs sm:text-sm font-fortunarium text-amber-100 tracking-wide mt-1 drop-shadow">
                          {finalOutcomeBanner.title}
                        </div>
                        <div className="text-[10px] sm:text-xs font-mono text-amber-300/80 mt-0.5">
                          {finalOutcomeBanner.subtitle}
                        </div>
                      </div>
                    </div>
                  )}

                {/* PART H: CUOTA SELLADA MECHANICAL STAMP OVERLAY */}
                {quotaSealingStampActive && (
                  <div className="pointer-events-none absolute inset-0 z-40 flex flex-col items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fort-pop">
                    <div className="relative px-7 py-5 sm:px-9 sm:py-6 rounded-2xl bg-gradient-to-b from-[#251811] via-[#1a110a] to-[#0e0906] border-[4px] border-[#d97706] shadow-[0_20px_50px_rgba(0,0,0,0.95),0_0_40px_rgba(217,119,6,0.6)] flex flex-col items-center text-center max-w-sm sm:max-w-md">
                      <span className="absolute top-2 left-2 w-2.5 h-2.5 rounded-full bg-[#78350f] border border-black" />
                      <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#78350f] border border-black" />
                      <span className="absolute bottom-2 left-2 w-2.5 h-2.5 rounded-full bg-[#78350f] border border-black" />
                      <span className="absolute bottom-2 right-2 w-2.5 h-2.5 rounded-full bg-[#78350f] border border-black" />

                      <div className="inline-block px-4 py-1.5 rounded-lg bg-rose-950/90 border-2 border-rose-500 text-rose-200 font-fortunarium text-lg sm:text-2xl tracking-[0.2em] uppercase -rotate-2 shadow-[0_4px_14px_rgba(225,29,72,0.65)] mb-3">
                        ★ CUOTA SELLADA ★
                      </div>

                      <div className="w-full divide-y divide-amber-900/40 text-xs font-mono">
                        <div className="py-1 flex justify-between text-amber-200">
                          <span>Cuota Superada:</span>
                          <span className="font-black text-emerald-400">Cuota {roomState.round} ({roomState.quota} CR) ✓</span>
                        </div>
                        <div className="py-1 flex justify-between text-amber-200">
                          <span>Caja Conservada:</span>
                          <span className="font-black text-amber-300 tabular-nums">{displayedMoney} CR (100% Caja)</span>
                        </div>
                        <div className="py-1 flex justify-between text-amber-200">
                          <span>Integridad Chasis:</span>
                          <span className="font-black text-[#7ae582] tabular-nums">{displayedIntegrity}% / {roomState.maxIntegrity}%</span>
                        </div>
                        <div className="py-1 flex justify-between text-amber-200">
                          <span>Estado Operativo:</span>
                          <span className="font-black text-sky-300">Pasando a Taller Mecánico</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ============================================================= */}
              {/* RIGHT-SIDE HEAVY MECHANICAL LEVER HOUSING (SECTION 14)        */}
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
                className={`relative w-14 sm:w-18 md:w-20 rounded-2xl bg-gradient-to-b from-[#2b383d] via-[#1c262b] to-[#11181b] border-[3px] border-[#8c6b32] p-2 flex flex-col items-center justify-between shadow-[0_10px_24px_rgba(0,0,0,0.85),inset_0_2px_0_rgba(255,255,255,0.15)] touch-none select-none transition-colors ${
                  canSpin
                    ? 'cursor-grab active:cursor-grabbing hover:border-[#f4d06f]'
                    : 'opacity-55 cursor-not-allowed'
                }`}
              >
                {/* Bolted Metal Label */}
                <span className="px-1.5 py-0.5 rounded-sm bg-[#2b1d0e] border border-[#8c6b32] text-[8px] sm:text-[9px] font-fortunarium tracking-wider text-[#f4d06f] text-center leading-tight">
                  PALANCA
                </span>

                {/* Vertical Travel Track & 68% Activation Threshold Marker */}
                <div className="relative flex-1 w-full flex items-center justify-center my-2">
                  {/* Recessed Cast-Iron Slot Track with Wear Marks */}
                  <div className="relative w-4 h-full rounded-full bg-gradient-to-r from-[#070a0c] via-[#182024] to-[#070a0c] border-2 border-[#5c4722] shadow-[inset_0_4px_10px_rgba(0,0,0,0.95)] overflow-hidden">
                    {/* Pull Fill Bar */}
                    <div
                      style={{ height: `${Math.round(leverProgress * 100)}%` }}
                      className={`w-full transition-colors ${
                        leverProgress >= LEVER_ACTIVATION_THRESHOLD
                          ? 'bg-gradient-to-b from-[#f4d06f] to-[#55a630]'
                          : 'bg-gradient-to-b from-[#d97706]/70 to-[#e05324]/90'
                      }`}
                    />
                    {/* 68% Mechanical Engage Line */}
                    <div
                      style={{ top: `${LEVER_ACTIVATION_THRESHOLD * 100}%` }}
                      className="absolute inset-x-0 h-0.5 bg-[#fde047]"
                    />
                  </div>

                  {/* Industrial Bakelite / Painted Arcade Ball Knob */}
                  <div
                    style={{
                      top: `calc(${leverProgress * 76}% + 4px)`,
                      transition: isDraggingLever
                        ? 'none'
                        : 'top 280ms cubic-bezier(0.34, 1.56, 0.64, 1), transform 280ms ease',
                    }}
                    className={`absolute w-10 h-10 sm:w-12 sm:h-12 rounded-full border-[3px] flex items-center justify-center shadow-[0_8px_16px_rgba(0,0,0,0.85)] ${
                      leverProgress >= LEVER_ACTIVATION_THRESHOLD
                        ? 'bg-gradient-to-br from-[#80b918] via-[#55a630] to-[#1e3a10] border-[#fef08a] scale-105 shadow-[0_0_18px_rgba(128,185,24,0.85)]'
                        : 'bg-gradient-to-br from-[#e05324] via-[#b82d10] to-[#541104] border-[#f3ead3]'
                    }`}
                  >
                    <div className="w-3 h-3 rounded-full bg-[#fff3d6]/45 -translate-x-1 -translate-y-1" />
                  </div>
                </div>

                <span
                  className={`px-1 py-0.2 rounded bg-[#09110d] border border-[#5c4722] text-[8px] sm:text-[9px] font-mono font-black tabular-nums text-center leading-tight ${
                    leverProgress >= LEVER_ACTIVATION_THRESHOLD
                      ? 'text-[#7ae582] animate-pulse'
                      : 'text-[#f4d06f]'
                  }`}
                >
                  {isDraggingLever
                    ? leverProgress >= LEVER_ACTIVATION_THRESHOLD
                      ? '¡CLACK!'
                      : `${Math.round(leverProgress * 100)}%`
                    : 'TIRAR ↓'}
                </span>
              </div>
            </div>

            {/* --------------------------------------------------------------- */}
            {/* CABINET SECTION D: ARCADE CONTROL PANEL DECK (PART A: FIXED GEOMETRY) */}
            {/* --------------------------------------------------------------- */}
            <div className="relative z-10 rounded-2xl bg-gradient-to-b from-[#2f2219] via-[#211710] to-[#140d08] border-[3px] border-[#b98532] p-2.5 sm:p-3 shadow-[0_10px_25px_rgba(0,0,0,0.85),inset_0_2px_0_rgba(255,224,163,0.2)] grid grid-cols-[1fr_auto] gap-2.5 sm:gap-3 items-stretch shrink-0">
              {/* Left Column: Fixed Two-Row Control Deck */}
              <div className="flex flex-col justify-between gap-2 min-w-0">
                {/* Row 1: Bet Controls with permanently reserved physical widths */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    disabled={isBusy || !isMyTurn || roomState.betMode === 'normal'}
                    onClick={() => {
                      fortunariumAudio.playButtonClick();
                      onSetBetMode('normal');
                    }}
                    className={`fort-arcade-btn w-20 sm:w-26 h-9 sm:h-10 rounded-lg border-2 text-[10px] sm:text-[11px] font-fortunarium tracking-wider cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed shrink-0 whitespace-nowrap text-center ${
                      roomState.betMode === 'normal'
                        ? 'bg-[#d99b26] text-stone-950 border-[#fef08a]'
                        : 'bg-[#1b353e] hover:bg-[#244550] text-[#f3ead3] border-[#8c6b32]'
                    }`}
                  >
                    AP. MÍN
                  </button>

                  <button
                    type="button"
                    disabled={isBusy || !isMyTurn || roomState.betMode === 'normal'}
                    onClick={() => handleStepBetMode(-1)}
                    className="fort-arcade-btn w-8 sm:w-9 h-9 sm:h-10 rounded-lg bg-[#1b353e] hover:bg-[#244550] disabled:opacity-40 border-2 border-[#8c6b32] text-[#f4d06f] flex items-center justify-center font-black cursor-pointer disabled:cursor-not-allowed shrink-0"
                    title="Reducir modo de apuesta"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  {/* Center Fixed Cost Window: exactly the same width & height for all bet modes */}
                  <div className="fort-crt-display px-2 py-0.5 rounded-lg border-2 border-[#8c6b32] text-center w-32 sm:w-38 h-9 sm:h-10 flex flex-col justify-center shrink-0 overflow-hidden">
                    <div className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-[#e9c46a] truncate whitespace-nowrap">
                      {FORTUNARIUM_BET_MODES[roomState.betMode].shortLabel}
                    </div>
                    <div className="text-xs sm:text-sm font-mono font-black text-[#7ae582] tabular-nums leading-tight truncate whitespace-nowrap">
                      {currentSpinCost} CR
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isBusy || !isMyTurn || roomState.betMode === 'sobrecarga'}
                    onClick={() => handleStepBetMode(1)}
                    className="fort-arcade-btn w-8 sm:w-9 h-9 sm:h-10 rounded-lg bg-[#1b353e] hover:bg-[#244550] disabled:opacity-40 border-2 border-[#8c6b32] text-[#f4d06f] flex items-center justify-center font-black cursor-pointer disabled:cursor-not-allowed shrink-0"
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
                    className={`fort-arcade-btn w-20 sm:w-26 h-9 sm:h-10 rounded-lg border-2 text-[10px] sm:text-[11px] font-fortunarium tracking-wider cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed shrink-0 whitespace-nowrap text-center ${
                      roomState.betMode === 'sobrecarga'
                        ? 'bg-[#b82d10] text-[#fff3d6] border-[#fde047]'
                        : 'bg-[#1b353e] hover:bg-[#244550] text-[#f3ead3] border-[#8c6b32]'
                    }`}
                  >
                    AP. MÁX
                  </button>
                </div>

                {/* Row 2: Physical Utility Switches: REPARAR & TALLER (permanent reserved slots) */}
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
                    className="fort-arcade-btn px-3 py-1.5 h-9 sm:h-10 rounded-lg bg-[#1b4332] hover:bg-[#2d6a4f] disabled:opacity-45 border-2 border-[#7ae582]/70 text-[#e6f5ed] text-xs font-black flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed w-36 sm:w-44 shrink-0"
                    title={
                      displayedIntegrity >= roomState.maxIntegrity
                        ? 'Integridad al 100%'
                        : !repairValidation.allowed
                        ? repairValidation.reason || 'No permitido'
                        : `Reparar chasis por ${repairCost} CR`
                    }
                  >
                    <Shield className="w-4 h-4 text-[#7ae582] shrink-0" />
                    <div className="text-left leading-tight min-w-0 truncate">
                      <div className="text-[10px] font-fortunarium tracking-wide uppercase truncate">
                        REPARAR
                      </div>
                      <div className="font-mono text-[11px] text-[#b7e4c7] tabular-nums truncate">
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
                    className="fort-arcade-btn px-3 py-1.5 h-9 sm:h-10 rounded-lg bg-[#8c3b19] hover:bg-[#a8471f] border-2 border-[#f2b24c] text-[#fff3d6] text-xs font-black flex items-center gap-1.5 cursor-pointer w-28 sm:w-34 shrink-0"
                  >
                    <Wrench className="w-4 h-4 text-[#f4d06f] shrink-0" />
                    <div className="text-left leading-tight min-w-0 truncate">
                      <div className="text-[10px] font-fortunarium tracking-wide uppercase truncate">
                        TALLER
                      </div>
                      <div className="font-mono text-[11px] text-[#f4d06f] tabular-nums truncate">
                        {installedUpgrades.length} MEJ.
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Right Column: Permanent Reserved Slot for GIRAR Arcade Plunger Button */}
              <div className="w-36 sm:w-48 md:w-56 flex shrink-0">
                <button
                  type="button"
                  disabled={!canSpin}
                  onClick={() => handleTriggerSpin(undefined, 'button')}
                  className={`w-full h-full min-h-[82px] py-3 px-4 rounded-2xl flex items-center justify-center transition-all ${
                    canSpin
                      ? 'fort-girar-plunger text-[#fff7e6] cursor-pointer'
                      : 'bg-[#2b2623] border-[3px] border-[#574d47] text-[#78716c] cursor-not-allowed opacity-75 shadow-[0_4px_0_#141210]'
                  }`}
                >
                  <span className="font-fortunarium text-2xl sm:text-3xl tracking-widest leading-none drop-shadow-[0_2px_0_rgba(0,0,0,0.65)] select-none">
                    GIRAR
                  </span>
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
          <div className="w-full max-w-xl rounded-2xl bg-[#132830] border-[4px] border-[#b98532] p-5 sm:p-6 shadow-[0_24px_60px_rgba(0,0,0,0.9)] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded bg-[#2b1d0e] border border-[#b98532] text-xs font-black text-[#f4d06f] uppercase tracking-wider">
                Suceso Mecánico · Activado por {roomState.activeEvent.triggeredByPlayerName}
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-fortunarium text-[#f7d97e] tracking-wide">
                {roomState.activeEvent.title.toUpperCase()}
              </h2>
              <p className="text-xs sm:text-sm text-[#e2ece9] mt-1 leading-relaxed">
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
                  className="fort-arcade-btn p-4 rounded-xl bg-[#1b3640] hover:bg-[#234552] border-2 border-[#8c6b32] hover:border-[#f4d06f] text-left flex items-center justify-between gap-3 transition-all cursor-pointer"
                >
                  <div>
                    <div className="text-sm font-black text-[#fff3d6]">{opt.label}</div>
                    <p className="text-xs text-[#cbd5e1] mt-0.5">{opt.description}</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded font-mono text-xs font-black shrink-0 tabular-nums ${
                      opt.riskLevel === 'high'
                        ? 'bg-rose-950 text-rose-300 border border-rose-500/60'
                        : opt.riskLevel === 'medium'
                        ? 'bg-[#2b1d0e] text-[#f4d06f] border border-[#b98532]'
                        : 'bg-emerald-950 text-[#7ae582] border border-emerald-500/60'
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
          <div className="w-full max-w-4xl rounded-2xl bg-[#132830] border-[4px] border-[#b98532] p-5 sm:p-6 shadow-[0_25px_70px_rgba(0,0,0,0.9)] flex flex-col gap-5 my-auto">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-[#8c6b32]/50 pb-3">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-[#7ae582]">
                  ¡Cuota {roomState.round} Sellada! (Conserváis todos vuestros créditos)
                </span>
                <h2 className="text-2xl sm:text-3xl font-fortunarium text-[#f7d97e] tracking-wide mt-0.5">
                  BANCO DE MONTAJE: ELEGID 1 PIEZA DE BUILD
                </h2>
              </div>

              <div className="flex items-center gap-3 font-mono text-sm font-black">
                <span className="fort-crt-display px-3 py-1.5 rounded-lg border-2 border-[#8c6b32] text-[#f4d06f] tabular-nums">
                  Caja: {roomState.money} CR
                </span>
                <span className="fort-crt-display px-3 py-1.5 rounded-lg border-2 border-[#8c6b32] text-[#f4d06f] tabular-nums">
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
            className="w-full max-w-4xl rounded-2xl bg-[#132830] border-[4px] border-[#b98532] p-4 sm:p-6 shadow-[0_25px_70px_rgba(0,0,0,0.92)] flex flex-col gap-4 my-auto max-h-[90dvh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b-2 border-[#8c6b32]/60 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#e9c46a]">
                  Banco de Mantenimiento · Piezas y Engranajes
                </span>
                <h2 className="text-2xl sm:text-3xl font-fortunarium text-[#f7d97e] tracking-wide">
                  TALLER MECÁNICO DEL FORTUNARIUM
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <span className="fort-crt-display px-3 py-1.5 rounded-lg border-2 border-[#8c6b32] font-mono text-xs font-black text-[#f4d06f] tabular-nums">
                  {displayedMoney} CR
                </span>
                <span className="fort-crt-display px-3 py-1.5 rounded-lg border-2 border-[#8c6b32] font-mono text-xs font-black text-[#f4d06f] tabular-nums">
                  {displayedKeys} 🔑
                </span>
                <button
                  type="button"
                  onClick={() => setShowWorkshopModal(false)}
                  className="p-2 rounded-lg bg-[#261714] hover:bg-[#3d1c18] border-2 border-[#b98532] text-[#f3ead3] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Repair Banner */}
            <div className="p-3.5 rounded-xl bg-[#17333d] border-2 border-[#55a630]/70 flex flex-wrap items-center justify-between gap-3 shadow-inner">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-[#7ae582] shrink-0" />
                <div>
                  <div className="text-sm font-black text-[#fff3d6] font-mono tabular-nums">
                    Integridad del Chasis: {displayedIntegrity}% / {roomState.maxIntegrity}%
                  </div>
                  <div className="text-xs text-[#cbd5e1]">
                    Soldadura y ajuste: restaura +{25 + (roomState.upgrades.mecanico_jefe || 0) * 10}% de Integridad usando créditos o 1 Llave.
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
                    className="fort-arcade-btn px-3.5 py-2 rounded-lg bg-[#55a630] hover:bg-[#80b918] disabled:opacity-40 border border-[#d9f99d] text-stone-950 font-mono font-black text-xs cursor-pointer disabled:cursor-not-allowed tabular-nums"
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
                    className="fort-arcade-btn px-3.5 py-2 rounded-lg bg-[#d99b26] hover:bg-[#f4d06f] disabled:opacity-40 border border-[#fef08a] text-stone-950 font-mono font-black text-xs cursor-pointer disabled:cursor-not-allowed tabular-nums"
                  >
                    Usar 1 🔑
                  </button>
                </div>
                {displayedIntegrity < roomState.maxIntegrity &&
                  repairValidation.code === 'SPIN_RESERVE_REQUIRED' && (
                    <span className="text-[10px] font-mono font-bold text-[#f4d06f]">
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
                    className="p-3.5 rounded-xl bg-[#193640] border-2 border-[#8c6b32] flex flex-col justify-between gap-3 shadow-[inset_0_2px_0_rgba(255,255,255,0.1)]"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-11 h-11 rounded-lg bg-[#0d1d24] border-2 border-[#b98532] p-1.5 flex items-center justify-center shrink-0">
                          <img
                            src={FORTUNARIUM_SYMBOLS[meta.iconSymbol].asset}
                            alt={meta.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <span className="px-2 py-0.5 rounded bg-[#2b1d0e] border border-[#b98532] text-[10px] font-mono font-black text-[#f4d06f] tabular-nums">
                          Nv. {lv}/{meta.maxLevel}
                        </span>
                      </div>

                      <div>
                        <div className="text-sm font-fortunarium text-[#fff3d6] tracking-wide">
                          {meta.name.toUpperCase()}
                        </div>
                        <span className="text-[10px] font-bold uppercase text-[#f4d06f]">
                          {meta.effectSummary}
                        </span>
                        <p className="text-xs text-[#e2ece9] mt-1 leading-snug">
                          {meta.description}
                        </p>
                      </div>
                    </div>

                    {isMax ? (
                      <div className="py-2 rounded-lg bg-[#1b4332] border border-[#7ae582]/60 text-center text-xs font-black text-[#7ae582]">
                        PIEZA AL MÁXIMO
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
                            className="fort-arcade-btn py-2 rounded-lg bg-[#d99b26] hover:bg-[#f4d06f] disabled:opacity-40 border border-[#fef08a] text-stone-950 font-mono font-black text-xs cursor-pointer disabled:cursor-not-allowed tabular-nums"
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
                            className="fort-arcade-btn py-2 rounded-lg bg-[#261714] hover:bg-[#3d2520] disabled:opacity-40 border-2 border-[#b98532] text-[#f4d06f] font-mono font-black text-xs cursor-pointer disabled:cursor-not-allowed tabular-nums"
                          >
                            {meta.keyCost} 🔑
                          </button>
                        </div>
                        {upgradeMoneyCheck.code === 'SPIN_RESERVE_REQUIRED' && (
                          <div className="text-[10px] font-mono font-bold text-[#f4d06f] text-center">
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
            className="w-full max-w-md h-full bg-[#132a34] border-l-[3px] border-[#b98532] p-5 flex flex-col justify-between gap-4 overflow-y-auto shadow-[0_0_50px_rgba(0,0,0,0.9)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b-2 border-[#8c6b32] pb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#f4d06f]">
                    REGISTRO DE TURNOS EN VIVO
                  </span>
                  <h3 className="text-2xl font-fortunarium text-[#fff3d6] tracking-wide">
                    EQUIPO DE OPERADORES
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTeamDrawer(false)}
                  className="fort-arcade-btn p-2 rounded-lg bg-[#2b1a14] hover:bg-[#3d251d] border-2 border-[#b98532] text-[#f4d06f] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cursor Color Selector */}
              <div className="p-3.5 rounded-xl bg-[#0d1d24] border-2 border-[#8c6b32] flex flex-col gap-2">
                <span className="text-xs font-bold text-[#fff3d6] flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-[#f4d06f]" />
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
                    className="p-3.5 rounded-xl bg-[#193640] border-2 border-[#8c6b32] flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: p.color }}
                        />
                        <span className="font-bold text-sm text-[#fff3d6]">{p.name}</span>
                        {p.id === localPlayerId && (
                          <span className="text-[10px] font-bold text-[#f4d06f]">(Tú)</span>
                        )}
                      </div>
                      <span className="font-mono text-xs font-black text-[#f4d06f] tabular-nums">
                        {p.stats.spinsTriggered} tiradas
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1.5 border-t border-[#8c6b32]/60 font-mono text-xs tabular-nums">
                      <div>
                        <span className="text-[10px] text-[#c2d6d3] block">Generado</span>
                        <span className="font-black text-[#7ae582]">
                          +{p.stats.totalMoneyGenerated} CR
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#c2d6d3] block">Gastado/Perd.</span>
                        <span className="font-black text-[#ff7b7b]">
                          -{p.stats.totalMoneyLost} CR
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#c2d6d3] block">Balance Neto</span>
                        <span
                          className={`font-black ${
                            p.stats.netBalance >= 0 ? 'text-[#f4d06f]' : 'text-[#ff7b7b]'
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
            className="w-full max-w-md rounded-2xl bg-[#132a34] border-[3px] border-[#b98532] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.9),inset_0_2px_0_rgba(255,255,255,0.12)] flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-fortunarium text-[#fff3d6] tracking-wide">
              ¿SALIR DE LA PARTIDA?
            </h3>
            <p className="text-xs sm:text-sm text-[#d9e5e3] leading-relaxed">
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
                className="fort-arcade-btn w-full py-3 px-4 rounded-xl bg-[#d99b26] hover:bg-[#f4d06f] border-2 border-[#fef08a] text-stone-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
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
                className="fort-arcade-btn w-full py-3 px-4 rounded-xl bg-[#451414] hover:bg-[#5c1b1b] border-2 border-[#dc2626] text-rose-100 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Abandonar Sala y Salir al Menú</span>
              </button>

              <button
                type="button"
                onClick={() => setShowExitConfirmModal(false)}
                className="fort-arcade-btn w-full py-2.5 px-4 rounded-xl bg-[#0d1d24] hover:bg-[#193640] border-2 border-[#8c6b32] text-[#f4d06f] font-bold text-xs cursor-pointer"
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
                    { id: 'pantalla_completa', label: '🌟 Pantalla Completa (15)' },
                    { id: 'force_bankruptcy', label: '💸 Forzar Bancarrota' },
                    { id: 'force_integrity_zero', label: '🔧 Forzar Avería 0%' },
                  ] as const
                ).map((sc) => (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => {
                      handleRunLocalSandboxSpin(sc.id);
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

      {/* GARAGE DOOR INTRO & INTER-QUOTA TRANSITION (PART B & PART H) */}
      {showGarageIntro && (
        <FortunariumGarageIntro
          onComplete={() => {
            setIntroSeenMatchId(roomState.matchId);
            setForceReplayIntro(false);
            setLastSeenQuotaRound(roomState.round);
          }}
          nextQuotaInfo={nextQuotaPaperInfo}
          initialSlideDown={showInterQuotaGarageDoor}
        />
      )}
    </div>
  );
};
