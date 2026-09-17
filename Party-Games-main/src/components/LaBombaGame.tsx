import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Player, LetterSequence, UsedWord, GameStats, BombDangerLevel, GameConfig } from '../types';
import { getNextSequence, getRandomSequence } from '../data/sequences';
import { validateSpanishWordAsync } from '../utils/validation';
import { audio } from '../utils/audio';
import { BombVisual } from './BombVisual';
import { PlayerRing } from './PlayerRing';
import { MobilePlayerGrid } from './MobilePlayerGrid';
import { WordInput } from './WordInput';
import { RoundIntroModal } from './RoundIntroModal';
import { ExplosionOverlay } from './ExplosionOverlay';
import { GameOverView } from './GameOverView';
import { SoundToggle } from './SoundToggle';
import { HowToPlayModal } from './HowToPlayModal';
import { AlphabetPanel } from './AlphabetPanel';
import { AlphabetRewardModal } from './AlphabetRewardModal';
import { calculateAlphabetProgress } from '../utils/alphabet';
import { HelpCircle, ArrowLeft, AlertTriangle, CheckCircle2, Trophy, ChevronRight } from 'lucide-react';

interface LaBombaGameProps {
  initialPlayers: Player[];
  gameConfig?: GameConfig;
  onBackToMenu: () => void;
}

// Random hidden bomb duration between 60 seconds (1 min) and 180 seconds (3 min)
// Continuous non-integer random value within [60, 180] seconds
const getRandomBombDurationMs = () => (60 + Math.random() * 120) * 1000;

