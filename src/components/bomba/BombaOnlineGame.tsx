import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  BombaRoomState,
  BombaPlayerState,
  PartyClientMessage,
} from '../../types/multiplayer';
import { Player, BombDangerLevel, GameConfig } from '../../types';
import { audio } from '../../utils/audio';
import { BombVisual } from '../BombVisual';
import { PlayerRing } from '../PlayerRing';
import { MobilePlayerGrid } from '../MobilePlayerGrid';
import { WordInput } from '../WordInput';
import { RoundIntroModal } from '../RoundIntroModal';
import { ExplosionOverlay } from '../ExplosionOverlay';
import { GameOverView } from '../GameOverView';
import { SoundToggle } from '../SoundToggle';
import { HowToPlayModal } from '../HowToPlayModal';
import { AlphabetSidebar } from './AlphabetSidebar';
import { RequiredLettersBanner } from './RequiredLettersBanner';
import { AlphabetRewardModal } from '../AlphabetRewardModal';
import { AbandonConfirmationModal } from '../common/AbandonConfirmationModal';
import { MatchAbortedModal } from '../common/MatchAbortedModal';
import { BombaLobby } from './BombaLobby';
import {
  HelpCircle,
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Trophy,
  ChevronRight,
} from 'lucide-react';

interface BombaOnlineGameProps {
  roomState: BombaRoomState;
  currentUserId: string;
  activeTyping: {
    playerId: string;
    text: string;
    turnId?: string;
    roundNumber?: number;
  } | null;
  serverFeedback: { id: string; type: 'success' | 'error'; message: string } | null;
  alphabetReward: { id: string; playerId: string; playerName: string; gainedLife: boolean } | null;
  onUpdateConfig: (cfg: Partial<GameConfig>) => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  onTyping: (text: string, turnId?: string, roundNumber?: number) => void;
  onSubmitWord: (
    word: string,
    submissionId?: string,
    turnId?: string,
    roundNumber?: number,
    challengeId?: string
  ) => void;
  onDismissExplosion: () => void;
  onPlayAgain: () => void;
}

