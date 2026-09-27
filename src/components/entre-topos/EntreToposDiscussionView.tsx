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
          SUSPECT MOLES LINEUP (3 TO 10 PLAYERS WITH THEIR WHITE CLUE BOARDS)
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 items-stretch">
        {roomState.players.map((p) => {
          const isMe = p.id === localPlayerId;
          const isVotedByMe = myVotedId === p.id;

          return (
            <div
              key={p.id}
              role={!isMe ? 'button' : undefined}
              tabIndex={!isMe ? 0 : undefined}
              aria-pressed={!isMe ? isVotedByMe : undefined}
              onClick={() => {
                if (!isMe) handleVote(p.id);
              }}
              onKeyDown={(e) => {
                if (!isMe && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  handleVote(p.id);
                }
              }}
              className={`group relative p-4 sm:p-5 rounded-3xl border-2 flex flex-col items-center justify-between h-full min-h-[290px] transition-all duration-200 ${
                isVotedByMe
                  ? 'bg-amber-500/20 border-amber-400 ring-4 ring-amber-400/30 shadow-2xl scale-[1.02] cursor-pointer'
                  : isMe
                  ? 'bg-[#1e1b18]/90 border-[#3d3229] cursor-default'
                  : 'bg-[#1e1b18]/90 border-[#3d3229] hover:border-amber-400/80 hover:bg-[#27221d] hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98] cursor-pointer'
              }`}
            >
              {/* TOP HEADER ROW: Fixed height for uniform alignment */}
              <div className="w-full h-6 flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs font-mono font-black text-amber-300 uppercase tracking-wider truncate">
                    {p.name}
                  </span>
                  {isMe && (
                    <span className="shrink-0 px-1.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-400/40 text-[10px] font-mono font-black text-amber-300 uppercase">
                      TÚ
                    </span>
                  )}
                </div>

                <div className="shrink-0 flex items-center gap-1.5">
                  {isVotedByMe && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow">
                      ✓ Sospechoso
                    </span>
                  )}
                  {p.hasVoted && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Listo</span>
                    </span>
                  )}
                </div>
              </div>

              {/* MIDDLE: Custom Mole portrait (Fixed box so cards never shift) */}
              <div className="w-28 h-28 flex items-center justify-center my-1 shrink-0">
                <MolePortrait
                  customization={p.moleCustomization}
                  size="md"
                  expression={isVotedByMe ? 'guilty' : 'suspicious'}
                />
              </div>

              {/* BOTTOM: The revealed clue board (White board with black text) */}
              <div className="w-full mt-2">
                <BlackboardView
                  clue={p.clue}
                  isEditable={false}
                  isCompact={true}
                  className="w-full"
                />
              </div>
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
