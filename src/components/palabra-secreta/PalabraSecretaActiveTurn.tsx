import React, { useEffect, useState } from 'react';
import {
  Check,
  SkipForward,
  AlertTriangle,
  Clock,
  Volume2,
  Eye,
  Shield,
  Plus,
  Minus,
  KeyRound,
  Smile,
  Film,
  Gamepad2,
  Delete,
  CornerDownLeft,
} from 'lucide-react';
import { PalabraSecretaRoomState } from '../../types/palabraSecreta';
import { audio } from '../../utils/audio';

interface PalabraSecretaActiveTurnProps {
  roomState: PalabraSecretaRoomState;
  localPlayerId: string;
  onMarkGuessed: () => void;
  onSkipWord: () => void;
  onMarkTaboo: () => void;
  // Mode 2: Password actions
  onIncrementClueCount?: () => void;
  onDecrementClueCount?: () => void;
  onMarkPasswordGuessed?: () => void;
  onSkipPasswordWord?: () => void;
  onFinishPasswordTurn?: () => void;
  // Mode 3: Emoji actions
  onChooseEmojiOption?: (optionId: string) => void;
  onUpdateEmojiClue?: (clue: string) => void;
  onMarkEmojiGuessed?: () => void;
  onSkipEmoji?: () => void;
}

const POPULAR_EMOJIS = [
  '🎬', '🎮', '🚀', '🚗', '🚢', '🧊', '💔', '🌊', '🦁', '👑',
  '🧙', '⚡', '💍', '👻', '💀', '🧟', '🦇', '🕷️', '🍕', '🥊',
  '🔫', '⚔️', '🛡️', '💎', '⛏️', '🍄', '🐢', '🐉', '🏎️', '⚽',
  '🪐', '🛸', '🦖', '🏰', '🏝️', '🌋', '💣', '💰', '🕵️', '🤖',
  '🍿', '❄️', '🔥', '🕶️', '🩸', '🔪', '🧸', '👽', '🌲', '🎪',
];

