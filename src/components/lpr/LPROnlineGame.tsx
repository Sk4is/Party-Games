import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LPRRoomState,
  LPRPlayerState,
  LPRShuffledCard,
  BoardCursor,
} from '../../types/multiplayer';
import { LaPeorRespuestaConfig, LPRPlayer, AnswerCard } from '../../types';
import { LPRLobby } from './LPRLobby';
import { BlackCardVisual } from '../BlackCardVisual';
import { WhiteCardVisual } from '../WhiteCardVisual';
import { ResultsPhaseView } from '../ResultsPhaseView';
import { FinalResultsView } from '../FinalResultsView';
import { AbandonConfirmationModal } from '../common/AbandonConfirmationModal';
import { LiveCursorsLayer } from '../common/LiveCursorsLayer';
import { SoundToggle } from '../SoundToggle';
import { audio } from '../../utils/audio';
import {
  ArrowLeft,
  Sparkles,
  Send,
  CheckCircle2,
  Lock,
  Vote,
  Users,
  Eye,
  RotateCcw,
  Trophy,
} from 'lucide-react';

interface LPROnlineGameProps {
  roomState: LPRRoomState;
  currentUserId: string;
  otherCursors: Record<string, BoardCursor>;
  onUpdateConfig: (cfg: Partial<LaPeorRespuestaConfig>) => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
  onSubmitAnswer: (text: string) => void;
  onRevealCard: (cardId: string) => void;
  onRevealAll: () => void;
  onProceedVoting: () => void;
  onSubmitVote: (cardId: string) => void;
  onCursorMove: (x: number, y: number) => void;
  onNextRound: () => void;
  onPlayAgain: () => void;
}