export const BombaOnlineGame: React.FC<BombaOnlineGameProps> = ({
  roomState,
  currentUserId,
  activeTyping,
  serverFeedback,
  alphabetReward,
  onUpdateConfig,
  onStartGame,
  onLeaveRoom,
  onTyping,
  onSubmitWord,
  onDismissExplosion,
  onPlayAgain,
}) => {
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isAbandonModalOpen, setIsAbandonModalOpen] = useState(false);
  const [isMobileAlphabetOpen, setIsMobileAlphabetOpen] = useState(false);
  const [isDesktopAlphabetOpen, setIsDesktopAlphabetOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1340;
    }
    return true;
  });

  // Local typing buffer for active player
  const [localTypingWord, setLocalTypingWord] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lastTypingSentRef = useRef<number>(0);

  // Local feedback state
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Reset typing and unlock submissions when turn, activePlayer, or round changes
  useEffect(() => {
    setLocalTypingWord('');
    setIsSubmitting(false);
  }, [roomState.activePlayerId, roomState.currentTurnId, roomState.roundNumber, roomState.phase]);

  useEffect(() => {
    if (serverFeedback) {
      setIsSubmitting(false);
      setFeedback({
        type: serverFeedback.type,
        message: serverFeedback.message,
      });
      if (serverFeedback.type === 'error') {
        audio.playError();
      }
    }
  }, [serverFeedback]);

  // Audio Ticking Engine
  const lastTickRef = useRef<number>(0);
  useEffect(() => {
    if (roomState.phase !== 'PLAYING') return;

    const now = Date.now();
    let tickInterval = 1000;
    if (roomState.dangerLevel === 'CRITICAL') tickInterval = 240;
    else if (roomState.dangerLevel === 'DANGER') tickInterval = 450;
    else if (roomState.dangerLevel === 'MIDDLE') tickInterval = 750;

    const activePlayer = roomState.players[roomState.activePlayerIndex];
    const currentMultiplier = activePlayer?.multiplier || 1.0;
    tickInterval = Math.max(100, Math.round(tickInterval / Math.min(currentMultiplier, 2.5)));

    if (now - lastTickRef.current > tickInterval) {
      lastTickRef.current = now;
      if (roomState.dangerLevel === 'CRITICAL' || roomState.dangerLevel === 'DANGER') {
        audio.playBombWarning(roomState.dangerLevel === 'CRITICAL' ? 1.4 : 1.0);
      } else {
        audio.playSpark();
      }
    }
  }, [roomState.phase, roomState.bombRemainingMs, roomState.dangerLevel, roomState.activePlayerIndex, roomState.players]);

  // If in LOBBY phase, render Lobby
  if (roomState.phase === 'LOBBY') {
    return (
      <BombaLobby
        roomState={roomState}
        currentUserId={currentUserId}
        onUpdateConfig={onUpdateConfig}
        onStartGame={onStartGame}
        onLeaveRoom={onLeaveRoom}
      />
    );
  }

  // Active Player & Status
  const activePlayer =
    (roomState.activePlayerId
      ? roomState.players.find((p) => p.id === roomState.activePlayerId)
      : null) ||
    roomState.players[roomState.activePlayerIndex] ||
    roomState.players[0];
  const isMeActive = activePlayer?.id === currentUserId;
  const me = roomState.players.find((p) => p.id === currentUserId) || roomState.players[0];

  // Fuse progress 0.0 to 1.0
  const progress = Math.min(1.0, Math.max(0, 1 - roomState.bombRemainingMs / roomState.bombDurationMs));

  // Handle typing change
  const handleTypingChange = (val: string) => {
    if (!isMeActive) return;
    setLocalTypingWord(val);
    setFeedback({ type: null, message: '' });

    // Throttle socket typing event to 30ms
    const now = Date.now();
    if (now - lastTypingSentRef.current > 30) {
      lastTypingSentRef.current = now;
      onTyping(val, roomState.currentTurnId, roomState.roundNumber);
    }
  };

  // Handle submit
  const handleWordSubmit = (word: string) => {
    if (!isMeActive || isSubmitting) return;
    setIsSubmitting(true);
    audio.playTick();
    const submissionId = `sub-${currentUserId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    onSubmitWord(
      word,
      submissionId,
      roomState.currentTurnId,
      roomState.roundNumber,
      roomState.challengeId
    );
  };

  // Convert BombaPlayerState to Player for components
  const castPlayers: Player[] = roomState.players.map((p) => {
    const isThisPlayerActive = p.id === activePlayer.id;
    const isThisPlayerMe = p.id === currentUserId;

    let currentTypingText = '';
    if (isThisPlayerActive) {
      if (isThisPlayerMe) {
        currentTypingText = localTypingWord;
      } else if (
        activeTyping &&
        activeTyping.playerId === p.id &&
        (!activeTyping.turnId || activeTyping.turnId === roomState.currentTurnId)
      ) {
        currentTypingText = activeTyping.text;
      }
    }

    return {
      id: p.id,
      name: p.name,
      color: p.color,
      avatar: p.avatar,
      lives: p.lives,
      mistakes: p.mistakes,
      roundMistakes: p.roundMistakes ?? p.mistakes,
      multiplier: p.multiplier,
      isEliminated: p.isEliminated,
      bombsReceived: p.bombsReceived,
      validWordsCount: p.validWordsCount,
      fastestAnswerTimeMs: p.fastestAnswerTimeMs,
      lastValidWord: p.lastValidWord,
      currentTypingWord: currentTypingText,
      alphabetProgress: p.alphabetProgress,
    };
  });

  const castActivePlayer =
    castPlayers.find((p) => p.id === activePlayer.id) ||
    castPlayers[roomState.activePlayerIndex] ||
    castPlayers[0];

  // My Alphabet Progress
  const myAlphabetCount = me?.alphabetProgress?.length || 0;

  return (
    <div className="relative w-full h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-hidden select-none font-sans">
      {/* BACKGROUND ATMOSPHERE */}
      <div className="absolute inset-0 bg-radial from-slate-900/60 via-slate-950 to-slate-950 pointer-events-none" />

      {/* TOP HEADER / STATS BAR */}
      <header className="relative z-30 w-full px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
        {/* Left: Back / Abandon Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsAbandonModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white border border-slate-800 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Menú</span>
          </button>

          {/* Room Code Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-stone-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono font-bold text-amber-400">{roomState.code}</span>
          </div>
        </div>

        {/* Center: Round & Sequence Indicator */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-bold text-slate-300 tracking-wider uppercase font-display">
            Ronda {roomState.roundNumber}
          </div>

          <div
            className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase transition-all duration-300 border flex items-center gap-1.5 ${
              roomState.dangerLevel === 'CRITICAL'
                ? 'bg-rose-950/80 text-rose-300 border-rose-600 animate-pulse shadow-[0_0_15px_rgba(225,29,72,0.4)]'
                : roomState.dangerLevel === 'DANGER'
                ? 'bg-orange-950/80 text-orange-300 border-orange-600'
                : roomState.dangerLevel === 'MIDDLE'
                ? 'bg-amber-950/80 text-amber-300 border-amber-600'
                : 'bg-emerald-950/60 text-emerald-300 border-emerald-700'
            }`}
          >
            <span className="text-[10px] sm:text-xs">
              {roomState.dangerLevel === 'CRITICAL' && '⚠️ PELIGRO CRÍTICO'}
              {roomState.dangerLevel === 'DANGER' && '🔥 MECHA PELIGROSA'}
              {roomState.dangerLevel === 'MIDDLE' && '⏳ ACELERANDO'}
              {roomState.dangerLevel === 'EARLY' && '💣 MECHA SEGURA'}
            </span>
          </div>
        </div>

        {/* Right: Sound & Help */}
        <div className="flex items-center gap-2">
          {/* Mobile Alphabet Drawer Button */}
          <button
            type="button"
            onClick={() => setIsMobileAlphabetOpen(true)}
            className="md:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold shadow-sm"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>{myAlphabetCount}/27</span>
          </button>

          <SoundToggle />

          <button
            type="button"
            onClick={() => setIsHowToPlayOpen(true)}
            className="p-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
            title="Cómo jugar"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* FLOATING ACCEPTED WORD BANNER */}
      <AnimatePresence>
        {roomState.acceptedWordBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-14 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-2xl bg-emerald-950/90 border border-emerald-500 text-emerald-200 text-xs sm:text-sm font-bold shadow-2xl flex items-center gap-2 backdrop-blur-md"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              ¡«<span className="font-mono text-white">{roomState.acceptedWordBanner.word}</span>» aceptada para {roomState.acceptedWordBanner.player}!
            </span>
            {Boolean(roomState.acceptedWordBanner.bonusLetters) && (
              <span className="ml-1 px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[10px] font-black border border-amber-400/30">
                +{roomState.acceptedWordBanner.bonusLetters} letras
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* BODY CONTAINER: FIXED LEFT ALPHABET SIDEBAR + MAIN GAME AREA */}
      <div className="relative flex-1 flex w-full h-[calc(100vh-50px)] min-h-0 overflow-hidden">
        {/* 1. FIXED LEFT ALPHABET SIDEBAR (Desktop) & DRAWER (Mobile) */}
        <AlphabetSidebar
          players={castPlayers}
          currentUserId={currentUserId}
          isExpanded={isDesktopAlphabetOpen}
          onToggleExpand={() => setIsDesktopAlphabetOpen((prev) => !prev)}
          isMobileDrawerOpen={isMobileAlphabetOpen}
          onCloseMobileDrawer={() => setIsMobileAlphabetOpen(false)}
        />

        {/* 2. MAIN GAME AREA */}
        <main
          id="main-game-area"
          className="relative flex-1 flex flex-col items-center justify-between h-full min-w-0 px-2 sm:px-4 lg:px-6 py-1 sm:py-2 overflow-y-auto overflow-x-hidden"
        >
          {/* TOP: REQUIRED LETTERS BANNER */}
          <div className="w-full shrink-0 z-20">
            <RequiredLettersBanner sequence={roomState.currentSequence?.sequence || ''} />
          </div>

          {/* DESKTOP/TABLET: CENTRAL RADIAL ARENA (BOMB + ORBITING PLAYERS) */}
          <div className="hidden md:flex relative flex-1 w-full max-w-5xl items-center justify-center my-1 sm:my-2 min-h-0">
            {/* Central Bomb (Absolute visual centre of main game area) */}
            <div className="relative z-10 flex items-center justify-center pointer-events-none scale-95 sm:scale-100 md:scale-105 transition-transform duration-300">
              <BombVisual
                progress={progress}
                dangerLevel={roomState.dangerLevel}
                speedMultiplier={castActivePlayer.multiplier}
              />
            </div>

            {/* Desktop Radial Ring */}
            <div className="absolute inset-0">
              <PlayerRing
                players={castPlayers}
                activePlayerIndex={roomState.activePlayerIndex}
                activePlayerId={activePlayer.id}
                currentTypingWord={
                  isMeActive
                    ? localTypingWord
                    : activeTyping && activeTyping.playerId === activePlayer.id
                    ? activeTyping.text
                    : ''
                }
                typingPlayerId={
                  isMeActive
                    ? currentUserId
                    : activeTyping && activeTyping.playerId === activePlayer.id
                    ? activePlayer.id
                    : undefined
                }
                maxLives={roomState.config.startingLives}
                allowedMistakesPerRound={roomState.config.allowedMistakesPerRound}
              />
            </div>
          </div>

          {/* MOBILE: DEDICATED STRUCTURED COMPOSITION (< md) */}
          <div className="md:hidden w-full max-w-md my-0.5 shrink-0">
            <MobilePlayerGrid
              players={castPlayers}
              activePlayerIndex={roomState.activePlayerIndex}
              activePlayerId={activePlayer.id}
              currentTypingWord={
                isMeActive
                  ? localTypingWord
                  : activeTyping && activeTyping.playerId === activePlayer.id
                  ? activeTyping.text
                  : ''
              }
              typingPlayerId={
                isMeActive
                  ? currentUserId
                  : activeTyping && activeTyping.playerId === activePlayer.id
                  ? activePlayer.id
                  : undefined
              }
              maxLives={roomState.config.startingLives}
              allowedMistakesPerRound={roomState.config.allowedMistakesPerRound}
              progress={progress}
              dangerLevel={roomState.dangerLevel}
              speedMultiplier={castActivePlayer.multiplier}
              usedWords={roomState.usedWords.map((u) => u.word)}
            />
          </div>

          {/* BOTTOM: ACTION BAR / WORD INPUT */}
          <footer className="relative z-30 w-full pb-2 sm:pb-3 pt-1 shrink-0">
            {isMeActive ? (
              <WordInput
                onWordSubmit={handleWordSubmit}
                disabled={!isMeActive || castActivePlayer.isEliminated}
                isValidating={false}
                activePlayerName={castActivePlayer.name}
                requiredSequence={roomState.currentSequence?.sequence || ''}
                feedback={feedback}
                usedWords={roomState.usedWords}
                currentTypingWord={localTypingWord}
                onTypingChange={handleTypingChange}
              />
            ) : (
              <div className="w-full max-w-md mx-auto px-4 text-center">
                <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl backdrop-blur-md">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="text-lg">{castActivePlayer.avatar}</span>
                    <span className="text-sm font-bold text-white">
                      Turno de <span style={{ color: castActivePlayer.color }}>{castActivePlayer.name}</span>
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    {activeTyping &&
                    activeTyping.playerId === activePlayer.id &&
                    activeTyping.text ? (
                      <span className="font-mono text-amber-300 font-semibold">
                        Escribiendo: «{activeTyping.text}»...
                      </span>
                    ) : (
                      <span>Esperando a que envíe una palabra con «{roomState.currentSequence?.sequence}»...</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </footer>
        </main>
      </div>

      {/* ROUND INTRO MODAL */}
      {roomState.phase === 'ROUND_INTRO' && roomState.currentSequence && (
        <RoundIntroModal
          sequence={roomState.currentSequence}
          roundNumber={roomState.roundNumber}
          startingPlayerName={castActivePlayer.name}
          onFinish={() => {}}
        />
      )}

      {/* EXPLOSION OVERLAY */}
      {roomState.phase === 'EXPLOSION' && roomState.affectedPlayer && (
        <ExplosionOverlay
          affectedPlayer={{
            ...(castPlayers.find((p) => p.id === roomState.affectedPlayer!.id) || castActivePlayer),
            ...roomState.affectedPlayer,
          }}
          maxLives={roomState.config.startingLives || 3}
          isEliminated={roomState.affectedPlayer.isEliminated || roomState.affectedPlayer.lives <= 0}
          onDismiss={onDismissExplosion}
        />
      )}

      {/* GAME OVER VIEW */}
      {roomState.phase === 'GAME_OVER' && (
        <GameOverView
          stats={{
            winner: roomState.winner ? { ...castActivePlayer, ...roomState.winner } : null,
            totalValidWords: roomState.stats.totalValidWords,
            totalMistakes: roomState.stats.totalMistakes,
            totalExplosions: roomState.stats.totalExplosions,
            fastestAnswer: roomState.stats.fastestAnswer,
            mostBurntPlayer: null,
          }}
          players={castPlayers}
          onRematch={onPlayAgain}
          onBackToMenu={onLeaveRoom}
        />
      )}

      {/* ALPHABET REWARD CELEBRATION MODAL */}
      {alphabetReward && (
        <AlphabetRewardModal
          player={castPlayers.find((p) => p.id === alphabetReward.playerId) || castActivePlayer}
          gainedLife={alphabetReward.gainedLife}
          maxLives={roomState.config.startingLives}
          onDismiss={() => {}}
        />
      )}

      {/* HOW TO PLAY MODAL */}
      <HowToPlayModal isOpen={isHowToPlayOpen} onClose={() => setIsHowToPlayOpen(false)} />

      {/* ABANDON MODAL */}
      <AbandonConfirmationModal
        isOpen={isAbandonModalOpen}
        onCancel={() => setIsAbandonModalOpen(false)}
        onConfirm={onLeaveRoom}
      />

      {/* MATCH ABORTED MODAL */}
      <MatchAbortedModal
        isOpen={roomState.phase === 'MATCH_ABORTED'}
        title="PARTIDA FINALIZADA"
        message={roomState.endMessage || roomState.abortReason || 'La partida no puede continuar por falta de jugadores suficientes.'}
        onReturnToMenu={onLeaveRoom}
      />
    </div>
  );
};