export const PalabraSecretaActiveTurn: React.FC<PalabraSecretaActiveTurnProps> = ({
  roomState,
  localPlayerId,
  onMarkGuessed,
  onSkipWord,
  onMarkTaboo,
  onIncrementClueCount,
  onDecrementClueCount,
  onMarkPasswordGuessed,
  onSkipPasswordWord,
  onFinishPasswordTurn,
  onChooseEmojiOption,
  onUpdateEmojiClue,
  onMarkEmojiGuessed,
  onSkipEmoji,
}) => {
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const activeTeam = roomState.teams[roomState.activeTeamId];
  const descriptor = roomState.players.find((p) => p.id === roomState.activeDescriptorId);

  const isDescriptor = roomState.activeDescriptorId === localPlayerId;
  const isTeammate =
    roomState.players.find((p) => p.id === localPlayerId)?.teamId === roomState.activeTeamId &&
    !isDescriptor;
  const isRival =
    roomState.players.find((p) => p.id === localPlayerId)?.teamId !== roomState.activeTeamId;

  const mode = roomState.config.gameMode || 'CLASSIC';
  const remainingTime = roomState.turnRemainingSeconds;
  const totalTime = roomState.config.timePerTurn;
  const progressPercent = Math.max(0, Math.min(100, (remainingTime / Math.max(1, totalTime)) * 100));

  const isLowTime = remainingTime <= 10;

  // Local draft for emoji clue input
  const [localEmojiDraft, setLocalEmojiDraft] = useState<string>(roomState.emojiClue || '');

  useEffect(() => {
    setLocalEmojiDraft(roomState.emojiClue || '');
  }, [roomState.emojiClue]);

  // Classic Keyboard shortcuts for descriptor
  useEffect(() => {
    if (!isDescriptor) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (mode === 'CLASSIC') {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          onMarkGuessed();
        } else if (e.code === 'KeyS' || e.code === 'KeyP' || e.code === 'ArrowRight') {
          e.preventDefault();
          onSkipWord();
        } else if (e.code === 'KeyT') {
          e.preventDefault();
          onMarkTaboo();
        }
      } else if (mode === 'PASSWORD') {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          onMarkPasswordGuessed?.();
        } else if (e.code === 'KeyS' || e.code === 'ArrowRight') {
          e.preventDefault();
          onSkipPasswordWord?.();
        } else if (e.code === 'Equal' || e.code === 'NumpadAdd' || e.code === 'KeyP') {
          e.preventDefault();
          onIncrementClueCount?.();
        } else if (e.code === 'Minus' || e.code === 'NumpadSubtract' || e.code === 'KeyM') {
          e.preventDefault();
          onDecrementClueCount?.();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isDescriptor,
    mode,
    onMarkGuessed,
    onSkipWord,
    onMarkTaboo,
    onMarkPasswordGuessed,
    onSkipPasswordWord,
    onIncrementClueCount,
    onDecrementClueCount,
  ]);

  const handleAddEmoji = (emoji: string) => {
    if (!onUpdateEmojiClue) return;
    const currentChars = Array.from(localEmojiDraft);
    if (currentChars.length >= 5) return;
    const next = localEmojiDraft + emoji;
    audio.playTick();
    setLocalEmojiDraft(next);
    onUpdateEmojiClue(next);
  };

  const handleRemoveLastEmoji = () => {
    if (!onUpdateEmojiClue || !localEmojiDraft) return;
    const currentChars = Array.from(localEmojiDraft);
    currentChars.pop();
    const next = currentChars.join('');
    audio.playTick();
    setLocalEmojiDraft(next);
    onUpdateEmojiClue(next);
  };

  const handleClearEmojis = () => {
    if (!onUpdateEmojiClue) return;
    audio.playTick();
    setLocalEmojiDraft('');
    onUpdateEmojiClue('');
  };

  const clueWordCount = roomState.passwordClueWordCount ?? 0;
  const clueBudget = roomState.passwordClueBudget ?? 15;
  const isOverBudget = clueWordCount > clueBudget;

  return (
    <div className="w-full max-w-3xl mx-auto px-2.5 xs:px-4 py-3 sm:py-4 space-y-3 sm:space-y-4 min-w-0">
      {/* Top Bar: Team Scores & Turn Indicator */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-2.5 sm:p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs min-w-0">
        <div className="flex items-center justify-between w-full sm:w-auto gap-3 min-w-0">
          {/* Team 1 */}
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
            <span className="font-bold text-slate-300 truncate max-w-[90px] xs:max-w-[120px] sm:max-w-[150px]">
              {roomState.teams['team-1'].name}
            </span>
            <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-black font-mono text-[11px] shrink-0">
              {roomState.teams['team-1'].score} pts
            </span>
          </div>

          {/* Team 2 */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="px-1.5 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 font-black font-mono text-[11px] shrink-0">
              {roomState.teams['team-2'].score} pts
            </span>
            <span className="font-bold text-slate-300 truncate max-w-[90px] xs:max-w-[120px] sm:max-w-[150px]">
              {roomState.teams['team-2'].name}
            </span>
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0" />
          </div>
        </div>

        {/* Game Mode Badge in Center */}
        <div className="flex items-center justify-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px] font-bold shrink-0 self-center">
          <span>{mode === 'PASSWORD' ? '🔑 Contraseña' : mode === 'EMOJI' ? '😀 Emoji Misterioso' : '🗣️ Clásico'}</span>
        </div>
      </div>

      {/* Timer Bar (For Classic & Emoji, and safety timer for Password) */}
      <div className="p-3 sm:p-4 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-2 min-w-0">
        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-1.5 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            <span
              className="text-[10px] sm:text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0"
              style={{
                backgroundColor: `${activeTeam.color}20`,
                color: activeTeam.color,
              }}
            >
              Turno de {activeTeam.name}
            </span>
            <span className="text-[11px] sm:text-xs text-slate-400 font-semibold truncate">
              Descriptor: <strong className="text-white">{descriptor?.name}</strong>
            </span>
          </div>

          <div
            className={`flex items-center gap-1.5 font-mono text-base sm:text-lg font-black shrink-0 ${
              isLowTime ? 'text-rose-400 animate-pulse' : 'text-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>
              {Math.floor(remainingTime / 60)}:{(remainingTime % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              isLowTime ? 'bg-rose-500' : 'bg-[#10B981]'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* =========================================================================
          MODE 1: CLÁSICO ACTIVE TURN
          ========================================================================= */}
      {mode === 'CLASSIC' && (
        <>
          {/* VIEW 1: DESCRIPTOR */}
          {isDescriptor && (
            <div className="p-3.5 xs:p-5 sm:p-8 rounded-3xl bg-slate-900/95 border-2 border-emerald-500/50 shadow-2xl space-y-4 sm:space-y-6 min-w-0">
              <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5 sm:pb-3 min-w-0">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#10B981] truncate">
                  Categoría: {roomState.currentWord?.category || 'General'}
                </span>
                <span className="text-[11px] sm:text-xs font-mono text-slate-400 shrink-0">
                  Saltos: <strong className="text-white">{roomState.config.maxSkipsPerTurn === -1 ? '∞' : Math.max(0, roomState.config.maxSkipsPerTurn - roomState.turnSkipsUsed)}</strong>
                </span>
              </div>

              {/* Secret Word */}
              <div className="text-center space-y-1 sm:space-y-2 py-2 sm:py-4 min-w-0">
                <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest block">
                  Palabra Secreta:
                </span>
                <div className="text-2xl xs:text-4xl sm:text-6xl font-black font-display tracking-tight text-white drop-shadow-md uppercase break-words px-1">
                  {roomState.currentWord?.word || '...'}
                </div>
              </div>

              {/* Forbidden Words */}
              {roomState.currentWord?.forbidden && roomState.currentWord.forbidden.length > 0 && (
                <div className="space-y-1.5 sm:space-y-2 p-3 sm:p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-center min-w-0">
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-rose-400 block">
                    Palabras Prohibidas (Tabú):
                  </span>
                  <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 pt-1">
                    {roomState.currentWord.forbidden.map((f, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs sm:text-sm font-bold uppercase"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-1">
                <button
                  id="btn-mark-guessed"
                  type="button"
                  onClick={() => {
                    audio.playAnswerAccepted();
                    onMarkGuessed();
                  }}
                  className="py-3 xs:py-4 px-2 xs:px-4 rounded-2xl bg-[#10B981] hover:bg-[#059669] text-slate-950 font-black text-xs xs:text-sm sm:text-base uppercase tracking-wider transition-all shadow-xl shadow-[#10B981]/25 active:scale-95 flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3] shrink-0" />
                  <span>Acertada (+1)</span>
                </button>

                <button
                  id="btn-skip-word"
                  type="button"
                  onClick={() => {
                    audio.playBombWarning();
                    onSkipWord();
                  }}
                  className="py-3 xs:py-4 px-2 xs:px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-black text-xs xs:text-sm sm:text-base uppercase tracking-wider transition-all border border-amber-500/30 active:scale-95 flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer"
                >
                  <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                  <span>Saltar (-1)</span>
                </button>
              </div>

              {/* Taboo fallback */}
              <div className="flex justify-center pt-1">
                <button
                  id="btn-mark-taboo"
                  type="button"
                  onClick={() => {
                    audio.playAnswerRejected();
                    onMarkTaboo();
                  }}
                  className="px-3 py-2 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer text-center max-w-full"
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>He dicho una palabra prohibida (Falta / Tabú)</span>
                </button>
              </div>
            </div>
          )}

          {/* VIEW 2: TEAMMATES */}
          {isTeammate && (
            <div className="p-5 xs:p-8 sm:p-12 rounded-3xl bg-slate-900/90 border-2 border-teal-500/40 shadow-2xl text-center space-y-4 sm:space-y-6 min-w-0">
              <div className="relative inline-flex items-center justify-center">
                <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-teal-500/20 border-2 border-teal-500/50 flex items-center justify-center animate-pulse">
                  <Volume2 className="w-8 h-8 sm:w-12 sm:h-12 text-teal-300" />
                </div>
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <h2 className="text-2xl xs:text-3xl sm:text-4xl font-black font-display text-white">
                  ¡Escucha a {descriptor?.name}!
                </h2>
                <p className="text-slate-300 text-xs sm:text-sm sm:text-base leading-relaxed">
                  Está describiendo la palabra en voz alta. ¡Gritad vuestras respuestas!
                </p>
              </div>
            </div>
          )}

          {/* VIEW 3: RIVALS */}
          {isRival && (
            <div className="p-4 xs:p-6 sm:p-8 rounded-3xl bg-slate-900/90 border-2 border-amber-500/40 shadow-2xl space-y-4 min-w-0">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 min-w-0">
                <div className="flex items-center gap-1.5 text-amber-400 text-[11px] sm:text-xs font-bold uppercase tracking-wider shrink-0">
                  <Shield className="w-4 h-4" />
                  <span>Árbitro Rival</span>
                </div>
                <span className="text-[11px] sm:text-xs text-slate-400 truncate">Vigila las prohibidas</span>
              </div>
              <div className="text-center space-y-2 sm:space-y-3 py-2 min-w-0">
                <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Palabra de {descriptor?.name}:
                </span>
                <div className="text-2xl xs:text-3xl sm:text-5xl font-black font-display text-white tracking-wide uppercase break-words px-1">
                  {roomState.currentWord?.word}
                </div>
                {roomState.currentWord?.forbidden && roomState.currentWord.forbidden.length > 0 && (
                  <div className="pt-2">
                    <div className="text-xs font-bold text-rose-400 mb-1.5">Palabras prohibidas:</div>
                    <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                      {roomState.currentWord.forbidden.map((f, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold uppercase">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* =========================================================================
          MODE 2: CONTRASEÑA ACTIVE TURN
          ========================================================================= */}
      {mode === 'PASSWORD' && (
        <div className="space-y-3 sm:space-y-4 min-w-0">
          {/* Public Progress Counter (Visible to ALL players: descriptor, teammates & rivals) */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {/* Targets Guessed */}
            <div className="p-3 sm:p-4 rounded-3xl bg-slate-900/90 border border-slate-800 text-center min-w-0">
              <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block mb-0.5 sm:mb-1">
                Aciertos
              </span>
              <div className="font-mono text-2xl sm:text-4xl font-black text-emerald-400">
                {roomState.passwordCorrectCount ?? 0} / 10
              </div>
            </div>

            {/* Clue Words Used (Budget 15) */}
            <div
              className={`p-3 sm:p-4 rounded-3xl border text-center transition-all min-w-0 ${
                isOverBudget
                  ? 'bg-rose-500/15 border-rose-500/50 text-rose-300'
                  : 'bg-slate-900/90 border-slate-800 text-amber-300'
              }`}
            >
              <div className="flex items-center justify-center gap-1 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-0.5 sm:mb-1">
                <span>Pistas Usadas</span>
                {isOverBudget && <span className="text-rose-400 font-black">(-{clueWordCount - clueBudget})</span>}
              </div>
              <div className="font-mono text-2xl sm:text-4xl font-black">
                {clueWordCount} / {clueBudget}
              </div>
            </div>
          </div>

          {/* DESCRIPTOR VIEW FOR CONTRASEÑA */}
          {isDescriptor && (
            <div className="p-3.5 xs:p-5 sm:p-8 rounded-3xl bg-slate-900/95 border-2 border-amber-500/50 shadow-2xl space-y-4 sm:space-y-6 min-w-0">
              <div className="flex items-center justify-between gap-1 border-b border-slate-800 pb-2.5 sm:pb-3 min-w-0">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1 truncate">
                  <KeyRound className="w-3.5 h-3.5 shrink-0" />
                  Palabra {(roomState.passwordCurrentIndex ?? 0) + 1} de 10
                </span>
                <span className="text-[11px] sm:text-xs text-slate-400 shrink-0">
                  Presupuesto: 15
                </span>
              </div>

              {/* Dominant Target Word */}
              <div className="text-center py-2 sm:py-4 space-y-1 sm:space-y-2 min-w-0">
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest block">
                  Palabra Actual a Adivinar:
                </span>
                <div className="text-3xl xs:text-4xl sm:text-6xl font-black font-display text-white tracking-tight drop-shadow-md uppercase break-words px-1">
                  {roomState.passwordCurrentWord || '...'}
                </div>
              </div>

              {/* Target progress indicator (1 to 10 checklist with stable status) */}
              <div className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
                {(roomState.passwordTargetsProgress && roomState.passwordTargetsProgress.length > 0
                  ? roomState.passwordTargetsProgress
                  : Array.from({ length: 10 }).map((_, idx) => ({
                      id: `t_${idx}`,
                      index: idx,
                      status:
                        idx === (roomState.passwordCurrentIndex ?? 0)
                          ? ('CURRENT' as const)
                          : idx < (roomState.passwordCurrentIndex ?? 0)
                          ? ('CORRECT' as const)
                          : ('PENDING' as const),
                      isGuessed: idx < (roomState.passwordCurrentIndex ?? 0),
                    }))
                ).map((targetItem, idx) => {
                  const isCurrent = targetItem.status === 'CURRENT' || idx === (roomState.passwordCurrentIndex ?? 0);
                  const isCorrect = targetItem.status === 'CORRECT' || targetItem.isGuessed;
                  const isSkipped = targetItem.status === 'SKIPPED';
                  return (
                    <div
                      key={targetItem.id || idx}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold border transition-all ${
                        isCorrect
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black shadow-sm'
                          : isSkipped
                          ? 'bg-slate-800 text-slate-400 border-slate-700/80'
                          : isCurrent
                          ? 'bg-amber-400 text-slate-950 border-amber-300 font-black scale-110 shadow-md ring-2 ring-amber-400/40'
                          : 'bg-slate-900 text-slate-500 border-slate-800'
                      }`}
                      title={
                        isCorrect
                          ? `Palabra ${idx + 1}: Acertada`
                          : isSkipped
                          ? `Palabra ${idx + 1}: Pasada`
                          : isCurrent
                          ? `Palabra ${idx + 1}: En curso`
                          : `Palabra ${idx + 1}: Pendiente`
                      }
                    >
                      {isCorrect ? '✓' : isSkipped ? '↷' : idx + 1}
                    </div>
                  );
                })}
              </div>

              {/* Large Clue Counter Controls [ - ] [ + ] (min 48px) */}
              <div className="p-3 sm:p-4 rounded-3xl bg-slate-950 border border-slate-800 space-y-2.5 sm:space-y-3 min-w-0">
                <div className="text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-400">
                  Pulsa [+] cada vez que digas una pista verbal:
                </div>
                <div className="flex items-center justify-center gap-2 sm:gap-4 min-w-0">
                  <button
                    id="btn-decrement-clue"
                    type="button"
                    disabled={clueWordCount <= 0}
                    onClick={() => {
                      audio.playTick();
                      onDecrementClueCount?.();
                    }}
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-black text-xl sm:text-2xl transition-all shrink-0 ${
                      clueWordCount <= 0
                        ? 'bg-slate-800 text-slate-600 border border-slate-700/50 cursor-not-allowed'
                        : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 cursor-pointer active:scale-95'
                    }`}
                    title="Restar pista si pulsaste por error"
                  >
                    <Minus className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3]" />
                  </button>

                  <div className="px-3 sm:px-6 py-2 rounded-2xl bg-slate-900 border border-slate-700 text-center min-w-[100px] sm:min-w-[140px] flex-1 max-w-[160px]">
                    <div className="font-mono text-2xl sm:text-4xl font-black text-amber-400">
                      {clueWordCount} / {clueBudget}
                    </div>
                    <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase block">Pistas</span>
                  </div>

                  <button
                    id="btn-increment-clue"
                    type="button"
                    onClick={() => {
                      audio.playSpark();
                      onIncrementClueCount?.();
                    }}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xl sm:text-2xl flex items-center justify-center transition-all shadow-lg shadow-amber-500/25 active:scale-95 cursor-pointer shrink-0"
                    title="Añadir pista hablada"
                  >
                    <Plus className="w-6 h-6 sm:w-7 sm:h-7 stroke-[3]" />
                  </button>
                </div>
              </div>

              {/* Action Buttons: Mark Guessed, Skip Word & Finish Turn */}
              <div className="space-y-2 pt-1 sm:pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    id="btn-password-guessed"
                    type="button"
                    onClick={() => {
                      audio.playAnswerAccepted();
                      onMarkPasswordGuessed?.();
                    }}
                    className="w-full py-3.5 sm:py-4 px-4 rounded-2xl bg-[#10B981] hover:bg-[#059669] text-slate-950 font-black text-xs xs:text-sm sm:text-base uppercase tracking-wider transition-all shadow-xl shadow-[#10B981]/25 active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3] shrink-0" />
                    <span>✓ Acertada</span>
                  </button>

                  <button
                    id="btn-password-skip"
                    type="button"
                    onClick={() => {
                      audio.playTurnChange();
                      onSkipPasswordWord?.();
                    }}
                    className="w-full py-3.5 sm:py-4 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs xs:text-sm sm:text-base uppercase tracking-wider transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <SkipForward className="w-5 h-5 stroke-[2.5] shrink-0 text-slate-400" />
                    <span>Pasar palabra</span>
                  </button>
                </div>

                <div className="flex justify-center pt-1">
                  <button
                    type="button"
                    onClick={() => setIsFinishModalOpen(true)}
                    className="text-xs font-bold text-slate-400 hover:text-slate-200 underline cursor-pointer py-1"
                  >
                    Terminar turno antes de tiempo
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TEAMMATES VIEW FOR CONTRASEÑA */}
          {isTeammate && (
            <div className="p-5 xs:p-8 sm:p-12 rounded-3xl bg-slate-900/90 border-2 border-teal-500/40 shadow-2xl text-center space-y-4 sm:space-y-6 min-w-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-teal-500/20 border-2 border-teal-500/50 flex items-center justify-center animate-pulse">
                <Volume2 className="w-8 h-8 sm:w-10 sm:h-10 text-teal-300" />
              </div>
              <div className="space-y-1.5 sm:space-y-2 max-w-md mx-auto">
                <span className="text-[10px] sm:text-xs font-bold text-teal-400 uppercase tracking-widest block">
                  {descriptor?.name} está dando las pistas
                </span>
                <h2 className="text-2xl xs:text-3xl sm:text-4xl font-black font-display text-white">
                  ¡Adivinad en voz alta!
                </h2>
                <p className="text-slate-300 text-xs sm:text-sm sm:text-base leading-relaxed">
                  Escuchad cada pista que os dé {descriptor?.name}. ¡Cuantas menos palabras use para las 10 contraseñas, mayor será la bonificación de puntos!
                </p>
              </div>

              {/* Teammates checklist */}
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-2">Progreso de la ronda:</span>
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
                  {(roomState.passwordTargetsProgress || []).map((targetItem, idx) => (
                    <div
                      key={targetItem.id || idx}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold border transition-all ${
                        targetItem.status === 'CORRECT'
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                          : targetItem.status === 'SKIPPED'
                          ? 'bg-slate-800 text-slate-400 border-slate-700'
                          : targetItem.status === 'CURRENT'
                          ? 'bg-amber-400 text-slate-950 border-amber-300 font-black scale-110 ring-2 ring-amber-400/40'
                          : 'bg-slate-900 text-slate-500 border-slate-800'
                      }`}
                    >
                      {targetItem.status === 'CORRECT' ? '✓' : targetItem.status === 'SKIPPED' ? '↷' : idx + 1}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* RIVALS VIEW FOR CONTRASEÑA */}
          {isRival && (
            <div className="p-4 xs:p-6 sm:p-8 rounded-3xl bg-slate-900/90 border-2 border-amber-500/40 shadow-2xl text-center space-y-3 sm:space-y-4 min-w-0">
              <div className="flex items-center justify-center gap-1.5 text-amber-400 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b border-slate-800 pb-2.5">
                <Shield className="w-4 h-4" />
                <span>Observando el turno de {activeTeam.name}</span>
              </div>
              <p className="text-slate-300 text-xs sm:text-sm sm:text-base">
                {descriptor?.name} está dando pistas a su equipo. Observa si logran adivinar las 10 palabras dentro del presupuesto de 15 pistas.
              </p>

              {/* Rivals checklist */}
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-2">Progreso del rival:</span>
                <div className="flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap">
                  {(roomState.passwordTargetsProgress || []).map((targetItem, idx) => (
                    <div
                      key={targetItem.id || idx}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold border transition-all ${
                        targetItem.status === 'CORRECT'
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                          : targetItem.status === 'SKIPPED'
                          ? 'bg-slate-800 text-slate-400 border-slate-700'
                          : targetItem.status === 'CURRENT'
                          ? 'bg-amber-400 text-slate-950 border-amber-300 font-black scale-110 ring-2 ring-amber-400/40'
                          : 'bg-slate-900 text-slate-500 border-slate-800'
                      }`}
                    >
                      {targetItem.status === 'CORRECT' ? '✓' : targetItem.status === 'SKIPPED' ? '↷' : idx + 1}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODE 3: EMOJI MISTERIOSO ACTIVE TURN
          ========================================================================= */}
      {mode === 'EMOJI' && (
        <div className="space-y-3 sm:space-y-4 min-w-0">
          {/* Public Score Counter for Emoji */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-center min-w-0">
              <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider block">Acertadas</span>
              <span className="font-mono text-xl sm:text-2xl font-black text-emerald-400">
                {roomState.emojiCorrectCount ?? 0}
              </span>
            </div>
            <div className="p-2.5 sm:p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-center min-w-0">
              <span className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider block">Pasadas (-1 pt)</span>
              <span className="font-mono text-xl sm:text-2xl font-black text-rose-400">
                {roomState.emojiSkipCount ?? 0}
              </span>
            </div>
          </div>

          {/* DESCRIPTOR VIEW FOR EMOJI */}
          {isDescriptor && (
            <div className="p-3.5 xs:p-5 sm:p-8 rounded-3xl bg-slate-900/95 border-2 border-[#10B981]/50 shadow-2xl space-y-4 sm:space-y-6 min-w-0">
              {/* STEP 1: CHOOSE 1 OF 3 OPTIONS */}
              {(!roomState.emojiSelectedTargetId || roomState.emojiPhase === 'CHOOSE_OPTION') && (
                <div className="space-y-3 sm:space-y-4 min-w-0">
                  <div className="text-center space-y-1">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#10B981] block">
                      Paso 1: Elige el título secreto
                    </span>
                    <h3 className="text-lg xs:text-xl sm:text-2xl font-black text-white">
                      ¿Qué quieres que adivine tu equipo?
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-1">
                    {(roomState.emojiCandidateOptions || []).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          audio.playSpark();
                          onChooseEmojiOption?.(opt.id);
                        }}
                        className="p-3 sm:p-4 rounded-2xl bg-stone-950 border border-stone-800 hover:border-[#10B981] hover:bg-stone-900/80 transition-all text-left flex flex-col justify-between cursor-pointer group shadow-lg active:scale-95 min-w-0"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-stone-800 text-stone-300 flex items-center gap-1">
                            {opt.category === 'MOVIE' ? <Film className="w-3 h-3 text-amber-400" /> : <Gamepad2 className="w-3 h-3 text-cyan-400" />}
                            {opt.category === 'MOVIE' ? 'Cine' : 'Juego'}
                          </span>
                          <span className="text-[11px] font-bold text-[#10B981] opacity-0 group-hover:opacity-100 transition-opacity">
                            Elegir →
                          </span>
                        </div>
                        <div className="text-base sm:text-lg font-black text-white group-hover:text-[#10B981] transition-colors leading-tight break-words">
                          {opt.title}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2: COMPOSE EMOJI CLUE & GUESSING */}
              {roomState.emojiSelectedTargetId && (
                <div className="space-y-4 sm:space-y-6 min-w-0">
                  {/* Selected Title banner */}
                  <div className="p-3 sm:p-4 rounded-2xl bg-stone-950 border border-stone-800 text-center space-y-1 min-w-0">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#10B981] block">
                      Título que deben adivinar:
                    </span>
                    <div className="text-xl xs:text-2xl sm:text-4xl font-black font-display text-white uppercase break-words px-1">
                      {roomState.emojiSelectedTitle}
                    </div>
                  </div>

                  {/* Clue preview box */}
                  <div className="p-3.5 sm:p-5 rounded-3xl bg-slate-950 border-2 border-emerald-500/40 text-center space-y-2 min-w-0">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
                      <span>Pista en pantalla:</span>
                      <span className="font-mono text-[#10B981]">{Array.from(localEmojiDraft).length} / 5</span>
                    </div>

                    <div className="min-h-[56px] sm:min-h-[64px] flex items-center justify-center gap-1.5 sm:gap-2 text-3xl sm:text-5xl font-mono tracking-widest bg-slate-900/60 p-2.5 sm:p-3 rounded-2xl border border-slate-800 break-all">
                      {localEmojiDraft || <span className="text-xs sm:text-base text-slate-600 font-normal italic">Toca emojis abajo para crear la pista...</span>}
                    </div>

                    <div className="flex justify-end gap-1.5 sm:gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleRemoveLastEmoji}
                        disabled={!localEmojiDraft}
                        className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] sm:text-xs font-bold flex items-center gap-1 cursor-pointer disabled:opacity-40"
                      >
                        <Delete className="w-3.5 h-3.5" /> Borrar último
                      </button>
                      <button
                        type="button"
                        onClick={handleClearEmojis}
                        disabled={!localEmojiDraft}
                        className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-300 text-[11px] sm:text-xs font-bold cursor-pointer disabled:opacity-40"
                      >
                        Limpiar
                      </button>
                    </div>
                  </div>

                  {/* Mobile-friendly quick emoji keypad */}
                  <div className="space-y-1.5 sm:space-y-2 min-w-0">
                    <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Teclado de Emojis Rápidos:
                    </span>
                    <div className="grid grid-cols-8 xs:grid-cols-10 gap-1 sm:gap-1.5 p-2 sm:p-3 rounded-2xl bg-slate-950 border border-slate-800 max-h-44 overflow-y-auto">
                      {POPULAR_EMOJIS.map((em, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleAddEmoji(em)}
                          disabled={Array.from(localEmojiDraft).length >= 5}
                          className="h-9 sm:h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-lg sm:text-2xl flex items-center justify-center transition-transform active:scale-90 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          {em}
                        </button>
                      ))}
                    </div>

                    {/* Manual input for any custom native keyboard emoji */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="O escribe emoji con teclado..."
                        value={localEmojiDraft}
                        onChange={(e) => {
                          const val = e.target.value;
                          const chars = Array.from(val).slice(0, 5).join('');
                          setLocalEmojiDraft(chars);
                          onUpdateEmojiClue?.(chars);
                        }}
                        maxLength={15}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm font-mono text-white placeholder-slate-600 focus:outline-none focus:border-[#10B981]"
                      />
                    </div>
                  </div>

                  {/* Action Buttons: Acertada & Pasar */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-1">
                    <button
                      id="btn-emoji-guessed"
                      type="button"
                      onClick={() => {
                        audio.playAnswerAccepted();
                        onMarkEmojiGuessed?.();
                      }}
                      className="py-3 xs:py-4 px-2 xs:px-4 rounded-2xl bg-[#10B981] hover:bg-[#059669] text-slate-950 font-black text-xs xs:text-sm sm:text-base uppercase tracking-wider transition-all shadow-xl shadow-[#10B981]/25 active:scale-95 flex items-center justify-center gap-1 sm:gap-2 cursor-pointer"
                    >
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3] shrink-0" />
                      <span>✓ Acertada (+1)</span>
                    </button>

                    <button
                      id="btn-emoji-skip"
                      type="button"
                      onClick={() => {
                        audio.playBombWarning();
                        onSkipEmoji?.();
                      }}
                      className="py-3 xs:py-4 px-2 xs:px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/30 font-black text-xs xs:text-sm sm:text-base uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1 sm:gap-2 cursor-pointer"
                    >
                      <SkipForward className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                      <span>✕ Pasar (-1)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TEAMMATES VIEW FOR EMOJI */}
          {isTeammate && (
            <div className="p-5 xs:p-8 sm:p-12 rounded-3xl bg-slate-900/90 border-2 border-teal-500/40 shadow-2xl text-center space-y-4 sm:space-y-6 min-w-0">
              <div className="flex items-center justify-center gap-2">
                <span className="text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase tracking-widest flex items-center gap-1.5">
                  {roomState.emojiSelectedCategory === 'MOVIE' ? <Film className="w-3.5 h-3.5" /> : <Gamepad2 className="w-3.5 h-3.5" />}
                  {roomState.emojiSelectedCategory === 'MOVIE' ? 'Película' : 'Videojuego'}
                </span>
              </div>

              {/* Large Emoji Clue Display */}
              <div className="p-4 sm:p-6 rounded-3xl bg-slate-950 border border-slate-800 min-w-0">
                <div className="min-h-[60px] sm:min-h-[80px] flex items-center justify-center text-4xl sm:text-7xl tracking-widest font-mono break-all">
                  {roomState.emojiClue || (
                    <span className="text-xs sm:text-sm text-slate-500 font-normal italic animate-pulse">
                      {descriptor?.name} está eligiendo los emojis...
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl xs:text-3xl sm:text-4xl font-black font-display text-white">
                  ¡Adivinad el título en voz alta!
                </h2>
                <p className="text-slate-300 text-xs sm:text-sm sm:text-base">
                  Gritad vuestras respuestas. Cuando digáis el título correcto, {descriptor?.name} marcará ¡Acertada!
                </p>
              </div>
            </div>
          )}

          {/* RIVALS VIEW FOR EMOJI */}
          {isRival && (
            <div className="p-4 xs:p-6 sm:p-8 rounded-3xl bg-slate-900/90 border-2 border-amber-500/40 shadow-2xl text-center space-y-3 sm:space-y-4 min-w-0">
              <div className="flex items-center justify-center gap-1.5 text-amber-400 text-[11px] sm:text-xs font-bold uppercase tracking-wider border-b border-slate-800 pb-2.5">
                <Shield className="w-4 h-4" />
                <span>Observando emojis de {descriptor?.name}</span>
              </div>

              <div className="p-4 sm:p-6 rounded-3xl bg-slate-950 border border-slate-800 min-w-0">
                <div className="min-h-[50px] sm:min-h-[70px] flex items-center justify-center text-4xl sm:text-6xl tracking-widest font-mono break-all">
                  {roomState.emojiClue || (
                    <span className="text-xs text-slate-500 font-normal italic">Esperando emojis...</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Finish Turn Confirmation Modal (accessible, clean Spanish UI, no window.confirm) */}
      {isFinishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-5 sm:p-6 rounded-3xl bg-slate-900 border-2 border-amber-500/40 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto text-2xl">
              ⏱️
            </div>
            <div className="space-y-1">
              <h3 className="text-lg sm:text-xl font-black text-white font-display">
                ¿Terminar turno ahora?
              </h3>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                Se contabilizarán los <strong>{roomState.passwordCorrectCount ?? 0} aciertos</strong> conseguidos hasta este momento y se aplicará la bonificación o penalización según las pistas usadas ({clueWordCount} / {clueBudget}).
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsFinishModalOpen(false)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs sm:text-sm cursor-pointer"
              >
                Continuar jugando
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsFinishModalOpen(false);
                  onFinishPasswordTurn?.();
                }}
                className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm cursor-pointer shadow-lg shadow-amber-500/25 active:scale-95"
              >
                Terminar turno
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
