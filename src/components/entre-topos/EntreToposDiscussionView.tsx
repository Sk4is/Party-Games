import React, { useState } from 'react';
import { EntreToposRoomState } from '../../types/entreTopos';
import { MolePortrait } from './MolePortrait';
import { BlackboardView } from './BlackboardView';
import { NotebookPanel } from './NotebookPanel';
import { Clock, BookOpen, Vote, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { audio } from '../../utils/audio';

interface EntreToposDiscussionViewProps {
  roomState: EntreToposRoomState;
  localPlayerId: string;
  onCastVote: (targetPlayerId: string) => void;
}

export const EntreToposDiscussionView: React.FC<EntreToposDiscussionViewProps> = ({
  roomState,
  localPlayerId,
  onCastVote,
}) => {
  const [showNotebook, setShowNotebook] = useState(false);
  const localPlayer = roomState.players.find((p) => p.id === localPlayerId);
  const myRole = roomState.myRole || localPlayer?.role;
  const myVotedId = localPlayer?.votedPlayerId;
  const secondsLeft = roomState.timerSecondsRemaining ?? 60;

  const handleVote = (targetId: string) => {
    if (targetId === localPlayerId) return; // cannot vote for self
    audio.playTurnChange();
    onCastVote(targetId);
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-5 select-none animate-fade-in">
      {/* =========================================================================
          TOP BAR: TIMER + NOTEBOOK TOGGLE
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-[#1e1b18]/90 border-2 border-[#3d3229] backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-xl">
            🗣️
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-amber-200 uppercase tracking-wide font-display">
              CHARLA Y VOTACIÓN &bull; ¿QUIÉN ES EL TOPO?
            </h2>
            <p className="text-xs text-amber-400/80 font-medium">
              Analiza las pizarras, debate con los demás y vota al infiltrado
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle 16-word notebook button */}
          <button
            type="button"
            onClick={() => setShowNotebook((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#2b241e] hover:bg-[#3d3229] border border-amber-500/40 text-amber-300 font-bold text-xs uppercase tracking-wider transition-all active:scale-95 cursor-pointer shadow"
          >
            <BookOpen className="w-4 h-4" />
            <span>{showNotebook ? 'Ocultar cuaderno' : 'Ver cuaderno (16 palabras)'}</span>
            {showNotebook ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {/* Discussion timer */}
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-mono font-black text-lg ${
              secondsLeft <= 15
                ? 'bg-rose-500/20 border-rose-500 text-rose-300 animate-pulse'
                : 'bg-amber-500/10 border-amber-400/50 text-amber-300'
            }`}
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>{secondsLeft}s</span>
          </div>
        </div>
      </div>

      {/* OPTIONAL EXPANDABLE NOTEBOOK ACCORDION */}
      {showNotebook && roomState.board && (
        <div className="p-4 sm:p-5 rounded-3xl bg-[#1e1b18]/90 border-2 border-[#3d3229] shadow-2xl animate-fade-in">
          <NotebookPanel board={roomState.board} role={myRole} />
        </div>
      )}

      {/* =========================================================================
          SUSPECT MOLES LINEUP (3 TO 10 PLAYERS WITH THEIR CHALKBOARDS)
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
        {roomState.players.map((p) => {
          const isMe = p.id === localPlayerId;
          const isVotedByMe = myVotedId === p.id;

          return (
            <div
              key={p.id}
              className={`relative p-4 rounded-3xl border-2 flex flex-col items-center justify-between transition-all duration-300 ${
                isVotedByMe
                  ? 'bg-amber-500/15 border-amber-400 ring-4 ring-amber-400/30 shadow-2xl scale-[1.02]'
                  : isMe
                  ? 'bg-[#1e1b18]/80 border-slate-700/60'
                  : 'bg-[#1e1b18]/90 border-[#3d3229] hover:border-amber-500/50'
              }`}
            >
              {/* Badge: YOU or VOTED */}
              <div className="w-full flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest truncate max-w-[120px]">
                  {p.name} {isMe && '(TÚ)'}
                </span>

                {p.hasVoted && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 font-mono">
                    <CheckCircle2 className="w-3 h-3" /> Voto listo
                  </span>
                )}
              </div>

              {/* Custom Mole portrait */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 relative my-1">
                <MolePortrait
                  customization={p.moleCustomization}
                  size="md"
                  expression={isVotedByMe ? 'guilty' : 'suspicious'}
                />
              </div>

              {/* The revealed clue blackboard */}
              <div className="w-full my-2">
                <BlackboardView
                  clue={p.clue}
                  isEditable={false}
                  isCompact={true}
                  className="w-full"
                />
              </div>

              {/* Voting button */}
              {!isMe && (
                <button
                  type="button"
                  onClick={() => handleVote(p.id)}
                  className={`w-full mt-2 py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow ${
                    isVotedByMe
                      ? 'bg-amber-500 text-slate-950 shadow-amber-500/30'
                      : 'bg-[#2b241e] hover:bg-[#3d3229] border border-white/10 text-slate-200 hover:text-white'
                  }`}
                >
                  <Vote className="w-3.5 h-3.5" />
                  <span>{isVotedByMe ? '¡VOTADO COMO TOPO!' : 'Votar sospechoso'}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* FOOTER TIP */}
      <div className="p-3.5 rounded-2xl bg-[#1e1b18]/60 border border-[#3d3229] text-center text-xs font-semibold text-slate-400">
        💡 Consejo: El topo no sabe qué palabra es la elegida. Busca pistas demasiado genéricas o que encajen con varias palabras a la vez.
      </div>
    </div>
  );
};