export const LaBombaGame: React.FC<LaBombaGameProps> = ({
  initialPlayers,
  onBackToMenu,
}) => {
  // Game state
  const [players, setPlayers] = useState<Player[]>(() =>
    initialPlayers.map((p) => ({ ...p, lastValidWord: null }))
  );
  const [activePlayerIndex, setActivePlayerIndex] = useState<number>(0);

  // Sequences tracking across the match
  const [usedSequences, setUsedSequences] = useState<Set<string>>(() => new Set());
  const [playerRecentSequences, setPlayerRecentSequences] = useState<Record<string, string[]>>({});

  const [currentSequence, setCurrentSequence] = useState<LetterSequence>(() => {
    const initial = getRandomSequence();
    return initial;
  });

  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [usedWords, setUsedWords] = useState<UsedWord[]>([]);

  // Accepted word banner (brief floating feedback; does not pause game)
  const [acceptedWordBanner, setAcceptedWordBanner] = useState<{
    word: string;
    player: string;
    bonusLetters?: number;
  } | null>(null);

  // Reto del Abecedario states
  const [recentlyUnlockedLetters, setRecentlyUnlockedLetters] = useState<string[]>([]);
  const [alphabetRewardCelebration, setAlphabetRewardCelebration] = useState<{
    player: Player;
    gainedLife: boolean;
  } | null>(null);
  const [isMobileAlphabetOpen, setIsMobileAlphabetOpen] = useState<boolean>(false);
  const [isDesktopAlphabetOpen, setIsDesktopAlphabetOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1340;
    }
    return true;
  });

  // Phases: 'ROUND_INTRO' | 'PLAYING' | 'EXPLOSION' | 'GAME_OVER'
  const [phase, setPhase] = useState<'ROUND_INTRO' | 'PLAYING' | 'EXPLOSION' | 'GAME_OVER'>('ROUND_INTRO');
  const [affectedPlayer, setAffectedPlayer] = useState<Player | null>(null);

  // GLOBAL CONTINUOUS BOMB TIMER:
  // Random hidden duration between 60s and 180s (1 to 3 minutes)
  // Shared across ALL players. ACERTAR UNA PALABRA NO REINICIA LA MECHA.
  const [bombDurationMs, setBombDurationMs] = useState<number>(getRandomBombDurationMs);
  const [bombRemainingMs, setBombRemainingMs] = useState<number>(bombDurationMs);

  const bombDurationRef = useRef<number>(bombDurationMs);
  const bombRemainingRef = useRef<number>(bombDurationMs);
  const lastUpdateTimestampRef = useRef<number>(Date.now());
  const activeMultiplierRef = useRef<number>(1.0);

  const [turnStartTime, setTurnStartTime] = useState<number>(Date.now());

  // Real-time live typing state for the active player
  const [currentTypingWord, setCurrentTypingWord] = useState<string>('');

  // Input & validation state
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | null;
    message: string;
    canonicalWord?: string;
  }>({ type: null, message: '' });

  // Stats tracking
  const [totalValidWords, setTotalValidWords] = useState(0);
  const [totalMistakes, setTotalMistakes] = useState(0);
  const [totalExplosions, setTotalExplosions] = useState(0);
  const [fastestAnswer, setFastestAnswer] = useState<{
    playerName: string;
    playerColor: string;
    timeSeconds: number;
    word: string;
  } | null>(null);

  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);

  const activePlayer = players[activePlayerIndex] || players[0];

  // Keep activeMultiplierRef in sync with current player's multiplier
  useEffect(() => {
    activeMultiplierRef.current = activePlayer?.multiplier || 1.0;
  }, [activePlayer?.multiplier]);

  // Helper to find next surviving player clockwise
  const getNextSurvivingIndex = useCallback((startIndex: number, currentPlayers: Player[]) => {
    const total = currentPlayers.length;
    for (let i = 1; i <= total; i++) {
      const candidateIdx = (startIndex + i) % total;
      if (!currentPlayers[candidateIdx].isEliminated) {
        return candidateIdx;
      }
    }
    return startIndex;
  }, []);

  const alivePlayers = players.filter((p) => !p.isEliminated);

  // Progress fraction of the global continuous bomb (0 to 1.0)
  // Represents the single continuous fuse lifecycle shared across all players
  const progress = Math.min(1.0, Math.max(0, 1 - bombRemainingMs / bombDurationMs));

  // Danger level derived from continuous progress
  const dangerLevel: BombDangerLevel =
    progress >= 0.88
      ? 'CRITICAL'
      : progress >= 0.70
      ? 'DANGER'
      : progress >= 0.40
      ? 'MIDDLE'
      : 'EARLY';

  // Sound ticking effect during active play (speeds up with danger level and player mistake multiplier)
  const lastTickRef = useRef<number>(0);
  useEffect(() => {
    if (phase !== 'PLAYING') return;

    const now = Date.now();
    let tickInterval = 1000;
    if (dangerLevel === 'CRITICAL') tickInterval = 240;
    else if (dangerLevel === 'DANGER') tickInterval = 450;
    else if (dangerLevel === 'MIDDLE') tickInterval = 750;

    const currentMultiplier = activePlayer?.multiplier || 1.0;
    tickInterval = Math.max(100, Math.round(tickInterval / Math.min(currentMultiplier, 2.5)));

    if (now - lastTickRef.current > tickInterval) {
      lastTickRef.current = now;
      if (dangerLevel === 'CRITICAL' || dangerLevel === 'DANGER') {
        audio.playBombWarning(dangerLevel === 'CRITICAL' ? 1.4 : 1.0);
      } else {
        audio.playSpark();
      }
    }
  }, [phase, bombRemainingMs, dangerLevel, activePlayer?.multiplier]);

  // Trigger explosion
  const triggerExplosion = useCallback(() => {
    const explodingPlayer = players[activePlayerIndex];
    if (!explodingPlayer) return;

    setTotalExplosions((prev) => prev + 1);

    const updatedLives = Math.max(0, explodingPlayer.lives - 1);
    const isNowEliminated = updatedLives === 0;

    const updatedPlayers = players.map((p, idx) => {
      if (idx !== activePlayerIndex) return p;
      return {
        ...p,
        lives: updatedLives,
        bombsReceived: p.bombsReceived + 1,
        isEliminated: isNowEliminated,
      };
    });

    setPlayers(updatedPlayers);
    setAffectedPlayer(explodingPlayer);
    setCurrentTypingWord('');
    setPhase('EXPLOSION');
  }, [activePlayerIndex, players]);

  // Main global continuous bomb timer engine:
  // 1. ONE single timer running continuously across all player turns
  // 2. High-precision delta-timestamp timing
  // 3. Consumed bomb time = elapsedRealTime * activePlayerMultiplier
  // 4. Valid answers NEVER reset or pause the timer
  // 5. Changing turn NEVER resets or pauses the timer
  // 6. Only resets AFTER the bomb explodes!
  useEffect(() => {
    if (phase !== 'PLAYING') return;

    lastUpdateTimestampRef.current = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedRealTime = Math.max(0, now - lastUpdateTimestampRef.current);
      lastUpdateTimestampRef.current = now;

      const currentMultiplier = activeMultiplierRef.current;
      const consumedBombTime = elapsedRealTime * currentMultiplier;

      const updatedRemaining = Math.max(0, bombRemainingRef.current - consumedBombTime);
      bombRemainingRef.current = updatedRemaining;
      setBombRemainingMs(updatedRemaining);

      if (updatedRemaining <= 0) {
        clearInterval(interval);
        triggerExplosion();
      }
    }, 25);

    return () => clearInterval(interval);
  }, [phase, triggerExplosion]);

  // When explosion modal finishes -> start new round with fresh sequence, clear words, and BRAND NEW BOMB TIMER
  const handleExplosionDismiss = () => {
    const remainingAlive = players.filter((p) => !p.isEliminated);

    if (remainingAlive.length <= 1) {
      setPhase('GAME_OVER');
      return;
    }

    const nextIdx = getNextSurvivingIndex(activePlayerIndex, players);
    setActivePlayerIndex(nextIdx);

    const nextStartingPlayer = players[nextIdx];

    // Pick brand new letter sequence for the new round's starting player
    const nextSeq = getNextSequence({
      usedSequences,
      previousSequence: currentSequence.sequence,
      playerRecentSequences: playerRecentSequences[nextStartingPlayer.id] || [],
    });

    setUsedSequences((prev) => new Set(prev).add(nextSeq.sequence));
    setPlayerRecentSequences((prev) => ({
      ...prev,
      [nextStartingPlayer.id]: [
        ...(prev[nextStartingPlayer.id] || []).slice(-4),
        nextSeq.sequence,
      ],
    }));

    setCurrentSequence(nextSeq);
    setRoundNumber((prev) => prev + 1);

    // RESET WORDS ON NEW ROUND:
    // 1. Clear used words list
    setUsedWords([]);
    // 2. Reset player mistakes and last valid words for the new round
    setPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        mistakes: 0,
        multiplier: 1.0,
        lastValidWord: null,
      }))
    );

    // RESET BOMB TIMER:
    // Only after explosion does the bomb reset to a NEW random duration between 60s and 180s!
    const newDuration = getRandomBombDurationMs();
    setBombDurationMs(newDuration);
    setBombRemainingMs(newDuration);
    bombDurationRef.current = newDuration;
    bombRemainingRef.current = newDuration;
    lastUpdateTimestampRef.current = Date.now();
    activeMultiplierRef.current = 1.0;

    setAcceptedWordBanner(null);
    setFeedback({ type: null, message: '' });
    setCurrentTypingWord('');

    setPhase('ROUND_INTRO');
  };

  // Word submission handler
  const handleWordSubmit = async (word: string) => {
    if (phase !== 'PLAYING' || isValidating) return;

    setIsValidating(true);

    const validation = await validateSpanishWordAsync(
      word,
      currentSequence.sequence,
      usedWords.map((item) => item.word)
    );

    setIsValidating(false);

    // If game phase changed during validation (e.g. bomb exploded), abort
    if (phase !== 'PLAYING') return;

    // IF ANSWER IS INVALID:
    // +1 FALLO
    // DO NOT change the required letters
    // DO NOT change player
    // same player must try again with the SAME letters
    // THE GLOBAL BOMB CONTINUES BURNING at the accelerated multiplier!
    if (!validation.valid) {
      audio.playAnswerRejected();

      const newMistakes = activePlayer.mistakes + 1;
      const newMultiplier = Math.pow(1.5, newMistakes);

      setTotalMistakes((prev) => prev + 1);

      // Accelerate active multiplier immediately on active player's turn
      activeMultiplierRef.current = newMultiplier;

      setPlayers((prev) =>
        prev.map((p, idx) => {
          if (idx !== activePlayerIndex) return p;
          return {
            ...p,
            mistakes: newMistakes,
            multiplier: newMultiplier,
          };
        })
      );

      setFeedback({
        type: 'error',
        message: validation.reason || 'Palabra no válida',
      });

      return;
    }

    // VALID ANSWER!
    audio.playAnswerAccepted();
    const answerTimeSeconds = Math.max(0.3, (Date.now() - turnStartTime) / 1000);
    const acceptedCanonical = validation.canonicalAnswer || word;

    setTotalValidWords((prev) => prev + 1);

    // Update fastest answer stat
    if (!fastestAnswer || answerTimeSeconds < fastestAnswer.timeSeconds) {
      setFastestAnswer({
        playerName: activePlayer.name,
        playerColor: activePlayer.color,
        timeSeconds: answerTimeSeconds,
        word: acceptedCanonical,
      });
    }

    // RETO DEL ABECEDARIO: Update progress for the active player
    const alphabetUpdate = calculateAlphabetProgress(
      activePlayer.alphabetProgress || [],
      acceptedCanonical
    );

    let updatedLives = activePlayer.lives;
    let gainedLifeFromAlphabet = false;
    let finalAlphabetProgress = alphabetUpdate.updatedProgress;

    if (alphabetUpdate.newLetters.length > 0) {
      setRecentlyUnlockedLetters(alphabetUpdate.newLetters);
      setTimeout(() => setRecentlyUnlockedLetters([]), 3500);
    }

    if (alphabetUpdate.isCompleted) {
      // Completed all 27 letters! +1 Vida (max 3)
      if (updatedLives < 3) {
        updatedLives += 1;
        gainedLifeFromAlphabet = true;
      }
      audio.playAlphabetComplete();

      // Reset alphabet progress for this player so they can challenge it again
      finalAlphabetProgress = [];

      const celebratedPlayer: Player = {
        ...activePlayer,
        lives: updatedLives,
        alphabetProgress: [],
      };
      setAlphabetRewardCelebration({
        player: celebratedPlayer,
        gainedLife: gainedLifeFromAlphabet,
      });
    } else if (alphabetUpdate.newLetters.length > 0) {
      audio.playAlphabetLetterUnlock();
    }

    // Update player's valid words count, last valid word, lives, and alphabet progress
    setPlayers((prev) =>
      prev.map((p, idx) => {
        if (idx !== activePlayerIndex) return p;
        const currentBest = p.fastestAnswerTimeMs;
        const newBestMs = Math.round(answerTimeSeconds * 1000);
        return {
          ...p,
          lives: updatedLives,
          validWordsCount: p.validWordsCount + 1,
          fastestAnswerTimeMs: currentBest ? Math.min(currentBest, newBestMs) : newBestMs,
          lastValidWord: acceptedCanonical.toLowerCase(),
          alphabetProgress: finalAlphabetProgress,
        };
      })
    );

    // Add to used words history for the current round
    const newUsedWord: UsedWord = {
      word: word,
      canonicalWord: acceptedCanonical,
      playerId: activePlayer.id,
      playerName: activePlayer.name,
      playerColor: activePlayer.color,
      timestamp: Date.now(),
    };
    setUsedWords((prev) => [newUsedWord, ...prev]);

    // Show brief accepted word feedback with bonus letters count if any
    setAcceptedWordBanner({
      word: acceptedCanonical.toUpperCase(),
      player: activePlayer.name,
      bonusLetters: alphabetUpdate.newLetters.length,
    });
    setFeedback({
      type: 'success',
      message:
        alphabetUpdate.newLetters.length > 0
          ? `¡Palabra aceptada! (+${alphabetUpdate.newLetters.length} ${
              alphabetUpdate.newLetters.length === 1 ? 'letra nueva' : 'letras nuevas'
            })`
          : '¡Palabra aceptada!',
      canonicalWord: acceptedCanonical,
    });

    // PASS TURN IMMEDIATELY — THE GLOBAL BOMB CONTINUES BURNING WITHOUT PAUSE!
    // 1. Identify the next surviving player
    const nextPlayerIndex = getNextSurvivingIndex(activePlayerIndex, players);
    const nextPlayer = players[nextPlayerIndex];

    // 2. Adjust active multiplier to the next player's multiplier immediately
    activeMultiplierRef.current = nextPlayer.multiplier || 1.0;

    // 3. Generate a brand new letter sequence for the NEXT PLAYER
    const nextSeq = getNextSequence({
      usedSequences,
      previousSequence: currentSequence.sequence,
      playerRecentSequences: playerRecentSequences[nextPlayer.id] || [],
    });

    setUsedSequences((prev) => new Set(prev).add(nextSeq.sequence));
    setPlayerRecentSequences((prev) => ({
      ...prev,
      [nextPlayer.id]: [
        ...(prev[nextPlayer.id] || []).slice(-4),
        nextSeq.sequence,
      ],
    }));

    // 4. Update the sequence and active player immediately
    // Next player can type right away; bomb timer NEVER pauses!
    setCurrentSequence(nextSeq);
    setActivePlayerIndex(nextPlayerIndex);
    setCurrentTypingWord('');
    setTurnStartTime(Date.now());
    audio.playTurnChange();

    // Clear feedback after brief moment
    setTimeout(() => {
      setFeedback({ type: null, message: '' });
    }, 800);

    // Hide accepted word banner after brief display
    setTimeout(() => {
      setAcceptedWordBanner(null);
    }, 1200);
  };

  // Rematch action
  const handleRematch = () => {
    const resetPlayers: Player[] = initialPlayers.map((p) => ({
      ...p,
      lives: 3,
      mistakes: 0,
      multiplier: 1.0,
      isEliminated: false,
      bombsReceived: 0,
      validWordsCount: 0,
      fastestAnswerTimeMs: null,
      lastValidWord: null,
      alphabetProgress: [],
    }));

    setPlayers(resetPlayers);
    setActivePlayerIndex(0);
    setRecentlyUnlockedLetters([]);
    setAlphabetRewardCelebration(null);
    setIsMobileAlphabetOpen(false);

    const initialSeq = getRandomSequence();
    setCurrentSequence(initialSeq);
    setUsedSequences(new Set([initialSeq.sequence]));
    setPlayerRecentSequences({});
    setRoundNumber(1);
    setUsedWords([]);
    setTotalValidWords(0);
    setTotalMistakes(0);
    setTotalExplosions(0);
    setFastestAnswer(null);

    // Generate brand new bomb duration 60-180s
    const newDuration = getRandomBombDurationMs();
    setBombDurationMs(newDuration);
    setBombRemainingMs(newDuration);
    bombDurationRef.current = newDuration;
    bombRemainingRef.current = newDuration;
    lastUpdateTimestampRef.current = Date.now();
    activeMultiplierRef.current = 1.0;

    setAcceptedWordBanner(null);
    setTurnStartTime(Date.now());
    setFeedback({ type: null, message: '' });
    setCurrentTypingWord('');

    setPhase('ROUND_INTRO');
  };

  const finalStats: GameStats = {
    winner: alivePlayers.length === 1 ? alivePlayers[0] : null,
    totalValidWords,
    totalMistakes,
    totalExplosions,
    fastestAnswer,
    mostBurntPlayer: players.reduce<{ player: Player; explosions: number } | null>(
      (acc, p) => {
        if (!acc || p.bombsReceived > acc.explosions) {
          return { player: p, explosions: p.bombsReceived };
        }
        return acc;
      },
      null
    ),
  };

  if (phase === 'GAME_OVER') {
    return (
      <GameOverView
        stats={finalStats}
        players={players}
        onRematch={handleRematch}
        onBackToMenu={onBackToMenu}
      />
    );
  }

  return (
    <div className="relative min-h-screen min-h-dvh w-full flex flex-col justify-between p-2.5 sm:p-4 md:p-6 bg-radial from-slate-900 via-slate-950 to-black text-slate-100 overflow-x-hidden select-none">
      {/* Danger Screen Vignette */}
      {dangerLevel === 'CRITICAL' && (
        <div className="fixed inset-0 pointer-events-none border-4 border-rose-600/40 animate-pulse z-40" />
      )}

      {/* Accepted Word Banner floating notification */}
      <AnimatePresence>
        {acceptedWordBanner && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="fixed top-14 md:top-16 left-1/2 -translate-x-1/2 z-50 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full bg-emerald-500 text-slate-950 font-black text-xs sm:text-sm shadow-2xl flex items-center gap-2 border-2 border-emerald-300 pointer-events-none"
          >
            <CheckCircle2 className="w-4 h-4 text-slate-950 shrink-0" />
            <span>✓ {acceptedWordBanner.word}</span>
            <span className="opacity-75 font-bold">({acceptedWordBanner.player})</span>
            {acceptedWordBanner.bonusLetters !== undefined && acceptedWordBanner.bonusLetters > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-emerald-950/40 text-emerald-100 text-[11px] font-extrabold border border-emerald-300/40">
                +{acceptedWordBanner.bonusLetters} {acceptedWordBanner.bonusLetters === 1 ? 'letra' : 'letras'}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation modal before exiting to menu */}
      {confirmExit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm p-6 rounded-3xl bg-slate-900 border-2 border-slate-700 text-center">
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <h3 className="text-xl font-black font-display text-white mb-1">
              ¿Salir al menú principal?
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Se perderá el progreso de la partida actual.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={() => setConfirmExit(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm cursor-pointer"
              >
                Continuar jugando
              </button>
              <button
                type="button"
                onClick={onBackToMenu}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm cursor-pointer shadow-lg shadow-rose-600/30"
              >
                Salir al menú
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 1. DESKTOP / TABLET LAYOUT (>= 768px: hidden md:flex)                */}
      {/* Spacious radial layout with players positioned around the central bomb*/}
      {/* ==================================================================== */}
      <div className="hidden md:flex flex-col flex-1 w-full min-h-screen relative z-10 overflow-x-hidden">
        {/* Desktop Top Header Bar */}
        <header className="relative z-30 flex items-center justify-between w-full max-w-7xl mx-auto px-4 md:px-6 pb-2 border-b border-slate-800/60">
          <button
            id="pause-menu-button"
            type="button"
            onClick={() => setConfirmExit(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-md active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Menú</span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Desktop alphabet trigger button (toggles independent left sidebar) */}
            <button
              type="button"
              onClick={() => setIsDesktopAlphabetOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/90 hover:bg-slate-700 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
              title="Mostrar u ocultar Reto del Abecedario"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>
                Abecedario ({activePlayer.name}: {(activePlayer.alphabetProgress || []).length}/27)
              </span>
            </button>

            <span className="text-xs font-black px-3 py-1 rounded-full bg-slate-800/90 text-amber-400 border border-slate-700 shadow-sm">
              Ronda #{roundNumber}
            </span>
            <button
              id="game-how-to-play-button"
              type="button"
              onClick={() => setShowHowToPlay(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-md active:scale-95"
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>Reglas</span>
            </button>
            <SoundToggle />
          </div>
        </header>

        {/* ================================================================== */}
        {/* 1. INDEPENDENT LEFT SIDEBAR: RETO DEL ABECEDARIO                    */}
        {/* Sits close to the left edge of the viewport (left: 16-24px).        */}
        {/* Does NOT participate in the centering calculation of the main game. */}
        {/* ================================================================== */}
        {isDesktopAlphabetOpen ? (
          <aside
            aria-label="Panel del Abecedario"
            className="fixed left-4 xl:left-5 2xl:left-6 top-16 z-30 flex flex-col transition-all duration-300 ease-out"
          >
            <AlphabetPanel
              players={players}
              activePlayerIndex={activePlayerIndex}
              recentlyUnlockedLetters={recentlyUnlockedLetters}
              isCollapsible={true}
              onToggleCollapse={() => setIsDesktopAlphabetOpen(false)}
            />
          </aside>
        ) : (
          /* Sleek docked button on the left edge when sidebar is collapsed */
          <button
            type="button"
            onClick={() => setIsDesktopAlphabetOpen(true)}
            className="fixed left-3 xl:left-4 top-20 z-30 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/95 border border-amber-500/50 text-amber-300 font-display font-bold text-xs shadow-2xl backdrop-blur-md hover:border-amber-400 hover:bg-slate-800 transition-all cursor-pointer group select-none"
            title="Abrir Reto del Abecedario"
            aria-label="Abrir Reto del Abecedario"
          >
            <Trophy className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="hidden xl:inline">Abecedario</span>
            <span className="bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-md text-[10px] font-black">
              {(activePlayer?.alphabetProgress || []).length}/27
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
          </button>
        )}

        {/* ================================================================== */}
        {/* 2. TRUE SCREEN-CENTRED MAIN GAME CONTAINER                          */}
        {/* Center of this container corresponds to exactly 50vw of viewport   */}
        {/* The bomb and player ring visually sit in horizontal centre of screen*/}
        {/* ================================================================== */}
        <main className="relative flex-1 flex flex-col items-center justify-between w-full max-w-4xl lg:max-w-5xl mx-auto px-4 my-auto z-20">
          {/* Desktop Required Letters Section - Centred on Screen */}
          <section
            aria-label="Letras obligatorias"
            className="relative z-30 flex flex-col items-center justify-center mt-3 mb-2 select-none"
          >
            <div className="px-12 py-4 md:px-18 md:py-5 rounded-3xl bg-slate-900/90 border-2 border-amber-400/80 shadow-[0_0_35px_rgba(245,158,11,0.25)] flex flex-col items-center backdrop-blur-md">
              <span className="text-xs md:text-sm font-black tracking-[0.25em] text-amber-300 uppercase mb-0.5">
                PALABRAS CON
              </span>

              <div className="relative overflow-hidden flex items-center justify-center min-h-[85px] md:min-h-[100px] min-w-[240px] md:min-w-[300px]">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={currentSequence.sequence}
                    initial={{ y: 35, opacity: 0, scale: 0.85 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    exit={{ y: -35, opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.26, ease: 'easeOut' }}
                    className="text-7xl md:text-8xl font-black font-display tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-300 to-orange-500 drop-shadow-[0_0_24px_rgba(245,158,11,0.65)]"
                  >
                    {currentSequence.sequence}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </section>

          {/* Central Arena: Radial Players + Central Bomb (Centered at 50vw) */}
          <div className="relative w-full flex items-center justify-center my-1">
            <PlayerRing
              players={players}
              activePlayerIndex={activePlayerIndex}
              currentTypingWord={currentTypingWord}
            />

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
              <BombVisual
                progress={progress}
                dangerLevel={dangerLevel}
                speedMultiplier={activePlayer?.multiplier || 1.0}
              />
            </div>
          </div>

          {/* Desktop Word Input - Centred on Screen */}
          <div className="w-full max-w-2xl mt-3 mb-2">
            <WordInput
              onWordSubmit={handleWordSubmit}
              disabled={phase !== 'PLAYING'}
              isValidating={isValidating}
              activePlayerName={activePlayer?.name || ''}
              requiredSequence={currentSequence.sequence}
              feedback={feedback}
              usedWords={usedWords}
              currentTypingWord={currentTypingWord}
              onTypingChange={setCurrentTypingWord}
            />
          </div>
        </main>
      </div>

      {/* ==================================================================== */}
      {/* 2. DEDICATED MOBILE VERTICAL FLOW LAYOUT (< 768px: flex md:hidden)   */}
      {/* Normal document flow, NO radial layout, NO overlap, clean order:     */}
      {/* 1. Compact Top Bar: [ ← ]  Ronda 1   [?] [🔇]                        */}
      {/* 2. Required Letters (spacious, 20-28px margins)                      */}
      {/* 3. Dedicated Bomb Section (above players)                            */}
      {/* 4. Mobile 2-Column Player Grid (highlighted active card)             */}
      {/* 5. Word Input Area (24-32px gap, fixed validation, full-width send)  */}
      {/* 6. Secondary Collapsible Information & Footer                        */}
      {/* ==================================================================== */}
      <div className="flex md:hidden flex-col w-full max-w-md mx-auto">
        {/* 1. Compact Top Bar */}
        <header className="relative z-30 flex items-center justify-between w-full py-1.5 px-1 border-b border-slate-800/60">
          <button
            id="mobile-pause-menu-button"
            type="button"
            onClick={() => setConfirmExit(true)}
            aria-label="Menú"
            className="w-8 h-8 rounded-full bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-300 flex items-center justify-center cursor-pointer shadow-sm active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-black px-3 py-1 rounded-full bg-slate-800/90 text-amber-400 border border-slate-700/80 shadow-sm">
            Ronda {roundNumber}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              id="mobile-how-to-play-button"
              type="button"
              onClick={() => setShowHowToPlay(true)}
              aria-label="Reglas"
              className="w-8 h-8 rounded-full bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-300 flex items-center justify-center cursor-pointer shadow-sm active:scale-95"
            >
              <HelpCircle className="w-4 h-4 text-amber-400" />
            </button>
            <SoundToggle compact />
          </div>
        </header>

        {/* Reto del Abecedario Mobile Collapsible Trigger (compact & non-intrusive) */}
        <div className="w-full px-1 mt-2 mb-1">
          <button
            type="button"
            onClick={() => setIsMobileAlphabetOpen(true)}
            className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-amber-500/30 hover:border-amber-500/60 text-xs text-slate-300 transition-all cursor-pointer shadow-xs active:scale-98"
          >
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-black flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" />
                <span>Abecedario</span>
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                {activePlayer.avatar} {activePlayer.name}: <strong className="text-amber-300">{(activePlayer.alphabetProgress || []).length}/27</strong>
              </span>
            </div>
            <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              Ver letras ▼
            </span>
          </button>
        </div>

        {/* 2. Required Letters: HUGE, centered, 20-28px margins */}
        <section
          aria-label="Letras obligatorias"
          className="relative z-30 flex flex-col items-center justify-center my-6 select-none"
        >
          <div className="w-full px-6 py-4 rounded-3xl bg-slate-900/90 border-2 border-amber-400/80 shadow-[0_0_30px_rgba(245,158,11,0.22)] flex flex-col items-center backdrop-blur-md">
            <span className="text-xs font-black tracking-[0.25em] text-amber-300 uppercase mb-0.5">
              PALABRAS CON
            </span>

            <div className="relative overflow-hidden flex items-center justify-center min-h-[72px] w-full">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={currentSequence.sequence}
                  initial={{ y: 30, opacity: 0, scale: 0.85 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: -30, opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="text-6xl sm:text-7xl font-black font-display tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-300 to-orange-500 drop-shadow-[0_0_20px_rgba(245,158,11,0.6)]"
                >
                  {currentSequence.sequence}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* 3. Animated Bomb in its OWN Dedicated Section (ABOVE all player cards) */}
        <section
          aria-label="Bomba activa"
          className="relative w-full flex items-center justify-center my-4 min-h-[120px] pointer-events-none select-none"
        >
          <div className="scale-95 flex items-center justify-center">
            <BombVisual
              progress={progress}
              dangerLevel={dangerLevel}
              speedMultiplier={activePlayer?.multiplier || 1.0}
            />
          </div>
        </section>

        {/* 4. Player Grid in Normal Document Flow (2 columns, highlighted active card) */}
        <section
          aria-label="Jugadores"
          className="relative w-full mt-3 mb-6"
        >
          <MobilePlayerGrid
            players={players}
            activePlayerIndex={activePlayerIndex}
            currentTypingWord={currentTypingWord}
          />
        </section>

        {/* 5. Word Input Section (24-32px gap after players, full-width send) */}
        <section
          aria-label="Entrada de palabra"
          className="relative w-full mb-4"
        >
          <WordInput
            onWordSubmit={handleWordSubmit}
            disabled={phase !== 'PLAYING'}
            isValidating={isValidating}
            activePlayerName={activePlayer?.name || ''}
            requiredSequence={currentSequence.sequence}
            feedback={feedback}
            usedWords={usedWords}
            currentTypingWord={currentTypingWord}
            onTypingChange={setCurrentTypingWord}
          />
        </section>
      </div>

      {/* Bottom status line */}
      <footer className="relative z-20 text-center text-xs text-slate-500 py-1 flex items-center justify-center gap-4">
        <span>Ronda {roundNumber}</span>
        <span>&bull;</span>
        <span>{alivePlayers.length} en pie</span>
        <span>&bull;</span>
        <span>{totalValidWords} palabras acertadas</span>
      </footer>

      {/* Sequence Introduction Modal (Takeover countdown at start of round) */}
      {phase === 'ROUND_INTRO' && (
        <RoundIntroModal
          sequence={currentSequence}
          roundNumber={roundNumber}
          startingPlayerName={activePlayer?.name}
          onFinish={() => {
            lastUpdateTimestampRef.current = Date.now();
            setTurnStartTime(Date.now());
            setPhase('PLAYING');
          }}
        />
      )}

      {/* Explosion Overlay when bomb goes off */}
      {phase === 'EXPLOSION' && affectedPlayer && (
        <ExplosionOverlay
          affectedPlayer={affectedPlayer}
          isEliminated={affectedPlayer.lives <= 1}
          onDismiss={handleExplosionDismiss}
        />
      )}

      {/* How To Play Modal */}
      <HowToPlayModal
        isOpen={showHowToPlay}
        onClose={() => setShowHowToPlay(false)}
      />

      {/* Mobile / Tablet Alphabet Modal Drawer */}
      {isMobileAlphabetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm">
            <AlphabetPanel
              players={players}
              activePlayerIndex={activePlayerIndex}
              recentlyUnlockedLetters={recentlyUnlockedLetters}
              isMobileDrawer={true}
              onCloseMobileDrawer={() => setIsMobileAlphabetOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Alphabet Reward Modal when completing all 27 letters */}
      {alphabetRewardCelebration && (
        <AlphabetRewardModal
          player={alphabetRewardCelebration.player}
          gainedLife={alphabetRewardCelebration.gainedLife}
          onDismiss={() => setAlphabetRewardCelebration(null)}
        />
      )}
    </div>
  );
};
