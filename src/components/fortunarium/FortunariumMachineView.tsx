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
  FortunariumIncidentType,
  FortunariumMalfunctionResolvedPayload,
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
  getUpgradeLevelDetails,
  getRepairCostMoney,
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
  generateAuthoritativeGrid,
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
  onDevGrantModifier?: (modifierId: FortunariumModifierId, targetPlayerId?: string) => void;
  onResolveIncident?: (
    choice: 'EMERGENCY_REPAIR' | 'ABSORB_IMPACT' | 'INTERACTIVE_FIX',
    eventId?: string
  ) => void;
  onInteractIncident?: (incidentId: string, controlId: string) => void;
  lastResolvedMalfunction?: FortunariumMalfunctionResolvedPayload | null;
  onDismissRoulette?: () => void;
  onDevTriggerIncident?: (incidentType?: FortunariumIncidentType) => void;
  onDevTriggerRoulette?: () => void;
  onDevSetIntegrity?: (integrity: number) => void;
  onDevForceOverdrive?: () => void;
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

function classifyWinTier(spin: FortunariumSpinResult, currentQuota: number): FortunariumWinTier {
  const mult = spin.grossPayout / Math.max(1, spin.spinCost);
  const exceptionalQuotaThreshold = Math.max(180, Math.round(currentQuota * 0.65));
  if (spin.isJackpot) return 'JACKPOT';
  if (mult >= 14 && spin.grossPayout >= exceptionalQuotaThreshold) return 'HUGE';
  if (mult >= 4 || spin.grossPayout >= Math.max(45, spin.spinCost * 4)) return 'BIG';
  if (mult >= 1.5 || spin.grossPayout >= Math.max(18, spin.spinCost * 1.5)) return 'MEDIUM';
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

function useAnimatedFloat(target: number, durationMs = 460): number {
  const [current, setCurrent] = useState<number>(target);
  const currentRef = useRef<number>(target);
  currentRef.current = current;

  useEffect(() => {
    const startVal = currentRef.current;
    const diff = target - startVal;
    if (Math.abs(diff) < 0.001) {
      setCurrent(target);
      return;
    }
    let rafId = 0;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / durationMs);
      // Cubic ease-out
      const eased = 1 - Math.pow(1 - t, 3);
      const next = startVal + diff * eased;
      setCurrent(next);
      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        setCurrent(target);
      }
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, durationMs]);

  return current;
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
  onResolveIncident,
  onInteractIncident,
  lastResolvedMalfunction,
  onDismissRoulette,
  onDevTriggerIncident,
  onDevTriggerRoulette,
  onDevSetIntegrity,
  onDevForceOverdrive,
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
  const lastPlayedMalfunctionSoundIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (
      lastResolvedMalfunction &&
      lastResolvedMalfunction.eventId !== lastPlayedMalfunctionSoundIdRef.current
    ) {
      lastPlayedMalfunctionSoundIdRef.current = lastResolvedMalfunction.eventId;
      fortunariumAudio.playSpecialSymbolCue('positive');
    }
  }, [lastResolvedMalfunction]);

  // Garage Door Intro State & Inter-Quota Transition (Part H)
  const [introSeenMatchId, setIntroSeenMatchId] = useState<string | null>(() =>
    roomState.totalSpinsInMatch > 0 ? roomState.matchId : null
  );
  const [forceReplayIntro, setForceReplayIntro] = useState(false);
  const [lastSeenQuotaRound, setLastSeenQuotaRound] = useState<number>(roomState.round);
  const [quotaSealingStampActive, setQuotaSealingStampActive] = useState(false);
  const [simBetMode, setSimBetMode] = useState<FortunariumBetMode>(roomState.betMode);
  // Simulator State: 100% isolated non-destructive sandbox (zero mutation to real match)
  const [simSelectedScenario, setSimSelectedScenario] = useState<string | null>(null);
  const [simGrid, setSimGrid] = useState<FortunariumSymbolId[][]>(() => roomState.grid);
  const [simResult, setSimResult] = useState<{
    scenarioName: string;
    grid: FortunariumSymbolId[][];
    spinCost: number;
    grossPayout: number;
    penalties: number;
    netDelta: number;
    winLines: any[];
    specialEffects: any[];
    winningCells: Set<string>;
    hazardCells: Set<string>;
    isJackpot: boolean;
  } | null>(null);

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
      repairCost: getRepairCostMoney({
        round: roomState.round,
        repairsUsedInQuota: roomState.repairsUsedInQuota ?? 0,
        integrity: roomState.integrity,
        maxIntegrity: roomState.maxIntegrity,
        upgrades: roomState.upgrades,
        activeModifiers: roomState.activeModifiers,
      }),
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
    roomState.maxIntegrity,
    roomState.upgrades,
    roomState.activeModifiers,
    roomState.totalSpinsInMatch,
    roomState.repairsUsedInQuota,
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
  const leverRatchetTickedQuarterRef = useRef<boolean>(false);
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

  // Exceptional Win Center Celebration (Reserved strictly for HUGE & JACKPOT, auto-dismisses after 5.0s)
  const [exceptionalWinCelebration, setExceptionalWinCelebration] = useState<{
    id: string;
    tier: 'HUGE' | 'JACKPOT';
    headline: string;
    grossPayout: number;
  } | null>(null);
  const celebrationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Transient Quota Celebration State (Section 2: NEVER stays permanently floating)
  const completedQuotaEventRoundRef = useRef<number>(
    roomState.money >= roomState.quota ? roomState.round : 0
  );
  const [showQuotaBanner, setShowQuotaBanner] = useState(false);

  const stageRef = useRef<HTMLDivElement | null>(null);
  // Initialize to any existing spinId on mount so remounting after Lobby never replays a stale spin from a previous match
  const lastHandledSpinIdRef = useRef<string | null>(
    roomState.totalSpinsInMatch === 0
      ? spinEvent?.spinId ?? null
      : roomState.lastSpinResult?.spinId ?? null
  );
  const lastMatchIdRef = useRef<string>(roomState.matchId);
  const settledGridRef = useRef<FortunariumSymbolId[][]>(roomState.grid);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAllSpinTimers = useCallback(() => {
    for (const t of timersRef.current) clearTimeout(t);
    timersRef.current = [];
  }, []);

  const clearCelebrationTimer = useCallback(() => {
    if (celebrationTimerRef.current) {
      clearTimeout(celebrationTimerRef.current);
      celebrationTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return fortunariumAudio.subscribe((s) => {
      setIsAudioMuted(s.muted);
    });
  }, []);

  useEffect(() => {
    fortunariumAudio.startMusicLoop('gameplay');
    return () => {
      clearAllSpinTimers();
      clearCelebrationTimer();
      // Reset lastHandledSpinIdRef on unmount so StrictMode simulated unmount/remount doesn't swallow active spin timers
      lastHandledSpinIdRef.current = null;
      fortunariumAudio.stopReelSpinLoop();
      fortunariumAudio.stopMusicLoop();
    };
  }, [clearAllSpinTimers, clearCelebrationTimer]);

  // Cleanly reset all machine presentation states whenever a new match / rematch starts (`matchId` changes)
  useEffect(() => {
    if (lastMatchIdRef.current === roomState.matchId) return;
    lastMatchIdRef.current = roomState.matchId;

    clearAllSpinTimers();
    clearCelebrationTimer();
    fortunariumAudio.stopReelSpinLoop();

    // Mark any leftover spinEvent from the previous match as already handled
    if (spinEvent?.spinId) {
      lastHandledSpinIdRef.current = spinEvent.spinId;
    }

    setReelsSpinning([false, false, false, false, false]);
    setReelsLandedBounce([false, false, false, false, false]);
    setIsSpinPresentationActive(false);
    setIsRevealingRewards(false);
    setActivePresentedPatternId(null);
    setActiveRevealStep(null);
    setActiveRevealStepIndex(0);
    setTotalRevealSteps(0);
    setCompletedRevealSteps([]);
    setAccumulatedSpinWin(0);
    setDisplayedAccumulatedWin(0);
    setWinCountUpPulse(false);
    setFlyingRewardAddition(null);
    setFinalOutcomeBanner(null);
    setExceptionalWinCelebration(null);
    setQuotaSealingStampActive(false);
    setShowQuotaBanner(false);
    completedQuotaEventRoundRef.current = 0;
    setLastSeenQuotaRound(roomState.round);
    setLeverProgress(0);
    setIsDraggingLever(false);

    setDisplayedMoney(roomState.money);
    setDisplayedIntegrity(roomState.integrity);
    setDisplayedVoltage(roomState.voltageMultiplier);
    setDisplayedKeys(roomState.keys);
    setDisplayedPlayers(roomState.players);
    setDisplayedLastSpinResult(null);
    setSettledGrid(roomState.grid);
    settledGridRef.current = roomState.grid;
    setReelStrips(
      roomState.grid.map((col, idx) => buildReelCarouselStrip(idx, col, col, 1))
    );
  }, [
    roomState.matchId,
    roomState.round,
    roomState.money,
    roomState.integrity,
    roomState.voltageMultiplier,
    roomState.keys,
    roomState.players,
    roomState.grid,
    spinEvent?.spinId,
    clearAllSpinTimers,
    clearCelebrationTimer,
  ]);

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
  // Strictly authoritative: only real server spin events animate the real cabinet
  const activeSpinEvent = spinEvent;

  useEffect(() => {
    if (!activeSpinEvent || activeSpinEvent.spinId === lastHandledSpinIdRef.current) return;
    // Guard against replaying a stale spinEvent when a fresh match has 0 spins
    if (roomState.totalSpinsInMatch === 0 && !roomState.isSpinning) {
      lastHandledSpinIdRef.current = activeSpinEvent.spinId;
      return;
    }
    lastHandledSpinIdRef.current = activeSpinEvent.spinId;

    clearAllSpinTimers();
    clearCelebrationTimer();
    setExceptionalWinCelebration(null);
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

    // STAGE 2: Stop each reel sequentially from left (Reel 1: 1450ms) to right (Reel 5: 3050ms)
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
        }, 280);
        timersRef.current.push(clearBounceTimer);
      }, delay);
      timersRef.current.push(stopTimer);
    });

    // STAGE 3: ONLY AFTER REEL 5 STOPS, begin sequential pattern-by-pattern presentation
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
      const tier = classifyWinTier(activeSpinEvent, roomState.quota);

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

      // Hold each pattern for ~1.02s (740ms per step during 14-step Jackpot parade)
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

        // Trigger the 5.0-second non-layout center celebration ONLY for HUGE and JACKPOT tiers
        if (tier === 'JACKPOT' || tier === 'HUGE') {
          clearCelebrationTimer();
          setExceptionalWinCelebration({
            id: activeSpinEvent.spinId,
            tier,
            headline: tier === 'JACKPOT' ? '¡JACKPOT SUPREMO!' : '¡PREMIO MASIVO!',
            grossPayout: activeSpinEvent.grossPayout,
          });
          celebrationTimerRef.current = setTimeout(() => {
            setExceptionalWinCelebration(null);
            celebrationTimerRef.current = null;
          }, 5000);
        }

        const finishTimer = setTimeout(() => {
          setIsRevealingRewards(false);
          setIsSpinPresentationActive(false);
        }, 1250);
        timersRef.current.push(finishTimer);
      }, summaryDelay);
      timersRef.current.push(summaryTimer);
    }, postStopDelay);
    timersRef.current.push(postStopTimer);
  }, [
    activeSpinEvent,
    roomState.totalSpinsInMatch,
    roomState.isSpinning,
    roomState.quota,
    clearAllSpinTimers,
    clearCelebrationTimer,
  ]);

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

  const animatedMoneyFloat = useAnimatedFloat(displayedMoney, 460);
  const animatedQuotaFloat = useAnimatedFloat(roomState.quota, 460);
  const animatedIntegrityFloat = useAnimatedFloat(displayedIntegrity, 440);
  const animatedVoltageFloat = useAnimatedFloat(displayedVoltage, 440);

  const smoothDisplayedMoney = Math.round(animatedMoneyFloat);
  const smoothDisplayedQuota = Math.round(animatedQuotaFloat);
  const smoothDisplayedIntegrity = Math.round(animatedIntegrityFloat);

  const quotaMet = displayedMoney >= roomState.quota;
  const quotaPct = Math.min(
    100,
    Math.round((smoothDisplayedMoney / Math.max(1, roomState.quota)) * 100)
  );
  const quotaBarWidthPct = Math.max(
    0,
    Math.min(100, (animatedMoneyFloat / Math.max(1, roomState.quota)) * 100)
  );
  const integrityPct = Math.max(
    0,
    Math.min(100, Math.round((smoothDisplayedIntegrity / roomState.maxIntegrity) * 100))
  );
  const integrityBarWidthPct = Math.max(
    0,
    Math.min(100, (animatedIntegrityFloat / Math.max(1, roomState.maxIntegrity)) * 100)
  );
  const voltageBarWidthPct = Math.max(
    12,
    Math.min(100, ((animatedVoltageFloat - 1) / 2.5) * 88 + 12)
  );
  const repairCost = useMemo(
    () =>
      getRepairCostMoney({
        round: roomState.round,
        repairsUsedInQuota: roomState.repairsUsedInQuota ?? 0,
        integrity: displayedIntegrity,
        maxIntegrity: roomState.maxIntegrity,
        upgrades: roomState.upgrades,
        activeModifiers: roomState.activeModifiers,
      }),
    [
      roomState.round,
      roomState.repairsUsedInQuota,
      displayedIntegrity,
      roomState.maxIntegrity,
      roomState.upgrades,
      roomState.activeModifiers,
    ]
  );
  const isRepairCostValid = Number.isFinite(repairCost) && repairCost > 0;
  const repairCostLabel = isRepairCostValid ? `${repairCost} CR` : '— CR';
  const repairValidation = useMemo(
    () =>
      validateWorkshopPurchase({
        currentMoney: displayedMoney,
        cost: isRepairCostValid ? repairCost : NaN,
        quotaTarget: roomState.quota,
        upgrades: roomState.upgrades,
        activeModifiers: roomState.activeModifiers,
      }),
    [
      displayedMoney,
      repairCost,
      isRepairCostValid,
      roomState.quota,
      roomState.upgrades,
      roomState.activeModifiers,
    ]
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

  // Completely Non-Destructive Isolated Simulator (Zero mutation to real match, zero WebSocket traffic)
  const handleRunSimulation = useCallback(
    (scenarioId?: string) => {
      const cost = calculateEffectiveSpinCost(simBetMode, roomState.upgrades);
      const grid = scenarioId
        ? generateDeterministicTestGrid(scenarioId as FortunariumDevScenario)
        : generateAuthoritativeGrid(roomState.upgrades, simBetMode, roomState.activeModifiers);

      const core = evaluateSpinGridCore({
        grid,
        betMode: simBetMode,
        upgrades: roomState.upgrades,
        currentVoltage: displayedVoltage,
        round: roomState.round,
        activeModifiers: roomState.activeModifiers,
        allowMysteryEvents: false,
        forceJackpot: scenarioId === 'jackpot' || scenarioId === 'pantalla_completa',
        enableJackpotRoll: !scenarioId || scenarioId === 'jackpot' || scenarioId === 'pantalla_completa',
      });

      const winningCellsSet = new Set<string>();
      for (const line of core.winLines) {
        for (const cell of line.cells) {
          winningCellsSet.add(`${cell.col},${cell.row}`);
        }
      }
      const hazardCellsSet = new Set<string>();
      for (const fx of core.specialEffects) {
        if (fx.variant === 'negative') {
          for (const cell of fx.cells || []) {
            hazardCellsSet.add(`${cell.col},${cell.row}`);
          }
        }
      }

      setSimSelectedScenario(scenarioId || 'aleatorio');
      setSimGrid(grid);
      setSimResult({
        scenarioName: scenarioId ? scenarioId : 'Tirada Aleatoria Simulada',
        grid,
        spinCost: cost,
        grossPayout: core.grossPayout,
        penalties: core.penalties,
        netDelta: core.grossPayout - core.penalties - cost,
        winLines: core.winLines,
        specialEffects: core.specialEffects,
        winningCells: winningCellsSet,
        hazardCells: hazardCellsSet,
        isJackpot: core.isJackpot,
      });
      fortunariumAudio.playButtonClick();
    },
    [
      simBetMode,
      roomState.upgrades,
      displayedVoltage,
      roomState.round,
      roomState.activeModifiers,
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
    leverRatchetTickedQuarterRef.current = false;
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

    if (progress >= 0.22 && !leverRatchetTickedQuarterRef.current) {
      leverRatchetTickedQuarterRef.current = true;
      fortunariumAudio.playLeverDragTick(progress);
    }
    if (progress >= 0.45 && !leverRatchetTickedHalfRef.current) {
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

  // Spacebar shortcut to spin when no modal is open & Escape to close Team Drawer
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showTeamDrawer) {
        e.preventDefault();
        fortunariumAudio.playButtonClick();
        setShowTeamDrawer(false);
        return;
      }
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
        if (e.target instanceof HTMLElement && (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT')) {
          return;
        }
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
      className="fortunarium-root font-fortunarium fixed inset-0 w-screen min-h-[100dvh] h-[100dvh] bg-[#04070d] text-cyan-50 flex flex-col overflow-hidden select-none z-50"
    >
      {/* FULL-BLEED UNDERGROUND JAPANESE CYBERPUNK ARCADE / WORKSHOP ENVIRONMENT */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Base fallback dark navy depth */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,#0c1e2c_0%,#060d17_56%,#020409_100%)]" />
        {/* User-provided background artwork (/assets/fortunarium/fondo.png) with subtle ~7px blur & 1.03 scale */}
        <div
          className="absolute inset-0 scale-[1.03]"
          style={{
            backgroundImage: "url('/assets/fortunarium/fondo.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'blur(7px)',
          }}
        />
        {/* Restrained dark navy overlay rgba(2, 7, 15, 0.38) so background remains visible and machine dominates */}
        <div
          className="absolute inset-0"
          style={{ backgroundColor: 'rgba(2, 7, 15, 0.38)' }}
        />
        {/* Subtle ambient cyan & magenta edge vignette */}
        <div className="absolute -top-24 left-1/4 w-[540px] h-[280px] rounded-full bg-cyan-500/10 blur-[110px]" />
        <div className="absolute top-1/4 -right-24 w-[460px] h-[420px] rounded-full bg-pink-600/10 blur-[120px]" />
        <div className="absolute bottom-0 inset-x-0 h-20 bg-gradient-to-t from-[#02050b]/75 to-transparent" />
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
      {/* 1. UPPER CYBERPUNK SYSTEM CONTROL RAIL HEADER (h-12)                  */}
      {/* ===================================================================== */}
      <header className="relative z-30 h-12 shrink-0 w-full bg-gradient-to-b from-[#0d1522] via-[#09101a] to-[#050911] border-b border-[#FF2A6D]/60 px-2.5 sm:px-4 flex items-center justify-between gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.9),0_1px_14px_rgba(255,42,109,0.25)]">
        {/* Subtle bottom neon pink/cyan accent seam */}
        <div className="pointer-events-none absolute bottom-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-[#FF2A6D] to-transparent" />

        {/* Left Group: SALIR, FORTUNARIUM MK-IV, SALA, CUOTA */}
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <button
            type="button"
            onClick={() => {
              fortunariumAudio.playButtonClick();
              setShowExitConfirmModal(true);
            }}
            className="fort-sys-header-btn inline-flex items-center gap-1.5 px-2.5 rounded-md bg-[#1a0b14] hover:bg-[#2a1020] border border-[#FF2A6D]/70 hover:border-[#FF2A6D] text-pink-100 text-xs font-bold cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#FF2A6D]" />
            <span>SALIR</span>
          </button>

          <div className="hidden md:inline-flex items-center gap-2 px-2.5 h-8 rounded-md bg-[#140812] border border-[#FF2A6D]/55 shadow-[inset_0_0_10px_rgba(255,42,109,0.22)] shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF2A6D] shadow-[0_0_6px_#FF2A6D]" />
            <div className="flex flex-col leading-none">
              <span className="font-fortunarium text-xs text-white tracking-wider">
                FORTUNARIUM MK-IV
              </span>
              <span className="text-[7px] font-mono text-[#FF2A6D] tracking-widest">
                フォーチュナリウム
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyRoomCode}
            title="Copiar código de sala"
            className="fort-sys-header-btn inline-flex items-center gap-1.5 px-2.5 rounded-md bg-[#060f18] hover:bg-[#0b1926] border border-cyan-500/45 hover:border-[#FF2A6D]/70 text-xs font-mono font-black text-amber-300 cursor-pointer shrink-0 tabular-nums"
          >
            <span className="text-cyan-300/80 font-sans font-bold text-[10px]">SALA</span>
            <span className="tracking-wider text-[#FF2A6D]">{roomState.roomCode}</span>
            {copiedCode ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <Copy className="w-3 h-3 text-cyan-400" />
            )}
          </button>

          <div className="fort-sys-header-btn inline-flex items-center px-2.5 rounded-md bg-[#12100b] border border-amber-400/55 text-xs font-mono font-black text-amber-300 tabular-nums shrink-0">
            {quotaTargetLabel}
          </div>
        </div>

        {/* Right Group: SIMULADOR, MANUAL, PREMIOS, TALLER, SONIDO, EQUIPO */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              fortunariumAudio.playButtonClick();
              setShowDevModal(true);
            }}
            className="fort-sys-header-btn px-2.5 rounded-md bg-[#1f0815] hover:bg-[#300c20] border border-[#FF2A6D]/75 hover:border-pink-300 text-pink-100 text-xs font-black flex items-center gap-1.5 cursor-pointer shrink-0"
            title="Simulador de Economía y Patrones (Sandbox Aislado)"
          >
            <FlaskConical className="w-3.5 h-3.5 text-[#FF2A6D]" />
            <span className="hidden xl:inline">SIMULADOR</span>
          </button>

          <button
            type="button"
            onClick={() => {
              fortunariumAudio.playButtonClick();
              setShowRulebookModal(true);
            }}
            className="fort-sys-header-btn px-2.5 rounded-md bg-[#081520] hover:bg-[#0e2233] border border-cyan-400/55 hover:border-cyan-300 text-cyan-100 text-xs font-black flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">MANUAL</span>
          </button>

          <button
            type="button"
            onClick={() => {
              fortunariumAudio.playButtonClick();
              setShowPrizeTableModal(true);
            }}
            className="fort-sys-header-btn px-2.5 rounded-md bg-[#141109] hover:bg-[#211b0d] border border-amber-400/60 hover:border-amber-300 text-amber-100 text-xs font-black flex items-center gap-1.5 cursor-pointer shrink-0"
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
            className="fort-sys-header-btn pl-2.5 pr-1.5 rounded-md bg-[#1c1208] hover:bg-[#2b1b0c] border border-amber-400/75 hover:border-amber-300 text-amber-100 text-xs font-black flex items-center gap-2 cursor-pointer shrink-0"
          >
            <span className="flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">TALLER</span>
            </span>
            <span
              className="inline-flex items-center justify-center gap-1 min-w-[2.45rem] px-1.5 py-0.5 rounded bg-[#070d16] border border-amber-400/65 shadow-inner font-mono text-[11.5px] leading-none font-extrabold text-[#fff8e7] tabular-nums"
              title={`Llaves de taller disponibles: ${displayedKeys}`}
            >
              <Key className="w-3 h-3 text-amber-400 shrink-0" />
              <span>{displayedKeys}</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              fortunariumAudio.playButtonClick();
              setShowAudioModal(true);
            }}
            className="fort-sys-header-btn px-2.5 rounded-md bg-[#081520] hover:bg-[#0e2233] border border-cyan-400/55 hover:border-cyan-300 text-cyan-100 text-xs font-black flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            {isAudioMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span className="hidden md:inline">SONIDO</span>
          </button>

          <button
            type="button"
            onClick={() => {
              fortunariumAudio.playButtonClick();
              setShowTeamDrawer((v) => !v);
            }}
            className="fort-sys-header-btn px-2.5 rounded-md bg-[#081520] hover:bg-[#0e2233] border border-cyan-400/55 hover:border-cyan-300 text-cyan-100 text-xs font-black flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">EQUIPO</span>
            <span className="font-mono text-[11px] text-cyan-300 tabular-nums">
              ({roomState.players.length})
            </span>
          </button>
        </div>
      </header>

      {/* FLOATING ERROR TOAST */}
      {errorMessage && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-[#240a12] border-2 border-rose-500 text-rose-100 text-xs sm:text-sm font-bold shadow-[0_0_25px_rgba(244,63,94,0.5)] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* TRANSIENT QUOTA COMPLETED CELEBRATION BANNER (Fires once for 3s, never sticks) */}
      {showQuotaBanner && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 pointer-events-none animate-bounce">
          <div className="px-6 py-2.5 rounded-xl bg-[#062426] border-2 border-cyan-400 shadow-[0_8px_0_#031014,0_0_36px_rgba(34,211,238,0.75)] text-center">
            <div className="text-lg sm:text-xl font-fortunarium text-amber-300 tracking-wider">
              ¡CUOTA {roomState.round} SUPERADA!
            </div>
            <div className="text-xs font-bold text-cyan-100">
              Podéis pulsar «SELLAR CUOTA» ahora o seguir arriesgando sin perder vuestro dinero
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. CENTRAL CYBERPUNK ARCADE CABINET STAGE + LEFT PAPER OVERLAY        */}
      {/* ===================================================================== */}
      <main className="fortunarium-game-stage relative z-10 flex-1 min-h-0 w-full flex items-center justify-center px-2 sm:px-6 py-2 overflow-hidden">
        {/* LEFT-SIDE PHYSICAL TAPED PAPER OVERLAY (Independent layer: NEVER shifts machine centering) */}
        <FortunariumPaperBoard
          activeModifiers={roomState.activeModifiers || []}
          installedUpgrades={installedUpgradeTuples}
          players={roomState.players}
          localPlayerId={localPlayerId}
          onOpenWorkshop={() => setShowWorkshopModal(true)}
        />

        {/* Centered Machine Anchor Wrapper (Visual center = 50vw, completely independent of side notes) */}
        <div
          className={`machine-centered-layer relative w-full max-w-[930px] h-full max-h-[810px] mx-auto flex items-center justify-center transition-transform duration-150 ${
            machineShake ? '-translate-y-0.5 scale-[1.008]' : ''
          }`}
        >

          {/* PROTRUDING SIDE MECHANICAL HARDWARE VENTS & NEON CONDUITS */}
          <div
            aria-hidden="true"
            className="hidden md:flex pointer-events-none absolute -left-3.5 bottom-24 w-4 h-28 rounded-l-lg bg-gradient-to-b from-[#1a2636] via-[#0e1622] to-[#070b12] border-y-2 border-l-2 border-cyan-500/40 flex-col justify-evenly items-center py-2 shadow-[0_0_15px_rgba(6,182,212,0.2)] z-0"
          >
            <span className="w-2 h-1 bg-cyan-400/60 rounded-full" />
            <span className="w-2 h-1 bg-black/80 rounded-full" />
            <span className="w-2 h-1 bg-black/80 rounded-full" />
            <span className="w-2 h-1 bg-pink-500/60 rounded-full" />
          </div>
          <div
            aria-hidden="true"
            className="hidden md:flex pointer-events-none absolute -right-4 top-16 w-4 h-24 rounded-r-lg bg-gradient-to-b from-[#2b1224] via-[#180a16] to-[#0c050b] border-y-2 border-r-2 border-pink-500/45 flex-col items-center justify-between py-1.5 shadow-[0_0_15px_rgba(236,72,153,0.25)] z-0"
          >
            <span className="w-2 h-2 rounded-full bg-pink-500 shadow-[0_0_8px_#ec4899] animate-pulse" />
            <span className="w-1.5 h-10 rounded-full bg-black/70" />
            <span className="w-2 h-2 rounded-full bg-cyan-400/70" />
          </div>

          {/* MAIN CYBERPUNK JAPANESE ARCADE CABINET */}
          <div
            className={`fort-cabinet-metal relative w-full h-full rounded-tl-[30px] rounded-tr-[26px] rounded-bl-[26px] rounded-br-[30px] border-[4px] p-3 sm:p-4 flex flex-col justify-between gap-2 overflow-visible transition-all duration-300 ${
              roomState.phase === 'DEFEAT'
                ? 'border-stone-700 brightness-75 saturate-50'
                : finalOutcomeBanner?.tier === 'JACKPOT'
                ? 'border-amber-300 shadow-[0_0_90px_rgba(250,204,21,0.55),0_0_40px_rgba(34,211,238,0.45),inset_0_2px_16px_rgba(255,255,255,0.4)]'
                : integrityPct <= 30
                ? 'border-rose-500 shadow-[0_25px_70px_rgba(244,63,94,0.45),inset_0_2px_12px_rgba(255,255,255,0.2)]'
                : 'border-[#25465c]'
            }`}
          >
            {/* Corner Slotted Industrial Bolts */}
            <span className="pointer-events-none absolute top-2.5 left-2.5 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-slate-300 to-slate-700 border border-slate-950 shadow flex items-center justify-center">
              <span className="w-2 h-[1.5px] bg-slate-950 rotate-45" />
            </span>
            <span className="pointer-events-none absolute top-2.5 right-2.5 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-slate-300 to-slate-700 border border-slate-950 shadow flex items-center justify-center">
              <span className="w-2 h-[1.5px] bg-slate-950 -rotate-12" />
            </span>
            <span className="pointer-events-none absolute bottom-2.5 left-2.5 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-slate-300 to-slate-700 border border-slate-950 shadow flex items-center justify-center">
              <span className="w-2 h-[1.5px] bg-slate-950 rotate-12" />
            </span>
            <span className="pointer-events-none absolute bottom-2.5 right-2.5 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-slate-300 to-slate-700 border border-slate-950 shadow flex items-center justify-center">
              <span className="w-2 h-[1.5px] bg-slate-950 -rotate-45" />
            </span>

            {/* Subtle Serial Plate on Upper Right Bezel */}
            <div
              aria-hidden="true"
              className="pointer-events-none hidden sm:flex absolute -top-2.5 right-12 z-20 px-2 py-0.5 rounded-xs bg-[#0c1824] border border-cyan-400/50 text-[8px] font-mono text-cyan-300 tracking-widest uppercase shadow items-center gap-1"
            >
              <span>UNIT 79-B · 地下工房 · MK-IV</span>
            </div>

            {/* Inner Recessed Steel & Neon Seam */}
            <div className="pointer-events-none absolute inset-1.5 rounded-[22px] border border-cyan-400/20" />

            {/* --------------------------------------------------------------- */}
            {/* CABINET SECTION A: ILLUMINATED MARQUEE & CRT SCOREBOARD         */}
            {/* --------------------------------------------------------------- */}
            <div className="relative z-10 rounded-2xl bg-gradient-to-b from-[#0d1624] via-[#09101a] to-[#050910] border-2 border-[#234358] px-3 py-2 shadow-[0_6px_18px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(103,232,249,0.2)] flex flex-col gap-1.5 shrink-0">
              {/* Row 1: Kanji Emblem + Illuminated Neon Marquee + Turn Indicator */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Small Japanese Kanji Luck Badge (運) */}
                  <div className="w-8 h-8 rounded-lg bg-[#1f0815] border border-[#FF2A6D]/80 shadow-[inset_0_0_12px_rgba(255,42,109,0.45)] flex items-center justify-center shrink-0">
                    <span className="text-sm font-black text-[#FF2A6D] drop-shadow-[0_0_8px_rgba(255,42,109,0.9)]">
                      運
                    </span>
                  </div>

                  {/* Status LED Strip */}
                  <div className="hidden sm:flex items-center gap-1.5 bg-[#050a10] px-2 py-1 rounded-full border border-[#FF2A6D]/40 shrink-0">
                    {[0, 1, 2].map((b) => (
                      <span
                        key={b}
                        className={`w-2 h-2 rounded-full ${
                          isAnyReelSpinning
                            ? 'bg-cyan-300 shadow-[0_0_10px_#22d3ee] animate-ping'
                            : integrityPct <= 30
                            ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse'
                            : b === 1
                            ? 'bg-[#FF2A6D] shadow-[0_0_8px_#FF2A6D] animate-fort-bulb'
                            : 'bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-fort-bulb'
                        }`}
                      />
                    ))}
                  </div>

                  {/* Illuminated Cyberpunk Marquee Housing */}
                  <div className="relative px-3.5 py-1 rounded-xl bg-gradient-to-r from-[#240817] via-[#0b1929] to-[#240817] border-2 border-[#FF2A6D] shadow-[0_0_24px_rgba(255,42,109,0.38),inset_0_0_14px_rgba(34,211,238,0.2)] flex items-center gap-2.5 shrink-0">
                    <span className="w-1.5 h-3.5 rounded-xs bg-[#FF2A6D] shadow-[0_0_8px_#FF2A6D]" />
                    <div className="flex flex-col items-center leading-none">
                      <h1 className="font-fortunarium text-lg sm:text-2xl md:text-3xl text-white tracking-wider drop-shadow-[0_0_12px_rgba(255,42,109,0.9)] leading-none">
                        FORTUNARIUM
                      </h1>
                      <span className="text-[8px] font-mono text-cyan-300/80 tracking-[0.25em] mt-0.5">
                        フォーチュナリウム
                      </span>
                    </div>
                    <span className="w-1.5 h-3.5 rounded-xs bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                  </div>
                </div>

                {/* Active Turn / Installed Parts Electronic Modules */}
                <div className="flex items-center gap-2 shrink-0">
                  {installedUpgrades.length > 0 && (
                    <div
                      onClick={() => setShowWorkshopModal(true)}
                      title="Ver mejoras instaladas en la máquina"
                      className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#081520] border border-amber-400/55 cursor-pointer hover:border-amber-300 shadow-inner"
                    >
                      <Wrench className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="text-[11px] font-mono font-bold text-amber-200 tabular-nums">
                        {installedUpgrades.length} PIEZAS
                      </span>
                    </div>
                  )}

                  <div className="px-3 py-1 rounded-lg bg-[#06131d] border border-cyan-400/60 shadow-[inset_0_0_10px_rgba(34,211,238,0.2)] flex items-center gap-2 max-w-[190px]">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-[0_0_8px_currentColor]"
                      style={{
                        backgroundColor: currentTurnPlayer?.color || '#22d3ee',
                        color: currentTurnPlayer?.color || '#22d3ee',
                      }}
                    />
                    <span className="text-xs font-bold text-cyan-100 truncate">
                      {roomState.config.turnMode === 'free'
                        ? 'PALANCA LIBRE'
                        : isMyTurn
                        ? '¡TU TURNO!'
                        : `TURNO: ${currentTurnPlayer?.name || 'Operador'}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Row 2: INSET CYAN PHOSPHOR CRT SCOREBOARD & WINNINGS DISPLAY (Section 8) */}
              <div className="fort-crt-display fort-dot-matrix h-[62px] sm:h-[68px] rounded-xl border-2 border-cyan-500/40 px-3.5 py-2 flex items-center justify-between gap-3 overflow-hidden">
                {isAnyReelSpinning ? (
                  <div className="w-full flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <Sparkles className="w-5 h-5 text-cyan-300 animate-spin shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400/85 truncate">
                          &gt; MONITOR DEL TALLER · COSTE -{spinEvent?.spinCost ?? currentSpinCost} CR
                        </div>
                        <div className="font-fortunarium text-sm sm:text-lg text-cyan-100 tracking-wide truncate">
                          GIRANDO RODILLOS ({spinEvent?.playerName || localPlayer?.name})...
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-center shrink-0 pl-3 border-l border-cyan-500/30 w-[142px] sm:w-[172px]">
                      <span className="text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-300/90 whitespace-nowrap">
                        GANANCIA TIRADA
                      </span>
                      <span className="font-mono font-black text-xl sm:text-3xl text-amber-300/85 tabular-nums leading-none whitespace-nowrap">
                        +0 <span className="text-xs sm:text-base text-amber-400">CR</span>
                      </span>
                    </div>
                  </div>
                ) : activeRevealStep ? (
                  <div className="w-full flex items-center justify-between gap-3">
                    <div className="flex flex-col gap-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="px-2 py-0.5 rounded bg-cyan-400 text-slate-950 font-mono text-xs font-black tabular-nums shrink-0 shadow">
                          {activeRevealStepIndex}/{totalRevealSteps}
                        </span>
                        <span
                          className={`font-fortunarium text-sm sm:text-lg md:text-xl tracking-wide truncate drop-shadow ${
                            activeRevealStep.variant === 'hazard'
                              ? 'text-rose-400'
                              : activeRevealStep.variant === 'jackpot'
                              ? 'text-amber-300'
                              : 'text-cyan-200'
                          }`}
                        >
                          {activeRevealStep.title}
                        </span>
                        {activeRevealStep.amount !== 0 && (
                          <span
                            className={`px-2 py-0.5 rounded font-mono font-black text-xs sm:text-sm tabular-nums shrink-0 ${
                              activeRevealStep.amount > 0
                                ? 'bg-amber-950/85 border border-amber-400/75 text-amber-300'
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
                                ? 'bg-cyan-500/25 border-cyan-300 text-cyan-100'
                                : 'bg-[#06121a] border-cyan-800/60 text-cyan-400/80'
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
                    <div className="flex flex-col items-end justify-center shrink-0 pl-3 border-l border-cyan-500/30 w-[142px] sm:w-[172px]">
                      <span className="text-[9px] sm:text-[10px] font-mono font-black uppercase tracking-widest text-cyan-300 whitespace-nowrap">
                        {spinEvent?.isJackpot ? 'JACKPOT ACUMULADO' : 'GANANCIA TIRADA'}
                      </span>
                      <span
                        className={`font-mono font-black text-2xl sm:text-3xl md:text-4xl tabular-nums leading-none whitespace-nowrap transition-transform duration-150 ${
                          winCountUpPulse
                            ? 'scale-110 text-amber-300 drop-shadow-[0_0_14px_rgba(250,204,21,0.95)]'
                            : displayedAccumulatedWin > 0
                            ? 'scale-100 text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.85)]'
                            : 'scale-100 text-amber-300/80'
                        }`}
                      >
                        +{displayedAccumulatedWin.toLocaleString('es-ES')}{' '}
                        <span className="text-xs sm:text-base text-amber-400">CR</span>
                      </span>
                    </div>
                  </div>
                ) : finalOutcomeBanner ? (
                  <div
                    className={`w-full flex items-center justify-between gap-3 ${
                      finalOutcomeBanner.tier === 'BIG' ||
                      finalOutcomeBanner.tier === 'HUGE' ||
                      finalOutcomeBanner.tier === 'JACKPOT'
                        ? 'animate-fort-good-win-crt'
                        : 'animate-fort-total-pulse'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div
                        className={`font-fortunarium text-base sm:text-xl tracking-wide truncate ${
                          finalOutcomeBanner.tier === 'LOSS' || finalOutcomeBanner.netAmount < 0
                            ? 'text-rose-400'
                            : finalOutcomeBanner.tier === 'BIG' ||
                              finalOutcomeBanner.tier === 'HUGE' ||
                              finalOutcomeBanner.tier === 'JACKPOT'
                            ? 'text-amber-300 drop-shadow-[0_0_14px_rgba(250,204,21,0.9)]'
                            : 'text-cyan-200'
                        }`}
                      >
                        {finalOutcomeBanner.grossPayout > 0 ? (
                          <>
                            <span className="text-cyan-200">
                              {finalOutcomeBanner.tier === 'JACKPOT'
                                ? '¡JACKPOT SUPREMO! TOTAL GANADO: '
                                : 'TOTAL GANADO: '}
                            </span>
                            <span className="font-mono font-black text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.9)] tabular-nums">
                              +{finalOutcomeBanner.grossPayout.toLocaleString('es-ES')} CR
                            </span>
                          </>
                        ) : (
                          finalOutcomeBanner.title
                        )}
                      </div>
                      <div className="font-mono font-bold text-[11px] sm:text-xs text-cyan-300/85 truncate tabular-nums">
                        TIRADA: -{finalOutcomeBanner.spinCost} CR · PREMIO:{' '}
                        <span className="text-amber-300 font-black">
                          +{finalOutcomeBanner.grossPayout.toLocaleString('es-ES')} CR
                        </span>
                        {finalOutcomeBanner.subtitle.includes('PENALIZACIÓN:')
                          ? ` · ${
                              finalOutcomeBanner.subtitle
                                .split(' · ')
                                .find((p) => p.startsWith('PENALIZACIÓN:')) || ''
                            }`
                          : ''}{' '}
                        · CAJA COMÚN:{' '}
                        <span className="text-amber-300 font-black">
                          {finalOutcomeBanner.finalMoney.toLocaleString('es-ES')} CR
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-center shrink-0 pl-3 border-l border-cyan-500/30 w-[142px] sm:w-[172px]">
                      <span className="text-[9px] sm:text-[10px] font-mono font-black uppercase tracking-widest text-cyan-300 whitespace-nowrap">
                        GANANCIA TIRADA
                      </span>
                      <span
                        className={`font-mono font-black text-2xl sm:text-3xl md:text-4xl tabular-nums leading-none whitespace-nowrap ${
                          finalOutcomeBanner.grossPayout > 0
                            ? 'text-amber-300 drop-shadow-[0_0_16px_rgba(250,204,21,0.95)]'
                            : 'text-amber-300/80'
                        }`}
                      >
                        +{finalOutcomeBanner.grossPayout.toLocaleString('es-ES')}{' '}
                        <span className="text-xs sm:text-base text-amber-400">CR</span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400/80">
                        &gt; MONITOR DEL TALLER
                      </div>
                      <div className="text-xs sm:text-sm font-mono font-bold text-cyan-100 truncate">
                        {roomState.actionLog[0]?.text || 'Fortunarium encendido. Listo para accionar tambores.'}
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-center shrink-0 pl-3 border-l border-cyan-500/30 w-[142px] sm:w-[172px]">
                      <span className="text-[9px] sm:text-[10px] font-mono font-black uppercase tracking-widest text-cyan-300/90 whitespace-nowrap">
                        GANANCIA TIRADA
                      </span>
                      <span
                        className={`font-mono font-black text-xl sm:text-2xl md:text-3xl tabular-nums leading-none whitespace-nowrap ${
                          (displayedLastSpinResult?.grossPayout || 0) > 0
                            ? 'text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.85)]'
                            : 'text-amber-300/85'
                        }`}
                      >
                        +{(displayedLastSpinResult?.grossPayout || 0).toLocaleString('es-ES')}{' '}
                        <span className="text-xs sm:text-sm text-amber-400">CR</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* --------------------------------------------------------------- */}
            {/* CABINET SECTION B: 3 COMPACT ELECTRONIC LED GAUGES              */}
            {/* --------------------------------------------------------------- */}
            <div className="relative z-20 grid grid-cols-3 gap-2 sm:gap-3 shrink-0">
              {/* Screen 1: CUOTA (Segmented Amber/Yellow Electronic Progress Bar) */}
              <div className="fort-crt-display group relative rounded-xl border-2 border-[#1e3f52] p-2.5 sm:p-3 flex flex-col justify-between gap-1.5 cursor-help">
                <span className="pointer-events-none absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-cyan-500/40" />
                <span className="pointer-events-none absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-cyan-500/40" />

                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] sm:text-xs font-fortunarium tracking-wider text-cyan-200 truncate">
                    {quotaTargetLabel}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-black tabular-nums shrink-0 ${
                      quotaMet
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-400/60'
                        : 'bg-[#091924] text-amber-300 border border-amber-400/40'
                    }`}
                  >
                    {quotaPct}%
                  </span>
                </div>

                {/* Physical Segmented LED Quota Bar (Smooth Animated Gauge) */}
                <div className="relative w-full h-4 rounded bg-[#02060a] p-0.5 border border-cyan-500/35 shadow-[inset_0_2px_6px_rgba(0,0,0,0.95)] overflow-hidden">
                  <div
                    className={`h-full rounded-xs fort-gauge-fill ${
                      quotaMet
                        ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-300 shadow-[0_0_12px_rgba(52,211,153,0.85)]'
                        : 'bg-gradient-to-r from-[#FF2A6D] via-amber-400 to-yellow-300 shadow-[0_0_10px_rgba(251,191,36,0.65)]'
                    }`}
                    style={{ width: `${quotaBarWidthPct}%` }}
                  />
                  {/* Segmented LED cell dividers */}
                  <div
                    className="pointer-events-none absolute inset-0 opacity-75"
                    style={{
                      backgroundImage:
                        'repeating-linear-gradient(90deg, transparent 0px, transparent 8px, rgba(2,6,10,0.95) 8px, rgba(2,6,10,0.95) 11px)',
                    }}
                  />
                </div>

                <div className="flex items-center justify-between gap-1 min-h-[20px]">
                  <span className="font-mono font-bold text-[11px] sm:text-xs text-cyan-100 tabular-nums truncate">
                    {smoothDisplayedMoney} / {smoothDisplayedQuota} CR
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
                      className="px-2 py-0.5 rounded bg-amber-400 hover:bg-amber-300 border border-yellow-100 text-stone-950 font-fortunarium text-[10px] sm:text-[11px] tracking-wider shadow-[0_0_12px_rgba(251,191,36,0.8)] cursor-pointer animate-pulse shrink-0"
                    >
                      SELLAR CUOTA
                    </button>
                  )}
                </div>

                {/* QUOTA HOVER TOOLTIP (Dark CRT Diagnostic Window) */}
                <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute left-0 top-[calc(100%+8px)] w-64 z-50 p-3 rounded-xl bg-[#050d16]/98 border border-cyan-400/70 shadow-[0_16px_40px_rgba(0,0,0,0.95),0_0_20px_rgba(6,182,212,0.25)] text-left">
                  <div className="font-fortunarium text-xs text-cyan-300 tracking-wider uppercase mb-1">
                    DIAGNÓSTICO DE CUOTA
                  </div>
                  <p className="text-[11px] text-cyan-100 leading-snug">
                    Debéis alcanzar esta cantidad de créditos para superar el objetivo actual.
                  </p>
                  <p className="text-[10px] text-emerald-300 font-bold mt-1">
                    El dinero NO desaparece al sellar la cuota.
                  </p>
                  <div className="mt-2 pt-1.5 border-t border-cyan-500/25 font-mono text-[10px] space-y-0.5 tabular-nums">
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

              {/* Screen 2: CRÉDITOS (Large Readable Digital Counter) */}
              <div className="fort-crt-display fort-dot-matrix relative rounded-xl border-2 border-[#1e3f52] p-2.5 sm:p-3 flex flex-col justify-between gap-1">
                <span className="pointer-events-none absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-cyan-500/40" />
                <span className="pointer-events-none absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-cyan-500/40" />

                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] sm:text-xs font-fortunarium tracking-wider text-cyan-200">
                    CRÉDITOS
                  </span>
                  <span className="text-[10px] font-mono font-bold text-cyan-300/80 tabular-nums truncate">
                    {!displayedLastSpinResult ? (
                      <>
                        ÚLTIMA: <strong className="text-cyan-200">+0 CR</strong>
                      </>
                    ) : displayedLastSpinResult.netMoneyDelta >= 0 ? (
                      <>
                        ÚLTIMA:{' '}
                        <strong className="text-emerald-300">
                          +{displayedLastSpinResult.netMoneyDelta} CR
                        </strong>
                      </>
                    ) : (
                      <>
                        ÚLTIMA:{' '}
                        <strong className="text-rose-400">
                          {displayedLastSpinResult.netMoneyDelta} CR
                        </strong>
                      </>
                    )}
                  </span>
                </div>

                <div className="flex items-baseline justify-between gap-2">
                  <div className="font-mono font-black text-xl sm:text-3xl text-amber-200 tabular-nums tracking-tight leading-none drop-shadow-[0_0_10px_rgba(251,191,36,0.35)] truncate">
                    {smoothDisplayedMoney} <span className="text-xs sm:text-base text-amber-400">CR</span>
                  </div>
                </div>

                {/* Animated Voltage Sub-Gauge Bar */}
                <div className="relative w-full h-1.5 rounded-full bg-[#02060a] border border-cyan-500/30 overflow-hidden">
                  <div
                    className="h-full fort-gauge-fill bg-gradient-to-r from-cyan-500 via-cyan-300 to-[#FF2A6D]"
                    style={{ width: `${voltageBarWidthPct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between gap-1.5 pt-0.5 border-t border-cyan-500/25 text-[10px] sm:text-[11px] font-mono font-black tabular-nums">
                  <span className="text-cyan-300 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-cyan-400" />
                    VOLT x{animatedVoltageFloat.toFixed(2)}
                  </span>
                  <span className="text-amber-300 flex items-center gap-1">
                    <Key className="w-3 h-3 text-amber-400" />
                    {displayedKeys} 🔑
                  </span>
                </div>
              </div>

              {/* Screen 3: INTEGRIDAD (Segmented Cyan/Emerald/Red Electronic Bar) */}
              <div className="fort-crt-display group relative rounded-xl border-2 border-[#1e3f52] p-2.5 sm:p-3 flex flex-col justify-between gap-1.5 cursor-help">
                <span className="pointer-events-none absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-cyan-500/40" />
                <span className="pointer-events-none absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-cyan-500/40" />

                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] sm:text-xs font-fortunarium tracking-wider text-cyan-200">
                    INTEGRIDAD
                  </span>
                  <span
                    className={`text-xs font-mono font-black tabular-nums ${
                      integrityPct < 35
                        ? 'text-rose-400 animate-pulse'
                        : integrityPct <= 70
                        ? 'text-amber-300'
                        : 'text-emerald-300'
                    }`}
                  >
                    {smoothDisplayedIntegrity}%
                  </span>
                </div>

                {/* Physical Illuminated Segmented Integrity Bar (Smooth Animated Gauge) */}
                <div className="relative w-full h-4 rounded bg-[#02060a] p-0.5 border border-cyan-500/35 shadow-[inset_0_2px_6px_rgba(0,0,0,0.95)] overflow-hidden">
                  <div
                    className={`h-full rounded-xs fort-gauge-fill ${
                      integrityPct < 35
                        ? 'bg-gradient-to-r from-rose-700 via-rose-500 to-[#FF2A6D] shadow-[0_0_12px_rgba(244,63,94,0.85)]'
                        : integrityPct <= 70
                        ? 'bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-300'
                        : 'bg-gradient-to-r from-teal-500 via-cyan-400 to-emerald-300 shadow-[0_0_10px_rgba(34,211,238,0.6)]'
                    }`}
                    style={{ width: `${integrityBarWidthPct}%` }}
                  />
                  <div
                    className="pointer-events-none absolute inset-0 opacity-75"
                    style={{
                      backgroundImage:
                        'repeating-linear-gradient(90deg, transparent 0px, transparent 8px, rgba(2,6,10,0.95) 8px, rgba(2,6,10,0.95) 11px)',
                    }}
                  />
                </div>

                <div className="flex items-center justify-between gap-1 min-h-[20px]">
                  <span
                    className={`font-mono font-bold text-[10px] sm:text-[11px] uppercase truncate ${
                      integrityPct < 35
                        ? 'text-rose-300'
                        : integrityPct <= 70
                        ? 'text-amber-300'
                        : 'text-cyan-200/90'
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
                      disabled={!isRepairCostValid || !repairValidation.allowed}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isRepairCostValid) return;
                        fortunariumAudio.playButtonClick();
                        onRepairMachine(false);
                      }}
                      className="px-2 py-0.5 rounded bg-emerald-950 hover:bg-emerald-900 disabled:opacity-40 border border-emerald-400/60 text-emerald-200 font-mono font-black text-[10px] cursor-pointer disabled:cursor-not-allowed shrink-0 tabular-nums"
                      title={
                        repairValidation.allowed
                          ? `Reparar máquina por ${repairCostLabel}`
                          : repairValidation.reason
                      }
                    >
                      +REPARAR ({repairCostLabel})
                    </button>
                  )}
                </div>

                {/* INTEGRITY HOVER TOOLTIP */}
                <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute right-0 top-[calc(100%+8px)] w-64 z-50 p-3 rounded-xl bg-[#050d16]/98 border border-cyan-400/70 shadow-[0_16px_40px_rgba(0,0,0,0.95),0_0_20px_rgba(6,182,212,0.25)] text-left">
                  <div className="font-fortunarium text-xs text-cyan-300 tracking-wider uppercase mb-1">
                    DIAGNÓSTICO DE INTEGRIDAD ({displayedIntegrity}%)
                  </div>
                  <p className="text-[11px] text-cyan-100 leading-snug">
                    Estado físico del chasis. Si cae a 0%, la máquina revienta y termina la partida.
                  </p>
                  <div className="mt-2 pt-1.5 border-t border-cyan-500/25 text-[10px] space-y-1">
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
            {/* CABINET SECTION C: 5-REEL CRT MONITOR DISPLAY + DRAG LEVER      */}
            {/* --------------------------------------------------------------- */}
            <div className="relative z-10 flex-1 min-h-0 flex items-stretch gap-2 sm:gap-3.5">
              {/* Bolted Dark Cyberpunk Steel & Neon CRT Monitor Bezel (`5 columns × 3 rows`) */}
              <div className="relative flex-1 min-h-0 rounded-[24px] bg-gradient-to-b from-[#101c2b] via-[#0a131f] to-[#050911] border-2 border-[#23475e] p-2 sm:p-2.5 shadow-[0_12px_32px_rgba(0,0,0,0.92),0_0_20px_rgba(6,182,212,0.12),inset_0_1px_0_rgba(103,232,249,0.26)] flex flex-col">
                {/* Tiny corner bolts on CRT monitor bezel */}
                <span className="pointer-events-none absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-slate-700 border border-slate-950" />
                <span className="pointer-events-none absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-slate-700 border border-slate-950" />
                <span className="pointer-events-none absolute bottom-1.5 left-1.5 w-2 h-2 rounded-full bg-slate-700 border border-slate-950" />
                <span className="pointer-events-none absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full bg-slate-700 border border-slate-950" />

                {/* Subtle CRT Bezel Top Micro-Telemetry Bar */}
                <div className="pointer-events-none flex items-center justify-between px-3 pb-1 text-[9px] font-mono font-bold tracking-widest text-cyan-400/70 uppercase select-none">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
                    <span>CRT-5X3 PHOSPHOR MATRIX</span>
                  </span>
                  <span className="text-pink-400/75">SYNC 60HZ · JP-ARCADE</span>
                </div>

                {/* Unified Dark Glass CRT Screen Housing All 5 Reel Channels */}
                <div className="fort-crt-slot-screen relative flex-1 min-h-0 rounded-[18px] border-2 border-cyan-400/45 p-2 sm:p-3 grid grid-cols-5 gap-2 sm:gap-2.5 overflow-hidden">
                  {/* Subtle CRT Screen Corner Reticle Marks */}
                  <span className="pointer-events-none absolute top-1.5 left-1.5 w-2.5 h-2.5 border-t border-l border-cyan-400/45 z-25" />
                  <span className="pointer-events-none absolute top-1.5 right-1.5 w-2.5 h-2.5 border-t border-r border-cyan-400/45 z-25" />
                  <span className="pointer-events-none absolute bottom-1.5 left-1.5 w-2.5 h-2.5 border-b border-l border-cyan-400/45 z-25" />
                  <span className="pointer-events-none absolute bottom-1.5 right-1.5 w-2.5 h-2.5 border-b border-r border-cyan-400/45 z-25" />

                  {[0, 1, 2, 3, 4].map((colIdx) => {
                    const isSpinningCol = reelsSpinning[colIdx];
                    const isBounceCol = reelsLandedBounce[colIdx];
                    const strip = reelStrips[colIdx] || settledGrid[colIdx] || [
                      'cereza',
                      'siete',
                      'limon',
                    ];
                    const settledCol = settledGrid[colIdx] || ['cereza', 'siete', 'limon'];
                    const totalStripCount = strip.length;

                    return (
                      <div
                        key={colIdx}
                        className={`fort-crt-reel-channel relative h-full w-full rounded-xl overflow-hidden ${
                          isSpinningCol
                            ? 'fort-crt-reel-channel-spinning'
                            : isBounceCol
                            ? 'fort-crt-reel-channel-locked'
                            : ''
                        }`}
                      >
                        {/* Top & Bottom CRT Phosphor Vignette Shading */}
                        <div className="pointer-events-none absolute inset-x-0 top-0 h-7 bg-gradient-to-b from-[#01050a]/85 via-[#01050a]/30 to-transparent z-20" />
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-7 bg-gradient-to-t from-[#01050a]/85 via-[#01050a]/30 to-transparent z-20" />

                        {/* Subtle CRT Phosphor Vertical Motion Trails during spin */}
                        {isSpinningCol && (
                          <div
                            className="pointer-events-none absolute inset-0 z-15 opacity-55"
                            style={{
                              backgroundImage:
                                'linear-gradient(180deg, rgba(34,211,238,0.08) 0%, rgba(236,72,153,0.05) 50%, rgba(34,211,238,0.1) 100%)',
                            }}
                          />
                        )}

                        {/* Crisp Cyan Phosphor Lock-In Flash when column stops */}
                        {isBounceCol && (
                          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-cyan-300 shadow-[0_0_14px_#22d3ee] z-25 animate-pulse" />
                        )}

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
                                  className="w-full p-1.5 sm:p-2.5 flex items-center justify-center border-b border-cyan-500/15"
                                >
                                  <img
                                    src={symMeta.asset}
                                    alt={symMeta.name}
                                    className="w-full h-full object-contain scale-y-[1.05] drop-shadow-[0_4px_10px_rgba(34,211,238,0.45)]"
                                    draggable={false}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          /* SETTLED 3-ROW CRT COLUMN WITH MECHANICAL BOUNCE & POST-STOP HIGHLIGHTS */
                          <div
                            className={`w-full h-full grid grid-rows-3 divide-y divide-cyan-400/18 transition-transform duration-200 ${
                              isBounceCol ? 'animate-fort-reel-bounce' : 'translate-y-0'
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
                                      ? 'bg-cyan-400/22 ring-2 ring-inset ring-amber-300/90 shadow-[inset_0_0_22px_rgba(34,211,238,0.55),0_0_16px_rgba(250,204,21,0.4)] z-10 rounded-lg'
                                      : isSpecialCell
                                      ? 'bg-cyan-400/25 ring-2 ring-inset ring-cyan-300/90 shadow-[inset_0_0_20px_rgba(34,211,238,0.6)] z-10 rounded-lg'
                                      : isHazardCell
                                      ? 'bg-rose-500/28 ring-2 ring-inset ring-rose-400/90 shadow-[inset_0_0_22px_rgba(244,63,94,0.65)] z-10 rounded-lg'
                                      : isDimmedCell
                                      ? 'opacity-30 grayscale-[0.45] scale-[0.95]'
                                      : 'hover:bg-cyan-400/[0.04]'
                                  }`}
                                >
                                  {/* Subtle CRT cell corner phosphor ticks */}
                                  <span className="pointer-events-none absolute top-1 left-1 w-1.5 h-1.5 border-t border-l border-cyan-400/25" />
                                  <span className="pointer-events-none absolute bottom-1 right-1 w-1.5 h-1.5 border-b border-r border-cyan-400/25" />

                                  <img
                                    key={`${coordKey}_${activePresentedPatternId || 'idle'}`}
                                    src={symMeta.asset}
                                    alt={symMeta.name}
                                    className={`w-full h-full object-contain drop-shadow-[0_0_10px_rgba(34,211,238,0.28)] transition-transform duration-200 ${
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
                                    <span className="absolute top-1 left-1 px-1.5 py-0.2 rounded bg-gradient-to-r from-cyan-300 to-amber-300 text-slate-950 font-mono text-[9px] font-black uppercase shadow-md">
                                      COMODÍN → {symMeta.name}
                                    </span>
                                  )}

                                  {/* Subtle corner badge for Special Symbols once stopped */}
                                  {symMeta.category === 'special' && !wildTargetSymId && (
                                    <span
                                      className={`absolute bottom-1 right-1 px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider shadow ${
                                        displaySymId === 'bomba' || displaySymId === 'calavera'
                                          ? 'bg-rose-950/95 text-rose-200 border border-rose-500/70'
                                          : 'bg-[#061824]/95 text-cyan-200 border border-cyan-400/60'
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

                {/* PART G: 5-SECOND NON-LAYOUT CENTER CELEBRATION RESERVED ONLY FOR EXCEPTIONAL WINS (HUGE / JACKPOT) */}
                {exceptionalWinCelebration && (
                  <div
                    key={exceptionalWinCelebration.id}
                    className="pointer-events-none absolute inset-0 z-35 flex flex-col items-center justify-center p-4 overflow-hidden rounded-[22px] animate-fort-exceptional-5s"
                  >
                    {/* Subtle integrated darkening & CRT phosphor radial bloom over the reel screen */}
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{
                        background:
                          exceptionalWinCelebration.tier === 'JACKPOT'
                            ? 'radial-gradient(circle at 50% 50%, rgba(250,204,21,0.34) 0%, rgba(236,72,153,0.22) 38%, rgba(2,6,14,0.78) 82%)'
                            : 'radial-gradient(circle at 50% 50%, rgba(34,211,238,0.30) 0%, rgba(250,204,21,0.18) 40%, rgba(2,6,14,0.74) 82%)',
                      }}
                    />

                    {/* Horizontal CRT Laser / Phosphor Horizon Flare */}
                    <div
                      className={`pointer-events-none absolute inset-x-6 h-[2px] blur-[1px] ${
                        exceptionalWinCelebration.tier === 'JACKPOT'
                          ? 'bg-gradient-to-r from-transparent via-amber-300 to-transparent shadow-[0_0_24px_#facc15]'
                          : 'bg-gradient-to-r from-transparent via-cyan-300 to-transparent shadow-[0_0_22px_#22d3ee]'
                      }`}
                    />

                    {/* Integrated CRT Holographic Callout: Headline + Protagonist Amount Only */}
                    <div className="pointer-events-none relative flex flex-col items-center justify-center text-center px-6 py-4">
                      <div
                        className={`font-fortunarium text-2xl sm:text-4xl md:text-5xl tracking-[0.18em] uppercase leading-none select-none ${
                          exceptionalWinCelebration.tier === 'JACKPOT'
                            ? 'text-amber-300 drop-shadow-[0_0_18px_rgba(250,204,21,0.95)]'
                            : 'text-cyan-200 drop-shadow-[0_0_16px_rgba(34,211,238,0.95)]'
                        }`}
                      >
                        {exceptionalWinCelebration.headline}
                      </div>

                      <div
                        className={`font-fortunarium font-black text-5xl sm:text-7xl md:text-8xl tabular-nums tracking-tight leading-none mt-2 select-none ${
                          exceptionalWinCelebration.tier === 'JACKPOT'
                            ? 'text-yellow-200 drop-shadow-[0_0_28px_rgba(250,204,21,1)]'
                            : 'text-amber-300 drop-shadow-[0_0_24px_rgba(34,211,238,0.95)]'
                        }`}
                      >
                        +{exceptionalWinCelebration.grossPayout.toLocaleString('es-ES')}{' '}
                        <span className="text-2xl sm:text-4xl text-cyan-300">CR</span>
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
                className={`relative w-14 sm:w-18 md:w-20 rounded-2xl bg-gradient-to-b from-[#111d2b] via-[#0b131e] to-[#060a11] border-[2px] p-2 flex flex-col items-center justify-between shadow-[0_10px_24px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(103,232,249,0.2)] touch-none select-none transition-all ${
                  canSpin
                    ? isDraggingLever
                      ? 'cursor-grabbing border-cyan-400 shadow-[0_10px_24px_rgba(0,0,0,0.95),0_0_18px_rgba(34,211,238,0.28)]'
                      : 'cursor-grab border-[#23475e] hover:border-cyan-400/80'
                    : 'border-[#1b3344] opacity-55 cursor-not-allowed'
                }`}
              >
                {/* Corner mounting rivets */}
                <span className="pointer-events-none absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-slate-600" />
                <span className="pointer-events-none absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-slate-600" />
                <span className="pointer-events-none absolute bottom-1.5 left-1.5 w-1.5 h-1.5 rounded-full bg-slate-600" />
                <span className="pointer-events-none absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-slate-600" />

                {/* Bolted Metal Label */}
                <span className="px-1.5 py-0.5 rounded-xs bg-[#06121c] border border-cyan-500/45 text-[8px] sm:text-[9px] font-fortunarium tracking-wider text-cyan-200 text-center leading-tight">
                  PALANCA
                </span>

                {/* Vertical Travel Track, Mechanical Ratchet Teeth, Pivot Shaft & 68% Activation Threshold */}
                <div className="relative flex-1 w-full flex items-center justify-center my-2">
                  {/* Mechanical Ratchet Teeth Ticks along Both Sides of the Track */}
                  <div
                    className="pointer-events-none absolute inset-y-1 w-8 opacity-65"
                    style={{
                      backgroundImage:
                        'repeating-linear-gradient(180deg, rgba(34,211,238,0.45) 0px, rgba(34,211,238,0.45) 2px, transparent 2px, transparent 10px)',
                    }}
                  />

                  {/* Recessed Steel Slot Track with Neon Telemetry Fill */}
                  <div className="relative w-4 h-full rounded-full bg-gradient-to-r from-[#020509] via-[#091521] to-[#020509] border border-cyan-500/45 shadow-[inset_0_4px_10px_rgba(0,0,0,0.95)] overflow-hidden">
                    {/* Pull Fill Bar */}
                    <div
                      style={{
                        height: `${Math.round(leverProgress * 100)}%`,
                        transition: isDraggingLever
                          ? 'none'
                          : 'height 320ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                      }}
                      className={`w-full transition-colors ${
                        leverProgress >= LEVER_ACTIVATION_THRESHOLD
                          ? 'bg-gradient-to-b from-cyan-300 via-cyan-400 to-emerald-400 shadow-[0_0_12px_#22d3ee]'
                          : 'bg-gradient-to-b from-pink-500/85 via-rose-500/90 to-amber-400/95'
                      }`}
                    />
                    {/* 68% Mechanical Engage Line */}
                    <div
                      style={{ top: `${LEVER_ACTIVATION_THRESHOLD * 100}%` }}
                      className={`absolute inset-x-0 h-0.5 transition-all ${
                        leverProgress >= LEVER_ACTIVATION_THRESHOLD
                          ? 'bg-white shadow-[0_0_10px_#ffffff]'
                          : 'bg-cyan-300 shadow-[0_0_6px_#22d3ee]'
                      }`}
                    />
                  </div>

                  {/* Chromed Cyberpunk Piston Shaft Connecting Top Housing to Knob */}
                  <div
                    style={{
                      height: `calc(${leverProgress * 76}% + 22px)`,
                      transition: isDraggingLever
                        ? 'none'
                        : 'height 320ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                    className="pointer-events-none absolute top-0 w-2 rounded-full bg-gradient-to-r from-slate-600 via-cyan-100 to-slate-700 shadow-[0_0_8px_rgba(34,211,238,0.35)]"
                  />

                  {/* Industrial Cyberpunk Neon Ball Knob */}
                  <div
                    style={{
                      top: `calc(${leverProgress * 76}% + 4px)`,
                      transition: isDraggingLever
                        ? 'none'
                        : 'top 320ms cubic-bezier(0.34, 1.56, 0.64, 1), transform 260ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                    className={`absolute w-10 h-10 sm:w-12 sm:h-12 rounded-full border-[2px] flex items-center justify-center shadow-[0_8px_16px_rgba(0,0,0,0.92)] ${
                      leverProgress >= LEVER_ACTIVATION_THRESHOLD
                        ? 'bg-gradient-to-br from-cyan-200 via-cyan-400 to-teal-900 border-white scale-110 shadow-[0_0_24px_rgba(34,211,238,0.95)]'
                        : isDraggingLever
                        ? 'bg-gradient-to-br from-rose-400 via-pink-600 to-[#3b071c] border-pink-100 scale-105 shadow-[0_0_20px_rgba(236,72,153,0.8)]'
                        : 'bg-gradient-to-br from-rose-500 via-pink-600 to-[#3b071c] border-pink-200 shadow-[0_0_16px_rgba(236,72,153,0.55)]'
                    }`}
                  >
                    {/* Specular highlight + inner core ring */}
                    <div className="w-3.5 h-3.5 rounded-full bg-white/65 -translate-x-1 -translate-y-1 blur-[0.3px]" />
                    <div className="pointer-events-none absolute inset-1.5 rounded-full border border-white/25" />
                  </div>
                </div>

                <span
                  className={`px-1.5 py-0.5 rounded bg-[#050d15] border text-[8px] sm:text-[9px] font-mono font-black tabular-nums text-center leading-tight transition-colors ${
                    leverProgress >= LEVER_ACTIVATION_THRESHOLD
                      ? 'border-cyan-300 text-cyan-200 bg-cyan-950/80 shadow-[0_0_10px_rgba(34,211,238,0.5)] animate-pulse'
                      : isDraggingLever
                      ? 'border-amber-400/70 text-amber-300'
                      : 'border-cyan-500/40 text-pink-300'
                  }`}
                >
                  {isDraggingLever
                    ? leverProgress >= LEVER_ACTIVATION_THRESHOLD
                      ? '¡ENGANCHE!'
                      : `${Math.round(leverProgress * 100)}%`
                    : 'TIRAR ↓'}
                </span>
              </div>
            </div>

            {/* --------------------------------------------------------------- */}
            {/* CABINET SECTION D: PHYSICAL NEON CONTROL PANEL DECK (FIXED GEOMETRY) */}
            {/* --------------------------------------------------------------- */}
            <div className="relative z-10 rounded-2xl bg-gradient-to-b from-[#0f1926] via-[#09111b] to-[#050910] border-2 border-[#23475e] p-2.5 sm:p-3 shadow-[0_10px_25px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(103,232,249,0.22)] grid grid-cols-[1fr_auto] gap-2.5 sm:gap-3 items-stretch shrink-0">
              {/* Left Column: Fixed Two-Row Physical Neon Control Deck */}
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
                    className={`fort-arcade-btn w-20 sm:w-26 h-9 sm:h-10 rounded-lg border text-[10px] sm:text-[11px] font-fortunarium tracking-wider cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed shrink-0 whitespace-nowrap text-center ${
                      roomState.betMode === 'normal'
                        ? 'bg-[#082433] text-cyan-200 border-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.35)]'
                        : 'bg-[#0a1520] hover:bg-[#102133] text-cyan-100/90 border-cyan-500/45'
                    }`}
                  >
                    AP. MÍN
                  </button>

                  <button
                    type="button"
                    disabled={isBusy || !isMyTurn || roomState.betMode === 'normal'}
                    onClick={() => handleStepBetMode(-1)}
                    className="fort-arcade-btn w-8 sm:w-9 h-9 sm:h-10 rounded-lg bg-[#0a1520] hover:bg-[#102133] disabled:opacity-40 border border-cyan-400/55 text-cyan-300 flex items-center justify-center font-black cursor-pointer disabled:cursor-not-allowed shrink-0"
                    title="Reducir modo de apuesta"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  {/* Center Fixed CRT Cost Window: exact same width & height for all bet modes */}
                  <div className="fort-crt-display fort-dot-matrix px-2 py-0.5 rounded-lg border border-cyan-400/55 text-center w-32 sm:w-38 h-9 sm:h-10 flex flex-col justify-center shrink-0 overflow-hidden">
                    <div className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-cyan-300/90 truncate whitespace-nowrap">
                      {FORTUNARIUM_BET_MODES[roomState.betMode].shortLabel}
                    </div>
                    <div className="text-xs sm:text-sm font-mono font-black text-amber-300 tabular-nums leading-tight truncate whitespace-nowrap drop-shadow-[0_0_6px_rgba(251,191,36,0.4)]">
                      {currentSpinCost} CR
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isBusy || !isMyTurn || roomState.betMode === 'sobrecarga'}
                    onClick={() => handleStepBetMode(1)}
                    className="fort-arcade-btn w-8 sm:w-9 h-9 sm:h-10 rounded-lg bg-[#0a1520] hover:bg-[#102133] disabled:opacity-40 border border-cyan-400/55 text-cyan-300 flex items-center justify-center font-black cursor-pointer disabled:cursor-not-allowed shrink-0"
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
                    className={`fort-arcade-btn w-20 sm:w-26 h-9 sm:h-10 rounded-lg border text-[10px] sm:text-[11px] font-fortunarium tracking-wider cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed shrink-0 whitespace-nowrap text-center ${
                      roomState.betMode === 'sobrecarga'
                        ? 'bg-[#2a0b1d] text-pink-200 border-pink-400 shadow-[0_0_14px_rgba(236,72,153,0.45)]'
                        : 'bg-[#170c18] hover:bg-[#241126] text-pink-200/90 border-pink-500/45'
                    }`}
                  >
                    AP. MÁX
                  </button>
                </div>

                {/* Row 2: Physical Illuminated Utility Switches: REPARAR & TALLER */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={
                      isBusy ||
                      displayedIntegrity >= roomState.maxIntegrity ||
                      !isRepairCostValid ||
                      !repairValidation.allowed
                    }
                    onClick={() => {
                      if (!isRepairCostValid) return;
                      fortunariumAudio.playButtonClick();
                      onRepairMachine(false);
                    }}
                    className="fort-arcade-btn px-3 py-1.5 h-9 sm:h-10 rounded-lg bg-[#061f1c] hover:bg-[#0a2e29] disabled:opacity-45 border border-emerald-400/65 text-emerald-100 text-xs font-black flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed w-36 sm:w-44 shrink-0"
                    title={
                      displayedIntegrity >= roomState.maxIntegrity
                        ? 'Integridad al 100%'
                        : !repairValidation.allowed
                        ? repairValidation.reason || 'No permitido'
                        : `Reparar chasis por ${repairCostLabel}`
                    }
                  >
                    <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="text-left leading-tight min-w-0 truncate">
                      <div className="text-[10px] font-fortunarium tracking-wide uppercase truncate">
                        REPARAR
                      </div>
                      <div className="font-mono text-[11px] text-emerald-300 tabular-nums truncate">
                        {repairValidation.code === 'SPIN_RESERVE_REQUIRED'
                          ? `RESERVA ${repairValidation.minSpinReserve} CR`
                          : repairCostLabel}
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      fortunariumAudio.playButtonClick();
                      setShowWorkshopModal(true);
                    }}
                    className="fort-arcade-btn px-2.5 py-1.5 h-9 sm:h-10 rounded-lg bg-[#211508] hover:bg-[#301e0b] border border-amber-400/75 text-amber-100 text-xs font-black flex items-center justify-between gap-2 cursor-pointer min-w-[8.25rem] sm:min-w-[9.5rem] shrink-0"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Wrench className="w-4 h-4 text-amber-400 shrink-0" />
                      <div className="text-left leading-tight min-w-0 truncate">
                        <div className="text-[10px] sm:text-[11px] font-fortunarium tracking-wide uppercase truncate text-[#fff3d6]">
                          TALLER
                        </div>
                        <div className="font-mono text-[9.5px] text-amber-300/90 tabular-nums truncate">
                          {installedUpgrades.length} MEJ.
                        </div>
                      </div>
                    </div>

                    {/* Dedicated High-Contrast Key Badge */}
                    <span
                      className="inline-flex items-center justify-center gap-1 min-w-[2.5rem] px-2 py-1 rounded-md bg-[#060c14] border border-amber-400/70 shadow-[inset_0_1px_3px_rgba(0,0,0,0.9)] font-mono text-xs font-extrabold text-[#fff8e7] tabular-nums shrink-0"
                      title={`Llaves de taller: ${displayedKeys}`}
                    >
                      <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{displayedKeys}</span>
                    </span>
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
                      ? 'fort-girar-plunger text-white cursor-pointer'
                      : 'bg-[#121822] border-[2px] border-[#263547] text-slate-500 cursor-not-allowed opacity-75 shadow-[0_4px_0_#05080d]'
                  }`}
                >
                  <span className="font-fortunarium text-2xl sm:text-3xl tracking-widest leading-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.75)] select-none">
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
      {/* 2A-BIS. SHARED MALFUNCTION RESOLVED CONFIRMATION BANNER              */}
      {/* ===================================================================== */}
      {lastResolvedMalfunction && !roomState.activeIncident && (
        <div className="fixed top-16 inset-x-4 max-w-lg mx-auto z-[78] pointer-events-none flex justify-center">
          <div className="w-full rounded-xl bg-[#071219]/95 border-2 border-emerald-400/80 px-4 py-2.5 shadow-[0_12px_36px_rgba(0,0,0,0.9),0_0_24px_rgba(16,185,129,0.28)] flex items-center justify-between gap-3 backdrop-blur-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] font-mono font-black uppercase tracking-widest text-emerald-300">
                  AVERÍA COMPARTIDA RESUELTA POR {lastResolvedMalfunction.resolvedByPlayerName}
                </div>
                <div className="text-xs font-mono text-slate-100 truncate">
                  {lastResolvedMalfunction.outcomeText}
                </div>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/50 text-[10px] font-mono font-black text-emerald-300 shrink-0">
              ESTABLE ✓
            </span>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2B. SHARED INTERACTIVE MALFUNCTION OVERLAY (`roomState.activeIncident`) */}
      {/* ===================================================================== */}
      {roomState.activeIncident &&
        roomState.activeIncident.state !== 'RESOLVED' &&
        !roomState.activeIncident.resolved &&
        !isBusy &&
        (() => {
          const inc = roomState.activeIncident;
          const controls = inc.controls || [];
          const actionableControls = controls.filter((c) => c.isCorrectTarget !== false);
          const completedActionable = actionableControls.filter((c) => c.completed).length;
          const totalActionable = actionableControls.length;
          const isBlackout = inc.visualEffect === 'blackout' || inc.type === 'blackout';
          const isCrtGlitch =
            inc.visualEffect === 'crt_glitch' || inc.type === 'crt_interference';
          const isOverheat =
            inc.visualEffect === 'overheat' ||
            inc.type === 'overheating_warning' ||
            inc.type === 'sobrecalentamiento';

          return (
            <div
              className={`fixed inset-0 z-[76] flex items-center justify-center p-3 sm:p-4 transition-colors ${
                isBlackout
                  ? 'bg-black/92 backdrop-blur-md'
                  : 'bg-[#04070e]/85 backdrop-blur-md'
              }`}
            >
              {isCrtGlitch && (
                <div
                  className="pointer-events-none absolute inset-0 opacity-30"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(0deg, rgba(0,240,255,0.14) 0px, rgba(0,240,255,0.14) 2px, transparent 2px, transparent 6px)',
                  }}
                />
              )}

              <div
                className={`fort-cyber-modal relative w-full max-w-xl rounded-2xl p-4 sm:p-6 flex flex-col gap-4 border-2 ${
                  isOverheat
                    ? 'border-orange-500/85 shadow-[0_24px_60px_rgba(0,0,0,0.95),0_0_36px_rgba(249,115,22,0.32)]'
                    : isCrtGlitch
                    ? 'border-cyan-400/85 shadow-[0_24px_60px_rgba(0,0,0,0.95),0_0_36px_rgba(0,240,255,0.28)]'
                    : 'border-[#FF2A6D]/85 shadow-[0_24px_60px_rgba(0,0,0,0.95),0_0_36px_rgba(255,42,109,0.3)]'
                }`}
              >
                {/* Header bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded bg-[#260814] border border-[#FF2A6D]/70 text-[11px] font-mono font-black text-[#FF2A6D] uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      AVERÍA EN MÁQUINA COMPARTIDA
                    </span>
                    {inc.subtitle && (
                      <span className="text-[10px] font-mono font-bold text-cyan-300/90 uppercase tracking-wider hidden sm:inline">
                        · {inc.subtitle}
                      </span>
                    )}
                  </div>

                  {totalActionable > 0 && (
                    <span className="px-2.5 py-0.5 rounded bg-slate-900 border border-cyan-500/40 text-[11px] font-mono font-black text-cyan-300 tabular-nums">
                      REPARACIÓN: {completedActionable}/{totalActionable}
                    </span>
                  )}
                </div>

                {/* Title & concise description */}
                <div>
                  <h2 className="text-xl sm:text-2xl font-fortunarium text-amber-300 tracking-wide">
                    {inc.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-200 mt-1 leading-relaxed">
                    {inc.description}
                  </p>
                  {inc.instructionHint && (
                    <div className="mt-2.5 px-3 py-2 rounded-xl bg-cyan-950/45 border border-cyan-400/45 text-xs font-mono font-bold text-cyan-200 flex items-center justify-between gap-2">
                      <span>🔧 {inc.instructionHint}</span>
                      <span className="text-[10px] text-emerald-300 font-black uppercase shrink-0">
                        GRATIS · +{inc.stabilizeIntegrityBonus ?? 2}% INT
                      </span>
                    </div>
                  )}
                </div>

                {/* Interactive shared hardware controls */}
                {controls.length > 0 ? (
                  <div
                    className={`grid gap-2.5 ${
                      controls.length === 1
                        ? 'grid-cols-1'
                        : controls.length === 3
                        ? 'grid-cols-1 sm:grid-cols-3'
                        : 'grid-cols-1 sm:grid-cols-2'
                    }`}
                  >
                    {controls.map((ctrl) => {
                      const isDone = ctrl.completed;
                      const isDistractor = ctrl.isCorrectTarget === false;
                      const progressPct =
                        ctrl.targetValue > 0
                          ? Math.min(100, Math.round((ctrl.currentValue / ctrl.targetValue) * 100))
                          : 100;

                      return (
                        <button
                          key={ctrl.id}
                          type="button"
                          disabled={isDone}
                          onClick={() => {
                            if (isDone) return;
                            fortunariumAudio.playButtonClick();
                            if (onInteractIncident) {
                              onInteractIncident(inc.eventId || inc.id, ctrl.id);
                            } else {
                              onResolveIncident?.('INTERACTIVE_FIX', inc.eventId || inc.id);
                            }
                          }}
                          className={`p-3 rounded-xl border-2 text-left transition-all flex flex-col justify-between gap-2 ${
                            isDone && !isDistractor
                              ? 'bg-emerald-950/55 border-emerald-400/75 text-emerald-100 cursor-default'
                              : isDistractor
                              ? 'bg-slate-900/75 border-slate-700/70 text-slate-400 cursor-default opacity-75'
                              : ctrl.variant === 'bonus'
                              ? 'fort-arcade-btn bg-cyan-950/80 hover:bg-cyan-900/90 border-cyan-400 text-cyan-100 cursor-pointer shadow-[0_0_18px_rgba(0,240,255,0.2)]'
                              : ctrl.variant === 'primary'
                              ? 'fort-arcade-btn bg-amber-950/80 hover:bg-amber-900/85 border-amber-400 text-amber-100 cursor-pointer shadow-[0_0_18px_rgba(250,204,21,0.2)]'
                              : 'fort-arcade-btn bg-rose-950/85 hover:bg-rose-900/90 border-[#FF2A6D] text-rose-100 cursor-pointer shadow-[0_0_18px_rgba(255,42,109,0.25)]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-mono font-black uppercase tracking-wide">
                              {ctrl.label}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-black shrink-0 ${
                                isDone && !isDistractor
                                  ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/40'
                                  : isDistractor
                                  ? 'bg-slate-800 text-slate-400'
                                  : 'bg-amber-400/20 text-amber-300 border border-amber-400/50'
                              }`}
                            >
                              {ctrl.targetValue > 1
                                ? `${ctrl.currentValue}/${ctrl.targetValue}`
                                : ctrl.statusText || (isDone ? 'OK ✓' : 'ACTUAR')}
                            </span>
                          </div>

                          {ctrl.sublabel && (
                            <div className="text-[11px] text-slate-300/90 leading-snug">
                              {ctrl.sublabel}
                            </div>
                          )}

                          {ctrl.targetValue > 1 && (
                            <div className="w-full h-2 rounded-full bg-black/60 overflow-hidden border border-slate-700">
                              <div
                                className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-150"
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          )}

                          {ctrl.activatedByPlayerNames && ctrl.activatedByPlayerNames.length > 0 && (
                            <div className="text-[10px] font-mono text-emerald-300 truncate">
                              ✓ {ctrl.activatedByPlayerNames.join(', ')}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : null}

                {/* Secondary options footer (Emergency Containment or Absorb Impact) */}
                <div className="pt-2 border-t border-slate-800/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  <span className="text-[11px] font-mono text-slate-400">
                    Si un jugador resuelve la avería, desaparece al instante para toda la sala.
                  </span>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        fortunariumAudio.playButtonClick();
                        onResolveIncident?.('EMERGENCY_REPAIR', inc.eventId || inc.id);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-emerald-500/50 text-[11px] font-mono font-bold text-emerald-300 cursor-pointer transition"
                      title={`Contiene al instante por ${inc.emergencyRepairCost} CR (o 1 Llave) y reduce el impacto a -${inc.reducedDamage}% INT`}
                    >
                      🔧 Auto-Contener ({inc.emergencyRepairCost} CR)
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        fortunariumAudio.playButtonClick();
                        onResolveIncident?.('ABSORB_IMPACT', inc.eventId || inc.id);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900/80 border border-rose-500/50 text-[11px] font-mono font-bold text-rose-200 cursor-pointer transition"
                      title={`Ignora la reparación y sufre -${inc.integrityDamage}% Integridad`}
                    >
                      ⚡ Absorber (-{inc.integrityDamage}% INT)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

      {/* ===================================================================== */}
      {/* 2C. EFFECT ROULETTE OVERLAY (`roomState.activeRoulette`)              */}
      {/* ===================================================================== */}
      {roomState.activeRoulette && !isBusy && (
        <div className="fixed inset-0 z-[76] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="fort-cyber-modal w-full max-w-lg rounded-2xl p-5 sm:p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-2">
              <span className="px-3 py-1 rounded bg-[#1a0812] border border-[#FF2A6D]/65 text-xs font-mono font-black text-[#FF2A6D] uppercase tracking-wider">
                🎡 RULETA DE EFECTOS · {roomState.activeRoulette.triggeredByReason}
              </span>
            </div>

            {(() => {
              const modDef =
                FORTUNARIUM_MODIFIERS_CATALOG[roomState.activeRoulette.selectedModifierId];
              const isBuff = modDef?.type === 'BUFF';
              return (
                <div
                  className={`p-4 rounded-xl border-2 flex flex-col gap-2 ${
                    isBuff
                      ? 'bg-emerald-950/70 border-emerald-400 text-emerald-100'
                      : 'bg-rose-950/70 border-rose-500 text-rose-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-black uppercase tracking-wider">
                      {isBuff ? '✨ BONIFICADOR TEMPORAL' : '⚠️ PENALIZADOR TEMPORAL'}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-black/40 text-xs font-mono font-bold">
                      {modDef?.defaultSpins || 3} GIROS
                    </span>
                  </div>
                  <div className="text-2xl font-fortunarium tracking-wide text-white">
                    {modDef?.name || roomState.activeRoulette.selectedModifierId}
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed">{modDef?.effect}</p>
                </div>
              );
            })()}

            <button
              type="button"
              onClick={() => {
                fortunariumAudio.playButtonClick();
                onDismissRoulette?.();
              }}
              className="fort-arcade-btn w-full py-3 rounded-xl bg-[#FF2A6D] hover:bg-[#ff4782] border border-pink-200 text-white font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(255,42,109,0.45)] cursor-pointer"
            >
              Anotar en Hoja de Máquina y Continuar
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. INTERACTIVE MYSTERY EVENT MODAL (`EVENT_CHOICE`)                   */}
      {/* ===================================================================== */}
      {roomState.phase === 'EVENT_CHOICE' && roomState.activeEvent && !isBusy && (
        <div className="fixed inset-0 z-[75] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-2xl bg-[#08131f] border-[3px] border-cyan-400/65 p-5 sm:p-6 shadow-[0_24px_60px_rgba(0,0,0,0.95),0_0_28px_rgba(6,182,212,0.22)] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded bg-[#050d16] border border-cyan-400/50 text-xs font-black text-cyan-300 uppercase tracking-wider">
                Suceso Mecánico · Activado por {roomState.activeEvent.triggeredByPlayerName}
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-fortunarium text-amber-300 tracking-wide">
                {roomState.activeEvent.title.toUpperCase()}
              </h2>
              <p className="text-xs sm:text-sm text-cyan-100/90 mt-1 leading-relaxed">
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
                  className="fort-arcade-btn p-4 rounded-xl bg-[#0d1d2e] hover:bg-[#132940] border border-cyan-500/50 hover:border-cyan-300 text-left flex items-center justify-between gap-3 transition-all cursor-pointer"
                >
                  <div>
                    <div className="text-sm font-black text-white">{opt.label}</div>
                    <p className="text-xs text-cyan-200/80 mt-0.5">{opt.description}</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded font-mono text-xs font-black shrink-0 tabular-nums ${
                      opt.riskLevel === 'high'
                        ? 'bg-rose-950 text-rose-300 border border-rose-500/60'
                        : opt.riskLevel === 'medium'
                        ? 'bg-[#1f1608] text-amber-300 border border-amber-400/60'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-500/60'
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
          <div className="fort-cyber-modal w-full max-w-4xl rounded-2xl p-5 sm:p-6 flex flex-col gap-5 my-auto">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#FF2A6D]/40 pb-3">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-emerald-300">
                  ¡Cuota {roomState.round} Sellada! (Conserváis todos vuestros créditos)
                </span>
                <h2 className="text-2xl sm:text-3xl font-fortunarium text-white tracking-wide mt-0.5">
                  BANCO DE MONTAJE: ELEGID 1 PIEZA DE BUILD
                </h2>
              </div>

              <div className="flex items-center gap-3 font-mono text-sm font-black">
                <span className="fort-crt-display px-3 py-1.5 rounded-lg border border-cyan-400/55 text-amber-300 tabular-nums">
                  Caja: {roomState.money} CR
                </span>
                <span className="fort-crt-display px-3 py-1.5 rounded-lg border border-cyan-400/55 text-cyan-300 tabular-nums">
                  Llaves: {roomState.keys} 🔑
                </span>
              </div>
            </div>

            {roomState.offeredUpgradeIds.length > 0 ? (
              <div className="flex flex-col gap-3">
                <div className="p-3 rounded-2xl bg-[#1a0812] border border-[#FF2A6D]/50 text-xs sm:text-sm text-pink-100 flex items-center justify-between gap-2">
                  <span>
                    {roomState.players.filter((p) => p.isConnected).length > 1 ? (
                      <>
                        <strong className="text-[#FF2A6D]">Acuerdo Unánime Requerido:</strong> Todos los operadores conectados deben votar la <strong>misma mejora</strong> para instalarla gratis en la máquina.
                      </>
                    ) : (
                      <>
                        <strong className="text-[#FF2A6D]">Mejora Gratuita de Cuota:</strong> Elige 1 de las 3 mejoras aleatorias para especializar la máquina.
                      </>
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {roomState.offeredUpgradeIds.map((upId) => {
                    const meta = FORTUNARIUM_UPGRADES_CATALOG[upId];
                    const currentLv = roomState.upgrades[upId] || 0;
                    const upDetails = getUpgradeLevelDetails(upId, currentLv);
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
                            ? 'bg-[#210817] border-[#FF2A6D] shadow-[0_0_25px_rgba(255,42,109,0.4)] scale-[1.01]'
                            : 'fort-crt-panel border-cyan-500/40 hover:border-[#FF2A6D]/70'
                        }`}
                      >
                        <div className="flex flex-col gap-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <div className="w-12 h-12 rounded-2xl bg-[#040a12] border border-cyan-400/45 p-1.5 flex items-center justify-center shrink-0">
                              <img
                                src={FORTUNARIUM_SYMBOLS[meta.iconSymbol].asset}
                                alt={meta.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <span className="px-2 py-0.5 rounded-md bg-[#1f0815] border border-[#FF2A6D]/55 text-[10px] font-black uppercase text-pink-200">
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

                          <p className="text-xs text-cyan-100/85 leading-relaxed font-sans">
                            {meta.description}
                          </p>

                          <div className="p-2 rounded-xl bg-[#040a12] border border-cyan-500/35 flex flex-col gap-1 font-mono text-[11px] tabular-nums">
                            {upDetails.detailedLines.map((stat, sIdx) => (
                              <div key={sIdx} className="flex items-center justify-between gap-1.5">
                                <span className="text-cyan-200/75 truncate">{stat.label}:</span>
                                <span className="font-bold text-emerald-300 shrink-0">
                                  {stat.currentValue}
                                  {stat.nextValue ? ` → ${stat.nextValue}` : ''}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2.5 border-t border-cyan-500/25 flex flex-col gap-2">
                          <div className="flex flex-wrap items-center gap-1.5 min-h-[24px]">
                            {voters.length > 0 ? (
                              voters.map((v) => (
                                <span
                                  key={v.id}
                                  style={{ borderColor: v.color, color: v.color }}
                                  className="px-2 py-0.5 rounded-full bg-[#040a12] border text-[10px] font-black flex items-center gap-1"
                                >
                                  <span
                                    style={{ backgroundColor: v.color }}
                                    className="w-2 h-2 rounded-full"
                                  />
                                  {v.name}
                                </span>
                              ))
                            ) : (
                              <span className="text-[11px] text-cyan-300/60">Sin votos aún</span>
                            )}
                          </div>

                          <div
                            className={`w-full py-2 rounded-xl text-center text-xs font-black uppercase tracking-wider ${
                              myVote
                                ? 'bg-[#FF2A6D] text-white shadow-[0_0_14px_rgba(255,42,109,0.5)]'
                                : 'bg-[#091626] border border-[#FF2A6D]/50 text-pink-200'
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
                <p className="text-xs text-cyan-100/85">
                  Podéis abrir el Taller para gastar créditos/llaves extra o iniciar ya la Cuota{' '}
                  {roomState.round + 1}.
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#FF2A6D]/35">
              <button
                type="button"
                onClick={() => {
                  fortunariumAudio.playButtonClick();
                  setShowWorkshopModal(true);
                }}
                className="fort-arcade-btn px-4 py-2.5 rounded-xl bg-[#091524] hover:bg-[#10243b] border border-amber-400/55 text-amber-200 text-xs font-black flex items-center gap-2 cursor-pointer tabular-nums"
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
                className="fort-arcade-btn px-6 py-3 rounded-xl bg-[#FF2A6D] hover:bg-[#ff4782] disabled:bg-slate-800 disabled:text-slate-500 border border-pink-200 disabled:border-slate-700 text-white font-fortunarium text-sm tracking-wider shadow-[0_0_24px_rgba(255,42,109,0.45)] cursor-pointer disabled:cursor-not-allowed"
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
          className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
          onClick={() => setShowWorkshopModal(false)}
        >
          <div
            className="fort-cyber-modal w-full max-w-4xl rounded-2xl p-4 sm:p-6 flex flex-col gap-4 my-auto max-h-[90dvh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-[#FF2A6D]/40 pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#FF2A6D]">
                  Banco de Mantenimiento · Piezas y Engranajes (Hasta Nv. 10)
                </span>
                <h2 className="text-2xl sm:text-3xl font-fortunarium text-white tracking-wide">
                  TALLER MECÁNICO DEL FORTUNARIUM
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <span className="fort-crt-display px-3 py-1.5 rounded-lg border border-cyan-400/55 font-mono text-xs font-black text-amber-300 tabular-nums">
                  {smoothDisplayedMoney} CR
                </span>
                <span className="fort-crt-display px-3 py-1.5 rounded-lg border border-cyan-400/55 font-mono text-xs font-black text-cyan-300 tabular-nums">
                  {displayedKeys} 🔑
                </span>
                <button
                  type="button"
                  onClick={() => setShowWorkshopModal(false)}
                  className="fort-arcade-btn p-2 rounded-lg bg-[#1a0b14] hover:bg-[#2a1020] border border-[#FF2A6D]/65 text-[#FF2A6D] hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Repair Banner */}
            <div className="p-3.5 rounded-xl bg-[#061822] border border-emerald-400/55 flex flex-wrap items-center justify-between gap-3 shadow-inner">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-sm font-black text-white font-mono tabular-nums">
                    Integridad del Chasis: {smoothDisplayedIntegrity}% / {roomState.maxIntegrity}%
                  </div>
                  <div className="text-xs text-cyan-100/80">
                    Soldadura y ajuste: restaura +{25 + (roomState.upgrades.mecanico_jefe || 0) * 10}% de Integridad (Reparaciones en Cuota {roomState.round}: {roomState.repairsUsedInQuota || 0}).
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={
                      displayedIntegrity >= roomState.maxIntegrity ||
                      !isRepairCostValid ||
                      !repairValidation.allowed
                    }
                    onClick={() => {
                      if (!isRepairCostValid) return;
                      fortunariumAudio.playButtonClick();
                      onRepairMachine(false);
                    }}
                    title={!repairValidation.allowed ? repairValidation.reason : undefined}
                    className="fort-arcade-btn px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 border border-emerald-200 text-slate-950 font-mono font-black text-xs cursor-pointer disabled:cursor-not-allowed tabular-nums"
                  >
                    Reparar ({repairCostLabel})
                  </button>
                  <button
                    type="button"
                    disabled={displayedIntegrity >= roomState.maxIntegrity || displayedKeys < 1}
                    onClick={() => {
                      fortunariumAudio.playButtonClick();
                      onRepairMachine(true);
                    }}
                    className="fort-arcade-btn px-3.5 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:opacity-40 border border-yellow-100 text-slate-950 font-mono font-black text-xs cursor-pointer disabled:cursor-not-allowed tabular-nums"
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
                const upDetails = getUpgradeLevelDetails(upId, lv);
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
                    className="p-3.5 rounded-xl bg-[#0c1a29] border border-cyan-500/45 flex flex-col justify-between gap-3 shadow-[inset_0_1px_0_rgba(103,232,249,0.15)]"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="w-11 h-11 rounded-lg bg-[#050c14] border border-cyan-400/45 p-1.5 flex items-center justify-center shrink-0">
                          <img
                            src={FORTUNARIUM_SYMBOLS[meta.iconSymbol].asset}
                            alt={meta.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <span className="px-2 py-0.5 rounded bg-[#06121d] border border-cyan-400/50 text-[10px] font-mono font-black text-cyan-200 tabular-nums">
                          Nv. {lv}/{meta.maxLevel}
                        </span>
                      </div>

                      <div>
                        <div className="text-sm font-fortunarium text-white tracking-wide">
                          {meta.name.toUpperCase()}
                        </div>
                        <span className="text-[10px] font-bold uppercase text-amber-300">
                          {meta.effectSummary}
                        </span>
                        <p className="text-xs text-cyan-100/80 mt-1 leading-snug">
                          {meta.description}
                        </p>

                        <div className="mt-2 p-2 rounded-lg bg-[#050d16] border border-cyan-500/30 flex flex-col gap-1 font-mono text-[10.5px] tabular-nums">
                          {upDetails.detailedLines.map((stat, sIdx) => (
                            <div key={sIdx} className="flex items-center justify-between gap-1.5">
                              <span className="text-cyan-200/75 truncate">{stat.label}:</span>
                              <span className="font-bold text-emerald-300 shrink-0">
                                {stat.currentValue}
                                {stat.nextValue ? ` → ${stat.nextValue}` : ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {isMax ? (
                      <div className="py-2 rounded-lg bg-emerald-950/70 border border-emerald-400/60 text-center text-xs font-black text-emerald-300">
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
                            className="fort-arcade-btn py-2 rounded-lg bg-amber-400 hover:bg-amber-300 disabled:opacity-40 border border-yellow-100 text-slate-950 font-mono font-black text-xs cursor-pointer disabled:cursor-not-allowed tabular-nums"
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
                            className="fort-arcade-btn py-2 rounded-lg bg-[#140e24] hover:bg-[#21163b] disabled:opacity-40 border border-cyan-400/55 text-cyan-200 font-mono font-black text-xs cursor-pointer disabled:cursor-not-allowed tabular-nums"
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
      {/* 7. ANIMATED RIGHT-SIDE TEAM & CURSOR DRAWER (`showTeamDrawer`)        */}
      {/* ===================================================================== */}
      <div
        aria-hidden={!showTeamDrawer}
        className={`fixed inset-0 z-[75] flex justify-end transition-all duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          showTeamDrawer
            ? 'pointer-events-auto bg-black/55 backdrop-blur-[5px] opacity-100'
            : 'pointer-events-none bg-black/0 backdrop-blur-0 opacity-0'
        }`}
        onClick={() => {
          if (showTeamDrawer) {
            fortunariumAudio.playButtonClick();
            setShowTeamDrawer(false);
          }
        }}
      >
        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Panel de Equipo de Operadores"
          style={{
            width: 'min(430px, 100vw)',
            transform: showTeamDrawer ? 'translate3d(0, 0, 0)' : 'translate3d(100%, 0, 0)',
            transition: 'transform 380ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          className="h-full max-h-[100dvh] bg-[#070d17]/98 border-l-[3px] border-[#FF2A6D] p-5 flex flex-col justify-between gap-4 overflow-y-auto shadow-[-20px_0_60px_rgba(0,0,0,0.95),0_0_32px_rgba(255,42,109,0.25)] will-change-transform"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#FF2A6D]/40 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#FF2A6D]">
                  REGISTRO DE TURNOS EN VIVO
                </span>
                <h3 className="text-2xl font-fortunarium text-white tracking-wide">
                  EQUIPO DE OPERADORES
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  fortunariumAudio.playButtonClick();
                  setShowTeamDrawer(false);
                }}
                className="fort-arcade-btn p-2 rounded-lg bg-[#1a0b14] hover:bg-[#2a1020] border border-[#FF2A6D]/65 text-[#FF2A6D] hover:text-white cursor-pointer"
                title="Cerrar panel de equipo (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cursor Color Selector */}
            <div className="fort-crt-panel p-3.5 rounded-xl border border-cyan-500/40 flex flex-col gap-2.5">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-[#FF2A6D]" />
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
                      className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-transform ${
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
            <div className="flex flex-col gap-3">
              {displayedPlayers.map((p) => (
                <div
                  key={p.id}
                  className="fort-crt-panel p-3.5 rounded-xl border border-cyan-500/35 flex flex-col gap-2.5 shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/30"
                        style={{ backgroundColor: p.color }}
                      />
                      <span className="font-bold text-sm sm:text-base text-white truncate">
                        {p.name}
                      </span>
                      {p.id === localPlayerId && (
                        <span className="px-1.5 py-0.5 rounded bg-[#1f0815] border border-[#FF2A6D]/60 text-[10px] font-mono font-black text-[#FF2A6D] shrink-0">
                          TÚ
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-xs font-black text-cyan-300 tabular-nums shrink-0">
                      {p.stats.spinsTriggered} tiradas
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-cyan-500/20 font-mono text-xs tabular-nums">
                    <div>
                      <span className="text-[10px] font-bold text-cyan-200/75 block">Generado</span>
                      <span className="font-black text-emerald-300 text-xs sm:text-sm">
                        +{p.stats.totalMoneyGenerated} CR
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-cyan-200/75 block">
                        Gastado/Perd.
                      </span>
                      <span className="font-black text-rose-400 text-xs sm:text-sm">
                        -{p.stats.totalMoneyLost} CR
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-cyan-200/75 block">
                        Balance Neto
                      </span>
                      <span
                        className={`font-black text-xs sm:text-sm ${
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
        </aside>
      </div>

      {/* ===================================================================== */}
      {/* 8. EXIT CONFIRMATION MODAL (`showExitConfirmModal`)                   */}
      {/* ===================================================================== */}
      {showExitConfirmModal && (
        <div
          className="fixed inset-0 z-[85] bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setShowExitConfirmModal(false)}
        >
          <div
            className="fort-cyber-modal w-full max-w-md rounded-2xl p-6 flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-2xl font-fortunarium text-white tracking-wide">
              ¿SALIR DE LA PARTIDA?
            </h3>
            <p className="text-xs sm:text-sm text-cyan-100/85 leading-relaxed font-sans">
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
                className="fort-arcade-btn w-full py-3 px-4 rounded-xl bg-[#FF2A6D] hover:bg-[#ff4782] border border-pink-200 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,42,109,0.45)] cursor-pointer"
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
                className="fort-arcade-btn w-full py-3 px-4 rounded-xl bg-[#451414] hover:bg-[#5c1b1b] border border-rose-500 text-rose-100 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Abandonar Sala y Salir al Menú</span>
              </button>

              <button
                type="button"
                onClick={() => setShowExitConfirmModal(false)}
                className="fort-arcade-btn w-full py-2.5 px-4 rounded-xl bg-[#091524] hover:bg-[#10233a] border border-cyan-500/45 text-cyan-200 font-bold text-xs cursor-pointer"
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
      {showDevModal && (
        <div
          className="fixed inset-0 z-[90] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
          onClick={() => setShowDevModal(false)}
        >
          <div
            className="fort-cyber-modal w-full max-w-4xl rounded-3xl p-4 sm:p-6 flex flex-col gap-4 my-auto max-h-[92dvh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#FF2A6D]/40 pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase text-[#FF2A6D]">
                  ENTORNO DE PRUEBAS 100% AISLADO · SANDBOX
                </span>
                <h3 className="text-xl sm:text-2xl font-fortunarium text-white tracking-wide">
                  SIMULADOR DE PATRONES Y ECONOMÍA (FORTUNARIUM)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDevModal(false)}
                className="fort-arcade-btn p-2 rounded-xl bg-[#1a0b14] hover:bg-[#2a1020] border border-[#FF2A6D]/65 text-[#FF2A6D] hover:text-white cursor-pointer"
                title="Cerrar Simulador"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Non-Destructive Isolation Guarantee Banner */}
            <div className="p-3 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-xs font-mono text-emerald-200 flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <div className="font-bold text-emerald-300 uppercase tracking-wide">
                  ✓ SANDBOX COMPLETAMENTE AISLADA (CERO MUTACIÓN REAL)
                </div>
                <div className="text-[11px] text-emerald-100/90 leading-relaxed">
                  Las simulaciones operan únicamente en memoria de prueba. No modifican créditos reales ({roomState.money} CR), cuota ({roomState.quota} CR), estadísticas ni progreso del chasis.
                </div>
              </div>
              <span className="px-2 py-1 rounded bg-stone-900 border border-emerald-500/50 text-[10px] font-black text-emerald-300 shrink-0">
                CAJA REAL INTACTA
              </span>
            </div>

            {/* DEDICATED VISUAL SIMULATION SANDBOX WINDOW */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-stone-900/90 border border-stone-800 flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-fuchsia-500/20 border border-fuchsia-400/40 text-[10px] font-mono font-black text-fuchsia-300 uppercase">
                    SIMULACIÓN ACTUAL
                  </span>
                  <span className="text-xs sm:text-sm font-fortunarium text-amber-200">
                    {simResult ? simResult.scenarioName : 'Tablero Inicial (Listo para simular)'}
                  </span>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs tabular-nums">
                  <span className="px-2.5 py-1 rounded-lg bg-stone-950 border border-stone-700 text-stone-300">
                    Coste Hipotético:{' '}
                    <strong className="text-amber-400">
                      -{simResult ? simResult.spinCost : calculateEffectiveSpinCost(simBetMode, roomState.upgrades)} CR
                    </strong>
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-lg bg-stone-950 border ${
                      (simResult?.grossPayout || 0) > 0
                        ? 'border-emerald-500/50 text-emerald-300'
                        : 'border-stone-700 text-stone-400'
                    }`}
                  >
                    Premio Simulado:{' '}
                    <strong>
                      +{(simResult?.grossPayout || 0)} CR
                    </strong>
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-lg bg-stone-950 border font-bold ${
                      (simResult?.netDelta || 0) >= 0
                        ? 'border-emerald-500/50 text-emerald-400'
                        : 'border-rose-500/50 text-rose-400'
                    }`}
                  >
                    Neto Simulado:{' '}
                    <strong>
                      {simResult ? (simResult.netDelta >= 0 ? `+${simResult.netDelta}` : simResult.netDelta) : 0} CR
                    </strong>
                  </span>
                </div>
              </div>

              {/* 5x3 Simulated Reel Grid */}
              <div className="grid grid-cols-5 gap-1.5 sm:gap-2 p-2.5 sm:p-3 rounded-2xl bg-stone-950 border-2 border-stone-800 max-w-xl mx-auto w-full">
                {Array.from({ length: 3 }).map((_, rIdx) =>
                  Array.from({ length: 5 }).map((_, cIdx) => {
                    const symId = simGrid[cIdx]?.[rIdx] || 'cereza';
                    const symMeta = FORTUNARIUM_SYMBOLS[symId];
                    const isWinning = simResult?.winningCells.has(`${cIdx},${rIdx}`);
                    const isHazard = simResult?.hazardCells.has(`${cIdx},${rIdx}`);
                    return (
                      <div
                        key={`${cIdx}_${rIdx}`}
                        className={`relative aspect-square rounded-xl p-1 flex items-center justify-center transition-all ${
                          isWinning
                            ? 'bg-amber-500/25 border-2 border-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.6)] scale-[1.03]'
                            : isHazard
                            ? 'bg-rose-500/25 border-2 border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)]'
                            : 'bg-stone-900 border border-stone-800'
                        }`}
                        title={`${symMeta?.name || symId} (${cIdx + 1}, ${rIdx + 1})`}
                      >
                        {symMeta?.asset ? (
                          <img
                            src={symMeta.asset}
                            alt={symMeta.name}
                            className="w-full h-full object-contain pointer-events-none select-none"
                          />
                        ) : (
                          <span className="text-xl">🎰</span>
                        )}
                        {isWinning && (
                          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400 shadow" />
                        )}
                        {isHazard && (
                          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 shadow" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Detected Patterns & Special Effects in Sandbox */}
              <div className="flex flex-col gap-1.5 pt-1 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-stone-400 font-bold uppercase text-[10px]">
                    Patrones Detectados en Sandbox ({simResult?.winLines.length || 0}):
                  </span>
                  {simResult?.isJackpot && (
                    <span className="px-2 py-0.5 rounded bg-yellow-400 text-stone-950 font-black text-[10px] animate-pulse">
                      ¡JACKPOT SIMULADO!
                    </span>
                  )}
                </div>

                {simResult?.winLines && simResult.winLines.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {simResult.winLines.map((line, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 rounded bg-amber-500/20 border border-amber-400/40 text-amber-200 text-[11px] font-bold"
                      >
                        {line.patternType} ({FORTUNARIUM_SYMBOLS[line.symbolId]?.name || line.symbolId}) → +{line.payout} CR
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-[11px] text-stone-500 italic">
                    — Sin líneas ganadoras en esta tirada simulada —
                  </div>
                )}

                {simResult?.specialEffects && simResult.specialEffects.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1 border-t border-stone-800">
                    {simResult.specialEffects.map((fx, idx) => (
                      <span
                        key={idx}
                        className={`px-2 py-0.5 rounded border text-[10px] font-bold ${
                          fx.isPenalty
                            ? 'bg-rose-950/80 border-rose-500/50 text-rose-200'
                            : 'bg-sky-950/80 border-sky-500/50 text-sky-200'
                        }`}
                      >
                        {fx.description}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sandbox Controls: Bet Mode & Random Simulated Spin */}
            <div className="p-3.5 rounded-2xl bg-stone-900/90 border border-stone-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-bold uppercase text-stone-300">
                  Modo de Apuesta en Simulación:
                </span>
                <div className="flex items-center gap-1">
                  {(['normal', 'doble', 'sobrecarga'] as FortunariumBetMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setSimBetMode(mode);
                        fortunariumAudio.playButtonClick();
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold cursor-pointer transition ${
                        simBetMode === mode
                          ? 'bg-amber-400 text-stone-950 shadow'
                          : 'bg-stone-800 hover:bg-stone-700 text-stone-300'
                      }`}
                    >
                      {mode.toUpperCase()} ({calculateEffectiveSpinCost(mode, roomState.upgrades)} CR)
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRunSimulation()}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-amber-500 hover:from-fuchsia-500 hover:to-amber-400 text-stone-950 font-fortunarium text-xs font-black tracking-wider shadow-lg cursor-pointer transition active:scale-95"
              >
                🎲 TIRADA ALEATORIA SIMULADA
              </button>
            </div>

            {/* Deterministic Pattern & Special Symbol Test Scenarios */}
            <div className="flex flex-col gap-2">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Escenarios Deterministas de Prueba (Haz clic para simular al instante sin salir):
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
                    { id: 'force_bankruptcy', label: '💸 Bancarrota Sim.' },
                    { id: 'force_integrity_zero', label: '🔧 Avería 0% Sim.' },
                  ] as const
                ).map((sc) => (
                  <button
                    key={sc.id}
                    type="button"
                    onClick={() => handleRunSimulation(sc.id)}
                    className={`px-2.5 py-1.5 rounded-lg border text-[11px] font-mono font-bold cursor-pointer transition ${
                      simSelectedScenario === sc.id
                        ? 'bg-amber-400 text-stone-950 border-amber-300 shadow'
                        : 'bg-stone-900 hover:bg-stone-800 border-stone-700 text-amber-200'
                    }`}
                  >
                    {sc.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Automated Canonical Unit Tests */}
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

            {/* Monte Carlo Mass Simulations */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-stone-800">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setSimReport(
                      runFortunariumSimulation(10000, simBetMode, roomState.upgrades)
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
                      runFortunariumSimulation(100000, simBetMode, roomState.upgrades)
                    )
                  }
                  className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-mono text-xs font-black cursor-pointer"
                >
                  Simular 100.000 Tiradas
                </button>
                {onDevTriggerIncident && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        onDevTriggerIncident();
                        setShowDevModal(false);
                      }}
                      className="px-3 py-2 rounded-xl bg-rose-900/80 hover:bg-rose-800 border border-rose-500/50 text-rose-100 font-mono text-xs font-bold cursor-pointer"
                    >
                      ⚡ Avería Aleatoria
                    </button>
                    {(
                      [
                        { id: 'blackout', label: '🔌 Apagón' },
                        { id: 'fuse_failure', label: '🔥 Fusibles' },
                        { id: 'loose_cable', label: '🔗 Cable Suelto' },
                        { id: 'crt_interference', label: '📺 Sincro CRT' },
                        { id: 'electrical_interference', label: '⚡ Condensadores' },
                        { id: 'stuck_controls', label: '⚙️ Trinquete' },
                        { id: 'overheating_warning', label: '🌡️ Purga Térmica' },
                        { id: 'mechanical_obstruction', label: '🔩 Engranaje' },
                      ] as { id: FortunariumIncidentType; label: string }[]
                    ).map((malf) => (
                      <button
                        key={malf.id}
                        type="button"
                        onClick={() => {
                          onDevTriggerIncident(malf.id);
                          setShowDevModal(false);
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 border border-rose-500/40 text-rose-200 font-mono text-[11px] font-bold cursor-pointer"
                      >
                        {malf.label}
                      </button>
                    ))}
                  </>
                )}
                {onDevTriggerRoulette && (
                  <button
                    type="button"
                    onClick={() => {
                      onDevTriggerRoulette();
                      setShowDevModal(false);
                    }}
                    className="px-3 py-2 rounded-xl bg-cyan-900/80 hover:bg-cyan-800 border border-cyan-500/50 text-cyan-100 font-mono text-xs font-bold cursor-pointer"
                  >
                    🎡 Probar Ruleta
                  </button>
                )}
                {onDevForceOverdrive && (
                  <button
                    type="button"
                    onClick={() => {
                      onDevForceOverdrive();
                      setShowDevModal(false);
                    }}
                    className="px-3 py-2 rounded-xl bg-amber-900/80 hover:bg-amber-800 border border-amber-500/50 text-amber-100 font-mono text-xs font-bold cursor-pointer"
                  >
                    🔥 Forzar Sobrecarga Cuota
                  </button>
                )}
                {onDevSetIntegrity && (
                  <button
                    type="button"
                    onClick={() => {
                      onDevSetIntegrity(25);
                    }}
                    className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 font-mono text-xs font-bold cursor-pointer"
                  >
                    🔧 INT 25%
                  </button>
                )}
                {onDevGrantModifier && (
                  <button
                    type="button"
                    onClick={() => {
                      onDevGrantModifier('fiebre_cerezas', localPlayerId);
                    }}
                    className="px-3 py-2 rounded-xl bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-500/50 text-emerald-100 font-mono text-xs font-bold cursor-pointer"
                  >
                    🍒 +Fiebre Cerezas
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowDevModal(false)}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-mono text-xs font-bold cursor-pointer"
              >
                Cerrar Simulador
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
        upgrades={roomState.upgrades}
        betMode={roomState.betMode}
        currentVoltage={displayedVoltage}
        activeModifiers={roomState.activeModifiers}
      />
      <FortunariumAudioModal
        isOpen={showAudioModal}
        onClose={() => setShowAudioModal(false)}
      />
    </div>
  );
};
