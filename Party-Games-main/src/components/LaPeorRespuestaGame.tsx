import React, { useState, useEffect, useMemo } from 'react';
import {
  BlackCard,
  LPRPlayer,
  AnswerCard,
  LaPeorRespuestaConfig,
  LaPeorRespuestaPhase,
} from '../types';
import { getNextBlackCard } from '../data/blackCards';
import { SecretWritingModal } from './SecretWritingModal';
import { RevealPhaseView } from './RevealPhaseView';
import { VotingPhaseView } from './VotingPhaseView';
import { ResultsPhaseView } from './ResultsPhaseView';
import { FinalResultsView } from './FinalResultsView';
import { AbandonConfirmationModal } from './AbandonConfirmationModal';
import { SoundToggle } from './SoundToggle';
import { ArrowLeft, Sparkles, Award } from 'lucide-react';
import { audio } from '../utils/audio';

interface LaPeorRespuestaGameProps {
  initialPlayers: LPRPlayer[];
  config: LaPeorRespuestaConfig;
  onBackToMenu: () => void;
}

// Utility: Fisher-Yates array shuffle to anonymize card order
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const LaPeorRespuestaGame: React.FC<LaPeorRespuestaGameProps> = ({
  initialPlayers,
  config,
  onBackToMenu,
}) => {
  const [players, setPlayers] = useState<LPRPlayer[]>(initialPlayers);
  const [phase, setPhase] = useState<LaPeorRespuestaPhase>('WRITING');
  const [round, setRound] = useState<number>(1);
  const totalRounds = config.totalRounds;

  // Track used black cards to avoid duplicates within a match
  const [usedBlackCardIds, setUsedBlackCardIds] = useState<Set<string>>(new Set());

  // Current active black card
  const [currentBlackCard, setCurrentBlackCard] = useState<BlackCard>(() => {
    const card = getNextBlackCard(new Set());
    return card;
  });

  // Track answers in this round
  const [submissions, setSubmissions] = useState<AnswerCard[]>([]);
  // Shuffled answers for anonymous reveal & voting
  const [shuffledAnswers, setShuffledAnswers] = useState<AnswerCard[]>([]);

  // Abandon game modal state
  const [showAbandonModal, setShowAbandonModal] = useState<boolean>(false);

  // Initialize used cards set with starting card
  useEffect(() => {
    setUsedBlackCardIds(new Set([currentBlackCard.id]));
  }, []);

  // Handler: When all players have finished writing their secret answers
  const handleCompleteAllSubmissions = (writtenAnswers: AnswerCard[]) => {
    setSubmissions(writtenAnswers);
    // Anonymize: strictly shuffle the answers before reveal!
    const randomized = shuffleArray(writtenAnswers);
    setShuffledAnswers(randomized);
    setPhase('REVEAL');
  };

  // Handler: When a card is flipped in the reveal phase
  const handleCardFlipped = (cardId: string) => {
    setShuffledAnswers((prev) =>
      prev.map((card) => (card.id === cardId ? { ...card, revealed: true } : card))
    );
  };

  // Handler: All cards revealed -> proceed to secret voting
  const handleProceedToVoting = () => {
    setPhase('VOTING');
  };

  // Handler: When all secret votes have been collected
  const handleCompleteAllVotes = (votesMap: Record<string, string>) => {
    // Map votes into each answer
    const answersWithVotes = shuffledAnswers.map((answer) => {
      const votersForThisCard = Object.entries(votesMap)
        .filter(([, cardId]) => cardId === answer.id)
        .map(([voterId]) => voterId);

      return {
        ...answer,
        votes: votersForThisCard,
      };
    });

    setShuffledAnswers(answersWithVotes);

    // Calculate maximum votes and winning author(s)
    const maxVotes = Math.max(...answersWithVotes.map((a) => a.votes.length), 0);
    const winningAnswers = answersWithVotes.filter(
      (a) => a.votes.length === maxVotes && maxVotes > 0
    );

    // Award +1 point to every winning player (including ties!)
    const winningAuthorIds = new Set(winningAnswers.map((w) => w.authorId));

    setPlayers((prevPlayers) =>
      prevPlayers.map((p) =>
        winningAuthorIds.has(p.id) ? { ...p, score: p.score + 1 } : p
      )
    );

    setPhase('RESULTS');
  };

  // Handler: Proceed to next round or final scoreboard
  const handleNextRound = () => {
    const isFinished = totalRounds !== -1 && round >= totalRounds;

    if (isFinished) {
      setPhase('FINAL_RESULTS');
    } else {
      // Pick a new, unused black card
      const newCard = getNextBlackCard(usedBlackCardIds);
      setCurrentBlackCard(newCard);
      setUsedBlackCardIds((prev) => new Set([...prev, newCard.id]));

      // Reset round submissions
      setSubmissions([]);
      setShuffledAnswers([]);

      setRound((prev) => prev + 1);
      setPhase('WRITING');
      audio.playCardDealt();
    }
  };

  // Handler: Play again with same players
  const handlePlayAgain = () => {
    setPlayers(initialPlayers.map((p) => ({ ...p, score: 0 })));
    setRound(1);
    const firstCard = getNextBlackCard(new Set());
    setCurrentBlackCard(firstCard);
    setUsedBlackCardIds(new Set([firstCard.id]));
    setSubmissions([]);
    setShuffledAnswers([]);
    setPhase('WRITING');
    audio.playCardDealt();
  };

  const isLastRound = totalRounds !== -1 && round >= totalRounds;

  return (
    <div className="min-h-screen w-full flex flex-col justify-between p-4 sm:p-6 md:p-8 bg-radial from-stone-950 via-slate-950 to-black text-slate-100 selection:bg-amber-400 selection:text-slate-950">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between w-full max-w-6xl mx-auto pb-4 border-b border-stone-800/80">
        {/* Discreet Menu Button */}
        <button
          type="button"
          onClick={() => setShowAbandonModal(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-stone-900/90 hover:bg-stone-800 border border-stone-800 hover:border-stone-700 text-stone-400 hover:text-stone-200 text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Menú</span>
        </button>

        {/* Center: Game Title & Round tracker */}
        <div className="flex items-center gap-2.5 text-center">
          <span className="text-xl">💀</span>
          <div>
            <h1 className="font-display font-black text-sm sm:text-base text-stone-100 tracking-wider">
              LA PEOR RESPUESTA
            </h1>
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-widest block -mt-0.5">
              Ronda {round} {totalRounds !== -1 ? `de ${totalRounds}` : '(Modo Libre)'}
            </span>
          </div>
        </div>

        {/* Right: Sound toggle */}
        <SoundToggle />
      </header>

      {/* Main Game Phase Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto py-4 sm:py-6 flex flex-col justify-center items-center">
        {phase === 'WRITING' && (
          <SecretWritingModal
            blackCard={currentBlackCard}
            players={players}
            onCompleteAllSubmissions={handleCompleteAllSubmissions}
          />
        )}

        {phase === 'REVEAL' && (
          <RevealPhaseView
            blackCard={currentBlackCard}
            shuffledAnswers={shuffledAnswers}
            onCardFlipped={handleCardFlipped}
            onProceedToVoting={handleProceedToVoting}
          />
        )}

        {phase === 'VOTING' && (
          <VotingPhaseView
            blackCard={currentBlackCard}
            players={players}
            answers={shuffledAnswers}
            onCompleteAllVotes={handleCompleteAllVotes}
          />
        )}

        {phase === 'RESULTS' && (
          <ResultsPhaseView
            round={round}
            totalRounds={totalRounds}
            blackCard={currentBlackCard}
            players={players}
            answers={shuffledAnswers}
            onNextRound={handleNextRound}
            isLastRound={isLastRound}
          />
        )}

        {phase === 'FINAL_RESULTS' && (
          <FinalResultsView
            players={players}
            totalRoundsPlayed={round}
            onPlayAgain={handlePlayAgain}
            onBackToMenu={onBackToMenu}
          />
        )}
      </main>

      {/* Footer copyright / info */}
      <footer className="text-center text-[11px] text-stone-600 py-2 border-t border-stone-900/60 max-w-6xl mx-auto w-full">
        La Peor Respuesta &bull; &laquo;Cuanto peor, mejor&raquo; &bull; Fiesta de Juegos
      </footer>

      {/* Abandon Game Confirmation Modal */}
      <AbandonConfirmationModal
        isOpen={showAbandonModal}
        onConfirmAbandon={() => {
          setShowAbandonModal(false);
          onBackToMenu();
        }}
        onCancel={() => setShowAbandonModal(false)}
      />
    </div>
  );
};
