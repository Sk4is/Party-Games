import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Player, LetterSequence, UsedWord, GameStats, BombDangerLevel } from '../types';
import { getNextSequence, getRandomSequence } from '../data/sequences';
import { validateSpanishWordAsync } from '../utils/validation';
import { audio } from '../utils/audio';
import { BombVisual } from './BombVisual';
import { PlayerRing } from './PlayerRing';
import { WordInput } from './WordInput';
import { RoundIntroModal } from './RoundIntroModal';
import { ExplosionOverlay } from './ExplosionOverlay';
import { GameOverView } from './GameOverView';
import { SoundToggle } from './SoundToggle';
import { HowToPlayModal } from './HowToPlayModal';
import { HelpCircle, ArrowLeft, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface LaBombaGameProps {
  initialPlayers: Player[];
  onBackToMenu: () => void;
}

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

  // Turn transition state (fast 200–400ms transition during which next player's timer is paused)
  const [isTransitioningTurn, setIsTransitioningTurn] = useState<boolean>(false);
  const [acceptedWordBanner, setAcceptedWordBanner] = useState<{
    word: string;
    player: string;
  } | null>(null);

  // Phases: 'ROUND_INTRO' | 'PLAYING' | 'EXPLOSION' | 'GAME_OVER'
  const [phase, setPhase] = useState<'ROUND_INTRO' | 'PLAYING' | 'EXPLOSION' | 'GAME_OVER'>('ROUND_INTRO');
  const [affectedPlayer, setAffectedPlayer] = useState<Player | null>(null);

  // Hidden random duration for current round (20s to 40s)
  const [hiddenDurationMs, setHiddenDurationMs] = useState<number>(() => 20000 + Math.random() * 20000);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [turnStartTime, setTurnStartTime] = useState<number>(Date.now());

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

  // Progress fraction of current round (0 to 1)
  const progress = Math.min(1.0, elapsedMs / hiddenDurationMs);

  // Danger level derived from progress
  const dangerLevel: BombDangerLevel =
    progress >= 0.88
      ? 'CRITICAL'
      : progress >= 0.72
      ? 'DANGER'
      : progress >= 0.42
      ? 'MIDDLE'
      : 'EARLY';

  // Sound ticking effect during active play
  const lastTickRef = useRef<number>(0);
  useEffect(() => {
    if (phase !== 'PLAYING' || isTransitioningTurn) return;

    const now = Date.now();
    let tickInterval = 1000;
    if (dangerLevel === 'CRITICAL') tickInterval = 250;
    else if (dangerLevel === 'DANGER') tickInterval = 450;
    else if (dangerLevel === 'MIDDLE') tickInterval = 750;

    if (now - lastTickRef.current > tickInterval) {
      lastTickRef.current = now;
      if (dangerLevel === 'CRITICAL' || dangerLevel === 'DANGER') {
        audio.playBombWarning(dangerLevel === 'CRITICAL' ? 1.4 : 1.0);
      } else {
        audio.playSpark();
      }
    }
  }, [phase, elapsedMs, dangerLevel, isTransitioningTurn]);

  // Main bomb timer engine
  // FAIRNESS RULE: When isTransitioningTurn is true, the timer is frozen so no time is consumed during animations
  useEffect(() => {
    if (phase !== 'PLAYING' || isTransitioningTurn) return;

    const intervalMs = 50;
    const currentMultiplier = activePlayer?.multiplier || 1.0;

    const interval = setInterval(() => {
      setElapsedMs((prev) => {
        const next = prev + intervalMs * currentMultiplier;

        if (next >= hiddenDurationMs) {
          clearInterval(interval);
          triggerExplosion();
          return hiddenDurationMs;
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [phase, isTransitioningTurn, hiddenDurationMs, activePlayer?.multiplier]);

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
    setPhase('EXPLOSION');
  }, [activePlayerIndex, players]);

  // When explosion modal finishes -> start new round with fresh sequence & clear words
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
    // 2. Clear displayed player words: under each player, their last valid word is cleared to '—'
    setPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        lastValidWord: null,
      }))
    );

    // Reset round bomb timer
    const newDuration = 20000 + Math.random() * 20000;
    setHiddenDurationMs(newDuration);
    setElapsedMs(0);
    setIsTransitioningTurn(false);
    setAcceptedWordBanner(null);
    setFeedback({ type: null, message: '' });

    setPhase('ROUND_INTRO');
  };

  // Word submission handler
  const handleWordSubmit = async (word: string) => {
    if (phase !== 'PLAYING' || isValidating || isTransitioningTurn) return;

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
    // bomb continues burning!
    if (!validation.valid) {
      audio.playAnswerRejected();

      const newMistakes = activePlayer.mistakes + 1;
      const newMultiplier = Math.pow(1.5, newMistakes);

      setTotalMistakes((prev) => prev + 1);

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

    // Update player's valid words count AND their displayed last valid word
    setPlayers((prev) =>
      prev.map((p, idx) => {
        if (idx !== activePlayerIndex) return p;
        const currentBest = p.fastestAnswerTimeMs;
        const newBestMs = Math.round(answerTimeSeconds * 1000);
        return {
          ...p,
          validWordsCount: p.validWordsCount + 1,
          fastestAnswerTimeMs: currentBest ? Math.min(currentBest, newBestMs) : newBestMs,
          lastValidWord: acceptedCanonical.toLowerCase(),
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

    // Show brief accepted word feedback
    setAcceptedWordBanner({
      word: acceptedCanonical.toUpperCase(),
      player: activePlayer.name,
    });
    setFeedback({
      type: 'success',
      message: '¡Palabra aceptada!',
      canonicalWord: acceptedCanonical,
    });

    // CRITICAL TRANSITION LOGIC:
    // 1. Freeze timer immediately so incoming player loses 0ms of their bomb time
    setIsTransitioningTurn(true);

    // 2. Identify the next surviving player
    const nextPlayerIndex = getNextSurvivingIndex(activePlayerIndex, players);
    const nextPlayer = players[nextPlayerIndex];

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

    // 4. Update the sequence and active player immediately to trigger the visual animations
    // The top letters slide out/in (220ms) and the arrow rotates simultaneously (300ms)
    setCurrentSequence(nextSeq);
    setActivePlayerIndex(nextPlayerIndex);
    audio.playTurnChange();

    // 5. Very fast transition window: 280ms (strictly within 200–400 ms)
    // FAIRNESS RULE:
    // Sequence changes to ADO -> arrow reaches next player -> input receives focus -> timer begins!
    setTimeout(() => {
      setIsTransitioningTurn(false);
      setTurnStartTime(Date.now());
      setFeedback({ type: null, message: '' });
    }, 280);

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
    }));

    setPlayers(resetPlayers);
    setActivePlayerIndex(0);

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

    const newDuration = 20000 + Math.random() * 20000;
    setHiddenDurationMs(newDuration);
    setElapsedMs(0);
    setIsTransitioningTurn(false);
    setAcceptedWordBanner(null);
    setTurnStartTime(Date.now());
    setFeedback({ type: null, message: '' });

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
    <div className="relative min-h-screen w-full flex flex-col justify-between p-3 sm:p-4 md:p-6 bg-radial from-slate-900 via-slate-950 to-black text-slate-100 overflow-x-hidden select-none">
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
            className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-2 rounded-full bg-emerald-500 text-slate-950 font-black text-xs sm:text-sm shadow-2xl flex items-center gap-2 border-2 border-emerald-300 pointer-events-none"
          >
            <CheckCircle2 className="w-4 h-4 text-slate-950 shrink-0" />
            <span>✓ {acceptedWordBanner.word}</span>
            <span className="opacity-75 font-bold">({acceptedWordBanner.player})</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Bar - Slim, non-intrusive navigation and game settings */}
      <header className="relative z-30 flex items-center justify-between w-full max-w-6xl mx-auto pb-2 border-b border-slate-800/60">
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
          <span className="text-xs font-black px-3 py-1 rounded-full bg-slate-800/90 text-amber-400 border border-slate-700 shadow-sm">
            Ronda #{roundNumber}
          </span>
          <button
            id="game-how-to-play-button"
            type="button"
            onClick={() => setShowHowToPlay(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-md active:scale-95"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Reglas</span>
          </button>
          <SoundToggle />
        </div>
      </header>

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

      {/* 
        ========================================================================
        1. REQUIRED LETTERS: THE MAIN VISUAL ELEMENT
        Positioned at TOP CENTRE, completely separated from player cards.
        2-3x larger than previous implementation, arcade glow & typography.
        ========================================================================
      */}
      <section
        aria-label="Letras obligatorias"
        className="relative z-30 flex flex-col items-center justify-center mt-3 sm:mt-5 mb-2 sm:mb-4 select-none"
      >
        <div className="px-8 py-3.5 sm:px-14 sm:py-5 md:px-20 md:py-6 rounded-3xl bg-slate-900/90 border-2 border-amber-400/80 shadow-[0_0_35px_rgba(245,158,11,0.25)] flex flex-col items-center backdrop-blur-md">
          <span className="text-xs sm:text-sm md:text-base font-black tracking-[0.25em] text-amber-300 uppercase mb-0.5">
            PALABRAS CON
          </span>

          {/* Letter container with fast 260ms slide-up & scale transition */}
          <div className="relative overflow-hidden flex items-center justify-center min-h-[72px] sm:min-h-[92px] md:min-h-[110px] min-w-[180px] sm:min-w-[260px] md:min-w-[320px]">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={currentSequence.sequence}
                initial={{ y: 35, opacity: 0, scale: 0.85 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: -35, opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.26, ease: 'easeOut' }}
                className="text-6xl sm:text-7xl md:text-8xl font-black font-display tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-300 to-orange-500 drop-shadow-[0_0_24px_rgba(245,158,11,0.65)]"
              >
                {currentSequence.sequence}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* 
        ========================================================================
        2. CENTRAL ARENA: PLAYERS SURROUNDING THE SMALLER BOMB
        Players distributed further away on an airy ellipse with ample gaps.
        ========================================================================
      */}
      <main className="relative flex-1 flex flex-col items-center justify-center w-full max-w-6xl mx-auto my-1 sm:my-3">
        <div className="relative w-full flex items-center justify-center">
          {/* Radial Player Layout surrounding the central bomb */}
          <PlayerRing
            players={players}
            activePlayerIndex={activePlayerIndex}
          />

          {/* Central Animated Bomb (25-35% smaller, with empty space around it) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
            <BombVisual
              progress={progress}
              dangerLevel={dangerLevel}
              speedMultiplier={activePlayer?.multiplier || 1.0}
            />
          </div>
        </div>

        {/* 
          ======================================================================
          3. CURRENT PLAYER INDICATOR
          Single clear indicator positioned between the arena and the input.
          ======================================================================
        */}
        <div className="relative z-30 flex items-center justify-center mt-3 sm:mt-4 mb-2 select-none">
          <div className="px-6 py-2 rounded-full bg-slate-900/95 border-2 border-amber-400 text-amber-300 font-display font-black text-sm sm:text-base tracking-wider shadow-xl shadow-amber-500/20 flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
            <span>TURNO DE {activePlayer.name.toUpperCase()}</span>
          </div>
        </div>

        {/* 
          ======================================================================
          4. WORD INPUT COMPONENT
          Separated from bomb. Fixed-height validation message area above input.
          ======================================================================
        */}
        <div className="w-full mt-1 mb-2">
          <WordInput
            onWordSubmit={handleWordSubmit}
            disabled={phase !== 'PLAYING' || isTransitioningTurn}
            isValidating={isValidating}
            activePlayerName={activePlayer?.name || ''}
            requiredSequence={currentSequence.sequence}
            feedback={feedback}
            usedWords={usedWords}
          />
        </div>
      </main>

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
            setPhase('PLAYING');
            setTurnStartTime(Date.now());
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
    </div>
  );
};