export const LPROnlineGame: React.FC<LPROnlineGameProps> = ({
  roomState,
  currentUserId,
  otherCursors,
  onUpdateConfig,
  onStartGame,
  onLeaveRoom,
  onSubmitAnswer,
  onRevealCard,
  onRevealAll,
  onProceedVoting,
  onSubmitVote,
  onCursorMove,
  onNextRound,
  onPlayAgain,
}) => {
  const [isAbandonModalOpen, setIsAbandonModalOpen] = useState(false);
  const [localAnswerText, setLocalAnswerText] = useState('');
  const [hasLockedAnswer, setHasLockedAnswer] = useState(false);
  const [selectedVoteCardId, setSelectedVoteCardId] = useState<string | null>(null);

  const boardContainerRef = useRef<HTMLDivElement>(null);
  const lastCursorSentRef = useRef<number>(0);

  // Reset local inputs when round changes
  useEffect(() => {
    setLocalAnswerText('');
    setHasLockedAnswer(false);
    setSelectedVoteCardId(null);
  }, [roomState.round]);

  // Cursor Move Handler (Normalized 0..1 coordinates)
  const handleBoardPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (roomState.phase !== 'REVEAL' && roomState.phase !== 'VOTING') return;
    if (!boardContainerRef.current) return;

    const now = Date.now();
    if (now - lastCursorSentRef.current < 35) return;
    lastCursorSentRef.current = now;

    const rect = boardContainerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    onCursorMove(x, y);
  };

  if (roomState.phase === 'LOBBY') {
    return (
      <LPRLobby
        roomState={roomState}
        currentUserId={currentUserId}
        onUpdateConfig={onUpdateConfig}
        onStartGame={onStartGame}
        onLeaveRoom={onLeaveRoom}
      />
    );
  }

  const isHost = roomState.hostId === currentUserId;
  const connectedPlayers = roomState.players.filter((p) => p.isConnected);
  const myPlayer = roomState.players.find((p) => p.id === currentUserId);
  const hasMyVoteSubmitted = myPlayer?.hasVoted || false;
  const hasMyAnswerSubmitted = hasLockedAnswer || myPlayer?.hasSubmittedAnswer || false;

  // Answers conversion for ResultsView
  const castAnswers: AnswerCard[] = roomState.answers.map((a) => ({
    id: a.id,
    authorId: a.authorId || '',
    authorName: a.authorName || 'Anónimo',
    authorAvatar: a.authorAvatar || '👤',
    authorColor: a.authorColor || '#f59e0b',
    text: a.text,
    revealed: a.revealed,
    votes: a.votes || [],
  }));

  const castPlayers: LPRPlayer[] = roomState.players.map((p) => ({
    id: p.id,
    name: p.name,
    avatar: p.avatar,
    color: p.color,
    score: p.score,
  }));

  // Handle local submit answer
  const handleAnswerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = localAnswerText.trim();
    if (!trimmed) return;

    audio.playSpark();
    setHasLockedAnswer(true);
    onSubmitAnswer(trimmed);
  };

  // Handle local submit vote
  const handleVoteSubmit = () => {
    if (!selectedVoteCardId) return;
    audio.playVoteSelected();
    onSubmitVote(selectedVoteCardId);
  };

  const isLastRound =
    roomState.config.totalRounds !== -1 &&
    roomState.round >= roomState.config.totalRounds;

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-between select-none relative overflow-x-hidden font-sans">
      {/* Top Header */}
      <header className="relative z-30 w-full px-4 sm:px-6 py-3 flex items-center justify-between border-b border-stone-800/80 bg-stone-950/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsAbandonModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-900 hover:bg-stone-800 text-xs font-semibold text-stone-300 hover:text-white border border-stone-800 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Menú</span>
          </button>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-900 border border-stone-800 text-xs text-stone-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono font-bold text-amber-400">{roomState.code}</span>
          </div>
        </div>

        {/* Center: Round Tracker */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1 rounded-full bg-stone-900 border border-stone-800 text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              Ronda {roomState.round} {roomState.config.totalRounds !== -1 && `de ${roomState.config.totalRounds}`}
            </span>
          </div>
        </div>

        {/* Right: Sound */}
        <div className="flex items-center gap-2">
          <SoundToggle />
        </div>
      </header>

      {/* Main Body */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-start p-4 sm:p-6 max-w-6xl w-full mx-auto">
        {/* ==================================================== */}
        {/* PHASE 1: WRITING (SIMULTANEOUS PRIVATE WRITING) */}
        {/* ==================================================== */}
        {roomState.phase === 'WRITING' && (
          <div className="w-full max-w-3xl space-y-6 animate-fadeIn py-2">
            <div className="text-center space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Fase de Escritura Secreta
              </span>
              <h2 className="text-2xl sm:text-3xl font-black font-serif text-white">
                COMPLETA LA FRASE
              </h2>
            </div>

            {/* Black Card */}
            {roomState.currentBlackCard && (
              <div className="flex justify-center">
                <BlackCardVisual
                  card={roomState.currentBlackCard}
                  className="w-full max-w-md shadow-2xl"
                />
              </div>
            )}

            {/* Ready Status Bar */}
            <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-3.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-stone-200">
                  {roomState.readyCount} de {connectedPlayers.length} respuestas listas
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {connectedPlayers.map((p) => (
                  <div
                    key={p.id}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm border transition-all ${
                      p.hasSubmittedAnswer || (p.id === currentUserId && hasMyAnswerSubmitted)
                        ? 'bg-emerald-950 border-emerald-500 shadow-sm'
                        : 'bg-stone-950 border-stone-800 opacity-60'
                    }`}
                    title={p.name}
                  >
                    {p.avatar}
                  </div>
                ))}
              </div>
            </div>

            {/* Private Writing Box */}
            {!hasMyAnswerSubmitted ? (
              <form
                onSubmit={handleAnswerSubmit}
                className="bg-stone-900/90 border border-stone-800 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4"
              >
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-stone-300">
                    Tu Respuesta Privada
                  </label>
                  <span className="text-[11px] text-stone-500">
                    Nadie podrá verla hasta la revelación
                  </span>
                </div>

                <textarea
                  rows={3}
                  value={localAnswerText}
                  onChange={(e) => setLocalAnswerText(e.target.value)}
                  placeholder="Escribe aquí tu peor o más divertida respuesta..."
                  className="w-full p-4 bg-stone-950 border border-stone-800 rounded-2xl text-stone-100 placeholder-stone-600 text-base font-semibold focus:outline-none focus:border-amber-500 transition-colors resize-none"
                  autoFocus
                />

                <button
                  type="submit"
                  disabled={!localAnswerText.trim()}
                  className="w-full py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-sm uppercase tracking-wider transition-all shadow-xl shadow-amber-500/20 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Lock className="w-4 h-4" />
                  Confirmar y Bloquear Respuesta
                </button>
              </form>
            ) : (
              <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-6 shadow-2xl text-center space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Respuesta Enviada</span>
                </div>
                <h3 className="text-lg font-bold text-white">
                  ¡Tu respuesta está a salvo!
                </h3>
                <p className="text-xs text-stone-400 max-w-sm mx-auto">
                  «<span className="text-stone-200 font-semibold">{localAnswerText || 'Tu respuesta'}</span>»
                </p>
                <p className="text-xs text-amber-400/90 font-medium">
                  Esperando a que el resto de jugadores terminen de escribir...
                </p>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* PHASE 2: REVEAL (SHARED CARDS & LIVE CURSORS) */}
        {/* ==================================================== */}
        {roomState.phase === 'REVEAL' && (
          <div
            ref={boardContainerRef}
            onPointerMove={handleBoardPointerMove}
            className="relative w-full space-y-6 animate-fadeIn py-2 cursor-default"
          >
            {/* Live Multiplayer Cursors Layer */}
            <LiveCursorsLayer
              cursors={otherCursors}
              currentUserId={currentUserId}
            />

            <div className="text-center space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Mesa Compartida en Tiempo Real
              </span>
              <h2 className="text-2xl sm:text-3xl font-black font-serif text-white">
                TOCA CADA CARTA PARA REVELARLA
              </h2>
            </div>

            {/* Black Card */}
            {roomState.currentBlackCard && (
              <div className="flex justify-center">
                <BlackCardVisual
                  card={roomState.currentBlackCard}
                  className="w-full max-w-md shadow-2xl"
                />
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-semibold text-stone-400">
                {roomState.answers.filter((a) => a.revealed).length} de {roomState.answers.length} cartas descubiertas
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onRevealAll}
                  className="px-3.5 py-1.5 rounded-full bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Revelar Todas
                </button>

                {isHost && (
                  <button
                    type="button"
                    onClick={onProceedVoting}
                    className="px-3.5 py-1.5 rounded-full bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-black transition-colors"
                  >
                    Pasar a Votación →
                  </button>
                )}
              </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {roomState.answers.map((card) => (
                <div key={card.id} className="relative">
                  <WhiteCardVisual
                    text={card.text}
                    isRevealed={card.revealed}
                    onFlip={() => onRevealCard(card.id)}
                  />
                  {card.isOwnCard && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-stone-900/90 border border-stone-700 text-[10px] font-bold text-stone-300 shadow">
                      Tuya
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* PHASE 3: VOTING (SIMULTANEOUS SECRET VOTING) */}
        {/* ==================================================== */}
        {roomState.phase === 'VOTING' && (
          <div
            ref={boardContainerRef}
            onPointerMove={handleBoardPointerMove}
            className="relative w-full space-y-6 animate-fadeIn py-2 cursor-default"
          >
            {/* Live Multiplayer Cursors Layer */}
            <LiveCursorsLayer
              cursors={otherCursors}
              currentUserId={currentUserId}
            />

            <div className="text-center space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center justify-center gap-1.5">
                <Vote className="w-3.5 h-3.5" />
                Votación Simultánea Secreta
              </span>
              <h2 className="text-2xl sm:text-3xl font-black font-serif text-white">
                ELIGE LA MEJOR RESPUESTA
              </h2>
            </div>

            {/* Black Card */}
            {roomState.currentBlackCard && (
              <div className="flex justify-center">
                <BlackCardVisual
                  card={roomState.currentBlackCard}
                  className="w-full max-w-md shadow-2xl"
                />
              </div>
            )}

            {/* Voting Progress Status */}
            <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-3.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Vote className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-stone-200">
                  {roomState.votedCount} de {connectedPlayers.length} votos emitidos
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {connectedPlayers.map((p) => (
                  <div
                    key={p.id}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm border transition-all ${
                      p.hasVoted
                        ? 'bg-amber-950 border-amber-500 shadow-sm'
                        : 'bg-stone-950 border-stone-800 opacity-60'
                    }`}
                    title={p.name}
                  >
                    {p.avatar}
                  </div>
                ))}
              </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {roomState.answers.map((card) => {
                const isSelected = selectedVoteCardId === card.id;
                const isOwn = card.isOwnCard;

                return (
                  <div key={card.id} className="relative">
                    <WhiteCardVisual
                      text={card.text}
                      isRevealed={true}
                      isSelectable={!hasMyVoteSubmitted && !isOwn}
                      isSelected={isSelected}
                      isDisabled={isOwn || hasMyVoteSubmitted}
                      disabledReason={isOwn ? 'TU RESPUESTA' : undefined}
                      onSelect={() => {
                        if (!isOwn && !hasMyVoteSubmitted) {
                          audio.playTick();
                          setSelectedVoteCardId(card.id);
                        }
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Bottom Floating Vote Confirmation Button */}
            {!hasMyVoteSubmitted ? (
              <div className="sticky bottom-4 z-40 max-w-md mx-auto w-full pt-4">
                <button
                  type="button"
                  disabled={!selectedVoteCardId}
                  onClick={handleVoteSubmit}
                  className="w-full py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-sm uppercase tracking-wider transition-all shadow-2xl shadow-amber-500/30 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Vote className="w-5 h-5" />
                  Confirmar Voto
                </button>
              </div>
            ) : (
              <div className="sticky bottom-4 z-40 max-w-md mx-auto w-full p-4 rounded-2xl bg-stone-900/95 border border-stone-800 shadow-2xl text-center backdrop-blur-md">
                <span className="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5 mb-0.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Voto registrado en secreto
                </span>
                <p className="text-xs text-stone-400">
                  Esperando a que el resto de jugadores emitan su voto...
                </p>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* PHASE 4: RESULTS */}
        {/* ==================================================== */}
        {roomState.phase === 'RESULTS' && roomState.currentBlackCard && (
          <div className="w-full">
            <ResultsPhaseView
              round={roomState.round}
              totalRounds={roomState.config.totalRounds}
              blackCard={roomState.currentBlackCard}
              players={castPlayers}
              answers={castAnswers}
              onNextRound={onNextRound}
              isLastRound={isLastRound}
            />

            {!isHost && (
              <div className="text-center py-4">
                <span className="text-xs text-stone-400">
                  Esperando a que el anfitrión avance de ronda...
                </span>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* PHASE 5: FINAL RESULTS */}
        {/* ==================================================== */}
        {roomState.phase === 'FINAL_RESULTS' && (
          <div className="w-full">
            <FinalResultsView
              players={castPlayers}
              totalRoundsPlayed={roomState.round}
              onPlayAgain={onPlayAgain}
              onBackToMenu={onLeaveRoom}
            />
          </div>
        )}
      </main>

      {/* Abandon Confirmation Modal */}
      <AbandonConfirmationModal
        isOpen={isAbandonModalOpen}
        onCancel={() => setIsAbandonModalOpen(false)}
        onConfirm={onLeaveRoom}
      />
    </div>
  );
};
